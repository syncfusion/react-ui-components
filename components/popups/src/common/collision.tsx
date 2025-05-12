// collision.ts
import * as React from 'react';
import { calculatePosition, OffsetPosition } from './position';
import { RefObject } from 'react';

export interface CollisionCoordinates {
    X: boolean;
    Y: boolean;
}

/**
 * Calculates the flipped position for an element.
 *
 * @param {RefObject<HTMLElement>} elementRef - The reference to the HTML element.
 * @param {RefObject<HTMLElement>} targetRef - The reference to the target HTML element.
 * @param {number} offsetX - The offset on the X-axis (default: 0).
 * @param {number} offsetY - The offset on the Y-axis (default: 0).
 * @param {string} [positionX] - The alignment for the X-axis (optional).
 * @param {string} [positionY] - The alignment for the Y-axis (optional).
 * @param {RefObject<HTMLElement> | null} [viewPortElementRef] - The reference to the viewport HTML element (default: null).
 * @param {CollisionCoordinates} [axis] - The axis directions for collision detection (default: {X: true, Y: true}).
 * @returns {OffsetPosition | null} The new position as OffsetPosition or null.
 */
export function flip(
    elementRef: RefObject<HTMLElement>,
    targetRef: RefObject<HTMLElement>,
    offsetX: number,
    offsetY: number,
    positionX?: string,
    positionY?: string,
    viewPortElementRef?: RefObject<HTMLElement> | null,
    axis?: CollisionCoordinates
): OffsetPosition | null {
    if (!elementRef?.current || !targetRef.current) {
        console.warn('Flip function: Missing element or target reference.');
        return null;
    }
    const target: HTMLElement | undefined = targetRef.current;
    if (!target) {
        console.warn('Flip function: Target element reference is null.');
        return null;
    }

    const element: HTMLElement = elementRef.current;
    const viewPortElement: HTMLElement | null = viewPortElementRef?.current ?? null;

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
}

/**
 * Adjusts the position of an element to fit within the viewport.
 *
 * @param {RefObject<HTMLElement>} element - The reference to the element to be positioned.
 * @param {RefObject<HTMLElement> | null} viewPortElement - The reference to the viewport element (default: null).
 * @param {CollisionCoordinates} axis - The axes to fit (default: {X: false, Y: false}).
 * @param {OffsetPosition} position - The starting position of the element.
 * @returns {OffsetPosition | null} The adjusted position as OffsetPosition or null.
 */
export function fit(
    element: React.RefObject<HTMLElement>,
    viewPortElement?: React.RefObject<HTMLElement> | null,
    axis?: CollisionCoordinates,
    position?: OffsetPosition
): OffsetPosition | null {
    if (!element?.current) {
        console.warn('Fit function: Missing element reference.');
        return null;
    }
    if (!position) {
        console.warn('Fit function: Missing position.');
        return null;
    }
    const elementRect: DOMRect = element.current.getBoundingClientRect();
    const viewPortRect: DOMRect | { top: number; left: number; right: number; bottom: number } =
        viewPortElement?.current?.getBoundingClientRect() || {
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
}

/**
 * Checks if the element collides with the viewport.
 *
 * @param {RefObject<HTMLElement> | null} element - The reference to the element to check.
 * @param {RefObject<HTMLElement> | null} viewPortElement - The reference to the viewport element (default: null).
 * @param {number} x - specifies the number
 * @param {number} y - specifies the number
 * @returns {string[]} An array of collision sides ('top', 'left', 'right', 'bottom').
 */
export function isCollide(element: React.RefObject<HTMLElement>,
                          viewPortElement: React.RefObject<HTMLElement>, x?: number, y?: number): string[] {
    if (!element?.current) {
        console.warn('isCollide function: Missing element reference.');
        return [];
    }

    const targetContainer: HTMLElement | null = viewPortElement?.current;
    const parentDocument: Document = element.current.ownerDocument;

    const elementRect: DOMRect = element.current.getBoundingClientRect();
    const left: number = x ? x : elementRect.left;
    const top: number = y ? y : elementRect.top;
    const right: number = left + elementRect.width;
    const bottom: number = top + elementRect.height;

    const scrollLeft: number = parentDocument?.documentElement.scrollLeft || parentDocument?.body.scrollLeft || 0;
    const scrollTop: number = parentDocument?.documentElement.scrollTop || parentDocument?.body.scrollTop || 0;

    const containerRect: | DOMRect | { left: number; top: number; width: number; height: number } =
        targetContainer?.getBoundingClientRect() || { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight };

    const containerLeft: number = containerRect.left;
    const containerRight: number = scrollLeft + containerRect.left + containerRect.width;
    const containerTop: number = containerRect.top;
    const containerBottom: number = scrollTop + containerRect.top + containerRect.height;

    return [top - scrollTop < containerTop ? 'top' : '', right > containerRight ? 'right' : '',
        left - scrollLeft < containerLeft ? 'left' : '', bottom > containerBottom ? 'bottom' : ''].filter(Boolean);
}

/**
 * Finds the nearest transform element for an HTMLElement.
 *
 * @param {RefObject<HTMLElement>} element - The reference to the HTML element.
 * @returns {HTMLElement | null} The nearest transform element or null.
 */
export function getTransformElement(
    element: React.RefObject<HTMLElement>
): HTMLElement | null {
    if (!element.current) {
        console.warn('getTransformElement function: Missing element reference.');
        return null;
    }

    let currentElement: HTMLElement | null = element.current;

    while (currentElement && currentElement !== document.body) {
        const style: CSSStyleDeclaration = window.getComputedStyle(currentElement);
        if (style.transform !== 'none' || parseFloat(style.zoom) !== 1) {
            return currentElement;
        }
        currentElement = currentElement.parentElement;
    }

    return null;
}

/**
 * Retrieves the zoom value of an HTMLElement.
 *
 * @param {RefObject<HTMLElement>} element - The reference to the HTML element.
 * @returns {number} The zoom value as a float.
 */
export function getZoomValue(element: React.RefObject<HTMLElement>): number {
    if (!element.current) {
        console.warn('getZoomValue function: Missing element reference.');
        return 1;
    }

    const style: CSSStyleDeclaration = window.getComputedStyle(element.current);
    return parseFloat(style.zoom) || 1;
}
