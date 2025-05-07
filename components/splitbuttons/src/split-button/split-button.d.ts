import { ButtonHTMLAttributes } from 'react';
import { IconPosition, Color, Size, Variant } from '@syncfusion/react-buttons';
import { SelectMenuEvent } from '../dropdown-button/dropdown-button';
import * as React from 'react';
/**
 * ItemModel interface defines properties for each dropdown item.
 */
export interface ItemModel {
    /**
     * Defines class/multiple classes separated by a space for the item that is used to include an icon.
     * Action item can include font icon and sprite image.
     *
     * @default -
     */
    icon?: string | React.ReactNode;
    /**
     * Specifies the id for item.
     *
     * @default -
     */
    id?: string;
    /**
     * Specifies separator between the items. Separator are horizontal lines used to group action items.
     *
     * @default false
     */
    hasSeparator?: boolean;
    /**
     * Specifies text for item.
     *
     * @default -
     */
    text?: string;
    /**
     * Specifies url for item that creates the anchor link to navigate to the url provided.
     *
     * @default -
     */
    url?: string;
    /**
     * Used to enable or disable the item.
     *
     * @default false
     */
    disabled?: boolean;
}
/**
 * SplitButtonProps interface defines properties for SplitButton component.
 */
export interface SplitButtonProps {
    /**
     * Defines an icon for the button, which can either be a CSS class name for custom styling or an SVG element for rendering.
     *
     * @default -
     */
    icon?: string | React.ReactNode;
    /**
     * Specifies the position of the icon relative to the dropdownbutton text. Options include placing the icon at the left, right, top, or bottom of the button content.
     *
     * @default 'Left'
     */
    iconPosition?: IconPosition;
    /**
     * Specifies action items with its properties which will be rendered as SplitButton secondary button popup.
     *
     * @default []
     */
    items?: ItemModel[];
    /**
     * This property defines the width of the dropdown popup for the DropDownButton component.
     *
     * @property {string | number} popupWidth - A string or number representing the width of the dropdown.
     * It can be a valid CSS unit such as `px`, `%`, or `rem`, or a number interpreted as pixels.
     * @default "auto"
     * @remarks
     * The `popupWidth` property allows developers to control the width of the dropdown popup, ensuring it fits their design requirements.
     * The default value of `auto` allows the popup to adjust based on the content length, but a specific width can be provided for more precise control.
     */
    popupWidth?: string | number;
    /**
     * Specifies the popup element creation on open.
     *
     * @default false
     */
    lazyOpen?: boolean;
    /**
     * Allows the specification of the target element for the DropDownButton's popup content.
     *
     * @default -
     */
    target?: React.RefObject<HTMLElement>;
    /**
     * Provides a template for displaying content within the dropdown items.
     *
     * @default null
     */
    itemTemplate?: string | Function;
    /**
     * Specifies the color style of the SplitButton. Options include 'Primary', 'Secondary', 'Warning', 'Success', 'Danger' and 'Info'.
     *
     * @default Color.Primary
     */
    color?: Color;
    /**
     * Specifies the variant style of the SplitButton. Options include 'Outlined', 'Filled' and 'Flat'.
     *
     * @default Variant.Filled
     */
    variant?: Variant;
    /**
     * Specifies the size style of the SplitButton. Options include 'Small', 'Medium' and 'Large'.
     *
     * @default Size.Medium
     */
    size?: Size;
    /**
     * Event triggered while closing the SplitButton popup.
     *
     * @event close
     */
    onClose?: (event?: React.MouseEvent | MouseEvent) => void;
    /**
     * Event triggered while opening the SplitButton popup.
     *
     * @event open
     */
    onOpen?: (event?: React.MouseEvent | MouseEvent) => void;
    /**
     * Event triggered while selecting an action item in SplitButton popup.
     *
     * @event select
     */
    onSelect?: (args: SelectMenuEvent) => void;
}
/**
 * Interface representing the Button component methods.
 */
export interface ISplitButton extends SplitButtonProps {
    /**
     * This is Splitbutton component element.
     *
     * @private
     * @default null
     */
    element?: HTMLElement | null;
    /**
     * To open/close SplitButton popup based on current state of the SplitButton.
     *
     * @public
     * @returns {void}
     */
    toggle?(): void;
}
type ISplitButtonProps = ISplitButton & ButtonHTMLAttributes<HTMLButtonElement>;
/**
 * The SplitButton component provides a combination of a default button action and a dropdown menu, enabling users to quickly access additional options or actions in a compact interface.
 *
 * ```typescript
 * <SplitButton items={menuItems} icon={profileIcon} iconPosition={IconPosition.Right}>Default Action</SplitButton>
 * ```
 */
export declare const SplitButton: React.ForwardRefExoticComponent<ISplitButtonProps & React.RefAttributes<ISplitButton>>;
export default SplitButton;
