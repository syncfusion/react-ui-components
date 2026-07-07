import { InputHTMLAttributes, ReactElement, ReactNode } from 'react';
import { DataManager, Query } from '@syncfusion/react-data';
import { LabelMode, SortOrder } from '@syncfusion/react-base';
import { ScrollEvent } from '@syncfusion/react-lists';
import { ResizeEvent } from '@syncfusion/react-popups';
import { T, FieldSettingsModel, FilterType, PopupSettings, DropdownVirtualProps, FilterEvent, DataRequestEvent, DataLoadEvent, PopupEvent, ChangeEvent } from '../drop-down-list/types';
import { MultiSelectCommonProps } from '../multi-select/types';
import { inputBaseProps, validationProps } from '@syncfusion/react-inputs';

export interface InputProps extends inputBaseProps {
    /**
     * Specifies the placeholder text that appears in the dropdown component when no item is selected.
     *
     * @default -
     */
    placeholder?: string;

    /**
     * Specifies whether to show a clear button in the dropdown component. When enabled, a clear icon appears when a value is selected, allowing users to clear the selection.
     *
     * @default false
     */
    clearButton?: boolean | ReactNode;

    /**
     * Specifies the behavior of the floating label associated with the dropdown component input. Determines when and how the label appears.
     *
     * @default 'Never'
     */
    labelMode?: LabelMode;

    /**
     * Specifies additional HTML attributes to apply to the underlying input element. Values provided here can override default aria-* attributes set by the component.
     *
     */
    inputProps?: InputHTMLAttributes<HTMLInputElement>;
}

export interface DropDownProps {

    /**
     * Specifies the data source for populating the dropdown items. Accepts various data formats including array of objects, primitive arrays, or DataManager.
     *
     * @default []
     */
    dataSource?: DataManager | T[];

    /**
     * Specifies the mapping fields for text and value properties in the data source objects. Helps in binding complex data structures to the dropdown.
     *
     * @default { text: 'text', value: 'value', disabled: 'disabled', groupBy: 'groupBy' }
     */
    fields?: FieldSettingsModel;

    /**
     * Specifies whether the dropdown popup is open or closed.
     *
     * @default false
     */
    open?: boolean;

    /**
     * Specifies whether the popup is defaultOpen (uncontrolled).
     *
     * @default false
     */
    defaultOpen?: boolean;

    /**
     * Specifies whether the component is in loading state.
     * When true, a spinner icon replaces the default caret icon.
     *
     * @default false
     */
    loading?: boolean;

    /**
     * Specifies the query to retrieve data from the data source. This is useful when working with DataManager for complex data operations.
     *
     * @default -
     */
    query?: Query;

    /**
     * Specifies the sort order for the dropdown component items.
     *
     * @default SortOrder.None
     */
    sortOrder?: SortOrder;

    /**
     * Specifies whether the dropdown component should ignore case while filtering or selecting items.
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
     * Specifies the type of filtering to be applied.
     *
     * @default 'StartsWith'
     */
    filterType?: FilterType;

    /**
     * Specifies whether to allow binding of complex objects as values instead of primitive values. When enabled, the entire object can be accessed in events.
     *
     * @default false
     */
    allowObjectBinding?: boolean;

    /**
     * Specifies the debounce delay (in milliseconds) for filtering input.
     *
     * @default 0
     */
    debounceDelay?: number;

    /**
     * Provides configuration options for enabling and managing virtualization
     * in the dropdown component. Virtualization enhances performance by
     * only rendering items that are currently visible in the viewport.
     *
     * @default -
     */
    virtualization?: DropdownVirtualProps;

    /**
     * Specifies whether disabled items in the dropdown component should be skipped during keyboard navigation. When set to true,
     * keyboard navigation will bypass disabled items, moving to the next enabled item in the list.
     *
     * @default true
     */
    skipDisabledItems?: boolean;

    /**
     * Specifies popup-specific settings such as width, height, position, offsets, collision, z-index, and auto-reposition behavior.
     *
     * @default { width: '100%', height: '300px', zIndex: 1000 }
     */
    popupSettings?: PopupSettings;

    /**
     * Specifies the maximum number of items that can be selected in multi-select mode (multiSelectable only).
     * When set to 0 or not specified, there is no limit on selections.
     * This property has no effect in single-select mode.
     *
     * @default 0
     */
    maximumSelectionLength?: number;

    /**
     * Specifies the value to enable popup resizing functionality.
     *
     * @default false
     */
    resizable?: boolean;

    /**
     * Specifies the event fired when resizing occurs (applicable when resizable is enabled).
     *
     * @event onResize
     */
    onResize?: (event: ResizeEvent) => void

    /**
     * Specifies a custom template for rendering each item in the dropdown component, allowing for customized appearance of list items.
     *
     * @default -
     */
    itemTemplate?: Function | ReactNode;

    /**
     * Specifies a custom template for rendering group header sections when items are categorized into groups in the dropdown component.
     *
     * @default -
     */
    groupTemplate?: Function | ReactNode;

    /**
     * Specifies a custom template for rendering the header section of the dropdown popup, enabling additional content above the item list.
     *
     * @default -
     */
    headerTemplate?: ReactNode;

    /**
     * Specifies a custom template for rendering the footer section of the dropdown popup, enabling additional content below the item list.
     *
     * @default -
     */
    footerTemplate?: ReactNode;

    /**
     * Specifies a custom template for the message displayed when no items match the search criteria or when the data source is empty.
     *
     * @default 'No Records Found'
     */
    noRecordsTemplate?: ReactNode;

    /**
     * Specifies a custom template to render when an error occurs in the dropdown component.
     *
     * @default -
     */
    onErrorTemplate?: ReactNode;

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

    /**
     * Specifies an event that triggers when the virtual scrolled.
     *
     * @event onScroll
     */
    onScroll?: (event: ScrollEvent) => void;

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

}

export interface DropDownFilterIconProps {
    /**
     * Specifies whether filtering is enabled in the dropdown component.
     *
     * @default false
     */
    filterable?: boolean;

    /**
     * Specifies a custom SVG icon to be rendered in the dropdown component input element.
     *
     * @default -
     */
    dropdownIcon?: ReactNode;
}

export interface DropDownSelectionProps {
    /**
     * Specifies the value to be selected in the dropdown component. This can be a primitive value or an object based on the configured data binding.
     *
     * @default -
     */
    value?: number | string | boolean | object | null;

    /**
     * Specifies the default value of the dropdown component. Similar to the native select HTML element.
     *
     * @default -
     */
    defaultValue?: T;

    /**
     * Specifies an event that triggers when the selected value of the dropdown component changes, providing details about the new and previous values.
     *
     * @event onChange
     */
    onChange?: (event: ChangeEvent) => void;
}

/**
 * Specifies the list item data before opening the popup in dropdown list component.
 *
 * @private
 */
export interface ListItemData {
    item: T;
    isDisabled: boolean;
    isHeader?: boolean;
}

/**
 * Props for the Dropdown component.
 *
 * @private
 */
export interface DropdownProps extends DropDownProps, DropDownFilterIconProps, DropDownSelectionProps,
    validationProps, InputProps, MultiSelectCommonProps {

    /**
     *Specifies whether the input field automatically fills with the first matching
     * suggestion during typing. The auto-filled portion appears highlighted.
     *
     * @default false
     */
    autofill?: boolean;

    /**
     * Specifies whether to highlight the matched search text within each suggestion.
     *
     * @default false
     */
    autoHighlight?: boolean;

    /** Specifies whether users can commit custom text values (not in the suggestion list) by pressing Enter.
     * When enabled, free-form input is accepted as a valid selection.
     *
     *@default false
     */
    customValue?: boolean;

    /**
     * Specifies a custom template for rendering the selected value in the input element, allowing for customized appearance of the selection.
     *
     * @default -
     */
    valueTemplate?: Function | ReactNode;

    /**
     * Specifies the placeholder text to be shown in the filter bar of the dropdown component.
     *
     * @default -
     */
    filterPlaceholder?: string;

    /**
     * Specifies the minimum number of characters required before suggestions appear.
     *
     * @default 0
     */
    minLength?: number;

    /**
     *Specifies the maximum number of suggestions to display.
     *
     *@default -
     */
    maxSuggestions?: number;

    /**
     * Specifies additional CSS class(es) to apply to the input element.
     *
     * @private
     * @default -
     */
    inputClassName?: string;

    /**
     * Localization component name used to resolve localized strings (e.g., placeholder).
     * When provided, L10n will use this key to lookup localized resources.
     *
     * @private
     * @default -
     */
    localeComponentName?: string;

    /**
     * Accessible label for the input element (mapped to aria-label).
     *
     * @private
     * @default -
     */
    ariaLabel?: string;

    /**
     * Specifies the component-specific CSS class(es) to apply to the root container of the dropdown.
     *
     * @private
     * @default -
     */
    componentClassName?: string;

    /**
     * Specifies whether clicking the span toggles/opens the popup.
     * When true, the input behaves like a span-click driven dropdown (input becomes readOnly for direct typing).
     *
     * @private
     * @default false
     */
    spanClickable?: boolean;

    /**
     * When true, force a filter call after the popup is actually mounted (useful for Autocomplete).
     * This avoids calling filter inside onOpen where DropDownPopup may not be mounted yet.
     *
     * @private
     */
    forceFilterOnOpen?: boolean;

    /**
     * Specifies whether dropdown is multi selectable
     *
     * @private
     */
    multiSelectable?: boolean

    /** Specifies the callback invoked when a custom value (not in the suggestion list)
     * is committed via Enter key. Receives the custom string value as a parameter.
     *
     * @event onCustomValueSelect
     */
    onCustomValueSelect?: (value: string) => void;

    /**
     * Specifies the value template multi selectable component.
     */
    multiSelectValueTemplate?: ((SelectedItems: T[]) => ReactNode);

    /**
     * Specifies the value template for editable dropdown components.
     */
    inputValueRenderer?: (rendering: ReactElement<HTMLInputElement>) => ReactNode;
}

