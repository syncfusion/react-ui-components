import { DateFormat } from './intl/date-formatter';
import { NumberFormat } from './intl/number-formatter';
import { DateParser } from './intl/date-parser';
import { NumberParser } from './intl/number-parser';
import { IntlBase } from './intl/intl-base';
import { extend, getValue } from './util';

/**
 * Interface for DateFormatOptions
 */
export interface DateFormatOptions {
    /**
     * Specifies the skeleton for date formatting.
     */
    skeleton?: string;
    /**
     * Specifies the type of date formatting either date, dateTime or time.
     */
    type?: string;
    /**
     * Specifies custom date formatting to be used.
     */
    format?: string;
    /**
     * Specifies the calendar mode other than gregorian
     */
    calendar?: string;
    /**
     * Enable server side date formating.
     */
    isServerRendered?: boolean;
    /**
     * Determines the locale of the date formatting.
     */
    locale?: string
}

/**
 * Interface for numberFormatOptions
 */
export interface NumberFormatOptions {
    /**
     * Specifies minimum fraction digits in formatted value.
     */
    minimumFractionDigits?: number;
    /**
     * Specifies maximum fraction digits in formatted value.
     */
    maximumFractionDigits?: number;
    /**
     * Specifies minimum significant digits in formatted value.
     */
    minimumSignificantDigits?: number;
    /**
     * Specifies maximum significant digits in formatted value.
     */
    maximumSignificantDigits?: number;
    /**
     * Specifies whether to use grouping or not in formatted value,
     */
    useGrouping?: boolean;
    /**
     * Specifies whether to ignore currency symbol in formatted value,
     */
    ignoreCurrency?: boolean;
    /**
     * Specifies the skeleton for perform formatting.
     */
    skeleton?: string;
    /**
     * Specifies the currency code to be used for formatting.
     */
    currency?: string | null;
    /**
     * Specifies minimum integer digits in formatted value.
     */
    minimumIntegerDigits?: number;
    /**
     * Specifies custom number format for formatting.
     */
    format?: string;
    /**
     *  Species which currency symbol to consider.
     */
    altSymbol?: string;
    /**
     * Determines the locale of the number formatting.
     */
    locale?: string
}


/**
 * Specifies the CLDR data loaded for internationalization functionalities.
 *
 * @private
 */
export const cldrData: Object = {};

/**
 * Specifies the default culture value to be considered.
 *
 * @private
 */
export let defaultCulture: string = 'en-US';

/**
 * Specifies default currency code to be considered
 *
 * @private
 */
export let defaultCurrencyCode: string = 'USD';

const mapper: string[] = ['numericObject', 'dateObject'];

/**
 * Gets a date formatter function for specified culture and format options
 *
 * @param {DateFormatOptions} props - Date formatting options
 * @returns {Function} Formatter function that accepts Date objects
 */
export function getDateFormat(props?: DateFormatOptions): Function {
    return DateFormat.dateFormat(props?.locale || defaultCulture, props || { type: 'date', skeleton: 'short' }, cldrData);
}

/**
 * Gets a number formatter function for specified culture and format options
 *
 * @param {NumberFormatOptions} props - Number formatting options
 * @returns {Function} Formatter function that accepts numeric values
 */
export function getNumberFormat(props?: NumberFormatOptions): Function {
    if (props && !props.currency) {
        props.currency = defaultCurrencyCode;
    }
    return NumberFormat.numberFormatter(props?.locale || defaultCulture, props || {}, cldrData);
}

/**
 * Returns the parser function for given props.
 *
 * @param {DateFormatOptions} props - Specifies the format props in which the parser function will return.
 * @returns {Function} The date parser function.
 */
export function getDateParser(props?: DateFormatOptions): Function {
    return DateParser.dateParser(props?.locale || defaultCulture, props || { skeleton: 'short', type: 'date' }, cldrData);
}

/**
 * Returns the parser function for given props.
 *
 * @param {NumberFormatOptions} props - Specifies the format props in which the parser function will return.
 * @returns {Function} The number parser function.
 */
export function getNumberParser(props?: NumberFormatOptions): Function {
    return NumberParser.numberParser(props?.locale || defaultCulture, props || { format: 'N' }, cldrData);
}

/**
 * Returns the formatted string based on format props.
 *
 * @param {number} value - Specifies the number to format.
 * @param {NumberFormatOptions} option - Specifies the format props in which the number will be formatted.
 * @returns {string} The formatted number string.
 */
export function formatNumber(value: number, option?: NumberFormatOptions): string {
    return getNumberFormat(option)(value) || value;
}

/**
 * Returns the formatted date string based on format props.
 *
 * @param {Date} value - Specifies the number to format.
 * @param {DateFormatOptions} option - Specifies the format props in which the number will be formatted.
 * @returns {string} The formatted date string.
 */
export function formatDate(value: Date, option?: DateFormatOptions): string {
    return getDateFormat(option)(value);
}

/**
 * Returns the date object for given date string and props.
 *
 * @param {string} value - Specifies the string to parse.
 * @param {DateFormatOptions} option - Specifies the parse props in which the date string will be parsed.
 * @returns {Date} The parsed Date object.
 */
export function parseDate(value: string, option?: DateFormatOptions): Date {
    return getDateParser(option)(value);
}

/**
 * Returns the number object from the given string value and props.
 *
 * @param {string} value - Specifies the string to parse.
 * @param {NumberFormatOptions} option - Specifies the parse props in which the string number will be parsed.
 * @returns {number} The parsed number.
 */
export function parseNumber(value: string, option?: NumberFormatOptions): number {
    return getNumberParser(option)(value);
}

/**
 * Returns Native Date Time Pattern
 *
 * @param {DateFormatOptions} option - Specifies the parse props for resultant date time pattern.
 * @param {boolean} isExcelFormat - Specifies format value to be converted to excel pattern.
 * @returns {string} The native date time pattern.
 * @private
 */
export function getDatePattern(option: DateFormatOptions, isExcelFormat?: boolean): string {
    return IntlBase.getActualDateTimeFormat(option?.locale || defaultCulture, option, cldrData, isExcelFormat);
}

/**
 * Returns Native Number Pattern
 *
 * @param {NumberFormatOptions} option - Specifies the parse props for resultant number pattern.
 * @param {boolean} isExcel - Specifies whether to return Excel format.
 * @returns {string} The native number pattern.
 * @private
 */
export function getNumberPattern(option: NumberFormatOptions, isExcel?: boolean): string {
    return IntlBase.getActualNumberFormat(option?.locale || defaultCulture, option, cldrData, isExcel);
}

/**
 * Returns the First Day of the Week
 *
 * @param {string} culture - The culture code (e.g. 'en-US').
 * @returns {number} The first day of the week.
 */
export function getFirstDayOfWeek(culture: string): number {
    return IntlBase.getWeekData(culture, cldrData);
}
/**
 * Set the default culture to all components
 *
 * @private
 * @param {string} cultureName - Specifies the culture name to be set as default culture.
 * @returns {void}
 */
export function setCulture(cultureName: string): void {
    defaultCulture = cultureName;
}

/**
 * Set the default currency code to all components
 *
 * @private
 * @param {string} currencyCode - Specifies the currency code to be set as default currency.
 * @returns {void}
 */
export function setCurrencyCode(currencyCode: string): void {
    defaultCurrencyCode = currencyCode;
}

/**
 * Load the CLDR data into context
 *
 * @param {Object[]} data - Specifies the CLDR data's to be used for formatting and parser.
 * @returns {void}
 */
export function loadCldr(...data: Object[]): void {
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
export function getNumericObject(locale: string, type?: string): Object {
    const numObject: Object = IntlBase.getDependables(cldrData, locale, '', true)[mapper[0]];
    const dateObject: Object = IntlBase.getDependables(cldrData, locale, '')[mapper[1]];
    const numSystem: string = getValue('defaultNumberingSystem', numObject);
    const symbPattern: Record<string, unknown> = getValue('symbols-numberSystem-' + numSystem, numObject);
    const pattern: string = IntlBase.getSymbolPattern(type || 'decimal', numSystem, numObject, false);
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
export function getNumberDependable(locale: string, currency: string): string {
    const numObject: Object = IntlBase.getDependables(cldrData, locale, '', true);
    return IntlBase.getCurrencySymbol(numObject['numericObject'], currency);
}

/**
 * To get the default date CLDR object.
 *
 * @private
 * @param {string} mode - Specify the mode, optional.
 * @returns {Object} Returns the default date CLDR object containing date formatting patterns
 */
export function getDefaultDateObject(mode?: string): Object {
    return IntlBase.getDependables(cldrData, '', mode, false)[mapper[1]];
}
