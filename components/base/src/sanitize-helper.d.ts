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
    removeAttrs: SanitizeRemoveAttrs[];
    /** Array of HTML tags to remove during sanitization */
    removeTags: string[];
    /** Element to wrap the sanitized content */
    wrapElement: Element;
    /** Callback function executed before sanitization begins */
    beforeSanitize: () => BeforeSanitizeHtml;
    /** Custom sanitization function */
    sanitize: (value: string) => string;
    /** Function to serialize the sanitized value */
    serializeValue: (item: BeforeSanitizeHtml, value: string) => string;
}
/**
 * Custom hook for sanitizing HTML.
 *
 * @private
 * @returns An object with methods for sanitizing strings and working with HTML sanitation.
 */
export declare const SanitizeHtmlHelper: ISanitize;
export {};
