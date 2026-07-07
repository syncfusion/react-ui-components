export const getAt: <T>(array: readonly T[], index: number) => T | undefined = <T, >(
    array: readonly T[], index: number): T | undefined => {
    if (!Number.isInteger(index) || index < 0 || index >= array.length) {
        return undefined;
    }
    return Reflect.get(array, index) as T | undefined;
};

export const getFirst: <T>(array: readonly T[]) => T | undefined = <T, >(array: readonly T[]): T | undefined => array[0];

export const getLast: <T>(array: readonly T[]) => T | undefined = <T, >(array: readonly T[]
): T | undefined => (array.length ? array[array.length - 1] : undefined);

export const getChildElement: (parent: Element | null, index: number) => HTMLElement | null = (
    parent: Element | null, index: number): HTMLElement | null => {
    if (!parent || !Number.isInteger(index) || index < 0) {
        return null;
    }
    return parent.children.item(index) as HTMLElement | null;
};

type NavigableItemLike = { separator?: boolean; disabled?: boolean };

export const getFirstEnabledIndex: <T extends NavigableItemLike>(items: readonly T[]) => number =
    <T extends NavigableItemLike>(items: readonly T[]): number => {
        let index: number = 0;
        for (const it of items) {
            if (it && !it.separator && !it.disabled) { return index; }
            index++;
        }
        return -1;
    };

export const getLastEnabledIndex: <T extends NavigableItemLike>(items: readonly T[]) => number =
    <T extends NavigableItemLike>(items: readonly T[]): number => {
        let lastEnabled: number = -1;
        let index: number = 0;
        for (const it of items) {
            if (it && !it.separator && !it.disabled) { lastEnabled = index; }
            index++;
        }
        return lastEnabled;
    };

export const getNextEnabledIndex: <T extends NavigableItemLike>(
    items: readonly T[], startIndex: number, delta: number) => number = <T extends NavigableItemLike>(
    items: readonly T[], startIndex: number, delta: number): number => {
    const len: number = items.length;
    if (!len) { return -1; }
    let nextIndex: number = startIndex;
    let checked: number = 0;
    while (checked < len) {
        nextIndex = (nextIndex + delta + len) % len;
        const it: T | undefined = getAt<T>(items, nextIndex);
        if (it && !it.separator && !it.disabled) { return nextIndex; }
        checked++;
    }
    return startIndex;
};

export const isRootContainer: (container?: HTMLElement) => boolean = (container?: HTMLElement): boolean => {
    return !container || (typeof document !== 'undefined' && (container === document.body || container === document.documentElement));
};

export const getCollisionBoundary: (container?: HTMLElement) => HTMLElement = (container?: HTMLElement): HTMLElement => {
    return isRootContainer(container) || !container ? document.documentElement : container;
};

const clampToAxis: (position: number, menuSize: number, boundarySize: number, boundaryScroll: number) => number =
    (position: number, menuSize: number, boundarySize: number, boundaryScroll: number): number => {
        if (menuSize <= 0 || boundarySize <= 0) { return position; }
        const min: number = boundaryScroll;
        const max: number = Math.max(min, boundaryScroll + boundarySize - menuSize);
        return Math.min(Math.max(position, min), max);
    };

export const getBoundedHorizontalPosition: (left: number, menuElement: HTMLElement, boundary: HTMLElement) => number =
    (left: number, menuElement: HTMLElement, boundary: HTMLElement): number =>
        clampToAxis(left, menuElement.offsetWidth || 0, boundary.clientWidth || 0, boundary.scrollLeft);

export const getBoundedVerticalPosition: (top: number, menuElement: HTMLElement, boundary: HTMLElement) => number =
    (top: number, menuElement: HTMLElement, boundary: HTMLElement): number =>
        clampToAxis(top, menuElement.offsetHeight || 0, boundary.clientHeight || 0, boundary.scrollTop);

export const getContainerPosition: (x: number, y: number, container?: HTMLElement) => { x: number; y: number, } =
    (x: number, y: number, container?: HTMLElement): { x: number; y: number } => {
        if (isRootContainer(container) || !container) {
            return { x, y };
        }
        const rect: DOMRect = container.getBoundingClientRect();
        const clientX: number = x - (window.pageXOffset || window.scrollX);
        const clientY: number = y - (window.pageYOffset || window.scrollY);
        return { x: clientX - rect.left + container.scrollLeft, y: clientY - rect.top + container.scrollTop };
    };
