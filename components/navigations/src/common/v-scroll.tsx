import {
    forwardRef, useImperativeHandle, useRef, HTMLAttributes, useEffect, useState, useMemo, memo,
    RefObject, MouseEvent, TouchEvent, KeyboardEvent, FC, ForwardRefExoticComponent, RefAttributes, UIEvent, useCallback, Ref,
    WheelEvent
} from 'react';
import { ChevronUp, ChevronDown } from '@syncfusion/react-icons';
import {
    Touch, ScrollEventArgs, TouchEventArgs, getUniqueID, useProviderContext,
    SwipeEventArgs, ITouch, Browser
} from '@syncfusion/react-base';

const CLS_ROOT: string = 'sf-vscroll';
const CLS_RTL: string = 'sf-rtl';
const CLS_DISABLE: string = 'sf-overlay';
const CLS_VSCROLLBAR: string = 'sf-vscroll-bar';
const CLS_VSCROLLCON: string = 'sf-vscroll-content';
const CLS_NAVARROW: string = 'sf-nav-arrow';
const CLS_NAVUPARROW: string = 'sf-nav-up-arrow';
const CLS_NAVDOWNARROW: string = 'sf-nav-down-arrow';
const CLS_VSCROLLNAV: string = 'sf-scroll-nav';
const CLS_VSCROLLNAVUP: string = 'sf-scroll-up-nav';
const CLS_VSCROLLNAVDOWN: string = 'sf-scroll-down-nav';
const CLS_DEVICE: string = 'sf-scroll-device';

interface TapEventArgs {
    name: string;
    originalEvent: TouchEventArgs | TouchEvent | KeyboardEvent;
}

interface NavIconProps {
    direction: 'up' | 'down';
    id: string;
    isDisabled: boolean;
    onKeyPress: (e: KeyboardEvent<HTMLDivElement>) => void;
    onKeyUp: (e: KeyboardEvent<HTMLDivElement>) => void;
    onMouseUp: () => void;
    onClick: (e: MouseEvent<HTMLDivElement>) => void;
    onTapHold: (e: TapEventArgs) => void;
}

export interface VScrollProps {
    /**
     * Specifies the up or down scrolling distance of the vertical scrollbar moving.
     * This property controls how far content scrolls when navigation buttons are clicked.
     *
     * @default undefined
     */
    scrollStep?: number;

    /**
     * Specifies whether the VScroll component is enabled or disabled.
     * When set to `true`, the component will be disabled.
     *
     * @default false
     */
    isDisabled?: boolean;
}

/**
 * Specifies the interface for the VScroll component instance.
 */
export interface IVScroll extends VScrollProps {
    /**
     * Specifies the VScroll component element.
     *
     * @private
     * @default null
     */
    element?: HTMLDivElement | null;
}

/**
 * VScroll component introduces vertical scroller when content exceeds the current viewing area.
 * It can be useful for components like Toolbar, Tab which need vertical scrolling.
 * Hidden content can be viewed by touch moving or navigation icon click.
 *
 * ```typescript
 * <VScroll scrollStep={10} className="vscroll-container">
 *   <div>Item 1</div>
 *   <div>Item 2</div>
 *   <div>Item 3</div>
 * </VScroll>
 * ```
 */
export const VScroll: ForwardRefExoticComponent<VScrollProps & HTMLAttributes<HTMLDivElement> & RefAttributes<IVScroll>> = memo(forwardRef<
IVScroll, VScrollProps & HTMLAttributes<HTMLDivElement>
>((props: VScrollProps & HTMLAttributes<HTMLDivElement>, ref: Ref<IVScroll>) => {
    const {
        className = '',
        scrollStep: scrollStepProp = undefined,
        isDisabled = false,
        children,
        ...restProps
    } = props;

    const scrollStep: RefObject<number | undefined> = useRef<number>(scrollStepProp);
    const uniqueId: RefObject<string> = useRef<string>(getUniqueID('vscroll'));
    const [upNavDisabled, setUpNavDisabled] = useState<boolean>(true);
    const [downNavDisabled, setDownNavDisabled] = useState<boolean>(false);
    const { dir }: { dir: string } = useProviderContext();

    const elementRef: RefObject<HTMLDivElement | null> = useRef<HTMLDivElement>(null);
    const scrollEleRef: RefObject<HTMLDivElement | null> = useRef<HTMLDivElement>(null);
    const touchModuleRef: RefObject<ITouch | null> = useRef<ITouch | null>(null);
    const timeoutRef: RefObject<number | null> = useRef<number | null>(null);
    const keyTimeoutRef: RefObject<boolean> = useRef<boolean>(false);
    const keyTimerRef: RefObject<number | null> = useRef<number | null>(null);

    const browserInfo: { isDevice: boolean; } = useMemo(() => ({ isDevice: Browser.isDevice }), []);

    const publicAPI: Partial<IVScroll> = {
        scrollStep: scrollStepProp,
        isDisabled
    };

    useEffect(() => {
        const setScrollState: () => void = () => {
            if (typeof scrollStepProp !== 'number' || scrollStepProp < 0) {
                scrollStep.current = scrollEleRef.current?.offsetHeight || undefined;
            } else {
                scrollStep.current = scrollStepProp;
            }
        };
        setScrollState();
    }, [scrollStepProp]);

    const scrollUpdating: (scrollVal: number, action: string) => void = useCallback((scrollVal: number, action: string) => {
        if (scrollEleRef.current) {
            if (action === 'add') {
                scrollEleRef.current.scrollTop += scrollVal;
            } else {
                scrollEleRef.current.scrollTop -= scrollVal;
            }
        }
    }, []);

    const frameScrollRequest: (scrollVal: number, action: string, isContinuous: boolean) => void = useCallback((
        scrollVal: number, action: string, isContinuous: boolean) => {
        const step: number = 10;
        if (isContinuous) {
            scrollUpdating(scrollVal, action);
            return;
        }
        const animate: () => void = () => {
            if (scrollVal < step) {
                cancelAnimationFrame(step);
            } else {
                scrollUpdating(step, action);
                scrollVal -= step;
                requestAnimationFrame(animate);
            }
        };
        animate();
    }, [scrollUpdating]);

    const eleScrolling: (scrollDis: number, trgt: HTMLElement, isContinuous: boolean) => void = useCallback((
        scrollDis: number, trgt: HTMLElement, isContinuous: boolean) => {
        let elementClassList: DOMTokenList = trgt.classList;
        if (!elementClassList.contains(CLS_VSCROLLNAV)) {
            const sctollNav: HTMLElement | null = trgt.closest('.' + CLS_VSCROLLNAV);
            if (sctollNav) {
                trgt = sctollNav;
            }
        }
        const arrowElement: HTMLElement | null = trgt.querySelector(`.${CLS_NAVARROW}`);
        if (arrowElement) {
            elementClassList = arrowElement.classList;
        }
        if (elementClassList.contains(CLS_NAVDOWNARROW)) {
            frameScrollRequest(scrollDis, 'add', isContinuous);
        } else if (elementClassList.contains(CLS_NAVUPARROW)) {
            frameScrollRequest(scrollDis, '', isContinuous);
        }
    }, [frameScrollRequest]);

    const tapHoldHandler: (e: TapEventArgs | undefined) => void = useCallback((e: TapEventArgs | undefined) => {
        if (e) {
            const trgt: HTMLElement = e.originalEvent.target as HTMLElement;
            const scrollDis: number = 10;
            const timeoutFun: () => void = () => {
                eleScrolling(scrollDis, trgt, true);
            };
            timeoutRef.current = window.setInterval(() => {
                timeoutFun();
            }, 50);
        }
    }, [eleScrolling]);

    const onKeyPress: (e: KeyboardEvent<HTMLDivElement>) => void = useCallback((e: KeyboardEvent<HTMLDivElement>) => {
        if (e.key === 'Enter') {
            const timeoutFun: () => void = () => {
                keyTimeoutRef.current = true;
                eleScrolling(10, e.target as HTMLElement, true);
            };
            keyTimerRef.current = window.setTimeout(() => {
                timeoutFun();
            }, 100);
        }
    }, [eleScrolling]);

    const onKeyUp: (e: KeyboardEvent<HTMLDivElement>) => void = useCallback((e: KeyboardEvent<HTMLDivElement>) => {
        if (e.key !== 'Enter') {
            return;
        }
        if (keyTimeoutRef.current) {
            keyTimeoutRef.current = false;
        } else {
            (e.target as HTMLElement).click();
        }
        if (keyTimerRef.current) {
            clearTimeout(keyTimerRef.current);
        }
    }, []);

    const repeatScroll: () => void = useCallback((): void => {
        clearInterval(timeoutRef?.current as number);
    }, []);

    const clickEventHandler: (e: MouseEvent<HTMLDivElement>) => void = useCallback((e: MouseEvent<HTMLDivElement>) => {
        eleScrolling(scrollStep.current as number, e.target as HTMLElement, false);
    }, [eleScrolling, scrollStep]);

    const wheelEventHandler: (e: WheelEvent<HTMLDivElement>) => void = useCallback((e: WheelEvent<HTMLDivElement>) => {
        e.preventDefault();
        frameScrollRequest(scrollStep.current as number, (e.deltaY > 0 ? 'add' : ''), false);
    }, [frameScrollRequest, scrollStep]);

    const swipeHandler: (e: SwipeEventArgs | undefined) => void = useCallback((e: SwipeEventArgs | undefined) => {
        if (e && scrollEleRef.current) {
            const swipeElement: HTMLElement = scrollEleRef.current as HTMLElement;
            let distance: number = 0;
            if (typeof e.velocity === 'number' && typeof e.distanceY === 'number') {
                if (e.velocity <= 1) {
                    distance = e.distanceY / (e.velocity * 10);
                } else {
                    distance = e.distanceY / e.velocity;
                }
            }
            let start: number = 0.5;
            const animate: () => void = () => {
                const step: number = Math.sin(start);
                if (step <= 0) {
                    cancelAnimationFrame(step);
                } else {
                    if (e.swipeDirection === 'Up') {
                        swipeElement.scrollTop += distance * step;
                    } else if (e.swipeDirection === 'Down') {
                        swipeElement.scrollTop -= distance * step;
                    }
                    start -= 0.02;
                    requestAnimationFrame(animate);
                }
            };
            animate();
        }
    }, []);

    const touchHandler: (e: ScrollEventArgs | undefined) => void = useCallback((e: ScrollEventArgs | undefined) => {
        if (e) {
            const ele: HTMLDivElement | null = scrollEleRef.current;
            if (ele && typeof e.distanceY === 'number') {
                const distance: number = e.distanceY;
                if (e.scrollDirection === 'Up') {
                    ele.scrollTop = ele.scrollTop + distance;
                } else if (e.scrollDirection === 'Down') {
                    ele.scrollTop = ele.scrollTop - distance;
                }
            }
        }
    }, []);

    const scrollHandler: (e: UIEvent<HTMLDivElement>) => void = useCallback((e: UIEvent<HTMLDivElement>) => {
        const target: HTMLElement = e.target as HTMLElement;
        const height: number = target.offsetHeight;
        let scrollTop: number = target.scrollTop;
        if (scrollTop <= 0) {
            scrollTop = -scrollTop;
        }

        if (scrollTop === 0) {
            setUpNavDisabled(true);
            setDownNavDisabled(false);
            repeatScroll();
        } else if (Math.ceil(height + scrollTop + .1) >= target.scrollHeight) {
            setUpNavDisabled(false);
            setDownNavDisabled(true);
            repeatScroll();
        } else {
            setUpNavDisabled(false);
            setDownNavDisabled(false);
        }
    }, [repeatScroll]);

    useImperativeHandle(ref, () => {
        return {
            ...publicAPI as IVScroll,
            element: elementRef.current
        };
    });

    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearInterval(timeoutRef.current);
            }
            if (keyTimerRef.current) {
                clearTimeout(keyTimerRef.current);
            }
        };
    }, []);

    const touchProps: ITouch = useMemo(() => ({
        scroll: touchHandler,
        swipe: swipeHandler
    }), [swipeHandler, touchHandler]);

    touchModuleRef.current = Touch(elementRef as RefObject<HTMLElement>, touchProps);

    const classNames: string = useMemo(() => {
        return [
            'sf-control',
            'sf-lib',
            CLS_ROOT,
            dir === 'rtl' && CLS_RTL,
            browserInfo.isDevice && CLS_DEVICE,
            isDisabled && CLS_DISABLE,
            className
        ].filter(Boolean).join(' ');
    }, [className, dir, browserInfo.isDevice, isDisabled]);

    return (
        <div
            ref={elementRef}
            id={restProps.id || uniqueId.current}
            className={classNames}
            {...restProps}
            onWheel={wheelEventHandler}
        >
            <NavIcon
                direction="up"
                id={uniqueId.current}
                isDisabled={isDisabled || upNavDisabled}
                onKeyPress={onKeyPress}
                onKeyUp={onKeyUp}
                onMouseUp={repeatScroll}
                onClick={clickEventHandler}
                onTapHold={tapHoldHandler}
            />
            <div
                ref={scrollEleRef}
                className={CLS_VSCROLLBAR}
                tabIndex={-1}
                style={{ overflow: 'hidden' }}
                onScroll={scrollHandler}
            >
                <div className={CLS_VSCROLLCON}>
                    {children}
                </div>
            </div>
            <NavIcon
                direction="down"
                id={uniqueId.current}
                isDisabled={isDisabled || downNavDisabled}
                onKeyPress={onKeyPress}
                onKeyUp={onKeyUp}
                onMouseUp={repeatScroll}
                onClick={clickEventHandler}
                onTapHold={tapHoldHandler}
            />
        </div>
    );
}));
VScroll.displayName = 'VScrollComponent';
export default VScroll;

const NavIcon: FC<NavIconProps> = memo(({
    direction,
    id,
    isDisabled,
    onKeyPress,
    onKeyUp,
    onMouseUp,
    onClick,
    onTapHold
}: NavIconProps) => {
    const isDown: boolean = direction === 'down';
    const className: string = `sf-${id}_nav ${CLS_VSCROLLNAV} ${isDown ? CLS_VSCROLLNAVDOWN : CLS_VSCROLLNAVUP}`;
    const arrowClass: string = `${isDown ? CLS_NAVDOWNARROW : CLS_NAVUPARROW} ${CLS_NAVARROW} sf-icons`;
    const navRef: RefObject<HTMLDivElement | null> = useRef<HTMLDivElement>(null);

    const touchProps: ITouch = useMemo(() => ({
        tapHold: onTapHold,
        tapHoldThreshold: 500
    }), [onTapHold]) as ITouch;
    Touch(navRef as RefObject<HTMLElement>, touchProps);

    return (
        <div
            ref={navRef}
            className={`${className} ${isDisabled ? CLS_DISABLE : ''}`}
            role="button"
            id={`${id}_nav_${direction}`}
            aria-label={`Scroll ${direction}`}
            aria-disabled={isDisabled ? 'true' : 'false'}
            tabIndex={isDisabled ? -1 : 0}
            onKeyDown={onKeyPress}
            onKeyUp={onKeyUp}
            onMouseUp={onMouseUp}
            onTouchEnd={onMouseUp}
            onContextMenu={(e: MouseEvent) => e.preventDefault()}
            onClick={onClick}
        >
            <div className={arrowClass}>
                {isDown ? <ChevronDown /> : <ChevronUp />}
            </div>
        </div>
    );
});
NavIcon.displayName = 'NavIcon';
