/**
 * Interface for BrowserType.
 */
interface IBrowser {
    /**
     * Property specifies the userAgent of the browser. Default userAgent value is based on the browser.
     * Also we can set our own userAgent.
     */
    userAgent: string;
    /**
     * Property is to get the browser information like Name, Version and Language.
     */
    info: BrowserInfo;
    /**
     * Property is to get whether the userAgent is based IE.
     */
    isIE: boolean;
    /**
     * Property is to get whether the browser has touch support.
     */
    isTouch: boolean;
    /**
     * Property is to get whether the browser has Pointer support.
     */
    isPointer: boolean;
    /**
     * Property is to get whether the browser has MSPointer support.
     */
    isMSPointer: boolean;
    /**
     * Property is to get whether the userAgent is device based.
     */
    isDevice: boolean;
    /**
     * Property is to get whether the userAgent is Ios.
     */
    isIos: boolean;
    /**
     * Property is to get whether the userAgent is Ios7.
     */
    isIos7: boolean;
    /**
     * Property is to get whether the userAgent is Android.
     */
    isAndroid: boolean;
    /**
     * Property is to identify whether application ran in web view.
     */
    isWebView: boolean;
    /**
     * Property is to get whether the userAgent is Windows.
     */
    isWindows: boolean;
    /**
     * Property is to get the touch start event. It returns event name based on browser.
     */
    touchStartEvent: string;
    /**
     * Property is to get the touch move event. It returns event name based on browser.
     */
    touchMoveEvent: string;
    /**
     * Property is to get the touch end event. It returns event name based on browser.
     */
    touchEndEvent: string;
    /**
     * Property is to cancel the touch end event.
     */
    touchCancelEvent: string;
    /**
     * Method to check whether the browser on the iPad device is Safari or not.
     */
    isSafari: () => boolean;
    /**
     * Property specifies the userAgent of the browser.
     */
    uA: string;
}
/**
 * Get configuration details for Browser
 *
 * @private
 */
export declare const Browser: IBrowser;
/**
 * Information about the browser.
 */
interface BrowserInfo {
    name?: string;
    version?: string;
    culture?: {
        name?: string;
        language?: string;
    };
}
export {};
