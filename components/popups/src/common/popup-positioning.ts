import { AlignmentPoint, OffsetPosition, AlignmentPercentage, HorizontalAlign, VerticalAlign } from './alignment-types';
import { DEFAULT_ANCHOR_ALIGN, DEFAULT_POPUP_ALIGN, getElementRect } from './collision-handler';

const getDocumentScroll: (doc: Document) => { left: number; top: number } =
    (doc: Document): { left: number; top: number } => ({
        left: doc.documentElement.scrollLeft || doc.body.scrollLeft || 0,
        top: doc.documentElement.scrollTop  || doc.body.scrollTop  || 0
    });

const X_ALIGNMENT_MAP: Readonly<Record<HorizontalAlign, number>> = {
    'left': 0, 'center': 50, 'right': 100
} as const;

const Y_ALIGNMENT_MAP: Readonly<Record<VerticalAlign, number>> = {
    'top': 0, 'center': 50, 'bottom': 100
} as const;

export const alignmentToPercentage: (align: AlignmentPoint) => AlignmentPercentage =
    (align: AlignmentPoint): AlignmentPercentage => ({
        x: X_ALIGNMENT_MAP[align.horizontal],
        y: Y_ALIGNMENT_MAP[align.vertical]
    });

const getScrollOffsets: (element: HTMLElement | null) => { scrollLeft: number; scrollTop: number } =
    (element: HTMLElement | null): { scrollLeft: number; scrollTop: number } => {
        const isFixed: boolean = !!element && getComputedStyle(element).position === 'fixed';
        if (isFixed) {
            return { scrollLeft: 0, scrollTop: 0 };
        }
        const doc: Document = element?.ownerDocument ?? document;
        const { left, top } = getDocumentScroll(doc);
        return { scrollLeft: left, scrollTop: top };
    };

const isBodyOrDocument: (element: HTMLElement | null) => boolean = (element: HTMLElement | null): boolean => {
    return !element || element === document.body || element === document.documentElement;
};

export const EMPTY_POSITION: OffsetPosition = {
    left: 0,
    top: 0
};

const EMPTY_BOUNDS: { top: number; left: number; right: number; bottom: number } = {
    top: 0, left: 0, right: 0, bottom: 0
};

const getAlignedCoordinate: (size: number, percentage: number) => number =
    (size: number, percentage: number): number => (size * percentage) / 100;

export const calculateAlignmentPosition: (
    element: HTMLElement | null,
    align: AlignmentPoint,
    containerElement?: HTMLElement | null
) => OffsetPosition = (
    element: HTMLElement | null,
    align: AlignmentPoint,
    containerElement: HTMLElement | null = null
): OffsetPosition => {
    const rect: DOMRect = getElementRect(element as HTMLElement) as DOMRect;

    if (!rect) {
        return EMPTY_POSITION;
    }

    const percentages: AlignmentPercentage = alignmentToPercentage(align);
    const alignX: number = getAlignedCoordinate(rect.width, percentages.x);
    const alignY: number = getAlignedCoordinate(rect.height, percentages.y);

    if (!isBodyOrDocument(containerElement)) {
        const containerRect: DOMRect = getElementRect(containerElement as HTMLElement) as DOMRect;
        if (!containerRect) {
            return EMPTY_POSITION;
        }
        return {
            left: rect.left - containerRect.left + (containerElement as HTMLElement).scrollLeft + alignX,
            top: rect.top - containerRect.top + (containerElement as HTMLElement).scrollTop + alignY
        };
    }
    const { scrollLeft, scrollTop }: { scrollLeft: number; scrollTop: number } = getScrollOffsets(element);
    return {
        left: rect.left + scrollLeft + alignX,
        top: rect.top + scrollTop + alignY
    };
};

export const calculateAlignmentOffset: (popupAlign: AlignmentPoint, popupRect: DOMRect) => OffsetPosition =
    (popupAlign: AlignmentPoint, popupRect: DOMRect): OffsetPosition => {
        const popupPercent: AlignmentPercentage = alignmentToPercentage(popupAlign);
        const popupOffsetX: number = getAlignedCoordinate(popupRect.width,  popupPercent.x);
        const popupOffsetY: number = getAlignedCoordinate(popupRect.height, popupPercent.y);

        return {
            left: -popupOffsetX,
            top: -popupOffsetY
        };
    };

export const calculatePosition: (
    anchorElement: HTMLElement | null,
    popupElement: HTMLElement | null,
    anchorAlign?: AlignmentPoint,
    popupAlign?: AlignmentPoint,
    offsetX?: number,
    offsetY?: number,
    containerElement?: HTMLElement | null
) => OffsetPosition = (
    anchorElement: HTMLElement | null,
    popupElement: HTMLElement | null,
    anchorAlign: AlignmentPoint = DEFAULT_ANCHOR_ALIGN,
    popupAlign: AlignmentPoint = DEFAULT_POPUP_ALIGN,
    offsetX: number = 0,
    offsetY: number = 0,
    containerElement: HTMLElement | null = null
): OffsetPosition => {
    if (!anchorElement || !popupElement) {
        return EMPTY_POSITION;
    }

    const anchorPoint: OffsetPosition = calculateAlignmentPosition(anchorElement, anchorAlign, containerElement);
    const popupRect: DOMRect = getElementRect(popupElement) as DOMRect;
    if (!popupRect) {
        return anchorPoint;
    }
    const alignmentOffset: OffsetPosition = calculateAlignmentOffset(popupAlign, popupRect);
    return {
        left: anchorPoint.left + alignmentOffset.left + offsetX,
        top: anchorPoint.top + alignmentOffset.top + offsetY
    };
};

export const applyPosition: (element: HTMLElement | null, position: OffsetPosition) => void =
    (element: HTMLElement | null, position: OffsetPosition): void => {
        if (!element) {
            return;
        }
        element.style.left = `${Math.round(position.left)}px`;
        element.style.top = `${Math.round(position.top)}px`;
    };

export const getViewportBounds: (
    containerElement: HTMLElement | null,
    usePageAbsolute?: boolean
) => { top: number; left: number; right: number; bottom: number } = (
    containerElement: HTMLElement | null,
    usePageAbsolute: boolean = false
): { top: number; left: number; right: number; bottom: number } => {
    if (isBodyOrDocument(containerElement)) {
        const doc: Document = document;
        const scrollLeft: number = doc.documentElement.scrollLeft || doc.body.scrollLeft || 0;
        const scrollTop: number = doc.documentElement.scrollTop || doc.body.scrollTop || 0;
        return {
            top: scrollTop,
            left: scrollLeft,
            right: scrollLeft + window.innerWidth,
            bottom: scrollTop + window.innerHeight
        };
    }

    const el: HTMLElement = containerElement as HTMLElement;
    if (usePageAbsolute) {
        const rect: DOMRect = getElementRect(el) as DOMRect;
        if (!rect) { return EMPTY_BOUNDS; }
        const doc: Document = document;
        const scrollLeft: number = doc.documentElement.scrollLeft || doc.body.scrollLeft || 0;
        const scrollTop: number = doc.documentElement.scrollTop || doc.body.scrollTop || 0;
        return {
            top: rect.top + scrollTop,
            left: rect.left + scrollLeft,
            right: rect.right + scrollLeft,
            bottom: rect.bottom + scrollTop
        };
    }
    const containerRect: DOMRect = getElementRect(el) as DOMRect;
    if (!containerRect) {
        return EMPTY_BOUNDS;
    }

    const doc: Document = document;
    const pageScrollLeft: number = doc.documentElement.scrollLeft || doc.body.scrollLeft || 0;
    const pageScrollTop: number = doc.documentElement.scrollTop || doc.body.scrollTop || 0;
    const windowLeftInDoc: number = pageScrollLeft;
    const windowTopInDoc: number = pageScrollTop;
    const windowRightInDoc: number = pageScrollLeft + window.innerWidth;
    const windowBottomInDoc: number = pageScrollTop + window.innerHeight;
    const contentOriginX: number = containerRect.left + pageScrollLeft - el.scrollLeft;
    const contentOriginY: number = containerRect.top + pageScrollTop - el.scrollTop;
    const windowLeftInContainer: number = windowLeftInDoc - contentOriginX;
    const windowTopInContainer: number = windowTopInDoc - contentOriginY;
    const windowRightInContainer: number = windowRightInDoc - contentOriginX;
    const windowBottomInContainer: number = windowBottomInDoc - contentOriginY;
    return {
        top: Math.max(0, windowTopInContainer),
        left: Math.max(0, windowLeftInContainer),
        right: Math.min(el.clientWidth, windowRightInContainer),
        bottom: Math.min(el.clientHeight, windowBottomInContainer)
    };
};
