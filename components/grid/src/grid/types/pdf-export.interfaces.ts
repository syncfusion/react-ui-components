import { RefObject } from 'react';
import { GridRef } from './grid.interfaces';
import { ColumnProps } from './column.interfaces';

/**
 * Represents an image to be rendered in a PDF cell.
 * Supports base64-encoded images with optional custom dimensions.
 *
 * @private
 */
export interface PdfCellImage {
    /**
     * Base64-encoded image string.
     * Example: 'data:image/png;base64,iVBORw0KG...'
     *
     * @type {string}
     */
    base64: string;

    /**
     * Optional image height in pixels.
     * If not specified, the original image height is used.
     *
     * @type {number}
     * @default undefined
     */
    height?: number;

    /**
     * Optional image width in pixels.
     * If not specified, the original image width is used.
     *
     * @type {number}
     * @default undefined
     */
    width?: number;
}

/**
 * Represents a hyperlink to be rendered in a PDF cell.
 * Enables clickable links in the exported PDF document.
 *
 * @private
 */
export interface PdfCellHyperLink {
    /**
     * URL or target for the hyperlink.
     * Example: 'https://example.com' or 'mailto:user@example.com'
     *
     * @type {string}
     */
    target: string;

    /**
     * Optional display text for the hyperlink.
     * If not specified, the target URL is displayed as the link text.
     *
     * @type {string}
     * @default undefined
     */
    displayText?: string;
}

/**
 * Styling options for a PDF cell.
 * Allows customization of colors, fonts, alignment, and text decorations.
 *
 * @private
 */
export interface PdfCellStyle {
    /**
     * Background color of the cell as RGB values `[R, G, B]` (0-255).
     * Example: `[255, 0, 0]` for red background.
     *
     * @type {[number, number, number]}
     * @default undefined
     */
    backgroundColor?: [number, number, number];

    /**
     * Text color (brush/font color) as RGB values `[R, G, B]` (0-255).
     * Example: `[0, 0, 255]` for blue text.
     *
     * @type {[number, number, number]}
     * @default undefined
     */
    textBrushColor?: [number, number, number];

    /**
     * Horizontal text alignment within the cell.
     * Options: `Left`, `Center`, `Right`, `Justify`.
     *
     * @type {'Left' | 'Center' | 'Right' | 'Justify'}
     * @default 'Left'
     */
    textAlignment?: 'Left' | 'Center' | 'Right' | 'Justify';

    /**
     * Vertical alignment of content within the cell.
     * Options: `Top`, `Middle`, `Bottom`.
     *
     * @type {'Top' | 'Middle' | 'Bottom'}
     * @default 'Top'
     */
    verticalAlignment?: 'Top' | 'Middle' | 'Bottom';

    /**
     * Font family name for the cell text.
     * Common values: 'Helvetica', 'Times New Roman', 'Courier', etc.
     *
     * @type {string}
     * @default 'Helvetica'
     */
    fontFamily?: string;

    /**
     * Font size for the cell text in points.
     * Example: 12 for 12pt font.
     *
     * @type {number}
     * @default 10
     */
    fontSize?: number;

    /**
     * Flag indicating whether the text should be bold.
     *
     * @type {boolean}
     * @default false
     */
    bold?: boolean;

    /**
     * Flag indicating whether the text should be italic.
     *
     * @type {boolean}
     * @default false
     */
    italic?: boolean;

    /**
     * Flag indicating whether the text should be underlined.
     *
     * @type {boolean}
     * @default false
     */
    underline?: boolean;

    /**
     * Flag indicating whether the text should have strikethrough.
     *
     * @type {boolean}
     * @default false
     */
    strikethrough?: boolean;
}

/**
 * Represents event arguments passed to the onPdfQueryCellInfo callback.
 * Allows cell-level customization including images, hyperlinks, and styling.
 * Triggered for each cell during PDF generation, enabling data-driven customization.
 *
 * @private
 * @example
 * ```tsx
 * const handlePdfQueryCellInfo = (event: PdfQueryCellInfoEvent) => {
 *   // Add images to specific columns
 *   if (event.column?.field === 'photo') {
 *     event.image = {
 *       base64: getBase64Image(event.data.photoUrl),
 *       width: 50,
 *       height: 50
 *     };
 *   }
 *
 *   // Add hyperlinks
 *   if (event.column?.field === 'email') {
 *     event.hyperLink = {
 *       target: `mailto:${event.value}`,
 *       displayText: event.value
 *     };
 *   }
 *
 *   // Format values using valueAccessor
 *   if (event.column?.field === 'salary') {
 *     event.value = `$${Number(event.value).toLocaleString()}`;
 *   }
 *
 *   // Apply custom styling
 *   if (Number(event.value) < 0) {
 *     event.style = {
 *       textBrushColor: [255, 0, 0], // Red text for negative values
 *       bold: true
 *     };
 *   }
 * };
 *
 * const config: PdfExportSettings = {
 *   onPdfQueryCellInfo: handlePdfQueryCellInfo
 * };
 * ```
 */
export interface PdfQueryCellInfoEvent<T = unknown> {
    /**
     * Row data object for the current cell.
     * Provides access to all fields in the record for conditional logic.
     *
     * @type {T}
     */
    data: T;

    /**
     * Column definition for the current cell.
     * Contains `field`, data type, and other column configuration.
     *
     * @type {ColumnProps}
     */
    column: ColumnProps;

    /**
     * The current cell value to be rendered in the PDF.
     * Defaults to the formatted value from the grid.
     * Assign a new value to override.
     *
     * @type {string | number | boolean}
     */
    value: string | number | boolean;

    /**
     * Optional image to display in the PDF cell instead of text.
     * If set, the image is rendered and the value is ignored.
     * Useful for rendering photos, logos, or other visual data.
     *
     * @type {PdfCellImage}
     * @default undefined
     */
    image?: PdfCellImage;

    /**
     * Optional hyperlink configuration for the PDF cell.
     * If set, the cell value becomes a clickable link in the exported PDF.
     * Supports URLs and mailto links.
     *
     * @type {PdfCellHyperLink}
     * @default undefined
     */
    hyperLink?: PdfCellHyperLink;

    /**
     * Optional styling configuration for the PDF cell.
     * Allows customization of cell appearance including colors, fonts, and alignment.
     * Supports colors (RGB), font styles, and text alignment.
     *
     * @type {PdfCellStyle}
     * @default undefined
     */
    style?: PdfCellStyle;
}

/**
 * Represents the result of a PDF export operation in the Data Grid.
 * Indicates whether the export operation completed successfully and provides error details if applicable.
 *
 * @private
 * @example
 * ```tsx
 * const result: PdfExportResult = await pdfExport();
 * if (result.success) {
 *   console.log('PDF exported successfully');
 * } else {
 *   console.error('Export failed:', result.error);
 * }
 * ```
 */
export interface PdfExportResult {
    /**
     * Indicates whether the PDF export operation completed successfully.
     *
     * @type {boolean}
     */
    success: boolean;

    /**
     * Contains error information if the export operation failed.
     * Only populated when success is false.
     *
     * @type {Error}
     * @default undefined
     */
    error?: Error;
}

/**
 * Defines the range of rows to export from the grid.
 *
 * Available options:
 * * `All` - Exports all rows from the data source.
 * * `CurrentPage` - Exports only rows visible on the current page.
 * * `Custom` - Exports rows within a custom range specified by `PdfExportCustomRange`.
 *
 * @type {'All' | 'CurrentPage' | 'Custom'}
 */
export type PdfExportRange = 'All' | 'CurrentPage' | 'Custom';

/**
 * Specifies a custom row range for PDF export.
 * Used in conjunction with `PdfExportSettings.range` set to `Custom` to specify exact row boundaries.
 *
 * @private
 * @example
 * ```tsx
 * const customRange: PdfExportCustomRange = {
 *   startRow: 10,
 *   endRow: 25
 * };
 *
 * const config: PdfExportSettings = {
 *   range: 'Custom',
 *   customRange: customRange
 * };
 * ```
 */
export interface PdfExportCustomRange {
    /**
     * Zero-based index of the first row to include in the export range.
     *
     * @type {number}
     */
    startRow: number;

    /**
     * Zero-based index of the last row to include in the export range (inclusive).
     *
     * @type {number}
     */
    endRow: number;
}

/**
 * Represents event arguments triggered before the PDF export operation begins.
 * Provides access to grid data, columns, and export configuration, allowing customization or cancellation.
 * Enables data transformation, column filtering, or validation before PDF generation.
 *
 * @example
 * ```tsx
 * const handleBeforePdfExport = (event: PdfExportBeforeEvent) => {
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
 * const config: PdfExportSettings = {
 *   onBeforePdfExport: handleBeforePdfExport
 * };
 * ```
 */
export interface PdfExportBeforeEvent<T = unknown> {
    /**
     * Array of columns to be included in the PDF export.
     * Modify this array to include/exclude columns or reorder them before export.
     *
     * @type {ColumnProps[]}
     */
    columns: ColumnProps[];

    /**
     * Array of data records to be exported to PDF.
     * Modify this array to transform, filter, or sort data before export.
     *
     * @type {T[]}
     */
    dataSource: T[];

    /**
     * PDF export configuration settings applied to the current operation.
     * Contains information about the export range, file name, and styling options.
     *
     * @type {PdfExportSettings}
     */
    config: PdfExportSettings;

    /**
     * Flag to cancel the export operation.
     * Set to true to prevent the PDF generation and download.
     *
     * @type {boolean}
     * @default false
     */
    cancel: boolean;
}

/**
 * Represents event arguments triggered after the PDF export operation completes.
 * Provides information about the export outcome and applied settings for post-export processing.
 * Extends `PdfExportResult` to include success status and optional error information.
 *
 * @example
 * ```tsx
 * const handleAfterPdfExport = (event: PdfExportAfterEvent) => {
 *   if (event.success) {
 *     console.log(`PDF exported with file name: ${event.config.fileName}`);
 *   } else {
 *     console.error('Export failed:', event.error);
 *     // Show error notification to user
 *   }
 * };
 *
 * const config: PdfExportSettings = {
 *   onAfterPdfExport: handleAfterPdfExport
 * };
 * ```
 */
export interface PdfExportAfterEvent extends PdfExportResult {
    /**
     * PDF export configuration settings applied during the export operation.
     * Contains range, file name, dimensions, and other settings used.
     *
     * @type {PdfExportSettings}
     */
    config: PdfExportSettings;
}

/**
 * Configures the behavior and appearance of the PDF export operation.
 * Defines which data to export, file name, styling, and callbacks for customization.
 * Used as the configuration argument for the `pdfExport` method.
 *
 * @default {
 *   range: 'All',
 *   fileName: 'Grid.pdf',
 *   theme: 'Material'
 * }
 *
 * @example
 * ```tsx
 * const config: PdfExportSettings = {
 *   range: 'Custom',
 *   customRange: { startRow: 0, endRow: 50 },
 *   fileName: 'EmployeeReport.pdf',
 *   pageOrientation: 'Landscape',
 *   pageSize: 'A4',
 *   headerText: 'Employee Data Report',
 *   footerText: 'Page `{$current}` of `{$total}`',
 *   maxRowsWarningThreshold: 5000,
 *   onBeforePdfExport: (event) => {
 *     event.columns = event.columns.filter(col => col.visible !== false);
 *   },
 *   onAfterPdfExport: (event) => {
 *     console.log('Export completed:', event.success);
 *   }
 * };
 *
 * const { pdfExport } = useGridPdfExport(options);
 * await pdfExport(config);
 * ```
 */
export interface PdfExportSettings<T = unknown> {
    /**
     * Specifies which rows to include in the PDF export.
     * Determines the data range sent to PDF generation.
     *
     * Available options:
     * * `All` - Exports all rows from the data source.
     * * `CurrentPage` - Exports only rows visible on the current page.
     * * `Custom` - Exports rows within the range defined by `customRange` property.
     *
     * @type {PdfExportRange}
     * @default 'All'
     */
    range?: PdfExportRange;

    /**
     * Defines the custom row range when `range` is set to `Custom`.
     * Specifies zero-based, inclusive `startRow` and `endRow` indices.
     *
     * @type {PdfExportCustomRange}
     * @default undefined
     */
    customRange?: PdfExportCustomRange;

    /**
     * Maximum number of rows allowed before a warning is triggered.
     * Prevents export of extremely large datasets that could generate very large PDF files.
     * When the data length exceeds this threshold, the export operation throws an error.
     *
     * @type {number}
     * @default undefined (no limit)
     *
     * @example
     * ```tsx
     * const config: PdfExportSettings = {
     *   maxRowsWarningThreshold: 10000,
     *   range: 'All'
     * };
     * // Throws error if data.length > 10000
     * ```
     */
    maxRowsWarningThreshold?: number;

    /**
     * File name for the exported PDF document.
     * Determines the name used when the browser downloads the PDF file.
     *
     * @type {string}
     * @default 'Grid.pdf'
     */
    fileName?: string;

    /**
     * Text displayed in the PDF header on each page.
     * Useful for adding titles, report names, or other header information.
     *
     * @type {string}
     * @default undefined
     */
    headerText?: string;

    /**
     * Text displayed in the PDF footer on each page.
     * Supports placeholders for page numbers (e.g., Page 1 of 100).
     *
     * @type {string}
     * @default undefined
     */
    footerText?: string;

    /**
     * Page orientation for the PDF document.
     * Determines whether the pages are in portrait or landscape layout.
     *
     * @type {'Portrait' | 'Landscape'}
     * @default 'Portrait'
     */
    pageOrientation?: 'Portrait' | 'Landscape';

    /**
     * Page size for the PDF document (e.g., `A4`, `Letter`, `Legal`).
     * Determines the physical dimensions of each PDF page.
     *
     * @type {string}
     * @default 'A4'
     */
    pageSize?: string;

    /**
     * Theme to apply to the PDF styling.
     * Defines colors, fonts, and overall appearance of the exported PDF.
     *
     * @type {string}
     * @default 'Material'
     */
    theme?: string;

    /**
     * Callback function triggered before the PDF export operation begins.
     * Provides access to columns, data, and configuration for customization or cancellation.
     * Allows modification of `columns`, `data`, or `config` prior to export.
     *
     * @type {(event: PdfExportBeforeEvent<T>) => void}
     * @default undefined
     */
    onBeforePdfExport?: (event: PdfExportBeforeEvent<T>) => void;

    /**
     * Callback function triggered after the PDF export operation completes or fails.
     * Provides information about the outcome and applied settings for post-export actions.
     *
     * @type {(event: PdfExportAfterEvent) => void}
     * @default undefined
     */
    onAfterPdfExport?: (event: PdfExportAfterEvent) => void;

    /**
     * Callback function triggered for each cell during PDF generation.
     * Enables cell-level customization. Typical uses:
     * - Add images to specific columns (e.g., product photos, employee pictures)
     * - Add hyperlinks to cells (e.g., email addresses, URLs)
     * - Format cell values using valueAccessor logic (e.g., currency, dates)
     * - Apply conditional styling (e.g., red for negative values, bold for high priority)
     * - Override cell display values based on data context
     *
     * @type {(event: PdfQueryCellInfoEvent<T>) => void}
     * @default undefined
     * @private
     * @example
     * ```tsx
     * const handlePdfQueryCellInfo = (event: PdfQueryCellInfoEvent<Employee>) => {
     *   // Format salary values as currency
     *   if (event.column?.field === 'salary') {
     *     event.value = `$${Number(event.value).toLocaleString()}`;
     *   }
     *
     *   // Add employee photo
     *   if (event.column?.field === 'photo') {
     *     event.image = {
     *       base64: convertToBase64(event.data.photoUrl),
     *       width: 40,
     *       height: 40
     *     };
     *   }
     *
     *   // Add email as clickable link
     *   if (event.column?.field === 'email') {
     *     event.hyperLink = {
     *       target: `mailto:${event.value}`,
     *       displayText: event.value
     *     };
     *   }
     *
     *   // Highlight high-performing employees
     *   if (Number(event.data.performanceScore) > 90) {
     *     event.style = {
     *       bold: true,
     *       textBrushColor: [0, 128, 0], // Green
     *       backgroundColor: [240, 255, 240]
     *     };
     *   }
     * };
     *
     * const config: PdfExportSettings = {
     *   onPdfQueryCellInfo: handlePdfQueryCellInfo
     * };
     * ```
     */
    onPdfQueryCellInfo?: (event: PdfQueryCellInfoEvent<T>) => void;

    /**
     * Defines columns to be customized for PDF export.
     * Overrides grid column properties for PDF generation including width, textAlign, headerText.
     * Columns are matched by field name and merged with grid column definitions.
     * Properties specified here take precedence over grid column properties.
     *
     * @type {Partial<ColumnProps>[]}
     * @default undefined
     *
     * @example
     * ```tsx
     * const config: PdfExportSettings = {
     *   columns: [
     *     { field: 'OrderID', width: 80, textAlign: 'Right' },
     *     { field: 'CustomerID', headerText: 'Customer Name', width: 150 },
     *     { field: 'Freight', textAlign: 'Center', width: 100 },
     *     { field: 'ShipCountry', width: 120 }
     *   ]
     * };
     *
     * const { pdfExport } = useGridPdfExport(options);
     * await pdfExport(config);
     * ```
     *
     * @example
     * ```tsx
     * // Modify columns in onBeforePdfExport
     * const handleBeforePdfExport = (event: PdfExportBeforeEvent) => {
     *   event.columns = event.columns.map(col => {
     *     if (col.field === 'Salary') {
     *       return { ...col, width: 150, textAlign: 'Right' };
     *     }
     *     return col;
     *   });
     * };
     *
     * const config: PdfExportSettings = {
     *   onBeforePdfExport: handleBeforePdfExport
     * };
     * ```
     */
    columns?: Partial<ColumnProps>[];
}

/**
 * Return value of the `useGridPdfExport` hook.
 * Provides the `pdfExport` executor and the current export state.
 * Designed for managing PDF export operations and UI state during export.
 * @example
 * ```tsx
 * const { pdfExport, isExporting } = useGridPdfExport(options);
 *
 * const handlePdfExport = async () => {
 *   const result = await pdfExport({
 *     range: 'All',
 *     fileName: 'MyReport.pdf'
 *   });
 * };
 *
 * return (
 *   <>
 *     <button onClick={handlePdfExport} disabled={isExporting}>
 *       {isExporting ? 'Exporting...' : 'Export to PDF'}
 *     </button>
 *   </>
 * );
 * ```
 */
export interface UseGridPdfExportReturn {
    /**
     * Executes the PDF export operation with optional configuration.
     * Handles data extraction, PDF generation, and error handling.
     *
     * @type {(config?: PdfExportSettings) => Promise<PdfExportResult>}
     */
    pdfExport: (config?: PdfExportSettings) => Promise<PdfExportResult>;

    /**
     * Flag indicating whether a PDF export operation is currently in progress.
     * Useful for disabling interactive elements or showing loading indicators during export.
     *
     * @type {boolean}
     * @default false
     */
    isExporting: boolean;
}

/**
 * Configuration options required by the `useGridPdfExport` hook.
 * Provides references to grid instance and data retrieval functions for PDF export operations.
 * Used to establish the data pipeline from grid to PDF generation.
 *
 * @example
 * ```tsx
 * const gridRef = useRef<GridRef>(null);
 *
 * const pdfExportOptions: UseGridPdfExportOptions = {
 *   gridRef: gridRef,
 *   getColumns: () => gridRef.current?.columns || [],
 *   getAllData: async (state) => {
 *     // Fetch all data from API or data manager
 *     const result = await dataManager.executeQuery(state);
 *     return result;
 *   }
 * };
 *
 * const { pdfExport, isExporting } = useGridPdfExport(pdfExportOptions);
 * ```
 */
export interface UseGridPdfExportOptions<T = unknown> {
    /**
     * Reference to the grid component instance.
     * Used to access grid state, methods, and column definitions.
     *
     * @type {RefObject<GridRef<T>>}
     */
    gridRef: RefObject<GridRef<T>>;

    /**
     * Function that returns the complete column definitions from the grid.     *
     * Returns column metadata including hidden columns and field mappings.
     *
     * @type {() => ColumnProps[]}
     * @default undefined
     */
    getColumns?: () => ColumnProps[];

    /**
     * Asynchronous function that retrieves all data required for exporting `All` rows.     *
     * Receives the current grid state or query parameters for server-side operations.
     * Returns a promise that resolves to an array of data items of type `T`.
     *
     * @type {(state: object) => Promise<T[]>}
     * @default undefined
     */
    getAllData?: (state: object) => Promise<T[]>;
}
