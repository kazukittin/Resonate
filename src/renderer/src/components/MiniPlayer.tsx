import { Play, Pause, SkipBack, SkipForward, X, Volume2, Rewind, FastForward } from 'lucide-react'
import { usePlayerStore } from '../store/player'
import { encodePathForProtocol } from '../utils/pathUtils'

const formatTime = (seconds: number) => {
    if (!isFinite(seconds) || isNaN(seconds) || seconds < 0) {
        return '--:--'
    }
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = Math.floor(seconds % 60)
    return [h, m, s]
        .map(v => v < 10 ? '0' + v : v)
        .filter((v, i) => v !== '00' || i > 0)
        .join(':')
}

interface MiniPlayerProps {
    onClose: () => void
}

export function MiniPlayer({ onClose }: MiniPlayerProps) {
    const {
        currentWork, playlist, currentIndex, isPlaying, progress, duration, volume,
        togglePlay, next, prev, seek, setVolume
    } = usePlayerStore()

    const currentTrack = playlist[currentIndex]

    if (!currentTrack) return null

    const handleSeekBack = () => {
        seek(Math.max(0, progress - 5))
    }

    const handleSeekForward = () => {
        seek(Math.min(duration, progress + 30))
    }

    return (
        <div className="fixed bottom-6 right-6 w-80 bg-card/95 backdrop-blur-xl border border-border rounded-2xl shadow-2xl z-50 overflow-hidden">
            {/* Header with close button */}
            <div className="flex items-center justify-between p-3 border-b border-border/50">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Now Playing</span>
                <button
                    onClick={onClose}
                    className="p-1 hover:bg-accent rounded-lg transition-colors"
                >
                    <X className="w-4 h-4 text-muted-foreground" />
                </button>
            </div>

            {/* Artwork */}
            <div className="relative aspect-square w-full bg-muted">
                {currentWork?.thumbnail_path ? (
                    <img
                        src={`resonate-img://${encodePathForProtocol(currentWork.thumbnail_path)}`}
                        className="w-full h-full object-cover"
                        alt={currentWork.title || ''}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                        <Volume2 className="w-16 h-16 text-primary/30" />
                    </div>
                )}
                {/* Gradient overlay */}
                <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-card to-transparent" />
            </div>

            {/* Track Info */}
            <div className="px-4 -mt-8 relative z-10">
                <div className="font-bold text-sm leading-tight line-clamp-2">
                    {currentTrack.name.split('/').pop()?.replace(/\.[^/.]+$/, '')}
                </div>
                <div className="text-xs text-muted-foreground mt-1 truncate">
                    {currentWork?.title || currentWork?.circle_name || ''}
                </div>
            </div>

            {/* Progress Bar */}
            <div className="px-4 mt-4">
                <div className="relative h-1 bg-muted rounded-full overflow-hidden group cursor-pointer">
                    <input
                        type="range"
                        min={0}
                        max={duration || 100}
                        value={progress}
                        onChange={(e) => seek(parseFloat(e.target.value))}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${(progress / (duration || 1)) * 100}%` }}
                    />
                </div>
                <div className="flex justify-between mt-1.5 text-[10px] text-muted-foreground font-mono">
                    <span>{formatTime(progress)}</span>
                    <span>{formatTime(duration)}</span>
                </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-4 py-4">
                <button
                    onClick={prev}
                    className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                    <SkipBack className="w-5 h-5 fill-current" />
                </button>
                <button
                    onClick={handleSeekBack}
                    className="p-2 text-muted-foreground hover:text-foreground transition-colors relative"
                >
                    <Rewind className="w-5 h-5" />
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[8px] font-bold">5</span>
                </button>
                <button
                    onClick={togglePlay}
                    className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shadow-lg shadow-primary/30"
                >
                    {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current translate-x-0.5" />}
                </button>
                <button
                    onClick={handleSeekForward}
                    className="p-2 text-muted-foreground hover:text-foreground transition-colors relative"
                >
                    <FastForward className="w-5 h-5" />
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[8px] font-bold">30</span>
                </button>
                <button
                    onClick={next}
                    className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                    <SkipForward className="w-5 h-5 fill-current" />
                </button>
            </div>

            {/* Volume */}
            <div className="flex items-center gap-3 px-4 pb-4">
                <Volume2 className="w-4 h-4 text-muted-foreground shrink-0" />
                <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden relative group">
                    <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.01}
                        value={volume}
                        onChange={(e) => setVolume(parseFloat(e.target.value))}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div
                        className="h-full bg-muted-foreground group-hover:bg-primary transition-colors rounded-full"
                        style={{ width: `${volume * 100}%` }}
                    />
                </div>
            </div>
        </div>
    )
}
