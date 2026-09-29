import { useEffect, type RefObject } from 'react';
import type { SidebarChangeEvent } from '../types';

interface UseSidebarClickOutsideOptions {

    rootRef?: RefObject<HTMLDivElement | null>;

    open: boolean;

    closeOnDocumentClick: boolean;

    onOpenChange?: (event: SidebarChangeEvent) => void;
}

export const useSidebarClickOutside: (opts: UseSidebarClickOutsideOptions) => void = (opts: UseSidebarClickOutsideOptions): void => {
    const {
        rootRef,
        open,
        closeOnDocumentClick,
        onOpenChange
    } = opts;
    useEffect((): (() => void) | void => {
        if (!open || !closeOnDocumentClick) { return; }
        const handleMouseDown: (event: MouseEvent) => void = (event: MouseEvent): void => {
            const target: Node | null = event.target as Node | null;
            if (!target) { return; }
            if (rootRef?.current && rootRef.current.contains(target)) { return; }
            onOpenChange?.({ open: false, event });
        };
        document.addEventListener('mousedown', handleMouseDown, false);

        return (): void => {
            document.removeEventListener('mousedown', handleMouseDown, false);
        };
    }, [open, closeOnDocumentClick, rootRef, onOpenChange]);
};
