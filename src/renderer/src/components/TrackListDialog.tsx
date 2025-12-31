import { useState, useEffect } from 'react'
import { X, Play, Music2, Folder, Loader2, ListPlus } from 'lucide-react'
import { Work } from '../../../common/types'
import { usePlayerStore } from '../store/player'
import { AddToPlaylistDialog } from './AddToPlaylistDialog'

interface TrackListDialogProps {
    work: Work
    onClose: () => void
}

interface Track {
    name: string
    path: string
}

interface GroupedTracks {
    [folder: string]: Track[]
}

export function TrackListDialog({ work, onClose }: TrackListDialogProps) {
    const [tracks, setTracks] = useState<Track[]>([])
    const [loading, setLoading] = useState(true)
    const [trackToAdd, setTrackToAdd] = useState<Track | null>(null)
    const { playWorkFromTrack, playlist, currentIndex, isPlaying, currentWork } = usePlayerStore()

    useEffect(() => {
        const loadTracks = async () => {
            const files = await window.api.getAudioFiles(work.local_path)
            setTracks(files)
            setLoading(false)
        }
        loadTracks()
    }, [work.local_path])

    // Group tracks by folder
    const groupedTracks: GroupedTracks = tracks.reduce((acc, track) => {
        const parts = track.name.split(/[/\\]/)
        const folder = parts.length > 1 ? parts.slice(0, -1).join('/') : '本編'
        if (!acc[folder]) acc[folder] = []
        acc[folder].push(track)
        return acc
    }, {} as GroupedTracks)

    const handlePlayTrack = (trackIndex: number) => {
        playWorkFromTrack(work, trackIndex)
        onClose()
    }

    // Check if this track is currently playing
    const isTrackPlaying = (track: Track) => {
        if (currentWork?.id !== work.id) return false
        const idx = playlist.findIndex(t => t.path === track.path)
        return idx === currentIndex && isPlaying
    }

    return (
        <>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
                <div
                    className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="p-6 border-b border-border flex items-center justify-between shrink-0">
                        <div className="min-w-0 flex-1">
                            <h2 className="text-lg font-bold truncate">{work.title || work.id}</h2>
                            <p className="text-sm text-muted-foreground truncate">{work.circle_name || 'トラック一覧'}</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-accent rounded-lg transition-colors shrink-0 ml-4"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Track List */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-6">
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            </div>
                        ) : tracks.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                                <Music2 className="w-12 h-12 mb-4 opacity-20" />
                                <p>音声ファイルが見つかりません</p>
                            </div>
                        ) : (
                            Object.entries(groupedTracks)
                                .sort((a, b) => {
                                    if (a[0] === '本編') return -1
                                    if (b[0] === '本編') return 1
                                    return a[0].localeCompare(b[0])
                                })
                                .map(([folder, folderTracks]) => (
                                    <div key={folder} className="space-y-2">
                                        <div className="flex items-center gap-2 text-primary font-bold text-xs tracking-widest uppercase border-b border-border/50 pb-2">
                                            <Folder className="w-3 h-3" />
                                            {folder}
                                            <span className="ml-auto text-[10px] bg-muted px-1.5 py-0.5 rounded-full text-muted-foreground font-medium">
                                                {folderTracks.length}
                                            </span>
                                        </div>
                                        <div className="space-y-1">
                                            {folderTracks.map((track) => {
                                                const globalIndex = tracks.indexOf(track)
                                                const displayName = track.name.split(/[/\\]/).pop() || track.name
                                                const playing = isTrackPlaying(track)

                                                return (
                                                    <button
                                                        key={track.path}
                                                        onClick={() => handlePlayTrack(globalIndex)}
                                                        className={`
                                                            group w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all
                                                            ${playing
                                                                ? 'bg-primary/10 border border-primary/20'
                                                                : 'hover:bg-accent border border-transparent'
                                                            }
                                                        `}
                                                    >
                                                        <div className={`
                                                            w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors
                                                            ${playing ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}
                                                        `}>
                                                            {playing ? (
                                                                <Music2 className="w-4 h-4 animate-pulse" />
                                                            ) : (
                                                                <Play className="w-4 h-4" />
                                                            )}
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <div className={`text-sm font-medium truncate ${playing ? 'text-primary' : ''}`}>
                                                                {displayName}
                                                            </div>
                                                        </div>
                                                        <span className="text-xs text-muted-foreground font-mono">
                                                            {String(globalIndex + 1).padStart(2, '0')}
                                                        </span>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                setTrackToAdd(track)
                                                            }}
                                                            className="p-1.5 hover:bg-primary/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                            title="プレイリストに追加"
                                                        >
                                                            <ListPlus className="w-4 h-4" />
                                                        </button>
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>
                                ))
                        )}
                    </div>
                </div>
            </div>

            {trackToAdd && (
                <AddToPlaylistDialog
                    trackPath={trackToAdd.path}
                    trackName={trackToAdd.name.split(/[/\\]/).pop() || trackToAdd.name}
                    workId={work.id}
                    onClose={() => setTrackToAdd(null)}
                />
            )}
        </>
    )
}
