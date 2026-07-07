import { ComponentType, createElement, isValidElement, ReactElement, useMemo } from 'react';
import { DateFormatOptions, IL10n, formatUnit, isNullOrUndefined, NumberFormatOptions } from '@syncfusion/react-base';
import { Skeleton, SkeletonProps } from '@syncfusion/react-notifications';
import { IValueFormatter, CellTypes, IRow, EditType, ValueType, FilterBarType, TextAlign, ColumnType, LoadingIndicatorType, ServiceLocator, VirtualDomType, IGridBase, AggregateType, GroupedData, GroupType } from '../types';
import { ColumnProps, IColumnBase } from '../types/column.interfaces';
import { AggregateColumnProps, AggregateData } from '../types/aggregate.interfaces';
import { useGridComputedProvider, useGridMutableProvider } from '../contexts';
import { setStringFormatter, getObject, getUid, headerValueAccessor as defaultHeaderValueAccessor,
    valueAccessor as defaultValueAccessor, isDateOrNumber, parseUnit,
    updateUIColumnType} from '../utils';
/**
 * CSS class names used in the Column component
 */
const CSS_CLASS_NAMES: Record<string, string> = {
    LEFT_ALIGN: 'sf-left-align',
    RIGHT_ALIGN: 'sf-right-align',
    CENTER_ALIGN: 'sf-center-align',
    HIDDEN: 'sf-display-none'
};
/**
 * Applies default column properties to the provided column configuration
 *
 * @param {IColumnBase} props - The column properties to enhance with defaults
 * @param {ServiceLocator} serviceLocator - ServiceLocator for column formatting and parsing property updates.
 * @param {IGridBase} gridProps - The grid configured properties.
 * @param {ColumnProps[]} typeDetectedUIColumn - After getting data type updated ui column.
 * @param {boolean} isColumnChooserChanged - To check whether column chooser state is changed.
 * @returns {IColumnBase} The column properties with defaults applied
 * @private
 */
export const defaultColumnProps: <T>(props: Partial<IColumnBase<T>>, serviceLocator: ServiceLocator, gridProps: IGridBase<T>,
    typeDetectedUIColumn?: ColumnProps<T>, isColumnChooserChanged?: boolean) => Partial<IColumnBase<T>> = <T>(
    props: Partial<IColumnBase<T>>, serviceLocator: ServiceLocator, gridProps: IGridBase<T>, typeDetectedUIColumn?: ColumnProps<T>,
    isColumnChooserChanged?: boolean):
Partial<IColumnBase<T>> => {
    const commandColumn: boolean = !isNullOrUndefined(props.getCommandItems);
    const isCheckboxColumn: boolean = props.type === ColumnType.Checkbox ||
        (!!props.displayAsCheckBox && (props.edit?.type === EditType.CheckBox || props.type === ColumnType.Boolean));
    const typeFormatParseUpdatedColumn: Partial<IColumnBase<T>> =
        updateUIColumnType({}, {...props}, serviceLocator) as Partial<IColumnBase<T>>;
    const isColumnDOMVirtualizationDisabled: boolean = !isNullOrUndefined(gridProps?.virtualizationSettings) &&
        (gridProps?.virtualizationSettings?.enabled === false || gridProps?.virtualizationSettings?.type === VirtualDomType.Row ||
            props.autoHeight);
    const isRequiredColumn: boolean = props?.isPrimaryKey || props?.isIdentity || (props.field && gridProps.groupSettings?.enabled &&
        gridProps.groupSettings?.columns?.length && gridProps.groupSettings?.columns?.indexOf(props.field) > -1);
    // computed values should handle in component inside alone since react not allowed us to compute here using memo.
    return {
        autoHeight: false,
        textAlign: commandColumn || isCheckboxColumn ? TextAlign.Center : 'Left',
        disableHtmlEncode: true,
        allowEdit: commandColumn || props.type === ColumnType.SingleGroup ? false : true,
        edit: {type: EditType.TextBox},
        filter: { type: props.filter?.type ?? gridProps?.filterSettings?.type ?? 'FilterBar', hideSearchbox: props.filter?.hideSearchbox ?? false,
            filterBarType: FilterBarType.TextBox, filterOperators: [] },
        formatFn: typeFormatParseUpdatedColumn?.formatFn ?? typeDetectedUIColumn?.formatFn,
        parseFn: typeFormatParseUpdatedColumn?.parseFn ?? typeDetectedUIColumn?.parseFn,
        getFormatter: typeFormatParseUpdatedColumn?.formatFn ?? typeDetectedUIColumn?.formatFn,
        getParser: typeFormatParseUpdatedColumn?.parseFn ?? typeDetectedUIColumn?.parseFn,
        headerText: props.headerText ?? (props.type === ColumnType.SingleGroup ?
            serviceLocator?.getService<IL10n>('localization')?.getConstant('singleColumnGroupLabel') : undefined),
        ...props,
        validationRules: isRequiredColumn ? { required: true, ...props.validationRules } : props.validationRules,
        visible: isColumnChooserChanged ? typeDetectedUIColumn?.visible : (props?.field && (commandColumn ? false : props.allowGroup ??
            true) && gridProps?.groupSettings?.type === GroupType.MultipleColumns &&
            gridProps?.groupSettings?.columns?.indexOf(props?.field) >= 0 ? true : (typeFormatParseUpdatedColumn?.visible) ?? true),
        width: !isColumnDOMVirtualizationDisabled ? (!isNullOrUndefined(props.width) ? (parseUnit(props.width) + 'px') : (props?.type ===
            ColumnType.SingleGroup ? (!gridProps?.groupSettings?.captionFormat || gridProps?.groupSettings?.captionFormat === 'compact' ? '188px' : '335px') : '100px')) :
            props.width ? formatUnit(props.width) : '', // dom column virtualization only support pixels.
        valueAccessor: props.valueAccessor ?? defaultValueAccessor<T>,
        headerValueAccessor: props.headerValueAccessor ?? defaultHeaderValueAccessor,
        type: props.type === 'none' ? null : (props.type ? (typeof (props.type) === 'string' ? props.type.toLowerCase() : undefined) :
            (props.type ?? (commandColumn ? ColumnType.Command : typeDetectedUIColumn?.type))),
        sortComparer: typeDetectedUIColumn?.sortComparer ?? typeFormatParseUpdatedColumn?.sortComparer,
        uid: isNullOrUndefined(props.uid) ? getUid('grid-column') : props.uid,
        allowSort: commandColumn || props.type === ColumnType.SingleGroup ? false : props.allowSort ?? true,
        allowFilter: commandColumn || props.type === ColumnType.SingleGroup ? false : props.allowFilter ?? true,
        allowSearch: commandColumn ? false : props.allowSearch ?? true,
        allowGroup: commandColumn || props.type === ColumnType.Checkbox || props.type === ColumnType.SingleGroup
            ? false : props.allowGroup ?? props.field ? true : false,
        templateSettings: {
            ariaLabel: '',
            ...props.templateSettings
        },
        headerCheckbox: props.headerCheckbox ?? true
    };
};
/**
 * `useColumn` is a custom hook that provides column configuration and formatting logic for grid columns.
 * It handles value formatting, alignment classes, visibility, and template rendering.
 *
 * @private
 * @param {IColumnBase} props - The column configuration properties
 * @returns {Object} Object containing gridAPI (ColumnProps) and gridInternal with cell formatting properties
 */
export const useColumn: <T>(props: Partial<IColumnBase<T>>) => {
    gridAPI: Partial<ColumnProps<T>>;
    gridInternal: {
        cellType: CellTypes;
        row: IRow<ColumnProps<T>>;
        alignClass: string;
        alignHeaderClass: string;
        visibleClass: string;
        formattedValue: string | Object | ReactElement;
        isMaskCell: boolean;
    };
} = <T>(props: Partial<IColumnBase<T>>): {
    gridAPI: Partial<ColumnProps<T>>;
    gridInternal: {
        cellType: CellTypes;
        row: IRow<ColumnProps<T>>;
        alignClass: string;
        alignHeaderClass: string;
        visibleClass: string;
        formattedValue: string | Object | ReactElement;
        isMaskCell: boolean;
    };
} => {
    const {
        cell,
        row
    } = props;
    const {
        column,
        cellType,
        aggregateColumn
    } = cell;
    const {
        customAttributes,
        field,
        width,
        headerText,
        headerTemplate,
        template,
        valueAccessor,
        headerValueAccessor,
        format,
        type,
        textAlign,
        visible,
        disableHtmlEncode,
        headerTextAlign,
        ...rest
    } = column;
    const { serviceLocator, virtualizationSettings, loadingIndicatorSettings } =
        useGridComputedProvider();
    const { aggregateSelection } = useGridMutableProvider();
    const { indicatorType, params } = loadingIndicatorSettings;
    const formatter: IValueFormatter = serviceLocator?.getService<IValueFormatter>('valueFormatter');
    const localization: IL10n = serviceLocator?.getService<IL10n>('localization');
    /**
     * Formats a value according to the column's type and format specification
     *
     * @type {(value: string | Object | null) => string}
     */
    const formatValue: (value: string | object | null) => string = useMemo(() => {
        return (value: string | Object | null): string => {
            let updatedType: string = type;
            if (!isNullOrUndefined(format) && formatter) {
                const isCaptionRowAggregateTypeCell: boolean = row.isCaptionRow && !isNullOrUndefined(column.groupCaptionAggregateType);
                const applyNumberFormat: (closureValue: string | Object | null) => number | string =
                    (closureValue: string | Object | null): number | string => {
                        // Get appropriate formatter function
                        const formatterFn: Function = isDateOrNumber(closureValue) ? (typeof format === 'string' ?
                            setStringFormatter(formatter, updatedType, format) :
                            formatter.getFormatFunction?.(format as NumberFormatOptions | DateFormatOptions)) : undefined;

                        if (type === 'number' && typeof closureValue === 'string' && isNullOrUndefined(closureValue.split('.')[1])) {
                            closureValue += '.0';
                        }
                        if (!isNullOrUndefined(formatterFn)) {
                            const viewableContent: string = formatter.toView(closureValue as number | Date, formatterFn) as string;
                            closureValue = viewableContent !== 'NaN' ? viewableContent : (isCaptionRowAggregateTypeCell ?
                                (closureValue as string)?.split?.('.0')?.[0] : closureValue);
                        }
                        return closureValue as number | string;
                    };
                // Handle number validation
                if ((type === 'number' || isCaptionRowAggregateTypeCell) && typeof value === 'string' &&
                    (isNaN(parseInt(value, 10)) || isCaptionRowAggregateTypeCell)) {
                    if (isCaptionRowAggregateTypeCell) { // for format applied group caption aggregate cells
                        const fieldAggregates: AggregateData<T> = (row.data as GroupedData<T>)?.aggregates;
                        const aggregateType: AggregateType | AggregateType[] | string | string[] = column.groupCaptionAggregateType;
                        if (typeof aggregateType === 'string') {
                            value = applyNumberFormat(value ?? fieldAggregates?.[`${field} - ${aggregateType.toLowerCase()}`]);
                        } else {
                            let aggValue: string = '';
                            for (let aggIndex: number = 0, valueAccessorSplitted: string[] = value.split(', '); aggIndex < aggregateType.length; aggIndex++) {
                                if (aggIndex > 0) {
                                    aggValue += ' | ';
                                }
                                aggValue += aggregateType[aggIndex as number] + ': ';
                                aggValue +=
                                    String(valueAccessorSplitted?.[aggIndex as number] ??
                                        applyNumberFormat(valueAccessorSplitted?.[aggIndex as number] ??
                                            fieldAggregates?.[`${field} - ${aggregateType?.[aggIndex as number].toLowerCase()}`]));
                            }
                            value = aggValue;
                        }
                        return String(value);
                    } else {
                        return '';
                    }
                }
                // Auto-detect type if not specified
                if (!isNullOrUndefined(value) && !type) {
                    updatedType = value instanceof Date && !isNullOrUndefined(value.getDay) ?
                        ((value.getHours() || value.getMinutes() || value.getSeconds() || value.getMilliseconds()) ? 'datetime' : 'date') :
                        typeof value;
                }
                value = applyNumberFormat(value);
            }
            if (type === 'boolean' && !column.displayAsCheckBox) {
                // Handle boolean values properly - check actual boolean value, not just string representation
                // Convert value to string first, then check string representation
                const stringValue: string = value?.toString();
                const localeStr: string = (stringValue !== 'true' && stringValue !== 'false') ? null :
                    stringValue === 'true' ? 'booleanTrueLabel' : 'booleanFalseLabel';

                // If localeStr exists, get localized version, otherwise fall back to original stringValue
                return localeStr ? (localization ? localization.getConstant(localeStr) : stringValue) : stringValue;
            }
            return String(value);
        };
    }, [type, format, formatter]);
    /**
     * Computes the CSS class for header alignment
     *
     * @type {string}
     */
    const alignHeaderClass: string = useMemo(() => {
        const alignment: string = (headerTextAlign ?? textAlign ?? 'Left').toLowerCase();
        return `sf-${alignment}-align`;
    }, [headerTextAlign, textAlign]);
    /**
     * Computes the CSS class for cell alignment
     *
     * @type {string}
     */
    const alignClass: string = useMemo(() => {
        const alignment: string = (textAlign ?? 'Left').toLowerCase();
        return `sf-${alignment}-align`;
    }, [textAlign]);
    /**
     * Computes visibility class and updates style attributes
     *
     * @type {string}
     */
    const visibleClass: string = useMemo(() => {
        if (CellTypes.Data === cellType && customAttributes) {
            customAttributes.style = {
                ...customAttributes.style,
                display: visible || isNullOrUndefined(visible) ? '' : 'none'
            };
        }
        return visible || isNullOrUndefined(visible) ? '' : ` ${CSS_CLASS_NAMES.HIDDEN}`;
    }, [visible, cellType, customAttributes]);
    /**
     * Retrieves the raw value from the data row based on field
     *
     * @type {ValueType}
     */
    const value: ValueType | Object = useMemo(() => {
        return (cellType === CellTypes.Data && field && row && row.isDataRow) ?
            getObject(field, row.data) : undefined;
    }, [cellType, field, row]);

    /**
     * Determines if cell should render loading skeleton
     *
     * @type {boolean}
     */
    const isMaskCell: boolean = useMemo(() => {
        return indicatorType === LoadingIndicatorType.Shimmer && cellType === CellTypes.Data && field && row && row.isDataRow &&
            isNullOrUndefined(row.data);
    }, [cellType, field, row, virtualizationSettings?.scrollMode, indicatorType]);
    /**
     * Retrieves the aggregate value from the data based on column information
     *
     * @param {Object} data - The data object containing the column values
     * @param {AggregateColumnProps} column - The column model with aggregation details
     * @returns {Object} - The aggregated value for the specified column, or an empty string if not found
     */
    const getAggregateValue: (data: Object, column: AggregateColumnProps<T>) => Object =
        (data: Object, column: AggregateColumnProps<T>): Object => {
            let key: string = !isNullOrUndefined(column.type) ?
                column.field + ' - ' + (typeof column.type === 'string' ? column.type.toLowerCase() : '') : column.columnName;
            if (column.format && !isNullOrUndefined(column.type) && typeof column.type === 'string') {
                key = column.type;
            }
            const userSelectedAggregate: AggregateType = aggregateSelection?.getAggregate(row.rowIndex, column.field);
            if (userSelectedAggregate) {
                key = column.format ? userSelectedAggregate : `${column.field} - ${userSelectedAggregate.toLowerCase()}`;
            }
            return data[column.columnName] ? data[column.columnName][`${key}`] : '';
        };
    /**
     * Computes the formatted value for display, handling templates and type conversions
     *
     * @type {string | ReactElement}
     */
    const formattedValue: string | Object | ReactElement = useMemo(() => {
        let formattedVal: string | Object = value;
        // Handle header cell formatting
        if (cellType === CellTypes.Header) {
            if (isNullOrUndefined(headerTemplate)) {
                formattedVal = headerValueAccessor({headerText: 'headerText', column});
            } else if (typeof headerTemplate === 'string' || isValidElement(headerTemplate)) {
                return headerTemplate;
            } else {
                return createElement(headerTemplate, { column: column, columnIndex: cell.index });
            }
        } else if (cellType === CellTypes.Filter) {
            return formattedVal;
        } else if (cellType === CellTypes.Summary) {
            const footerTemplate: ComponentType<AggregateData<T>> | ReactElement | string = aggregateColumn.footerTemplate;
            if (isNullOrUndefined(footerTemplate)) {
                return getAggregateValue(row.data, aggregateColumn);
            } else if (typeof footerTemplate === 'string' || isValidElement(footerTemplate)) {
                return footerTemplate;
            } else {
                return createElement(footerTemplate, { ...row.data[aggregateColumn.columnName] });
            }
        }
        // Handle data cell formatting
        else {
            if (isNullOrUndefined(template)) {
                formattedVal = valueAccessor({field: (field as string), data: row.data as T, column: column});
            } else if (typeof template === 'string' || isValidElement(template)) {
                return template;
            } else {
                return createElement(template, { column: column, data: row.data as T, rowIndex: row.rowIndex });
            }
        }
        // Apply type-specific formatting for values
        if (!isNullOrUndefined(formattedVal)) {
            if ((type === 'date' || type === 'datetime') && !isNullOrUndefined(formattedVal)) {
                const dateValue: Date = new Date(formattedVal as string);
                formattedVal = !isNaN(dateValue?.getTime?.()) ? dateValue : formattedVal;
            }
            if (type === 'dateonly' && typeof formattedVal === 'string') {
                const arr: string[] = formattedVal.split(/[^0-9.]/);
                const dateValue: Date = new Date(parseInt(arr[0], 10), parseInt(arr[1], 10) - 1, parseInt(arr[2], 10));
                formattedVal = !isNaN(dateValue?.getTime?.()) ? dateValue : formattedVal;
            }
            return formatValue(formattedVal);
        }
        else if (isMaskCell) {
            return createElement(Skeleton, { height: '10px', width: '100%', ...params as SkeletonProps });
        }
        else {
            return formattedVal as string;
        }
    }, [
        value,
        field,
        row,
        cellType,
        template,
        headerTemplate,
        isMaskCell,
        headerText,
        params,
        type,
        valueAccessor,
        headerValueAccessor,
        formatValue
    ]);
    /**
     * Private API for internal component use
     *
     * @type {{ cellType: CellTypes, row: IRow<IColumnBase>, alignClass: string, alignHeaderClass: string, visibleClass: string, formattedValue: string | ReactElement, isMaskCell: boolean }}
     */
    const gridInternal: {
        cellType: CellTypes;
        row: IRow<IColumnBase<T>>;
        alignClass: string;
        alignHeaderClass: string;
        visibleClass: string;
        formattedValue: string | Object | ReactElement;
        isMaskCell: boolean;
    } = useMemo(() => ({
        cellType,
        row,
        alignClass,
        alignHeaderClass,
        visibleClass,
        formattedValue,
        isMaskCell
    }), [cellType, row, alignClass, alignHeaderClass, visibleClass, formattedValue, isMaskCell]);
    /**
     * Public API exposed to parent components
     *
     * @type {Partial<ColumnProps>}
     */
    const gridAPI: Partial<ColumnProps<T>> = useMemo(() => ({
        field,
        headerText,
        textAlign,
        headerTextAlign,
        format,
        type,
        width: formatUnit(width as string | number || ''),
        customAttributes,
        visible,
        disableHtmlEncode,
        ...rest
    }), [field, headerText, textAlign, headerTextAlign, type, format, width, customAttributes, visible, rest]);
    return { gridAPI, gridInternal };
};
