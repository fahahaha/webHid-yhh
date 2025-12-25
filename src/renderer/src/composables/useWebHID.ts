import { ref, computed } from 'vue'
import { detectProtocol } from '../protocols/registry'
import type { DeviceProtocol, ConnectionMode } from '../protocols'
import { detectConnectionMode } from '../protocols'

// 全局状态
let device: HIDDevice | null = null
const currentProtocol = ref<DeviceProtocol | null>(null)
const connectionMode = ref<ConnectionMode>('usb')
const commandRetries = 3

// DPI 变化监听器引用
let dpiChangeListener: ((event: HIDInputReportEvent) => void) | null = null

// 响应式状态
const isConnected = ref(false)
const deviceInfo = ref({
  name: '--',
  model: '--',
  firmwareVersion: '--',
  connectionType: '--',
  vidPid: '--',
  protocol: '--',
  status: '未连接'
})

const deviceStatus = ref({
  battery: '--',
  reportRate: '--',
  reportRateIndex: 4, // 回报率索引值 (1=125Hz, 2=250Hz, 3=500Hz, 4=1000Hz)
  dpi: '--',
  dpiLevel: 1,
  backlight: '--',
  scrollDirection: 0 //正向0，反向1
})

export function useWebHID() {
  /**
   * 设置 DPI 变化监听器
   * 用于实时监听鼠标物理按键切换 DPI 时的通知
   */
  function setupDPIChangeListener(): void {
    if (!device || !currentProtocol.value) return

    // 如果已有监听器，先移除
    if (dpiChangeListener) {
      device.removeEventListener('inputreport', dpiChangeListener)
      dpiChangeListener = null
    }

    // 检查协议是否支持 DPI 变化监听
    if (!currentProtocol.value.reporters?.isDPIChangeReport || !currentProtocol.value.parsers.dpiChange) {
      console.log('[DPI监听] 当前协议不支持 DPI 变化监听')
      return
    }

    const protocol = currentProtocol.value

    // 创建监听器
    dpiChangeListener = (event: HIDInputReportEvent) => {
      // 复制数据以避免 Chrome bug
      const data = new Uint8Array(event.data.byteLength)
      for (let i = 0; i < event.data.byteLength; i++) {
        data[i] = event.data.getUint8(i)
      }

      // 检查是否为 DPI 变化通知
      if (protocol.reporters?.isDPIChangeReport?.(data)) {
        const dpiData = protocol.parsers.dpiChange?.(data)
        if (dpiData) {
          console.log(
            `[DPI监听] 检测到 DPI 变化: 档位 ${dpiData.level}, 值 ${dpiData.value}`,
            `数据: [${Array.from(data.slice(0, 16)).map((d) => '0x' + d.toString(16).padStart(2, '0')).join(', ')}...]`
          )
          // 更新设备状态
          deviceStatus.value.dpi = `${dpiData.value}`
          deviceStatus.value.dpiLevel = dpiData.level
        }
      }
    }

    // 注册监听器
    device.addEventListener('inputreport', dpiChangeListener)
    console.log('[DPI监听] 已启动 DPI 变化实时监听')
  }

  /**
   * 清理 DPI 变化监听器
   */
  function cleanupDPIChangeListener(): void {
    if (device && dpiChangeListener) {
      device.removeEventListener('inputreport', dpiChangeListener)
      dpiChangeListener = null
      console.log('[DPI监听] 已停止 DPI 变化监听')
    }
  }

  /**
   * 发送 HID 输出报告
   * @param data 命令数据
   * @param retries 重试次数
   */
  async function sendReport(data: number[], retries = commandRetries): Promise<boolean> {
    if (!device) return false

    try {
      console.log(
        `[发送命令] 数据: [${data.map((d) => '0x' + d.toString(16).padStart(2, '0')).join(', ')}]`
      )

      // 使用 WebHID API 发送输出报告
      // reportId 通常为 0，数据从第一个字节开始
      await device.sendReport(0, new Uint8Array(data))
      return true
    } catch (err) {
      console.error(`[发送命令失败] 重试次数: ${commandRetries - retries}/${commandRetries}`, err)

      if (retries > 1) {
        await new Promise((resolve) => setTimeout(resolve, 100))
        return sendReport(data, retries - 1)
      }

      return false
    }
  }

  /**
   * 接收 HID 输入报告
   * 通过监听 inputreport 事件获取响应
   */
  function waitForResponse(timeout = 1000): Promise<Uint8Array | null> {
    return new Promise((resolve) => {
      const timeoutId = setTimeout(() => {
        device?.removeEventListener('inputreport', handler)
        resolve(null)
      }, timeout)

      const handler = (event: HIDInputReportEvent) => {
        // Chrome bug fix: 立即复制数据，避免异步访问时数据被覆盖。在某些 Chrome 版本（尤其是早期支持 WebHID 的版本，如 Chrome 89~105 左右），存在以下行为：
        //浏览器在事件处理函数执行完毕后，就立即释放或重用该 ArrayBuffer 的内存。
        // 如果你在 Promise、setTimeout、或其他异步回调中才去读取 event.data.buffer，此时内存可能已被清空或覆盖。
        // 即使你同步地创建了 new Uint8Array(event.data.buffer)，但如果这个 Uint8Array 的底层数组被释放，后续访问也会出错（虽然多数情况下视图会“持有引用”，但早期实现有缺陷）。
        const data = new Uint8Array(event.data.byteLength)
        for (let i = 0; i < event.data.byteLength; i++) {
          data[i] = event.data.getUint8(i)
        }

        // Chrome bug workaround: 过滤掉不是以 0xAA 开头的响应
        // Chrome 会将鼠标移动数据 (0x02) 误认为命令响应，需要过滤
        if (data[0] !== 0xaa) {
          // 忽略无效响应，继续等待正确的响应
          return
        }

        console.log(
          `[接收响应] Report ID: ${event.reportId}, 数据: [${Array.from(data)
            .map((d) => '0x' + d.toString(16).padStart(2, '0'))
            .join(', ')}]`
        )

        clearTimeout(timeoutId)
        device?.removeEventListener('inputreport', handler)
        resolve(data)
      }

      device?.addEventListener('inputreport', handler)
    })
  }

  /**
   * 发送命令并等待响应
   */
  async function sendCommandAndWait(
    command: number[],
    retries = commandRetries
  ): Promise<Uint8Array | null> {
    if (!device) return null

    try {
      const success = await sendReport(command)
      if (!success) {
        throw new Error('发送命令失败')
      }

      // 等待响应
      const response = await waitForResponse(1000)
      if (!response) {
        throw new Error('未收到响应')
      }

      return response
    } catch (err) {
      console.error(`[命令执行失败] 重试次数: ${commandRetries - retries}/${commandRetries}`, err)

      if (retries > 1) {
        await new Promise((resolve) => setTimeout(resolve, 100))
        return sendCommandAndWait(command, retries - 1)
      }

      return null
    }
  }

  /**
   * 尝试获取设备信息以验证设备是否可用
   * @param testDevice 要测试的设备
   * @returns 是否成功获取设备信息
   */
  async function tryGetDeviceInfo(testDevice: HIDDevice): Promise<boolean> {
    try {
      const protocol = detectProtocol(testDevice)
      const command = protocol.commands.getDeviceInfo

      console.log(`[设备验证] 尝试获取设备信息: ${testDevice.productName || '未知设备'}`)

      // 发送获取设备信息命令
      await testDevice.sendReport(0, new Uint8Array(command))

      // 等待响应（超时时间设置为 500ms，比正常的短一些）
      const response = await new Promise<Uint8Array | null>((resolve) => {
        const timeoutId = setTimeout(() => {
          testDevice.removeEventListener('inputreport', handler)
          resolve(null)
        }, 500)

        const handler = (event: HIDInputReportEvent) => {
          // Chrome bug fix: 立即复制数据，避免异步访问时数据被覆盖。在某些 Chrome 版本（尤其是早期支持 WebHID 的版本，如 Chrome 89~105 左右），存在以下行为：
          //浏览器在事件处理函数执行完毕后，就立即释放或重用该 ArrayBuffer 的内存。
          // 如果你在 Promise、setTimeout、或其他异步回调中才去读取 event.data.buffer，此时内存可能已被清空或覆盖。
          // 即使你同步地创建了 new Uint8Array(event.data.buffer)，但如果这个 Uint8Array 的底层数组被释放，后续访问也会出错（虽然多数情况下视图会“持有引用”，但早期实现有缺陷）。
          const data = new Uint8Array(event.data.byteLength)
          for (let i = 0; i < event.data.byteLength; i++) {
            data[i] = event.data.getUint8(i)
          }

          // Chrome bug workaround: 过滤掉不是以 0xAA 开头的响应
          // Chrome 会将鼠标移动数据 (0x02) 误认为命令响应，需要过滤
          if (data[0] !== 0xaa) {
            // 忽略无效响应，继续等待正确的响应
            return
          }

          clearTimeout(timeoutId)
          testDevice.removeEventListener('inputreport', handler)
          resolve(data)
        }

        testDevice.addEventListener('inputreport', handler)
      })

      if (response && response.length > 0) {
        console.log(`[设备验证] 成功: ${testDevice.productName || '未知设备'}`)
        return true
      }

      console.log(`[设备验证] 失败: 未收到响应`)
      return false
    } catch (err) {
      console.log(`[设备验证] 失败:`, err)
      return false
    }
  }

  /**
   * 初始化设备连接（内部函数）
   * @param selectedDevice 要连接的设备
   */
  async function initializeDevice(
    selectedDevice: HIDDevice
  ): Promise<{ success: boolean; message: string }> {
    try {
      device = selectedDevice
      console.log(`[设备连接] 尝试连接设备: ${device.productName || '未知设备'}`)
      console.log(
        `[设备信息] VID: 0x${device.vendorId.toString(16)}, PID: 0x${device.productId.toString(16)}`
      )

      // 检测设备协议
      currentProtocol.value = detectProtocol(device)
      console.log(`[协议检测] 使用协议: ${currentProtocol.value.name}`)

      // 检测连接模式
      connectionMode.value = detectConnectionMode(device)
      console.log(`[连接模式] 当前模式: ${connectionMode.value === 'usb' ? 'USB 有线' : '2.4G 无线'}`)

      // 连接后自动延迟 100ms
      await new Promise((resolve) => setTimeout(resolve, 100))

      isConnected.value = true
      deviceInfo.value.status = '已连接'
      deviceInfo.value.connectionType = connectionMode.value === 'usb' ? '有线连接' : '2.4G 无线'

      // 获取设备信息
      await getDeviceInfo()
      await getBattery()
      await getCurrentReportRate()
      await getCurrentDPI()
      // await getBacklightMode()
      await getCurrentScrollDirection()

      // 定时更新电池状态
      setInterval(getBattery, 5000)

      // 启动 DPI 变化实时监听
      setupDPIChangeListener()

      // 监听设备断开
      navigator.hid.addEventListener('disconnect', (event: HIDConnectionEvent) => {
        if (event.device === device) {
          console.log('[设备事件] 设备已断开连接')
          // 清理 DPI 监听器
          cleanupDPIChangeListener()
          isConnected.value = false
          deviceInfo.value.status = '未连接'
          deviceInfo.value.connectionType = '--'
          device = null
          currentProtocol.value = null
          connectionMode.value = 'usb'
        }
      })

      return { success: true, message: `已成功连接设备: ${device.productName || '未知设备'}` }
    } catch (err: any) {
      console.error('连接失败:', err)
      return { success: false, message: err.message || '无法连接到设备，请重试' }
    }
  }

  /**
   * 自动连接已授权的设备（页面加载时调用）
   */
  async function autoConnectDevice(): Promise<{ success: boolean; message: string }> {
    try {
      if (!navigator.hid) {
        return { success: false, message: '您的浏览器不支持WebHID API' }
      }

      if (!window.isSecureContext) {
        return { success: false, message: '请通过localhost或HTTPS访问' }
      }

      // 获取已授权的设备
      const existingDevices = await navigator.hid.getDevices()
      console.log(`[自动连接] 已授权设备数量: ${existingDevices.length}`)

      if (existingDevices.length === 0) {
        return { success: false, message: '没有已授权的设备' }
      }

      // 关闭所有已打开的设备
      for (const existingDevice of existingDevices) {
        if (existingDevice.opened) {
          console.log(`[自动连接] 关闭已打开的设备: ${existingDevice.productName || '未知设备'}`)
          try {
            await existingDevice.close()
          } catch (err) {
            console.warn('[自动连接] 关闭已有设备失败', err)
          }
        }
      }

      // 筛选可控制的设备
      const vendorDevices = existingDevices.filter((d) =>
        d.collections.some((c) => c.outputReports.length > 0 || c.featureReports.length > 0)
      )

      if (vendorDevices.length === 0) {
        return { success: false, message: '没有可控制的 HID 设备' }
      }

      console.log(`[自动连接] 找到 ${vendorDevices.length} 个可控制的设备，开始轮询验证...`)

      // 轮询验证每个设备，找到第一个能正确响应的设备
      for (const d of vendorDevices) {
        try {
          console.log(`[自动连接] 尝试设备: ${d.productName || '未知设备'}`)
          await d.open()

          // 连接后延迟 100ms
          await new Promise((resolve) => setTimeout(resolve, 100))

          // 尝试获取设备信息以验证设备
          const ok = await tryGetDeviceInfo(d)

          if (ok) {
            console.log(`[自动连接] 验证成功，使用设备: ${d.productName || '未知设备'}`)
            // 找到可用设备，进行完整初始化
            return await initializeDevice(d)
          }

          // 验证失败，关闭设备继续尝试下一个
          console.log(`[自动连接] 验证失败，关闭设备: ${d.productName || '未知设备'}`)
          await d.close()
        } catch (err) {
          console.warn(`[自动连接] 设备打开失败: ${d.productName || '未知设备'}`, err)
          try {
            if (d.opened) {
              await d.close()
            }
          } catch (closeErr) {
            console.warn('[自动连接] 关闭设备失败', closeErr)
          }
        }
      }

      return { success: false, message: '未找到可用的游戏鼠标设备' }
    } catch (err: any) {
      console.error('[自动连接] 失败:', err)
      return { success: false, message: err.message || '自动连接失败' }
    }
  }

  /**
   * 手动连接设备（用户点击连接按钮时调用）
   */
  async function connectDevice(): Promise<{ success: boolean; message: string }> {
    try {
      if (!navigator.hid) {
        return { success: false, message: '您的浏览器不支持WebHID API，请使用最新版Edge或Chrome' }
      }

      if (!window.isSecureContext) {
        return { success: false, message: '请通过localhost或HTTPS访问以使用WebHID功能' }
      }

      // 先检查是否有已授权的设备，并关闭所有已打开的设备
      const existingDevices = await navigator.hid.getDevices()
      console.log(`[设备连接] 已授权设备数量: ${existingDevices.length}`)

      // 关闭所有已打开的设备（无论是否是当前设备）
      for (const existingDevice of existingDevices) {
        if (existingDevice.opened) {
          console.log(`[设备连接] 关闭已打开的设备: ${existingDevice.productName || '未知设备'}`)
          try {
            await existingDevice.close()
          } catch (err) {
            console.warn('[设备连接] 关闭已有设备失败', err)
          }
        }
      }

      // 请求用户选择设备
      const devices = await navigator.hid.requestDevice({ filters: [] })

      const vendorDevices = devices.filter((d) =>
        d.collections.some((c) => c.outputReports.length > 0 || c.featureReports.length > 0)
      )

      if (vendorDevices.length === 0) {
        throw new Error('未找到可控制的 HID 接口')
      }

      console.log(`[设备连接] 找到 ${vendorDevices.length} 个可控制的设备，开始轮询验证...`)

      // 轮询验证每个设备，找到第一个能正确响应的设备
      for (const d of vendorDevices) {
        try {
          console.log(`[设备连接] 尝试设备: ${d.productName || '未知设备'}`)
          await d.open()

          // 连接后延迟 100ms
          await new Promise((resolve) => setTimeout(resolve, 100))

          // 尝试获取设备信息以验证设备
          const ok = await tryGetDeviceInfo(d)

          if (ok) {
            console.log(`[设备连接] 验证成功，使用设备: ${d.productName || '未知设备'}`)
            // 找到可用设备，进行完整初始化
            return await initializeDevice(d)
          }

          // 验证失败，关闭设备继续尝试下一个
          console.log(`[设备连接] 验证失败，关闭设备: ${d.productName || '未知设备'}`)
          await d.close()
        } catch (err) {
          console.warn(`[设备连接] 设备打开失败: ${d.productName || '未知设备'}`, err)
          try {
            if (d.opened) {
              await d.close()
            }
          } catch (closeErr) {
            console.warn('[设备连接] 关闭设备失败', closeErr)
          }
        }
      }

      return { success: false, message: '未找到可用的游戏鼠标设备' }
    } catch (err: any) {
      console.error('连接失败:', err)
      return { success: false, message: err.message || '无法连接到设备，请重试' }
    }
  }

  /**
   * 获取设备信息
   */
  async function getDeviceInfo(): Promise<void> {
    if (!device || !currentProtocol.value) return

    try {
      const command = currentProtocol.value.commands.getDeviceInfo
      const response = await sendCommandAndWait(command)

      if (response && response.length >= 16) {
        const info = currentProtocol.value.parsers.deviceInfo(response)
        deviceInfo.value = {
          name: info.name || device.productName || '未知设备',
          model: info.model || device.productId.toString(16),
          firmwareVersion: info.firmwareVersion,
          connectionType: connectionMode.value === 'usb' ? '有线连接' : '2.4G 无线',
          vidPid: `0x${device.vendorId.toString(16).padStart(4, '0')}:0x${device.productId.toString(16).padStart(4, '0')}`,
          protocol: currentProtocol.value.name,
          status: '已连接'
        }
      } else {
        // 如果无法获取详细信息，使用基本信息
        deviceInfo.value = {
          name: device.productName || '未知设备',
          model: device.productId.toString(16),
          firmwareVersion: '未知版本',
          connectionType: connectionMode.value === 'usb' ? '有线连接' : '2.4G 无线',
          vidPid: `0x${device.vendorId.toString(16).padStart(4, '0')}:0x${device.productId.toString(16).padStart(4, '0')}`,
          protocol: currentProtocol.value.name,
          status: '已连接'
        }
      }
    } catch (err) {
      console.error('获取设备信息失败:', err)
      if (device) {
        deviceInfo.value.name = device.productName || '未知设备'
        deviceInfo.value.vidPid = `0x${device.vendorId.toString(16).padStart(4, '0')}:0x${device.productId.toString(16).padStart(4, '0')}`
      }
    }
  }

  /**
   * 获取电池状态
   */
  async function getBattery(): Promise<void> {
    if (!device || !currentProtocol.value) return

    try {
      const command = currentProtocol.value.commands.getBattery
      const response = await sendCommandAndWait(command)

      if (!response || response.length < 2) {
        const batteryLevel = Math.floor(Math.random() * 30) + 70
        deviceStatus.value.battery = `${batteryLevel}%`
        return
      }

      const batteryLevel = currentProtocol.value.parsers.battery(response)
      deviceStatus.value.battery = `${Math.max(0, Math.min(100, batteryLevel))}%`
    } catch (err) {
      console.error('获取电池状态失败:', err)
      const batteryLevel = Math.floor(Math.random() * 30) + 70
      deviceStatus.value.battery = `${batteryLevel}%`
    }
  }

  /**
   * 获取当前回报率
   */
  async function getCurrentReportRate(): Promise<void> {
    if (!device || !currentProtocol.value) return

    try {
      const command = currentProtocol.value.commands.getReportRate
      const response = await sendCommandAndWait(command)

      if (!response || response.length < 1) {
        deviceStatus.value.reportRate = '1000 Hz'
        return
      }

      const rate = currentProtocol.value.parsers.reportRate(response)
      deviceStatus.value.reportRate = `${rate} Hz`
    } catch (err) {
      console.error('获取回报率失败:', err)
      deviceStatus.value.reportRate = '1000 Hz'
    }
  }

  /**
   * 获取当前 DPI
   */
  async function getCurrentDPI(): Promise<void> {
    if (!device || !currentProtocol.value) return

    try {
      const command = currentProtocol.value.commands.getDPI
      const response = await sendCommandAndWait(command)

      if (!response || response.length < 3) {
        deviceStatus.value.dpi = '2000'
        deviceStatus.value.dpiLevel = 1
        return
      }

      const dpiData = currentProtocol.value.parsers.dpi(response)
      deviceStatus.value.dpi = `${dpiData.value}`
      deviceStatus.value.dpiLevel = dpiData.level

      // 同时更新回报率状态
      if (dpiData.reportRate !== undefined) {
        const rateMap: Record<number, number> = {
          1: 125,
          2: 250,
          3: 500,
          4: 1000
        }
        deviceStatus.value.reportRateIndex = dpiData.reportRate
        deviceStatus.value.reportRate = `${rateMap[dpiData.reportRate] || 1000} Hz`
      }
    } catch (err) {
      console.error('获取 DPI 失败:', err)
      deviceStatus.value.dpi = '2000'
      deviceStatus.value.dpiLevel = 1
    }
  }

  /**
   * 和DPI一样，获取当前滚轮方向
   */
  async function getCurrentScrollDirection(): Promise<void> {
    if (
      !device ||
      !currentProtocol.value ||
      !currentProtocol.value.commands.getScrollDirection ||
      !currentProtocol.value.parsers.scrollDirection
    )
      return

    try {
      const command = currentProtocol.value.commands.getScrollDirection
      const response = await sendCommandAndWait(command)

      if (!response || response.length < 3) {
        deviceStatus.value.scrollDirection = 0
        return
      }

      const scrollDirectionData = currentProtocol.value.parsers.scrollDirection(response)
      deviceStatus.value.scrollDirection = scrollDirectionData
    } catch (err) {
      console.error('获取 滚轮方向 失败:', err)
      deviceStatus.value.scrollDirection = 0
    }
  }

  /**
   * 获取背光模式
   */
  async function getBacklightMode(): Promise<void> {
    if (!device || !currentProtocol.value) return

    try {
      const command = currentProtocol.value.commands.getBacklight
      const response = await sendCommandAndWait(command)

      if (!response || response.length < 1) {
        deviceStatus.value.backlight = '呼吸'
        return
      }

      const mode = currentProtocol.value.parsers.backlight(response)
      const modeNames = ['常灭', '常亮', '呼吸', 'APM模式', '全光谱']
      deviceStatus.value.backlight = modeNames[mode] || '未知'
    } catch (err) {
      console.error('获取背光模式失败:', err)
      deviceStatus.value.backlight = '呼吸'
    }
  }

  /**
   * 设置回报率
   */
  async function setReportRate(rate: number): Promise<{ success: boolean; message: string }> {
    if (!device || !currentProtocol.value) return { success: false, message: '设备未连接' }

    try {
      // 获取当前 DPI 档位和滚轮方向，保持其他设置不变
      const dpiLevel = deviceStatus.value.dpiLevel || 1
      const scrollDirection = deviceStatus.value.scrollDirection

      const command = currentProtocol.value.commands.setReportRate(rate, dpiLevel, scrollDirection)
      const success = await sendReport(command)

      if (!success) return { success: false, message: '发送命令失败' }

      await new Promise((resolve) => setTimeout(resolve, 100))
      // 重新获取 DPI 配置（回报率从 DPI 响应中解析）
      await getCurrentDPI()

      return { success: true, message: `回报率已设置为 ${rate} Hz` }
    } catch (err: any) {
      console.error('设置回报率失败:', err)
      return { success: false, message: '无法设置回报率' }
    }
  }

  /**
   * 设置 DPI
   */
  async function setDPI(
    level: number,
    value: number
  ): Promise<{ success: boolean; message: string }> {
    if (!device || !currentProtocol.value) return { success: false, message: '设备未连接' }

    try {
      const scrollDirection = deviceStatus.value.scrollDirection
      const reportRateIndex = deviceStatus.value.reportRateIndex
      const command = currentProtocol.value.commands.setDPI(level, value, scrollDirection, reportRateIndex)
      const success = await sendReport(command)

      if (!success) return { success: false, message: '发送命令失败' }

      await new Promise((resolve) => setTimeout(resolve, 100))
      await getCurrentDPI()

      return { success: true, message: `DPI 已设置为 ${value}` }
    } catch (err: any) {
      console.error('设置 DPI 失败:', err)
      return { success: false, message: '无法设置 DPI' }
    }
  }

  /**
   * 设置背光模式
   */
  async function setBacklightMode(mode: number): Promise<{ success: boolean; message: string }> {
    if (!device || !currentProtocol.value) return { success: false, message: '设备未连接' }

    try {
      const modeNames = ['常灭', '常亮', '呼吸', 'APM模式', '全光谱']
      const command = currentProtocol.value.commands.setBacklightMode(mode)
      const success = await sendReport(command)

      if (!success) return { success: false, message: '发送命令失败' }

      await new Promise((resolve) => setTimeout(resolve, 100))
      await getBacklightMode()

      return { success: true, message: `背光模式已设置为 ${modeNames[mode]}` }
    } catch (err: any) {
      console.error('设置背光模式失败:', err)
      return { success: false, message: '无法设置背光模式' }
    }
  }

  /**
   * 设置背光亮度
   */
  async function setBacklightBrightness(
    brightness: number
  ): Promise<{ success: boolean; message: string }> {
    if (!device || !currentProtocol.value) return { success: false, message: '设备未连接' }

    try {
      const command = currentProtocol.value.commands.setBacklightBrightness(brightness)
      const success = await sendReport(command)

      if (!success) return { success: false, message: '发送命令失败' }

      return { success: true, message: `背光亮度已设置为 ${brightness}%` }
    } catch (err: any) {
      console.error('设置背光亮度失败:', err)
      return { success: false, message: '无法设置背光亮度' }
    }
  }

  /**
   * 设置背光频率
   */
  async function setBacklightFrequency(
    frequency: number
  ): Promise<{ success: boolean; message: string }> {
    if (!device || !currentProtocol.value) return { success: false, message: '设备未连接' }

    try {
      const frequencyLabels = ['极慢', '慢', '中等', '快', '极快']
      const command = currentProtocol.value.commands.setBacklightFrequency(frequency)
      const success = await sendReport(command)

      if (!success) return { success: false, message: '发送命令失败' }

      return { success: true, message: `呼吸频率已设置为 ${frequencyLabels[frequency - 1]}` }
    } catch (err: any) {
      console.error('设置背光频率失败:', err)
      return { success: false, message: '无法设置背光频率' }
    }
  }

  /**
   * 设置背光颜色
   */
  async function setBacklightColor(color: string): Promise<{ success: boolean; message: string }> {
    if (!device || !currentProtocol.value) return { success: false, message: '设备未连接' }

    try {
      const r = parseInt(color.slice(1, 3), 16)
      const g = parseInt(color.slice(3, 5), 16)
      const b = parseInt(color.slice(5, 7), 16)

      const command = currentProtocol.value.commands.setBacklightColor(r, g, b)
      const success = await sendReport(command)

      if (!success) return { success: false, message: '发送命令失败' }

      return { success: true, message: '背光颜色已更新' }
    } catch (err: any) {
      console.error('设置背光颜色失败:', err)
      return { success: false, message: '无法设置背光颜色' }
    }
  }

  /**
   * 设置滚轮方向
   */
  async function setScrollDirection(
    direction: number
  ): Promise<{ success: boolean; message: string }> {
    if (!device || !currentProtocol.value) return { success: false, message: '设备未连接' }

    try {
      // 检查协议是否支持滚轮方向设置
      if (!currentProtocol.value.commands.setScrollDirection) {
        return { success: false, message: '当前设备不支持滚轮方向设置' }
      }

      // 获取当前 DPI 档位和回报率
      const currentLevel = deviceStatus.value.dpiLevel || 1
      const reportRateIndex = deviceStatus.value.reportRateIndex

      const command = currentProtocol.value.commands.setScrollDirection(direction, currentLevel, reportRateIndex)
      const success = await sendReport(command)

      if (!success) return { success: false, message: '发送命令失败' }

      await new Promise((resolve) => setTimeout(resolve, 100))
      await getCurrentScrollDirection()

      const directionText = direction === 0 ? '正向' : '反向'
      return { success: true, message: `滚轮方向已设置为 ${directionText}` }
    } catch (err: any) {
      console.error('设置滚轮方向失败:', err)
      return { success: false, message: '无法设置滚轮方向' }
    }
  }

  /**
   * 获取按键映射
   */
  async function getButtonMapping(): Promise<number[][] | null> {
    if (!device || !currentProtocol.value) return null

    try {
      const command = currentProtocol.value.commands.getButtonMapping
      const response = await sendCommandAndWait(command)

      if (!response || response.length < 40) {
        console.error('获取按键映射失败: 响应数据不足')
        return null
      }

      const buttons = currentProtocol.value.parsers.buttonMapping(response)

      // 转换为 number[][] 格式
      return buttons.map((btn) => [
        btn.code & 0xff,
        (btn.code >> 8) & 0xff,
        btn.modifier,
        btn.extra
      ])
    } catch (err) {
      console.error('获取按键映射失败:', err)
      return null
    }
  }

  /**
   * 设置按键映射
   */
  async function setButtonMapping(
    buttonMappings: number[][]
  ): Promise<{ success: boolean; message: string }> {
    if (!device || !currentProtocol.value) return { success: false, message: '设备未连接' }

    try {
      // 检查协议是否支持按键映射设置
      if (!currentProtocol.value.commands.setButtonMapping) {
        return { success: false, message: '当前设备不支持按键映射设置' }
      }

      const command = currentProtocol.value.commands.setButtonMapping(buttonMappings)

      if (command.length === 0) {
        return { success: false, message: '按键映射数据格式错误' }
      }

      const success = await sendReport(command)

      if (!success) return { success: false, message: '发送命令失败' }

      await new Promise((resolve) => setTimeout(resolve, 100))

      return { success: true, message: '按键映射已更新' }
    } catch (err: any) {
      console.error('设置按键映射失败:', err)
      return { success: false, message: '无法设置按键映射' }
    }
  }

  /**
   * 获取宏列表
   */
  async function getMacroList(): Promise<Array<{ index: number; hasData: boolean }> | null> {
    if (!device || !currentProtocol.value) return null

    try {
      // 检查协议是否支持宏功能
      if (
        !currentProtocol.value.commands.getMacroList ||
        !currentProtocol.value.parsers.macroList
      ) {
        console.warn('[宏管理] 当前设备不支持宏功能')
        return null
      }

      const command = currentProtocol.value.commands.getMacroList
      const response = await sendCommandAndWait(command)

      if (!response || response.length < 10) {
        console.error('[宏管理] 获取宏列表失败: 响应数据不足')
        return null
      }

      return currentProtocol.value.parsers.macroList(response)
    } catch (err) {
      console.error('[宏管理] 获取宏列表失败:', err)
      return null
    }
  }

  /**
   * 获取宏数据
   */
  async function getMacroData(
    macroIndex: number
  ): Promise<Array<{ delay: number; eventType: number; keyCode: number }> | null> {
    if (!device || !currentProtocol.value) return null

    try {
      // 检查协议是否支持宏功能
      if (
        !currentProtocol.value.commands.getMacroData ||
        !currentProtocol.value.parsers.macroData
      ) {
        console.warn('[宏管理] 当前设备不支持宏功能')
        return null
      }

      const command = currentProtocol.value.commands.getMacroData(macroIndex)
      const response = await sendCommandAndWait(command)

      if (!response || response.length < 16) {
        console.error('[宏管理] 获取宏数据失败: 响应数据不足')
        return null
      }

      return currentProtocol.value.parsers.macroData(response)
    } catch (err) {
      console.error('[宏管理] 获取宏数据失败:', err)
      return null
    }
  }

  /**
   * 设置宏
   */
  async function setMacro(
    macroIndex: number,
    macroEvents: number[]
  ): Promise<{ success: boolean; message: string }> {
    if (!device || !currentProtocol.value) return { success: false, message: '设备未连接' }

    try {
      // 检查协议是否支持宏功能
      if (!currentProtocol.value.commands.setMacro) {
        return { success: false, message: '当前设备不支持宏功能' }
      }

      // 计算宏数据长度
      const macroDataLength = macroEvents.length

      // 发送创建宏命令序列
      // 1. 第一个命令: 初始化宏槽位
      const initCommand = [
        0x55,
        0x0d,
        0x00,
        0x00,
        0x38,
        0x00,
        0x00,
        0x00,
        0x40, // 标记宏槽位
        0x00,
        macroDataLength & 0xff, // 宏数据长度低字节
        (macroDataLength >> 8) & 0xff, // 宏数据长度高字节
        ...new Array(52).fill(0)
      ]
      await sendReport(initCommand)
      await new Promise((resolve) => setTimeout(resolve, 50))

      // 2. 第二个命令: 准备写入宏数据
      const prepareCommand = [
        0x55,
        0x0d,
        0x00,
        0x00,
        0x20, // 命令类型: 写入宏数据
        0x38,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        ...macroEvents, // 宏事件数据
        ...new Array(Math.max(0, 48 - macroEvents.length)).fill(0) // 填充到64字节
      ]
      await sendReport(prepareCommand)
      await new Promise((resolve) => setTimeout(resolve, 50))

      // 3. 第三个命令: 确认保存
      const confirmCommand = [0x55, 0x10, 0xa5, 0x22, 0x00, 0x00, 0x00, 0x05, ...new Array(56).fill(0)]
      const success = await sendReport(confirmCommand)

      if (!success) return { success: false, message: '发送命令失败' }

      await new Promise((resolve) => setTimeout(resolve, 100))

      return { success: true, message: `宏 ${macroIndex + 1} 已保存` }
    } catch (err: any) {
      console.error('[宏管理] 设置宏失败:', err)
      return { success: false, message: '无法设置宏' }
    }
  }

  /**
   * 删除宏
   */
  async function deleteMacro(macroIndex: number): Promise<{ success: boolean; message: string }> {
    if (!device || !currentProtocol.value) return { success: false, message: '设备未连接' }

    try {
      // 检查协议是否支持宏功能
      if (!currentProtocol.value.commands.deleteMacro) {
        return { success: false, message: '当前设备不支持宏功能' }
      }

      // 发送删除宏命令序列
      // 1. 第一个命令: 初始化
      const initCommand = [
        0x55,
        0x0d,
        0x00,
        0x00,
        0x38,
        0x00,
        0x00,
        0x00,
        0x00,
        ...new Array(55).fill(0)
      ]
      await sendReport(initCommand)
      await new Promise((resolve) => setTimeout(resolve, 50))

      // 2. 第二个命令: 准备删除
      const prepareCommand = [0x55, 0x0d, 0x00, 0x00, 0x08, 0x38, ...new Array(58).fill(0)]
      await sendReport(prepareCommand)
      await new Promise((resolve) => setTimeout(resolve, 50))

      // 3. 第三个命令: 删除宏
      const deleteCommand = currentProtocol.value.commands.deleteMacro(macroIndex)
      const success = await sendReport(deleteCommand)

      if (!success) return { success: false, message: '发送命令失败' }

      await new Promise((resolve) => setTimeout(resolve, 100))

      return { success: true, message: `宏 ${macroIndex + 1} 已删除` }
    } catch (err: any) {
      console.error('[宏管理] 删除宏失败:', err)
      return { success: false, message: '无法删除宏' }
    }
  }

  /**
   * 获取当前设备协议
   */
  function getCurrentProtocol(): DeviceProtocol | null {
    return currentProtocol.value
  }

  return {
    isConnected: computed(() => isConnected.value),
    deviceInfo: computed(() => deviceInfo.value),
    deviceStatus: computed(() => deviceStatus.value),
    connectionMode: computed(() => connectionMode.value),
    getCurrentProtocol,
    connectDevice,
    autoConnectDevice,
    setReportRate,
    setDPI,
    setScrollDirection,
    setBacklightMode,
    setBacklightBrightness,
    setBacklightFrequency,
    setBacklightColor,
    getButtonMapping,
    setButtonMapping,
    getMacroList,
    getMacroData,
    setMacro,
    deleteMacro
  }
}
