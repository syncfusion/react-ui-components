import { Dispatch, SetStateAction } from 'react';
import { SortDirection } from './enum';
import { GridActionEvent } from './grid.interfaces';
import { useSort } from '../hooks';

/**
 * Defines the configuration for a sort descriptor in the Grid component.
 * Specifies the column `field` and `direction` for sorting operations.
 * Used to describe individual column sorting rules within the grid.
 */
export interface SortDescriptorModel {
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
 * Enumerates the sorting modes supported by the Grid.
 * Defines whether sorting is restricted to a single column or allows multiple columns.
 * Used internally to configure sorting behavior.
 *
 * @private
 */
export type SortMode = 'single' | 'multiple';

/**
 * Configures sorting behavior in the Grid component.
 * Manages settings for enabling sorting, defining sorted columns, and controlling sort persistence.
 * Determines how to interact with column sorting via headers or programmatically.
 */
export interface SortSettings {
    /**
     * Contains an array of `SortDescriptorModel` objects to define initial or active sort conditions.
     * Specifies which columns are sorted and in what direction at grid initialization or during runtime.
     * Enables pre-sorting data or retrieving the current sort state.
     *
     * @default []
     */
    columns?: SortDescriptorModel[];

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
     * Supports `single` for sorting one column at a time or `multiple` for sorting multiple columns simultaneously.
     * Influences the grid’s sorting behavior and user experience.
     *
     * @default 'multiple'
     */
    mode?: SortMode;
}

/**
 * Defines sorting properties for custom data services in the Grid.
 * Specifies the field and direction for sorting operations in external data handling.
 * Used internally to integrate with custom data sources or APIs.
 *
 * @private
 */
export interface Sorts {
    /**
     * Identifies the field name of the column to be sorted in the data source.
     * Maps to the column field used for sorting in custom data service operations.
     * Ensures accurate targeting of the column for external sorting logic.
     *
     * @default -
     */
    name?: string;

    /**
     * Specifies the direction of the sort operation for the column.
     * Supports values like 'asc' for ascending or 'desc' for descending order.
     * Determines the order in which data is sorted for the specified field.
     *
     * @default 'asc'
     */
    direction?: string;
}

/**
 * Represents event arguments for sort complete events in the Grid.
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
    field?: string;

    /**
     * Defines the direction of the completed sort operation for the column.
     * Indicates whether the column was sorted in ascending or descending order, typically from the `SortDirection` enum.
     *
     * @default SortDirection.Ascending | 'Ascending'
     */
    direction?: SortDirection | string;

    /**
     * References the DOM element associated with the completed sort action, such as the column header.
     * Identifies the element that triggered the sort operation, typically a clicked header.
     * Used to manage UI feedback or post-sort interactions.
     *
     * @default null
     */
    target?: Element;

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
     * Indicates the type of sort action that was completed (e.g., 'sorting', 'clearSorting').
     * Describes the operation performed, aiding in post-sort processing.
     * Helps differentiate between various sort-related actions.
     *
     * @type {string}
     * @default -
     */
    action?: 'sorting' | 'clearSorting';
}

/**
 * Defines the type for the sort strategy module in the Grid.
 * Represents the return type of the useSort hook for managing sorting operations.
 * Used internally to encapsulate sorting functionality.
 *
 * @private
 */
export type SortModule = ReturnType<typeof useSort>;

/**
 * Defines the API for handling sorting actions in the Grid.
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
     * @returns {void}
     */
    clearSort?(): void;

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
