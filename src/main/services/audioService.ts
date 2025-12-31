import fs from 'fs/promises'
import path from 'path'

const AUDIO_EXTENSIONS = ['.mp3', '.wav', '.m4a', '.flac', '.ogg']

export async function getAudioFiles(dirPath: string) {
    try {
        const entries = await fs.readdir(dirPath, { withFileTypes: true })
        const audioFiles = entries
            .filter((entry) => {
                if (!entry.isFile()) return false
                const ext = path.extname(entry.name).toLowerCase()
                return AUDIO_EXTENSIONS.includes(ext)
            })
            .map((entry) => ({
                name: entry.name,
                path: path.join(dirPath, entry.name),
            }))
            .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }))

        return audioFiles
    } catch (error) {
        console.error('[AudioService] Error reading audio files:', error)
        return []
    }
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
