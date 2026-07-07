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
    isValidElement,
    createElement,
    HTMLAttributes,
    cloneElement
} from 'react';
import {
    IRowBase,
    RowRef,
    ICell, CellTypes, RenderType, IRow,
    RowType,
    CellSelectionType,
    GroupType
} from '../types';
import { ColumnProps, IColumnBase, CustomAttributes } from '../types/column.interfaces';
import { AggregateColumnProps, AggregateRowRenderEvent } from '../types/aggregate.interfaces';
import { RowRenderEvent, ValueType } from '../types/interfaces';
import { useGridComputedProvider, useGridMutableProvider } from '../contexts';
import { ColumnBase } from './Column';
import { FilterBase, InlineEditForm } from '../views';
import { CellEditForm } from '../views/editing/CellEditForm';
import { EditFormTemplate, InlineEditFormRef, CellEditFormRef } from '../types/edit.interfaces';
import { IL10n, isNullOrUndefined } from '@syncfusion/react-base';
import { parseUnit, getCellSelectionBorderClasses, getWithoutCheckBoxandCommandColumn } from '../utils';

// CSS class constants following enterprise naming convention
const CSS_CELL: string = 'sf-cell';
const CSS_DEFAULT_CURSOR: string = ' sf-defaultcursor';
const CSS_MOUSE_POINTER: string = ' sf-mousepointer';
const CSS_SORT_ICON: string = ' sf-sort-icon';
const CSS_CELL_HIDE: string = 'sf-display-none';

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
const RowBase: <T>(props: IRowBase<T> & RefAttributes<RowRef>) => ReactElement = memo(forwardRef<RowRef, IRowBase>(
    <T, >(props: IRowBase<T>, ref: RefObject<RowRef>) => {
        const {
            rowType,
            row,
            children,
            tableScrollerPadding,
            aggregateRow,
            ...attr
        } = props;
        const { headerRowDepth, isInitialBeforePaint, editModule, uiColumns, isInitialLoad, totalVirtualColumnWidth, commandColumnModule,
            dataModule, offsetX, focusModule, virtualSettings, cellSelectionModule } = useGridMutableProvider<T>();
        const { commandEdit, commandEditRef, commandEditStateRef } = commandColumnModule;
        const { onRowRender, onAggregateRowRender, serviceLocator, rowClass, filterSettings,
            sortSettings, rowHeight, editSettings, columns, rowTemplate, selectionSettings, headerScrollRef, contentPanelRef,
            scrollModule, getVisibleColumns, id, getPrimaryKeyFieldNames, enableAutoSpan, isSpannedColumns , groupSettings
        } = useGridComputedProvider<T>();
        const rowRef: RefObject<HTMLTableRowElement> = useRef<HTMLTableRowElement>(null);
        const cellsRef: RefObject<ICell<ColumnProps<T>>[]> = useRef<ICell<ColumnProps<T>>[]>([]);
        const localization: IL10n = serviceLocator?.getService<IL10n>('localization');
        const editInlineFormRef: RefObject<InlineEditFormRef<T>> = useRef<InlineEditFormRef<T>>(null);
        const editCellFormRef: RefObject<CellEditFormRef> = useRef<CellEditFormRef>(null);
        const [syncFormState, setSyncFormState] = useState(editInlineFormRef.current?.formState);
        const [rowObject, setRowObject] = useState<IRow<ColumnProps<T>>>(row);
        if (dataModule?.dataManager && 'result' in dataModule?.dataManager && rowObject?.data) {
            rowObject.data = row.data;
        }
        const cachedCellObjects: RefObject<Map<number | string, IColumnBase<T> & { reactElement: JSX.Element }>> =
            useRef<(Map<number | string, IColumnBase<T> & { reactElement: JSX.Element }>)>(new Map());
        /**
         * Returns the cell options objects
         *
         * @returns {ICell<ColumnProps>[]} Array of cell options objects
         */
        const getCells: () => ICell<ColumnProps<T>>[] = useCallback(() => {
            return cellsRef.current;
        }, []);

        const setAriaSelected: HTMLAttributes<HTMLTableRowElement> = useMemo(() => (selectionSettings.enabled ? {
            'aria-selected': rowObject?.isSelected
        } : {}), [rowObject?.isSelected, selectionSettings.enabled]);

        const inlineEditForm: JSX.Element = useMemo(() => {
            // Properly check for edit permissions and active edit state
            // This ensures double-click properly triggers edit mode on data rows
            if (rowType === RenderType.Content &&
                (!editModule?.editSettings?.allowEdit ||
                 !(editModule?.isEdit && editModule?.editRowIndex >= 0 && editModule?.editRowIndex === row.rowIndex) ||
                 isNullOrUndefined(editModule?.originalData)) &&
                 !(editModule?.editSettings?.allowEdit && commandEdit.current && commandEditRef.current[rowObject.uid])) {
                return null;
            }
            return (
                <InlineEditForm
                    ref={(ref: InlineEditFormRef<T>) => {
                        editInlineFormRef.current = ref;
                        setSyncFormState(ref?.formState);
                    }}
                    key={`edit-${row?.uid}-${scrollModule?.virtualColumnInfo?.startIndex}`}
                    stableKey={`edit-${row?.uid}-${editModule?.editRowIndex}`}
                    isAddOperation={false}
                    columns={uiColumns.current ?? columns as ColumnProps<T>[]}
                    editData={commandEditStateRef.current?.[rowObject?.uid]?.editData ?? editModule?.editData}
                    rowObject={rowObject}
                    validationErrors={(!virtualSettings.enableRow || !commandEdit.current ? editModule?.validationErrors :
                        commandEditStateRef.current?.[rowObject?.uid]?.validationErrors) || {}}
                    editRowIndex={row?.rowIndex}
                    rowUid={row?.uid}
                    onFieldChange={(field: string, value: ValueType | Object | null) => {
                        if (editModule?.updateEditData) {
                            editModule?.updateEditData?.(field, value, rowObject);
                        }
                    }}
                    onSave={() => editModule?.saveDataChanges()}
                    onCancel={editModule?.cancelDataChanges}
                    template={editSettings?.template as React.ComponentType<EditFormTemplate<T>>}
                />
            );
        }, [
            uiColumns.current,
            columns,
            editModule?.isEdit,
            editModule?.editRowIndex,
            editModule?.isShowAddNewRowActive,
            editModule?.isShowAddNewRowDisabled,
            editModule?.showAddNewRowData,
            editModule?.editSettings?.showAddNewRow,
            editModule?.editSettings?.newRowPosition,
            editSettings?.template,
            Object.keys(commandEditRef?.current).length
        ]);

        /**
         * Expose internal elements through the forwarded ref
         */
        useImperativeHandle(ref, () => ({
            rowRef: rowRef,
            getCells,
            editInlineRowFormRef: editInlineFormRef,
            editCellFormRef: editCellFormRef,
            setRowObject
        }), [getCells, editModule?.isEdit, syncFormState, rowObject, offsetX]);

        /**
         * Handle row data bound event for content rows
         */
        const handleRowDataBound: () => void = useCallback(() => {
            if (rowType === RenderType.Content && onRowRender && rowRef.current) {
                const rowArgs: RowRenderEvent<T> = {
                    row: rowRef.current,
                    data: row.data,
                    rowHeight: row.height || rowHeight,
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
            if (isInitialBeforePaint.current) {
                if ((rowType === RenderType.Header || rowType === RenderType.Filter) &&
                    totalVirtualColumnWidth > parseUnit(headerScrollRef?.clientWidth)) {
                    setRowObject((prev: IRow<ColumnProps<T>>) => ({ ...prev })); //responsive content height setting purpose initial header row refresh required.
                }
                return;
            }
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
                const rowArgs: AggregateRowRenderEvent<T> = {
                    row: rowRef.current,
                    data: row.data,
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
        useEffect(() => {
            if (isInitialLoad) { return; }
            if (!focusModule?.focusedCell.current?.isHeader && !focusModule?.focusedCell.current?.isAggregate &&
                attr['aria-rowindex'] === focusModule?.focusedCell.current?.virtualAriaRowIndex &&
                focusModule?.focusedCell.current?.colIndex !== -1 &&
                rowRef.current?.querySelector(`td[aria-colindex="${focusModule?.focusedCell.current?.virtualAriaColIndex}"]`) &&
                !focusModule?.focusedCell.current?.element?.querySelector('input[aria-expanded="true"]') &&
                !focusModule?.focusedCell.current?.element?.querySelector('.sf-cell .sf-skeleton') &&
                document.activeElement.id !== id + '_columnchooser' && !((editModule?.editSettings.mode === 'Popup' ||
                    editModule?.editSettings.mode === 'PopupTemplate') && rowObject?.editInlineRowFormRef) &&
                    !document.activeElement.closest('.sf-grid-edit-form')) {
                const virtualCell: HTMLTableCellElement =
                    rowRef.current?.querySelector(`td[aria-colindex="${focusModule?.focusedCell.current?.virtualAriaColIndex}"]`);
                if (!focusModule?.focusedCell?.current.element?.classList?.contains('sf-focused')) {
                    focusModule?.addFocus?.({...focusModule?.focusedCell.current, element: virtualCell, elementToFocus: virtualCell});
                }
            }
        }, [rowObject?.isSelected, cellSelectionModule, attr]);

        useMemo(() => {
            cachedCellObjects.current.clear();
        }, [children, rowObject, rowType]);
        useEffect(() => {
            return () => {
                cachedCellObjects.current.clear();
            };
        }, []);

        // Memoize the edited cell field to avoid unnecessary re-renders
        // Returns the field name only when this specific row is being edited in Cell mode
        const contentCellEditField: string | undefined = useMemo(() => {
            if (rowType === RenderType.Content && editModule?.editCellIndex?.field &&
                editModule.editCellIndex.primaryKeyValue === rowObject.data?.[getPrimaryKeyFieldNames()?.[0]]) {
                return editModule.editCellIndex.field;
            }
            return undefined;
        }, [rowType, editModule?.editCellIndex?.field, editModule?.editCellIndex?.primaryKeyValue,
            rowObject?.data, getPrimaryKeyFieldNames]);

        /**
         * Memoize the Cell Edit Form to optimize rendering
         * Only render when this specific cell is being edited in Cell mode
         */
        const cellEditForm: JSX.Element | null = useMemo(() => {
            if (!contentCellEditField || !editModule?.editCellIndex) {
                return null;
            }

            const handleFieldChange: (field: string, value: unknown) => void = (field: string, value: unknown): void => {
                editModule?.updateEditData?.(field, value as ValueType | Object | null, rowObject);
            };

            const handleValidationChange: (errors: Record<string, string>) => void = (errors: Record<string, string>): void => {
                // Sync validation errors back to editModule.validationErrors
                editModule?.updateValidationErrors?.(errors);
            };

            // Find the column being edited
            const visibleColumns: ColumnProps[] = getVisibleColumns?.();
            const editingColumn: ColumnProps<unknown> = visibleColumns.find((col: ColumnProps) => col.field === contentCellEditField);
            if (!editingColumn) {
                return null;
            }

            return (
                <CellEditForm<T>
                    ref={editCellFormRef}
                    key={`cell-edit-${contentCellEditField}-${rowObject?.rowIndex}`}
                    field={contentCellEditField}
                    value={editModule?.editData?.[contentCellEditField as keyof T] ??
                        (rowObject?.data as T)?.[contentCellEditField as keyof T]}
                    column={editingColumn as ColumnProps<T>}
                    rowData={rowObject?.data as T}
                    onFieldChange={handleFieldChange}
                    onSave={() => editModule?.saveCellChanges()}
                    onCancel={editModule?.cancelCellChanges}
                    validationErrors={editModule?.validationErrors as Record<string, string>}
                    onValidationChange={handleValidationChange}
                />
            );
        }, [
            contentCellEditField,
            editModule?.editCellIndex,
            editModule?.editData,
            editModule?.validationErrors,
            rowObject,
            columns
        ]);

        /**
         * Process children to create column elements with proper props
         */
        const processedChildren: JSX.Element[] = useMemo(() => {
            const childrenArray: ReactElement<IColumnBase<T>>[] = Children.toArray(children) as ReactElement<IColumnBase<T>>[];
            const cellOptions: ICell<IColumnBase<T>>[] = [];
            if (scrollModule?.virtualColumnInfo) {
                scrollModule.virtualColumnInfo.columns = [];
            }
            const elements: JSX.Element[] = [];

            const visibleColumns: ColumnProps[] = getVisibleColumns?.();
            const visibleHeaderColumns: ColumnProps[] = [];
            const from: number = scrollModule?.virtualColumnInfo.startIndex ?? 0;
            const to: number = childrenArray.length;
            let isFirstVisibleCell: boolean = true; // Track if this is the first visible cell in the row
            for (let index: number = from, count: number = 0, dataColIndex: number = 0, buffer: number = 0, renderedColumnWidth: number = 0;
                index < to && buffer <= (from !== 0 && index !== (to - 1) ? virtualSettings.columnBuffer * 2 :
                    virtualSettings.columnBuffer); index++, count++) {
                const child: ReactElement<IColumnBase<T>> = childrenArray[index as number];

                // Determine cell class based on row type and position
                const cellClassName: string = rowType === RenderType.Header
                    ? `${CSS_CELL}${child.props.allowSort && sortSettings?.enabled ? CSS_MOUSE_POINTER : CSS_DEFAULT_CURSOR}${rowHeight && !isNullOrUndefined(child.props.field) ? CSS_SORT_ICON : ''}`
                    : CSS_CELL;

                const cellType: CellTypes = rowType === RenderType.Header ? CellTypes.Header : rowType === RenderType.Filter ?
                    CellTypes.Filter : rowType === RenderType.Summary ? CellTypes.Summary : CellTypes.Data;

                let colSpan: number = !child.props.field && child.props.headerText && (rowType === RenderType.Header &&
                    (child.props.columns && child.props.columns.length) || (child.props.children &&
                        (child.props as { children: ReactElement<IColumnBase<T>>[] }).children.length)) ? child.props.columns?.length ||
                (child.props as { children: ReactElement<IColumnBase<T>>[] }).children.length : 1;
                let rowSpan: number = rowType !== RenderType.Header || (rowType === RenderType.Header &&
                    ((child.props.columns && child.props.columns.length) || child.props.children)) ? 1 :
                    headerRowDepth - row.rowIndex;
                const { ...cellAttributes } = child.props.customAttributes || {};
                const isVisible: boolean = child.props.visible !== false;
                // Determine if this is the first visible cell in a spanning row
                const rowFirstCellClass: string = (rowType === RenderType.Content && isSpannedColumns && isFirstVisibleCell && isVisible) ? ' row-first-cell' : '';
                if (isFirstVisibleCell && isVisible) {
                    isFirstVisibleCell = false;
                }
                // Determine if this is the last visible cell in a spanning row
                const rowLastCellClass: string = (rowType === RenderType.Content && isSpannedColumns && visibleColumns?.[visibleColumns?.length - 1]?.uid === child?.props?.uid && isVisible) ? ' row-last-cell' : '';
                const spanInfo: ICell<ColumnProps<T>> = row?.spanCells?.[count as number] as ICell<ColumnProps<T>>;
                const shouldSkipCell: boolean = spanInfo?.visible === false;
                if (rowType === RenderType.Content && (isSpannedColumns || (groupSettings?.enabled && groupSettings?.columns?.length &&
                    groupSettings?.type === GroupType.GroupRows))) {
                    colSpan = spanInfo?.colSpan ?? colSpan;
                    rowSpan = spanInfo?.rowSpan ?? rowSpan;
                    if (shouldSkipCell) {
                        continue;
                    }
                }
                if (rowType === RenderType.Content && rowObject?.isCaptionRow && groupSettings?.type === GroupType.GroupRows) {
                    colSpan = visibleColumns.length || 1;
                }

                // Generate cell key using data-based format: "primaryKey:fieldName"
                // Persists across paging, sorting, filtering, and column visibility changes
                const cellKey: string = cellSelectionModule?.getCellKey?.(row?.rowIndex, dataColIndex, row?.data) ?? `${row?.rowIndex}:${index}`;

                // Determine if the cell is selected using the persistent cell key
                const cellIsSelected: boolean = rowType === RenderType.Content && selectionSettings?.type === 'Cell' &&
                    cellSelectionModule?.selectedCells?.has(cellKey);

                // Build selection classes and compute border classes via util
                let selectionClass: string = '';
                let borderClasses: string = '';

                if (cellIsSelected) {
                    selectionClass = ' sf-cell-selected';
                    if (selectionSettings?.cellSelectionType === CellSelectionType.BoxWithBorder && cellSelectionModule?.selectedCells) {
                        // Compute border classes directly from selectedCells using the persistent cell key
                        // This ensures borders are always in sync with the current selection state
                        borderClasses = getCellSelectionBorderClasses(
                            cellSelectionModule?.selectedCells,
                            cellKey,
                            visibleColumns as ColumnProps[]
                        );
                    }
                }

                // Build custom attributes object with proper typing
                const shouldAddActiveClass: boolean = rowType === RenderType.Content && rowObject.isSelected && selectionSettings?.type !== 'Cell';
                const customAttributesWithSpan: CustomAttributes = {
                    ...cellAttributes,
                    ...(child.props?.template && child.props?.templateSettings?.ariaLabel?.length > 0 ? { 'aria-label': child.props?.templateSettings?.ariaLabel } : {}),
                    className: `${cellClassName}${!isVisible ? ` ${CSS_CELL_HIDE}` : ''} ${shouldAddActiveClass ? 'sf-active' : ''}${selectionClass}${borderClasses}${rowFirstCellClass}${rowLastCellClass}`,
                    title: rowType === RenderType.Filter ? (child.props.headerText || child.props.field) + localization?.getConstant('filterBarTooltip') : undefined,
                    role: rowType === RenderType.Header || rowType === RenderType.Filter ? 'columnheader' : 'gridcell',
                    tabIndex: -1,
                    'aria-colindex': index ? index + 1 : 1, // accessibility
                    ...(isVisible ? {'data-colindex': dataColIndex ? dataColIndex + 1 : 1} : {}),  // only rendered visible column based index
                    ...(colSpan > 1 ? { colSpan: colSpan, 'aria-colspan': colSpan } : {}),
                    ...(rowSpan > 1 ? { rowSpan: rowSpan, 'aria-rowspan': rowSpan } : {}),
                    ...(selectionSettings.enabled && rowType === RenderType.Content ? { 'aria-selected': rowObject.isSelected || cellIsSelected } : {})
                };

                // Create cell options object for getCells method
                const cellOption: ICell<IColumnBase<T>> = {
                    visible: isVisible,
                    isDataCell: rowType !== RenderType.Header && rowType !== RenderType.Filter, // true for data cells
                    isTemplate: rowType === RenderType.Header
                        ? Boolean(child.props.headerTemplate)
                        : Boolean(child.props.template),
                    isSpanned : isNullOrUndefined(shouldSkipCell) ? undefined : shouldSkipCell,
                    rowID: row?.uid || '',
                    isSelected: cellIsSelected,
                    column: {
                        customAttributes: customAttributesWithSpan,
                        index,
                        formatFn: visibleColumns?.[index as number]?.formatFn ?? uiColumns.current?.[index as number]?.formatFn,
                        ...child.props as IColumnBase<T>,
                        type: row?.uid === 'empty-row-uid' ? 'string' : (visibleColumns.length ? (rowObject?.isDetailRow ?
                            getWithoutCheckBoxandCommandColumn(visibleColumns) : visibleColumns)?.[index as number]?.type :
                            (uiColumns.current ? (rowObject?.isDetailRow ?
                                getWithoutCheckBoxandCommandColumn(uiColumns.current) : uiColumns.current)?.[index as number]?.type :
                                (rowObject?.isDetailRow ? getWithoutCheckBoxandCommandColumn(columns) : columns)?.[index as number]?.type))
                    },
                    cellType,
                    colSpan: colSpan,
                    rowSpan: rowSpan,
                    index,
                    colIndex: index,
                    className: row?.uid === 'empty-row-uid' ? '' : `${cellClassName}${!isVisible ? ` ${CSS_CELL_HIDE}` : ''}`
                };
                if (rowType === RenderType.Summary) {
                    const aggregateColumn: AggregateColumnProps<T> = aggregateRow.columns
                        .find((aggregate: AggregateColumnProps<T>) => aggregate.columnName === child.props.field);
                    cellOption.isDataCell = aggregateColumn ? true : false;
                    cellOption.isTemplate = aggregateColumn && aggregateColumn.footerTemplate ? true : false;
                    cellOption.aggregateColumn = aggregateColumn || {};
                }

                // Build column props
                const columnProps: IColumnBase<T> & React.Attributes = {
                    row: rowObject,
                    cell: cellOption
                };

                if (isVisible) {
                    // Store cell options
                    cellOptions.push(cellOption);
                    if (rowType === RenderType.Header) {
                        visibleHeaderColumns.push(cellOption.column as ColumnProps<T>);
                    }
                    dataColIndex++;
                    scrollModule?.virtualColumnInfo?.columns.push(visibleColumns?.[index as number]?.field === cellOption.column.field ?
                        visibleColumns?.[index as number] : cellOption.column);
                    if (rowType === RenderType.Filter && filterSettings?.type === 'FilterBar') {
                        elements.push(
                            <FilterBase
                                key={`${child.props.field || 'col'}-${rowObject?.rowIndex + '-' + cellOption.index + '-' + 1 + '-' + 'filter'}`}
                                {...columnProps}
                            />
                        );
                    } else {
                        if (contentCellEditField === child.props.field && cellEditForm !== null) {
                            // Render the memoized CellEditForm for the edited cell
                            elements.push(cellEditForm);
                        } else {
                            // Render normal cell
                            elements.push(
                                <ColumnBase<T>
                                    key={`${child.props.field || 'col'}-${rowObject?.rowIndex + '-' + cellOption.index + '-' + (rowType === RenderType.Header ? 'Header' : 'Content')}`}
                                    {...columnProps}
                                />
                            );
                        }
                    }
                    renderedColumnWidth += parseUnit(cellOption.column.width);
                    if (virtualSettings.enableColumn) {
                        cachedCellObjects.current.set(cellOption.column.field, {
                            ...columnProps, reactElement: elements[elements.length - 1]
                        });
                        if (renderedColumnWidth > parseUnit(isInitialLoad ? headerScrollRef?.clientWidth : (contentPanelRef?.clientWidth ??
                            headerScrollRef?.clientWidth))) {
                            buffer++;
                        }
                    }
                }
            }
            if (scrollModule && rowObject?.uid !== 'empty-row-uid') {
                const lastCellOption: ICell<IColumnBase<T>> = cellOptions[cellOptions.length - 1];
                if (isSpannedColumns) {
                    scrollModule.virtualColumnInfo.startIndex = from;
                    scrollModule.virtualColumnInfo.endIndex = from + (scrollModule.virtualColumnInfo.visibleHeaderColumns?.length ?? 0);
                } else {
                    scrollModule.virtualColumnInfo.endIndex = lastCellOption && to > lastCellOption.index + lastCellOption?.colSpan ?
                        lastCellOption.index + lastCellOption?.colSpan : to;
                }
            }
            // Update the ref with cell options
            cellsRef.current = cellOptions;
            // Store visible header columns for current header render
            if (rowType === RenderType.Header && visibleHeaderColumns?.length && scrollModule?.virtualColumnInfo) {
                scrollModule.virtualColumnInfo.visibleHeaderColumns = visibleHeaderColumns;
            }
            return elements;
        }, [children, rowObject, row?.spanCells, rowType, offsetX, enableAutoSpan, (editModule?.editSettings.mode === 'Popup' || editModule?.editSettings.mode === 'PopupTemplate')
             && rowObject?.editInlineRowFormRef, contentCellEditField, cellEditForm]);

        /**
         * Sanitize HTML content to prevent XSS attacks
         * Removes script tags and event handlers from innerHTML
         *
         * @param {string} html - Raw HTML string to sanitize
         * @returns {string} Sanitized HTML string
         */
        const sanitizeHtml: (html: string) => string = useCallback((html: string): string => {
            const div: HTMLDivElement = document.createElement('div');
            div.innerHTML = html;
            // Remove all script tags
            Array.from(div.querySelectorAll('script')).forEach((script: HTMLElement) => script.remove());
            // Remove all event handler attributes
            Array.from(div.querySelectorAll('*')).forEach((element: Element) => {
                Array.from(element.attributes).forEach((attr: Attr) => {
                    if (attr.name.startsWith('on')) {
                        element.removeAttribute(attr.name);
                    }
                });
            });
            return div.innerHTML;
        }, []);

        /**
         * Row template
         */
        const renderRowTemplate: string | ReactElement = useMemo((): string | ReactElement => {
            if (rowTemplate && rowType === RenderType.Content && rowObject?.data) {
                if (typeof rowTemplate === 'string') {
                    // Extract the first tag name from the string
                    // Match opening and closing tag
                    const match: RegExpMatchArray = rowTemplate.match(/^<\s*([a-zA-Z0-9-]+)[^>]*>([\s\S]*)<\/\s*\1\s*>$/);
                    const tagName: string = match ? match[1] : 'tr'; // fallback to tr
                    const innerHTML: string = match ? match[2] : rowTemplate; // content inside the tag
                    // Sanitize HTML to prevent XSS attacks
                    const sanitizedHtml: string = sanitizeHtml(innerHTML);

                    return createElement(tagName, {
                        ref: rowRef,
                        ...attr,
                        dangerouslySetInnerHTML: { __html: sanitizedHtml }
                    });
                } else if (isValidElement(rowTemplate)) {
                    return cloneElement(rowTemplate, { ref: rowRef, ...attr as T });
                } else {
                    return createElement(rowTemplate, { ref: rowRef, ...rowObject.data as T });
                }
            }
            return null;
        }, [rowTemplate, rowObject?.data, rowType, sanitizeHtml]);

        const customRowClass: string | undefined = useMemo(() => {
            if (rowType === RenderType.Content && rowObject?.uid !== 'empty-row-uid') {
                return !isNullOrUndefined(rowClass) ? (typeof rowClass === 'function' ?
                    rowClass({rowType: RowType.Content, data: rowObject.data, rowIndex: rowObject.rowIndex}) : rowClass) : undefined;
            }
            return undefined;
        }, [rowClass, inlineEditForm, rowObject]);
        const customNoRecordRowClass: string | undefined = useMemo(() => {
            if (isInitialBeforePaint.current) { return undefined; }
            if (rowType === RenderType.Content && !isInitialLoad && rowObject?.uid === 'empty-row-uid') {
                return !isNullOrUndefined(rowClass) ?
                    (typeof rowClass === 'function' ? rowClass({rowType: RowType.Content, rowIndex: 0}) : rowClass) : undefined;
            }
            return undefined;
        }, [rowClass, isInitialLoad, rowObject, isInitialBeforePaint.current]);
        const customAggregateRowClass: string | undefined = useMemo(() => {
            if (isInitialBeforePaint.current) { return undefined; }
            return rowType === RenderType.Summary && !isNullOrUndefined(rowClass) ? (typeof rowClass === 'function' ?
                rowClass({rowType: RowType.Aggregate, data: rowObject.data, rowIndex: rowObject.rowIndex}) : rowClass) : undefined;
        }, [rowClass, rowObject, isInitialBeforePaint.current]);
        return (
            <>
                {renderRowTemplate ? renderRowTemplate :
                    rowType === RenderType.Content && editModule?.editSettings?.allowEdit && editModule.editSettings.mode === 'Normal' && ((editModule?.isEdit &&
                        editModule?.editRowIndex >= 0 && editModule?.editRowIndex === row.rowIndex &&
                        !isNullOrUndefined(editModule?.originalData) && !commandEdit.current) ||
                        (commandEdit.current && commandEditRef.current[rowObject.uid]))
                        ? inlineEditForm
                        : (<tr
                            ref={rowRef}
                            {...attr}
                            className={attr.className +
                                ((customRowClass || customNoRecordRowClass || customAggregateRowClass)
                                    ? ' ' + (customRowClass || customNoRecordRowClass || customAggregateRowClass)
                                    : '')
                            }
                            {...setAriaSelected}
                        >
                            {processedChildren}
                        </tr>)
                }
            </>
        );
    }
)) as <T>(props: IRowBase<T> & RefAttributes<RowRef>) => ReactElement | null;

/**
 * Set display name for debugging purposes
 */
(RowBase as NamedExoticComponent<IRowBase<unknown> & RefAttributes<RowRef>>).displayName = 'RowBase';

/**
 * Export the RowBase component for use in other components
 *
 * @private
 */
export { RowBase };
