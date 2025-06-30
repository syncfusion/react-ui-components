import * as React from 'react';
import { useRef, useCallback, useEffect, useLayoutEffect, useState, useImperativeHandle, forwardRef, RefObject, HTMLAttributes } from 'react';
import { TapEventArgs, Touch, ITouch, Browser, Animation as AnimationInstance, animationMode, TouchEventArgs, MouseEventArgs } from '@syncfusion/react-base';
import { isNullOrUndefined, getUniqueID, formatUnit } from '@syncfusion/react-base';
import { attributes, closest, preRender, SvgIcon } from '@syncfusion/react-base';
import { IPopup, Popup, PopupAnimationOptions } from '../popup/popup';
import { OffsetPosition, calculatePosition } from '../common/position';
import { isCollide, fit } from '../common/collision';
import { createPortal } from 'react-dom';

const TOUCHEND_HIDE_DELAY: number = 1500;
const TAP_HOLD_THRESHOLD: number = 500;
const SHOW_POINTER_TIP_GAP: number = 0;
const HIDE_POINTER_TIP_GAP: number = 8;
const MOUSE_TRAIL_GAP: number = 2;
const POINTER_ADJUST: number = 2;
const ROOT: string = 'sf-control sf-tooltip sf-lib';
const DEVICE: string = 'sf-bigger';
const CLOSE: string = 'sf-tooltip-close';
const TOOLTIP_WRAP: string = 'sf-tooltip-wrap';
const CONTENT: string = 'sf-tip-content';
const ARROW_TIP: string = 'sf-arrow-tip';
const ARROW_TIP_OUTER: string = 'sf-arrow-tip-outer';
const ARROW_TIP_INNER: string = 'sf-arrow-tip-inner';
const TIP_BOTTOM: string = 'sf-tip-bottom';
const TIP_TOP: string = 'sf-tip-top';
const TIP_LEFT: string = 'sf-tip-left';
const TIP_RIGHT: string = 'sf-tip-right';
const POPUP_ROOT: string = 'sf-popup';
const POPUP_LIB: string = 'sf-lib';
const CLOSE_ICON: string = 'M10.5858 12.0001L2.58575 4.00003L3.99997 2.58582L12 10.5858L20 2.58582L21.4142 4.00003L13.4142 12.0001L21.4142 20L20 21.4142L12 13.4143L4.00003 21.4142L2.58581 20L10.5858 12.0001Z';
const TIP_BOTTOM_ICON: string = 'M20.7929 7H3.20712C2.76167 7 2.53858 7.53857 2.85356 7.85355L11.6465 16.6464C11.8417 16.8417 12.1583 16.8417 12.3536 16.6464L21.1465 7.85355C21.4614 7.53857 21.2384 7 20.7929 7Z';
const TIP_TOP_ICON: string = 'M20.7929 17H3.20712C2.76167 17 2.53858 16.4615 2.85356 16.1465L11.6465 7.3536C11.8417 7.15834 12.1583 7.15834 12.3536 7.3536L21.1465 16.1465C21.4614 16.4615 21.2384 17 20.7929 17Z';
const TIP_RIGHT_ICON: string = 'M7 20.7928L7 3.20706C7 2.76161 7.53857 2.53852 7.85355 2.8535L16.6464 11.6464C16.8417 11.8417 16.8417 12.1582 16.6464 12.3535L7.85355 21.1464C7.53857 21.4614 7 21.2383 7 20.7928Z';
const TIP_LEFT_ICON: string = 'M17 3.20718L17 20.793C17 21.2384 16.4614 21.4615 16.1464 21.1465L7.35354 12.3536C7.15828 12.1584 7.15828 11.8418 7.35354 11.6465L16.1464 2.85363C16.4614 2.53864 17 2.76173 17 3.20718Z';

/**
 * Applicable positions where the Tooltip can be displayed over specific target elements.
 * ```props
 * TopLeft :- The Tooltip is positioned at the top-left corner of the trigger element.
 * TopCenter :- The Tooltip is positioned at the top-center of the trigger element.
 * TopRight :- The Tooltip is positioned at the top-right corner of the trigger element.
 * BottomLeft :- The Tooltip is positioned at the bottom-left corner of the trigger element.
 * BottomCenter :- The Tooltip is positioned at the bottom-center of the trigger element.
 * BottomRight :- The Tooltip is positioned at the bottom-right corner of the trigger element.
 * LeftTop :- The Tooltip is positioned at the left-top corner of the trigger element.
 * LeftCenter :- The Tooltip is positioned at the left-center of the trigger element.
 * LeftBottom :- The Tooltip is positioned at the left-bottom corner of the trigger element.
 * RightTop :- The Tooltip is positioned at the right-top corner of the trigger element.
 * RightCenter :- The Tooltip is positioned at the right-center of the trigger element.
 * RightBottom :- The Tooltip is positioned at the right-bottom corner of the trigger element.
 * ```
 */
export type Position = 'TopLeft' | 'TopCenter' | 'TopRight' | 'BottomLeft' | 'BottomCenter' | 'BottomRight' | 'LeftTop' | 'LeftCenter' | 'LeftBottom' | 'RightTop' | 'RightCenter' | 'RightBottom';

/**
 * Applicable tip positions attached to the Tooltip.
 * ```props
 * Auto :- The tip pointer position is automatically calculated based on the available space.
 * Start :- The tip pointer is positioned at the start of the Tooltip.
 * Middle :- The tip pointer is positioned at the middle of the Tooltip.
 * End :- The tip pointer is positioned at the end of the Tooltip.
 * ```
 */
export type TipPointerPosition = 'Auto' | 'Start' | 'Middle' | 'End';

/**
 * Animation effects that are applicable for Tooltip.
 * ```props
 * FadeIn :- A fade-in animation effect where the Tooltip gradually increases in opacity from 0 to full.
 * FadeOut :- A fade-out animation effect where the Tooltip gradually decreases in opacity from full to 0.
 * FadeZoomIn :- A fade-in animation effect combined with a zoom-in effect.
 * FadeZoomOut :- A fade-out animation effect combined with a zoom-out effect.
 * FlipXDownIn :- A flip-down animation effect where the Tooltip starts upside down and flips down to become fully visible.
 * FlipXDownOut :- A flip-down animation effect where the Tooltip starts fully visible and flips down to become invisible.
 * FlipXUpIn :- A flip-up animation effect where the Tooltip starts upside down and flips up to become fully visible.
 * FlipXUpOut :- A flip-up animation effect where the Tooltip starts fully visible and flips up to become invisible.
 * FlipYLeftIn :- A flip-left animation effect where the Tooltip starts from the right side and flips left to become fully visible.
 * FlipYLeftOut :- A flip-left animation effect where the Tooltip starts from the left side and flips left to become invisible.
 * FlipYRightIn :- A flip-right animation effect where the Tooltip starts from the left side and flips right to become fully visible.
 * FlipYRightOut :- A flip-right animation effect where the Tooltip starts from the right side and flips right to become invisible.
 * ZoomIn :- A zoom-in animation effect where the Tooltip starts small and gradually grows in size to become fully visible.
 * ZoomOut :- A zoom-out animation effect where the Tooltip starts full size and gradually decreases in size to become invisible.
 * None :- No animation effect, the Tooltip simply appears or disappears without any animation.
 * ```
 */
export type Effect = 'FadeIn' | 'FadeOut' | 'FadeZoomIn' | 'FadeZoomOut' | 'FlipXDownIn' | 'FlipXDownOut' | 'FlipXUpIn' | 'FlipXUpOut' | 'FlipYLeftIn' | 'FlipYLeftOut' | 'FlipYRightIn' | 'FlipYRightOut' | 'ZoomIn' | 'ZoomOut' | 'None';

/**
 * Animation options that are common for both open and close actions of the Tooltip.
 */
export interface TooltipAnimationSettings {
    /**
     * Specifies the animation effect on the Tooltip, during open and close actions.
     */
    effect?: Effect;
    /**
     * Specifies the duration of the animation that is completed per animation cycle.
     */
    duration?: number;
    /**
     * Specifies the delay value in milliseconds and indicating the waiting time before animation begins.
     */
    delay?: number;
}

export interface AnimationModel {

    /**
     * Animation settings to be applied on the Tooltip, while it is being shown over the target.
     */
    open?: TooltipAnimationSettings;

    /**
     * Animation settings to be applied on the Tooltip, when it is closed.
     */
    close?: TooltipAnimationSettings;

}

interface ElementPosition extends OffsetPosition {
    position: Position;
    horizontal: string;
    vertical: string;
}

/**
 * @ignore
 */
export interface TooltipProps {
    /**
     * Specifies the width of the Tooltip component.
     *
     * @default 'auto'
     */
    width?: string | number;

    /**
     * Specifies the height of the Tooltip component.
     *
     * @default 'auto'
     */
    height?: string | number;

    /**
     * Specifies the content of the Tooltip.
     *
     * @default -
     */
    content?: React.ReactNode | Function;

    /**
     * Specifies the container element in which the Tooltip's pop-up will be appended.
     *
     * @default 'body'
     */
    container?: React.RefObject<HTMLElement>;

    /**
     * Specifies the target where the Tooltip needs to be displayed.
     *
     * @default -
     */
    target?: React.RefObject<HTMLElement>;

    /**
     * Specifies the position of the Tooltip element with respect to the target element.
     *
     * @default 'TopCenter'
     */
    position?: Position;

    /**
     * Specifies the space between the target and Tooltip element in X axis.
     *
     * @default 0
     */
    offsetX?: number;

    /**
     * Specifies the space between the target and Tooltip element in Y axis.
     *
     * @default 0
     */
    offsetY?: number;

    /**
     * Shows or hides the tip pointer of Tooltip.
     *
     * @default true
     */
    arrow?: boolean;

    /**
     * Specifies the collision target element as page viewport (window) or Tooltip element.
     *
     * @default false
     */
    windowCollision?: boolean;

    /**
     * Specifies the position of tip pointer on Tooltip.
     *
     * @default 'Auto'
     */
    arrowPosition?: TipPointerPosition;

    /**
     * Specifies the device mode to display the Tooltip content.
     *
     * Set of open modes available for Tooltip.
     * ```props
     * Auto :- The Tooltip opens automatically when the trigger element is hovered over.
     * Hover :- The Tooltip opens when the trigger element is hovered over.
     * Click :- The Tooltip opens when the trigger element is clicked.
     * Focus :- The Tooltip opens when the trigger element is focused.
     * Custom :- The Tooltip opens when the trigger element is triggered by a custom event.
     * ```
     *
     * @default 'Auto'
     */
    opensOn?: string;

    /**
     * Allows the Tooltip to follow the mouse pointer movement over the specified target element.
     *
     * @default false
     */
    followCursor?: boolean;

    /**
     * Displays the Tooltip in an open state until closed manually.
     *
     * @default false
     */
    sticky?: boolean;

    /**
     * Determines whether the Tooltip is open or closed.
     * When set to true, the Tooltip will be displayed; when false, it will be hidden.
     *
     * @default false
     */
    open?: boolean;

    /**
     * Specifies the same or different animation options to Tooltip while it is in open or close state.
     *
     * @default { open: { effect: 'FadeIn', duration: 150, delay: 0 }, close: { effect: 'FadeOut', duration: 150, delay: 0 } }
     */
    animation?: AnimationModel;

    /**
     * Opens the Tooltip after the specified delay in milliseconds.
     *
     * @default 0
     */
    openDelay?: number;

    /**
     * Closes the Tooltip after the specified delay in milliseconds.
     *
     * @default 0
     */
    closeDelay?: number;

    /**
     * Triggers before the Tooltip is displayed over the target element.
     *
     * @event onOpen
     */
    onOpen?: (event: Event) => void;

    /**
     * Triggers before the Tooltip hides from the screen.
     *
     * @event onClose
     */
    onClose?: (event: Event) => void;

    /**
     * Specifies a callback function that determines the target elements on which the Tooltip should be displayed.
     * This can be used for showing Tooltip with multiple targets.
     *
     * @param {HTMLElement} args - The target element for which the Tooltip is being evaluated.
     * @returns {boolean} True to display the Tooltip, false to prevent it from showing.
     * @event onFilterTarget
     */
    onFilterTarget?: (args: HTMLElement) => boolean;
}

export interface ITooltip extends TooltipProps {

    /**
     * Specifies the Tooltip component element.
     *
     * @private
     */
    element: HTMLDivElement | null;

    /**
     * Shows the Tooltip on the specified target with specific animation settings.
     *
     * @param {HTMLElement} element - Target element where the Tooltip is to be displayed. (Optional)
     * @param {TooltipAnimationSettings} animation - Sets the specific animation, while showing the Tooltip on the screen. (Optional)
     * @public
     * @returns {void}
     */
    openTooltip(element?: HTMLElement, animationSettings?: TooltipAnimationSettings): void;

    /**
     * Hides the Tooltip with specific animation effect.
     *
     * @param {TooltipAnimationSettings} animation - Sets the specific animation when hiding Tooltip from the screen. (Optional)
     * @public
     * @returns {void}
     */
    closeTooltip(animationSettings?: TooltipAnimationSettings): void;

    /**
     * Refreshes the Tooltip content and its position.
     *
     * @public
     * @returns {void}
     */
    refresh(): void;
}

type TooltipComponentProps = TooltipProps & Omit<HTMLAttributes<HTMLDivElement>, 'content'>;

/**
 * The Tooltip component displays additional information when users hover, click, or focus on an element.
 * It supports various positions, animations, and customization options.
 *
 * ```typescript
 * <Tooltip content={<>This is a Tooltip</>}>
 *   Hover me
 * </Tooltip>
 * ```
 */
export const Tooltip: React.ForwardRefExoticComponent<TooltipComponentProps & React.RefAttributes<ITooltip>> =
forwardRef<ITooltip, TooltipProps>((props: TooltipComponentProps, ref: React.Ref<ITooltip>) => {
    const {
        width = 'auto',
        height = 'auto',
        position = 'TopCenter' as Position,
        offsetX = 0,
        offsetY = 0,
        arrow = true,
        windowCollision = false,
        arrowPosition = 'Auto' as TipPointerPosition,
        opensOn = 'Auto',
        followCursor = false,
        sticky = false,
        animation = {
            open: { effect: 'FadeIn', duration: 150, delay: 0 },
            close: { effect: 'FadeOut', duration: 150, delay: 0 }
        },
        openDelay = 0,
        closeDelay = 0,
        children,
        target,
        content,
        container,
        className,
        open,
        onClose,
        onOpen,
        onFilterTarget,
        ...restProps
    } = props;

    const [isHidden, setIsHidden] = useState(true);
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [PopupAnimation, setPopupAnimation] = useState<PopupAnimationOptions | undefined>(undefined);
    const [openTarget, setOpenTarget] = useState<HTMLElement | null>(null);
    const [isTooltipOpen, setIsTooltipOpen] = useState(false);
    const [tipClass, setTipClassState] = useState<string | null>(TIP_BOTTOM);
    const [elePos, setElePos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
    const [eventProps, setEventProps] = useState<{ [key: string]: object }>({});
    const [arrowInnerTipStyle, setArrowInnerTipStyle] = useState({ top: '', left: '' });
    const [TooltipStyle, setTooltipStyle] = useState<React.HTMLAttributes<HTMLDivElement>>();

    const tooltipEle: React.RefObject<IPopup | null> = useRef<IPopup>(null);
    const timers: React.RefObject<{ show: NodeJS.Timeout | null; hide: NodeJS.Timeout | null; autoClose: NodeJS.Timeout | null; }> =
    useRef<{ show: NodeJS.Timeout | null; hide: NodeJS.Timeout | null; autoClose: NodeJS.Timeout | null; }>
    ({ show: null, hide: null, autoClose: null });
    const tooltipPosition: React.RefObject<{ x: string; y: string; }> = useRef<{ x: string; y: string }>({ x: 'Center', y: 'Top' });
    const touchModule: React.RefObject<ITouch | null> = useRef<ITouch>(null);
    const mouseEventsRef: React.RefObject<{ event: (MouseEvent & TouchEvent) | null; target: HTMLElement | null; }> = useRef<{
        event: MouseEvent & TouchEvent | null, target: HTMLElement | null }>({ event: null, target: null });
    const isBodyContainer: React.RefObject<boolean> = useRef<boolean>(true);
    const targetRef: React.RefObject<HTMLElement | null> = useRef<HTMLElement>(null);
    const rootElemRef: React.RefObject<HTMLDivElement | null> = useRef<HTMLDivElement>(null);
    const arrowElementRef: React.RefObject<HTMLDivElement | null> = useRef<HTMLDivElement>(null);
    const stickyElementRef: React.RefObject<HTMLDivElement | null> = useRef<HTMLDivElement>(null);
    const originalData: React.RefObject<{ event: Event | null; showAnimation: TooltipAnimationSettings | null;
        hideAnimation: TooltipAnimationSettings | null; hideEvent: Event | null; hideTarget: HTMLElement | null;
        showTarget: HTMLElement | null; }> = useRef({ event: null, showAnimation: null, hideAnimation: null, hideEvent: null,
        hideTarget: null, showTarget: null });
    const containerElement: React.RefObject<HTMLElement | null>  = useRef<HTMLElement | null>(typeof document !== 'undefined' ? document.body : null);
    const initialOpenState: React.RefObject<boolean| undefined> = useRef(open);
    const scrolled: React.RefObject<boolean> = useRef<boolean>(false);
    if (Browser.isDevice) {
        touchModule.current = Touch(rootElemRef as RefObject<HTMLElement>);
    }
    const propsRef: Partial<ITooltip> = {
        width: 'auto',
        height: 'auto',
        position: 'TopCenter' as Position,
        offsetX: 0,
        offsetY: 0,
        arrow: true,
        windowCollision: false,
        arrowPosition: 'Auto' as TipPointerPosition,
        opensOn: 'Auto',
        followCursor: false,
        sticky: false,
        animation: {
            open: { effect: 'FadeIn', duration: 150, delay: 0 },
            close: { effect: 'FadeOut', duration: 150, delay: 0 }
        },
        openDelay: 0,
        closeDelay: 0,
        target,
        content,
        container,
        open
    };

    useEffect(() => {
        formatPosition();
        setTipClass(position);
        if (tooltipEle.current && tooltipEle.current.element && targetRef.current) {
            reposition(targetRef.current);
        }
    }, [position]);

    useEffect(() => {
        if (tooltipEle.current && tooltipEle.current.element && targetRef.current) {
            reposition(targetRef.current);
        }
    }, [arrowPosition]);

    useEffect(() => {
        if (tooltipEle.current && tooltipEle.current.element && targetRef.current) {
            tooltipBeforeRender(targetRef.current as HTMLElement);
            tooltipAfterRender(targetRef.current as HTMLElement, originalData.current?.event as Event,
                               originalData.current?.showAnimation as TooltipAnimationSettings);
        }
    }, [isHidden, targetRef.current]);

    useEffect(() => {
        appendContainer();
        wireEvents(opensOn);
        return () => {
            unWireEvents(opensOn);
        };
    }, [opensOn, target]);

    useEffect(() => {
        if (typeof document === 'undefined') {return; }
        document.addEventListener('wheel', scrollHandler as EventListener);
        document.addEventListener('scroll', scrollHandler as EventListener);
        document.addEventListener('touchend', touchEnd as EventListener);
        document.addEventListener('keydown', keyDown as EventListener);
        window.addEventListener('resize', windowResize as EventListener);

        return () => {
            if (typeof document === 'undefined') {return; }
            document.removeEventListener('wheel', scrollHandler as EventListener);
            document.removeEventListener('scroll', scrollHandler as EventListener);
            document.removeEventListener('touchend', touchEnd as EventListener);
            document.removeEventListener('keydown', keyDown as EventListener);
            window.removeEventListener('resize', windowResize as EventListener);
        };
    }, [propsRef]);

    useEffect(() => {
        if (!open && initialOpenState.current === open) {
            return;
        }
        initialOpenState.current = open;
        if (open) {
            if (!originalData.current?.showTarget) {
                showTooltip(target?.current ? target?.current :
                    rootElemRef.current as HTMLElement, animation.open as TooltipAnimationSettings);
            }
            else {
                beforeRenderCallback(originalData.current?.showTarget as HTMLElement, originalData.current.event as Event,
                                     originalData.current.showAnimation as TooltipAnimationSettings);
                originalData.current = { ...originalData.current, showTarget: null };
            }
        }
        else {
            if (!originalData.current?.hideAnimation) {
                hideTooltip(animation.close as TooltipAnimationSettings);
            }
            else {
                mouseMoveBeforeRemove();
                popupHide(originalData.current?.hideAnimation as TooltipAnimationSettings, originalData.current?.hideTarget as HTMLElement,
                          originalData.current?.hideEvent as Event);
                originalData.current = { ...originalData.current, hideEvent: null, hideAnimation: null, hideTarget: null };
            }
        }
    }, [open]);

    useLayoutEffect(() => {
        preRender('tooltip');
        initialize();
        return () => {
            clearTimeout(timers.current.show as NodeJS.Timeout);
            clearTimeout(timers.current.hide as NodeJS.Timeout);
            clearTimeout(timers.current.autoClose as NodeJS.Timeout);
            tooltipEle.current = null;
            touchModule.current = null;
            originalData.current = { event: null, showAnimation: null, hideAnimation: null, hideEvent: null,
                hideTarget: null, showTarget: null };
            mouseEventsRef.current = { event: null, target: null };
        };
    }, []);

    useImperativeHandle(ref, () => ({
        ...propsRef as ITooltip,
        animation: animation as AnimationModel,
        openTooltip: (element?: HTMLElement, animationSettings?: TooltipAnimationSettings) => {
            if (isNullOrUndefined(animationSettings)) { animationSettings = animation?.open as TooltipAnimationSettings; }
            if (isNullOrUndefined(element)) { element = rootElemRef.current as HTMLElement; }
            if (element) {
                if (element.style.display === 'none') { return; }
                showTooltip(element, animationSettings as TooltipAnimationSettings);
            }
        },
        closeTooltip: (animationSettings?: TooltipAnimationSettings) => {
            if (!animationSettings) { animationSettings = animation?.close as TooltipAnimationSettings; }
            hideTooltip(animationSettings as TooltipAnimationSettings);
        },
        refresh: () => {
            if (tooltipEle.current && tooltipEle.current.element) {
                reposition(targetRef.current ? targetRef.current : rootElemRef.current as HTMLElement);
            }
            if (!isNullOrUndefined(props.target) && !isNullOrUndefined(props.target?.current)) {
                unWireEvents(opensOn);
                wireEvents(opensOn);
            }
        },
        element: rootElemRef.current
    }));

    const initialize: () => void = useCallback(() => {
        formatPosition();
    }, [propsRef]);

    const formatPosition: () => void = () => {
        if (!position) { return; }
        let posX: string | null = null;
        let posY: string | null = null;

        if (position.indexOf('Top') === 0 || position.indexOf('Bottom') === 0) {
            [posY, posX] = position.split(/(?=[A-Z])/);
        } else {
            [posX, posY] = position.split(/(?=[A-Z])/);
        }
        tooltipPosition.current.x = posX;
        tooltipPosition.current.y = posY;
    };

    const setTipClass: (position: Position) => string | undefined = useCallback((position: Position) => {
        let newTipClass: string;
        if (isNullOrUndefined(position)) {
            return;
        }
        if (position.indexOf('Right') === 0) {
            newTipClass = TIP_LEFT;
        } else if (position.indexOf('Bottom') === 0) {
            newTipClass = TIP_TOP;
        } else if (position.indexOf('Left') === 0) {
            newTipClass = TIP_RIGHT;
        } else {
            newTipClass = TIP_BOTTOM;
        }
        setTipClassState(newTipClass);
        return newTipClass;
    }, []);

    const renderPopup: (target: HTMLElement) => void  = (target: HTMLElement) => {
        if (followCursor && originalData.current?.event) {
            onMouseMove(originalData.current?.event as MouseEvent);
            return;
        }
        const elePos: OffsetPosition = getTooltipPosition(target);
        setElePos(elePos);
    };

    const getScalingFactor: (target: HTMLElement) => { [key: string]: number }   = (target: HTMLElement): { [key: string]: number } => {
        if (!target) {
            return { x: 1, y: 1 };
        }
        const scalingFactors: { [key: string]: number } = { x: 1, y: 1 };
        const elementsWithTransform: HTMLElement | Element = target.closest('[style*="transform: scale"]') as HTMLElement;
        if (elementsWithTransform && elementsWithTransform !== tooltipEle.current?.element &&
                elementsWithTransform.contains(tooltipEle.current?.element as HTMLElement)) {
            const computedStyle: CSSStyleDeclaration = window.getComputedStyle(elementsWithTransform);
            const transformValue: string = computedStyle.getPropertyValue('transform');
            if (transformValue !== 'none') {
                const scaleMatch: RegExpMatchArray = transformValue.match(/scale\(([\d., ]+)\)/) as RegExpMatchArray;
                if (scaleMatch) {
                    const scaleValues: number[] = scaleMatch[1].split(',').map(parseFloat);
                    scalingFactors.x = scaleValues[0];
                    scalingFactors.y = scaleValues.length > 1 ? scaleValues[1] : scaleValues[0];
                } else {
                    const matrixMatch: RegExpMatchArray = transformValue.match(/matrix\(([^)]+)\)/) as RegExpMatchArray;
                    if (matrixMatch) {
                        const matrixValues: number[] = matrixMatch[1].split(',').map(parseFloat);
                        scalingFactors.x = matrixValues[0];
                        scalingFactors.y = matrixValues[3];
                    }
                }
            }
        }
        return scalingFactors;
    };

    const getTooltipPosition: (target: HTMLElement) => OffsetPosition  = (target: HTMLElement): OffsetPosition => {
        if (tooltipEle.current && tooltipEle.current.element) {
            tooltipEle.current.element.style.visibility = 'hidden';
            tooltipEle.current.element.style.display = 'block';
        }
        const parentWithZoomStyle: HTMLElement = rootElemRef.current?.closest('[style*="zoom"]') as HTMLElement;
        if (parentWithZoomStyle) {
            if (tooltipEle.current && tooltipEle.current.element &&
                !parentWithZoomStyle.contains(tooltipEle.current?.element as HTMLElement) ) {
                tooltipEle.current.element.style.zoom = (getComputedStyle(parentWithZoomStyle) as CSSStyleDeclaration).zoom;
            }
        }
        const pos: OffsetPosition = calculatePosition(target, tooltipPosition.current.x?.toLowerCase() as string,
                                                      tooltipPosition.current.y?.toLowerCase() as string,
                                                      isBodyContainer.current ? undefined :
                                                          containerElement.current?.getBoundingClientRect());
        const scalingFactors: { [key: string]: number } = getScalingFactor(target);
        const offsetPos: OffsetPosition = calculateTooltipOffset(position, scalingFactors.x, scalingFactors.y);
        const collisionPosition: Array<number> = calculateElementPosition(pos, offsetPos);
        const collisionLeft: number = collisionPosition[0];
        const collisionTop: number = collisionPosition[1];
        const elePos: OffsetPosition = collisionFlipFit(target, collisionLeft, collisionTop);
        elePos.left = elePos.left / scalingFactors.x;
        elePos.top = elePos.top / scalingFactors.y;
        if (!isBodyContainer.current && containerElement.current) {
            elePos.left -= (window.scrollX * 2);
            elePos.top -= (window.scrollY * 2);
        }
        if (tooltipEle.current && tooltipEle.current.element) {
            tooltipEle.current.element.style.display = '';
            if (followCursor){
                tooltipEle.current.element.style.visibility = 'visible';
            }
        }
        return elePos;
    };

    const windowResize: () => void  = () => {
        reposition(targetRef.current as HTMLElement);
    };

    const reposition: (target: HTMLElement) => void = (target: HTMLElement) => {
        if (tooltipEle.current && tooltipEle.current.element && target) {
            const elePos: OffsetPosition = getTooltipPosition(target);
            setElePos(elePos);
            tooltipEle.current.element.style.visibility = 'visible';
        }
    };

    const openPopupHandler: () => void = () => {
        if (!followCursor) {
            reposition(targetRef.current as HTMLElement);
        }
    };

    const closePopupHandler: () => void = () => {
        clear();
        const currentTooltipEle: RefObject<HTMLElement> = React.createRef<HTMLElement>() as RefObject<HTMLElement>;
        currentTooltipEle.current = tooltipEle.current?.element as HTMLElement;
        AnimationInstance.stop(currentTooltipEle.current);
        scrolled.current = false;
        setIsHidden(true);
    };

    const calculateTooltipOffset: (position: Position, xScalingFactor: number,
        yScalingFactor: number) => OffsetPosition = (position: Position, xScalingFactor: number,
                                                     yScalingFactor: number): OffsetPosition => {
        const pos: OffsetPosition = {
            top: 0,
            left: 0
        };
        let tipWidth: number;
        let tipHeight: number;
        let tooltipEleWidth: number;
        let tooltipEleHeight: number;
        let tipAdjust: number;
        let tipHeightAdjust: number;
        let tipWidthAdjust: number;
        if (xScalingFactor !== 1 || yScalingFactor !== 1) {
            const tooltipEleRect: DOMRect = tooltipEle.current?.element?.getBoundingClientRect() as DOMRect;
            let arrowEleRect: DOMRect | undefined;
            tooltipEleWidth = Math.round(tooltipEleRect.width);
            tooltipEleHeight = Math.round(tooltipEleRect.height);
            if (arrowElementRef.current) {
                arrowEleRect = arrowElementRef.current.getBoundingClientRect();
            }
            tipWidth = arrowEleRect ? Math.round(arrowEleRect.width) : 0;
            tipHeight = arrowEleRect ? Math.round(arrowEleRect.height) : 0;
            tipAdjust = (arrow ? SHOW_POINTER_TIP_GAP : HIDE_POINTER_TIP_GAP);
            tipHeightAdjust = (tipHeight / 2) + POINTER_ADJUST +
            (tooltipEleHeight - ((tooltipEle.current?.element as HTMLDivElement).clientHeight * yScalingFactor));
            tipWidthAdjust = (tipWidth / 2) + POINTER_ADJUST +
            (tooltipEleWidth - ((tooltipEle.current?.element as HTMLDivElement).clientWidth * xScalingFactor));
        } else {
            tooltipEleWidth = (tooltipEle.current?.element as HTMLDivElement).offsetWidth;
            tooltipEleHeight = (tooltipEle.current?.element as HTMLDivElement).offsetHeight;
            tipWidth = arrowElementRef.current ? arrowElementRef.current.offsetWidth : 0;
            tipHeight = arrowElementRef.current ? arrowElementRef.current.offsetHeight : 0;
            tipAdjust = (arrow ? SHOW_POINTER_TIP_GAP : HIDE_POINTER_TIP_GAP);
            tipHeightAdjust = (tipHeight / 2) + POINTER_ADJUST +
            ((tooltipEle.current?.element as HTMLDivElement).offsetHeight - (tooltipEle.current?.element as HTMLDivElement).clientHeight);
            tipWidthAdjust = (tipWidth / 2) + POINTER_ADJUST +
            ((tooltipEle.current?.element as HTMLDivElement).offsetWidth - (tooltipEle.current?.element as HTMLDivElement).clientWidth);
        }
        if (followCursor) {
            tipAdjust += MOUSE_TRAIL_GAP;
        }
        switch (position) {
        case 'RightTop':
            pos.left += tipWidth + tipAdjust;
            pos.top -= tooltipEleHeight - tipHeightAdjust;
            break;
        case 'RightCenter':
            pos.left += tipWidth + tipAdjust;
            pos.top -= (tooltipEleHeight / 2);
            break;
        case 'RightBottom':
            pos.left += tipWidth + tipAdjust;
            pos.top -= (tipHeightAdjust);
            break;
        case 'BottomRight':
            pos.top += (tipHeight + tipAdjust);
            pos.left -= (tipWidthAdjust);
            break;
        case 'BottomCenter':
            pos.top += (tipHeight + tipAdjust);
            pos.left -= (tooltipEleWidth / 2);
            break;
        case 'BottomLeft':
            pos.top += (tipHeight + tipAdjust);
            pos.left -= (tooltipEleWidth - tipWidthAdjust);
            break;
        case 'LeftBottom':
            pos.left -= (tipWidth + tooltipEleWidth + tipAdjust);
            pos.top -= (tipHeightAdjust);
            break;
        case 'LeftCenter':
            pos.left -= (tipWidth + tooltipEleWidth + tipAdjust);
            pos.top -= (tooltipEleHeight / 2);
            break;
        case 'LeftTop':
            pos.left -= (tipWidth + tooltipEleWidth + tipAdjust);
            pos.top -= (tooltipEleHeight - tipHeightAdjust);
            break;
        case 'TopLeft':
            pos.top -= (tooltipEleHeight + tipHeight + tipAdjust);
            pos.left -= (tooltipEleWidth - tipWidthAdjust);
            break;
        case 'TopRight':
            pos.top -= (tooltipEleHeight + tipHeight + tipAdjust);
            pos.left -= (tipWidthAdjust);
            break;
        default:
            pos.top -= (tooltipEleHeight + tipHeight + tipAdjust);
            pos.left -= (tooltipEleWidth / 2);
            break;
        }
        pos.left += offsetX;
        pos.top += offsetY;
        return pos;
    };

    const adjustArrow: (target: HTMLElement, position: Position, tooltipPositionX: string, tooltipPositionY: string) => void =
    (target: HTMLElement, position: Position, tooltipPositionX: string, tooltipPositionY: string) => {
        if (arrow === false || arrowElementRef.current === null) { return; }
        const currentTipClass: string = setTipClass(position) as string;
        let leftValue: string | undefined; let topValue: string;
        const tooltipWidth: number = (tooltipEle.current?.element as HTMLDivElement).clientWidth;
        const tooltipHeight: number = (tooltipEle.current?.element as HTMLDivElement).clientHeight;
        const tipWidth: number = arrowElementRef.current.offsetWidth; const tipHeight: number = arrowElementRef.current.offsetHeight;
        if (currentTipClass === TIP_BOTTOM || currentTipClass === TIP_TOP) {
            if (currentTipClass === TIP_BOTTOM) {
                topValue = '99.9%';
                setArrowInnerTipStyle((prevStyle: { top: string; left: string; }) => ({ ...prevStyle, top: `-${tipHeight - 2}px` }));
            } else {
                topValue = -(tipHeight - 1) + 'px';
                setArrowInnerTipStyle((prevStyle: { top: string; left: string; }) => ({ ...prevStyle, top: `-${tipHeight - 6}px` }));
            }
            if (target) {
                const tipPosExclude: boolean = tooltipPositionX !== 'Center' || (tooltipWidth > target.offsetWidth) || followCursor;
                if ((tipPosExclude && tooltipPositionX === 'Left') || (!tipPosExclude && arrowPosition === 'End')) {
                    leftValue = (tooltipWidth - tipWidth - POINTER_ADJUST) + 'px';
                } else if ((tipPosExclude && tooltipPositionX === 'Right') || (!tipPosExclude && arrowPosition === 'Start')) {
                    leftValue = POINTER_ADJUST + 'px';
                } else if ((tipPosExclude) && (arrowPosition === 'End' || arrowPosition === 'Start')) {
                    leftValue = (arrowPosition === 'End') ? ((target.offsetWidth + (((tooltipEle.current?.element as HTMLDivElement).offsetWidth - target.offsetWidth) / 2)) - (tipWidth / 2)) - POINTER_ADJUST + 'px'
                        : (((tooltipEle.current?.element as HTMLDivElement).offsetWidth - target.offsetWidth) / 2) - (tipWidth / 2) + POINTER_ADJUST + 'px';
                } else {
                    leftValue = ((tooltipWidth / 2) - (tipWidth / 2)) + 'px';
                }
            }
        } else {
            if (currentTipClass === TIP_RIGHT) {
                leftValue = '99.9%';
                setArrowInnerTipStyle((prevStyle: { top: string; left: string; }) => ({ ...prevStyle, left: `-${tipWidth - 2}px` }));
            } else {
                leftValue = -(tipWidth - 1) + 'px';
                setArrowInnerTipStyle((prevStyle: { top: string; left: string; }) => ({ ...prevStyle, left: `${-(tipWidth) + (tipWidth - 2)}px` }));
            }
            const tipPosExclude: boolean = tooltipPositionY !== 'Center' || (tooltipHeight > target.offsetHeight) || followCursor;
            if ((tipPosExclude && tooltipPositionY === 'Top') || (!tipPosExclude && arrowPosition === 'End')) {
                topValue = (tooltipHeight - tipHeight - POINTER_ADJUST) + 'px';
            } else if ((tipPosExclude && tooltipPositionY === 'Bottom') || (!tipPosExclude && arrowPosition === 'Start')) {
                topValue = POINTER_ADJUST + 'px';
            } else {
                topValue = ((tooltipHeight / 2) - (tipHeight / 2)) + 'px';
            }
        }
        arrowElementRef.current.style.top = topValue;
        arrowElementRef.current.style.left = leftValue as string;
    };

    const renderContent: () => React.ReactNode = (): React.ReactNode => {
        if (targetRef.current && !isNullOrUndefined(targetRef.current.getAttribute('title'))) {
            targetRef.current.setAttribute('data-content', targetRef.current.getAttribute('title') as string);
            targetRef.current.removeAttribute('title');
        }
        if (React.isValidElement(content)) {
            return content;
        }
        let tooltipContent: string | React.ReactNode = '';
        if (typeof content === 'function') {
            tooltipContent = content();
        } else if (targetRef?.current?.getAttribute('data-content')) {
            tooltipContent = targetRef.current.getAttribute('data-content');
        }
        return tooltipContent;
    };

    const addDescribedBy: (target: HTMLElement, id: string) => void = (target: HTMLElement, id: string) => {
        const describedby: string[] = (target.getAttribute('aria-describedby') || '').split(/\s+/);
        if (describedby.indexOf(id) < 0) { describedby.push(id); }
        attributes(target, { 'aria-describedby': describedby.join(' ').trim(), 'data-tooltip-id': id});
    };

    const removeDescribedBy: (target: HTMLElement) => void = (target: HTMLElement) => {
        const id: string = target.getAttribute('data-tooltip-id') as string;
        const describedby: string[] = (target.getAttribute('aria-describedby') || '').split(/\s+/);
        const index: number = describedby.indexOf(id);
        if (index !== -1) {
            describedby.splice(index, 1);
        }
        target.removeAttribute('data-tooltip-id');
        const orgDescribedby: string = describedby.join(' ').trim();
        if (orgDescribedby) {
            target.setAttribute('aria-describedby', orgDescribedby);
        } else {
            target.removeAttribute('aria-describedby');
        }
    };

    const tapHoldHandler: (evt?: TapEventArgs) => void = useCallback((evt?: TapEventArgs) => {
        if (evt) {
            clearTimeout(timers.current.autoClose as NodeJS.Timeout);
            targetHover(evt.originalEvent);
        }
    }, []);

    const touchEndHandler: () => void = () => {
        if (sticky) {
            return;
        }
        const close: () => void = () => {
            closeTooltip();
        };
        timers.current.autoClose = setTimeout(close, TOUCHEND_HIDE_DELAY);
    };

    const targetClick: (e: Event) => void = (e: Event) => {
        let target: HTMLElement | undefined;
        if (props.target?.current) {
            target = props.target.current.contains(e.target as Node) ? props.target.current : undefined;
        } else {
            target = onFilterTarget ? e.target as HTMLElement : rootElemRef.current as HTMLElement;
        }
        if (isNullOrUndefined(target)) {
            return;
        }
        const mouseEvent: MouseEvent = e as MouseEvent;
        if (!tooltipEle.current || (tooltipEle.current && target !== targetRef.current)) {
            if (!(mouseEvent.type === 'mousedown' && mouseEvent.button === 2)) {
                targetHover(e);
            }
        } else if (!sticky) {
            hideTooltip(animation.close as TooltipAnimationSettings, e, target);
        }
    };

    const targetHover: (e: TouchEventArgs | MouseEventArgs | Event) => void = (e: TouchEventArgs | MouseEventArgs | Event) => {
        let target: HTMLElement | undefined;
        if (onFilterTarget) {
            const isTarget: boolean = onFilterTarget?.(e.target as HTMLElement);
            if (!isTarget) {return; }
            target = e.target as HTMLElement;
        } else {
            if (props.target?.current) {
                target = props.target.current.contains(e.target as Node) ? props.target.current : undefined;
            } else {
                target = rootElemRef.current as HTMLElement;
            }
        }
        if (isNullOrUndefined(target) || (tooltipEle.current && target === targetRef.current && !followCursor)) { return; }
        if (tooltipEle.current && tooltipEle.current.element?.getAttribute('sf-animation-id')) {
            const delay: number = closeDelay + (animation?.close?.delay ? animation.close.delay : 0) +
            (animation?.close?.duration ? animation.close.duration : 0);
            setTimeout(() => {
                restoreElement(target as HTMLElement);
                showTooltip(target as HTMLElement, animation.open as TooltipAnimationSettings, e as Event);
            }, delay);
            return;
        }
        restoreElement(target as HTMLElement);
        showTooltip(target as HTMLElement, animation.open as TooltipAnimationSettings, e as Event);
    };

    const mouseMoveBeforeOpen: (e: MouseEvent & TouchEvent) => void = (e: MouseEvent & TouchEvent) => {
        mouseEventsRef.current.event = e;
    };

    const mouseMoveBeforeRemove: () => void = () => {
        if (mouseEventsRef.current.target) {
            mouseEventsRef.current.target.removeEventListener('mousemove', mouseMoveBeforeOpen as EventListener);
            mouseEventsRef.current.target.removeEventListener('touchstart', mouseMoveBeforeOpen as EventListener);
        }
    };

    const showTooltip: (target: HTMLElement, showAnimation: TooltipAnimationSettings, e?: Event) => void =
    (target: HTMLElement, showAnimation: TooltipAnimationSettings, e?: Event) => {
        clearTimeout(timers.current.show as NodeJS.Timeout);
        clearTimeout(timers.current.hide as NodeJS.Timeout );
        if (openDelay && followCursor) {
            mouseMoveBeforeRemove();
            mouseEventsRef.current.target = target;
            mouseEventsRef.current.target.addEventListener('mousemove', mouseMoveBeforeOpen as EventListener);
            mouseEventsRef.current.target.addEventListener('touchstart', mouseMoveBeforeOpen as EventListener);
        }
        originalData.current = { ...originalData.current, event: e as Event, showAnimation: showAnimation, showTarget: target };
        onOpen?.(e as Event);
        if (!isNullOrUndefined(open)) {
            if (open) {
                beforeRenderCallback(target, e as Event, showAnimation);
            }
        }
        else {
            beforeRenderCallback(target, e as Event, showAnimation);
        }
    };

    const beforeRenderCallback: (target: HTMLElement, e: Event, showAnimation: TooltipAnimationSettings) => void =
    (target: HTMLElement, e: Event, showAnimation: TooltipAnimationSettings) => {
        targetRef.current = target;
        setIsHidden(false);
        if (isNullOrUndefined(tooltipEle.current)) {
            const ctrlId: string = rootElemRef.current?.getAttribute('id') ?
                getUniqueID(rootElemRef.current?.getAttribute('id') as string) : getUniqueID('tooltip');
            setTooltipStyle((prevStyle: React.HTMLAttributes<HTMLDivElement> | undefined) => ({
                ...prevStyle,
                id: ctrlId + '_content'
            }));
        } else {
            if (target) {
                adjustArrow(target, position, tooltipPosition.current.x as string, tooltipPosition.current.y as string);
                addDescribedBy(target, TooltipStyle?.id as string);
                const currentTooltipEle: RefObject<HTMLElement> = React.createRef<HTMLElement>() as RefObject<HTMLElement>;
                currentTooltipEle.current = tooltipEle.current?.element as HTMLElement;
                AnimationInstance.stop(currentTooltipEle.current);
                reposition(target);
                tooltipAfterRender(target, e, showAnimation);
            }
        }
    };

    const appendContainer: () => void = () => {
        if (container?.current instanceof HTMLElement) {
            isBodyContainer.current = false;
            containerElement.current = container.current;
        }
        if (!containerElement.current) {
            containerElement.current = typeof document !== 'undefined' ? document.body : null;
        }
    };

    const tooltipBeforeRender: (target: HTMLElement) => void = (target: HTMLElement) => {
        if (target) {
            appendContainer();
            addDescribedBy(target, TooltipStyle?.id as string);
            if (arrow) {
                setTipClass(position);
            }
            renderPopup(target);
            adjustArrow(target, position, tooltipPosition.current.x as string, tooltipPosition.current.y as string);
            const currentTooltipEle: RefObject<HTMLElement> = React.createRef<HTMLElement>() as RefObject<HTMLElement>;
            currentTooltipEle.current = tooltipEle.current?.element as HTMLElement;
            AnimationInstance.stop(currentTooltipEle.current);
            reposition(target);
        }
    };

    const tooltipAfterRender: (target: HTMLElement, e: Event, showAnimation: TooltipAnimationSettings) => void =
        (target: HTMLElement, e: Event, showAnimation: TooltipAnimationSettings) => {
            if (target) {
                beforeOpenCallback(target, showAnimation, e);
            }
        };

    const beforeOpenCallback: ( target: HTMLElement, showAnimation: TooltipAnimationSettings, e: Event) =>
    void = (target: HTMLElement, showAnimation: TooltipAnimationSettings, e: Event) => {
        const openAnimation: Object = {
            name: (showAnimation.effect === 'None' && animationMode === 'Enable') ? 'FadeIn' : (animation.open as TooltipAnimationSettings).effect,
            duration: showAnimation.duration,
            delay: showAnimation.delay,
            timingFunction: 'ease-out'
        };
        if (openDelay > 0) {
            const show: () => void = () => {
                if (followCursor) {
                    target.addEventListener('mousemove', onMouseMove as EventListener);
                    target.addEventListener('touchstart', onMouseMove as EventListener);
                    target.addEventListener('mouseenter', onMouseMove as EventListener);
                }
                if (tooltipEle.current?.element) {
                    setOpenTarget(target);
                    setPopupAnimation((prev: PopupAnimationOptions | undefined) => ({ show: openAnimation, hide: prev?.hide }));
                    setIsPopupOpen(true);
                    if (mouseEventsRef.current.event && followCursor) { onMouseMove(mouseEventsRef.current.event); }
                }
            };
            timers.current.show = setTimeout(show, openDelay);
        } else {
            if (tooltipEle.current) {
                setOpenTarget(target);
                setPopupAnimation((prev: PopupAnimationOptions | undefined) => ({ show: openAnimation, hide: prev?.hide }));
                setIsPopupOpen(true);
            }
        }
        if (e) {
            wireMouseEvents(e, target);
        }
    };

    const checkCollision: (x: number, y: number) => ElementPosition = (x: number, y: number): ElementPosition => {
        const elePos: ElementPosition = {
            left: x,
            top: y,
            position: position as Position,
            horizontal: tooltipPosition.current.x as string,
            vertical: tooltipPosition.current.y as string
        };
        const collideTarget: RefObject<HTMLDivElement> = checkCollideTarget() as RefObject<HTMLDivElement>;
        const affectedPos: string[] = isCollide(
            tooltipEle.current?.element as HTMLElement,
            collideTarget ? collideTarget.current : null, sticky &&  position.indexOf('Right') >= 0 ? (stickyElementRef.current as HTMLElement).offsetWidth + x : x , y );
        if (affectedPos.length > 0) {
            elePos.horizontal = affectedPos.indexOf('left') >= 0 ? 'Right' : affectedPos.indexOf('right') >= 0 ? 'Left' :
                tooltipPosition.current.x as string;
            elePos.vertical = affectedPos.indexOf('top') >= 0 ? 'Bottom' : affectedPos.indexOf('bottom') >= 0 ? 'Top' :
                tooltipPosition.current.y as string;
        }
        return elePos;
    };

    const calculateElementPosition: (pos: OffsetPosition, offsetPos: OffsetPosition) => Array<number> =
    (pos: OffsetPosition, offsetPos: OffsetPosition): Array<number> => {
        return [isBodyContainer.current ? pos.left + offsetPos.left :
            (pos.left - ((containerElement.current as HTMLElement).getBoundingClientRect() as DOMRect).left) +
      offsetPos.left + window.pageXOffset + (containerElement.current as HTMLElement).scrollLeft,
        isBodyContainer.current ? pos.top + offsetPos.top :
            (pos.top - ((containerElement.current as HTMLElement).getBoundingClientRect() as DOMRect).top) +
      offsetPos.top + window.pageYOffset + (containerElement.current as HTMLElement).scrollTop];
    };

    const collisionFlipFit: (target: HTMLElement, x: number, y: number) => OffsetPosition =
    (target: HTMLElement, x: number, y: number): OffsetPosition => {
        const elePos: ElementPosition = checkCollision(x, y);
        let newPos: Position = elePos.position;
        if (tooltipPosition.current.y !== elePos.vertical) {
            newPos = ((position?.indexOf('Bottom') === 0 || position?.indexOf('Top') === 0) ?
                elePos.vertical + tooltipPosition.current.x : tooltipPosition.current.x + elePos.vertical) as Position;
        }
        if (tooltipPosition.current.x !== elePos.horizontal) {
            if (newPos.indexOf('Left') === 0) {
                elePos.vertical = (newPos === 'LeftTop' || newPos === 'LeftCenter') ? 'Top' : 'Bottom';
                newPos = (elePos.vertical + 'Left') as Position;
            }
            if (newPos.indexOf('Right') === 0) {
                elePos.vertical = (newPos === 'RightTop' || newPos === 'RightCenter') ? 'Top' : 'Bottom';
                newPos = (elePos.vertical + 'Right') as Position;
            }
            elePos.horizontal = tooltipPosition.current.x as string;
        }
        const elePosVertical: string = elePos.vertical;
        const elePosHorizontal: string = elePos.horizontal;
        if (elePos.position !== newPos) {
            const pos: OffsetPosition = calculatePosition(target, elePosHorizontal.toLowerCase(),
                                                          elePosVertical.toLowerCase(), isBodyContainer.current ? undefined :
                                                              containerElement.current?.getBoundingClientRect());
            adjustArrow(target, newPos, elePosHorizontal, elePosVertical);
            const scalingFactors: { [key: string]: number } = getScalingFactor(target);
            const offsetPos: OffsetPosition = calculateTooltipOffset(newPos, scalingFactors.x, scalingFactors.y);
            if (!isBodyContainer.current) {
                offsetPos.top -= getOffSetPosition('TopBottom', newPos, offsetY);
                offsetPos.left -= getOffSetPosition('RightLeft', newPos, offsetX);
            }
            elePos.position = newPos;
            const elePosition: Array<number> = calculateElementPosition(pos, offsetPos);
            elePos.left = elePosition[0];
            elePos.top = elePosition[1];
        } else {
            adjustArrow(target, newPos, elePosHorizontal, elePosVertical);
        }
        const eleOffset: OffsetPosition = { left: elePos.left, top: elePos.top };
        const collideTarget: RefObject<HTMLDivElement>  = checkCollideTarget() as RefObject<HTMLDivElement>;
        const updatedPosition: OffsetPosition = isBodyContainer.current ?
            fit(tooltipEle.current?.element as HTMLElement, collideTarget ? collideTarget.current : null,
                { X: true, Y: windowCollision }, eleOffset) as OffsetPosition : eleOffset;
        if (arrow && arrowElementRef.current != null && (newPos.indexOf('Bottom') === 0 || newPos.indexOf('Top') === 0)) {
            let arrowLeft: number = parseInt(arrowElementRef.current.style.left, 10) - (updatedPosition.left - elePos.left);
            if (arrowLeft < 0) {
                arrowLeft = 0;
            } else if ((arrowLeft + arrowElementRef.current.offsetWidth) > (tooltipEle.current?.element as HTMLDivElement).clientWidth) {
                arrowLeft = (tooltipEle.current?.element as HTMLDivElement).clientWidth - arrowElementRef.current.offsetWidth;
            }
            arrowElementRef.current.style.left = arrowLeft.toString() + 'px';
        }
        eleOffset.left = updatedPosition.left;
        eleOffset.top = updatedPosition.top;
        return eleOffset;
    };

    const getOffSetPosition: (positionString: string, newPos: Position, offsetType: number) => number =
    (positionString: string, newPos: Position, offsetType: number): number => {
        return ((positionString.indexOf((position as Position).split(/(?=[A-Z])/)[0]) !== -1) &&
      (positionString.indexOf(newPos.split(/(?=[A-Z])/)[0]) !== -1)) ? (2 * offsetType) : 0;
    };

    const checkCollideTarget: () => React.RefObject<HTMLDivElement> | null = (): React.RefObject<HTMLDivElement> | null => {
        return !windowCollision && target?.current ? rootElemRef as RefObject<HTMLDivElement>  : null;
    };

    const hideTooltip: (hideAnimation: TooltipAnimationSettings, e?: Event, targetElement?: HTMLElement) => void =
    (hideAnimation: TooltipAnimationSettings, e?: Event, targetElement?: HTMLElement) => {
        if (closeDelay > 0) {
            clearTimeout(timers.current.hide as NodeJS.Timeout);
            clearTimeout(timers.current.show as NodeJS.Timeout);
            const hide: () => void = () => {
                if (closeDelay && tooltipEle.current && tooltipEle.current.element && isTooltipOpen) { return; }
                tooltipHide(hideAnimation, e, targetElement);
            };
            timers.current.hide = setTimeout(hide, closeDelay);
        } else {
            tooltipHide(hideAnimation, e, targetElement);
        }
    };

    const tooltipHide: (hideAnimation: TooltipAnimationSettings, e?: Event, targetElement?: HTMLElement) => void =
        (hideAnimation: TooltipAnimationSettings, e?: Event, targetElement?: HTMLElement) => {
            let target: HTMLElement;
            if (e) {
                target = props.target?.current || onFilterTarget ? (targetElement || e.target as HTMLElement)
                    : rootElemRef.current as HTMLElement;
            } else {
                target = targetRef.current as HTMLElement;
            }
            originalData.current = { ...originalData.current, hideEvent: e as Event, hideAnimation: hideAnimation, hideTarget: target };
            if (tooltipEle.current && tooltipEle.current.element?.getAttribute('sf-animate')) {
                const currentTooltipEle: RefObject<HTMLElement> = React.createRef<HTMLElement>() as RefObject<HTMLElement>;
                currentTooltipEle.current = tooltipEle.current?.element as HTMLElement;
                AnimationInstance.stop(currentTooltipEle.current, {
                    end: () => {
                        handlePopupHide(hideAnimation, target, e);
                    }
                });
            }
            else {
                handlePopupHide(hideAnimation, target, e);
            }
        };

    const handlePopupHide: (hideAnimation: TooltipAnimationSettings, target: HTMLElement, e?: Event) => void =
        (hideAnimation: TooltipAnimationSettings, target: HTMLElement, e?: Event) => {
            onClose?.(e as Event);
            if (!isNullOrUndefined(open)) {
                if (open && !onClose) { setIsHidden(false); }
                else if (!open) {
                    mouseMoveBeforeRemove();
                    popupHide(hideAnimation, target, e);
                }
            } else {
                mouseMoveBeforeRemove();
                popupHide(hideAnimation, target, e);
            }
        };

    const popupHide: (hideAnimation: TooltipAnimationSettings, target: HTMLElement, e?: Event) => void  =
    (hideAnimation: TooltipAnimationSettings, target: HTMLElement, e?: Event) => {
        if (target && e) { restoreElement(target); }
        const closeAnimation: Object = {
            name: (hideAnimation.effect === 'None' && animationMode === 'Enable') ? 'FadeOut' : (animation.close as TooltipAnimationSettings).effect,
            duration: hideAnimation.duration,
            delay: hideAnimation.delay,
            timingFunction: 'ease-in'
        };
        if (tooltipEle.current) {
            setPopupAnimation((prev: PopupAnimationOptions | undefined) => ({ hide: closeAnimation, show: prev?.show }));
            setIsPopupOpen(false);
        }
    };

    const restoreElement: (target: HTMLElement) => void = (target: HTMLElement) => {
        unWireMouseEvents(target);
        if (!isNullOrUndefined(target.getAttribute('data-content'))) {
            target.setAttribute('title', target.getAttribute('data-content') as string);
            target.removeAttribute('data-content');
        }
        removeDescribedBy(target);
    };

    const clear: () => void = () => {
        const target: HTMLElement = targetRef.current as HTMLElement;
        if (target) { restoreElement(target); }
        if (isHidden) {
            setArrowInnerTipStyle({ top: '', left: '' });
            tooltipEle.current = null;
        }
    };

    const tooltipHover: () => void = () => {
        if (tooltipEle.current && tooltipEle.current.element) {
            setIsTooltipOpen(true);
        }
    };

    const tooltipMouseOut: (e: Event) => void = (e: Event) => {
        setIsTooltipOpen(false);
        hideTooltip(animation.close as TooltipAnimationSettings, e, targetRef.current as HTMLElement);
    };

    const onMouseOut: (e: MouseEvent) => void = (e: MouseEvent) => {
        const enteredElement: EventTarget = e.relatedTarget as EventTarget;
        if (enteredElement ) {
            const checkForTooltipElement: Element = closest(
                enteredElement as HTMLElement,
                `.${TOOLTIP_WRAP}.${POPUP_LIB}.${POPUP_ROOT}`) as Element;
            if (checkForTooltipElement) {
                if (followCursor) {
                    onMouseMove(e);
                }
                checkForTooltipElement.addEventListener('mouseleave', tooltipElementMouseOut as EventListener);
            } else {
                hideTooltip(animation.close as TooltipAnimationSettings, e, targetRef.current as HTMLElement);
                if (closeDelay === 0 && ((animation.close as TooltipAnimationSettings).effect === 'None')) {
                    clear();
                }
            }
        } else {
            hideTooltip(animation.close as TooltipAnimationSettings, e, targetRef.current as HTMLElement);
            clear();
        }
    };

    const tooltipElementMouseOut: (e: MouseEvent) => void = (e: MouseEvent) => {
        tooltipEle.current?.element?.removeEventListener('mouseleave', tooltipElementMouseOut as EventListener);
        if (!e.relatedTarget  ||  closest(e.relatedTarget as HTMLElement, '.sf-tooltip') as Element !== rootElemRef.current) {
            hideTooltip(animation.close as TooltipAnimationSettings, e, targetRef.current as HTMLElement);
            clear();
        }
    };

    const onMouseMove: (event: MouseEvent | TouchEvent) => void = (event: MouseEvent | TouchEvent) => {
        let eventPageX: number = 0; let eventPageY: number = 0;
        if (event.type.indexOf('touch') > -1) {
            event.preventDefault();
            eventPageX = (event as TouchEvent).touches[0].pageX;
            eventPageY = (event as TouchEvent).touches[0].pageY;
        } else {
            eventPageX = (event as MouseEvent).pageX;
            eventPageY = (event as MouseEvent).pageY;
        }
        if (isNullOrUndefined(tooltipEle.current)) { return; }
        if (tooltipEle.current) {
            (tooltipEle.current.element as HTMLElement).style.display = 'block';
        }
        const currentTooltipEle: RefObject<HTMLElement> = React.createRef<HTMLElement>() as RefObject<HTMLElement>;
        currentTooltipEle.current = tooltipEle.current?.element as HTMLElement;
        AnimationInstance.stop(currentTooltipEle.current);
        adjustArrow(event.target as HTMLElement, position,
                    tooltipPosition.current.x as string, tooltipPosition.current.y as string);
        const scalingFactors: { [key: string]: number } = getScalingFactor(event.target as HTMLElement);
        const pos: OffsetPosition = calculateTooltipOffset(position, scalingFactors.x, scalingFactors.y);
        const x: number = eventPageX + pos.left + offsetX;
        const y: number = eventPageY + pos.top + offsetY;
        const elePos: ElementPosition = checkCollision(x, y);
        if (tooltipPosition.current.x !== elePos.horizontal || tooltipPosition.current.y !== elePos.vertical) {
            const newPos: string = (position?.indexOf('Bottom') === 0 || position?.indexOf('Top') === 0) ?
                elePos.vertical + elePos.horizontal : elePos.horizontal + elePos.vertical;
            elePos.position = newPos as Position;
            adjustArrow(event.target as HTMLElement, elePos.position, elePos.horizontal, elePos.vertical);
            const colPos: OffsetPosition = calculateTooltipOffset(elePos.position, scalingFactors.x, scalingFactors.y);
            elePos.left = eventPageX + colPos.left - offsetX;
            elePos.top = eventPageY + colPos.top - offsetY;
        }
        const popupStyle: React.CSSProperties = {
            position: 'absolute',
            left: elePos.left + 'px',
            top:  elePos.top + 'px',
            zIndex: 1000,
            width: formatUnit(width),
            height: formatUnit(height),
            display: 'block'
        };
        setTooltipStyle((prevStyle: React.HTMLAttributes<HTMLDivElement> | undefined) => ({
            ...prevStyle,
            style: {
                ...(prevStyle?.style || {}),
                ...popupStyle
            }
        }));
    };

    const keyDown: (event: KeyboardEvent) => void = (event: KeyboardEvent) => {
        if (tooltipEle.current && tooltipEle.current.element && event.keyCode === 27) {
            closeTooltip();
        }
    };

    const touchEnd: (e: TouchEvent) => void = (e: TouchEvent) => {
        if (tooltipEle.current && tooltipEle.current.element && closest(e.target as HTMLElement, '.sf-tooltip') === null && !sticky && !opensOn.includes('Focus')) {
            closeTooltip();
        }
    };

    const scrollHandler: (e: Event) => void = (e: Event) => {
        if (tooltipEle.current && tooltipEle.current.element && !sticky && !followCursor && !scrolled.current) {
            if (!(closest(e.target as HTMLElement, `.${TOOLTIP_WRAP}.${POPUP_LIB}.${POPUP_ROOT}`))) {
                setIsPopupOpen((prev: boolean) => {
                    if (!prev) {
                        setIsHidden(true);
                    }
                    return prev;
                });
                scrolled.current = true;
                closeTooltip();
            }
        }
    };

    const wireEvents: (trigger: string) => void = (trigger: string) => {
        const triggerList: string[] = getTriggerList(trigger);
        const newEventProps: { [key: string]: object } = {};
        for (const opensOn of triggerList) {
            if (opensOn === 'Custom') { return; }
            if (opensOn === 'Focus') {
                wireFocusEvents();
            }
            if (opensOn === 'Click') {
                newEventProps.onMouseDown = targetClick;
            }
            if (opensOn === 'Hover') {
                if (Browser.isDevice) {
                    if (touchModule.current) {
                        touchModule.current.tapHoldThreshold = TAP_HOLD_THRESHOLD;
                        touchModule.current.tapHold = tapHoldHandler;
                    }
                    newEventProps.onTouchEnd = touchEndHandler;
                } else {
                    newEventProps.onMouseOver = targetHover;
                }
            }
        }
        setEventProps((prevProps: {[key: string]: object; }) => ({
            ...prevProps,
            ...newEventProps
        }));
    };

    const getTriggerList: (trigger: string) => string[] = (trigger: string): string[] => {
        if (!trigger) { return []; }
        if (trigger === 'Auto') {
            trigger = (Browser.isDevice) ? 'Hover' : 'Hover Focus';
        }
        return trigger.split(' ');
    };

    const wireFocusEvents: () => void = () => {
        const focusEventProps: { [key: string]: object } = {};
        if (!isNullOrUndefined(props.target) && !isNullOrUndefined(props.target?.current)) {
            props.target?.current.addEventListener('focus', targetHover as EventListener);
        } else {
            focusEventProps.onFocus = targetHover;
        }
        setEventProps((prevProps: {[key: string]: object; }) => ({
            ...prevProps,
            ...focusEventProps
        }));
    };

    const wireMouseEvents: (e: Event, target: Element) => void = (e: Event, target: Element) => {
        if (tooltipEle.current && tooltipEle.current.element) {
            if (!sticky) {
                if (e.type === 'focus') {
                    if (!isNullOrUndefined(props.target) && !isNullOrUndefined(props.target?.current) || onFilterTarget) {
                        target.addEventListener('blur', onMouseOut as EventListener);
                    } else {
                        setEventProps((prevProps: { [key: string]: object; }) => ({
                            ...prevProps,
                            onBlur: onMouseOut
                        }));
                    }
                }
                if (e.type === 'mouseover') {
                    target.addEventListener('mouseleave', onMouseOut as EventListener);
                }
                if (closeDelay) {
                    tooltipEle.current.element.addEventListener('mouseenter', tooltipHover as EventListener);
                    tooltipEle.current.element.addEventListener('mouseleave', tooltipMouseOut as EventListener);
                }
            }
            if (followCursor && openDelay === 0) {
                target.addEventListener('mousemove', onMouseMove as EventListener);
                target.addEventListener('mouseenter', onMouseMove as EventListener);
            }
        }
    };

    const unWireEvents: (trigger: string) => void = (trigger: string) => {
        const triggerList: string[] = getTriggerList(trigger);
        const newEventProps: { [key: string]: undefined } = {};
        for (const opensOn of triggerList) {
            if (opensOn === 'Custom') { return; }
            if (opensOn === 'Focus') {
                unWireFocusEvents();
            }
            if (opensOn === 'Click') {
                newEventProps.onMouseDown = undefined;
            }
            if (opensOn === 'Hover') {
                if (touchModule.current && touchModule.current.destroy) { touchModule.current.destroy(); }
                newEventProps.onTouchEnd = undefined;
                newEventProps.onMouseOver = undefined;
            }
        }
        setEventProps((prevProps: {[key: string]: object; }) => {
            const updatedProps: {[key: string]: object; } = { ...prevProps };
            Object.keys(newEventProps).forEach((key: string) => {
                delete updatedProps[key as string];
            });
            return updatedProps;
        });
    };

    const unWireFocusEvents: () => void = () => {
        const focusEventProps: { [key: string]: undefined } = {};
        if (!isNullOrUndefined(props.target) && !isNullOrUndefined(props.target?.current) && rootElemRef.current) {
            props.target?.current.removeEventListener('focus', targetHover as EventListener);
        } else {
            focusEventProps.onFocus = undefined;
        }
        setEventProps((prevProps: {[key: string]: object; }) => {
            const updatedProps: {[key: string]: object; } = { ...prevProps };
            Object.keys(focusEventProps).forEach((key: string) => {
                delete updatedProps[key as string];
            });
            return updatedProps;
        });
    };

    const unWireMouseEvents: (target: Element) => void = (target: Element) => {
        if (!sticky) {
            const triggerList: string[] = getTriggerList(opensOn);
            for (const opensOn of triggerList) {
                if (opensOn === 'Focus') {
                    target.removeEventListener('blur', onMouseOut as EventListener);
                    setEventProps((prevProps: { [key: string]: object; }) => {
                        const updatedProps: { [key: string]: object; } = { ...prevProps };
                        delete updatedProps['onBlur'];
                        return updatedProps;
                    });
                }
                if (opensOn === 'Hover' && !Browser.isDevice) {
                    target.removeEventListener('mouseleave', onMouseOut as EventListener);
                }
            }
            if (closeDelay) {
                target.removeEventListener('mouseenter', tooltipHover as EventListener);
                target.removeEventListener('mouseleave', tooltipMouseOut as EventListener);
            }
        }
        if (followCursor) {
            target.removeEventListener('mousemove', onMouseMove as EventListener);
            target.removeEventListener('mouseenter', onMouseOut as EventListener);
        }
    };

    const closeTooltip: () => void = () => {
        hideTooltip(animation.close as TooltipAnimationSettings);
    };

    const arrowIcon: string = React.useMemo(() => {
        switch (tipClass) {
        case TIP_TOP:
            return TIP_TOP_ICON;
        case TIP_RIGHT:
            return TIP_RIGHT_ICON;
        case TIP_LEFT:
            return TIP_LEFT_ICON;
        default:
            return TIP_BOTTOM_ICON;
        }
    }, [tipClass]);

    const renderTooltipContent: () => React.ReactNode = () => (
        <Popup
            ref={tooltipEle}
            isOpen={isPopupOpen}
            role='tooltip'
            aria-hidden={false}
            animation={PopupAnimation}
            relativeElement={openTarget}
            targetRef={targetRef as RefObject<HTMLElement>}
            position={{ X: elePos.left, Y: elePos.top }}
            viewPortElementRef={containerElement.current ? containerElement as RefObject<HTMLElement> : undefined}
            width={formatUnit(width)}
            height={formatUnit(height)}
            onOpen={openPopupHandler as () => void}
            onClose={closePopupHandler as () => void}
            className={[
                TOOLTIP_WRAP,
                className,
                Browser.isDevice ? DEVICE : ''
            ].filter(Boolean).join(' ')}
            {...TooltipStyle}
        >
            <div className={CONTENT}>{renderContent()}</div>
            {arrow && (
                <div ref={arrowElementRef} className={`${ARROW_TIP} ${tipClass}`} >
                    <div className={`${ARROW_TIP_OUTER} ${tipClass}`}></div>
                    <div className={`${ARROW_TIP_INNER} ${tipClass}`} style={arrowInnerTipStyle}>
                        <SvgIcon d={arrowIcon}></SvgIcon>
                    </div>
                </div>
            )}
            {sticky && (
                <div
                    ref={stickyElementRef}
                    className={`${CLOSE}`}
                    role="button"
                    aria-label="Close Tooltip"
                    onClick={() => { closeTooltip(); }}
                >
                    <SvgIcon width='12px' height='12px' d={CLOSE_ICON}></SvgIcon>
                </div>
            )}
        </Popup>
    );

    return (
        <>
            <div ref={rootElemRef} className={[
                ROOT,
                className
            ].filter(Boolean).join(' ')} {...eventProps} {...restProps} >{children}</div>
            {!isHidden && containerElement.current && createPortal(renderTooltipContent(), containerElement.current)}
        </>
    );
});

export default React.memo(Tooltip);
