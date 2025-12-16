import { SchedulerProps } from '../types/scheduler-types';

/**
 * Type guard to check if a value is a plain object
 */
type PlainObject = Record<string, any>;

/**
 * Type guard function to determine if a value is a plain object
 *
 * @param {any} value - The value to check
 * @returns {boolean} True if the value is a plain object, false otherwise
 */
function isPlainObject(value: any): value is PlainObject {
    return (
        value != null &&
        typeof value === 'object' &&
        !Array.isArray(value) &&
        value.constructor === Object
    );
}

/**
 * Deeply merges two objects, preserving nested properties.
 * For objects, it merges properties recursively.
 * For arrays and other values, it uses the source value if provided, otherwise fallback.
 *
 * @template T - The type of the target object
 * @param {T} target - The target object (default values)
 * @param {Partial<T>} source - The source object (user provided values)
 * @returns {T} The merged object
 * @private
 */
export function deepMerge<T extends PlainObject>(target: T, source: Partial<T>): T {
    const result: T = { ...target };

    /* eslint-disable security/detect-object-injection */
    for (const key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
            const sourceValue: any = source[key];
            const targetValue: any = result[key];
            // Do not override defaults with undefined values
            if (typeof sourceValue === 'undefined') {
                continue;
            }

            if (isPlainObject(sourceValue)) {
                // If both target and source values are plain objects, merge them recursively
                if (isPlainObject(targetValue)) {
                    result[key as keyof T] = deepMerge(
                        targetValue as PlainObject,
                        sourceValue as PlainObject
                    ) as T[keyof T];
                } else {
                    // If target value is not an object, use source value
                    result[key as keyof T] = sourceValue as T[keyof T];
                }
            } else {
                // For primitive values, arrays, or null/undefined, use source value
                result[key as keyof T] = sourceValue as T[keyof T];
            }
        }
    }
    /* eslint-enable security/detect-object-injection */
    return result;
}

/**
 * Specifically merges SchedulerProps with deep merging for nested objects like eventSettings, workHours, timeScale
 *
 * @param {Partial<SchedulerProps>} defaultProps - The default scheduler properties
 * @param {Partial<SchedulerProps>} userProps - The user provided properties
 * @returns {Partial<SchedulerProps>} The merged scheduler properties with proper type safety
 * @private
 */
export function mergeSchedulerProps(
    defaultProps: Partial<SchedulerProps>,
    userProps: Partial<SchedulerProps>
): Partial<SchedulerProps> {
    return deepMerge(
        defaultProps as PlainObject,
        userProps as PlainObject
    ) as Partial<SchedulerProps>;
}
