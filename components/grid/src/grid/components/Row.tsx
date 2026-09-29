import {
    forwardRef,
    useImperativeHandle,
    useRef,
    Children,
    useEffect,
    useLayoutEffect,
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
    cloneElement,
    ReactNode
} from 'react';
import { IRowBase, RowRef, ICell, IRow } from '../types/interfaces';
import { CellTypes, RenderType, RowType, CellSelectionType, GroupType, ColumnPinDirection, ColumnType } from '../types/enum';
import { ColumnProps, IColumnBase, CustomAttributes, PinDirectionInput } from '../types/column.interfaces';
import { AggregateColumnProps, AggregateRowRenderEvent } from '../types/aggregate.interfaces';
import { RowRenderEvent, ValueType } from '../types/interfaces';
import { useGridComputedProvider, useGridMutableProvider } from '../contexts/GridProviders';
import { ColumnBase } from './Column';
import { EditFormTemplate, InlineEditFormRef, CellEditFormRef, CellEditFormProps } from '../types/edit.interfaces';
import { IL10n } from '@syncfusion/react-base/src/l10n';
import { isNullOrUndefined } from '@syncfusion/react-base/src/util';
import { parseUnit, getCellSelectionBorderClasses, getWithoutSpecialColumns, resolvePinDirection,
    getLeftPinnedOffsets, getRightPinnedOffsets, getLeftPinnedBoundaryField, getRightPinnedBoundaryField } from '../utils/utils';
import { RowCellInfo } from '../types/cell-selection.interfaces';
import type { GroupedData } from '../../../grid';

// CSS class constants following enterprise naming convention
const CSS_CELL: string = 'sf-cell';
const CSS_DEFAULT_CURSOR: string = ' sf-defaultcursor';
const CSS_MOUSE_POINTER: string = ' sf-mousepointer';
const CSS_SORT_ICON: string = ' sf-sort-icon';
const CSS_CELL_HIDE: string = 'sf-display-none';
const CSS_LEFT_PIN_CELL: string = 'sf-left-pinned-cell';
const CSS_RIGHT_PIN_CELL: string = 'sf-right-pinned-cell';
const CSS_LEFT_MOST_PIN_CELL: string = 'sf-left-most-pinned-cell';
const CSS_RIGHT_MOST_PIN_CELL: string = 'sf-right-most-pinned-cell';

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
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            tableScrollerPadding,
            aggregateRow,
            pinBucket,
            ...attr
        } = props;
        const [rowObject, setRowObject] = useState<IRow<ColumnProps<T>>>(row || {});
        const currentRow: IRow<ColumnProps<T>> = row || rowObject;
        const { headerRowDepth, isInitialBeforePaint, editModule, uiColumns, isInitialLoad, totalVirtualColumnWidth, commandColumnModule,
            dataModule, offsetX, focusModule, virtualSettings, cellSelectionModule, leftPinnedColumns, rightPinnedColumns,
            filterModule, formulaModule, columnUidMap } = useGridMutableProvider<T>();
        const { onRowRender, onAggregateRowRender, serviceLocator, rowClass, filterSettings, stackedRowEntries,
            sortSettings, rowHeight, editSettings, columns, rowTemplate, selectionSettings, headerScrollRef, headerSectionRef, element,
            contentPanelRef, scrollModule, getVisibleColumns, stackedHeaderColumns, stackedFlattedColumns, isStackedHeader, id,
            getPrimaryKeyFieldNames, enableAutoSpan, isSpannedColumns, groupSettings,
            autoFillModule, getColumns, rowNumberSettings, dragAndDropSettings } = useGridComputedProvider<T>();
        const rowRef: RefObject<HTMLTableRowElement> = useRef<HTMLTableRowElement>(null);
        const cellsRef: RefObject<ICell<ColumnProps<T>>[]> = useRef<ICell<ColumnProps<T>>[]>([]);
        const localization: IL10n = serviceLocator?.getService<IL10n>('localization');
        const editInlineFormRef: RefObject<InlineEditFormRef<T>> = useRef<InlineEditFormRef<T>>(null);
        const editCellFormRef: RefObject<CellEditFormRef> = useRef<CellEditFormRef>(null);
        const [syncFormState, setSyncFormState] = useState(editInlineFormRef.current?.formState);
        const incomingData: RefObject<T | GroupedData<T>> = useRef(currentRow.data);
        useEffect(() => {
            if (incomingData.current !== currentRow.data) {
                incomingData.current = currentRow.data;
                // Primary-keyed rows survive filtering/recalculation. Refresh their
                // immutable data without discarding selection or remounting the row.
                rowObject.data = currentRow.data;
                rowObject.rowIndex = currentRow.rowIndex;
            }
        }, [currentRow.data, currentRow.rowIndex]);
        if (dataModule?.dataManager && 'result' in dataModule?.dataManager && rowObject?.data) {
            rowObject.data = currentRow.data;
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
            if (!editModule || (rowType === RenderType.Content &&
                (!editModule?.editSettings?.allowEdit ||
                 !(editModule?.isEdit && editModule?.editRowIndex >= 0 && editModule?.editRowIndex === row.rowIndex) ||
                 isNullOrUndefined(editModule?.originalData)) &&
                 !(editModule?.editSettings?.allowEdit && commandColumnModule?.commandEdit.current &&
                    commandColumnModule?.commandEditRef.current[rowObject.uid]))) {
                return null;
            }
            const { InlineEditForm } = editModule;
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
                    editData={commandColumnModule?.commandEditStateRef.current?.[rowObject?.uid]?.editData ?? editModule?.editData}
                    rowObject={rowObject}
                    validationErrors={(!virtualSettings.enableRow || !commandColumnModule?.commandEdit.current ?
                        editModule?.validationErrors :
                        commandColumnModule?.commandEditStateRef.current?.[rowObject?.uid]?.validationErrors) || {}}
                    editRowIndex={row?.rowIndex}
                    rowUid={row?.uid}
                    onFieldChange={(field: string, value: ValueType | Object | null) => {
                        if (editModule?.updateEditData) {
                            const editedColumn: ColumnProps<T> | undefined = (uiColumns.current ?? columns as ColumnProps<T>[])
                                .find((column: ColumnProps<T>) => column.field === field);
                            const updatedValue: ValueType | Object | null = editSettings?.mode === 'Cell' && formulaModule && editedColumn?.allowFormula &&
                                typeof value === 'string' ? formulaModule.toInternalFormula(value, rowObject.rowIndex) : value;
                            editModule?.updateEditData?.(field, updatedValue, rowObject);
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
            commandColumnModule && Object.keys(commandColumnModule?.commandEditRef?.current).length,
            editModule?.InlineEditForm
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
                    data: currentRow.data,
                    rowHeight: currentRow.height || rowHeight,
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

        useEffect(() => {
            if (rowType !== RenderType.Content || !rowObject?.data || !autoFillModule?.showFillHandle) {
                return;
            }
            const primaryKeyField: string | undefined = getColumns?.()?.find((column: ColumnProps<T>) => column.isPrimaryKey)?.field;
            const rowData: T = rowObject.data as T;
            const rowKey: unknown = primaryKeyField ? rowData[primaryKeyField as keyof T] : undefined;
            const selectedCells: RowCellInfo[] = cellSelectionModule?.getSelectedCellsData?.() ?? [];
            if (selectedCells.some((selectedCell: RowCellInfo) => String(selectedCell.rowKey) === String(rowKey))) {
                autoFillModule.showFillHandle();
            }
        }, [autoFillModule, cellSelectionModule, getColumns, rowObject?.data, rowType]);

        /**
         * Handle aggregate row data bound event for aggregate rows
         */
        const handleAggregateRowDataBound: () => void = useCallback(() => {
            if (rowType === RenderType.Summary && onAggregateRowRender && rowRef.current) {
                const rowArgs: AggregateRowRenderEvent<T> = {
                    row: rowRef.current,
                    data: currentRow.data,
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
            const focusUid: string | null = focusModule?.focusedCell.current?.element?.querySelector('[data-mappinguid]')?.getAttribute('data-mappinguid')
                ?? focusModule?.focusedCell.current?.element?.getAttribute('data-mappinguid');
            const currentStackedElement: HTMLTableCellElement = isStackedHeader && focusModule?.focusedCell.current?.isHeader ?
                focusModule?.focusedCell.current?.element.querySelector('.sf-filter-cell') ?
                    headerSectionRef?.querySelector('.sf-filter-row')?.querySelector(`[data-mappinguid="${focusUid}"]`)?.closest('th') :
                    headerSectionRef?.querySelector(`[data-mappinguid="${focusUid}"]`)?.closest('th') : null;
            if (!focusModule?.focusedCell.current?.isHeader && !focusModule?.focusedCell.current?.isAggregate &&
                attr['aria-rowindex'] === focusModule?.focusedCell.current?.virtualAriaRowIndex &&
                focusModule?.focusedCell.current?.colIndex !== -1 &&
                rowRef.current?.querySelector(`td[aria-colindex="${focusModule?.focusedCell.current?.virtualAriaColIndex}"]`) &&
                !focusModule?.focusedCell.current?.element?.querySelector('input[aria-expanded="true"]') &&
                !focusModule?.focusedCell.current?.element?.querySelector('.sf-cell .sf-skeleton') &&
                document.activeElement.id !== id + '_columnchooser' && !((editModule?.editSettings.mode === 'Popup' ||
                    editModule?.editSettings.mode === 'PopupTemplate') && rowObject?.editInlineRowFormRef) &&
                    !document.activeElement.closest('.sf-grid-edit-form')
                    || (isStackedHeader && focusModule?.focusedCell.current?.isHeader && focusUid &&
                        !element.contains(focusModule?.focusedCell.current?.element) && currentStackedElement)) {
                const virtualCell: HTMLTableCellElement = isStackedHeader && currentStackedElement ? currentStackedElement :
                    rowRef.current?.querySelector(`td[aria-colindex="${focusModule?.focusedCell.current?.virtualAriaColIndex}"]`);
                if (!focusModule?.focusedCell?.current.element?.classList?.contains('sf-focused') || (currentStackedElement && scrollModule.virtualColumnInfo.prevStackedFocusCell.isHiddenCellFocus)) {
                    focusModule?.addFocus?.({...focusModule?.focusedCell.current, element: virtualCell, elementToFocus: virtualCell});
                }
            }
            if (isStackedHeader && focusModule?.focusedCell.current?.isHeader && focusUid &&
                scrollModule.virtualColumnInfo.prevStackedFocusCell.isHiddenCellFocus) {
                scrollModule.virtualColumnInfo.prevStackedFocusCell.isHiddenCellFocus = false;
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
            if (rowType !== RenderType.Content || !editModule?.editCellIndex?.field) {
                return undefined;
            }

            const matchesRowUid: boolean = !!editModule?.editCellIndex?.rowUid && rowObject?.uid === editModule.editCellIndex.rowUid;
            const matchesPrimaryKey: boolean = editModule?.editCellIndex.primaryKeyValue ===
                rowObject.data?.[getPrimaryKeyFieldNames()?.[0]];

            if (matchesRowUid || (!editModule?.editCellIndex?.rowUid && matchesPrimaryKey)) {
                return editModule?.editCellIndex.field;
            }

            return undefined;
        }, [rowType, editModule?.editCellIndex?.field, editModule?.editCellIndex?.primaryKeyValue,
            editModule?.editCellIndex?.rowUid, rowObject?.data, rowObject?.uid, getPrimaryKeyFieldNames]);

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
                // Sync validation errors back to editModule?.validationErrors
                editModule?.updateValidationErrors?.(errors);
            };

            // Find the column being edited
            const visibleColumns: ColumnProps[] = getVisibleColumns?.();
            const editingColumn: ColumnProps<unknown> = visibleColumns.find((col: ColumnProps) => col.field === contentCellEditField);
            if (!editingColumn) {
                return null;
            }
            const { CellEditForm } = editModule;

            return (
                <CellEditForm<T>
                    ref={editCellFormRef}
                    key={`cell-edit-${contentCellEditField}-${rowObject?.rowIndex}`}
                    field={contentCellEditField}
                    value={editSettings?.mode === 'Cell' && formulaModule && editingColumn?.allowFormula ? formulaModule.toDisplayFormula(
                        String(editModule?.editData?.[contentCellEditField as keyof T] ??
                            (rowObject?.data as T)?.[contentCellEditField as keyof T] ?? ''), rowObject.rowIndex) :
                        editModule?.editData?.[contentCellEditField as keyof T] ??
                        (rowObject?.data as T)?.[contentCellEditField as keyof T]}
                    column={editingColumn as ColumnProps<T>}
                    rowIndex={rowObject?.rowIndex}
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
            editModule?.CellEditForm,
            rowObject,
            columns
        ]);

        /**
         * Cumulative `left` offset (px) for each left-pinned column field.
         * Column A gets 0, column B gets width(A), column C gets width(A)+width(B), etc.
         * Used to set `position:sticky; left: Xpx` on each cell so they freeze independently.
         */
        const leftPinnedOffsets: Map<string, number> = useMemo(() =>
            getLeftPinnedOffsets<T>(uiColumns as RefObject<ColumnProps<T>[]>, columns as ColumnProps<T>[]),
                                                               [leftPinnedColumns, uiColumns.current, columns]);
        /*
            const result: Map<string, number> = new Map<string, number>();
            const cols: ColumnProps<T>[] =
                [...((getVisibleColumns?.() ?? uiColumns.current ?? columns) as ColumnProps<T>[])]
                    .sort((a: ColumnProps<T>, b: ColumnProps<T>) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
            let acc: number = 0;
            for (const col of cols) {
                if (col.visible !== false && col.pinDirection === ColumnPinDirection.Left) {
                    result.set(col.field ?? col.headerText, acc);
                    acc += parseUnit(col.width);
                }
            }
            return result;
        */

        /**
         * Cumulative `right` offset (px) for each right-pinned column field.
         * Iterating right-to-left: last right-pinned col gets 0, the one before gets width(last), etc.
         */
        /*
            const result: Map<string, number> = new Map<string, number>();
            const cols: ColumnProps<T>[] =
                [...((getVisibleColumns?.() ?? uiColumns.current ?? columns) as ColumnProps<T>[])]
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
        */
        const rightPinnedOffsets: Map<string, number> = useMemo(() =>
            getRightPinnedOffsets<T>(uiColumns as RefObject<ColumnProps<T>[]>, columns as ColumnProps<T>[]),
                                                                [rightPinnedColumns, uiColumns.current, columns]);

        const leftPinnedBoundaryField: string | undefined = useMemo(() =>
            getLeftPinnedBoundaryField(leftPinnedOffsets), [leftPinnedOffsets]);
        /*
            let boundaryField: string | undefined;
            let boundaryOffset: number = -1;
            leftPinnedOffsets.forEach((offset: number, field: string) => {
                if (offset > boundaryOffset) {
                    boundaryOffset = offset;
                    boundaryField = field;
                }
            });
            return boundaryField;
        */

        const rightPinnedBoundaryField: string | undefined = useMemo(() =>
            getRightPinnedBoundaryField(rightPinnedOffsets), [rightPinnedOffsets]);
        /*
            let boundaryField: string | undefined;
            let boundaryOffset: number = -1;
            rightPinnedOffsets.forEach((offset: number, field: string) => {
                if (offset > boundaryOffset) {
                    boundaryOffset = offset;
                    boundaryField = field;
                }
            });
            return boundaryField;
        */

        const processCell: (renderedColumns: ReactElement<IColumnBase<T>>[], index: number,
            visibleColumns: ColumnProps[], dataColIndex: number, cellOptions: ICell<IColumnBase<T>>[],
            elements: JSX.Element[], visibleHeaderColumns?: ColumnProps[], count?: number,
            isFirstVisibleCell?: boolean, renderedColumnWidth?: number, buffer?: number, lastCellCount?: number) => {
            isFirstVisibleCell: boolean, lastCellCount?: number, buffer: number, renderedColumnWidth: number, dataColIndex: number
        } =
        useCallback((renderedColumns: ReactElement<IColumnBase<T>>[], index: number,
                     visibleColumns: ColumnProps[], dataColIndex: number, cellOptions: ICell<IColumnBase<T>>[],
                     elements: JSX.Element[], visibleHeaderColumns?: ColumnProps[], count?: number,
                     isFirstVisibleCell?: boolean, renderedColumnWidth?: number, buffer?: number, lastCellCount?: number) => {
            // const child: ReactElement<IColumnBase<T>> = childrenArray[index as number];
            const child: ReactElement<IColumnBase<T>> = isStackedHeader && rowType === RenderType.Header ?
                (row?.stackedHeaderCells?.[count as number]?.element as ReactElement<IColumnBase<T>>)
                : renderedColumns[index as number];
            if (!child) { return { isFirstVisibleCell, lastCellCount, buffer, renderedColumnWidth, dataColIndex }; }
            // Determine cell class based on row type and position
            const cellClassName: string = rowType === RenderType.Header
                ? `${CSS_CELL}${(groupSettings.enabled && child.props?.allowGroup) || child.props.allowSort && sortSettings?.enabled ? CSS_MOUSE_POINTER : CSS_DEFAULT_CURSOR}${rowHeight && !isNullOrUndefined(child.props.field) ? CSS_SORT_ICON : ''}`
                : CSS_CELL;
            // Hidden columns and stacked header levels make row positions differ
            // from visible-column positions. Resolve pinning by identity for both
            // header and body cells so the entire column freezes together.
            const columnPinSource: { pinDirection?: PinDirectionInput<T> } = (
                visibleColumns?.find((column: ColumnProps<T>) => column.uid === child.props.uid) ??
                uiColumns.current?.find((column: ColumnProps<T>) => column.uid === child.props.uid) ??
                child.props) as { pinDirection?: PinDirectionInput<T> };
            const colPinDirection: ColumnPinDirection =
                resolvePinDirection<T>(columnPinSource?.pinDirection, columnPinSource as ColumnProps<T>);
            const pinnedLeaves: (items: ColumnProps<T>[]) => ColumnProps<T>[] =
                (items: ColumnProps<T>[]): ColumnProps<T>[] => items.flatMap((item: ColumnProps<T>) =>
                    item.columns?.length ? pinnedLeaves(item.columns) : [item]);
            const groupLeaves: ColumnProps<T>[] = child.props.columns?.length ? pinnedLeaves(child.props.columns) : [];
            const leftPinField: string = child.props.field ?? groupLeaves[0]?.field ?? child.props.headerText;
            const rightPinField: string = child.props.field ?? groupLeaves[groupLeaves.length - 1]?.field ?? child.props.headerText;
            const columnField: string = child.props?.field ?? child.props?.headerText;
            const isLeftPinnedColumn: boolean = colPinDirection === ColumnPinDirection.Left || leftPinnedOffsets.has(columnField);
            const isRightPinnedColumn: boolean = colPinDirection === ColumnPinDirection.Right || rightPinnedOffsets.has(columnField);
            const pinnedClassName: string = isLeftPinnedColumn ? ' ' + CSS_LEFT_PIN_CELL :
                (isRightPinnedColumn ? ' ' + CSS_RIGHT_PIN_CELL : '');
            const pinnedEdgeClassName: string = isLeftPinnedColumn &&
                columnField === leftPinnedBoundaryField ? ' ' + CSS_LEFT_MOST_PIN_CELL :
                (isRightPinnedColumn && columnField === rightPinnedBoundaryField ?
                    ' ' + CSS_RIGHT_MOST_PIN_CELL : '');
            const cellType: CellTypes = rowType === RenderType.Header ? CellTypes.Header : rowType === RenderType.Filter ?
                CellTypes.Filter : rowType === RenderType.Summary ? CellTypes.Summary : CellTypes.Data;

            let colSpan: number = !child.props.field && child.props.headerText && (rowType === RenderType.Header &&
                (child.props.columns && child.props.columns.length) || (child.props.children &&
                    (child.props as { children: ReactElement<IColumnBase<T>>[] }).children.length)) ? child.props.columns?.length ||
            (child.props as { children: ReactElement<IColumnBase<T>>[] }).children.length : 1;
            let rowSpan: number = rowType !== RenderType.Header || (rowType === RenderType.Header &&
                ((child.props.columns && child.props.columns.length) || child.props.children)) ? 1 :
                headerRowDepth - currentRow.rowIndex;


            const { ...cellAttributes } = child.props.customAttributes || {};
            const isVisible: boolean = child.props.visible !== false;
            // Determine if this is the first visible cell in a spanning row
            const rowFirstCellClass: string = isFirstVisibleCell && isVisible && ((rowType === RenderType.Content && isSpannedColumns)
                || (rowType === RenderType.Header && isStackedHeader)) ? ' row-first-cell' : '';
            if (isFirstVisibleCell && isVisible) {
                isFirstVisibleCell = false;
            }
            // Determine if this is the last visible cell in a spanning row
            const lastStackedCell: ColumnProps<T> | undefined = stackedRowEntries?.[currentRow.rowIndex as number]?.[
                stackedRowEntries?.[currentRow.rowIndex as number]?.length - 1];
            const rowLastCellClass: string = (((rowType === RenderType.Content && isSpannedColumns &&
                visibleColumns?.[visibleColumns?.length - 1]?.uid === child?.props?.uid) ||
                ((rowType === RenderType.Header && isStackedHeader)
                && lastStackedCell?.uid === child?.props?.uid)) && isVisible) ? ' row-last-cell' : '';
            const spanInfo: ICell<ColumnProps<T>> = row?.spanCells?.[count as number] as ICell<ColumnProps<T>>;
            const shouldSkipCell: boolean = spanInfo?.visible === false;
            if (rowType === RenderType.Content && (isSpannedColumns || (groupSettings?.enabled && groupSettings?.columns?.length &&
                groupSettings?.type === GroupType.GroupRows && !rowNumberSettings?.enabled && !dragAndDropSettings?.enabled &&
                !commandColumnModule?.commandEdit?.current))) {
                colSpan = spanInfo?.colSpan ?? colSpan;
                rowSpan = spanInfo?.rowSpan ?? rowSpan;
                if (shouldSkipCell) {
                    return { isFirstVisibleCell, renderedColumnWidth, lastCellCount, buffer, dataColIndex };
                }
            }
            if (rowType === RenderType.Content && rowObject?.isCaptionRow && groupSettings?.type === GroupType.GroupRows &&
                child.props?.type !== ColumnType.RowNumber && child.props?.type !== ColumnType.RowDragAndDrop
                && !child.props?.getCommandItems) {
                colSpan = visibleColumns.length - (rowNumberSettings?.enabled ? 1 : 0) - (dragAndDropSettings?.enabled ? 1 : 0) -
                    (commandColumnModule?.commandEdit?.current ? 1 : 0) || 1;
            }
            if (isStackedHeader && rowType === RenderType.Header) {
                colSpan = currentRow.stackedHeaderCells[count as number].colSpan ?? colSpan;
                rowSpan = currentRow.stackedHeaderCells[count as number].rowSpan ?? rowSpan;
                if (currentRow.stackedHeaderCells[count as number].visible === false) {
                    lastCellCount = index;
                    renderedColumnWidth += parseUnit(renderedColumns[index as number]?.props?.width);
                    if (virtualSettings.enableColumn && renderedColumnWidth > parseUnit(isInitialLoad ?
                        headerScrollRef?.clientWidth : (contentPanelRef?.clientWidth ?? headerScrollRef?.clientWidth))) {
                        buffer++;
                    }
                    return { isFirstVisibleCell, renderedColumnWidth, buffer, lastCellCount, dataColIndex };
                }
            }

            // Generate cell key using data-based format: "primaryKey:fieldName"
            // Persists across paging, sorting, filtering, and column visibility changes
            const cellKey: string = cellSelectionModule?.getCellKey?.(row?.rowIndex, dataColIndex, row?.data) ?? `${row?.rowIndex}:${index}`;

            // Determine if the cell is selected using the persistent cell key
            const cellIsSelected: boolean = rowType === RenderType.Content && selectionSettings?.type === 'Cell' &&
                cellSelectionModule?.selectedCells?.has(cellKey);
            const primaryKeyField: string | undefined = getPrimaryKeyFieldNames?.()?.[0];
            const rowKey: string | number | undefined = primaryKeyField ?
                // eslint-disable-next-line security/detect-object-injection
                (rowObject?.data as Record<string, string | number>)?.[primaryKeyField] : undefined;
            const isBatchCellDirty: boolean = rowType === RenderType.Content && !!child.props.field && rowKey !== undefined &&
                editModule?.isBatchCellDirty?.(rowKey, child.props.field) === true;
            const isNormalBatchEdit: boolean = rowType === RenderType.Content && editModule?.editSettings?.mode === 'Normal' &&
                editModule?.editSettings?.allowBatchSave === true;
            const isBatchRowDirty: boolean = isNormalBatchEdit && rowKey !== undefined &&
                editModule?.isBatchRowDirty?.(rowKey) === true;
            const dirtyCellClass: string = isNormalBatchEdit
                ? (isBatchRowDirty && !isBatchCellDirty ? ' sf-grid-cell-batch' : '')
                : (isBatchCellDirty ? ' sf-grid-cell-batch' : '');
            const dirtyRowClass: string = isNormalBatchEdit && isBatchCellDirty ? ' sf-grid-row-batch' : '';

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
                'data-mappinguid': child.props.uid,
                ...(child.props?.template && child.props?.templateSettings?.ariaLabel?.length > 0 ? { 'aria-label': child.props?.templateSettings?.ariaLabel } : {}),
                className: `${cellClassName}${!isVisible ? ` ${CSS_CELL_HIDE}` : ''}${dirtyCellClass}${dirtyRowClass}${shouldAddActiveClass ? ' sf-active' : ''}${selectionClass}${borderClasses}${rowFirstCellClass}${rowLastCellClass}${pinnedClassName}${pinnedEdgeClassName}`,
                title: rowType === RenderType.Filter ? (child.props.headerText || child.props.field) + localization?.getConstant('filterBarTooltip') : undefined,
                role: rowType === RenderType.Header || rowType === RenderType.Filter ? 'columnheader' : 'gridcell',
                tabIndex: -1,
                'aria-colindex': index ? index + 1 : 1, // accessibility
                ...(isVisible ? {'data-colindex': dataColIndex ? dataColIndex + 1 : 1} : {}), // only rendered visible column based index
                ...(colSpan > 1 ? { colSpan: colSpan, 'aria-colspan': colSpan } : {}),
                ...(rowSpan > 1 ? { rowSpan: rowSpan, 'aria-rowspan': rowSpan } : {}),
                ...(selectionSettings.enabled && rowType === RenderType.Content ? { 'aria-selected': rowObject.isSelected || cellIsSelected } : {}),
                ...(isLeftPinnedColumn || isRightPinnedColumn ? { 'data-pin-field': leftPinField ?? rightPinField } : {}),
                ...(isLeftPinnedColumn ? {
                    style: {
                        left: (leftPinnedOffsets?.get(leftPinField) ?? 0) - offsetX + 'px', ...(rowType === RenderType.Summary ? { position: 'sticky' } : {})
                    }
                } : {}),
                ...(isRightPinnedColumn ? {
                    style: {
                        right: (rightPinnedOffsets?.get(rightPinField) ?? 0) + (isNullOrUndefined(offsetX) ? 0 : offsetX - scrollModule?.leftPinnedWidth) + 'px',
                        ...(rowType === RenderType.Summary ? { position: 'sticky' } : {})
                    }
                } : {})
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
                    // ...child.props as IColumnBase<T>,
                    customAttributes: customAttributesWithSpan,
                    index,
                    formatFn: visibleColumns?.[index as number]?.formatFn ?? uiColumns.current?.[index as number]?.formatFn,
                    ...child.props as IColumnBase<T>,
                    ...(child.props?.pinDirection === ColumnPinDirection.None || getWithoutSpecialColumns([child.props])?.length ? {
                        type: row?.uid === 'empty-row-uid' ? 'string' : (visibleColumns.length ? (rowObject?.isDetailRow ?
                            getWithoutSpecialColumns(visibleColumns) : visibleColumns)?.[index as number]?.type :
                            (uiColumns.current ? (rowObject?.isDetailRow ?
                                getWithoutSpecialColumns(uiColumns.current) : uiColumns.current)?.[index as number]?.type :
                                (rowObject?.isDetailRow ? getWithoutSpecialColumns(columns) : columns)?.[index as number]?.type))} : {})
                },
                cellType,
                colSpan: colSpan,
                rowSpan: rowSpan,
                index,
                colIndex: index,
                className: row?.uid === 'empty-row-uid' ? '' : `${cellClassName}${!isVisible ? ` ${CSS_CELL_HIDE}` : ''}${dirtyCellClass}${dirtyRowClass}${pinnedClassName}`
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
                cell: cellOption,
                containerPinBucket: pinBucket
            };

            if (isVisible) {
                // Store cell options
                cellOptions.push(cellOption);
                if (rowType === RenderType.Header) {
                    visibleHeaderColumns.push(cellOption.column as ColumnProps<T>);
                }
                lastCellCount = index;
                dataColIndex++;
                scrollModule?.virtualColumnInfo?.columns.push(visibleColumns?.[index as number]?.field === cellOption.column.field ?
                    visibleColumns?.[index as number] : cellOption.column);
                if (filterModule && rowType === RenderType.Filter && filterSettings?.type === 'FilterBar') {
                    const { FilterBase } = filterModule;
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
                                key={`${child.props.field || 'col'}-${rowObject?.rowIndex + '-' + cellOption.index + '-' +
                                        (rowType === RenderType.Header ? 'Header' : 'Content')}`}
                                {...columnProps}
                            />
                        );
                    }
                }
                renderedColumnWidth += isStackedHeader ? parseUnit(renderedColumns[index as number]?.props?.width) :
                    parseUnit(cellOption.column.width);
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
            return { isFirstVisibleCell, lastCellCount, buffer, renderedColumnWidth, dataColIndex };
        }, [row, rowObject, rowType, offsetX, uiColumns.current, rowHeight, groupSettings, sortSettings, headerRowDepth,
            isSpannedColumns, stackedRowEntries, cellSelectionModule, selectionSettings, localization, filterSettings,
            contentCellEditField, cellEditForm, isInitialLoad, headerScrollRef, contentPanelRef, virtualSettings,
            aggregateRow, columns, leftPinnedColumns?.size, rowNumberSettings?.enabled, getPrimaryKeyFieldNames,
            editModule?.editSettings?.mode, editModule?.editSettings?.allowBatchSave, editModule?.isBatchRowDirty,
            editModule?.isBatchCellDirty, leftPinnedOffsets, rightPinnedOffsets, leftPinnedBoundaryField, rightPinnedBoundaryField,
            columnUidMap]);

        const leftPinnedChildrenArray: ReactElement<IColumnBase<T>>[] = useMemo(() => {
            const pinnedColumns: ReactNode[] = Array.from(
                leftPinnedColumns?.values() ?? [],
                (item: { Column: ReactNode; Col: ReactNode }): ReactNode => item.Column
            );
            return Children.toArray(pinnedColumns) as ReactElement<IColumnBase<T>>[];
        }, [leftPinnedColumns?.size]);
        const rightPinnedChildrenArray: ReactElement<IColumnBase<T>>[] = useMemo(() => {
            const pinnedColumns: ReactNode[] = Array.from(
                rightPinnedColumns?.values() ?? [],
                (item: { Column: ReactNode; Col: ReactNode }): ReactNode => item.Column
            );
            return Children.toArray(pinnedColumns) as ReactElement<IColumnBase<T>>[];
        }, [rightPinnedColumns?.size]);
        const processedLeftPinnedColumns: { isFirstVisibleCell: boolean, lastCellCount?: number, buffer: number,
            renderedColumnWidth: number, elements: JSX.Element[]
        } = useMemo(() => {
            const cellOptions: ICell<IColumnBase<T>>[] = [];
            const elements: JSX.Element[] = [];
            const visibleColumns: ColumnProps[] = getVisibleColumns?.();
            const visibleHeaderColumns: ColumnProps[] = [];
            // Loop through every left-pinned column (not just index 0) so that
            // multi-column left pinning works correctly.
            let pinResult: {
                isFirstVisibleCell: boolean, lastCellCount?: number, buffer: number,
                renderedColumnWidth: number, dataColIndex: number
            } = { isFirstVisibleCell: true, lastCellCount: 0, buffer: 0, renderedColumnWidth: 0, dataColIndex: 0 };
            for (let i: number = 0; i < leftPinnedChildrenArray.length; i++) {
                const processed: {
                    isFirstVisibleCell: boolean, lastCellCount?: number, buffer: number,
                    renderedColumnWidth: number, dataColIndex: number
                } = processCell(leftPinnedChildrenArray, i, visibleColumns, pinResult.dataColIndex, cellOptions, elements,
                                visibleHeaderColumns);
                pinResult = { ...pinResult, ...processed };
            }
            return { ...pinResult, elements };
        }, [leftPinnedColumns?.size, offsetX, enableAutoSpan, stackedHeaderColumns, isStackedHeader, rowType, rowObject, row?.spanCells,
            contentCellEditField, cellEditForm, headerRowDepth]);

        /**
         * Process children to create column elements with proper props
         */
        const processedChildren: JSX.Element[] = useMemo(() => {
            const childrenArray: ReactElement<IColumnBase<T>>[] = Children.toArray(children) as ReactElement<IColumnBase<T>>[];
            const cellOptions: ICell<IColumnBase<T>>[] = [];
            if (scrollModule?.virtualColumnInfo) {
                scrollModule.virtualColumnInfo.columns = [];
            }

            const visibleColumns: ColumnProps[] = getVisibleColumns?.();
            const visibleHeaderColumns: ColumnProps[] = [];
            const leftPinnedFields: Set<string> = new Set<string>(Array.from(leftPinnedColumns?.keys() ?? []));
            const renderedColumns: ReactElement<IColumnBase<T>>[] = isStackedHeader && (rowType === RenderType.Header ||
                rowType === RenderType.Filter) ? (stackedFlattedColumns as ReactElement<IColumnBase<T>>[]) : childrenArray;
            const from: number = scrollModule?.virtualColumnInfo.startIndex ?? 0;
            const to: number = renderedColumns.length;
            // const to: number = rowType === RenderType.Header && isStackedHeader ? lastLevelColumns.length : columnsToRender.length;
            let isFirstVisibleCell: boolean = true; // Track if this is the first visible cell in the row
            let lastCellCount: number = 0; // Track the index of the cell in the row, accounting for skipped cells: number = 0; // Track the index of the cell in the row, accounting for skipped cells

            let buffer: number = 0;
            let renderedColumnWidth: number = 0;
            // const elements: JSX.Element[] = from > 0 && leftPinnedColumns?.size ? processedLeftPinnedColumns?.elements : [];
            // if (from > 0 && leftPinnedColumns?.size) {
            //     buffer = processedLeftPinnedColumns.buffer ?? 0;
            //     renderedColumnWidth = processedLeftPinnedColumns.renderedColumnWidth ?? 0;
            //     lastCellCount = processedLeftPinnedColumns.lastCellCount ?? 0;
            //     isFirstVisibleCell = processedLeftPinnedColumns.isFirstVisibleCell ?? true;
            // }
            const elements: JSX.Element[] = [];
            // Process the main visible columns
            for (let index: number = from, count: number = 0, dataColIndex: number = 0;
                index < to && buffer <= (from !== 0 && index !== (to - 1) ? virtualSettings.columnBuffer * 2 :
                    virtualSettings.columnBuffer); index++, count++) {
                const virtualColumn: ReactElement<IColumnBase<T>> = renderedColumns[index as number];
                const virtualField: string = (virtualColumn?.props?.field ?? virtualColumn?.props?.headerText) as string;
                const isLeftPinnedVirtualColumn: boolean = from > 0 && leftPinnedFields.has(virtualField);
                const elementCountBefore: number = elements.length;
                const cellOptionCountBefore: number = cellOptions.length;
                const visibleHeaderColumnCountBefore: number = visibleHeaderColumns.length;
                const processedCell: {
                    isFirstVisibleCell: boolean, lastCellCount?: number, buffer: number, renderedColumnWidth: number, dataColIndex: number
                } = processCell(renderedColumns, index, visibleColumns, dataColIndex, cellOptions, elements,
                                visibleHeaderColumns, count, isFirstVisibleCell, renderedColumnWidth, buffer, lastCellCount);
                if (isLeftPinnedVirtualColumn) {
                    elements.splice(elementCountBefore);
                    cellOptions.splice(cellOptionCountBefore);
                    visibleHeaderColumns.splice(visibleHeaderColumnCountBefore);
                }
                isFirstVisibleCell = processedCell.isFirstVisibleCell;
                lastCellCount = processedCell.lastCellCount ?? lastCellCount;
                buffer = processedCell.buffer;
                renderedColumnWidth = processedCell.renderedColumnWidth;
                dataColIndex = processedCell.dataColIndex;
            }

            if (scrollModule && rowObject?.uid !== 'empty-row-uid' && cellOptions?.[cellOptions.length - 1]?.column?.pinDirection ===
                ColumnPinDirection.None) {
                const lastCellOption: ICell<IColumnBase<T>> = cellOptions[cellOptions.length - 1];
                if (isSpannedColumns) {
                    scrollModule.virtualColumnInfo.startIndex = from;
                    scrollModule.virtualColumnInfo.endIndex = from + (scrollModule.virtualColumnInfo.visibleHeaderColumns?.length ?? 0);
                } else if (isStackedHeader) {
                    scrollModule.virtualColumnInfo.startIndex = from;
                    scrollModule.virtualColumnInfo.endIndex = (from + lastCellCount + lastCellOption?.colSpan) < to ?
                        from + lastCellCount + lastCellOption?.colSpan : to;
                } else {
                    scrollModule.virtualColumnInfo.endIndex = lastCellOption && to > lastCellOption.index + lastCellOption?.colSpan ?
                        lastCellOption.index + lastCellOption?.colSpan : to;
                }
            }
            if (from > 0 && leftPinnedColumns?.size) {
                elements.unshift(...processedLeftPinnedColumns?.elements);
            }
            if (rightPinnedColumns?.size && !(rowType === RenderType.Content && rowObject?.isCaptionRow && groupSettings?.type ===
                GroupType.GroupRows)) {
                // Build a set of fields already rendered so we skip duplicates.
                const renderedFieldSet: Set<string> = new Set<string>(
                    cellOptions.map((co: ICell<IColumnBase<T>>) => co.column?.field ??
                        co.column?.headerText).filter(Boolean)
                );
                for (let i: number = 0; i < rightPinnedChildrenArray.length; i++) {
                    const rightField: string = (rightPinnedChildrenArray[i as number].props as ColumnProps<T>)?.field ??
                        (rightPinnedChildrenArray[i as number].props as ColumnProps<T>)?.headerText;
                    if (!renderedFieldSet.has(rightField)) {
                        const proccessedPinnedCells: {
                            isFirstVisibleCell: boolean, lastCellCount?: number,
                            buffer: number, renderedColumnWidth: number, dataColIndex: number
                        } = processCell(rightPinnedChildrenArray, i, visibleColumns, 0, cellOptions, elements, visibleHeaderColumns);
                        buffer = proccessedPinnedCells.buffer ?? buffer;
                        renderedColumnWidth = proccessedPinnedCells.renderedColumnWidth ?? renderedColumnWidth;
                        lastCellCount = proccessedPinnedCells.lastCellCount ?? lastCellCount;
                        isFirstVisibleCell = proccessedPinnedCells.isFirstVisibleCell ?? isFirstVisibleCell;
                    }
                }
            }
            // Update the ref with cell options
            cellsRef.current = cellOptions;
            // Store visible header columns for current header render
            if (rowType === RenderType.Header && visibleHeaderColumns?.length && scrollModule?.virtualColumnInfo) {
                scrollModule.virtualColumnInfo.visibleHeaderColumns = isStackedHeader ?
                    visibleColumns.slice(scrollModule.virtualColumnInfo.startIndex, scrollModule.virtualColumnInfo.endIndex)
                    : visibleHeaderColumns;
            }
            if (!isStackedHeader) {
                return elements.sort((a: JSX.Element, b: JSX.Element) => {
                    const aColumn: ColumnProps<T> = ((a.props as IColumnBase<T>)?.cell?.column
                        ?? (a.props as CellEditFormProps<T>)?.column) as ColumnProps<T>;
                    const bColumn: ColumnProps<T> = ((b.props as IColumnBase<T>)?.cell?.column
                        ?? (b.props as CellEditFormProps<T>)?.column) as ColumnProps<T>;
                    let aIndex: number;
                    let bIndex: number;
                    if (leftPinnedColumns?.size || rightPinnedColumns?.size) {
                        // Fix for colgroup col width and content table td order mismatch issue, but which fails test case - shows UnpinColumn for a pinned column and removes the pin via context menu
                        aIndex = columnUidMap?.get(aColumn?.uid)?.orderIndex
                            ?? aColumn?.orderIndex ?? Number.MAX_SAFE_INTEGER;
                        bIndex = columnUidMap?.get(bColumn?.uid)?.orderIndex
                            ?? bColumn?.orderIndex ?? Number.MAX_SAFE_INTEGER;
                    } else {
                        aIndex = aColumn?.orderIndex
                            ?? columnUidMap?.get(aColumn?.uid)?.orderIndex ?? Number.MAX_SAFE_INTEGER;
                        bIndex = bColumn?.orderIndex
                            ?? columnUidMap?.get(bColumn?.uid)?.orderIndex ?? Number.MAX_SAFE_INTEGER;
                    }
                    return aIndex - bIndex;
                });
            }
            return elements;
        }, [children, rowObject, row?.spanCells, rowType, offsetX, enableAutoSpan, stackedHeaderColumns, isStackedHeader, (editModule?.editSettings.mode === 'Popup' || editModule?.editSettings.mode === 'PopupTemplate')
            && rowObject?.editInlineRowFormRef, contentCellEditField, cellEditForm, headerRowDepth, processCell, filterModule?.FilterBase,
        processedLeftPinnedColumns, leftPinnedColumns, rightPinnedColumns, columnUidMap]);

        useLayoutEffect(() => {
            const rowElement: HTMLTableRowElement | null = rowRef.current;
            const gridElement: HTMLElement | null = rowElement?.closest('.sf-grid') as HTMLElement | null;
            if (!rowElement || !gridElement) { return undefined; }
            const syncPinnedCellOffsets: () => void = (): void => {
                const virtualTable: HTMLElement | null = rowElement.closest('.sf-virtual-table') as HTMLElement | null;
                const transform: string = virtualTable ? getComputedStyle(virtualTable).transform ?? '' : '';
                const matrixValues: string[] = transform.match(/matrix3d\(([^)]+)\)/)?.[1]?.split(',') ??
                    transform.match(/matrix\(([^)]+)\)/)?.[1]?.split(',') ?? [];
                const virtualOffset: number = matrixValues.length === 16 ? Number(matrixValues[12]) :
                    matrixValues.length === 6 ? Number(matrixValues[4]) : 0;
                rowElement.querySelectorAll<HTMLElement>('[data-pin-field]').forEach((cell: HTMLElement) => {
                    const field: string | null = cell.getAttribute('data-pin-field');
                    if (!field) { return; }
                    if (leftPinnedOffsets.has(field)) {
                        cell.style.left = `${(leftPinnedOffsets.get(field) ?? 0) - virtualOffset}px`;
                    } else if (rightPinnedOffsets.has(field)) {
                        cell.style.right = `${(rightPinnedOffsets.get(field) ?? 0) + virtualOffset}px`;
                    }
                });
            };
            syncPinnedCellOffsets();
            gridElement.addEventListener('scroll', syncPinnedCellOffsets, true);
            gridElement.addEventListener('virtualColumnOffsetChange', syncPinnedCellOffsets);
            return (): void => {
                gridElement.removeEventListener('scroll', syncPinnedCellOffsets, true);
                gridElement.removeEventListener('virtualColumnOffsetChange', syncPinnedCellOffsets);
            };
        }, [contentPanelRef, leftPinnedOffsets, rightPinnedOffsets, processedLeftPinnedColumns]);

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
                    rowType === RenderType.Content && editModule?.editSettings?.allowEdit && editModule?.editSettings.mode === 'Normal' && ((editModule?.isEdit &&
                        editModule?.editRowIndex >= 0 && editModule?.editRowIndex === currentRow.rowIndex &&
                        !isNullOrUndefined(editModule?.originalData) && !commandColumnModule?.commandEdit.current) ||
                        (commandColumnModule?.commandEdit.current && commandColumnModule?.commandEditRef.current[rowObject.uid]))
                        ? inlineEditForm
                        : (<tr
                            ref={rowRef}
                            {...attr}
                            className={attr.className +
                                ((customRowClass || customNoRecordRowClass || customAggregateRowClass)
                                    ? ' ' + (customRowClass || customNoRecordRowClass || customAggregateRowClass)
                                    : '') +
                                (rowObject?.isPinned ? ' sf-pinned-row' : '') +
                                (pinBucket === 'top' ? ' sf-pinned-row-top' : pinBucket === 'bottom' ? ' sf-pinned-row-bottom' : '')
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
