import { ICell, GroupedData } from '../types';
import { ColumnProps, CellSpanArgs } from '../types/column.interfaces';
import { getObject } from '../utils';

/**
 * Resolves the span value from configuration property or function.
 * Executes span function callback if provided to enable dynamic span calculation.
 *
 * @private
 * @template T - Generic type for row data
 * @param {number | boolean | Function} span - Static span value, boolean flag, or function
 * @param {CellSpanArgs} args - Cell context arguments for dynamic calculation
 * @returns {number | boolean | undefined} Resolved span value
 */
export const resolveSpanValue: <T, >(
    span: number | boolean | ((args?: CellSpanArgs<T>) => number | boolean),
    args: CellSpanArgs<T>
) => number | boolean | undefined = <T, >(
    span: number | boolean | ((args?: CellSpanArgs<T>) => number | boolean),
    args: CellSpanArgs<T>
): number | boolean | undefined => {
    if (typeof span === 'function') {
        return span(args);
    }
    return span;
};

/**
 * Compares two values for equality with special handling for Date objects.
 * Uses strict equality for most types, but compares time values for Date instances.
 *
 * @private
 * @param {unknown} first - First value to compare
 * @param {unknown} second - Second value to compare
 * @returns {boolean} True if values are equal
 */
export const areValuesEqual: (first: unknown, second: unknown) => boolean = (
    first: unknown,
    second: unknown
): boolean => {
    if (first instanceof Date && second instanceof Date) {
        return first.getTime() === second.getTime();
    }
    return first === second;
};

/**
 * Finds the index of the next visible column after the specified index.
 * Skips hidden columns (where `visible === false`).
 *
 * @template T - Generic type for column data
 * @param {number} currentIndex - Starting column index
 * @param {ColumnProps[]} columnsArray - Array of column definitions
 * @returns {number} Index of next visible column, or -1 if none found
 *
 * @example
 * ```tsx
 * const nextIdx = getNextVisibleColumnIndexAfter(2, columns);
 * // Returns 3 if column 3 is visible, or higher index if 3 is hidden
 * ```
 * @private
 */
export const getNextVisibleColumnIndexAfter: <T, >(
    currentIndex: number,
    columnsArray: ColumnProps<T>[]
) => number = <T, >(
    currentIndex: number,
    columnsArray: ColumnProps<T>[]
): number => {
    for (let idx: number = currentIndex + 1; idx < columnsArray.length; idx++) {
        if (columnsArray[idx as number].visible !== false) {
            return idx;
        }
    }
    return -1;
};

/**
 * Computes cell spanning matrix for grid rendering.
 * Calculates row and column spans for each cell based on column configuration.
 * Supports automatic span detection when values match across cells.
 *
 * @private
 * @param {ColumnProps[]} columnsArray - Array of column definitions with span configuration
 * @param {Array} renderedData - Array of row data to process (respect DOM virtualization limits)
 * @param {boolean} [enableAutoSpan=false] - Enable automatic span when adjacent cell values match
 * @param {ColumnProps} [groupColumn] - Optional group column to skip first visible column for grouped data
 * @returns {Array<Array<ICell>>} 2D matrix where each cell contains visibility and span information
 */
export const computeSpanMatrix: <T, >(
    columnsArray: ColumnProps<T>[],
    renderedData: T[],
    enableAutoSpan?: boolean,
    // visibleColumns?: ColumnProps<T>[],
    groupColumn?: ColumnProps
) => ICell<ColumnProps<T>>[][] = <T, >(
    columnsArray: ColumnProps<T>[],
    renderedData: T[],
    enableAutoSpan?: boolean,
    // visibleColumns?: ColumnProps<T>[],
    groupColumn?: ColumnProps
): ICell<ColumnProps<T>>[][] => {
    const rowCount: number = renderedData?.length ?? 0;
    const columnCount: number = columnsArray.length;
    if (!rowCount || !columnCount) {
        return [];
    }

    const matrix: ICell<ColumnProps<T>>[][] = Array.from({ length: rowCount }, () =>
        Array.from(
            { length: columnCount },
            () => ({ visible: true, colSpan: 1, rowSpan: 1 } as ICell<ColumnProps<T>>)
        )
    );
    const skipped: boolean[][] = Array.from({ length: rowCount }, () => Array(columnCount).fill(false));

    for (let rowIndex: number = 0; rowIndex < rowCount; rowIndex++) {
        const rowData: T = renderedData[rowIndex as number];
        for (let colIndex: number = 0; colIndex < columnCount; colIndex++) {
            const isSkipped: boolean = skipped[rowIndex as number][colIndex as number];
            const rowDataKey: string | undefined = (rowData as GroupedData<T>)?.flattedKey;
            const groupColumnMatch: boolean = groupColumn?.uid !== columnsArray?.[colIndex as number]?.uid && colIndex === 0;
            if (isSkipped || (groupColumn && rowDataKey && groupColumnMatch)) {
                matrix[rowIndex as number][colIndex as number] = { visible: false, colSpan: 1, rowSpan: 1 };
                continue;
            }
            const columnProps: ColumnProps<T> = columnsArray[colIndex as number];
            const spanArgs: CellSpanArgs<T> = {
                data: rowData,
                field: columnProps.field,
                rowIndex,
                colIndex,
                column: columnProps
            };
            const rawColSpan: number | boolean | undefined = groupColumn &&
                (rowData as GroupedData<T>)?.flattedKey ? columnCount : resolveSpanValue(columnProps.colSpan, spanArgs);
            const rawRowSpan: number | boolean | undefined = resolveSpanValue(columnProps.rowSpan, spanArgs);

            let colSpan: number = typeof rawColSpan === 'number' ? Math.max(1, Math.floor(rawColSpan)) : 1;
            let rowSpan: number = typeof rawRowSpan === 'number' ? Math.max(1, Math.floor(rawRowSpan)) : 1;

            colSpan = Math.min(colSpan, columnCount - colIndex);
            rowSpan = Math.min(rowSpan, rowCount - rowIndex);

            const isColAuto: boolean = rawColSpan === true && enableAutoSpan;
            const isRowAuto: boolean = rawRowSpan === true && enableAutoSpan;

            if (isColAuto) {
                const value: unknown = getObject(columnProps.field, rowData);
                let nextColumnIndex: number = colIndex;
                let compareIndex: number = getNextVisibleColumnIndexAfter(nextColumnIndex, columnsArray);
                while (compareIndex >= 0 && !skipped[rowIndex as number][compareIndex as number]) {
                    const compareColumnProps: ColumnProps<T> = columnsArray[compareIndex as number];
                    const compareSpan: number | boolean | undefined = resolveSpanValue(compareColumnProps.colSpan, {
                        data: rowData,
                        field: compareColumnProps.field,
                        rowIndex,
                        colIndex: compareIndex,
                        column: compareColumnProps
                    });
                    if (compareSpan === false) {
                        break;
                    }
                    const compareValue: unknown = getObject(compareColumnProps.field, rowData);
                    if (!areValuesEqual(value, compareValue)) {
                        break;
                    }
                    colSpan++;
                    nextColumnIndex = compareIndex;
                    compareIndex = getNextVisibleColumnIndexAfter(nextColumnIndex, columnsArray);
                }
            }

            if (isRowAuto) {
                const value: unknown = getObject(columnProps.field, rowData);
                for (let nextRow: number = rowIndex + 1; nextRow < rowCount; nextRow++) {
                    if (skipped[nextRow as number][colIndex as number]) {
                        break;
                    }
                    const nextRowData: T = renderedData[nextRow as number];
                    const compareRawRowSpan: number | boolean | undefined = resolveSpanValue(columnProps.rowSpan, {
                        data: nextRowData,
                        field: columnProps.field,
                        rowIndex: nextRow as number,
                        colIndex: colIndex as number,
                        column: columnProps
                    });
                    if (compareRawRowSpan === false) {
                        break;
                    }
                    const compareValue: unknown = getObject(columnProps.field, nextRowData);
                    if (!areValuesEqual(value, compareValue)) {
                        break;
                    }
                    rowSpan++;
                }
            }

            matrix[rowIndex as number][colIndex as number] = { visible: true, colSpan, rowSpan };
            if (rowSpan > 1 || colSpan > 1) {
                for (let rowPointer: number = rowIndex; rowPointer < rowIndex + rowSpan && rowPointer < rowCount; rowPointer++) {
                    for (let columnPointer: number = colIndex; columnPointer < colIndex + colSpan &&
                        columnPointer < columnCount; columnPointer++) {
                        if (rowPointer === rowIndex && columnPointer === colIndex) {
                            continue;
                        }
                        skipped[rowPointer as number][columnPointer as number] = true;
                    }
                }
            }
        }
    }
    return matrix;
};
