import { isUndefined } from './util';
const REGX_MOBILE: RegExp = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile/i;
const REGX_IE: RegExp = /msie|trident/i;
const REGX_IE11: RegExp = /Trident\/7\./;
const REGX_IOS: RegExp = /(ipad|iphone|ipod touch)/i;
const REGX_IOS7: RegExp = /(ipad|iphone|ipod touch);.*os 7_\d|(ipad|iphone|ipod touch);.*os 8_\d/i;
const REGX_ANDROID: RegExp = /android/i;
const REGX_WINDOWS: RegExp = /trident|windows phone|edge/i;
const REGX_VERSION: RegExp = /(version)[ /]([\w.]+)/i;
const REGX_BROWSER: { [key: string]: RegExp } = {
    OPERA: /(opera|opr)(?:.*version|)[ /]([\w.]+)/i,
    EDGE: /(edge)(?:.*version|)[ /]([\w.]+)/i,
    CHROME: /(chrome|crios)[ /]([\w.]+)/i,
    PANTHOMEJS: /(phantomjs)[ /]([\w.]+)/i,
    SAFARI: /(safari)[ /]([\w.]+)/i,
    WEBKIT: /(webkit)[ /]([\w.]+)/i,
    MSIE: /(msie|trident) ([\w.]+)/i,
    MOZILLA: /(mozilla)(?:.*? rv:([\w.]+)|)/i
};

interface MyWindow extends Window {
    browserDetails: BrowserDetails;
    cordova: Object;
    PhoneGap: Object;
    phonegap: Object;
    forge: Object;
    Capacitor?: { getPlatform: () => string };
}
declare let window: MyWindow;

/* istanbul ignore else  */
if (typeof window !== 'undefined') {
    window.browserDetails = window.browserDetails || {};
}

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
export const Browser: IBrowser = (() => {
    const uA: string = typeof navigator !== 'undefined' ? navigator.userAgent : '';

    /**
     * Extract browser detail.
     *
     * @returns {BrowserInfo} ?
     */
    function extractBrowserDetail(): BrowserInfo {
        const browserInfo: BrowserInfo = { culture: {} };
        const keys: string[] = Object.keys(REGX_BROWSER);
        let clientInfo: string[] = [];
        for (const key of keys) {
            clientInfo = Browser.userAgent.match(REGX_BROWSER[`${key}`]);
            if (clientInfo) {
                browserInfo.name = (clientInfo[1].toLowerCase() === 'opr' ? 'opera' : clientInfo[1].toLowerCase());
                browserInfo.name = (clientInfo[1].toLowerCase() === 'crios' ? 'chrome' : browserInfo.name);
                browserInfo.version = clientInfo[2];
                browserInfo.culture.name = browserInfo.culture.language = navigator.language;
                if (Browser.userAgent.match(REGX_IE11)) {
                    browserInfo.name = 'msie';
                    break;
                }
                const version: RegExpMatchArray | null = Browser.userAgent.match(REGX_VERSION);
                if (browserInfo.name === 'safari' && version) {
                    browserInfo.version = version[2];
                }
                break;
            }
        }
        return browserInfo;
    }

    /**
     * Types of events that can be triggered.
     *
     * @typedef {('start' | 'move' | 'end' | 'cancel')} EventTypes
     */
    type EventTypes = 'start' | 'move' | 'end' | 'cancel';

    /**
     * Names of the event categories based on the input device.
     *
     * @typedef {('isPointer' | 'isTouch' | 'isDevice')} EventNames
     */
    type EventNames = 'isPointer' | 'isTouch' | 'isDevice';

    /**
     * To get events from the browser
     *
     * @param {EventTypes} event - type of event triggered.
     * @returns {string} ?
     */
    function getEvent(event: EventTypes): string {
        const events: Record<EventTypes, Record<EventNames, string>> = {
            start: {
                isPointer: 'pointerdown',
                isTouch: 'touchstart',
                isDevice: 'mousedown'
            },
            move: {
                isPointer: 'pointermove',
                isTouch: 'touchmove',
                isDevice: 'mousemove'
            },
            end: {
                isPointer: 'pointerup',
                isTouch: 'touchend',
                isDevice: 'mouseup'
            },
            cancel: {
                isPointer: 'pointercancel',
                isTouch: 'touchcancel',
                isDevice: 'mouseleave'
            }
        };

        return Browser.isPointer
            ? events[`${event}`].isPointer
            : (Browser.isTouch
                ? events[`${event}`].isTouch + (!Browser.isDevice ? ' ' + events[`${event}`].isDevice : '')
                : events[`${event}`].isDevice);
    }

    /**
     * To get the Touch start event from browser
     *
     * @returns {string} ?
     */
    function getTouchStartEvent(): string {
        return getEvent('start');
    }

    /**
     * To get the Touch end event from browser
     *
     * @returns {string} ?
     */
    function getTouchEndEvent(): string {
        return getEvent('end');
    }

    /**
     * To get the Touch move event from browser
     *
     * @returns {string} ?
     */
    function getTouchMoveEvent(): string {
        return getEvent('move');
    }

    /**
     * To cancel the touch event from browser
     *
     * @returns {string} ?
     */
    function getTouchCancelEvent(): string {
        return getEvent('cancel');
    }

    /**
     * Check whether the browser on the iPad device is Safari or not
     *
     * @returns {boolean} ?
     */
    function isSafari(): boolean {
        return (
            Browser.isDevice &&
            Browser.isIos &&
            Browser.isTouch &&
            typeof window !== 'undefined' &&
            window.navigator.userAgent.toLowerCase().indexOf('iphone') === -1 &&
            window.navigator.userAgent.toLowerCase().indexOf('safari') > -1
        );
    }

    /**
     * To get the value based on provided key and regX
     *
     * @param {string} key ?
     * @param {RegExp} regX ?
     * @returns {Object} ?
     */
    function getValue(key: string, regX: RegExp): Object {
        const browserDetails: {} = typeof window !== 'undefined' ? window.browserDetails : {};
        if (typeof navigator !== 'undefined' && navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1 && Browser.isTouch === true && !REGX_BROWSER.CHROME.test(navigator.userAgent)) {
            browserDetails['isIos'] = true;
            browserDetails['isDevice'] = true;
            browserDetails['isTouch'] = true;
            browserDetails['isPointer'] = true;
            // Set 'isPointer' for pointer-enabled devices (e.g., iPad on Safari)
            browserDetails['isPointer'] = ('pointerEnabled' in window.navigator);
        }
        if (typeof window !== 'undefined' && window.Capacitor && window.Capacitor.getPlatform() === 'ios') {
            browserDetails['isPointer'] = false;
        }
        if ('undefined' === typeof browserDetails[`${key}`]) {
            return browserDetails[`${key}`] = regX.test(Browser.userAgent);
        }
        return browserDetails[`${key}`];
    }

    return {
        // Properties
        /**
         * Property specifies the userAgent of the browser. Default userAgent value is based on the browser.
         * Also we can set our own userAgent.
         *
         * @param {string} uA ?
         */
        set userAgent(uA: string) {
            Browser.uA = uA;
            window.browserDetails = {};
        },
        get userAgent(): string {
            return  Browser.uA;
        },

        //Read Only Properties

        /**
         * Property is to get the browser information like Name, Version and Language
         *
         * @returns {BrowserInfo} ?
         */
        get info(): BrowserInfo {
            if (isUndefined(window.browserDetails.info)) {
                window.browserDetails.info = extractBrowserDetail();
            }
            return window.browserDetails.info;
        },

        /**
         * Property is to get whether the userAgent is based IE.
         *
         * @returns {boolean} ?
         */
        get isIE(): boolean {
            return getValue('isIE', REGX_IE) as boolean;
        },

        /**
         * Property is to get whether the browser has touch support.
         *
         * @returns {boolean} ?
         */
        get isTouch(): boolean {
            if (isUndefined(window.browserDetails.isTouch)) {
                window.browserDetails.isTouch = ('ontouchstart' in window.navigator) || (window &&
                    window.navigator &&
                    (window.navigator.maxTouchPoints > 0)) || ('ontouchstart' in window);
            }
            return window.browserDetails.isTouch;
        },

        /**
         * Property is to get whether the browser has Pointer support.
         *
         * @returns {boolean} ?
         */
        get isPointer(): boolean {
            if (isUndefined(window.browserDetails.isPointer)) {
                window.browserDetails.isPointer = ('pointerEnabled' in window.navigator);
            }
            return window.browserDetails.isPointer;
        },
        /**
         * Property is to get whether the browser has MSPointer support.
         *
         * @returns {boolean} ?
         */
        get isMSPointer(): boolean {
            if (isUndefined(window.browserDetails.isMSPointer)) {
                window.browserDetails.isMSPointer = ('msPointerEnabled' in window.navigator);
            }
            return window.browserDetails.isMSPointer;
        },
        /**
         * Property is to get whether the userAgent is device based.
         *
         * @returns {boolean} ?
         */
        get isDevice(): boolean {
            return getValue('isDevice', REGX_MOBILE) as boolean;
        },
        /**
         * Property is to get whether the userAgent is Ios.
         *
         * @returns {boolean} ?
         */
        get isIos(): boolean {
            return getValue('isIos', REGX_IOS) as boolean;
        },
        /**
         * Property is to get whether the userAgent is Ios7.
         *
         * @returns {boolean} ?
         */
        get isIos7(): boolean {
            return getValue('isIos7', REGX_IOS7) as boolean;
        },
        /**
         * Property is to get whether the userAgent is Android.
         *
         * @returns {boolean} ?
         */
        get isAndroid(): boolean {
            return getValue('isAndroid', REGX_ANDROID) as boolean;
        },
        /**
         * Property is to identify whether application ran in web view.
         *
         * @returns {boolean} ?
         */
        get isWebView(): boolean {
            if (isUndefined(window.browserDetails.isWebView)) {
                window.browserDetails.isWebView = !(isUndefined(window.cordova) && isUndefined(window.PhoneGap)
                    && isUndefined(window.phonegap) && window.forge !== 'object');
            }
            return window.browserDetails.isWebView;
        },
        /**
         * Property is to get whether the userAgent is Windows.
         *
         * @returns {boolean} ?
         */
        get isWindows(): boolean {
            return getValue('isWindows', REGX_WINDOWS) as boolean;
        },
        /**
         * Property is to get the touch start event. It returns event name based on browser.
         *
         * @returns {string} ?
         */
        get touchStartEvent(): string {
            if (isUndefined(window.browserDetails.touchStartEvent)) {
                window.browserDetails.touchStartEvent = getTouchStartEvent();
            }
            return window.browserDetails.touchStartEvent;
        },
        /**
         * Property is to get the touch move event. It returns event name based on browser.
         *
         * @returns {string} ?
         */
        get touchMoveEvent(): string {
            if (isUndefined(window.browserDetails.touchMoveEvent)) {
                window.browserDetails.touchMoveEvent = getTouchMoveEvent();
            }
            return window.browserDetails.touchMoveEvent;
        },
        /**
         * Property is to get the touch end event. It returns event name based on browser.
         *
         * @returns {string} ?
         */
        get touchEndEvent(): string {
            if (isUndefined(window.browserDetails.touchEndEvent)) {
                window.browserDetails.touchEndEvent = getTouchEndEvent();
            }
            return window.browserDetails.touchEndEvent;
        },
        /**
         * Property is to cancel the touch end event.
         *
         * @returns {string} ?
         */
        get touchCancelEvent(): string {
            if (isUndefined(window.browserDetails.touchCancelEvent)) {
                window.browserDetails.touchCancelEvent = getTouchCancelEvent();
            }
            return window.browserDetails.touchCancelEvent;
        },
        isSafari,
        uA
    };
})();

/**
 * Browser details for the window object.
 */
interface BrowserDetails {
    isAndroid?: boolean;
    isDevice?: boolean;
    isIE?: boolean;
    isIos?: boolean;
    isIos7?: boolean;
    isMSPointer?: boolean;
    isPointer?: boolean;
    isTouch?: boolean;
    isWebView?: boolean;
    isWindows?: boolean;
    isSafari?: boolean;
    info?: BrowserInfo;
    touchStartEvent?: string;
    touchMoveEvent?: string;
    touchEndEvent?: string;
    touchCancelEvent?: string;
}

/**
 * Information about the browser.
 */
interface BrowserInfo {
    name?: string;
    version?: string;
    culture?: { name?: string, language?: string };
}
