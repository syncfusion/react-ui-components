import { DataManager, DataResult } from '@syncfusion/react-data';
import { GetDetailRowDataParams } from '../types/detail-cell-renderer.interfaces';

/**
 * Detail data binding service for extracting and formatting child row data.
 * Handles all three data binding modes and provides unified interface.
 *
 * @constructor DetailDataBindingService
 */
export class DetailDataBindingService {
    /**
     * Timeout duration in milliseconds for async operations.
     * Prevents hanging promises on failed API calls.
     *
     * @private
     * @type {number}
     */
    private static readonly ASYNC_TIMEOUT_MS: number = 30000;

    /**
     * Pending async operations tracked by request key.
     * Used to cancel operations when detail grids are destroyed.
     *
     * @private
     * @type {Map<string, AbortController>}
     */
    private static pendingRequests: Map<string, AbortController> = new Map<string, AbortController>();

    /**
     * Extract child data from nested property in parent row.
     * Implements Mode 1: Nested Data binding.
     * Child data exists as property on parent row object.
     *
     * @static
     * @param {unknown} parentData - Parent row object
     * @param {string} childPropertyPath - Property name or dot-notation path to child data
     * @returns {CT[]} Array of child rows or empty array if not found
     * @example
     * ```typescript
     * // Parent: { OrderID: 1, OrderLines: [...] }
     * const lines = DetailDataBindingService.extractNestedData(
     *   parentRow,
     *   'OrderLines'
     * );
     * ```
     */
    static extractNestedData<CT>(parentData: unknown, childPropertyPath: string): CT[] {
        if (!parentData || !childPropertyPath) {
            return [];
        }

        try {
            // Handle dot-notation paths (e.g., 'nested.property.path')
            const properties: string[] = childPropertyPath.split('.');
            let value: unknown = parentData;

            for (const prop of properties) {
                if (value && typeof value === 'object') {
                    //eslint-disable-next-line security/detect-object-injection
                    value = (value as Record<string, unknown>)[prop];
                } else {
                    return [];
                }
            }

            // Ensure result is an array
            return Array.isArray(value) ? (value as CT[]) : [];
        } catch (error) {
            console.error(`Error extracting nested data from path "${childPropertyPath}":`, error);
            return [];
        }
    }

    /**
     * Extract child data using foreign key mapping.
     * Implements Mode 2: Mapping Data binding with mappingID.
     * Filters childDataSource by matching mappingID values.
     *
     * @static
     * @param {unknown} parentData - Parent row object containing mappingID value
     * @param {string} mappingID - Property name used as foreign key
     * @param {unknown[]} childDataSource - Complete child dataset to filter
     * @returns {CT[]} Filtered child rows matching parent's mappingID or empty array
     * @example
     * ```typescript
     * // Parent: { OrderID: 1 }
     * // Children: [{ OrderID: 1, LineID: 1 }, { OrderID: 1, LineID: 2 }]
     * const lines = DetailDataBindingService.extractMappedData(
     *   parentRow,
     *   'OrderID',  // mappingID field
     *   allLines    // childDataSource
     * );
     * // Result: [{ OrderID: 1, LineID: 1 }, { OrderID: 1, LineID: 2 }]
     * ```
     */
    static extractMappedData<T, CT>(parentData: T, mappingID: string, childDataSource: CT[]): CT[] {
        if (!parentData || !mappingID || !childDataSource) {
            return [];
        }

        try {
            // Get the parent's key value
            //eslint-disable-next-line security/detect-object-injection
            const parentKeyValue: unknown = parentData[mappingID];

            if (parentKeyValue === undefined || parentKeyValue === null) {
                return [];
            }

            // Filter child data where child[mappingID] === parent[mappingID]
            return childDataSource.filter(
                //eslint-disable-next-line security/detect-object-injection
                (childRow: CT) => (childRow as Record<string, unknown>)[mappingID] === parentKeyValue
            );
        } catch (error) {
            console.error(`Error filtering mapped data by mappingID "${mappingID}":`, error);
            return [];
        }
    }

    /**
     * Execute data retrieval callback for async data loading.
     * Wraps callback execution with timeout and error handling.
     * Automatically cancels request if detail grid is destroyed.
     *
     * @static
     * @param {GetDetailRowDataParams<T>} params - Callback parameters with data, childDataSource, mappingID, and callbacks
     * @param {string} requestKey - Unique key for tracking this async request
     * @returns {Promise<void>} Resolves when callback completes or times out
     * @throws {Error} If callback throws exception or times out
     */
    static async executeAsyncCallback<T, CT>(params: GetDetailRowDataParams<T, CT>, requestKey: string): Promise<void> {
        if (!params.getDetailRowData) {
            params.failCallback('No getDetailRowData callback provided');
            return;
        }

        // Create abort controller for this request
        const abortController: AbortController = new AbortController();
        this.pendingRequests.set(requestKey, abortController);

        try {
            // Set timeout for async operations
            const timeoutPromise: Promise<void> = new Promise<void>((_: () => void, reject: (error: Error) => void) => {
                setTimeout(() => {
                    reject(new Error(`Data loading timed out after ${this.ASYNC_TIMEOUT_MS}ms`));
                }, this.ASYNC_TIMEOUT_MS);
            });

            // Create callback wrapper that checks for cancellation
            const wrappedParams: GetDetailRowDataParams<T, CT> = {
                ...params,
                successCallback: (childData: CT[]) => {
                    // Check if request was cancelled before calling callback
                    if (!abortController.signal.aborted) {
                        params.successCallback(childData);
                    }
                },
                failCallback: (error: string) => {
                    // Check if request was cancelled before calling callback
                    if (!abortController.signal.aborted) {
                        params.failCallback(error);
                    }
                }
            };

            // Race: callback vs timeout (whichever completes first)
            const callbackPromise: Promise<void> = Promise.resolve(params.getDetailRowData(wrappedParams));

            await Promise.race([callbackPromise, timeoutPromise]);
        } catch (error) {
            const errorMessage: string = error instanceof Error ? error.message : String(error);
            if (!abortController.signal.aborted) {
                params.failCallback(errorMessage);
            }
        } finally {
            // Clean up: remove from pending requests
            this.pendingRequests.delete(requestKey);
        }
    }

    /**
     * Cancel pending async data loading request.
     * Called when detail grid is collapsed or destroyed.
     * Prevents callbacks from executing after grid removal.
     *
     * @static
     * @param {string} requestKey - Request key to cancel
     * @returns {boolean} True if request was found and cancelled, false otherwise
     */
    static cancelPendingRequest(requestKey: string): boolean {
        const abortController: AbortController = this.pendingRequests.get(requestKey);
        if (abortController) {
            abortController.abort();
            this.pendingRequests.delete(requestKey);
            return true;
        }
        return false;
    }

    /**
     * Cancel all pending async requests.
     * Called during component cleanup or application shutdown.
     * Ensures no orphaned promises or API calls continue.
     *
     * @static
     * @returns {void}
     */
    static cancelAllPendingRequests(): void {
        for (const abortController of this.pendingRequests.values()) {
            abortController.abort();
        }
        this.pendingRequests.clear();
    }

    /**
     * Get unique request key for tracking async operations.
     * Combines parent data identifier with operation type.
     * Ensures unique key per detail grid expansion.
     *
     * @static
     * @param {unknown} parentData - Parent row object
     * @param {string | number} parentKeyField - Field name or index for parent identification
     * @param {number} [nestingDepth] - Nesting level for hierarchical uniqueness
     * @returns {string} Unique request key for tracking
     */
    static generateRequestKey(
        parentData: unknown,
        parentKeyField: string | number,
        nestingDepth: number = 0
    ): string {
        try {
            //eslint-disable-next-line security/detect-object-injection
            const keyValue: string = parentData?.[parentKeyField] || 'unknown';
            return `detail-${keyValue}-${nestingDepth}`;
        } catch {
            return `detail-${Date.now()}-${Math.random()}`;
        }
    }

    /**
     * Get statistics on pending async requests.
     * Useful for debugging and monitoring detail grid performance.
     *
     * @static
     * @returns {object} Object with count of pending requests
     */
    static getStats(): { pendingRequests: number } {
        return {
            pendingRequests: this.pendingRequests.size
        };
    }

    /**
     * Reset service state by clearing all pending requests.
     * Used for testing or complete cleanup.
     *
     * @static
     * @returns {void}
     */
    static reset(): void {
        this.cancelAllPendingRequests();
    }

    /**
     * Extract child data using flexible data binding.
     * Automatically detects and handles all three binding modes.
     * Priority: Mode 1 (Nested) > Mode 2 (Mapping) > Mode 3 (Async)
     *
     * @static
     * @param {GetDetailRowDataParams<T>} params - Callback parameters
     * @param {string} [childPropertyPath] - Path to nested child data (Mode 1)
     * @param {string} [mappingID] - Foreign key field (Mode 2)
     * @param {unknown[]} [childDataSource] - Child dataset (Mode 2)
     * @returns {unknown[] | null} Child data array or null if async (Mode 3)
     */
    static extractData<T, CT>(
        params: GetDetailRowDataParams<T, CT>,
        childPropertyPath?: string,
        mappingID?: string,
        childDataSource?:  CT[] | DataManager | DataResult
    ): CT[] | null {
        // Mode 1: Extract nested data from parent
        if (childPropertyPath) {
            return this.extractNestedData(params.data, childPropertyPath);
        }

        // Mode 2: Extract mapped data by foreign key
        if (mappingID && childDataSource && Array.isArray(childDataSource)) {
            return this.extractMappedData(params.data, mappingID, childDataSource);
        }

        // Mode 3: Async data binding (callback will be called)
        return null;
    }
}

/**
 * Export default instance for convenience.
 * Can be used as:
 * ```typescript
 * import detailDataBinding from './detail-data-binding';
 * detailDataBinding.extractNestedData(...);
 * ```
 */
export default DetailDataBindingService;
