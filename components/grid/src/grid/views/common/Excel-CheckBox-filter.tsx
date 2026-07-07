import * as React from 'react';
import { useState, useCallback, useEffect, useMemo, UIEvent, useRef, JSX } from 'react';
import { Dialog, IDialog, Spinner, calculatePosition, calculateRelativeBasedPosition } from '@syncfusion/react-popups';
import { Button, Color, Variant, Checkbox,  RadioButton, RadioButtonChangeEvent, CheckboxChangeEvent } from '@syncfusion/react-buttons';
import { useGridComputedProvider, useGridMutableProvider } from '../../contexts';
import { ActionType, FilterDialogAfterOpenEvent, ColumnProps, FilterPredicates, IColumnBase, IGrid, IValueFormatter, MutableGridSetter, MutableGridBase, SearchSettings, ScrollMode, ServiceLocator, ValueType} from '../../types';
import { SortAscendingIcon, SortDescendingIcon, FilterClearIcon, FilterIcon, SearchIcon } from '@syncfusion/react-icons';
import { closest, DateFormatOptions, extend, getNumberPattern, getValue, IL10n, isNullOrUndefined, NumberFormatOptions, SanitizeHtmlHelper, Size } from '@syncfusion/react-base';
import { DropDownList,  ChangeEvent as DDLChangeEvent } from '@syncfusion/react-dropdowns';
import { InputBase, NumericChangeEvent, NumericTextBox, NumericTextBoxProps, renderClearButton, renderFloatLabelElement, TextBox, TextBoxChangeEvent, TextBoxProps } from '@syncfusion/react-inputs';
import {
    AdaptorOptions,
    DataManager,
    DataResult,
    DataUtil,
    Predicate,
    Query
} from '@syncfusion/react-data';
import { generatePredicate, getDatePredicate, padZero } from '../../utils';
import { ReturnType } from '@syncfusion/react-data';
import { getCustomDateFormat, getPredicate } from '../../utils';
import { AnimationType, Skeleton, Variants } from '@syncfusion/react-notifications';
import { DatePicker, DatePickerChangeEvent, DatePickerProps } from '@syncfusion/react-calendars';
/**
 * @hidden
 */
export interface ExcelFilterArgs {
    type?: string;
    filterType?: string;
    loadingIndicator?: string;
    operators?: { [key: string]: object; }[] | string[];
    height: number;
    columns?: ColumnProps[];
    field?: string;
    query?: Query;
    cssClass?: string;
    parentElement?: HTMLElement;
    dataSource?: Object[] | DataManager | DataResult; // for column datasource or grid datasource
    dataManager?: DataManager;  // grid data manager
    format?: string | NumberFormatOptions | DateFormatOptions;
    filteredColumns?: Object[];
    caseSensitive?: boolean;
    ignoreAccent?: boolean;
    parentCurrentViewDataCount? : number; // for on demand parent current view data count
    handler?: Function;
    target?: Element;
    column?: ColumnProps;
    isRemote?: boolean;
    serviceLocator?: ServiceLocator;
    id?: string;
    enableSort?: boolean;
    formatFn?: Function;
    disableSearchOption?: boolean;
    disableSortOption?: boolean;
    enableHtmlSanitizer?: boolean;
    isCustomDataSource?: boolean;
    mode?: string;
    immediateModeDelay?: number;
}

// Minimal props interface tailored for Excel-like filter popup
type ExcelFilterDialogProps = {
    isOpen: boolean;
    options?: ExcelFilterArgs;
    onCancel?: () => void;
};

const CSS_EXCEL_ASC: string = 'sf-excel-ascending sf-menu-item';
const CSS_EXCEL_DEC: string = 'sf-excel-descending sf-menu-item';
const CSS_SEPARATOR: string = 'sf-separator sf-excel-separator';
const CSS_CLEAR_ITEM: string = 'sf-menu-item sf-clear-filter';

export const ExcelFilter: React.FC<ExcelFilterDialogProps> = ({
    isOpen,
    options,
    onCancel
}: ExcelFilterDialogProps): React.ReactElement | null => {
    const grid: Partial<IGrid> & Partial<MutableGridSetter> = useGridComputedProvider();
    const gridMutable: Partial<MutableGridBase> = useGridMutableProvider();
    const { offsetX, dataModule } = gridMutable;
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
    const [defaultFilter, setDefaultFilter] = useState<boolean>(true);
    const isImmediateMode: boolean = options?.mode === 'Immediate' && defaultFilter === true;
    const delay: number = options.immediateModeDelay;
    const operators: { [key: string]: object; }[] | string[] = options.operators;
    const operator: string = updateColumn.filter?.operator || (updateColumn.type === 'string' ? 'startsWith' : 'equal');
    let oprerator2: string = null;
    let value2: ValueType | ValueType[] = null;
    if (filterColumns.length === 2) {
        oprerator2 =  filterColumns[1].operator;
        value2 = filterColumns[1].value;
    }
    const [firstOperator, setFirstOperator] = useState(filterColumns[0]?.operator || operator);
    const [secondOperator, setSecondOperator] = useState(oprerator2);
    const [firstOperatorValue, setFirstOperatorValue] = useState<ValueType | ValueType[]>(filterColumns[0]?.value || null);
    const [secondOperatorValue, setSecondOperatorValue] = useState<ValueType | ValueType[]>(value2 || null);
    const andCondition: React.RefObject<boolean> = useRef<boolean>(true);
    const scrollStopTimerRef: React.RefObject<number> = useRef<number | null>(null);
    const filterChoiceCount: number = 1000;
    const checkBoxesCount: number = 5;
    const checkBoxHeight: number = 40;
    const [filteredData, setFilteredData] = useState<Object[]>([]);
    const isPopupRendered: React.RefObject<boolean> =  useRef<boolean>(true);
    const disableAdvancedOkBtn: boolean = useMemo(() => {
        return (isNullOrUndefined(firstOperatorValue) || firstOperatorValue === '') &&
            (isNullOrUndefined(secondOperatorValue) || secondOperatorValue === '');
    }, [firstOperatorValue, secondOperatorValue]);
    const filterExistingColumns: FilterPredicates[] =
        (options.filteredColumns ?? []).filter((col: FilterPredicates) => {
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

    useEffect(() => { setInternalOpen(isOpen); }, [isOpen]);

    const handleCancel: () => void = useCallback((): void => {
        onCancel?.();
        setInternalOpen(false);
    }, [onCancel, totalCount]);

    const excelDialogFocus: (elem?: Element, className?: string) => void = useCallback((elem?: Element, className?: string) => {
        const menuFocusElem: Element = (dialogRef.current?.element).querySelector('.' + className);
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
            const focusableElements: HTMLElement[] = Array.from(dialogRef.current?.element.querySelectorAll(
                'input, button, [tabindex]:not([tabindex="-1"]), .sf-menu-item:not(.sf-disabled)'
            ));
            focusNextOrPrevElement(e, focusableElements, 'sf-menufocus');
        }

    }, [dialogRef, defaultFilter, handleCancel]);

    const clickHandler: (e: MouseEvent) => void = useCallback((e: MouseEvent) => {
        const target: Element = e.target as Element;
        const popup: Element = closest(target, '.sf-excel-filter') || closest(target, '.sf-excel-filter-dropdown');
        const filterIcon: Element = closest(target, '.sf-grid-filter-container');
        const datePickerCalendar: Element = closest(target, '.sf-calendar') || closest(target, '.sf-datepicker');
        const elem: Element = closest(target, '.sf-filter-checkbox');
        if (popup && defaultFilter) {
            excelDialogFocus(elem, 'sf-checkbox-focus');
        }
        if ((!popup && !filterIcon && !datePickerCalendar) || (filterIcon && closest(filterIcon, '.sf-grid-header-cell').getAttribute('data-mappinguid') !== updateColumn.uid)) {
            handleCancel();
        }
    }, [defaultFilter]);

    useEffect(() => {
        if (internalOpen) {
            document.body.addEventListener('click', clickHandler);
        }
        return () => {
            document.body.removeEventListener('click', clickHandler);
        };
    }, [internalOpen, defaultFilter]);

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
    }, [ shouldSkipConfirmOnEdit, onCancel]);

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

    const filterbtnHandler: () => void = useCallback((): void => {
        closeDialogIfEditDirty();
        if (!defaultFilter) {
            let fColl: FilterPredicates[] = [];
            const field: string = updateColumn.field;
            const matchCase: boolean = options.type === 'string' || isNullOrUndefined(options.type) ?
                (options.caseSensitive || false) : undefined;
            const predicate: string = andCondition.current ? 'and' : 'or';
            const ignoreAccent: boolean = options.ignoreAccent || false;
            let secondPredicate: Predicate;
            const arg: {
                cancel: boolean, arg1: string, arg2: string,
                arg3: ValueType | ValueType[], arg4: string, arg6: boolean, arg7: string, arg8: ValueType | ValueType[] | number | Date
            } = {
                arg1: field, arg2: firstOperator, arg3: firstOperatorValue, arg4: predicate,
                arg6: ignoreAccent, arg7: secondOperator, arg8: secondOperatorValue, cancel: false
            };
            fColl.push({
                field: field,
                predicate: predicate,
                caseSensitive: matchCase,
                ignoreAccent: ignoreAccent,
                operator: firstOperator,
                value: arg.arg3,
                type: type
            });
            secondPredicate = new Predicate(field, firstOperator, arg.arg3, !matchCase, ignoreAccent);
            if (!isNullOrUndefined(secondOperator) && !isNullOrUndefined(arg.arg8)) {
                fColl.push({
                    field: field,
                    predicate: predicate,
                    caseSensitive: matchCase,
                    ignoreAccent: ignoreAccent,
                    operator: secondOperator as string,
                    value: arg.arg8,
                    type: type
                });
                secondPredicate = (secondPredicate as Object)[`${predicate}`](field, secondOperator, secondOperatorValue as string, !matchCase, ignoreAccent);
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
        if (!isImmediateMode) {
            handleCancel();
        }

    }, [updateColumn, filterExistingColumns, defaultFilter, firstOperator, secondOperator,
        firstOperatorValue, secondOperatorValue, shouldSkipConfirmOnEdit]);

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
                                handleCancel();
                            }}
                        >
                            <span className='sf-menu-icon sf-icons sf-sortascending'><SortAscendingIcon className="sf-font-size-xl"/></span>
                            {(type === 'string') ? localization.getConstant('SortAtoZ') : (type === 'datetime' || type === 'date') ?
                                localization.getConstant('SortByOldest') : localization.getConstant('SortSmallestToLargest')}
                        </li>
                        <li
                            className={CSS_EXCEL_DEC + ((!updateColumn?.allowSort || hdrele === 'descending' || !defaultFilter) ? ' sf-disabled' : '')}
                            tabIndex={(!updateColumn?.allowSort || hdrele === 'descending' || !defaultFilter) ? -1 : 0}
                            onClick={() => {
                                handleCancel();
                            }}
                        >
                            <span className='sf-menu-icon sf-icons sf-sortdescending'><SortDescendingIcon className="sf-font-size-xl"/></span>
                            {(type === 'string') ? localization.getConstant('SortZtoA') : (type === 'datetime' || type === 'date') ?
                                localization.getConstant('SortByNewest') : localization.getConstant('SortLargestToSmallest')}
                        </li>
                        <li className={CSS_SEPARATOR + (!defaultFilter ? ' sf-disabled' : '')}></li> </>}
                    <li
                        className={CSS_CLEAR_ITEM + (filterLength < 1 || !defaultFilter ? ' sf-disabled' : '')}
                        tabIndex={filterLength < 1 || !defaultFilter ? -1 : 0}
                        onClick={() => {
                            // if (filterLength > 0) {
                            options.handler(null, 'clear-filter', updateColumn.field);
                            handleCancel();
                            // }

                        }}
                    >
                        <span className='sf-menu-icon sf-icons sf-excl-filter-icon'>{filterLength > 0 ? <FilterIcon className="sf-font-size-xl"/> : <FilterClearIcon className="sf-font-size-xl"/>}</span>
                        {localization.getConstant('ClearFilter')}
                    </li>
                </ul>
            </div>);

    }, [updateColumn?.allowSort, hdrele, filterLength, defaultFilter]);
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
        closeDialogIfEditDirty();
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

    const clearInput: () => void = useCallback((e?: React.MouseEvent) => {
        // Prevent default and stop propagation if event is provided
        e?.preventDefault();
        e?.stopPropagation();
        if (searchValue) {
            prevHeaderCheckedRef.current = false;
            const newSelected: Set<string | number | boolean> = new Set();
            for (const item of filteredData) {
                const key: string | number | boolean = getValue(updateColumn.field, item);
                if (
                    !unselectedRowRef.current.has(key) &&
                    !previousUnselect.current.has(key)
                ) {
                    newSelected.add(key);
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
                unselectedRowRef.current.add(coll.value === '' || coll.value === undefined ? null : (type === 'number' ? parseFloat(coll.value as string) : coll.value as string | number | boolean));
                if (coll.value === '') {
                    unselectedRowRef.current.add(type === 'string' ? null : undefined);
                }
            } else if (coll.operator === 'equal') {
                addCurrentFilterColumns.current.push(coll);
                selectedRowRef.current.add(type === 'number' ? parseFloat(coll.value as string) : coll.value as string | number | boolean);
                if (coll.value === '') {
                    selectedRowRef.current.add(type === 'string' ? null : undefined);
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
            const hostEl: HTMLElement = dialogRef.current?.element as HTMLElement | undefined;
            const dialogElement: HTMLElement = hostEl?.firstElementChild as HTMLElement | undefined;
            if (!dialogElement) {
                return;
            }
            dialogElement.style.display = 'block';
            const dlgWidth: number = dialogElement.offsetWidth as number;
            const pos: { left: number; top: number; } = calculatePosition(options.parentElement, 'left', 'Top');
            hostEl.style.position = 'absolute';
            hostEl.style.top = pos.top + 'px';
            hostEl.style.left = pos.left + 'px';
            hostEl.style.width = dialogElement.offsetWidth + 'px';
            const sbPanel: HTMLElement = document.querySelector('.sb-scrollbar.sb-desktop');
            if (sbPanel) {
                const sbPos: { left: number; top: number; } = calculateRelativeBasedPosition(options.parentElement, closest(options.parentElement, '.tabs-container') as HTMLElement);
                hostEl.style.top = sbPos.top + 'px';
                hostEl.style.left = sbPos.left + 'px';
            }
            const newpos: { top: number, left: number } = calculateRelativeBasedPosition(
                target, options.parentElement.firstElementChild as HTMLElement
            );
            dialogElement.style.display = '';
            dialogElement.style.top =  (newpos.top + target.getBoundingClientRect().height) + 'px';
            // Calculate left position with offsetX for accurate overflow detection after virtual scroll
            const leftPos: number = ((newpos.left - dlgWidth) + (offsetX ?? 0) + target.clientWidth);
            if (leftPos < 1) {
                dialogElement.style.left = (dlgWidth + leftPos) - 16 + 'px'; // right calculation
            } else {
                dialogElement.style.left = leftPos + -4 + 'px';
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
        const keys: (string | number | boolean)[] = [];
        for (let i: number = 0; i < data.length; i++) {
            const key: string | number | boolean = getValue(updateColumn.field, data[parseInt(i.toString(), 10)]);
            keys.push(key);
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
            const key: string | number | boolean = getValue(updateColumn.field, item);
            const normalizedKey: string | number | boolean | null = key === undefined ? null : key;
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
                localization?.getConstant('FilterTrue').toLowerCase().indexOf((parsed as string).toLowerCase()) !== -1) {
                parsed = 'true';
            } else if (parsed !== undefined &&
                localization?.getConstant('FilterFalse').toLowerCase().indexOf((parsed as string).toLowerCase()) !== -1) {
                parsed = 'false';
            }
            if (parsed !== undefined &&
                localization?.getConstant('FilterTrue').toLowerCase().indexOf((parsed as string).toLowerCase()) !== -1) {
                // eslint-disable-next-line no-constant-condition
                parsed = (moduleName.getModuleName && moduleName.getModuleName() === 'ODataAdaptor' || 'ODataV4Adaptor') ? true : 'true';
            } else if (parsed !== undefined &&
                localization?.getConstant('FilterFalse').toLowerCase().indexOf((parsed as string).toLowerCase()) !== -1) {
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
            predicte = new Predicate(field, operator, parsed, true, ignoreAccent);
        }
        if (parsed && typeof val === 'string' &&
            localization?.getConstant('Blanks').toLowerCase().indexOf((val as string).toLowerCase()) >= 0) {
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
            const predicate: Predicate = getPredicateFromCols(cols, true);
            if (predicate) {
                query.where(predicate, null, null, null, null, null, isDistict);
            }
        }
    };

    const getPredicateFromCols: (columns: Object[], isExecuteLocal?: boolean) => Predicate = (
        columns: Object[], isExecuteLocal?: boolean): Predicate => {
        const predicates: Predicate = getPredicate(columns, isExecuteLocal);
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


    const toFormatValue: (data: Object) => string = (data: Object): string => {
        let value: Date | number | string = getValue(updateColumn.field, data);
        if (value === '' || isNullOrUndefined(value)) {
            value = localization?.getConstant('Blanks').toString();
        } else if (!isNullOrUndefined(updateColumn.format) && !isNullOrUndefined(updateColumn.type) && options.formatFn) {
            value = formatter.toView((value as number), options.formatFn)?.toString();
        }
        if (typeof value === 'boolean') {
            value = value === true ? localization?.getConstant('FilterTrue') : localization?.getConstant('FilterFalse');
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
                const checkboxData: object = data[parseInt(i.toString(), 10)];
                const rawKey: string | number | boolean = getValue(updateColumn.field, checkboxData);
                const key: string | number | boolean | null = rawKey === '' || rawKey === undefined ? null : rawKey;
                // Determine checked state based on previous header state
                let checked: boolean;
                if (previousResult.current.includes(key) && previousCount.current) {
                    checked = !(previousUnselect.current.has(key) || unselectedRowRef.current.has(key));
                } else if (prevHeaderCheckedRef.current && !previousCount.current) {
                    // Header was checked - all checked by default, except those in unselectedRowRef
                    checked = !unselectedRowRef.current.has(key);
                } else {
                    // Header was unchecked - all unchecked by default, except those in selectedRowRef
                    checked = selectedRowRef.current.has(key);
                }


                const formattedValue: string = toFormatValue(checkboxData);
                filterCheckBox.push(
                    <div
                        key={`${String(key)}_${i}`}
                        className="sf-filter-checkbox"
                        aria-posinset={i}
                        style={{ height: `${checkBoxHeight}px`, width: '100%' }}>
                        <Checkbox
                            checked={checked}
                            label={formattedValue}
                            className="sf-checkbox-wrapper sf-css sf-checkbox-filtertext"
                            onChange={(e: CheckboxChangeEvent) => {
                                const next: boolean = e?.value;
                                handleItemToggle(key, next);
                            }}
                        />
                    </div>
                );
            }
        }

        return filterCheckBox;

    }, [searchValue, filteredData, cacheData, totalCount, startIdx, updateColumn.field, selectionVersion]);

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
                                label={localization?.getConstant('SelectAll')}
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
                                label={localization?.getConstant('AddCurrentSelection')}
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
                                    <div className="sf-excel-empty-checkbox">{localization?.getConstant('NoMatches')}</div>
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
                        aria-label={localization?.getConstant('Primary')}
                        onClick={() => setDefaultFilter(true)}
                        className={cssClass}
                    >
                        {localization?.getConstant('Primary')}
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
        setOperatorValue: React.Dispatch<React.SetStateAction<string>>
    }> = useCallback(({ operator, setOperator, setOperatorValue }:
    { operator: string, setOperator: React.Dispatch<React.SetStateAction<string>>,
        setOperatorValue: React.Dispatch<React.SetStateAction<string>> }
    ): JSX.Element => {
        return (
            <DropDownList
                value={operator}
                variant={Variant.Outlined}
                fields={{ text: 'text', value: 'value' }}
                dataSource={operators}
                popupSettings={{ zIndex: parseInt(window.getComputedStyle(dialogRef.current.element).zIndex, 10) }}
                onChange={(args: DDLChangeEvent) => {
                    setOperator(args.value as string);
                    if (args.value === 'isNull' || args.value === 'isNotNull' || args.value === 'isEmpty' || args.value === 'isNotEmpty') {
                        setOperatorValue(null);
                    }
                }}
                className={cssClass + ' sf-excel-filter-dropdown'}
            />
        );
    }, [operators, cssClass]);

    const advancedContainer: React.JSX.Element = useMemo(() => {
        const Condition: (props: {andCondition: React.RefObject<boolean>}) => JSX.Element = (
            props: { andCondition: React.RefObject<boolean> }): JSX.Element => {
            const conditionChange: (args: RadioButtonChangeEvent) => void = (args: RadioButtonChangeEvent): void => {
                props.andCondition.current = args.value === 'and';
            };

            return <>
                <RadioButton
                    name='condition'
                    value='and'
                    {...(props.andCondition.current ? { defaultChecked: true } : {})}
                    label={localization?.getConstant('and')}
                    onChange={conditionChange}
                    className={cssClass} />
                <span className='sf-excel-left-separator' />
                <RadioButton
                    name='condition'
                    value='or'
                    {...(!props.andCondition.current ? { defaultChecked: true } : {})}
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
                        } else {
                            setFirstOperatorValue(args.value);
                        }
                    }}
                    onKeyDown={(event: React.KeyboardEvent<HTMLInputElement>) => event.code === 'Enter' ? filterbtnHandler() : undefined}
                    format={(typeof (format) === 'object' && format ? getNumberPattern(format, false)?.toLowerCase() :
                        (format as string)?.toLowerCase()) ?? 'n2'} // only provided string format support.
                    disabled={second ? secondInputDisabled : firstInputDisabled}
                    {...updateColumn.filter.params as NumericTextBoxProps}
                />);

            case 'date':
            case 'datetime':
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
                        } else {
                            setFirstOperatorValue(args.value);
                        }
                    }}
                    disabled={second ? secondInputDisabled : firstInputDisabled}
                    {...updateColumn.filter.params as DatePickerProps}
                />);

            default :
                return (<TextBox
                    value={(second ? secondOperatorValue : firstOperatorValue) as string}
                    onChange={(args: TextBoxChangeEvent) => {
                        if (second) {
                            setSecondOperatorValue(args.value);
                        } else {
                            setFirstOperatorValue(args.value);
                        }
                    }}
                    variant={Variant.Outlined}
                    onKeyDown={(event: React.KeyboardEvent<HTMLInputElement>) => event.code === 'Enter' ? filterbtnHandler() : undefined}
                    placeholder={localization?.getConstant('enterValue')}
                    className={cssClass}
                    disabled={second ? secondInputDisabled : firstInputDisabled}
                    {...updateColumn.filter.params as TextBoxProps}
                />);
            }
        };

        return (
            <div className='sf-grid-excel-filter-container'>
                <div>
                    <Operator operator={firstOperator} setOperator={setFirstOperator} setOperatorValue={setFirstOperatorValue} />
                </div>
                <div className='sf-excel-top-separator'>
                    {firstFilterInputElement()}
                </div>
                <div className='sf-excel-top-separator'>
                    <Condition andCondition={andCondition} />
                </div>
                <div className='sf-excel-top-separator'>
                    <Operator operator={secondOperator} setOperator={setSecondOperator} setOperatorValue={setSecondOperatorValue} />
                </div>
                <div className='sf-excel-top-separator'>
                    {firstFilterInputElement(true)}
                </div>
            </div>
        );
    }, [firstOperator, secondOperator, firstOperatorValue, secondOperatorValue]);


    return (
        <>{internalOpen && <Dialog
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
            footer={
                isImmediateMode && !isExcel ? (
                    <Button
                        variant={Variant.Standard}
                        className={cssClass}
                        onClick={clearFilter}
                        onKeyDown={(event: React.KeyboardEvent<HTMLButtonElement>) => event.code === 'Enter' ? clearFilter : undefined}
                        disabled={!searchValue?.length && filterLength < 1}
                    >
                        {localization?.getConstant('Clear')}
                    </Button>
                ) : (isExcel && !defaultFilter || !isImmediateMode) ? (
                    <>
                        <Button
                            variant={Variant.Standard}
                            color={Color.Primary}
                            className={cssClass}
                            onClick={filterbtnHandler}
                            onKeyDown={(event: React.KeyboardEvent<HTMLButtonElement>) => event.code === 'Enter' ? filterbtnHandler : undefined}
                            disabled={defaultFilter ? (!selectAllChecked && !selectAllIndeterminate) : disableAdvancedOkBtn}
                        >
                            {localization?.getConstant('OKButton')}
                        </Button>
                        <Button
                            variant={Variant.Standard}
                            className={cssClass}
                            onClick={isExcel ? handleCancel : clearFilter}
                            onKeyDown={(event: React.KeyboardEvent<HTMLButtonElement>) => event.code === 'Enter' ? handleCancel : undefined}
                            disabled={isExcel ? false : filterLength < 1}
                        >
                            {isExcel ? localization?.getConstant('CancelButton') : localization?.getConstant('Clear')}
                        </Button>

                    </>
                ) : undefined
            }
        >
            {isExcel && renderExcelMenu}
            {isExcel && filterType}
            {defaultFilter && searchContainer}
            {!defaultFilter && advancedContainer}
        </Dialog>}
        </>
    );
};

ExcelFilter.displayName = 'ExcelFilter';
