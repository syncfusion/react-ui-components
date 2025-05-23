import { DateFormatOptions } from '../internationalization';
import { IntlBase as base, TimeZoneOptions, Dependables, DateObject } from './intl-base';
import { ParserBase as parser, NumericOptions, NumberMapper } from './parser-base';
import { isUndefined, throwError, getValue, isNullOrUndefined } from '../util';
import { datePartMatcher } from './date-formatter';
import { HijriParser } from '../hijri-parser';

const standalone: string = 'stand-alone';
const latnRegex: RegExp = /^[0-9]*$/;
const timeSetter: Record<string, string> = {
    minute: 'setMinutes',
    hour: 'setHours',
    second: 'setSeconds',
    day: 'setDate',
    month: 'setMonth',
    milliseconds: 'setMilliseconds'
};

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
    evalposition?: { [key: string]: ValuePosition };
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

const month: string = 'months';

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
export const DateParser: IDateParser = (() => {
/**
 * Returns the parser function for given skeleton.
 *
 * @param {string} culture - Specifies the culture name for formatting.
 * @param {DateFormatOptions} option - Specifies the format in which string date will be parsed.
 * @param {Object} cldr - Specifies the global cldr data collection.
 * @returns {Function} - Returns a function that can parse dates.
 */
    function dateParser(culture: string, option: DateFormatOptions, cldr: Object): Function {
        const dependable: Dependables = base.getDependables(cldr, culture, option.calendar);
        const numOptions: NumericOptions = parser.getCurrentNumericOptions(
            dependable.parserObject,
            parser.getNumberingSystem(cldr),
            false
        );
        let parseOptions: ParseOptions = {};
        const resPattern: string = option.format ||
            base.getResultantPattern(option.skeleton, dependable.dateObject, option.type, false);
        let regexString: string = '';
        let hourOnly: boolean;

        if (isUndefined(resPattern)) {
            throwError('Format options or type given must be invalid');
        } else {
            parseOptions = {
                isIslamic: base.islamicRegex.test(option.calendar),
                pattern: resPattern,
                evalposition: {},
                culture: culture
            };
            const patternMatch: string[] = resPattern.match(base.dateParseRegex) || [];
            const length: number = patternMatch.length;
            let gmtCorrection: number = 0;
            let zCorrectTemp: number = 0;
            let isgmtTraversed: boolean = false;
            const nRegx: string = numOptions.numericRegex;
            const numMapper: NumberMapper = parser.getNumberMapper(dependable.parserObject, parser.getNumberingSystem(cldr));

            for (let i: number = 0; i < length; i++) {
                const str: string = patternMatch[parseInt(i.toString(), 10)];
                const len: number = str.length;
                const char: string = (str[0] === 'K') ? 'h' : str[0];
                let isNumber: boolean;
                let canUpdate: boolean;
                const charKey: keyof typeof datePartMatcher = datePartMatcher[`${char}`] as string;
                const optional: string = (len === 2) ? '' : '?';

                if (isgmtTraversed) {
                    gmtCorrection = zCorrectTemp;
                    isgmtTraversed = false;
                }

                switch (char) {
                case 'E':
                case 'c': {
                    const weekData: Object = (dependable.dateObject)[`${base.days}`][`${standalone}`][(base).monthIndex[`${len}`]];
                    const weekObject: Object = parser.reverseObject(weekData);
                    regexString += '(' + Object.keys(weekObject).join('|') + ')';
                    break;
                }
                case 'M':
                case 'L':
                case 'd':
                case 'm':
                case 's':
                case 'h':
                case 'H':
                case 'f':
                    canUpdate = true;
                    if ((char === 'M' || char === 'L') && len > 2) {
                        const monthData: Object = (dependable).dateObject[`${month}`][`${standalone}`][(base).monthIndex[`${len}`]];
                        (parseOptions)[`${charKey}`] = parser.reverseObject(monthData);
                        regexString += '(' + Object.keys((parseOptions)[`${charKey}`]).join('|') + ')';
                    } else if (char === 'f') {
                        if (len > 3) {
                            continue;
                        }
                        isNumber = true;
                        regexString += '(' + nRegx + nRegx + '?' + nRegx + '?' + ')';
                    } else {
                        isNumber = true;
                        regexString += '(' + nRegx + nRegx + optional + ')';
                    }
                    if (char === 'h') {
                        parseOptions.hour12 = true;
                    }
                    break;
                case 'W': {
                    const opt: string = len === 1 ? '?' : '';
                    regexString += '(' + nRegx + opt + nRegx + ')';
                    break;
                }
                case 'y':
                    canUpdate = isNumber = true;
                    if (len === 2) {
                        regexString += '(' + nRegx + nRegx + ')';
                    } else {
                        regexString += '(' + nRegx + '{' + len + ',})';
                    }
                    break;
                case 'a': {
                    canUpdate = true;
                    const periodValue: Object = getValue('dayPeriods.format.wide', dependable.dateObject);
                    (parseOptions)[`${charKey}`] = parser.reverseObject(periodValue);
                    regexString += '(' + Object.keys((parseOptions)[`${charKey}`]).join('|') + ')';
                    break;
                }
                case 'G': {
                    canUpdate = true;
                    const eText: string = (len <= 3) ? 'eraAbbr' : (len === 4) ? 'eraNames' : 'eraNarrow';
                    (parseOptions)[`${charKey}`] = parser.reverseObject(getValue('eras.' + eText, dependable.dateObject));
                    regexString += '(' + Object.keys((parseOptions)[`${charKey}`]).join('|') + '?)';
                    break;
                }
                case 'z': {
                    const tval: number = new Date().getTimezoneOffset();
                    canUpdate = (tval !== 0);
                    (parseOptions)[`${charKey}`] = getValue('dates.timeZoneNames', dependable.parserObject);
                    const tzone: TimeZoneOptions = (parseOptions)[`${charKey}`];
                    hourOnly = (len < 4);
                    let hpattern: string = hourOnly ? '+H;-H' : tzone.hourFormat;
                    hpattern = hpattern.replace(/:/g, numMapper.timeSeparator);
                    regexString += '(' + parseTimeZoneRegx(hpattern, tzone, nRegx) + ')?';
                    isgmtTraversed = true;
                    zCorrectTemp = hourOnly ? 6 : 12;
                    break;
                }
                case '\'': {
                    const iString: string = str.replace(/'/g, '');
                    regexString += '(' + iString + ')?';
                    break;
                }
                default:
                    regexString += '([\\D])';
                    break;
                }

                if (canUpdate) {
                    parseOptions.evalposition[`${charKey}`] = { isNumber: isNumber, pos: i + 1 + gmtCorrection, hourOnly: hourOnly };
                }

                if (i === length - 1 && !isNullOrUndefined(regexString)) {
                    const regExp: RegExpConstructor = RegExp;
                    parseOptions.parserRegex = new regExp('^' + regexString + '$', 'i');
                }
            }
        }

        return (value: string): Date => {
            const parsedDateParts: DateParts = internalDateParse(value, parseOptions, numOptions);
            if (isNullOrUndefined(parsedDateParts) || !Object.keys(parsedDateParts).length) {
                return null;
            }
            if (parseOptions.isIslamic) {
                let dobj: DateObject = {};
                let tYear: number | undefined = parsedDateParts.year;
                const tDate: number | undefined = parsedDateParts.day;
                const tMonth: number | undefined = parsedDateParts.month;
                const ystrig: string = tYear ? (tYear + '') : '';
                const is2DigitYear: boolean = (ystrig.length === 2);
                if (!tYear || !tMonth || !tDate || is2DigitYear) {
                    dobj = HijriParser.getHijriDate(new Date());
                }
                if (is2DigitYear) {
                    tYear = parseInt((dobj.year + '').slice(0, 2) + ystrig, 10);
                }
                const dateObject: Date = HijriParser.toGregorian(
                    tYear || dobj.year, tMonth || dobj.month, tDate || dobj.date);
                parsedDateParts.year = dateObject.getFullYear();
                parsedDateParts.month = dateObject.getMonth() + 1;
                parsedDateParts.day = dateObject.getDate();
            }
            return getDateObject(parsedDateParts);
        };
    }

    /**
     * Returns date object for provided date options.
     *
     * @param {DateParts} options - Specifies the date parts consisting of year, month, day, etc.
     * @param {Date} [value] - Specifies the base date value to copy time parts.
     * @returns {Date} - Returns the constructed date object.
     */
    function getDateObject(options: DateParts, value?: Date): Date {
        const res: Date = value || new Date();
        res.setMilliseconds(0);
        const tKeys: string[] = ['hour', 'minute', 'second', 'milliseconds', 'month', 'day'];
        let y: number | undefined = options.year;
        const desig: string | undefined = options.designator;
        const tzone: number | undefined = options.timeZone;

        if (y && !isUndefined(y)) {
            const len: number = (y + '').length;
            if (len <= 2) {
                const century: number = Math.floor(res.getFullYear() / 100) * 100;
                y += century;
            }
            res.setFullYear(y);
        }

        for (const key of tKeys) {
            let tValue: number = (options)[`${key}`];
            if (isUndefined(tValue) && key === 'day') {
                res.setDate(1);
            }
            if (!isUndefined(tValue)) {
                if (key === 'month') {
                    tValue -= 1;
                    if (tValue < 0 || tValue > 11) {
                        return new Date('invalid');
                    }
                    const pDate: number = res.getDate();
                    res.setDate(1);
                    (res)[(timeSetter)[`${key}`]](tValue);
                    const lDate: number = new Date(res.getFullYear(), tValue + 1, 0).getDate();
                    res.setDate(pDate < lDate ? pDate : lDate);
                } else {
                    if (key === 'day') {
                        const lastDay: number = new Date(res.getFullYear(), res.getMonth() + 1, 0).getDate();
                        if ((tValue < 1 || tValue > lastDay)) {
                            return null;
                        }
                    }
                    (res)[`${(timeSetter)[`${key}`]}`](tValue);
                }
            }
        }

        if (!isUndefined(desig)) {
            const hour: number = res.getHours();
            if (desig === 'pm') {
                res.setHours(hour + (hour === 12 ? 0 : 12));
            } else if (hour === 12) {
                res.setHours(0);
            }
        }

        if (tzone && !isUndefined(tzone)) {
            const tzValue: number = tzone - res.getTimezoneOffset();
            if (tzValue !== 0) {
                res.setMinutes(res.getMinutes() + tzValue);
            }
        }

        return res;
    }

    /**
     * Returns date parsing options for provided value along with parse and numeric options.
     *
     * @param {string} value - Specifies the string value to be parsed.
     * @param {ParseOptions} parseOptions - Specifies the parsing options.
     * @param {NumericOptions} num - Specifies the numeric options.
     * @returns {DateParts} - Returns the parsed date parts.
     */
    function internalDateParse(value: string, parseOptions: ParseOptions, num: NumericOptions): DateParts {
        const matches: string[] = value.match(parseOptions.parserRegex);
        const retOptions: DateParts = { 'hour': 0, 'minute': 0, 'second': 0 };

        if (isNullOrUndefined(matches)) {
            return null;
        } else {
            const props: string[] = Object.keys(parseOptions.evalposition);
            for (const prop of props) {
                const curObject: ValuePosition = parseOptions.evalposition[`${prop}`];
                let matchString: string = matches[curObject.pos];
                if (curObject.isNumber) {
                    (retOptions)[`${prop}`] = internalNumberParser(matchString, num);
                } else {
                    if (prop === 'timeZone' && !isUndefined(matchString)) {
                        const pos: number = curObject.pos;
                        let val: number;
                        const tmatch: string = matches[pos + 1];
                        const flag: boolean = !isUndefined(tmatch);
                        if (curObject.hourOnly) {
                            val = getZoneValue(flag, tmatch, matches[pos + 4], num) * 60;
                        } else {
                            val = getZoneValue(flag, tmatch, matches[pos + 7], num) * 60;
                            val += getZoneValue(flag, matches[pos + 4], matches[pos + 10], num);
                        }

                        if (!isNullOrUndefined(val)) {
                            retOptions[`${prop}`] = val;
                        }
                    } else {
                        const cultureOptions: string[] = ['en-US', 'en-MH', 'en-MP'];
                        matchString = ((prop === 'month') && (!(parseOptions).isIslamic) && ((parseOptions).culture === 'en' || (parseOptions).culture === 'en-GB' || (parseOptions).culture === 'en-US'))
                            ? matchString[0].toUpperCase() + matchString.substring(1).toLowerCase() : matchString;
                        matchString = ((prop !== 'month') && (prop === 'designator') && parseOptions.culture && (parseOptions).culture.indexOf('en-') !== -1 && cultureOptions.indexOf(parseOptions.culture) === -1)
                            ? matchString.toLowerCase() : matchString;
                        (retOptions)[`${prop}`] = (parseOptions)[`${prop}`][`${matchString}`];
                    }
                }
            }
            if (parseOptions.hour12) {
                retOptions.hour12 = true;
            }
        }
        return retOptions;
    }

    /**
     * Returns parsed number for provided Numeric string and Numeric Options.
     *
     * @param {string} value - Specifies the numeric string value to be parsed.
     * @param {NumericOptions} option - Specifies the numeric options.
     * @returns {number} - Returns the parsed numeric value.
     */
    function internalNumberParser(value: string, option: NumericOptions): number {
        value = parser.convertValueParts(value, option.numberParseRegex, option.numericPair);
        if (latnRegex.test(value)) {
            return +value;
        }
        return null;
    }

    /**
     * Returns parsed time zone RegExp for provided hour format and time zone.
     *
     * @param {string} hourFormat - Specifies the format of the hour.
     * @param {TimeZoneOptions} tZone - Specifies the time zone options.
     * @param {string} nRegex - Specifies the numeric regex.
     * @returns {string} - Returns the timezone regular expression string.
     */
    function parseTimeZoneRegx(hourFormat: string, tZone: TimeZoneOptions, nRegex: string): string {
        const pattern: string = tZone.gmtFormat;
        let ret: string;
        const cRegex: string = '(' + nRegex + ')' + '(' + nRegex + ')';

        ret = hourFormat.replace('+', '\\+');
        if (hourFormat.indexOf('HH') !== -1) {
            ret = ret.replace(/HH|mm/g, '(' + cRegex + ')');
        } else {
            ret = ret.replace(/H|m/g, '(' + cRegex + '?)');
        }
        const splitStr: string[] = (ret.split(';').map((str: string): string => {
            return pattern.replace('{0}', str);
        }));
        ret = splitStr.join('|') + '|' + tZone.gmtZeroFormat;
        return ret;
    }

    /**
     * Returns zone based value.
     *
     * @param {boolean} flag - Specifies whether the value needs to be negated.
     * @param {string} val1 - Specifies the first value to be parsed.
     * @param {string} val2 - Specifies the second value to be parsed.
     * @param {NumericOptions} num - Specifies the numeric options.
     * @returns {number} - Returns the computed zone value.
     */
    function getZoneValue(flag: boolean, val1: string, val2: string, num: NumericOptions): number {
        const ival: string = flag ? val1 : val2;
        if (!ival) {
            return 0;
        }
        const value: number = internalNumberParser(ival, num);
        if (value && flag) {
            return -value;
        }
        return value;
    }

    return {
        dateParser,
        getDateObject,
        internalDateParse,
        internalNumberParser,
        parseTimeZoneRegx,
        getZoneValue
    };
})();
