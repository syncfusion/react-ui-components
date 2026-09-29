import { useCallback, RefObject, useEffect, useMemo, useRef, Dispatch, SetStateAction } from 'react';
import { CellSelectionModel } from '../types/cell-selection.interfaces';
import { FocusedCellInfo } from '../types/focus.interfaces';
import { UseDataResult, ValueType } from '../types/interfaces';
import { Clipboard, ClipboardSettings, ClipboardCopyEvent, ClipboardPasteEvent, ClipboardCutEvent } from '../types/clipboard.interfaces';
import { ColumnProps } from '../types/column.interfaces';
import { EditSettings } from '../types/edit.interfaces';
import { GridRef } from '../types/grid.interfaces';
import { selectionModule, SelectionSettings } from '../types/selection.interfaces';
import { RowCellInfo } from '../types/cell-selection.interfaces';
import { DataResult, DataUtil } from '@syncfusion/react-data';
import { GroupedData } from '../types/grouping.interfaces';
import { ColumnType } from '../types/enum';
import { UndoRedoAction, UndoRedoState, UseUndoRedoResult } from '../types/undoredo.interfaces';

/**
 * Custom hook to manage clipboard copy, paste, and cut operations.
 *
 * @template T T
 * @param {Object} options - Configuration options for clipboard support
 * @param {RefObject<GridRef<T>>} options.gridRef - Reference to the grid component
 * @param {T[]} options.currentViewData - Current view data for the active page or view
 * @param {ColumnProps[]} options.visibleColumns - Visible columns used for clipboard formatting
 * @param {SelectionSettings} [options.selectionSettings] - Selection configuration for copy, paste, and cut
 * @param {CellSelectionModel} [options.cellSelectionModule] - Cell selection model for clipboard operations
 * @param {selectionModule<T>} [options.selectionModule] - Selection module for row-based clipboard actions
 * @param {Function} [options.setRowData] - Callback used to update an entire row after clipboard edits
 * @param {EditSettings<T>} [options.editSettings] - Edit settings for the grid
 * @param {ClipboardSettings} [options.clipboardSettings] - Clipboard configuration options
 * @param {Function} [options.onClipboardCopy] - Callback fired when data is copied to clipboard
 * @param {Function} [options.onClipboardPaste] - Callback fired when data is pasted from clipboard
 * @param {Function} [options.onClipboardCut] - Callback fired when data is cut from clipboard
 * @param {Function} [options.setResponseData] - Callback to trigger aggregate recalculation after clipboard operations
 * @param {Dispatch<SetStateAction<GroupedData[]>>} setCurrentViewData - Setter for current view data
 * @returns {Clipboard} An object containing clipboard methods for copy, paste, and cut
 */

const useClipboard: <T>(options: {
    gridRef: RefObject<GridRef<T>>, currentViewData: T[], visibleColumns: ColumnProps[],
    selectionSettings?: SelectionSettings, cellSelectionModule?: CellSelectionModel,
    selectionModule?: selectionModule<T>, setRowData?: (key: string | number, data: T,
        isDataSourceChangeRequired?: boolean) => void, editSettings?: EditSettings<T>, clipboardSettings?: ClipboardSettings,
    onClipboardCopy?: (args: ClipboardCopyEvent) => void, onClipboardPaste?:
    (args: ClipboardPasteEvent) => void, onClipboardCut?: (args: ClipboardCutEvent) => void,
    setResponseData?: Dispatch<SetStateAction<Object>>, dataOperations: UseDataResult<T>,
    fieldOrderMap?: Map<string, number>, columnMap?: Map<string, ColumnProps<T>>;
    setCurrentViewData: Dispatch<SetStateAction<(GroupedData<T> | T)[]>>,
    undoRedoModule?: UseUndoRedoResult
}) => Clipboard = <T>(options: {
    gridRef: RefObject<GridRef<T>>, currentViewData: T[], visibleColumns: ColumnProps[], selectionSettings?: SelectionSettings,
    cellSelectionModule?: CellSelectionModel, selectionModule?: selectionModule<T>, setRowData?: (key: string | number, data: T,
        isDataSourceChangeRequired?: boolean) => void, editSettings?: EditSettings<T>, clipboardSettings?: ClipboardSettings,
    onClipboardCopy?: (args: ClipboardCopyEvent) => void, onClipboardPaste?: (args: ClipboardPasteEvent)
    => void, onClipboardCut?: (args: ClipboardCutEvent) => void,
    setResponseData?: Dispatch<SetStateAction<Object>>, dataOperations: UseDataResult<T>,
    fieldOrderMap?: Map<string, number>, columnMap?: Map<string, ColumnProps<T>>;
    setCurrentViewData: Dispatch<SetStateAction<(GroupedData<T> | T)[]>>,
    undoRedoModule?: UseUndoRedoResult
}) => {
    const { gridRef, currentViewData, visibleColumns, selectionSettings, cellSelectionModule,
        selectionModule, clipboardSettings, editSettings, onClipboardCopy, onClipboardPaste, onClipboardCut, fieldOrderMap, columnMap,
        setCurrentViewData, setResponseData, dataOperations, undoRedoModule } = options;
    const primaryKeyField: string | undefined = gridRef.current?.getColumns?.()?.find((column: ColumnProps) => column.isPrimaryKey)?.field;
    const visibleFieldColumns: ColumnProps[] = visibleColumns.filter((column: ColumnProps) =>
        !!column?.field && column?.type !== ColumnType.SingleGroup && column?.type !== ColumnType.Checkbox &&
        !column?.getCommandItems?.length && column?.type !== ColumnType.RowNumber &&
        column?.type !== ColumnType.RowDragAndDrop);
    const pastedCells: React.RefObject<Set<string>> = useRef<Set<string>>(new Set<string>());
    const isGroupingEnabled: boolean = gridRef.current?.groupSettings?.enabled;
    const isClipboardOperation: React.RefObject<boolean> = useRef<boolean>(false);

    // Sorts field names based on visible column order.
    const sortFieldsByVisibleColumnOrder: (fields: string[]) => string[] = useCallback(
        (fields: string[]): string[] =>
            [...fields].sort((a: string, b: string) =>
                (fieldOrderMap.get(a)) - (fieldOrderMap.get(b))
            ), [fieldOrderMap]
    );

    const columnIndexMap: Map<string, number> = useMemo(() => {
        const map: Map<string, number> = new Map<string, number>();
        visibleFieldColumns.forEach((column: ColumnProps, index: number) => {
            map.set(column.field as string, index);
        });

        return map;
    }, [visibleFieldColumns]);

    const rowKeyMap: Map<number, string | number> = useMemo(() => {
        const map: Map<number, string | number> = new Map<number, string | number>();
        if (!primaryKeyField) {
            return map;
        }

        currentViewData.forEach((rowData: T, index: number) => {
            const rowKey: unknown = DataUtil.getObject(primaryKeyField, rowData);
            if (rowKey !== undefined && rowKey !== null) {
                map.set(index, typeof rowKey === 'string' || typeof rowKey === 'number' ? rowKey : String(rowKey));
            }
        });
        return map;
    }, [currentViewData, primaryKeyField]);

    const rowIndexByKey: Map<string, number> = useMemo(() => {
        const map: Map<string, number> = new Map<string, number>();
        if (!primaryKeyField) {
            return map;
        }

        currentViewData.forEach((row: T, index: number) => {
            const key: unknown = DataUtil.getObject(primaryKeyField, row);

            if (key !== undefined && key !== null) {
                map.set(String(key), index);
            }
        });
        return map;
    }, [currentViewData, primaryKeyField]);

    // Finds the visible column that matches a field name.
    const findColumnByFieldName: (fieldName: string) => ColumnProps | undefined =
        useCallback((fieldName: string): ColumnProps | undefined => columnMap.get(fieldName), [columnMap]);

    const isGroupCaptionRowFocused: () => boolean = (): boolean => {
        const activeCell: HTMLElement | null = document.activeElement?.closest('.sf-cell') as HTMLElement;
        return !!activeCell?.closest('.sf-grid-groupcaptionrow');
    };

    // Gets focused cell info for clipboard operations
    const getFocusedCellInfo: () => { rowIndex: number; columnIndex: number; } | null =
    useCallback((): { rowIndex: number; columnIndex: number; } | null => {
        const focusedCell: FocusedCellInfo = gridRef.current?.focusModule?.getFocusedCell?.();
        if (!focusedCell || focusedCell.rowIndex < 0 || focusedCell.colIndex < 0) {
            return null;
        }

        return {
            rowIndex: focusedCell.virtualAriaRowIndex > 0
                ? focusedCell.virtualAriaRowIndex - 1
                : focusedCell.rowIndex,

            columnIndex: focusedCell.virtualAriaColIndex > 0
                ? focusedCell.virtualAriaColIndex - 1
                : focusedCell.colIndex
        };
    }, [gridRef]);

    // Extracts single focused cell as RowCellInfo for clipboard processing
    const getSingleCellForClipboard: () => RowCellInfo | null = useCallback((): RowCellInfo | null => {
        const focusedCell: { rowIndex: number; columnIndex: number } | null = getFocusedCellInfo();
        if (!focusedCell || focusedCell.rowIndex < 0 || focusedCell.columnIndex < 0) {
            return null;
        }

        const rowData: T | undefined = currentViewData[focusedCell.rowIndex];
        const column: ColumnProps | undefined = visibleColumns[focusedCell.columnIndex];
        if (!rowData || !column?.field) {
            return null;
        }
        const rowKey: unknown = DataUtil.getObject(primaryKeyField, rowData);
        const normalizedRowKey: string | number = typeof rowKey === 'string' || typeof rowKey === 'number' ? rowKey : String(rowKey);
        return {
            rowKey: normalizedRowKey,
            fieldNames: [column.field]
        };
    }, [getFocusedCellInfo, currentViewData, visibleColumns, primaryKeyField]);

    const saveClipboardBulkChanges: (records: T[], actionType?: UndoRedoAction<T>['actionType']) => Promise<boolean> =
    useCallback(async (records: T[], actionType: UndoRedoAction<T>['actionType'] = 'paste'): Promise<boolean> => {
        if (!records?.length) {
            return false;
        }

        const focusedCellInfo: FocusedCellInfo | undefined = gridRef.current?.focusModule?.getFocusedCell?.();
        const restoreRowIndex: number = focusedCellInfo?.rowIndex ?? -1;
        const restoreColIndex: number = focusedCellInfo?.colIndex ?? -1;
        const restoreMatrixType: 'Header' | 'Aggregate' | 'Content' = focusedCellInfo?.isHeader ? 'Header' :
            focusedCellInfo?.isAggregate ? 'Aggregate' : 'Content';
        const recordMap: Map<string, T> = new Map<string, T>();
        const previousRows: T[] = [];
        const rowIndices: number[] = [];
        const rowKeys: (string | number)[] = [];

        if (primaryKeyField) {
            records.forEach((record: T) => {
                // eslint-disable-next-line security/detect-object-injection
                const recordValue: unknown = (record as Record<string, unknown>)[primaryKeyField];
                if (recordValue !== undefined && recordValue !== null) {
                    recordMap.set(String(recordValue), record);
                    const rowIndex: number | undefined = rowIndexByKey.get(String(recordValue));
                    //eslint-disable-next-line security/detect-object-injection
                    const previousRow: GroupedData<T> | T | undefined = rowIndex === undefined ? undefined : currentViewData[rowIndex];
                    if (rowIndex !== undefined && previousRow && !(previousRow as GroupedData<T>).flattedKey) {
                        previousRows.push({ ...(previousRow as T) });
                        rowIndices.push(rowIndex);
                        rowKeys.push(recordValue as string | number);
                    }
                }
            });
        }

        try {
            isClipboardOperation.current = true;
            await dataOperations.getData({ requestType: 'save', data: records });

            if (undoRedoModule && editSettings?.allowUndoRedo && previousRows.length) {
                const previousState: UndoRedoState<T> = { rows: previousRows, rowIndices, rowKeys };
                const currentState: UndoRedoState<T> = { rows: records, rowIndices, rowKeys };
                const pasteAction: UndoRedoAction<T> = {
                    id: `${Date.now()}-${Math.random()}`,
                    actionType,
                    previousState,
                    currentState,
                    timestamp: Date.now()
                };
                undoRedoModule.recordAction(pasteAction);
            }

            if (setCurrentViewData) {
                if (primaryKeyField) {
                    setCurrentViewData((prevData: (GroupedData<T> | T)[]) => {
                        const nextData: (GroupedData<T> | T)[] = [...prevData];
                        records.forEach((record: T) => {
                            const key: unknown = DataUtil.getObject(primaryKeyField, record);
                            if (key === undefined || key === null) {
                                return;
                            }
                            const rowIndex: number | undefined = rowIndexByKey.get(String(key));
                            if (rowIndex !== undefined) {
                                //eslint-disable-next-line security/detect-object-injection
                                nextData[rowIndex] = { ...(nextData[rowIndex] as Record<string, unknown>), ...record } as
                                (GroupedData<T> | T);
                            }
                        });
                        return nextData;
                    });
                }
            }

            if (gridRef.current?.aggregates?.length && setResponseData) {
                setResponseData((prevData: Object) => {
                    const responseData: DataResult = prevData as DataResult;
                    const currentResult: T[] = Array.isArray(responseData.result) ? [...responseData.result as T[]] : [];
                    const nextResult: T[] = currentResult.map((rowData: T) => {
                        if (!primaryKeyField) {
                            return rowData;
                        }
                        // eslint-disable-next-line security/detect-object-injection
                        const rowValue: unknown = (rowData as Record<string, unknown>)[primaryKeyField];
                        const matchingRecord: T | undefined = rowValue !== undefined && rowValue !== null
                            ? recordMap.get(String(rowValue)) : undefined;
                        return matchingRecord ? { ...(rowData as Record<string, unknown>), ...matchingRecord } as T : rowData;
                    });
                    return { ...(responseData as Record<string, unknown>), aggregates: undefined, result: nextResult };
                });
            }

            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    if (restoreRowIndex >= 0 && restoreColIndex >= 0) {
                        gridRef.current?.focusModule?.navigateToCell?.(restoreRowIndex, restoreColIndex, restoreMatrixType);
                    }
                });
                isClipboardOperation.current = false;
            });
            return true;
        } catch (error) {
            isClipboardOperation.current = false;
            gridRef.current?.onError?.(error as Error);
            return false;
        }
    }, [dataOperations, gridRef, primaryKeyField, gridRef.current?.focusModule, setCurrentViewData, setResponseData,
        editSettings, undoRedoModule]);

    const buildUpdatedRow: (rowIndex: number, changedFields: Record<string, ValueType | null | undefined>, baseRowOverride?: T) =>
    T | null = useCallback((rowIndex: number, changedFields: Record<string, ValueType | null | undefined>, baseRowOverride?: T):
    T | null => {
        // eslint-disable-next-line security/detect-object-injection
        const baseRowData: T | undefined = baseRowOverride ?? currentViewData[rowIndex];
        const rowSource: T = baseRowData ?? ({} as T);
        const updatedRowData: T = { ...(rowSource as Record<string, unknown>) } as T;

        Object.entries(changedFields).forEach(
            ([fieldName, fieldValue]: [string, ValueType | null | undefined]) => {
                DataUtil.setValue(fieldName, fieldValue ?? null, updatedRowData as Record<string, unknown>);
            });
        return updatedRowData;
    }, [currentViewData]);

    // Validates a pasted value against the target column type.
    const validatePastedValue: (rawValue: string, column: ColumnProps | undefined) => { value: ValueType | null, isInvalid: boolean } =
        useCallback((rawValue: string, column: ColumnProps | undefined): { value: ValueType | null, isInvalid: boolean } => {
            if (!column || !rawValue) {
                return { value: null, isInvalid: false };
            }

            const trimmedValue: string = rawValue.trim();
            const columnType: string = column.type || 'string';
            switch (columnType) {
            case 'number': {
                const cleanedValue: string = trimmedValue.replace(/[^\d.\-+eE]/g, '');
                if (cleanedValue === '') {
                    return { value: 'invalid', isInvalid: true };
                }
                const numValue: number = parseFloat(cleanedValue);
                if (isNaN(numValue)) {
                    return { value: 'invalid', isInvalid: true };
                }
                return { value: numValue, isInvalid: false };
            }
            case 'boolean': {
                const lowerValue: string = trimmedValue.toLowerCase();
                if (lowerValue === 'true' || lowerValue === '1') {
                    return { value: true, isInvalid: false };
                } else if (lowerValue === 'false' || lowerValue === '0') {
                    return { value: false, isInvalid: false };
                }
                return { value: 'invalid', isInvalid: true };
            }
            case 'date':
            case 'dateonly': {
                const dateValue: Date = new Date(trimmedValue);
                if (isNaN(dateValue.getTime())) {
                    return { value: 'invalid', isInvalid: true };
                }
                return { value: dateValue, isInvalid: false };
            }
            case 'datetime':
            case 'dateTime': {
                const dateTimeValue: Date = new Date(trimmedValue);
                if (isNaN(dateTimeValue.getTime())) {
                    return { value: 'invalid', isInvalid: true };
                }
                return { value: dateTimeValue.toISOString(), isInvalid: false };
            }
            default:
                return { value: trimmedValue, isInvalid: false };
            }
        }, []);

    // Returns the display text for a cell using the column formatter when available.
    const getDisplayValue: (rowData: T | undefined, column: ColumnProps | undefined) => string =
        useCallback((rowData: T | undefined, column: ColumnProps | undefined): string => {
            if (!rowData || !column) {
                return '';
            }
            const value: string | number | boolean | null | undefined =
            DataUtil.getObject(column.field, rowData)as string | number | boolean | null | undefined;
            if (value === null || value === undefined) {
                return '';
            }

            const formatFn: Function = column?.formatFn;
            if (formatFn) {
                try {
                    const formattedValue: string = formatFn(value).toString();
                    return formattedValue;
                } catch {
                    // If formatting fails, fall back to string conversion
                    return String(value);
                }
            }
            return String(value);
        }, []);

    // Applies a temporary visual effect to the selected cells after clipboard actions.
    const applyClipboardVisualEffect: (className: string, cellsToHighlight?: HTMLElement[]) =>
    void = useCallback((className: string, cellsToHighlight?: HTMLElement[]): void => {
        let cells: HTMLElement[] = cellsToHighlight ?? (selectionSettings?.type === 'Row'
            ? Array.from(gridRef.current?.element.querySelectorAll('.sf-grid-content-row .sf-cell.sf-active'))
            : Array.from(gridRef.current?.element.querySelectorAll('.sf-grid-content-row .sf-cell.sf-cell-selected')));
        if (!cells.length) {
            cells = Array.from(gridRef.current?.element.querySelectorAll('.sf-grid-content-row .sf-cell.sf-focused'));
        }
        cells.forEach((cell: HTMLElement) => cell.classList.add(className));
        setTimeout(() => cells.forEach((cell: HTMLElement) => cell.classList.remove(className)), 400);
    }, [selectionSettings?.type]);

    const getPastedCells: () => HTMLElement[] = useCallback((): HTMLElement[] => {
        const gridElement: HTMLElement | null = gridRef.current?.element;
        if (!gridElement) {
            return [];
        }
        const result: HTMLElement[] = [];
        pastedCells.current.forEach((key: string) => {
            const [rowIndex, columnIndex] = key.split(':').map(Number);
            const cell: HTMLElement | null = gridElement.querySelector(`.sf-grid-content-row[aria-rowindex="${rowIndex + 1}"] [aria-colindex="${columnIndex + 1}"]`);
            if (cell) {
                result.push(cell);
            }
        });

        return result;
    }, [gridRef]);

    const highlightPastedCells: () => void = useCallback((): void => {
        if (!pastedCells.current.size) {
            return;
        }

        setTimeout(() => {
            const cells: HTMLElement[] = getPastedCells();
            if (cells.length) {
                applyClipboardVisualEffect('sf-clipboard-feedback', cells);
            }
            pastedCells.current.clear();
        }, 0);
    }, [getPastedCells, applyClipboardVisualEffect]);

    // Checks whether the current selection forms a contiguous rectangular range.
    const isRectangularSelection: () => boolean = useCallback((): boolean => {
        const positionMap: Map<number, Set<number>> = cellSelectionModule?.buildSelectedCellPositionMap?.();
        if (!positionMap || positionMap.size <= 1) {
            return true;
        }
        const rows: number[] = Array.from(positionMap.keys());

        // Rows must be continuous
        for (let i: number = 1; i < rows.length; i++) {
            // eslint-disable-next-line security/detect-object-injection
            if (rows[i] !== rows[i - 1] + 1) {
                return false;
            }
        }
        let commonMinCol: number | null = null;
        let commonMaxCol: number | null = null;
        for (const row of rows) {
            const cols: number[] = Array.from(positionMap.get(row));

            // Columns within row must be continuous
            for (let i: number = 1; i < cols.length; i++) {
                // eslint-disable-next-line security/detect-object-injection
                if (cols[i] !== cols[i - 1] + 1) {
                    return false;
                }
            }

            const minCol: number = cols[0];
            const maxCol: number = cols[cols.length - 1];
            if (commonMinCol === null) {
                commonMinCol = minCol;
                commonMaxCol = maxCol;
            } else {
                if (minCol > commonMaxCol || maxCol < commonMinCol) {
                    return false;
                }
                if (minCol === commonMinCol && maxCol < commonMaxCol && minCol > 0) {
                    return false;
                }
                commonMinCol = Math.max(commonMinCol, minCol);
                commonMaxCol = Math.min(commonMaxCol, maxCol);
            }
        }
        return true;
    }, [cellSelectionModule]);

    // Copies a rectangular selection into tab-separated text for clipboard use.
    const copyRectangularSelection: (selectedCells: RowCellInfo[], withHeaders: boolean,
        rowKeyToIndexMap?: Map<string | number, number>) => string = useCallback((selectedCells:
    RowCellInfo[], withHeaders: boolean, rowKeyToIndexMap?: Map<string | number, number>): string => {
        // Group by row to preserve structure
        const cellsByRowIndex: Map<number, RowCellInfo[]> = new Map<number, RowCellInfo[]>();
        selectedCells.forEach((cell: RowCellInfo) => {

            const normalizedRowKey: string = String(cell.rowKey);
            const rowIndex: number | undefined = rowKeyToIndexMap.get(normalizedRowKey);
            if (rowIndex !== -1) {
                if (!cellsByRowIndex.has(rowIndex)) {
                    cellsByRowIndex.set(rowIndex, []);
                }
                cellsByRowIndex.get(rowIndex)?.push(cell);
            }
        });
        const sortedRowIndexes: number[] = Array.from(cellsByRowIndex.keys()).sort((a: number, b: number) => a - b);
        // Get unique columns and sort by visibleColumns position
        const allColumns: Set<string> = new Set<string>();
        selectedCells.forEach((cell: RowCellInfo) => {
            cell.fieldNames.forEach((field: string) => allColumns.add(field));
        });

        const sortedColumns: string[] = sortFieldsByVisibleColumnOrder(Array.from(allColumns));
        const dataRows: string[] = sortedRowIndexes.map((rowIndex: number) => {
            const cellsInRow: RowCellInfo[] = cellsByRowIndex.get(rowIndex);
            const fieldSet: Set<string> = new Set<string>();

            cellsInRow.forEach((cell: RowCellInfo) => {
                cell.fieldNames.forEach((field: string) => {
                    fieldSet.add(field);
                });
            });

            // eslint-disable-next-line security/detect-object-injection
            const rowData: T | undefined = currentViewData[rowIndex];

            return sortedColumns
                .map((fieldName: string) => {
                    const column: ColumnProps | undefined = findColumnByFieldName(fieldName);
                    return fieldSet.has(fieldName) ? getDisplayValue(rowData, column) : '';
                })
                .join('\t');
        });
        if (withHeaders) {
            const headerRow: string = sortedColumns
                .map((fieldName: string) => {
                    const column: ColumnProps | undefined = findColumnByFieldName(fieldName);
                    return column?.headerText ?? column?.field;
                })
                .join('\t');
            return [headerRow, ...dataRows.filter((row: string) => row.length > 0)].join('\n');
        }
        return dataRows.join('\n');
    }, [currentViewData, getDisplayValue, findColumnByFieldName, sortFieldsByVisibleColumnOrder]);

    // Copies a scattered selection into newline-separated text without tabular formatting.
    const copyScatteredSelection: (selectedCells: RowCellInfo[], withHeaders: boolean,
        rowKeyToIndexMap?: Map<string | number, number>) => string = useCallback((selectedCells:
    RowCellInfo[], withHeaders: boolean, rowKeyToIndexMap?: Map<string | number, number>): string => {
        const outputLines: string[] = [];
        selectedCells.forEach((cell: RowCellInfo) => {
            const normalizedRowKey: string = String(cell.rowKey);
            const rowIndex: number | undefined = rowKeyToIndexMap.get(normalizedRowKey);
            if (rowIndex === -1) {
                return;
            }

            // eslint-disable-next-line security/detect-object-injection
            const rowData: T = currentViewData[rowIndex];
            cell.fieldNames.forEach((fieldName: string) => {
                const column: ColumnProps | undefined = findColumnByFieldName(fieldName);
                if (withHeaders && column) {
                    const headerText: string = column.headerText ?? column.field;
                    outputLines.push(headerText);
                }
                const cellValue: string = getDisplayValue(rowData, column);
                outputLines.push(cellValue);
            });
        });

        return outputLines.join('\n');
    }, [getDisplayValue, currentViewData, findColumnByFieldName]);

    // Copies the current selection to the clipboard using the browser clipboard API.
    const copyToClipboard: (withHeaders?: boolean) => Promise<void> =
    useCallback(async (withHeaders: boolean = false): Promise<void> => {
        if (!gridRef.current || clipboardSettings?.enabled === false || !primaryKeyField ||
        (isGroupingEnabled && isGroupCaptionRowFocused())) {
            return;
        }
        const includeHeaders: boolean = withHeaders || clipboardSettings?.copyWithHeaders === true;
        let clipboardText: string = '';
        let selectedCells: RowCellInfo[] = [];
        let selectedRows: number[] = [];

        // Check if focused cell exists (direct cell focus via Tab navigation)
        if (selectionSettings?.enabled) {
            // Get actual selections if enabled
            if (selectionSettings.type === 'Cell') {
                selectedCells = cellSelectionModule.getSelectedCellsData();
            } else if (selectionSettings.type === 'Row' && clipboardSettings?.allowRowCopy) {
                selectedRows = selectionModule?.getSelectedRowIndexes?.();
            }
            else {
                selectedRows = selectionModule?.getSelectedRowIndexes?.();
            }
        }
        // If focused cell exists and no selection, use focused cell directly
        if (selectedRows.length && !clipboardSettings?.allowRowCopy) {
            selectedRows = [];
            const focusedCell: RowCellInfo | null = getSingleCellForClipboard();
            if (focusedCell) {
                selectedCells = [focusedCell];
            }
        }
        else if (!selectedCells.length && !selectedRows.length) {
            const focusedCell: RowCellInfo | null = getSingleCellForClipboard();
            if (focusedCell) {
                selectedCells = [focusedCell];
            }
        }

        if (selectedCells.length) {
            const rowKeyToIndexMap: Map<string | number, number> = cellSelectionModule?.buildRowKeyToIndexMap?.();
            // Determine if selection is rectangular or scattered
            const rectangular: boolean = isRectangularSelection();
            clipboardText = rectangular ? copyRectangularSelection(selectedCells, includeHeaders, rowKeyToIndexMap)
                : copyScatteredSelection(selectedCells, includeHeaders, rowKeyToIndexMap);
        }
        else if (selectedRows.length) {
            selectedRows = selectedRows.sort((a: number, b: number) => a - b);
            const rowValues: string[] = selectedRows.map((rowIndex: number) => {
                // eslint-disable-next-line security/detect-object-injection
                const rowData: T | undefined = currentViewData?.[rowIndex];
                return visibleFieldColumns
                    .map((column: ColumnProps) => getDisplayValue(rowData, column))
                    .join('\t');
            });
            if (includeHeaders) {
                const headerRow: string = visibleFieldColumns
                    .map((column: ColumnProps) => column.headerText ?? column.field)
                    .join('\t');
                clipboardText = [headerRow, ...rowValues.filter((rowText: string) => rowText.length > 0)].join('\n');
            } else {
                clipboardText = rowValues.join('\n');
            }
        }
        if (!clipboardText) {
            return;
        }
        // Fire clipboard copy event before writing to clipboard
        const copyEvent: ClipboardCopyEvent = {
            selectionType: selectionSettings?.type as 'Cell' | 'Row' | undefined,
            clipboardText,
            copyWithHeaders: includeHeaders,
            selectedRowIndexes: selectedRows,
            selectedCells: selectedCells,
            cancel: false
        };

        onClipboardCopy?.(copyEvent);
        // Return early if event was cancelled
        if (copyEvent.cancel) {
            return;
        }
        if (navigator?.clipboard?.writeText) {
            await navigator?.clipboard?.writeText(copyEvent.clipboardText ?? clipboardText);
            if (selectionSettings?.type === 'Row' && !clipboardSettings?.allowRowCopy) {
                const focusedCellElement: HTMLElement | null = gridRef.current?.element.querySelector('.sf-grid-content-row .sf-cell.sf-focused');
                if (focusedCellElement) {
                    applyClipboardVisualEffect('sf-clipboard-feedback', [focusedCellElement]);
                }
            } else {
                applyClipboardVisualEffect('sf-clipboard-feedback');
            }
        }
    }, [cellSelectionModule, currentViewData, getDisplayValue, gridRef, selectionModule, selectionSettings, visibleColumns,
        isRectangularSelection, copyRectangularSelection, copyScatteredSelection, applyClipboardVisualEffect, clipboardSettings,
        onClipboardCopy]);

    // Extracts the row key for a visible row index.
    // Supports nested primary key field paths using dot notation.
    const getAndNormalizeRowKey: (rowIndex: number) => string | number | null = useCallback((rowIndex: number): string | number | null => {
        if (rowIndex < 0 || rowIndex >= currentViewData.length) {
            return null;
        }
        return rowKeyMap.get(rowIndex);
    }, [currentViewData.length, rowKeyMap]);

    // Pastes a clipboard matrix into the selected rows.
    const pasteIntoMultipleRows: (matrix: string[][]) => Promise<void> = useCallback(async (matrix: string[][]): Promise<void> => {
        const selectedRows: number[] = selectionModule.getSelectedRowIndexes();
        const selectedRowIndices: number[] = selectedRows.sort((a: number, b: number) => a - b);
        if (selectedRowIndices.length === 0) {
            return;
        }
        const copiedRowCount: number = matrix.length;
        const selectedRowCount: number = selectedRowIndices.length;
        const rowsToPaste: number = copiedRowCount > 1 ? Math.ceil(selectedRowCount / copiedRowCount) * copiedRowCount : selectedRowCount;
        const startRowIndex: number = selectedRowIndices[0];
        const updatedRecords: T[] = [];
        const pendingNewRecords: Array<{ data: T; index: number }> = [];
        let appendedRowCount: number = 0;
        for (let pasteIndex: number = 0; pasteIndex < rowsToPaste; pasteIndex++) {
            const targetRowIndex: number = startRowIndex + pasteIndex;
            const matrixRow: string[] = matrix[pasteIndex % copiedRowCount];
            const rowChanges: Record<string, ValueType | null | undefined> = {};

            let clipboardIndex: number = 0;
            visibleFieldColumns.forEach((targetColumn: ColumnProps) => {
                //eslint-disable-next-line security/detect-object-injection
                const rawCellValue: string | undefined = matrixRow[clipboardIndex];
                if ((targetColumn.isPrimaryKey && !(targetRowIndex >= currentViewData.length)) || rawCellValue === undefined) {
                    return;
                }

                clipboardIndex++;
                if (targetColumn.isPrimaryKey) {
                    return;
                }
                const { value: cellValue } = validatePastedValue(rawCellValue, targetColumn);
                rowChanges[targetColumn.field as string] = cellValue;
                const actualColumnIndex: number = visibleColumns.findIndex((col: ColumnProps) => col.field === targetColumn.field);
                if (actualColumnIndex !== -1) {
                    const cellElement: HTMLElement | null =
                        gridRef.current?.element.querySelector(`.sf-grid-content-row[aria-rowindex="${targetRowIndex + 1}"] [aria-colindex="${actualColumnIndex + 1}"]`);

                    if (cellElement) {
                        const rowKey: string | number | null = getAndNormalizeRowKey(targetRowIndex);
                        if (rowKey !== null) {
                            pastedCells.current.add(`${targetRowIndex}:${actualColumnIndex}`);
                        }
                    }
                }
            });

            if (Object.keys(rowChanges).length) {
                const updatedRecord: T | null = buildUpdatedRow(targetRowIndex, rowChanges);
                if (targetRowIndex >= currentViewData.length) {
                    pendingNewRecords.push({ data: updatedRecord as T, index: currentViewData.length + appendedRowCount });
                    appendedRowCount++;
                } else if (updatedRecord) {
                    updatedRecords.push(updatedRecord);
                }
            }
        }
        if (updatedRecords.length) {
            await saveClipboardBulkChanges(updatedRecords);
        }
        if (options.editSettings?.allowAdd) {
            pendingNewRecords.forEach((record: { data: T; index: number }) => {
                gridRef.current?.editModule?.addRecord?.(record.data, record.index);
            });
        }
    }, [currentViewData, gridRef, validatePastedValue, visibleColumns, getAndNormalizeRowKey]);

    // Pastes a clipboard matrix from a single anchor cell into a rectangular region.
    const pasteMatrixFromAnchor: (anchorRowIndex: number, anchorFieldName: string, matrix: string[][], rowState?: Map<number, T>) =>
    Promise<T[]> = useCallback(async (anchorRowIndex: number, anchorFieldName: string, matrix: string[][], rowState?:
    Map<number, T>): Promise<T[]> => {

        const anchorColIndex: number = columnIndexMap.get(anchorFieldName) ?? -1;
        const firstRowLength: number = matrix[0]?.length ?? 0;
        const updatedRecords: T[] = [];
        const pendingNewRecords: Array<{ data: T; index: number }> = [];
        let appendedRowCount: number = 0;
        for (let matrixRowIdx: number = 0; matrixRowIdx < matrix.length; matrixRowIdx++) {
            const targetRowIndex: number = anchorRowIndex + matrixRowIdx;
            if (targetRowIndex >= currentViewData.length && targetRowIndex < 0) {
                continue;
            }

            // eslint-disable-next-line security/detect-object-injection
            const matrixRow: string[] = matrix[matrixRowIdx];
            const rowChanges: Record<string, ValueType | null | undefined> = {};
            const startColumn: number = matrixRowIdx > 0 && matrixRow.length !== firstRowLength ? 0 : anchorColIndex;
            let matrixColIdx: number = 0;
            let targetColIndex: number = startColumn;
            while (matrixColIdx < matrixRow.length && targetColIndex < visibleFieldColumns.length) {
                //eslint-disable-next-line security/detect-object-injection
                const targetColumn: ColumnProps = visibleFieldColumns[targetColIndex];
                //eslint-disable-next-line security/detect-object-injection
                const rawCellValue: string = matrixRow[matrixColIdx];
                if (rawCellValue === '' || (targetColumn.isPrimaryKey && !(targetRowIndex >= currentViewData.length))) {
                    targetColIndex++;
                    continue;
                }
                matrixColIdx++;
                targetColIndex++;

                const { value: cellValue } = validatePastedValue(rawCellValue, targetColumn);
                rowChanges[targetColumn.field as string] = cellValue;

                const actualColumnIndex: number = visibleColumns.findIndex((col: ColumnProps) => col.field === targetColumn.field);
                if (actualColumnIndex !== -1) {
                    const cellElement: HTMLElement | null =
                        gridRef.current?.element.querySelector(`.sf-grid-content-row[aria-rowindex="${targetRowIndex + 1}"] [aria-colindex="${actualColumnIndex + 1}"]`);
                    if (cellElement) {
                        pastedCells.current.add(`${targetRowIndex}:${actualColumnIndex}`);
                    }
                }
            }

            if (Object.keys(rowChanges).length) {
                const updatedRecord: T | null = buildUpdatedRow(targetRowIndex, rowChanges, rowState?.get(targetRowIndex));
                if (targetRowIndex >= currentViewData.length) {
                    pendingNewRecords.push({ data: updatedRecord as T, index: currentViewData.length + appendedRowCount });
                    appendedRowCount++;
                } else if (updatedRecord) {
                    rowState?.set(targetRowIndex, updatedRecord);
                    updatedRecords.push(updatedRecord);
                }
            }
        }
        if (options.editSettings?.allowAdd) {
            pendingNewRecords.forEach((record: { data: T; index: number }) => {
                gridRef.current?.editModule?.addRecord?.(record.data, record.index);
            });
        }
        return updatedRecords;
    }, [currentViewData, validatePastedValue, visibleColumns, getAndNormalizeRowKey, columnIndexMap]);

    // Applies the copied matrix starting from each selected cell used as a paste anchor.
    const pasteMatrixToSelectedAnchors: (matrix: string[][]) => Promise<void> = useCallback(async (matrix: string[][]): Promise<void> => {
        const positionMap: Map<number, Set<number>> = cellSelectionModule?.buildSelectedCellPositionMap?.();
        const rowState: Map<number, T> = new Map<number, T>();
        for (const [rowIndex, columns] of positionMap.entries()) {

            const sortedColumns: number[] = Array.from(columns).sort((a: number, b: number) => a - b);
            for (const columnIndex of sortedColumns) {
                // eslint-disable-next-line security/detect-object-injection
                const fieldName: string | undefined = visibleFieldColumns[columnIndex]?.field;
                if (!fieldName) {
                    continue;
                }
                await pasteMatrixFromAnchor(rowIndex, fieldName, matrix, rowState);
            }
        }

        const finalRecords: T[] = Array.from(rowState.values());
        if (finalRecords.length) {
            await saveClipboardBulkChanges(finalRecords);
        }
    }, [cellSelectionModule, visibleFieldColumns, pasteMatrixFromAnchor, saveClipboardBulkChanges]);

    // Pastes a clipboard matrix into each selected cell independently.
    const pasteIntoMultipleCells: (matrix: string[][]) => Promise<void> = useCallback(async (matrix: string[][]): Promise<void> => {
        const rowKeyToIndexMap: Map<string | number, number> = cellSelectionModule?.buildRowKeyToIndexMap?.();
        let selectedCells: RowCellInfo[] = [...(cellSelectionModule?.getSelectedCellsData?.())];
        if (!selectedCells.length) {
            const focusedClipboardCell: RowCellInfo | null = getSingleCellForClipboard();
            if (focusedClipboardCell) {
                selectedCells = [focusedClipboardCell];
            }
        }
        selectedCells.sort((a: RowCellInfo, b: RowCellInfo) => {
            const rowA: number | undefined = rowKeyToIndexMap.get(String(a.rowKey));
            const rowB: number | undefined = rowKeyToIndexMap.get(String(b.rowKey));
            return rowA - rowB;
        });

        if (!matrix.length || !matrix[0].length || !selectedCells.length) {
            return;
        }
        const positionMap: Map<number, Set<number>> = cellSelectionModule?.buildSelectedCellPositionMap?.();
        const selectedPositionCount: number = Array.from(positionMap?.values()).reduce((count: number, cols: Set<number>) =>
            count + cols.size, 0);
        const isFocusedCellOnly: boolean = selectedCells.length === 1 && selectedPositionCount === 0;
        const copiedCellCount: number = matrix.reduce((count: number, row: string[]) => count + row.length, 0);

        if ((selectedPositionCount === 1 || isFocusedCellOnly) && copiedCellCount > 1) {
            const selectedCell: RowCellInfo = selectedCells[0];
            const anchorRowIndex: number = rowKeyToIndexMap.get(String(selectedCell.rowKey));
            if (anchorRowIndex !== undefined && anchorRowIndex !== -1) {
                const sortedFieldNames: string[] = sortFieldsByVisibleColumnOrder(selectedCell.fieldNames);
                const updatedRecords: T[] = await pasteMatrixFromAnchor(anchorRowIndex, sortedFieldNames[0], matrix);
                await saveClipboardBulkChanges(updatedRecords);
            }
            return;
        }

        const singleValuePaste: boolean = matrix.length === 1 && matrix[0].length === 1;
        if (singleValuePaste && selectedPositionCount > 1) {
            await pasteMatrixToSelectedAnchors(matrix);
            return;
        }

        const scatteredDestination: boolean = !isRectangularSelection();
        if (scatteredDestination && copiedCellCount > 1) {
            await pasteMatrixToSelectedAnchors(matrix);
            return;
        }
        const singleColumnClipboard: boolean = matrix.length > 1 && matrix.every((row: string[]) => row.length === 1);
        const firstSelectedField: string = sortFieldsByVisibleColumnOrder(selectedCells[0].fieldNames)[0];
        const singleColumnSelection: boolean = selectedPositionCount > 1 && selectedCells.every((cell: RowCellInfo) =>
            sortFieldsByVisibleColumnOrder(cell.fieldNames)[0] === firstSelectedField);

        if (singleColumnClipboard && singleColumnSelection) {
            const anchorRowIndex: number | undefined = rowKeyToIndexMap.get(String(selectedCells[0].rowKey));

            if (anchorRowIndex !== undefined && anchorRowIndex !== -1) {
                const expandedMatrix: string[][] = [[matrix[0][0]], ...matrix];
                const updatedRecords: T[] = await pasteMatrixFromAnchor(anchorRowIndex, firstSelectedField, expandedMatrix);
                await saveClipboardBulkChanges(updatedRecords);
            }
            return;
        }
        const allUpdatedRecords: T[] = [];
        for (const [index, selectedCell] of selectedCells.entries()) {
            const normalizedRowKey: string = String(selectedCell.rowKey);
            const anchorRowIndex: number = rowKeyToIndexMap.get(normalizedRowKey);

            if (anchorRowIndex === -1) {
                continue;
            }
            const sortedFieldNames: string[] = sortFieldsByVisibleColumnOrder(selectedCell.fieldNames);
            const matrixToPaste: string[][] = [matrix[index % matrix.length]];
            const updatedRecords: T[] = await pasteMatrixFromAnchor(anchorRowIndex, sortedFieldNames[0], matrixToPaste);
            allUpdatedRecords.push(...updatedRecords);
        }

        if (allUpdatedRecords.length) {
            await saveClipboardBulkChanges(allUpdatedRecords);
        }
    }, [cellSelectionModule, visibleFieldColumns, pasteMatrixFromAnchor, isRectangularSelection, sortFieldsByVisibleColumnOrder]);

    // Applies pasted clipboard text to the current selection.
    const pasteFromClipboard: (clipboardText: string) => Promise<void> = useCallback(async (clipboardText: string): Promise<void> => {
        const rows: string[] = clipboardText.split(/\r?\n/).filter((rowText: string) => rowText.length > 0);
        const matrix: string[][] = rows.map((rowText: string) => {
            const columns: string[] = rowText.split('\t');
            const firstValueIndex: number = columns.findIndex((value: string) => value !== '');
            return firstValueIndex === -1 ? [] : columns.slice(firstValueIndex);
        });
        if (matrix.length === 0) {
            return;
        }

        // Check for focused cell/row first (direct focus via Tab)
        const focusedCell: { rowIndex: number; columnIndex: number } = getFocusedCellInfo();

        // Get selections as fallback
        const selectedRows: number[] = selectionModule?.getSelectedRowIndexes?.();
        let selectedCells: RowCellInfo[] = cellSelectionModule?.getSelectedCellsData?.();

        // Determine paste target and start position
        let startRowIndex: number = -1;
        let startColumnIndex: number = -1;

        if (selectedRows.length) {
            startRowIndex = Math.min(...selectedRows);
        } else if (selectedCells.length) {
            if (cellSelectionModule?.activeCell) {
                startRowIndex = cellSelectionModule.activeCell.rowIndex;
                startColumnIndex = cellSelectionModule.activeCell.columnIndex;
            }
        }
        if (!selectedCells.length && !selectedRows.length || (selectedRows.length && !clipboardSettings?.allowRowCopy)) {
            if (focusedCell) {
                const focusedClipboardCell: RowCellInfo | null = getSingleCellForClipboard();
                if (focusedClipboardCell) {
                    selectedCells = [focusedClipboardCell];
                }
                startRowIndex = focusedCell.rowIndex;
                startColumnIndex = focusedCell.columnIndex;

            }
        }

        // Fire clipboard paste event before applying data
        const pasteEvent: ClipboardPasteEvent = {
            selectionType: selectionSettings?.type as 'Cell' | 'Row' | undefined,
            clipboardText,
            startRowIndex,
            startColumnIndex,
            pasteMatrix: matrix,
            cancel: false
        };
        onClipboardPaste?.(pasteEvent);
        // Return early if event was cancelled
        if (pasteEvent.cancel) {
            return;
        }

        // Reset tracked affected cells for this paste operation
        pastedCells.current.clear();
        if (selectedRows.length && clipboardSettings?.allowRowCopy) {
            // Row selection keeps existing behavior - await to ensure all rows are pasted
            await pasteIntoMultipleRows(matrix);
            highlightPastedCells();
        } else if (focusedCell || selectedCells.length > 0 || (selectedRows.length && !clipboardSettings?.allowRowCopy)) {
            // Track all actual target cells updated during paste and highlight them - await to ensure all cells are pasted
            await pasteIntoMultipleCells(matrix);
            highlightPastedCells();
        }
    }, [selectionSettings?.type, pasteIntoMultipleRows, pasteIntoMultipleCells, cellSelectionModule, selectionModule, onClipboardPaste]);

    // Handles paste events and applies clipboard content to the active selection.
    const handlePaste: (event: ClipboardEvent) => void = useCallback((event: ClipboardEvent): void => {
        const activeRowCell: HTMLElement | null = (document.activeElement)?.closest('.sf-grid-content-row .sf-cell');
        const headerCheckbox: HTMLElement | null = (document.activeElement)?.closest('.sf-grid-checkselectall');
        const clipboardText: string = event.clipboardData?.getData('text/plain');
        if (gridRef.current?.editModule?.isEdit || (!activeRowCell && !headerCheckbox) || clipboardSettings?.enabled === false
        || clipboardSettings?.allowPaste === false || !clipboardText || !primaryKeyField ||
        (isGroupingEnabled && isGroupCaptionRowFocused()) || !gridRef.current?.editSettings?.allowEdit) {
            return;
        }

        event.preventDefault();
        // Fire and forget async paste operation - don't block the event handler
        void pasteFromClipboard(clipboardText);
    }, [pasteFromClipboard, gridRef, selectionSettings, cellSelectionModule, selectionModule, clipboardSettings?.allowPaste]);

    // Clears selected editable cells, excluding primary key columns.
    const clearSelectedCells: (selectedCells: RowCellInfo[], rowKeyToIndexMap: Map<string | number, number>) =>
    Promise<void> = useCallback(async (selectedCells: RowCellInfo[], rowKeyToIndexMap: Map<string | number, number>):
    Promise<void> => {
        const rowChangesMap: Map<number, Record<string, ValueType | null>> = new Map();
        selectedCells.forEach((cell: RowCellInfo) => {
            const rowIndex: number | undefined = rowKeyToIndexMap.get(String(cell.rowKey));
            if (rowIndex === undefined || rowIndex === -1) {
                return;
            }
            let changes: Record<string, ValueType | null> = rowChangesMap.get(rowIndex);
            if (!changes) {
                changes = {};
                rowChangesMap.set(rowIndex, changes);
            }

            cell.fieldNames.forEach((fieldName: string) => {

                if (fieldName === primaryKeyField) {
                    return;
                }
                const column: ColumnProps | undefined = findColumnByFieldName(fieldName);
                if (column && !column.isPrimaryKey) {
                    // eslint-disable-next-line security/detect-object-injection
                    changes[fieldName] = null;
                }
            });
        });
        const updatedRecords: T[] = [];
        rowChangesMap.forEach((changes: Record<string, ValueType | null>, rowIndex: number) => {
            // eslint-disable-next-line security/detect-object-injection
            const baseRowData: T | undefined = currentViewData[rowIndex];
            if (!baseRowData) {
                return;
            }

            const updatedRowData: T = { ...(baseRowData as Record<string, unknown>) } as T;
            Object.entries(changes).forEach(([field, value]: [string, ValueType | null]) => {
                DataUtil.setValue(field, value, updatedRowData as Record<string, unknown>);

            });
            updatedRecords.push(updatedRowData);
        });

        await saveClipboardBulkChanges(updatedRecords, 'cut');

    }, [currentViewData, primaryKeyField, findColumnByFieldName, saveClipboardBulkChanges]);

    // Clears editable fields in selected rows, excluding primary key columns.
    const clearSelectedRows: (selectedRowIndexes: number[]) => Promise<void> =
    useCallback(async (selectedRowIndexes: number[]): Promise<void> => {
        const updatedRecords: T[] = [];
        for (const rowIndex of selectedRowIndexes) {
            const rowKey: string | number | null = getAndNormalizeRowKey(rowIndex);

            if (rowIndex < 0 || rowIndex >= currentViewData.length || rowKey === null) {
                continue;
            }
            // eslint-disable-next-line security/detect-object-injection
            const baseRowData: T = currentViewData[rowIndex];
            const updatedRowData: T = { ...(baseRowData as Record<string, unknown>) } as T;

            visibleFieldColumns.filter((col: ColumnProps) => col.field && col.field !== primaryKeyField && !col.isPrimaryKey)
                .forEach((col: ColumnProps) => {
                    DataUtil.setValue(col.field as string, null, updatedRowData as Record<string, unknown>);
                });
            updatedRecords.push(updatedRowData);
        }
        await saveClipboardBulkChanges(updatedRecords, 'cut');

    }, [currentViewData, visibleFieldColumns, primaryKeyField, getAndNormalizeRowKey, saveClipboardBulkChanges]);

    // Cuts selected cells or rows: copies to clipboard and clears the selected editable cells.
    const cutToClipboard: () => Promise<void> =
    useCallback(async (): Promise<void> => {
        const focusedCell: RowCellInfo | null = getSingleCellForClipboard();
        const selectedRows: number[] = selectionModule?.getSelectedRowIndexes?.();
        let selectedCells: RowCellInfo[] = cellSelectionModule?.getSelectedCellsData?.();

        if (selectedRows.length === 0 && selectedCells.length === 0 && !focusedCell) {
            return;
        }

        // Use focus if available, otherwise use selection
        if (!selectedCells.length && !selectedRows.length && focusedCell || (focusedCell && selectedRows.length
            && !clipboardSettings?.allowRowCopy)) {
            selectedCells = [focusedCell];
        }
        const includeHeaders: boolean = clipboardSettings?.copyWithHeaders === true;
        const rowKeyToIndexMap: Map<string | number, number> | undefined = cellSelectionModule?.buildRowKeyToIndexMap?.();
        // First, perform the copy operation
        try {
            await copyToClipboard(includeHeaders);
        } catch {
            // If copy fails, abort cut operation
            return;
        }

        // Prepare cut event data
        let clipboardText: string = '';
        if (selectedCells.length > 0) {
            clipboardText = isRectangularSelection() ? copyRectangularSelection(selectedCells, includeHeaders, rowKeyToIndexMap)
                : copyScatteredSelection(selectedCells, includeHeaders, rowKeyToIndexMap);
        }
        const cutEvent: ClipboardCutEvent = {
            selectionType: selectionSettings?.type as 'Cell' | 'Row' | undefined,
            clipboardText,
            copyWithHeaders: includeHeaders,
            selectedRowIndexes: selectedRows,
            selectedCells: selectedCells,
            cancel: false
        };

        // Fire cut event before clearing
        onClipboardCut?.(cutEvent);

        // If event was cancelled, skip clearing
        if (cutEvent.cancel) {
            return;
        }

        // Reset tracked affected cells for this cut operation
        pastedCells.current.clear();
        if (selectedRows.length > 0 && clipboardSettings?.allowRowCopy) {
            await clearSelectedRows(selectedRows);
        } else if (selectedCells.length > 0 || (focusedCell && clipboardSettings?.allowRowCopy === false)) {
            await clearSelectedCells(selectedCells, rowKeyToIndexMap);
        }
    }, [cellSelectionModule, selectionSettings?.type, clipboardSettings?.copyWithHeaders,
        copyToClipboard, isRectangularSelection, copyRectangularSelection, copyScatteredSelection,
        onClipboardCut, clearSelectedRows, clearSelectedCells]);

    // Handles cut events (Ctrl+X) and cuts clipboard content from the grid.
    const handleCut: (event: KeyboardEvent) => void = useCallback((event: KeyboardEvent): void => {
        const activeRowCell: HTMLElement | null = (document.activeElement)?.closest('.sf-grid-content-row .sf-cell');
        const headerCheckbox: HTMLElement | null = (document.activeElement)?.closest('.sf-grid-checkselectall');

        if (gridRef.current?.editModule?.isEdit || (!activeRowCell && !headerCheckbox) ||
            clipboardSettings?.enabled === false || clipboardSettings?.allowCut === false ||
            !primaryKeyField || (isGroupingEnabled && isGroupCaptionRowFocused()) || !gridRef.current.editSettings?.allowDelete) {
            return;
        }
        // Check if Ctrl+X or Cmd+X was pressed
        if ((event.ctrlKey || event.metaKey) && event.code === 'KeyX') {

            event.preventDefault();
            void cutToClipboard();
        }
    }, [gridRef, selectionSettings, cellSelectionModule, selectionModule, clipboardSettings,
        primaryKeyField, cutToClipboard]);

    useEffect(() => {
        const gridElement: HTMLElement = gridRef.current?.element;

        gridElement.addEventListener('paste', handlePaste as EventListener);
        gridElement.addEventListener('keydown', handleCut as EventListener);
        return () => {
            gridElement.removeEventListener('paste', handlePaste as EventListener);
            gridElement.removeEventListener('keydown', handleCut as EventListener);
        };
    }, [gridRef, handlePaste, handleCut]);

    return {
        copyToClipboard,
        pasteFromClipboard,
        cutToClipboard,
        saveClipboardBulkChanges,
        isClipboardOperation,
        validatePastedValue
    } as Clipboard;
};

export { useClipboard as ClipboardModule };
