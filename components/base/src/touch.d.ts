import { RefObject, MouseEvent } from 'react';
import { BaseEventArgs } from './event-handler';
import { IBase } from './base';
/**
 * SwipeSettings is a framework module that provides support to handle swipe event like swipe up, swipe right, etc..,
 */
export interface SwipeSettings {
    /**
     * Property specifies minimum distance of swipe moved.
     *
     * @default 50
     */
    swipeThresholdDistance?: number;
}
/**
 * Interface defining the touch handling props.
 */
export interface ITouch extends IBase<HTMLElement> {
    /**
     * Specifies the callback function for tap event.
     */
    tap?: (args: TapEventArgs) => void;
    /**
     * Specifies the callback function for tapHold event.
     */
    tapHold?: (args: TapEventArgs) => void;
    /**
     * Specifies the callback function for swipe event.
     */
    swipe?: (args: SwipeEventArgs) => void;
    /**
     * Specifies the callback function for scroll event.
     */
    scroll?: (args: ScrollEventArgs) => void;
    /**
     * Specifies the time delay for tap.
     *
     * @default 350
     */
    tapThreshold?: number;
    /**
     * Specifies the time delay for tap hold.
     *
     * @default 750
     */
    tapHoldThreshold?: number;
    /**
     * Customize the swipe event configuration.
     *
     * @default  '{swipeThresholdDistance: 50}'
     */
    swipeSettings?: SwipeSettings;
}
/**
 * Custom hook to handle touch events such as tap, double tap, swipe, etc.
 *
 * @private
 * @param {RefObject<HTMLElement>} element Target HTML element for touch events
 * @param {Touch} props props to customize touch behavior
 * @returns {Touch} The Touch object
 */
export declare function Touch(element: RefObject<HTMLElement>, props?: ITouch): ITouch;
/**
 * The argument type of `Tap` Event
 */
export interface TapEventArgs extends BaseEventArgs {
    /**
     * Original native event Object.
     */
    originalEvent: TouchEventArgs | MouseEventArgs;
    /**
     * Tap Count.
     */
    tapCount?: number;
}
/**
 * The argument type of `Scroll` Event
 */
export interface ScrollEventArgs extends BaseEventArgs {
    /**
     * Event argument for start event.
     */
    startEvents?: TouchEventArgs | MouseEventArgs;
    /**
     * Original native event object for scroll.
     */
    originalEvent?: TouchEventArgs | MouseEventArgs;
    /**
     * X position when scroll started.
     */
    startX?: number;
    /**
     * Y position when scroll started.
     */
    startY?: number;
    /**
     * The direction scroll.
     */
    scrollDirection?: string;
    /**
     * The total traveled distance from X position
     */
    distanceX?: number;
    /**
     * The total traveled distance from Y position
     */
    distanceY?: number;
    /**
     * The velocity of scroll.
     */
    velocity?: number;
}
/**
 * The argument type of `Swipe` Event
 */
export interface SwipeEventArgs extends BaseEventArgs {
    /**
     * Event argument for start event.
     */
    startEvents?: TouchEventArgs | MouseEventArgs;
    /**
     * Original native event object  for swipe.
     */
    originalEvent?: TouchEventArgs | MouseEventArgs;
    /**
     * X position when swipe started.
     */
    startX?: number;
    /**
     * Y position when swipe started.
     */
    startY?: number;
    /**
     * The direction swipe.
     */
    swipeDirection?: string;
    /**
     * The total traveled distance from X position
     */
    distanceX?: number;
    /**
     * The total traveled distance from Y position
     */
    distanceY?: number;
    /**
     * The velocity of swipe.
     */
    velocity?: number;
}
export interface TouchEventArgs extends MouseEvent {
    /**
     * A TouchList with touched points.
     */
    changedTouches: MouseEventArgs[] | TouchEventArgs[];
    /**
     * Cancel the default action.
     */
    preventDefault(): void;
    /**
     * The horizontal coordinate point of client area.
     */
    clientX: number;
    /**
     * The vertical coordinate point of client area.
     */
    clientY: number;
}
export interface MouseEventArgs extends MouseEvent {
    /**
     * A TouchList with touched points.
     */
    changedTouches: MouseEventArgs[] | TouchEventArgs[];
    /**
     * Cancel the default action.
     */
    preventDefault(): void;
    /**
     * The horizontal coordinate point of client area.
     */
    clientX: number;
    /**
     * The vertical coordinate point of client area.
     */
    clientY: number;
}
