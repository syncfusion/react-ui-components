import { isUndefined, getValue } from '../util';

/**
 * Default numbering system for Latin script.
 */
const defaultNumberingSystem: { [key: string]: object } = {
    'latn': {
        '_digits': '0123456789',
        '_type': 'numeric'
    }
};

/**
 * Default symbols used in numbers representation.
 */
const defaultNumberSymbols: { [key: string]: string } = {
    'decimal': '.',
    'group': ',',
    'percentSign': '%',
    'plusSign': '+',
    'minusSign': '-',
    'infinity': '∞',
    'nan': 'NaN',
    'exponential': 'E'
};

/**
 * Latin number system representation as array.
 */
const latnNumberSystem: number[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

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
export const ParserBase: IParserBase = (() => {

    const props: IParserBase = {
        nPair: 'numericPair',
        nRegex: 'numericRegex',
        numberingSystems: defaultNumberingSystem
    };

    /**
     * Returns the cldr object for the culture specified.
     *
     * @param {Object} obj - Specifies the object from which culture object to be acquired.
     * @param {string} cName - Specifies the culture name.
     * @returns {Object} ?
     */
    props.getMainObject = (obj: Object, cName: string): Object => {
        const value: string = 'main.' + cName;
        return getValue(value, obj);
    };

    /**
     * Returns the numbering system object from given cldr data.
     *
     * @param {Object} obj - Specifies the object from which number system is acquired.
     * @returns {Object} ?
     */
    props.getNumberingSystem = (obj: Object): Object => {
        return getValue('supplemental.numberingSystems', obj) || props.numberingSystems;
    };

    /**
     * Returns the reverse of given object keys or keys specified.
     *
     * @param {Object} prop - Specifies the object to be reversed.
     * @param {number[]} [keys] - Optional parameter specifies the custom keyList for reversal.
     * @returns {Object} ?
     */
    props.reverseObject = (prop: Object, keys?: number[]): Object => {
        const propKeys: string[] | number[] = keys || Object.keys(prop);
        const res: Object = {};
        for (const key of propKeys) {
            if (!Object.prototype.hasOwnProperty.call(res, (prop)[`${key}`])) {
                (res)[(prop)[`${key}`]] = key;
            }
        }
        return res;
    };

    /**
     * Returns the symbol regex by skipping the escape sequence.
     *
     * @param {string[]} props - Specifies the array values to be skipped.
     * @returns {RegExp} ?
     */
    props.getSymbolRegex = (props: string[]): RegExp => {
        const regexStr: string = props.map((str: string): string => {
            return str.replace(/([.*+?^=!:${}()|[\]/\\])/g, '\\$1');
        }).join('|');
        const regExp: RegExpConstructor = RegExp;
        return new regExp(regexStr, 'g');
    };

    /**
     * Returns default numbering system object for formatting from cldr data.
     *
     * @param {Object} obj ?
     * @returns {NumericObject} ?
     */
    function getDefaultNumberingSystem(obj: Object): NumericObject {
        const ret: NumericObject = {};
        ret.obj = getValue('numbers', obj);
        ret.nSystem = getValue('defaultNumberingSystem', ret.obj);
        return ret;
    }

    /**
     * Returns the replaced value of matching regex and obj mapper.
     *
     * @param {string} value - Specifies the values to be replaced.
     * @param {RegExp} regex - Specifies the regex to search.
     * @param {Object} obj - Specifies the object matcher to be replace value parts.
     * @returns {string} ?
     */
    props.convertValueParts = (value: string, regex: RegExp, obj: Object): string => {
        return value.replace(regex, (str: string): string => {
            return (obj)[`${str}`];
        });
    };

    /**
     * Returns the replaced value of matching regex and obj mapper.
     *
     * @param {Object} curObj ?
     * @param {Object} numberSystem ?
     * @param {boolean} [needSymbols] ?
     * @returns {NumericOptions} ?
     */
    props.getCurrentNumericOptions = (
        curObj: Object,
        numberSystem: Object,
        needSymbols?: boolean
    ): NumericOptions => {
        const ret: NumericOptions = {};
        const cur: NumericObject = getDefaultNumberingSystem(curObj);
        if (!isUndefined(cur.nSystem)) {
            const digits: string = getValue(cur.nSystem + '._digits', numberSystem);
            if (!isUndefined(digits)) {
                ret.numericPair = props.reverseObject(digits, latnNumberSystem);
                const regExp: RegExpConstructor = RegExp;
                ret.numberParseRegex = new regExp(constructRegex(digits), 'g');
                ret.numericRegex = '[' + digits[0] + '-' + digits[9] + ']';
                if (needSymbols) {
                    ret.numericRegex = digits[0] + '-' + digits[9];
                    ret.symbolNumberSystem = getValue('symbols-numberSystem-' + cur.nSystem, cur.obj
                    );
                    ret.symbolMatch = getSymbolMatch(ret.symbolNumberSystem);
                    ret.numberSystem = cur.nSystem;
                }
            }
        }
        return ret;
    };

    /**
     * Returns number mapper object for the provided cldr data.
     *
     * @param {Object} curObj ?
     * @param {Object} numberSystem ?
     * @returns {NumberMapper} ?
     */
    props.getNumberMapper = (
        curObj: Object,
        numberSystem: Object
    ): NumberMapper => {
        const ret: NumberMapper = { mapper: {} };
        const cur: NumericObject = getDefaultNumberingSystem(curObj);
        if (!isUndefined(cur.nSystem)) {
            ret.numberSystem = cur.nSystem;
            ret.numberSymbols = getValue('symbols-numberSystem-' + cur.nSystem, cur.obj);
            ret.timeSeparator = getValue('timeSeparator', ret.numberSymbols);
            const digits: string = getValue(cur.nSystem + '._digits', numberSystem);
            if (!isUndefined(digits)) {
                for (const i of latnNumberSystem) {
                    ret.mapper[parseInt(i.toString(), 10)] = digits[parseInt(i.toString(), 10)];
                }
            }
        }
        return ret;
    };

    /**
     * Returns the symbol match for the provided object.
     *
     * @param {Object} prop ?
     * @returns {Object} ?
     */
    function getSymbolMatch(prop: Object): Object {
        const matchKeys: string[] = Object.keys(defaultNumberSymbols);
        const ret: Object = {};
        for (const key of matchKeys) {
            (ret)[(prop)[`${key}`]] = (defaultNumberSymbols)[`${key}`];
        }
        return ret;
    }

    /**
     * Constructs a regex string for the provided value.
     *
     * @param {string} val ?
     * @returns {string} ?
     */
    function constructRegex(val: string): string {
        const len: number = val.length;
        let ret: string = '';
        for (let i: number = 0; i < len; i++) {
            ret += val[parseInt(i.toString(), 10)];
            if (i !== len - 1) {
                ret += '|';
            }
        }
        return ret;
    }

    return props;
})();
