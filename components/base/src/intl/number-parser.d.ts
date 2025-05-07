import { NumberFormatOptions } from '../internationalization';
import { NegativeData } from './intl-base';
/**
 * Interface for Numeric Formatting Parts
 */
export interface NumericParts {
    symbolRegex?: RegExp;
    nData?: NegativeData;
    pData?: NegativeData;
    infinity?: string;
    type?: string;
    fractionDigits?: number;
    isAccount?: boolean;
    custom?: boolean;
    maximumFractionDigits?: number;
}
/**
 * Interface for numeric parse options
 */
export interface NumberParseOptions {
    parseRegex: string;
    numbericMatcher: Object;
}
/**
 * Interface defining the properties and methods of the useNumberParser hook.
 */
export interface INumberParser {
    numberParser: (culture: string, option: NumberFormatOptions, cldr: Object) => (value: string) => number;
}
/**
 * Custom function to parse numbers according to specified format and culture.
 */
export declare const NumberParser: INumberParser;
