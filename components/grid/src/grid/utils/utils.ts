
import { DateFormatOptions, isNullOrUndefined, isUndefined, NumberFormatOptions, extend as baseExtend, getDatePattern, removeClass, addClass } from '@syncfusion/react-base';
import { DataUtil, Predicate } from '@syncfusion/react-data';
import { EditSettings, IValueFormatter, ValueType } from '../types';
import { FilterPredicates } from '../types/filter.interfaces';
import { ServiceLocator } from '../types/interfaces';
import { ColumnProps, HeaderValueAccessorProps, ValueAccessorProps } from '../types/column.interfaces';

/**
 * Function to get value from provided data
 *
 * @param  {ValueAccessorProps} props - specifies the valueAccessor event props.
 * @returns {Object} returns the object
 * @private
 */

// eslint-disable-next-line
export function valueAccessor<T, >(props: ValueAccessorProps<T>): T {
    const { field, data: data } = props;
    return (isNullOrUndefined(field) || field === '') ? '' as T : DataUtil.getObject(field, data) as T;
}

/**
 * Defines the method used to apply custom header cell values from external function and display this on each header cell rendered.
 *
 * @param  {HeaderValueAccessorProps} props - specifies the headerValueAccessor event props
 * @returns {object} headerValueAccessor
 * @private
 */
export function headerValueAccessor<T, >(props: HeaderValueAccessorProps): T {
    const { headerText, column } = props;
    return DataUtil.getObject(headerText, column) as T;
}

/**
 * @param {string} field - Defines the Field
 * @param {Object} object - Defines the objec
 * @returns {string | number | boolean | Object | undefined} Returns the object
 * @private
 */
export const getObject: (field: string, object?: Object) => string | number | boolean | Object | undefined =
    (field: string, object?: Object): string | number | boolean | Object | undefined => {
        let value: { [key: string]: string | number | boolean | Object | undefined } =
            object as { [key: string]: string | number | boolean | Object | undefined };
        const splits: string[] = field.split('.');
        for (let i: number = 0; i < splits.length && !isNullOrUndefined(value); i++) {
            const key: string = splits[i as number];
            value = value[key as string] as { [key: string]: string | number | boolean | Object | undefined };
            if (isUndefined(value) && object) {
                const pascalCase: string = key.charAt(0).toUpperCase() + key.slice(1);
                const camelCase: string = key.charAt(0).toLowerCase() + key.slice(1);
                value = object[pascalCase as string] || object[camelCase as string];
            }
        }
        return value;
    };

export const setStringFormatter: (fmtr: IValueFormatter, type: string, format: string) => Function | undefined =
    (fmtr: IValueFormatter, type: string, format: string): Function | undefined => {
        let args: object = {};
        if (type === 'date' || type === 'datetime' || type === 'dateonly') {
            const actualType: string = type === 'dateonly' ? 'date' : type;
            args = { type: actualType, skeleton: format };
            if (typeof format === 'string' && format !== 'yMd') {
                (args as { [key: string]: string })['format'] = format;
            }
        }
        switch (type) {
        case 'date':
        case 'dateonly':
        case 'datetime':
            return fmtr.getFormatFunction?.(args as DateFormatOptions);
        case 'number':
            return fmtr.getFormatFunction?.({ format: format } as NumberFormatOptions);
        default:
            return undefined;
        }
    };

/**
 * @param {ValueType} value - Defines the value
 * @returns {boolean} - whether value is date or number.
 * @private
 */
export const isDateOrNumber: (value: ValueType | Object) => boolean = (value: ValueType | Object): boolean => {
    let isDateOrNumber: boolean = false;
    if (typeof value === 'number') {
        isDateOrNumber = true;
    } else if (typeof value === 'string') {
        // Check if it's a valid number
        const num: number = Number(value);
        if (!isNaN(num)) {
            isDateOrNumber = true;
        } else {
            // Check if it's a valid date
            const dateValue: Date = new Date(value);
            isDateOrNumber = !isNaN(dateValue.getTime());
        }
    } else if (typeof value === 'object') {
        // Try converting object to date
        const dateValue: Date = new Date(value as string);
        isDateOrNumber = !isNaN(dateValue.getTime());
    }
    return isDateOrNumber;
};

/**
 * @param {ServiceLocator} serviceLocator - Defines the service locator
 * @param {ColumnProps} column  - Defines the column
 * @returns {void}
 * @private
 */
export function setFormatter(serviceLocator?: ServiceLocator, column?: ColumnProps): void {
    const fmtr: IValueFormatter = serviceLocator.getService<IValueFormatter>('valueFormatter');
    const format: string = 'format';
    let args: object;
    if (column.type === 'date' || column.type === 'datetime' || column.type === 'dateonly') {
        args = { type: column.type === 'dateonly' ? 'date' : column.type, skeleton: column.format };
        if ((typeof (column.format) === 'string') && column.format !== 'yMd') {
            args[`${format}`] = column.format;
        }
    }
    switch (column.type) {
    case 'date':
        column.formatFn = fmtr.getFormatFunction(args as DateFormatOptions);
        column.parseFn = fmtr.getParserFunction(args as DateFormatOptions);
        break;
    case 'dateonly':
        column.formatFn = fmtr.getFormatFunction(args as DateFormatOptions);
        column.parseFn = fmtr.getParserFunction(args as DateFormatOptions);
        break;
    case 'datetime':
        column.formatFn = fmtr.getFormatFunction(args as DateFormatOptions);
        column.parseFn = fmtr.getParserFunction(args as DateFormatOptions);
        break;
    case 'number':
        column.formatFn = fmtr.getFormatFunction({ format: column.format } as NumberFormatOptions);
        column.parseFn = fmtr.getParserFunction({ format: column.format } as NumberFormatOptions);
        break;
    }
}

let uid: number = 0;
/**
 * @param {string} prefix - Defines the prefix string
 * @returns {string} Returns the uid
 * @private
 */
export function getUid(prefix: string): string {
    return prefix + uid++;
}


/**
 * @param {FilterPredicates} filterObject - Defines the filterObject
 * @param {string} type - Defines the type
 * @param {boolean} isExecuteLocal - Defines whether the data actions performed in client and used for dateonly type field
 * @returns {Predicate} Returns the Predicate
 * @private
 */
export function getDatePredicate(filterObject: FilterPredicates, type?: string, isExecuteLocal?: boolean): Predicate {
    let datePredicate: Predicate;
    let prevDate: Date;
    let nextDate: Date;
    const prevObj: FilterPredicates = baseExtend({}, filterObject) as FilterPredicates;
    const nextObj: FilterPredicates = baseExtend({}, filterObject) as FilterPredicates;
    if (isNullOrUndefined(filterObject.value) || filterObject.value === '') {
        datePredicate = new Predicate(prevObj.field, prevObj.operator, prevObj.value, false);
        return datePredicate;
    }
    const value: Date = new Date(filterObject.value as string);
    if (type === 'dateonly' && !isExecuteLocal) {
        if (typeof (prevObj.value) === 'string') {
            prevObj.value = new Date(prevObj.value);
        }
        const dateOnlyString: string = (prevObj.value as Date).getFullYear() + '-' + padZero((prevObj.value as Date).getMonth() + 1) + '-' + padZero((prevObj.value as Date).getDate());
        const predicates: Predicate = new Predicate(prevObj.field, prevObj.operator, dateOnlyString, false);
        datePredicate = predicates;
    } else {
        filterObject.operator = filterObject.operator.toLowerCase();
        if (filterObject.operator === 'equal' || filterObject.operator === 'notequal') {
            if (type === 'datetime') {
                prevDate = new Date(value.setSeconds(value.getSeconds() - 1));
                nextDate = new Date(value.setSeconds(value.getSeconds() + 2));
                filterObject.value = new Date(value.setSeconds(nextDate.getSeconds() - 1));
            } else {
                prevDate = new Date(value.setHours(0) - 1);
                nextDate = new Date(value.setHours(24));
            }
            prevObj.value = prevDate;
            nextObj.value = nextDate;
            if (filterObject.operator === 'equal') {
                prevObj.operator = 'greaterthan';
                nextObj.operator = 'lessthan';
            } else {
                prevObj.operator = 'lessthanorequal';
                nextObj.operator = 'greaterthanorequal';
            }
            const predicateSt: Predicate = new Predicate(prevObj.field, prevObj.operator, prevObj.value, false);
            const predicateEnd: Predicate = new Predicate(nextObj.field, nextObj.operator, nextObj.value, false);
            datePredicate = filterObject.operator === 'equal' ? predicateSt.and(predicateEnd) : predicateSt.or(predicateEnd);
        } else {
            if (type === 'date' && (filterObject.operator === 'lessthanorequal' || filterObject.operator === 'greaterthan')) {
                prevObj.value = new Date(value.setHours(24) - 1);
            }
            if (typeof (prevObj.value) === 'string') {
                prevObj.value = new Date(prevObj.value);
            }
            const predicates: Predicate = new Predicate(prevObj.field, prevObj.operator, prevObj.value, false);
            datePredicate = predicates;
        }
    }
    filterObject.ejpredicate = datePredicate;
    return datePredicate;
}

/**
 * @param {number} value - Defines the date or month value
 * @returns {string} Returns string
 * @private
 */
export function padZero(value: number): string {
    if (value < 10) {
        return '0' + value;
    }
    return String(value);
}

/**
 * @param {Object} collection - Defines the collection
 * @returns {Object} Returns the object
 * @private
 */
export function getActualPropFromColl(collection: Object[]): Object[] {
    const coll: Object[] = [];
    for (let i: number = 0, len: number = collection.length; i < len; i++) {
        // eslint-disable-next-line no-prototype-builtins
        if (collection[parseInt(i.toString(), 10)].hasOwnProperty('properties')) {
            coll.push((collection[parseInt(i.toString(), 10)] as { properties: Object }).properties);
        } else {
            coll.push(collection[parseInt(i.toString(), 10)]);
        }
    }
    return coll;
}

/**
 * @param {Object[]} collection - Defines the array
 * @param {Object} predicate - Defines the predicate
 * @returns {Object} Returns the object
 * @private
 */
export function iterateArrayOrObject<T, U>(collection: U[], predicate: (item: Object, index: number) => T): T[] {
    const result: T[] = [];
    for (let i: number = 0, len: number = collection.length; i < len; i++) {
        const pred: T = predicate(collection[parseInt(i.toString(), 10)], i);
        if (!isNullOrUndefined(pred)) {
            result.push(<T>pred);
        }
    }
    return result;
}

/**
 * @param {FilterPredicates} filter - Defines the FilterPredicates
 * @returns {boolean} Returns the object
 * @private
 */
export function getCaseValue(filter: FilterPredicates): boolean  {
    if (isNullOrUndefined(filter.caseSensitive)) {
        if (filter.type === 'string' || isNullOrUndefined(filter.type) && typeof (filter.value) === 'string') {
            return false;
        } else {
            return true;
        }
    } else {
        return filter.caseSensitive;
    }
}

/**
 * @param {string | Object} format - defines the format
 * @param {string} colType - Defines the coltype
 * @returns {string} Returns the custom Data format
 * @private
 */
export function getCustomDateFormat(format: string | Object, colType: string): string {
    let formatvalue: string;
    const formatter: string = 'format';
    const type: string = 'type';
    if (colType === 'date') {
        formatvalue = typeof (format) === 'object' ?
            getDatePattern({ type: format[`${type}`] ? format[`${type}`] : 'date', format: format[`${formatter}`] }, false) :
            getDatePattern({ type: 'dateTime', skeleton: format }, false);
    } else {
        formatvalue = typeof (format) === 'object' ?
            getDatePattern({ type: format[`${type}`] ? format[`${type}`] : 'dateTime', format: format[`${formatter}`] }, false) :
            getDatePattern({ type: 'dateTime', skeleton: format }, false);
    }
    return formatvalue;
}


/**
 * Compare specific properties of two objects for equality
 *
 * @param {Object} obj1 - First object to compare
 * @param {Object} obj2 - Second object to compare
 * @param {Array<string>} keys - Array of keys to include in comparison (only these will be compared)
 * @returns {boolean} boolean indicating if specified properties are equal
 * @private
 */
export function compareSelectedProperties<T extends object, U extends object>(
    obj1: T,
    obj2: U,
    keys: Array<string & (keyof T | keyof U)>
): boolean {
    return keys.every((key: string & (keyof T | keyof U)) => {
        // Check if key exists in both objects
        const existsInObj1: boolean = obj1 && key in obj1;
        const existsInObj2: boolean = obj2 && key in obj2;

        // If key doesn't exist in both objects, they're different
        if (existsInObj1 !== existsInObj2) { return false; }

        // If key doesn't exist in either object, they're equal (for this property)
        if (!existsInObj1 && !existsInObj2) { return true; }

        // Compare values using type-safe comparison
        return compareValues(
            (obj1 as Record<string, string | number | object | Date>)[key as string & (keyof T | keyof U)],
            (obj2 as Record<string, string | number | object | Date>)[key as string & (keyof T | keyof U)]
        );
    });
}

/**
 * Type-safe comparison of two values of unknown types
 * Uses type guards to safely compare values of different types
 *
 * @param {string | number | object | Date} val1 - first object comapring value
 * @param {string | number | object | Date} val2 - second object comparing value
 * @returns {boolean} - is values matched
 * @private
 */
export function compareValues(val1: string | number | object | Date | boolean, val2: string | number | object | Date | boolean): boolean {
    // Handle null/undefined cases
    if (val1 == null || val2 == null) {
        return val1 === val2;
    }

    // Handle primitive types
    if (typeof val1 !== 'object' && typeof val2 !== 'object') {
        return val1 === val2;
    }

    // Handle Date objects
    if (val1 instanceof Date && val2 instanceof Date) {
        return val1.getTime() === val2.getTime();
    }

    // Handle arrays with type guards
    if (Array.isArray(val1) && Array.isArray(val2)) {
        if (val1.length !== val2.length) { return false; }

        // Simple array comparison for primitive arrays (faster)
        const allPrimitives: boolean = val1.every((item: string | number | object | Date) => typeof item !== 'object' || item === null);
        if (allPrimitives) {
            return val1.every((item: string | number | object | Date, index: number) => item === val2[index as number]);
        }

        // Deep comparison for object arrays
        return val1.every((item: string | number | object | Date, index: number) => compareValues(item, val2[index as number]));
    }

    // If one is array but other is not
    if (Array.isArray(val1) !== Array.isArray(val2)) { return false; }

    // Handle objects
    if (typeof val1 === 'object' && typeof val2 === 'object' && val1 !== null && val2 !== null) {
        // For nested objects, compare all properties recursively
        const keys1: string[] = Object.keys(val1);
        const keys2: string[] = Object.keys(val2);

        // If number of keys doesn't match, objects are different
        if (keys1.length !== keys2.length) { return false; }

        // Check if all keys in val1 have the same values in val2
        return keys1.every((key: string) =>
            key in (val2 as Object) &&
            compareValues(
                (val1 as Object)[key as string],
                (val2 as Object)[key as string]
            )
        );
    }

    // Fallback comparison (should not reach here with proper type guards)
    return Object.is(val1, val2);
}
/**
 * Parses a CSS-style unit string and extracts the numeric value.
 * Supports values like "100px", "50%", "2em", etc.
 * Returns 0 if no valid number is found.
 *
 * @param {string | number} value - The value to parse, can be a number or a string with units.
 * @returns {number} - The numeric part of the value.
 * @private
 */
export function parseUnit(value: string | number): number {
    if (typeof value === 'number') {
        return value;
    }

    // Use parseFloat directly, which safely extracts leading numeric value
    const parsed: number = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
}

/**
 * @param {HTMLTableElement} contentTableRef - Defines the contentTableRef
 * @param {EditSettings} editSettings  - Defines the editSettings
 * @returns {void}
 * @private
 */
export function addLastRowBorder(contentTableRef?: HTMLTableElement, editSettings?: EditSettings): void {
    const table: Element = contentTableRef;
    removeClass(table?.querySelectorAll?.('td'), 'sf-last-cell');
    if (table?.querySelector?.('tr:nth-last-child(2)')) {
        if (editSettings?.showAddNewRow && editSettings?.newRowPosition === 'Bottom') {
            addClass(table.querySelector('tr:nth-last-child(2)').querySelectorAll('td'), 'sf-last-cell');
        }
    }
    addClass(table?.querySelectorAll?.('tr:last-child td'), 'sf-last-cell');
}
