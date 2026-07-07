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
    PendingState, MutableGridSetter, UseRenderResult,
    ChildInfoResult, GroupedData, OnGroupArgs, ShouldExpandGroupEvent
} from '../types';
import {
    IGrid,
    IGridBase,
    GridRef,
    GridProps} from '../types/grid.interfaces';
import { ColumnProps, PrepareColumns, IColumnBase } from '../types/column.interfaces';
import { AggregateRowProps, AggregateColumnProps } from '../types/aggregate.interfaces';
import { formatUnit, isNullOrUndefined } from '@syncfusion/react-base';
import { DataManager, DataResult, ReturnType, Query } from '@syncfusion/react-data';
import { Column, ColumnBase } from '../components';
import {
    useGridComputedProvider,
    useGridMutableProvider
} from '../contexts';
import { defaultColumnProps } from '../hooks';
import { Columns, RenderBase, Aggregates } from '../views';
import { compareSelectedProperties, getGroupLayoutFlattedData, parseUnit, updatePageWiseStartEndIndexes, updateUIColumnType } from '../utils';
import { ActionType, AggregateType, ColumnType, DataResponse, FilterEvent, PageEvent, ScrollMode, SearchEvent, ServiceLocator, SortEvent } from '../types';

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

/**
 * Custom hook to manage rendering state and data for the grid
 *
 * @private
 * @returns {UseRenderResult} Object containing APIs for grid rendering
 */
export const useRender: <T>() => UseRenderResult<T> = <T, >(): UseRenderResult<T> => {
    const grid: Partial<GridRef<T>> & Partial<MutableGridSetter<T>> = useGridComputedProvider<T>();
    const { setCurrentViewData, setInitialLoad, setTotalRecordsCount, aggregates, pageSettings,
        sortSettings, scrollModule, shouldExpandGroup, groupSettings, setGridAction } = grid;
    const { currentViewData, currentPage, gridAction, isInitialLoad, virtualSettings, scrollMode, uiColumns, setResponseData,
        dataModule, totalRecordsCount, selectionModule, setVirtualCachedViewData, infiniteScrollState, setInfiniteScrollState,
        virtualCachedViewData, expandedGroupCountRef, groupModule, loadedPageWiseGroupExpandedCountRef, setPageWiseGroupResponseViewData,
        pageWiseGroupResponseViewData, loadedPageWiseVirtualGroupStartEndRowIndexes
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
        grid.sortSettings?.columns.length, grid.searchSettings?.value, scrollMode]);

    const updateColumnTypes: (data: Object) => void = useCallback((data: Object) => {
        while ('items' in data) {
            data = data['items']?.[0] as Object;
        }
        (uiColumns.current ?? grid.columns).map((newColumn: Partial<IColumnBase<T>>, index: number) => {
            if (!uiColumns.current) {
                uiColumns.current = [];
            }
            uiColumns.current[index as number] = updateUIColumnType(data, newColumn, grid.serviceLocator, isColTypeDef) as ColumnProps<T>;
            return newColumn;
        });
    }, [grid.columns, uiColumns.current]);

    /**
     * Handle successful data retrieval
     */
    const dataManagerSuccess: (response: Response | ReturnType) => void = useCallback((response: Response | ReturnType): void => {
        const data: ReturnType = response as ReturnType;
        if (!Array.isArray(data.result)) {
            return;
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
            grid.pagerModule?.goToPage(currentPage);
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
                data.result as GroupedData<T>[], shouldExpand, grid.groupSettings, groupModule.collapsedGroups);
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
                    groupModule.fieldBasedExpandedGroupKeysRef?.current?.set(field, newKeys);
                }
            });
            childInfo.fieldBasedCollapsedGroupKeys?.forEach((keys: Set<string>, field: string) => {
                const existingCollapsedKeys: Set<string> = childInfo.fieldBasedCollapsedGroupKeys.get(field);
                if (existingCollapsedKeys?.size) {
                    const newKeys: Set<string> = new Set([...keys, ...existingCollapsedKeys]);
                    groupModule.fieldBasedCollapsedGroupKeysRef?.current?.set(field, newKeys);
                }
            });
            groupModule.setExpandedGroups?.((prev: Set<string>) =>
                new Set([...prev, ...childInfo.expandedGroups]));
            groupModule.setCollapsedGroups?.((prev: Set<string>) =>
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
                    console.warn(
                        [
                            'Syncfusion Pure React Data Grid:',
                            '- Estimated total records count may be inaccurate as the end of dataset was reached' +
                            ' before loading the estimated count of records based on server page size.',
                            '- Overriding estimatedTotalRecordsCount to cached data count.'
                        ].join('\n')
                    );
                }
                setTotalRecordsCount(virtualCachedViewData.size + data.result.length);
                estimatedEndReached = true;
            }
            if (grid.enableDevMode && !infiniteScrollState.serverPageSize && data.result?.length && !grid.filterSettings?.columns?.length &&
                !grid.searchSettings.value?.length && (pageSettings?.pageSize > data.result?.length ||
                    (pageSettings?.pageSizeControlledBy === 'server' && pageSettings?.pageSize !== data?.result?.length))) {
                console.warn(
                    [
                        'Syncfusion Pure React Data Grid:',
                        '- Detected server pageSize does not match with client pageSize.',
                        '- Overriding client pageSize to match server pageSize for achieving better accuracy.'
                    ].join('\n')
                );
            } else if (grid.enableDevMode && !infiniteScrollState.serverPageSize && data.result?.length && isInitialLoad &&
                (pageSettings?.pageSize > data.result?.length || (pageSettings?.pageSizeControlledBy === 'server' &&
                    pageSettings?.pageSize !== data?.result?.length))) {
                console.warn(
                    [
                        'Syncfusion Pure React Data Grid:',
                        '- Detected initial filtering or searching configuration with server response does' +
                        ' not match with client pageSize.',
                        '- Please make sure to set server pageSize as client pageSize.',
                        '- Ignore if already configured.'
                    ].join('\n')
                );
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
            const dataManagerPromise: Promise<Object> = dataModule.getData(gridAction, finalQuery);
            dataManagerPromise.then(dataManagerSuccess).catch(dataManagerFailure);
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
type AggregateColumnCompareKeys = Array<keyof AggregateColumnProps>;

/**
 * Get relevant column properties that should trigger change detection
 * This allows for better performance by only comparing properties that matter
 *
 * @returns {ColumnCompareKeys} - Data Affecting column properties comparison keys
 */
function getDataColumnCompareKeys(): ColumnCompareKeys {
    return [
        'allowSort', 'allowFilter', 'allowSearch', 'columns', 'allowGroup'
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
        'valueAccessor', 'headerCheckbox', 'type', 'autoHeight', 'showInColumnChooser', 'filterTemplate'
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
 * @param {ServiceLocator} serviceLocator - ServiceLocator for column formatting and parsing property updates.
 * @param {Object[]} children - Child react elements or column definitions
 * @param {number} parentDepth - Current depth in the column hierarchy
 * @param {string} parentIndex - Index path for uniqueness
 * @param {ColumnProps[]} prevColumns - previous columns which is used to compare old and new and detect whether customer changed state is related to column or not.
 * @param {ColumnProps[]} typeDetectedUIColumns - After getting data type updated ui columns.
 * @param {IGridBase} gridProps - The grid configured properties.
 * @param {boolean} isColumnChooserChanged - Flag to indicate if column chooser state has changed, used to trigger column property updates when columns are toggled in the column chooser.
 * @param {boolean} isAutoHeightEnabled - Flag to indicate if auto height is enabled for any column, used for optimization to avoid unnecessary checks.
 * @param {Map<string, string>} groupCaptionAggregateType - Map of aggregate fields and types for group captions
 * @returns {Object} Object containing columns, depth, children, and column group elements
 */
const prepareColumns: <T>(
    serviceLocator: ServiceLocator,
    children: ReactNode | (ColumnProps<T> | ReactElement)[],
    parentDepth?: number,
    parentIndex?: string,
    prevColumns?: ColumnProps<T>[],
    typeDetectedUIColumns?: ColumnProps<T>[],
    gridProps?: Partial<IGridBase<T>>,
    isColumnChooserChanged?: boolean,
    isAutoHeightEnabled?: boolean,
    groupCaptionAggregateType?: Map<string, AggregateType | AggregateType[] | string | string[]>
) =>
PrepareColumns<T>
= <T, >(
    serviceLocator: ServiceLocator,
    children: ReactNode | (ColumnProps<T> | ReactElement)[],
    parentDepth: number = 0,
    parentIndex: string = '',
    prevColumns?: ColumnProps<T>[],
    typeDetectedUIColumns?: ColumnProps<T>[],
    gridProps?: IGridBase<T>,
    isColumnChooserChanged: boolean = false,
    isAutoHeightEnabled: boolean = false,
    groupCaptionAggregateType: Map<string, string[]> =
    new Map<string, string[]>()
): PrepareColumns<T> => {
    let totalVirtualColumnWidth: number = 0;
    const columnOffsets: { [key: number]: number } = {};
    let maxDepth: number = parentDepth;
    let isCommandEditEnabled: boolean = false;
    let singleGroupColumn: ColumnProps<T> | undefined = undefined;
    let isColumnChanged: boolean = false; // currently used/handled always column state changed manner even unrelated state change props.children changed.
    let isUIColumnpropertiesChanged: boolean = false;
    let isCheckBoxColumn: boolean = false;
    let isSpannedColumns: boolean = false; // Track if any column has rowSpan or colSpan
    const columns: ColumnProps<T>[] = [];
    const visibleColumns: ColumnProps<T>[] = [];
    const adjustedChildren: ReactNode[] = [];
    const colGroup: JSX.Element[] = [];
    const childArray: ReactElement[] = Array.isArray(children)
        ? children as ReactElement[]
        : Children.toArray(children) as ReactElement[];

    for (let i: number = 0, columnIndex: number = 0; i < childArray.length; i++) {
        const child: ReactElement = childArray[i as number];
        const currentIndex: string = parentIndex ? `${parentIndex}-${i}` : `${i}`;

        if (isValidReactElement(child) && (
            child.type === ColumnBase ||
            child.type === RenderBase ||
            child.type === Columns ||
            child.type === Column
        )) {
            const columnProps: ColumnProps<T> = defaultColumnProps<T>(
                child.props as ColumnProps<T>,
                serviceLocator,
                gridProps,
                typeDetectedUIColumns?.[columnIndex as number],
                isColumnChooserChanged
            );
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
                if ((child.props as { children: ReactNode })?.children) {
                    const childContents: PrepareColumns<T> = prepareColumns<T>(
                        serviceLocator,
                        (child.props as { children: ReactElement })?.children,
                        parentDepth + 1,
                        currentIndex,
                        prevColumns,
                        typeDetectedUIColumns,
                        gridProps,
                        isColumnChooserChanged,
                        isAutoHeightEnabled,
                        groupCaptionAggregateType
                    );
                    totalVirtualColumnWidth += childContents.totalVirtualColumnWidth;
                    const keys: string[] = Object.keys(childContents.columnOffsets);
                    for (let offsetIndex: number = 0; offsetIndex < keys.length; offsetIndex++) {
                        visibleColumns.push(childContents.visibleColumns[offsetIndex as number]);
                        columnOffsets[visibleColumns.length as number] = childContents.columnOffsets[keys[offsetIndex as number] as string];
                    }
                    isCommandEditEnabled = childContents.isCommandEditEnabled;
                    isAutoHeightEnabled = isAutoHeightEnabled || childContents.isAutoHeightEnabled;
                    isColumnChanged = childContents.isColumnChanged;
                    isUIColumnpropertiesChanged = childContents.isUIColumnpropertiesChanged;
                    isCheckBoxColumn = childContents.isCheckBoxColumn;
                    isSpannedColumns = isSpannedColumns || childContents.isSpannedColumns;
                    columns.push({ ...columnProps, columns: childContents.columns }); // Nest child columns
                    colGroup.push(...childContents.colGroup); // Gather col elements from child columns
                    maxDepth = Math.max(maxDepth, childContents.depth);
                } else {
                    if (prevColumns?.[columnIndex as number]?.field === columnProps.field ||
                        (prevColumns?.[columnIndex as number]?.type === ColumnType.SingleGroup)) {
                        // Only compare specific properties that should trigger a change
                        const hasChanged: boolean = isColumnChanged || !compareSelectedProperties(
                            prevColumns?.[columnIndex as number],
                            columnProps,
                            getDataColumnCompareKeys()
                        );
                        // Update isColumnChanged if any changes detected
                        isColumnChanged = isColumnChanged || hasChanged;
                        const hasUIChanged: boolean = isColumnChanged || !compareSelectedProperties(
                            prevColumns?.[columnIndex as number],
                            columnProps,
                            getUIColumnCompareKeys()
                        );
                        isUIColumnpropertiesChanged = isUIColumnpropertiesChanged || hasUIChanged;
                    }
                    if (columnProps?.type === ColumnType.SingleGroup) {
                        if (!columnProps.field) {
                            columnProps.field = columnProps.uid;
                        }
                        singleGroupColumn = columnProps;
                    }
                    // columnProps.index = columns.length;
                    columns.push(columnProps);
                    if (columnProps.type === ColumnType.Checkbox) {
                        isCheckBoxColumn = true;
                    }
                    if (columnProps.visible) {
                        isCommandEditEnabled = !isNullOrUndefined(columnProps.getCommandItems);
                        isAutoHeightEnabled = isAutoHeightEnabled || columnProps.autoHeight;
                        totalVirtualColumnWidth += parseUnit(columnProps.width) ?? 150;
                        visibleColumns.push(columnProps);
                        columnOffsets[visibleColumns.length as number] = totalVirtualColumnWidth;
                        // Only create col elements for leaf columns
                        colGroup.push(
                            <col
                                key={`col-${columnKey}-${Math.random().toString(36).substr(2, 9)}`}
                                style={{
                                    width: columnProps.width,
                                    ...COL_ELEMENT_STYLE
                                }}
                            />
                        );
                        adjustedChildren.push(
                            <ColumnBase<T> key={`col-base-${columnKey}`} {...columnProps}>
                                {(child.props as { children: ReactElement })?.children}
                            </ColumnBase>
                        );
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
                    isCommandEditEnabled: isChildCommandEditEnabled,
                    isAutoHeightEnabled: isChildAutoHeightEnabled,
                    isSpannedColumns: isChildSpannedColumns
                } = prepareColumns<T>(
                    serviceLocator,
                    (child.props as { children: ReactElement })?.children,
                    parentDepth,
                    currentIndex,
                    prevColumns,
                    typeDetectedUIColumns,
                    gridProps,
                    isColumnChooserChanged,
                    isAutoHeightEnabled,
                    groupCaptionAggregateType
                );
                isCommandEditEnabled = isChildCommandEditEnabled;
                isAutoHeightEnabled = isAutoHeightEnabled || isChildAutoHeightEnabled;
                totalVirtualColumnWidth += totalColumnWidth;
                const keys: string[] = Object.keys(childColumnOffsets);
                for (let offsetIndex: number = 0; offsetIndex < keys.length; offsetIndex++) {
                    visibleColumns.push(childVisibleColumns[offsetIndex as number]);
                    columnOffsets[visibleColumns.length as number] = childColumnOffsets[keys[offsetIndex as number] as string];
                }
                isColumnChanged = isChildrenColumnsChanged;
                isUIColumnpropertiesChanged = isChildrenColumnsUIChanged;
                isCheckBoxColumn = isChildCheckboxColumn;
                isSpannedColumns = isSpannedColumns || isChildSpannedColumns;
                columns.push(...childColumns);
                colGroup.push(...childColGroup);
                adjustedChildren.push(
                    ((children as ReactElement).props as { children: ReactElement[] })?.children
                );
                maxDepth = Math.max(maxDepth, depth);
            }
        } else if (isColumnObject(child)) {
            const columnObject: ColumnProps<T> = defaultColumnProps<T>(
                child as ColumnProps<T>,
                serviceLocator,
                gridProps,
                typeDetectedUIColumns?.[i as number],
                isColumnChooserChanged
            );
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

            if (prevColumns?.[columnIndex as number]?.field === columnObject.field ||
                (prevColumns?.[columnIndex as number]?.type === ColumnType.SingleGroup)) {
                // Only compare specific properties that should trigger a change
                const hasChanged: boolean = isColumnChanged || !compareSelectedProperties(
                    prevColumns?.[columnIndex as number],
                    columnObject,
                    getDataColumnCompareKeys()
                );
                // Update isColumnChanged if any changes detected
                isColumnChanged = isColumnChanged || hasChanged;
                const hasUIChanged: boolean = isColumnChanged || !compareSelectedProperties(
                    prevColumns?.[columnIndex as number],
                    columnObject,
                    getUIColumnCompareKeys()
                );
                isUIColumnpropertiesChanged = isUIColumnpropertiesChanged || hasUIChanged;
            }
            if (columnObject?.type === ColumnType.SingleGroup) {
                if (!columnObject.field) {
                    columnObject.field = columnObject.uid;
                }
                singleGroupColumn = columnObject;
            }
            columns.push(columnObject);
            if (columnObject.type === ColumnType.Checkbox) {
                isCheckBoxColumn = true;
            }
            if (columnObject.visible) {
                isCommandEditEnabled = !isNullOrUndefined(columnObject.getCommandItems);
                isAutoHeightEnabled = isAutoHeightEnabled || columnObject.autoHeight;
                totalVirtualColumnWidth += parseUnit(columnObject.width) ?? 150;
                visibleColumns.push(columnObject);
                columnOffsets[visibleColumns.length as number] = totalVirtualColumnWidth;
                adjustedChildren.push(<ColumnBase<T> key={columnKey} {...columnObject} />);

                // Generate col element for object definitions
                colGroup.push(
                    <col
                        key={`col-${columnKey}-${Math.random().toString(36).substr(2, 9)}`}
                        style={{
                            width: columnObject.width,
                            ...COL_ELEMENT_STYLE
                        }}
                    />
                );
            }
            columnIndex++;
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
        isUIColumnpropertiesChanged,
        isCheckBoxColumn,
        totalVirtualColumnWidth,
        columnOffsets,
        visibleColumns,
        isCommandEditEnabled,
        isAutoHeightEnabled,
        isSpannedColumns,
        singleGroupColumn,
        groupCaptionAggregateType
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
        ('field' in child || (child as ColumnProps)?.type === ColumnType.Checkbox ||
        !isNullOrUndefined((child as ColumnProps)?.getCommandItems) || (child as ColumnProps)?.type === ColumnType.SingleGroup);
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
    isCommandEditEnabled: boolean, setColumnChooserState: Dispatch<SetStateAction<Object>>,
    isAutoHeightEnabled: boolean, isSpannedColumns: boolean, singleGroupColumn: ColumnProps | undefined,
    groupCaptionAggregateType: Map<string, string[]> } =
    <T, >(props: Partial<IGridBase<T>>, serviceLocator: ServiceLocator, gridRef: RefObject<GridRef<T>>,
        dataState?: RefObject<PendingState>, isInitialBeforePaint?: RefObject<boolean>,
        currentViewData?: (GroupedData<T> | T)[], typeDetectedUIColumns?: ColumnProps<T>[]):
    Partial<Omit<IGridBase<T>, 'uiColumns'>> & { uiColumns: ColumnProps<T>[], isCheckBoxColumn: boolean,
        totalVirtualColumnWidth: number, columnOffsets: {[key: number]: number},
        visibleColumns: ColumnProps<T>[], isCommandEditEnabled: boolean,
        setColumnChooserState: Dispatch<SetStateAction<Object>>, isAutoHeightEnabled: boolean,
        isSpannedColumns: boolean, singleGroupColumn: ColumnProps | undefined,
        groupCaptionAggregateType: Map<string, string[]> } => {
        const prevPrepareColumns: RefObject<PrepareColumns<T>> = useRef({} as PrepareColumns<T>);
        const isNoColumnRemoteData: boolean = useMemo(() => {
            return !props.columns && !prevPrepareColumns.current?.columns?.length && props.dataSource instanceof DataManager
                && props.dataSource.dataSource.url && Array.isArray(currentViewData) && currentViewData?.length > 0;
        }, [props.children, props.columns, props.dataSource, currentViewData]);
        const [columnChooserState, setColumnChooserState] = useState<Object>({});
        let isColumnChooserChanged: boolean = false;
        useMemo(() => {
            if (!isInitialBeforePaint.current) {
                isColumnChooserChanged = true;
            }
        }, [columnChooserState]);
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
            isCommandEditEnabled,
            isAutoHeightEnabled,
            isSpannedColumns,
            singleGroupColumn,
            groupCaptionAggregateType
        } = useMemo(() => {
            if (dataState.current.isPending && prevPrepareColumns.current.columns) {
                return prevPrepareColumns.current;
            }
            const result: PrepareColumns<T> = prepareColumns<T>(
                serviceLocator,
                props.columns as ColumnProps<T>[] ??
                    (!isNoColumnRemoteData ? props.children : null) ??
                    ((Array.isArray(props.dataSource) && (props.dataSource as Object[]).length > 0)
                        ? Object.keys((props.dataSource as Object[])[0])
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
                    ), null, null, gridRef.current?.columns as ColumnProps<T>[], typeDetectedUIColumns, props, isColumnChooserChanged
            );
            if (!result.isColumnChanged && gridRef.current?.columns) {
                if (result.isUIColumnpropertiesChanged || prevPrepareColumns.current?.columns?.length !== result.columns?.length ||
                    isColumnChooserChanged) {
                    isInitialBeforePaint.current = isColumnChooserChanged ? isInitialBeforePaint.current : true;
                    return {
                        ...prevPrepareColumns.current,
                        uiColumns: result.columns,
                        children: result.children,
                        colGroup: result.colGroup,
                        isCheckBoxColumn: result.isCheckBoxColumn,
                        visibleColumns: result.visibleColumns,
                        totalVirtualColumnWidth: result.totalVirtualColumnWidth,
                        columnOffsets: result.columnOffsets,
                        isCommandEditEnabled: result.isCommandEditEnabled,
                        isAutoHeightEnabled: result.isAutoHeightEnabled,
                        singleGroupColumn: result.singleGroupColumn,
                        groupCaptionAggregateType: result.groupCaptionAggregateType
                    };
                } else if (!isDataSourceChanged) {
                    return prevPrepareColumns.current;
                }
            }
            prevPrepareColumns.current = result;
            return result; // content refresh with dataManager request and triggering events.
        }, [props.children, props.columns, props.dataSource, isNoColumnRemoteData, columnChooserState]);

        return useMemo(() => ({
            columns,
            uiColumns,
            visibleColumns,
            headerRowDepth,
            children,
            colElements: colGroup,
            isCheckBoxColumn,
            setColumnChooserState,
            totalVirtualColumnWidth,
            columnOffsets,
            isCommandEditEnabled,
            isAutoHeightEnabled,
            isSpannedColumns,
            singleGroupColumn,
            groupCaptionAggregateType
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
                return gridRef.current?.aggregates ?? aggregates;
            }
        }, [isAggregateColumnsChanged]);
    };
