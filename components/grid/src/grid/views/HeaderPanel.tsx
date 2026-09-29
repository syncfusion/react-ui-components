import { forwardRef, ForwardRefExoticComponent, RefAttributes, useImperativeHandle, useRef, useMemo, memo, CSSProperties, RefObject, JSX, useState, useLayoutEffect, useCallback, ReactElement } from 'react';
import { HeaderTableBase } from './HeaderTable';
import { ColumnProps } from '../types/column.interfaces';
import { HeaderPanelRef, HeaderTableRef, IHeaderPanelBase } from '../types/interfaces';
import { useGridComputedProvider, useGridMutableProvider } from '../contexts/GridProviders';
import { HelperEvent, useDraggable, DragEvent } from '@syncfusion/react-base/src/draggable';
import { isNullOrUndefined } from '@syncfusion/react-base/src/util';
import { SanitizeHtmlHelper } from '@syncfusion/react-base/src/sanitize-helper';
import { Chip, IChip } from '@syncfusion/react-buttons/src/chip/chip';
import { getAllFields, getNonContinuousLeftPinnedWidth } from '../utils/utils';
import { flushSync } from 'react-dom';

// CSS class constants following enterprise naming convention
const CSS_HEADER_TABLE: string = 'sf-grid-table';
const CSS_VIRTUAL_TABLE: string = 'sf-virtual-table';
const CSS_VIRTUAL_TRACK: string = 'sf-virtual-track';

/**
 * Default styles for header table to ensure consistent rendering
 *
 * @type {CSSProperties}
 */
const DEFAULT_TABLE_STYLE: CSSProperties = {
    borderCollapse: 'separate',
    borderSpacing: '0.25px'
};

/**
 * HeaderPanelBase component renders the static area for the grid header.
 * This component wraps the HeaderTableBase in a scrollable container and
 * is responsible for organizing the header rows and synchronizing scrolling behavior.
 *
 * @component
 * @private
 * @param {Partial<IHeaderPanelBase>} props - Component properties
 * @param {object} props.panelAttributes - Attributes to apply to the header panel container
 * @param {object} props.scrollContentAttributes - Attributes to apply to the scrollable content container
 * @param {RefObject<HeaderPanelRef>} ref - Forwarded ref to expose internal elements
 * @returns {JSX.Element} The rendered header container with scrollable table
 */
const HeaderPanelBase: ForwardRefExoticComponent<Partial<IHeaderPanelBase> & RefAttributes<HeaderPanelRef>> =
    memo(forwardRef<HeaderPanelRef, Partial<IHeaderPanelBase>>(
        (props: Partial<IHeaderPanelBase>, ref: RefObject<HeaderPanelRef>) => {
            const { panelAttributes, scrollContentAttributes } = props;
            const { filterSettings, gridLines, groupSettings, enableHtmlSanitizer, isStackedHeader,
                getColumnByUid, resizeSettings, element, scrollModule, getVisibleColumns } = useGridComputedProvider();
            const { offsetX, totalVirtualColumnWidth, virtualSettings, groupModule, reorderModule, leftPinnedColumns,
                uidOrderMap } = useGridMutableProvider();

            // Refs for DOM elements and child components
            const headerPanelRef: RefObject<HTMLDivElement> = useRef<HTMLDivElement>(null);
            const headerScrollRef: RefObject<HTMLDivElement> = useRef<HTMLDivElement>(null);
            const headerTableRef: RefObject<HeaderTableRef> = useRef<HeaderTableRef>(null);
            const headerVirtualTableRef: RefObject<HTMLDivElement> = useRef<HTMLDivElement>(null);
            const [columnClientWidth, setColumnClientWidth] = useState<number>(0);
            const nonContinuousLeftPinnedWidth: number = useMemo(() => scrollModule?.virtualColumnInfo?.endIndex <
                getVisibleColumns?.()?.length ? getNonContinuousLeftPinnedWidth(leftPinnedColumns, uidOrderMap) :
                0, [leftPinnedColumns, uidOrderMap]);
            const scrollableVirtualColumnWidth: number = Math.max(0, totalVirtualColumnWidth - nonContinuousLeftPinnedWidth);

            /**
             * Expose internal elements and methods through the forwarded ref
             * Only define properties specific to HeaderPanel and forward HeaderTable properties
             */
            useImperativeHandle(ref, () => ({
                // HeaderPanel specific properties
                headerPanelRef: headerPanelRef.current,
                headerScrollRef: headerScrollRef.current,

                // Forward all properties from HeaderTable
                ...(headerTableRef.current),
                columnClientWidth: columnClientWidth
            }), [headerPanelRef.current, headerScrollRef.current, headerTableRef.current, columnClientWidth]);

            const headerTableFilter: string = filterSettings?.enabled && gridLines === 'Default' ? 'sf-filter-bar-table' : '';
            const resizeTable: string = resizeSettings?.enabled ? 'sf-grid-resize-table' : '';
            const headerRightBorder: string = !filterSettings?.enabled || (filterSettings.enabled && (gridLines === 'Vertical' || gridLines === 'None'))  ? ' sf-grid-header-border' : '';
            const virtualWrapperStyle: CSSProperties = useMemo(() => {
                return {
                    transform: `translate3d(${(offsetX || 0) - (scrollModule?.leftPinnedWidth ?? 0)}px, 0px, 0) translateZ(0)`,
                    // resizeSettings Auto based currently handled, columns occupied whitespaces, each columns render beyond configured widths.
                    ...(virtualSettings.enableColumn && totalVirtualColumnWidth > headerScrollRef.current?.getBoundingClientRect().width &&
                        totalVirtualColumnWidth > columnClientWidth ? { width: columnClientWidth } : {}),
                    zIndex: 1
                };
            }, [offsetX, scrollModule?.leftPinnedWidth, headerScrollRef.current?.clientWidth, columnClientWidth, totalVirtualColumnWidth]);

            const virtualTrackStyle: CSSProperties = useMemo(() => ({
                position: 'relative',
                width: scrollableVirtualColumnWidth || undefined,
                zIndex: 0
            }), [scrollableVirtualColumnWidth, columnClientWidth]);

            useLayoutEffect(() => {
                setColumnClientWidth(headerTableRef.current?.columnClientWidth);
            }, [offsetX, headerTableRef.current?.columnClientWidth]);

            const [showClone, setShowClone] = useState(false);
            const cloneHelperRef: RefObject<HTMLElement> = useRef<HTMLElement | null>(null);
            const [mappingUid, setMappingUid] = useState('');
            const [dragGroupHeaderColumn, setDragGroupHeaderColumn] = useState<ColumnProps | null>(null);
            const [dragcloneText, setDragcloneText] = useState('');
            const helper: (args: HelperEvent) => HTMLElement | null = useCallback((args: HelperEvent): HTMLElement | null => {
                const target: HTMLElement | null = ((args.sender.target as HTMLElement).closest('.sf-grid-header-cell') as HTMLElement | null)?.closest('.sf-cell')
                    ?? ((args.sender.target as HTMLElement).classList.contains('sf-cell') ? (args.sender.target as HTMLElement) : null);
                if (isNullOrUndefined(target) || (!isNullOrUndefined(target)
                    && target.getElementsByClassName('.sf-checkselectall')?.length > 0)
                    || element.querySelector('.sf-grid-resize-helper')) {
                    return null;
                }
                const headercelldiv: HTMLElement | null = target.querySelector('.sf-grid-header-cell');
                if (!headercelldiv) {
                    return null;
                }

                const mappingUidValue: string | null = headercelldiv.getAttribute('data-mappinguid');
                if (!mappingUidValue) {
                    return null;
                }
                setMappingUid(mappingUidValue);
                setDragGroupHeaderColumn(getColumnByUid?.(mappingUidValue));
                const cloneInnerText: string | undefined = (headercelldiv.querySelector('.sf-grid-header-text') as HTMLElement | null)?.innerText;
                if (!cloneInnerText) {
                    return cloneHelperRef.current;
                }
                setDragcloneText(enableHtmlSanitizer ? SanitizeHtmlHelper.sanitize(cloneInnerText) : cloneInnerText);
                flushSync(() => {
                    setShowClone(true);
                });
                return cloneHelperRef.current;
            }, [groupSettings?.enabled, enableHtmlSanitizer, getColumnByUid]);

            const drag: (args: DragEvent) => void = useCallback((args: DragEvent): void => {
                const cloneHelper: HTMLElement | null = cloneHelperRef.current;
                const groupDropArea: HTMLElement | null = groupModule?.groupDropAreaRef?.current || null;

                if (reorderModule?.reorderSettings?.enabled) {
                    reorderModule.reorderState.current.target = args?.target as HTMLElement;
                }

                if (!cloneHelper) {
                    return;
                }

                const dropArea: boolean = !isNullOrUndefined(args?.target?.closest('.sf-group-drop-area'));
                const reorderHeader: boolean = reorderModule?.reorderSettings?.enabled
                    && !isNullOrUndefined(args?.target?.closest('.sf-grid-header-row'))
                    && !isNullOrUndefined(reorderModule.reorderState.current.column);

                if (dropArea) {
                    groupDropArea?.classList.add('sf-group-drag-clone-hover');
                } else {
                    groupDropArea?.classList.remove('sf-group-drag-clone-hover');
                }

                if (dropArea || reorderHeader) {
                    cloneHelper.classList.remove('sf-cursor-not-allowed');
                } else {
                    cloneHelper.classList.add('sf-cursor-not-allowed');
                }
            }, [dragGroupHeaderColumn, groupModule, reorderModule]);

            const stackedGroupFields: string[] = useMemo(() => {
                const columns: (ColumnProps<unknown> | ReactElement)[] = dragGroupHeaderColumn?.children as ColumnProps[] ||
                    dragGroupHeaderColumn?.columns;
                return isStackedHeader && columns ? getAllFields(columns) || [] : [];
            }, [isStackedHeader, dragGroupHeaderColumn?.columns, dragGroupHeaderColumn?.children]);

            const handleDragStop: (args?: DragEvent) => void = useCallback((args?: DragEvent): void => {
                setShowClone(false);
                const target: HTMLElement | null = args?.target?.closest('.sf-group-drop-area');
                const column: ColumnProps = dragGroupHeaderColumn;
                if (isNullOrUndefined(column) || isNullOrUndefined(target) || column.allowGroup === false) {
                    return;
                }
                groupModule?.groupDropAreaRef?.current?.classList.remove('sf-group-drag-clone-hover');
                groupModule?.groupColumn?.(stackedGroupFields.length ? stackedGroupFields : [column.field]);
            }, [dragGroupHeaderColumn, groupModule?.groupColumn, stackedGroupFields]);

            /**
             * Memoized header table component to prevent unnecessary re-renders
             */
            const headerTable: JSX.Element = useMemo(() => (
                <HeaderTableBase
                    ref={headerTableRef}
                    className={`${CSS_HEADER_TABLE} ${headerTableFilter} ${resizeTable}`}
                    role="presentation"
                    style={DEFAULT_TABLE_STYLE}
                />
            ), [headerTableFilter, resizeTable]);

            const isGroupDropAreaEnabled: boolean = groupModule && groupSettings?.enabled && groupSettings.showDropArea;
            const isColumnReorderEnabled: boolean = reorderModule?.reorderSettings?.enabled;

            // Initial drag load
            useDraggable(headerPanelRef, {
                dragTarget: isGroupDropAreaEnabled || isColumnReorderEnabled ? '.sf-grid-header-cell' : undefined,
                distance: isGroupDropAreaEnabled || isColumnReorderEnabled ? 5 : undefined,
                helper: isGroupDropAreaEnabled || isColumnReorderEnabled ? helper : undefined,
                clone: isGroupDropAreaEnabled || isColumnReorderEnabled ? true : undefined,
                onDrag: isGroupDropAreaEnabled || isColumnReorderEnabled ? drag : undefined,
                onDragStop: isGroupDropAreaEnabled || isColumnReorderEnabled ? handleDragStop : undefined,
                isReplaceDragEle: isGroupDropAreaEnabled || isColumnReorderEnabled ? true : undefined,
                dragArea: headerScrollRef.current,
                enableTailMode: isGroupDropAreaEnabled || isColumnReorderEnabled ? true : undefined,
                cursorAt: { left: 20, top: 10 }
            });

            /**
             * Memoized header table component to prevent unnecessary re-renders
             */
            const dragClone: JSX.Element = useMemo(() => {
                if (!dragcloneText) {
                    return null;
                }
                const column: ColumnProps = getColumnByUid?.(mappingUid);
                if (isNullOrUndefined(column)) {
                    return null;
                }
                return (
                    <Chip
                        ref={(chipRef: IChip) => {
                            cloneHelperRef.current = chipRef?.element;
                        }}
                        className={'sf-groupable-header-clone sf-header-cell-clone' + (column?.allowGroup === false ?
                            ' sf-cursor-not-allowed' : '')}
                        data-mappinguid={mappingUid}
                    >
                        {dragcloneText}
                    </Chip>
                ); }, [mappingUid, dragcloneText]);

            return (
                <div
                    ref={headerPanelRef}
                    {...panelAttributes}
                >
                    <div
                        ref={headerScrollRef}
                        {...scrollContentAttributes}
                        className={scrollContentAttributes.className + headerRightBorder}
                    >
                        { !virtualSettings.enableRow && !virtualSettings.enableColumn ? (
                            headerTable
                        ) : (
                            <>
                                <div ref={headerVirtualTableRef} className={CSS_VIRTUAL_TABLE} style={virtualWrapperStyle}>
                                    {headerTable}
                                </div>
                                <div className={CSS_VIRTUAL_TRACK} style={virtualTrackStyle} />
                            </>
                        )}
                    </div>
                    {(isGroupDropAreaEnabled || isColumnReorderEnabled) && showClone && dragClone}
                </div>
            );
        }
    ), (prevProps: Partial<IHeaderPanelBase>, nextProps: Partial<IHeaderPanelBase>) => {
        // Custom comparison function for memo to prevent unnecessary re-renders
        // Only re-render if styles have changed
        const prevStyle: CSSProperties = prevProps.panelAttributes?.style;
        const nextStyle: CSSProperties = nextProps.panelAttributes?.style;
        const prevScrollStyle: CSSProperties = prevProps.scrollContentAttributes?.style;
        const nextScrollStyle: CSSProperties = nextProps.scrollContentAttributes?.style;

        // Deep comparison of style objects
        const stylesEqual: boolean =
            JSON.stringify(prevStyle) === JSON.stringify(nextStyle) &&
            JSON.stringify(prevScrollStyle) === JSON.stringify(nextScrollStyle);

        return stylesEqual;
    });

/**
 * Set display name for debugging purposes
 */
HeaderPanelBase.displayName = 'HeaderPanelBase';

/**
 * Export the HeaderPanelBase component for direct usage if needed
 *
 * @private
 */
export { HeaderPanelBase };
