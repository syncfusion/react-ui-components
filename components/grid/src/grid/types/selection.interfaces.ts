import { CheckboxChangeEvent } from '@syncfusion/react-buttons';
import { useSelection } from '../hooks';
import { ColumnProps } from './column.interfaces';
import { AutoSelectMode, CellSelectionType, SelectionMode, SelectionType } from './enum';
import { CellFocusEvent } from './focus.interfaces';
import { IRow } from './interfaces';

/**
 * Configures selection behavior in the Data Grid component.
 * Defines settings for enabling selection, specifying selection mode, and controlling selection type.
 * Manages how to interact with row selection in the grid.
 */
export interface SelectionSettings {
    /**
     * Determines whether row selection is enabled in the grid by default.
     * When set to false, all selection functionality is disabled.
     * This property directly affects the grid’s interactivity for row-based operations.
     *
     * @default true
     */
    enabled?: boolean;

    /**
     * Specifies whether row selection can be toggled.
     * When set to true, clicking a selected row will deselect it, and clicking a deselected row will reselect it.
     * When set to false, the selection state remains fixed once applied and cannot be toggled.
     *
     * @default false
     */
    enableToggle?: boolean;

    /**
     * Specifies the selection mode for the grid, controlling how many rows can be selected.
     * Supports `Single` for selecting one row at a time or `Multiple` for selecting multiple rows using CTRL or SHIFT keys.
     *
     * @default 'Single' | SelectionMode.Single
     */
    mode?: string | SelectionMode;

    /**
     * Defines the type of selection target in the grid.
     * Determines whether selection applies to rows or cells.
     *
     * Options:
     * * `Row` - Only row selection is enabled (default, backward compatible).
     * * `Cell` - Only cell selection is enabled (individual cells can be selected).
     *
     * @default 'Row' | SelectionType.Row
     */
    type?: string | SelectionType;

    /**
     * Specifies the cell selection type for range selection behavior.
     * Only applies when type is 'Cell'.
     * Determines how cells are selected when creating rectangular ranges.
     *
     * Options:
     * * `Flow` - Selects all cells between start/end including all rows (Excel-like).
     * * `Box` - Selects only cells within column range boundaries.
     * * `BoxWithBorder` - Box mode with visible selection border.
     *
     * @default 'Flow'
     */
    cellSelectionType?: string | CellSelectionType;

    /**
     * When `checkboxOnly` is set to `true`, row selection is possible only through the checkbox.
     * Clicking other row or cell elements does not trigger selection.
     *
     * @default false
     */
    checkboxOnly?: boolean;

    /**
     * Specifies whether row selection is persisted across grid operations such as sorting, filtering, searching, paging, or refreshing.
     * Selection persistence requires a primary key, so define at least one unique value column with the `isPrimaryKey` property in the column definition.
     * When the checkbox selection feature is enabled, selection persistence is automatically set to true. Set `enablePersistence` to `false` to disable selection persistence.
     *
     * @default false
     */
    persistSelection?: boolean;

    /**
     * Controls the header checkbox click behavior for remote data sources.
     * Defines how the header checkbox behaves when selecting data in the grid, either across all data or only the currently loaded data.
     *
     * Options:
     * - `Default`: Header checkbox toggles between checked and unchecked (two‑state). In this mode, all data in the grid is selected or deselected. This is the default mode.
     * - `Intermediate`: Header checkbox cycles through checked, unchecked, and intermediate (tri‑state). In this mode, selection applies only to currently loaded or visited pages. Full grid selection becomes available only after all pages have been loaded.
     *
     * @default AutoSelectMode.Default
     */
    autoSelectMode?: AutoSelectMode | string;
}

/**
 * Defines methods and properties for managing row selection state and behavior in the Data Grid.
 * Provides functionality for selecting, deselecting, and retrieving selected rows and their data.
 * Used internally to encapsulate selection logic and state management.
 *
 * @private
 */
export interface SelectionModel<T = unknown> {

    /**
     * Callback function for determining row selectability and checkbox visibility per row.
     * When provided, evaluates each row to determine if it can be selected.
     */
    isRowSelectableProp: IsRowSelectable<T>;

    /**
     * Maps selectable rows to their selectability configuration for the current view.
     * Pre-computed from `isRowSelectable` callback evaluation on each row in `currentViewData`.
     * Used to determine which rows are eligible for selection operations.
     *
     * @default new Map()
     */
    selectableRows: Map<string, RowSelectableParams>;

    /**
     * Maps non-selectable rows to their selectability configuration for the current view.
     * Pre-computed from `isRowSelectable` callback evaluation on each row in `currentViewData`.
     * Preserves selectability metadata for excluded rows across selection operations.
     *
     * @default new Map()
     */
    nonSelectableRows: Map<string, RowSelectableParams>;

    currentViewSelectableRows:  Map<string, RowSelectableParams>;
    currentViewNonSelectableRows:  Map<string, RowSelectableParams>;

    /**
     * Clears all currently selected rows in the grid.
     * Resets the selection state, removing any highlighted rows and updating the grid’s UI.
     * Useful for programmatically resetting user selections.
     *
     * @returns {void}
     */
    clearSelection: () => void;

    /**
     * Deselects specific rows based on their provided indexes.
     * Removes the specified rows from the current selection, updating the grid’s visual state.
     * Supports partial deselection in multiple selection scenarios.
     *
     * @param {number[]} indexes - Array of row indexes to deselect.
     * @returns {void}
     */
    clearRowSelection: (indexes?: number[]) => void;

    /**
     * Selects a single row by its index in the grid.
     * Highlights the specified row and updates the selection state, optionally toggling selection in multiple mode.
     * Used for programmatic row selection or user-initiated clicks.
     *
     * @param {number} rowIndex - Index of the row to select.
     * @param {boolean} isToggle - Whether to toggle selection (for multiple selection).
     * @returns {void}
     */
    selectRow: (rowIndex: number, isToggle?: boolean) => void;

    /**
     * Retrieves the indexes of all currently selected rows in the grid.
     * Returns an array of zero-based indexes representing the selected rows.
     * Useful for tracking or processing the current selection state.
     *
     * @returns {number[]} The selected row indexes.
     */
    getSelectedRowIndexes: () => number[];

    /**
     * Retrieves the selected row data or selection metadata from the grid.
     *
     * Returns different types based on configuration:
     * - Local data: Array of selected row data objects (`T[]`)
     * - Remote data with persistent selection: Object with `isSelectAll` (boolean) and `primaryKeys` (string[])
     * - No selection: Empty array or null
     *
     * @returns {T[] | { isSelectAll: boolean; primaryKeys: string[] } | null} Selected records or selection metadata
     */
    getSelectedRecords(): T[] | { isSelectAll: boolean; primaryKeys: string[] } | null;

    /**
     * Retrieves the persistent selected data as an array of record objects.
     *
     * Provides access to the internal persistent selection storage maintained across paging,
     * sorting, filtering, and other grid operations. Only returns data when `persistSelection`
     * is enabled in `selectionSettings`.
     *
     * @returns {T[]} Array of selected record objects
     */
    getPersistSelectedData(): T[];

    /**
     * Processes grid click events to handle row selection.
     * Determines whether a click should trigger row selection based on the target element and selection settings.
     * Updates the selection state and grid UI accordingly.
     *
     * @param {React.MouseEvent} event - The mouse event triggered on grid click.
     * @returns {void}
     */
    handleGridClick: (event: React.MouseEvent) => void;

    /**
     * Selects multiple rows by their indexes in the grid.
     * Highlights the specified rows and updates the selection state, typically used in multiple selection mode.
     * Supports programmatic bulk selection of rows.
     *
     * @param {number[]} rowIndexes - Specifies an array of row indexes.
     * @returns {void}
     */
    selectRows: (rowIndexes: number[]) => void;

    /**
     * Selects a range of rows from a start index to an optional end index.
     * Highlights all rows within the specified range, useful for SHIFT-based range selection.
     * Updates the selection state for multiple selection scenarios.
     *
     * @param {number} startIndex - Specifies the start row index.
     * @param {number} endIndex - Specifies the end row index.
     * @returns {void}
     */
    selectRowByRange: (startIndex: number, endIndex?: number) => void;

    /**
     * Adds multiple rows to the current selection by their indexes.
     * Expands the existing selection without clearing previously selected rows, used in multiple selection mode.
     * Updates the grid’s visual and selection state accordingly.
     *
     * @param {number[]} rowIndexes - Array of row indexes to select.
     * @returns {void}
     */
    addRowsToSelection: (rowIndexes: number[]) => void;

    /**
     * Stores an array of zero-based indexes for the currently selected rows.
     * Tracks the selection state, reflecting which rows are highlighted in the grid.
     * Updated dynamically as users or code modify the selection.
     *
     * @default []
     */
    selectedRowIndexes: number[];

    /**
     * Stores an array of data objects for the currently selected rows.
     * Contains the record data for each selected row, enabling access to selected content.
     * Updated as the selection changes to reflect the current state.
     *
     * @default []
     */
    selectedRows: HTMLTableRowElement[];

    /**
     * References the currently active target element involved in selection.
     * Tracks the DOM element (e.g., a cell or row) that triggered the latest selection action.
     * Used internally to manage selection interactions and focus.
     *
     * @default null
     */
    activeTarget: Element;

    /**
     * Handles cell focus events to support selection-related behavior.
     * Processes focus events to update the selection state or UI when a cell gains focus.
     * Used to coordinate keyboard navigation and selection in the grid.
     *
     * @param {CellFocusEvent} e - The cell focus event arguments.
     * @returns {void}
     */
    onCellFocus: (e: CellFocusEvent) => void;

    /**
     * Updates the persisted selection collection using a resolved row key.
     *
     * @template T
     * @param {T} rowData - The row data object to update in the persisted collection.
     * @param {boolean} isSelected - When true, adds the row; when false, removes it.
     */
    updatePersistCollection: (rowData: T, isSelected: boolean) => void;

    /**
     * Persistent selection state as a set of unique row keys.
     */
    selectedRowState: Set<string>;

    /**
     * Persistent selected data keyed by unique row key.
     */
    persistSelectedData: Map<string, T>;

    /**
     * Indicates whether a header select-all action was triggered
     */
    isHeaderSelectAllMode: boolean;

    /**
     * Tracks rows that were manually unselected after a remote header select-all operation.
     */
    unselectedRowState: Set<string>;

    /**
     * Clears all persisted selection state, including keys and data.
     */
    clearAllPersistedSelection: () => void;

    /**
     * Clears only the selections for deleted records from the persisted selection state.
     * During delete operations, this removes the deleted records from selection without
     * affecting other selected items that remain in the data set.
     *
     * @template T
     * @public
     * @param {T[]} deletedRecords - An array of deleted record objects whose selection entries must be removed from persistence.
     * @returns {void}
     */
    clearDeletedSelections: (deletedRecords: T[]) => void;

    /**
     * Handles persisted selection updates when the header "Select All" checkbox is toggled.
     *
     * @param row - The header row object.
     * @param event - The checkbox change event triggered by user interaction.
     */
    headerCheckBoxOnChange: (row?: IRow<ColumnProps>, event?: CheckboxChangeEvent) => void;

    /**
     * Updates the header selection state based on current selection.
     * Typically used to refresh the header checkbox state after row-level changes.
     *
     * @returns {void} This method does not return any value directly.
     */
    updateHeaderSelectionState: () => void;

    /**
     * Evaluates row selectability for the given row data.
     *
     * @param rowData - The row data object to evaluate
     * @returns Normalized selectability configuration for the row
     */
    isRowSelectableEval: (rowData: T) => RowSelectableParams;

    /**
     * Computes the header checkbox tri-state from selectable rows on the current page.
     *
     * @returns Header checkbox state derived from selectable rows only
     */
    getHeaderCheckboxState: () => HeaderCheckboxState;

}

/**
 * Defines the type for the selection module hook return value in the Data Grid.
 * Represents the return type of the useSelection hook for managing selection operations.
 * Used internally to encapsulate selection functionality.
 *
 * @private
 */
export type selectionModule<T = unknown> = ReturnType<typeof useSelection<T>>;

/**
 * Configures row selectability and checkbox visibility for a single row.
 * Returned by the `isRowSelectable` callback on GridProps.
 */
export interface RowSelectableParams {
    /**
     * Specifies whether the row can be selected.
     *
     * @default true
     */
    selectable: boolean;

    /**
     * Controls whether a disabled checkbox is rendered for non-selectable rows.
     *
     * @default true
     */
    showDisabledCheckboxes?: boolean;
}

/**
 * Callback type for determining row selectability and checkbox visibility per row.
 *
 * @template T - Row data type
 * @param rowData - The data object for the row being evaluated
 * @returns true or false for simple selectability, or a {@link RowSelectableParams} object for full control
 *
 */
export type IsRowSelectable<T = unknown> = (rowData: T) => boolean | RowSelectableParams;

/**
 * Tri-state representation of the header checkbox.
 * Computed from selectable rows only when `isRowSelectable` is configured.
 *
 * @private
 */
export interface HeaderCheckboxState {
    /**
     * Specifies whether the header checkbox shows a checked state.
     */
    checked: boolean;

    /**
     * Specifies whether the header checkbox shows an indeterminate state.
     */
    indeterminate: boolean;

    /**
     * Specifies whether the header checkbox is disabled.
     */
    disabled: boolean;
}

/**
 * Represents event arguments for row selection events in the Data Grid component.
 * Provides detailed context about selected rows, including data and DOM elements.
 * Used to handle post-selection logic or UI updates in the row.
 */
export interface RowSelectEvent<T = unknown> {
    /**
     * Contains the data object associated with the selected row.
     * Provides access to the record data for single or multiple selected rows for processing or display.
     * Returns a single object for single selection or an array for multiple selections.
     *
     * @default -
     */
    data: T | T[];

    /**
     * Specifies the zero-based index of the selected row in the grid.
     * Identifies the position of the selected row within the data source for reference or manipulation.
     * Used in single selection mode or to track the primary selected row.
     *
     * @default -
     */
    selectedRowIndex?: number;

    /**
     * Specifies the zero-based index of the deselected row in the grid.
     * Identifies the position of the deselected row within the data source for reference or manipulation.
     * Used in single selection mode or to track the primary deselected row.
     *
     * @default -
     */
    deSelectedRowIndex?: number;

    /**
     * Contains an array of zero-based indexes for all selected rows.
     * Used in multiple selection mode to track all rows currently highlighted.
     * Enables bulk processing of selected row positions.
     *
     * @default []
     */
    selectedRowIndexes?: number[];

    /**
     * Contains zero-based indexes of rows newly selected during the current interaction.
     * Excludes rows that were already selected before the event.
     * Used in multiple selection mode to track incremental selection changes.
     *
     * @default []
     */
    selectedCurrentRowIndexes?: number[];

    /**
     * Contains zero-based indexes of rows newly deselected during the current interaction.
     * Excludes rows that were already unselected before the event.
     * Used in multiple selection mode to track incremental deselection changes.
     *
     * @default []
     */
    deSelectedCurrentRowIndexes?: number[];

    /**
     * References the DOM elements of the selected rows.
     * Provides access to the row elements for styling, manipulation, or other DOM operations.
     * Returns a single element or an array based on selection mode.
     *
     * @default null
     */
    row: Element | Element[];

    /**
     * The React event that triggered the row selection.
     *
     * Can be a mouse or keyboard event, depending on the user's interaction.
     * Provides access to event metadata such as target element, key pressed,
     * or mouse coordinates, enabling contextual handling of selection logic.
     *
     * @default null
     */
    event: React.MouseEvent | React.KeyboardEvent;
}

/**
 * Represents event arguments for row selecting events in the Grid, extending RowSelectEvent.
 * Includes additional properties to control selection behavior, such as key modifiers and cancellation.
 * Used internally to manage the selection process before it is finalized.
 *
 * @private
 */
export interface RowSelectingEvent<T = unknown> extends RowSelectEvent<T> {
    /**
     * Indicates whether the CTRL key was pressed during the selection event.
     * When true, enables additive selection in multiple selection mode, allowing users to select multiple rows.
     * Used to detect user intent for multi-selection behavior.
     *
     * @default false
     */
    isCtrlPressed?: boolean;

    /**
     * Indicates whether the SHIFT key was pressed during the selection event.
     * When true, enables range selection in multiple selection mode, selecting all rows between two points.
     * Used to detect user intent for range-based selection.
     *
     * @default false
     */
    isShiftPressed?: boolean;

    /**
     * Determines whether the selection event should be cancelled.
     * When set to true, prevents the row(s) from being selected, allowing validation or conditional logic.
     * Used in event handlers to control selection outcomes.
     */
    cancel: boolean;
}
