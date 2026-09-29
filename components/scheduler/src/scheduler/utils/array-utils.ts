/**
 * Gets an item from an array by its zero-based index.
 *
 * @template T - The array item type.
 * @param {T[] | null | undefined} items - Items to search.
 * @param {number} index - Zero-based index of the requested item.
 * @returns {T | undefined} The requested item, or `undefined` when it is unavailable.
 * @private
 */
export function getItemByIndex<T>(items: T[] | null | undefined, index: number): T | undefined {
    if (!Array.isArray(items)) {
        return undefined;
    }
    return items.slice(index, index + 1).shift();
}

/**
 * Gets a value from an object by its property key.
 *
 * @param {Record<string, unknown> | null | undefined} item - Object to read.
 * @param {string} key - Property key to read.
 * @returns {unknown} The property value, or `undefined` when it is unavailable.
 * @private
 */
export function getItemByKey(item: Record<string, unknown> | null | undefined, key: string): unknown {
    return item ? Reflect.get(item, key) : undefined;
}

/**
 * Sets a value on an object by its property key.
 *
 * @param {object} item - Object to update.
 * @param {string} key - Property key to update.
 * @param {unknown} value - Value to assign.
 * @returns {void}
 * @private
 */
export function setItemByKey(item: object, key: string, value: unknown): void {
    Object.assign(item, { [key]: value });
}
