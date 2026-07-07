import {
    forwardRef,
    ForwardRefExoticComponent,
    RefAttributes,
    useImperativeHandle,
    useRef,
    useMemo,
    memo,
    CSSProperties,
    RefObject,
    JSX,
    ReactElement,
    useState,
    useLayoutEffect
} from 'react';
import { ContentTableBase } from './index';
import {
    ContentPanelRef,
    IContentPanelBase,
    ContentTableRef,
    ScrollMode,
    IRow
} from '../types';
import { ColumnProps } from '../types/column.interfaces';
import {
    useGridComputedProvider,
    useGridMutableProvider
} from '../contexts';
import { formatUnit } from '@syncfusion/react-base';

// CSS class constants following enterprise naming convention
const CSS_CONTENT_TABLE: string = 'sf-grid-table';
const CSS_VIRTUAL_TABLE: string = 'sf-virtual-table';
const CSS_VIRTUAL_TRACK: string = 'sf-virtual-track';

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
            const { id, height, rowHeight, detailRowHeight, isMasterDetail,
                getRowHeight, scrollModule, groupSettings } = useGridComputedProvider<T>();
            const { currentViewData, offsetY, offsetX, totalVirtualColumnWidth, totalRecordsCount, virtualSettings, scrollMode,
                expansionState, expandedGroupCountRef, editModule } = useGridMutableProvider<T>();
            const [columnClientWidth, setColumnClientWidth] = useState<number>(0);

            // Refs for DOM elements and child components
            const contentPanelRef: RefObject<HTMLDivElement> = useRef<HTMLDivElement>(null);
            const contentScrollRef: RefObject<HTMLDivElement> = useRef<HTMLDivElement>(null);
            const virtualContentRowScrollRef: RefObject<HTMLDivElement> =
                    useRef<HTMLDivElement>(null);
            const virtualContentColumnScrollRef: RefObject<HTMLDivElement> =
                    useRef<HTMLDivElement>(null);
            const contentTableRef: RefObject<ContentTableRef<T>> = useRef<ContentTableRef<T>>(null);
            const contentVirtualTableRef: RefObject<HTMLDivElement> = useRef<HTMLDivElement>(null);
            const [rowsClientHeight, setRowsClientHeight] = useState<number>(contentTableRef.current?.totalRenderedRowHeight.current ?? 0);
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

                    // Use average height for ALL rows (consistent total height regardless of cache size)
                    let calculatedHeight: number = totalRows * avgHeight + addFormHeight;

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
                let calculatedHeight: number = totalRows * (isNaN(averageRowHeight) || !isFinite(averageRowHeight) ? rowHeight :
                    averageRowHeight);
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
                scrollModule?.virtualRowInfo?.maxDivHeight, expansionState]);

            /**
             * Expose internal elements and methods through the forwarded ref
             * Only define properties specific to ContentPanel and forward ContentTable properties
             */
            useImperativeHandle(ref, () => ({
                // ContentPanel specific properties
                contentPanelRef: contentPanelRef.current,
                contentScrollRef: contentScrollRef.current,
                virtualContentRowScrollRef: virtualContentRowScrollRef.current,
                virtualContentColumnScrollRef: virtualContentColumnScrollRef.current,

                // Forward all properties from ContentTable
                ...(contentTableRef.current as ContentTableRef<T>),
                columnClientWidth: columnClientWidth
            }), [contentPanelRef.current, contentScrollRef.current, contentTableRef.current, columnClientWidth]);

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
                contentTableRef.current?.contentSectionRef?.clientHeight, editModule?.editRowIndex]);

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

            const virtualWrapperStyle: CSSProperties = useMemo(() => {
                return {
                    position: 'absolute', // required inline element styles for responsive UI state update
                    maxHeight: formatUnit(height),
                    transform: `translate3d(${offsetX || 0}px, ${offsetY || 0}px, 0) translateZ(0)`,
                    // resizeSettings Auto based currently handled, columns occupied whitespaces, each columns render beyond configured widths.
                    ...(virtualSettings.enableColumn && totalVirtualColumnWidth > contentScrollRef.current?.clientWidth &&
                        totalVirtualColumnWidth > columnClientWidth ? { width: columnClientWidth } : {})
                };
            }, [height, offsetY, offsetX, expansionState, contentScrollRef.current?.clientWidth,
                columnClientWidth, totalVirtualColumnWidth]);

            const virtualTrackStyle: CSSProperties = useMemo(() => ({
                height: virtualHeight || formatUnit(height),
                width: totalVirtualColumnWidth
            }), [virtualHeight, totalVirtualColumnWidth, expansionState, height, columnClientWidth]);

            return (
                <div
                    {...panelAttributes}
                    ref={contentPanelRef}
                >
                    <div
                        ref={contentScrollRef}
                        {...scrollContentAttributes}
                    >
                        { !virtualSettings.enableRow && !virtualSettings.enableColumn ? (
                            contentTable
                        ) : (
                            <>
                                <div ref={contentVirtualTableRef} className={CSS_VIRTUAL_TABLE} style={virtualWrapperStyle}>
                                    {contentTable}
                                </div>
                                <div className={CSS_VIRTUAL_TRACK} style={virtualTrackStyle} />
                            </>
                        )}
                    </div>
                    {virtualSettings.enableRow && virtualHeight > contentPanelRef.current?.clientHeight &&
                    <div ref={virtualContentRowScrollRef} style={{
                        overflowX: totalVirtualColumnWidth > contentPanelRef.current?.clientWidth ? 'scroll' : 'hidden',
                        width: virtualContentRowScrollRef.current?.offsetWidth || 16
                    }} className="sf-virtual-vertical-scrollbar" {...virtualRowScrollContentAttributes} tabIndex={-1}>
                        <div className="sf-virtual-vertical-track" style={{
                            height: virtualTrackStyle.height,
                            width: virtualContentRowScrollRef.current?.offsetWidth
                        }}></div>
                    </div>}
                    {virtualSettings.enableColumn && totalVirtualColumnWidth > contentPanelRef.current?.clientWidth &&
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
