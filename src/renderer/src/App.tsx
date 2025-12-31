import { useState, useEffect, useMemo } from 'react'
import { Disc3, Music2, Settings, ListMusic, FolderOpen, RefreshCw, Search, Play, Pause, SkipBack, SkipForward, Volume2, Moon, ArrowUpDown, Trash2, Filter } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSettingsStore } from './store/settings'
import { usePlayerStore } from './store/player'
import { useSearchStore } from './store/search'
import { WorkCard } from './components/WorkCard'
import { PlaylistManager } from './components/PlaylistManager'
import { FilterDialog } from './components/FilterDialog'
import { MiniPlayer } from './components/MiniPlayer'
import { SortOption } from '../../common/types'
import { encodePathForProtocol } from './utils/pathUtils'

const formatTime = (seconds: number) => {
    // Handle invalid values (Infinity, NaN, negative)
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

function App() {
    const [activeTab, setActiveTab] = useState<'library' | 'settings' | 'playlists' | 'queue'>('library')
    const [isFilterOpen, setIsFilterOpen] = useState(false)
    const { libraryPath, setLibraryPath } = useSettingsStore()
    const { searchQuery, sortBy, setSortBy, filters, clearFilters } = useSearchStore()
    const queryClient = useQueryClient()
    const [scrubProgress, setScrubProgress] = useState<number | null>(null)
    const [showMiniPlayer, setShowMiniPlayer] = useState(false)

    // Player state
    const {
        currentWork, playlist, currentIndex, isPlaying, progress, duration, volume,
        sleepTimerType, sleepTimerRemaining, isSeeking,
        playWork, togglePlay, next, prev, seek, setVolume, updateProgress, setSleepTimer, tickSleepTimer, playTrack
    } = usePlayerStore()

    // Queries
    const { data: works } = useQuery({
        queryKey: ['works', searchQuery, sortBy],
        queryFn: () => window.api.getWorks({ searchQuery, sortBy })
    })

    // Filter works based on advanced filters
    const filteredWorks = useMemo(() => {
        if (!works) return []

        return works.filter(work => {
            // Keyword filter (from header or dialog)
            if (searchQuery) {
                const keyword = searchQuery.toLowerCase()
                const matches =
                    work.id.toLowerCase().includes(keyword) ||
                    work.title?.toLowerCase().includes(keyword) ||
                    work.circle_name?.toLowerCase().includes(keyword) ||
                    work.cv_names?.toLowerCase().includes(keyword)
                if (!matches) return false
            }

            // CV filter
            if (filters.cvs.length > 0) {
                const workCvs = work.cv_names?.split(/[,、/／]/).map(cv => cv.trim()) || []
                const hasCv = filters.cvs.some(cv => workCvs.includes(cv))
                if (!hasCv) return false
            }

            // Tag filter
            if (filters.tags.length > 0) {
                const workTags = work.tags?.split(',').map(tag => tag.trim()) || []
                const hasTag = filters.tags.some(tag => workTags.includes(tag))
                if (!hasTag) return false
            }

            return true
        })
    }, [works, searchQuery, filters])

    const activeFilterCount = filters.cvs.length + filters.tags.length + (searchQuery ? 1 : 0)

    // Grouping for playback queue (Folder-based)
    const groupedQueue = useMemo(() => {
        const groups: { [key: string]: typeof playlist } = {}
        playlist.forEach(track => {
            const folder = track.name.includes('/') ? track.name.split('/')[0] : 'なし'
            if (!groups[folder]) groups[folder] = []
            groups[folder].push(track)
        })
        return groups
    }, [playlist])

    // Listen for work updates from scraper
    useEffect(() => {
        const unsubscribe = window.api.onWorkUpdated((workId) => {
            console.log(`[App] Work updated: ${workId}`)
            queryClient.invalidateQueries({ queryKey: ['works'] })
        })
        return unsubscribe
    }, [queryClient])

    // Mutations
    const scanMutation = useMutation({
        mutationFn: async (path: string) => {
            await window.api.scanDirectory(path)
            await window.api.startScraping()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['works'] })
        }
    })

    // Polling
    useEffect(() => {
        const interval = setInterval(() => {
            updateProgress()
            tickSleepTimer()
        }, 1000)
        return () => clearInterval(interval)
    }, [updateProgress, tickSleepTimer])

    // Handlers
    const handleSelectDirectory = async () => {
        const path = await window.api.selectDirectory()
        if (path) setLibraryPath(path)
    }

    const handleScan = () => {
        if (libraryPath) scanMutation.mutate(libraryPath)
    }

    const handleReset = async () => {
        if (window.confirm('ライブラリと再生履歴をすべて消去しますか？この操作は取り消せません。')) {
            await window.api.resetDatabase()
            queryClient.invalidateQueries({ queryKey: ['works'] })
        }
    }

    // currentTrack available if needed: playlist[currentIndex]

    return (
        <div className="flex h-screen w-full overflow-hidden bg-background text-foreground font-sans">
            {/* Sidebar */}
            <aside className="w-64 border-r border-border bg-card/30 flex flex-col">
                <div className="p-6">
                    <h1 className="text-2xl font-bold tracking-tight text-primary flex items-center gap-2">
                        <Music2 className="w-8 h-8" />
                        Resonate
                    </h1>
                </div>

                <nav className="flex-1 px-4 space-y-1">
                    <button
                        onClick={() => setActiveTab('library')}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${activeTab === 'library' ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-accent hover:text-foreground'}`}
                    >
                        <Disc3 className="w-5 h-5" />
                        ライブラリ
                    </button>
                    <button
                        onClick={() => setActiveTab('playlists')}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${activeTab === 'playlists' ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-accent hover:text-foreground'}`}
                    >
                        <ListMusic className="w-5 h-5" />
                        プレイリスト
                    </button>
                    <button
                        onClick={() => setActiveTab('queue')}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${activeTab === 'queue' ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-accent hover:text-foreground'}`}
                    >
                        <Play className="w-5 h-5" />
                        再生キュー
                        {playlist.length > 0 && (
                            <span className="ml-auto text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full font-bold">
                                {playlist.length}
                            </span>
                        )}
                    </button>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col relative overflow-hidden bg-gradient-to-br from-background via-background/50 to-primary/5">
                <header className="h-20 border-b border-border/50 flex items-center justify-between px-8 backdrop-blur-md bg-background/50 sticky top-0 z-10 transition-colors">
                    <h2 className="text-2xl font-bold capitalize tracking-tight">
                        {activeTab === 'library' ? 'ライブラリ' : activeTab === 'settings' ? '設定' : 'プレイリスト'}
                    </h2>

                    <div className="flex items-center gap-4">
                        {activeTab === 'library' && (
                            <>
                                <div className="relative flex items-center">
                                    <ArrowUpDown className="w-4 h-4 absolute left-3 text-muted-foreground pointer-events-none" />
                                    <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value as SortOption)}
                                        className="bg-muted/50 border border-border rounded-full pl-9 pr-8 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all appearance-none cursor-pointer"
                                    >
                                        <option value="added_desc">追加日（新しい順）</option>
                                        <option value="release_date_desc">発売日（新しい順）</option>
                                        <option value="last_played_desc">最近再生した順</option>
                                        <option value="title_asc">名前順（あいうえお順）</option>
                                    </select>
                                </div>
                                <button
                                    onClick={() => setIsFilterOpen(true)}
                                    className={`relative flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${activeFilterCount > 0 ? 'bg-primary text-primary-foreground' : 'bg-muted/50 border border-border hover:bg-accent'}`}
                                >
                                    <Filter className="w-4 h-4" />
                                    フィルター
                                    {activeFilterCount > 0 && (
                                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                                            {activeFilterCount}
                                        </span>
                                    )}
                                </button>
                                <button
                                    onClick={handleScan}
                                    disabled={scanMutation.isPending || !libraryPath}
                                    className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-1.5 rounded-full text-sm font-medium hover:opacity-90 shadow-lg shadow-primary/20 disabled:opacity-50 transition-all"
                                >
                                    <RefreshCw className={`w-4 h-4 ${scanMutation.isPending ? 'animate-spin' : ''}`} />
                                    スキャン
                                </button>
                            </>
                        )}
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    {activeTab === 'library' && (
                        <>
                            {/* Active filter pills */}
                            {activeFilterCount > 0 && (
                                <div className="flex flex-wrap items-center gap-2 mb-4">
                                    <span className="text-sm text-muted-foreground">フィルター:</span>
                                    {searchQuery && (
                                        <span className="px-2 py-1 bg-accent rounded-full text-xs">
                                            キーワード: {searchQuery}
                                        </span>
                                    )}
                                    {filters.cvs.map(cv => (
                                        <span key={cv} className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs">
                                            CV: {cv}
                                        </span>
                                    ))}
                                    {filters.tags.map(tag => (
                                        <span key={tag} className="px-2 py-1 bg-primary/20 text-primary rounded-full text-xs">
                                            {tag}
                                        </span>
                                    ))}
                                    <button
                                        onClick={clearFilters}
                                        className="px-2 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        クリア
                                    </button>
                                </div>
                            )}
                            {filteredWorks.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 gap-6">
                                    {filteredWorks.map((work) => (
                                        <WorkCard key={work.id} work={work} onClick={() => playWork(work)} />
                                    ))}
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-4">
                                    <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center animate-pulse">
                                        <Disc3 className="w-10 h-10 opacity-20 text-primary" />
                                    </div>
                                    <div className="text-center">
                                        <p className="font-medium text-lg text-foreground">
                                            {searchQuery || activeFilterCount > 0 ? '該当する作品が見つかりません' : 'ライブラリが空です'}
                                        </p>
                                        <p className="text-sm">
                                            {searchQuery || activeFilterCount > 0 ? 'フィルター条件を変えてみてください。' : '設定画面でライブラリのパスを指定し、スキャンを開始してください。'}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {activeTab === 'settings' && (
                        <div className="max-w-3xl space-y-12">
                            <section className="space-y-6">
                                <div>
                                    <h3 className="text-xl font-bold flex items-center gap-2">
                                        <FolderOpen className="w-5 h-5 text-primary" />
                                        ライブラリの場所
                                    </h3>
                                    <p className="text-sm text-muted-foreground mt-1">DLSiteの作品が保存されているディレクトリを指定してください。</p>
                                </div>

                                <div className="flex gap-3">
                                    <div className="flex-1 bg-muted/30 border border-border px-4 py-2.5 rounded-xl text-sm font-mono truncate h-11 flex items-center">
                                        {libraryPath || 'ディレクトリが選択されていません'}
                                    </div>
                                    <button
                                        onClick={handleSelectDirectory}
                                        className="bg-secondary text-secondary-foreground px-6 py-2.5 rounded-xl font-medium hover:bg-secondary/80 transition-all flex items-center gap-2 shadow-sm border border-border"
                                    >
                                        <FolderOpen className="w-4 h-4" />
                                        参照
                                    </button>
                                </div>
                            </section>

                            <section className="p-6 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-between">
                                <div className="space-y-1">
                                    <div className="font-bold">メタデータの強制取得</div>
                                    <div className="text-sm text-muted-foreground">DLSiteから不足している画像やタイトルを取得します。</div>
                                </div>
                                <button
                                    onClick={() => window.api.startScraping()}
                                    className="bg-background border border-border px-4 py-2 rounded-lg text-sm font-medium hover:bg-accent transition-all"
                                >
                                    スクレイパー開始
                                </button>
                            </section>

                            <section className="p-6 rounded-2xl bg-destructive/5 border border-destructive/10">
                                <h4 className="text-sm font-bold text-destructive flex items-center gap-2 mb-1">
                                    <Trash2 className="w-4 h-4" />
                                    危険な操作
                                </h4>
                                <div className="flex items-center justify-between">
                                    <div className="text-sm text-muted-foreground">データベースを初期化し、すべての作品情報と再生履歴を消去します。</div>
                                    <button
                                        onClick={handleReset}
                                        className="bg-destructive text-destructive-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-all shadow-lg shadow-destructive/20"
                                    >
                                        データベースを初期化
                                    </button>
                                </div>
                            </section>
                        </div>
                    )}

                    {activeTab === 'playlists' && (
                        <PlaylistManager />
                    )}

                    {activeTab === 'queue' && (
                        <div className="space-y-8">
                            {Object.entries(groupedQueue).length > 0 ? (
                                Object.entries(groupedQueue).map(([folder, tracks]) => (
                                    <section key={folder} className="space-y-4">
                                        <h3 className="text-xl font-bold flex items-center gap-2 text-primary">
                                            <FolderOpen className="w-5 h-5" />
                                            {folder}
                                        </h3>
                                        <div className="bg-card/50 border border-border rounded-2xl overflow-hidden shadow-sm">
                                            {tracks.map((track, i) => {
                                                const globalIdx = playlist.findIndex(t => t === track)
                                                const isActive = currentIndex === globalIdx
                                                return (
                                                    <button
                                                        key={`${track.path}-${i}`}
                                                        onClick={() => playTrack(globalIdx)}
                                                        className={`w-full flex items-center gap-4 px-6 py-3 hover:bg-white/5 transition-all text-left border-b border-border/50 last:border-0 ${isActive ? 'bg-primary/10 text-primary' : ''}`}
                                                    >
                                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                                                            {isActive ? <Play className="w-4 h-4 fill-current" /> : globalIdx + 1}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="font-medium truncate text-sm">{track.name.split('/').pop()}</div>
                                                            <div className="text-[10px] opacity-40 font-mono truncate mt-0.5">{track.path}</div>
                                                        </div>
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </section>
                                ))
                            ) : (
                                <div className="h-[60vh] flex flex-col items-center justify-center text-muted-foreground">
                                    <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
                                        <ListMusic className="w-10 h-10 opacity-20" />
                                    </div>
                                    <p className="text-lg font-medium text-foreground">再生キューは空です</p>
                                    <p className="text-sm">作品を選択して再生を開始してください。</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Player Bar - hidden when mini player is open */}
                {!showMiniPlayer && (
                    <footer className="h-28 bg-card/60 backdrop-blur-2xl border-t border-border/50 flex items-center px-8 gap-12 sticky bottom-0 z-10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
                        <div className="flex items-center gap-4 w-[28rem] shrink-0">
                            <button
                                onClick={() => setShowMiniPlayer(true)}
                                className="w-20 h-20 bg-muted rounded-xl shrink-0 overflow-hidden shadow-2xl relative group"
                            >
                                {currentWork?.thumbnail_path ? (
                                    <img
                                        src={`resonate-img://${encodePathForProtocol(currentWork.thumbnail_path)}`}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <Music2 className="w-full h-full p-5 text-muted-foreground opacity-20" />
                                )}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <Search className="w-6 h-6 text-white" />
                                </div>
                            </button>
                            <div className="min-w-0 flex-1">
                                <div className="font-bold truncate text-sm hover:text-primary cursor-pointer transition-colors">
                                    {currentIndex >= 0 && playlist[currentIndex] ? playlist[currentIndex].name : '再生停止中'}
                                </div>
                                <div className="text-xs text-muted-foreground truncate mt-1">
                                    {currentWork?.title || '作品を選択して再生を開始してください'}
                                </div>
                                <div className="text-[10px] text-primary font-bold mt-1 uppercase tracking-tighter opacity-70">
                                    {currentWork?.circle_name || ''}
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 flex flex-col items-center gap-3">
                            <div className="flex items-center gap-8">
                                <button onClick={prev} className="text-muted-foreground hover:text-foreground transition-all hover:scale-110 active:scale-95">
                                    <SkipBack className="w-5 h-5 fill-current" />
                                </button>
                                <button
                                    onClick={togglePlay}
                                    className="w-14 h-14 bg-primary text-primary-foreground rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/30"
                                >
                                    {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current translate-x-0.5" />}
                                </button>
                                <button onClick={next} className="text-muted-foreground hover:text-foreground transition-all hover:scale-110 active:scale-95">
                                    <SkipForward className="w-5 h-5 fill-current" />
                                </button>
                            </div>
                            <div className="w-full max-w-2xl flex items-center gap-4 text-[11px] font-mono text-muted-foreground">
                                <span className="w-10 text-right">{formatTime(scrubProgress ?? progress)}</span>
                                <div className="flex-1 h-2 bg-muted/50 rounded-full overflow-hidden cursor-pointer relative group shadow-inner">
                                    <input
                                        type="range"
                                        min={0}
                                        max={duration || 100}
                                        value={scrubProgress ?? progress}
                                        onInput={(e) => setScrubProgress(parseFloat(e.currentTarget.value))}
                                        onChange={(e) => {
                                            const val = parseFloat(e.target.value)
                                            seek(val)
                                            setScrubProgress(null)
                                        }}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    />
                                    <div
                                        className={`h-full bg-primary relative shadow-[0_0_10px_rgba(var(--primary),0.5)] ${isSeeking || scrubProgress !== null ? '' : 'transition-[width] duration-300'}`}
                                        style={{ width: `${((scrubProgress ?? progress) / (duration || 1)) * 100}%` }}
                                    >
                                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg scale-0 group-hover:scale-100 transition-transform"></div>
                                    </div>
                                </div>
                                <span className="w-10">{formatTime(duration)}</span>
                            </div>
                        </div>

                        <div className="w-[28rem] flex justify-end items-center gap-6">
                            <div className="flex flex-col items-end gap-1">
                                {sleepTimerType !== 'off' && (
                                    <span className="text-[10px] font-mono text-primary animate-pulse">
                                        タイマー: {sleepTimerRemaining ? formatTime(sleepTimerRemaining) : 'トラック終了時'}
                                    </span>
                                )}
                                <div className="flex bg-muted/30 p-1 rounded-lg border border-border/50">
                                    {(['off', '30', 'end'] as const).map((type) => (
                                        <button
                                            key={type}
                                            onClick={() => setSleepTimer(type)}
                                            className={`px-2 py-1 text-[10px] rounded-md transition-all ${sleepTimerType === type ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                                        >
                                            {type === 'off' ? 'OFF' : type === 'end' ? '終了時' : '30分'}
                                        </button>
                                    ))}
                                    <button className="px-2 py-1 text-muted-foreground hover:text-foreground">
                                        <Moon className={`w-3 h-3 ${sleepTimerType !== 'off' ? 'text-primary' : ''}`} />
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 group w-32 shrink-0">
                                <Volume2 className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                <div className="flex-1 h-1.5 bg-muted rounded-full relative shadow-inner">
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
                                        className="h-full bg-muted-foreground group-hover:bg-primary transition-all rounded-full"
                                        style={{ width: `${volume * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => setActiveTab('settings')}
                            className="p-2.5 hover:bg-accent rounded-xl transition-all hover:rotate-90 duration-500"
                        >
                            <Settings className="w-5 h-5 text-muted-foreground" />
                        </button>
                    </footer>
                )}
            </main>

            {/* Filter Dialog */}
            {isFilterOpen && works && (
                <FilterDialog
                    works={works}
                    onClose={() => setIsFilterOpen(false)}
                />
            )}

            {/* Mini Player */}
            {showMiniPlayer && currentWork && (
                <MiniPlayer onClose={() => setShowMiniPlayer(false)} />
            )}
        </div>
    )
}

export default App
