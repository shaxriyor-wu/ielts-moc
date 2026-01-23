import { useRef, useEffect, useState, useCallback } from 'react';
import { showToast } from './Toast';
import { Headphones, Volume2 } from 'lucide-react';

const AutoPlayAudio = ({ src, onEnded, onStarted, resetKey = 0 }) => {
  const audioRef = useRef(null);
  const [status, setStatus] = useState('loading'); // 'loading' | 'ready' | 'playing' | 'ended' | 'error'
  const [errorMessage, setErrorMessage] = useState(null);
  const statusRef = useRef(status);

  // Keep statusRef in sync
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  // Reset everything when src or resetKey changes
  useEffect(() => {
    console.log(`[AutoPlayAudio] Initializing. Src: ${src}, ResetKey: ${resetKey}`);
    setStatus('loading');
    setErrorMessage(null);

    const audio = audioRef.current;
    if (audio && src) {
      audio.currentTime = 0;
      audio.load();
    }
  }, [src, resetKey]);

  // Handle audio events - separate effect without status dependency
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !src) {
      setStatus('error');
      setErrorMessage('Audio source not available');
      return;
    }

    const handleCanPlayThrough = () => {
      console.log('[AutoPlayAudio] Audio can play through');
      // Only update if we're still in loading state
      if (statusRef.current === 'loading') {
        setStatus('ready');
      }
    };

    const handleError = (e) => {
      console.error('[AutoPlayAudio] Audio error:', e);
      let msg = 'Failed to load audio';
      if (audio.error) {
        switch (audio.error.code) {
          case 1: msg = 'Audio loading was aborted'; break;
          case 2: msg = 'Network error occurred'; break;
          case 3: msg = 'Audio format not supported'; break;
          case 4: msg = 'Audio file not found'; break;
          default: msg = 'Failed to load audio';
        }
      }
      setStatus('error');
      setErrorMessage(msg);
    };

    const handleEnded = () => {
      console.log('[AutoPlayAudio] Audio ended');
      setStatus('ended');
      if (onEnded) onEnded();
    };

    const handlePlaying = () => {
      console.log('[AutoPlayAudio] Audio is playing');
      setStatus('playing');
    };

    // Prevent manual pause during playback (IELTS requirement)
    const handlePause = () => {
      // Only try to resume if we're supposed to be playing
      if (statusRef.current === 'playing' && !audio.ended) {
        console.log('[AutoPlayAudio] Preventing pause - resuming playback');
        audio.play().catch(() => { });
      }
    };

    audio.addEventListener('canplaythrough', handleCanPlayThrough);
    audio.addEventListener('error', handleError);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('playing', handlePlaying);
    audio.addEventListener('pause', handlePause);

    // Fallback: if still loading after 3 seconds, show ready state anyway
    const timeout = setTimeout(() => {
      if (statusRef.current === 'loading') {
        console.log('[AutoPlayAudio] Timeout - setting ready state');
        setStatus('ready');
      }
    }, 3000);

    return () => {
      clearTimeout(timeout);
      audio.removeEventListener('canplaythrough', handleCanPlayThrough);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('playing', handlePlaying);
      audio.removeEventListener('pause', handlePause);
    };
  }, [src, resetKey, onEnded]);

  // Handle start button click
  const handleStartClick = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    console.log('[AutoPlayAudio] Start button clicked');

    // Reset to beginning
    audio.currentTime = 0;

    const playPromise = audio.play();
    if (playPromise) {
      playPromise
        .then(() => {
          console.log('[AutoPlayAudio] Playback started successfully');
          // Status will be set by the 'playing' event handler
          if (onStarted) onStarted();
        })
        .catch((err) => {
          console.error('[AutoPlayAudio] Play failed:', err);
          showToast('Failed to play audio. Please try again.', 'error');
        });
    }
  }, [onStarted]);

  // Render based on status
  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <div className="flex items-center justify-center gap-3 p-4">
            <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-gray-700 dark:text-gray-300 font-medium">
              Loading audio...
            </span>
          </div>
        );

      case 'ready':
        return (
          <div className="flex flex-col items-center gap-3 p-4">
            <p className="text-gray-700 dark:text-gray-300 font-medium">
              🎧 Listening audio is ready
            </p>
            <button
              onClick={handleStartClick}
              className="px-8 py-3 bg-purple-600 text-white rounded-full hover:bg-purple-700 active:bg-purple-800 transition-all shadow-lg font-bold flex items-center gap-2 animate-pulse hover:animate-none"
            >
              <Headphones className="w-5 h-5" />
              START LISTENING
            </button>
          </div>
        );

      case 'playing':
        return (
          <div className="flex items-center justify-center gap-2 p-3 bg-green-100 dark:bg-green-900/40 rounded-lg">
            <Volume2 className="w-5 h-5 text-green-600 dark:text-green-400 animate-pulse" />
            <span className="text-green-700 dark:text-green-300 font-semibold">
              Audio is playing
            </span>
            <span className="text-green-600 dark:text-green-400 text-sm">
              (Do not refresh the page)
            </span>
          </div>
        );

      case 'ended':
        return (
          <div className="flex items-center justify-center gap-2 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <span className="text-gray-600 dark:text-gray-400 font-medium">
              ✓ Audio completed
            </span>
          </div>
        );

      case 'error':
        return (
          <div className="flex flex-col items-center gap-2 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <p className="text-red-600 dark:text-red-400 font-medium">
              {errorMessage || 'Failed to load audio'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Reload Page
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="w-full">
      {renderContent()}
      <audio
        ref={audioRef}
        src={src}
        preload="auto"
        className="hidden"
      />
    </div>
  );
};

export default AutoPlayAudio;
