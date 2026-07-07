import { ColumnProps, GridRef, PrintRange, UseDataResult } from '../types';
import { PrintResult, PrintSettings, UseGridPrintOptions, PrintBeforeEvent } from '../types/print.interfaces';
import { printWindowManager } from './print-window-manager';
import { ReturnType } from '@syncfusion/react-data';

// Print service constants
const PRINT_RANGE_ALL: PrintRange = 'All';
const PRINT_RANGE_CURRENT_PAGE: string = 'CurrentPage';
const PRINT_RANGE_CUSTOM: string = 'Custom';
const PRINT_DEFAULT_TITLE: string = 'Print';
const PRINT_DEFAULT_WINDOW_WIDTH: number = 1200;
const PRINT_DEFAULT_WINDOW_HEIGHT: number = 800;
const PRINT_CANCELLED_ERROR: string = 'Print operation cancelled by onBeforePrint hook.';

/**
 * Validate data size against print warning threshold
 *
 * @param {PrintSettings} config - The print configuration settings
 * @param {number} dataLength - The length of the data to be printed
 * @returns {void}
 */
function validateMaxRowsThreshold(config: PrintSettings, dataLength: number): void {
    if (config.maxRowsWarningThreshold && dataLength > config.maxRowsWarningThreshold) {
        throw new Error(
            `Print service: Data size (${dataLength} rows) exceeds warning threshold (${config.maxRowsWarningThreshold} rows).`
        );
    }
}

/**
 * Extract grid data based on print range configuration
 *
 * @param {UseGridPrintOptions<T>} options - The grid print options
 * @param {PrintSettings} config - The print configuration settings
 * @returns {Promise<T[]>} The extracted data array
 */
async function extractData<T>(options: UseGridPrintOptions<T>, config: PrintSettings): Promise<T[]> {
    const grid: GridRef<T> = options.gridRef.current;
    const dataModule: UseDataResult = grid.getDataModule() as UseDataResult;
    const allData: T[] = await options.getAllData?.(dataModule.getStateEventArgument(dataModule.generateQuery()));
    const result: Response | ReturnType | T[] = await Promise.resolve(grid.getData(config.range !==
        PRINT_RANGE_CURRENT_PAGE, false, allData));
    let data: T[] = Array.isArray(result) ? result : (result as ReturnType).result as T[];

    if (config.range === PRINT_RANGE_CUSTOM && config.customRange) {
        data = data.slice(config.customRange.startRow, config.customRange.endRow + 1);
    }

    return data;
}

/**
 * Execute print operation with data extraction and event callbacks
 *
 * @private
 * @param {UseGridPrintOptions<T>} options - The grid print options
 * @param {PrintSettings} userConfig - The user-provided print configuration settings
 * @returns {Promise<PrintResult>} Result containing success status and optional error
 */
export async function printService<T>(
    options: UseGridPrintOptions<T>,
    userConfig: PrintSettings = {}
): Promise<PrintResult> {
    const defaultConfig: PrintSettings = {
        range: PRINT_RANGE_ALL,
        title: PRINT_DEFAULT_TITLE,
        windowWidth: PRINT_DEFAULT_WINDOW_WIDTH,
        windowHeight: PRINT_DEFAULT_WINDOW_HEIGHT
    };

    const config: PrintSettings = { ...defaultConfig, ...userConfig };

    try {
        const dataSource: T[] = await extractData(options, config);
        const columns: ColumnProps[] = [...(options.getColumns?.() || options.gridRef.current.columns)];
        const beforeEvent: PrintBeforeEvent<T> = {
            columns,
            dataSource,
            config,
            cancel: false
        };

        config.onBeforePrint?.(beforeEvent);

        if (beforeEvent.cancel) {
            throw new Error(PRINT_CANCELLED_ERROR);
        }

        validateMaxRowsThreshold(config, beforeEvent.dataSource.length);

        const result: PrintResult = await printWindowManager(
            beforeEvent.dataSource,
            beforeEvent.columns,
            config,
            options.gridRef
        );

        config.onAfterPrint?.({
            config,
            success: result.success,
            ...(result.error && { error: result.error })
        });

        return result;
    } catch (error) {
        config.onAfterPrint?.({
            config,
            success: false,
            ...(error && { error })
        });

        return {
            success: false,
            ...(error && { error })
        };
    }
}
