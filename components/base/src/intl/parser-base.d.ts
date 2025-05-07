/**
 * Interface for numeric Options.
 */
export interface NumericOptions {
    numericPair?: Object;
    numericRegex?: string;
    numberParseRegex?: RegExp;
    symbolNumberSystem?: Object;
    symbolMatch?: Object;
    numberSystem?: string;
}
/**
 * Interface for numeric object holding numbers system data.
 */
export interface NumericObject {
    obj?: Object;
    nSystem?: string;
}
/**
 * Interface for number mapper holding mapping of symbols and digits.
 */
export interface NumberMapper {
    mapper?: Object;
    timeSeparator?: string;
    numberSymbols?: Object;
    numberSystem?: string;
}
/**
 * Interface for the public and protected properties and methods in useParserBase custom object.
 */
export interface IParserBase {
    nPair?: string;
    nRegex?: string;
    numberingSystems?: Object;
    /**
     * Returns the cldr object for the culture specified.
     *
     * @private
     * @param {Object} obj - Specifies the object from which culture object to be acquired.
     * @param {string} cName - Specifies the culture name.
     * @returns {Object}
     */
    getMainObject?(obj: Object, cName: string): Object;
    /**
     * Returns the numbering system object from given cldr data.
     *
     * @private
     * @param {Object} obj - Specifies the object from which number system is acquired.
     * @returns {Object}
     */
    getNumberingSystem?(obj: Object): Object;
    /**
     * Returns the reverse of given object keys or keys specified.
     *
     * @private
     * @param {Object} prop - Specifies the object to be reversed.
     * @param {number[]} [keys] - Optional parameter specifies the custom keyList for reversal.
     * @returns {Object}
     */
    reverseObject?(prop: Object, keys?: number[]): Object;
    /**
     * Returns the symbol regex by skipping the escape sequence.
     *
     * @private
     * @param {string[]} props - Specifies the array values to be skipped.
     * @returns {RegExp}
     */
    getSymbolRegex?(props: string[]): RegExp;
    /**
     * Returns default numbering system object for formatting from cldr data.
     *
     * @private
     * @param {Object} obj
     * @returns {NumericObject}
     */
    getDefaultNumberingSystem?(obj: Object): NumericObject;
    /**
     * Returns the replaced value of matching regex and obj mapper.
     *
     * @private
     * @param {string} value - Specifies the values to be replaced.
     * @param {RegExp} regex - Specifies the regex to search.
     * @param {Object} obj - Specifies the object matcher to be replace value parts.
     * @returns {string}
     */
    convertValueParts?(value: string, regex: RegExp, obj: Object): string;
    /**
     * Returns the replaced value of matching regex and obj mapper.
     *
     * @private
     * @param {Object} curObj
     * @param {Object} numberSystem
     * @param {boolean} [needSymbols]
     * @returns {NumericOptions}
     */
    getCurrentNumericOptions?(curObj: Object, numberSystem: Object, needSymbols?: boolean): NumericOptions;
    /**
     * Returns number mapper object for the provided cldr data.
     *
     * @private
     * @param {Object} curObj
     * @param {Object} numberSystem
     * @param {boolean} [isNumber]
     * @returns {NumberMapper}
     */
    getNumberMapper?(curObj: Object, numberSystem: Object, isNumber?: boolean): NumberMapper;
}
/**
 * Class for handling the Parser Base functionalities.
 */
export declare const ParserBase: IParserBase;
