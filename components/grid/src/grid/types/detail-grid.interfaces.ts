import { GridRef } from './grid.interfaces';
import { DetailCellRenderer } from '../components';

/**
 * Internal master-detail module contract.
 *
 * @private
 */
export interface detailGridModule {
    DetailCellRenderer: typeof DetailCellRenderer;
}

/**
 * Defines the master-detail module injection contract.
 *
 * @private
 */
export type DetailGridModuleType = () => detailGridModule;


/**
 * Parameters passed to the `getDetailRowData` callback.
 * Provides access to parent row data, metadata, and success/failure handlers.
 *
 * @template T - The parent row data type
 *
 * @example
 * ```tsx
 * (params: DetailDataRequestParams<Order>) => {
 *   const { data, rowIndex, nestingDepth, successCallback, failureCallback } = params;
 *   if (data.orderLines) {
 *     successCallback(data.orderLines);
 *   } else {
 *     failureCallback?.(new Error('No order lines found'));
 *   }
 * }
 * ```
 */
export interface DetailDataRequestParams<T = unknown, CT = unknown> {
    /**
     * The parent row data object.
     * Extract child data from this object using properties or computed values.
     */
    data: T;

    /**
     * Zero-based index of the parent row in the master grid.
     * Useful for identifying which row is being expanded.
     *
     * @example
     * ```tsx
     * console.log(`Expanding row at index: ${params.rowIndex}`);
     * ```
     */
    rowIndex: number;

    /**
     * Current nesting depth (0-based).
     * - `0` = First-level detail grid (child of master)
     * - `1` = Second-level detail grid (child of first detail)
     * - `n` = nth-level detail grid
     *
     * Use this to enforce depth limits or adjust behavior per nesting level.
     *
     * @example
     * ```tsx
     * if (params.nestingDepth >= 2) {
     *   // Don't fetch deeply nested data
     *   params.failureCallback?.(new Error('Max depth reached'));
     *   return;
     * }
     * ```
     */
    nestingDepth: number;

    /**
     * Callback to signal successful data binding.
     * Invoke with an array of child row objects.
     * Detail grid will render these rows in a nested grid.
     *
     * @param data - Array of child row objects
     *
     * @example
     * ```tsx
     * params.successCallback(params.data.orderLines);
     * // or async
     * fetch('/api/details').then(r => r.json()).then(data =>
     *   params.successCallback(data)
     * );
     * ```
     */
    successCallback: (data: CT[]) => void;

    /**
     * Optional callback to signal failed data binding.
     * Invoke on error with an Error object.
     * Detail grid will display error state to user.
     *
     * @optional
     * @param error - Error object with details
     *
     * @example
     * ```tsx
     * params.failureCallback?.(
     *   new Error('Failed to fetch order lines: 500 Server Error')
     * );
     * ```
     */
    failureCallback?: (error: Error) => void;
}

/**
 * Context passed to the `onDetailGridCreate` lifecycle hook.
 * Provides access to the created detail grid instance and related metadata.
 * Use this to customize behavior or initialize the detail grid.
 *
 * @example
 * ```tsx
 * (context: DetailGridCreateContext) => {
 *   // Access grid instance
 *   context.gridInstance.selectRows([0]);
 *
 *   // Measure DOM element
 *   const { height, width } = context.detailGridElement.getBoundingClientRect();
 *
 *   // Log metadata
 *   console.log(`Created at depth ${context.nestingDepth}`);
 * }
 * ```
 */
export interface DetailGridCreateContext<T = unknown> {
    /**
     * Parent row data object that triggered the detail grid creation.
     * Use to associate the detail grid with specific parent data.
     */
    parentData: T;

    /**
     * Parent row index in the master grid (zero-based).
     */
    rowIndex: number;

    /**
     * Nesting depth of this detail grid.
     * - `0` = First-level detail (child of master)
     * - `1` = Second-level detail
     * - `n` = nth-level detail
     */
    nestingDepth: number;

    /**
     * DOM container element where the detail grid is rendered.
     * Use for DOM measurements, focus management, or visibility detection.
     *
     * @example
     * ```tsx
     * // Measure the detail grid container
     * const rect = context.detailGridElement.getBoundingClientRect();
     * console.log(`Container height: ${rect.height}px`);
     * ```
     */
    detailGridElement: HTMLDivElement;

    /**
     * GridComponent instance reference.
     * Fully initialized and ready for API calls and event subscriptions.
     * Use to select rows, trigger actions, or subscribe to grid events.
     *
     * @example
     * ```tsx
     * // Select first row
     * context.gridInstance.selectRows([0]);
     *
     * // Subscribe to row selection
     * context.gridInstance.onRowSelect?.((args) => {
     *   console.log('Selected row:', args.data);
     * });
     * ```
     */
    gridInstance: GridRef<T>;
}

/**
 * Context passed to the `onDetailGridDestroy` lifecycle hook.
 * Provides access to the detail grid instance before it is destroyed.
 * Use this for cleanup, state persistence, or logging.
 *
 * @example
 * ```tsx
 * (context: DetailGridDestroyContext) => {
 *   // Persist grid state
 *   const state = {
 *     selectedRows: context.gridInstance.selectedRowsArray,
 *     scrollPosition: context.gridInstance.getScrollSettings(),
 *   };
 *   saveState(context.parentData.id, state);
 *
 *   // Log metadata
 *   console.log(`Destroying detail at depth ${context.nestingDepth}`);
 * }
 * ```
 */
export interface DetailGridDestroyContext<T = unknown> {
    /**
     * Parent row data object associated with the detail grid being destroyed.
     */
    parentData: T;

    /**
     * Parent row index in the master grid (zero-based).
     */
    rowIndex: number;

    /**
     * Nesting depth of the destroyed detail grid.
     * - `0` = First-level detail
     * - `1` = Second-level detail
     * - `n` = nth-level detail
     */
    nestingDepth: number;

    /**
     * GridComponent instance being destroyed.
     * Still functional during this callback. Use to access last state before cleanup.
     * After this callback completes, instance will be removed from DOM.
     *
     * @example
     * ```tsx
     * // Save the current state before destroy
     * const finalState = {
     *   selectedRows: context.gridInstance.selectedRowsArray,
     *   pageIndex: context.gridInstance.pageSettings?.currentPage,
     * };
     * ```
     */
    gridInstance: GridRef<unknown>;
}


