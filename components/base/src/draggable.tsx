import { RefObject, useLayoutEffect } from 'react';
import { extend, isUndefined, isNullOrUndefined, compareElementParent } from './util';
import { closest, setStyleAttribute, createElement, addClass, isVisible, select } from './dom';
import { Browser } from './browser';
import { EventHandler } from './event-handler';
import { setDragArea, PositionCoordinates, elementInViewport, getDocumentWidthHeight, Coordinates, getCoordinates, calculateParentPosition, getPathElements, getScrollParent } from './drag-util';
import { DragDropContextProps, DroppableContext, useDragDropContext } from './dragdrop';

/**
 * The default position coordinates used for initializing or resetting positions.
 */
const defaultPosition: PositionCoordinates = { left: 0, top: 0, bottom: 0, right: 0 };
/**
 * Drag state object to check if dragging has started.
 */
const isDraggedObject: DragObject = { isDragged: false };

/**
 * Specifies the Direction in which drag movement happen.
 */
export type DragDirection = 'x' | 'y';

/**
 * Drag object interface
 */
interface DragObject {
    isDragged?: boolean;
}

/**
 * Specifies the position coordinates.
 */
export interface IPosition {
    /**
     * Specifies the left position of cursor in draggable.
     */
    left?: number;

    /**
     * Specifies the top position of cursor in draggable.
     */
    top?: number;
}

/**
 * Hook to manage Position.
 *
 * @private
 * @param {Partial<IPosition>} props - Initial values for the position properties.
 * @returns {IPosition} - The initialized position properties.
 */
export function Position(props?: IPosition): IPosition {
    const propsRef: IPosition = {
        left: 0,
        top: 0,
        ...props
    };
    return propsRef;
}
/**
 * Page information
 */
interface PageInfo {
    x?: number;
    y?: number;
}

/**
 * Interface to specify the drag data in the droppable.
 */
export interface DropInfo {
    /**
     * Specifies the current draggable element
     */
    draggable?: HTMLElement;
    /**
     * Specifies the current helper element.
     */
    helper?: HTMLElement;
    /**
     * Specifies the drag target element
     */
    draggedElement?: HTMLElement;
}

export interface DropObject {
    target?: HTMLElement;
    instance?: DropOption;
}

/**
 * Used to access values
 *
 * @private
 */
export interface DragPosition {
    left?: string;
    top?: string;
}

/**
 * Droppable function to be invoked from draggable
 *
 * @private
 */
export interface DropOption {
    /**
     * Used to triggers over function while draggable element is over the droppable element.
     */
    intOver?: Function;
    /**
     * Used to triggers out function while draggable element is out of the droppable element.
     */
    intOut?: Function;
    /**
     * Used to triggers  out function while draggable element is dropped on the droppable element.
     */
    intDrop?: Function;
    /**
     * Specifies the information about the drag element.
     */
    dragData?: DropInfo;
    /**
     * Specifies the status of the drag of drag stop calling.
     */
    dragStopCalled?: boolean;
}

/**
 * Drag Event arguments
 */
export interface DragEventArgs {
    /**
     * Specifies the actual event.
     */
    event?: MouseEvent & TouchEvent;
    /**
     * Specifies the current drag element.
     */
    element?: HTMLElement;
    /**
     * Specifies the current target element.
     */
    target?: HTMLElement;
    /**
     * 'true' if the drag or drop action is to be prevented; otherwise false.
     */
    cancel?: boolean;
}

/**
 * Draggable interface for public and protected properties and methods.
 */
export interface IDraggable {
    /**
     * Defines the distance between the cursor and the draggable element.
     */
    cursorAt?: IPosition;
    /**
     * If `clone` set to true, drag operations are performed in duplicate element of the draggable element.
     *
     * @default true
     */
    clone?: boolean;
    /**
     * Defines the parent element in which draggable element movement will be restricted.
     */
    dragArea?: HTMLElement | string;
    /**
     * Defines the dragArea is scrollable or not.
     */
    isDragScroll?: boolean;
    /**
     * Defines whether to replace drag element by currentStateTarget.
     *
     * @private
     */
    isReplaceDragEle?: boolean;
    /**
     * Defines whether to add prevent select class to body or not.
     *
     * @private
     */
    isPreventSelect?: boolean;
    /**
     * Specifies the callback function for drag event.
     *
     * @event drag
     */
    drag?: Function;
    /**
     * Specifies the callback function for dragStart event.
     *
     * @event dragStart
     */
    dragStart?: Function;
    /**
     * Specifies the callback function for dragStop event.
     *
     * @event dragStop
     */
    dragStop?: Function;
    /**
     * Defines the minimum distance draggable element to be moved to trigger the drag operation.
     *
     * @default 1
     */
    distance?: number;
    /**
     * Defines the child element selector which will act as drag handle.
     */
    handle?: string;
    /**
     * Defines the child element selector which will prevent dragging of element.
     */
    abort?: string | string[];
    /**
     * Defines the callback function for customizing the cloned element.
     */
    helper?: Function;
    /**
     * Defines the scope value to group sets of draggable and droppable items.
     * A draggable with the same scope value will be accepted by the droppable.
     *
     * @default 'default'
     */
    scope?: string;
    /**
     * Specifies the dragTarget by which the clone element is positioned if not given current context element will be considered.
     *
     * @private
     */
    dragTarget?: string;
    /**
     * Defines the axis to limit the draggable element drag path. The possible axis path values are
     * * `x` - Allows drag movement in horizontal direction only.
     * * `y` - Allows drag movement in vertical direction only.
     */
    axis?: DragDirection;
    /**
     * Defines the function to change the position value.
     *
     * @private
     */
    queryPositionInfo?: Function;
    /**
     * Defines whether the drag clone element will be split form the cursor pointer.
     *
     * @private
     */
    enableTailMode?: boolean;
    /**
     * Defines whether to skip the previous drag movement comparison.
     *
     * @private
     */
    skipDistanceCheck?: boolean;
    /**
     *
     * @private
     */
    preventDefault?: boolean;
    /**
     * Defines whether to enable autoscroll on drag movement of draggable element.
     * enableAutoScroll
     *
     * @private
     */
    enableAutoScroll?: boolean;
    /**
     * Gets the element of the draggable.
     */
    element?: RefObject<HTMLElement>;
    /**
     * Defines whether to enable taphold on mobile devices.
     * enableAutoScroll
     *
     * @private
     */
    enableTapHold?: boolean;
    /**
     * Specifies the time delay for tap hold.
     *
     * @default 750
     * @private
     */
    tapHoldThreshold?: number;
    /**
     *
     * @private
     */
    enableScrollHandler?: boolean;
    /**
     * Destroys the draggable instance by removing event listeners and cleaning up resources.
     *
     * @private
     */
    intDestroy?(): void;
    /**
     * Method to clean up and remove event handlers on the component destruction.
     *
     * @private
     */
    destroy?(): void;
}

/**
 * Draggable function provides support to enable draggable functionality in Dom Elements.
 *
 * @param {RefObject<HTMLElement>} element - The reference to the HTML element to be made draggable
 * @param {IDraggable} [props] - Optional properties to configure the draggable behavior
 * @returns {IDraggable} A Draggable object with draggable functionality
 */
export function useDraggable(element: RefObject<HTMLElement>, props?: IDraggable): IDraggable {
    const droppableContext: DragDropContextProps = useDragDropContext();
    const propsRef: IDraggable = {
        cursorAt: Position({}),
        clone: true,
        dragArea: null,
        isDragScroll: false,
        isReplaceDragEle: false,
        isPreventSelect: true,
        distance: 1,
        handle: '',
        abort: '',
        helper: null,
        scope: 'default',
        dragTarget: '',
        axis: null,
        queryPositionInfo: null,
        enableTailMode: false,
        skipDistanceCheck: false,
        preventDefault: true,
        enableAutoScroll: false,
        enableTapHold: false,
        tapHoldThreshold: 750,
        enableScrollHandler: false,
        element: element,
        ...props
    };

    /* Global Variables */
    let target: HTMLElement;
    let initialPosition: PageInfo;
    let relativeXPosition: number;
    let relativeYPosition: number;
    let margin: PositionCoordinates;
    let offset: PositionCoordinates;
    let position: PositionCoordinates;
    let dragLimit: PositionCoordinates = useDraggable.getDefaultPosition();
    let borderWidth: PositionCoordinates = useDraggable.getDefaultPosition();
    const padding: PositionCoordinates = useDraggable.getDefaultPosition();
    let pageX: number;
    let diffX: number = 0;
    let prevLeft: number = 0;
    let prevTop: number = 0;
    let dragProcessStarted: boolean = false;
    let tapHoldTimer: ReturnType<typeof setTimeout> | null = null;
    let dragElePosition: { top: number, left: number };
    let currentStateTarget: HTMLElement;
    let externalInitialize: boolean = false;
    let diffY: number = 0;
    let pageY: number;
    let helperElement: HTMLElement;
    let hoverObject: DropObject;
    let parentClientRect: IPosition;
    let parentScrollX: number = 0;
    let parentScrollY: number = 0;
    let initialScrollX: number = 0;
    let initialScrollY: number = 0;
    const droppables: { [key: string]: DropInfo } = {};

    /**
     * Toggles event listeners for the draggable element.
     *
     * @param {boolean} [isUnWire] - Flag to determine if events should be removed.
     * @returns {void}
     */
    function toggleEvents(isUnWire?: boolean): void {
        let ele: Element;
        if (!isNullOrUndefined(propsRef.handle) && propsRef.handle !== '') {
            ele = select(propsRef.handle, element.current);
        }
        const handler: Function = (propsRef.enableTapHold && Browser.isDevice && Browser.isTouch) ? mobileInitialize : initialize;
        if (isUnWire) {
            EventHandler.remove(ele || element.current, Browser.isSafari() ? 'touchstart' : Browser.touchStartEvent, handler);
        } else {
            EventHandler.add(ele || element.current, Browser.isSafari() ? 'touchstart' : Browser.touchStartEvent, handler);
        }
    }

    /**
     * Initializes drag events for mobile devices with tap hold support.
     *
     * @param {MouseEvent | TouchEvent} evt - The initial event that triggered the drag.
     * @returns {void}
     */
    function mobileInitialize(evt: MouseEvent & TouchEvent): void {
        const target: EventTarget = evt.currentTarget;
        tapHoldTimer = setTimeout(
            () => {
                externalInitialize = true;
                removeTapholdTimer();
                initialize(evt, target);
            },
            propsRef.tapHoldThreshold
        );
        EventHandler.add(document, Browser.isSafari() ? 'touchmove' : Browser.touchMoveEvent, removeTapholdTimer, this);
        EventHandler.add(document, Browser.isSafari() ? 'touchend' : Browser.touchEndEvent, removeTapholdTimer, this);
    }

    /**
     * Binds drag-related events to the drag target element.
     *
     * @param {HTMLElement} dragTargetElement - The element that will act as the drag target.
     * @returns {void}
     */
    function bindDragEvents(dragTargetElement: HTMLElement): void {
        if (isVisible(dragTargetElement)) {
            EventHandler.add(document, Browser.isSafari() ? 'touchmove' : Browser.touchMoveEvent, intDrag, this);
            EventHandler.add(document, Browser.isSafari() ? 'touchend' : Browser.touchEndEvent, intDragStop, this);
            setGlobalDroppables(false, element.current, dragTargetElement);
        } else {
            toggleEvents();
            document.body.classList.remove('sf-prevent-select');
        }
    }

    /**
     * Removes the tap hold timer and detaches related event listeners.
     *
     * @returns {void}
     */
    function removeTapholdTimer(): void {
        clearTimeout(tapHoldTimer);
        EventHandler.remove(document, Browser.isSafari() ? 'touchmove' : Browser.touchMoveEvent, removeTapholdTimer);
        EventHandler.remove(document, Browser.isSafari() ? 'touchend' : Browser.touchEndEvent, removeTapholdTimer);
    }

    /**
     * Retrieves the scrollable parent of a given element along a specified axis.
     *
     * @param {HTMLElement} element - The element whose scrollable parent is to be found.
     * @param {string} axis - The axis ('vertical' or 'horizontal') to check for scrollability.
     * @returns {HTMLElement | null} - The scrollable parent element, or null if none found.
     */
    // eslint-disable-next-line
    const getScrollableParent: Function = (element: HTMLElement, axis: string): HTMLElement | null => {
        const scroll: { [key: string]: string } = { 'vertical': 'scrollHeight', 'horizontal': 'scrollWidth' };
        const client: { [key: string]: string } = { 'vertical': 'clientHeight', 'horizontal': 'clientWidth' };
        if (isNullOrUndefined(element)) {
            return null;
        }
        if ((element as unknown as { [key: string]: number })[scroll[`${axis}`]] >
            ((element as unknown as { [key: string]: number })[client[`${axis}`]])
        ) {
            if (axis === 'vertical' ? element.scrollTop > 0 : element.scrollLeft > 0) {
                if (axis === 'vertical') {
                    parentScrollY += (parentScrollY === 0 ? element.scrollTop : element.scrollTop - parentScrollY);
                } else {
                    parentScrollX += (parentScrollX === 0 ? element.scrollLeft : element.scrollLeft - parentScrollX);
                }
                if (!isNullOrUndefined(element)) {
                    return getScrollableParent(element.parentNode as HTMLElement, axis);
                } else {
                    return element;
                }
            } else {
                return getScrollableParent(element.parentNode as HTMLElement, axis);
            }
        } else {
            return getScrollableParent(element.parentNode as HTMLElement, axis);
        }
    };

    /**
     * Calculates and stores scrollable values for the draggable element.
     *
     * @returns {void}
     */
    function getScrollableValues(): void {
        parentScrollX = 0;
        parentScrollY = 0;
    }

    /**
     * Initializes the drag operation.
     *
     * @param {MouseEvent | TouchEvent} evt - The event that initiated the drag action.
     * @param {EventTarget} [curTarget] - The current target element of the event.
     * @returns {void}
     */
    function initialize(evt: MouseEvent & TouchEvent, curTarget?: EventTarget): void {
        element.current = getActualElement(element) as HTMLElement;
        currentStateTarget = evt.target as HTMLElement;
        if (isDragStarted()) {
            return;
        } else {
            isDragStarted(true);
            externalInitialize = false;
        }
        target = evt.currentTarget as HTMLElement || curTarget as HTMLElement;
        dragProcessStarted = false;
        if (propsRef.abort) {
            let abortSelectors: string | string[] = propsRef.abort;
            if (typeof abortSelectors === 'string') {
                abortSelectors = [abortSelectors];
            }
            for (let i: number = 0; i < abortSelectors.length; i++) {
                if (!isNullOrUndefined(closest((evt.target as Element), abortSelectors[`${i}`]))) {
                    if (isDragStarted()) {
                        isDragStarted(true);
                    }
                    return;
                }
            }
        }
        if (propsRef.preventDefault && !isUndefined(evt.changedTouches) && evt.type !== 'touchstart') {
            evt.preventDefault();
        }
        element.current.setAttribute('aria-grabbed', 'true');
        const intCoord: Coordinates = getCoordinates(evt);
        initialPosition = { x: intCoord.pageX, y: intCoord.pageY };
        if (!propsRef.clone) {
            const pos: IPosition = element.current.getBoundingClientRect();
            getScrollableValues();
            relativeXPosition = intCoord.pageX - (pos.left + parentScrollX);
            relativeYPosition = intCoord.pageY - (pos.top + parentScrollY);
        }

        if (externalInitialize) {
            intDragStart(evt);
        } else {
            EventHandler.add(document, Browser.isSafari() ? 'touchmove' : Browser.touchMoveEvent, intDragStart, this);
            EventHandler.add(document, Browser.isSafari() ? 'touchend' : Browser.touchEndEvent, propsRef.intDestroy, this);
        }
        toggleEvents(true);
        if (evt.type !== 'touchstart' && propsRef.isPreventSelect) {
            document.body.classList.add('sf-prevent-select');
        }
        externalInitialize = false;
        EventHandler.trigger(document.documentElement, Browser.isSafari() ? 'touchstart' : Browser.touchStartEvent, evt);
    }

    /**
     * Initiates the drag start operation.
     *
     * @param {MouseEvent | TouchEvent} evt - The event that initiates the drag start.
     * @returns {void}
     */
    function intDragStart(evt: MouseEvent & TouchEvent): void {
        removeTapholdTimer();
        if (document.scrollingElement) {
            initialScrollX = document.scrollingElement.scrollLeft;
            initialScrollY = document.scrollingElement.scrollTop;
        }
        const isChangeTouch: boolean = !isUndefined(evt.changedTouches);
        if (isChangeTouch && (evt.changedTouches.length !== 1)) {
            return;
        }
        const intCordinate: Coordinates = getCoordinates(evt);
        let pos: IPosition;
        const styleProp: CSSStyleDeclaration = getComputedStyle(element.current);
        margin = {
            left: parseInt(styleProp.marginLeft, 10),
            top: parseInt(styleProp.marginTop, 10),
            right: parseInt(styleProp.marginRight, 10),
            bottom: parseInt(styleProp.marginBottom, 10)
        };
        let dragElement: HTMLElement = element.current;
        if (propsRef.clone && propsRef.dragTarget) {
            const intClosest: HTMLElement = closest(evt.target as Element, propsRef.dragTarget) as HTMLElement;
            if (!isNullOrUndefined(intClosest)) {
                dragElement = intClosest;
            }
        }
        if (propsRef.isReplaceDragEle) {
            dragElement = currentStateCheck(evt.target as HTMLElement, dragElement);
        }
        offset = calculateParentPosition(dragElement);
        position = getMousePosition(evt, propsRef.isDragScroll);
        const x: number = initialPosition.x - intCordinate.pageX;
        const y: number = initialPosition.y - intCordinate.pageY;
        const distance: number = Math.sqrt((x * x) + (y * y));
        if ((distance >= propsRef.distance || externalInitialize)) {
            const ele: HTMLElement = getHelperElement(evt);
            if (!ele) {
                return;
            }
            if (isChangeTouch) {
                evt.preventDefault();
            }
            const dragTargetElement: HTMLElement = helperElement = ele;
            parentClientRect = calculateParentPosition(dragTargetElement.offsetParent);
            if (propsRef.dragStart) {
                const curTarget: HTMLElement = getProperTargetElement(evt);
                const args: object = {
                    event: evt,
                    element: dragElement,
                    target: curTarget,
                    bindEvents: null,
                    dragElement: dragTargetElement
                };
                propsRef.dragStart(args as DragEventArgs);
                if ((args as DragEventArgs).cancel) {
                    return undefined;
                }
            }
            if (propsRef.dragArea) {
                setDragArea(propsRef.dragArea, helperElement, borderWidth, padding, dragLimit);
            } else {
                dragLimit = { left: 0, right: 0, bottom: 0, top: 0 };
                borderWidth = { top: 0, left: 0 };
            }
            pos = { left: position.left - parentClientRect.left, top: position.top - parentClientRect.top };
            if (propsRef.clone && !propsRef.enableTailMode) {
                diffX = position.left - offset.left;
                diffY = position.top - offset.top;
            }

            getScrollableValues();
            const styles: CSSStyleDeclaration = getComputedStyle(dragElement);
            const marginTop: number = parseFloat(styles.marginTop);
            if (propsRef.clone && marginTop !== 0) {
                pos.top += marginTop;
            }
            if (propsRef.enableScrollHandler && !propsRef.clone) {
                pos.top -= parentScrollY;
                pos.left -= parentScrollX;
            }
            const posValue: DragPosition = getProcessedPositionValue({
                top: `${pos.top - diffY}px`,
                left: `${pos.left - diffX}px`
            });
            if (propsRef.dragArea && typeof propsRef.dragArea !== 'string' && propsRef.dragArea.classList.contains('sf-kanban-content') && propsRef.dragArea.style.position === 'relative') {
                pos.top += propsRef.dragArea.scrollTop;
            }
            dragElePosition = { top: pos.top, left: pos.left };
            setStyleAttribute(dragTargetElement, getDragPosition({ position: 'absolute', left: posValue.left, top: posValue.top }));
            EventHandler.remove(document, Browser.isSafari() ? 'touchmove' : Browser.touchMoveEvent, intDragStart);
            EventHandler.remove(document, Browser.isSafari() ? 'touchend' : Browser.touchEndEvent, propsRef.intDestroy);
            bindDragEvents(dragTargetElement);
        }
    }

    /**
     * Initializes the variables and manages the drag operation progress.
     *
     * @param {MouseEvent |TouchEvent} evt - The event that triggers the drag.
     * @returns {void}
     */
    function intDrag(evt: MouseEvent & TouchEvent): void {
        if (!isUndefined(evt.changedTouches) && (evt.changedTouches.length !== 1)) {
            return;
        }
        if (propsRef.clone && evt.changedTouches && Browser.isDevice && Browser.isTouch) {
            evt.preventDefault();
        }
        let left: number;
        let top: number;
        position = getMousePosition(evt, propsRef.isDragScroll);
        const docHeight: number = getDocumentWidthHeight('Height');
        if (docHeight < position.top) {
            position.top = docHeight;
        }
        const docWidth: number = getDocumentWidthHeight('Width');
        if (docWidth < position.left) {
            position.left = docWidth;
        }
        if (propsRef.drag) {
            const curTarget: HTMLElement = getProperTargetElement(evt);
            propsRef.drag({ event: evt, element: element.current, target: curTarget } as DragEventArgs);
        }
        const eleObj: DropObject = checkTargetElement(evt);
        if (eleObj.target && eleObj.instance) {
            let flag: boolean = true;
            if (hoverObject) {
                if (hoverObject.instance !== eleObj.instance) {
                    triggerOutFunction(evt, eleObj);
                } else {
                    flag = false;
                }
            }
            if (flag) {
                eleObj.instance.dragData[propsRef.scope] = droppables[propsRef.scope];
                eleObj.instance.intOver(evt, eleObj.target);
                hoverObject = eleObj;
            }
        } else if (hoverObject) {
            triggerOutFunction(evt, eleObj);
        }
        const helperElement: HTMLElement = droppables[propsRef.scope].helper;
        parentClientRect = calculateParentPosition(helperElement.offsetParent);
        const tLeft: number = parentClientRect.left;
        const tTop: number = parentClientRect.top;
        const intCoord: Coordinates = getCoordinates(evt);
        const pagex: number = intCoord.pageX;
        const pagey: number = intCoord.pageY;
        const dLeft: number = position.left - diffX;
        const dTop: number = position.top - diffY;
        const styles: CSSStyleDeclaration = getComputedStyle(helperElement);
        if (propsRef.dragArea) {
            if (propsRef.enableAutoScroll) {
                setDragArea(propsRef.dragArea, helperElement, borderWidth, padding, dragLimit);
            }
            if (pageX !== pagex || propsRef.skipDistanceCheck) {
                const helperWidth: number = helperElement.offsetWidth + (parseFloat(styles.marginLeft) + parseFloat(styles.marginRight));
                if (dragLimit.left > dLeft && dLeft > 0) {
                    left = dragLimit.left;
                } else if (dragLimit.right + window.pageXOffset < dLeft + helperWidth && dLeft > 0) {
                    left = dLeft - (dLeft - dragLimit.right) + window.pageXOffset - helperWidth;
                } else {
                    left = dLeft < 0 ? dragLimit.left : dLeft;
                }
            }
            if (pageY !== pagey || propsRef.skipDistanceCheck) {
                const helperHeight: number = helperElement.offsetHeight + (parseFloat(styles.marginTop) + parseFloat(styles.marginBottom));
                if (dragLimit.top > dTop && dTop > 0) {
                    top = dragLimit.top;
                } else if (dragLimit.bottom + window.pageYOffset < dTop + helperHeight && dTop > 0) {
                    top = dTop - (dTop - dragLimit.bottom) + window.pageYOffset - helperHeight;
                } else {
                    top = dTop < 0 ? dragLimit.top : dTop;
                }
            }
        } else {
            left = dLeft;
            top = dTop;
        }
        const iTop: number = tTop + borderWidth.top;
        const iLeft: number = tLeft + borderWidth.left;
        if (dragProcessStarted) {
            if (isNullOrUndefined(top)) {
                top = prevTop;
            }
            if (isNullOrUndefined(left)) {
                left = prevLeft;
            }
        }
        let draEleTop: number;
        let draEleLeft: number;
        if (helperElement.classList.contains('sf-treeview')) {
            if (propsRef.dragArea) {
                dragLimit.top = propsRef.clone ? dragLimit.top : 0;
                draEleTop = (top - iTop) < 0 ? dragLimit.top : (top - borderWidth.top);
                draEleLeft = (left - iLeft) < 0 ? dragLimit.left : (left - borderWidth.left);
            } else {
                draEleTop = top - borderWidth.top;
                draEleLeft = left - borderWidth.left;
            }
        } else {
            if (propsRef.dragArea) {
                const isDialogEle: boolean = helperElement.classList.contains('sf-dialog');
                dragLimit.top = propsRef.clone ? dragLimit.top : 0;
                draEleTop = (top - iTop) < 0 ? dragLimit.top : (top - iTop);
                draEleLeft = (left - iLeft) < 0 ? isDialogEle ? (left - (iLeft - borderWidth.left)) : dragElePosition.left : (left - iLeft);
            } else {
                draEleTop = top - iTop;
                draEleLeft = left - iLeft;
            }
        }
        const marginTop: number = parseFloat(getComputedStyle(element.current).marginTop);
        if (marginTop > 0) {
            if (propsRef.clone) {
                draEleTop += marginTop;
                if (dTop < 0) {
                    if ((marginTop + dTop) >= 0) {
                        draEleTop = marginTop + dTop;
                    } else {
                        draEleTop -= marginTop;
                    }
                }
                if (propsRef.dragArea) {
                    draEleTop = (dragLimit.bottom < draEleTop) ? dragLimit.bottom : draEleTop;
                }
            }
            if ((top - iTop) < 0) {
                if (dTop + marginTop + (helperElement.offsetHeight - iTop) >= 0) {
                    const tempDraEleTop: number = dragLimit.top + dTop - iTop;
                    if ((tempDraEleTop + marginTop + iTop) < 0) {
                        draEleTop -= marginTop + iTop;
                    } else {
                        draEleTop = tempDraEleTop;
                    }
                } else {
                    draEleTop -= marginTop + iTop;
                }
            }
        }

        if (propsRef.dragArea && helperElement.classList.contains('sf-treeview')) {
            const helperHeight: number = helperElement.offsetHeight + (parseFloat(styles.marginTop) + parseFloat(styles.marginBottom));
            draEleTop = (draEleTop + helperHeight) > dragLimit.bottom ? (dragLimit.bottom - helperHeight) : draEleTop;
        }

        if (propsRef.enableScrollHandler && !propsRef.clone) {
            draEleTop -= parentScrollY;
            draEleLeft -= parentScrollX;
        }
        if (propsRef.dragArea && typeof propsRef.dragArea !== 'string' && propsRef.dragArea.classList.contains('sf-kanban-content') && propsRef.dragArea.style.position === 'relative') {
            draEleTop += propsRef.dragArea.scrollTop;
        }
        const dragValue: DragPosition = getProcessedPositionValue({ top: draEleTop + 'px', left: draEleLeft + 'px' });
        setStyleAttribute(helperElement, getDragPosition(dragValue));
        if (!elementInViewport(helperElement) && propsRef.enableAutoScroll && !helperElement.classList.contains('sf-treeview')) {
            helperElement.scrollIntoView();
        }

        let elements: NodeList | Element[] = document.querySelectorAll(':hover');
        if (propsRef.enableAutoScroll && helperElement.classList.contains('sf-treeview')) {
            if (elements.length === 0) {
                elements = getPathElements(evt);
            }
            let scrollParent: Element | null = getScrollParent(elements as Element[], false);
            if (elementInViewport(helperElement)) {
                getScrollPosition(scrollParent as HTMLElement, draEleTop);
            } else if (!elementInViewport(helperElement)) {
                elements = [].slice.call(document.querySelectorAll(':hover'));
                if (elements.length === 0) {
                    elements = getPathElements(evt);
                }
                scrollParent = getScrollParent(elements as Element[], true);
                getScrollPosition(scrollParent as HTMLElement, draEleTop);
            }
        }

        dragProcessStarted = true;
        prevLeft = left;
        prevTop = top;
        position.left = left;
        position.top = top;
        pageX = pagex;
        pageY = pagey;
    }

    /**
     * Stops the drag operation and performs cleanup.
     *
     * @param {MouseEvent | TouchEvent} evt - The event that initiated the drag stop.
     * @returns {void}
     */
    function intDragStop(evt: MouseEvent & TouchEvent): void {
        dragProcessStarted = false;
        initialScrollX = 0;
        initialScrollY = 0;
        if (!isUndefined(evt.changedTouches) && (evt.changedTouches.length !== 1)) {
            return;
        }
        const type: string[] = ['touchend', 'pointerup', 'mouseup'];
        if (type.indexOf(evt.type) !== -1) {
            if (propsRef.dragStop) {
                const curTarget: HTMLElement = getProperTargetElement(evt);
                propsRef.dragStop({ event: evt, element: element.current, target: curTarget, helper: helperElement } as DragEventArgs);
            }
            propsRef.intDestroy();
        } else {
            element.current.setAttribute('aria-grabbed', 'false');
        }
        const eleObj: DropObject = checkTargetElement(evt);
        if (eleObj.target && eleObj.instance) {
            eleObj.instance.dragStopCalled = true;
            eleObj.instance.dragData[propsRef.scope] = droppables[propsRef.scope];
            eleObj.instance.intDrop(evt, eleObj.target);
        }
        setGlobalDroppables(true);
        document.body.classList.remove('sf-prevent-select');
    }

    /**
     * Method to bind events.
     *
     * @returns {void}
     */
    function bind(): void {
        toggleEvents();
        if (Browser.isIE) {
            addClass([propsRef.element.current], 'sf-block-touch');
        }
        droppables[propsRef.scope] = {};
    }
    /**
     * Destroys the draggable instance by removing event listeners and cleaning up resources.
     *
     * @returns {void}
     */
    propsRef.intDestroy = (): void => {
        dragProcessStarted = false;
        toggleEvents();
        document.body.classList.remove('sf-prevent-select');
        element.current.setAttribute('aria-grabbed', 'false');
        EventHandler.remove(document, Browser.isSafari() ? 'touchmove' : Browser.touchMoveEvent, intDragStart);
        EventHandler.remove(document, Browser.isSafari() ? 'touchend' : Browser.touchEndEvent, intDragStop);
        EventHandler.remove(document, Browser.isSafari() ? 'touchend' : Browser.touchEndEvent, propsRef.intDestroy);
        EventHandler.remove(document, Browser.isSafari() ? 'touchmove' : Browser.touchMoveEvent, intDrag);
        if (isDragStarted()) {
            isDragStarted(true);
        }
    };

    /**
     * Method to clean up and remove event handlers on the component destruction.
     *
     * @returns {void}
     */
    propsRef.destroy = (): void => {
        toggleEvents(true);
    };

    /**
     * Triggers the out function for the previous hover target when a new draggable
     * target is detected or when the pointer is out of the current drop zone.
     *
     * @param {MouseEvent | TouchEvent} evt - The event object.
     * @param {DropObject} eleObj - The drop object containing target and instance.
     * @returns {void}
     */
    function triggerOutFunction(evt: MouseEvent & TouchEvent, eleObj: DropObject): void {
        hoverObject.instance.intOut(evt, eleObj.target);
        hoverObject.instance.dragData[propsRef.scope] = null;
        hoverObject = null;
    }

    /**
     * Checks and retrieves the correct target element under the pointer during a drag operation.
     *
     * @param {MouseEvent | TouchEvent} evt - The event object.
     * @returns {HTMLElement} - The correct target element.
     */
    function getProperTargetElement(evt: MouseEvent & TouchEvent): HTMLElement {
        const intCoord: Coordinates = getCoordinates(evt);
        let ele: HTMLElement;
        const prevStyle: string = helperElement.style.pointerEvents || '';
        const isPointer: boolean = evt.type.indexOf('pointer') !== -1 && Browser.info.name === 'safari' && parseInt(Browser.info.version, 10) > 12;
        if (compareElementParent(evt.target as Element, helperElement) || evt.type.indexOf('touch') !== -1 || isPointer) {
            helperElement.style.pointerEvents = 'none';
            ele = document.elementFromPoint(intCoord.clientX, intCoord.clientY) as HTMLElement;
            helperElement.style.pointerEvents = prevStyle;
        } else {
            ele = evt.target as HTMLElement;
        }
        return ele;
    }

    /**
     * Retrieves the position of the mouse or touch event relative to the document or parent element.
     *
     * @param {MouseEvent | TouchEvent} evt - The drag event.
     * @param {boolean} [isdragscroll] - Indicates if the dragging is performed with scrolling.
     * @returns {IPosition} - The left and top coordinates of the drag event.
     */
    function getMousePosition(evt: MouseEvent & TouchEvent, isdragscroll?: boolean): IPosition {
        const dragEle: EventTarget | null = evt.srcElement !== undefined ? evt.srcElement : evt.target;
        const intCoord: Coordinates = getCoordinates(evt);
        let pageX: number;
        let pageY: number;
        const isOffsetParent: boolean = isNullOrUndefined((dragEle as HTMLElement).offsetParent);
        if (isdragscroll) {
            pageX = propsRef.clone ? intCoord.pageX
                : (intCoord.pageX + (isOffsetParent ? 0 : (dragEle as HTMLElement).offsetParent.scrollLeft)) - relativeXPosition;
            pageY = propsRef.clone ? intCoord.pageY
                : (intCoord.pageY + (isOffsetParent ? 0 : (dragEle as HTMLElement).offsetParent.scrollTop)) - relativeYPosition;
            if (!propsRef.clone) {
                const offsetParent: HTMLElement = (dragEle as HTMLElement).offsetParent as HTMLElement;
                if (!isOffsetParent && offsetParent) {
                    const currentScrollLeft: number = offsetParent.scrollLeft;
                    const currentScrollTop: number = offsetParent.scrollTop;
                    const scrollDeltaX: number = currentScrollLeft - initialScrollX;
                    const scrollDeltaY: number = currentScrollTop - initialScrollY;
                    pageX = pageX - scrollDeltaX;
                    pageY = pageY - scrollDeltaY;
                }
            }
        } else {
            pageX = propsRef.clone ? intCoord.pageX : (intCoord.pageX + window.pageXOffset) - relativeXPosition;
            pageY = propsRef.clone ? intCoord.pageY : (intCoord.pageY + window.pageYOffset) - relativeYPosition;
            if (document.scrollingElement && (!propsRef.clone)) {
                const ele: Element = document.scrollingElement;
                const currentScrollX: number = ele.scrollLeft;
                const currentScrollY: number = ele.scrollTop;
                const scrollDeltaX: number = currentScrollX - initialScrollX;
                const scrollDeltaY: number = currentScrollY - initialScrollY;
                pageX = pageX - scrollDeltaX;
                pageY = pageY - scrollDeltaY;
            }
        }
        return {
            left: pageX - (margin.left + propsRef.cursorAt.left),
            top: pageY - (margin.top + propsRef.cursorAt.top)
        };
    }


    /**
     * Retrieves or creates the helper element for the drag operation.
     *
     * @param {MouseEvent | TouchEvent} evt - The event triggering the drag.
     * @returns {HTMLElement} - The helper element used during dragging.
     */
    function getHelperElement(evt: MouseEvent & TouchEvent): HTMLElement {
        let element: HTMLElement;
        if (propsRef.clone) {
            if (propsRef.helper) {
                element = propsRef.helper({ sender: evt, element: target });
            } else {
                element = createElement('div', { className: 'sf-drag-helper sf-block-touch', innerHTML: 'Draggable' });
                document.body.appendChild(element);
            }
        } else {
            element = propsRef.element.current;
        }
        return element;
    }

    /**
     * Sets the global drop object for the current scope, managing the relationship
     * between draggable and droppable elements.
     *
     * @param {boolean} reset - Whether to reset or set the droppable object.
     * @param {HTMLElement} [drag] - The current draggable element.
     * @param {HTMLElement} [helper] - The helper element used during dragging.
     * @returns {void}
     */
    function setGlobalDroppables(reset: boolean, drag?: HTMLElement, helper?: HTMLElement): void {
        droppables[propsRef.scope] = reset ? null : {
            draggable: drag,
            helper: helper,
            draggedElement: propsRef.element.current
        };
    }

    /**
     * Checks and retrieves the drop target and its associated droppable instance.
     *
     * @param {MouseEvent | TouchEvent} evt - The event object.
     * @returns {DropObject} - Contains the drop target and the droppable instance.
     */
    function checkTargetElement(evt: MouseEvent & TouchEvent): DropObject {
        const dropTarget: HTMLElement = getProperTargetElement(evt);
        let dropInstance: DropOption = getDropInstance(dropTarget);
        if (!dropInstance && dropTarget && !isNullOrUndefined(dropTarget.parentNode)) {
            const parent: Element = closest(dropTarget.parentNode, '.sf-droppable') || dropTarget.parentElement;
            if (parent) {
                dropInstance = getDropInstance(parent);
            }
        }
        return { target: dropTarget as HTMLElement, instance: dropInstance };
    }

    /**
     * Retrieves the drop instance associated with a DOM element.
     *
     * @param {Element} ele - The DOM element to find the drop instance for
     * @returns {DropOption} The drop instance if found, otherwise undefined
     */
    function getDropInstance(ele: Element): DropOption | undefined {
        let droppables: Record<string, DroppableContext>;
        let dropInstance: DropOption;
        if (droppableContext) {
            const { getAllDroppables } = droppableContext;
            droppables = getAllDroppables();
            for (const id in droppables) {
                if (Object.prototype.hasOwnProperty.call(droppables, id)) {
                    const instance: DroppableContext = droppables[`${id}`];
                    if (instance.element && instance.element.current === ele) {
                        dropInstance = instance;
                        break;
                    }
                }
            }
        }
        else {
            return undefined;
        }
        return dropInstance;
    }


    /**
     * Checks if the dragging has started and toggles the isDragged state.
     *
     * @param {boolean} [change] - Optional flag to change the drag state.
     * @returns {boolean} - The current drag state.
     */
    function isDragStarted(change?: boolean): boolean {
        if (change) {
            isDraggedObject.isDragged = !isDraggedObject.isDragged;
        }
        return isDraggedObject.isDragged;
    }


    /**
     * Processes the position values of a draggable element. If a custom
     * queryPositionInfo function is provided, it will use that to process
     * the position. Otherwise, it returns the original value.
     *
     * @param {DragPosition} value - The position values (left and top) to be processed.
     * @returns {DragPosition} - The processed or original position values.
     */
    function getProcessedPositionValue(value: DragPosition): DragPosition {
        if (propsRef.queryPositionInfo) {
            return propsRef.queryPositionInfo(value);
        }
        return value;
    }

    /**
     * Computes the drag position of an element based on specified constraints or axis limitations.
     *
     * @param {DragPosition | { position: string }} dragValue - The raw drag position values.
     * @returns {Record<string, string | number>} - Adjusted drag position values with applied constraints.
     */
    function getDragPosition(dragValue: DragPosition & { position?: string }): Record<string, string | number> {
        const temp: Record<string, string | number> = { ...dragValue };
        if (propsRef.axis) {
            if (propsRef.axis === 'x') {
                delete temp.top;
            } else if (propsRef.axis === 'y') {
                delete temp.left;
            }
        }
        return temp;
    }

    /**
     * Adjusts the scroll position of a parent element to ensure the draggable element
     * remains visible during scrolling.
     *
     * @param {Element} nodeEle - The element intended to be scrolled.
     * @param {number} draEleTop - The top position of the draggable element.
     * @returns {void}
     */
    function getScrollPosition(nodeEle: HTMLElement, draEleTop: number): void {
        if (nodeEle === document.scrollingElement) {
            if ((nodeEle.clientHeight + nodeEle.scrollTop - helperElement.clientHeight) < draEleTop
                && nodeEle.getBoundingClientRect().height + parentClientRect.top > draEleTop) {
                nodeEle.scrollTop += helperElement.clientHeight;
            } else if (nodeEle.scrollTop > draEleTop - helperElement.clientHeight) {
                nodeEle.scrollTop -= helperElement.clientHeight;
            }
        } else if (nodeEle) {
            const docScrollTop: number = document.scrollingElement.scrollTop;
            const helperClientHeight: number = helperElement.clientHeight;
            if ((nodeEle.clientHeight + nodeEle.getBoundingClientRect().top - helperClientHeight + docScrollTop) < draEleTop) {
                nodeEle.scrollTop += helperElement.clientHeight;
            } else if (nodeEle.getBoundingClientRect().top > (draEleTop - helperClientHeight - docScrollTop)) {
                nodeEle.scrollTop -= helperElement.clientHeight;
            }
        }
    }

    /**
     * Checks and returns the appropriate current state element.
     * Determines whether to use the current state's target or revert to a specified element.
     *
     * @param {HTMLElement} ele - The current element.
     * @param {HTMLElement} [oldEle] - The previous element, if any.
     * @returns {HTMLElement} - The element considered to be in the current state.
     */
    function currentStateCheck(ele: HTMLElement, oldEle?: HTMLElement): HTMLElement {
        let elem: HTMLElement;
        if (!isNullOrUndefined(currentStateTarget) && currentStateTarget !== ele) {
            elem = currentStateTarget;
        } else {
            elem = !isNullOrUndefined(oldEle) ? oldEle : ele;
        }
        return elem;
    }

    /**
     * Retrieves the underlying HTML element from a possibly forwarded ref or custom element.
     *
     * @param {RefObject<HTMLElement>} elementRef - The ref object containing the element.
     * @returns {HTMLElement} The actual HTML element
     */
    function getActualElement(
        elementRef: React.RefObject<HTMLElement | { element?: HTMLElement }>
    ): HTMLElement | { element?: HTMLElement | undefined; } {
        if (elementRef.current) {
            if (!(elementRef.current instanceof HTMLElement) &&
                elementRef.current.element &&
                elementRef.current.element instanceof HTMLElement) {
                return elementRef.current.element;
            }
        }
        return elementRef.current;
    }


    useLayoutEffect(() => {
        if (!propsRef.element.current) {
            return undefined;
        }
        propsRef.element.current = getActualElement(propsRef.element) as HTMLElement;
        addClass([propsRef.element.current], ['sf-lib', 'sf-draggable']);
        bind();
        return () => {
            propsRef.destroy();
        };
    });

    return propsRef;
}

/**
 * Retrieves the default position coordinates.
 *
 * @returns {PositionCoordinates} - The default position coordinates with left, top, bottom, and right set to 0.
 */
useDraggable.getDefaultPosition = (): PositionCoordinates => {
    return extend({}, defaultPosition);
};
