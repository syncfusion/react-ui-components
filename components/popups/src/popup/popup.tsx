import { useRef, useEffect, useState, forwardRef, useImperativeHandle, useCallback, useMemo, RefObject, ForwardRefExoticComponent, RefAttributes, Ref, CSSProperties, memo, InputHTMLAttributes } from 'react';
import { calculatePosition, applyPosition } from '../common/popup-positioning';
import { AnimationOptions, IAnimation, preRender, useProviderContext } from '@syncfusion/react-base';
import { Animation } from '@syncfusion/react-base';
import { getFixedScrollableParent, getZindexPartial, getCollisions, flip, getCoordinateContainer, isElementVisibleAcrossScrollParents, DEFAULT_ANCHOR_ALIGN, DEFAULT_POPUP_ALIGN } from '../common/collision-handler';
import { CollisionAxis, CollisionType, AlignmentPoint, CollisionCoordinates, FlipResult, EMPTY_POSITION } from '../';

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

    /**
     * Specifies the point on the anchor element used for popup positioning. The selected point on the anchor element is used as the reference for aligning the popup.
     *
     * - horizontal: 'left' | 'center' | 'right'
     * - vertical: 'top' | 'center' | 'bottom'
     *
     * @default { horizontal: 'left', vertical: 'top' }
     */
    anchorAlign?: AlignmentPoint;

    /**
     * Specifies the point on the popup element that aligns with the anchor point. The selected point on the popup is positioned against the point defined by the `anchorAlign` property.
     *
     * - horizontal: 'left' | 'center' | 'right'
     * - vertical: 'top' | 'center' | 'bottom'
     *
     * @default { horizontal: 'left', vertical: 'bottom' }
     */
    popupAlign?: AlignmentPoint;

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
    relateTo?: HTMLElement;

    /** Reference to an optional viewport element for collision detection.
     *
     * @default null
     */
    viewPortElementRef?: RefObject<HTMLElement | null>;

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

type IPopupProps = PopupProps & Omit<InputHTMLAttributes<HTMLDivElement>, keyof PopupProps>;

/**
 * Popup component for displaying content in a floating container positioned relative to a target element.
 *
 * ```typescript
 * <Popup
 *   open={true}
 *   relateTo={elementRef}
 *   popupAlign={{ horizontal: 'left', vertical: 'bottom' }}
 *   anchorAlign={{ horizontal: 'left', vertical: 'bottom' }}
 * >
 *   <div>Popup content</div>
 * </Popup>
 * ```
 */
export const Popup: ForwardRefExoticComponent<IPopupProps & RefAttributes<IPopup>> =
    forwardRef<IPopup, IPopupProps>((props: IPopupProps, ref: Ref<IPopup>) => {
        const {
            children,
            open = false,
            anchorAlign = DEFAULT_ANCHOR_ALIGN,
            popupAlign = DEFAULT_POPUP_ALIGN,
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
            relateTo = typeof document !== 'undefined' ? document.body : null,
            viewPortElementRef = typeof document !== 'undefined' ? { current: document.body } : null,
            zIndex = 1000,
            width = 'auto',
            height = 'auto',
            className = '',
            actionOnScroll = ActionOnScrollType.Reposition,
            autoReposition = false,
            onOpen,
            onClose,
            onTargetExitViewport,
            style,
            ...rest
        } = props;
        const popupRef: RefObject<HTMLDivElement | null> = useRef<HTMLDivElement>(null);
        const initialOpenState: RefObject<boolean> = useRef(open);
        const [leftPosition, setLeftPosition] = useState<number>(0);
        const [topPosition, setTopPosition] = useState<number>(0);
        const [popupClass, setPopupClass] = useState<string>(CLASSNAME_CLOSE);
        const [popupZIndex, setPopupZIndex] = useState<number>(1000);
        const [currentAnchorAlign, setAnchorAlign] = useState<AlignmentPoint>(anchorAlign);
        const [currentPopupAlign, setPopupAlign] = useState<AlignmentPoint>(popupAlign);
        const { dir } = useProviderContext();
        const scrollParents: RefObject<Element | null> = useRef<Element | null>(null);
        const resizeObserverRef: RefObject<ResizeObserver | null> = useRef<ResizeObserver | null>(null);
        const fixedParent: RefObject<boolean> = useRef<boolean>(false);
        const targetInvisibleRef: RefObject<boolean> = useRef<boolean>(false);

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
                removeScrollListeners();
            };
        }, []);

        useEffect(() => {
            if (!open && initialOpenState.current === open) {
                return;
            }
            initialOpenState.current = open;
            setAnchorAlign(anchorAlign);
            setPopupAlign(popupAlign);
            if (open) {
                updatePosition();
                if (collision.X !== CollisionType.None || collision.Y !== CollisionType.None) {
                    checkCollision();
                }
                show(animation.show, relateTo);
            } else {
                hide(animation.hide);
            }
        }, [open]);

        useEffect(() => {
            setPopupZIndex(zIndex);
        }, [zIndex]);

        const getPopupBodyState: () => boolean = (): boolean => {
            return !!popupRef.current && popupRef.current.parentElement === document.body;
        };

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
        }, [open]);

        useEffect(() => {
            if (!open) { return; }
            let rafId: number | null = null;
            const onResize: () => void = () => {
                if (rafId != null) { return; }
                rafId = requestAnimationFrame(() => {
                    rafId = null;
                    if (popupRef.current && popupRef.current.getAttribute('sf-animate')) {
                        return;
                    }
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
        }, [open, offsetX, offsetY, relateTo, collision?.X, collision?.Y]);

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

            let pos: EleOffsetPosition = EMPTY_POSITION;

            if (style?.top !== undefined && style?.top !== null && style?.left !== null && style?.left !== undefined) {
                pos = { left: style.left, top: style.top };
            } else if (relateToElement) {
                const display: string = element.style.display;
                element.style.display = '';
                const coordinateContainer: HTMLElement | null = getPopupBodyState() ? null : (viewPortElementRef?.current || null);
                pos = calculatePosition(
                    relateToElement, element, currentAnchorAlign, currentPopupAlign, offsetX, offsetY, coordinateContainer);
                element.style.display = display;
            }

            if (pos) {
                const leftNum: number = typeof pos.left === 'string' ? parseFloat(pos.left) : pos.left;
                const topNum: number = typeof pos.top === 'string' ? parseFloat(pos.top) : pos.top;
                applyPosition(element, { left: leftNum, top: topNum });
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

        const applyCollisionRecovery: (collisionAxis: CollisionCoordinates) => void = (collisionAxis: CollisionCoordinates) => {
            const element: HTMLDivElement | null = popupRef.current;
            const relateToElement: HTMLElement | string = getRelateToElement();
            const collisionContainer: HTMLElement | null =
            getCoordinateContainer(element, relateToElement as HTMLElement, viewPortElementRef);
            const portaled: boolean = getPopupBodyState();
            const coordinateContainer: HTMLElement | null = portaled ? null : collisionContainer;
            const usePageAbsolute: boolean = portaled && !!collisionContainer;
            const collisionAxisConfig: CollisionAxis = { X: collisionAxis.X ? collision.X : CollisionType.None,
                Y: collisionAxis.Y ? collision.Y : CollisionType.None};
            const result: FlipResult | null = flip(
                element, relateToElement as HTMLElement, offsetX, offsetY, currentAnchorAlign, currentPopupAlign,
                collisionContainer, collisionAxisConfig, coordinateContainer, usePageAbsolute);
            if (result) {
                applyPosition(element, result.position);
                setLeftPosition(result.position.left);
                setTopPosition(result.position.top);
                if (result.anchorAlign !== currentAnchorAlign) {
                    setAnchorAlign(result.anchorAlign);
                }
                if (result.popupAlign !== currentPopupAlign) {
                    setPopupAlign(result.popupAlign);
                }
            }
        };

        const checkCollision: () => void = (): void => {
            const element: HTMLDivElement | null = popupRef.current;
            const relateToElement: HTMLElement = getRelateToElement();
            if (!element) {
                return;
            }
            const collisionContainer: HTMLElement | null =
                getCoordinateContainer(element, relateToElement, viewPortElementRef);
            const usePageAbsolute: boolean = getPopupBodyState() && !!collisionContainer;
            const horz: CollisionType | undefined = collision.X;
            const vert: CollisionType | undefined = collision.Y;
            if (horz === CollisionType.None && vert === CollisionType.None) {
                return;
            }
            const hasXCollision: boolean = horz !== CollisionType.None;
            const hasYCollision: boolean = vert !== CollisionType.None;
            const currentLeft: number = parseFloat(element.style.left) || leftPosition;
            const currentTop: number = parseFloat(element.style.top) || topPosition;
            const collisionEdges: string[] = getCollisions(element, collisionContainer, currentLeft, currentTop, usePageAbsolute);
            if (collisionEdges.length === 0) {
                return;
            }
            applyCollisionRecovery({ X: hasXCollision, Y: hasYCollision});
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

        const getRelateToElement: () => HTMLElement = useCallback((): HTMLElement => {
            const relateToElement: HTMLElement | string = !relateTo ? document.body : relateTo;
            return relateToElement as HTMLElement;
        }, [relateTo]);

        const handleScroll: () => void = (): void => {
            if (!initialOpenState.current) { return; }
            if (actionOnScroll === ActionOnScrollType.Reposition) {
                refreshPosition();
            } else if (actionOnScroll === ActionOnScrollType.Hide) {
                hide();
                onClose?.();
            }

            const targetEl: HTMLElement | null = getRelateToElement();
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

        const getScrollableParent: (element: HTMLElement) => Element[] = useCallback((element: HTMLElement): Element[] => {
            checkFixedParent(element);
            return getFixedScrollableParent(element, fixedParent.current);
        }, [checkFixedParent]);

        const popupStyle: CSSProperties = useMemo(() => ({
            position: 'absolute',
            left: `${leftPosition}px`,
            top: `${topPosition}px`,
            zIndex: isNaN(popupZIndex) ? 1000 : popupZIndex,
            width: width,
            height: height,
            ...style
        }), [leftPosition, topPosition, popupZIndex, width, height, style]);

        const popupClasses: string = useMemo(() => [
            'sf-popup sf-control sf-lib',
            dir === 'rtl' ? 'sf-rtl' : '',
            popupClass,
            className
        ].filter(Boolean).join(' '), [dir, popupClass, className]);

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

export default memo(Popup);


