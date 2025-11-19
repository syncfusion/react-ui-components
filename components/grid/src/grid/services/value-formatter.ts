import { getDateFormat, getDateParser, getNumberFormat, getNumberParser, isNullOrUndefined } from '@syncfusion/react-base';
import { NumberFormatOptions, DateFormatOptions } from '@syncfusion/react-base';
import { useMemo } from 'react';
import { IValueFormatter } from '../types';
/**
 * Custom hook that provides value formatting capabilities for various types of data
 *
 * @param {string} cultureName - The culture name to use for formatting
 * @returns {IValueFormatter} An IValueFormatter instance
 * @private
 */
export const useValueFormatter: (cultureName?: string) => IValueFormatter = (cultureName?: string): IValueFormatter => {
    const formatter: IValueFormatter = useMemo(() => ({
        getFormatFunction: (format: NumberFormatOptions | DateFormatOptions): Function => {
            try {
                format.locale = cultureName;
                if (!isNullOrUndefined(format) &&
                    ((format as DateFormatOptions).type === 'dateTime' ||
                        (format as DateFormatOptions).type === 'datetime' ||
                        (format as DateFormatOptions).type === 'date' ||
                        (format as DateFormatOptions).type === 'time')) {
                    return getDateFormat(format as DateFormatOptions);
                } else {
                    return getNumberFormat(format as NumberFormatOptions);
                }
            } catch (error) {
                console.error('Error creating format function:', error);
                return () => '';
            }
        },
        getParserFunction: (format: NumberFormatOptions | DateFormatOptions): Function => {
            try {
                format.locale = cultureName;
                if ((format as DateFormatOptions).type) {
                    return getDateParser(format as DateFormatOptions);
                } else {
                    return getNumberParser(format as NumberFormatOptions);
                }
            } catch (error) {
                console.error('Error creating parser function:', error);
                return () => '';
            }
        },
        fromView: (value: string, format: Function, type?: string): string | number | Date => {
            try {
                if ((type === 'date' || type === 'datetime' || type === 'number') &&
                    (!isNullOrUndefined(format)) &&
                    (!isNullOrUndefined(value))) {
                    return format(value);
                } else {
                    return value;
                }
            } catch (error) {
                console.error('Error converting from view:', error);
                return value;
            }
        },
        toView: (value: number | Date, format: Function): string | Object => {
            try {
                return format(value);
            } catch (error) {
                console.error('Error converting to view:', error);
                return value?.toString();
            }
        }
    }), [cultureName]);
    return formatter;
};
