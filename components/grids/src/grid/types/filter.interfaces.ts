import { Dispatch, SetStateAction } from 'react';
import { FilterType, FilterBarMode } from './index';
import { ColumnProps } from '../types/column.interfaces';
import { ICustomOptr } from '../types/interfaces';
import { GridActionEvent } from '../types/grid.interfaces';

/**
 * Defines the configuration for filtering functionality in the Grid component.
 * Specifies settings for enabling filtering, defining filter conditions, and customizing the filter UI.
 * Controls how data is filtered based on user input and predefined criteria.
 */
export interface FilterSettings {
    /**
     * Determines whether filtering is enabled for the grid’s columns.
     * When set to true, allows to apply filters via the filter bar. When false, disables all filtering functionality from the grid.
     * Affects all columns unless overridden by individual column settings.
     *
     * @type {boolean}
     * @default false
     */
    enabled?: boolean;

    /**
     * Specifies an array of `PredicateModel` objects to define initial or active filter conditions for grid columns.
     * Each predicate represents a filter rule applied to a specific column, such as `field`, `operator`, and `value`.
     * Used to pre-filter data on grid initialization or to retrieve the current filter state.
     *
     * @type {FilterPredicates[]}
     * @default []
     */
    columns?: FilterPredicates[];

    /**
     * Configures the type of filter UI to be used in the grid, such as `FilterBar`.
     * Determines the visual interface for applying filters to columns.
     *
     * @type {FilterType}
     * @default 'FilterBar'
     * @private
     */
    type?: FilterType;

    /**
     * Specifies the operational mode of the filter bar, controlling when filtering is triggered.
     * Supports `OnEnter` (filtering starts when the Enter key is pressed) or `Immediate` (filtering starts after a time delay).
     * Influences the responsiveness and user experience of filtering interactions.
     *
     * @type {FilterBarMode | string}
     * @default 'Immediate'
     */
    mode?: FilterBarMode | string;

    /**
     * Sets the time delay (in milliseconds) for filtering in `Immediate` mode.
     * Controls the wait time before the grid processes filter input, balancing responsiveness and performance.
     * Only applicable when the filter mode is set to `Immediate`.
     *
     * @type {number}
     * @default 1500
     */
    immediateModeDelay?: number;

    /**
     * Provides a configuration object to override default filter operators in the filter menu.
     * Allows customization of operators (e.g., 'equal', 'contains') based on column data types (string, number, date, boolean).
     * Used internally to tailor filter behavior for specific use cases.
     *
     * @type {ICustomOptr}
     * @default null
     * @private
     */
    operators?: ICustomOptr;

    /**
     * Enables or disables accent-insensitive filtering for string fields.
     * When true, diacritic characters (e.g., accents like é, ñ) are ignored during filtering, treating them as their base characters.
     * Improves filter usability for multilingual datasets.
     *
     * @type {boolean}
     * @default false
     */
    ignoreAccent?: boolean;

    /**
     * Enables or disables case-sensitive filtering for string fields.
     * When true, string filtering distinguishes between uppercase and lowercase letters. When false, it is case-insensitive.
     * Does not affect filtering for numbers, booleans, or dates.
     *
     * @type {boolean}
     * @default false
     */
    caseSensitive?: boolean;
}

/**
 * Represents the event triggered when a filtering operation completes in the Grid component.
 * Provides comprehensive details about the completed filter action and its results.
 * Used to handle post-filtering logic or updates.
 */
export interface FilterEvent extends GridActionEvent {
    /**
     * Defines the predicate object for the filter that was just applied.
     * Contains the `field`, `operator`, and `value` used in the completed filter operation.
     *
     * @type {FilterPredicates}
     * @default -
     */
    currentFilterObject?: FilterPredicates;

    /**
     * Lists all predicate objects representing the current filter conditions across columns.
     * Provides a complete set of active filters applied to the grid.
     * Used to inspect or modify the grid’s filter state post-operation.
     *
     * @type {FilterPredicates[]}
     * @default []
     */
    columns?: FilterPredicates[];

    /**
     * Indicates the type of filter action that was completed (e.g., 'filtering', 'clearFiltering').
     * Describes the operation performed, aiding in post-filter processing.
     * Helps differentiate between various filter-related actions.
     *
     * @type {string}
     * @default -
     */
    action?: 'filtering' | 'clearFiltering';

    /**
     * Provides the configuration object for the filtered column.
     * Contains metadata such as field name, data type, and column-specific settings.
     * Enables access to column properties for post-filter customization.
     *
     * @type {ColumnProps}
     * @default -
     */
    currentFilterColumn?: ColumnProps;

    /**
     * Allows cancellation of the filtering action before it is applied.
     * When set to true, prevents the filter from being executed, useful for validation or conditional logic.
     * Typically used in event handlers to control filter behavior.
     *
     * @private
     * @type {boolean}
     * @default false
     */
    cancel?: boolean;
}

/**
 * Configures filter predicates for individual columns in the Grid component.
 * Defines the criteria, operators, and behavior for filtering data in a specific column.
 * Supports filtering scenarios with logical conditions.
 */
export interface FilterPredicates {
    /**
     * Identifies the column `field` in the data source to which the filter is applied.
     * Used to map the filter condition to the correct column.
     *
     * @type {string}
     * @default -
     */
    field?: string;

    /**
     * Specifies the comparison operator used for filtering grid column data.
     * Determines how the filter value is compared to column data.
     *
     * Must align with the column’s data type (e.g., string, number, date) to ensure valid filtering behavior.
     * Common operators include:
     * equal, notEqual – for exact matches.
     * greaterThan, lessThan – for numeric or date comparisons.
     * contains, startsWith, endsWith – for string-based filtering.
     *
     * @type {string}
     * @default -
     */
    operator?: string;

    /**
     * Defines the `value` used to filter records in the column.
     * Supports single value or arrays for strings, numbers, dates, or booleans, depending on the column type.
     * Used to match records against the specified operator.
     *
     * @type {string | number | Date | boolean | (string | number | Date | boolean)[]}
     * @default -
     */
    value?: string | number | Date | boolean | (string | number | Date | boolean)[];

    /**
     * Determines whether string filtering is case-sensitive.
     * When true, exact case matching is enforced for string fields. When false, filtering is case-insensitive.
     * Does not affect non-string fields like numbers or dates.
     *
     * @type {boolean}
     * @default false
     */
    caseSensitive?: boolean;

    /**
     * Enables accent-insensitive filtering for string fields.
     * When true, diacritic characters (e.g., accents like á, é) are treated as their base characters during filtering.
     * Enhances filter capabilities for multilingual data.
     *
     * @type {boolean}
     * @default false
     */
    ignoreAccent?: boolean;

    /**
     * Specifies the logical operator ('and' or 'or') to combine this predicate with others.
     * Enables filtering by linking multiple conditions for the same or different columns.
     * Used to build advanced filter queries.
     *
     * @type {string}
     * @default -
     */
    predicate?: string;

    /**
     * Stores the actual filter value applied to the column for internal processing.
     * Used by the Grid to manage filter state and apply filter logic.
     * Typically handled internally and not set directly by users.
     *
     * @type {Object}
     * @default -
     * @private
     */
    actualFilterValue?: Object;

    /**
     * Stores the actual filter operator applied to the column for internal logic.
     * Used by the Grid to validate and process filter operations.
     * Managed internally for filter execution and state tracking.
     *
     * @type {Object}
     * @default -
     * @private
     */
    actualOperator?: Object;

    /**
     * Specifies the data type of the column being filtered (e.g., 'string', 'number').
     * Used internally to determine appropriate filter behavior and operator compatibility.
     * Set automatically based on the column’s configuration.
     *
     * @type {string}
     * @default -
     * @private
     */
    type?: string;

    /**
     * Stores the predicate object for advanced filter logic and query building.
     * Used internally by the Grid to construct complex filter queries.
     * Not typically modified directly by users.
     *
     * @type {Object}
     * @default -
     * @private
     */
    ejpredicate?: Object;

    /**
     * Provides a unique identifier for the filter predicate to track its state.
     * Used by the grid to manage and reference individual filter conditions.
     * Ensures accurate filter application and state persistence.
     *
     * @type {string}
     * @default -
     */
    uid?: string;

    /**
     * Indicates whether the column is a foreign key for relational data filtering.
     * When true, enables filtering based on associated foreign key data rather than local column values.
     * Used internally for handling relational data sources.
     *
     * @type {boolean}
     * @default false
     * @private
     */
    isForeignKey?: boolean;

    /**
     * Defines the logical condition ('and' or 'or') for combining this predicate with others.
     * Used to construct complex filter queries by linking multiple predicates.
     * Complements the predicate property for advanced filtering logic.
     *
     * @type {string}
     * @default -
     * @private
     */
    condition?: string;
}

/**
 * Manages internal properties for the Grid’s Filter module.
 * Handles filter state, operations, and configuration for filtering logic.
 * Used internally to control filter behavior and performance.
 * @private
 */
export interface FilterProperties {
    /**
     * Specifies the operator used for filtering the column (e.g., 'equal', 'contains').
     * Determines how the filter value is compared to column data during filtering.
     * Set based on the filter configuration or user input.
     *
     * @type {string}
     * @default -
     */
    operator: string;

    /**
     * Identifies the field name of the column being filtered in the data source.
     * Maps to the column’s field property to apply the filter condition.
     * Essential for targeting the correct column during filtering.
     *
     * @type {string}
     * @default -
     */
    fieldName: string;

    /**
     * Enables accent-insensitive filtering for string fields.
     * When true, diacritic characters are ignored, treating them as base characters.
     * Aligns with the ignoreAccent setting in FilterSettings.
     *
     * @type {boolean}
     * @default false
     */
    ignoreAccent: boolean;

    /**
     * Enables case-sensitive filtering for string fields.
     * When true, distinguishes between uppercase and lowercase letters in string comparisons.
     * Aligns with the caseSensitive setting in FilterSettings.
     *
     * @type {boolean}
     * @default false
     */
    caseSensitive: boolean;

    /**
     * References the DOM element currently targeted for filtering operations.
     * Used internally to track the active filter input element (e.g., filter bar input).
     * Facilitates event handling and UI interactions during filtering.
     *
     * @type {Element | null}
     * @default null
     */
    currentTarget: Element | null;

    /**
     * Indicates whether multi-column sorting is enabled during filtering.
     * When true, allows sorting to influence filter results in multi-column scenarios.
     * Used internally to coordinate sorting and filtering operations.
     *
     * @type {boolean}
     * @default false
     */
    isMultiSort: boolean;

    /**
     * Contains the configuration object for the column being filtered.
     * Includes metadata such as field name, data type, and column-specific settings.
     * Used to apply filter logic specific to the column’s properties.
     *
     * @type {ColumnProps}
     * @default -
     */
    column: ColumnProps;

    /**
     * Specifies the value used to filter the column’s data.
     * Supports strings, numbers, dates, or booleans, depending on the column type.
     * Used to match records against the specified operator.
     *
     * @type {string | number | Date | boolean}
     * @default -
     */
    value: string | number | Date | boolean;

    /**
     * Indicates whether filtering is performed via method calls (e.g., filterByColumn).
     * When true, signifies programmatic filtering rather than user-driven UI filtering.
     * Used internally to differentiate filter invocation methods.
     *
     * @type {boolean}
     * @default false
     */
    filterByMethod: boolean;

    /**
     * Specifies the logical predicate ('and' or 'or') for combining filter conditions.
     * Used to build complex filter queries by linking multiple predicates.
     * Aligns with the predicate property in FilterPredicates.
     *
     * @type {string}
     * @default -
     */
    predicate: string;

    /**
     * Stores a collection of filter predicates organized by field name.
     * Maps each column field to an array of predicate objects for filtering.
     * Used internally to manage and apply multiple filter conditions.
     *
     * @type {{ [key: string]: FilterPredicates[] }}
     * @default {}
     */
    actualPredicate: { [key: string]: FilterPredicates[] };

    /**
     * Contains filter values for internal processing and state management.
     * Stores the raw filter values applied to columns during filtering operations.
     * Used by the Grid for filter execution and validation.
     *
     * @type {Object}
     * @default {}
     */
    values: Object;

    /**
     * Stores cell text values used during filtering operations.
     * Contains the display text or input values for filter processing.
     * Used internally to manage filter bar or menu input data.
     *
     * @type {Object}
     * @default {}
     */
    cellText: Object;

    /**
     * Indicates whether a refresh of the filter state is required.
     * When true, triggers a re-evaluation of filter conditions or UI updates.
     * Used to ensure filter consistency after changes.
     *
     * @type {boolean}
     * @default false
     */
    refresh: boolean;

    /**
     * Indicates whether a refresh of the grid content is needed after filtering.
     * When true, forces the grid to re-render with updated filter results.
     * Used to maintain UI consistency post-filtering.
     *
     * @type {boolean}
     * @default false
     */
    contentRefresh: boolean;

    /**
     * Indicates whether the grid is in its initial load state.
     * When true, signifies that the grid is loading with initial filter settings.
     * Used to handle first-time filter application scenarios.
     *
     * @type {boolean}
     * @default true
     */
    initialLoad: boolean;

    /**
     * Stores a status message for filter operations (e.g., error or success messages).
     * Used internally to communicate filter operation outcomes to the user or system.
     * Helps in debugging or providing feedback during filtering.
     *
     * @type {string}
     * @default -
     */
    filterStatusMsg: string;

    /**
     * Lists string input types to skip during filtering operations.
     * Used to exclude specific string-based inputs from filter processing.
     * Configured internally to optimize filter behavior.
     *
     * @type {string[]}
     * @default []
     */
    skipStringInput: string[];

    /**
     * Lists number input types to skip during filtering operations.
     * Used to exclude specific number-based inputs from filter processing.
     * Configured internally to streamline filter logic.
     *
     * @type {string[]}
     * @default []
     */
    skipNumberInput: string[];

    /**
     * Stores the timer value for filtering operations in 'Immediate' mode.
     * Represents the delay (in milliseconds) before processing filter input.
     * Used to manage the timing of filter execution.
     *
     * @type {number}
     * @default 0
     */
    timer: number;
}

/**
 * Defines string constants for filter operators used in the Grid.
 * Provides a set of operator names for various filtering operations.
 * Used internally to map operators to filter logic.
 *
 * @private
 */
export interface IFilterOperator {
    /**
     * Represents the 'contains' operator for string filtering.
     * Filters records where the column value contains the specified string.
     * Commonly used for partial text matches.
     *
     * @type {string}
     * @default -
     */
    contains: string;

    /**
     * Represents the 'ends with' operator for string filtering.
     * Filters records where the column value ends with the specified string.
     * Useful for suffix-based string filters.
     *
     * @type {string}
     * @default -
     */
    endsWith: string;

    /**
     * Represents the 'equal' operator for filtering.
     * Filters records where the column value exactly matches the specified value.
     * Applicable to strings, numbers, dates, and booleans.
     *
     * @type {string}
     * @default -
     */
    equal: string;

    /**
     * Represents the 'greater than' operator for filtering.
     * Filters records where the column value is greater than the specified value.
     * Typically used for numeric or date fields.
     *
     * @type {string}
     * @default -
     */
    greaterThan: string;

    /**
     * Represents the 'greater than or equal' operator for filtering.
     * Filters records where the column value is greater than or equal to the specified value.
     * Used for numeric or date comparisons.
     *
     * @type {string}
     * @default -
     */
    greaterThanOrEqual: string;

    /**
     * Represents the 'less than' operator for filtering.
     * Filters records where the column value is less than the specified value.
     * Commonly used for numeric or date fields.
     *
     * @type {string}
     * @default -
     */
    lessThan: string;

    /**
     * Represents the 'less than or equal' operator for filtering.
     * Filters records where the column value is less than or equal to the specified value.
     * Applicable to numeric or date fields.
     *
     * @type {string}
     * @default -
     */
    lessThanOrEqual: string;

    /**
     * Represents the 'not equal' operator for filtering.
     * Filters records where the column value does not match the specified value.
     * Supports strings, numbers, dates, and booleans.
     *
     * @type {string}
     * @default -
     */
    notEqual: string;

    /**
     * Represents the 'starts with' operator for string filtering.
     * Filters records where the column value starts with the specified string.
     * Useful for prefix-based string filters.
     *
     * @type {string}
     * @default -
     */
    startsWith: string;

    /**
     * Represents the 'is null' operator for filtering.
     * Filters records where the column value is null or undefined.
     * Applicable to any column type.
     *
     * @type {string}
     * @default -
     */
    isNull: string;

    /**
     * Represents the 'not null' operator for filtering.
     * Filters records where the column value is not null or undefined.
     * Applicable to any column type.
     *
     * @type {string}
     * @default -
     */
    isNotNull: string;

    /**
     * Represents the 'wildcard' operator for string filtering.
     * Filters records using wildcard patterns (e.g., '*' or '?') in the filter value.
     * Used for advanced string matching scenarios.
     *
     * @type {string}
     * @default -
     */
    wildCard: string;

    /**
     * Represents the 'like' operator for string filtering.
     * Filters records using pattern-based matching similar to SQL LIKE.
     * Supports partial matches with wildcards.
     *
     * @type {string}
     * @default -
     */
    like: string;
}

/**
 * Defines the API for managing filtering operations in the Grid.
 * Provides methods and properties to control filter behavior, state, and events.
 * Used internally to handle filter interactions and updates.
 *
 * @private
 */
export interface FilterAPI {
    /**
     * Applies a filter to a specific column with the given criteria.
     * Uses the specified field name, operator, and value to filter grid rows, with optional logical predicates.
     * Supports case-sensitive and accent-insensitive filtering options.
     *
     * @param {string} fieldName - The column field to filter.
     * @param {string} filterOperator - The operator for filtering (e.g., 'equal', 'contains').
     * @param {string | number | Date | boolean | number[] | string[] | Date[] | boolean[]} filterValue - The value(s) to filter against.
     * @param {string} [predicate] - Logical operator ('and'/'or') for combining filters.
     * @param {boolean} [caseSensitive] - Enables case-sensitive string filtering.
     * @param {boolean} [ignoreAccent] - Enables accent-insensitive string filtering.
     * @returns {void}
     */
    filterByColumn(fieldName: string, filterOperator: string,
        filterValue: string | number | Date | boolean | number[] | string[] | Date[] | boolean[],
        predicate?: string, caseSensitive?: boolean, ignoreAccent?: boolean): void;

    /**
     * Clears all filter conditions from the grid or specific columns.
     * Resets the filter state, removing all or specified column filters, and refreshes the grid.
     * Optionally clears filter bar input values.
     *
     * @param {string[]} [fields] - Array of field names to clear filters from; if omitted, clears all filters.
     * @returns {void}
     */
    clearFilter(fields?: string[]): void;

    /**
     * Removes the filter condition for a specific column by its field name.
     * Optionally clears the filter bar input value for the column.
     * Used to reset filtering for individual columns without affecting others.
     *
     * @param {string} [field] - The field name of the column to remove the filter from.
     * @param {boolean} [isClearFilterBar] - If true, clears the filter bar input value.
     * @returns {void}
     */
    removeFilteredColsByField(field?: string, isClearFilterBar?: boolean): void;

    /**
     * Handles keyboard input events during filter operations.
     * Processes key presses (e.g., Enter) to trigger filtering in the filter bar or menu.
     * Used to enhance user interaction with the filter UI.
     *
     * @param {React.KeyboardEvent} event - The keyboard event object.
     * @returns {void}
     */
    keyUpHandler: (event: React.KeyboardEvent) => void;

    /**
     * Handles mouse down events during filter operations.
     * Processes mouse clicks in the filter UI (e.g., filter menu selection) to initiate filtering.
     * Used to manage user interactions with filter controls.
     *
     * @param {React.MouseEvent} event - The mouse event object.
     * @returns {void}
     */
    mouseDownHandler: (event: React.MouseEvent) => void;

    /**
     * Stores the current filter settings configuration for the grid.
     * Contains all filter-related properties, such as enabled state, type, and predicates.
     * Used to access or update the grid’s filter state.
     *
     * @type {FilterSettings}
     * @default {}
     */
    filterSettings: FilterSettings;

    /**
     * Provides a function to update the filter settings state.
     * Used with React’s useState to programmatically modify filter configurations.
     * Enables dynamic updates to filter behavior or UI.
     *
     * @type {Dispatch<SetStateAction<FilterSettings>>}
     * @default -
     */
    setFilterSettings: Dispatch<SetStateAction<FilterSettings>>;
}

/**
 * Represents the FilterAPI interface for filter operations in the Grid.
 * Defines the contract for the Filter module’s functionality and state management.
 * Used internally to encapsulate filtering logic.
 *
 * @private
 */
export type filterModule = FilterAPI;
