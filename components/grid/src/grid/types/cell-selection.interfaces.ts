/**
 * Represents the position of a single cell in the grid using zero-based indexes.
 * Used to identify specific cells for selection, focus, or data operations.
 *
 * @private
 */
export interface CellPosition {
    /**
     * Zero-based row index of the cell within the grid.
     * Identifies the vertical position of the cell.
     *
     * @default -
     */
    rowIndex: number;

    /**
     * Zero-based column index of the cell within the grid.
     * Identifies the horizontal position of the cell.
     *
     * @default -
     */
    columnIndex: number;
}

/**
 * Represents the position of a single cell using primary key and field name.
 * Used to identify specific cells persistently across paging, sorting, and filtering operations.
 * This is the standard format for all cell selection operations.
 */
export interface CellIdentifier {
    /**
     * The primary key value of the row containing the cell.
     * Used to identify the row persistently across data operations.
     *
     * @default -
     */
    rowKey: string | number;

    /**
     * The field name (column identifier) of the cell.
     * Uniquely identifies the column within the grid.
     *
     * @default -
     */
    fieldName: string;
}

/**
 * Represents a rectangular range of cells defined by start and end positions.
 * Used for range selection operations via mouse drag or keyboard shortcuts.
 *
 * @private
 */
export interface CellRange {
    /**
     * The starting cell position of the range (top-left corner).
     * Marks the beginning point of the rectangular selection.
     *
     * @default -
     */
    start: CellPosition;

    /**
     * The ending cell position of the range (bottom-right corner).
     * Marks the end point of the rectangular selection.
     *
     * @default -
     */
    end: CellPosition;
}

/**
 * Represents cells selected for a specific row using primary key and field names, including cell values.
 * This is the standard format for all cell selection operations.
 * Selection persists across paging, sorting, filtering, and column visibility changes.
 */
export interface RowCellInfo {
    /**
     * The primary key value of the row containing the selected cells.
     * Used to identify the row persistently across data operations.
     *
     * @default -
     */
    rowKey: string | number;

    /**
     * Array of field names (column identifiers) for the selected cells in this row.
     * Each string represents a column's field property.
     *
     * @default []
     */
    fieldNames: string[];

    /**
     * Map of field names to their corresponding cell values for the selected cells in this row.
     * Each key is a field name and the value is the cell's data value.
     *
     * @default {}
     */
    data?: { [fieldName: string]: unknown };
}

/**
 * Represents detailed information about a selected cell including its value and metadata.
 * Used when retrieving actual cell data values from the selection.
 *
 * @private
 */
export interface CellData<T = unknown> {
    /**
     * The value contained in the selected cell.
     * Type matches the data type of the cell's field.
     *
     * @default -
     */
    value: T;

    /**
     * The field name (column identifier) of the cell.
     *
     * @default -
     */
    field: string;

    /**
     * The complete row data object containing this cell.
     * Provides access to all fields in the same row.
     *
     * @default -
     */
    rowData: T;

    /**
     * Zero-based row index of the cell.
     *
     * @default -
     */
    rowIndex: number;

    /**
     * Zero-based column index of the cell.
     *
     * @default -
     */
    columnIndex: number;
}

/**
 * Event arguments for cell selection events in the Data Grid component.
 * Provides detailed context about selected cells, ranges, data, and user interaction.
 * Used for handling post-selection logic or UI updates.
 */
export interface CellSelectEvent<T = unknown> {
    /**
     * Array of selected cell positions in data-based format (rowKey and fieldName).
     * Provides persistent identification of cells across paging, sorting, and filtering.
     * Each position contains the primary key value and field name of a selected cell.
     *
     * @default []
     */
    cells: CellIdentifier[];

    /**
     * The cell range if range selection was performed.
     * Present only when user selects multiple cells via drag or Shift+Click.
     *
     * @default undefined
     */
    range?: CellRange;

    /**
     * Array of cell data values for all selected cells.
     * Contains the actual data from each selected cell.
     *
     * @default []
     */
    data: CellData<T>[];

    /**
     * The browser event that triggered the cell selection.
     * Can be a mouse event (click, drag) or keyboard event (Shift+Arrow).
     *
     * @default -
     */
    event: React.MouseEvent | React.KeyboardEvent;

    /**
     * The currently active (focused) cell position in data-based format.
     * Represents the cell that has keyboard focus using primary key and field name.
     * Persists across paging, sorting, and filtering operations.
     *
     * @default null
     */
    activeCell: CellIdentifier | null;

    /**
     * Array of selected cells grouped by row in the format appropriate for the current selection mode.
     * In index-based mode: contains `{ rowIndex, cellIndexes }` format.
     * In data-based mode: contains `{ rowKey, fieldNames }` format.
     * Populated when cellPersistSelection is enabled or when working with persistent key values.
     *
     * @default undefined
     */
    selectedRowCells?: RowCellInfo[];
}

/**
 * Event arguments for cell selecting events (before selection is finalized).
 * Extends CellSelectEvent with cancellation capability.
 * Used to validate or prevent cell selection based on custom logic.
 *
 * @private
 */
export interface CellSelectingEvent<T = unknown> extends CellSelectEvent<T> {
    /**
     * Set to true to cancel the cell selection operation.
     * Prevents the cells from being selected, allowing validation or conditional logic.
     *
     * @default false
     */
    cancel: boolean;
}

/**
 * Event arguments for cell deselection events.
 * Provides context about cells being removed from the selection.
 */
export interface CellDeselectEvent<T = unknown> {
    /**
     * Array of cell positions being deselected in data-based format.
     * Uses primary key and field name for persistent identification.
     *
     * @default []
     */
    cells: CellIdentifier[];

    /**
     * Array of cell data values for cells being deselected.
     *
     * @default []
     */
    data: CellData<T>[];

    /**
     * The browser event that triggered the deselection.
     *
     * @default -
     */
    event: React.MouseEvent | React.KeyboardEvent;

    /**
     * Array of deselected cells grouped by row in the format appropriate for the current selection mode.
     * In index-based mode: contains `{ rowIndex, cellIndexes }` format.
     * In data-based mode: contains `{ rowKey, fieldNames }` format.
     * Populated when cellPersistSelection is enabled or when working with persistent key values.
     *
     * @default undefined
     */
    deselectedRowCells?: RowCellInfo[];
}

/**
 * Event arguments for cell deselecting events (before deselection is finalized).
 * Extends CellDeselectEvent with cancellation capability.
 *
 * @private
 */
export interface CellDeselectingEvent<T = unknown> extends CellDeselectEvent<T> {
    /**
     * Set to true to cancel the cell deselection operation.
     *
     * @default false
     */
    cancel: boolean;
}

/**
 * Defines the cell selection module API exposed through the Grid component ref.
 * Provides programmatic methods for cell selection, querying, and event handling.
 * Accessible via `gridRef.current.cellSelectionModule`.
 *
 * @private
 */
export interface CellSelectionModel {
    /**
     * Selects a single cell specified by row key and field name (data-based mode).
     * When in data-based mode, selection persists across paging, sorting, and filtering.
     * This is the primary method for programmatic single-cell selection.
     *
     * @param {string | number} rowKey - The primary key value of the row containing the cell.
     * @param {string} fieldName - The field name (column identifier) of the cell.
     * @returns {void}
     *
     * @example
     * ```tsx
     * // Data-based mode (persistent across paging/sorting)
     * gridRef.current.cellSelectionModule.selectCell('123', 'OrderID');
     * ```
     */
    selectCell(rowKey: string | number, fieldName: string): void;

    /**
     * Selects multiple cells specified by row keys and field names (data-based mode).
     * When in data-based mode, selections persist across paging, sorting, and filtering.
     * This is the primary method for programmatic cell selection.
     *
     * @param {RowCellInfo[]} cells - Array of objects specifying rows and their selected cells in data-based format.
     * @returns {void}
     *
     * @example
     * ```tsx
     * // Data-based mode (persistent across paging/sorting)
     * gridRef.current.cellSelectionModule.selectCells([
     *   { rowKey: '123', fieldNames: ['OrderID', 'CustomerName'] },
     *   { rowKey: '456', fieldNames: ['TotalAmount'] }
     * ]);
     * ```
     */
    selectCells(cells: RowCellInfo[]): void;

    /**
     * Selects a rectangular range of cells from start position to end position.
     * Selection behavior depends on the configured type (`Flow`/`Box`/`BoxWithBorder`).
     * Uses data-based position format to ensure selections persist across paging, sorting, and filtering.
     * This is the primary method for programmatic range selection.
     *
     * @param {CellIdentifier} start - The starting cell position (top-left corner) in data-based format {rowKey, fieldName}.
     * @param {CellIdentifier} end - The ending cell position (bottom-right corner) in data-based format {rowKey, fieldName}.
     * @returns {void}
     *
     * @example
     * ```tsx
     * // Data-based range selection (persistent across paging/sorting)
     * gridRef.current.cellSelectionModule.selectCellsByRange(
     *   { rowKey: '123', fieldName: 'OrderID' },
     *   { rowKey: '456', fieldName: 'TotalAmount' }
     * );
     * ```
     */
    selectCellsByRange(start: CellIdentifier, end: CellIdentifier): void;

    /**
     * Selects a rectangular range of cells with optional additive selection.
     * Extends current selection when `isSelectionExtend` is `true`, replaces selection when `false`.
     * Supports all type values (`Flow`, `Box`, `BoxWithBorder`).
     *
     * @private
     * @param {CellPosition} start - The starting cell position of the range.
     * @param {CellPosition} end - The ending cell position of the range.
     * @param {boolean} [isSelectionExtend=false] - When `true`, adds to existing selection; when `false`, replaces it.
     * @returns {void}
     *
     * @example
     * ```tsx
     * // Replace selection with new range
     * gridRef.current.cellSelectionModule.selectRange(
     *   { rowIndex: 0, columnIndex: 0 },
     *   { rowIndex: 5, columnIndex: 3 }
     * );
     *
     * // Add range to existing selection
     * gridRef.current.cellSelectionModule.selectRange(
     *   { rowIndex: 10, columnIndex: 0 },
     *   { rowIndex: 15, columnIndex: 3 },
     *   true
     * );
     * ```
     */
    selectRange(start: CellPosition, end: CellPosition, isSelectionExtend?: boolean): void;

    /**
     * Clears cell selections in the grid.
     * If specific cells are provided, only those cells are cleared.
     * If no cells are provided, all cell selections are cleared.
     * Removes highlighting and resets the cell selection state.
     *
     * Uses data-based format for cell specification:
     * - Data-based: `{ rowKey: string|number, fieldNames: string[] }`
     *
     * @param {RowCellInfo[] | undefined} cells - Optional. Array of objects specifying rows and their cells to clear in data-based format.
     *                                                If not provided, all cell selections are cleared.
     * @returns {void}
     *
     * @example
     * ```tsx
     * // Clear all cell selections
     * gridRef.current.cellSelectionModule.clearCellSelection();
     *
     * // Clear specific cells (data-based)
     * gridRef.current.cellSelectionModule.clearCellSelection([
     *   { rowKey: '123', fieldNames: ['OrderID'] },
     *   { rowKey: '456', fieldNames: ['CustomerName', 'TotalAmount'] }
     * ]);
     * ```
     */
    clearCellSelection(cells?: RowCellInfo[]): void;

    /**
     * Retrieves the selected cells grouped by row in data-based format with cell values.
     * Returns an array of objects, each containing a row, its selected cells, and their values.
     *
     * Format: `{ rowKey: string|number, fieldNames: string[], data: { [fieldName]: value } }`
     * In data-based mode, multiple cells in the same row are grouped together with their data values.
     *
     * @returns {RowCellInfo[]} Array of objects with row identifier, selected cell field names, and their values.
     *
     * @example
     * ```tsx
     * // Data-based mode result (persists across paging/sorting) with values included
     * const selectedCells = gridRef.current.cellSelectionModule.getSelectedCellsData();
     * // Returns: [
     * //   {
     * //     rowKey: '123',
     * //     fieldNames: ['OrderID', 'CustomerName'],
     * //     data: { OrderID: 10248, CustomerName: 'Vinet' }
     * //   },
     * //   {
     * //     rowKey: '456',
     * //     fieldNames: ['TotalAmount'],
     * //     data: { TotalAmount: 32.38 }
     * //   }
     * // ]
     * ```
     */
    getSelectedCellsData(): RowCellInfo[];

    /**
     * Generates a cell key in data-based format (primaryKey:fieldName).
     * Data-based format persists across paging, sorting, and filtering.
     *
     * @param {number} rowIndex - Zero-based row index of the cell
     * @param {number} columnIndex - Zero-based column index of the cell
     * @returns {string} Cell key in format "primaryKeyValue:fieldName"
     *
     * @example
     * ```tsx
     * const cellKey = gridRef.current.cellSelectionModule.getCellKey(5, 2, rowData);
     * // Returns: "12:OrderID"
     * ```
     */
    getCellKey(rowIndex: number, columnIndex: number, rowData?: unknown): string;

    /**
     * Set of currently selected cell keys in format "rowKey:fieldName" (data-based format).
     * Use this to check if a specific cell is selected by checking: selectedCells.has("123:OrderID")
     *
     * @default empty Set
     *
     * @example
     * ```tsx
     * const cellKey = "123:OrderID"; // data-based format
     * const isSelected = gridRef.current.cellSelectionModule.selectedCells?.has(cellKey);
     * ```
     */
    selectedCells: Set<string>;

    /**
     * Handles cell click events for cell selection.
     * Internal event handler connected to grid cell click events.
     *
     * @private
     * @param {MouseEvent} event - The mouse click event.
     * @returns {void}
     */
    handleGridClick(event: React.MouseEvent): void;

    /**
     * Handles mouse down events to begin drag selection.
     * Invoked on `mousedown` so dragging can start before the `click` event.
     *
     * @private
     * @param {MouseEvent} event - The mouse down event.
     * @returns {void}
     */
    handleGridMouseDown(event: React.MouseEvent): void;

    /**
     * Handles keyboard events for cell selection navigation.
     * Internal event handler for keyboard shortcuts like Shift+Arrow, Ctrl+A, Escape.
     *
     * @private
     * @param {KeyboardEvent} event - The keyboard event.
     * @returns {void}
     */
    handleKeyDown(event: React.KeyboardEvent): void;

    /**
     * The currently active (focused) cell position.
     * Represents the cell that has keyboard focus, distinct from selection.
     *
     * @default null
     */
    activeCell: CellPosition | null;

    /**
     * Array of all currently selected cell ranges.
     * Contains one or more ranges depending on multi-range selection state.
     *
     * @default []
     */
    selectedRanges: CellRange[];

    /**
     * Flag indicating whether drag-based cell selection is currently active.
     * True when user is dragging across cells; false otherwise.
     * Used to suppress auto-scroll during drag to prevent viewport jumps.
     *
     * @default false
     */
    isDragging: boolean;

    /**
     * Retrieves the cell position corresponding to a DOM element.
     * Converts an HTML cell element to its row and column indexes in the grid.
     *
     * @private
     * @param {HTMLElement} element - The cell DOM element to retrieve position from.
     * @returns {CellPosition} Object containing rowIndex and columnIndex of the cell.
     *
     */
    getCellPositionFromElement(element: HTMLElement): CellPosition;

    /**
     * Updates visual styles for cells in the specified rows.
     * Applies selection styling changes to cells based on the current selection state.
     *
     * @private
     * @param {Set<number>} rowIndexes - Set of row indexes whose cells require style updates.
     * @returns {void}
     */
    updateCellStyles(rowIndexes: Set<number>): void;

    /**
     * Internal method: Selects a single cell at the specified row and column index.
     * Used internally for DOM event handling only. Use selectCell() for public API.
     *
     * @private
     * @param {number} rowIndex - Zero-based row index of the cell to select.
     * @param {number} columnIndex - Zero-based column index of the cell to select.
     * @returns {void}
     */
    selectCellByIndex(rowIndex: number, columnIndex: number): void;

    /**
     * Internal method: Builds a row-based cell map from a collection of data-based cell keys.
     * Groups field names by their corresponding row key to support row-level selection
     * and efficient row-based operations.
     *
     * The expected cell key format is <c>"primaryKeyValue:fieldName"</c>.
     * Invalid cell keys are ignored during map construction.
     *
     * @private
     * @param {Iterable<string>} cellKeys - A collection of data-based cell key strings.
     * @returns {Map<string | number, string[]>}
     */
    buildRowCellMap(cellKeys: Iterable<string>): Map<string | number, string[]>;

    /**
     * Helper method to retrieve row data by row index, supporting virtualized rows outside current view.
     * Uses gridRef to access currentViewData or virtualized data source as needed.
     *
     * @private
     * @param {number} rowIndex - The zero-based index of the row to retrieve data for.
     * @returns {unknown | undefined} The data object for the specified row, or undefined if not found.
     */
    getRowDataByRowIndex(rowIndex: number): unknown | undefined;

    /**
     * Helper method to find the row index corresponding to a given primary key value.
     * Uses gridRef to access currentViewData or virtualized data source as needed.
     * @private
     * @param {string | number} rowKey - The primary key value of the row to find.
     * @returns {number | undefined} The zero-based index of the row with the specified key, or undefined if not found.
     */
    findRowIndexByKey(rowKey: string | number): number | undefined;
}
