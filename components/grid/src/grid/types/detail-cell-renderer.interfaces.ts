import { DataManager, DataResult } from '@syncfusion/react-data';
import {  ColumnProps, GridProps } from '.';

/**
 * @fileOverview DetailCellRenderer types - Master-Detail pattern
 * Defines TypeScript interfaces for nested Grid components.
 * Supports Nested Data, Mapping Data (with mappingID), and Async data binding modes.
 */

/**
 * Callback parameters for data retrieval in detail grids.
 * Provides context data and success/failure callbacks for async operations.
 *
 * @template T - Parent row data type
 * @template CT - Child row data type
 */
export interface GetDetailRowDataParams<T = unknown, CT = unknown> {
    /**
     * Parent row data object.
     * Contains all properties of the expanded row.
     */
    data: T;

    /**
     * Parent key field name for Mapping Data mode.
     * Extracted from parent detailCellRendererParams.mappingID.
     *
     * @default undefined
     */
    mappingID?: string;

    /**
     * Child dataset for Mapping Data mode.
     * Used to filter rows by mappingID foreign key relationship.
     * Extracted from parent detailCellRendererParams.childDataSource.
     *
     * @default undefined
     */
    childDataSource?: CT[] | DataManager | DataResult;

    /**
     * Provides child data to detail grid for rendering.
     * Called from getDetailRowData callback on successful data retrieval.
     *
     * @param {CT[]} childData - Array of child row objects to display
     * @returns {void}
     * @example
     * ```typescript
     * getDetailRowData: (params) => {
     *   const childRows = params.data.OrderLines || [];
     *   params.successCallback(childRows);
     * }
     * ```
     */
    successCallback: (childData: CT[]) => void;

    /**
     * Indicates failed data retrieval to detail grid.
     * Called from getDetailRowData callback on error or exception.
     *
     * @param {string} error - Error message or description
     * @returns {void}
     * @example
     * ```typescript
     * getDetailRowData: async (params) => {
     *   try {
     *     const response = await fetch(`/api/orders/${params.data.id}`);
     *     const childData = await response.json();
     *     params.successCallback(childData);
     *   } catch (error) {
     *     params.failCallback(error.message);
     *   }
     * }
     * ```
     */
    failCallback: (error: string) => void;

    /**
     * Data retrieval callback function reference.
     * Set when passed through executeAsyncCallback for internal tracking.
     *
     * @internal
     */
    getDetailRowData?: (params: GetDetailRowDataParams<T, CT>) => void | Promise<void>;
}

/**
 * Detail grid configuration object.
 * Defines columns, paging, height, and recursive nesting configuration.
 */
export interface DetailGridOptions<CT = unknown> extends GridProps<CT> {
    /**
     * Array of column definitions for detail grid.
     * Specifies visible columns and their properties.
     */
    columns: ColumnProps<CT>[];

    /**
     * Grid row height in pixels.
     * Sets uniform row height for all detail grid rows.
     *
     * @default 36
     */
    rowHeight?: number;

    /**
     * Grid height in pixels or percentage.
     * Constrains detail grid height in expanded row.
     *
     * @default '100%'
     */
    height?: string | number;

    /**
     * Maximum nesting levels allowed in hierarchical grids.
     * Limits recursive detail grid expansion depth.
     * Level 1: Master grid, Level 2: First detail grid, Level 3: Second detail grid.
     *
     * @default 3
     * @example
     * ```typescript
     * maxNestingDepth={3}  // Allow Orders > Lines > SerialNumbers (3 levels)
     * ```
     */
    maxNestingDepth?: number;

    /**
     * Current nesting level in grid hierarchy.
     * Indicates depth of current detail grid in hierarchy tree.
     * Automatically incremented by recursive rendering.
     *
     * @private
     * @default 0
     * @example
     * ```typescript
     * currentNestingDepth={1}  // Master grid at level 1
     * // Child grid automatically gets currentNestingDepth={2}
     * ```
     */
    currentNestingDepth?: number;

    /**
     * Paging configuration for detail grid rows per page.
     * Enables pagination for large child datasets.
     *
     * @default undefined (no paging)
     */
    pageSettings?: {
        /**
         * Number of rows per page in detail grid.
         */
        pageSize?: number;
    };

    /**
     * Recursive detail grid configuration for third level.
     * Enables 3-level nesting by specifying detail config for child detail grids.
     *
     * @default undefined
     * @example
     * ```typescript
     * detailCellRendererParams: {
     *   detailGridOptions: {
     *     columnDefs: [...],
     *     currentNestingDepth={2}
     *     // Level 2 child can have Level 3 detail config
     *     detailCellRendererParams: {
     *       detailGridOptions: { columnDefs: [...], currentNestingDepth={3} },
     *       getDetailRowData: (params) => { ... }
     *     }
     *   }
     * }
     * ```
     */
    detailCellRendererParams?: DetailCellRendererParams<CT>;
}

/**
 * Master-Detail parameters for nested Grid rendering.
 * Configures detail grid appearance, data binding mode, and lifecycle events.
 * Supports three data binding modes:
 * - Mode 1: Nested Data (child property in parent row)
 * - Mode 2: Mapping Data (separate child dataset filtered by foreign key)
 * - Mode 3: Async (callback-based dynamic data loading)
 *
 * @template T - Parent row data type
 * @template CT - Child row data type
 */
export interface DetailCellRendererParams<T = unknown, CT = unknown> {
    /**
     * Detail grid configuration object.
     * Specifies columns, height, paging, and recursive nesting setup.
     *
     * @example
     * ```typescript
     * detailGridOptions: {
     *   columnDefs: [
     *     { field: 'LineID', headerText: 'Line ID' },
     *     { field: 'ProductName', headerText: 'Product' }
     *   ],
     *   height: 300
     * }
     * ```
     */
    detailGridOptions: DetailGridOptions<CT>;

    /**
     * Parent key field name for Mapping Data mode.
     * Specifies which parent row property contains the foreign key value.
     * Used to filter childDataSource by this key.
     * Only applicable when childDataSource is provided.
     *
     * @default undefined
     * @example
     * ```typescript
     * // Mode 2: Mapping Data
     * mappingID: 'OrderID'  // Parent has OrderID property
     * childDataSource: [...data with OrderID property...]
     * getDetailRowData: (params) => {
     *   const parentID = params.data[params.mappingID];  // Get OrderID from parent
     *   const childRows = params.childDataSource.filter(
     *     row => row[params.mappingID] === parentID  // Filter by OrderID
     *   );
     *   params.successCallback(childRows);
     * }
     * ```
     */
    mappingID?: string;

    /**
     * Child dataset for Mapping Data mode.
     * Complete array of potential child rows to filter by mappingID.
     * Only applicable when mappingID is specified.
     *
     * @default undefined
     * @example
     * ```typescript
     * childDataSource: [
     *   { LineID: 1, OrderID: 1, ProductName: 'Product A' },
     *   { LineID: 2, OrderID: 1, ProductName: 'Product B' },
     *   { LineID: 3, OrderID: 2, ProductName: 'Product C' }
     * ]
     * ```
     */
    childDataSource?: CT[] | DataManager | DataResult;

    /**
     * Callback function to retrieve or compute child row data.
     * Supports all three data binding modes: Nested Data, Mapping Data, and Async.
     * Called when detail row is expanded and must provide child data.
     * Implementation must call either successCallback or failCallback.
     *
     * @param {GetDetailRowDataParams<T>} params - Callback parameters including data, mappingID, childDataSource, successCallback, failCallback
     * @returns {void | Promise<void>}
     * @example
     * ```typescript
     * // Mode 1: Nested Data (child property in parent)
     * getDetailRowData: (params) => {
     *   params.successCallback(params.data.OrderLines || []);
     * }
     *
     * // Mode 2: Mapping Data (filter by foreign key)
     * getDetailRowData: (params) => {
     *   const parentID = params.data[params.mappingID];
     *   const childRows = params.childDataSource.filter(
     *     row => row[params.mappingID] === parentID
     *   );
     *   params.successCallback(childRows);
     * }
     *
     * // Mode 3: Async (API call)
     * getDetailRowData: async (params) => {
     *   try {
     *     const response = await fetch(`/api/orders/${params.data.id}`);
     *     const childData = await response.json();
     *     params.successCallback(childData);
     *   } catch (error) {
     *     params.failCallback(error.message);
     *   }
     * }
     * ```
     */
    getDetailRowData?: (params: GetDetailRowDataParams<T, CT>) => void | Promise<void>;

    /**
     * Fires when detail grid instance is created and rendered.
     * Called after detail grid DOM elements are mounted.
     * Use for initializing detail grid state or side effects.
     *
     * @event onDetailGridCreated
     * @param {DetailGridRef} gridRef - Reference to created grid instance
     * @returns {void}
     * @example
     * ```typescript
     * onDetailGridCreated: (gridRef) => {
     *   console.log('Detail grid created for row:', gridRef.parentData.id);
     *   // Initialize any detail-grid-specific state
     * }
     * ```
     */
    onDetailGridCreated?: (gridRef: DetailGridRef) => void;

    /**
     * Fires when detail grid instance is destroyed and removed.
     * Called when detail row is collapsed or parent row is removed.
     * Use for cleanup: timers, event listeners, resources.
     *
     * @event onDetailGridDestroyed
     * @param {DetailGridRef} gridRef - Reference to destroyed grid instance
     * @returns {void}
     * @example
     * ```typescript
     * onDetailGridDestroyed: (gridRef) => {
     *   console.log('Detail grid destroyed for row:', gridRef.parentData.id);
     *   // Cleanup: clear timers, unsubscribe events, release resources
     * }
     * ```
     */
    onDetailGridDestroyed?: (gridRef: DetailGridRef) => void;
}

/**
 * Grid reference object for detail grid lifecycle management.
 * Provides access to grid instance and parent context information.
 */
export interface DetailGridRef {
    /**
     * Unique identifier for this detail grid instance.
     * Auto-generated for tracking multiple concurrent detail grids.
     */
    id: string;

    /**
     * Parent row data object that contains this detail grid.
     * Reference to the expanded row's data context.
     */
    parentData?: unknown;

    /**
     * Current nesting depth in hierarchy.
     * Indicates level of this detail grid (1 = master, 2 = first detail, etc.).
     */
    nestingDepth?: number;

    /**
     * Grid DOM element reference.
     * Access to rendered grid container for DOM operations.
     */
    element?: HTMLElement;
}

/**
 * Configuration object accepted by the {@link DetailGridCache} constructor.
 *
 * @private
 */
export interface DetailGridCacheConfig {
    /**
     * Maximum number of child grid entries the cache can retain.
     * When the threshold is reached, the least-recently-used entry is evicted
     * and its resources are released via the supplied destroy hook.
     *
     * @default 50
     */
    maxInstances?: number;

    /**
     * Enables instance reuse when the same cache key is requested.
     * When `false`, the cache always creates a new descriptor and bypasses
     * the lookup path.
     *
     * @default true
     */
    enableInstanceReuse?: boolean;
}

/**
 * DetailCellRenderer component props interface.
 * Configures nested grid rendering and data binding.
 *
 * @private
 */
export interface DetailCellRendererProps<T = unknown> {
    /**
     * Parent row data object.
     * Contains properties referenced by getDetailRowData callback.
     */
    data: T;

    /**
     * Detail grid configuration parameters.
     * Specifies columns, data binding mode, and rendering options.
     */
    params: DetailCellRendererParams<T>;

    /**
     * Current nesting depth in grid hierarchy.
     * Used to prevent exceeding maxNestingDepth limit.
     * Level 1: Master grid, Level 2: First detail, etc.
     *
     * @default 1
     */
    nestingDepth?: number;

    /**
     * Maximum allowed nesting depth.
     * Prevents infinite nesting or excessive recursion.
     *
     * @default 3
     */
    maxNestingDepth?: number;

    /**
     * CSS class name for detail container.
     * Applied to outermost detail grid container div.
     *
     * @default 'detail-cell-renderer'
     */
    className?: string;

}

/**
 * Snapshot describing a cached child grid descriptor.
 * Returned by {@link DetailGridCache.getStats} and used internally to track
 * access order, lifecycle metadata, and persistent state.
 *
 * @private
 */
export interface DetailGridCacheEntry<TData = unknown> {
    /**
     * Unique identifier derived from the parent row, depth, and config reference.
     */
    key: string;

    /**
     * Parent row data associated with this entry.
     */
    parentData: TData;

    /**
     * Nesting depth of the child grid in the hierarchy.
     */
    nestingDepth: number;

    /**
     * Effective grid configuration for the cached child grid.
     * Captured at creation time so subsequent re-renders use the same options.
     */
    options: DetailGridOptions;

    /**
     * Last resolved child data set. Retained so reload can be avoided on re-expand.
     */
    data: unknown[];

    /**
     * Loading indicator for the cached child grid.
     */
    isLoading: boolean;

    /**
     * Last error message for the cached child grid.
     */
    error: string | null;

    /**
     * Timestamp of the most recent access (used for LRU ordering).
     */
    lastAccessed: number;

    /**
     * Timestamp at which the entry was first created.
     */
    createdAt: number;
}

