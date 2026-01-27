import { useEffect, useState, useCallback } from 'react';
import { showToast } from '../components/Toast';

export const useAntiCheat = (isActive = true) => {
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [hasLeftWindow, setHasLeftWindow] = useState(false);

    useEffect(() => {
        if (!isActive) return;

        // 1. Event Prevention (Mouse & Copy/Paste)
        const preventDefault = (e) => {
            e.preventDefault();
            if (e.clipboardData) {
                e.clipboardData.clearData();
            }
        };

        // 2. Keyboard Prevention (Ctrl+C, Ctrl+V, etc.)
        const handleKeyDown = (e) => {
            if (
                (e.ctrlKey || e.metaKey) &&
                ['c', 'v', 'x'].includes(e.key.toLowerCase())
            ) {
                e.preventDefault();
                showToast('Action not allowed!', 'error');
                return false;
            }
            // Block F12 (DevTools)
            if (e.key === 'F12') {
                e.preventDefault();
            }
        };

        // 3. CSS Injection (Selection blocking) - REMOVED to allow highlighting
        // const style = document.createElement('style');
        // ... removed
        // document.head.appendChild(style);

        // Add Listeners
        document.addEventListener('contextmenu', preventDefault);
        document.addEventListener('copy', preventDefault);
        document.addEventListener('cut', preventDefault);
        document.addEventListener('paste', preventDefault);
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('contextmenu', preventDefault);
            document.removeEventListener('copy', preventDefault);
            document.removeEventListener('cut', preventDefault);
            document.removeEventListener('paste', preventDefault);
            document.removeEventListener('keydown', handleKeyDown);

            // const styleEl = document.getElementById('anti-cheat-styles');
            // if (styleEl) {
            //     styleEl.remove();
            // }
        };
    }, [isActive]);

    // 4. Tab Switching & Window Blur Detection
    useEffect(() => {
        if (!isActive) return;

        const handleVisibilityChange = () => {
            if (document.hidden) {
                setHasLeftWindow(true);
            }
        };

        const handleBlur = () => {
            setHasLeftWindow(true);
        };

        // Only set back to false if the user manually acknowledges (handled by UI) 
        // OR we can auto-reset when they focus back. 
        // For now, let's auto-reset on focus so the modal disappears when they return.
        const handleFocus = () => {
            setHasLeftWindow(false);
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('blur', handleBlur);
        window.addEventListener('focus', handleFocus);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('blur', handleBlur);
            window.removeEventListener('focus', handleFocus);
        };
    }, [isActive]);

    // 5. Fullscreen Logic
    useEffect(() => {
        if (!isActive) return;

        const handleFullscreenChange = () => {
            setIsFullScreen(!!document.fullscreenElement);
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        setIsFullScreen(!!document.fullscreenElement);

        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
        };
    }, [isActive]);

    const enterFullscreen = async () => {
        try {
            if (document.documentElement.requestFullscreen) {
                await document.documentElement.requestFullscreen();
            } else if (document.documentElement.webkitRequestFullscreen) {
                await document.documentElement.webkitRequestFullscreen();
            }
            setIsFullScreen(true);
        } catch (err) {
            console.error("Error attempting to enable fullscreen:", err);
            showToast('Could not enter fullscreen mode', 'error');
        }
    };

    return { isFullScreen, hasLeftWindow, enterFullscreen };
};
