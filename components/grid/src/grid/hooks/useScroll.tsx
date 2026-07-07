import { CSSProperties, useCallback, useLayoutEffect, useRef, UIEvent, useMemo, useState, useEffect, RefObject } from 'react';
import { Browser, isNullOrUndefined } from '@syncfusion/react-base';
import { useGridComputedProvider, useGridMutableProvider } from '../contexts';
import { GridRef, IGrid } from '../types/grid.interfaces';
import { MutableGridSetter, UseScrollResult, ScrollElements, ScrollCss, VirtualRowInfo, VirtualColumnInfo, ContentPanelRef, IRow } from '../types/interfaces';
import { ActionType, ColumnProps, InfiniteScrollState, NewRowPosition, PagerArgsInfo, ScrollMode } from '../types';
import { getPageFromRowIndex, parseUnit } from '../utils';

/**
 * Custom hook to manage scroll synchronization between header and content panels
 *
 * @param {ContentPanelRef} contentPanelRef - content panel ref information, helpful for responsive virtualization
 * @private
 * @returns {UseScrollResult} Scroll-related APIs and functions
 */
export const useScroll: <T>(contentPanelRef: ContentPanelRef<T>) => UseScrollResult<T> =
<T, >(contentPanelRef: ContentPanelRef<T>): UseScrollResult<T> => {
    const grid: Partial<GridRef<T>> & Partial<MutableGridSetter<T>> = useGridComputedProvider<T>();
    const { height, enableRtl, enableStickyHeader, columns, rowHeight, pageSettings, detailRowHeight, isMasterDetail,
        setCurrentPage, setGridAction, getVisibleColumns, getRowHeight, groupSettings, cachedRowObjects } = grid;
    const { getParentElement, currentViewData, totalVirtualColumnWidth, setOffsetX, totalRecordsCount, setInfiniteScrollState,
        setOffsetY, columnOffsets, virtualSettings, scrollMode, editModule, infiniteScrollState, expansionState, expandedGroupCountRef,
        loadedPageWiseGroupExpandedCountRef, loadedPageWiseVirtualGroupStartEndRowIndexes
    } = useGridMutableProvider<T>();
    const [scrollStyles, setScrollStyles] = useState<{ headerPadding: CSSProperties; headerContentBorder: CSSProperties; }>({
        headerPadding: {},
        headerContentBorder: {}
    });

    // Use ref to maintain references to DOM elements
    const elementsRef: RefObject<ScrollElements> = useRef<ScrollElements>({
        headerScrollElement: null,
        contentScrollElement: null,
        virtualContentRowScrollElement: null,
        virtualContentColumnScrollElement: null,
        footerScrollElement: null
    });

    const virtualRowInfo: RefObject<VirtualRowInfo> = useRef<VirtualRowInfo>({
        offsetY: 0,
        startIndex: 0,
        endIndex: groupSettings.enabled && groupSettings.columns?.length && expandedGroupCountRef.current ? expandedGroupCountRef.current :
            currentViewData?.length,
        requiredRowsRange: [],
        currentPages: [pageSettings.currentPage],
        previousPages: [],
        isFastJumpScroll: false,
        scrollFocusCurrentAriaRowIndex: NaN,
        isFocusScrollOffsetChange: false
    });
    const virtualColumnInfo: RefObject<VirtualColumnInfo> = useRef<VirtualColumnInfo>({
        offsetX: 0,
        startIndex: 0,
        endIndex: getVisibleColumns?.()?.length,
        isFastJumpScroll: false,
        scrollFocusCurrentAriaColIndex: NaN,
        isFocusScrollOffsetChange: false,
        columns: []
    });
    const ticking: RefObject<boolean> = useRef(false);
    const scrollStopTimerRef: RefObject<number> = useRef<number | null>(null);
    const last: RefObject<{
        left: number;
        top: number;
        startRow: number;
        startCol: number;
        offsetX: number;
        offsetY: number;
    }> = useRef({ left: 0, top: 0, startRow: -1, startCol: -1, offsetX: NaN, offsetY: NaN });
    const isDataOperationPreventVirtualCache: RefObject<boolean> = useRef<boolean>(false);

    /**
     * Determine CSS properties based on RTL/LTR mode
     *
     * @returns {ScrollCss} CSS properties for scroll customization
     */
    const getCssProperties: ScrollCss = useMemo((): ScrollCss => {
        return {
            border: enableRtl ? 'borderLeftWidth' : 'borderRightWidth',
            padding: enableRtl ? 'paddingLeft' : 'paddingRight'
        };
    }, [enableRtl]);

    /**
     * Get browser-specific threshold for scrollbar calculations
     *
     * @returns {number} Threshold value
     */
    const getThreshold: () => number = useCallback((): number => {
        // Safely access Browser.info with multiple fallbacks
        if (!Browser?.info) { return 1; }
        const browserName: string = Browser.info.name;
        return browserName === 'mozilla' ? 0.5 : 1;
    }, []);

    /**
     * Calculate scrollbar width
     *
     * @returns {number} Width of the scrollbar
     */
    const getScrollBarWidth: () => number = useCallback((): number => {
        const { contentScrollElement } = elementsRef.current;
        if (!contentScrollElement || height === 'auto') { return 0; }
        if (virtualSettings.enableRow && contentPanelRef?.virtualContentRowScrollRef) {
            return contentPanelRef?.virtualContentRowScrollRef?.offsetWidth;
        }
        return (contentScrollElement.offsetWidth - contentScrollElement.clientWidth) | 0;
    }, [virtualSettings.enableRow, height]);

    /**
     * Set padding based on scrollbar width to ensure header and content alignment
     */
    const setPadding: () => void = useCallback((): void => {

        const scrollWidth: number = getScrollBarWidth() - getThreshold();
        const cssProps: ScrollCss = getCssProperties;

        const paddingValue: string = scrollWidth > 0 ? `${scrollWidth}px` : '0px';
        const borderValue: string = scrollWidth > 0 ? '1px' : '0px';

        setScrollStyles({
            headerPadding: { [cssProps.padding]: paddingValue },
            headerContentBorder: { [cssProps.border]: borderValue }
        });
    }, [getScrollBarWidth, getThreshold, getCssProperties]);

    /**
     * Detect browser maximum div height by testing DOM
     * Runs once on grid initialization to determine scroll height limitations
     * Uses binary search for efficient detection
     *
     * @returns {number} Maximum height in pixels (typically 33M for Chrome, 17M for Firefox)
     */
    const getBrowserMaxDivHeight: () => number = useCallback((): number => {
        // Use cached value if available
        if (virtualRowInfo.current.maxDivHeight) {
            return virtualRowInfo.current.maxDivHeight;
        }

        // Create test div
        const testDiv: HTMLDivElement = document.createElement('div');
        testDiv.style.position = 'absolute';
        testDiv.style.top = '0';
        testDiv.style.left = '-9999px';
        testDiv.style.width = '1px';
        testDiv.style.visibility = 'hidden';

        // Binary search for max height
        let low: number = 0;
        let high: number = 100000000; // 100M px starting point
        let maxHeight: number = 33554400; // Default fallback (Chrome)

        document.body.appendChild(testDiv);

        try {
            while (high - low > 1000) { // 1000px precision
                const mid: number = Math.floor((low + high) / 2);
                testDiv.style.height = `${mid}px`;

                if (testDiv.scrollHeight === mid) {
                    low = mid;
                    maxHeight = mid;
                } else {
                    high = mid;
                }
            }
        } finally {
            document.body.removeChild(testDiv);
        }

        // Store in ref for future use
        virtualRowInfo.current.maxDivHeight = maxHeight;

        return maxHeight;
    }, []);

    const setSticky: (headerEle: HTMLElement, top?: number, width?: number, left?: number, isAddStickyHeader?: boolean) => void =
        useCallback((headerEle: HTMLElement, top?: number, width?: number, left?: number, isAddStickyHeader?: boolean): void => {
            if (isAddStickyHeader) {
                headerEle.classList.add('sf-sticky');
            } else {
                headerEle.classList.remove('sf-sticky');
            }
            headerEle.style.width = width != null ? width + 'px' : '';
            headerEle.style.top = top != null ? top + 'px' : '';
            headerEle.style.left = left !== null ? left + 'px' : '';
        }, []);

    /**
     * Complete implementation of makeStickyHeader following original component logic exactly
     * This matches the original scroll.ts makeStickyHeader method line by line
     */
    const makeStickyHeader: () => void = useCallback(() => {
        const { contentScrollElement, headerScrollElement } = elementsRef.current;
        if (!getParentElement() || !contentScrollElement) {
            return;
        }

        const gridElement: HTMLElement = getParentElement();
        const contentRect: DOMRect = contentScrollElement.getBoundingClientRect();

        if (!contentRect) {
            return;
        }

        // Handle window scale for proper positioning
        const windowScale: number = window.devicePixelRatio;
        const headerEle: HTMLElement = headerScrollElement?.parentElement;
        const toolbarEle: HTMLElement | null = gridElement.querySelector('.sf-toolbar');

        if (!headerEle) {
            return;
        }

        // Calculate total height including all sticky elements (exact original logic)
        const height: number = headerEle.offsetHeight +
            (toolbarEle ? toolbarEle.offsetHeight : 0);

        const parentTop: number = gridElement.getBoundingClientRect().top;
        let top: number = contentRect.top - (parentTop < 0 ? 0 : parentTop);
        const left: number = contentRect.left;

        // Handle window scale adjustment (from original)
        if (windowScale !== 1) {
            top = Math.ceil(top);
        }

        // Apply sticky positioning when scrolled (exact original logic)
        if (top < height && contentRect.bottom > 0) {
            headerEle.classList.add('sf-sticky');
            let elemTop: number = 0;

            // Handle toolbar sticky positioning (from original)
            if (toolbarEle) {
                setSticky(toolbarEle, elemTop, contentRect.width, left, true);
                elemTop += toolbarEle.getBoundingClientRect().height;
            }

            // Handle main header sticky positioning (from original)
            setSticky(headerEle, elemTop, contentRect.width, left, true);

        } else {
            // Remove sticky positioning when not needed (exact original logic)
            if (headerEle.classList.contains('sf-sticky')) {
                setSticky(headerEle, null, null, null, false);

                if (toolbarEle) {
                    setSticky(toolbarEle, null, null, null, false);
                }
            }
        }
    }, [setSticky, getParentElement]);

    const addEventListener: () => void = useCallback((): void => {
        const scrollableParent: HTMLElement = getScrollbleParent(getParentElement().parentElement);
        if (scrollableParent) {
            window.addEventListener('scroll', makeStickyHeader, { passive: true } as AddEventListenerOptions);
        }
    }, [getParentElement, makeStickyHeader]);

    const removeEventListener: () => void = useCallback((): void => {
        window.removeEventListener('scroll', makeStickyHeader);
    }, [makeStickyHeader]);

    const getScrollbleParent: (node: HTMLElement) => HTMLElement = useCallback((node: HTMLElement): HTMLElement => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const parent: HTMLElement = isNullOrUndefined(node.tagName) ? (node as any).scrollingElement : node;
        const overflowY: string = document.defaultView.getComputedStyle(parent, null).overflowY;
        if (parent.scrollHeight > parent.clientHeight && overflowY !== 'visible' ||
            node.tagName === 'HTML' || node.tagName === 'BODY') {
            return node;
        } else {
            return getScrollbleParent(node.parentNode as HTMLElement);
        }
    }, []);

    useEffect(() => {
        if (enableStickyHeader) {
            addEventListener();
        }
        return () => {
            if (enableStickyHeader) {
                removeEventListener();
            }
        };
    }, [enableStickyHeader]);
    useEffect(() => {
        const [startRow, endRow]: number[] = virtualRowInfo.current.requiredRowsRange;
        if ((scrollMode === ScrollMode.Virtual || scrollMode === ScrollMode.Infinite) && isNullOrUndefined(startRow) &&
            isNullOrUndefined(endRow) && isDataOperationPreventVirtualCache.current) {
            isDataOperationPreventVirtualCache.current = false;
        }
    }, [currentViewData, scrollMode]);

    /**
     * Set reference to header scroll element
     *
     * @param {HTMLElement | null} element - Header scroll DOM element
     */
    const setHeaderScrollElement: (element: HTMLElement | null) => void = useCallback((element: HTMLElement | null): void => {
        elementsRef.current.headerScrollElement = element;
    }, []);

    /**
     * Set reference to content scroll element
     *
     * @param {HTMLElement | null} element - Content scroll DOM element
     */
    const setContentScrollElement: (element: HTMLElement | null) => void = useCallback((element: HTMLElement | null): void => {
        elementsRef.current.contentScrollElement = element;
    }, []);

    /**
     * Set reference to footer scroll element
     *
     * @param {HTMLElement | null} element - Footer element
     */
    const setFooterScrollElement: (element: HTMLElement | null) => void = useCallback((element: HTMLElement | null): void => {
        elementsRef.current.footerScrollElement = element;
    }, []);

    useMemo(() => {
        if ((scrollMode === ScrollMode.Virtual || scrollMode === ScrollMode.Infinite) &&
            !isNullOrUndefined(isDataOperationPreventVirtualCache.current)) {
            isDataOperationPreventVirtualCache.current = true;
        }
    }, [grid.filterSettings?.columns, grid.filterSettings?.columns.length, grid.sortSettings?.columns,
        grid.sortSettings?.columns.length, grid.searchSettings?.value, scrollMode]);

    const processPagesSequentially: (pages: number[], args: PagerArgsInfo, filteredTotalRecordsCount?: number, throttle?: number) => void =
    useCallback((pages: number[], args: PagerArgsInfo, filteredTotalRecordsCount?: number, throttle?: number) => {
        let index: number = 0;

        const requestNextPage: () => void = () => {
            if (index >= pages.length) { return; } // Done
            const pageNo: number = pages[index as number];
            const isVirtualScrollRequest: boolean = (pageNo * pageSettings.pageSize <= totalRecordsCount) &&
                scrollMode === ScrollMode.Infinite && pageNo <= Math.ceil((filteredTotalRecordsCount ?? totalRecordsCount) /
                pageSettings?.pageSize);
            if ((pageNo > Math.ceil((filteredTotalRecordsCount ?? totalRecordsCount) / pageSettings?.pageSize) &&
                scrollMode !== ScrollMode.Infinite) || (!isVirtualScrollRequest && scrollMode === ScrollMode.Infinite &&
                    infiniteScrollState.isInfiniteEndReached)) {
                return;
            } else if (pageNo < 1) {
                index++;
                requestNextPage();
                return;
            }
            args.currentPage = pageNo;
            setCurrentPage(pageNo);
            setGridAction(args);
            if (!isVirtualScrollRequest && scrollMode === ScrollMode.Infinite) {
                grid.showSpinner();
            }
            setInfiniteScrollState((prevState: InfiniteScrollState) => ({
                ...prevState,
                isVirtualScrollRequest: isVirtualScrollRequest
            }));

            // Wait for actionComplete event before continuing
            const onActionComplete: () => void = () => {
                grid.element.removeEventListener('virtualScrollSequencialRequest', onActionComplete);
                index++;
                setTimeout(() => {
                    requestAnimationFrame(() => {
                        requestNextPage(); // Trigger next page
                    });
                }, throttle);
            };

            grid.element?.addEventListener('virtualScrollSequencialRequest', onActionComplete);
        };

        requestNextPage(); // Start first request
    }, [grid.element, pageSettings?.pageSize, totalRecordsCount]);

    const scrollIntoVirtualRowsRangeView: (startPage: number, endPage: number, filteredTotalRecordsCount?: number,
        throttle?: number) => void =
        useCallback((startPage: number, endPage: number, filteredTotalRecordsCount?: number, throttle?: number) => {
            if (scrollMode === ScrollMode.Auto) { return; }
            // Prepare pager arguments
            const args: PagerArgsInfo = {
                cancel: false,
                currentPage: pageSettings.currentPage,
                previousPage: pageSettings.currentPage,
                requestType: ActionType.Paging,
                type: 'pageChanging'
            };

            // Determine pages to load
            let newPages: number[] = [];
            if (startPage === endPage) {
                // Single page scenario
                newPages = [startPage ? startPage : 1];
                args.currentPage = startPage ? startPage : 1;
            } else {
                // Multiple pages scenario
                for (let pageNo: number = startPage; pageNo <= endPage; pageNo++) {
                    if (pageNo) {
                        newPages.push(pageNo);
                    }
                }
                args.currentPage = endPage; // Last page for reference
            }

            // faster than stringify comparison
            const arePagesEqual: (currentPages: number[], newPages: number[]) => boolean =
                (currentPages: number[], newPages: number[]) => {
                    return currentPages.length === newPages.length && currentPages.every((currentPage: number, index: number) =>
                        currentPage === newPages[index as number]);
                };
            if (arePagesEqual(virtualRowInfo.current.currentPages, newPages) && !isDataOperationPreventVirtualCache.current) { return; }

            virtualRowInfo.current.previousPages = isDataOperationPreventVirtualCache.current ? [pageSettings.currentPage as number] :
                [...virtualRowInfo.current.currentPages as number[]];

            // Update currentPages list
            virtualRowInfo.current.currentPages = newPages;

            const requestNewPages: number[] = [...newPages.filter((page: number) => !virtualRowInfo.current.previousPages.includes(page))];
            isDataOperationPreventVirtualCache.current = false;
            /**
             * Sequentially update currentPage for combined page view.
             * Multiple requestAnimationFrame calls are intentional for UX consistency.
             */
            processPagesSequentially(requestNewPages, args, filteredTotalRecordsCount, throttle);
        }, [virtualSettings, pageSettings, currentViewData, isDataOperationPreventVirtualCache, scrollMode]);

    /**
     * Calculate startIndex and offsetY for dynamic row heights using row index estimation
     * This is optimized for stretching scenarios where scroll position may exceed cache bounds
     *
     * @param estimatedRowIndex - Estimated row index based on scroll percentage
     * @param scrollTop - Current scroll position (can include stretched offset)
     * @param cache - Cached row objects Map
     * @param totalRows - Total number of rows in dataset
     * @param rowBuffer - Buffer size for virtualization
     * @param avgRowHeight - Average row height calculated from cache
     * @returns Object with startIndex and offsetY
     */
    const calculateDynamicRowPositionWithEstimate: (estimatedRowIndex: number, scrollTop: number, cache: Map<number, IRow<ColumnProps<T>>>,
        totalRows: number, rowBuffer: number, avgRowHeight: number) => {
        startIndex: number;
        offsetY: number;
    } = useCallback((
        estimatedRowIndex: number,
        scrollTop: number,
        cache: Map<number, IRow<ColumnProps<T>>>,
        totalRows: number,
        rowBuffer: number,
        avgRowHeight: number
    ): { startIndex: number; offsetY: number } => {

        // Clamp estimated index to valid range
        const clampedIndex: number = Math.max(0, Math.min(estimatedRowIndex, totalRows - 1));

        // Check if we should use fast estimation or detailed calculation
        // If estimated index is far from cached data, use fast path
        const cacheSparsity: number = cache.size / Math.max(1, clampedIndex);
        const useFastEstimation: boolean = clampedIndex > 10000 && cacheSparsity < 0.1;

        if (useFastEstimation) {
            // FAST PATH: Use pure estimation without iteration
            // This is much faster for jump scrolls to bottom with sparse cache
            const foundIndex: number = Math.floor(scrollTop / avgRowHeight);
            const startIndex: number = foundIndex < rowBuffer ? 0 : foundIndex - (rowBuffer - 1);
            const finalOffsetY: number = startIndex * avgRowHeight;

            return { startIndex, offsetY: finalOffsetY };
        }

        // DETAILED PATH: Use cache-aware calculation for better accuracy
        // Calculate offsetY up to this index using cache where available
        let offsetY: number = 0;
        for (let i: number = 0; i < clampedIndex; i++) {
            const row: IRow<ColumnProps<T>> | undefined = cache.get(i);
            offsetY += row?.height ?? avgRowHeight;
        }

        // If offsetY is close to scrollTop, we found our position
        // Otherwise, refine by searching forward/backward
        let foundIndex: number = clampedIndex;

        if (offsetY < scrollTop) {
            // Search forward
            for (let i: number = clampedIndex; i < totalRows && offsetY < scrollTop; i++) {
                const row: IRow<ColumnProps<T>> | undefined = cache.get(i);
                const height: number = row?.height ?? avgRowHeight;

                if (offsetY + height > scrollTop) {
                    foundIndex = i;
                    break;
                }

                offsetY += height;
            }
        } else if (offsetY > scrollTop) {
            // Search backward
            for (let i: number = clampedIndex - 1; i >= 0 && offsetY > scrollTop; i--) {
                const row: IRow<ColumnProps<T>> | undefined = cache.get(i);
                const height: number = row?.height ?? avgRowHeight;
                offsetY -= height;

                if (offsetY <= scrollTop) {
                    foundIndex = i;
                    break;
                }
            }
        }

        // Apply buffer
        const startIndex: number = foundIndex < rowBuffer ? 0 : foundIndex - (rowBuffer - 1);

        // Recalculate offsetY for startIndex
        let finalOffsetY: number = 0;
        for (let i: number = 0; i < startIndex; i++) {
            const row: IRow<ColumnProps<T>> | undefined = cache.get(i);
            finalOffsetY += row?.height ?? avgRowHeight;
        }

        return { startIndex, offsetY: finalOffsetY };
    }, []);

    const setVirtualColumnEndIndex: (vColumns?: ColumnProps[]) => void = (vColumns?: ColumnProps[]) => {
        const startIndex: number = virtualColumnInfo.current?.startIndex ?? 0;
        let totalWidth: number = 0;
        virtualColumnInfo.current.columns = [];
        if (grid?.scrollModule?.virtualColumnInfo) {
            grid.scrollModule.virtualColumnInfo.columns = [];
        }
        const visibleColumns: ColumnProps[] = vColumns ?? getVisibleColumns?.();
        for (let i: number = startIndex, buffer: number = 0; i < visibleColumns?.length && buffer <=
            (startIndex !== 0 && i !== (visibleColumns?.length - 1) ? virtualSettings?.columnBuffer * 2 :
                virtualSettings?.columnBuffer); i++) {
            virtualColumnInfo.current.columns.push(visibleColumns[i as number]);
            totalWidth += parseUnit(visibleColumns[i as number].width);
            if (totalWidth > contentPanelRef?.contentPanelRef?.clientWidth) {
                buffer++;
            }
            virtualColumnInfo.current.endIndex = i + 1;
        }
        if (grid?.scrollModule?.virtualColumnInfo) {
            grid.scrollModule.virtualColumnInfo.columns = virtualColumnInfo.current.columns; // at the time of without any state update invoking method through update causing reference not update issue, so update reference as well manually.
            grid.scrollModule.virtualColumnInfo.endIndex = virtualColumnInfo.current.endIndex;
        }
    };

    const scrollToVirtualColumnIndex: (index?: number) => void = useCallback((index?: number) => {
        if (virtualSettings.enableColumn) {
            let offsetX: number;
            if (!isNullOrUndefined(index)) {
                const startColIndex: number = index < virtualSettings.columnBuffer ? 0 :
                    index - (virtualSettings.columnBuffer - 1);
                offsetX = columnOffsets[index as number] - columnOffsets[startColIndex as number] >=
                    contentPanelRef.contentPanelRef.clientWidth ? columnOffsets[startColIndex as number] :
                    columnOffsets[index as number] - contentPanelRef.contentPanelRef.clientWidth;
            }
            // Horizontal window
            // Compute start index and offsetX deterministically (same logic), minus console noise
            const averageColumnWidth: number = (totalVirtualColumnWidth / (getVisibleColumns?.()?.length === 0 ? 1 :
                getVisibleColumns?.()?.length));
            const scrollX: number = Math.abs(offsetX ?? last.current.left);
            const viewPortColumnStartIndex: number = Math.floor(scrollX / (averageColumnWidth === 0 ? 1 : averageColumnWidth));
            const startColumnIndex: number = viewPortColumnStartIndex < virtualSettings.columnBuffer ? 0 :
                viewPortColumnStartIndex - (virtualSettings.columnBuffer - 1);
            const nextOffsetX: number = (enableRtl || grid?.element?.classList.contains('sf-rtl'))
                ? -(columnOffsets[startColumnIndex as number]) : (columnOffsets[startColumnIndex as number]); // if we use average column width based calculation whitespace occurs only on last view wheel scroll.
            // 3) Update only when values really change
            if (startColumnIndex !== last.current.startCol) {
                const isLeftScroll: boolean = last.current.startCol > startColumnIndex;
                const isFastJumpScroll: boolean = isLeftScroll ?
                    (last.current.startCol - (virtualSettings.columnBuffer)) > startColumnIndex :
                    (last.current.startCol + (virtualSettings.columnBuffer)) < startColumnIndex;
                if (contentPanelRef?.contentTableRef?.parentElement && isFastJumpScroll) {
                    contentPanelRef.contentTableRef.parentElement.style.transform =
                        `translate3d(${nextOffsetX || 0}px, ${last.current.offsetY || 0}px, 0) translateZ(0)`;
                } // Apply immediate DOM manipulation translateY for prevent whitespace flash issue
                virtualColumnInfo.current.isFastJumpScroll = isFastJumpScroll;
                virtualColumnInfo.current.startIndex = isNaN(startColumnIndex) ? 0 : startColumnIndex;
                last.current.startCol = startColumnIndex;
                if (nextOffsetX !== last.current.offsetX) {
                    setVirtualColumnEndIndex();
                    const virtualColumnOffsetChangeEvent: CustomEvent = new CustomEvent('virtualColumnOffsetChange');
                    grid.element.dispatchEvent(virtualColumnOffsetChangeEvent);
                    setOffsetX(nextOffsetX);
                    virtualColumnInfo.current.offsetX = nextOffsetX;
                    last.current.offsetX = nextOffsetX;
                }
            }
        }
    }, [columns, columnOffsets, currentViewData, totalVirtualColumnWidth, enableRtl, virtualSettings, last.current,
        setVirtualColumnEndIndex]);

    /**
     * Handle content scroll events and synchronize header scroll position
     * Optimized for immediate synchronization to prevent gridline misalignment
     *
     * @param {UIEvent<HTMLDivElement>} args - Scroll event arguments
     */
    const onContentScroll: (args: UIEvent<HTMLDivElement>) => void = useCallback((args: UIEvent<HTMLDivElement>): void => {
        const { contentScrollElement, headerScrollElement, footerScrollElement } = elementsRef.current;

        const target: HTMLDivElement = args.target as HTMLDivElement;
        const left: number = target.scrollLeft;
        const top: number = target.scrollTop;
        contentScrollElement.scrollLeft = left;
        if (contentPanelRef.virtualContentRowScrollRef) { contentPanelRef.virtualContentRowScrollRef.scrollTop = top; }
        if (contentPanelRef.virtualContentColumnScrollRef) { contentPanelRef.virtualContentColumnScrollRef.scrollLeft = left; }

        // IMMEDIATE synchronization - no requestAnimationFrame delay to prevent gridline misalignment
        if (headerScrollElement) { headerScrollElement.scrollLeft = left; }
        if (footerScrollElement) { footerScrollElement.scrollLeft = left; }

        if (!virtualSettings.enableRow && !virtualSettings.enableColumn) { return; }
        // 2) Stash coords; batch work to next frame
        last.current.left = left;
        last.current.top = top;

        virtualColumnInfo.current.isFastJumpScroll = false;
        virtualRowInfo.current.isFastJumpScroll = false;
        if (ticking.current) { return; }
        ticking.current = true;

        requestAnimationFrame(() => {
            scrollToVirtualColumnIndex();
            if (virtualSettings.enableRow) {
                // Vertical window
                let startIndex: number;
                let nextOffsetY: number;

                const totalAddFormRenderedRowHeight: number = editModule?.editSettings?.newRowPosition === NewRowPosition.Top ?
                    contentPanelRef?.totalAddFormRenderedRowHeight.current : 0;
                const adjustedScrollTop: number = totalAddFormRenderedRowHeight < last.current.top ?
                    (last.current.top - totalAddFormRenderedRowHeight) : 0;

                const totalRows: number = groupSettings?.enabled && groupSettings?.columns?.length && expandedGroupCountRef.current ?
                    expandedGroupCountRef.current : (scrollMode === ScrollMode.Virtual || scrollMode === ScrollMode.Infinite ?
                        totalRecordsCount : currentViewData?.length);

                // Calculate row offset if stretching is active
                let browserLimitStretchedRowOffset: number = 0;
                const isStretchingActive: boolean = virtualRowInfo.current.isStretchingActive;
                const maxDivHeight: number = virtualRowInfo.current.maxDivHeight || 33554400;

                // Calculate average height upfront (used in multiple places)
                const cache: Map<string | number, IRow<ColumnProps<T>>> = contentPanelRef.cachedRowObjects.current;
                let avgHeight: number = rowHeight;

                if (cache.size > 10) {
                    let totalCachedHeight: number = 0;
                    cache.forEach((row: IRow<ColumnProps<T>>) => {
                        totalCachedHeight += row.height || rowHeight;
                    });
                    avgHeight = totalCachedHeight / cache.size;
                }

                if (isStretchingActive) {
                    // Calculate combined height (what we NEED)
                    const combinedRowHeight: number = totalRows * avgHeight;

                    // Calculate additional pixels needed beyond browser limit
                    const additionalPixelsNeeded: number = Math.max(0, combinedRowHeight - maxDivHeight);

                    // Calculate scroll percentage (0 to 1)
                    const viewportHeight: number = contentPanelRef?.contentPanelRef?.clientHeight || 0;
                    const maxScrollY: number = Math.max(0, maxDivHeight - viewportHeight);
                    const scrollPercent: number = maxScrollY > 0 ? Math.min(1, adjustedScrollTop / maxScrollY) : 0;

                    // Calculate row offset (amplifier)
                    browserLimitStretchedRowOffset = scrollPercent * additionalPixelsNeeded;

                    // Store for use in transform calculation
                    virtualRowInfo.current.browserLimitStretchedRowOffset = browserLimitStretchedRowOffset;
                } else {
                    virtualRowInfo.current.browserLimitStretchedRowOffset = 0;
                }

                // Calculate effective scroll position with stretching offset
                const effectiveScrollTop: number = adjustedScrollTop + browserLimitStretchedRowOffset;

                // Use dynamic calculation ONLY when getRowHeight is provided
                if (getRowHeight && contentPanelRef.cachedRowObjects.current.size > 0) {
                    const totalVirtualHeight: number = totalRows * avgHeight;
                    const contentHeight: number = contentPanelRef?.contentPanelRef?.clientHeight || 0;
                    const minRowsNeeded: number = Math.ceil(contentHeight / avgHeight) + virtualSettings.rowBuffer;
                    const maxAllowedStartIndex: number = Math.max(0, totalRows - minRowsNeeded);

                    // More precise bottom detection
                    // Only trigger special handling when VERY close to absolute end
                    const maxScrollPosition: number = (maxDivHeight - contentHeight);

                    // Calculate how close we are to the absolute maximum scroll position
                    const scrollPosition: number = adjustedScrollTop;
                    const distanceFromEnd: number = maxScrollPosition - scrollPosition;

                    // Only trigger when within 1 viewport height of the end
                    // This prevents premature triggering during medium-speed scrolling
                    const isAtAbsoluteBottom: boolean = distanceFromEnd <= contentHeight;

                    if (isAtAbsoluteBottom) {
                        // At absolute bottom: Use maxAllowedStartIndex
                        startIndex = maxAllowedStartIndex;

                        // Calculate offsetY normally using the existing algorithm
                        // This ensures smooth transition without whitespace
                        let calculatedOffsetY: number = 0;
                        for (let i: number = 0; i < startIndex; i++) {
                            const row: IRow<ColumnProps<T>> | undefined = cache.get(i);
                            calculatedOffsetY += row?.height ?? avgHeight;
                        }

                        nextOffsetY = calculatedOffsetY;
                    } else {
                        // Normal scrolling (existing logic - unchanged)


                        // Use same calculation for both stretching and non-stretching
                        // The difference is in HOW we calculate which row to start from

                        if (isStretchingActive) {
                            // STRETCHING ACTIVE: effectiveScrollTop is amplified
                            // Calculate what percentage of TOTAL virtual space we're at
                            const virtualScrollPercent: number = totalVirtualHeight > 0 ?
                                (effectiveScrollTop / totalVirtualHeight) : 0;

                            // Estimate which row index this percentage corresponds to
                            const estimatedRowIndex: number = Math.floor(virtualScrollPercent * totalRows);

                            // Use estimation to find actual position
                            const result: { startIndex: number; offsetY: number } = calculateDynamicRowPositionWithEstimate(
                                estimatedRowIndex,
                                effectiveScrollTop,
                                contentPanelRef.cachedRowObjects.current as Map<number, IRow<ColumnProps<T>>>,
                                totalRows,
                                virtualSettings.rowBuffer,
                                avgHeight
                            );

                            startIndex = Math.min(result.startIndex, maxAllowedStartIndex);
                            nextOffsetY = result.offsetY;
                        } else {
                            // NO STRETCHING: effectiveScrollTop is direct scroll position
                            // Use direct estimation
                            const estimatedRowIndex: number = Math.floor(effectiveScrollTop / avgHeight);

                            const result: { startIndex: number; offsetY: number } = calculateDynamicRowPositionWithEstimate(
                                estimatedRowIndex,
                                effectiveScrollTop,
                                contentPanelRef.cachedRowObjects.current as Map<number, IRow<ColumnProps<T>>>,
                                totalRows,
                                virtualSettings.rowBuffer,
                                avgHeight
                            );

                            startIndex = Math.min(result.startIndex, maxAllowedStartIndex);
                            nextOffsetY = result.offsetY;
                        }
                    }
                } else {
                    const rows: IRow<ColumnProps<T>>[] = contentPanelRef.getRowsObject?.().filter(
                        (row: IRow<ColumnProps<T>>) => { return !row.isDetailRow; });
                    if (isMasterDetail && rows.length === totalRows) {
                        ticking.current = false;
                        return;
                    }
                    // Fallback to average-based (for static heights without getRowHeight)
                    const averageRowHeight: number = (
                        (contentPanelRef.totalRenderedRowHeight.current === 0 ? rowHeight :
                            contentPanelRef.totalRenderedRowHeight.current) /
                        (contentPanelRef.cachedRowObjects.current.size === 0 ? 1 : contentPanelRef.cachedRowObjects.current.size)
                    );
                    let viewPortStartIndex: number = Math.floor(effectiveScrollTop / (averageRowHeight === 0 ? rowHeight :
                        averageRowHeight));
                    let bufferWidth: number = 0;
                    if (isMasterDetail && expansionState.size) {
                        const expandRow: number[] = [...expansionState.keys()].sort((a: number, b: number) => a - b);
                        for (let i: number = 0; i < expandRow.length; i++) {
                            const index: number = expandRow[parseInt(i.toString(), 10)] as number;
                            const isStart: boolean = viewPortStartIndex - index > Math.floor(detailRowHeight / averageRowHeight);
                            if (!isStart && index < viewPortStartIndex ) {
                                viewPortStartIndex = index;
                                if ((viewPortStartIndex - (virtualSettings.rowBuffer - 1)) + 1 === last.current.startRow) {
                                    viewPortStartIndex = viewPortStartIndex + 1;
                                }
                                break;
                            } else if (isStart && index < viewPortStartIndex && !(viewPortStartIndex < virtualSettings.rowBuffer)) {
                                viewPortStartIndex -=  Math.floor(detailRowHeight / averageRowHeight);
                            }
                        }
                        for (let i: number = viewPortStartIndex - 1; i > viewPortStartIndex - virtualSettings.rowBuffer && i > 0; i--) {
                            const isAdd: boolean = expansionState.has(i);
                            bufferWidth = bufferWidth + (isAdd ? detailRowHeight : 0);
                        }
                    }
                    startIndex = viewPortStartIndex < virtualSettings.rowBuffer ? 0 :
                        viewPortStartIndex - (virtualSettings.rowBuffer - 1);
                    const idx: number = Math.floor(effectiveScrollTop / (averageRowHeight === 0 ? rowHeight :
                        averageRowHeight));
                    nextOffsetY =  (idx  < virtualSettings.rowBuffer ? 0 :
                        ((idx - (virtualSettings.rowBuffer - 1))) * averageRowHeight) - bufferWidth;
                    if (nextOffsetY < 0) {
                        nextOffsetY = 0;
                    }
                }

                if (startIndex !== last.current.startRow) {
                    const isUpScroll: boolean = last.current.startRow > startIndex;
                    const isFastJumpScroll: boolean = isUpScroll ?
                        (last.current.startRow - (virtualSettings.rowBuffer)) > startIndex :
                        (last.current.startRow + (virtualSettings.rowBuffer)) < startIndex;
                    if (contentPanelRef?.contentTableRef?.parentElement && isFastJumpScroll) {
                        // Apply stretched offset to table transform
                        const stretchedOffsetY: number = nextOffsetY - (virtualRowInfo.current.browserLimitStretchedRowOffset || 0);

                        contentPanelRef.contentTableRef.parentElement.style.transform =
                            `translate3d(${last.current.offsetX || 0}px, ${stretchedOffsetY}px, 0) translateZ(0)`;
                    } // Apply immediate DOM manipulation translateY for prevent whitespace flash issue
                    virtualRowInfo.current.isFastJumpScroll = isFastJumpScroll;
                    virtualRowInfo.current.startIndex = isNaN(startIndex) ? 0 : startIndex;
                    last.current.startRow = startIndex;
                    if (nextOffsetY !== last.current.offsetY) {
                        // Apply stretched offset to setOffsetY
                        const stretchedOffsetY: number = nextOffsetY - (virtualRowInfo.current.browserLimitStretchedRowOffset || 0);

                        setOffsetY(stretchedOffsetY);
                        virtualRowInfo.current.offsetY = stretchedOffsetY;
                        last.current.offsetY = stretchedOffsetY;

                        /**
                         * Handles virtual scrolling data updates and page state changes.
                         * Combines cache pruning, view data update, and sequential page state updates.
                         */
                        if (scrollMode === ScrollMode.Virtual || scrollMode === ScrollMode.Infinite) {
                            if (scrollStopTimerRef.current) {
                                clearTimeout(scrollStopTimerRef.current);
                            }

                            scrollStopTimerRef.current = window.setTimeout(() => {
                                const contentScrollTop: number = contentPanelRef.contentScrollRef.scrollTop;
                                const contentClientHeight: number = contentPanelRef.contentScrollRef.clientHeight;
                                const contentScrollHeight: number = contentPanelRef.contentScrollRef.scrollHeight;
                                const [startRow, endRow]: number[] = virtualRowInfo.current.requiredRowsRange;
                                if (isNullOrUndefined(startRow) && isNullOrUndefined(endRow)) {
                                    if ((contentScrollTop + contentClientHeight) + 1 >= contentScrollHeight &&
                                        !infiniteScrollState?.isInfiniteEndReached && scrollMode === ScrollMode.Infinite) {
                                        const nextPageNo: number = Math.ceil(pageSettings.totalRecordsCount / pageSettings.pageSize) + 1;
                                        scrollIntoVirtualRowsRangeView(pageSettings.currentPage, nextPageNo);
                                    }
                                    return;
                                }
                                if (groupSettings.enabled && virtualRowInfo.current?.currentPages?.find((page: number) =>
                                    !loadedPageWiseGroupExpandedCountRef.current.has(page))) {
                                    return;
                                }
                                const pageSize: number = pageSettings.pageSize;
                                const startRowAdjusted: number = (startRow ?? endRow);
                                const endRowAdjusted: number = (endRow ?? startRow);
                                const startRowObject: IRow<ColumnProps<T>> = cachedRowObjects.current?.get(startRowAdjusted);
                                const endRowObject: IRow<ColumnProps<T>> = cachedRowObjects.current?.get(endRowAdjusted);

                                // Calculate start and end pages based on row range
                                const startEndRowBuffer: number = virtualSettings.rowBuffer;
                                const startPageCalc: number = startRowAdjusted - startEndRowBuffer;
                                const endPageCalc: number = endRowAdjusted + startEndRowBuffer;
                                let startPage: number = Math.floor(startPageCalc / pageSize) + 1;
                                let endPage: number = Math.floor(endPageCalc / pageSize) + 1;
                                if (groupSettings.enabled && groupSettings.columns?.length && !startRowObject?.data &&
                                    !endRowObject?.data) {
                                    const pageInfo: {
                                        startPage: number;
                                        endPage: number;
                                    } = getPageFromRowIndex(startPageCalc, endPageCalc,
                                                            loadedPageWiseVirtualGroupStartEndRowIndexes.current);
                                    startPage = pageInfo.startPage;
                                    endPage = pageInfo.endPage;
                                }
                                scrollIntoVirtualRowsRangeView(startPage, endPage, null, 0);
                            }, virtualSettings?.throttleTime); // Debounce delay
                        }
                    }
                }
                if (isMasterDetail && expansionState.size && startIndex === 0) {
                    const stretchedOffsetY: number = 0 - (virtualRowInfo.current.browserLimitStretchedRowOffset || 0);
                    setOffsetY(stretchedOffsetY);
                    virtualRowInfo.current.offsetY = stretchedOffsetY;
                    last.current.offsetY = stretchedOffsetY;
                }
            }
            ticking.current = false;
        });
    }, [columns, totalVirtualColumnWidth, rowHeight, enableRtl, virtualSettings, contentPanelRef, pageSettings, groupSettings,
        totalRecordsCount, currentViewData, scrollMode, scrollToVirtualColumnIndex, infiniteScrollState?.isInfiniteEndReached,
        expandedGroupCountRef.current]);

    const onVirtualRowContentScroll: (args: UIEvent<HTMLDivElement>) => void = useCallback((args: UIEvent<HTMLDivElement>): void => {
        const { contentScrollElement } = elementsRef.current;
        const target: HTMLDivElement = args.target as HTMLDivElement;
        contentScrollElement.scrollTop = target.scrollTop;
        args.target = contentScrollElement;
        onContentScroll(args);
    }, [onContentScroll, infiniteScrollState?.isInfiniteEndReached]);

    const onVirtualColumnContentScroll: (args: UIEvent<HTMLDivElement>) => void = useCallback((args: UIEvent<HTMLDivElement>): void => {
        const { contentScrollElement, headerScrollElement, footerScrollElement } = elementsRef.current;
        const target: HTMLDivElement = args.target as HTMLDivElement;
        contentScrollElement.scrollLeft = target.scrollLeft;
        // IMMEDIATE synchronization - no requestAnimationFrame delay to prevent gridline misalignment
        if (headerScrollElement) { headerScrollElement.scrollLeft = target.scrollLeft; }
        if (footerScrollElement) { footerScrollElement.scrollLeft = target.scrollLeft; }
        args.target = contentScrollElement;
        onContentScroll(args);
    }, [onContentScroll]);

    /**
     * Handle header scroll events and synchronize content scroll position
     * This is especially important for keyboard navigation (tabbing)
     * Optimized for immediate synchronization to prevent gridline misalignment
     *
     * @param {UIEvent<HTMLDivElement>} args - Scroll event arguments
     */
    const onHeaderScroll: (args: UIEvent<HTMLDivElement>) => void = useCallback((args: UIEvent<HTMLDivElement>): void => {
        const { contentScrollElement } = elementsRef.current;

        const target: HTMLDivElement = args.target as HTMLDivElement;
        const left: number = target.scrollLeft;

        // IMMEDIATE synchronization - no requestAnimationFrame delay to prevent gridline misalignment
        contentScrollElement.scrollLeft = left;
    }, []);

    /**
     * Handle footer scroll events and synchronize content scroll position
     * This maintains consistency between footer and content scroll positions
     * Optimized for immediate synchronization to prevent gridline misalignment
     *
     * @param {UIEvent<HTMLDivElement>} args - Scroll event arguments
     */
    const onFooterScroll: (args: UIEvent<HTMLDivElement>) => void = useCallback((args: UIEvent<HTMLDivElement>): void => {
        const { contentScrollElement } = elementsRef.current;

        const target: HTMLDivElement = args.target as HTMLDivElement;
        const left: number = target.scrollLeft;

        // IMMEDIATE synchronization - no requestAnimationFrame delay to prevent gridline misalignment
        contentScrollElement.scrollLeft = left;
    }, []);

    // Clean up resources on unmount to prevent memory leaks
    useEffect(() => {
        return () => {
            // Clear references to DOM elements
            elementsRef.current = {
                headerScrollElement: null,
                contentScrollElement: null,
                virtualContentRowScrollElement: null,
                virtualContentColumnScrollElement: null,
                footerScrollElement: null
            };
            clearTimeout(scrollStopTimerRef.current);
            scrollStopTimerRef.current = null;
        };
    }, []);

    // Initialize browser max div height detection for stretching
    useLayoutEffect(() => {
        if (virtualSettings.enableRow) {
            getBrowserMaxDivHeight();
        }
    }, [virtualSettings.enableRow, getBrowserMaxDivHeight]);

    // Memoize API objects to prevent unnecessary re-renders
    const publicScrollAPI: Partial<IGrid<T>> = useMemo(() => ({ ...grid }), [grid]);

    const privateScrollAPI: UseScrollResult<T>['privateScrollAPI'] = useMemo(() => ({
        getCssProperties,
        headerContentBorder: scrollStyles.headerContentBorder,
        headerPadding: scrollStyles.headerPadding,
        onContentScroll,
        onVirtualRowContentScroll,
        onVirtualColumnContentScroll,
        onHeaderScroll,
        onFooterScroll
    }), [getCssProperties, enableRtl, scrollStyles.headerContentBorder, scrollStyles.headerPadding,
        onContentScroll, onVirtualRowContentScroll, onVirtualColumnContentScroll, onHeaderScroll, onFooterScroll]);

    const protectedScrollAPI: UseScrollResult<T>['protectedScrollAPI'] = useMemo(() => ({
        setPadding,
        getScrollBarWidth,
        virtualRowInfo: virtualRowInfo.current,
        virtualColumnInfo: virtualColumnInfo.current,
        scrollIntoVirtualRowsRangeView,
        isDataOperationPreventVirtualCache: isDataOperationPreventVirtualCache,
        scrollToVirtualColumnIndex,
        setVirtualColumnEndIndex
    }), [setPadding, virtualRowInfo, virtualColumnInfo, scrollIntoVirtualRowsRangeView, isDataOperationPreventVirtualCache,
        scrollToVirtualColumnIndex, setVirtualColumnEndIndex, getScrollBarWidth, expandedGroupCountRef.current]);

    return {
        publicScrollAPI,
        privateScrollAPI,
        protectedScrollAPI,
        setHeaderScrollElement,
        setContentScrollElement,
        setFooterScrollElement
    };
};
