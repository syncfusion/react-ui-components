import { createElement } from '@syncfusion/react-base';
import { IPieChart } from '../pie-chart';
import { IChart } from '../chart';
import { ExportType } from './enum';
import {
    PdfDocument, PdfBitmap, PdfPageOrientation, PdfStandardFont, PdfSolidBrush, PdfColor, PdfPage,
    PdfPageTemplateElement, SizeF, PdfFontFamily, PdfStringFormat, PdfVerticalAlignment, PdfPen
} from '@syncfusion/pdf-export';

import type {
    ChartDataRecord,
    ChartDataScalar,
    ChartDataValue,
    ExportCellValue,
    ExportHeaderGroup,
    ExportSource,
    LivePointLike,
    LiveSeriesLike,
    ResolvedExportData
} from './interfaces';

import {
    Workbook,
    HAlignType,
    VAlignType,
    BlobSaveType
} from '@syncfusion/excel-export';
import { DataManager } from '@syncfusion/react-data';


interface IPdfTextArgs {
    content: string;
    fontSize?: number;
    x?: number;
    y?: number;
}

/**
 * Internal interface for control values during export.
 */
interface IControlValue {
    width: number;
    height: number;
    svg: Element;
    backgroundColor: string;
}

/**
 * Returns the value at the specified array index.
 *
 * @param {T[]} values - Array containing the value.
 * @param {number} index - Index of the value.
 * @returns {T | undefined} Value at the index, if available.
 *
 * @private
 */
function getArrayValue<T>(values: T[], index: number): T | undefined {
    return index >= 0
        ? values.slice(index, index + 1)[0]
        : undefined;
}

/**
 * Returns a record value for the specified runtime key.
 *
 * @param {ChartDataRecord} record - Record containing the value.
 * @param {string} key - Runtime key to find.
 * @returns {ChartDataValue | undefined} Matching record value.
 *
 * @private
 */
function getRecordValue(
    record: ChartDataRecord,
    key: string
): ChartDataValue | undefined {
    for (const [recordKey, value] of Object.entries(record)) {
        if (recordKey === key) {
            return value as ChartDataValue;
        }
    }

    return undefined;
}

/**
 * Returns a point value for the specified runtime key.
 *
 * @param {LivePointLike} point - Point containing the value.
 * @param {string} key - Runtime key to find.
 * @returns {ChartDataValue | undefined} Matching point value.
 *
 * @private
 */
function getPointValue(
    point: LivePointLike,
    key: string
): ChartDataValue | undefined {
    for (const [pointKey, value] of Object.entries(point)) {
        if (pointKey === key) {
            return value as ChartDataValue;
        }
    }

    return undefined;
}

/**
 * Exports the given chart or pie chart in the specified format.
 *
 * This is the single public entry point for image (SVG, PNG, JPG), PDF,
 * and spreadsheet (XLSX, CSV) export. It replaces the separate
 * exportImage() and exportPDF() methods, which are now deprecated in
 * favor of this method.
 *
 * Depending on the runtime environment:
 * - In browsers, the export triggers a file download.
 * - In headless environments, the export is performed without download.
 *
 * ### Supported formats:
 * - `SVG` – Scalable vector format for high-quality rendering
 * - `PNG` – Lossless raster image format
 * - `JPG` – Compressed raster image format
 * - `PDF` – Portable document format
 * - `XLSX` – Microsoft Excel workbook containing the chart data
 * - `CSV` – Comma-separated text containing the chart data
 *
 * For the XLSX and CSV formats, the export preserves visible categories,
 * series values, numeric values, missing cells, and supported
 * specialized-series fields, rather than the chart's rendered appearance.
 *
 * @param {IPieChart | IChart} chart - The chart instance to export.
 * The chart must be initialized and contain a valid `element`. If not,
 * the export operation is skipped.
 *
 * @param {ExportType} type - The desired export format.
 *
 * @param {string} fileName - The name of the exported file
 * without an extension. Defaults to `Chart` when omitted, empty,
 * whitespace-only, or composed only of periods.
 *
 * @param {PdfPageOrientation} orientation - Optional page orientation
 * for the exported PDF document. Applicable only when `type` is `PDF`.
 * If not specified, the default PDF page orientation is used.
 *
 * @param {IPdfTextArgs} header - Optional PDF header configuration.
 * Specifies the header content, font size, and drawing position.
 * Applicable only when `type` is `PDF`.
 *
 * @param {IPdfTextArgs} footer - Optional PDF footer configuration.
 * Specifies the footer content, font size, and drawing position.
 * Applicable only when `type` is `PDF`.
 *
 * @returns {void} Does not return a value. Triggers a download or
 * performs the export depending on the execution environment.
 */
export function exportChart(
    chart: IPieChart | IChart,
    type: ExportType,
    fileName: string = 'Chart',
    orientation?: PdfPageOrientation,
    header?: IPdfTextArgs,
    footer?: IPdfTextArgs
): void {

    switch (type) {
    case 'SVG':
    case 'PNG':
    case 'JPG':
        imageExport(chart, type, fileName);
        break;
    case 'PDF':
        pdfExport(chart, fileName, orientation, header, footer);
        break;
    case 'XLSX':
    case 'CSV':
        excelExport(chart, type, fileName);
        break;
    }
}

/**
 * Exports the given chart as an image file in the specified format.
 *
 * This method generates an image representation of the chart in one of the
 * supported formats: **SVG**, **PNG**, or **JPG**. The exported file uses the
 * provided file name with the appropriate extension automatically appended.
 *
 * Depending on the runtime environment:
 * - In browsers, the export triggers a file download.
 * - In headless environments, the export is performed without download.
 *
 * ### Supported formats:
 * - `SVG` – Scalable vector format for high-quality rendering
 * - `PNG` – Lossless raster image format
 * - `JPG` – Compressed raster image format
 *
 * @deprecated Use exportChart(chart, type, fileName) instead.
 * exportImage() remains functional and delegates internally to exportChart();
 * it will be removed in a future major release.
 *
 * @param {IPieChart | IChart} chart - The chart instance to export.
 * The chart must be initialized and contain a valid `element`. If not,
 * the export operation is skipped.
 *
 * @param {'SVG' | 'PNG' | 'JPG'} type - The desired export format.
 *
 * @param {string} fileName - The name of the exported file (without extension).
 *
 * @returns {void} Does not return a value. Triggers a download or performs export
 * depending on the execution environment.
 */
export function exportImage(chart: IPieChart | IChart, type: ExportType, fileName: string): void {
    exportChart(chart, type, fileName);
}


/**
 * Exports the given chart as an image file in the specified format.
 *
 * @param {IPieChart | IChart} chart - The chart instance to export.
 * The chart must be initialized and contain a valid `element`. If not,
 * the export operation is skipped.
 *
 * @param {'SVG' | 'PNG' | 'JPG'} type - The desired export format.
 *
 * @param {string} fileName - The name of the exported file (without extension).
 *
 * @returns {void} Does not return a value. Triggers a download or performs export
 * depending on the execution environment.
 * @private
 */
export function imageExport(
    chart: IPieChart | IChart,
    type: ExportType,
    fileName: string
): void {
    if (!chart.element) {
        return;
    }

    const controlValue: IControlValue = getControlValue(chart);
    const isDownload: boolean = !isHeadlessChrome();
    const resolvedFileName: string = sanitizeFileBaseName(fileName.trim()) || 'Chart';

    switch (type) {
    case 'SVG':
        exportSVG(controlValue, resolvedFileName, isDownload);
        break;
    case 'PNG':
    case 'JPG':
        exportPNG(controlValue, type as 'PNG' | 'JPG', resolvedFileName, isDownload);
        break;
    }
}



/**
 * Gets the data URL of the chart for programmatic use.
 *
 * @param {IPieChart | IChart} chart - The chart instance.
 * @returns {Promise<string>} A promise that resolves to the data URL of the chart image.
 * @private
 *
 * @example
 * ```tsx
 * const dataUrl = await getExportDataUrl(chartRef);
 * ```
 */
export async function getExportDataUrl(chart: IPieChart | IChart): Promise<string> {
    if (!chart.element) {
        throw new Error('Chart element is not available');
    }

    return new Promise<string>((
        resolve: (value: string | PromiseLike<string>) => void,
        reject: (reason?: Error) => void
    ): void => {

        let url: string = '';

        try {
            const controlValue: IControlValue = getControlValue(chart);
            const canvas: HTMLCanvasElement = createElement('canvas', {
                attrs: {
                    'width': controlValue.width.toString(),
                    'height': controlValue.height.toString()
                }
            }) as HTMLCanvasElement;

            url = createBlobUrl(controlValue.svg);

            const image: HTMLImageElement = new Image();

            image.onload = () => {
                const ctx: CanvasRenderingContext2D | null = canvas.getContext('2d');

                if (!ctx) {
                    window.URL.revokeObjectURL(url);
                    reject(new Error('Failed to get canvas context'));
                    return;
                }

                ctx.drawImage(image, 0, 0);
                window.URL.revokeObjectURL(url);

                resolve(canvas.toDataURL('image/png'));
            };

            image.onerror = () => {
                window.URL.revokeObjectURL(url);
                reject(new Error('Failed to load image'));
            };

            image.src = url;

        } catch (error) {
            if (url) {
                window.URL.revokeObjectURL(url);
            }

            reject(error instanceof Error ? error : new Error('Export failed'));
        }
    });
}

/**
 * Gets the control value (dimensions and SVG element) for export.
 *
 * @private
 * @param {IPieChart | IChart} chart - The chart instance.
 * @returns {IControlValue} Object containing width, height, and SVG element.
 */
function getControlValue(chart: IPieChart | IChart): IControlValue {
    const svg: Element | null = chart.element?.querySelector('svg') || null;

    if (!svg) {
        throw new Error('SVG element not found in chart');
    }
    const clonedSvg: Element = svg.cloneNode(true) as Element;

    const rect: DOMRect = svg.getBoundingClientRect();
    const width: number = Math.ceil(rect.width);
    const height: number = Math.ceil(rect.height);
    const theme: string = chart.theme || 'Material';
    const backgroundColor: string =
        theme.indexOf('Dark') > -1 ||
        theme.indexOf('HighContrast') > -1
            ? 'rgba(0, 0, 0, 1)'
            : 'rgba(255, 255, 255, 1)';
    const fill: string = clonedSvg.getAttribute('fill') || backgroundColor;

    if (fill === 'transparent') {
        clonedSvg.setAttribute('fill', backgroundColor);
    }
    return {
        width,
        height,
        svg: clonedSvg,
        backgroundColor
    };
}

/**
 * Exports the chart as SVG format.
 *
 * @param {IControlValue} controlValue - Specifies the control value containing SVG content and dimensions.
 * @param {string} fileName - Specifies the file name to use for the exported SVG file.
 * @param {boolean} isDownload - Specifies whether the exported file should be downloaded automatically.
 * @returns {void}
 * @private
 */
function exportSVG(controlValue: IControlValue, fileName: string, isDownload: boolean): void {
    const svgClone: SVGElement = controlValue.svg.cloneNode(true) as SVGElement;
    const backgroundRect: SVGRectElement = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    backgroundRect.setAttribute('x', '0');
    backgroundRect.setAttribute('y', '0');
    backgroundRect.setAttribute('width', '100%');
    backgroundRect.setAttribute('height', '100%');
    backgroundRect.setAttribute('fill', controlValue.backgroundColor);
    svgClone.insertBefore(backgroundRect, svgClone.firstChild);

    const svgData: string = new XMLSerializer().serializeToString(svgClone);

    const blob: Blob = new Blob([svgData], { type: 'image/svg+xml' });
    triggerDownload(fileName, 'svg', blob, isDownload);
}

/**
 * Exports the chart as PNG or JPG image format.
 *
 * @param {IControlValue} controlValue - Specifies the control value containing SVG content and export dimensions.
 * @param {'PNG' | 'JPG'} type - Specifies the image export type.
 * @param {string} fileName - Specifies the file name to use for the exported image.
 * @param {boolean} isDownload - Specifies whether the exported file should be downloaded automatically.
 * @returns {void}
 * @private
 */
function exportPNG(
    controlValue: IControlValue,
    type: 'PNG' | 'JPG',
    fileName: string,
    isDownload: boolean
): void {

    const canvas: HTMLCanvasElement = createElement('canvas') as HTMLCanvasElement;
    canvas.width = controlValue.width;
    canvas.height = controlValue.height;
    canvas.style.width = controlValue.width + 'px';
    canvas.style.height = controlValue.height + 'px';
    const url: string = createBlobUrl( controlValue.svg);
    const image: HTMLImageElement = new Image();
    image.crossOrigin = 'anonymous';

    image.onload = () => {

        const ctx: CanvasRenderingContext2D | null = canvas.getContext('2d');

        if (ctx) {

            ctx.fillStyle = controlValue.backgroundColor;
            ctx.fillRect(0, 0, controlValue.width, controlValue.height);
            ctx.drawImage(image, 0, 0);
            window.URL.revokeObjectURL(
                url
            );

            const mime: string = type === 'JPG' ? 'image/jpeg' : 'image/png';
            canvas.toBlob((blob: Blob | null): void => {
                if (blob) {
                    triggerDownload(fileName, type.toLowerCase(), blob, isDownload);

                }
            },
                          mime, type === 'JPG' ? 0.95 : undefined
            );
        }
    };

    image.onerror = () => {window.URL.revokeObjectURL( url); };
    image.src = url;
}


/**
 * Creates a blob URL from an SVG element.
 *
 * @param {Element} svg - Specifies the SVG element to convert into a blob URL.
 * @returns {string} - Returns the generated blob URL for the SVG content.
 * @private
 */
function createBlobUrl(svg: Element): string {
    const svgData: string = '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">' +
        svg.outerHTML +
        '</svg>';

    const blob: Blob = new Blob([svgData], { type: 'image/svg+xml' });
    return window.URL.createObjectURL(blob);
}

/**
 * Triggers the download of a file.
 *
 * @param {string} fileName - Specifies the name of the exported file.
 * @param {string} fileExtension - Specifies the file extension to append to the download file name.
 * @param {Blob} blob - Specifies the blob content to download.
 * @param {boolean} isDownload - Specifies whether the file download should be triggered automatically.
 * @returns {void}
 * @private
 */
function triggerDownload(fileName: string, fileExtension: string, blob: Blob, isDownload: boolean): void {
    const url: string = window.URL.createObjectURL(blob);
    const link: HTMLAnchorElement = createElement('a', {
        attrs: {
            'download': fileName + '.' + fileExtension,
            'href': url
        }
    }) as HTMLAnchorElement;

    if (isDownload) {
        link.click();
    }

    window.URL.revokeObjectURL(url);
}



/**
 * Exports the given chart as a PDF document.
 *
 * This method generates a PDF representation of the chart by converting its
 * SVG content into an image and embedding it into a PDF document. The exported
 * PDF uses the provided file name with the `.pdf` extension automatically appended.
 *
 * @deprecated Use exportChart(chart, 'PDF', fileName, orientation, header, footer) instead.
 * exportPDF() remains functional and delegates internally to exportChart();
 * it will be removed in a future major release.
 *
 * @param {IPieChart | IChart} chart - The chart instance to export.
 * The chart must be initialized and contain a valid `element`. If not,
 * the export operation is skipped.
 *
 * @param {string} fileName - The name of the exported PDF file (without extension).
 *
 * @param {PdfPageOrientation} orientation - Optional page orientation for
 * the exported PDF document. If not specified, the default orientation is used.
 *
 * @param {IPdfTextArgs} header - Optional header configuration for the PDF.
 * Specifies the header text, font size, and drawing position.
 *
 * @param {IPdfTextArgs} footer - Optional footer configuration for the PDF.
 * Specifies the footer text, font size, and drawing position.
 *
 * @returns {void} Does not return a value. Triggers a PDF download or performs
 * export depending on the execution environment.
 */
export function exportPDF(
    chart: IPieChart | IChart,
    fileName: string,
    orientation?: PdfPageOrientation,
    header?: IPdfTextArgs,
    footer?: IPdfTextArgs
): void {
    exportChart(chart, 'PDF', fileName, orientation, header, footer);
}


/**
 * Exports the given chart as a PDF document.
 *
 * @param {IPieChart | IChart} chart - The chart instance to export.
 * The chart must be initialized and contain a valid `element`. If not,
 * the export operation is skipped.
 *
 * @param {string} fileName - The name of the exported PDF file (without extension).
 *
 * @param {PdfPageOrientation} orientation - Optional page orientation for
 * the exported PDF document. If not specified, the default orientation is used.
 *
 * @param {IPdfTextArgs} header - Optional header configuration for the PDF.
 * Specifies the header text, font size, and drawing position.
 *
 * @param {IPdfTextArgs} footer - Optional footer configuration for the PDF.
 * Specifies the footer text, font size, and drawing position.
 *
 * @returns {void} Does not return a value. Triggers a PDF download or performs
 * export depending on the execution environment.
 * @private
 */
export function pdfExport (
    chart: IPieChart | IChart,
    fileName: string,
    orientation?: PdfPageOrientation,
    header?: IPdfTextArgs,
    footer?: IPdfTextArgs
): void {
    if (!chart.element) { return; }
    const resolvedFileName: string = sanitizeFileBaseName(fileName.trim()) || 'Chart';
    const controlValue: IControlValue = getControlValue(chart);
    const canvas: HTMLCanvasElement = document.createElement('canvas');
    canvas.width = controlValue.width;
    canvas.height = controlValue.height;

    const ctx: CanvasRenderingContext2D = canvas.getContext('2d') as CanvasRenderingContext2D;
    if (!ctx) { return; }

    const url: string = createBlobUrl(controlValue.svg);
    const image: HTMLImageElement = new Image();
    image.crossOrigin = 'anonymous';

    image.onload = () => {
        // Paint background
        ctx.fillStyle = controlValue.backgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(image, 0, 0);

        window.URL.revokeObjectURL(url);

        const document: PdfDocument = new PdfDocument();
        document.pageSettings.orientation = orientation as PdfPageOrientation;

        let headerHeight: number = 0;
        if (header) {
            headerHeight = 30;
            const font: PdfStandardFont = new PdfStandardFont(PdfFontFamily.Helvetica, header.fontSize ?? 14);
            const brush: PdfSolidBrush = new PdfSolidBrush(new PdfColor(0, 0, 0));
            const pen: PdfPen = new PdfPen(new PdfColor(0, 0, 0));
            pen.width = 0;
            const format: PdfStringFormat = new PdfStringFormat();
            format.lineAlignment = PdfVerticalAlignment.Middle;
            const template: PdfPageTemplateElement = new PdfPageTemplateElement(canvas.width, headerHeight);
            template.graphics.drawString(header.content, font, pen, brush, header.x ?? 10, header.y ?? 10, format);
            document.template.top = template;
        }

        let footerHeight: number = 0;
        if (footer) {
            footerHeight = 30;
            const font: PdfStandardFont = new PdfStandardFont(PdfFontFamily.Helvetica, footer.fontSize ?? 12);
            const brush: PdfSolidBrush = new PdfSolidBrush(new PdfColor(0, 0, 0));
            const pen: PdfPen = new PdfPen(new PdfColor(0, 0, 0));
            pen.width = 0;
            const format: PdfStringFormat = new PdfStringFormat();
            format.lineAlignment = PdfVerticalAlignment.Middle;
            const template: PdfPageTemplateElement = new PdfPageTemplateElement(canvas.width, footerHeight);
            template.graphics.drawString(footer.content, font, pen, brush, footer.x ?? 10, footer.y ?? 10, format);
            document.template.bottom = template;
        }

        const page: PdfPage = document.pages.add();
        const clientSize: SizeF = typeof page.getClientSize === 'function' ? page.getClientSize()
            : {width: document.pageSettings.size.width, height: document.pageSettings.size.height};
        let drawWidth: number = canvas.width;
        let drawHeight: number = canvas.height;
        const ratio: number = Math.min(clientSize.width / drawWidth, clientSize.height / drawHeight);
        drawWidth *= ratio;
        drawHeight *= ratio;
        const imageData: string = canvas.toDataURL('image/jpeg').split(',')[1];
        page.graphics.drawImage(new PdfBitmap(imageData), 0, 0, drawWidth, drawHeight);
        document.save(resolvedFileName + '.pdf'); document.destroy();
    };
    image.onerror = () => {
        window.URL.revokeObjectURL(url);
    };
    image.src = url;
}
/**
 * Exports the given Chart or PieChart data in the specified spreadsheet format.
 *
 * This method generates a spreadsheet-friendly representation of the chart data
 * in one of the supported formats: **XLSX** or **CSV**. The exported file uses
 * the provided file name with the appropriate extension automatically appended.
 *
 * Depending on the runtime environment:
 * - In browsers, the export triggers a file download.
 * - In headless environments, the export is performed without download.
 *
 * ### Supported formats:
 * - `XLSX` - Microsoft Excel workbook format
 * - `CSV` - Comma-separated values text format
 *
 * @param {IPieChart | IChart} chart - The Chart or PieChart instance to export.
 * The chart must be initialized and contain a valid `element` and exportable
 * data. If not, the export operation is skipped.
 *
 * @param {'XLSX' | 'CSV'} type - The desired spreadsheet export format.
 *
 * @param {string} fileName - The name of the exported file. The corresponding
 * extension is appended automatically. If the file name is empty, `export`
 * is used as the default name.
 *
 * @returns {void} Does not return a value. Triggers a download or performs
 * the export depending on the execution environment.
 *
 * @private
 *
 */
export function excelExport(
    chart: IPieChart | IChart,
    type: ExportType,
    fileName: string
): void {
    if (!chart.element) {
        return;
    }

    const source: ExportSource | undefined = chart.getExportSource?.();

    const data: ResolvedExportData | undefined = resolveChartExportData(source);

    if (!data || data.headers.length === 0) {
        return;
    }

    if (!isBrowserDownloadSafe()) {
        return;
    }

    const resolvedName: string = resolveFilename(fileName, type);

    const isDownload: boolean = !isHeadlessChrome();

    if (type === 'CSV') {
        const blob: Blob = buildCsvBlob(data);

        triggerBrowserDownload( blob, resolvedName, isDownload
        );

        return;
    }

    void createXlsxExportBlob(data)
        .then(
            (blob: Blob): void => {
                triggerBrowserDownload(
                    blob,
                    resolvedName,
                    isDownload
                );
            }
        )
        .catch(
            (): void => undefined
        );
}

/**
 * Characters disallowed at the start of an export filename.
 *
 * Browsers treat names beginning with `=`, `+`, `-`, `@`, `,`, tab,
 * CR, or LF as spreadsheet formulas, separators, or whitespace,
 * which corrupts the resulting download (for example, `+` becomes
 * `+`, and `,` and `@` are dropped from the saved filename).
 *
 * @private
 */
const INVALID_FILENAME_LEAD: RegExp = /^[=+\-@,*&$#^!<>/?()`~\t\r\n]+/;

/**
 * Strips characters that browsers reject or misinterpret at the start of
 * a filename and returns a safe basename.
 *
 * @param {string} baseFileName - Trimmed, extension-stripped filename.
 * @returns {string} Safe basename.
 *
 * @private
 */
function sanitizeFileBaseName(baseFileName: string): string {
    return baseFileName.replace(INVALID_FILENAME_LEAD, '');
}

/**
 * Normalizes an export filename for the requested spreadsheet format.
 *
 * Guarantees:
 * - Uses `Chart` when the supplied filename is empty or whitespace-only.
 * - Removes an existing XLSX or CSV extension, case-insensitively.
 * - Strips leading characters that browsers reject or misinterpret
 *   (e.g. `=`, `+`, `-`, `@`, `,`, tab, CR, LF).
 * - Appends the extension corresponding to the requested export type.
 *
 * @param {string} fileName - User-supplied filename.
 * @param {ExportType} type - Requested spreadsheet format.
 * @returns {string} Filename including the requested extension.
 *
 * @private
 */
export function resolveFilename(
    fileName: string,
    type: ExportType
): string {
    const extension: string = type.toLowerCase();
    const normalizedFileName: string = fileName.trim().replace(/^\.+$/, '') || 'Chart';
    const strippedFileName: string = normalizedFileName.replace(/\.(xlsx|csv)$/i, '');
    const baseFileName: string = sanitizeFileBaseName(strippedFileName) || 'Chart';

    return `${baseFileName}.${extension}`;
}

/**
 * Resolves a Chart or PieChart snapshot into the spreadsheet-friendly
 * tabular payload consumed by the XLSX and CSV writers.
 *
 * @param {ExportSource | null | undefined} source - Export snapshot
 * published by the renderer. `undefined` if the chart has no
 * `getExportSource()` method or has not yet been measured.
 * @returns {ResolvedExportData | undefined} Normalized export data.
 *
 * @private
 */
export function resolveChartExportData(
    source: ExportSource | null | undefined
): ResolvedExportData | undefined {
    if (!source) {
        return undefined;
    }

    const isPie: boolean = source.kind === 'piechart';

    const visibleSeries: LiveSeriesLike[] =
        source.visibleSeries.filter(
            (
                series: LiveSeriesLike
            ): boolean => {
                if (series.visible === false) {
                    return false;
                }

                if (series.category === 'TrendLine') {
                    return false;
                }

                return true;
            }
        );

    if (visibleSeries.length === 0) {
        return undefined;
    }

    const requiredColumns: string[][] = visibleSeries.map(( series: LiveSeriesLike ): string[] => resolveRequiredColumns( series, isPie ));

    const xValues: ChartDataValue[] = collectXValues( visibleSeries, isPie );

    if (xValues.length === 0) {
        return undefined;
    }

    const headers: string[] = buildHeaderRow( visibleSeries, requiredColumns );

    const headerGroups: ExportHeaderGroup[] | undefined = buildHeaderGroups( visibleSeries, requiredColumns );
    const rows: ExportCellValue[][] = buildDataRows( visibleSeries, requiredColumns, xValues, isPie );

    return {
        title: resolveChartTitle( source.title ), headers, headerGroups, rows, seriesCount: visibleSeries.length };
}

/**
 * Returns the trimmed user-supplied Chart title.
 *
 * @param {string | undefined} raw - Raw Chart title.
 * @returns {string | undefined} Normalized title.
 *
 * @private
 */
function resolveChartTitle(
    raw: string | undefined
): string | undefined {
    const title: string = raw?.trim() || '';

    return title || undefined;
}

/**
 * Builds an RFC-4180 CSV Blob from normalized Chart data.
 *
 * Multi-value series use two header rows:
 * - Series group names
 * - Individual value fields
 *
 * Values beginning with spreadsheet formula characters are prefixed
 * with an apostrophe to mitigate formula injection.
 *
 * @param {ResolvedExportData} data - Normalized Chart data.
 * @returns {Blob} CSV payload.
 *
 * @private
 */
export function buildCsvBlob(
    data: ResolvedExportData
): Blob {
    const lines: string[] = [];

    if ( data.headerGroups && data.headerGroups.length > 0 ) {
        const groupHeaders: ExportCellValue[] = data.headers.map((
            header: string, columnIndex: number ): ExportCellValue => {
            if (columnIndex === 0) {
                return header || 'Category';
            }

            const group: ExportHeaderGroup | undefined = data.headerGroups?.find(( headerGroup: ExportHeaderGroup )
            : boolean => headerGroup.startColumn === columnIndex );

            return group ? group.title : null;
        }
        );

        lines.push(groupHeaders.map(csvField).join(','));

        const valueHeaders: ExportCellValue[] = data.headers.map(
            ( header: string, columnIndex: number ): ExportCellValue => columnIndex === 0 ? null : header
        );

        lines.push(valueHeaders.map(csvField).join(',')
        );
    } else {
        lines.push(data.headers.map(csvField).join(','));
    }

    for (const row of data.rows) {
        lines.push(row.map(csvField).join(','));
    }

    return new Blob([lines.join('\r\n')],
                    {
                        type: 'text/csv;charset=utf-8'
                    }
    );
}

/* ------------------------------------------------------------------------- *
 * Per-series column layout
 * ------------------------------------------------------------------------- */

/**
 * Returns the fallback series name.
 *
 * @param {number} index - Zero-based series index.
 * @returns {string} Fallback series name.
 *
 * @private
 */
function fallbackSeriesName(
    index: number
): string {
    return `Series ${index + 1}`;
}

/**
 * Determines whether the supplied series is a Histogram.
 *
 * @param {LiveSeriesLike} series - Series to inspect.
 * @returns {boolean} Whether the series is a Histogram.
 *
 * @private
 */
function isHistogramSeries( series: LiveSeriesLike ): boolean {
    return ( series.type === 'Histogram' || series.drawType === 'Histogram' );
}

/**
 * Determines whether the supplied series is a Box-and-Whisker series.
 *
 * @param {LiveSeriesLike} series - Series to inspect.
 * @returns {boolean} Whether the series is Box-and-Whisker.
 *
 * @private
 */
function isBoxAndWhiskerSeries( series: LiveSeriesLike ): boolean {
    return ( series.type === 'BoxAndWhisker' || series.drawType === 'BoxAndWhisker' );
}

/**
 * Resolves the required data columns for one series.
 *
 * The first column is always the category/X field. Remaining columns
 * represent values required by the series type.
 *
 * @param {LiveSeriesLike} series - Visible series.
 * @param {boolean} isPie - Whether the Chart is a PieChart.
 * @returns {string[]} Required field names.
 *
 * @private
 */
function resolveRequiredColumns(
    series: LiveSeriesLike,
    isPie: boolean
): string[] {
    const type: string = series.type || series.drawType || '';
    const xField: string = series.xField || 'Category';

    if (isPie) {
        return [ xField, series.yField || series.name || 'Value' ];
    }

    if (type === 'Histogram') {
        return [ 'Bin', series.name?.trim() || 'Frequency' ];
    }

    if ( type.includes('Range') || type === 'Hilo' ) {
        return [ xField, 'high', 'low' ];
    }

    if ( type === 'HiloOpenClose' || type === 'Candle' ) {
        return [ xField, 'high', 'low', 'open', 'close' ];
    }

    if (type === 'BoxAndWhisker') {
        return [ xField, 'maximum', 'upperQuartile', 'median', 'lowerQuartile', 'minimum', 'outliers' ];
    }

    if (type === 'Bubble') {
        return [ xField, series.yField || 'y', 'size' ];
    }

    return [ xField, series.yField || 'y' ];
}

/* ------------------------------------------------------------------------- *
 * X-value collection
 * ------------------------------------------------------------------------- */

/**
 * Collects the ordered union of X-values across all visible series.
 *
 * @param {LiveSeriesLike[]} visibleSeries - Visible series.
 * @param {boolean} isPie - Whether the Chart is a PieChart.
 * @returns {ChartDataValue[]} Ordered X-values.
 *
 * @private
 */
function collectXValues(
    visibleSeries: LiveSeriesLike[],
    isPie: boolean
): ChartDataValue[] {
    const values: ChartDataValue[] = [];

    const addValue: (value: ChartDataValue) => void = (
        value: ChartDataValue
    ): void => {
        if ( value === null || value === undefined ) {
            return;
        }

        const exists: boolean = values.some(( current: ChartDataValue ): boolean =>
            Object.is(current, value)
        );

        if (!exists) {
            values.push(value);
        }
    };

    for (const series of visibleSeries) {
        if (isPie) {
            const points: LivePointLike[] = series.points || [];

            for (const point of points) {
                if (point.visible === false) {
                    continue;
                }

                addValue(getPointX(point));
            }

            continue;
        }
        if (isHistogramSeries(series)) {
            const points: LivePointLike[] = series.points || [];

            for (const point of points) {
                if (point.visible === false) {
                    continue;
                }

                addValue(getPointX(point));
            }

            continue;
        }
        const source: ChartDataRecord[] | null = pickDataSource(series);

        if (source) {
            const xField: string = series.xField || 'x';

            for (const item of source) {
                addValue(getRecordValue(item, xField) as ChartDataValue);
            }

            continue;
        }

        const points: LivePointLike[] = series.points || [];

        for (const point of points) {
            addValue(getPointX(point));
        }
    }

    return values;
}

/**
 * Returns the runtime data records for a Cartesian series.
 *
 * For a DataManager source, the currently resolved view data is used.
 *
 * @param {LiveSeriesLike} series - Series to inspect.
 * @returns {ChartDataRecord[] | null} Runtime records.
 *
 * @private
 */
function pickDataSource(
    series: LiveSeriesLike
): ChartDataRecord[] | null {
    const dataSource: ChartDataRecord[] | DataManager | null | undefined = series.dataSource;

    if (isDataManager(dataSource)) {
        return Array.isArray( series.currentViewData ) ? series.currentViewData : null;
    }

    return Array.isArray(dataSource) ? dataSource : null;
}

/* ------------------------------------------------------------------------- *
 * Header construction
 * ------------------------------------------------------------------------- */

/**
 * Builds the spreadsheet value-header row.
 *
 * Series with multiple value columns use field names such as
 * `high` and `low`. Their series names are provided separately
 * through `buildHeaderGroups()`.
 *
 * @param {LiveSeriesLike[]} visibleSeries - Visible series.
 * @param {Array<Array<string>>} requiredColumns - Required columns for each series.
 * @returns {string[]} Spreadsheet value headers.
 *
 * @private
 */
function buildHeaderRow(
    visibleSeries: LiveSeriesLike[],
    requiredColumns: string[][]
): string[] {
    const headers: string[] = [];
    let xHeaderAdded: boolean = false;

    const hasGroupedHeaders: boolean = requiredColumns.some((columns: string[], index: number ): boolean => columns.length > 2 && getArrayValue(visibleSeries, index)?.type !== 'Bubble');

    visibleSeries.forEach(( series: LiveSeriesLike, seriesIndex: number ): void => {
        const columns: string[] = getArrayValue(requiredColumns, seriesIndex) || [];
        columns.forEach(( columnName: string, columnIndex: number ): void => {
            if (columnIndex === 0) {
                if (!xHeaderAdded) {
                    const source:  ChartDataRecord[] | null =  pickDataSource(series);
                    const xField: string = series.xField || 'x';
                    const hasDateTimeValues: boolean = Boolean(source?.some((item: ChartDataRecord): boolean =>
                        getRecordValue(item, xField) instanceof Date));
                    headers.push(isHistogramSeries(series) ? columnName : hasDateTimeValues ? 'DateTime' : 'Category');
                    xHeaderAdded = true;
                }

                return;
            }

            if (hasGroupedHeaders) {
                headers.push( columnName );

                return;
            }

            headers.push(
                columnIndex === 1 ? (series.name?.trim() || fallbackSeriesName( seriesIndex )) : columnName
            );
        }
        );
    }
    );

    return headers;
}

/**
 * Builds grouped series headers for multi-value series.
 *
 * For example, a Hilo series named Seattle spans its high and low
 * value columns in the XLSX header.
 *
 * @param {LiveSeriesLike[]} visibleSeries - Visible series.
 * @param {Array<Array<string>>} requiredColumns - Required columns for each series.
 * @returns {ExportHeaderGroup[] | undefined} Grouped header metadata.
 *
 * @private
 */
function buildHeaderGroups(
    visibleSeries: LiveSeriesLike[],
    requiredColumns: string[][]
): ExportHeaderGroup[] | undefined {
    const hasGroupedHeaders: boolean = requiredColumns.some(
        (columns: string[], index: number): boolean =>
            columns.length > 2 && getArrayValue(visibleSeries, index)?.type !== 'Bubble'
    );

    if (!hasGroupedHeaders) {
        return undefined;
    }

    const groups: ExportHeaderGroup[] = [];
    let startColumn: number = 1;

    visibleSeries.forEach(( series: LiveSeriesLike, seriesIndex: number ): void => {
        const columns: string[] = getArrayValue(requiredColumns, seriesIndex) || [];
        const columnSpan: number = columns.length - 1;

        if (columnSpan <= 0) {
            return;
        }

        groups.push({ title: series.name?.trim() || fallbackSeriesName(seriesIndex), startColumn, columnSpan
        });

        startColumn += columnSpan;
    }
    );

    return groups;
}
/* ------------------------------------------------------------------------- *
 * Body-row construction
 * ------------------------------------------------------------------------- */

/**
 * Builds aligned spreadsheet rows.
 *
 * @param {LiveSeriesLike[]} visibleSeries - Visible series.
 * @param {Array<Array<string>>} requiredColumns - Required columns for each series.
 * @param {ChartDataValue[]} xValues - Ordered X-values.
 * @param {boolean} isPie - Indicates whether the chart is a PieChart.
 * @returns {Array<Array<ExportCellValue>>} Aligned spreadsheet rows.
 *
 * @private
 */
function buildDataRows(
    visibleSeries: LiveSeriesLike[],
    requiredColumns: string[][],
    xValues: ChartDataValue[],
    isPie: boolean
): ExportCellValue[][] {
    const rows: ExportCellValue[][] = [];

    for (const xValue of xValues) {
        const row: ExportCellValue[] = [toCell(xValue)];

        visibleSeries.forEach(( series: LiveSeriesLike, seriesIndex: number ): void => {
            const columns: string[] = getArrayValue(requiredColumns, seriesIndex) || [];

            for ( let columnIndex: number = 1; columnIndex < columns.length; columnIndex++ ) {
                const columnName: string | undefined = getArrayValue(columns, columnIndex);

                if (!columnName) {
                    continue;
                }

                row.push( pickSeriesCell( series, columnName, xValue, isPie ));
            }
        }
        );

        rows.push(row);
    }

    return rows;
}

/**
 * Resolves one spreadsheet cell for a series and X-value.
 *
 * PieChart values are resolved from points. Cartesian values are
 * resolved from the series data source when available, with resolved
 * point values used as the fallback and for specialized series fields.
 *
 * @param {LiveSeriesLike} series - Source series.
 * @param {string} columnName - Runtime field name.
 * @param {ChartDataValue} xValue - Current X-value.
 * @param {boolean} isPie - Whether the Chart is a PieChart.
 * @returns {ExportCellValue} Normalized spreadsheet value.
 *
 * @private
 */
function pickSeriesCell(
    series: LiveSeriesLike,
    columnName: string,
    xValue: ChartDataValue,
    isPie: boolean
): ExportCellValue {
    const points: LivePointLike[] = series.points || [];

    if (isPie) {
        const point: LivePointLike | undefined = findPointByX( points, xValue );

        return point ? toCell(point.y) : null;
    }

    /*
     * Histogram points contain the calculated bin frequency.
     */
    if (isHistogramSeries(series)) {
        const point: LivePointLike | undefined =
            findPointByX( points, xValue );

        if (!point) {
            return null;
        }

        return toCell( point.yValue !== undefined ? point.yValue : point.y );
    }

    const source: ChartDataRecord[] | null = pickDataSource(series);

    const record: ChartDataRecord | undefined = source ? findRecordByX( source, series.xField || 'x', xValue ) : undefined;

    if ( isPrimaryValueColumn( series, columnName )) {
        if (record) {
            return toCell( getRecordValue( record, series.yField || 'y' ) as ChartDataValue );
        }

        const point: LivePointLike | undefined = findPointByX( points, xValue );

        return point ? toCell( point.yValue !== undefined  ? point.yValue : point.y ) : null;
    }

    if ( columnName === 'size' && record ) {
        const sizeField: string = series.sizeField || 'size';

        return toCell( getRecordValue(record, sizeField) as ChartDataValue );
    }

    /*
   * Specialized values are resolved from the source record first.
   * If the source value is unavailable, fall back to the rendered point.
   */
    if ( record && getRecordValue(record, columnName) !== undefined ) {
        return toCell( getRecordValue(record, columnName) as ChartDataValue );
    }

    let point: LivePointLike | undefined = findPointByX( points, xValue );

    /*
    * Box-and-Whisker statistics are stored in the rendered points.
    * For a category axis, point.xValue can be a numeric category index,
    * so use the corresponding source-record index as a fallback.
    */
    if ( !point && isBoxAndWhiskerSeries(series) && source &&  record ) {
        const recordIndex: number =
            source.indexOf(record);

        if (recordIndex >= 0) {
            point =
                points.find(
                    (
                        currentPoint: LivePointLike
                    ): boolean => currentPoint.index === recordIndex ) || getArrayValue(points, recordIndex);
        }
    }

    if (!point) {
        return null;
    }

    return toCell(
        getPointValue(point, columnName) as ChartDataValue
    );
}

/**
 * Determines whether a column represents the primary Y-value.
 *
 * @param {LiveSeriesLike} series - Source series.
 * @param {string} columnName - Runtime field name.
 * @returns {boolean} Whether the column is the primary value column.
 *
 * @private
 */
function isPrimaryValueColumn(
    series: LiveSeriesLike,
    columnName: string
): boolean {
    return ( columnName === 'y' || columnName === 'Value' || columnName === series.yField );
}

/**
 * Finds a runtime data record by X-value.
 *
 * @param {ChartDataRecord[]} records - Runtime data records.
 * @param {string} xField - X-field name.
 * @param {ChartDataValue} xValue - X-value to locate.
 * @returns {ChartDataRecord | undefined} Matching record.
 *
 * @private
 */
function findRecordByX(
    records: ChartDataRecord[],
    xField: string,
    xValue: ChartDataValue
): ChartDataRecord | undefined {
    return records.find(
        (
            record: ChartDataRecord
        ): boolean =>
            areDataValuesEqual(
                getRecordValue(record, xField) as ChartDataValue,
                xValue
            )
    );
}

/**
 * Finds a resolved point by X-value.
 *
 * @param {LivePointLike[]} points - Resolved points.
 * @param {ChartDataValue} xValue - X-value to locate.
 * @returns {LivePointLike | undefined} Matching point.
 *
 * @private
 */
function findPointByX(
    points: LivePointLike[],
    xValue: ChartDataValue
): LivePointLike | undefined {
    return points.find(( point: LivePointLike ): boolean =>
        areDataValuesEqual(getPointX(point), xValue)
    );
}

/**
 * Returns the resolved X-value for a point.
 *
 * @param {LivePointLike} point - Resolved point.
 * @returns {ChartDataValue} Point X-value.
 *
 * @private
 */
function getPointX( point: LivePointLike ): ChartDataValue {
    return point.xValue !== undefined ? point.xValue : point.x;
}

/**
 * Compares two Chart data values.
 *
 * Object.is handles primitive values, NaN, and identical Date or
 * object references. Date instances with the same timestamp are also
 * considered equal.
 *
 * @param {ChartDataValue} first - First value.
 * @param {ChartDataValue} second - Second value.
 * @returns {boolean} Whether the values are equal.
 *
 * @private
 */
function areDataValuesEqual( first: ChartDataValue, second: ChartDataValue ): boolean {
    if ( first instanceof Date && second instanceof Date ) {
        return first.getTime() === second.getTime();
    }

    return Object.is( first, second );
}

/* ------------------------------------------------------------------------- *
 * Cell and CSV utilities
 * ------------------------------------------------------------------------- */

/**
 * Converts a runtime Chart value into a normalized spreadsheet value.
 *
 * @param {ChartDataValue} value - Runtime Chart value.
 * @returns {ExportCellValue} Normalized spreadsheet value.
 *
 * @private
 */
function toCell( value: ChartDataValue ): ExportCellValue {
    if ( value === null || value === undefined ) {
        return null;
    }

    if (typeof value === 'number') {
        return Number.isNaN(value) ? 'NaN' : Number.isFinite(value) ? value : null;
    }

    if (typeof value === 'string') {
        return value;
    }

    if (typeof value === 'boolean') {
        return value ? 'true' : 'false';
    }

    if (value instanceof Date) {
        return new Date(value.getTime() - value.getTimezoneOffset() * 60000).toISOString().split('T')[0];
    }

    if (typeof value === 'bigint') {
        return value.toString();
    }

    if (Array.isArray(value)) {
        if (value.length === 0) {
            return null;
        }

        if (value.length === 1) {
            return toCell( value[0] );
        }

        return value.map( ( item: ChartDataScalar ): string =>  formatScalarValue(item) ) .join(',');
    }

    return null;
}

/**
 * Converts a scalar Chart value into text.
 *
 * @param {ChartDataScalar} value - Scalar Chart value.
 * @returns {string} Text representation.
 *
 * @private
 */
function formatScalarValue( value: ChartDataScalar ): string {
    if ( value === null || value === undefined ) {
        return '';
    }

    if (value instanceof Date) {
        return new Date(value.getTime() - value.getTimezoneOffset() * 60000).toISOString().split('T')[0];
    }

    if (typeof value === 'number') {
        return Number.isNaN(value) ? 'NaN' : Number.isFinite(value) ? String(value) : '';
    }

    return String(value);
}

/**
 * Characters that could cause spreadsheet formula evaluation.
 *
 * @private
 */
const FORMULA_LEAD: RegExp = /^[=+\-@\t\r]/;

/**
 * Converts a normalized cell value into an RFC-4180 CSV field.
 *
 * @param {ExportCellValue} value - Normalized cell value.
 * @returns {string} CSV field.
 *
 * @private
 */
function csvField( value: ExportCellValue ): string {
    if (value === null) {
        return '';
    }

    const text: string = String(value);
    const safeText: string = typeof value === 'string' && FORMULA_LEAD.test(text) ? `'${text}` : text;
    return /[",\r\n]/.test(safeText) ? quoteField(safeText) : safeText;
}

/**
 * Quotes an RFC-4180 CSV field and escapes embedded quotation marks.
 *
 * @param {string} value - CSV field value.
 * @returns {string} Quoted CSV field.
 *
 * @private
 */
function quoteField( value: string ): string {
    return `"${value.replace( /"/g, '""' )}"`;
}

/**
 * MIME type used when generating an XLSX Blob.
 *
 * @private
 */
const XLSX_MIME: BlobSaveType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

/**
 * Cell style accepted by the Excel export runtime.
 *
 * @private
 */
interface IWorkbookCellStyle {
    bold: boolean;
    hAlign: HAlignType;
    vAlign: VAlignType;
    wrapText: boolean;
}

/**
 * Workbook cell descriptor.
 *
 * @private
 */
interface IWorkbookCell {
    index: number;
    value: ExportCellValue;
    colSpan?: number;
    rowSpan?: number;
    style?: IWorkbookCellStyle;
}

/**
 * Workbook row descriptor.
 *
 * @private
 */
interface IWorkbookRow {
    index: number;
    cells: IWorkbookCell[];
}

/**
 * Workbook column descriptor.
 *
 * @private
 */
interface IWorkbookColumn {
    index: number;
    width: number;
}

/**
 * Workbook worksheet descriptor.
 *
 * @private
 */
interface IWorkbookWorksheet {
    name: string;
    columns: IWorkbookColumn[];
    rows: IWorkbookRow[];
}

/**
 * Workbook JSON payload accepted by the Excel export runtime.
 *
 * @private
 */
interface IWorkbookPayload {
    worksheets: IWorkbookWorksheet[];
}

/**
 * Result returned by Workbook.saveAsBlob().
 *
 * @private
 */
interface IWorkbookBlobResult {
    blobData: Blob;
}

/**
 * Shared style applied to:
 *
 * - The Chart title
 * - Worksheet headers
 * - Category-column cells
 *
 * The trailing whitespace in `center ` matches the HAlignType
 * declaration provided by the installed Excel export package.
 *
 * @private
 */
const TITLE_HEADER_CATEGORY_STYLE: IWorkbookCellStyle = {
    bold: true,
    hAlign: 'center' as HAlignType,
    vAlign: 'center',
    wrapText: true
};

/**
 * Builds the JSON payload consumed by Workbook.
 *
 * Layout:
 *
 * - Optional title row spanning every exported column
 * - Optional grouped series-header row
 * - Styled value-header row
 * - Styled category-column cells
 * - Unstyled numeric value cells
 *
 * @param {ResolvedExportData} data - Normalized spreadsheet data.
 * @returns {IWorkbookPayload} Workbook JSON payload.
 *
 * @private
 */
function buildPayload(
    data: ResolvedExportData
): IWorkbookPayload {
    const columnCount: number =
        Math.max(
            data.headers.length,
            1
        );

    const columns: IWorkbookColumn[] = [];

    for (
        let columnIndex: number = 0;
        columnIndex < columnCount;
        columnIndex++
    ) {
        columns.push({
            index: columnIndex + 1,
            width: 100
        });
    }

    const rows: IWorkbookRow[] = [];
    let rowIndex: number = 1;

    /*
     * Add the optional Chart or PieChart title row.
     */
    if (data.title) {
        const titleCell: IWorkbookCell = {
            index: 1,
            value: data.title,
            colSpan: columnCount,
            style:
                TITLE_HEADER_CATEGORY_STYLE
        };

        rows.push({
            index: rowIndex++,
            cells: [
                titleCell
            ]
        });
    }

    const hasGroupedHeaders: boolean =
        Boolean(
            data.headerGroups &&
            data.headerGroups.length > 0
        );

    if (hasGroupedHeaders) {
        /*
         * First header row:
         *
         * Category | Seattle      | Miami
         *
         * Category spans two rows. Each series name spans the
         * number of specialized value columns belonging to it.
         */
        const groupCells: IWorkbookCell[] = [
            {
                index: 1,
                value:
                    getArrayValue(data.headers, 0) ||
                    'Category',
                rowSpan: 2,
                style:
                    TITLE_HEADER_CATEGORY_STYLE
            }
        ];

        for (
            const group of data.headerGroups || []
        ) {
            const groupCell: IWorkbookCell = {
                /*
                 * startColumn is zero-based in the normalized
                 * export model. Workbook indexes are one-based.
                 */
                index:
                    group.startColumn + 1,
                value:
                    group.title,
                style:
                    TITLE_HEADER_CATEGORY_STYLE
            };

            if (group.columnSpan > 1) {
                groupCell.colSpan =
                    group.columnSpan;
            }

            groupCells.push(
                groupCell
            );
        }

        rows.push({
            index: rowIndex++,
            cells: groupCells
        });

        /*
         * Second header row:
         *
         *          | high | low | high | low
         *
         * The Category cell is omitted because the first-row
         * Category cell already spans both header rows.
         */
        const valueHeaderCells: IWorkbookCell[] = [];

        for (
            let columnIndex: number = 1;
            columnIndex < data.headers.length;
            columnIndex++
        ) {
            valueHeaderCells.push({
                index:
                    columnIndex + 1,
                value:
                    data.headers.slice(columnIndex, columnIndex + 1)[0] as string,
                style:
                    TITLE_HEADER_CATEGORY_STYLE
            });
        }

        rows.push({
            index: rowIndex++,
            cells:
                valueHeaderCells
        });
    } else {
        /*
         * Standard single-row header used by ordinary series,
         * PieChart, and other non-grouped exports.
         */
        const headerCells: IWorkbookCell[] =
            data.headers.map(
                (
                    header: string,
                    columnIndex: number
                ): IWorkbookCell => ({
                    index:
                        columnIndex + 1,
                    value:
                        header,
                    style:
                        TITLE_HEADER_CATEGORY_STYLE
                })
            );

        rows.push({
            index: rowIndex++,
            cells:
                headerCells
        });
    }

    /*
     * Add all normalized data rows.
     *
     * Only the category column receives the shared bold and
     * centered style. Numeric value cells remain unstyled.
     */
    for (const dataRow of data.rows) {
        const cells: IWorkbookCell[] =
            dataRow.map(
                (
                    value: ExportCellValue,
                    columnIndex: number
                ): IWorkbookCell => {
                    if (columnIndex === 0) {
                        return {
                            index:
                                columnIndex + 1,
                            value,
                            style:
                                TITLE_HEADER_CATEGORY_STYLE
                        };
                    }

                    const shouldRightAlign: boolean = value === 'NaN' || (getArrayValue(
                        data.headers, columnIndex ) === 'outliers' && typeof value === 'string' && value.includes(','));

                    return {
                        index: columnIndex + 1,
                        value,
                        style: shouldRightAlign
                            ? {
                                bold: false,
                                hAlign: 'right' as HAlignType,
                                vAlign: 'center',
                                wrapText: true
                            }
                            : undefined
                    };
                }
            );
        rows.push({ index: rowIndex++, cells });
    }

    const worksheet: IWorkbookWorksheet = { name: 'Chart Data', columns, rows };
    return { worksheets: [ worksheet ]
    };
}
/**
 * Generates an XLSX Blob from normalized Chart export data.
 *
 * @param {ResolvedExportData} data - Normalized spreadsheet data.
 * @returns {Promise<Blob>} Generated XLSX Blob.
 * @private
 */
export function createXlsxExportBlob(
    data: ResolvedExportData
): Promise<Blob> {
    const payload: IWorkbookPayload = buildPayload(data);
    const workbook: Workbook = new Workbook( payload, 'xlsx' );
    return workbook .saveAsBlob(XLSX_MIME)
        .then(
            ( result: IWorkbookBlobResult ):
            Blob => result.blobData
        );
}

/* ------------------------------------------------------------------------- *
 * Browser download and headless-environment helpers
 * ------------------------------------------------------------------------- */

/**
 * Determines whether the current runtime supports browser downloads.
 *
 * @returns {boolean} Whether the browser download APIs are available.
 * @private
 */
export function isBrowserDownloadSafe(): boolean {
    return (
        typeof window !== 'undefined' &&
        typeof document !== 'undefined' &&
        typeof URL !== 'undefined' &&
        typeof URL.createObjectURL ===
        'function' &&
        typeof Blob !== 'undefined'
    );
}

/**
 * Determines whether the current runtime is Headless Chrome.
 *
 * @param {string} userAgent - Optional user-agent override.
 * @returns {boolean} Whether the runtime is Headless Chrome.
 * @private
 */
export function isHeadlessChrome( userAgent?: string ): boolean {
    const resolvedUserAgent: string =
        userAgent ??
        (
            typeof navigator !== 'undefined'
                ? navigator.userAgent || ''
                : ''
        );

    return resolvedUserAgent.includes(
        'HeadlessChrome'
    );
}

/**
 * Triggers a browser download for the supplied Blob.
 *
 * When `isDownload` is false, the object URL is still created and
 * revoked to preserve the existing headless-export behavior.
 *
 * @param {Blob} blob - File content.
 * @param {string} fileName - Filename including extension.
 * @param {boolean} isDownload - Whether to click the download link.
 * @returns {boolean} Whether the browser download path was processed.
 * @private
 */
export function triggerBrowserDownload( blob: Blob, fileName: string, isDownload: boolean = true ): boolean {
    if (!isBrowserDownloadSafe()) {
        return false;
    }

    const url: string =
        URL.createObjectURL(blob);

    try {
        if (isDownload) {
            const anchor:
            HTMLAnchorElement =
                document.createElement('a');

            anchor.href = url;
            anchor.download = fileName;
            anchor.style.display = 'none';

            document.body.appendChild(anchor);

            try {
                anchor.click();
            } finally {
                anchor.remove();
            }
        }

        return true;
    } finally {
        URL.revokeObjectURL(url);
    }
}

/**
 * Determines whether a series data source is a DataManager.
 *
 * @param {ChartDataRecord[] | DataManager | null | undefined} value
 * Series data source.
 *
 * @returns {boolean}
 * Whether the value is a DataManager instance.
 *
 * @private
 */
export function isDataManager( value: | ChartDataRecord[] | DataManager | null | undefined ): value is DataManager {
    return value instanceof DataManager;
}
