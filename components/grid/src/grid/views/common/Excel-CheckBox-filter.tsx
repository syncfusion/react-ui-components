import * as React from 'react';
import { useState, useCallback, useEffect, useMemo, UIEvent, useRef, JSX } from 'react';
import { Dialog, IDialog } from '@syncfusion/react-popups/src/dialog/index';
import { Spinner } from '@syncfusion/react-popups/src/spinner/spinner';
import { calculatePosition } from '@syncfusion/react-popups/src/common/popup-positioning';
import { Button } from '@syncfusion/react-buttons/src/button/button';
import { Checkbox, CheckboxChangeEvent } from '@syncfusion/react-buttons/src/check-box/check-box';
import { RadioButton, RadioButtonChangeEvent } from '@syncfusion/react-buttons/src/radio-button/radio-button';
import { Color, Variant, Size } from '@syncfusion/react-base/src/enums';
import { useGridComputedProvider, useGridMutableProvider } from '../../contexts/GridProviders';
import { FilterDialogAfterOpenEvent, FilterPredicates, ExcelFilterDialogProps} from '../../types/filter.interfaces';
import { ColumnProps, IColumnBase } from '../../types/column.interfaces';
import { IGrid } from '../../types/grid.interfaces';
import { ActionType, ScrollMode } from '../../types/enum';
import { IValueFormatter, MutableGridSetter, MutableGridBase, ValueType } from '../../types/interfaces';
import { SearchSettings } from '../../types/search.interfaces';
import { SortAscendingIcon } from '@syncfusion/react-icons/src/icons/sort-ascending';
import { SortDescendingIcon } from '@syncfusion/react-icons/src/icons/sort-descending';
import { FilterClearIcon } from '@syncfusion/react-icons/src/icons/filter-clear';
import { FilterIcon } from '@syncfusion/react-icons/src/icons/filter';
import { SearchIcon } from '@syncfusion/react-icons/src/icons/search';
import { closest } from '@syncfusion/react-base/src/dom';
import { extend, getValue, isNullOrUndefined } from '@syncfusion/react-base/src/util';
import { getNumberPattern } from '@syncfusion/react-base/src/internationalization';
import { IL10n } from '@syncfusion/react-base/src/l10n';
import { SanitizeHtmlHelper } from '@syncfusion/react-base/src/sanitize-helper';
import { DropDownList, ChangeEvent as DDLChangeEvent } from '@syncfusion/react-dropdowns/src/drop-down-list/index';
import { InputBase, renderClearButton, renderFloatLabelElement } from '@syncfusion/react-inputs/src/common/inputbase';
import { NumericChangeEvent, NumericTextBox, NumericTextBoxProps } from '@syncfusion/react-inputs/src/numeric-textbox/index';
import { TextBox, TextBoxChangeEvent, TextBoxProps } from '@syncfusion/react-inputs/src/textbox/index';
import { generatePredicate, getDatePredicate, padZero, getCustomDateFormat, getPredicate } from '../../utils/utils';
import { AnimationType, Skeleton, Variants } from '@syncfusion/react-notifications/src/skeleton/skeleton';
import { DatePicker, DatePickerChangeEvent, DatePickerProps } from '@syncfusion/react-calendars/src/datepicker/index';
import { DataManager, AdaptorOptions, DataResult, DataUtil, Predicate, Query, ReturnType } from '@syncfusion/react-data';
import { DateTimePickerChangeEvent, DateTimePickerProps } from '@syncfusion/react-calendars/src/datetimepicker/types';
import DateTimePicker from '@syncfusion/react-calendars/src/datetimepicker/datetimepicker';
import { OffsetPosition } from '@syncfusion/react-navigations';
import { FormulaValue } from '../../types';

const CSS_EXCEL_ASC: string = 'sf-excel-ascending sf-menu-item';
const CSS_EXCEL_DEC: string = 'sf-excel-descending sf-menu-item';
const CSS_SEPARATOR: string = 'sf-separator sf-excel-separator';
const CSS_CLEAR_ITEM: string = 'sf-menu-item sf-clear-filter';

export const ExcelFilter: React.FC<ExcelFilterDialogProps> = ({
    isOpen,
    options,
    embedded = false,
    onCancel
}: ExcelFilterDialogProps): React.ReactElement | null => {
    const grid: Partial<IGrid> & Partial<MutableGridSetter> = useGridComputedProvider();
    const gridMutable: Partial<MutableGridBase> = useGridMutableProvider();
    const { offsetX, dataModule, formulaModule } = gridMutable;
    const enableSort: boolean = options.enableSort || false;
    const hideSearchbox: boolean = options.disableSearchOption;
    const hideSorting: boolean =  options.disableSortOption;
    const formatter: IValueFormatter = options.serviceLocator?.getService<IValueFormatter>('valueFormatter');
    const parentCurrentViewDataCount: number = options.parentCurrentViewDataCount;
    const contentScrollRef: React.RefObject<HTMLDivElement> = useRef<HTMLDivElement>(null);
    const virtualContentScrollRef: React.RefObject<HTMLDivElement> = useRef<HTMLDivElement>(null);
    const localization: IL10n = options.serviceLocator?.getService<IL10n>('localization');
    const searchInputRef: React.RefObject<HTMLInputElement> = useRef<HTMLInputElement>(null);
    const [showSpinner, setShowSpinner] = useState<boolean>(false);
    const updateColumn: ColumnProps = options.column;
    const hdrele: string = options.target?.getAttribute('aria-sort');
    const type: string = options.type;
    const isExcel: boolean = options.filterType === 'Excel';
    const isMenu: boolean = options.filterType === 'Menu';
    const isShimmer: boolean = options.loadingIndicator === 'Shimmer';
    const isRemote: boolean = options.isRemote;
    const cssClass: string = options.cssClass;
    const [searchValue, setSearchValue] = useState<string>('');
    const searchPredicateRef: React.RefObject<FilterPredicates | null> = useRef<FilterPredicates | null>(null);
    const immediateFilterTimerRef: React.RefObject<number | null> = useRef<number | null>(null);
    const [totalCount, setTotalCount] = useState<number>(0);
    const previousResult: React.RefObject<Object[]> = useRef<Object[]>([]);
    const previousCount: React.RefObject<number> = useRef<number>(0);
    const [cacheData, setCacheData] = useState<{ [x: number]: Object[] }>({});
    const filterColumns: FilterPredicates[] = useMemo(() => {
        return (options.filteredColumns).filter((col: FilterPredicates) => {
            return updateColumn.field === col.field;
        });
    }, [options.filteredColumns, updateColumn.field]);
    const addCurrentFilterColumns: React.RefObject<FilterPredicates[]> = useRef<FilterPredicates[]>([]);
    const isRender: React.RefObject<boolean> = useRef<boolean>(true);
    const [startIdx, setStartIdx] = useState<number>(0);
    const [requestIdx, setRequestIdx] = useState<number>(0);
    const [pageIndex, setPageIndex] = useState<number>(0);
    const [addCurrentFilter, setAddCurrentFilter] = useState<boolean>(false);
    const dialogRef: React.RefObject<IDialog> = useRef<IDialog>(null);
    const menuRef: React.RefObject<HTMLDivElement> = useRef<HTMLDivElement>(null);
    const [defaultFilter, setDefaultFilter] = useState<boolean>(isMenu ? false : true);
    const isImmediateMode: boolean = options?.mode === 'Immediate';
    const delay: number = options.immediateModeDelay;
    const operators: { [key: string]: object; }[] | string[] = Array.isArray(options.operators) ? options.operators : [];
    const operator: string = updateColumn.filter?.operator || (updateColumn.type === 'string' ? 'startsWith' : 'equal');
    let oprerator2: string = operator;
    let value2: ValueType | ValueType[] = null;
    if (filterColumns.length === 2) {
        oprerator2 = filterColumns[1].operator;
        value2 = filterColumns[1].value;
    }
    const [firstOperator, setFirstOperator] = useState(filterColumns[0]?.operator || operator);
    const [secondOperator, setSecondOperator] = useState(oprerator2);
    const [firstOperatorValue, setFirstOperatorValue] = useState<ValueType | ValueType[]>(filterColumns[0]?.value);
    const [secondOperatorValue, setSecondOperatorValue] = useState<ValueType | ValueType[]>(value2);
    const firstOperatorRef: React.RefObject<string> = useRef<string>(
        filterColumns[0]?.operator || operator
    );
    const secondOperatorRef: React.RefObject<string> = useRef<string>(oprerator2);
    const firstOperatorValueRef: React.RefObject<ValueType | ValueType[] | null> = useRef<
    ValueType | ValueType[] | null
    >(firstOperatorValue);
    const secondOperatorValueRef: React.RefObject<ValueType | ValueType[] | null> = useRef<
    ValueType | ValueType[] | null
    >(secondOperatorValue);
    const initialAndCondition: boolean = filterColumns.length === 2 ? filterColumns[1].predicate === 'and' : true;
    const andCondition: React.RefObject<boolean> = useRef<boolean>(initialAndCondition);
    const [andConditionUI, setAndConditionUI] = useState<boolean>(initialAndCondition);
    const scrollStopTimerRef: React.RefObject<number> = useRef<number | null>(null);
    const filterChoiceCount: number = 1000;
    const checkBoxesCount: number = 5;
    const checkBoxHeight: number = 40;
    const [filteredData, setFilteredData] = useState<Object[]>([]);
    const isPopupRendered: React.RefObject<boolean> = useRef<boolean>(true);
    const disableAdvancedOkBtn: boolean = useMemo(() => {
        return (isNullOrUndefined(firstOperatorValue) || firstOperatorValue === '') &&
            (isNullOrUndefined(secondOperatorValue) || secondOperatorValue === '');
    }, [firstOperatorValue, secondOperatorValue]);
    const filterExistingColumns: FilterPredicates[] = (options.filteredColumns).filter((col: FilterPredicates) => {
        return updateColumn.field !== col.field;
    });
    const actualPredicate: React.RefObject<Object[]> = useRef<Object[]>([]);
    const filterLength: number = filterColumns.length;

    const [internalOpen, setInternalOpen] = useState<boolean>(false);
    const gridDataManager: DataManager = options.dataManager;
    const adaptor: AdaptorOptions = gridDataManager.adaptor;
    const moduleName: { getModuleName?: Function } = adaptor as { getModuleName?: Function };
    const target: HTMLElement | Element = document.querySelector('.sb-scrollbar.sb-desktop') ?
        closest(options.parentElement, '.tabs-container') : document.body;
    const allowFormula: boolean = updateColumn.allowFormula;

    useEffect(() => { setInternalOpen(isOpen); }, [isOpen]);

    const handleCancel: () => void = useCallback((): void => {
        onCancel?.();
        setInternalOpen(false);
    }, [onCancel, totalCount]);

    const excelDialogFocus: (elem?: Element, className?: string) => void = useCallback((elem?: Element, className?: string) => {
        const hostElement: HTMLElement | null = dialogRef.current?.element;
        const menuFocusElem: Element | null = hostElement?.querySelector('.' + className) ?? null;
        if (menuFocusElem) {
            menuFocusElem.classList.remove(className);
        }
        if (elem) {
            elem.classList.add(className);
        }
    }, [dialogRef]);

    const focusNextOrPrevElement: (e: KeyboardEvent | React.KeyboardEvent<Element>, focusableElements: HTMLElement[],
        focusClassName: string) => void = useCallback((e: KeyboardEvent | React.KeyboardEvent<Element>,
                                                       focusableElements: HTMLElement[], focusClassName: string) => {

        const nextIndex: number = (e.key === 'ArrowUp' || (e.shiftKey && e.key === 'Tab')) ? focusableElements.indexOf(document.activeElement as HTMLElement) - 1
            : focusableElements.indexOf(document.activeElement as HTMLElement) + 1;
        const nextElement: Element = focusableElements[((nextIndex + focusableElements.length) % focusableElements.length)];

        // Set focus on the next / previous element
        if (nextElement) {
            (nextElement as HTMLElement).focus();
            const focusClass: string = nextElement.classList.contains('sf-checkbox-filtertext') ? 'sf-checkbox-focus' : focusClassName;
            const target: Element = nextElement.classList.contains('sf-checkbox-filtertext') ? closest(nextElement, '.sf-filter-checkbox') : closest(nextElement, '.sf-menu-item');
            excelDialogFocus(target, focusClass);
        }

    }, []);

    const keyDownHandler: (e: React.KeyboardEvent | KeyboardEvent) => void = useCallback((e: React.KeyboardEvent | KeyboardEvent) => {
        if (closest((e.target as HTMLElement), '.sf-excel-filter') && e.key === 'Escape') {
            handleCancel();
            return;
        }
        //prevented up and down arrow key press default functionality to prevent the browser scroll when performing keyboard navigation in excel filter element.
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            e.preventDefault();
        }
    }, []);

    const keyUpHandler: (e: React.KeyboardEvent | KeyboardEvent) => void = useCallback((e: React.KeyboardEvent | KeyboardEvent) => {
        if (!defaultFilter) { return; }
        if ((e.key === 'Tab' && e.shiftKey) || e.key === 'Tab') {
            const focusClass: string = (e.target as HTMLElement).classList.contains('sf-checkbox-filtertext') ? 'sf-checkbox-focus' : 'sf-menu-focus';
            const target: Element = (e.target as HTMLElement).classList.contains('sf-menu-item')
                ? closest((e.target as HTMLElement), '.sf-menu-item') : closest((e.target as HTMLElement), '.sf-filter-checkbox');
            excelDialogFocus(target, focusClass);
        }
        else if ((e.key === 'ArrowUp' || e.key === 'ArrowDown') && !e.altKey) {
            e.preventDefault();
            const hostElement: HTMLElement | null = dialogRef.current?.element;
            if (!hostElement) {
                return;
            }
            const focusableElements: HTMLElement[] = Array.from(hostElement.querySelectorAll(
                'input, button, [tabindex]:not([tabindex="-1"]), .sf-menu-item:not(.sf-disabled)'
            ));
            focusNextOrPrevElement(e, focusableElements, 'sf-menufocus');
        }

    }, [dialogRef, defaultFilter, handleCancel]);

    const clickHandler: (e: MouseEvent) => void = useCallback((e: MouseEvent) => {
        const target: Element = e.target as Element;
        const dialogElement: Element | null = dialogRef.current?.element;
        const popup: Element = closest(target, '.sf-excel-filter') || closest(target, '.sf-excel-filter-dropdown')
            || closest(target, '.sf-grid-excel-filter-container')
            || (dialogElement?.contains(target) ? dialogElement : null);
        const filterIcon: Element = closest(target, '.sf-grid-filter-container');
        const datePickerCalendar: Element = closest(target, '.sf-calendar') || closest(target, '.sf-datepicker') || closest(target, '.sf-datetimepicker')
            || (closest(target, '.sf-clear-icon') ? target.parentElement : null);
        const elem: Element = closest(target, '.sf-filter-checkbox');
        if (popup && defaultFilter) {
            excelDialogFocus(elem, 'sf-checkbox-focus');
        }
        if ((!popup && !filterIcon && !datePickerCalendar) || (filterIcon && closest(filterIcon, '.sf-grid-header-cell').getAttribute('data-mappinguid') !== updateColumn.uid)) {
            handleCancel();
        }
    }, [defaultFilter]);

    useEffect(() => {
        if (internalOpen && !embedded) {
            document.body.addEventListener('mousedown', clickHandler);
        }
        return () => {
            document.body.removeEventListener('mousedown', clickHandler);
        };
    }, [internalOpen, embedded, clickHandler]);

    // If the edit is not saved and scroll mode is not virtual, close the filter dialog.
    const shouldSkipConfirmOnEdit: () => boolean = useCallback((): boolean => {
        const editSaved: boolean = gridMutable?.editModule?.getCurrentFormState()?.submitted;
        if (!editSaved && gridMutable?.scrollMode !== ScrollMode.Virtual && !isNullOrUndefined(editSaved)) {
            return true;
        }
        return false;
    }, [gridMutable]);

    const closeDialogIfEditDirty: () => void = useCallback(() => {
        if (shouldSkipConfirmOnEdit()) {
            setInternalOpen(false);
            onCancel?.();
        }
    }, [shouldSkipConfirmOnEdit, onCancel]);

    const clearFilter: () => void = useCallback((): void => {
        closeDialogIfEditDirty();
        options.handler(null, 'clear-filter', updateColumn.field);
        handleCancel();
    }, [onCancel, totalCount, shouldSkipConfirmOnEdit]);

    const resetSearchNavigationState: () => void = useCallback((): void => {
        setCacheData({});
        setStartIdx(0);
        setRequestIdx(0);
        setPageIndex(0);
        setFilteredData([]);
    }, []);

    const generateNullValuePredicates: (defaults: {
        predicate?: string;
        field?: string;
        type?: string;
        uid?: string;
        operator?: string;
        matchCase?: boolean;
        ignoreAccent?: boolean;
    }) => FilterPredicates[] = useCallback((defaults: {
        predicate?: string, field?: string, type?: string, uid?: string
        operator?: string, matchCase?: boolean, ignoreAccent?: boolean
    }): FilterPredicates[] => {
        const coll: FilterPredicates[] = [];
        if (defaults.type === 'string') {
            coll.push(
                {
                    field: defaults.field, ignoreAccent: defaults.ignoreAccent, caseSensitive: defaults.matchCase,
                    operator: defaults.operator, predicate: defaults.predicate, value: ''
                });
        }
        coll.push(
            {
                field: defaults.field, caseSensitive: defaults.matchCase, operator: defaults.operator,
                predicate: defaults.predicate, value: undefined
            });
        coll.push(
            {
                field: defaults.field,
                caseSensitive: defaults.matchCase, operator: defaults.operator, predicate: defaults.predicate, value: null
            });
        return coll;
    }, []);

    useEffect(() => {
        firstOperatorValueRef.current = firstOperatorValue;
    }, [firstOperatorValue]);

    useEffect(() => {
        secondOperatorValueRef.current = secondOperatorValue;
    }, [secondOperatorValue]);

    useEffect(() => {
        firstOperatorRef.current = firstOperator;
    }, [firstOperator]);

    useEffect(() => {
        secondOperatorRef.current = secondOperator;
    }, [secondOperator]);

    const filterbtnHandler: () => void = useCallback((): void => {
        closeDialogIfEditDirty();
        if (!defaultFilter && (isImmediateMode ? firstOperatorValueRef.current !== ''
            || firstOperatorValueRef.current !== null ? true : false : true)) {
            let fColl: FilterPredicates[] = [];
            const field: string = updateColumn.field;
            const matchCase: boolean = options.type === 'string' || isNullOrUndefined(options.type) ?
                (options.caseSensitive || false) : undefined;
            const predicate: string = andCondition.current ? 'and' : 'or';
            const ignoreAccent: boolean = options.ignoreAccent || false;
            const arg: {
                cancel: boolean, arg1: string, arg2: string,
                arg3: ValueType | ValueType[], arg4: string, arg6: boolean, arg7: string, arg8: ValueType | ValueType[] | number | Date
            } = {
                arg1: field, arg2: firstOperator, arg3: firstOperatorValueRef.current ?? firstOperatorValue, arg4: predicate,
                arg6: ignoreAccent, arg7: secondOperator, arg8: secondOperatorValueRef.current ?? secondOperatorValue, cancel: false
            };
            if (type === 'boolean') {
                if (arg.arg3 !== null) {
                    arg.arg3 = (arg.arg3 === 'true');
                }
                if (arg.arg8 !== null) {
                    arg.arg8 = (arg.arg8 === 'true');
                }
            }
            fColl.push({
                field: field,
                predicate: predicate,
                caseSensitive: matchCase,
                ignoreAccent: ignoreAccent,
                operator: firstOperatorRef.current,
                value: arg.arg3,
                type: type
            });
            if (!isNullOrUndefined(secondOperatorRef.current) && !(isNullOrUndefined(arg.arg8) || arg.arg8 === '')) {
                fColl.push({
                    field: field,
                    predicate: predicate,
                    caseSensitive: matchCase,
                    ignoreAccent: ignoreAccent,
                    operator: secondOperatorRef.current as string,
                    value: arg.arg8,
                    type: type
                });
            }
            fColl = fColl.concat(filterExistingColumns);
            options.handler(fColl, 'filter');
        } else {
            let fObj: FilterPredicates;
            let coll: FilterPredicates[] = [];
            const defaults: {
                predicate?: string, field?: string, type?: string, uid?: string
                operator?: string, matchCase?: boolean, ignoreAccent?: boolean
            } = {
                field: updateColumn.field, predicate: 'or', uid: updateColumn.uid,
                operator: 'equal', type: type, matchCase: options.caseSensitive || false, ignoreAccent: options.ignoreAccent || false
            };
            let filterData: (string | number | boolean)[] = [];
            const checkData: (string | number | boolean)[] = Array.from(selectedRowRef.current);
            let unCheckData: (string | number | boolean)[] = Array.from(unselectedRowRef.current);

            if (unCheckData.length > 0 && checkData.length === 0) {
                filterData = unCheckData;
                defaults.operator = 'notEqual';
                defaults.predicate = 'and';
            }
            else {
                filterData = checkData;
                defaults.operator = 'equal';
                defaults.predicate = 'or';
            }
            if (previousUnselect.current.size) {
                unCheckData =  Array.from(previousUnselect.current);
            }
            for (let i: number = 0; i < filterData.length + previousUnselect.current.size; i++) {
                let filterValue: string | number | boolean;
                if (i < filterData.length) {
                    filterValue = filterData[parseInt(i.toString(), 10)];
                } else {
                    filterValue = unCheckData[i - filterData.length];
                    defaults.operator = 'notEqual';
                    defaults.predicate = 'and';
                }
                fObj = extend({}, { value: filterValue }, defaults) as {
                    field: string, predicate: string, operator: string, matchCase: boolean, ignoreAccent: boolean, value: string
                };
                if (filterValue === '' || isNullOrUndefined(filterValue)) {
                    coll = coll.concat(generateNullValuePredicates(defaults));
                } else {
                    coll.push(fObj);
                }
            }
            if (!isImmediateMode) {
                if (searchValue?.length) {
                    fObj = extend({}, { value: searchValue }, defaults) as {
                        field: string, predicate: string, operator: string, matchCase: boolean, ignoreAccent: boolean, value: string
                    };
                    fObj.operator = 'contains';
                    fObj.predicate = addCurrentFilter ? 'or' : 'and';
                    if (prevHeaderCheckedRef.current) {
                        coll.push(fObj);
                    }
                    if (addCurrentFilter) {
                        coll = actualPredicate.current.concat(coll);
                        coll = coll.concat(addCurrentFilterColumns.current);
                    }
                } else {
                    if (selectAllChecked) {
                        coll = [];
                    } else {
                        coll = actualPredicate.current.concat(coll);
                    }
                }
            }
            else {
                if (searchPredicateRef.current && searchValue?.length) {
                    coll.push(searchPredicateRef.current);
                }
                const selectedCount: number = selectedRowRef.current.size + (previousCount.current ?
                    (previousCount.current - previousUnselect.current.size) : 0);
                if (selectedCount === totalCount) {
                    coll = [];
                } else {
                    coll = actualPredicate.current.concat(coll);
                }
            }
            if (coll.length) {
                coll = coll.concat(filterExistingColumns);
                options.handler(coll, 'filter', updateColumn.field);
            } else {
                options.handler(null, 'clear-filter', updateColumn.field);
            }
        }
        if (!isImmediateMode && !embedded) {
            handleCancel();
        }

    }, [updateColumn, filterExistingColumns, defaultFilter, firstOperator, secondOperator,
        firstOperatorValue, secondOperatorValue, shouldSkipConfirmOnEdit, embedded]);

    const scheduleImmediateApply: () => void = useCallback(() => {
        if (!isImmediateMode) {
            return;
        }

        if (immediateFilterTimerRef.current) {
            clearTimeout(immediateFilterTimerRef.current);
        }
        immediateFilterTimerRef.current = window.setTimeout(() => {
            filterbtnHandler();
        }, delay);
    }, [isImmediateMode, options, filterbtnHandler]);

    const renderExcelMenu: React.JSX.Element = useMemo(() => {
        return (
            <div className="sf-excel-contextmenu-wrapper" ref={menuRef}>
                <ul>
                    {enableSort && !hideSorting &&
                        <><li
                            className={CSS_EXCEL_ASC + ((!updateColumn?.allowSort || hdrele === 'ascending' || !defaultFilter) ? ' sf-disabled' : '')}
                            tabIndex={(!updateColumn?.allowSort || hdrele === 'ascending' || !defaultFilter) ? -1 : 0}
                            onClick={() => {
                                if (!embedded) {
                                    handleCancel();
                                }
                            }}
                        >
                            <span className='sf-menu-icon sf-icons sf-sortascending'><SortAscendingIcon className="sf-font-size-xl"/></span>
                            {(type === 'string') ? localization.getConstant('sortAtoZ') : (type === 'datetime' || type === 'date') ?
                                localization.getConstant('sortByOldest') : localization.getConstant('sortSmallestToLargest')}
                        </li>
                        <li
                            className={CSS_EXCEL_DEC + ((!updateColumn?.allowSort || hdrele === 'descending' || !defaultFilter) ? ' sf-disabled' : '')}
                            tabIndex={(!updateColumn?.allowSort || hdrele === 'descending' || !defaultFilter) ? -1 : 0}
                            onClick={() => {
                                if (!embedded) {
                                    handleCancel();
                                }
                            }}
                        >
                            <span className='sf-menu-icon sf-icons sf-sortdescending'><SortDescendingIcon className="sf-font-size-xl"/></span>
                            {(type === 'string') ? localization.getConstant('sortZtoA') : (type === 'datetime' || type === 'date') ?
                                localization.getConstant('sortByNewest') : localization.getConstant('sortLargestToSmallest')}
                        </li>
                        <li className={CSS_SEPARATOR + (!defaultFilter ? ' sf-disabled' : '')}></li> </>}
                    <li
                        className={CSS_CLEAR_ITEM + (filterLength < 1 ? ' sf-disabled' : '')}
                        tabIndex={filterLength < 1 || !defaultFilter ? -1 : 0}
                        onClick={() => {
                            // if (filterLength > 0) {
                            options.handler(null, 'clear-filter', updateColumn.field);
                            handleCancel();
                            // }

                        }}
                    >
                        <span className='sf-menu-icon sf-icons sf-excl-filter-icon'>{filterLength > 0 ? <FilterIcon className="sf-font-size-xl"/> : <FilterClearIcon className="sf-font-size-xl"/>}</span>
                        {localization.getConstant('clearFilter')}
                    </li>
                </ul>
            </div>);

    }, [updateColumn?.allowSort, hdrele, filterLength, defaultFilter, embedded]);
    const [isFocused, setIsFocused] = useState<boolean>(false);

    /**
     * Stores keys of selected values when header is unchecked and user manually selects rows.
     */
    const selectedRowRef: React.RefObject<Set<string | number | boolean>> = useRef<Set<string | number | boolean>>(new Set());
    /**
     * Stores keys of unselected values when header is checked and user manually unselects rows.
     */
    const unselectedRowRef: React.RefObject<Set<string | number | boolean>> = useRef<Set<string | number | boolean>>(new Set());

    /**
     * Stores keys of previous filter unselected values .
     */
    const previousUnselect: React.RefObject<Set<string | number | boolean>> = useRef<Set<string | number | boolean>>(new Set());

    /**
     * Tracks previous header checkbox state to determine row checkbox states during virtual scrolling.
     * - true: Header was checked (all items checked by default, track unselected items)
     * - false: Header was unchecked (all items unchecked by default, track selected items)
     */
    const prevHeaderCheckedRef: React.RefObject<boolean> = useRef<boolean>(true);
    /**
     * "Select All" checkbox state flags.
     */
    const [selectAllChecked, setSelectAllChecked] = useState<boolean>(true);
    const [selectAllIndeterminate, setSelectAllIndeterminate] = useState<boolean>(false);
    /**
     * State to trigger re-render when selection changes (since refs don't trigger re-renders)
     */
    const [selectionVersion, setSelectionVersion] = useState<number>(0);
    /**
     * Recalculate header checkbox state using totalCount and refs.
     */

    const resetSelectionState: () => void = useCallback((): void => {
        selectedRowRef.current = new Set ();
        unselectedRowRef.current = new Set();
        previousUnselect.current = new Set();

    }, []);

    const recomputeSelectAll: () => void = useCallback((): void => {
        if (totalCount === 0) {
            setSelectAllChecked(false);
            setSelectAllIndeterminate(false);
            return;
        }
        // If previous header was checked (default all checked, tracking unselected)
        if (prevHeaderCheckedRef.current && !previousCount.current) {
            const unselectedCount: number = unselectedRowRef.current.size;
            if (unselectedCount === 0) {
                // All selected
                setSelectAllChecked(true);
                setSelectAllIndeterminate(false);
            } else if (unselectedCount === totalCount) {
                // None selected
                setSelectAllChecked(false);
                setSelectAllIndeterminate(false);
            } else {
                // Partial selection (indeterminate)
                setSelectAllChecked(false);
                setSelectAllIndeterminate(true);
            }
        } else {
            // Previous header was unchecked (default all unchecked, tracking selected)
            const selectedCount: number = selectedRowRef.current.size + (previousCount.current ?
                (previousCount.current - previousUnselect.current.size) : 0);
            if (selectedCount === totalCount && unselectedRowRef.current.size === 0) {
                // All selected
                setSelectAllChecked(true);
                setSelectAllIndeterminate(false);
            } else if (selectedCount === 0 && !actualPredicate.current.length) {
                // None selected
                setSelectAllChecked(false);
                setSelectAllIndeterminate(false);
            } else {
                // Partial selection (indeterminate)
                setSelectAllChecked(false);
                setSelectAllIndeterminate(true);
            }
        }
    }, [totalCount]);

    /**
     * Handle individual row checkbox toggle.
     *
     * @param {string | number | boolean} key Unique value key for the row
     * @param {boolean} checked New checked state
     * @returns {void}
     */
    const handleItemToggle: (key: string | number | boolean, checked: boolean) => void = useCallback((
        key: string | number | boolean, checked: boolean): void => {
        // Based on previous header state, update appropriate ref
        if (previousResult.current.includes(key) && previousCount.current) {
            unselectedRowRef.current.delete(key);
            if (checked) {
                // Re-checking: remove from unselected
                previousUnselect.current.delete(key);
            } else {
                // Unchecking: add to unselected
                previousUnselect.current.add(key);
            }
        } else if (prevHeaderCheckedRef.current && !previousCount.current) {
            // Header was checked - track unselections
            if (checked) {
                // Re-checking: remove from unselected
                unselectedRowRef.current.delete(key);
            } else {
                // Unchecking: add to unselected
                unselectedRowRef.current.add(key);
            }
        } else {
            // Header was unchecked - track selections
            if (checked) {
                // Checking: add to selected
                selectedRowRef.current.add(key);
                // If the same key was present in unselected, remove it to maintain exclusivity
                if (unselectedRowRef.current.has(key)) {
                    unselectedRowRef.current.delete(key);
                }
            } else {
                // Unchecking: remove from selected
                selectedRowRef.current.delete(key);
            }
        }
        // Trigger re-render by incrementing version
        setSelectionVersion((prev: number) => prev + 1);
        // Recompute header checkbox state
        recomputeSelectAll();
        if (isImmediateMode) {
            scheduleImmediateApply();
        }
    }, [recomputeSelectAll, isImmediateMode, scheduleImmediateApply]);

    /**
     * Handle header checkbox toggle.
     *
     * @param {boolean} checked Whether all should be selected
     * @returns {void}
     */
    const handleSelectAllToggle: (checked: boolean) => void = useCallback((checked: boolean): void => {
        // Update previous header state
        prevHeaderCheckedRef.current = checked;
        previousCount.current = 0;
        actualPredicate.current = [];
        // Clear both refs when header is toggled
        resetSelectionState();
        // Trigger re-render
        setSelectionVersion((prev: number) => prev + 1);
        setSelectAllChecked(checked);
        setSelectAllIndeterminate(false);
        if (isImmediateMode) {
            scheduleImmediateApply();
        }
    }, [isImmediateMode, scheduleImmediateApply]);

    const applySearchOnlyFilter: (value: string) => void = useCallback((value: string): void => {
        closeDialogIfEditDirty();
        const field: string = updateColumn.field;
        const matchCase: boolean = options.caseSensitive || false;
        const ignoreAccent: boolean = options.ignoreAccent || false;
        const parsedValue: string | number = type !== 'string' && !isNaN(parseFloat(value)) ? parseFloat(value) : value;
        const searchOperator: string = isRemote ? (type === 'string' ? 'contains' : 'equal') : (type ? 'contains' : 'equal');

        if (value && value.length) {
            searchPredicateRef.current = {
                field,
                operator: searchOperator,
                value: parsedValue,
                predicate: 'and',
                caseSensitive: matchCase,
                ignoreAccent,
                type
            };
            options.handler([searchPredicateRef.current].concat(filterExistingColumns), 'filter');
        }
        else {
            searchPredicateRef.current = null;
            options.handler(filterExistingColumns.length ? filterExistingColumns : null,
                            filterExistingColumns.length ? 'filter' : 'clear-filter',
                            updateColumn.field
            );
        }

    }, [updateColumn, filterExistingColumns, shouldSkipConfirmOnEdit]);

    const handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void = useCallback((e: React.ChangeEvent<HTMLInputElement>): void => {
        const value: string = e.target.value;
        if (value.length > 0) {
            prevHeaderCheckedRef.current = true;
            actualPredicate.current = [];
            previousCount.current = 0;
            previousResult.current = [];
            resetSelectionState();
        }
        setSelectionVersion((prev: number) => prev + 1);
        setSearchValue(value);
        virtualContentScrollRef.current.scrollTop = 0;
        resetSearchNavigationState();
        if (!defaultFilter) {
            closeDialogIfEditDirty();
        }
        if (isImmediateMode) {
            if (immediateFilterTimerRef.current) {
                clearTimeout(immediateFilterTimerRef.current);
            }
            immediateFilterTimerRef.current = window.setTimeout(() => {
                applySearchOnlyFilter(value);
            }, delay);
        }

    }, [isImmediateMode, applySearchOnlyFilter]);

    const handleFocus: () => void = useCallback(() => {
        setIsFocused(true);
    }, []);

    const handleBlur: () => void = useCallback(() => {
        setIsFocused(false);
    }, []);


    const normalizeKey: (rawKey: string | number | boolean | Date | null | undefined, primaryKey?: string | number) =>
    string | number | boolean | null = (rawKey: string | number | boolean | Date | null | undefined, primaryKey?: string | number
    ) => {
        if (rawKey === '' || rawKey === undefined) { return null; }
        if (type === 'date' || type === 'dateonly') {
            if (rawKey instanceof Date) {
                const d: Date = rawKey;
                if (!isNaN(d.getTime())) {
                    return `${d.getFullYear()}-${padZero((d.getMonth() + 1))}-${padZero(d.getDate())}`;
                }
                return String(rawKey);
            }
            return String(rawKey);
        }
        if (type === 'datetime') {
            if (rawKey instanceof Date) {
                const d: Date = rawKey;
                if (!isNaN(d.getTime())) {
                    // Use epoch millis as canonical string to avoid timezone/format variances
                    return String(d.getTime());
                }
                return String(rawKey);
            }
            return String(rawKey);
        }
        if (formulaModule && allowFormula && primaryKey) {
            rawKey = formulaModule.getFormulaValue(primaryKey, updateColumn.field);
        }
        return rawKey as string | number | boolean | null;
    };

    const normalizeValueToDepKey: (val: ValueType | ValueType[] | null | undefined) => string | number | boolean | null = (
        val: ValueType | ValueType[] | null | undefined
    ) => {
        if (Array.isArray(val)) {
            // Map elements through normalizeKey and join to produce a stable string key
            return val.map((v: ValueType) => String(normalizeKey(v))).join('|');
        }
        return normalizeKey(val);
    };

    const clearInput: () => void = useCallback((e?: React.MouseEvent) => {
        // Prevent default and stop propagation if event is provided
        e?.preventDefault();
        e?.stopPropagation();
        if (searchValue) {
            prevHeaderCheckedRef.current = false;
            const newSelected: Set<string | number | boolean> = new Set();
            for (const item of filteredData) {
                const rawKey: ValueType = getValue(updateColumn.field, item) as ValueType;
                const normKey: string | number | boolean | null = normalizeKey(rawKey);
                if (
                    !unselectedRowRef.current.has(normKey) &&
                    !previousUnselect.current.has(normKey)
                ) {
                    newSelected.add(normKey as string | number | boolean);
                }
            }
            selectedRowRef.current = newSelected;
        }
        searchPredicateRef.current = null;
        setSearchValue('');
        virtualContentScrollRef.current.scrollTop = 0;
        resetSearchNavigationState();

        // Ensure input gets focus but after a short delay to let events settle
        setTimeout(() => {
            searchInputRef.current?.focus();
        }, 0);
    }, [searchValue, filteredData]);

    /**
     * Update Initial Filter.
     */
    const updateInitialFilter: () => void = useCallback((): void => {
        let isBlackAdd: boolean = false;
        addCurrentFilterColumns.current = [];
        if (parentCurrentViewDataCount === 0) {
            prevHeaderCheckedRef.current = false;
            return;
        }
        for (let i: number = 0; i < filterColumns.length; i++) {
            const coll: FilterPredicates = filterColumns[parseInt(i.toString(), 10)];
            // if (coll.uid !== updateColumn.uid) { continue; }
            if (coll.value === '' || isNullOrUndefined(coll.value)) {
                if (isBlackAdd) { continue; }
                isBlackAdd = true;
            }
            if (coll.operator === 'notEqual') {
                addCurrentFilterColumns.current.push(coll);
                // normalize stored values for date types
                const rawUn: string | number | boolean | Date | null = coll.value === '' || coll.value === undefined
                    ? null
                    : (type === 'number' ? parseFloat(coll.value as string) : coll.value as string | number | boolean | Date);
                unselectedRowRef.current.add(normalizeKey(rawUn) as string | number | boolean | null);
                if (coll.value === '') {
                    unselectedRowRef.current.add(normalizeKey(type === 'string' ? null : undefined) as string | number | boolean | null);
                }
            } else if (coll.operator === 'equal') {
                addCurrentFilterColumns.current.push(coll);
                const rawSel: string | number | boolean | Date | null =
                    type === 'number' ? parseFloat(coll.value as string) : coll.value as string | number | boolean | Date;
                selectedRowRef.current.add(normalizeKey(rawSel) as string | number | boolean);
                if (coll.value === '') {
                    selectedRowRef.current.add(normalizeKey(type === 'string' ? null : undefined) as string | number | boolean | null);
                }
            } else if (!searchValue.length) {
                actualPredicate.current.push(coll);
            }
        }
        const hasFilter: boolean = Array.isArray(actualPredicate.current) && actualPredicate.current.length > 0;
        if (selectedRowRef.current.size) {
            prevHeaderCheckedRef.current = false;
        }
        else if (hasFilter) {
            prevHeaderCheckedRef.current = false;
        } else {
            prevHeaderCheckedRef.current = true;
        }
    }, [searchValue, actualPredicate, filterColumns]);

    /**
     * Reset selection state when dialog opens
     */
    useMemo(() => {
        if (isImmediateMode) {
            return;
        }
        resetSelectionState();
        if (!searchValue.length) {
            actualPredicate.current = [];
            updateInitialFilter();
        }
    }, [totalCount, searchValue, isImmediateMode]);

    /**
     * Reset selection state when dialog opens
     */
    useEffect(() => {
        if (internalOpen && isRender.current) {
            const target: HTMLElement = options.target?.querySelector('.sf-grid-filter-container');
            const hostEl: HTMLElement | undefined = dialogRef.current?.element as HTMLElement | undefined;
            const dialogElement: HTMLElement | undefined = hostEl?.firstElementChild as HTMLElement | undefined;
            if (!hostEl || !dialogElement) {
                return;
            }
            dialogElement.style.display = 'block';
            dialogElement.style.visibility = 'hidden';
            const dlgWidth: number = dialogElement.offsetWidth as number;
            hostEl.style.position = 'absolute';
            hostEl.style.width = dialogElement.offsetWidth + 'px';
            const sbPanel: HTMLElement = document.querySelector('.sb-scrollbar.sb-desktop');
            const newpos: OffsetPosition = calculatePosition(target, dialogElement, { horizontal: 'left', vertical: 'bottom' }, { horizontal: 'right',
                vertical: 'top' }, null, null, sbPanel);
            dialogElement.style.display = '';
            dialogElement.style.visibility = '';
            hostEl.style.top =  (newpos.top + target.getBoundingClientRect().height) + 'px';
            // Calculate left position with offsetX for accurate overflow detection after virtual scroll
            const leftPos: number = (newpos.left  + (offsetX ?? 0) + target.clientWidth);
            if (leftPos < options.parentElement.getBoundingClientRect().left) {
                hostEl.style.left = ((dlgWidth / 2) + leftPos) - 16 + 'px'; // right calculation
            } else {
                hostEl.style.left = leftPos + -4 + 'px';
            }
            isRender.current = false;
            const args: FilterDialogAfterOpenEvent = {
                cancel: false, requestType: ActionType.FilterDialogAfterOpen, columnType: options.type,
                columnName: updateColumn.field, action: ActionType.FilterDialogAfterOpen, options: options
            };
            args.type = ActionType.FilterDialogAfterOpen;
            grid.onFilterDialogAfterOpen?.(args);
        }
        recomputeSelectAll();
    }, [internalOpen, totalCount]);

    const generateKeys: (data: Object[]) => Object[] = useCallback((data: Object[]): Object[] => {
        const keys: (string | number | boolean | null)[] = [];
        for (let i: number = 0; i < data.length; i++) {
            const rawKey: ValueType = getValue(updateColumn.field, data[parseInt(i.toString(), 10)]) as ValueType;
            const normKey: string | number | boolean | null = normalizeKey(rawKey);
            keys.push(normKey as string | number | boolean | null);
        }
        return keys;
    }, []);

    const refreshDataManager: () => void = useCallback((): void => {
        const query: Query = options.query?.clone();
        const customBinding: boolean = 'result' in options.dataSource;
        if (searchValue.length > 0) {
            searchQueryGenerate(query);
        }
        queryGenerate(query);
        if (isRemote || customBinding) {
            setShowSpinner(true);
            query.skip(requestIdx * filterChoiceCount);
            query.take(filterChoiceCount);
            query.select(updateColumn.field);
            // query.sortBy(updateColumn.field, 'ascending');
            let isDistict: boolean = null;
            if (isPopupRendered.current && actualPredicate.current.length) {
                queryGenerate(query, true, true);
                isDistict = true;
                isPopupRendered.current = false;
            }
            query.requiresCount(isDistict);
            let dataManagerPromise: Promise<Object>;
            if (customBinding) {
                dataManagerPromise = dataModule.getData({ requestType: 'filterChoiceRequest' }, query);
            } else {
                dataManagerPromise = gridDataManager.executeQuery(query);
            }
            dataManagerPromise.then(dataManagerSuccess);
        } else {
            const localData: Object[] = options.dataSource instanceof DataManager ?
                (options.dataSource as DataManager).dataSource as Object[] :
                ((options.dataSource as DataResult)?.result ?? options.dataSource as JSON[]) as Object[];
            const result: Object[] = new DataManager(localData).executeLocal(query);
            const distinct: Object[] = DataUtil.distinct(result, updateColumn.field, true);
            setFilteredData(DataUtil.sort(distinct, updateColumn.field, DataUtil.fnAscending));
            setTotalCount(distinct.length);
            if (actualPredicate.current.length) {
                const query1: Query = new Query();
                queryGenerate(query1, true);
                previousResult.current = generateKeys(new DataManager(distinct).executeLocal(query1));
                previousCount.current = previousResult.current.length;
            }
        }
    }, [searchValue, startIdx, requestIdx]);

    /**
     * Handle successful data retrieval
     */
    const dataManagerSuccess: (response: Response | ReturnType | Object[]) => void = useCallback((
        response: Response | ReturnType | Object[]): void => {
        const cacheIdx: number = Math.floor(startIdx / filterChoiceCount);
        const isSecondRequest: boolean = cacheIdx === requestIdx;
        if ((response as ReturnType).distinctCount) {
            previousCount.current = (response as ReturnType).distinctCount;
        }
        const resultItems: Object[] = (response as ReturnType).result as Object[];
        const uniqueMap: Map<string, Object> = new Map<string, Object>();

        for (const item of resultItems) {
            const rawKey: ValueType = getValue(updateColumn.field, item) as ValueType;
            const normalizedKey: string | number | boolean | null = normalizeKey(rawKey);
            uniqueMap.set(String(normalizedKey), item);
        }

        const unique: Object[] = Array.from(uniqueMap.values());

        setCacheData((prev: { [x: number]: Object[] }) => ({
            ...prev,
            [isSecondRequest ? cacheIdx : requestIdx]: unique
        }));

        setTotalCount(unique.length);
        setFilteredData(unique);
        const from: number = startIdx > checkBoxesCount ? (startIdx % filterChoiceCount) - checkBoxesCount : 0;
        const to: number = (startIdx % filterChoiceCount) + (checkBoxesCount * 2);
        if (cacheIdx !== 0 && isSecondRequest && from < 0 && isNullOrUndefined(cacheData[cacheIdx - 1])) {
            setRequestIdx(cacheIdx - 1);
        } else if (to > filterChoiceCount && isSecondRequest && (((totalCount / filterChoiceCount) - 1) !== cacheIdx) &&
            isNullOrUndefined(cacheData[cacheIdx + 1])) {
            setRequestIdx(cacheIdx + 1);
        }
        setShowSpinner(false);
        if (actualPredicate.current.length) {
            const query1: Query = new Query();
            queryGenerate(query1, true);
            previousResult.current = previousResult.current.concat(
                generateKeys(new DataManager((response as ReturnType).result).executeLocal(query1)));
            previousCount.current = previousResult.current.length;
        }
    }, [startIdx, cacheData, requestIdx]);

    const searchQueryGenerate: (query: Query) => void = (query: Query): void => {
        const val: string = searchValue;
        let parsed: string | number | Date | boolean = (type !== 'string' && parseFloat(searchValue)) ? parseFloat(searchValue) : searchValue;
        const ignoreAccent: boolean = options.ignoreAccent || false;
        const field: string = updateColumn.field;
        let coll: FilterPredicates[] = [];
        const defaults: {
            predicate?: string, field?: string, type?: string, uid?: string
            operator?: string, matchCase?: boolean, ignoreAccent?: boolean
        } = {
            field: field, predicate: 'or', uid: updateColumn.uid,
            operator: 'equal', type: type, matchCase: true, ignoreAccent: ignoreAccent
        };
        let operator: string = isRemote ? (type === 'string' ? 'contains' : 'equal') :
            (type ? 'contains' : 'equal');
        if (type === 'boolean') {
            if (parsed !== undefined &&
                localization?.getConstant('filterTrue').toLowerCase().indexOf((parsed as string).toLowerCase()) !== -1) {
                parsed = 'true';
            } else if (parsed !== undefined &&
                localization?.getConstant('filterFalse').toLowerCase().indexOf((parsed as string).toLowerCase()) !== -1) {
                parsed = 'false';
            }
            if (parsed !== undefined &&
                localization?.getConstant('filterTrue').toLowerCase().indexOf((parsed as string).toLowerCase()) !== -1) {
                // eslint-disable-next-line no-constant-condition
                parsed = (moduleName.getModuleName && moduleName.getModuleName() === 'ODataAdaptor' || 'ODataV4Adaptor') ? true : 'true';
            } else if (parsed !== undefined &&
                localization?.getConstant('filterFalse').toLowerCase().indexOf((parsed as string).toLowerCase()) !== -1) {
                // eslint-disable-next-line no-constant-condition
                parsed = (moduleName.getModuleName && moduleName.getModuleName() === 'ODataAdaptor' || 'ODataV4Adaptor') ? false : 'false';
            }
            operator = 'equal';
        }
        if ((type === 'date' || type === 'datetime' || type === 'dateonly') && updateColumn.format) {
            const format: string = typeof (updateColumn.format) === 'string' ? updateColumn.format :
                (updateColumn.format).format;
            if (format) {
                parsed = formatter.fromView(val, (updateColumn as IColumnBase).parseFn, type) || new Date(val);
            } else {
                parsed = new Date(val);
            }
            if (type === 'dateonly') {
                parsed = (parsed as Date).getFullYear()  + '-' + padZero((parsed as Date).getMonth() + 1) + '-' + padZero((parsed as Date).getDate());
            }
        }
        let predicte: Predicate;
        if (type === 'date' || type === 'datetime' || type === 'dateonly') {
            operator = 'equal';
            const filterObj: Object = {
                field: field, operator: operator, value: parsed, matchCase: true,
                ignoreAccent: ignoreAccent
            };
            if (!isNullOrUndefined(parsed)) {
                predicte = getDatePredicate(filterObj, type);
            }
        } else {
            predicte = new Predicate(field, operator, parsed, true, ignoreAccent, false, false, updateColumn.filterComparer);
        }
        if (parsed && typeof val === 'string' &&
            localization?.getConstant('blanks').toLowerCase().indexOf((val as string).toLowerCase()) >= 0) {
            coll = coll.concat(generateNullValuePredicates(defaults));
            const emptyValPredicte: Predicate = generatePredicate(coll, undefined, isRemote ? moduleName?.getModuleName?.() ?? 'UrlAdaptor' : null);
            emptyValPredicte.predicates.push(predicte);
            predicte = emptyValPredicte;
            query.where(emptyValPredicte);
        } else {
            query.where(predicte);
        }
    };

    const queryGenerate: (query: Query, isPrevious?: boolean, isDistict?: boolean) => void = (
        query: Query, isPrevious?: boolean, isDistict?: boolean): void => {
        if (!isPrevious && grid?.searchSettings?.enabled && grid?.searchSettings?.value?.length) {
            const searchSettings: SearchSettings = grid?.searchSettings;
            const fields: string[] = searchSettings.fields.length ? searchSettings.fields
                : grid?.columns.map((f: ColumnProps) => f.field);
            query.search(searchSettings.value, fields, searchSettings.operator, searchSettings.caseSensitive, searchSettings.ignoreAccent);
        }
        const filterColumns: FilterPredicates[] = isPrevious ? actualPredicate.current : options.filteredColumns;
        if ((filterColumns?.length)) {
            const cols: Object[] = [];
            for (let i: number = 0; i < filterColumns.length; i++) {
                if (options.isCustomDataSource) { break; }
                const filterColumn: { uid: string, field: string } = filterColumns[parseInt(i.toString(), 10)] as {
                    uid: string, field: string
                };
                if (updateColumn.uid) {
                    if (filterColumn.uid !== updateColumn.uid || isPrevious) {
                        cols.push(filterColumns[parseInt(i.toString(), 10)]);
                    }
                } else {
                    if (filterColumn.field !== updateColumn.field || isPrevious) {
                        cols.push(filterColumns[parseInt(i.toString(), 10)]);
                    }
                }
            }
            const predicate: Predicate = getPredicateFromCols(cols, true, isRemote ? moduleName?.getModuleName?.() ?? 'UrlAdaptor' : null);
            if (predicate) {
                query.where(predicate, null, null, null, null, null, isDistict);
            }
        }
    };

    const getPredicateFromCols: (columns: Object[], isExecuteLocal?: boolean, moduleName?: string) => Predicate = (
        columns: Object[], isExecuteLocal?: boolean, moduleName?: string): Predicate => {
        const predicates: Predicate = getPredicate(columns, isExecuteLocal, moduleName);
        const predicateList: Predicate[] = [];
        for (const prop of Object.keys(predicates)) {
            predicateList.push(predicates[`${prop}`] as Predicate);
        }
        return predicateList.length && Predicate.and(predicateList);
    };

    // Initial data load
    useMemo(() => {
        resetSelectionState();
        actualPredicate.current = [];
        if (!defaultFilter) {
            setSearchValue('');
            setCacheData({});
            setStartIdx(0);
            setRequestIdx(0);
            setPageIndex(0);
            setFilteredData([]);
        } else {
            if (!filterColumns.length) {
                previousCount.current = 0;
                previousResult.current = [];
            }
            isPopupRendered.current = true;
            updateInitialFilter();
            recomputeSelectAll();
        }
    }, [defaultFilter]);

    // Initial data load
    useMemo(() => {
        if (!defaultFilter) { return; }
        refreshDataManager();
    }, [searchValue, requestIdx, defaultFilter]);

    const CSS_SEARCH_CANCEL_ICON: string = 'sf-search-clear sf-icons sf-input-group-icon';

    /**
     *
     * @param {UIEvent<HTMLDivElement>} args - Scroll event arguments
     */
    const onContentScroll: (args: UIEvent<HTMLDivElement>) => void = useCallback((args: UIEvent<HTMLDivElement>): void => {
        const target: HTMLDivElement = args.target as HTMLDivElement;
        const idx: number = target.scrollTop / checkBoxHeight;
        virtualContentScrollRef.current.scrollTop = target.scrollTop;
        const from: number = idx > checkBoxesCount * 2 ? checkBoxesCount : 0;
        const transY: number = (idx - from) * checkBoxHeight;
        const isScroll: boolean = totalCount > checkBoxesCount * 2;
        if (isScroll && idx < totalCount - checkBoxesCount && ((startIdx - idx <= 0 && idx - startIdx >= (checkBoxesCount)) ||
            (startIdx - idx >= 0 && idx - startIdx <= checkBoxesCount))) {
            (contentScrollRef.current.firstChild as HTMLElement).style.transform = `translate3d(0px, ${transY}px, 0)`;
            setStartIdx(Math.floor(idx));
        }
        else if (isScroll && idx + checkBoxesCount >= totalCount && startIdx <= (totalCount - checkBoxesCount)) {
            (contentScrollRef.current.firstChild as HTMLElement).style.transform = `translate3d(0px, ${transY}px, 0)`;
            setStartIdx(Math.floor(totalCount - checkBoxesCount));
        }

        const cacheIdx: number = Math.floor(idx / filterChoiceCount);
        if (cacheIdx !== pageIndex) {
            setPageIndex(cacheIdx);
        }
        if (isNullOrUndefined(cacheData[parseInt(cacheIdx.toString(), 10)]) && isRemote) {
            if (scrollStopTimerRef.current) {
                clearTimeout(scrollStopTimerRef.current);
            }
            scrollStopTimerRef.current = window.setTimeout(() => {
                setRequestIdx(cacheIdx);
            }, 200); // Debounce delay
        }

    }, [totalCount, startIdx, checkBoxesCount]);

    /**
     *
     * @param {UIEvent<HTMLDivElement>} args - Scroll event arguments
     */
    const onVirtualContentScroll: (args: UIEvent<HTMLDivElement>) => void = useCallback((args: UIEvent<HTMLDivElement>): void => {
        const target: HTMLDivElement = args.target as HTMLDivElement;
        contentScrollRef.current.scrollTop = target.scrollTop;
        args.target = contentScrollRef.current;
        onContentScroll(args);
    }, [onContentScroll]);

    const avalCache: (startIdx: number) => boolean = (startIdx: number): boolean => {
        const index: number = Math.floor(startIdx / filterChoiceCount);
        const from: number =  startIdx > checkBoxesCount ? (startIdx % filterChoiceCount) - checkBoxesCount : 0;
        let to: number = (startIdx % filterChoiceCount) + (checkBoxesCount * 2);
        const isLastBlock: boolean = totalCount <= filterChoiceCount ? true :
            ((totalCount / filterChoiceCount) - 1) === index;
        to = isLastBlock && to >= cacheData[parseInt(index.toString(), 10)]?.length ?
            cacheData[parseInt(index.toString(), 10)].length - 1 : to;
        if (!isNullOrUndefined(cacheData[parseInt(index.toString(), 10)]) &&
            (cacheData[parseInt(index.toString(), 10)][parseInt(from.toString(), 10)] ||
            cacheData[(index === 0 ? 0 : (index - 1))]) && (cacheData[parseInt(index.toString(), 10)][parseInt(to.toString(), 10)] ||
            cacheData[index + 1])) {
            return true;
        } else {
            return false;
        }
    };

    const isCurrentBlockData: (startIdx: number) => Object[] = (startIdx: number): Object[] => {
        const data: object[] = [];
        const index: number = Math.floor(startIdx / filterChoiceCount);
        const from: number = startIdx > checkBoxesCount ? (startIdx % filterChoiceCount) - checkBoxesCount : 0;
        let to: number = (startIdx % filterChoiceCount) + (checkBoxesCount * 2);
        const isLastBlock: boolean = totalCount <= filterChoiceCount ? true :
            ((totalCount / filterChoiceCount) - 1) === index;
        to = isLastBlock && to >= cacheData[parseInt(index.toString(), 10)]?.length ? cacheData[parseInt(index.toString(), 10)].length : to;
        if (from < 0) {
            data.push(...(cacheData[index - 1] as Object[]).slice(from));
            data.push(...(cacheData[parseInt(index.toString(), 10)] as Object[]).slice(0, to));
        } else if (to > filterChoiceCount) {
            data.push(...(cacheData[parseInt(index.toString(), 10)] as Object[]).slice(from, to));
            data.push(...(cacheData[index + 1] as Object[]).slice(0, to - filterChoiceCount));
        } else {
            data.push(...(cacheData[parseInt(index.toString(), 10)] as Object[]).slice(from, to));
        }
        return data;
    };


    const toFormatValue: (data: Object, primaryKey: string | number) => string = (data: Object, primaryKey: string | number): string => {
        let value: Date | number | string | FormulaValue = getValue(updateColumn.field, data);
        if (formulaModule && allowFormula) {
            value = formulaModule.getFormulaValue(primaryKey, updateColumn.field);
        }
        if (value === '' || isNullOrUndefined(value)) {
            value = localization?.getConstant('blanks').toString();
        } else if (!isNullOrUndefined(updateColumn.format) && !isNullOrUndefined(updateColumn.type) && options.formatFn) {
            value = formatter.toView((value as number), options.formatFn)?.toString();
        }
        if (typeof value === 'boolean') {
            value = value === true ? localization?.getConstant('filterTrue') : localization?.getConstant('filterFalse');
        }
        if (options.enableHtmlSanitizer) {
            value = SanitizeHtmlHelper.sanitize(value as string);
        }
        return value.toString();
    };

    const filterCheckBoxes: React.JSX.Element[] = useMemo(() => {
        if (totalCount === 0 || !defaultFilter) { return []; }
        const filterCheckBox: React.JSX.Element[] = [];
        let from: number = startIdx > (checkBoxesCount * 2) ? checkBoxesCount : 0;
        let to: number = startIdx + (checkBoxesCount * 2);
        const availData: boolean = isRemote && avalCache(startIdx);
        const data: Object[] = availData ? isCurrentBlockData(startIdx) : filteredData;
        to = isRemote ? data.length : (totalCount <= to ? totalCount : to);
        from =  isRemote ? 0 : startIdx - from;
        const primaryKeyField: string | undefined = grid.getPrimaryKeyFieldNames?.()[0];

        for (let i: number = from; i < to; i++) {
            if (isRemote && !availData && isShimmer) {
                filterCheckBox.push(
                    <div className="sf-filter-checkbox" style={{ height: `${checkBoxHeight}px`, width: '100%', display: 'flex' }}>
                        <span className='sf-excel-shimmer' style={{ marginRight: '15px', height: '15px', width: '10%' }}>
                            <Skeleton variant={Variants.Square} animation={AnimationType.Wave} width={'100%'} height={15} />
                        </span>
                        <span  className='sf-excel-shimmer' style={{ height: '15px', width: '90%' }}>
                            <Skeleton variant={Variants.Text} animation={AnimationType.Wave} width={'100%'} height={15} />
                        </span>
                    </div>
                );
            } else {
                const checkboxData: Object = data[parseInt(i.toString(), 10)];
                const primaryKey: string | number = checkboxData?.[`${primaryKeyField}`] as string | number;
                const rawKey: ValueType = getValue(updateColumn.field, checkboxData) as ValueType;
                const key: string | number | boolean | null = normalizeKey(rawKey, primaryKey);
                // Determine checked state based on previous header state
                let checked: boolean;
                if (previousResult.current.includes(allowFormula ? rawKey : key) && previousCount.current) {
                    checked = !(previousUnselect.current.has(key) || unselectedRowRef.current.has(key));
                } else if (prevHeaderCheckedRef.current && !previousCount.current) {
                    // Header was checked - all checked by default, except those in unselectedRowRef
                    checked = !unselectedRowRef.current.has(key);
                } else {
                    // Header was unchecked - all unchecked by default, except those in selectedRowRef
                    checked = selectedRowRef.current.has(key);
                }

                const formattedValue: string = toFormatValue(checkboxData, primaryKey);
                filterCheckBox.push(
                    <div
                        key={`${String(key)}_${i}`}
                        className="sf-filter-checkbox"
                        aria-posinset={i}
                        style={{ height: `${checkBoxHeight}px`, width: '100%' }}>
                        <Checkbox
                            checked={checked}
                            label={(updateColumn.disableHtmlEncode === false ?
                                <span dangerouslySetInnerHTML={{ __html: formattedValue }} /> : formattedValue) as unknown as string}
                            className="sf-checkbox-wrapper sf-css sf-checkbox-filtertext"
                            onChange={(e: CheckboxChangeEvent) => {
                                const next: boolean = e?.value;
                                handleItemToggle(key as string | number | boolean, next);
                            }}
                        />
                    </div>
                );
            }
        }

        return filterCheckBox;

    }, [searchValue, filteredData, cacheData, totalCount, startIdx, updateColumn.field, updateColumn.disableHtmlEncode, selectionVersion]);

    const searchContainer: React.JSX.Element = useMemo(() => {
        if (!defaultFilter) { return null; }
        const from: number = startIdx > checkBoxesCount * 2 ? checkBoxesCount : 0;
        const transY: number = (startIdx - from) * checkBoxHeight;
        const bottomPadding: string | number = isImmediateMode && isExcel ? '12px' : 0;
        return (
            <div className={`sf-search-container ${isExcel ? '' : 'sf-checkbox-filter'}`} style={{ paddingBottom: bottomPadding }}>
                {!hideSearchbox && <span className='sf-searchbox sf-fields'>
                    <span className={`sf-input-group sf-control sf-medium ${isFocused ? ' sf-input-focus' : ''}`}>
                        <InputBase
                            ref={searchInputRef}
                            tabIndex={0}
                            placeholder="Search"
                            value={searchValue}
                            onChange={handleChange}
                            onKeyDown={(event: React.KeyboardEvent<HTMLButtonElement>) => event.code === 'Enter' ? filterbtnHandler() : undefined}
                            onFocus={handleFocus}
                            onBlur={handleBlur}
                        />
                        {renderFloatLabelElement('Never', isFocused, searchValue, localization?.getConstant('searchButtonLabel'), options.id)}
                        {renderClearButton(searchValue, clearInput)}
                        {!searchValue?.length && <span
                            className={CSS_SEARCH_CANCEL_ICON + ' sf-search-icon'}
                            title={localization?.getConstant('searchButtonLabel')}
                        >
                            <SearchIcon className="sf-font-size-xl"/>
                        </span>}
                    </span>

                </span>}
                {totalCount > 0 && (
                    <div className='sf-virtual-scroll-container'>
                        <div className="sf-filter-checkbox sf-checkbox-selectall" /* uid is generated by Syncfusion internally; wrapper class added */>
                            <Checkbox
                                checked={selectAllChecked}
                                indeterminate={selectAllIndeterminate}
                                label={localization?.getConstant('selectAll')}
                                // Add CSS hooks to get close to your posted DOM/classes
                                className="sf-checkbox-wrapper sf-css sf-checkbox-filtertext sf-selectall"
                                onChange={(e: CheckboxChangeEvent) => {
                                    const next: boolean = e?.value;
                                    handleSelectAllToggle(next);
                                }}
                            />
                        </div>
                        {(!isImmediateMode && searchValue?.length) ? <div className="sf-filter-checkbox" /* uid is generated by Syncfusion internally; wrapper class added */>
                            <Checkbox
                                checked={addCurrentFilter && totalCount > 0}
                                label={localization?.getConstant('addCurrentSelection')}
                                // Add CSS hooks to get close to your posted DOM/classes
                                className="sf-checkbox-wrapper sf-css sf-checkbox-filtertext sf-selectall"
                                onChange={(e: CheckboxChangeEvent) => {
                                    const next: boolean = e?.value;
                                    setAddCurrentFilter(next);
                                }}
                            />
                        </div> : null}
                    </div>
                )}

                <div className='sf-checkbox-content' style={{ height: '200px', width: '100%', position: 'relative' }} >
                    <div ref={contentScrollRef} className='sf-spinner' style={{ height: '200px', width: '100%' }} onScroll={onContentScroll}>
                        {!isShimmer && <Spinner visible={showSpinner} className={cssClass} overlay={true} />}
                        <div className='sf-virtual-checkbox' style={{
                            position: 'absolute', minHeight: 200, maxHeight: '100%',
                            width: '100%', zIndex: 1, transform: `translate3d(0px, ${transY}px, 0)`
                        }}>
                            <div className='sf-checkboxlist sf-fields' style={{ width: '100%' }} id={options.id + '_CheckBoxList'}>
                                {/* Items */}
                                {totalCount === 0 ? (
                                    <div className="sf-excel-empty-checkbox">{localization?.getConstant('noMatches')}</div>
                                ) : filterCheckBoxes}
                            </div>
                        </div>
                        <div
                            className='sf-excel-virtualtrack'
                            style={{
                                position: 'relative',
                                zIndex: 0,
                                width: '100%',
                                height: totalCount * checkBoxHeight
                            }}
                        ></div>
                    </div>

                    <div
                        ref={virtualContentScrollRef}
                        className='sf-scroll-virtualtrack'
                        onScroll={onVirtualContentScroll}
                        tabIndex={-1}
                        style={{
                            overflow: 'hidden auto',
                            position: 'absolute',
                            height: '100%',
                            width: '15px',
                            top: '0px',
                            right: '0px'
                        }}
                    >
                        <div style={{ width: '15px', height: totalCount * checkBoxHeight }} />
                    </div>

                </div>
            </div>
        );

    }, [searchValue, isFocused, filteredData, cacheData, totalCount, startIdx, selectionVersion, previousCount,
        selectAllChecked, selectAllIndeterminate, showSpinner, addCurrentFilter]);

    const filterType: React.JSX.Element = useMemo(() => {
        return (
            <div className='sf-grid-excel-filter-type'>
                <div>Filter Type</div>
                <div className='sf-excel-top-separator'>
                    <Button
                        size={Size.Small}
                        variant={defaultFilter ? Variant.Filled : Variant.Outlined}
                        color={defaultFilter ? Color.Primary : Color.Secondary}
                        aria-label={localization?.getConstant('primary')}
                        onClick={() => setDefaultFilter(true)}
                        className={cssClass}
                    >
                        {localization?.getConstant('primary')}
                    </Button>
                    <span className='sf-excel-left-separator' />
                    <Button
                        size={Size.Small}
                        variant={!defaultFilter ? Variant.Filled : Variant.Outlined}
                        color={!defaultFilter ? Color.Primary : Color.Secondary}
                        aria-label={localization?.getConstant('advanced')}
                        onClick={() => setDefaultFilter(false)}
                        className={cssClass}
                    >
                        {localization?.getConstant('advanced')}
                    </Button>
                </div>
            </div>
        );
    }, [defaultFilter]);

    const Operator: React.FC<{
        operator: string, setOperator: React.Dispatch<React.SetStateAction<string>>,
        setOperatorValue: React.Dispatch<React.SetStateAction<ValueType | ValueType[] | null>>, isSecondOperator?: boolean
    }> = useCallback(({ operator, setOperator, setOperatorValue, isSecondOperator }:
    { operator: string, setOperator: React.Dispatch<React.SetStateAction<string>>,
        setOperatorValue: React.Dispatch<React.SetStateAction<ValueType | ValueType[] | null>>, isSecondOperator?: boolean}
    ): JSX.Element => {
        return (
            <DropDownList
                value={operator}
                variant={Variant.Outlined}
                fields={{ text: 'text', value: 'value' }}
                dataSource={operators}
                disabled={isSecondOperator && (
                    (isNullOrUndefined(firstOperatorValueRef.current) || firstOperatorValueRef.current === '') &&
                    (firstOperatorRef.current !== 'isEmpty' && firstOperatorRef.current !== 'isNotEmpty' &&
                        firstOperatorRef.current !== 'isNull' && firstOperatorRef.current !== 'isNotNull')
                )}
                popupSettings={{ zIndex: parseInt(window.getComputedStyle(dialogRef.current?.element ?? document.body).zIndex, 10) }}
                onChange={(args: DDLChangeEvent) => {
                    const newOperator: string = args.value as string;
                    setOperator(newOperator);
                    if (isSecondOperator) {
                        secondOperatorRef.current = newOperator;
                    } else {
                        firstOperatorRef.current = newOperator;
                    }
                    if (newOperator === 'isNull' || newOperator === 'isNotNull' || newOperator === 'isEmpty' || newOperator === 'isNotEmpty') {
                        setOperatorValue(null);
                        if (isSecondOperator) {
                            secondOperatorValueRef.current = null;
                        } else {
                            firstOperatorValueRef.current = null;
                        }
                        scheduleImmediateApply();
                    }
                    if (firstOperatorValueRef.current !== null || secondOperatorValueRef.current !== null) {
                        scheduleImmediateApply();
                    }
                }}
                className={cssClass + ' sf-excel-filter-dropdown'}
            />
        );
    }, [operators, cssClass, defaultFilter]);

    const advancedContainer: React.JSX.Element = useMemo(() => {
        const Condition: () => JSX.Element = (): JSX.Element => {
            const conditionChange: (args: RadioButtonChangeEvent) => void = (args: RadioButtonChangeEvent): void => {
                const isAnd: boolean = args.value === 'and';
                andCondition.current = isAnd;
                setAndConditionUI(isAnd);
                if (isImmediateMode) {
                    scheduleImmediateApply();
                }
            };

            return <>
                <RadioButton
                    name='condition'
                    value='and'
                    checked={andConditionUI}
                    label={localization?.getConstant('and')}
                    onChange={conditionChange}
                    className={cssClass} />
                <span className='sf-excel-left-separator' />
                <RadioButton
                    name='condition'
                    value='or'
                    checked={!andConditionUI}
                    label={localization?.getConstant('or')}
                    onChange={conditionChange}
                    className={cssClass} />
            </>;
        };

        /**
         * @param {boolean} second  - Define the parameter to indicate whether it’s a second condition or the first in the group.
         *
         * @returns {JSX.Element} The rendered filter input component as JSX element
         */
        const firstFilterInputElement: (second?: boolean) => JSX.Element = (second?: boolean): JSX.Element => {
            const firstInputDisabled: boolean =  firstOperator === 'isNull' || firstOperator === 'isNotNull' || firstOperator === 'isEmpty' || firstOperator === 'isNotEmpty';
            const secondInputDisabled: boolean =  secondOperator === 'isNull' || secondOperator === 'isNotNull' || secondOperator === 'isEmpty' || secondOperator === 'isNotEmpty';
            const placeholder: string = localization?.getConstant('enterValue');
            const format: string | Record<string, unknown> = updateColumn.format as string | Record<string, unknown>;
            switch (type) {
            case 'number':
                return (<NumericTextBox
                    value={(second ? secondOperatorValue : firstOperatorValue) as number}
                    placeholder={placeholder}
                    className={cssClass}
                    variant={Variant.Outlined}
                    onChange={(args: NumericChangeEvent) => {
                        if (second) {
                            setSecondOperatorValue(args.value);
                            secondOperatorValueRef.current = args.value;
                        } else {
                            setFirstOperatorValue(args.value);
                            firstOperatorValueRef.current = args.value;
                        }
                        if (isImmediateMode) {
                            scheduleImmediateApply();
                        }
                    }}
                    onKeyDown={(event: React.KeyboardEvent<HTMLInputElement>) => event.code === 'Enter' ? filterbtnHandler() : undefined}
                    format={(typeof (format) === 'object' && format ? getNumberPattern(format, false)?.toLowerCase() :
                        (format as string)?.toLowerCase()) ?? 'n2'} // only provided string format support.
                    disabled={second ? secondInputDisabled || (isNullOrUndefined(firstOperatorValueRef.current) && firstOperatorRef.current !== 'isNull' && firstOperatorRef.current !== 'isNotNull') : firstInputDisabled}
                    {...updateColumn.filter.params as NumericTextBoxProps}
                />);

            case 'date':
            case 'dateonly':
                return (<DatePicker
                    value={(second ? secondOperatorValue : firstOperatorValue) as Date}
                    placeholder={placeholder}
                    className={cssClass}
                    variant={Variant.Outlined}
                    onKeyDown={(event: React.KeyboardEvent<HTMLInputElement>) => event.code === 'Enter' ? filterbtnHandler() : undefined}
                    format={format ? getCustomDateFormat(format, type) : 'M/d/yyyy'} // only provided string format support
                    onChange={(args: DatePickerChangeEvent) => {
                        if (second) {
                            setSecondOperatorValue(args.value);
                            secondOperatorValueRef.current = args.value;
                        } else {
                            setFirstOperatorValue(args.value);
                            firstOperatorValueRef.current = args.value;
                        }
                        if (isImmediateMode) {
                            scheduleImmediateApply();
                        }
                    }}
                    disabled={second ? secondInputDisabled || (isNullOrUndefined(firstOperatorValueRef.current) && firstOperatorRef.current !== 'isNull' && firstOperatorRef.current !== 'isNotNull') : firstInputDisabled}
                    {...updateColumn.filter.params as DatePickerProps}
                />);

            case 'datetime':
                return (<DateTimePicker
                    value={(second ? secondOperatorValue : firstOperatorValue) as Date}
                    placeholder={placeholder}
                    className={cssClass}
                    variant={Variant.Outlined}
                    onKeyDown={(event: React.KeyboardEvent<HTMLInputElement>) => event.code === 'Enter' ? filterbtnHandler() : undefined}
                    format={format ? getCustomDateFormat(format, type) : 'M/d/yyyy hh:mm a'} // only provided string format support
                    onChange={(args: DateTimePickerChangeEvent) => {
                        if (second) {
                            setSecondOperatorValue(args.value);
                            secondOperatorValueRef.current = args.value;
                        } else {
                            setFirstOperatorValue(args.value);
                            firstOperatorValueRef.current = args.value;
                        }
                        if (isImmediateMode) {
                            scheduleImmediateApply();
                        }
                    }}
                    disabled={second ? secondInputDisabled || (isNullOrUndefined(firstOperatorValueRef.current) && firstOperatorRef.current !== 'isNull' && firstOperatorRef.current !== 'isNotNull') : firstInputDisabled}
                    {...updateColumn.filter.params as unknown as DateTimePickerProps}
                />);

            default :
                return (<TextBox
                    value={(second ? secondOperatorValue : firstOperatorValue) as string}
                    onChange={(args: TextBoxChangeEvent) => {
                        if (second) {
                            setSecondOperatorValue(args.value);
                            secondOperatorValueRef.current = args.value;
                        } else {
                            setFirstOperatorValue(args.value);
                            firstOperatorValueRef.current = args.value;
                        }
                    }}
                    variant={Variant.Outlined}
                    onKeyUp={() => isImmediateMode ? scheduleImmediateApply() : undefined}
                    onKeyDown={(event: React.KeyboardEvent<HTMLInputElement>) =>
                        event.code === 'Enter' ? filterbtnHandler() : undefined
                    }
                    placeholder={localization?.getConstant('enterValue')}
                    className={cssClass}
                    disabled={
                        second
                            ? secondInputDisabled || (
                                (isNullOrUndefined(firstOperatorValueRef.current) || firstOperatorValueRef.current === '') &&
                                (firstOperatorRef.current !== 'isEmpty' && firstOperatorRef.current !== 'isNotEmpty')
                            )
                            : firstInputDisabled
                    }
                    {...updateColumn.filter.params as TextBoxProps}
                />);
            }
        };

        return (
            <div className={`sf-grid-excel-filter-container ${isMenu ? 'sf-menu-top' : ''}`}>
                <div>
                    <Operator operator={firstOperator} setOperator={setFirstOperator} setOperatorValue={setFirstOperatorValue} />
                </div>
                <div className='sf-excel-top-separator'>
                    {firstFilterInputElement()}
                </div>
                <div className='sf-excel-top-separator'>
                    <Condition />
                </div>
                <div className='sf-excel-top-separator'>
                    <Operator operator={secondOperator} setOperator={setSecondOperator} setOperatorValue={setSecondOperatorValue}
                        isSecondOperator={true} />
                </div>
                <div className='sf-excel-top-separator'>
                    {firstFilterInputElement(true)}
                </div>
            </div>
        );
    }, [firstOperator, secondOperator, normalizeValueToDepKey(firstOperatorValue), normalizeValueToDepKey(secondOperatorValue),
        andConditionUI, defaultFilter]);

    const filterContent: React.JSX.Element = (
        <>
            {isExcel && renderExcelMenu}
            {isExcel && filterType}
            {defaultFilter && searchContainer}
            {!defaultFilter && advancedContainer}
        </>
    );

    const filterFooter: React.JSX.Element = isMenu && !isImmediateMode ? (
        <div className='sf-menu-filter-actions'>
            <Button variant={Variant.Standard} className={cssClass + ' sf-menu-filter-clear'} onClick={clearFilter}>
                Clear
            </Button>
            <Button variant={Variant.Standard} color={Color.Primary} className={cssClass + ' sf-menu-filter-apply'} onClick={filterbtnHandler}>
                Apply
            </Button>
        </div>
    ) : isImmediateMode && !isExcel ? (
        <Button
            variant={Variant.Standard}
            className={cssClass}
            onClick={clearFilter}
            disabled={!searchValue?.length && filterLength < 1}
        >
            {localization?.getConstant('clear')}
        </Button>
    ) : !isImmediateMode ? (
        <>
            <Button variant={Variant.Standard} color={Color.Primary} className={cssClass} onClick={filterbtnHandler}
                disabled={defaultFilter ? (!selectAllChecked && !selectAllIndeterminate) : disableAdvancedOkBtn}>
                {localization?.getConstant('oKButton')}
            </Button>
            <Button variant={Variant.Standard} className={cssClass} onClick={isExcel ? handleCancel : clearFilter}
                disabled={isExcel ? false : filterLength < 1}>
                {isExcel ? localization?.getConstant('cancelButton') : localization?.getConstant('clear')}
            </Button>
        </>
    ) : undefined;

    return (
        <>
            {internalOpen && (embedded ? (
                <div className={cssClass + ' sf-filter-popup sf-excel-filter sf-filter-panel-column'}
                    data-uid={updateColumn.uid} data-field={updateColumn.field}>
                    {filterContent}
                    {filterFooter && <div className='sf-dlg-footer-content sf-content-end'>{filterFooter}</div>}
                </div>
            ) : (
                <Dialog
                    id={options.id + '_ExcelFilter'}
                    ref={dialogRef}
                    className={cssClass + ' sf-filter-popup sf-excel-filter'}
                    open={internalOpen}
                    data-uid={updateColumn.uid}
                    initialFocusRef={searchInputRef}
                    modal={false}
                    target={target as HTMLElement}
                    closeIcon={false}
                    onKeyDown={keyDownHandler}
                    onKeyUp={keyUpHandler}
                    style={{ width: '285px', maxHeight: '800px', zIndex: 10000, position: 'absolute' }}
                    footer={filterFooter}
                >
                    {filterContent}
                </Dialog>
            ))}
        </>
    );
};

ExcelFilter.displayName = 'ExcelFilter';
