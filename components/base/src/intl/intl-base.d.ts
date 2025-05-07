import { NumberFormatOptions, DateFormatOptions } from '../internationalization';
import { FormatParts, CommonOptions } from './number-formatter';
/**
 * Interface for NumericSkeleton structure
 */
export interface NumericSkeleton {
    type?: string;
    isAccount?: boolean;
    fractionDigits?: number;
}
/**
 * Interface for GenericFormatOptions structure
 */
export interface GenericFormatOptions {
    nData?: NegativeData;
    pData?: NegativeData;
    zeroData?: NegativeData;
}
/**
 * Interface for GroupSize structure
 */
export interface GroupSize {
    primary?: number;
    secondary?: number;
}
/**
 * Interface for NegativeData structure
 *
 * @private
 */
export interface NegativeData extends FormatParts {
    nlead?: string;
    nend?: string;
    groupPattern?: string;
    minimumFraction?: number;
    maximumFraction?: number;
}
/**
 * Interface for Dependables structure
 */
export interface Dependables {
    parserObject?: Object;
    dateObject?: Object;
    numericObject?: Object;
}
/**
 * Interface for TimeZoneOptions structure
 */
export interface TimeZoneOptions {
    hourFormat?: string;
    gmtFormat?: string;
    gmtZeroFormat?: string;
}
/**
 * Interface for DateObject structure
 */
export interface DateObject {
    year?: number;
    month?: number;
    date?: number;
}
/**
 * Interface defining the exported properties and methods in the IntlBase namespace.
 */
export interface IIntlBase {
    negativeDataRegex?: RegExp;
    customRegex?: RegExp;
    latnParseRegex?: RegExp;
    fractionRegex?: RegExp;
    defaultCurrency?: string;
    mapper?: string[];
    dateConverterMapper?: RegExp;
    islamicRegex?: RegExp;
    formatRegex?: RegExp;
    currencyFormatRegex?: RegExp;
    curWithoutNumberRegex?: RegExp;
    dateParseRegex?: RegExp;
    basicPatterns?: string[];
    defaultObject?: Object;
    monthIndex?: Object;
    month?: string;
    days?: string;
    patternMatcher?: {
        [key: string]: string;
    };
    /**
     * Computes the resultant date pattern.
     *
     * @private
     * @param skeleton - Pattern skeleton.
     * @param dateObject - Date-related object mapping.
     * @param type - Format type.
     * @param isIslamic - Islamic mode flag.
     * @returns {string} The resultant pattern.
     */
    getResultantPattern?(skeleton: string, dateObject: Object, type: string, isIslamic?: boolean): string;
    /**
     * Retrieves dependables based on the CLDR data.
     *
     * @private
     * @param cldr - CLDR object data.
     * @param culture - Culture code.
     * @param mode - Calendar mode.
     * @param isNumber - Flag indicating number operations.
     * @returns {Dependables} Dependable objects.
     */
    getDependables?(cldr: Object, culture: string, mode: string, isNumber?: boolean): Dependables;
    /**
     * Fetches the symbol pattern for given parameters.
     *
     * @private
     * @param type - Format type.
     * @param numSystem - Number system.
     * @param obj - Formatting object.
     * @param isAccount - Account mode flag.
     * @returns {string} Symbol pattern.
     */
    getSymbolPattern?(type: string, numSystem: string, obj: Object, isAccount: boolean): string;
    /**
     * Determines the proper numeric skeleton.
     *
     * @private
     * @param skeleton - Skeleton string.
     * @returns {NumericSkeleton} Numeric skeleton details.
     */
    getProperNumericSkeleton?(skeleton: string): NumericSkeleton;
    /**
     * Fetches format data for numbers.
     *
     * @private
     * @param pattern - Number pattern.
     * @param needFraction - Fraction requirement flag.
     * @param cSymbol - Currency symbol.
     * @param fractionOnly - Fraction data flag.
     * @returns {NegativeData} Number format details.
     */
    getFormatData?(pattern: string, needFraction: boolean, cSymbol: string, fractionOnly?: boolean): NegativeData;
    /**
     * Changes the currency symbol in a given string.
     *
     * @private
     * @param val - The value containing the currency symbol.
     * @param sym - The new currency symbol.
     * @returns {string} The value with the currency symbol replaced.
     */
    changeCurrencySymbol?(val: string, sym: string): string;
    /**
     * Retrieves the currency symbol based on the currency code.
     *
     * @private
     * @param numericObject - The numeric object containing currency details.
     * @param currencyCode - The currency code.
     * @param altSymbol - Alternate symbol if applicable.
     * @param ignoreCurrency - Flag to ignore currency in lookup.
     * @returns {string} The currency symbol.
     */
    getCurrencySymbol?(numericObject: Object, currencyCode: string, altSymbol?: string, ignoreCurrency?: boolean): string;
    /**
     * Returns custom number format options.
     *
     * @private
     * @param format - The custom format string.
     * @param dOptions - Common options for number formatting.
     * @param obj - Dependable object.
     * @returns {GenericFormatOptions} Custom number format options.
     */
    customFormat?(format: string, dOptions: CommonOptions, obj: Dependables): GenericFormatOptions;
    /**
     * Defines custom number format details.
     *
     * @private
     * @param format - Format string.
     * @param dOptions - Common options.
     * @param numObject - Numeric object.
     * @returns {NegativeData} Custom number formats.
     */
    customNumberFormat?(format: string, dOptions?: CommonOptions, numObject?: Object): NegativeData;
    /**
     * Determines if a format is currency or percent type.
     *
     * @private
     * @param parts - The parts of the format string.
     * @param actual - The actual identifier.
     * @param symbol - The symbol used.
     * @returns {NegativeData} Formatting options.
     */
    isCurrencyPercent?(parts: string[], actual: string, symbol: string): NegativeData;
    /**
     * Retrieves date separator for a given date object.
     *
     * @private
     * @param dateObj - The date configuration object.
     * @returns {string} Date separator.
     */
    getDateSeparator?(dateObj: Object): string;
    /**
     * Obtains the native date time format based on given options.
     *
     * @private
     * @param culture - Cultural context.
     * @param options - Date format settings.
     * @param cldr - CLDR object.
     * @param isExcelFormat - Flag for formatting in Excel.
     * @returns {string} Compiled date time pattern.
     */
    getActualDateTimeFormat?(culture: string, options: DateFormatOptions, cldr?: Object, isExcelFormat?: boolean): string;
    /**
     * Processes symbols within a format string.
     *
     * @private
     * @param actual - Original pattern string.
     * @param option - Formatting options.
     * @returns {string} Processed pattern.
     */
    processSymbol?(actual: string, option: CommonOptions): string;
    /**
     * Returns number format pattern for a culture.
     *
     * @private
     * @param culture - Cultural context.
     * @param options - Number format configurations.
     * @param cldr - CLDR object.
     * @param isExcel - Excel integration flag.
     * @returns {string} Numeric pattern.
     */
    getActualNumberFormat?(culture: string, options: NumberFormatOptions, cldr?: Object, isExcel?: boolean): string;
    /**
     * Constructs pattern for fraction digits.
     *
     * @private
     * @param minDigits - Minimum digits required.
     * @param maxDigits - Maximum available digits.
     * @returns {string} Pattern string with fraction digits.
     */
    fractionDigitsPattern?(pattern: string, minDigits: number, maxDigits?: number): string;
    /**
     * Constructs pattern for integer digits.
     *
     * @private
     * @param pattern - Base pattern.
     * @param digits - Integer digit enforcement count.
     * @returns {string} The pattern with integer digits.
     */
    minimumIntegerPattern?(pattern: string, digits: number): string;
    /**
     * Generates pattern to represent numeric grouping.
     *
     * @private
     * @param pattern - Base numeric pattern.
     * @returns {string} Group-patterned string.
     */
    groupingPattern?(pattern: string): string;
    /**
     * Returns first day of the week for the given culture.
     *
     * @private
     * @param culture - Cultural context.
     * @param cldr - CLDR data.
     * @returns {number} The index number of the first day.
     */
    getWeekData?(culture: string, cldr?: Object): number;
    /**
     * Calculates the week number of the year for a given date.
     *
     * @private
     * @param date - The date to calculate the week number for.
     * @returns {number} The week number in the year.
     */
    getWeekOfYear?(date: Date): number;
}
/**
 * Collection of methods and constants related to internationalization, date and number formatting.
 */
export declare const IntlBase: IIntlBase;
