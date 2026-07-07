import { getDateFormat, getDateParser, getNumberFormat, getNumberParser, isNullOrUndefined } from '@syncfusion/react-base';
import { NumberFormatOptions, DateFormatOptions } from '@syncfusion/react-base';
import { useMemo } from 'react';
import { IValueFormatter } from '../types';

// Value formatter constants
const FORMAT_TYPE_DATE_TIME: string = 'dateTime';
const FORMAT_TYPE_DATETIME: string = 'datetime';
const FORMAT_TYPE_DATE: string = 'date';
const FORMAT_TYPE_TIME: string = 'time';
const FORMAT_TYPE_NUMBER: string = 'number';
const FORMAT_ERROR_MESSAGE: string = 'Error creating format function:';
const PARSER_ERROR_MESSAGE: string = 'Error creating parser function:';
const FROM_VIEW_ERROR_MESSAGE: string = 'Error converting from view:';
const TO_VIEW_ERROR_MESSAGE: string = 'Error converting to view:';
const EMPTY_STRING: string = '';
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
                    ((format as DateFormatOptions).type === FORMAT_TYPE_DATE_TIME ||
                        (format as DateFormatOptions).type === FORMAT_TYPE_DATETIME ||
                        (format as DateFormatOptions).type === FORMAT_TYPE_DATE ||
                        (format as DateFormatOptions).type === FORMAT_TYPE_TIME)) {
                    return getDateFormat(format as DateFormatOptions);
                } else {
                    return getNumberFormat(format as NumberFormatOptions);
                }
            } catch (error) {
                console.error(FORMAT_ERROR_MESSAGE, error);
                return () => EMPTY_STRING;
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
                console.error(PARSER_ERROR_MESSAGE, error);
                return () => EMPTY_STRING;
            }
        },
        fromView: (value: string, format: Function, type?: string): string | number | Date => {
            try {
                if ((type === FORMAT_TYPE_DATE || type === FORMAT_TYPE_DATETIME || type === FORMAT_TYPE_NUMBER) &&
                    (!isNullOrUndefined(format)) &&
                    (!isNullOrUndefined(value))) {
                    return format(value);
                } else {
                    return value;
                }
            } catch (error) {
                console.error(FROM_VIEW_ERROR_MESSAGE, error);
                return value;
            }
        },
        toView: (value: number | Date, format: Function): string => {
            try {
                return format(value);
            } catch (error) {
                console.error(TO_VIEW_ERROR_MESSAGE, error);
                return value?.toString();
            }
        }
    }), [cultureName]);
    return formatter;
};
