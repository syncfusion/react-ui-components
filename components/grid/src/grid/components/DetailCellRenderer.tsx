/**
 * @fileOverview DetailCellRenderer component - Nested grid rendering
 * Renders child Grid component with data binding and lifecycle management.
 * Supports all three data binding modes and recursive nesting.
 * Preserves child grid state, configuration, and data across expand/collapse
 * and scrolling via the {@link DetailGridCache}.
 */

import {
    useEffect,
    useRef,
    useState,
    useCallback,
    useMemo,
    forwardRef,
    useImperativeHandle,
    MutableRefObject,
    JSX
} from 'react';
import {
    DetailCellRendererProps,
    DetailGridRef,
    GetDetailRowDataParams,
    DetailGridOptions, DetailGridCacheEntry
} from '../types/detail-cell-renderer.interfaces';
import { GridRef } from '../types/grid.interfaces';
import { DetailDataBindingService } from '../services/detail-data-binding';
import { DetailGridCache } from '../services/detail-grid-cache';
import { Grid } from './Grid';

/**
 * Module-level singleton cache shared by all DetailCellRenderer instances.
 * Centralised so that a single cache services the entire grid hierarchy
 * (master + nested detail grids) and survives remounts triggered by scrolling
 * or virtualisation.
 */
const sharedDetailGridCache: DetailGridCache = new DetailGridCache();

/**
 * DetailCellRenderer - Renders nested Grid component with data binding lifecycle.
 * Handles three data binding modes: Nested Data, Mapping Data (with mappingID), and Async.
 * Manages child grid creation, data loading, and destruction callbacks.
 * Supports recursive nesting up to maxNestingDepth levels.
 * Preserves child grid state, configuration, and data across expand/collapse
 * and scrolling via the shared {@link DetailGridCache}.
 *
 * @component
 * @template T - Parent row data type
 * @param {DetailCellRendererProps<T>} props - Component props
 * @returns {JSX.Element} Detail grid or loading/error state
 */
export const DetailCellRenderer: React.FC<DetailCellRendererProps> = forwardRef<
DetailGridRef,
DetailCellRendererProps
>(
    (
        {
            data,
            params,
            nestingDepth = 1,
            maxNestingDepth = 3,
            className = 'detail-cell-renderer'
        }: DetailCellRendererProps,
        ref: MutableRefObject<DetailGridRef | null>
    ): JSX.Element => {
        // Build a stable cache key tied to parent identity, depth, and config.
        // The same parent row expanding/collapsing always reuses the same entry,
        // so child grid state (sort/filter/selection/loaded data) is preserved.
        const cacheKey: string = useMemo(
            () => DetailGridCache.buildCacheKey(data, nestingDepth, params.detailGridOptions),
            [data, nestingDepth, params.detailGridOptions]
        );

        // Resolve (or create) the cached descriptor on first render. The descriptor
        // is then synchronised with local state via a ref + state mirror pattern.
        const cacheEntry: DetailGridCacheEntry = useMemo(
            () => sharedDetailGridCache.getOrCreate(
                cacheKey,
                data,
                nestingDepth,
                params.detailGridOptions
            ), [cacheKey, data, nestingDepth, params.detailGridOptions]);

        // Local state mirrors the cached entry so the component still re-renders
        // when data is updated. We seed it from the cache so re-mounts after
        // expand/collapse/scroll preserve the previously loaded data.
        const [childData, setChildData] = useState<unknown[]>(cacheEntry.data);
        const [isLoading, setIsLoading] = useState<boolean>(cacheEntry.isLoading);
        const [error, setError] = useState<string | null>(cacheEntry.error);

        // Refs
        const containerRef: MutableRefObject<HTMLDivElement | null> = useRef<HTMLDivElement | null>(null);
        const gridRef: MutableRefObject<GridRef<unknown> | null> = useRef<GridRef<unknown> | null>(null);
        const hasLoadedRef: MutableRefObject<boolean> = useRef<boolean>(
            cacheEntry.data.length > 0 || cacheEntry.isLoading
        );

        // Early return if max nesting depth exceeded
        const canNest: boolean = useMemo(
            () => nestingDepth < maxNestingDepth,
            [nestingDepth, maxNestingDepth]);

        /**
         * Persist the latest state to the shared cache so the entry survives
         * remounts. Called whenever data, loading, or error changes.
         */
        const persistToCache: (data: unknown[], loading: boolean, err: string | null) => void = useCallback(
            (latestData: unknown[], loading: boolean, err: string | null): void => {
                sharedDetailGridCache.update(cacheKey, latestData, loading, err);
            }, [cacheKey]);

        /**
         * Handle successful data retrieval.
         * Updates state with child data for rendering and persists to cache.
         *
         * @param {unknown[]} data - Child rows array
         */
        const handleDataSuccess: (data: unknown[]) => void = useCallback(
            (data: unknown[]): void => {
                const safeData: unknown[] = Array.isArray(data) ? data : [];
                setChildData(safeData);
                setIsLoading(false);
                setError(null);
                hasLoadedRef.current = true;
                persistToCache(safeData, false, null);
            }, [persistToCache]);

        /**
         * Handle data retrieval failure.
         * Sets error state and clears loading indicator.
         *
         * @param {string} errorMessage - Error description
         */
        const handleDataError: (errorMessage: string) => void = useCallback(
            (errorMessage: string): void => {
                setChildData([]);
                setIsLoading(false);
                setError(errorMessage);
                hasLoadedRef.current = true;
                persistToCache([], false, errorMessage);
                console.error('Detail grid data loading error:', errorMessage);
            }, [persistToCache]);

        /**
         * Load child data using the configured binding mode.
         * Skipped when the cache already holds data so the child grid renders
         * immediately on re-mount with its previously loaded state.
         */
        const loadDetailData: () => Promise<void> = useCallback(async (): Promise<void> => {
            try {
                setIsLoading(true);
                setError(null);
                persistToCache(cacheEntry.data, true, null);

                // Prepare callback parameters
                const callbackParams: GetDetailRowDataParams = {
                    data,
                    mappingID: params.mappingID,
                    childDataSource: params.childDataSource,
                    successCallback: handleDataSuccess,
                    failCallback: handleDataError,
                    getDetailRowData: params.getDetailRowData
                };

                // Check if explicit getDetailRowData callback is provided
                if (params.getDetailRowData && !params.childDataSource) {
                    // Mode 3: Async or custom callback
                    await DetailDataBindingService.executeAsyncCallback(
                        callbackParams,
                        cacheKey
                    );
                } else {
                    // Try to extract data synchronously
                    // Mode 1 or Mode 2: Nested or Mapping Data
                    const extractedData: unknown[] | null = DetailDataBindingService.extractData(
                        callbackParams,
                        undefined, // No nested property path
                        params.mappingID,
                        params.childDataSource
                    );

                    if (extractedData !== null) {
                        handleDataSuccess(extractedData);
                    } else {
                        handleDataError('No data loading method configured');
                    }
                }
            } catch (err: unknown) {
                const message: string = err instanceof Error ? err.message : String(err);
                handleDataError(message);
            }
        }, [
            data,
            params,
            params.mappingID,
            params.childDataSource,
            params.getDetailRowData,
            cacheKey,
            cacheEntry.data,
            handleDataSuccess,
            handleDataError,
            persistToCache
        ]);

        /**
         * Initialize and trigger data loading when component mounts.
         * Lifecycle: Component mounted → Fire onDetailGridCreated → Load data
         */
        useEffect(() => {
            // Always fire creation callback so consumers can hook into the lifecycle
            if (params.onDetailGridCreated) {
                const gridRefValue: DetailGridRef = {
                    id: cacheKey,
                    parentData: data,
                    nestingDepth,
                    element: containerRef.current ?? undefined
                };
                params.onDetailGridCreated(gridRefValue);
            }

            // Only load data when the cache has not previously resolved it.
            // This is the core of the persistence behaviour: re-mounts triggered
            // by expand/collapse or virtual scrolling reuse the cached data set
            // and configuration without re-invoking the binding callback.
            if (!hasLoadedRef.current) {
                loadDetailData();
            }

            // Cleanup: Cancel pending requests if component unmounts.
            // We deliberately do NOT release the cache entry here: the entry must
            // outlive remounts so child grid state is preserved. LRU eviction
            // (driven by `maxInstances`) handles long-term memory management.
            return () => {
                DetailDataBindingService.cancelPendingRequest(cacheKey);

                // Fire destruction callback
                if (params.onDetailGridDestroyed) {
                    const gridRefValue: DetailGridRef = {
                        id: cacheKey,
                        parentData: data,
                        nestingDepth,
                        element: containerRef.current ?? undefined
                    };
                    params.onDetailGridDestroyed(gridRefValue);
                }
            };
        }, [
            data,
            params,
            params.onDetailGridCreated,
            params.onDetailGridDestroyed,
            nestingDepth,
            cacheKey,
            loadDetailData
        ]);

        // Forward ref to parent
        useImperativeHandle(
            ref,
            () => ({
                id: cacheKey,
                parentData: data,
                nestingDepth,
                element: containerRef.current ?? undefined
            }),
            [cacheKey, data, nestingDepth]
        );

        /**
         * Prepare grid configuration with recursive nesting support.
         * Adds recursion parameters and detail config for child grids.
         */
        const gridConfig: DetailGridOptions = useMemo(() => {
            const config: DetailGridOptions = {
                ...params.detailGridOptions,
                maxNestingDepth,
                currentNestingDepth: nestingDepth
            };

            // Add recursive detail rendering if nesting allowed and configured
            if (canNest && params.detailGridOptions?.detailCellRendererParams) {
                config.detailCellRendererParams = {
                    ...params.detailGridOptions.detailCellRendererParams,
                    detailGridOptions: {
                        ...params.detailGridOptions.detailCellRendererParams
                            .detailGridOptions,
                        maxNestingDepth,
                        currentNestingDepth: nestingDepth + 1
                    }
                };
            }

            return config;
        }, [
            params.detailGridOptions,
            maxNestingDepth,
            nestingDepth,
            canNest
        ]);

        // Render loading state
        if (isLoading) {
            return (
                <div
                    ref={containerRef}
                    className={`${className} ${className}--loading`}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100%',
                        minHeight: '50px',
                        backgroundColor: '#f5f5f5'
                    }}
                >
                    <div style={{ textAlign: 'center' }}>
                        <div
                            style={{
                                fontSize: '12px',
                                color: '#666',
                                animation: 'pulse 1.5s infinite'
                            }}
                        >
                        Loading data...
                        </div>
                    </div>
                </div>
            );
        }

        // Render error state
        if (error) {
            return (
                <div
                    ref={containerRef}
                    className={`${className} ${className}--error`}
                    style={{
                        padding: '12px',
                        backgroundColor: '#fee',
                        borderLeft: '4px solid #c33',
                        color: '#c33'
                    }}
                >
                    <div style={{ fontSize: '12px' }}>
                        <strong>Error:</strong> {error}
                    </div>
                </div>
            );
        }

        const persistedGridProps: Record<string, unknown> = JSON.parse(
            window.localStorage.getItem(cacheKey) ?? '{}'
        ) as Record<string, unknown>;
        const gridProps: DetailGridOptions = { ...params.detailGridOptions, ...persistedGridProps };

        // Render detail grid with child data
        return (
            <div
                ref={containerRef}
                className={className}
                style={{
                    width: '100%',
                    height:
              typeof gridConfig.height === 'number'
                  ? `${gridConfig.height}px`
                  : gridConfig.height || '100%',
                    overflow: 'auto'
                }}
            >
                <Grid
                    ref={gridRef}
                    id={cacheKey}
                    isChildrenGrid={true}
                    dataSource={childData}
                    {...(hasLoadedRef.current ? gridProps : params.detailGridOptions)}
                />
            </div>
        );
    }
);

/**
 * Display name for debugging and React DevTools.
 */
DetailCellRenderer.displayName = 'DetailCellRenderer';

export default DetailCellRenderer;
