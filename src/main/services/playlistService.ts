import { db } from '../db/database'

export async function createPlaylist(name: string) {
    return await db
        .insertInto('playlists')
        .values({ name })
        .returningAll()
        .executeTakeFirst()
}

export async function getAllPlaylists() {
    return await db
        .selectFrom('playlists')
        .selectAll()
        .orderBy('updated_at', 'desc')
        .execute()
}

export async function getPlaylist(id: number) {
    return await db
        .selectFrom('playlists')
        .where('id', '=', id)
        .selectAll()
        .executeTakeFirst()
}

export async function getPlaylistTracks(playlistId: number) {
    return await db
        .selectFrom('playlist_tracks')
        .where('playlist_id', '=', playlistId)
        .selectAll()
        .orderBy('position', 'asc')
        .execute()
}

export async function addTrackToPlaylist(
    playlistId: number,
    trackPath: string,
    trackName: string,
    workId: string | null
) {
    // Get the current max position
    const maxPos = await db
        .selectFrom('playlist_tracks')
        .where('playlist_id', '=', playlistId)
        .select(db.fn.max('position').as('max_pos'))
        .executeTakeFirst()

    const position = ((maxPos?.max_pos as number) ?? -1) + 1

    await db
        .insertInto('playlist_tracks')
        .values({
            playlist_id: playlistId,
            track_path: trackPath,
            track_name: trackName,
            work_id: workId,
            position
        })
        .execute()

    // Update playlist's updated_at
    await db
        .updateTable('playlists')
        .set({ updated_at: new Date().toISOString() })
        .where('id', '=', playlistId)
        .execute()
}

export async function removeTrackFromPlaylist(trackId: number) {
    await db
        .deleteFrom('playlist_tracks')
        .where('id', '=', trackId)
        .execute()
}

export async function deletePlaylist(id: number) {
    await db
        .deleteFrom('playlists')
        .where('id', '=', id)
        .execute()
}

export async function renamePlaylist(id: number, newName: string) {
    await db
        .updateTable('playlists')
        .set({ name: newName, updated_at: new Date().toISOString() })
        .where('id', '=', id)
        .execute()
}

export async function getPlaylistWithTrackCount() {
    const playlists = await getAllPlaylists()
    const result: Array<typeof playlists[number] & { trackCount: number }> = []

    for (const playlist of playlists) {
        const tracks = await getPlaylistTracks(playlist.id as number)
        result.push({
            ...playlist,
            trackCount: tracks.length
        })
    }

    return result
}
