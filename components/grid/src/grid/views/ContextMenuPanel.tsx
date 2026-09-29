import { ContextMenu } from '@syncfusion/react-navigations/src/context-menu/context-menu';
import { OffsetPosition } from '@syncfusion/react-navigations/src/context-menu/types';
import { MenuSelectEvent } from '@syncfusion/react-navigations/src/menu/types';
import { MenuItem } from '@syncfusion/react-navigations/src/common/components/menu/menu-item';
import { MenuItemIcon } from '@syncfusion/react-navigations/src/common/components/menu/menu-item-icon';
import { MenuItemLabel } from '@syncfusion/react-navigations/src/common/components/menu/menu-item-label';
import { Spinner } from '@syncfusion/react-popups/src/spinner/spinner';
import { SpinnerType } from '@syncfusion/react-popups/src/spinner/spinner';
import { forwardRef, ForwardRefExoticComponent, memo, ReactElement, ReactNode, RefAttributes, useCallback, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { useGridComputedProvider, useGridMutableProvider } from '../contexts/GridProviders';
import { getApplicableAggregateTypes, isRowPinningEnabled, isColumnPinningEnabled } from '../utils/utils';
import { IL10n } from '@syncfusion/react-base/src/l10n';
import { isNullOrUndefined } from '@syncfusion/react-base/src/util';
import { ColumnProps } from '../types/column.interfaces';
import { IRow } from '../types/interfaces';
import { ContextMenuOpenEvent, ContextMenuParentItem, ContextMenuPanelRef, ContextMenuArgs, ContextMenuItemProps, ContextMenuClickEvent } from '../types/context.interfaces';
import { AggregateColumnProps, AggregateRowProps } from '../types/aggregate.interfaces';
import { AggregateType, ColumnPinDirection, ContextMenuItem } from '../types/enum';
import { SaveIcon } from '@syncfusion/react-icons/src/icons/save';
import { CloseIcon } from '@syncfusion/react-icons/src/icons/close';
import { EditIcon } from '@syncfusion/react-icons/src/icons/edit';
import { TrashIcon } from '@syncfusion/react-icons/src/icons/trash';
import { ChevronLeftDoubleIcon } from '@syncfusion/react-icons/src/icons/chevron-left-double';
import { ChevronLeftIcon } from '@syncfusion/react-icons/src/icons/chevron-left';
import { ChevronRightDoubleIcon } from '@syncfusion/react-icons/src/icons/chevron-right-double';
import { ChevronRightIcon } from '@syncfusion/react-icons/src/icons/chevron-right';
import { SortAscendingListIcon } from '@syncfusion/react-icons/src/icons/sort-ascending-list';
import { SortDescendingListIcon } from '@syncfusion/react-icons/src/icons/sort-descending-list';
import { TableCellIcon } from '@syncfusion/react-icons/src/icons/table-cell';
import { ClearSortIcon } from '@syncfusion/react-icons/src/icons/clear-sort';
import { ClearAllIcon } from '@syncfusion/react-icons/src/icons/clear-all';
import { ClearRowSelectionIcon } from '@syncfusion/react-icons/src/icons/clear-row-selection';
import { FreezeRowIcon } from '@syncfusion/react-icons/src/icons/freeze-row';
import { ArrowDownIcon } from '@syncfusion/react-icons/src/icons/arrow-down';
import { ArrowUpIcon } from '@syncfusion/react-icons/src/icons/arrow-up';
import { PinIcon } from '@syncfusion/react-icons/src/icons/pin';
import { UnpinIcon } from '@syncfusion/react-icons/src/icons/unpin';
import { ArrowRightIcon } from '@syncfusion/react-icons/src/icons/arrow-right';
import { ArrowLeftIcon } from '@syncfusion/react-icons/src/icons/arrow-left';
import { ChartIcon } from '@syncfusion/react-icons/src/icons/chart';
import { Chart2dLineIcon } from '@syncfusion/react-icons/src/icons/chart-2d-line';
import { Chart2dStackedLineIcon } from '@syncfusion/react-icons/src/icons/chart-2d-stacked-line';
import { Chart2d100PercentStackedLineIcon } from '@syncfusion/react-icons/src/icons/chart-2d-100-percent-stacked-line';
import { Chart2dAreaIcon } from '@syncfusion/react-icons/src/icons/chart-2d-area';
import { Chart2dStackedAreaIcon } from '@syncfusion/react-icons/src/icons/chart-2d-stacked-area';
import { Chart2d100PercentStackedAreaIcon } from '@syncfusion/react-icons/src/icons/chart-2d-100-percent-stacked-area';
import { Chart2dClusteredColumnIcon } from '@syncfusion/react-icons/src/icons/chart-2d-clustered-column';
import { Chart2dStackedColumnIcon } from '@syncfusion/react-icons/src/icons/chart-2d-stacked-column';
import { Chart2d100PercentStackedColumnIcon } from '@syncfusion/react-icons/src/icons/chart-2d-100-percent-stacked-column';
import { Chart2dClusteredBarIcon } from '@syncfusion/react-icons/src/icons/chart-2d-clustered-bar';
import { Chart2dStackedBarIcon } from '@syncfusion/react-icons/src/icons/chart-2d-stacked-bar';
import { Chart2d100PercentStackedBarIcon } from '@syncfusion/react-icons/src/icons/chart-2d-100-percent-stacked-bar';
import { Chart2dPie2Icon } from '@syncfusion/react-icons/src/icons/chart-2d-pie-2';
import { ChartScatter } from '@syncfusion/react-icons/src/icons/chart-scatter';

/**
 * ContextMenuPanelBase component manages the right-click context menu for grid interactions.
 * Dynamically displays context menu items based on the clicked element, current grid state, and column configuration.
 * Executes actions like Edit, Delete, Sort, Pagination, and Row Selection when menu items are clicked.
 *
 * @component
 * @private
 * @param {RefAttributes<ContextMenuPanelRef>} props - Component props (unused, context providers are used instead)
 * @param {React.ForwardedRef<ContextMenuPanelRef>} ref - Forwarded ref exposing methods: showContextMenu(args), hideContextMenu()
 * @returns {ReactElement} A memoized Syncfusion ContextMenu component configured for grid context menu functionality
 */
const ContextMenuPanelBase: (props: RefAttributes<ContextMenuPanelRef>) => ReactElement =
    memo(forwardRef<ContextMenuPanelRef>((_props: {}, ref: React.ForwardedRef<ContextMenuPanelRef>) => {

        const { id, element, serviceLocator, contextMenuSettings, onContextMenuClick, onContextMenuOpen, onContextMenuClose, selectRow,
            getRowObjectFromUID, getPrimaryKeyFieldNames, pagerRef, goToPage, getColumnByUid, sortByColumn, getColumns,
            removeSortColumn, getSelectedRowIndexes, clearSelection, selectionSettings, clearRowSelection, selectionModule,
            focusModule, aggregates, refresh, pinRows, unpinRows, pinColumn, unpinColumn, pinningSettings,
            isRowPinnable, enableGridChart } = useGridComputedProvider();
        const isRowPinningActive: () => boolean = () => isRowPinningEnabled(pinningSettings);
        const isColumnPinningActive: () => boolean = () => isColumnPinningEnabled(pinningSettings);
        const { editModule, sortModule, cssClass, commandColumnModule, aggregateSelection } = useGridMutableProvider();

        const className: string = `${contextMenuSettings.menuSettings.className ? contextMenuSettings.menuSettings.className : ''} ${cssClass ? cssClass : ''} sf-grid-contextmenu`;
        const localization: IL10n = serviceLocator?.getService<IL10n>('localization');
        const targetRef: React.RefObject<HTMLDivElement> = useRef(element);
        const [open, setOpen] = useState(false);
        const [showSpinner, setShowSpinner] = useState(false);
        const items: React.RefObject<ContextMenuItemProps[]> = useRef<ContextMenuItemProps[]>([]);
        const targetElement: React.RefObject<HTMLElement> = useRef<HTMLElement>(null);
        const requestedItems: React.RefObject<ContextMenuItem[] | undefined> = useRef<ContextMenuItem[] | undefined>(undefined);
        const offsetPosition: React.RefObject<OffsetPosition> = useRef<OffsetPosition>(null);
        const spinnerPosition: React.RefObject<OffsetPosition> = useRef<OffsetPosition>(null);

        /**
         * Generates a unique ID for context menu items by combining grid ID with menu item type.
         */
        const generateItemID: (item: ContextMenuItem | ContextMenuParentItem) => string =
            useCallback((item: ContextMenuItem | ContextMenuParentItem): string => {
                return `${id}_contextmenu_${item}`;
            }, [id]);

        /**
         * Extracts the context menu item type from a generated menu item ID.
         */
        const getItemKey: (itemID: string) => ContextMenuItem = useCallback((itemID: string): ContextMenuItem => {
            return itemID.replace(`${id}_contextmenu_`, '') as ContextMenuItem;
        }, [id]);

        /**
         * Retrieves the column configuration object for the cell where the context menu was triggered.
         */
        const getColumn: () => ColumnProps | undefined = useCallback(() => {
            const cell: HTMLElement | null = targetElement.current.closest('.sf-cell');

            if (!cell) {
                return undefined;
            }

            if (cell.hasAttribute('data-mappinguid')) {
                return getColumnByUid(cell.getAttribute('data-mappinguid'));
            }
            const visibleColumns: ColumnProps[] = getColumns()?.filter((col: ColumnProps) => col.visible !== false) ?? [];
            return cell.hasAttribute('aria-colindex')
                ? visibleColumns[parseInt(cell.getAttribute('aria-colindex'), 10) - 1]
                : undefined;
        }, [getColumnByUid, getColumns]);

        /**
         * Retrieves the row data object for the row where the context menu was triggered.
         */
        const getRowObject: () => IRow<ColumnProps> = useCallback((): IRow<ColumnProps> => {
            const contentRow: Element = targetElement.current.closest('.sf-grid-content-row');
            return contentRow ? getRowObjectFromUID(contentRow.getAttribute('data-uid')) : undefined;
        }, [getRowObjectFromUID]);

        /**
         * Maps pagination context menu items to their corresponding CSS selectors for the pager module.
         */
        const getPagerClass: (item: ContextMenuItem) => string = useCallback((item: ContextMenuItem): string => {
            return item === 'FirstPage' ? '.sf-pager-first' : item === 'PrevPage' ? '.sf-pager-previous'
                : item === 'LastPage' ? '.sf-pager-last' : '.sf-pager-next';
        }, []);

        /**
         * Retrieves the aggregate row index from the element.
         */
        const getAggregateRowIndex: () => number = useCallback((): number => {
            return (targetElement.current?.closest('.sf-grid-summary-row') as HTMLTableRowElement)?.rowIndex ?? -1;
        }, []);

        /**
         * Finds the aggregate column that matches the clicked column.
         * Prioritizes columnName (display location) over field (source field).
         */
        const getMatchingAggregateColumn: (columns: AggregateColumnProps[], columnField: string) => AggregateColumnProps | undefined =
            useCallback((columns: AggregateColumnProps[], columnField: string): AggregateColumnProps | undefined => {
                return columns.find((col: AggregateColumnProps) => {
                    if (col.columnName) {
                        return col.columnName === columnField;
                    }
                    return col.field === columnField;
                });
            }, []);

        /**
         * Determines visibility for aggregate menu items.
         */
        const isAggregateItemVisible: (item: ContextMenuItem) => boolean =
            useCallback((item: ContextMenuItem): boolean => {
                const rowIndex: number = getAggregateRowIndex();
                const column: ColumnProps = getColumn();
                if (rowIndex < 0 || !column) {
                    return false;
                }
                const row: AggregateRowProps = aggregates[parseInt(rowIndex.toString(), 10)];
                const aggColumn: AggregateColumnProps = getMatchingAggregateColumn(row.columns, column.field);
                if (!aggColumn || (item === 'Custom' && !aggColumn.customAggregate)) {
                    return false;
                }
                const sourceColumn: ColumnProps = getColumns().find((col: ColumnProps) => col.field === aggColumn.field);
                const applicableTypes: AggregateType[] = getApplicableAggregateTypes(sourceColumn?.type);
                return applicableTypes.includes(item as AggregateType);
            }, [getApplicableAggregateTypes, getMatchingAggregateColumn, aggregates, getAggregateRowIndex, getColumn, getColumns]);

        /**
         * Chart type lists for organizing chart menu items into categories.
         * Used to group chart types into submenus (BarChart, ColumnChart, LineChart, AreaChart).
         */
        const barChartList: string[] = ['Bar', 'StackingBar', 'StackingBar100'];
        const pieChartList: string[] = ['Pie'];
        const columnChartList: string[] = ['Column', 'StackingColumn', 'StackingColumn100'];
        const lineChartList: string[] = ['Line', 'StackingLine', 'StackingLine100'];
        const areaChartList: string[] = ['Area', 'StackingArea', 'StackingArea100'];
        const scatterChartList: string[] = ['Scatter'];

        /**
         * Memoized array of all built-in context menu item types available in the grid.
         * Used as default menu items when no custom items are specified via column configuration or settings.
         */
        const defaultItems: ContextMenuItem[] = useMemo((): ContextMenuItem[] => {
            return ['Edit', 'Delete', 'Save', 'Cancel', 'SortAscending', 'SortDescending', 'ClearSort', 'FirstPage', 'PrevPage',
                'LastPage', 'NextPage', 'SelectRow', 'ClearRowSelection', 'ClearSelection', 'Sum', 'Average', 'Min', 'Max',
                'Count', 'TrueCount', 'FalseCount', 'Custom', 'UnpinRow', 'PinToTop', 'PinToBottom',
                'PinToLeft', 'PinToRight', 'UnpinColumn', 'Bar', 'StackingBar', 'StackingBar100', 'Pie', 'Column',
                'StackingColumn', 'StackingColumn100', 'Line', 'StackingLine', 'StackingLine100', 'Area',
                'StackingArea', 'StackingArea100', 'Scatter'];
        }, []);

        /**
         * Column pinning helpers — visible children of the `PinColumn` parent menu
         * are derived from the clicked column's current pin direction:
         * * `Left` → `PinToRight` + `UnpinColumn`
         * * `None` → `PinToLeft` + `PinToRight`
         * * `Right` → `PinToLeft` + `UnpinColumn`
         *
         * @private
         */
        const getColumnPinDirection: () => ColumnPinDirection | undefined = useCallback((): ColumnPinDirection | undefined => {
            const column: ColumnProps = getColumn();
            return column?.pinDirection as ColumnPinDirection | undefined;
        }, [getColumn]);

        /**
         * Memoized mapping of all context menu items to their configuration properties.
         * Contains localized text, icons, target selectors, and generated IDs for each menu item type.
         * Used by the context menu component to render menu items with proper labels, icons, and visibility rules.
         */
        const menuItemsInfo: { [K in ContextMenuItem | ContextMenuParentItem]: ContextMenuItemProps } = useMemo(() => {
            return {
                Edit: { target: '.sf-grid-content-row', text: localization?.getConstant('editRecordLabel'), id: generateItemID('Edit'), icon: <EditIcon /> },
                Delete: { target: '.sf-grid-content-row', text: localization?.getConstant('deleteRecordLabel'), id: generateItemID('Delete'), icon: <TrashIcon /> },
                Save: { target: '.sf-grid-edit-form', text: localization?.getConstant('saveButtonLabel'), id: generateItemID('Save'), icon: <SaveIcon /> },
                Cancel: { target: '.sf-grid-edit-form', text: localization?.getConstant('cancelButtonLabel'), id: generateItemID('Cancel'), icon: <CloseIcon /> },
                FirstPage: { target: '.sf-grid-pager', text: localization?.getConstant('firstPageLabel'), id: generateItemID('FirstPage'), icon: <ChevronLeftDoubleIcon /> },
                PrevPage: { target: '.sf-grid-pager', text: localization?.getConstant('prevPageLabel'), id: generateItemID('PrevPage'), icon: <ChevronLeftIcon /> },
                LastPage: { target: '.sf-grid-pager', text: localization?.getConstant('lastPageLabel'), id: generateItemID('LastPage'), icon: <ChevronRightDoubleIcon /> },
                NextPage: { target: '.sf-grid-pager', text: localization?.getConstant('nextPageLabel'), id: generateItemID('NextPage'), icon: <ChevronRightIcon /> },
                SortAscending: { target: '.sf-grid-header-row', text: localization?.getConstant('sortAscendingLabel'), id: generateItemID('SortAscending'), icon: <SortAscendingListIcon /> },
                SortDescending: { target: '.sf-grid-header-row', text: localization?.getConstant('sortDescendingLabel'), id: generateItemID('SortDescending'), icon: <SortDescendingListIcon /> },
                ClearSort: { target: '.sf-grid-header-row', text: localization?.getConstant('clearSortLabel'), id: generateItemID('ClearSort'), icon: <ClearSortIcon /> },
                ClearSelection: { target: '.sf-grid-content-row', text: localization?.getConstant('clearSelectionLabel'), id: generateItemID('ClearSelection'), icon: <ClearAllIcon /> },
                SelectRow: { target: '.sf-grid-content-row', text: localization?.getConstant('selectRowLabel'), id: generateItemID('SelectRow'), icon: <FreezeRowIcon /> },
                ClearRowSelection: { target: '.sf-grid-content-row', text: localization?.getConstant('clearRowSelectionLabel'), id: generateItemID('ClearRowSelection'), icon: <ClearRowSelectionIcon /> },
                Sum: { target: '.sf-grid-summary-row', text: localization?.getConstant('sumLabel'), id: generateItemID('Sum') },
                Average: { target: '.sf-grid-summary-row', text: localization?.getConstant('averageLabel'), id: generateItemID('Average') },
                Min: { target: '.sf-grid-summary-row', text: localization?.getConstant('minLabel'), id: generateItemID('Min') },
                Max: { target: '.sf-grid-summary-row', text: localization?.getConstant('maxLabel'), id: generateItemID('Max') },
                Count: { target: '.sf-grid-summary-row', text: localization?.getConstant('countLabel'), id: generateItemID('Count') },
                TrueCount: { target: '.sf-grid-summary-row', text: localization?.getConstant('trueCountLabel'), id: generateItemID('TrueCount') },
                FalseCount: { target: '.sf-grid-summary-row', text: localization?.getConstant('falseCountLabel'), id: generateItemID('FalseCount') },
                Custom: { target: '.sf-grid-summary-row', text: localization?.getConstant('customLabel'), id: generateItemID('Custom') },
                Select: { text: localization?.getConstant('selectLabel'), id: generateItemID('Select'), icon: <TableCellIcon /> },
                PinRow: { text: localization?.getConstant('pinRowLabel'), id: generateItemID('PinRow'), icon: <PinIcon /> },
                UnpinRow: { target: '.sf-grid-content-row', text: localization?.getConstant('unpinRowLabel'), id: generateItemID('UnpinRow'), icon: <UnpinIcon /> },
                PinToTop: { target: '.sf-grid-content-row', text: localization?.getConstant('pinToTopLabel'), id: generateItemID('PinToTop'), icon: <ArrowUpIcon /> },
                PinToBottom: { target: '.sf-grid-content-row', text: localization?.getConstant('pinToBottomLabel'), id: generateItemID('PinToBottom'), icon: <ArrowDownIcon /> },
                PinColumn: { text: localization?.getConstant('pinColumnLabel'), id: generateItemID('PinColumn'), icon: <PinIcon /> },
                PinToLeft: { target: '.sf-cell', text: localization?.getConstant('pinToLeftLabel'), id: generateItemID('PinToLeft'), icon: <ArrowLeftIcon /> },
                PinToRight: { target: '.sf-cell', text: localization?.getConstant('pinToRightLabel'), id: generateItemID('PinToRight'), icon: <ArrowRightIcon /> },
                UnpinColumn: { target: '.sf-cell', text: localization?.getConstant('unpinColumnLabel'), id: generateItemID('UnpinColumn'), icon: <UnpinIcon /> },
                Chart: { target: '.sf-grid-content-row', text: localization?.getConstant('chartLabel'), id: generateItemID('Chart'), icon: <ChartIcon /> },
                BarChart: { target: '.sf-grid-content-row', text: localization?.getConstant('barChartLabel'), id: generateItemID('BarChart'), icon: <Chart2dClusteredBarIcon /> },
                Bar: { target: '.sf-grid-content-row', text: localization?.getConstant('barLabel'), id: generateItemID('Bar'), icon: <Chart2dClusteredBarIcon /> },
                StackingBar: { target: '.sf-grid-content-row', text: localization?.getConstant('stackingBarLabel'), id: generateItemID('StackingBar'), icon: <Chart2dStackedBarIcon /> },
                StackingBar100: { target: '.sf-grid-content-row', text: localization?.getConstant('stackingBar100Label'), id: generateItemID('StackingBar100'), icon: <Chart2d100PercentStackedBarIcon /> },
                Pie: { target: '.sf-grid-content-row', text: localization?.getConstant('pieLabel'), id: generateItemID('Pie'), icon: <Chart2dPie2Icon /> },
                ColumnChart: { target: '.sf-grid-content-row', text: localization?.getConstant('columnChartLabel'), id: generateItemID('ColumnChart'), icon: <Chart2dClusteredColumnIcon /> },
                Column: { target: '.sf-grid-content-row', text: localization?.getConstant('columnLabel'), id: generateItemID('Column'), icon: <Chart2dClusteredColumnIcon /> },
                StackingColumn: { target: '.sf-grid-content-row', text: localization?.getConstant('stackingColumnLabel'), id: generateItemID('StackingColumn'), icon: <Chart2dStackedColumnIcon /> },
                StackingColumn100: { target: '.sf-grid-content-row', text: localization?.getConstant('stackingColumn100Label'), id: generateItemID('StackingColumn100'), icon: <Chart2d100PercentStackedColumnIcon /> },
                LineChart: { target: '.sf-grid-content-row', text: localization?.getConstant('lineChartLabel'), id: generateItemID('LineChart'), icon: <Chart2dLineIcon /> },
                Line: { target: '.sf-grid-content-row', text: localization?.getConstant('lineLabel'), id: generateItemID('Line'), icon: <Chart2dLineIcon /> },
                StackingLine: { target: '.sf-grid-content-row', text: localization?.getConstant('stackingLineLabel'), id: generateItemID('StackingLine'), icon: <Chart2dStackedLineIcon /> },
                StackingLine100: { target: '.sf-grid-content-row', text: localization?.getConstant('stackingLine100Label'), id: generateItemID('StackingLine100'), icon: <Chart2d100PercentStackedLineIcon /> },
                AreaChart: { target: '.sf-grid-content-row', text: localization?.getConstant('areaChartLabel'), id: generateItemID('AreaChart'), icon: <Chart2dAreaIcon /> },
                Area: { target: '.sf-grid-content-row', text: localization?.getConstant('areaLabel'), id: generateItemID('Area'), icon: <Chart2dAreaIcon /> },
                StackingArea: { target: '.sf-grid-content-row', text: localization?.getConstant('stackingAreaLabel'), id: generateItemID('StackingArea'), icon: <Chart2dStackedAreaIcon /> },
                StackingArea100: { target: '.sf-grid-content-row', text: localization?.getConstant('stackingArea100Label'), id: generateItemID('StackingArea100'), icon: <Chart2d100PercentStackedAreaIcon /> },
                Scatter: { target: '.sf-grid-content-row', text: localization?.getConstant('scatterLabel'), id: generateItemID('Scatter'), icon: <ChartScatter /> }
            };
        }, [localization, generateItemID]);

        /**
         * Determines if a context menu item should be visible based on the current grid state and context.
         */
        const visible: (item: ContextMenuItem) => boolean = useCallback((item: ContextMenuItem): boolean => {
            const element: HTMLElement = targetElement.current;
            let visible: boolean = true;
            const selectedRowIndexes: number[] = getSelectedRowIndexes();
            const rowObject: IRow<ColumnProps> = getRowObject();
            let sortContainer: Element;
            switch (item) {
            case 'Edit':
            case 'Delete':
                visible = !element.closest('.sf-grid-edit-form');
                break;
            case 'ClearSort':
                visible = !isNullOrUndefined(element.closest('.sf-cell').querySelector('.sf-grid-sort-container'));
                break;
            case 'SortAscending':
            case 'SortDescending':
                sortContainer = element.closest('.sf-cell').querySelector('.sf-grid-sort-container');
                visible = isNullOrUndefined(sortContainer)
                    || (item === 'SortAscending' && !sortContainer.classList.contains('sf-ascending'))
                    || (item === 'SortDescending' && !sortContainer.classList.contains('sf-descending'));
                break;
            case 'ClearSelection':
                visible = !element.closest('.sf-grid-edit-form') && selectedRowIndexes.length > 0;
                break;
            case 'SelectRow':
                visible = !element.closest('.sf-grid-edit-form') && !selectedRowIndexes.includes(rowObject.rowIndex);
                break;
            case 'ClearRowSelection':
                visible = !element.closest('.sf-grid-edit-form') && selectedRowIndexes.includes(rowObject.rowIndex);
                break;
            case 'UnpinRow':
                visible = !element.closest('.sf-grid-edit-form') && isRowPinningActive() &&
                    isRowPinnable?.(rowObject.data) !== false && (
                    rowObject.isPinned && (
                        rowObject.pinBucket === 'top' ||
                        rowObject.pinBucket === 'bottom' ||
                        !!element.closest('.sf-pinned-row-top') ||
                        !!element.closest('.sf-pinned-row-bottom')
                    )
                );
                break;
            case 'PinToTop':
                visible = !element.closest('.sf-grid-edit-form') && isRowPinningActive() &&
                    isRowPinnable?.(rowObject.data) !== false && (
                    rowObject.pinBucket === 'bottom' ||
                    !!element.closest('.sf-pinned-row-bottom') ||
                    (!!element.closest('.sf-grid-content-row') && !rowObject.isPinned && !element.closest('.sf-pinned-row'))
                );
                break;
            case 'PinToBottom':
                visible = !element.closest('.sf-grid-edit-form') && isRowPinningActive() &&
                    isRowPinnable?.(rowObject.data) !== false && (
                    rowObject.pinBucket === 'top' ||
                    !!element.closest('.sf-pinned-row-top') ||
                    (!!element.closest('.sf-grid-content-row') && !rowObject.isPinned && !element.closest('.sf-pinned-row'))
                );
                break;
            case 'PinToLeft':
                visible = !!pinColumn && isColumnPinningActive() && !!element.closest('.sf-cell') &&
                    (getColumnPinDirection() !== ColumnPinDirection.Left);
                break;
            case 'PinToRight':
                visible = !!pinColumn && isColumnPinningActive() && !!element.closest('.sf-cell') &&
                    (getColumnPinDirection() !== ColumnPinDirection.Right);
                break;
            case 'UnpinColumn':
                visible = !!unpinColumn && isColumnPinningActive() && !!element.closest('.sf-cell') &&
                    (getColumnPinDirection() === ColumnPinDirection.Left || getColumnPinDirection() === ColumnPinDirection.Right);
                break;
            case 'Bar':
            case 'StackingBar':
            case 'StackingBar100':
            case 'Pie':
            case 'Column':
            case 'StackingColumn':
            case 'StackingColumn100':
            case 'Line':
            case 'StackingLine':
            case 'StackingLine100':
            case 'Area':
            case 'StackingArea':
            case 'StackingArea100':
            case 'Scatter':
                visible = enableGridChart;
                break;
            case 'Sum':
            case 'Average':
            case 'Min':
            case 'Max':
            case 'Count':
            case 'TrueCount':
            case 'FalseCount':
            case 'Custom': {
                visible = isAggregateItemVisible(item);
                break;
            }
            }
            return visible;
        }, [getSelectedRowIndexes, getRowObject, getColumn, getAggregateRowIndex, isAggregateItemVisible,
            getColumnPinDirection, pinColumn, unpinColumn, pinningSettings, isRowPinnable]);

        /**
         * Determines if a context menu item should be disabled based on the current grid configuration and state.
         */
        const disabled: (item: ContextMenuItem | ContextMenuParentItem) => boolean = useCallback(
            (item: ContextMenuItem | ContextMenuParentItem): boolean => {
                let disabled: boolean = false;
                switch (item) {
                case 'Edit':
                    disabled = !editModule?.editSettings.allowEdit;
                    break;
                case 'Delete':
                    disabled = !editModule?.editSettings.allowDelete;
                    break;
                case 'FirstPage':
                case 'PrevPage':
                case 'LastPage':
                case 'NextPage':
                    disabled = pagerRef?.element.querySelector(getPagerClass(item)).classList.contains('sf-disable');
                    break;
                case 'SortAscending':
                case 'SortDescending':
                    disabled = !(sortModule.sortSettings.enabled && getColumn().allowSort);
                    break;
                case 'SelectRow':
                    disabled = !selectionSettings.enabled;
                    break;
                case 'PinRow':
                    disabled = !pinRows || !isRowPinningActive();
                    break;
                case 'PinColumn':
                    disabled = !pinColumn || !isColumnPinningActive();
                    break;
                }
                return disabled;
            }, [editModule, pagerRef, sortModule, selectionSettings, isRowPinningActive, isColumnPinningActive, pinRows, pinColumn]);

        /**
         * Generates menu items from the provided context menu items array.
         * Organizes selection-related items, pin-related items, and chart items into submenus.
         */
        const generateMenuItems: (itemsToProcess: (ContextMenuItem | ContextMenuItemProps)[]) => ContextMenuItemProps[] =
            useCallback((itemsToProcess: (ContextMenuItem | ContextMenuItemProps)[]): ContextMenuItemProps[] => {
                const menuItems: ContextMenuItemProps[] = [];
                const selectItems: ContextMenuItemProps[] = [];
                const pinItems: ContextMenuItemProps[] = [];
                const pinColumnItems: ContextMenuItemProps[] = [];
                const barChartItems: ContextMenuItemProps[] = [];
                const columnChartItems: ContextMenuItemProps[] = [];
                const lineChartItems: ContextMenuItemProps[] = [];
                const areaChartItems: ContextMenuItemProps[] = [];
                let pieChartItem: ContextMenuItemProps | undefined;
                let scatterChartItem: ContextMenuItemProps | undefined;

                for (let i: number = 0; i < itemsToProcess.length; i++) {
                    const item: ContextMenuItem | ContextMenuItemProps = itemsToProcess[parseInt(i.toString(), 10)];
                    const isSelectItems: boolean = typeof item === 'string' && (item === 'SelectRow' || item === 'ClearRowSelection' || item === 'ClearSelection');
                    const isPinItems: boolean = typeof item === 'string' && (item === 'UnpinRow' || item === 'PinToTop' || item === 'PinToBottom');
                    const isPinColumnItems: boolean = typeof item === 'string' &&
                        (item === 'PinToLeft' || item === 'PinToRight' || item === 'UnpinColumn');
                    const isBarChartItems: boolean = typeof item === 'string' && barChartList.includes(item);
                    const isColumnChartItems: boolean = typeof item === 'string' && columnChartList.includes(item);
                    const isLineChartItems: boolean = typeof item === 'string' && lineChartList.includes(item);
                    const isAreaChartItems: boolean = typeof item === 'string' && areaChartList.includes(item);
                    const isPieChart: boolean = typeof item === 'string' && pieChartList.includes(item);
                    const isScatterChart: boolean = typeof item === 'string' && scatterChartList.includes(item);

                    if (isSelectItems) {
                        selectItems.push(typeof item === 'string' ? { ...menuItemsInfo[`${item}`], disabled: disabled(item) } : item);
                    } else if (isPinItems) {
                        pinItems.push(typeof item === 'string' ? { ...menuItemsInfo[`${item}`], disabled: disabled(item) } : item);
                    } else if (isPinColumnItems) {
                        pinColumnItems.push(typeof item === 'string' ? { ...menuItemsInfo[`${item}`], disabled: disabled(item) } : item);
                    } else if (isBarChartItems) {
                        barChartItems.push(typeof item === 'string' ? { ...menuItemsInfo[`${item}`], disabled: disabled(item) } : item);
                    } else if (isColumnChartItems) {
                        columnChartItems.push(typeof item === 'string' ? { ...menuItemsInfo[`${item}`], disabled: disabled(item) } : item);
                    } else if (isLineChartItems) {
                        lineChartItems.push(typeof item === 'string' ? { ...menuItemsInfo[`${item}`], disabled: disabled(item) } : item);
                    } else if (isAreaChartItems) {
                        areaChartItems.push(typeof item === 'string' ? { ...menuItemsInfo[`${item}`], disabled: disabled(item) } : item);
                    } else if (isPieChart) {
                        pieChartItem = typeof item === 'string' ? { ...menuItemsInfo[`${item}`], disabled: disabled(item) } : item;
                    } else if (isScatterChart) {
                        scatterChartItem = typeof item === 'string' ? { ...menuItemsInfo[`${item}`], disabled: disabled(item) } : item;
                    } else {
                        menuItems.push(typeof item === 'string' ? { ...menuItemsInfo[`${item}`], disabled: disabled(item) } : item);
                    }
                }

                // Build chart submenus
                const chartItems: ContextMenuItemProps[] = [];
                if (lineChartItems.length > 0) {
                    chartItems.push({ ...menuItemsInfo.LineChart, items: lineChartItems });
                }
                if (areaChartItems.length > 0) {
                    chartItems.push({ ...menuItemsInfo.AreaChart, items: areaChartItems });
                }
                if (columnChartItems.length > 0) {
                    chartItems.push({ ...menuItemsInfo.ColumnChart, items: columnChartItems });
                }
                if (barChartItems.length > 0) {
                    chartItems.push({ ...menuItemsInfo.BarChart, items: barChartItems });
                }
                if (scatterChartItem) {
                    chartItems.push(scatterChartItem);
                }
                if (pieChartItem) {
                    chartItems.push(pieChartItem);
                }

                if (selectItems.length) {
                    menuItems.push({ ...menuItemsInfo.Select, items: selectItems });
                }
                if (pinItems.length) {
                    menuItems.push({ ...menuItemsInfo.PinRow, items: pinItems });
                }
                if (pinColumnItems.length) {
                    menuItems.push({ ...menuItemsInfo.PinColumn, items: pinColumnItems });
                }
                if (chartItems.length) {
                    menuItems.push({ ...menuItemsInfo.Chart, items: chartItems });
                }
                return menuItems;
            }, [menuItemsInfo, disabled, barChartList, columnChartList, lineChartList, areaChartList, pieChartList, scatterChartList]);

        /**
         * Handles the context menu opening event. Filters menu items based on visibility and disabled states,
         * triggers the onContextMenuOpen callback to allow customization, and prepares menu items for display.
         * Organizes selection-related items into a submenu and applies disabled styling.
         * Supports both synchronous and asynchronous (Promise-based) menu item loading.
         */
        const onOpen: (event?: Event) => void = useCallback((event?: Event) => {
            const element: HTMLElement = targetElement.current = event ? event.target as HTMLElement : targetElement.current;
            if (event && !requestedItems.current && element?.closest('.sf-cell')?.querySelector('.sf-pin-cell')) {
                offsetPosition.current = null;
                setOpen(false);
                return;
            }
            const column: ColumnProps = getColumn();
            const providedItems: typeof contextMenuSettings.items = requestedItems.current ?? (column?.contextMenuItems?.length ?
                column.contextMenuItems : contextMenuSettings.items?.length ? contextMenuSettings.items : []);
            requestedItems.current = undefined;
            const contextMenuItems: typeof contextMenuSettings.items = providedItems.length ? providedItems : defaultItems;
            const currentItems: typeof contextMenuSettings.items = [];
            for (let i: number = 0; i < contextMenuItems.length; i++) {
                const item: ContextMenuItem | ContextMenuItemProps = contextMenuItems[parseInt(i.toString(), 10)];
                const target: string = typeof item === 'string' ? menuItemsInfo[`${item}`].target : item.target;
                if ((!target || element.closest(target)) && (typeof item === 'object' || visible(item))
                    && (providedItems.length || !disabled(item as ContextMenuItem))) {
                    currentItems.push(typeof item === 'string' ? item : { ...item });
                }
            }
            const rowObject: IRow<ColumnProps> = getRowObject();
            const args: ContextMenuOpenEvent = {
                cancel: false,
                items: currentItems,
                ...(event ? { event: event } : {}),
                ...(column ? { column: column } : {}),
                ...(rowObject ? { data: rowObject.data } : {})
            };
            const result: ContextMenuOpenEvent | Promise<ContextMenuOpenEvent> | undefined = onContextMenuOpen?.(args);
            const processAndDisplayMenu: (menuArgs: ContextMenuOpenEvent) => void = (menuArgs: ContextMenuOpenEvent): void => {
                if (!menuArgs.cancel && menuArgs.items?.length) {
                    items.current = generateMenuItems(menuArgs.items);
                    setOpen(true);
                } else {
                    offsetPosition.current = null;
                }
            };
            if (result && 'then' in result) {
                const parentRect: DOMRect = targetRef.current.getBoundingClientRect();
                if (event && event instanceof MouseEvent) {
                    spinnerPosition.current = {
                        top: (event as MouseEvent).clientY - parentRect.top,
                        left: (event as MouseEvent).clientX - parentRect.left
                    };
                } else if (offsetPosition.current) {
                    spinnerPosition.current = {
                        top: offsetPosition.current.top - parentRect.top - window.scrollY,
                        left: offsetPosition.current.left - parentRect.left - window.scrollX
                    };
                }
                setShowSpinner(true);
                (result as Promise<ContextMenuOpenEvent>).then((resolvedArgs: ContextMenuOpenEvent) => {
                    setShowSpinner(false);
                    processAndDisplayMenu(resolvedArgs);
                }).catch(() => {
                    setShowSpinner(false);
                    offsetPosition.current = null;
                });
            } else {
                processAndDisplayMenu(result ? (result as ContextMenuOpenEvent) : args);
            }
        }, [contextMenuSettings, disabled, getRowObject, menuItemsInfo, onContextMenuOpen, visible, getColumn, generateMenuItems]);

        /**
         * Handles the context menu closing event. Clears the menu offset position and triggers
         * the onContextMenuClose callback to allow custom cleanup logic.
         */
        const onClose: () => void = useCallback(() => {
            offsetPosition.current = null;
            onContextMenuClose?.();
            setOpen(false);
        }, [onContextMenuClose]);

        /**
         * Handles context menu item selection and executes the appropriate grid action based on the selected item type.
         */
        const onSelect: (event: MenuSelectEvent) => void = useCallback((event: MenuSelectEvent) => {
            const item: ContextMenuItem = getItemKey(event.item.id);
            const column: ColumnProps = getColumn();
            const rowObject: IRow<ColumnProps> = getRowObject();
            const commandColumn: boolean = commandColumnModule?.commandEdit.current;
            switch (item) {
            case 'Edit':
            case 'Delete':
                setTimeout(async () => {
                    const saved: boolean = !commandColumn ? await editModule?.saveDataChanges() : false;
                    if (!editModule?.isEdit || (editModule?.isEdit && saved) || commandColumn) {
                        if (item === 'Edit') {
                            const isCellEditor: boolean = editModule?.editSettings?.mode === 'Cell';
                            if (isCellEditor) {
                                const primaryKeyField: string | undefined = getPrimaryKeyFieldNames?.()?.[0];
                                const primaryKeyValue: string | number | undefined = primaryKeyField ?
                                    //eslint-disable-next-line security/detect-object-injection
                                    rowObject?.data?.[primaryKeyField] : undefined;
                                if (column?.field && primaryKeyValue !== undefined && primaryKeyValue !== null) {
                                    editModule?.editCell?.(primaryKeyValue, column.field, rowObject?.uid);
                                }
                            } else {
                                editModule?.editRecord(targetElement.current.closest('.sf-grid-content-row'));
                            }
                        } else {
                            editModule?.deleteRecord(undefined, rowObject.data);
                        }
                    }
                }, 0);
                break;
            case 'Save':
                (editModule?.saveDataChanges as Function)?.(undefined, undefined, undefined, commandColumn ? rowObject.uid : undefined);
                break;
            case 'Cancel':
                (editModule?.cancelDataChanges as Function)?.(undefined, commandColumn ? rowObject.uid : undefined);
                break;
            case 'FirstPage':
            case 'PrevPage':
            case 'LastPage':
            case 'NextPage':
                goToPage(parseInt(pagerRef?.element.querySelector(getPagerClass(item)).getAttribute('page-index'), 10));
                break;
            case 'SortAscending':
            case 'SortDescending':
                sortByColumn(column.field, item === 'SortAscending' ? 'Ascending' : 'Descending');
                break;
            case 'ClearSort':
                removeSortColumn(column.field);
                break;
            case 'ClearSelection':
                clearSelection();
                break;
            case 'SelectRow':
                if (selectionSettings.mode === 'Single') {
                    selectRow(rowObject.rowIndex);
                } else {
                    selectionModule.addRowsToSelection([rowObject.rowIndex]);
                }
                break;
            case 'ClearRowSelection':
                clearRowSelection([rowObject.rowIndex]);
                break;
            case 'UnpinRow':
                unpinRows?.([rowObject.data as never]);
                break;
            case 'PinToTop':
                pinRows?.([rowObject.data as never], 'top');
                break;
            case 'PinToBottom':
                pinRows?.([rowObject.data as never], 'bottom');
                break;
            case 'PinToLeft':
                if (column?.field || column?.uid) {
                    pinColumn?.((column.field || column.uid), ColumnPinDirection.Left);
                }
                break;

            case 'PinToRight':
                if (column?.field || column?.uid) {
                    pinColumn?.((column.field || column.uid), ColumnPinDirection.Right);
                }
                break;

            case 'UnpinColumn':
                if (column?.field || column?.uid) {
                    unpinColumn?.(column.field || column.uid);
                }
                break;
            case 'Sum':
            case 'Average':
            case 'Min':
            case 'Max':
            case 'Count':
            case 'TrueCount':
            case 'FalseCount':
            case 'Custom': {
                const rowIndex: number = getAggregateRowIndex();
                if (rowIndex >= 0 && column) {
                    const row: AggregateRowProps = aggregates[parseInt(rowIndex.toString(), 10)];
                    const aggColumn: AggregateColumnProps = getMatchingAggregateColumn(row.columns, column.field);
                    if (aggColumn) {
                        aggregateSelection.addAggregate(rowIndex, aggColumn.field, item as AggregateType);
                        refresh?.();
                    }
                }
                break;
            }
            case 'Bar':
            case 'StackingBar':
            case 'StackingBar100':
            case 'Pie':
            case 'Column':
            case 'StackingColumn':
            case 'StackingColumn100':
            case 'Line':
            case 'StackingLine':
            case 'StackingLine100':
            case 'Area':
            case 'StackingArea':
            case 'StackingArea100':
            case 'Scatter': {
                (event as ContextMenuClickEvent).chart = item;
                break;
            }
            }
            onContextMenuClick?.(event);
            setOpen(false);
        }, [onContextMenuClick, editModule, pagerRef, goToPage, getColumn, getPrimaryKeyFieldNames, sortByColumn, getRowObject,
            removeSortColumn, clearSelection, selectRow, clearRowSelection, getItemKey, selectionSettings, selectionModule,
            getAggregateRowIndex, getMatchingAggregateColumn, aggregateSelection, refresh, pinRows, unpinRows]);

        /**
         * Shows the context menu at the specified position targeting a specific element.
         */
        const showContextMenu: (args: ContextMenuArgs) => void = useCallback((args: ContextMenuArgs) => {
            focusModule.setGridFocus(true);
            const element: HTMLElement = args.target;
            const clientRect: DOMRect = element.getBoundingClientRect();
            const isPinCellMenu: boolean = !!element.closest('.sf-pin-cell') && !!args.items?.length;
            const parentRect: DOMRect | undefined = isPinCellMenu ? targetRef.current.getBoundingClientRect() : undefined;
            targetElement.current = element;
            offsetPosition.current = {
                top: isPinCellMenu ? (args.top !== undefined ? args.top - parentRect.top : clientRect.top - parentRect.top) :
                    (args.top ? args.top : clientRect.top + window.scrollY),
                left: isPinCellMenu ? (args.left !== undefined ? args.left - parentRect.left : clientRect.left - parentRect.left) :
                    (args.left ? args.left : clientRect.left + window.scrollX)
            };
            requestedItems.current = args.items;
            onOpen();
        }, [focusModule, onOpen]);

        /**
         * Hides the context menu by triggering the close handler.
         */
        const hideContextMenu: () => void = useCallback(() => {
            onClose();
        }, [onClose]);

        /**
         * Exposes ref methods for imperative context menu control.
         * Allows parent components to show/hide the context menu programmatically.
         */
        useImperativeHandle(ref, () => ({
            showContextMenu,
            hideContextMenu
        }), [showContextMenu, hideContextMenu]);

        const renderSubMenuItems: (menuItems: (ContextMenuItemProps)[]) => ReactNode =
            (menuItems: (ContextMenuItemProps)[]) => {
                return menuItems?.map((item: ContextMenuItemProps, index: number) => (
                    <MenuItem key={index} disabled={item?.disabled} id={item?.id}>
                        {item?.icon ? <MenuItemIcon>{item?.icon}</MenuItemIcon> : null}
                        <MenuItemLabel>
                            {item?.text}
                        </MenuItemLabel>
                        {item?.items?.length ? renderSubMenuItems(item.items) : null}
                    </MenuItem>
                ));
            };

        return (
            <>
                {showSpinner && (
                    <div style={{
                        position: 'absolute',
                        top: `${spinnerPosition.current.top}px`,
                        left: `${spinnerPosition.current.left}px`
                    }}>
                        <Spinner visible={true} type={SpinnerType.Cupertino} size={24} />
                    </div>
                )}
                <ContextMenu
                    open={open}
                    targetRef={targetRef}
                    container={element}
                    onOpen={onOpen}
                    onClose={onClose}
                    onSelect={onSelect}
                    closeOnScroll={false}
                    {...contextMenuSettings.menuSettings}
                    className={className}
                    {...(offsetPosition.current ? { offset: offsetPosition.current } : {})}
                >
                    {items.current?.map((item: ContextMenuItemProps, index: number) => (
                        <MenuItem key={index} disabled={item?.disabled} id={item?.id}>
                            {item?.icon ? <MenuItemIcon>{item?.icon}</MenuItemIcon> : null}
                            <MenuItemLabel>
                                {item?.text}
                            </MenuItemLabel>
                            {item?.items && item?.items?.length > 0 && (
                                renderSubMenuItems(item?.items)
                            )}
                        </MenuItem>
                    ))}
                </ContextMenu>
            </>
        );
    })) as (props: RefAttributes<ContextMenuPanelRef>) => ReactElement;

/**
 * Set display name for debugging purposes
 */
(ContextMenuPanelBase as ForwardRefExoticComponent<RefAttributes<ContextMenuPanelRef>>).displayName = 'ContextMenuPanelBase';

export { ContextMenuPanelBase };
