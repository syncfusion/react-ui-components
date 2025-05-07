/**
 * Interface for the bound options used in the observer.
 */
export interface BoundOptions {
    handler?: Function;
    context?: Object;
    event?: string;
    id?: string;
}
export interface IObserver {
    isJson: (value: string) => boolean;
    ranArray: string[];
    boundedEvents: {
        [key: string]: BoundOptions[];
    };
    on: (property: string, handler: Function, context?: object, id?: string) => void;
    off: (property: string, handler?: Function, id?: string) => void;
    notify: (property: string, argument?: Object, successHandler?: Function, errorHandler?: Function) => void | Object;
    destroy: () => void;
}
/**
 * Observer is used to perform event handling based the object.
 *
 * @returns {IObserver} Returns an Observer instance for event handling
 */
export declare const Observer: any;
