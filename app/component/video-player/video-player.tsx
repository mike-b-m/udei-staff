'use client'
import { useState, useRef, useEffect, useCallback } from 'react'

interface VideoPlayerProps {
  youtubeUrl: string
  title?: string
  onProgress?: (percent: number, currentTime: number) => void
  initialPosition?: number
}

function extractYoutubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
  ]
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  return null
}

declare global {
  interface Window {
    YT: any
    onYouTubeIframeAPIReady: () => void
  }
}

export default function VideoPlayer({ youtubeUrl, title, onProgress, initialPosition = 0 }: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<any>(null)
  const progressInterval = useRef<NodeJS.Timeout | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(80)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [quality, setQuality] = useState('auto')
  const [showQualityMenu, setShowQualityMenu] = useState(false)
  const [availableQualities, setAvailableQualities] = useState<string[]>([])
  const [showCaptions, setShowCaptions] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [buffered, setBuffered] = useState(0)
  const controlsTimeout = useRef<NodeJS.Timeout | null>(null)
  const playerContainerRef = useRef<HTMLDivElement>(null)

  const videoId = extractYoutubeId(youtubeUrl)

  // Load YouTube IFrame API
  useEffect(() => {
    if (!videoId) return

    const loadAPI = () => {
      if (window.YT && window.YT.Player) {
        initPlayer()
        return
      }

      const tag = document.createElement('script')
      tag.src = 'https://www.youtube.com/iframe_api'
      const firstScriptTag = document.getElementsByTagName('script')[0]
      firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag)

      window.onYouTubeIframeAPIReady = () => initPlayer()
    }

    const initPlayer = () => {
      if (playerRef.current) {
        playerRef.current.destroy()
      }

      playerRef.current = new window.YT.Player(`yt-player-${videoId}`, {
        videoId,
        playerVars: {
          autoplay: 0,
          controls: 0,
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
          iv_load_policy: 3,
          disablekb: 1,
          fs: 0,
          cc_load_policy: 0,
          origin: window.location.origin,
          start: initialPosition,
        },
        events: {
          onReady: (event: any) => {
            setIsReady(true)
            setDuration(event.target.getDuration())
            event.target.setVolume(volume)
            const quals = event.target.getAvailableQualityLevels()
            if (quals.length > 0) setAvailableQualities(quals)
            if (initialPosition > 0) event.target.seekTo(initialPosition, true)
          },
          onStateChange: (event: any) => {
            setIsPlaying(event.data === window.YT.PlayerState.PLAYING)
            if (event.data === window.YT.PlayerState.PLAYING) {
              startProgressTracking()
            } else {
              stopProgressTracking()
            }
          },
        },
      })
    }

    loadAPI()

    return () => {
      stopProgressTracking()
      if (playerRef.current) {
        try { playerRef.current.destroy() } catch {}
      }
    }
  }, [videoId])

  const startProgressTracking = useCallback(() => {
    stopProgressTracking()
    progressInterval.current = setInterval(() => {
      if (playerRef.current?.getCurrentTime) {
        const time = playerRef.current.getCurrentTime()
        const dur = playerRef.current.getDuration()
        setCurrentTime(time)
        setDuration(dur)
        const bufferedFrac = playerRef.current.getVideoLoadedFraction?.() || 0
        setBuffered(bufferedFrac * 100)
        if (onProgress && dur > 0) {
          onProgress(Math.round((time / dur) * 100), time)
        }
      }
    }, 1000)
  }, [onProgress])

  const stopProgressTracking = () => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current)
      progressInterval.current = null
    }
  }

  const togglePlay = () => {
    if (!playerRef.current) return
    if (isPlaying) {
      playerRef.current.pauseVideo()
    } else {
      playerRef.current.playVideo()
    }
  }

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!playerRef.current || !duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const percent = (e.clientX - rect.left) / rect.width
    playerRef.current.seekTo(percent * duration, true)
  }

  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value)
    setVolume(val)
    setIsMuted(val === 0)
    playerRef.current?.setVolume(val)
    playerRef.current?.unMute()
  }

  const toggleMute = () => {
    if (!playerRef.current) return
    if (isMuted) {
      playerRef.current.unMute()
      playerRef.current.setVolume(volume || 80)
      setIsMuted(false)
    } else {
      playerRef.current.mute()
      setIsMuted(true)
    }
  }

  const toggleFullscreen = async () => {
    if (!playerContainerRef.current) return
    if (!document.fullscreenElement) {
      await playerContainerRef.current.requestFullscreen()
      setIsFullscreen(true)
    } else {
      await document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  const setVideoQuality = (q: string) => {
    playerRef.current?.setPlaybackQuality(q)
    setQuality(q)
    setShowQualityMenu(false)
  }

  const toggleCaptions = () => {
    if (!playerRef.current) return
    if (showCaptions) {
      playerRef.current.unloadModule?.('captions')
    } else {
      playerRef.current.loadModule?.('captions')
    }
    setShowCaptions(!showCaptions)
  }

  const skip = (seconds: number) => {
    if (!playerRef.current) return
    const newTime = Math.max(0, Math.min(duration, currentTime + seconds))
    playerRef.current.seekTo(newTime, true)
  }

  const handleMouseMove = () => {
    setShowControls(true)
    if (controlsTimeout.current) clearTimeout(controlsTimeout.current)
    controlsTimeout.current = setTimeout(() => {
      if (isPlaying) setShowControls(false)
    }, 3000)
  }

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = Math.floor(seconds % 60)
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0

  if (!videoId) {
    return (
      <div className="w-full aspect-video bg-gray-900 rounded-xl flex items-center justify-center">
        <p className="text-gray-400">URL YouTube invalide</p>
      </div>
    )
  }

  return (
    <div
      ref={playerContainerRef}
      className="relative w-full aspect-video bg-black rounded-xl overflow-hidden group select-none"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      {/* YouTube iframe (hidden controls) */}
      <div className="absolute inset-0 pointer-events-none">
        <div id={`yt-player-${videoId}`} className="w-full h-full" />
      </div>

      {/* Clickable overlay for play/pause */}
      <div
        className="absolute inset-0 z-10 cursor-pointer"
        onClick={togglePlay}
        onDoubleClick={toggleFullscreen}
      />

      {/* Loading state */}
      {!isReady && (
        <div className="absolute inset-0 z-20 bg-gray-900 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Center play button (shown when paused) */}
      {!isPlaying && isReady && (
        <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
          <div className="w-20 h-20 bg-blue-600/90 rounded-full flex items-center justify-center backdrop-blur-sm shadow-2xl">
            <svg className="w-10 h-10 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      )}

      {/* Custom Controls Bar */}
      <div
        className={`absolute bottom-0 left-0 right-0 z-30 transition-all duration-300 ${
          showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
        }`}
      >
        {/* Progress bar */}
        <div
          className="relative h-1.5 bg-white/20 cursor-pointer group/progress mx-2 rounded-full hover:h-3 transition-all"
          onClick={seek}
        >
          <div
            className="absolute top-0 left-0 h-full bg-white/30 rounded-full"
            style={{ width: `${buffered}%` }}
          />
          <div
            className="absolute top-0 left-0 h-full bg-blue-500 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-blue-500 rounded-full shadow-lg opacity-0 group-hover/progress:opacity-100 transition-opacity"
            style={{ left: `calc(${progressPercent}% - 8px)` }}
          />
        </div>

        {/* Controls row */}
        <div className="bg-gradient-to-t from-black/90 via-black/60 to-transparent px-4 py-3">
          <div className="flex items-center gap-3">
            {/* Play / Pause */}
            <button onClick={togglePlay} className="text-white hover:text-blue-400 transition p-1">
              {isPlaying ? (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6zm8 0h4v16h-4z" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>

            {/* Skip back 10s */}
            <button onClick={() => skip(-10)} className="text-white/80 hover:text-white transition p-1 hidden sm:block">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.333 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z" />
              </svg>
            </button>

            {/* Skip forward 10s */}
            <button onClick={() => skip(10)} className="text-white/80 hover:text-white transition p-1 hidden sm:block">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z" />
              </svg>
            </button>

            {/* Volume */}
            <div className="flex items-center gap-2 group/vol">
              <button onClick={toggleMute} className="text-white/80 hover:text-white transition p-1">
                {isMuted || volume === 0 ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.796 8.796 0 0021 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06a8.99 8.99 0 003.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                  </svg>
                )}
              </button>
              <input
                type="range"
                min="0"
                max="100"
                value={isMuted ? 0 : volume}
                onChange={handleVolume}
                className="w-0 group-hover/vol:w-20 transition-all duration-300 accent-blue-500 h-1 cursor-pointer"
              />
            </div>

            {/* Time display */}
            <span className="text-white/90 text-xs font-mono tabular-nums">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>

            <div className="flex-1" />

            {/* CC */}
            <button onClick={toggleCaptions} className={`p-1 transition hidden sm:block ${showCaptions ? 'text-blue-400' : 'text-white/60 hover:text-white'}`} title="Sous-titres">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 4H5a2 2 0 00-2 2v12a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2zm-8 7H9.5v-.5h-2v3h2V13H11v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-4a1 1 0 011-1h3a1 1 0 011 1v1zm7 0h-1.5v-.5h-2v3h2V13H18v1a1 1 0 01-1 1h-3a1 1 0 01-1-1v-4a1 1 0 011-1h3a1 1 0 011 1v1z" />
              </svg>
            </button>

            {/* Quality */}
            <div className="relative hidden sm:block">
              <button onClick={() => setShowQualityMenu(!showQualityMenu)} className="text-white/60 hover:text-white transition p-1" title="Qualité vidéo">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
              {showQualityMenu && (
                <div className="absolute bottom-full right-0 mb-2 bg-gray-900/95 rounded-lg shadow-xl border border-white/10 py-2 min-w-[140px] backdrop-blur-sm">
                  {(['auto', ...availableQualities.filter(q => q !== 'auto')] as string[]).map(q => (
                    <button
                      key={q}
                      onClick={() => setVideoQuality(q)}
                      className={`w-full text-left px-4 py-2 text-sm transition ${quality === q ? 'text-blue-400 bg-blue-500/10' : 'text-white/80 hover:bg-white/10'}`}
                    >
                      {q === 'auto' ? 'Auto' : q.replace('hd', 'HD ').replace('large', '480p').replace('medium', '360p').replace('small', '240p').replace('tiny', '144p')}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Fullscreen */}
            <button onClick={toggleFullscreen} className="text-white/80 hover:text-white transition p-1" title="Plein écran">
              {isFullscreen ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Title overlay */}
      {title && showControls && (
        <div className="absolute top-0 left-0 right-0 z-30 bg-gradient-to-b from-black/70 to-transparent px-4 py-3">
          <h3 className="text-white font-semibold text-sm truncate">{title}</h3>
        </div>
      )}
    </div>
  )
}
