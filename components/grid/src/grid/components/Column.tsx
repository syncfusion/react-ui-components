import {
    useEffect,
    useRef,
    useState,
    useMemo,
    useCallback,
    useContext,
    memo,
    JSX,
    RefObject,
    MemoExoticComponent,
    ReactElement,
    ReactNode
} from 'react';
import { buildColumnGroupFieldRequiredMessage } from '../constants/warnings';
import {
    CellType,
    CellTypes,
    ColumnType,
    SelectionMode,
    WrapMode,
    ActionType,
    ThemeDefaults,
    Theme,
    GroupType,
    ScrollMode
} from '../types/enum';
import { RowSelectableParams } from '../types/selection.interfaces';
import {
    FilterPredicates,
    FilterDialogBeforeOpenEvent,
    ExcelFilterArgs
} from '../types/filter.interfaces';
import { GridRef, IGrid } from '../types/grid.interfaces';
import { SortDescriptor } from '../types/sort.interfaces';
import { MutableGridSetter, UseDataResult } from '../types/interfaces';
import {
    useGridComputedProvider,
    useGridMutableProvider
} from '../contexts/GridProviders';
import { useColumn } from '../hooks/useColumn';
import { IL10n } from '@syncfusion/react-base/src/l10n';
import { isNullOrUndefined } from '@syncfusion/react-base/src/util';
import { SanitizeHtmlHelper } from '@syncfusion/react-base/src/sanitize-helper';
import { Checkbox, CheckboxChangeEvent } from '@syncfusion/react-buttons/src/check-box/index';
import { ArrowUpIcon } from '@syncfusion/react-icons/src/icons/arrow-up';
import { ArrowDownIcon } from '@syncfusion/react-icons/src/icons/arrow-down';
import { FilterIcon } from '@syncfusion/react-icons/src/icons/filter';
import { FilterActiveIcon } from '@syncfusion/react-icons/src/icons/filter-active';
import { ChevronDownIcon } from '@syncfusion/react-icons/src/icons/chevron-down';
import { ChevronRightIcon } from '@syncfusion/react-icons/src/icons/chevron-right';
import { ChevronUpIcon } from '@syncfusion/react-icons/src/icons/chevron-up';
import { PinIcon } from '@syncfusion/react-icons/src/icons/pin';
import { UnpinIcon } from '@syncfusion/react-icons/src/icons/unpin';
import { ColumnProps, IColumnBase, ColumnRef, CellClassProps } from '../types/column.interfaces';
import { DataManager, DataResult } from '@syncfusion/react-data';
import { refreshFilteredColsUid, isColumnsChild, isRowPinningEnabled, getWithoutSpecialColumns } from '../utils/utils';
import { DragAndDropIcon } from '@syncfusion/react-icons/src/icons/drag-and-drop';
import ColumnMenu from './ColumnMenu';
import { PivotColumnMenuContext } from '../contexts/PivotColumnMenuContext';
import { ChevronLeftIcon, MoreVerticalFilledIcon } from '@syncfusion/react-icons';
import { TreeGridRow } from '../types/treeData.interfaces';
import type { PivotColumnMenuHostProps } from '../contexts/PivotColumnMenuContext';
import type { FocusEvent, PointerEvent, MouseEvent as ReactMouseEvent } from 'react';

// Event dispatched on the grid root when a header-originated filter dialog opens
const HEADER_FILTER_OPEN_EVENT: string = 'sf-header-filter-open';

// CSS class constants following enterprise naming convention
const CSS_HEADER_CELL_DIV: string = 'sf-grid-header-cell';
const CSS_HEADER_TEXT: string = 'sf-grid-header-text';
const CSS_SORT_ICON: string = 'sf-grid-sort-container sf-icons';
const CSS_FILTER_ICON: string = 'sf-grid-filter-container sf-icons';
const CSS_SORT_NUMBER: string = 'sf-grid-sort-order';
const CSS_DESCENDING_SORT: string = 'sf-descending sf-icon-descending';
const CSS_ASENDING_SORT: string = 'sf-ascending sf-icon-ascending';
const CSS_GROUP_ASENDING_DESCENDING_SORT: string = 'sf-ascending-descending sf-icon-ascending-descending';
const CSS_COMMAND_CELL: string = 'sf-grid-command-cell';
const CSS_FIXED_HEIGHT_TEMPLATE_CELL: string = 'sf-templatecell';
const CSS_FIXED_HEIGHT_TEMPLATE_WRAPPER: string = 'fixed-height-wrapper';
const CSS_DETAIL_TOGGLE_ICON: string = 'sf-detail-toggle-icon';
const CSS_GROUP_EXPAND_BTN: string = 'sf-group-togglebtn';
const CSS_ROW_DRAG_CELL: string = 'sf-row-drag-cell';
const CSS_HEADER_ROW_DRAG_CELL: string = 'sf-header-row-drag-cell';
const CSS_ROW_DRAG_HANDLE: string = 'sf-row-drag-handle';
const CSS_ROWNUMBER: string = 'sf-row-number';
const CSS_RESIZE_HANDLER: string = 'sf-resize-handler';

/**
 * ColumnBase component renders a table cell (th or td) with appropriate content
 *
 * @component
 * @private
 * @param {IColumnBase} props - Component properties
 * @param {RefObject<ColumnRef>} ref - Forwarded ref to expose internal elements
 * @returns {JSX.Element} The rendered table cell (th or td)
 */
const ColumnBase: <T>(props: Partial<IColumnBase<T>>) => JSX.Element = memo(<T, >(props: Partial<IColumnBase<T>>) => {
    const grid: Partial<IGrid<T>> & Partial<MutableGridSetter<T>> = useGridComputedProvider<T>();
    const { onHeaderCellRender, onCellRender, onAggregateCellRender, enableHtmlSanitizer, getColumnByField, getVisibleColumns,
        isMasterDetail, isTreeMode, textWrapSettings, clipMode, serviceLocator, selectionSettings, theme, groupSettings,
        virtualizationSettings, pageSettings, pinningSettings } = grid;
    const { isInitialBeforePaint, cssClass, evaluateTooltipStatus, isInitialLoad, currentViewData, commandColumnModule,
        selectionModule, getParentElement, filterModule, expansionState, groupCaptionAggregateType,
        resizeModule, disableResizeObserver, editModule, formulaModule, contextMenuModule,
        treeModule, treeDataSettings } = useGridMutableProvider<T>();
    const pivotColumnMenu: (props: PivotColumnMenuHostProps) => ReactElement = useContext(PivotColumnMenuContext);
    const localization: IL10n = serviceLocator?.getService<IL10n>('localization');
    const filterType: boolean = grid.filterSettings?.type === 'Excel' || grid.filterSettings?.type === 'CheckBox' || grid.filterSettings?.type === 'Menu';

    // Get column-specific APIs and properties
    const { gridAPI, gridInternal } = useColumn<T>(props);

    const {
        cellType,
        visibleClass,
        alignHeaderClass,
        alignClass,
        formattedValue,
        isMaskCell
    } = gridInternal;

    const { ...column } = gridAPI;
    const containerPinBucket: 'top' | 'bottom' | undefined = props.containerPinBucket;

    const filterColumn: FilterPredicates[] = grid.filterSettings?.columns?.filter((col: FilterPredicates) => {
        return column.field === col.field;
    });

    const {
        index,
        field,
        headerText,
        allowFilter,
        disableHtmlEncode,
        allowSort,
        allowGroup,
        customAttributes,
        cellClass
    } = column;
    const aggregateCellClass: string | ((props?: CellClassProps<T>) => string) = props?.cell?.aggregateColumn?.cellClass;
    const formulaReferenceLabel: string = useMemo(() => {
        if (!formulaModule || !editModule?.isEdit || grid.editSettings?.mode !== 'Cell' || !column?.field) {
            return '';
        }
        return formulaModule.getDisplayReference(column as ColumnProps<T>, 0).replace(/\d+$/, '');
    }, [formulaModule, editModule?.isEdit, grid.editSettings?.mode, column?.field, column?.uid]);

    // Create ref for the cell element
    const cellRef: RefObject<ColumnRef> = useRef<ColumnRef>({
        cellRef: useRef<HTMLTableCellElement>(null)
    });

    // Validate allowGroup property - warn if field is undefined but grouping is enabled
    useEffect(() => {
        if (column?.allowGroup && !column?.field && grid.enableDevMode) {
            console.warn(
                buildColumnGroupFieldRequiredMessage(column?.headerText)
            );
        }
    }, [column?.allowGroup, column?.field, column?.headerText]);

    // Filter dialog open/close state and handlers
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    // Column menu state and positioning for a simple per-column menu (Sort / Clear / Columns...)
    const [showColumnMenu, setShowColumnMenu] = useState(false);
    const menuButtonRef: RefObject<HTMLElement> = useRef<HTMLElement>(null);
    const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);

    const openFilterDialog: () => void = useCallback(() : void => {
        // prevent header click/sort and focus side-effects
        if (filterType && disableResizeObserver) {
            disableResizeObserver.current = true;
        }
        grid.element?.dispatchEvent(new CustomEvent<{ columnKey: string }>(
            HEADER_FILTER_OPEN_EVENT,
            { detail: { columnKey: column.field || column.uid || '' } }
        ));
        setIsFilterOpen(true);
    }, [column.field, column.uid, disableResizeObserver, filterType, grid.element]);

    const closeFilterDialog: () => void = useCallback(() : void => {
        if (filterType && disableResizeObserver) {
            disableResizeObserver.current = false;
        }
        setIsFilterOpen(false);
    }, [filterType, disableResizeObserver]);


    const closeColumnMenu: () => void = useCallback((): void => {
        setShowColumnMenu(false);
        setMenuPosition(null);
    }, []);

    const toggleColumnMenu: (e: React.MouseEvent<HTMLElement>) => void = useCallback((e: React.MouseEvent<HTMLElement>) => {
        const btn: HTMLElement | null = menuButtonRef.current as HTMLElement | null;
        if (!btn) { return; }
        const rect: DOMRect = (btn as HTMLElement).getBoundingClientRect();
        setMenuPosition({ top: rect.bottom, left: rect.left });
        setShowColumnMenu((s: boolean): boolean => !s);
        e.stopPropagation();
        e.preventDefault();
    }, []);

    /**
     * Handle filter icon keyboard interaction (Enter or Space)
     */
    type FilterKeyHandler = (e: React.KeyboardEvent<HTMLSpanElement>) => void;
    const handleFilterIconKeyDown: FilterKeyHandler = useCallback((e: React.KeyboardEvent<HTMLSpanElement>): void => {
        if ((e as React.KeyboardEvent<HTMLInputElement>).key === 'Enter' || (e as React.KeyboardEvent<HTMLInputElement>).key === ' ') {
            openFilterDialog();
        }
    }, [openFilterDialog]);

    const updateFilterModel: (cell: React.RefObject<HTMLElement>) => ExcelFilterArgs = (
        cell: React.RefObject<HTMLElement>): ExcelFilterArgs => {
        let dataSource: DataManager | DataResult | T[] = isTreeMode ? new DataManager(treeModule?.normalizedData) : grid.dataSource;
        if ((grid?.getDataModule?.() as UseDataResult)?.isRemote() && (virtualizationSettings?.scrollMode === ScrollMode.Virtual ||
            virtualizationSettings?.scrollMode === ScrollMode.Infinite || pageSettings?.enabled) && virtualizationSettings?.enableCache) {
            dataSource = new DataManager({ ...(isTreeMode ? (dataSource as DataManager) : grid?.dataSource as DataManager)?.dataSource,
                enableCache: false }, (dataSource as DataManager)?.defaultQuery, (dataSource as DataManager)?.adaptor);
        }
        const gridDataManager: DataManager = dataSource instanceof DataManager ? dataSource :
            new DataManager(isTreeMode ? treeModule?.normalizedData : grid?.dataSource as DataManager);
        const columnsDetails: ColumnProps[] = grid.isStackedHeader ? grid.stackedFlattedColumnProps : grid.getColumns();
        const updateColumn: ColumnProps = columnsDetails.find((col: ColumnProps) => col.field === column.field);
        const resolvedFilterType: string = updateColumn?.type ?? column?.type ?? 'string';
        if (grid.filterSettings?.columns.length) {
            refreshFilteredColsUid(grid as GridRef<T>, grid.filterSettings?.columns);
        }
        const option: ExcelFilterArgs = {
            filterType: updateColumn.filter.type ?? grid.filterSettings.type, type: resolvedFilterType, field: updateColumn.field,
            column: updateColumn, dataSource: dataSource, format: updateColumn.format, height: 800, columns: columnsDetails,
            filteredColumns: grid.filterSettings?.columns, target: cell.current, dataManager: gridDataManager,
            isRemote: (grid.getDataModule() as UseDataResult)?.isRemote(),
            parentCurrentViewDataCount: currentViewData.length, parentElement: getParentElement(),
            cssClass: cssClass, handler: filterModule?.filterHandler, query: grid.query?.clone(),
            serviceLocator: grid.serviceLocator,
            id: grid.id, loadingIndicator: grid.filterSettings?.loadingIndicator,
            operators: filterModule?.customOperators?.[`${resolvedFilterType}Operator`] ??
                filterModule?.customOperators?.stringOperator ?? [],
            ignoreAccent: grid.filterSettings?.ignoreAccent,
            caseSensitive: grid.filterSettings?.caseSensitive,
            enableSort: grid.sortSettings?.enabled,
            disableSearchOption: updateColumn.filter.hideSearchbox,
            disableSortOption: false,
            isCustomDataSource: false,
            formatFn: updateColumn.formatFn,
            enableHtmlSanitizer : enableHtmlSanitizer,
            mode: grid.filterSettings?.mode,
            immediateModeDelay: grid.filterSettings?.immediateModeDelay
        };
        const args: FilterDialogBeforeOpenEvent = {
            cancel: false, requestType: ActionType.FilterDialogBeforeOpen, columnType: option.type,
            columnName: updateColumn.field, action: ActionType.FilterDialogBeforeOpen, options: option
        };
        args.type = ActionType.FilterDialogBeforeOpen;
        grid.onFilterDialogBeforeOpen?.(args);
        if (args.cancel) {
            closeFilterDialog();
        }
        if (option.dataSource !== dataSource) {
            option.isCustomDataSource = true;
        }
        return option;
    };

    /**
     * Handle header cell info event
     */
    const handleHeaderCellInfo: Function = useCallback(() => {
        if (onHeaderCellRender && cellRef.current?.cellRef.current) {
            onHeaderCellRender({
                node: cellRef.current.cellRef.current,
                cell: props.cell,
                column: column
            });
        }
    }, []);

    /**
     * Handle aggregate cell info event
     */
    const handleAggregateCellInfo: Function = useCallback(() => {
        if (onAggregateCellRender && cellRef.current?.cellRef.current) {
            onAggregateCellRender({
                data: props.row.data as T,
                cell: cellRef.current.cellRef.current,
                column: props.cell.aggregateColumn
            });
        }
    }, []);

    /**
     * Handle query cell info event
     */
    const handleQueryCellInfo: Function = useCallback(() => {
        if (onCellRender && cellRef.current?.cellRef.current) {
            onCellRender({
                cell: cellRef.current.cellRef.current,
                column: column,
                data: props.row.data as T,
                colSpan: props.cell.colSpan,
                rowSpan: props.cell.rowSpan
            });
        }
    }, []);

    useEffect(() => {
        if (column.clipMode === 'Clip' || (!column.clipMode && clipMode === 'Clip')) {
            if (cellRef.current?.cellRef.current?.classList?.contains?.('sf-ellipsistooltip')) {
                cellRef.current?.cellRef.current?.classList?.remove?.('sf-ellipsistooltip');
            }
            cellRef.current?.cellRef.current?.classList?.add?.('sf-clip');
        } else if (column.clipMode === 'EllipsisWithTooltip' || (!column.clipMode && clipMode === 'EllipsisWithTooltip')
            && !(textWrapSettings?.enabled && (textWrapSettings.wrapMode === WrapMode.Content
            || textWrapSettings.wrapMode === 'Both'))) {
            if (column.type !== 'checkbox' && evaluateTooltipStatus(cellRef.current?.cellRef.current)) {
                if (cellRef.current?.cellRef.current?.classList?.contains?.('sf-clip')) {
                    cellRef.current?.cellRef.current?.classList?.remove?.('sf-clip');
                }
                cellRef.current?.cellRef.current?.classList?.add?.('sf-ellipsistooltip');
            }
        }
    }, [column.clipMode, clipMode, props.row?.isSelected]);

    /**
     * Trigger appropriate cell info events based on cell type
     */
    useEffect(() => {
        if (isInitialBeforePaint.current) { return; }
        if (cellType === CellTypes.Header) {
            handleHeaderCellInfo();
        } else if (cellType === CellTypes.Summary) {
            handleAggregateCellInfo();
        } else if (column?.uid !== 'empty-cell-uid') {
            handleQueryCellInfo();
        }
    }, [formattedValue, handleHeaderCellInfo, handleQueryCellInfo, handleAggregateCellInfo, isInitialBeforePaint.current]);

    useEffect(() => {
        if (isInitialBeforePaint.current) { return; }
        if (!isInitialLoad && column?.uid === 'empty-cell-uid') {
            handleQueryCellInfo();
        }
    }, [formattedValue, isInitialLoad, handleQueryCellInfo, isInitialBeforePaint.current]);

    const headerSortProperties: { index: number, className: string, direction: string } = useMemo(() => {
        if (cellType !== CellTypes.Header) { return null; }
        const sortedColumn: SortDescriptor[] = grid.sortSettings?.columns;
        let index: number | null = null;
        let cssSortClassName: string = '';
        let direction: string = 'none';
        for (let i: number = 0, len: number = sortedColumn?.length; i < len; i++) {
            const sortedColumnField: string | undefined = sortedColumn?.[parseInt(i.toString(), 10)].field;
            const isGroupColumn: boolean = column?.type === ColumnType.SingleGroup &&
                grid.groupSettings?.columns?.indexOf(sortedColumnField) >= 0;
            const isColumnMatch: boolean = column.field === sortedColumnField || isGroupColumn;
            if (isColumnMatch) {
                index = sortedColumn?.length > 1 && column?.type !== ColumnType.SingleGroup ? i + 1 : null;
                const tempDirection: string = direction;
                direction = sortedColumn?.[parseInt(i.toString(), 10)].direction;
                if (column?.type === ColumnType.SingleGroup && tempDirection !== 'none' && (direction !== tempDirection || direction === 'Both')) {
                    direction = 'Both';
                    index = null;
                }
                cssSortClassName = direction === 'Both' ? CSS_GROUP_ASENDING_DESCENDING_SORT : (sortedColumn?.[parseInt(i.toString(), 10)].direction === 'Ascending' ? CSS_ASENDING_SORT :
                    sortedColumn?.[parseInt(i.toString(), 10)].direction === 'Descending' ? CSS_DESCENDING_SORT : '');
            }
        }
        return { index: index, className: cssSortClassName, direction: direction };
    }, [grid.sortSettings]);

    /**
     * Method to sanitize any suspected untrusted strings and scripts before rendering them.
     *
     * @param {string} value - Specifies the html value to sanitize
     * @returns {string} Returns the sanitized html string
     */

    const sanitizeContent: (value: string) => string | JSX.Element = useCallback((value: string): string | JSX.Element => {
        let sanitizedValue: string;
        if (enableHtmlSanitizer) {
            sanitizedValue =  SanitizeHtmlHelper.sanitize(value);
        } else {
            sanitizedValue = value;
        }
        if (cellType === CellTypes.Data && getColumnByField?.(column.field)?.type === ColumnType.Boolean && column.displayAsCheckBox) {
            const checked: boolean = isNaN(parseInt(sanitizedValue?.toString(), 10)) ? sanitizedValue === 'true' :
                parseInt(sanitizedValue.toString(), 10) > 0;
            return <Checkbox checked={checked} disabled={true} className={cssClass}/>;
        } else {
            return sanitizedValue;
        }
    }, [getColumnByField]);

    const rowCheckBoxOnChange: (event: CheckboxChangeEvent) => void = useCallback((event: CheckboxChangeEvent) : void => {
        if (!selectionModule || props.row?.rowIndex === undefined) { return; }
        if (event?.value) {
            selectionModule.selectRow(props.row?.rowIndex);
        } else {
            selectionModule.clearRowSelection([props.row?.rowIndex]);
        }
    }, [props.row?.rowIndex, selectionModule]);

    const onPinCellClick: (event: React.MouseEvent<HTMLAnchorElement>) => void =
        useCallback((event: React.MouseEvent<HTMLAnchorElement>): void => {
            event.preventDefault();
            event.stopPropagation();
            contextMenuModule?.contextMenuRef.current?.showContextMenu?.({
                target: event.currentTarget,
                top: event.clientY,
                left: event.clientX,
                items: ['UnpinRow', 'PinToTop', 'PinToBottom']
            });
        }, [contextMenuModule?.contextMenuRef]);

    /**
     * Memoized resize handler element rendered on resizable header cells.
     */
    const resizeHandlerElement: JSX.Element | null = useMemo(() => {
        if (!resizeModule?.resizeSettings?.enabled || column.type === 'checkbox' || column.type === 'command' || !column.allowResize) {
            return null;
        }
        return (<div className={CSS_RESIZE_HANDLER} />);
    }, [resizeModule?.resizeSettings?.enabled, column.type, column.allowResize]);

    /**
     * Memoized header cell content
     */
    const headerCellContent: JSX.Element | null = useMemo(() => {
        if (cellType !== CellTypes.Header) { return null; }

        // Extract existing className from customAttributes to avoid duplication
        const existingClassName: string = customAttributes.className;

        // Create array of unique class names to avoid duplicates
        const classNames: string[] = props.cell.className.split(' ');

        // Add existing classes from customAttributes (includes cell type classes from Row.tsx)
        if (!isNullOrUndefined(existingClassName)) {
            classNames.push(...existingClassName.split(' ').filter((cls: string) => cls.trim()));
        }
        if (column?.type === ColumnType.RowNumber) {
            classNames.push(CSS_ROWNUMBER);
        }
        if (column?.type === ColumnType.RowDragAndDrop) {
            classNames.push(CSS_HEADER_ROW_DRAG_CELL);
        }

        // Add alignment class if not already present
        classNames.push(alignHeaderClass);

        // Add custom header cell class.
        classNames.push(!isNullOrUndefined(cellClass) ? (typeof cellClass === 'function' ?
            cellClass({rowIndex: props.row.rowIndex, column, cellType: CellType.Header}) : cellClass) : '');
        classNames.push(!isNullOrUndefined(props.cell.column.headerTemplate) ? CSS_FIXED_HEIGHT_TEMPLATE_CELL : '');
        // Remove duplicates and join
        const finalClassName: string = [...new Set(classNames)].filter((cls: string) => cls).join(' ');
        const content: string | JSX.Element = !isNullOrUndefined(props.cell.column.headerTemplate) ? (column?.autoHeight ||
            (textWrapSettings?.enabled && textWrapSettings?.wrapMode !== WrapMode.Content) ? formattedValue :
            <div className={CSS_FIXED_HEIGHT_TEMPLATE_WRAPPER} style={{height: props?.row?.height}}>
                {formattedValue as ReactElement}</div>) as ReactElement
            : sanitizeContent(formattedValue as string || headerText);
        const hasFormulaReferenceLabel: boolean = !!formulaReferenceLabel && !isNullOrUndefined(column?.field);
        const headerTextContent: ReactNode = hasFormulaReferenceLabel ? (
            <>
                <span
                    className="sf-formula-reference-inline"
                    aria-label={`Formula reference ${formulaReferenceLabel}`}
                    style={{ display: 'inline-block', minWidth: '1.25em', marginRight: '0.35em', textAlign: 'left', opacity: 0.5 }}
                >
                    {formulaReferenceLabel}
                </span>
                <span className="sf-grid-header-label">{content}</span>
            </>
        ) : content;

        // Special rendering for checkbox selection column (select-all)
        if (column?.type === ColumnType.Checkbox && column?.headerCheckbox) {
            return (
                <th
                    ref={cellRef.current.cellRef}
                    {...customAttributes}
                    className={finalClassName}
                    aria-sort={'none'}
                >
                    <div className='sf-cell-inner'>
                        <div className={CSS_HEADER_CELL_DIV} data-mappinguid={props.cell.column.uid} key={`header-cell-${props.cell?.column?.uid}`}>
                            <Checkbox
                                className="sf-grid-checkselectall"
                                checked={props.row?.isSelected}
                                indeterminate={props.row?.isIntermediateState}
                                onChange={selectionModule.headerCheckBoxOnChange.bind(null, props.row)}
                                aria-label={localization?.getConstant('selectAllRows')}
                                disabled={props.row?.isDisabled || selectionSettings.mode === SelectionMode.Single ||
                                    currentViewData.length === 0}
                                aria-disabled={props.row?.isDisabled ? 'true' : 'false'}
                            />
                        </div>
                    </div>
                </th>
            );
        }

        return (
            <th
                ref={cellRef.current.cellRef}
                {...customAttributes}
                className={finalClassName}
                aria-sort={headerSortProperties.direction === 'Ascending' ? 'ascending' :
                    headerSortProperties.direction === 'Descending' ? 'descending' : 'none'}
                {...(allowFilter && filterType
                    ? {
                        onKeyDown: (e: React.KeyboardEvent<HTMLTableCellElement>) => {
                            const isAltArrowDown: boolean =
                                e.altKey && (e.key === 'ArrowDown' || e.code === 'ArrowDown');
                            if (isAltArrowDown) {
                                e.preventDefault();
                                e.stopPropagation();
                                openFilterDialog();
                            }
                        }
                    }
                    : {})}
            >
                <div className='sf-cell-inner'>
                    <div className={CSS_HEADER_CELL_DIV} data-mappinguid={props.cell.column.uid} key={`header-cell-${props.cell?.column?.uid}`}>
                        {hasFormulaReferenceLabel ? (
                            <span className={CSS_HEADER_TEXT}>{headerTextContent}</span>
                        ) : (
                            <span className={CSS_HEADER_TEXT} {...(disableHtmlEncode || isNullOrUndefined(disableHtmlEncode) ?
                                { children: content } :
                                { dangerouslySetInnerHTML: { __html: content } })}
                            />
                        )}
                        {(() => {
                            const isSortEnabled: boolean = allowSort && grid?.sortSettings?.enabled;
                            const isGroupColumn: boolean = (allowGroup || column?.type === ColumnType.SingleGroup);
                            const isGroupEnabled: boolean = grid.groupSettings.enabled && !!grid.groupSettings?.columns?.length;
                            const childrens: ColumnProps[] | ReactNode = column.columns || isColumnsChild(column.children);
                            const isStackedHeaderColumn: boolean = grid.isStackedHeader && !!childrens;
                            const shouldShowSortIcon: boolean = (isSortEnabled || (isGroupColumn && isGroupEnabled)) &&
                                !isStackedHeaderColumn;
                            return shouldShowSortIcon ? (
                                headerSortProperties.direction === 'Ascending' ? (
                                    <span className={`${CSS_SORT_ICON} ${headerSortProperties.className}`}>
                                        <ArrowUpIcon />
                                    </span>
                                ) : headerSortProperties.direction === 'Descending' ? (
                                    <span className={`${CSS_SORT_ICON} ${headerSortProperties.className}`}>
                                        <ArrowDownIcon />
                                    </span>
                                ) : (headerSortProperties.direction === 'Both' ? (
                                    <span className={`${CSS_SORT_ICON} ${headerSortProperties.className}`}>
                                        <ChevronUpIcon width={12} height={12} /><ChevronDownIcon width={12} height={12} />
                                    </span>
                                ) : null)
                            ) : <></>;
                        })()}
                        {headerSortProperties.index && <span className={CSS_SORT_NUMBER}>{headerSortProperties.index}</span>}
                        {(pivotColumnMenu || !(grid.isStackedHeader && column.columns ? !isNullOrUndefined(column.columns) : column.children ? isColumnsChild(column.children) : false)) && column.type !== 'checkbox' && column.type !== 'command' && (
                            <>
                                {allowFilter && filterType && (
                                    <span
                                        className={CSS_FILTER_ICON}
                                        onClick={openFilterDialog}
                                        onKeyDown={handleFilterIconKeyDown}
                                        style={{ display: grid.columnMenuSettings?.showFilter ? 'none' : undefined }}
                                    >
                                        {filterColumn.length ? <FilterActiveIcon color='#4285F4'/> : <FilterIcon />}
                                    </span>
                                )}

                                {/* Simple column menu trigger rendered as a span for consistency with filter icon */}
                                {grid.columnMenuSettings?.enabled && getWithoutSpecialColumns([column])?.length > 0 &&
                                    !(pivotColumnMenu && column.type === ColumnType.RowNumber) && (
                                    <>
                                        <span
                                            ref={menuButtonRef}
                                            className={'sf-column-menu-button'}
                                            role="button"
                                            tabIndex={0}
                                            aria-haspopup="true"
                                            aria-expanded={showColumnMenu ? 'true' : 'false'}
                                            aria-label={localization?.getConstant('columnMenuLabel') || 'Column menu'}
                                            onFocus={(event: FocusEvent<HTMLSpanElement, Element>) => {
                                                if (pivotColumnMenu) { event.stopPropagation(); }
                                            }}
                                            onPointerDown={(event: PointerEvent<HTMLSpanElement>) => {
                                                if (pivotColumnMenu) { event.stopPropagation(); }
                                            }}
                                            onMouseDown={(event: ReactMouseEvent<HTMLSpanElement, globalThis.MouseEvent>) => {
                                                if (pivotColumnMenu) { event.stopPropagation(); }
                                            }}
                                            onClick={(e: React.MouseEvent<HTMLElement>) => toggleColumnMenu(e)}
                                            onKeyDown={(e: React.KeyboardEvent<HTMLSpanElement>) => {
                                                const key: string = (e as React.KeyboardEvent<HTMLInputElement>).key;
                                                if (key === 'Enter' || key === ' ') {
                                                    e.preventDefault();
                                                    toggleColumnMenu((e as unknown) as React.MouseEvent<HTMLElement>);
                                                }
                                            }}
                                        >
                                            <span className="sf-column-menu-icon" aria-hidden>
                                                <MoreVerticalFilledIcon/>
                                            </span>
                                        </span>
                                        {showColumnMenu && (
                                            <ColumnMenu
                                                column={column}
                                                position={menuPosition}
                                                targetRef={menuButtonRef}
                                                onClose={closeColumnMenu}
                                            />
                                        )}
                                    </>
                                )}
                                {allowFilter && filterType && isFilterOpen && filterModule?.ExcelFilter && (() => {
                                    const { ExcelFilter } = filterModule;
                                    return (
                                        <ExcelFilter
                                            isOpen={isFilterOpen}
                                            options={updateFilterModel(cellRef.current?.cellRef)}
                                            onCancel={closeFilterDialog}
                                        />
                                    ); })()
                                }
                            </>
                        )}
                    </div>
                </div>
                {resizeHandlerElement}
            </th>
        );
    }, [
        cellType,
        index,
        customAttributes,
        cellClass,
        alignHeaderClass,
        visibleClass,
        formattedValue,
        field,
        headerText,
        formulaReferenceLabel,
        editModule?.isEdit,
        grid.editSettings?.mode,
        disableHtmlEncode,
        props.row?.rowIndex,
        resizeHandlerElement,
        grid.sortSettings,
        props.row,
        column?.autoHeight,
        currentViewData,
        grid.filterSettings,
        grid.selectionSettings.mode,
        isFilterOpen,
        handleFilterIconKeyDown,
        showColumnMenu,
        menuPosition,
        closeColumnMenu,
        toggleColumnMenu,
        localization,
        grid.sortByColumn,
        grid.removeSortColumn,
        grid.openColumnChooser,
        filterModule?.ExcelFilter
    ]);

    /**
     * Memoized data cell content
     */
    const dataCellContent: JSX.Element | null = useMemo(() => {
        if (cellType !== CellTypes.Data) { return null; }

        // Extract existing className from customAttributes to avoid duplication
        const existingClassName: string = customAttributes.className;

        // Create array of unique class names to avoid duplicates
        const classNames: string[] = props.cell.className.split(' ');

        // Add existing classes from customAttributes (includes cell type classes from Row.tsx)
        if (!isNullOrUndefined(existingClassName)) {
            classNames.push(...existingClassName.split(' ').filter((cls: string) => cls.trim()));
        }
        if (column?.type === ColumnType.RowNumber) {
            classNames.push(CSS_ROWNUMBER);
        }

        // Add alignment class if not already present
        classNames.push(alignClass);

        // Add custom content cell class.
        classNames.push(!isNullOrUndefined(cellClass) ? (typeof cellClass === 'function' ?
            cellClass({data: props.row.data as T, rowIndex: props.row.rowIndex, column, cellType: CellType.Content}) : cellClass) : '');
        classNames.push(!isNullOrUndefined(props.cell.column.template) ? CSS_FIXED_HEIGHT_TEMPLATE_CELL : '');

        const groupCaptionAggregateTypeSafe: Map<string, string[]> = groupCaptionAggregateType as Map<string, string[]>;
        const hasAggregateField: boolean = !groupCaptionAggregateTypeSafe.get(column?.field);
        const isCaptionRowWithData: boolean | string = props.row?.isCaptionRow && props?.row?.data?.[field ??
            (groupSettings?.type === GroupType.GroupRows && column?.type === ColumnType.Checkbox ?
                getVisibleColumns?.()?.find((column: ColumnProps) => column?.type !== ColumnType.Checkbox && !column?.getCommandItems &&
            column?.type !== ColumnType.RowDragAndDrop && column?.type !== ColumnType.RowNumber)?.field as string : undefined)];
        const CaptionRowExpandCollapseButton: JSX.Element = (isCaptionRowWithData && hasAggregateField) ? (
            <button
                type="button"
                className={CSS_GROUP_EXPAND_BTN}
                aria-expanded={props.row?.isExpand}
            >
                {props.row?.isExpand
                    ? <ChevronDownIcon aria-hidden="true" width={20} height={20} />
                    : (grid?.enableRtl ? <ChevronLeftIcon aria-hidden="true" width={20} height={20} /> :
                        <ChevronRightIcon aria-hidden="true" width={20} height={20} />)
                }
            </button>
        ) : <></>;
        const content: string | JSX.Element = !isNullOrUndefined(props.cell.column.template) || isMaskCell ?
            (column?.autoHeight || (textWrapSettings?.enabled && textWrapSettings?.wrapMode !== WrapMode.Header) || isMaskCell ?
                formattedValue : <div className={CSS_FIXED_HEIGHT_TEMPLATE_WRAPPER} style={{height: props?.row?.height}}>
                    {formattedValue as ReactElement}</div>) as ReactElement
            : sanitizeContent(formattedValue as string);
        const visiblePositionColumn: ColumnProps = getVisibleColumns?.()?.find((column: ColumnProps) =>
            column?.type !== ColumnType.Checkbox && !column?.getCommandItems && column.type !== ColumnType.RowNumber
            && column.type !== ColumnType.RowDragAndDrop);
        const isSingleGroupOrFirstOrGroupRows: boolean = column?.type === ColumnType.SingleGroup ||
            groupSettings?.type === GroupType.GroupRows || (groupSettings?.type === GroupType.SingleColumn &&
                column?.uid === visiblePositionColumn?.uid);
        const hasNotCommandAndCheckboxColumn: boolean = column?.type !== ColumnType.Checkbox && !column?.getCommandItems &&
            column.type !== ColumnType.RowNumber && column.type !== ColumnType.RowDragAndDrop;
        const shouldShowCaptionIndent: boolean = props.row?.isCaptionRow && isSingleGroupOrFirstOrGroupRows &&
            (hasNotCommandAndCheckboxColumn || (groupSettings?.type === GroupType.GroupRows && props.row?.isCaptionRow &&
                column?.type === ColumnType.Checkbox)) && hasAggregateField;
        const groupCaptionCellStyle: React.CSSProperties | undefined = (props?.row?.indent - 1) > 0 ? {
            paddingLeft: `${(props?.row?.indent - 1) * ThemeDefaults?.[theme as Theme].groupingIndent}px`
        } : {};
        classNames.push((column?.type !== ColumnType.Checkbox && column.type !== ColumnType.RowNumber && column.type !== ColumnType.RowDragAndDrop) && (content === '' ||
            isNullOrUndefined(content) && !props.cell.column.getCommandItems) ? 'sf-empty-cell' : '');
        // Remove duplicates and join
        const finalClassName: string = [...new Set(classNames)].filter((cls: string) => cls).join(' ');

        let checkboxNode: ReactNode;
        // Special rendering for checkbox selection column (row checkbox)
        if (column?.type === ColumnType.Checkbox || (groupSettings?.type === GroupType.GroupRows && props.row?.isCaptionRow)) {
            let isSelectable: boolean = true;
            let showDisabled: boolean = true;
            const primaryKeys: string[] = grid.getPrimaryKeyFieldNames?.() ?? [];
            const rowKey: string = props.row?.data?.[primaryKeys[0]];
            const selectableParams: RowSelectableParams = !grid.pageSettings.enabled ? selectionModule?.nonSelectableRows.get(rowKey) :
                selectionModule?.currentViewNonSelectableRows?.get(rowKey);
            if (selectableParams) {
                isSelectable = selectableParams.selectable;
                showDisabled = selectableParams.showDisabledCheckboxes;
            }
            const checkboxClassName: string = ['sf-grid-checkselect', !isSelectable && !showDisabled ? 'sf-grid-checkbox-hidden' : '']
                .filter(Boolean).join(' ');
            checkboxNode = <Checkbox
                className={checkboxClassName}
                checked={props.row?.isSelected}
                disabled={!isSelectable}
                aria-disabled={!isSelectable ? 'true' : 'false'}
                aria-label={localization?.getConstant('selectRow')}
                {...(grid.selectionSettings?.checkboxOnly ? { onChange: rowCheckBoxOnChange } : {})}
            />;
            if (column.type === ColumnType.Checkbox && !(groupSettings?.type === GroupType.GroupRows && props.row?.isCaptionRow)) {
                return <td
                    ref={cellRef.current.cellRef}
                    {...customAttributes}
                    className={finalClassName}
                >
                    {checkboxNode}
                </td>;
            }
        }

        if (column.type === ColumnType.Pin && isRowPinningEnabled(pinningSettings)) {
            const isPinned: boolean = !!props.row?.isPinned && !!props.row?.pinBucket;
            const isRowPinnable: boolean = grid.isRowPinnable?.(props.row?.data as T) !== false;
            return (
                <td
                    ref={cellRef.current.cellRef}
                    {...customAttributes}
                    className={finalClassName}
                >
                    {isRowPinnable && (
                        <a
                            className="sf-pin-cell"
                            aria-label={isPinned ? 'Pinned row' : 'Unpinned row'}
                            onClick={onPinCellClick}
                        >
                            {isPinned ? <PinIcon /> : <UnpinIcon />}
                        </a>
                    )}
                </td>
            );
        }

        const CaptionIndentIncludedElement: JSX.Element | undefined = shouldShowCaptionIndent ? (
            <div
                className={'sf-grid-groupcaptioncell'}
                style={groupCaptionCellStyle}
            >
                {CaptionRowExpandCollapseButton}
                {checkboxNode && getVisibleColumns?.()?.find((column: ColumnProps) => column?.type === ColumnType.Checkbox) && checkboxNode}
                {content}
            </div>
        ) : undefined;

        // Determine if this is the first column and master-detail is enabled
        const isFirstColumn: boolean = index === 0 || column?.uid === visiblePositionColumn?.uid;
        let isExpanded: boolean = false;
        const isMasterRow: boolean = isFirstColumn && isMasterDetail && !props.row?.isDetailRow && !!props.row?.data;
        if (isMasterRow) {
            const rowIndex: number = props.row?.rowIndex;
            isExpanded = isMasterRow && !isNullOrUndefined(rowIndex) ?
                (expansionState?.has(rowIndex) && expansionState?.get(rowIndex)) : false;
        }


        // Render expander icon for first column of master rows
        const expanderElement: ReactNode = isMasterRow ? (
            <button
                type="button"
                className={CSS_DETAIL_TOGGLE_ICON}
                aria-label={localization?.getConstant(isExpanded ? 'expanded' : 'collapsed')}
                aria-expanded={isExpanded}
            >
                {isExpanded
                    ? <ChevronDownIcon aria-hidden="true" width={20} height={20} />
                    : <ChevronRightIcon aria-hidden="true" width={20} height={20} />
                }
            </button>
        ) : null;

        // Use treeColumnIndex to determine which column renders tree UI
        const treeColumnIndexValue: number = treeDataSettings?.treeColumnIndex ?? 0;
        const isFirstColumnTree: boolean = index === treeColumnIndexValue && treeDataSettings?.enabled && !props.row?.isDetailRow;
        let isTreeExpanded: boolean = false;
        let isTreeParent: boolean = false;
        let treeLevel: number = 0;
        let treeKey: string = '';
        const treeRowData: TreeGridRow = props.row.data as TreeGridRow;
        if (isFirstColumnTree) {
            if (treeRowData) {
                isTreeParent = treeRowData.isTreeParent;
                isTreeExpanded = props.row.isExpand;
                treeLevel = treeRowData.treeLevel;
                treeKey = treeRowData.treeKey;
            }
        }

        // Render tree expander icon for first column of tree rows (parents only)
        const treeExpanderElement: ReactNode = isFirstColumnTree && isTreeParent ? (
            <button
                type="button"
                className="sf-tree-toggle-btn"
                aria-label={localization?.getConstant(isTreeExpanded ? 'expanded' : 'collapsed')}
                aria-expanded={isTreeExpanded}
                onClick={() => {
                    if (treeModule?.toggleNodeExpansion) {
                        treeModule.toggleNodeExpansion(treeKey, treeRowData);
                    }
                }}
            >
                <span className="sf-tree-toggle-icon">
                    {isTreeExpanded
                        ? <ChevronDownIcon aria-hidden="true" width={20} height={20} />
                        : <ChevronRightIcon aria-hidden="true" width={20} height={20} />
                    }
                </span>
            </button>
        ) : isFirstColumnTree && !isTreeParent ? (
            // Leaf node: render spacing spacer instead of button
            <span className="sf-tree-spacer" style={{ display: 'inline-block', width: '32px' }}></span>
        ) : null;

        const groupCaptionCellContent: ReactNode =
            <>
                {
                    // Case 1: Caption row with indent wrapper
                    CaptionIndentIncludedElement ? (
                        CaptionIndentIncludedElement
                    ) : (
                        <>
                            {CaptionRowExpandCollapseButton}

                            {
                                disableHtmlEncode || isNullOrUndefined(disableHtmlEncode) ? (
                                    content
                                ) : (
                                    <span dangerouslySetInnerHTML={{ __html: content as string }} />
                                )
                            }
                        </>
                    )
                }
            </>;

        return (
            props.cell.column.type === ColumnType.RowDragAndDrop && !props.row?.isCaptionRow &&
            !containerPinBucket ?
                <td
                    ref={cellRef.current.cellRef}
                    {...customAttributes}
                    className={`${finalClassName} ${CSS_ROW_DRAG_CELL} ${CSS_ROW_DRAG_HANDLE}`}
                >
                    <span>
                        <DragAndDropIcon width={22} height={22}/>
                    </span>
                </td>
                : commandColumnModule && props.cell.column.type === ColumnType.Command && !props.row?.isCaptionRow ?
                    (() => {
                        const { CommandColumnBase } = commandColumnModule;
                        return (<td
                            ref={cellRef.current.cellRef}
                            {...customAttributes}
                            className={`${finalClassName} ${CSS_COMMAND_CELL}`}
                        >
                            <CommandColumnBase row={props.row} column={props.cell.column} />
                        </td>);
                    })()
                    :
                    (isFirstColumnTree && !props.row?.isDetailRow ?
                        <td
                            ref={cellRef.current.cellRef}
                            {...customAttributes}
                            className={finalClassName}
                        >
                            <span className="sf-tree-cell" style={{ paddingLeft: `${treeLevel * 20}px` }}>
                                {treeExpanderElement}
                                <span
                                    {...(disableHtmlEncode || isNullOrUndefined(disableHtmlEncode) ?
                                        { children: content } :
                                        { dangerouslySetInnerHTML: { __html: content } })} />
                            </span>
                        </td>
                        : (isMasterRow && !props.row.isDetailRow ?
                            <td
                                ref={cellRef.current.cellRef}
                                {...customAttributes}
                                className={finalClassName}
                            >
                                {expanderElement}
                                <span
                                    {...(disableHtmlEncode || isNullOrUndefined(disableHtmlEncode) ?
                                        { children: content } :
                                        { dangerouslySetInnerHTML: { __html: content } })} />

                            </td>
                            : (groupSettings?.enabled && groupSettings?.columns?.length && isCaptionRowWithData ? <td
                                ref={cellRef.current.cellRef}
                                {...customAttributes}
                                className={finalClassName}
                            >
                                {groupCaptionCellContent}
                            </td>
                                : <td
                                    ref={cellRef.current.cellRef}
                                    {...customAttributes}
                                    className={finalClassName}
                                    {...(disableHtmlEncode || isNullOrUndefined(disableHtmlEncode) ?
                                        { children: content } :
                                        { dangerouslySetInnerHTML: { __html: content } })} />
                            )
                        )
                    )
        );
    }, [
        cellType,
        customAttributes,
        cellClass,
        alignClass,
        visibleClass,
        formattedValue,
        column?.autoHeight,
        index,
        disableHtmlEncode,
        props.row?.rowIndex,
        props.row?.isSelected,
        expansionState,
        commandColumnModule?.CommandColumnBase,
        onPinCellClick,
        pinningSettings?.enabled,
        props.row?.isPinned,
        props.row?.pinBucket,
        containerPinBucket
    ]);

    /**
     * Memoized summary cell content
     */
    const summaryCellContent: JSX.Element | null = useMemo(() => {
        if (cellType !== CellTypes.Summary) { return null; }

        // Extract existing className from customAttributes to avoid duplication
        const existingClassName: string = customAttributes.className;

        // Create array of unique class names to avoid duplicates
        const classNames: string[] = [];

        // Add existing classes from customAttributes (includes cell type classes from Row.tsx)
        classNames.push(...existingClassName.split(' ').filter((cls: string) => cls.trim()));

        // Add alignment class if not already present
        classNames.push(alignClass);

        // Add custom aggregate class.
        classNames.push(!isNullOrUndefined(aggregateCellClass) ? (typeof aggregateCellClass === 'function' ?
            aggregateCellClass({data: props.row.data as T, rowIndex: props.row.rowIndex, column, cellType: CellType.Aggregate}) : aggregateCellClass) : '');
        classNames.push(!isNullOrUndefined(props.cell.isTemplate) ? CSS_FIXED_HEIGHT_TEMPLATE_CELL : '');

        const content: string | JSX.Element = props.cell.isTemplate ? (column?.autoHeight ? formattedValue :
            <div className={CSS_FIXED_HEIGHT_TEMPLATE_WRAPPER} style={{height: props?.row?.height}}>
                {formattedValue as ReactElement}</div>) as ReactElement :
            sanitizeContent(formattedValue as string);

        classNames.push(content === '' || isNullOrUndefined(content) ? 'sf-empty-cell' : '');
        // Remove duplicates and join
        const finalClassName: string = [...new Set(classNames)].filter((cls: string) => cls).join(' ');
        return (
            <td
                ref={cellRef.current.cellRef}
                data-mappinguid={props.cell.column.uid}
                {...customAttributes}
                className={finalClassName}
                {...(disableHtmlEncode || isNullOrUndefined(disableHtmlEncode) ?
                    { children: content } :
                    { dangerouslySetInnerHTML: { __html: content } })}
            />
        );
    }, [
        cellType,
        customAttributes,
        cellClass,
        alignClass,
        visibleClass,
        formattedValue,
        index,
        disableHtmlEncode,
        column?.autoHeight,
        props.row?.rowIndex
    ]);

    // Return the appropriate cell content based on cell type
    return cellType === CellTypes.Header ? headerCellContent : cellType === CellTypes.Summary ? summaryCellContent : dataCellContent;
}
) as <T>(props: Partial<IColumnBase<T>>) => JSX.Element;

/**
 * Set display name for debugging purposes
 */
(ColumnBase as MemoExoticComponent<<T>(props: Partial<IColumnBase<T>>) => JSX.Element>).displayName = 'ColumnBase';

/**
 * Column component for declarative usage in user code
 *
 * @component
 * @example
 * ```tsx
 * <Column field="name" headerText="Name" />
 * ```
 * @param {Partial<ColumnProps>} _props - Column configuration properties
 * @returns {JSX.Element} ColumnBase component with the provided properties
 */
export const Column: <T>(props: Partial<ColumnProps<T>>) => JSX.Element =
// eslint-disable-next-line @typescript-eslint/no-unused-vars
<T, >(_props: Partial<ColumnProps<T>>): JSX.Element => {
    return null;
};

/**
 * Export the ColumnBase component for internal use
 *
 * @private
 */
export { ColumnBase };
