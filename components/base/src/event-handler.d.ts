/**
 * Interface for EventHandler.
 */
interface IEventHandler {
    add: (element: Element | HTMLElement | Document, eventName: string, listener: Function, bindTo?: Object, intDebounce?: number) => Function | null;
    clearEvents: (element: Element) => void;
    remove: (element: Element | HTMLElement | Document, eventName: string, listener: Function) => void;
    trigger: (element: HTMLElement, eventName: string, eventProp?: Object) => void;
}
/**
 * Custom hook to handle events on HTML elements.
 */
export declare const EventHandler: IEventHandler;
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
export {};
