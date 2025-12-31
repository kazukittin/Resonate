export interface Work {
    id: string
    title: string | null
    circle_name: string | null
    cv_names: string | null
    tags: string | null
    description: string | null
    thumbnail_path: string | null
    local_path: string
    last_played_at: string | null
    created_at?: string
}

export type SortOption = 'added_desc' | 'release_date_desc' | 'last_played_desc' | 'title_asc'

export interface GetWorksOptions {
    searchQuery?: string
    sortBy: SortOption
}
