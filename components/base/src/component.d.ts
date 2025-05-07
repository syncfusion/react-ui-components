/**
 * Generates a unique ID for the component instance based on the current page and instance count.
 *
 * @private
 * @param {string} [definedName] - The name to prefix the unique ID.
 * @returns {string} - The generated unique ID.
 */
export declare function componentUniqueID(definedName?: string): string;
/**
 * Pre-render function to manage license validation and instance counting.
 * This function ensures that a license overlay is created if necessary
 * and tracks the number of instances for specific modules.
 *
 * @private
 * @param {string} moduleName - The name of the module being rendered.
 * @returns {void}
 */
export declare function preRender(moduleName: string): void;
