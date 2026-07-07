import { forwardRef, ForwardRefExoticComponent, RefAttributes, useImperativeHandle, useRef, useMemo, memo, CSSProperties, RefObject, JSX, useState, useLayoutEffect, useCallback } from 'react';
import { HeaderTableBase } from './index';
import { ColumnProps, HeaderPanelRef, HeaderTableRef, IHeaderPanelBase } from '../types';
import { useGridComputedProvider, useGridMutableProvider } from '../contexts';
import { HelperEvent, isNullOrUndefined, SanitizeHtmlHelper, useDraggable, DragEvent } from '@syncfusion/react-base';
import { Chip, IChip } from '@syncfusion/react-buttons';

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
            const { filterSettings, gridLines, groupSettings, enableHtmlSanitizer, getColumnByUid } = useGridComputedProvider();
            const { offsetX, totalVirtualColumnWidth, virtualSettings, groupModule } = useGridMutableProvider();

            // Refs for DOM elements and child components
            const headerPanelRef: RefObject<HTMLDivElement> = useRef<HTMLDivElement>(null);
            const headerScrollRef: RefObject<HTMLDivElement> = useRef<HTMLDivElement>(null);
            const headerTableRef: RefObject<HeaderTableRef> = useRef<HeaderTableRef>(null);
            const headerVirtualTableRef: RefObject<HTMLDivElement> = useRef<HTMLDivElement>(null);
            const [columnClientWidth, setColumnClientWidth] = useState<number>(0);

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
            const headerRightBorder: string = !filterSettings?.enabled || (filterSettings.enabled && (gridLines === 'Vertical' || gridLines === 'None'))  ? ' sf-grid-header-border' : '';
            const virtualWrapperStyle: CSSProperties = useMemo(() => {
                return {
                    transform: `translate3d(${offsetX || 0}px, 0px, 0) translateZ(0)`,
                    // resizeSettings Auto based currently handled, columns occupied whitespaces, each columns render beyond configured widths.
                    ...(virtualSettings.enableColumn && totalVirtualColumnWidth > headerScrollRef.current?.clientWidth &&
                        totalVirtualColumnWidth > columnClientWidth ? { width: columnClientWidth } : {}),
                    zIndex: 1
                };
            }, [offsetX, headerScrollRef.current?.clientWidth, columnClientWidth, totalVirtualColumnWidth]);

            const virtualTrackStyle: CSSProperties = useMemo(() => ({
                position: 'relative',
                width: totalVirtualColumnWidth || undefined,
                zIndex: 0
            }), [totalVirtualColumnWidth, columnClientWidth]);

            useLayoutEffect(() => {
                setColumnClientWidth(headerTableRef.current?.columnClientWidth);
            }, [offsetX, headerTableRef.current?.columnClientWidth]);

            const [showClone, setShowClone] = useState(false);
            const cloneHelperRef: RefObject<HTMLElement> = useRef<HTMLElement | null>(null);
            const [mappingUid, setMappingUid] = useState('');
            const [dragGroupHeaderColumn, setDragGroupHeaderColumn] = useState<ColumnProps | null>(null);
            const [dragcloneText, setDragcloneText] = useState('');
            const helper: (args: HelperEvent) => HTMLElement | null = useCallback((args: HelperEvent): HTMLElement | null => {
                const target: HTMLElement | null = ((args.sender.target as HTMLElement).closest('.sf-grid-header-cell') as HTMLElement | null)?.closest('.sf-cell');
                if (!groupSettings?.enabled || isNullOrUndefined(target) || (!isNullOrUndefined(target)
                    && target.getElementsByClassName('.sf-checkselectall')?.length > 0)) {
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
                setShowClone(true);
                return cloneHelperRef.current;
            }, [groupSettings?.enabled, enableHtmlSanitizer, getColumnByUid]);

            const drag: (args: DragEvent) => void = useCallback((args: DragEvent): void => {
                const cloneHelper: HTMLElement | null = cloneHelperRef.current;
                const groupDropArea: HTMLElement | null = groupModule?.groupDropAreaRef?.current || null;

                if (!cloneHelper || dragGroupHeaderColumn?.allowGroup === false) {
                    return;
                }

                if (!args?.target?.closest('.sf-group-drop-area')) {
                    groupDropArea?.classList.remove('sf-group-drag-clone-hover');
                    cloneHelper.classList.add('sf-cursor-not-allowed');
                } else {
                    groupDropArea?.classList.add('sf-group-drag-clone-hover');
                    cloneHelper.classList.remove('sf-cursor-not-allowed');
                }
            }, [dragGroupHeaderColumn, groupModule]);

            const handleDragStop: (args?: DragEvent) => void = useCallback((args?: DragEvent): void => {
                setShowClone(false);
                const target: HTMLElement | null = args?.target?.closest('.sf-group-drop-area');
                const column: ColumnProps = dragGroupHeaderColumn;
                if (isNullOrUndefined(column) || column.allowGroup === false || isNullOrUndefined(target)) {
                    return;
                }
                groupModule?.groupDropAreaRef?.current?.classList.remove('sf-group-drag-clone-hover');
                groupModule?.groupColumn?.([column.field]);
            }, [dragGroupHeaderColumn, groupModule?.groupColumn]);

            /**
             * Memoized header table component to prevent unnecessary re-renders
             */
            const headerTable: JSX.Element = useMemo(() => (
                <HeaderTableBase
                    ref={headerTableRef}
                    className={`${CSS_HEADER_TABLE} ${headerTableFilter}`}
                    role="presentation"
                    style={DEFAULT_TABLE_STYLE}
                />
            ), [headerTableFilter]);

            const isGroupDropAreaEnabled: boolean = groupSettings?.enabled && groupSettings.showDropArea;

            // Initial drag load
            useDraggable(headerPanelRef, {
                dragTarget: isGroupDropAreaEnabled ? '.sf-grid-header-cell' : undefined,
                distance: isGroupDropAreaEnabled ? 5 : undefined,
                helper: isGroupDropAreaEnabled ? helper : undefined,
                clone: isGroupDropAreaEnabled ? true : undefined,
                onDrag: isGroupDropAreaEnabled ? drag : undefined,
                onDragStop: isGroupDropAreaEnabled ? handleDragStop : undefined,
                isReplaceDragEle: isGroupDropAreaEnabled ? true : undefined
            });

            /**
             * Memoized header table component to prevent unnecessary re-renders
             */
            const dragClone: JSX.Element = useMemo(() => {
                if (!groupSettings?.enabled || !groupSettings?.showDropArea || !dragcloneText) {
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
                        className={'sf-groupable-header-clone' + (column?.allowGroup === false ?
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
                    {groupSettings?.enabled && groupSettings.showDropArea && showClone && dragClone}
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
