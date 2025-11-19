import { useSelection } from '../hooks';
import { SelectionMode } from './enum';
import { CellFocusEvent } from './focus.interfaces';

/**
 * Configures selection behavior in the Data Grid component.
 * Defines settings for enabling selection, specifying selection mode, and controlling selection type.
 * Manages how to interact with row selection in the grid.
 */
export interface SelectionSettings {
    /**
     * Determines whether row selection is enabled in the grid.
     * When set to true, allows to select rows via clicks or keyboard interactions. When false, disables all selection functionality.
     * Affects the grid’s interactivity for row-based operations.
     *
     * @default true
     */
    enabled?: boolean;

    /**
     * Specifies whether selection toggling is permitted for a selected row.
     * When set to true, a selected row can be deselected through interaction.
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
     * Defines the type of selection, such as `Row`, to specify the selection target.
     * Used internally to determine whether selection applies to rows or other elements like cells.
     *
     * @default 'Row'
     * @private
     */
    type?: string;
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
     * Retrieves the data objects for the currently selected rows.
     * Returns the record(s) associated with the selected rows or null if no rows are selected.
     * Enables access to selected data for further processing or display.
     *
     * @returns {Object[] | null} The selected row data.
     */
    getSelectedRecords: () => T[] | null;

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
     * Adds or removes selection styling classes from the given row element.
     * Reflects the DOM manipulation implemented in `useSelection.ts` by toggling the `sf-active`
     * class and the `aria-selected` attribute on each cell when a row is selected or deselected.
     *
     * @param {Element} row - The grid row element whose child cells require selection class updates.
     * @param {boolean} isAdd - Set to true to apply selection classes, or false to remove them.
     * @returns {void}
     */
    addRemoveSelectionClasses: (row: Element, isAdd: boolean) => void;
}

/**
 * Defines the type for the selection module hook return value in the Data Grid.
 * Represents the return type of the useSelection hook for managing selection operations.
 * Used internally to encapsulate selection functionality.
 *
 * @private
 */
export type selectionModule<T> = ReturnType<typeof useSelection<T>>;

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
