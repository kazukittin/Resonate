import fs from 'fs/promises'
import path from 'path'
import { upsertWork } from './workService'

const RJ_CODE_REGEX = /RJ[0-9]{6,8}/i

const AUDIO_EXTENSIONS = new Set(['.mp3', '.m4a', '.wav', '.flac', '.ogg', '.aac'])

async function hasAudioFiles(dirPath: string): Promise<boolean> {
    try {
        const entries = await fs.readdir(dirPath, { withFileTypes: true })
        for (const entry of entries) {
            if (entry.isDirectory()) {
                if (await hasAudioFiles(path.join(dirPath, entry.name))) return true
            } else {
                const ext = path.extname(entry.name).toLowerCase()
                if (AUDIO_EXTENSIONS.has(ext)) return true
            }
        }
    } catch {
        return false
    }
    return false
}

export async function scanDirectory(rootPath: string) {
    console.log(`[Scanner] Starting scan in: ${rootPath}`)
    const results: { id: string; path: string }[] = []

    try {
        const entries = await fs.readdir(rootPath, { withFileTypes: true })

        for (const entry of entries) {
            if (entry.isDirectory()) {
                const fullPath = path.join(rootPath, entry.name)
                const match = entry.name.match(RJ_CODE_REGEX)
                let workId: string | null = null
                let defaultTitle: string | null = null

                if (match) {
                    workId = match[0].toUpperCase()
                } else {
                    // Check if folder contains audio files
                    if (await hasAudioFiles(fullPath)) {
                        workId = entry.name
                        defaultTitle = entry.name
                    }
                }

                if (workId) {
                    results.push({ id: workId, path: fullPath })

                    // Basic upsert into DB
                    await upsertWork({
                        id: workId,
                        title: defaultTitle,
                        circle_name: null,
                        cv_names: null,
                        description: null,
                        thumbnail_path: null,
                        local_path: fullPath,
                        last_played_at: null
                    })
                }
            }
        }

        return results
    } catch (error) {
        console.error('[Scanner] Error scanning directory:', error)
        throw error
    }
}
