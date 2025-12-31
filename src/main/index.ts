import { app, shell, BrowserWindow, ipcMain, dialog, protocol, net } from 'electron'
import { join } from 'path'
import { pathToFileURL } from 'url'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { initDatabase } from './db/database'
import { getAllWorks } from './services/workService'
import { scanDirectory } from './services/scanner'
import { scrapeMissingMetadata } from './services/scraper'

function createWindow(): void {
    const mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        show: false,
        autoHideMenuBar: true,
        ...(process.platform === 'linux' ? { icon } : {}),
        webPreferences: {
            preload: join(__dirname, '../preload/index.js'),
            sandbox: false
        }
    })

    mainWindow.on('ready-to-show', () => {
        mainWindow.show()
    })

    mainWindow.webContents.setWindowOpenHandler((details) => {
        shell.openExternal(details.url)
        return { action: 'deny' }
    })

    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
        mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
    } else {
        mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
    }
}

app.whenReady().then(async () => {
    // Set app user model id for windows
    electronApp.setAppUserModelId('com.resonate')

    // Initialize database
    await initDatabase()

    // Register protocol for local images
    protocol.handle('resonate-img', (request) => {
        const filePath = request.url.replace('resonate-img://', '')
        return net.fetch(pathToFileURL(decodeURIComponent(filePath)).toString())
    })

    // Register protocol for local audio (supports streaming/seeking)
    protocol.handle('resonate-audio', (request) => {
        const filePath = request.url.replace('resonate-audio://', '')
        return net.fetch(pathToFileURL(decodeURIComponent(filePath)).toString())
    })

    // IPC Handlers
    ipcMain.handle('select-directory', async () => {
        const { canceled, filePaths } = await dialog.showOpenDialog({
            properties: ['openDirectory']
        })
        if (canceled) return null
        return filePaths[0]
    })

    ipcMain.handle('scan-directory', async (_, path: string) => {
        return await scanDirectory(path)
    })

    ipcMain.handle('get-works', async () => {
        return await getAllWorks()
    })

    ipcMain.handle('get-audio-files', async (_, dirPath: string) => {
        const { getAudioFiles } = await import('./services/audioService')
        return await getAudioFiles(dirPath)
    })

    ipcMain.handle('save-position', async (_, workId: string, filePath: string, position: number) => {
        const { savePlayPosition } = await import('./services/audioService')
        return await savePlayPosition(workId, filePath, position)
    })

    ipcMain.handle('get-position', async (_, workId: string) => {
        const { getPlayPosition } = await import('./services/audioService')
        return await getPlayPosition(workId)
    })

    ipcMain.handle('start-scraping', async () => {
        // Run in background
        scrapeMissingMetadata()
        return true
    })

    app.on('browser-window-created', (_, window) => {
        optimizer.watchWindowShortcuts(window)
    })

    createWindow()

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})
