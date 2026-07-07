import { RefObject, useCallback, useMemo } from 'react';
import {
    Action, DataChangeRequestEvent, DataRequestEvent,
    payload,
    MutableGridBase, PendingState,
    ScrollMode,
    AggregateType,
    UseAggregateSelectionResult,
    SortDirection,
    ActionType,
    GroupSettings
} from '../types';
import { SortDescriptor } from '../types/sort.interfaces';
import { GridActionEvent, IGrid } from '../types/grid.interfaces';
import { FilterPredicates } from '../types/filter.interfaces';
import { ColumnProps } from '../types/column.interfaces';
import { AggregateColumnProps, AggregateRowProps } from '../types/aggregate.interfaces';
import { SearchSettings } from '../types/search.interfaces';
import { MutableGridSetter, UseDataResult } from '../types/interfaces';
import { extend, isNullOrUndefined} from '@syncfusion/react-base';
import { AdaptorOptions, DataManager, Predicate, Query, DataResult, Deferred, UrlAdaptor } from '@syncfusion/react-data';
import { getPredicate } from '../utils';

// Constants for query operations
const QUERY_FUNCTION_KEY: string = 'fn';
const QUERY_SKIP_OPERATION: string = 'onSkip';
const QUERY_PAGE_OPERATION: string = 'onPage';
const REQUEST_TYPE_DELETE: string = 'Delete';
const REQUEST_TYPE_SAVE: string = 'save';
const REQUEST_TYPE_UPDATE: string = 'update';
const REQUEST_TYPE_FILTER_CHOICE: string = 'filterChoiceRequest';
const DATA_REQUEST_EVENT_NAME: string = 'onDataRequest';

/**
 * Custom hook to manage data operations for the grid
 *
 * @param {Object} [gridInstance] Grid instance reference
 * @param {Object} [gridAction] Grid action object (for dispatching actions)
 * @param {RefObject<PendingState>} [dataState] - Data state object properties
 * @param {Map<string, string>} [groupCaptionAggregateType] - Map of aggregate fields and types for group captions
 * @returns {UseDataResult} Object containing APIs for data operations
 * @private
 */
export const useData: <T>(gridInstance?: Partial<IGrid<T>> & Partial<MutableGridSetter<T>>, gridAction?: Object,
    dataState?: RefObject<PendingState>, groupCaptionAggregateType?: Map<string, string | AggregateType[] | string[]>,
    groupCaptionAggregateQuery?: Query) => UseDataResult<T> = <T>(
    gridInstance?: Partial<IGrid<T>> & Partial<MutableGridSetter<T>>, gridAction?: Object, dataState?: RefObject<PendingState>,
    groupCaptionAggregateType?: Map<string, AggregateType[] | string[]>
): UseDataResult<T> => {
    const grid: Partial<IGrid<T>> & Partial<MutableGridSetter<T>> & Partial<MutableGridBase<T>> = gridInstance;
    const dataManager: DataManager | DataResult = useMemo(() => {
        const gridDataSource: DataManager | DataResult = grid.dataSource as DataManager | DataResult;
        return gridDataSource;
    }, [grid?.dataSource]);

    /**
     * Check if the data source is remote
     */
    const isRemote: () => boolean = useCallback((): boolean => {
        return dataManager instanceof DataManager && dataManager.dataSource &&
            typeof dataManager.dataSource === 'object' &&
            'offline' in dataManager.dataSource &&
            'url' in dataManager.dataSource &&
            dataManager.dataSource.offline !== true &&
            dataManager.dataSource.url !== undefined &&
            dataManager.dataSource.url !== '';
    }, [dataManager]);

    /**
     * The function is used to generate updated Query from Grid model.
     *
     * @returns {Query} returns the Query
     * @private
     */
    const generateQuery: () => Query = useCallback((): Query => {
        const query: Query = grid?.query?.clone();
        sortQuery(query);
        filterQuery(query);
        searchQuery(query);
        aggregateQuery(query);
        groupQuery(query);
        pageQuery(query);
        return query;
    }, [grid, gridAction]);

    const sortQuery: (query: Query) => Query = useCallback((query: Query): Query => {
        if ((grid?.sortSettings?.enabled && grid.sortSettings?.columns?.length) ||
            (grid?.groupSettings?.enabled && grid.groupSettings?.columns?.length && grid.groupSettings?.autoSort)) {
            const columns: SortDescriptor[] = grid.sortSettings?.columns ?? [];
            const sortGrp: SortDescriptor[] = [];
            for (let i: number = columns.length - 1; i > -1; i--) {
                const col: ColumnProps<T> = (grid.columns as ColumnProps<T>[]).find((c: ColumnProps<T>) =>
                    c.field === columns[parseInt(i.toString(), 10)].field);
                if (col) {
                    col.sortDirection = columns[parseInt(i.toString(), 10)]?.direction;
                    let fn: Function | string = columns[parseInt(i.toString(), 10)].direction;
                    if (col.sortComparer) {
                        fn = !isRemote() ? (col.sortComparer as Function).bind(col) : columns[parseInt(i.toString(), 10)].direction;
                    }
                    if (!grid.groupSettings?.enabled ||
                        grid.groupSettings.columns?.indexOf(columns[parseInt(i.toString(), 10)].field) === -1) {
                        if (col.sortComparer) {
                            query.sortByForeignKey(col.field, fn, undefined, columns[parseInt(i.toString(), 10)].direction.toLowerCase());
                        } else {
                            query.sortBy(col.field, fn);
                        }
                    } else {
                        sortGrp.push({ direction: <SortDirection>fn, field: col.field });
                    }
                }
            }
            for (let i: number = 0; i < sortGrp.length; i++) {
                if (typeof sortGrp[parseInt(i.toString(), 10)].direction === 'string') {
                    query = query.sortBy(sortGrp[parseInt(i.toString(), 10)].field, sortGrp[parseInt(i.toString(), 10)].direction);
                }
            }
        }
        return query;
    }, [grid?.sortSettings, grid?.sortSettings?.enabled, grid?.groupSettings?.columns, grid?.groupSettings?.enabled]);

    const grabColumnByFieldFromAllCols: (field: string) => ColumnProps<T> = (field: string): ColumnProps<T> => {
        let column: ColumnProps<T>;
        const gCols: ColumnProps<T>[] = grid.columns as ColumnProps<T>[];
        for (let i: number = 0; i < gCols?.length; i++) {
            if (field === gCols[parseInt(i.toString(), 10)].field) {
                column = gCols[parseInt(i.toString(), 10)];
                break;
            }
        }
        return column;
    };

    const filterQuery: (query: Query) => Query = useCallback((query: Query): Query => {
        const predicateList: Predicate[] = [];
        if (grid.filterSettings?.enabled && grid.filterSettings?.columns?.length) {
            const gObj: Partial<IGrid<T>> & Partial<MutableGridSetter<T>> = grid;
            const columns: FilterPredicates[] = grid.filterSettings?.columns;
            const colType: Object = {};
            for (const col of gObj.columns as ColumnProps<T>[]) {
                colType[col.field] = grid?.filterSettings?.type;
            }
            const defaultFltrCols: FilterPredicates[] = [];
            for (const col of columns) {
                const gridColumn: ColumnProps<T> = (gObj.columns as ColumnProps<T>[]).find((c: ColumnProps<T>) => c.field === col.field);
                if (isNullOrUndefined(col.type) && gridColumn && (gridColumn.type === 'dateonly' || gridColumn.type === 'datetime' || gridColumn.type === 'date')) {
                    col.type = (gObj.columns.find((c: ColumnProps<T>) => c.field === col.field)).type;
                }
                defaultFltrCols.push(col);
            }
            for (let i: number = 0, len: number = defaultFltrCols.length; i < len; i++) {
                const columnFromField: ColumnProps<T> = grabColumnByFieldFromAllCols(defaultFltrCols[parseInt(i.toString(), 10)].field);
                defaultFltrCols[parseInt(i.toString(), 10)].uid = defaultFltrCols[parseInt(i.toString(), 10)].uid ||
                    columnFromField?.uid;
            }
            const excelPredicate: Predicate = getPredicate(defaultFltrCols, undefined, isRemote() && (dataManager instanceof DataManager) ? ((dataManager as DataManager).adaptor as { getModuleName?: Function })?.getModuleName?.() ?? 'UrlAdaptor' : undefined);
            for (const prop of Object.keys(excelPredicate)) {
                predicateList.push(<Predicate>excelPredicate[`${prop}`]);
            }
            query.where(Predicate.and(predicateList));
        }
        return query;
    }, [grid.filterSettings, grid.filterSettings.enabled]);

    const searchQuery: (query: Query) => Query = useCallback((query: Query): Query => {
        const predicateList: Predicate[] = [];
        if (grid.searchSettings?.enabled && !isNullOrUndefined(grid.searchSettings?.value) && grid.searchSettings?.value.length) {
            const sSettings: SearchSettings = grid.searchSettings;
            const fields: string[] = (!isNullOrUndefined(sSettings.fields) && sSettings.fields.length) ? sSettings.fields
                : getSearchColumnFieldNames();
            const dataManager: DataManager = grid?.dataSource instanceof DataManager ? grid.dataSource :
                new DataManager(grid?.dataSource as DataManager);
            const adaptor: AdaptorOptions = dataManager.adaptor;
            const adaptorWithMethod: { getModuleName?: Function } = adaptor as { getModuleName?: Function };
            if (adaptorWithMethod.getModuleName &&
                adaptorWithMethod.getModuleName() === 'ODataV4Adaptor') {
                for (let i: number = 0; i < fields.length; i++) {
                    predicateList.push(new Predicate(
                        fields[parseInt(i.toString(), 10)], sSettings.operator, grid.searchSettings?.value,
                        sSettings.caseSensitive, sSettings.ignoreAccent
                    ));
                }
                const predList: Predicate = Predicate.or(predicateList);
                predList.key = grid.searchSettings?.value;
                query.where(predList);
            } else {
                query.search(grid.searchSettings?.value, fields, sSettings.operator, sSettings.caseSensitive, sSettings.ignoreAccent);
            }
        }
        return query;
    }, [grid.searchSettings, grid.searchSettings?.enabled]);

    const aggregateQuery: (query: Query) => Query = useCallback((query: Query): Query => {
        const rows: AggregateRowProps[] = grid?.aggregates;
        const aggregateSelection: UseAggregateSelectionResult = grid?.aggregateSelection;
        for (let i: number = 0; rows && i < rows.length; i++) {
            const row: AggregateRowProps = rows[parseInt(i.toString(), 10)];
            for (let j: number = 0; j < row.columns.length &&
                !groupCaptionAggregateType?.has(row?.columns?.[parseInt(j.toString(), 10)]?.field); j++) {
                const cols: AggregateColumnProps<T> = row.columns[parseInt(j.toString(), 10)];
                const userSelectedAggregate: AggregateType = aggregateSelection?.getAggregate(i, cols.field);
                if (userSelectedAggregate) {
                    query.aggregate(userSelectedAggregate.toLowerCase(), cols.field);
                } else {
                    const types: string[] = cols.type instanceof Array ? cols.type : [cols.type];
                    for (let k: number = 0; k < types.length; k++) {
                        query.aggregate(types[parseInt(k.toString(), 10)].toLowerCase(), cols.field);
                    }
                }
            }
        }
        groupCaptionAggregateType.forEach((value: string[], key: string) => {
            value.forEach((aggType: string) => {
                query.aggregate(aggType.toLowerCase(), key);
            });
        });
        return query;
    }, [grid?.aggregates, grid?.aggregateSelection]);

    /**
     * Apply grouping to the query if groupSettings.enabled and columns are specified
     * Applies group() operation to Query for each group column defined in groupSettings
     */
    const groupQuery: (query: Query) => Query = useCallback((query: Query): Query => {
        const groupSettings: GroupSettings = grid?.groupSettings as GroupSettings;
        if (groupSettings?.enabled && groupSettings?.columns?.length > 0) {
            for (let i: number = 0; i < groupSettings.columns.length; i++) {
                const groupField: string = groupSettings.columns[parseInt(i.toString(), 10)];
                query.group(groupField);
            }
        }
        return query;
    }, [grid?.groupSettings]);

    const pageQuery: (query: Query) => Query = useCallback((query: Query): Query => {
        const currentPageVal: number = Math.max(1, grid?.currentPage);
        const isInfiniteTopPrevent: boolean = (gridAction as GridActionEvent).requestType === ActionType.Filtering ||
            (gridAction as GridActionEvent).requestType === ActionType.ClearFiltering ||
            (gridAction as GridActionEvent).requestType === ActionType.Searching ||
            (gridAction as GridActionEvent).requestType === ActionType.Sorting ||
            (gridAction as GridActionEvent).requestType === ActionType.ClearSorting;
        if (grid.scrollMode === ScrollMode.Infinite && ((((currentPageVal - 1) * grid.pageSettings.pageSize >=
            grid.totalRecordsCount) || isInfiniteTopPrevent) && grid.pageSettings.pageSizeControlledBy === 'server')) {
            if (query.queries.length) {
                for (let i: number = 0; i < query.queries.length; i++) {
                    if (query.queries[parseInt(i.toString(), 10)][`${QUERY_FUNCTION_KEY}`] === QUERY_SKIP_OPERATION) {
                        query.queries.splice(i, 1);
                    }
                }
            }
            query.skip((currentPageVal - 1) * grid.pageSettings.pageSize);
        } else if (grid.pageSettings?.enabled || grid.scrollMode === ScrollMode.Virtual || grid.scrollMode === ScrollMode.Infinite) {
            if (grid.pageSettings.pageCount <= 0) {
                grid.pageSettings.pageCount = 8;
            }
            if (grid.pageSettings.pageSize <= 0) {
                grid.pageSettings.pageSize = 12;
            }
            if (query.queries.length) {
                for (let i: number = 0; i < query.queries.length; i++) {
                    if (query.queries[parseInt(i.toString(), 10)][`${QUERY_FUNCTION_KEY}`] === QUERY_PAGE_OPERATION) {
                        query.queries.splice(i, 1);
                    }
                }
            }
            query.page(currentPageVal, grid.pageSettings.pageSize);
        }
        return query;
    }, [grid.pageSettings, grid?.currentPage, grid.pageSettings?.enabled, grid.scrollMode, gridAction]);

    const getSearchColumnFieldNames: () => string[] = (): string[] => {
        const colFieldNames: string[] = [];
        const columns: ColumnProps<T>[] = grid.columns as ColumnProps<T>[];
        for (const col of columns) {
            if (col.allowSearch && !isNullOrUndefined(col.field)) {
                colFieldNames.push(col.field);
            }
        }
        return colFieldNames;
    };

    const getData: (args?: { requestType?: string; data?: T; index?: number, payload?: payload},
        query?: Query) => Promise<Object> = useCallback(async (args: { requestType?: string; data?: T; index?: number,
        payload?: payload } = { requestType: '' }, query?: Query
    ): Promise<Object> => {
        // For Infinite mode with Unknown/Estimated, skip $count to prevent server errors
        const shouldRequireCount: boolean = !(grid.virtualizationSettings?.scrollMode === ScrollMode.Infinite);

        const currentQuery: Query = query || (
            shouldRequireCount ? generateQuery().requiresCount() : generateQuery()
        );
        const primaryKeys: string[] = grid.getPrimaryKeyFieldNames();
        const key: string = primaryKeys.length > 0 ? primaryKeys[0] : 'id';

        if (dataManager && 'result' in dataManager) {
            const def: Deferred = eventPromise(args, currentQuery, key);
            return def.promise;
        } else {
            switch (args.requestType) {
            case REQUEST_TYPE_DELETE: {
                if (Array.isArray(args.data)) {
                    // Multiple deletions
                    const changes: { addedRecords: T[]; deletedRecords: T[]; changedRecords: T[] } = {
                        addedRecords: [],
                        deletedRecords: args.data,
                        changedRecords: []
                    };
                    return (dataManager as DataManager).saveChanges(changes, key, currentQuery.fromTable, currentQuery.requiresCount()
                        , null, args.payload) as Promise<Object>;
                } else {
                    // Single deletion
                    return (dataManager as DataManager)
                        .remove(key, args.data, currentQuery.fromTable, currentQuery) as Promise<Object>;
                }
            }

            case REQUEST_TYPE_SAVE: {
                const index: number = isNullOrUndefined(args.index) ? 0 : args.index;
                return (dataManager as DataManager).insert(args.data, currentQuery.fromTable, currentQuery, index) as Promise<Object>;
            }

            case REQUEST_TYPE_UPDATE: {
                return (dataManager as DataManager).update(key, args.data, currentQuery.fromTable, currentQuery) as Promise<Object>;
            }

            default: {
                // Default query execution
                if ((dataManager as DataManager).ready) {
                    return (dataManager as DataManager).ready.then(() => {
                        return (dataManager as DataManager).executeQuery(currentQuery);
                    });
                } else {
                    return (dataManager as DataManager).executeQuery(currentQuery);
                }
            }
            }
        }
    }, [dataManager, generateQuery, grid.getPrimaryKeyFieldNames]);

    const getStateEventArgument: (query: Query) => DataRequestEvent = (query: Query): DataRequestEvent => {
        const adaptr: UrlAdaptor = new UrlAdaptor();
        const dm: DataManager = new DataManager({ url: '', adaptor: new UrlAdaptor });
        const state: { data?: string, pvtData?: Object[] } = adaptr.processQuery(dm, query);
        const data: Object = JSON.parse(state.data);
        return extend(data, state.pvtData);
    };

    const eventPromise: (args: { requestType?: string; data?: T; index?: number }, query: Query, key: string) => Deferred =
        useCallback((args: { requestType?: string; data?: T; index?: number }, query: Query, key: string): Deferred => {
            const def: Deferred = new Deferred();
            const requestType: Action = (gridAction as GridActionEvent).requestType;
            if (requestType !== undefined || args.requestType !== undefined) {
                const state: DataRequestEvent = getStateEventArgument(query);
                state.name = DATA_REQUEST_EVENT_NAME;
                if (args.requestType === REQUEST_TYPE_SAVE || args.requestType === REQUEST_TYPE_DELETE) {
                    const argsRef: {
                        requestType?: string; data?: T; rowData?: T; index?: number;
                        cancel?: boolean; previousData?: Object; type?: string; rows?: Element[];
                    } = { ...args };
                    delete argsRef.cancel;
                    delete argsRef.previousData;
                    delete argsRef.type;
                    delete argsRef.rows;
                    delete argsRef.index;
                    delete argsRef.requestType;
                    if (argsRef.rowData) {
                        argsRef.data = argsRef.rowData;
                        delete argsRef.rowData;
                    }
                    state.action = <{}>argsRef;
                    const deff: Deferred = new Deferred();
                    const editArgs: DataChangeRequestEvent<T> = argsRef;
                    editArgs.key = key;
                    editArgs.promise = deff.promise;
                    editArgs.state = state;
                    editArgs.saveDataChanges = deff.resolve;
                    editArgs.cancelDataChanges = deff.reject;
                    grid.onDataChangeRequest?.(editArgs);
                    deff.promise.then(() => {
                        dataState.current = { resolver: def.resolve, isEdit: true };
                        grid.onDataRequest?.(state);
                    }).catch(() => void 0);
                } else {
                    if (args.requestType === REQUEST_TYPE_FILTER_CHOICE) {
                        state.requestType = args.requestType;
                        state.dataSource = def.resolve;
                    } else {
                        state.action = gridAction;
                        dataState.current = { resolver: def.resolve };
                    }
                    grid.onDataRequest?.(state);
                }
            }
            return def;
        }, [gridAction, grid, dataManager]);

    return { generateQuery, dataManager, isRemote, getData, dataState, getStateEventArgument };
};
