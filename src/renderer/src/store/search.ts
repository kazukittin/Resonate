import { create } from 'zustand'
import { SortOption } from '../../../common/types'

interface FilterOptions {
    cvs: string[]
    tags: string[]
}

interface SearchState {
    searchQuery: string
    sortBy: SortOption
    filters: FilterOptions
    setSearchQuery: (query: string) => void
    setSortBy: (sort: SortOption) => void
    setFilters: (filters: FilterOptions) => void
    clearFilters: () => void
}

const defaultFilters: FilterOptions = {
    cvs: [],
    tags: [],
}

export const useSearchStore = create<SearchState>((set) => ({
    searchQuery: '',
    sortBy: 'added_desc',
    filters: defaultFilters,
    setSearchQuery: (query) => set({ searchQuery: query }),
    setSortBy: (sort) => set({ sortBy: sort }),
    setFilters: (filters) => set({ filters }),
    clearFilters: () => set({ filters: defaultFilters, searchQuery: '' }),
}))

export type { FilterOptions }
