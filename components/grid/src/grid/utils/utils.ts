
import { DateFormatOptions, NumberFormatOptions } from '@syncfusion/react-base/src/internationalization';
import { isNullOrUndefined, isUndefined, extend as baseExtend, extend } from '@syncfusion/react-base/src/util';
import { getDatePattern } from '@syncfusion/react-base/src/internationalization';
import { removeClass, addClass } from '@syncfusion/react-base/src/dom';
import { initializeTelemetryFeature } from '@syncfusion/react-base/src/telemetry';
import { EditSettings } from '../types/edit.interfaces';
import { ChildInfoResult, GroupSummary } from '../types/grouping.interfaces';
import { IValueFormatter, ValueType } from '../types/interfaces';
import { AggregateType, ColumnType, AutoSelectMode, GroupSummaryPosition, ColumnPinDirection, PinScope } from '../types/enum';
import { VirtualSettings } from '../types/virtualization.interface';
import { IRow } from '../types/interfaces';
import { GridProps } from '../types/grid.interfaces';
import { GroupedData, GroupSettings } from '../types/grouping.interfaces';
import { GridTelemetryFeatures, ScrollMode } from '../types/enum';
import { AggregateData, AggregateRowProps } from '../types/aggregate.interfaces';
import { FilterPredicates } from '../types/filter.interfaces';
import { ServiceLocator } from '../types/interfaces';
import { payload } from '../types/edit.interfaces';
import { GridRef, GridModules, IGridBase } from '../types/grid.interfaces';
import { SideBarToolPanel } from '../types/sidebar.interfaces';
import { ColumnProps, HeaderValueAccessorProps, ValueAccessorProps, IColumnBase, PinDirectionInput } from '../types/column.interfaces';
import { PinningSettings } from '../types/pinning.interfaces';
import { ReactElement, RefObject, Children, ReactNode, isValidElement, JSX, cloneElement } from 'react';
import { Columns, RenderBase } from '../views/Render';
import { DataManager, DataUtil, Predicate, Query } from '@syncfusion/react-data';
import {
    MODULE_INJECTION_REMINDER_HEADER,
    buildModuleInjectionReminderBody,
    CLIPBOARD_MODULE_REQUIRED_REMINDER,
    SEARCH_MODULE_REQUIRED_REMINDER,
    FILTER_MODULE_REQUIRED_REMINDER,
    COLUMN_TOOL_PANEL_MODULE_REQUIRED_REMINDER,
    FILTER_TOOL_PANEL_MODULE_REQUIRED_REMINDER,
    EDIT_MODULE_REQUIRED_REMINDER,
    GROUP_MODULE_REQUIRED_REMINDER,
    TREE_MODULE_REQUIRED_REMINDER,
    PAGER_MODULE_REQUIRED_REMINDER,
    AGGREGATE_MODULE_REQUIRED_REMINDER,
    TOOLBAR_MODULE_REQUIRED_REMINDER,
    CONTEXTMENU_MODULE_REQUIRED_REMINDER,
    ROWREORDER_MODULE_REQUIRED_REMINDER,
    COLUMNCHOOSER_MODULE_REQUIRED_REMINDER,
    COMMANDCOLUMN_MODULE_REQUIRED_REMINDER,
    DETAILGRID_MODULE_REQUIRED_REMINDER,
    REORDER_MODULE_REQUIRED_REMINDER,
    RESIZE_MODULE_REQUIRED_REMINDER,
    PINNING_MODULE_REQUIRED_REMINDER
} from '../constants/warnings';
import { Aggregates } from '../views/Aggregate';
import { FormulaModuleResult, FormulaValue } from '../types';

const CHILD_GRID_STORAGE_REGEX: RegExp = /^detail-grid::/i;

/**
 * Removes child-grid local storage entries created by master-detail grids.
 *
 * @param {boolean} isParentGrid - Whether the caller is the top-level parent grid.
 * @returns {void}
 * @private
 */
export const clearChildGridLocalStorage: (isParentGrid?: boolean) => void = (isParentGrid?: boolean): void => {
    if (!window?.localStorage || !isParentGrid) {
        return;
    }
    const keysToRemove: string[] = [];
    for (let i: number = 0; i < window.localStorage.length; i++) {
        const key: string | null = window.localStorage.key(i);
        if (key && CHILD_GRID_STORAGE_REGEX.test(key)) {
            keysToRemove.push(key);
        }
    }
    keysToRemove.forEach((key: string): void => {
        window.localStorage.removeItem(key);
    });
};

/**
 * Determines whether row pinning is enabled for the configured pinning scope.
 *
 * @param {PinningSettings | undefined} pinningSettings - Grid pinning configuration.
 * @returns {boolean} `true` when row pinning is enabled.
 * @private
 */
export const isRowPinningEnabled: (pinningSettings?: PinningSettings) => boolean =
    (pinningSettings?: PinningSettings): boolean => !!pinningSettings?.enabled &&
        (pinningSettings.type === PinScope.Row || pinningSettings.type === PinScope.Both);

/**
 * Determines whether column pinning is enabled for the configured pinning scope.
 *
 * @param {PinningSettings | undefined} pinningSettings - Grid pinning configuration.
 * @returns {boolean} `true` when column pinning is enabled.
 * @private
 */
export const isColumnPinningEnabled: (pinningSettings?: PinningSettings) => boolean =
    (pinningSettings?: PinningSettings): boolean => !!pinningSettings?.enabled &&
        (pinningSettings.type === PinScope.Column || pinningSettings.type === PinScope.Both);

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
 * Collects rows from pinned-top, content and pinned-bottom tables into a single array.
 *
 * @param {RefObject<GridRef>} gridRef - Grid ref containing table accessors
 * @param {string} [selector] - Optional selector to filter returned rows
 * @returns {HTMLTableRowElement[]} Combined array of content row elements
 * @private
 */
export function getAllContentRows(gridRef: RefObject<GridRef>, selector?: string): HTMLTableRowElement[] {
    const rows: HTMLTableRowElement[] = [
        ...Array.from(gridRef.current?.getPinnedTopTable?.()?.rows ?? []),
        ...Array.from(gridRef.current?.getContentTable?.()?.rows ?? []),
        ...Array.from(gridRef.current?.getPinnedBottomTable?.()?.rows ?? [])
    ];

    return selector ? rows.filter((row: HTMLTableRowElement) => row.matches(selector)) : rows;
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
 * Builds the visible colgroup entries for a virtualized table while preserving the
 * default column order for non-pinned grids and only applying the pinned-column
 * override when pinning is active.
 *
 * @param {JSX.Element[]} colElements - All generated `<col>` elements.
 * @param {ColumnProps<T>[]} visibleColumns - The currently visible column model.
 * @param {Map<string, {Column: ReactNode, Col: ReactNode}>} [leftPinnedColumns] - Left-pinned column map.
 * @param {Map<string, {Column: ReactNode, Col: ReactNode}>} [rightPinnedColumns] - Right-pinned column map.
 * @param {number} [startIndex] - Virtualized start index.
 * @param {number} [endIndex] - Virtualized end index.
 * @returns {{ visibleCols: JSX.Element[], totalWidth: number }} The ordered visible columns and their total width.
 * @private
 */
export function buildVisibleColumnGroup<T>(
    colElements: JSX.Element[],
    visibleColumns: ColumnProps<T>[],
    leftPinnedColumns?: Map<string, { Column: ReactNode, Col: ReactNode }>,
    rightPinnedColumns?: Map<string, { Column: ReactNode, Col: ReactNode }>,
    startIndex: number = 0,
    endIndex: number = colElements.length
): { visibleCols: JSX.Element[]; totalWidth: number } {
    const visibleCols: JSX.Element[] = [];
    const leftColumns: Map<string, { Column: ReactNode, Col: ReactNode }> = leftPinnedColumns ?? new Map();
    const rightColumns: Map<string, { Column: ReactNode, Col: ReactNode }> = rightPinnedColumns ?? new Map();
    const hasPinnedColumns: boolean = leftColumns.size > 0 || rightColumns.size > 0;
    let totalWidth: number = 0;

    if (!hasPinnedColumns) {
        const visibleColumnIds: Set<string> = new Set<string>();
        for (let i: number = startIndex; i < endIndex; i++) {
            const columnUid: string | undefined = visibleColumns[i as number]?.uid;
            if (columnUid && !visibleColumnIds.has(columnUid)) {
                const col: JSX.Element = colElements[i as number];
                if (!col) { continue; }
                visibleCols.push(col);
                visibleColumnIds.add(columnUid);
                totalWidth += parseUnit(col?.props?.style?.width);
            }
        }
        return { visibleCols, totalWidth };
    }

    const uniqueUid: Set<string> = new Set<string>();
    const pinnedUids: Set<string> = new Set<string>([
        ...Array.from(leftColumns.values()).map((item: { Column: ReactNode, Col: ReactNode }) =>
            (item.Column as JSX.Element)?.props?.uid),
        ...Array.from(rightColumns.values()).map((item: { Column: ReactNode, Col: ReactNode }) =>
            (item.Column as JSX.Element)?.props?.uid)
    ]);
    const colByUid: Map<string, JSX.Element> = new Map<string, JSX.Element>(
        colElements.map((col: JSX.Element) => [String(col.props?.['data-uid']), col])
    );

    for (const field of leftColumns.keys()) {
        const sourceCol: JSX.Element = leftColumns.get(field)?.Col as JSX.Element;
        const pinnedColumn: JSX.Element = leftColumns.get(field)?.Column as JSX.Element;
        const col: JSX.Element = cloneElement(sourceCol, {
            style: {
                ...sourceCol.props?.style,
                width: pinnedColumn?.props?.width ?? sourceCol.props?.style?.width
            },
            'data-order-index': pinnedColumn?.props?.orderIndex ?? sourceCol.props?.['data-order-index']
        });
        visibleCols.push(col);
        const styleWidth: number = col?.props?.style?.width;
        uniqueUid.add((leftColumns.get(field)?.Column as JSX.Element)?.props?.uid);
        totalWidth += parseUnit(styleWidth);
    }

    for (let i: number = startIndex; i < endIndex; i++) {
        const visibleColumn: ColumnProps<T> | undefined = visibleColumns[i as number];
        const columnUid: string | undefined = visibleColumn?.uid;
        if (columnUid && !uniqueUid.has(columnUid) && !pinnedUids.has(columnUid)) {
            const col: JSX.Element | undefined = colByUid.get(String(columnUid));
            if (!col) { continue; }
            const sizedCol: JSX.Element = cloneElement(col, {
                style: { ...col.props?.style, width: visibleColumn.width },
                'data-order-index': visibleColumn.orderIndex
            });
            visibleCols.push(sizedCol);
            const styleWidth: number = sizedCol?.props?.style?.width;
            uniqueUid.add(columnUid);
            totalWidth += parseUnit(styleWidth);
        }
    }

    for (const field of rightColumns.keys()) {
        const pinnedColumn: JSX.Element = rightColumns.get(field)?.Column as JSX.Element;
        const sourceCol: JSX.Element = rightColumns.get(field)?.Col as JSX.Element;
        if (field && !uniqueUid.has(pinnedColumn?.props?.uid)) {
            const col: JSX.Element = cloneElement(sourceCol, {
                style: {
                    ...sourceCol.props?.style,
                    width: pinnedColumn?.props?.width ?? sourceCol.props?.style?.width
                },
                'data-order-index': pinnedColumn?.props?.orderIndex ?? sourceCol.props?.['data-order-index']
            });
            visibleCols.push(col);
            const styleWidth: number = col?.props?.style?.width;
            uniqueUid.add((rightColumns.get(field)?.Column as JSX.Element)?.props?.uid);
            totalWidth += parseUnit(styleWidth);
        }
    }

    return { visibleCols, totalWidth };
}

/**
 * Determines whether a column width uses a dynamic CSS width value.
 * Identifies empty strings, the `auto` keyword, and percentage-based widths.
 *
 * @param {string | number} width - The column width to evaluate.
 * @returns {boolean} True when the width is dynamic; otherwise, false.
 * @private
 */
export function isDynamicWidth(width: string | number): boolean {
    return typeof width === 'string' && (width === 'auto' || width === '' || width.indexOf('%') > -1);
}

/**
 * Normalises a `ColumnProps.pinDirection` value to a concrete `ColumnPinDirection` enum.
 *
 * Accepted inputs (matches the `cellClass`-style ergonomics):
 * `ColumnPinDirection` enum member — returned as-is.
 * `string` — case-insensitive match against `'Left' | 'Right' | 'None'`; unknown strings collapse to `fallback` (defaults to `ColumnPinDirection.None`).
 * `(column) => ColumnPinDirection | string` — invoked once with `column` and the result is re-resolved recursively.
 *
 * @template T - Row item type carried by the column.
 * @param {PinDirectionInput<T>} value - Column-level pin direction input (static value or callback).
 * @param {ColumnProps<T>} column - Column passed to the callback form so the function variant is fully exercised.
 * @param {ColumnPinDirection} [fallback] - Direction returned when no recognisable value is produced.
 * @returns {ColumnPinDirection} The resolved pin direction enum value.
 * @private
 */
export function resolvePinDirection<T>(
    value: PinDirectionInput<T>,
    column: ColumnProps<T>,
    fallback: ColumnPinDirection = ColumnPinDirection.None
): ColumnPinDirection {
    if (typeof value === 'function') {
        return resolvePinDirection<T>(value(column), column, fallback);
    }
    if (typeof value === 'string') {
        const normalized: string = value.toLowerCase();
        if (normalized === 'left') { return ColumnPinDirection.Left; }
        if (normalized === 'right') { return ColumnPinDirection.Right; }
        if (normalized === 'none') { return ColumnPinDirection.None; }
        return fallback;
    }
    return value ?? fallback;
}

/**
 * Calculates cumulative sticky offsets for left-pinned columns.
 *
 * @template T - Row data type carried by the columns.
 * @param {RefObject<ColumnProps<T>[]>} uiColumns - Ref to the current grid columns, if available.
 * @param {ColumnProps<T>[]} columns - Prepared grid columns.
 * @returns {Map<string, number>} Left offsets keyed by field or header text.
 * @private
 */
export function getLeftPinnedOffsets<T>(uiColumns: RefObject<ColumnProps<T>[]>, columns: ColumnProps<T>[]): Map<string, number> {
    const result: Map<string, number> = new Map<string, number>();
    const cols: ColumnProps<T>[] =
        [...((uiColumns.current ?? columns) as ColumnProps<T>[])]
            .sort((a: ColumnProps<T>, b: ColumnProps<T>) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
    let acc: number = 0;
    for (const col of cols) {
        if (col.visible !== false && col.pinDirection === ColumnPinDirection.Left) {
            result.set(col.field ?? col.headerText, acc);
            acc += parseUnit(col.width);
        }
    }
    return result;
}

/**
 * Calculates cumulative sticky offsets for right-pinned columns.
 *
 * @template T - Row data type carried by the columns.
 * @param {RefObject<ColumnProps<T>[]>} uiColumns - Ref to the current grid columns, if available.
 * @param {ColumnProps<T>[]} columns - Prepared grid columns.
 * @returns {Map<string, number>} Right offsets keyed by field or header text.
 * @private
 */
export function getRightPinnedOffsets<T>(uiColumns: RefObject<ColumnProps<T>[]>, columns: ColumnProps<T>[]): Map<string, number> {
    const result: Map<string, number> = new Map<string, number>();
    const cols: ColumnProps<T>[] =
        [...((uiColumns.current ?? columns) as ColumnProps<T>[])]
            .sort((a: ColumnProps<T>, b: ColumnProps<T>) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
    let acc: number = 0;
    for (let i: number = cols.length - 1; i >= 0; i--) {
        const col: ColumnProps<T> = cols[i as number];
        if (col.visible !== false && col.pinDirection === ColumnPinDirection.Right) {
            result.set(col.field ?? col.headerText, acc);
            acc += parseUnit(col.width);
        }
    }
    return result;
}

/**
 * Calculates the width of left-pinned columns that occur after the first gap
 * in their original visible-column positions.
 *
 * @param {Map<string, {Column: ReactNode, Col: ReactNode}>} leftPinnedColumns - Left-pinned column elements keyed by field.
 * @param {Map<string, number>} uidOrderMap - Original visible-column positions keyed by UID.
 * @returns {number} Width of non-contiguous left-pinned columns.
 * @private
 */
export function getNonContinuousLeftPinnedWidth(
    leftPinnedColumns?: Map<string, {Column: ReactNode; Col: ReactNode}>,
    uidOrderMap?: Map<string, number>
): number {
    const pinnedColumns: Array<{order: number; width: number}> = Array.from(leftPinnedColumns?.values() ?? [])
        .map((pinnedColumn: {Column: ReactNode; Col: ReactNode}) => {
            const column: JSX.Element = pinnedColumn.Column as JSX.Element;
            const uid: string = column?.props?.uid;
            return {
                order: uidOrderMap?.get(uid) ?? Number.MAX_SAFE_INTEGER,
                width: parseUnit(column?.props?.width ?? (pinnedColumn.Col as JSX.Element)?.props?.style?.width)
            };
        })
        .filter((column: {order: number; width: number}) => column.order !== Number.MAX_SAFE_INTEGER)
        .sort((first: {order: number}, second: {order: number}) => first.order - second.order);
    const firstGapIndex: number = pinnedColumns.findIndex((column: {order: number}, index: number) => index > 0 &&
        column.order !== pinnedColumns[index - 1].order + 1);
    return firstGapIndex === -1 ? 0 : pinnedColumns
        .slice(firstGapIndex)
        .reduce((width: number, column: {width: number}) => width + column.width, 0);
}

/**
 * Calculates the width of left-pinned columns outside the active virtual column range.
 *
 * @param {Map<string, {Column: ReactNode, Col: ReactNode}>} leftPinnedColumns - Left-pinned column elements keyed by field.
 * @param {number} startIndex - First active virtual column index.
 * @param {number} endIndex - Exclusive end of the active virtual column range.
 * @returns {number} Width used to offset the virtual table.
 * @private
 */
export function getLeftPinnedWidth(
    leftPinnedColumns: Map<string, {Column: ReactNode; Col: ReactNode}>,
    startIndex: number,
    endIndex: number
): number {
    let width: number = 0;
    for (const pinnedColumn of leftPinnedColumns?.values() ?? []) {
        const column: JSX.Element = pinnedColumn.Column as JSX.Element;
        const orderIndex: number | undefined = column?.props?.orderIndex;
        if (orderIndex !== undefined && (orderIndex < startIndex || orderIndex >= endIndex)) {
            width += parseUnit(column?.props?.width ?? (pinnedColumn.Col as JSX.Element)?.props?.style?.width);
        }
    }
    return width;
}

/**
 * Gets the outermost left-pinned column field from cumulative offsets.
 *
 * @param {Map<string, number>} offsets - Left-pinned offsets ordered by column position.
 * @returns {string | undefined} Outermost left-pinned field.
 * @private
 */
export function getLeftPinnedBoundaryField(offsets: Map<string, number>): string | undefined {
    let boundaryField: string | undefined;
    let boundaryOffset: number = -1;
    offsets.forEach((offset: number, field: string) => {
        if (offset > boundaryOffset) {
            boundaryOffset = offset;
            boundaryField = field;
        }
    });
    return boundaryField;
}

/**
 * Gets the outermost right-pinned column field from cumulative offsets.
 *
 * @param {Map<string, number>} offsets - Right-pinned offsets ordered by column position.
 * @returns {string | undefined} Outermost right-pinned field.
 * @private
 */
export function getRightPinnedBoundaryField(offsets: Map<string, number>): string | undefined {
    let boundaryField: string | undefined;
    let boundaryOffset: number = -1;
    offsets.forEach((offset: number, field: string) => {
        if (offset > boundaryOffset) {
            boundaryOffset = offset;
            boundaryField = field;
        }
    });
    return boundaryField;
}

/**
 * Clamps a proposed column width to the column's `minWidth` / `maxWidth` constraints.
 * Always floors the value at `0` before clamping so negative inputs collapse to 0, then honor the lower bound, then the upper bound.
 * Returns the constrained value as a positive number safe to write back as `<column>.width`.
 *
 * @param {ColumnProps} column - Column whose `minWidth` and `maxWidth` constraints are applied.
 * @param {number} proposedWidth - Proposed pixel width before constraint enforcement.
 * @returns {number} Constrained width in pixels within `[0, column.maxWidth]` (with a `column.minWidth` floor when defined).
 * @private
 */
export function applyColumnWidthConstraints(column: ColumnProps, proposedWidth: number): number {
    let constrained: number = Math.max(0, proposedWidth);
    if (!isNullOrUndefined(column.minWidth) && constrained < column.minWidth) {
        constrained = column.minWidth;
    }
    if (!isNullOrUndefined(column.maxWidth) && constrained > column.maxWidth) {
        constrained = column.maxWidth;
    }
    return constrained;
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
    isColTypeDef?: RefObject<boolean>, getPrimaryKeyFieldNames?: () => string[], formulaModule?: FormulaModuleResult) => ColumnProps =
(data: Object, newColumn: Partial<IColumnBase>, serviceLocator: ServiceLocator,
 isColTypeDef?: RefObject<boolean>, getPrimaryKeyFieldNames?: () => string[], formulaModule?: FormulaModuleResult ): ColumnProps => {
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
        newColumn.sortComparer = function(this: ColumnProps, x: number | string, y: number | string,
                                          xObj?: Object, yObj?: Object): number | string {
            const sortDirection: string = this?.sortDirection ?? newColumn.sortDirection;
            if (typeof a === 'string') {
                a = getObject(a, window) as Function;
            }
            if (sortDirection === 'Descending') {
                const z: number | string = x as number | string;
                x = y;
                y = z;
                const obj: Object = xObj;
                xObj = yObj;
                yObj = obj;
            }
            return a(x, y, xObj, yObj, sortDirection);
        };
    }
    if (!newColumn.sortComparer && newColumn.allowFormula && formulaModule) {
        newColumn.sortComparer = function(this: ColumnProps, x: string | number, y: string | number,
                                          xObj?: Object, yObj?: Object): number | string {
            let xValue: string | number = x;
            let yValue: string | number = y;
            const sortDirection: string = this?.sortDirection ?? newColumn.sortDirection;
            if (xObj && yObj) {
                const primaryKeyField: string | undefined = getPrimaryKeyFieldNames?.()[0];
                if (primaryKeyField) {
                    const xPrimaryKey: string | number = xObj[`${primaryKeyField}`] as string | number;
                    const yPrimaryKey: string | number = yObj[`${primaryKeyField}`] as string | number;
                    if (!isNullOrUndefined(xPrimaryKey) && !isNullOrUndefined(yPrimaryKey)) {
                        const xFormulaValue: FormulaValue | undefined = typeof xValue === 'string' && xValue.trim().startsWith('=') ?
                            formulaModule.getFormulaValue(xPrimaryKey, newColumn.field)
                            : xValue;
                        const yFormulaValue: FormulaValue | undefined = typeof yValue === 'string' && yValue.trim().startsWith('=') ?
                            formulaModule.getFormulaValue(yPrimaryKey, newColumn.field)
                            : yValue;
                        xValue = xFormulaValue as string | number;
                        yValue = yFormulaValue as string | number;
                    } else {
                        xValue = xObj[newColumn.field];
                        yValue = yObj[newColumn.field];
                    }
                }
            }
            return sortDirection === 'Descending' ? DataUtil.fnDescending(xValue, yValue)
                : DataUtil.fnAscending(xValue, yValue);
        };
    }
    if (!newColumn.filterComparer && newColumn.allowFormula && formulaModule) {
        newColumn.filterComparer = function(field: string, record: Object): FormulaValue {
            const primaryKeyField: string | undefined = getPrimaryKeyFieldNames?.()[0];
            if (primaryKeyField) {
                const xPrimaryKey: string | number = record[`${primaryKeyField}`];
                const value: string | number = record[`${field}`];
                if (typeof value === 'string' && value.trim().startsWith('=') && !isNullOrUndefined(xPrimaryKey)) {
                    const xFormulaValue: FormulaValue = formulaModule.getFormulaValue(xPrimaryKey, newColumn.field);
                    return xFormulaValue;
                } else {
                    return value;
                }
            }
            return undefined;
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
    const first: FilterPredicates = cols[0];
    first.ignoreAccent = !isNullOrUndefined(first.ignoreAccent) ? first.ignoreAccent : false;
    if (first.type === 'date' || first.type === 'datetime' || first.type === 'dateonly') {
        predicate = getDatePredicate(first, first.type, isExecuteLocal);
    } else {
        predicate = first.ejpredicate ? first.ejpredicate as Predicate :
            new Predicate(
                first.field, first.operator, first.value, !getCaseValue(first),
                first.ignoreAccent, false, false, first.filterComparer) as Predicate;
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
                    cols[parseInt(p.toString(), 10)].ignoreAccent, false, false, cols[parseInt(p.toString(), 10)].filterComparer));
            }
        } else {
            if (cols[p as number].type === 'date' || cols[p as number].type === 'datetime' || cols[p as number].type === 'dateonly') {
                if (cols[parseInt(p.toString(), 10)].predicate === 'and' && cols[parseInt(p.toString(), 10)].operator === 'equal') {
                    predicate = (predicate[((cols[parseInt(p.toString(), 10)] as Predicate).predicate) as string] as Function)?.(
                        getDatePredicate(cols[parseInt(p.toString(), 10)], cols[parseInt(p.toString(), 10)].type, isExecuteLocal),
                        cols[parseInt(p.toString(), 10)].type, cols[parseInt(p.toString(), 10)].ignoreAccent,
                        cols[parseInt(p.toString(), 10)].filterComparer);
                } else {
                    predicate = (predicate[((cols[parseInt(p.toString(), 10)] as Predicate).predicate) as string] as Function)?.(
                        getDatePredicate(cols[parseInt(p.toString(), 10)], cols[parseInt(p.toString(), 10)].type, isExecuteLocal),
                        cols[parseInt(p.toString(), 10)].type, cols[parseInt(p.toString(), 10)].ignoreAccent,
                        cols[parseInt(p.toString(), 10)].filterComparer);
                }
            } else {
                predicate = cols[parseInt(p.toString(), 10)].ejpredicate ?
                    (predicate[(cols[parseInt(p.toString(), 10)] as Predicate)
                        .predicate as string] as Function)?.(cols[parseInt(p.toString(), 10)].ejpredicate) :
                    (predicate[(cols[parseInt(p.toString(), 10)].predicate) as string] as Function)?.(
                        cols[parseInt(p.toString(), 10)].field, cols[parseInt(p.toString(), 10)].operator,
                        cols[parseInt(p.toString(), 10)].value, !getCaseValue(cols[parseInt(p.toString(), 10)]),
                        cols[parseInt(p.toString(), 10)].ignoreAccent, cols[parseInt(p.toString(), 10)].filterComparer);
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
 * @param {GroupSummary | GroupSummaryPosition} groupSummary - Group summary configuration
 * @param {Map<string, string[]>} groupCaptionAggregateType - Map of group caption aggregate types
 * @param {GroupSettings} groupSettings - Group configuration
 * @param {Set<string>} collapsedGroupKeys - Collapsed group keys
 * @param {ValueType} parentKey - Parent group key
 * @param {boolean} isToggle - Whether the group is toggled
 * @param {AggregateData<T>} aggregateData - Aggregate data for the group
 * @returns {Object} Result with count, currentViewData, expandedGroups, collapsedGroups
 */
export function getGroupLayoutFlattedData<T>(
    groupedData: GroupedData<T>[],
    shouldExpandGroup: GridProps<T>['shouldExpandGroup'],
    groupSummary: GroupSummary | GroupSummaryPosition,
    groupCaptionAggregateType: Map<string, string[]>,
    groupSettings: GroupSettings,
    collapsedGroupKeys: Set<string> = new Set(),
    // expandedGroupKeys: Set<string> = new Set(),
    // isExpandOnlyRequired: boolean = true,
    parentKey: ValueType = '',
    isToggle: boolean = false,
    aggregateData?: AggregateData<T>
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
        const groupSummaryPosition: GroupSummaryPosition = typeof groupSummary === 'function' ? groupSummary?.(groupKey, level) :
            groupSummary;
        const generateGroupSummaryData: (aggregates: AggregateData<T>) => T = (aggregates: AggregateData<T>) => {
            const summaryData: object = groupSettings.columns.reduce((acc: T) => {
                if (groupCaptionAggregateType && groupCaptionAggregateType?.size) {
                    groupCaptionAggregateType?.forEach((aggregateType: string[], aggregateField: string) => {
                        acc[aggregateField as string] = aggregateType.map((type: string) =>
                            (aggregates)?.[`${aggregateField} - ${type.toLowerCase()}`] ?? ''
                        ).join(', ');
                    });
                }
                return acc;
            }, {});
            return ({
                flattedGroupSummary: true,
                ...summaryData
            } as T);
        };
        const indexStr: string = groupIndex.toString();
        const itemAtIndex: GroupedData<T> = groupedData[parseInt(indexStr, 10) as number];
        if (groupCount && (groupKey || !isNullOrUndefined(groupKey))) {
            const isExpanded: boolean = (!shouldExpandGroup && ((
                (typeof(groupSettings?.defaultExpanded) === 'number' &&
                groupSettings?.defaultExpanded >= flattedLevel) ||
                (typeof(groupSettings?.defaultExpanded) === 'boolean' &&
                !!groupSettings?.defaultExpanded)))) ||
                shouldExpandGroup?.({groupKey});
            if (isExpanded) {
                count += groupCount;
            }
            itemAtIndex.flattedKey = groupKey;
            itemAtIndex.flattedLevel = flattedLevel;

            if (groupSummaryPosition === GroupSummaryPosition.Top && isToggle && !isExpanded && groupIndex === 0) {
                currentViewData.push({flattedKey: parentKey + '-footer', flattedLevel: flattedLevel, ...generateGroupSummaryData(aggregateData)});
                count += 1;
            }
            currentViewData.push(itemAtIndex);
            if (groupSummaryPosition === GroupSummaryPosition.Top && isExpanded && !isToggle) {
                currentViewData.push({flattedKey: groupKey + '-footer', flattedLevel: flattedLevel, ...generateGroupSummaryData(itemAtIndex?.aggregates)});
                count += 1;
            }
            type GroupItemType = GroupedData<T> & {items?: GroupedData<T>[]};
            const groupedDataAtIndex: GroupItemType | undefined = groupedData?.[groupIndex as number] as GroupItemType | undefined;
            const childItems: GroupedData<T>[] = groupedDataAtIndex?.items as GroupedData<T>[];
            const childInfo: ChildInfoResult<T> = getGroupLayoutFlattedData(
                childItems, shouldExpandGroup, groupSummary, groupCaptionAggregateType, groupSettings, collapsedGroupKeys, groupKey //, expandedGroupKeys isExpandOnlyRequired
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
            if (groupSummaryPosition === GroupSummaryPosition.Bottom &&
                ((isExpanded && !isToggle) || (isToggle && !isExpanded && dataLength - 1 === groupIndex))) {
                currentViewData.push({flattedKey: isToggle ? parentKey : groupKey + '-footer', flattedLevel: flattedLevel,
                    ...generateGroupSummaryData(isToggle ? aggregateData : itemAtIndex?.aggregates)});
                count += 1;
            }
        } else {
            if (!collapsedGroupKeys.has(parentKey as string)) {
                if (aggregateData && groupSummaryPosition === GroupSummaryPosition.Top) {
                    currentViewData.push({flattedKey: groupKey + '-footer', flattedLevel: flattedLevel, ...generateGroupSummaryData(aggregateData)});
                }
                currentViewData.push(...groupedData);
                if (aggregateData && groupSummaryPosition === GroupSummaryPosition.Bottom) {
                    currentViewData.push({flattedKey: groupKey + '-footer', flattedLevel: flattedLevel, ...generateGroupSummaryData(aggregateData)});
                }
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
export function getWithoutSpecialColumns(visibleColumns: ColumnProps[]): ColumnProps[] {
    return visibleColumns?.filter((column: ColumnProps) => column.type !== 'checkbox' && !column.getCommandItems &&
        column.type !== ColumnType.RowDragAndDrop && column.type !== ColumnType.RowNumber);
}

// Type guard to check if an item is of type GroupedData<T>.
/**
 * @param {unknown} item - The value to check
 * @returns {boolean} True if the item is a GroupedData
 */
export function isGroupedData<T>(item: unknown): item is GroupedData<T> {
    return typeof item === 'object' && item !== null && 'items' in item && 'key' in item && 'count' in item;
}

const getSideBarPanelIds: <T>(sideBarConfig: unknown) => Array<string | SideBarToolPanel<T>> =
<T, >(sideBarConfig: unknown): Array<string | SideBarToolPanel<T>> => {
    if (sideBarConfig === true) {
        return ['columns', 'filters'];
    }
    if (typeof sideBarConfig === 'string') {
        return [sideBarConfig];
    }
    if (Array.isArray(sideBarConfig)) {
        return sideBarConfig as Array<string | SideBarToolPanel<T>>;
    }
    if (sideBarConfig !== null && typeof sideBarConfig === 'object') {
        const toolPanels: unknown = (sideBarConfig as { toolPanels?: unknown }).toolPanels;
        return Array.isArray(toolPanels) ? toolPanels as Array<string | SideBarToolPanel<T>> : [];
    }
    return [];
};

/**
 * @param {Partial<IGridBase<T>>} props - User provided Grid props
 * @param {AggregateRowProps[]} reactChildNodeBasedProps - React child node based props values.
 * @param {AggregateRowProps[]} reactChildNodeBasedProps.aggregates - The aggregate rows
 * @returns {void}
 * @private
 */
export const setGridTelemetryFeatureList: <T>(props: Partial<IGridBase<T>>, reactChildNodeBasedProps: {
    aggregates: AggregateRowProps[]
}) => void =
    <T>(props: Partial<IGridBase<T>>, reactChildNodeBasedProps: { aggregates: AggregateRowProps[] }): void => {
        const gridModules: GridModules<T> | undefined = props.modules?.GridAllModules ?? props.modules;

        if (gridModules?.SearchModule && props.searchSettings?.enabled) {
            initializeTelemetryFeature(GridTelemetryFeatures.Search, 'DataGrid');
        }
        if (gridModules?.FilterModule && props.filterSettings?.enabled) {
            initializeTelemetryFeature(GridTelemetryFeatures.Filter, 'DataGrid');
        }
        if (props.sortSettings?.enabled) {
            initializeTelemetryFeature(GridTelemetryFeatures.Sort, 'DataGrid');
        }
        if (gridModules?.GroupModule && props.groupSettings?.enabled) {
            initializeTelemetryFeature(GridTelemetryFeatures.Group, 'DataGrid');
        }
        if (gridModules?.TreeDataModule && props.isTreeMode) {
            initializeTelemetryFeature(GridTelemetryFeatures.TreeData, 'DataTreeGrid');
        }
        const isEditFeatureActive: boolean = !!(
            props.editSettings?.allowAdd || props.editSettings?.allowEdit || props.editSettings?.allowDelete
        );
        if ((gridModules?.EditModule || gridModules?.CommandColumnModule) && isEditFeatureActive) {
            initializeTelemetryFeature(GridTelemetryFeatures.Crud, 'DataGrid');
        }
        if (props.virtualizationSettings?.scrollMode === ScrollMode.Virtual) {
            initializeTelemetryFeature(GridTelemetryFeatures.VirtualScroll, 'DataGrid');
        } else if (props.virtualizationSettings?.scrollMode === ScrollMode.Infinite) {
            initializeTelemetryFeature(GridTelemetryFeatures.InfiniteScroll, 'DataGrid');
        }
        if (gridModules?.PagerModule && props.pageSettings?.enabled) {
            initializeTelemetryFeature(GridTelemetryFeatures.Pager, 'DataGrid');
        }
        if (gridModules?.ResizeModule && props.resizeSettings?.enabled) {
            initializeTelemetryFeature(GridTelemetryFeatures.Resize, 'DataGrid');
        }
        if (gridModules?.ReorderModule && props.reorderSettings?.enabled) {
            initializeTelemetryFeature(GridTelemetryFeatures.Reorder, 'DataGrid');
        }
        if (gridModules?.AggregateModule && (props.aggregates?.length || reactChildNodeBasedProps?.aggregates?.length)) {
            initializeTelemetryFeature(GridTelemetryFeatures.Aggregate, 'DataGrid');
        }
        if (gridModules?.ColumnChooserModule && props.showColumnChooser) {
            initializeTelemetryFeature(GridTelemetryFeatures.ColumnChooser, 'DataGrid');
        }
        if (gridModules?.ContextMenuModule && props.contextMenuSettings?.enabled) {
            initializeTelemetryFeature(GridTelemetryFeatures.ContextMenu, 'DataGrid');
        }
        if (props.selectionSettings?.enabled !== false) {
            initializeTelemetryFeature(GridTelemetryFeatures.Selection, 'DataGrid');
        }
        if (props?.isMasterDetail) {
            initializeTelemetryFeature(GridTelemetryFeatures.DetailRow, 'DataGrid');
        }
    };

/**
 * Recursively retrieves all field names from a collection of columns,
 * excluding columns where allowGroup is false.
 * Useful for collecting groupable fields in stacked header scenarios.
 *
 * @param {(ColumnProps<unknown> | ReactElement)[]} columns - The columns to extract fields from
 * @param {string[]} [fields=[]] - Accumulator array for collected field names
 * @returns {string[] | undefined} Array of field names from groupable columns
 * @private
 */
export function getAllFields(columns: (ColumnProps<unknown> | ReactElement<IColumnBase>)[], fields: string[] = []): string[] | undefined {
    // Normalize input: convert single element to array
    const columnsArray: (ColumnProps<unknown> | ReactElement)[] = Array.isArray(columns) ? columns : [columns];
    columnsArray.forEach((col: ColumnProps) => {
        if (col?.allowGroup === false || (col as ReactElement<IColumnBase>).props?.allowGroup === false) {
            return;
        }
        if (col?.field || (col as ReactElement<IColumnBase>).props?.field) {
            fields.push(col.field || (col as ReactElement<IColumnBase>).props.field);
        }
        if (col?.columns?.length || ((col as ReactElement<IColumnBase>).props?.children as ReactElement<IColumnBase>[])) {
            getAllFields(col?.columns || (col as ReactElement<IColumnBase>).props?.children as ReactElement<IColumnBase>[], fields);
        }
    });
    return fields;
}

export function getColumnByPath( columns: ColumnProps[], parentIndex: string, columnIndex: number): ColumnProps {
    let current: ColumnProps[] = columns;
    // Traverse parent path
    for (const idx of parentIndex.split('-')) {
        current = current?.[Number(idx)]?.columns;
        if (!current) {
            return undefined;
        }
    }
    // Get leaf column
    return current?.[columnIndex as number];
}

/**
 * Resolves the effective order index for a column, using the last bottom-most child for stacked headers.
 *
 * @template T - Row data type
 * @param {ColumnProps<T>} column - Column whose effective order index is resolved
 * @returns {number} Effective leaf-column order index
 * @private
 */
export function getEffectiveOrderIndex<T>(column: ColumnProps<T>): number {
    let currentColumn: ColumnProps<T> = column;
    while (currentColumn?.columns?.length) {
        currentColumn = currentColumn.columns[currentColumn.columns.length - 1] as ColumnProps<T>;
    }
    return currentColumn?.orderIndex;
}

/**
 * Checks whether column definitions contain nested columns in object or JSX form.
 *
 * @param {ColumnProps<T>[]} columns - Object-based column definitions
 * @param {ReactNode} children - JSX column definitions
 * @private
 * @returns {boolean} Whether nested columns are present
 */
export function hasNestedColumns<T>(columns?: ColumnProps<T>[], children?: ReactNode): boolean {
    if (Array.isArray(columns) && columns.some((column: ColumnProps<T>) =>
        column.columns?.length || hasNestedColumns(column.columns, column.children))) {
        return true;
    }

    return Children.toArray(children).some((child: ReactElement) => {
        if (!isValidElement(child) || child.type === Aggregates) {
            return false;
        }
        const childProps: ColumnProps<T> = child.props as ColumnProps<T>;
        const hasNestedObjectColumns: boolean = Boolean(childProps.columns?.length);
        const hasNestedJSXColumns: boolean = child.type !== Columns && child.type !== RenderBase &&
            Children.count(childProps.children) > 0;
        return hasNestedObjectColumns || hasNestedJSXColumns || hasNestedColumns(childProps.columns, childProps.children);
    });
}

/**
 * Checks if the provided children contains a Columns component
 * Handles both array and non-array children by normalizing them to an array
 *
 * @param {React.ReactNode} children - The React children to check
 * @returns { boolean }  Object containing the child array and boolean flag
 * @private
 */
export function isColumnsChild( children: React.ReactNode): boolean {
    const childArray: ReactElement[] = children ? Array.isArray(children) ? (children as ReactElement[])
        : (Children.toArray(children) as ReactElement[]) : [];
    const hasColumnsChild: boolean = !isNullOrUndefined(
        childArray.find((child: ReactElement) => isValidElement(child) && (child.type === Columns || child.type === RenderBase))
    );
    return hasColumnsChild;
}

/**
 * Emits a single `console.warn` during initial mount when `enableDevMode` is
 * true and at least one user-enabled feature is missing the corresponding
 * module from the `modules` prop.
 *
 * Runs once per grid instance, parallel to `setGridTelemetryFeatureList`.
 * Does not affect the telemetry path; both warnings are independent.
 *
 * @param {Partial<IGridBase<T>>} props - User-provided Grid props.
 * @param {object} reactChildNodeBasedProps - React child node derived state.
 * @param {AggregateRowProps[]} reactChildNodeBasedProps.aggregates - Aggregate rows resolved from `<Aggregates>` children.
 * @param {boolean} reactChildNodeBasedProps.isCommandEditEnabled - True when at least one column declares `getCommandItems`.
 * @returns {void}
 * @private
 */
export const setGridModuleInjectionWarning: <T>(props: Partial<IGridBase<T>>, reactChildNodeBasedProps: {
    aggregates: AggregateRowProps[];
    isCommandEditEnabled: boolean;
}) => void =
    <T>(props: Partial<IGridBase<T>>, reactChildNodeBasedProps: {
        aggregates: AggregateRowProps[];
        isCommandEditEnabled: boolean;
    }): void => {
        // Honour the same opt-out the user has for other dev warnings.
        if (props.enableDevMode === false) {
            return;
        }
        const modules: GridModules<T> | undefined = props.modules;
        const reminders: string[] = [];
        // Clipboard is enabled by default; treat the prop as on unless the
        // consumer has explicitly set it to `false`.
        const isClipboardRequested: boolean = props.clipboardSettings?.enabled !== false;
        if (isClipboardRequested && !modules?.ClipboardModule && !modules?.AutoFillModule && !modules?.GridAllModules) {
            reminders.push(CLIPBOARD_MODULE_REQUIRED_REMINDER);
        }
        if (props.searchSettings?.enabled && !modules?.SearchModule && !modules?.GridAllModules) {
            reminders.push(SEARCH_MODULE_REQUIRED_REMINDER);
        }
        if (props.filterSettings?.enabled && !modules?.FilterModule && !modules?.GridAllModules) {
            reminders.push(FILTER_MODULE_REQUIRED_REMINDER);
        }
        const sidebarPanels: Array<string | SideBarToolPanel<T>> = getSideBarPanelIds<T>(props.sideBar);
        const hasColumnsToolPanel: boolean = sidebarPanels.some((panel: string | SideBarToolPanel<T>) =>
            (typeof panel === 'string' ? panel : panel.id) === 'columns'
        );
        const hasFiltersToolPanel: boolean = sidebarPanels.some((panel: string | SideBarToolPanel<T>) =>
            (typeof panel === 'string' ? panel : panel.id) === 'filters'
        );
        if (hasColumnsToolPanel && !modules?.ColumnToolPanelModule && !modules?.GridAllModules) {
            reminders.push(COLUMN_TOOL_PANEL_MODULE_REQUIRED_REMINDER);
        }
        if (hasFiltersToolPanel && !modules?.FilterToolPanelModule && !modules?.GridAllModules) {
            reminders.push(FILTER_TOOL_PANEL_MODULE_REQUIRED_REMINDER);
        }
        if (props.resizeSettings?.enabled && !modules?.ResizeModule && !modules?.GridAllModules) {
            reminders.push(RESIZE_MODULE_REQUIRED_REMINDER);
        }
        if (props.reorderSettings?.enabled && !modules?.ReorderModule && !modules?.GridAllModules) {
            reminders.push(REORDER_MODULE_REQUIRED_REMINDER);
        }
        if ((props.editSettings?.allowAdd || props.editSettings?.allowEdit || props.editSettings?.allowDelete) &&
            !modules?.EditModule && !modules?.CommandColumnModule && !modules?.GridAllModules) {
            reminders.push(EDIT_MODULE_REQUIRED_REMINDER);
        }
        if (props.groupSettings?.enabled && !modules?.GroupModule && !modules?.GridAllModules) {
            reminders.push(GROUP_MODULE_REQUIRED_REMINDER);
        }
        if (props.isTreeMode && !modules?.TreeDataModule && !modules?.GridAllModules) {
            reminders.push(TREE_MODULE_REQUIRED_REMINDER);
        }
        if (props.pageSettings?.enabled && !modules?.PagerModule && !modules?.GridAllModules) {
            reminders.push(PAGER_MODULE_REQUIRED_REMINDER);
        }
        if (props.pinningSettings?.enabled && !modules?.PinningModule && !modules?.GridAllModules) {
            reminders.push(PINNING_MODULE_REQUIRED_REMINDER);
        }
        const hasAggregates: boolean = !!(
            props.aggregates?.length || reactChildNodeBasedProps?.aggregates?.length
        );
        if (hasAggregates && !modules?.AggregateModule && !modules?.GridAllModules) {
            reminders.push(AGGREGATE_MODULE_REQUIRED_REMINDER);
        }
        if (props.toolbar && props.toolbar.length > 0 && !modules?.ToolbarModule && !modules?.SearchModule &&
            !modules?.ColumnChooserModule && !modules?.EditModule && !modules?.GridAllModules) {
            reminders.push(TOOLBAR_MODULE_REQUIRED_REMINDER);
        }
        if (props.contextMenuSettings?.enabled && !modules?.ContextMenuModule && !modules?.GridAllModules) {
            reminders.push(CONTEXTMENU_MODULE_REQUIRED_REMINDER);
        }
        if (props.dragAndDropSettings?.enabled && !modules?.ReorderModule && !modules?.GridAllModules) {
            reminders.push(ROWREORDER_MODULE_REQUIRED_REMINDER);
        }
        const hasColumnChooserItem: boolean = !!(
            props.showColumnChooser ||
            (Array.isArray(props.toolbar) && props.toolbar.some((item: string | { id?: string }) =>
                (typeof item === 'string' && item === 'ColumnChooser')
            ))
        );
        if (hasColumnChooserItem && !modules?.ColumnChooserModule && !modules?.GridAllModules) {
            reminders.push(COLUMNCHOOSER_MODULE_REQUIRED_REMINDER);
        }
        if (reactChildNodeBasedProps?.isCommandEditEnabled && !modules?.CommandColumnModule && !modules?.GridAllModules) {
            reminders.push(COMMANDCOLUMN_MODULE_REQUIRED_REMINDER);
        }
        if (props.isMasterDetail && !modules?.DetailGridModule && !modules?.GridAllModules) {
            reminders.push(DETAILGRID_MODULE_REQUIRED_REMINDER);
        }
        if (reminders.length === 0) {
            return;
        }
        console.warn(`${MODULE_INJECTION_REMINDER_HEADER}\n${buildModuleInjectionReminderBody(reminders)}`);
    };


interface FlatItem {
    uid: string;
    node: ColumnProps;
    ancestors: ColumnProps[];
}

/**
 * Collect reorderable items.
 * Leaf columns are reorderable.
 * Group columns are reorderable as a whole subtree.
 *
 * @param {ColumnProps[]} columns - Columns to flatten.
 * @param {ColumnProps[]} ancestors - Ancestor columns for the current item.
 * @param {FlatItem[]} result - Accumulator for flattened column items.
 * @returns {FlatItem[]} Flattened column items.
 */
function flattenColumns(columns: ColumnProps[], ancestors: ColumnProps[] = [], result: FlatItem[] = []): FlatItem[] {
    for (const column of columns) {
        const ancestorCopy: ColumnProps[] = ancestors.map((a: ColumnProps): ColumnProps => ({...a, columns: undefined}));
        result.push({uid: column.uid, node: column, ancestors: ancestorCopy});
        if (column.columns?.length) {
            flattenColumns(column.columns, [...ancestorCopy, { ...column, columns: undefined }], result);
        }
    }

    return result;
}

/**
 * Deep clone without children.
 *
 * @param {ColumnProps} column - Column to clone.
 * @returns {ColumnProps} Column clone without child columns.
 */
function cloneWithoutChildren(column: ColumnProps): ColumnProps {
    const clone: ColumnProps = { ...column };
    delete clone.columns;
    return clone;
}

/**
 * Creates a branch (parent chain) for a leaf column during reorder.
 * Newly created ancestor columns should have undefined uid to avoid uid reuse.
 * Only leaf columns keep their original uid.
 *
 * @param {ColumnProps[]} ancestors - Ancestor columns for the leaf.
 * @param {ColumnProps} node - Leaf column to place in the branch.
 * @returns {ColumnProps} Rebuilt column branch.
 */
function createBranch(
    ancestors: ColumnProps[],
    node: ColumnProps
): ColumnProps {
    // Leaf column keeps original uid
    let current: ColumnProps = { ...node };
    // Build ancestor chain from leaf upward
    // Ancestors created during reorder should have undefined uid
    for (let i: number = ancestors.length - 1; i >= 0; i--) {
        const ancestorClone: ColumnProps = cloneWithoutChildren(ancestors[i as number]);
        // Clear uid for newly created ancestor columns
        // This prevents uid reuse and ensures new parent columns don't have identifiers
        ancestorClone.uid = undefined;
        current = {
            ...ancestorClone,
            columns: [current]
        };
    }

    return current;
}

/**
 * Merge consecutive parents having the same header.
 *
 * @param {ColumnProps[]} target - Existing branches to update.
 * @param {ColumnProps} branch - Branch to merge into the target.
 * @returns {void}
 */
function mergeBranches(target: ColumnProps[], branch: ColumnProps): void {
    const last: ColumnProps = target[target.length - 1];
    if ( last && last.headerText === branch.headerText && !!last.columns && !!branch.columns) {
        // Recursively merge children to handle nested duplicates
        // For each child in the new branch, try to merge with existing children
        for (const branchChild of branch.columns) {
            mergeBranches(last.columns, branchChild);
        }
        return;
    }

    target.push(branch);
}

/**
 * Regenerate orderIndex values for field-bearing columns in the rebuilt tree.
 * Stacked header parents do not participate in column ordering and retain an
 * undefined orderIndex. Leaf columns receive sequential indices in depth-first order.
 *
 * @param {ColumnProps[]} columns - Columns tree to regenerate orderIndex for.
 * @param {number} startIndex - Starting index for orderIndex generation.
 * @returns {number} Updated startIndex after processing all columns.
 */
function regenerateColumnOrderIndex(columns: ColumnProps[], startIndex: number = 0): number {
    let index: number = startIndex;
    for (const column of columns) {
        if (column.field) {
            column.orderIndex = index;
            index++;
        } else {
            column.orderIndex = undefined;
        }
        // Recursively regenerate orderIndex for nested columns
        if (column.columns?.length) {
            index = regenerateColumnOrderIndex(column.columns, index);
        }
    }
    return index;
}

/**
 * Build reordered output.
 *
 * @template T - Type of column data.
 * @param {ColumnProps[]} columns - Columns tree to reorder.
 * @param {string} draggedUid - UID of the dragged column.
 * @param {string} targetUid - UID of the target column.
 * @param {'before' | 'after'} position - Insertion position relative to the target.
 * @private
 * @returns {ColumnProps<T>[]} Reordered columns.
 */
export function reorderStackedColumns<T>(columns: ColumnProps[], draggedUid: string, targetUid: string,
                                         position: 'before' | 'after' = 'before'
): ColumnProps<T>[] {
    const flat: FlatItem[] = flattenColumns(columns);
    const dragged: FlatItem | undefined = flat.find((x: FlatItem) => x.uid === draggedUid);
    const target: FlatItem | undefined = flat.find((x: FlatItem) => x.uid === targetUid);
    if (!dragged || !target) {
        return columns as ColumnProps<T>[];
    }
    const draggedNode: ColumnProps<unknown> = dragged.node;
    const leaves: FlatItem[] = [];
    function flattenLeaves(source: ColumnProps[], ancestors: ColumnProps[] = []): void {
        for (const column of source) {
            if (!column.columns?.length) {
                leaves.push({uid: column.uid, node: column, ancestors});
            } else {
                flattenLeaves(column.columns, [...ancestors, cloneWithoutChildren(column)]);
            }
        }
    }
    flattenLeaves(columns);

    const targetLeafUids: Set<string> = new Set();
    const collectTargetLeafUids: (column: ColumnProps) => void = (column: ColumnProps): void => {
        if (!column.columns?.length) {
            targetLeafUids.add(column.uid);
            return;
        }
        for (const child of column.columns) {
            collectTargetLeafUids(child);
        }
    };
    collectTargetLeafUids(target.node);
    const draggedLeaves: FlatItem[] = [];
    function collectDraggedLeaves(column: ColumnProps, ancestors: ColumnProps[]): void {
        if (!column.columns?.length) {
            draggedLeaves.push({uid: column.uid, node: column, ancestors});
            return;
        }
        for (const child of column.columns) {
            collectDraggedLeaves(child, [...ancestors, cloneWithoutChildren(column)]);
        }
    }
    collectDraggedLeaves(draggedNode, dragged.ancestors);
    const draggedLeafUids: Set<string> = new Set(draggedLeaves.map((x: FlatItem) => x.uid));
    const remainingLeaves: FlatItem[] = leaves.filter((x: FlatItem) => !draggedLeafUids.has(x.uid));
    let targetBoundaryIndex: number = leaves.findIndex((leaf: FlatItem) => targetLeafUids.has(leaf.uid));
    if (position === 'after') {
        for (let index: number = leaves.length - 1; index >= 0; index--) {
            if (targetLeafUids.has(leaves[index as number].uid)) {
                targetBoundaryIndex = index;
                break;
            }
        }
    }
    const targetBoundaryUid: string = leaves[targetBoundaryIndex as number]?.uid;
    const targetLeafIndex: number = remainingLeaves.findIndex(
        (leaf: FlatItem) => leaf.uid === targetBoundaryUid
    );
    let insertIndex: number = targetLeafIndex === -1 ? remainingLeaves.length : targetLeafIndex;
    if (position === 'after' && targetLeafIndex !== -1) {
        insertIndex++;
    }
    remainingLeaves.splice(insertIndex, 0, ...draggedLeaves);
    const result: ColumnProps[] = [];
    for (const leaf of remainingLeaves) {
        const branch: ColumnProps<unknown> = createBranch(leaf.ancestors, leaf.node);
        mergeBranches(result, branch);
    }
    // Regenerate orderIndex values to ensure they are sequential after reordering
    regenerateColumnOrderIndex(result);
    return result as ColumnProps<T>[];
}

/**
 * Executes a grid action and returns a promise that resolves only after the grid's UI has committed the
 * change (an `actionComplete` DOM event), rejects when an `actionFailure` DOM event is observed, and resolves
 * when a `cancelBegin` DOM event is observed.
 *
 * @param {RefObject<GridRef>} gridRef - Reference to the grid component.
 * @param {string} requestType - The `ActionType` (or custom discriminator) identifying the action being awaited.
 * @param {Function} operation - The synchronous or asynchronous action to invoke.
 * @returns {Promise<void>} Resolves after the completion or cancel event fires; rejects on failure.
 * @private
 */
export function executeGridAsyncAction(
    gridRef: RefObject<GridRef>,
    requestType: string,
    operation: () => void | Promise<void>
): Promise<void> {
    if (requestType === 'CellValueUpdate' || requestType === 'RowDataUpdate' || requestType === 'BulkSave') {
        return Promise.resolve(operation()).then(() => undefined);
    }
    const element: (HTMLElement & { addEventListener?: HTMLElement['addEventListener'] }) | null | undefined =
        gridRef?.current?.element;
    if (!element) {
        return Promise.resolve(operation()).then(() => undefined);
    }
    return new Promise<void>((resolve: () => void, reject: (reason?: Error) => void) => {
        const cleanup: () => void = () => {
            element.removeEventListener('actionComplete', onComplete);
            element.removeEventListener('actionFailure', onFailure);
            element.removeEventListener('cancelBegin', onCancel);
        };
        const onComplete: () => void = () => {
            cleanup();
            resolve();
        };
        const onFailure: (event: Event) => void = (event: Event) => {
            cleanup();
            const failureError: unknown = (event as any)?.detail?.error;
            reject(failureError instanceof Error ? failureError : new Error(`Grid action '${requestType}' failed.`));
        };
        const onCancel: () => void = () => {
            cleanup();
            resolve();
        };
        element.addEventListener('actionComplete', onComplete);
        element.addEventListener('actionFailure', onFailure);
        element.addEventListener('cancelBegin', onCancel);
        try {
            Promise.resolve(operation()).catch((error: Error) => {
                cleanup();
                reject(error);
            });
        } catch (error) {
            cleanup();
            reject(error as Error);
        }
    });
}

/**
 * Dispatches a `cancelBegin` DOM event on the grid's root element so a pending `executeGridAsyncAction` promise
 * settles instead of remaining pending when an action is vetoed or is a no-op.
 *
 * @param {RefObject<GridRef>} gridRef - Reference to the grid component.
 * @param {string} requestType - The `ActionType` (or custom discriminator) identifying the vetoed/no-op action.
 * @returns {void}
 * @private
 */
export function dispatchGridCancelBegin(gridRef: RefObject<GridRef>, requestType: string): void {
    const element: HTMLElement | null | undefined = gridRef?.current?.element;
    element?.dispatchEvent(new CustomEvent('cancelBegin', { detail: { requestType } }));
}

/**
 * Returns the aggregate operations supported by a column type.
 *
 * @param {string} columnType - The column type to evaluate.
 * @returns {AggregateType[]} The supported aggregate operations.
 * @private
 */
export function getApplicableAggregateTypes(columnType?: string): AggregateType[] {
    const numberAggregates: AggregateType[] = [AggregateType.Sum, AggregateType.Average, AggregateType.Min, AggregateType.Max];
    const booleanAggregates: AggregateType[] = [AggregateType.TrueCount, AggregateType.FalseCount];
    const allAggregates: AggregateType[] = [AggregateType.Count, AggregateType.Custom];
    switch (columnType) {
    case ColumnType.Number:
        return [...numberAggregates, ...allAggregates];
    case ColumnType.Boolean:
        return [...booleanAggregates, ...allAggregates];
    default:
        return allAggregates;
    }
}
