import { ref, watch } from 'vue'

/**
 * 宏事件接口
 */
export interface MacroEvent {
  /** 事件类型: 'keydown' | 'keyup' */
  type: 'keydown' | 'keyup'
  /** 按键名称 (用于显示) */
  key: string
  /** USB HID 扫描码 */
  scancode: number
  /** 延迟时间 (毫秒) */
  delay: number
  /** 修饰键 (Ctrl/Shift/Alt) */
  modifiers?: number
}

/**
 * 宏接口
 */
export interface Macro {
  /** 宏名称 */
  name: string
  /** 宏事件列表 */
  events: MacroEvent[]
  /** 循环模式: 'once' | 'release' | 'anykey' | 'count' */
  loopMode: 'once' | 'release' | 'anykey' | 'count'
  /** 循环次数 (当 loopMode 为 'count' 时有效) */
  loopCount: number
}

const STORAGE_KEY = 'mouse_macros'
const MAX_MACRO_COUNT = 10

/**
 * 宏管理本地存储
 */
export function useMacroStorage() {
  // 初始化宏列表 (空数组,从缓存加载)
  const macros = ref<Macro[]>([])

  /**
   * 从 localStorage 加载宏列表
   */
  function loadMacros(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as Macro[]
        if (Array.isArray(parsed)) {
          macros.value = parsed
          console.log('[宏存储] 已加载宏列表:', parsed)
        } else {
          console.warn('[宏存储] 存储的宏列表格式不正确,使用空数组')
          macros.value = []
        }
      } else {
        macros.value = []
      }
    } catch (err) {
      console.error('[宏存储] 加载宏列表失败:', err)
      macros.value = []
    }
  }

  /**
   * 保存宏列表到 localStorage
   */
  function saveMacros(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(macros.value))
      console.log('[宏存储] 已保存宏列表')
    } catch (err) {
      console.error('[宏存储] 保存宏列表失败:', err)
    }
  }

  /**
   * 获取指定索引的宏
   */
  function getMacro(index: number): Macro | null {
    if (index < 0 || index >= macros.value.length) {
      console.error('[宏存储] 宏索引超出范围:', index)
      return null
    }
    return macros.value[index]
  }

  /**
   * 添加新宏
   */
  function addMacro(macro: Macro): boolean {
    if (macros.value.length >= MAX_MACRO_COUNT) {
      console.error('[宏存储] 已达到最大宏数量限制')
      return false
    }
    macros.value.push({ ...macro })
    saveMacros()
    return true
  }

  /**
   * 更新指定索引的宏
   */
  function updateMacro(index: number, macro: Macro): boolean {
    if (index < 0 || index >= macros.value.length) {
      console.error('[宏存储] 宏索引超出范围:', index)
      return false
    }
    macros.value[index] = { ...macro }
    saveMacros()
    return true
  }

  /**
   * 删除指定索引的宏
   */
  function deleteMacro(index: number): boolean {
    if (index < 0 || index >= macros.value.length) {
      console.error('[宏存储] 宏索引超出范围:', index)
      return false
    }
    macros.value.splice(index, 1)
    saveMacros()
    return true
  }

  /**
   * 清空所有宏
   */
  function clearAllMacros(): void {
    macros.value = []
    saveMacros()
  }

  /**
   * 获取下一个可用的宏名称
   */
  function getNextMacroName(): string {
    const existingNumbers = macros.value
      .map((m) => {
        const match = m.name.match(/^宏\s*(\d+)$/)
        return match ? parseInt(match[1]) : 0
      })
      .filter((n) => n > 0)

    if (existingNumbers.length === 0) {
      return '宏 1'
    }

    const maxNumber = Math.max(...existingNumbers)
    return `宏 ${maxNumber + 1}`
  }

  /**
   * 将宏事件编码为设备协议格式
   * 格式: [延迟低字节, 延迟高字节, 事件类型, 按键码]
   */
  function encodeMacroEvents(events: MacroEvent[]): number[] {
    const encoded: number[] = []

    for (const event of events) {
      const delay = Math.min(65535, Math.max(0, event.delay)) // 限制在 16 位范围内
      const eventType = event.type === 'keydown' ? 0x42 : 0x02
      const keyCode = event.scancode

      encoded.push(
        delay & 0xff, // 延迟低字节
        (delay >> 8) & 0xff, // 延迟高字节
        eventType, // 事件类型
        keyCode // 按键码
      )
    }

    return encoded
  }

  /**
   * 将设备协议格式解码为宏事件
   */
  function decodeMacroEvents(
    data: Array<{ delay: number; eventType: number; keyCode: number }>
  ): MacroEvent[] {
    const events: MacroEvent[] = []

    for (const item of data) {
      const type = item.eventType === 0x42 ? 'keydown' : 'keyup'
      const key = getKeyNameFromScancode(item.keyCode)

      events.push({
        type,
        key,
        scancode: item.keyCode,
        delay: item.delay
      })
    }

    return events
  }

  /**
   * 根据扫描码获取按键名称
   */
  function getKeyNameFromScancode(scancode: number): string {
    // USB HID 键盘扫描码映射
    const scancodeMap: Record<number, string> = {
      0x04: 'A',
      0x05: 'B',
      0x06: 'C',
      0x07: 'D',
      0x08: 'E',
      0x09: 'F',
      0x0a: 'G',
      0x0b: 'H',
      0x0c: 'I',
      0x0d: 'J',
      0x0e: 'K',
      0x0f: 'L',
      0x10: 'M',
      0x11: 'N',
      0x12: 'O',
      0x13: 'P',
      0x14: 'Q',
      0x15: 'R',
      0x16: 'S',
      0x17: 'T',
      0x18: 'U',
      0x19: 'V',
      0x1a: 'W',
      0x1b: 'X',
      0x1c: 'Y',
      0x1d: 'Z',
      0x1e: '1',
      0x1f: '2',
      0x20: '3',
      0x21: '4',
      0x22: '5',
      0x23: '6',
      0x24: '7',
      0x25: '8',
      0x26: '9',
      0x27: '0',
      0x28: 'Enter',
      0x29: 'Escape',
      0x2a: 'Backspace',
      0x2b: 'Tab',
      0x2c: 'Space',
      0xe0: 'CONTROL',
      0xe1: 'SHIFT',
      0xe2: 'ALT',
      0xe3: 'META',
      0xe4: 'RightCtrl',
      0xe5: 'RightShift',
      0xe6: 'RightAlt',
      0xe7: 'RightMeta'
    }

    return scancodeMap[scancode] || `Key(0x${scancode.toString(16)})`
  }

  /**
   * 根据按键名称获取扫描码
   */
  function getScancodeFromKeyName(keyName: string): number {
    const keyMap: Record<string, number> = {
      a: 0x04,
      b: 0x05,
      c: 0x06,
      d: 0x07,
      e: 0x08,
      f: 0x09,
      g: 0x0a,
      h: 0x0b,
      i: 0x0c,
      j: 0x0d,
      k: 0x0e,
      l: 0x0f,
      m: 0x10,
      n: 0x11,
      o: 0x12,
      p: 0x13,
      q: 0x14,
      r: 0x15,
      s: 0x16,
      t: 0x17,
      u: 0x18,
      v: 0x19,
      w: 0x1a,
      x: 0x1b,
      y: 0x1c,
      z: 0x1d,
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
      enter: 0x28,
      escape: 0x29,
      backspace: 0x2a,
      tab: 0x2b,
      ' ': 0x2c,
      space: 0x2c,
      control: 0xe0,
      shift: 0xe1,
      alt: 0xe2,
      meta: 0xe3
    }

    return keyMap[keyName.toLowerCase()] || 0x00
  }

  // 监听宏列表变化,自动保存
  watch(
    macros,
    () => {
      saveMacros()
    },
    { deep: true }
  )

  // 初始化时加载宏列表
  loadMacros()

  return {
    macros,
    getMacro,
    addMacro,
    updateMacro,
    deleteMacro,
    clearAllMacros,
    getNextMacroName,
    encodeMacroEvents,
    decodeMacroEvents,
    getKeyNameFromScancode,
    getScancodeFromKeyName,
    MAX_MACRO_COUNT
  }
}
