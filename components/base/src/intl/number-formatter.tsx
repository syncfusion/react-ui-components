import { isUndefined, throwError, isNullOrUndefined, extend } from '../util';
import { NumberFormatOptions, defaultCurrencyCode } from '../internationalization';
import { IntlBase as base, NegativeData, GenericFormatOptions, NumericSkeleton, Dependables } from './intl-base';
import { ParserBase as parser, NumberMapper } from './parser-base';

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
 * Error text mappings for significant and fraction digits.
 */
const errorText: Object = {
    'ms': 'minimumSignificantDigits',
    'ls': 'maximumSignificantDigits',
    'mf': 'minimumFractionDigits',
    'lf': 'maximumFractionDigits'
};

/**
 * Percent sign constant.
 */
const percentSign: string = 'percentSign';

/**
 * Minus sign constant.
 */
const minusSign: string = 'minusSign';

/**
 * Mapper array for numeric symbols.
 */
const mapper: string[] = ['infinity', 'nan', 'group', 'decimal', 'exponential'];



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
export const NumberFormat: INumberFormat = (() => {

    /**
     * Returns the formatter function for given skeleton.
     *
     * @param {string} culture -  Specifies the culture name to be used for formatting.
     * @param {NumberFormatOptions} option - Specifies the format in which number will be formatted.
     * @param {Object} cldr - Specifies the global cldr data collection.
     * @returns {Function} Returns the formatter function for the given number format options.
     */
    function numberFormatter(culture: string, option: NumberFormatOptions, cldr: Object): Function {
        const fOptions: FormatParts = extend({}, option);
        let cOptions: GenericFormatOptions = {};
        const dOptions: CommonOptions = {};
        let symbolPattern: string;

        const dependable: Dependables = base.getDependables(cldr, culture, '', true);
        dOptions.numberMapper = parser.getNumberMapper(dependable.parserObject, parser.getNumberingSystem(cldr), true);
        dOptions.currencySymbol = base.getCurrencySymbol(
            dependable.numericObject, fOptions.currency || defaultCurrencyCode, option.altSymbol, option.ignoreCurrency);
        dOptions.percentSymbol = (dOptions).numberMapper.numberSymbols[`${percentSign}`];
        dOptions.minusSymbol = (dOptions).numberMapper.numberSymbols[`${minusSign}`];

        const symbols: Object = dOptions.numberMapper.numberSymbols;
        if (option.format && !base.formatRegex.test(option.format)) {
            cOptions = base.customFormat(option.format, dOptions, dependable.numericObject);
            if (!isUndefined(fOptions.useGrouping) && fOptions.useGrouping) {
                fOptions.useGrouping = cOptions.pData.useGrouping;
            }
        } else {
            extend(fOptions, base.getProperNumericSkeleton(option.format || 'N'));
            fOptions.isCurrency = fOptions.type === 'currency';
            fOptions.isPercent = fOptions.type === 'percent';
            symbolPattern = base.getSymbolPattern(
                fOptions.type, dOptions.numberMapper.numberSystem, dependable.numericObject, fOptions.isAccount);
            fOptions.groupOne = checkValueRange(fOptions.maximumSignificantDigits, fOptions.minimumSignificantDigits, true);
            checkValueRange(fOptions.maximumFractionDigits, fOptions.minimumFractionDigits, false, true);
            if (!isUndefined(fOptions.fractionDigits)) {
                fOptions.minimumFractionDigits = fOptions.maximumFractionDigits = fOptions.fractionDigits;
            }
            if (isUndefined(fOptions.useGrouping)) {
                fOptions.useGrouping = true;
            }
            if (fOptions.isCurrency) {
                symbolPattern = symbolPattern.replace(/\u00A4/g, base.defaultCurrency);
            }
            const split: string[] = symbolPattern.split(';');
            cOptions.nData = base.getFormatData(split[1] || '-' + split[0], true, dOptions.currencySymbol);
            cOptions.pData = base.getFormatData(split[0], false, dOptions.currencySymbol);
            if (fOptions.useGrouping) {
                fOptions.groupSeparator = symbols[mapper[2]];
                fOptions.groupData = getGroupingDetails(split[0]);
            }
            const minFrac: boolean = isUndefined(fOptions.minimumFractionDigits);
            if (minFrac) {
                fOptions.minimumFractionDigits = cOptions.nData.minimumFraction;
            }
            if (isUndefined(fOptions.maximumFractionDigits)) {
                const mval: number = cOptions.nData.maximumFraction;
                fOptions.maximumFractionDigits = isUndefined(mval) && fOptions.isPercent ? 0 : mval;
            }
            const mfrac: number = fOptions.minimumFractionDigits;
            const lfrac: number = fOptions.maximumFractionDigits;
            if (!isUndefined(mfrac) && !isUndefined(lfrac)) {
                if (mfrac > lfrac) {
                    fOptions.maximumFractionDigits = mfrac;
                }
            }
        }
        extend(cOptions.nData, fOptions);
        extend(cOptions.pData, fOptions);
        return (value: number): string => {
            if (isNaN(value)) {
                return symbols[mapper[1]];
            } else if (!isFinite(value)) {
                return symbols[mapper[0]];
            }
            return intNumberFormatter(value, cOptions, dOptions, option);
        };
    }

    /**
     * Returns grouping details for the pattern provided.
     *
     * @param {string} pattern ?
     * @returns {GroupDetails} Returns an object containing primary and secondary grouping details
     */
    function getGroupingDetails(pattern: string): GroupDetails {
        const ret: GroupDetails = {};
        const match: string[] | null = pattern.match(base.negativeDataRegex);
        if (match && match[4]) {
            const pattern: string = match[4];
            const p: number = pattern.lastIndexOf(',');
            if (p !== -1) {
                const temp: string = pattern.split('.')[0];
                ret.primary = (temp.length - p) - 1;
                const s: number = pattern.lastIndexOf(',', p - 1);
                if (s !== -1) {
                    ret.secondary = p - 1 - s;
                }
            }
        }
        return ret;
    }

    /**
     * Checks if the provided integer range is valid.
     *
     * @param {number} val1 ?
     * @param {number} val2 ?
     * @param {boolean} checkbothExist ?
     * @param {boolean} isFraction ?
     * @returns {boolean} ?
     */
    function checkValueRange(val1: number, val2: number, checkbothExist: boolean, isFraction?: true): boolean {
        const decide: string = isFraction ? 'f' : 's';
        let dint: number = 0;
        const str1: string = (errorText)['l' + decide];
        const str2: string = (errorText)['m' + decide];
        if (!isUndefined(val1)) {
            checkRange(val1, str1, isFraction);
            dint++;
        }
        if (!isUndefined(val2)) {
            checkRange(val2, str2, isFraction);
            dint++;
        }
        if (dint === 2) {
            if (val1 < val2) {
                throwError(str2 + 'specified must be less than the' + str1);
            } else {
                return true;
            }
        } else if (checkbothExist && dint === 1) {
            throwError('Both' + str2 + 'and' + str2 + 'must be present');
        }
        return false;
    }

    /**
     * Validates if a value is within a specified range.
     *
     * @param {number} val ?
     * @param {string} text ?
     * @param {boolean} isFraction ?
     * @returns {void}
     */
    function checkRange(val: number, text: string, isFraction?: boolean): void {
        const range: number[] = isFraction ? [0, 20] : [1, 21];
        if (val < range[0] || val > range[1]) {
            throwError(text + 'value must be within the range' + range[0] + 'to' + range[1]);
        }
    }

    /**
     * Formats numeric strings based on options.
     *
     * @param {number} value ?
     * @param {GenericFormatOptions} fOptions ?
     * @param {CommonOptions} dOptions ?
     * @param {NumberFormatOptions} [option] ?
     * @returns {string} ?
     */
    function intNumberFormatter(
        value: number, fOptions: GenericFormatOptions,
        dOptions: CommonOptions,
        option?: NumberFormatOptions
    ): string {
        let curData: NegativeData;
        if (isUndefined(fOptions.nData.type)) {
            return null;
        } else {
            if (value < 0) {
                value = value * -1;
                curData = fOptions.nData;
            } else if (value === 0) {
                curData = fOptions.zeroData || fOptions.pData;
            } else {
                curData = fOptions.pData;
            }
            let fValue: string = '';
            if (curData.isPercent) {
                value = value * 100;
            }
            if (curData.groupOne) {
                fValue = processSignificantDigits(value, curData.minimumSignificantDigits, curData.maximumSignificantDigits);
            } else {
                fValue = processFraction(value, curData.minimumFractionDigits, curData.maximumFractionDigits, option);
                if (curData.minimumIntegerDigits) {
                    fValue = processMinimumIntegers(fValue, curData.minimumIntegerDigits);
                }
                if (dOptions.isCustomFormat && curData.minimumFractionDigits < curData.maximumFractionDigits
                    && /\d+\.\d+/.test(fValue)) {
                    const temp: string[] = fValue.split('.');
                    let decimalPart: string = temp[1];
                    const len: number = decimalPart.length;
                    for (let i: number = len - 1; i >= 0; i--) {
                        if (decimalPart[parseInt(i.toString(), 10)] === '0' && i >= curData.minimumFractionDigits) {
                            decimalPart = decimalPart.slice(0, i);
                        } else {
                            break;
                        }
                    }
                    fValue = temp[0] + '.' + decimalPart;
                }
            }
            if (curData.type === 'scientific') {
                fValue = value.toExponential(curData.maximumFractionDigits);
                fValue = fValue.replace('e', dOptions.numberMapper.numberSymbols[mapper[4]]);
            }
            fValue = fValue.replace('.', (dOptions).numberMapper.numberSymbols[mapper[3]]);
            fValue = curData.format === '#,###,,;(#,###,,)' ? customPivotFormat(parseInt(fValue, 10)) : fValue;
            if (curData.useGrouping) {
                fValue = groupNumbers(
                    fValue, curData.groupData.primary, curData.groupSeparator || ',',
                    (dOptions).numberMapper.numberSymbols[mapper[3]] || '.', curData.groupData.secondary);
            }
            fValue = parser.convertValueParts(fValue, base.latnParseRegex, dOptions.numberMapper.mapper);
            if (curData.nlead === 'N/A') {
                return curData.nlead;
            } else {
                if (fValue === '0' && option && option.format === '0') {
                    return fValue + curData.nend;
                }
                return curData.nlead + fValue + curData.nend;
            }
        }
    }

    /**
     * Processes significant digits for a value.
     *
     * @param {number} value ?
     * @param {number} min ?
     * @param {number} max ?
     * @returns {string} ?
     */
    function processSignificantDigits(value: number, min: number, max: number): string {
        let temp: string = value + '';
        let tn: number;
        const length: number = temp.length;
        if (length < min) {
            return value.toPrecision(min);
        } else {
            temp = value.toPrecision(max);
            tn = +temp;
            return tn + '';
        }
    }

    /**
     * Groups numeric strings based on separator and levels.
     *
     * @param {string} val ?
     * @param {number} level1 ?
     * @param {string} sep ?
     * @param {string} decimalSymbol ?
     * @param {number} level2 ?
     * @returns {string} ?
     */
    function groupNumbers(val: string, level1: number, sep: string, decimalSymbol: string, level2?: number): string {
        let flag: boolean = !isNullOrUndefined(level2) && level2 !== 0;
        const split: string[] = val.split(decimalSymbol);
        const prefix: string = split[0];
        let length: number = prefix.length;
        let str: string = '';
        while (length > level1) {
            str = prefix.slice(length - level1, length) + (str.length ?
                (sep + str) : '');
            length -= level1;
            if (flag) {
                level1 = level2;
                flag = false;
            }
        }
        split[0] = prefix.slice(0, length) + (str.length ? sep : '') + str;
        return split.join(decimalSymbol);
    }

    /**
     * Processes the fraction part of the numeric value.
     *
     * @param {number} value ?
     * @param {number} min ?
     * @param {number} max ?
     * @param {NumberFormatOptions} [option] ?
     * @returns {string} ?
     */
    function processFraction(value: number, min: number, max: number, option?: NumberFormatOptions): string {
        const temp: string = (value + '').split('.')[1];
        const length: number = temp ? temp.length : 0;
        if (min && length < min) {
            let ret: string = '';
            if (length === 0) {
                ret = value.toFixed(min);
            } else {
                ret += value;
                for (let j: number = 0; j < min - length; j++) {
                    ret += '0';
                }
                return ret;
            }
            return value.toFixed(min);
        } else if (!isNullOrUndefined(max) && (length > max || max === 0)) {
            return value.toFixed(max);
        }
        let str: string = value + '';
        if (str[0] === '0' && option && option.format === '###.00') {
            str = str.slice(1);
        }
        return str;
    }

    /**
     * Processes integer part ensuring minimum digit count.
     *
     * @param {string} value ?
     * @param {number} min ?
     * @returns {string} ?
     */
    function processMinimumIntegers(value: string, min: number): string {
        const temp: string[] = value.split('.');
        let lead: string = temp[0];
        const len: number = lead.length;
        if (len < min) {
            for (let i: number = 0; i < min - len; i++) {
                lead = '0' + lead;
            }
            temp[0] = lead;
        }
        return temp.join('.');
    }

    /**
     * Formats for pivot tables specifically.
     *
     * @param {number} value ?
     * @returns {string} ?
     */
    function customPivotFormat(value: number): string {
        if (value >= 500000) {
            value /= 1000000;
            const decimal: string | undefined = value.toString().split('.')[1];
            return decimal && +decimal.substring(0, 1) >= 5
                ? Math.ceil(value).toString()
                : Math.floor(value).toString();
        }
        return '';
    }

    return {
        getGroupingDetails,
        numberFormatter
    };
})();
