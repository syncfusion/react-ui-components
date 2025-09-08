import {
    useCallback, useRef, useState, useEffect, RefObject,
    MouseEvent, KeyboardEvent,
    useMemo
} from 'react';
import {
    CellType,
    IRow,
    ICell
} from '../types';
import { GridRef } from '../types/grid.interfaces';
import { ColumnProps } from '../types/column.interfaces';
import { isNullOrUndefined } from '@syncfusion/react-base';
import { IFocusMatrix, FocusStrategyCallbacks, FocusStrategyResult, FocusedCellInfo, CellFocusEvent, Matrix, SwapInfo} from '../types/focus.interfaces';
// CSS class constants
const CSS_FOCUSED: string = 'sf-focused';
const CSS_FOCUS: string = 'sf-focus';

/**
 * IFocusMatrix class for tracking focusable cells
 *
 * @returns {IFocusMatrix} An object with methods for managing a matrix of focusable cells
 * @private
 */
export const createMatrix: () => IFocusMatrix = (): IFocusMatrix => {
    const matrix: number[][] = [];
    let current: number[] = [];
    let columns: number = 0;
    let rows: number = 0;

    /**
     * Sets a cell's focusable state in the matrix
     *
     * @param {number} rowIndex - Row index of the cell
     * @param {number} columnIndex - Column index of the cell
     * @param {boolean} [allow] - Whether the cell is focusable
     * @returns {void}
     */
    const set: (rowIndex: number, columnIndex: number, allow?: boolean) => void =
    (rowIndex: number, columnIndex: number, allow?: boolean): void => {
        // Ensure indices are within bounds
        rowIndex = Math.max(0, Math.min(rowIndex, rows));
        columnIndex = Math.max(0, Math.min(columnIndex, columns));

        // Ensure the row array exists
        matrix[rowIndex as number] = matrix[rowIndex as number] || [];

        // Set the cell value
        matrix[rowIndex as number][columnIndex as number] = allow ? 1 : 0;
    };

    /**
     * Checks if a cell value is invalid (0 or undefined)
     *
     * @param {number} value - Cell value to check
     * @returns {boolean} Whether the value is invalid
     */
    const inValid: (value: number) => boolean = (value: number): boolean => {
        return value === 0 || value === undefined;
    };

    /**
     * Finds the first valid cell in a vector
     *
     * @param {number[]} vector - Array of cell values
     * @param {number} index - Starting index
     * @param {number[]} navigator - Navigation direction
     * @param {boolean} [moveTo] - Whether to move to the first cell
     * @param {string} [action] - Navigation action
     * @returns {number|null} Index of the first valid cell or null if none found
     */
    const first: (
        vector: number[],
        index: number,
        navigator: number[],
        moveTo?: boolean,
        action?: string
    ) => number = (
        vector: number[],
        index: number,
        navigator: number[],
        moveTo?: boolean,
        action?: string
    ): number => {
        // Check if we're out of bounds or if there are no valid cells, visible state change helping codes
        if (((index < 0 || index === vector.length) && inValid(vector[index as number])
        && (action !== 'upArrow' && action !== 'downArrow')) || !vector.some((v: number) => v === 1)) {
            return null;
        }

        // If current cell is valid, return its index
        if (!inValid(vector[index as number])) {
            return index;
        }

        // Otherwise, recursively find the next valid cell
        const nextIndex: number = (['upArrow', 'downArrow', 'shiftUp', 'shiftDown', 'enter', 'shiftEnter'].indexOf(action) !== -1) ?
            (moveTo ? 0 : ++index) : index + navigator[1];

        return first(vector, nextIndex, navigator, false, action);
    };

    /**
     * Finds the next or previous valid cell index in the matrix
     *
     * @param {number[]} checkCellIndex - Current cell index
     * @param {boolean} next - Whether to find next (true) or previous (false) cell
     * @returns {number[]} Next or previous valid cell index
     */
    const findCellIndex: (checkCellIndex: number[], next: boolean) => number[] = (checkCellIndex: number[], next: boolean): number[] => {
        const cellIndex: number[] = [...checkCellIndex];
        let currentCellIndexPass: boolean = false;

        if (next) {
            // Find next valid cell
            for (let i: number = cellIndex[0]; i < matrix.length; i++) {
                const rowCell: number[] = matrix[i as number];

                for (let j: number = 0; rowCell && j < rowCell.length; j++) {
                    if (currentCellIndexPass && matrix[i as number][j as number] === 1) {
                        return [i, j];
                    }
                    if (!currentCellIndexPass && i === cellIndex[0] && j === cellIndex[1]) {
                        currentCellIndexPass = true;
                    }
                }
            }
        } else {
            // Find previous valid cell
            for (let i: number = cellIndex[0]; i >= 0; i--) {
                const rowCell: number[] = matrix[i as number];

                for (let j: number = rowCell.length - 1; rowCell && j >= 0; j--) {
                    if (currentCellIndexPass && matrix[i as number][j as number] === 1) {
                        return [i, j];
                    }
                    if (!currentCellIndexPass && i === cellIndex[0] && j === cellIndex[1]) {
                        currentCellIndexPass = true;
                    }
                }
            }
        }

        return cellIndex;
    };

    /**
     * Gets the next valid cell based on navigation parameters
     *
     * @param {number} rowIndex - Current row index
     * @param {number} columnIndex - Current column index
     * @param {number[]} navigator - Navigation direction
     * @param {string} [action] - Navigation action
     * @param {Function} [validator] - Function to validate cell
     * @param {Object} [active] - Active matrix info
     * @returns {number[]} Next valid cell coordinates
     */
    const get: (
        rowIndex: number,
        columnIndex: number,
        navigator: number[],
        action?: string,
        validator?: Function,
        active?: Object
    ) => number[] = (
        rowIndex: number,
        columnIndex: number,
        navigator: number[],
        action?: string,
        validator?: Function,
        active?: Object
    ): number[] => {
        const tmp: number = columnIndex;

        // Check if we're trying to navigate before the first row
        if (rowIndex + navigator[0] < 0) {
            return [rowIndex, columnIndex];
        }

        // Calculate new row index within bounds
        rowIndex = Math.max(0, Math.min(rowIndex + navigator[0], rows));

        // Check if row exists
        if (!matrix[rowIndex as number]) {
            return null;
        }

        // Calculate new column index within bounds
        columnIndex = Math.max(0, Math.min(columnIndex + navigator[1], matrix[rowIndex as number].length - 1));

        // Check if we're trying to navigate past the last column
        if (tmp + navigator[1] > matrix[rowIndex as number].length - 1 && validator(rowIndex, columnIndex, action)) {
            return [rowIndex, tmp];
        }

        // Find first valid cell in the row
        const firstIndex: number = first(matrix[rowIndex as number], columnIndex, navigator, true, action);
        columnIndex = firstIndex === null ? tmp : firstIndex;
        const val: number = matrix[rowIndex as number]?.[columnIndex as number];

        // Special handling for down arrow or enter at the last row
        if (rowIndex === rows && (action === 'downArrow' || action === 'enter')) {
            navigator[0] = -1;
        }

        // Recursively find valid cell if current is invalid
        return inValid(val) || !validator(rowIndex, columnIndex, action) ?
            get(rowIndex, tmp, navigator, action, validator,
                active) : [rowIndex, columnIndex];
    };

    /**
     * Selects a cell in the matrix
     *
     * @param {number} rowIndex - Row index to select
     * @param {number} columnIndex - Column index to select
     * @returns {void}
     */
    const select: (rowIndex: number, columnIndex: number) => void = (rowIndex: number, columnIndex: number): void => {
        rowIndex = Math.max(0, Math.min(rowIndex, rows));
        columnIndex = Math.max(0, Math.min(columnIndex, matrix[rowIndex as number]?.length - 1 || 0));

        // Create a new array instead of modifying the existing one
        current = [rowIndex, columnIndex];

        if (matrix?.[rowIndex as number] && !matrix?.[rowIndex as number]?.[columnIndex as number]) {
            matrix[rowIndex as number][columnIndex as number] = 1;
        }
    };

    /**
     * Generates a matrix from row data
     *
     * @param {Array<IRow<ColumnProps>>} rowsData - Array of row data
     * @param {Function} selector - Function to determine if a cell is focusable
     * @param {boolean} [isRowTemplate] - Whether the row is a template
     * @returns {Array<Array<number>>} The generated matrix
     */
    const generate: (
        rowsData: IRow<ColumnProps>[],
        selector: Function,
        isRowTemplate?: boolean
    ) => number[][] = (
        rowsData: IRow<ColumnProps>[],
        selector: Function,
        isRowTemplate?: boolean
    ): number[][] => {
        // Update the rows count BEFORE generating the matrix
        rows = rowsData.length - 1;

        // Clear existing matrix
        matrix.length = 0;

        for (let i: number = 0; i < rowsData.length && Array.isArray(rowsData[i as number]?.cells); i++) {
            const cells: ICell<ColumnProps>[] = rowsData[i as number]?.cells?.filter((c: ICell<ColumnProps>) => c.isSpanned !== true);

            // Update columns count
            columns = Math.max(cells.length - 1, columns || 0);

            let incrementNumber: number = 0;
            for (let j: number = 0; j < cells.length; j++) {
                incrementNumber++;

                // Set cell focusability
                set(i, j, rowsData[i as number].visible === false ?
                    false : selector(rowsData[i as number], cells[j as number], isRowTemplate));
            }

            columns = Math.max(incrementNumber - 1, columns || 0);
        }

        return matrix;
    };

    return {
        matrix,
        current,
        get columns(): number { return columns; },
        set columns(value: number) { columns = value; },
        get rows(): number { return rows; },
        set rows(value: number) { rows = value; },
        set,
        get,
        select,
        generate,
        inValid,
        first,
        findCellIndex
    };
};

/**
 * Custom hook for managing focus strategy in grid
 * Implements matrix-based navigation similar to the original class implementation
 *
 * @private
 * @param {number} headerRowCount - Number of header rows
 * @param {number} contentRowCount - Number of content rows
 * @param {number} aggregateRowCount - Number of aggregate rows
 * @param {ColumnProps} columns - columns state
 * @param {RefObject<GridRef>} gridRef - Reference to the grid
 * @param {FocusStrategyCallbacks} callbacks - Optional callbacks for focus events
 * @returns {FocusStrategyResult} Focus strategy methods and state
 */
export const useFocusStrategy: (
    headerRowCount: number,
    contentRowCount: number,
    aggregateRowCount: number,
    columns: ColumnProps[],
    gridRef: RefObject<GridRef>,
    callbacks?: FocusStrategyCallbacks
) => FocusStrategyResult = (
    headerRowCount: number,
    contentRowCount: number,
    aggregateRowCount: number,
    columns: ColumnProps[],
    gridRef: RefObject<GridRef>,
    callbacks?: FocusStrategyCallbacks
) => {
    // Create content, header, and aggregate matrices
    const contentMatrix: RefObject<IFocusMatrix> = useRef(createMatrix());
    const headerMatrix: RefObject<IFocusMatrix> = useRef(createMatrix());
    const aggregateMatrix: RefObject<IFocusMatrix> = useRef(createMatrix());

    // State for tracking focused cell - single source of truth
    const focusedCell: RefObject<FocusedCellInfo> = useRef<FocusedCellInfo>({
        rowIndex: -1,
        colIndex: -1,
        isHeader: false,
        skipAction: false,
        outline: true
    });

    // State for tracking grid focus
    const [isGridFocused, setIsGridFocused] = useState<boolean>(false);
    const focusByClick: boolean = useRef<boolean>(false).current;

    // Ref for swap info
    const swapInfo: RefObject<SwapInfo> = useRef<SwapInfo>({
        swap: false,
        toHeader: false,
        toMatrix: 'content'
    });

    // Ref for active matrix
    const activeMatrix: RefObject<Matrix> = useRef<Matrix>('content');

    // Ref for previous indexes
    const prevIndexes: RefObject<{ rowIndex?: number, cellIndex?: number }> = useRef<{ rowIndex?: number, cellIndex?: number }>({});

    // Key action mappings
    const keyActions: RefObject<{
        [key: string]: [number, number]
    }> = useRef({
        'rightArrow': [0, 1],
        'tab': [0, 1],
        'leftArrow': [0, -1],
        'shiftTab': [0, -1],
        'upArrow': [-1, 0],
        'downArrow': [1, 0],
        'shiftUp': [-1, 0],
        'shiftDown': [1, 0],
        'shiftRight': [0, 1],
        'shiftLeft': [0, -1],
        'enter': [1, 0],
        'shiftEnter': [-1, 0]
    });

    // Key indexes by action
    const indexesByKey: (action: string) => number[] = useCallback((action: string): number[] => {
        const matrix: IFocusMatrix = getActiveMatrix();
        const opt: { [key: string]: number[] } = {
            'home': [matrix.current[0], -1, 0, 1],
            'end': [matrix.current[0], matrix.columns + 1, 0, -1],
            'ctrlHome': [0, -1, 0, 1],
            'ctrlEnd': [matrix.rows, matrix.columns + 1, 0, -1]
        };
        return opt[action as string] || null;
    }, []);

    /**
     * Get the active matrix
     *
     * @returns {IFocusMatrix} The active matrix
     */
    const getActiveMatrix: () => IFocusMatrix = useCallback(() => {
        switch (activeMatrix.current) {
        case 'content': return contentMatrix.current;
        case 'aggregate': return aggregateMatrix.current;
        case 'header':
        default: return headerMatrix.current;
        }
    }, []);

    /**
     * Get the aggregate matrix
     *
     * @returns {IFocusMatrix} The aggregate matrix
     */
    const getAggregateMatrix: () => IFocusMatrix = useCallback(() => {
        return aggregateMatrix.current;
    }, []);

    /**
     * Set the active matrix
     *
     * @param {(Matrix)} matrixType - The matrix type to set as active
     * @returns {void}
     */
    const setActiveMatrix: (matrixType: Matrix) => void = useCallback((matrixType: Matrix) => {
        activeMatrix.current = matrixType;
    }, []);

    const firstFocusableHeaderCellIndex: number[] = useMemo(() => {
        const matrix: IFocusMatrix = headerMatrix.current;
        return matrix.matrix?.[0]?.[0] === 1 ? [0, 0] : matrix.findCellIndex([0, 0], true);
    }, [activeMatrix.current, headerMatrix.current, columns, isGridFocused]);

    const lastFocusableHeaderCellIndex: number[] = useMemo(() => {
        const matrix: IFocusMatrix = headerMatrix.current;
        const lastFocusableHeaderCellIndex: number[] = (matrix.matrix?.[matrix.rows]?.[matrix.columns] === 1 ?
            [matrix.rows, matrix.columns] :
            matrix.findCellIndex([matrix.rows, matrix.columns], matrix.matrix?.[matrix.rows]?.[matrix.columns] !== 0));
        return lastFocusableHeaderCellIndex;
    }, [activeMatrix.current, headerMatrix.current, columns, isGridFocused]);

    const firstFocusableContentCellIndex: number[] = useMemo(() => {
        const matrix: IFocusMatrix = contentMatrix.current;
        return matrix.matrix?.[0]?.[0] === 1 ? [0, 0] : matrix.findCellIndex([0, 0], true);
    }, [activeMatrix.current, contentMatrix.current, columns, isGridFocused, gridRef.current?.contentSectionRef?.children?.length]);

    const lastFocusableContentCellIndex: number[] = useMemo(() => {
        const matrix: IFocusMatrix = contentMatrix.current;
        return matrix.matrix?.[matrix.rows]?.[matrix.columns] === 1 ? [matrix.rows, matrix.columns] :
            matrix.findCellIndex([matrix.rows, matrix.columns], matrix.matrix?.[matrix.rows]?.[matrix.columns] !== 0);
    }, [activeMatrix.current, contentMatrix.current, columns, isGridFocused, gridRef.current?.contentSectionRef?.children?.length]);

    const firstFocusableAggregateCellIndex: number[] = useMemo(() => {
        const matrix: IFocusMatrix = aggregateMatrix.current;
        return matrix.matrix?.[0]?.[0] === 1 ? [0, 0] : matrix.findCellIndex([0, 0], true);
    }, [activeMatrix.current, aggregateMatrix.current, columns, isGridFocused, aggregateRowCount]);

    const lastFocusableAggregateCellIndex: number[] = useMemo(() => {
        const matrix: IFocusMatrix = aggregateMatrix.current;
        const lastFocusableAggregateCellIndex: number[] = (matrix.matrix?.[matrix.rows]?.[matrix.columns] === 1 ?
            [matrix.rows, matrix.columns] :
            matrix.findCellIndex([matrix.rows, matrix.columns], matrix.matrix?.[matrix.rows]?.[matrix.columns] !== 0));
        return lastFocusableAggregateCellIndex;
    }, [activeMatrix.current, aggregateMatrix.current, columns, isGridFocused, aggregateRowCount,
        gridRef.current?.getFooterRowsObject?.()]);

    /**
     * Validator function for cell navigation
     *
     * @returns {Function} Validator function
     */
    const validator: () => Function = useCallback(() => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        return (_rowIndex: number, _columnIndex: number, _action?: string) => {
            return true;
        };
    }, []);

    /**
     * Get the current from action
     *
     * @param {string} action - Navigation action
     * @param {number[]} navigator - Navigation direction
     * @param {boolean} [isPresent] - Whether the action is present
     * @param {KeyboardEvent} [_e] - Keyboard event
     * @returns {number[]|null} Current cell coordinates
     */
    const getCurrentFromAction: (
        action: string,
        navigator: number[],
        isPresent?: boolean,
        _e?: KeyboardEvent
    ) => number[] = useCallback((
        action: string,
        navigator: number[] = [0, 0],
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        _isPresent?: boolean,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        _e?: KeyboardEvent
    ): number[] => {
        const matrix: IFocusMatrix = getActiveMatrix();

        // Get current indexes based on action
        const [rowIndex, cellIndex, rN, cN] = indexesByKey(action) || [...matrix.current, ...navigator];

        // Handle special actions
        if (action === 'ctrlHome') {
            // First cell of first row
            switch (activeMatrix.current) {
            case 'content': return firstFocusableContentCellIndex;
            case 'aggregate': return firstFocusableAggregateCellIndex;
            case 'header':
            default: return firstFocusableHeaderCellIndex;
            }
        } else if (action === 'ctrlEnd') {
            // Last cell of last row
            switch (activeMatrix.current) {
            case 'content': return lastFocusableContentCellIndex;
            case 'aggregate': return lastFocusableAggregateCellIndex;
            case 'header':
            default: return lastFocusableHeaderCellIndex;
            }
        } else if (action === 'home') {
            // First cell of current row
            let firstColIndex: number;
            switch (activeMatrix.current) {
            case 'content': firstColIndex = firstFocusableContentCellIndex[1]; break;
            case 'aggregate': firstColIndex = firstFocusableAggregateCellIndex[1]; break;
            case 'header':
            default: firstColIndex = firstFocusableHeaderCellIndex[1]; break;
            }
            return [rowIndex, firstColIndex];
        } else if (action === 'end') {
            // Last cell of current row
            let lastColIndex: number;
            switch (activeMatrix.current) {
            case 'content': lastColIndex = lastFocusableContentCellIndex[1]; break;
            case 'aggregate': lastColIndex = lastFocusableAggregateCellIndex[1]; break;
            case 'header':
            default: lastColIndex = lastFocusableHeaderCellIndex[1]; break;
            }
            return [rowIndex, lastColIndex];
        }

        // For tab/shift+tab navigation at boundaries
        if (action === 'tab' && ((activeMatrix.current === 'content' && cellIndex >= lastFocusableContentCellIndex[1]) ||
            (activeMatrix.current === 'header' && cellIndex >= lastFocusableHeaderCellIndex[1]) ||
            (activeMatrix.current === 'aggregate' && cellIndex >= lastFocusableAggregateCellIndex[1]))) {
            // At the end of a row, move to the first cell of the next row
            if (rowIndex < matrix.rows) {
                let firstColIndex: number;
                switch (activeMatrix.current) {
                case 'content': firstColIndex = firstFocusableContentCellIndex[1]; break;
                case 'aggregate': firstColIndex = firstFocusableAggregateCellIndex[1]; break;
                case 'header':
                default: firstColIndex = firstFocusableHeaderCellIndex[1]; break;
                }
                return [rowIndex + 1, firstColIndex];
            }
        } else if (action === 'shiftTab' && ((activeMatrix.current === 'content' && cellIndex <= firstFocusableContentCellIndex[1]) ||
            (activeMatrix.current === 'header' && cellIndex <= firstFocusableHeaderCellIndex[1]) ||
            (activeMatrix.current === 'aggregate' && cellIndex <= firstFocusableAggregateCellIndex[1]))) {
            // At the beginning of a row, move to the last cell of the previous row
            if (rowIndex > 0) {
                let lastColIndex: number;
                switch (activeMatrix.current) {
                case 'content': lastColIndex = lastFocusableContentCellIndex[1]; break;
                case 'aggregate': lastColIndex = lastFocusableAggregateCellIndex[1]; break;
                case 'header':
                default: lastColIndex = lastFocusableHeaderCellIndex[1]; break;
                }
                return [rowIndex - 1, lastColIndex];
            }
        }

        // Get next valid cell
        const current: number[] = matrix.get(
            rowIndex,
            cellIndex,
            [rN, cN],
            action,
            validator(),
            { matrix: matrix }
        );

        return current;
    }, [getActiveMatrix, indexesByKey, validator,
        firstFocusableContentCellIndex,
        lastFocusableContentCellIndex,
        firstFocusableHeaderCellIndex,
        lastFocusableHeaderCellIndex,
        firstFocusableAggregateCellIndex,
        lastFocusableAggregateCellIndex,
        activeMatrix.current]);

    /**
     * Handle key press event
     *
     * @param {KeyboardEvent} e - Keyboard event
     * @returns {boolean} Whether the key press was handled
     */
    const onKeyPress: (e: KeyboardEvent) => boolean = useCallback((e: KeyboardEvent): boolean => {
        const isMacLike: boolean = /(Mac)/i.test(navigator.platform);
        let action: string = '';

        // Convert key to action
        switch (e.key) {
        case 'ArrowRight': action = 'rightArrow'; break;
        case 'ArrowLeft': action = 'leftArrow'; break;
        case 'ArrowUp': action = e.shiftKey ? 'shiftUp' : 'upArrow'; break;
        case 'ArrowDown': action = e.shiftKey ? 'shiftDown' : 'downArrow'; break;
        case 'Tab': action = e.shiftKey ? 'shiftTab' : 'tab'; break;
        case 'Enter': action = e.shiftKey ? 'shiftEnter' : 'enter'; break;
        case 'Home': action = e.ctrlKey || (isMacLike && e.metaKey) ? 'ctrlHome' : 'home'; break;
        case 'End': action = e.ctrlKey || (isMacLike && e.metaKey) ? 'ctrlEnd' : 'end'; break;
        default: return true; // Not a navigation key
        }

        // Handle Mac-specific key combinations
        if (isMacLike && e.metaKey && ['downArrow', 'upArrow', 'leftArrow', 'rightArrow'].indexOf(action) !== -1) {
            return true;
        }

        // Get navigation vectors
        const navigators: number[] = keyActions.current[action as string];

        // Get current position from action
        const matrix: IFocusMatrix = getActiveMatrix();

        const current: number[] = getCurrentFromAction(action, navigators, action in keyActions.current, e);

        if (!current) { return true; }

        // Check if we're at the boundary of the current matrix
        const isAtHeaderBottom: boolean = activeMatrix.current === 'header' &&
            current.toString() === headerMatrix.current.current.toString() && action === 'downArrow';
        const isAtContentTop: boolean = activeMatrix.current === 'content' &&
            current.toString() === contentMatrix.current.current.toString() && action === 'upArrow';
        const isAtContentBottom: boolean = activeMatrix.current === 'content' &&
            current.toString() === contentMatrix.current.current.toString() && action === 'downArrow';
        const isAtAggregateTop: boolean = activeMatrix.current === 'aggregate' &&
            current.toString() === aggregateMatrix.current.current.toString() && action === 'upArrow';
        const isAtAggregateBottom: boolean = activeMatrix.current === 'aggregate' &&
            current.toString() === aggregateMatrix.current.current.toString() && action === 'downArrow';
        const isAtHeaderRight: boolean = activeMatrix.current === 'header' &&
            current.toString() === headerMatrix.current.current.toString() && action === 'tab';
        const isAtContentLeft: boolean = activeMatrix.current === 'content' &&
            current.toString() === contentMatrix.current.current.toString() && action === 'shiftTab';
        const isAtContentRight: boolean = activeMatrix.current === 'content' &&
            current.toString() === contentMatrix.current.current.toString() && action === 'tab';
        const isAtAggregateLeft: boolean = activeMatrix.current === 'aggregate' &&
            current.toString() === aggregateMatrix.current.current.toString() && action === 'shiftTab';
        const isAtAggregateRight: boolean = activeMatrix.current === 'aggregate' &&
            current.toString() === aggregateMatrix.current.current.toString() && action === 'tab';

        // Handle boundary navigation between header, content, and aggregate
        if (isAtHeaderBottom || isAtHeaderRight) {
            swapInfo.current = { swap: true, toMatrix: 'content' };
            return false;
        } else if (isAtContentTop || isAtContentLeft) {
            swapInfo.current = { swap: true, toMatrix: 'header' };
            return false;
        } else if ((isAtContentBottom || isAtContentRight) && aggregateRowCount > 0) {
            swapInfo.current = { swap: true, toMatrix: 'aggregate' };
            return false;
        } else if (isAtAggregateTop || isAtAggregateLeft) {
            swapInfo.current = { swap: true, toMatrix: 'content' };
            return false;
        } else if (isAtAggregateBottom || isAtAggregateRight) {
            // From aggregate, exit the grid (no more matrices below)
            return false;
        }

        // Update matrix selection - IMPORTANT: Create a new array to ensure React detects the change
        matrix.select(current[0], current[1]);

        // This line is key for keyboard navigation to work properly
        // We need to create a new array to ensure the reference changes
        matrix.current = [...current];

        return true;
    }, [getCurrentFromAction, getActiveMatrix, activeMatrix.current, focusedCell.current]);

    /**
     * Clear focus indicator without changing focus state
     * Used when focus moves out of grid or during specific actions
     *
     * @returns {void}
     */
    const clearIndicator: () => void = useCallback((): void => {
        if (focusedCell.current.element) {
            // Remove focus classes directly from DOM
            focusedCell.current.element.classList.remove(CSS_FOCUSED, CSS_FOCUS);
            focusedCell.current.elementToFocus.classList.remove(CSS_FOCUSED, CSS_FOCUS);
        }
    }, [focusedCell.current]);

    /**
     * Remove focus from current cell - update state and DOM
     *
     * @returns {void}
     */
    const removeFocus: () => void = useCallback((): void => {
        if (focusedCell.current.element) {
            // Remove focus classes directly from DOM
            focusedCell.current.element.classList.remove(CSS_FOCUSED, CSS_FOCUS);
            focusedCell.current.element.tabIndex = -1;
        }
        // Update state
        focusedCell.current = {
            rowIndex: -1,
            colIndex: -1,
            isHeader: false,
            skipAction: false,
            outline: true
        };
    }, [focusedCell.current]);

    const removeFocusTabIndex: () => void = (): void => {
        // Find the currently focused cell and remove focus
        const currentFocusedCell: NodeListOf<Element> = gridRef.current?.element?.
            querySelectorAll('[tabindex="0"]:not([data-role="page"], [data-role="page"] *, [role="toolbar"], [role="toolbar"] *, .sf-filterbar *, .sf-gridform *)');
        currentFocusedCell?.forEach((cell: HTMLElement) => {
            cell.classList.remove(CSS_FOCUSED, CSS_FOCUS);
            cell.tabIndex = -1;
        });
    };

    /**
     * Add focus to a cell - update state and DOM
     *
     * @param {FocusedCellInfo} info - Cell info to focus
     * @param {KeyboardEvent} [e] - Keyboard event
     * @returns {void}
     */
    const addFocus: (info: FocusedCellInfo, e?: KeyboardEvent | MouseEvent) => void =
        useCallback((info: FocusedCellInfo, e?: KeyboardEvent | MouseEvent): void => {
            removeFocusTabIndex();

            const newInfo: FocusedCellInfo = {
                ...info,
                outline: info.outline !== false && !info.element?.classList?.contains?.('sf-filterbarcell'), // Default to true if not explicitly set to false
                element: info.element,
                elementToFocus: info.elementToFocus
            };

            // Update the focused cell state
            focusedCell.current = newInfo;

            // Add focus classes directly to DOM
            if (newInfo.outline) {
                newInfo.element?.classList.add(CSS_FOCUSED);
            }
            newInfo.elementToFocus?.classList.add(CSS_FOCUS);

            // Set tabIndex - ensure only one element has tabIndex=0
            if (newInfo.element) {
                newInfo.element.tabIndex = 0;
            }

            // Focus the element using DOM API
            requestAnimationFrame(() => {
                const firstFocusableElement: HTMLElement = newInfo.elementToFocus?.querySelector(
                    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                );
                const container: HTMLDivElement | null = gridRef.current?.contentScrollRef;
                const element: HTMLElement | null =
                    (firstFocusableElement ?? newInfo.elementToFocus)?.closest?.('td.sf-rowcell, th.sf-headercell');

                if (container && element) {
                    const containerRect: DOMRect = container.getBoundingClientRect();
                    const elementRect: DOMRect = element.getBoundingClientRect();

                    // Scroll left if element is partially hidden on the left
                    if (elementRect.left < containerRect.left) {
                        container.scrollLeft = element.offsetLeft;
                    }
                    // Scroll right if element is partially hidden on the right
                    else if (elementRect.right > containerRect.right) {
                        container.scrollLeft = (element.offsetLeft + element.offsetWidth - container.clientWidth);
                    }
                }

                if (firstFocusableElement) {
                    firstFocusableElement.focus();
                } else {
                    newInfo.elementToFocus?.focus();
                }
            });

            // Notify cell focused
            const matrix: IFocusMatrix = getActiveMatrix();
            const args: CellFocusEvent = {
                element: newInfo.elementToFocus,
                parent: newInfo.element,
                indexes: matrix.current,
                byKey: e ? e.type === 'keydown' : !!e,
                byClick: e ? e.type === 'click' : !e,
                keyArgs: e,
                isJump: swapInfo.current.swap,
                container: {
                    isContent: activeMatrix.current === 'content',
                    isHeader: activeMatrix.current === 'header'
                },
                outline: newInfo.outline,
                swapInfo: swapInfo.current,
                rowIndex: newInfo.rowIndex,
                columnIndex: newInfo.colIndex,
                column: gridRef.current.getColumns()[newInfo.colIndex],
                rowData: gridRef.current.getRowsObject()[newInfo.rowIndex]?.data,
                event: e
            };

            callbacks?.onCellFocus?.(args);

            // Update previous indexes
            const [rowIndex, cellIndex]: number[] = matrix.current;
            prevIndexes.current = { rowIndex, cellIndex };
        }, [getActiveMatrix, callbacks, focusedCell.current, activeMatrix.current, gridRef]);

    /**
     * Handle click event
     *
     * @param {MouseEvent} e - Mouse event
     * @param {boolean} [_force] - Force flag
     * @returns {boolean} Whether the click was handled
     */
    const onClick: (e: MouseEvent, _force?: boolean) => boolean =
        useCallback((e: MouseEvent,
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
                     _force?: boolean): boolean => {
            const target: HTMLElement = e.target as HTMLElement;
            const cellElement: HTMLTableCellElement = target.closest('td, th') as HTMLTableCellElement;

            if (!cellElement) { return false; }

            const rowElement: HTMLTableRowElement = cellElement.closest('tr');

            const isHeader: boolean = cellElement.tagName.toLowerCase() === 'th';
            const isAggregate: boolean = cellElement.closest('.sf-summaryrow') !== null;
            if (isHeader) {
                setActiveMatrix('header');
            } else if (isAggregate) {
                setActiveMatrix('aggregate');
            } else {
                setActiveMatrix('content');
            }

            const matrix: IFocusMatrix = getActiveMatrix();
            let rows: HTMLCollectionOf<HTMLTableRowElement>;
            if (isHeader) {
                rows = gridRef.current?.getHeaderTable()?.rows;
            } else if (isAggregate) {
                rows = gridRef.current?.getFooterRows();
            } else {
                const contentTable: HTMLTableElement = gridRef.current?.getContentTable();
                const contentRows: HTMLCollectionOf<HTMLTableRowElement> | NodeListOf<HTMLTableRowElement> = gridRef.current?.isEdit &&
                        gridRef.current?.editModule?.isShowAddNewRowActive ?
                    contentTable?.querySelectorAll?.('tr.sf-row:not(.sf-addedrow)') : contentTable?.rows;
                rows = contentRows as HTMLCollectionOf<HTMLTableRowElement>;
            }

            if (!rows) { return false; }

            const rowIndex: number = Array.from(rows).indexOf(rowElement);
            const cellIndex: number = Array.from(rowElement.cells).indexOf(cellElement);

            if (rowIndex < 0 || cellIndex < 0) { return false; }

            // Before cell focus event
            const beforeArgs: CellFocusEvent = {
                cancel: false,
                byKey: false,
                byClick: true,
                rowIndex: rowIndex,
                columnIndex: cellIndex,
                element: cellElement
            };

            callbacks?.beforeCellFocus?.(beforeArgs);
            if (beforeArgs.cancel) { return false; }

            // Update the matrix selection
            matrix.select(rowIndex, cellIndex);
            // Create a new array to ensure the reference changes
            matrix.current = [rowIndex, cellIndex];

            // Create focus info for the clicked cell
            const info: FocusedCellInfo = {
                rowIndex: rowIndex,
                colIndex: cellIndex,
                isHeader: isHeader,
                isAggregate: isAggregate,
                element: cellElement,
                elementToFocus: cellElement,
                outline: true
            };

            // Add focus to the clicked cell
            addFocus(info, e);

            // Notify cell clicked
            const args: CellFocusEvent = {
                element: cellElement,
                parent: cellElement,
                indexes: [rowIndex, cellIndex],
                byKey: false,
                byClick: true,
                isJump: false,
                container: {
                    isContent: !isHeader && !isAggregate,
                    isHeader: isHeader,
                    isAggregate: isAggregate
                },
                outline: true,
                rowIndex: rowIndex,
                columnIndex: cellIndex,
                column: gridRef.current.getColumns()[parseInt(cellIndex.toString(), 10)],
                rowData: gridRef.current.getRowsObject()[parseInt(rowIndex.toString(), 10)]?.data,
                event: e
            };
            callbacks?.onCellClick?.(args);

            return true;
        }, [getActiveMatrix, setActiveMatrix, gridRef, callbacks, addFocus, removeFocus, activeMatrix.current]);

    /**
     * Get focus info for the current cell
     *
     * @returns {FocusedCellInfo} Focus info
     */
    const getFocusInfo: () => FocusedCellInfo = useCallback((): FocusedCellInfo => {
        const info: FocusedCellInfo = {
            rowIndex: 0,
            colIndex: 0,
            isHeader: false
        };
        const matrix: IFocusMatrix = getActiveMatrix();
        const [rowIndex, cellIndex]: number[] = matrix.current;

        matrix.current = [rowIndex, cellIndex];

        const isContent: boolean = activeMatrix.current === 'content';
        const isAggregate: boolean = activeMatrix.current === 'aggregate';
        let table: HTMLTableElement | undefined;
        if (isContent) {
            table = gridRef.current?.getContentTable();
        } else if (isAggregate) {
            table = gridRef.current?.getFooterTable();
        } else {
            table = gridRef.current?.getHeaderTable();
        }
        const rows: HTMLCollectionOf<HTMLTableRowElement> | NodeListOf<HTMLTableRowElement> = gridRef.current?.isEdit &&
            gridRef.current?.editModule?.isShowAddNewRowActive ? table?.querySelectorAll?.('tr.sf-row:not(.sf-addedrow)') :
            table?.rows;
        if (!table || !rows || rowIndex >= rows.length) {
            return info;
        }

        const row: HTMLTableRowElement | undefined = rows[rowIndex as number];
        if (!row) { return info; }

        info.element = row.cells[cellIndex as number] as HTMLElement;

        if (!info.element) {
            return info;
        }

        info.elementToFocus = info.element;
        info.outline = true;
        info.uid = row.getAttribute('data-uid');
        info.isHeader = !isContent && !isAggregate;
        info.isAggregate = isAggregate;
        info.rowIndex = rowIndex;
        info.colIndex = cellIndex;

        return info;
    }, [getActiveMatrix, gridRef, activeMatrix.current]);

    /**
     * Focus a cell
     *
     * @param {KeyboardEvent} [e] - Keyboard event
     * @returns {void}
     */
    const focus: (e?: KeyboardEvent) => void = useCallback((e?: KeyboardEvent): void => {
        // Get the current matrix
        const matrix: IFocusMatrix = getActiveMatrix();

        // Get the current position from the matrix
        const [rowIndex, cellIndex]: number[] = matrix.current;

        // Get the table based on active matrix
        let table: HTMLTableElement | null;
        switch (activeMatrix.current) {
        case 'content':
            table = gridRef.current?.getContentTable();
            break;
        case 'aggregate':
            table = gridRef.current?.getFooterTable();
            break;
        case 'header':
        default:
            table = gridRef.current?.getHeaderTable();
            break;
        }

        // Create focus info object
        const info: FocusedCellInfo = {
            rowIndex,
            colIndex: cellIndex,
            isHeader: activeMatrix.current === 'header',
            isAggregate: activeMatrix.current === 'aggregate',
            outline: true
        };

        const rows: HTMLCollectionOf<HTMLTableRowElement> | NodeListOf<HTMLTableRowElement> = gridRef.current?.isEdit &&
            gridRef.current?.editModule?.isShowAddNewRowActive ? table?.querySelectorAll?.('tr.sf-row:not(.sf-addedrow)') :
            table?.rows;
        // Find the element in the DOM
        if (table && rows.length > rowIndex &&
        rows[rowIndex as number] &&
        rows[rowIndex as number].cells.length > cellIndex) {

            info.element = rows[rowIndex as number].cells[cellIndex as number] as HTMLElement;
            info.elementToFocus = info.element;

            // If we found an element, add focus to it
            addFocus(info, e);
            return;
        }
    }, [getFocusInfo, getActiveMatrix, activeMatrix.current, gridRef, addFocus, activeMatrix.current]);

    /**
     * Add outline to the focused cell
     * Used by Alt+W shortcut
     *
     * @returns {void}
     */
    const addOutline: () => void = useCallback(() => {
        const info: FocusedCellInfo = getFocusInfo();
        info.element?.classList.add(CSS_FOCUSED);
        info.elementToFocus?.classList.add(CSS_FOCUS);
    }, [getFocusInfo]);

    /**
     * Handle keyboard navigation
     *
     * @param {KeyboardEvent} event - Keyboard event
     * @returns {void}
     */
    const handleKeyDown: (event: KeyboardEvent) => void = useCallback((event: KeyboardEvent): void => {
        // Enhanced edit mode detection and handling
        const isGridInEditMode: boolean = gridRef.current?.isEdit || false;

        // Enhanced detection for edit context elements
        const activeElement: HTMLElement | null = document.activeElement as HTMLElement;
        const isInEditCell: boolean | Element = activeElement && (
            activeElement.closest('.sf-edit-cell') ||
            activeElement.closest('.sf-editedrow') ||
            activeElement.closest('.sf-addedrow')
        );
        const isInFilterBar: boolean | Element = activeElement?.closest('.sf-filterbarcell');

        // Enhanced edit mode handling for proper Tab navigation between fields
        // Prevent grid navigation from interfering with edit field focus
        // Based on the information in your clipboard, this ensures Tab navigation works properly within edit forms
        if ((isGridInEditMode && isInEditCell)) {
            if (event.key === 'Tab') {
                // Allow Tab navigation between edit fields
                // Don't prevent default - let the EditForm component handle field navigation
                // This enables the proper Tab navigation exit behavior where continuous Tab/Shift+Tab
                // will eventually save the form and focus the saved row's first visible cell
                return;
            } else if (event.key === 'Enter') {
                // Allow Enter to save/commit edit - let it bubble up to EditCell
                // Don't prevent default to allow proper form submission
                return;
            } else if (event.key === 'Escape') {
                // Allow Escape to cancel edit - let it bubble up to EditCell
                // Don't prevent default to allow proper edit cancellation
                return;
            } else if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown'].includes(event.key)) {
                // Allow text cursor movement within inputs during editing
                // Don't block these keys - let them work normally within input fields
                // This is essential for proper text editing experience
                return;
            } else if (event.key.length === 1 || ['Backspace', 'Delete', 'Insert'].includes(event.key)) {
                // Allow all typing and editing keys to work normally
                // This includes letters, numbers, symbols, and basic editing keys
                return;
            } else {
                // Allow all other keys for normal input behavior (Ctrl+C, Ctrl+V, etc.)
                return;
            }
        }

        // Enhanced filter bar handling - allow normal input behavior
        if (isInFilterBar) {
            if (event.key !== 'Tab') {
                // Allow Tab navigation in filter bar
                return;
            }
        }

        // Only set grid as focused if it's not already and we're not in edit mode
        // This prevents focus interference during editing
        if (!isGridFocused && !isGridInEditMode) {
            setIsGridFocused(true);
        }

        // Skip if not a navigation key or grid's inputs controls non tab keys behavior
        if ((!isNavigationKey(event) && !(getNavigationDirection(event) === 'escape'
            || getNavigationDirection(event) === 'ctrlPlusA' || getNavigationDirection(event) === 'space')) || (!event.key.includes('Tab')
            && document.activeElement.tagName === 'INPUT'
            && document.activeElement.closest('.sf-filterbarcell'))) { return; }

        // Prevent default browser behavior for navigation keys
        event.preventDefault();

        // Before cell focus event
        const beforeArgs: CellFocusEvent = {
            cancel: false,
            byKey: true,
            byClick: false,
            keyArgs: event,
            rowIndex: focusedCell.current.rowIndex,
            columnIndex: focusedCell.current.colIndex
        };

        callbacks?.beforeCellFocus?.(beforeArgs);
        if (beforeArgs.cancel) { return; }

        // Process key press
        const result: boolean | undefined = onKeyPress(event);

        if (result === false) {
            // Handle boundary navigation
            if (swapInfo.current.swap) {
                // Determine target matrix from swap info
                const targetMatrix: Matrix = swapInfo.current.toMatrix || 'content';
                setActiveMatrix(targetMatrix);

                // Get the appropriate matrix after switching
                const matrix: IFocusMatrix = getActiveMatrix();

                // Determine the action from the key event
                const action: string = getNavigationDirection(event);

                if (targetMatrix === 'header') {
                    // Moving to header - find appropriate header cell based on navigation direction
                    if (matrix.matrix?.length > 0 && columns?.length > 0) {
                        if (action === 'upArrow' || action === 'shiftTab') {
                            // When moving up to header or shift+tab to header, go to the last cell in the header
                            const lastHeaderRow: number = matrix.matrix?.length - 1;
                            const lastHeaderCol: number = action === 'upArrow' && (contentRowCount > 0 || aggregateRowCount > 0) ?
                                focusedCell.current.colIndex :
                                (action === 'upArrow' ? firstFocusableHeaderCellIndex[1] : lastFocusableHeaderCellIndex[1]);
                            matrix.select(lastHeaderRow, lastHeaderCol);
                            matrix.current = [lastHeaderRow, lastHeaderCol];
                        }
                    }
                } else if (targetMatrix === 'content') {
                    // Moving to content - find appropriate content cell based on navigation direction
                    if (contentRowCount > 0 && columns?.length > 0) {
                        if (action === 'downArrow' || action === 'tab') {
                            // When moving down to content or tab to content, go to the first cell in content
                            const firstContentCol: number = action === 'downArrow' ? focusedCell.current.colIndex :
                                (firstFocusableContentCellIndex[1]);
                            matrix.select(0, firstContentCol);
                            matrix.current = [0, firstContentCol];
                        } else if (action === 'upArrow' || action === 'shiftTab') {
                            // When moving up to content from aggregate or shift+tab from aggregate
                            const lastContentRow: number = matrix.matrix?.length - 1 || 0;
                            const lastContentCol: number = action === 'upArrow' ? focusedCell.current.colIndex :
                                lastFocusableContentCellIndex[1];
                            matrix.select(lastContentRow, lastContentCol);
                            matrix.current = [lastContentRow, lastContentCol];
                        }
                    }
                } else if (targetMatrix === 'aggregate') {
                    // Moving to aggregate - find appropriate aggregate cell based on navigation direction
                    if (aggregateRowCount > 0 && columns?.length > 0) {
                        if (action === 'downArrow' || action === 'tab') {
                            // When moving down to aggregate or tab to aggregate, go to the first cell in aggregate
                            const firstAggregateCol: number = action === 'downArrow' ? focusedCell.current.colIndex :
                                firstFocusableAggregateCellIndex[1];
                            matrix.select(0, firstAggregateCol);
                            matrix.current = [0, firstAggregateCol];
                        }
                    }
                }
                focus(event);
                // Reset swap info
                swapInfo.current = { swap: false, toHeader: false, toMatrix: 'content' };
            }
            return;
        }

        // Focus the cell
        focus(event);
    }, [isGridFocused, setIsGridFocused, focusedCell.current, onKeyPress, setActiveMatrix, getActiveMatrix, focus, callbacks,
        headerRowCount, contentRowCount, aggregateRowCount, columns?.length, activeMatrix.current, addFocus]);

    /**
     * Handle grid-level click event
     *
     * @param {MouseEvent} event - Mouse event
     * @returns {void}
     */
    const handleGridClick: (event: MouseEvent) => void = useCallback((event: MouseEvent): void => {
        if (!isGridFocused) {
            setIsGridFocused(true);
        }
        onClick(event);
    }, [onClick, setIsGridFocused, isGridFocused]);

    const generateHeaderFilterRow: (rows?: IRow<ColumnProps>[]) => void = (rows?: IRow<ColumnProps>[]): void => {
        const length: number = headerMatrix.current.matrix.length;
        if (gridRef.current.filterSettings?.enabled && gridRef.current.filterSettings?.type === 'FilterBar') {
            headerMatrix.current.rows = ++headerMatrix.current.rows;
            const cells: ICell<ColumnProps>[] = rows[0]?.cells;
            let incrementNumber: number = 0;
            for (let i: number = 0; i < cells?.length; i++) {
                headerMatrix.current.set(
                    length, incrementNumber,
                    cells[parseInt(i.toString(), 10)].visible && cells[parseInt(i.toString(), 10)].column.allowFilter !== false);
                incrementNumber++;
            }
        }
    };

    /**
     * Initialize matrices when row or column count changes
     */
    useEffect(() => {
        // Initialize content matrix
        const isRowTemplate: boolean = !isNullOrUndefined(gridRef.current.rowTemplate);
        if (contentRowCount > 0 && columns?.length > 0) {
            // Create proper row models similar to the original implementation
            // Use Array.from with index parameter to avoid unused variables
            const rows: IRow<ColumnProps>[] = gridRef.current.getRowsObject();

            // Set the rows count explicitly before generating
            contentMatrix.current.rows = contentRowCount - 1;
            contentMatrix.current.columns = columns?.length - 1;

            // Generate matrix with proper selector function
            contentMatrix.current.generate(rows, (row: IRow<ColumnProps>, cell: ICell<ColumnProps>) => {
                return (row.isDataRow && cell.visible && (cell.isDataCell)) ||
                (cell.column && cell.visible)
                || (cell.cellType === CellType.CommandColumn);
            }, isRowTemplate);

            // Initialize current position to first valid cell
            const firstValidCell: number[] = contentMatrix.current?.matrix?.[0]?.[0] === 1 ? [0, 0] :
                contentMatrix.current.findCellIndex([0, 0], true);
            contentMatrix.current.current = [...firstValidCell];
        } else {
            contentMatrix.current.matrix[0] = [1]; // empty no records cell [1]
        }

        // Initialize header matrix
        if (headerRowCount > 0 && columns?.length > 0) {
            // Create proper header row models
            // Use Array.from with index parameter to avoid unused variables
            const rows: IRow<ColumnProps>[] = gridRef.current.getHeaderRowsObject();

            // Set the rows count explicitly before generating
            headerMatrix.current.rows = headerRowCount - 1;
            headerMatrix.current.columns = columns?.length - 1;

            // Generate matrix with proper selector function for headers
            // Use destructuring to ignore the first parameter
            headerMatrix.current.generate(rows, (_unusedRow: IRow<ColumnProps>, cell: ICell<ColumnProps>) => {
                return cell.visible && (cell.column.field !== undefined || cell.isTemplate ||
                cell.column.template !== undefined ||
                cell.column.type === 'checkbox' || cell.cellType === CellType.StackedHeader);
            }, isRowTemplate);
            generateHeaderFilterRow(rows);

            // Initialize current position to first valid cell
            const firstValidCell: number[] = headerMatrix.current.matrix?.[0]?.[0] === 1 ? [0, 0] :
                headerMatrix.current.findCellIndex([0, 0], true);
            headerMatrix.current.current = [...firstValidCell];
        }

        // Initialize aggregate matrix
        if (aggregateRowCount > 0 && columns?.length > 0) {
            // Create proper aggregate row models
            const rows: IRow<ColumnProps>[] = gridRef.current.getFooterRowsObject ? gridRef.current.getFooterRowsObject() : [];

            // Set the rows count explicitly before generating
            aggregateMatrix.current.rows = aggregateRowCount - 1;
            aggregateMatrix.current.columns = columns?.length - 1;

            // Generate matrix with proper selector function for aggregates
            aggregateMatrix.current.generate(rows, (row: IRow<ColumnProps>, cell: ICell<ColumnProps>) => {
                return row.isAggregateRow && cell.visible;
            }, isRowTemplate);

            // Initialize current position to first valid cell
            const firstValidCell: number[] = aggregateMatrix.current?.matrix?.[0]?.[0] === 1 ? [0, 0] :
                aggregateMatrix.current.findCellIndex([0, 0], true);
            aggregateMatrix.current.current = [...firstValidCell];
        }

        setFirstFocusableTabIndex();
        if (focusedCell.current.isHeader && focusedCell.current.rowIndex !== -1
            && focusedCell.current.colIndex !== -1) {
            headerMatrix.current.current = [focusedCell.current.rowIndex, focusedCell.current.colIndex];
        }
    }, [headerRowCount, contentRowCount, aggregateRowCount, columns?.length, columns]);
    useEffect(() => {
        if (isGridFocused && focusedCell.current.rowIndex === -1 && focusedCell.current.colIndex === -1 &&
                activeMatrix.current === 'content') {
            setLastContentCellTabIndex();
        }
    }, [isGridFocused]);
    /**
     * Set the first focusable element's tabIndex to 0
     * This is used to allow users to tab into the grid
     *
     * @returns {void}
     */
    const setFirstFocusableTabIndex: () => void = useCallback(() => {
        if (!gridRef.current || !gridRef.current.element) { return; }

        // Set grid element tabIndex to -1
        gridRef.current.element.tabIndex = -1;

        // Clear any existing tabIndex=0 and focus classes
        const currentFocusableCell: HTMLElement | null = gridRef.current.element.querySelector('th[tabindex="0"]');
        if (currentFocusableCell) {
            (currentFocusableCell as HTMLElement).tabIndex = -1;
            currentFocusableCell.classList.remove(CSS_FOCUSED, CSS_FOCUS);
        }

        // For basic grid, set first visible header cell tabIndex to 0
        if (columns?.length > 0 && gridRef.current.allowKeyboard) {
            const headerTable: HTMLTableElement = gridRef.current.getHeaderTable();
            if (headerTable && headerTable.rows.length > 0) {
                // Set active matrix to header
                setActiveMatrix('header');

                // Get the active matrix (which should now be the header matrix)
                const matrix: IFocusMatrix = getActiveMatrix();
                const firstFocusableActiveCellIndex: number[] = firstFocusableHeaderCellIndex;
                // Use the first focusable cell index from the matrix
                if (firstFocusableActiveCellIndex &&
                    firstFocusableActiveCellIndex.length === 2 &&
                    firstFocusableActiveCellIndex[0] >= 0 &&
                    firstFocusableActiveCellIndex[1] >= 0 &&
                    firstFocusableActiveCellIndex[0] < headerTable.rows.length &&
                    headerTable.rows[firstFocusableActiveCellIndex[0]] &&
                    firstFocusableActiveCellIndex[1] < headerTable.rows[firstFocusableActiveCellIndex[0]].cells.length) {

                    const firstHeaderCell: HTMLElement =
                        headerTable.rows[firstFocusableActiveCellIndex[0]].cells[firstFocusableActiveCellIndex[1]];

                    if (firstHeaderCell && !firstHeaderCell.classList.contains('sf-hide')) {
                        // Set tabIndex to 0 for first cell
                        firstHeaderCell.tabIndex = 0;

                        // Update the matrix current position
                        matrix.select(firstFocusableActiveCellIndex[0], firstFocusableActiveCellIndex[1]);
                        matrix.current = [...firstFocusableActiveCellIndex]; // Create a new array to ensure React detects the change
                        return;
                    }
                }

                // Fallback to first visible header cell if the calculated one is hidden or invalid
                const firstVisibleHeaderCell: HTMLElement = headerTable.querySelector('.sf-headercell:not(.sf-hide)') as HTMLElement;
                if (firstVisibleHeaderCell) {
                    firstVisibleHeaderCell.tabIndex = 0;

                    // Find the row and cell index of this element
                    const row: HTMLTableRowElement | null = firstVisibleHeaderCell.closest('tr');
                    const rowIndex: number = Array.from(headerTable.rows).indexOf(row as HTMLTableRowElement);
                    const cellIndex: number = Array.from(row.cells).indexOf(firstVisibleHeaderCell as HTMLTableCellElement);

                    // Update the matrix current position
                    matrix.select(rowIndex, cellIndex);
                    matrix.current = [rowIndex, cellIndex];
                }
            }
        }
    }, [gridRef, columns?.length, setActiveMatrix, getActiveMatrix,
        firstFocusableContentCellIndex,
        firstFocusableHeaderCellIndex
    ]);

    /**
     * Check if a key event is for navigation
     *
     * @param {KeyboardEvent} event - Keyboard event
     * @returns {boolean} Whether the key is for navigation
     */
    const isNavigationKey: (event: KeyboardEvent) => boolean = useCallback((event: KeyboardEvent): boolean => {
        return ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab', 'Home', 'End', 'Enter'].includes(event.key);
    }, []);

    /**
     * Get navigation direction from key event
     *
     * @param {KeyboardEvent} event - Keyboard event
     * @returns {string|null} Navigation direction
     */
    const getNavigationDirection: (event: KeyboardEvent) => string = useCallback((event: KeyboardEvent): string => {
        if (event.code === 'Space') {
            return 'space';
        }
        switch (event.key) {
        case 'ArrowUp': return event.shiftKey ? 'shiftUp' : 'upArrow';
        case 'ArrowDown': return event.shiftKey ? 'shiftDown' : 'downArrow';
        case 'ArrowLeft': return 'leftArrow';
        case 'ArrowRight': return 'rightArrow';
        case 'Tab': return event.shiftKey ? 'shiftTab' : 'tab';
        case 'Home': return event.ctrlKey ? 'ctrlHome' : 'home';
        case 'End': return event.ctrlKey ? 'ctrlEnd' : 'end';
        case 'Enter': return event.shiftKey ? 'shiftEnter' : 'enter';
        case 'Escape': return 'escape';
        case 'a': return event.ctrlKey ? 'ctrlPlusA' : 'a';
        default: return null;
        }
    }, []);

    /**
     * Set the last content or aggregate cell's tabIndex to 0
     * This helps with backward tabbing from elements after the grid
     *
     * @returns {void}
     */
    const setLastContentCellTabIndex: () => void = useCallback(() => {
        // Clear any existing tabIndex=0 in content or aggregate cells
        const currentFocusableContentCell: HTMLElement | null = gridRef.current.getContentTable()?.querySelector('[tabindex="0"]');
        if (currentFocusableContentCell && !gridRef.current.isEdit) {
            (currentFocusableContentCell as HTMLElement).tabIndex = -1;
            currentFocusableContentCell.classList.remove(CSS_FOCUSED, CSS_FOCUS);
        }

        const currentFocusableAggregateCell: HTMLElement | null = gridRef.current.getFooterTable?.()?.querySelector('[tabindex="0"]');
        if (currentFocusableAggregateCell && !gridRef.current.isEdit) {
            (currentFocusableAggregateCell as HTMLElement).tabIndex = -1;
            currentFocusableAggregateCell.classList.remove(CSS_FOCUSED, CSS_FOCUS);
        }

        // Use aggregate if available, otherwise use content
        if (aggregateRowCount > 0 && columns?.length > 0 && gridRef.current.allowKeyboard) {
            const aggregateTable: HTMLTableElement | null = gridRef.current.getFooterTable();
            if (aggregateTable && aggregateTable.rows.length > 0) {
                const lastFocusableActiveCellIndex: number[] = lastFocusableAggregateCellIndex;
                // Use the last focusable cell index from the matrix
                if (lastFocusableActiveCellIndex && lastFocusableActiveCellIndex.length === 2) {
                    const [rowIndex, colIndex] = lastFocusableActiveCellIndex;

                    // Ensure the indices are valid
                    if (rowIndex >= 0 && rowIndex < aggregateTable.rows.length &&
                        colIndex >= 0 && aggregateTable.rows[rowIndex as number] &&
                        colIndex < aggregateTable.rows[rowIndex as number].cells.length) {

                        const cell: HTMLTableCellElement = aggregateTable.rows[rowIndex as number].cells[colIndex as number];

                        if (cell && !cell.classList.contains('sf-hide')) {
                            // Set tabIndex to 0 for last aggregate cell
                            cell.tabIndex = 0;

                            // Update the aggregate matrix to reflect this cell as the current one
                            aggregateMatrix.current.select(rowIndex, colIndex);
                            aggregateMatrix.current.current = [rowIndex, colIndex];

                            // Set active matrix to aggregate
                            setActiveMatrix('aggregate');
                            return;
                        }
                    }
                }
            }
        }

        // Fallback to content if aggregate is not available
        const contentTable: HTMLTableElement | null = gridRef.current.getContentTable();
        if (contentTable && contentTable.rows.length > 0 && gridRef.current.allowKeyboard) {
            const lastFocusableActiveCellIndex: number[] = lastFocusableContentCellIndex;
            // Use the last focusable cell index from the matrix
            if (lastFocusableActiveCellIndex && lastFocusableActiveCellIndex.length === 2) {
                const [rowIndex, colIndex] = lastFocusableActiveCellIndex;

                // Ensure the indices are valid
                if (rowIndex >= 0 && rowIndex < contentTable.rows.length &&
                    colIndex >= 0 && contentTable.rows[rowIndex as number] &&
                    colIndex < contentTable.rows[rowIndex as number].cells.length) {

                    const cell: HTMLTableCellElement = contentTable.rows[rowIndex as number].cells[colIndex as number];

                    if (cell && !cell.classList.contains('sf-hide')) {
                        // Set tabIndex to 0 for last content cell
                        cell.tabIndex = 0;

                        // Update the content matrix to reflect this cell as the current one
                        contentMatrix.current.select(rowIndex, colIndex);
                        contentMatrix.current.current = [rowIndex, colIndex];

                        // Set active matrix to content
                        setActiveMatrix('content');
                        return;
                    }
                }
            }
        }
    }, [gridRef,
        lastFocusableContentCellIndex,
        lastFocusableHeaderCellIndex,
        lastFocusableAggregateCellIndex,
        contentMatrix, aggregateMatrix, setActiveMatrix, aggregateRowCount, columns?.length
    ]);

    /**
     * Set grid focus state
     *
     * @param {boolean} focused - Whether the grid is focused
     * @returns {void}
     */
    const setGridFocus: (focused: boolean) => void = useCallback((focused: boolean): void => {
        if (!gridRef.current?.allowKeyboard) { return; }
        // Check if grid is in edit mode before changing focus
        const isGridInEditMode: boolean = gridRef.current?.isEdit || false;

        // Update the grid focus state
        setIsGridFocused(focused);

        if (isGridInEditMode) {
            return;
        }
        // Enhanced focus management for Tab navigation exit behavior
        // Based on the information in your clipboard, this handles the case where focus moves out of grid
        // and then user presses Tab/Shift+Tab to return to the grid
        if (!focused) {
            // Only reset focus state if NOT in edit mode
            // Use requestAnimationFrame to ensure DOM is ready
            requestAnimationFrame(() => {
                // 1. Remove focus from current cell
                removeFocus();

                // 2.  Reset active matrix to header for proper Tab navigation return behavior
                setActiveMatrix('header');

                // 3. Set tabIndex for proper Tab navigation when returning to the grid
                // This ensures that when focus returns to grid via Tab/Shift+Tab,
                // it goes to the appropriate cell (first visible for Tab, last visible for Shift+Tab)
                setFirstFocusableTabIndex();
                setLastContentCellTabIndex();

                // 4. Reset previous indexes to ensure clean state
                prevIndexes.current = {};

                // 5. Clear any focus indicators
                clearIndicator();
            });
        } else {
            // When grid gains focus, ensure proper tabIndex setup
            // This handles the case where user tabs back into the grid
            // Set up proper focus targets for Tab navigation return
            setFirstFocusableTabIndex();
            setLastContentCellTabIndex();
        }
    }, [removeFocus, setActiveMatrix, setFirstFocusableTabIndex, setLastContentCellTabIndex, clearIndicator, gridRef]);

    /**
     * Navigate to a specific cell
     *
     * @param {number} rowIndex - Row index
     * @param {number} colIndex - Column index
     * @param {(Matrix)} [matrixType] - Matrix type for the cell
     * @returns {void}
     */
    const navigateToCell: (rowIndex: number, colIndex: number, matrixType?: Matrix) => void =
        useCallback((rowIndex: number, colIndex: number, matrixType: Matrix = 'content') => {
            if (!gridRef.current?.allowKeyboard) { return; }
            // Set the active matrix
            setActiveMatrix(matrixType);

            // Get the active matrix
            const matrix: IFocusMatrix = getActiveMatrix();

            // Check if the cell is valid
            if (rowIndex >= 0 && colIndex >= 0) {
                // Before cell focus event
                const beforeArgs: CellFocusEvent = {
                    cancel: false,
                    byKey: false,
                    byClick: false,
                    rowIndex: rowIndex,
                    columnIndex: colIndex
                };

                callbacks?.beforeCellFocus?.(beforeArgs);
                if (beforeArgs.cancel) { return; }

                // Update the matrix selection
                matrix.select(rowIndex, colIndex);
                // Create a new array to ensure the reference changes
                matrix.current = [rowIndex, colIndex];

                // Get the table based on matrix type
                let table: HTMLTableElement | undefined;
                switch (matrixType) {
                case 'header':
                    table = gridRef.current?.getHeaderTable();
                    break;
                case 'aggregate':
                    table = gridRef.current?.getFooterTable();
                    break;
                case 'content':
                default:
                    table = gridRef.current?.getContentTable();
                    break;
                }
                const rows: HTMLCollectionOf<HTMLTableRowElement> | NodeListOf<HTMLTableRowElement> = gridRef.current?.isEdit &&
                    gridRef.current?.editModule?.isShowAddNewRowActive ? table?.querySelectorAll?.('tr.sf-row:not(.sf-addedrow)') :
                    table?.rows;
                if (table && rows.length > rowIndex) {
                    const row: HTMLTableRowElement = rows[rowIndex as number];
                    if (row && row.cells.length > colIndex) {
                        // Get the cell element
                        const cellElement: HTMLElement = row.cells[colIndex as number] as HTMLElement;

                        // Create focus info
                        const info: FocusedCellInfo = {
                            rowIndex: rowIndex,
                            colIndex: colIndex,
                            isHeader: matrixType === 'header',
                            isAggregate: matrixType === 'aggregate',
                            element: cellElement,
                            elementToFocus: cellElement,
                            outline: true
                        };

                        // Add focus to the cell
                        addFocus(info);
                    }
                }
            }
        }, [setActiveMatrix, getActiveMatrix, gridRef, addFocus, callbacks]);

    /**
     * Navigate to first cell, specifically useful for no parent sibling available case.
     *
     * @returns {void}
     */
    const navigateToFirstCell: () => void = useCallback(() => {
        const startInHeader: boolean = headerRowCount > 0;
        setActiveMatrix(startInHeader ? 'header' : 'content');
        const matrix: IFocusMatrix = getActiveMatrix();
        // Find first valid cell using findCellIndex
        const firstCell: number[] = matrix.matrix[0][0] === 1 ? [0, 0] : matrix.findCellIndex([0, 0], true);

        matrix.select(firstCell[0], firstCell[1]);
        matrix.current = [...firstCell];
        focus();
    }, [headerRowCount, setActiveMatrix, getActiveMatrix, focus]);

    /**
     * Navigate to last cell (prioritizing aggregate if available, otherwise content)
     *
     * @returns {void}
     */
    const navigateToLastCell: () => void = useCallback(() => {
        // Use aggregate if available, otherwise use content
        if (aggregateRowCount > 0) {
            setActiveMatrix('aggregate');
            const matrix: IFocusMatrix = getActiveMatrix();
            const [rowIndex, colIndex] = lastFocusableAggregateCellIndex;

            // Update the matrix selection
            matrix.select(rowIndex, colIndex);
            matrix.current = [rowIndex, colIndex];
        } else {
            // Fallback to content area for last cell
            setActiveMatrix('content');
            const matrix: IFocusMatrix = getActiveMatrix();
            const [rowIndex, colIndex] = lastFocusableContentCellIndex;

            // Update the matrix selection
            matrix.select(rowIndex, colIndex);
            matrix.current = [rowIndex, colIndex];
        }

        // Set the tabIndex for the last cell
        setLastContentCellTabIndex();

        // Focus the cell
        focus();
        return;
    }, [contentRowCount, aggregateRowCount, setActiveMatrix, getActiveMatrix, focus,
        lastFocusableContentCellIndex,
        lastFocusableHeaderCellIndex,
        lastFocusableAggregateCellIndex,
        setLastContentCellTabIndex
    ]);

    /**
     * Navigate to next cell based on direction
     *
     * @param {'up'|'down'|'left'|'right'|'nextCell'|'prevCell'} direction - Navigation direction
     * @returns {void}
     */
    const navigateToNextCell: (direction: 'up' | 'down' | 'left' | 'right' | 'nextCell' | 'prevCell') => void =
        useCallback((direction: 'up' | 'down' | 'left' | 'right' | 'nextCell' | 'prevCell') => {
            const matrix: IFocusMatrix = getActiveMatrix();
            let action: string;
            switch (direction) {
            case 'up': action = 'upArrow'; break;
            case 'down': action = 'downArrow'; break;
            case 'left': action = 'leftArrow'; break;
            case 'right': action = 'rightArrow'; break;
            case 'nextCell': action = 'tab'; break;
            case 'prevCell': action = 'shiftTab'; break;
            }

            const navigators: [number, number] = keyActions.current[action as string];
            const current: number[] = getCurrentFromAction(action, navigators, true);

            if (current) {
                matrix.select(current[0], current[1]);
                // Create a new array to ensure the reference changes
                matrix.current = [...current];
                focus();
            }
        }, [getActiveMatrix, getCurrentFromAction, focus, activeMatrix.current]);

    /**
     * Focus the content area of the grid
     * Used by Alt+W shortcut
     *
     * @returns {void}
     */
    const focusContent: () => void = useCallback(() => {
        // Set active matrix to content
        setActiveMatrix('content');

        // Reset focus to first cell in content
        const matrix: IFocusMatrix = getActiveMatrix();
        const firstCell: number[] = matrix.matrix[0][0] === 1 ? [0, 0] : matrix.findCellIndex([0, 0], true);
        matrix.select(firstCell[0], firstCell[1]);
        matrix.current = [...firstCell];
        setIsGridFocused(true);
        focus();
    }, [setActiveMatrix, getActiveMatrix, focus]);

    return {
        // State
        getFocusedCell: () => focusedCell.current,
        isGridFocused,
        focusByClick,
        setGridFocus,

        // IFocusMatrix access
        getContentMatrix: () => contentMatrix.current,
        getHeaderMatrix: () => headerMatrix.current,
        getAggregateMatrix,
        getActiveMatrix,
        setActiveMatrix,

        // Focus methods
        focus,
        removeFocus,
        removeFocusTabIndex,
        addFocus,
        getFocusInfo,
        setFirstFocusableTabIndex,
        focusContent,
        addOutline,
        clearIndicator,

        // Event handlers
        handleKeyDown,
        handleGridClick,

        // Navigation methods
        navigateToCell,
        navigateToNextCell,
        navigateToFirstCell,
        navigateToLastCell,

        // Utility methods
        isNavigationKey,
        getNavigationDirection,

        // Previous state tracking
        getPrevIndexes: () => prevIndexes.current,

        // Boundary indices
        firstFocusableContentCellIndex,
        firstFocusableHeaderCellIndex,
        lastFocusableContentCellIndex,
        lastFocusableHeaderCellIndex,
        firstFocusableAggregateCellIndex,
        lastFocusableAggregateCellIndex
    };
};

export default useFocusStrategy;
