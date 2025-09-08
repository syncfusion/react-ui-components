import { ReactElement } from 'react';
import { GridActionEvent } from '../types/grid.interfaces';

/**
 * Configures pagination settings for the Grid component.
 * Controls the behavior and appearance of pagination, including page size and navigation.
 * Enables customization of how data is paginated and displayed in the grid.
 */
export interface PageSettings {
    /**
     * Determines whether pagination is enabled for the grid.
     * When set to true, splits the grid’s data into pages with navigation controls. When false, displays all data without pagination.
     * Affects the visibility and functionality of the pager component.
     *
     * @default false
     */
    enabled?: boolean;

    /**
     * Specifies the number of records to display on each page of the grid.
     * Impacts the pagination calculations and user experience.
     *
     * @default 12
     * @example
     */
    pageSize?: number;

    /**
     * Controls the range of page numbers displayed for navigation, enhancing usability.
     * Affects the pager’s visual layout and navigation options.
     *
     * @default 8
     */
    pageCount?: number;

    /**
     * Sets the current page number to display in the grid.
     * Determines which page of data is actively shown, based on the page size and total records.
     * Used to initialize or programmatically navigate to a specific page.
     *
     * @default 1
     */
    currentPage?: number;

    /**
     * Stores the total number of records in the grid’s data source.
     * Used internally to calculate the number of pages and display pagination information.
     * Automatically set based on the data source and not typically configured by users.
     *
     * @default 0
     * @private
     */
    totalRecordsCount?: number;

    /**
     * Defines a custom template for rendering the pager component.
     * Allows replacement of the default pager UI with custom strings, React elements, or functions for dynamic rendering.
     * Enables advanced customization of the pager’s appearance and behavior.
     *
     * @default null
     */
    template?: string | ReactElement | Function;
}

/**
 * Represents the event triggered when a page change operation completes in the Grid component.
 * Provides details about the completed navigation, including page transitions and record count.
 * Used to handle post-navigation logic or UI updates in the pager component.
 */
export interface PageEvent extends GridActionEvent {
    /**
     * Specifies the page number before the navigation action was completed.
     * Provides context about the previous state for comparison or logging.
     * Useful for tracking page transitions after navigation.
     *
     * @default 1
     */
    previousPage?: string | number;

    /**
     * Specifies the page number after the navigation action is completed.
     * Indicates the current page now displayed in the grid.
     * Used to update the grid’s data and UI state in the pager component.
     *
     * @default 1
     */
    currentPage?: string | number;

    /**
     * Contains the total number of records in the grid’s data source.
     * Used to calculate the total number of pages and update pagination information.
     *
     * @default 0
     */
    totalRecordsCount?: number;

    /**
     * Allows cancellation of the page change action before it is executed.
     * When set to true, prevents the grid from navigating to the new page, useful for validation.
     * Typically used in event handlers to control pagination behavior.
     *
     * @private
     * @default false
     */
    cancel?: boolean;
}

/**
 * Represents arguments for pager events during page navigation in the Grid.
 * Provides detailed context about the pagination process, including loading state.
 * Used internally to manage pager interactions and state.
 *
 * @private
 */
export interface PagerArgsInfo extends PageEvent {
    /**
     * Specifies the page number targeted or active after navigation.
     * Reflects the current page being displayed or requested.
     * Aligns with the currentPage in other pagination events.
     *
     * @default 1
     */
    currentPage?: number | string;

    /**
     * Specifies the page number before the navigation action.
     * Provides the previous page context for tracking transitions.
     * Aligns with the previousPage in other pagination events.
     *
     * @default 1
     */
    oldPage?: number | string;

    /**
     * Indicates whether a page request is currently in progress.
     * When true, signifies that the grid is loading data for the new page.
     * Used to manage UI feedback during asynchronous page loading.
     *
     * @default false
     */
    isPageLoading?: boolean;
}
