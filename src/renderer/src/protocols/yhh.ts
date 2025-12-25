import { DeviceProtocol } from './index'

/**
 * 银火狐 (YJX) 鼠标设备协议
 * 设备信息: VID: A8A4, PID: 2255
 * 固件版本: 1.0.6
 *
 * 协议特征:
 * - 发送包头: 0x55
 * - 接收包头: 0xAA
 * - ReportID: 0 (数据从第 0 位开始)
 * - 校验和: 位于第 3 位
 */
export const yhhProtocol: DeviceProtocol = {
  name: 'YJX Mouse',

  identify: (device: HIDDevice) => {
    const productName = device.productName?.toLowerCase() || ''
    // 支持多种产品名称识别
    // USB 模式: "USB MOUSE"
    // 2.4G 模式: "USB Receiver"
    return (
      productName.includes('usb mouse') ||
      productName.includes('usb receiver') ||
      productName.includes('yjx') ||
      productName.includes('yhh')
    )
  },

  commands: {
    // 获取设备信息 (固件版本、设备名称、编译日期)
    // 发送: [0x55, 0x03, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, ...]
    // 返回: [0xAA, 0x03, 0x00, 0x20, 0x38, ..., "YJX.co.mouse", "1.0.6", "Dec 30 2024..."]
    getDeviceInfo: [0x55, 0x03, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, ...new Array(56).fill(0)],

    // 获取配置信息 (包含电池状态等)
    // 发送: [0x55, 0x30, 0xA5, 0x0B, 0x2E, 0x01, 0x01, 0x00, ...]
    // 返回: [0xAA, 0x30, 0xA5, 0x71, 0x0A, 0x01, 0x01, 0x00, 0x64(100), ...]
    getBattery: [0x55, 0x30, 0xa5, 0x0b, 0x2e, 0x01, 0x01, 0x00, ...new Array(56).fill(0)],

    // 获取在线状态
    // 发送: [0x55, 0xED, 0x00, 0x01, 0x2E, 0x00, 0x00, 0x00, ...]
    // 返回: [0xAA, 0xED, 0x00, 0x2E, 0x2E, ...]
    getReportRate: [0x55, 0xed, 0x00, 0x01, 0x2e, 0x00, 0x00, 0x00, ...new Array(56).fill(0)],

    // 获取 DPI 配置 (支持 6 档: 1000, 1400, 2000, 3200, 6400, 12800)
    // 发送: [0x55, 0x0E, 0xA5, 0x0B, 0x2F, 0x01, 0x01, 0x00, ...]
    // 返回: [0xAA, 0x0E, 0xA5, 0x95, 0x2E, 0x01, 0x01, 0x00,
    //        0x00, 0x00,              // 档位0 (未使用)
    //        0x04, 0x06,              // DPI数量和标志
    //        0x03,                    // 当前档位索引 (从1开始)
    //        0xE8, 0x03,              // 档位1: 1000 DPI
    //        0x78, 0x05,              // 档位2: 1400 DPI
    //        0xD0, 0x07,              // 档位3: 2000 DPI
    //        0x80, 0x0C,              // 档位4: 3200 DPI
    //        0x00, 0x19,              // 档位5: 6400 DPI
    //        0x00, 0x32,              // 档位6: 12800 DPI
    //        ...]
    getDPI: [0x55, 0x0e, 0xa5, 0x0b, 0x2f, 0x01, 0x01, 0x00, ...new Array(56).fill(0)],

    // 获取背光/传感器配置 (暂不支持)
    getBacklight: [],

    // 获取按键映射 (8 个按键)
    // 发送: [0x55, 0x08, 0xA5, 0x0B, 0x20, 0x00, 0x00, 0x00, ...]
    // 返回: [0xAA, 0x08, 0xA5, 0xF0, 0x20, ..., 按键映射数据]
    getButtonMapping: [0x55, 0x08, 0xa5, 0x0b, 0x20, 0x00, 0x00, 0x00, ...new Array(56).fill(0)],

    //和DPI一样
    getScrollDirection: [0x55, 0x0e, 0xa5, 0x0b, 0x2f, 0x01, 0x01, 0x00, ...new Array(56).fill(0)],

    // 获取宏列表
    // 发送: [0x55, 0x0D, 0x00, 0x00, 0x38, 0x00, 0x00, 0x00, 0x40, ...]
    // 返回: [0xAA, 0x0D, 0x00, 0x78, 0x38, 0x00, 0x00, 0x00, 0x40, ...]
    getMacroList: [0x55, 0x0d, 0x00, 0x00, 0x38, 0x00, 0x00, 0x00, 0x40, ...new Array(55).fill(0)],

    // 获取宏数据
    // 发送: [0x55, 0x0D, 0x00, 0x00, 0x30, 0x38, ...]
    // 返回: [0xAA, 0x0D, 0x00, 0x29, 0x30, 0x38, ..., 宏事件数据]
    getMacroData: (_macroIndex: number) => {
      return [0x55, 0x0d, 0x00, 0x00, 0x30, 0x38, ...new Array(58).fill(0)]
    },

    // 设置回报率
    // 回报率值映射: 1=125Hz, 2=250Hz, 3=500Hz, 4=1000Hz
    // 使用与 setDPI 相同的命令格式
    setReportRate: (rate: number, dpiLevel?: number, scrollDirection?: number) => {
      // 回报率值映射
      const rateMap: Record<number, number> = {
        125: 1,
        250: 2,
        500: 3,
        1000: 4
      }
      const rateValue = rateMap[rate] || 4 // 默认 1000Hz

      // 支持的DPI档位配置 (小端序)
      const dpiLevels = [
        0xe8,
        0x03, // 1000 DPI
        0x78,
        0x05, // 1400 DPI
        0xd0,
        0x07, // 2000 DPI
        0x80,
        0x0c, // 3200 DPI
        0x00,
        0x19, // 6400 DPI
        0x00,
        0x32 // 12800 DPI
      ]

      // 使用传入的 DPI 档位，默认为 1
      const currentLevel = dpiLevel !== undefined ? dpiLevel : 1

      // 滚轮方向: 0=正向, 1=反向 (默认为0)
      const wheelDirection = scrollDirection !== undefined ? scrollDirection : 0

      // 构建完整命令 (保持当前 DPI 档位和滚轮方向)
      const command = [
        0x55,
        0x0f,
        0xae,
        0x0a,
        0x2f,
        0x01,
        0x01,
        0x00,
        0x00,
        0x00, // 固定
        rateValue, // 回报率值 (1=125Hz, 2=250Hz, 3=500Hz, 4=1000Hz)
        0x06, // DPI标志
        currentLevel, // 当前档位索引 (使用传入的值)
        ...dpiLevels, // DPI配置数组
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00, // 填充
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
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        wheelDirection, // 滚轮方向 (使用传入的值)
        0x01,
        0x01,
        0x35,
        0x02,
        0x0a, // 固定尾部
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00
      ]

      return command
    },

    // 设置 DPI 档位
    // 命令: 0x0F (不是0x0E!)
    // 格式: [0x55, 0x0F, 0xAE, 0x0A, 0x2F, 0x01, 0x01, 0x00,
    //        0x00, 0x00,              // 固定
    //        回报率,                   // 回报率值 (1=125Hz, 2=250Hz, 3=500Hz, 4=1000Hz)
    //        0x06,                    // DPI标志位
    //        level,                   // 档位索引 (1-6)
    //        DPI配置数组...,          // 所有档位的DPI值
    //        滚轮方向, 0x01,          // 滚轮方向 (0=正向, 1=反向)
    //        0x35, 0x02, 0x0A, 0x00,  // 固定尾部
    //        ...]
    setDPI: (level: number, _value: number, scrollDirection?: number, reportRate?: number) => {
      // 支持的DPI档位配置 (小端序)
      const dpiLevels = [
        0xe8,
        0x03, // 1000 DPI
        0x78,
        0x05, // 1400 DPI
        0xd0,
        0x07, // 2000 DPI
        0x80,
        0x0c, // 3200 DPI
        0x00,
        0x19, // 6400 DPI
        0x00,
        0x32 // 12800 DPI
      ]

      // 滚轮方向: 0=正向, 1=反向 (默认为0)
      const wheelDirection = scrollDirection !== undefined ? scrollDirection : 0

      // 回报率值: 1=125Hz, 2=250Hz, 3=500Hz, 4=1000Hz (默认为4)
      const rateValue = reportRate !== undefined ? reportRate : 4

      // 构建完整命令
      const command = [
        0x55,
        0x0f,
        0xae,
        0x0a,
        0x2f,
        0x01,
        0x01,
        0x00,
        0x00,
        0x00, // 固定
        rateValue, // 回报率值
        0x06, // DPI标志
        level, // 档位索引 (1-6)
        ...dpiLevels, // DPI配置数组
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00, // 填充
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
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        wheelDirection, // 滚轮方向 (0=正向, 1=反向)
        0x01,
        0x01,
        0x35,
        0x02,
        0x0a, // 固定尾部
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00
      ]

      return command
    },

    // 设置滚轮方向
    // 使用与 setDPI 相同的命令格式,只修改滚轮方向位
    setScrollDirection: (direction: number, currentLevel: number, reportRate?: number) => {
      // 支持的DPI档位配置 (小端序)
      const dpiLevels = [
        0xe8,
        0x03, // 1000 DPI
        0x78,
        0x05, // 1400 DPI
        0xd0,
        0x07, // 2000 DPI
        0x80,
        0x0c, // 3200 DPI
        0x00,
        0x19, // 6400 DPI
        0x00,
        0x32 // 12800 DPI
      ]

      // 回报率值: 1=125Hz, 2=250Hz, 3=500Hz, 4=1000Hz (默认为4)
      const rateValue = reportRate !== undefined ? reportRate : 4

      // 构建完整命令
      const command = [
        0x55,
        0x0f,
        0xae,
        0x0a,
        0x2f,
        0x01,
        0x01,
        0x00,
        0x00,
        0x00, // 固定
        rateValue, // 回报率值
        0x06, // DPI标志
        currentLevel, // 当前档位索引 (1-6)
        ...dpiLevels, // DPI配置数组
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00, // 填充
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
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        direction, // 滚轮方向 (0=正向, 1=反向)
        0x01,
        0x01,
        0x35,
        0x02,
        0x0a, // 固定尾部
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00
      ]

      return command
    },

    // 设置背光模式 (暂不支持)
    setBacklightMode: (_mode: number) => [],

    // 设置背光亮度 (暂不支持)
    setBacklightBrightness: (_brightness: number) => [],

    // 设置背光频率 (暂不支持)
    setBacklightFrequency: (_frequency: number) => [],

    // 设置背光颜色 (暂不支持)
    setBacklightColor: (_r: number, _g: number, _b: number) => [],

    // 设置按键映射
    // 命令: 0x09
    // 格式: [0x55, 0x09, 0xA5, 0x22, 0x20, 0x00, 0x00, 0x00,
    //        按键1(4字节), 按键2(4字节), ..., 按键8(4字节),
    //        固定尾部...]
    // 参数: buttonMappings - 8个按键的映射数组，每个按键4字节
    setButtonMapping: (buttonMappings: number[][]) => {
      // 确保有8个按键配置
      if (buttonMappings.length !== 8) {
        console.error('按键映射必须包含8个按键')
        return []
      }

      // 构建命令
      const command = [0x55, 0x09, 0xa5, 0x22, 0x20, 0x00, 0x00, 0x00]

      // 添加8个按键的映射数据（每个4字节）
      for (const mapping of buttonMappings) {
        if (mapping.length !== 4) {
          console.error('每个按键映射必须是4字节')
          return []
        }
        command.push(...mapping)
      }

      // 填充到64字节
      while (command.length < 64) {
        command.push(0x00)
      }

      return command
    },

    // 设置宏
    // 命令序列:
    // 1. [0x55, 0x0D, 0x00, 0x00, 0x38, 0x00, 0x00, 0x00, 0x00, ...]
    // 2. [0x55, 0x0D, 0x00, 0x00, 0x08, 0x38, ...]
    // 3. [0x55, 0x0D, 0x00, 0x00, 0x20/0x30, 0x38, ..., 宏事件数据]
    setMacro: (_macroIndex: number, macroEvents: number[]) => {
      // 宏事件数据长度标识
      const dataLength = macroEvents.length <= 32 ? 0x20 : 0x30

      // 构建宏数据命令
      const command = [
        0x55,
        0x0d,
        0x00,
        0x00,
        dataLength,
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
        0x00
      ]

      // 添加宏事件数据
      command.push(...macroEvents)

      // 填充到64字节
      while (command.length < 64) {
        command.push(0x00)
      }

      return command
    },

    // 删除宏
    // 使用与创建宏相同的命令序列,但不包含宏事件数据
    deleteMacro: (_macroIndex: number) => {
      return [0x55, 0x0d, 0x00, 0x00, 0x38, 0x00, 0x00, 0x00, 0x00, ...new Array(55).fill(0)]
    }
  },

  parsers: {
    // 解析设备信息
    // 返回格式: [0xAA, 0x03, 0x00, 0x20, 0x38, 0x00, 0x00, 0x00,
    //            设备名称(ASCII), 版本号, 日期...]
    deviceInfo: (response: Uint8Array) => {
      // 跳过包头和命令字节 [0xAA, 0x03, 0x00, 0x20, 0x38, 0x00, 0x00, 0x00]
      const dataStart = 8

      // 提取设备名称 (ASCII 字符串，遇到 0xAA 或 0x00 结束)
      let nameEnd = dataStart
      while (
        nameEnd < response.length &&
        response[nameEnd] !== 0xaa &&
        response[nameEnd] !== 0x00
      ) {
        nameEnd++
      }
      const name =
        String.fromCharCode(...Array.from(response.slice(dataStart, nameEnd))) || 'YJX Mouse'

      // 查找版本号 (格式: "1.0.6")
      let versionStart = nameEnd + 1
      // 跳过可能的分隔符
      while (
        versionStart < response.length &&
        (response[versionStart] === 0xaa || response[versionStart] === 0x00)
      ) {
        versionStart++
      }

      // 提取版本号 (数字和点)
      let versionEnd = versionStart
      while (
        versionEnd < response.length &&
        ((response[versionEnd] >= 0x30 && response[versionEnd] <= 0x39) || // 数字
          response[versionEnd] === 0x2e)
      ) {
        // 点
        versionEnd++
      }
      const firmwareVersion =
        String.fromCharCode(...Array.from(response.slice(versionStart, versionEnd))) || '1.0.6'

      return {
        name,
        model: 'YJX Gaming Mouse',
        firmwareVersion
      }
    },

    // 解析电池/配置信息
    // 返回格式: [0xAA, 0x30, 0xA5, 0x71, 0x0A, 0x01, 0x01, 0x00, 0x64, ...]
    battery: (response: Uint8Array) => {
      // 第 8 位是百分比值 (0x64 = 100)
      return response[8] || 0
    },

    // 解析回报率 (待确认)
    reportRate: (response: Uint8Array) => {
      const rateMap: Record<number, number> = {
        0x01: 125,
        0x02: 250,
        0x04: 500,
        0x08: 1000
      }
      // 待确认数据位置
      return rateMap[response[4]] || 1000
    },

    // 解析 DPI 配置
    // 返回格式: [0xAA, 0x0E, 0xA5, 0x95, 0x2E, 0x01, 0x01, 0x00,
    //            0x00, 0x00,              // 档位 0 (未使用)
    //            0x04,                    // 回报率值 (1=125Hz, 2=250Hz, 3=500Hz, 4=1000Hz)
    //            0x06,                    // DPI标志位 (0x06 表示6个档位)
    //            0x03,                    // 当前档位索引 (从1开始)
    //            0xE8, 0x03,              // 档位1: 1000 DPI
    //            0x78, 0x05,              // 档位2: 1400 DPI
    //            0xD0, 0x07,              // 档位3: 2000 DPI
    //            0x80, 0x0C,              // 档位4: 3200 DPI
    //            0x00, 0x19,              // 档位5: 6400 DPI
    //            0x00, 0x32,              // 档位6: 12800 DPI
    //            ...]
    dpi: (response: Uint8Array) => {
      // 字节8-9: 档位0 (未使用)
      // 字节10: 回报率值 (1=125Hz, 2=250Hz, 3=500Hz, 4=1000Hz)
      // 字节11: DPI标志位 (0x06 表示6个档位)
      // 字节12: 当前DPI档位索引 (1-6)
      const reportRateIndex = response[10] || 4
      const currentLevel = response[12] || 1

      // DPI档位数据从第13位开始，每档2字节 (小端序)
      const dpiOffset = 13
      const dpiIndex = currentLevel - 1 // 转换为0-based索引

      // 读取当前档位的DPI值
      const dpiLow = response[dpiOffset + dpiIndex * 2]
      const dpiHigh = response[dpiOffset + dpiIndex * 2 + 1]
      const currentValue = dpiLow | (dpiHigh << 8)

      return {
        value: currentValue,
        level: currentLevel,
        reportRate: reportRateIndex
      }
    },

    // 解析背光配置
    // 返回格式: [0xAA, 0xFA, 0xA5, 0xDD, 0x38, 0x01, 0x01, 0x00,
    //            0xD0, 0x64, ...]
    backlight: (response: Uint8Array) => {
      // 第 9 位可能是亮度 (0x64 = 100)
      return response[9] || 0
    },

    // 解析按键映射
    // 返回格式: [0xAA, 0x08, 0xA5, 0xF0, 0x20, 0x00, 0x00, 0x00,
    //            0x20, 0x01, 0x00, 0x00,  // 按键 1 (4 字节)
    //            0x20, 0x02, 0x00, 0x00,  // 按键 2
    //            ...]
    buttonMapping: (response: Uint8Array) => {
      const buttons: Array<{
        index: number
        code: number
        modifier: number
        extra: number
      }> = []
      const dataStart = 8
      const buttonCount = 8

      for (let i = 0; i < buttonCount; i++) {
        const offset = dataStart + i * 4
        buttons.push({
          index: i + 1,
          code: response[offset] | (response[offset + 1] << 8),
          modifier: response[offset + 2],
          extra: response[offset + 3]
        })
      }
      return buttons
    },
    scrollDirection: (response: Uint8Array) => {
      //和DPI一样，只不过位于第4字节。 150为正向，151为方向
      const value = response[3]
      return (value === 148 || value === 150 )? 0 : 1
    },

    // 解析宏列表
    // 返回格式: [0xAA, 0x0D, 0x00, 0x78, 0x38, 0x00, 0x00, 0x00, 0x40, ...]
    macroList: (_response: Uint8Array) => {
      const macros: Array<{ index: number; hasData: boolean }> = []
      // 最多10个宏
      for (let i = 0; i < 10; i++) {
        macros.push({
          index: i,
          hasData: false // 需要进一步查询每个宏的数据来确定
        })
      }
      return macros
    },

    // 解析宏数据
    // 返回格式: [0xAA, 0x0D, 0x00, 0x8E, 0x20, 0x38, ..., 宏事件数据]
    // 宏事件格式: [延迟低, 延迟高, 事件类型, 按键码] (4字节一组)
    macroData: (response: Uint8Array) => {
      const events: Array<{ delay: number; eventType: number; keyCode: number }> = []
      const dataStart = 16 // 宏事件数据从第16字节开始

      // 解析宏事件 (每个事件4字节)
      for (let i = dataStart; i < response.length - 3; i += 4) {
        const delayLow = response[i]
        const delayHigh = response[i + 1]
        const eventType = response[i + 2]
        const keyCode = response[i + 3]

        // 如果遇到全0,表示宏事件结束
        if (delayLow === 0 && delayHigh === 0 && eventType === 0 && keyCode === 0) {
          break
        }

        // 计算延迟 (小端序)
        const delay = delayLow | (delayHigh << 8)

        events.push({
          delay,
          eventType,
          keyCode
        })
      }

      return events
    },

    // 解析 DPI 变化通知
    // 当鼠标物理按键切换 DPI 时，设备会发送此报文
    // 报文格式: [0xAA, 0xFA, 0x00, xx, 0x0A, 0x01, 0x01, 0x00, 0x10, level, ...]
    // 字节 9 是当前 DPI 档位 (1-6)
    // 示例:
    //   3200 (档位4): aa fa 00 92 0a 01 01 00 10 04 03...
    //   6400 (档位5): aa fa 00 60 0a 01 01 00 10 05 03...
    //   1000 (档位1): aa fa 00 21 0a 01 01 00 10 01 04...
    dpiChange: (response: Uint8Array) => {
      // 字节 9 是当前 DPI 档位
      const currentLevel = response[9] || 1

      // 根据档位获取对应的 DPI 值
      const dpiValues = [1000, 1400, 2000, 3200, 6400, 12800]
      const dpiIndex = currentLevel - 1

      if (dpiIndex >= 0 && dpiIndex < dpiValues.length) {
        return {
          value: dpiValues[dpiIndex],
          level: currentLevel
        }
      }

      return null
    }
  },

  // 报文识别器
  reporters: {
    // 判断是否为 DPI 变化通知报文
    // 报文特征: 以 0xAA 0xFA 开头
    isDPIChangeReport: (response: Uint8Array) => {
      return response.length >= 11 && response[0] === 0xaa && response[1] === 0xfa
    }
  },

  // 设备特性配置
  features: {
    supportedDPI: [1000, 1400, 2000, 3200, 6400, 12800], // 支持的 DPI 档位 (6档)
    maxDPILevels: 6, // 最大 DPI 档位数
    supportedReportRates: [125, 250, 500, 1000], // 支持 4 档回报率
    buttonCount: 8, // 按键数量
    hasRGB: false, // 暂不支持 RGB 背光
    hasBattery: false, // 有线鼠标，无电池
    hasOnboardMemory: true, // 支持板载内存
    hasScrollDirection: true, // 支持滚轮方向
    hasMacro: true, // 支持宏功能
    maxMacroCount: 10, // 最多10个宏
    supportsDualMode: true // 支持双模式 (USB + 2.4G)
  }
}
