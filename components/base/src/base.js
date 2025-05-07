import { useLayoutEffect, useRef } from 'react';
import { Observer } from './observer';
import { isNullOrUndefined, getValue } from './util';
const isColEName = new RegExp(']');
/**
 * Base component function that initializes and manages component properties.
 *
 * @private
 * @template ElementType - The type of the element reference.
 * @param {IBase<ElementType>} [props] - The initial properties for the component.
 * @param {RefObject<ElementType>} [element] - The reference object for the element.
 * @returns {IBase<ElementType>} The initialized component properties.
 */
export function Base(props, element) {
    const modelObserver = Observer();
    const propsRef = {
        isDestroyed: false,
        isProtectedOnChange: true,
        modelObserver,
        ...props
    };
    propsRef.element = useRef(null);
    /**
     * Adds the handler to the given event listener.
     *
     * @param {string} eventName - A String that specifies the name of the event.
     * @param {Function} handler - Specifies the function to run when the event occurs.
     * @returns {void}
     */
    propsRef.addEventListener = (eventName, handler) => {
        propsRef.modelObserver.on(eventName, handler);
    };
    /**
     * Removes the handler from the given event listener.
     *
     * @param {string} eventName - A String that specifies the name of the event to remove.
     * @param {Function} handler - Specifies the function to remove.
     * @returns {void}
     */
    propsRef.removeEventListener = (eventName, handler) => {
        propsRef.modelObserver.off(eventName, handler);
    };
    /**
     * Triggers the handlers in the specified event.
     *
     * @param {string} eventName - Specifies the event to trigger for the specified component properties.
     * @param {Object} [eventProp] - Additional parameters to pass on to the event properties.
     * @param {Function} [successHandler] - This function will invoke after the event successfully triggered.
     * @param {Function} [errorHandler] - This function will invoke if the event fails to trigger.
     * @returns {void | object} ?
     */
    propsRef.trigger = (eventName, eventProp, successHandler, errorHandler) => {
        if (propsRef.isDestroyed !== true) {
            const prevDetection = propsRef.isProtectedOnChange;
            propsRef.isProtectedOnChange = false;
            const data = propsRef.modelObserver.notify(eventName, eventProp, successHandler, errorHandler);
            if (isColEName.test(eventName)) {
                const handler = getValue(eventName, propsRef);
                if (handler) {
                    handler.call(propsRef, eventProp);
                    if (successHandler) {
                        successHandler.call(propsRef, eventProp);
                    }
                }
                else if (successHandler) {
                    successHandler.call(propsRef, eventProp);
                }
            }
            propsRef.isProtectedOnChange = prevDetection;
            return data;
        }
    };
    /**
     * Destroys the instance and cleans up resources.
     *
     * @returns {void}
     */
    propsRef.destroy = () => {
        propsRef.modelObserver.destroy();
        propsRef.isDestroyed = true;
    };
    useLayoutEffect(() => {
        /**
         * Initialize the instance.
         */
        if (element && !isNullOrUndefined(element.current)) {
            propsRef.element.current = element.current;
            propsRef.isProtectedOnChange = false;
        }
        propsRef.isDestroyed = false;
    }, []);
    return propsRef;
}
