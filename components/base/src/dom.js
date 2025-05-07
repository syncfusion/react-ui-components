import { EventHandler } from './event-handler';
import { isNullOrUndefined, getValue, setValue, isObject, extend } from './util';
const SVG_REG = /^svg|^path|^g/;
/**
 * Function to create Html element.
 *
 * @param {string} tagName - Name of the tag, id and class names.
 * @param {ElementProperties} properties - Object to set properties in the element.
 * @param {ElementProperties} properties.id - To set the id to the created element.
 * @param {ElementProperties} properties.className - To add classes to the element.
 * @param {ElementProperties} properties.innerHTML - To set the innerHTML to element.
 * @param {ElementProperties} properties.styles - To set the some custom styles to element.
 * @param {ElementProperties} properties.attrs - To set the attributes to element.
 * @returns {any} ?
 * @private
 */
export function createElement(tagName, properties) {
    const element = (SVG_REG.test(tagName) ? document.createElementNS('http://www.w3.org/2000/svg', tagName) : document.createElement(tagName));
    if (typeof (properties) === 'undefined') {
        return element;
    }
    element.innerHTML = (properties.innerHTML ? properties.innerHTML : '');
    if (properties.className !== undefined) {
        element.className = properties.className;
    }
    if (properties.id !== undefined) {
        element.id = properties.id;
    }
    if (properties.styles !== undefined) {
        element.setAttribute('style', properties.styles);
    }
    if (properties.attrs !== undefined) {
        attributes(element, properties.attrs);
    }
    return element;
}
/**
 * The function used to add the classes to array of elements
 *
 * @param  {Element[]|NodeList} elements - An array of elements that need to add a list of classes
 * @param  {string|string[]} classes - String or array of string that need to add an individual element as a class
 * @returns {any} .
 * @private
 */
export function addClass(elements, classes) {
    const classList = getClassList(classes);
    const regExp = RegExp;
    for (const ele of elements) {
        for (const className of classList) {
            if (isObject(ele)) {
                const curClass = getValue('attributes.className', ele);
                if (isNullOrUndefined(curClass)) {
                    setValue('attributes.className', className, ele);
                }
                else if (!new regExp('\\b' + className + '\\b', 'i').test(curClass)) {
                    setValue('attributes.className', curClass + ' ' + className, ele);
                }
            }
            else {
                if (!ele.classList.contains(className)) {
                    ele.classList.add(className);
                }
            }
        }
    }
    return elements;
}
/**
 * The function used to add the classes to array of elements
 *
 * @param  {Element[]|NodeList} elements - An array of elements that need to remove a list of classes
 * @param  {string|string[]} classes - String or array of string that need to add an individual element as a class
 * @returns {any} .
 * @private
 */
export function removeClass(elements, classes) {
    const classList = getClassList(classes);
    for (const ele of elements) {
        const flag = isObject(ele);
        const canRemove = flag ? getValue('attributes.className', ele) : ele.className !== '';
        if (canRemove) {
            for (const className of classList) {
                if (flag) {
                    const classes = getValue('attributes.className', ele);
                    const classArr = classes.split(' ');
                    const index = classArr.indexOf(className);
                    if (index !== -1) {
                        classArr.splice(index, 1);
                    }
                    setValue('attributes.className', classArr.join(' '), ele);
                }
                else {
                    ele.classList.remove(className);
                }
            }
        }
    }
    return elements;
}
/**
 * The function used to get classlist.
 *
 * @param  {string | string[]} classes - An element the need to check visibility
 * @returns {string[]} ?
 * @private
 */
function getClassList(classes) {
    if (typeof classes === 'string') {
        return [classes];
    }
    return classes;
}
/**
 * The function used to check element is visible or not.
 *
 * @param  {Element|Node} element - An element the need to check visibility
 * @returns {boolean} ?
 * @private
 */
export function isVisible(element) {
    const ele = element;
    return ele.style.visibility === '' && ele.offsetWidth > 0;
}
/**
 * The function used to insert an array of elements into a first of the element.
 *
 * @param  {Element[]|NodeList} fromElements - An array of elements that need to prepend.
 * @param  {Element} toElement - An element that is going to prepend.
 * @param {boolean} isEval - ?
 * @returns {Element[] | NodeList} ?
 * @private
 */
export function prepend(fromElements, toElement, isEval) {
    const docFrag = document.createDocumentFragment();
    for (const ele of fromElements) {
        docFrag.appendChild(ele);
    }
    toElement.insertBefore(docFrag, toElement.firstElementChild);
    if (isEval) {
        executeScript(toElement);
    }
    return fromElements;
}
/**
 * The function used to insert an array of elements into last of the element.
 *
 * @param  {Element[]|NodeList} fromElements - An array of elements that need to append.
 * @param  {Element} toElement - An element that is going to prepend.
 * @param {boolean} isEval - ?
 * @returns {Element[] | NodeList} ?
 * @private
 */
export function append(fromElements, toElement, isEval) {
    const docFrag = document.createDocumentFragment();
    if (fromElements instanceof NodeList) {
        while (fromElements.length > 0) {
            docFrag.appendChild(fromElements[0]);
        }
    }
    else {
        for (const ele of fromElements) {
            docFrag.appendChild(ele);
        }
    }
    toElement.appendChild(docFrag);
    if (isEval) {
        executeScript(toElement);
    }
    return fromElements;
}
/**
 * The function is used to evaluate script from Ajax request
 *
 * @param {Element} ele - An element is going to evaluate the script
 * @returns {void} ?
 */
function executeScript(ele) {
    if (!document) {
        return;
    }
    const scripts = ele.querySelectorAll('script');
    scripts.forEach((scriptElement) => {
        const script = document.createElement('script');
        script.text = scriptElement.innerHTML;
        document.head.appendChild(script).parentNode.removeChild(script);
    });
}
/**
 * The function used to remove the element from parentnode
 *
 * @param  {Element|Node|HTMLElement} element - An element that is going to detach from the Dom
 * @returns {any} ?
 * @private
 */
export function detach(element) {
    const parentNode = element.parentNode;
    if (parentNode) {
        return parentNode.removeChild(element);
    }
    return null;
}
/**
 * The function used to remove the element from Dom also clear the bounded events
 *
 * @param  {Element|Node|HTMLElement} element - An element remove from the Dom
 * @returns {void} ?
 * @private
 */
export function remove(element) {
    const parentNode = element.parentNode;
    EventHandler.clearEvents(element);
    if (parentNode) {
        parentNode.removeChild(element);
    }
}
/**
 * The function helps to set multiple attributes to an element
 *
 * @param  {Element|Node} element - An element that need to set attributes.
 * @param  {string} attributes - JSON Object that is going to as attributes.
 * @returns {Element} ?
 * @private
 */
export function attributes(element, attributes) {
    const ele = element;
    Object.keys(attributes).forEach((key) => {
        if (isObject(ele)) {
            let iKey = key;
            if (key === 'tabindex') {
                iKey = 'tabIndex';
            }
            ele.attributes[`${iKey}`] = attributes[`${key}`];
        }
        else {
            ele.setAttribute(key, attributes[`${key}`]);
        }
    });
    return ele;
}
/**
 * The function selects the element from giving context.
 *
 * @param  {string} selector - Selector string need fetch element
 * @param  {Document|Element} context - It is an optional type, That specifies a Dom context.
 * @returns {any} ?
 * @private
 */
export function select(selector, context = document) {
    if (!document) {
        return null;
    }
    selector = querySelectId(selector);
    return context.querySelector(selector);
}
/**
 * The function selects an array of element from the given context.
 *
 * @param  {string} selector - Selector string need fetch element
 * @param  {Document|Element} context - It is an optional type, That specifies a Dom context.
 * @returns {HTMLElement[]} ?
 * @private
 */
export function selectAll(selector, context = document) {
    if (!document) {
        return [];
    }
    selector = querySelectId(selector);
    const nodeList = context.querySelectorAll(selector);
    return Array.from(nodeList);
}
/**
 * The function selects an id of element from the given context.
 *
 * @param  {string} selector - Selector string need fetch element
 * @returns {string} ?
 */
function querySelectId(selector) {
    const charRegex = /(!|"|\$|%|&|'|\(|\)|\*|\/|:|;|<|=|\?|@|\]|\^|`|{|}|\||\+|~)/g;
    if (selector.match(/#[0-9]/g) || selector.match(charRegex)) {
        const idList = selector.split(',');
        for (let i = 0; i < idList.length; i++) {
            const list = idList[parseInt(i.toString(), 10)].split(' ');
            for (let j = 0; j < list.length; j++) {
                if (list[parseInt(j.toString(), 10)].indexOf('#') > -1) {
                    if (!list[parseInt(j.toString(), 10)].match(/\[.*\]/)) {
                        const splitId = list[parseInt(j.toString(), 10)].split('#');
                        if (splitId[1].match(/^\d/) || splitId[1].match(charRegex)) {
                            const setId = list[parseInt(j.toString(), 10)].split('.');
                            setId[0] = setId[0].replace(/#/, '[id=\'') + '\']';
                            list[parseInt(j.toString(), 10)] = setId.join('.');
                        }
                    }
                }
            }
            idList[parseInt(i.toString(), 10)] = list.join(' ');
        }
        return idList.join(',');
    }
    return selector;
}
/**
 * Returns the closest ancestor of the current element (or the current element itself)
 * that matches the specified CSS selector.
 *
 * @param  {Element} element - An element that need to find the closest element.
 * @param  {string} selector - A classSelector of closest element.
 * @returns {Element} ?
 * @private
 */
export function closest(element, selector) {
    let el = element;
    if (el && typeof el.closest === 'function') {
        return el.closest(selector);
    }
    while (el && el.nodeType === 1) {
        if (matches(el, selector)) {
            return el;
        }
        el = el.parentElement;
    }
    return null;
}
/**
 * Returns all sibling elements of the given element.
 *
 * @param  {Element|Node} element - An element that need to get siblings.
 * @returns {Element[]} ?
 * @private
 */
export function siblings(element) {
    const siblings = [];
    const siblingNodes = (element.parentNode.childNodes || []);
    siblingNodes.forEach((curNode) => {
        if (curNode.nodeType === Node.ELEMENT_NODE && element !== curNode) {
            siblings.push(curNode);
        }
    });
    return siblings;
}
/**
 * set the value if not exist. Otherwise set the existing value
 *
 * @param  {HTMLElement} element - An element to which we need to set value.
 * @param  {string} property - Property need to get or set.
 * @param  {string} value - value need to set.
 * @returns {string} ?
 * @private
 */
export function getAttributeOrDefault(element, property, value) {
    let attrVal = element.getAttribute(property);
    if (isNullOrUndefined(attrVal) && value) {
        element.setAttribute(property, value.toString());
        attrVal = value;
    }
    return attrVal;
}
/**
 * Set the style attributes to Html element.
 *
 * @param {HTMLElement} element - Element which we want to set attributes
 * @param {any} attrs - Set the given attributes to element
 * @returns {void} ?
 * @private
 */
export function setStyleAttribute(element, attrs) {
    if (!isNullOrUndefined(attrs)) {
        Object.keys(attrs).forEach((key) => {
            element.style[`${key}`] = attrs[`${key}`];
        });
    }
}
/**
 * Method for add and remove classes to a dom element.
 *
 * @param {Element} element - Element for add and remove classes
 * @param {string[]} addClasses - List of classes need to be add to the element
 * @param {string[]} removeClasses - List of classes need to be remove from the element
 * @returns {void} ?
 * @private
 */
export function classList(element, addClasses, removeClasses) {
    addClass([element], addClasses);
    removeClass([element], removeClasses);
}
/**
 * Method to check whether the element matches the given selector.
 *
 * @param {Element} element - Element to compare with the selector.
 * @param {string} selector - String selector which element will satisfy.
 * @returns {void} ?
 * @private
 */
export function matches(element, selector) {
    if (!document) {
        return false;
    }
    const matchesFn = element.matches
        || element.msMatchesSelector
        || element.webkitMatchesSelector;
    if (matchesFn) {
        return matchesFn.call(element, selector);
    }
    else {
        return [].indexOf.call(document.querySelectorAll(selector), element) !== -1;
    }
}
/**
 * Method to get the html text from DOM.
 *
 * @param {HTMLElement} ele - Element to compare with the selector.
 * @param {string} innerHTML - String selector which element will satisfy.
 * @returns {void} ?
 * @private
 */
export function includeInnerHTML(ele, innerHTML) {
    ele.innerHTML = innerHTML;
}
/**
 * Method to get the containsclass.
 *
 * @param {HTMLElement} ele - Element to compare with the selector.
 * @param {string} className - String selector which element will satisfy.
 * @returns {boolean} ?
 * @private
 */
export function containsClass(ele, className) {
    if (isObject(ele)) {
        const regExp = RegExp;
        return new regExp('\\b' + className + '\\b', 'i').test(ele.attributes.getNamedItem('class')?.value || '');
    }
    else {
        return ele.classList.contains(className);
    }
}
/**
 * Method to check whether the element matches the given selector.
 *
 * @param {Object} element - Element to compare with the selector.
 * @param {boolean} deep ?
 * @returns {any} ?
 * @private
 */
// eslint-disable-next-line
export function cloneNode(element, deep) {
    if (isObject(element)) {
        if (deep) {
            return extend({}, {}, element, true);
        }
    }
    else {
        return element.cloneNode(deep);
    }
}
