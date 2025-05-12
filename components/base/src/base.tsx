import { RefObject, useLayoutEffect, useRef } from 'react';
import { Observer, IObserver } from './observer';
import { isNullOrUndefined, getValue } from './util';

const isColEName: RegExp = new RegExp(']');

export declare type EmitType<T> = ((arg?: T, ...rest: unknown[]) => void);

/**
 * Main interface for public and protected properties and methods in Base.
 *
 * @private
 */
export interface IBase<ElementType> {
    /**
     * Associated HTML element.
     *
     * @private
     */
    element?: RefObject<(ElementType) | null>;

    /**
     * Determines if the instance is destroyed.
     *
     * @private
     */
    isDestroyed?: boolean;

    /**
     * Checks if changes are protected.
     *
     * @private
     */
    isProtectedOnChange?: boolean;

    /**
     * Observer for the component model.
     *
     * @private
     */
    modelObserver?: IObserver;

    /**
     * Indicates if the component is refreshing.
     *
     * @private
     */
    refreshing?: boolean;

    /**
     * Adds an event listener.
     *
     * @private
     * @param eventName - The name of the event to listen for.
     * @param handler - The handler function to execute when the event is triggered.
     */
    addEventListener?(eventName: string, handler: Function): void;

    /**
     * Removes an event listener.
     *
     * @private
     * @param eventName - The name of the event to stop listening for.
     * @param handler - The handler function to remove.
     */
    removeEventListener?(eventName: string, handler: Function): void;

    /**
     * Triggers event listeners for a specified event.
     *
     * @private
     * @param eventName - The name of the event to trigger.
     * @param eventProp - Properties of the event.
     * @param successHandler - Function to call on successful event execution.
     * @param errorHandler - Function to call on failed event execution.
     * @returns {void | object}
     */
    trigger?(eventName: string, eventProp?: Object, successHandler?: Function, errorHandler?: Function): void | object;

    /**
     * Destroys the instance and cleans up resources.
     */
    destroy?(): void;
}

/**
 * Base component function that initializes and manages component properties.
 *
 * @private
 * @template ElementType - The type of the element reference.
 * @param {IBase<ElementType>} [props] - The initial properties for the component.
 * @param {RefObject<ElementType>} [element] - The reference object for the element.
 * @returns {IBase<ElementType>} The initialized component properties.
 */
export function Base<ElementType>(props?: IBase<ElementType>, element?: RefObject<ElementType>): IBase<ElementType> {
    const modelObserver: IObserver = Observer();

    const propsRef: IBase<ElementType> = {
        isDestroyed: false,
        isProtectedOnChange: true,
        modelObserver,
        ...props
    };

    propsRef.element = useRef<ElementType>(null);

    /**
     * Adds the handler to the given event listener.
     *
     * @param {string} eventName - A String that specifies the name of the event.
     * @param {Function} handler - Specifies the function to run when the event occurs.
     * @returns {void}
     */
    propsRef.addEventListener = (eventName: string, handler: Function) => {
        propsRef.modelObserver.on(eventName, handler);
    };

    /**
     * Removes the handler from the given event listener.
     *
     * @param {string} eventName - A String that specifies the name of the event to remove.
     * @param {Function} handler - Specifies the function to remove.
     * @returns {void}
     */
    propsRef.removeEventListener = (eventName: string, handler: Function): void => {
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
    propsRef.trigger = (
        eventName: string,
        eventProp?: Object,
        successHandler?: Function,
        errorHandler?: Function
    ): void | object => {
        if (propsRef.isDestroyed !== true) {
            const prevDetection: boolean = propsRef.isProtectedOnChange;
            propsRef.isProtectedOnChange = false;
            const data: object = propsRef.modelObserver.notify(eventName, eventProp, successHandler, errorHandler) as object;
            if (isColEName.test(eventName)) {
                const handler: Function = getValue(eventName, propsRef);
                if (handler) {
                    handler.call(propsRef, eventProp);
                    if (successHandler) {
                        successHandler.call(propsRef, eventProp);
                    }
                } else if (successHandler) {
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
