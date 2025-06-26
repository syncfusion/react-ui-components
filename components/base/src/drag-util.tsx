import { select } from './dom';
import { IPosition } from './draggable';
import { isNullOrUndefined } from './util';

/**
 * Position coordinates
 */
export interface PositionCoordinates {
    left?: number;
    top?: number;
    bottom?: number;
    right?: number;
}

/**
 * Coordinates for element position
 *
 * @private
 */
export interface Coordinates {
    /**
     * Defines the x Coordinate of page.
     */
    pageX?: number;
    /**
     * Defines the y Coordinate of page.
     */
    pageY?: number;
    /**
     * Defines the x Coordinate of client.
     */
    clientX?: number;
    /**
     * Defines the y Coordinate of client.
     */
    clientY?: number;
}

let left: number;
let top: number;
let width: number;
let height: number;

/**
 * Sets the permitted drag area boundaries based on the defined dragArea.
 *
 * @private
 * @param {HTMLElement | string} dragArea - The element or selector string defining the drag area
 * @param {Element} helperElement - The helper element used in dragging
 * @param {PositionCoordinates} borderWidth - The border width of the drag area
 * @param {PositionCoordinates} padding - The padding of the drag area
 * @param {PositionCoordinates} dragLimit - The object to store the calculated drag limits
 * @returns {void}
 */
export function setDragArea(
    dragArea: HTMLElement | string, helperElement: Element,
    borderWidth: PositionCoordinates, padding: PositionCoordinates,
    dragLimit: PositionCoordinates
): void {
    let eleWidthBound: number;
    let eleHeightBound: number;
    let top: number = 0;
    let left: number = 0;
    let ele: HTMLElement;
    const type: string = typeof dragArea;
    if (type === 'string') {
        ele = select(dragArea as string) as HTMLElement;
    } else {
        ele = dragArea as HTMLElement;
    }
    if (ele) {
        const elementArea: ClientRect | DOMRect = ele.getBoundingClientRect();
        eleWidthBound = ele.scrollWidth ? ele.scrollWidth : elementArea.right - elementArea.left;
        eleHeightBound = ele.scrollHeight ? (dragArea && !isNullOrUndefined(helperElement) && helperElement.classList.contains('sf-treeview')) ? ele.clientHeight : ele.scrollHeight : elementArea.bottom - elementArea.top;
        const keys: string[] = ['Top', 'Left', 'Bottom', 'Right'];
        const styles: CSSStyleDeclaration = getComputedStyle(ele);
        for (let i: number = 0; i < keys.length; i++) {
            const key: string = keys[parseInt(i.toString(), 10)];
            const tborder: string = styles['border' + key + 'Width'];
            const tpadding: string = styles['padding' + key];
            const lowerKey: string = key.toLowerCase();
            (borderWidth as Record<string, number>)[`${lowerKey}`] = isNaN(parseFloat(tborder)) ? 0 : parseFloat(tborder);
            (padding as Record<string, number>)[`${lowerKey}`] = isNaN(parseFloat(tpadding)) ? 0 : parseFloat(tpadding);
        }
        if (dragArea && !isNullOrUndefined(helperElement) && helperElement.classList.contains('sf-treeview')) {
            top = elementArea.top + document.scrollingElement.scrollTop;
        } else {
            top = elementArea.top;
        }
        left = elementArea.left;
        dragLimit.left = left + borderWidth.left + padding.left;
        dragLimit.top = ele.offsetTop + borderWidth.top + padding.top;
        dragLimit.right = left + eleWidthBound - (borderWidth.right + padding.right);
        dragLimit.bottom = top + eleHeightBound - (borderWidth.bottom + padding.bottom);
    }
}

/**
 * Retrieves the document's full height or width, considering the scroll and offset values.
 *
 * @private
 * @param {string} str - The dimension type ('Height' or 'Width') to calculate.
 * @returns {number} - The maximum value across scroll, offset, and client dimensions.
 */
export function getDocumentWidthHeight(str: 'Height' | 'Width'): number {
    const docBody: HTMLElement = document.body;
    const docEle: HTMLElement = document.documentElement;
    return Math.max(
        docBody['scroll' + str], docEle['scroll' + str],
        docBody['offset' + str], docEle['offset' + str],
        docEle['client' + str]
    );
}

/**
 * Determines if a given element is within the bounds of the viewport.
 *
 * @private
 * @param {HTMLElement} el - The element to check.
 * @returns {boolean} - True if the element is in the viewport, false otherwise.
 */
export function elementInViewport(el: HTMLElement): boolean {
    top = el.offsetTop;
    left = el.offsetLeft;
    width = el.offsetWidth;
    height = el.offsetHeight;
    while (el.offsetParent) {
        el = el.offsetParent as HTMLElement;
        top += el.offsetTop;
        left += el.offsetLeft;
    }
    return (
        top >= window.pageYOffset &&
        left >= window.pageXOffset &&
        (top + height) <= (window.pageYOffset + window.innerHeight) &&
        (left + width) <= (window.pageXOffset + window.innerWidth)
    );
}

/**
 * Gets the coordinates of a mouse or touch event.
 *
 * @private
 * @param {MouseEvent | TouchEvent} evt - The event object.
 * @returns {Coordinates} - The x and y coordinates of the page and client.
 */
export function getCoordinates(evt: MouseEvent & TouchEvent): Coordinates {
    if (evt.type.indexOf('touch') > -1) {
        return evt.changedTouches[0];
    }
    return evt as Coordinates;
}

/**
 * Calculates the parent position of the element relative to the document.
 *
 * @private
 * @param {Element} ele - The element for which the parent position is calculated.
 * @returns {IPosition} - The calculated left and top position.
 */
export function calculateParentPosition(ele: Element): IPosition {
    if (isNullOrUndefined(ele)) {
        return { left: 0, top: 0 };
    }
    const rect: ClientRect | DOMRect = ele.getBoundingClientRect();
    const style: CSSStyleDeclaration = getComputedStyle(ele);
    return {
        left: (rect.left + window.pageXOffset) - parseInt(style.marginLeft, 10),
        top: (rect.top + window.pageYOffset) - parseInt(style.marginTop, 10)
    };
}

/**
 * Retrieves all elements from a point defined by event coordinates.
 *
 * @private
 * @param {MouseEvent | TouchEvent} evt - The event object containing coordinates.
 * @returns {Element[]} - An array of elements located at the event's point.
 */
export function getPathElements(evt: MouseEvent & TouchEvent): Element[] {
    const elementTop: number = evt.clientX > 0 ? evt.clientX : 0;
    const elementLeft: number = evt.clientY > 0 ? evt.clientY : 0;
    return document.elementsFromPoint(elementTop, elementLeft);
}

/**
 * Identifies the scrollable parent of the current node element.
 *
 * @private
 * @param {Element[]} nodes - The path of elements to check.
 * @param {boolean} reverse - Whether to reverse the array to check from bottom to top.
 * @returns {Element | null} - The first scrollable parent element or null.
 */
export function getScrollParent(nodes: Element[], reverse: boolean): Element | null {
    const nodeList: Element[] = reverse ? [...nodes].reverse() : nodes;
    for (const node of nodeList) {
        const computedStyle: CSSStyleDeclaration = window.getComputedStyle(node);
        const overflowY: string = computedStyle.overflowY;
        if ((overflowY === 'auto' || overflowY === 'scroll') &&
            node.scrollHeight > node.clientHeight) {
            return node;
        }
    }
    const scrollingElement: HTMLElement = document.scrollingElement as HTMLElement;
    const docOverflowY: string = window.getComputedStyle(scrollingElement).overflowY;
    if (docOverflowY === 'visible') {
        scrollingElement.style.overflow = 'auto';
        return scrollingElement;
    }
    return null;
}
