import { useState, useEffect, useRef } from 'react';

const easeOutExpo = (t: number): number => {
    return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
};

export function useCountUp(end: number, duration = 2000) {
    const [count, setCount] = useState(0);
    const frameRef = useRef<number | null>(null);
    const countRef = useRef(0);

    useEffect(() => {
        if (end === 0) {
            setCount(0);
            return;
        }

        let start = 0;
        const startTime = Date.now();

        const animate = () => {
            const currentTime = Date.now();
            const progress = Math.min((currentTime - startTime) / duration, 1);
            const easedProgress = easeOutExpo(progress);
            const currentCount = Math.floor(easedProgress * (end - start) + start);
            
            if (currentCount !== countRef.current) {
                setCount(currentCount);
                countRef.current = currentCount;
            }

            if (progress < 1) {
                frameRef.current = requestAnimationFrame(animate);
            }
        };

        frameRef.current = requestAnimationFrame(animate);

        return () => {
            if (frameRef.current) {
                cancelAnimationFrame(frameRef.current);
            }
        };
    }, [end, duration]);

    return count;
}
