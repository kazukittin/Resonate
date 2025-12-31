import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
    selectDirectory: () => ipcRenderer.invoke('select-directory'),
    scanDirectory: (path: string) => ipcRenderer.invoke('scan-directory', path),
    getWorks: () => ipcRenderer.invoke('get-works'),
    getAudioFiles: (dirPath: string) => ipcRenderer.invoke('get-audio-files', dirPath),
    savePosition: (workId: string, filePath: string, position: number) =>
        ipcRenderer.invoke('save-position', workId, filePath, position),
    getPosition: (workId: string) => ipcRenderer.invoke('get-position', workId),
    startScraping: () => ipcRenderer.invoke('start-scraping'),
}

if (process.contextIsolated) {
    try {
        contextBridge.exposeInMainWorld('electron', electronAPI)
        contextBridge.exposeInMainWorld('api', api)
    } catch (error) {
        console.error(error)
    }
} else {
    // @ts-ignore (define in dts)
    window.electron = electronAPI
    // @ts-ignore (define in dts)
    window.api = api
}
