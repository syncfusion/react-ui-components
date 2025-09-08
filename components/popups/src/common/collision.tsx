
import { calculatePosition, OffsetPosition } from './position';

export interface CollisionCoordinates {
    X: boolean;
    Y: boolean;
}

export const flip: (elementRef: HTMLElement | null,
    targetRef: HTMLElement | null,
    offsetX: number, offsetY: number,
    positionX?: string, positionY?: string,
    viewPortElementRef?: HTMLElement | null,
    axis?: CollisionCoordinates)
=> OffsetPosition | null = (
    elementRef: HTMLElement | null,
    targetRef: HTMLElement | null,
    offsetX: number,
    offsetY: number,
    positionX?: string,
    positionY?: string,
    viewPortElementRef?: HTMLElement | null,
    axis?: CollisionCoordinates
): OffsetPosition | null => {
    if (elementRef === null || targetRef === null) {
        return null;
    }
    const target: HTMLElement | undefined = targetRef;
    if (!target) {
        return null;
    }

    const element: HTMLElement = elementRef;
    const viewPortElement: HTMLElement | null = viewPortElementRef ?? null;

    const position: OffsetPosition = calculatePosition(
        targetRef,
        positionX as string,
        positionY as string
    );
    position.left += offsetX;
    position.top += offsetY;

    const elementRect: DOMRect = element.getBoundingClientRect();
    const targetRect: DOMRect = target.getBoundingClientRect();

    if ((axis as CollisionCoordinates).X) {
        if (
            positionX === 'left' &&
                elementRect.right > (viewPortElement?.clientWidth || window.innerWidth)
        ) {
            position.left = targetRect.left - elementRect.width - offsetX;
            positionX = 'right';
        } else if (positionX === 'right' && elementRect.left < 0) {
            position.left = targetRect.right + offsetX;
            positionX = 'left';
        }
    }

    if ((axis as CollisionCoordinates).Y) {
        if (
            positionY === 'top' &&
                elementRect.bottom > (viewPortElement?.clientHeight || window.innerHeight)
        ) {
            position.top = targetRect.top - elementRect.height - offsetY;
            positionY = 'bottom';
        } else if (positionY === 'bottom' && elementRect.top < 0) {
            position.top = targetRect.bottom + offsetY;
            positionY = 'top';
        }
    }

    return position;
};

export const fit: (element: HTMLElement | null,
    viewPortElement?: HTMLElement | null,
    axis?: CollisionCoordinates, position?: OffsetPosition)
=> OffsetPosition | null = (
    element: HTMLElement | null,
    viewPortElement?: HTMLElement | null,
    axis?: CollisionCoordinates,
    position?: OffsetPosition
): OffsetPosition | null => {
    if (element === null) {
        return null;
    }
    if (!position) {
        return null;
    }
    const elementRect: DOMRect = element.getBoundingClientRect();
    const viewPortRect: DOMRect | { top: number; left: number; right: number; bottom: number } =
      viewPortElement?.getBoundingClientRect() || {
          top: 0,
          left: 0,
          right: window.innerWidth,
          bottom: window.innerHeight
      };

    let { left, top } = position;

    if (axis?.X) {
        if (left + elementRect.width > viewPortRect.right) {
            left = viewPortRect.right - elementRect.width;
        }
        if (left < viewPortRect.left) {
            left = viewPortRect.left;
        }
    }

    if (axis?.Y) {
        if (top + elementRect.height > viewPortRect.bottom) {
            top = viewPortRect.bottom - elementRect.height;
        }
        if (top < viewPortRect.top) {
            top = viewPortRect.top;
        }
    }

    return { left, top };
};

export const isCollide: (element: HTMLElement | null,
    viewPortElement: HTMLElement | null, x?: number, y?: number) => string[] = (
    element: HTMLElement | null,
    viewPortElement: HTMLElement | null,
    x?: number,
    y?: number
): string[] => {
    if (!element) {
        return [];
    }

    const targetContainer: HTMLElement | null = viewPortElement;
    const parentDocument: Document = element.ownerDocument;
    const elementRect: DOMRect = element.getBoundingClientRect();
    const left: number = x ? x : elementRect.left;
    const top: number = y ? y : elementRect.top;
    const right: number = left + elementRect.width;
    const bottom: number = top + elementRect.height;
    const scrollLeft: number = parentDocument?.documentElement.scrollLeft || parentDocument?.body.scrollLeft || 0;
    const scrollTop: number = parentDocument?.documentElement.scrollTop || parentDocument?.body.scrollTop || 0;
    const containerRect: DOMRect | { left: number; top: number; width: number; height: number } =
      targetContainer?.getBoundingClientRect() || { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight };
    const containerLeft: number = containerRect.left;
    const containerRight: number = scrollLeft + containerRect.left + containerRect.width;
    const containerTop: number = containerRect.top;
    const containerBottom: number = scrollTop + containerRect.top + containerRect.height;

    return [
        top - scrollTop < containerTop ? 'top' : '',
        right > containerRight ? 'right' : '',
        left - scrollLeft < containerLeft ? 'left' : '',
        bottom > containerBottom ? 'bottom' : ''
    ].filter(Boolean);
};

export const getTransformElement: (element: HTMLElement | null) => HTMLElement | null = (
    element: HTMLElement | null
): HTMLElement | null => {
    if (element === null) {
        return null;
    }
    let currentElement: HTMLElement | null = element;
    while (currentElement && currentElement !== document.body) {
        const style: CSSStyleDeclaration = window.getComputedStyle(currentElement);
        if (style.transform !== 'none' || parseFloat(style.zoom) !== 1) {
            return currentElement;
        }
        currentElement = currentElement.parentElement;
    }
    return null;
};

export const getZoomValue: (element: HTMLElement | null) => number = (element: HTMLElement | null): number => {
    if (element === null) {
        return 1;
    }
    const style: CSSStyleDeclaration = window.getComputedStyle(element);
    return parseFloat(style.zoom) || 1;
};
