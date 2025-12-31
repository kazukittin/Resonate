import { Work, GetWorksOptions } from '../common/types'

export interface Playlist {
    id: number
    name: string
    created_at: string
    updated_at: string
    trackCount: number
}

export interface PlaylistTrack {
    id: number
    playlist_id: number
    track_path: string
    track_name: string
    work_id: string | null
    position: number
    added_at: string
}

export interface ElectronAPI {
    selectDirectory: () => Promise<string | null>
    scanDirectory: (path: string) => Promise<{ id: string; path: string }[]>
    getWorks: (options?: GetWorksOptions) => Promise<Work[]>
    getAudioFiles: (dirPath: string) => Promise<{ name: string; path: string }[]>
    savePosition: (workId: string, filePath: string, position: number) => Promise<void>
    getPosition: (workId: string) => Promise<{ file_path: string; last_position: number } | null>
    updateWork: (id: string, data: Partial<Work> & { new_cover_path?: string }) => Promise<void>
    selectFile: () => Promise<string | null>
    resetDatabase: () => Promise<void>
    startScraping: () => Promise<boolean>

    // Playlist APIs
    createPlaylist: (name: string) => Promise<Playlist | undefined>
    getAllPlaylists: () => Promise<Playlist[]>
    getPlaylistTracks: (playlistId: number) => Promise<PlaylistTrack[]>
    addTrackToPlaylist: (playlistId: number, trackPath: string, trackName: string, workId: string | null) => Promise<void>
    removeTrackFromPlaylist: (trackId: number) => Promise<void>
    deletePlaylist: (id: number) => Promise<void>
    renamePlaylist: (id: number, newName: string) => Promise<void>

    // Event listeners
    onWorkUpdated: (callback: (workId: string) => void) => () => void
}

declare global {
    interface Window {
        electron: any
        api: ElectronAPI
    }
}
