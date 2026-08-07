import {
    PdfDocument,
    PdfGrid,
    PdfStandardFont,
    PdfFontFamily,
    PdfFontStyle,
    PdfStringFormat,
    PdfTextAlignment,
    PdfSolidBrush,
    PdfColor,
    PdfGridCellStyle,
    PdfPaddings,
    PdfVerticalAlignment,
    PdfSection,
    PdfGridCell,
    PdfGridColumn,
    PdfGridRow,
    PdfTextWebLink,
    PdfPage,
    PdfBitmap,
    RectangleF,
    PdfHorizontalOverflowType,
    SizeF,
    PdfPageSettings,
    PdfPageOrientation,
    PdfPageTemplateElement,
    PdfPen,
    PdfPageNumberField,
    PdfPageCountField,
    PdfCompositeField,
    PointF,
    PdfGridLayoutFormat,
    PdfLayoutType,
    PdfLayoutBreakType
} from '@syncfusion/pdf-export';
import { ColumnProps } from '../types/column.interfaces';
import { GroupedData } from '../types/grouping.interfaces';
import { PdfExportSettings, PdfExportResult, PdfCellCustomizeArgs, PdfFooter, PdfHeader, PdfHeaderFooterContent, PdfPosition, PdfContentStyle, PdfPoints, PdfSize } from '../types/pdf-export.interfaces';

// PDF Page Size Constants
const PDF_PAGE_SIZE_A3: string = 'A3';
const PDF_PAGE_SIZE_A4: string = 'A4';
const PDF_PAGE_SIZE_A5: string = 'A5';
const PDF_PAGE_SIZE_LETTER: string = 'Letter';
const PDF_PAGE_SIZE_LEGAL: string = 'Legal';
const PDF_PAGE_SIZE_TABLOID: string = 'Tabloid';

// PDF Page Orientation Constants
const PDF_ORIENTATION_LANDSCAPE: string = 'Landscape';

// PDF Text Alignment Constants
const PDF_ALIGN_RIGHT: string = 'Right';
const PDF_ALIGN_CENTER: string = 'Center';
const PDF_ALIGN_JUSTIFY: string = 'Justify';

// PDF Vertical Alignment Constants
const PDF_VALIGN_MIDDLE: string = 'Middle';
const PDF_VALIGN_BOTTOM: string = 'Bottom';

// PDF Font Constants
const PDF_FONT_FAMILY: PdfFontFamily = PdfFontFamily.Helvetica;
const PDF_HEADER_FONT_SIZE: number = 11;
const PDF_CELL_FONT_SIZE: number = 9.75;
const PDF_CELL_PADDING: number = 5;
const PDF_CELL_PADDING_V: number = 2;
const PDF_COLUMN_WIDTH_DEFAULT: number = 100;
const PDF_PAGE_MARGIN: number = 10;

// PDF Color Constants
const PDF_COLOR_HEADER_BG: [number, number, number] = [240, 240, 240];
const PDF_COLOR_TEXT_BLACK: [number, number, number] = [0, 0, 0];
const PDF_COLOR_LINK_BLUE: [number, number, number] = [51, 102, 187];

// PDF Text Placeholder Constants
const PDF_DEFAULT_FILENAME: string = 'Grid.pdf';

/**
 * Converts column width string or number to numeric pixel value for PDF export.
 * Handles percentage strings (e.g., '20%'), pixel strings (e.g., '150px'), and numeric values.
 * Percentage values are converted based on A4 page width (595 points).
 *
 * @param {number | string} width - Column width value (number, percentage, or pixel string)
 * @returns {number} Converted width in points for PDF rendering
 *
 * @example
 * ```typescript
 * convertColumnWidth(100) // Returns 100
 * convertColumnWidth('20%') // Returns 119 (20% of 595)
 * convertColumnWidth('150px') // Returns 150
 * ```
 */
function convertColumnWidth(width: number | string): number {
    if (typeof width === 'number') {
        return width;
    }

    const widthStr: string = String(width).trim();

    // Handle percentage values (e.g., '20%')
    if (widthStr.endsWith('%')) {
        const percentage: number = parseFloat(widthStr);
        if (!isNaN(percentage)) {
            // Default A4 page width is 595 points
            const pageWidth: number = 595;
            return (percentage / 100) * pageWidth;
        }
    }

    // Handle pixel values (e.g., '150px') or plain numbers as strings (e.g., '150')
    const numericValue: number = parseFloat(widthStr);
    if (!isNaN(numericValue)) {
        return numericValue;
    }

    // Default fallback width
    return 100;
}

/**
 * Formats cell value based on column data type.
 *
 * @param {unknown} value - The cell value to format
 * @param {ColumnProps} column - The column definition
 * @returns {string} Formatted cell value
 */
function formatCellValue(value: unknown, column: ColumnProps): string {
    if (value === null || value === undefined) {
        return '';
    }

    // Handle date formatting
    if (column.type === 'date' && value instanceof Date) {
        return value.toLocaleDateString();
    }

    // Handle number formatting
    if (column.type === 'number' && typeof value === 'number') {
        if (column.format === 'C2' || column.format === 'C') {
            return `$${value.toFixed(2)}`;
        }
        return value.toString();
    }

    // Handle boolean
    if (column.type === 'checkbox' || typeof value === 'boolean') {
        return value ? 'Yes' : 'No';
    }

    // Default: convert to string
    return String(value);
}

/**
 * Renders header or footer content items on a PDF template element.
 * Supports text, lines, images, and page numbers with positioning and styling.
 *
 * @param {PdfPageTemplateElement} element - The template element to render content on
 * @param {PdfHeaderFooterContent[]} contents - Array of content items to render
 * @returns {void}
 * @private
 */
function renderHeaderFooterContents(
    element: PdfPageTemplateElement,
    contents: PdfHeaderFooterContent[]
): void {
    for (const content of contents) {
        if (!content || !content.type) { continue; }

        switch (content.type) {
        case 'Text':
            renderHeaderFooterText(element, content);
            break;
        case 'Line':
            renderHeaderFooterLine(element, content);
            break;
        case 'Image':
            renderHeaderFooterImage(element, content);
            break;
        case 'PageNumber':
            renderHeaderFooterPageNumber(element, content);
            break;
        }
    }
}

/**
 * Renders a text content item in PDF header/footer.
 *
 * @param {PdfPageTemplateElement} element - The template element to render content on
 * @param {PdfHeaderFooterTextContent} content - Text content to render
 * @returns {void}
 * @private
 */
function renderHeaderFooterText(element: PdfPageTemplateElement, content: PdfHeaderFooterContent): void {
    const position: PdfPosition = content.position || { x: 0, y: 0 };
    const style: PdfContentStyle = content.style || {};
    const fontSize: number = style.fontSize || 11;
    const bold: boolean = style.bold || false;
    const italic: boolean = style.italic || false;

    let fontStyle: PdfFontStyle = PdfFontStyle.Regular;
    if (bold) { fontStyle |= PdfFontStyle.Bold; }
    if (italic) { fontStyle |= PdfFontStyle.Italic; }

    const font: PdfStandardFont = new PdfStandardFont(PDF_FONT_FAMILY, fontSize, fontStyle);
    const brush: PdfSolidBrush = style.textBrushColor
        ? new PdfSolidBrush(new PdfColor(style.textBrushColor[0], style.textBrushColor[1], style.textBrushColor[2]))
        : new PdfSolidBrush(new PdfColor(PDF_COLOR_TEXT_BLACK[0], PDF_COLOR_TEXT_BLACK[1], PDF_COLOR_TEXT_BLACK[2]));

    let alignment: PdfTextAlignment = PdfTextAlignment.Left;
    if (style.hAlign === 'Center') { alignment = PdfTextAlignment.Center; }
    else if (style.hAlign === 'Right') { alignment = PdfTextAlignment.Right; }

    const format: PdfStringFormat = new PdfStringFormat(alignment, PdfVerticalAlignment.Top);
    element.graphics.drawString(content.value || '', font, new PdfPen(new PdfColor(0, 0, 0)), brush, position.x, position.y, format);
}

/**
 * Renders a line content item in PDF header/footer.
 *
 * @param {PdfPageTemplateElement} element - The template element to render content on
 * @param {PdfHeaderFooterLineContent} content - Line content to render
 * @returns {void}
 * @private
 */
function renderHeaderFooterLine(element: PdfPageTemplateElement, content: PdfHeaderFooterContent): void {
    const points: PdfPoints = content.points || { x1: 0, y1: 0, x2: 100, y2: 0 };
    const style: PdfContentStyle = content.style || {};
    const penSize: number = style.penSize || 1;
    const penColor: string | [number, number, number] = style.penColor || '#000000';

    let color: PdfColor;
    if (typeof penColor === 'string') {
        // Parse hex color
        const hex: string = penColor.replace('#', '');
        const r: number = parseInt(hex.substring(0, 2), 16);
        const g: number = parseInt(hex.substring(2, 4), 16);
        const b: number = parseInt(hex.substring(4, 6), 16);
        color = new PdfColor(r, g, b);
    } else if (Array.isArray(penColor)) {
        color = new PdfColor(penColor[0], penColor[1], penColor[2]);
    } else {
        color = new PdfColor(0, 0, 0);
    }

    const pen: PdfPen = new PdfPen(color, penSize);

    // Handle dash style
    if (style.dashStyle === 'Dot') {
        pen.dashStyle = 2; // PdfDashStyle.Dot
    } else if (style.dashStyle === 'Dash') {
        pen.dashStyle = 1; // PdfDashStyle.Dash
    } else if (style.dashStyle === 'DashDot') {
        pen.dashStyle = 3; // PdfDashStyle.DashDot
    } else if (style.dashStyle === 'DashDotDot') {
        pen.dashStyle = 4; // PdfDashStyle.DashDotDot
    }

    element.graphics.drawLine(pen, points.x1, points.y1, points.x2, points.y2);
}

/**
 * Renders an image content item in PDF header/footer.
 *
 * @param {PdfPageTemplateElement} element - The template element to render content on
 * @param {PdfHeaderFooterImageContent} content - Image content to render
 * @returns {void}
 * @private
 */
function renderHeaderFooterImage(element: PdfPageTemplateElement, content: PdfHeaderFooterContent): void {
    const position: PdfPosition = content.position || { x: 0, y: 0 };
    const size: PdfSize | undefined = content.size;

    try {
        // Image rendering via PdfBitmap (supports base64 or URL depending on environment)
        if (typeof PdfBitmap === 'function') {
            const image: PdfBitmap = new PdfBitmap(content.src);
            if (size && size.width && size.height) {
                element.graphics.drawImage(image, position.x, position.y, size.width, size.height);
            } else {
                element.graphics.drawImage(image, position.x, position.y);
            }
        }
    } catch (error) {
        // Silently fail if image cannot be loaded
    }
}

/**
 * Renders a page number content item in PDF header/footer.
 *
 * @param {PdfPageTemplateElement} element - The template element to render content on
 * @param {PdfHeaderFooterPageNumberContent} content - Page number content to render
 * @returns {void}
 * @private
 */
function renderHeaderFooterPageNumber(element: PdfPageTemplateElement, content: PdfHeaderFooterContent): void {
    const position: PdfPosition = content.position || { x: 0, y: 0 };
    const style: PdfContentStyle = content.style || {};
    const fontSize: number = style.fontSize || 11;
    const format: string = content.format || 'Page {$current}';

    const brush: PdfSolidBrush = style.textBrushColor
        ? new PdfSolidBrush(new PdfColor(style.textBrushColor[0], style.textBrushColor[1], style.textBrushColor[2]))
        : new PdfSolidBrush(new PdfColor(...PDF_COLOR_TEXT_BLACK));

    const font: PdfStandardFont = new PdfStandardFont(PDF_FONT_FAMILY, fontSize, PdfFontStyle.Regular);

    let alignment: PdfTextAlignment = PdfTextAlignment.Left;
    if (style.hAlign === 'Center') { alignment = PdfTextAlignment.Center; }
    else if (style.hAlign === 'Right') { alignment = PdfTextAlignment.Right; }

    const stringFormat: PdfStringFormat = new PdfStringFormat(alignment, PdfVerticalAlignment.Top);

    // Create page number field
    const pageNumber: PdfPageNumberField = new PdfPageNumberField(font, brush);

    // Parse format string
    const currentPlaceholder: string = '{$current}';
    const totalPlaceholder: string = '{$total}';
    const hasCurrent: boolean = format.indexOf(currentPlaceholder) !== -1;
    const hasTotal: boolean = format.indexOf(totalPlaceholder) !== -1;

    if (hasCurrent && hasTotal) {
        const pageCount: PdfPageCountField = new PdfPageCountField(font, brush);
        let compositeFormat: string = format;
        const currentIndex: number = compositeFormat.indexOf(currentPlaceholder);
        const totalIndex: number = compositeFormat.indexOf(totalPlaceholder);

        if (currentIndex < totalIndex) {
            compositeFormat = compositeFormat.replace(currentPlaceholder, '{0}').replace(totalPlaceholder, '{1}');
            const compositeField: PdfCompositeField = new PdfCompositeField(font, brush, compositeFormat, pageNumber, pageCount);
            compositeField.stringFormat = stringFormat;
            compositeField.draw(element.graphics, new PointF(position.x, position.y));
        } else {
            compositeFormat = compositeFormat.replace(totalPlaceholder, '{0}').replace(currentPlaceholder, '{1}');
            const compositeField: PdfCompositeField = new PdfCompositeField(font, brush, compositeFormat, pageCount, pageNumber);
            compositeField.stringFormat = stringFormat;
            compositeField.draw(element.graphics, new PointF(position.x, position.y));
        }
    } else if (hasCurrent) {
        const compositeFormat: string = format.replace(currentPlaceholder, '{0}');
        const compositeField: PdfCompositeField = new PdfCompositeField(font, brush, compositeFormat, pageNumber);
        compositeField.stringFormat = stringFormat;
        compositeField.draw(element.graphics, new PointF(position.x, position.y));
    } else if (hasTotal) {
        const pageCount: PdfPageCountField = new PdfPageCountField(font, brush);
        const compositeFormat: string = format.replace(totalPlaceholder, '{0}');
        const compositeField: PdfCompositeField = new PdfCompositeField(font, brush, compositeFormat, pageCount);
        compositeField.stringFormat = stringFormat;
        compositeField.draw(element.graphics, new PointF(position.x, position.y));
    } else {
        // No placeholders, just draw static text
        element.graphics.drawString(format, font, new PdfPen(new PdfColor(0, 0, 0)), brush, position.x, position.y, stringFormat);
    }
}

/**
 * Builds PDF grid from grid columns and data.
 * Supports cell customization via onPdfCellCustomize callback for images, hyperlinks, and styling.
 * Columns should be pre-merged with any export customizations before passing to this function.
 *
 * @param {ColumnProps[]} columns - The grid columns (already merged with export customizations)
 * @param {unknown[]} dataSource - The grid data
 * @param {Function} [onPdfCellCustomize] - Optional callback for cell-level customization
 * @param {Object} [groupingSettings] - Optional grouping settings for grouped data export
 * @returns {PdfGrid} Configured PDF grid
 */
function buildPdfGrid(
    columns: ColumnProps[],
    dataSource: unknown[],
    onPdfCellCustomize?: (event: PdfCellCustomizeArgs) => void,
    groupingSettings?: { enabled: boolean; columns: string[]; captionFormat: 'verbose' | 'compact' }
): PdfGrid {
    const pdfGrid: PdfGrid = new PdfGrid();

    // Define columns in PDF grid
    pdfGrid.columns.add(columns.length);

    // Set grid-level cell padding (left, top, right, bottom) - this applies to all cells
    pdfGrid.style.cellPadding = new PdfPaddings(PDF_CELL_PADDING, PDF_CELL_PADDING_V, PDF_CELL_PADDING, PDF_CELL_PADDING_V);

    // Enable horizontal overflow for multi-page column rendering
    // When columns exceed page width, they automatically continue on next pages
    pdfGrid.style.allowHorizontalOverflow = true;
    pdfGrid.style.horizontalOverflowType = PdfHorizontalOverflowType.NextPage;

    // Set column widths and headers
    columns.forEach((column: ColumnProps, index: number) => {
        const pdfColumn: PdfGridColumn = pdfGrid.columns.getColumn(index);

        // Use column width if provided, otherwise default to 100
        // Column width already includes any export customizations merged in pdf-export-service
        const width: number = column.width ? convertColumnWidth(column.width) : PDF_COLUMN_WIDTH_DEFAULT;
        pdfColumn.width = width;

        // Add header
        if (!pdfGrid.headers.count) {
            pdfGrid.headers.add(1);
        }

        const headerCell: PdfGridCell = pdfGrid.headers.getHeader(0).cells.getCell(index);
        headerCell.value = column.headerText || column.field || '';

        // Apply header styling with padding and alignment
        const headerStyle: PdfGridCellStyle = new PdfGridCellStyle();
        headerStyle.backgroundBrush = new PdfSolidBrush(new PdfColor(...PDF_COLOR_HEADER_BG));
        headerStyle.font = new PdfStandardFont(PDF_FONT_FAMILY, PDF_HEADER_FONT_SIZE, PdfFontStyle.Bold);
        headerStyle.textBrush = new PdfSolidBrush(new PdfColor(...PDF_COLOR_TEXT_BLACK));

        // Apply header text alignment - create format with proper alignment and vertical alignment
        let headerAlignment: PdfTextAlignment = PdfTextAlignment.Left;
        if (column.textAlign === PDF_ALIGN_RIGHT || column.type === 'number') {
            headerAlignment = PdfTextAlignment.Right;
        } else if (column.textAlign === PDF_ALIGN_CENTER) {
            headerAlignment = PdfTextAlignment.Center;
        }
        headerStyle.stringFormat = new PdfStringFormat(headerAlignment, PdfVerticalAlignment.Middle);

        headerCell.style = headerStyle;
    });

    // Add data rows
    dataSource.forEach((row: unknown) => {
        const pdfRow: PdfGridRow = pdfGrid.rows.addRow();
        const rowRecord: Record<string, unknown> = row as Record<string, unknown>;
        const isGroupHeader: boolean = groupingSettings?.enabled && typeof row === 'object' && row !== null && 'items' in row && 'count' in row;
        const groupLevel: number = isGroupHeader ? ((row as GroupedData).flattedLevel ? (row as GroupedData).flattedLevel! - 1 : 0) : 0;
        const groupIndex: number = isGroupHeader ? ((row as GroupedData).flattedLevel ? (row as GroupedData).flattedLevel! - 1 : 0) : -1;
        const groupColSpan: number = isGroupHeader ? columns.length - groupIndex : 1;

        columns.forEach((column: ColumnProps, index: number) => {
            if (isGroupHeader && index > groupIndex && index < groupIndex + groupColSpan) {
                return;
            }

            const fieldValue: string = column.field as string;
            let cellValue: unknown = '';
            let displayValue: string | number | boolean = '';
            const cell: PdfGridCell = pdfRow.cells.getCell(index);
            const cellEvent: PdfCellCustomizeArgs = {
                data: rowRecord as unknown,
                column: column,
                value: displayValue,
                image: undefined,
                hyperLink: undefined,
                style: undefined,
                isGroupHeader,
                groupLevel,
                colSpan: isGroupHeader && index === groupIndex ? groupColSpan : undefined
            };

            if (isGroupHeader) {
                if (index === groupIndex) {
                    const groupedRow: GroupedData = row as GroupedData;
                    const groupField: string | undefined = groupingSettings?.columns?.[groupedRow.flattedLevel ?
                        groupedRow.flattedLevel - 1 : 0];
                    const captionFormat: 'verbose' | 'compact' = groupingSettings?.captionFormat || 'compact';
                    const captionText: string = captionFormat === 'verbose' && groupField
                        ? `${groupField}: ${groupedRow.key} - ${groupedRow.count} items`
                        : `${groupedRow.key} (${groupedRow.count})`;
                    cellValue = captionText;
                    displayValue = captionText;
                    cellEvent.value = captionText;
                } else {
                    cellValue = '';
                    displayValue = '';
                    cellEvent.value = '';
                }
            } else {
                cellValue = rowRecord?.[fieldValue as string] ?? '';
                displayValue = formatCellValue(cellValue, column);
                cellEvent.value = displayValue;
            }

            // Call onPdfCellCustomize callback if provided for cell-level customization
            if (onPdfCellCustomize) {
                onPdfCellCustomize(cellEvent);
            }

            if (isGroupHeader && index === groupIndex) {
                const spanSize: number = cellEvent.colSpan && cellEvent.colSpan > 0 ? cellEvent.colSpan : groupColSpan;
                if (spanSize > 1) {
                    cell.columnSpan = spanSize;
                }
            }

            // Handle hyperlink rendering
            if (cellEvent.hyperLink) {
                const textLink: PdfTextWebLink = new PdfTextWebLink();
                textLink.url = cellEvent.hyperLink.target;
                textLink.text = cellEvent.hyperLink.displayText || String(cellEvent.value);
                textLink.font = new PdfStandardFont(PDF_FONT_FAMILY, PDF_CELL_FONT_SIZE);
                textLink.brush = new PdfSolidBrush(new PdfColor(...PDF_COLOR_LINK_BLUE)); // Blue color for links
                cell.value = textLink;
            }
            // Default: set cell value (which may have been customized by callback)
            else {
                cell.value = cellEvent.value;
            }

            // Apply cell styling with text alignment
            const cellStyle: PdfGridCellStyle = new PdfGridCellStyle();

            if (isGroupHeader) {
                cellStyle.backgroundBrush = new PdfSolidBrush(new PdfColor(...PDF_COLOR_HEADER_BG));
                cellStyle.font = new PdfStandardFont(PDF_FONT_FAMILY, PDF_HEADER_FONT_SIZE, PdfFontStyle.Bold);
                cellStyle.textBrush = new PdfSolidBrush(new PdfColor(...PDF_COLOR_TEXT_BLACK));
                cellStyle.stringFormat = new PdfStringFormat(PdfTextAlignment.Left, PdfVerticalAlignment.Middle);
            }

            // Apply custom style from callback if provided
            if (cellEvent.style) {
                // Background color
                if (cellEvent.style.backgroundColor) {
                    const [r, g, b] = cellEvent.style.backgroundColor;
                    cellStyle.backgroundBrush = new PdfSolidBrush(new PdfColor(r, g, b));
                }

                // Text color (brush)
                if (cellEvent.style.textBrushColor) {
                    const [r, g, b] = cellEvent.style.textBrushColor;
                    cellStyle.textBrush = new PdfSolidBrush(new PdfColor(r, g, b));
                }

                // Font styling
                let fontStyle: PdfFontStyle = PdfFontStyle.Regular;
                if (cellEvent.style.bold) {
                    fontStyle |= PdfFontStyle.Bold;
                }
                if (cellEvent.style.italic) {
                    fontStyle |= PdfFontStyle.Italic;
                }
                if (cellEvent.style.underline) {
                    fontStyle |= PdfFontStyle.Underline;
                }
                if (cellEvent.style.strikethrough) {
                    fontStyle |= PdfFontStyle.Strikeout;
                }

                const fontSize: number = cellEvent.style.fontSize || PDF_CELL_FONT_SIZE;
                cellStyle.font = new PdfStandardFont(PDF_FONT_FAMILY, fontSize, fontStyle);

                // Text alignment
                let textAlignment: PdfTextAlignment = PdfTextAlignment.Left;
                if (cellEvent.style.textAlignment === PDF_ALIGN_CENTER) {
                    textAlignment = PdfTextAlignment.Center;
                } else if (cellEvent.style.textAlignment === PDF_ALIGN_RIGHT) {
                    textAlignment = PdfTextAlignment.Right;
                } else if (cellEvent.style.textAlignment === PDF_ALIGN_JUSTIFY) {
                    textAlignment = PdfTextAlignment.Justify;
                }

                // Vertical alignment
                let verticalAlignment: PdfVerticalAlignment = PdfVerticalAlignment.Top;
                if (cellEvent.style.verticalAlignment === PDF_VALIGN_MIDDLE) {
                    verticalAlignment = PdfVerticalAlignment.Middle;
                } else if (cellEvent.style.verticalAlignment === PDF_VALIGN_BOTTOM) {
                    verticalAlignment = PdfVerticalAlignment.Bottom;
                }

                cellStyle.stringFormat = new PdfStringFormat(textAlignment, verticalAlignment);
            } else if (!isGroupHeader) {
                // Default styling: Set cell text alignment based on column type
                let cellAlignment: PdfTextAlignment = PdfTextAlignment.Left;
                if (column.textAlign === PDF_ALIGN_RIGHT || column.type === 'number') {
                    cellAlignment = PdfTextAlignment.Right;
                } else if (column.textAlign === PDF_ALIGN_CENTER) {
                    cellAlignment = PdfTextAlignment.Center;
                }
                cellStyle.stringFormat = new PdfStringFormat(cellAlignment, PdfVerticalAlignment.Middle);
            }

            cell.style = cellStyle;
        });
    });

    return pdfGrid;
}

/**
 * Converts page size string to SizeF object.
 *
 * @param {string} pageSize - Page size name (A3, A4, A5, Letter, Legal, Tabloid)
 * @returns {SizeF} Page size in points
 */
function getPageSize(pageSize: string): SizeF {
    const pageSizeMap: Record<string, { width: number; height: number }> = {
        [PDF_PAGE_SIZE_A3]: { width: 842, height: 1190 },
        [PDF_PAGE_SIZE_A4]: { width: 595, height: 842 },
        [PDF_PAGE_SIZE_A5]: { width: 421, height: 595 },
        [PDF_PAGE_SIZE_LETTER]: { width: 612, height: 792 },
        [PDF_PAGE_SIZE_LEGAL]: { width: 612, height: 1008 },
        [PDF_PAGE_SIZE_TABLOID]: { width: 792, height: 1224 }
    };

    const size: { width: number; height: number; } = pageSizeMap[pageSize as string] || pageSizeMap[PDF_PAGE_SIZE_A4 as string];
    return new SizeF(size.width, size.height);
}

/**
 * Executes PDF export strategy using EJ2 PdfExport.
 * Supports cell customization via onPdfCellCustomize callback.
 *
 * @template T - The type of data records
 * @param {T[]} dataSource - The data to export
 * @param {ColumnProps[]} columns - The grid columns
 * @param {PdfExportSettings} config - The PDF export configuration
 * @returns {Promise<PdfExportResult>} PDF export result
 */
async function executePdfExportStrategy<T>(
    dataSource: T[],
    columns: ColumnProps[],
    config: PdfExportSettings<T>
): Promise<PdfExportResult> {
    try {
        // Create PDF document
        const pdfDocument: PdfDocument = new PdfDocument();

        // Add section to document
        pdfDocument.sections.add();

        // Get section from collection - section property contains array of PdfSection
        // After adding one section, it's at index 0
        const section: PdfSection = pdfDocument.sections.section[0];

        // Configure page settings (orientation and size)
        const pageSettings: PdfPageSettings = new PdfPageSettings();
        pageSettings.orientation = (config.pageOrientation === PDF_ORIENTATION_LANDSCAPE)
            ? PdfPageOrientation.Landscape
            : PdfPageOrientation.Portrait;
        pageSettings.size = getPageSize(config.pageSize || PDF_PAGE_SIZE_A4);

        // Apply page settings to section
        section.setPageSettings(pageSettings);

        // Determine header configuration - support both new header/footer objects and legacy formats
        const headerConfig: PdfHeader = config.header;
        const footerConfig: PdfFooter = config.footer;

        // Configure header
        if (headerConfig) {
            const headerBounds: RectangleF = new RectangleF(
                PDF_PAGE_MARGIN,
                headerConfig.fromTop ?? PDF_PAGE_MARGIN,
                section.pageSettings.width - (PDF_PAGE_MARGIN * 2),
                headerConfig.height
            );
            const headerElement: PdfPageTemplateElement = new PdfPageTemplateElement(headerBounds);
            renderHeaderFooterContents(headerElement, headerConfig.contents);
            section.template.top = headerElement;
        }

        // Configure footer
        if (footerConfig) {
            const footerBounds: RectangleF = new RectangleF(
                PDF_PAGE_MARGIN,
                section.pageSettings.height - (footerConfig.fromBottom ?? 0) - footerConfig.height,
                section.pageSettings.width - (PDF_PAGE_MARGIN * 2),
                footerConfig.height
            );
            const footerElement: PdfPageTemplateElement = new PdfPageTemplateElement(footerBounds);
            renderHeaderFooterContents(footerElement, footerConfig.contents);
            section.template.bottom = footerElement;
        }

        // Add page to section
        const page: PdfPage = section.pages.add();

        // Build PDF grid with cell customization callback
        // Columns already contain merged export customizations
        const pdfGrid: PdfGrid = buildPdfGrid(
            columns,
            dataSource,
            config.onPdfCellCustomize,
            (config as PdfExportSettings<T> & { groupingSettings?: { enabled: boolean; columns: string[]; captionFormat: 'verbose' | 'compact' } }).groupingSettings
        );

        // Create layout format for pagination (handles column overflow onto next pages)
        const layoutFormat: PdfGridLayoutFormat = new PdfGridLayoutFormat();
        layoutFormat.layout = PdfLayoutType.Paginate;
        layoutFormat.break = PdfLayoutBreakType.FitPage;

        // Use the page client area directly; getClientSize() already excludes page margins and header/footer template regions
        const pageClientSize: SizeF = page.getClientSize();
        const gridWidth: number = pageClientSize.width;
        const availableHeight: number = pageClientSize.height;

        layoutFormat.paginateBounds = new RectangleF(0, 0, gridWidth, availableHeight);

        const yPosition: number = 0;
        pdfGrid.draw(page, 0, yPosition, layoutFormat);

        const fileName: string = config.fileName || PDF_DEFAULT_FILENAME;
        let blobPromise: Promise<{ blobData: Blob }> | undefined;

        if (config.isBlob === true) {
            blobPromise = pdfDocument.save() as Promise<{ blobData: Blob }>;
            const result: { blobData: Blob } = await blobPromise;
            return {
                success: true,
                promise: Promise.resolve(result)
            };
        }

        pdfDocument.save(fileName);

        return {
            success: true
        };
    } catch (error) {
        return {
            success: false,
            ...(error && { error })
        };
    }
}

/**
 * Manages PDF export window lifecycle and generation.
 *
 * @private
 * @template T - The type of data being exported
 * @param {T[]} dataSource - The data to export
 * @param {ColumnProps[]} columns - The grid columns
 * @param {PdfExportSettings} config - The PDF export configuration
 * @param {Object} [groupingSettings] - Optional grouping settings for grouped data export
 * @returns {Promise<PdfExportResult>} PDF export result
 */
export async function pdfWindowManager<T>(
    dataSource: T[],
    columns: ColumnProps[],
    config: PdfExportSettings<T>,
    groupingSettings?: { enabled: boolean; columns: string[]; captionFormat: 'verbose' | 'compact' }
): Promise<PdfExportResult> {
    try {
        // Execute PDF export
        return await executePdfExportStrategy(dataSource, columns, { ...config, groupingSettings } as PdfExportSettings<T>);
    } catch (error) {
        return {
            success: false,
            ...(error && { error })
        };
    }
}
