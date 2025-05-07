import { calculatePosition } from './position';
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
export function flip(elementRef, targetRef, offsetX, offsetY, positionX, positionY, viewPortElementRef, axis) {
    if (!elementRef?.current || !targetRef.current) {
        console.warn('Flip function: Missing element or target reference.');
        return null;
    }
    const target = targetRef.current;
    if (!target) {
        console.warn('Flip function: Target element reference is null.');
        return null;
    }
    const element = elementRef.current;
    const viewPortElement = viewPortElementRef?.current ?? null;
    const position = calculatePosition(targetRef, positionX, positionY);
    position.left += offsetX;
    position.top += offsetY;
    const elementRect = element.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    if (axis.X) {
        if (positionX === 'left' &&
            elementRect.right > (viewPortElement?.clientWidth || window.innerWidth)) {
            position.left = targetRect.left - elementRect.width - offsetX;
            positionX = 'right';
        }
        else if (positionX === 'right' && elementRect.left < 0) {
            position.left = targetRect.right + offsetX;
            positionX = 'left';
        }
    }
    if (axis.Y) {
        if (positionY === 'top' &&
            elementRect.bottom > (viewPortElement?.clientHeight || window.innerHeight)) {
            position.top = targetRect.top - elementRect.height - offsetY;
            positionY = 'bottom';
        }
        else if (positionY === 'bottom' && elementRect.top < 0) {
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
export function fit(element, viewPortElement, axis, position) {
    if (!element?.current) {
        console.warn('Fit function: Missing element reference.');
        return null;
    }
    if (!position) {
        console.warn('Fit function: Missing position.');
        return null;
    }
    const elementRect = element.current.getBoundingClientRect();
    const viewPortRect = viewPortElement?.current?.getBoundingClientRect() || {
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
export function isCollide(element, viewPortElement, x, y) {
    if (!element?.current) {
        console.warn('isCollide function: Missing element reference.');
        return [];
    }
    const targetContainer = viewPortElement?.current;
    const parentDocument = element.current.ownerDocument;
    const elementRect = element.current.getBoundingClientRect();
    const left = x ? x : elementRect.left;
    const top = y ? y : elementRect.top;
    const right = left + elementRect.width;
    const bottom = top + elementRect.height;
    const scrollLeft = parentDocument?.documentElement.scrollLeft || parentDocument?.body.scrollLeft || 0;
    const scrollTop = parentDocument?.documentElement.scrollTop || parentDocument?.body.scrollTop || 0;
    const containerRect = targetContainer?.getBoundingClientRect() || { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight };
    const containerLeft = containerRect.left;
    const containerRight = scrollLeft + containerRect.left + containerRect.width;
    const containerTop = containerRect.top;
    const containerBottom = scrollTop + containerRect.top + containerRect.height;
    return [top - scrollTop < containerTop ? 'top' : '', right > containerRight ? 'right' : '',
        left - scrollLeft < containerLeft ? 'left' : '', bottom > containerBottom ? 'bottom' : ''].filter(Boolean);
}
/**
 * Finds the nearest transform element for an HTMLElement.
 *
 * @param {RefObject<HTMLElement>} element - The reference to the HTML element.
 * @returns {HTMLElement | null} The nearest transform element or null.
 */
export function getTransformElement(element) {
    if (!element.current) {
        console.warn('getTransformElement function: Missing element reference.');
        return null;
    }
    let currentElement = element.current;
    while (currentElement && currentElement !== document.body) {
        const style = window.getComputedStyle(currentElement);
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
export function getZoomValue(element) {
    if (!element.current) {
        console.warn('getZoomValue function: Missing element reference.');
        return 1;
    }
    const style = window.getComputedStyle(element.current);
    return parseFloat(style.zoom) || 1;
}
