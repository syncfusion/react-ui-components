import { ReactNode, type MouseEvent, type KeyboardEvent, type ChangeEvent as ReactChangeEvent } from 'react';
import { DataManager, Query } from '@syncfusion/react-data';
import { Size, LabelMode, Variant, SortOrder, HorizontalAlignment } from '@syncfusion/react-base';
import { VirtualizationProps, ScrollEvent } from '@syncfusion/react-lists';
import { CollisionAxis, PositionAxis, CollisionType, ResizeEvent } from '@syncfusion/react-popups';
import { validationProps } from '@syncfusion/react-inputs';
import { DropDownProps, DropDownFilterIconProps, DropDownSelectionProps, InputProps } from '../common/types';
export { LabelMode, Variant, Size, ScrollEvent, SortOrder, PositionAxis, CollisionAxis, CollisionType, ResizeEvent, HorizontalAlignment };

/**
 * Specifies a datasource item type.
 */
export type T = number | string | boolean | object | { [key: string]: unknown; };

/**
 * Specifies the scroll mode used by virtualization for remote data.
 */
export enum ScrollMode {
    /**
     * Specifies that only data for the visible viewport is fetched from the server.
     *
     * @default 'FetchViewPort'
     */
    FetchViewPort = 'FetchViewPort',
    /**
     * Specifies that the entire dataset is fetched in a single request.
     *
     * @default 'FetchAll'
     */
    FetchAll  = 'FetchAll'
}

export interface DropdownVirtualProps extends VirtualizationProps {
    /**
     * Specifies the scroll mode for virtualization. This property applies only for remote data.
     * When using DataManager, scrollMode determines whether data is fetched for the current viewport (ScrollMode.FetchViewPort)
     * or a full fetch is performed (ScrollMode.FetchAll).
     *
     * @default ScrollMode.FetchAll
     */
    scrollMode?: ScrollMode;
}

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
    event: ReactChangeEvent<HTMLInputElement>;

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
     * @default -
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
 * Specifies the event arguments triggered after successful data fetch.
 */
export interface DataLoadEvent {

    /**
     * Specifies the dataSource, which can be an array of objects, DataManager, or primitive arrays.
     */
    data: DataManager | T[];
}

/**
 * Specifies the event arguments for a data request triggered during data loading.
 */
export interface DataRequestEvent {

    /**
     * Specifies the dataSource, which can be an array of objects, DataManager, or primitive arrays.
     */
    data: DataManager | T[];

    /**
     * Specifies the query to retrieve data from the data source.
     */
    query: Query;
}

/**
 * Specifies the event arguments for popup open and close actions in dropdown components.
 */
export interface PopupEvent {

    /**
     * Specifies the event that triggered the popup action.
     */
    event?: MouseEvent<HTMLElement> | KeyboardEvent<HTMLElement> | Event;
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
    previousItemData: T | null;

    /**
     * Specifies the currently selected list item.
     */
    itemData: T | null;

    /**
     * Specifies the original event arguments.
     */
    event: MouseEvent<Element> | KeyboardEvent<Element> | ReactChangeEvent<HTMLInputElement>;
}

/**
 * @private
 */
export interface DropDownListProps extends DropDownProps, DropDownFilterIconProps, DropDownSelectionProps, validationProps, InputProps {

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
}
