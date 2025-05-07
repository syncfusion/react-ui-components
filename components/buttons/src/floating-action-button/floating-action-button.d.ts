import { ButtonHTMLAttributes } from 'react';
import { IconPosition, Color, Size } from '../button/button';
import * as React from 'react';
/**
 * Defines the position of FAB (Floating Action Button) in target.
 */
export declare enum FabPosition {
    /**
     * Positions the FAB at the target's top left corner.
     */
    TopLeft = "TopLeft",
    /**
     * Places the FAB on the top-center position of the target.
     */
    TopCenter = "TopCenter",
    /**
     * Positions the FAB at the target's top right corner.
     */
    TopRight = "TopRight",
    /**
     * Positions the FAB in the middle of target's left side.
     */
    MiddleLeft = "MiddleLeft",
    /**
     * Positions the FAB in the center of target.
     */
    MiddleCenter = "MiddleCenter",
    /**
     * Positions the FAB in the middle of target's right side.
     */
    MiddleRight = "MiddleRight",
    /**
     * Positions the FAB at the target's bottom left corner.
     */
    BottomLeft = "BottomLeft",
    /**
     * Places the FAB on the bottom-center position of the target.
     */
    BottomCenter = "BottomCenter",
    /**
     * Positions the FAB at the target's bottom right corner.
     */
    BottomRight = "BottomRight"
}
export interface FabButtonProps {
    /**
     * Specifies the position of the Floating Action Button (FAB) relative to its target element. Options may include positions such as top-left, top-right, bottom-left, and bottom-right.
     *
     * @default FabPosition.BottomRight
     */
    position?: FabPosition;
    /**
     * Determines the visibility of the Floating Action Button. When `true`, the FAB is visible; when `false`, it is hidden.
     *
     * @default true
     */
    visible?: boolean;
    /**
     * Enables toggle behavior for the FAB. If `true`, the FAB will act as a toggle button, changing state on each click.
     *
     * @default false
     */
    togglable?: boolean;
    /**
     * Defines an icon for the button, which can either be a CSS class name for custom styling or an SVG element for rendering.
     *
     * @default -
     */
    icon?: string | React.ReactNode;
    /**
     * Defines the position of the icon relative to the text on the FAB. Options may include 'Left', 'Right', 'Top', or 'Bottom'.
     *
     * @default IconPosition.Left
     */
    iconPosition?: IconPosition;
    /**
     * Specifies the Color style of the FAB button. Options include 'Primary', 'Secondary', 'Warning', 'Success', 'Danger', and 'Info'.
     *
     * @default Color.Primary
     */
    color?: Color;
    /**
     * Specifies the size style of the FAB button. Options include 'Small', 'Medium' and 'Large'.
     *
     * @default Size.Medium
     */
    size?: Size;
}
export interface IFabButton extends FabButtonProps {
    /**
     * This is button component element.
     *
     * @private
     * @default null
     */
    element?: HTMLElement | null;
}
type IFabProps = FabButtonProps & ButtonHTMLAttributes<HTMLButtonElement>;
/**
 * The Floating Action Button (FAB) component offers a prominent primary action for an application interface, prominently positioned and styled to stand out with custom icon support.
 *
 * ```typescript
 * <Fab color={Color.Success} position={FabPosition.BottomLeft}>FAB</Fab>
 * ```
 */
export declare const Fab: React.ForwardRefExoticComponent<IFabProps & React.RefAttributes<IFabButton>>;
declare const _default: React.NamedExoticComponent<FabButtonProps & ButtonHTMLAttributes<HTMLButtonElement> & React.RefAttributes<IFabButton>>;
export default _default;
