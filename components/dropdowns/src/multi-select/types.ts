import { DropDownProps, DropDownFilterIconProps, InputProps } from '../common/types';
import { T } from '../drop-down-list/types';
import { validationProps } from '@syncfusion/react-inputs';

/**
 * Specifies how selected items are rendered in the MultiSelect component.
 */
export enum DisplayMode {
    /**
     * Specifies that selected items are rendered as chips with close buttons.
     */
    Box = 'Box',

    /**
     * Specifies that selected items are rendered as comma-separated text.
     */
    Delimiter = 'Delimiter',

    /**
     * Specifies the default display mode: renders selected values as Box while the component is focused and as Delimiter when the component loses focus.
     */
    Auto = 'Auto'
}

/**
 * Specifies the event arguments triggered when the selected value in the dropdown changes.
 */
export interface MultiSelectChangeEvent {

    /**
     * Specifies the changed value.
     */
    value: T[];

    /**
     * Specifies the previously selected list item.
     */
    previousItemData: T;

    /**
     * Specifies the currently selected list item.
     */
    itemData: T;

    /**
     * Specifies the original event arguments.
     */
    event: React.SyntheticEvent;
}

/**
 * Specifies the event arguments triggered when the chip is clicked.
 */
export interface ChipClickEvent {

    /**
     * Specifies the currently selected list item.
     */
    itemData: T;

    /**
     * Specifies the original event arguments.
     */
    event: React.MouseEvent<HTMLDivElement>;
}

/**
 * Specifies the event arguments triggered when Select All checkbox is toggled.
 */
export interface SelectAllEvent {

    /**
     * Specifies the selected items after the select all action.
     */
    selectedItems: T[];

    /**
     * Specifies the original event that triggered the select all action.
     */
    event: React.SyntheticEvent;
}

/**
 * Common display and interaction props for MultiSelect.
 *
 * @private
 */
export interface MultiSelectCommonProps {
    /**
     * Specifies the display mode for selected items (Box/Delimiter/Default).
     *
     * @default DisplayMode.Auto
     */
    mode?: DisplayMode;

    /**
     * Specifies the character that separates tags in delimiter mode.
     *
     * @default ','
     */
    delimiterChar?: string;

    /**
     * Specifies whether to enable checkbox for selecting multiple values.
     *
     * @default false
     */
    checkbox?: boolean;

    /**
     * Specifies whether the dropdown closes after item selection.
     *
     * @default false
     */
    closeOnSelect?: boolean;

    /**
     * Specifies whether to open dropdown on input click.
     *
     * @default true
     */
    openOnClick?: boolean;

    /**
     * Specifies the maximum number of items that can be selected.
     * When set to 0 or not specified, there is no limit on selections.
     *
     * @default 0
     */
    maximumSelectionLength?: number;

    /**
     * Specifies a custom template for selected chips.
     *
     * @default -
     */
    chipTemplate?: (Item: T) => React.ReactNode;

    /**
     * Specifies whether to hide selected items from the suggestion list.
     *
     * @default false
     */
    hideSelectedItem?: boolean;

    /**
     * Specifies whether typed text converts to tags when focus exits the input area.
     *
     * @default false
     */
    addTagOnBlur?: boolean;

    /**
     * Specifies the text displayed for the bulk selection option in the dropdown header.
     *
     * @default 'Select All'
     */
    selectAllText?: React.ReactNode;

    /**
     * Specifies the text displayed for clearing all selections in the dropdown header.
     *
     * @default 'Unselect All'
     */
    unSelectAllText?: React.ReactNode;

    /**
     * Specifies whether to display bulk selection controls in the dropdown header.
     * When enabled, shows options to select/deselect all items at once.
     *
     * @default false
     */
    showSelectAll?: boolean;

    /**
     * Specifies whether selected items are grouped at the top of the dropdown list
     * when checkbox selection is enabled.
     *
     * @default false
     */
    enableSelectionOrder?: boolean;

    /**
     * Specifies whether group headers display a checkbox allowing users to select or unselect all items within that group.
     *
     * @default false
     */
    enableGroupedCheckBox?: boolean;

    /**
     * Specifies the event fired when all items are selected or deselected using `SelectAll` option.
     *
     * @event onSelectAll
     */
    onSelectAll?: (event: SelectAllEvent) => void;

    /**
     * Specifies the event fired when a chip (tag) is selected.
     *
     * @event onChipClick
     */
    onChipClick?: (args: ChipClickEvent) => void;

    /**
     * Specifies the event fired when each chip item is removed from the input.
     *
     * @event onChipDelete
     */
    onChipDelete?: (item: T) => void;
}

/**
 * Props for the MultiSelect component
 *
 */
export interface MultiSelectProps extends DropDownProps, DropDownFilterIconProps, validationProps, InputProps, MultiSelectCommonProps {
    /**
     * Specifies the array of selected values in controlled mode.
     *
     * @default -
     */
    value?: T[];

    /**
     * Specifies the initial selected values for uncontrolled mode.
     *
     * @default -
     */
    defaultValue?: T[];

    /** Specifies whether users can commit custom text values (not in the suggestion list) by pressing Enter.
     * When enabled, free-form input is accepted as a valid selection.
     *
     * @default false
     */
    customValue?: boolean;

    /**
     * Specifies a custom template for rendering the selected value in the input element, allowing for customized appearance of the selection.
     *
     * @default -
     */
    valueTemplate?: (SelectedItems: T[]) => React.ReactNode;

    /**
     * Specifies an event that triggers when the selected value of the dropdown component changes, providing details about the new and previous values.
     *
     * @event onChange
     */
    onChange?: (args: MultiSelectChangeEvent) => void;

    /** Specifies the callback invoked when a custom value (not in the suggestion list)
     * is committed via Enter key. Receives the custom string value as a parameter.
     *
     * @event onCustomValueSelect
     */
    onCustomValueSelect?: (value: string) => void;
}

