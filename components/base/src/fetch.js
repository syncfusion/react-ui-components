import { isNullOrUndefined as isNOU } from './util';
/**
 * The Fetch function provides a way to make asynchronous network requests, typically to retrieve resources from a server.
 *
 * @param {string | Fetch} [props] - The URL string or Fetch object containing request details.
 * @param {string} [type] - The HTTP method type (e.g., 'GET', 'POST').
 * @param {string} [contentType] - The content type of the request.
 * @returns {Fetch} A Fetch object for making the request.
 *
 * @example
 *
 *   var fetchApi = Fetch('index.html', 'GET');
 *   fetchApi.send()
 *      .then((value) => {
 *          console.log(value);
 *      }).catch((error) => {
 *          console.log(error);
 *      });
 */
export function Fetch(props, type, contentType) {
    let url;
    let fetchProps;
    if (typeof props === 'string') {
        url = props;
        fetchProps = {
            url,
            type: type ? type.toUpperCase() : 'GET',
            contentType: contentType || 'application/json; charset=utf-8'
        };
    }
    else {
        ({ url, type, contentType, ...fetchProps } = props);
        fetchProps.url = url;
        fetchProps.type = type ? type.toUpperCase() : 'GET';
        fetchProps.contentType = contentType || 'application/json; charset=utf-8';
    }
    const propsRef = {
        emitError: true,
        ...fetchProps
    };
    let fetchResponse = null;
    propsRef.send = async (data) => {
        const contentTypes = {
            'application/json': 'json',
            'multipart/form-data': 'formData',
            'application/octet-stream': 'blob',
            'application/x-www-form-urlencoded': 'formData'
        };
        try {
            if (isNOU(propsRef.fetchRequest) && propsRef.type === 'GET') {
                propsRef.fetchRequest = new Request(propsRef.url, { method: propsRef.type });
            }
            else if (isNOU(propsRef.fetchRequest)) {
                propsRef.data = data && !isNOU(data) ? data : propsRef.data;
                propsRef.fetchRequest = new Request(propsRef.url, {
                    method: propsRef.type,
                    headers: { 'Content-Type': propsRef.contentType },
                    body: propsRef.data
                });
            }
            const eventArgs = { cancel: false, fetchRequest: propsRef.fetchRequest };
            triggerEvent(propsRef.beforeSend, eventArgs);
            if (eventArgs.cancel) {
                return null;
            }
            fetchResponse = fetch(propsRef.fetchRequest);
            return fetchResponse.then((response) => {
                triggerEvent(propsRef.onLoad, response);
                if (!response.ok) {
                    throw response;
                }
                let responseType = 'text';
                for (const key of Object.keys(contentTypes)) {
                    if (response.headers.get('Content-Type') && response.headers.get('Content-Type').indexOf(key) !== -1) {
                        responseType = contentTypes[key];
                    }
                }
                return response[responseType]();
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            }).then((data) => {
                triggerEvent(propsRef.onSuccess, data, propsRef);
                return data;
            }).catch((error) => {
                let returnVal = {};
                if (propsRef.emitError) {
                    triggerEvent(propsRef.onFailure, error);
                    returnVal = Promise.reject(error);
                }
                return returnVal;
            });
        }
        catch (error) {
            return error;
        }
    };
    /**
     * Triggers the callback function with provided data and instance.
     *
     * @param {Function | null} callback - The callback function to be triggered
     * @param {string | Object} [data] - Optional data to pass to the callback
     * @param {IFetch} [instance] - Optional FetchProps instance
     * @returns {void}
     */
    function triggerEvent(callback, data, instance) {
        if (!isNOU(callback) && typeof callback === 'function') {
            callback(data, instance);
        }
    }
    return propsRef;
}
