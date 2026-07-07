import { useCallback, useRef, useEffect, RefObject, MouseEvent, KeyboardEvent, useMemo } from 'react';
import { closest } from '@syncfusion/react-base';
import { CellSelectionModel, CellPosition, CellRange, CellSelectEvent, CellSelectingEvent, CellDeselectEvent, CellDeselectingEvent, CellData, RowCellInfo, CellIdentifier } from '../types/cell-selection.interfaces';
import { SelectionSettings } from '../types/selection.interfaces';
import { GridRef } from '../types/grid.interfaces';
import { ColumnProps } from '../types/column.interfaces';
import { CellSelectionType, IRow, SelectionMode } from '../types';
import { getRowObjFromElement } from '../utils';

/**
 * Initializes cell selection module for the grid.
 * Manages selection state, event triggers, and user interactions.
 *
 * @template T - The grid data model type
 * @param {RefObject<GridRef<T>>} gridRef - Reference to the grid component
 * @param {T[]} currentViewData - Current view of grid data (accounting for paging/filtering)
 * @param {ColumnProps<T>[]} visibleColumns - List of visible columns
 * @param {SelectionSettings} selectionSettings - Selection configuration (includes cell selection settings)
 * @param {boolean} isSpannedColumns - Flag indicating if the grid has spanned columns
 * @returns {CellSelectionModel} The cell selection module with public API
 */
export const useCellSelection: <T>( gridRef: RefObject<GridRef<T>>, currentViewData: T[], visibleColumns: ColumnProps[],
    selectionSettings: SelectionSettings, isSpannedColumns: boolean ) => CellSelectionModel = <T>( gridRef: RefObject<GridRef<T>>,
    currentViewData: T[], visibleColumns: ColumnProps[], selectionSettings: SelectionSettings, isSpannedColumns: boolean ) :
CellSelectionModel => {
    const selectedCellsRef: RefObject<Set<string>> = useRef<Set<string>>(new Set());
    const activeCellRef: RefObject<CellPosition | null> = useRef<CellPosition | null>(null);
    const selectedRangesRef: RefObject<CellRange[]> = useRef<CellRange[]>([]);
    const rangeStartCellRef: RefObject<CellPosition | null> = useRef<CellPosition | null>(null);

    // Pagination detection refs for tracking page changes and selection clearing behavior
    const previousPageDataRef: RefObject<T[] | null> = useRef<T[] | null>(null);
    const hasNewSelectionWithoutCtrlRef: RefObject<boolean> = useRef<boolean>(false);

    // Consolidated UI/ref state to reduce the number of separate refs.
    // Stores document listeners, drag state, and temporary flags used during interactions.
    const uiRef: RefObject<{
        docMouseMove?: ((e: MouseEvent | Event) => void) | null;
        docMouseUp?: ((e: MouseEvent | Event) => void) | null;
        lastDragEnd?: string | null;
        skipClick?: boolean;
        selectStartPrevent?: ((e: Event) => void) | null;
        dragIsCtrlPressed?: boolean;
        isDragging?: boolean;
        dragStart?: CellPosition | null;
        // Auto-scroll state
        autoScrollRAF?: number | null;
        autoScrollActive?: boolean;
        lastPointerX?: number | null;
        lastPointerY?: number | null;
        // (horizontal auto-scroll removed)
    }> = useRef<{
        docMouseMove?: ((e: MouseEvent | Event) => void) | null;
        docMouseUp?: ((e: MouseEvent | Event) => void) | null;
        lastDragEnd?: string | null;
        skipClick?: boolean;
        selectStartPrevent?: ((e: Event) => void) | null;
        dragIsCtrlPressed?: boolean;
        isDragging?: boolean;
        dragStart?: CellPosition | null;
        autoScrollRAF: null,
        autoScrollActive: false,
        lastPointerX: null,
        lastPointerY: null
    }>({ skipClick: false, lastDragEnd: null, selectStartPrevent: null, dragIsCtrlPressed: false, isDragging: false, dragStart: null,
                autoScrollRAF: null, autoScrollActive: false, lastPointerX: null, lastPointerY: null });

    // ===============================
    // Helpers - Centralized Grid Utilities
    // ===============================

    const syntheticEvent: MouseEvent = { ctrlKey: false, shiftKey: false } as MouseEvent;

    /**
     * Memoized getter for primary key field name.
     * Centralizes access to the primary key field to avoid repeated calls to gridRef.
     */
    const getPrimaryKeyField: () => string = useCallback((): string => {
        const primaryKeyFields: string[] = gridRef.current?.getPrimaryKeyFieldNames?.();
        return primaryKeyFields?.[0];
    }, [gridRef]);

    /**
     * Determines if cell selection is using data-based persistent mode.
     * Since all cell selection now uses data-based mode only, this always returns true
     * if cell selection is enabled and a primary key column exists.
     */
    const isCellSelectionEnabled: () => boolean = useCallback((): boolean => {
        if (selectionSettings?.type !== 'Cell' || !selectionSettings?.enabled) { return false; }
        return getPrimaryKeyField().length > 0;
    }, [selectionSettings, getPrimaryKeyField]);

    //Parses a data-based cell key to extract rowKey and fieldName.
    // Data-based format: "primaryKeyValue:fieldName"
    const parseCellKeyData: (key: string) => CellIdentifier | null = useCallback((key: string): CellIdentifier | null => {
        const parts: string[] = key.split(':');
        if (parts.length !== 2) { return null; }
        return {
            rowKey: parts[0],
            fieldName: parts[1]
        };
    }, []);

    /**
     * Gets row data by row index using virtualized getRowsObject() pattern.
     * OPTIMIZED: Uses getRowsObject() which returns only virtualized rows (not all 100k rows).
     *
     * @param rowIndex - 0-based row index in current viewport
     * @returns Row data if found, undefined otherwise
     */
    const getRowDataByRowIndex: (rowIndex: number) => T | undefined = useCallback((rowIndex: number): T | undefined => {
        if (rowIndex < 0) { return undefined; }

        // First try: get from getRowsObject() (virtualized rows)
        const rowsObj: IRow<ColumnProps<T>>[] = gridRef.current?.getRowsObject?.();
        const rowObj: IRow<ColumnProps<T>> | undefined = rowsObj.find((r: IRow<ColumnProps<T>>) => r?.rowIndex === rowIndex);
        if (rowObj?.data) { return rowObj.data as T; }

        // Fallback: For rows outside viewport, use currentViewData (acceptable for non-UI paths)
        // This maintains backward compatibility for programmatic API calls
        const currentData: T[] = gridRef.current?.currentViewData;
        return currentData[rowIndex as number];
    }, [gridRef]);

    /**
     * Finds row index by primary key value using virtualized pattern.
     * OPTIMIZED: First checks getRowsObject() (virtualized rows), then falls back to linear search.
     */
    const findRowIndexByKey: (rowKeyValue: string | number) => number = useCallback((rowKeyValue: string | number): number => {
        const primaryKeyField: string = getPrimaryKeyField();

        // First try: search through virtualized rows only (typical 30-50 rows, not 100k)
        const rowsObj: IRow<ColumnProps<T>>[] = gridRef.current?.getRowsObject?.();
        for (const rowObj of rowsObj) {
            const key: string | number = String((rowObj?.data as T)[primaryKeyField as keyof T]);
            if (key === String(rowKeyValue)) {
                return rowObj?.rowIndex;
            }
        }

        // Fallback: linear search through all data for non-visible rows (acceptable for API)
        const currentData: T[] = gridRef.current?.currentViewData;
        for (let rowIndex: number = 0; rowIndex < currentData?.length; rowIndex++) {
            const rowData: T | undefined = currentData[rowIndex as number];
            if (rowData && String(rowData[primaryKeyField as keyof T]) === String(rowKeyValue)) {
                return rowIndex;
            }
        }
        return -1;
    }, [getPrimaryKeyField, gridRef]);

    // Finds column index by field name in visible columns.
    // Data-driven search without relying on position indexes.
    const findColumnIndexByField: (fieldName: string) => number = useCallback((fieldName: string): number => {
        return visibleColumns.findIndex((col: ColumnProps) => col.field === fieldName);
    }, [visibleColumns]);

    //Converts a data-based position (rowKey, fieldName) to CellPosition (rowIndex, columnIndex).
    // Data-driven conversion that searches for actual positions from data identifiers.
    const convertDataToPosition: (dataPos: CellIdentifier) => CellPosition = useCallback(
        (dataPos: CellIdentifier): CellPosition => {
            const rowIndex: number = findRowIndexByKey(dataPos.rowKey);
            const columnIndex: number = findColumnIndexByField(dataPos.fieldName);

            if (rowIndex >= 0 && columnIndex >= 0) {
                return { rowIndex, columnIndex };
            }
            return null;
        }, [findRowIndexByKey, findColumnIndexByField]);

    // Generates a cell key in data-based format: "primaryKeyValue:fieldName"
    // This format persists across paging, sorting, and filtering operations.
    const getCellKey: (rowIndex: number, columnIndex: number, rowData?: T) => string = useCallback(
        (_rowIndex: number, columnIndex: number, rowData?: T): string => {
            const primaryKeyField: string = getPrimaryKeyField();

            const column: ColumnProps | undefined = isSpannedColumns ?
                gridRef.current?.scrollModule?.virtualColumnInfo?.visibleHeaderColumns?.[columnIndex as number] :
                visibleColumns[columnIndex as number];

            if (primaryKeyField && column?.field && rowData) {
                const primaryKeyValue: unknown = rowData[primaryKeyField as keyof T];
                const fieldName: string = column.field;
                return `${primaryKeyValue}:${fieldName}`;
            }

            // Fallback: if primary key or data is missing, return empty key
            // This should not happen in normal operation with data-based mode
            return '';
        },
        [getPrimaryKeyField, visibleColumns, gridRef, isSpannedColumns]
    );

    // Converts CellPosition (index-based) to CellIdentifier (data-based).
    // Extracts row key and field name from the position via data lookups.
    // OPTIMIZED: Uses getRowDataByRowIndex() which respects virtualization.
    const convertPositionToData: (pos: CellPosition) => CellIdentifier = useCallback((pos: CellPosition): CellIdentifier => {
        const rowData: T | undefined = getRowDataByRowIndex(pos.rowIndex);
        const cellKey: string = getCellKey(pos.rowIndex, pos.columnIndex, rowData);
        return parseCellKeyData(cellKey);
    }, [getRowDataByRowIndex, getCellKey, parseCellKeyData]);

    // Converts an array of CellPositions to CellIdentifier array.
    // Batch conversion for event preparation.
    const convertPositionsToData: (positions: CellPosition[]) => CellIdentifier[] =
        useCallback((positions: CellPosition[]): CellIdentifier[] => {
            return positions
                .map((pos: CellPosition) => convertPositionToData(pos))
                .filter((data: CellIdentifier | null): data is CellIdentifier => data !== null);
        }, [convertPositionToData]);

    // Builds a row map from cell keys for efficient row-based operations.
    //Groups field names by row key for RowCellInfo format.
    const buildRowCellMap: (cellKeys: Iterable<string>) => Map<string | number, string[]> =
        useCallback((cellKeys: Iterable<string>): Map<string | number, string[]> => {
            const rowMap: Map<string | number, string[]> = new Map<string | number, string[]>();

            for (const cellKey of cellKeys) {
                const posData: CellIdentifier | null = parseCellKeyData(cellKey);
                if (!rowMap.has(posData?.rowKey)) {
                    rowMap.set(posData?.rowKey, []);
                }
                const fieldNames: string[] | undefined = rowMap.get(posData?.rowKey);
                fieldNames?.push(posData?.fieldName);
            }

            return rowMap;
        }, [parseCellKeyData]);

    /**
     * Converts a row map to RowCellInfo array format with cell data values.
     * Uses getRowsObject() to get virtualized row data instead of iterating currentViewData.
     * OPTIMIZED: Pre-builds rowKey->rowData map for O(1) lookups instead of Array.find().
     * Includes the actual cell values for each selected cell in the row.
     */
    const rowMapToRowCellIndexes: (rowMap: Map<string | number, string[]>) => RowCellInfo[] =
        useCallback((rowMap: Map<string | number, string[]>): RowCellInfo[] => {
            const result: RowCellInfo[] = [];
            const primaryKeyField: string = getPrimaryKeyField();

            // Use getRowsObject() to get only virtualized rows (same pattern as useSelection)
            const rowsObj: IRow<ColumnProps<T>>[] = gridRef.current?.getRowsObject?.();

            // Build rowKey -> rowData map for O(1) lookups from virtualized rows
            const rowDataMap: Map<string | number, T> = new Map();
            for (const rowObj of rowsObj) {
                const key: string | number = String((rowObj?.data as T)[primaryKeyField as keyof T]);
                rowDataMap.set(key, rowObj?.data as T);
            }

            for (const [rowKey, fieldNames] of rowMap) {
                // O(1) lookup from virtualized rows instead of linear search
                const rowData: T | undefined = rowDataMap.get(rowKey);

                // Build data map with fieldName -> cell value
                const dataMap: { [fieldName: string]: unknown } = {};
                for (const fieldName of fieldNames) {
                    dataMap[fieldName as string] = rowData?.[fieldName as keyof T];
                }

                result.push({
                    rowKey,
                    fieldNames: fieldNames.sort(),
                    data: dataMap
                } as RowCellInfo);
            }
            return result;
        }, [getPrimaryKeyField, gridRef]);


    // ===============================
    // Performance Optimization: Viewport Cache Builders
    // ===============================
    // These functions compute pre-computed maps ONCE per render cycle to avoid O(M × N) per-cell searches
    // in the critical render path (getCellSelectionBorderClasses).

    /**
     * Pre-builds a rowKey -> rowIndex lookup map for O(1) position resolution.
     * Uses getRowsObject() to get virtualized rows, avoiding iteration of entire currentViewData.
     * This is called once per render cycle and reused by all position-mapping functions.
     */
    const buildRowKeyToIndexMap: () => Map<string | number, number> = useCallback((): Map<string | number, number> => {
        const map: Map<string | number, number> = new Map();
        const primaryKeyField: string = getPrimaryKeyField();

        // Use getRowsObject() to get only virtualized rows (respects virtual scrolling)
        // This avoids iterating entire currentViewData which could be 100k rows
        const rowsObj: IRow<ColumnProps<T>>[] = gridRef.current?.getRowsObject?.();

        // Build map ONLY from virtualized rows: O(V) where V = virtualized row count
        for (const rowObj of rowsObj) {
            const rowKey: string | number = String((rowObj?.data as T)[primaryKeyField as keyof T]);
            const rowIndex: number = rowObj?.rowIndex;
            map.set(rowKey, rowIndex);
        }

        return map;
    }, [getPrimaryKeyField, gridRef]);

    /**
     * Builds a Map of selected cell positions for O(1) lookups during cell rendering.
     * Format: Map<rowIndex, Set<colIndex>> - enables O(1) "is this cell selected?" checks.
     */
    const buildSelectedCellPositionMap: () => Map<number, Set<number>> = useCallback((): Map<number, Set<number>> => {
        const map: Map<number, Set<number>> = new Map<number, Set<number>>();
        const rowKeyToIndex: Map<string | number, number> = buildRowKeyToIndexMap();

        for (const cellKey of selectedCellsRef.current) {
            const posData: CellIdentifier | null = parseCellKeyData(cellKey);
            const rowIndex: number = rowKeyToIndex.get(posData?.rowKey);
            const colIndex: number = findColumnIndexByField(posData?.fieldName);
            if (rowIndex == null || rowIndex < 0 || colIndex < 0) { continue; }

            let cols: Set<number> = map.get(rowIndex);
            if (!cols) {
                cols = new Set<number>();
                map.set(rowIndex, cols);
            }

            cols.add(colIndex);
        }

        return map;
    }, [buildRowKeyToIndexMap, parseCellKeyData, findColumnIndexByField]);

    /**
     * Gets all row indexes that have at least one selected cell.
     * OPTIMIZED: Uses pre-computed position map instead of nested loops.
     */
    const getRowsWithSelectedCells: () => Set<number> = useCallback((): Set<number> => {
        const positionMap: Map<number, Set<number>> = buildSelectedCellPositionMap();
        return new Set(positionMap.keys());
    }, [buildSelectedCellPositionMap]);

    /**
     * Finds cells that should be deselected when replacing current selection with new cell keys.
     * Returns cells to deselect and affected row indexes.
     */
    const findCellsToDeselect: (newCellKeys: Set<string>) => { cellsToDeselect: CellPosition[]; rowsToRemove: Set<number> } = useCallback(
        (newCellKeys: Set<string>): { cellsToDeselect: CellPosition[]; rowsToRemove: Set<number> } => {
            const cellsToDeselect: CellPosition[] = [];
            const rowsToRemove: Set<number> = new Set<number>();
            const rowKeyToIndex: Map<string | number, number> = buildRowKeyToIndexMap();

            for (const selectedCellKey of selectedCellsRef.current) {
                if (newCellKeys.has(selectedCellKey)) { continue; }

                const posData: CellIdentifier | null = parseCellKeyData(selectedCellKey);
                // O(1) lookup using pre-computed map
                const rowIndex: number = rowKeyToIndex.get(posData?.rowKey);
                const columnIndex: number = findColumnIndexByField(posData?.fieldName);

                if (rowIndex >= 0 && columnIndex >= 0) {
                    cellsToDeselect.push({ rowIndex, columnIndex });
                    rowsToRemove.add(rowIndex);
                }
            }
            return { cellsToDeselect, rowsToRemove };
        }, [buildRowKeyToIndexMap, parseCellKeyData, findColumnIndexByField]);

    /**
     * Adds an array of positions to the current selection.
     * Returns the set of affected row indexes for these new selections.
     * OPTIMIZED: Uses getRowDataByRowIndex() instead of direct currentViewData access.
     */
    const addPositionsToSelection: (positions: CellPosition[]) => Set<number> = useCallback((positions: CellPosition[]): Set<number> => {
        const rowsToAdd: Set<number> = new Set<number>();

        for (const pos of positions) {
            const rowData: T | undefined = getRowDataByRowIndex(pos.rowIndex);
            const cellKey: string = getCellKey(pos.rowIndex, pos.columnIndex, rowData);
            if (cellKey && cellKey !== '') {
                selectedCellsRef.current.add(cellKey);
                rowsToAdd.add(pos.rowIndex);
            }
        }

        return rowsToAdd;
    }, [getCellKey, getRowDataByRowIndex]);

    /**
     * Extracts affected row indexes from currently selected ranges.
     */
    const getAffectedRowsFromCurrentRanges: () => Set<number> = useCallback((): Set<number> => {
        const affectedRows: Set<number> = new Set<number>();

        for (const range of selectedRangesRef.current) {
            const startRow: number = Math.min(range.start.rowIndex, range.end.rowIndex);
            const endRow: number = Math.max(range.start.rowIndex, range.end.rowIndex);
            for (let row: number = startRow; row <= endRow; row++) {
                affectedRows.add(row);
            }
        }

        return affectedRows;
    }, []);

    const getColumnByIndex: (columnIndex: number) => ColumnProps | null = useCallback((columnIndex: number): ColumnProps | null => {
        const columns: ColumnProps[] = gridRef?.current?.getVisibleColumns?.();
        return columns[columnIndex as number];
    }, [gridRef]);

    const getCellValue: (rowData: T, columnIndex: number) => unknown = useCallback((rowData: T, columnIndex: number): unknown => {
        const column: ColumnProps | null = getColumnByIndex(columnIndex);
        // Return undefined if column doesn't have a field (e.g., command columns)
        if (!column || !column.field) { return undefined; }
        return rowData?.[column.field as keyof T];
    }, [getColumnByIndex]);

    const isValidCellPosition: (position: CellPosition) => boolean = useCallback((position: CellPosition): boolean => {
        if (!position || position.rowIndex < 0 || position.columnIndex < 0) { return false; }
        const column: ColumnProps | null = getColumnByIndex(position.columnIndex);

        // Prevent cell selection for columns without a field property (command columns, etc.)
        if (!column || !column.field) { return false; }

        // For virtualized grids, we can't easily validate the rowIndex against total count
        // Accept any non-negative rowIndex; actual data lookup will fail if row doesn't exist
        return position.columnIndex < (gridRef.current?.getVisibleColumns?.().length);
    }, [gridRef, getColumnByIndex]);

    const getCellPositionFromElement: (target: Element) => CellPosition | null = useCallback((target: Element): CellPosition | null => {
        if (!target) { return null; }

        const cellElement: Element | null = closest(target, '.sf-cell');
        const rowElement: Element | null = cellElement ? closest(cellElement, '.sf-grid-content-row, .sf-grid-header-row, .sf-filter-row') : null;

        if (!cellElement || !rowElement) { return null; }

        // Prefer `aria-rowindex` / `aria-colindex` (1-based logical indexes),
        const rowIndex: number = parseInt(rowElement.getAttribute('aria-rowindex'), 10) - 1;
        let cellIndex: number = parseInt(cellElement.getAttribute('aria-colindex'), 10) - 1;
        // Prevent cell selection for columns without a field property (command columns, etc.)
        const column: ColumnProps | null = getColumnByIndex(cellIndex);
        // For spanning grids, to find the actual column index
        if (isSpannedColumns) {
            // Fallback: count actual DOM position of this cell in the row
            const cellsInRowElement: Element[] = Array.from(rowElement.querySelectorAll('.sf-cell'));
            cellIndex = cellsInRowElement.indexOf(cellElement);
        }
        if (!column || !column.field) { return null; }

        return { rowIndex, columnIndex: cellIndex };
    }, [getColumnByIndex, gridRef, isSpannedColumns]);

    const getSelectedCellsData: () => RowCellInfo[] = useCallback((): RowCellInfo[] => {
        // Data-based mode: return {rowKey, fieldNames}
        const rowMap: Map<string | number, string[]> = buildRowCellMap(selectedCellsRef.current);
        return rowMapToRowCellIndexes(rowMap);
    }, [buildRowCellMap, rowMapToRowCellIndexes]);

    // ===============================
    // Event Triggers
    // ===============================

    /// Builds CellData for an array of cell positions
    /// OPTIMIZED: Uses getRowDataByRowIndex() to support virtualized rows outside current view
    const mapCellsToData: (positions: CellPosition[]) => CellData<T>[] = useCallback(
        (positions: CellPosition[]): CellData<T>[] => {
            return positions.map((cell: CellPosition) => {
                // Use provided data if available, otherwise use helper for virtualized lookup
                const rowData: T | undefined = getRowDataByRowIndex(cell.rowIndex);
                const column: ColumnProps | null = getColumnByIndex(cell.columnIndex);
                return {
                    value: getCellValue(rowData, cell.columnIndex) as unknown,
                    field: column?.field,
                    rowData,
                    rowIndex: cell.rowIndex,
                    columnIndex: cell.columnIndex
                } as CellData<T>;
            });
        }, [getRowDataByRowIndex, getColumnByIndex, getCellValue]);

    const triggerCellSelecting: (cells: CellPosition[], range: CellRange | undefined, event?: MouseEvent | KeyboardEvent) => boolean =
        useCallback((
            cells: CellPosition[],
            range: CellRange | undefined,
            event?: MouseEvent | KeyboardEvent
        ): boolean => {
            const cellSelectEvent: ((eventArgs: CellSelectingEvent<T>) => void) | undefined = gridRef?.current?.onCellSelecting;
            if (!cellSelectEvent) { return true; }

            const cellPositionData: CellIdentifier[] = convertPositionsToData(cells);
            const activeCellData: CellIdentifier | null = activeCellRef.current
                ? convertPositionToData(activeCellRef.current)
                : null;

            const eventArgs: CellSelectingEvent<T> = {
                cells: cellPositionData,
                range,
                data: mapCellsToData(cells),
                event,
                cancel: false,
                activeCell: activeCellData,
                selectedRowCells: getSelectedCellsData()
            };

            cellSelectEvent(eventArgs);
            return !eventArgs.cancel;
        }, [gridRef, mapCellsToData, getSelectedCellsData, convertPositionsToData, convertPositionToData]);

    const triggerCellSelect: (cells: CellPosition[], range: CellRange | undefined, event?: MouseEvent | KeyboardEvent) => void =
        useCallback((
            cells: CellPosition[],
            range: CellRange | undefined,
            event?: MouseEvent | KeyboardEvent
        ): void => {
            const cellSelectEvent: ((eventArgs: CellSelectEvent<T>) => void) | undefined = gridRef?.current?.onCellSelect;
            if (!cellSelectEvent) { return; }

            const cellPositionData: CellIdentifier[] = convertPositionsToData(cells);
            const activeCellData: CellIdentifier | null = activeCellRef.current
                ? convertPositionToData(activeCellRef.current)
                : null;

            const eventArgs: CellSelectEvent<T> = {
                cells: cellPositionData,
                range,
                data: mapCellsToData(cells),
                event,
                activeCell: activeCellData,
                selectedRowCells: getSelectedCellsData()
            };

            cellSelectEvent(eventArgs);
        }, [gridRef, mapCellsToData, getSelectedCellsData, convertPositionsToData, convertPositionToData]);

    const triggerCellDeselecting: (cells: CellPosition[], event?: MouseEvent | KeyboardEvent) => boolean =
        useCallback((
            cells: CellPosition[],
            event?: MouseEvent | KeyboardEvent
        ): boolean => {
            const cellDeselectingEvent: ((eventArgs: CellDeselectingEvent<T>) => void) | undefined = gridRef?.current?.onCellDeselecting;
            if (!cellDeselectingEvent) { return true; }

            const cellPositionData: CellIdentifier[] = convertPositionsToData(cells);
            const rowMap: Map<string | number, string[]> = buildRowCellMap(
                cellPositionData.map((data: CellIdentifier) => `${data.rowKey}:${data.fieldName}`)
            );
            const deselectedRowCells: RowCellInfo[] = rowMapToRowCellIndexes(rowMap);

            const eventArgs: CellDeselectingEvent<T> = {
                cells: cellPositionData,
                data: mapCellsToData(cells),
                event,
                cancel: false,
                deselectedRowCells: deselectedRowCells
            };

            cellDeselectingEvent(eventArgs);
            return !eventArgs.cancel;
        }, [gridRef, mapCellsToData, convertPositionsToData, buildRowCellMap, rowMapToRowCellIndexes]);

    const triggerCellDeselect: (cells: CellPosition[], event?: MouseEvent | KeyboardEvent) => void = useCallback((
        cells: CellPosition[],
        event?: MouseEvent | KeyboardEvent
    ): void => {
        const cellDeselectEvent: ((eventArgs: CellDeselectEvent<T>) => void) | undefined = gridRef?.current?.onCellDeselect;
        if (!cellDeselectEvent) { return; }

        const cellPositionData: CellIdentifier[] = convertPositionsToData(cells);
        const rowMap: Map<string | number, string[]> = buildRowCellMap(
            cellPositionData.map((data: CellIdentifier) => `${data.rowKey}:${data.fieldName}`)
        );
        const deselectedRowCells: RowCellInfo[] = rowMapToRowCellIndexes(rowMap);

        const eventArgs: CellDeselectEvent<T> = {
            cells: cellPositionData,
            data: mapCellsToData(cells),
            event,
            deselectedRowCells: deselectedRowCells
        };

        cellDeselectEvent(eventArgs);
    }, [gridRef, mapCellsToData, convertPositionsToData, buildRowCellMap, rowMapToRowCellIndexes]);

    /// Updates visual styles for affected rows by triggering re-render
    const updateCellStyles: (rowIndexes: Set<number>) => void =
        useCallback((rowIndexes: Set<number>): void => {
            if (!gridRef?.current || rowIndexes.size === 0) { return; }
            for (const rowIndex of rowIndexes) {
                const rowElement: HTMLTableRowElement = gridRef.current.getRowByIndex?.(rowIndex);
                const rowObj: IRow<ColumnProps<T>> = getRowObjFromElement(rowElement, gridRef);
                rowObj?.setRowObject?.((prev: IRow<ColumnProps<T>>) => ({ ...prev }));
            }
        }, [gridRef]);

    // ===============================
    // Selection Helpers
    // ===============================

    /// Calculates cell positions for a range based on selection mode, filtering out columns without field property
    const calculateRangePositions: (start: CellPosition, end: CellPosition) => CellPosition[] = useCallback(
        (start: CellPosition, end: CellPosition): CellPosition[] => {
            const minRow: number = Math.min(start.rowIndex, end.rowIndex);
            const maxRow: number = Math.max(start.rowIndex, end.rowIndex);
            const minCol: number = Math.min(start.columnIndex, end.columnIndex);
            const maxCol: number = Math.max(start.columnIndex, end.columnIndex);

            const positions: CellPosition[] = [];
            const mode: string | undefined = selectionSettings?.cellSelectionType;
            const visibleColumns: ColumnProps[] = gridRef?.current?.getVisibleColumns?.();
            const maxVisibleColumn: number = visibleColumns?.length - 1;

            // Helper function to check if column has field property
            const isValidColumnForSelection: (colIndex: number) => boolean = (colIndex: number): boolean => {
                const column: ColumnProps | undefined = visibleColumns?.[colIndex as number];
                return !!(column && column.field);
            };

            if (mode === CellSelectionType.Box || mode === CellSelectionType.BoxWithBorder) {
                for (let row: number = minRow; row <= maxRow; row++) {
                    for (let col: number = minCol; col <= maxCol; col++) {
                        if (isValidColumnForSelection(col)) {
                            positions.push({ rowIndex: row, columnIndex: col });
                        }
                    }
                }
            } else {
                // Flow mode: direction-aware selection
                const isSelectingDownward: boolean = start.rowIndex <= end.rowIndex;
                for (let row: number = minRow; row <= maxRow; row++) {
                    if (row === minRow && row === maxRow) {
                        for (let col: number = minCol; col <= maxCol; col++) {
                            if (isValidColumnForSelection(col)) {
                                positions.push({ rowIndex: row, columnIndex: col });
                            }
                        }
                    } else if (isSelectingDownward) {
                        if (row === start.rowIndex) {
                            for (let col: number = start.columnIndex; col <= maxVisibleColumn; col += 1) {
                                if (isValidColumnForSelection(col)) {
                                    positions.push({ rowIndex: row, columnIndex: col });
                                }
                            }
                        } else if (row === end.rowIndex) {
                            for (let col: number = 0; col <= end.columnIndex; col += 1) {
                                if (isValidColumnForSelection(col)) {
                                    positions.push({ rowIndex: row, columnIndex: col });
                                }
                            }
                        } else {
                            for (let col: number = 0; col <= maxVisibleColumn; col += 1) {
                                if (isValidColumnForSelection(col)) {
                                    positions.push({ rowIndex: row, columnIndex: col });
                                }
                            }
                        }
                    } else {
                        if (row === start.rowIndex) {
                            for (let col: number = 0; col <= start.columnIndex; col += 1) {
                                if (isValidColumnForSelection(col)) {
                                    positions.push({ rowIndex: row, columnIndex: col });
                                }
                            }
                        } else if (row === end.rowIndex) {
                            for (let col: number = end.columnIndex; col <= maxVisibleColumn; col += 1) {
                                if (isValidColumnForSelection(col)) {
                                    positions.push({ rowIndex: row, columnIndex: col });
                                }
                            }
                        } else {
                            for (let col: number = 0; col <= maxVisibleColumn; col += 1) {
                                if (isValidColumnForSelection(col)) {
                                    positions.push({ rowIndex: row, columnIndex: col });
                                }
                            }
                        }
                    }
                }
            }

            return positions;
        }, [selectionSettings, gridRef]);

    const selectCellByIndex: (rowIndex: number, columnIndex: number) => void =
        useCallback((rowIndex: number, columnIndex: number): void => {
            const position: CellPosition = { rowIndex, columnIndex };

            if (!isValidCellPosition(position)) { return; }
            // Get rowData for data-based mode
            // OPTIMIZED: Uses getRowDataByRowIndex() instead of direct currentViewData access
            const rowData: T | undefined = getRowDataByRowIndex(rowIndex);
            const cellKey: string = getCellKey(rowIndex, columnIndex, rowData);
            const isAlreadySelected: boolean = selectedCellsRef.current.has(cellKey);
            const isOnlySelectedCell: boolean = isAlreadySelected && selectedCellsRef.current.size === 1;

            if (isOnlySelectedCell && !triggerCellDeselecting([position], syntheticEvent)) { return; }

            if (isOnlySelectedCell) {
                const affectedRows: Set<number> = new Set<number>();
                affectedRows.add(position.rowIndex);
                selectedCellsRef.current.clear();
                selectedRangesRef.current.length = 0;
                activeCellRef.current = null;
                rangeStartCellRef.current = null;
                // Track that user is making a new selection without Ctrl
                hasNewSelectionWithoutCtrlRef.current = true;
                updateCellStyles(affectedRows);
                triggerCellDeselect([position], syntheticEvent);
                return;
            }

            const newCellKeys: Set<string> = new Set([getCellKey(rowIndex, columnIndex, rowData)]);

            // Get rows that had selected cells before clearing (for both index-based and data-based modes)
            const rowsWithSelectedCellsBefore: Set<number> = getRowsWithSelectedCells();

            const { cellsToDeselect, rowsToRemove } = findCellsToDeselect(newCellKeys);

            // Prepare active cell BEFORE triggering selecting event
            activeCellRef.current = position;
            rangeStartCellRef.current = position;

            if (!triggerCellSelecting([position], undefined, syntheticEvent)) { return; }
            if (cellsToDeselect.length > 0 && !triggerCellDeselecting(cellsToDeselect, syntheticEvent)) { return; }

            // Clear existing selection
            selectedCellsRef.current.clear();
            selectedRangesRef.current.length = 0;
            rangeStartCellRef.current = null;
            // Track that user is making a new selection without Ctrl
            hasNewSelectionWithoutCtrlRef.current = true;

            // Add new selection
            selectedCellsRef.current.add(cellKey);

            // Update styles for all affected rows: previous rows with selections + current row
            // In data-based mode, rowsToRemove may be empty, so use rowsWithSelectedCellsBefore instead
            const affectedRowsToUpdate: Set<number> = isCellSelectionEnabled()
                ? new Set([...rowsWithSelectedCellsBefore, position.rowIndex])
                : new Set([...rowsToRemove, position.rowIndex]);
            updateCellStyles(affectedRowsToUpdate);

            if (rowsToRemove.size > 0 || rowsWithSelectedCellsBefore.size > 0) {
                triggerCellDeselect(cellsToDeselect, syntheticEvent);
            }

            triggerCellSelect([position], undefined, syntheticEvent);
        }, [isValidCellPosition, getCellKey, getRowDataByRowIndex, getRowsWithSelectedCells, triggerCellSelecting, triggerCellSelect,
            triggerCellDeselecting, triggerCellDeselect, updateCellStyles, findCellsToDeselect, isCellSelectionEnabled]);

    const selectCell: (rowKey: string | number, fieldName: string) => void =
        useCallback((rowKey: string | number, fieldName: string): void => {
            const rowIndex: number = findRowIndexByKey(rowKey);
            if (rowIndex < 0) { return; }
            const columnIndex: number = findColumnIndexByField(fieldName);
            if (columnIndex < 0) { return; }
            selectCellByIndex(rowIndex, columnIndex);
        }, [findRowIndexByKey, findColumnIndexByField, selectCellByIndex]);


    const selectCells: (cells: RowCellInfo[]) => void = useCallback((cells: RowCellInfo[]): void => {
        if (!cells?.length) { return; }

        const positions: CellPosition[] = [];

        cells.forEach((cellGroup: RowCellInfo) => {
            // Data-based format: {rowKey, fieldNames}
            if (!cellGroup.rowKey || !cellGroup.fieldNames) { return; }

            const rowIndex: number = findRowIndexByKey(cellGroup.rowKey);

            if (rowIndex >= 0) {
                // Found matching row, now add each field
                cellGroup.fieldNames.forEach((fieldName: string) => {
                    const columnIndex: number = findColumnIndexByField(fieldName);
                    if (columnIndex >= 0) {
                        const position: CellPosition = { rowIndex, columnIndex };
                        if (isValidCellPosition(position)) { positions.push(position); }
                    }
                });
            }
        });

        if (!positions.length) { return; }

        const newCellKeys: Set<string> = new Set(positions.map((pos: CellPosition) => {
            // OPTIMIZED: Use getRowDataByRowIndex() for virtualized row lookup
            const rowData: T | undefined = getRowDataByRowIndex(pos.rowIndex);
            return getCellKey(pos.rowIndex, pos.columnIndex, rowData);
        }));
        const { cellsToDeselect, rowsToRemove } = findCellsToDeselect(newCellKeys);

        if (!triggerCellSelecting(positions, undefined, syntheticEvent) ||
            (cellsToDeselect.length > 0 && !triggerCellDeselecting(cellsToDeselect, syntheticEvent))) { return; }

        selectedCellsRef.current.clear();
        selectedRangesRef.current.length = 0;
        // Track that user is making a new selection without Ctrl (replacive selection)
        hasNewSelectionWithoutCtrlRef.current = true;

        const rowsToAdd: Set<number> = addPositionsToSelection(positions);

        activeCellRef.current = positions[0];
        updateCellStyles(new Set([...rowsToRemove, ...rowsToAdd]));
        if (rowsToRemove.size > 0) {
            triggerCellDeselect(cellsToDeselect, syntheticEvent);
        }
        triggerCellSelect(positions, undefined, syntheticEvent);
    }, [isValidCellPosition, getCellKey, getRowDataByRowIndex, triggerCellSelecting, triggerCellSelect, triggerCellDeselecting,
        triggerCellDeselect, updateCellStyles, findCellsToDeselect, addPositionsToSelection, visibleColumns,
        findRowIndexByKey, findColumnIndexByField]);

    const selectCellsByRange: (start: CellIdentifier, end: CellIdentifier) => void =
        useCallback((start: CellIdentifier, end: CellIdentifier): void => {
            // Convert data-based positions to CellPosition
            const startPos: CellPosition | null = convertDataToPosition(start as CellIdentifier);
            const endPos: CellPosition | null = convertDataToPosition(end as CellIdentifier);

            if (!startPos || !endPos || !isValidCellPosition(startPos) || !isValidCellPosition(endPos)) { return; }

            const range: CellRange = { start: startPos, end: endPos };
            const positions: CellPosition[] = calculateRangePositions(startPos, endPos);
            const newCellKeys: Set<string> = new Set(positions.map((pos: CellPosition) => {
                // OPTIMIZED: Use getRowDataByRowIndex() for virtualized row lookup
                const rowData: T | undefined = getRowDataByRowIndex(pos.rowIndex);
                return getCellKey(pos.rowIndex, pos.columnIndex, rowData);
            }));
            const { cellsToDeselect, rowsToRemove } = findCellsToDeselect(newCellKeys);

            if (!triggerCellSelecting(positions, range, syntheticEvent) ||
                (cellsToDeselect.length > 0 && !triggerCellDeselecting(cellsToDeselect, syntheticEvent))) { return; }

            selectedCellsRef.current.clear();
            selectedRangesRef.current.length = 0;
            selectedRangesRef.current.push(range);

            const rowsToAdd: Set<number> = addPositionsToSelection(positions);

            activeCellRef.current = startPos;
            updateCellStyles(new Set([...rowsToRemove, ...rowsToAdd]));
            if (rowsToRemove.size > 0) {
                triggerCellDeselect(cellsToDeselect, syntheticEvent);
            }
            triggerCellSelect(positions, range, syntheticEvent);
        }, [isValidCellPosition, calculateRangePositions, getCellKey, getRowDataByRowIndex, triggerCellSelecting, triggerCellSelect,
            triggerCellDeselecting, triggerCellDeselect, updateCellStyles, findCellsToDeselect,
            addPositionsToSelection, convertDataToPosition]);

    const clearCellSelection: (cells?: RowCellInfo[]) => void = useCallback((cells?: RowCellInfo[]): void => {
        // Clear specific cells or all cells using data-based format
        const cellsToDeselect: CellPosition[] = [];
        const rowsToRemove: Set<number> = new Set<number>();
        const cellKeysToRemove: string[] = [];
        const rowKeyToIndex: Map<string | number, number> = buildRowKeyToIndexMap();

        if (cells && cells.length > 0) {
            // Clear specific cells in data-based format: {rowKey, fieldNames}
            for (const cellGroup of cells) {
                if (!cellGroup.rowKey || !cellGroup.fieldNames) { continue; }

                // Construct cell keys and find corresponding positions
                cellGroup.fieldNames.forEach((fieldName: string) => {
                    const cellKey: string = `${cellGroup.rowKey}:${fieldName}`;
                    if (selectedCellsRef.current.has(cellKey)) {
                        // O(1) lookup using pre-computed map
                        const rowIndex: number = rowKeyToIndex.get(cellGroup.rowKey);
                        const columnIndex: number = findColumnIndexByField(fieldName);

                        if (rowIndex >= 0 && columnIndex >= 0) {
                            cellsToDeselect.push({ rowIndex, columnIndex });
                            rowsToRemove.add(rowIndex);
                        }
                        cellKeysToRemove.push(cellKey);
                    }
                });
            }
        } else {
            // Clear all cells
            if (!selectedCellsRef.current.size) { return; }

            // For data-based mode, use pre-computed map for O(1) lookups
            for (const cellKey of selectedCellsRef.current) {
                const posData: CellIdentifier | null = parseCellKeyData(cellKey);
                const rowIndex: number = rowKeyToIndex.get(posData?.rowKey);
                const columnIndex: number = findColumnIndexByField(posData?.fieldName);

                if (rowIndex >= 0 && columnIndex >= 0) {
                    cellsToDeselect.push({ rowIndex, columnIndex });
                    rowsToRemove.add(rowIndex);
                }
            }
        }

        if (!triggerCellDeselecting(cellsToDeselect, syntheticEvent)) { return; }

        // Get affected rows from current ranges before clearing
        const affectedRowsFromRanges: Set<number> = getAffectedRowsFromCurrentRanges();

        // Remove specific cells or all cells
        if (cells && cells.length > 0) {
            cellKeysToRemove.forEach((key: string) => selectedCellsRef.current.delete(key));
        } else {
            selectedCellsRef.current.clear();
            selectedRangesRef.current.length = 0;
            activeCellRef.current = null;
            rangeStartCellRef.current = null;
        }

        // Combine rows to update - include affected rows from ranges for BoxWithBorder mode to clear border classes
        const rowsToUpdate: Set<number> = new Set(rowsToRemove);
        if (affectedRowsFromRanges.size > 0 && selectionSettings?.cellSelectionType === CellSelectionType.BoxWithBorder) {
            affectedRowsFromRanges.forEach((row: number) => rowsToUpdate.add(row));
        }
        updateCellStyles(rowsToUpdate);

        triggerCellDeselect(cellsToDeselect, syntheticEvent);
    }, [buildRowKeyToIndexMap, parseCellKeyData, findColumnIndexByField, getAffectedRowsFromCurrentRanges, selectionSettings,
        triggerCellDeselecting, triggerCellDeselect, updateCellStyles]);

    const selectRange: (start: CellPosition, end: CellPosition, isSelectionExtend?: boolean) => void =
        useCallback((start: CellPosition, end: CellPosition, isSelectionExtend: boolean = false): void => {
            if (!isValidCellPosition(start) || !isValidCellPosition(end)) { return; }

            const range: CellRange = { start, end };
            const positions: CellPosition[] = calculateRangePositions(start, end);

            if (!triggerCellSelecting(positions, range, syntheticEvent)) { return; }

            let rowsToRemove: Set<number> = new Set<number>();
            let cellsToDeselect: CellPosition[] = [];

            if (!isSelectionExtend) {
                const newCellKeys: Set<string> = new Set(positions.map((pos: CellPosition) => {
                    // OPTIMIZED: Use getRowDataByRowIndex() for virtualized row lookup
                    const rowData: T | undefined = getRowDataByRowIndex(pos.rowIndex);
                    return getCellKey(pos.rowIndex, pos.columnIndex, rowData);
                }));
                const result: { cellsToDeselect: CellPosition[]; rowsToRemove: Set<number> } = findCellsToDeselect(newCellKeys);
                cellsToDeselect = result.cellsToDeselect;
                rowsToRemove = result.rowsToRemove;

                if (cellsToDeselect.length > 0 && !triggerCellDeselecting(cellsToDeselect, syntheticEvent)) { return; }

                selectedCellsRef.current.clear();
                selectedRangesRef.current.length = 0;
                // Track that user is making a new range selection without Ctrl (replacement)
                hasNewSelectionWithoutCtrlRef.current = true;
            } else {
                // Additive range selection (Ctrl+Drag) - preserve flag state as false
                hasNewSelectionWithoutCtrlRef.current = false;
            }

            selectedRangesRef.current.push(range);

            const rowsToAdd: Set<number> = addPositionsToSelection(positions);

            activeCellRef.current = end;
            rangeStartCellRef.current = start;
            updateCellStyles(new Set([...rowsToRemove, ...rowsToAdd]));
            if (rowsToRemove.size > 0) {
                triggerCellDeselect(cellsToDeselect, syntheticEvent);
            }
            triggerCellSelect(positions, range, syntheticEvent);
        }, [isValidCellPosition, calculateRangePositions, getCellKey, getRowDataByRowIndex, selectionSettings, triggerCellSelecting,
            triggerCellSelect, triggerCellDeselecting, triggerCellDeselect, updateCellStyles,
            findCellsToDeselect, addPositionsToSelection]);

    // ===============================
    // Event Handlers - Mouse
    // ===============================

    const handleGridClick: (event: MouseEvent) => void = useCallback((event: MouseEvent): void => {
        if (!isCellSelectionEnabled()) {
            return;
        }
        // If a drag occurred, skip the subsequent click action (finalized by doc mouseup)
        if (uiRef.current.skipClick) {
            uiRef.current.skipClick = false;
            return;
        }

        const target: Element = event.target as Element;
        const position: CellPosition | null = getCellPositionFromElement(target);
        if (!position || !closest(target, '.sf-cell')) {
            return;
        }

        // Get rowData for data-based mode (needed for getCellKey in Ctrl+Click and other operations)
        // OPTIMIZED: Use getRowDataByRowIndex() for virtualized row lookup
        const rowData: T | undefined = getRowDataByRowIndex(position.rowIndex);
        const isCtrlPressed: boolean = event.ctrlKey || event.metaKey;
        const isShiftPressed: boolean = event.shiftKey;
        const isSingleMode: boolean = selectionSettings?.mode === SelectionMode.Single;

        // In Single mode, treat all modifier key combinations as normal clicks
        if (isSingleMode || (!isShiftPressed && !isCtrlPressed)) {
            // Normal click selection - do not set dragging here. Drag starts only after pointer moves.
            selectCellByIndex(position.rowIndex, position.columnIndex);
            uiRef.current.dragStart = position;
            // Capture Ctrl state for potential drag, but not in Single mode
            uiRef.current.dragIsCtrlPressed = isCtrlPressed && !isSingleMode;
        } else if (isShiftPressed && !isSingleMode) {
            // Shift+Click: range selection (only in Multiple mode)
            const rangeStart: CellPosition = rangeStartCellRef.current ?? activeCellRef.current ?? position;
            selectRange(rangeStart, position, false);
        } else if (isCtrlPressed && !isSingleMode) {
            // Ctrl+Click: additive selection (only in Multiple mode)
            // Collect all affected rows from current ranges before clearing them
            const affectedRowsFromRanges: Set<number> = getAffectedRowsFromCurrentRanges();

            // Force affected rows to re-render (this will clear border classes)
            if (affectedRowsFromRanges.size > 0 && selectionSettings?.cellSelectionType === CellSelectionType.BoxWithBorder) {
                updateCellStyles(affectedRowsFromRanges);
            }

            // Now handle the Ctrl+Clicked cell (single cell selection, no borders)
            // Pass rowData to getCellKey to support data-based mode (primaryKey:fieldName format)
            const cellKey: string = getCellKey(position.rowIndex, position.columnIndex, rowData);
            const isSelected: boolean = selectedCellsRef.current.has(cellKey);
            const rowsToUpdate: Set<number> = new Set([position.rowIndex]);
            // Track that this is an additive selection (Ctrl+Click preserves other selections)
            hasNewSelectionWithoutCtrlRef.current = false;

            if (isSelected) {
                selectedCellsRef.current.delete(cellKey);
                updateCellStyles(rowsToUpdate);
                triggerCellDeselect([position], event);
            } else {
                if (!triggerCellSelecting([position], undefined, event)) {
                    return;
                }
                selectedCellsRef.current.add(cellKey);
                activeCellRef.current = position;
                updateCellStyles(rowsToUpdate);
                triggerCellSelect([position], undefined, event);
            }
        }

        event.preventDefault();
        event.stopPropagation();
    }, [selectionSettings, getCellPositionFromElement, selectCell, selectRange, getCellKey,
        triggerCellDeselecting, triggerCellDeselect, triggerCellSelecting, triggerCellSelect,
        updateCellStyles, getAffectedRowsFromCurrentRanges, isCellSelectionEnabled]);

    const handleGridMouseDown: (event: MouseEvent) => void = useCallback((event: MouseEvent): void => {
        if (!isCellSelectionEnabled()) {
            return;
        }
        // Only respond to primary button
        if ((event as MouseEvent & { button?: number }).button !== undefined &&
            (event as MouseEvent & { button?: number }).button !== 0) {
            return;
        }

        const target: Element = event.target as Element;
        const position: CellPosition | null = getCellPositionFromElement(target);
        const cell: HTMLTableCellElement = closest(target, '.sf-cell') as HTMLTableCellElement;
        if (!position || !cell || !cell.parentElement.classList.contains('sf-grid-content-row')) {
            return;
        }

        const isCtrlPressed: boolean = event.ctrlKey || event.metaKey;

        // Record the start cell and ctrl state but DO NOT perform selection here.
        // Selection is performed on click; dragging will start on document mousemove.
        uiRef.current.dragStart = position;
        uiRef.current.dragIsCtrlPressed = isCtrlPressed;
        uiRef.current.lastDragEnd = `${position.rowIndex}:${position.columnIndex}`;

        gridRef?.current?.focusModule?.navigateToCell?.(parseInt(cell.parentElement.getAttribute('data-rowindex'), 10) - 1,
                                                        parseInt(cell.getAttribute('data-colindex'), 10) - 1);

        // Attach document-level listeners so we can detect movement and start drag there
        if (uiRef.current.docMouseMove) {
            document.addEventListener('mousemove', uiRef.current.docMouseMove as unknown as EventListener);
        }
        if (uiRef.current.docMouseUp) {
            document.addEventListener('mouseup', uiRef.current.docMouseUp as unknown as EventListener);
        }
        // Do not prevent default or stop propagation here so click/keyboard flows remain intact
    }, [selectionSettings, getCellPositionFromElement, isCellSelectionEnabled]);

    // ===============================
    // Event Handlers - Keyboard
    // ===============================

    const handleKeyDown: (event: KeyboardEvent) => void = useCallback((event: KeyboardEvent): void => {
        if (!isCellSelectionEnabled()) {
            return;
        }

        const key: string = event.key;
        const isShiftPressed: boolean = event.shiftKey;
        const isCtrlPressed: boolean = event.ctrlKey || event.metaKey;
        const isSingleMode: boolean = selectionSettings?.mode === SelectionMode.Single;

        if (key === 'Escape') {
            clearCellSelection();
            event.preventDefault();
            return;
        }

        if (isCtrlPressed && key === 'a') {
            // In Single mode, select only the active cell; in Multiple mode, select all cells
            if (isSingleMode) {
                if (activeCellRef.current) {
                    // In Single mode with Ctrl+A, ensure the active cell is selected (don't toggle)
                    // OPTIMIZED: Use getRowDataByRowIndex() for virtualized row lookup
                    const rowData: T | undefined = getRowDataByRowIndex(activeCellRef.current.rowIndex);
                    const cellKey: string = getCellKey(activeCellRef.current.rowIndex, activeCellRef.current.columnIndex, rowData);
                    if (!selectedCellsRef.current.has(cellKey)) {
                        selectCellByIndex(activeCellRef.current.rowIndex, activeCellRef.current.columnIndex);
                    }
                    event.preventDefault();
                }
            } else if (currentViewData?.length && visibleColumns.length) {
                // Find first and last columns that have field property (skip command columns)
                const firstColumnWithField: ColumnProps | undefined = visibleColumns.find((col: ColumnProps) => col?.field);
                const lastColumnWithField: ColumnProps | undefined = [...visibleColumns].reverse().find((col: ColumnProps) => col?.field);

                if (firstColumnWithField && lastColumnWithField) {
                    // OPTIMIZED: Get first and last row data using helpers instead of direct currentData access
                    const firstRowData: T | undefined = currentViewData[0];
                    const lastRowData: T | undefined = currentViewData[currentViewData.length - 1];
                    const firstRowKey: string | number = String(firstRowData?.[getPrimaryKeyField() as keyof T]);
                    const lastRowKey: string | number = String(lastRowData?.[getPrimaryKeyField() as keyof T]);

                    selectCellsByRange(
                        { rowKey: firstRowKey, fieldName: firstColumnWithField.field },
                        { rowKey: lastRowKey, fieldName: lastColumnWithField.field }
                    );
                    event.preventDefault();
                }
            }
            return;
        }

        const activeCell: CellPosition | null = activeCellRef.current;
        if (!activeCell) { return; }

        const columns: ColumnProps[] = gridRef.current.getVisibleColumns();
        const dataLength: number = currentViewData?.length;
        let newPosition: CellPosition | null = null;

        // Helper to find next valid column with field property
        const findNextValidColumn: (startCol: number, direction: number) => number = (startCol: number, direction: number): number => {
            let col: number = startCol + direction;
            while (col >= 0 && col < columns.length) {
                if (columns[col as number]?.field) {
                    return col;
                }
                col += direction;
            }
            return -1;
        };

        if (key === 'ArrowUp' && activeCell.rowIndex > 0) {
            newPosition = { ...activeCell, rowIndex: activeCell.rowIndex - 1 };
        } else if (key === 'ArrowDown' && activeCell.rowIndex < dataLength - 1) {
            newPosition = { ...activeCell, rowIndex: activeCell.rowIndex + 1 };
        } else if (key === 'ArrowLeft' && activeCell.columnIndex > 0) {
            const nextCol: number = findNextValidColumn(activeCell.columnIndex, -1);
            if (nextCol >= 0) {
                newPosition = { ...activeCell, columnIndex: nextCol };
            }
        } else if (key === 'ArrowRight' && activeCell.columnIndex < columns.length - 1) {
            const nextCol: number = findNextValidColumn(activeCell.columnIndex, 1);
            if (nextCol >= 0) {
                newPosition = { ...activeCell, columnIndex: nextCol };
            }
        }

        if (newPosition) {
            if (isShiftPressed && !isSingleMode) {
                const rangeStart: CellPosition = rangeStartCellRef.current ?? activeCell;
                selectRange(rangeStart, newPosition, false);
            } else {
                rangeStartCellRef.current = null;
                selectCellByIndex(newPosition.rowIndex, newPosition.columnIndex);
            }
            event.preventDefault();
        }
    }, [selectionSettings, clearCellSelection, currentViewData, gridRef, selectCellsByRange,
        selectRange, selectCellByIndex, isCellSelectionEnabled]);

    // Document-level mouse handlers to support drag selection outside grid bounds
    useEffect(() => {
        const isSingleMode: boolean = selectionSettings?.mode === SelectionMode.Single;

        const EDGE_THRESHOLD: number = 40; // px from edge to start auto-scroll
        // Vertical auto-scroll tuning: slower, smoother ramp-up
        const MIN_SCROLL_SPEED: number = 2; // px per frame (min)
        const MAX_SCROLL_SPEED: number = 8; // px per frame (max)

        const getScrollElements: () => { verticalEl: HTMLElement ; contentPanelEl: HTMLElement } = () => ({
            verticalEl: gridRef?.current?.virtualContentRowScrollRef || gridRef?.current?.contentScrollRef,
            contentPanelEl: gridRef?.current?.contentPanelRef || gridRef?.current?.element
        });

        const computeSpeed: (distanceFromEdge: number) => number = (distanceFromEdge: number) => {
            const proportion: number = Math.max(0, Math.min(1, distanceFromEdge / EDGE_THRESHOLD));
            return Math.round(MIN_SCROLL_SPEED + Math.pow(proportion, 1.5) * (MAX_SCROLL_SPEED - MIN_SCROLL_SPEED));
        };

        const startAutoScroll: () => void = () => {
            if (uiRef.current.autoScrollActive) { return; }
            uiRef.current.autoScrollActive = true;
            uiRef.current.autoScrollRAF = requestAnimationFrame(autoScrollLoop);
        };

        const stopAutoScroll: () => void = () => {
            uiRef.current.autoScrollActive = false;
            if (uiRef.current.autoScrollRAF) {
                cancelAnimationFrame(uiRef.current.autoScrollRAF as number);
                uiRef.current.autoScrollRAF = null;
            }
        };

        const autoScrollLoop: () => void = () => {
            const lastX: number = uiRef.current.lastPointerX;
            const lastY: number = uiRef.current.lastPointerY;
            if (lastX === null || lastY === null || !uiRef.current.autoScrollActive) {
                uiRef.current.autoScrollRAF = requestAnimationFrame(autoScrollLoop);
                return;
            }

            const { verticalEl, contentPanelEl } = getScrollElements();
            const rectSource: HTMLElement = (contentPanelEl || verticalEl) as HTMLElement | null;
            if (!rectSource) {
                uiRef.current.autoScrollRAF = requestAnimationFrame(autoScrollLoop);
                return;
            }
            const rect: DOMRect = rectSource.getBoundingClientRect();

            let dy: number = 0;
            let dx: number = 0;
            if (lastY < rect.top + EDGE_THRESHOLD) {
                dy = -computeSpeed(rect.top + EDGE_THRESHOLD - lastY);
            } else if (lastY > rect.bottom - EDGE_THRESHOLD) {
                dy = computeSpeed(lastY - (rect.bottom - EDGE_THRESHOLD));
            }
            if (lastX < rect.left + EDGE_THRESHOLD) {
                dx = -computeSpeed(rect.left + EDGE_THRESHOLD - lastX);
            } else if (lastX > rect.right - EDGE_THRESHOLD) {
                dx = computeSpeed(lastX - (rect.right - EDGE_THRESHOLD));
            }

            const vRowRef: HTMLElement = gridRef?.current?.virtualContentRowScrollRef;
            const contentRef: HTMLElement = gridRef?.current?.contentScrollRef;

            if (dy !== 0) {
                const vertTarget: HTMLElement = verticalEl || vRowRef || contentRef;
                if (vertTarget) {
                    vertTarget.scrollTop += dy;
                    if (vRowRef && vRowRef !== vertTarget) {
                        vRowRef.scrollTop = vertTarget.scrollTop;
                    }
                    if (contentRef && contentRef !== vertTarget) {
                        contentRef.scrollTop = vertTarget.scrollTop;
                    }
                }
            }

            if (dx !== 0 && contentRef) {
                contentRef.scrollLeft += dx;
            }

            const doHitTest: () => void = () => {
                const elAtPointer: Element | null = document.elementFromPoint(lastX, lastY) as Element;
                const posAfterScroll: CellPosition | null = elAtPointer ? getCellPositionFromElement(elAtPointer) : null;
                if (!posAfterScroll || !uiRef.current.isDragging) { return; }
                const keyAfter: string = `${posAfterScroll.rowIndex}:${posAfterScroll.columnIndex}`;
                if (uiRef.current.lastDragEnd !== keyAfter) {
                    uiRef.current.lastDragEnd = keyAfter;
                    const start: CellPosition = uiRef.current.dragStart || posAfterScroll;
                    selectRange(start, posAfterScroll, !!uiRef.current.dragIsCtrlPressed);
                }
            };

            if (dx !== 0 || dy !== 0) {
                requestAnimationFrame(() => { requestAnimationFrame(doHitTest); });
            } else {
                doHitTest();
            }

            uiRef.current.autoScrollRAF = requestAnimationFrame(autoScrollLoop);
        };

        const handleDocMouseMove: (ev: MouseEvent | Event) => void = (ev: MouseEvent | Event): void => {
            if (isSingleMode) { return; }
            const mouseEvent: MouseEvent = ev as MouseEvent;
            const isBoxWithBorder: boolean = selectionSettings?.cellSelectionType === CellSelectionType.BoxWithBorder;
            const affectedRowsFromRanges: Set<number> = getAffectedRowsFromCurrentRanges();
            if ((mouseEvent.ctrlKey || mouseEvent.metaKey) && isBoxWithBorder && affectedRowsFromRanges.size > 0) {
                updateCellStyles(affectedRowsFromRanges);
            }
            uiRef.current.lastPointerX = mouseEvent.clientX;
            uiRef.current.lastPointerY = mouseEvent.clientY;

            const el: Element = (document.elementFromPoint?.(mouseEvent.clientX, mouseEvent.clientY) || ev.target) as Element;
            const pos: CellPosition | null = getCellPositionFromElement(el);

            const { verticalEl, contentPanelEl } = getScrollElements();
            const rectEl: HTMLElement = (contentPanelEl || verticalEl) as HTMLElement | null;
            let nearEdge: boolean = false;
            if (rectEl) {
                const rect: DOMRect = rectEl.getBoundingClientRect();
                // Compute numeric proximity to each edge and treat as near-edge when any proximity > 0.
                const topDist: number = rect.top + EDGE_THRESHOLD - mouseEvent.clientY;
                const bottomDist: number = mouseEvent.clientY - (rect.bottom - EDGE_THRESHOLD);
                const leftDist: number = rect.left + EDGE_THRESHOLD - mouseEvent.clientX;
                const rightDist: number = mouseEvent.clientX - (rect.right - EDGE_THRESHOLD);
                const maxProximity: number = Math.max(topDist, bottomDist, leftDist, rightDist);
                nearEdge = maxProximity > 0;
            }

            if (nearEdge && uiRef.current.isDragging) {
                startAutoScroll();
            } else {
                stopAutoScroll();
            }

            if (!pos) { return; }
            const key: string = `${pos.rowIndex}:${pos.columnIndex}`;
            if (!uiRef.current.isDragging) {
                uiRef.current.isDragging = true;
                if (gridRef?.current?.cellSelectionModule) {
                    gridRef.current.cellSelectionModule.isDragging = true;
                }
                uiRef.current.skipClick = true;
                document.body.classList.add('sf-disableuserselect');
                uiRef.current.selectStartPrevent = (ev: Event) => { ev.preventDefault(); };
                document.addEventListener('selectstart', uiRef.current.selectStartPrevent as EventListener, true);
                uiRef.current.lastDragEnd = key;
                const start: CellPosition = uiRef.current.dragStart || pos;
                selectRange(start, pos, !!uiRef.current.dragIsCtrlPressed);
                return;
            }
            if (uiRef.current.autoScrollActive || uiRef.current.lastDragEnd === key) { return; }
            uiRef.current.lastDragEnd = key;
            const start: CellPosition = uiRef.current.dragStart || pos;
            selectRange(start, pos, !!uiRef.current.dragIsCtrlPressed);
        };

        const handleDocMouseUp: (ev: MouseEvent | Event) => void = (ev: MouseEvent | Event): void => {
            const mouseEvent: MouseEvent = ev as MouseEvent;
            const el: Element = (document.elementFromPoint?.(mouseEvent.clientX, mouseEvent.clientY) || ev.target) as Element;
            const pos: CellPosition = getCellPositionFromElement(el);

            if (uiRef.current.isDragging && uiRef.current.dragStart && !isSingleMode) {
                const { dragStart: savedDragStart, dragIsCtrlPressed: savedCtrl } = uiRef.current;
                if (pos) {
                    selectRange(savedDragStart, pos, !!savedCtrl);
                } else {
                    // If we lost the exact element reference, try to find it again via DOM
                    requestAnimationFrame(() => {
                        const el2: Element = document.elementFromPoint?.(mouseEvent.clientX, mouseEvent.clientY) as Element;
                        const pos2: CellPosition = el2 ? getCellPositionFromElement(el2) : null;
                        const finalPos: CellPosition = (pos2 && isValidCellPosition(pos2)) ? pos2 : savedDragStart;
                        selectRange(savedDragStart, finalPos, !!savedCtrl);
                    });
                }
                uiRef.current.lastDragEnd = null;
            }

            uiRef.current.isDragging = false;
            uiRef.current.dragStart = null;
            uiRef.current.dragIsCtrlPressed = false;
            uiRef.current.autoScrollActive = false;
            uiRef.current.lastPointerX = null;
            uiRef.current.lastPointerY = null;
            if (uiRef.current.autoScrollRAF) {
                cancelAnimationFrame(uiRef.current.autoScrollRAF as number);
            }
            uiRef.current.autoScrollRAF = null;
            if (uiRef.current.docMouseMove) {
                document.removeEventListener('mousemove', uiRef.current.docMouseMove as unknown as EventListener);
            }
            if (uiRef.current.docMouseUp) {
                document.removeEventListener('mouseup', uiRef.current.docMouseUp as unknown as EventListener);
            }
            document.body.classList.remove('sf-disableuserselect');
            if (uiRef.current.selectStartPrevent) {
                document.removeEventListener('selectstart', uiRef.current.selectStartPrevent as EventListener, true);
            }
            uiRef.current.selectStartPrevent = null;
            setTimeout(() => { if (uiRef.current) { uiRef.current.skipClick = false; } }, 0);
        };

        uiRef.current.docMouseMove = handleDocMouseMove;
        uiRef.current.docMouseUp = handleDocMouseUp;

        return (): void => {
            if (uiRef.current.docMouseMove) {
                document.removeEventListener('mousemove', uiRef.current.docMouseMove as unknown as EventListener);
            }
            if (uiRef.current.docMouseUp) {
                document.removeEventListener('mouseup', uiRef.current.docMouseUp as unknown as EventListener);
            }
            // Ensure auto-scroll loop is stopped on cleanup
            if (uiRef.current.autoScrollRAF) {
                cancelAnimationFrame(uiRef.current.autoScrollRAF as number);
            }
            uiRef.current.autoScrollRAF = null;
            uiRef.current.autoScrollActive = false;
            uiRef.current.lastPointerX = null;
            uiRef.current.lastPointerY = null;
        };
    }, [getCellPositionFromElement, selectRange, selectionSettings, isValidCellPosition,
        getAffectedRowsFromCurrentRanges, updateCellStyles]);

    // Clear drag state and range state when page/data changes
    // In data-based mode (all selections), selections are preserved automatically
    useMemo(() => {
        // Data-based mode: preserve selections but clear drag and range state
        selectedRangesRef.current.length = 0;
        rangeStartCellRef.current = null;
        uiRef.current.isDragging = false;
        uiRef.current.dragStart = null;
        uiRef.current.dragIsCtrlPressed = false;
    }, [currentViewData]);

    // Pagination detection: Track page changes and reset flag when page changes
    // In data-based mode: selections are preserved automatically via primaryKey:fieldName format
    // Flag: hasNewSelectionWithoutCtrlRef tracks if last selection was made without Ctrl
    useEffect(() => {
        const inDataBasedMode: boolean = isCellSelectionEnabled();

        if (!inDataBasedMode || !currentViewData?.length) {
            previousPageDataRef.current = currentViewData;
            return;
        }

        // Detect if page has changed by comparing data array reference
        const isNewPage: boolean = previousPageDataRef.current !== currentViewData;

        if (isNewPage && hasNewSelectionWithoutCtrlRef.current) {
            // Page changed AND last selection was made without Ctrl
            // Reset flag for next page navigation
            hasNewSelectionWithoutCtrlRef.current = false;
        }

        // Update reference for next comparison
        previousPageDataRef.current = currentViewData;
    }, [currentViewData, isCellSelectionEnabled]);

    useEffect(() => {
        return () => {
            selectedCellsRef.current.clear();
            selectedRangesRef.current.length = 0;
            activeCellRef.current = null;
            rangeStartCellRef.current = null;
            uiRef.current.isDragging = false;
            uiRef.current.dragStart = null;
            uiRef.current.dragIsCtrlPressed = false;
        };
    }, []);

    return {
        selectCell,
        selectCells,
        selectRange,
        selectCellsByRange,
        selectCellByIndex,
        buildRowCellMap,
        clearCellSelection,
        getSelectedCellsData,
        getCellKey,
        getCellPositionFromElement,
        getRowDataByRowIndex,
        findRowIndexByKey,
        updateCellStyles,
        handleGridClick,
        handleGridMouseDown,
        handleKeyDown,
        activeCell: activeCellRef.current,
        selectedRanges: selectedRangesRef.current,
        selectedCells: selectedCellsRef.current,
        isDragging: uiRef.current.isDragging
    };
};
