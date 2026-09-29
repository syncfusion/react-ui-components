import { useCallback, useRef, useMemo } from 'react';
import { DataUtil } from '@syncfusion/react-data';
import {
    AutoFill,
    CellFillStartedEvent,
    CellFillCompletedEvent,
    AutoFillRange,
    AutoFillTarget,
    FillSourceSelection,
    SeriesPattern,
    FilledCell,
    FillDirection,
    AutoFillModuleOptions
} from '../types/autofill.interfaces';
import { CellPosition, RowCellInfo } from '../types/cell-selection.interfaces';
import { ColumnProps } from '../types/column.interfaces';
import { Clipboard } from '../types/clipboard.interfaces';
import { IRow, ValueType } from '../types/interfaces';
import { editModule } from '../types/edit.interfaces';
import { ClipboardModule } from './useClipboard';
import { EditModule } from './useEdit';
import { ColumnType } from '../types/enum';
/**
 * Custom hook to manage cell fill (autofill) functionality for grid cells.
 * Handles sequence detection, fill operations, and pattern-based value propagation.
 * Creates clipboard module internally to support copy, cut, and paste operations.
 *
 * @template T - The grid data model type
 * @param {AutoFillModuleOptions<T>} options - Configuration options for autofill module
 * @returns {AutoFill} The cell fill operations module with internal clipboard support
 *
 * @private
 */
const useAutoFill: <T>(
    options: AutoFillModuleOptions<T>
) => AutoFill = <T>(
    options: AutoFillModuleOptions<T>
): AutoFill => {
    const { gridRef, currentViewData, visibleColumns, selectionSettings, cellSelectionModule, editSettings, autoFillSettings, props,
        columnMap, dataOperations, setCurrentViewData, fieldOrderMap, selectionModule, setRowData, clipboardSettings,
        setResponseData, undoRedoModule, isCtrlKeySelectionRef, editModule, serviceLocator, focusModule, setGridAction,
        setCurrentPage, commandColumnModule, virtualSettings, pinningModule, batchEditStagedRowsRef } = options;

    type ActiveFillRange = {
        direction: FillDirection;
        fillCount: number;
        minRow: number;
        maxRow: number;
        minCol: number;
        maxCol: number;
    };

    type OriginalSelectionRange = {
        minRow: number;
        maxRow: number;
        minCol: number;
        maxCol: number;
    };

    type SourceBounds = {
        sourceRowIndices: number[];
        sourceColIndices: number[];
        minRowIdx: number;
        maxRowIdx: number;
        minColIdx: number;
        maxColIdx: number;
    };

    // Create clipboard module instance internally for autofill operations
    const clipboardModule: Clipboard | null = dataOperations && setCurrentViewData
        ? ClipboardModule({
            gridRef, currentViewData, visibleColumns, selectionSettings, cellSelectionModule, selectionModule,
            setRowData, editSettings, clipboardSettings, onClipboardCopy: props?.onClipboardCopy,
            onClipboardPaste: props?.onClipboardPaste, onClipboardCut: props?.onClipboardCut, setResponseData, dataOperations,
            fieldOrderMap, columnMap, setCurrentViewData, undoRedoModule
        }) : null;

    const resolvedEditModule: editModule<T> = editModule ?? EditModule<T>(
        gridRef,
        serviceLocator,
        visibleColumns,
        currentViewData,
        dataOperations,
        focusModule,
        selectionModule,
        editSettings,
        setGridAction,
        setCurrentPage,
        setResponseData,
        commandColumnModule,
        virtualSettings,
        pinningModule,
        batchEditStagedRowsRef,
        undoRedoModule
    );

    const sourceBoundsRef: React.RefObject<SourceBounds | null> = useRef<SourceBounds | null>(null);
    const originalSelectionRef: React.RefObject<OriginalSelectionRange | null> = useRef<OriginalSelectionRange | null>(null);
    const lastAutoFillRangeRef: React.RefObject<ActiveFillRange | null> = useRef<ActiveFillRange | null>(null);
    const previewedCellsRef: React.RefObject<Set<HTMLElement>> = useRef<Set<HTMLElement>>(new Set());
    const sourceCellRef: React.RefObject<{ row: number | null; col: number | null }> = useRef<{ row: number | null; col: number | null }>({
        row: null,
        col: null
    });
    const activeFillBucketRef: React.RefObject<'top' | 'bottom' | 'content' | null> = useRef<'top' | 'bottom' | 'content' | null>(null);
    const columnIndexMap: Map<string, number> = useMemo(() => {
        const map: Map<string, number> = new Map<string, number>();
        visibleColumns.forEach((column: ColumnProps<T>, index: number) => {
            map.set(column?.field, index);
        });

        return map;
    }, [visibleColumns]);

    const primaryKeyField: string | undefined = gridRef.current?.getColumns?.()?.find((col: ColumnProps) => col.isPrimaryKey)?.field;
    const topPinnedRowCount: number = gridRef.current?.getPinnedTopTableRowsObject?.()?.length ?? 0;
    const bottomPinnedRowCount: number = gridRef.current?.getPinnedBottomTableRowsObject?.()?.length ?? 0;

    const rowDataByKey: Map<string | number, T> = useMemo(() => {
        const map: Map<string | number, T> = new Map();

        if (!primaryKeyField) {
            return map;
        }

        currentViewData.forEach((row: T) => {
            const key: unknown = DataUtil.getObject(primaryKeyField, row);
            if (key !== undefined && key !== null) {
                map.set(typeof key === 'string' || typeof key === 'number' ? key : String(key), row);
            }
        });
        return map;
    }, [currentViewData, primaryKeyField]);

    // Validates whether cell fill operation is allowed to proceed.
    const isAutoFillAllowed: (sourceCells?: AutoFillTarget[]) => boolean = useCallback((sourceCells?: AutoFillTarget[]) => {
        const selectedCells: RowCellInfo[] = cellSelectionModule?.getSelectedCellsData?.() ?? [];
        // Autofill requires cell editing and rectangular cell selection.
        const selectionType: string = selectionSettings?.cellSelectionType;
        if (!autoFillSettings?.enabled || !editSettings?.allowEdit || editSettings?.mode !== 'Cell' || selectionSettings?.type !== 'Cell' ||
            (selectionType !== 'Box' && selectionType !== 'BoxWithBorder') || (sourceCells?.length === 0
            && selectedCells.length === 0) || !primaryKeyField ||
            selectionSettings?.mode !== 'Multiple') {
            return false;
        }

        return selectedCells.length > 0 || sourceCells?.length > 0;
    }, [autoFillSettings?.enabled, editSettings?.allowEdit, primaryKeyField, selectionSettings?.type, selectionSettings?.cellSelectionType,
        selectionSettings?.mode, cellSelectionModule]);

    // Returns the fill directions allowed by the current autofill settings.
    const getFillDirections: () => Set<FillDirection> = useCallback((): Set<FillDirection> => {
        const allowed: string = (autoFillSettings?.allowedDirection).toLowerCase();

        if (allowed === 'row') {
            return new Set<FillDirection>(['left', 'right']);
        }

        if (allowed === 'column') {
            return new Set<FillDirection>(['up', 'down']);
        }

        return new Set<FillDirection>(['up', 'down', 'left', 'right']);
    }, [autoFillSettings?.allowedDirection]);

    // Checks whether the specified fill direction is allowed.
    const isFillDirectionAllowed: (direction: FillDirection) => boolean = useCallback(
        (direction: FillDirection): boolean => {
            return getFillDirections().has(direction);
        }, [getFillDirections]);

    // Determines whether a column should be excluded from autofill.
    const shouldSkipColumn: (fieldName: string) => boolean = useCallback(
        (fieldName: string): boolean => {
            const column: ColumnProps | undefined = columnMap?.get(fieldName);
            if (!column) {
                return false;
            }
            if (column.type === ColumnType.Checkbox || column.type === ColumnType.SingleGroup || column.getCommandItems?.length ||
                column.type === ColumnType.RowNumber || column.type === ColumnType.RowDragAndDrop) {
                return true;
            }
            // Early exit: No callback defined, include all columns
            if (!autoFillSettings?.excludeFromAutoFill) {
                return false;
            }

            // Invoke callback to determine if column should be skipped
            return autoFillSettings.excludeFromAutoFill(fieldName);
        }, [autoFillSettings, columnMap]);

    // Checks whether autofill is disabled for the selected columns.
    const isAutoFillDisabled: (selectedCells: RowCellInfo[]) => boolean = useCallback((selectedCells: RowCellInfo[]): boolean => {
        if (!selectedCells.length) {
            return false;
        }

        const selectedFields: Set<string> = new Set();
        selectedCells.forEach((row: RowCellInfo) => {
            row.fieldNames.forEach((field: string) => {
                selectedFields.add(field);
            });
        });

        return Array.from(selectedFields).every((field: string) => {
            const column: ColumnProps | undefined = columnMap?.get(field);
            return column?.disableAutofill === true ||
                column?.type === ColumnType.Checkbox ||
                column?.type === ColumnType.SingleGroup || column?.type === ColumnType.RowDragAndDrop ||
                column?.getCommandItems?.length || ColumnType.RowNumber === column?.type;
        });
    }, [cellSelectionModule, columnMap]);

    // Detects the fill pattern from the selected source values.
    const detectSeriesPattern: (values: ValueType[]) => SeriesPattern = useCallback(
        (values: ValueType[]): SeriesPattern => {
            if (!values || values.length === 0) {
                return { pattern: 'single', baseValues: values };
            }

            if (values.length === 1) {
                return { pattern: 'single', baseValues: values };
            }
            // Attempt numeric sequence detection
            const parsedNumbers: (number | null)[] = values.map((val: ValueType) => {
                const num: number = typeof val === 'number' ? val : parseFloat(String(val));
                return isNaN(num) ? null : num;
            });
            const isAllNumeric: boolean = parsedNumbers.every((n: number | null) => n !== null);

            if (isAllNumeric && values.length >= 2) {
                const numericValues: number[] = parsedNumbers.filter((n: number | null) => n !== null) as number[];
                const steps: number[] = [];

                for (let i: number = 1; i < numericValues.length; i++) {
                    // eslint-disable-next-line security/detect-object-injection
                    steps.push(numericValues[i] - numericValues[i - 1]);
                }
                const isConstantStep: boolean = steps.every((s: number) => s === steps[0]);
                if (isConstantStep) {
                    return { pattern: 'numeric', step: steps[0], baseValues: values };
                }

                // Trend detection for non-uniform numeric values
                if (numericValues.length >= 3) {
                    const n: number = numericValues.length;
                    let sumX: number = 0;
                    let sumY: number = 0;
                    let sumXY: number = 0;
                    let sumXX: number = 0;

                    for (let i: number = 0; i < n; i++) {
                        sumX += i;
                        // eslint-disable-next-line security/detect-object-injection
                        sumY += numericValues[i];
                        // eslint-disable-next-line security/detect-object-injection
                        sumXY += i * numericValues[i];
                        sumXX += i * i;
                    }
                    const denominator: number = (n * sumXX) - (sumX * sumX);
                    if (denominator !== 0) {
                        const slope: number = ((n * sumXY) - (sumX * sumY)) / denominator;
                        const intercept: number = (sumY - (slope * sumX)) / n;
                        return { pattern: 'numericTrend', slope, intercept, baseValues: values };
                    }
                }
            }
            // Default: text pattern (repeat)
            return { pattern: 'text', baseValues: values };
        }, []);

    // Builds the autofill source data from the current selection.
    const getFillSource: (sourceCells?: AutoFillTarget[]) => FillSourceSelection | null = useCallback(
        (sourceCells?: AutoFillTarget[]): FillSourceSelection | null => {
            let selectedCells: RowCellInfo[];
            if (sourceCells?.length) {
                const rowMap: Map<string | number, RowCellInfo> = new Map();
                sourceCells.forEach((cell: AutoFillTarget) => {
                    const rowData: T | undefined = rowDataByKey.get(cell.rowKey);
                    if (!rowData) {
                        return;
                    }

                    let rowInfo: RowCellInfo | undefined = rowMap.get(cell.rowKey);
                    if (!rowInfo) {
                        rowInfo = { rowKey: cell.rowKey, data: rowData, fieldNames: [] } as RowCellInfo;
                        rowMap.set(cell.rowKey, rowInfo);
                    }
                    if (!rowInfo.fieldNames.includes(cell.fieldName)) {
                        rowInfo.fieldNames.push(cell.fieldName);
                    }
                });
                selectedCells = Array.from(rowMap.values());
            } else {
                selectedCells = cellSelectionModule?.getSelectedCellsData?.() ?? [];
            }

            if (!selectedCells || selectedCells.length === 0) {
                return null;
            }
            // Collect unique non-primary-key field names, excluding skipped columns
            const fieldSet: Set<string> = new Set<string>();
            selectedCells.forEach((row: RowCellInfo) => {
                row.fieldNames.forEach((field: string) => fieldSet.add(field));
            });

            const selectedFields: string[] = Array.from(fieldSet);
            if (selectedFields.length === 0) {
                return null;
            }

            // Extract values and column info by field
            const valuesByField: { [fieldName: string]: ValueType[] } = {};
            const columnsByField: { [fieldName: string]: ColumnProps } = {};
            selectedFields.forEach((field: string) => {
                const col: ColumnProps | undefined = columnMap?.get(field);
                if (!col) {
                    return;
                }
                // eslint-disable-next-line security/detect-object-injection
                columnsByField[field] = col;
                const fieldValues: ValueType[] = [];

                selectedCells.forEach((row: RowCellInfo) => {
                    if (row.fieldNames.includes(field) && row.data) {
                        // eslint-disable-next-line security/detect-object-injection
                        const rawValue: ValueType = row.data?.[field] as ValueType;
                        if (rawValue !== undefined && rawValue !== null) {
                            fieldValues.push(rawValue);
                        }
                    }
                });
                // eslint-disable-next-line security/detect-object-injection
                valuesByField[field] = fieldValues;
            });
            // Detect patterns for each field
            const patternsByField: { [fieldName: string]: SeriesPattern } = {};
            Object.entries(valuesByField).forEach(([field, values]: [string, ValueType[]]) => {
                // eslint-disable-next-line security/detect-object-injection
                patternsByField[field] = detectSeriesPattern(values);
            });
            return {
                selectedRowCells: selectedCells, selectedFieldNames: selectedFields, cellValuesByField: valuesByField,
                columnsByField, detectedPatternsByField: patternsByField
            };
        }, [cellSelectionModule, columnMap, rowDataByKey]);

    const buildSourceBounds: (source: FillSourceSelection) => SourceBounds | null = useCallback((source: FillSourceSelection):
    SourceBounds | null => {
        const sourceRowSet: Set<number> = new Set<number>();
        const sourceColSet: Set<number> = new Set<number>();

        source.selectedRowCells.forEach((row: RowCellInfo) => {
            const rowIdx: number = cellSelectionModule?.findRowIndexByKey?.(row.rowKey);

            if (rowIdx >= 0) {
                sourceRowSet.add(rowIdx);
            }
            row.fieldNames.forEach((field: string) => {
                const colIdx: number | undefined = columnIndexMap.get(field);
                if (colIdx >= 0 && colIdx !== undefined) {
                    sourceColSet.add(colIdx);
                }
            });
        });

        if (!sourceRowSet.size || !sourceColSet.size) {
            return null;
        }

        return {
            sourceRowIndices: Array.from(sourceRowSet), sourceColIndices: Array.from(sourceColSet),
            minRowIdx: Math.min(...Array.from(sourceRowSet)), maxRowIdx: Math.max(...Array.from(sourceRowSet)),
            minColIdx: Math.min(...Array.from(sourceColSet)),
            maxColIdx: Math.max(...Array.from(sourceColSet))
        };
    }, [cellSelectionModule, columnIndexMap]);

    // Generates the fill value for a target cell.
    const getFillValue: (fieldName: string, positionIndex: number, source: FillSourceSelection, cell: AutoFillTarget,
        fillRange: AutoFillRange) => ValueType | null = useCallback((fieldName: string, positionIndex: number, source: FillSourceSelection,
                                                                     cell: AutoFillTarget, fillRange: AutoFillRange):
    ValueType | null => {
        // Check custom fill logic
        if (autoFillSettings?.fillOperation) {
            //eslint-disable-next-line security/detect-object-injection
            const sourceValues: ValueType[] = source.cellValuesByField[fieldName];
            const customValue: ValueType | false = autoFillSettings.fillOperation({
                cell, cellPosition: positionIndex, source, fillRange, fieldName,
                currentValue: sourceValues[sourceValues.length - 1],
                sourceValues,
                //eslint-disable-next-line security/detect-object-injection
                column: source.columnsByField[fieldName]
            });

            if (customValue !== false) {
                return customValue;
            }
        }
        // Apply default fill algorithm
        // eslint-disable-next-line security/detect-object-injection
        const pattern: SeriesPattern = source.detectedPatternsByField[fieldName];

        switch (pattern.pattern) {
        case 'numeric': {
            const altFill: boolean = fillRange?.isAltFill === true;
            // Multi-value numeric selection + Alt => repeat values
            if (altFill && pattern.baseValues.length > 1) {
                const index: number = positionIndex % pattern.baseValues.length;
                //eslint-disable-next-line security/detect-object-injection
                return pattern.baseValues[index];
            }
            const firstVal: number = typeof pattern.baseValues[0] === 'number' ? pattern.baseValues[0] as number : parseFloat(String(pattern.baseValues[0]));
            const step: number = pattern.step;
            if (fillRange.direction === 'up' || fillRange.direction === 'left') {
                return firstVal - (step * (fillRange.fillCount - positionIndex));
            }
            const nextPosition: number = pattern.baseValues.length + positionIndex;
            return firstVal + (nextPosition * step);
        }
        case 'numericTrend': {
            const nextIndex: number =  pattern.baseValues.length + positionIndex;
            return Math.round(pattern.intercept + (pattern.slope * nextIndex));
        }

        case 'text': {
            const patternIdx: number = (positionIndex + pattern.baseValues.length) % pattern.baseValues.length;
            //eslint-disable-next-line security/detect-object-injection
            return pattern.baseValues[patternIdx];
        }

        case 'single': {
            const value: ValueType = pattern.baseValues[0];
            const altFill: boolean = fillRange?.isAltFill === true;
            const numericValue: number = typeof value === 'number' ? value : parseFloat(String(value));

            if (altFill && !isNaN(numericValue)) {
                switch (fillRange.direction) {

                case 'down':
                case 'right':
                    return numericValue + (positionIndex + 1);

                case 'up':
                case 'left':
                    return numericValue - (fillRange.fillCount - positionIndex);

                default:
                    return numericValue;
                }
            }
            return value ?? null;
        }
        }
    }, [autoFillSettings]);

    // Generates the destination cells for the fill operation.
    const getTargetCells: (range: AutoFillRange, source: FillSourceSelection) => AutoFillTarget[] = useCallback(
        (range: AutoFillRange, source: FillSourceSelection): AutoFillTarget[] => {
            if (!range || range.fillCount <= 0) {
                return [];
            }
            const cells: AutoFillTarget[] = [];
            const bounds: SourceBounds | null = sourceBoundsRef.current ?? buildSourceBounds(source);

            if (!bounds) {
                return [];
            }

            const { sourceRowIndices, sourceColIndices, minRowIdx, maxRowIdx, minColIdx, maxColIdx } = bounds;
            const pinnedRowsByIndex: Map<number, IRow<ColumnProps<T>>> = new Map([
                ...(gridRef.current?.getPinnedTopTableRowsObject?.() ?? []),
                ...(gridRef.current?.getPinnedBottomTableRowsObject?.() ?? [])
            ].map((rowObject: IRow<ColumnProps<T>>) => [rowObject.rowIndex, rowObject]));

            // Generate target cells based on direction
            for (let i: number = 1; i <= range.fillCount; i++) {
                let targetRows: number[] = [];
                let targetCols: number[] = [];
                if (range.direction === 'down') {
                    targetRows = [maxRowIdx + i];
                    targetCols = sourceColIndices;
                } else if (range.direction === 'up') {
                    targetRows = [minRowIdx - (range.fillCount - i + 1)];
                    targetCols = sourceColIndices;
                } else if (range.direction === 'right') {
                    targetRows = sourceRowIndices;
                    targetCols = [maxColIdx + i];
                } else if (range.direction === 'left') {
                    targetRows = sourceRowIndices;
                    targetCols = [minColIdx - i];
                }
                targetRows.forEach((rowIdx: number) => {
                    targetCols.forEach((colIdx: number) => {
                        const dataRowIndex: number = topPinnedRowCount > 0 ? rowIdx - topPinnedRowCount : rowIdx;
                        const pinnedRow: IRow<ColumnProps<T>> | undefined = pinnedRowsByIndex.get(rowIdx);
                        // eslint-disable-next-line security/detect-object-injection
                        const rowData: T | undefined = pinnedRow?.data as T | undefined ?? currentViewData[dataRowIndex];
                        const isValidRow: boolean = !!rowData;
                        const isValidCol: boolean = colIdx >= 0 && colIdx < visibleColumns.length;

                        if (isValidRow && isValidCol) {
                            // eslint-disable-next-line security/detect-object-injection
                            const col: ColumnProps = visibleColumns[colIdx];

                            if (rowData && col?.field && !col.getCommandItems?.length) {
                                const rKey: unknown = DataUtil.getObject(primaryKeyField, rowData);
                                const normalizedKey: string | number = typeof rKey === 'string' || typeof rKey === 'number'
                                    ? rKey : String(rKey);
                                cells.push({ rowKey: normalizedKey, fieldName: col.field, rowIndex: rowIdx, columnIndex: colIdx });
                            }
                        }
                    });
                });
            }

            return cells;
        }, [currentViewData, visibleColumns, primaryKeyField, topPinnedRowCount, gridRef, buildSourceBounds]);

    // Validates generated fill values against column definitions.
    const validateFilledValues: (cells: AutoFillTarget[], filledValueMap: { [cellKey: string]: ValueType }
    ) => { [cellKey: string]: FilledCell } = useCallback((cells: AutoFillTarget[], filledValueMap: { [cellKey: string]: ValueType }
    ): { [cellKey: string]: FilledCell } => {
        const results: { [cellKey: string]: FilledCell } = {};

        cells.forEach((cell: AutoFillTarget) => {
            const key: string = `${cell.rowKey}:${cell.fieldName}`;
            // Skip cells that were never assigned a fill value
            if (!(key in filledValueMap)) {
                return;
            }
            // eslint-disable-next-line security/detect-object-injection
            const val: ValueType = filledValueMap[key];
            const col: ColumnProps | undefined = columnMap?.get(cell.fieldName);
            if (!col) {
                return;
            }

            const rawValue: string = val === null || val === undefined ? '' : String(val);
            const validationResult: { value?: ValueType } | undefined = clipboardModule?.validatePastedValue?.(rawValue, col);
            // eslint-disable-next-line security/detect-object-injection
            results[key] = { fieldName: cell.fieldName, filledValue: validationResult?.value };
        });

        return results;
    }, [clipboardModule, columnMap]);

    // Calculates the cells that must be cleared when a fill range is reduced.
    const getReducedBounds: (active: ActiveFillRange, removedCount: number, original: OriginalSelectionRange) => {
        startRow: number; endRow: number; startCol: number; endCol: number;
    } | null = useCallback((active: ActiveFillRange, removedCount: number, original: OriginalSelectionRange): {
        startRow: number; endRow: number; startCol: number; endCol: number;
    } | null => {
        switch (active.direction) {
        case 'down':
            return {
                startRow: active.maxRow - removedCount + 1,
                endRow: active.maxRow,
                startCol: original.minCol,
                endCol: original.maxCol
            };

        case 'right':
            return {
                startRow: active.minRow,
                endRow: active.maxRow,
                startCol: active.maxCol - removedCount + 1,
                endCol: active.maxCol
            };

        default:
            return null;
        }
    }, []);

    // Returns the DOM element for the specified cell.
    const getCellElement: (rowIndex: number, columnIndex: number) => HTMLElement | null = useCallback(
        (rowIndex: number, columnIndex: number): HTMLElement | null => {
            const pinnedRow: IRow<ColumnProps<T>> | undefined = [
                ...(gridRef.current?.getPinnedTopTableRowsObject?.() ?? []),
                ...(gridRef.current?.getPinnedBottomTableRowsObject?.() ?? [])
            ].find((row: IRow<ColumnProps<T>>) => row.rowIndex === rowIndex);
            if (pinnedRow?.element) {
                return pinnedRow.element.querySelector(`td[data-colindex="${columnIndex + 1}"]`);
            }
            // DOM uses 1-based data-rowindex attributes; convert from 0-based rowIndex
            const rowElement: HTMLElement | undefined = Array.from(gridRef.current?.getRows?.() ?? [])
                .find((row: HTMLElement) => Number(row.getAttribute('aria-rowindex')) - 1 === rowIndex);

            if (!rowElement) {
                return null;
            }
            return rowElement.querySelector(`td[data-colindex="${columnIndex + 1}"]`);
        }, [gridRef]);

    // Restores source cell styling after grid refresh or selection updates.
    const restoreSourceCell: () => void = useCallback((): void => {
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                showFillHandle();
                document.querySelector('.sf-fill-source-cell')?.classList.remove('sf-fill-source-cell');

                if (sourceCellRef.current?.row !== null && sourceCellRef.current?.col !== null) {
                    const sourceCellElement: HTMLElement | null = getCellElement(sourceCellRef.current.row, sourceCellRef.current.col);
                    sourceCellElement?.classList.add('sf-fill-source-cell');
                }
            });
        });
    }, [getCellElement]);

    // Clears cells removed from a previously applied fill range.
    const clearReducedRange: (fillRange: AutoFillRange) => Promise<void> = useCallback(async (fillRange: AutoFillRange): Promise<void> => {
        const original: OriginalSelectionRange | null = originalSelectionRef.current;
        const active: ActiveFillRange | null = lastAutoFillRangeRef.current;
        if (!original || !active) {
            return;
        }
        const removedCount: number = active.fillCount - fillRange.fillCount;
        if (removedCount <= 0) {
            return;
        }

        const bounds: { startRow: number; endRow: number; startCol: number; endCol: number } | null =
            getReducedBounds(active, removedCount, original);
        if (!bounds) {
            return;
        }
        const source: FillSourceSelection | null = getFillSource();
        const startEvent: CellFillStartedEvent | null = source ? { source, fillRange, cancel: false } : null;
        if (startEvent) {
            props?.onCellFillStart?.(startEvent);
            if (startEvent.cancel) {
                return;
            }
        }
        const { startRow, endRow, startCol, endCol } = bounds;

        const recordsMap: Map<string | number, T> = new Map();
        const clearedCells: { [cellKey: string]: FilledCell } = {};
        for (let rowIndex: number = startRow; rowIndex <= endRow; rowIndex++) {
            for (let colIndex: number = startCol; colIndex <= endCol; colIndex++) {
                // eslint-disable-next-line security/detect-object-injection
                const rowData: T | undefined = currentViewData[rowIndex];
                // eslint-disable-next-line security/detect-object-injection
                const column: ColumnProps<T> = visibleColumns[colIndex];

                if (!rowData || !column?.field) {
                    continue;
                }
                const rowKey: string | number = DataUtil.getObject(primaryKeyField, rowData) as string | number;
                const updated: T = recordsMap.get(rowKey) ?? ({ ...rowData } as T);
                DataUtil.setValue(column.field, null, updated as Record<string, unknown>);
                recordsMap.set(rowKey, updated);
                clearedCells[`${rowKey}:${column.field}`] = { fieldName: column.field, filledValue: null };
            }
        }

        const modifiedRecords: T[] = Array.from(recordsMap.values());
        if (modifiedRecords.length > 0) {
            await clipboardModule?.saveClipboardBulkChanges?.(modifiedRecords);
        }
        const newMinRow: number = active.minRow;
        let newMaxRow: number = active.maxRow;
        const newMinCol: number = active.minCol;
        let newMaxCol: number = active.maxCol;

        switch (active.direction) {
        case 'down':
            newMaxRow -= removedCount;
            break;

        case 'right':
            newMaxCol -= removedCount;
            break;
        }

        lastAutoFillRangeRef.current = {
            ...active, fillCount: fillRange.fillCount, minRow: newMinRow, maxRow: newMaxRow,
            minCol: newMinCol, maxCol: newMaxCol
        };
        cellSelectionModule?.selectRange?.({ rowIndex: newMinRow, columnIndex: newMinCol },
                                           { rowIndex: newMaxRow, columnIndex: newMaxCol });
        restoreSourceCell();
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                showFillHandle();
            });
        });
        if (startEvent) {
            const completeEvent: CellFillCompletedEvent<T> = {
                source: source as FillSourceSelection,
                fillRange,
                modifiedRecords,
                filledCellsDetail: clearedCells
            };
            props?.onCellFillComplete?.(completeEvent);
        }
    }, [currentViewData, visibleColumns, primaryKeyField, cellSelectionModule, getReducedBounds, clipboardModule, restoreSourceCell,
        getFillSource, props?.onCellFillStart, props?.onCellFillComplete]);

    // Applies autofill values to the specified range.
    const applyFill: (fillRange: AutoFillRange) => Promise<void> = useCallback(
        async (fillRange: AutoFillRange): Promise<void> => {
            const source: FillSourceSelection | null = getFillSource(fillRange.sourceCells);
            const isPrimaryKeySource: boolean = !!primaryKeyField && source?.selectedFieldNames.includes(primaryKeyField);
            const isVerticalDirection: boolean = fillRange.direction === 'up' || fillRange.direction === 'down';
            if (!isAutoFillAllowed(fillRange.sourceCells) || !isFillDirectionAllowed(fillRange.direction) ||
                (isPrimaryKeySource && isVerticalDirection) || !source) {
                return;
            }
            // Fire start event
            const startEvent: CellFillStartedEvent = { source, fillRange, cancel: false };
            props?.onCellFillStart?.(startEvent);
            if (startEvent.cancel) {
                return;
            }

            // Build target cells
            const targetCells: AutoFillTarget[] = fillRange.targetCells?.length ? fillRange.targetCells :
                getTargetCells(fillRange, source);
            if (!targetCells.length) {
                return;
            }
            // Calculate fill values
            const filledValues: { [cellKey: string]: ValueType } = {};
            const fieldPositionMap: Map<string, number> = new Map();
            const sourceColumnIndices: number[] = source.selectedFieldNames.map((field: string) => columnIndexMap.get(field));
            const minSourceCol: number = Math.min(...sourceColumnIndices);
            targetCells.forEach((cell: AutoFillTarget) => {
                if (shouldSkipColumn(cell.fieldName)) {
                    return;
                }
                const key: string = `${cell.rowKey}:${cell.fieldName}`;
                let sourceField: string = cell.fieldName;

                if (fillRange.direction === 'left' || fillRange.direction === 'right') {
                    const sourceFields: string[] = source.selectedFieldNames;
                    const sourceFieldIndex: number = ((cell.columnIndex - minSourceCol) % sourceFields.length +
                        sourceFields.length) % sourceFields.length;
                    // eslint-disable-next-line security/detect-object-injection
                    sourceField = sourceFields[sourceFieldIndex];
                }

                const positionIndex: number = fieldPositionMap.get(sourceField) ?? 0;
                const val: ValueType | null = getFillValue(sourceField, positionIndex, source, cell, fillRange);

                if (val !== null) {
                    // eslint-disable-next-line security/detect-object-injection
                    const formatFn: Function = source.columnsByField[sourceField].formatFn;
                    if (formatFn) {
                        // eslint-disable-next-line security/detect-object-injection
                        filledValues[key] = formatFn(val).toString();
                    } else {
                        // eslint-disable-next-line security/detect-object-injection
                        filledValues[key] = val;
                    }
                }

                fieldPositionMap.set(sourceField, positionIndex + 1);
            });

            // Validate filled values using the shared clipboard validation path.
            const validatedCells: { [cellKey: string]: FilledCell } = validateFilledValues(targetCells, filledValues);

            Object.entries(validatedCells).forEach(([cellKey, validationResult]: [string, FilledCell]) => {
                // eslint-disable-next-line security/detect-object-injection
                filledValues[cellKey] = validationResult.filledValue;
            });

            // Build modified records
            const recordsMap: Map<string | number, T> = new Map<string | number, T>();

            Object.entries(filledValues).forEach(([cellKey, value]: [string, ValueType]) => {
                const [rowKeyStr, fieldName] = cellKey.split(':');
                const rowKey: string | number = isNaN(Number(rowKeyStr)) ? rowKeyStr : Number(rowKeyStr);

                const row: T | undefined = rowDataByKey.get(rowKey);

                if (row && fieldName) {
                    const updated: T = recordsMap.get(rowKey) ?? ({ ...row } as T);
                    DataUtil.setValue(fieldName, value, updated as Record<string, unknown>);
                    recordsMap.set(rowKey, updated);
                }
            });
            const modifiedRecords: T[] = Array.from(recordsMap.values());
            // Update grid
            if (modifiedRecords.length > 0) {
                await clipboardModule?.saveClipboardBulkChanges?.(modifiedRecords);

                // Keep the rendered pinned rows and their caches aligned with the bulk update.
                const updatePinnedRows: (rows: IRow<ColumnProps<T>>[] | undefined,
                    cache: Map<number | string, IRow<ColumnProps<T>>> |
                    undefined)
                => void = (rows: IRow<ColumnProps<T>>[] | undefined,
                           cache: Map<number | string, IRow<ColumnProps<T>>> | undefined): void => {
                    rows?.forEach((rowObject: IRow<ColumnProps<T>>) => {
                        const rowKey: unknown = DataUtil.getObject(primaryKeyField, rowObject.data as T);
                        const updatedRecord: T | undefined = modifiedRecords.find((record: T) =>
                            DataUtil.getObject(primaryKeyField, record) === rowKey);
                        if (!updatedRecord) {
                            return;
                        }
                        const updateRowObject: (target: IRow<ColumnProps<T>>) => void = (target: IRow<ColumnProps<T>> |
                        undefined): void => {
                            target?.setRowObject?.((previousRowObject: IRow<ColumnProps<T>>) => ({
                                ...previousRowObject,
                                data: updatedRecord
                            }));
                        };
                        updateRowObject(rowObject);
                        const cachedRowObject: IRow<ColumnProps<T>> | undefined = Array.from(cache?.values() ?? [])
                            .find((cached: IRow<ColumnProps<T>>) =>
                                DataUtil.getObject(primaryKeyField, cached.data as T) === rowKey);
                        updateRowObject(cachedRowObject);
                    });
                };

                updatePinnedRows(gridRef.current?.getPinnedTopTableRowsObject?.(),
                                 gridRef.current?.getPinnedTopTableCachedRowObjects?.());
                updatePinnedRows(gridRef.current?.getPinnedBottomTableRowsObject?.(),
                                 gridRef.current?.getPinnedBottomTableCachedRowObjects?.());
            }
            const bounds: SourceBounds | null = sourceBoundsRef.current ?? buildSourceBounds(source);

            if (bounds) {

                let minRow: number = bounds.minRowIdx;
                let maxRow: number = bounds.maxRowIdx;
                let minCol: number = bounds.minColIdx;
                let maxCol: number = bounds.maxColIdx;
                if (!originalSelectionRef.current) {
                    originalSelectionRef.current = { minRow, maxRow, minCol, maxCol };
                }
                const pinnedRows: IRow<ColumnProps<T>>[] = [
                    ...(gridRef.current?.getPinnedTopTableRowsObject?.() ?? []),
                    ...(gridRef.current?.getPinnedBottomTableRowsObject?.() ?? [])
                ];
                const sourceRowIndex: number = cellSelectionModule?.getSelectionStartCell?.()?.rowIndex ?? bounds.minRowIdx;
                activeFillBucketRef.current = pinnedRows.some((rowObject: IRow<ColumnProps<T>>) =>
                    rowObject.rowIndex === sourceRowIndex && rowObject.pinBucket === 'top') ? 'top' :
                    pinnedRows.some((rowObject: IRow<ColumnProps<T>>) =>
                        rowObject.rowIndex === sourceRowIndex && rowObject.pinBucket === 'bottom') ? 'bottom' : 'content';

                switch (fillRange.direction) {
                case 'down':
                    maxRow += fillRange.fillCount;
                    sourceCellRef.current = { row: sourceRowIndex, col: bounds.minColIdx };
                    break;

                case 'up':
                    minRow -= fillRange.fillCount;
                    sourceCellRef.current = { row: sourceRowIndex, col: bounds.minColIdx };
                    break;

                case 'right':
                    maxCol += fillRange.fillCount;
                    sourceCellRef.current = { row: sourceRowIndex, col: bounds.minColIdx };
                    break;

                case 'left':
                    minCol -= fillRange.fillCount;
                    sourceCellRef.current = { row: sourceRowIndex, col: bounds.maxColIdx };
                    break;
                }

                minRow = Math.max(0, minRow);
                minCol = Math.max(0, minCol);
                maxRow = Math.min(topPinnedRowCount + currentViewData.length + bottomPinnedRowCount - 1, maxRow);
                maxCol = Math.min(visibleColumns.length - 1, maxCol);

                lastAutoFillRangeRef.current = {
                    direction: fillRange.direction, fillCount: fillRange.fillCount,
                    minRow, maxRow, minCol, maxCol
                };
                cellSelectionModule?.selectRange?.({ rowIndex: minRow, columnIndex: minCol }, { rowIndex: maxRow, columnIndex: maxCol });
                restoreSourceCell();
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        showFillHandle();
                    });
                });
            }
            // Fire complete event
            const completeEvent: CellFillCompletedEvent<T> = {
                source, fillRange, modifiedRecords, filledCellsDetail: validatedCells
            };
            props?.onCellFillComplete?.(completeEvent);
        }, [isAutoFillAllowed, isFillDirectionAllowed, getFillSource, getTargetCells, getFillValue, shouldSkipColumn, validateFilledValues,
            currentViewData, primaryKeyField, autoFillSettings?.preventBackwardFill, props?.onCellFillComplete,
            cellSelectionModule, visibleColumns, clearReducedRange, gridRef, rowDataByKey, buildSourceBounds, getCellElement,
            restoreSourceCell]);

    // Performs autofill when the fill handle is double-clicked.
    const autoFillOnDoubleClick: () => Promise<void> = useCallback(async (): Promise<void> => {
        const source: FillSourceSelection | null = getFillSource();
        if (!source) {
            return;
        }

        const bounds: SourceBounds | null = buildSourceBounds(source);
        if (!bounds) {
            return;
        }

        const maxRowIndex: number = bounds.maxRowIdx;
        const maxColIndex: number = bounds.maxColIdx;
        const directionSetting: string = (autoFillSettings?.allowedDirection).toLowerCase();

        if (directionSetting === 'row') {
            const fillCount: number = visibleColumns.length - maxColIndex - 1;

            if (fillCount > 0) {
                await applyFill({ targetCells: [], direction: 'right', fillCount});
            }
        } else {
            const fillCount: number = currentViewData.length - maxRowIndex - 1;

            if (fillCount > 0) {
                await applyFill({ targetCells: [], direction: 'down', fillCount});
            }
        }
    }, [getFillSource, cellSelectionModule, visibleColumns, currentViewData, applyFill, autoFillSettings?.allowedDirection,
        buildSourceBounds]);

    // Removes the autofill handle from the DOM.
    const removeFillHandle: () => void = useCallback((): void => {
        try {
            const existingHandle: HTMLElement | null = document.getElementById('sf-fill-handle');
            if (existingHandle) {
                const parent: HTMLElement | null = existingHandle.parentElement;
                if (parent) {
                    parent.classList.remove('sf-fill-handle-container');
                    if (!parent.classList.contains('sf-left-pinned-cell') &&
                        !parent.classList.contains('sf-right-pinned-cell')) {
                        parent.style.position = '';
                    }
                }
                existingHandle.remove();
            }
        } catch (error) {
            console.error('[Cell Fill] Error removing fill handle:', error);
        }
    }, []);

    // Starts drag-based autofill interaction.
    const startFillDrag: (e: MouseEvent) => void = useCallback((e: MouseEvent): void => {
        e.preventDefault();
        e.stopPropagation();
        const source: FillSourceSelection | null = getFillSource?.();
        if (!source) {
            return;
        }
        sourceBoundsRef.current = buildSourceBounds(source);
        if (isAutoFillDisabled(cellSelectionModule?.getSelectedCellsData?.())) {
            return;
        }
        const isAltPressed: boolean = e.altKey;
        let hasDragged: boolean = false;
        const sourceCell: HTMLElement = (e.currentTarget as HTMLElement)?.parentElement;
        const sourceColIndex: number = Number(sourceCell?.getAttribute('data-colindex'));
        const sourceRowIndex: number = Number(sourceCell?.closest('.sf-grid-content-row')?.getAttribute('aria-rowindex'));

        let currentDirection: FillDirection | null = null;
        let fillCount: number = 0;
        let autoScrollFrame: number | null = null;
        let lastMoveEvent: MouseEvent = e;
        // Highlights cells that will be filled.
        const showFillPreview: (direction: FillDirection, count: number) => void = (direction: FillDirection, count: number): void => {
            clearFillPreview();

            if (count <= 0) {
                return;
            }
            const targetCellObjs: AutoFillTarget[] = (getTargetCells?.({
                targetCells: [], direction, fillCount: count
            }, source) ?? []);
            if (!targetCellObjs.length) {
                return;
            }
            const minRow: number = Math.min(...targetCellObjs.map((c: AutoFillTarget) => c.rowIndex));
            const maxRow: number = Math.max(...targetCellObjs.map((c: AutoFillTarget) => c.rowIndex));
            const minCol: number = Math.min(...targetCellObjs.map((c: AutoFillTarget) => c.columnIndex));
            const maxCol: number = Math.max(...targetCellObjs.map((c: AutoFillTarget) => c.columnIndex));

            targetCellObjs.forEach((cell: AutoFillTarget) => {
                const cellElement: HTMLElement | null = getCellElement(cell.rowIndex, cell.columnIndex);
                if (cellElement) {
                    cellElement.classList.add('sf-fill-preview-cell');

                    if (direction !== 'down' && cell.rowIndex === minRow) {
                        cellElement.classList.add('sf-fill-preview-top');
                    }

                    if (direction !== 'up' && cell.rowIndex === maxRow) {
                        cellElement.classList.add('sf-fill-preview-bottom');
                    }

                    if (direction !== 'right' && cell.columnIndex === minCol) {
                        cellElement.classList.add('sf-fill-preview-left');
                    }

                    if (direction !== 'left' && cell.columnIndex === maxCol) {
                        cellElement.classList.add('sf-fill-preview-right');
                    }
                    cellElement.classList.add(`sf-fill-preview-axis-${direction === 'left' || direction === 'right' ? 'row' : 'column'}`);
                    previewedCellsRef.current.add(cellElement);
                }
            });
        };

        // Removes autofill preview styling.
        const clearFillPreview: () => void = (): void => {
            previewedCellsRef.current.forEach((cell: HTMLElement) => {
                cell.classList.remove('sf-fill-preview-cell');
                cell.classList.remove('sf-fill-preview-top');
                cell.classList.remove('sf-fill-preview-bottom');
                cell.classList.remove('sf-fill-preview-left');
                cell.classList.remove('sf-fill-preview-right');

                cell.classList.remove('sf-fill-preview-axis-row');
                cell.classList.remove('sf-fill-preview-axis-column');
            });

            previewedCellsRef.current.clear();
        };

        // Updates fill direction and preview during drag.
        const handleMouseMove: (moveEvent: MouseEvent) => void = (moveEvent: MouseEvent): void => {
            lastMoveEvent = moveEvent;
            const gridElement: HTMLElement | undefined = gridRef.current?.element;
            const contentScrollElement: HTMLElement | null = gridElement?.querySelector('.sf-grid-content .sf-content');
            const verticalScrollElement: HTMLElement | null = gridElement?.querySelector('.sf-virtual-vertical-scrollbar');
            const horizontalScrollElement: HTMLElement | null = gridElement?.querySelector('.sf-virtual-horizontal-scrollbar');
            const verticalTarget: HTMLElement | null = verticalScrollElement || contentScrollElement;
            const horizontalTarget: HTMLElement | null = horizontalScrollElement || contentScrollElement;
            const verticalBounds: DOMRect | undefined = verticalTarget?.getBoundingClientRect();
            const horizontalBounds: DOMRect | undefined = horizontalTarget?.getBoundingClientRect();
            const edgeThreshold: number = 32;
            const scrollStep: number = 6;
            if (verticalTarget && verticalBounds) {
                if (moveEvent.clientY < verticalBounds.top + edgeThreshold) {
                    verticalTarget.scrollTop -= scrollStep;
                } else if (moveEvent.clientY > verticalBounds.bottom - edgeThreshold) {
                    verticalTarget.scrollTop += scrollStep;
                }
            }
            if (horizontalTarget && horizontalBounds) {
                if (moveEvent.clientX < horizontalBounds.left + edgeThreshold) {
                    horizontalTarget.scrollLeft -= scrollStep;
                } else if (moveEvent.clientX > horizontalBounds.right - edgeThreshold) {
                    horizontalTarget.scrollLeft += scrollStep;
                }
            }
            const isAtEdge: boolean = !!(verticalBounds && horizontalBounds &&
                (moveEvent.clientY < verticalBounds.top + edgeThreshold || moveEvent.clientY > verticalBounds.bottom - edgeThreshold ||
                moveEvent.clientX < horizontalBounds.left + edgeThreshold || moveEvent.clientX > horizontalBounds.right - edgeThreshold));
            if (isAtEdge && autoScrollFrame === null) {
                autoScrollFrame = requestAnimationFrame(() => {
                    autoScrollFrame = null;
                    handleMouseMove(lastMoveEvent);
                });
            }
            const hoveredElement: HTMLElement | null = document.elementFromPoint(moveEvent.clientX, moveEvent.clientY) as HTMLElement;
            const hoveredCell: HTMLElement | null = hoveredElement?.closest('td');

            if (!hoveredCell) {
                return;
            }
            const hoveredColIndex: number = Number(hoveredCell.getAttribute('data-colindex'));
            const hoveredRowIndex: number = Number(hoveredCell?.closest('.sf-grid-content-row')?.getAttribute('aria-rowindex'));

            let newDirection: FillDirection | null = null;
            let newCount: number = 0;

            const colDifference: number = hoveredColIndex - sourceColIndex;
            const rowDifference: number = hoveredRowIndex - sourceRowIndex;
            if (colDifference !== 0 || rowDifference !== 0) {
                hasDragged = true;
            }
            else {
                currentDirection = null;
                fillCount = 0;
                clearFillPreview();
                return;
            }

            if (Math.abs(colDifference) >= Math.abs(rowDifference)) {
                if (colDifference > 0) {
                    newDirection = 'right';
                    newCount = colDifference;
                } else if (colDifference < 0) {
                    newDirection = 'left';
                    newCount = Math.abs(colDifference);
                }
            } else {
                if (rowDifference > 0) {
                    newDirection = 'down';
                    newCount = rowDifference;
                } else if (rowDifference < 0) {
                    newDirection = 'up';
                    newCount = Math.abs(rowDifference);
                }
            }

            if (newDirection && newCount > 0 && isFillDirectionAllowed(newDirection)) {
                const isPrimaryKeySource: boolean = !!primaryKeyField && source.selectedFieldNames.includes(primaryKeyField);
                if (isPrimaryKeySource && (newDirection === 'up' || newDirection === 'down')) {
                    clearFillPreview();
                    currentDirection = null;
                    fillCount = 0;
                    return;
                }
                if (newDirection !== currentDirection || newCount !== fillCount) {
                    currentDirection = newDirection;
                    fillCount = newCount;
                    const active: ActiveFillRange = lastAutoFillRangeRef.current;
                    const isReduction: boolean = (active?.direction === 'down' && newDirection === 'up') || (active?.direction === 'right' && newDirection === 'left');
                    if (isReduction && autoFillSettings?.preventBackwardFill) {
                        clearFillPreview();
                        currentDirection = null;
                        fillCount = 0;
                        return;
                    }
                    if (isReduction && active && originalSelectionRef.current && !autoFillSettings?.preventBackwardFill) {
                        clearFillPreview();
                        const bounds: { startRow: number; endRow: number; startCol: number; endCol: number } =
                            getReducedBounds(active, Math.min(newCount, active.fillCount), originalSelectionRef.current);

                        if (bounds) {
                            const { startRow, endRow, startCol, endCol } = bounds;
                            for (let row: number = bounds.startRow; row <= bounds.endRow; row++) {
                                for (let col: number = bounds.startCol; col <= bounds.endCol; col++) {
                                    const cellElement: HTMLElement | null = getCellElement(row, col);
                                    if (cellElement) {
                                        cellElement.classList.add('sf-fill-preview-cell');
                                        if (row === startRow) {
                                            cellElement.classList.add('sf-fill-preview-top');
                                        }

                                        if (row === endRow) {
                                            cellElement.classList.add('sf-fill-preview-bottom');
                                        }

                                        if (col === startCol) {
                                            cellElement.classList.add('sf-fill-preview-left');
                                        }

                                        if (col === endCol) {
                                            cellElement.classList.add('sf-fill-preview-right');
                                        }

                                        previewedCellsRef.current.add(cellElement);
                                    }
                                }
                            }
                        }

                    } else {
                        showFillPreview(newDirection, newCount);
                    }
                }
            }
        };

        // Completes the autofill operation when dragging ends.
        const handleMouseUp: () => void = async (): Promise<void> => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            if (autoScrollFrame !== null) {
                cancelAnimationFrame(autoScrollFrame);
                autoScrollFrame = null;
            }
            clearFillPreview();
            if ((!currentDirection || fillCount <= 0) && hasDragged) {
                showFillHandle();
                hasDragged = false;
                currentDirection = null;
                fillCount = 0;
                return;
            }

            if (currentDirection && fillCount > 0 && source) {
                // Perform the fill operation
                const active: ActiveFillRange = lastAutoFillRangeRef.current;
                const isRangeReduction: boolean = (active?.direction === 'down' && currentDirection === 'up') || (active?.direction === 'right' && currentDirection === 'left');
                if (isRangeReduction) {
                    if (autoFillSettings?.preventBackwardFill) {
                        showFillHandle();
                        return;
                    }
                    else {
                        await clearReducedRange({
                            targetCells: [], direction: active.direction,
                            fillCount: Math.max(0, active.fillCount - fillCount)
                        });
                        return;
                    }
                }
                applyFill?.({ targetCells: [], direction: currentDirection, fillCount: fillCount, isAltFill: isAltPressed });
            }
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }, [getTargetCells, getFillSource, applyFill, getCellElement, isAutoFillDisabled, isFillDirectionAllowed, buildSourceBounds,
        primaryKeyField]);

    // Displays the autofill handle for the current selection.
    const showFillHandle: () => void = useCallback((): void => {
        try {
            if (!autoFillSettings?.enabled) {
                removeFillHandle();
                return;
            }
            if (isCtrlKeySelectionRef?.current) {
                removeFillHandle();
                return;
            }
            const selectedCells: RowCellInfo[] = cellSelectionModule?.getSelectedCellsData?.();
            if (!selectedCells || !selectedCells.length || isAutoFillDisabled(selectedCells) || !isAutoFillAllowed([])) {
                removeFillHandle();
                return;
            }
            removeFillHandle();
            const source: FillSourceSelection | null = getFillSource();
            if (!source) {
                activeFillBucketRef.current = null;
                return;
            }

            const bounds: SourceBounds | null = buildSourceBounds(source);
            if (!bounds) {
                return;
            }
            const selectedCellCount: number = source.selectedRowCells.reduce((count: number,
                                                                              row: RowCellInfo) => count + row.fieldNames.length, 0);
            if (selectedCellCount > 1 && sourceCellRef.current.row === null && sourceCellRef.current.col === null) {
                const selectionStart: CellPosition = cellSelectionModule?.getSelectionStartCell?.();
                if (selectionStart) {
                    sourceCellRef.current = { row: selectionStart.rowIndex, col: selectionStart.columnIndex };
                    restoreSourceCell();
                }
            }

            const maxRowIndex: number = bounds.maxRowIdx;
            const maxColIndex: number = bounds.maxColIdx;
            const minRowIndex: number = bounds.minRowIdx;
            const minColIndex: number = bounds.minColIdx;
            const pinnedRows: IRow<ColumnProps<T>>[] = [
                ...(gridRef.current?.getPinnedTopTableRowsObject?.() ?? []),
                ...(gridRef.current?.getPinnedBottomTableRowsObject?.() ?? [])
            ];
            const sourceRowIndex: number = cellSelectionModule?.getSelectionStartCell?.()?.rowIndex ?? bounds.minRowIdx;
            const sourceRow: IRow<ColumnProps<T>> | undefined = pinnedRows.find((rowObject: IRow<ColumnProps<T>>) =>
                rowObject.rowIndex === sourceRowIndex);
            activeFillBucketRef.current = sourceRow?.pinBucket ?? 'content';
            const active: ActiveFillRange | null = lastAutoFillRangeRef.current;
            if (active && (active.minRow !== minRowIndex || active.maxRow !== maxRowIndex || active.minCol !== minColIndex ||
                active.maxCol !== maxColIndex)) {
                originalSelectionRef.current = null;
                lastAutoFillRangeRef.current = null;
                sourceCellRef.current = { row: null, col: null };
                document.querySelector('.sf-fill-source-cell')?.classList.remove('sf-fill-source-cell');
            }
            // DOM data-rowindex is 1-based
            const rowElement: HTMLElement | undefined = pinnedRows.find((rowObject: IRow<ColumnProps<T>>) =>
                rowObject.rowIndex === maxRowIndex)?.element ?? Array.from(gridRef.current?.getRows?.() ?? [])
                .find((row: HTMLElement) => Number(row.getAttribute('aria-rowindex')) - 1 === maxRowIndex);
            const targetCell: HTMLElement | null = rowElement?.querySelector(`td[data-colindex="${maxColIndex + 1}"]`);

            if (!targetCell) {
                return;
            }

            if (!targetCell.classList.contains('sf-left-pinned-cell') &&
                !targetCell.classList.contains('sf-right-pinned-cell')) {
                targetCell.style.position = 'relative';
            }
            targetCell.classList.add('sf-fill-handle-container');

            const fillHandle: HTMLDivElement = document.createElement('div');

            fillHandle.className = 'sf-fill-handle';
            fillHandle.id = 'sf-fill-handle';
            fillHandle.title = 'Drag to fill cells';

            fillHandle.addEventListener('mousedown', startFillDrag);
            fillHandle.addEventListener('dblclick', autoFillOnDoubleClick);

            targetCell.appendChild(fillHandle);
        } catch (error) {
            console.error('[Cell Fill] Error rendering fill handle:', error);
        }
    }, [autoFillSettings?.enabled, cellSelectionModule, visibleColumns, isAutoFillDisabled, removeFillHandle,
        isCtrlKeySelectionRef, startFillDrag, autoFillOnDoubleClick, buildSourceBounds, isAutoFillAllowed, getCellElement]);

    return { applyFill, showFillHandle, removeFillHandle, isAutoFillAllowed, clipboardModule: clipboardModule,
        editModule: resolvedEditModule } as AutoFill;
};
export { useAutoFill as AutoFillModule };
