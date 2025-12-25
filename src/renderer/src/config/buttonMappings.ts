/**
 * 按键映射配置
 * 用于鼠标按键自定义功能
 */

/**
 * 按键类型
 */
export enum ButtonType {
  MOUSE = 'mouse', // 鼠标功能
  MULTIMEDIA = 'multimedia', // 多媒体
  KEYBOARD = 'keyboard', // 键盘按键
  MACRO = 'macro' // 宏（暂不支持）
}

/**
 * 按键映射项
 */
export interface ButtonMapping {
  id: string
  name: string
  type: ButtonType
  code: number[] // 4字节编码
  category?: string // 分类（用于UI分组）
}

/**
 * 鼠标功能按键
 */
export const mouseButtons: ButtonMapping[] = [
  {
    id: 'left',
    name: '左键',
    type: ButtonType.MOUSE,
    code: [0x20, 0x01, 0x00, 0x00],
    category: '基础功能'
  },
  {
    id: 'right',
    name: '右键',
    type: ButtonType.MOUSE,
    code: [0x20, 0x02, 0x00, 0x00],
    category: '基础功能'
  },
  {
    id: 'middle',
    name: '中键',
    type: ButtonType.MOUSE,
    code: [0x20, 0x04, 0x00, 0x00],
    category: '基础功能'
  },
  {
    id: 'back',
    name: '后退',
    type: ButtonType.MOUSE,
    code: [0x20, 0x08, 0x00, 0x00],
    category: '基础功能'
  },
  {
    id: 'forward',
    name: '前进',
    type: ButtonType.MOUSE,
    code: [0x20, 0x10, 0x00, 0x00],
    category: '基础功能'
  },
  {
    id: 'scroll_up',
    name: '滚轮+',
    type: ButtonType.MOUSE,
    code: [0x21, 0x38, 0x01, 0x00],
    category: '滚轮'
  },
  {
    id: 'scroll_down',
    name: '滚轮-',
    type: ButtonType.MOUSE,
    code: [0x21, 0x38, 0xff, 0x00],
    category: '滚轮'
  },
  {
    id: 'dpi',
    name: 'DPI切换',
    type: ButtonType.MOUSE,
    code: [0x21, 0x55, 0x00, 0x00],
    category: '特殊功能'
  },
  {
    id: 'disabled',
    name: '禁用',
    type: ButtonType.MOUSE,
    code: [0x20, 0x00, 0x00, 0x00],
    category: '特殊功能'
  }
]

/**
 * 多媒体按键
 */
export const multimediaButtons: ButtonMapping[] = [
  {
    id: 'vol_up',
    name: '音量+',
    type: ButtonType.MULTIMEDIA,
    code: [0x30, 0xe9, 0x00, 0x00],
    category: '音量控制'
  },
  {
    id: 'vol_down',
    name: '音量-',
    type: ButtonType.MULTIMEDIA,
    code: [0x30, 0xea, 0x00, 0x00],
    category: '音量控制'
  },
  {
    id: 'mute',
    name: '静音',
    type: ButtonType.MULTIMEDIA,
    code: [0x30, 0xe2, 0x00, 0x00],
    category: '音量控制'
  },
  {
    id: 'play_pause',
    name: '播放/暂停',
    type: ButtonType.MULTIMEDIA,
    code: [0x30, 0xcd, 0x00, 0x00],
    category: '播放控制'
  },
  {
    id: 'stop',
    name: '停止',
    type: ButtonType.MULTIMEDIA,
    code: [0x30, 0xb7, 0x00, 0x00],
    category: '播放控制'
  },
  {
    id: 'prev',
    name: '上一首',
    type: ButtonType.MULTIMEDIA,
    code: [0x30, 0xb6, 0x00, 0x00],
    category: '播放控制'
  },
  {
    id: 'next',
    name: '下一首',
    type: ButtonType.MULTIMEDIA,
    code: [0x30, 0xb5, 0x00, 0x00],
    category: '播放控制'
  },
  {
    id: 'media',
    name: '多媒体',
    type: ButtonType.MULTIMEDIA,
    code: [0x30, 0x83, 0x01, 0x00],
    category: '系统功能'
  },
  {
    id: 'home',
    name: '主页',
    type: ButtonType.MULTIMEDIA,
    code: [0x30, 0x23, 0x02, 0x00],
    category: '浏览器'
  },
  {
    id: 'refresh',
    name: '网页-刷新',
    type: ButtonType.MULTIMEDIA,
    code: [0x30, 0x27, 0x02, 0x00],
    category: '浏览器'
  },
  {
    id: 'web_stop',
    name: '网页-停止',
    type: ButtonType.MULTIMEDIA,
    code: [0x30, 0x26, 0x02, 0x00],
    category: '浏览器'
  },
  {
    id: 'web_forward',
    name: '网页-前进',
    type: ButtonType.MULTIMEDIA,
    code: [0x30, 0x25, 0x02, 0x00],
    category: '浏览器'
  },
  {
    id: 'web_back',
    name: '网页-后退',
    type: ButtonType.MULTIMEDIA,
    code: [0x30, 0x24, 0x02, 0x00],
    category: '浏览器'
  },
  {
    id: 'favorites',
    name: '网页-收藏夹',
    type: ButtonType.MULTIMEDIA,
    code: [0x30, 0x2a, 0x02, 0x00],
    category: '浏览器'
  },
  {
    id: 'search',
    name: '网页-搜索',
    type: ButtonType.MULTIMEDIA,
    code: [0x30, 0x21, 0x02, 0x00],
    category: '浏览器'
  },
  {
    id: 'calculator',
    name: '计算器',
    type: ButtonType.MULTIMEDIA,
    code: [0x30, 0x92, 0x01, 0x00],
    category: '系统功能'
  },
  {
    id: 'my_computer',
    name: '我的电脑',
    type: ButtonType.MULTIMEDIA,
    code: [0x30, 0x94, 0x01, 0x00],
    category: '系统功能'
  },
  {
    id: 'mail',
    name: '邮件',
    type: ButtonType.MULTIMEDIA,
    code: [0x30, 0x8a, 0x01, 0x00],
    category: '系统功能'
  }
]

/**
 * 修饰键枚举
 */
export enum ModifierKey {
  NONE = 0x00,
  CTRL = 0x01,
  SHIFT = 0x02,
  ALT = 0x04,
  WIN = 0x08
}

/**
 * 修饰键配置
 */
export const modifierKeys = [
  { id: 'ctrl', name: 'Ctrl', value: ModifierKey.CTRL },
  { id: 'shift', name: 'Shift', value: ModifierKey.SHIFT },
  { id: 'alt', name: 'Alt', value: ModifierKey.ALT },
  { id: 'win', name: 'Win', value: ModifierKey.WIN }
]

/**
 * 键盘扫描码映射（HID Usage ID）
 * 参考：https://www.usb.org/sites/default/files/documents/hut1_12v2.pdf
 */
export const keyboardScancodes: Record<string, number> = {
  // 字母键 A-Z
  A: 0x04,
  B: 0x05,
  C: 0x06,
  D: 0x07,
  E: 0x08,
  F: 0x09,
  G: 0x0a,
  H: 0x0b,
  I: 0x0c,
  J: 0x0d,
  K: 0x0e,
  L: 0x0f,
  M: 0x10,
  N: 0x11,
  O: 0x12,
  P: 0x13,
  Q: 0x14,
  R: 0x15,
  S: 0x16,
  T: 0x17,
  U: 0x18,
  V: 0x19,
  W: 0x1a,
  X: 0x1b,
  Y: 0x1c,
  Z: 0x1d,

  // 数字键 1-9, 0
  '1': 0x1e,
  '2': 0x1f,
  '3': 0x20,
  '4': 0x21,
  '5': 0x22,
  '6': 0x23,
  '7': 0x24,
  '8': 0x25,
  '9': 0x26,
  '0': 0x27,

  // 功能键 F1-F12
  F1: 0x3a,
  F2: 0x3b,
  F3: 0x3c,
  F4: 0x3d,
  F5: 0x3e,
  F6: 0x3f,
  F7: 0x40,
  F8: 0x41,
  F9: 0x42,
  F10: 0x43,
  F11: 0x44,
  F12: 0x45,

  // 特殊键
  Enter: 0x28,
  Escape: 0x29,
  Backspace: 0x2a,
  Tab: 0x2b,
  Space: 0x2c,
  Minus: 0x2d,
  Equal: 0x2e,
  LeftBracket: 0x2f,
  RightBracket: 0x30,
  Backslash: 0x31,
  Semicolon: 0x33,
  Quote: 0x34,
  Grave: 0x35,
  Comma: 0x36,
  Period: 0x37,
  Slash: 0x38,
  CapsLock: 0x39,

  // 导航键
  Insert: 0x49,
  Home: 0x4a,
  PageUp: 0x4b,
  Delete: 0x4c,
  End: 0x4d,
  PageDown: 0x4e,
  Right: 0x4f,
  Left: 0x50,
  Down: 0x51,
  Up: 0x52,

  // 小键盘
  NumLock: 0x53,
  NumpadDivide: 0x54,
  NumpadMultiply: 0x55,
  NumpadMinus: 0x56,
  NumpadPlus: 0x57,
  NumpadEnter: 0x58,
  Numpad1: 0x59,
  Numpad2: 0x5a,
  Numpad3: 0x5b,
  Numpad4: 0x5c,
  Numpad5: 0x5d,
  Numpad6: 0x5e,
  Numpad7: 0x5f,
  Numpad8: 0x60,
  Numpad9: 0x61,
  Numpad0: 0x62,
  NumpadDecimal: 0x63
}

/**
 * 反向映射：从扫描码到键名
 */
export const scancodeToKey: Record<number, string> = Object.fromEntries(
  Object.entries(keyboardScancodes).map(([key, value]) => [value, key])
)

/**
 * 创建键盘按键映射
 * @param modifiers 修饰键组合（按位或）
 * @param scancode 键盘扫描码
 * @returns 4字节编码
 */
export function createKeyboardMapping(modifiers: number, scancode: number): number[] {
  return [0x10, modifiers, scancode, 0x00]
}

/**
 * 解析键盘按键映射
 * @param code 4字节编码
 * @returns { modifiers: number, scancode: number, keyName: string }
 */
export function parseKeyboardMapping(code: number[]): {
  modifiers: number
  scancode: number
  keyName: string
  modifierNames: string[]
} {
  if (code[0] !== 0x10) {
    throw new Error('不是键盘按键映射')
  }

  const modifiers = code[1]
  const scancode = code[2]
  const keyName = scancodeToKey[scancode] || `Unknown(0x${scancode.toString(16)})`

  const modifierNames: string[] = []
  if (modifiers & ModifierKey.CTRL) modifierNames.push('Ctrl')
  if (modifiers & ModifierKey.SHIFT) modifierNames.push('Shift')
  if (modifiers & ModifierKey.ALT) modifierNames.push('Alt')
  if (modifiers & ModifierKey.WIN) modifierNames.push('Win')

  return { modifiers, scancode, keyName, modifierNames }
}

/**
 * 获取按键映射的显示名称
 * @param code 4字节编码
 * @returns 显示名称
 */
export function getButtonDisplayName(code: number[]): string {
  // 检查是否是宏映射 (格式: [0x70, 宏索引, 循环模式, 循环次数高字节])
  if (code[0] === 0x70) {
    const macroIndex = code[1]
    const loopMode = code[2]
    const loopCount = code[2] | (code[3] << 8)

    let loopText = ''
    if (loopMode === 0x02) {
      loopText = '(松开)'
    } else if (loopMode === 0x03) {
      loopText = '(任意键)'
    } else if (loopMode !== 0x02 && loopMode !== 0x03) {
      loopText = `(x${loopCount})`
    }

    return `宏${macroIndex + 1}${loopText}`
  }

  // 检查是否是鼠标功能
  const mouseButton = mouseButtons.find((btn) => btn.code.every((byte, i) => byte === code[i]))
  if (mouseButton) return mouseButton.name

  // 检查是否是多媒体按键
  const multimediaButton = multimediaButtons.find((btn) =>
    btn.code.every((byte, i) => byte === code[i])
  )
  if (multimediaButton) return multimediaButton.name

  // 检查是否是键盘按键
  if (code[0] === 0x10) {
    try {
      const { keyName, modifierNames } = parseKeyboardMapping(code)
      if (modifierNames.length > 0) {
        return `${modifierNames.join('+')}+${keyName}`
      }
      return keyName
    } catch {
      // 解析失败，返回未知
    }
  }

  // 未知按键，显示索引
  return `未知(${code.map((b) => b.toString(16).padStart(2, '0')).join(' ')})`
}

/**
 * 默认按键映射（8个按键）
 * 注意：设备数组索引与物理按键位置的对应关系
 * 索引0: 左键
 * 索引1: 右键
 * 索引2: 中键
 * 索引3: 后退（物理按键5）
 * 索引4: 前进（物理按键4）
 * 索引5-7: 其他功能按键
 */
export const defaultButtonMappings: number[][] = [
  [0x20, 0x01, 0x00, 0x00], // 索引0: 左键
  [0x20, 0x02, 0x00, 0x00], // 索引1: 右键
  [0x20, 0x04, 0x00, 0x00], // 索引2: 中键
  [0x20, 0x08, 0x00, 0x00], // 索引3: 后退（物理按键5）
  [0x20, 0x10, 0x00, 0x00], // 索引4: 前进（物理按键4）
  [0x21, 0x55, 0x00, 0x00], // 索引5: DPI切换
  [0x21, 0x38, 0x01, 0x00], // 索引6: 滚轮+
  [0x21, 0x38, 0xff, 0x00] // 索引7: 滚轮-
]
