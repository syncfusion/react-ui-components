import { NumberFormatOptions } from '../internationalization';
import { extend, isNullOrUndefined } from '../util';
import { ParserBase as parser, NumericOptions } from './parser-base';
import { IntlBase as base, NegativeData, Dependables } from './intl-base';

const regExp: RegExpConstructor = RegExp;
const parseRegex: RegExp = new regExp('^([^0-9]*)' + '(([0-9,]*[0-9]+)(.[0-9]+)?)' + '([Ee][+-]?[0-9]+)?([^0-9]*)$');
const groupRegex: RegExp = /,/g;

const keys: string[] = ['minusSign', 'infinity'];

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
export const NumberParser: INumberParser = (() => {
    /**
     * Parses a number string based on the given options and CLDR data.
     *
     * @param {string} culture - Specifies the culture name to be used for formatting.
     * @param {NumberFormatOptions} option - Specifies the format options.
     * @param {Object} cldr - Specifies the global CLDR data collection.
     * @returns {Function} - Returns a function to parse the given string to a number.
     */
    function numberParser(culture: string, option: NumberFormatOptions, cldr: Object): ((value: string) => number) {
        const dependable: Dependables = base.getDependables(cldr, culture, '', true);
        const parseOptions: NumericParts = { custom: true };
        if ((base.formatRegex.test(option.format)) || !(option.format)) {
            extend(parseOptions, base.getProperNumericSkeleton(option.format || 'N'));
            parseOptions.custom = false;
            if (!parseOptions.fractionDigits) {
                if (option.maximumFractionDigits) {
                    parseOptions.maximumFractionDigits = option.maximumFractionDigits;
                }
            }
        } else {
            extend(parseOptions, base.customFormat(option.format, null, null));
        }
        const numOptions: NumericOptions = parser.getCurrentNumericOptions(dependable.parserObject, parser.getNumberingSystem(cldr), true);
        parseOptions.symbolRegex = parser.getSymbolRegex(Object.keys(numOptions.symbolMatch));
        parseOptions.infinity = (numOptions).symbolNumberSystem[keys[1]];
        let symbolpattern: string;
        symbolpattern = base.getSymbolPattern(parseOptions.type, numOptions.numberSystem, dependable.numericObject, parseOptions.isAccount);
        if (symbolpattern) {
            symbolpattern = symbolpattern.replace(/\u00A4/g, base.defaultCurrency);
            const split: string[] = symbolpattern.split(';');
            parseOptions.nData = base.getFormatData(split[1] || '-' + split[0], true, '');
            parseOptions.pData = base.getFormatData(split[0], true, '');
        }
        return (value: string): number => {
            return getParsedNumber(value, parseOptions, numOptions);
        };
    }
    /**
     * Returns parsed number for the provided formatting options.
     *
     * @param {string} value - The string value to be converted to number.
     * @param {NumericParts} options - The numeric parts required for parsing.
     * @param {NumericOptions} numOptions - Options for numeric conversion.
     * @returns {number} - The parsed numeric value.
     */
    function getParsedNumber(value: string, options: NumericParts, numOptions: NumericOptions): number {
        let isNegative: boolean;
        let isPercent: boolean;
        let tempValue: string;
        let lead: string;
        let end: string;
        let ret: number;

        if (value.indexOf(options.infinity) !== -1) {
            return Infinity;
        } else {
            value = parser.convertValueParts(value, options.symbolRegex, numOptions.symbolMatch);
            value = parser.convertValueParts(value, numOptions.numberParseRegex, numOptions.numericPair);
            value = value.indexOf('-') !== -1 ? value.replace('-.', '-0.') : value;
            if (value.indexOf('.') === 0) {
                value = '0' + value;
            }
            const matches: string[] = value.match(parseRegex);
            if (isNullOrUndefined(matches)) {
                return NaN;
            }
            lead = matches[1];
            tempValue = matches[2];
            const exponent: string = matches[5];
            end = matches[6];
            isNegative = options.custom ? (lead === options.nData.nlead && end === options.nData.nend) :
                (lead.indexOf(options.nData.nlead) !== -1 && end.indexOf(options.nData.nend) !== -1);
            isPercent = isNegative ? options.nData.isPercent : options.pData.isPercent;
            tempValue = tempValue.replace(groupRegex, '');
            if (exponent) {
                tempValue += exponent;
            }
            ret = +tempValue;
            if (options.type === 'percent' || isPercent) {
                ret = ret / 100;
            }
            if (options.custom || options.fractionDigits) {
                ret = parseFloat(ret.toFixed(options.custom ?
                    (isNegative ? options.nData.maximumFractionDigits : options.pData.maximumFractionDigits) : options.fractionDigits));
            }
            if (options.maximumFractionDigits) {
                ret = convertMaxFracDigits(tempValue, options, ret, isNegative);
            }
            if (isNegative) {
                ret *= -1;
            }
            return ret;
        }
    }

    /**
     * Adjusts the number according to the maximum fraction digits allowed.
     *
     * @param {string} value - The string value of the number before parsing.
     * @param {NumericParts} options - Parsing options with numeric parts.
     * @param {number} ret - The current numeric value.
     * @param {boolean} isNegative - Flag if the number is negative.
     * @returns {number} - The processed number with appropriate fraction digits.
     */
    function convertMaxFracDigits(value: string, options: NumericParts, ret: number, isNegative: boolean): number {
        const decimalSplitValue: string[] = value.split('.');
        if (decimalSplitValue[1] && decimalSplitValue[1].length > options.maximumFractionDigits) {
            ret = +(ret.toFixed(options.custom ?
                (isNegative ? options.nData.maximumFractionDigits : options.pData.maximumFractionDigits) : options.maximumFractionDigits));
        }
        return ret;
    }

    return {
        numberParser
    };
})();
