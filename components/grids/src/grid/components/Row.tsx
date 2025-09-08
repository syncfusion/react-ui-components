import {
    forwardRef,
    useImperativeHandle,
    useRef,
    Children,
    useEffect,
    ReactElement,
    useMemo,
    useCallback,
    memo,
    JSX,
    RefObject,
    RefAttributes,
    NamedExoticComponent,
    useState,
    isValidElement
} from 'react';
import {
    IRowBase,
    RowRef,
    ICell, CellType, RenderType, IRow
} from '../types';
import { ColumnProps, IColumnBase, CustomAttributes } from '../types/column.interfaces';
import { AggregateColumnProps, AggregateRowRenderEvent } from '../types/aggregate.interfaces';
import { RowRenderEvent, ValueType } from '../types/interfaces';
import { useGridComputedProvider, useGridMutableProvider } from '../contexts';
import { ColumnBase } from './Column';
import { FilterBase, InlineEditForm } from '../views';
import { InlineEditFormRef } from '../types/edit.interfaces';
import { IL10n, isNullOrUndefined } from '@syncfusion/react-base';

// CSS class constants following enterprise naming convention
const CSS_HEADER_CELL: string = 'sf-headercell';
const CSS_FILTER_CELL: string = 'sf-filterbarcell';
const CSS_SUMMARY_CELL: string = 'sf-summarycell';
const CSS_SUMMARY_FIRST_CELL: string = 'sf-firstsummarycell';
const CSS_SUMMARY_LAST_CELL: string = 'sf-lastsummarycell';
const CSS_LAST_CELL: string = 'sf-lastcell';
const CSS_ROW_CELL: string = 'sf-rowcell';
const CSS_DEFAULT_CURSOR: string = ' sf-defaultcursor';
const CSS_MOUSE_POINTER: string = ' sf-mousepointer';
const CSS_SORT_ICON: string = ' sf-sorti-con';
const CSS_CELL_HIDE: string = 'sf-hide';

/**
 * RowBase component renders a table row with cells based on provided column definitions
 *
 * @component
 * @private
 * @param {IRowBase} props - Component properties
 * @param {RenderType} [props.rowType=RenderType.Content] - Type of row (header or content)
 * @param {object} [props.row] - Data for the row
 * @param {ReactElement<IColumnBase>[]} [props.children] - Column definitions
 * @param {string} [props.className] - Additional CSS class names
 * @param {RefObject<RowRef>} ref - Forwarded ref to expose internal elements and methods
 * @returns {JSX.Element} The rendered table row with cells
 */
const RowBase: NamedExoticComponent<IRowBase & RefAttributes<RowRef>> = memo(forwardRef<RowRef, IRowBase>(
    (props: IRowBase, ref: RefObject<RowRef>) => {
        const {
            rowType,
            row,
            children,
            tableScrollerPadding,
            aggregateRow,
            ...attr
        } = props;
        const { headerRowDepth, isInitialBeforePaint, editModule, uiColumns, isInitialLoad } = useGridMutableProvider();
        const { onRowRender, onAggregateRowRender, serviceLocator, rowClass,
            sortSettings, rowHeight, editSettings, columns, rowTemplate } = useGridComputedProvider();
        const rowRef: RefObject<HTMLTableRowElement> = useRef<HTMLTableRowElement>(null);
        const cellsRef: RefObject<ICell<ColumnProps>[]> = useRef<ICell<ColumnProps>[]>([]);
        const localization: IL10n = serviceLocator?.getService<IL10n>('localization');
        const editInlineFormRef: RefObject<InlineEditFormRef> = useRef<InlineEditFormRef>(null);
        const [syncFormState, setSyncFormState] = useState(editInlineFormRef.current?.formState);
        const [rowObject, setRowObject] = useState<IRow<ColumnProps>>(row);
        /**
         * Returns the cell options objects
         *
         * @returns {ICell<ColumnProps>[]} Array of cell options objects
         */
        const getCells: () => ICell<ColumnProps>[] = useCallback(() => {
            return cellsRef.current;
        }, []);

        const inlineEditForm: JSX.Element = useMemo(() => {
            // Properly check for edit permissions and active edit state
            // This ensures double-click properly triggers edit mode on data rows
            if (rowType === RenderType.Content &&
                (!editModule?.editSettings?.allowEdit ||
                 !(editModule?.isEdit && editModule?.editRowIndex >= 0 && editModule?.editRowIndex === row.index) ||
                 isNullOrUndefined(editModule?.originalData))) {
                return null;
            }
            return (
                <InlineEditForm
                    ref={(ref: InlineEditFormRef) => {
                        editInlineFormRef.current = ref;
                        setSyncFormState(ref?.formState);
                    }}
                    key={`edit-${row?.uid}`}
                    stableKey={`edit-${row?.uid}-${editModule?.editRowIndex}`}
                    isAddOperation={false}
                    columns={uiColumns ?? columns}
                    editData={editModule?.editData || {}}
                    validationErrors={editModule?.validationErrors || {}}
                    editRowIndex={row?.index}
                    rowUid={row?.uid}
                    onFieldChange={(field: string, value: ValueType | null) => {
                        if (editModule?.updateEditData) {
                            editModule?.updateEditData?.(field, value);
                        }
                    }}
                    onSave={() => editModule?.saveChanges()}
                    onCancel={editModule?.cancelChanges}
                    template={editSettings?.template}
                />
            );
        }, [
            uiColumns,
            columns,
            editModule?.isEdit,
            editModule?.editRowIndex,
            editModule?.isShowAddNewRowActive,
            editModule?.isShowAddNewRowDisabled,
            editModule?.showAddNewRowData,
            editModule?.editSettings?.showAddNewRow,
            editModule?.editSettings?.newRowPosition,
            editSettings?.template
        ]);

        /**
         * Expose internal elements through the forwarded ref
         */
        useImperativeHandle(ref, () => ({
            rowRef: rowRef,
            getCells,
            editInlineRowFormRef: editInlineFormRef,
            setRowObject
        }), [getCells, editModule?.isEdit, syncFormState, rowObject]);

        /**
         * Handle row data bound event for content rows
         */
        const handleRowDataBound: () => void = useCallback(() => {
            if (rowType === RenderType.Content && onRowRender && rowRef.current) {
                const rowArgs: RowRenderEvent = {
                    row: rowRef.current,
                    data: row.data,
                    rowHeight: rowHeight,
                    isSelectable: true // Until isPartialSelection is implemented, all data rows are selectable.
                };
                onRowRender(rowArgs);
                if (!isNullOrUndefined(rowArgs.rowHeight)) {
                    rowRef.current.style.height = `${rowArgs.rowHeight}px`;
                }
            }
        }, [rowType, rowObject, onRowRender]);

        /**
         * Call rowDataBound callback after render
         */
        useEffect(() => {
            if (isInitialBeforePaint.current) { return; }
            if (rowObject?.uid !== 'empty-row-uid') {
                handleRowDataBound();
            }
        }, [handleRowDataBound, inlineEditForm, rowObject, isInitialBeforePaint.current]);

        useEffect(() => {
            if (isInitialBeforePaint.current) { return; }
            if (!isInitialLoad && rowObject?.uid === 'empty-row-uid') {
                handleRowDataBound();
            }
        }, [handleRowDataBound, isInitialLoad, rowObject, isInitialBeforePaint.current]);

        /**
         * Handle aggregate row data bound event for aggregate rows
         */
        const handleAggregateRowDataBound: () => void = useCallback(() => {
            if (rowType === RenderType.Summary && onAggregateRowRender && rowRef.current) {
                const rowArgs: AggregateRowRenderEvent = {
                    row: rowRef.current,
                    rowData: row.data,
                    rowHeight: rowHeight
                };
                onAggregateRowRender(rowArgs);
                if (!isNullOrUndefined(rowArgs.rowHeight)) {
                    rowRef.current.style.height = `${rowArgs.rowHeight}px`;
                }
            }
        }, [rowType, rowObject, onAggregateRowRender]);

        /**
         * Call aggregateRowDataBound callback after render
         */
        useEffect(() => {
            if (isInitialBeforePaint.current) { return; }
            handleAggregateRowDataBound();
        }, [handleAggregateRowDataBound, rowObject, isInitialBeforePaint.current]);


        /**
         * Process children to create column elements with proper props
         */
        const processedChildren: JSX.Element[] = useMemo(() => {

            const childrenArray: ReactElement<IColumnBase>[] = Children.toArray(children) as ReactElement<IColumnBase>[];
            const cellOptions: ICell<IColumnBase>[] = [];
            const elements: JSX.Element[] = [];

            for (let index: number = 0; index < childrenArray.length; index++) {
                const child: ReactElement<IColumnBase> = childrenArray[index as number];

                // Determine cell class based on row type and position
                const cellClassName: string = rowType === RenderType.Header
                    ? `${CSS_HEADER_CELL}${child.props.allowSort && sortSettings?.enabled ? `${CSS_MOUSE_POINTER}` : `${CSS_DEFAULT_CURSOR}`}${rowHeight && !isNullOrUndefined(child.props.field) ? `${CSS_SORT_ICON}` : ''}${index === childrenArray.length - 1 ? ` ${CSS_LAST_CELL}` : ''}`
                    : rowType === RenderType.Filter ? CSS_FILTER_CELL : rowType === RenderType.Summary ? `${CSS_SUMMARY_CELL} ${tableScrollerPadding && index === 0 ? CSS_SUMMARY_FIRST_CELL : tableScrollerPadding && index === childrenArray.length - 1 ? CSS_SUMMARY_LAST_CELL : ''}` : CSS_ROW_CELL;

                const cellType: CellType = rowType === RenderType.Header ? CellType.Header : rowType === RenderType.Filter ?
                    CellType.Filter : rowType === RenderType.Summary ? CellType.Summary : CellType.Data;

                const colSpan: number = !child.props.field && child.props.headerText && (rowType === RenderType.Header &&
                    (child.props.columns && child.props.columns.length) || (child.props.children &&
                        (child.props as { children: ReactElement<IColumnBase>[] }).children.length)) ? child.props.columns?.length ||
                (child.props as { children: ReactElement<IColumnBase>[] }).children.length : 1;
                const rowSpan: number = rowType !== RenderType.Header || (rowType === RenderType.Header &&
                    ((child.props.columns && child.props.columns.length) || child.props.children)) ? 1 :
                    headerRowDepth - row.index;

                const { ...cellAttributes } = child.props.customAttributes || {};

                // Determine if the cell is visible
                const isVisible: boolean = child.props.visible !== false;

                // Build custom attributes object with proper typing
                const customAttributesWithSpan: CustomAttributes = {
                    ...cellAttributes,
                    ...(child.props?.template && child.props?.templateSettings?.ariaLabel?.length > 0 ? { 'aria-label': child.props?.templateSettings?.ariaLabel } : {}),
                    className: `${cellClassName}${!isVisible ? ` ${CSS_CELL_HIDE}` : ''}`,
                    title: rowType === RenderType.Filter ? (child.props.headerText || child.props.field) + localization?.getConstant('filterBarTooltip') : undefined,
                    role: rowType === RenderType.Header || rowType === RenderType.Filter ? 'columnheader' : 'gridcell',
                    tabIndex: -1,
                    'aria-colindex': index ? index + 1 : 1,
                    ...(colSpan > 1 ? { 'aria-colspan': colSpan } : {})
                };

                // Create cell options object for getCells method
                const cellOption: ICell<IColumnBase> = {
                    visible: isVisible,
                    isDataCell: rowType !== RenderType.Header && rowType !== RenderType.Filter, // true for data cells
                    isTemplate: rowType === RenderType.Header
                        ? Boolean(child.props.headerTemplate)
                        : Boolean(child.props.template),
                    rowID: row?.uid || '',
                    column: {
                        customAttributes: customAttributesWithSpan,
                        index,
                        ...child.props as IColumnBase,
                        type: uiColumns ? uiColumns?.[index as number]?.type : columns?.[index as number]?.type
                    },
                    cellType,
                    colSpan: colSpan,
                    rowSpan: rowSpan,
                    index,
                    colIndex: index,
                    className: row?.uid === 'empty-row-uid' ? '' : `${cellClassName}${!isVisible ? ` ${CSS_CELL_HIDE}` : ''}`
                };
                if (rowType === RenderType.Summary) {
                    const aggregateColumn: AggregateColumnProps = aggregateRow.columns
                        .find((aggregate: AggregateColumnProps) => aggregate.columnName === child.props.field);
                    cellOption.isDataCell = aggregateColumn ? true : false;
                    cellOption.isTemplate = aggregateColumn && aggregateColumn.footerTemplate ? true : false;
                    cellOption.aggregateColumn = aggregateColumn || {};
                }

                // Build column props
                const columnProps: IColumnBase = {
                    row: rowObject,
                    cell: cellOption
                };

                // Store cell options
                cellOptions.push(cellOption);

                if (rowType === RenderType.Filter) {
                    elements.push(
                        <FilterBase
                            key={`${child.props.field || 'col'}-${row?.index + 1 || 'filter'}`}
                            {...columnProps}
                        />
                    );
                } else {
                    elements.push(
                        <ColumnBase
                            key={`${child.props.field || 'col'}-${row?.index || 'header'}`}
                            {...columnProps}
                        />
                    );
                }
            }

            // Update the ref with cell options
            cellsRef.current = cellOptions;

            return elements;
        }, [children, rowObject, rowType]);

        /**
         * Row template
         */
        const renderRowTemplate: string | ReactElement = useMemo((): string | ReactElement => {
            if (rowTemplate && rowType === RenderType.Content && rowObject?.data ) {
                if (typeof rowTemplate === 'string' || isValidElement(rowTemplate)) {
                    return rowTemplate;
                }
                else {
                    return rowTemplate(rowObject.data);
                }
            }
            return null;
        }, [rowTemplate, rowObject?.data, rowType]);

        const customRowClass: string | undefined = useMemo(() => {
            if (rowType === RenderType.Content && rowObject?.uid !== 'empty-row-uid') {
                return !isNullOrUndefined(rowClass) ? (typeof rowClass === 'function' ?
                    rowClass({rowType: 'content', rowData: rowObject.data, rowIndex: rowObject.index}) : rowClass) : undefined;
            }
            return undefined;
        }, [rowClass, inlineEditForm, rowObject]);
        const customNoRecordRowClass: string | undefined = useMemo(() => {
            if (isInitialBeforePaint.current) { return undefined; }
            if (rowType === RenderType.Content && !isInitialLoad && rowObject?.uid === 'empty-row-uid') {
                return !isNullOrUndefined(rowClass) ?
                    (typeof rowClass === 'function' ? rowClass({rowType: 'content', rowIndex: 0}) : rowClass) : undefined;
            }
            return undefined;
        }, [rowClass, isInitialLoad, rowObject, isInitialBeforePaint.current]);
        const customAggregateRowClass: string | undefined = useMemo(() => {
            if (isInitialBeforePaint.current) { return undefined; }
            return rowType === RenderType.Summary && !isNullOrUndefined(rowClass) ? (typeof rowClass === 'function' ?
                rowClass({rowType: 'aggregate', rowData: rowObject.data, rowIndex: rowObject.index}) : rowClass) : undefined;
        }, [rowClass, rowObject, isInitialBeforePaint.current]);
        return (
            <>
                { renderRowTemplate ? renderRowTemplate :
                    rowType === RenderType.Content && editModule?.editSettings?.allowEdit && editModule?.isEdit &&
                    editModule?.editRowIndex >= 0 && editModule?.editRowIndex === row.index && !isNullOrUndefined(editModule?.originalData)
                        ? inlineEditForm
                        : (<tr
                            ref={rowRef}
                            {...attr}
                            className={attr.className +
                                ((customRowClass || customNoRecordRowClass || customAggregateRowClass)
                                    ? ' ' + (customRowClass || customNoRecordRowClass || customAggregateRowClass)
                                    : '')
                            }
                        >
                            {processedChildren}
                        </tr>)
                }
            </>
        );
    }
));

/**
 * Set display name for debugging purposes
 */
RowBase.displayName = 'RowBase';

/**
 * Export the RowBase component for use in other components
 *
 * @private
 */
export { RowBase };
