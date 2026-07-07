import * as React from 'react';
import { useState, useCallback } from 'react';
import { pdfExportService } from '../services/pdf-export-service';
import { UseGridPdfExportOptions, PdfExportSettings, PdfExportResult } from '../types/pdf-export.interfaces';

/**
 * React hook for Grid PDF export functionality.
 *
 * Provides PDF export capability with configurable data ranges and lifecycle callbacks.
 * Tracks export state via the `isExporting` flag to manage UI state during export operations.
 * All lifecycle logic is scoped to the hook, keeping the Grid API clean.
 *
 * @template T - The type of data being exported (extends unknown)
 * @param {UseGridPdfExportOptions<T>} options - Hook configuration options
 * @param {React.RefObject} options.gridRef - Reference to Grid component
 * @param {Function} [options.getColumns] - Optional callback to retrieve custom column definitions
 * @param {Function} [options.getAllData] - Optional callback to fetch all data
 * @returns {{pdfExport: Function, isExporting: boolean}} Hook result object with pdfExport function and export state
 *
 * @example
 * ```tsx
 * import { useGridPdfExport, GridRef } from '@syncfusion/react-grid';
 *
 * function MyGrid() {
 *   const gridRef = useRef<GridRef<Employee>>(null);
 *   const { pdfExport, isExporting } = useGridPdfExport({
 *     gridRef,
 *     // Optional: Provide custom lifecycle callbacks scoped to this hook
 *     onBeforeExport: (event) => console.log('Exporting...'),
 *     onAfterExport: (event) => console.log('Export complete')
 *   });
 *
 *   const handleExport = async () => {
 *     const result = await pdfExport({
 *       range: 'All',
 *       fileName: 'employees.pdf'
 *     });
 *     if (result.success) {
 *       console.log('PDF exported successfully');
 *     }
 *   };
 *
 *   return (
 *     <>
 *       <button onClick={handleExport} disabled={isExporting}>
 *         {isExporting ? 'Exporting...' : 'Export to PDF'}
 *       </button>
 *       <Grid ref={gridRef} {...props} />
 *     </>
 *   );
 * }
 * ```
 */
export function useGridPdfExport<T>(
    options: UseGridPdfExportOptions<T>
): { pdfExport: (config?: PdfExportSettings<T>) => Promise<PdfExportResult>; isExporting: boolean } {
    const [isExporting, setIsExporting]: [boolean, React.Dispatch<React.SetStateAction<boolean>>] = useState<boolean>(false);

    /**
     * Perform PDF export with provided configuration.
     *
     * Sets export state during operation, delegates to pdfExportService,
     * and ensures state cleanup even if operation fails.
     * Lifecycle callbacks are scoped to this hook only (hook-based architecture).
     *
     * @param {PdfExportSettings<T>} [config] - Optional PDF export configuration
     * @returns {Promise<PdfExportResult>} Result with success status and optional error
     */
    const pdfExport: (config?: PdfExportSettings<T>) => Promise<PdfExportResult> = useCallback(
        async (config?: PdfExportSettings<T>): Promise<PdfExportResult> => {
            setIsExporting(true);

            try {
                const result: PdfExportResult = await pdfExportService(options, config);
                return result;
            } finally {
                // Always reset exporting state after operation completes
                setIsExporting(false);
            }
        },
        [options]
    );

    return {
        pdfExport,
        isExporting
    };
}
