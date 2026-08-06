import { Workbook, Row, Cells, Cell, Column as ExcelColumn, CellStyle, HyperLink, HAlignType, VAlignType, Worksheet, Border } from '@syncfusion/excel-export';
import { isNullOrUndefined, type DateFormatOptions, type NumberFormatOptions } from '@syncfusion/react-base';
import type {
    ExcelExportSettings,
    ExcelBeforeExportEvent,
    ExcelAfterExportEvent,
    UseGridExcelExportOptions,
    ExcelGroupingSettings,
    ExportCell,
    WorkbookWithWorksheetImages,
    ExcelImage,
    ExcelCellCustomizeArgs,
    ExcelHyperlink,
    LibraryImage
} from '../types/excel-export.interfaces';
import type { ExcelHeaderFooterRow } from '../types/excel-export.interfaces';
import type { GridRef } from '../types/grid.interfaces';
import type { IRow, ICell, UseDataResult, ValueType } from '../types/interfaces';
import type { ColumnProps } from '../types/column.interfaces';
import type { GroupedData } from '../types/grouping.interfaces';
import { AggregateColumnProps } from '../types/aggregate.interfaces';
import { getGroupLayoutFlattedData, isGroupedData } from '../utils/utils';

// Builds an image payload for worksheet embedding.
function handleImageCell(args: ExcelCellCustomizeArgs, row: number, column: number): ExcelImage | null {
    if (!args.image) {return null; }

    const { base64, height, width } = args.image;
    if (!height || !width || height < 10 || width < 10) {return null; }
    if (!base64) {return null; }

    let base64Content: string = base64;
    if (base64.startsWith('data:image/')) {
        const parts: string[] = base64.split(',');
        if (parts.length === 2) {base64Content = parts[1]; }
    }

    if (!/^[A-Za-z0-9+/=]+$/.test(base64Content)) {return null; }

    const imageObj: ExcelImage = {
        image: base64Content,
        row,
        column,
        lastRow: row,
        lastColumn: column,
        height,
        width
    };

    return imageObj;
}

// Normalizes horizontal alignment values to Excel-compatible values.
function normalizeHAlign(value: string | undefined): HAlignType | undefined {
    const normalized: string = String(value)?.trim().toLowerCase();
    switch (normalized) {
    case 'center':
    case 'centre':
        return 'Center' as HAlignType;
    case 'left':
        return 'Left' as HAlignType;
    case 'right':
        return 'Right' as HAlignType;
    case 'justify':
        return 'Justify' as HAlignType;
    case 'general':
        return 'General' as HAlignType;
    default:
        return undefined;
    }
}

// Normalizes vertical alignment values to Excel-compatible values.
function normalizeVAlign(value: string | undefined): VAlignType | undefined {
    const normalized: string = String(value)?.trim().toLowerCase();
    switch (normalized) {
    case 'top':
        return 'top';
    case 'center':
        return 'center';
    case 'bottom':
        return 'bottom';
    default:
        return undefined;
    }
}

// Normalizes cell style properties for Excel export.
function normalizeCellStyle(style: CellStyle): CellStyle {
    if (style.hAlign) {
        const normalized: HAlignType | undefined = normalizeHAlign(String(style.hAlign));
        if (normalized) {
            style.hAlign = normalized;
        }
    }
    if (style.vAlign) {
        const normalized: VAlignType | undefined = normalizeVAlign(String(style.vAlign));
        if (normalized) {
            style.vAlign = normalized as VAlignType;
        }
    }
    return style;
}

// Validates data size against Excel export warning threshold.
function validateMaxRowsThreshold(config: ExcelExportSettings<unknown>, dataLength: number, enableDevMode: boolean): void {
    if (config.maxRowsWarningThreshold && dataLength > config.maxRowsWarningThreshold) {
        const message: string = `Excel export service: Data size (${dataLength} rows) exceeds warning threshold (${config.maxRowsWarningThreshold} rows).`;
        if (enableDevMode) {
            console.warn(message);
            return;
        }
    }
}

// Determines the appropriate Excel cell style type based on column type and value.
function getExportCellStyleType(column?: Record<string, unknown>, value?: unknown): string | undefined {
    const type: string = String(column?.type)?.toLowerCase();
    if (type === 'date' || type === 'datetime' || type === 'dateonly' || value instanceof Date) {
        return 'date';
    }
    return undefined;
}

// Converts a grid hyperlink into an Excel hyperlink.
function handleHyperlinkCell(args: ExcelCellCustomizeArgs): HyperLink | null {
    const link: ExcelHyperlink | undefined = args.hyperLink;
    if (!link || !link.target) {return null; }

    const target: string = link.target;
    const displayText: string | undefined = link.displayText;
    const encodedTarget: string = target.includes(' ') ? target.replace(/ /g, '%20') : target;
    const hyperlinkObj: Partial<HyperLink> = { target: encodedTarget, type: 'url' };
    if (displayText) {hyperlinkObj.display = displayText; }
    return hyperlinkObj as HyperLink;
}

// Tracks merged ranges for Excel export.
function handleCellSpanning(args: ExcelCellCustomizeArgs, mergedRanges: Set<string>): Record<string, number> {
    const spanConfig: Record<string, number> = {};
    const { rowIndex, colIndex, colSpan = 1, rowSpan = 1 } = args;
    if (colSpan < 1 || rowSpan < 1) {return spanConfig; }

    for (let r: number = rowIndex; r < rowIndex + rowSpan; r++) {
        for (let c: number = colIndex; c < colIndex + colSpan; c++) {
            const rangeKey: string = `${r}_${c}`;
            if (mergedRanges.has(rangeKey)) {return spanConfig; }
        }
    }

    for (let r: number = rowIndex; r < rowIndex + rowSpan; r++) {
        for (let c: number = colIndex; c < colIndex + colSpan; c++) {
            mergedRanges.add(`${r}_${c}`);
        }
    }

    if (colSpan > 1) {spanConfig.colSpan = colSpan; }
    if (rowSpan > 1) {spanConfig.rowSpan = rowSpan; }
    return spanConfig;
}

// Applies number and date formats from column settings.
function applyNumberFormatting(args: ExcelCellCustomizeArgs): string | null {
    if (args.numberFormat) { return args.numberFormat; }
    const { column } = args;
    if (!column?.format) { return null; }

    if (typeof column.format === 'object' && column.format !== null) {
        const formatObj: Record<string, unknown> = column.format as Record<string, unknown>;
        const explicitFormat: string | undefined = formatObj.format as string | undefined;
        if (explicitFormat) {
            const normalized: string = explicitFormat.toUpperCase();
            if (normalized.startsWith('C')) {
                const decimals: number = parseInt(normalized.slice(1), 10) || 2;
                return `$#,##0.${'0'.repeat(decimals)}`;
            }
            if (normalized.startsWith('P')) {
                const decimals: number = parseInt(normalized.slice(1), 10) || 0;
                return decimals > 0 ? `0.${'0'.repeat(decimals)}%` : '0%';
            }
            return explicitFormat;
        }
        return (formatObj.skeleton as string) ?? null;
    }

    if (typeof column.format === 'string') {
        const format: string = column.format.toUpperCase();
        if (format.startsWith('C')) {
            const decimals: number = parseInt(format.slice(1), 10) || 2;
            return `$#,##0.${'0'.repeat(decimals)}`;
        }
        if (format.startsWith('P')) {
            const decimals: number = parseInt(format.slice(1), 10) || 0;
            return decimals > 0 ? `0.${'0'.repeat(decimals)}%` : '0%';
        }
        return column.format;
    }

    return null;
}

// Removes vertical border styles from a cell style to avoid double borders in Excel export.
function removeVerticalBorderStyle(style: CellStyle): void {
    const borders: { left?: Border; right?: Border } = style?.borders as { left?: Border; right?: Border } | undefined;
    if (!borders) {
        return;
    }
    delete borders.left;
    delete borders.right;
}

// Retrieves the footer cell value based on the aggregate column configuration and row data.
function getFooterCellValue(cell: ICell<ColumnProps>, rowData: unknown): ValueType {
    if (!rowData || !cell.column) {return ''; }

    const aggregateColumn: AggregateColumnProps = cell.aggregateColumn;
    if (aggregateColumn?.columnName && typeof rowData === 'object' && rowData !== null) {
        const summaryValue: unknown = (rowData as Record<string, unknown>)[aggregateColumn.columnName];
        if (summaryValue && typeof summaryValue === 'object') {
            const types: string[] = Array.isArray(aggregateColumn.type) ? aggregateColumn.type as string[] :
                [aggregateColumn.type as string];
            for (let i: number = 0; i < types.length; i++) {
                const typeKey: string = types[i as number];
                if (!typeKey) {continue; }
                if (Object.prototype.hasOwnProperty.call(summaryValue as Record<string, unknown>, typeKey)) {
                    return (summaryValue as Record<string, unknown>)[typeKey as string] as ValueType;
                }
            }
            const keys: string[] = Object.keys(summaryValue as Record<string, unknown>);
            if (keys.length > 0) {
                return (summaryValue as Record<string, unknown>)[keys[0] as string] as ValueType;
            }
        }
    }

    const fieldValue: unknown = (rowData as Record<string, unknown>)[cell.column.field as string];
    return fieldValue !== undefined ? fieldValue as ValueType : '';
}

// Applies group header styling for grouped exports.
function handleGroupedData(args: ExcelCellCustomizeArgs, grouping?: ExcelGroupingSettings): Record<string, unknown> {
    const groupConfig: Record<string, unknown> = {};
    if (!grouping || !grouping.enabled) {return groupConfig; }
    const { isGroupHeader = false, groupLevel = 0 } = args;
    if (!isGroupHeader) {return groupConfig; }

    const style: CellStyle = new CellStyle();
    style.backColor = grouping.headerBackgroundColor ?? '#E8E8E8';
    style.bold = grouping.boldHeaders !== false;
    if (groupLevel > 0) {style.indent = groupLevel; }

    groupConfig.style = style;
    groupConfig.isGroupHeader = true;
    groupConfig.groupLevel = groupLevel;
    return groupConfig;
}

function normalizeExportData<T>(data: unknown): T[] {
    if (Array.isArray(data)) {
        return data as T[];
    }

    if (data && typeof data === 'object') {
        const dataResponse: Record<string, unknown> = data as Record<string, unknown>;
        const result: unknown = dataResponse.result;
        if (Array.isArray(result)) {
            return result as T[];
        }
    }

    return [];
}

function applyExportRange<T>(data: T[], settings: ExcelExportSettings<T>): T[] {
    if (settings.range === 'Custom' && settings.customRange) {
        return data.slice(settings.customRange.startRow, settings.customRange.endRow + 1);
    }

    return data;
}

// Resolves export data from the grid or from explicit settings.
async function extractData<T>(
    options: UseGridExcelExportOptions<T>,
    settings: ExcelExportSettings<T>
): Promise<T[]> {
    const grid: GridRef<T> = options.gridRef.current as GridRef<T>;
    const dataModule: UseDataResult<T> = grid.getDataModule() as UseDataResult<T>;
    const range: string = settings.range ?? 'All';
    const isAllPages: boolean = range !== 'CurrentPage';

    let allData: T[] | undefined;
    if (options.getAllData) {
        allData = await options.getAllData(
            dataModule.getStateEventArgument(dataModule.generateQuery())
        );
    }

    // Always use getData() to respect the isAllPages flag for proper range handling
    const resultData: unknown = await Promise.resolve(grid.getData(isAllPages, false, allData));

    let data: T[] = normalizeExportData<T>(resultData);
    data = applyExportRange<T>(data, settings);

    return data;
}

// Merges export-specific column overrides into the visible grid columns.
function mergeExportColumns<T>(
    gridColumns: ColumnProps<T>[],
    exportColumns?: Partial<ColumnProps<T>>[]
): ColumnProps<T>[] {
    if (!exportColumns) {
        return gridColumns;
    }

    const exportColumnMap: Map<string, Partial<ColumnProps<T>>> = new Map();

    exportColumns.forEach((col: Partial<ColumnProps<T>>) => {
        if (col.field) {
            exportColumnMap.set(col.field, col);
        }
    });

    return gridColumns.map((gridCol: ColumnProps<T>) => {
        const exportCol: Partial<ColumnProps<T>> | undefined = exportColumnMap.get(gridCol.field);
        return exportCol ? ({ ...gridCol, ...exportCol } as ColumnProps<T>) : gridCol;
    });
}

// Maps grid text alignment values to Excel alignment values.
function mapTextAlignToExcel(alignment?: string | unknown): string {
    if (!alignment) {return 'Left'; }

    const alignStr: string = String(alignment).toLowerCase();
    const alignMap: Record<string, string> = {
        'left': 'Left',
        'right': 'Right',
        'center': 'Center',
        'justify': 'Justify'
    };

    return alignMap[alignStr as keyof typeof alignMap] || 'Left';
}

// Parses column width from string or number, defaulting to 100 if invalid.
function parseColumnWidth(width?: string | number): number {
    if (!width) {return 100; }

    if (typeof width === 'number') {return width; }

    const parsed: number = parseInt(String(width).replace(/[^\d.-]/g, ''), 10);
    return isNaN(parsed) ? 100 : parsed;
}

// Exports grid data to an Excel workbook.
export async function excelExportService<T = Record<string, unknown>>(
    settings: ExcelExportSettings<T>,
    options?: UseGridExcelExportOptions<T>
): Promise<Blob> {
    const enableDevMode: boolean = options?.gridRef?.current?.enableDevMode ?? true;

    try {
        const { onExcelCellCustomize } = settings;

        const isGroupingEnabled: boolean = options?.gridRef?.current?.groupSettings?.enabled &&
            options?.gridRef?.current?.groupSettings?.columns?.length > 0;

        let grouping: ExcelGroupingSettings | undefined;
        if (isGroupingEnabled) {
            grouping = {
                enabled: true,
                groupByColumns: options.gridRef.current?.groupSettings?.columns ? [...options.gridRef.current.groupSettings.columns] : [],
                boldHeaders: true,
                headerBackgroundColor: '#E8E8E8'
            };
        }

        let data: T[] = [];
        // When grouping is enabled, always use extractData() to get the grouped structure from the grid.
        // Do NOT use settings.data directly as it's flat data without group information.
        if (isGroupingEnabled && options?.gridRef?.current) {
            data = await extractData(options, settings);
        } else if (!isNullOrUndefined(settings.data) && settings.data.length as number > 0) {
            data = normalizeExportData<T>(settings.data);
            data = applyExportRange<T>(data, settings);
        } else if (options?.gridRef?.current) {
            data = await extractData(options, settings);
        } else {
            data = [];
        }

        let columns: string[] = [];
        let columnMetadata: Record<string, {
            width: number;
            textAlign: string;
            headerTextAlign: string;
            headerText?: string;
            type?: string;
            format?: string | NumberFormatOptions | DateFormatOptions;
        }> = {};
        let visibleColumnsForEvent: ColumnProps<T>[] = [];

        if (options?.gridRef?.current) {
            let visibleColumns: ColumnProps<T>[] = options.gridRef.current.getVisibleColumns();

            const exportColumnOverrides: Partial<ColumnProps<T>>[] | undefined =
                settings.columns && settings.columns.length > 0 ? settings.columns : undefined;
            visibleColumns = mergeExportColumns(visibleColumns, exportColumnOverrides);

            visibleColumnsForEvent = [...visibleColumns];

            columns = visibleColumns
                .filter((col: ColumnProps<T>) => col.visible !== false && col.field)
                .map((col: ColumnProps<T>) => col.field as string);

            visibleColumns.forEach((col: ColumnProps<T>) => {
                if (col.field) {
                    columnMetadata[col.field] = {
                        width: parseColumnWidth(col.width),
                        textAlign: mapTextAlignToExcel(col.textAlign),
                        headerTextAlign: mapTextAlignToExcel(col.headerTextAlign || col.textAlign),
                        headerText: col.headerText,
                        type: col.type as string | undefined,
                        format: col.format
                    };
                }
            });
        } else {
            columns = settings.columns && settings.columns.length > 0
                ? (settings.columns.map((col: string | ColumnProps<T>) => typeof col === 'string' ? col : col.field) as string[])
                : data.length > 0 ? Object.keys(data[0] as Record<string, unknown>) : [];
        }

        if (settings.onBeforeExcelExport) {
            const beforeEvent: ExcelBeforeExportEvent<T> = {
                columns: visibleColumnsForEvent.length > 0 ? visibleColumnsForEvent : columns.map((col: string) =>
                    ({ field: col } as ColumnProps<T>)),
                dataSource: data,
                config: settings,
                cancel: false
            };

            settings.onBeforeExcelExport(beforeEvent);

            if (beforeEvent.cancel) {
                const cancelledError: Error = new Error('Excel export was canceled by onBeforeExcelExport callback.');
                if (enableDevMode) {
                    console.warn(cancelledError.message);
                }
                if (settings.onAfterExcelExport) {
                    settings.onAfterExcelExport({ config: settings, success: false, error: cancelledError });
                }
                return Promise.reject(cancelledError);
            }

            data = beforeEvent.dataSource ?? data;

            if (beforeEvent.columns && beforeEvent.columns.length > 0) {
                visibleColumnsForEvent = beforeEvent.columns;

                columns = beforeEvent.columns
                    .filter((col: ColumnProps) => col.visible !== false && col.field)
                    .map((col: ColumnProps) => col.field as string);

                columnMetadata = {};
                beforeEvent.columns.forEach((col: ColumnProps) => {
                    if (col.field) {
                        columnMetadata[col.field] = {
                            width: parseColumnWidth(col.width),
                            textAlign: mapTextAlignToExcel(col.textAlign),
                            headerTextAlign: mapTextAlignToExcel(col.headerTextAlign || col.textAlign),
                            headerText: col.headerText,
                            type: col.type as string | undefined,
                            format: col.format
                        };
                    }
                });
            }
        }

        if (data.length === 0) {
            if (settings.onAfterExcelExport) {settings.onAfterExcelExport({ config: settings, success: false, error: new Error('No data to export. Ensure data is non-empty or range resolves to rows.') }); }
            return Promise.reject('No data to export. Ensure data is non-empty or range resolves to rows.');
        }

        if (columns.length === 0) {
            if (settings.onAfterExcelExport) {settings.onAfterExcelExport({ config: settings, success: false, error: new Error('No columns available for export. Provide columns or non-empty data.') }); }
            return Promise.reject('No columns available for export. Provide columns or non-empty data.');
        }

        // Flatten grouped data for export, or use data as-is if not grouped
        let exportRowsData: Array<T | GroupedData<T>>;
        if (grouping) {
            // Use getGroupLayoutFlattedData directly to expand all groups for complete Excel export
            const flattenResult: any = getGroupLayoutFlattedData(
                data as GroupedData<T>[],
                () => true, // shouldExpandGroup: expand all groups
                options?.gridRef?.current?.groupSettings || {}, // groupSettings
                new Set(), // collapsedGroupKeys: empty to ensure all groups are expanded
                '' // parentKey
            );
            exportRowsData = flattenResult.currentViewData as Array<T | GroupedData<T>>;
        } else {
            exportRowsData = data as T[];
        }

        validateMaxRowsThreshold(settings, exportRowsData.length, enableDevMode);

        const rows: Row[] = [];
        const excelColumns: ExcelColumn[] = [];
        const images: ExcelImage[] = [];
        const mergedRanges: Set<string> = new Set<string>();

        // Track grouping outline levels for Excel expand/collapse functionality
        const rowOutlineLevels: Map<number, number> = new Map<number, number>();
        const groupingOutlineInfo: Array<{ startRow: number; endRow: number; level: number }> = [];

        columns.forEach((colName: string, idx: number) => {
            const meta: {
                width: number;
                textAlign: string;
                headerTextAlign: string;
                headerText?: string;
                type?: string;
                format?: string | NumberFormatOptions | DateFormatOptions;
            } = columnMetadata[colName as string];
            const excelCol: ExcelColumn = {
                index: idx + 1,   // 1-based
                width: meta?.width || 100  // Use grid width if available, else 100
            };
            excelColumns.push(excelCol);
        });

        let currentRowIndex: number = 1;
        if (settings.header?.rows && settings.header.rows.length > 0) {
            settings.header.rows.forEach((headerRow: ExcelHeaderFooterRow) => {
                const headerRowCells: ExportCell[] = headerRow.cells.map((cell: ExcelHeaderFooterRow['cells'][number], colIndex: number) => {
                    const cellStyle: CellStyle = normalizeCellStyle(cell.style ? Object.assign(new CellStyle(), cell.style) :
                        new CellStyle());
                    return {
                        index: colIndex + 1,
                        value: cell.value || '',
                        colSpan: cell.colSpan || 1,
                        rowSpan: 1,
                        style: cellStyle,
                        hyperlink: cell.hyperlink ? { target: cell.hyperlink.target, display: cell.hyperlink.displayText, type: 'url' } : undefined
                    };
                });
                const headerRowHeight: number = Math.max(
                    20,
                    ...headerRowCells.map((cell: ExportCell) => (cell.style?.fontSize ? Number(cell.style.fontSize) * 1.5 + 6 : 0))
                );
                const row: Row = new Row();
                const headerCellsCollection: Cells = new Cells();
                headerRowCells.forEach((cell: ExportCell) => headerCellsCollection.push(cell as Cell));
                row.index = currentRowIndex;
                row.cells = headerCellsCollection;
                row.height = headerRowHeight;
                rows.push(row);
                currentRowIndex++;
            });
        }

        const headerCells: ExportCell[] = columns.map((colName: string, colIndex: number) => {
            const meta: {
                width: number;
                textAlign: string;
                headerTextAlign: string;
                headerText?: string;
                type?: string;
                format?: string | NumberFormatOptions | DateFormatOptions;
            } = columnMetadata[colName as string];
            // Use meta.textAlign (same as data cells), convert to lowercase: 'Left' → 'left', 'Center' → 'center', 'Right' → 'right'
            const alignValue: string = (meta?.headerTextAlign || meta?.textAlign || 'Left').toLowerCase();
            const headerStyle: CellStyle = normalizeCellStyle(Object.assign(new CellStyle(), {
                bold: true,
                hAlign: normalizeHAlign(alignValue) as HAlignType
            }));

            return {
                index: colIndex + 1,   // 1-based
                value: meta?.headerText || colName,  // Use grid headerText if available, else field name
                colSpan: 1,
                rowSpan: 1,
                style: headerStyle
            };
        });
        const headerRowHeight: number = Math.max(
            20,
            ...headerCells.map((cell: ExportCell) => (cell.style?.fontSize ? Number(cell.style.fontSize) * 1.5 + 6 : 0))
        );
        const headerRowObj: Row = new Row();
        const headerCellsCollection: Cells = new Cells();
        headerCells.forEach((cell: ExportCell) => headerCellsCollection.push(cell as Cell));
        headerRowObj.index = currentRowIndex;
        headerRowObj.cells = headerCellsCollection;
        headerRowObj.height = headerRowHeight;
        rows.push(headerRowObj);
        currentRowIndex++;

        // Track the current group level for detail rows
        let currentGroupLevel: number = 0;

        for (let rowIndex: number = 0; rowIndex < exportRowsData.length; rowIndex++) {
            const item: T | GroupedData<T> = exportRowsData[rowIndex as number];
            const rowIdx: number = currentRowIndex + rowIndex;   // 1-based, offset by header row and custom headers
            const cells: ExportCell[] = [];
            let rowHeight: number = 20;
            const isGroupRow: boolean = isGroupedData<T>(item);
            const groupCaptionColSpan: number = isGroupRow ? columns.length : 1;

            // Track outline level for this row
            let outlineLevel: number = 0;
            if (isGroupRow && grouping?.enabled) {
                const groupedItem: GroupedData<T> = item as GroupedData<T>;
                outlineLevel = (groupedItem.flattedLevel ?? 1);
                currentGroupLevel = outlineLevel;  // Track group level for following detail rows
                rowOutlineLevels.set(rowIdx, outlineLevel);
            } else if (!isGroupRow && grouping?.enabled && currentGroupLevel > 0) {
                // Detail rows should have same outline level as their group header
                outlineLevel = currentGroupLevel;
                rowOutlineLevels.set(rowIdx, outlineLevel);
            }

            for (let colIndex: number = 0; colIndex < columns.length; colIndex++) {
                if (isGroupRow && colIndex > 0) {
                    continue;
                }

                const colName: string = columns[colIndex as number];
                const cellIdx: number = colIndex + 1;   // 1-based
                const meta: {
                    width: number;
                    textAlign: string;
                    headerTextAlign: string;
                    headerText?: string;
                    type?: string;
                    format?: string | NumberFormatOptions | DateFormatOptions;
                } = columnMetadata[colName as string];

                // Generate group caption based on format from groupSettings
                let cellValue: unknown;
                if (isGroupRow) {
                    const groupedItem: GroupedData<T> = item as GroupedData<T>;
                    const captionFormat: string = options?.gridRef?.current?.groupSettings?.captionFormat || 'compact';
                    const groupField: string = grouping?.groupByColumns?.[groupedItem.flattedLevel ? groupedItem.flattedLevel - 1 : 0];

                    if (captionFormat === 'verbose') {
                        cellValue = `${groupField}: ${groupedItem.key} - ${groupedItem.count} items`;
                    } else {
                        cellValue = `${groupedItem.key} (${groupedItem.count})`;
                    }
                } else {
                    cellValue = (item as Record<string, unknown>)[colName as string];
                }

                const cellArgs: ExcelCellCustomizeArgs = {
                    data: item as Record<string, unknown>,
                    value: cellValue as string | number | Date | null | undefined,
                    column: {
                        field: colName,
                        type: meta?.type,
                        format: meta?.format
                    },
                    rowIndex,
                    colIndex: isGroupRow ? 0 : colIndex,
                    isGroupHeader: isGroupRow,
                    groupLevel: isGroupRow ? (((item as GroupedData<T>).flattedLevel ?? 1) - 1) : 0,
                    colSpan: groupCaptionColSpan
                };

                if (onExcelCellCustomize) {
                    const result: unknown = onExcelCellCustomize(cellArgs as ExcelCellCustomizeArgs<T>);
                    if (result instanceof Promise) {
                        await result;
                    }
                }

                const cellStyle: CellStyle = new CellStyle();
                if (!isGroupRow && meta?.textAlign) {
                    cellStyle.hAlign = normalizeHAlign(meta.textAlign.toLowerCase()) as HAlignType;
                }
                if (cellArgs.style) {
                    Object.assign(cellStyle, cellArgs.style);
                }
                if (isGroupRow) {
                    cellStyle.hAlign = normalizeHAlign('left') as HAlignType;
                }
                normalizeCellStyle(cellStyle);

                const cell: ExportCell = {
                    value: cellArgs.value,
                    index: cellIdx,
                    colSpan: isGroupRow ? groupCaptionColSpan : 1,
                    rowSpan: 1,
                    style: cellStyle
                };

                if (!isGroupRow) {
                    const image: ExcelImage | null = handleImageCell(cellArgs, rowIdx, cellIdx);
                    if (image) {
                        images.push(image);
                        cell.value = '';
                        rowHeight = Math.max(rowHeight, image.height + 6);
                        excelColumns[colIndex as number].width = Math.max(excelColumns[colIndex as number].width, image.width + 6);
                    }

                    const hyperlinkData: HyperLink = handleHyperlinkCell(cellArgs);
                    if (hyperlinkData) {
                        cell.hyperlink = hyperlinkData;
                    }

                    const spanConfig: { colSpan?: number } = handleCellSpanning(cellArgs, mergedRanges);
                    if (spanConfig.colSpan && spanConfig.colSpan > 1) {
                        cell.colSpan = spanConfig.colSpan;
                    }

                    const numberFormat: string | undefined = applyNumberFormatting(cellArgs);
                    if (numberFormat) {
                        cellStyle.numberFormat = numberFormat;
                        const formatType: string | undefined = getExportCellStyleType(cellArgs.column, cellArgs.value);
                        if (formatType) {
                            cellStyle.type = formatType as unknown as string;
                        }
                    }
                }

                const groupConfig: { style?: CellStyle } = handleGroupedData(cellArgs, grouping);
                if (groupConfig.style) {
                    Object.assign(cellStyle, groupConfig.style);
                }

                cells.push(cell);
            }

            const dataRow: Row = new Row();
            const dataCellsCollection: Cells = new Cells();
            cells.forEach((cell: ExportCell) => dataCellsCollection.push(cell as Cell));
            dataRow.index = rowIdx;
            dataRow.cells = dataCellsCollection;
            dataRow.height = rowHeight;

            // Set Excel outline level for data rows ONLY (not caption rows) to enable expand/collapse functionality
            if (outlineLevel > 0 && grouping?.enabled && !isGroupRow) {
                dataRow.grouping = {
                    outlineLevel: outlineLevel,
                    isCollapsed: true,
                    isHidden: false
                };
                groupingOutlineInfo.push({
                    startRow: rowIdx,
                    endRow: rowIdx,
                    level: outlineLevel
                });
            }

            rows.push(dataRow);
        }

        if (options?.gridRef?.current?.getFooterRowsObject) {
            const footerRows: IRow<ColumnProps>[] = options.gridRef.current.getFooterRowsObject() as IRow<ColumnProps>[];
            const footerRowsData: IRow<ColumnProps>[] = footerRows.filter((row: IRow<ColumnProps>) => row.isAggregateRow &&
                row.cells?.length);
            for (let rowIndex: number = 0; rowIndex < footerRowsData.length; rowIndex++) {
                const rowObj: IRow<ColumnProps> = footerRowsData[rowIndex as number];
                const footerCells: ICell<ColumnProps>[] = rowObj.cells?.slice().sort((a: ICell<ColumnProps>, b: ICell<ColumnProps>) => {
                    const aIndex: number = typeof a.colIndex === 'number' ? a.colIndex : typeof a.index === 'number' ? a.index : 0;
                    const bIndex: number = typeof b.colIndex === 'number' ? b.colIndex : typeof b.index === 'number' ? b.index : 0;
                    return aIndex - bIndex;
                });
                const aggrCells: ExportCell[] = [];
                let aggrRowHeight: number = 20;

                footerCells?.forEach((cell: ICell<ColumnProps<unknown>>) => {
                    if (cell.isSpanned) {
                        return;
                    }

                    const cellStyle: CellStyle = normalizeCellStyle(Object.assign(new CellStyle(), {
                        hAlign: normalizeHAlign((cell.column?.textAlign || 'Left').toLowerCase()) as HAlignType
                    }));
                    cellStyle.backColor = '#F6F6F6';
                    removeVerticalBorderStyle(cellStyle);

                    const value: ValueType = getFooterCellValue(cell, rowObj.data) as ValueType;
                    aggrCells.push({
                        index: ((typeof cell.colIndex === 'number' ? cell.colIndex : typeof cell.index === 'number' ? cell.index : 0) + 1),
                        value,
                        colSpan: cell.colSpan && cell.colSpan > 0 ? cell.colSpan : 1,
                        rowSpan: cell.rowSpan && cell.rowSpan > 0 ? cell.rowSpan : 1,
                        style: cellStyle
                    });

                    if (cellStyle.fontSize) {
                        aggrRowHeight = Math.max(aggrRowHeight, Number(cellStyle.fontSize) * 1.5 + 6);
                    }
                });

                if (!aggrCells.length) {
                    continue;
                }

                const aggrRow: Row = new Row();
                const aggrCellsCollection: Cells = new Cells();
                aggrCells.forEach((cell: ExportCell) => aggrCellsCollection.push(cell as Cell));
                aggrRow.index = rows.length + 1;
                aggrRow.cells = aggrCellsCollection;
                aggrRow.height = aggrRowHeight;
                rows.push(aggrRow);
            }
        }

        if (settings.footer?.rows && settings.footer.rows.length > 0) {
            let footerRowIndex: number = rows.length + 1;
            settings.footer.rows.forEach((footerRow: ExcelHeaderFooterRow) => {
                const footerRowCells: ExportCell[] = footerRow.cells.map((cell: ExcelHeaderFooterRow['cells'][number], colIndex: number) => {
                    const cellStyle: CellStyle = normalizeCellStyle(cell.style ? Object.assign(new CellStyle(), cell.style) :
                        new CellStyle());
                    cellStyle.backColor = '#F6F6F6';
                    removeVerticalBorderStyle(cellStyle);
                    return {
                        index: colIndex + 1,
                        value: cell.value || '',
                        colSpan: cell.colSpan || 1,
                        rowSpan: 1,
                        style: cellStyle,
                        hyperlink: cell.hyperlink ? { target: cell.hyperlink.target, display: cell.hyperlink.displayText, type: 'url' } : undefined
                    } as ExportCell;
                });
                const footerRowHeight: number = Math.max(
                    20,
                    ...footerRowCells.map((cell: ExportCell) => (cell.style?.fontSize ? Number(cell.style.fontSize) * 1.5 + 6 : 0))
                );
                const footerExportRow: Row = new Row();
                const footerCellsCollection: Cells = new Cells();
                footerRowCells.forEach((cell: ExportCell) => footerCellsCollection.push(cell as Cell));
                footerExportRow.index = footerRowIndex;
                footerExportRow.cells = footerCellsCollection;
                footerExportRow.height = footerRowHeight;
                rows.push(footerExportRow);
                footerRowIndex++;
            });
        }

        const workbookData: { worksheets: { columns: ExcelColumn[]; rows: Row[] }[]; styles: CellStyle[] } = {
            worksheets: [{
                columns: excelColumns,
                rows
            }],
            styles: []
        };

        const workbook: Workbook = new Workbook(workbookData, 'xlsx');

        if (images.length > 0) {
            const workbookWithImages: WorkbookWithWorksheetImages = workbook as unknown as WorkbookWithWorksheetImages;
            const worksheets: Worksheet[] = workbookWithImages.worksheets as unknown as Worksheet[] | undefined;
            if (worksheets && worksheets[0]) {
                if (!worksheets[0].images) {
                    worksheets[0].images = [];
                }

                // Map our ExcelImage shape to the library's Image shape required by the workbook
                const mappedImages: LibraryImage[] = images.map((img: ExcelImage) => ({
                    image: img.image ?? img.base64 ?? '',
                    row: img.row ?? 0,
                    column: img.column ?? 0,
                    lastRow: img.lastRow ?? img.row ?? 0,
                    lastColumn: img.lastColumn ?? img.column ?? 0,
                    width: img.width ?? 0,
                    height: img.height ?? 0,
                    horizontalFlip: false,
                    verticalFlip: false,
                    rotation: 0,
                    lastRowOffset: 0,
                    lastColOffset: 0,
                    firstRowOffset: 0,
                    firstColumnOffset: 0
                } as unknown as LibraryImage));

                worksheets[0].images.push(...mappedImages);
            }
        }

        let blob: Blob;
        let blobPromise: Promise<{ blobData: Blob }> | undefined;

        // Determine export mode: Blob or Normal Download
        if (settings.isBlob === true) {
            // Blob mode: return blob for custom handling (upload, processing, etc.)
            blobPromise = workbook.saveAsBlob('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            const result: { blobData: Blob } = await blobPromise;
            blob = result.blobData;
        } else {
            // Normal mode: download file directly (default behavior)
            const fileName: string = settings.fileName || 'export';
            workbook.save(`${fileName}.xlsx`);
            // Create an empty blob as return value (not used in normal mode, but maintains consistent return type)
            blob = new Blob([], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        }

        if (settings.onAfterExcelExport) {
            const afterEvent: ExcelAfterExportEvent<T> = {
                config: settings,
                success: true,
                error: null,
                ...(blobPromise && { promise: blobPromise })
            };
            settings.onAfterExcelExport(afterEvent);
        }

        return blob;
    } catch (error) {
        if (settings.onAfterExcelExport) {
            const afterEvent: ExcelAfterExportEvent<T> = {
                config: settings,
                success: false,
                error: error instanceof Error ? error : new Error(String(error))
            };
            settings.onAfterExcelExport(afterEvent);
        }

        if (enableDevMode) {
            const errorObj: Error = error instanceof Error ? error : new Error(String(error));
            console.warn('Excel export failed:', errorObj);
        }

        throw new Error(`Excel export failed: ${error instanceof Error ? error.message : String(error)}`);
    }
}

export default excelExportService;
