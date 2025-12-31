import { useState, useEffect } from 'react'
import { Plus, ListMusic, Play, Trash2, Edit2, Loader2, Music2, X, Check } from 'lucide-react'
import { Playlist, PlaylistTrack } from '../../../preload/index.d'
import { usePlayerStore } from '../store/player'

export function PlaylistManager() {
    const [playlists, setPlaylists] = useState<Playlist[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null)
    const [playlistTracks, setPlaylistTracks] = useState<PlaylistTrack[]>([])
    const [loadingTracks, setLoadingTracks] = useState(false)
    const [isCreating, setIsCreating] = useState(false)
    const [newName, setNewName] = useState('')
    const [editingId, setEditingId] = useState<number | null>(null)
    const [editName, setEditName] = useState('')

    const { playWorkFromTrack } = usePlayerStore()

    useEffect(() => {
        loadPlaylists()
    }, [])

    const loadPlaylists = async () => {
        setLoading(true)
        const data = await window.api.getAllPlaylists()
        setPlaylists(data)
        setLoading(false)
    }

    const loadTracks = async (playlistId: number) => {
        setLoadingTracks(true)
        const tracks = await window.api.getPlaylistTracks(playlistId)
        setPlaylistTracks(tracks)
        setLoadingTracks(false)
    }

    const handleSelectPlaylist = async (playlist: Playlist) => {
        setSelectedPlaylist(playlist)
        await loadTracks(playlist.id)
    }

    const handleCreatePlaylist = async () => {
        if (!newName.trim()) return
        await window.api.createPlaylist(newName.trim())
        setNewName('')
        setIsCreating(false)
        loadPlaylists()
    }

    const handleDeletePlaylist = async (id: number) => {
        if (!confirm('このプレイリストを削除しますか？')) return
        await window.api.deletePlaylist(id)
        if (selectedPlaylist?.id === id) {
            setSelectedPlaylist(null)
            setPlaylistTracks([])
        }
        loadPlaylists()
    }

    const handleRenamePlaylist = async (id: number) => {
        if (!editName.trim()) return
        await window.api.renamePlaylist(id, editName.trim())
        setEditingId(null)
        setEditName('')
        loadPlaylists()
        if (selectedPlaylist?.id === id) {
            setSelectedPlaylist({ ...selectedPlaylist, name: editName.trim() })
        }
    }

    const handleRemoveTrack = async (trackId: number) => {
        await window.api.removeTrackFromPlaylist(trackId)
        if (selectedPlaylist) {
            loadTracks(selectedPlaylist.id)
        }
        loadPlaylists()
    }

    const handlePlayPlaylist = async () => {
        if (!playlistTracks.length) return
        // Play the first track
        // Note: This requires custom implementation since tracks may be from different works
        // For now, we'll just play each track individually
        const firstTrack = playlistTracks[0]
        if (firstTrack.work_id) {
            const works = await window.api.getWorks({ sortBy: 'added_desc' })
            const work = works.find(w => w.id === firstTrack.work_id)
            if (work) {
                // Find the track index in the work
                const audioFiles = await window.api.getAudioFiles(work.local_path)
                const trackIndex = audioFiles.findIndex(f => f.path === firstTrack.track_path)
                if (trackIndex !== -1) {
                    playWorkFromTrack(work, trackIndex)
                }
            }
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-20">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">プレイリスト</h2>
                {!isCreating && (
                    <button
                        onClick={() => setIsCreating(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-all"
                    >
                        <Plus className="w-4 h-4" />
                        新規作成
                    </button>
                )}
            </div>

            {/* Create New Playlist Form */}
            {isCreating && (
                <div className="flex gap-2 p-4 bg-card rounded-xl border border-border">
                    <input
                        type="text"
                        placeholder="プレイリスト名を入力..."
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleCreatePlaylist()}
                        autoFocus
                        className="flex-1 px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <button
                        onClick={handleCreatePlaylist}
                        disabled={!newName.trim()}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 disabled:opacity-50 transition-all"
                    >
                        作成
                    </button>
                    <button
                        onClick={() => {
                            setIsCreating(false)
                            setNewName('')
                        }}
                        className="px-4 py-2 bg-muted text-muted-foreground rounded-lg hover:bg-accent transition-all"
                    >
                        キャンセル
                    </button>
                </div>
            )}

            {/* Playlist List & Detail View */}
            <div className="grid grid-cols-[300px_1fr] gap-6">
                {/* Playlist List */}
                <div className="space-y-2">
                    {playlists.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                            <ListMusic className="w-12 h-12 mb-4 opacity-20" />
                            <p>プレイリストがありません</p>
                            <p className="text-sm mt-1">「新規作成」から作成してください</p>
                        </div>
                    ) : (
                        playlists.map((playlist) => (
                            <div
                                key={playlist.id}
                                className={`
                                    group flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border
                                    ${selectedPlaylist?.id === playlist.id
                                        ? 'bg-primary/10 border-primary/20'
                                        : 'hover:bg-card border-transparent hover:border-border'
                                    }
                                `}
                                onClick={() => handleSelectPlaylist(playlist)}
                            >
                                <div className={`
                                    w-10 h-10 rounded-lg flex items-center justify-center shrink-0
                                    ${selectedPlaylist?.id === playlist.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}
                                `}>
                                    <ListMusic className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    {editingId === playlist.id ? (
                                        <div className="flex gap-1">
                                            <input
                                                type="text"
                                                value={editName}
                                                onChange={(e) => setEditName(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleRenamePlaylist(playlist.id)}
                                                onClick={(e) => e.stopPropagation()}
                                                autoFocus
                                                className="flex-1 px-2 py-1 bg-background border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                            />
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleRenamePlaylist(playlist.id)
                                                }}
                                                className="p-1 hover:bg-primary/20 rounded"
                                            >
                                                <Check className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    setEditingId(null)
                                                    setEditName('')
                                                }}
                                                className="p-1 hover:bg-accent rounded"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="font-medium truncate">{playlist.name}</div>
                                            <div className="text-xs text-muted-foreground">{playlist.trackCount} 曲</div>
                                        </>
                                    )}
                                </div>
                                {editingId !== playlist.id && (
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                setEditingId(playlist.id)
                                                setEditName(playlist.name)
                                            }}
                                            className="p-1.5 hover:bg-accent rounded-lg transition-colors"
                                            title="名前を変更"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                handleDeletePlaylist(playlist.id)
                                            }}
                                            className="p-1.5 hover:bg-destructive/20 text-destructive rounded-lg transition-colors"
                                            title="削除"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>

                {/* Playlist Detail */}
                <div className="bg-card rounded-xl border border-border p-4 min-h-[400px]">
                    {selectedPlaylist ? (
                        <>
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="text-lg font-bold">{selectedPlaylist.name}</h3>
                                    <p className="text-sm text-muted-foreground">{playlistTracks.length} 曲</p>
                                </div>
                                {playlistTracks.length > 0 && (
                                    <button
                                        onClick={handlePlayPlaylist}
                                        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-all"
                                    >
                                        <Play className="w-4 h-4" />
                                        再生
                                    </button>
                                )}
                            </div>

                            {loadingTracks ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                                </div>
                            ) : playlistTracks.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                                    <Music2 className="w-12 h-12 mb-4 opacity-20" />
                                    <p>トラックがありません</p>
                                    <p className="text-sm mt-1">作品のトラック一覧から追加できます</p>
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    {playlistTracks.map((track, index) => (
                                        <div
                                            key={track.id}
                                            className="group flex items-center gap-3 p-3 rounded-xl hover:bg-accent transition-all"
                                        >
                                            <span className="text-xs text-muted-foreground font-mono w-6">
                                                {String(index + 1).padStart(2, '0')}
                                            </span>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium truncate">{track.track_name}</div>
                                                {track.work_id && (
                                                    <div className="text-xs text-muted-foreground truncate">{track.work_id}</div>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => handleRemoveTrack(track.id)}
                                                className="p-1.5 hover:bg-destructive/20 text-destructive rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                title="削除"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                            <ListMusic className="w-12 h-12 mb-4 opacity-20" />
                            <p>プレイリストを選択してください</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
