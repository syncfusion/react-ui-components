// position.ts
import * as React from 'react';
/**
 * Provides information about a OffsetPosition.
 */
export interface OffsetPosition {
    left: number;
    top: number;
}

/**
 * Interface for defining the position properties.
 */
export interface PositionProps {
    X: string;
    Y: string;
}

/**
 * Calculates the absolute position of an element based on its reference, desired position,
 * and optionally the target values.
 *
 * @param {React.RefObject<HTMLElement>} elementRef - Reference to the HTML element.
 * @param {string} positionX - Desired X position ('left', 'center', 'right').
 * @param {string} positionY - Desired Y position ('top', 'center', 'bottom').
 * @param {DOMRect} [targetValues] - Optional DOMRect values to adjust the position.
 * @returns {OffsetPosition} - Returns the calculated offset position.
 */
export function calculatePosition(
    elementRef: React.RefObject<HTMLElement>,
    positionX: string,
    positionY: string,
    targetValues?: DOMRect
): OffsetPosition {
    if (!elementRef.current) {
        console.warn('calculatePosition: elementRef does not have a current value.');
        return { left: 0, top: 0 };
    }

    const currentElement: HTMLElement = elementRef.current;
    const parentDocument: Document = currentElement.ownerDocument;
    const elementRect: ClientRect = currentElement.getBoundingClientRect() || targetValues;
    const fixedElement: boolean = getComputedStyle(currentElement).position === 'fixed';
    const scrollTop: number = fixedElement ? 0 : parentDocument.documentElement.scrollTop || parentDocument.body.scrollTop;
    const scrollLeft: number = fixedElement ? 0 : parentDocument.documentElement.scrollLeft || parentDocument.body.scrollLeft;

    const positionMap: { [key: string]: OffsetPosition } = {
        'topcenter': { left: elementRect.left + elementRect.width / 2, top: elementRect.top + scrollTop },
        'topright': { left: elementRect.right, top: elementRect.top + scrollTop },
        'centercenter': { left: elementRect.left + elementRect.width / 2, top: elementRect.top + elementRect.height / 2 + scrollTop },
        'centerright': { left: elementRect.right, top: elementRect.top + elementRect.height / 2 + scrollTop },
        'centerleft': { left: elementRect.left + scrollLeft, top: elementRect.top + elementRect.height / 2 + scrollTop },
        'bottomcenter': { left: elementRect.left + elementRect.width / 2, top: elementRect.bottom + scrollTop },
        'bottomright': { left: elementRect.right, top: elementRect.bottom + scrollTop },
        'bottomleft': { left: elementRect.left + scrollLeft, top: elementRect.bottom + scrollTop },
        'topleft': { left: elementRect.left + scrollLeft, top: elementRect.top + scrollTop }
    };

    return positionMap[`${positionY.toLowerCase()}${positionX.toLowerCase()}`] || positionMap['topleft'];
}

/**
 * Calculates the position of an element relative to an anchor element.
 *
 * @param {React.RefObject<HTMLElement>} anchor - Reference to the anchor HTML element.
 * @param {React.RefObject<HTMLElement>} element - Reference to the HTML element to position.
 * @returns {OffsetPosition} - Returns the relative offset position.
 */
export function calculateRelativeBasedPosition(
    anchor: React.RefObject<HTMLElement>,
    element: React.RefObject<HTMLElement>
): OffsetPosition {
    if (!anchor.current || !element.current) {
        console.warn('calculateRelativeBasedPosition: Missing anchor or element ref.');
        return { left: 0, top: 0 };
    }

    const anchorRect: DOMRect = anchor.current.getBoundingClientRect();
    const elementRect: DOMRect = element.current.getBoundingClientRect();
    const fixedElement: boolean = getComputedStyle(element.current).position === 'fixed';

    return {
        left: anchorRect.left - elementRect.left + (fixedElement ? 0 : window.pageXOffset || document.documentElement.scrollLeft),
        top: anchorRect.top - elementRect.top + (fixedElement ? 0 : window.pageYOffset || document.documentElement.scrollTop)
    };
}
