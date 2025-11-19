import {
    CSSProperties,
    useCallback,
    useEffect,
    useMemo,
    useState,
    ReactNode,
    ReactElement,
    JSX,
    Children,
    isValidElement,
    RefObject,
    useRef
} from 'react';
import {
    IValueFormatter,
    PendingState, MutableGridSetter, UseRenderResult
} from '../types/interfaces';
import {
    IGrid,
    IGridBase,
    GridRef } from '../types/grid.interfaces';
import { ColumnProps, IColumnBase, PrepareColumns } from '../types/column.interfaces';
import { AggregateRowProps, AggregateColumnProps } from '../types/aggregate.interfaces';
import { DateFormatOptions, extend, formatUnit, isNullOrUndefined, NumberFormatOptions } from '@syncfusion/react-base';
import { DataManager, DataResult, ReturnType } from '@syncfusion/react-data';
import { Column, ColumnBase } from '../components';
import {
    useGridComputedProvider,
    useGridMutableProvider
} from '../contexts';
import { defaultColumnProps } from '../hooks';
import { Columns, RenderBase, Aggregates } from '../views';
import { addLastRowBorder, compareSelectedProperties, getObject, setFormatter } from '../utils';
import { ActionType, FilterEvent, PageEvent, SearchEvent, SortEvent } from '../types';

/**
 * CSS class names used in the component
 */
const CSS_CLASS_NAMES: Record<string, string> = {
    VISIBLE: '',
    HIDDEN: 'none'
};

/**
 * Custom hook to manage rendering state and data for the grid
 *
 * @private
 * @returns {UseRenderResult} Object containing APIs for grid rendering
 */
export const useRender: <T>() => UseRenderResult<T> = <T, >(): UseRenderResult<T> => {
    const grid: Partial<GridRef<T>> & Partial<MutableGridSetter<T>> = useGridComputedProvider<T>();
    const { setCurrentViewData, setInitialLoad, setTotalRecordsCount, aggregates, pageSettings,
        height, contentPanelRef, contentTableRef, sortSettings } = grid;
    const { currentViewData, currentPage, gridAction, uiColumns, isInitialLoad,
        setResponseData, dataModule, totalRecordsCount } = useGridMutableProvider<T>();

    const [isLayoutRendered, setIsLayoutRendered] = useState<boolean>(false);
    const [isContentBusy, setIsContentBusy] = useState<boolean>(true);
    const isColTypeDef: RefObject<boolean> = useRef(false);

    /**
     * Get data operations from the grid's dataModule
     * This ensures single source of truth for DataManager across all components
     */
    const dataManager: DataManager | DataResult = dataModule?.dataManager;
    const generateQuery: Function = dataModule?.generateQuery;
    /**
     * Compute content styles based on grid height
     */
    const contentStyles: CSSProperties = useMemo<CSSProperties>(() => ({
        height: formatUnit(grid.height as string | number),
        overflowY: grid.height === 'auto' ? 'auto' : 'scroll'
    }), [grid.height]);

    const updateColumnTypes: (data: Object) => void = useCallback((data: Object) => {
        let value: string | number | boolean | Object;
        (uiColumns ?? grid.columns).map((newColumn: Partial<IColumnBase<T>>) => {
            if (isNullOrUndefined(newColumn.field)) {
                return newColumn;
            }
            // update column type, format, parser, and other first dataSource based properties here
            value = getObject(newColumn.field, data);
            if (!isNullOrUndefined(value)) {
                isColTypeDef.current = true;
                if (!newColumn.type) {
                    newColumn.type = value instanceof Date && value.getDay ? (value.getHours() > 0 || value.getMinutes() > 0 ||
                        value.getSeconds() > 0 || value.getMilliseconds() > 0 ? 'datetime' : 'date') : typeof (value);
                }
            } else {
                newColumn.type = newColumn.type || null;
            }
            const valueFormatter: IValueFormatter = grid.serviceLocator?.getService<IValueFormatter>('valueFormatter');
            if (newColumn.format && ((newColumn.format as DateFormatOptions).skeleton
                || ((newColumn.format as DateFormatOptions).format &&
                    typeof (newColumn.format as DateFormatOptions).format === 'string'))) {
                // Store the formatter and parser functions directly on the new object
                newColumn.formatFn = valueFormatter.getFormatFunction(extend({}, newColumn.format as DateFormatOptions));
                newColumn.parseFn = valueFormatter.getParserFunction(newColumn.format as DateFormatOptions);
            }
            if (newColumn.sortComparer) {
                let a: Function = newColumn.sortComparer;
                newColumn.sortComparer = (x: number | string, y: number | string, xObj?: Object, yObj?: Object) => {
                    if (typeof a === 'string') {
                        a = getObject(a, window) as Function;
                    }
                    if (newColumn.sortDirection === 'Descending') {
                        const z: number | string = x as number | string;
                        x = y;
                        y = z;
                        const obj: Object = xObj;
                        xObj = yObj;
                        yObj = obj;
                    }
                    return a(x, y, xObj, yObj, newColumn.sortDirection);
                };
            }
            if (typeof (newColumn.format) === 'string') {
                setFormatter(grid.serviceLocator, newColumn);
            } else if (!newColumn.format && newColumn.type === 'number') {
                newColumn.parseFn = valueFormatter.getParserFunction({ format: 'n2' } as NumberFormatOptions);
            }
            if (newColumn.type === 'dateonly' && !newColumn.format) {
                newColumn.format = 'yMd';
                setFormatter(grid.serviceLocator, newColumn);
            }
            return newColumn;
        });
    }, [grid.columns, uiColumns]);

    /**
     * Handle successful data retrieval
     */
    const dataManagerSuccess: (response: Response | ReturnType) => void = useCallback((response: Response | ReturnType): void => {
        const data: ReturnType = response as ReturnType;
        if (!data?.result?.length && data.count && grid.pageSettings?.enabled
            && gridAction.requestType !== ActionType.Paging) {
            if (Object.keys(gridAction).length) {
                delete gridAction.cancel;
                if (gridAction.requestType === ActionType.Filtering || gridAction.requestType === ActionType.ClearFiltering) {
                    gridAction.type = 'filtered';
                    grid.onFilter?.(gridAction);
                } else if (gridAction.requestType === ActionType.Searching) {
                    gridAction.type = 'searched';
                    grid.onSearch?.(gridAction);
                }
            }
            grid.goToPage(Math.ceil(data.count / grid.pageSettings.pageSize));
            return;
        }
        if (grid.pageSettings?.enabled) {
            grid.pagerModule?.goToPage(currentPage);
            setTotalRecordsCount(data.count);
        }
        setResponseData(data);

        if (grid.onDataLoadStart) {
            grid.onDataLoadStart(data);
        }
        grid.clearSelection();
        setCurrentViewData(data.result as T[]);
        if (!isColTypeDef.current && data.result.length > 0) {
            updateColumnTypes(data.result[0]);
        }
        setIsLayoutRendered(true);
    }, [grid.onDataLoadStart, setCurrentViewData, gridAction]);

    /**
     * Handle data retrieval failure
     */
    const dataManagerFailure: (error: Error) => void = useCallback((error: Error): void => {
        setIsContentBusy(false);
        grid.onError?.(error);
    }, [grid.onError]);

    /**
     * Show the loading spinner
     */
    const showSpinner: () => void = useCallback(() => {
        setIsContentBusy(true);
    }, []);

    /**
     * Hide the loading spinner
     */
    const hideSpinner: () => void = useCallback(() => {
        setIsContentBusy(false);
    }, []);

    /**
     * Refresh data from the data manager
     */
    const refreshDataManager: () => void = useCallback((): void => {
        setIsContentBusy(true);
        showSpinner();
        if (dataModule.dataState.current.isPending) {
            dataModule.dataState.current.resolver(dataManager);
            if (dataModule.dataState.current.isEdit) {
                dataManagerSuccess(dataManager as ReturnType);
            }
            dataModule.dataState.current = { isPending: false, resolver: undefined, isEdit: false };
        } else {
            const dataManagerPromise: Promise<Object> = dataModule.getData(gridAction, generateQuery().requiresCount());
            dataManagerPromise.then(dataManagerSuccess).catch(dataManagerFailure);
        }
    }, [dataManager, grid.query, dataManagerSuccess, dataManagerFailure, grid.showSpinner, currentPage,
        aggregates, gridAction, grid.filterSettings, grid.sortSettings,  grid.searchSettings, pageSettings.pageSize]);

    // Initial data load
    useMemo(() => {
        refreshDataManager();
    }, [dataManager, grid.query, grid.columns, currentPage, aggregates, pageSettings?.enabled,
        grid.filterSettings, grid.sortSettings,  grid.searchSettings, pageSettings.pageSize]);

    useMemo(() => {
        updateColumnTypes(grid?.getCurrentViewRecords?.()?.[0]);
    }, [uiColumns]);

    // Handle layout rendered state
    useEffect(() => {
        if (isLayoutRendered) {
            hideSpinner();
            if (grid.onDataLoad) {
                grid.onDataLoad();
            }
            if (height !== 'auto' && (contentPanelRef?.firstElementChild as HTMLElement)?.offsetHeight > contentTableRef?.scrollHeight) {
                addLastRowBorder(contentTableRef, grid.editSettings);
            }
            if (isInitialLoad) {
                grid?.onGridRenderComplete?.();
            }
            if (Object.keys(gridAction).length) {
                delete gridAction.cancel;
                if (gridAction.requestType === ActionType.Filtering || gridAction.requestType === ActionType.ClearFiltering) {
                    gridAction.type = 'filtered';
                    const eventArgs: FilterEvent = {
                        action: (gridAction as FilterEvent).action,
                        columns: (gridAction as FilterEvent).columns,
                        currentFilterColumn: (gridAction as FilterEvent).currentFilterColumn,
                        currentFilterPredicate: (gridAction as FilterEvent).currentFilterPredicate
                    };
                    grid.onFilter?.(eventArgs);
                } else if (gridAction.requestType === ActionType.Sorting || gridAction.requestType === ActionType.ClearSorting) {
                    gridAction.type = 'sorted';
                    const eventArgs: SortEvent = {
                        direction: (gridAction as SortEvent).direction,
                        field: (gridAction as SortEvent).field,
                        event: (gridAction as SortEvent).event,
                        action: gridAction.requestType,
                        columns: sortSettings.columns
                    };
                    grid.onSort?.(eventArgs);
                } else if (gridAction.requestType === ActionType.Searching) {
                    gridAction.type = 'searched';
                    const eventArgs: SearchEvent = {
                        value: (gridAction as SearchEvent).value
                    };
                    grid.onSearch?.(eventArgs);
                } else if (gridAction.requestType === ActionType.Paging) {
                    gridAction.type = 'pageChanged';
                    const eventArgs: PageEvent = {
                        currentPage: (gridAction as PageEvent).currentPage,
                        previousPage: (gridAction as PageEvent).previousPage,
                        totalRecordsCount: totalRecordsCount
                    };
                    grid.onPageChange?.(eventArgs);
                } else if (gridAction.requestType === 'Refresh') {
                    gridAction.type = 'refreshed';
                    grid.onRefresh?.();
                }
                gridAction.type = 'actionComplete';
            }
            const actionCompleteEvent: CustomEvent = new CustomEvent('actionComplete');
            grid.element.dispatchEvent(actionCompleteEvent);
            setIsContentBusy(false);
            setInitialLoad(false);
        }
    }, [isLayoutRendered, currentViewData]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            setIsContentBusy(false);
            setIsLayoutRendered(null); // Reset state on unmount
        };
    }, []);

    // Memoize APIs to prevent unnecessary re-renders
    const publicRenderAPI: Partial<IGrid<T>> = useMemo(() => ({ ...grid }), [grid]);

    const privateRenderAPI: UseRenderResult<T>['privateRenderAPI'] = useMemo(() => ({
        contentStyles,
        isLayoutRendered,
        isContentBusy
    }), [contentStyles, isLayoutRendered, isContentBusy]);

    const protectedRenderAPI: UseRenderResult<T>['protectedRenderAPI'] = useMemo(() => ({
        refresh: refreshDataManager,
        showSpinner,
        hideSpinner
    }), [refreshDataManager]);

    return {
        publicRenderAPI,
        privateRenderAPI,
        protectedRenderAPI
    };
};

/**
 * Generate a unique key for a column
 *
 * @param {ColumnProps} columnProps - Column properties
 * @param {string} index - Index path for uniqueness
 * @param {string} prefix - Optional prefix for the key
 * @returns {string} Unique key for the column
 */
const generateUniqueKey: (columnProps: ColumnProps, index: string, prefix?: string) => string =
    (columnProps: ColumnProps, index: string, prefix: string = ''): string => {
        // Use field if available, otherwise use headerText, or fallback to index
        const baseKey: string = columnProps.field || columnProps.headerText || 'col';
        // Add a unique suffix based on the index path to ensure uniqueness
        return `${prefix}${baseKey}-${index}`;
    };

/**
 * Type definition for keys to compare in column objects
 * Improves type safety and provides better auto-completion
 */
type ColumnCompareKeys = Array<keyof ColumnProps>;
type AggregateColumnCompareKeys = Array<keyof AggregateColumnProps>;

/**
 * Get relevant column properties that should trigger change detection
 * This allows for better performance by only comparing properties that matter
 *
 * @returns {ColumnCompareKeys} - Data Affecting column properties comparison keys
 */
function getDataColumnCompareKeys(): ColumnCompareKeys {
    return [
        'allowSort', 'allowFilter', 'allowSearch', 'columns'
    ];
}

/**
 * Get relevant column properties that should trigger change detection
 * This allows for better performance by only comparing properties that matter
 *
 * @returns {ColumnCompareKeys} - UI Affecting column properties comparison keys
 */
function getUIColumnCompareKeys(): ColumnCompareKeys {
    return [
        'textAlign', 'headerTextAlign', 'disableHtmlEncode', 'clipMode', 'customAttributes', 'format', 'displayAsCheckBox', 'allowEdit',
        'templateSettings', 'edit', 'width', 'visible', 'headerText', 'template', 'headerTemplate', 'editTemplate',
        'valueAccessor'
    ];
}

/**
 * Get relevant aggregate column properties that should trigger change detection
 * This allows for better performance by only comparing properties that matter
 *
 * @returns {AggregateColumnCompareKeys} - Data Affecting aggregate column properties comparison keys
 */
function getAggregateColumnCompareKeys(): AggregateColumnCompareKeys {
    return [
        'type', 'format', 'columnName', 'field'
    ];
}

/**
 * Prepare columns from children or column definitions
 *
 * @param {Object[]} children - Child elements or column definitions
 * @param {number} parentDepth - Current depth in the column hierarchy
 * @param {string} parentIndex - Index path for uniqueness
 * @param {ColumnProps[]} prevColumns - previous columns which is used to compare old and new and detect whether customer changed state is related to column or not.
 * @returns {Object} Object containing columns, depth, children, and column group elements
 */
const prepareColumns: <T>(
    children: ReactNode | (ColumnProps<T> | ReactElement)[],
    parentDepth?: number,
    parentIndex?: string,
    prevColumns?: ColumnProps<T>[]
) => {
    columns: ColumnProps<T>[];
    depth: number;
    children: ReactNode;
    colGroup: JSX.Element[];
    isColumnChanged: boolean;
    isUIColumnpropertiesChanged: boolean;
} = <T, >(
    children: ReactNode | (ColumnProps<T> | ReactElement)[],
    parentDepth: number = 0,
    parentIndex: string = '',
    prevColumns?: ColumnProps<T>[]
): {
    columns: ColumnProps<T>[];
    depth: number;
    children: ReactNode;
    colGroup: JSX.Element[];
    isColumnChanged: boolean;
    isUIColumnpropertiesChanged: boolean;
} => {
    let maxDepth: number = parentDepth;
    let isColumnChanged: boolean = false; // currently used/handled always column state changed manner even unrelated state change props.children changed.
    let isUIColumnpropertiesChanged: boolean = false;
    const columns: ColumnProps<T>[] = [];
    const adjustedChildren: ReactNode[] = [];
    const colGroup: JSX.Element[] = [];
    const childArray: ReactElement[] = Array.isArray(children)
        ? children as ReactElement[]
        : Children.toArray(children) as ReactElement[];

    for (let i: number = 0; i < childArray.length; i++) {
        const child: ReactElement = childArray[i as number];
        const currentIndex: string = parentIndex ? `${parentIndex}-${i}` : `${i}`;

        if (isValidReactElement(child) && (
            child.type === ColumnBase ||
            child.type === RenderBase ||
            child.type === Columns ||
            child.type === Column
        )) {
            const columnProps: ColumnProps<T> = defaultColumnProps<T>(child.props as ColumnProps<T>);
            // Generate a unique key for the column
            const columnKey: string = generateUniqueKey(columnProps, currentIndex);

            if (child.type === ColumnBase || child.type === Column) {
                // Check for and process nested columns
                if ((child.props as { children: ReactNode })?.children) {
                    const childContents: {
                        columns: ColumnProps<T>[];
                        depth: number;
                        children: ReactNode;
                        colGroup: JSX.Element[];
                        isColumnChanged: boolean;
                        isUIColumnpropertiesChanged: boolean;
                    } = prepareColumns<T>(
                        (child.props as { children: ReactElement })?.children,
                        parentDepth + 1,
                        currentIndex,
                        prevColumns
                    );
                    isColumnChanged = childContents.isColumnChanged;
                    isUIColumnpropertiesChanged = childContents.isUIColumnpropertiesChanged;
                    columns.push({ ...columnProps, columns: childContents.columns }); // Nest child columns
                    colGroup.push(...childContents.colGroup); // Gather col elements from child columns
                    maxDepth = Math.max(maxDepth, childContents.depth);
                } else {
                    if (prevColumns?.[i as number]?.field === columnProps.field) {
                        // Only compare specific properties that should trigger a change
                        const hasChanged: boolean = isColumnChanged || !compareSelectedProperties(
                            prevColumns?.[i as number],
                            columnProps,
                            getDataColumnCompareKeys()
                        );
                        // Update isColumnChanged if any changes detected
                        isColumnChanged = isColumnChanged || hasChanged;
                        const hasUIChanged: boolean = isColumnChanged || !compareSelectedProperties(
                            prevColumns?.[i as number],
                            columnProps,
                            getUIColumnCompareKeys()
                        );
                        isUIColumnpropertiesChanged = isUIColumnpropertiesChanged || hasUIChanged;
                    }
                    columns.push(columnProps);

                    // Only create col elements for leaf columns
                    colGroup.push(
                        <col
                            key={`col-${columnKey}-${Math.random().toString(36).substr(2, 9)}`}
                            style={{
                                width: columnProps.width,
                                display: columnProps.visible || isNullOrUndefined(columnProps.visible)
                                    ? CSS_CLASS_NAMES.VISIBLE
                                    : CSS_CLASS_NAMES.HIDDEN
                            }}
                        />
                    );
                }

                adjustedChildren.push(
                    <ColumnBase<T> key={`col-base-${columnKey}`} {...columnProps}>
                        {(child.props as { children: ReactElement })?.children}
                    </ColumnBase>
                );
            } else if (child.type === RenderBase || child.type === Columns) {
                const {
                    columns: childColumns,
                    depth,
                    colGroup: childColGroup,
                    children,
                    isColumnChanged: isChildrenColumnsChanged,
                    isUIColumnpropertiesChanged: isChildrenColumnsUIChanged
                } = prepareColumns<T>(
                    (child.props as { children: ReactElement })?.children,
                    parentDepth,
                    currentIndex,
                    prevColumns
                );
                isColumnChanged = isChildrenColumnsChanged;
                isUIColumnpropertiesChanged = isChildrenColumnsUIChanged;
                columns.push(...childColumns);
                colGroup.push(...childColGroup);
                adjustedChildren.push(
                    ((children as ReactElement).props as { children: ReactElement[] })?.children
                );
                maxDepth = Math.max(maxDepth, depth);
            }
        } else if (isColumnObject(child)) {
            const columnObject: ColumnProps<T> = defaultColumnProps<T>(child as ColumnProps<T>);
            const columnKey: string = generateUniqueKey(columnObject, currentIndex, 'obj-');

            if (prevColumns?.[i as number]?.field === columnObject.field) {
                // Only compare specific properties that should trigger a change
                const hasChanged: boolean = isColumnChanged || !compareSelectedProperties(
                    prevColumns?.[i as number],
                    columnObject,
                    getDataColumnCompareKeys()
                );
                // Update isColumnChanged if any changes detected
                isColumnChanged = isColumnChanged || hasChanged;
                const hasUIChanged: boolean = isColumnChanged || !compareSelectedProperties(
                    prevColumns?.[i as number],
                    columnObject,
                    getUIColumnCompareKeys()
                );
                isUIColumnpropertiesChanged = isUIColumnpropertiesChanged || hasUIChanged;
            }
            columns.push(columnObject);
            adjustedChildren.push(<ColumnBase<T> key={columnKey} {...columnObject} />);

            // Generate col element for object definitions
            colGroup.push(
                <col
                    key={`col-${columnKey}-${Math.random().toString(36).substr(2, 9)}`}
                    style={{
                        width: columnObject.width,
                        display: columnObject.visible || isNullOrUndefined(columnObject.visible)
                            ? CSS_CLASS_NAMES.VISIBLE
                            : CSS_CLASS_NAMES.HIDDEN
                    }}
                />
            );
        }
    }

    if (maxDepth === parentDepth) {
        maxDepth++;
    }

    return {
        columns,
        depth: maxDepth,
        children: <RenderBase<T> key={'Columns'}>{adjustedChildren}</RenderBase>,
        colGroup,
        isColumnChanged,
        isUIColumnpropertiesChanged
    };
};

/**
 * Helper function to check if an element is a valid React element
 *
 * @param {ReactNode} element - Element to check
 * @returns {boolean} true if the element is a valid React element
 */
const isValidReactElement: (element: ReactNode) => element is ReactElement = (element: ReactNode): element is ReactElement => {
    return isValidElement(element);
};

/**
 * Helper function to check if an object is a column model
 *
 * @param {ColumnProps | ReactNode} child - Object to check
 * @returns {boolean} true if the object is a column model
 */
function isColumnObject(child: ColumnProps | ReactNode): child is ColumnProps {
    return !isValidReactElement(child as ReactElement) &&
        typeof child === 'object' &&
        child !== null &&
        'field' in child;
}

/**
 * Custom hook to process columns from props
 *
 * @param {Partial<IGridBase>} props - Grid properties
 * @param {RefObject<GridRef>} gridRef - Grid reference object properties
 * @param {RefObject<PendingState>} dataState - Data state object properties
 * @param {RefObject<boolean>} isInitialBeforePaint - UI column properties changes not trigger event purpose boolean
 * @returns {Partial<IGridBase>} Updated grid properties with processed columns
 */
export const useColumns: <T>(props: Partial<IGridBase<T>>, gridRef: RefObject<GridRef<T>>, dataState?: RefObject<PendingState>,
    isInitialBeforePaint?: RefObject<boolean>) =>
Partial<IGridBase<T>> & { uiColumns: ColumnProps<T>[] } =
    <T, >(props: Partial<IGridBase<T>>, gridRef: RefObject<GridRef<T>>, dataState?: RefObject<PendingState>,
        isInitialBeforePaint?: RefObject<boolean>): Partial<IGridBase<T>> & { uiColumns: ColumnProps<T>[] } => {
        const prevPrepareColumns: RefObject<PrepareColumns<T>> = useRef({} as PrepareColumns<T>);
        const isNoColumnRemoteData: boolean = useMemo(() => {
            return !props.columns && !props.children && props.dataSource instanceof DataManager && props.dataSource.dataSource.url
                && Array.isArray(gridRef.current?.currentViewData) && gridRef.current?.currentViewData?.length > 0;
        }, [props.children, props.columns, props.dataSource, gridRef.current?.currentViewData]);
        const { children, depth: headerRowDepth, columns, colGroup, uiColumns } = useMemo(() => {
            if (dataState.current.isPending) {
                return prevPrepareColumns.current;
            }
            const result: PrepareColumns<T> = prepareColumns<T>(
                props.columns as ColumnProps<T>[] ??
                props.children ??
                ((Array.isArray(props.dataSource) && (props.dataSource as Object[]).length > 0)
                    ? Object.keys((props.dataSource as Object[])[0])
                        .map((key: string) => ({
                            field: key,
                            headerText: key
                        }))
                    : ((Array.isArray(gridRef.current?.currentViewData) && gridRef.current?.currentViewData?.length > 0)
                        ? Object.keys(gridRef.current?.currentViewData[0])
                            .map((key: string) => ({
                                field: key,
                                headerText: key
                            }))
                        : undefined)
                ), null, null, gridRef.current?.columns as ColumnProps<T>[]
            );
            if (!result.isColumnChanged && gridRef.current?.columns) {
                if (result.isUIColumnpropertiesChanged || prevPrepareColumns.current?.columns?.length !== result.columns?.length) {
                    isInitialBeforePaint.current = true;
                    return {
                        ...prevPrepareColumns.current,
                        uiColumns: result.columns,
                        children: result.children,
                        colGroup: result.colGroup
                    };
                } else {
                    return prevPrepareColumns.current;
                }
            }
            prevPrepareColumns.current = result;
            return result; // content refresh with dataManager request and triggering events.
        }, [props.children, props.columns, props.dataSource, isNoColumnRemoteData]);

        return useMemo(() => ({
            columns,
            uiColumns,
            headerRowDepth,
            children,
            colElements: colGroup
        }), [columns, uiColumns, headerRowDepth]);
    };

const generateDirectiveAggregates: (props: { children?: ReactNode }) => AggregateRowProps[] =
    (props: { children?: ReactNode }): AggregateRowProps[] => {
        const aggregates: AggregateRowProps[] = [];
        const rowArray: ReactElement[] = Array.isArray(props.children)
            ? props.children as ReactElement[]
            : Children.toArray(props.children) as ReactElement[];
        for (let i: number = 0; i < rowArray.length; i++) {
            const aggregateRow: AggregateRowProps = { columns: [] };
            const childRow: AggregateRowProps = rowArray[parseInt(i.toString(), 10)].props;
            if (childRow.columns) {
                aggregateRow.columns = childRow.columns;
            } else if (childRow.children) {
                const aggregateColumns: AggregateColumnProps[] = [];
                const columnArray: ReactElement[] = Array.isArray(childRow.children)
                    ? childRow.children as ReactElement[]
                    : Children.toArray(childRow.children) as ReactElement[];
                for (let j: number = 0; j < columnArray.length; j++) {
                    const column: AggregateColumnProps = columnArray[parseInt(j.toString(), 10)].props;
                    aggregateColumns.push({...column});
                }
                aggregateRow.columns = aggregateColumns;
            }
            aggregates.push(aggregateRow);
        }
        return aggregates;
    };

const prepareAggregates: <T>(aggregates: AggregateRowProps[], gridRef: RefObject<GridRef<T>>) => boolean =
<T, >(aggregates: AggregateRowProps[], gridRef: RefObject<GridRef<T>>): boolean => {
    let isAggregateColumnsChanged: boolean = false;
    for (let i: number = 0; i < aggregates?.length; i++) {
        const columns: AggregateColumnProps<T>[] = aggregates[parseInt(i.toString(), 10)].columns;
        for (let j: number = 0; j < columns.length; j++) {
            if (!columns[parseInt(j.toString(), 10)].columnName) {
                if (gridRef.current?.aggregates?.[i as number]?.columns?.[j as number]?.columnName === columns[j as number].columnName
                ) {
                    // Only compare specific properties that should trigger a change
                    const hasChanged: boolean = !compareSelectedProperties(
                        gridRef.current?.aggregates?.[i as number]?.columns?.[j as number],
                        columns[j as number],
                        getAggregateColumnCompareKeys()
                    );
                    // Update isColumnChanged if any changes detected
                    isAggregateColumnsChanged = isAggregateColumnsChanged || hasChanged;
                }
                columns[parseInt(j.toString(), 10)].columnName = columns[parseInt(j.toString(), 10)].field;
            }
        }
    }
    return isAggregateColumnsChanged;
};

export const useAggregates: <T>(props: Partial<IGridBase<T>>, gridRef?: RefObject<GridRef<T>>) => AggregateRowProps[] =
    <T, >(props: Partial<IGridBase<T>>, gridRef?: RefObject<GridRef<T>>): AggregateRowProps[] => {
        let aggregates: AggregateRowProps[] = [];
        let isAggregateColumnsChanged: boolean = false;
        const childArray: ReactElement[] = Array.isArray(props.children)
            ? props.children as ReactElement[]
            : Children.toArray(props.children) as ReactElement[];
        const directiveAggregates: ReactElement = childArray.find((child: ReactElement) => {
            return child && child.type === Aggregates;
        });
        if (props.aggregates) {
            aggregates = useMemo(() => props.aggregates, [props.aggregates]);
        } else if (directiveAggregates) {
            aggregates = useMemo(() => generateDirectiveAggregates(directiveAggregates.props), [props.children]);
        }
        isAggregateColumnsChanged = prepareAggregates<T>(aggregates, gridRef);
        return useMemo(() => {
            if (isAggregateColumnsChanged) {
                return aggregates;
            } else {
                return gridRef.current?.aggregates;
            }
        }, [isAggregateColumnsChanged]);
    };
