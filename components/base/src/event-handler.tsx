import { debounce, extend } from './util';
import { Browser } from './browser';

/**
 * Interface for EventHandler.
 */
interface IEventHandler {
    add: (
        element: Element | HTMLElement | Document,
        eventName: string,
        listener: Function,
        bindTo?: Object,
        intDebounce?: number
    ) => Function | null;
    clearEvents: (element: Element) => void;
    remove: (
        element: Element | HTMLElement | Document,
        eventName: string,
        listener: Function
    ) => void;
    trigger: (element: HTMLElement, eventName: string, eventProp?: Object) => void;
}

/**
 * Custom hook to handle events on HTML elements.
 */
export const EventHandler: IEventHandler = (() => {
    /**
     * Adds or retrieves event data from an element.
     *
     * @param {Element | HTMLElement | Document} element - The target element to retrieve or add event data.
     * @returns {EventOptions[]} - The list of event options associated with the element.
     */
    function addOrGetEventData(element: Element | HTMLElement | Document): EventOptions[] {
        if (!element) {
            return null;
        }
        if ('__eventList' in element) {
            return (element as EventData).__eventList.events || [];
        } else {
            (element as EventData).__eventList = {};
            return (element as EventData).__eventList.events = [];
        }
    }

    /**
     * Adds an event listener to the specified DOM element.
     *
     * @param {Element | HTMLElement | Document} element - Target HTML DOM element.
     * @param {string} eventName - A string that specifies the name of the event.
     * @param {Function} listener - Specifies the function to run when the event occurs.
     * @param {Object} [bindTo] - An object that binds 'this' variable in the event handler.
     * @param {number} [intDebounce] - Specifies at what interval the given event listener should be triggered.
     * @returns {Function} - The final event listener function with optional debounce and binding applied.
     */
    function add(
        element: Element | HTMLElement | Document,
        eventName: string,
        listener: Function,
        bindTo?: Object,
        intDebounce?: number
    ): Function {
        if (!element) {
            return null;
        }
        const eventData: EventOptions[] = addOrGetEventData(element);
        let debounceListener: Function = intDebounce ? debounce(listener, intDebounce) : listener;
        if (bindTo) { debounceListener = debounceListener.bind(bindTo); }
        const event: string[] = eventName.split(' ');
        for (let i: number = 0; i < event.length; i++) {
            eventData.push({
                name: event[parseInt(i.toString(), 10)],
                listener: listener,
                debounce: debounceListener
            });
            const options: {passive: boolean} = Browser.isIE ? null : { passive: false };
            element.addEventListener(event[parseInt(i.toString(), 10)], debounceListener as EventListener, options);
        }
        return debounceListener;
    }

    /**
     * Removes an event listener from the specified DOM element.
     *
     * @param {Element | HTMLElement | Document} element - Specifies the target HTML element to remove the event.
     * @param {string} eventName - A string that specifies the name of the event to remove.
     * @param {Function} listener - Specifies the function to remove.
     * @returns {void}
     */
    function remove(
        element: Element | HTMLElement | Document,
        eventName: string,
        listener: Function
    ): void {
        if (!element) {
            return null;
        }
        const eventData: EventOptions[] = addOrGetEventData(element);
        const event: string[] = eventName.split(' ');
        for (let j: number = 0; j < event.length; j++) {
            let index: number = -1;
            let debounceListener: Function | null = null;
            if (eventData && eventData.length !== 0) {
                eventData.some((x: EventOptions, i: number) => {
                    if (x.name === event[parseInt(j.toString(), 10)] && x.listener === listener) {
                        index = i;
                        debounceListener = x.debounce || null;
                        return true;
                    }
                    return false;
                });
            }
            if (index !== -1) {
                eventData.splice(index, 1);
            }
            if (debounceListener) {
                element.removeEventListener(event[parseInt(j.toString(), 10)], debounceListener as EventListener);
            }
        }
    }

    /**
     * Clears all the event listeners that have been previously attached to the element.
     *
     * @param {Element} element - Specifies the target HTML element to clear the events.
     * @returns {void}
     */
    function clearEvents(element: Element): void {
        if (!element) {
            return null;
        }
        const eventData: EventOptions[] = addOrGetEventData(element);
        const copyData: EventOptions[] = extend([], undefined, eventData) as EventOptions[];
        for (let i: number = 0; i < copyData.length; i++) {
            const parseValue: EventOptions = copyData[parseInt(i.toString(), 10)];
            element.removeEventListener(parseValue.name, parseValue.debounce as EventListener);
            eventData.shift();
        }
    }

    /**
     * Triggers a specific event on the given HTML element.
     *
     * @param {HTMLElement} element - Specifies the target HTML element to trigger the event.
     * @param {string} eventName - Specifies the event to trigger for the specified element.
     * @param {Object} [eventProp] - Additional parameters to pass on to the event properties.
     * @returns {void}
     */
    function trigger(element: HTMLElement, eventName: string, eventProp?: Object): void {
        if (!element) {
            return null;
        }
        const eventData: EventOptions[] = addOrGetEventData(element);
        for (const event of eventData) {
            if (event.name === eventName) {
                event.debounce(eventProp);
            }
        }
    }

    return {
        add,
        clearEvents,
        remove,
        trigger
    };
})();

/**
 * Interface for EventData extending Element for custom event storage.
 */
interface EventData extends Element {
    __eventList: EventList;
}

/**
 * Interface for a list of events associated with an element.
 */
interface EventList {
    events?: EventOptions[];
}

/**
 * Interface for event options to store event details.
 */
interface EventOptions {
    name: string;
    listener: Function;
    debounce?: Function;
}

/**
 * Common Event argument for all base Essential JavaScript 2 Events.
 *
 * @private
 */
export interface BaseEventArgs {
    /**
     * Specifies name of the event.
     */
    name?: string;
}
