import { isUndefined, getValue } from '../util';
/**
 * Default numbering system for Latin script.
 */
const defaultNumberingSystem = {
    'latn': {
        '_digits': '0123456789',
        '_type': 'numeric'
    }
};
/**
 * Default symbols used in numbers representation.
 */
const defaultNumberSymbols = {
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
const latnNumberSystem = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
/**
 * Class for handling the Parser Base functionalities.
 */
export const ParserBase = (() => {
    const props = {
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
    props.getMainObject = (obj, cName) => {
        const value = 'main.' + cName;
        return getValue(value, obj);
    };
    /**
     * Returns the numbering system object from given cldr data.
     *
     * @param {Object} obj - Specifies the object from which number system is acquired.
     * @returns {Object} ?
     */
    props.getNumberingSystem = (obj) => {
        return getValue('supplemental.numberingSystems', obj) || props.numberingSystems;
    };
    /**
     * Returns the reverse of given object keys or keys specified.
     *
     * @param {Object} prop - Specifies the object to be reversed.
     * @param {number[]} [keys] - Optional parameter specifies the custom keyList for reversal.
     * @returns {Object} ?
     */
    props.reverseObject = (prop, keys) => {
        const propKeys = keys || Object.keys(prop);
        const res = {};
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
    props.getSymbolRegex = (props) => {
        const regexStr = props.map((str) => {
            return str.replace(/([.*+?^=!:${}()|[\]/\\])/g, '\\$1');
        }).join('|');
        const regExp = RegExp;
        return new regExp(regexStr, 'g');
    };
    /**
     * Returns default numbering system object for formatting from cldr data.
     *
     * @param {Object} obj ?
     * @returns {NumericObject} ?
     */
    function getDefaultNumberingSystem(obj) {
        const ret = {};
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
    props.convertValueParts = (value, regex, obj) => {
        return value.replace(regex, (str) => {
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
    props.getCurrentNumericOptions = (curObj, numberSystem, needSymbols) => {
        const ret = {};
        const cur = getDefaultNumberingSystem(curObj);
        if (!isUndefined(cur.nSystem)) {
            const digits = getValue(cur.nSystem + '._digits', numberSystem);
            if (!isUndefined(digits)) {
                ret.numericPair = props.reverseObject(digits, latnNumberSystem);
                const regExp = RegExp;
                ret.numberParseRegex = new regExp(constructRegex(digits), 'g');
                ret.numericRegex = '[' + digits[0] + '-' + digits[9] + ']';
                if (needSymbols) {
                    ret.numericRegex = digits[0] + '-' + digits[9];
                    ret.symbolNumberSystem = getValue('symbols-numberSystem-' + cur.nSystem, cur.obj);
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
    props.getNumberMapper = (curObj, numberSystem) => {
        const ret = { mapper: {} };
        const cur = getDefaultNumberingSystem(curObj);
        if (!isUndefined(cur.nSystem)) {
            ret.numberSystem = cur.nSystem;
            ret.numberSymbols = getValue('symbols-numberSystem-' + cur.nSystem, cur.obj);
            ret.timeSeparator = getValue('timeSeparator', ret.numberSymbols);
            const digits = getValue(cur.nSystem + '._digits', numberSystem);
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
    function getSymbolMatch(prop) {
        const matchKeys = Object.keys(defaultNumberSymbols);
        const ret = {};
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
    function constructRegex(val) {
        const len = val.length;
        let ret = '';
        for (let i = 0; i < len; i++) {
            ret += val[parseInt(i.toString(), 10)];
            if (i !== len - 1) {
                ret += '|';
            }
        }
        return ret;
    }
    return props;
})();
