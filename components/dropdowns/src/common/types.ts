import * as React from 'react';
import { DataManager, Query } from '@syncfusion/react-data';
import { Size } from '@syncfusion/react-base';
import { DataLoadEvent, DataRequestEvent, FieldSettingsModel, FilterEvent, FilterType, SortOrder } from '../drop-down-list';

export interface DropDownBaseProps {

    /**
     * Specifies the data source for the dropdown items
     */
    dataSource: { [key: string]: unknown }[] | DataManager | string[] | number[] | boolean[];

    /**
     * Defines mapping fields for the data items
     */
    fields: FieldSettingsModel;

    /**
     * Specifies the selected value
     */
    value?: number | string | boolean | object | null;

    /**
     * Defines the query to retrieve specific data from the data source
     */
    query?: Query;

    /**
     * Specifies the sort order for the data items
     *
     * @default SortOrder.None
     */
    sortOrder?: SortOrder;

    /**
     * Specifies whether to ignore case while filtering or selecting items.
     *
     * @default true
     */
    ignoreCase?: boolean;

    /**
     * Specifies whether to ignore diacritics while filtering or selecting items.
     *
     * @default false
     */
    ignoreAccent?: boolean;

    /**
     * Specifies whether filtering is enabled in the dropdown base.
     * When enabled, a search box appears at the top of the popup that allows users to filter items.
     *
     * @default false
     * @private
     */
    isDropdownFiltering?: boolean;

    /**
     * Specifies the placeholder text for the filter input field.
     * This is displayed when the filter input is empty.
     *
     * @default ''
     */
    filterPlaceholder?: string;

    /**
     * Defines the filtering type to apply when searching for items.
     * Possible values are 'StartsWith', 'EndsWith', and 'Contains'.
     *
     * @default FilterType.StartsWith
     */
    filterType?: FilterType;

    /**
     * Specifies the size style of the dropdownn list. Options include 'Small', 'Medium' and 'Large'.
     *
     * @default Size.Medium
     */
    size?: Size;

    /**
     * Enables binding of complex objects as values instead of primitive values. When enabled, the entire object can be accessed in events.
     *
     * @default false
     */
    allowObjectBinding?: boolean;

    /**
     * Specifies the debounce delay (in milliseconds) for filtering input.
     */
    debounceDelay?: number;

    /**
     * Defines the id to be applied in generated listbox for ARIA wiring.
     *
     * @private
     */
    listId?: string;

    /**
     * Defines the index of the visually active item.
     *
     * @private
     */
    activeIndex?: number | null;

    /**
     * Defines the cached remote data.
     */
    remoteCacheRef?: React.RefObject<Array<{ [key: string]: unknown } | string | number | boolean> | null>;

    /**
     * Specifies the data item corresponding to the selected value.
     */
    itemData?: string | number | boolean | { [key: string]: unknown };

    /**
     * Ends the remote data request.
     */
    endRemoteRequest?: () => void;

    /**
     * Defines template for rendering individual items
     */
    itemTemplate?: Function | React.ReactNode;

    /**
     * Defines template for rendering group headers
     */
    groupTemplate?: Function | React.ReactNode;

    /**
     * Defines template for header section
     */
    headerTemplate?: React.ReactNode;

    /**
     * Defines template for footer section
     */
    footerTemplate?: React.ReactNode;

    /**
     * Defines template when no data is available
     */
    noRecordsTemplate?: (() => React.ReactNode) | React.ReactNode;

    /**
     * Defines the template to render when an error occurs
     */
    onErrorTemplate?: (() => React.ReactNode) | React.ReactNode;

    /**
     * Triggers when data fetching fails
     */
    onError?: (event: Error) => void;

    /**
     * Triggers when an item is clicked
     */
    onItemClick?: (event: React.MouseEvent<HTMLLIElement>, index: number) => void;

    /**
     * Handles keyboard actions
     */
    keyActionHandler?: (event: React.KeyboardEvent<HTMLElement>) => void;

    /**
     * Triggers on typing a character in the filter bar when the filtering is enabled.
     */
    onFilter?: (event: FilterEvent) => void;

    /**
     * Callback that triggers when remote data loading completes
     *
     * @private
     */
    onRemoteDataLoaded?: () => void;

    /**
     * Triggers before data is fetched.
     */
    onDataRequest?: (event: DataRequestEvent) => void;

    /**
     * Triggers after data is fetched successfully.
     */
    onDataLoad?: (event: DataLoadEvent) => void;

    /**
     * Returns a stable id for a given option index.
     *
     * @private
     */
    getOptionId?: (index: number) => string;
}

/**
 * Specifies the base methods for dropdown components.
 */
export interface IDropDownBase {

    /**
     * Gets formatted value based on type
     */
    getFormattedValue(value: string | number | boolean): string | number | boolean;

    /**
     * Gets data object by value
     */
    getDataByValue(
        value: string | number | boolean | null
    ): { [key: string]: object } | string | number | boolean | undefined;

    /**
     * Gets index by value
     */
    getIndexByValue(value: string | number | boolean): number;

    /**
     * Gets text by value
     */
    getTextByValue(value: string | number | boolean): string;

    /**
     * Gets all list items
     */
    getListItems(): HTMLLIElement[];

    /**
     * Gets the scroll container.
     */
    getScrollContainer():  HTMLElement | null ;

    /**
     * Gets all filtered list datas
     *
     * @private
     *
     */
    getFilteredListData(): { [key: string]: object }[] | boolean[] | string[] | number[];

    /**
     * To filter the data from given data source by using query
     */
    filter(
        dataSource: { [key: string]: unknown }[] | DataManager | string[] | number[] | boolean[],
        query?: Query,
        fields?: FieldSettingsModel
    ): void;
}

/**
 * Specifies the class names to be applied to the root element of the DropDownBase component.
 *
 * @private
 */
export interface DropDownBaseClassList {
    root: string;
    content: string;
    selected: string;
    focus: string;
    li: string;
    disabled: string;
    grouping: string;
    hover: string;
    noData: string;
}
