import { useState, useEffect } from 'react'
import { Disc3, Music2, Settings, ListMusic, FolderOpen, RefreshCw, Search, Play, Pause, SkipBack, SkipForward, Volume2, Moon } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSettingsStore } from './store/settings'
import { usePlayerStore } from './store/player'
import { WorkCard } from './components/WorkCard'

const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = Math.floor(seconds % 60)
    return [h, m, s]
        .map(v => v < 10 ? '0' + v : v)
        .filter((v, i) => v !== '00' || i > 0)
        .join(':')
}

function App() {
    const [activeTab, setActiveTab] = useState('library')
    const { libraryPath, setLibraryPath } = useSettingsStore()
    const queryClient = useQueryClient()

    // Player state
    const {
        currentWork, playlist, currentIndex, isPlaying, progress, duration, volume,
        sleepTimerType, sleepTimerRemaining,
        playWork, togglePlay, next, prev, seek, setVolume, updateProgress, setSleepTimer, tickSleepTimer
    } = usePlayerStore()

    // Queries
    const { data: works } = useQuery({
        queryKey: ['works'],
        queryFn: () => window.api.getWorks()
    })

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

    const currentTrack = playlist[currentIndex]

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
                        Library
                    </button>
                    <button
                        onClick={() => setActiveTab('playlists')}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${activeTab === 'playlists' ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-accent hover:text-foreground'}`}
                    >
                        <ListMusic className="w-5 h-5" />
                        Playlists
                    </button>
                </nav>

                <div className="p-4 border-t border-border">
                    <button
                        onClick={() => setActiveTab('settings')}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${activeTab === 'settings' ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-accent hover:text-foreground'}`}
                    >
                        <Settings className="w-5 h-5" />
                        Settings
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col relative overflow-hidden bg-gradient-to-br from-background via-background/50 to-primary/5">
                <header className="h-20 border-b border-border/50 flex items-center justify-between px-8 backdrop-blur-md bg-background/50 sticky top-0 z-10 transition-colors">
                    <h2 className="text-2xl font-bold capitalize tracking-tight">{activeTab}</h2>

                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Search works..."
                                className="bg-muted/50 border border-border rounded-full pl-10 pr-4 py-1.5 w-64 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all border-none shadow-inner"
                            />
                        </div>
                        {activeTab === 'library' && (
                            <button
                                onClick={handleScan}
                                disabled={scanMutation.isPending || !libraryPath}
                                className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-1.5 rounded-full text-sm font-medium hover:opacity-90 shadow-lg shadow-primary/20 disabled:opacity-50 transition-all"
                            >
                                <RefreshCw className={`w-4 h-4 ${scanMutation.isPending ? 'animate-spin' : ''}`} />
                                Scan Library
                            </button>
                        )}
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    {activeTab === 'library' && (
                        <>
                            {works && works.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 gap-6">
                                    {works.map((work) => (
                                        <WorkCard key={work.id} work={work} onClick={() => playWork(work)} />
                                    ))}
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-4">
                                    <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center animate-pulse">
                                        <Disc3 className="w-10 h-10 opacity-20 text-primary" />
                                    </div>
                                    <div className="text-center">
                                        <p className="font-medium text-lg text-foreground">Library is empty</p>
                                        <p className="text-sm">Configure your library path in Settings and scan for works.</p>
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
                                        Library Location
                                    </h3>
                                    <p className="text-sm text-muted-foreground mt-1">Specify where your DLSite works are stored.</p>
                                </div>

                                <div className="flex gap-3">
                                    <div className="flex-1 bg-muted/30 border border-border px-4 py-2.5 rounded-xl text-sm font-mono truncate h-11 flex items-center">
                                        {libraryPath || 'No directory selected'}
                                    </div>
                                    <button
                                        onClick={handleSelectDirectory}
                                        className="bg-secondary text-secondary-foreground px-6 py-2.5 rounded-xl font-medium hover:bg-secondary/80 transition-all flex items-center gap-2 shadow-sm border border-border"
                                    >
                                        <FolderOpen className="w-4 h-4" />
                                        Browse
                                    </button>
                                </div>
                            </section>

                            <section className="p-6 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-between">
                                <div className="space-y-1">
                                    <div className="font-bold">Force Re-fetch Metadata</div>
                                    <div className="text-sm text-muted-foreground">Scrape missing covers and titles from DLSite.</div>
                                </div>
                                <button
                                    onClick={() => window.api.startScraping()}
                                    className="bg-background border border-border px-4 py-2 rounded-lg text-sm font-medium hover:bg-accent transition-all"
                                >
                                    Start Scraper
                                </button>
                            </section>
                        </div>
                    )}
                </div>

                {/* Player Bar */}
                <footer className="h-28 bg-card/60 backdrop-blur-2xl border-t border-border/50 flex items-center px-8 gap-12 sticky bottom-0 z-10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
                    <div className="flex items-center gap-4 w-[28rem] shrink-0">
                        <div className="w-20 h-20 bg-muted rounded-xl shrink-0 overflow-hidden shadow-2xl relative group">
                            {currentWork?.thumbnail_path ? (
                                <img
                                    src={`resonate-img://${encodeURIComponent(currentWork.thumbnail_path)}`}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <Music2 className="w-full h-full p-5 text-muted-foreground opacity-20" />
                            )}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <button className="text-white hover:scale-110 transition-transform"><Search className="w-6 h-6" /></button>
                            </div>
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="font-bold truncate text-sm hover:text-primary cursor-pointer transition-colors">
                                {currentTrack?.name || 'Not Playing'}
                            </div>
                            <div className="text-xs text-muted-foreground truncate mt-1">
                                {currentWork?.title || 'Select a work to start'}
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
                            <span className="w-10 text-right">{formatTime(progress)}</span>
                            <div className="flex-1 h-2 bg-muted/50 rounded-full overflow-hidden cursor-pointer relative group shadow-inner">
                                <input
                                    type="range"
                                    min={0}
                                    max={duration || 100}
                                    value={progress}
                                    onChange={(e) => seek(parseFloat(e.target.value))}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                />
                                <div
                                    className="h-full bg-primary relative transition-[width] duration-300 shadow-[0_0_10px_rgba(var(--primary),0.5)]"
                                    style={{ width: `${(progress / (duration || 1)) * 100}%` }}
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
                                    Timer: {sleepTimerRemaining ? formatTime(sleepTimerRemaining) : 'End of Track'}
                                </span>
                            )}
                            <div className="flex bg-muted/30 p-1 rounded-lg border border-border/50">
                                {(['off', '30', 'end'] as const).map((type) => (
                                    <button
                                        key={type}
                                        onClick={() => setSleepTimer(type)}
                                        className={`px-2 py-1 text-[10px] rounded-md transition-all ${sleepTimerType === type ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                                    >
                                        {type === 'off' ? 'OFF' : type === 'end' ? 'Track' : '30m'}
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
                    <button className="p-2.5 hover:bg-accent rounded-xl transition-all hover:rotate-90 duration-500">
                        <Settings className="w-5 h-5 text-muted-foreground" />
                    </button>
                </footer>
            </main>
        </div>
    )
}

export default App
