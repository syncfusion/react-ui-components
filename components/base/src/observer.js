import { isNullOrUndefined, getValue } from './util';
/**
 * Observer is used to perform event handling based the object.
 *
 * @returns {IObserver} Returns an Observer instance for event handling
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const Observer = () => {
    let ranArray = [];
    const boundedEvents = {};
    /**
     * Attach handler for given property in current context.
     *
     * @param {string} property - specifies the name of the event.
     * @param {Function} handler - Specifies the handler function to be called while event notified.
     * @param {Object} context - Specifies the context binded to the handler.
     * @param {string} id - specifies the random generated id.
     * @returns {void}
     */
    function on(property, handler, context, id) {
        if (isNullOrUndefined(handler)) {
            return;
        }
        const cntxt = context || {};
        if (notExist(property)) {
            boundedEvents[`${property}`] = [{ handler, context: cntxt, id }];
        }
        else if (id && !ranArray.includes(id)) {
            ranArray.push(id);
            boundedEvents[`${property}`].push({ handler, context: cntxt, id });
        }
        else if (!boundedEvents[`${property}`].some((event) => event.handler === handler)) {
            boundedEvents[`${property}`].push({ handler, context: cntxt });
        }
    }
    /**
     * To remove handlers from a event attached using on() function.
     *
     * @param {string} property - specifies the name of the event.
     * @param {Function} handler - Optional argument specifies the handler function to be called while event notified.
     * @param {string} id - specifies the random generated id.
     * @returns {void}
     */
    function off(property, handler, id) {
        if (notExist(property)) {
            return;
        }
        const curObject = getValue(property, boundedEvents);
        if (handler) {
            for (let i = 0; i < curObject.length; i++) {
                const currentEvent = curObject[parseInt(i.toString(), 10)];
                if (id && currentEvent.id === id) {
                    curObject.splice(i, 1);
                    ranArray = ranArray.filter((item) => item !== id);
                    break;
                }
                else if (handler === currentEvent.handler) {
                    curObject.splice(i, 1);
                    break;
                }
            }
        }
        else {
            delete boundedEvents[`${property}`];
        }
    }
    /**
     * To notify the handlers in the specified event.
     *
     * @param {string} property - Specifies the event to be notify.
     * @param {Object} argument - Additional parameters to pass while calling the handler.
     * @param {Function} successHandler - this function will invoke after event successfully triggered
     * @param {Function} errorHandler  - this function will invoke after event if it was failure to call.
     * @returns {void} ?
     */
    function notify(property, argument, successHandler, errorHandler) {
        if (notExist(property)) {
            if (successHandler) {
                successHandler(argument);
            }
            return;
        }
        if (argument) {
            argument = { ...argument, name: property };
        }
        const curObject = getValue(property, boundedEvents).slice(0);
        for (const cur of curObject) {
            try {
                cur.handler(argument);
            }
            catch (error) {
                if (errorHandler) {
                    errorHandler(error);
                }
            }
        }
        if (successHandler) {
            successHandler(argument);
        }
    }
    /**
     * Checks if a string value is valid JSON.
     *
     * @param {string} value - The string to check if it's valid JSON
     * @returns {boolean} Returns true if the string is valid JSON, false otherwise
     */
    function isJson(value) {
        try {
            JSON.parse(value);
        }
        catch (e) {
            return false;
        }
        return true;
    }
    /**
     * To destroy handlers in the event
     *
     * @returns {void} ?
     */
    function destroy() {
        Object.keys(boundedEvents).forEach((key) => {
            delete boundedEvents[`${key}`];
        });
        ranArray = [];
    }
    /**
     * To remove internationalization events
     *
     * @returns {void} ?
     */
    function offIntlEvents() {
        const eventsArr = boundedEvents['notifyExternalChange'];
        if (eventsArr) {
            for (let i = 0; i < eventsArr.length; i++) {
                const curEvent = eventsArr[parseInt(i.toString(), 10)];
                const curContext = curEvent.context;
                if (curContext && curContext['detectFunction'] && curContext['randomId'] && curContext['isReactMock']) {
                    off('notifyExternalChange', curEvent.handler, curContext['randomId']);
                    i--;
                }
            }
            if (!boundedEvents['notifyExternalChange'].length) {
                delete boundedEvents['notifyExternalChange'];
            }
        }
    }
    /**
     * Returns if the property exists.
     *
     * @param {string} prop ?
     * @returns {boolean} ?
     */
    function notExist(prop) {
        return !boundedEvents[`${prop}`] || boundedEvents[`${prop}`].length === 0;
    }
    return {
        isJson,
        on,
        off,
        notify,
        destroy,
        ranArray,
        boundedEvents,
        offIntlEvents
    };
};
