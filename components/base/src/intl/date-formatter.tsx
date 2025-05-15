import { DateFormatOptions } from '../internationalization';
import { ParserBase as parser, NumberMapper } from './parser-base';
import { IntlBase as base, TimeZoneOptions, Dependables, DateObject } from './intl-base';
import { isUndefined, throwError, getValue } from '../util';
import { HijriParser } from '../hijri-parser';
import { isNullOrUndefined } from '../util';
const abbreviateRegexGlobal: RegExp = /\/MMMMM|MMMM|MMM|a|LLLL|LLL|EEEEE|EEEE|E|K|cccc|ccc|WW|W|G+|z+/gi;
const standalone: string = 'stand-alone';
const weekdayKey: string[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
export const basicPatterns: string[] = ['short', 'medium', 'long', 'full'];
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
const timeSetter: Object = {
    m: 'getMinutes',
    h: 'getHours',
    H: 'getHours',
    s: 'getSeconds',
    d: 'getDate',
    f: 'getMilliseconds'
};
export const datePartMatcher: { [key: string]: Object } = {
    'M': 'month',
    'd': 'day',
    'E': 'weekday',
    'c': 'weekday',
    'y': 'year',
    'm': 'minute',
    'h': 'hour',
    'H': 'hour',
    's': 'second',
    'L': 'month',
    'a': 'designator',
    'z': 'timeZone',
    'Z': 'timeZone',
    'G': 'era',
    'f': 'milliseconds'
};

const timeSeparator: string = 'timeSeparator';

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
export const DateFormat: IDateFormat = (() => {

    /**
     * Returns the formatter function for a given skeleton.
     *
     * @param {string} culture Specifies the culture name for formatting.
     * @param {DateFormatOptions} option Specifies the format in which the date will format.
     * @param {Object} cldr Specifies the global cldr data collection.
     * @returns {Function} Formatter function
     */
    function dateFormat(culture: string, option: DateFormatOptions, cldr: Object): Function {
        const dependable: Dependables = base.getDependables(cldr, culture, option.calendar);
        const dateObject: Object = dependable.dateObject;
        const formatOptions: FormatOptions = { isIslamic: base.islamicRegex.test(option.calendar) };

        const resPattern: string = option.format ||
            base.getResultantPattern(option.skeleton, dateObject, option.type, false);

        formatOptions.dateSeperator = base.getDateSeparator(dateObject);

        if (isUndefined(resPattern)) {
            throwError('Format options or type given must be invalid');
        } else {
            formatOptions.pattern = resPattern;
            formatOptions.numMapper = parser.getNumberMapper(dependable.parserObject, parser.getNumberingSystem(cldr));
            const patternMatch: string[] = resPattern.match(abbreviateRegexGlobal) || [];
            for (const str of patternMatch) {
                const len: number = str.length;
                let char: string = str[0];
                if (char === 'K') {
                    char = 'h';
                }

                switch (char) {
                case 'E':
                case 'c':
                    formatOptions.weekday = (dependable.dateObject)[`${base.days}`][`${standalone}`][(base).monthIndex[`${len}`]];
                    break;
                case 'M':
                case 'L':
                    formatOptions.month = (dependable.dateObject)[`${base.month}`][`${standalone}`][(base.monthIndex)[`${len}`]];
                    break;
                case 'a':
                    formatOptions.designator = getValue('dayPeriods.format.wide', dateObject);
                    break;
                case 'G': {
                    const eText: string = (len <= 3) ? 'eraAbbr' : (len === 4) ? 'eraNames' : 'eraNarrow';
                    formatOptions.era = getValue('eras.' + eText, dependable.dateObject);
                    break;
                }
                case 'z':
                    formatOptions.timeZone = getValue('dates.timeZoneNames', dependable.parserObject);
                    break;
                }
            }
        }

        return (value: Date): string => {
            if (isNaN(value.getDate())) {
                return null;
            }
            return intDateFormatter(value, formatOptions);
        };
    }

    /**
     * Formats the date according to the specified options.
     *
     * @param {Date} value The date to format.
     * @param {FormatOptions} options The formatting options.
     * @returns {string} The formatted date string.
     */
    function intDateFormatter(value: Date, options: FormatOptions): string {
        const pattern: string | null = options.pattern;
        let ret: string = '';
        const matches: string[] | null = pattern.match(base.dateParseRegex);
        const dObject: DateObject = getCurrentDateValue(value, options.isIslamic);

        if (matches) {
            for (const match of matches) {
                const length: number = match.length;
                let char: string = match[0];
                if (char === 'K') {
                    char = 'h';
                }

                let curval: number;
                let curvalstr: string = '';
                let isNumber: boolean;
                let processNumber: boolean;
                let curstr: string = '';

                switch (char) {
                case 'M':
                case 'L':
                    curval = dObject.month;
                    if (length > 2) {
                        ret += options.month[`${curval}`];
                    } else {
                        isNumber = true;
                    }
                    break;
                case 'E':
                case 'c':
                    ret += options.weekday[`${weekdayKey[value.getDay()]}`];
                    break;
                case 'H':
                case 'h':
                case 'm':
                case 's':
                case 'd':
                case 'f':
                    isNumber = true;
                    if (char === 'd') {
                        curval = dObject.date;
                    } else if (char === 'f') {
                        isNumber = false;
                        processNumber = true;
                        curvalstr = (value)[`${(timeSetter)[`${char}`]}`]().toString();
                        curvalstr = curvalstr.substring(0, length);
                        const curlength: number = curvalstr.length;
                        if (length !== curlength) {
                            if (length > 3) {
                                continue;
                            }
                            for (let i: number = 0; i < length - curlength; i++) {
                                curvalstr = '0' + curvalstr.toString();
                            }
                        }
                        curstr += curvalstr;
                    } else {
                        curval = (value)[`${(timeSetter)[`${char}`]}`]();
                    }
                    if (char === 'h') {
                        curval = curval % 12 || 12;
                    }
                    break;
                case 'y':
                    processNumber = true;
                    curstr += dObject.year;
                    if (length === 2) {
                        curstr = curstr.substr(curstr.length - 2);
                    }
                    break;
                case 'a': {
                    const desig: string = value.getHours() < 12 ? 'am' : 'pm';
                    ret += options.designator[`${desig}`];
                    break;
                }
                case 'G': {
                    const dec: number = value.getFullYear() < 0 ? 0 : 1;
                    let retu: string = options.era[`${dec}`];
                    if (isNullOrUndefined(retu)) {
                        retu = options.era[dec ? 0 : 1];
                    }
                    ret += retu || '';
                    break;
                }
                case '\'':
                    ret += (match === '\'\'') ? '\'' : match.replace(/'/g, '');
                    break;
                case 'z': {
                    const timezone: number = value.getTimezoneOffset();
                    let pattern: string = (length < 4) ? '+H;-H' : options.timeZone.hourFormat;
                    pattern = pattern.replace(/:/g, options.numMapper.timeSeparator);
                    if (timezone === 0) {
                        ret += options.timeZone.gmtZeroFormat;
                    } else {
                        processNumber = true;
                        curstr = getTimeZoneValue(timezone, pattern);
                    }
                    curstr = options.timeZone.gmtFormat.replace(/\{0\}/, curstr);
                    break;
                }
                case ':':
                    ret += (options).numMapper.numberSymbols[`${timeSeparator}`];
                    break;
                case '/':
                    ret += options.dateSeperator;
                    break;
                case 'W':
                    isNumber = true;
                    curval = base.getWeekOfYear(value);
                    break;
                default:
                    ret += match;
                }
                if (isNumber) {
                    processNumber = true;
                    curstr = checkTwodigitNumber(curval, length);
                }
                if (processNumber) {
                    ret += parser.convertValueParts(curstr, base.latnParseRegex, options.numMapper.mapper);
                }
            }
        }
        return ret;
    }

    /**
     * Returns the current date values, adjusted for Islamic calendar if needed.
     *
     * @param {Date} value The date object.
     * @param {boolean} [isIslamic] Whether the date is Islamic.
     * @returns {DateObject} The current date values.
     */
    function getCurrentDateValue(value: Date, isIslamic?: boolean): DateObject {
        if (isIslamic) {
            return HijriParser.getHijriDate(value);
        }
        return { year: value.getFullYear(), month: value.getMonth() + 1, date: value.getDate() };
    }

    /**
     * Checks and formats the number to two digits.
     *
     * @param {number} val The number
     * @param {number} len The desired length of the number.
     * @returns {string} The formatted two-digit number string.
     */
    function checkTwodigitNumber(val: number, len: number): string {
        const ret: string = val + '';
        if (len === 2 && ret.length !== 2) {
            return '0' + ret;
        }
        return ret;
    }

    /**
     * Returns the value of the Time Zone.
     *
     * @param {number} tVal Time Zone offset value.
     * @param {string} pattern Time Zone pattern.
     * @returns {string} Time Zone formatted string.
     */
    function getTimeZoneValue(tVal: number, pattern: string): string {
        const splt: string[] = pattern.split(';');
        const curPattern: string = splt[tVal > 0 ? 1 : 0];
        const no: number = Math.abs(tVal);

        return curPattern.replace(/HH?|mm/g, (str: string): string => {
            const len: number = str.length;
            const isHour: boolean = str.indexOf('H') !== -1;
            return checkTwodigitNumber(Math.floor(isHour ? (no / 60) : (no % 60)), len);
        });
    }

    return { dateFormat, getTimeZoneValue };
})();
