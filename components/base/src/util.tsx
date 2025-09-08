/* eslint-disable @typescript-eslint/no-explicit-any */
import { ReactElement, RefObject, version } from 'react';
/**
 * Common utility methods
 *
 * @private
 */
interface IKeyValue extends CSSStyleDeclaration {
    [key: string]: any;
}

declare let window: {
    msCrypto: Crypto;
} & Window;
let uid: number = 0;

/**
 * Create Instance from constructor function with desired parameters.
 *
 * @param {Function} classFunction - Class function to which need to create instance
 * @param {any[]} params - Parameters need to passed while creating instance
 * @returns {any} ?
 * @private
 */
export function createInstance(classFunction: Function, params: any[]): any {
    const arrayParam: Object[] = params;
    arrayParam.unshift(undefined);
    return Function.prototype.bind.apply(classFunction, arrayParam);
}

/**
 * To run a callback function immediately after the browser has completed other operations.
 *
 * @param {Function} handler - callback function to be triggered.
 * @returns {Function} ?
 * @private
 */
export function setImmediate(handler: Function): Function {
    let unbind: Function;
    const num: any = new Uint16Array(5);
    const intCrypto: Crypto = window.msCrypto || window.crypto;
    intCrypto.getRandomValues(num);
    let secret: string = 'syn' + combineArray(num);
    let messageHandler: Function = (event: any): void => {
        if (event.source === window && typeof event.data === 'string' && event.data.length <= 32 && event.data === secret) {
            handler();
            unbind();
        }
    };
    window.addEventListener('message', messageHandler as EventListener, false);
    window.postMessage(secret, '*');
    return unbind = () => {
        window.removeEventListener('message', messageHandler as EventListener);
        handler = messageHandler = secret = undefined;
    };
}

/**
 * To get nameSpace value from the desired object.
 *
 * @param {string} nameSpace - String value to the get the inner object
 * @param {any} obj - Object to get the inner object value.
 * @returns {any} ?
 * @private
 */
export function getValue(nameSpace: string, obj: any): any {
    let value: any = obj;
    const splits: string[] = !isNullOrUndefined(nameSpace) ? nameSpace.replace(/\[/g, '.').replace(/\]/g, '').split('.') : [];
    for (let i: number = 0; i < splits.length && !isNullOrUndefined(value); i++) {
        value = value[splits[parseInt(i.toString(), 10)]];
    }
    return value;
}

/**
 * To set value for the nameSpace in desired object.
 *
 * @param {string} nameSpace - String value to the get the inner object
 * @param {any} value - Value that you need to set.
 * @param {any} obj - Object to get the inner object value.
 * @returns {any} ?
 * @private
 */
export function setValue(nameSpace: string, value: any, obj: any): any {
    const keys: string[] = nameSpace.replace(/\[/g, '.').replace(/\]/g, '').split('.');
    const start: any = obj || {};
    let fromObj: any = start;
    let i: number;
    const length: number = keys.length;
    let key: string;

    for (i = 0; i < length; i++) {
        key = keys[parseInt(i.toString(), 10)];

        if (i + 1 === length) {
            fromObj[`${key}`] = value === undefined ? {} : value;
        } else if (isNullOrUndefined(fromObj[`${key}`])) {
            fromObj[`${key}`] = {};
        }

        fromObj = fromObj[`${key}`];
    }

    return start;
}

/**
 * Delete an item from Object
 *
 * @param {any} obj - Object in which we need to delete an item.
 * @param {string} key - String value to the get the inner object
 * @returns {void} ?
 * @private
 */
export function deleteObject(obj: any, key: string): void {
    delete obj[`${key}`];
}

/**
 *@private
 */
export const containerObject: any = typeof window !== 'undefined' ? window : {};

/**
 * Check weather the given argument is only object.
 *
 * @param {any} obj - Object which is need to check.
 * @returns {boolean} ?
 * @private
 */
export function isObject(obj: any): boolean {
    const objCon: {} = {};
    return (!isNullOrUndefined(obj) && obj.constructor === objCon.constructor);
}

/**
 * To get enum value by giving the string.
 *
 * @param {any} enumObject - Enum object.
 * @param {string} enumValue - Enum value to be searched
 * @returns {any} ?
 * @private
 */
export function getEnumValue(enumObject: any, enumValue: string | number): any {
    return (enumObject[`${enumValue}`]);
}

/**
 * Merge the source object into destination object.
 *
 * @param {any} source - source object which is going to merge with destination object
 * @param {any} destination - object need to be merged
 * @returns {void} ?
 * @private
 */
export function merge(source: Object, destination: Object): void {
    if (!isNullOrUndefined(destination)) {
        const temrObj: IKeyValue = source as IKeyValue;
        const tempProp: IKeyValue = destination as IKeyValue;
        const keys: string[] = Object.keys(destination);
        const deepmerge: string = 'deepMerge';
        for (const key of keys) {
            if (!isNullOrUndefined(temrObj[`${deepmerge}`]) && (temrObj[`${deepmerge}`].indexOf(key) !== -1) &&
                (isObject(tempProp[`${key}`]) || Array.isArray(tempProp[`${key}`]))) {
                extend(temrObj[`${key}`], temrObj[`${key}`], tempProp[`${key}`], true);
            } else {
                temrObj[`${key}`] = tempProp[`${key}`];
            }
        }
    }
}

/**
 * Extend the two object with newer one.
 *
 * @param {any} copied - Resultant object after merged
 * @param {Object} first - First object need to merge
 * @param {Object} second - Second object need to merge
 * @param {boolean} deep ?
 * @returns {Object} ?
 * @private
 */
export function extend(copied: Object, first: Object, second?: Object, deep?: boolean): Object {
    const result: IKeyValue = copied && typeof copied === 'object' ? copied as IKeyValue : {} as IKeyValue;
    let length: number = arguments.length;
    const args: Object = [copied, first, second, deep];
    if (deep) {
        length = length - 1;
    }
    for (let i: number = 1; i < length; i++) {
        if (!args[parseInt(i.toString(), 10)]) {
            continue;
        }
        const obj1: { [key: string]: Object } = args[parseInt(i.toString(), 10)];
        Object.keys(obj1).forEach((key: string) => {
            const src: Object = result[`${key}`];
            const copy: Object = obj1[`${key}`];
            let clone: Object;
            if (deep && (isObject(copy) || Array.isArray(copy))) {
                if (isObject(copy)) {
                    clone = src ? src : {};
                    if (Array.isArray(clone) && Object.prototype.hasOwnProperty.call(clone, 'isComplexArray')) {
                        extend(clone, {}, copy, deep);
                    } else {
                        result[`${key}`] = extend(clone, {}, copy, deep);
                    }
                } else {
                    clone = src ? src : [];
                    result[`${key}`] = extend([], clone, copy, (clone && (clone as any).length) || (copy && (copy as any).length));
                }
            } else {
                result[`${key}`] = copy;
            }
        });
    }
    return result;
}

/**
 * To check whether the object is null or undefined.
 *
 * @param {any} value - To check the object is null or undefined
 * @returns {boolean} ?
 * @private
 */
export function isNullOrUndefined<T>(value: T): boolean {
    return value === undefined || value === null;
}

/**
 * To check whether the object is undefined.
 *
 * @param {any} value - To check the object is undefined
 * @returns {boolean} ?
 * @private
 */
export function isUndefined<T>(value: T): boolean {
    return typeof value === 'undefined';
}

/**
 * To return the generated unique name
 *
 * @param {string} definedName - To concatenate the unique id to provided name
 * @returns {string} ?
 * @private
 */
export function getUniqueID(definedName?: string): string {
    return definedName ? `${definedName}_${uid++}` : `unique_${uid++}`;
}

/**
 * It limits the rate at which a function can fire. The function will fire only once every provided second instead of as quickly.
 *
 * @param {Function} eventFunction - Specifies the function to run when the event occurs
 * @param {number} delay - A number that specifies the milliseconds for function delay call option
 * @returns {Function} ?
 * @private
 */
export function debounce(eventFunction: Function, delay: number): Function {
    let timerId: NodeJS.Timeout;
    return function (...args: any[]): void {
        clearTimeout(timerId);
        timerId = setTimeout(() => {
            eventFunction.apply(this, args);
        }, delay);
    };
}

/**
 * To convert the object to string for query url
 *
 * @param  {Object} data ?
 * @returns {string} ?
 * @private
 */
export function queryParams(data: any): string {
    return Object.keys(data)
        .map((key: string) => `${encodeURIComponent(key)}=${encodeURIComponent(data[`${key}`])}`)
        .join('&');
}

/**
 * To check whether the given array contains object.
 *
 * @param {any} value - Specifies the T type array to be checked.
 * @returns {boolean} ?
 * @private
 */
export function isObjectArray<T>(value: T[]): boolean {
    return Array.isArray(value) && value.length > 0 && typeof value[0] === 'object' && value[0] !== null;
}

/**
 * To check whether the  child element is descendant to parent element or parent and child are same element.
 *
 * @param {Element} child - Specifies the child element to compare with parent.
 * @param {Element} parent - Specifies the parent element.
 * @returns {boolean} ?
 * @private
 */
export function compareElementParent(child: Element, parent: Element): boolean {
    let node: Node = child;

    while (node !== null && node !== document) {
        if (node === parent) {
            return true;
        }
        node = node.parentNode as Node;
    }
    return false;
}

/**
 * To throw custom error message.
 *
 * @param {string} message - Specifies the error message to be thrown.
 * @returns {void} ?
 * @private
 */
export function throwError(message: string): void {
    try {
        throw new Error(message);
    } catch (e) {
        throw new Error(e.message + '\n' + e.stack);
    }
}

/**
 * This function is used to print given element
 *
 * @param {Element} element - Specifies the print content element.
 * @param {Window} printWindow - Specifies the print window.
 * @returns {Window | null} ?
 * @private
 */
export function print(element: Element, printWindow?: Window | null): Window | null {
    if (typeof window === 'undefined') {
        return null;
    }
    const div: Element = document.createElement('div');
    const links: HTMLElement[] = [].slice.call(document.getElementsByTagName('head')[0].querySelectorAll('base, link, style'));
    const blinks: HTMLElement[] = [].slice.call(document.getElementsByTagName('body')[0].querySelectorAll('link, style'));
    if (blinks.length) {
        for (let l: number = 0, len: number = blinks.length; l < len; l++) {
            links.push(blinks[parseInt(l.toString(), 10)]);
        }
    }
    let reference: string = '';
    if (!printWindow) {
        printWindow = window.open('', 'print', 'height=452,width=1024,tabbar=no');
    }
    if (!printWindow) {
        throw new Error('Unable to open print window');
    }
    div.appendChild(element.cloneNode(true) as Element);
    for (let i: number = 0, len: number = links.length; i < len; i++) {
        reference += links[parseInt(i.toString(), 10)].outerHTML;
    }
    printWindow.document.write('<!DOCTYPE html> <html><head>' + reference + '</head><body>' + div.innerHTML +
      '<script> (function() { window.ready = true; })(); </script>' + '</body></html>');
    printWindow.document.close();
    printWindow.focus();
    const interval: any = setInterval(
        () => {
            if ((printWindow as any).ready) {
                printWindow.print();
                printWindow.close();
                clearInterval(interval);
            }
        },
        500
    );
    return printWindow;
}

/**
 * Function to normalize the units applied to the element.
 *
 * @param {number|string} value ?
 * @returns {string} result
 * @private
 */
export function formatUnit(value: number | string): string {
    const result: string = (value as string) + '';
    if (result.match(/auto|cm|mm|in|px|pt|pc|%|em|ex|ch|rem|vw|vh|vmin|vmax/)) {
        return result;
    }
    return result + 'px';
}

/**
 * Function to generate the unique id.
 *
 * @returns {any} ?
 * @private
 */
export function uniqueID(): any {
    if ((typeof window) === 'undefined') {
        return;
    }
    const num: any = new Uint16Array(5);
    const intCrypto: Crypto = window.msCrypto || window.crypto;
    return intCrypto.getRandomValues(num);
}

/**
 * Combines the first five elements of an Int16Array into a comma-separated string.
 *
 * @param {Int16Array} num ?
 * @returns {string} ?
 */
function combineArray(num: Int16Array): string {
    let ret: string = '';
    for (let i: number = 0; i < 5; i++) {
        ret += (i ? ',' : '') + num[parseInt(i.toString(), 10)];
    }
    return ret;
}

/**
 * Retrieves the underlying HTML element from a possibly forwarded ref or custom element.
 *
 * @param {RefObject<HTMLElement>} elementRef - The ref object containing the element.
 * @returns {HTMLElement} The actual HTML element
 */
export function getActualElement(
    elementRef: RefObject<HTMLElement | { element?: HTMLElement | null }>
): HTMLElement | null {
    const current: HTMLElement | { element?: HTMLElement | null; } = elementRef.current;
    if (!current) {
        return null;
    }
    if (!(current instanceof HTMLElement)) {
        if (current.element instanceof HTMLElement) {
            return current.element;
        } else {
            return null;
        }
    }
    return current;
}

/**
 * Gets the correct ref from a React element based on React version.
 *
 * @param {ReactElement} element - The React element from which to extract the ref
 * @returns {RefObject<HTMLElement> | null} - The extracted ref or null if not found
 */
export function getElementRef(element: ReactElement): React.RefObject<HTMLElement> | React.RefCallback<HTMLElement> | null {
    if (parseInt(version, 10) >= 19) {
        return (element as React.ReactElement<{ ref?: React.RefCallback<HTMLElement> | React.RefObject<HTMLElement> }>).props?.ref || null;
    } else {
        return (element as any).ref || null;
    }
}
