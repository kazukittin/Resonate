import { create } from 'zustand'
import { Howl } from 'howler'
import { Work } from '../../../common/types'

interface Track {
    name: string
    path: string
}

interface PlayerState {
    currentWork: Work | null
    playlist: Track[]
    currentIndex: number
    howl: Howl | null
    isPlaying: boolean
    progress: number // Current position in seconds
    duration: number // Total duration in seconds
    volume: number
    isSeeking: boolean
    sleepTimerType: 'off' | '15' | '30' | '60' | 'end'
    sleepTimerRemaining: number | null // seconds

    // Actions
    playWork: (work: Work) => Promise<void>
    playWorkFromTrack: (work: Work, trackIndex: number) => Promise<void>
    playTrack: (index: number) => void
    togglePlay: () => void
    seek: (seconds: number) => void
    setVolume: (volume: number) => void
    setSleepTimer: (type: 'off' | '15' | '30' | '60' | 'end') => void
    tickSleepTimer: () => void
    next: () => void
    prev: () => void
    updateProgress: () => void
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
    currentWork: null,
    playlist: [],
    currentIndex: -1,
    howl: null,
    isPlaying: false,
    progress: 0,
    duration: 0,
    volume: 0.8,
    isSeeking: false,
    sleepTimerType: 'off',
    sleepTimerRemaining: null,

    playWork: async (work: Work) => {
        // 1. Get audio files
        const tracks = await window.api.getAudioFiles(work.local_path)
        if (tracks.length === 0) return

        // 2. Get resume position
        const resume = await window.api.getPosition(work.id)

        let startIndex = 0
        let startPosition = 0

        if (resume) {
            const idx = tracks.findIndex(t => t.path === resume.file_path)
            if (idx !== -1) {
                startIndex = idx
                startPosition = resume.last_position
            }
        }

        set({ currentWork: work, playlist: tracks, currentIndex: startIndex })
        get().playTrack(startIndex)

        // Seek to resume position if any
        if (startPosition > 0) {
            setTimeout(() => get().seek(startPosition), 500)
        }
    },

    playWorkFromTrack: async (work: Work, trackIndex: number) => {
        // 1. Get audio files
        const tracks = await window.api.getAudioFiles(work.local_path)
        if (tracks.length === 0) return

        // Ensure trackIndex is valid
        const startIndex = Math.min(Math.max(0, trackIndex), tracks.length - 1)

        set({ currentWork: work, playlist: tracks, currentIndex: startIndex })
        get().playTrack(startIndex)
    },

    playTrack: (index: number) => {
        const { playlist, howl: oldHowl, volume, currentWork } = get()
        const track = playlist[index]
        if (!track) return

        if (oldHowl) {
            oldHowl.stop()
            oldHowl.unload()
        }
        // Properly encode the path for URL usage
        // We need to encode each path segment individually to preserve / and :
        const encodePath = (p: string) => {
            // Replace backslashes with forward slashes
            const normalized = p.replace(/\\/g, '/')
            // Split, encode each segment, rejoin
            const parts = normalized.split('/')
            return parts.map((part, i) => {
                // Don't encode drive letter (e.g., "C:")
                if (i === 0 && /^[A-Za-z]:$/.test(part)) {
                    return part.toLowerCase().replace(':', '') // C: -> c
                }
                return encodeURIComponent(part)
            }).join('/')
        }

        const audioUrl = `resonate-audio://${encodePath(track.path)}`
        const format = track.path.split('.').pop()?.toLowerCase() || 'mp3'

        // Use Web Audio API (html5: false) for MP3 and WAV to get accurate duration
        // Use HTML5 mode for other formats (m4a, flac, etc.) for streaming support
        const useHtml5 = format !== 'mp3' && format !== 'wav'

        console.log('[Player] Loading audio:', audioUrl, 'format:', format, 'html5:', useHtml5)

        const newHowl = new Howl({
            src: [audioUrl],
            html5: useHtml5,
            format: [format],
            volume: volume,
            onplay: () => {
                set({ isPlaying: true, duration: newHowl.duration() })
            },
            onpause: () => set({ isPlaying: false }),
            onstop: () => set({ isPlaying: false, progress: 0 }),
            onend: () => {
                if (get().sleepTimerType === 'end') {
                    set({ sleepTimerType: 'off', isPlaying: false })
                } else {
                    get().next()
                }
            },
            onload: () => set({ duration: newHowl.duration() }),
            // Note: onseek fires too early before position updates, so we use polling instead
            onloaderror: (id, err) => {
                console.error('[Howler] Load error:', id, err)
                set({ isPlaying: false })
            },
            onplayerror: (id, err) => {
                console.error('[Howler] Play error:', id, err)
                newHowl.once('unlock', () => newHowl.play())
                set({ isPlaying: false })
            }
        })

        set({ howl: newHowl, currentIndex: index, isPlaying: true })
        newHowl.play()

        // Auto-save progress
        if (currentWork) {
            window.api.savePosition(currentWork.id, track.path, 0)
        }
    },

    togglePlay: () => {
        const { howl, isPlaying } = get()
        if (!howl) return
        if (isPlaying) {
            howl.pause()
        } else {
            howl.play()
        }
    },

    seek: (seconds: number) => {
        const { howl } = get()
        if (howl) {
            console.log('[PlayerStore] Seeking to:', seconds)
            set({ isSeeking: true, progress: seconds })
            howl.seek(seconds)

            // Poll to check when seek actually completes
            // HTML5 Audio doesn't update position immediately after seek()
            let attempts = 0
            const maxAttempts = 30 // 3 seconds max wait

            const checkSeekComplete = () => {
                attempts++
                const currentPos = howl.seek() as number

                // Check if position is now close to target (within 2 seconds) or we've waited too long
                if (typeof currentPos === 'number' && isFinite(currentPos)) {
                    const isCloseEnough = Math.abs(currentPos - seconds) < 2
                    const isMovedFromZero = currentPos > 0.5 || seconds < 1

                    console.log('[PlayerStore] Seek poll:', { attempt: attempts, currentPos, target: seconds, isCloseEnough })

                    if ((isCloseEnough && isMovedFromZero) || attempts >= maxAttempts) {
                        set({ progress: currentPos, isSeeking: false })
                        return
                    }
                }

                if (attempts < maxAttempts) {
                    setTimeout(checkSeekComplete, 100)
                } else {
                    // Give up and use whatever position we have
                    set({ isSeeking: false })
                }
            }

            // Start polling after a short delay to allow seek to initiate
            setTimeout(checkSeekComplete, 100)
        }
    },

    setVolume: (volume: number) => {
        const { howl } = get()
        if (howl) howl.volume(volume)
        set({ volume })
    },

    setSleepTimer: (type) => {
        let remaining: number | null = null
        if (type === '15') remaining = 15 * 60
        if (type === '30') remaining = 30 * 60
        if (type === '60') remaining = 60 * 60
        set({ sleepTimerType: type, sleepTimerRemaining: remaining })
    },

    tickSleepTimer: () => {
        const { sleepTimerType, sleepTimerRemaining, howl, isPlaying } = get()
        if (sleepTimerType === 'off' || !isPlaying) return

        if (sleepTimerType === 'end') return // Handled by onend

        if (sleepTimerRemaining !== null) {
            const newRemaining = sleepTimerRemaining - 1
            if (newRemaining <= 0) {
                if (howl) howl.fade(howl.volume(), 0, 2000)
                setTimeout(() => {
                    if (howl) howl.pause()
                    set({ sleepTimerType: 'off', sleepTimerRemaining: null, isPlaying: false })
                }, 2000)
            } else {
                set({ sleepTimerRemaining: newRemaining })
            }
        }
    },

    next: () => {
        const { currentIndex, playlist } = get()
        if (currentIndex < playlist.length - 1) {
            get().playTrack(currentIndex + 1)
        }
    },

    prev: () => {
        const { currentIndex } = get()
        if (currentIndex > 0) {
            get().playTrack(currentIndex - 1)
        }
    },

    updateProgress: () => {
        const { howl, isPlaying, currentWork, playlist, currentIndex, duration, isSeeking } = get()
        if (howl && isPlaying && !isSeeking) {
            const pos = howl.seek() as number

            // Howler.seek() can return the Howl object if called at the wrong moment
            if (typeof pos !== 'number') return

            const currentDuration = howl.duration()

            // Always update duration when valid - MP3 VBR files may report duration late
            if (isFinite(currentDuration) && currentDuration > 0) {
                // Only update if different (to avoid unnecessary re-renders)
                if (Math.abs(currentDuration - duration) > 0.5 || !isFinite(duration)) {
                    set({ progress: pos, duration: currentDuration })
                } else {
                    set({ progress: pos })
                }
            } else {
                set({ progress: pos })
            }

            // Save position every 10 seconds or so
            if (Math.floor(pos) % 10 === 0 && currentWork && playlist[currentIndex]) {
                window.api.savePosition(currentWork.id, playlist[currentIndex].path, pos)
            }
        }
    }
}))
