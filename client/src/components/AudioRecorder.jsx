import React, { useState, useRef, useEffect } from 'react';

const AudioRecorder = ({
  onRecordingComplete,
  maxDuration = null,
  autoStop = false,
  partNumber,
  questionNumber
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [error, setError] = useState(null);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      stopMediaRecorder();
    };
  }, []);

  const stopMediaRecorder = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const startRecording = async () => {
    try {
      setError(null);
      setAudioBlob(null);

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Create MediaRecorder
      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/mp4';

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // Handle data available
      mediaRecorder.addEventListener('dataavailable', (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      });

      // Handle recording stop
      mediaRecorder.addEventListener('stop', () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        setAudioBlob(audioBlob);

        if (onRecordingComplete) {
          onRecordingComplete(audioBlob, partNumber, questionNumber);
        }

        // Stop the stream
        stream.getTracks().forEach(track => track.stop());
      });

      // Start recording
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          const newTime = prev + 1;

          // Auto-stop if max duration reached
          if (maxDuration && newTime >= maxDuration && autoStop) {
            stopRecording();
          }

          return newTime;
        });
      }, 1000);

    } catch (err) {
      console.error('Error accessing microphone:', err);
      setError('Microphone access denied or not available. Please check your browser settings.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    setIsRecording(false);

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeColor = () => {
    if (!maxDuration) return 'text-gray-700 dark:text-gray-300';

    const remaining = maxDuration - recordingTime;
    if (remaining <= 10) return 'text-red-600 dark:text-red-400 font-bold';
    if (remaining <= 30) return 'text-orange-600 dark:text-orange-400 font-semibold';
    return 'text-gray-700 dark:text-gray-300';
  };

  return (
    <div className="audio-recorder border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-white dark:bg-gray-800 shadow-sm">
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Recording indicator */}
          {isRecording && (
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Recording...</span>
            </div>
          )}

          {/* Timer */}
          <div className={`text-2xl font-mono ${getTimeColor()}`}>
            {formatTime(recordingTime)}
            {maxDuration && (
              <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                / {formatTime(maxDuration)}
              </span>
            )}
          </div>
        </div>

        {/* Control buttons */}
        <div className="flex space-x-3">
          {!isRecording ? (
            <button
              onClick={startRecording}
              disabled={audioBlob !== null}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700
                       disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors
                       flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
              </svg>
              <span>Start Recording</span>
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700
                       transition-colors flex items-center space-x-2"
            >
              <div className="w-4 h-4 bg-white rounded"></div>
              <span>Stop</span>
            </button>
          )}
        </div>
      </div>

      {/* Audio playback */}
      {audioBlob && (
        <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium text-green-700 dark:text-green-300">Recording saved</span>
            </div>
            <div className="flex items-center gap-3">
              <audio controls src={URL.createObjectURL(audioBlob)} className="h-8" />
              <button
                onClick={() => {
                  setAudioBlob(null);
                  setRecordingTime(0);
                }}
                className="px-3 py-1 text-sm bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 hover:bg-orange-200 dark:hover:bg-orange-900/50 rounded transition-colors"
              >
                Re-record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Warning when approaching max duration */}
      {maxDuration && isRecording && (maxDuration - recordingTime <= 10) && (
        <div className="mt-3 p-2 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-300 text-sm rounded">
          Recording will stop in {maxDuration - recordingTime} seconds
        </div>
      )}
    </div>
  );
};

export default AudioRecorder;
