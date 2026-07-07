
import { DateFormatOptions, isNullOrUndefined, isUndefined, NumberFormatOptions, extend as baseExtend, getDatePattern, removeClass, addClass, extend } from '@syncfusion/react-base';
import { DataManager, DataUtil, Predicate, Query } from '@syncfusion/react-data';
import { EditSettings, IValueFormatter, ValueType, ColumnType, AutoSelectMode, VirtualSettings, IRow, GridProps, ChildInfoResult,
    GroupedData, GroupSettings } from '../types';
import { FilterPredicates } from '../types/filter.interfaces';
import { ServiceLocator } from '../types/interfaces';
import { payload } from '../types/edit.interfaces';
import { GridRef } from '../types/grid.interfaces';
import { ColumnProps, HeaderValueAccessorProps, ValueAccessorProps, IColumnBase } from '../types/column.interfaces';
import { RefObject } from 'react';
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
        if (isNullOrUndefined(field) || field === '') {
            return undefined;
        }
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
        const year: string = (prevObj.value as Date).getFullYear().toString();
        const month: string = padZero((prevObj.value as Date).getMonth() + 1);
        const day: string = padZero((prevObj.value as Date).getDate());
        const dateOnlyString: string = `${year}-${month}-${day}`;
        const predicates: Predicate = new Predicate(prevObj.field, prevObj.operator, dateOnlyString, false);
        datePredicate = predicates;
    } else {
        const operator: string = filterObject.operator.toLowerCase();
        if (operator === 'equal' || operator === 'notEqual') {
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
            if (operator === 'equal') {
                prevObj.operator = 'greaterThan';
                nextObj.operator = 'lessThan';
            } else {
                prevObj.operator = 'lessThanOrEqual';
                nextObj.operator = 'greaterThanOrEqual';
            }
            const predicateSt: Predicate = new Predicate(prevObj.field, prevObj.operator, prevObj.value, false);
            const predicateEnd: Predicate = new Predicate(nextObj.field, nextObj.operator, nextObj.value, false);
            datePredicate = operator === 'equal' ? predicateSt.and(predicateEnd) : predicateSt.or(predicateEnd);
        } else {
            if (type === 'date' && (operator === 'lessThanOrEqual' || operator === 'greaterThan')) {
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
 * Retrieves the full row object from a row element or row index.
 * Handles both regular and virtualized row scenarios.
 *
 * @template T - The type of data in the grid
 * @param {Element | number} row - The row element or row index
 * @param {RefObject<GridRef<T>>} gridRef - Reference to the grid instance
 * @param {VirtualSettings} [virtualSettings] - Virtual settings for the grid (optional)
 * @returns {IRow<ColumnProps<T>>} The row object or empty object if not found
 * @private
 */
export function getRowObjFromElement<T>(
    row: Element | number,
    gridRef: RefObject<GridRef<T>>,
    virtualSettings?: VirtualSettings
): IRow<ColumnProps<T>> {
    if (isNullOrUndefined(row)) { return {} as IRow<ColumnProps<T>>; }
    if (typeof row === 'number') {
        row = gridRef?.current?.getRowByIndex(row);
    }
    if (row) {
        return gridRef?.current?.getRowObjectFromUID?.(virtualSettings?.enableRow ?
            gridRef?.current?.cachedRowObjects.current?.get(parseUnit(row.getAttribute('aria-rowindex')) - 1)?.uid :
            row.getAttribute('data-uid')) || {} as IRow<ColumnProps<T>>;
    }
    return {} as IRow<ColumnProps<T>>;
}

/**
 * Determines CSS border classes for cell selection visualization.
 * Computes borders directly from selectedCells Set to ensure consistency with selection state.
 * Applies top, bottom, left, and right borders for valid rectangular range selections,
 * including single-row (horizontal drag) and single-column (vertical drag) selections.
 * Works with both numeric and string-based row identifiers (e.g., "0:field" or "P-001:field").
 *
 * @param {Set<string> | undefined} selectedCells - Set of selected cell keys in format "rowId:columnField"
 * @param {string} cellKey - Current cell key to check and compute borders for
 * @param {ColumnProps[]} visibleColumns - Visible columns used to resolve field indices
 * @returns {string} CSS classes for selection borders
 * @private
 */
export function getCellSelectionBorderClasses(
    selectedCells: Set<string> | undefined,
    cellKey: string,
    visibleColumns: ColumnProps[]
): string {
    if (!selectedCells || !cellKey || !visibleColumns?.length) {
        return '';
    }

    // Check if current cell is selected
    if (!selectedCells.has(cellKey)) {
        return '';
    }

    // Parse current cell key: "rowId:columnField"
    // rowId can be numeric or string-based (e.g., "P-001"), so keep as string
    const [rowId, colField] = cellKey.split(':');
    const colIndex: number = visibleColumns.findIndex((c: ColumnProps<unknown>) => c.field === colField);

    if (colIndex < 0) {
        return '';
    }

    // Collect all unique row IDs and column indices from selected cells
    const rowIds: string[] = [];
    const colIndices: Set<number> = new Set();

    for (const key of selectedCells) {
        const [keyRowId, keyColField] = key.split(':');
        const foundColIndex: number = visibleColumns.findIndex(
            (col: ColumnProps<unknown>) => col.field === keyColField
        );

        if (foundColIndex >= 0) {
            if (!rowIds.includes(keyRowId)) {
                rowIds.push(keyRowId);
            }
            colIndices.add(foundColIndex);
        }
    }

    let borderClasses: string = '';

    // Check if we have at least 2 cells selected (either 2 rows or 2 columns or both)
    if ((rowIds.length >= 2 || colIndices.size >= 2) && selectedCells.size >= 2) {
        const expectedCellCount: number = rowIds.length * colIndices.size;
        let validCellCount: number = 0;

        // Count how many cells in the expected range are actually selected
        for (const key of selectedCells) {
            const [keyRowId, keyColField] = key.split(':');
            const foundColIndex: number = visibleColumns.findIndex(
                (col: ColumnProps<unknown>) => col.field === keyColField
            );

            if (rowIds.includes(keyRowId) && colIndices.has(foundColIndex)) {
                validCellCount++;
            }
        }

        // Apply borders only for a valid rectangular range
        if (validCellCount === expectedCellCount) {
            const rowPosition: number = rowIds.indexOf(rowId);
            const colMin: number = Math.min(...colIndices);
            const colMax: number = Math.max(...colIndices);

            // Apply top border for first row
            if (rowPosition === 0) { borderClasses += ' sf-cell-range-top'; }
            // Apply bottom border for last row
            if (rowPosition === rowIds.length - 1) { borderClasses += ' sf-cell-range-bottom'; }
            // Apply left border for first column
            if (colIndex === colMin) { borderClasses += ' sf-cell-range-left'; }
            // Apply right border for last column
            if (colIndex === colMax) { borderClasses += ' sf-cell-range-right'; }
        }
    }

    return borderClasses;
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

/**
 * Gets selected records or count from the current page view based on selectedRowState
 *
 * This utility function iterates through current page data and identifies records that
 * are present in the selectedRowState Set, returning the matching records, count, and primary keys.
 *
 * @template T - The type of records in the grid
 * @param {T[]} currentViewData - Array of records currently visible on the page
 * @param {Set<string>} selectedRowState - Set of selected row primary keys
 * @param {GridRef<T>} gridRef - Reference to the grid instance
 * @param {boolean} returnRecords - If true, returns records array; if false, returns count only
 * @returns {{ records: T[], count: number, primaryKeys: string[] }} Object containing records, count, and primaryKeys
 * @private
 */
export function getCurrentPageSelectedItems<T>(
    currentViewData: (GroupedData<T> | T)[],
    selectedRowState: Set<string>,
    gridRef: GridRef<T>,
    returnRecords: boolean = false
): { records: T[], count: number, primaryKeys: string[] } {
    const records: T[] = returnRecords ? [] : null;
    let count: number = 0;
    const collectedPrimaryKeys: string[] = [];
    const primaryKeys: string[] = gridRef?.getPrimaryKeyFieldNames?.() ?? [];

    if (!currentViewData || !selectedRowState || !primaryKeys || primaryKeys.length === 0) {
        return { records: records || [], count: 0, primaryKeys: [] };
    }

    const primaryKey: string = primaryKeys[0];

    for (const row of currentViewData) {
        const key: string = ((row as T)?.[primaryKey as keyof T] ?? (row as GroupedData<T>)?.flattedKey) as unknown as string;
        if (key != null && selectedRowState.has(key)) {
            count++;
            if (returnRecords) {
                collectedPrimaryKeys.push(key);
                records.push(row as T);
            }
        }
    }

    return { records: records || [], count, primaryKeys: collectedPrimaryKeys };
}

/**
 * Builds remote delete payload for server-side processing when using persistent selection
 *
 * This utility handles the logic for determining which records should be deleted based on
 * remote header selection state and toggle keys.
 *
 * @template T
 * @param {GridRef<T>} gridRef - Reference to the grid instance
 * @param {string} deleteOption - 'page' for current page selected rows, 'all' for all selected rows with header selection support
 * @returns {payload | null} Remote delete payload structure or null if conditions not met
 * @private
 */
export function buildDeletepayload<T>(gridRef: GridRef<T>, deleteOption?: 'page' | 'all'): payload | null {
    let isHeaderSelectAllMode: boolean;
    const toggleKeys: string[] = [];
    const defaultSelectMode: boolean = gridRef?.selectionSettings?.autoSelectMode === AutoSelectMode.Default;

    if (defaultSelectMode) {
        isHeaderSelectAllMode = gridRef?.selectionModule?.isHeaderSelectAllMode ?? false;
        if (deleteOption === 'all') {
            if (isHeaderSelectAllMode) {
                const unselectedKeys: Set<string> = gridRef?.selectionModule?.unselectedRowState ?? new Set();
                toggleKeys.push(...Array.from(unselectedKeys));
            } else {
                const selectedKeys: Set<string> = gridRef?.selectionModule?.selectedRowState ?? new Set();
                toggleKeys.push(...Array.from(selectedKeys));
            }
        } else {
            const { primaryKeys: selectedViewKeys } = getCurrentPageSelectedItems<T>(
                gridRef?.currentViewData,
                gridRef?.selectionModule?.selectedRowState,
                gridRef,
                true
            );
            isHeaderSelectAllMode = false;
            toggleKeys.push(...Array.from(selectedViewKeys));
        }
    } else {
        if (deleteOption === 'all') {
            isHeaderSelectAllMode = false;
            const selectedKeys: Set<string> = gridRef?.selectionModule?.selectedRowState ?? new Set();
            toggleKeys.push(...Array.from(selectedKeys));
        } else {
            const { primaryKeys: selectedViewKeys } = getCurrentPageSelectedItems<T>(
                gridRef?.currentViewData,
                gridRef?.selectionModule?.selectedRowState,
                gridRef,
                true
            );
            isHeaderSelectAllMode = false;
            toggleKeys.push(...Array.from(selectedViewKeys));
        }
    }

    // Delete payload structure
    return {
        isHeaderSelectAllMode: isHeaderSelectAllMode,
        toggleKeys: toggleKeys
    };
}

export const updateUIColumnType: (data: Object, newColumn: Partial<IColumnBase>, serviceLocator: ServiceLocator,
    isColTypeDef?: RefObject<boolean>) => ColumnProps =
(data: Object, newColumn: Partial<IColumnBase>, serviceLocator: ServiceLocator, isColTypeDef?: RefObject<boolean>): ColumnProps => {
    if (!isNullOrUndefined(newColumn.getCommandItems)) {
        newColumn.type = ColumnType.Command;
    }
    if (isNullOrUndefined(newColumn.field)) {
        return newColumn;
    }
    // update column type, format, parser, and other first dataSource based properties here
    const value: string | number | boolean | Object = getObject(newColumn.field, data);
    if (!isNullOrUndefined(value)) {
        if (isColTypeDef) {
            isColTypeDef.current = true;
        }
        if (!newColumn.type) {
            newColumn.type = value instanceof Date && value.getDay ? (value.getHours() > 0 || value.getMinutes() > 0 ||
                value.getSeconds() > 0 || value.getMilliseconds() > 0 ? 'datetime' : 'date') : typeof (value);
        }
    } else {
        newColumn.type = newColumn.type || null;
    }
    const valueFormatter: IValueFormatter = serviceLocator?.getService<IValueFormatter>('valueFormatter');
    if (newColumn.format && ((newColumn.format as DateFormatOptions).skeleton
        || ((newColumn.format as DateFormatOptions).format &&
            typeof (newColumn.format as DateFormatOptions).format === 'string'))) {
        // Store the formatter and parser functions directly on the new object
        newColumn.formatFn = valueFormatter.getFormatFunction(extend({}, newColumn.format as DateFormatOptions));
        newColumn.parseFn = valueFormatter.getParserFunction(newColumn.format as DateFormatOptions);
    }
    if (newColumn.sortComparer && !isNullOrUndefined(isColTypeDef)) {
        let a: Function = newColumn.sortComparer;
        newColumn.sortComparer = (x: number | string, y: number | string, xObj?: Object, yObj?: Object) => {
            if (typeof a === 'string') {
                a = getObject(a, window) as Function;
            }
            if (newColumn.sortDirection === 'Descending') {
                const z: number | string = x as number | string;
                x = y;
                y = z;
                const obj: Object = xObj;
                xObj = yObj;
                yObj = obj;
            }
            return a(x, y, xObj, yObj, newColumn.sortDirection);
        };
    }
    if (typeof (newColumn.format) === 'string') {
        setFormatter(serviceLocator, newColumn);
    } else if (!newColumn.format && newColumn.type === 'number') {
        newColumn.parseFn = valueFormatter.getParserFunction({ format: 'n2' } as NumberFormatOptions);
    }
    if (newColumn.type === 'dateonly' && !newColumn.format) {
        newColumn.format = 'yMd';
        setFormatter(serviceLocator, newColumn);
    }
    return newColumn;
};

/**
 *
 * @param {FilterPredicates[]} columns - Defines the column
 * @param {boolean} isExecuteLocal - Defines the editSettings
 * @param {string} moduleName - Defines the module name to check the operator format for UrlAdaptor
 * @returns {Predicate} - return the filter predicates
 * @private
 */
export function getPredicate(columns: FilterPredicates[], isExecuteLocal?: boolean, moduleName?: string): Predicate {
    const cols: FilterPredicates[] = DataUtil.distinct(columns, 'field', true);
    let collection: Object[] = [];
    const pred: Predicate = {} as Predicate;
    for (let i: number = 0; i < cols.length; i++) {
        collection = new DataManager(columns as JSON[]).executeLocal(
            new Query().where('field', 'equal', cols[parseInt(i.toString(), 10)].field));
        pred[cols[parseInt(i.toString(), 10)].field] = generatePredicate(collection, isExecuteLocal, moduleName);
    }
    return pred;
}

/**
 *
 * @param {FilterPredicates[]} cols - Defines the column
 * @param {boolean} isExecuteLocal  - Defines the editSettings
 * @param {string} moduleName - Defines the module name to check the operator format for UrlAdaptor
 * @returns {Predicate} - return the filter predicates
 * @private
 */
export function generatePredicate(cols: FilterPredicates[], isExecuteLocal?: boolean, moduleName?: string): Predicate {
    const len: number = cols.length;
    let predicate: Predicate;
    const operate: string = 'or';
    const first: FilterPredicates = cols[0];
    first.ignoreAccent = !isNullOrUndefined(first.ignoreAccent) ? first.ignoreAccent : false;
    if (first.type === 'date' || first.type === 'datetime' || first.type === 'dateonly') {
        predicate = getDatePredicate(first, first.type, isExecuteLocal);
    } else {
        predicate = first.ejpredicate ? first.ejpredicate as Predicate :
            new Predicate(
                first.field, first.operator, first.value, !getCaseValue(first),
                first.ignoreAccent) as Predicate;
        if (moduleName === 'UrlAdaptor') {
            predicate.operator = predicate?.operator?.toLowerCase();
        }
    }
    for (let p: number = 1; p < len; p++) {
        const predicateLength: number = predicate?.predicates ? predicate.predicates.length : 0;
        if (len > 2 && p > 1 && ((cols[p as number].predicate === 'or' && cols[p as number - 1].predicate === 'or')
            || (cols[p as number].predicate === 'and' && cols[p as number - 1].predicate === 'and'))) {
            if (cols[p as number].type === 'date' || cols[p as number].type === 'datetime' || cols[p as number].type === 'dateonly') {
                predicate.predicates.push(
                    getDatePredicate(cols[parseInt(p.toString(), 10)], cols[p as number].type, isExecuteLocal));
            } else {
                predicate.predicates.push(new Predicate(
                    cols[p as number].field, cols[parseInt(p.toString(), 10)].operator,
                    cols[parseInt(p.toString(), 10)].value, !getCaseValue(cols[parseInt(p.toString(), 10)]),
                    cols[parseInt(p.toString(), 10)].ignoreAccent));
            }
        } else {
            if (cols[p as number].type === 'date' || cols[p as number].type === 'datetime' || cols[p as number].type === 'dateonly') {
                if (cols[parseInt(p.toString(), 10)].predicate === 'and' && cols[parseInt(p.toString(), 10)].operator === 'equal') {
                    predicate = (predicate[`${operate}`] as Function)(
                        getDatePredicate(cols[parseInt(p.toString(), 10)], cols[parseInt(p.toString(), 10)].type, isExecuteLocal),
                        cols[parseInt(p.toString(), 10)].type, cols[parseInt(p.toString(), 10)].ignoreAccent);
                } else {
                    predicate = (predicate[((cols[parseInt(p.toString(), 10)] as Predicate).predicate) as string] as Function)(
                        getDatePredicate(cols[parseInt(p.toString(), 10)], cols[parseInt(p.toString(), 10)].type, isExecuteLocal),
                        cols[parseInt(p.toString(), 10)].type, cols[parseInt(p.toString(), 10)].ignoreAccent);
                }
            } else {
                predicate = cols[parseInt(p.toString(), 10)].ejpredicate ?
                    (predicate[(cols[parseInt(p.toString(), 10)] as Predicate)
                        .predicate as string] as Function)(cols[parseInt(p.toString(), 10)].ejpredicate) :
                    (predicate[(cols[parseInt(p.toString(), 10)].predicate) as string] as Function)(
                        cols[parseInt(p.toString(), 10)].field, cols[parseInt(p.toString(), 10)].operator,
                        cols[parseInt(p.toString(), 10)].value, !getCaseValue(cols[parseInt(p.toString(), 10)]),
                        cols[parseInt(p.toString(), 10)].ignoreAccent);
            }
        }
        if (moduleName === 'UrlAdaptor' && predicateLength !== predicate.predicates.length) {
            predicate.predicates[predicate.predicates.length - 1].operator =
                (cols[parseInt(p.toString(), 10)] as Predicate)?.operator?.toLowerCase();
        }
    }
    return predicate;
}

/**
 * Refreshes the `uid` property in filtered columns to match current grid columns.
 *
 * @template T - The type of data in the grid
 * @param {GridRef<T>} grid - Reference to the grid instance containing current columns
 * @param {FilterPredicates[]} filteredCols - Array of filtered columns with potentially stale UIDs
 * @returns {void}
 * @private
 */
export function refreshFilteredColsUid<T>(grid: GridRef<T>, filteredCols: FilterPredicates[]): void {
    for (let i: number = 0; i < filteredCols.length; i++) {
        const column: FilterPredicates = filteredCols[parseInt(i.toString(), 10)];
        const currentColumn: ColumnProps =  grid.getColumns().find((col: ColumnProps) => col.field === column.field);
        if (currentColumn) {
            column.uid = currentColumn.uid;
        }
    }
}

/**
 * Layout flattened data for hierarchical group rendering
 *
 * @private
 * @param {GroupedData[]} groupedData - Grouped data array
 * @param {Function} shouldExpandGroup - Expansion predicate function
 * @param {GroupSettings} groupSettings - Group configuration
 * @param {Set<string>} collapsedGroupKeys - Collapsed group keys
 * @param {ValueType} parentKey - Parent group key
 * @returns {Object} Result with count, currentViewData, expandedGroups, collapsedGroups
 */
//  * @param {boolean} isExpandOnlyRequired - Whether expansion is mandatory
export function getGroupLayoutFlattedData<T>(
    groupedData: GroupedData<T>[],
    shouldExpandGroup: GridProps<T>['shouldExpandGroup'],
    groupSettings: GroupSettings,
    collapsedGroupKeys: Set<string> = new Set(),
    // expandedGroupKeys: Set<string> = new Set(),
    // isExpandOnlyRequired: boolean = true,
    parentKey: ValueType = ''
): ChildInfoResult<T> {
    let count: number = 0;
    const currentViewData: (GroupedData<T> | T)[] = [];
    const fieldBasedExpandedGroupKeys: Map<string, Set<string>> = new Map();
    const fieldBasedCollapsedGroupKeys: Map<string, Set<string>> = new Map();
    const expandedGroups: string[] = [];
    const collapsedGroups: string[] = [];
    const dataLength: number = groupedData.length;
    const level: number = (groupedData?.['level'] as number) || 1;
    for (let groupIndex: number = 0; groupIndex < dataLength; groupIndex++) {
        const flattedLevel: number = level;
        const groupKeyValue: ValueType | undefined = groupedData[groupIndex as number]?.key;
        const groupKey: string = (parentKey !== '' ? parentKey + '-' : '') + groupKeyValue;
        const groupItem: GroupedData<T> | undefined = groupedData[groupIndex as number];
        const groupCount: number | undefined = groupItem?.count;
        if (groupCount && groupKey) {
            const isExpanded: boolean = (!shouldExpandGroup && ((
                (typeof(groupSettings?.defaultExpanded) === 'number' &&
                groupSettings?.defaultExpanded >= flattedLevel) ||
                (typeof(groupSettings?.defaultExpanded) === 'boolean' &&
                !!groupSettings?.defaultExpanded)))) ||
                shouldExpandGroup?.({groupKey});
            if (isExpanded) {
                count += groupCount;
            }
            const indexStr: string = groupIndex.toString();
            const itemAtIndex: GroupedData<T> = groupedData[parseInt(indexStr, 10) as number];
            itemAtIndex.flattedKey = groupKey;
            itemAtIndex.flattedLevel = flattedLevel;

            currentViewData.push(itemAtIndex);
            type GroupItemType = GroupedData<T> & {items?: GroupedData<T>[]};
            const groupedDataAtIndex: GroupItemType | undefined = groupedData?.[groupIndex as number] as GroupItemType | undefined;
            const childItems: GroupedData<T>[] = groupedDataAtIndex?.items as GroupedData<T>[];
            const childInfo: ChildInfoResult<T> = getGroupLayoutFlattedData(
                childItems, shouldExpandGroup, groupSettings, collapsedGroupKeys, groupKey //, expandedGroupKeys isExpandOnlyRequired
            );
            if (isExpanded) {
                expandedGroups.push(groupKey, ...childInfo.expandedGroups);
                if (itemAtIndex?.field) {
                    const fieldGroupKeys: Set<string> = fieldBasedExpandedGroupKeys.get(itemAtIndex.field) || new Set();
                    fieldGroupKeys.add(groupKey);
                    fieldBasedExpandedGroupKeys.set(itemAtIndex.field, fieldGroupKeys);
                }
                childInfo.fieldBasedExpandedGroupKeys.forEach((keys: Set<string>, field: string) => {
                    if (field) {
                        const existingKeys: Set<string> = fieldBasedExpandedGroupKeys.get(field) || new Set();
                        fieldBasedExpandedGroupKeys.set(field, new Set([...existingKeys, ...keys]));
                    }
                });
                if (childInfo.collapsedGroups.length) {
                    collapsedGroups.push(...childInfo.collapsedGroups);
                    childInfo.fieldBasedCollapsedGroupKeys.forEach((keys: Set<string>, field: string) => {
                        if (field) {
                            const existingKeys: Set<string> = fieldBasedCollapsedGroupKeys.get(field) || new Set();
                            fieldBasedCollapsedGroupKeys.set(field, new Set([...existingKeys, ...keys]));
                        }
                    });
                }
            } else {
                collapsedGroups.push(groupKey, ...childInfo.collapsedGroups);
                if (itemAtIndex?.field) {
                    const fieldGroupKeys: Set<string> = fieldBasedCollapsedGroupKeys.get(itemAtIndex.field) || new Set();
                    fieldGroupKeys.add(groupKey);
                    fieldBasedCollapsedGroupKeys.set(itemAtIndex.field, fieldGroupKeys);
                }
                childInfo.fieldBasedCollapsedGroupKeys.forEach((keys: Set<string>, field: string) => {
                    if (field) {
                        const existingKeys: Set<string> = fieldBasedCollapsedGroupKeys.get(field) || new Set();
                        fieldBasedCollapsedGroupKeys.set(field, new Set([...existingKeys, ...keys]));
                    }
                });
            }
            if (isExpanded) { // || expandedGroupKeys.has(groupKey) !isExpandOnlyRequired
                count += childInfo.count;
                currentViewData.push(...childInfo.currentViewData);
            }
        } else {
            if (!collapsedGroupKeys.has(parentKey as string)) {
                currentViewData.push(...groupedData);
            }
            break;
        }
    }
    return {
        count, currentViewData, expandedGroups, collapsedGroups,
        fieldBasedExpandedGroupKeys, fieldBasedCollapsedGroupKeys
    };
}

export const getExpandedCountBeforePage: (
    page: number, groupSettings: GroupSettings, pageWiseExpandedRef: RefObject<Map<number, number>>
) => number =
    (page: number, groupSettings: GroupSettings, pageWiseExpandedRef: RefObject<Map<number, number>>): number => {
        let expandedGroupRowsCount: number = 0;
        if (!groupSettings?.enabled || !groupSettings?.columns?.length) { return expandedGroupRowsCount; }
        const loadedPagesKeys: number[] = Array.from(pageWiseExpandedRef.current?.keys());
        for (let loadedPage: number = 0; loadedPage < loadedPagesKeys.length; loadedPage++) {
            const loadedPageExpandedCount: number = pageWiseExpandedRef.current?.get(
                loadedPagesKeys[loadedPage as number]);
            const pageKey: number = loadedPagesKeys?.[loadedPage as number];
            if (pageKey && pageKey < page) {
                expandedGroupRowsCount += loadedPageExpandedCount;
            }
        }
        return expandedGroupRowsCount;
    };

export const updatePageWiseStartEndIndexes: (totalCount: number, pageSize: number, groupSettings: GroupSettings,
    loadedPageWiseGroupExpandedCountRef: RefObject<Map<number, number>>) => Map<number, { startIndex: number, endIndex: number }> =
(totalCount: number, pageSize: number, groupSettings: GroupSettings,
 loadedPageWiseGroupExpandedCountRef: RefObject<Map<number, number>>): Map<number, {
    startIndex: number, endIndex: number
}> => {
    const loadedPageWiseVirtualGroupStartEndRowIndexes: Map<number, { startIndex: number, endIndex: number }> = new Map();
    for (let currentPage: number = 1; currentPage <= Math.ceil(totalCount / pageSize); currentPage++) {
        loadedPageWiseVirtualGroupStartEndRowIndexes.set(currentPage, {
            startIndex: ((currentPage - 1) * pageSize) +
                getExpandedCountBeforePage(currentPage, groupSettings, loadedPageWiseGroupExpandedCountRef),
            endIndex: (((currentPage) * pageSize) +
                getExpandedCountBeforePage(currentPage + 1, groupSettings, loadedPageWiseGroupExpandedCountRef)) - 1
        });
    }
    return loadedPageWiseVirtualGroupStartEndRowIndexes;
};

export const getPageFromRowIndex: (startRowIndex: number, endRowIndex: number, pageWiseStartEndIndexes: Map<number, {
    startIndex: number, endIndex: number
}>) => { startPage: number, endPage: number } =
(startRowIndex: number, endRowIndex: number, pageWiseStartEndIndexes: Map<number, {startIndex: number, endIndex: number}>): {
    startPage: number, endPage: number
} => {
    const pageWiseKeys: number[] = Array.from(pageWiseStartEndIndexes.keys()).sort((a: number, b: number) => a - b);
    let startPage: number = pageWiseKeys?.[0];
    let endPage: number = pageWiseKeys?.[pageWiseKeys.length - 1 as number];
    let isStartDefined: boolean = false;
    let isEndDefined: boolean = false;
    for (let keyIndex: number = 0; keyIndex < pageWiseKeys?.length; keyIndex++) {
        if (!isStartDefined && startRowIndex >= pageWiseStartEndIndexes?.get(pageWiseKeys?.[keyIndex as number])?.startIndex &&
            startRowIndex <= pageWiseStartEndIndexes?.get(pageWiseKeys?.[keyIndex as number])?.endIndex) {
            startPage = pageWiseKeys?.[keyIndex as number];
            isStartDefined = true;
        }
        if (!isEndDefined && endRowIndex >= pageWiseStartEndIndexes?.get(pageWiseKeys?.[keyIndex as number])?.startIndex &&
            endRowIndex <= pageWiseStartEndIndexes?.get(pageWiseKeys?.[keyIndex as number])?.endIndex) {
            endPage = pageWiseKeys?.[keyIndex as number];
            isEndDefined = true;
        }
        if (isStartDefined && isEndDefined) {
            return {startPage, endPage};
        }
    }
    return {startPage, endPage};
};

/**
 * @param {ColumnProps[]} visibleColumns - Visible columns all columns
 * @returns {ColumnProps[]} Returns the without checkbox and command columns.
 * @private
 */
export function getWithoutCheckBoxandCommandColumn(visibleColumns: ColumnProps[]): ColumnProps[] {
    return visibleColumns?.filter((column: ColumnProps) => column.type !== 'checkbox' && !column.getCommandItems);
}
