import { ButtonHTMLAttributes } from 'react';
import { IconPosition, Color, Size, Variant } from '@syncfusion/react-buttons';
import { AnimationOptions } from '@syncfusion/react-base';
import * as React from 'react';
/**
 * ItemModel interface defines properties for each dropdown item.
 */
interface ItemModel {
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
 * Interface representing the event arguments for item selection in dropdown components.
 */
export interface SelectMenuEvent {
    /**
     * The original mouse event that triggered the selection.
     * Contains information about the click event on the list item.
     */
    event: React.MouseEvent<HTMLLIElement, MouseEvent>;
    /**
     * The data object representing the selected item.
     * Contains properties like id, text, icon, and other attributes of the selected item.
     */
    item: ItemModel;
}
/**
 * DropDownButtonProps interface defines properties for DropDownButton component.
 */
export interface DropDownButtonProps {
    /**
     * Defines class/multiple classes separated by a space for the DropDownButton that is used to include an icon. DropDownButton can also include font icon and sprite image.
     *
     * @default -
     */
    icon?: string | React.ReactNode;
    /**
     * Specifies the position of the icon relative to the dropdownbutton text. Options include placing the icon at the left, right, top, or bottom of the button content.
     *
     * @default {IconPosition.Left}
     */
    iconPosition?: IconPosition;
    /**
     * Specifies action items with their properties to render as a popup in the DropDownButton.
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
     * Controls whether the popup element is created upon clicking open. When set to `true`, the popup is created on click.
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
     * Specifies the animation settings for opening the dropdown.
     * The settings control the duration, easing, and effect of the animation applied when the dropdown opens.
     *
     * @default { effect: 'SlideDown', duration: 400, easing: 'ease' }
     * @private
     */
    animation?: AnimationOptions;
    /**
     * Triggers while closing the DropDownButton popup.
     *
     * @event close
     */
    onClose?: (event?: React.MouseEvent | MouseEvent) => void;
    /**
     * Triggers while opening the DropDownButton popup.
     *
     * @event open
     */
    onOpen?: (event?: React.MouseEvent | MouseEvent) => void;
    /**
     * Triggers while selecting action item in DropDownButton popup.
     *
     * @event select
     */
    onSelect?: (args: SelectMenuEvent) => void;
    /**
     * Specifies the color style of the Dropdown button. Options include 'Primary', 'Secondary', 'Warning', 'Success', 'Danger' and 'Info'.
     *
     * @default Color.Primary
     */
    color?: Color;
    /**
     * Specifies the variant style of the Dropdown button. Options include 'Outlined', 'Filled' and 'Flat'.
     *
     * @default Variant.Filled
     */
    variant?: Variant;
    /**
     * Specifies the size style of the Dropdown button. Options include 'Small', 'Medium' and 'Large'.
     *
     * @default Size.Medium
     */
    size?: Size;
    /**
     * Specifies the relative container element of the dropdown popup element.Based on the relative element, popup element will be positioned.
     *
     * @default 'body'
     * @private
     */
    relateTo?: HTMLElement | string;
}
/**
 * Interface representing the Button component methods.
 */
export interface IDropDownButton extends DropDownButtonProps {
    /**
     * To open/close DropDownButton popup based on current state of the DropDownButton.
     *
     * @public
     * @returns {void}
     */
    toggle?(): void;
    /**
     * This is button component element.
     *
     * @private
     * @default null
     */
    element?: HTMLElement | null;
}
type IDropDownButtonProps = IDropDownButton & ButtonHTMLAttributes<HTMLButtonElement>;
/**
 * The DropDownButton component is an interactive button that reveals a menu of actions or options when clicked, providing a dropdown interface for intuitive user interaction.
 *
 * ```typescript
 * <DropDownButton items={menuItems} icon={profileIcon} iconPosition={IconPosition.Right}/>
 * ```
 */
export declare const DropDownButton: React.ForwardRefExoticComponent<IDropDownButtonProps & React.RefAttributes<IDropDownButton>>;
declare const _default: React.NamedExoticComponent<IDropDownButton & ButtonHTMLAttributes<HTMLButtonElement> & React.RefAttributes<IDropDownButton>>;
export default _default;
