import { Disc3, Music2, RefreshCw } from 'lucide-react'
import type { Work } from '../../../common/types'

interface WorkCardProps {
    work: Work
    onClick?: () => void
}

export function WorkCard({ work, onClick }: WorkCardProps) {
    const thumbnailSrc = work.thumbnail_path
        ? `resonate-img://${encodeURIComponent(work.thumbnail_path)}`
        : null

    return (
        <div
            onClick={onClick}
            className="group relative bg-card rounded-xl border border-border overflow-hidden hover:border-primary/50 transition-all hover:shadow-2xl hover:shadow-primary/10 cursor-pointer"
        >
            <div className="aspect-[3/4] bg-muted relative overflow-hidden flex items-center justify-center">
                {thumbnailSrc ? (
                    <img
                        src={thumbnailSrc}
                        alt={work.title || work.id}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                ) : (
                    <Music2 className="w-16 h-16 text-muted-foreground opacity-20 group-hover:scale-110 transition-transform" />
                )}

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-primary-foreground shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform">
                        ▶
                    </div>
                </div>
            </div>

            <div className="p-4 space-y-1">
                <div className="text-[10px] font-bold text-primary uppercase tracking-wider">{work.id}</div>
                <div className="font-semibold truncate text-sm leading-tight h-10 line-clamp-2 overflow-hidden">
                    {work.title || 'Waiting for metadata...'}
                </div>
                <div className="text-xs text-muted-foreground truncate italic">
                    {work.circle_name || 'Unknown Circle'}
                </div>
            </div>
        </div>
    )
}
