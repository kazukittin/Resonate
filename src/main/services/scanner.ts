import fs from 'fs/promises'
import path from 'path'
import { upsertWork } from './workService'

const RJ_CODE_REGEX = /RJ[0-9]{6,8}/i

export async function scanDirectory(rootPath: string) {
    console.log(`[Scanner] Starting scan in: ${rootPath}`)
    const results: { id: string; path: string }[] = []

    try {
        const entries = await fs.readdir(rootPath, { withFileTypes: true })

        for (const entry of entries) {
            if (entry.isDirectory()) {
                const match = entry.name.match(RJ_CODE_REGEX)
                if (match) {
                    const rjCode = match[0].toUpperCase()
                    const fullPath = path.join(rootPath, entry.name)

                    results.push({ id: rjCode, path: fullPath })

                    // Basic upsert into DB
                    await upsertWork({
                        id: rjCode,
                        title: null,
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
