import { useState, useRef, useEffect } from 'react'
import { Mic, Square, Play, Pause } from 'lucide-react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'

/**
 * Recording Control Component
 * @param {Function} onRecordingComplete - Callback with audio blob
 * @param {number} maxDuration - Maximum recording duration in seconds
 */
export default function RecordingControl({ onRecordingComplete, maxDuration = 120 }) {
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioBlob, setAudioBlob] = useState(null)
  const [audioUrl, setAudioUrl] = useState(null)
  const [hasPermission, setHasPermission] = useState(null)

  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const timerRef = useRef(null)

  useEffect(() => {
    // Check microphone permission
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then(() => {
        setHasPermission(true)
      })
      .catch(() => {
        setHasPermission(false)
        toast.error('Microphone permission denied. Using simulated recording.')
      })

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (audioUrl) URL.revokeObjectURL(audioUrl)
    }
  }, [audioUrl])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        setAudioBlob(blob)
        const url = URL.createObjectURL(blob)
        setAudioUrl(url)
        if (onRecordingComplete) {
          onRecordingComplete(blob)
        }
        stream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev >= maxDuration) {
            stopRecording()
            return maxDuration
          }
          return prev + 1
        })
      }, 1000)
    } catch (error) {
      toast.error('Failed to start recording. Using simulated mode.')
      // Simulate recording
      simulateRecording()
    }
  }

  const simulateRecording = () => {
    setIsRecording(true)
    setRecordingTime(0)
    timerRef.current = setInterval(() => {
      setRecordingTime((prev) => {
        if (prev >= maxDuration) {
          stopRecording()
          return maxDuration
        }
        return prev + 1
      })
    }, 1000)
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
    setIsRecording(false)
    setIsPaused(false)

    if (!hasPermission) {
      // Create a dummy blob for simulation
      const dummyBlob = new Blob(['simulated'], { type: 'audio/webm' })
      setAudioBlob(dummyBlob)
      if (onRecordingComplete) {
        onRecordingComplete(dummyBlob)
      }
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6" role="region" aria-label="Recording control">
      {!isRecording && !audioBlob && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={startRecording}
          className="btn-primary flex items-center space-x-2 mx-auto"
          aria-label="Start recording"
        >
          <Mic className="h-5 w-5" />
          <span>Start Recording</span>
        </motion.button>
      )}

      {isRecording && (
        <div className="space-y-4">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <div className="w-3 h-3 bg-accent-500 rounded-full animate-pulse" />
              <span className="font-mono text-lg font-bold">{formatTime(recordingTime)}</span>
            </div>
            <p className="text-sm text-gray-600">Recording in progress...</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={stopRecording}
            className="btn-danger flex items-center space-x-2 mx-auto"
            aria-label="Stop recording"
          >
            <Square className="h-5 w-5" />
            <span>Stop Recording</span>
          </motion.button>
        </div>
      )}

      {audioBlob && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600 text-center">
            Recording completed ({formatTime(recordingTime)})
          </p>
          {audioUrl && (
            <audio controls src={audioUrl} className="w-full" aria-label="Recorded audio playback">
              Your browser does not support audio playback.
            </audio>
          )}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setAudioBlob(null)
              setAudioUrl(null)
              setRecordingTime(0)
            }}
            className="btn-secondary w-full"
          >
            Record Again
          </motion.button>
        </div>
      )}

      {hasPermission === false && (
        <p className="text-xs text-gray-500 mt-2 text-center" role="status">
          Microphone access not available. Recording is simulated.
        </p>
      )}
    </div>
  )
}

