import { useCallback, useEffect, useState } from 'react';
import { excelExportService } from '../services/excel-export-service';
import type { ExcelExportSettings, UseGridExcelExportOptions, UseExcelExportReturn } from '../types/excel-export.interfaces';
import { GridTelemetryFeatures } from '../types/enum';
import { initializeTelemetryFeature } from '@syncfusion/react-base/src/telemetry';

/**
 * Hook for managing Excel export state and execution.
 *
 * Provides an `excelExport` function that runs the `excelExportService` and
 * exposes `isExporting`, `progress`, and `error` for UI feedback.
 *
 * @template T - Data row type
 * @param {UseGridExcelExportOptions<T>|undefined} options - Optional grid-aware export options
 * @returns {UseExcelExportReturn<T>} An object with `excelExport`, `progress`, `isExporting`, and `error`
 */
export function useGridExcelExport<T = Record<string, unknown>>(
    options?: UseGridExcelExportOptions<T>
): UseExcelExportReturn<T> {
    const [progress, setProgress] = useState<number>(0);
    const [isExporting, setIsExporting] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const excelExport: (settings: ExcelExportSettings<T>) => Promise<Blob> = useCallback(async (
        settings: ExcelExportSettings<T>
    ): Promise<Blob> => {
        setIsExporting(true);
        setError(null);
        setProgress(0);

        try {
            setProgress(10);
            const blob: Blob = await excelExportService<T>(settings, options);
            setProgress(100);

            setTimeout(() => {
                setIsExporting(false);
                setProgress(0);
            }, 500);

            return blob;
        } catch (err) {
            const errorMessage: string = err instanceof Error ? err.message : String(err);
            setError(errorMessage);
            setIsExporting(false);
            setProgress(0);

            throw new Error(`Excel export failed: ${errorMessage}`);
        }
    }, [options]);

    useEffect(() => {
        initializeTelemetryFeature(GridTelemetryFeatures.ExcelExport, 'DataGrid');
    }, []);

    return {
        excelExport,
        progress,
        isExporting,
        error
    };
}

export default useGridExcelExport;
