/**
 * 环境检测工具
 */

// 检测是否在 Electron 环境中运行
export const isElectron = (): boolean => {
  return !!(window && window.process && window.process.type === 'renderer')
}

// 检测是否在 Web 环境中运行
export const isWeb = (): boolean => {
  return !isElectron()
}

// 获取当前运行环境名称
export const getEnvName = (): 'electron' | 'web' => {
  return isElectron() ? 'electron' : 'web'
}

// 安全地访问 Electron API
export const getElectronAPI = () => {
  if (isElectron() && window.electron) {
    return window.electron
  }
  return null
}
