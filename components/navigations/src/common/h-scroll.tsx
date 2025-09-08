import {
    useRef, useState, forwardRef, useImperativeHandle, HTMLAttributes, useEffect, useMemo, memo,
    RefObject, MouseEvent, Ref, useCallback, RefAttributes, KeyboardEvent,
    ForwardRefExoticComponent, UIEvent, FC
} from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@syncfusion/react-icons';
import {
    Touch, TouchEventArgs, getUniqueID, Browser, ITouch, SwipeEventArgs, ScrollEventArgs, useProviderContext
} from '@syncfusion/react-base';

const CLS_ROOT: string = 'sf-hscroll';
const CLS_RTL: string = 'sf-rtl';
const CLS_DISABLE: string = 'sf-overlay';
const CLS_HSCROLLBAR: string = 'sf-hscroll-bar';
const CLS_HSCROLLCON: string = 'sf-hscroll-content';
const CLS_NAVARROW: string = 'sf-hscroll-arrow';
const CLS_NAVRIGHTARROW: string = 'sf-nav-right-arrow';
const CLS_NAVLEFTARROW: string = 'sf-nav-left-arrow';
const CLS_HSCROLLNAV: string = 'sf-hscroll-nav';
const CLS_HSCROLLNAVRIGHT: string = 'sf-scroll-right-nav';
const CLS_HSCROLLNAVLEFT: string = 'sf-scroll-left-nav';
const CLS_DEVICE: string = 'sf-scroll-device';

interface NavIconProps {
    direction: 'left' | 'right';
    id: string;
    isDisabled: boolean;
    onKeyPress: (e: KeyboardEvent<HTMLDivElement>) => void;
    onKeyUp: (e: KeyboardEvent<HTMLDivElement>) => void;
    onMouseUp: () => void;
    onClick: (e: MouseEvent<HTMLDivElement>) => void;
    onTapHold: (e: TapEventArgs) => void;
}

interface TapEventArgs {
    name: string;
    originalEvent: TouchEventArgs | TouchEvent | KeyboardEvent;
}

/**
 * Specifies the props for the HScroll component.
 */
export interface HScrollProps {
    /**
     * Specifies the left or right scrolling distance of the horizontal scrollbar moving.
     * This property controls how far content scrolls when navigation buttons are clicked.
     *
     * @default undefined
     */
    scrollStep?: number;

    /**
     * Specifies whether the HScroll component is enabled or disabled.
     * When set to `true`, the component will be disabled.
     *
     * @default false
     */
    isDisabled?: boolean;
}

/**
 * Specifies the interface for the HScroll component instance.
 */
export interface IHScroll extends HScrollProps {
    /**
     * Specifies the h-scroll component element.
     *
     * @private
     * @default null
     */
    element?: HTMLDivElement | null;
}

/**
 * HScroll component introduces horizontal scroller when content exceeds the current viewing area.
 * It can be useful for components like Toolbar, Tab which need horizontal scrolling.
 * Hidden content can be viewed by touch moving or navigation icon click.
 *
 * ```typescript
 * <HScroll scrollStep={10} className="hscroll-container">
 *   <div>Item 1</div>
 *   <div>Item 2</div>
 *   <div>Item 3</div>
 * </HScroll>
 * ```
 */
export const HScroll: ForwardRefExoticComponent<HScrollProps & HTMLAttributes<HTMLDivElement> & RefAttributes<IHScroll>> = memo(forwardRef<
IHScroll, HScrollProps & HTMLAttributes<HTMLDivElement>
>((props: HScrollProps & HTMLAttributes<HTMLDivElement>, ref: Ref<IHScroll>) => {
    const {
        className = '',
        scrollStep: scrollStepProp = undefined,
        isDisabled = false,
        children,
        ...restProps
    } = props;

    const scrollStep: RefObject<number | undefined> = useRef<number>(scrollStepProp);
    const uniqueId: RefObject<string> = useRef<string>(getUniqueID('hscroll'));
    const [leftNavDisabled, setLeftNavDisabled] = useState<boolean>(true);
    const [rightNavDisabled, setRightNavDisabled] = useState<boolean>(false);
    const { dir }: { dir: string } = useProviderContext();

    const elementRef: RefObject<HTMLDivElement | null> = useRef<HTMLDivElement>(null);
    const scrollEleRef: RefObject<HTMLDivElement | null> = useRef<HTMLDivElement>(null);
    const touchModuleRef: RefObject<ITouch | null> = useRef<ITouch | null>(null);
    const timeoutRef: RefObject<number | null> = useRef<number | null>(null);
    const keyTimeoutRef: RefObject<boolean> = useRef<boolean>(false);
    const keyTimerRef: RefObject<number | null> = useRef<number | null>(null);

    const publicAPI: Partial<IHScroll> = {
        scrollStep: scrollStepProp,
        isDisabled
    };

    const browserInfo: {
        name: string | undefined;
        isDevice: boolean;
        isMozilla: boolean;
    } = useMemo(() => ({
        name: Browser.info.name,
        isDevice: Browser.isDevice,
        isMozilla: Browser.info.name === 'mozilla'
    }), []);

    useEffect(() => {
        const setScrollState: () => void = () => {
            if (typeof scrollStepProp !== 'number' || scrollStepProp < 0) {
                scrollStep.current = scrollEleRef.current?.offsetWidth || undefined;
            } else {
                scrollStep.current = scrollStepProp;
            }
        };
        setScrollState();
    }, [scrollStepProp]);

    const scrollUpdating: (scrollVal: number, action: string) => void = useCallback((scrollVal: number, action: string) => {
        if (scrollEleRef.current) {
            if (action === 'add') {
                scrollEleRef.current.scrollLeft += scrollVal;
            } else {
                scrollEleRef.current.scrollLeft -= scrollVal;
            }
            if (dir === 'rtl' && scrollEleRef.current.scrollLeft > 0) {
                scrollEleRef.current.scrollLeft = 0;
            }
        }
    }, [dir]);

    const frameScrollRequest: (scrollVal: number, action: string, isContinuous: boolean) => void = useCallback((
        scrollVal: number, action: string, isContinuous: boolean) => {
        const step: number = 10;
        if (isContinuous) {
            scrollUpdating(scrollVal, action);
            return;
        }
        const animate: () => void = () => {
            let scrollValue: number = scrollVal;
            let scrollStep: number = step;
            if (elementRef.current?.classList.contains(CLS_RTL) && browserInfo.isMozilla) {
                scrollValue = -scrollVal;
                scrollStep = -step;
            }
            if (scrollValue < step) {
                cancelAnimationFrame(scrollStep);
            } else {
                scrollUpdating(scrollStep, action);
                scrollVal -= scrollStep;
                requestAnimationFrame(animate);
            }
        };
        animate();
    }, [browserInfo.isMozilla, scrollUpdating]);

    const eleScrolling: (scrollDis: number, trgt: HTMLElement, isContinuous: boolean) => void = useCallback((
        scrollDis: number, trgt: HTMLElement, isContinuous: boolean) => {
        const rootEle: HTMLElement = elementRef.current as HTMLElement;
        let classList: DOMTokenList = trgt.classList;
        if (!classList.contains(CLS_HSCROLLNAV)) {
            const sctollNav: HTMLElement | null = trgt.closest('.' + CLS_HSCROLLNAV);
            if (sctollNav) {
                trgt = sctollNav;
            }
        }
        classList = (trgt.querySelector(`.${CLS_NAVARROW}`) as HTMLElement).classList;
        if (rootEle.classList.contains(CLS_RTL) && browserInfo.isMozilla) {
            scrollDis = -scrollDis;
        }
        if ((!rootEle.classList.contains(CLS_RTL) || browserInfo.isMozilla)) {
            if (classList.contains(CLS_NAVRIGHTARROW)) {
                frameScrollRequest(scrollDis, 'add', isContinuous);
            } else {
                frameScrollRequest(scrollDis, '', isContinuous);
            }
        } else {
            if (classList.contains(CLS_NAVLEFTARROW)) {
                frameScrollRequest(scrollDis, 'add', isContinuous);
            } else {
                frameScrollRequest(scrollDis, '', isContinuous);
            }
        }
    }, [browserInfo.isMozilla, frameScrollRequest]);

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
        clearTimeout(keyTimerRef.current as number);
    }, []);

    const repeatScroll: () => void = useCallback((): void => {
        clearInterval(timeoutRef.current as number);
    }, []);

    const clickEventHandler: (e: MouseEvent<HTMLDivElement>) => void = useCallback((e: MouseEvent<HTMLDivElement>) => {
        eleScrolling(scrollStep.current as number, e.target as HTMLElement, false);
    }, [eleScrolling]);

    const swipeHandler: (e: SwipeEventArgs | undefined) => void = useCallback((e: SwipeEventArgs | undefined) => {
        if (e) {
            const swipeEle: HTMLElement = scrollEleRef.current as HTMLElement;
            let distance: number;
            if (typeof e.velocity === 'number' && typeof e.distanceX === 'number') {
                if (e.velocity <= 1) {
                    distance = e.distanceX / (e.velocity * 10);
                } else {
                    distance = e.distanceX / e.velocity;
                }
            }
            let start: number = 0.5;
            const animate: () => void = () => {
                const step: number = Math.sin(start);
                if (step <= 0) {
                    cancelAnimationFrame(step);
                } else {
                    if (e.swipeDirection === 'Left') {
                        swipeEle.scrollLeft += distance * step;
                    } else if (e.swipeDirection === 'Right') {
                        swipeEle.scrollLeft -= distance * step;
                    }
                    start -= 0.5;
                    requestAnimationFrame(animate);
                }
            };
            animate();
        }
    }, []);

    const touchHandler: (e: ScrollEventArgs | undefined) => void = useCallback((e: ScrollEventArgs | undefined) => {
        if (e) {
            const ele: HTMLDivElement | null = scrollEleRef.current;
            if (ele && typeof e.distanceX === 'number') {
                const distance: number = e.distanceX;
                if (e.scrollDirection === 'Left') {
                    ele.scrollLeft = ele.scrollLeft + distance;
                } else if (e.scrollDirection === 'Right') {
                    ele.scrollLeft = ele.scrollLeft - distance;
                }
            }
        }
    }, []);

    const scrollHandler: (e: UIEvent<HTMLDivElement>) => void = (e: UIEvent<HTMLDivElement>) => {
        const target: HTMLElement = e.target as HTMLElement;
        const width: number = target.offsetWidth;
        let scrollLeft: number = target.scrollLeft;
        if (scrollLeft <= 0) {
            scrollLeft = -scrollLeft;
        }

        if (scrollLeft === 0) {
            setLeftNavDisabled(true);
            setRightNavDisabled(false);
            repeatScroll();
        } else if (Math.ceil(width + scrollLeft + .1) >= target.scrollWidth) {
            setLeftNavDisabled(false);
            setRightNavDisabled(true);
            repeatScroll();
        } else {
            setLeftNavDisabled(false);
            setRightNavDisabled(false);
        }
    };

    useImperativeHandle(ref, () => {
        return {
            ...publicAPI as IHScroll,
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
        swipe: swipeHandler,
        scroll: touchHandler
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
            id={uniqueId.current}
            className={classNames}
            {...restProps}
        >
            <NavIcon
                direction='left'
                id={uniqueId.current}
                isDisabled={isDisabled || leftNavDisabled}
                onKeyPress={onKeyPress}
                onKeyUp={onKeyUp}
                onMouseUp={repeatScroll}
                onClick={clickEventHandler}
                onTapHold={tapHoldHandler}
            />
            <div
                ref={scrollEleRef}
                className={`${CLS_HSCROLLBAR} sf-display-flex`}
                style={{ overflowX: 'hidden' }}
                onScroll={scrollHandler}
            >
                <div className={CLS_HSCROLLCON}>
                    {children}
                </div>
            </div>
            <NavIcon
                direction='right'
                id={uniqueId.current}
                isDisabled={isDisabled || rightNavDisabled}
                onKeyPress={onKeyPress}
                onKeyUp={onKeyUp}
                onMouseUp={repeatScroll}
                onClick={clickEventHandler}
                onTapHold={tapHoldHandler}
            />
        </div>
    );
}));
HScroll.displayName = 'HScrollComponent';
export default HScroll;

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
    const isRight: boolean = direction === 'right';
    const className: string = `sf-${id}_nav ${CLS_HSCROLLNAV} ${isRight ? CLS_HSCROLLNAVRIGHT : CLS_HSCROLLNAVLEFT}`;
    const arrowClass: string = `${isRight ? CLS_NAVRIGHTARROW : CLS_NAVLEFTARROW} ${CLS_NAVARROW} sf-icons`;
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
            role='button'
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
                {isRight ? <ChevronRightIcon/> : <ChevronLeftIcon/>}
            </div>
        </div>
    );
});
NavIcon.displayName = 'NavIcon';
