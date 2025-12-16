import * as React from 'react';
import { DataManager, Query } from '@syncfusion/react-data';
import { LabelMode, Size, Variant, SortOrder } from '@syncfusion/react-base';
import { CollisionAxis, PositionAxis, CollisionType } from '@syncfusion/react-popups';
import { validationProps } from '@syncfusion/react-inputs';
export { SortOrder, PositionAxis, CollisionAxis, CollisionType };

/**
 * Specifies the popup settings for the dropdown components.
 */
export interface PopupSettings {

    /** Specifies the X and Y position of the popup relative to the target element.
     *
     * @private
     * @default {X:'left', Y:'bottom'}
     */
    position?: PositionAxis;

    /** Specifies the horizontal offset for positioning the popup relative to the target.
     *
     * @default 0
     */
    offsetX?: number;
    /** Specifies the vertical offset for positioning the popup relative to the target.
     *
     * @default 0
     */
    offsetY?: number;
    /** Specifies the collision handling behavior on the X and Y axes. When the popup collides with the viewport, this determines how it adjusts.
     *
     * @private
     * @default { X: CollisionType.None, Y: CollisionType.None }
     */
    collision?: CollisionAxis;

    /**
     * Specifies the z-index value for the dropdown popup, controlling its stacking order relative to other elements on the page.
     *
     * @default 1000
     */
    zIndex?: number;

    /** Specifies whether the popup automatically adjusts its position when the content size changes.
     *
     * @default true
     */
    autoReposition?: boolean;

    /**
     * Specifies the width of the dropdown popup list.
     *
     * @default '100%'
     */
    width?: string;

    /**
     * Specifies the height of the dropdown popup list.
     *
     * @default '300px'
     */
    height?: string;
}

/**
 * Specifies the mapping fields used to bind data source values to the corresponding properties of list items in dropdown components.
 */
export interface FieldSettingsModel {

    /**
     * Specifies the text column from the data source for each list item.
     *
     * @default 'text'
     */
    text?: string;

    /**
     * Specifies the value column from the data source for each list item.
     *
     * @default 'value'
     */
    value?: string;

    /**
     * Specifies to group the list items with their related items by mapping the groupBy field.
     *
     * @default 'groupBy'
     */
    groupBy?: string;

    /**
     * Specifies whether the particular field value is disabled or not.
     *
     * @default 'disabled'
     */
    disabled?: string;

    /**
     * Specifies additional HTML attributes such as title, disabled, etc., to be applied to list items.
     *
     * @default -
     */
    htmlAttributes?: string;
}

/**
 * Specifies the event arguments for the filtering action triggered during user input.
 */
export interface FilterEvent {

    /**
     * Specifies to prevent the internal filtering action.
     *
     * @default false
     */
    preventDefaultAction: boolean;

    /**
     * Specifies the filter input change event arguments.
     */
    event: React.ChangeEvent<HTMLInputElement>;

    /**
     * Specifies the search text value.
     */
    text: string;
}

/**
 * Specifies the filter type used to compare the search text with list item values.
 *
 * - `StartsWith`: Matches items that begin with the entered text.
 * - `EndsWith`: Matches items that end with the entered text.
 * - `Contains`: Matches items that contain the entered text anywhere.
 */
export type FilterType = 'StartsWith' | 'EndsWith' | 'Contains';

/**
 * Specifies the event arguments for popup open and close actions in dropdown components.
 */
export interface PopupEvent {

    /**
     * Specifies the event that triggered the popup action.
     */
    event?: React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement> | Event;
}

/**
 * Specifies the event arguments triggered when a dropdown item is selected.
 */
export interface SelectEvent {

    /**
     * Specifies the selected item's data as a JSON object from the data source.
     */
    itemData: { [key: string]: unknown } | string | number | boolean | null;

    /**
     * Specifies the original event arguments.
     */
    event?: React.MouseEvent<Element> | React.KeyboardEvent<Element> | React.TouchEvent<Element> | undefined;
}

/**
 * Specifies the event arguments triggered when the selected value in the dropdown changes.
 */
export interface ChangeEvent {

    /**
     * Specifies the changed value.
     */
    value: number | string | boolean | object | null;

    /**
     * Specifies the previously selected list item.
     */
    previousItemData:
    | string
    | number
    | boolean
    | { [key: string]: unknown }
    | null;

    /**
     * Specifies the currently selected list item.
     */
    itemData:
    | string
    | number
    | boolean
    | { [key: string]: unknown }
    | null;

    /**
     * Specifies the original event arguments.
     */
    event: React.MouseEvent<Element> | React.KeyboardEvent<Element>;
}

/**
 * Specifies the event arguments for a data request triggered during data loading.
 */
export interface DataRequestEvent {

    /**
     * Specifies the dataSource, which can be an array of objects, DataManager, or primitive arrays.
     */
    data: { [key: string]: unknown }[] | DataManager | string[] | number[] | boolean[];

    /**
     * Specifies the query to retrieve data from the data source.
     */
    query: Query;
}

/**
 * Specifies the event arguments triggered after successful data fetch.
 */
export interface DataLoadEvent {

    /**
     * Specifies the dataSource, which can be an array of objects, DataManager, or primitive arrays.
     */
    data: { [key: string]: unknown }[] | DataManager | string[] | number[] | boolean[];
}

/**
 * @private
 */
export interface DropDownListProps extends validationProps {

    /**
     * Specifies popup-specific settings such as width, height, position, offsets, collision, z-index, and auto-reposition behavior.
     *
     * @default { width: '100%', height: '300px', zIndex: 1000 }
     */
    popupSettings?: PopupSettings;

    /**
     * Specifies whether to show a clear button in the DropDownList component. When enabled, a clear icon appears when a value is selected, allowing users to clear the selection.
     *
     * @default false
     */
    clearButton?: boolean | React.ReactNode;

    /**
     * Specifies the placeholder text that appears in the DropDownList when no item is selected.
     *
     * @default -
     */
    placeholder?: string;

    /**
     * Specifies the query to retrieve data from the data source. This is useful when working with DataManager for complex data operations.
     *
     * @default -
     */
    query?: Query;

    /**
     * Specifies the value to be selected in the DropDownList component. This can be a primitive value or an object based on the configured data binding.
     *
     * @default -
     */
    value?: number | string | boolean | object | null;

    /**
     * Specifies the data source for populating the dropdown items. Accepts various data formats including array of objects, primitive arrays, or DataManager.
     *
     * @default []
     */
    dataSource?: { [key: string]: unknown }[] | DataManager | string[] | number[] | boolean[] | unknown;

    /**
     * Specifies the mapping fields for text and value properties in the data source objects. Helps in binding complex data structures to the dropdown.
     *
     * @default { text: 'text', value: 'value', disabled: 'disabled', groupBy: 'groupBy' }
     */
    fields?: FieldSettingsModel;

    /**
     * Specifies whether to allow binding of complex objects as values instead of primitive values. When enabled, the entire object can be accessed in events.
     *
     * @default false
     */
    allowObjectBinding?: boolean;

    /**
     * Specifies whether the dropdown popup is open or closed.
     *
     * @default false
     */
    open?: boolean;

    /**
     * Specifies the default value of the DropDownList. Similar to the native select HTML element.
     *
     * @default -
     */
    defaultValue?: number | string | boolean | object | null;

    /**
     * Specifies whether disabled items in the DropDownList should be skipped during keyboard navigation. When set to true,
     * keyboard navigation will bypass disabled items, moving to the next enabled item in the list.
     *
     * @private
     * @default true
     */
    skipDisabledItems?: boolean;

    /**
     * Specifies the behavior of the floating label associated with the DropDownList input. Determines when and how the label appears.
     *
     * @default LabelMode.Never
     */
    labelMode?: LabelMode;

    /**
     * Specifies whether the DropDownList should ignore case while filtering or selecting items.
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
     * Specifies whether filtering should be allowed in the DropDownList.
     *
     * @default false
     */
    filterable?: boolean;

    /**
     * Specifies the type of filtering to be applied.
     *
     * @default 'StartsWith'
     */
    filterType?: FilterType;

    /**
     * Specifies the placeholder text to be shown in the filter bar of the DropDownList.
     *
     * @default -
     */
    filterPlaceholder?: string;

    /**
     * Specifies the sort order for the DropDownList items.
     *
     * @default SortOrder.None
     */
    sortOrder?: SortOrder;

    /**
     * Specifies whether the component is in loading state.
     * When true, a spinner icon replaces the default caret icon.
     *
     * @default false
     */
    loading?: boolean;

    /**
     * Specifies the size style of the dropdown list. Options include 'Small', 'Medium' and 'Large'.
     *
     * @default Size.Medium
     */
    size?: Size;

    /**
     * Specifies the variant style of the dropdown list. Options include 'Outlined', 'Filled', and 'Standard'.
     *
     * @default Variant.Standard
     */
    variant?: Variant;

    /**
     * Specifies additional HTML attributes to apply to the underlying input element. Values provided here can override default aria-* attributes set by the component.
     *
     */
    inputProps?: React.InputHTMLAttributes<HTMLInputElement>;

    /**
     * Specifies a custom SVG icon to be rendered in the Dropdown List input element.
     *
     * @default -
     */
    dropdownIcon?: React.ReactNode;

    /**
     * Specifies the debounce delay (in milliseconds) for filtering input.
     *
     * @default 0
     */
    debounceDelay?: number;

    /**
     * Specifies a custom template for rendering each item in the dropdown list, allowing for customized appearance of list items.
     *
     * @default -
     */
    itemTemplate?: Function | React.ReactNode;

    /**
     * Specifies a custom template for rendering the header section of the dropdown popup, enabling additional content above the item list.
     *
     * @default -
     */
    headerTemplate?: React.ReactNode;

    /**
     * Specifies a custom template for rendering the footer section of the dropdown popup, enabling additional content below the item list.
     *
     * @default -
     */
    footerTemplate?: React.ReactNode;

    /**
     * Specifies a custom template for rendering group header sections when items are categorized into groups in the dropdown list.
     *
     * @default -
     */
    groupTemplate?: Function | React.ReactNode;

    /**
     * Specifies a custom template for rendering the selected value in the input element, allowing for customized appearance of the selection.
     *
     * @default -
     */
    valueTemplate?: Function | React.ReactNode;

    /**
     * Specifies a custom template for the message displayed when no items match the search criteria or when the data source is empty.
     *
     * @default 'No Records Found'
     */
    noRecordsTemplate?: React.ReactNode;

    /**
     * Specifies a custom template to render when an error occurs in the Dropdown List.
     *
     * @default -
     */
    onErrorTemplate?: React.ReactNode;

    /**
     * Specifies an event that triggers when an item in the dropdown list is selected, providing details about the selected item.
     *
     * @event onSelect
     */
    onSelect?: (event: SelectEvent) => void;

    /**
     * Specifies an event that triggers when the selected value of the DropDownList changes, providing details about the new and previous values.
     *
     * @event onChange
     */
    onChange?: (event: ChangeEvent) => void;

    /**
     * Specifies an event that triggers when the dropdown popup opens, allowing for custom actions to be performed at that moment.
     *
     * @event onOpen
     */
    onOpen?: (event: PopupEvent) => void;

    /**
     * Specifies an event that triggers when the dropdown popup closes, allowing for custom actions to be performed at that moment.
     *
     * @event onClose
     */
    onClose?: (event: PopupEvent) => void;

    /**
     * Specifies an event that triggers when data fetching fails
     *
     * @event onError
     */
    onError?: (event: Error) => void;

    /**
     * Specifies an event that triggers on typing a character in the filter bar when the filtering is enabled.
     *
     * @event onFilter
     */
    onFilter?: (event: FilterEvent) => void;

    /**
     * Specifies an event that triggers before data is fetched.
     *
     * @event onDataRequest
     */
    onDataRequest?: (event: DataRequestEvent) => void;

    /**
     * Specifies an event that triggers after data is fetched successfully.
     *
     * @event onDataLoad
     */
    onDataLoad?: (event: DataLoadEvent) => void;
}
