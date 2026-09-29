/**
 * Specifies horizontal alignment options.
 */
export type HorizontalAlign = 'left' | 'center' | 'right';

/**
 * Specifies vertical alignment options.
 */
export type VerticalAlign = 'top' | 'center' | 'bottom';

/**
 * Specifies an alignment point in 2D space used for anchor and popup positioning.
 *
 */
export interface AlignmentPoint {
    /** Specifies the horizontal alignment. */
    horizontal: HorizontalAlign;
    /** Specifies the vertical alignment. */
    vertical: VerticalAlign;
}

/**
 * Specifies percentage-based alignment coordinates.
 *
 * @private
 */
export interface AlignmentPercentage {
    /** Specifies the horizontal percentage. */
    x: number;

    /** Specifies the vertical percentage. */
    y: number;
}

/**
 * Specifies a position offset in pixels. Used to represent calculated popup position.
 */
export interface OffsetPosition {
    /** Specifies the horizontal offset. */
    left: number;

    /** Specifies the vertical offset. */
    top: number;
}

/**
 * Specifies collision information for horizontal and vertical axes.
 *
 * @private
 */
export interface CollisionCoordinates {
    /** Specifies whether a horizontal collision was detected. */
    X?: boolean;

    /** Specifies whether a vertical collision was detected. */
    Y?: boolean;
}

/**
 * Specifies the result of a flip strategy calculation.
 * Contains adjusted position and alignment points after collision handling
 *
 * @private
 */
export interface FlipResult {
    position: OffsetPosition;
    anchorAlign: AlignmentPoint;
    popupAlign: AlignmentPoint;
    fitted?: boolean;
}
