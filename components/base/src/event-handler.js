import { debounce, extend } from './util';
import { Browser } from './browser';
/**
 * Custom hook to handle events on HTML elements.
 */
export const EventHandler = (() => {
    /**
     * Adds or retrieves event data from an element.
     *
     * @param {Element | HTMLElement | Document} element - The target element to retrieve or add event data.
     * @returns {EventOptions[]} - The list of event options associated with the element.
     */
    function addOrGetEventData(element) {
        if (!element) {
            return null;
        }
        if ('__eventList' in element) {
            return element.__eventList.events || [];
        }
        else {
            element.__eventList = {};
            return element.__eventList.events = [];
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
    function add(element, eventName, listener, bindTo, intDebounce) {
        if (!element) {
            return null;
        }
        const eventData = addOrGetEventData(element);
        let debounceListener = intDebounce ? debounce(listener, intDebounce) : listener;
        if (bindTo) {
            debounceListener = debounceListener.bind(bindTo);
        }
        const event = eventName.split(' ');
        for (let i = 0; i < event.length; i++) {
            eventData.push({
                name: event[parseInt(i.toString(), 10)],
                listener: listener,
                debounce: debounceListener
            });
            const options = Browser.isIE ? null : { passive: false };
            element.addEventListener(event[parseInt(i.toString(), 10)], debounceListener, options);
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
    function remove(element, eventName, listener) {
        if (!element) {
            return null;
        }
        const eventData = addOrGetEventData(element);
        const event = eventName.split(' ');
        for (let j = 0; j < event.length; j++) {
            let index = -1;
            let debounceListener = null;
            if (eventData && eventData.length !== 0) {
                eventData.some((x, i) => {
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
                element.removeEventListener(event[parseInt(j.toString(), 10)], debounceListener);
            }
        }
    }
    /**
     * Clears all the event listeners that have been previously attached to the element.
     *
     * @param {Element} element - Specifies the target HTML element to clear the events.
     * @returns {void}
     */
    function clearEvents(element) {
        if (!element) {
            return null;
        }
        const eventData = addOrGetEventData(element);
        const copyData = extend([], undefined, eventData);
        for (let i = 0; i < copyData.length; i++) {
            const parseValue = copyData[parseInt(i.toString(), 10)];
            element.removeEventListener(parseValue.name, parseValue.debounce);
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
    function trigger(element, eventName, eventProp) {
        if (!element) {
            return null;
        }
        const eventData = addOrGetEventData(element);
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
