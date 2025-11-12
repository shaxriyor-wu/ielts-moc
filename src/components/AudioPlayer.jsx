import { useState, useRef, useEffect } from 'react'
import { Play, Pause, Volume2 } from 'lucide-react'
import { motion } from 'framer-motion'

/**
 * Audio Player Component
 * @param {string} audioUrl - URL to audio file
 * @param {boolean} allowReplay - Whether replay is allowed (default: false for Listening)
 * @param {Function} onPlayComplete - Callback when playback finishes
 */
export default function AudioPlayer({ audioUrl, allowReplay = false, onPlayComplete }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [hasPlayed, setHasPlayed] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const audioRef = useRef(null)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const updateTime = () => setCurrentTime(audio.currentTime)
    const updateDuration = () => setDuration(audio.duration)
    const handleEnded = () => {
      setIsPlaying(false)
      setHasPlayed(true)
      if (onPlayComplete) onPlayComplete()
    }

    audio.addEventListener('timeupdate', updateTime)
    audio.addEventListener('loadedmetadata', updateDuration)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.removeEventListener('timeupdate', updateTime)
      audio.removeEventListener('loadedmetadata', updateDuration)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [onPlayComplete])

  const togglePlay = () => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
      setIsPlaying(false)
    } else {
      if (!hasPlayed || allowReplay) {
        audio.play()
        setIsPlaying(true)
        setHasPlayed(true)
      }
    }
  }

  const formatTime = (seconds) => {
    if (isNaN(seconds)) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className="bg-white rounded-lg shadow-md p-4" role="region" aria-label="Audio player">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />
      
      <div className="flex items-center space-x-4">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={togglePlay}
          disabled={hasPlayed && !allowReplay}
          className={`p-3 rounded-full ${
            hasPlayed && !allowReplay
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-primary-500 text-white hover:bg-primary-600'
          }`}
          aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
        >
          {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
        </motion.button>

        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <Volume2 className="h-4 w-4 text-gray-500" aria-hidden="true" />
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary-500 h-2 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      </div>

      {hasPlayed && !allowReplay && (
        <p className="text-sm text-gray-500 mt-2" role="status">
          Audio has been played. Replay not allowed for this section.
        </p>
      )}
    </div>
  )
}

