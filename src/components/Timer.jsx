import { useEffect, useState } from 'react'
import { Clock } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * Timer component for test sections
 * @param {number} initialSeconds - Initial time in seconds
 * @param {Function} onComplete - Callback when timer reaches zero
 * @param {boolean} autoStart - Whether to start automatically
 */
export default function Timer({ initialSeconds, onComplete, autoStart = true }) {
  const [seconds, setSeconds] = useState(initialSeconds)
  const [isRunning, setIsRunning] = useState(autoStart)
  const [isWarning, setIsWarning] = useState(false)

  useEffect(() => {
    if (!isRunning || seconds <= 0) {
      if (seconds === 0 && onComplete) {
        onComplete()
      }
      return
    }

    const interval = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          setIsRunning(false)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isRunning, seconds, onComplete])

  useEffect(() => {
    // Show warning when less than 5 minutes remain
    setIsWarning(seconds < 300 && seconds > 0)
  }, [seconds])

  const formatTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const secs = totalSeconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div
      className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
        isWarning ? 'bg-accent-100 text-accent-700' : 'bg-primary-100 text-primary-700'
      }`}
      role="timer"
      aria-live="polite"
      aria-atomic="true"
    >
      <Clock className="h-5 w-5" aria-hidden="true" />
      <AnimatePresence mode="wait">
        <motion.span
          key={seconds}
          initial={{ scale: 1.2, opacity: 0.5 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          className="font-mono font-bold text-lg"
        >
          {formatTime(seconds)}
        </motion.span>
      </AnimatePresence>
    </div>
  )
}

