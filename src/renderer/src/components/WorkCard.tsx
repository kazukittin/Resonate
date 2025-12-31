import React, { useState } from 'react'
import { Music2, Edit2, Play, List } from 'lucide-react'
import type { Work } from '../../../common/types'
import { EditWorkDialog } from './EditWorkDialog'
import { TrackListDialog } from './TrackListDialog'
import { useSearchStore } from '../store/search'
import { encodePathForProtocol } from '../utils/pathUtils'

interface WorkCardProps {
    work: Work
    onClick?: () => void
}

export function WorkCard({ work, onClick }: WorkCardProps) {
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [isTrackListOpen, setIsTrackListOpen] = useState(false)
    const { setSearchQuery } = useSearchStore()

    const thumbnailSrc = work.thumbnail_path
        ? `resonate-img://${encodePathForProtocol(work.thumbnail_path)}`
        : null

    const handleEditClick = (e: React.MouseEvent) => {
        e.stopPropagation()
        setIsEditDialogOpen(true)
    }

    const handleTagClick = (e: React.MouseEvent, query: string) => {
        e.stopPropagation()
        setSearchQuery(query)
    }

    // Parse tags and CVs
    const tags = work.tags?.split(',').map(t => t.trim()).filter(Boolean) || []
    const cvList = work.cv_names?.split(/[,、/／]/).map(cv => cv.trim()).filter(Boolean) || []

    return (
        <>
            <div
                onClick={onClick}
                className="group relative bg-card rounded-xl border border-border overflow-hidden hover:border-primary/50 transition-all hover:shadow-2xl hover:shadow-primary/10 cursor-pointer"
            >
                <div className="aspect-[3/4] bg-muted relative overflow-hidden flex items-center justify-center">
                    {thumbnailSrc ? (
                        <img
                            src={thumbnailSrc}
                            alt={work.title || work.id}
                            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                        />
                    ) : (
                        <Music2 className="w-16 h-16 text-muted-foreground opacity-20 group-hover:scale-110 transition-transform" />
                    )}

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                        <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-primary-foreground shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform">
                            <Play className="w-6 h-6 fill-current translate-x-0.5" />
                        </div>
                    </div>

                    {/* Buttons - Visible on Hover */}
                    <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                setIsTrackListOpen(true)
                            }}
                            className="p-2 bg-black/60 backdrop-blur-md rounded-lg text-white hover:bg-primary transition-colors"
                            title="トラック一覧"
                        >
                            <List className="w-4 h-4" />
                        </button>
                        <button
                            onClick={handleEditClick}
                            className="p-2 bg-black/60 backdrop-blur-md rounded-lg text-white hover:bg-primary transition-colors"
                            title="編集"
                        >
                            <Edit2 className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="absolute bottom-3 left-3 px-2 py-0.5 bg-black/60 backdrop-blur-md rounded text-[10px] text-white font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                        {work.id}
                    </div>
                </div>

                <div className="p-4 space-y-2">
                    <div className="text-[10px] font-bold text-primary uppercase tracking-wider">{work.id}</div>
                    <div className="font-semibold truncate text-sm leading-tight h-10 line-clamp-2 overflow-hidden">
                        {work.title || 'メタデータ取得中...'}
                    </div>

                    {/* Clickable Circle Name */}
                    {work.circle_name && (
                        <button
                            onClick={(e) => handleTagClick(e, work.circle_name!)}
                            className="text-xs text-muted-foreground italic hover:text-primary transition-colors truncate block w-full text-left"
                        >
                            {work.circle_name}
                        </button>
                    )}

                    {/* CV Tags */}
                    {cvList.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                            {cvList.slice(0, 3).map((cv, i) => (
                                <button
                                    key={i}
                                    onClick={(e) => handleTagClick(e, cv)}
                                    className="text-[10px] px-1.5 py-0.5 bg-purple-500/10 text-purple-400 rounded hover:bg-purple-500/20 transition-colors truncate max-w-[80px]"
                                >
                                    {cv}
                                </button>
                            ))}
                            {cvList.length > 3 && (
                                <span className="text-[10px] text-muted-foreground/50">+{cvList.length - 3}</span>
                            )}
                        </div>
                    )}

                    {/* Genre Tags */}
                    {tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                            {tags.slice(0, 4).map((tag, i) => (
                                <button
                                    key={i}
                                    onClick={(e) => handleTagClick(e, tag)}
                                    className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary rounded hover:bg-primary/20 transition-colors truncate max-w-[80px]"
                                >
                                    {tag}
                                </button>
                            ))}
                            {tags.length > 4 && (
                                <span className="text-[10px] text-muted-foreground/50">+{tags.length - 4}</span>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <EditWorkDialog
                work={work}
                isOpen={isEditDialogOpen}
                onClose={() => setIsEditDialogOpen(false)}
            />

            {isTrackListOpen && (
                <TrackListDialog
                    work={work}
                    onClose={() => setIsTrackListOpen(false)}
                />
            )}
        </>
    )
}
