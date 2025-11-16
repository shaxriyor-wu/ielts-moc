import { useRef, useEffect, useState } from 'react';

const AutoPlayAudio = ({ src, onEnded, className = '' }) => {
  const audioRef = useRef(null);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !src) return;

    // Auto-play when component mounts
    const playAudio = async () => {
      try {
        await audio.play();
        setHasStarted(true);
      } catch (error) {
        console.error('Auto-play failed:', error);
        // Some browsers block auto-play, but we'll try anyway
      }
    };

    playAudio();

    const handleEnded = () => {
      if (onEnded) {
        onEnded();
      }
    };

    audio.addEventListener('ended', handleEnded);

    // Prevent user interactions
    const preventControls = (e) => {
      e.preventDefault();
      return false;
    };

    audio.addEventListener('contextmenu', preventControls);
    audio.addEventListener('pause', () => {
      if (hasStarted) {
        audio.play();
      }
    });

    return () => {
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('contextmenu', preventControls);
    };
  }, [src, onEnded, hasStarted]);

  // Hidden audio element - no controls, no UI
  return (
    <audio
      ref={audioRef}
      src={src}
      preload="auto"
      className={className}
      style={{ display: 'none' }}
      controls={false}
    />
  );
};

export default AutoPlayAudio;

