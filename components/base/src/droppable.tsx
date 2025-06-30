import { RefObject, useId, useLayoutEffect } from 'react';
import { Browser } from './browser';
import { addClass, isVisible, matches } from './dom';
import { compareElementParent } from './util';
import { EventHandler } from './event-handler';
import { DropInfo } from './draggable';
import { Coordinates } from './drag-util';
import { DragDropContextProps, useDragDropContext } from './dragdrop';

/**
 * Droppable arguments in drop callback.
 *
 * @private
 */
export interface DropData {
    /**
     * Specifies that current element can be dropped.
     */
    canDrop?: boolean;
    /**
     * Specifies target to drop.
     */
    target?: HTMLElement;
}

export interface DropEvents {
    dropTarget?: HTMLElement;
}

/**
 * Interface for drop event args
 */
export interface DropEventArgs {
    /**
     * Specifies the original mouse or touch event arguments.
     */
    event?: MouseEvent & TouchEvent;
    /**
     * Specifies the target element.
     */
    target?: HTMLElement;
    /**
     *  Specifies the dropped element.
     */
    droppedElement?: HTMLElement;
    /**
     * Specifies the dragData.
     */
    dragData?: DropInfo;
}

/**
 * Main interface for public properties in Droppable.
 */
export interface IDroppableProps {
    /**
     * Defines the selector for draggable element to be accepted by the droppable.
     */
    accept?: string;
    /**
     * Defines the scope value to group sets of draggable and droppable items.
     * A draggable with the same scope value will only be accepted by the droppable.
     */
    scope?: string;
    /**
     * Specifies the callback function, which will be triggered while drag element is dropped in droppable.
     *
     * @event drop
     */
    drop?: (args: DropEventArgs) => void;
    /**
     * Specifies the callback function, which will be triggered while drag element is moved over droppable element.
     *
     * @event over
     */
    over?: Function;
    /**
     * Specifies the callback function, which will be triggered while drag element is moved out of droppable element.
     *
     * @event out
     */
    out?: Function;
}

/**
 * Main interface for protected methods in Droppable.
 */
export interface IDroppable extends IDroppableProps {
    /**
     * Data associated with the current drag operation.
     *
     * @private
     */
    dragData?: { [key: string]: DropInfo };
    /**
     * Method for handling interactions when dragged item is over the droppable area.
     *
     * @private
     * @param event - Mouse or touch event arguments.
     * @param element - The target element over which the drag is happening.
     */
    intOver?: (event: MouseEvent & TouchEvent, element?: Element) => void;
    /**
     * Method for handling interactions when dragged item is out of the droppable area.
     *
     * @private
     * @param event - Mouse or touch event arguments.
     * @param element - The target element from which the drag is moving out.
     */
    intOut?: (event: MouseEvent & TouchEvent, element?: Element) => void;
    /**
     * Method to clean up and remove event handlers on the component destruction.
     *
     * @private
     */
    intDrop?: (event: MouseEvent & TouchEvent, element?: Element) => void;
}

/**
 * Creates a droppable instance with the specified element and properties.
 *
 * @private
 * @param {RefObject<HTMLElement>} [element] - Reference to the HTML element to make droppable.
 * @param {IDroppable} [props] - Configuration properties for the droppable instance.
 * @returns {IDroppable} The configured droppable instance.
 */
export function useDroppable(element?: RefObject<HTMLElement>, props?: IDroppable): IDroppable {
    const droppableId: string = useId();
    const droppableContext: DragDropContextProps = useDragDropContext();
    const { registerDroppable, unregisterDroppable } = droppableContext || {};
    const propsRef: IDroppable = {
        accept: '',
        scope: 'default',
        dragData: {},
        drop: null,
        over: null,
        out: null,
        ...props
    };
    /** Represents whether the mouse is over the droppable area */
    let mouseOverRef: boolean = false;
    /** Indicates if drag stop has been called */
    let dragStopCalledRef: boolean = true;

    /**
     * Method to add drop events.
     *
     * @returns {void}
     */
    function addEvent(): void {
        EventHandler.add(element.current, Browser.isSafari() ? 'touchend' : Browser.touchEndEvent, propsRef.intDrop);
    }

    /**
     * Handles interactions when a dragged item is over the droppable area.
     *
     * @param {MouseEvent | TouchEvent} event - Mouse or touch event arguments.
     * @param {Element} [element] - The target element over which the drag is happening.
     * @returns {void}
     */
    propsRef.intOver = (event: MouseEvent & TouchEvent, element?: Element): void => {
        if (!mouseOverRef) {
            const drag: DropInfo = propsRef.dragData[propsRef.scope];
            if (propsRef.over) {
                propsRef.over({ event, target: element, dragData: drag });
            }
            mouseOverRef = true;
        }
    };

    /**
     * Method for handling interactions when dragged item is out of the droppable area.
     *
     * @param {MouseEvent | TouchEvent} event - Mouse or touch event arguments.
     * @param {Element} [element] - The target element from which the drag is moving out.
     * @returns {void}
     */
    propsRef.intOut = (event: MouseEvent & TouchEvent, element?: Element): void => {
        if (mouseOverRef) {
            if (propsRef.out) {
                propsRef.out({ event, target: element });
            }
            mouseOverRef = false;
        }
    };

    /**
     * Method to handle drop event.
     *
     * @param {MouseEvent | TouchEvent} evt - Mouse or touch event arguments.
     * @param {HTMLElement} [element] - The target element where the drop is happening.
     * @returns {void}
     */
    propsRef.intDrop = (evt: MouseEvent & TouchEvent, element?: HTMLElement): void => {
        if (!dragStopCalledRef) {
            return;
        } else {
            dragStopCalledRef = false;
        }
        let accept: boolean = true;
        const drag: DropInfo = propsRef.dragData[propsRef.scope];
        const isDrag: boolean = drag ? (drag.helper && isVisible(drag.helper)) : false;
        let area: DropData;
        if (isDrag) {
            area = isDropArea(evt, drag.helper, element);
            if (propsRef.accept) {
                accept = matches(drag.helper, propsRef.accept);
            }
        }
        if (isDrag && propsRef.drop && area.canDrop && accept) {
            propsRef.drop({ event: evt, target: area.target, droppedElement: drag.helper, dragData: drag });
        }
        mouseOverRef = false;
    };

    /**
     * Method to check if the drop area is valid.
     *
     * @param {MouseEvent | TouchEvent} evt - Mouse or touch event arguments.
     * @param {HTMLElement} helper - The helper element involved in the drag operation.
     * @param {HTMLElement} [element] - The element to check for drop validity.
     * @returns {DropData} - The result indicating if the area is a valid drop target and the target itself.
     */
    function isDropArea(evt: MouseEvent & TouchEvent, helper: HTMLElement, element?: HTMLElement): DropData {
        const area: DropData = { canDrop: true, target: element || (evt.target as HTMLElement) };
        const isTouch: boolean = evt.type === 'touchend';
        if (isTouch || area.target === helper) {
            helper.style.display = 'none';
            const coord: Coordinates = isTouch ? (evt.changedTouches[0]) : evt;
            const ele: Element = document.elementFromPoint(coord.clientX, coord.clientY);
            area.canDrop = false;
            area.canDrop = compareElementParent(ele, element);
            if (area.canDrop) {
                area.target = ele as HTMLElement;
            }
            helper.style.display = '';
        }
        return area;
    }

    /**
     * Method to clean up and remove event handlers on the component destruction.
     *
     * @returns {void}
     */
    function removeEvent(): void {
        EventHandler.remove(element.current, Browser.isSafari() ? 'touchend' : Browser.touchEndEvent, propsRef.intDrop);
    }

    useLayoutEffect(() => {
        addClass([element.current], ['sf-lib', 'sf-droppable']);
        addEvent();
        if (registerDroppable) {
            registerDroppable(droppableId, {
                ...propsRef,
                element: element
            });
        }
        return () => {
            if (unregisterDroppable) {
                unregisterDroppable(droppableId);
            }
            removeEvent();
        };
    }, []);

    return propsRef;
}
