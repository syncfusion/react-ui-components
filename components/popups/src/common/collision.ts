import { calculatePosition, OffsetPosition } from './position';

interface TopCorners {
    topSide: boolean;
    bottomSide: boolean;
}
interface LeftCorners {
    leftSide: boolean;
    rightSide: boolean;
}
interface EdgeOffset {
    TL: OffsetPosition | null;
    TR: OffsetPosition | null;
    BL: OffsetPosition | null;
    BR: OffsetPosition | null;
}
interface PositionLocation {
    posX: string;
    posY: string;
    offsetX: number;
    offsetY: number;
    position: OffsetPosition;
}

interface PositionCombination {
    posX: string;
    posY: string;
}

let parentDocument: Document;
let targetContainer: HTMLElement | null;

export interface CollisionCoordinates {
    X: boolean;
    Y: boolean;
}

export const fit: (
    element: HTMLElement,
    viewPortElement: HTMLElement | null,
    axis: CollisionCoordinates,
    position?: OffsetPosition
) => OffsetPosition = (
    element: HTMLElement,
    viewPortElement: HTMLElement | null = null,
    axis: CollisionCoordinates = { X: false, Y: false },
    position?: OffsetPosition
): OffsetPosition => {
    if (!axis.Y && !axis.X) {
        return { left: position?.left, top: position?.top } as OffsetPosition;
    }

    const elemData: DOMRect = getElementReact(element) as DOMRect;
    targetContainer = viewPortElement;
    parentDocument = element.ownerDocument;

    if (!position) {
        position = calculatePosition(element as unknown as HTMLElement, 'left', 'top');
    }

    if (axis.X) {
        const containerWidth: number = targetContainer ? getTargetContainerWidth() : getViewPortWidth();
        const containerLeft: number = ContainerLeft();
        const containerRight: number = ContainerRight();
        const overLeft: number = containerLeft - position.left;
        const overRight: number = position.left + elemData.width - containerRight;
        if (elemData.width > containerWidth) {
            if (overLeft > 0 && overRight <= 0) {
                position.left = containerRight - elemData.width;
            } else if (overRight > 0 && overLeft <= 0) {
                position.left = containerLeft;
            } else {
                position.left = overLeft > overRight ? (containerRight - elemData.width) : containerLeft;
            }
        } else if (overLeft > 0) {
            position.left += overLeft;
        } else if (overRight > 0) {
            position.left -= overRight;
        }
    }

    if (axis.Y) {
        const containerHeight: number = targetContainer ? getTargetContainerHeight() : getViewPortHeight();
        const containerTop: number = ContainerTop();
        const containerBottom: number = ContainerBottom();
        const overTop: number = containerTop - position.top;
        const overBottom: number = position.top + elemData.height - containerBottom;
        if (elemData.height > containerHeight) {
            if (overTop > 0 && overBottom <= 0) {
                position.top = containerBottom - elemData.height;
            } else if (overBottom > 0 && overTop <= 0) {
                position.top = containerTop;
            } else {
                position.top = overTop > overBottom ? (containerBottom - elemData.height) : containerTop;
            }
        } else if (overTop > 0) {
            position.top += overTop;
        } else if (overBottom > 0) {
            position.top -= overBottom;
        }
    }

    return position;
};

export const isCollide: (element: HTMLElement, viewPortElement: HTMLElement | null, x?: number, y?: number) => string[] = (
    element: HTMLElement, viewPortElement: HTMLElement | null = null, x?: number, y?: number): string[] => {
    const elemOffset: OffsetPosition = calculatePosition(element, 'left', 'top');
    if (typeof x === 'number') {
        elemOffset.left = x;
    }
    if (typeof y === 'number') {
        elemOffset.top = y;
    }
    const data: string[] = [];
    targetContainer = viewPortElement;
    parentDocument = element.ownerDocument;

    const elementRect: DOMRect = getElementReact(element) as DOMRect;
    const top: number = elemOffset.top;
    const left: number = elemOffset.left;
    const right: number = elemOffset.left + elementRect.width;
    const bottom: number = elemOffset.top + elementRect.height;

    const yAxis: TopCorners = topCollideCheck(top, bottom);
    const xAxis: LeftCorners = leftCollideCheck(left, right);

    if (yAxis.topSide) {
        data.push('top');
    }
    if (xAxis.rightSide) {
        data.push('right');
    }
    if (xAxis.leftSide) {
        data.push('left');
    }
    if (yAxis.bottomSide) {
        data.push('bottom');
    }
    return data;
};

const fallBackCalculation: (element: HTMLElement, target: HTMLElement, offsetX: number,  offsetY: number, positionX: string,
    positionY: string, viewPortElement: HTMLElement | null, axis: CollisionCoordinates) => OffsetPosition =
    (element: HTMLElement, target: HTMLElement, offsetX: number, offsetY: number,  positionX: string, positionY: string,
     viewPortElement: HTMLElement | null, axis: CollisionCoordinates) => {
        if (viewPortElement) {
            const basePosition: OffsetPosition = calculatePosition(target, positionX, positionY);
            const positionWithOffset: OffsetPosition = { left: basePosition.left + offsetX, top: basePosition.top + offsetY };
            return fit(element, viewPortElement, axis, positionWithOffset);
        }
        return calculatePosition(target, positionX, positionY);

    };

export const flip: (
    element: HTMLElement,
    target: HTMLElement,
    offsetX: number,
    offsetY: number,
    positionX: string,
    positionY: string,
    viewPortElement: HTMLElement | null,
    axis: CollisionCoordinates
) => OffsetPosition | null = (
    element: HTMLElement,
    target: HTMLElement,
    offsetX: number,
    offsetY: number,
    positionX: string,
    positionY: string,
    viewPortElement: HTMLElement | null = null,
    axis: CollisionCoordinates = { X: true, Y: true }
): OffsetPosition | null => {
    if (!target || !element || !positionX || !positionY || (!axis.X && !axis.Y)) {
        return null;
    }

    const tEdge: EdgeOffset = { TL: null, TR: null, BL: null, BR: null };
    const elementRect: DOMRect = getElementReact(element) as DOMRect;

    const pos: PositionLocation = {
        posX: positionX,
        posY: positionY,
        offsetX: offsetX,
        offsetY: offsetY,
        position: { left: 0, top: 0 }
    };

    targetContainer = viewPortElement;
    parentDocument = target.ownerDocument;

    updateElementData(target, tEdge, pos);

    const combinationPriority: PositionCombination[] = getPositionCombinationPriority(positionX, positionY, axis);
    let selectedPosition: OffsetPosition | null = null;
    let finalPosX: string = positionX;
    let finalPosY: string = positionY;
    const finalOffsetX: number = offsetX;
    const finalOffsetY: number = offsetY;

    for (const combination of combinationPriority) {
        let adjustedOffsetX: number = offsetX;
        let adjustedOffsetY: number = offsetY;

        if (combination.posX !== positionX) {
            if (positionX.toLowerCase() === 'right' && combination.posX.toLowerCase() === 'left') {
                adjustedOffsetX = offsetX - elementRect.width;
            } else if (positionX.toLowerCase() === 'left' && combination.posX.toLowerCase() === 'right') {
                adjustedOffsetX = offsetX;
            }
        }

        if (combination.posY !== positionY) {
            if (positionY.toLowerCase() === 'bottom' && combination.posY.toLowerCase() === 'top') {
                adjustedOffsetY = offsetY - elementRect.height;
            } else if (positionY.toLowerCase() === 'top' && combination.posY.toLowerCase() === 'bottom') {
                adjustedOffsetY = offsetY;
            }
        }

        const evaluation: {canFit: boolean; position: OffsetPosition; eEdge: EdgeOffset; } =
        evaluatePositionCombination(target, element, combination.posX, combination.posY, adjustedOffsetX, adjustedOffsetY, viewPortElement);
        finalPosX = combination.posX;
        finalPosY = combination.posY;
        if (evaluation.canFit) {
            selectedPosition = evaluation.position;
            break;
        }
    }

    if (selectedPosition === null) {
        const isTargetVisible: boolean = isTargetInViewport(target);
        if (isTargetVisible) {
            const targetRect: DOMRect | null = getElementReact(target);
            for (const combination of combinationPriority) {
                const basePosition: OffsetPosition = calculatePosition(target, combination.posX, combination.posY);
                const positionWithOffset: OffsetPosition = { left: basePosition.left + finalOffsetX, top: basePosition.top + finalOffsetY };
                const finalPosition: OffsetPosition = fit(element, viewPortElement, axis, positionWithOffset);
                if (targetRect && !checkElementOverlapsTarget(finalPosition, elementRect, targetRect)) {
                    selectedPosition = finalPosition;
                }
            }
            if (!selectedPosition) {
                selectedPosition = fallBackCalculation(element, target, offsetX, offsetY, positionX, positionY, viewPortElement, axis);
            }
        } else {
            selectedPosition = fallBackCalculation(element, target, offsetX, offsetY, positionX, positionY, viewPortElement, axis);
        }
    }

    const finalPosition: PositionLocation = {  posX: finalPosX,  posY: finalPosY, offsetX: finalOffsetX, offsetY: finalOffsetY,
        position: selectedPosition };

    const finalCssPosition: OffsetPosition = setPopup(element, finalPosition);
    return finalCssPosition;
};

export const getElementReact: (element: HTMLElement) => DOMRect | null = (element: HTMLElement): DOMRect | null => {
    if (!element) { return null; }
    let elementRect: DOMRect;
    if (window.getComputedStyle(element).display === 'none') {
        const oldVisibility: string = (element as HTMLElement).style.visibility;
        const oldDisplay: string = (element as HTMLElement).style.display;
        (element as HTMLElement).style.visibility = 'hidden';
        (element as HTMLElement).style.display = 'block';
        elementRect = element.getBoundingClientRect();
        (element as HTMLElement).style.display = oldDisplay;
        (element as HTMLElement).style.visibility = oldVisibility;
    } else {
        elementRect = element.getBoundingClientRect();
    }
    return elementRect;
};

export const getOppositePosition: (position: string) => string = (position: string): string => {
    switch (position.toLowerCase()) {
    case 'left':
        return 'right';
    case 'right':
        return 'left';
    case 'top':
        return 'bottom';
    case 'bottom':
        return 'top';
    default:
        return position;
    }
};

export const getPositionCombinationPriority: (
    initialPosX: string,
    initialPosY: string,
    axis: CollisionCoordinates
) => PositionCombination[] = (
    initialPosX: string,
    initialPosY: string,
    axis: CollisionCoordinates
): PositionCombination[] => {
    const combinations: PositionCombination[] = [];
    if (axis.X && axis.Y) {
        combinations.push({ posX: initialPosX, posY: initialPosY });
        combinations.push({ posX: initialPosX, posY: getOppositePosition(initialPosY) });
        combinations.push({ posX: getOppositePosition(initialPosX), posY: getOppositePosition(initialPosY) });
        combinations.push({ posX: getOppositePosition(initialPosX), posY: initialPosY });
    } else if (axis.X && !axis.Y) {
        combinations.push({ posX: initialPosX, posY: initialPosY });
        combinations.push({ posX: getOppositePosition(initialPosX), posY: initialPosY });
    } else if (!axis.X && axis.Y) {
        combinations.push({ posX: initialPosX, posY: initialPosY });
        combinations.push({ posX: initialPosX, posY: getOppositePosition(initialPosY) });
    } else {
        combinations.push({ posX: initialPosX, posY: initialPosY });
    }

    return combinations;
};

export const evaluatePositionCombination: (
    target: HTMLElement,
    element: HTMLElement,
    posX: string,
    posY: string,
    offsetX: number,
    offsetY: number,
    viewport: HTMLElement | null
) => { canFit: boolean; position: OffsetPosition; eEdge: EdgeOffset } = (
    target: HTMLElement,
    element: HTMLElement,
    posX: string,
    posY: string,
    offsetX: number,
    offsetY: number,
    viewport: HTMLElement | null = null
): { canFit: boolean; position: OffsetPosition; eEdge: EdgeOffset } => {
    targetContainer = viewport;
    parentDocument = target.ownerDocument;
    const basePosition: OffsetPosition = calculatePosition(target, posX, posY);

    const positionWithOffset: OffsetPosition = {
        left: basePosition.left + offsetX,
        top: basePosition.top + offsetY
    };
    const elementRect: DOMRect | null = getElementReact(element);
    if (!elementRect) {
        return { canFit: false, position: positionWithOffset, eEdge: { TL: null, TR: null, BL: null, BR: null } };
    }
    const pos: PositionLocation = {
        posX: posX,
        posY: posY,
        offsetX: offsetX,
        offsetY: offsetY,
        position: positionWithOffset
    };
    const eEdge: EdgeOffset = { TL: null, TR: null, BL: null, BR: null };
    setPosition(eEdge, pos, elementRect);
    const eLeft: number = (eEdge.TL as OffsetPosition).left;
    const eRight: number = (eEdge.TR as OffsetPosition).left;
    const eTop: number = (eEdge.TL as OffsetPosition).top;
    const eBottom: number = (eEdge.BL as OffsetPosition).top;
    const containerLeft: number = ContainerLeft();
    const containerRight: number = ContainerRight();
    const containerTop: number = ContainerTop();
    const containerBottom: number = ContainerBottom();
    const canFit: boolean =  eLeft >= containerLeft && eRight <= containerRight && eTop >= containerTop && eBottom <= containerBottom;
    return {  canFit,  position: positionWithOffset,  eEdge: eEdge };
};

const setPopup: (element: HTMLElement, pos: PositionLocation) => OffsetPosition = (element: HTMLElement, pos: PositionLocation):
OffsetPosition => {
    let left: number = 0;
    let top: number = 0;
    const offsetParent: Element | null = (element as HTMLElement).offsetParent;
    if (
        offsetParent != null &&
        (getComputedStyle(offsetParent as Element).position === 'absolute' ||
            getComputedStyle(offsetParent as Element).position === 'relative')
    ) {
        const data: OffsetPosition = calculatePosition(offsetParent as HTMLElement, 'left', 'top');
        left = data.left;
        top = data.top;
    }

    let scaleX: number = 1;
    let scaleY: number = 1;
    const transformElement: HTMLElement | null = getTransformElement(element);
    if (transformElement) {
        const transformStyle: string = getComputedStyle(transformElement).transform;
        if (transformStyle && transformStyle !== 'none') {
            const values: RegExpMatchArray | null = transformStyle.match(/matrix\(([^)]+)\)/);
            if (values && values[1]) {
                const parts: number[] = values[1].split(',').map(parseFloat);
                scaleX = parts[0];
                scaleY = parts[3];
            }
        }
        const zoomStyle: string = getComputedStyle(transformElement).zoom as unknown as string;
        const zoomVal: number = parseFloat(zoomStyle);
        if (!isNaN(zoomVal) && zoomVal !== 1) {
            const bodyZoom: number = getZoomValue(document.body as unknown as HTMLElement);
            scaleX = bodyZoom * scaleX;
            scaleY = bodyZoom * scaleY;
        }
    }

    const topCss: number = pos.position.top / scaleY - top / scaleY;
    const leftCss: number = pos.position.left / scaleX - left / scaleX;
    (element as HTMLElement).style.top = topCss + 'px';
    (element as HTMLElement).style.left = leftCss + 'px';

    return { left: leftCss, top: topCss };
};

const updateElementData: ( target: HTMLElement,  edge: EdgeOffset, pos: PositionLocation ) =>
void = ( target: HTMLElement, edge: EdgeOffset, pos: PositionLocation ): void => {
    pos.position = calculatePosition(target, pos.posX, pos.posY);
    edge.TL = calculatePosition(target, 'left', 'top');
    edge.TR = calculatePosition(target, 'right', 'top');
    edge.BR = calculatePosition(target, 'left', 'bottom');
    edge.BL = calculatePosition(target, 'right', 'bottom');
};

const setPosition: (eStatus: EdgeOffset, pos: PositionLocation, elementRect: DOMRect) =>
void = (eStatus: EdgeOffset, pos: PositionLocation, elementRect: DOMRect): void => {
    eStatus.TL = { top: pos.position.top, left: pos.position.left };
    eStatus.TR = { top: (eStatus.TL as OffsetPosition).top, left: (eStatus.TL as OffsetPosition).left + elementRect.width };
    eStatus.BL = { top: (eStatus.TL as OffsetPosition).top + elementRect.height, left: (eStatus.TL as OffsetPosition).left };
    eStatus.BR = { top: (eStatus.TL as OffsetPosition).top + elementRect.height, left: (eStatus.TL as OffsetPosition).left +
         elementRect.width };
};

const checkElementOverlapsTarget: (elementPosition: OffsetPosition, elementRect: DOMRect, targetRect: DOMRect) => boolean =
    (elementPosition: OffsetPosition, elementRect: DOMRect, targetRect: DOMRect): boolean => {
        const elemLeft: number = elementPosition.left;
        const elemRight: number = elementPosition.left + elementRect.width;
        const elemTop: number = elementPosition.top;
        const elemBottom: number = elementPosition.top + elementRect.height;
        return elemLeft < targetRect.right && elemRight > targetRect.left &&
            elemTop < targetRect.bottom && elemBottom > targetRect.top;
    };

const getContainerScrollDimension: (dimension?: number) => number | undefined =
    (dimension?: number): number | undefined => {
        if (!targetContainer || typeof document === 'undefined' || targetContainer === document.documentElement || targetContainer === document.body) {
            return undefined;
        }
        return dimension;
    };

const leftCollideCheck: (left: number, right: number) => LeftCorners = ( left: number, right: number ): LeftCorners => {
    let leftSide: boolean = false;
    let rightSide: boolean = false;
    if (left - getBodyScrollLeft() < ContainerLeft()) {
        leftSide = true;
    }
    if (right > ContainerRight(getContainerScrollDimension(targetContainer?.scrollWidth))) {
        rightSide = true;
    }
    return { leftSide, rightSide };
};

const topCollideCheck: (top: number, bottom: number) => TopCorners = ( top: number, bottom: number ): TopCorners => {
    let topSide: boolean = false;
    let bottomSide: boolean = false;
    if (top - getBodyScrollTop() < ContainerTop()) {
        topSide = true;
    }
    if (bottom > ContainerBottom(getContainerScrollDimension(targetContainer?.scrollHeight))) {
        bottomSide = true;
    }
    return { topSide, bottomSide };
};

const isTargetInViewport: (target: HTMLElement) => boolean = (target: HTMLElement): boolean => {
    const targetRect: DOMRect | null = getElementReact(target);
    if (!targetRect) {
        return false;
    }
    const containerLeft: number = ContainerLeft();
    const containerRight: number = ContainerRight();
    const containerTop: number = ContainerTop();
    const containerBottom: number = ContainerBottom();
    const isInHorizontal: boolean = targetRect.left < containerRight && targetRect.right > containerLeft;
    const isInVertical: boolean = targetRect.top < containerBottom && targetRect.bottom > containerTop;
    return isInHorizontal && isInVertical;
};

const getTargetContainerWidth: () => number = (): number => {
    return (targetContainer as HTMLElement).getBoundingClientRect().width;
};
const getTargetContainerHeight: () => number = (): number => {
    return (targetContainer as HTMLElement).getBoundingClientRect().height;
};
const getTargetContainerLeft: () => number = (): number => {
    return (targetContainer as HTMLElement).getBoundingClientRect().left;
};
const getTargetContainerTop: () => number = (): number => {
    return (targetContainer as HTMLElement).getBoundingClientRect().top;
};

const ContainerTop: () => number = (): number => {
    if (targetContainer) {
        return getTargetContainerTop();
    }
    return 0;
};
const ContainerLeft: () => number = (): number => {
    if (targetContainer) {
        return getTargetContainerLeft();
    }
    return 0;
};
const getEffectiveContainerDimension: (scrollDimension: number | undefined, fallbackDimension: () => number) => number =
(scrollDimension: number | undefined, fallbackDimension: () => number): number => {
    return scrollDimension && scrollDimension > 0 ? scrollDimension : fallbackDimension();
};

const ContainerRight: (scrollLeft?: number) => number = (scrollLeft: number = 0): number => {
    if (targetContainer) {
        return getBodyScrollLeft() + getTargetContainerLeft() + getEffectiveContainerDimension(scrollLeft, getTargetContainerWidth);
    }
    return getBodyScrollLeft() + getViewPortWidth();
};
const ContainerBottom: (scrollTop?: number) => number = (scrollTop: number = 0): number => {
    if (targetContainer) {
        return getBodyScrollTop() + getTargetContainerTop() + getEffectiveContainerDimension(scrollTop, getTargetContainerHeight);
    }
    return getBodyScrollTop() + getViewPortHeight();
};

const getBodyScrollTop: () => number = (): number => {
    return parentDocument.documentElement.scrollTop || parentDocument.body.scrollTop || 0;
};
const getBodyScrollLeft: () => number = (): number => {
    return parentDocument.documentElement.scrollLeft || parentDocument.body.scrollLeft || 0;
};
const getViewPortHeight: () => number = (): number => {
    return window.innerHeight;
};
const getViewPortWidth: () => number = (): number => {
    const windowWidth: number = window.innerWidth;
    const documentRect: DOMRect = document.documentElement.getBoundingClientRect();
    const offsetWidth: number = documentRect?.width || 0;
    return windowWidth - (windowWidth - offsetWidth);
};

export const getZoomValue: (element: HTMLElement) => number = (element: HTMLElement): number => {
    const zoomValue: string = getComputedStyle(element).zoom as unknown as string;
    const parsed: number = parseFloat(zoomValue);
    return parsed || 1;
};

export const getTransformElement: (element: HTMLElement) => HTMLElement | null = (element: HTMLElement): HTMLElement | null => {
    let current: HTMLElement | null = element;
    while (current) {
        const transform: string = window.getComputedStyle(current).transform;
        const zoomVal: number = getZoomValue(document.body as unknown as HTMLElement);
        if ((transform && transform !== 'none') || (zoomVal && zoomVal !== 1)) {
            return current;
        }
        if (current === document.body) {
            return null;
        }
        current = (current.offsetParent || current.parentElement) as HTMLElement;
    }
    return null;
};

export const getFixedScrollableParent: (element: HTMLElement, fixedParent?: boolean)
=> HTMLElement[] = (element: HTMLElement, fixedParent: boolean = false): HTMLElement[] => {
    const scrollParents: HTMLElement[] = [];
    const overflowRegex: RegExp = /(auto|scroll)/;
    let parent: HTMLElement | null = element.parentElement;

    while (parent && parent.tagName !== 'HTML') {
        const { position, overflow, overflowY, overflowX } = getComputedStyle(parent);
        if (!(getComputedStyle(element).position === 'absolute' && position === 'static')
            && overflowRegex.test(`${overflow} ${overflowY} ${overflowX}`)) {
            scrollParents.push(parent);
        }
        parent = parent.parentElement;
    }

    if (!fixedParent) {
        scrollParents.push(document.documentElement);
    }
    return scrollParents;
};

export const getZindexPartial: (element: HTMLElement) => number = (element: HTMLElement): number => {
    let parent: HTMLElement | null = element.parentElement;
    const parentZindex: string[] = [];

    while (parent) {
        if (parent.tagName !== 'BODY') {
            const computedStyle: CSSStyleDeclaration = window.getComputedStyle(parent);
            const index: string = computedStyle.zIndex;
            const position: string = computedStyle.position;
            if (index !== 'auto' && position !== 'static') {
                parentZindex.push(index);
            }
            parent = parent.parentElement;
        } else {
            break;
        }
    }

    const childrenZindex: string[] = [];
    for (let i: number = 0; i < document.body.children.length; i++) {
        const child: Element = document.body.children[i as number] as Element;
        if (!element.isEqualNode(child) && child instanceof HTMLElement) {
            const computedStyle: CSSStyleDeclaration = window.getComputedStyle(child);
            const index: string = computedStyle.zIndex;
            const position: string = computedStyle.position;
            if (index !== 'auto' && position !== 'static') {
                childrenZindex.push(index);
            }
        }
    }
    childrenZindex.push('999');

    const siblingsZindex: string[] = [];
    if (element.parentElement && element.parentElement.tagName !== 'BODY') {
        const childNodes: HTMLElement[] = Array.from(element.parentElement.children) as HTMLElement[];
        for (let i: number = 0; i < childNodes.length; i++) {
            const child: Element = childNodes[i as number] as Element;
            if (!element.isEqualNode(child) && child instanceof HTMLElement) {
                const computedStyle: CSSStyleDeclaration = window.getComputedStyle(child);
                const index: string = computedStyle.zIndex;
                const position: string = computedStyle.position;
                if (index !== 'auto' && position !== 'static') {
                    siblingsZindex.push(index);
                }
            }
        }
    }

    const finalValue: string[] = parentZindex.concat(childrenZindex, siblingsZindex);
    const currentZindexValue: number = Math.max(...finalValue.map(Number)) + 1;
    return currentZindexValue > 2147483647 ? 2147483647 : currentZindexValue;
};
