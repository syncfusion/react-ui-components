import * as React from 'react';
import { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { calculatePosition, OffsetPosition, calculateRelativeBasedPosition } from '../common/position';
import { AnimationOptions, IAnimation, preRender, useProviderContext } from '@syncfusion/react-base';
import { Animation } from '@syncfusion/react-base';
import { flip, fit, isCollide, CollisionCoordinates } from '../common/collision';

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

export interface PopupAnimationOptions {
    /**
     * Specifies the animation that should happen when toast opens.
     *
     * @default { show: { name: 'FadeIn', duration: 0, timingFunction: 'ease-out' } }
     */
    show?: AnimationOptions;

    /**
     * Specifies the animation that should happen when toast closes.
     *
     * @default { hide: { name: 'FadeOut', duration: 0, timingFunction: 'ease-out' } }
     */
    hide?: AnimationOptions;
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
    open?: boolean;

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
     * Specifies the animations that should happen when toast opens and closes.
     *
     * @default { show: { name: 'FadeIn', duration: 0, timingFunction: 'ease-out' },
     *            hide: { name: 'FadeOut', duration: 0, timingFunction: 'ease-out' } }
     */
    animation?: PopupAnimationOptions;

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
    viewPortElementRef?: React.RefObject<HTMLElement | null>;

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

interface EleOffsetPosition {
    left: string | number
    top: string | number
}

export interface IPopup extends IPopupProps {
    /**
     * Identifies all scrollable parent elements of a given element.
     *
     * @param {HTMLElement} element - The element for which to find scrollable parents
     * @returns {Element[]} An array of scrollable parent elements that will have scroll event listeners attached
     */
    getScrollableParent(element: HTMLElement): Element[];

    /**
     * Refreshes the popup's position based on the relative element and offset values.
     *
     * @param {HTMLElement} [target] - Optional target element to use as reference for positioning
     * @param {boolean} [collision] - Optional flag to determine whether collision detection should be performed
     * @returns {void}
     */
    refreshPosition(target?: HTMLElement, collision?: boolean): void;

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
 *   open={true}
 *   relateTo={elementRef}
 *   position={{ X: 'left', Y: 'bottom' }}
 * >
 *   <div>Popup content</div>
 * </Popup>
 * ```
 */
export const Popup: React.ForwardRefExoticComponent<IPopupProps & React.RefAttributes<IPopup>> =
    forwardRef<IPopup, IPopupProps>((props: IPopupProps, ref: React.Ref<IPopup>) => {
        const {
            children,
            open = false,
            targetRef,
            relativeElement = null,
            position = { X: 'left', Y: 'top' },
            offsetX = 0,
            offsetY = 0,
            collision = { X: CollisionType.None, Y: CollisionType.None },
            animation = {
                show: {
                    name: 'FadeIn',
                    duration: 0,
                    timingFunction: 'ease-out'
                },
                hide: {
                    name: 'FadeOut',
                    duration: 0,
                    timingFunction: 'ease-out'
                }
            },
            relateTo = 'body',
            viewPortElementRef,
            zIndex = 1000,
            width = 'auto',
            height = 'auto',
            className = '',
            actionOnScroll = ActionOnScrollType.Reposition,
            onOpen,
            onClose,
            onTargetExitViewport,
            style,
            ...rest
        } = props;
        const popupRef: React.RefObject<HTMLDivElement | null> = useRef<HTMLDivElement>(null);
        const initialOpenState: React.RefObject<boolean> = useRef(open);
        const [leftPosition, setLeftPosition] = useState<number>(0);
        const [topPosition, setTopPosition] = useState<number>(0);
        const [popupClass, setPopupClass] = useState<string>(CLASSNAME_CLOSE);
        const [fixedParent, setFixedParent] = useState<boolean>(false);
        const [popupZIndex, setPopupZIndex] = useState<number>(1000);
        const { dir } = useProviderContext();
        const [currentShowAnimation, setCurrentShowAnimation] = useState<AnimationOptions>(animation.show as AnimationOptions);
        const [currentHideAnimation, setCurrentHideAnimation] = useState<AnimationOptions>(animation.hide as AnimationOptions);
        const [currentRelatedElement, setRelativeElement] = useState<HTMLElement | null>(relativeElement);
        const scrollParents: React.RefObject<Element[]> = useRef<Element[]>([]);

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
            return () => {
                setRelativeElement(null);
                removeScrollListeners();
            };
        }, []);

        useEffect(() => {
            updatePosition();
        }, [targetRef, position, offsetX, offsetY, viewPortElementRef]);

        useEffect(() => {
            checkCollision();
        }, [collision]);

        useEffect(() => {
            if (!isEqual(currentShowAnimation, animation.show as AnimationOptions)) {
                setCurrentShowAnimation(animation.show as AnimationOptions);
            }
        }, [animation.show]);

        useEffect(() => {
            if (!isEqual(currentHideAnimation, animation.hide as AnimationOptions)) {
                setCurrentHideAnimation(animation.hide as AnimationOptions);
            }
        }, [currentHideAnimation, animation.hide]);

        useEffect(() => {
            if (!open && initialOpenState.current === open) {
                return;
            }
            initialOpenState.current = open;
            if (open) {
                show(animation.show, currentRelatedElement);
            } else {
                hide(animation.hide);
            }
        }, [open]);

        useEffect(() => {
            setPopupZIndex(zIndex);
        }, [zIndex]);

        useEffect(() => {
            setRelativeElement(relativeElement);
        }, [relativeElement]);

        const isEqual: (previousAnimation: AnimationOptions, currentAnimation: AnimationOptions)
        => boolean = (previousAnimation: AnimationOptions, currentAnimation: AnimationOptions): boolean => {
            return JSON.stringify(previousAnimation) === JSON.stringify(currentAnimation);
        };

        const refreshPosition: (target?: HTMLElement, collision?: boolean) => void = (target?: HTMLElement, collision?: boolean): void => {
            if (target) {
                checkFixedParent(target as HTMLElement);
            }
            updatePosition();
            if (!collision) {
                checkCollision();
            }
        };

        const updatePosition: () => void = (): void => {
            const element: HTMLDivElement | null = popupRef.current;
            const relateToElement: HTMLElement = getRelateToElement();
            let pos: EleOffsetPosition = { left: 0, top: 0 };

            if (!element) {return; }

            if (typeof position.X === 'number' && typeof position.Y === 'number') {
                pos = { left: position.X, top: position.Y };
            } else if ((typeof position.X === 'string' && typeof position.Y === 'number') ||
                (typeof position.X === 'number' && typeof position.Y === 'string')) {
                const anchorPos: OffsetPosition = getAnchorPosition(relateToElement, element, position, offsetX, offsetY);
                pos = typeof position.X === 'string' ? { left: anchorPos.left, top: position.Y } : { left: position.X, top: anchorPos.top };
            } else if (relateToElement) {
                const display: string = element.style.display;
                element.style.display = 'block';
                pos = getAnchorPosition(relateToElement, element, position, offsetX, offsetY);
                element.style.display = display;
            }

            if ((pos !== null)) {
                setLeftPosition(pos.left as number);
                setTopPosition(pos.top as number);
            }
        };

        const show: (animationOptions?: AnimationOptions, relativeElement?: HTMLElement | null)
        => void = (animationOptions?: AnimationOptions, relativeElement?: HTMLElement | null): void => {
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
                            animationInstance.animate(popupRef.current as HTMLElement, animationOptions.duration &&
                                animationOptions.duration > 0 ? undefined : { duration: 0 });
                        }
                    }
                }
            }
        };

        const hide: (animationOptions?: AnimationOptions) => void = (animationOptions?: AnimationOptions): void => {
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
                        animationInstance.animate(popupRef.current as HTMLElement, animationOptions.duration &&
                            animationOptions.duration > 0 ? undefined : { duration: 0 });
                    }
                }
            }
            removeScrollListeners();
        };

        const callFit: (param: CollisionCoordinates) => void = (param: CollisionCoordinates) => {
            const element: HTMLDivElement | null = popupRef.current;
            const viewPortElement: HTMLElement | undefined | null = viewPortElementRef?.current;

            if (!element || !viewPortElement) {
                return;
            }

            if (isCollide(element, viewPortElement).length !== 0) {
                let data: OffsetPosition = { left: 0, top: 0 };
                if (!viewPortElement) {
                    data = fit(element, viewPortElement, param) as OffsetPosition;
                } else {
                    const elementRect: DOMRect = element.getBoundingClientRect();
                    const viewPortRect: DOMRect = viewPortElement.getBoundingClientRect();

                    if (!elementRect || !viewPortRect) {
                        return;
                    }

                    if (param.Y) {
                        if (viewPortRect.top > elementRect.top) {
                            element.style.top = '0px';
                        } else if (viewPortRect.bottom < elementRect.bottom) {
                            element.style.top = `${parseInt(element.style.top, 10) - (elementRect.bottom - viewPortRect.bottom)}px`;
                        }
                    }
                    if (param.X) {
                        if (viewPortRect.right < elementRect.right) {
                            element.style.left = `${parseInt(element.style.left, 10) - (elementRect.right - viewPortRect.right)}px`;
                        } else if (viewPortRect.left > elementRect.left) {
                            element.style.left = `${parseInt(element.style.left, 10) + (viewPortRect.left - elementRect.left)}px`;
                        }
                    }
                }
                if (param.X) {
                    element.style.left = `${data.left}px`;
                }
                if (param.Y) {
                    element.style.top = `${data.top}px`;
                }
            }
        };

        const callFlip: (param: CollisionCoordinates) => void = (param: CollisionCoordinates) => {
            const element: HTMLDivElement | null = popupRef.current;
            const relateToElement: string | HTMLElement = getRelateToElement();
            const viewPortElement: HTMLElement | undefined | null = viewPortElementRef?.current;

            if (!element || !relateToElement) {
                return;
            }

            const flippedPos: OffsetPosition | null =  flip(
                element,
                relateToElement as HTMLElement,
                offsetX,
                offsetY,
                typeof position.X === 'string' ? position.X : 'left',
                typeof position.Y === 'string' ? position.Y : 'top',
                viewPortElement,
                param
            );

            if (flippedPos) {
                element.style.left = `${flippedPos.left}px`;
                element.style.top = `${flippedPos.top}px`;
                setLeftPosition(flippedPos.left);
                setTopPosition(flippedPos.top);
            }
        };

        const checkCollision: () => void = (): void => {
            const horz: CollisionType | undefined = collision.X;
            const vert: CollisionType | undefined = collision.Y;
            if (horz === CollisionType.None && vert === CollisionType.None) {
                return;
            }
            if (horz === CollisionType.Flip && vert === CollisionType.Flip) {
                callFlip({X: true, Y: true});
            } else if (horz === CollisionType.Fit  && vert === CollisionType.Fit) {
                callFit({X: true, Y: true});
            } else {
                if (horz === CollisionType.Flip) {
                    callFlip({X: true, Y: false});
                } else if (vert === CollisionType.Flip) {
                    callFlip({Y: true, X: false});
                }
                if (horz === CollisionType.Fit) {
                    callFit({X: true, Y: false});
                } else if (vert === CollisionType.Fit) {
                    callFit({X: false, Y: true});
                }
            }
        };

        const getAnchorPosition: (anchorEle: HTMLElement, element: HTMLElement,
            position: PositionAxis, offsetX: number, offsetY: number) => OffsetPosition = (
            anchorEle: HTMLElement,
            element: HTMLElement,
            position: PositionAxis,
            offsetX: number,
            offsetY: number
        ): OffsetPosition => {
            const anchorRect: DOMRect = anchorEle.getBoundingClientRect();
            const eleRect: DOMRect = element.getBoundingClientRect();
            const anchorPos: OffsetPosition = { left: 0, top: 0 };
            const targetTypes: string = anchorEle.tagName.toUpperCase() === 'BODY' ? 'body' : 'container';

            switch (position.X) {
            default:
            case 'left':
                break;
            case 'center':
                anchorPos.left = targetTypes === 'body'
                    ? window.innerWidth / 2 - eleRect.width / 2
                    : anchorRect.left + (anchorRect.width / 2 - eleRect.width / 2);
                break;
            case 'right':
                if (targetTypes === 'container') {
                    const scaleX: number = 1;
                    anchorPos.left += ((anchorRect.width - eleRect.width) / scaleX);
                } else {
                    anchorPos.left += (anchorRect.width);
                }
                break;
            }

            switch (position.Y) {
            case 'top':
                break;
            case 'center':
                anchorPos.top = targetTypes === 'body'
                    ? window.innerHeight / 2 - eleRect.height / 2
                    : anchorRect.top + (anchorRect.height / 2 - eleRect.height / 2);
                break;
            case 'bottom':
                anchorPos.top = targetTypes === 'body'
                    ? window.innerHeight - eleRect.height
                    : anchorRect.top + (anchorRect.height - eleRect.height);
                break;
            }
            anchorPos.left += offsetX;
            anchorPos.top += offsetY;

            return anchorPos;
        };

        const addScrollListeners: () => void = (): void => {
            if (actionOnScroll !== ActionOnScrollType.None && getRelateToElement()) {
                const scrollableParents: Element[] = getScrollableParent(getRelateToElement());
                scrollParents.current = scrollableParents;
                scrollableParents.forEach((parent: Element) => {
                    parent.addEventListener('scroll', handleScroll);
                });
            }
        };

        const removeScrollListeners: () => void = (): void => {
            if (actionOnScroll !== ActionOnScrollType.None && getRelateToElement()) {
                scrollParents.current?.forEach((parent: Element) => {
                    if (parent) {
                        parent.removeEventListener('scroll', handleScroll);
                    }
                });
                scrollParents.current = [];
            }
        };

        const getRelateToElement: () => HTMLElement = (): HTMLElement => {
            const relateToElement: HTMLElement | string = relateTo === '' || relateTo === null || relateTo === 'body' ? document.body : relateTo;
            return relateToElement as HTMLElement;
        };

        const handleScroll: () => void = (): void => {
            if (actionOnScroll === ActionOnScrollType.Reposition) {
                refreshPosition();
            } else if (actionOnScroll === ActionOnScrollType.Hide) {
                hide();
                onClose?.();
            }
            if (targetRef?.current && !isElementOnViewport(targetRef?.current)) {
                onTargetExitViewport?.();
            }
        };

        const getScrollableParent: (element: HTMLElement) => Element[] = (element: HTMLElement): Element[] => {
            checkFixedParent(element);
            return getFixedScrollableParent(element, fixedParent);
        };

        const checkFixedParent: (element: HTMLElement) => void = (element: HTMLElement): void => {
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
        };

        const isElementOnViewport: (element: Element) => boolean = (element: Element): boolean => {
            const rect: DOMRect = element.getBoundingClientRect();
            return (
                rect.top >= 0 &&
                rect.left >= 0 &&
                rect.bottom <= window.innerHeight &&
                rect.right <= window.innerWidth
            );
        };

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

const getZindexPartial: (element: HTMLElement) => number = (element: HTMLElement): number => {
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
        const childNodes: HTMLElement[] = Array.from(element.parentElement.children) as HTMLElement[];
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

    const finalValue: string[] = parentZindex.concat(childrenZindex, siblingsZindex);
    const currentZindexValue: number = Math.max(...finalValue.map(Number)) + 1;
    return currentZindexValue > 2147483647 ? 2147483647 : currentZindexValue;
};

const getFixedScrollableParent: (element: HTMLElement, fixedParent?: boolean)
=> HTMLElement[] = (element: HTMLElement, fixedParent: boolean = false): HTMLElement[] => {
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
};
