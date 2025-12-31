import { Work, GetWorksOptions } from '../common/types'

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
}

declare global {
    interface Window {
        electron: any
        api: ElectronAPI
    }
}
