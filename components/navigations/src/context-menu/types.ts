import { RefObject } from 'react';
import { CommonMenuProps } from '../..';

/**
 * Specifies the absolute position of the component.
 */
export interface OffsetPosition {
    /**
     * Specifies the horizontal offset position.
     */
    left: number;

    /**
     * Specifies the vertical offset position.
     */
    top: number;
}

/**
 * Interface for ContextMenu component props.
 *
 * @private
 */
export interface ContextMenuProps extends CommonMenuProps {
    /**
     * Specifies the visibility of the ContextMenu.
     * If set to true, the ContextMenu is displayed. If false, it is hidden.
     *
     * @default -
     */
    open?: boolean;

    /**
     * Specifies the position (left/top coordinates) of the ContextMenu.
     * This determines where the menu will appear on the screen.
     *
     * @default -
     */
    offset?: OffsetPosition;

    /**
     * Specifies target element on which the ContextMenu should be opened. When provided, ContextMenu
     * events on this element will automatically trigger the context menu to appear at the cursor position.
     *
     * The standard contextmenu event is not supported on iOS devices, so this component automatically
     * implements a tapHold touch event handler when iOS is detected. This ensures consistent context menu
     * functionality across all platforms and devices. If you prefer to use your own event handling mechanism
     * or need different trigger behaviors, you can omit this prop and manually control menu display with
     * the `open` and `offset` props instead.
     *
     * @default -
     */
    targetRef?: RefObject<HTMLElement>;

    /**
     * Enables the browser's native context menu on `targetRef`
     * when the user holds Ctrl (Windows/Linux) or Cmd (macOS) and right-clicks, bypassing the custom ContextMenu
     *
     * @default false
     */
    allowBrowserContext?: boolean;

    /**
     * Specifies the container element where the ContextMenu should be rendered.
     * This allows the ContextMenu to be rendered within a specific DOM container.
     *
     * When using a custom container, ensure that the container creates a positioning context,
     * such as by setting `position: relative`.
     *
     * @default document.body
     */
    container?: HTMLElement;
}
