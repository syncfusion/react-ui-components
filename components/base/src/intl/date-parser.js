import { IntlBase as base } from './intl-base';
import { ParserBase as parser } from './parser-base';
import { isUndefined, throwError, getValue, isNullOrUndefined } from '../util';
import { datePartMatcher } from './date-formatter';
import { HijriParser } from '../hijri-parser';
const standalone = 'stand-alone';
const latnRegex = /^[0-9]*$/;
const timeSetter = {
    minute: 'setMinutes',
    hour: 'setHours',
    second: 'setSeconds',
    day: 'setDate',
    month: 'setMonth',
    milliseconds: 'setMilliseconds'
};
const month = 'months';
/**
 * Custom function for date parsing.
 */
export const DateParser = (() => {
    /**
     * Returns the parser function for given skeleton.
     *
     * @param {string} culture - Specifies the culture name for formatting.
     * @param {DateFormatOptions} option - Specifies the format in which string date will be parsed.
     * @param {Object} cldr - Specifies the global cldr data collection.
     * @returns {Function} - Returns a function that can parse dates.
     */
    function dateParser(culture, option, cldr) {
        const dependable = base.getDependables(cldr, culture, option.calendar);
        const numOptions = parser.getCurrentNumericOptions(dependable.parserObject, parser.getNumberingSystem(cldr), false);
        let parseOptions = {};
        const resPattern = option.format ||
            base.getResultantPattern(option.skeleton, dependable.dateObject, option.type, false);
        let regexString = '';
        let hourOnly;
        if (isUndefined(resPattern)) {
            throwError('Format options or type given must be invalid');
        }
        else {
            parseOptions = {
                isIslamic: base.islamicRegex.test(option.calendar),
                pattern: resPattern,
                evalposition: {},
                culture: culture
            };
            const patternMatch = resPattern.match(base.dateParseRegex) || [];
            const length = patternMatch.length;
            let gmtCorrection = 0;
            let zCorrectTemp = 0;
            let isgmtTraversed = false;
            const nRegx = numOptions.numericRegex;
            const numMapper = parser.getNumberMapper(dependable.parserObject, parser.getNumberingSystem(cldr));
            for (let i = 0; i < length; i++) {
                const str = patternMatch[parseInt(i.toString(), 10)];
                const len = str.length;
                const char = (str[0] === 'K') ? 'h' : str[0];
                let isNumber;
                let canUpdate;
                const charKey = datePartMatcher[`${char}`];
                const optional = (len === 2) ? '' : '?';
                if (isgmtTraversed) {
                    gmtCorrection = zCorrectTemp;
                    isgmtTraversed = false;
                }
                switch (char) {
                    case 'E':
                    case 'c': {
                        const weekData = (dependable.dateObject)[`${base.days}`][`${standalone}`][(base).monthIndex[`${len}`]];
                        const weekObject = parser.reverseObject(weekData);
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
                            const monthData = (dependable).dateObject[`${month}`][`${standalone}`][(base).monthIndex[`${len}`]];
                            (parseOptions)[`${charKey}`] = parser.reverseObject(monthData);
                            regexString += '(' + Object.keys((parseOptions)[`${charKey}`]).join('|') + ')';
                        }
                        else if (char === 'f') {
                            if (len > 3) {
                                continue;
                            }
                            isNumber = true;
                            regexString += '(' + nRegx + nRegx + '?' + nRegx + '?' + ')';
                        }
                        else {
                            isNumber = true;
                            regexString += '(' + nRegx + nRegx + optional + ')';
                        }
                        if (char === 'h') {
                            parseOptions.hour12 = true;
                        }
                        break;
                    case 'W': {
                        const opt = len === 1 ? '?' : '';
                        regexString += '(' + nRegx + opt + nRegx + ')';
                        break;
                    }
                    case 'y':
                        canUpdate = isNumber = true;
                        if (len === 2) {
                            regexString += '(' + nRegx + nRegx + ')';
                        }
                        else {
                            regexString += '(' + nRegx + '{' + len + ',})';
                        }
                        break;
                    case 'a': {
                        canUpdate = true;
                        const periodValue = getValue('dayPeriods.format.wide', dependable.dateObject);
                        (parseOptions)[`${charKey}`] = parser.reverseObject(periodValue);
                        regexString += '(' + Object.keys((parseOptions)[`${charKey}`]).join('|') + ')';
                        break;
                    }
                    case 'G': {
                        canUpdate = true;
                        const eText = (len <= 3) ? 'eraAbbr' : (len === 4) ? 'eraNames' : 'eraNarrow';
                        (parseOptions)[`${charKey}`] = parser.reverseObject(getValue('eras.' + eText, dependable.dateObject));
                        regexString += '(' + Object.keys((parseOptions)[`${charKey}`]).join('|') + '?)';
                        break;
                    }
                    case 'z': {
                        const tval = new Date().getTimezoneOffset();
                        canUpdate = (tval !== 0);
                        (parseOptions)[`${charKey}`] = getValue('dates.timeZoneNames', dependable.parserObject);
                        const tzone = (parseOptions)[`${charKey}`];
                        hourOnly = (len < 4);
                        let hpattern = hourOnly ? '+H;-H' : tzone.hourFormat;
                        hpattern = hpattern.replace(/:/g, numMapper.timeSeparator);
                        regexString += '(' + parseTimeZoneRegx(hpattern, tzone, nRegx) + ')?';
                        isgmtTraversed = true;
                        zCorrectTemp = hourOnly ? 6 : 12;
                        break;
                    }
                    case '\'': {
                        const iString = str.replace(/'/g, '');
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
                    const regExp = RegExp;
                    parseOptions.parserRegex = new regExp('^' + regexString + '$', 'i');
                }
            }
        }
        return (value) => {
            const parsedDateParts = internalDateParse(value, parseOptions, numOptions);
            if (isNullOrUndefined(parsedDateParts) || !Object.keys(parsedDateParts).length) {
                return null;
            }
            if (parseOptions.isIslamic) {
                let dobj = {};
                let tYear = parsedDateParts.year;
                const tDate = parsedDateParts.day;
                const tMonth = parsedDateParts.month;
                const ystrig = tYear ? (tYear + '') : '';
                const is2DigitYear = (ystrig.length === 2);
                if (!tYear || !tMonth || !tDate || is2DigitYear) {
                    dobj = HijriParser.getHijriDate(new Date());
                }
                if (is2DigitYear) {
                    tYear = parseInt((dobj.year + '').slice(0, 2) + ystrig, 10);
                }
                const dateObject = HijriParser.toGregorian(tYear || dobj.year, tMonth || dobj.month, tDate || dobj.date);
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
    function getDateObject(options, value) {
        const res = value || new Date();
        res.setMilliseconds(0);
        const tKeys = ['hour', 'minute', 'second', 'milliseconds', 'month', 'day'];
        let y = options.year;
        const desig = options.designator;
        const tzone = options.timeZone;
        if (y && !isUndefined(y)) {
            const len = (y + '').length;
            if (len <= 2) {
                const century = Math.floor(res.getFullYear() / 100) * 100;
                y += century;
            }
            res.setFullYear(y);
        }
        for (const key of tKeys) {
            let tValue = (options)[`${key}`];
            if (isUndefined(tValue) && key === 'day') {
                res.setDate(1);
            }
            if (!isUndefined(tValue)) {
                if (key === 'month') {
                    tValue -= 1;
                    if (tValue < 0 || tValue > 11) {
                        return new Date('invalid');
                    }
                    const pDate = res.getDate();
                    res.setDate(1);
                    (res)[(timeSetter)[`${key}`]](tValue);
                    const lDate = new Date(res.getFullYear(), tValue + 1, 0).getDate();
                    res.setDate(pDate < lDate ? pDate : lDate);
                }
                else {
                    if (key === 'day') {
                        const lastDay = new Date(res.getFullYear(), res.getMonth() + 1, 0).getDate();
                        if ((tValue < 1 || tValue > lastDay)) {
                            return null;
                        }
                    }
                    (res)[`${(timeSetter)[`${key}`]}`](tValue);
                }
            }
        }
        if (!isUndefined(desig)) {
            const hour = res.getHours();
            if (desig === 'pm') {
                res.setHours(hour + (hour === 12 ? 0 : 12));
            }
            else if (hour === 12) {
                res.setHours(0);
            }
        }
        if (tzone && !isUndefined(tzone)) {
            const tzValue = tzone - res.getTimezoneOffset();
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
    function internalDateParse(value, parseOptions, num) {
        const matches = value.match(parseOptions.parserRegex);
        const retOptions = { 'hour': 0, 'minute': 0, 'second': 0 };
        if (isNullOrUndefined(matches)) {
            return null;
        }
        else {
            const props = Object.keys(parseOptions.evalposition);
            for (const prop of props) {
                const curObject = parseOptions.evalposition[`${prop}`];
                let matchString = matches[curObject.pos];
                if (curObject.isNumber) {
                    (retOptions)[`${prop}`] = internalNumberParser(matchString, num);
                }
                else {
                    if (prop === 'timeZone' && !isUndefined(matchString)) {
                        const pos = curObject.pos;
                        let val;
                        const tmatch = matches[pos + 1];
                        const flag = !isUndefined(tmatch);
                        if (curObject.hourOnly) {
                            val = getZoneValue(flag, tmatch, matches[pos + 4], num) * 60;
                        }
                        else {
                            val = getZoneValue(flag, tmatch, matches[pos + 7], num) * 60;
                            val += getZoneValue(flag, matches[pos + 4], matches[pos + 10], num);
                        }
                        if (!isNullOrUndefined(val)) {
                            retOptions[`${prop}`] = val;
                        }
                    }
                    else {
                        const cultureOptions = ['en-US', 'en-MH', 'en-MP'];
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
    function internalNumberParser(value, option) {
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
    function parseTimeZoneRegx(hourFormat, tZone, nRegex) {
        const pattern = tZone.gmtFormat;
        let ret;
        const cRegex = '(' + nRegex + ')' + '(' + nRegex + ')';
        ret = hourFormat.replace('+', '\\+');
        if (hourFormat.indexOf('HH') !== -1) {
            ret = ret.replace(/HH|mm/g, '(' + cRegex + ')');
        }
        else {
            ret = ret.replace(/H|m/g, '(' + cRegex + '?)');
        }
        const splitStr = (ret.split(';').map((str) => {
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
    function getZoneValue(flag, val1, val2, num) {
        const ival = flag ? val1 : val2;
        if (!ival) {
            return 0;
        }
        const value = internalNumberParser(ival, num);
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
