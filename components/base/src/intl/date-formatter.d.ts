import { DateFormatOptions } from '../internationalization';
import { NumberMapper } from './parser-base';
import { TimeZoneOptions } from './intl-base';
export declare const basicPatterns: string[];
/**
 * @interface FormatOptions
 * Interface for Date Format Options Modules.
 *
 * @private
 */
export interface FormatOptions {
    month?: Object;
    weekday?: Object;
    pattern?: string;
    designator?: Object;
    timeZone?: TimeZoneOptions;
    era?: Object;
    hour12?: boolean;
    numMapper?: NumberMapper;
    dateSeperator?: string;
    isIslamic?: boolean;
    weekOfYear?: string;
}
export declare const datePartMatcher: {
    [key: string]: Object;
};
export interface IDateFormat {
    /**
     * Returns the formatter function for a given skeleton.
     *
     * @private
     * @param {string} culture Specifies the culture name for formatting.
     * @param {DateFormatOptions} option Specifies the format in which the date will format.
     * @param {Object} cldr Specifies the global cldr data collection.
     * @returns {Function} Formatter function
     */
    dateFormat: (culture: string, option: DateFormatOptions, cldr: Object) => Function;
    /**
     * Returns the value of the Time Zone.
     *
     * @private
     * @param {number} tVal Time Zone offset value.
     * @param {string} pattern Time Zone pattern.
     * @returns {string} Time Zone formatted string.
     */
    getTimeZoneValue: (tVal: number, pattern: string) => string;
}
/**
 * @hook useDateFormat
 * Date Format is a framework that provides support for date formatting.
 *
 * @returns {Object} An object containing methods related to date formatting.
 */
export declare const DateFormat: IDateFormat;
