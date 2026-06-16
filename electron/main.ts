import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import path from 'path'

app.disableHardwareAcceleration()

let win: BrowserWindow | null = null

function createWindow() {
  win = new BrowserWindow({
    width: 1600,
    height: 1000,
    minWidth: 1200,
    minHeight: 800,
    title: '实施清单审校工具',
    icon: path.join(__dirname, '../public/icon.png'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false
    }
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL)
    win.webContents.openDevTools()
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  win.on('closed', () => {
    win = null
  })
}

ipcMain.handle('open-file-dialog', async (_event, options) => {
  const result = await dialog.showOpenDialog(win!, options)
  return result
})

ipcMain.handle('save-file-dialog', async (_event, options) => {
  const result = await dialog.showSaveDialog(win!, options)
  return result
})

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (win === null) {
    createWindow()
  }
})
