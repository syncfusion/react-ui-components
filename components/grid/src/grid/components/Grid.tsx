import {
    forwardRef,
    useRef,
    useImperativeHandle,
    Children,
    RefAttributes,
    ForwardRefExoticComponent,
    useMemo,
    useCallback,
    ReactElement,
    JSX,
    RefObject,
    Ref,
    useEffect
} from 'react';
import { ITooltip, Tooltip } from '@syncfusion/react-popups';
import { SortDirection, RenderRef, ValueType, ActionType, UseDataResult, ScrollMode, RowCellInfo, CellIdentifier } from '../types';
import { GridProps, GridRef, IGridBase } from '../types/grid.interfaces';
import { PagerArgsInfo } from '../types/page.interfaces';
import { useGridComputedProps } from '../hooks';
import { RenderBase, ConfirmDialog, DeleteDialog } from '../views';
import { ColumnProps } from '../types/column.interfaces';
import { GridComputedProvider, GridMutableProvider } from '../contexts';

/**
 * The Syncfusion React Grid component is a feature-rich, customizable data grid for building responsive, high-performance applications.
 * It supports advanced functionalities like sorting, filtering, paging, and editing, with flexible data binding to local or remote data sources.
 * Key features include customizable columns, aggregates, row templates, and built-in support for localization.
 * The component offers a robust API with methods for dynamic data manipulation and events for handling user interactions.
 *
 * ```typescript
 * import { Grid, Columns, Column } from '@syncfusion/react-grid';
 *
 * <Grid dataSource={data} pageSettings={{ enabled: true }}>
 *      <Columns>
 *          <Column field="OrderID" headerText="Order ID" width="120" textAlign="Right"/>
 *          <Column field="CustomerName" headerText="Customer Name" width="120"/>
 *          <Column field="Freight" format="C2" width="120" textAlign="Right"/>
 *          <Column field="OrderDate" headerText="Order Date" format="yMd" width="120" textAlign="Right"/>
 *          <Column field="ShipCountry" headerText="Ship Country" width="140"/>
 *      </Columns>
 * </Grid>
 * ```
 */
const GridBase: <T, >(props: Partial<IGridBase<T>> & RefAttributes<GridRef<T>>) => ReactElement =
    forwardRef<GridRef, Partial<IGridBase<unknown>>>(<T, >(props: Partial<IGridBase<T>>, ref: Ref<GridRef<T>>) => {
        const gridRef: RefObject<GridRef<T>> = useRef<GridRef<T>>(null);
        const renderExposedRef: RefObject<RenderRef<T>> = useRef<RenderRef<T>>(null);
        const ellipsisTooltipRef: RefObject<ITooltip> = useRef<ITooltip>(null);
        // Update gridRef with render properties when they become available
        useEffect(() => {
            gridRef.current = {
                ...gridRef.current,
                ...renderExposedRef.current,
                columns
            };
        }, [renderExposedRef.current]);
        const { gridAPI, gridInternal, gridScoped } = useGridComputedProps(props, gridRef, ellipsisTooltipRef);
        const { className, id, columns } = gridAPI;
        const { styles, setCurrentViewData, setCurrentPage,
            setTotalRecordsCount, setGridAction, setInitialLoad } = gridInternal;
        const { columnsDirective, groupModule } = gridScoped;

        // Initialize gridRef with all the properties
        if (gridRef.current === null) {
            gridRef.current = {
                // Grid specific properties
                element: null,
                getColumns: () => (gridScoped?.uiColumns.current ?? columns).map((col: ColumnProps<T>) => ({...col})),
                currentViewData: [],
                focusModule: gridScoped.focusModule,
                selectionModule: gridScoped.selectionModule,
                cellSelectionModule: gridScoped.cellSelectionModule,
                pageSettings: gridAPI.pageSettings,
                // Filter method
                filterByColumn: (fieldName: string, filterOperator: string,
                                 filterValue: ValueType| number[]| string[]| Date[]| boolean[],
                                 predicate?: string, caseSensitive?: boolean,
                                 ignoreAccent?: boolean) => {
                    gridScoped.filterModule?.filterByColumn?.(fieldName, filterOperator, filterValue, predicate
                        , caseSensitive, ignoreAccent);
                },
                clearFilter: (fields?: string[]) => {
                    gridScoped.filterModule?.clearFilter?.(fields);
                },
                removeFilteredColsByField: (field?: string, isClearFilterBar?: boolean) => {
                    gridScoped.filterModule?.removeFilteredColsByField?.(field, isClearFilterBar);
                },

                // Search method
                search: (searchString: string) => {
                    gridScoped.searchModule.search(searchString);
                },

                // Sort method
                sortByColumn: (columnName: string, sortDirection: SortDirection | string, isMultiSort?: boolean) => {
                    gridScoped.sortModule?.sortByColumn?.(columnName, sortDirection, isMultiSort);
                },
                removeSortColumn: (columnName: string) => {
                    gridScoped.sortModule?.removeSortColumn?.(columnName);
                },
                clearSort: (fields?: string[]) => {
                    gridScoped.sortModule?.clearSort?.(fields);
                },

                //page Method
                goToPage: async(pageNo: number) => {
                    const args: PagerArgsInfo = { cancel: false, currentPage: pageNo,
                        previousPage: gridAPI.pageSettings.currentPage, requestType: ActionType.Paging
                    };
                    args.type = 'pageChanging';
                    const confirmResult: boolean = gridAPI.virtualizationSettings?.scrollMode === ScrollMode.Virtual ||
                        gridAPI.virtualizationSettings?.scrollMode === ScrollMode.Infinite ? true :
                        await gridScoped?.editModule?.checkUnsavedChanges?.();
                    if (!confirmResult) {
                        return;
                    }
                    props.onPageChangeStart?.(args);
                    if (args.cancel) {
                        return;
                    }
                    setCurrentPage(pageNo);
                    setGridAction(args);
                },
                setPagerMessage: (message: string) => {
                    renderExposedRef.current?.pagerModule?.updateExternalMessage(message);
                },
                getDataModule: () => {
                    return gridScoped.dataModule as UseDataResult;
                },
                get selectedRowIndexes(): number[] {
                    return gridScoped.selectionModule.selectedRowIndexes;
                },
                getSelectedRows: () => {
                    return gridScoped.selectionModule.selectedRows as HTMLTableRowElement[];
                },
                getSelectedRecords: () => {
                    return gridScoped.selectionModule.getSelectedRecords() as T[];
                },
                getPersistSelectedData: () => {
                    return gridScoped.selectionModule.getPersistSelectedData() as T[];
                },
                getSelectedRowIndexes: () =>  {
                    return gridScoped.selectionModule.getSelectedRowIndexes() as number[];
                },
                getCurrentViewRecords: () => gridScoped?.currentViewData as T[],
                selectRow: (rowIndex: number, isToggle?: boolean) => {
                    gridScoped.selectionModule.selectRow(rowIndex, isToggle);
                },
                selectRows: (rowIndexes: number[]) => {
                    gridScoped.selectionModule.selectRows(rowIndexes);
                },
                selectRowByRange: (startIndex: number, endIndex: number) => {
                    gridScoped.selectionModule.selectRowByRange(startIndex, endIndex);
                },
                clearRowSelection: (indexes: number[]) => {
                    gridScoped.selectionModule.clearRowSelection(indexes);
                },
                clearSelection: () => {
                    gridScoped.selectionModule.clearSelection();
                },

                // Edit methods
                isEdit: gridScoped.editModule?.isEdit || false,
                editSettings: gridScoped.editModule?.editSettings || {},
                editRowIndex: gridScoped.editModule?.editRowIndex || -1,
                editData: (gridScoped.editModule?.editData as T | null) ||
                    null,
                editRecord: gridScoped.editModule?.editRecord,
                saveDataChanges: gridScoped.editModule?.saveDataChanges,
                cancelDataChanges: gridScoped.editModule?.cancelDataChanges,
                addRecord: gridScoped.editModule?.addRecord,
                deleteRecord: gridScoped.editModule?.deleteRecord,
                setRowData: gridAPI.setRowData,
                updateRecord: gridScoped.editModule?.updateRecord,
                setCellValue: gridAPI.setCellValue,
                validateEditForm: gridScoped.editModule?.validateEditForm,
                validateField: gridScoped.editModule?.validateField,
                expandedGroupCountRef: gridScoped.expandedGroupCountRef,

                // Include all public API computed properties
                ...gridAPI,
                ...renderExposedRef.current
            };
        }

        // Update gridRef with render properties when they become available
        useEffect(() => {
            gridRef.current = {
                ...gridRef.current,
                columns: (gridScoped?.uiColumns.current ?? columns).map((col: ColumnProps<T>) => ({...col})),
                getColumns: () => (gridScoped?.uiColumns.current ?? columns).map((col: ColumnProps<T>) => ({...col})),
                currentViewData: gridScoped?.currentViewData as T[],
                editModule: gridScoped.editModule,
                // Update edit methods directly on gridRef
                isEdit: gridScoped.editModule?.isEdit,
                editSettings: gridScoped.editModule?.editSettings,
                editRowIndex: gridScoped.editModule?.editRowIndex,
                editData: gridScoped.editModule?.editData as T | null,
                getCurrentViewRecords: () => gridScoped?.currentViewData as T[]
            };
            gridRef.current.pageSettings.currentPage = gridScoped.currentPage;
            gridRef.current.pageSettings.totalRecordsCount = gridScoped.totalRecordsCount;
        }, [gridScoped.currentPage, gridScoped.totalRecordsCount, gridScoped.editModule, gridScoped.uiColumns.current, groupModule]);

        /**
         * Memoized ref callback to attach DOM element to gridRef
         * Updates gridRef.element without creating new function on every render
         */
        const attachGridElement: (el: HTMLDivElement) => void = useCallback((el: HTMLDivElement) => {
            if (gridRef.current) {
                gridRef.current.element = el;
            }
        }, []);

        // Expose gridRef directly through ref
        useImperativeHandle(ref, () => ({
            ...gridRef.current,
            ...renderExposedRef.current,
            getHeaderContent: () => renderExposedRef.current.headerPanelRef,
            getContent: () => renderExposedRef.current.contentPanelRef,
            isEdit: gridScoped.editModule?.isEdit,
            editRecord: gridScoped.editModule?.editRecord,
            saveDataChanges: (rowElement?: HTMLTableRowElement) => {
                return (gridScoped.editModule?.saveDataChanges as Function)?.(
                    undefined, undefined, undefined,
                    gridScoped.commandColumnModule.commandEdit.current ? rowElement?.getAttribute('data-uid') : undefined
                );
            },
            cancelDataChanges: (rowElement?: HTMLTableRowElement) => {
                return (gridScoped.editModule?.cancelDataChanges as Function)?.(
                    undefined, gridScoped.commandColumnModule.commandEdit.current ? rowElement?.getAttribute('data-uid') : undefined
                );
            },
            addRecord: gridScoped.editModule?.addRecord,
            deleteRecord: gridScoped.editModule?.deleteRecord,
            // Cell Edit Mode methods
            editCell: gridScoped.editModule?.editCell,
            saveCellChanges: gridScoped.editModule?.saveCellChanges,
            cancelCellChanges: gridScoped.editModule?.cancelCellChanges,
            setRowData: gridAPI.setRowData,
            updateRecord: gridScoped.editModule?.updateRecord,
            setCellValue: gridAPI.setCellValue,
            validateEditForm: gridScoped.editModule?.validateEditForm,
            validateField: gridScoped.editModule?.validateField,
            getCurrentViewRecords: () => gridScoped?.currentViewData as T[],
            get selectedRowIndexes(): number[] {
                return gridScoped.selectionModule.selectedRowIndexes;
            },
            // Cell selection methods
            selectCell: (rowKey: string | number, fieldName: string) => {
                gridScoped.cellSelectionModule?.selectCell(rowKey, fieldName);
            },
            selectCells: (cells: RowCellInfo[]) => {
                gridScoped.cellSelectionModule?.selectCells(cells);
            },
            selectCellsByRange: (start: CellIdentifier, end: CellIdentifier) => {
                gridScoped.cellSelectionModule?.selectCellsByRange(start, end);
            },
            clearCellSelection: () => {
                gridScoped.cellSelectionModule?.clearCellSelection();
            },
            getSelectedCellsData: () => {
                return gridScoped.cellSelectionModule?.getSelectedCellsData?.();
            },
            // Grouping methods and state (ATOMIC pattern: exposed directly)
            groupColumn: groupModule.groupColumn,
            ungroupColumn: groupModule.ungroupColumn,
            clearGrouping: groupModule.clearGrouping,
            expandAll: groupModule.expandAll,
            collapseAll: groupModule.collapseAll,
            // Expose grouping state for ContentRows integration
            isGroupExpanded: groupModule.isGroupExpanded,
            expandedGroupCountRef: gridScoped.expandedGroupCountRef
        }), [gridRef.current, renderExposedRef.current, gridScoped, gridAPI]);

        // Calculate column count for accessibility
        const colCount: number = useMemo(() => {
            return Children.count(((columnsDirective).props as { children: ReactElement }).children);
        }, [columnsDirective]);

        // Conditionally render ellipsis tooltip only when needed
        const ellipsisTooltip: JSX.Element | null = useMemo(() => {
            if (!gridInternal.isEllipsisTooltip) {
                return null;
            }
            return (
                <Tooltip
                    key={id + '_EllipsisTooltip'}
                    ref={ellipsisTooltipRef}
                    opensOn={'Custom'}
                    className={`sf-ellipsis-tooltip ${gridScoped.cssClass}`}
                    target={undefined}
                    content={() => <div>{gridInternal.getEllipsisTooltipContent()}</div>}
                />
            );
        }, [gridInternal.isEllipsisTooltip, id, gridScoped.cssClass, gridInternal.getEllipsisTooltipContent]);

        // Memoize render component to prevent unnecessary re-renders
        const renderComponent: JSX.Element = useMemo(() => {
            return (
                <RenderBase<T>
                    ref={renderExposedRef}
                    children={((columnsDirective).props as { children: ReactElement }).children}
                />
            );
        }, [columnsDirective]);

        return (
            <GridComputedProvider<T> grid={useMemo(() => ({
                ...gridRef.current, ...gridAPI, setCurrentViewData, setCurrentPage,
                setTotalRecordsCount, setGridAction, setInitialLoad,
                openColumnChooser: renderExposedRef.current?.openColumnChooser
            }), [gridAPI, setCurrentViewData, setCurrentPage,
                setTotalRecordsCount, setGridAction, setInitialLoad, renderExposedRef.current?.openColumnChooser])}>
                <GridMutableProvider<T> grid={gridScoped}>
                    <div
                        ref={attachGridElement}
                        id={id}
                        className={className}
                        role='grid'
                        tabIndex={-1}
                        aria-colcount={colCount}
                        aria-rowcount={gridScoped?.currentViewData?.length}
                        aria-busy={renderExposedRef.current?.isContentBusy}
                        style={styles}
                        onMouseOut={gridInternal.handleGridMouseOut}
                        onMouseOver={gridInternal.handleGridMouseOver}
                        onMouseDown={gridInternal.handleGridMouseDown}
                        onKeyDown={gridAPI.allowKeyboard ? gridInternal.handleGridKeyDown : undefined}
                        onKeyUp={gridInternal.handleGridKeyUp}
                        onClick={gridInternal.handleGridClick}
                        onDoubleClick={gridInternal.handleGridDoubleClick}
                        onFocus={gridInternal.handleGridFocus}
                        onBlur={gridInternal.handleGridBlur}
                        onMouseUp={props.onMouseUp}
                    >
                        {renderComponent}
                        {ellipsisTooltip}
                        {/* Add ConfirmDialog component for inline editing confirmation dialogs */}
                        {gridScoped.editModule && gridScoped.editModule?.isDialogOpen && (
                            <ConfirmDialog
                                isOpen={gridScoped.editModule?.isDialogOpen}
                                config={gridScoped.editModule?.dialogConfig}
                                onConfirm={gridScoped.editModule?.onDialogConfirm}
                                onCancel={gridScoped.editModule?.onDialogCancel}
                            />
                        )}
                        {/* Add DeleteDialog component for selection-based delete operations */}
                        {gridScoped.editModule && gridScoped.editModule?.isDeleteDialogOpen &&
                            gridAPI.selectionSettings?.persistSelection && (
                            <DeleteDialog
                                isOpen={gridScoped.editModule?.isDeleteDialogOpen || false}
                                onConfirm={gridScoped.editModule?.onSelectionDeleteConfirm}
                                onCancel={gridScoped.editModule?.onSelectionDeleteCancel}
                                onDialogOpen={gridAPI.onDeleteDialogOpen}
                            />
                        )}
                    </div>
                </GridMutableProvider>
            </GridComputedProvider>
        );
    }
    ) as <T, >(props: Partial<IGridBase<T>> & RefAttributes<GridRef<T>>) => ReactElement;

/**
 * Grid component that provides a data grid with sorting, filtering, and other features.
 * Wraps the GridBase component with a Provider for localization and RTL support.
 *
 * @param {Partial<GridProps>} props - Configuration for the grid
 * @param {RefObject<GridRef>} ref - Forwarded ref that exposes imperative methods
 * @returns {JSX.Element} The rendered grid component
 */
export const Grid: <T>(props: Partial<GridProps<T>> & RefAttributes<GridRef<T>>) => ReactElement | null =
    forwardRef<GridRef, Partial<GridProps>>(
        <T, >(props: Partial<GridProps<T>>, ref: Ref<GridRef<T>>) => {
            return (
                <GridBase<T> ref={ref} {...props} />
            );
        }) as <T>(props: Partial<GridProps<T>> & RefAttributes<GridRef<T>>) => ReactElement | null;

export { GridBase };

(Grid as ForwardRefExoticComponent<Partial<GridProps> & RefAttributes<GridRef>>).displayName = 'Grid';
(GridBase as ForwardRefExoticComponent<Partial<IGridBase<unknown>> & RefAttributes<GridRef>>).displayName = 'GridBase';
