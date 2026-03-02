import { useState, useEffect } from 'react';

/**
 * Custom hook to debounce a value.
 * Delays updating the returned value until the input value
 * has stopped changing for the specified delay.
 */
const useDebounce = (value, delay = 400) => {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(timer);
    }, [value, delay]);

    return debouncedValue;
};

export default useDebounce;
