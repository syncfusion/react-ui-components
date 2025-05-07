let uid = 0;
/**
 * Create Instance from constructor function with desired parameters.
 *
 * @param {Function} classFunction - Class function to which need to create instance
 * @param {any[]} params - Parameters need to passed while creating instance
 * @returns {any} ?
 * @private
 */
export function createInstance(classFunction, params) {
    const arrayParam = params;
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
export function setImmediate(handler) {
    let unbind;
    const num = new Uint16Array(5);
    const intCrypto = window.msCrypto || window.crypto;
    intCrypto.getRandomValues(num);
    let secret = 'syn' + combineArray(num);
    let messageHandler = (event) => {
        if (event.source === window && typeof event.data === 'string' && event.data.length <= 32 && event.data === secret) {
            handler();
            unbind();
        }
    };
    window.addEventListener('message', messageHandler, false);
    window.postMessage(secret, '*');
    return unbind = () => {
        window.removeEventListener('message', messageHandler);
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
export function getValue(nameSpace, obj) {
    let value = obj;
    const splits = !isNullOrUndefined(nameSpace) ? nameSpace.replace(/\[/g, '.').replace(/\]/g, '').split('.') : [];
    for (let i = 0; i < splits.length && !isNullOrUndefined(value); i++) {
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
export function setValue(nameSpace, value, obj) {
    const keys = nameSpace.replace(/\[/g, '.').replace(/\]/g, '').split('.');
    const start = obj || {};
    let fromObj = start;
    let i;
    const length = keys.length;
    let key;
    for (i = 0; i < length; i++) {
        key = keys[parseInt(i.toString(), 10)];
        if (i + 1 === length) {
            fromObj[`${key}`] = value === undefined ? {} : value;
        }
        else if (isNullOrUndefined(fromObj[`${key}`])) {
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
export function deleteObject(obj, key) {
    delete obj[`${key}`];
}
/**
 *@private
 */
export const containerObject = typeof window !== 'undefined' ? window : {};
/**
 * Check weather the given argument is only object.
 *
 * @param {any} obj - Object which is need to check.
 * @returns {boolean} ?
 * @private
 */
export function isObject(obj) {
    const objCon = {};
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
export function getEnumValue(enumObject, enumValue) {
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
export function merge(source, destination) {
    if (!isNullOrUndefined(destination)) {
        const temrObj = source;
        const tempProp = destination;
        const keys = Object.keys(destination);
        const deepmerge = 'deepMerge';
        for (const key of keys) {
            if (!isNullOrUndefined(temrObj[`${deepmerge}`]) && (temrObj[`${deepmerge}`].indexOf(key) !== -1) &&
                (isObject(tempProp[`${key}`]) || Array.isArray(tempProp[`${key}`]))) {
                extend(temrObj[`${key}`], temrObj[`${key}`], tempProp[`${key}`], true);
            }
            else {
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
export function extend(copied, first, second, deep) {
    const result = copied && typeof copied === 'object' ? copied : {};
    let length = arguments.length;
    const args = [copied, first, second, deep];
    if (deep) {
        length = length - 1;
    }
    for (let i = 1; i < length; i++) {
        if (!args[parseInt(i.toString(), 10)]) {
            continue;
        }
        const obj1 = args[parseInt(i.toString(), 10)];
        Object.keys(obj1).forEach((key) => {
            const src = result[`${key}`];
            const copy = obj1[`${key}`];
            let clone;
            if (deep && (isObject(copy) || Array.isArray(copy))) {
                if (isObject(copy)) {
                    clone = src ? src : {};
                    if (Array.isArray(clone) && Object.prototype.hasOwnProperty.call(clone, 'isComplexArray')) {
                        extend(clone, {}, copy, deep);
                    }
                    else {
                        result[`${key}`] = extend(clone, {}, copy, deep);
                    }
                }
                else {
                    clone = src ? src : [];
                    result[`${key}`] = extend([], clone, copy, (clone && clone.length) || (copy && copy.length));
                }
            }
            else {
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
export function isNullOrUndefined(value) {
    return value === undefined || value === null;
}
/**
 * To check whether the object is undefined.
 *
 * @param {any} value - To check the object is undefined
 * @returns {boolean} ?
 * @private
 */
export function isUndefined(value) {
    return typeof value === 'undefined';
}
/**
 * To return the generated unique name
 *
 * @param {string} definedName - To concatenate the unique id to provided name
 * @returns {string} ?
 * @private
 */
export function getUniqueID(definedName) {
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
export function debounce(eventFunction, delay) {
    let timerId;
    return function (...args) {
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
export function queryParams(data) {
    return Object.keys(data)
        .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(data[`${key}`])}`)
        .join('&');
}
/**
 * To check whether the given array contains object.
 *
 * @param {any} value - Specifies the T type array to be checked.
 * @returns {boolean} ?
 * @private
 */
export function isObjectArray(value) {
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
export function compareElementParent(child, parent) {
    let node = child;
    while (node !== null && node !== document) {
        if (node === parent) {
            return true;
        }
        node = node.parentNode;
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
export function throwError(message) {
    try {
        throw new Error(message);
    }
    catch (e) {
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
export function print(element, printWindow) {
    if (typeof window === 'undefined') {
        return null;
    }
    const div = document.createElement('div');
    const links = [].slice.call(document.getElementsByTagName('head')[0].querySelectorAll('base, link, style'));
    const blinks = [].slice.call(document.getElementsByTagName('body')[0].querySelectorAll('link, style'));
    if (blinks.length) {
        for (let l = 0, len = blinks.length; l < len; l++) {
            links.push(blinks[parseInt(l.toString(), 10)]);
        }
    }
    let reference = '';
    if (!printWindow) {
        printWindow = window.open('', 'print', 'height=452,width=1024,tabbar=no');
    }
    if (!printWindow) {
        throw new Error('Unable to open print window');
    }
    div.appendChild(element.cloneNode(true));
    for (let i = 0, len = links.length; i < len; i++) {
        reference += links[parseInt(i.toString(), 10)].outerHTML;
    }
    printWindow.document.write('<!DOCTYPE html> <html><head>' + reference + '</head><body>' + div.innerHTML +
        '<script> (function() { window.ready = true; })(); </script>' + '</body></html>');
    printWindow.document.close();
    printWindow.focus();
    const interval = setInterval(() => {
        if (printWindow.ready) {
            printWindow.print();
            printWindow.close();
            clearInterval(interval);
        }
    }, 500);
    return printWindow;
}
/**
 * Function to normalize the units applied to the element.
 *
 * @param {number|string} value ?
 * @returns {string} result
 * @private
 */
export function formatUnit(value) {
    const result = value + '';
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
export function uniqueID() {
    if ((typeof window) === 'undefined') {
        return;
    }
    const num = new Uint16Array(5);
    const intCrypto = window.msCrypto || window.crypto;
    return intCrypto.getRandomValues(num);
}
/**
 * Combines the first five elements of an Int16Array into a comma-separated string.
 *
 * @param {Int16Array} num ?
 * @returns {string} ?
 */
function combineArray(num) {
    let ret = '';
    for (let i = 0; i < 5; i++) {
        ret += (i ? ',' : '') + num[parseInt(i.toString(), 10)];
    }
    return ret;
}
