import { ref, watch } from 'vue'

type Theme = 'light' | 'dark'

const THEME_STORAGE_KEY = 'app-theme'

// 从 localStorage 读取主题设置，默认为 light
const currentTheme = ref<Theme>(
  (localStorage.getItem(THEME_STORAGE_KEY) as Theme) || 'light'
)

// 应用主题到 DOM
function applyTheme(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme)
}

// 初始化时应用主题
applyTheme(currentTheme.value)

export function useTheme() {
  // 切换主题
  const toggleTheme = () => {
    currentTheme.value = currentTheme.value === 'light' ? 'dark' : 'light'
  }

  // 设置指定主题
  const setTheme = (theme: Theme) => {
    currentTheme.value = theme
  }

  // 监听主题变化，自动应用并保存
  watch(
    currentTheme,
    (newTheme) => {
      applyTheme(newTheme)
      localStorage.setItem(THEME_STORAGE_KEY, newTheme)
    },
    { immediate: true }
  )

  return {
    theme: currentTheme,
    toggleTheme,
    setTheme,
    isDark: () => currentTheme.value === 'dark'
  }
}
