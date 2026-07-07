import {
    useRef,
    useMemo,
    memo,
    JSX,
    RefObject,
    MemoExoticComponent,
    useEffect,
    useState,
    isValidElement,
    createElement,
    useCallback
} from 'react';
import {
    ColumnType,
    FilterBarType,
    FilterTemplateProps,
    IValueFormatter,
    ValueType
} from '../types';
import { MutableGridSetter } from '../types/interfaces';
import { GridRef } from '../types/grid.interfaces';
import { FilterPredicates } from '../types/filter.interfaces';
import { ColumnProps, IColumnBase, ColumnRef } from '../types/column.interfaces';
import { ChangeEvent as DDLChangeEvent, DropDownList, FieldSettingsModel, PopupSettings } from '@syncfusion/react-dropdowns';
import { useColumn } from '../hooks';
import { NumericChangeEvent, NumericTextBox, NumericTextBoxProps, TextBox, TextBoxChangeEvent, TextBoxProps } from '@syncfusion/react-inputs';
import { getNumberPattern, IL10n, isNullOrUndefined, LabelMode, Variant } from '@syncfusion/react-base';
import {
    useGridComputedProvider,
    useGridMutableProvider
} from '../contexts';
import { FilterIcon } from '@syncfusion/react-icons';
import { DatePicker, DatePickerChangeEvent, DatePickerProps } from '@syncfusion/react-calendars';
import { getCustomDateFormat } from '../utils';
import {
    FILTER_CSS_CLASSES,
    NULL_OPERATORS,
    FILTER_INPUT_ID_SUFFIX,
    DEFAULT_DATE_FORMAT,
    LABEL_MODES,
    DROPDOWN_FIELD_SETTINGS,
    DROPDOWN_POPUP_SETTINGS
} from './FilterBarConstants';

/**
 * FilterBase component renders a table cell (th or td) with appropriate content
 *
 * @component
 * @private
 * @param {IColumnBase} props - Component properties
 * @param {RefObject<ColumnRef>} ref - Forwarded ref to expose internal elements
 * @returns {JSX.Element} The rendered table cell (th or td)
 */
const FilterBase: MemoExoticComponent<(props: Partial<IColumnBase>) => JSX.Element> = memo((props: Partial<IColumnBase>) => {

    // Get column-specific APIs and properties
    const { gridAPI, gridInternal } = useColumn(props);
    const { cssClass, filterModule, virtualSettings } = useGridMutableProvider();
    const CSS_FILTER_INPUT_TEXT: string = FILTER_CSS_CLASSES.FILTER_INPUT_TEXT + (cssClass !== '' ? (' ' + cssClass) : '');

    const {
        cellType,
        visibleClass,
        formattedValue
    } = gridInternal;

    const { ...column } = gridAPI;

    const {
        index,
        field,
        customAttributes
    } = column;

    const { className, role, title } = customAttributes;
    const grid: Partial<GridRef> & Partial<MutableGridSetter> = useGridComputedProvider();
    const { serviceLocator, scrollModule } = grid;
    const formatter: IValueFormatter = serviceLocator?.getService<IValueFormatter>('valueFormatter');
    const filterBarClass: string = column.filterTemplate ? FILTER_CSS_CLASSES.FILTER_TEMPLATE_CELL : '';
    const fltrData: FilterTemplateProps = { column: column };
    fltrData[column.field] = undefined;
    const filterBarType: string | FilterBarType = column.filter.filterBarType;
    const localization: IL10n = serviceLocator?.getService<IL10n>('localization');

    // Create ref for the cell element
    const cellRef: RefObject<ColumnRef> = useRef<ColumnRef>({
        cellRef: useRef<HTMLTableCellElement>(null)
    });
    const [inputValue, setInputValue] = useState<ValueType | ValueType[]>(null);

    const filterColumn: FilterPredicates = useMemo(() => {
        return grid.filterSettings?.columns?.find((col: FilterPredicates) => col.field === column.field);
    }, [grid.filterSettings?.columns]);
    const updateColumn: ColumnProps = useMemo(() => {
        const columns: ColumnProps[] = grid.getColumns();
        const startVirtualIndex: number = scrollModule?.virtualColumnInfo.startIndex;
        const endVirtualIndex: number = scrollModule?.virtualColumnInfo.endIndex;
        const visibleColumns: ColumnProps[] = grid.getVisibleColumns?.();
        const finalColumns: ColumnProps[] = virtualSettings.enableColumn ?
            (visibleColumns?.length ? visibleColumns : columns)?.slice(startVirtualIndex, endVirtualIndex) : columns;
        return finalColumns?.find((col: ColumnProps) => col.field === column.field);
    }, [column, grid?.getVisibleColumns, scrollModule?.virtualColumnInfo.startIndex, scrollModule?.virtualColumnInfo.endIndex]);
    const filterVal: ValueType | ValueType[] = useMemo(() => filterColumn?.value, [filterColumn]);
    const isFilterbarOperator : boolean = grid.filterSettings.enableFilterBarOperator;
    let operatorVal: string = column.filter?.operator || (updateColumn?.type === 'string' ? 'startsWith' : 'equal');
    let placeholderVal: string = localization?.getConstant(operatorVal);
    const operators: { value: string; text: string }[] = useMemo(() => {
        let operators: { value: string; text: string }[] = filterModule.customOperators[updateColumn?.type + 'Operator'];
        if (isFilterbarOperator && updateColumn?.filter.filterOperators?.length) {
            const filterOperators: string[] = updateColumn?.filter.filterOperators;
            operators = [];
            for (let i: number = 0; i < filterOperators.length; i++) {
                operators.push(
                    {
                        value: filterOperators[parseInt(i.toString(), 10)],
                        text: localization?.getConstant(filterOperators[parseInt(i.toString(), 10)])
                    });
            }
            if (!operators.filter((operator: { value: string; text: string }) => operator.value === operatorVal).length) {
                operatorVal = operators[0].value;
                placeholderVal = operators[0].text;
            }
        }
        return operators;
    }, [updateColumn?.type, updateColumn?.filter?.filterOperators]);
    const [operator, setOperator] = useState<string>(operatorVal);
    const [placeholder, setPlaceholder] = useState<string>(placeholderVal);
    if (isFilterbarOperator && updateColumn?.type) {
        column.filter.operator = operatorVal;
    }

    useEffect(() => {
        setOperator(operatorVal);
        setPlaceholder(placeholderVal);
    }, [operatorVal, placeholderVal]);

    useEffect(() => {
        let value: ValueType | ValueType[] = !isNullOrUndefined(filterVal) ?
            filterVal : '';
        if (!isNullOrUndefined(column.format) && !isNullOrUndefined(filterVal) && typeof filterVal !== 'string'
            && (updateColumn as IColumnBase)?.formatFn && filterBarType !== FilterBarType.DatePicker &&
            filterBarType !== FilterBarType.NumericTextBox) {
            value = formatter.toView(filterVal as  number | Date, (updateColumn as IColumnBase)?.formatFn).toString();
        }
        if (filterBarType === FilterBarType.DatePicker || filterBarType === FilterBarType.NumericTextBox) {
            setInputValue(filterVal ? filterVal : null);
        } else if (!(updateColumn?.type === 'number' && isNaN(value as number))) {
            setInputValue(value.toString());
        }
    }, [filterVal]);

    const handleChange: (e: TextBoxChangeEvent | NumericChangeEvent | DatePickerChangeEvent) => void = (
        e: TextBoxChangeEvent | NumericChangeEvent | DatePickerChangeEvent) => {
        setInputValue((e as NumericChangeEvent | DatePickerChangeEvent | TextBoxChangeEvent).value);
        if (filterBarType === FilterBarType.DatePicker && grid.filterSettings?.mode === 'Immediate' && e.value instanceof Date) {
            filterModule?.filterByColumn(column.field, 'equal', e.value);
        } else if (filterBarType === FilterBarType.DatePicker && grid.filterSettings?.mode === 'Immediate' && e.value === null &&
            document.activeElement.tagName === 'INPUT' && (document.activeElement as HTMLInputElement).value.length > 1) {
            filterModule?.removeFilteredColsByField?.(column.field, true);
        }
    };

    const dropDownOnChange: (e: DDLChangeEvent) => void = useCallback((e: DDLChangeEvent) => {
        setOperator(e.value as string);
        setPlaceholder(operators.filter((op: { value: string; text: string }) => {
            return (op as object as { value: string }).value === (e.value as string);
        })[0]['text'] as string);
        column.filter.operator = e.value as string;
        const value: string = e.value as string;
        const valInput: HTMLInputElement = document.getElementById(column.field + FILTER_INPUT_ID_SUFFIX) as HTMLInputElement;
        if (NULL_OPERATORS.includes(value)) {
            valInput.setAttribute('readOnly', 'true');
            filterModule?.filterByColumn(column.field, value, null, filterModule.getFilterProperties?.predicate,
                                         filterModule?.getFilterProperties?.caseSensitive,
                                         filterModule?.getFilterProperties?.ignoreAccent);
        }
        else if (valInput && valInput.readOnly) {
            valInput.removeAttribute('readOnly');
            filterModule?.removeFilteredColsByField?.(column.field);
        }
    }, [operators, grid.filterSettings?.enableFilterBarOperator]);


    /**
     * Render editor component with fallback to HTML input
     * This structure allows easy replacement when Syncfusion components become available
     * Added disabled state support for non-editable columns
     * Primary key fields should be enabled during add operations
     *
     * @returns {JSX.Element} The rendered editor component as JSX element
     */
    const renderFilter: () => JSX.Element = (): JSX.Element => {
        if (props.cell?.column?.type === ColumnType.Checkbox || props.cell?.column?.type === ColumnType.SingleGroup) { return<></>; }
        const id: string = column.field + FILTER_INPUT_ID_SUFFIX;
        const isDisabled: boolean = !column.allowFilter;
        const computedPlaceholder: string = isFilterbarOperator ? placeholder : '';
        const labelModeValue: LabelMode = isFilterbarOperator ? LABEL_MODES.ALWAYS : LABEL_MODES.NEVER;
        const variantValue: Variant = isFilterbarOperator ? Variant.Outlined : Variant.Standard;

        switch (filterBarType) {
        case FilterBarType.NumericTextBox:
            return (
                <NumericTextBox
                    id={id}
                    title={title}
                    className={CSS_FILTER_INPUT_TEXT}
                    value={inputValue ? inputValue as number : null}
                    format={(typeof (column.format) === 'object' ? getNumberPattern(column.format, false)?.toLowerCase() :
                        (column.format as string)?.toLowerCase()) ?? 'n'} // only provided string format support.
                    onChange={handleChange}
                    placeholder={computedPlaceholder}
                    labelMode={labelModeValue}
                    variant={variantValue}
                    disabled={isDisabled}
                    tabIndex={isDisabled ? -1 : 0}
                    spinButton={false}
                    {...column.filter.params as NumericTextBoxProps}
                />
            );

        case FilterBarType.DatePicker:
            return (
                <DatePicker
                    id={id}
                    title={title}
                    className={CSS_FILTER_INPUT_TEXT}
                    value={inputValue ? new Date(inputValue as Date) : null}
                    format={updateColumn?.format ? getCustomDateFormat(updateColumn?.format, updateColumn?.type) : DEFAULT_DATE_FORMAT} // only provided string format support
                    onChange={(e: DatePickerChangeEvent) => handleChange(e)}
                    placeholder={computedPlaceholder}
                    labelMode={labelModeValue}
                    variant={variantValue}
                    disabled={isDisabled}
                    strictMode={false}
                    {...column.filter.params as DatePickerProps}
                />
            );


        default:
            return (
                <TextBox
                    id={id}
                    title={title}
                    className={CSS_FILTER_INPUT_TEXT}
                    value={inputValue?.toString() || ''}
                    onChange={handleChange}
                    clearButton={true}
                    placeholder={computedPlaceholder}
                    labelMode={labelModeValue}
                    variant={variantValue}
                    disabled={isDisabled}
                    tabIndex={isDisabled ? -1 : 0}
                    {...column.filter.params as TextBoxProps}
                />
            );
        }
    };
    const [isFocused, setIsFocused] = useState<boolean>(false);

    const handleFocus: () => void = useCallback(() => {
        setIsFocused(true);
    }, []);

    const handleBlur: () => void = useCallback(() => {
        setIsFocused(false);
    }, []);
    const fields: FieldSettingsModel = useMemo(() => DROPDOWN_FIELD_SETTINGS, []);
    const popupSettings: PopupSettings = useMemo(() => DROPDOWN_POPUP_SETTINGS, []);
    const filterIcon: JSX.Element = useMemo(() => (<FilterIcon />), []);

    /**
     * Memoized filter cell content
     */
    const filterCellContent: JSX.Element | null = useMemo(() => {
        const combinedClassName: string = [
            ...new Set((`${props.cell.className} ${className} ${filterBarClass} ${visibleClass || ''}`.trim()).split(' '))
        ].join(' ');
        return (
            <th
                ref={cellRef.current.cellRef}
                role={role}
                className={combinedClassName}
                data-mappinguid={column.uid}
            >
                {column.filterTemplate ? (typeof column.filterTemplate === 'string' || isValidElement(column.filterTemplate) ?
                    column.filterTemplate : createElement(column.filterTemplate, fltrData))
                    : <div className={FILTER_CSS_CLASSES.FILTER_DIV_INPUT + (isFilterbarOperator ? ` ${FILTER_CSS_CLASSES.GRID_FILTERBAR}` : '') +
                        (column?.type === ColumnType.Checkbox || column?.type === ColumnType.SingleGroup ? ` ${FILTER_CSS_CLASSES.DISABLED}` : '')}>
                        {renderFilter()}
                        {isFilterbarOperator && <DropDownList
                            value={operator}
                            title={'operator'}
                            fields={fields}
                            dataSource={operators}
                            onFocus={!updateColumn?.allowFilter ? undefined : handleFocus}
                            onBlur={!updateColumn?.allowFilter ? undefined : handleBlur}
                            onOpen={!updateColumn?.allowFilter ? undefined : handleBlur}
                            className={`${FILTER_CSS_CLASSES.FILTERBAR_DROPDOWN}${isFocused ? ` ${FILTER_CSS_CLASSES.FOCUSED}` : ''}`}
                            onChange={dropDownOnChange}
                            disabled={!updateColumn?.allowFilter}
                            labelMode={LABEL_MODES.NEVER}
                            ignoreCase={true}
                            dropdownIcon={filterIcon}
                            popupSettings={popupSettings}
                            tabIndex={!updateColumn?.allowFilter ? -1 : 0}
                        />}
                    </div>}
            </th>
        );
    }, [cellType, index, className, isFocused, visibleClass, formattedValue, field, updateColumn?.filterTemplate,
        inputValue, cssClass, operator, placeholder, isFilterbarOperator, operators, updateColumn?.allowFilter]);

    // Return the appropriate cell content based on cell type
    return filterCellContent;
});

/**
 * Set display name for debugging purposes
 */
FilterBase.displayName = 'FilterBase';

/**
 * Export the FilterBase component for internal use
 *
 * @private
 */
export { FilterBase };
