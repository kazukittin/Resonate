import { Generated } from 'kysely'

export interface WorksTable {
    id: string // RJ-code
    title: string | null
    circle_name: string | null
    cv_names: string | null // Comma separated or JSON string
    description: string | null
    thumbnail_path: string | null
    local_path: string
    last_played_at: string | null // ISO Date string
    created_at: Generated<string>
}

export interface PlayHistoryTable {
    id: Generated<number>
    work_id: string
    file_path: string
    last_position: number // Seconds
    updated_at: Generated<string>
}

export interface Database {
    works: WorksTable
    play_history: PlayHistoryTable
}
