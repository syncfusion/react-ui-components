import { detach } from './dom';
import { isNullOrUndefined } from './util';
const removeTags = [
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
const removeAttrs = [
    { attribute: 'href', selector: '[href*="javascript:"]' },
    { attribute: 'href', selector: 'a[href]' },
    { attribute: 'background', selector: '[background^="javascript:"]' },
    { attribute: 'style', selector: '[style*="javascript:"]' },
    { attribute: 'style', selector: '[style*="expression("]' },
    { attribute: 'href', selector: 'a[href^="data:text/html;base64"]' }
];
const jsEvents = ['onchange',
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
export const SanitizeHtmlHelper = (() => {
    const props = {
        removeAttrs: [],
        removeTags: [],
        wrapElement: null,
        beforeSanitize: null,
        sanitize: null,
        serializeValue: null
    };
    /**
     * Configures settings before sanitizing HTML.
     *
     * @returns {BeforeSanitizeHtml} An object containing selectors.
     */
    props.beforeSanitize = () => ({
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
    props.sanitize = (value) => {
        if (isNullOrUndefined(value)) {
            return value;
        }
        const item = props.beforeSanitize();
        return props.serializeValue(item, value);
    };
    /**
     * Serializes and sanitizes the given HTML value based on the provided item configuration.
     *
     * @param {BeforeSanitizeHtml} item - The item configuration for sanitization.
     * @param {string} value - The HTML string to be serialized and sanitized.
     * @returns {string} The sanitized HTML string.
     */
    props.serializeValue = (item, value) => {
        props.removeAttrs = item.selectors.attributes;
        props.removeTags = item.selectors.tags;
        props.wrapElement = document.createElement('div');
        props.wrapElement.innerHTML = value;
        removeXssTags();
        removeJsEvents();
        removeXssAttrs();
        const sanitizedValue = props.wrapElement.innerHTML;
        removeElement();
        props.wrapElement = null;
        return sanitizedValue.replace(/&amp;/g, '&');
    };
    /**
     * Removes potentially harmful element attributes.
     *
     * @returns {void}
     */
    function removeElement() {
        if (props.wrapElement) {
            // Removes an element's attibute to avoid html tag validation
            const nodes = props.wrapElement.children;
            for (let j = 0; j < nodes.length; j++) {
                const attribute = nodes[parseInt(j.toString(), 10)].attributes;
                for (let i = 0; i < attribute.length; i++) {
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
    function removeXssTags() {
        if (props.wrapElement) {
            const elements = props.wrapElement.querySelectorAll(props.removeTags.join(','));
            elements.forEach((element) => {
                detach(element);
            });
        }
    }
    /**
     * Removes JavaScript event attributes to prevent XSS attacks.
     *
     * @returns {void}
     */
    function removeJsEvents() {
        if (props.wrapElement) {
            const elements = props.wrapElement.querySelectorAll('[' + jsEvents.join('],[') + ']');
            elements.forEach((element) => {
                jsEvents.forEach((attr) => {
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
    function removeXssAttrs() {
        if (props.wrapElement) {
            props.removeAttrs.forEach((item) => {
                const elements = props.wrapElement.querySelectorAll(item.selector);
                elements.forEach((element) => {
                    if (item.selector === 'a[href]') {
                        const attrValue = element.getAttribute(item.attribute || '');
                        if (attrValue && attrValue.replace(/\t|\s|&/, '').includes('javascript:alert')) {
                            element.removeAttribute(item.attribute || '');
                        }
                    }
                    else {
                        element.removeAttribute(item.attribute || '');
                    }
                });
            });
        }
    }
    return props;
})();
