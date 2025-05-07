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
export declare function calculatePosition(elementRef: React.RefObject<HTMLElement>, positionX: string, positionY: string, targetValues?: DOMRect): OffsetPosition;
/**
 * Calculates the position of an element relative to an anchor element.
 *
 * @param {React.RefObject<HTMLElement>} anchor - Reference to the anchor HTML element.
 * @param {React.RefObject<HTMLElement>} element - Reference to the HTML element to position.
 * @returns {OffsetPosition} - Returns the relative offset position.
 */
export declare function calculateRelativeBasedPosition(anchor: React.RefObject<HTMLElement>, element: React.RefObject<HTMLElement>): OffsetPosition;
