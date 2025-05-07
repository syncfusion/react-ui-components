/**
 * Configuration options for the ripple effect behavior.
 */
export interface RippleOptions {
    /**
     * The duration of the ripple animation in milliseconds.
     *
     * @default 350
     */
    duration?: number;
    /**
     * Whether the ripple should start from the center of the element instead of the click position.
     *
     * @default false
     */
    isCenterRipple?: boolean;
    /**
     * CSS selector for elements that should not trigger a ripple effect when clicked.
     *
     * @default null
     */
    ignore?: string | null;
    /**
     * CSS selector to identify which parent element should receive the ripple when a child is clicked.
     *
     * @default null
     */
    selector?: string | null;
}
/**
 * Interface for the ripple effect handlers and component.
 */
export interface RippleEffect {
    /**
     * Handler for the mouse down event to start the ripple effect.
     *
     * @param {MouseEvent<HTMLElement>} e - The mouse down event.
     */
    rippleMouseDown: (e: React.MouseEvent<HTMLElement>) => void;
    /**
     * React component that renders the actual ripple elements.
     */
    Ripple: React.FC;
}
/**
 * Props for an individual ripple item.
 *
 * @private
 */
interface RippleProps {
    /**
     * The x-coordinate position of the ripple relative to its container.
     */
    x: number;
    /**
     * The y-coordinate position of the ripple relative to its container.
     */
    y: number;
    /**
     * The size of the ripple, either in pixels or percentage.
     */
    size: string;
    /**
     * The duration of the ripple animation in milliseconds.
     */
    duration: number;
    /**
     * Whether the ripple is centered within its container.
     */
    isCenterRipple: boolean;
    /**
     * Callback function triggered when the animation is complete.
     */
    onAnimationComplete: () => void;
}
/**
 * Interface representing the data structure RippleContainerRef.
 *
 * @private
 */
interface RippleContainerRef {
    createRipple: (x: number, y: number, size: number, duration: number, isCenterRipple: boolean) => void;
}
export declare const RippleElement: React.FC<RippleProps>;
export declare const RippleContainer: React.ForwardRefExoticComponent<{
    maxRipples?: number;
} & React.RefAttributes<RippleContainerRef>>;
/**
 * useRippleEffect function provides wave effect when an element is clicked.
 *
 * @param {boolean} isEnabled - Whether the ripple effect is enabled.
 * @param {RippleOptions} options - Optional configuration for the ripple effect.
 * @returns {RippleEffect} - Ripple effect controller object.
 */
export declare function useRippleEffect(isEnabled: boolean, options?: RippleOptions): RippleEffect;
export {};
