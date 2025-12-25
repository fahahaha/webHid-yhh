import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.webContents.session.setDevicePermissionHandler((details) => {
    if (details.deviceType === 'hid') {
      return true
    }
    return false
  })

  // 设置权限检查处理器

  // @ts-ignore
  mainWindow.webContents.session.setPermissionCheckHandler(
    (_webContents, permission, requestingOrigin, details) => {
      console.log('setPermissionCheckHandler:', permission, requestingOrigin, details)
      return true
    }
  )

  // 设置权限请求处理器
  mainWindow.webContents.session.setPermissionRequestHandler(
    (_webContents, permission, callback, details) => {
      console.log('setPermissionRequestHandler:', _webContents, permission, callback, details)
      callback(true)
    }
  )

  // 启用 WebHID 设备选择
  mainWindow.webContents.session.on('select-hid-device', (event, details, callback) => {
    event.preventDefault()

    console.log('[HID 设备选择] 收到设备选择请求')
    console.log('[HID 设备选择] 可用设备数量:', details.deviceList?.length || 0)

    // 如果有设备列表，选择第一个设备（或根据条件筛选）
    if (details.deviceList && details.deviceList.length > 0) {
      // 打印所有可用设备
      details.deviceList.forEach((device, index) => {
        console.log(
          `[HID 设备 ${index}] 设备 (VID: 0x${device.vendorId.toString(16)}, PID: 0x${device.productId.toString(16)})`
        )
      })

      // 优先选择特定的设备（VID: 0xa8a4, PID: 0x2255）
      const targetDevice = details.deviceList.find(
        (device) => device.vendorId === 0xa8a4 && device.productId === 0x2255
      )

      // 如果找到目标设备，使用它；否则使用第一个设备
      const selectedDevice = targetDevice || details.deviceList[0]
      console.log(`[HID 设备选择] 已选择设备 (ID: ${selectedDevice.deviceId})`)
      callback(selectedDevice.deviceId)
    } else {
      // 没有设备时，传递空字符串
      console.warn('[HID 设备选择] 没有可用设备')
      callback('')
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
