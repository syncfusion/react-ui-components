import { isUndefined } from './util';
const REGX_MOBILE = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile/i;
const REGX_IE = /msie|trident/i;
const REGX_IE11 = /Trident\/7\./;
const REGX_IOS = /(ipad|iphone|ipod touch)/i;
const REGX_IOS7 = /(ipad|iphone|ipod touch);.*os 7_\d|(ipad|iphone|ipod touch);.*os 8_\d/i;
const REGX_ANDROID = /android/i;
const REGX_WINDOWS = /trident|windows phone|edge/i;
const REGX_VERSION = /(version)[ /]([\w.]+)/i;
const REGX_BROWSER = {
    OPERA: /(opera|opr)(?:.*version|)[ /]([\w.]+)/i,
    EDGE: /(edge)(?:.*version|)[ /]([\w.]+)/i,
    CHROME: /(chrome|crios)[ /]([\w.]+)/i,
    PANTHOMEJS: /(phantomjs)[ /]([\w.]+)/i,
    SAFARI: /(safari)[ /]([\w.]+)/i,
    WEBKIT: /(webkit)[ /]([\w.]+)/i,
    MSIE: /(msie|trident) ([\w.]+)/i,
    MOZILLA: /(mozilla)(?:.*? rv:([\w.]+)|)/i
};
/* istanbul ignore else  */
if (typeof window !== 'undefined') {
    window.browserDetails = window.browserDetails || {};
}
/**
 * Get configuration details for Browser
 *
 * @private
 */
export const Browser = (() => {
    const uA = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    /**
     * Extract browser detail.
     *
     * @returns {BrowserInfo} ?
     */
    function extractBrowserDetail() {
        const browserInfo = { culture: {} };
        const keys = Object.keys(REGX_BROWSER);
        let clientInfo = [];
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
                const version = Browser.userAgent.match(REGX_VERSION);
                if (browserInfo.name === 'safari' && version) {
                    browserInfo.version = version[2];
                }
                break;
            }
        }
        return browserInfo;
    }
    /**
     * To get events from the browser
     *
     * @param {EventTypes} event - type of event triggered.
     * @returns {string} ?
     */
    function getEvent(event) {
        const events = {
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
    function getTouchStartEvent() {
        return getEvent('start');
    }
    /**
     * To get the Touch end event from browser
     *
     * @returns {string} ?
     */
    function getTouchEndEvent() {
        return getEvent('end');
    }
    /**
     * To get the Touch move event from browser
     *
     * @returns {string} ?
     */
    function getTouchMoveEvent() {
        return getEvent('move');
    }
    /**
     * To cancel the touch event from browser
     *
     * @returns {string} ?
     */
    function getTouchCancelEvent() {
        return getEvent('cancel');
    }
    /**
     * Check whether the browser on the iPad device is Safari or not
     *
     * @returns {boolean} ?
     */
    function isSafari() {
        return (Browser.isDevice &&
            Browser.isIos &&
            Browser.isTouch &&
            typeof window !== 'undefined' &&
            window.navigator.userAgent.toLowerCase().indexOf('iphone') === -1 &&
            window.navigator.userAgent.toLowerCase().indexOf('safari') > -1);
    }
    /**
     * To get the value based on provided key and regX
     *
     * @param {string} key ?
     * @param {RegExp} regX ?
     * @returns {Object} ?
     */
    function getValue(key, regX) {
        const browserDetails = typeof window !== 'undefined' ? window.browserDetails : {};
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
        set userAgent(uA) {
            Browser.uA = uA;
            window.browserDetails = {};
        },
        get userAgent() {
            return Browser.uA;
        },
        //Read Only Properties
        /**
         * Property is to get the browser information like Name, Version and Language
         *
         * @returns {BrowserInfo} ?
         */
        get info() {
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
        get isIE() {
            return getValue('isIE', REGX_IE);
        },
        /**
         * Property is to get whether the browser has touch support.
         *
         * @returns {boolean} ?
         */
        get isTouch() {
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
        get isPointer() {
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
        get isMSPointer() {
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
        get isDevice() {
            return getValue('isDevice', REGX_MOBILE);
        },
        /**
         * Property is to get whether the userAgent is Ios.
         *
         * @returns {boolean} ?
         */
        get isIos() {
            return getValue('isIos', REGX_IOS);
        },
        /**
         * Property is to get whether the userAgent is Ios7.
         *
         * @returns {boolean} ?
         */
        get isIos7() {
            return getValue('isIos7', REGX_IOS7);
        },
        /**
         * Property is to get whether the userAgent is Android.
         *
         * @returns {boolean} ?
         */
        get isAndroid() {
            return getValue('isAndroid', REGX_ANDROID);
        },
        /**
         * Property is to identify whether application ran in web view.
         *
         * @returns {boolean} ?
         */
        get isWebView() {
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
        get isWindows() {
            return getValue('isWindows', REGX_WINDOWS);
        },
        /**
         * Property is to get the touch start event. It returns event name based on browser.
         *
         * @returns {string} ?
         */
        get touchStartEvent() {
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
        get touchMoveEvent() {
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
        get touchEndEvent() {
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
        get touchCancelEvent() {
            if (isUndefined(window.browserDetails.touchCancelEvent)) {
                window.browserDetails.touchCancelEvent = getTouchCancelEvent();
            }
            return window.browserDetails.touchCancelEvent;
        },
        isSafari,
        uA
    };
})();
