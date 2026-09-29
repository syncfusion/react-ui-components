import {
    forwardRef,
    ForwardRefExoticComponent,
    RefAttributes,
    useImperativeHandle,
    useRef,
    useMemo,
    useCallback,
    memo,
    CSSProperties,
    RefObject,
    JSX,
    ReactElement,
    useState,
    useLayoutEffect
} from 'react';
import { ContentTableBase } from './ContentTable';
import { ContentPanelRef, IContentPanelBase, ContentTableRef } from '../types/interfaces';
import { ScrollMode } from '../types/enum';
import { IRow } from '../types/interfaces';
import { ColumnProps } from '../types/column.interfaces';
import { useGridComputedProvider, useGridMutableProvider } from '../contexts/GridProviders';
import { formatUnit } from '@syncfusion/react-base/src/util';
import { addLastRowBorder, getNonContinuousLeftPinnedWidth, isRowPinningEnabled } from '../utils/utils';
import { Draggable, DragEvent } from '@syncfusion/react-base/src/draggable';

// CSS class constants following enterprise naming convention
const CSS_CONTENT_TABLE: string = 'sf-grid-table';
const CSS_VIRTUAL_TABLE: string = 'sf-virtual-table';
const CSS_VIRTUAL_TRACK: string = 'sf-virtual-track';
const CSS_PINNED_TABLE: string = 'sf-grid-table sf-pinned-table';
const CSS_PINNED_TOP_CONTAINER: string = 'sf-pinned-rows-top-container';
const CSS_PINNED_BOTTOM_CONTAINER: string = 'sf-pinned-rows-bottom-container';

/**
 * Default styles for content table to ensure consistent rendering
 *
 * @type {CSSProperties}
 */
const DEFAULT_TABLE_STYLE: CSSProperties = {
    borderCollapse: 'separate',
    borderSpacing: '0.25px'
};

/**
 * ContentPanelBase component renders the scrollable grid content area with virtual scrolling support.
 * Manages virtual row and column scrollbars, content visibility, and layout measurements.
 * Supports both fixed and auto height modes with configurable virtual scrolling.
 *
 * @component
 * @private
 * @template T - Data type for grid rows
 * @param {Partial<IContentPanelBase>} props - Component properties
 * @param {object} props.panelAttributes - DOM attributes for the content panel container (className, role, etc.)
 * @param {object} props.scrollContentAttributes - DOM attributes for the scrollable content area (style, aria-busy, etc.)
 * @param {object} props.virtualRowScrollContentAttributes - DOM attributes for virtual row scrollbar container
 * @param {object} props.virtualColumnScrollContentAttributes - DOM attributes for virtual column scrollbar container
 * @param {RefObject<ContentPanelRef<T>>} ref - Forwarded ref exposing panel elements and measured dimensions
 * @returns {JSX.Element} The rendered grid content wrapper with virtual scroll support
 * @example
 * ```tsx
 * const panelRef = useRef<ContentPanelRef>(null);
 * return (
 *   <ContentPanelBase
 *     ref={panelRef}
 *     panelAttributes={{ className: 'content-panel' }}
 *     scrollContentAttributes={{ style: { overflow: 'auto' } }}
 *   />
 * );
 * ```
 */
const ContentPanelBase: <T>(props: Partial<IContentPanelBase> & RefAttributes<ContentPanelRef<T>>) => ReactElement =
    memo(forwardRef<ContentPanelRef, Partial<IContentPanelBase>>(
        <T, >(props: Partial<IContentPanelBase>, ref: RefObject<ContentPanelRef<T>>) => {
            const { panelAttributes, scrollContentAttributes, virtualRowScrollContentAttributes, virtualColumnScrollContentAttributes } =
                props;
            const { id, height, rowHeight, detailRowHeight, isMasterDetail, getRowHeight, scrollModule, groupSettings, dragAndDropSettings,
                pinningSettings, headerPanelRef, getVisibleColumns, getPrimaryKeyFieldNames } = useGridComputedProvider<T>();
            const { currentViewData, offsetY, offsetX, totalVirtualColumnWidth, totalRecordsCount, virtualSettings, scrollMode,
                expansionState, expandedGroupCountRef, editModule, pinningModule, reorderModule, leftPinnedColumns,
                uidOrderMap } = useGridMutableProvider<T>();
            const [columnClientWidth, setColumnClientWidth] = useState<number>(0);
            const nonContinuousLeftPinnedWidth: number = useMemo(() => scrollModule?.virtualColumnInfo?.endIndex <
                getVisibleColumns?.()?.length ? getNonContinuousLeftPinnedWidth(leftPinnedColumns, uidOrderMap) :
                0, [leftPinnedColumns, uidOrderMap]);
            const scrollableVirtualColumnWidth: number = Math.max(0, totalVirtualColumnWidth - nonContinuousLeftPinnedWidth);

            // Determine if row pinning is active
            const isPinningActive: boolean = isRowPinningEnabled(pinningSettings);

            const visibleRowKeys: Set<string> = useMemo(() => {
                const primaryKeyField: string | undefined = getPrimaryKeyFieldNames?.()?.[0];
                return new Set((currentViewData ?? []).map((row: T) => String(primaryKeyField ?
                    // eslint-disable-next-line security/detect-object-injection
                    (row as Record<string, unknown>)[primaryKeyField] : row)));
            }, [currentViewData, getPrimaryKeyFieldNames]);

            // Compute whether top/bottom pinned rows exist to conditionally render sections
            const hasPinnedTopRows: boolean = useMemo(() => {
                return isPinningActive && Array.from(pinningModule?.pinnedRowsState?.values() ?? [])
                    .some((state: { isPinned: boolean; pinBucket?: 'top' | 'bottom'; rowData?: T }) => state.isPinned &&
                        state.pinBucket === 'top' && visibleRowKeys.has(String(getPrimaryKeyFieldNames?.()?.[0] ?
                        (state.rowData as Record<string, unknown>)?.[getPrimaryKeyFieldNames?.()?.[0]] : state.rowData)));
            }, [isPinningActive, visibleRowKeys, pinningModule?.pinnedRowsState, getPrimaryKeyFieldNames]);

            const hasPinnedBottomRows: boolean = useMemo(() => {
                return isPinningActive && Array.from(pinningModule?.pinnedRowsState?.values() ?? [])
                    .some((state: { isPinned: boolean; pinBucket?: 'top' | 'bottom'; rowData?: T }) => state.isPinned &&
                        state.pinBucket === 'bottom' && visibleRowKeys.has(String(getPrimaryKeyFieldNames?.()?.[0] ?
                        (state.rowData as Record<string, unknown>)?.[getPrimaryKeyFieldNames?.()?.[0]] : state.rowData)));
            }, [isPinningActive, visibleRowKeys, pinningModule?.pinnedRowsState, getPrimaryKeyFieldNames]);

            // Counts of pinned rows; used to subtract from the virtual track height so
            // the main scroll area doesn't reserve vertical space for rows that are
            // rendered in the pinned-top / pinned-bottom containers.
            const pinnedRowCounts: { top: number; bottom: number } = useMemo((): { top: number; bottom: number } => {
                if (!isPinningActive || !currentViewData) { return { top: 0, bottom: 0 }; }
                let top: number = 0;
                let bottom: number = 0;
                for (const state of pinningModule?.pinnedRowsState?.values() ?? []) {
                    if (state.isPinned && state.pinBucket === 'top') { top++; }
                    else if (state.isPinned && state.pinBucket === 'bottom') { bottom++; }
                }
                return { top, bottom };
            }, [isPinningActive, currentViewData, pinningModule?.pinnedRowsState]);
            // Refs for DOM elements and child components
            const contentPanelRef: RefObject<HTMLDivElement> = useRef<HTMLDivElement>(null);
            const contentScrollRef: RefObject<HTMLDivElement> = useRef<HTMLDivElement>(null);
            const virtualContentRowScrollRef: RefObject<HTMLDivElement> =
                    useRef<HTMLDivElement>(null);
            const virtualContentColumnScrollRef: RefObject<HTMLDivElement> =
                    useRef<HTMLDivElement>(null);
            const contentTableRef: RefObject<ContentTableRef<T>> = useRef<ContentTableRef<T>>(null);
            const rowReorderModule: {
                dragHelper: (args: {
                    sender?: MouseEvent & TouchEvent;
                }) => HTMLElement;
                dragStart: (args: DragEvent) => void;
                drag: (args: DragEvent) => void;
                dragStop: (args: DragEvent) => Promise<void>;
            } = reorderModule?.rowReorderModule?.(contentTableRef);
            const pinnedTopTableRef: RefObject<ContentTableRef<T>> = useRef<ContentTableRef<T>>(null);
            const pinnedBottomTableRef: RefObject<ContentTableRef<T>> = useRef<ContentTableRef<T>>(null);
            const pinnedTopContainerRef: RefObject<HTMLDivElement> = useRef<HTMLDivElement>(null);
            const pinnedBottomContainerRef: RefObject<HTMLDivElement> = useRef<HTMLDivElement>(null);
            const contentVirtualTableRef: RefObject<HTMLDivElement> = useRef<HTMLDivElement>(null);
            const virtualTrackRef: RefObject<HTMLDivElement> = useRef<HTMLDivElement>(null);
            const virtualRowTrackRef: RefObject<HTMLDivElement> = useRef<HTMLDivElement>(null);
            const [rowsClientHeight, setRowsClientHeight] = useState<number>(contentTableRef.current?.totalRenderedRowHeight.current ?? 0);

            useLayoutEffect(() => {
                const contentTable: HTMLTableElement = contentTableRef.current?.contentTableRef;
                if (dragAndDropSettings?.enabled && height !== 'auto' && contentScrollRef.current && contentTable &&
                    contentScrollRef.current.clientHeight > contentTable.scrollHeight) {
                    addLastRowBorder(contentTableRef.current?.contentTableRef, editModule?.editSettings);
                }
            }, [currentViewData, dragAndDropSettings?.enabled, height, editModule?.editSettings]);

            const getCombinedRowsObject: () => IRow<ColumnProps<T>>[] = useCallback((): IRow<ColumnProps<T>>[] => {
                const combinedRowsObject: IRow<ColumnProps<T>>[] = [
                    ...(pinnedTopTableRef.current?.getRowsObject?.() ?? []),
                    ...(contentTableRef.current?.getRowsObject?.() ?? []),
                    ...(pinnedBottomTableRef.current?.getRowsObject?.() ?? [])
                ];

                return combinedRowsObject;
            }, [contentTableRef.current, pinnedTopTableRef.current, pinnedBottomTableRef.current]);

            const getCombinedCachedRowObjects: () => RefObject<Map<number | string, IRow<ColumnProps<T>>>> = useCallback(
                (): RefObject<Map<number | string, IRow<ColumnProps<T>>>> => {
                    const combinedRowObjects: Map<number | string, IRow<ColumnProps<T>>> = new Map([
                        ...(pinnedTopTableRef.current?.cachedRowObjects.current ?? []),
                        ...(contentTableRef.current?.cachedRowObjects.current ?? []),
                        ...(pinnedBottomTableRef.current?.cachedRowObjects.current ?? [])
                    ]);

                    return { current: combinedRowObjects };
                }, [contentTableRef.current, pinnedTopTableRef.current, pinnedBottomTableRef.current]);

            const getCombinedRows: () => HTMLTableRowElement[] = useCallback(
                (): HTMLTableRowElement[] => {
                    const combinedRows: HTMLTableRowElement[] = [
                        ...(pinnedTopTableRef.current?.getRows?.() ?? []),
                        ...(contentTableRef.current?.getRows?.() ?? []),
                        ...(pinnedBottomTableRef.current?.getRows?.() ?? [])
                    ];

                    return combinedRows;
                }, [contentTableRef.current?.getRows, pinnedTopTableRef.current?.getRows, pinnedBottomTableRef.current?.getRows]
            );

            const getCombinedRowByIndex: (index: number) => HTMLTableRowElement | null = useCallback(
                (index: number) => {
                    return pinnedTopTableRef.current?.getRowByIndex?.(index) ?? contentTableRef.current?.getRowByIndex?.(index) ??
                    pinnedBottomTableRef.current?.getRowByIndex?.(index);
                }, [pinnedTopTableRef.current?.getRowByIndex, contentTableRef.current?.getRowByIndex,
                    pinnedBottomTableRef.current?.getRowByIndex]);

            const getCombinedRowsObjectFromUID: (uid: string) => IRow<ColumnProps<T>> | null = useCallback(
                (uid: string) => {
                    return pinnedTopTableRef.current?.getRowObjectFromUID?.(uid) ?? contentTableRef.current?.getRowObjectFromUID?.(uid) ??
                    pinnedBottomTableRef.current?.getRowObjectFromUID?.(uid);
                }, [pinnedTopTableRef.current?.getRowObjectFromUID, contentTableRef.current?.getRowObjectFromUID,
                    pinnedBottomTableRef.current?.getRowObjectFromUID]);

            const virtualHeight: number = useMemo(() => {
                if (height === 'auto') {
                    return rowsClientHeight || (contentTableRef.current?.totalRenderedRowHeight.current +
                            contentTableRef.current?.totalAddFormRenderedRowHeight.current) ||
                        contentTableRef.current?.contentSectionRef?.clientHeight;
                }

                const totalRows: number = (groupSettings.enabled && groupSettings.columns?.length && expandedGroupCountRef?.current ?
                    expandedGroupCountRef?.current : (scrollMode === ScrollMode.Virtual || scrollMode === ScrollMode.Infinite ?
                        totalRecordsCount : currentViewData?.length)) || 0;
                const cache: Map<string | number, IRow<ColumnProps<T>>> = contentTableRef.current?.cachedRowObjects.current;
                const addFormHeight: number = contentTableRef.current?.totalAddFormRenderedRowHeight.current || 0;

                // Hybrid approach ONLY when getRowHeight is provided
                if (getRowHeight && cache && cache.size > 0) {
                    // Calculate average from cache for better estimation
                    let measuredTotalHeight: number = 0;
                    let measuredCount: number = 0;

                    // Efficient iteration (no array conversion needed)
                    cache.forEach((row: IRow<ColumnProps<T>>) => {
                        if (row.height) {
                            measuredTotalHeight += row.height;
                            measuredCount++;
                        }
                    });

                    // Calculate average height from measured rows (more accurate than fixed rowHeight)
                    const avgHeight: number = measuredCount > 0 ?
                        (measuredTotalHeight / measuredCount) : rowHeight;

                    // Formula: ((scroll content rows count - top pinned rows count) * avgHeight)
                    // + (bottom pinned rows count * avgHeight)
                    const topPinnedCount: number = pinnedRowCounts?.top ?? 0;
                    const bottomPinnedCount: number = pinnedRowCounts?.bottom ?? 0;
                    let calculatedHeight: number = ((totalRows + topPinnedCount + bottomPinnedCount) * avgHeight);

                    // Check if stretching is needed due to browser limits
                    const maxDivHeight: number = scrollModule?.virtualRowInfo?.maxDivHeight || 33554400;

                    if (calculatedHeight > maxDivHeight) {
                        // Clamp to browser limit - stretching will handle the rest
                        calculatedHeight = maxDivHeight;

                        // Mark stretching as active
                        if (scrollModule?.virtualRowInfo) {
                            scrollModule.virtualRowInfo.isStretchingActive = true;
                        }
                    } else {
                        // Reset stretching state when not needed
                        if (scrollModule?.virtualRowInfo) {
                            scrollModule.virtualRowInfo.isStretchingActive = false;
                            scrollModule.virtualRowInfo.browserLimitStretchedRowOffset = 0;
                        }
                    }
                    if (isMasterDetail && detailRowHeight) {
                        calculatedHeight += (expansionState.size * detailRowHeight);
                    }

                    return calculatedHeight;
                }

                // Average-based calculation (fixed height behavior)
                const averageRowHeight: number = (
                    contentTableRef.current?.totalRenderedRowHeight.current /
                    (totalRows < contentTableRef.current?.cachedRowObjects.current.size ?
                        totalRows : contentTableRef.current?.cachedRowObjects.current.size)
                );
                const finalAvgHeight: number = isNaN(averageRowHeight) || !isFinite(averageRowHeight) ? rowHeight : averageRowHeight;
                const topPinnedCount: number = pinnedRowCounts?.top ?? 0;
                const bottomPinnedCount: number = pinnedRowCounts?.bottom ?? 0;
                let calculatedHeight: number = ((totalRows + topPinnedCount + bottomPinnedCount) * finalAvgHeight);
                calculatedHeight += addFormHeight;

                // Check if stretching is needed due to browser limits
                const maxDivHeight: number = scrollModule?.virtualRowInfo?.maxDivHeight || 33554400;

                if (calculatedHeight > maxDivHeight) {
                    // Clamp to browser limit - stretching will handle the rest
                    calculatedHeight = maxDivHeight;

                    // Mark stretching as active
                    if (scrollModule?.virtualRowInfo) {
                        scrollModule.virtualRowInfo.isStretchingActive = true;
                    }
                } else {
                    // Reset stretching state when not needed
                    if (scrollModule?.virtualRowInfo) {
                        scrollModule.virtualRowInfo.isStretchingActive = false;
                        scrollModule.virtualRowInfo.browserLimitStretchedRowOffset = 0;
                    }
                }

                if (isMasterDetail && detailRowHeight) {
                    calculatedHeight += (expansionState.size * detailRowHeight);
                }

                return calculatedHeight;

            }, [currentViewData, contentTableRef.current?.totalRenderedRowHeight.current, scrollMode, totalRecordsCount,
                contentTableRef.current?.cachedRowObjects.current.size, getRowHeight, height, rowHeight,
                contentTableRef.current?.totalAddFormRenderedRowHeight.current, rowsClientHeight,
                scrollModule?.virtualRowInfo?.maxDivHeight, expansionState, pinnedRowCounts.top, pinnedRowCounts.bottom,
                pinningModule?.pinnedRowsState, pinnedTopContainerRef.current?.clientHeight,
                pinnedBottomContainerRef.current?.clientHeight]);

            /**
             * Expose internal elements and methods through the forwarded ref
             * Provides:
             * - ContentPanel specific properties (panels, refs, etc.)
             * - Scrollable content table properties via spread (main table)
             * - Direct references to pinned tables for separate access
             * - Combined methods that operate on all three tables
             */
            useImperativeHandle(ref, () => ({
                // ContentPanel specific properties
                contentPanelRef: contentPanelRef.current,
                contentScrollRef: contentScrollRef.current,
                contentVirtualTableRef: contentVirtualTableRef.current,
                virtualContentRowScrollRef: virtualContentRowScrollRef.current,
                virtualContentColumnScrollRef: virtualContentColumnScrollRef.current,

                // Forward all properties from ContentTable
                ...(contentTableRef.current as ContentTableRef<T>),

                // Direct references to pinned tables for separate access
                pinnedTopTableRef: pinnedTopTableRef.current,
                pinnedBottomTableRef: pinnedBottomTableRef.current,

                // ref must be derived from whichever table currently owns the active edit state.
                editCellFormRef: pinnedTopTableRef.current?.editCellFormRef?.current ? pinnedTopTableRef.current.editCellFormRef :
                    contentTableRef.current?.editCellFormRef?.current ? contentTableRef.current.editCellFormRef :
                        pinnedBottomTableRef.current?.editCellFormRef?.current ? pinnedBottomTableRef.current.editCellFormRef : undefined,

                // Pinned table DOM element accessors
                getPinnedTopTable: () => pinnedTopTableRef.current?.getContentTable?.(),
                getPinnedBottomTable: () => pinnedBottomTableRef.current?.getContentTable?.(),

                // Combined methods - operate on all three tables (top + content + bottom)
                // Note: getRows, getRowsObject, getRowByIndex, getRowObjectFromUID override spread
                // but cachedRowObjects and totalRenderedRowHeight remain from spread (content-table-only for virtualization)
                getRows: () => getCombinedRows() as unknown as HTMLCollectionOf<HTMLTableRowElement>,
                getRowsObject: () => getCombinedRowsObject(),
                getRowByIndex: (rowIndex: number) => getCombinedRowByIndex(rowIndex),
                getRowObjectFromUID: (uid: string) => getCombinedRowsObjectFromUID(uid),
                cachedRowObjects: getCombinedCachedRowObjects(),

                // Content table specific accessor
                getContentTableCachedRowObjects: () => contentTableRef.current?.cachedRowObjects.current,
                getContentTableRowsObject: () => contentTableRef.current?.getRowsObject?.(),
                getContentRowByIndex: (rowIndex: number) => contentTableRef.current?.getRowByIndex?.(rowIndex),

                // Top pinned table specific accessor
                getPinnedTopTableCachedRowObjects: () => pinnedTopTableRef.current?.cachedRowObjects.current,
                getPinnedTopTableRowsObject: () => pinnedTopTableRef.current?.getRowsObject?.(),

                // Bottom pinned table specific accessor
                getPinnedBottomTableCachedRowObjects: () => pinnedBottomTableRef.current?.cachedRowObjects.current,
                getPinnedBottomTableRowsObject: () => pinnedBottomTableRef.current?.getRowsObject?.(),

                columnClientWidth: columnClientWidth
            }), [contentPanelRef.current, contentScrollRef.current, contentTableRef.current, columnClientWidth,
                hasPinnedTopRows, hasPinnedBottomRows, getCombinedRows, getCombinedRowsObject,
                getCombinedRowByIndex, getCombinedRowsObjectFromUID, getCombinedCachedRowObjects, pinnedTopTableRef.current,
                pinnedBottomTableRef.current, pinningModule?.pinnedRowsState, contentTableRef.current?.editCellFormRef?.current,
                pinnedTopTableRef.current?.editCellFormRef?.current, pinnedBottomTableRef.current?.editCellFormRef?.current]);

            /**
             * Synchronize layout measurements with component state
             * Handles both column width and row height updates in a single effect
             * to prevent cascading re-renders and race conditions
             */
            useLayoutEffect(() => {
                const newColumnWidth: number = contentTableRef.current?.columnClientWidth;
                if (columnClientWidth !== newColumnWidth) {
                    setColumnClientWidth(newColumnWidth);
                }

                // Update row height based on rendering mode
                let newRowsHeight: number = rowsClientHeight;
                if (height !== 'auto') {
                    const calculatedHeight: number = (contentTableRef.current?.totalRenderedRowHeight.current ?? 0) +
                        (contentTableRef.current?.totalAddFormRenderedRowHeight.current ?? 0);
                    if (rowsClientHeight !== calculatedHeight) {
                        newRowsHeight = calculatedHeight;
                    }
                } else if (contentTableRef.current?.contentSectionRef?.getBoundingClientRect().height !== rowsClientHeight) {
                    newRowsHeight = contentTableRef.current?.contentSectionRef?.getBoundingClientRect().height;
                }

                if (newRowsHeight !== rowsClientHeight) {
                    setRowsClientHeight(newRowsHeight);
                }
            }, [offsetX, contentTableRef.current?.columnClientWidth, height,
                contentTableRef.current?.totalRenderedRowHeight.current,
                contentTableRef.current?.totalAddFormRenderedRowHeight.current,
                contentTableRef.current?.contentSectionRef?.clientHeight, editModule?.editRowIndex,
                pinnedTopContainerRef.current?.clientHeight, pinnedRowCounts.top,
                pinnedBottomContainerRef.current?.clientHeight, pinnedRowCounts.bottom]);

            /**
             * Sync column widths from main table colgroup to pinned table colgroups.
             * Runs after every render so any column resize is reflected in pinned tables.
             */
            useLayoutEffect(() => {
                if (!isPinningActive) { return; }
                const mainColgroup: HTMLTableColElement | undefined =
                    contentTableRef.current?.contentTableRef?.querySelector('colgroup') as HTMLTableColElement | undefined;
                if (!mainColgroup) { return; }
                const syncColgroup: (tableRef: ContentTableRef<T> | null) => void =
                    (tableRef: ContentTableRef<T> | null): void => {
                        if (!tableRef) { return; }
                        const pinnedColgroup: HTMLTableColElement | undefined =
                            tableRef.contentTableRef
                                ?.querySelector('colgroup') as HTMLTableColElement | undefined;
                        if (!pinnedColgroup) { return; }
                        const mainCols: NodeListOf<HTMLElement> = mainColgroup.querySelectorAll('col');
                        const pinnedCols: NodeListOf<HTMLElement> = pinnedColgroup.querySelectorAll('col');
                        mainCols.forEach((col: HTMLElement, i: number) => {
                            if (pinnedCols[i as number]) {
                                pinnedCols[i as number].style.width = col.style.width || (col as HTMLTableColElement).width;
                            }
                        });
                    };
                syncColgroup(pinnedTopTableRef.current);
                syncColgroup(pinnedBottomTableRef.current);
            }, [isPinningActive, offsetX, contentTableRef.current?.columnClientWidth]);

            /**
             * Sync horizontal movement between the main content and pinned table containers.
             * Pinned containers are outside the scroll surface, while column virtualization
             * moves the main table through its virtual wrapper transform.
             */
            useLayoutEffect(() => {
                const scrollEl: HTMLDivElement | null = contentScrollRef.current;
                if (!isPinningActive || !scrollEl) { return undefined; }
                const onScroll: () => void = (): void => {
                    const virtualTable: HTMLElement | null = contentVirtualTableRef.current;
                    const transform: string = virtualTable ? getComputedStyle(virtualTable).transform ?? '' : '';
                    const matrixValues: string[] = transform.match(/matrix3d\(([^)]+)\)/)?.[1]?.split(',') ??
                        transform.match(/matrix\(([^)]+)\)/)?.[1]?.split(',') ?? [];
                    const parsedVirtualOffset: number = matrixValues.length === 16 ? Number(matrixValues[12]) :
                        matrixValues.length === 6 ? Number(matrixValues[4]) : 0;
                    const virtualOffset: number = Number.isFinite(parsedVirtualOffset) ? parsedVirtualOffset : 0;
                    const horizontalOffset: number = virtualOffset - scrollEl.scrollLeft;
                    const topTableEl: HTMLTableElement | null =
                        pinnedTopTableRef.current?.contentTableRef ?? null;
                    const bottomTableEl: HTMLTableElement | null =
                        pinnedBottomTableRef.current?.contentTableRef ?? null;
                    if (topTableEl) { topTableEl.style.marginLeft = `${horizontalOffset}px`; }
                    if (bottomTableEl) { bottomTableEl.style.marginLeft = `${horizontalOffset}px`; }
                };
                const virtualColumnScrollEl: HTMLDivElement | null = virtualContentColumnScrollRef.current;
                const gridElement: HTMLElement | null = contentPanelRef.current?.closest('.sf-grid') as HTMLElement | null;
                scrollEl.addEventListener('scroll', onScroll, { passive: true });
                virtualColumnScrollEl?.addEventListener('scroll', onScroll, { passive: true });
                gridElement?.addEventListener('virtualColumnOffsetChange', onScroll);
                onScroll();
                return (): void => {
                    scrollEl.removeEventListener('scroll', onScroll);
                    virtualColumnScrollEl?.removeEventListener('scroll', onScroll);
                    gridElement?.removeEventListener('virtualColumnOffsetChange', onScroll);
                };
            }, [isPinningActive, offsetX, scrollModule?.leftPinnedWidth, virtualSettings.enableColumn]);

            /**
             * Memoized content table component to prevent unnecessary re-renders
             */
            const contentTable: JSX.Element = useMemo(() => (
                <ContentTableBase<T>
                    ref={contentTableRef}
                    className={CSS_CONTENT_TABLE}
                    role="presentation"
                    id={`${id}_content_table`}
                    style={DEFAULT_TABLE_STYLE}
                />
            ), [id]);

            /**
             * Memoized top-pinned rows table — only rendered when row pinning is active and top rows exist
             */
            const pinnedTopTable: JSX.Element | null = useMemo(() => hasPinnedTopRows ? (
                <div ref={pinnedTopContainerRef} className={CSS_PINNED_TOP_CONTAINER}
                    style={{ paddingInlineEnd: headerPanelRef?.style?.paddingRight }}>
                    <ContentTableBase<T>
                        ref={pinnedTopTableRef}
                        className={CSS_PINNED_TABLE}
                        role="presentation"
                        id={`${id}_pinned_top_table`}
                        style={DEFAULT_TABLE_STYLE}
                        pinBucket="top"
                    />
                </div>
            ) : null, [id, hasPinnedTopRows, pinningModule?.pinnedRowsState]);

            const hasVirtualHorizontalScrollbar: boolean = virtualSettings.enableColumn &&
                scrollableVirtualColumnWidth > (contentPanelRef.current?.clientWidth || 0);

            /**
             * Memoized bottom-pinned rows table — only rendered when row pinning is active and bottom rows exist
             */
            const pinnedBottomTable: JSX.Element | null = useMemo(() => hasPinnedBottomRows ? (
                <div ref={pinnedBottomContainerRef} className={CSS_PINNED_BOTTOM_CONTAINER}
                    style={{
                        paddingInlineEnd: headerPanelRef?.style?.paddingRight,
                        bottom: hasVirtualHorizontalScrollbar ? virtualContentRowScrollRef.current?.offsetWidth || 16 : 0
                    }}>
                    <ContentTableBase<T>
                        ref={pinnedBottomTableRef}
                        className={CSS_PINNED_TABLE}
                        role="presentation"
                        id={`${id}_pinned_bottom_table`}
                        style={DEFAULT_TABLE_STYLE}
                        pinBucket="bottom"
                    />
                </div>
            ) : null, [id, hasPinnedBottomRows, hasVirtualHorizontalScrollbar, pinningModule?.pinnedRowsState]);

            useLayoutEffect(() => {
                if (!isPinningActive) { return; }
                const paddingRight: string = headerPanelRef?.style?.paddingRight || '';
                if (pinnedTopContainerRef.current) {
                    pinnedTopContainerRef.current.style.paddingInlineEnd = paddingRight;
                }
                if (pinnedBottomContainerRef.current) {
                    pinnedBottomContainerRef.current.style.paddingInlineEnd = paddingRight;
                }
            });

            const virtualWrapperStyle: CSSProperties = useMemo(() => {
                const pinnedTopHeight: number = pinnedTopTableRef.current?.totalRenderedRowHeight?.current ??
                    pinnedTopContainerRef.current?.clientHeight ?? 0;
                const translateY: number = (offsetY || 0) + pinnedTopHeight;

                return {
                    position: 'absolute', // required inline element styles for responsive UI state update
                    maxHeight: formatUnit(height),
                    transform: `translate3d(${(offsetX || 0) - (scrollModule?.leftPinnedWidth ?? 0)}px, ${translateY}px, 0) translateZ(0)`,
                    ...(virtualSettings.enableColumn && totalVirtualColumnWidth > contentScrollRef.current?.getBoundingClientRect().width &&
                        totalVirtualColumnWidth > columnClientWidth ? { width: columnClientWidth } : {})
                };
            }, [height, offsetY, offsetX, scrollModule?.leftPinnedWidth, expansionState, contentScrollRef.current?.clientWidth,
                columnClientWidth, totalVirtualColumnWidth, pinnedTopTableRef.current?.totalRenderedRowHeight?.current,
                pinnedTopContainerRef.current?.clientHeight, pinnedRowCounts.top, pinningModule?.pinnedRowsState]);

            const virtualTrackStyle: CSSProperties = useMemo(() => ({
                height: virtualHeight || formatUnit(height),
                width: scrollableVirtualColumnWidth
            }), [virtualHeight, scrollableVirtualColumnWidth, expansionState, height, columnClientWidth]);

            const DraggableContent: JSX.Element = (
                <Draggable
                    clone={true}
                    enableTailMode={true}
                    isPreventSelect={true}
                    distance={5}
                    helper={rowReorderModule?.dragHelper}
                    onDragStart={rowReorderModule?.dragStart}
                    dragArea={dragAndDropSettings?.targetID ? undefined : contentScrollRef.current}
                    onDrag={rowReorderModule?.drag}
                    onDragStop={rowReorderModule?.dragStop}
                    cursorAt={{ left: 10, top: 10 }}
                >
                    <div>{contentTable}</div>
                </Draggable>
            );

            const contentPanel: JSX.Element = (
                <div
                    {...panelAttributes}
                    ref={contentPanelRef}
                >
                    {pinnedTopTable}
                    <div
                        ref={contentScrollRef}
                        {...scrollContentAttributes}
                    >
                        { !virtualSettings.enableRow && !virtualSettings.enableColumn ? (
                            rowReorderModule && dragAndDropSettings?.enabled ? DraggableContent : contentTable
                        ) : (
                            <>
                                <div ref={contentVirtualTableRef} className={CSS_VIRTUAL_TABLE} style={virtualWrapperStyle}>
                                    {rowReorderModule && dragAndDropSettings?.enabled ? DraggableContent : contentTable}
                                </div>
                                <div ref={virtualTrackRef} className={CSS_VIRTUAL_TRACK} style={virtualTrackStyle} />
                            </>
                        )}
                    </div>
                    {pinnedBottomTable}
                    {virtualSettings.enableRow && virtualHeight > contentPanelRef.current?.clientHeight &&
                    <div ref={virtualContentRowScrollRef} style={{
                        overflowX: scrollableVirtualColumnWidth > contentPanelRef.current?.clientWidth ? 'scroll' : 'hidden',
                        width: virtualContentRowScrollRef.current?.offsetWidth || 16
                    }} className="sf-virtual-vertical-scrollbar" {...virtualRowScrollContentAttributes} tabIndex={-1}>
                        <div ref={virtualRowTrackRef} className="sf-virtual-vertical-track" style={{
                            height: virtualTrackStyle.height,
                            width: virtualContentRowScrollRef.current?.offsetWidth
                        }}></div>
                    </div>}
                    {virtualSettings.enableColumn && scrollableVirtualColumnWidth >
                    contentPanelRef.current?.getBoundingClientRect().width &&
                    <div ref={virtualContentColumnScrollRef} style={{
                        overflowY: virtualHeight > contentPanelRef.current?.clientHeight ? 'scroll' : 'hidden',
                        height: virtualContentColumnScrollRef.current?.offsetHeight || 16
                    }} className="sf-virtual-horizontal-scrollbar" {...virtualColumnScrollContentAttributes} tabIndex={-1}>
                        <div className="sf-virtual-horizontal-track" style={{
                            height: virtualContentColumnScrollRef.current?.offsetHeight,
                            width: virtualTrackStyle.width
                        }}></div>
                    </div>}
                </div>
            );

            return contentPanel;
        }
    ), (prevProps: Partial<IContentPanelBase>, nextProps: Partial<IContentPanelBase>) => {
        // Custom comparison function for memo to prevent unnecessary re-renders
        // Pure comparison without side effects - only re-render if relevant props change
        const prevStyle: CSSProperties = prevProps.scrollContentAttributes?.style;
        const nextStyle: CSSProperties = nextProps.scrollContentAttributes?.style;
        const prevBusy: string | boolean = prevProps.scrollContentAttributes?.['aria-busy'];
        const nextBusy: string | boolean = nextProps.scrollContentAttributes?.['aria-busy'];
        const prevPanelClass: string = prevProps.panelAttributes?.className;
        const nextPanelClass: string = nextProps.panelAttributes?.className;

        // Deep comparison of style objects
        const stylesEqual: boolean = JSON.stringify(prevStyle) === JSON.stringify(nextStyle);
        const busyEqual: boolean = prevBusy === nextBusy;
        const classNameEqual: boolean = prevPanelClass === nextPanelClass;

        return stylesEqual && busyEqual && classNameEqual;
    }) as <T>(props: Partial<IContentPanelBase> & RefAttributes<ContentPanelRef<T>>) => ReactElement;

/**
 * Set display name for debugging purposes
 */
(ContentPanelBase as ForwardRefExoticComponent<Partial<IContentPanelBase> & RefAttributes<ContentPanelRef>>).displayName = 'ContentPanelBase';

/**
 * Export the ContentPanelBase component for use in other components
 *
 * @private
 */
export { ContentPanelBase };
