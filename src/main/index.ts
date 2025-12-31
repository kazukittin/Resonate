import { app, shell, BrowserWindow, ipcMain, dialog, protocol, net } from 'electron'
import { join } from 'path'
import { pathToFileURL } from 'url'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { initDatabase, resetDatabase } from './db/database'
import { getAllWorks, updateWork } from './services/workService'
import { scanDirectory } from './services/scanner'
import { scrapeMissingMetadata } from './services/scraper'

// Register custom protocols as privileged for stream support (required for audio/video seeking)
protocol.registerSchemesAsPrivileged([
    { scheme: 'resonate-img', privileges: { secure: true, standard: true, supportFetchAPI: true } },
    { scheme: 'resonate-audio', privileges: { secure: true, standard: true, supportFetchAPI: true, stream: true } }
])

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
        try {
            // Extract path after protocol prefix: resonate-img://
            // The path may be URL-encoded (Japanese characters etc)
            let rawPath = request.url.substring('resonate-img://'.length)

            // URL class lowercases the hostname (drive letter), so we extract manually
            // Format: C/Users/... or c/Users/... -> C:/Users/...
            if (process.platform === 'win32' && /^[a-zA-Z]\//.test(rawPath)) {
                rawPath = rawPath[0].toUpperCase() + ':' + rawPath.substring(1)
            }

            // Decode URI components (handles %E3%83%... -> Japanese chars)
            const filePath = decodeURIComponent(rawPath)

            console.log('[Protocol] resonate-img:', filePath)

            return net.fetch(pathToFileURL(filePath).toString())
        } catch (err) {
            console.error('[Protocol] resonate-img error:', err, request.url)
            return new Response('Error', { status: 500 })
        }
    })

    // Register protocol for local audio (supports streaming/seeking with Range requests)
    protocol.handle('resonate-audio', async (request) => {
        try {
            let rawPath = request.url.substring('resonate-audio://'.length)

            if (process.platform === 'win32' && /^[a-zA-Z]\//.test(rawPath)) {
                rawPath = rawPath[0].toUpperCase() + ':' + rawPath.substring(1)
            }

            const filePath = decodeURIComponent(rawPath)

            // Check if file exists
            const fs = require('fs')
            if (!fs.existsSync(filePath)) {
                console.error('[Protocol] File not found:', filePath)
                return new Response('File not found', { status: 404 })
            }

            const stat = fs.statSync(filePath)
            const fileSize = stat.size
            const mimeType = filePath.endsWith('.m4a') ? 'audio/mp4'
                : filePath.endsWith('.mp3') ? 'audio/mpeg'
                    : filePath.endsWith('.wav') ? 'audio/wav'
                        : filePath.endsWith('.flac') ? 'audio/flac'
                            : filePath.endsWith('.ogg') ? 'audio/ogg'
                                : 'audio/mpeg'

            // Check for Range header
            const rangeHeader = request.headers.get('Range')

            if (rangeHeader) {
                // Parse range header: "bytes=start-end" or "bytes=start-"
                const match = rangeHeader.match(/bytes=(\d+)-(\d*)/)
                if (match) {
                    const start = parseInt(match[1], 10)
                    const end = match[2] ? parseInt(match[2], 10) : fileSize - 1
                    const chunkSize = end - start + 1

                    console.log('[Protocol] Range request:', { start, end, chunkSize, fileSize })

                    // Create a readable stream for the requested range
                    const stream = fs.createReadStream(filePath, { start, end })

                    // Convert Node stream to Web ReadableStream
                    const webStream = new ReadableStream({
                        start(controller) {
                            stream.on('data', (chunk: Buffer) => {
                                controller.enqueue(new Uint8Array(chunk))
                            })
                            stream.on('end', () => {
                                controller.close()
                            })
                            stream.on('error', (err: Error) => {
                                controller.error(err)
                            })
                        },
                        cancel() {
                            stream.destroy()
                        }
                    })

                    return new Response(webStream, {
                        status: 206,
                        headers: {
                            'Content-Type': mimeType,
                            'Content-Length': String(chunkSize),
                            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                            'Accept-Ranges': 'bytes'
                        }
                    })
                }
            }

            // No range requested, return full file
            console.log('[Protocol] Full file request:', filePath)
            const stream = fs.createReadStream(filePath)
            const webStream = new ReadableStream({
                start(controller) {
                    stream.on('data', (chunk: Buffer) => {
                        controller.enqueue(new Uint8Array(chunk))
                    })
                    stream.on('end', () => {
                        controller.close()
                    })
                    stream.on('error', (err: Error) => {
                        controller.error(err)
                    })
                },
                cancel() {
                    stream.destroy()
                }
            })

            return new Response(webStream, {
                status: 200,
                headers: {
                    'Content-Type': mimeType,
                    'Content-Length': String(fileSize),
                    'Accept-Ranges': 'bytes'
                }
            })
        } catch (err) {
            console.error('[Protocol] resonate-audio error:', err, request.url)
            return new Response('Error', { status: 500 })
        }
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

    ipcMain.handle('get-works', async (_, options) => {
        return await getAllWorks(options)
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

    ipcMain.handle('work:update', async (_, id, data) => {
        return await updateWork(id, data)
    })

    ipcMain.handle('select-file', async () => {
        const { canceled, filePaths } = await dialog.showOpenDialog({
            properties: ['openFile'],
            filters: [{ name: 'Images', extensions: ['jpg', 'png', 'jpeg', 'webp'] }]
        })
        if (canceled) return null
        return filePaths[0]
    })

    ipcMain.handle('start-scraping', async () => {
        // Run in background
        scrapeMissingMetadata()
        return true
    })

    ipcMain.handle('reset-database', async () => {
        return await resetDatabase()
    })

    // Playlist handlers
    ipcMain.handle('playlist:create', async (_, name: string) => {
        const { createPlaylist } = await import('./services/playlistService')
        return await createPlaylist(name)
    })

    ipcMain.handle('playlist:getAll', async () => {
        const { getPlaylistWithTrackCount } = await import('./services/playlistService')
        return await getPlaylistWithTrackCount()
    })

    ipcMain.handle('playlist:getTracks', async (_, playlistId: number) => {
        const { getPlaylistTracks } = await import('./services/playlistService')
        return await getPlaylistTracks(playlistId)
    })

    ipcMain.handle('playlist:addTrack', async (_, playlistId: number, trackPath: string, trackName: string, workId: string | null) => {
        const { addTrackToPlaylist } = await import('./services/playlistService')
        return await addTrackToPlaylist(playlistId, trackPath, trackName, workId)
    })

    ipcMain.handle('playlist:removeTrack', async (_, trackId: number) => {
        const { removeTrackFromPlaylist } = await import('./services/playlistService')
        return await removeTrackFromPlaylist(trackId)
    })

    ipcMain.handle('playlist:delete', async (_, id: number) => {
        const { deletePlaylist } = await import('./services/playlistService')
        return await deletePlaylist(id)
    })

    ipcMain.handle('playlist:rename', async (_, id: number, newName: string) => {
        const { renamePlaylist } = await import('./services/playlistService')
        return await renamePlaylist(id, newName)
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
