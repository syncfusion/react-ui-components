import { useCallback, RefObject, useEffect, useState } from 'react';
import { FilterEvent, FilterSettings, FilterPredicates, filterModule, FilterProperties, IFilterOperator, CustomOperators } from '../types/filter.interfaces';
import { ActionType, IValueFormatter, ValueType } from '../types';
import { GridRef } from '../types/grid.interfaces';
import { IColumnBase, ColumnProps } from '../types/column.interfaces';
import { closest, extend, IL10n, isNullOrUndefined, matches} from '@syncfusion/react-base';
import { DataManager, DataUtil } from '@syncfusion/react-data';
import { getActualPropFromColl, iterateArrayOrObject } from '../utils';
import { ServiceLocator } from '../types/interfaces';

/**
 * Custom hook to manage filter state and configuration
 *
 * @private
 * @param {RefObject<GridRef>} gridRef - Reference to the grid component
 * @param {FilterSettings} filterSetting - Reference to the filter settings
 * @param {Function} setGridAction - Function to update grid actions
 * @param {ServiceLocator} serviceLocator - Defines the service locator
 * @returns {filterModule} An object containing various filter-related state and API
 */
export const useFilter: (gridRef?: RefObject<GridRef>, filterSetting?: FilterSettings,
    setGridAction?: (action: Object) => void,
    serviceLocator?: ServiceLocator) => filterModule = (gridRef?: RefObject<GridRef>,
                                                        filterSetting?: FilterSettings,
                                                        setGridAction?: (action: Object) => void,
                                                        serviceLocator?: ServiceLocator) => {
    const formatter: IValueFormatter = serviceLocator?.getService<IValueFormatter>('valueFormatter');
    const localization: IL10n = serviceLocator?.getService<IL10n>('localization');
    const [filterSettings, setFilterSettings] = useState<FilterSettings>(filterSetting);
    const getFilterProperties: FilterProperties = {
        currentTarget: null,
        isMultiSort: false,
        column: {},
        value: null,
        filterByMethod: true,
        predicate: 'and',
        operator: null,
        fieldName: null,
        ignoreAccent: null,
        caseSensitive: null,
        actualPredicate: {},
        values: {},
        cellText: {},
        refresh: true,
        contentRefresh: true,
        initialLoad: null,
        filterStatusMsg: null,
        skipStringInput: ['>', '<', '='],
        skipNumberInput: ['=', ' ', '!'],
        timer: null
    };


    const filterOperators: IFilterOperator = {
        contains: 'contains', endsWith: 'endsWith', equal: 'equal', greaterThan: 'greaterThan', greaterThanOrEqual: 'greaterThanOrEqual',
        lessThan: 'lessThan', lessThanOrEqual: 'lessThanOrEqual', notEqual: 'notEqual', startsWith: 'startsWith', wildCard: 'wildcard',
        isNull: 'isNull', isNotNull: 'isNotNull', like: 'like'
    };

    const numOptr: { value: string; text: string }[] = [
        { value: 'equal', text: localization?.getConstant('equal') },
        { value: 'greaterThan', text: localization?.getConstant('greaterThan') },
        { value: 'greaterThanOrEqual', text: localization?.getConstant('greaterThanOrEqual') },
        { value: 'lessThan', text: localization?.getConstant('lessThan') },
        { value: 'lessThanOrEqual', text: localization?.getConstant('lessThanOrEqual') },
        { value: 'notEqual', text: localization?.getConstant('notEqual') },
        { value: 'isNull', text: localization?.getConstant('isNull') },
        { value: 'isNotNull', text: localization?.getConstant('isNotNull') }
    ];
    const customOperators: CustomOperators = {
        stringOperator: [
            { value: 'startsWith', text: localization?.getConstant('startsWith') },
            { value: 'endsWith', text: localization?.getConstant('endsWith') },
            { value: 'contains', text: localization?.getConstant('contains') },
            { value: 'equal', text: localization?.getConstant('equal') },
            { value: 'isEmpty', text: localization?.getConstant('isEmpty') },
            { value: 'doesNotStartWith', text: localization?.getConstant('doesNotStartWith') },
            { value: 'doesNotEndWith', text: localization?.getConstant('doesNotEndWith') },
            { value: 'doesNotContain', text: localization?.getConstant('doesNotContain') },
            { value: 'notEqual', text: localization?.getConstant('notEqual') },
            { value: 'isNotEmpty', text: localization?.getConstant('isNotEmpty') },
            { value: 'like', text: localization?.getConstant('like') }
        ],

        numberOperator: numOptr,

        dateOperator: [
            { value: 'equal', text: localization?.getConstant('equal') },
            { value: 'greaterThan', text: localization?.getConstant('greaterThan') },
            { value: 'greaterThanOrEqual', text: localization?.getConstant('greaterThanOrEqual') },
            { value: 'lessThan', text: localization?.getConstant('lessThan') },
            { value: 'lessThanOrEqual', text: localization?.getConstant('lessThanOrEqual') },
            { value: 'notEqual', text: localization?.getConstant('notEqual') },
            { value: 'isNull', text: localization?.getConstant('isNull') },
            { value: 'isNotNull', text: localization?.getConstant('isNotNull') }
        ],

        datetimeOperator: [
            { value: 'equal', text: localization?.getConstant('equal') },
            { value: 'greaterThan', text: localization?.getConstant('greaterThan') },
            { value: 'greaterThanOrEqual', text: localization?.getConstant('greaterThanOrEqual') },
            { value: 'lessThan', text: localization?.getConstant('lessThan') },
            { value: 'lessThanOrEqual', text: localization?.getConstant('lessThanOrEqual') },
            { value: 'notEqual', text: localization?.getConstant('notEqual') },
            { value: 'isNull', text: localization?.getConstant('isNull') },
            { value: 'isNotNull', text: localization?.getConstant('isNotNull') }
        ],

        dateonlyOperator: [
            { value: 'equal', text: localization?.getConstant('equal') },
            { value: 'greaterThan', text: localization?.getConstant('greaterThan') },
            { value: 'greaterThanOrEqual', text: localization?.getConstant('greaterThanOrEqual') },
            { value: 'lessThan', text: localization?.getConstant('lessThan') },
            { value: 'lessThanOrEqual', text: localization?.getConstant('lessThanOrEqual') },
            { value: 'notEqual', text: localization?.getConstant('notEqual') },
            { value: 'isNull', text: localization?.getConstant('isNull') },
            { value: 'isNotNull', text: localization?.getConstant('isNotNull') }
        ],

        booleanOperator: [
            { value: 'equal', text: localization?.getConstant('equal') },
            { value: 'notEqual', text: localization?.getConstant('notEqual') }
        ]
    };

    /**
     * update filterSettings properties filterModule
     */
    useEffect(() => {
        setFilterSettings(filterSetting);
    }, [filterSetting]);

    /**
     * update filterSettings for column uid
     */
    useEffect(() => {
        const columns: FilterPredicates[] = gridRef.current?.filterSettings.columns;
        for (const column of columns) {
            column.uid = gridRef.current?.getColumnByField(column.field).uid;
        }
    }, [filterSettings]);

    /**
     * Initialize Filter Column when filterSetting column changes
     */
    useEffect(() => {
        if (gridRef.current.getColumns() && filterSettings?.columns?.length) {
            getFilterProperties.contentRefresh = false;
            getFilterProperties.initialLoad = true;
            for (const col of gridRef.current.filterSettings?.columns) {
                filterByColumn(
                    col.field, col.operator, col.value as string, col.predicate, col.caseSensitive,
                    col.ignoreAccent
                );
            }
            getFilterProperties.initialLoad = false;
            getFilterProperties.contentRefresh = true;
            updateFilterMsg();
        }
    }, []);

    /**
     * Handle grid-level key-press event
     */
    const mouseDownHandler: (e: React.MouseEvent) => void = useCallback((e: React.MouseEvent): void => {
        const target: Element = e.target as Element;
        if (filterSettings?.enabled && filterSettings?.type === 'FilterBar') {
            if (target.closest('th') && target.closest('th').classList.contains('sf-cell') &&
                (target.classList.contains('sf-clear-icon') || target.closest('.sf-clear-icon'))) {
                const targetText: HTMLInputElement = target.classList.contains('sf-clear-icon') ?
                    target.previousElementSibling as HTMLInputElement : filterSettings?.enableFilterBarOperator ?
                        target.closest('.sf-clear-icon').previousElementSibling.previousElementSibling as HTMLInputElement :
                        target.closest('.sf-clear-icon').previousElementSibling as HTMLInputElement;
                removeFilteredColsByField((targetText.classList.contains('sf-datepicker') ? targetText.parentElement : targetText).id.slice(0, -14)); //Length of _filterBarcell = 14
            }
            if (filterSettings?.enableFilterBarOperator && (e.target as HTMLElement).classList.contains('sf-list-item')) {
                const inputId: string = document.querySelector('.sf-popup-open').getAttribute('id').replace('_popup', '');
                if (inputId.indexOf('grid-column') !== -1) {
                    (closest(document.getElementById(inputId), 'div').querySelector('.sf-filter-text') as HTMLElement).focus();
                }
            }
        }
    }, [filterSettings, getFilterProperties]);

    /**
     * Handle grid-level key-press event
     */
    const keyUpHandler: (event: React.KeyboardEvent) => void = useCallback((event: React.KeyboardEvent): void => {
        const target: HTMLInputElement = event.target as HTMLInputElement;
        if (target && matches(target, '.sf-filter-row input')) {
            const closeHeaderEle: Element = closest(target, '.sf-filter-row th.sf-cell');
            getFilterProperties.column = gridRef.current.columns.find((col: ColumnProps) => col.uid === closeHeaderEle.getAttribute('data-mappinguid'));
            if (filterSettings?.mode === 'Immediate' || (event.keyCode === 13 && !(getFilterProperties.column && getFilterProperties.column.filterTemplate))) {
                getFilterProperties.value = target.value.trim();
                processFilter(event, target);
            }
        }
        if ((target.classList.contains('sf-filterbar-dropdown') &&  event.keyCode === 27) || (document.querySelector('.sf-popup-open.sf-filterbar-dropdown')
            && (event.keyCode === 13 ))) {
            const inputTarget: Element = closest(event.target as HTMLElement, '.sf-grid-filterbar');
            inputTarget.querySelector('input').focus();
        }
    }, [filterSettings, getFilterProperties]);

    const processFilter: (e: React.KeyboardEvent, target: HTMLInputElement) => void = (
        e: React.KeyboardEvent, target: HTMLInputElement): void => {
        stopTimer();
        startTimer(e, target);
    };

    const startTimer: (e: React.KeyboardEvent, target: HTMLInputElement) => void = (
        e: React.KeyboardEvent, target: HTMLInputElement): void => {
        getFilterProperties.timer = window.setInterval(
            () => { onTimerTick(target); },
            e.keyCode === 13 ? 0 : filterSettings?.immediateModeDelay);
    };

    const stopTimer: () => void = (): void => {
        window.clearInterval(getFilterProperties.timer);
    };

    const grabColumnByUidFromAllCols: (uid: string, field?: string) => ColumnProps = useCallback(
        (uid: string, field?: string): ColumnProps => {
            let column: ColumnProps;
            const gCols: ColumnProps[] = gridRef.current.getColumns();
            for (let i: number = 0; i < gCols?.length; i++) {
                if (uid === gCols?.[parseInt(i.toString(), 10)]?.uid || field === gCols?.[parseInt(i.toString(), 10)]?.field) {
                    column = gCols?.[parseInt(i.toString(), 10)];
                }
            }
            return column;
        }, []);

    /**
     * Removes filtered column by field name.
     *
     * @private
     * @param {string} field - DDefines column field name to remove filter.
     * @param  {boolean} isClearFilterBar -  Specifies whether the filter bar value needs to be cleared.
     * @returns {void}
     */
    const removeFilteredColsByField: (field: string, isClearFilterBar?: boolean) => void = async(
        field: string, isClearFilterBar?: boolean): Promise<void> => {

        let fCell: HTMLInputElement;
        const cols: FilterPredicates[] = gridRef.current.filterSettings?.columns;
        const colUid: string[] = cols.map((f: ColumnProps) => f.uid);
        const colField: string[] = cols.map((f: ColumnProps) => f.field);
        const filteredColsUid: string[] = colUid.filter((item: string, pos: number) => colUid.indexOf(item) === pos);
        const filteredColsFeild: string[] = colField.filter((item: string, pos: number) => colField.indexOf(item) === pos);
        for (let i: number = 0, len: number = filteredColsUid.length; i < len; i++) {
            cols[parseInt(i.toString(), 10)].uid = cols[parseInt(i.toString(), 10)].uid;
            let len: number = cols.length;
            const column: ColumnProps = grabColumnByUidFromAllCols(
                filteredColsUid[parseInt(i.toString(), 10)], filteredColsFeild[parseInt(i.toString(), 10)]);
            if (column.field === field) {
                const currentPred: FilterPredicates = gridRef.current.filterSettings?.columns?.filter?.((e: FilterPredicates) => {
                    return e.uid === column.uid; })[0];
                if (gridRef.current.filterSettings?.type === 'FilterBar' && !isClearFilterBar) {
                    const selector: string = '[id=\'' + column.field + '_filterBarcell\']';
                    fCell = gridRef.current.headerPanelRef.querySelector(selector) as HTMLInputElement;
                    fCell?.setAttribute?.('value', '');
                    delete getFilterProperties?.value;
                }
                const args: FilterEvent = {
                    cancel: false, requestType: ActionType.ClearFiltering, currentFilterPredicate: currentPred,
                    currentFilterColumn: column, action: ActionType.ClearFiltering
                };
                if (getFilterProperties.refresh) {
                    args.type = ActionType.Filtering;
                    const confirmResult: boolean = await gridRef.current?.editModule?.checkUnsavedChanges?.();
                    if (!isNullOrUndefined(confirmResult) && !confirmResult) {
                        return;
                    }
                    gridRef.current.onFilterStart?.(args);
                    if (args.cancel) {
                        refreshFilterSettings();
                        return;
                    }
                }
                while (len--) {
                    if (cols[parseInt(len.toString(), 10)] && (cols[parseInt(len.toString(), 10)].uid === column.uid ||
                        cols[parseInt(len.toString(), 10)].field === column.field)) {
                        cols.splice(len, 1);
                        if (getFilterProperties.refresh) {
                            if (cols.length === 0) {
                                setFilterSettings((prevSettings: FilterSettings) => {
                                    return { ...prevSettings, columns: [] };
                                });
                                args.type = 'actionComplete';
                                setGridAction(args);
                            } else {
                                setFilterSettings((prevSettings: FilterSettings) => {
                                    return { ...prevSettings, columns: cols || [] };
                                });
                                args.type = 'actionComplete';
                                setGridAction(args);
                            }
                        }
                    }
                }
                delete getFilterProperties.values[`${field}`];
                break;
            }
        }
        refreshFilterSettings();
        updateFilterMsg();
    };

    const onTimerTick: (target: HTMLInputElement) => void = (target: HTMLInputElement): void => {
        const filterElement: HTMLInputElement = target;
        const filterValue: string = JSON.parse(JSON.stringify(filterElement.value));
        getFilterProperties.cellText[getFilterProperties.column.field] = filterElement.value;
        stopTimer();
        if (isNullOrUndefined(getFilterProperties.value) || getFilterProperties.value === '') {
            removeFilteredColsByField(getFilterProperties.column.field);
            return;
        }
        getFilterProperties.filterByMethod = false;
        validateFilterValue(getFilterProperties.value as string);
        filterByColumn(
            getFilterProperties.column.field, getFilterProperties.operator, getFilterProperties.value, getFilterProperties.predicate,
            gridRef.current.filterSettings.caseSensitive, null);
        getFilterProperties.filterByMethod = true;
        filterElement.value = filterValue;
    };

    const validateFilterValue: (value: string) => void = (value: string): void => {
        let skipInput: string[];
        let index: number;
        getFilterProperties.caseSensitive = gridRef.current.filterSettings?.caseSensitive;
        getFilterProperties.column = gridRef.current.getColumns().find(
            (col: ColumnProps) => col.field === getFilterProperties.column.field);
        switch (getFilterProperties.column.type) {
        case 'number':
            if (getFilterProperties.column.filter.operator) {
                getFilterProperties.operator = getFilterProperties.column.filter.operator;
            } else {
                getFilterProperties.operator = filterOperators.equal;
            }
            skipInput = ['>', '<', '=', '!'];
            for (let i: number = 0; i < value.length; i++) {
                if (skipInput.indexOf(value[parseInt(i.toString(), 10)]) > -1) {
                    index = i;
                    break;
                }
            }
            getOperator(value.substring(index));
            if (index !== 0) {
                getFilterProperties.value = value.substring(0, index);
            }
            if (getFilterProperties.value !== '' && value.length >= 1 && !isNullOrUndefined(getFilterProperties.column.format)) {
                getFilterProperties.value = formatter.fromView(
                    getFilterProperties.value as string,
                    (getFilterProperties.column as IColumnBase).parseFn,
                    getFilterProperties.column.type
                );
            } else {
                getFilterProperties.value = parseFloat(getFilterProperties.value?.toString());
            }
            if (isNaN(getFilterProperties.value as number)) {
                getFilterProperties.filterStatusMsg = localization?.getConstant('invalidFilterMessage');
            }
            break;
        case 'date':
        case 'datetime':
            getFilterProperties.operator = filterOperators.equal;
            if (getFilterProperties.value !== '' && !(getFilterProperties.value instanceof Date) &&
                !isNullOrUndefined(getFilterProperties.column.format)) {
                if (isNullOrUndefined(getFilterProperties.column.filter?.filterBarType)) {
                    getOperator(value);
                }
                getFilterProperties.value  = formatter.fromView(
                    getFilterProperties.value as string,
                    (getFilterProperties.column as IColumnBase).parseFn,
                    getFilterProperties.column.type
                );
            } else {
                getFilterProperties.value = new Date(getFilterProperties.value as string);
            }
            if (isNullOrUndefined(getFilterProperties.value)) {
                getFilterProperties.filterStatusMsg = localization?.getConstant('invalidFilterMessage');
            }
            break;
        case 'string':
            getFilterProperties.caseSensitive = false;
            if (getFilterProperties.column.filter.operator) {
                getFilterProperties.operator = getFilterProperties.column.filter.operator;
            } else {
                if (value.indexOf('*') !== -1 || value.indexOf('?') !== -1 || value.indexOf('%3f') !== -1) {
                    getFilterProperties.operator = filterOperators.wildCard;
                } else if (value.indexOf('%') !== -1) {
                    getFilterProperties.operator = filterOperators.like;
                } else {
                    getFilterProperties.operator = filterOperators.startsWith;
                }
            }
            break;
        case 'boolean':
            if (value.toLowerCase() === 'true' || value === '1') {
                getFilterProperties.value = true;
            } else if (value.toLowerCase() === 'false' || value === '0') {
                getFilterProperties.value = false;
            } else if ((getFilterProperties.value as string).length) {
                getFilterProperties.filterStatusMsg = localization?.getConstant('invalidFilterMessage');
            }
            getFilterProperties.operator = filterOperators.equal;
            break;
        default:
            if (getFilterProperties.column.filter.operator) {
                getFilterProperties.operator = getFilterProperties.column.filter.operator;
            } else {
                getFilterProperties.operator = filterOperators.equal;
            }
        }
    };

    const getOperator: (value: string) => void = (value: string): void => {
        const singleOp: string = value.charAt(0);
        const multipleOp: string = value.slice(0, 2);
        const operators: Object = extend(
            { '=': filterOperators.equal, '!': filterOperators.notEqual }, DataUtil.operatorSymbols);
        // eslint-disable-next-line no-prototype-builtins
        if (operators.hasOwnProperty(singleOp) || operators.hasOwnProperty(multipleOp)) {
            getFilterProperties.operator = operators[`${singleOp}`];
            getFilterProperties.value = value.substring(1);
            if (!getFilterProperties.operator) {
                getFilterProperties.operator = operators[`${multipleOp}`];
                getFilterProperties.value = value.substring(2);
            }
        }
        if (getFilterProperties.operator === filterOperators.lessThan || getFilterProperties.operator === filterOperators.greaterThan) {
            if ((getFilterProperties.value as string).charAt(0) === '=') {
                getFilterProperties.operator = getFilterProperties.operator + 'OrEqual';
                getFilterProperties.value = (getFilterProperties.value as string).substring(1);
            }
        }
    };

    const applyColumnFormat: (filterValue: ValueType) => void  = (
        filterValue: ValueType): void => {
        const getFlvalue: Date | number | string = (getFilterProperties.column.type === 'date' || getFilterProperties.column.type === 'datetime' || getFilterProperties.column.type === 'dateonly') ?
            filterValue === '' ? new Date(null) : new Date(filterValue as string) : parseFloat(filterValue as string);
        if ((getFilterProperties.column.type === 'date' || getFilterProperties.column.type === 'datetime' || getFilterProperties.column.type === 'dateonly') && filterValue &&
            Array.isArray(getFilterProperties.value) && (filterValue as string).split(',').length > 1) {
            getFilterProperties.values[getFilterProperties.column.field] = (((filterValue as string)).split(',')).map((val: string) => {
                if (val === '') {
                    val = null;
                }
                return setFormatForFlColumn(new Date(val), getFilterProperties.column);
            });
        } else {
            getFilterProperties.values[getFilterProperties.column.field] = setFormatForFlColumn(getFlvalue, getFilterProperties.column);
        }
    };

    const setFormatForFlColumn: (value: Date | number, column: ColumnProps) => string = (
        value: Date | number, column: ColumnProps): string => {
        return formatter.toView(value, (column as IColumnBase).formatFn)?.toString();
    };


    /**
     * Filters grid row by column name with the given options.
     *
     * @param  {string} fieldName - Defines the field name of the column.
     * @param  {string} operator - Defines the operator to filter records.
     * @param  {ValueType| ValueType[]} filterValue - Defines the value used to filter records.
     * @param  {string} predicate - Defines the relationship between one filter query and another by using AND or OR predicate.
     * @param  {boolean} caseSensitive - If match case is set to true, the grid filters the records with exact match. if false, it filters case
     * insensitive records (uppercase and lowercase letters treated the same).
     * @param  {boolean} ignoreAccent - If ignoreAccent set to true,
     * then filter ignores the diacritic characters or accents while filtering.
     *
     * @returns {void}
     */
    const filterByColumn: (fieldName: string, operator: string,
        filterValue: ValueType| ValueType[],
        predicate: string, caseSensitive: boolean, ignoreAccent: boolean
    ) => void  = (fieldName: string,
                  operator: string, filterValue: ValueType| ValueType[],
                  predicate: string, caseSensitive: boolean, ignoreAccent: boolean): void => {
        getFilterProperties.column = gridRef.current.getColumns().find((col: ColumnProps) => col.field === fieldName);
        let filterCell: HTMLInputElement;
        if (gridRef.current.filterSettings?.type === 'FilterBar' && gridRef.current.filterSettings?.enableFilterBarOperator
            && isNullOrUndefined(getFilterProperties.column.filterTemplate)) {
            operator = gridRef.current.getColumnByField(fieldName).filter?.operator || 'equal';
        }
        if (operator === 'like' && filterValue && (filterValue as string).indexOf('%') === -1) {
            filterValue = '%' + filterValue + '%';
        }
        if (!getFilterProperties.column || !getFilterProperties.column.allowFilter || gridRef.current?.filterSettings?.enabled === false) {
            return;
        }
        if (gridRef.current.filterSettings?.type === 'FilterBar') {
            filterCell = gridRef.current.headerPanelRef.querySelector('[id=\'' + getFilterProperties.column.field + '_filterBarcell\']') as HTMLInputElement;
        }
        getFilterProperties.predicate = predicate ? predicate : Array.isArray(filterValue) ? 'or' : 'and';
        getFilterProperties.value = filterValue as ValueType;
        getFilterProperties.caseSensitive = caseSensitive || false;
        getFilterProperties.ignoreAccent = getFilterProperties.ignoreAccent = !isNullOrUndefined(ignoreAccent) ?
            ignoreAccent : gridRef.current.filterSettings?.ignoreAccent;
        getFilterProperties.fieldName = fieldName;
        getFilterProperties.operator = operator;
        filterValue = !isNullOrUndefined(filterValue) ? filterValue.toString() : filterValue;
        if (filterValue === '') {
            filterValue = null;
        }
        if (getFilterProperties.column.type === 'number' || getFilterProperties.column.type === 'date') {
            getFilterProperties.caseSensitive = true;
        }
        if (filterCell && gridRef.current.filterSettings?.type === 'FilterBar') {
            if ((filterValue && (filterValue as string).length < 1) || (!getFilterProperties.filterByMethod &&
                checkForSkipInput(getFilterProperties.column, (filterValue as string)))) {
                getFilterProperties.filterStatusMsg = (filterValue && (filterValue as string).length < 1) ? '' : localization?.getConstant('invalidFilterMessage');
                updateFilterMsg();
                return;
            }
            if (filterCell.value !== filterValue) {
                filterCell.value = (filterValue as string);
            }
        }
        if (!isNullOrUndefined(getFilterProperties.column.format)) {
            applyColumnFormat((filterValue as string));
            if (getFilterProperties.initialLoad && gridRef.current.filterSettings?.type === 'FilterBar') {
                filterCell.value = getFilterProperties.values[getFilterProperties.column.field];
            }
        } else {
            getFilterProperties.values[getFilterProperties.column.field] = filterValue;
        }
        const predObj: FilterPredicates = {
            field: getFilterProperties.fieldName,
            predicate: predicate,
            caseSensitive: caseSensitive,
            ignoreAccent: ignoreAccent,
            operator: getFilterProperties.operator,
            value: getFilterProperties.value,
            type: getFilterProperties.column.type
        };
        const filterColumn: FilterPredicates[] = gridRef.current.filterSettings?.columns.filter((fColumn: FilterPredicates) => {
            return (fColumn.field === getFilterProperties.fieldName);
        });
        if (filterColumn?.length > 1 && !isNullOrUndefined(getFilterProperties.actualPredicate[getFilterProperties.fieldName])) {
            getFilterProperties.actualPredicate[getFilterProperties.fieldName].push(predObj);
        } else {
            getFilterProperties.actualPredicate[getFilterProperties.fieldName] = [predObj];
        }
        if (checkAlreadyColFiltered(getFilterProperties.column.field)) {
            return;
        }
        updateModel();
    };

    const checkForSkipInput: (column: ColumnProps, value: string) => boolean = useCallback(
        (column: ColumnProps, value: string): boolean => {
            let isSkip: boolean;
            if (column.type === 'number') {
                if (DataUtil.operatorSymbols[`${value}`] || getFilterProperties.skipNumberInput.indexOf(value) > -1) {
                    isSkip = true;
                }
            } else if (column.type === 'string') {
                for (const val of value) {
                    if (getFilterProperties.skipStringInput.indexOf(val) > -1) {
                        isSkip = true;
                    }
                }
            }
            return isSkip;
        }, []
    );

    const getFilteredColsIndexByField: (col: ColumnProps) => number = useCallback((col: ColumnProps): number => {
        const cols: FilterPredicates[] = gridRef.current.filterSettings?.columns;
        for (let i: number = 0, len: number = cols.length; i < len; i++) {
            if (cols[parseInt(i.toString(), 10)].uid === col.uid) {
                return i;
            }
        }
        return -1;
    }, []);

    /**
     * To update filterSettings when applying filter.
     *
     * @returns {void}
     */
    const updateModel: () => void = async(): Promise<void> => {
        const column: ColumnProps = gridRef.current.getColumns().find((col: ColumnProps) => col.field === getFilterProperties.fieldName);
        const filterCol: FilterPredicates[] = extend([], gridRef.current.filterSettings?.columns) as FilterPredicates[];
        const arrayVal: ValueType[] = Array.isArray(getFilterProperties.value) &&
            getFilterProperties.value.length ? getFilterProperties.value : [getFilterProperties.value];
        let currentFilterPredicate: FilterPredicates;
        const filterObjIndex: number = getFilteredColsIndexByField(getFilterProperties.column);
        const prevFilterObject: FilterPredicates = filterCol[parseInt(filterObjIndex.toString(), 10)];
        const moduleName : string = (gridRef.current.dataSource as DataManager).adaptor && (<{ getModuleName?: Function }>(
            gridRef.current.dataSource as DataManager).adaptor).getModuleName ? (<{ getModuleName?: Function }>(
                gridRef.current.dataSource as DataManager).adaptor).getModuleName() : undefined;
        for (let i: number = 0, len: number = arrayVal.length; i < len; i++) {
            const isMenuNotEqual: boolean = getFilterProperties.operator === 'notEqual';
            currentFilterPredicate = {
                field: getFilterProperties.fieldName, uid: column.uid, isForeignKey: false, operator: getFilterProperties.operator,
                value: arrayVal[parseInt(i.toString(), 10)], predicate: getFilterProperties.predicate,
                caseSensitive: getFilterProperties.caseSensitive, ignoreAccent: getFilterProperties.ignoreAccent,
                actualFilterValue: {}, actualOperator: {}
            };
            const index: number = getFilteredColsIndexByField(column);
            if (index > -1 && !Array.isArray(getFilterProperties.value)) {
                filterCol[parseInt(index.toString(), 10)] = currentFilterPredicate;
            } else {
                filterCol.push(currentFilterPredicate);
            }
            if ((prevFilterObject && (isNullOrUndefined(prevFilterObject.value)
                || prevFilterObject.value === '') && (prevFilterObject.operator === 'equal'
                || prevFilterObject.operator === 'notEqual')) && (moduleName !== 'ODataAdaptor' && moduleName !== 'ODataV4Adaptor')) {
                handleExistingFilterCleanup(getFilterProperties.fieldName, filterCol);
            }
            if (isNullOrUndefined(getFilterProperties.value) && (getFilterProperties.operator === 'equal' ||
                getFilterProperties.operator === 'notEqual') && (moduleName !== 'ODataAdaptor' && moduleName !== 'ODataV4Adaptor')) {
                handleExistingFilterCleanup(getFilterProperties.fieldName, filterCol);
                if (column.type === 'string') {
                    filterCol.push({
                        field: getFilterProperties.fieldName, ignoreAccent: getFilterProperties.ignoreAccent,
                        caseSensitive: getFilterProperties.caseSensitive, operator: getFilterProperties.operator,
                        predicate: isMenuNotEqual ? 'and' : 'or', value: '', uid: column.uid
                    });
                }
                filterCol.push({
                    field: getFilterProperties.fieldName, ignoreAccent: getFilterProperties.ignoreAccent,
                    caseSensitive: getFilterProperties.caseSensitive, operator: getFilterProperties.operator,
                    predicate: isMenuNotEqual ? 'and' : 'or', value: undefined, uid: column.uid
                });
                filterCol.push({
                    field: getFilterProperties.fieldName, ignoreAccent: getFilterProperties.ignoreAccent,
                    caseSensitive: getFilterProperties.caseSensitive, operator: getFilterProperties.operator,
                    predicate: isMenuNotEqual ? 'and' : 'or', value: null, uid: column.uid
                });
            }
        }

        const args: FilterEvent = { cancel: false, currentFilterPredicate: currentFilterPredicate,
            currentFilterColumn: getFilterProperties.column, columns: filterCol, action: ActionType.Filtering,
            requestType: ActionType.Filtering };
        if (getFilterProperties.contentRefresh) {
            args.type = ActionType.Filtering;
            const confirmResult: boolean = await gridRef.current?.editModule?.checkUnsavedChanges?.();
            if (!isNullOrUndefined(confirmResult) && !confirmResult) {
                return;
            }
            gridRef.current.onFilterStart?.(args);
            if (args.cancel) {
                return;
            }
        }
        gridRef.current.filterSettings.columns = filterCol;
        if (getFilterProperties.contentRefresh) {
            setFilterSettings((prevSettings: FilterSettings) => {
                return { ...prevSettings, columns: gridRef.current.filterSettings?.columns || [] };
            });
            args.type = 'actionComplete';
            setGridAction(args);
        }
        refreshFilterSettings();
        updateFilterMsg();
    };

    const handleExistingFilterCleanup: (field: string, filterCol: FilterPredicates[]) => void = (
        field: string, filterCol: FilterPredicates[]): void => {
        for (let i: number = 0; i < filterCol.length; i++) {
            if (filterCol[`${i}`].field === field && (filterCol[`${i}`].operator === 'equal' || filterCol[`${i}`].operator === 'notEqual')
                && isNullOrUndefined(filterCol[`${i}`].value)) {
                filterCol.splice(i, 1);
                i = i - 1;
            }
        }
    };

    const refreshFilterSettings: () => void = (): void => {
        if (gridRef.current.filterSettings?.type === 'FilterBar') {
            const filterColumn: FilterPredicates[] = gridRef.current.filterSettings?.columns;
            for (let i: number = 0; i < filterColumn?.length; i++) {
                getFilterProperties.column = grabColumnByUidFromAllCols(
                    filterColumn[parseInt(i.toString(), 10)].uid, filterColumn[parseInt(i.toString(), 10)].field);
                let filterValue: ValueType | ValueType[] =
                    filterColumn[parseInt(i.toString(), 10)].value;
                filterValue = !isNullOrUndefined(filterValue) && filterValue.toString();
                if (!isNullOrUndefined(getFilterProperties.column.format) && !isNullOrUndefined(getFilterProperties.column.type)) {
                    applyColumnFormat(filterValue);
                } else {
                    const key: string = filterColumn[parseInt(i.toString(), 10)].field;
                    getFilterProperties.values[`${key}`] = filterColumn[parseInt(i.toString(), 10)].value;
                }
            }
        }
    };

    const updateFilterMsg: () => void = (): void => {
        if (gridRef.current.filterSettings?.type === 'FilterBar') {
            const gObj: GridRef  = gridRef.current;
            let getFormatFlValue: string;
            const columns: FilterPredicates[] = gObj.filterSettings?.columns;
            let column: ColumnProps;
            if (columns.length > 0 && getFilterProperties.filterStatusMsg !== localization?.getConstant('invalidFilterMessage')) {
                getFilterProperties.filterStatusMsg = '';
                for (let index: number = 0; index < columns.length; index++) {
                    column = grabColumnByUidFromAllCols(
                        columns[parseInt(index.toString(), 10)].uid, columns[parseInt(index.toString(), 10)].field);
                    if (index) {
                        getFilterProperties.filterStatusMsg += ' && ';
                    }
                    if (!isNullOrUndefined(column.format) && !isNullOrUndefined(column.type)) {
                        const flValue: Date | number = (column.type === 'date' || column.type === 'datetime' || column.type === 'dateonly') ?
                            formatter.fromView(getFilterProperties.values[column.field], (column as IColumnBase).parseFn, (column.type === 'dateonly' ? 'date' : column.type)) : getFilterProperties.values[column.field];
                        if (!(column.type === 'date' || column.type === 'datetime' || column.type === 'dateonly')) {
                            getFormatFlValue = formatter.toView(flValue, (column as IColumnBase).parseFn).toString();
                        } else {
                            getFormatFlValue = setFormatForFlColumn(flValue, column);
                        }
                        getFilterProperties.filterStatusMsg += column.headerText + ': ' + getFormatFlValue;
                    } else {
                        getFilterProperties.filterStatusMsg += column.headerText + ': ' + getFilterProperties.values[column.field];
                    }
                }
            }
            if (gridRef.current.pageSettings?.enabled) {
                gridRef.current.setPagerMessage(getFilterProperties.filterStatusMsg);
                if (gridRef.current.height === '100%') {
                    gridRef.current.scrollModule.setPadding();
                }
            }

            getFilterProperties.filterStatusMsg = '';
        }

    };

    const checkAlreadyColFiltered: (field: string) => boolean = (field: string): boolean => {
        const columns: FilterPredicates[] = gridRef.current.filterSettings?.columns;
        for (const col of columns) {
            if (col.field === field && col.value === getFilterProperties.value &&
                col.operator === getFilterProperties.operator && col.predicate === getFilterProperties.predicate) {
                return true;
            }
        }
        return false;
    };

    const getColumnByUid: (uid: string) => ColumnProps = (uid: string): ColumnProps => {
        return iterateArrayOrObject<ColumnProps, ColumnProps>(<ColumnProps[]>gridRef.current.getColumns(), (item: ColumnProps) => {
            if (item.uid === uid) {
                return item;
            }
            return undefined;
        })[0];
    };

    /**
     * Clears all the filtered rows of the Grid.
     *
     * @param {string[]} fields - Defines the Fields
     * @returns {void}
     */
    const clearFilter: (fields: string[]) => void = async(fields: string[]): Promise<void> => {
        const cols: FilterPredicates[] = getActualPropFromColl(gridRef.current.filterSettings?.columns);
        if (!isNullOrUndefined(fields)) {
            getFilterProperties.refresh = false;
            fields.forEach((field: string) => { removeFilteredColsByField(field); });
            const confirmResult: boolean = await gridRef.current?.editModule?.checkUnsavedChanges?.();
            if (!isNullOrUndefined(confirmResult) && !confirmResult) {
                return;
            }
            gridRef.current?.onRefreshStart?.({
                requestType: 'Refresh', name: 'onActionBegin'
            });
            if (gridRef.current.filterSettings?.columns.length === 0) {
                setFilterSettings((prevSettings: FilterSettings) => {
                    return { ...prevSettings, columns: [] };
                });
                setGridAction({
                    requestType: 'Refresh', name: 'onActionComplete'
                });
            } else {
                setFilterSettings((prevSettings: FilterSettings) => {
                    return { ...prevSettings, columns: gridRef.current.filterSettings?.columns || [] };
                });
                setGridAction({
                    requestType: 'Refresh', name: 'onActionComplete'
                });
            }
            getFilterProperties.refresh = true;
            return;
        }
        for (let i: number = 0; i < cols.length; i++) {
            cols[parseInt(i.toString(), 10)].uid = cols[parseInt(i.toString(), 10)].uid;
        }
        const colUid: string[] = cols.map((f: ColumnProps) => f.uid);
        const filteredcols: string[] = colUid.filter((item: string, pos: number) => colUid.indexOf(item) === pos);
        getFilterProperties.refresh = false;
        for (let i: number = 0, len: number = filteredcols.length; i < len; i++) {
            removeFilteredColsByField(getColumnByUid(filteredcols[parseInt(i.toString(), 10)]).field);
        }
        getFilterProperties.refresh = true;
        if (filteredcols.length) {
            const confirmResult: boolean = await gridRef.current?.editModule?.checkUnsavedChanges?.();
            if (!isNullOrUndefined(confirmResult) && !confirmResult) {
                return;
            }
            gridRef.current?.onRefreshStart?.({
                requestType: 'Refresh', name: 'onActionBegin'
            });
            if (gridRef.current.filterSettings?.columns.length === 0) {
                setFilterSettings((prevSettings: FilterSettings) => {
                    return { ...prevSettings, columns: [] };
                });
                setGridAction({
                    requestType: 'Refresh', name: 'onActionComplete'
                });
            } else {
                setFilterSettings((prevSettings: FilterSettings) => {
                    return { ...prevSettings, columns: gridRef.current.filterSettings?.columns || [] };
                });
                setGridAction({
                    requestType: 'Refresh', name: 'onActionComplete'
                });
            }
        }
        getFilterProperties.filterStatusMsg = '';
        refreshFilterSettings();
        updateFilterMsg();
    };

    return {
        filterByColumn,
        clearFilter,
        removeFilteredColsByField,
        keyUpHandler,
        mouseDownHandler,
        filterSettings,
        setFilterSettings,
        customOperators,
        getFilterProperties
    };
};
