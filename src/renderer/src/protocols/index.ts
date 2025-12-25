/**
 * 设备协议接口定义
 * 每个设备品牌需要实现此接口
 */
export interface DeviceProtocol {
  /** 协议名称 */
  name: string

  /** 设备识别函数 */
  identify: (device: HIDDevice) => boolean

  /** 命令定义 */
  commands: {
    /** 获取设备信息命令 */
    getDeviceInfo: number[]
    /** 获取电池状态命令 */
    getBattery: number[]
    /** 获取回报率命令 */
    getReportRate: number[]
    /** 获取 DPI 命令 */
    getDPI: number[]
    /** 获取背光模式命令 */
    getBacklight: number[]
    /** 获取按键映射命令 */
    getButtonMapping: number[]
    /** 获取 滚轮 命令 */
    getScrollDirection?: number[]
    /** 获取宏列表命令 */
    getMacroList?: number[]
    /** 获取宏数据命令 */
    getMacroData?: (macroIndex: number) => number[]

    /** 设置回报率 */
    setReportRate: (rate: number, dpiLevel?: number, scrollDirection?: number) => number[]
    /** 设置 DPI */
    setDPI: (level: number, value: number, scrollDirection?: number, reportRate?: number) => number[]
    /** 设置背光模式 */
    setBacklightMode: (mode: number) => number[]
    /** 设置背光亮度 */
    setBacklightBrightness: (brightness: number) => number[]
    /** 设置背光频率 */
    setBacklightFrequency: (frequency: number) => number[]
    /** 设置背光颜色 */
    setBacklightColor: (r: number, g: number, b: number) => number[]
    /** 设置滚轮方向 */
    setScrollDirection?: (direction: number, currentLevel: number, reportRate?: number) => number[]
    /** 设置按键映射 */
    setButtonMapping?: (buttonMappings: number[][]) => number[]
    /** 创建/更新宏 */
    setMacro?: (macroIndex: number, macroEvents: number[]) => number[]
    /** 删除宏 */
    deleteMacro?: (macroIndex: number) => number[]
  }

  /** 响应解析器 */
  parsers: {
    /** 解析设备信息 */
    deviceInfo: (response: Uint8Array) => {
      name: string
      model: string
      firmwareVersion: string
    }
    /** 解析电池电量 */
    battery: (response: Uint8Array) => number
    /** 解析回报率 */
    reportRate: (response: Uint8Array) => number
    /** 解析 DPI (返回当前 DPI 值、档位和回报率) */
    dpi: (response: Uint8Array) => {
      value: number
      level: number
      reportRate?: number
    }
    /** 解析背光模式 */
    backlight: (response: Uint8Array) => number
    /** 解析按键映射 */
    buttonMapping: (response: Uint8Array) => Array<{
      index: number
      code: number
      modifier: number
      extra: number
    }>
    /** 解析滚轮方向 */
    scrollDirection?: (response: Uint8Array) => number
    /** 解析宏列表 */
    macroList?: (response: Uint8Array) => Array<{
      index: number
      hasData: boolean
    }>
    /** 解析宏数据 */
    macroData?: (response: Uint8Array) => Array<{
      delay: number
      eventType: number
      keyCode: number
    }>
    /** 解析 DPI 变化通知 (用于实时监听鼠标按键切换 DPI) */
    dpiChange?: (response: Uint8Array) => {
      value: number
      level: number
    } | null
  }

  /** 报文识别器 (可选) */
  reporters?: {
    /** 判断是否为 DPI 变化通知报文 */
    isDPIChangeReport?: (response: Uint8Array) => boolean
  }

  /** 设备特性配置 (可选) */
  features?: {
    /** 支持的 DPI 档位列表 */
    supportedDPI?: number[]
    /** 最大 DPI 档位数 */
    maxDPILevels?: number
    /** 支持的回报率列表 */
    supportedReportRates?: number[]
    /** 按键数量 */
    buttonCount?: number
    /** 是否支持 RGB 背光 */
    hasRGB?: boolean
    /** 是否有电池 */
    hasBattery?: boolean
    /** 是否支持板载内存 */
    hasOnboardMemory?: boolean
    /** 是否支持的滚轮方向 */
    hasScrollDirection?: boolean
    /** 是否支持宏功能 */
    hasMacro?: boolean
    /** 最大宏数量 */
    maxMacroCount?: number
    /** 是否支持双模式 (USB + 2.4G) */
    supportsDualMode?: boolean
  }
}

/** 连接模式类型 */
export type ConnectionMode = 'usb' | '2.4g'

/** 检测设备连接模式 */
export function detectConnectionMode(device: HIDDevice): ConnectionMode {
  const productName = device.productName?.toLowerCase() || ''
  // 通过产品名称判断：USB Receiver 表示 2.4G 无线模式
  if (productName.includes('receiver') || productName.includes('dongle')) {
    return '2.4g'
  }
  return 'usb'
}
