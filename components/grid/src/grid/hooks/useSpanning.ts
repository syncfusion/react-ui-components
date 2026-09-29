import { ReactElement } from 'react';
import { GroupedData } from '../types/grouping.interfaces';
import { ICell } from '../types/interfaces';
import { ColumnProps, CellSpanArgs, FlattenedColumn } from '../types/column.interfaces';
import { getObject } from '../utils/utils';

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
    groupColumn?: ColumnProps,
) => ICell<ColumnProps<T>>[][] = <T, >(
    columnsArray: ColumnProps<T>[],
    renderedData: T[],
    enableAutoSpan?: boolean,
    // visibleColumns?: ColumnProps<T>[],
    groupColumn?: ColumnProps
): ICell<ColumnProps<T>>[][] => {
    let rowCount: number = 0;
    let columnCount: number = 0;
    rowCount = renderedData?.length;
    columnCount = columnsArray.length;
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

    // const listOfColumns = Object.entries(renderedData[0 as number]).map(([key, value]) => ({ key,value }));
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
            let colSpan: number = 1;
            let rowSpan: number = 1;
            const spanArgs: CellSpanArgs<T> = {
                data: rowData,
                field: columnProps?.field,
                rowIndex,
                colIndex,
                column: columnProps
            };
            const rawColSpan: number | boolean = groupColumn &&
                (rowData as GroupedData<T>)?.flattedKey ? columnCount : resolveSpanValue(columnProps.colSpan, spanArgs);
            const rawRowSpan: number | boolean = resolveSpanValue(columnProps.rowSpan, spanArgs);

            colSpan = typeof rawColSpan === 'number' ? Math.max(1, Math.floor(rawColSpan)) : 1;
            rowSpan = typeof rawRowSpan === 'number' ? Math.max(1, Math.floor(rawRowSpan)) : 1;

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

/**
 * Checks if a leaf column exists anywhere in a parent's hierarchy.
 * Recursively traverses childDetails to find if the leaf is a descendant.
 *
 * @private
 * @template T - Generic type for column data
 * @param {FlattenedColumn<T> | undefined} parent - Parent column to search
 * @param {FlattenedColumn<T>} leaf - Leaf column to find
 * @returns {boolean} True if leaf is in parent's hierarchy
 */
const isLeafInParentHierarchy: <T, >(
    parent: FlattenedColumn<T> | undefined,
    leaf: FlattenedColumn<T>
) => boolean = <T, >(
    parent: FlattenedColumn<T> | undefined,
    leaf: FlattenedColumn<T>
): boolean => {
    if (!parent?.childDetails?.length) {
        return false;
    }
    if (parent.childDetails.includes(leaf)) {
        return true;
    }
    return parent.childDetails.some((child: FlattenedColumn<T>) =>
        isLeafInParentHierarchy(child, leaf)
    );
};

/**
 * Finds which parent at a given depth contains the specified leaf column.
 * Uses hierarchical cache to memoize results per (leaf, depth) pair.
 *
 * @private
 * @template T - Generic type for column data
 * @param {FlattenedColumn<T> | undefined} leaf - Leaf column to find parent for
 * @param {FlattenedColumn<T>[]} depthParents - All parent candidates at target depth
 * @param {Map<FlattenedColumn<T>, Map<number, FlattenedColumn<T> | undefined>>} hierarchicalCache - 2-level cache: leaf → depth → parent
 * @param {number} depth - Current depth level for cache key
 * @returns {FlattenedColumn<T> | undefined} Parent at target depth, or undefined
 */
const resolveParentForLeaf: <T, >(
    leaf: FlattenedColumn<T> | undefined,
    depthParents: FlattenedColumn<T>[],
    hierarchicalCache: Map<FlattenedColumn<T>, Map<number, FlattenedColumn<T> | undefined>>,
    depth: number
) => FlattenedColumn<T> | undefined = <T, >(
    leaf: FlattenedColumn<T> | undefined,
    depthParents: FlattenedColumn<T>[],
    hierarchicalCache: Map<FlattenedColumn<T>, Map<number, FlattenedColumn<T> | undefined>>,
    depth: number
): FlattenedColumn<T> | undefined => {
    if (!leaf) {
        return undefined;
    }

    // Check if we've already computed this (leaf, depth) pair
    let depthMap: Map<number, FlattenedColumn<T> | undefined> | undefined = hierarchicalCache.get(leaf);
    if (depthMap && depthMap.has(depth)) {
        return depthMap.get(depth);
    }

    // Find which parent at this depth contains the leaf
    const targetParent: FlattenedColumn<T> | undefined = depthParents.find((parent: FlattenedColumn<T>) =>
        isLeafInParentHierarchy(parent, leaf)
    );

    // Cache the result for future lookups
    if (!depthMap) {
        depthMap = new Map();
        hierarchicalCache.set(leaf, depthMap);
    }
    depthMap.set(depth, targetParent);

    return targetParent;
};

export const computeStackedHeaderMatrix: <T, >(
    headerRowDepth: number,
    leafColumns: FlattenedColumn<T>[],
    stackedHeaderColumns: FlattenedColumn<T>[]
) => ICell<ColumnProps<T>>[][] = <T, >(
    headerRowDepth: number,
    leafColumns: FlattenedColumn<T>[],
    stackedHeaderColumns: FlattenedColumn<T>[]
): ICell<ColumnProps<T>>[][] => {
    const rowCount: number = headerRowDepth;
    const columnCount: number = leafColumns?.length;
    if (!rowCount || !columnCount) {
        return [];
    }

    // Initialize matrix with null placeholders; each slot will be filled exactly once.
    const matrix: (ICell<ColumnProps<T>> | null)[][] = Array.from(
        { length: rowCount },
        () => Array(columnCount).fill(null)
    );

    // Group columns by depth so we process each row's entries in one pass.
    const rowEntries: FlattenedColumn<T>[][] = Array.from(
        { length: rowCount },
        () => [] as FlattenedColumn<T>[]
    );
    (stackedHeaderColumns).forEach((column: FlattenedColumn<T>) => {
        const depth: number = column.depth;
        if (depth >= 0 && depth < rowCount) {
            rowEntries[depth as number].push(column);
        }
    });

    // Hierarchical cache: leaf → depth → parent at that depth
    const hierarchicalCache: Map<FlattenedColumn<T>, Map<number, FlattenedColumn<T> | undefined>> = new Map();

    // ── Main loop: iterate row by row (depth by depth), then column by column ──
    for (let rowIndex: number = 0; rowIndex < rowCount; rowIndex++) {
        let colIdx: number = 0;

        while (colIdx < columnCount) {

            // If already filled by a rowSpan from an upper row, skip forward.
            if (matrix[rowIndex as number][colIdx as number] !== null) {
                colIdx++;
                continue;
            }

            // Find which parent at this depth contains the current leaf column.
            const leafColumn: FlattenedColumn<T> = leafColumns[colIdx as number];
            let owner: FlattenedColumn<T> | undefined = resolveParentForLeaf(
                leafColumn,
                rowEntries[rowIndex as number],
                hierarchicalCache,
                rowIndex
            );

            // If no parent found at this depth, check if the leaf itself matches the current depth
            if (!owner) {
                if (leafColumn.depth === rowIndex) {
                    // The leaf column itself is at this depth, use it as the owner
                    owner = leafColumn;
                } else {
                    // No owner found at this depth; skip this leaf
                    colIdx++;
                    continue;
                }
            }

            const ownerElement: HTMLElement | ReactElement  = owner.element;
            const ownerDepth: number = owner.depth ?? rowIndex;
            const hasChildren: boolean = (owner.childDetails?.length) > 0;
            const rowSpan: number = Math.max(1, hasChildren ? 1 : rowCount - ownerDepth);

            // ── Find the visible consecutive leaf range for this owner ────────────
            let ownerEnd: number = colIdx + 1;
            let ownerTotalWidth: number = leafColumn.totalWidth;

            for (let nextCol: number = colIdx + 1; nextCol < columnCount; nextCol++) {
                if (matrix[rowIndex as number][nextCol as number] !== null) {
                    break;
                }
                const nextLeaf: FlattenedColumn<T> = leafColumns[nextCol as number];
                const nextOwner: FlattenedColumn<T> | undefined = resolveParentForLeaf(
                    nextLeaf,
                    rowEntries[rowIndex as number],
                    hierarchicalCache,
                    rowIndex
                );
                if (nextOwner?.element !== owner.element) {
                    break;
                }
                ownerEnd = nextCol + 1;
                ownerTotalWidth += nextLeaf.totalWidth;
            }

            const ownerColSpan: number = ownerEnd - colIdx;

            // ── Place the visible source cell for the owner block ───────────────
            matrix[rowIndex as number][colIdx as number] = {
                visible: true,
                colSpan: ownerColSpan,
                rowSpan,
                element: ownerElement,
                totalWidth: ownerTotalWidth,
                depth: ownerDepth
            } as ICell<ColumnProps<T>>;

            // ── Placeholder cells for the remainder of the owner block ──────────
            for (let spanCol: number = colIdx + 1; spanCol < ownerEnd; spanCol++) {
                if (matrix[rowIndex as number][spanCol as number] === null) {
                    matrix[rowIndex as number][spanCol as number] = {
                        visible: false,
                        colSpan: 1,
                        rowSpan: 1,
                        element: ownerElement,
                        totalWidth: leafColumns[spanCol as number]?.totalWidth,
                        depth: ownerDepth
                    } as ICell<ColumnProps<T>>;
                }
            }

            // ── Placeholder rows for owner rowSpan expansion ────────────────────
            for (let nextRow: number = rowIndex + 1; nextRow < Math.min(rowCount, rowIndex + rowSpan); nextRow++) {
                for (let spanCol: number = colIdx; spanCol < ownerEnd; spanCol++) {
                    if (matrix[nextRow as number][spanCol as number] === null) {
                        matrix[nextRow as number][spanCol as number] = {
                            visible: false,
                            colSpan: 1,
                            rowSpan: 1,
                            element: ownerElement,
                            totalWidth: leafColumns[spanCol as number]?.totalWidth,
                            depth: ownerDepth
                        } as ICell<ColumnProps<T>>;
                    }
                }
            }

            colIdx = ownerEnd;
        }
    }
    return matrix as ICell<ColumnProps<T>>[][];
};
