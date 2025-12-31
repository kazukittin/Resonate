import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
    selectDirectory: () => ipcRenderer.invoke('select-directory'),
    scanDirectory: (path: string) => ipcRenderer.invoke('scan-directory', path),
    getWorks: (options) => ipcRenderer.invoke('get-works', options),
    getAudioFiles: (dirPath: string) => ipcRenderer.invoke('get-audio-files', dirPath),
    savePosition: (workId: string, filePath: string, position: number) =>
        ipcRenderer.invoke('save-position', workId, filePath, position),
    getPosition: (workId: string) => ipcRenderer.invoke('get-position', workId),
    updateWork: (id: string, data: any) => ipcRenderer.invoke('work:update', id, data),
    selectFile: () => ipcRenderer.invoke('select-file'),
    resetDatabase: () => ipcRenderer.invoke('reset-database'),
    startScraping: () => ipcRenderer.invoke('start-scraping'),

    // Playlist APIs
    createPlaylist: (name: string) => ipcRenderer.invoke('playlist:create', name),
    getAllPlaylists: () => ipcRenderer.invoke('playlist:getAll'),
    getPlaylistTracks: (playlistId: number) => ipcRenderer.invoke('playlist:getTracks', playlistId),
    addTrackToPlaylist: (playlistId: number, trackPath: string, trackName: string, workId: string | null) =>
        ipcRenderer.invoke('playlist:addTrack', playlistId, trackPath, trackName, workId),
    removeTrackFromPlaylist: (trackId: number) => ipcRenderer.invoke('playlist:removeTrack', trackId),
    deletePlaylist: (id: number) => ipcRenderer.invoke('playlist:delete', id),
    renamePlaylist: (id: number, newName: string) => ipcRenderer.invoke('playlist:rename', id, newName),

    // Event listeners
    onWorkUpdated: (callback: (workId: string) => void) => {
        ipcRenderer.on('work-updated', (_, workId) => callback(workId))
        return () => ipcRenderer.removeAllListeners('work-updated')
    },
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
