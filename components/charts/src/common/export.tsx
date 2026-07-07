import { createElement } from '@syncfusion/react-base';
import { IPieChart } from '../pie-chart';
import { IChart } from '../chart';
import { ExportType } from './enum';
import {
    PdfDocument, PdfBitmap, PdfPageOrientation, PdfStandardFont, PdfSolidBrush, PdfColor, PdfPage,
    PdfPageTemplateElement, SizeF, PdfFontFamily, PdfStringFormat, PdfVerticalAlignment, PdfPen
} from '@syncfusion/pdf-export';

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
export function exportImage(
    chart: IPieChart | IChart,
    type: ExportType,
    fileName: string
): void {
    if (!chart.element) {
        return;
    }

    const controlValue: IControlValue = getControlValue(chart);
    const isDownload: boolean = !isHeadlessChrome();

    switch (type) {
    case 'SVG':
        exportSVG(controlValue, fileName, isDownload);
        break;
    case 'PNG':
    case 'JPG':
        exportPNG(controlValue, type as 'PNG' | 'JPG', fileName, isDownload);
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
 * Checks if the current environment is a headless browser (like Puppeteer).
 *
 * @returns {boolean} - Returns `true` when the current browser environment is Headless Chrome; otherwise, returns `false`.
 * @private
 */
function isHeadlessChrome(): boolean {
    const userAgent: string = navigator.userAgent || '';
    return userAgent.indexOf('HeadlessChrome') > -1;
}


/**
 * Exports the given chart as a PDF document.
 *
 * This method generates a PDF representation of the chart by converting its
 * SVG content into an image and embedding it into a PDF document. The exported
 * PDF uses the provided file name with the `.pdf` extension automatically appended.
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
    if (!chart.element) { return; }
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
        document.save(fileName + '.pdf'); document.destroy();
    };
    image.onerror = () => {
        window.URL.revokeObjectURL(url);
    };
    image.src = url;
}
