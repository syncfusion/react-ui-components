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
    useRef,
    Dispatch,
    SetStateAction
} from 'react';
import {
    ESTIMATED_TOTAL_RECORDS_OVERRIDE_MESSAGE,
    SERVER_CLIENT_PAGE_SIZE_MISMATCH_MESSAGE,
    INITIAL_FILTER_SEARCH_PAGE_SIZE_MISMATCH_MESSAGE
} from '../constants/warnings';
import { PendingState, MutableGridSetter, UseRenderResult, ServiceLocator } from '../types/interfaces';
import { ChildInfoResult, GroupedData, OnGroupArgs, ShouldExpandGroupEvent } from '../types/grouping.interfaces';
import { IGrid, IGridBase, GridRef, GridProps } from '../types/grid.interfaces';
import { ColumnProps, PrepareColumns, IColumnBase, FlattenedColumn, PinDirectionInput } from '../types/column.interfaces';
import { formatUnit, isNullOrUndefined } from '@syncfusion/react-base/src/util';
import { Column, ColumnBase } from '../components/Column';
import { useGridComputedProvider, useGridMutableProvider } from '../contexts/GridProviders';
import { defaultColumnProps } from '../hooks/useColumn';
import { Columns, RenderBase } from '../views/Render';
import { compareSelectedProperties, getColumnByPath, getEffectiveOrderIndex, getGroupLayoutFlattedData, hasNestedColumns, isDynamicWidth, parseUnit, reorderStackedColumns, resolvePinDirection, updatePageWiseStartEndIndexes, updateUIColumnType } from '../utils/utils';
import { SortEvent } from '../types/sort.interfaces';
import { ActionType, AggregateType, ColumnPinDirection, ColumnType, ScrollMode, TextAlign } from '../types/enum';
import { FilterEvent } from '../types/filter.interfaces';
import { SearchEvent } from '../types/search.interfaces';
import { PageEvent } from '../types/page.interfaces';
import { DataResponse } from '../types/infinite-scroll.interface';
import { DataManager, DataResult, ReturnType, Query, DataOptions } from '@syncfusion/react-data';

import * as React from 'react';
import { ColumnWidthInfo } from '../types/resize.interfaces';
import { ReorderState } from '../types/reorder.interfaces';
import { useTreeData } from './useTreeData';
import { TreeGridRow } from '../types/treeData.interfaces';


/**
 * CSS class names used in the component
 */
const CSS_CLASS_NAMES: Record<string, string> = {
    VISIBLE: '',
    HIDDEN: 'none'
};

/**
 * Style object for col elements (prevents recreation on each render)
 */
const COL_ELEMENT_STYLE: CSSProperties = { display: CSS_CLASS_NAMES.VISIBLE };

const getColumnVisibilityKey: (column: Partial<ColumnProps>, index: string) => string =
    (column: Partial<ColumnProps>, index: string): string => column.field ? `field:${column.field}` :
        column.uid ? `uid:${column.uid}` : `index:${index}`;

/**
 * Custom hook to manage rendering state and data for the grid
 *
 * @private
 * @returns {UseRenderResult} Object containing APIs for grid rendering
 */
export const useRender: <T>() => UseRenderResult<T> = <T, >(): UseRenderResult<T> => {
    const grid: Partial<GridRef<T>> & Partial<MutableGridSetter<T>> = useGridComputedProvider<T>();
    const { setCurrentViewData, setInitialLoad, setTotalRecordsCount, aggregates, pageSettings,
        sortSettings, scrollModule, shouldExpandGroup, groupSettings, setGridAction, getPrimaryKeyFieldNames } = grid;
    const { currentViewData, currentPage, gridAction, isInitialLoad, virtualSettings, scrollMode, uiColumns, setResponseData,
        dataModule, totalRecordsCount, selectionModule, setVirtualCachedViewData, infiniteScrollState, setInfiniteScrollState,
        virtualCachedViewData, expandedGroupCountRef, groupModule, loadedPageWiseGroupExpandedCountRef, setPageWiseGroupResponseViewData,
        pageWiseGroupResponseViewData, loadedPageWiseVirtualGroupStartEndRowIndexes, groupCaptionAggregateType, treeDataSettings,
        treeModule, isOffline, formulaModule
    } = useGridMutableProvider<T>();
    const [skipInfiniteServerPageSizeAutoDetectChange, setSkipInfiniteServerPageSizeAutoDetectChange] = useState<boolean>(false);

    const [isContentBusy, setIsContentBusy] = useState<boolean>(true);
    const [isLayoutRendered, setIsLayoutRendered] = useState<boolean>(false);
    const isColTypeDef: RefObject<boolean> = useRef<boolean>(false);

    /**
     * Get data operations from the grid's dataModule
     * This ensures single source of truth for DataManager across all components
     */
    const dataManager: DataManager | DataResult = dataModule?.dataManager;
    const generateQuery: () => Query = dataModule?.generateQuery ?? (() => new Query());
    /**
     * Compute content styles based on grid height
     */
    const contentStyles: CSSProperties = useMemo<CSSProperties>(() => ({
        height: formatUnit(grid.height as string | number), // required inline element styles for responsive UI state update
        overflowY: grid.height === 'auto' ? (!virtualSettings.enableRow ? 'hidden' : 'auto') : 'scroll'
    }), [grid.height, virtualSettings.enableRow]);

    useMemo(() => {
        if ((scrollMode === ScrollMode.Virtual || scrollMode === ScrollMode.Infinite) &&
            !isNullOrUndefined(scrollModule?.isDataOperationPreventVirtualCache.current)) {
            scrollModule.isDataOperationPreventVirtualCache.current = true;
            loadedPageWiseGroupExpandedCountRef.current = new Map<number, number>();
            loadedPageWiseVirtualGroupStartEndRowIndexes.current = new Map<number, {startIndex: number, endIndex: number}>();
        }
    }, [grid.filterSettings?.columns, grid.filterSettings?.columns.length, grid.sortSettings?.columns,
        grid.sortSettings?.columns.length, grid.searchSettings?.value, scrollMode, grid.groupSettings?.groupSummaryPosition]);

    const updateColumnTypes: (data: Object) => void = useCallback((data: Object) => {
        while ('items' in data) {
            data = data['items']?.[0] as Object;
        }
        const columns: Partial<IColumnBase<T>>[] = uiColumns.current ?? grid.columns as Partial<IColumnBase<T>>[];
        if (!columns) {
            return;
        }
        const updateColumnType: (column: Partial<IColumnBase<T>>) => ColumnProps<T> = (
            column: Partial<IColumnBase<T>>
        ): ColumnProps<T> => {
            const updatedColumn: ColumnProps<T> = {
                ...updateUIColumnType(data, column, grid.serviceLocator, isColTypeDef, getPrimaryKeyFieldNames,
                                      formulaModule) as ColumnProps<T>
            };
            if (column.columns?.length) {
                updatedColumn.columns = column.columns.map((child: ColumnProps<T>) => updateColumnType(child));
            }
            return updatedColumn;
        };
        const updatedColumns: ColumnProps<T>[] = columns.map((column: Partial<IColumnBase<T>>) => updateColumnType(column));
        if (!uiColumns.current) {
            uiColumns.current = [];
        }
        uiColumns.current.splice(0, uiColumns.current.length, ...updatedColumns);
    }, [grid.columns, uiColumns.current]);

    /**
     * Handle successful data retrieval
     */
    const dataManagerSuccess: (response: Response | ReturnType) => void = useCallback((response: Response | ReturnType): void => {
        const data: ReturnType = response as ReturnType;
        if (!Array.isArray(data.result)) {
            return;
        }
        if (treeDataSettings?.enabled && isOffline && treeModule?.normalizedData.length === 0) {
            useTreeData(
                grid as RefObject<GridRef<TreeGridRow>>,
                setCurrentViewData as Dispatch<SetStateAction<(TreeGridRow[] | T[])>>,
                ((dataManager as DataManager).dataSource as DataOptions).json,
                treeDataSettings,
                pageSettings,
                grid.filterSettings,
                sortSettings,
                grid.searchSettings,
                setTotalRecordsCount as Dispatch<SetStateAction<number>>,
                currentPage as number,
                isOffline
            );
            const builtQuery: Query = generateQuery();
            const finalQuery: Query = !(scrollMode === ScrollMode.Infinite) ? builtQuery.requiresCount() : builtQuery;
            const result: ReturnType = treeModule?.generateTreeData(finalQuery);
            data.result = result.result;
            data.count = result.count;
        }
        const isVirtualOrInfinite: boolean = scrollMode === ScrollMode.Virtual || scrollMode === ScrollMode.Infinite;
        if (!data?.result?.length && data.count && (grid.pageSettings?.enabled || scrollMode === ScrollMode.Virtual)
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
        if (grid.pageSettings?.enabled || isVirtualOrInfinite) {
            grid.pagerRef?.goToPage(currentPage);
        }
        if (scrollMode !== ScrollMode.Infinite || data.count) {
            setTotalRecordsCount(data.count);
            if (isInitialLoad && grid.groupSettings?.enabled && isVirtualOrInfinite) {
                loadedPageWiseVirtualGroupStartEndRowIndexes.current =
                    updatePageWiseStartEndIndexes(data.count, pageSettings.pageSize, groupSettings, loadedPageWiseGroupExpandedCountRef);
            }
        }
        const isGroupWithColumns: boolean = !!(grid.groupSettings?.enabled && grid.groupSettings?.columns?.length);
        if (isGroupWithColumns) {
            const groupedData: GroupedData<T>[] = [...data.result as GroupedData<T>[]];
            if (isVirtualOrInfinite && scrollModule?.virtualRowInfo?.currentPages.length > 1) {
                const activePages: number[] = scrollModule.virtualRowInfo.currentPages; // e.g., [2, 3]
                setPageWiseGroupResponseViewData?.((prevMap: Map<number, GroupedData<T>[]>) => {
                    const newMap: Map<number, GroupedData<T>[]> = new Map<number, GroupedData<T>[]>();

                    if (!scrollModule?.isDataOperationPreventVirtualCache.current) {
                        // Retain data for active pages and build newViewData
                        for (const page of activePages) {
                            const prevData: GroupedData<T>[] = prevMap.get(page);
                            if (prevData) {
                                newMap.set(page, prevMap.get(page));
                            }
                        }
                    }
                    // Add new data for current page
                    newMap.set(pageSettings.currentPage, groupedData);

                    return newMap;
                });

            } else {
                // Single page virtual mode: reset everything only if cache not enabled
                setPageWiseGroupResponseViewData?.((prevMap: Map<number, GroupedData<T>[]>) => {
                    const newMap: Map<number, GroupedData<T>[]> = !virtualSettings.enableCache ||
                        scrollModule?.isDataOperationPreventVirtualCache.current ?
                        new Map<number, GroupedData<T>[]>() : prevMap;
                    newMap.set(pageSettings.currentPage, groupedData);
                    return newMap;
                });
            }
            const isInitialOrNotLoadedPage: boolean = isInitialLoad || !loadedPageWiseGroupExpandedCountRef.current.has(currentPage);
            const isUngroupAction: boolean = gridAction.requestType === ActionType.Grouping &&
                ((gridAction as OnGroupArgs).action === 'remove');
            const shouldExpand: GridProps<T>['shouldExpandGroup'] | ((event: ShouldExpandGroupEvent) => boolean) =
                (isInitialLoad || gridAction.requestType === ActionType.Paging || isUngroupAction || !pageWiseGroupResponseViewData?.size)
                && shouldExpandGroup && isInitialOrNotLoadedPage && !groupModule?.expandedGroups.has('ALL') &&
                    !groupModule?.collapsedGroups.has('ALL') ? shouldExpandGroup : (!shouldExpandGroup && isInitialOrNotLoadedPage ?
                        undefined : (event: ShouldExpandGroupEvent) => {
                            return groupModule?.expandedGroups.has('ALL') || (groupModule?.collapsedGroups.has('ALL') ? false :
                                (groupModule?.expandedGroups.has(event.groupKey as string) &&
                            !groupModule?.collapsedGroups.has(event.groupKey as string)));
                        });
            const childInfo: ChildInfoResult = getGroupLayoutFlattedData(
                data.result as GroupedData<T>[], shouldExpand, grid?.groupSettings?.groupSummaryPosition,
                groupCaptionAggregateType, grid.groupSettings, groupModule?.collapsedGroups);
            const rowsCount: number = (gridAction.requestType === ActionType.Paging && !isInitialLoad && isVirtualOrInfinite ?
                0 : ((isInitialLoad || gridAction.requestType !== ActionType.Paging) && isVirtualOrInfinite ?
                    data.count : data?.result?.length)) + childInfo.count;
            if (isInitialOrNotLoadedPage && !isNullOrUndefined(grid.groupSettings?.defaultExpanded) &&
                grid.groupSettings?.defaultExpanded === false && !shouldExpandGroup) {
                if (isVirtualOrInfinite) {
                    expandedGroupCountRef.current = data.count;
                } else {
                    expandedGroupCountRef.current = rowsCount;
                }
            } else {
                data.result = childInfo.currentViewData;
                if (isVirtualOrInfinite && gridAction.requestType === ActionType.Paging) {
                    if (!loadedPageWiseGroupExpandedCountRef.current.has(currentPage)) {
                        expandedGroupCountRef.current += rowsCount;
                    }
                } else {
                    expandedGroupCountRef.current = rowsCount;
                }
            }
            loadedPageWiseGroupExpandedCountRef.current.set(currentPage, childInfo.count);
            if (isVirtualOrInfinite) {
                loadedPageWiseVirtualGroupStartEndRowIndexes.current =
                    updatePageWiseStartEndIndexes(data.count, pageSettings.pageSize, groupSettings, loadedPageWiseGroupExpandedCountRef);
            }
            childInfo.fieldBasedExpandedGroupKeys?.forEach((keys: Set<string>, field: string) => {
                const existingExpandedKeys: Set<string> = childInfo.fieldBasedExpandedGroupKeys.get(field);
                if (existingExpandedKeys?.size) {
                    const newKeys: Set<string> = new Set([...keys, ...existingExpandedKeys]);
                    groupModule?.fieldBasedExpandedGroupKeysRef?.current?.set(field, newKeys);
                }
            });
            childInfo.fieldBasedCollapsedGroupKeys?.forEach((keys: Set<string>, field: string) => {
                const existingCollapsedKeys: Set<string> = childInfo.fieldBasedCollapsedGroupKeys.get(field);
                if (existingCollapsedKeys?.size) {
                    const newKeys: Set<string> = new Set([...keys, ...existingCollapsedKeys]);
                    groupModule?.fieldBasedCollapsedGroupKeysRef?.current?.set(field, newKeys);
                }
            });
            groupModule?.setExpandedGroups?.((prev: Set<string>) =>
                new Set([...prev, ...childInfo.expandedGroups]));
            groupModule?.setCollapsedGroups?.((prev: Set<string>) =>
                new Set([...prev, ...childInfo.collapsedGroups]));
        } else {
            setPageWiseGroupResponseViewData?.(new Map());
        }
        setResponseData(data);

        if (grid.onDataLoadStart) {
            grid.onDataLoadStart(data);
        }
        if (!grid.selectionSettings?.persistSelection) {
            grid.clearSelection();
        }

        let estimatedEndReached: boolean = false;
        if (scrollMode === ScrollMode.Infinite) {
            const dataAsRecord: DataResponse = ((data as unknown as {actual: Object}).actual ?? data) as DataResponse;
            const nextToken: string | null = (
                dataAsRecord['@odata.nextLink'] as string || // OData format
                dataAsRecord['next'] as string || // Custom REST API format
                dataAsRecord['continuationToken'] as string || // Azure APIs (Storage, Graph, Resource APIs)
                dataAsRecord['LastEvaluatedKey'] as string || // AWS APIs (DynamoDB, S3, etc.)
                dataAsRecord['next_page_token'] as string || // gRPC APIs
                (dataAsRecord['pageInfo'] as Record<string, unknown>)?.['endCursor'] as string ||
                null
            );

            // Determine end-of-data flag based on token and hasMore properties
            const pageInfo: typeof dataAsRecord.pageInfo = (dataAsRecord['pageInfo']) || {};
            const isEndReached: boolean = (isNullOrUndefined(nextToken) || nextToken === '') && dataAsRecord['hasMore'] !== true &&
                pageInfo['hasNextPage'] !== true;

            if (!infiniteScrollState.serverPageSize && data.result?.length && data.result.length !== pageSettings.pageSize &&
                !grid.filterSettings?.columns?.length && !grid.searchSettings.value?.length) { //&& pageSettings.pageSizeControlledBy === 'server') {
                setSkipInfiniteServerPageSizeAutoDetectChange(true);
            }

            if (!infiniteScrollState.isVirtualScrollRequest && !infiniteScrollState.isInfiniteEndReached) {
                setTotalRecordsCount((prev: number) => {
                    return prev + data.result.length;
                });
            }
            else if (scrollMode === ScrollMode.Infinite && (infiniteScrollState.serverPageSize || (!grid.filterSettings?.columns?.length &&
                !grid.searchSettings.value?.length && isInitialLoad)) && pageSettings?.estimatedTotalRecordsCount &&
                isEndReached && data.result?.length < pageSettings.pageSize && !infiniteScrollState.isInfiniteEndReached &&
                ((pageSettings.currentPage * pageSettings.pageSize) || 0) <= pageSettings.estimatedTotalRecordsCount) {
                if (grid.enableDevMode) {
                    console.warn(ESTIMATED_TOTAL_RECORDS_OVERRIDE_MESSAGE);
                }
                setTotalRecordsCount(virtualCachedViewData.size + data.result.length);
                estimatedEndReached = true;
            }
            if (grid.enableDevMode && !infiniteScrollState.serverPageSize && data.result?.length && !grid.filterSettings?.columns?.length &&
                !grid.searchSettings.value?.length && (pageSettings?.pageSize > data.result?.length ||
                    (pageSettings?.pageSizeControlledBy === 'server' && pageSettings?.pageSize !== data?.result?.length))) {
                console.warn(SERVER_CLIENT_PAGE_SIZE_MISMATCH_MESSAGE);
            } else if (grid.enableDevMode && !infiniteScrollState.serverPageSize && data.result?.length && isInitialLoad &&
                (pageSettings?.pageSize > data.result?.length || (pageSettings?.pageSizeControlledBy === 'server' &&
                    pageSettings?.pageSize !== data?.result?.length))) {
                console.warn(INITIAL_FILTER_SEARCH_PAGE_SIZE_MISMATCH_MESSAGE);
            }
            // Update infinite scroll state with token and end-reached flag
            setInfiniteScrollState((prevState: typeof infiniteScrollState) => ({
                ...prevState,
                nextContinuationToken: nextToken,
                serverPageSize: !prevState.serverPageSize && data.result?.length && !grid.filterSettings?.columns?.length &&
                    !grid.searchSettings.value?.length ? data.result.length : prevState?.serverPageSize, // Store server page size on initial load if provided
                isInfiniteEndReached: ((!infiniteScrollState.isVirtualScrollRequest || estimatedEndReached) && isEndReached) ||
                    prevState.isInfiniteEndReached,
                ...(estimatedEndReached ? {isVirtualScrollRequest: false} : {})
            }));
            // estimatedEndReached = infiniteScrollState.serverPageSize && estimatedEndReached ? true : false;
        }

        const currentPageGroupStartEndIndexInfo: {
            startIndex: number;
            endIndex: number;
        } = loadedPageWiseVirtualGroupStartEndRowIndexes.current?.get(pageSettings.currentPage);
        /**
         * Data manager success handler:
         * Updates virtual cache and current view data based on active pages.
         */
        if (isVirtualOrInfinite && scrollModule?.virtualRowInfo?.currentPages.length > 1) {
            const activePages: number[] = scrollModule.virtualRowInfo.currentPages; // e.g., [2, 3]
            const pageSize: number = pageSettings.pageSize;
            setVirtualCachedViewData((prevMap: Map<number, T>) => {
                const newMap: Map<number, T> = new Map<number, T>();
                const newViewData: T[] = [];

                if (!scrollModule?.isDataOperationPreventVirtualCache.current) {
                    // Retain data for active pages and build newViewData
                    for (const page of activePages) {
                        const pageInfo: {
                            startIndex: number;
                            endIndex: number;
                        } = loadedPageWiseVirtualGroupStartEndRowIndexes.current?.get(page);
                        const startKey: number = isGroupWithColumns ? pageInfo?.startIndex ?? 0 : ((page - 1) * pageSize);
                        const endKey: number = isGroupWithColumns ? pageInfo?.endIndex ?? expandedGroupCountRef.current :
                            startKey + pageSize;
                        for (let key: number = startKey; key < endKey; key++) {
                            if (prevMap.has(key)) {
                                const item: T = prevMap.get(key)!; // eslint-disable-line @typescript-eslint/no-non-null-assertion
                                newMap.set(key, item);
                                newViewData.push(item);
                            }
                        }
                    }
                }
                // Add new data for current page
                const startKey: number = isGroupWithColumns ? currentPageGroupStartEndIndexInfo?.startIndex ?? 0 :
                    ((pageSettings.currentPage - 1) * pageSize);
                for (let i: number = 0; i < data.result.length; i++) {
                    const item: T | GroupedData<T> = data.result[i as number] as T;
                    newMap.set(startKey + i, item);
                    newViewData.push(item);
                }

                if (!estimatedEndReached || isNullOrUndefined(infiniteScrollState.serverPageSize)) {
                    // Update currentViewData in the same loop
                    setCurrentViewData(newViewData);
                } else {
                    grid.hideSpinner();
                }

                return newMap;
            });

        } else {
            if (isVirtualOrInfinite) {
                // Single page virtual mode: reset everything only if cache not enabled
                setVirtualCachedViewData((prevMap: Map<number, T>) => {
                    const newMap: Map<number, T> = !virtualSettings.enableCache ||
                        scrollModule?.isDataOperationPreventVirtualCache.current ?
                        new Map<number, T>() : prevMap;
                    const startKey: number = isGroupWithColumns ? currentPageGroupStartEndIndexInfo?.startIndex ?? 0 :
                        ((pageSettings.currentPage - 1) * pageSettings.pageSize);
                    for (let i: number = 0; i < data.result.length; i++) {
                        newMap.set(startKey + i, data.result[i as number] as T);
                    }
                    return newMap;
                });
            }
            if (!estimatedEndReached || isNullOrUndefined(infiniteScrollState.serverPageSize)) {
                setCurrentViewData(data.result as T[]);
            } else {
                grid.hideSpinner();
            }
        }
        if (!isColTypeDef.current && data.result.length > 0) {
            updateColumnTypes(data.result[0]);
        }
        setIsLayoutRendered(true);
    }, [grid.onDataLoadStart, setCurrentViewData, gridAction, virtualSettings, scrollModule?.isDataOperationPreventVirtualCache,
        scrollMode, infiniteScrollState, grid?.groupSettings, setPageWiseGroupResponseViewData, shouldExpandGroup, isInitialLoad,
        loadedPageWiseGroupExpandedCountRef]);

    /**
     * Handle data retrieval failure
     */
    const dataManagerFailure: (error: Error) => void = useCallback((error: Error): void => {
        grid?.element?.setAttribute?.('aria-busy', 'false'); // To prevent react bad state update error dom manipulate along with state update which will reflect only through ref like useEffect.
        setIsContentBusy(false);
        grid.onError?.(error);
    }, [grid.onError]);

    /**
     * Show the loading spinner
     */
    const showSpinner: () => void = useCallback(() => {
        grid?.element?.setAttribute?.('aria-busy', 'true'); // To prevent react bad state update error dom manipulate along with state update which will reflect only through ref like useEffect.
        setIsContentBusy(true);
    }, []);

    /**
     * Hide the loading spinner
     */
    const hideSpinner: () => void = useCallback(() => {
        grid?.element?.setAttribute?.('aria-busy', 'false'); // To prevent react bad state update error dom manipulate along with state update which will reflect only through ref like useEffect.
        setIsContentBusy(false);
    }, []);

    /**
     * Refresh data from the data manager
     */
    const refreshDataManager: () => void = useCallback((): void => {
        grid?.element?.setAttribute?.('aria-busy', 'true'); // To prevent react bad state update error dom manipulate along with state update which will reflect only through ref like useEffect.
        setIsContentBusy(true);
        showSpinner();
        if (dataModule.dataState.current.isPending) {
            setTimeout(() => {
                dataModule.dataState.current.resolver?.(dataManager);
                if (isNullOrUndefined(dataModule.dataState.current.resolver) || dataModule.dataState.current.isEdit) {
                    dataManagerSuccess(dataManager as ReturnType);
                }
                dataModule.dataState.current = { isPending: false, resolver: undefined, isEdit: false };
            }, 0);
        } else {
            // Determine if $count should be included in query
            const shouldRequireCount: boolean = !(scrollMode === ScrollMode.Infinite);
            // Generate query with conditional requiresCount()
            const builtQuery: Query = generateQuery();
            const finalQuery: Query = shouldRequireCount ? builtQuery.requiresCount() : builtQuery;
            let dataManagerPromise: Promise<Object>;
            if (treeDataSettings?.enabled && treeModule && (treeModule.normalizedData?.length || !isOffline)) {
                Promise.resolve(treeModule.generateTreeData(finalQuery) as ReturnType)
                    .then(dataManagerSuccess)
                    .catch(dataManagerFailure);
            } else {
                dataManagerPromise = dataModule.getData(gridAction, finalQuery);
                dataManagerPromise.then(dataManagerSuccess).catch(dataManagerFailure);
            }
        }
    }, [dataManager, grid.query, dataManagerSuccess, dataManagerFailure, grid.showSpinner, currentPage,
        aggregates, gridAction, grid.filterSettings, grid.sortSettings,  grid.searchSettings, grid.groupSettings,
        pageSettings.pageSize, scrollMode, infiniteScrollState, grid?.groupSettings]);

    // Initial data load
    useEffect(() => {
        if (skipInfiniteServerPageSizeAutoDetectChange) {
            setSkipInfiniteServerPageSizeAutoDetectChange(false);
            return;
        }
        refreshDataManager();
    }, [dataManager, grid.query, grid.columns, currentPage, aggregates, pageSettings?.enabled,
        grid.filterSettings, grid.sortSettings,  grid.searchSettings, pageSettings.pageSize,
        groupModule?.groupSettings?.enabled, groupModule?.groupedColumns]);

    // Handle layout rendered state
    useEffect(() => {
        if (isLayoutRendered && isContentBusy) {
            if (scrollMode === ScrollMode.Auto) {
                selectionModule?.updateHeaderSelectionState?.();
            }
            hideSpinner();
            if (grid.onDataLoad) {
                grid.onDataLoad();
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
                } else if (gridAction.requestType === ActionType.Grouping) {
                    gridAction.type = 'grouped';
                    const eventArgs: OnGroupArgs = {
                        action: ((gridAction as OnGroupArgs).action ?? 'refresh') as OnGroupArgs['action'],
                        columns: (gridAction as OnGroupArgs).columns ?? grid.groupSettings?.columns ?? []
                    };
                    if (!(eventArgs.action === 'collapse' || eventArgs.action === 'collapseall' ||
                    eventArgs.action === 'expand' || eventArgs.action === 'expandall')) { grid.onGroup?.(eventArgs); }
                } else if (gridAction.requestType === ActionType.Refresh && gridAction.name === 'onActionComplete') {
                    gridAction.type = 'refreshed';
                    grid.onRefresh?.();
                }
                gridAction.type = 'actionComplete';
            }
            const actionCompleteEvent: CustomEvent = new CustomEvent('actionComplete');
            grid.element.dispatchEvent(actionCompleteEvent);
            const virtualScrollActionCompleteEvent: CustomEvent = new CustomEvent('virtualScrollSequencialRequest');
            if (!groupSettings.enabled || !groupSettings.columns?.length || scrollModule.virtualRowInfo?.requiredRowsRange?.length) { // default expand can reduce required rows range
                grid.element.dispatchEvent(virtualScrollActionCompleteEvent);
            } else if (!scrollModule.virtualRowInfo?.requiredRowsRange?.length) {
                const currentPageIndex: number = scrollModule.virtualRowInfo.currentPages.indexOf(currentPage);
                scrollModule.virtualRowInfo.currentPages = [...new Set([
                    ...scrollModule.virtualRowInfo?.previousPages,
                    ...scrollModule.virtualRowInfo.currentPages.slice(0, currentPageIndex + 1)
                ])].sort((a: number, b: number) => a - b);
            }
            grid?.element?.setAttribute?.('aria-busy', 'false'); // To prevent react bad state update error dom manipulate along with state update which will reflect only through ref like useEffect.
            setIsContentBusy(false);
            setInitialLoad(false);
        }
        if (gridAction.requestType === ActionType.Grouping) {
            gridAction.type = 'grouped';
            const eventArgs: OnGroupArgs = {
                action: ((gridAction as OnGroupArgs).action ?? 'refresh') as OnGroupArgs['action'],
                columns: (gridAction as OnGroupArgs).columns ?? grid.groupSettings?.columns ?? [],
                rowData: (gridAction as OnGroupArgs).rowData
            };
            if (eventArgs.action === 'collapse' || eventArgs.action === 'collapseall' ||
                eventArgs.action === 'expand' || eventArgs.action === 'expandall') {
                grid.onGroup?.(eventArgs);
                setGridAction?.({});
            }
        }
    }, [isLayoutRendered, currentViewData]);

    // Memoize APIs to prevent unnecessary re-renders
    const publicRenderAPI: Partial<IGrid<T>> = useMemo(() => ({ ...grid }), [grid]);

    const privateRenderAPI: UseRenderResult<T>['privateRenderAPI'] = useMemo(() => ({
        contentStyles,
        isLayoutRendered,
        isContentBusy
    }), [contentStyles, isLayoutRendered, isContentBusy]);

    const protectedRenderAPI: UseRenderResult<T>['protectedRenderAPI'] = useMemo(() => ({
        refresh: () => {
            setGridAction?.({ requestType: ActionType.Refresh, name: 'onActionBegin' });
            refreshDataManager();
        },
        showSpinner,
        hideSpinner
    }), [refreshDataManager, showSpinner, hideSpinner]);

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

/**
 * Get relevant column properties that should trigger change detection
 * This allows for better performance by only comparing properties that matter
 *
 * @returns {ColumnCompareKeys} - Data Affecting column properties comparison keys
 */
function getDataColumnCompareKeys(): ColumnCompareKeys {
    return [
        'allowSort', 'allowFilter', 'allowSearch', 'allowGroup'
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
        'valueAccessor', 'headerCheckbox', 'type', 'autoHeight', 'showInColumnChooser', 'filterTemplate', 'disableAutofill', 'orderIndex'
    ];
}

/**
 * Result of a column-change detection pass. Contains the mutated flags so callers
 * can reassign them back to the outer-scope booleans.
 */
interface ColumnChangeDetectionResult {
    isColumnChanged: boolean;
    isUIColumnpropertiesChanged: boolean;
}

/**
 * Compare the previous and current column (parent or leaf) and update the
 * `isColumnChanged` / `isUIColumnpropertiesChanged` flags accordingly.
 *
 * The previous column is resolved using `getColumnByPath` so it works for both
 * top-level and nested columns. Comparison is only performed when the previous
 * column's `field` matches the current column (or the previous column is a
 * single-group column).
 *
 * @param {ColumnProps<T>[]} prevColumns - Previous columns array
 * @param {string} parentIndex - Parent path index string used by getColumnByPath
 * @param {number} parentDepth - Current depth in the column hierarchy
 * @param {number} columnIndex - Index of the current column at its level
 * @param {ColumnProps<T>} currentColumn - The current column being processed
 * @param {boolean} isColumnChanged - Whether column-related changes have been detected so far
 * @param {boolean} isUIColumnpropertiesChanged - Whether UI property changes have been detected so far
 * @returns {ColumnChangeDetectionResult} The updated change flags
 */
function detectColumnChanges<T>(
    prevColumns: ColumnProps<T>[] | undefined,
    parentIndex: string,
    parentDepth: number,
    columnIndex: number,
    currentColumn: ColumnProps<T>,
    isColumnChanged: boolean,
    isUIColumnpropertiesChanged: boolean
): ColumnChangeDetectionResult {
    const prevColumn: ColumnProps<T> = (parentDepth > 0 ?
        getColumnByPath(prevColumns, parentIndex, columnIndex) :
        prevColumns?.[columnIndex as number]) as ColumnProps<T>;
    if (!prevColumn ||
        (prevColumn.field !== currentColumn.field &&
            prevColumn.type !== ColumnType.SingleGroup &&
            prevColumn?.type !== ColumnType.RowNumber && prevColumn?.type !== ColumnType.RowDragAndDrop)) {
        return { isColumnChanged, isUIColumnpropertiesChanged };
    }
    const hasChanged: boolean = currentColumn?.type !== ColumnType.RowNumber && currentColumn?.type !== ColumnType.RowDragAndDrop &&
        (isColumnChanged || !compareSelectedProperties(
            prevColumn,
            currentColumn,
            getDataColumnCompareKeys()
        ));
    const updatedColumnChanged: boolean = isColumnChanged || hasChanged;
    const hasUIChanged: boolean = updatedColumnChanged || !compareSelectedProperties(
        prevColumn,
        currentColumn,
        getUIColumnCompareKeys()
    );
    return {
        isColumnChanged: updatedColumnChanged,
        isUIColumnpropertiesChanged: isUIColumnpropertiesChanged || hasUIChanged
    };
}

/**
 * Calculate the total width of a flattened column (parent or leaf).
 *
 * @param {ReactElement<IColumnBase<T>>} columnElement - The column's React element.
 * @param {FlattenedColumn<T>[]} [childDetails=[]] - Optional direct children for parent columns.
 * @returns {number} The total width in pixels.
 */
function getFlattenedColumnTotalWidth<T>(
    columnElement: ReactElement<IColumnBase<T>>,
    childDetails: FlattenedColumn<T>[] = []
): number {
    if (childDetails.length) {
        return childDetails.reduce((sum: number, child: FlattenedColumn<T>) => sum + (child.totalWidth ?? 0), 0);
    }
    const width: string | number | undefined = columnElement?.props?.width;
    return width !== undefined && width !== null ? parseUnit(width as string | number) : 100;
}

/**
 * Return type for merging nested column results
 */
interface MergeNestedColumnResultReturn {
    totalVirtualColumnWidth: number;
    isStackedHeader: boolean;
    isCommandEditEnabled: boolean;
    isAutoHeightEnabled: boolean;
    isColumnChanged: boolean;
    isUIColumnpropertiesChanged: boolean;
    isCheckBoxColumn: boolean;
    isSpannedColumns: boolean;
    maxDepth: number;
}

/**
 * Merge nested column content into the parent column structure.
 *
 * @param {object} childContents - Prepared column tree for the nested child set.
 * @param {number} childLeafStartIndex - Starting leaf index for the nested child columns.
 * @param {string} columnKey - Unique key used to generate the parent column element.
 * @param {object} columnProps - Parent column configuration.
 * @param {object} nestedChildren - React children rendered inside the parent column.
 * @param {object} mergedColumnProps - Merged parent column props.
 * @param {number} parentDepth - Current depth of the parent column within the hierarchy.
 * @param {string} parentHeaderText - Parent header text for stacked-header tracking.
 * @param {Array} visibleColumns - Visible column collection being updated.
 * @param {object} columnOffsets - Column offset map being updated.
 * @param {Array} stackedHeaderColumns - Flattened stacked-header entries.
 * @param {Array} columns - Column definitions collection for the current grid.
 * @param {Array} colGroup - Column group definitions for the parent structure.
 * @param {Array} adjustedChildren - Adjusted child elements to render in the grid.
 * @param {number} totalVirtualColumnWidth - Total width used for virtualized columns.
 * @param {boolean} isStackedHeader - Whether the grid is currently in stacked-header mode.
 * @param {boolean} isCommandEditEnabled - Whether command editing is enabled.
 * @param {boolean} isAutoHeightEnabled - Whether auto-height is enabled anywhere in the structure.
 * @param {boolean} isColumnChanged - Whether the current column structure changed.
 * @param {boolean} isUIColumnpropertiesChanged - Whether UI column properties changed.
 * @param {boolean} isCheckBoxColumn - Whether the grid contains a checkbox column.
 * @param {boolean} isSpannedColumns - Whether any columns span multiple cells.
 * @param {number} maxDepth - Maximum column depth encountered.
 * @returns {object} The merged nested column aggregation result.
 */
function mergeNestedColumnResult<T>(
    childContents: PrepareColumns<T>,
    childLeafStartIndex: number,
    columnKey: string,
    columnProps: ColumnProps<T>,
    nestedChildren: ReactNode,
    mergedColumnProps: ColumnProps<T>,
    parentDepth: number,
    parentHeaderText: string | undefined,
    // Mutable arrays to update
    visibleColumns: ColumnProps<T>[],
    columnOffsets: { [key: number]: number },
    stackedHeaderColumns: FlattenedColumn<T>[],
    columns: ColumnProps<T>[],
    colGroup: JSX.Element[],
    adjustedChildren: ReactNode[],
    // Flags to merge
    totalVirtualColumnWidth: number,
    isStackedHeader: boolean,
    isCommandEditEnabled: boolean,
    isAutoHeightEnabled: boolean,
    isColumnChanged: boolean,
    isUIColumnpropertiesChanged: boolean,
    isCheckBoxColumn: boolean,
    isSpannedColumns: boolean,
    maxDepth: number
): MergeNestedColumnResultReturn {
    const parentWidthBeforeChild: number = isStackedHeader ? totalVirtualColumnWidth : 0;
    totalVirtualColumnWidth += childContents.totalVirtualColumnWidth;
    const keys: string[] = Object.keys(childContents.columnOffsets);
    for (let offsetIndex: number = 0; offsetIndex < keys.length; offsetIndex++) {
        visibleColumns.push(childContents.visibleColumns[offsetIndex as number]);
        columnOffsets[visibleColumns.length as number] =
            parentWidthBeforeChild + childContents.columnOffsets[keys[offsetIndex as number] as string];
    }
    isCommandEditEnabled = childContents.isCommandEditEnabled;
    isAutoHeightEnabled = isAutoHeightEnabled || childContents.isAutoHeightEnabled;
    isColumnChanged = childContents.isColumnChanged;
    isUIColumnpropertiesChanged = childContents.isUIColumnpropertiesChanged;
    isCheckBoxColumn = childContents.isCheckBoxColumn;
    isSpannedColumns = isSpannedColumns || childContents.isSpannedColumns;
    isStackedHeader = true;

    const nestedLeafCount: number = childContents.visibleColumns?.length ?? 0;
    const currentColumnElement: ReactElement<IColumnBase<T>> =
        <ColumnBase<T> key={`col-base-${columnKey}`} {...columnProps}>
            {(nestedChildren as ReactElement)}
        </ColumnBase> as ReactElement<IColumnBase<T>>;

    const parentStackedHeaderIndex: number = stackedHeaderColumns.length;
    const parentStackedHeaderEntry: FlattenedColumn<T> = {
        element: currentColumnElement,
        columnProps: columnProps,
        depth: parentDepth ?? 0,
        uid: currentColumnElement.props.uid,
        leafCount: nestedLeafCount,
        ContainsChildIndex: null,
        childDetails: [],
        totalWidth: 0,
        ParentHeaderText: parentHeaderText
    };
    stackedHeaderColumns.push(parentStackedHeaderEntry);

    if (childContents.stackedHeaderColumns) {
        const directChildren: FlattenedColumn<T>[] = childContents.stackedHeaderColumns.filter(
            (col: FlattenedColumn<T>) => col.depth === parentDepth + 1
        );
        parentStackedHeaderEntry.childDetails = directChildren;

        const adjustedChildStackedColumns: FlattenedColumn<T>[] = childContents.stackedHeaderColumns.map(
            (col: FlattenedColumn<T>) => {
                if (col.ContainsChildIndex && Array.isArray(col.ContainsChildIndex)) {
                    return {
                        ...col,
                        ContainsChildIndex: col.ContainsChildIndex.map(
                            (idx: number) => childLeafStartIndex + idx
                        )
                    };
                }
                return col;
            }
        );

        stackedHeaderColumns.push(...adjustedChildStackedColumns);
        const containsChildIndex: number[] = Array.from(
            { length: nestedLeafCount },
            (_: unknown, idx: number) => childLeafStartIndex + idx
        );
        stackedHeaderColumns[parentStackedHeaderIndex as number].ContainsChildIndex =
            containsChildIndex.length ? containsChildIndex : null;
        stackedHeaderColumns[parentStackedHeaderIndex as number].totalWidth = directChildren.length
            ? getFlattenedColumnTotalWidth(currentColumnElement, directChildren)
            : getFlattenedColumnTotalWidth(currentColumnElement);
    }

    columns.push({ ...mergedColumnProps, columns: childContents.columns });
    colGroup.push(...childContents.colGroup);
    maxDepth = Math.max(maxDepth, childContents.depth);
    adjustedChildren.push(currentColumnElement);

    return {
        totalVirtualColumnWidth,
        isStackedHeader,
        isCommandEditEnabled,
        isAutoHeightEnabled,
        isColumnChanged,
        isUIColumnpropertiesChanged,
        isCheckBoxColumn,
        isSpannedColumns,
        maxDepth
    };
}

/**
 * Flatten a nested typeDetectedUIColumns structure into a single-level array with headerText-based lookups.
 * This handles both regular flat columns and stacked/nested columns.
 *
 * @param {ColumnProps[]} columns - Columns to flatten (may contain nested columns)
 * @returns {Map<string, ColumnProps>} Column identity map, with header text as a legacy fallback
 */
function createFlattenedColumnMap<T>(columns?: ColumnProps<T>[]): Map<string, ColumnProps<T>> {
    const map: Map<string, ColumnProps<T>> = new Map<string, ColumnProps<T>>();
    if (!columns) {
        return map;
    }

    const traverse: (cols: ColumnProps<T>[]) => void = (cols: ColumnProps<T>[]): void => {
        for (const col of cols) {
            if (col.uid) { map.set(JSON.stringify(['uid', col.uid]), col); }
            if (col.field) { map.set(JSON.stringify(['field', col.field]), col); }
            // Keep header text as a fallback for older definitions without stable identities.
            if (col.headerText) {
                map.set(JSON.stringify(['header', col.headerText]), col);
            }
            // Recursively flatten nested columns
            if (col.columns && col.columns.length > 0) {
                traverse(col.columns as ColumnProps<T>[]);
            }
        }
    };

    traverse(columns);
    return map;
}

/**
 * Prepare columns from children or column definitions
 *
 * @param {ServiceLocator} serviceLocator - ServiceLocator for column formatting and parsing property updates.
 * @param {Object[]} children - Child react elements or column definitions
 * @param {boolean} isStackedHeader - Whether the column hierarchy contains stacked headers
 * @param {number} parentDepth - Current depth in the column hierarchy
 * @param {string} parentIndex - Index path for uniqueness
 * @param {ColumnProps[]} prevColumns - previous columns which is used to compare old and new and detect whether customer changed state is related to column or not.
 * @param {ColumnProps[]} typeDetectedUIColumns - After getting data type updated ui columns.
 * @param {IGridBase} gridProps - The grid configured properties.
 * @param {boolean} isColumnChooserChanged - Flag to indicate if column chooser state has changed, used to trigger column property updates when columns are toggled in the column chooser.
 * @param {RefObject<Map<string, boolean | undefined>>} controlledVisibility - Ref containing the controlled visibility state for columns, used to determine if a column is currently visible or hidden.
 * @param {RefObject<ColumnWidthInfo>} columnWidthInfo - Ref to the shared column-width state flags; consumed here to mark `maxTableWidth` when a column hits its `maxWidth` and to clear the initial-render flag once the pipeline finishes.
 * @param {boolean} isColumnReorderChanged - Flag to indicate if column reorder state has changed, used to trigger column property updates when columns are reordered.
 * @param {RefObject<number>} orderIndex - Ref containing the next column order index.
 * @param {boolean} isAutoHeightEnabled - Flag to indicate if auto height is enabled for any column, used for optimization to avoid unnecessary checks.
 * @param {Map<string, string>} groupCaptionAggregateType - Map of aggregate fields and types for group captions
 * @param {number} globalLeafIndexOffset - Global offset for calculating absolute leaf column indexes in nested hierarchies
 * @param {string} parentHeaderText - Header text of the direct parent column (undefined for top-level columns)
 * @param {Map<string, ColumnProps>} flattenedTypeDetectedMap - Pre-computed flattened map for nested column lookups
 * @param {boolean} isColumnChanged - Whether column-related changes have been detected so far
 * @param {boolean} isUIColumnpropertiesChanged - Whether UI property changes have been detected so far
 * @param {PinDirectionInput<T>} pinnedStackedColumn - Pin direction (enum, string, or callback) for stacked columns.
 * @returns {Object} Object containing columns, depth, children, and column group elements
 */
const prepareColumns: <T>(
    serviceLocator: ServiceLocator,
    children: ReactNode | (ColumnProps<T> | ReactElement)[],
    isStackedHeader: boolean,
    parentDepth?: number,
    parentIndex?: string,
    prevColumns?: ColumnProps<T>[],
    typeDetectedUIColumns?: ColumnProps<T>[],
    gridProps?: Partial<IGridBase<T>>,
    isColumnChooserChanged?: boolean,
    controlledVisibility?: RefObject<Map<string, boolean | undefined>>,
    columnWidthInfo?: RefObject<ColumnWidthInfo>,
    isColumnReorderChanged?: boolean,
    orderIndex?: RefObject<number>,
    isAutoHeightEnabled?: boolean,
    groupCaptionAggregateType?: Map<string, AggregateType | AggregateType[] | string | string[]>,
    globalLeafIndexOffset?: number,
    parentHeaderText?: string,
    flattenedTypeDetectedMap?: Map<string, ColumnProps<T>>,
    isColumnChanged?: boolean,
    isUIColumnpropertiesChanged?: boolean,
    pinnedStackedColumn?: PinDirectionInput<T>
) =>
PrepareColumns<T>
= <T, >(
    serviceLocator: ServiceLocator,
    children: ReactNode | (ColumnProps<T> | ReactElement)[],
    isStackedHeader: boolean,
    parentDepth: number = 0,
    parentIndex: string = '',
    prevColumns?: ColumnProps<T>[],
    typeDetectedUIColumns?: ColumnProps<T>[],
    gridProps?: IGridBase<T>,
    isColumnChooserChanged: boolean = false,
    controlledVisibility?: RefObject<Map<string, boolean | undefined>>,
    columnWidthInfo?: RefObject<ColumnWidthInfo>,
    isColumnReorderChanged: boolean = false,
    orderIndex?: RefObject<number>,
    isAutoHeightEnabled: boolean = false,
    groupCaptionAggregateType: Map<string, string[]> =
    new Map<string, string[]>(),
    globalLeafIndexOffset: number = 0,
    parentHeaderText: string | undefined = undefined,
    flattenedTypeDetectedMap?: Map<string, ColumnProps<T>>,
    isColumnChanged: boolean = false, // currently used/handled always column state changed manner even unrelated state change props.children changed.
    isUIColumnpropertiesChanged: boolean = false,
    pinnedStackedColumn?: PinDirectionInput<T>
): PrepareColumns<T> => {
    // Create or use provided flattened map for field-based column lookup
    // This ensures nested columns can find their type-detected counterparts
    const flatMap: Map<string, ColumnProps<T>> = flattenedTypeDetectedMap ||
        createFlattenedColumnMap(typeDetectedUIColumns);

    let totalVirtualColumnWidth: number = 0;
    const columnOffsets: { [key: number]: number } = {};
    let maxDepth: number = parentDepth;
    let isCommandEditEnabled: boolean = false;
    let singleGroupColumn: ColumnProps<T> | undefined = undefined;
    let isCheckBoxColumn: boolean = false;
    let isSpannedColumns: boolean = false; // Track if any column has rowSpan or colSpan
    columnWidthInfo.current.maxTableWidth = false;
    columnWidthInfo.current.hasDynamicWidth = false;
    columnWidthInfo.current.hasAutoFitWidth = false;
    const columns: ColumnProps<T>[] = [];
    const visibleColumns: ColumnProps<T>[] = [];
    const leftPinnedColumns: Map<string, {Column: ReactNode, Col: ReactNode}> = new Map();
    const rightPinnedColumns: Map<string, {Column: ReactNode, Col: ReactNode}> = new Map();
    const allStackedColumnProps: ColumnProps<T>[] = [];
    const stackedFlattedColumnProps: ColumnProps<T>[] = [];
    const stackedHeaderColumns: FlattenedColumn<T>[] = [];
    const stackedFlattedColumns: ReactElement<IColumnBase<T>>[] = [];
    const visibleStackedHeaderColumns: ColumnProps<T>[] = [];
    let stackedRowEntries: Array<Array<ColumnProps<T>>> = [];
    const adjustedChildren: ReactNode[] = [];
    const colGroup: JSX.Element[] = [];
    const fieldOrderMap: Map<string, number> = new Map<string, number>();
    const uidOrderMap: Map<string, number> = new Map<string, number>();
    const columnMap: Map<string, ColumnProps<T>> = new Map<string, ColumnProps<T>>();
    const columnUidMap: Map<string, ColumnProps<T>> = new Map<string, ColumnProps<T>>();
    const childArray: ReactElement[] = Array.isArray(children)
        ? children as ReactElement[]
        : Children.toArray(children) as ReactElement[];

    for (let i: number = 0, columnIndex: number = 0; i < childArray.length; i++) {
        let child: ReactElement = childArray[i as number];
        const currentIndex: string = parentIndex ? `${parentIndex}-${i}` : `${i}`;

        if (isValidReactElement(child) && (
            child.type === ColumnBase ||
            child.type === RenderBase ||
            child.type === Columns ||
            child.type === Column
        )) {
            if (child.type === Columns && i === 0 && columnIndex === 0) {
                const columnsChild: ReactElement<{ children?: ReactNode }> = child as ReactElement<{ children?: ReactNode }>;
                const children: (ReactElement | ReactNode)[] = React.Children.toArray(columnsChild.props.children);
                if (gridProps?.dragAndDropSettings?.enabled) {
                    children.unshift(
                        <Column
                            key="row-reorder"
                            type={ColumnType.RowDragAndDrop}
                            showInColumnChooser={false}
                            textAlign={TextAlign.Center}
                            width={60}
                            maxWidth={60}
                            minWidth={60}
                            allowResize={false}
                            visible={gridProps?.dragAndDropSettings?.enabled ?? false}
                            disableAutofill={true}
                        />
                    );
                }
                if (gridProps?.rowNumberSettings?.enabled) {
                    children.unshift(
                        <Column
                            key="row-number"
                            type={ColumnType.RowNumber}
                            showInColumnChooser={false}
                            textAlign={TextAlign.Right}
                            width={50}
                            maxWidth={50}
                            minWidth={50}
                            allowResize={false}
                            visible={gridProps?.rowNumberSettings?.enabled ?? false}
                            disableAutofill={true}
                            headerText=''
                        />
                    );
                }
                child = React.cloneElement(columnsChild, {
                    children: children
                });
            }
            // Resolve stable identities in every grid, including the internal pivot result grid.
            const childHeaderText: string | undefined = (child.props as ColumnProps<T>)?.headerText;
            const typeDetectedColumn: ColumnProps<T> | undefined =
                flatMap.get(JSON.stringify(['uid', (child.props as ColumnProps<T>)?.uid])) ??
                flatMap.get(JSON.stringify(['field', (child.props as ColumnProps<T>)?.field])) ??
                (!(child.props as ColumnProps<T>)?.uid && !(child.props as ColumnProps<T>)?.field ?
                    (childHeaderText ? flatMap.get(JSON.stringify(['header', childHeaderText])) : undefined) ??
                    (((child.props as ColumnProps<T>)?.children || (child.props as ColumnProps<T>)?.columns) ? undefined :
                        typeDetectedUIColumns?.[i as number]) : undefined);
            const childColumnProps: ColumnProps<T> = child.props as ColumnProps<T>;
            const visibilityKey: string = getColumnVisibilityKey(childColumnProps, currentIndex);
            const hasExplicitVisible: boolean = !isNullOrUndefined(childColumnProps.visible);
            const hasPreviousVisible: boolean = controlledVisibility?.current?.has(visibilityKey) ?? false;
            const isExternalVisibilityChanged: boolean = hasExplicitVisible &&
                (!hasPreviousVisible || controlledVisibility.current.get(visibilityKey) !== childColumnProps.visible);
            if (hasExplicitVisible) {
                controlledVisibility?.current?.set(visibilityKey, childColumnProps.visible);
            }
            const columnInputProps: ColumnProps<T> = isColumnChooserChanged && hasExplicitVisible &&
                !isExternalVisibilityChanged ? { ...childColumnProps, visible: undefined } : childColumnProps;
            if (typeDetectedColumn && isExternalVisibilityChanged) {
                typeDetectedColumn.visible = childColumnProps.visible;
            }
            const columnProps: ColumnProps<T> = defaultColumnProps<T>(
                columnInputProps,
                serviceLocator,
                gridProps,
                typeDetectedColumn,
                isColumnChooserChanged,
                pinnedStackedColumn,
                isStackedHeader
            );
            if (typeDetectedColumn && !isNullOrUndefined(typeDetectedColumn.visible) &&
                isNullOrUndefined(columnInputProps?.visible)) {
                columnProps.visible = typeDetectedColumn.visible;
            }
            if (columnWidthInfo.current.isColumnWidthChanged && typeDetectedColumn?.uid) {
                columnProps.uid = typeDetectedColumn?.uid;
            }
            columnProps.orderIndex = isColumnReorderChanged && !isNullOrUndefined(typeDetectedColumn?.orderIndex) ?
                typeDetectedColumn.orderIndex : isStackedHeader ? !columnProps?.field ?
                    undefined : orderIndex.current++ : columnIndex;
            // Check for rowSpan or colSpan properties
            if (columnProps.rowSpan || columnProps.colSpan) {
                isSpannedColumns = true;
            }
            if (columnProps?.groupCaptionAggregateType) {
                const types: string[] = columnProps.groupCaptionAggregateType instanceof Array ?
                    columnProps.groupCaptionAggregateType : [columnProps.groupCaptionAggregateType];
                groupCaptionAggregateType.set(columnProps.field, types);
            }
            // Generate a unique key for the column
            const columnKey: string = generateUniqueKey(columnProps, currentIndex);

            if (child.type === ColumnBase || child.type === Column) {
                // Check for and process nested columns
                const childProps: { children?: ReactNode; columns?: ColumnProps<T>[] } =
                    child.props as { children?: ReactNode; columns?: ColumnProps<T>[] };
                if (childProps.children || childProps.columns) {
                    // Compare parent (stacked-header) column with previous to detect property changes
                    const parentDetection: ColumnChangeDetectionResult = detectColumnChanges(
                        prevColumns, parentIndex, parentDepth, columnIndex,
                        columnProps, isColumnChanged, isUIColumnpropertiesChanged
                    );
                    isColumnChanged = parentDetection.isColumnChanged;
                    isUIColumnpropertiesChanged = parentDetection.isUIColumnpropertiesChanged;
                    const childLeafStartIndex: number = globalLeafIndexOffset + visibleColumns.length;
                    const childContents: PrepareColumns<T> = prepareColumns<T>(
                        serviceLocator,
                        childProps.children || childProps.columns,
                        isStackedHeader,
                        parentDepth + 1,
                        currentIndex,
                        prevColumns,
                        gridProps?.reorderSettings?.enabled &&
                            (childProps.children || childProps.columns)
                            ? typeDetectedUIColumns?.[i as number]?.columns ?? typeDetectedUIColumns : typeDetectedUIColumns,
                        gridProps,
                        isColumnChooserChanged,
                        controlledVisibility,
                        columnWidthInfo,
                        isColumnReorderChanged,
                        orderIndex,
                        isAutoHeightEnabled,
                        groupCaptionAggregateType,
                        childLeafStartIndex,
                        columnProps.headerText,
                        flatMap,  // Pass flattened map to maintain field-based lookup in nested columns
                        isColumnChanged,
                        isUIColumnpropertiesChanged,
                        columnProps?.pinDirection
                    );
                    isStackedHeader = childContents.isStackedHeader;
                    const mergeResult: MergeNestedColumnResultReturn = mergeNestedColumnResult(
                        childContents,
                        childLeafStartIndex,
                        columnKey,
                        columnProps,
                        childContents.children,
                        columnProps,
                        parentDepth,
                        parentHeaderText,
                        visibleColumns,
                        columnOffsets,
                        stackedHeaderColumns,
                        columns,
                        colGroup,
                        adjustedChildren,
                        totalVirtualColumnWidth,
                        isStackedHeader,
                        isCommandEditEnabled,
                        isAutoHeightEnabled,
                        isColumnChanged,
                        isUIColumnpropertiesChanged,
                        isCheckBoxColumn,
                        isSpannedColumns,
                        maxDepth
                    );
                    totalVirtualColumnWidth = mergeResult.totalVirtualColumnWidth;
                    isStackedHeader = mergeResult.isStackedHeader;
                    isCommandEditEnabled = mergeResult.isCommandEditEnabled;
                    isAutoHeightEnabled = mergeResult.isAutoHeightEnabled;
                    isColumnChanged = mergeResult.isColumnChanged;
                    isUIColumnpropertiesChanged = mergeResult.isUIColumnpropertiesChanged;
                    isCheckBoxColumn = mergeResult.isCheckBoxColumn;
                    isSpannedColumns = mergeResult.isSpannedColumns;
                    maxDepth = mergeResult.maxDepth;
                    // Merge field order and column maps from nested columns
                    childContents.fieldOrderMap?.forEach((order: number, field: string) => {
                        fieldOrderMap.set(field, order);
                    });
                    childContents.columnMap?.forEach((col: ColumnProps<T>, field: string) => {
                        columnMap.set(field, col);
                    });
                    childContents.columnUidMap?.forEach((col: ColumnProps<T>, uid: string) => {
                        columnUidMap.set(uid, col);
                    });
                    childContents.uidOrderMap?.forEach((order: number, uid: string) => {
                        uidOrderMap.set(uid, order);
                    });
                } else {
                    columnProps.pinDirection = columnProps?.pinDirection !== undefined ?
                        resolvePinDirection<T>(columnProps.pinDirection, columnProps) : columnProps.pinDirection;
                    // Only compare specific properties that should trigger a change
                    const leafDetection: ColumnChangeDetectionResult = detectColumnChanges(
                        prevColumns, parentIndex, parentDepth, columnIndex,
                        columnProps, isColumnChanged, isUIColumnpropertiesChanged
                    );
                    isColumnChanged = leafDetection.isColumnChanged;
                    isUIColumnpropertiesChanged = leafDetection.isUIColumnpropertiesChanged;
                    if (columnProps?.type === ColumnType.SingleGroup) {
                        if (!columnProps.field) {
                            columnProps.field = columnProps.uid;
                        }
                        singleGroupColumn = columnProps;
                    } else if (columnProps?.type === ColumnType.RowNumber) {
                        if (!columnProps.field) {
                            columnProps.field = columnProps.uid;
                        }
                    }
                    // columnProps.index = columns.length;
                    columns.push(columnProps);
                    if (columnProps.type === ColumnType.Checkbox) {
                        isCheckBoxColumn = true;
                    }
                    const leafColumnElement: ReactElement<IColumnBase<T>> =
                        <ColumnBase<T> key={`col-base-${columnKey}`} {...columnProps}>
                            {(child.props as { children: ReactElement })?.children}
                        </ColumnBase> as ReactElement<IColumnBase<T>>;
                    stackedHeaderColumns.push({
                        element: leafColumnElement,
                        columnProps: columnProps,
                        depth: parentDepth ?? 0,
                        uid : leafColumnElement.props.uid,
                        leafCount: 1,
                        ContainsChildIndex: null,
                        childDetails: [],
                        totalWidth: getFlattenedColumnTotalWidth(leafColumnElement),
                        ParentHeaderText: parentHeaderText
                    });
                    if (columnProps.visible) {
                        let width: string | number = columnProps.width;
                        const uiColumnWidth: string | number = typeDetectedColumn?.width;
                        if (isDynamicWidth(columnProps.width) || !isNullOrUndefined(columnProps.minWidth)
                            || !isNullOrUndefined(columnProps.maxWidth)) {
                            columnWidthInfo.current.hasDynamicWidth = true;
                        }
                        if (columnProps.autoFit) {
                            columnWidthInfo.current.hasAutoFitWidth = true;
                        }
                        if (columnWidthInfo.current.isColumnWidthChanged && !columnWidthInfo.current.renderInitialWidth
                            && !isNullOrUndefined(uiColumnWidth)) {
                            width = uiColumnWidth;
                            if (parseUnit(width) === columnProps.maxWidth) {
                                columnWidthInfo.current.maxTableWidth = true;
                            }
                        }
                        isCommandEditEnabled = !isNullOrUndefined(columnProps.getCommandItems);
                        isAutoHeightEnabled = isAutoHeightEnabled || columnProps.autoHeight;
                        totalVirtualColumnWidth += parseUnit(width) ?? 150;
                        visibleColumns.push(columnProps);
                        columnOffsets[visibleColumns.length as number] = totalVirtualColumnWidth;
                        if (columnProps.field) {
                            fieldOrderMap.set(columnProps.field, visibleColumns.length - 1);
                            columnMap.set(columnProps.field, columnProps);
                        }
                        if (columnProps.uid) {
                            columnUidMap.set(columnProps.uid, columnProps);
                            uidOrderMap.set(columnProps.uid, visibleColumns.length - 1);
                        }
                        // Only create col elements for leaf columns
                        colGroup.push(
                            <col
                                key={`col-${columnKey}-${Math.random().toString(36).substr(2, 9)}`}
                                style={{
                                    width: width,
                                    ...COL_ELEMENT_STYLE
                                }}
                                data-uid={columnProps.uid}
                                data-order-index={columnProps.orderIndex}
                            />
                        );
                        adjustedChildren.push(leafColumnElement);
                        if (columnProps.pinDirection === ColumnPinDirection.Left) {
                            leftPinnedColumns.set(columnProps?.field ??
                                columnProps?.headerText, {Column: adjustedChildren?.[adjustedChildren?.length - 1],
                                Col: colGroup?.[colGroup?.length - 1]});
                        } else if (columnProps.pinDirection === ColumnPinDirection.Right) {
                            rightPinnedColumns.set(columnProps?.field ??
                                columnProps?.headerText, {Column: adjustedChildren?.[adjustedChildren?.length - 1],
                                Col: colGroup?.[colGroup?.length - 1]});
                        }
                    }
                }
                columnIndex++;
            } else if (child.type === RenderBase || child.type === Columns) {
                const {
                    columns: childColumns,
                    depth,
                    colGroup: childColGroup,
                    children,
                    isColumnChanged: isChildrenColumnsChanged,
                    isUIColumnpropertiesChanged: isChildrenColumnsUIChanged,
                    isCheckBoxColumn: isChildCheckboxColumn,
                    totalVirtualColumnWidth: totalColumnWidth,
                    columnOffsets: childColumnOffsets,
                    visibleColumns: childVisibleColumns,
                    stackedHeaderColumns: childStackedHeaderColumns,
                    isStackedHeader: childIsStackedHeader,
                    isCommandEditEnabled: isChildCommandEditEnabled,
                    isAutoHeightEnabled: isChildAutoHeightEnabled,
                    isSpannedColumns: isChildSpannedColumns,
                    fieldOrderMap: childFieldOrderMap,
                    columnMap: childColumnMap,
                    columnUidMap: childColumnUidMap,
                    uidOrderMap: childUidOrderMap,
                    leftPinnedColumns: childLeftPinnedColumns,
                    rightPinnedColumns: childRightPinnedColumns
                } = prepareColumns<T>(
                    serviceLocator,
                    (child.props as { children: ReactElement })?.children || (child.props as { columns: ColumnProps<T>[] }).columns,
                    isStackedHeader,
                    parentDepth,
                    currentIndex,
                    prevColumns,
                    gridProps?.reorderSettings?.enabled &&
                        ((child.props as { children?: ReactNode; columns?: ColumnProps<T>[] }).children ||
                            (child.props as { children?: ReactNode; columns?: ColumnProps<T>[] }).columns)
                        ? typeDetectedUIColumns?.[i as number]?.columns ?? typeDetectedUIColumns : typeDetectedUIColumns,
                    gridProps,
                    isColumnChooserChanged,
                    controlledVisibility,
                    columnWidthInfo,
                    isColumnReorderChanged,
                    orderIndex,
                    isAutoHeightEnabled,
                    groupCaptionAggregateType,
                    undefined,
                    parentHeaderText,
                    undefined,
                    isColumnChanged,
                    isUIColumnpropertiesChanged,
                    columnProps?.pinDirection
                );
                isCommandEditEnabled = isChildCommandEditEnabled;
                isAutoHeightEnabled = isAutoHeightEnabled || isChildAutoHeightEnabled;
                const parentWidthBeforeChild: number = isStackedHeader ? totalVirtualColumnWidth : 0;
                totalVirtualColumnWidth += totalColumnWidth;
                const keys: string[] = Object.keys(childColumnOffsets);
                for (let offsetIndex: number = 0; offsetIndex < keys.length; offsetIndex++) {
                    visibleColumns.push(childVisibleColumns[offsetIndex as number]);
                    // Add parent's existing width to maintain cumulative offsets
                    columnOffsets[visibleColumns.length as number] = parentWidthBeforeChild +
                        childColumnOffsets[keys[offsetIndex as number] as string];
                }
                isColumnChanged = isChildrenColumnsChanged;
                isUIColumnpropertiesChanged = isChildrenColumnsUIChanged;
                isCheckBoxColumn = isChildCheckboxColumn;
                isSpannedColumns = isSpannedColumns || isChildSpannedColumns;
                isStackedHeader = isStackedHeader || Boolean(childIsStackedHeader);
                if (childStackedHeaderColumns) {
                    stackedHeaderColumns.push(...childStackedHeaderColumns);
                }
                columns.push(...childColumns);
                colGroup.push(...childColGroup);
                adjustedChildren.push(
                    ((children as ReactElement).props as { children: ReactElement[] })?.children
                );
                maxDepth = Math.max(maxDepth, depth);
                // Merge field order and column maps from nested columns
                childFieldOrderMap?.forEach((order: number, field: string) => {
                    fieldOrderMap.set(field, order);
                });
                childColumnMap?.forEach((col: ColumnProps<T>, field: string) => {
                    columnMap.set(field, col);
                });
                childColumnUidMap?.forEach((col: ColumnProps<T>, uid: string) => {
                    columnUidMap.set(uid, col);
                });
                childUidOrderMap?.forEach((order: number, uid: string) => {
                    uidOrderMap.set(uid, order);
                });
                childLeftPinnedColumns?.forEach((node: {Column: ReactNode, Col: ReactNode}, field: string) => {
                    leftPinnedColumns.set(field, node);
                });
                childRightPinnedColumns?.forEach((node: {Column: ReactNode, Col: ReactNode}, field: string) => {
                    rightPinnedColumns.set(field, node);
                });
            }
        } else if (isColumnObject(child)) {
            // Repeated captions must not replace a column's own identity or presentation state.
            const objHeaderText: string | undefined = (child as ColumnProps<T>)?.headerText;
            const typeDetectedObjColumn: ColumnProps<T> | undefined =
                flatMap.get(JSON.stringify(['uid', (child as ColumnProps<T>).uid])) ??
                flatMap.get(JSON.stringify(['field', (child as ColumnProps<T>).field])) ??
                (!(child as ColumnProps<T>).uid && !(child as ColumnProps<T>).field ?
                    (objHeaderText ? flatMap.get(JSON.stringify(['header', objHeaderText])) : undefined) ??
                    (((child as ColumnProps<T>).children || (child as ColumnProps<T>).columns) ? undefined :
                        typeDetectedUIColumns?.[i as number]) : undefined);
            const objectColumnProps: ColumnProps<T> = child as ColumnProps<T>;
            const objectVisibilityKey: string = getColumnVisibilityKey(objectColumnProps, currentIndex);
            const hasExplicitObjectVisible: boolean = !isNullOrUndefined(objectColumnProps.visible);
            const hasPreviousObjectVisible: boolean = controlledVisibility?.current?.has(objectVisibilityKey) ?? false;
            const isExternalObjectVisibilityChanged: boolean = hasExplicitObjectVisible &&
                (!hasPreviousObjectVisible || controlledVisibility.current.get(objectVisibilityKey) !== objectColumnProps.visible);
            if (hasExplicitObjectVisible) {
                controlledVisibility?.current?.set(objectVisibilityKey, objectColumnProps.visible);
            }
            const objectColumnInput: ColumnProps<T> = isColumnChooserChanged && hasExplicitObjectVisible &&
                !isExternalObjectVisibilityChanged ? { ...objectColumnProps, visible: undefined } : objectColumnProps;
            if (typeDetectedObjColumn && isExternalObjectVisibilityChanged) {
                typeDetectedObjColumn.visible = objectColumnProps.visible;
            }
            const columnObject: ColumnProps<T> = defaultColumnProps<T>(
                objectColumnInput,
                serviceLocator,
                gridProps,
                typeDetectedObjColumn,
                isColumnChooserChanged,
                pinnedStackedColumn,
                isStackedHeader
            );
            if (typeDetectedObjColumn && !isNullOrUndefined(typeDetectedObjColumn.visible) &&
                isNullOrUndefined(objectColumnInput?.visible)) {
                columnObject.visible = typeDetectedObjColumn.visible;
            }
            if (columnWidthInfo.current.isColumnWidthChanged && typeDetectedObjColumn?.uid) {
                columnObject.uid = typeDetectedObjColumn?.uid;
            }
            columnObject.orderIndex = isColumnReorderChanged && !isNullOrUndefined(typeDetectedObjColumn?.orderIndex) ?
                typeDetectedObjColumn.orderIndex : isStackedHeader ? columnObject?.columns?.length ? undefined
                    : orderIndex.current++ : columnIndex;
            // Check for rowSpan or colSpan properties
            if (columnObject.rowSpan || columnObject.colSpan) {
                isSpannedColumns = true;
            }
            if (columnObject?.groupCaptionAggregateType) {
                const types: string[] = columnObject.groupCaptionAggregateType instanceof Array ?
                    columnObject.groupCaptionAggregateType : [columnObject.groupCaptionAggregateType];
                groupCaptionAggregateType.set(columnObject.field, types);
            }
            const columnKey: string = generateUniqueKey(columnObject, currentIndex, 'obj-');

            // Check for nested columns property to support stacked headers in object-based configuration
            if (columnObject.columns && columnObject.columns.length > 0) {
                // Compare parent (stacked-header) column with previous to detect property changes
                const parentDetection: ColumnChangeDetectionResult = detectColumnChanges(
                    prevColumns, parentIndex, parentDepth, columnIndex,
                    columnObject, isColumnChanged, isUIColumnpropertiesChanged
                );
                isColumnChanged = parentDetection.isColumnChanged;
                isUIColumnpropertiesChanged = parentDetection.isUIColumnpropertiesChanged;
                // This is a parent column with nested children - process recursively like Tag Directives do
                const childLeafStartIndex: number = globalLeafIndexOffset + visibleColumns.length;
                const childContents: PrepareColumns<T> = prepareColumns<T>(
                    serviceLocator,
                    columnObject.columns,
                    isStackedHeader,
                    parentDepth + 1,
                    currentIndex,
                    prevColumns,
                    gridProps?.reorderSettings?.enabled && columnObject.columns
                        ? typeDetectedUIColumns?.[i as number]?.columns ?? typeDetectedUIColumns : typeDetectedUIColumns,
                    gridProps,
                    isColumnChooserChanged,
                    controlledVisibility,
                    columnWidthInfo,
                    isColumnReorderChanged,
                    orderIndex,
                    isAutoHeightEnabled,
                    groupCaptionAggregateType,
                    childLeafStartIndex,
                    columnObject.headerText,
                    flatMap,  // Pass flattened map to maintain field-based lookup in nested columns
                    isColumnChanged,
                    isUIColumnpropertiesChanged
                );
                isStackedHeader = childContents.isStackedHeader || isStackedHeader;
                const mergeResult: MergeNestedColumnResultReturn = mergeNestedColumnResult(
                    childContents,
                    childLeafStartIndex,
                    columnKey,
                    columnObject,
                    childContents.children,
                    columnObject,
                    parentDepth,
                    parentHeaderText,
                    visibleColumns,
                    columnOffsets,
                    stackedHeaderColumns,
                    columns,
                    colGroup,
                    adjustedChildren,
                    totalVirtualColumnWidth,
                    isStackedHeader,
                    isCommandEditEnabled,
                    isAutoHeightEnabled,
                    isColumnChanged,
                    isUIColumnpropertiesChanged,
                    isCheckBoxColumn,
                    isSpannedColumns,
                    maxDepth
                );
                totalVirtualColumnWidth = mergeResult.totalVirtualColumnWidth;
                isStackedHeader = mergeResult.isStackedHeader;
                isCommandEditEnabled = mergeResult.isCommandEditEnabled;
                isAutoHeightEnabled = mergeResult.isAutoHeightEnabled;
                isColumnChanged = mergeResult.isColumnChanged;
                isUIColumnpropertiesChanged = mergeResult.isUIColumnpropertiesChanged;
                isCheckBoxColumn = mergeResult.isCheckBoxColumn;
                isSpannedColumns = mergeResult.isSpannedColumns;
                maxDepth = mergeResult.maxDepth;
                childContents.leftPinnedColumns?.forEach((node: {Column: ReactNode, Col: ReactNode}, field: string) => {
                    leftPinnedColumns.set(field, node);
                });
                childContents.rightPinnedColumns?.forEach((node: {Column: ReactNode, Col: ReactNode}, field: string) => {
                    rightPinnedColumns.set(field, node);
                });
            } else {
                // Leaf column - no nested children
                // Only compare specific properties that should trigger a change
                const leafDetection: ColumnChangeDetectionResult = detectColumnChanges(
                    prevColumns, parentIndex, parentDepth, columnIndex,
                    columnObject, isColumnChanged, isUIColumnpropertiesChanged
                );
                isColumnChanged = leafDetection.isColumnChanged;
                isUIColumnpropertiesChanged = leafDetection.isUIColumnpropertiesChanged;
                if (columnObject?.type === ColumnType.SingleGroup) {
                    if (!columnObject.field) {
                        columnObject.field = columnObject.uid;
                    }
                    singleGroupColumn = columnObject;
                } else if (columnObject?.type === ColumnType.RowNumber) {
                    if (!columnObject.field) {
                        columnObject.field = columnObject.uid;
                    }
                }
                columns.push(columnObject);
                if (columnObject.type === ColumnType.Checkbox) {
                    isCheckBoxColumn = true;
                }
                const objectColumnElement: ReactElement<IColumnBase<T>> =
                    <ColumnBase<T> key={columnKey} {...columnObject} /> as ReactElement<IColumnBase<T>>;
                stackedHeaderColumns.push({
                    element: objectColumnElement,
                    columnProps: columnObject,
                    depth: parentDepth ?? 0,
                    uid : objectColumnElement.props.uid,
                    leafCount: 1,
                    ContainsChildIndex: null,
                    childDetails: [],
                    totalWidth: getFlattenedColumnTotalWidth(objectColumnElement),
                    ParentHeaderText: parentHeaderText
                });
                if (columnObject.visible) {
                    let width: string | number = columnObject.width;
                    const uiColumnWidth: string | number = typeDetectedObjColumn?.width;
                    if (isDynamicWidth(columnObject.width) || !isNullOrUndefined(columnObject.minWidth)
                        || !isNullOrUndefined(columnObject.maxWidth)) {
                        columnWidthInfo.current.hasDynamicWidth = true;
                    }
                    if (columnObject.autoFit) {
                        columnWidthInfo.current.hasAutoFitWidth = true;
                    }
                    if (columnWidthInfo.current.isColumnWidthChanged && !columnWidthInfo.current.renderInitialWidth
                        && !isNullOrUndefined(uiColumnWidth)) {
                        width = uiColumnWidth;
                        if (parseUnit(width) === columnObject.maxWidth) {
                            columnWidthInfo.current.maxTableWidth = true;
                        }
                    }
                    isCommandEditEnabled = !isNullOrUndefined(columnObject.getCommandItems);
                    isAutoHeightEnabled = isAutoHeightEnabled || columnObject.autoHeight;
                    totalVirtualColumnWidth += parseUnit(width) ?? 150;
                    visibleColumns.push(columnObject);
                    columnOffsets[visibleColumns.length as number] = totalVirtualColumnWidth;
                    adjustedChildren.push(objectColumnElement);

                    if (columnObject.field) {
                        fieldOrderMap.set(columnObject.field, visibleColumns.length - 1);
                        columnMap.set(columnObject.field, columnObject);
                    }
                    if (columnObject.uid) {
                        columnUidMap.set(columnObject.uid, columnObject);
                        uidOrderMap.set(columnObject.uid, visibleColumns.length - 1);
                    }
                    colGroup.push( // Generate col element for object definitions
                        <col
                            key={`col-${columnKey}-${Math.random().toString(36).substr(2, 9)}`}
                            style={{
                                width: width,
                                ...COL_ELEMENT_STYLE
                            }}
                            data-uid={columnObject.uid}
                            data-order-index={columnObject.orderIndex}
                        />
                    );
                    if (columnObject.pinDirection === ColumnPinDirection.Left) {
                        leftPinnedColumns.set(columnObject?.field ??
                            columnObject?.headerText, {Column: adjustedChildren?.[adjustedChildren?.length - 1],
                            Col: colGroup?.[colGroup?.length - 1]});
                    } else if (columnObject.pinDirection === ColumnPinDirection.Right) {
                        rightPinnedColumns.set(columnObject?.field ??
                            columnObject?.headerText, {Column: adjustedChildren?.[adjustedChildren?.length - 1],
                            Col: colGroup?.[colGroup?.length - 1]});
                    }
                }
            }
            columnIndex++;
        }
    }

    if (isNullOrUndefined(parentDepth) && columns.length && !isStackedHeader) {
        const leftColumns: ColumnProps<T>[] = columns.filter(
            (column: ColumnProps<T>) => column.pinDirection === ColumnPinDirection.Left);
        const rightColumns: ColumnProps<T>[] = columns.filter(
            (column: ColumnProps<T>) => column.pinDirection === ColumnPinDirection.Right);
        const unpinnedColumns: ColumnProps<T>[] = columns.filter(
            (column: ColumnProps<T>) => column.pinDirection !== ColumnPinDirection.Left &&
                column.pinDirection !== ColumnPinDirection.Right);
        const sortByOrderIndex: (a: ColumnProps<T>, b: ColumnProps<T>) => number =
            (a: ColumnProps<T>, b: ColumnProps<T>): number => (a.orderIndex ?? 0) - (b.orderIndex ?? 0);
        leftColumns.sort(sortByOrderIndex);
        unpinnedColumns.sort(sortByOrderIndex);
        rightColumns.sort(sortByOrderIndex);
        let cursor: number = 0;
        for (const column of leftColumns) {
            column.orderIndex = cursor++;
        }
        for (const column of unpinnedColumns) {
            column.orderIndex = cursor++;
        }
        for (const column of rightColumns) {
            column.orderIndex = cursor++;
        }
    }

    if (maxDepth === parentDepth) {
        maxDepth++;
    }

    if (isStackedHeader) {
        const newColumnOffsets: Record<number, number> = {};
        const rowEntries: Array<ColumnProps<T>[]> = Array.from({ length: maxDepth }, () => [] as ColumnProps<T>[]);

        let continuousIndex: number = 0;
        let cumulativeWidth: number = 0;

        for (const column of stackedHeaderColumns ?? []) {
            const props: ColumnProps<T> | undefined = column.element?.props as ColumnProps<T> | undefined;
            const columnModel: ColumnProps<T> | undefined = column.columnProps ?? props;
            const field: string | undefined = columnModel?.field ?? props?.field;
            const uid: string | undefined = columnModel?.uid ?? props?.uid;
            const headerText: string | undefined = columnModel?.headerText ?? props?.headerText;
            const depth: number = column.depth ?? 0;
            const isVisible: boolean = columnModel.visible;
            // Build row entries
            if (isVisible && depth >= 0 && depth < maxDepth) {
                const currentRowEntries: ColumnProps<T>[] = rowEntries[depth as number];
                currentRowEntries.push(columnModel as ColumnProps<T>);
            }

            // Build flattened columns
            allStackedColumnProps.push(columnModel as ColumnProps<T>);
            if (column.leafCount === 1 && field) {
                stackedFlattedColumns.push(column.element);
                stackedFlattedColumnProps.push(columnModel as ColumnProps<T>);
                if (isVisible) {
                    visibleStackedHeaderColumns.push(columnModel as ColumnProps<T>);
                }
            }

            // Process only valid stacked header columns
            if (uid && headerText && field && isVisible) {
                cumulativeWidth += column.totalWidth ?? 0;
                newColumnOffsets[++continuousIndex] = cumulativeWidth;
            }
        }

        // Replace columnOffsets
        Object.keys(columnOffsets).forEach((key: string) => delete columnOffsets[Number(key)]);
        Object.assign(columnOffsets, newColumnOffsets);

        stackedRowEntries = rowEntries;
    } else if (isNullOrUndefined(parentDepth)) {
        colGroup.sort((a: JSX.Element, b: JSX.Element) => {
            const aIndex: number = a.props['data-order-index'];
            const bIndex: number = b.props['data-order-index'];
            return aIndex - bIndex;
        });
    }

    columnWidthInfo.current.renderInitialWidth = false;

    return {
        columns,
        depth: maxDepth,
        children: <RenderBase<T> key={'Columns'}>{adjustedChildren}</RenderBase>,
        colGroup,
        isColumnChanged,
        isUIColumnpropertiesChanged,
        isCheckBoxColumn,
        totalVirtualColumnWidth,
        columnOffsets,
        visibleColumns,
        stackedHeaderColumns,
        stackedFlattedColumns,
        visibleStackedHeaderColumns,
        allStackedColumnProps,
        stackedFlattedColumnProps,
        stackedRowEntries,
        isStackedHeader,
        isCommandEditEnabled,
        isAutoHeightEnabled,
        isSpannedColumns,
        singleGroupColumn,
        groupCaptionAggregateType,
        fieldOrderMap,
        uidOrderMap,
        columnMap,
        columnUidMap,
        leftPinnedColumns,
        rightPinnedColumns
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
        ('field' in child || 'columns' in child ||
        (child as ColumnProps)?.type === ColumnType.Checkbox || (child as ColumnProps)?.type === ColumnType.RowDragAndDrop ||
        (child as ColumnProps)?.type === ColumnType.Pin ||
        !isNullOrUndefined((child as ColumnProps)?.getCommandItems) || (child as ColumnProps)?.type === ColumnType.SingleGroup ||
        (child as ColumnProps)?.type === ColumnType.RowNumber);
}

/**
 * Custom hook to process columns from props
 *
 * @param {Partial<IGridBase>} props - Grid properties
 * @param {ServiceLocator} serviceLocator - ServiceLocator for column formatting and parsing property updates.
 * @param {RefObject<GridRef>} gridRef - Grid reference object properties
 * @param {RefObject<PendingState>} dataState - Data state object properties
 * @param {RefObject<boolean>} isInitialBeforePaint - UI column properties changes not trigger event purpose boolean
 * @param {Object[]} currentViewData - Updated Current view data
 * @param {ColumnProps[]} typeDetectedUIColumns - After getting data type updated ui columns.
 * @returns {Partial<IGridBase>} Updated grid properties with processed columns
 */
export const useColumns: <T>(props: Partial<IGridBase<T>>, serviceLocator: ServiceLocator, gridRef: RefObject<GridRef<T>>,
    dataState?: RefObject<PendingState>, isInitialBeforePaint?: RefObject<boolean>,
    currentViewData?: (GroupedData<T> | T)[], typeDetectedUIColumns?: ColumnProps<T>[]) =>
Partial<Omit<IGridBase<T>, 'uiColumns'>> & { uiColumns: ColumnProps<T>[], isCheckBoxColumn: boolean,
    totalVirtualColumnWidth: number, columnOffsets: {[key: number]: number}, visibleColumns: ColumnProps<T>[],
    stackedHeaderColumns: FlattenedColumn<T>[], reorderState: RefObject<ReorderState>,
    isStackedHeader: boolean,
    isCommandEditEnabled: boolean, setColumnChooserState: Dispatch<SetStateAction<Object>>,
    columnWidthInfo: RefObject<ColumnWidthInfo>, setColumnWidthState: Dispatch<SetStateAction<Object>>,
    setColumnReorderState: Dispatch<SetStateAction<Object>>,
    isAutoHeightEnabled: boolean, isSpannedColumns: boolean, singleGroupColumn: ColumnProps | undefined,
    groupCaptionAggregateType: Map<string, string[]>, fieldOrderMap?: Map<string, number>, uidOrderMap?: Map<string, number>,
    columnMap?: Map<string, ColumnProps<T>>, columnUidMap?: Map<string, ColumnProps<T>>,
    leftPinnedColumns: Map<string, {Column: ReactNode, Col: ReactNode}>,
    rightPinnedColumns: Map<string, {Column: ReactNode, Col: ReactNode}>, visibleStackedHeaderColumns: ColumnProps<T>[],
    allStackedColumnProps: ColumnProps<T>[],
    stackedFlattedColumnProps: ColumnProps<T>[],
    stackedRowEntries: ColumnProps<T>[][] } =
    <T, >(props: Partial<IGridBase<T>>, serviceLocator: ServiceLocator, gridRef: RefObject<GridRef<T>>,
        dataState?: RefObject<PendingState>, isInitialBeforePaint?: RefObject<boolean>,
        currentViewData?: (GroupedData<T> | T)[], typeDetectedUIColumns?: ColumnProps<T>[]):
    Partial<Omit<IGridBase<T>, 'uiColumns'>> & { uiColumns: ColumnProps<T>[], isCheckBoxColumn: boolean,
        totalVirtualColumnWidth: number, columnOffsets: {[key: number]: number},
        visibleColumns: ColumnProps<T>[], stackedHeaderColumns: FlattenedColumn<T>[], reorderState: RefObject<ReorderState>,
        stackedFlattedColumns: ReactElement<IColumnBase<T>>[], isStackedHeader: boolean, isCommandEditEnabled: boolean,
        setColumnChooserState: Dispatch<SetStateAction<Object>>, isAutoHeightEnabled: boolean,
        columnWidthInfo: RefObject<ColumnWidthInfo>, setColumnWidthState: Dispatch<SetStateAction<Object>>,
        setColumnReorderState: Dispatch<SetStateAction<Object>>,
        isSpannedColumns: boolean, singleGroupColumn: ColumnProps | undefined,
        groupCaptionAggregateType: Map<string, string[]>, fieldOrderMap?: Map<string, number>, uidOrderMap?: Map<string, number>,
        columnMap?: Map<string, ColumnProps<T>>, columnUidMap?: Map<string, ColumnProps<T>>,
        leftPinnedColumns: Map<string, {Column: ReactNode, Col: ReactNode}>,
        rightPinnedColumns: Map<string, {Column: ReactNode, Col: ReactNode}>, visibleStackedHeaderColumns: ColumnProps<T>[],
        allStackedColumnProps: ColumnProps<T>[],
        stackedFlattedColumnProps: ColumnProps<T>[],
        stackedRowEntries: ColumnProps<T>[][] } => {
        const prevPrepareColumns: RefObject<PrepareColumns<T>> = useRef({} as PrepareColumns<T>);
        const rowNumberColumn: ColumnProps<T> = { type: ColumnType.RowNumber, width: 50, showInColumnChooser: false,
            textAlign: TextAlign.Right, headerText: '', maxWidth: 50, minWidth: 50, allowResize: false, disableAutofill: true,
            visible: props?.rowNumberSettings?.enabled };
        const rowDragColumn: ColumnProps<T> = { type: ColumnType.RowDragAndDrop, width: 60, maxWidth: 60, minWidth: 60,
            showInColumnChooser: false, textAlign: TextAlign.Center, allowResize: false, disableAutofill: true } as ColumnProps<T>;
        const additionalColumns: ColumnProps<T>[] = [];
        const isFeatureSpecificColumnAddedOrRemoved: RefObject<boolean> = useRef(false);
        useMemo(() => {
            if (prevPrepareColumns.current?.columns?.length) {
                if (props?.dragAndDropSettings?.enabled) {
                    prevPrepareColumns.current?.columns.unshift(rowDragColumn);
                    gridRef.current?.columns?.unshift(rowDragColumn);
                    typeDetectedUIColumns?.unshift(rowDragColumn);
                    additionalColumns.unshift(rowDragColumn);
                } else {
                    prevPrepareColumns.current.columns?.splice(props?.rowNumberSettings?.enabled ? 1 : 0, 1); // if we filter, new object reference created then refresh DataManager will happens
                    gridRef.current?.columns?.splice(props?.rowNumberSettings?.enabled ? 1 : 0, 1);
                    typeDetectedUIColumns?.splice(props?.rowNumberSettings?.enabled ? 1 : 0, 1);
                }
                if (props?.rowNumberSettings?.enabled) {
                    additionalColumns.unshift(rowNumberColumn);
                }
                isFeatureSpecificColumnAddedOrRemoved.current = true;
            }
        }, [props?.dragAndDropSettings?.enabled]);
        useMemo(() => {
            if (prevPrepareColumns.current?.columns?.length) {
                if (props?.rowNumberSettings?.enabled) {
                    if (prevPrepareColumns.current.columns?.[0]?.type !== ColumnType.RowNumber) {
                        prevPrepareColumns.current?.columns.unshift(rowNumberColumn);
                    }
                    if (gridRef.current?.columns?.[0]?.type !== ColumnType.RowNumber) {
                        gridRef.current?.columns?.unshift(rowNumberColumn);
                    }
                    if (typeDetectedUIColumns?.[0]?.type !== ColumnType.RowNumber) {
                        typeDetectedUIColumns?.unshift(rowNumberColumn);
                    }
                    if (props?.dragAndDropSettings?.enabled) {
                        additionalColumns.unshift(rowDragColumn);
                    }
                    additionalColumns.unshift(rowNumberColumn);
                } else {
                    if (prevPrepareColumns.current.columns?.[0]?.type === ColumnType.RowNumber) {
                        prevPrepareColumns.current.columns.splice(0, 1); // if we filter, new object reference created then refresh DataManager will happens
                    }
                    if (gridRef.current?.columns?.[0]?.type === ColumnType.RowNumber) {
                        gridRef.current.columns.splice(0, 1);
                    }
                    if (typeDetectedUIColumns?.[0]?.type === ColumnType.RowNumber) {
                        typeDetectedUIColumns.splice(0, 1);
                    }
                    if (props?.dragAndDropSettings?.enabled) {
                        additionalColumns.unshift(rowDragColumn);
                    }
                }
                isFeatureSpecificColumnAddedOrRemoved.current = true;
            }
        }, [props?.rowNumberSettings?.enabled]);
        const isNoColumnRemoteData: boolean = useMemo(() => {
            return !props.columns && !prevPrepareColumns.current?.columns?.length && props.dataSource instanceof DataManager
                && props.dataSource.dataSource.url && Array.isArray(currentViewData) && currentViewData?.length > 0;
        }, [props.children, props.columns, props.dataSource, currentViewData]);
        const [columnChooserState, setColumnChooserState] = useState<Object>({});
        const controlledVisibility: RefObject<Map<string, boolean | undefined>> = useRef(new Map());
        let isColumnChooserChanged: boolean = false;
        const [columnWidthState, setColumnWidthState] = useState<Object>({});
        const columnWidthInfo: RefObject<ColumnWidthInfo> = useRef({});
        columnWidthInfo.current.isColumnWidthChanged = false;
        let isColumnReorderChanged: boolean = false;
        const [columnReorderState, setColumnReorderState] = useState<Object>({});
        const orderIndex: RefObject<number> = useRef(0);
        orderIndex.current = 0;
        const reorderState: RefObject<ReorderState> = useRef({
            column: null,
            fromIndex: -1,
            toIndex: -1,
            target: null,
            targetColumn: null
        });
        const isLocalStackedHeader: RefObject<boolean> = useRef<boolean>(false);
        useMemo(() => {
            if (!isInitialBeforePaint.current) {
                isLocalStackedHeader.current = false;
            }
        }, [props.columns, props.children]);
        useMemo(() => {
            if (!isInitialBeforePaint.current) {
                isColumnChooserChanged = true;
                columnWidthInfo.current.isColumnWidthChanged = true;
                isColumnReorderChanged = true;
                if (reorderState.current.column && reorderState.current.targetColumn) {
                    if ((props.columns || props.children) && isLocalStackedHeader.current) {
                        const isBefore: boolean = getEffectiveOrderIndex(reorderState.current.targetColumn) <
                            getEffectiveOrderIndex(reorderState.current.column);
                        const reorderedColumns: ColumnProps<T>[] = reorderStackedColumns(
                            prevPrepareColumns.current.columns,
                            reorderState.current.column.uid,
                            reorderState.current.targetColumn.uid,
                            isBefore ? 'before' : 'after'
                        );
                        prevPrepareColumns.current.columns.splice(
                            0, prevPrepareColumns.current.columns.length, ...reorderedColumns
                        );
                        const reorderedGridColumns: ColumnProps<T>[] = reorderStackedColumns(
                            gridRef.current?.columns,
                            reorderState.current.column.uid,
                            reorderState.current.targetColumn.uid,
                            isBefore ? 'before' : 'after'
                        );
                        gridRef.current.columns.splice(0, gridRef.current.columns.length, ...reorderedGridColumns);
                        const reorderedTypeDetectedColumns: ColumnProps<T>[] = reorderStackedColumns(
                            typeDetectedUIColumns,
                            reorderState.current.column.uid,
                            reorderState.current.targetColumn.uid,
                            isBefore ? 'before' : 'after'
                        );
                        typeDetectedUIColumns?.splice(0, typeDetectedUIColumns?.length ?? 0, ...reorderedTypeDetectedColumns);
                        columnWidthInfo.current.isColumnWidthChanged = false;
                    }

                    reorderState.current = {
                        column: null,
                        fromIndex: -1,
                        toIndex: -1,
                        target: null,
                        targetColumn: null
                    };
                }
            }
        }, [columnChooserState, columnWidthState, columnReorderState]);
        let isDataSourceChanged: boolean = false;
        useMemo(() => isDataSourceChanged = true, [props.dataSource]);
        const {
            children,
            depth: headerRowDepth,
            columns,
            colGroup,
            uiColumns,
            totalVirtualColumnWidth,
            columnOffsets,
            isCheckBoxColumn,
            visibleColumns,
            stackedHeaderColumns,
            stackedFlattedColumns,
            isStackedHeader,
            isCommandEditEnabled,
            isAutoHeightEnabled,
            isSpannedColumns,
            singleGroupColumn,
            groupCaptionAggregateType,
            visibleStackedHeaderColumns,
            allStackedColumnProps,
            stackedFlattedColumnProps,
            stackedRowEntries,
            fieldOrderMap,
            uidOrderMap,
            columnMap,
            columnUidMap,
            leftPinnedColumns,
            rightPinnedColumns
        } = useMemo(() => {
            if (dataState.current.isPending && prevPrepareColumns.current.columns) {
                return prevPrepareColumns.current;
            }
            const autoGeneratedColumns: Object[] = ((Array.isArray(props.dataSource) &&
                (props.dataSource as Object[]).length > 0) ? Object.keys((props.dataSource as Object[])[0])
                    .map((key: string) => ({
                        field: key,
                        headerText: key
                    }))
                : ((Array.isArray(currentViewData) && currentViewData?.length > 0)
                    ? Object.keys(currentViewData[0])
                        .map((key: string) => ({
                            field: key,
                            headerText: key
                        }))
                    : undefined)
            );
            if (!isFeatureSpecificColumnAddedOrRemoved.current && props?.rowNumberSettings?.enabled) {
                additionalColumns.push(rowNumberColumn);
            }

            if (!isFeatureSpecificColumnAddedOrRemoved.current && props?.dragAndDropSettings?.enabled) {
                additionalColumns.push(rowDragColumn);
            }
            isLocalStackedHeader.current = isLocalStackedHeader.current || hasNestedColumns(props.columns, props.children);
            const defaultColumns: ReactNode | (ColumnProps<T> | ReactElement)[] =
                additionalColumns.length && props.columns ? [...additionalColumns, ...props.columns] :
                    (isColumnReorderChanged && typeDetectedUIColumns?.length && isLocalStackedHeader.current ? [...typeDetectedUIColumns]
                        : props.columns) ?? (!isNoColumnRemoteData ? props.children : null)
                        ?? (additionalColumns.length && autoGeneratedColumns?.length ?
                            [...additionalColumns, ...autoGeneratedColumns] : autoGeneratedColumns);

            const result: PrepareColumns<T> = prepareColumns<T>(
                serviceLocator, defaultColumns, isLocalStackedHeader.current, null, null, gridRef.current?.columns as ColumnProps<T>[],
                typeDetectedUIColumns, props, isColumnChooserChanged, controlledVisibility, columnWidthInfo,
                isColumnReorderChanged, orderIndex
            );
            if (!result.isColumnChanged && gridRef.current?.columns) {
                if (result.isUIColumnpropertiesChanged || prevPrepareColumns.current?.columns?.length !== result.columns?.length ||
                    isColumnChooserChanged || columnWidthInfo.current.isColumnWidthChanged || isColumnReorderChanged ||
                    isFeatureSpecificColumnAddedOrRemoved.current) {
                    isInitialBeforePaint.current = (isColumnChooserChanged || columnWidthInfo.current.isColumnWidthChanged
                        || isColumnReorderChanged) ? isInitialBeforePaint.current : true;
                    isFeatureSpecificColumnAddedOrRemoved.current = false;
                    return {
                        ...prevPrepareColumns.current,
                        uiColumns: columnWidthInfo.current.isColumnWidthChanged ? typeDetectedUIColumns : result.columns,
                        depth: result.depth,
                        children: result.children,
                        colGroup: result.colGroup,
                        isCheckBoxColumn: result.isCheckBoxColumn,
                        visibleColumns: result.visibleColumns,
                        stackedHeaderColumns: result.stackedHeaderColumns,
                        stackedFlattedColumns: result.stackedFlattedColumns,
                        visibleStackedHeaderColumns: result.visibleStackedHeaderColumns,
                        allStackedColumnProps: result.allStackedColumnProps,
                        stackedFlattedColumnProps: result.stackedFlattedColumnProps,
                        stackedRowEntries: result.stackedRowEntries,
                        isStackedHeader: result.isStackedHeader,
                        totalVirtualColumnWidth: result.totalVirtualColumnWidth,
                        columnOffsets: result.columnOffsets,
                        isCommandEditEnabled: result.isCommandEditEnabled,
                        isAutoHeightEnabled: result.isAutoHeightEnabled,
                        singleGroupColumn: result.singleGroupColumn,
                        groupCaptionAggregateType: result.groupCaptionAggregateType,
                        fieldOrderMap: result.fieldOrderMap,
                        uidOrderMap: result.uidOrderMap,
                        columnMap: result.columnMap,
                        columnUidMap: result.columnUidMap,
                        leftPinnedColumns: result.leftPinnedColumns,
                        rightPinnedColumns: result.rightPinnedColumns
                    };
                } else if (!isDataSourceChanged) {
                    return {
                        ...prevPrepareColumns.current,
                        uiColumns: typeDetectedUIColumns // if dummy re-render without any grid state change purpose old type defined uiColumns re-used here.
                    };
                }
            }
            prevPrepareColumns.current = result;
            return result; // content refresh with dataManager request and triggering events.
        }, [props.children, props.columns, props.dataSource, isNoColumnRemoteData, columnChooserState, columnWidthState,
            columnReorderState]);

        return useMemo(() => ({
            columns,
            uiColumns,
            visibleColumns,
            stackedHeaderColumns,
            reorderState,
            stackedFlattedColumns,
            isStackedHeader,
            headerRowDepth,
            children,
            colElements: colGroup,
            isCheckBoxColumn,
            setColumnChooserState,
            columnWidthInfo,
            setColumnWidthState,
            setColumnReorderState,
            totalVirtualColumnWidth,
            columnOffsets,
            isCommandEditEnabled,
            isAutoHeightEnabled,
            isSpannedColumns,
            singleGroupColumn,
            groupCaptionAggregateType,
            visibleStackedHeaderColumns: visibleStackedHeaderColumns,
            allStackedColumnProps,
            stackedFlattedColumnProps,
            stackedRowEntries,
            fieldOrderMap,
            uidOrderMap,
            columnMap,
            columnUidMap,
            leftPinnedColumns,
            rightPinnedColumns
        }), [columns, uiColumns, isStackedHeader, headerRowDepth, colGroup, visibleStackedHeaderColumns, allStackedColumnProps,
            stackedFlattedColumnProps, stackedRowEntries]);
    };

