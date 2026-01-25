import { useEffect, useState, useRef } from 'react'
import { Play, Plus, ListMusic, Check } from 'lucide-react'
import { Playlist } from '../../../preload/index.d'

interface TrackContextMenuProps {
    x: number
    y: number
    trackPath: string
    trackName: string
    workId: string
    onClose: () => void
    onPlay: () => void
    onAddToNewPlaylist: () => void
}

export function TrackContextMenu({
    x,
    y,
    trackPath,
    trackName,
    workId,
    onClose,
    onPlay,
    onAddToNewPlaylist
}: TrackContextMenuProps) {
    const [playlists, setPlaylists] = useState<Playlist[]>([])
    const [addedTo, setAddedTo] = useState<Set<number>>(new Set())
    const menuRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const loadPlaylists = async () => {
            const data = await window.api.getAllPlaylists()
            setPlaylists(data)
        }
        loadPlaylists()

        // Close on outside click is handled by a transparent overlay in parent or click listener
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onClose()
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [onClose])

    const handleAddToPlaylist = async (playlistId: number) => {
        await window.api.addTrackToPlaylist(playlistId, trackPath, trackName, workId)
        setAddedTo(prev => new Set([...prev, playlistId]))
        // Don't close immediately so user can see feedback? Or close?
        // Let's close after a short delay or immediately.
        // For intuition, maybe immediate feedback then close is good, or just feedback.
        // Let's keep it open to allow adding to multiple? No, usually context menu closes.
        setTimeout(onClose, 200)
    }

    // Adjust position to not overflow screen
    // Simple logic: if close to bottom/right, shift up/left
    // dynamic styles would be better but simple logic for now

    return (
        <div
            ref={menuRef}
            className="fixed z-[100] min-w-[220px] bg-popover/95 backdrop-blur border border-border rounded-lg shadow-xl p-1.5 animation-in fade-in zoom-in-95 duration-100"
            style={{
                top: Math.min(y, window.innerHeight - 300),
                left: Math.min(x, window.innerWidth - 250)
            }}
            onClick={e => e.stopPropagation()}
        >
            <div className="text-xs font-medium text-muted-foreground px-2 py-1.5 truncate max-w-[200px] border-b border-border/50 mb-1">
                {trackName}
            </div>

            <button
                onClick={() => {
                    onPlay()
                    onClose()
                }}
                className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md hover:bg-accent text-foreground transition-colors text-left"
            >
                <Play className="w-4 h-4 mr-1" />
                再生
            </button>

            <div className="h-px bg-border my-1.5" />

            <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">
                プレイリストに追加
            </div>

            <button
                onClick={() => {
                    onAddToNewPlaylist()
                    onClose()
                }}
                className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md hover:bg-accent text-foreground transition-colors text-left"
            >
                <Plus className="w-4 h-4 mr-1" />
                新規プレイリスト...
            </button>

            <div className="max-h-[200px] overflow-y-auto mt-1 custom-scrollbar">
                {playlists.length === 0 ? (
                    <div className="px-2 py-2 text-xs text-muted-foreground text-center">
                        リストなし
                    </div>
                ) : (
                    playlists.map(playlist => {
                        const isAdded = addedTo.has(playlist.id)
                        return (
                            <button
                                key={playlist.id}
                                onClick={() => handleAddToPlaylist(playlist.id)}
                                className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md hover:bg-accent text-foreground transition-colors text-left"
                            >
                                <ListMusic className="w-4 h-4 mr-1 opacity-70" />
                                <span className="flex-1 truncate">{playlist.name}</span>
                                {isAdded && <Check className="w-3 h-3 text-primary" />}
                            </button>
                        )
                    })
                )}
            </div>
        </div>
    )
}
