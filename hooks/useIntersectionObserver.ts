import { useState, useEffect, useRef, RefObject } from 'react';

interface IntersectionObserverOptions {
    root?: Element | null;
    rootMargin?: string;
    threshold?: number | number[];
}

export function useIntersectionObserver(
    options: IntersectionObserverOptions = {}
): [RefObject<HTMLDivElement>, boolean] {
    const [isIntersecting, setIntersecting] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIntersecting(true);
                    // Disconnect after it becomes visible to prevent re-triggering
                    if (ref.current) {
                       observer.unobserve(ref.current);
                    }
                }
            },
            {
                ...options,
            }
        );

        const currentRef = ref.current;
        if (currentRef) {
            observer.observe(currentRef);
        }

        return () => {
            if (currentRef) {
                observer.unobserve(currentRef);
            }
        };
    }, [options]);

    return [ref, isIntersecting];
}
