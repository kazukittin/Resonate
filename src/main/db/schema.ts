import { Generated } from 'kysely'

export interface WorksTable {
    id: string // RJ-code or folder name
    title: string | null
    circle_name: string | null
    cv_names: string | null // Comma separated
    tags: string | null // Comma separated
    description: string | null
    thumbnail_path: string | null
    local_path: string
    last_played_at: string | null // ISO Date string
    created_at: Generated<string>
    scrape_status: 'pending' | 'success' | 'not_found' | 'failed' | null
}

export interface PlayHistoryTable {
    id: Generated<number>
    work_id: string
    file_path: string
    last_position: number // Seconds
    updated_at: Generated<string>
}

export interface PlaylistsTable {
    id: Generated<number>
    name: string
    created_at: Generated<string>
    updated_at: Generated<string>
}

export interface PlaylistTracksTable {
    id: Generated<number>
    playlist_id: number
    track_path: string // Full path to audio file
    track_name: string // Display name
    work_id: string | null // Reference to works table (optional)
    position: number // Order in playlist
    added_at: Generated<string>
}

export interface Database {
    works: WorksTable
    play_history: PlayHistoryTable
    playlists: PlaylistsTable
    playlist_tracks: PlaylistTracksTable
}
