import { NumberFormatOptions } from '../internationalization';
import { NumericSkeleton } from './intl-base';
import { NumberMapper } from './parser-base';
/**
 * Interface for default formatting options.
 *
 * @private
 */
export interface FormatParts extends NumericSkeleton, NumberFormatOptions {
    groupOne?: boolean;
    isPercent?: boolean;
    isCurrency?: boolean;
    isNegative?: boolean;
    groupData?: GroupDetails;
    groupSeparator?: string;
}
/**
 * Interface for common formatting options.
 */
export interface CommonOptions {
    numberMapper?: NumberMapper;
    currencySymbol?: string;
    percentSymbol?: string;
    minusSymbol?: string;
    isCustomFormat?: boolean;
}
/**
 * Interface for currency processing.
 */
export interface CurrencyOptions {
    position?: string;
    symbol?: string;
    currencySpace?: boolean;
}
/**
 * Interface for grouping process.
 */
export interface GroupDetails {
    primary?: number;
    secondary?: number;
}
/**
 * Interface for public and protected properties/methods of NumberFormatObject.
 */
export interface INumberFormat {
    /**
     * Returns the formatter function for given skeleton.
     *
     * @private
     * @param {string} culture -  Specifies the culture name to be used for formatting.
     * @param {NumberFormatOptions} option - Specifies the format in which number will be formatted.
     * @param {Object} cldr - Specifies the global cldr data collection.
     * @returns {Function}
     */
    numberFormatter: (culture: string, option: NumberFormatOptions, cldr: Object) => Function;
    /**
     * Returns grouping details for the pattern provided.
     *
     * @private
     * @param {string} pattern
     * @returns {GroupDetails}
     */
    getGroupingDetails: (pattern: string) => GroupDetails;
}
/**
 * Custom object structure for NumberFormat with all methods and properties.
 */
export declare const NumberFormat: INumberFormat;
