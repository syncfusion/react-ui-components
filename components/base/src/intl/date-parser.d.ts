import { DateFormatOptions } from '../internationalization';
import { TimeZoneOptions } from './intl-base';
import { NumericOptions } from './parser-base';
/**
 * Interface for date parsing options
 */
interface ParseOptions {
    month?: Object;
    weekday?: string[];
    pattern?: string;
    designator?: Object;
    timeZone?: TimeZoneOptions;
    era?: Object;
    hour12?: boolean;
    parserRegex?: RegExp;
    evalposition?: {
        [key: string]: ValuePosition;
    };
    isIslamic?: boolean;
    culture?: string;
}
/**
 * Interface for the date options
 */
interface DateParts {
    month?: number;
    day?: number;
    year?: number;
    hour?: number;
    minute?: number;
    second?: number;
    designator?: string;
    timeZone?: number;
    hour12?: boolean;
}
/**
 * Interface for value position
 */
interface ValuePosition {
    isNumber: boolean;
    pos: number;
    hourOnly?: boolean;
}
export interface IDateParser {
    /**
     * Returns the parser function for given skeleton.
     *
     * @private
     * @param {string} culture -  Specifies the culture name to be which formatting.
     * @param {DateFormatOptions} option - Specific the format in which string date  will be parsed.
     * @param {Object} cldr - Specifies the global cldr data collection.
     * @returns {Function} ?
     */
    dateParser: (culture: string, option: DateFormatOptions, cldr: Object) => Function;
    /**
     * Returns date object for provided date options.
     *
     * @private
     * @param {DateParts} options ?
     * @param {Date} value ?
     * @returns {Date} ?
     */
    getDateObject: (options: DateParts, value?: Date) => Date;
    /**
     * Returns date parsing options for provided value along with parse and numeric options.
     *
     * @private
     * @param {string} value ?
     * @param {ParseOptions} parseOptions ?
     * @param {NumericOptions} num ?
     * @returns {DateParts} ?
     */
    internalDateParse: (value: string, parseOptions: ParseOptions, num: NumericOptions) => DateParts;
    /**
     * Returns parsed number for provided Numeric string and Numeric Options.
     *
     * @private
     * @param {string} value ?
     * @param {NumericOptions} option ?
     * @returns {number} ?
     */
    internalNumberParser: (value: string, option: NumericOptions) => number;
    /**
     * Returns parsed time zone RegExp for provided hour format and time zone.
     *
     * @private
     * @param {string} hourFormat ?
     * @param {TimeZoneOptions} tZone ?
     * @param {string} nRegex ?
     * @returns {string} ?
     */
    parseTimeZoneRegx: (hourFormat: string, tZone: TimeZoneOptions, nRegex: string) => string;
    /**
     * Returns zone based value.
     *
     * @private
     * @param {boolean} flag ?
     * @param {string} val1 ?
     * @param {string} val2 ?
     * @param {NumericOptions} num ?
     * @returns {number} ?
     */
    getZoneValue: (flag: boolean, val1: string, val2: string, num: NumericOptions) => number;
}
/**
 * Custom function for date parsing.
 */
export declare const DateParser: IDateParser;
export {};
