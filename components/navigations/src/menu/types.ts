import { Orientation } from '@syncfusion/react-base';
import * as React from 'react';
import { MenuItemProps } from '../common/components';
import { MenuEffect, SubmenuRenderMode } from './menu';
export { Orientation };

/**
 * Interface for select event arguments when an item is selected from the Menu.
 */
export interface MenuSelectEvent {

    /**
     * Specifies the current item data
     */
    item: MenuItemProps

    /**
     * Specifies the React synthetic event triggered by the user interaction.
     *
     * @default -
     */
    event?: React.SyntheticEvent;
}

/**
 * Interface for Menu animation settings that controls how the menu appears.
 */
export interface MenuAnimationProps {
    /**
     * Specifies the effect shown in the Menu transform.
     * The possible effects are:
     * * None: Specifies the Menu transform with no animation effect.
     * * SlideDown: Specifies the Menu transform with slide down effect.
     * * ZoomIn: Specifies the Menu transform with zoom in effect.
     * * FadeIn: Specifies the Menu transform with fade in effect.
     *
     * @default 'FadeIn'
     */
    effect?: MenuEffect;

    /**
     * Specifies the time duration in milliseconds for the transform animation.
     *
     * @default 400
     */
    duration?: number;

    /**
     * Specifies the easing effect applied during the transform animation.
     *
     * @default 'ease'
     */
    easing?: string;
}

/**
 * Interface for common menu props shared by menu-like components.
 *
 * @private
 */
export interface CommonMenuProps {
    /**
     * Specifies whether to show the sub menu on click instead of hover.
     * When set to true, the sub menu will open only on mouse click rather than on hover.
     *
     * @default false
     */
    itemOnClick?: boolean;

    /**
     * Specifies the delay time in milliseconds before opening the submenu when hovering.
     *
     * @default 0
     */
    hoverDelay?: number;

    /**
     * Specifies the animation settings for the Menu open.
     *
     * @default { duration: 400, easing: 'ease', effect: 'FadeIn' }
     */
    animation?: MenuAnimationProps;

    /**
     * Specifies whether to close the Menu when the document is scrolled.
     * When set to true, scrolling the page will automatically close the menu.
     *
     * @default true
     */
    closeOnScroll?: boolean;

    /**
     * Specifies the callback function that triggers before open the Menu.
     *
     * @event onOpen
     */
    onOpen?: (event: Event) => void;

    /**
     * Specifies the callback function that triggers before closing the Menu.
     *
     * @event onClose
     */
    onClose?: (event: Event) => void;

    /**
     * Specifies the callback function that triggers when selecting a Menu item.
     *
     * @event onSelect
     */
    onSelect?: (event: MenuSelectEvent) => void;
}

export interface SubmenuType {
    parentIndex: number[];
    position: { x: number; y: number };
    isVisible: boolean;
    currentTarget: HTMLElement;
    positionChanged?: boolean;
}

export interface FocusHoverState {
    focusedItems: number[] | null;
    hoveredItems: number[] | null;
}

/**
 * Interface for Menu component props.
 *
 * @private
 */
export interface MenuProps extends CommonMenuProps {

    /**
     * Specifies the orientation of the menu layout.
     *
     * @default 'Orientation.Horizontal'
     */
    orientation?: Orientation;

    /**
     * Specifies where the submenu should be mounted in the DOM.
     * - 'inline': Submenu is rendered inline within the parent menu item
     * - 'portal': Submenu is rendered in the document body
     *
     * @default 'inline'
     */
    submenuRenderMode?: SubmenuRenderMode
}
