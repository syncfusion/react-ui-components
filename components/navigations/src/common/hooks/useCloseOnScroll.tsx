import { useCallback, useEffect, type RefObject } from 'react';

export interface UseCloseOnScrollOptions {
    enabled: boolean;
    rootRef: RefObject<HTMLElement | null>;
    onClose: (evt: Event) => void;
}

export const useCloseOnScroll: (opts: UseCloseOnScrollOptions) => void = (opts: UseCloseOnScrollOptions): void => {

    const { enabled, rootRef, onClose } = opts;

    const handleScroll: (evt: Event) => void = useCallback((evt: Event): void => {
        if (rootRef.current?.contains(evt.target as Node)) { return; }
        onClose(evt);
    }, [onClose, rootRef]);

    useEffect((): (() => void) | void => {
        if (!enabled) { return; }
        document.addEventListener('scroll', handleScroll, true);
        return (): void => {
            document.removeEventListener('scroll', handleScroll, true);
        };
    }, [enabled, onClose, rootRef]);
};
