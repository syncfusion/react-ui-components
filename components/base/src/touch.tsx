import { useLayoutEffect, RefObject, MouseEvent } from 'react';
import { extend } from './util';
import { Browser } from './browser';
import { EventHandler, BaseEventArgs } from './event-handler';
import { Base, IBase } from './base';

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

const swipeRegex: RegExp = /(Up|Down)/;

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
export function Touch(element: RefObject<HTMLElement>, props?: ITouch): ITouch {
    const baseRef: IBase<HTMLElement> = Base();
    const propsRef: ITouch = { ...props };
    //Internal Variables
    let isTouchMoved: boolean = false;
    let startPoint: Points = { clientX: 0, clientY: 0 };
    let startEventData: MouseEventArgs | TouchEventArgs = null;
    let lastMovedPoint: Points = { clientX: 0, clientY: 0 };
    let scrollDirection: string = '';
    let hScrollLocked: boolean = false;
    let vScrollLocked: boolean = false;
    let defaultArgs: TapEventArgs = { originalEvent: null };
    let distanceX: number = 0;
    let distanceY: number = 0;
    let movedDirection: string = '';
    let tStampStart: number = 0;
    let touchAction: boolean = true;
    let timeOutTap:  ReturnType<typeof setTimeout> | null = null;
    let timeOutTapHold:  ReturnType<typeof setTimeout> | null = null;
    let tapCount: number = 0;

    useLayoutEffect(() => {
        bind();
        return () => {
            unwireEvents();
            baseRef.destroy();
        };
    }, []);

    /**
     * Binds the touch event handlers to the target element.
     * Calls internal methods to setup required bindings and adds necessary class for IE browser.
     *
     * @returns {void}
     */
    function bind(): void {
        if (element.current) {
            wireEvents();
            if (Browser.isIE) { element.current.classList.add('sf-block-touch'); }
        }
    }

    /**
     * Attaches event listeners for start, move, end, and cancel touch events to the target element.
     *
     * @returns {void}
     */
    function wireEvents(): void {
        EventHandler.add(element.current, Browser.touchStartEvent, startEvent, undefined);
    }

    /**
     * Detaches event listeners for start, move, end, and cancel touch events to the target element.
     *
     * @returns {void}
     */
    function unwireEvents(): void {
        EventHandler.remove(element.current, Browser.touchStartEvent, startEvent);
    }

    /**
     * Returns if the HTML element is scrollable by inspecting its overflow properties.
     *
     * @param {HTMLElement} element - The HTML element to be checked.
     * @returns {boolean} True if the element is scrollable, false otherwise.
     */
    function isScrollable(element: HTMLElement): boolean {
        const eleStyle: CSSStyleDeclaration = getComputedStyle(element);
        const style: string = eleStyle.overflow + eleStyle.overflowX + eleStyle.overflowY;
        return (/(auto|scroll)/).test(style);
    }

    /**
     * Handler for the touch start event. Initializes touch action tracking and
     * attaches additional event listeners for move, end, and cancel actions.
     *
     * @param {MouseEventArgs | TouchEventArgs} evt - The event object from the touch start action.
     * @returns {void}
     */
    function startEvent(evt: MouseEventArgs | TouchEventArgs): void {
        if (touchAction === true) {
            const point: MouseEventArgs | TouchEventArgs = updateChangeTouches(evt);
            if (evt.changedTouches !== undefined) {
                touchAction = false;
            }
            isTouchMoved = false;
            movedDirection = '';
            startPoint = lastMovedPoint = { clientX: point.clientX, clientY: point.clientY };
            startEventData = point;
            hScrollLocked = vScrollLocked = false;
            tStampStart = Date.now();
            timeOutTapHold = setTimeout(() => { tapHoldEvent(evt); }, propsRef.tapHoldThreshold ? propsRef.tapHoldThreshold : 750);
            EventHandler.add(element.current, Browser.touchMoveEvent, moveEvent, undefined);
            EventHandler.add(element.current, Browser.touchEndEvent, endEvent, undefined);
            EventHandler.add(element.current, Browser.touchCancelEvent, cancelEvent, undefined);
        }
    }

    /**
     * Handler for the touch move event. Updates movement tracking and triggers the scroll event if a scroll action is detected.
     *
     * @param {MouseEventArgs | TouchEventArgs} evt - The event object from the touch move action.
     * @returns {void}
     */
    function moveEvent(evt: MouseEventArgs | TouchEventArgs): void {
        const point: MouseEventArgs | TouchEventArgs = updateChangeTouches(evt);
        isTouchMoved = !(point.clientX === startPoint.clientX && point.clientY === startPoint.clientY);
        let eScrollArgs: ScrollEventArgs = {};
        if (isTouchMoved) {
            clearTimeout(timeOutTapHold);
            calcScrollPoints(evt);
            const scrollArg: ScrollEventArgs = {
                startEvents: startEventData,
                originalEvent: evt,
                startX: startPoint.clientX,
                startY: startPoint.clientY,
                distanceX: distanceX,
                distanceY: distanceY,
                scrollDirection: scrollDirection,
                velocity: getVelocity(point)
            };
            eScrollArgs = extend(eScrollArgs, {}, scrollArg);
            baseRef.trigger('scroll', eScrollArgs, propsRef.scroll);
            lastMovedPoint = { clientX: point.clientX, clientY: point.clientY };
        }
    }

    /**
     * Handler for the touch cancel event. Clears timeouts and triggers necessary cleanup.
     *
     * @param {MouseEventArgs | TouchEventArgs} evt - The event object from the touch cancel action.
     * @returns {void}
     */
    function cancelEvent(evt: MouseEventArgs | TouchEventArgs): void {
        clearTimeout(timeOutTapHold);
        clearTimeout(timeOutTap);
        tapCount = 0;
        swipeFn(evt);
        EventHandler.remove(element.current, Browser.touchCancelEvent, cancelEvent);
    }

    /**
     * Triggers when a tap hold is detected.
     * Invokes the tap hold callback and removes additional event listeners.
     *
     * @param {MouseEvent | TouchEventArgs} evt - The event object from the tap hold action.
     * @returns {void}
     */
    function tapHoldEvent(evt: MouseEventArgs | TouchEventArgs): void {
        tapCount = 0;
        touchAction = true;
        EventHandler.remove(element.current, Browser.touchMoveEvent, moveEvent);
        EventHandler.remove(element.current, Browser.touchEndEvent, endEvent);
        const eTapArgs: TapEventArgs = { originalEvent: evt };
        baseRef.trigger('tapHold', eTapArgs, propsRef.tapHold);
        EventHandler.remove(element.current, Browser.touchCancelEvent, cancelEvent);
    }

    /**
     * Handler for the touch end event. Determines if a tap or swipe occurred and triggers the respective callbacks.
     *
     * @param {MouseEventArgs | TouchEventArgs} evt - The event object from the touch end action.
     * @returns {void}
     */
    function endEvent(evt: MouseEventArgs | TouchEventArgs): void {
        swipeFn(evt);
        if (!isTouchMoved) {
            if (typeof propsRef.tap === 'function') {
                baseRef.trigger('tap', { originalEvent: evt, tapCount: ++tapCount }, propsRef.tap);
                timeOutTap = setTimeout(() => {
                    tapCount = 0;
                }, propsRef.tapThreshold ? propsRef.tapThreshold : 350);
            }
        }
        modeclear();
    }

    /**
     * Determines if a swipe occurred and triggers the swipe event callback.
     * Computes swipe direction, distance, and velocity.
     *
     * @param {MouseEventArgs | TouchEventArgs} evt - The event object from the swipe action.
     * @returns {void}
     */
    function swipeFn(evt: MouseEventArgs | TouchEventArgs): void {
        clearTimeout(timeOutTapHold);
        clearTimeout(timeOutTap);
        const point: MouseEventArgs | TouchEventArgs = updateChangeTouches(evt);
        let diffX: number = point.clientX - startPoint.clientX;
        let diffY: number = point.clientY - startPoint.clientY;
        diffX = Math.floor(diffX < 0 ? -1 * diffX : diffX);
        diffY = Math.floor(diffY < 0 ? -1 * diffY : diffY);
        isTouchMoved = diffX > 1 || diffY > 1;
        const isFirefox: boolean = (/Firefox/).test(Browser.userAgent);
        if (isFirefox && point.clientX === 0 && point.clientY === 0 && evt.type === 'mouseup') {
            isTouchMoved = false;
        }
        calcPoints(evt);
        const swipeArgs: SwipeEventArgs = {
            originalEvent: evt,
            startEvents: startEventData,
            startX: startPoint.clientX,
            startY: startPoint.clientY,
            distanceX: distanceX,
            distanceY: distanceY,
            swipeDirection: movedDirection,
            velocity: getVelocity(point)
        };
        if (isTouchMoved) {
            const tDistance: number = propsRef.swipeSettings ? propsRef.swipeSettings.swipeThresholdDistance : 50;
            const eSwipeArgs: object = extend(undefined, defaultArgs, swipeArgs);
            let canTrigger: boolean = false;
            const scrollBool: boolean = isScrollable(element.current);
            const moved: boolean = swipeRegex.test(movedDirection);
            if (tDistance && ((tDistance < distanceX && !moved) || (tDistance < distanceY && moved))) {
                if (!scrollBool) {
                    canTrigger = true;
                } else {
                    canTrigger = checkSwipe(element.current, moved);
                }
            }
            if (canTrigger) {
                baseRef.trigger('swipe', eSwipeArgs, propsRef.swipe);
            }
        }
        modeclear();
    }

    /**
     * Clears or resets various states and timeouts after a touch action completes.
     * Ensures the touch action can be re-triggered properly.
     *
     * @returns {void}
     */
    function modeclear(): void {
        setTimeout(() => {
            touchAction = true;
        }, typeof propsRef.tap !== 'function' ? 0 : 20);
        EventHandler.remove(element.current, Browser.touchMoveEvent, moveEvent);
        EventHandler.remove(element.current, Browser.touchEndEvent, endEvent);
        EventHandler.remove(element.current, Browser.touchCancelEvent, cancelEvent);
    }

    /**
     * Calculates the distance and direction of the touch points during a swipe.
     * Sets the moved direction based on the calculated points' differences.
     *
     * @param {MouseEventArgs | TouchEventArgs} evt - The event object from the movement action.
     * @returns {void}
     */
    function calcPoints(evt: MouseEventArgs | TouchEventArgs): void {
        const point: MouseEventArgs | TouchEventArgs = updateChangeTouches(evt);
        defaultArgs = { originalEvent: evt };
        distanceX = Math.abs(Math.abs(point.clientX) - Math.abs(startPoint.clientX));
        distanceY = Math.abs(Math.abs(point.clientY) - Math.abs(startPoint.clientY));
        movedDirection = distanceX > distanceY
            ? (point.clientX > startPoint.clientX ? 'Right' : 'Left')
            : (point.clientY < startPoint.clientY ? 'Up' : 'Down');
    }

    /**
     * Calculates the scrolling distance and direction when a scroll action is detected.
     * Determines which direction the scroll is locked, updating the scroll direction accordingly.
     *
     * @param {MouseEventArgs | TouchEventArgs} evt - The event object from the scroll action.
     * @returns {void}
     */
    function calcScrollPoints(evt: MouseEventArgs | TouchEventArgs): void {
        const point: MouseEventArgs | TouchEventArgs = updateChangeTouches(evt);
        defaultArgs = { originalEvent: evt };
        distanceX = Math.abs(Math.abs(point.clientX) - Math.abs(lastMovedPoint.clientX));
        distanceY = Math.abs(Math.abs(point.clientY) - Math.abs(lastMovedPoint.clientY));
        if ((distanceX > distanceY || hScrollLocked) && !vScrollLocked) {
            scrollDirection = point.clientX > lastMovedPoint.clientX ? 'Right' : 'Left';
            hScrollLocked = true;
        } else {
            scrollDirection = point.clientY < lastMovedPoint.clientY ? 'Up' : 'Down';
            vScrollLocked = true;
        }
    }

    /**
     * Calculates the velocity of the swipe or scroll action based on the distance moved and time taken.
     *
     * @param {MouseEventArgs | TouchEventArgs} pnt - The point from which velocity is calculated.
     * @returns {number} The calculated velocity of the touch action.
     */
    function getVelocity(pnt: MouseEventArgs | TouchEventArgs): number {
        const newX: number = pnt.clientX;
        const newY: number = pnt.clientY;
        const newT: number = Date.now();
        const xDist: number = newX - startPoint.clientX;
        const yDist: number = newY - startPoint.clientY;
        const interval: number = newT - tStampStart;
        return Math.sqrt(xDist * xDist + yDist * yDist) / interval;
    }

    /**
     * Determines if a swipe action should be triggered based on the element's scrollable status and direction of movement.
     *
     * @param {HTMLElement} ele - The element to check for swipe triggering.
     * @param {boolean} flag - Indicates the swipe direction (horizontal or vertical).
     * @returns {boolean} True if the swipe can be triggered, false otherwise.
     */
    function checkSwipe(ele: HTMLElement, flag: boolean): boolean {
        const keys: string[] = ['scroll', 'offset'];
        const temp: string[] = flag ? ['Height', 'Top'] : ['Width', 'Left'];
        if (ele[keys[0] + temp[0]] <= ele[keys[1] + temp[0]]) {
            return true;
        }
        return (
            ele[keys[0] + temp[1]] === 0 ||
            ele[keys[1] + temp[0]] + ele[keys[0] + temp[1]] >= ele[keys[0] + temp[0]]
        );
    }

    /**
     * Updates and returns the primary touch point from the event, used in various calculations.
     *
     * @param {MouseEventArgs | TouchEventArgs} evt - The event object from which to extract the touch point.
     * @returns {MouseEventArgs | TouchEventArgs} The updated point from the touch event.
     */
    function updateChangeTouches(evt: MouseEventArgs | TouchEventArgs): MouseEventArgs | TouchEventArgs {
        return evt.changedTouches && evt.changedTouches.length !== 0 ? evt.changedTouches[0] : evt;
    }

    return propsRef;
}

interface Points {
    clientX: number;
    clientY: number;
}

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
