import { RefObject } from 'react';

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
     * Specifies the collision handler for a X-Axis.
     *
     * @default CollisionType.None
     */
    X?: CollisionType;
    /**
     * Specifies the collision handler for a Y-Axis.
     *
     * @default CollisionType.None
     */
    Y?: CollisionType;
}

/**
 * Defines the available collision handling types for popup positioning.
 */
export enum CollisionType {
    /**
     * No collision handling - the popup will maintain its original position
     * regardless of viewport boundaries.
     */
    None = 'None',

    /**
     * Flip collision handling - the popup will flip to the opposite side of its
     * anchor element when it would otherwise extend beyond viewport boundaries.
     */
    Flip = 'Flip',

    /**
     * Fit collision handling - the popup will be adjusted to fit within the viewport
     * boundaries while maintaining its original side relative to the anchor element.
     */
    Fit = 'Fit'
}

/**
 * Specifies the popup settings.
 */
export interface PopupSettings {
    /**
     * Specifies the X and Y position of the popup relative to the target element.
     *
     * @default {X:'left', Y:'bottom'}
     */
    position?: PositionAxis;

    /**
     * Specifies the horizontal offset for positioning the popup relative to the target.
     *
     * @default 0
     */
    offsetX?: number;

    /**
     * Specifies the vertical offset for positioning the popup relative to the target.
     *
     * @default 0
     */
    offsetY?: number;

    /**
     * Specifies the collision handling behavior on the X and Y axes. When the popup collides with the viewport, this determines how it adjusts.
     *
     * @default -
     */
    collision?: CollisionAxis;

    /**
     * Specifies the z-index value for the popup, controlling its stacking order relative to other elements on the page.
     *
     * @default 1000
     */
    zIndex?: number;

    /**
     * Specifies whether the popup automatically adjusts its position when the content size changes.
     *
     * @default -
     */
    autoReposition?: boolean;

    /**
     * Specifies the width of the popup.
     *
     * @default -
     */
    width?: string;

    /**
     * Specifies the height of the popup.
     *
     * @default -
     */
    height?: string;

    /**
     * Reference to the viewport element used for collision detection of the popup.
     *
     * @default -
     */
    viewPortElementRef?: RefObject<HTMLElement | null>;
}
