import { useRef } from 'react';
import { ChartBorderProps, ChartSeriesProps } from '../base/interfaces';

/**
 * Type definition for comparable values that can be deeply compared
 */
type ComparableValue =
    | string
    | number
    | boolean
    | null
    | undefined
    | Date
    | ChartBorderProps
    | ComparableValue[]
    | { [key: string]: ComparableValue };

/**
 * Deep equality comparison function for objects
 * More performant than using JSON.stringify for dependency tracking
 *
 * @param {ComparableValue} objOne - First object to compare
 * @param {ComparableValue} objTwo - Second object to compare
 * @returns {boolean} True if objects are deeply equal
 * @private
 */
export function isEqual(objOne: ComparableValue, objTwo: ComparableValue): boolean {
    // Handle primitives
    if (objOne === objTwo) {return true; }

    // If either is null or not an object, they're not equal
    if (objOne == null || objTwo == null || typeof objOne !== 'object' || typeof objTwo !== 'object') {
        return false;
    }

    // Handle arrays
    if (Array.isArray(objOne) && Array.isArray(objTwo)) {
        if (objOne.length !== objTwo.length) {return false; }

        for (let i: number = 0; i < objOne.length; i++) {
            if (!isEqual(objOne[i as number], objTwo[i as number])) {return false; }
        }

        return true;
    }

    // Handle objects
    const keysOne: string[] = Object.keys(objOne);
    const keysTwo: string[] = Object.keys(objTwo);

    if (keysOne.length !== keysTwo.length) {return false; }

    for (const key of keysOne) {
        if (!Object.prototype.hasOwnProperty.call(objTwo, key)) {return false; }
        if (!isEqual((objOne as Record<string, ComparableValue>)[key as string],
                     (objTwo as Record<string, ComparableValue>)[key as string])) {return false; }
    }

    return true;
}


/**
 * A hook that uses deep comparison to memoize a value
 * Constrains the generic type to extend ComparableValue for type safety
 *
 * @param {T} value - The value to memoize
 * @returns {T} The memoized value
 * @private
 */
export function useDeepCompare<T extends ComparableValue>(value: T): T {
    const ref: React.RefObject<T> = useRef<T>(value);

    if (!isEqual(value, ref.current)) {
        ref.current = value;
    }

    return ref.current;
}

/**
 * Custom hook for efficiently tracking data source changes in chart series
 * Replaces JSON.stringify for data sources in dependency arrays
 *
 * @param {ChartSeriesProps[]} seriesList - List of chart series
 * @returns {ComparableValue[]} Stable reference that only changes when data sources change
 * @private
 */
export function useStableDataSources(seriesList: ChartSeriesProps[]): ComparableValue[] {
    return useDeepCompare(
        seriesList.map((series: ChartSeriesProps) => series.dataSource as ComparableValue)
    );
}

/**
 * Custom hook for efficiently tracking marker property changes
 * Replaces JSON.stringify for marker properties in dependency arrays
 *
 * @param {ChartSeriesProps[]} series - List of chart series properties
 * @returns {ComparableValue[]} Array of marker properties that only changes when marker properties change
 * @private
 */
export function useStableMarkerProps(series: ChartSeriesProps[]): ComparableValue[] {
    return useDeepCompare(
        series.map((s: ChartSeriesProps) => s.marker as ComparableValue)
    );
}


/**
 * Custom hook for efficiently tracking data label property changes
 * Replaces JSON.stringify for data label properties in dependency arrays
 *
 * @param {ChartSeriesProps[]} series - List of chart series properties
 * @returns {ComparableValue[]} Stable reference that only changes when data label properties change
 * @private
 */
export function useStableDataLabelProps(series: ChartSeriesProps[]): ComparableValue[] {
    return useDeepCompare(
        series.map((s: ChartSeriesProps) => {
            const { ...safeDataLabel } = s.marker?.dataLabel || {};
            return safeDataLabel as ComparableValue;
        })
    );
}

/**
 * Custom hook for efficiently tracking general series property changes
 * Replaces JSON.stringify for series properties in dependency arrays
 *
 * @param {ChartSeriesProps[]} processedSeriesData - Processed series data for change detection
 * @returns {ComparableValue} Stable reference that only changes when series properties change
 * @private
 */
export function useStableSeriesProps(processedSeriesData: ChartSeriesProps[]): ComparableValue {
    return useDeepCompare(processedSeriesData as ComparableValue);
}



