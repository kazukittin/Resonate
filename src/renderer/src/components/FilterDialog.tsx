import { useState, useMemo, useEffect } from 'react'
import { X, Search, Filter } from 'lucide-react'
import { useSearchStore, FilterOptions } from '../store/search'
import { Work } from '../../../common/types'

interface FilterDialogProps {
    works: Work[]
    onClose: () => void
}

export function FilterDialog({ works, onClose }: FilterDialogProps) {
    const { filters, setFilters, searchQuery, setSearchQuery } = useSearchStore()
    const [localFilters, setLocalFilters] = useState<FilterOptions>(filters)
    const [localKeyword, setLocalKeyword] = useState(searchQuery)

    // Sync local state when dialog opens or store changes
    useEffect(() => {
        setLocalFilters(filters)
        setLocalKeyword(searchQuery)
    }, [filters, searchQuery])

    // Extract all unique CVs and tags from works
    const { allCvs, allTags } = useMemo(() => {
        const cvsSet = new Set<string>()
        const tagsSet = new Set<string>()

        works.forEach(work => {
            if (work.cv_names) {
                work.cv_names.split(/[,、/／]/).forEach(cv => {
                    const trimmed = cv.trim()
                    if (trimmed) cvsSet.add(trimmed)
                })
            }
            if (work.tags) {
                work.tags.split(',').forEach(tag => {
                    const trimmed = tag.trim()
                    if (trimmed) tagsSet.add(trimmed)
                })
            }
        })

        return {
            allCvs: Array.from(cvsSet).sort((a, b) => a.localeCompare(b, 'ja')),
            allTags: Array.from(tagsSet).sort((a, b) => a.localeCompare(b, 'ja'))
        }
    }, [works])

    const [cvSearch, setCvSearch] = useState('')
    const [tagSearch, setTagSearch] = useState('')

    const filteredCvs = allCvs.filter(cv =>
        cv.toLowerCase().includes(cvSearch.toLowerCase()) || localFilters.cvs.includes(cv)
    )
    const filteredTags = allTags.filter(tag =>
        tag.toLowerCase().includes(tagSearch.toLowerCase()) || localFilters.tags.includes(tag)
    )

    const toggleCv = (cv: string) => {
        const newCvs = localFilters.cvs.includes(cv)
            ? localFilters.cvs.filter(c => c !== cv)
            : [...localFilters.cvs, cv]
        setLocalFilters({ ...localFilters, cvs: newCvs })
    }

    const toggleTag = (tag: string) => {
        const newTags = localFilters.tags.includes(tag)
            ? localFilters.tags.filter(t => t !== tag)
            : [...localFilters.tags, tag]
        setLocalFilters({ ...localFilters, tags: newTags })
    }

    const handleApply = () => {
        setFilters(localFilters)
        setSearchQuery(localKeyword)
        onClose()
    }

    const handleClear = () => {
        setLocalFilters({ cvs: [], tags: [] })
        setLocalKeyword('')
    }

    const activeFilterCount = localFilters.cvs.length + localFilters.tags.length + (localKeyword ? 1 : 0)

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div
                className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-6 border-b border-border flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <Filter className="w-5 h-5 text-primary" />
                        <h2 className="text-lg font-bold">フィルター</h2>
                        {activeFilterCount > 0 && (
                            <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full font-bold">
                                {activeFilterCount} 件
                            </span>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-accent rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                    {/* Keyword Search */}
                    <div className="space-y-3">
                        <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                            <Search className="w-4 h-4" />
                            キーワード検索
                        </label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="タイトル、サークル名、RJコードなど..."
                                value={localKeyword}
                                onChange={(e) => setLocalKeyword(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
                            />
                        </div>
                    </div>

                    {/* CV Filter */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-semibold text-foreground">声優で絞り込み</label>
                            {localFilters.cvs.length > 0 && (
                                <button
                                    onClick={() => setLocalFilters({ ...localFilters, cvs: [] })}
                                    className="text-[10px] text-muted-foreground hover:text-primary transition-colors"
                                >
                                    選択を解除 ({localFilters.cvs.length})
                                </button>
                            )}
                        </div>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="声優を検索..."
                                value={cvSearch}
                                onChange={(e) => setCvSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
                            />
                        </div>
                        <div className="max-h-48 overflow-y-auto border border-border rounded-xl p-3 bg-muted/30">
                            {filteredCvs.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground text-sm">
                                    声優が見つかりません
                                </div>
                            ) : (
                                <div className="flex flex-wrap gap-2">
                                    {filteredCvs.map(cv => {
                                        const isSelected = localFilters.cvs.includes(cv)
                                        return (
                                            <button
                                                key={cv}
                                                onClick={() => toggleCv(cv)}
                                                className={`
                                                    px-3 py-1.5 rounded-lg text-sm transition-all border
                                                    ${isSelected
                                                        ? 'bg-purple-500 text-white border-purple-400 shadow-md shadow-purple-500/20'
                                                        : 'bg-card border-border hover:border-primary/50 hover:bg-accent'
                                                    }
                                                `}
                                            >
                                                {cv}
                                            </button>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Tag Filter */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-semibold text-foreground">タグで絞り込み</label>
                            {localFilters.tags.length > 0 && (
                                <button
                                    onClick={() => setLocalFilters({ ...localFilters, tags: [] })}
                                    className="text-[10px] text-muted-foreground hover:text-primary transition-colors"
                                >
                                    選択を解除 ({localFilters.tags.length})
                                </button>
                            )}
                        </div>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="タグを検索..."
                                value={tagSearch}
                                onChange={(e) => setTagSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
                            />
                        </div>
                        <div className="max-h-48 overflow-y-auto border border-border rounded-xl p-3 bg-muted/30">
                            {filteredTags.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground text-sm">
                                    タグが見つかりません
                                </div>
                            ) : (
                                <div className="flex flex-wrap gap-2">
                                    {filteredTags.map(tag => {
                                        const isSelected = localFilters.tags.includes(tag)
                                        return (
                                            <button
                                                key={tag}
                                                onClick={() => toggleTag(tag)}
                                                className={`
                                                    px-3 py-1.5 rounded-lg text-sm transition-all border
                                                    ${isSelected
                                                        ? 'bg-primary text-primary-foreground border-primary/50 shadow-md shadow-primary/20'
                                                        : 'bg-card border-border hover:border-primary/50 hover:bg-accent'
                                                    }
                                                `}
                                            >
                                                {tag}
                                            </button>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-border flex items-center justify-between shrink-0 bg-card">
                    <button
                        onClick={handleClear}
                        className="px-4 py-2 text-sm text-muted-foreground hover:text-destructive transition-colors font-medium"
                    >
                        すべてクリア
                    </button>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm bg-muted text-muted-foreground rounded-xl hover:bg-accent transition-all font-medium"
                        >
                            キャンセル
                        </button>
                        <button
                            onClick={handleApply}
                            className="px-8 py-2 text-sm bg-primary text-primary-foreground rounded-xl font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/20"
                        >
                            適用する
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
