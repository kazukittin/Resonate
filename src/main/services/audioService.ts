import fs from 'fs/promises'
import path from 'path'

const AUDIO_EXTENSIONS = ['.mp3', '.wav', '.m4a', '.flac', '.ogg', '.aac']

// Recursively get all audio files from a directory and its subdirectories
export async function getAudioFiles(dirPath: string): Promise<{ name: string; path: string }[]> {
    const audioFiles: { name: string; path: string }[] = []

    async function scanDirectory(currentPath: string) {
        try {
            const entries = await fs.readdir(currentPath, { withFileTypes: true })

            for (const entry of entries) {
                const fullPath = path.join(currentPath, entry.name)

                if (entry.isDirectory()) {
                    // Recursively scan subdirectories
                    await scanDirectory(fullPath)
                } else if (entry.isFile()) {
                    const ext = path.extname(entry.name).toLowerCase()
                    if (AUDIO_EXTENSIONS.includes(ext)) {
                        // Use relative path from root for display name
                        const relativePath = path.relative(dirPath, fullPath)
                        audioFiles.push({
                            name: relativePath,
                            path: fullPath,
                        })
                    }
                }
            }
        } catch (error) {
            console.error('[AudioService] Error scanning directory:', currentPath, error)
        }
    }

    await scanDirectory(dirPath)

    // Sort by name (path) for consistent ordering
    audioFiles.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }))

    return audioFiles
}

export async function savePlayPosition(workId: string, filePath: string, position: number) {
    const { db } = await import('../db/database')

    // Check if entry exists
    const existing = await db
        .selectFrom('play_history')
        .where('work_id', '=', workId)
        .select('id')
        .executeTakeFirst()

    if (existing) {
        await db
            .updateTable('play_history')
            .set({
                file_path: filePath,
                last_position: position,
                updated_at: new Date().toISOString()
            })
            .where('work_id', '=', workId)
            .execute()
    } else {
        await db
            .insertInto('play_history')
            .values({
                work_id: workId,
                file_path: filePath,
                last_position: position,
            })
            .execute()
    }

    // Update last_played_at in works table
    await db
        .updateTable('works')
        .set({ last_played_at: new Date().toISOString() })
        .where('id', '=', workId)
        .execute()
}

export async function getPlayPosition(workId: string) {
    const { db } = await import('../db/database')
    return await db
        .selectFrom('play_history')
        .where('work_id', '=', workId)
        .select(['file_path', 'last_position'])
        .executeTakeFirst()
}
