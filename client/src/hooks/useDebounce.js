import { useRef, useCallback, useEffect } from 'react';

/**
 * A hook that returns a debounced version of the provided function.
 * @param {Function} callback The function to debounce
 * @param {number} delay Delay in milliseconds
 * @returns {Function} Debounced function
 */
export const useDebounce = (callback, delay) => {
    const callbackRef = useRef(callback);
    const timeoutRef = useRef(null);

    // Update callback ref when callback changes
    useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);

    return useCallback((...args) => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
            callbackRef.current(...args);
        }, delay);
    }, [delay]);
};
