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
    ReactNode,
    RefObject,
    useEffect,
    SetStateAction,
    Dispatch,
    ComponentType,
    useState,
    useLayoutEffect
} from 'react';
import {
    CellTypes, RenderType,
    ScrollMode,
    LoadingIndicatorType,
    GroupType,
    ActionType,
    ColumnType
} from '../types/enum';
import { GroupedData, OnGroupArgs } from '../types/grouping.interfaces';
import { ColumnProps, ColumnTemplateProps, IColumnBase } from '../types/column.interfaces';
import { CellEditFormRef, EditFormTemplate, InlineEditFormRef } from '../types/edit.interfaces';
import { MAX_ROWS_LIMIT_WARNING_MESSAGE } from '../constants/warnings';
import { useGridComputedProvider, useGridMutableProvider } from '../contexts/GridProviders';
import { ColumnBase } from '../components/Column';
import { RowBase } from '../components/Row';
import { computeSpanMatrix } from '../hooks/useSpanning';
import { IL10n } from '@syncfusion/react-base/src/l10n';
import { isNullOrUndefined } from '@syncfusion/react-base/src/util';
import { getPageFromRowIndex, getUid, isRowPinningEnabled } from '../utils/utils';
import { ColumnsChildren, ValueType, ContentRowsRef, ICell, IContentRowsBase, IRow,
    RowRef, IRowBase } from '../types/interfaces';
import { DetailRowTemplateParams } from '../types/master-detail';

import { detailGridModule } from '../types/detail-grid.interfaces';
import { DetailCellRendererParams } from '../types/detail-cell-renderer.interfaces';
import { TreeGridRow } from '../types/treeData.interfaces';
const CSS_EMPTY_ROW: string = 'sf-empty-row';
const CSS_DATA_ROW: string = 'sf-grid-content-row';
const CSS_ROW_HEIGHT: string = 'sf-grid-row-height';
const CSS_ALT_ROW: string = 'sf-alt-row';
const CSS_DETAIL_ROW: string = 'sf-grid-detail-row';
const CSS_DETAIL_CELL: string = 'sf-grid-detail-cell';
const CSS_GROUP_CAPTION_ROW: string = 'sf-grid-groupcaptionrow';

/**
 * RenderEmptyRow component displays when no data is available
 *
 * @component
 * @private
 * @returns {JSX.Element} The rendered empty row component
 */
function RenderEmptyRow<T>(): JSX.Element {
    const { serviceLocator, emptyRecordTemplate } = useGridComputedProvider<T>();
    const localization: IL10n = serviceLocator?.getService<IL10n>('localization');
    const { columnsDirective } = useGridMutableProvider();

    /**
     * Calculate the number of columns to span the empty message
     */
    const columnsLength: number = useMemo(() => {
        const children: ReactNode = (columnsDirective.props as ColumnsChildren<T>).children;
        return Children.count(children);
    }, [columnsDirective]);

    const rowRef: RefObject<RowRef<T>> = useRef<RowRef<T>>(null);

    /**
     * Render the empty row template based on configuration
     */
    const renderEmptyTemplate: ComponentType<void> | ReactElement | string = useMemo(() => {
        if (isNullOrUndefined(emptyRecordTemplate)) {
            return <>{localization?.getConstant('noRecordsMessage')}</>;
        } else if (typeof emptyRecordTemplate === 'string' || isValidElement(emptyRecordTemplate)) {
            return emptyRecordTemplate;
        } else {
            return emptyRecordTemplate;
        }
    }, [emptyRecordTemplate, localization]);

    return useMemo(() => (
        <RowBase<T>
            ref={rowRef}
            key="empty-row"
            row={{ rowIndex: 0, uid: 'empty-row-uid' }}
            rowType={RenderType.Content}
            role="row"
            className={CSS_EMPTY_ROW}
        >
            <ColumnBase<T>
                key="empty-cell"
                index={0}
                uid='empty-cell-uid'
                customAttributes={{
                    style: { left: '0px' },
                    colSpan: columnsLength,
                    tabIndex: 0 // Make the empty cell focusable
                }}
                template={renderEmptyTemplate as ComponentType<ColumnTemplateProps<T>> | ReactElement | string}
            />
        </RowBase>
    ), [columnsLength, renderEmptyTemplate]);
}

/**
 * Set display name for debugging purposes
 */
RenderEmptyRow.displayName = 'RenderEmptyRow';

/**
 * DetailGridRenderer component renders a nested detail grid using the detailCellRendererParams
 *
 * @component
 * @private
 * @template T - The type of the parent row data
 * @param {Object} props - Component properties
 * @param {T} props.parentData - The parent row data
 * @param {DetailCellRendererParams<T>} props.rendererParams - The detail cell renderer configuration
 * @param {string} [props.childDataPath] - The path to child data in parent
 * @param {number} [props.maxNestingDepth] - Maximum nesting depth allowed
 * @param {number} [props.nestingDepth] - Current nesting depth
 * @param {detailGridModule} [props.detailGridModule] - The detail row module containing the DetailCellRenderer
 * @returns {JSX.Element | null} The rendered detail grid or null if parameters are invalid
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function DetailGridRenderer<T extends Record<string, any> = Record<string, any>>(
    props: {
        parentData: T;
        rendererParams: DetailCellRendererParams<T>;
        childDataPath?: string;
        maxNestingDepth?: number;
        nestingDepth?: number;
        detailGridModule?: detailGridModule;
    }
): JSX.Element | null {
    const { parentData, rendererParams, maxNestingDepth = 3, nestingDepth = 0, detailGridModule } = props;

    // Validate that the renderer params exist
    if (!rendererParams) {
        return null;
    }
    const DetailRenderer: React.ComponentType<any> | null = detailGridModule?.DetailCellRenderer;
    if (!DetailRenderer) {
        return null;
    }

    // Use DetailCellRenderer component for ag-Grid Master-Detail pattern
    // Supports three data binding modes: Nested Data, Mapping Data (mappingID), and Async
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (
        <DetailRenderer
            data={parentData as any}
            params={rendererParams as any}
            nestingDepth={nestingDepth}
            maxNestingDepth={maxNestingDepth}
            className='sf-detail-cell-renderer'
        />
    );
}

/**
 * Set display name for debugging purposes
 */
DetailGridRenderer.displayName = 'DetailGridRenderer';

/**
 * ContentRowsBase component renders the data rows within the table body section
 *
 * @component
 * @private
 * @param {Partial<IContentRowsBase>} props - Component properties
 * @param {RefObject<ContentRowsRef>} ref - Forwarded ref to expose internal elements and methods
 * @returns {JSX.Element} The rendered tbody element with data rows
 */
const ContentRowsBase: <T>(props: Partial<IContentRowsBase> & RefAttributes<ContentRowsRef<T>>) => ReactElement =
    memo(forwardRef<ContentRowsRef, Partial<IContentRowsBase>>(
        <T, >({ pinBucket, ..._props }: Partial<IContentRowsBase>, ref: RefObject<ContentRowsRef<T>>) => {
            const { columnsDirective, currentViewData, virtualCachedViewData, editModule, uiColumns, selectionModule,
                commandColumnModule, totalRecordsCount, groupModule, singleGroupColumn, groupCaptionAggregateType,
                offsetY, offsetX, virtualSettings, scrollMode, isInitialLoad, expansionState,
                loadedPageWiseVirtualGroupStartEndRowIndexes, expandedGroupCountRef, gridAction, pinningModule,
                treeModule, treeDataSettings
            } = useGridMutableProvider<T>();
            const { groupSettings, isRowPinned, isRowPinnable, pinningSettings, getContentTableRowsObject, getContentTableCachedRowObjects
            } = useGridComputedProvider<T>();
            const { rowHeight, enableAltRow, columns, rowTemplate, getPrimaryKeyFieldNames, getRowHeight,
                scrollModule, textWrapSettings, pageSettings, sortSettings, filterSettings, searchSettings,
                loadingIndicatorSettings, contentScrollRef, element, enableAutoSpan, isSpannedColumns,
                isMasterDetail, detailRowTemplate, detailRowHeight,
                getVisibleColumns, serviceLocator, enableDevMode, isStackedHeader, stackedFlattedColumns,
                detailCellRendererParams, childDataPath, maxNestingDepth, detailGridModule
            } = useGridComputedProvider<T>();
            const localization: IL10n = serviceLocator?.getService<IL10n>('localization');
            const { indicatorType } = loadingIndicatorSettings;
            const primaryKey: ColumnProps = columns.find((column: ColumnProps) => column.isPrimaryKey);
            // Refs for DOM elements and child components
            const contentSectionRef: RefObject<HTMLTableSectionElement> = useRef<HTMLTableSectionElement>(null);
            const rowsObjectRef: RefObject<IRow<ColumnProps<T>>[]> = useRef<IRow<ColumnProps<T>>[]>([]);
            const rowElementRefs: RefObject<HTMLTableRowElement[] | HTMLCollectionOf<HTMLTableRowElement>> =
                useRef<HTMLTableRowElement[] | HTMLCollectionOf<HTMLTableRowElement>>([]);
            const addInlineFormRef: RefObject<InlineEditFormRef<T>> = useRef<InlineEditFormRef<T>>(null);
            const editInlineFormRef: RefObject<InlineEditFormRef<T>> = useRef<InlineEditFormRef<T>>(null);
            const editCellFormRef: RefObject<CellEditFormRef> = useRef<CellEditFormRef>(null);
            const cachedRowObjects: RefObject<Map<number | string, IRow<ColumnProps<T>>>> =
                useRef<(Map<number | string, IRow<ColumnProps<T>>>)>(new Map());
            const cachedDetailRowObjects: RefObject<Map<number | string, IRow<ColumnProps<T>>>> =
                useRef<(Map<number | string, IRow<ColumnProps<T>>>)>(new Map());
            const totalRenderedRowHeight: RefObject<number> = useRef<number>(0);
            const totalAddFormRenderedRowHeight: RefObject<number> = useRef<number>(0);
            const prevRowHeightRef: RefObject<number | undefined> = useRef<number | undefined>(rowHeight);
            const [_requireMoreVirtualRowsForceRefresh, setRequireMoreVirtualRowsForceRefresh] = useState<Object>({});
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
            const getRowsObject: () => IRow<ColumnProps<T>>[] = useCallback(() => rowsObjectRef.current, [rowsObjectRef.current]);

            /**
             * Gets a row by index.
             *
             * @param  {number} index - Specifies the row index.
             * @returns {HTMLTableRowElement} returns the element
             */
            const getRowByIndex: (index: number) => HTMLTableRowElement = useCallback((index: number) =>  {
                return !isNullOrUndefined(index) ? (virtualSettings.enableRow ? cachedRowObjects.current?.get(index)?.element :
                    getRows()[parseInt(index.toString(), 10)]) : undefined;
            }, []);

            /**
             * @param {string} uid - Defines the uid
             * @returns {IRow<ColumnProps>} Returns the row object
             * @private
             */
            const getRowObjectFromUID: (uid: string) => IRow<ColumnProps<T>> = useCallback((uid: string) => {
                const rows: IRow<ColumnProps<T>>[] = getRowsObject() as IRow<ColumnProps<T>>[];
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
                cachedDetailRowObjects,
                addInlineRowFormRef: addInlineFormRef,
                editInlineRowFormRef: editInlineFormRef,
                editCellFormRef: editCellFormRef,
                cachedRowObjects,
                totalRenderedRowHeight,
                totalAddFormRenderedRowHeight,
                setRequireMoreVirtualRowsForceRefresh
            }), [getRows, getRowsObject, getRowByIndex, getRowObjectFromUID, cachedRowObjects, cachedDetailRowObjects,
                currentViewData, addInlineFormRef.current, editInlineFormRef.current, editCellFormRef.current, totalRenderedRowHeight,
                setRequireMoreVirtualRowsForceRefresh, totalAddFormRenderedRowHeight]);

            /**
             * Memoized empty row component to display when no data is available
             */
            const resolvedPinnedCounts: {
                top: number;
                content: number;
                renderedRowIndexOffset: number;
                ariaRowIndexOffset: number;
                resolvedViewData: (T | GroupedData<T>)[];
            } = useMemo(() => {
                const isPinningActive: boolean = isRowPinningEnabled(pinningSettings);
                if (!isPinningActive || !currentViewData) {
                    return {
                        top: 0,
                        content: currentViewData?.length ?? 0,
                        renderedRowIndexOffset: 0,
                        ariaRowIndexOffset: 0,
                        resolvedViewData: currentViewData ?? []
                    };
                }

                const pinnedStates: { isPinned: boolean; pinBucket?: 'top' | 'bottom'; rowData?: T }[] =
                    Array.from(pinningModule?.pinnedRowsState?.values() ?? []);
                let top: number = 0;
                let bottom: number = 0;
                for (const state of pinnedStates) {
                    if (state.isPinned && state.pinBucket === 'top') { top++; }
                    if (state.isPinned && state.pinBucket === 'bottom') { bottom++; }
                }
                const content: number = currentViewData.length;
                const hasFiltering: boolean = !!(filterSettings?.columns?.length || searchSettings?.value);
                const hasSorting: boolean = !!sortSettings?.columns?.length;
                let resolvedViewData: (T | GroupedData<T>)[] = currentViewData;
                if (pinBucket !== undefined) {
                    const bucketStates: { isPinned: boolean; pinBucket?: 'top' | 'bottom'; rowData?: T }[] =
                        pinnedStates.filter((state: { isPinned: boolean; pinBucket?: 'top' | 'bottom'; rowData?: T }) =>
                            state.isPinned && state.pinBucket === pinBucket && state.rowData);
                    if (!hasFiltering && !hasSorting) {
                        resolvedViewData = bucketStates.map((state: { rowData?: T }): T => state.rowData);
                    } else {
                        const pinnedRowsByKey: Map<string, T> = new Map(
                            bucketStates.map((state: { rowData?: T }): [string, T] => [
                                String((state.rowData as T & Record<string, unknown>)[primaryKey?.field as string]), state.rowData
                            ])
                        );
                        const viewPinnedRows: T[] = currentViewData.reduce((rows: T[], row: T | GroupedData<T>) => {
                            const rowKey: string = String((row as T & Record<string, unknown>)[primaryKey?.field as string]);
                            if (pinnedRowsByKey.has(rowKey)) {
                                rows.push(row as T);
                                pinnedRowsByKey.delete(rowKey);
                            }
                            return rows;
                        }, []);
                        resolvedViewData = hasFiltering ? viewPinnedRows :
                            viewPinnedRows.concat(Array.from(pinnedRowsByKey.values()));
                    }
                }
                const renderedRowIndexOffset: number = pinBucket === 'top' ? 0 :
                    pinBucket === 'bottom' ? top + getContentTableRowsObject?.()?.length : top;
                const ariaRowIndexOffset: number = pinBucket === 'top' ? 0 :
                    pinBucket === 'bottom' ? top + content : top;

                return {
                    top,
                    bottom,
                    content,
                    renderedRowIndexOffset,
                    ariaRowIndexOffset,
                    resolvedViewData
                };
            }, [currentViewData, pinningSettings?.enabled, isRowPinned, isRowPinnable, pinBucket, offsetY,
                pinningModule?.pinnedRowsState]);

            useEffect(() => {
                if (isInitialLoad && isRowPinningEnabled(pinningSettings)) {
                    pinningModule?.initializePinnedRowsState?.(isRowPinned);
                }
            }, [isInitialLoad, isRowPinned, pinningModule, pinningSettings?.enabled, pinningSettings?.type]);

            const emptyRowComponent: JSX.Element | null = useMemo(() => {
                if (!columnsDirective || !currentViewData || currentViewData.length === 0) {
                    return <RenderEmptyRow<T> />;
                }
                return null;
            }, [columnsDirective, currentViewData]);

            /**
             * Callback to store row element references directly in the row object
             *
             * @param {number} index - Row index
             * @param {HTMLTableRowElement} element - Row DOM element
             */
            const storeRowRef: (index: number, element: HTMLTableRowElement, cellRef: ICell<ColumnProps<T>>[],
                setRowObject: Dispatch<SetStateAction<IRow<ColumnProps<T>>>>) => void =
                useCallback((index: number, element: HTMLTableRowElement, cellRef: ICell<ColumnProps<T>>[],
                             setRowObject: Dispatch<SetStateAction<IRow<ColumnProps<T>>>>) => {
                    if (rowsObjectRef.current[index as number]) {
                        // Directly update the element reference in the row object
                        rowsObjectRef.current[index as number].element = element;
                        rowElementRefs.current[index as number] = element;
                        rowsObjectRef.current[index as number].cells = cellRef;
                        rowsObjectRef.current[index as number].setRowObject = setRowObject;
                        if (textWrapSettings?.enabled || cellRef?.find((cell: ICell<ColumnProps<T>>) => cell?.column?.autoHeight) ||
                            (rowTemplate && rowsObjectRef.current?.[index as number]?.isDataRow &&
                                rowsObjectRef.current?.[index as number]?.data)) { // Lazy/Auto/TextWrap RowHeight Calculation
                            const rowElementHeight: number = element.offsetHeight || Math.ceil(element.getBoundingClientRect().height);
                            if (rowsObjectRef.current[index as number]?.height !== Math.round(rowElementHeight)) {
                                totalRenderedRowHeight.current = (totalRenderedRowHeight.current -
                                    rowsObjectRef.current[index as number]?.height) + Math.round(rowElementHeight);
                            }
                            rowsObjectRef.current[index as number].height = rowElementHeight;
                        }
                        const cachedRowObject: IRow<ColumnProps<T>> =
                            cachedRowObjects.current.get(rowsObjectRef.current[index as number]?.rowIndex);
                        if (virtualSettings.enableRow && !rowsObjectRef.current[parseInt(index.toString(), 10)]?.isDetailRow) {
                            cachedRowObjects.current.set(rowsObjectRef.current[index as number].rowIndex, {
                                ...cachedRowObject ?? {},
                                ...rowsObjectRef.current[index as number]
                            });
                        }
                    }
                }, []);


            const inlineAddForm: JSX.Element | JSX.Element[] = useMemo(() => {
                const options: IRow<ColumnProps<T>> = {
                    uid: getUid('grid-add-row'),
                    data: editModule?.originalData,
                    rowIndex: editModule?.editSettings?.newRowPosition === 'Top' ? 0 : currentViewData?.length, // Critical: Use original data index for proper tracking
                    isDataRow: false
                };
                // Enhanced check for showAddNewRow functionality
                // This ensures add form is properly visible in all scenarios
                const isCommandAdd: boolean = commandColumnModule?.commandEdit.current &&
                    commandColumnModule?.commandAddRef.current.length ? true : false;
                const showAddForm: boolean = editModule?.editSettings?.allowAdd &&
                    (editModule?.editSettings?.showAddNewRow ||
                    (!options.data && editModule?.isEdit) || isCommandAdd);
                if (!editModule) { return null; }
                const { InlineEditForm } = editModule;
                return showAddForm ? isCommandAdd ?
                    commandColumnModule?.commandAddRef.current.map((row: IRow<ColumnProps>) => {
                        return (
                            <InlineEditForm
                                ref={(addInlineFormRef: InlineEditFormRef<T>) => {
                                    commandColumnModule.commandAddInlineFormRef.current[row.uid] = { current: addInlineFormRef };
                                }}
                                key={`add-edit-${row.uid}-${scrollModule?.virtualColumnInfo?.startIndex}`}
                                stableKey={`add-edit-${row.uid}-${row.rowIndex}`}
                                isAddOperation={true}
                                columns={uiColumns.current ?? columns as ColumnProps<T>[]}
                                editData={row.data as T}
                                rowObject={row as IRow<ColumnProps<T>>}
                                validationErrors={virtualSettings.enableRow ?
                                    commandColumnModule?.commandAddInlineFormRef.current?.[row?.uid]?.current?.formState?.errors || {} : {}}
                                editRowIndex={row.rowIndex}
                                rowUid={row.uid}
                                disabled={editModule?.isShowAddNewRowDisabled}
                                onFieldChange={(field: string, value: ValueType | null) => {
                                    if (editModule?.updateEditData) {
                                        editModule?.updateEditData?.(field, value, row as IRow<ColumnProps<T>>);
                                    }
                                }}
                                onSave={() => editModule?.saveDataChanges()}
                                onCancel={editModule?.cancelDataChanges}
                                template={editModule?.editSettings?.template as React.ComponentType<EditFormTemplate<T>>}
                            />
                        );
                    })
                    : (
                        <InlineEditForm
                            ref={(addFormRef: InlineEditFormRef<T>) => {
                                addInlineFormRef.current = addFormRef;
                            }}
                            key={`add-edit-${options.uid}-${scrollModule?.virtualColumnInfo?.startIndex}`}
                            stableKey={`add-edit-${options.uid}-${editModule?.editRowIndex}`}
                            isAddOperation={true}
                            columns={uiColumns.current ?? columns as ColumnProps<T>[]}
                            editData={editModule?.editData}
                            validationErrors={editModule?.validationErrors || {}}
                            editRowIndex={options.rowIndex}
                            rowUid={options.uid}
                            // Properly handle disabled state for showAddNewRow inputs
                            // This ensures inputs are disabled during data row editing and re-enabled after
                            disabled={editModule?.isShowAddNewRowDisabled}
                            onFieldChange={(field: string, value: ValueType | null) => {
                                if (editModule?.updateEditData) {
                                    editModule?.updateEditData?.(field, value, options);
                                }
                            }}
                            onSave={() => editModule?.saveDataChanges()}
                            onCancel={editModule?.cancelDataChanges}
                            template={editModule?.editSettings?.template as React.ComponentType<EditFormTemplate<T>>}
                        />
                    ) : null;
            }, [
                columnsDirective, currentViewData?.length, rowHeight,
                editModule?.isEdit,
                editModule?.editRowIndex,
                editModule?.isShowAddNewRowActive,
                editModule?.isShowAddNewRowDisabled,
                editModule?.showAddNewRowData,
                editModule?.editSettings?.newRowPosition,
                editModule?.editSettings?.template,
                commandColumnModule?.commandAddRef?.current?.length,
                editModule?.InlineEditForm
            ]);
            useLayoutEffect(() => {
                totalAddFormRenderedRowHeight.current = 0;
                const commandKeys: string[] = commandColumnModule ? Object.keys(commandColumnModule?.commandAddInlineFormRef.current) : [];
                if (addInlineFormRef.current) {
                    const rowElement: HTMLTableRowElement = addInlineFormRef.current?.rowRef.current;
                    const rowElementHeight: number = rowElement?.offsetHeight ||
                        Math.ceil(rowElement?.getBoundingClientRect?.()?.height);
                    totalAddFormRenderedRowHeight.current = rowElementHeight;
                } else if (commandKeys.length) {
                    for (const key of commandKeys) {
                        const rowElement: HTMLTableRowElement =
                            commandColumnModule?.commandAddInlineFormRef.current[key as string]?.current?.rowRef.current;
                        const rowElementHeight: number = rowElement?.offsetHeight ||
                            Math.ceil(rowElement?.getBoundingClientRect?.()?.height);
                        if (!isNaN(rowElementHeight)) {
                            totalAddFormRenderedRowHeight.current += rowElementHeight;
                        }
                    }
                }
                if (totalAddFormRenderedRowHeight.current !== 0 && editModule?.editSettings?.allowAdd && contentScrollRef &&
                    editModule?.editSettings.mode === 'Normal') {
                    if (editModule?.editSettings?.newRowPosition === 'Top') {
                        contentScrollRef.scrollTop = 0;
                    } else {
                        contentScrollRef.scrollTop = contentScrollRef.scrollHeight;
                    }
                }
            }, [inlineAddForm]);

            const generateCell: () => IRow<ColumnProps<T>>[] = useCallback((): IRow<ColumnProps<T>>[] => {
                const cells: ICell<IColumnBase<T>>[] = [];
                const childrenArray: ReactElement<IColumnBase<T>>[] = columns as ReactElement<IColumnBase<T>>[];
                for (let index: number = 0; index < childrenArray.length; index++) {
                    const child: ColumnProps<T> = childrenArray[index as number] as ColumnProps<T>;
                    const option: ICell<IColumnBase<T>> = {
                        visible: child.visible !== false,
                        isDataCell: !isNullOrUndefined(child.field),
                        isTemplate: !isNullOrUndefined(child.template),
                        rowID: child.uid,
                        column: child,
                        cellType: CellTypes.Data,
                        colSpan: 1
                    };
                    cells.push(option);
                }
                return cells;
            }, [columns]);

            const generateDetailCell: (count?: number) => IRow<ColumnProps<T>>[] = useCallback((count?: number): IRow<ColumnProps<T>>[] => {
                const cells: ICell<IColumnBase<T>>[] = [];
                const option: ICell<IColumnBase<T>> = {
                    visible: true,
                    isDataCell: false,
                    isTemplate: false,
                    cellType: CellTypes.Data,
                    colSpan: count
                };
                cells.push(option);
                return cells;
            }, []);

            useMemo(() => {
                totalRenderedRowHeight.current = 0;
                rowsObjectRef.current = [];
                cachedRowObjects.current.clear();
            }, [filterSettings?.columns, filterSettings?.columns.length, sortSettings?.columns, sortSettings?.columns.length,
                searchSettings?.value, groupSettings?.columns, groupSettings?.columns?.length]);

            useMemo(() => {
                if ((scrollMode === ScrollMode.Virtual || scrollMode === ScrollMode.Infinite) &&
                    !scrollModule?.isDataOperationPreventVirtualCache.current) {
                    if (virtualSettings.enableCache) { return; }

                    // Remove all not in view pages cached rowObjects
                    const previousPages: number[] = scrollModule?.virtualRowInfo?.previousPages ?? [];
                    const currentPages: number[] = scrollModule?.virtualRowInfo?.currentPages ?? [];

                    // Find removed pages
                    const removedPages: number[] = previousPages.filter((page: number) => !currentPages.includes(page));

                    if (removedPages.length > 0) {
                        scrollModule.virtualRowInfo.previousPages = scrollModule?.virtualRowInfo?.previousPages.filter((page: number) =>
                            !removedPages.includes(page));
                        const pageSize: number = pageSettings.pageSize;
                        // Collect all keys to remove in one pass
                        const keysToRemove: Set<number> = new Set<number>();
                        for (const page of removedPages) {
                            const pageInfo: {
                                startIndex: number;
                                endIndex: number;
                            } = loadedPageWiseVirtualGroupStartEndRowIndexes.current?.get(page);
                            const isGroupWithColumns: boolean = !!(groupSettings.enabled && groupSettings.columns?.length);
                            const startIndex: number = isGroupWithColumns ? pageInfo?.startIndex ?? 0 : ((page - 1) * pageSize);
                            const endIndex: number = isGroupWithColumns ? pageInfo?.endIndex ?? expandedGroupCountRef.current :
                                startIndex + pageSize;
                            for (let i: number = startIndex; i < endIndex; i++) {
                                keysToRemove.add(i);
                            }
                        }

                        // Clear cachedRowObjects in one pass
                        keysToRemove.forEach((key: number) => cachedRowObjects.current.delete(key));

                        // Filter rowsObjectRef in one pass
                        rowsObjectRef.current = rowsObjectRef.current.filter((row: IRow<ColumnProps<T>>) =>
                            !keysToRemove.has(row.rowIndex));

                        // Adjust totalRenderedRowHeight only if needed
                        totalRenderedRowHeight.current = Array.from(cachedRowObjects.current.values())
                            .reduce((sum: number, row: IRow<ColumnProps<T>>) => sum + (row.height ?? 0), 0);
                    }
                } else {
                    // Non-virtual or single-page mode: full reset
                    totalRenderedRowHeight.current = 0;
                    rowsObjectRef.current = [];
                    cachedRowObjects.current.clear();
                }
            }, [currentViewData, pageSettings, getRowHeight, virtualSettings, scrollMode]);

            useMemo(() => {
                const hasRequiredRowsRange: boolean = !!scrollModule?.virtualRowInfo?.requiredRowsRange?.length;
                const shouldPreventVirtualCache: boolean = !scrollModule?.isDataOperationPreventVirtualCache.current;
                if (!isInitialLoad && shouldPreventVirtualCache && hasRequiredRowsRange) {
                    scrollModule.isDataOperationPreventVirtualCache.current = true;
                }
            }, [isInitialLoad]);

            useEffect(() => {
                prevRowHeightRef.current = rowHeight;
            }, [rowHeight]);

            /**
             * Memoized callback to compute and apply span matrix to rows and rowOptions
             * Only recalculates when columnsArray or enableAutoSpan changes
             *
             * @param {JSX.Element[]} rows - Array of rendered row elements
             * @param {IRow<ColumnProps>[]} rowOptions - Array of row option objects
             * @param {Object[]} renderedData - Array of rendered data
             */
            const applySpanMatrix: (
                rows: JSX.Element[],
                rowOptions: IRow<ColumnProps<T>>[],
                renderedData: T[],
                groupColumn?: ColumnProps
            ) => void = useCallback(
                (
                    rows: JSX.Element[],
                    rowOptions: IRow<ColumnProps<T>>[],
                    renderedData: T[],
                    groupColumn?: ColumnProps
                ) => {
                    const spanColumns: ColumnProps<T>[] = (scrollModule?.virtualColumnInfo?.visibleHeaderColumns as ColumnProps<T>[]) || [];
                    const spanMatrix: ICell<ColumnProps<T>>[][] = computeSpanMatrix(spanColumns, renderedData, enableAutoSpan, groupColumn);
                    for (let idx: number = 0, spanEnd: number = rows.length; idx < spanEnd; idx++) {
                        if (idx >= 0 && idx < spanMatrix.length && spanMatrix[parseInt(idx.toString(), 10)]) {
                            const cells: ICell<ColumnProps<T>>[] = spanMatrix[parseInt(idx.toString(), 10)];
                            // Update the row prop directly to ensure the Row component receives the latest spanCells
                            rows[parseInt(idx.toString(), 10)].props.row.spanCells = cells;
                            if (rowOptions[parseInt(idx.toString(), 10)]) {
                                rowOptions[parseInt(idx.toString(), 10)].spanCells = cells;
                            }
                        }
                    }
                }, [scrollModule?.virtualColumnInfo?.visibleHeaderColumns, enableAutoSpan, isInitialLoad]);

            const processRowData: (ariaRowIndex: number, dataRowIndex: number, data: GroupedData<T> | T, rows: JSX.Element[],
                rowOptions: IRow<ColumnProps<T>>[], ariaRowIndexOffset: number, renderedRowIndexOffset: number,
                indent?: number, currentDataRowIndex?: number, parentUid?: string, detailCount?: number) => void =
                (ariaRowIndex: number, dataRowIndex: number, data: GroupedData<T> | T,
                 rows: JSX.Element[], rowOptions: IRow<ColumnProps<T>>[],
                 ariaRowIndexOffset: number, renderedRowIndexOffset: number, indent?: number, currentDataRowIndex?: number,
                 parentUid?: string, detailCount?: number) =>  {
                    const row: GroupedData<T> | T = !data?.['flattedKey'] && (editModule?.editSettings?.allowBatchSave === true)
                        ? (editModule?.batchEditModule?.getBatchEditedRowData(
                            (data as T)?.[primaryKey?.field as string] as string | number, data as T) ?? data)
                        : data;
                    const options: IRow<ColumnProps<T>> = {};
                    const isCaption: boolean = row?.['items'] && (row?.['key'] || row?.['key'] === 0 || row?.['key'] === '' || row?.['flattedKey']?.split('-')?.includes('null'));
                    const isFooter: boolean = row?.['flattedGroupSummary'];
                    const groupUid: string | undefined = (isCaption || isFooter) && groupSettings?.columns &&
                        (row as GroupedData<T>)?.flattedKey ? (row as GroupedData<T>).flattedKey : undefined;
                    const rowIdentityIndex: number = currentDataRowIndex != null ? currentDataRowIndex : ariaRowIndex;
                    // Use distinct data-uid values for pinned rows so they remain unique
                    if (groupUid && groupUid !== '') {
                        options.uid = 'grid-caption-row-' + groupUid;
                    } else {
                        const pkValue: string = primaryKey ? (row?.[`${primaryKey.field}`] ?? groupUid) : (rowIdentityIndex).toString();
                        if (pinBucket === 'top') {
                            options.uid = `grid-row-top-${pkValue}`;
                        } else if (pinBucket === 'bottom') {
                            options.uid = `grid-row-bottom-${pkValue}`;
                        } else {
                            options.uid = `grid-row-${pkValue}`;
                        }
                    }
                    options.rowIndex = rowIdentityIndex + ariaRowIndexOffset;
                    let tempRowsObjectRef: IRow<ColumnProps<T>>[] = rowsObjectRef.current;
                    if (isMasterDetail && (detailRowTemplate || detailCellRendererParams)) {
                        tempRowsObjectRef = rowsObjectRef.current?.filter((row: IRow<ColumnProps<T>>) => { return !row.isDetailRow; });
                    }
                    const isVisible: boolean = Array.from(tempRowsObjectRef).some(
                        (r: IRow<ColumnProps<T>>) => r.uid === options.uid && r.data
                    );
                    const cachedRowObject: IRow<ColumnProps<T>> = cachedRowObjects.current.get(options.rowIndex) ??
                        (!virtualSettings?.enableRow ? tempRowsObjectRef?.[rowIdentityIndex as number] : undefined);
                    const isSamePrimaryKeyValue: boolean = !isCaption ? (!primaryKey?.field ||
                        cachedRowObject?.data?.[`${primaryKey?.field}`] === row?.[`${primaryKey.field}`]) :
                        ((cachedRowObject?.data as GroupedData)?.flattedKey === (row as GroupedData)?.flattedKey);
                    options.key = isVisible && cachedRowObject && isSamePrimaryKeyValue ? cachedRowObject.key : getUid('grid-row');
                    options.parentUid = isCaption ? (groupUid?.split('-')?.slice(0, -1)?.join('-')) : parentUid;
                    options.data = isCaption && groupSettings?.type === GroupType.MultipleColumns ? ({...row,
                        ...groupSettings.columns.reduce((acc: T, field: string, index: number) => {
                            if (groupSettings.captionFormat === 'compact' && (index + 1) === (row as GroupedData<T>)?.flattedLevel) {
                                if (field === (row as GroupedData<T>)?.field) {
                                    const key: ValueType = (row as GroupedData<T>)?.key;
                                    acc[field as string] = `${(key && key !== '') || (key === 0) ? key : localization?.getConstant('blanks')} (${
                                        (row as GroupedData<T>)?.count ?? 0
                                    })`;
                                }
                                if (groupCaptionAggregateType && groupCaptionAggregateType?.size) {
                                    groupCaptionAggregateType.forEach((aggregateType: string[], aggregateField: string) => {
                                        acc[aggregateField as string] = aggregateType.map((type: string) =>
                                            (row as GroupedData<T>)?.aggregates?.[`${aggregateField} - ${type.toLowerCase()}`] ?? ''
                                        ).join(', ');
                                    });
                                }
                            } else if (groupSettings.captionFormat === 'verbose' && (index + 1) === (row as GroupedData<T>)?.flattedLevel) {
                                if (field === (row as GroupedData<T>)?.field) {
                                    const key: ValueType = (row as GroupedData<T>)?.key;
                                    acc[field as string] = `${(row as GroupedData<T>)?.field ?? ''}: ${
                                        (key && key !== '') || (key === 0) ? key : localization?.getConstant('blanks')
                                    } - ${(row as GroupedData<T>)?.count ?? 0} item${
                                        ((row as GroupedData<T>)?.count ?? 0) !== 1 ? 's' : ''
                                    }`;
                                }
                                if (groupCaptionAggregateType && groupCaptionAggregateType?.size) {
                                    groupCaptionAggregateType.forEach((aggregateType: string[], aggregateField: string) => {
                                        acc[aggregateField as string] = aggregateType.map((type: string) =>
                                            (row as GroupedData<T>)?.aggregates?.[`${aggregateField} - ${type.toLowerCase()}`] ?? ''
                                        ).join(', ');
                                    });
                                }
                            }
                            return acc;
                        }, {})
                    }) : (isCaption && (groupSettings?.type === GroupType.SingleColumn || groupSettings?.type === GroupType.GroupRows) ? ({
                        ...row, ...groupSettings.columns.reduce((acc: T, _field: string, index: number) => {
                            const groupColumn: ColumnProps = singleGroupColumn ? singleGroupColumn :
                                getVisibleColumns?.()?.find((column: ColumnProps) =>
                                    column?.type !== ColumnType.Checkbox && !column?.getCommandItems && column.type !== ColumnType.RowNumber
                                    && column.type !== ColumnType.RowDragAndDrop);
                            if (groupSettings.captionFormat === 'compact' && (index + 1) === (row as GroupedData<T>)?.flattedLevel) {
                                const key: ValueType = (row as GroupedData<T>)?.key;
                                acc[groupColumn?.field as string] = `${(key && key !== '') || (key === 0) ? key : localization?.getConstant('blanks')} (${
                                    (row as GroupedData<T>)?.count ?? 0
                                })`;
                                if (groupCaptionAggregateType && groupCaptionAggregateType?.size) {
                                    groupCaptionAggregateType.forEach((aggregateType: string[], aggregateField: string) => {
                                        acc[aggregateField as string] = aggregateType.map((type: string) =>
                                            (row as GroupedData<T>)?.aggregates?.[`${aggregateField} - ${type.toLowerCase()}`] ?? ''
                                        ).join(', ');
                                    });
                                }
                            } else if (groupSettings.captionFormat === 'verbose' && (index + 1) === (row as GroupedData<T>)?.flattedLevel) {
                                const key: ValueType = (row as GroupedData<T>)?.key;
                                acc[groupColumn?.field as string] = `${(row as GroupedData<T>)?.field ?? ''}: ${
                                    (key && key !== '') || (key === 0) ? key : localization?.getConstant('blanks')
                                } - ${(row as GroupedData<T>)?.count ?? 0} item${
                                    ((row as GroupedData<T>)?.count ?? 0) !== 1 ? 's' : ''
                                }`;
                                if (groupCaptionAggregateType && groupCaptionAggregateType?.size) {
                                    groupCaptionAggregateType.forEach((aggregateType: string[], aggregateField: string) => {
                                        acc[aggregateField as string] = aggregateType.map((type: string) =>
                                            (row as GroupedData<T>)?.aggregates?.[`${aggregateField} - ${type.toLowerCase()}`] ?? ''
                                        ).join(', ');
                                    });
                                }
                            }
                            return acc;
                        }, {})
                    }) : row);
                    options.isDataRow = true;
                    options.isCaptionRow = isCaption;
                    options.isExpand = isCaption && ((groupUid && groupUid !== '') || (row as GroupedData<T>)?.flattedKey === '') ?
                        groupModule?.isGroupExpanded?.(groupUid ?? (row as GroupedData<T>)?.flattedKey,
                                                       (options.data as GroupedData<T>)?.field) : false;
                    if (treeDataSettings?.enabled) {
                        options.isExpand = treeModule?.expandedKeys?.has((options.data as TreeGridRow)?.treeKey);
                    }
                    options.indent = isCaption && (row as GroupedData<T>)?.flattedLevel ? (row as GroupedData<T>)?.flattedLevel : indent;
                    options.isAltRow = enableAltRow ? ariaRowIndex % 2 !== 0 : false;
                    // Initialize row selection based on persisted state and remote "Select All" mode
                    const primaryKeys: string[] = getPrimaryKeyFieldNames?.();
                    const rowKey: string = row?.[primaryKeys[0]] ?? row?.['flattedKey'];
                    if (selectionModule.isHeaderSelectAllMode) {
                        const rowSelectability: boolean = !selectionModule.isRowSelectableProp
                            ? true
                            : (row && !pageSettings.enabled)
                                ? selectionModule?.nonSelectableRows.get(rowKey) === undefined
                                : selectionModule.currentViewNonSelectableRows.get(rowKey) === undefined;
                        options.isSelected = rowSelectability && !(selectionModule.unselectedRowState.has(rowKey));
                        if (options.isSelected && row) {
                            selectionModule.selectedRowState.add(rowKey);
                            selectionModule.persistSelectedData.set(rowKey, row as T);
                        }
                    } else {
                        options.isSelected = selectionModule.selectedRowState.has(rowKey) ||
                        (virtualSettings.enableRow && selectionModule?.selectedRowIndexes?.includes(options.rowIndex));
                    }

                    // Initialize row pinning state based on isRowPinned callback
                    const isPinningActive: boolean = isRowPinningEnabled(pinningSettings);
                    if (!isCaption && isPinningActive) {
                        const isPinnable: boolean = isRowPinnable?.(row as T) !== false;
                        const rowKey: string | undefined = primaryKey?.field ?
                            String((row as T & Record<string, unknown>)?.[primaryKey.field]) : undefined;
                        const persistedPinState: { isPinned: boolean; pinBucket?: 'top' | 'bottom' } | undefined =
                            rowKey ? pinningModule?.pinnedRowsState?.get(rowKey) : undefined;
                        const pinBucket: 'top' | 'bottom' | null | undefined = isPinnable ? (persistedPinState ?
                            (persistedPinState.isPinned ? persistedPinState.pinBucket : null) : isRowPinned?.(row as T)) : null;
                        options.isPinned = !!pinBucket;
                        options.pinBucket = pinBucket;
                    }

                    if (rowTemplate) {
                        options.cells = generateCell();
                    }
                    const isRowHeightPropChanged: boolean = prevRowHeightRef.current !== undefined &&
                                                prevRowHeightRef.current !== rowHeight;
                    options.height = !isVisible && getRowHeight ? getRowHeight(options) :
                        (isRowHeightPropChanged ? rowHeight : (cachedRowObject?.height || rowHeight));
                    if (element.querySelector('.sf-grid-resize-helper')) {
                        let visibleColumns: ColumnProps<T>[] = getVisibleColumns?.();
                        if (virtualSettings.enableColumn) {
                            visibleColumns = visibleColumns?.slice(scrollModule?.virtualColumnInfo?.startIndex,
                                                                   scrollModule?.virtualColumnInfo?.endIndex);
                        }
                        if (textWrapSettings?.enabled || visibleColumns?.find((column: ColumnProps) => column?.autoHeight)) {
                            options.height = rowHeight;
                        }
                    }
                    // Store the options object for getRowsObject
                    rowOptions.push({ ...options });

                    const renderedRowIndexGlobal: number = dataRowIndex + renderedRowIndexOffset;
                    const customAttributes: Partial<IRowBase<T>> | ({'data-uid': string, 'data-rowindex': number}) = {
                        className: `${CSS_DATA_ROW + (rowHeight ? (' ' + CSS_ROW_HEIGHT) : '') + (options.isAltRow ? (' ' + CSS_ALT_ROW) : '')}${options.isCaptionRow ? (' ' + CSS_GROUP_CAPTION_ROW) : ''}`,
                        role: 'row',
                        'data-rowindex': renderedRowIndexGlobal + 1, // unique rendered row index across buckets
                        'aria-rowindex': options.rowIndex + 1, // accessibility (global data index)
                        'data-uid': options.uid, // each row data purpose primarykey
                        style: { height: `${options.height}px` }
                    };

                    // Create the row element with a callback ref to store the element reference
                    rows.push(
                        <RowBase<T>
                            ref={(element: RowRef<T>) => {
                                const isCaptionRowRef: boolean = element?.rowRef?.current &&
                                    rowsObjectRef.current[dataRowIndex as number]?.isCaptionRow;
                                if (element?.rowRef?.current) {
                                    storeRowRef(dataRowIndex + detailCount, element.rowRef.current,
                                                element.getCells(), element.setRowObject);

                                    const selectedRowIndex: number = selectionModule.selectedRowIndexes.indexOf(
                                        rowsObjectRef.current[dataRowIndex as number]?.rowIndex);
                                    // const groupFooterUpdates: () => void = () => {
                                    //     if (groupSummary !== GroupSummaryPosition.Undefined && rowsObjectRef.current[ariaRowIndex as number]?.isCaptionRow) {
                                    //         const rowObject: IRow<ColumnProps<T>> = getRowObjectFromUID(rowsObjectRef.current[ariaRowIndex as number]?.uid + '-footer');
                                    //         if (rowObject && rowObject?.isSelected !== rowsObjectRef.current[ariaRowIndex as number]?.isSelected) {
                                    //             // cachedRowObjects.current.get(rowObject?.uid).isSelected = rowsObjectRef.current[ariaRowIndex as number]?.isSelected;
                                    //             rowObject.isSelected = rowsObjectRef.current[ariaRowIndex as number]?.isSelected;
                                    //             rowObject?.setRowObject((prev: IRow<ColumnProps<T>>) => ({
                                    //                 ...prev, isSelected: rowsObjectRef.current[ariaRowIndex as number]?.isSelected
                                    //             }));
                                    //             requestAnimationFrame(() => {
                                    //                 selectionModule?.updateHeaderSelectionState?.();
                                    //             });
                                    //         }
                                    //     } else if (groupSummary !== GroupSummaryPosition.Undefined && rowsObjectRef.current[ariaRowIndex as number]?.data?.['flattedGroupSummary']) {
                                    //         const rowObject: IRow<ColumnProps<T>> = getRowObjectFromUID(rowsObjectRef.current[ariaRowIndex as number]?.uid?.split('-footer')?.[0]);
                                    //         if (rowObject && rowObject?.isSelected !== rowsObjectRef.current[ariaRowIndex as number]?.isSelected) {
                                    //             // cachedRowObjects.current.get(rowObject?.uid).isSelected = rowsObjectRef.current[ariaRowIndex as number]?.isSelected;
                                    //             rowObject.isSelected = rowsObjectRef.current[ariaRowIndex as number]?.isSelected;
                                    //             rowObject?.setRowObject((prev: IRow<ColumnProps<T>>) => ({
                                    //                 ...prev, isSelected: rowsObjectRef.current[ariaRowIndex as number]?.isSelected
                                    //             }));
                                    //             requestAnimationFrame(() => {
                                    //                 selectionModule?.updateHeaderSelectionState?.();
                                    //             });
                                    //         }
                                    //     }
                                    // };
                                    if (rowsObjectRef.current[dataRowIndex as number]?.isSelected && selectedRowIndex === -1) {
                                        selectionModule.selectedRowIndexes.push(rowsObjectRef.current[dataRowIndex as number]?.rowIndex);
                                    }
                                    else if (!rowsObjectRef.current[dataRowIndex as number]?.isSelected && selectedRowIndex !== -1) {
                                        selectionModule.selectedRowIndexes.splice(
                                            rowsObjectRef.current[dataRowIndex as number]?.rowIndex, 1);
                                    }
                                // else if ((rowsObjectRef.current[ariaRowIndex as number]?.isSelected && selectedRowIndex !== -1) ||
                                //     (!rowsObjectRef.current[ariaRowIndex as number]?.isSelected && selectedRowIndex === -1)) {
                                //     groupFooterUpdates();
                                // }
                                } else if (contentSectionRef.current?.children?.[dataRowIndex as number] && rowTemplate

                                    && typeof rowTemplate !== 'string' && !isValidElement(rowTemplate)) { // functional/class component if ref not assigned by user
                                    storeRowRef(dataRowIndex,
                                                contentSectionRef.current?.children?.[dataRowIndex as number] as HTMLTableRowElement,
                                                element?.getCells?.(), element?.setRowObject);
                                } else if (element?.editInlineRowFormRef?.current && !isCaptionRowRef) {
                                    rowsObjectRef.current[dataRowIndex as number].editInlineRowFormRef = element?.editInlineRowFormRef;
                                    editInlineFormRef.current = rowsObjectRef.current[dataRowIndex as number].editInlineRowFormRef.current; // final single row ref for edit form.
                                    rowElementRefs.current[dataRowIndex as number] = element?.editInlineRowFormRef?.current.rowRef.current;
                                    rowsObjectRef.current[dataRowIndex as number].cells = element.getCells();
                                    if (commandColumnModule) {
                                        commandColumnModule.commandEditInlineFormRef.current[
                                            rowsObjectRef.current[dataRowIndex as number].uid
                                        ] = element?.editInlineRowFormRef;
                                    }
                                }
                                if (element?.editCellFormRef?.current) {
                                    editCellFormRef.current = element?.editCellFormRef?.current;
                                }
                            }}
                            key={options.key}
                            row={{ ...options }}
                            rowType={RenderType.Content}
                            className={CSS_DATA_ROW + (options.isAltRow ? (' ' + CSS_ALT_ROW) : '')}
                            role="row"
                            data-rowindex={renderedRowIndexGlobal + 1} // unique rendered visible row index across buckets
                            aria-rowindex={options.rowIndex + 1} // accessibility
                            data-uid={options.uid} // each row data purpose primarykey
                            style={{ height: `${options.height || rowHeight}px` }}
                            pinBucket={pinBucket}
                            {...customAttributes}
                        >
                            {isStackedHeader && stackedFlattedColumns ? stackedFlattedColumns
                                : (columnsDirective.props as ColumnsChildren<T>).children}
                        </RowBase>
                    );
                };

            /**
             * Memoized data rows to prevent unnecessary re-renders
             */
            const dataRows: JSX.Element[] = useMemo(() => {
                if ((!columnsDirective || !currentViewData || currentViewData.length === 0) && (indicatorType ===
                    LoadingIndicatorType.Spinner || !isInitialLoad || !contentSectionRef.current?.closest('.sf-grid-content') ||
                    !scrollModule)) {
                    rowsObjectRef.current = [];
                    return [];
                }
                rowElementRefs.current = [];
                const columnsCount: number = columnsDirective.props && (columnsDirective.props as ColumnsChildren<T>).children ?
                    Children.count((columnsDirective.props as ColumnsChildren<T>).children) : 1;
                let detailsCount: number = 0;

                // Row pinning: filter currentViewData based on pinBucket
                // When pinBucket is 'top' or 'bottom', render only rows pinned to that position.
                // When pinBucket is undefined, render only non-pinned (regular scrollable) rows.
                const isPinningActive: boolean = !!(isRowPinningEnabled(pinningSettings) && isRowPinned);
                const resolvedViewData: (T | GroupedData<T>)[] = resolvedPinnedCounts.resolvedViewData;
                if (isPinningActive && pinBucket !== undefined && resolvedViewData.length === 0) {
                    rowsObjectRef.current = [];
                    return [];
                }
                const ariaRowIndexOffset: number = resolvedPinnedCounts.ariaRowIndexOffset;
                const renderedRowIndexOffset: number = resolvedPinnedCounts.renderedRowIndexOffset;

                const rows: JSX.Element[] = [];
                const rowOptions: IRow<ColumnProps<T>>[] = [];

                const contentHeight: number = contentSectionRef.current?.closest('.sf-grid-content')?.clientHeight;
                // For pinned sections, always render all rows in the bucket (no virtual scrolling)
                const from: number = pinBucket !== undefined ? 0 : (offsetY ? scrollModule?.virtualRowInfo?.startIndex : offsetY);
                const to: number = pinBucket !== undefined
                    ? resolvedViewData.length
                    : (scrollModule?.virtualRowInfo?.endIndex
                        ? scrollModule?.virtualRowInfo?.endIndex
                        : Math.ceil(contentHeight / rowHeight));
                scrollModule.virtualRowInfo.requiredRowsRange = [];
                totalRenderedRowHeight.current = !virtualSettings.enableRow ? 0 : totalRenderedRowHeight.current;
                // Check if we're near the end (within 3x buffer of last row) - only for dynamic heights
                // When near end, bypass buffer limit to ensure all remaining rows are rendered
                const isNearEnd: boolean = getRowHeight && to > 0 &&
                    from >= to - (virtualSettings.rowBuffer * 3);
                const groupColumn: ColumnProps = singleGroupColumn ? singleGroupColumn : getVisibleColumns?.()?.find((column: ColumnProps) => column?.type !== 'checkbox' && !column?.getCommandItems);
                for (let ariaRowIndex: number = from, dataRowIndex: number = 0, buffer: number = 0, renderedRowHeight: number = 0;
                    ariaRowIndex < to &&
                    (pinBucket !== undefined || isNearEnd || buffer <= (from !== 0 && ariaRowIndex !== (to - 1) ?
                        virtualSettings.rowBuffer * 2 : virtualSettings.rowBuffer)); ariaRowIndex++) {
                    processRowData(ariaRowIndex, dataRowIndex, (scrollMode === ScrollMode.Virtual || scrollMode === ScrollMode.Infinite
                        ? (virtualCachedViewData.get(ariaRowIndex) ?? cachedRowObjects.current?.get(ariaRowIndex)?.data)
                        : resolvedViewData[parseInt(ariaRowIndex.toString(), 10)]), rows, rowOptions, ariaRowIndexOffset,
                                   renderedRowIndexOffset, null, null, null, detailsCount);
                    const hasDetailRenderer: boolean = detailRowTemplate !== undefined || detailCellRendererParams !== undefined;
                    renderedRowHeight += (isMasterDetail && hasDetailRenderer) ? rowHeight : rowOptions[dataRowIndex as number]?.height;
                    // Master-detail row support: Add detail row if master row is expanded
                    if (isMasterDetail && hasDetailRenderer) {
                        const rowObj: IRow<ColumnProps<T>> = rowOptions[rowOptions.length - 1];
                        if (rowObj?.data) {
                            const cachedRowObject: IRow<ColumnProps<T>> = cachedDetailRowObjects.current.get(ariaRowIndex);
                            // Check if this is a master row and if it's expanded
                            const isExpanded: boolean = expansionState?.has(ariaRowIndex) && expansionState?.get(ariaRowIndex);
                            if (isExpanded) {
                                const detailRowKey: string = `${rowObj.uid}-detail`;
                                const detailRowOptions: IRow<ColumnProps<T>> = {
                                    uid: cachedRowObject ? cachedRowObject.uid : detailRowKey,
                                    isDataRow: true,
                                    isCaptionRow: false,
                                    isDetailRow: true,
                                    isExpand: true,
                                    parentUid: cachedRowObject ? cachedRowObject.parentUid : rowObj.uid,
                                    key: cachedRowObject ? cachedRowObject.key : getUid('grid-detail-row'),
                                    height: detailRowHeight,
                                    cells: generateDetailCell(columnsCount)
                                };
                                rowOptions.push(detailRowOptions);
                                const detailTemplateParams: DetailRowTemplateParams<T> = {
                                    rowIndex: ariaRowIndex,
                                    row: rowObj?.data as T
                                };
                                detailsCount++;
                                const increase: number = detailsCount;

                                // Create detail row
                                rows.push(
                                    <RowBase<T>
                                        ref={(element: RowRef<T>) => {
                                            if (element?.rowRef?.current) {
                                                storeRowRef(dataRowIndex + increase, element.rowRef.current,
                                                            element.getCells(), element.setRowObject);
                                            }
                                        }}
                                        key={detailRowKey}
                                        row={detailRowOptions}
                                        rowType={RenderType.Content}
                                        className={CSS_DETAIL_ROW}
                                        role="row"
                                        style={{ height: `${detailRowHeight}px` }}
                                    >
                                        <ColumnBase<T>
                                            key={`${detailRowKey}-cell`}
                                            index={0}
                                            uid={`${detailRowKey}-cell`}
                                            customAttributes={{
                                                style: { left: '0px' },
                                                colSpan: columnsCount,
                                                className: CSS_DETAIL_CELL
                                            }}
                                            template={detailCellRendererParams ?
                                                () => (
                                                    <DetailGridRenderer<T>
                                                        parentData={rowObj?.data as T}
                                                        rendererParams={detailCellRendererParams}
                                                        childDataPath={childDataPath}
                                                        maxNestingDepth={maxNestingDepth}
                                                        nestingDepth={0}
                                                        detailGridModule={detailGridModule}
                                                    />
                                                ) :
                                                (typeof detailRowTemplate === 'function' ?
                                                    () => detailRowTemplate(detailTemplateParams) :
                                                    detailRowTemplate)}
                                        />
                                    </RowBase>
                                );
                                cachedDetailRowObjects.current.set(rowOptions[dataRowIndex as number].rowIndex, {
                                    ...detailRowOptions
                                });
                            }
                        }
                    }
                    dataRowIndex++;
                    let tempRowOptions: IRow<ColumnProps<T>>[] = rowOptions;
                    if (isMasterDetail && (detailRowTemplate || detailCellRendererParams)) {
                        tempRowOptions = rowOptions.filter((row: IRow<ColumnProps<T>>) => { return !row.isDetailRow; });
                    }
                    // The visible/rendered row that was just added is at index `dataRowIndex - 1`.
                    // Use a safe computed index so we don't read past the end of `tempRowOptions`.
                    const renderedIndexForCache: number = (dataRowIndex > 0) ? (dataRowIndex - 1) : 0;
                    const currentTempRow: IRow<ColumnProps<T>> | undefined = tempRowOptions[renderedIndexForCache as number];
                    let cachedRowObject: IRow<ColumnProps<T>> = cachedRowObjects.current.get(currentTempRow?.rowIndex);
                    if (pinningModule?.pinningActionInfo.current.topDiffer && currentTempRow?.uid !== cachedRowObject?.uid) {
                        if (pinBucket === 'top') {
                            cachedRowObject = undefined;
                            for (const rowObj of pinningModule.pinningActionInfo.current.prevTopPinnedCachedRowObjects) {
                                if (rowObj?.uid === currentTempRow?.uid) {
                                    cachedRowObject = rowObj as IRow<ColumnProps<T>>;
                                    break;
                                }
                            }
                        } else {
                            const rowIndex: number = currentTempRow.rowIndex + pinningModule.pinningActionInfo.current.topDiffer;
                            cachedRowObject = cachedRowObjects.current.get(rowIndex);
                        }
                    }
                    if (!cachedRowObject) {
                        totalRenderedRowHeight.current += currentTempRow?.height ?? 0;
                    } else if (cachedRowObject.height !== currentTempRow?.height) {
                        totalRenderedRowHeight.current = (totalRenderedRowHeight.current - cachedRowObject.height) +
                            (currentTempRow?.height ?? 0);
                    }
                    if (currentTempRow) {
                        const rowToCache: IRow<ColumnProps<T>> | undefined = pinningModule?.dynamicallyChangedPinnedRows.current &&
                        !pinBucket ? tempRowOptions[renderedIndexForCache + pinningModule?.dynamicallyChangedPinnedRowsCount.current] : {
                                ...currentTempRow
                            };
                        if (rowToCache) {
                            cachedRowObjects.current.set(currentTempRow.rowIndex, rowToCache);
                        }
                    }
                    if (virtualSettings.enableRow) {
                        if (renderedRowHeight > contentHeight) {
                            buffer++;
                        }
                    } else if (!virtualSettings.preventMaxRenderedRows) {
                        if (enableDevMode && !buffer) {
                            console.warn(MAX_ROWS_LIMIT_WARNING_MESSAGE);
                        }
                        buffer++;
                    }
                    if ((scrollMode === ScrollMode.Virtual || scrollMode === ScrollMode.Infinite) &&
                        !rowOptions[dataRowIndex as number]?.data) {
                        if (scrollModule.virtualRowInfo.requiredRowsRange.length) {
                            scrollModule.virtualRowInfo.requiredRowsRange[1] = ariaRowIndex;
                        } else {
                            scrollModule.virtualRowInfo.requiredRowsRange.push(ariaRowIndex);
                        }
                    }
                }
                const [startRow, endRow]: number[] = scrollModule.virtualRowInfo.requiredRowsRange;
                const isVirtualMode: boolean = (scrollMode === ScrollMode.Virtual || scrollMode === ScrollMode.Infinite);
                const hasValidRows: boolean = !isNullOrUndefined(startRow) && !isNullOrUndefined(endRow);
                const isGroupCollapseAction: boolean = gridAction.requestType === ActionType.Grouping &&
                    ((gridAction as OnGroupArgs).action === 'collapse' || (gridAction as OnGroupArgs).action === 'collapseall');
                if (isVirtualMode && hasValidRows && (scrollModule?.isDataOperationPreventVirtualCache.current || isGroupCollapseAction)) {
                    const pageSize: number = pageSettings.pageSize;
                    const startRowObject: IRow<ColumnProps<T>> = cachedRowObjects.current?.get(startRow ?? endRow);
                    const endRowObject: IRow<ColumnProps<T>> = cachedRowObjects.current?.get(endRow ?? startRow);

                    // Calculate start and end pages based on row range
                    const baseStartRow: number = (startRow ?? endRow);
                    const baseEndRow: number = (endRow ?? startRow);
                    const calcStart: number = baseStartRow  - virtualSettings.rowBuffer;
                    const calcEnd: number = baseEndRow + virtualSettings.rowBuffer;
                    let startPage: number = Math.floor(calcStart / pageSize) + 1;
                    let endPage: number = Math.floor(calcEnd / pageSize) + 1;
                    if (groupSettings.enabled && groupSettings.columns?.length && !startRowObject.data && !endRowObject?.data) {
                        const pageInfo: {
                            startPage: number;
                            endPage: number;
                        } = getPageFromRowIndex(calcStart, calcEnd, loadedPageWiseVirtualGroupStartEndRowIndexes.current);
                        startPage = pageInfo.startPage;
                        endPage = pageInfo.endPage;
                    }
                    requestAnimationFrame(() => {
                        scrollModule.scrollIntoVirtualRowsRangeView(startPage, endPage, totalRecordsCount,
                                                                    virtualSettings?.throttleTime); // current page reset on data operation, so that query will combine properly.
                    });
                }
                if (isSpannedColumns || (groupSettings?.enabled && groupSettings?.columns?.length &&
                    groupSettings?.type === GroupType.GroupRows)) {
                    const renderedData: T[] = [];
                    for (let idx: number = 0, spanEnd: number = rowOptions.length; idx < spanEnd; idx++) {
                        const data: T | undefined = rowOptions[parseInt(idx.toString(), 10)]?.data as T;
                        renderedData.push(data);
                    }
                    // Apply span matrix only when columnsArray or data structure changes
                    applySpanMatrix(rows, rowOptions, renderedData, groupSettings?.type === GroupType.SingleColumn ||
                        groupSettings?.type === GroupType.GroupRows ? groupColumn : undefined);
                }
                rowsObjectRef.current = rowOptions;
                return rows;
            }, [columnsDirective, currentViewData, storeRowRef, expansionState, rowHeight, enableAltRow, offsetY, getRowHeight,
                _requireMoreVirtualRowsForceRefresh, scrollMode, virtualSettings?.enableRow, isInitialLoad, groupModule?.groupSettings,
                isSpannedColumns && offsetX, commandColumnModule?.CommandColumnBase, pinBucket, isRowPinned, isRowPinnable,
                pinningSettings?.enabled, resolvedPinnedCounts, editModule?.batchEditModule?.stagedRows]);

            useEffect(() => {
                if (cachedRowObjects.current.size) {
                    if (!virtualSettings.enableRow) {
                        cachedRowObjects.current.clear(); // Clears all entries
                    }
                    else if (pinningModule?.dynamicallyChangedPinnedRows?.current) {
                        const changedPinnedRowsCount: number = pinningModule.dynamicallyChangedPinnedRowsCount?.current ?? 0;
                        const contentCahedRowObjects: Map<number | string, IRow<ColumnProps<T>>> = getContentTableCachedRowObjects();
                        if (changedPinnedRowsCount > 0 && !(pinningModule.pinningActionInfo.current.isUnpinned
                            || pinningModule.pinningActionInfo.current.isBottomPinned)) {
                            Array.from(contentCahedRowObjects.keys()).slice(0, changedPinnedRowsCount)
                                .forEach((key: number | string) => {
                                    contentCahedRowObjects.delete(key);
                                });
                        }
                        if (changedPinnedRowsCount > 0 && pinningModule.pinningActionInfo.current.isUnpinned) {
                            const minKey: number = Math.min(...[...contentCahedRowObjects.keys()] as number[]);
                            const maxKey: number = Math.max(...[...contentCahedRowObjects.keys()] as number[]);
                            if (!pinningModule.pinningActionInfo.current.isBottomUnpinned) {
                                contentCahedRowObjects.delete(maxKey);
                            }
                            if (isNullOrUndefined(contentCahedRowObjects.get(pinningModule.pinningActionInfo.current.topPinnedRowCount))) {
                                contentCahedRowObjects.set(
                                    pinningModule.pinningActionInfo.current.topPinnedRowCount,
                                    contentCahedRowObjects.get(minKey)
                                );
                            }
                        }

                        if (pinningModule) {
                            pinningModule.dynamicallyChangedPinnedRows.current = false;
                            pinningModule.dynamicallyChangedPinnedRowsCount.current = 0;
                            pinningModule.pinningActionInfo.current = {
                                topDiffer: 0,
                                isUnpinned: false,
                                isBottomPinned: false
                            };
                        }
                    }
                }

                if (scrollMode !== ScrollMode.Auto && !scrollModule?.virtualRowInfo?.requiredRowsRange?.length &&
                    !element?.querySelector('.sf-spinner') && !element?.querySelector('.sf-skeleton') &&
                    !scrollModule?.virtualRowInfo?.requiredRowsRange?.length) {
                    selectionModule?.updateHeaderSelectionState?.();
                }
            }, [dataRows]);
            useEffect(() => {
                return () => {
                    totalRenderedRowHeight.current = 0;
                    rowsObjectRef.current = [];
                    rowElementRefs.current = [];
                    cachedRowObjects.current.clear(); // Clears all entries
                };
            }, []);

            return (
                <tbody
                    ref={contentSectionRef}
                    {..._props}
                >
                    {pinBucket === undefined && editModule?.editSettings?.allowAdd && editModule?.editSettings?.newRowPosition === 'Top' && editModule?.editSettings.mode === 'Normal' && inlineAddForm}
                    {dataRows.length > 0 ? dataRows : emptyRowComponent}
                    {pinBucket === undefined && editModule?.editSettings?.allowAdd && editModule?.editSettings?.newRowPosition === 'Bottom' && editModule?.editSettings.mode === 'Normal' && inlineAddForm}
                </tbody>
            );
        }
    )) as (props: Partial<IContentRowsBase> & RefAttributes<ContentRowsRef>) => ReactElement;

/**
 * Set display name for debugging purposes
 */
(ContentRowsBase as ForwardRefExoticComponent<Partial<IContentRowsBase> & RefAttributes<ContentRowsRef>>).displayName = 'ContentRowsBase';

/**
 * Export the ContentRowsBase component for use in other components
 *
 * @private
 */
export { ContentRowsBase };
