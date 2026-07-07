import { RefObject } from 'react';
import { GridRef } from './grid.interfaces';
import { ColumnProps } from './column.interfaces';
import { PrintRange } from './enum';
import { DataRequestEvent } from './interfaces';

/**
 * Represents the result of a print operation in the Data Grid.
 * Indicates whether the print operation completed successfully and provides error details if applicable.
 *
 * @example
 * ```tsx
 * const result: PrintResult = await print();
 * if (result.success) {
 *   console.log('Print completed successfully');
 * } else {
 *   console.error('Print failed:', result.error);
 * }
 * ```
 */
export interface PrintResult {
    /**
     * Indicates whether the print operation completed successfully.
     *
     * @type {boolean}
     */
    success: boolean;

    /**
     * Contains error information if the print operation failed.
     * Only populated when success is false.
     *
     * @type {Error}
     * @default undefined
     */
    error?: Error;
}

/**
 * Represents event arguments triggered before the print operation begins.
 * Provides access to grid data, columns, and print configuration, allowing customization or cancellation.
 * Enables data transformation, column filtering, or validation before sending to the print window.
 *
 * @example
 * ```tsx
 * const handleBeforePrint = (event: PrintBeforeEvent) => {
 *   // Filter columns
 *   event.columns = event.columns.filter(col => col.field !== 'internalId');
 *
 *   // Transform data
 *   event.dataSource = event.dataSource.map(row => ({
 *     ...row,
 *     name: row.name.toUpperCase()
 *   }));
 *
 *   // Cancel if needed
 *   if (event.dataSource.length === 0) {
 *     event.cancel = true;
 *   }
 * };
 *
 * const config: PrintSettings = {
 *   onBeforePrint: handleBeforePrint
 * };
 * ```
 */
export interface PrintBeforeEvent<T = unknown> {
    /**
     * Array of columns to be included in the print output.
     * Modify this array to include/exclude columns or reorder them before printing.
     *
     * @type {ColumnProps[]}
     */
    columns: ColumnProps[];

    /**
     * Array of data records to be printed.
     * Modify this array to transform, filter, or sort data before printing.
     *
     * @type {T[]}
     */
    dataSource: T[];

    /**
     * Print configuration settings applied to the current operation.
     * Contains information about the print range, window dimensions, and title.
     *
     * @type {PrintSettings}
     */
    config: PrintSettings;

    /**
     * Flag to cancel the print operation.
     * Set to true to prevent the print dialog from opening.
     *
     * @type {boolean}
     * @default false
     */
    cancel: boolean;
}

/**
 * Represents event arguments triggered after the print operation completes.
 * Provides information about the print outcome and applied settings for post-print processing.
 * Extends PrintResult to include success status and optional error information.
 *
 * @example
 * ```tsx
 * const handleAfterPrint = (event: PrintAfterEvent) => {
 *   if (event.success) {
 *     console.log(`Print completed with title: ${event.config.title}`);
 *   } else {
 *     console.error('Print failed:', event.error);
 *     // Show error notification to user
 *   }
 * };
 *
 * const config: PrintSettings = {
 *   onAfterPrint: handleAfterPrint
 * };
 * ```
 */
export interface PrintAfterEvent extends PrintResult {
    /**
     * Print configuration settings that were applied during the print operation.
     * Contains range, title, dimensions, and other settings used.
     *
     * @type {PrintSettings}
     */
    config: PrintSettings;
}

/**
 * Defines a custom range of rows to print from the grid.
 * Used in conjunction with PrintSettings.range set to 'Custom' to specify exact row boundaries.
 *
 * @example
 * ```tsx
 * const customRange: PrintCustomRange = {
 *   startRow: 10,
 *   endRow: 25
 * };
 *
 * const config: PrintSettings = {
 *   range: 'Custom',
 *   customRange: customRange
 * };
 * ```
 */
export interface PrintCustomRange {
    /**
     * Zero-based index of the first row to include in the print range.
     *
     * @type {number}
     */
    startRow: number;

    /**
     * Zero-based index of the last row to include in the print range (inclusive).
     *
     * @type {number}
     */
    endRow: number;
}

/**
 * Configures the behavior and appearance of the print operation.
 * Defines which data to print, window dimensions, callbacks, and thresholds for validation.
 * Used with print() method to customize print output.
 *
 * @default {
 *   range: 'All',
 *   title: 'Print',
 *   windowWidth: 1200,
 *   windowHeight: 800
 * }
 *
 * @example
 * ```tsx
 * const config: PrintSettings = {
 *   range: 'Custom',
 *   customRange: { startRow: 0, endRow: 50 },
 *   title: 'Employee Report',
 *   windowWidth: 1400,
 *   windowHeight: 900,
 *   maxRowsWarningThreshold: 1000,
 *   onBeforePrint: (event) => {
 *     event.columns = event.columns.filter(col => col.visible !== false);
 *   },
 *   onAfterPrint: (event) => {
 *     console.log('Print completed:', event.success);
 *   }
 * };
 *
 * const { print } = useGridPrint(options);
 * await print(config);
 * ```
 */
export interface PrintSettings<T = unknown> {
    /**
     * Specifies which rows to include in the print output.
     * Determines the data range sent to the print window.
     *
     * Available options:
     * - `'All'` - Prints all rows from the data source (default)
     * - `'CurrentPage'` - Prints only rows visible on the current page
     * - `'Custom'` - Prints rows within the range defined by customRange property
     *
     * @type {PrintRange}
     * @default 'All'
     */
    range?: PrintRange;

    /**
     * Defines the custom row range when range is set to 'Custom'.
     * Specifies the startRow and endRow indices (zero-based, inclusive).
     *
     * @type {PrintCustomRange}
     * @default undefined
     */
    customRange?: PrintCustomRange;

    /**
     * Maximum number of rows allowed before a warning is triggered.
     * Prevents accidental printing of extremely large datasets that could freeze the browser.
     * When data exceeds this threshold, print operation throws an error.
     *
     * @type {number}
     * @default undefined (no limit)
     *
     * @example
     * ```tsx
     * const config: PrintSettings = {
     *   maxRowsWarningThreshold: 5000,
     *   range: 'All'
     * };
     * // Prints error if data.length > 5000
     * ```
     */
    maxRowsWarningThreshold?: number;

    /**
     * Title text displayed in the print window's document title and header.
     * Used for document identification and appears in print preview.
     *
     * @type {string}
     * @default 'Print'
     */
    title?: string;

    /**
     * Width of the print window in pixels.
     * Determines the horizontal size of the window that opens for printing.
     * Affects the visible area and affects layout rendering.
     *
     * @type {number}
     * @default 1200
     */
    windowWidth?: number;

    /**
     * Height of the print window in pixels.
     * Determines the vertical size of the window that opens for printing.
     *
     * @type {number}
     * @default 800
     */
    windowHeight?: number;

    /**
     * Callback function triggered before the print operation begins.
     * Provides access to columns, data, and configuration for customization or cancellation.
     *
     * @type {(event: PrintBeforeEvent<T>) => void}
     * @default undefined
     */
    onBeforePrint?: (event: PrintBeforeEvent<T>) => void;

    /**
     * Callback function triggered after the print operation completes or fails.
     * Provides information about the outcome and applied settings for post-print actions.
     *
     * @type {(event: PrintAfterEvent) => void}
     * @default undefined
     */
    onAfterPrint?: (event: PrintAfterEvent) => void;
}

/**
 * Return value of the useGridPrint hook.
 * Provides the print function and current printing state for managing print operations.
 *
 * @example
 * ```tsx
 * const { print, isPrinting } = useGridPrint(options);
 *
 * const handlePrint = async () => {
 *   const result = await print({
 *     range: 'All',
 *     title: 'My Report'
 *   });
 * };
 *
 * return (
 *   <>
 *     <button onClick={handlePrint} disabled={isPrinting}>
 *       {isPrinting ? 'Printing...' : 'Print Grid'}
 *     </button>
 *   </>
 * );
 * ```
 */
export interface UseGridPrintReturn {
    /**
     * Executes the print operation with optional configuration.
     * Handles data extraction, window management, and error handling.
     *
     * @type {(config?: PrintSettings) => Promise<PrintResult>}
     */
    print: (config?: PrintSettings) => Promise<PrintResult>;

    /**
     * Flag indicating whether a print operation is currently in progress.
     * Useful for disabling buttons or showing loading indicators during printing.
     *
     * @type {boolean}
     * @default false
     */
    isPrinting: boolean;
}

/**
 * Configuration options required by the useGridPrint hook.
 * Provides references to grid instance and data retrieval functions for print operations.
 * Used to establish the data pipeline from grid to print window.
 *
 * @example
 * ```tsx
 * const gridRef = useRef<GridRef>(null);
 *
 * const printOptions: UseGridPrintOptions = {
 *   gridRef: gridRef,
 *   getColumns: () => gridRef.current?.columns || [],
 *   getAllData: async (state) => {
 *     // Fetch all data from API or data manager
 *     const result = await dataManager.executeQuery(state);
 *     return result;
 *   }
 * };
 *
 * const { print, isPrinting } = useGridPrint(printOptions);
 * ```
 */
export interface UseGridPrintOptions<T = unknown> {
    /**
     * Async function to retrieve all data from the data source.
     * Called to fetch complete dataset when printing beyond current page.
     * Receives data request event containing query and filter information.
     *
     * @type {(state: DataRequestEvent) => Promise<T[]>}
     * @default undefined
     */
    getAllData?: (state: DataRequestEvent) => Promise<T[]>;

    /**
     * Function returning the array of column configurations to print.
     * Called to determine which columns appear in the print output.
     *
     * @type {() => ColumnProps[]}
     * @default undefined
     */
    getColumns?: () => ColumnProps[];

    /**
     * Reference to the grid component instance.
     * Provides access to grid methods, state, and data for print operations.
     * Must be passed from the grid's useRef hook.
     *
     * @type {RefObject<GridRef<T>>}
     */
    gridRef: RefObject<GridRef<T>>;
}
