import { Dispatch, SetStateAction } from 'react';
import { GridActionEvent } from '../types/grid.interfaces';
import { useSearch } from '../hooks';

/**
 * Configures search functionality for the Data Grid component.
 * Defines settings for enabling search, specifying search fields, and controlling search behavior.
 * Manages how data is filtered based on user search input across grid columns.
 */
export interface SearchSettings {
    /**
     * Determines whether the search bar is enabled for the grid.
     * When set to true, displays the search bar and allows to filter grid data. when false, disables search functionality.
     * Affects the visibility and usability of the search UI in the grid.
     *
     * @default false
     */
    enabled?: boolean;

    /**
     * Specifies an array of column field names to include in search operations.
     * By default, includes all bounded columns in the grid. An empty array means no fields are searched.
     * Allows targeting specific columns for search to optimize performance or relevance.
     *
     * @default []
     */
    fields?: string[];

    /**
     * Defines the initial search value to filter grid records at rendering or the current search value.
     * Used to pre-apply a search query on grid initialization or to retrieve the active search string.
     * Supports dynamic updates to reflect user input in the search bar.
     *
     * @default -
     */
    value?: string;

    /**
     * Specifies the operator used for search operations, such as 'contains', 'startsWith', 'endsWith', 'equal', or 'notEqual'.
     * Determines how the search value is matched against column data, affecting search precision.
     * Must be compatible with the data types of the searched fields.
     *
     * @default 'contains'
     */
    operator?: string;

    /**
     * Controls case sensitivity for string searches in the grid.
     * When true, searches are case-insensitive, treating uppercase and lowercase letters the same. When false, searches require exact case matching.
     * Only affects string fields and not numbers, dates, or booleans.
     *
     * @default true
     */
    caseSensitive?: boolean;

    /**
     * Enables accent-insensitive searching for string fields.
     * When true, diacritic characters (e.g., accents like é, ñ) are ignored, treating them as their base characters.
     * Enhances search usability for multilingual datasets.
     *
     * @default false
     */
    ignoreAccent?: boolean;
}


/**
 * Represents the event triggered when a search operation completes in the Data Grid.
 * Provides details about the completed search, including the applied search string.
 * Used to handle post-search logic or UI updates.
 */
export interface SearchEvent extends GridActionEvent {
    /**
     * Specifies the string value used in the completed search operation.
     * Reflects the search input that was applied to filter the grid’s records.
     * Useful for logging or updating UI after a search.
     *
     * @default -
     */
    value?: string;

    /**
     * Allows cancellation of the search action before it is executed.
     * When set to true, prevents the search from being applied, useful for validation or conditional logic.
     * Typically used in event handlers to control search behavior.
     *
     * @private
     * @default false
     */
    cancel?: boolean;
}

/**
 * Defines the type for the search strategy module in the Data Grid.
 * Represents the return type of the useSearch hook for managing search operations.
 * Used internally to encapsulate search functionality.
 *
 * @private
 */
export type searchModule = ReturnType<typeof useSearch>;

/**
 * Defines the API for managing search operations in the Data Grid.
 * Provides methods and properties to control search behavior, state, and updates.
 * Used internally to handle search interactions and configuration.
 *
 * @private
 */
export interface SearchAPI {
    /**
     * Initiates a search operation with the specified key to filter grid records.
     * Applies the search value across the configured fields using the specified operator and settings.
     * Triggers a grid refresh to display the filtered results.
     *
     * @param {string} key - The search key to filter grid records.
     * @returns {void}
     */
    search: (key: string) => void;

    /**
     * Stores the current search settings configuration for the grid.
     * Contains properties like enabled state, fields, operator, and case/accent sensitivity.
     * Used to access or update the grid’s search configuration.
     *
     * @default { enabled: false, caseSensitive: true, ignoreAccent: false, operator: 'contains' }
     */
    searchSettings: SearchSettings;

    /**
     * Provides a function to update the search settings state.
     * Used with React’s useState to programmatically modify search configurations.
     * Enables dynamic updates to search behavior or UI.
     *
     * @param {SetStateAction<SearchSettings>} value - The new search settings or a function to update them.
     * @returns {void}
     */
    setSearchSetting: Dispatch<SetStateAction<SearchSettings>>;
}
