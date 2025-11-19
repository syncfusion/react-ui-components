import { Dispatch, SetStateAction } from 'react';
import { ActionType, SortDirection, SortMode } from './enum';
import { GridActionEvent } from './grid.interfaces';
import { useSort } from '../hooks';

/**
 * Defines the configuration for a sort descriptor in the Data Grid component.
 * Specifies the column `field` and `direction` for sorting operations.
 * Used to describe individual column sorting rules within the grid.
 */
export interface SortDescriptor {
    /**
     * Identifies the column `field` in the data source to apply sorting operations.
     * Determines which column’s data is sorted during the operation.
     *
     * @default -
     */
    field?: string;

    /**
     * Specifies the `direction` of the sort operation for the column.
     * Supports values like ascending or descending, typically defined by the SortDirection enum.
     * Controls whether the column data is sorted in ascending or descending order.
     *
     * @default SortDirection.Ascending | 'Ascending'
     */
    direction?: SortDirection | string;
}

/**
 * Configures sorting behavior in the Data Grid component.
 * Manages settings for enabling sorting, defining sorted columns, and controlling sort persistence.
 * Determines how to interact with column sorting via headers or programmatically.
 */
export interface SortSettings {
    /**
     * Contains an array of `SortDescriptor` objects to define initial or active sort conditions.
     * Specifies which columns are sorted and in what direction at grid initialization or during runtime.
     * Enables pre-sorting data or retrieving the current sort state.
     *
     * @default []
     */
    columns?: SortDescriptor[];

    /**
     * Determines whether clicking a sorted column header can clear its sort state.
     * When false, prevents the grid from remove the sorting a column, maintaining the sort order. When true, allows toggling to an unsorted state.
     * Affects user interaction with sorted column headers.
     *
     * @default true
     */
    allowUnsort?: boolean;

    /**
     * Enables or disables sorting functionality for grid columns.
     * When true, allows to sort data by clicking column headers, with support for multiple columns using the Ctrl key.
     * When false, disables all sorting interactions and programmatic sorting.
     *
     * @default false
     */
    enabled?: boolean;

    /**
     * Specifies whether sorting is restricted to a single column or allows multiple columns.
     * Supports `Single` for sorting one column at a time or `Multiple` for sorting multiple columns simultaneously.
     * Influences the grid’s sorting behavior and user experience.
     *
     * @default 'Multiple'
     */
    mode?: string | SortMode;
}

/**
 * Represents event arguments for sort complete events in the Data Grid.
 * Provides details about the completed sort operation, including column and direction.
 * Used to handle post-sort logic or UI updates in the grid header.
 */
export interface SortEvent extends GridActionEvent {
    /**
     * Specifies the `field` name of the column that was sorted.
     * Identifies the column in the data source affected by the completed sort operation.
     * Useful for logging or updating UI after sorting.
     *
     * @default -
     */
    field: string;

    /**
     * Defines the direction of the completed sort operation for the column.
     * Indicates whether the column was sorted in ascending or descending order, typically from the `SortDirection` enum.
     *
     * @default SortDirection.Ascending | 'Ascending'
     */
    direction?: SortDirection | string;

    /**
     * The React event that triggered the sort operation.
     *
     * Can be a mouse or keyboard event, depending on the interaction type.
     * Provides access to event metadata such as the target element, key pressed,
     * or mouse coordinates, enabling contextual handling of sort logic.
     *
     * @default null
     */
    event?: React.MouseEvent | React.KeyboardEvent;

    /**
     * Allows cancellation of the sort action before it is applied.
     * When set to true, prevents the sort operation from executing, useful for validation or conditional logic.
     * Typically used in event handlers to control sorting behavior.
     *
     * @private
     * @default false
     */
    cancel?: boolean;

    /**
     * Indicates the type of sort action that was completed (e.g., 'Sorting', 'ClearSorting').
     * Describes the operation performed, aiding in post-sort processing.
     * Helps differentiate between various sort-related actions.
     *
     * @default -
     */
    action: string | ActionType;

    /**
     * Contains an array of active sort descriptors.
     * Each descriptor defines a column `field` and its sort direction.
     * Useful for retrieving the current sort state across multiple `columns`.
     *
     * @default []
     */
    columns?: SortDescriptor[];
}

/**
 * Defines the type for the sort strategy module in the Data Grid.
 * Represents the return type of the useSort hook for managing sorting operations.
 * Used internally to encapsulate sorting functionality.
 *
 * @private
 */
export type SortModule = ReturnType<typeof useSort>;

/**
 * Defines the API for handling sorting actions in the Data Grid.
 * Provides methods and properties to manage sort operations, state, and user interactions.
 * Used internally to control sorting behavior and configuration.
 *
 * @private
 */
export interface SortAPI {
    /**
     * Initiates a sort operation on a specified column with given options.
     * Applies sorting to the column using the provided direction, with an option to maintain previous sorts in multi-sort mode.
     * Updates the grid’s data and UI to reflect the new sort order.
     *
     * @param {string} columnName - Defines the column name to be sorted.
     * @param {SortDirection | string} sortDirection - Defines the direction of sorting field.
     * @param {boolean} isMultiSort - Specifies whether the previous sorted columns are to be maintained.
     * @returns {void}
     */
    sortByColumn?(columnName: string, sortDirection: SortDirection | string, isMultiSort?: boolean): void;

    /**
     * Removes the sort condition for a specific column by its field name.
     * Clears sorting for the specified column, updating the grid’s data and UI to reflect the change.
     * Useful for programmatically resetting sort state for individual columns.
     *
     * @param {string} columnName - Defines the column name to remove sorting from.
     * @returns {void}
     */
    removeSortColumn?(columnName: string): void;

    /**
     * Clears all sorting conditions applied to the grid’s columns.
     * Resets the sort state, removing all sorted columns and reverting to the original data order.
     * Updates the grid’s UI to reflect the unsorted state.
     *
     * @param {string[]} [fields] - Array of field names to clear sorts from. if omitted, clears all sorts.
     * @returns {void}
     */
    clearSort?(fields?: string[]): void;

    /**
     * Processes grid click events to handle sorting functionality.
     * Determines whether a click on a column header should trigger a sort operation based on the target and sort settings.
     * Updates the sort state and grid UI accordingly.
     *
     * @param {React.MouseEvent} event - The mouse event triggered on grid click.
     * @returns {void}
     */
    handleGridClick: (event: React.MouseEvent) => void;

    /**
     * Processes keyboard up events to handle sorting functionality.
     * Handles key presses (e.g., Enter or Space) on column headers to trigger sorting actions.
     * Enhances accessibility and user interaction with sorting controls.
     *
     * @param {React.KeyboardEvent} event - The keyboard event triggered on key up.
     * @returns {void}
     */
    keyUpHandler: (event: React.KeyboardEvent) => void;

    /**
     * Stores the current sort settings configuration for the grid.
     * Contains properties like enabled state, sorted columns, and sorting mode.
     * Used to access or update the grid’s sorting configuration.
     *
     * @default {}
     */
    sortSettings: SortSettings;

    /**
     * Provides a function to update the sort settings state.
     * Used with React’s useState to programmatically modify sorting configurations.
     * Enables dynamic updates to sorting behavior or UI.
     *
     * @default null
     */
    setSortSettings: Dispatch<SetStateAction<SortSettings>>;
}
