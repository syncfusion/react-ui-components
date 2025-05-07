import { useLayoutEffect } from 'react';
import { extend } from './util';
import { Browser } from './browser';
import { EventHandler } from './event-handler';
import { Base } from './base';
const swipeRegex = /(Up|Down)/;
/**
 * Custom hook to handle touch events such as tap, double tap, swipe, etc.
 *
 * @private
 * @param {RefObject<HTMLElement>} element Target HTML element for touch events
 * @param {Touch} props props to customize touch behavior
 * @returns {Touch} The Touch object
 */
export function Touch(element, props) {
    const baseRef = Base();
    const propsRef = { ...props };
    //Internal Variables
    let isTouchMoved = false;
    let startPoint = { clientX: 0, clientY: 0 };
    let startEventData = null;
    let lastMovedPoint = { clientX: 0, clientY: 0 };
    let scrollDirection = '';
    let hScrollLocked = false;
    let vScrollLocked = false;
    let defaultArgs = { originalEvent: null };
    let distanceX = 0;
    let distanceY = 0;
    let movedDirection = '';
    let tStampStart = 0;
    let touchAction = true;
    let timeOutTap = null;
    let timeOutTapHold = null;
    let tapCount = 0;
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
    function bind() {
        if (element.current) {
            wireEvents();
            if (Browser.isIE) {
                element.current.classList.add('sf-block-touch');
            }
        }
    }
    /**
     * Attaches event listeners for start, move, end, and cancel touch events to the target element.
     *
     * @returns {void}
     */
    function wireEvents() {
        EventHandler.add(element.current, Browser.touchStartEvent, startEvent, undefined);
    }
    /**
     * Detaches event listeners for start, move, end, and cancel touch events to the target element.
     *
     * @returns {void}
     */
    function unwireEvents() {
        EventHandler.remove(element.current, Browser.touchStartEvent, startEvent);
    }
    /**
     * Returns if the HTML element is scrollable by inspecting its overflow properties.
     *
     * @param {HTMLElement} element - The HTML element to be checked.
     * @returns {boolean} True if the element is scrollable, false otherwise.
     */
    function isScrollable(element) {
        const eleStyle = getComputedStyle(element);
        const style = eleStyle.overflow + eleStyle.overflowX + eleStyle.overflowY;
        return (/(auto|scroll)/).test(style);
    }
    /**
     * Handler for the touch start event. Initializes touch action tracking and
     * attaches additional event listeners for move, end, and cancel actions.
     *
     * @param {MouseEventArgs | TouchEventArgs} evt - The event object from the touch start action.
     * @returns {void}
     */
    function startEvent(evt) {
        if (touchAction === true) {
            const point = updateChangeTouches(evt);
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
    function moveEvent(evt) {
        const point = updateChangeTouches(evt);
        isTouchMoved = !(point.clientX === startPoint.clientX && point.clientY === startPoint.clientY);
        let eScrollArgs = {};
        if (isTouchMoved) {
            clearTimeout(timeOutTapHold);
            calcScrollPoints(evt);
            const scrollArg = {
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
    function cancelEvent(evt) {
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
    function tapHoldEvent(evt) {
        tapCount = 0;
        touchAction = true;
        EventHandler.remove(element.current, Browser.touchMoveEvent, moveEvent);
        EventHandler.remove(element.current, Browser.touchEndEvent, endEvent);
        const eTapArgs = { originalEvent: evt };
        baseRef.trigger('tapHold', eTapArgs, propsRef.tapHold);
        EventHandler.remove(element.current, Browser.touchCancelEvent, cancelEvent);
    }
    /**
     * Handler for the touch end event. Determines if a tap or swipe occurred and triggers the respective callbacks.
     *
     * @param {MouseEventArgs | TouchEventArgs} evt - The event object from the touch end action.
     * @returns {void}
     */
    function endEvent(evt) {
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
    function swipeFn(evt) {
        clearTimeout(timeOutTapHold);
        clearTimeout(timeOutTap);
        const point = updateChangeTouches(evt);
        let diffX = point.clientX - startPoint.clientX;
        let diffY = point.clientY - startPoint.clientY;
        diffX = Math.floor(diffX < 0 ? -1 * diffX : diffX);
        diffY = Math.floor(diffY < 0 ? -1 * diffY : diffY);
        isTouchMoved = diffX > 1 || diffY > 1;
        const isFirefox = (/Firefox/).test(Browser.userAgent);
        if (isFirefox && point.clientX === 0 && point.clientY === 0 && evt.type === 'mouseup') {
            isTouchMoved = false;
        }
        calcPoints(evt);
        const swipeArgs = {
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
            const tDistance = propsRef.swipeSettings ? propsRef.swipeSettings.swipeThresholdDistance : 50;
            const eSwipeArgs = extend(undefined, defaultArgs, swipeArgs);
            let canTrigger = false;
            const scrollBool = isScrollable(element.current);
            const moved = swipeRegex.test(movedDirection);
            if (tDistance && ((tDistance < distanceX && !moved) || (tDistance < distanceY && moved))) {
                if (!scrollBool) {
                    canTrigger = true;
                }
                else {
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
    function modeclear() {
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
    function calcPoints(evt) {
        const point = updateChangeTouches(evt);
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
    function calcScrollPoints(evt) {
        const point = updateChangeTouches(evt);
        defaultArgs = { originalEvent: evt };
        distanceX = Math.abs(Math.abs(point.clientX) - Math.abs(lastMovedPoint.clientX));
        distanceY = Math.abs(Math.abs(point.clientY) - Math.abs(lastMovedPoint.clientY));
        if ((distanceX > distanceY || hScrollLocked) && !vScrollLocked) {
            scrollDirection = point.clientX > lastMovedPoint.clientX ? 'Right' : 'Left';
            hScrollLocked = true;
        }
        else {
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
    function getVelocity(pnt) {
        const newX = pnt.clientX;
        const newY = pnt.clientY;
        const newT = Date.now();
        const xDist = newX - startPoint.clientX;
        const yDist = newY - startPoint.clientY;
        const interval = newT - tStampStart;
        return Math.sqrt(xDist * xDist + yDist * yDist) / interval;
    }
    /**
     * Determines if a swipe action should be triggered based on the element's scrollable status and direction of movement.
     *
     * @param {HTMLElement} ele - The element to check for swipe triggering.
     * @param {boolean} flag - Indicates the swipe direction (horizontal or vertical).
     * @returns {boolean} True if the swipe can be triggered, false otherwise.
     */
    function checkSwipe(ele, flag) {
        const keys = ['scroll', 'offset'];
        const temp = flag ? ['Height', 'Top'] : ['Width', 'Left'];
        if (ele[keys[0] + temp[0]] <= ele[keys[1] + temp[0]]) {
            return true;
        }
        return (ele[keys[0] + temp[1]] === 0 ||
            ele[keys[1] + temp[0]] + ele[keys[0] + temp[1]] >= ele[keys[0] + temp[0]]);
    }
    /**
     * Updates and returns the primary touch point from the event, used in various calculations.
     *
     * @param {MouseEventArgs | TouchEventArgs} evt - The event object from which to extract the touch point.
     * @returns {MouseEventArgs | TouchEventArgs} The updated point from the touch event.
     */
    function updateChangeTouches(evt) {
        return evt.changedTouches && evt.changedTouches.length !== 0 ? evt.changedTouches[0] : evt;
    }
    return propsRef;
}
