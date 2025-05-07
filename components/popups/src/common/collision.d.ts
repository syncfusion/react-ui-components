import * as React from 'react';
import { OffsetPosition } from './position';
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
export declare function flip(elementRef: RefObject<HTMLElement>, targetRef: RefObject<HTMLElement>, offsetX: number, offsetY: number, positionX?: string, positionY?: string, viewPortElementRef?: RefObject<HTMLElement> | null, axis?: CollisionCoordinates): OffsetPosition | null;
/**
 * Adjusts the position of an element to fit within the viewport.
 *
 * @param {RefObject<HTMLElement>} element - The reference to the element to be positioned.
 * @param {RefObject<HTMLElement> | null} viewPortElement - The reference to the viewport element (default: null).
 * @param {CollisionCoordinates} axis - The axes to fit (default: {X: false, Y: false}).
 * @param {OffsetPosition} position - The starting position of the element.
 * @returns {OffsetPosition | null} The adjusted position as OffsetPosition or null.
 */
export declare function fit(element: React.RefObject<HTMLElement>, viewPortElement?: React.RefObject<HTMLElement> | null, axis?: CollisionCoordinates, position?: OffsetPosition): OffsetPosition | null;
/**
 * Checks if the element collides with the viewport.
 *
 * @param {RefObject<HTMLElement> | null} element - The reference to the element to check.
 * @param {RefObject<HTMLElement> | null} viewPortElement - The reference to the viewport element (default: null).
 * @param {number} x - specifies the number
 * @param {number} y - specifies the number
 * @returns {string[]} An array of collision sides ('top', 'left', 'right', 'bottom').
 */
export declare function isCollide(element: React.RefObject<HTMLElement>, viewPortElement: React.RefObject<HTMLElement>, x?: number, y?: number): string[];
/**
 * Finds the nearest transform element for an HTMLElement.
 *
 * @param {RefObject<HTMLElement>} element - The reference to the HTML element.
 * @returns {HTMLElement | null} The nearest transform element or null.
 */
export declare function getTransformElement(element: React.RefObject<HTMLElement>): HTMLElement | null;
/**
 * Retrieves the zoom value of an HTMLElement.
 *
 * @param {RefObject<HTMLElement>} element - The reference to the HTML element.
 * @returns {number} The zoom value as a float.
 */
export declare function getZoomValue(element: React.RefObject<HTMLElement>): number;
