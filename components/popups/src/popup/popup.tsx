import * as React from 'react';
import { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { calculatePosition, OffsetPosition, calculateRelativeBasedPosition } from '../common/position';
import { AnimationOptions, IAnimation, preRender, useProviderContext } from '@syncfusion/react-base';
import { Animation } from '@syncfusion/react-base';
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
 * Defines how the popup should behave when scroll events occur in the parent container.
 */
export enum ActionOnScrollType {
    /**
     * The popup will recalculate and update its position to maintain proper alignment
     * with the target element when scrolling occurs.
     */
    Reposition = 'Reposition',

    /**
     * The popup will be hidden when scrolling occurs in the parent container,
     * helping to improve performance or prevent UI clutter during scrolling.
     */
    Hide = 'Hide',

    /**
     * The popup will not respond to scroll events and will maintain its absolute
     * position on the page regardless of scrolling.
     */
    None = 'None'
}

/**
 * Defines the possible reference types for positioning a popup element.
 */
export enum TargetType {
    /**
     * Uses the immediate container element as the reference for positioning.
     * The popup will be positioned relative to its parent container element.
     */
    Container = 'Container',

    /**
     * Uses a custom specified element as the reference for positioning.
     * The popup will be positioned relative to this specified element.
     */
    Relative = 'Relative',

    /**
     * Uses the document body as the reference for positioning.
     * The popup will be positioned relative to the document body, allowing it to be
     * placed anywhere on the page regardless of parent container boundaries.
     */
    Body = 'Body'
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

const CLASSNAME_OPEN: string = 'sf-popup-open';
const CLASSNAME_CLOSE: string = 'sf-popup-close';

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
export const Popup: React.ForwardRefExoticComponent<IPopupProps & React.RefAttributes<IPopup>> =
forwardRef < IPopup, IPopupProps > ((props: IPopupProps, ref: React.Ref < IPopup > ) => {
    const {
        children,
        isOpen = false,
        targetRef,
        relativeElement = null,
        position = { X: 'left', Y: 'top' },
        offsetX = 0,
        offsetY = 0,
        collision = { X: CollisionType.None, Y: CollisionType.None },
        showAnimation = {
            name: 'FadeIn',
            duration: 0,
            timingFunction: 'ease-out'},
        hideAnimation = {
            name: 'FadeOut',
            duration: 0,
            timingFunction: 'ease-out'},
        relateTo = 'body',
        viewPortElementRef,
        zIndex = 1000,
        width = 'auto',
        height = 'auto',
        className = '',
        actionOnScroll = ActionOnScrollType.Reposition,
        onOpen,
        onClose,
        targetType = TargetType.Container,
        onTargetExitViewport,
        style,
        ...rest
    } = props;
    let targetTypes: string = targetType.toString();
    const popupRef: React.RefObject<HTMLDivElement | null> = useRef < HTMLDivElement > (null);
    const initialOpenState: React.RefObject<boolean> = useRef(isOpen);
    const [leftPosition, setLeftPosition] = useState < number > (0);
    const [topPosition, setTopPosition] = useState < number > (0);
    const [popupClass, setPopupClass] = useState < string > (CLASSNAME_CLOSE);
    const [fixedParent, setFixedParent] = useState < boolean > (false);
    const [popupZIndex, setPopupZIndex] = useState < number > (1000);
    const { dir } = useProviderContext();
    const [currentShowAnimation, setCurrentShowAnimation] = useState<AnimationOptions>(showAnimation);
    const [currentHideAnimation, setCurrentHideAnimation] = useState<AnimationOptions>(hideAnimation);
    const [currentRelatedElement, setRelativeElement] = useState<HTMLElement | null>(relativeElement);

    useImperativeHandle(
        ref,
        () => ({
            getScrollableParent: (element: HTMLElement): Element[] => {
                return getScrollableParent(element);
            },
            refreshPosition: (target?: HTMLElement, collision?: boolean): void => {
                refreshPosition(target, collision);
            },
            element: popupRef.current
        }),
        []
    );

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
        } else {
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
    function isEqual(obj1: any, obj2: any): boolean {
        return JSON.stringify(obj1) === JSON.stringify(obj2);
    }

    /**
     * Based on the `relative` element and `offset` values, `Popup` element position will refreshed.
     *
     * @param {HTMLElement} target - The target element.
     * @param {boolean} collision - Specifies whether to check for collision.
     * @returns {void}
     */
    function refreshPosition(target?: HTMLElement, collision?: boolean): void {
        if (target) {
            checkFixedParent(target as HTMLElement);
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
    function updatePosition(): void {
        if (!popupRef.current) {
            return;
        }
        const relateToElement: HTMLElement = getRelateToElement();
        let pos: OffsetPosition = { left: 0, top: 0 };
        if (typeof position.X === 'number' && typeof position.Y === 'number') {
            pos = {
                left: position.X,
                top: position.Y
            };
        } else if (
            ((typeof position.X === 'string' && typeof position.Y === 'number') ||
            (typeof position.X === 'number' && typeof position.Y === 'string')) && targetRef?.current
        ) {
            const anchorPosition: OffsetPosition = getAnchorPosition(
                targetRef.current,
                popupRef.current,
                position,
                offsetX,
                offsetY
            );
            if (typeof position.X === 'string') {
                pos = { left: anchorPosition.left, top: position.Y as number };
            } else {
                pos = { left: position.X as number, top: anchorPosition.top };
            }
        } else if (typeof position.X === 'string' && typeof position.Y === 'string' &&  targetRef?.current) {
            pos = calculatePosition(targetRef, position.X.toLowerCase(), position.Y.toLowerCase());
            pos.left += offsetX;
            pos.top += offsetY;
        } else if (relateToElement) {
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
    function show(animationOptions?: AnimationOptions, relativeElement?: HTMLElement | null): void {
        if (popupRef?.current) {
            addScrollListeners();
            if (relativeElement || zIndex === 1000) {
                const zIndexElement: HTMLElement = !relativeElement ? popupRef?.current as HTMLElement : relativeElement as HTMLElement;
                setPopupZIndex(getZindexPartial(zIndexElement as HTMLElement));
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
                    const animationInstance: IAnimation = Animation(animationOptions);
                    if (animationInstance.animate) {
                        animationInstance.animate(popupRef.current as HTMLElement);
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
    function hide(animationOptions?: AnimationOptions): void {
        if (animationOptions) {
            animationOptions.begin = () => {
                let duration: number = animationOptions.duration ? animationOptions.duration - 30 : 0;
                duration = duration > 0 ? duration : 0;
                setTimeout(() => {
                    setPopupClass(CLASSNAME_CLOSE);
                }, duration);
            };
            animationOptions.end = () => {
                onClose?.();
            };
            if (Animation) {
                const animationInstance: IAnimation = Animation(animationOptions);
                if (animationInstance.animate) {
                    animationInstance.animate(popupRef.current as HTMLElement);
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
    function checkCollision(): void {
        if (!popupRef.current || !targetRef?.current) {
            return;
        }
        const pos: OffsetPosition = { left: 0, top: 0 };
        let isPositionUpdated: boolean = false;
        if (collision.X !== CollisionType.None || collision.Y !== CollisionType.None) {
            const flippedPos: OffsetPosition | null = flip(
                popupRef as React.RefObject<HTMLElement>,
                targetRef,
                offsetX,
                offsetY,
                typeof position.X === 'string' ? position.X : 'left',
                typeof position.Y === 'string' ? position.Y : 'top',
                viewPortElementRef,
                { X: collision.X === CollisionType.Flip, Y: collision.Y === CollisionType.Flip }
            );

            if (flippedPos) {
                pos.left = flippedPos.left;
                pos.top = flippedPos.top;
                isPositionUpdated = true;
            }

            if (collision.X === CollisionType.Fit || collision.Y === CollisionType.Fit) {
                const fittedPos: OffsetPosition | null = fit(
                    popupRef as React.RefObject<HTMLElement>,
                    viewPortElementRef,
                    {
                        X: collision.X === CollisionType.Fit,
                        Y: collision.Y === CollisionType.Fit
                    },
                    pos
                );

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
    function getAnchorPosition(
        anchorEle: HTMLElement,
        element: HTMLElement,
        position: PositionAxis,
        offsetX: number,
        offsetY: number
    ): OffsetPosition {
        const anchorRect: DOMRect = anchorEle.getBoundingClientRect();
        const eleRect: DOMRect = element.getBoundingClientRect();
        const anchorPos: OffsetPosition = { left: 0, top: 0 };
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
    function addScrollListeners(): void {
        if (actionOnScroll !== ActionOnScrollType.None && getRelateToElement()) {
            const scrollParents: Element[] = getScrollableParent(getRelateToElement());
            scrollParents.forEach((parent: Element) => {
                parent.addEventListener('scroll', handleScroll);
            });
        }
    }

    /**
     * Removes scroll listeners.
     *
     * @returns {void}
     */
    function removeScrollListeners(): void {
        if (actionOnScroll !== ActionOnScrollType.None && getRelateToElement()) {
            const scrollParents: Element[] = getScrollableParent(getRelateToElement());
            scrollParents.forEach((parent: Element) => {
                parent.removeEventListener('scroll', handleScroll);
            });
        }
    }

    /**
     * Determines the element to which the popup is related.
     *
     * @returns {HTMLElement} The HTMLElement that the popup is related to.
     */
    function getRelateToElement(): HTMLElement {
        const relateToElement: HTMLElement | string = relateTo === '' || relateTo == null ? document.body : relateTo;
        return typeof relateToElement === 'string' ? (document.querySelector(relateToElement) as HTMLElement) : relateToElement;
    }

    /**
     * Handle scroll event to optionally reposition or hide the popup.
     *
     * @returns {void}
     */
    function handleScroll(): void {
        if (actionOnScroll === ActionOnScrollType.Reposition) {
            refreshPosition();
        } else if (actionOnScroll === ActionOnScrollType.Hide) {
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
    function getScrollableParent(element: HTMLElement): Element[] {
        checkFixedParent(element);
        return getFixedScrollableParent(element, fixedParent);
    }

    /**
     * Checks for fixed or sticky positioned ancestors and updates popup positioning.
     *
     * @param {HTMLElement} element - The starting element to check for fixed or sticky parents.
     * @returns {void} This function does not return a value.
     */
    function checkFixedParent(element: HTMLElement): void {
        let parent: HTMLElement | null = element.parentElement;
        while (parent && parent.tagName !== 'HTML') {
            const { position } = getComputedStyle(parent);
            if (popupRef?.current) {
                const popupElement: HTMLElement = popupRef.current;
                const popupElementStyle: CSSStyleDeclaration = getComputedStyle(popupElement);
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
    function isElementOnViewport(element: Element): boolean {
        const rect: DOMRect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= window.innerHeight &&
            rect.right <= window.innerWidth
        );
    }

    const popupStyle: React.CSSProperties = {
        position: 'absolute',
        left: `${leftPosition}px`,
        top: `${topPosition}px`,
        zIndex: popupZIndex,
        width: width,
        height: height,
        ...style
    };

    const popupClasses: string = [
        'sf-popup sf-control sf-lib',
        (dir === 'rtl') ? 'sf-rtl' : '',
        popupClass,
        className
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <div
            ref={popupRef}
            className={popupClasses}
            style={popupStyle}
            {...rest}
        >
            {children}
        </div>
    );
});

export default React.memo(Popup);

export {
    calculatePosition,
    calculateRelativeBasedPosition,
    flip,
    fit,
    isCollide,
    getZindexPartial,
    getFixedScrollableParent
};

/**
 * Gets the maximum z-index of the given element.
 *
 * @returns {void}
 * @param { HTMLElement } element - Specify the element to get the maximum z-index of it.
 * @private
 */
function getZindexPartial(element: HTMLElement): number {
    let parent: HTMLElement | null = element.parentElement;
    const parentZindex: string[] = [];
    while (parent) {
        if (parent.tagName !== 'BODY') {
            const computedStyle: CSSStyleDeclaration = window.getComputedStyle(parent);
            const index: string = computedStyle.zIndex;
            const position: string = computedStyle.position;
            if (index !== 'auto' && position !== 'static') {
                parentZindex.push(index);
            }
            parent = parent.parentElement;
        } else {
            break;
        }
    }
    const childrenZindex: string[] = [];
    for (let i: number = 0; i < document.body.children.length; i++) {
        const child: Element = document.body.children[i as number] as Element;
        if (!element.isEqualNode(child) && child instanceof HTMLElement) {
            const computedStyle: CSSStyleDeclaration = window.getComputedStyle(child);
            const index: string = computedStyle.zIndex;
            const position: string = computedStyle.position;
            if (index !== 'auto' && position !== 'static') {
                childrenZindex.push(index);
            }
        }
    }
    childrenZindex.push('999');
    const siblingsZindex: string[] = [];
    if (element.parentElement && element.parentElement.tagName !== 'BODY') {
        const childNodes: HTMLElement[] = Array.from(
            element.parentElement.children
        ) as HTMLElement[];
        for (let i: number = 0; i < childNodes.length; i++) {
            const child: Element = childNodes[i as number] as Element;
            if (!element.isEqualNode(child) && child instanceof HTMLElement) {
                const computedStyle: CSSStyleDeclaration = window.getComputedStyle(child);
                const index: string = computedStyle.zIndex;
                const position: string = computedStyle.position;
                if (index !== 'auto' && position !== 'static') {
                    siblingsZindex.push(index);
                }
            }
        }
    }
    const finalValue: string[] = parentZindex.concat(childrenZindex, siblingsZindex
    );
    const currentZindexValue: number = Math.max(...finalValue.map(Number)) + 1;
    return currentZindexValue > 2147483647 ? 2147483647 : currentZindexValue;
}

/**
 * Gets scrollable parent elements for the given element.
 *
 * @param {HTMLElement} element - The element to get the scrollable parents of.
 * @param {boolean} [fixedParent] - Whether to include fixed-positioned parents.
 * @returns {HTMLElement[]} An array of scrollable parent elements.
 */
function getFixedScrollableParent(element: HTMLElement, fixedParent: boolean = false): HTMLElement[] {
    const scrollParents: HTMLElement[] = [];
    const overflowRegex: RegExp = /(auto|scroll)/;
    let parent: HTMLElement | null = element.parentElement;
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
