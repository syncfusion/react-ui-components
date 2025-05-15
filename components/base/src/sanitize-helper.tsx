import { detach } from './dom';
import { isNullOrUndefined } from './util';

/**
 * Interface for the request to sanitize HTML.
 */
interface BeforeSanitizeHtml {
    /** Illustrates whether the current action needs to be prevented or not. */
    cancel?: boolean;
    /** It is a callback function and executed it before our inbuilt action. It should return HTML as a string.
     *
     * @function
     * @param {string} value - Returns the value.
     * @returns {string}
     */
    /** Returns the selectors object which carrying both tags and attributes selectors to block list of cross-site scripting attack.
     *  Also possible to modify the block list in this event.
     */
    selectors?: SanitizeSelectors;
}

interface SanitizeSelectors {
    /** Returns the tags. */
    tags?: string[];
    /** Returns the attributes. */
    attributes?: SanitizeRemoveAttrs[];
}

interface SanitizeRemoveAttrs {
    /** Defines the attribute name to sanitize */
    attribute?: string;
    /** Defines the selector that sanitize the specified attributes within the selector */
    selector?: string;
}


interface ISanitize {
    /** Array of attributes to remove during sanitization */
    removeAttrs: SanitizeRemoveAttrs[]
    /** Array of HTML tags to remove during sanitization */
    removeTags: string[]
    /** Element to wrap the sanitized content */
    wrapElement: Element
    /** Callback function executed before sanitization begins */
    beforeSanitize: () => BeforeSanitizeHtml
    /** Custom sanitization function */
    sanitize: (value: string) => string
    /** Function to serialize the sanitized value */
    serializeValue: (item: BeforeSanitizeHtml, value: string) => string
}

const removeTags: string[] = [
    'script',
    'style',
    'iframe[src]',
    'link[href*="javascript:"]',
    'object[type="text/x-scriptlet"]',
    'object[data^="data:text/html;base64"]',
    'img[src^="data:text/html;base64"]',
    '[src^="javascript:"]',
    '[dynsrc^="javascript:"]',
    '[lowsrc^="javascript:"]',
    '[type^="application/x-shockwave-flash"]'
];

const removeAttrs: SanitizeRemoveAttrs[] = [
    { attribute: 'href', selector: '[href*="javascript:"]' },
    { attribute: 'href', selector: 'a[href]' },
    { attribute: 'background', selector: '[background^="javascript:"]' },
    { attribute: 'style', selector: '[style*="javascript:"]' },
    { attribute: 'style', selector: '[style*="expression("]' },
    { attribute: 'href', selector: 'a[href^="data:text/html;base64"]' }
];

const jsEvents: string[] = ['onchange',
    'onclick',
    'onmouseover',
    'onmouseout',
    'onkeydown',
    'onload',
    'onerror',
    'onblur',
    'onfocus',
    'onbeforeload',
    'onbeforeunload',
    'onkeyup',
    'onsubmit',
    'onafterprint',
    'onbeforeonload',
    'onbeforeprint',
    'oncanplay',
    'oncanplaythrough',
    'oncontextmenu',
    'ondblclick',
    'ondrag',
    'ondragend',
    'ondragenter',
    'ondragleave',
    'ondragover',
    'ondragstart',
    'ondrop',
    'ondurationchange',
    'onemptied',
    'onended',
    'onformchange',
    'onforminput',
    'onhaschange',
    'oninput',
    'oninvalid',
    'onkeypress',
    'onloadeddata',
    'onloadedmetadata',
    'onloadstart',
    'onmessage',
    'onmousedown',
    'onmousemove',
    'onmouseup',
    'onmousewheel',
    'onoffline',
    'onoine',
    'ononline',
    'onpagehide',
    'onpageshow',
    'onpause',
    'onplay',
    'onplaying',
    'onpopstate',
    'onprogress',
    'onratechange',
    'onreadystatechange',
    'onredo',
    'onresize',
    'onscroll',
    'onseeked',
    'onseeking',
    'onselect',
    'onstalled',
    'onstorage',
    'onsuspend',
    'ontimeupdate',
    'onundo',
    'onunload',
    'onvolumechange',
    'onwaiting',
    'onmouseenter',
    'onmouseleave',
    'onstart',
    'onpropertychange',
    'oncopy',
    'ontoggle',
    'onpointerout',
    'onpointermove',
    'onpointerleave',
    'onpointerenter',
    'onpointerrawupdate',
    'onpointerover',
    'onbeforecopy',
    'onbeforecut',
    'onbeforeinput'
];

/**
 * Custom hook for sanitizing HTML.
 *
 * @private
 * @returns An object with methods for sanitizing strings and working with HTML sanitation.
 */
export const SanitizeHtmlHelper: ISanitize = (() => {
    const props: ISanitize = {
        removeAttrs: [] as SanitizeRemoveAttrs[],
        removeTags: [] as string[],
        wrapElement: null as Element,
        beforeSanitize: null as (() => BeforeSanitizeHtml) | null,
        sanitize: null as ((value: string) => string) | null,
        serializeValue: null as ((item: BeforeSanitizeHtml, value: string) => string) | null
    };

    /**
     * Configures settings before sanitizing HTML.
     *
     * @returns {BeforeSanitizeHtml} An object containing selectors.
     */
    props.beforeSanitize = (): BeforeSanitizeHtml => ({
        selectors: {
            tags: removeTags,
            attributes: removeAttrs
        }
    });

    /**
     * Sanitizes the provided HTML string.
     *
     * @param {string} value - The HTML string to be sanitized.
     * @returns {string} The sanitized HTML string.
     */
    props.sanitize = (value: string): string => {
        if (isNullOrUndefined(value)) {
            return value;
        }
        const item: BeforeSanitizeHtml = props.beforeSanitize();
        return props.serializeValue(item, value);
    };

    /**
     * Serializes and sanitizes the given HTML value based on the provided item configuration.
     *
     * @param {BeforeSanitizeHtml} item - The item configuration for sanitization.
     * @param {string} value - The HTML string to be serialized and sanitized.
     * @returns {string} The sanitized HTML string.
     */
    props.serializeValue = (item: BeforeSanitizeHtml, value: string): string => {
        props.removeAttrs = item.selectors.attributes;
        props.removeTags = item.selectors.tags;
        props.wrapElement = document.createElement('div');
        props.wrapElement.innerHTML = value;
        removeXssTags();
        removeJsEvents();
        removeXssAttrs();
        const sanitizedValue: string = props.wrapElement.innerHTML;
        removeElement();
        props.wrapElement = null;
        return sanitizedValue.replace(/&amp;/g, '&');
    };

    /**
     * Removes potentially harmful element attributes.
     *
     * @returns {void}
     */
    function removeElement(): void {
        if (props.wrapElement) {
            // Removes an element's attibute to avoid html tag validation
            const nodes: HTMLCollection = props.wrapElement.children;
            for (let j: number = 0; j < nodes.length; j++) {
                const attribute: NamedNodeMap = nodes[parseInt(j.toString(), 10)].attributes;
                for (let i: number = 0; i < attribute.length; i++) {
                    nodes[parseInt(j.toString(), 10)].removeAttribute(attribute[parseInt(i.toString(), 10)].localName);
                }
            }
        }
    }

    /**
     * Removes potentially harmful tags to prevent XSS attacks.
     *
     * @returns {void}
     */
    function removeXssTags(): void {
        if (props.wrapElement) {
            const elements: NodeListOf<HTMLElement> = props.wrapElement.querySelectorAll(props.removeTags.join(','));
            elements.forEach((element: Element) => {
                detach(element);
            });
        }
    }

    /**
     * Removes JavaScript event attributes to prevent XSS attacks.
     *
     * @returns {void}
     */
    function removeJsEvents(): void {
        if (props.wrapElement) {
            const elements: NodeListOf<HTMLElement> = props.wrapElement.querySelectorAll('[' + jsEvents.join('],[') + ']');
            elements.forEach((element: Element) => {
                jsEvents.forEach((attr: string) => {
                    if (element.hasAttribute(attr)) {
                        element.removeAttribute(attr);
                    }
                });
            });
        }
    }

    /**
     * Removes attributes based on configured selectors to prevent XSS attacks.
     *
     * @returns {void}
     */
    function removeXssAttrs(): void {
        if (props.wrapElement) {
            props.removeAttrs.forEach((item: SanitizeRemoveAttrs) => {
                const elements: NodeListOf<HTMLElement> = props.wrapElement.querySelectorAll(item.selector);
                elements.forEach((element: Element) => {
                    if (item.selector === 'a[href]') {
                        const attrValue: string = element.getAttribute(item.attribute || '');
                        if (attrValue && attrValue.replace(/\t|\s|&/, '').includes('javascript:alert')) {
                            element.removeAttribute(item.attribute || '');
                        }
                    } else {
                        element.removeAttribute(item.attribute || '');
                    }
                });
            });
        }
    }

    return props;
})();
