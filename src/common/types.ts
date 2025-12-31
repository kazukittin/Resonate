export interface Work {
    id: string
    title: string | null
    circle_name: string | null
    cv_names: string | null
    description: string | null
    thumbnail_path: string | null
    local_path: string
    last_played_at: string | null
    created_at?: string
}
