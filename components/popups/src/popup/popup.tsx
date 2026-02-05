import * as React from 'react';
import { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { calculatePosition, OffsetPosition, calculateRelativeBasedPosition } from '../common/position';
import { AnimationOptions, IAnimation, preRender, useProviderContext } from '@syncfusion/react-base';
import { Animation } from '@syncfusion/react-base';
import { flip, fit, isCollide, CollisionCoordinates, getFixedScrollableParent, getZindexPartial, getElementReact, getTransformElement, getZoomValue } from '../common/collision';

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

/**
 * Specifies how the popup interprets its anchor when calculating position.
 */
export type TargetType = 'relative' | 'container';

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

    /** Specifies whether the popup automatically adjusts its position when the content size changes.
     *
     * @default false
     */
    autoReposition?: boolean;

    /**
     * Specifies how to interpret the anchor for positioning:
     * - 'relative'  => position relative to the anchor element's box (tooltip/dropdown)
     * - 'container' => position relative to the container viewport (BODY or a panel)
     *
     * @default 'relative'
     */
    targetType?: TargetType;

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
            autoReposition = false,
            targetType = 'relative',
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
        const [popupZIndex, setPopupZIndex] = useState<number>(1000);
        const { dir } = useProviderContext();
        const [currentRelatedElement, setRelativeElement] = useState<HTMLElement | null>(relativeElement);
        const scrollParents: React.RefObject<Element | null> = useRef<Element | null>(null);
        const resizeObserverRef: React.RefObject<ResizeObserver | null> = useRef<ResizeObserver | null>(null);
        const fixedParent: React.RefObject<boolean> = useRef<boolean>(false);
        const targetInvisibleRef: React.RefObject<boolean> = React.useRef<boolean>(false);

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
            if (!open) {
                return;
            }
            updatePosition();
        }, [targetRef, position, offsetX, offsetY, viewPortElementRef]);

        useEffect(() => {
            if (!open) {
                return;
            }
            checkCollision();
        }, [collision]);

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

        useEffect(() => {
            if (animation?.show?.duration === 0 && onOpen && popupClass === CLASSNAME_OPEN && open) {
                onOpen();
            }
        }, [popupClass]);

        useEffect(() => {
            if (!open || !autoReposition || !popupRef.current || typeof ResizeObserver === 'undefined') { return; }
            if (resizeObserverRef.current) {
                resizeObserverRef.current.disconnect();
                resizeObserverRef.current = null;
            }

            const resizeInstance: ResizeObserver = new ResizeObserver(() => {
                refreshPosition();
            });
            resizeInstance.observe(popupRef.current);
            resizeObserverRef.current = resizeInstance;

            return () => {
                resizeInstance.disconnect();
                if (resizeObserverRef.current === resizeInstance) {
                    resizeObserverRef.current = null;
                }
            };
        }, [open, position]);

        useEffect(() => {
            if (!open) { return; }
            let rafId: number | null = null;
            const onResize: () => void = () => {
                if (rafId != null) { return; }
                rafId = requestAnimationFrame(() => {
                    rafId = null;
                    refreshPosition();
                });
            };

            window.addEventListener('resize', onResize);
            window.addEventListener('orientationchange', onResize);
            onResize();
            return () => {
                if (rafId != null) {
                    cancelAnimationFrame(rafId);
                    rafId = null;
                }
                window.removeEventListener('resize', onResize);
                window.removeEventListener('orientationchange', onResize);
            };
        }, [open, position?.X, position?.Y, offsetX, offsetY, targetType, relateTo, collision?.X, collision?.Y]);

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
            if (!element) { return; }

            let pos: EleOffsetPosition = { left: 0, top: 0 };

            if (typeof position.X === 'number' && typeof position.Y === 'number') {
                pos = { left: position.X, top: position.Y };
            } else if (style?.top && style?.left) {
                pos = { left: style.left, top: style.top };
            } else if ((typeof position.X === 'string' && typeof position.Y === 'number') || (typeof position.X === 'number' && typeof position.Y === 'string')) {
                const anchorPos: OffsetPosition = getAnchorPosition(relateToElement, element, position, offsetX, offsetY);
                pos = typeof position.X === 'string' ? { left: anchorPos.left, top: position.Y } : { left: position.X, top: anchorPos.top };
            } else if (relateToElement) {
                const display: string = element.style.display;
                element.style.display = '';
                pos = getAnchorPosition(relateToElement, element, position, offsetX, offsetY);
                element.style.display = display;
            }

            if (pos) {
                element.style.left = `${pos.left}px`;
                element.style.top = `${pos.top}px`;
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
                    const originalDisplay: string = popupRef.current.style.display;
                    popupRef.current.style.visibility = 'hidden';
                    popupRef.current.style.display = '';
                    checkCollision();
                    popupRef.current.style.visibility = '';
                    popupRef.current.style.display = originalDisplay;
                }
                if (animationOptions && animationOptions.duration && animationOptions.duration > 0) {
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
                else {
                    setPopupClass(CLASSNAME_OPEN);
                }
            }
        };

        const hide: (animationOptions?: AnimationOptions) => void = (animationOptions?: AnimationOptions): void => {
            if (animationOptions && animationOptions.duration && animationOptions.duration > 0) {
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
            else {
                setPopupClass(CLASSNAME_CLOSE);
                onClose?.();
            }
            removeScrollListeners();
        };

        const callFit: (param: CollisionCoordinates) => void = (param: CollisionCoordinates) => {
            const element: HTMLDivElement | null = popupRef.current;
            const viewPortElement: HTMLElement | undefined | null = viewPortElementRef?.current;

            if (!element) { return; }

            if (isCollide(element, viewPortElement || null).length !== 0) {
                if (!viewPortElement) {
                    const currentPos: OffsetPosition = { left: parseFloat(element.style.left) || leftPosition,
                        top: parseFloat(element.style.top) || topPosition };
                    const data: OffsetPosition = fit(element, null, param, currentPos) as OffsetPosition;
                    if (param.X) { element.style.left = `${data.left}px`; setLeftPosition(data.left); }
                    if (param.Y) { element.style.top = `${data.top}px`; setTopPosition(data.top); }
                } else {
                    const elementRect: DOMRect = getElementReact(element) as DOMRect;
                    const viewPortRect: DOMRect = getElementReact(viewPortElement) as DOMRect;
                    if (!elementRect || !viewPortRect) { return; }
                    if (param.Y) {
                        if (viewPortRect.top > elementRect.top) {
                            element.style.top = '0px'; setTopPosition(0);
                        } else if (viewPortRect.bottom < elementRect.bottom) {
                            const newTop: number = parseInt(element.style.top, 10) - (elementRect.bottom - viewPortRect.bottom);
                            element.style.top = `${newTop}px`; setTopPosition(newTop);
                        }
                    }
                    if (param.X) {
                        if (viewPortRect.right < elementRect.right) {
                            const newLeft: number = parseInt(element.style.left, 10) - (elementRect.right - viewPortRect.right);
                            element.style.left = `${newLeft}px`; setLeftPosition(newLeft);
                        } else if (viewPortRect.left > elementRect.left) {
                            const newLeft: number = parseInt(element.style.left, 10) + (viewPortRect.left - elementRect.left);
                            element.style.left = `${newLeft}px`; setLeftPosition(newLeft);
                        }
                    }
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
            const flippedPos: OffsetPosition | null = flip(
                element,
                relateToElement as HTMLElement,
                offsetX,
                offsetY,
                typeof position.X === 'string' ? position.X : 'left',
                typeof position.Y === 'string' ? position.Y : 'top',
                viewPortElement as HTMLElement,
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

        const getAnchorPosition: (anchorEle: HTMLElement, element: HTMLElement, position: PositionAxis, offsetX: number,
            offsetY: number) =>
        OffsetPosition = (
            anchorEle: HTMLElement,
            element: HTMLElement,
            position: PositionAxis,
            offsetX: number,
            offsetY: number
        ): OffsetPosition => {
            const eleRect: DOMRect = getElementReact(element) as DOMRect;
            const anchorRect: DOMRect = getElementReact(anchorEle) as DOMRect;
            if (!eleRect || !anchorRect) {return { left: 0, top: 0 }; }

            const isBody: boolean = anchorEle.tagName === 'BODY';
            const posX: string = typeof position.X === 'string' ? position.X : 'left';
            const posY: string = typeof position.Y === 'string' ? position.Y : 'top';

            const useDocBase: boolean | null = element.offsetParent && (element.offsetParent as HTMLElement).tagName === 'BODY' && isBody;
            const anchorPos: OffsetPosition = useDocBase
                ? calculatePosition(anchorEle, posX, posY)
                : calculateRelativeBasedPosition(anchorEle, element);

            let scaleX: number = 1;
            let scaleY: number = 1;
            const transformElement: HTMLElement | null = getTransformElement(element);
            if (transformElement) {
                const transformStyle: CSSStyleDeclaration = getComputedStyle(transformElement);
                const transform: string = transformStyle.transform;
                if (transform && transform !== 'none') {
                    const values: RegExpMatchArray | null = transform.match(/matrix\(([^)]+)\)/);
                    if (values && values[1]) {
                        const parts: number[] = values[1].split(',').map(parseFloat);
                        scaleX = parts[0];
                        scaleY = parts[3];
                    }
                }
                const bodyZoom: number = getZoomValue(document.body as unknown as HTMLElement);
                scaleX = bodyZoom * scaleX;
                scaleY = bodyZoom * scaleY;
            }

            if (targetType === 'relative') {
                anchorPos.left += posX === 'center' ? (anchorRect.width / 2) : (posX === 'right' ? anchorRect.width : 0);
                anchorPos.top += posY === 'center' ? (anchorRect.height / 2) : (posY === 'bottom' ? anchorRect.height : 0);
            } else if (isBody) {
                anchorPos.left += posX === 'center' ? ((window.innerWidth - eleRect.width) / 2) : (posX === 'right' ? (window.innerWidth - eleRect.width) : 0);
                anchorPos.top += posY === 'center' ? ((window.innerHeight - eleRect.height) / 2) : (posY === 'bottom' ? (window.innerHeight - eleRect.height) : 0);
            } else {
                anchorPos.left += posX === 'center' ? ((anchorRect.width - (eleRect.width / scaleX)) / 2) : (posX === 'right' ? ((anchorRect.width - (eleRect.width / scaleX))) : 0);
                anchorPos.top += posY === 'center' ? ((anchorRect.height - (eleRect.height / scaleY)) / 2) : (posY === 'bottom' ? ((anchorRect.height - (eleRect.height / scaleY))) : 0);
            }

            anchorPos.left += offsetX;
            anchorPos.top += offsetY;
            return anchorPos;
        };

        const addScrollListeners: () => void = (): void => {
            if (actionOnScroll !== ActionOnScrollType.None && getRelateToElement()) {
                const scrollableParents: Element[] = getScrollableParent(getRelateToElement());
                scrollParents.current = scrollableParents[scrollableParents.length - 1];
                scrollParents.current?.addEventListener('scroll', handleScroll, true);
            }
        };

        const removeScrollListeners: () => void = (): void => {
            if (actionOnScroll !== ActionOnScrollType.None && getRelateToElement()) {
                scrollParents.current?.removeEventListener('scroll', handleScroll, true);
                scrollParents.current = null;
            }
        };

        const getRelateToElement: () => HTMLElement = (): HTMLElement => {
            const relateToElement: HTMLElement | string = relateTo === '' || relateTo === null || relateTo === 'body' ? document.body : relateTo;
            return relateToElement as HTMLElement;
        };

        const isPartiallyVisibleInContainer: (element: HTMLElement, container: HTMLElement | Window) => boolean
            = (element: HTMLElement, container: HTMLElement | Window): boolean => {
                const elRect: DOMRect = getElementReact(element) as DOMRect;
                if (!elRect) { return false; }
                if (container === window) {
                    const viewRect: { top: number; left: number; right: number; bottom: number; }
                        = { top: 0, left: 0, right: window.innerWidth, bottom: window.innerHeight };
                    const interWidth: number = Math.min(elRect.right, viewRect.right) - Math.max(elRect.left, viewRect.left);
                    const interHeight: number = Math.min(elRect.bottom, viewRect.bottom) - Math.max(elRect.top, viewRect.top);
                    return interWidth > 0 && interHeight > 0;
                }

                const cRect: DOMRect = getElementReact(container as HTMLElement) as DOMRect;
                if (!cRect) { return false; }
                const interWidth: number = Math.min(elRect.right, cRect.right) - Math.max(elRect.left, cRect.left);
                const interHeight: number = Math.min(elRect.bottom, cRect.bottom) - Math.max(elRect.top, cRect.top);
                return interWidth > 0 && interHeight > 0;
            };
        const isElementVisibleAcrossScrollParents: (targetEl: HTMLElement) => boolean = (targetEl: HTMLElement): boolean => {
            const parents: HTMLElement[] = getFixedScrollableParent(targetEl, fixedParent.current);
            const containers: (HTMLElement | Window)[] = parents.map((parent: HTMLElement) => {
                return (parent === document.documentElement) ? window : parent;
            });
            if (!containers.includes(window)) {
                containers.push(window);
            }

            for (const container of containers) {
                if (!isPartiallyVisibleInContainer(targetEl, container)) {
                    return false;
                }
            }
            return true;
        };

        const handleScroll: () => void = (): void => {
            if (actionOnScroll === ActionOnScrollType.Reposition) {
                refreshPosition();
            } else if (actionOnScroll === ActionOnScrollType.Hide) {
                hide();
                onClose?.();
            }

            const targetEl: HTMLElement | null = (targetRef?.current as HTMLElement | null) || getRelateToElement();
            if (targetEl) {
                const isVisible: boolean = isElementVisibleAcrossScrollParents(targetEl);
                if (!isVisible && !targetInvisibleRef.current) {
                    onTargetExitViewport?.();
                    targetInvisibleRef.current = true;
                } else if (isVisible && targetInvisibleRef.current) {
                    targetInvisibleRef.current = false;
                }
            }
        };

        const getScrollableParent: (element: HTMLElement) => Element[] = (element: HTMLElement): Element[] => {
            checkFixedParent(element);
            return getFixedScrollableParent(element, fixedParent.current);
        };

        const checkFixedParent: (element: HTMLElement) => void = (element: HTMLElement): void => {
            let parent: HTMLElement | null = element.parentElement;
            while (parent && parent.tagName !== 'HTML') {
                const { position } = getComputedStyle(parent);

                if (popupRef?.current) {
                    const popupElement: HTMLElement = popupRef.current;
                    const popupElementStyle: CSSStyleDeclaration = getComputedStyle(popupElement);

                    if (!popupElement?.offsetParent && position === 'fixed' && popupElementStyle && popupElementStyle.position === 'fixed') {
                        fixedParent.current = true;
                    }
                    parent = parent.parentElement;
                }
            }
        };

        const popupStyle: React.CSSProperties = {
            position: 'absolute',
            left: `${leftPosition}px`,
            top: `${topPosition}px`,
            zIndex: isNaN(popupZIndex) ? 1000 : popupZIndex,
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
