import { useState, useEffect } from 'react'
import { X, Plus, Loader2, ListMusic, Check } from 'lucide-react'
import { Playlist } from '../../../preload/index.d'

interface AddToPlaylistDialogProps {
    trackPath: string
    trackName: string
    workId: string | null
    onClose: () => void
}

export function AddToPlaylistDialog({ trackPath, trackName, workId, onClose }: AddToPlaylistDialogProps) {
    const [playlists, setPlaylists] = useState<Playlist[]>([])
    const [loading, setLoading] = useState(true)
    const [creating, setCreating] = useState(false)
    const [newPlaylistName, setNewPlaylistName] = useState('')
    const [addedTo, setAddedTo] = useState<Set<number>>(new Set())

    useEffect(() => {
        loadPlaylists()
    }, [])

    const loadPlaylists = async () => {
        const data = await window.api.getAllPlaylists()
        setPlaylists(data)
        setLoading(false)
    }

    const handleCreatePlaylist = async () => {
        if (!newPlaylistName.trim()) return
        setCreating(true)
        const newPlaylist = await window.api.createPlaylist(newPlaylistName.trim())
        if (newPlaylist) {
            await window.api.addTrackToPlaylist(newPlaylist.id, trackPath, trackName, workId)
            setAddedTo(new Set([...addedTo, newPlaylist.id]))
        }
        setNewPlaylistName('')
        setCreating(false)
        loadPlaylists()
    }

    const handleAddToPlaylist = async (playlistId: number) => {
        await window.api.addTrackToPlaylist(playlistId, trackPath, trackName, workId)
        setAddedTo(new Set([...addedTo, playlistId]))
    }

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4" onClick={onClose}>
            <div
                className="bg-card border border-border rounded-2xl w-full max-w-md max-h-[70vh] flex flex-col shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-4 border-b border-border flex items-center justify-between shrink-0">
                    <div className="min-w-0 flex-1">
                        <h2 className="text-lg font-bold">プレイリストに追加</h2>
                        <p className="text-sm text-muted-foreground truncate">{trackName}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-accent rounded-lg transition-colors shrink-0 ml-4"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Create New Playlist */}
                <div className="p-4 border-b border-border">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="新しいプレイリスト名..."
                            value={newPlaylistName}
                            onChange={(e) => setNewPlaylistName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleCreatePlaylist()}
                            className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        <button
                            onClick={handleCreatePlaylist}
                            disabled={!newPlaylistName.trim() || creating}
                            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-2"
                        >
                            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                            作成
                        </button>
                    </div>
                </div>

                {/* Playlist List */}
                <div className="flex-1 overflow-y-auto p-2">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : playlists.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                            <ListMusic className="w-12 h-12 mb-4 opacity-20" />
                            <p>プレイリストがありません</p>
                            <p className="text-sm mt-1">上のフォームから作成してください</p>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {playlists.map((playlist) => {
                                const isAdded = addedTo.has(playlist.id)
                                return (
                                    <button
                                        key={playlist.id}
                                        onClick={() => !isAdded && handleAddToPlaylist(playlist.id)}
                                        disabled={isAdded}
                                        className={`
                                            w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all
                                            ${isAdded
                                                ? 'bg-primary/10 border border-primary/20'
                                                : 'hover:bg-accent border border-transparent'
                                            }
                                        `}
                                    >
                                        <div className={`
                                            w-10 h-10 rounded-lg flex items-center justify-center shrink-0
                                            ${isAdded ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}
                                        `}>
                                            {isAdded ? <Check className="w-5 h-5" /> : <ListMusic className="w-5 h-5" />}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="font-medium truncate">{playlist.name}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {playlist.trackCount} 曲
                                            </div>
                                        </div>
                                        {isAdded && (
                                            <span className="text-xs text-primary font-medium">追加済み</span>
                                        )}
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
