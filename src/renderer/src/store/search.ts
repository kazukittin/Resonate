import { create } from 'zustand'
import { SortOption } from '../../../common/types'

interface SearchState {
    searchQuery: string
    sortBy: SortOption
    setSearchQuery: (query: string) => void
    setSortBy: (sort: SortOption) => void
}

export const useSearchStore = create<SearchState>((set) => ({
    searchQuery: '',
    sortBy: 'added_desc',
    setSearchQuery: (query) => set({ searchQuery: query }),
    setSortBy: (sort) => set({ sortBy: sort }),
}))
