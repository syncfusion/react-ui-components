import { useRef, useState, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';

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
 * Interface representing the data structure for a single ripple effect.
 *
 * @private
 */
interface RippleItem {
    id: string | number;
    x: number;
    y: number;
    size: number | string;
    duration: number;
    isCenterRipple: boolean;
}

/**
 * Interface representing the data structure RippleContainerRef.
 *
 * @private
 */
interface RippleContainerRef {
    createRipple: (x: number, y: number, size: number, duration: number, isCenterRipple: boolean) => void;
}

declare type Timeout = ReturnType<typeof setTimeout>;

// Individual ripple component
export const RippleElement: React.FC<RippleProps> = ({
    x,
    y,
    size,
    duration,
    onAnimationComplete
}: RippleProps) => {
    const rippleRef: React.RefObject<HTMLDivElement> = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const ripple: HTMLDivElement | null = rippleRef.current;
        if (!ripple) {
            return undefined;
        }
        void ripple.offsetWidth;
        ripple.style.transform = 'scale(1)';
        const fadeTimer: Timeout = setTimeout(() => {
            if (ripple){
                ripple.style.opacity = '0';
            }
        }, duration / 2);
        const cleanupTimer: Timeout = setTimeout(() => {
            if (ripple) {
                ripple.style.opacity = '0';
                ripple.style.visibility = 'hidden';
            }
            if (onAnimationComplete){
                onAnimationComplete();
            }
        }, duration);
        return () => {
            clearTimeout(fadeTimer);
            clearTimeout(cleanupTimer);
        };
    }, [duration, onAnimationComplete]);
    return (
        <div
            ref={rippleRef}
            className="sf-ripple-element"
            style={{
                width: `${size}px`,
                height: `${size}px`,
                left: `${Number(x) - Number(size) / 2}px`,
                top: `${Number(y) - Number(size) / 2}px`,
                borderRadius: '50%',
                backgroundColor: 'currentColor',
                opacity: '0.2',
                transition: `transform ${duration}ms cubic-bezier(0.4, 0, 0.2, 1), opacity ${duration}ms cubic-bezier(0.4, 0, 0.2, 1)`,
                visibility: 'visible'
            }}
        />
    );
};

export const RippleContainer: React.ForwardRefExoticComponent<{ maxRipples?: number } & React.RefAttributes<RippleContainerRef>
> = forwardRef((props: { maxRipples?: number }, ref: React.ForwardedRef<RippleContainerRef>) => {
    const { maxRipples = 2 } = props;
    const containerRef: React.RefObject<HTMLSpanElement> = useRef<HTMLSpanElement>(null);
    const [ripples, setRipples] = useState<RippleItem[]>([]);
    const nextIdRef: React.RefObject<number> = useRef(0);
    const createRipple: (x: number, y: number, size: number, duration: number, isCenterRipple: boolean) => void =
    useCallback((x: number, y: number, size: number, duration: number, isCenterRipple: boolean) => {
        const id: number = nextIdRef.current++;
        setRipples((prevRipples: RippleItem[]) => {
            if (prevRipples.length >= maxRipples) {
                return [
                    ...prevRipples.slice(prevRipples.length - maxRipples + 1),
                    { id, x, y, size, duration, isCenterRipple }
                ];
            }
            return [
                ...prevRipples,
                { id, x, y, size, duration, isCenterRipple }
            ];
        });
    }, [maxRipples]);

    const removeRipple: (id: string | number) => void = useCallback((id: string | number) => {
        setRipples((prevRipples: RippleItem[]) => prevRipples.filter((r: RippleItem) => r.id !== id));
    }, []);

    useImperativeHandle(ref, () => ({
        createRipple
    }));

    return (
        <span ref={containerRef} className="sf-ripple-wrapper">
            {ripples.map((ripple: RippleItem) => (
                <RippleElement
                    key={ripple.id}
                    x={ripple.x}
                    y={ripple.y}
                    size={String(ripple.size)}
                    duration={ripple.duration}
                    isCenterRipple={ripple.isCenterRipple}
                    onAnimationComplete={() => removeRipple(ripple.id)}
                />
            ))}
        </span>
    );
});

const closestParent: (element: HTMLElement, selector: string | null) => HTMLElement | null =
(element: HTMLElement, selector: string | null): HTMLElement | null => {
    if (!selector)
    {
        return null;
    }
    let el: HTMLElement = element;
    while (el) {
        if (el.matches && el.matches(selector)) {
            return el;
        }
        el = el.parentElement as HTMLElement;
        if (!el)
        {
            break;
        }
    }
    return null;
};

/**
 * useRippleEffect function provides wave effect when an element is clicked.
 *
 * @param {boolean} isEnabled - Whether the ripple effect is enabled.
 * @param {RippleOptions} options - Optional configuration for the ripple effect.
 * @returns {RippleEffect} - Ripple effect controller object.
 */
export function useRippleEffect(isEnabled: boolean, options?: RippleOptions): RippleEffect {
    const rippleRef: React.RefObject<RippleContainerRef> = useRef<RippleContainerRef>(null);
    const defaultOptions: RippleOptions = {
        duration: 350,
        isCenterRipple: false,
        ignore: null,
        selector: null,
        ...options
    };
    const maxRipples: number = 2;
    const ignoreRipple: (target: HTMLElement) => boolean = useCallback((target: HTMLElement): boolean => {
        if (!isEnabled || closestParent(target, defaultOptions.ignore || '')) {
            return true;
        }
        return false;
    }, [isEnabled, defaultOptions.ignore]);

    const createRipple: (e: React.MouseEvent<HTMLElement>) => void = useCallback((e: React.MouseEvent<HTMLElement>) => {
        if (!isEnabled || !rippleRef.current)
        {
            return;
        }
        let target: HTMLElement = e.currentTarget;
        if (defaultOptions.selector) {
            const matchedTarget: Element | null = closestParent(target, defaultOptions.selector);
            if (!matchedTarget){
                return;
            }
            target = matchedTarget as HTMLElement;        }

        if (ignoreRipple(target))
        {
            return;
        }
        const rect: DOMRect = target.getBoundingClientRect();
        const offsetX: number = e.pageX - window.pageXOffset;
        const offsetY: number = e.pageY - window.pageYOffset;
        let rippleX: number;
        let rippleY: number;
        let rippleSize: number;
        if (defaultOptions.isCenterRipple) {
            rippleX = rect.width / 2;
            rippleY = rect.height / 2;
            rippleSize = Math.max(rect.width, rect.height);
        } else {
            rippleX = offsetX - rect.left;
            rippleY = offsetY - rect.top;
            const sizeX: number = Math.max(Math.abs(rect.width - rippleX), rippleX) * 2;
            const sizeY: number = Math.max(Math.abs(rect.height - rippleY), rippleY) * 2;
            rippleSize = Math.sqrt(sizeX * sizeX + sizeY * sizeY);
        }
        rippleRef.current.createRipple(
            rippleX,
            rippleY,
            rippleSize,
            defaultOptions.duration || 350,
            defaultOptions.isCenterRipple || false
        );
    }, [isEnabled, defaultOptions, ignoreRipple]);

    const Ripple: () => React.ReactNode = useCallback(() => (
        <RippleContainer
            ref={rippleRef}
            maxRipples={maxRipples}
        />
    ), []);

    return {
        rippleMouseDown: createRipple,
        Ripple
    };
}
