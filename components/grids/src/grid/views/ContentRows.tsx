import {
    forwardRef,
    useImperativeHandle,
    useRef,
    RefAttributes,
    ForwardRefExoticComponent,
    ReactElement,
    useMemo,
    useCallback,
    memo,
    isValidElement,
    Children,
    JSX,
    MemoExoticComponent,
    ReactNode,
    RefObject,
    useEffect,
    SetStateAction,
    Dispatch
} from 'react';
import {
    ContentRowsRef,
    ICell,
    IContentRowsBase,
    IRow,
    RowRef,
    CellType, RenderType
} from '../types';
import { ColumnProps, IColumnBase } from '../types/column.interfaces';
import { InlineEditFormRef } from '../types/edit.interfaces';
import { useGridComputedProvider, useGridMutableProvider } from '../contexts';
import { ColumnBase, RowBase } from '../components';
import { IL10n, isNullOrUndefined } from '@syncfusion/react-base';
import { getUid } from '../utils';
import { InlineEditForm } from './index';
import { ColumnsChildren, ValueType } from '../types/interfaces';
const CSS_EMPTY_ROW: string = 'sf-emptyrow';
const CSS_DATA_ROW: string = 'sf-row';
const CSS_ALT_ROW: string = 'sf-altrow';

/**
 * RenderEmptyRow component displays when no data is available
 *
 * @component
 * @private
 * @param {Partial<IContentRowsBase>} props - Component properties
 * @returns {JSX.Element} The rendered empty row component
 */
const RenderEmptyRow: MemoExoticComponent<() => JSX.Element> =
    memo(() => {
        const { serviceLocator, emptyRecordTemplate } = useGridComputedProvider();
        const localization: IL10n = serviceLocator?.getService<IL10n>('localization');
        const { columnsDirective } = useGridMutableProvider();

        /**
         * Calculate the number of columns to span the empty message
         */
        const columnsLength: number = useMemo(() => {
            const children: ReactNode = (columnsDirective.props as ColumnsChildren).children;
            return Children.count(children);
        }, [columnsDirective]);

        const rowRef: RefObject<RowRef> = useRef<RowRef>(null);

        /**
         * Render the empty row template based on configuration
         */
        const renderEmptyTemplate: string | (() => ReactElement | string) | ReactElement = useMemo(() => {
            if (isNullOrUndefined(emptyRecordTemplate)) {
                return localization?.getConstant('noRecordsMessage');
            } else if (typeof emptyRecordTemplate === 'string' || isValidElement(emptyRecordTemplate)) {
                return emptyRecordTemplate;
            } else {
                return emptyRecordTemplate();
            }
        }, [emptyRecordTemplate, localization]);

        return (
            <>
                {useMemo(() => (
                    <RowBase
                        ref={rowRef}
                        key="empty-row"
                        row={{ index: 0, uid: 'empty-row-uid' }}
                        rowType={RenderType.Content}
                        role="row"
                        className={CSS_EMPTY_ROW}
                    >
                        <ColumnBase
                            key="empty-cell"
                            index={0}
                            uid='empty-cell-uid'
                            customAttributes={{
                                style: { left: '0px' },
                                colSpan: columnsLength,
                                tabIndex: 0 // Make the empty cell focusable
                            }}
                            template={renderEmptyTemplate}
                        />
                    </RowBase>
                ), [columnsLength, renderEmptyTemplate])}
            </>
        );
    });

/**
 * Set display name for debugging purposes
 */
RenderEmptyRow.displayName = 'RenderEmptyRow';

/**
 * ContentRowsBase component renders the data rows within the table body section
 *
 * @component
 * @private
 * @param {Partial<IContentRowsBase>} props - Component properties
 * @param {RefObject<ContentRowsRef>} ref - Forwarded ref to expose internal elements and methods
 * @returns {JSX.Element} The rendered tbody element with data rows
 */
const ContentRowsBase: ForwardRefExoticComponent<Partial<IContentRowsBase> & RefAttributes<ContentRowsRef>> =
    memo(forwardRef<ContentRowsRef, Partial<IContentRowsBase>>(
        (_props: Partial<IContentRowsBase>, ref: RefObject<ContentRowsRef>) => {
            const { columnsDirective, currentViewData, editModule, uiColumns } = useGridMutableProvider();
            const { rowHeight, enableAltRow, columns, rowTemplate } = useGridComputedProvider();

            // Refs for DOM elements and child components
            const contentSectionRef: RefObject<HTMLTableSectionElement> = useRef<HTMLTableSectionElement>(null);
            const rowsObjectRef: RefObject<IRow<ColumnProps>[]> = useRef<IRow<ColumnProps>[]>([]);
            const rowElementRefs: RefObject<HTMLTableRowElement[] | HTMLCollectionOf<HTMLTableRowElement>> =
                useRef<HTMLTableRowElement[] | HTMLCollectionOf<HTMLTableRowElement>>([]);
            const addInlineFormRef: RefObject<InlineEditFormRef> = useRef<InlineEditFormRef>(null);
            const editInlineFormRef: RefObject<InlineEditFormRef> = useRef<InlineEditFormRef>(null);

            /**
             * Returns the collection of content row elements
             *
             * @returns {HTMLCollectionOf<HTMLTableRowElement> | undefined} Collection of row elements
             */
            const getRows: () => HTMLCollectionOf<HTMLTableRowElement> | undefined = useCallback(() => {
                return rowElementRefs.current as HTMLCollectionOf<HTMLTableRowElement>;
            }, [contentSectionRef.current?.children]);

            /**
             * Returns the row options objects with DOM element references
             *
             * @returns {IRow<ColumnProps>[]} Array of row options objects with element references
             */
            const getRowsObject: () => IRow<ColumnProps>[] = useCallback(() => rowsObjectRef.current, [rowsObjectRef.current]);

            /**
             * Gets a row by index.
             *
             * @param  {number} index - Specifies the row index.
             * @returns {HTMLTableRowElement} returns the element
             */
            const getRowByIndex: (index: number) => HTMLTableRowElement = useCallback((index: number) =>  {
                return !isNullOrUndefined(index) ? getRows()[parseInt(index.toString(), 10)] : undefined;
            }, []);

            /**
             * @param {string} uid - Defines the uid
             * @returns {IRow<ColumnProps>} Returns the row object
             * @private
             */
            const getRowObjectFromUID: (uid: string) => IRow<ColumnProps> = useCallback((uid: string) => {
                const rows: IRow<ColumnProps>[] = getRowsObject() as IRow<ColumnProps>[];
                if (rows) {
                    for (const row of rows) {
                        if (row.uid === uid) {
                            return row;
                        }
                    }
                }
                return null;
            }, []);

            /**
             * Expose internal elements and methods through the forwarded ref
             * Only define properties specific to ContentRows
             */
            useImperativeHandle(ref, () => ({
                contentSectionRef: contentSectionRef.current,
                getRows,
                getRowsObject,
                getRowByIndex,
                getRowObjectFromUID,
                getCurrentViewRecords: () => currentViewData,
                addInlineRowFormRef: addInlineFormRef,
                editInlineRowFormRef: editInlineFormRef
            }), [getRows, getRowsObject, getRowByIndex, getRowObjectFromUID,
                currentViewData, addInlineFormRef.current, editInlineFormRef.current]);

            /**
             * Memoized empty row component to display when no data is available
             */
            const emptyRowComponent: JSX.Element | null = useMemo(() => {
                if (!columnsDirective || !currentViewData || currentViewData.length === 0) {
                    return <RenderEmptyRow />;
                }
                return null;
            }, [columnsDirective, currentViewData]);

            /**
             * Callback to store row element references directly in the row object
             *
             * @param {number} index - Row index
             * @param {HTMLTableRowElement} element - Row DOM element
             */
            const storeRowRef: (index: number, element: HTMLTableRowElement, cellRef: ICell<ColumnProps>[],
                setRowObject: Dispatch<SetStateAction<IRow<ColumnProps>>>) => void =
                useCallback((index: number, element: HTMLTableRowElement, cellRef: ICell<ColumnProps>[],
                             setRowObject: Dispatch<SetStateAction<IRow<ColumnProps>>>) => {
                    // Directly update the element reference in the row object
                    rowsObjectRef.current[index as number].element = element;
                    rowElementRefs.current[index as number] = element;
                    rowsObjectRef.current[index as number].cells = cellRef;
                    rowsObjectRef.current[index as number].setRowObject = setRowObject;
                }, []);


            const inlineAddForm: JSX.Element = useMemo(() => {
                const options: IRow<ColumnProps> = {
                    uid: getUid('grid-add-row'),
                    data: editModule?.originalData,
                    index: editModule?.editSettings?.newRowPosition === 'Top' ? 0 : currentViewData?.length, // Critical: Use original data index for proper tracking
                    isDataRow: false
                };
                // Enhanced check for showAddNewRow functionality
                // This ensures add form is properly visible in all scenarios
                const showAddForm: boolean = editModule?.editSettings?.allowAdd &&
                    (editModule?.editSettings?.showAddNewRow ||
                    (!options.data && editModule?.isEdit));

                return showAddForm ? (
                    <InlineEditForm
                        ref={addInlineFormRef}
                        key={`add-edit-${options.uid}`}
                        stableKey={`add-edit-${options.uid}-${editModule?.editRowIndex}`}
                        isAddOperation={true}
                        columns={uiColumns ?? columns}
                        editData={editModule?.editData || {}}
                        validationErrors={editModule?.validationErrors || {}}
                        editRowIndex={options.index}
                        rowUid={options.uid}
                        // Properly handle disabled state for showAddNewRow inputs
                        // This ensures inputs are disabled during data row editing and re-enabled after
                        disabled={editModule?.isShowAddNewRowDisabled}
                        onFieldChange={(field: string, value: ValueType | null) => {
                            if (editModule?.updateEditData) {
                                editModule?.updateEditData?.(field, value);
                            }
                        }}
                        onSave={() => editModule?.saveChanges()}
                        onCancel={editModule?.cancelChanges}
                        template={editModule?.editSettings?.template}
                    />
                ) : <></>;
            }, [
                columnsDirective, currentViewData?.length, rowHeight,
                editModule?.isEdit,
                editModule?.editRowIndex,
                editModule?.isShowAddNewRowActive,
                editModule?.isShowAddNewRowDisabled,
                editModule?.showAddNewRowData,
                editModule?.editSettings?.newRowPosition,
                editModule?.editSettings?.template
            ]);

            const generateCell: () => IRow<ColumnProps>[] = useCallback((): IRow<ColumnProps>[] => {
                const cells: ICell<IColumnBase>[] = [];
                const childrenArray: ReactElement<IColumnBase>[] = columns as ReactElement<IColumnBase>[];
                for (let index: number = 0; index < childrenArray.length; index++) {
                    const child: ColumnProps = childrenArray[index as number] as ColumnProps;
                    const option: ICell<IColumnBase> = {
                        visible: child.visible !== false,
                        isDataCell: !isNullOrUndefined(child.field),
                        isTemplate: !isNullOrUndefined(child.template),
                        rowID: child.uid,
                        column: child,
                        cellType: CellType.Data,
                        colSpan: 1
                    };
                    cells.push(option);
                }
                return cells;
            }, [columns]);

            const processRowData: (rowIndex: number, rowData: Object, rows: JSX.Element[], rowOptions: IRow<ColumnProps>[],
                indent?: number, currentDataRowIndex?: number,
                parentUid?: string) => void = (rowIndex: number, rowData: Object, rows: JSX.Element[], rowOptions: IRow<ColumnProps>[],
                                               indent?: number, currentDataRowIndex?: number, parentUid?: string) =>  {

                const row: Object = rowData;
                const options: IRow<ColumnProps> = {};
                options.uid = getUid('grid-row');
                options.parentUid = parentUid;
                options.data = row;
                options.index = currentDataRowIndex ? currentDataRowIndex : rowIndex;
                options.isDataRow = true;
                options.isCaptionRow = false;
                options.indent = indent;
                options.isAltRow = enableAltRow ? rowIndex % 2 !== 0 : false;

                if (rowTemplate) {
                    options.cells = generateCell();
                }

                // Store the options object for getRowsObject
                rowOptions.push({ ...options });

                // Create the row element with a callback ref to store the element reference
                rows.push(
                    <RowBase
                        ref={(element: RowRef) => {
                            if (element?.rowRef?.current) {
                                storeRowRef(rowIndex, element.rowRef.current, element.getCells(), element.setRowObject);
                            } else if (element?.editInlineRowFormRef?.current) {
                                rowsObjectRef.current[rowIndex as number].editInlineRowFormRef = element?.editInlineRowFormRef;
                                editInlineFormRef.current = rowsObjectRef.current[rowIndex as number].editInlineRowFormRef.current; // final single row ref for edit form.
                            }
                        }}
                        key={options.uid}
                        row={{ ...options }}
                        rowType={RenderType.Content}
                        className={CSS_DATA_ROW + (options.isAltRow ? (' ' + CSS_ALT_ROW) : '')}
                        role="row"
                        aria-rowindex={rowIndex + 1}
                        data-uid={options.uid}
                        style={{ height: `${rowHeight}px` }}
                    >
                        {(columnsDirective.props as ColumnsChildren).children}
                    </RowBase>
                );
            };

            /**
             * Memoized data rows to prevent unnecessary re-renders
             */
            const dataRows: JSX.Element[] = useMemo(() => {
                if (!columnsDirective || !currentViewData || currentViewData.length === 0) {
                    rowsObjectRef.current = [];
                    return [];
                }
                rowElementRefs.current = [];

                const rows: JSX.Element[] = [];
                const rowOptions: IRow<ColumnProps>[] = [];
                for (let rowIndex: number = 0; rowIndex < currentViewData.length; rowIndex++) {
                    processRowData(rowIndex, currentViewData[parseInt(rowIndex.toString(), 10)], rows, rowOptions);
                }

                // Store the row options in the ref for access via getRowsObject
                rowsObjectRef.current = rowOptions;
                return rows;
            }, [columnsDirective, currentViewData, storeRowRef, rowHeight, enableAltRow]);

            useEffect(() => {
                return () => {
                    rowsObjectRef.current = [];
                    rowElementRefs.current = [];
                };
            }, []);

            return (
                <tbody
                    ref={contentSectionRef}
                    {..._props}
                >
                    {editModule?.editSettings?.allowAdd && editModule?.editSettings?.newRowPosition === 'Top' && inlineAddForm}
                    {dataRows.length > 0 ? dataRows : emptyRowComponent}
                    {editModule?.editSettings?.allowAdd && editModule?.editSettings?.newRowPosition === 'Bottom' && inlineAddForm}
                </tbody>
            );
        }
    ));

/**
 * Set display name for debugging purposes
 */
ContentRowsBase.displayName = 'ContentRowsBase';

/**
 * Export the ContentRowsBase component for use in other components
 *
 * @private
 */
export { ContentRowsBase };
