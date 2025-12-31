import { Work } from '../common/types'

export interface ElectronAPI {
    selectDirectory: () => Promise<string | null>
    scanDirectory: (path: string) => Promise<{ id: string; path: string }[]>
    getWorks: () => Promise<Work[]>
    getAudioFiles: (dirPath: string) => Promise<{ name: string; path: string }[]>
    savePosition: (workId: string, filePath: string, position: number) => Promise<void>
    getPosition: (workId: string) => Promise<{ file_path: string; last_position: number } | null>
    startScraping: () => Promise<boolean>
}

declare global {
    interface Window {
        electron: any
        api: ElectronAPI
    }
}
