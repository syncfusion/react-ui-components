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
    PdfPage,
    PdfTextWebLink,
    PdfGridLayoutFormat,
    PdfLayoutType,
    PdfLayoutBreakType,
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
    PointF
} from '@syncfusion/pdf-export';
import { ColumnProps } from '../types/column.interfaces';
import { PdfExportSettings, PdfExportResult, PdfQueryCellInfoEvent } from '../types/pdf-export.interfaces';

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
const PDF_FOOTER_FONT_SIZE: number = 9;
const PDF_CELL_PADDING: number = 5;
const PDF_CELL_PADDING_V: number = 2;
const PDF_COLUMN_WIDTH_DEFAULT: number = 100;
const PDF_PAGE_MARGIN: number = 10;
const PDF_HEADER_POSITION_Y: number = 50;
const PDF_INITIAL_POSITION_Y: number = 10;

// PDF Color Constants
const PDF_COLOR_HEADER_BG: [number, number, number] = [240, 240, 240];
const PDF_COLOR_TEXT_BLACK: [number, number, number] = [0, 0, 0];
const PDF_COLOR_LINK_BLUE: [number, number, number] = [51, 102, 187];
const PDF_COLOR_ROW_EVEN: [number, number, number] = [255, 255, 255];
const PDF_COLOR_ROW_ODD: [number, number, number] = [248, 248, 248];
const PDF_COLOR_FOOTER_TEXT: [number, number, number] = [100, 100, 100];

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
 * Builds PDF grid from grid columns and data.
 * Supports cell customization via onPdfQueryCellInfo callback for images, hyperlinks, and styling.
 * Columns should be pre-merged with any export customizations before passing to this function.
 *
 * @param {ColumnProps[]} columns - The grid columns (already merged with export customizations)
 * @param {unknown[]} dataSource - The grid data
 * @param {Function} [onPdfQueryCellInfo] - Optional callback for cell-level customization
 * @returns {PdfGrid} Configured PDF grid
 */
function buildPdfGrid(
    columns: ColumnProps[],
    dataSource: unknown[],
    onPdfQueryCellInfo?: (event: PdfQueryCellInfoEvent) => void
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

        columns.forEach((column: ColumnProps, index: number) => {
            const rowRecord: Record<string, unknown> = row as Record<string, unknown>;
            const fieldValue: string = column.field as string;
            const cellValue: unknown = rowRecord?.[fieldValue as string] ?? '';
            const displayValue: string | number | boolean = formatCellValue(cellValue, column);
            const cell: PdfGridCell = pdfRow.cells.getCell(index);

            // Create event object for cell customization callback
            const cellEvent: PdfQueryCellInfoEvent = {
                data: rowRecord as unknown,
                column: column,
                value: displayValue,
                image: undefined,
                hyperLink: undefined,
                style: undefined
            };

            // Call onPdfQueryCellInfo callback if provided for cell-level customization
            if (onPdfQueryCellInfo) {
                onPdfQueryCellInfo(cellEvent);
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
            } else {
                // Default styling: Set cell text alignment based on column type
                let cellAlignment: PdfTextAlignment = PdfTextAlignment.Left;
                if (column.textAlign === PDF_ALIGN_RIGHT || column.type === 'number') {
                    cellAlignment = PdfTextAlignment.Right;
                } else if (column.textAlign === PDF_ALIGN_CENTER) {
                    cellAlignment = PdfTextAlignment.Center;
                }
                cellStyle.stringFormat = new PdfStringFormat(cellAlignment, PdfVerticalAlignment.Middle);

                // Apply alternating row colors for better readability (only if no custom background)
                if (index % 2 === 0) {
                    cellStyle.backgroundBrush = new PdfSolidBrush(new PdfColor(...PDF_COLOR_ROW_EVEN));
                } else {
                    cellStyle.backgroundBrush = new PdfSolidBrush(new PdfColor(...PDF_COLOR_ROW_ODD));
                }
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
 * Supports cell customization via onPdfQueryCellInfo callback.
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

        // Configure header if headerText is provided
        if (config.headerText) {
            const headerBounds: RectangleF = new RectangleF(PDF_PAGE_MARGIN, PDF_PAGE_MARGIN, section.pageSettings.width -
                (PDF_PAGE_MARGIN * 2), 30);
            const headerElement: PdfPageTemplateElement = new PdfPageTemplateElement(headerBounds);

            const headerBrush: PdfSolidBrush = new PdfSolidBrush(new PdfColor(...PDF_COLOR_TEXT_BLACK));
            const headerPen: PdfPen = new PdfPen(new PdfColor(...PDF_COLOR_TEXT_BLACK));
            const headerFont: PdfStandardFont = new PdfStandardFont(PDF_FONT_FAMILY, PDF_HEADER_FONT_SIZE, PdfFontStyle.Bold);
            const headerFormat: PdfStringFormat = new PdfStringFormat(PdfTextAlignment.Left, PdfVerticalAlignment.Top);

            headerElement.graphics.drawString(config.headerText, headerFont, headerPen, headerBrush, 0, 5, headerFormat);
            section.template.top = headerElement;
        }

        // Configure footer if footerText is provided
        if (config.footerText) {
            const footerBounds: RectangleF = new RectangleF(PDF_PAGE_MARGIN, section.pageSettings.height - 30, section.pageSettings.width -
                (PDF_PAGE_MARGIN * 2), 20);
            const footerElement: PdfPageTemplateElement = new PdfPageTemplateElement(footerBounds);

            const footerBrush: PdfSolidBrush = new PdfSolidBrush(new PdfColor(...PDF_COLOR_FOOTER_TEXT));
            const footerPen: PdfPen = new PdfPen(new PdfColor(...PDF_COLOR_FOOTER_TEXT));
            const footerFont: PdfStandardFont = new PdfStandardFont(PDF_FONT_FAMILY, PDF_FOOTER_FONT_SIZE);
            const footerStringFormat: PdfStringFormat = new PdfStringFormat(PdfTextAlignment.Center, PdfVerticalAlignment.Bottom);

            // Check if footer text contains page number placeholders
            const currentPlaceholder: string = '{$current}';
            const totalPlaceholder: string = '{$total}';
            const hasCurrent: boolean = config.footerText.indexOf(currentPlaceholder) !== -1;
            const hasTotal: boolean = config.footerText.indexOf(totalPlaceholder) !== -1;

            if (hasCurrent && hasTotal) {
                // Use PdfCompositeField for dynamic page numbers with both current and total
                const pageNumber: PdfPageNumberField = new PdfPageNumberField(footerFont, footerBrush);
                const pageCount: PdfPageCountField = new PdfPageCountField(footerFont, footerBrush);

                // Determine format string: replace {$current} with {0} and {$total} with {1} or {0} depending on order
                let format: string = config.footerText;
                const currentIndex: number = format.indexOf(currentPlaceholder);
                const totalIndex: number = format.indexOf(totalPlaceholder);

                if (currentIndex < totalIndex) {
                    format = format.replace(currentPlaceholder, '{0}').replace(totalPlaceholder, '{1}');
                    const compositeField: PdfCompositeField = new PdfCompositeField(footerFont, footerBrush, format, pageNumber, pageCount);
                    compositeField.stringFormat = footerStringFormat;
                    compositeField.draw(footerElement.graphics, new PointF(0, 0));
                } else {
                    format = format.replace(totalPlaceholder, '{0}').replace(currentPlaceholder, '{1}');
                    const compositeField: PdfCompositeField = new PdfCompositeField(footerFont, footerBrush, format, pageCount, pageNumber);
                    compositeField.stringFormat = footerStringFormat;
                    compositeField.draw(footerElement.graphics, new PointF(0, 0));
                }
            } else if (hasCurrent) {
                // Use PdfPageNumberField for current page only
                const pageNumber: PdfPageNumberField = new PdfPageNumberField(footerFont, footerBrush);
                const format: string = config.footerText.replace(currentPlaceholder, '{0}');
                const compositeField: PdfCompositeField = new PdfCompositeField(footerFont, footerBrush, format, pageNumber);
                compositeField.stringFormat = footerStringFormat;
                compositeField.draw(footerElement.graphics, new PointF(0, 0));
            } else if (hasTotal) {
                // Use PdfPageCountField for total pages only
                const pageCount: PdfPageCountField = new PdfPageCountField(footerFont, footerBrush);
                const format: string = config.footerText.replace(totalPlaceholder, '{0}');
                const compositeField: PdfCompositeField = new PdfCompositeField(footerFont, footerBrush, format, pageCount);
                compositeField.stringFormat = footerStringFormat;
                compositeField.draw(footerElement.graphics, new PointF(0, 0));
            } else {
                // No placeholders, just draw static text
                footerElement.graphics.drawString(config.footerText, footerFont, footerPen, footerBrush, 0, 0, footerStringFormat);
            }

            section.template.bottom = footerElement;
        }

        // Add page to section
        const page: PdfPage = section.pages.add();

        // Build PDF grid with cell customization callback
        // Columns already contain merged export customizations
        const pdfGrid: PdfGrid = buildPdfGrid(
            columns,
            dataSource,
            config.onPdfQueryCellInfo
        );

        // Create layout format for pagination (handles column overflow onto next pages)
        const layoutFormat: PdfGridLayoutFormat = new PdfGridLayoutFormat();
        layoutFormat.layout = PdfLayoutType.Paginate;
        layoutFormat.break = PdfLayoutBreakType.FitPage;

        // Set pagination bounds to fit within page margins
        const pageClientSize: SizeF = page.getClientSize();
        layoutFormat.paginateBounds = new RectangleF(0, 0, pageClientSize.width, pageClientSize.height);

        // Draw grid on page at position (10, 50) with pagination layout
        // Adjusted Y position to account for header space
        const yPosition: number = config.headerText ? PDF_HEADER_POSITION_Y : PDF_INITIAL_POSITION_Y;
        pdfGrid.draw(page, PDF_PAGE_MARGIN, yPosition, layoutFormat);

        // Save PDF file
        const fileName: string = config.fileName || PDF_DEFAULT_FILENAME;
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
 * @returns {Promise<PdfExportResult>} PDF export result
 */
export async function pdfWindowManager<T>(
    dataSource: T[],
    columns: ColumnProps[],
    config: PdfExportSettings<T>
): Promise<PdfExportResult> {
    try {
        // Execute PDF export
        return await executePdfExportStrategy(dataSource, columns, config);
    } catch (error) {
        return {
            success: false,
            ...(error && { error })
        };
    }
}
