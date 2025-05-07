import { jsx as _jsx } from "react/jsx-runtime";
import * as React from 'react';
import { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { calculatePosition, calculateRelativeBasedPosition } from '../common/position';
import { preRender, useProviderContext } from '@syncfusion/react-base';
import { Animation } from '@syncfusion/react-base';
import { flip, fit, isCollide } from '../common/collision';
/**
 * Defines the available collision handling types for popup positioning.
 */
export var CollisionType;
(function (CollisionType) {
    /**
     * No collision handling - the popup will maintain its original position
     * regardless of viewport boundaries.
     */
    CollisionType["None"] = "None";
    /**
     * Flip collision handling - the popup will flip to the opposite side of its
     * anchor element when it would otherwise extend beyond viewport boundaries.
     */
    CollisionType["Flip"] = "Flip";
    /**
     * Fit collision handling - the popup will be adjusted to fit within the viewport
     * boundaries while maintaining its original side relative to the anchor element.
     */
    CollisionType["Fit"] = "Fit";
})(CollisionType || (CollisionType = {}));
/**
 * Defines how the popup should behave when scroll events occur in the parent container.
 */
export var ActionOnScrollType;
(function (ActionOnScrollType) {
    /**
     * The popup will recalculate and update its position to maintain proper alignment
     * with the target element when scrolling occurs.
     */
    ActionOnScrollType["Reposition"] = "Reposition";
    /**
     * The popup will be hidden when scrolling occurs in the parent container,
     * helping to improve performance or prevent UI clutter during scrolling.
     */
    ActionOnScrollType["Hide"] = "Hide";
    /**
     * The popup will not respond to scroll events and will maintain its absolute
     * position on the page regardless of scrolling.
     */
    ActionOnScrollType["None"] = "None";
})(ActionOnScrollType || (ActionOnScrollType = {}));
/**
 * Defines the possible reference types for positioning a popup element.
 */
export var TargetType;
(function (TargetType) {
    /**
     * Uses the immediate container element as the reference for positioning.
     * The popup will be positioned relative to its parent container element.
     */
    TargetType["Container"] = "Container";
    /**
     * Uses a custom specified element as the reference for positioning.
     * The popup will be positioned relative to this specified element.
     */
    TargetType["Relative"] = "Relative";
    /**
     * Uses the document body as the reference for positioning.
     * The popup will be positioned relative to the document body, allowing it to be
     * placed anywhere on the page regardless of parent container boundaries.
     */
    TargetType["Body"] = "Body";
})(TargetType || (TargetType = {}));
const CLASSNAME_OPEN = 'sf-popup-open';
const CLASSNAME_CLOSE = 'sf-popup-close';
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
export const Popup = forwardRef((props, ref) => {
    const { children, isOpen = false, targetRef, relativeElement = null, position = { X: 'left', Y: 'top' }, offsetX = 0, offsetY = 0, collision = { X: CollisionType.None, Y: CollisionType.None }, showAnimation = {
        name: 'FadeIn',
        duration: 0,
        timingFunction: 'ease-out'
    }, hideAnimation = {
        name: 'FadeOut',
        duration: 0,
        timingFunction: 'ease-out'
    }, relateTo = 'body', viewPortElementRef, zIndex = 1000, width = 'auto', height = 'auto', className = '', actionOnScroll = ActionOnScrollType.Reposition, onOpen, onClose, targetType = TargetType.Container, onTargetExitViewport, style, ...rest } = props;
    let targetTypes = targetType.toString();
    const popupRef = useRef(null);
    const initialOpenState = useRef(isOpen);
    const [leftPosition, setLeftPosition] = useState(0);
    const [topPosition, setTopPosition] = useState(0);
    const [popupClass, setPopupClass] = useState(CLASSNAME_CLOSE);
    const [fixedParent, setFixedParent] = useState(false);
    const [popupZIndex, setPopupZIndex] = useState(1000);
    const { dir } = useProviderContext();
    const [currentShowAnimation, setCurrentShowAnimation] = useState(showAnimation);
    const [currentHideAnimation, setCurrentHideAnimation] = useState(hideAnimation);
    const [currentRelatedElement, setRelativeElement] = useState(relativeElement);
    useImperativeHandle(ref, () => ({
        getScrollableParent: (element) => {
            return getScrollableParent(element);
        },
        refreshPosition: (target, collision) => {
            refreshPosition(target, collision);
        },
        element: popupRef.current
    }), []);
    useEffect(() => {
        preRender('popup');
    }, []);
    useEffect(() => {
        updatePosition();
    }, [targetRef, position, offsetX, offsetY, viewPortElementRef]);
    useEffect(() => {
        checkCollision();
    }, [collision]);
    useEffect(() => {
        if (!isEqual(currentShowAnimation, showAnimation)) {
            setCurrentShowAnimation(showAnimation);
        }
    }, [showAnimation]);
    useEffect(() => {
        if (!isEqual(currentHideAnimation, hideAnimation)) {
            setCurrentHideAnimation(hideAnimation);
        }
    }, [hideAnimation]);
    useEffect(() => {
        if (!isOpen && initialOpenState.current === isOpen) {
            return;
        }
        initialOpenState.current = isOpen;
        if (isOpen) {
            show(showAnimation, currentRelatedElement);
        }
        else {
            hide(hideAnimation);
        }
    }, [isOpen]);
    useEffect(() => {
        setPopupZIndex(zIndex);
    }, [zIndex]);
    useEffect(() => {
        setRelativeElement(relativeElement);
    }, [relativeElement]);
    /**
     * Compares two objects for equality by converting them to JSON strings.
     *
     * @param {any} obj1 - The first object to compare
     * @param {any} obj2 - The second object to compare
     * @returns {boolean} True if the objects are equal, false otherwise
     */
    function isEqual(obj1, obj2) {
        return JSON.stringify(obj1) === JSON.stringify(obj2);
    }
    /**
     * Based on the `relative` element and `offset` values, `Popup` element position will refreshed.
     *
     * @param {HTMLElement} target - The target element.
     * @param {boolean} collision - Specifies whether to check for collision.
     * @returns {void}
     */
    function refreshPosition(target, collision) {
        if (target) {
            checkFixedParent(target);
        }
        updatePosition();
        if (!collision) {
            checkCollision();
        }
    }
    /**
     * Update the position of the popup based on the target reference and specified position and offset.
     *
     * @returns {void}
     */
    function updatePosition() {
        if (!popupRef.current) {
            return;
        }
        const relateToElement = getRelateToElement();
        let pos = { left: 0, top: 0 };
        if (typeof position.X === 'number' && typeof position.Y === 'number') {
            pos = {
                left: position.X,
                top: position.Y
            };
        }
        else if (((typeof position.X === 'string' && typeof position.Y === 'number') ||
            (typeof position.X === 'number' && typeof position.Y === 'string')) && targetRef?.current) {
            const anchorPosition = getAnchorPosition(targetRef.current, popupRef.current, position, offsetX, offsetY);
            if (typeof position.X === 'string') {
                pos = { left: anchorPosition.left, top: position.Y };
            }
            else {
                pos = { left: position.X, top: anchorPosition.top };
            }
        }
        else if (typeof position.X === 'string' && typeof position.Y === 'string' && targetRef?.current) {
            pos = calculatePosition(targetRef, position.X.toLowerCase(), position.Y.toLowerCase());
            pos.left += offsetX;
            pos.top += offsetY;
        }
        else if (relateToElement) {
            pos = getAnchorPosition(relateToElement, popupRef.current, position, offsetX, offsetY);
        }
        if (pos) {
            setLeftPosition(pos.left);
            setTopPosition(pos.top);
        }
    }
    /**
     * Shows the popup element from screen.
     *
     * @returns {void}
     * @param {AnimationOptions } animationOptions - specifies the model
     * @param { HTMLElement } relativeElement - To calculate the zIndex value dynamically.
     */
    function show(animationOptions, relativeElement) {
        if (popupRef?.current) {
            addScrollListeners();
            if (relativeElement || zIndex === 1000) {
                const zIndexElement = !relativeElement ? popupRef?.current : relativeElement;
                setPopupZIndex(getZindexPartial(zIndexElement));
            }
            if (collision.X !== CollisionType.None || collision.Y !== CollisionType.None) {
                setPopupClass(CLASSNAME_OPEN);
                checkCollision();
                setPopupClass(CLASSNAME_CLOSE);
            }
            if (animationOptions) {
                animationOptions.begin = () => {
                    setPopupClass(CLASSNAME_OPEN);
                };
                animationOptions.end = () => {
                    onOpen?.();
                };
                if (Animation) {
                    const animationInstance = Animation(animationOptions);
                    if (animationInstance.animate) {
                        animationInstance.animate(popupRef.current);
                    }
                }
            }
        }
    }
    /**
     * Hides the popup element from screen.
     *
     * @param {AnimationOptions} animationOptions - To give the animation options.
     * @returns {void}
     */
    function hide(animationOptions) {
        if (animationOptions) {
            animationOptions.begin = () => {
                let duration = animationOptions.duration ? animationOptions.duration - 30 : 0;
                duration = duration > 0 ? duration : 0;
                setTimeout(() => {
                    setPopupClass(CLASSNAME_CLOSE);
                }, duration);
            };
            animationOptions.end = () => {
                onClose?.();
            };
            if (Animation) {
                const animationInstance = Animation(animationOptions);
                if (animationInstance.animate) {
                    animationInstance.animate(popupRef.current);
                }
            }
        }
        removeScrollListeners();
    }
    /**
     * Update the position of the popup based on the target reference and specified position and offset.
     *
     * @returns {void}
     */
    function checkCollision() {
        if (!popupRef.current || !targetRef?.current) {
            return;
        }
        const pos = { left: 0, top: 0 };
        let isPositionUpdated = false;
        if (collision.X !== CollisionType.None || collision.Y !== CollisionType.None) {
            const flippedPos = flip(popupRef, targetRef, offsetX, offsetY, typeof position.X === 'string' ? position.X : 'left', typeof position.Y === 'string' ? position.Y : 'top', viewPortElementRef, { X: collision.X === CollisionType.Flip, Y: collision.Y === CollisionType.Flip });
            if (flippedPos) {
                pos.left = flippedPos.left;
                pos.top = flippedPos.top;
                isPositionUpdated = true;
            }
            if (collision.X === CollisionType.Fit || collision.Y === CollisionType.Fit) {
                const fittedPos = fit(popupRef, viewPortElementRef, {
                    X: collision.X === CollisionType.Fit,
                    Y: collision.Y === CollisionType.Fit
                }, pos);
                if (fittedPos) {
                    pos.left = fittedPos.left;
                    pos.top = fittedPos.top;
                    isPositionUpdated = true;
                }
            }
        }
        if (isPositionUpdated) {
            setLeftPosition(pos.left);
            setTopPosition(pos.top);
        }
    }
    /**
     * Calculates and returns the anchor position for a popup element.
     * This function takes into account the current position, any offsets provided,
     * and the dimensions of the target and popup elements to calculate the appropriate
     * position for the popup.
     *
     * @param {HTMLElement} anchorEle - The reference to the target element. This is the element to which the popup is anchored.
     * @param {HTMLElement} element - The reference to the popup element. This is the element that needs to be positioned.
     * @param {PositionAxis} position - An object defining the initial x and y positions.
     * @param {number} offsetX - Optional x-axis offset for fine-tuning the popup's position.
     * @param {number} offsetY - Optional y-axis offset for fine-tuning the popup's position.
     * @returns {OffsetPosition} An object containing the calculated x and y positions for the popup.
     */
    function getAnchorPosition(anchorEle, element, position, offsetX, offsetY) {
        const anchorRect = anchorEle.getBoundingClientRect();
        const eleRect = element.getBoundingClientRect();
        const anchorPos = { left: 0, top: 0 };
        targetTypes = anchorEle.tagName.toUpperCase() === 'BODY' ? 'body' : 'container';
        switch (position.X) {
            case 'center':
                anchorPos.left = targetTypes === 'body' ? window.innerWidth / 2 - eleRect.width / 2
                    : anchorRect.left + (anchorRect.width / 2 - eleRect.width / 2);
                break;
            case 'right':
                anchorPos.left = targetTypes === 'body' ? window.innerWidth - eleRect.width
                    : anchorRect.left + (anchorRect.width - eleRect.width);
                break;
            default:
                anchorPos.left = anchorRect.left;
        }
        switch (position.Y) {
            case 'center':
                anchorPos.top = targetTypes === 'body' ? window.innerHeight / 2 - eleRect.height / 2
                    : anchorRect.top + (anchorRect.height / 2 - eleRect.height / 2);
                break;
            case 'bottom':
                anchorPos.top = targetTypes === 'body' ? window.innerHeight - eleRect.height
                    : anchorRect.top + (anchorRect.height - eleRect.height);
                break;
            default:
                anchorPos.top = anchorRect.top;
        }
        anchorPos.left += offsetX;
        anchorPos.top += offsetY;
        return anchorPos;
    }
    /**
     * Adds scroll listeners to handle popup positioning when the target container is scrolled.
     *
     * @returns {void}
     */
    function addScrollListeners() {
        if (actionOnScroll !== ActionOnScrollType.None && getRelateToElement()) {
            const scrollParents = getScrollableParent(getRelateToElement());
            scrollParents.forEach((parent) => {
                parent.addEventListener('scroll', handleScroll);
            });
        }
    }
    /**
     * Removes scroll listeners.
     *
     * @returns {void}
     */
    function removeScrollListeners() {
        if (actionOnScroll !== ActionOnScrollType.None && getRelateToElement()) {
            const scrollParents = getScrollableParent(getRelateToElement());
            scrollParents.forEach((parent) => {
                parent.removeEventListener('scroll', handleScroll);
            });
        }
    }
    /**
     * Determines the element to which the popup is related.
     *
     * @returns {HTMLElement} The HTMLElement that the popup is related to.
     */
    function getRelateToElement() {
        const relateToElement = relateTo === '' || relateTo == null ? document.body : relateTo;
        return typeof relateToElement === 'string' ? document.querySelector(relateToElement) : relateToElement;
    }
    /**
     * Handle scroll event to optionally reposition or hide the popup.
     *
     * @returns {void}
     */
    function handleScroll() {
        if (actionOnScroll === ActionOnScrollType.Reposition) {
            refreshPosition();
        }
        else if (actionOnScroll === ActionOnScrollType.Hide) {
            hide();
            onClose?.();
        }
        if (targetRef?.current && !isElementOnViewport(targetRef?.current)) {
            onTargetExitViewport?.();
        }
    }
    /**
     * Identifies scrollable parents of a given element, used to attach scroll event listeners.
     *
     * @param {HTMLElement} element - The element to find scrollable parents for.
     * @returns {Element[]} An array of scrollable parent elements.
     */
    function getScrollableParent(element) {
        checkFixedParent(element);
        return getFixedScrollableParent(element, fixedParent);
    }
    /**
     * Checks for fixed or sticky positioned ancestors and updates popup positioning.
     *
     * @param {HTMLElement} element - The starting element to check for fixed or sticky parents.
     * @returns {void} This function does not return a value.
     */
    function checkFixedParent(element) {
        let parent = element.parentElement;
        while (parent && parent.tagName !== 'HTML') {
            const { position } = getComputedStyle(parent);
            if (popupRef?.current) {
                const popupElement = popupRef.current;
                const popupElementStyle = getComputedStyle(popupElement);
                if (!popupElement?.offsetParent && position === 'fixed' && popupElementStyle && popupElementStyle.position === 'fixed') {
                    setFixedParent(true);
                }
                parent = parent.parentElement;
            }
        }
    }
    /**
     * Checks if a given element is fully visible in the current viewport.
     *
     * @param {Element} element - The element to check.
     * @returns {boolean} True if the element is within the viewport, otherwise false.
     */
    function isElementOnViewport(element) {
        const rect = element.getBoundingClientRect();
        return (rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= window.innerHeight &&
            rect.right <= window.innerWidth);
    }
    const popupStyle = {
        position: 'absolute',
        left: `${leftPosition}px`,
        top: `${topPosition}px`,
        zIndex: popupZIndex,
        width: width,
        height: height,
        ...style
    };
    const popupClasses = [
        'sf-popup sf-control sf-lib',
        (dir === 'rtl') ? 'sf-rtl' : '',
        popupClass,
        className
    ]
        .filter(Boolean)
        .join(' ');
    return (_jsx("div", { ref: popupRef, className: popupClasses, style: popupStyle, ...rest, children: children }));
});
export default React.memo(Popup);
export { calculatePosition, calculateRelativeBasedPosition, flip, fit, isCollide, getZindexPartial, getFixedScrollableParent };
/**
 * Gets the maximum z-index of the given element.
 *
 * @returns {void}
 * @param { HTMLElement } element - Specify the element to get the maximum z-index of it.
 * @private
 */
function getZindexPartial(element) {
    let parent = element.parentElement;
    const parentZindex = [];
    while (parent) {
        if (parent.tagName !== 'BODY') {
            const computedStyle = window.getComputedStyle(parent);
            const index = computedStyle.zIndex;
            const position = computedStyle.position;
            if (index !== 'auto' && position !== 'static') {
                parentZindex.push(index);
            }
            parent = parent.parentElement;
        }
        else {
            break;
        }
    }
    const childrenZindex = [];
    for (let i = 0; i < document.body.children.length; i++) {
        const child = document.body.children[i];
        if (!element.isEqualNode(child) && child instanceof HTMLElement) {
            const computedStyle = window.getComputedStyle(child);
            const index = computedStyle.zIndex;
            const position = computedStyle.position;
            if (index !== 'auto' && position !== 'static') {
                childrenZindex.push(index);
            }
        }
    }
    childrenZindex.push('999');
    const siblingsZindex = [];
    if (element.parentElement && element.parentElement.tagName !== 'BODY') {
        const childNodes = Array.from(element.parentElement.children);
        for (let i = 0; i < childNodes.length; i++) {
            const child = childNodes[i];
            if (!element.isEqualNode(child) && child instanceof HTMLElement) {
                const computedStyle = window.getComputedStyle(child);
                const index = computedStyle.zIndex;
                const position = computedStyle.position;
                if (index !== 'auto' && position !== 'static') {
                    siblingsZindex.push(index);
                }
            }
        }
    }
    const finalValue = parentZindex.concat(childrenZindex, siblingsZindex);
    const currentZindexValue = Math.max(...finalValue.map(Number)) + 1;
    return currentZindexValue > 2147483647 ? 2147483647 : currentZindexValue;
}
/**
 * Gets scrollable parent elements for the given element.
 *
 * @param {HTMLElement} element - The element to get the scrollable parents of.
 * @param {boolean} [fixedParent] - Whether to include fixed-positioned parents.
 * @returns {HTMLElement[]} An array of scrollable parent elements.
 */
function getFixedScrollableParent(element, fixedParent = false) {
    const scrollParents = [];
    const overflowRegex = /(auto|scroll)/;
    let parent = element.parentElement;
    while (parent && parent.tagName !== 'HTML') {
        const { position, overflow, overflowY, overflowX } = getComputedStyle(parent);
        if (!(getComputedStyle(element).position === 'absolute' && position === 'static')
            && overflowRegex.test(`${overflow} ${overflowY} ${overflowX}`)) {
            scrollParents.push(parent);
        }
        parent = parent.parentElement;
    }
    if (!fixedParent) {
        scrollParents.push(document.documentElement);
    }
    return scrollParents;
}
