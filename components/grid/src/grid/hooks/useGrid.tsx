import {
    CSSProperties,
    ReactElement,
    RefObject,
    useCallback,
    useEffect,
    useId,
    useMemo,
    useRef,
    useState,
    MouseEvent,
    FocusEvent
} from 'react';
import {
    Browser,
    closest,
    isNullOrUndefined,
    formatUnit,
    getValue,
    IL10n,
    L10n,
    removeClass,
    useProviderContext,
    SanitizeHtmlHelper,
    createElement,
    preRender
} from '@syncfusion/react-base';
import { useValueFormatter, createServiceLocator } from '../services';
import { Query, DataManager, DataResult, QueryOptions, ReturnType as DataReturnType } from '@syncfusion/react-data';
import {
    MutableGridBase,
    IValueFormatter,
    DataRequestEvent,
    GridLine,
    IRow,
    ClipMode,
    DataChangeRequestEvent,
    PendingState,
    FilterPredicates,
    ValueType
} from '../types';
import { selectionModule, SelectionSettings } from '../types/selection.interfaces';
import { SortDescriptor, SortSettings, SortModule } from '../types/sort.interfaces';
import { GridRef, TextWrapSettings, RowInfo, IGrid, IGridBase, RecordDoubleClickEvent } from '../types/grid.interfaces';
import { filterModule, FilterSettings } from '../types/filter.interfaces';
import { editModule, EditSettings } from '../types/edit.interfaces';
import { ColumnProps } from '../types/column.interfaces';
import { AggregateRowProps } from '../types/aggregate.interfaces';
import { CellFocusEvent, FocusedCellInfo, IFocusMatrix } from '../types/focus.interfaces';
import { PageSettings } from '../types/page.interfaces';
import { searchModule, SearchSettings } from '../types/search.interfaces';
import { ToolbarAPI } from '../types/toolbar.interfaces';
import { ServiceLocator, UseDataResult, GridResult } from '../types/interfaces';
import {
    useAggregates, useColumns, useSelection, useSort, useSearch, useEdit, useToolbar,
    useFocusStrategy, useFilter
} from './index';
import { useData } from '../models';
import { iterateArrayOrObject } from '../utils';
import { ITooltip } from '@syncfusion/react-popups';

/**
 * Default localization strings for the grid
 */
const defaultLocale: Record<string, string> = {
    noRecordsMessage: 'No records to display',
    filterBarTooltip: '\'s filter bar cell',
    invalidFilterMessage: 'Invalid filter data',
    booleanTrueLabel: 'true',
    booleanFalseLabel: 'false',
    addButtonLabel: 'Add',
    editButtonLabel: 'Edit',
    cancelButtonLabel: 'Cancel',
    updateButtonLabel: 'Update',
    deleteButtonLabel: 'Delete',
    searchButtonLabel: 'Search',
    unsavedChangesConfirmation: 'Unsaved changes will be lost. Are you sure you want to continue?',
    noRecordsEditMessage: 'No records selected for edit operation',
    noRecordsDeleteMessage: 'No records selected for delete operation',
    okButtonLabel: 'OK',
    confirmDeleteMessage: 'Are you sure you want to delete the record?'
};

/**
 * CSS class names used in the Grid component
 */
const CSS_CLASS_NAMES: Record<string, string> = {
    CONTROL: 'sf-control',
    GRID: 'sf-grid',
    RTL: 'sf-rtl',
    GRID_HOVER: 'sf-row-hover',
    MAC_SAFARI: 'sf-mac-safari',
    MIN_HEIGHT: 'sf-row-min-height',
    HIDE_LINES: 'sf-hide-lines'
};

const KEY_CODES: Record<string, number> = {
    ALT_J: 74,
    ALT_W: 87,
    ENTER: 13
};

/**
 * Custom hook to manage grid state and configuration
 *
 * @private
 * @param {Partial<IGridBase>} props - Grid component properties
 * @param {RefObject<GridRef>} gridRef - Reference object for rendering interactions
 * @param {RefObject<ITooltip>} ellipsisTooltipRef - Tooltip reference
 * @returns {GridResult} An object containing various grid-related state and API
 */
export const useGridComputedProps: <T, >(props: Partial<IGridBase<T>>, gridRef?: RefObject<GridRef<T>>,
    ellipsisTooltipRef?: RefObject<ITooltip>) => GridResult<T> = <T, >(
    props: Partial<IGridBase<T>>,
    gridRef?: RefObject<GridRef<T>>,
    ellipsisTooltipRef?: RefObject<ITooltip>
): GridResult<T> => {
    const baseProvider: {
        locale: string;
        dir: string;
        ripple: boolean;
    } = useProviderContext();

    const locale: string = useMemo(() =>
        props.locale || baseProvider.locale, [props.locale, baseProvider.locale]);
    const localeObj: IL10n = useMemo(() => {
        const l10n: IL10n = L10n('grid', defaultLocale, locale);
        l10n.setLocale(locale);
        return l10n;
    }, [locale]);
    const valueFormatterService: IValueFormatter = useValueFormatter(locale);
    const serviceLocator: ServiceLocator = useMemo(() => {
        const locator: ServiceLocator = createServiceLocator();
        locator.register('localization', localeObj);
        locator.register('valueFormatter', valueFormatterService);
        return locator;
    }, [localeObj, valueFormatterService]);
    const dataSource: DataManager | DataResult = useMemo(() => {
        if (props.dataSource instanceof DataManager) {
            return props.dataSource;
        }
        else if (Array.isArray(props.dataSource)) {
            return new DataManager(props.dataSource);
        }
        else if (props.dataSource && props.dataSource.result) {
            return props.dataSource;
        }
        return new DataManager([]);
    }, [props.dataSource]);

    const query: Query = useMemo(() => props.query instanceof Query ? props.query : new Query(), [props.query]);
    // Trigger load event on initial render
    useMemo(() => {
        if (props.onGridRenderStart) {
            props.onGridRenderStart();
        }
    }, []);
    const [isInitialLoad, setInitialLoad] = useState(true);
    const isInitialBeforePaint: RefObject<boolean> = useRef(true);
    const tooltipContent: RefObject<string> = useRef('');
    const aggregates: AggregateRowProps[] = useAggregates<T>(props, gridRef);

    const dataState: RefObject<PendingState> = useRef({isPending: false, resolver: undefined, isEdit: false});

    const { columns: preparedColumns, children, headerRowDepth, colElements, uiColumns } =
        useColumns<T>({ ...props }, gridRef, dataState, isInitialBeforePaint);

    // Initialize search settings based on props or use default values
    const defaultSearchSettings: SearchSettings = {
        enabled: props.searchSettings?.enabled || false,
        fields: props.searchSettings?.fields || [],
        value: props.searchSettings?.value || '',
        operator: props.searchSettings?.operator  || 'contains',
        caseSensitive: props.searchSettings?.caseSensitive ?? true,
        ignoreAccent: props.searchSettings?.ignoreAccent || false
    };

    const searchSettings: SearchSettings = useMemo(() =>
        defaultSearchSettings, [props.searchSettings]);

    // Initialize filter settings based on props or use default values
    const defaultFilterSettings: FilterSettings = {
        enabled: props.filterSettings?.enabled || false,
        columns: props.filterSettings?.columns || [],
        type: props.filterSettings?.type || 'FilterBar',
        mode: props.filterSettings?.mode || 'Immediate',
        immediateModeDelay: props.filterSettings?.immediateModeDelay || 1500,
        ignoreAccent: props.filterSettings?.ignoreAccent || false,
        operators: props.filterSettings?.operators || null,
        caseSensitive: props.filterSettings?.caseSensitive || false
    };

    const filterSettings: FilterSettings = useMemo(() => {
        if (!props.filterSettings?.enabled) {
            defaultFilterSettings.columns = [];
        }
        return defaultFilterSettings;
    }, [props.filterSettings?.enabled, props.filterSettings]);

    const sortSettings: SortSettings = useMemo(() => {
        const combinedSortColumn: SortDescriptor[] = [];
        if (props.sortSettings?.columns) {
            if (props?.sortSettings?.enabled) {
                for (let i: number = 0; i < props.sortSettings?.columns?.length; i++) {
                    combinedSortColumn.push(props.sortSettings?.columns[parseInt(i.toString(), 10)]);
                }
            }
        }
        // Initialize sort settings based on props or use default values
        const defaultSortSettings: SortSettings = {
            enabled: props.sortSettings?.enabled || false,
            mode: props?.sortSettings?.mode !== 'Single' || isNullOrUndefined(props?.sortSettings?.mode) ? 'Multiple' : 'Single',
            columns: combinedSortColumn || [],
            allowUnsort: props.sortSettings?.allowUnsort !== false
        };
        return defaultSortSettings;
    }, [props?.sortSettings?.enabled, props?.sortSettings?.mode, props.sortSettings]);

    // Update the `currentPage` state value with the `pageSettings` changes
    useEffect(() => {
        if (props.pageSettings?.currentPage && currentPage !== props.pageSettings?.currentPage) {
            gridRef.current.goToPage?.(props.pageSettings?.currentPage);
        }
    }, [props.pageSettings]);

    const [currentPage, setCurrentPage] = useState<number>(props.pageSettings?.currentPage || 1);
    const [totalRecordsCount, setTotalRecordsCount] = useState<number>(0);

    // Update the `currentPage` state value with the `pageSettings.enabled` changes
    useEffect(() => {
        if (!props.pageSettings?.enabled && currentPage !== 1) {
            setCurrentPage(1);
        }
    }, [props.pageSettings?.enabled]);

    // Initialize page settings based on props or use default values
    const defaultPageSettings: PageSettings = {
        enabled: props.pageSettings?.enabled || false,
        pageSize: props.pageSettings?.pageSize || 12,
        pageCount: props.pageSettings?.pageCount || 0,
        currentPage: currentPage,
        template: props.pageSettings?.template || null,
        totalRecordsCount: totalRecordsCount
    };
    const stableRest: RefObject<Partial<IGridBase<T>>> = useRef(props);
    const generatedId: string = useId().replace(/:/g, '');
    const id: string = useMemo(() => props.id || `grid_${generatedId}`, [props.id, generatedId]);

    const columns: ColumnProps<T>[] = useMemo(() =>
        preparedColumns as ColumnProps<T>[], [preparedColumns]);

    const clipMode: ClipMode | string = useMemo(() => {
        return props.clipMode;
    }, [props.clipMode]);

    const height: string | number = useMemo(() =>
        props.height || 'auto', [props.height]);
    const width: string | number = useMemo(() =>
        props.width || 'auto', [props.width]);
    const gridLines: GridLine | string = useMemo(() =>
        props.gridLines || 'Default', [props.gridLines]);
    const enableRtl: boolean = useMemo(() =>
        (props.enableRtl ?? baseProvider.dir === 'rtl') || false, [props.enableRtl, baseProvider.dir]);
    const enableHover: boolean = useMemo(() =>
        props.enableHover !== false, [props.enableHover]);
    const allowKeyboard: boolean = useMemo(() =>
        props.allowKeyboard !== false, [props.allowKeyboard]);
    const selectionSettings: SelectionSettings = useMemo(() =>
        ({
            ... { enabled: true, mode: 'Single', type: 'Row', enableToggle: false },
            ...(props.selectionSettings || {})
        }), [props.selectionSettings]);
    const pageSettings: PageSettings = useMemo(() =>
        defaultPageSettings, [props.pageSettings]);
    const textWrapSettings: TextWrapSettings = useMemo(() => {
        if (gridRef.current?.textWrapSettings?.wrapMode === props.textWrapSettings?.wrapMode) {
            return gridRef.current?.textWrapSettings;
        }
        return {... { wrapMode: 'Both' }, ...(props.textWrapSettings || {})};
    }, [props.textWrapSettings]);
    const enableHtmlSanitizer: boolean = useMemo(() =>
        props.enableHtmlSanitizer || false, [props.enableHtmlSanitizer]);
    const enableStickyHeader: boolean = useMemo(() =>
        props.enableStickyHeader || false, [props.enableStickyHeader]);
    const rowHeight: number | null = useMemo(() =>
        props.rowHeight || null, [props.rowHeight]);
    const enableAltRow: boolean = useMemo(() =>
        props.enableAltRow ?? true, [props.enableAltRow]);
    const emptyRecordTemplate: string | Function | ReactElement = useMemo(() =>
        props.emptyRecordTemplate || null, [props.emptyRecordTemplate]);
    const rowTemplate: string | Function | ReactElement = useMemo(() =>
        props.rowTemplate || null, [props.rowTemplate]);

    const [currentViewData, setCurrentViewData] = useState<T[]>([]);

    const [responseData, setResponseData] = useState<Object>({});

    const [gridAction, setGridAction] = useState<Object>({});

    const cssClass: string = useMemo(() => {
        return props.className || '';
    }, [props.className]);

    /**
     * Compute CSS class names for the grid
     */
    const className: string = useMemo<string>(() => {
        const baseClasses: string[] = [
            CSS_CLASS_NAMES.CONTROL,
            CSS_CLASS_NAMES.GRID
        ];

        if (enableRtl) {
            baseClasses.push(CSS_CLASS_NAMES.RTL);
        }

        if (textWrapSettings?.enabled && textWrapSettings.wrapMode === 'Both') {
            baseClasses.push('sf-wrap');
        }

        if (gridLines !== 'Default' && gridLines !== 'None') {
            baseClasses.push(`sf-${gridLines.toLowerCase()}-lines`);
        } else if (gridLines === 'None') {
            baseClasses.push(CSS_CLASS_NAMES.HIDE_LINES);
        }

        if (enableHover) {
            baseClasses.push(CSS_CLASS_NAMES.GRID_HOVER);
        }

        if (/^((?!chrome|android).)*safari/i.test(navigator.userAgent) || Browser.isSafari()) {
            baseClasses.push(CSS_CLASS_NAMES.MAC_SAFARI);
        }

        if (rowHeight) {
            baseClasses.push(CSS_CLASS_NAMES.MIN_HEIGHT);
        }

        if (cssClass) {
            baseClasses.push(...cssClass.split(' '));
        }

        return baseClasses.join(' ');
    }, [enableRtl, enableHover, rowHeight, gridLines, cssClass,
        filterSettings?.enabled, selectionSettings, textWrapSettings?.enabled, textWrapSettings,
        enableHtmlSanitizer, enableStickyHeader]);

    /**
     * Compute CSS styles for the grid container
     */
    const styles: CSSProperties = useMemo<CSSProperties>(() => ({
        width: formatUnit(width)
    }), [width]);

    /**
     * Gets a Column by column name.
     *
     * @param  {string} field - Specifies the column name.
     *
     * @returns {ColumnProps} Returns the column
     */
    const getColumnByField: (field: string) => ColumnProps<T> = useCallback((field: string): ColumnProps<T> => {
        return iterateArrayOrObject<ColumnProps<T>, ColumnProps<T>>(columns, (item: ColumnProps<T>) => {
            if (item.field === field) {
                return item;
            }
            return undefined;
        })[0];
    }, [columns]);

    /**
     * Retrieves all records from the Grid based on the current settings.
     *
     * The `getData` method returns an array of data objects reflecting the applied paging, filters, sorting, searching and grouping settings.
     * For a remote data source, it returns only the current view data.
     *
     * @param {boolean} skipPage - If `true`, excludes pagination information from the returned data.
     * @param {boolean} requiresCount - If `true`, then the service returns result and count.
     *
     * @returns {Object[] | Promise<Response | DataReturnType>} Returns an array of records based on current settings in grid.
     *
     * @example
     * ```tsx
     * gridRef.current.getData();
     * ```
     */
    const getData: (skipPage?: boolean, requiresCount?: boolean) => Object[] | Promise<Response | DataReturnType> =
        useCallback((skipPage?: boolean, requiresCount?: boolean): Object[] | Promise<Response | DataReturnType> => {
            const query: Query = dataModule.generateQuery();
            if (requiresCount) {
                query.requiresCount();
            }
            if (skipPage) {
                query.queries = query.queries.filter((query: QueryOptions) => query.fn !== 'onPage');
            }
            if (dataSource && dataModule.isRemote() && dataSource instanceof DataManager) {
                // Especially usefull for edit update whole data based aggregate
                return dataOperations?.getData?.({}, query) as Promise<DataReturnType>;
            } else {
                if (dataSource instanceof DataManager) {
                    return (dataSource as DataManager).executeLocal(query);
                } else {
                    return new DataManager(dataSource as DataManager, query).executeLocal(query);
                }
            }
        }, [dataSource, currentViewData]);

    /**
     * Retrieves an array of all hidden columns in the Grid.
     *
     * The `getHiddenColumns` method returns an array containing all the column configuration objects that are currently hidden in the Grid.
     *
     * @returns {ColumnProps[]} Returns an array of `ColumnProps` objects representing all the currently hidden columns.
     *
     * @example
     * ```tsx
     * gridRef.current.getHiddenColumns();
     * ```
     */
    const getHiddenColumns: () => ColumnProps<T>[] = useCallback((): ColumnProps<T>[] => {
        const cols: ColumnProps<T>[] = [];
        for (const col of (columns)) {
            if (col.visible === false) {
                cols.push(col);
            }
        }
        return cols as ColumnProps<T>[];
    }, [columns]);

    /**
     * Retrieves row information based on a target cell element.
     *
     * The `getRowInfo` method returns detailed information about the row that contains the specified target element.
     *
     * @param {Element | EventTarget} target - The cell element or event target used to identify the corresponding row.
     *
     * @returns {RowInfo} Returns a `RowInfo` object containing details about the associated row.
     *
     * @example
     * ```tsx
     * gridRef.current.getRowInfo(event.target);
     * ```
     */
    const getRowInfo: (target: Element | EventTarget) => RowInfo<T> = useCallback((target: Element | EventTarget): RowInfo<T> => {
        const ele: Element = target as Element;
        let args: Object = { target: target };
        if (!isNullOrUndefined(target)) {
            const cell: Element = closest(ele, '.sf-grid-content-row .sf-cell');
            if (!cell) {
                const row: Element = closest(ele, '.sf-grid-content-row');
                if (!isNullOrUndefined(row) && !row.classList.contains('sf-grid-add-row')) {
                    const rowObj: IRow<ColumnProps<T>> = gridRef.current.getRowObjectFromUID(row.getAttribute('data-uid'));
                    const rowIndex: number = parseInt(row.getAttribute('aria-rowindex'), 10) - 1;
                    args = { row: row, data: rowObj.data, rowIndex: rowIndex };
                }
                return args;
            }
            const cellIndex: number = parseInt(cell.getAttribute('aria-colindex'), 10) - 1;
            const row: Element = closest(cell, '.sf-grid-content-row');
            if (!isNullOrUndefined(cell) && !isNaN(cellIndex) && !isNullOrUndefined(row)) {
                const rowIndex: number = parseInt(row.getAttribute('aria-rowindex'), 10) - 1;
                const rows: Element[] = Array.from(gridRef?.current.getRows() || []);
                const index: number = cellIndex;
                const rowsObject: Element[] = rows.filter((r: Element) => r.getAttribute('data-uid') === row.getAttribute('data-uid'));
                let data: T = {} as T;
                let column: ColumnProps<T>;
                if (Object.keys(rowsObject).length) {
                    const rowObject: IRow<ColumnProps<T>> = gridRef?.current.getRowObjectFromUID(rowsObject[0].getAttribute('data-uid'));
                    data = rowObject.data;
                    column = rowObject.cells[parseInt(index.toString(), 10)].column as ColumnProps<T>;
                }
                args = {
                    cell: cell, cellIndex: cellIndex, columnIndex: cellIndex, row: row, rowIndex: rowIndex,
                    data: data, column: column, target: target
                };
            }
        }
        return args;
    }, []);

    /**
     * Get primary key field names from columns
     */
    const getPrimaryKeyFieldNames: () => string[] = useCallback((): string[] => {
        const primaryKeys: string[] = [];
        // Add null check for grid.columns to prevent runtime errors
        if (columns) {
            for (const column of columns) {
                if (column.isPrimaryKey && column.field) {
                    primaryKeys.push(column.field);
                }
            }
        }
        return primaryKeys.length > 0 ? primaryKeys : ['id']; // Default to 'id' if no primary key found
    }, [columns]);

    /**
     * @returns {ColumnProps[]} returns array of column models
     */
    const getVisibleColumns: () => ColumnProps<T>[] = useCallback((): ColumnProps<T>[] => {
        const cols: ColumnProps<T>[] = [];
        const gridCols: ColumnProps<T>[] = uiColumns ?? columns;
        for (const col of gridCols) {
            if (col.visible) {
                cols.push(col);
            }
        }
        return cols;
    }, [columns, uiColumns]);

    /**
     * Gets a column by UID.
     *
     * @param  {string} uid - Specifies the column UID.
     *
     * @returns {ColumnProps} Returns the column
     */
    const getColumnByUid: (uid: string) => ColumnProps<T> = useCallback((uid: string): ColumnProps<T> => {
        const gridCols: ColumnProps<T>[] = uiColumns ?? columns;
        for (const col of gridCols) {
            if (col.uid === uid) {
                return col;
            }
        }
        return undefined;
    }, [columns, uiColumns]);

    /**
     * Get the parent element
     */
    const getParentElement: () => HTMLElement = useCallback((): HTMLElement => {
        return gridRef?.current?.element as HTMLElement;
    }, [gridRef?.current?.element]);

    /**
     * Updates and refresh the particular row values based on the given primary key value.
     * Primary key column must be specified using columns.isPrimaryKey property.
     *
     * @param {string| number} key - Specifies the PrimaryKey value of dataSource.
     * @param {Object} data - To update new data for the particular row.
     *
     * @returns {void}
     */
    const setRowData: (key: string | number, data?: T, isDataSourceChangeRequired?: boolean) => void =
        useCallback(async(key: string | number, data?: T, isDataSourceChangeRequired: boolean = false): Promise<void> => {
            const rowuID: string = 'uid';
            const pkName: string = gridRef.current?.getPrimaryKeyFieldNames()[0];
            const selectedRow: IRow<ColumnProps<T>> = gridRef.current?.getRowsObject().filter((r: IRow<{}>) =>
                getValue(pkName, r.data) === key)[0] as IRow<ColumnProps<T>>;
            if (selectedRow === undefined || selectedRow === null) {
                return;
            }
            const selectRowEle: Element[] = selectedRow ? [].slice.call(
                gridRef.current?.element.querySelectorAll('[data-uid=' + selectedRow[`${rowuID}`] + ']')) : undefined;
            try {
                if (isDataSourceChangeRequired) {
                    await dataOperations.getData({
                        requestType: 'update',
                        data: data
                    });
                }
                if (!isNullOrUndefined(selectedRow) && selectRowEle.length) {
                    const rowObjectData: T = {...selectedRow.data, ...data};
                    selectedRow.setRowObject({...selectedRow, data: rowObjectData});
                } else {
                    return; // if updated cell not inside the current view
                }
            } catch (error) {
                // Trigger actionFailure event on error
                // This provides consistent error handling similar to other grid operations
                gridRef.current?.onError(error as Error);
                return;
            }
        }, [gridRef.current]);

    /**
     * Updates particular cell value based on the given primary key value.
     * Primary key column must be specified using columns.isPrimaryKey property.
     *
     * @param {string| number} key - Specifies the PrimaryKey value of dataSource.
     * @param {string } field - Specifies the field name which you want to update.
     * @param {ValueType} value - To update new value for the particular cell.
     *
     * @returns {void}
     */
    const setCellValue: (key: string | number, field: string, value: ValueType | null,
        isDataSourceChangeRequired?: boolean) => void =
        useCallback(async (key: string | number, field: string, value: ValueType | null,
                           isDataSourceChangeRequired?: boolean) => {
            const rowuID: string = 'uid';
            const pkName: string = gridRef.current?.getPrimaryKeyFieldNames()[0];
            const selectedRow: IRow<ColumnProps<T>> = gridRef.current?.getRowsObject().filter((r: IRow<{}>) =>
                getValue(pkName, r.data) === key)[0] as IRow<ColumnProps<T>>;
            if (selectedRow === undefined || selectedRow === null) {
                return;
            }
            const selectRowEle: Element[] = selectedRow ? [].slice.call(
                gridRef.current?.element.querySelectorAll('[data-uid=' + selectedRow[`${rowuID}`] + ']')) : undefined;
            const changedRowData: T = { ...selectedRow.data, [field]: value };
            try {
                if (isDataSourceChangeRequired) {
                    await dataOperations.getData({
                        requestType: 'update',
                        data: changedRowData
                    });
                }
                if (!isNullOrUndefined(selectedRow) && selectRowEle.length) {
                    const rowObjectData: T = { ...selectedRow.data, ...changedRowData };
                    selectedRow.setRowObject({ ...selectedRow, data: rowObjectData });
                } else {
                    return; // if updated cell not inside the current view
                }
            } catch (error) {
                // Trigger actionFailure event on error
                // This provides consistent error handling similar to other grid operations
                gridRef.current?.onError(error as Error);
                return;
            }
        }, [gridRef.current]);

    /**
     * Get the columns directive element
     */
    const columnsDirective: ReactElement = useMemo(() => {
        return children as ReactElement;
    }, [children]);

    // Get header, content, and aggregate row counts for focus strategy
    const headerRowCount: number = useMemo(() => headerRowDepth, [headerRowDepth]);
    const contentRowCount: number = useMemo(() => currentViewData?.length || 0, [currentViewData]);
    const aggregateRowCount: number = useMemo(() => aggregates?.length || 0, [aggregates]);

    const filterModule: filterModule = useFilter(gridRef, filterSettings, setGridAction, serviceLocator);

    const searchModule: searchModule = useSearch(gridRef, searchSettings, setGridAction);

    const selectionModule: selectionModule<T> = useSelection<T>(gridRef);

    useMemo(() => {
        if (!selectionSettings.enabled) {
            selectionModule.clearSelection();
        }
    }, [selectionSettings.enabled]);

    const sortModule: SortModule = useSort(gridRef, sortSettings, setGridAction);

    useMemo(() => {
        const sortedColumns: SortDescriptor[] = sortModule.sortSettings.columns;
        if (sortedColumns.length) {
            const validColumns: SortDescriptor[] = sortedColumns.filter((sortedColumn: SortDescriptor) => {
                const column: ColumnProps<T> = columns.find((col: ColumnProps<T>) => col.field === sortedColumn.field);
                return column?.allowSort;
            });
            if (sortedColumns.length !== validColumns.length) {
                sortModule.setSortSettings((prev: SortSettings) => ({ ...prev, columns: validColumns }));
            }
        }

        const filteredColumns: FilterPredicates[] = filterModule.filterSettings.columns;
        if (filteredColumns.length) {
            const validColumns: FilterPredicates[] = filteredColumns.filter((filteredColumn: FilterPredicates) => {
                const column: ColumnProps<T> = columns.find((col: ColumnProps<T>) => col.field === filteredColumn.field);
                return column?.allowFilter;
            });
            if (filteredColumns.length !== validColumns.length) {
                filterModule.setFilterSettings((prev: FilterSettings) => ({ ...prev, columns: validColumns }));
            }
        }
    }, [columns]);

    // Initialize focus strategy - single source of truth for focus state
    const focusModule: ReturnType<typeof useFocusStrategy> = useFocusStrategy(
        headerRowCount,
        contentRowCount,
        aggregateRowCount,
        uiColumns ?? columns,
        gridRef,
        {
            onCellFocus: (args: CellFocusEvent<T>) => {
                if (props.onCellFocus) {
                    const eventArgs: CellFocusEvent<T> = {
                        column: args.column,
                        columnIndex: args.columnIndex,
                        event: args.event,
                        data: args.data,
                        rowIndex: args.rowIndex
                    };
                    props.onCellFocus(eventArgs);
                }
                protectedAPI.selectionModule.onCellFocus(args);
            },
            onCellClick: (args: CellFocusEvent<T>) => {
                if (props.onCellClick) {
                    const eventArgs: CellFocusEvent<T> = {
                        column: args.column,
                        columnIndex: args.columnIndex,
                        event: args.event,
                        data: args.data,
                        rowIndex: args.rowIndex
                    };
                    props.onCellClick(eventArgs);
                }
            },
            beforeCellFocus: (args: CellFocusEvent<T>) => {
                if (props.onCellFocusStart) {
                    props.onCellFocusStart(args);
                }
            }
        }
    );

    const keyDownHandler: (e: React.KeyboardEvent | KeyboardEvent) => void = useCallback((e: React.KeyboardEvent | KeyboardEvent) => {
        if (e.altKey) {
            if (e.keyCode === KEY_CODES.ALT_J) {
                const currentInfo: FocusedCellInfo = focusModule?.getFocusInfo();
                if (currentInfo && currentInfo.element) {
                    removeClass([currentInfo.element, currentInfo.elementToFocus],
                                ['sf-focused', 'sf-focus']);
                    currentInfo.element.tabIndex = -1;
                }
                gridRef.current?.element.focus();
            }
            if (e.keyCode === KEY_CODES.ALT_W) {
                // First ensure we're in content mode
                focusModule.setActiveMatrix('Content');

                // Focus the content area
                focusModule.focusContent();

                // Add outline to the focused cell
                focusModule.addOutline();

                // Prevent default browser behavior
                e.preventDefault();
            }
        }
    }, [focusModule, gridRef.current?.currentViewData]);


    // Initialize data operations following original Data class pattern
    // The original Data class is initialized with grid instance and service locator
    // We need to pass the grid instance to useData, not just the dataSource
    const gridInstance: {
        dataSource: DataManager | DataResult;
        query: Query;
        columns: ColumnProps<T>[];
        aggregates: AggregateRowProps[];
        sortSettings: SortSettings;
        filterSettings: FilterSettings;
        searchSettings: SearchSettings;
        pageSettings: PageSettings;
        getPrimaryKeyFieldNames: () => string[];
        onDataRequest: (args: DataRequestEvent) => void;
        onDataChangeRequest: (args: DataChangeRequestEvent<T>) => void;
    } = useMemo(() => ({
        dataSource,
        query,
        columns: uiColumns ?? columns,
        aggregates,
        sortSettings: sortModule?.sortSettings,
        filterSettings: filterModule?.filterSettings,
        searchSettings: searchModule?.searchSettings,
        pageSettings,
        currentPage,
        getPrimaryKeyFieldNames,
        onDataRequest: props.onDataRequest,
        onDataChangeRequest: props.onDataChangeRequest
    }), [props.dataSource, query, sortSettings?.enabled, filterModule?.filterSettings?.enabled,
        pageSettings?.enabled, sortModule?.sortSettings, searchModule?.searchSettings?.enabled, uiColumns,
        columns, filterModule?.filterSettings, searchModule?.searchSettings, pageSettings, currentPage]);

    const dataOperations: UseDataResult<T> = useData<T>(gridInstance, gridAction, dataState);
    const dataModule: UseDataResult<T> = dataOperations;

    const editModule: editModule<T> = useEdit<T>(
        gridRef,
        serviceLocator,
        uiColumns ?? columns,
        currentViewData,
        dataModule,
        focusModule,
        selectionModule,
        props.editSettings as EditSettings<T>,
        setGridAction,
        setCurrentPage,
        setResponseData
    );

    // Initialize toolbar module if toolbar is configured
    // Pass modules directly to avoid context provider issues during initial rendering
    const toolbarModule: ToolbarAPI | null = useToolbar(
        {
            toolbar: props.toolbar,
            gridId: id,
            onToolbarItemClick: props.onToolbarItemClick,
            className: cssClass
        },
        editModule,
        selectionModule,
        currentViewData,
        searchSettings?.enabled
    );

    const isStopPropagationPreventDefault:
    (e: MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement> | FocusEvent<HTMLDivElement>) => boolean =
        useCallback((e: MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement> | FocusEvent<HTMLDivElement>) => {
            return e.defaultPrevented && e.isPropagationStopped();
        }, []);

    const handleGridClick: (e: MouseEvent) => void = useCallback(async (e: MouseEvent<HTMLDivElement>) => {
        props?.onClick?.(e);
        const toolbarAction: boolean = props?.toolbar?.length
            && (e.target as HTMLElement)?.closest('.sf-toolbar')?.parentElement === gridRef.current.element;
        const datePicker: boolean = (e.target as HTMLElement)?.closest('.sf-datepicker')?.classList.contains('sf-popup-open');
        // Ensure grid is fully initialized before handling clicks
        // This fixes the initial rendering click issue
        if (isInitialLoad || !gridRef.current?.element || !currentViewData?.length || toolbarAction || datePicker ||
            editModule?.isDialogOpen) {
            if (toolbarAction) {
                focusModule.setGridFocus(false);
            }
            return;
        }

        editModule?.handleGridClick?.(e);

        if (e.defaultPrevented || e.isPropagationStopped()) {
            return;
        }
        // Handle selection FIRST and IMMEDIATELY, regardless of focus state
        // This ensures row selection happens on the first click, even when coming from outside grid focus
        selectionModule.handleGridClick(e);

        // Set grid focus AFTER selection to avoid interference
        // This prevents focus management from disrupting the selection process
        if (!focusModule.isGridFocused) {
            focusModule.setGridFocus(true);
        }
        if (allowKeyboard) {
            // Then handle focus management (but don't let it interfere with selection)
            focusModule.handleGridClick(e);
        }

        // Finally handle sorting (if applicable)
        sortModule?.handleGridClick?.(e);
    }, [focusModule, selectionModule, sortModule, editModule, isInitialLoad, gridRef, currentViewData, props.editSettings]);

    /**
     * Handle grid-level double-click event for editing
     * Single event handler at grid level instead of per-row handlers
     */
    const handleGridDoubleClick: (e: MouseEvent) => void = useCallback((e: MouseEvent<HTMLDivElement>) => {
        props?.onDoubleClick?.(e);
        // Ensure grid is fully initialized before handling double-clicks
        if (isInitialLoad || !gridRef.current?.element || !currentViewData?.length || isStopPropagationPreventDefault(e)) {
            return;
        }
        const target: Element = e.target as Element;
        const clickedCell: HTMLTableCellElement = target.closest('td[role="gridcell"], th[role="columnheader"]') as HTMLTableCellElement;
        // Only proceed if we clicked on a valid cell
        if (!clickedCell) {
            return;
        }
        editModule?.handleGridDoubleClick(e);
        const rowInfo: RowInfo<T> = gridRef.current?.getRowInfo(clickedCell);
        props.onRowDoubleClick?.({
            event: e,
            cell: rowInfo.cell,
            columnIndex: rowInfo.columnIndex,
            row: rowInfo.row,
            rowIndex: rowInfo.rowIndex,
            data: rowInfo.data,
            column: rowInfo.column
        } as RecordDoubleClickEvent<T>);
    }, [editModule, isInitialLoad, gridRef, currentViewData, props.editSettings]);

    const isEllipsisTooltip: boolean = useMemo((): boolean => {
        const col: ColumnProps<T>[] = uiColumns ?? columns;
        if (clipMode === 'EllipsisWithTooltip') {
            return true;
        }
        for (let i: number = 0; i < col.length; i++) {
            if (col[parseInt(i.toString(), 10)].clipMode === 'EllipsisWithTooltip') {
                return true;
            }
        }
        return false;
    }, [clipMode, uiColumns, columns]);

    /**
     * To create table for ellipsiswithtooltip
     *
     * @param {Element} table - Defines the table
     * @param {string} tag - Defines the tag
     * @param {string} type - Defines the type
     * @returns {HTMLDivElement} Returns the HTML div ELement
     * @private
     */
    const createTable: (table: Element, tag: string, type: string) => HTMLDivElement =
        useCallback((table: Element, tag: string, type: string) => {
            const myTableDiv: HTMLDivElement = createElement('div') as HTMLDivElement;
            myTableDiv.className = gridRef.current?.element.className;
            myTableDiv.style.cssText = 'display: inline-block;visibility:hidden;position:absolute';
            const mySubDiv: HTMLDivElement = createElement('div') as HTMLDivElement;
            mySubDiv.className = tag;
            const myTable: HTMLTableElement = createElement('table') as HTMLTableElement;
            myTable.className = table.className;
            myTable.style.cssText = 'table-layout: auto;width: auto';
            const ele: string = (type === 'Header') ? 'th' : 'td';
            const myTr: HTMLTableRowElement = createElement('tr', {
                attrs: { role: 'row' },
                className: type === 'Header' ? 'sf-grid-header-row' : 'sf-grid-content-row'
            }) as HTMLTableRowElement;
            const mytd: HTMLElement = createElement(ele) as HTMLElement;
            myTr.appendChild(mytd);
            myTable.appendChild(myTr);
            mySubDiv.appendChild(myTable);
            myTableDiv.appendChild(mySubDiv);
            document.body.appendChild(myTableDiv);
            return myTableDiv;
        }, []);

    const ellipsisTooltipEvaluateInfo: {
        htable: HTMLDivElement, ctable: HTMLDivElement,
        create: () => void;
        destroy: () => void
    } = useMemo(() => {
        let htable: HTMLDivElement;
        let ctable: HTMLDivElement;
        const create: () => void = () => {
            const headerTable: Element = gridRef.current?.getHeaderTable?.() ??
                gridRef.current?.element?.querySelector('.sf-grid-header-container table');
            const headerDivTag: string = 'sf-grid-header-container';
            const contentTable: Element = gridRef.current?.getContentTable?.() ??
                gridRef.current?.element?.querySelector('.sf-grid-content-container table');
            const contentDivTag: string = 'sf-grid-content-container';
            if (headerTable && !ellipsisTooltipEvaluateInfo?.htable) {
                ellipsisTooltipEvaluateInfo.htable = createTable(headerTable, headerDivTag, 'Header');
            }
            if (contentTable && !ellipsisTooltipEvaluateInfo?.ctable) {
                ellipsisTooltipEvaluateInfo.ctable = createTable(contentTable, contentDivTag, 'Content');
            }
        };
        const destroy: () => void = () => {
            if (document.body.contains(ellipsisTooltipEvaluateInfo.htable)) {
                document.body.removeChild(ellipsisTooltipEvaluateInfo.htable);
                ellipsisTooltipEvaluateInfo.htable = null;
            }
            if (document.body.contains(ellipsisTooltipEvaluateInfo.ctable)) {
                document.body.removeChild(ellipsisTooltipEvaluateInfo.ctable);
                ellipsisTooltipEvaluateInfo.ctable = null;
            }
        };
        return { htable, ctable, create, destroy };
    }, [currentViewData, editModule?.isEdit, clipMode, uiColumns]);

    /**
     * To evaluate sf-ellipsistooltip class required or not
     *
     * @param {HTMLElement} element - Defines the original cell reference element
     * @returns {boolean} Define whether sf-ellipsistooltip class required for cell or not.
     * @private
     */
    const evaluateTooltipStatus: (element: HTMLElement) => boolean =
        useCallback((element: HTMLElement): boolean => {
            if (!ellipsisTooltipEvaluateInfo.htable) {
                ellipsisTooltipEvaluateInfo.create();
            }
            const header: boolean = element?.parentElement?.classList?.contains?.('sf-grid-header-row');
            const table: HTMLDivElement = header ? ellipsisTooltipEvaluateInfo.htable :
                ellipsisTooltipEvaluateInfo.ctable;
            if (!table) {
                return false;
            }
            const ele: string = header ? 'th' : 'td';
            table.querySelector(ele).className = element?.className;
            const targetElement: HTMLElement = table.querySelector(ele);
            targetElement.innerHTML = '';
            Array.from(element?.childNodes).forEach((child: ChildNode) => {
                targetElement.appendChild(child.cloneNode(true));
            });
            const width: number = table.querySelector(ele).getBoundingClientRect().width;
            if (width > element?.getBoundingClientRect?.()?.width) {
                return true;
            }
            return false;
        }, [ellipsisTooltipEvaluateInfo]);

    const getEllipsisTooltipContent: () => string = useCallback(() => {
        return tooltipContent.current;
    }, [tooltipContent.current, uiColumns]);

    const handleGridMouseMove: (e: MouseEvent) => void = useCallback((e: MouseEvent) => {
        if (isEllipsisTooltip) {
            const element: HTMLElement = (e.target as Element)?.closest('.sf-ellipsistooltip') as HTMLElement;
            if (!element) {
                return;
            }
            if ((element || (e.relatedTarget as Element)?.closest?.('.sf-ellipsistooltip')) && e.type === 'mouseout' &&
                (ellipsisTooltipRef.current?.target?.current !== element ||
                    element !== (e.relatedTarget as Element)?.closest?.('.sf-ellipsistooltip') as HTMLElement)) {
                ellipsisTooltipRef.current?.closeTooltip?.();
            }
            const tagName: string = (e.target as Element).tagName;
            const elemNames: string[] = ['A', 'BUTTON', 'INPUT'];
            if (element && e.type !== 'mouseout' && !(Browser.isDevice && elemNames.indexOf(tagName) !== -1)) {
                if (element?.getElementsByClassName?.('sf-grid-header-text')?.length) {
                    const innerElement: HTMLElement = element.getElementsByClassName('sf-grid-header-text')[0] as HTMLElement;
                    tooltipContent.current = SanitizeHtmlHelper.sanitize(innerElement.innerText);
                } else {
                    tooltipContent.current = SanitizeHtmlHelper.sanitize(element?.innerText);
                }
                if (element !== ellipsisTooltipRef.current?.target?.current) {
                    ellipsisTooltipRef.current?.openTooltip?.(element);
                    requestAnimationFrame(() => {
                        const tooltipPopup: HTMLElement = document.body.querySelector('.sf-ellipsis-tooltip.sf-popup-close');
                        if (tooltipPopup) {
                            tooltipPopup.classList.remove('sf-popup-close'); // seems tooltip maintain class on rapid hover due to our element childNode text length detection delay.
                            tooltipPopup.classList.add('sf-popup-open');
                        }
                    });
                }
            }
        }
    }, [isEllipsisTooltip]);

    const handleGridMouseOut: (e: MouseEvent) => void = useCallback((e: MouseEvent<HTMLDivElement>) => {
        props?.onMouseOut?.(e);
        if (isStopPropagationPreventDefault(e)) { return; }
        handleGridMouseMove(e);
    }, [isEllipsisTooltip]);
    const handleGridMouseOver: (e: MouseEvent) => void = useCallback((e: MouseEvent<HTMLDivElement>) => {
        props?.onMouseOver?.(e);
        if (isStopPropagationPreventDefault(e)) { return; }
        handleGridMouseMove(e);
    }, [isEllipsisTooltip]);

    const handleGridMouseDown: (e: MouseEvent) => void = useCallback((e: MouseEvent<HTMLDivElement>) => {
        props?.onMouseDown?.(e);
        if (isStopPropagationPreventDefault(e)) { return; }
        focusModule.focusByClick = true;
        if ((e.target as Element).closest('.sf-grid-content-container,.sf-grid-header-container') && (e.shiftKey || e.ctrlKey)) {
            e.preventDefault();
        }
        filterModule?.mouseDownHandler?.(e);
    }, [focusModule, filterModule]);

    const handleGridFocus: (e: FocusEvent) => void = useCallback((e: FocusEvent<HTMLDivElement>) => {
        props?.onFocus?.(e);
        if ((pageSettings?.enabled && e.target?.closest('.sf-pager') && e.target.closest('.sf-pager').parentElement === gridRef.current.element)
        || (props?.toolbar?.length && e.target?.closest('.sf-toolbar')?.parentElement === gridRef.current.element) || isStopPropagationPreventDefault(e)
        || e.target.closest('#' + id + 'EditAlert')) {
            return;
        }
        // Check if grid is in edit mode to prevent focus interference
        const isGridInEditMode: boolean = editModule?.isEdit || false;

        // If grid is in edit mode, don't interfere with edit focus management
        // This prevents the focus from jumping to header cell when edit form regains focus
        if (isGridInEditMode) {
            // Just set grid focus state but don't move focus around
            if (focusModule && !focusModule.isGridFocused) {
                focusModule.setGridFocus(true);
            }
            return;
        }
        // When the grid receives focus, set grid focus state and focus first cell if needed
        if (focusModule && !focusModule.isGridFocused) {
            focusModule.setGridFocus(true);

            // Determine if focus is coming from before or after the grid
            const relatedTarget: HTMLElement = e.relatedTarget as HTMLElement;
            const gridElement: HTMLElement = gridRef.current.element;

            // Check if we can determine the focus direction
            let isForwardTabbing: boolean = true;

            if (relatedTarget) {
                // Try to determine if we're tabbing forward or backward
                // This is a heuristic and may not be 100% accurate in all cases
                const allFocusableElements: Element[] = Array.from(document.querySelectorAll(
                    'div.sf-grid, button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                ));

                const gridIndex: number = allFocusableElements.indexOf(gridElement);
                const relatedIndex: number = allFocusableElements.indexOf(relatedTarget);
                const targetIndex: number = allFocusableElements.indexOf(e.target);

                if (gridIndex > -1 && relatedIndex > -1) {
                    isForwardTabbing = relatedIndex < gridIndex;
                    if (gridElement.contains(relatedTarget) && targetIndex > -1) {
                        isForwardTabbing = relatedIndex < targetIndex;
                    }
                }
            }
            if (focusModule.focusByClick) {
                focusModule.focusByClick = false;
                return;
            } else {
                focusModule.focusByClick = false;
            }
            // Only navigate to a cell if no cell is currently focused
            const { getFocusedCell } = focusModule;
            const focusedCell: FocusedCellInfo = getFocusedCell();
            if (focusedCell.rowIndex === -1 && focusedCell.colIndex === -1 && gridRef.current.allowKeyboard) {
                if (!isForwardTabbing) {
                    focusModule.setActiveMatrix(aggregates?.length ? 'Aggregate' : 'Content');
                    const matrix: IFocusMatrix = focusModule.getActiveMatrix();
                    let lastCell: number[] = [matrix.rows, matrix.columns];
                    if (matrix.matrix[lastCell[0]][lastCell[1]] === 0) {
                        lastCell = matrix.findCellIndex(lastCell, false);
                    }
                    matrix.current = lastCell;
                    focusModule.focus();
                    return;
                } else {
                    // When tabbing forward into grid, focus first header cell
                    // But only if we have header content, otherwise focus first content cell
                    if (headerRowCount > 0) {
                        // Use requestAnimationFrame to ensure the DOM is ready
                        requestAnimationFrame(() => {
                            // Focus the first cell when tabbing forward into the grid
                            focusModule.navigateToFirstCell();
                        });
                    } else {
                        // No header, focus first content cell
                        focusModule.setActiveMatrix('Content');
                        requestAnimationFrame(() => {
                            focusModule.focus();
                        });
                    }
                }
            }
        } else if (focusModule && focusModule.focusByClick) {
            focusModule.focusByClick = false;
        }
    }, [focusModule, editModule, headerRowCount]);

    const handleGridBlur: (e: FocusEvent) => void = useCallback((e: FocusEvent<HTMLDivElement>) => {
        props?.onBlur?.(e);
        if ((props?.toolbar?.length && e.target?.closest('.sf-toolbar')?.parentElement === gridRef.current.element) ||
            isStopPropagationPreventDefault(e)) {
            return;
        }
        // Check if grid is in edit mode to prevent focus interference
        const isGridInEditMode: boolean = editModule?.isEdit || false;

        // If grid is in edit mode, don't interfere with edit focus management
        // This prevents the focus from jumping to header cell when edit form regains focus
        if (isGridInEditMode) {
            // Just set grid focus state but don't move focus around
            if (focusModule && !focusModule.isGridFocused) {
                focusModule.setGridFocus(true);
            }
            return;
        }

        // When the grid loses focus, update grid focus state
        // Only if focus is truly moving outside the grid
        if (focusModule && focusModule.isGridFocused) {
            // Check if focus is staying within the grid or related elements
            const relatedTarget: HTMLElement = e.relatedTarget as HTMLElement;

            // Don't remove focus if:
            // 1. Focus is moving to another element within the grid
            // 2. Focus is moving to a grid popup
            // 3. Focus is moving to a specific element that should maintain grid focus
            let isStayingInGrid: boolean | Element = (e.target && (e.target as HTMLElement).closest('#' + id + '_toolbar')) ||
                e.target?.closest('.sf-datepicker') ||
                // Focus moving to another element within the grid
                (e.currentTarget.contains(relatedTarget) ||
                    // Focus moving to a grid popup
                    (relatedTarget && relatedTarget.closest('.sf-grid-popup')) ||
                    // Focus still within the grid (using document.activeElement)
                    document.activeElement && document.activeElement.closest('.sf-grid')) as boolean;
            isStayingInGrid = relatedTarget && relatedTarget.closest('.sf-pager') ? false : isStayingInGrid;
            if (!isStayingInGrid) {
                // Clear focus completely when leaving the grid
                focusModule.clearIndicator();
                focusModule.removeFocus();
                focusModule.setGridFocus(false);
            }
        }
    }, [focusModule]);

    const handleGridKeyUp: (e: React.KeyboardEvent) => void = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
        props?.onKeyUp?.(e);
        if (isStopPropagationPreventDefault(e)) {
            return;
        }
        if (e.keyCode !== 13) {
            filterModule?.keyUpHandler?.(e as React.KeyboardEvent);
        }
    }, [filterModule]);

    const handleGridKeyDown: (e: React.KeyboardEvent) => void = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
        props?.onKeyDown?.(e);
        // Check for cancellation or specific dropdown open condition
        const target: Element = e.target as Element;
        const isDropdownOpenCondition: boolean = editModule?.isEdit &&
                                      target?.closest('.sf-grid-edit-form') &&
                                      (target?.closest('.sf-ddl') || target?.closest('.sf-datepicker')) &&
                                      e.altKey &&
                                      e.code === 'ArrowDown';
        if (isStopPropagationPreventDefault(e) || isDropdownOpenCondition || editModule?.isDialogOpen) {
            e.preventDefault();
            e.stopPropagation();
            return; // Early return to prevent further processing
        }
        sortModule?.keyUpHandler?.(e as React.KeyboardEvent);
        if (sortModule && e.keyCode === 13 && closest(e.target as Element, '.sf-grid-header-row .sf-cell')) {
            return;
        }
        const pageAction: boolean = pageSettings?.enabled && (e.target as HTMLElement)?.closest('.sf-pager')
            && (e.target as HTMLElement).closest('.sf-pager').parentElement === gridRef.current.element;
        const toolbarAction: boolean = props?.toolbar?.length &&
            (e.target as HTMLElement)?.closest('.sf-toolbar')?.parentElement === gridRef.current.element;
        if ((e.key === 'Shift' && e.shiftKey) || (e.key === 'Control' && e.ctrlKey) || pageAction || toolbarAction) { return; }

        // Enhanced keyboard action handling based on original TypeScript implementation
        // This implements comprehensive keyboard actions including Insert and Delete keys
        const isMacLike: boolean = /(Mac)/i.test(navigator.platform);

        const editForm: HTMLElement | null = (e.target as HTMLElement)?.closest('.sf-grid-edit-form');
        // Handle edit-specific keyboard events first
        if (props.editSettings?.allowEdit || props.editSettings?.allowAdd || props.editSettings?.allowDelete) {

            // Insert key or Mac Cmd+Enter to add record
            if ((e.key === 'Insert' || (isMacLike && e.metaKey && e.key === 'Enter')) &&
                props.editSettings?.allowAdd && !editModule?.isEdit) {
                e.preventDefault();
                editModule?.addRecord?.();
                return;
            }

            // Delete key to delete selected record
            if (e.key === 'Delete' && props.editSettings?.allowDelete && !editModule?.isEdit) {
                const target: HTMLElement = e.target as HTMLElement;
                // Safety checks: ignore if focus is on input elements (except checkboxes)
                const isInputFocused: boolean = target.tagName === 'INPUT' && !target.classList.contains('sf-checkselect');
                const isDialogOpen: Element = document.querySelector('.sf-popup-open.sf-edit-dialog');

                if (!isInputFocused && !isDialogOpen) {
                    e.preventDefault();
                    editModule?.deleteRecord?.();
                    return;
                }
            }

            // F2 key to start editing
            if (e.key === 'F2' && !editModule?.isEdit) {
                e.preventDefault();
                editModule?.editRecord?.();
                return;
            }

            // Enter key to save changes (when in edit mode)
            if (e.key === 'Enter' && editModule?.isEdit) {
                const target: HTMLElement = e.target as HTMLElement;
                // Only handle if not in input field or specific grid context
                if (!target.closest('.sf-unboundcelldiv') &&
                    (target.closest('.sf-grid-content-container') || target.closest('.sf-grid-header-content')) && editForm) {
                    e.preventDefault();
                    editModule.escEnterIndex.current = parseInt((e.target as HTMLElement)?.closest('td')?.getAttribute('aria-colindex'), 10) - 1;
                    (editModule?.saveDataChanges as Function)?.(undefined, undefined, 'Key');
                    return;
                }
            }

            // Escape key to cancel editing
            if (e.key === 'Escape' && editModule?.isEdit && editForm) {
                e.preventDefault();
                editModule.escEnterIndex.current = parseInt((e.target as HTMLElement)?.closest('td')?.getAttribute('aria-colindex'), 10) - 1;
                (editModule?.cancelDataChanges as Function)?.('Key');
                return;
            }
        }

        const isGridInEditMode: boolean = editModule?.isEdit || false;
        if (isGridInEditMode && e.key === 'Tab' && editForm) {
            if (editForm) {
                const tabEvent: CustomEvent = new CustomEvent('editCellTab', {
                    detail: {
                        field: getColumnByUid((e.target as HTMLElement)?.closest('td')?.getAttribute('data-mappinguid')).field,
                        direction: e.shiftKey ? 'backward' : 'forward',
                        originalEvent: e
                    }
                });
                editForm?.dispatchEvent(tabEvent);
            }
            return;
        }

        // Handle keyboard navigation
        filterModule?.keyUpHandler?.(e as React.KeyboardEvent);
        const { getFocusInfo } = focusModule;
        const focusedCell: FocusedCellInfo = getFocusInfo();
        // Check if we're on the first header cell and pressing Shift+Tab
        const isFirstHeaderCell: boolean = focusedCell.isHeader &&
            focusedCell.rowIndex === focusModule.firstFocusableHeaderCellIndex?.[0] &&
            focusedCell.colIndex === focusModule.firstFocusableHeaderCellIndex?.[1];
        const isShiftTab: boolean = e.key === 'Tab' && e.shiftKey;

        // Check if we're on the last content cell and pressing Tab
        const isLastContentCell: boolean = !focusedCell.isHeader && !aggregates?.length &&
            focusedCell.rowIndex === focusModule.lastFocusableContentCellIndex?.[0] &&
            focusedCell.colIndex === focusModule.lastFocusableContentCellIndex?.[1];
        const isLastAggregateCell: boolean = focusedCell.isAggregate &&
            focusedCell.rowIndex === focusModule.lastFocusableAggregateCellIndex?.[0] &&
            focusedCell.colIndex === focusModule.lastFocusableAggregateCellIndex?.[1];
        const isTab: boolean = e.key === 'Tab' && !e.shiftKey;

        // If we're on the first header cell and pressing Shift+Tab, or
        // on the last content cell and pressing Tab, let the default behavior happen
        if ((isFirstHeaderCell && isShiftTab) || ((isLastContentCell || isLastAggregateCell) && isTab)) {
            // Clear focus completely
            focusModule.clearIndicator();
            focusModule.removeFocus();
            focusModule.setGridFocus(false);

            // Don't prevent default to allow natural tab navigation
            return;
        }

        // Otherwise, handle navigation normally
        focusModule.handleKeyDown(e);
    }, [focusModule, filterModule, props.editSettings, editModule]);

    useEffect(() => {
        if (allowKeyboard) {
            document.body.addEventListener('keydown', keyDownHandler);
        }
        return () => {
            if (allowKeyboard) {
                document.body.removeEventListener('keydown', keyDownHandler);
            }
        };
    }, [allowKeyboard]);

    // Initialize grid and handle cleanup
    useEffect(() => {
        // Set up focus management when grid mounts
        // Set the first focusable element's tabIndex to 0
        focusModule.setFirstFocusableTabIndex();
        preRender('grid');
        if (props.onGridInit) {
            props.onGridInit(); // trigger only once on initial render, once Dom element mounted.
        }
        isInitialBeforePaint.current = false;
        return () => {
            props.onGridDestroy?.();
            setCurrentViewData(null);
            isInitialBeforePaint.current = null;
            setInitialLoad(null);
        };
    }, []);

    useEffect(() => {
        isInitialBeforePaint.current = false;
    }, [columnsDirective]);

    // Only update the ref if props has meaningfully changed
    useEffect(() => {
        stableRest.current = props;
    }, [props]); // we might use a custom comparison for props here to avoid re-render.

    /**
     * Private API for internal grid operations
     */
    const privateAPI: GridResult<T>['privateAPI'] = useMemo(() => ({
        styles,
        isEllipsisTooltip,
        setCurrentViewData,
        setInitialLoad,
        handleGridClick,
        handleGridDoubleClick,
        handleGridMouseDown,
        handleGridMouseOut,
        handleGridMouseOver,
        getEllipsisTooltipContent,
        handleGridFocus,
        handleGridBlur,
        handleGridKeyDown,
        handleGridKeyUp,
        setCurrentPage,
        setTotalRecordsCount,
        setGridAction
    }), [styles, setCurrentViewData, handleGridClick, handleGridDoubleClick, setCurrentPage, setTotalRecordsCount,
        setGridAction, handleGridMouseDown, handleGridMouseOut, handleGridMouseOver, getEllipsisTooltipContent]);

    /**
     * Public API exposed to consumers of the grid
     * Always keep memorized public APIs for Grid component context provider
     * This will prevent unnecessary re-rendering of child components
     * These are for readonly purpose - if a property needs to be updated,
     * it should not be included here but in the protected API
     */
    const publicAPI: IGrid<T> = useMemo(() => ({
        ...stableRest.current,
        getVisibleColumns,
        getColumnByUid,
        getColumnByField,
        getData,
        getHiddenColumns,
        getRowInfo,
        getPrimaryKeyFieldNames,
        setRowData,
        setCellValue,
        serviceLocator,
        className,
        dataSource: dataOperations.dataManager,
        id,
        height,
        children,
        clipMode,
        width,
        enableRtl,
        enableHover,
        selectionSettings,
        gridLines,
        filterSettings: filterModule?.filterSettings,
        sortSettings: sortModule?.sortSettings,
        searchSettings: searchModule?.searchSettings,
        pageSettings,
        textWrapSettings,
        enableHtmlSanitizer,
        enableStickyHeader,
        rowHeight,
        enableAltRow,
        columns,
        locale,
        query,
        emptyRecordTemplate,
        rowTemplate,
        aggregates,
        editSettings: props.editSettings,
        allowKeyboard
    } as IGrid<T>), [
        getVisibleColumns,
        getColumnByUid,
        getColumnByField,
        getData,
        getHiddenColumns,
        getRowInfo,
        getPrimaryKeyFieldNames,
        setRowData,
        setCellValue,
        serviceLocator,
        className,
        dataOperations.dataManager,
        id,
        height,
        children,
        clipMode,
        width,
        enableRtl,
        enableHover,
        selectionSettings,
        gridLines,
        filterModule?.filterSettings,
        sortModule?.sortSettings,
        searchModule?.searchSettings,
        pageSettings,
        textWrapSettings,
        enableHtmlSanitizer,
        enableStickyHeader,
        rowHeight,
        enableAltRow,
        columns,
        locale,
        query,
        emptyRecordTemplate,
        rowTemplate,
        aggregates,
        allowKeyboard,
        props
    ]);

    /**
     * Protected API for internal grid components
     */
    const protectedAPI: Partial<MutableGridBase<T>> = useMemo(() => ({
        currentViewData,
        columnsDirective,
        headerRowDepth,
        colElements,
        isInitialLoad,
        focusModule,
        selectionModule,
        getParentElement,
        evaluateTooltipStatus,
        sortModule,
        searchModule,
        filterModule,
        editModule,
        toolbarModule,
        currentPage,
        totalRecordsCount,
        gridAction,
        isInitialBeforePaint,
        uiColumns,
        cssClass,
        responseData,
        setResponseData,
        dataModule
    }), [currentViewData, columnsDirective, headerRowDepth, colElements, isInitialLoad, focusModule, selectionModule, getParentElement,
        sortModule, searchModule, filterModule, editModule, sortSettings, searchSettings, evaluateTooltipStatus, uiColumns,
        currentPage, totalRecordsCount, gridAction, isInitialBeforePaint, cssClass, responseData, setResponseData, dataModule]);

    useEffect(() => {
        gridRef.current = {
            ...gridRef.current,
            ...publicAPI,
            // Ensure currentViewData is always up-to-date in gridRef
            currentViewData: currentViewData
        };
        ellipsisTooltipEvaluateInfo.destroy();
    }, [publicAPI, currentViewData, ellipsisTooltipEvaluateInfo]);

    return { privateAPI, publicAPI, protectedAPI };
};
