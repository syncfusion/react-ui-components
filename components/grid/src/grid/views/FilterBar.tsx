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
import { ChangeEvent as DDLChangeEvent, DropDownList } from '@syncfusion/react-dropdowns';
import { useColumn } from '../hooks';
import { NumericChangeEvent, NumericTextBox, NumericTextBoxProps, TextBox, TextBoxChangeEvent, TextBoxProps } from '@syncfusion/react-inputs';
import { getNumberPattern, IL10n, isNullOrUndefined, Variant } from '@syncfusion/react-base';
import {
    useGridComputedProvider,
    useGridMutableProvider
} from '../contexts';
import { FilterIcon } from '@syncfusion/react-icons';
import { DatePicker, DatePickerChangeEvent, DatePickerProps } from '@syncfusion/react-calendars';
import { getCustomDateFormat } from '../utils';

const CSS_FILTER_DIV_INPUT: string = 'sf-filter-cell';

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
    const { publicAPI, privateAPI } = useColumn(props);
    const { cssClass, filterModule } = useGridMutableProvider();
    const CSS_FILTER_INPUT_TEXT: string = 'sf-filter-text' + (cssClass !== '' ? (' ' + cssClass) : '');

    const {
        cellType,
        visibleClass,
        formattedValue
    } = privateAPI;

    const { ...column } = publicAPI;

    const {
        index,
        field,
        customAttributes
    } = column;

    const { className, role, title } = customAttributes;
    const grid: Partial<GridRef> & Partial<MutableGridSetter> = useGridComputedProvider();
    const { serviceLocator } = grid;
    const formatter: IValueFormatter = serviceLocator?.getService<IValueFormatter>('valueFormatter');
    const filterBarClass: string = column.filterTemplate ? 'sf-filter-template-cell' : '';
    const fltrData: FilterTemplateProps = { column: column };
    fltrData[column.field] = undefined;
    const filterBarType: string | FilterBarType = column.filter.filterBarType;
    const localization: IL10n = serviceLocator?.getService<IL10n>('localization');

    // Create ref for the cell element
    const cellRef: RefObject<ColumnRef> = useRef<ColumnRef>({
        cellRef: useRef<HTMLTableCellElement>(null)
    });
    const [inputValue, setInputValue] = useState<ValueType | ValueType[]>(null);

    const filterColumn: FilterPredicates = grid.filterSettings?.columns?.find((col: FilterPredicates) => col.field === column.field);
    const updateColumn: ColumnProps = grid.getColumns().find((col: ColumnProps) => col.field === column.field);
    const filterVal: ValueType | ValueType[] = filterColumn?.value;
    const isFilterbarOperator : boolean = grid.filterSettings.enableFilterBarOperator;
    let operatorVal: string = column.filter?.operator || (updateColumn.type === 'string' ? 'startsWith' : 'equal');
    let placeholderVal: string = localization?.getConstant(operatorVal);
    let operators: { value: string; text: string }[] = filterModule.customOperators[updateColumn.type + 'Operator'];
    if (isFilterbarOperator && updateColumn.filter.filterOperators?.length) {
        const filterOperators: string[] = updateColumn.filter.filterOperators;
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
    const [operator, setOperator] = useState<string>(operatorVal);
    const [placeholder, setPlaceholder] = useState<string>(placeholderVal);
    if (isFilterbarOperator && updateColumn.type) {
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
            && (updateColumn as IColumnBase).formatFn && filterBarType !== FilterBarType.DatePicker &&
            filterBarType !== FilterBarType.NumericTextBox) {
            value = formatter.toView(filterVal as  number | Date, (updateColumn as IColumnBase).formatFn).toString();
        }
        if (filterBarType === FilterBarType.DatePicker || filterBarType === FilterBarType.NumericTextBox) {
            setInputValue(filterVal ? filterVal : null);
        } else if (!(updateColumn?.type === 'number' && isNaN(value as number))) {
            setInputValue(value.toString());
        }
    }, [filterVal]);

    const handleChange: (e: TextBoxChangeEvent | NumericChangeEvent | DatePickerChangeEvent) => void = (
        e: TextBoxChangeEvent |NumericChangeEvent | DatePickerChangeEvent) => {
        setInputValue((e as NumericChangeEvent | DatePickerChangeEvent | TextBoxChangeEvent).value);
        if (filterBarType === FilterBarType.DatePicker && grid.filterSettings?.mode === 'Immediate' && e.value instanceof Date) {
            filterModule?.filterByColumn(column.field, 'equal', e.value);
        } else if (filterBarType === FilterBarType.DatePicker && grid.filterSettings?.mode === 'Immediate' && e.value === null &&
            document.activeElement.tagName === 'INPUT' && (document.activeElement as HTMLInputElement).value.length > 1) {
            filterModule?.removeFilteredColsByField?.(column.field, true);
        }
    };

    const dropDownOnChange: (e: DDLChangeEvent) => void = (e: DDLChangeEvent) => {
        setOperator(e.value as string);
        setPlaceholder(operators.filter((op: { value: string; text: string }) => {
            return (op as object as { value: string }).value === (e.value as string);
        })[0]['text'] as string);
        column.filter.operator = e.value as string;
        const value: string = e.value as string;
        if (filterModule && grid.filterSettings?.enableFilterBarOperator) {
            const valInput: HTMLInputElement = document.getElementById(column.field + '_filterBarcell') as HTMLInputElement;
            if (value === 'isNotNull' || value === 'isNull' ||
                value === 'isNotEmpty' || value === 'isEmpty') {
                valInput.setAttribute('readOnly', 'true');
                filterModule?.filterByColumn(column.field, value, null, filterModule.getFilterProperties?.predicate,
                                             filterModule.getFilterProperties?.caseSensitive,
                                             filterModule.getFilterProperties?.ignoreAccent);
            }
            else if (valInput && valInput.readOnly) {
                valInput.removeAttribute('readOnly');
                filterModule?.removeFilteredColsByField?.(column.field);
            }
        }
    };


    /**
     * Render editor component with fallback to HTML input
     * This structure allows easy replacement when Syncfusion components become available
     * Added disabled state support for non-editable columns
     * Primary key fields should be enabled during add operations
     *
     * @returns {JSX.Element} The rendered editor component as JSX element
     */
    const renderFilter: () => JSX.Element = (): JSX.Element => {
        if (props.cell?.column?.type === ColumnType.Checkbox) { return<></>; }
        const id: string = column.field + '_filterBarcell';
        const isDisabled: boolean = !column.allowFilter;

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
                    placeholder={isFilterbarOperator ? placeholder : ''}
                    labelMode={isFilterbarOperator ? 'Always' : 'Never'}
                    variant={isFilterbarOperator ? Variant.Outlined : Variant.Standard}
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
                    format={updateColumn.format ? getCustomDateFormat(updateColumn.format, updateColumn.type) : 'M/d/yyyy'} // only provided string format support
                    onChange={handleChange as any}
                    placeholder={isFilterbarOperator ? placeholder : ''}
                    labelMode={isFilterbarOperator ? 'Always' : 'Never'}
                    variant={isFilterbarOperator ? Variant.Outlined : Variant.Standard}
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
                    placeholder={isFilterbarOperator ? placeholder : ''}
                    labelMode={isFilterbarOperator ? 'Always' : 'Never'}
                    variant={isFilterbarOperator ? Variant.Outlined : Variant.Standard}
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
                    : <div className={CSS_FILTER_DIV_INPUT + (isFilterbarOperator ? ' sf-grid-filterbar' : '')}>
                        {renderFilter()}
                        {isFilterbarOperator && <DropDownList
                            value={operator}
                            title={'operator'}
                            fields= {{ text: 'text', value: 'value' }}
                            dataSource={operators}
                            id={updateColumn.uid}
                            onFocus={handleFocus}
                            onBlur={handleBlur}
                            onOpen={!updateColumn.allowFilter ? undefined : handleBlur}
                            className={`sf-filterbar-dropdown${isFocused ? ' sf-focused' : ''}`}
                            onChange={dropDownOnChange}
                            disabled={!updateColumn.allowFilter}
                            labelMode={'Never'}
                            ignoreCase={true}
                            dropdownIcon={<FilterIcon />}
                            popupSettings={{ width: 'auto' }}
                            tabIndex={!updateColumn.allowFilter ? -1 : 0}
                        />}
                    </div>}
            </th>
        );
    }, [cellType, index, className, isFocused, visibleClass, formattedValue, field,
        inputValue, cssClass, operator, placeholder, isFilterbarOperator, operators]);

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
