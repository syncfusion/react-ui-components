import { useState, useCallback } from 'react';
import { printService } from '../services/print-service';
import { PrintResult, PrintSettings, UseGridPrintOptions, UseGridPrintReturn } from '../types/print.interfaces';

/**
 * Custom hook managing grid print operations and loading state
 *
 * @param {UseGridPrintOptions<T>} options - The grid print options
 * @returns {UseGridPrintReturn} Object containing print function and isPrinting state
 */
export function useGridPrint<T>(options: UseGridPrintOptions<T>): UseGridPrintReturn {
    const [isPrinting, setPrinting] = useState(false);

    /**
     * Execute print operation with optional configuration
     */
    const print: (config?: PrintSettings) => Promise<PrintResult> = useCallback(
        async (config?: PrintSettings): Promise<PrintResult> => {
            setPrinting(true);
            const result: PrintResult = await printService(options, config);
            setPrinting(false);
            return result;
        },
        [options]
    );

    /**
     * Return print APIs and state
     */
    return {
        print,
        isPrinting
    };
}
