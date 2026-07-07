import { forwardRef, HTMLAttributes, JSX, ReactElement, ReactNode, Ref, RefAttributes, RefObject, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { VirtualizationProps } from './types';
import { ScrollEvent } from '../list-view';
import { computeWindow } from './utils';

/**
 * Props for the VirtualScroller component.
 */
export interface VirtualScrollerProps<T> extends VirtualizationProps {
    /**
     * Specifies the array of loaded data items to render.
     */
    items: T[];

    /**
     * Specifies the fixed container height. Accepts a number (pixels) or a string (e.g., '400px', '100%').
     * Ignored if using an external scroll parent.
     */
    height?: number | string;

    /**
     * Specifies the external scroll container or window.
     * If provided, VirtualScroller attaches passive scroll listeners to this element.
     */
    scrollParent?: RefObject<HTMLElement>

    /**
     * Scrolls to make the item at this index initially visible when the component mounts.
     *
     * @default 0
     */
    initialVisibleIndex?: number;

    /**
     * Specifies the render function for each row.
     */
    itemContent: (index: number, item: T) => ReactNode;

    /**
     * Specifies the async fetch hook triggered when scrolling reaches the loaded range.
     * Must be idempotent and safe under rapid scroll.
     */
    onScrollRequest?: (args: ScrollEvent) => void | Promise<void>;
}

export interface IVirtualScroller<T> extends VirtualScrollerProps<T> {
    /**
     * This is VirtualScroller component element.
     *
     * @private
     * @default null
     */
    element?: HTMLElement | null;
}

type IVirtualScrollerProps<T> = VirtualScrollerProps<T> & HTMLAttributes<HTMLDivElement>;

const VirtualScrollerInner: <T>(props: IVirtualScrollerProps<T>, ref: Ref<IVirtualScroller<T>>) => JSX.Element
= <T, >(props: IVirtualScrollerProps<T>, ref: Ref<IVirtualScroller<T>>) => {
    const {
        items,
        itemSize,
        pageSize,
        overscanCount = 5,
        scrollParent,
        height = 360,
        onScrollRequest,
        role = 'listbox',
        showSkeleton,
        initialVisibleIndex = 0,
        itemContent,
        style,
        totalCount,
        className,
        ...resProps
    } = props;
    const totalRows: number = useMemo(() => (typeof totalCount === 'number' && totalCount > 0 ? totalCount : items.length), [totalCount, items.length]);
    const [range, setRange] = useState(() => computeWindow(totalRows, 0, itemSize, pageSize, overscanCount));
    const [scrollTop, setScrollTop] = useState(0);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const localContainerRef: RefObject<HTMLDivElement | null> = useRef<HTMLDivElement | null>(null);
    const inFlight: RefObject<boolean> = useRef(false);
    const requestedUntil: RefObject<number> = useRef(0);
    const didInitialScroll: RefObject<boolean> = useRef<boolean>(false);
    const virtualItemsRef: RefObject<HTMLDivElement | null> = useRef<HTMLDivElement | null>(null);
    const lastStartIndexRef: RefObject<number> = useRef<number>(0);
    const lastOffsetYRef: RefObject<number> = useRef<number>(0);

    const firstVisibleIndex: number = useMemo(() => (
        Math.max(0, Math.floor(scrollTop / Math.max(1, itemSize)))
    ), [scrollTop, itemSize]);

    const currentGroupIndex: number = useMemo(() => {
        if (!items || items.length === 0) { return -1; }
        const start: number = Math.min(firstVisibleIndex, items.length - 1);
        for (let i: number = start; i >= 0; i--) {
            const it: T = items[Number(i)];
            if (typeof it && (it as {isHeader?: boolean}).isHeader) { return i; }
        }
        return -1;
    }, [items, firstVisibleIndex]);

    const currentGroupItem: T | null = useMemo(() => (
        currentGroupIndex >= 0 ? items[Number(currentGroupIndex)] : null
    ), [items, currentGroupIndex]);

    const publicAPI: Partial<IVirtualScroller<T>> = {
        items,
        itemSize,
        pageSize,
        overscanCount,
        scrollParent,
        height,
        showSkeleton,
        initialVisibleIndex,
        totalCount
    };

    useImperativeHandle(ref, () => ({
        ...publicAPI as IVirtualScroller<T>,
        element: (scrollParent?.current) || localContainerRef.current
    }), [publicAPI]);

    useEffect(() => {
        if (items.length === 0) {
            requestedUntil.current = 0;
            inFlight.current = false;
        }
    }, [items.length]);

    useEffect(() => {
        setRange(computeWindow(totalRows, scrollTop, itemSize, pageSize, overscanCount));
    }, [totalRows, itemSize, pageSize, overscanCount]);

    useEffect(() => {
        if (didInitialScroll.current) { return; }
        const scroller: HTMLElement | null = (scrollParent?.current) || localContainerRef.current;
        if (!scroller) { return; }
        const safeIndex: number = Math.max(0, Math.min(initialVisibleIndex, Math.max(0, totalRows)));
        const targetTop: number = safeIndex * itemSize;
        scroller.scrollTop = targetTop;
        didInitialScroll.current = true;
        setScrollTop(targetTop);
        setRange(computeWindow(totalRows, targetTop, itemSize, pageSize, overscanCount));
    }, [scrollParent?.current, initialVisibleIndex, totalRows, itemSize, pageSize, overscanCount]);

    const slice: T[] = useMemo(() => {
        const start: number = Math.min(range.startIndex, items.length);
        const end: number = Math.min(range.endIndex, items.length);
        return items.slice(start, end);
    }, [items, range.startIndex, range.endIndex]);

    const handleMaybeRequestMore: (e: Event, newRange: { startIndex: number; endIndex: number; offsetY: number; totalHeight: number; }) =>
    void = useCallback(async (e: Event, newRange: { startIndex: number; endIndex: number; offsetY: number; totalHeight: number; }) => {
        if (!onScrollRequest) { return; }
        const atWindowEnd: boolean = newRange.endIndex >= items.length;
        if (!atWindowEnd) { return; }
        const nextStart: number = items.length;
        let nextCount: number = pageSize + overscanCount;
        if (typeof totalCount === 'number' && totalCount > 0) {
            const desiredEnd: number = Math.min(totalRows, newRange.endIndex);
            if (desiredEnd > items.length) {
                nextCount = desiredEnd;
            }
        }
        if (inFlight.current) { return; }
        if (requestedUntil.current > items.length) { return; }
        inFlight.current = true;
        setIsLoading(true);
        requestedUntil.current = nextStart + nextCount;
        const maybePromise: void | Promise<void> =
                    await onScrollRequest({ startIndex: nextStart, count: nextCount, originalEvent: e });
        Promise.resolve(maybePromise)
            .catch(() => { setIsLoading(false); })
            .finally(() => {
                inFlight.current = false;
                setIsLoading(false);
            });
    }, [onScrollRequest, items.length, pageSize, overscanCount, isLoading, totalRows, totalCount]);

    const onScroll: (e: Event) => void = useCallback((e: Event) => {
        const scroller: HTMLElement | null = (scrollParent?.current) || localContainerRef.current;
        if (!scroller || isLoading) { return; }
        const currentTop: number = scroller.scrollTop;
        const newRange: {startIndex: number; endIndex: number; offsetY: number; totalHeight: number; }
        = computeWindow(totalRows, currentTop, itemSize, pageSize, overscanCount);
        const previousStart: number = lastStartIndexRef.current ?? 0;
        const isFastJump: boolean = Math.abs(newRange.startIndex - previousStart) > overscanCount;
        if (isFastJump && virtualItemsRef.current) {
            const nextOffsetY: number = newRange.offsetY || 0;
            if (nextOffsetY !== lastOffsetYRef.current) {
                virtualItemsRef.current.style.transform = `translate3d(0px, ${nextOffsetY}px, 0px) translateZ(0px)`;
                lastOffsetYRef.current = nextOffsetY;
            }
        }
        handleMaybeRequestMore(e, newRange);
        requestAnimationFrame(() => {
            lastStartIndexRef.current = newRange.startIndex;
            setScrollTop(currentTop);
            setRange(newRange);
        });
    }, [itemSize, pageSize, overscanCount, totalRows, items.length, scrollParent, handleMaybeRequestMore, isLoading]);

    useEffect(() => {
        const target: HTMLElement | null = (scrollParent?.current) || localContainerRef.current;
        if (!target) { return; }
        target.addEventListener('scroll', onScroll, { passive: true });
        return () => target.removeEventListener('scroll', onScroll);
    }, [onScroll, scrollParent?.current]);

    useEffect(() => {
        if (!showSkeleton) { return; }
        if (items.length === 0 && onScrollRequest) {
            setIsLoading(true);
        } else if (items.length > 0) {
            setIsLoading(false);
        }
    }, [items.length, onScrollRequest, showSkeleton]);

    const renderListContent: () => JSX.Element = useCallback(() => (
        <>
            {currentGroupItem && scrollTop >= itemSize && (
                <div className="sf-pinned-group">
                    {itemContent(currentGroupIndex, currentGroupItem)}
                </div>
            )}
            <div className="sf-virtual-content sf-pos-relative" style={{ height: range.totalHeight }}>
                <div
                    className="sf-virtual-items"
                    ref={virtualItemsRef}
                    style={{transform: `translate3d(0px, ${range.offsetY}px, 0px) translateZ(0px)`}}
                >
                    {showSkeleton && isLoading && slice.length !== 0
                        ? Array.from({ length: slice.length }).map((_: unknown, index: number) => (
                            <div key={`skeleton-${index}`} className='sf-list-skeleton' style={{ height: itemSize }}></div>
                        )) : slice.map((item: T, i: number) => {
                            const actualIndex: number = range.startIndex + i;
                            return itemContent(actualIndex, item);
                        })}
                </div>
            </div>
        </>
    ), [itemSize, range.totalHeight, range.offsetY, showSkeleton, isLoading, slice, range.startIndex,
        itemContent, currentGroupItem, currentGroupIndex, scrollTop]);

    const scrollParentClass: string = useMemo(() => {return [
        'sf-virtual-scroll-parent',
        className
    ].filter(Boolean).join(' ').trim();
    }, [className]);

    if (!scrollParent) {
        return (
            <div ref={localContainerRef} role={role} className={scrollParentClass} style={{ height, ...style }} {...resProps}>
                {renderListContent()}
            </div>
        );
    }

    return (renderListContent());
};

export const VirtualScroller: <T>(props: VirtualScrollerProps<T> & HTMLAttributes<HTMLDivElement>
& RefAttributes<IVirtualScroller<T>>) => ReactElement | null = forwardRef(VirtualScrollerInner) as <T>(
    props: IVirtualScrollerProps<T> & RefAttributes<IVirtualScroller<T>>
) => ReactElement | null;

export default VirtualScroller;
