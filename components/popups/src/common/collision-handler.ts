import { CollisionAxis, CollisionType } from '../dialog';
import { AlignmentPoint, OffsetPosition, CollisionCoordinates, FlipResult,
    HorizontalAlign, VerticalAlign } from './alignment-types';
import { applyPosition, calculatePosition, getViewportBounds } from './popup-positioning';

export const DEFAULT_ANCHOR_ALIGN: AlignmentPoint = {
    horizontal: 'left',
    vertical: 'top'
};

export const DEFAULT_POPUP_ALIGN: AlignmentPoint = {
    horizontal: 'left',
    vertical: 'bottom'
};

export const getClippingAncestor: (target: HTMLElement | null) => HTMLElement | null = (target: HTMLElement | null): HTMLElement | null => {
    if (!target) { return null; }
    let node: HTMLElement | null = target.parentElement;
    while (node && node !== document.documentElement) {
        const style: CSSStyleDeclaration = window.getComputedStyle(node);
        const overflow: string = `${style.overflow} ${style.overflowX} ${style.overflowY}`;
        const clips: boolean = /(hidden|clip|auto|scroll)/.test(overflow);
        if (node === document.body) { return null; }
        if (clips) { return node; }
        node = node.parentElement;
    }
    return null;
};

export const getCoordinateContainer: (
    popup: HTMLElement | null,
    target: HTMLElement | null,
    viewportRef?: { current: HTMLElement | null } | null
) => HTMLElement | null = (
    popup: HTMLElement | null,
    target: HTMLElement | null,
    viewportRef?: { current: HTMLElement | null } | null
): HTMLElement | null => {
    if (viewportRef?.current) {
        return viewportRef.current;
    }
    const targetClip: HTMLElement | null = getClippingAncestor(target);
    if (targetClip && targetClip !== document.body) {
        return targetClip;
    }
    if (popup?.offsetParent && popup.offsetParent !== document.body) {
        return popup.offsetParent as HTMLElement;
    }
    return null;
};

export const getCollisions: (
    popupElement: HTMLElement | null,
    viewportElement: HTMLElement | null,
    left: number,
    top: number,
    usePageAbsolute?: boolean
) => string[] = (
    popupElement: HTMLElement | null,
    viewportElement: HTMLElement | null,
    left: number,
    top: number,
    usePageAbsolute: boolean = false
): string[] => {
    if (!popupElement) {
        return [];
    }
    const popupRect: DOMRect | null = getElementRect(popupElement as HTMLElement);
    const viewportBounds: { top: number; right: number; bottom: number; left: number } =
        getViewportBounds(viewportElement, usePageAbsolute);
    if (!popupRect) {
        return [];
    }
    const collisions: string[] = [];
    if (top < viewportBounds.top) {
        collisions.push('top');
    }
    if (top + popupRect.height > viewportBounds.bottom) {
        collisions.push('bottom');
    }
    if (left < viewportBounds.left) {
        collisions.push('left');
    }
    if (left + popupRect.width > viewportBounds.right) {
        collisions.push('right');
    }
    return collisions;
};

export const getOppositeAlignment: (align: AlignmentPoint) => AlignmentPoint =
    (align: AlignmentPoint): AlignmentPoint => {
        const horizontalFlips: Record<HorizontalAlign, HorizontalAlign> = {
            'left': 'right',
            'center': 'center',
            'right': 'left'
        };
        const verticalFlips: Record<VerticalAlign, VerticalAlign> = {
            'top': 'bottom',
            'center': 'center',
            'bottom': 'top'
        };
        return {
            horizontal: horizontalFlips[align.horizontal],
            vertical: verticalFlips[align.vertical]
        };
    };

const PRIORITY_ALIGNMENT_COMBINATIONS: Array<{ anchorAlign: AlignmentPoint; popupAlign: AlignmentPoint }> = [
    { anchorAlign: { horizontal: 'left', vertical: 'top' }, popupAlign: { horizontal: 'left', vertical: 'bottom' } },
    { anchorAlign: { horizontal: 'left', vertical: 'top' }, popupAlign: { horizontal: 'right', vertical: 'top' } },
    { anchorAlign: { horizontal: 'left', vertical: 'top' }, popupAlign: { horizontal: 'right', vertical: 'bottom' } },
    { anchorAlign: { horizontal: 'left', vertical: 'bottom' }, popupAlign: { horizontal: 'left', vertical: 'top' } },
    { anchorAlign: { horizontal: 'left', vertical: 'bottom' }, popupAlign: { horizontal: 'right', vertical: 'top' } },
    { anchorAlign: { horizontal: 'left', vertical: 'bottom' }, popupAlign: { horizontal: 'right', vertical: 'bottom' } },
    { anchorAlign: { horizontal: 'right', vertical: 'top' }, popupAlign: { horizontal: 'left', vertical: 'top' } },
    { anchorAlign: { horizontal: 'right', vertical: 'top' }, popupAlign: { horizontal: 'left', vertical: 'bottom' } },
    { anchorAlign: { horizontal: 'right', vertical: 'top' }, popupAlign: { horizontal: 'right', vertical: 'bottom' } },
    { anchorAlign: { horizontal: 'right', vertical: 'bottom' }, popupAlign: { horizontal: 'left', vertical: 'top' } },
    { anchorAlign: { horizontal: 'right', vertical: 'bottom' }, popupAlign: { horizontal: 'left', vertical: 'bottom' } },
    { anchorAlign: { horizontal: 'right', vertical: 'bottom' }, popupAlign: { horizontal: 'right', vertical: 'top' } },
    { anchorAlign: { horizontal: 'left', vertical: 'top' }, popupAlign: { horizontal: 'center', vertical: 'bottom' } },
    { anchorAlign: { horizontal: 'left', vertical: 'top' }, popupAlign: { horizontal: 'right', vertical: 'center' } },
    { anchorAlign: { horizontal: 'left', vertical: 'center' }, popupAlign: { horizontal: 'right', vertical: 'top' } },
    { anchorAlign: { horizontal: 'left', vertical: 'center' }, popupAlign: { horizontal: 'right', vertical: 'center' } },
    { anchorAlign: { horizontal: 'left', vertical: 'center' }, popupAlign: { horizontal: 'right', vertical: 'bottom' } },
    { anchorAlign: { horizontal: 'left', vertical: 'bottom' }, popupAlign: { horizontal: 'center', vertical: 'top' } },
    { anchorAlign: { horizontal: 'left', vertical: 'bottom' }, popupAlign: { horizontal: 'right', vertical: 'center' } },
    { anchorAlign: { horizontal: 'center', vertical: 'top' }, popupAlign: { horizontal: 'left', vertical: 'bottom' } },
    { anchorAlign: { horizontal: 'center', vertical: 'top' }, popupAlign: { horizontal: 'center', vertical: 'bottom' } },
    { anchorAlign: { horizontal: 'center', vertical: 'top' }, popupAlign: { horizontal: 'right', vertical: 'bottom' } },
    { anchorAlign: { horizontal: 'center', vertical: 'bottom' }, popupAlign: { horizontal: 'left', vertical: 'top' } },
    { anchorAlign: { horizontal: 'center', vertical: 'bottom' }, popupAlign: { horizontal: 'center', vertical: 'top' } },
    { anchorAlign: { horizontal: 'center', vertical: 'bottom' }, popupAlign: { horizontal: 'right', vertical: 'top' } },
    { anchorAlign: { horizontal: 'right', vertical: 'top' }, popupAlign: { horizontal: 'left', vertical: 'center' } },
    { anchorAlign: { horizontal: 'right', vertical: 'top' }, popupAlign: { horizontal: 'center', vertical: 'bottom' } },
    { anchorAlign: { horizontal: 'right', vertical: 'center' }, popupAlign: { horizontal: 'left', vertical: 'top' } },
    { anchorAlign: { horizontal: 'right', vertical: 'center' }, popupAlign: { horizontal: 'left', vertical: 'center' } },
    { anchorAlign: { horizontal: 'right', vertical: 'center' }, popupAlign: { horizontal: 'left', vertical: 'bottom' } },
    { anchorAlign: { horizontal: 'right', vertical: 'bottom' }, popupAlign: { horizontal: 'left', vertical: 'center' } },
    { anchorAlign: { horizontal: 'right', vertical: 'bottom' }, popupAlign: { horizontal: 'center', vertical: 'top' } }
];

const combinationExists: (
    combinations: Array<{ anchorAlign: AlignmentPoint; popupAlign: AlignmentPoint }>,
    candidate: { anchorAlign: AlignmentPoint; popupAlign: AlignmentPoint }
) => boolean = (
    combinations: Array<{ anchorAlign: AlignmentPoint; popupAlign: AlignmentPoint }>,
    candidate: { anchorAlign: AlignmentPoint; popupAlign: AlignmentPoint }
): boolean => {
    return combinations.some(
        (c: { anchorAlign: AlignmentPoint; popupAlign: AlignmentPoint }): boolean =>
            c.anchorAlign.horizontal === candidate.anchorAlign.horizontal &&
            c.anchorAlign.vertical === candidate.anchorAlign.vertical &&
            c.popupAlign.horizontal === candidate.popupAlign.horizontal &&
            c.popupAlign.vertical === candidate.popupAlign.vertical
    );
};

const isCombinationRelevant: (
    candidate: { anchorAlign: AlignmentPoint; popupAlign: AlignmentPoint },
    original: { anchorAlign: AlignmentPoint; popupAlign: AlignmentPoint },
    collisionAxis: CollisionCoordinates
) => boolean = (
    candidate: { anchorAlign: AlignmentPoint; popupAlign: AlignmentPoint },
    original: { anchorAlign: AlignmentPoint; popupAlign: AlignmentPoint },
    collisionAxis: CollisionCoordinates
): boolean => {
    const horizontalChanged: boolean =
        candidate.anchorAlign.horizontal !== original.anchorAlign.horizontal ||
        candidate.popupAlign.horizontal !== original.popupAlign.horizontal;
    const verticalChanged: boolean =
        candidate.anchorAlign.vertical !== original.anchorAlign.vertical ||
        candidate.popupAlign.vertical !== original.popupAlign.vertical;
    return (collisionAxis.X && horizontalChanged) ||
           (collisionAxis.Y && verticalChanged) ||
           (!horizontalChanged && !verticalChanged);
};

export const getAlignmentFallbackPriority: (
    anchorAlign: AlignmentPoint,
    popupAlign: AlignmentPoint,
    collisionAxis: CollisionCoordinates
) => Array<{ anchorAlign: AlignmentPoint; popupAlign: AlignmentPoint }> = (
    anchorAlign: AlignmentPoint,
    popupAlign: AlignmentPoint,
    collisionAxis: CollisionCoordinates
): Array<{ anchorAlign: AlignmentPoint; popupAlign: AlignmentPoint }> => {
    const combinations: Array<{ anchorAlign: AlignmentPoint; popupAlign: AlignmentPoint }> = [];
    combinations.push({ anchorAlign, popupAlign });
    const horizontals: ReadonlyArray<HorizontalAlign> = ['left', 'center', 'right'] as const;
    const verticals: ReadonlyArray<VerticalAlign> = ['top', 'center', 'bottom'] as const;
    const oppositeAnchor: AlignmentPoint = getOppositeAlignment(anchorAlign);
    const oppositePopup: AlignmentPoint = getOppositeAlignment(popupAlign);
    const original: { anchorAlign: AlignmentPoint; popupAlign: AlignmentPoint } = { anchorAlign, popupAlign };
    if (collisionAxis.X && collisionAxis.Y) {
        combinations.push({
            anchorAlign: oppositeAnchor,
            popupAlign: oppositePopup
        });
    } else if (collisionAxis.X && !collisionAxis.Y) {
        combinations.push({
            anchorAlign: { ...anchorAlign, horizontal: oppositeAnchor.horizontal },
            popupAlign: { ...popupAlign, horizontal: oppositePopup.horizontal }
        });
    } else if (!collisionAxis.X && collisionAxis.Y) {
        combinations.push({
            anchorAlign: { ...anchorAlign, vertical: oppositeAnchor.vertical },
            popupAlign: { ...popupAlign, vertical: oppositePopup.vertical }
        });
    }
    for (const priorityCombination of PRIORITY_ALIGNMENT_COMBINATIONS) {
        if (!combinationExists(combinations, priorityCombination) &&
            isCombinationRelevant(priorityCombination, original, collisionAxis)) {
            combinations.push(priorityCombination);
        }
    }
    const totalCombinations: number =
        horizontals.length * verticals.length * horizontals.length * verticals.length;
    for (let i: number = 0; i < totalCombinations; i++) {
        const anchorH: HorizontalAlign = horizontals[Math.floor(i / (verticals.length * horizontals.length * verticals.length))
            % horizontals.length];
        const anchorV: VerticalAlign = verticals[Math.floor(i / (horizontals.length * verticals.length)) % verticals.length];
        const popupH: HorizontalAlign = horizontals[Math.floor(i / verticals.length) % horizontals.length];
        const popupV: VerticalAlign = verticals[i % verticals.length];
        const candidate: { anchorAlign: AlignmentPoint; popupAlign: AlignmentPoint } = {
            anchorAlign: { horizontal: anchorH, vertical: anchorV },
            popupAlign: { horizontal: popupH, vertical: popupV }
        };
        if (!combinationExists(combinations, candidate) &&
            isCombinationRelevant(candidate, original, collisionAxis)) {
            combinations.push(candidate);
        }
    }
    return combinations;
};

export const checkElementOverlapsTarget: (
    elementPosition: OffsetPosition,
    elementRect: DOMRect,
    targetRect: DOMRect | null
) => boolean = (
    elementPosition: OffsetPosition,
    elementRect: DOMRect,
    targetRect: DOMRect | null
): boolean => {
    if (!targetRect) { return false; }
    const elemLeft: number = elementPosition.left;
    const elemRight: number = elementPosition.left + elementRect.width;
    const elemTop: number = elementPosition.top;
    const elemBottom: number = elementPosition.top + elementRect.height;
    return elemLeft < targetRect.right && elemRight > targetRect.left &&
        elemTop < targetRect.bottom && elemBottom > targetRect.top;
};

export const fit: (
    popupElement: HTMLElement | null,
    viewportElement: HTMLElement | null,
    position: OffsetPosition,
    collisionCoordinates: CollisionCoordinates,
    usePageAbsolute?: boolean
) => OffsetPosition = (
    popupElement: HTMLElement | null,
    viewportElement: HTMLElement | null,
    position: OffsetPosition,
    collisionCoordinates: CollisionCoordinates,
    usePageAbsolute: boolean = false
): OffsetPosition => {
    const popupRect: DOMRect | null = getElementRect(popupElement as HTMLElement);
    const viewportBounds: { top: number; right: number; bottom: number; left: number } =
        getViewportBounds(viewportElement, usePageAbsolute);
    if (!popupRect) {
        return position;
    }
    const fittedPosition: OffsetPosition = { ...position };
    if (collisionCoordinates.X) {
        if (fittedPosition.left < viewportBounds.left) {
            fittedPosition.left = viewportBounds.left;
        } else if (fittedPosition.left + popupRect.width > viewportBounds.right) {
            fittedPosition.left = viewportBounds.right - popupRect.width;
        }
    }
    if (collisionCoordinates.Y) {
        if (fittedPosition.top < viewportBounds.top) {
            fittedPosition.top = viewportBounds.top;
        } else if (fittedPosition.top + popupRect.height > viewportBounds.bottom) {
            fittedPosition.top = viewportBounds.bottom - popupRect.height;
        }
    }
    return fittedPosition;
};

const resetPopupPosition: (popup: HTMLElement | null) => void =
    (popup: HTMLElement | null): void => {
        if (!popup) { return; }
        popup.style.top = '0px';
        popup.style.left = '0px';
    };

const restorePopupPosition: (popup: HTMLElement | null, top: string, left: string) => void =
    (popup: HTMLElement | null, top: string, left: string): void => {
        if (!popup) { return; }
        popup.style.top = top;
        popup.style.left = left;
    };

const toFitCoordinates: (axis: CollisionAxis) => CollisionCoordinates =
    (axis: CollisionAxis): CollisionCoordinates => ({
        X: axis.X === CollisionType.Fit,
        Y: axis.Y === CollisionType.Fit
    });

const hasAnyFit: (axis: CollisionAxis) => boolean =
    (axis: CollisionAxis): boolean => axis.X === CollisionType.Fit || axis.Y === CollisionType.Fit;

export const flip: (
    popupElement: HTMLElement | null,
    anchorElement: HTMLElement | null,
    offsetX: number,
    offsetY: number,
    anchorAlign?: AlignmentPoint,
    popupAlign?: AlignmentPoint,
    viewportElement?: HTMLElement | null,
    collisionAxis?: CollisionAxis,
    coordinateContainer?: HTMLElement | null,
    usePageAbsolute?: boolean
) => FlipResult | null = (
    popupElement: HTMLElement | null,
    anchorElement: HTMLElement | null,
    offsetX: number,
    offsetY: number,
    anchorAlign: AlignmentPoint = DEFAULT_ANCHOR_ALIGN,
    popupAlign: AlignmentPoint = DEFAULT_POPUP_ALIGN,
    viewportElement: HTMLElement | null = null,
    collisionAxis: CollisionAxis = { X: CollisionType.Fit, Y: CollisionType.Flip },
    coordinateContainer: HTMLElement | null = viewportElement,
    usePageAbsolute: boolean = false
): FlipResult | null => {
    if (!popupElement || !anchorElement) { return null; }
    const isXCollisionEnabled: boolean = collisionAxis.X !== CollisionType.None;
    const isYCollisionEnabled: boolean = collisionAxis.Y !== CollisionType.None;
    if (!isXCollisionEnabled && !isYCollisionEnabled) {
        const position: OffsetPosition = calculatePosition(
            anchorElement, popupElement, anchorAlign, popupAlign, offsetX, offsetY, coordinateContainer
        );
        return { position, anchorAlign, popupAlign, fitted: false };
    }
    const originalPosition: OffsetPosition = calculatePosition(
        anchorElement, popupElement, anchorAlign, popupAlign, offsetX, offsetY, coordinateContainer
    );
    const collisionCoordinates: CollisionCoordinates = {
        X: collisionAxis.X === CollisionType.Flip,
        Y: collisionAxis.Y === CollisionType.Flip
    };
    if (collisionCoordinates.X || collisionCoordinates.Y) {
        const fallbacks: Array<{ anchorAlign: AlignmentPoint; popupAlign: AlignmentPoint }> =
            getAlignmentFallbackPriority(anchorAlign, popupAlign, collisionCoordinates);
        let lastFallbackPosition: OffsetPosition | null = null;
        let nonOverlapPosition: OffsetPosition | null = null;
        const oldTop: string = popupElement.style.top;
        const oldLeft: string = popupElement.style.left;
        const targetRect: DOMRect | null = getElementRect(anchorElement);
        for (const { anchorAlign: tryAnchor, popupAlign: tryPopup } of fallbacks) {
            resetPopupPosition(popupElement);
            const position: OffsetPosition = calculatePosition(
                anchorElement, popupElement, tryAnchor, tryPopup, offsetX, offsetY, coordinateContainer
            );
            lastFallbackPosition = position;
            const fitted: OffsetPosition = fit(popupElement, viewportElement, position, { X: true, Y: true }, usePageAbsolute);
            const popupRect: DOMRect | null = getElementRect(popupElement);
            if (popupRect && !checkElementOverlapsTarget(fitted, popupRect, targetRect)) {
                nonOverlapPosition = fitted;
            }
            const collisions: string[] = getCollisions(
                popupElement, viewportElement, position.left, position.top, usePageAbsolute
            );
            if (collisions.length === 0) {
                applyPosition(popupElement, position);
                return { position, anchorAlign: tryAnchor, popupAlign: tryPopup, fitted: false };
            }
        }
        restorePopupPosition(popupElement, oldTop, oldLeft);
        const basePosition: OffsetPosition = lastFallbackPosition ?? originalPosition;
        const fittedPosition: OffsetPosition = hasAnyFit(collisionAxis)
            ? fit(popupElement, viewportElement, basePosition, toFitCoordinates(collisionAxis), usePageAbsolute)
            : nonOverlapPosition ?? fit(popupElement, viewportElement, originalPosition, { X: true, Y: true }, usePageAbsolute);

        if (!hasAnyFit(collisionAxis) && !isElementVisibleAcrossScrollParents(anchorElement)) {
            const position: OffsetPosition = calculatePosition(
                anchorElement, popupElement, anchorAlign, popupAlign, offsetX, offsetY, coordinateContainer
            );
            return { position, anchorAlign, popupAlign, fitted: false };
        }
        return { position: fittedPosition, anchorAlign, popupAlign, fitted: true };
    } else {
        if (hasAnyFit(collisionAxis)) {
            const fittedPosition: OffsetPosition = fit(
                popupElement, viewportElement, originalPosition, toFitCoordinates(collisionAxis), usePageAbsolute
            );
            return { position: fittedPosition, anchorAlign, popupAlign, fitted: true };
        }
        return { position: originalPosition, anchorAlign, popupAlign, fitted: false };
    }
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

const collectZindexes: (nodes: ArrayLike<Element>, exclude: HTMLElement) => string[] =
    (nodes: ArrayLike<Element>, exclude: HTMLElement): string[] => {
        const result: string[] = [];
        for (let i: number = 0; i < nodes.length; i++) {
            const child: Element = nodes[i as number] as Element;
            if (!exclude.isEqualNode(child) && child instanceof HTMLElement) {
                const computedStyle: CSSStyleDeclaration = window.getComputedStyle(child);
                if (computedStyle.zIndex !== 'auto' && computedStyle.position !== 'static') {
                    result.push(computedStyle.zIndex);
                }
            }
        }
        return result;
    };

export const getZindexPartial: (element: HTMLElement) => number = (element: HTMLElement): number => {
    let parent: HTMLElement | null = element.parentElement;
    const parentZindex: string[] = [];

    while (parent) {
        if (parent.tagName !== 'BODY') {
            const computedStyle: CSSStyleDeclaration = window.getComputedStyle(parent);
            if (computedStyle.zIndex !== 'auto' && computedStyle.position !== 'static') {
                parentZindex.push(computedStyle.zIndex);
            }
            parent = parent.parentElement;
        } else {
            break;
        }
    }

    const childrenZindex: string[] = collectZindexes(document.body.children, element);
    childrenZindex.push('999');

    const siblingsZindex: string[] = (element.parentElement && element.parentElement.tagName !== 'BODY')
        ? collectZindexes(element.parentElement.children, element)
        : [];

    const finalValue: string[] = parentZindex.concat(childrenZindex, siblingsZindex);
    const currentZindexValue: number = Math.max(...finalValue.map(Number)) + 1;
    return currentZindexValue > 2147483647 ? 2147483647 : currentZindexValue;
};

export const getElementRect: (element?: HTMLElement) => DOMRect | null = (element?: HTMLElement): DOMRect | null => {
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

export const isPartiallyVisibleInContainer: (
    element: HTMLElement,
    container: HTMLElement | Window
) => boolean = (
    element: HTMLElement,
    container: HTMLElement | Window
): boolean => {
    const elRect: DOMRect | null = getElementRect(element);
    if (!elRect) { return false; }

    const bounds: { top: number; left: number; right: number; bottom: number } =
        container === window
            ? { top: 0, left: 0, right: window.innerWidth, bottom: window.innerHeight }
            : (getElementRect(container as HTMLElement) as DOMRect);

    if (!bounds || (container !== window && !(container as HTMLElement))) { return false; }

    const interWidth: number = Math.min(elRect.right, bounds.right) - Math.max(elRect.left, bounds.left);
    const interHeight: number = Math.min(elRect.bottom, bounds.bottom) - Math.max(elRect.top, bounds.top);
    return interWidth > 0 && interHeight > 0;
};

export const isElementVisibleAcrossScrollParents: (
    targetEl: HTMLElement,
    fixedParent?: boolean
) => boolean = (
    targetEl: HTMLElement,
    fixedParent: boolean = false
): boolean => {
    const parents: HTMLElement[] = getFixedScrollableParent(targetEl, fixedParent);
    const containers: (HTMLElement | Window)[] = parents.map((parent: HTMLElement): HTMLElement | Window => {
        return (parent === document.documentElement) ? window : parent;
    });
    if (!containers.includes(window)) {
        containers.push(window);
    }

    for (const container of containers) {
        if (!isPartiallyVisibleInContainer(targetEl, container)) {
            return false;
        }
    }
    return true;
};
