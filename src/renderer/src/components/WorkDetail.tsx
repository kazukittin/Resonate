import { useState, useEffect } from 'react'
import { X, Play, Pause, User, Music, ChevronRight } from 'lucide-react'
import { Work } from '../../../common/types'
import { usePlayerStore } from '../store/player'
import { encodePathForProtocol } from '../utils/pathUtils'

interface WorkDetailProps {
    work: Work
    onClose: () => void
}

interface Track {
    name: string
    path: string
}

export function WorkDetail({ work, onClose }: WorkDetailProps) {
    const [tracks, setTracks] = useState<Track[]>([])
    const [loading, setLoading] = useState(true)

    const {
        currentWork, playlist, currentIndex, isPlaying,
        playWork, playWorkFromTrack, togglePlay
    } = usePlayerStore()

    // Load tracks
    useEffect(() => {
        const loadTracks = async () => {
            setLoading(true)
            try {
                const audioFiles = await window.api.getAudioFiles(work.local_path)
                setTracks(audioFiles)
            } catch (err) {
                console.error('Failed to load tracks:', err)
            }
            setLoading(false)
        }
        loadTracks()
    }, [work.local_path])

    const isCurrentWork = currentWork?.id === work.id
    const currentTrackPath = isCurrentWork && playlist[currentIndex] ? playlist[currentIndex].path : null

    const handlePlayAll = () => {
        playWork(work)
    }

    const handlePlayTrack = (index: number) => {
        if (isCurrentWork && playlist[index]?.path === tracks[index]?.path) {
            togglePlay()
        } else {
            playWorkFromTrack(work, index)
        }
    }

    const cvList = work.cv_names?.split(/[,、/／]/).map(cv => cv.trim()).filter(Boolean) || []
    const tagList = work.tags?.split(',').map(tag => tag.trim()).filter(Boolean) || []

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div
                className="bg-card border border-border rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header with artwork and info */}
                <div className="flex gap-6 p-6 border-b border-border bg-gradient-to-br from-card to-primary/5">
                    {/* Artwork */}
                    <div className="w-48 h-48 rounded-xl overflow-hidden shadow-2xl shrink-0 relative group">
                        {work.thumbnail_path ? (
                            <img
                                src={`resonate-img://${encodePathForProtocol(work.thumbnail_path)}`}
                                className="w-full h-full object-cover"
                                alt={work.title || work.id}
                            />
                        ) : (
                            <div className="w-full h-full bg-muted flex items-center justify-center">
                                <Music className="w-16 h-16 text-muted-foreground/30" />
                            </div>
                        )}
                        {/* Play overlay */}
                        <button
                            onClick={handlePlayAll}
                            className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                        >
                            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center shadow-xl">
                                <Play className="w-8 h-8 text-primary-foreground fill-current translate-x-0.5" />
                            </div>
                        </button>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                                <div className="text-xs font-bold text-primary mb-1">{work.id}</div>
                                <h2 className="text-xl font-bold leading-tight line-clamp-2">
                                    {work.title || work.id}
                                </h2>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-accent rounded-lg transition-colors shrink-0"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Circle & CV */}
                        <div className="flex flex-wrap items-center gap-3 mt-3 text-sm">
                            {work.circle_name && (
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                    <User className="w-4 h-4" />
                                    <span className="font-medium text-foreground">{work.circle_name}</span>
                                </div>
                            )}
                        </div>

                        {/* CVs */}
                        {cvList.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-3">
                                {cvList.map((cv, i) => (
                                    <span key={i} className="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded-full text-xs font-medium">
                                        {cv}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Tags */}
                        {tagList.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                                {tagList.slice(0, 8).map((tag, i) => (
                                    <span key={i} className="px-2 py-0.5 bg-muted text-muted-foreground rounded-full text-xs">
                                        {tag}
                                    </span>
                                ))}
                                {tagList.length > 8 && (
                                    <span className="px-2 py-0.5 text-muted-foreground text-xs">
                                        +{tagList.length - 8}
                                    </span>
                                )}
                            </div>
                        )}

                        {/* Play button */}
                        <button
                            onClick={handlePlayAll}
                            className="mt-4 flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2 rounded-full text-sm font-bold hover:opacity-90 transition-opacity shadow-lg shadow-primary/30"
                        >
                            <Play className="w-4 h-4 fill-current" />
                            最初から再生
                        </button>
                    </div>
                </div>

                {/* Track List */}
                <div className="flex-1 overflow-y-auto">
                    <div className="px-6 py-3 border-b border-border sticky top-0 bg-card z-10">
                        <h3 className="text-sm font-bold text-muted-foreground flex items-center gap-2">
                            <Music className="w-4 h-4" />
                            ファイル一覧
                            <span className="text-xs bg-muted px-2 py-0.5 rounded-full ml-2">{tracks.length} トラック</span>
                        </h3>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-12 text-muted-foreground">
                            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mr-3" />
                            読み込み中...
                        </div>
                    ) : tracks.length === 0 ? (
                        <div className="flex items-center justify-center py-12 text-muted-foreground">
                            音声ファイルが見つかりません
                        </div>
                    ) : (
                        <div>
                            {tracks.map((track, index) => {
                                const isActiveTrack = currentTrackPath === track.path
                                const fileName = track.name.split('/').pop()?.replace(/\.[^/.]+$/, '') || track.name

                                return (
                                    <button
                                        key={track.path}
                                        onClick={() => handlePlayTrack(index)}
                                        className={`w-full flex items-center gap-4 px-6 py-3 hover:bg-white/5 transition-all text-left border-b border-border/30 last:border-0 ${isActiveTrack ? 'bg-primary/10' : ''}`}
                                    >
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${isActiveTrack ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                                            {isActiveTrack && isPlaying ? (
                                                <Pause className="w-4 h-4 fill-current" />
                                            ) : isActiveTrack ? (
                                                <Play className="w-4 h-4 fill-current translate-x-0.5" />
                                            ) : (
                                                <span className="text-sm font-bold">{index + 1}</span>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className={`font-medium truncate text-sm ${isActiveTrack ? 'text-primary' : ''}`}>
                                                {fileName}
                                            </div>
                                            <div className="text-[10px] text-muted-foreground truncate mt-0.5 font-mono opacity-50">
                                                {track.name}
                                            </div>
                                        </div>
                                        <ChevronRight className={`w-4 h-4 shrink-0 ${isActiveTrack ? 'text-primary' : 'text-muted-foreground/30'}`} />
                                    </button>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
