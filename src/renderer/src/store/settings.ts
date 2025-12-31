import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SettingsState {
    libraryPath: string | null
    setLibraryPath: (path: string | null) => void
}

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
            libraryPath: null,
            setLibraryPath: (path) => set({ libraryPath: path }),
        }),
        {
            name: 'resonate-settings',
        }
    )
)
