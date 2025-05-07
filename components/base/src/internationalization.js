import { DateFormat } from './intl/date-formatter';
import { NumberFormat } from './intl/number-formatter';
import { DateParser } from './intl/date-parser';
import { NumberParser } from './intl/number-parser';
import { IntlBase } from './intl/intl-base';
import { extend, getValue } from './util';
/**
 * Specifies the CLDR data loaded for internationalization functionalities.
 *
 * @private
 */
export const cldrData = {};
/**
 * Specifies the default culture value to be considered.
 *
 * @private
 */
export let defaultCulture = 'en-US';
/**
 * Specifies default currency code to be considered
 *
 * @private
 */
export let defaultCurrencyCode = 'USD';
const mapper = ['numericObject', 'dateObject'];
/**
 * Gets a date formatter function for specified culture and format options
 *
 * @param {string} culture - The culture code (e.g. 'en-US')
 * @param {DateFormatOptions} props - Date formatting options
 * @returns {Function} Formatter function that accepts Date objects
 */
export function getDateFormat(culture, props) {
    return DateFormat.dateFormat(culture, props || { type: 'date', skeleton: 'short' }, cldrData);
}
/**
 * Gets a number formatter function for specified culture and format options
 *
 * @param {string} culture - The culture code (e.g. 'en-US')
 * @param {NumberFormatOptions} props - Number formatting options
 * @returns {Function} Formatter function that accepts numeric values
 */
export function getNumberFormat(culture, props) {
    if (props && !props.currency) {
        props.currency = defaultCurrencyCode;
    }
    return NumberFormat.numberFormatter(culture, props || {}, cldrData);
}
/**
 * Returns the parser function for given props.
 *
 * @param {string} culture - The culture code (e.g. 'en-US')
 * @param {DateFormatOptions} props - Specifies the format props in which the parser function will return.
 * @returns {Function} The date parser function.
 */
export function getDateParser(culture, props) {
    return DateParser.dateParser(culture, props || { skeleton: 'short', type: 'date' }, cldrData);
}
/**
 * Returns the parser function for given props.
 *
 * @param {string} culture - The culture code (e.g. 'en-US')
 * @param {NumberFormatOptions} props - Specifies the format props in which the parser function will return.
 * @returns {Function} The number parser function.
 */
export function getNumberParser(culture, props) {
    return NumberParser.numberParser(culture, props || { format: 'N' }, cldrData);
}
/**
 * Returns the formatted string based on format props.
 *
 * @param {string} culture - The culture code (e.g. 'en-US')
 * @param {number} value - Specifies the number to format.
 * @param {NumberFormatOptions} option - Specifies the format props in which the number will be formatted.
 * @returns {string} The formatted number string.
 */
export function formatNumber(culture, value, option) {
    return getNumberFormat(culture, option)(value) || value;
}
/**
 * Returns the formatted date string based on format props.
 *
 * @param {string} culture - The culture code (e.g. 'en-US').
 * @param {Date} value - Specifies the number to format.
 * @param {DateFormatOptions} option - Specifies the format props in which the number will be formatted.
 * @returns {string} The formatted date string.
 */
export function formatDate(culture, value, option) {
    return getDateFormat(culture, option)(value);
}
/**
 * Returns the date object for given date string and props.
 *
 * @param {string} culture - The culture code (e.g. 'en-US').
 * @param {string} value - Specifies the string to parse.
 * @param {DateFormatOptions} option - Specifies the parse props in which the date string will be parsed.
 * @returns {Date} The parsed Date object.
 */
export function parseDate(culture, value, option) {
    return getDateParser(culture, option)(value);
}
/**
 * Returns the number object from the given string value and props.
 *
 * @param {string} culture - The culture code (e.g. 'en-US').
 * @param {string} value - Specifies the string to parse.
 * @param {NumberFormatOptions} option - Specifies the parse props in which the string number will be parsed.
 * @returns {number} The parsed number.
 */
export function parseNumber(culture, value, option) {
    return getNumberParser(culture, option)(value);
}
/**
 * Returns Native Date Time Pattern
 *
 * @param {string} culture - The culture code (e.g. 'en-US').
 * @param {DateFormatOptions} option - Specifies the parse props for resultant date time pattern.
 * @param {boolean} isExcelFormat - Specifies format value to be converted to excel pattern.
 * @returns {string} The native date time pattern.
 * @private
 */
export function getDatePattern(culture, option, isExcelFormat) {
    return IntlBase.getActualDateTimeFormat(culture, option, cldrData, isExcelFormat);
}
/**
 * Returns Native Number Pattern
 *
 * @param {string} culture - The culture code (e.g. 'en-US').
 * @param {NumberFormatOptions} option - Specifies the parse props for resultant number pattern.
 * @param {boolean} isExcel - Specifies whether to return Excel format.
 * @returns {string} The native number pattern.
 * @private
 */
export function getNumberPattern(culture, option, isExcel) {
    return IntlBase.getActualNumberFormat(culture, option, cldrData, isExcel);
}
/**
 * Returns the First Day of the Week
 *
 * @param {string} culture - The culture code (e.g. 'en-US').
 * @returns {number} The first day of the week.
 */
export function getFirstDayOfWeek(culture) {
    return IntlBase.getWeekData(culture, cldrData);
}
/**
 * Set the default culture to all components
 *
 * @private
 * @param {string} cultureName - Specifies the culture name to be set as default culture.
 * @returns {void}
 */
export function setCulture(cultureName) {
    defaultCulture = cultureName;
}
/**
 * Set the default currency code to all components
 *
 * @private
 * @param {string} currencyCode - Specifies the currency code to be set as default currency.
 * @returns {void}
 */
export function setCurrencyCode(currencyCode) {
    defaultCurrencyCode = currencyCode;
}
/**
 * Load the CLDR data into context
 *
 * @param {Object[]} data - Specifies the CLDR data's to be used for formatting and parser.
 * @returns {void}
 */
export function loadCldr(...data) {
    for (const obj of data) {
        extend(cldrData, obj, {}, true);
    }
}
/**
 * To get the numeric CLDR object for given culture
 *
 * @private
 * @param {string} locale - Specifies the locale for which numericObject to be returned.
 * @param {string} type - Specifies the type, by default it's decimal.
 * @returns {Object} Returns the numeric CLDR object containing number formatting patterns and symbols
 */
export function getNumericObject(locale, type) {
    const numObject = IntlBase.getDependables(cldrData, locale, '', true)[mapper[0]];
    const dateObject = IntlBase.getDependables(cldrData, locale, '')[mapper[1]];
    const numSystem = getValue('defaultNumberingSystem', numObject);
    const symbPattern = getValue('symbols-numberSystem-' + numSystem, numObject);
    const pattern = IntlBase.getSymbolPattern(type || 'decimal', numSystem, numObject, false);
    return extend(symbPattern, IntlBase.getFormatData(pattern, true, '', true), { 'dateSeparator': IntlBase.getDateSeparator(dateObject) });
}
/**
 * To get the numeric CLDR number base object for given culture
 *
 * @private
 * @param {string} locale - Specifies the locale for which numericObject to be returned.
 * @param {string} currency - Specifies the currency for which numericObject to be returned.
 * @returns {string} Returns the currency symbol for the specified locale and currency
 */
export function getNumberDependable(locale, currency) {
    const numObject = IntlBase.getDependables(cldrData, locale, '', true);
    return IntlBase.getCurrencySymbol(numObject['numericObject'], currency);
}
/**
 * To get the default date CLDR object.
 *
 * @private
 * @param {string} mode - Specify the mode, optional.
 * @returns {Object} Returns the default date CLDR object containing date formatting patterns
 */
export function getDefaultDateObject(mode) {
    return IntlBase.getDependables(cldrData, '', mode, false)[mapper[1]];
}
