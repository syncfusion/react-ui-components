import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import * as React from 'react';
import { useRef, useCallback, useEffect, useLayoutEffect, useState, useImperativeHandle, forwardRef } from 'react';
import { Touch, Browser, Animation as PopupAnimation, animationMode } from '@syncfusion/react-base';
import { isNullOrUndefined, getUniqueID, formatUnit } from '@syncfusion/react-base';
import { attributes, closest, preRender, SvgIcon } from '@syncfusion/react-base';
import { Popup } from '../popup/popup';
import { calculatePosition } from '../common/position';
import { isCollide, fit } from '../common/collision';
import { createPortal } from 'react-dom';
const TOUCHEND_HIDE_DELAY = 1500;
const TAP_HOLD_THRESHOLD = 500;
const SHOW_POINTER_TIP_GAP = 0;
const HIDE_POINTER_TIP_GAP = 8;
const MOUSE_TRAIL_GAP = 2;
const POINTER_ADJUST = 2;
const ROOT = 'sf-control sf-tooltip sf-lib';
const DEVICE = 'sf-bigger';
const CLOSE = 'sf-tooltip-close';
const TOOLTIP_WRAP = 'sf-tooltip-wrap';
const CONTENT = 'sf-tip-content';
const ARROW_TIP = 'sf-arrow-tip';
const ARROW_TIP_OUTER = 'sf-arrow-tip-outer';
const ARROW_TIP_INNER = 'sf-arrow-tip-inner';
const TIP_BOTTOM = 'sf-tip-bottom';
const TIP_TOP = 'sf-tip-top';
const TIP_LEFT = 'sf-tip-left';
const TIP_RIGHT = 'sf-tip-right';
const POPUP_ROOT = 'sf-popup';
const POPUP_LIB = 'sf-lib';
const CLOSE_ICON = 'M10.5858 12.0001L2.58575 4.00003L3.99997 2.58582L12 10.5858L20 2.58582L21.4142 4.00003L13.4142 12.0001L21.4142 20L20 21.4142L12 13.4143L4.00003 21.4142L2.58581 20L10.5858 12.0001Z';
const TIP_BOTTOM_ICON = 'M20.7929 7H3.20712C2.76167 7 2.53858 7.53857 2.85356 7.85355L11.6465 16.6464C11.8417 16.8417 12.1583 16.8417 12.3536 16.6464L21.1465 7.85355C21.4614 7.53857 21.2384 7 20.7929 7Z';
const TIP_TOP_ICON = 'M20.7929 17H3.20712C2.76167 17 2.53858 16.4615 2.85356 16.1465L11.6465 7.3536C11.8417 7.15834 12.1583 7.15834 12.3536 7.3536L21.1465 16.1465C21.4614 16.4615 21.2384 17 20.7929 17Z';
const TIP_RIGHT_ICON = 'M7 20.7928L7 3.20706C7 2.76161 7.53857 2.53852 7.85355 2.8535L16.6464 11.6464C16.8417 11.8417 16.8417 12.1582 16.6464 12.3535L7.85355 21.1464C7.53857 21.4614 7 21.2383 7 20.7928Z';
const TIP_LEFT_ICON = 'M17 3.20718L17 20.793C17 21.2384 16.4614 21.4615 16.1464 21.1465L7.35354 12.3536C7.15828 12.1584 7.15828 11.8418 7.35354 11.6465L16.1464 2.85363C16.4614 2.53864 17 2.76173 17 3.20718Z';
/**
 * The Tooltip component displays additional information when users hover, click, or focus on an element.
 * It supports various positions, animations, and customization options.
 *
 * ```typescript
 * <Tooltip content={<>This is a Tooltip</>} position='BottomCenter'>Hover me</Tooltip>
 * ```
 */
export const Tooltip = forwardRef((props, ref) => {
    const { width = 'auto', height = 'auto', position = 'TopCenter', offsetX = 0, offsetY = 0, arrow = true, windowCollision = false, arrowPosition = 'Auto', opensOn = 'Auto', followCursor = false, sticky = false, animation = {
        open: { effect: 'FadeIn', duration: 150, delay: 0 },
        close: { effect: 'FadeOut', duration: 150, delay: 0 }
    }, openDelay = 0, closeDelay = 0, children, target, content, container, className, open, onClose, onOpen, onFilterTarget, ...restProps } = props;
    const [isHidden, setIsHidden] = useState(true);
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [openAnimation, setOpenAnimation] = useState(undefined);
    const [closeAnimation, setCloseAnimation] = useState(undefined);
    const [openTarget, setOpenTarget] = useState(null);
    const [isTooltipOpen, setIsTooltipOpen] = useState(false);
    const [tipClass, setTipClassState] = useState(TIP_BOTTOM);
    const [elePos, setElePos] = useState({ top: 0, left: 0 });
    const [eventProps, setEventProps] = useState({});
    const [arrowInnerTipStyle, setArrowInnerTipStyle] = useState({ top: '', left: '' });
    const [TooltipStyle, setTooltipStyle] = useState();
    const tooltipEle = useRef(null);
    const timers = useRef({ show: null, hide: null, autoClose: null });
    const tooltipPosition = useRef({ x: 'Center', y: 'Top' });
    const touchModule = useRef(null);
    const mouseEventsRef = useRef({ event: null, target: null });
    const isBodyContainer = useRef(true);
    const targetRef = useRef(null);
    const rootElemRef = useRef(null);
    const arrowElementRef = useRef(null);
    const stickyElementRef = useRef(null);
    const originalData = useRef({ event: null, showAnimation: null, hideAnimation: null, hideEvent: null,
        hideTarget: null, showTarget: null });
    const containerElement = useRef(typeof document !== 'undefined' ? document.body : null);
    const initialOpenState = useRef(open);
    const scrolled = useRef(false);
    if (Browser.isDevice) {
        touchModule.current = Touch(rootElemRef);
    }
    const propsRef = {
        width: 'auto',
        height: 'auto',
        position: 'TopCenter',
        offsetX: 0,
        offsetY: 0,
        arrow: true,
        windowCollision: false,
        arrowPosition: 'Auto',
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
            tooltipBeforeRender(targetRef.current);
            tooltipAfterRender(targetRef.current, originalData.current?.event, originalData.current?.showAnimation);
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
        if (typeof document === 'undefined') {
            return;
        }
        document.addEventListener('wheel', scrollHandler);
        document.addEventListener('scroll', scrollHandler);
        document.addEventListener('touchend', touchEnd);
        document.addEventListener('keydown', keyDown);
        window.addEventListener('resize', windowResize);
        return () => {
            if (typeof document === 'undefined') {
                return;
            }
            document.removeEventListener('wheel', scrollHandler);
            document.removeEventListener('scroll', scrollHandler);
            document.removeEventListener('touchend', touchEnd);
            document.removeEventListener('keydown', keyDown);
            window.removeEventListener('resize', windowResize);
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
                    rootElemRef.current, animation.open);
            }
            else {
                beforeRenderCallback(originalData.current?.showTarget, originalData.current.event, originalData.current.showAnimation);
                originalData.current = { ...originalData.current, showTarget: null };
            }
        }
        else {
            if (!originalData.current?.hideAnimation) {
                hideTooltip(animation.close);
            }
            else {
                mouseMoveBeforeRemove();
                popupHide(originalData.current?.hideAnimation, originalData.current?.hideTarget, originalData.current?.hideEvent);
                originalData.current = { ...originalData.current, hideEvent: null, hideAnimation: null, hideTarget: null };
            }
        }
    }, [open]);
    useLayoutEffect(() => {
        preRender('tooltip');
        initialize();
        return () => {
            clearTimeout(timers.current.show);
            clearTimeout(timers.current.hide);
            clearTimeout(timers.current.autoClose);
            tooltipEle.current = null;
            touchModule.current = null;
            originalData.current = { event: null, showAnimation: null, hideAnimation: null, hideEvent: null,
                hideTarget: null, showTarget: null };
            mouseEventsRef.current = { event: null, target: null };
        };
    }, []);
    useImperativeHandle(ref, () => ({
        ...propsRef,
        animation: animation,
        openTooltip: (element, animationSettings) => {
            if (isNullOrUndefined(animationSettings)) {
                animationSettings = animation?.open;
            }
            if (isNullOrUndefined(element)) {
                element = rootElemRef.current;
            }
            if (element) {
                if (element.style.display === 'none') {
                    return;
                }
                showTooltip(element, animationSettings);
            }
        },
        closeTooltip: (animationSettings) => {
            if (!animationSettings) {
                animationSettings = animation?.close;
            }
            hideTooltip(animationSettings);
        },
        refresh: () => {
            if (tooltipEle.current && tooltipEle.current.element) {
                reposition(targetRef.current ? targetRef.current : rootElemRef.current);
            }
            if (!isNullOrUndefined(props.target) && !isNullOrUndefined(props.target?.current)) {
                unWireEvents(opensOn);
                wireEvents(opensOn);
            }
        },
        element: rootElemRef.current
    }));
    const initialize = useCallback(() => {
        formatPosition();
    }, [propsRef]);
    const formatPosition = () => {
        if (!position) {
            return;
        }
        let posX = null;
        let posY = null;
        if (position.indexOf('Top') === 0 || position.indexOf('Bottom') === 0) {
            [posY, posX] = position.split(/(?=[A-Z])/);
        }
        else {
            [posX, posY] = position.split(/(?=[A-Z])/);
        }
        tooltipPosition.current.x = posX;
        tooltipPosition.current.y = posY;
    };
    const setTipClass = useCallback((position) => {
        let newTipClass;
        if (isNullOrUndefined(position)) {
            return;
        }
        if (position.indexOf('Right') === 0) {
            newTipClass = TIP_LEFT;
        }
        else if (position.indexOf('Bottom') === 0) {
            newTipClass = TIP_TOP;
        }
        else if (position.indexOf('Left') === 0) {
            newTipClass = TIP_RIGHT;
        }
        else {
            newTipClass = TIP_BOTTOM;
        }
        setTipClassState(newTipClass);
        return newTipClass;
    }, []);
    const renderPopup = (target) => {
        if (followCursor && originalData.current?.event) {
            onMouseMove(originalData.current?.event);
            return;
        }
        const elePos = getTooltipPosition(target);
        setElePos(elePos);
    };
    const getScalingFactor = (target) => {
        if (!target) {
            return { x: 1, y: 1 };
        }
        const scalingFactors = { x: 1, y: 1 };
        const elementsWithTransform = target.closest('[style*="transform: scale"]');
        if (elementsWithTransform && elementsWithTransform !== tooltipEle.current?.element &&
            elementsWithTransform.contains(tooltipEle.current?.element)) {
            const computedStyle = window.getComputedStyle(elementsWithTransform);
            const transformValue = computedStyle.getPropertyValue('transform');
            if (transformValue !== 'none') {
                const scaleMatch = transformValue.match(/scale\(([\d., ]+)\)/);
                if (scaleMatch) {
                    const scaleValues = scaleMatch[1].split(',').map(parseFloat);
                    scalingFactors.x = scaleValues[0];
                    scalingFactors.y = scaleValues.length > 1 ? scaleValues[1] : scaleValues[0];
                }
                else {
                    const matrixMatch = transformValue.match(/matrix\(([^)]+)\)/);
                    if (matrixMatch) {
                        const matrixValues = matrixMatch[1].split(',').map(parseFloat);
                        scalingFactors.x = matrixValues[0];
                        scalingFactors.y = matrixValues[3];
                    }
                }
            }
        }
        return scalingFactors;
    };
    const getTooltipPosition = (target) => {
        if (tooltipEle.current && tooltipEle.current.element) {
            tooltipEle.current.element.style.visibility = 'hidden';
            tooltipEle.current.element.style.display = 'block';
        }
        const parentWithZoomStyle = rootElemRef.current?.closest('[style*="zoom"]');
        if (parentWithZoomStyle) {
            if (tooltipEle.current && tooltipEle.current.element &&
                !parentWithZoomStyle.contains(tooltipEle.current?.element)) {
                tooltipEle.current.element.style.zoom = getComputedStyle(parentWithZoomStyle).zoom;
            }
        }
        const targetRef = { current: target };
        const pos = calculatePosition(targetRef, tooltipPosition.current.x?.toLowerCase(), tooltipPosition.current.y?.toLowerCase(), isBodyContainer.current ? undefined :
            containerElement.current?.getBoundingClientRect());
        const scalingFactors = getScalingFactor(target);
        const offsetPos = calculateTooltipOffset(position, scalingFactors.x, scalingFactors.y);
        const collisionPosition = calculateElementPosition(pos, offsetPos);
        const collisionLeft = collisionPosition[0];
        const collisionTop = collisionPosition[1];
        const elePos = collisionFlipFit(target, collisionLeft, collisionTop);
        elePos.left = elePos.left / scalingFactors.x;
        elePos.top = elePos.top / scalingFactors.y;
        if (!isBodyContainer.current && containerElement.current) {
            elePos.left -= (window.scrollX * 2);
            elePos.top -= (window.scrollY * 2);
        }
        if (tooltipEle.current && tooltipEle.current.element) {
            tooltipEle.current.element.style.display = '';
            if (followCursor) {
                tooltipEle.current.element.style.visibility = 'visible';
            }
        }
        return elePos;
    };
    const windowResize = () => {
        reposition(targetRef.current);
    };
    const reposition = (target) => {
        if (tooltipEle.current && tooltipEle.current.element && target) {
            const elePos = getTooltipPosition(target);
            setElePos(elePos);
            tooltipEle.current.element.style.visibility = 'visible';
        }
    };
    const openPopupHandler = () => {
        if (!followCursor) {
            reposition(targetRef.current);
        }
    };
    const closePopupHandler = () => {
        clear();
        const currentTooltipEle = React.createRef();
        currentTooltipEle.current = tooltipEle.current?.element;
        PopupAnimation.stop(currentTooltipEle.current);
        scrolled.current = false;
        setIsHidden(true);
    };
    const calculateTooltipOffset = (position, xScalingFactor, yScalingFactor) => {
        const pos = {
            top: 0,
            left: 0
        };
        let tipWidth;
        let tipHeight;
        let tooltipEleWidth;
        let tooltipEleHeight;
        let tipAdjust;
        let tipHeightAdjust;
        let tipWidthAdjust;
        if (xScalingFactor !== 1 || yScalingFactor !== 1) {
            const tooltipEleRect = tooltipEle.current?.element?.getBoundingClientRect();
            let arrowEleRect;
            tooltipEleWidth = Math.round(tooltipEleRect.width);
            tooltipEleHeight = Math.round(tooltipEleRect.height);
            if (arrowElementRef.current) {
                arrowEleRect = arrowElementRef.current.getBoundingClientRect();
            }
            tipWidth = arrowEleRect ? Math.round(arrowEleRect.width) : 0;
            tipHeight = arrowEleRect ? Math.round(arrowEleRect.height) : 0;
            tipAdjust = (arrow ? SHOW_POINTER_TIP_GAP : HIDE_POINTER_TIP_GAP);
            tipHeightAdjust = (tipHeight / 2) + POINTER_ADJUST +
                (tooltipEleHeight - ((tooltipEle.current?.element).clientHeight * yScalingFactor));
            tipWidthAdjust = (tipWidth / 2) + POINTER_ADJUST +
                (tooltipEleWidth - ((tooltipEle.current?.element).clientWidth * xScalingFactor));
        }
        else {
            tooltipEleWidth = (tooltipEle.current?.element).offsetWidth;
            tooltipEleHeight = (tooltipEle.current?.element).offsetHeight;
            tipWidth = arrowElementRef.current ? arrowElementRef.current.offsetWidth : 0;
            tipHeight = arrowElementRef.current ? arrowElementRef.current.offsetHeight : 0;
            tipAdjust = (arrow ? SHOW_POINTER_TIP_GAP : HIDE_POINTER_TIP_GAP);
            tipHeightAdjust = (tipHeight / 2) + POINTER_ADJUST +
                ((tooltipEle.current?.element).offsetHeight - (tooltipEle.current?.element).clientHeight);
            tipWidthAdjust = (tipWidth / 2) + POINTER_ADJUST +
                ((tooltipEle.current?.element).offsetWidth - (tooltipEle.current?.element).clientWidth);
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
    const adjustArrow = (target, position, tooltipPositionX, tooltipPositionY) => {
        if (arrow === false || arrowElementRef.current === null) {
            return;
        }
        const currentTipClass = setTipClass(position);
        let leftValue;
        let topValue;
        const tooltipWidth = (tooltipEle.current?.element).clientWidth;
        const tooltipHeight = (tooltipEle.current?.element).clientHeight;
        const tipWidth = arrowElementRef.current.offsetWidth;
        const tipHeight = arrowElementRef.current.offsetHeight;
        if (currentTipClass === TIP_BOTTOM || currentTipClass === TIP_TOP) {
            if (currentTipClass === TIP_BOTTOM) {
                topValue = '99.9%';
                setArrowInnerTipStyle((prevStyle) => ({ ...prevStyle, top: `-${tipHeight - 2}px` }));
            }
            else {
                topValue = -(tipHeight - 1) + 'px';
                setArrowInnerTipStyle((prevStyle) => ({ ...prevStyle, top: `-${tipHeight - 6}px` }));
            }
            if (target) {
                const tipPosExclude = tooltipPositionX !== 'Center' || (tooltipWidth > target.offsetWidth) || followCursor;
                if ((tipPosExclude && tooltipPositionX === 'Left') || (!tipPosExclude && arrowPosition === 'End')) {
                    leftValue = (tooltipWidth - tipWidth - POINTER_ADJUST) + 'px';
                }
                else if ((tipPosExclude && tooltipPositionX === 'Right') || (!tipPosExclude && arrowPosition === 'Start')) {
                    leftValue = POINTER_ADJUST + 'px';
                }
                else if ((tipPosExclude) && (arrowPosition === 'End' || arrowPosition === 'Start')) {
                    leftValue = (arrowPosition === 'End') ? ((target.offsetWidth + (((tooltipEle.current?.element).offsetWidth - target.offsetWidth) / 2)) - (tipWidth / 2)) - POINTER_ADJUST + 'px'
                        : (((tooltipEle.current?.element).offsetWidth - target.offsetWidth) / 2) - (tipWidth / 2) + POINTER_ADJUST + 'px';
                }
                else {
                    leftValue = ((tooltipWidth / 2) - (tipWidth / 2)) + 'px';
                }
            }
        }
        else {
            if (currentTipClass === TIP_RIGHT) {
                leftValue = '99.9%';
                setArrowInnerTipStyle((prevStyle) => ({ ...prevStyle, left: `-${tipWidth - 2}px` }));
            }
            else {
                leftValue = -(tipWidth - 1) + 'px';
                setArrowInnerTipStyle((prevStyle) => ({ ...prevStyle, left: `${-(tipWidth) + (tipWidth - 2)}px` }));
            }
            const tipPosExclude = tooltipPositionY !== 'Center' || (tooltipHeight > target.offsetHeight) || followCursor;
            if ((tipPosExclude && tooltipPositionY === 'Top') || (!tipPosExclude && arrowPosition === 'End')) {
                topValue = (tooltipHeight - tipHeight - POINTER_ADJUST) + 'px';
            }
            else if ((tipPosExclude && tooltipPositionY === 'Bottom') || (!tipPosExclude && arrowPosition === 'Start')) {
                topValue = POINTER_ADJUST + 'px';
            }
            else {
                topValue = ((tooltipHeight / 2) - (tipHeight / 2)) + 'px';
            }
        }
        arrowElementRef.current.style.top = topValue;
        arrowElementRef.current.style.left = leftValue;
    };
    const renderContent = () => {
        if (targetRef.current && !isNullOrUndefined(targetRef.current.getAttribute('title'))) {
            targetRef.current.setAttribute('data-content', targetRef.current.getAttribute('title'));
            targetRef.current.removeAttribute('title');
        }
        if (React.isValidElement(content)) {
            return content;
        }
        let tooltipContent = '';
        if (typeof content === 'function') {
            tooltipContent = content();
        }
        else if (targetRef?.current?.getAttribute('data-content')) {
            tooltipContent = targetRef.current.getAttribute('data-content');
        }
        return tooltipContent;
    };
    const addDescribedBy = (target, id) => {
        const describedby = (target.getAttribute('aria-describedby') || '').split(/\s+/);
        if (describedby.indexOf(id) < 0) {
            describedby.push(id);
        }
        attributes(target, { 'aria-describedby': describedby.join(' ').trim(), 'data-tooltip-id': id });
    };
    const removeDescribedBy = (target) => {
        const id = target.getAttribute('data-tooltip-id');
        const describedby = (target.getAttribute('aria-describedby') || '').split(/\s+/);
        const index = describedby.indexOf(id);
        if (index !== -1) {
            describedby.splice(index, 1);
        }
        target.removeAttribute('data-tooltip-id');
        const orgDescribedby = describedby.join(' ').trim();
        if (orgDescribedby) {
            target.setAttribute('aria-describedby', orgDescribedby);
        }
        else {
            target.removeAttribute('aria-describedby');
        }
    };
    const tapHoldHandler = useCallback((evt) => {
        if (evt) {
            clearTimeout(timers.current.autoClose);
            targetHover(evt.originalEvent);
        }
    }, []);
    const touchEndHandler = () => {
        if (sticky) {
            return;
        }
        const close = () => {
            closeTooltip();
        };
        timers.current.autoClose = setTimeout(close, TOUCHEND_HIDE_DELAY);
    };
    const targetClick = (e) => {
        let target;
        if (props.target?.current) {
            target = props.target.current.contains(e.target) ? props.target.current : undefined;
        }
        else {
            target = onFilterTarget ? e.target : rootElemRef.current;
        }
        if (isNullOrUndefined(target)) {
            return;
        }
        const mouseEvent = e;
        if (!tooltipEle.current || (tooltipEle.current && target !== targetRef.current)) {
            if (!(mouseEvent.type === 'mousedown' && mouseEvent.button === 2)) {
                targetHover(e);
            }
        }
        else if (!sticky) {
            hideTooltip(animation.close, e, target);
        }
    };
    const targetHover = (e) => {
        let target;
        if (onFilterTarget) {
            const isTarget = onFilterTarget?.(e.target);
            if (!isTarget) {
                return;
            }
            target = e.target;
        }
        else {
            if (props.target?.current) {
                target = props.target.current.contains(e.target) ? props.target.current : undefined;
            }
            else {
                target = rootElemRef.current;
            }
        }
        if (isNullOrUndefined(target) || (tooltipEle.current && target === targetRef.current && !followCursor)) {
            return;
        }
        if (tooltipEle.current && tooltipEle.current.element?.getAttribute('sf-animation-id')) {
            const delay = closeDelay + (animation?.close?.delay ? animation.close.delay : 0) +
                (animation?.close?.duration ? animation.close.duration : 0);
            setTimeout(() => {
                restoreElement(target);
                showTooltip(target, animation.open, e);
            }, delay);
            return;
        }
        restoreElement(target);
        showTooltip(target, animation.open, e);
    };
    const mouseMoveBeforeOpen = (e) => {
        mouseEventsRef.current.event = e;
    };
    const mouseMoveBeforeRemove = () => {
        if (mouseEventsRef.current.target) {
            mouseEventsRef.current.target.removeEventListener('mousemove', mouseMoveBeforeOpen);
            mouseEventsRef.current.target.removeEventListener('touchstart', mouseMoveBeforeOpen);
        }
    };
    const showTooltip = (target, showAnimation, e) => {
        clearTimeout(timers.current.show);
        clearTimeout(timers.current.hide);
        if (openDelay && followCursor) {
            mouseMoveBeforeRemove();
            mouseEventsRef.current.target = target;
            mouseEventsRef.current.target.addEventListener('mousemove', mouseMoveBeforeOpen);
            mouseEventsRef.current.target.addEventListener('touchstart', mouseMoveBeforeOpen);
        }
        originalData.current = { ...originalData.current, event: e, showAnimation: showAnimation, showTarget: target };
        onOpen?.(e);
        if (!isNullOrUndefined(open)) {
            if (open) {
                beforeRenderCallback(target, e, showAnimation);
            }
        }
        else {
            beforeRenderCallback(target, e, showAnimation);
        }
    };
    const beforeRenderCallback = (target, e, showAnimation) => {
        targetRef.current = target;
        setIsHidden(false);
        if (isNullOrUndefined(tooltipEle.current)) {
            const ctrlId = rootElemRef.current?.getAttribute('id') ?
                getUniqueID(rootElemRef.current?.getAttribute('id')) : getUniqueID('tooltip');
            setTooltipStyle((prevStyle) => ({
                ...prevStyle,
                id: ctrlId + '_content'
            }));
        }
        else {
            if (target) {
                adjustArrow(target, position, tooltipPosition.current.x, tooltipPosition.current.y);
                addDescribedBy(target, TooltipStyle?.id);
                const currentTooltipEle = React.createRef();
                currentTooltipEle.current = tooltipEle.current?.element;
                PopupAnimation.stop(currentTooltipEle.current);
                reposition(target);
                tooltipAfterRender(target, e, showAnimation);
            }
        }
    };
    const appendContainer = () => {
        if (container?.current instanceof HTMLElement) {
            isBodyContainer.current = false;
            containerElement.current = container.current;
        }
        if (!containerElement.current) {
            containerElement.current = typeof document !== 'undefined' ? document.body : null;
        }
    };
    const tooltipBeforeRender = (target) => {
        if (target) {
            appendContainer();
            addDescribedBy(target, TooltipStyle?.id);
            if (arrow) {
                setTipClass(position);
            }
            renderPopup(target);
            adjustArrow(target, position, tooltipPosition.current.x, tooltipPosition.current.y);
            const currentTooltipEle = React.createRef();
            currentTooltipEle.current = tooltipEle.current?.element;
            PopupAnimation.stop(currentTooltipEle.current);
            reposition(target);
        }
    };
    const tooltipAfterRender = (target, e, showAnimation) => {
        if (target) {
            beforeOpenCallback(target, showAnimation, e);
        }
    };
    const beforeOpenCallback = (target, showAnimation, e) => {
        const openAnimation = {
            name: (showAnimation.effect === 'None' && animationMode === 'Enable') ? 'FadeIn' : animation.open.effect,
            duration: showAnimation.duration,
            delay: showAnimation.delay,
            timingFunction: 'ease-out'
        };
        if (openDelay > 0) {
            const show = () => {
                if (followCursor) {
                    target.addEventListener('mousemove', onMouseMove);
                    target.addEventListener('touchstart', onMouseMove);
                    target.addEventListener('mouseenter', onMouseMove);
                }
                if (tooltipEle.current?.element) {
                    setOpenTarget(target);
                    setOpenAnimation(openAnimation);
                    setIsPopupOpen(true);
                    if (mouseEventsRef.current.event && followCursor) {
                        onMouseMove(mouseEventsRef.current.event);
                    }
                }
            };
            timers.current.show = setTimeout(show, openDelay);
        }
        else {
            if (tooltipEle.current) {
                setOpenTarget(target);
                setOpenAnimation(openAnimation);
                setIsPopupOpen(true);
            }
        }
        if (e) {
            wireMouseEvents(e, target);
        }
    };
    const checkCollision = (x, y) => {
        const elePos = {
            left: x,
            top: y,
            position: position,
            horizontal: tooltipPosition.current.x,
            vertical: tooltipPosition.current.y
        };
        const collideTarget = checkCollideTarget();
        const currentTooltipEle = React.createRef();
        currentTooltipEle.current = tooltipEle.current?.element;
        const affectedPos = isCollide(currentTooltipEle, collideTarget, sticky && position.indexOf('Right') >= 0 ? stickyElementRef.current.offsetWidth + x : x, y);
        if (affectedPos.length > 0) {
            elePos.horizontal = affectedPos.indexOf('left') >= 0 ? 'Right' : affectedPos.indexOf('right') >= 0 ? 'Left' :
                tooltipPosition.current.x;
            elePos.vertical = affectedPos.indexOf('top') >= 0 ? 'Bottom' : affectedPos.indexOf('bottom') >= 0 ? 'Top' :
                tooltipPosition.current.y;
        }
        return elePos;
    };
    const calculateElementPosition = (pos, offsetPos) => {
        return [isBodyContainer.current ? pos.left + offsetPos.left :
                (pos.left - containerElement.current.getBoundingClientRect().left) +
                    offsetPos.left + window.pageXOffset + containerElement.current.scrollLeft,
            isBodyContainer.current ? pos.top + offsetPos.top :
                (pos.top - containerElement.current.getBoundingClientRect().top) +
                    offsetPos.top + window.pageYOffset + containerElement.current.scrollTop];
    };
    const collisionFlipFit = (target, x, y) => {
        const elePos = checkCollision(x, y);
        let newPos = elePos.position;
        if (tooltipPosition.current.y !== elePos.vertical) {
            newPos = ((position?.indexOf('Bottom') === 0 || position?.indexOf('Top') === 0) ?
                elePos.vertical + tooltipPosition.current.x : tooltipPosition.current.x + elePos.vertical);
        }
        if (tooltipPosition.current.x !== elePos.horizontal) {
            if (newPos.indexOf('Left') === 0) {
                elePos.vertical = (newPos === 'LeftTop' || newPos === 'LeftCenter') ? 'Top' : 'Bottom';
                newPos = (elePos.vertical + 'Left');
            }
            if (newPos.indexOf('Right') === 0) {
                elePos.vertical = (newPos === 'RightTop' || newPos === 'RightCenter') ? 'Top' : 'Bottom';
                newPos = (elePos.vertical + 'Right');
            }
            elePos.horizontal = tooltipPosition.current.x;
        }
        const elePosVertical = elePos.vertical;
        const elePosHorizontal = elePos.horizontal;
        if (elePos.position !== newPos) {
            const pos = calculatePosition({ current: target }, elePosHorizontal.toLowerCase(), elePosVertical.toLowerCase(), isBodyContainer.current ? undefined :
                containerElement.current?.getBoundingClientRect());
            adjustArrow(target, newPos, elePosHorizontal, elePosVertical);
            const scalingFactors = getScalingFactor(target);
            const offsetPos = calculateTooltipOffset(newPos, scalingFactors.x, scalingFactors.y);
            if (!isBodyContainer.current) {
                offsetPos.top -= getOffSetPosition('TopBottom', newPos, offsetY);
                offsetPos.left -= getOffSetPosition('RightLeft', newPos, offsetX);
            }
            elePos.position = newPos;
            const elePosition = calculateElementPosition(pos, offsetPos);
            elePos.left = elePosition[0];
            elePos.top = elePosition[1];
        }
        else {
            adjustArrow(target, newPos, elePosHorizontal, elePosVertical);
        }
        const eleOffset = { left: elePos.left, top: elePos.top };
        const collideTarget = checkCollideTarget();
        const currentTooltipEle = React.createRef();
        currentTooltipEle.current = tooltipEle.current?.element;
        const updatedPosition = isBodyContainer.current ?
            fit(currentTooltipEle, collideTarget ? collideTarget : null, { X: true, Y: windowCollision }, eleOffset) : eleOffset;
        if (arrow && arrowElementRef.current != null && (newPos.indexOf('Bottom') === 0 || newPos.indexOf('Top') === 0)) {
            let arrowLeft = parseInt(arrowElementRef.current.style.left, 10) - (updatedPosition.left - elePos.left);
            if (arrowLeft < 0) {
                arrowLeft = 0;
            }
            else if ((arrowLeft + arrowElementRef.current.offsetWidth) > (tooltipEle.current?.element).clientWidth) {
                arrowLeft = (tooltipEle.current?.element).clientWidth - arrowElementRef.current.offsetWidth;
            }
            arrowElementRef.current.style.left = arrowLeft.toString() + 'px';
        }
        eleOffset.left = updatedPosition.left;
        eleOffset.top = updatedPosition.top;
        return eleOffset;
    };
    const getOffSetPosition = (positionString, newPos, offsetType) => {
        return ((positionString.indexOf(position.split(/(?=[A-Z])/)[0]) !== -1) &&
            (positionString.indexOf(newPos.split(/(?=[A-Z])/)[0]) !== -1)) ? (2 * offsetType) : 0;
    };
    const checkCollideTarget = () => {
        return !windowCollision && target?.current ? rootElemRef : null;
    };
    const hideTooltip = (hideAnimation, e, targetElement) => {
        if (closeDelay > 0) {
            clearTimeout(timers.current.hide);
            clearTimeout(timers.current.show);
            const hide = () => {
                if (closeDelay && tooltipEle.current && tooltipEle.current.element && isTooltipOpen) {
                    return;
                }
                tooltipHide(hideAnimation, e, targetElement);
            };
            timers.current.hide = setTimeout(hide, closeDelay);
        }
        else {
            tooltipHide(hideAnimation, e, targetElement);
        }
    };
    const tooltipHide = (hideAnimation, e, targetElement) => {
        let target;
        if (e) {
            target = props.target?.current || onFilterTarget ? (targetElement || e.target)
                : rootElemRef.current;
        }
        else {
            target = targetRef.current;
        }
        originalData.current = { ...originalData.current, hideEvent: e, hideAnimation: hideAnimation, hideTarget: target };
        if (tooltipEle.current && tooltipEle.current.element?.getAttribute('sf-animate')) {
            const currentTooltipEle = React.createRef();
            currentTooltipEle.current = tooltipEle.current?.element;
            PopupAnimation.stop(currentTooltipEle.current, {
                end: () => {
                    handlePopupHide(hideAnimation, target, e);
                }
            });
        }
        else {
            handlePopupHide(hideAnimation, target, e);
        }
    };
    const handlePopupHide = (hideAnimation, target, e) => {
        onClose?.(e);
        if (!isNullOrUndefined(open)) {
            if (open && !onClose) {
                setIsHidden(false);
            }
            else if (!open) {
                mouseMoveBeforeRemove();
                popupHide(hideAnimation, target, e);
            }
        }
        else {
            mouseMoveBeforeRemove();
            popupHide(hideAnimation, target, e);
        }
    };
    const popupHide = (hideAnimation, target, e) => {
        if (target && e) {
            restoreElement(target);
        }
        const closeAnimation = {
            name: (hideAnimation.effect === 'None' && animationMode === 'Enable') ? 'FadeOut' : animation.close.effect,
            duration: hideAnimation.duration,
            delay: hideAnimation.delay,
            timingFunction: 'ease-in'
        };
        if (tooltipEle.current) {
            setCloseAnimation(closeAnimation);
            setIsPopupOpen(false);
        }
    };
    const restoreElement = (target) => {
        unWireMouseEvents(target);
        if (!isNullOrUndefined(target.getAttribute('data-content'))) {
            target.setAttribute('title', target.getAttribute('data-content'));
            target.removeAttribute('data-content');
        }
        removeDescribedBy(target);
    };
    const clear = () => {
        const target = targetRef.current;
        if (target) {
            restoreElement(target);
        }
        if (isHidden) {
            setArrowInnerTipStyle({ top: '', left: '' });
            tooltipEle.current = null;
        }
    };
    const tooltipHover = () => {
        if (tooltipEle.current && tooltipEle.current.element) {
            setIsTooltipOpen(true);
        }
    };
    const tooltipMouseOut = (e) => {
        setIsTooltipOpen(false);
        hideTooltip(animation.close, e, targetRef.current);
    };
    const onMouseOut = (e) => {
        const enteredElement = e.relatedTarget;
        if (enteredElement) {
            const checkForTooltipElement = closest(enteredElement, `.${TOOLTIP_WRAP}.${POPUP_LIB}.${POPUP_ROOT}`);
            if (checkForTooltipElement) {
                if (followCursor) {
                    onMouseMove(e);
                }
                checkForTooltipElement.addEventListener('mouseleave', tooltipElementMouseOut);
            }
            else {
                hideTooltip(animation.close, e, targetRef.current);
                if (closeDelay === 0 && (animation.close.effect === 'None')) {
                    clear();
                }
            }
        }
        else {
            hideTooltip(animation.close, e, targetRef.current);
            clear();
        }
    };
    const tooltipElementMouseOut = (e) => {
        tooltipEle.current?.element?.removeEventListener('mouseleave', tooltipElementMouseOut);
        if (!e.relatedTarget || closest(e.relatedTarget, '.sf-tooltip') !== rootElemRef.current) {
            hideTooltip(animation.close, e, targetRef.current);
            clear();
        }
    };
    const onMouseMove = (event) => {
        let eventPageX = 0;
        let eventPageY = 0;
        if (event.type.indexOf('touch') > -1) {
            event.preventDefault();
            eventPageX = event.touches[0].pageX;
            eventPageY = event.touches[0].pageY;
        }
        else {
            eventPageX = event.pageX;
            eventPageY = event.pageY;
        }
        if (isNullOrUndefined(tooltipEle.current)) {
            return;
        }
        if (tooltipEle.current) {
            tooltipEle.current.element.style.display = 'block';
        }
        const currentTooltipEle = React.createRef();
        currentTooltipEle.current = tooltipEle.current?.element;
        PopupAnimation.stop(currentTooltipEle.current);
        adjustArrow(event.target, position, tooltipPosition.current.x, tooltipPosition.current.y);
        const scalingFactors = getScalingFactor(event.target);
        const pos = calculateTooltipOffset(position, scalingFactors.x, scalingFactors.y);
        const x = eventPageX + pos.left + offsetX;
        const y = eventPageY + pos.top + offsetY;
        const elePos = checkCollision(x, y);
        if (tooltipPosition.current.x !== elePos.horizontal || tooltipPosition.current.y !== elePos.vertical) {
            const newPos = (position?.indexOf('Bottom') === 0 || position?.indexOf('Top') === 0) ?
                elePos.vertical + elePos.horizontal : elePos.horizontal + elePos.vertical;
            elePos.position = newPos;
            adjustArrow(event.target, elePos.position, elePos.horizontal, elePos.vertical);
            const colPos = calculateTooltipOffset(elePos.position, scalingFactors.x, scalingFactors.y);
            elePos.left = eventPageX + colPos.left - offsetX;
            elePos.top = eventPageY + colPos.top - offsetY;
        }
        const popupStyle = {
            position: 'absolute',
            left: elePos.left + 'px',
            top: elePos.top + 'px',
            zIndex: 1000,
            width: formatUnit(width),
            height: formatUnit(height),
            display: 'block'
        };
        setTooltipStyle((prevStyle) => ({
            ...prevStyle,
            style: {
                ...(prevStyle?.style || {}),
                ...popupStyle
            }
        }));
    };
    const keyDown = (event) => {
        if (tooltipEle.current && tooltipEle.current.element && event.keyCode === 27) {
            closeTooltip();
        }
    };
    const touchEnd = (e) => {
        if (tooltipEle.current && tooltipEle.current.element && closest(e.target, '.sf-tooltip') === null && !sticky && !opensOn.includes('Focus')) {
            closeTooltip();
        }
    };
    const scrollHandler = (e) => {
        if (tooltipEle.current && tooltipEle.current.element && !sticky && !followCursor && !scrolled.current) {
            if (!(closest(e.target, `.${TOOLTIP_WRAP}.${POPUP_LIB}.${POPUP_ROOT}`))) {
                setIsPopupOpen((prev) => {
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
    const wireEvents = (trigger) => {
        const triggerList = getTriggerList(trigger);
        const newEventProps = {};
        for (const opensOn of triggerList) {
            if (opensOn === 'Custom') {
                return;
            }
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
                }
                else {
                    newEventProps.onMouseOver = targetHover;
                }
            }
        }
        setEventProps((prevProps) => ({
            ...prevProps,
            ...newEventProps
        }));
    };
    const getTriggerList = (trigger) => {
        if (!trigger) {
            return [];
        }
        if (trigger === 'Auto') {
            trigger = (Browser.isDevice) ? 'Hover' : 'Hover Focus';
        }
        return trigger.split(' ');
    };
    const wireFocusEvents = () => {
        const focusEventProps = {};
        if (!isNullOrUndefined(props.target) && !isNullOrUndefined(props.target?.current)) {
            props.target?.current.addEventListener('focus', targetHover);
        }
        else {
            focusEventProps.onFocus = targetHover;
        }
        setEventProps((prevProps) => ({
            ...prevProps,
            ...focusEventProps
        }));
    };
    const wireMouseEvents = (e, target) => {
        if (tooltipEle.current && tooltipEle.current.element) {
            if (!sticky) {
                if (e.type === 'focus') {
                    if (!isNullOrUndefined(props.target) && !isNullOrUndefined(props.target?.current) || onFilterTarget) {
                        target.addEventListener('blur', onMouseOut);
                    }
                    else {
                        setEventProps((prevProps) => ({
                            ...prevProps,
                            onBlur: onMouseOut
                        }));
                    }
                }
                if (e.type === 'mouseover') {
                    target.addEventListener('mouseleave', onMouseOut);
                }
                if (closeDelay) {
                    tooltipEle.current.element.addEventListener('mouseenter', tooltipHover);
                    tooltipEle.current.element.addEventListener('mouseleave', tooltipMouseOut);
                }
            }
            if (followCursor && openDelay === 0) {
                target.addEventListener('mousemove', onMouseMove);
                target.addEventListener('mouseenter', onMouseMove);
            }
        }
    };
    const unWireEvents = (trigger) => {
        const triggerList = getTriggerList(trigger);
        const newEventProps = {};
        for (const opensOn of triggerList) {
            if (opensOn === 'Custom') {
                return;
            }
            if (opensOn === 'Focus') {
                unWireFocusEvents();
            }
            if (opensOn === 'Click') {
                newEventProps.onMouseDown = undefined;
            }
            if (opensOn === 'Hover') {
                if (touchModule.current && touchModule.current.destroy) {
                    touchModule.current.destroy();
                }
                newEventProps.onTouchEnd = undefined;
                newEventProps.onMouseOver = undefined;
            }
        }
        setEventProps((prevProps) => {
            const updatedProps = { ...prevProps };
            Object.keys(newEventProps).forEach((key) => {
                delete updatedProps[key];
            });
            return updatedProps;
        });
    };
    const unWireFocusEvents = () => {
        const focusEventProps = {};
        if (!isNullOrUndefined(props.target) && !isNullOrUndefined(props.target?.current) && rootElemRef.current) {
            props.target?.current.removeEventListener('focus', targetHover);
        }
        else {
            focusEventProps.onFocus = undefined;
        }
        setEventProps((prevProps) => {
            const updatedProps = { ...prevProps };
            Object.keys(focusEventProps).forEach((key) => {
                delete updatedProps[key];
            });
            return updatedProps;
        });
    };
    const unWireMouseEvents = (target) => {
        if (!sticky) {
            const triggerList = getTriggerList(opensOn);
            for (const opensOn of triggerList) {
                if (opensOn === 'Focus') {
                    target.removeEventListener('blur', onMouseOut);
                    setEventProps((prevProps) => {
                        const updatedProps = { ...prevProps };
                        delete updatedProps['onBlur'];
                        return updatedProps;
                    });
                }
                if (opensOn === 'Hover' && !Browser.isDevice) {
                    target.removeEventListener('mouseleave', onMouseOut);
                }
            }
            if (closeDelay) {
                target.removeEventListener('mouseenter', tooltipHover);
                target.removeEventListener('mouseleave', tooltipMouseOut);
            }
        }
        if (followCursor) {
            target.removeEventListener('mousemove', onMouseMove);
            target.removeEventListener('mouseenter', onMouseOut);
        }
    };
    const closeTooltip = () => {
        hideTooltip(animation.close);
    };
    const arrowIcon = React.useMemo(() => {
        switch (tipClass) {
            case TIP_BOTTOM:
                return TIP_BOTTOM_ICON;
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
    const renderTooltipContent = () => (_jsxs(Popup, { ref: tooltipEle, isOpen: isPopupOpen, role: 'tooltip', "aria-hidden": false, showAnimation: openAnimation, hideAnimation: closeAnimation, relativeElement: openTarget, targetRef: targetRef, position: { X: elePos.left, Y: elePos.top }, viewPortElementRef: containerElement.current ? containerElement : undefined, width: formatUnit(width), height: formatUnit(height), onOpen: openPopupHandler, onClose: closePopupHandler, className: [
            TOOLTIP_WRAP,
            className,
            Browser.isDevice ? DEVICE : ''
        ].filter(Boolean).join(' '), ...TooltipStyle, children: [_jsx("div", { className: CONTENT, children: renderContent() }), arrow && (_jsxs("div", { ref: arrowElementRef, className: `${ARROW_TIP} ${tipClass}`, children: [_jsx("div", { className: `${ARROW_TIP_OUTER} ${tipClass}` }), _jsx("div", { className: `${ARROW_TIP_INNER} ${tipClass}`, style: arrowInnerTipStyle, children: _jsx(SvgIcon, { d: arrowIcon }) })] })), sticky && (_jsx("div", { ref: stickyElementRef, className: `${CLOSE}`, role: "button", "aria-label": "Close Tooltip", onClick: () => { closeTooltip(); }, children: _jsx(SvgIcon, { width: '12px', height: '12px', d: CLOSE_ICON }) }))] }));
    return (_jsxs(_Fragment, { children: [_jsx("div", { ref: rootElemRef, className: [
                    ROOT,
                    className
                ].filter(Boolean).join(' '), ...eventProps, ...restProps, children: children }), !isHidden && containerElement.current && createPortal(renderTooltipContent(), containerElement.current)] }));
});
export default React.memo(Tooltip);
