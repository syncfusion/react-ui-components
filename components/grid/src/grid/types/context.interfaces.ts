import { ContextMenu, MenuItemProps } from '@syncfusion/react-navigations';
import { ContextMenuItem } from './enum';
import { ColumnProps } from './column.interfaces';
import { ComponentProps, JSX } from 'react';

/**
 * Defines the arguments passed to context menu display functions.
 * Specifies the target element and positioning coordinates for rendering the context menu.
 * Used to control where and how the context menu appears in response to user interactions.
 */
export interface ContextMenuArgs {
    /**
     * Specifies the target HTML element on which the context menu is triggered.
     * Used as the reference point for context menu positioning and behavior.
     *
     * @type {HTMLElement}
     * @default -
     */
    target: HTMLElement;
    /**
     * Specifies the horizontal offset position (in pixels) for displaying the context menu.
     * Used to adjust the left position of the menu relative to the target element or viewport.
     *
     * @type {number}
     * @default undefined
     */
    left?: number;
    /**
     * Specifies the vertical offset position (in pixels) for displaying the context menu.
     * Used to adjust the top position of the menu relative to the target element or viewport.
     *
     * @type {number}
     * @default undefined
     */
    top?: number;
}

/**
 * Defines the reference interface for controlling the context menu panel component.
 * Provides methods to programmatically show and hide the context menu in response to user actions or application logic.
 * Used with useRef to obtain direct control over context menu visibility and positioning.
 */
export interface ContextMenuPanelRef {
    /**
     * Displays the context menu at the specified position or target element.
     * Accepts positioning arguments to control menu placement on the screen.
     *
     * @param {ContextMenuArgs} args - Arguments containing target element and optional position offsets
     * @returns {void}
     * @default -
     */
    showContextMenu(args: ContextMenuArgs): void;
    /**
     * Hides the currently displayed context menu.
     * Closes the context menu and removes it from the viewport without requiring additional parameters.
     *
     * @returns {void}
     * @default -
     */
    hideContextMenu(): void;
}

/**
 * Defines configuration settings for the context menu functionality in the grid.
 * Specifies whether the context menu is enabled, which items to display, and customization options.
 * Used to control context menu behavior, available actions, and appearance properties.
 */
export interface ContextMenuSettings {
    /**
     * Indicates whether the context menu feature is enabled in the grid.
     * When true, displays the context menu on right-click; when false, disables the feature.
     * Useful for conditional enabling/disabling context menu functionality based on application state.
     *
     * @type {boolean}
     * @default false
     */
    enabled?: boolean;
    /**
     * Specifies the context menu items to display when the context menu is triggered.
     * Supports both default built-in items (via `ContextMenuItem` type) and custom items (via `ContextMenuItemProps`).
     * Items determine which actions are available to users through the context menu.
     *
     * @type {(ContextMenuItem | ContextMenuItemProps)[]}
     * @default undefined
     */
    items?: (ContextMenuItem | ContextMenuItemProps)[];
    /**
     * Provides custom configuration properties for the underlying Syncfusion ContextMenu component.
     * Allows customization of menu appearance, behavior, animations, and other ContextMenu-specific settings.
     *
     * @type {Partial<ComponentProps<typeof ContextMenu>>}
     * @default undefined
     */
    menuSettings?: Partial<ComponentProps<typeof ContextMenu>>;
}

/**
 * Defines the properties for configuring individual context menu items in the grid.
 * Extends Syncfusion MenuItemProps to provide additional grid-specific customization.
 * Used to create custom context menu items with specialized behavior and targeting.
 */
export interface ContextMenuItemProps extends MenuItemProps {
    /**
     * Specifies the target element or context to which the menu item applies.
     * Used to define context-specific behavior, such as menu items appearing only for certain cell types or row states.
     *
     * @type {string}
     * @default undefined
     */
    target?: string;

    /**
     * Specifies the unique identifier for the context menu item.
     * Used to identify the menu item in event handlers and for custom logic.
     *
     * @type {string}
     * @default undefined
     */
    id?: string;

    /**
     * Specifies the icon to display for the context menu item.
     * Used to visually represent the menu item in the context menu interface.
     *
     * @type {JSX.Element}
     * @default undefined
     */
    icon?: JSX.Element;

    /**
     * Specifies the display text for the context menu item.
     * Used to label the menu item in the context menu interface.
     *
     * @type {string}
     */
    text?: string;

    /**
     * Specifies nested sub-items for creating hierarchical context menu structures.
     * Used to define sub-menus under parent menu items for organizing related actions.
     *
     * @type {ContextMenuItemProps[]}
     */
    items?: ContextMenuItemProps[]; // For nested menu items
}

/**
 * Defines the event arguments passed when the context menu is opened in the grid.
 * Provides context information about the menu trigger, available items, and associated row/column data.
 * Used in context menu event handlers to access information about the menu interaction.
 */
export interface ContextMenuOpenEvent<T = unknown> {
    /**
     * Indicates whether the context menu opening event should be cancelled.
     * Setting this to true prevents the context menu from displaying.
     * Used to conditionally suppress context menu display based on application logic or user permissions.
     *
     * @type {boolean}
     * @default false
     */
    cancel: boolean;
    /**
     * Contains the array of context menu items that will be displayed.
     * Includes both default items (via `ContextMenuItem`) and custom items (via `ContextMenuItemProps`).
     * Can be inspected or modified to dynamically control which menu items appear.
     *
     * @type {(ContextMenuItem | ContextMenuItemProps)[]}
     * @default -
     */
    items: (ContextMenuItem | ContextMenuItemProps)[];
    /**
     * Specifies the original DOM event that triggered the context menu opening.
     * Provides access to event details such as mouse position, target element, and event modifiers.
     * Useful for custom event handling or determining context menu trigger source.
     *
     * @type {Event}
     * @default undefined
     */
    event?: Event;
    /**
     * Contains the column configuration object for the column where the context menu was triggered.
     * Provides metadata such as field name, column type, and other column properties.
     * Enables context-aware menu item display and column-specific actions.
     *
     * @type {ColumnProps}
     * @default undefined
     */
    column?: ColumnProps;
    /**
     * Contains the complete data object for the row where the context menu was triggered.
     * Provides access to all field values in the row for row-specific menu actions.
     * Used to determine available menu items based on row data state or values.
     *
     * @type {T}
     * @default undefined
     */
    data?: T;
}

/**
 * Defines the types of parent context menu items that can have nested sub-items.
 * Specifies which built-in context menu items support hierarchical menu structures.
 *
 * @private
 * @type {string}
 * @default -
 */
export type ContextMenuParentItem = 'Select';
