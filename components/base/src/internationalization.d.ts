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
}
/**
 * Specifies the CLDR data loaded for internationalization functionalities.
 *
 * @private
 */
export declare const cldrData: Object;
/**
 * Specifies the default culture value to be considered.
 *
 * @private
 */
export declare let defaultCulture: string;
/**
 * Specifies default currency code to be considered
 *
 * @private
 */
export declare let defaultCurrencyCode: string;
/**
 * Gets a date formatter function for specified culture and format options
 *
 * @param {string} culture - The culture code (e.g. 'en-US')
 * @param {DateFormatOptions} props - Date formatting options
 * @returns {Function} Formatter function that accepts Date objects
 */
export declare function getDateFormat(culture: string, props?: DateFormatOptions): Function;
/**
 * Gets a number formatter function for specified culture and format options
 *
 * @param {string} culture - The culture code (e.g. 'en-US')
 * @param {NumberFormatOptions} props - Number formatting options
 * @returns {Function} Formatter function that accepts numeric values
 */
export declare function getNumberFormat(culture: string, props?: NumberFormatOptions): Function;
/**
 * Returns the parser function for given props.
 *
 * @param {string} culture - The culture code (e.g. 'en-US')
 * @param {DateFormatOptions} props - Specifies the format props in which the parser function will return.
 * @returns {Function} The date parser function.
 */
export declare function getDateParser(culture: string, props?: DateFormatOptions): Function;
/**
 * Returns the parser function for given props.
 *
 * @param {string} culture - The culture code (e.g. 'en-US')
 * @param {NumberFormatOptions} props - Specifies the format props in which the parser function will return.
 * @returns {Function} The number parser function.
 */
export declare function getNumberParser(culture: string, props?: NumberFormatOptions): Function;
/**
 * Returns the formatted string based on format props.
 *
 * @param {string} culture - The culture code (e.g. 'en-US')
 * @param {number} value - Specifies the number to format.
 * @param {NumberFormatOptions} option - Specifies the format props in which the number will be formatted.
 * @returns {string} The formatted number string.
 */
export declare function formatNumber(culture: string, value: number, option?: NumberFormatOptions): string;
/**
 * Returns the formatted date string based on format props.
 *
 * @param {string} culture - The culture code (e.g. 'en-US').
 * @param {Date} value - Specifies the number to format.
 * @param {DateFormatOptions} option - Specifies the format props in which the number will be formatted.
 * @returns {string} The formatted date string.
 */
export declare function formatDate(culture: string, value: Date, option?: DateFormatOptions): string;
/**
 * Returns the date object for given date string and props.
 *
 * @param {string} culture - The culture code (e.g. 'en-US').
 * @param {string} value - Specifies the string to parse.
 * @param {DateFormatOptions} option - Specifies the parse props in which the date string will be parsed.
 * @returns {Date} The parsed Date object.
 */
export declare function parseDate(culture: string, value: string, option?: DateFormatOptions): Date;
/**
 * Returns the number object from the given string value and props.
 *
 * @param {string} culture - The culture code (e.g. 'en-US').
 * @param {string} value - Specifies the string to parse.
 * @param {NumberFormatOptions} option - Specifies the parse props in which the string number will be parsed.
 * @returns {number} The parsed number.
 */
export declare function parseNumber(culture: string, value: string, option?: NumberFormatOptions): number;
/**
 * Returns Native Date Time Pattern
 *
 * @param {string} culture - The culture code (e.g. 'en-US').
 * @param {DateFormatOptions} option - Specifies the parse props for resultant date time pattern.
 * @param {boolean} isExcelFormat - Specifies format value to be converted to excel pattern.
 * @returns {string} The native date time pattern.
 * @private
 */
export declare function getDatePattern(culture: string, option: DateFormatOptions, isExcelFormat?: boolean): string;
/**
 * Returns Native Number Pattern
 *
 * @param {string} culture - The culture code (e.g. 'en-US').
 * @param {NumberFormatOptions} option - Specifies the parse props for resultant number pattern.
 * @param {boolean} isExcel - Specifies whether to return Excel format.
 * @returns {string} The native number pattern.
 * @private
 */
export declare function getNumberPattern(culture: string, option: NumberFormatOptions, isExcel?: boolean): string;
/**
 * Returns the First Day of the Week
 *
 * @param {string} culture - The culture code (e.g. 'en-US').
 * @returns {number} The first day of the week.
 */
export declare function getFirstDayOfWeek(culture: string): number;
/**
 * Set the default culture to all components
 *
 * @private
 * @param {string} cultureName - Specifies the culture name to be set as default culture.
 * @returns {void}
 */
export declare function setCulture(cultureName: string): void;
/**
 * Set the default currency code to all components
 *
 * @private
 * @param {string} currencyCode - Specifies the currency code to be set as default currency.
 * @returns {void}
 */
export declare function setCurrencyCode(currencyCode: string): void;
/**
 * Load the CLDR data into context
 *
 * @param {Object[]} data - Specifies the CLDR data's to be used for formatting and parser.
 * @returns {void}
 */
export declare function loadCldr(...data: Object[]): void;
/**
 * To get the numeric CLDR object for given culture
 *
 * @private
 * @param {string} locale - Specifies the locale for which numericObject to be returned.
 * @param {string} type - Specifies the type, by default it's decimal.
 * @returns {Object} Returns the numeric CLDR object containing number formatting patterns and symbols
 */
export declare function getNumericObject(locale: string, type?: string): Object;
/**
 * To get the numeric CLDR number base object for given culture
 *
 * @private
 * @param {string} locale - Specifies the locale for which numericObject to be returned.
 * @param {string} currency - Specifies the currency for which numericObject to be returned.
 * @returns {string} Returns the currency symbol for the specified locale and currency
 */
export declare function getNumberDependable(locale: string, currency: string): string;
/**
 * To get the default date CLDR object.
 *
 * @private
 * @param {string} mode - Specify the mode, optional.
 * @returns {Object} Returns the default date CLDR object containing date formatting patterns
 */
export declare function getDefaultDateObject(mode?: string): Object;
