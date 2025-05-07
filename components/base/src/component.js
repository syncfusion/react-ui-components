import { validateLicense, createLicenseOverlay, componentList } from './validate-lic';
let componentCount = 0;
let lastPageID;
let lastHistoryLen = 0;
// Declare the static variable to count the instance
let instancecount = 0;
// Declare the static variable to find if control limit exceed or not
let isvalid = true;
// We have added styles to inline type so here declare the static variable to detect if banner is added or not
let isBannerAdded = false;
//Function handling for page navigation detection
/* istanbul ignore next */
(() => {
    if (typeof window !== 'undefined') {
        window.addEventListener('popstate', 
        /* istanbul ignore next */
        () => {
            componentCount = 0;
        });
    }
})();
/**
 * Checks if the browsing history has changed based on the current page ID or history length.
 *
 * @returns {boolean} - Returns true if history has changed, otherwise false.
 */
function isHistoryChanged() {
    return lastPageID !== pageID(window.location.href) || lastHistoryLen !== window.history.length;
}
/**
 * Computes a unique page ID based on the provided URL.
 *
 * @param {string} url - The URL from which to generate the page ID.
 * @returns {number} - The calculated page ID.
 */
function pageID(url) {
    let hash = 0;
    if (url.length === 0) {
        return hash;
    }
    for (let i = 0; i < url.length; i++) {
        const char = url.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
}
/**
 * Generates a unique ID for the component instance based on the current page and instance count.
 *
 * @private
 * @param {string} [definedName] - The name to prefix the unique ID.
 * @returns {string} - The generated unique ID.
 */
export function componentUniqueID(definedName) {
    if (isHistoryChanged()) {
        componentCount = 0;
    }
    lastPageID = pageID(window.location.href);
    lastHistoryLen = window.history.length;
    return `${definedName}_${lastPageID}_${componentCount++}`;
}
/**
 * Pre-render function to manage license validation and instance counting.
 * This function ensures that a license overlay is created if necessary
 * and tracks the number of instances for specific modules.
 *
 * @private
 * @param {string} moduleName - The name of the module being rendered.
 * @returns {void}
 */
export function preRender(moduleName) {
    if (!isvalid && !isBannerAdded) {
        createLicenseOverlay();
        isBannerAdded = true;
    }
    // Based on the considered control list we have count the instance
    if (window && document && !validateLicense()) {
        if (componentList.indexOf(moduleName) !== -1) {
            instancecount = instancecount + 1;
            if (instancecount > 5) {
                isvalid = false;
            }
        }
    }
}
