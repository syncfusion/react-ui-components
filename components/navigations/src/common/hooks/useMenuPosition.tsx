import { useCallback, type RefObject } from 'react';

export interface UseMenuPositionOptions {
    parentRef: RefObject<HTMLUListElement | null>;
    isPopup: boolean;
}

export interface MenuPoint {
    x: number;
    y: number;
}

export interface UseMenuPositionReturn {
    toLocalPosition: (page: MenuPoint) => MenuPoint;
    toPagePosition: (local: MenuPoint) => MenuPoint;
}

export const useMenuPosition: (opts: UseMenuPositionOptions) => UseMenuPositionReturn =
    (opts: UseMenuPositionOptions): UseMenuPositionReturn => {

        const { parentRef, isPopup } = opts;

        const getLayoutContainerOrigin: () => MenuPoint = useCallback((): MenuPoint => {
            const containerEl: HTMLElement | null = parentRef.current?.parentElement ?? null;
            if (!containerEl) { return { x: 0, y: 0 }; }
            const rect: DOMRect = containerEl.getBoundingClientRect();
            return { x: rect.left + window.scrollX, y: rect.top + window.scrollY };
        }, [parentRef]);

        const toLocalPosition: (page: MenuPoint) => MenuPoint = useCallback((page: MenuPoint): MenuPoint => {
            if (isPopup) { return page; }
            const origin: MenuPoint = getLayoutContainerOrigin();
            return { x: page.x - origin.x, y: page.y - origin.y };
        }, [isPopup, getLayoutContainerOrigin]);

        const toPagePosition: (local: MenuPoint) => MenuPoint = useCallback((local: MenuPoint): MenuPoint => {
            if (isPopup) { return local; }
            const origin: MenuPoint = getLayoutContainerOrigin();
            return { x: local.x + origin.x, y: local.y + origin.y };
        }, [isPopup, getLayoutContainerOrigin]);

        return { toLocalPosition, toPagePosition };
    };
