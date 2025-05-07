import { RefObject } from 'react';
import { IObserver } from './observer';
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
export declare function Base<ElementType>(props?: IBase<ElementType>, element?: RefObject<ElementType>): IBase<ElementType>;
