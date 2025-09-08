import { forwardRef, cloneElement, useRef, useState, useMemo, useCallback, useEffect, useImperativeHandle, Ref, ReactElement, RefObject, JSX } from 'react';
import { useProviderContext } from './provider';
import { getActualElement, getElementRef } from './util';
import { Effect } from './animation';

/**
 * Interface for animate component props
 */
export interface AnimateProps {
    /**
     * Controls whether the animation plays the "in" (enter) or "out" (exit) effect.
     *
     * @default true
     */
    in?: boolean;

    /**
     * Determines if the animation should run on the initial mount.
     *
     * @default true
     */
    appear?: boolean;

    /**
     * Specifies the duration of the animate in milliseconds.
     *
     * @default 400
     */
    duration?: number;

    /**
     * Specifies the timing function for the animate.
     *
     * @default 'ease'
     */
    timingFunction?: string;

    /**
     * Specifies the delay before the animate starts in milliseconds.
     *
     * @default 0
     */
    delay?: number;

    /**
     * The content to be animated - must be a single React element.
     */
    children: ReactElement;

    /**
     * Additional CSS class names to apply to the animate element.
     */
    className?: string;

    /**
     * Triggers when animate is in-progress, providing progress information.
     *
     * @event progress
     */
    onProgress?: (args: AnimateEvent) => void;

    /**
     * Triggers when the animate starts, allowing execution of logic at animate start.
     *
     * @event begin
     */
    onBegin?: (args: AnimateEvent) => void;

    /**
     * Triggers when animate is completed, allowing execution of logic after animate finishes.
     *
     * @event end
     */
    onEnd?: (args: AnimateEvent) => void;

    /**
     * Triggers when animate fails due to errors, providing error information.
     *
     * @event fail
     */
    onFail?: (args: AnimateEvent) => void;

    /**
     * Internal prop to identify the component type for validation
     *
     * @private
     */
    componentType?: 'Fade' | 'Flip' | 'Slide' | 'Zoom';

    /**
     * Internal prop for style declaration for smooth animation
     *
     * @private
     */
    style?: CSSStyleDeclaration;
}

/**
 * Internal interface to trigger animate events with type validation
 *
 * @private
 */
export interface AnimateEvent {
    /**
     * Current timestamp of the animate.
     */
    timeStamp?: number;

    /**
     * The element being animated.
     */
    element?: HTMLElement | { element?: HTMLElement };

    /**
     * animate type.
     */
    effect?: Effect;

    /**
     * animate duration in milliseconds.
     */
    duration?: number;

    /**
     * animate delay in milliseconds.
     */
    delay?: number;

    /**
     * animate timing function.
     */
    timingFunction?: string;
}

export interface IAnimate extends AnimateProps {
    /**
     * animate element reference.
     *
     * @private
     */
    element: HTMLElement | null;

    /**
     * Stops the current animate.
     *
     * @returns {void}
     */
    stop?(): void;
}

/**
 * Collection of easing functions represented as cubic-bezier values
 *
 * @type {Record<string, string>}
 */
const easing: Record<string, string> = {
    ease: 'cubic-bezier(0.250, 0.100, 0.250, 1.000)',
    linear: 'cubic-bezier(0.250, 0.250, 0.750, 0.750)',
    easeIn: 'cubic-bezier(0.420, 0.000, 1.000, 1.000)',
    easeOut: 'cubic-bezier(0.000, 0.000, 0.580, 1.000)',
    easeInOut: 'cubic-bezier(0.420, 0.000, 0.580, 1.000)',
    elasticInOut: 'cubic-bezier(0.5,-0.58,0.38,1.81)',
    elasticIn: 'cubic-bezier(0.17,0.67,0.59,1.81)',
    elasticOut: 'cubic-bezier(0.7,-0.75,0.99,1.01)'
};

/**
 * Maps animate categories to their corresponding effect types
 *
 * @type {Record<string, Effect[]>}
 */
const validEffectGroups: Record<string, Effect[]> = {
    'Fade': ['FadeIn', 'FadeOut', 'FadeZoomIn', 'FadeZoomOut'],
    'Flip': ['FlipLeftDownIn', 'FlipLeftDownOut', 'FlipLeftUpIn', 'FlipLeftUpOut',
        'FlipRightDownIn', 'FlipRightDownOut', 'FlipRightUpIn', 'FlipRightUpOut',
        'FlipXDownIn', 'FlipXDownOut', 'FlipXUpIn', 'FlipXUpOut',
        'FlipYLeftIn', 'FlipYLeftOut', 'FlipYRightIn', 'FlipYRightOut'],
    'Slide': ['SlideBottomIn', 'SlideBottomOut', 'SlideDown', 'SlideLeft',
        'SlideLeftIn', 'SlideLeftOut', 'SlideRight', 'SlideRightIn',
        'SlideRightOut', 'SlideTopIn', 'SlideTopOut', 'SlideUp'],
    'Zoom': ['ZoomIn', 'ZoomOut']
};

type GlobalAnimateProps = { effect?: Effect; } & AnimateProps;
/**
 * The Animate component provides options to animate HTML DOM elements.
 * It allows wrapping content with animation effects that can be controlled via props.
 *
 * ```tsx
 * <Animate effect="FadeIn" duration={3000}>
 *   <div>Animation content</div>
 * </Animate>
 * ```
 */
export const Animate: React.ForwardRefExoticComponent<GlobalAnimateProps & React.RefAttributes<IAnimate>> =
    forwardRef<IAnimate, GlobalAnimateProps>((props: GlobalAnimateProps, ref: Ref<Omit<IAnimate, 'children'>>) => {
        const {
            effect = 'FadeIn',
            duration = 400,
            timingFunction = 'ease',
            delay = 0,
            children,
            onProgress,
            onBegin,
            onEnd,
            onFail,
            componentType = 'Animation',
            className,
            style,
            appear = true,
            ...rest
        } = props;

        const elementRef: RefObject<HTMLElement> = useRef<HTMLElement>(null);
        const animationIdRef: RefObject<number> = useRef<number>(0);
        const isAnimatingRef: RefObject<boolean> = useRef<boolean>(false);
        const timeStampRef: RefObject<number> = useRef<number>(0);
        const prevTimeStampRef: RefObject<number> = useRef<number>(0);
        const { animate } = useProviderContext();
        const combinedRef: (node: HTMLElement | null) => void = (node: HTMLElement) => {
            elementRef.current = node;
            const childRef: React.RefCallback<HTMLElement> | React.RefObject<HTMLElement> | null = getElementRef(children);
            if (typeof childRef === 'function') {
                childRef(node);
            }
            else if (childRef && 'current' in childRef) {
                (childRef as React.RefObject<HTMLElement>).current = node;
            }
        };
        const reflow: Function = (node: Element) => node.scrollTop;

        const getTimingFunction: () => string = useCallback((): string => {
            return (timingFunction in easing)
                ? easing[timingFunction as keyof typeof easing]
                : timingFunction;
        }, [timingFunction]);

        const validateAnimationType: () => boolean = useCallback(() => {
            if (componentType === 'Animation') {
                return true;
            }
            return validEffectGroups[`${componentType}`]?.includes(effect as Effect) || false;
        }, [effect, componentType]);

        const stopAnimation: () => void = useCallback((): void => {
            if (elementRef.current) {
                elementRef.current = getActualElement(elementRef) as HTMLElement;
                elementRef.current.style.animation = '';
                isAnimatingRef.current = false;
                if (animationIdRef.current) {
                    cancelAnimationFrame(animationIdRef.current);
                    animationIdRef.current = 0;
                }
                if (onEnd) {
                    const eventData: AnimateEvent = {
                        element: elementRef.current,
                        effect,
                        duration,
                        delay,
                        timingFunction
                    };
                    onEnd(eventData);
                }
            }
        }, [duration, delay, effect, onEnd, timingFunction]);

        const animationStep: (timestamp: number) => void = useCallback((timestamp: number): void => {
            try {
                if (!elementRef.current || !isAnimatingRef.current) {
                    return;
                }
                elementRef.current = getActualElement(elementRef) as HTMLElement;
                prevTimeStampRef.current = prevTimeStampRef.current === 0 ? timestamp : prevTimeStampRef.current;
                timeStampRef.current = timestamp - prevTimeStampRef.current;
                if (timeStampRef.current === 0 && onBegin) {
                    const eventData: AnimateEvent = {
                        element: elementRef.current,
                        effect,
                        duration,
                        delay,
                        timingFunction: getTimingFunction(),
                        timeStamp: 0
                    };
                    onBegin(eventData);
                }
                if (timeStampRef.current < duration && isAnimatingRef.current) {
                    elementRef.current.style.animation = `${effect} ${duration}ms ${getTimingFunction()}`;
                    if (onProgress) {
                        const eventData: AnimateEvent = {
                            element: elementRef.current,
                            effect,
                            duration,
                            delay,
                            timingFunction: getTimingFunction(),
                            timeStamp: timeStampRef.current
                        };
                        onProgress(eventData);
                    }
                    animationIdRef.current = requestAnimationFrame(animationStep);
                } else {
                    if (elementRef.current) {
                        elementRef.current.style.animation = '';
                        isAnimatingRef.current = false;
                    }
                    if (animationIdRef.current) {
                        cancelAnimationFrame(animationIdRef.current);
                        animationIdRef.current = 0;
                    }
                    if (onEnd && elementRef.current) {
                        const eventData: AnimateEvent = {
                            element: elementRef.current,
                            effect,
                            duration,
                            delay,
                            timingFunction: getTimingFunction(),
                            timeStamp: timeStampRef.current
                        };
                        onEnd(eventData);
                    }
                }
            } catch (e) {
                if (animationIdRef.current) {
                    cancelAnimationFrame(animationIdRef.current);
                    animationIdRef.current = 0;
                }
                isAnimatingRef.current = false;
                if (onFail) {
                    onFail(e);
                }
            }
        }, [duration, delay, effect, onBegin, onEnd, onFail, onProgress, getTimingFunction]);

        const startAnimation: () => void = useCallback((): void => {
            if (!elementRef.current) {
                return undefined;
            }
            if (!validateAnimationType()) {
                if (onFail) {
                    onFail({
                        element: getActualElement(elementRef) as HTMLElement,
                        effect,
                        duration,
                        delay,
                        timingFunction
                    });
                }
                return undefined;
            }
            elementRef.current = getActualElement(elementRef) as HTMLElement;
            timeStampRef.current = 0;
            prevTimeStampRef.current = 0;
            isAnimatingRef.current = true;
            reflow(elementRef.current);
            animationIdRef.current = requestAnimationFrame(animationStep);
        }, [animationStep]);

        useEffect(() => {
            if (!children) {
                return undefined;
            }
            if (!animate || !appear) {
                if (onBegin) {
                    const eventData: AnimateEvent = {
                        element: getActualElement(elementRef),
                        effect,
                        duration,
                        delay,
                        timingFunction
                    };
                    onBegin(eventData);
                }

                if (onEnd) {
                    const eventData: AnimateEvent = {
                        element: getActualElement(elementRef),
                        effect,
                        duration,
                        delay,
                        timingFunction
                    };
                    onEnd(eventData);
                }
                return undefined;
            }
            let timeoutId: number;
            if (delay > 0) {
                timeoutId = window.setTimeout(() => {
                    startAnimation();
                }, delay);
            } else {
                startAnimation();
            }
            return () => {
                if (timeoutId) {
                    window.clearTimeout(timeoutId);
                }
                if (elementRef.current) {
                    elementRef.current = getActualElement(elementRef) as HTMLElement;
                    elementRef.current.style.animation = '';
                    isAnimatingRef.current = false;
                    if (animationIdRef.current) {
                        cancelAnimationFrame(animationIdRef.current);
                        animationIdRef.current = 0;
                    }
                }
            };
        }, [children, animate, delay, effect, duration, timingFunction, onBegin, onEnd, startAnimation, stopAnimation]);

        useImperativeHandle(ref, () => ({
            element: getActualElement(elementRef) as HTMLElement,
            stop: stopAnimation
        }));

        return cloneElement(
            children,
            {
                ref: combinedRef,
                className: [
                    (children as JSX.Element).props.className,
                    className
                ].filter(Boolean).join(' ') || undefined,
                style: {
                    ...(children as JSX.Element).props.style,
                    ...style
                },
                ...rest
            } as React.HTMLAttributes<HTMLElement> & { ref: React.Ref<HTMLElement> }
        );
    });

export default Animate;

/**
 *  Fade component with in/out transition control
 */
export type FadeProps = AnimateProps;

/**
 *  Fade component that automatically handles in/out transitions.
 * Uses FadeIn when `in=true` and FadeOut when `in=false`.
 *
 * @example
 * ```tsx
 * import { Fade } from '@syncfusion/react-base';
 *
 * <Fade in={isVisible} duration={500}>
 *   <div>Content to fade</div>
 * </Fade>
 * ```
 */
export const Fade: React.ForwardRefExoticComponent<FadeProps & React.RefAttributes<IAnimate>> =
    forwardRef<IAnimate, FadeProps>((props: FadeProps, ref: Ref<IAnimate>): JSX.Element => {
        const {
            in: inProp = true,
            appear = true,
            duration = 400,
            timingFunction = 'ease',
            delay = 0,
            onEnd,
            ...rest
        } = props;
        const [hidden, setHidden] = useState<boolean>(() => {
            return !(inProp);
        });
        const isExiting: boolean = useMemo(() => !inProp && !hidden, [inProp, hidden]);
        const prevInProp: React.RefObject<boolean> = useRef(inProp);

        useEffect(() => {
            if (prevInProp.current !== inProp) {
                if (inProp && hidden) {
                    setHidden(false);
                }
                prevInProp.current = inProp;
            }
        }, [inProp, hidden]);

        const handleAnimationEnd: (args: AnimateEvent) => void = useCallback((args: AnimateEvent) => {
            if (!inProp) {
                setHidden(true);
            }
            if (onEnd) {
                onEnd(args);
            }
        }, [inProp, onEnd]);

        if (hidden) {
            return null;
        }

        const effect: Effect = isExiting ? 'FadeOut' : 'FadeIn';

        return (
            <Animate
                ref={ref}
                appear={appear}
                effect={effect}
                duration={duration}
                timingFunction={timingFunction}
                delay={delay}
                onEnd={handleAnimationEnd}
                componentType="Fade"
                style={{
                    visibility: isExiting ? 'hidden' : 'visible',
                    transition: `visibility ${Math.max(1, Math.floor(duration * 0.95))}ms ${timingFunction} ${delay}ms`
                } as CSSStyleDeclaration}
                {...rest}
            />
        );
    });

/**
 *  Zoom component with in/out transition control
 */
export type ZoomProps = AnimateProps;

/**
 *  Zoom component that automatically handles in/out transitions.
 * Uses ZoomIn when `in=true` and ZoomOut when `in=false`.
 *
 * @example
 * ```tsx
 * import { Zoom } from '@syncfusion/react-base';
 *
 * <Zoom in={isVisible} duration={600}>
 *   <div>Content to zoom</div>
 * </Zoom>
 * ```
 */
export const Zoom: React.ForwardRefExoticComponent<ZoomProps & React.RefAttributes<IAnimate>> =
    forwardRef<IAnimate, ZoomProps>((props: ZoomProps, ref: Ref<IAnimate>): JSX.Element => {
        const {
            in: inProp = true,
            appear = true,
            duration = 400,
            timingFunction = 'ease',
            delay = 0,
            onEnd,
            ...rest
        } = props;
        const [hidden, setHidden] = useState<boolean>(() => {
            return !(inProp);
        });
        const isExiting: boolean = useMemo(() => !inProp && !hidden, [inProp, hidden]);
        const prevInProp: React.RefObject<boolean> = useRef(inProp);

        useEffect(() => {
            if (prevInProp.current !== inProp) {
                if (inProp && hidden) {
                    setHidden(false);
                }
                prevInProp.current = inProp;
            }
        }, [inProp, hidden]);

        const handleAnimationEnd: (args: AnimateEvent) => void = useCallback((args: AnimateEvent) => {
            if (!inProp) {
                requestAnimationFrame(() => {
                    setHidden(true);
                });
            }
            if (onEnd) {
                onEnd(args);
            }
        }, [inProp, onEnd]);

        if (hidden) {
            return null;
        }

        const effect: Effect = isExiting ? 'ZoomOut' : 'ZoomIn';

        return (
            <Animate
                ref={ref}
                appear={appear}
                effect={effect}
                duration={duration}
                timingFunction={timingFunction}
                delay={delay}
                onEnd={handleAnimationEnd}
                componentType="Zoom"
                style={{
                    visibility: isExiting ? 'hidden' : 'visible',
                    transition: `visibility ${Math.max(1, Math.floor(duration * 0.95))}ms ${timingFunction} ${delay}ms`
                } as CSSStyleDeclaration}
                {...rest}
            />
        );
    });

/**
 *  Slide component with in/out transition control and direction support
 */
export interface SlideProps extends AnimateProps {
    /**
     * Specifies the direction of the slide animation.
     * Applicable values: 'Top', 'Bottom', 'Left', 'Right'
     *
     * @default 'Right'
     */
    direction?: 'Top' | 'Bottom' | 'Left' | 'Right';
}

/**
 *  Slide component that automatically handles in/out transitions with direction control.
 * Uses Slide{Direction}In when `in=true` and Slide{Direction}Out when `in=false`.
 *
 * @example
 * ```tsx
 * import { Slide } from '@syncfusion/react-base';
 *
 * <Slide in={isVisible} direction="Left" duration={800}>
 *   <div>Content to slide</div>
 * </Slide>
 * ```
 */
export const Slide: React.ForwardRefExoticComponent<SlideProps & React.RefAttributes<IAnimate>> =
    forwardRef<IAnimate, SlideProps>((props: SlideProps, ref: Ref<IAnimate>): JSX.Element => {
        const {
            in: inProp = true,
            appear = true,
            direction = 'Top',
            duration = 400,
            timingFunction = 'ease',
            delay = 0,
            onEnd,
            ...rest
        } = props;
        const [hidden, setHidden] = useState<boolean>(() => {
            return !(inProp);
        });
        const isExiting: boolean = useMemo(() => !inProp && !hidden, [inProp, hidden]);
        const prevInProp: React.RefObject<boolean> = useRef(inProp);

        useEffect(() => {
            if (prevInProp.current !== inProp) {
                if (inProp && hidden) {
                    setHidden(false);
                }
                prevInProp.current = inProp;
            }
        }, [inProp, hidden]);

        const handleAnimationEnd: (args: AnimateEvent) => void  = useCallback((args: AnimateEvent) => {
            if (!inProp) {
                setHidden(true);
            }
            if (onEnd) {
                onEnd(args);
            }
        }, [inProp, onEnd]);

        if (hidden) {
            return null;
        }

        const effect: Effect = isExiting
            ? `Slide${direction}Out` as Effect
            : `Slide${direction}In` as Effect;

        return (
            <Animate
                ref={ref}
                appear={appear}
                effect={effect}
                duration={duration}
                timingFunction={timingFunction}
                delay={delay}
                onEnd={handleAnimationEnd}
                componentType="Slide"
                style={{
                    visibility: isExiting ? 'hidden' : 'visible',
                    transition: `visibility ${Math.max(1, Math.floor(duration * 0.95))}ms ${timingFunction} ${delay}ms`
                } as CSSStyleDeclaration}
                {...rest}
            />
        );
    });

/**
 *  Flip component with in/out transition control and direction support
 */
export interface FlipProps extends AnimateProps {
    /**
     * Specifies the direction of the flip animation.
     * Applicable values: 'LeftDown', 'LeftUp', 'RightDown', 'RightUp', 'XDown', 'XUp', 'YLeft', 'YRight'
     *
     * @default 'XUp'
     */
    direction?: 'LeftDown' | 'LeftUp' | 'RightDown' | 'RightUp' | 'XDown' | 'XUp' | 'YLeft' | 'YRight';
}

/**
 *  Flip component that automatically handles in/out transitions with direction control.
 * Uses Flip{Direction}In when `in=true` and Flip{Direction}Out when `in=false`.
 *
 * @example
 * ```tsx
 * import { Flip } from '@syncfusion/react-base';
 *
 * <Flip in={isVisible} direction="YRight" duration={1200}>
 *   <div>Content to flip</div>
 * </Flip>
 * ```
 */
export const Flip: React.ForwardRefExoticComponent<FlipProps & React.RefAttributes<IAnimate>> =
    forwardRef<IAnimate, FlipProps>((props: FlipProps, ref: Ref<IAnimate>): JSX.Element => {
        const {
            in: inProp = true,
            appear = true,
            direction = 'XUp',
            duration = 400,
            timingFunction = 'ease',
            delay = 0,
            onEnd,
            ...rest
        } = props;
        const [hidden, setHidden] = useState<boolean>(() => {
            return !(inProp);
        });
        const isExiting: boolean = useMemo(() => !inProp && !hidden, [inProp, hidden]);
        const prevInProp: React.RefObject<boolean> = useRef(inProp);

        useEffect(() => {
            if (prevInProp.current !== inProp) {
                if (inProp && hidden) {
                    setHidden(false);
                }
                prevInProp.current = inProp;
            }
        }, [inProp, hidden]);

        const handleAnimationEnd: (args: AnimateEvent) => void  = useCallback((args: AnimateEvent) => {
            if (!inProp) {
                setHidden(true);
            }
            if (onEnd) {
                onEnd(args);
            }
        }, [inProp, onEnd]);

        if (hidden) {
            return null;
        }

        const effect: Effect = isExiting
            ? `Flip${direction}Out` as Effect
            : `Flip${direction}In` as Effect;

        return (
            <Animate
                ref={ref}
                appear={appear}
                effect={effect}
                duration={duration}
                timingFunction={timingFunction}
                delay={delay}
                onEnd={handleAnimationEnd}
                componentType="Flip"
                style={{
                    visibility: isExiting ? 'hidden' : 'visible',
                    transition: `visibility ${Math.max(1, Math.floor(duration * 0.95))}ms ${timingFunction} ${delay}ms`
                } as CSSStyleDeclaration}
                {...rest}
            />
        );
    });
