import {
    forwardRef,
    useRef,
    useImperativeHandle,
    Children,
    RefAttributes,
    ForwardRefExoticComponent,
    useMemo,
    ReactElement,
    JSX,
    RefObject,
    Ref,
    useEffect
} from 'react';
import { ITooltip, Tooltip } from '@syncfusion/react-popups';
import { SortDirection, RenderRef, ValueType } from '../types';
import { GridProps, GridRef, IGridBase } from '../types/grid.interfaces';
import { PagerArgsInfo } from '../types/page.interfaces';
import { useGridComputedProps } from '../hooks';
import { RenderBase, ConfirmDialog } from '../views';
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
const GridBase: ForwardRefExoticComponent<Partial<IGridBase> & RefAttributes<GridRef>> = forwardRef<GridRef, Partial<IGridBase>>(
    (props: Partial<IGridBase>, ref: Ref<GridRef>) => {
        const gridRef: RefObject<GridRef> = useRef<GridRef>(null);
        const renderExposedRef: RefObject<RenderRef> = useRef<RenderRef>(null);
        const ellipsisTooltipRef: RefObject<ITooltip> = useRef<ITooltip>(null);
        // Update gridRef with render properties when they become available
        useEffect(() => {
            gridRef.current = {
                ...gridRef.current,
                ...renderExposedRef.current,
                columns
            };
        }, [renderExposedRef.current]);
        const { publicAPI, privateAPI, protectedAPI } = useGridComputedProps(props, gridRef, ellipsisTooltipRef);
        const { className, id, columns } = publicAPI;
        const { styles, setCurrentViewData, setCurrentPage,
            setTotalRecordsCount, setGridAction, setInitialLoad } = privateAPI;
        const { columnsDirective } = protectedAPI;

        // Initialize gridRef with all the properties
        if (gridRef.current === null) {
            gridRef.current = {
                // Grid specific properties
                element: null,
                getColumns: () => (protectedAPI?.uiColumns ?? columns).map((col: ColumnProps) => ({...col})),
                currentViewData: [],
                focusModule: protectedAPI.focusModule,
                selectionModule: protectedAPI.selectionModule,
                pageSettings: publicAPI.pageSettings,
                // Filter method
                filterByColumn: (fieldName: string, filterOperator: string,
                                 filterValue: string | number | Date | boolean| number[]| string[]| Date[]| boolean[],
                                 predicate?: string, caseSensitive?: boolean,
                                 ignoreAccent?: boolean) => {
                    protectedAPI.filterModule?.filterByColumn?.(fieldName, filterOperator, filterValue, predicate,
                                                                caseSensitive, ignoreAccent);
                },
                clearFilter: (fields?: string[]) => {
                    protectedAPI.filterModule?.clearFilter?.(fields);
                },
                removeFilteredColsByField: (field?: string, isClearFilterBar?: boolean) => {
                    protectedAPI.filterModule?.removeFilteredColsByField?.(field, isClearFilterBar);
                },

                // Search method
                search: (searchString: string) => {
                    protectedAPI.searchModule.search(searchString);
                },

                // Sort method
                sortByColumn: (columnName: string, sortDirection: SortDirection | string, isMultiSort?: boolean) => {
                    protectedAPI.sortModule?.sortByColumn?.(columnName, sortDirection, isMultiSort);
                },
                removeSortColumn: (columnName: string) => {
                    protectedAPI.sortModule?.removeSortColumn?.(columnName);
                },
                clearSort: () => {
                    protectedAPI.sortModule?.clearSort?.();
                },

                //page Method
                goToPage: async(pageNo: number) => {
                    const args: PagerArgsInfo = { cancel: false, currentPage: pageNo,
                        previousPage: publicAPI.pageSettings.currentPage, requestType: 'paging'
                    };
                    args.type = 'pageChanging';
                    const confirmResult: boolean = await protectedAPI?.editModule?.checkUnsavedChanges?.();
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
                updatePagerMessage: (message: string) => {
                    renderExposedRef.current.pagerModule?.updateExternalMessage(message);
                },
                get selectedRowIndexes(): number[] {
                    return protectedAPI.selectionModule.selectedRowIndexes;
                },
                getSelectedRows: () => {
                    return protectedAPI.selectionModule.selectedRecords as Object[];
                },
                getSelectedRecords: () => {
                    return protectedAPI.selectionModule.getSelectedRecords() as Object[];
                },
                getSelectedRowIndexes: () =>  {
                    return protectedAPI.selectionModule.getSelectedRowIndexes() as number[];
                },
                selectRow: (rowIndex: number, isToggle?: boolean) => {
                    protectedAPI.selectionModule.selectRow(rowIndex, isToggle);
                },
                selectRows: (rowIndexes: number[]) => {
                    protectedAPI.selectionModule.selectRows(rowIndexes);
                },
                selectRowByRange: (startIndex: number, endIndex: number) => {
                    protectedAPI.selectionModule.selectRowByRange(startIndex, endIndex);
                },
                clearRowSelection: (indexes: number[]) => {
                    protectedAPI.selectionModule.clearRowSelection(indexes);
                },
                clearSelection: () => {
                    protectedAPI.selectionModule.clearSelection();
                },

                // Edit methods
                isEdit: protectedAPI.editModule?.isEdit || false,
                editSettings: protectedAPI.editModule?.editSettings || {},
                editRowIndex: protectedAPI.editModule?.editRowIndex || -1,
                editData: (protectedAPI.editModule?.editData as Record<string, ValueType | null> | null) ||
                    null,
                editRow: protectedAPI.editModule?.editRow,
                saveChanges: protectedAPI.editModule?.saveChanges,
                cancelChanges: protectedAPI.editModule?.cancelChanges,
                addRecord: protectedAPI.editModule?.addRecord,
                deleteRecord: protectedAPI.editModule?.deleteRecord,
                setRowData: publicAPI.setRowData,
                updateRow: protectedAPI.editModule?.updateRow,
                setCellValue: publicAPI.setCellValue,
                validateEditForm: protectedAPI.editModule?.validateEditForm,
                validateField: protectedAPI.editModule?.validateField,

                // Include all public API computed properties
                ...publicAPI,
                ...renderExposedRef.current
            };
        }

        // Update gridRef with render properties when they become available
        useEffect(() => {
            gridRef.current = {
                ...gridRef.current,
                columns: (protectedAPI?.uiColumns ?? columns).map((col: ColumnProps) => ({...col})),
                getColumns: () => (protectedAPI?.uiColumns ?? columns).map((col: ColumnProps) => ({...col})),
                currentViewData: protectedAPI?.currentViewData,
                editModule: protectedAPI.editModule,
                // Update edit methods directly on gridRef
                isEdit: protectedAPI.editModule?.isEdit,
                editSettings: protectedAPI.editModule?.editSettings,
                editRowIndex: protectedAPI.editModule?.editRowIndex,
                editData: protectedAPI.editModule?.editData as Record<string, ValueType | null> | null
            };
            gridRef.current.pageSettings.currentPage = protectedAPI.currentPage;
            gridRef.current.pageSettings.totalRecordsCount = protectedAPI.totalRecordsCount;
        }, [protectedAPI.currentPage, protectedAPI.totalRecordsCount, protectedAPI.editModule, protectedAPI.uiColumns]);

        // Expose gridRef directly through ref
        useImperativeHandle(ref, () => ({
            ...gridRef.current,
            ...renderExposedRef.current,
            getHeaderContent: () => renderExposedRef.current.headerPanelRef,
            getContent: () => renderExposedRef.current.contentPanelRef,
            isEdit: protectedAPI.editModule?.isEdit,
            editRow: protectedAPI.editModule?.editRow,
            saveChanges: protectedAPI.editModule?.saveChanges,
            cancelChanges: protectedAPI.editModule?.cancelChanges,
            addRecord: protectedAPI.editModule?.addRecord,
            deleteRecord: protectedAPI.editModule?.deleteRecord,
            setRowData: publicAPI.setRowData,
            updateRow: protectedAPI.editModule?.updateRow,
            setCellValue: publicAPI.setCellValue,
            validateEditForm: protectedAPI.editModule?.validateEditForm,
            validateField: protectedAPI.editModule?.validateField,
            getCurrentViewRecords: () => protectedAPI?.currentViewData,
            get selectedRowIndexes(): number[] {
                return protectedAPI.selectionModule.selectedRowIndexes;
            }
        }), [gridRef.current, renderExposedRef.current, protectedAPI, publicAPI]);

        // Calculate column count for accessibility
        const colCount: number = useMemo(() => {
            return Children.count(((columnsDirective).props as { children: ReactElement }).children);
        }, [columnsDirective]);

        // Conditionally render ellipsis tooltip only when needed
        const ellipsisTooltip: JSX.Element | null = useMemo(() => {
            if (!privateAPI.isEllipsisTooltip) {
                return null;
            }
            return (
                <Tooltip
                    key={id + '_EllipsisTooltip'}
                    ref={ellipsisTooltipRef}
                    opensOn={'Custom'}
                    className={`sf-gridellipsis-tooltip ${protectedAPI.cssClass}`}
                    target={undefined}
                    content={() => <div>{privateAPI.getEllipsisTooltipContent()}</div>}
                />
            );
        }, [privateAPI.isEllipsisTooltip, id, protectedAPI.cssClass, privateAPI.getEllipsisTooltipContent]);

        // Memoize render component to prevent unnecessary re-renders
        const renderComponent: JSX.Element = useMemo(() => {
            return (
                <RenderBase
                    ref={renderExposedRef}
                    children={((columnsDirective).props as { children: ReactElement }).children}
                />
            );
        }, [columnsDirective]);

        return (
            <GridComputedProvider grid={useMemo(() => ({
                ...gridRef.current, ...publicAPI, setCurrentViewData, setCurrentPage,
                setTotalRecordsCount, setGridAction, setInitialLoad
            }), [publicAPI, setCurrentViewData, setCurrentPage,
                setTotalRecordsCount, setGridAction, setInitialLoad])}>
                <GridMutableProvider grid={protectedAPI}>
                    <div
                        ref={(el: HTMLDivElement) => {
                            gridRef.current.element = el;
                        }}
                        id={id}
                        className={className}
                        role='grid'
                        tabIndex={-1}
                        aria-colcount={colCount}
                        aria-rowcount={protectedAPI?.currentViewData?.length}
                        style={styles}
                        onMouseOut={privateAPI.handleGridMouseOut}
                        onMouseOver={privateAPI.handleGridMouseOver}
                        onMouseDown={privateAPI.handleGridMouseDown}
                        onKeyDown={publicAPI.allowKeyboard ? privateAPI.handleGridKeyDown : undefined}
                        onKeyUp={privateAPI.handleGridKeyUp}
                        onClick={privateAPI.handleGridClick}
                        onDoubleClick={privateAPI.handleGridDoubleClick}
                        onFocus={privateAPI.handleGridFocus}
                        onBlur={privateAPI.handleGridBlur}
                        onMouseUp={props.onMouseUp}
                    >
                        {renderComponent}
                        {ellipsisTooltip}
                        {/* Add ConfirmDialog component for inline editing confirmation dialogs */}
                        {protectedAPI.editModule && protectedAPI.editModule?.isDialogOpen && (
                            <ConfirmDialog
                                isOpen={protectedAPI.editModule?.isDialogOpen}
                                config={protectedAPI.editModule?.dialogConfig}
                                onConfirm={protectedAPI.editModule?.onDialogConfirm}
                                onCancel={protectedAPI.editModule?.onDialogCancel}
                            />
                        )}
                    </div>
                </GridMutableProvider>
            </GridComputedProvider>
        );
    }
);

/**
 * Grid component that provides a data grid with sorting, filtering, and other features.
 * Wraps the GridBase component with a Provider for localization and RTL support.
 *
 * @param {Partial<GridProps>} props - Configuration for the grid
 * @param {RefObject<GridRef>} ref - Forwarded ref that exposes imperative methods
 * @returns {JSX.Element} The rendered grid component
 */
export const Grid: ForwardRefExoticComponent<Partial<GridProps> & RefAttributes<GridRef>> = forwardRef<GridRef, Partial<GridProps>>(
    (props: Partial<GridProps>, ref: Ref<GridRef>) => {
        return (
            <GridBase ref={ref} {...props} />
        );
    });

export { GridBase };

Grid.displayName = 'Grid';
GridBase.displayName = 'GridBase';
