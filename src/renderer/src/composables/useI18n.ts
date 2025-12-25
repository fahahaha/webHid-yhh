import { ref, computed } from 'vue'
import zhCN from '../locales/zh-CN'
import enUS from '../locales/en-US'

type Locale = 'zh-CN' | 'en-US'
type Messages = typeof zhCN

const messages: Record<Locale, Messages> = {
  'zh-CN': zhCN,
  'en-US': enUS
}

// 从 localStorage 读取保存的语言设置，默认为中文
const savedLocale = (localStorage.getItem('locale') as Locale) || 'zh-CN'
const currentLocale = ref<Locale>(savedLocale)

/**
 * 国际化 composable
 * 提供语言切换和翻译功能
 */
export function useI18n() {
  /**
   * 切换语言
   */
  const setLocale = (locale: Locale) => {
    currentLocale.value = locale
    localStorage.setItem('locale', locale)
  }

  /**
   * 获取当前语言
   */
  const locale = computed(() => currentLocale.value)

  /**
   * 翻译函数
   * 支持嵌套路径访问，如 'common.connect'
   * 支持参数替换，如 t('message', { name: 'John' })
   */
  const t = (key: string, params?: Record<string, string | number>): string => {
    const keys = key.split('.')
    let value: any = messages[currentLocale.value]

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k]
      } else {
        console.warn(`Translation key not found: ${key}`)
        return key
      }
    }

    if (typeof value !== 'string') {
      console.warn(`Translation value is not a string: ${key}`)
      return key
    }

    // 参数替换
    if (params) {
      return value.replace(/\{(\w+)\}/g, (match, paramKey) => {
        return paramKey in params ? String(params[paramKey]) : match
      })
    }

    return value
  }

  /**
   * 翻译数组
   * 用于获取数组类型的翻译，如频率标签
   */
  const ta = (key: string): string[] => {
    const keys = key.split('.')
    let value: any = messages[currentLocale.value]

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k]
      } else {
        console.warn(`Translation key not found: ${key}`)
        return []
      }
    }

    if (!Array.isArray(value)) {
      console.warn(`Translation value is not an array: ${key}`)
      return []
    }

    return value
  }

  return {
    locale,
    setLocale,
    t,
    ta
  }
}
