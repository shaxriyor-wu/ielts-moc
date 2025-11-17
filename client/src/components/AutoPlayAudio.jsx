import { useRef, useEffect, useState } from 'react';
import { showToast } from './Toast';

const AutoPlayAudio = ({ src, onEnded, className = '' }) => {
  const audioRef = useRef(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !src) {
      setIsLoading(false);
      return;
    }

    // Set up error handlers
    const handleError = (e) => {
      console.error('Audio error:', e);
      const errorMsg = audio.error 
        ? `Audio error: ${audio.error.code === 4 ? 'Format not supported' : 'Failed to load'}`
        : 'Failed to load audio file';
      setError(errorMsg);
      setIsLoading(false);
      showToast('Audio failed to load. Please check your connection.', 'error');
    };

    const handleCanPlay = () => {
      setIsLoading(false);
      setError(null);
    };

    const handleLoadedData = () => {
      setIsLoading(false);
    };

    // Auto-play when component mounts
    const playAudio = async () => {
      try {
        // Set audio properties for better compatibility
        audio.crossOrigin = 'anonymous';
        audio.preload = 'auto';
        
        // Try to play
        const playPromise = audio.play();
        
        if (playPromise !== undefined) {
          await playPromise;
          setHasStarted(true);
          setError(null);
        }
      } catch (error) {
        console.error('Auto-play failed:', error);
        setError('Autoplay blocked. Click play button to start.');
        // Don't show error toast for autoplay block - it's expected behavior
        if (error.name !== 'NotAllowedError') {
          showToast('Audio playback failed. Please try again.', 'error');
        }
      }
    };

    // Set up event listeners
    audio.addEventListener('error', handleError);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('loadeddata', handleLoadedData);
    audio.addEventListener('ended', () => {
      if (onEnded) {
        onEnded();
      }
    });

    // Prevent right-click context menu
    const preventControls = (e) => {
      e.preventDefault();
      return false;
    };

    audio.addEventListener('contextmenu', preventControls);
    
    // Prevent pausing once started (IELTS standard - audio plays once)
    audio.addEventListener('pause', () => {
      if (hasStarted && !audio.ended) {
        audio.play().catch(console.error);
      }
    });

    // Try to load and play
    audio.load();
    playAudio();

    return () => {
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('loadeddata', handleLoadedData);
      audio.removeEventListener('contextmenu', preventControls);
    };
  }, [src, onEnded]);

  // If there's an error, show a play button
  if (error && !hasStarted) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
        <p className="text-yellow-800 dark:text-yellow-300 mb-2">{error}</p>
        <button
          onClick={async () => {
            try {
              await audioRef.current?.play();
              setHasStarted(true);
              setError(null);
            } catch (e) {
              showToast('Failed to play audio', 'error');
            }
          }}
          className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
        >
          Play Audio
        </button>
      </div>
    );
  }

  // Hidden audio element - no controls, no UI (when playing)
  return (
    <audio
      ref={audioRef}
      src={src}
      preload="auto"
      className={className}
      style={{ display: 'none' }}
      controls={false}
      crossOrigin="anonymous"
    />
  );
};

export default AutoPlayAudio;

