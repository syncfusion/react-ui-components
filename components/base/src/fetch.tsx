import { isNullOrUndefined as isNOU } from './util';

/**
 * Interface for the Fetch properties and methods.
 */
export interface IFetch {
    /**
     * Specifies the URL to which the request is to be sent.
     *
     * @default null
     */
    url?: string;
    /**
     * Specifies which request method is to be used, such as GET, POST, etc.
     *
     * @default GET
     */
    type?: string;
    /**
     * Specifies the content type of the request, which is used to indicate the original media type of the resource.
     *
     * @default null
     */
    contentType?: string;
    /**
     * Specifies the data that needs to be added to the request.
     *
     * @default null
     */
    data?: string | Object;
    /**
     * A boolean value indicating whether to reject the promise or not.
     *
     * @private
     * @default true
     */
    emitError?: boolean;
    /**
     * Specifies the request object that represents a resource request.
     *
     * @default null
     */
    fetchRequest?: Request;
    /**
     * Specifies the callback function to be triggered before sending the request to the server.
     * This can be used to modify the fetchRequest object before it is sent.
     *
     * @event beforeSend
     */
    beforeSend?: ((args: BeforeSendFetchEventArgs) => void) | null;
    /**
     * Specifies the callback function to be triggered after the response is received.
     * This callback will be triggered even if the request is failed.
     *
     * @event onLoad
     */
    onLoad?: ((response: Response) => void) | null;
    /**
     * Specifies the callback function to be triggered after the request is successful.
     * The callback will contain the server response as a parameter.
     *
     * @event onSuccess
     */
    onSuccess?: ((data: string | Object, instance: IFetch) => void) | null;
    /**
     * Specifies the callback function to be triggered after the request is failed.
     *
     * @event onFailure
     */
    onFailure?: ((error: Error) => void) | null;

    /**
     * Sends the fetch request.
     *
     * @param {string | Object} [data] - Optional data to be sent with the request.
     * @returns {Promise<Response>} - A promise that resolves to the fetch response.
     */
    send?: (data?: string | Object) => Promise<Response>;
}


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
export function Fetch(props?: string | IFetch, type?: string, contentType?: string): IFetch {
    let url: string | undefined;
    let fetchProps: IFetch;
    if (typeof props === 'string') {
        url = props;
        fetchProps = {
            url,
            type: type ? type.toUpperCase() : 'GET',
            contentType: contentType || 'application/json; charset=utf-8'
        };
    } else {
        ({ url, type, contentType, ...fetchProps } = props);
        fetchProps.url = url;
        fetchProps.type = type ? type.toUpperCase() : 'GET';
        fetchProps.contentType = contentType || 'application/json; charset=utf-8';
    }
    const propsRef: IFetch = {
        emitError: true,
        ...fetchProps
    };
    let fetchResponse: Promise<Response> | null = null;

    propsRef.send = async (data?: string | Object): Promise<Response> => {
        const contentTypes: Object = {
            'application/json': 'json',
            'multipart/form-data': 'formData',
            'application/octet-stream': 'blob',
            'application/x-www-form-urlencoded': 'formData'
        };
        try {
            if (isNOU(propsRef.fetchRequest) && propsRef.type === 'GET') {
                propsRef.fetchRequest = new Request(propsRef.url, { method: propsRef.type });
            } else if (isNOU(propsRef.fetchRequest)) {
                propsRef.data = data && !isNOU(data) ? data : propsRef.data;
                propsRef.fetchRequest = new Request(propsRef.url, {
                    method: propsRef.type,
                    headers: { 'Content-Type': propsRef.contentType },
                    body: propsRef.data as BodyInit
                });
            }
            const eventArgs: BeforeSendFetchEventArgs = { cancel: false, fetchRequest: propsRef.fetchRequest };
            triggerEvent(propsRef.beforeSend, eventArgs);
            if (eventArgs.cancel) { return null; }
            fetchResponse = fetch(propsRef.fetchRequest);
            return fetchResponse.then((response: Response) => {
                triggerEvent(propsRef.onLoad, response);
                if (!response.ok) {
                    throw response;
                }
                let responseType: string = 'text';
                for (const key of Object.keys(contentTypes)) {
                    if (response.headers.get('Content-Type') && (response.headers.get('Content-Type') as string).indexOf(key) !== -1) {
                        responseType = contentTypes[key as string];
                    }
                }
                return response[responseType as string]();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            }).then((data: any) => {
                triggerEvent(propsRef.onSuccess, data, propsRef);
                return data;
            }).catch((error: Error) => {
                let returnVal: Object = {};
                if (propsRef.emitError) {
                    triggerEvent(propsRef.onFailure, error);
                    returnVal = Promise.reject(error);
                }
                return returnVal;
            });
        } catch (error) {
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
    function triggerEvent(callback: Function | null, data?: string | Object, instance?: IFetch): void {
        if (!isNOU(callback) && typeof callback === 'function') {
            callback(data, instance);
        }
    }

    return propsRef;
}

/**
 * Provides information about the beforeSend event.
 */
export interface BeforeSendFetchEventArgs {
    /**
     * A boolean value indicating whether to cancel the fetch request or not.
     */
    cancel?: boolean;
    /**
     * Returns the request object that represents a resource request.
     */
    fetchRequest: Request;
}
