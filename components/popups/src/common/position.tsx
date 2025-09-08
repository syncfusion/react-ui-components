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

export const calculatePosition: (elementRef: HTMLElement | null,
    positionX: string, positionY: string, targetValues?: DOMRect) => OffsetPosition = (
    elementRef: HTMLElement | null,
    positionX: string,
    positionY: string,
    targetValues?: DOMRect
): OffsetPosition => {
    if (!elementRef || elementRef === null) {
        return { left: 0, top: 0 };
    }

    const currentElement: HTMLElement = elementRef;
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
};

export const calculateRelativeBasedPosition: (anchor: HTMLElement | null,
    element: HTMLElement | null) => OffsetPosition = (
    anchor: HTMLElement | null,
    element: HTMLElement | null
): OffsetPosition => {
    if (anchor === null || element === null) {
        return { left: 0, top: 0 };
    }
    const anchorRect: DOMRect = anchor.getBoundingClientRect();
    const elementRect: DOMRect = element.getBoundingClientRect();
    const fixedElement: boolean = getComputedStyle(element).position === 'fixed';
    return {
        left: anchorRect.left - elementRect.left + (fixedElement ? 0 : window.pageXOffset || document.documentElement.scrollLeft),
        top: anchorRect.top - elementRect.top + (fixedElement ? 0 : window.pageYOffset || document.documentElement.scrollTop)
    };
};
