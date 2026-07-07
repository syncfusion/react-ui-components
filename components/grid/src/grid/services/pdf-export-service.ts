import { pdfWindowManager } from './pdf-window-manager';
import { PdfExportSettings, PdfExportResult, UseGridPdfExportOptions, PdfExportRange } from '../types/pdf-export.interfaces';
import { ColumnProps } from '../types/column.interfaces';
import { UseDataResult } from '../types/interfaces';
import { GridRef } from '../types/grid.interfaces';

// PDF Export Constants
const PDF_RANGE_ALL: PdfExportRange = 'All';
const PDF_RANGE_CURRENT_PAGE: PdfExportRange = 'CurrentPage';
const PDF_RANGE_CUSTOM: PdfExportRange = 'Custom';
const PDF_DEFAULT_FILENAME: string = 'Grid.pdf';
const PDF_DEFAULT_ORIENTATION: 'Portrait' | 'Landscape' = 'Portrait';
const PDF_DEFAULT_PAGE_SIZE: string = 'A4';
const PDF_DEFAULT_THEME: string = 'Material';
const PDF_EXPORT_CANCELLED_ERROR: string = 'PDF export operation cancelled by onBeforePdfExport hook.';

/**
 * Validates data size against PDF export warning threshold.
 *
 * @template T - The type of data records
 * @param {PdfExportSettings<T>} config - The PDF export configuration settings
 * @param {number} dataLength - The length of the data to be exported
 * @returns {void}
 */
function validateMaxRowsThreshold<T>(config: PdfExportSettings<T>, dataLength: number): void {
    if (config.maxRowsWarningThreshold && dataLength > config.maxRowsWarningThreshold) {
        throw new Error(
            `PDF Export service: Data size (${dataLength} rows) exceeds warning threshold (${config.maxRowsWarningThreshold} rows).`
        );
    }
}

/**
 * Extracts grid data based on PDF export range configuration.
 *
 * @template T - The type of data records
 * @param {UseGridPdfExportOptions<T>} options - The grid PDF export options
 * @param {PdfExportSettings<T>} config - The PDF export configuration settings
 * @returns {Promise<T[]>} The extracted data array
 */
async function extractData<T>(options: UseGridPdfExportOptions<T>, config: PdfExportSettings<T>): Promise<T[]> {
    const grid: GridRef<T> = options.gridRef.current as GridRef<T>;
    const dataModule: UseDataResult<T> = grid.getDataModule() as UseDataResult<T>;
    const allData: T[] = await options.getAllData?.(dataModule.getStateEventArgument(dataModule.generateQuery()));
    const resultData: unknown = await Promise.resolve(grid.getData(config.range !== PDF_RANGE_CURRENT_PAGE, false, allData));
    let data: T[] = Array.isArray(resultData) ? resultData : ((resultData as Record<string, unknown>).result as T[]);

    if (config.range === PDF_RANGE_CUSTOM && config.customRange) {
        data = data.slice(config.customRange.startRow, config.customRange.endRow + 1);
    }

    return data;
}

/**
 * Merges PDF export column customizations with grid column definitions.
 * Export columns take precedence over grid columns for specified properties.
 * Matches columns by field name.
 *
 * @param {ColumnProps[]} gridColumns - The original grid column definitions
 * @param {Partial<ColumnProps>[]} exportColumns - The export-specific column customizations
 * @returns {ColumnProps[]} Merged column definitions for PDF export
 */
function mergeExportColumns(
    gridColumns: ColumnProps[],
    exportColumns?: Partial<ColumnProps>[]
): ColumnProps[] {
    // If no customizations provided, return grid columns as-is
    if (!exportColumns) {
        return gridColumns;
    }

    // Create a map of export column customizations by field
    const exportColumnMap: Map<string, Partial<ColumnProps>> = new Map();

    exportColumns.forEach((col: Partial<ColumnProps>) => {
        if (col.field) {
            exportColumnMap.set(col.field, col);
        }
    });

    // Merge grid columns with export customizations
    return gridColumns.map((gridCol: ColumnProps) => {
        const exportCol: Partial<ColumnProps> | undefined = exportColumnMap.get(gridCol.field || '');

        // If export column customization exists, merge it with grid column
        // Export column properties take precedence (including width)
        return exportCol ? { ...gridCol, ...exportCol } : gridCol;
    });
}

/**
 * Executes PDF export operation with data extraction and event callbacks.
 *
 * @private
 * @template T - The type of data records
 * @param {UseGridPdfExportOptions<T>} options - The grid PDF export options
 * @param {PdfExportSettings<T>} userConfig - The user-provided PDF export configuration settings
 * @returns {Promise<PdfExportResult>} Result containing success status and optional error
 */
export async function pdfExportService<T>(
    options: UseGridPdfExportOptions<T>,
    userConfig: PdfExportSettings<T> = {}
): Promise<PdfExportResult> {
    const defaultConfig: PdfExportSettings<T> = {
        range: PDF_RANGE_ALL,
        fileName: PDF_DEFAULT_FILENAME,
        pageOrientation: PDF_DEFAULT_ORIENTATION,
        pageSize: PDF_DEFAULT_PAGE_SIZE,
        theme: PDF_DEFAULT_THEME
    };

    const config: PdfExportSettings<T> = { ...defaultConfig, ...userConfig };

    try {
        // Extract data based on range configuration
        let dataSource: T[] = await extractData(options, config);

        // Get grid column definitions
        const gridColumns: ColumnProps[] = options.getColumns?.() || options.gridRef.current.columns;

        // Merge grid columns with export column customizations
        let columns: ColumnProps[] = mergeExportColumns(
            gridColumns,
            config.columns
        );

        // Trigger before export callback with mutable event object
        const beforeEvent: { columns: ColumnProps[]; dataSource: T[]; config: PdfExportSettings<T>; cancel: boolean } = {
            columns,
            dataSource,
            config,
            cancel: false
        };

        config.onBeforePdfExport?.(beforeEvent);

        // Check if export was cancelled
        if (beforeEvent.cancel) {
            throw new Error(PDF_EXPORT_CANCELLED_ERROR);
        }

        // Use modified data and columns from event if they were changed
        dataSource = beforeEvent.dataSource ?? dataSource;
        columns = beforeEvent.columns ?? columns;

        // Validate data size after modification
        validateMaxRowsThreshold(config, dataSource.length);

        // Generate PDF and trigger download
        const exportResult: PdfExportResult = await pdfWindowManager(
            dataSource,
            columns,
            config
        );

        // Trigger after export callback - only for successful exports
        if (exportResult.success) {
            config.onAfterPdfExport?.({
                config,
                success: true
            });
        }

        return exportResult;
    } catch (error) {
        // Trigger after export callback with error
        const errorObj: Error = error instanceof Error ? error : new Error(String(error));
        config.onAfterPdfExport?.({
            config,
            success: false,
            error: errorObj
        });

        return {
            success: false,
            error: errorObj
        };
    }
}
