import * as React from 'react';
import { calculatePosition, calculateRelativeBasedPosition } from '../common/position';
import { AnimationOptions } from '@syncfusion/react-base';
import { flip, fit, isCollide } from '../common/collision';
/**
 * PositionAxis type.
 */
export interface PositionAxis {
    /**
     * Specifies position on the X-Axis, accepts string or number.
     *
     * @default 'left'
     */
    X?: string | number;
    /**
     * Specifies position on the Y-Axis, accepts string or number.
     *
     * @default 'top'
     */
    Y?: string | number;
}
/**
 * Collision Axis.
 */
export interface CollisionAxis {
    /**
     * specify the collision handler for a X-Axis.
     *
     * @default CollisionType.None
     */
    X?: CollisionType;
    /**
     * specify the collision handler for a Y-Axis.
     *
     * @default CollisionType.None
     */
    Y?: CollisionType;
}
/**
 * Defines the available collision handling types for popup positioning.
 */
export declare enum CollisionType {
    /**
     * No collision handling - the popup will maintain its original position
     * regardless of viewport boundaries.
     */
    None = "None",
    /**
     * Flip collision handling - the popup will flip to the opposite side of its
     * anchor element when it would otherwise extend beyond viewport boundaries.
     */
    Flip = "Flip",
    /**
     * Fit collision handling - the popup will be adjusted to fit within the viewport
     * boundaries while maintaining its original side relative to the anchor element.
     */
    Fit = "Fit"
}
/**
 * Defines how the popup should behave when scroll events occur in the parent container.
 */
export declare enum ActionOnScrollType {
    /**
     * The popup will recalculate and update its position to maintain proper alignment
     * with the target element when scrolling occurs.
     */
    Reposition = "Reposition",
    /**
     * The popup will be hidden when scrolling occurs in the parent container,
     * helping to improve performance or prevent UI clutter during scrolling.
     */
    Hide = "Hide",
    /**
     * The popup will not respond to scroll events and will maintain its absolute
     * position on the page regardless of scrolling.
     */
    None = "None"
}
/**
 * Defines the possible reference types for positioning a popup element.
 */
export declare enum TargetType {
    /**
     * Uses the immediate container element as the reference for positioning.
     * The popup will be positioned relative to its parent container element.
     */
    Container = "Container",
    /**
     * Uses a custom specified element as the reference for positioning.
     * The popup will be positioned relative to this specified element.
     */
    Relative = "Relative",
    /**
     * Uses the document body as the reference for positioning.
     * The popup will be positioned relative to the document body, allowing it to be
     * placed anywhere on the page regardless of parent container boundaries.
     */
    Body = "Body"
}
export interface PopupProps {
    /**
     * Controls whether the component is in open/expanded state.
     *
     * When true, the component will be displayed in its open state.
     * When false, the component will be in its closed or collapsed state.
     * If not provided, the component will use its default closed state.
     *
     * @default false
     */
    isOpen?: boolean;
    /**
     * Specifies the relative element type of the component.
     *
     * @default TargetType.Container
     */
    targetType?: TargetType;
    /** Reference to the target element to which the popup is anchored. */
    targetRef?: React.RefObject<HTMLElement>;
    /** Defines the X and Y position of the popup relative to the target element.
     *
     * @default {X:'left', Y:'top'}
     */
    position?: PositionAxis;
    /** Horizontal offset for positioning the popup.
     *
     * @default 0
     */
    offsetX?: number;
    /** Vertical offset for positioning the popup.
     *
     * @default 0
     */
    offsetY?: number;
    /** Object defining the collision handling on X and Y axis.
     *
     * @default { X: CollisionType.None, Y: CollisionType.None }
     */
    collision?: CollisionAxis;
    /**
     * specifies the animation that should happen when popup open.
     *
     * @default 'null'
     */
    showAnimation?: AnimationOptions;
    /**
     * specifies the animation that should happen when popup closes.
     *
     * @default 'null'
     */
    hideAnimation?: AnimationOptions;
    /**
     * Specifies the relative container element of the popup element.Based on the relative element, popup element will be positioned.
     *
     * @default 'body'
     */
    relateTo?: HTMLElement | string;
    /** Reference to an optional viewport element for collision detection.
     *
     * @default null
     */
    viewPortElementRef?: React.RefObject<HTMLElement>;
    /** Defines the popup relate's element when opening the popup.
     *
     * @default null
     */
    relativeElement?: HTMLElement | null;
    /** Z-index of the popup to manage stacking context.
     *
     * @default 1000
     */
    zIndex?: number;
    /** Optional width of the popup.
     *
     * @default 'auto'
     */
    width?: string | number;
    /** Optional height of the popup.
     *
     * @default 'auto'
     */
    height?: string | number;
    /** Defines the behavior when the parent container is scrolled.
     *
     * @default ActionOnScrollType.Reposition
     */
    actionOnScroll?: ActionOnScrollType;
    /** Callback invoked when the popup is opened.
     *
     * @event onOpen
     * @default null
     */
    onOpen?: () => void;
    /** Callback invoked when the popup is closed.
     *
     * @event onClose
     * @default null
     */
    onClose?: () => void;
    /** Callback invoked when the target element exits the viewport.
     *
     * @event onTargetExitViewport
     * @default null
     */
    onTargetExitViewport?: () => void;
}
export interface IPopup extends IPopupProps {
    /**
     * Identifies all scrollable parent elements of a given element.
     *
     * @param {HTMLElement} element - The element for which to find scrollable parents
     * @returns {Element[]} An array of scrollable parent elements that will have scroll event listeners attached
     */
    getScrollableParent?: (element: HTMLElement) => Element[];
    /**
     * Refreshes the popup's position based on the relative element and offset values.
     *
     * @param {HTMLElement} [target] - Optional target element to use as reference for positioning
     * @param {boolean} [collision] - Optional flag to determine whether collision detection should be performed
     * @returns {void}
     */
    refreshPosition?: (target?: HTMLElement, collision?: boolean) => void;
    /**
     * This is Popup component element.
     *
     * @private
     * @default null
     */
    element?: HTMLElement | null;
}
type IPopupProps = PopupProps & Omit<React.InputHTMLAttributes<HTMLDivElement>, keyof PopupProps>;
/**
 * Popup component for displaying content in a floating container positioned relative to a target element.
 *
 * ```typescript
 * <Popup
 *   isOpen={true}
 *   relateTo={elementRef}
 *   position={{ X: 'left', Y: 'bottom' }}
 * >
 *   <div>Popup content</div>
 * </Popup>
 * ```
 */
export declare const Popup: React.ForwardRefExoticComponent<IPopupProps & React.RefAttributes<IPopup>>;
declare const _default: React.NamedExoticComponent<PopupProps & Omit<React.InputHTMLAttributes<HTMLDivElement>, keyof PopupProps> & React.RefAttributes<IPopup>>;
export default _default;
export { calculatePosition, calculateRelativeBasedPosition, flip, fit, isCollide, getZindexPartial, getFixedScrollableParent };
/**
 * Gets the maximum z-index of the given element.
 *
 * @returns {void}
 * @param { HTMLElement } element - Specify the element to get the maximum z-index of it.
 * @private
 */
declare function getZindexPartial(element: HTMLElement): number;
/**
 * Gets scrollable parent elements for the given element.
 *
 * @param {HTMLElement} element - The element to get the scrollable parents of.
 * @param {boolean} [fixedParent] - Whether to include fixed-positioned parents.
 * @returns {HTMLElement[]} An array of scrollable parent elements.
 */
declare function getFixedScrollableParent(element: HTMLElement, fixedParent?: boolean): HTMLElement[];
