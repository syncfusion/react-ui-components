import { ContextMenu, MenuSelectEvent, MenuItem, MenuItemIcon, MenuItemLabel, OffsetPosition } from '@syncfusion/react-navigations';
import { Spinner, SpinnerType } from '@syncfusion/react-popups';
import { forwardRef, ForwardRefExoticComponent, memo, ReactElement, ReactNode, RefAttributes, useCallback, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { useGridComputedProvider, useGridMutableProvider } from '../contexts';
import { IL10n, isNullOrUndefined } from '@syncfusion/react-base';
import { ColumnProps, ContextMenuOpenEvent, ContextMenuItem, ContextMenuParentItem, IRow, ContextMenuPanelRef, ContextMenuArgs, AggregateColumnProps, AggregateRowProps, ContextMenuItemProps } from '../types';
import { AggregateType, ColumnType } from '../types/enum';
import {
    SaveIcon, CloseIcon, EditIcon, TrashIcon, ChevronLeftDoubleIcon, ChevronLeftIcon, ChevronRightDoubleIcon, ChevronRightIcon,
    SortAscendingListIcon, SortDescendingListIcon, TableCellIcon, ClearSortIcon, ClearAllIcon, ClearRowSelectionIcon, FreezeRowIcon
} from '@syncfusion/react-icons';

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
            getRowObjectFromUID, pagerModule, goToPage, getColumnByUid, sortByColumn, getColumns, removeSortColumn, getSelectedRowIndexes,
            clearSelection, selectionSettings, clearRowSelection, selectionModule, focusModule, aggregates,
            refresh } = useGridComputedProvider();
        const { editModule, sortModule, cssClass, commandColumnModule, aggregateSelection } = useGridMutableProvider();

        const className: string = `${contextMenuSettings.menuSettings.className ? contextMenuSettings.menuSettings.className : ''} ${cssClass ? cssClass : ''} sf-grid-contextmenu`;
        const localization: IL10n = serviceLocator?.getService<IL10n>('localization');
        const targetRef: React.RefObject<HTMLDivElement> = useRef(element);
        const [open, setOpen] = useState(false);
        const [showSpinner, setShowSpinner] = useState(false);
        const items: React.RefObject<ContextMenuItemProps[]> = useRef<ContextMenuItemProps[]>([]);
        const targetElement: React.RefObject<HTMLElement> = useRef<HTMLElement>(null);
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
        const getColumn: () => ColumnProps = useCallback((): ColumnProps => {
            const cell: Element = targetElement.current.closest('.sf-cell');
            return cell ? (cell.hasAttribute('data-mappinguid') ? getColumnByUid(cell.getAttribute('data-mappinguid')) :
                cell.hasAttribute('aria-colindex') ? getColumns()[parseInt(cell.getAttribute('aria-colindex'), 10) - 1] :
                    undefined) : undefined;
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
         * Determines which aggregate types are applicable for a specific column type.
         */
        const getApplicableAggregateTypes: (columnType: string) => AggregateType[] = useCallback((columnType: string): AggregateType[] => {
            const numberAggregates: AggregateType[] = [AggregateType.Sum, AggregateType.Average, AggregateType.Min, AggregateType.Max];
            const booleanAggregates: AggregateType[] = [AggregateType.TrueCount, AggregateType.FalseCount];
            const allAggregates: AggregateType[] = [AggregateType.Count, AggregateType.Custom];
            switch (columnType) {
            case ColumnType.Number:
                return [...numberAggregates, ...allAggregates];
            case ColumnType.Boolean:
                return [...booleanAggregates, ...allAggregates];
            default:
                return allAggregates;
            }
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
         * Memoized array of all built-in context menu item types available in the grid.
         * Used as default menu items when no custom items are specified via column configuration or settings.
         */
        const defaultItems: ContextMenuItem[] = useMemo((): ContextMenuItem[] => {
            return ['Edit', 'Delete', 'Save', 'Cancel', 'SortAscending', 'SortDescending', 'ClearSort', 'FirstPage', 'PrevPage',
                'LastPage', 'NextPage', 'SelectRow', 'ClearRowSelection', 'ClearSelection', 'Sum', 'Average', 'Min', 'Max',
                'Count', 'TrueCount', 'FalseCount', 'Custom'];
        }, []);

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
                Select: { text: localization?.getConstant('selectLabel'), id: generateItemID('Select'), icon: <TableCellIcon /> }
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
        }, [getSelectedRowIndexes, getRowObject, getColumn, getAggregateRowIndex, isAggregateItemVisible]);

        /**
         * Determines if a context menu item should be disabled based on the current grid configuration and state.
         */
        const disabled: (item: ContextMenuItem) => boolean = useCallback((item: ContextMenuItem): boolean => {
            let disabled: boolean = false;
            switch (item) {
            case 'Edit':
                disabled = !editModule.editSettings.allowEdit;
                break;
            case 'Delete':
                disabled = !editModule.editSettings.allowDelete;
                break;
            case 'FirstPage':
            case 'PrevPage':
            case 'LastPage':
            case 'NextPage':
                disabled = pagerModule.element.querySelector(getPagerClass(item)).classList.contains('sf-disable');
                break;
            case 'SortAscending':
            case 'SortDescending':
                disabled = !(sortModule.sortSettings.enabled && getColumn().allowSort);
                break;
            case 'SelectRow':
                disabled = !selectionSettings.enabled;
                break;
            }
            return disabled;
        }, [editModule, pagerModule, sortModule, selectionSettings, getColumn]);

        /**
         * Generates menu items from the provided context menu items array.
         */
        const generateMenuItems: (itemsToProcess: (ContextMenuItem | ContextMenuItemProps)[]) => ContextMenuItemProps[] =
            useCallback((itemsToProcess: (ContextMenuItem | ContextMenuItemProps)[]): ContextMenuItemProps[] => {
                const menuItems: ContextMenuItemProps[] = [];
                const selectItems: ContextMenuItemProps[] = [];
                for (let i: number = 0; i < itemsToProcess.length; i++) {
                    const item: ContextMenuItem | ContextMenuItemProps = itemsToProcess[parseInt(i.toString(), 10)];
                    const isSelectItems: boolean = typeof item === 'string' && (item === 'SelectRow' || item === 'ClearRowSelection' || item === 'ClearSelection');
                    (isSelectItems ? selectItems : menuItems).push(typeof item === 'string' ? { ...menuItemsInfo[`${item}`], disabled: disabled(item) } : item);
                }
                if (selectItems.length) {
                    menuItems.push({ ...menuItemsInfo.Select, items: selectItems });
                }
                return menuItems;
            }, [menuItemsInfo, disabled]);

        /**
         * Handles the context menu opening event. Filters menu items based on visibility and disabled states,
         * triggers the onContextMenuOpen callback to allow customization, and prepares menu items for display.
         * Organizes selection-related items into a submenu and applies disabled styling.
         * Supports both synchronous and asynchronous (Promise-based) menu item loading.
         */
        const onOpen: (event?: Event) => void = useCallback((event?: Event) => {
            const element: HTMLElement = targetElement.current = event ? event.target as HTMLElement : targetElement.current;
            const column: ColumnProps = getColumn();
            const providedItems: typeof contextMenuSettings.items = column?.contextMenuItems?.length ? column.contextMenuItems :
                contextMenuSettings.items?.length ? contextMenuSettings.items : [];
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
            const commandColumn: boolean = commandColumnModule.commandEdit.current;
            switch (item) {
            case 'Edit':
            case 'Delete':
                setTimeout(async () => {
                    const saved: boolean = !commandColumn ? await editModule.saveDataChanges() : false;
                    if (!editModule.isEdit || (editModule.isEdit && saved) || commandColumn) {
                        if (item === 'Edit') {
                            editModule.editRecord(targetElement.current.closest('.sf-grid-content-row'));
                        } else {
                            editModule.deleteRecord(undefined, rowObject.data);
                        }
                    }
                }, 0);
                break;
            case 'Save':
                (editModule.saveDataChanges as Function)?.(undefined, undefined, undefined, commandColumn ? rowObject.uid : undefined);
                break;
            case 'Cancel':
                (editModule.cancelDataChanges as Function)?.(undefined, commandColumn ? rowObject.uid : undefined);
                break;
            case 'FirstPage':
            case 'PrevPage':
            case 'LastPage':
            case 'NextPage':
                goToPage(parseInt(pagerModule.element.querySelector(getPagerClass(item)).getAttribute('page-index'), 10));
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
            }
            onContextMenuClick?.(event);
            setOpen(false);
        }, [onContextMenuClick, editModule, pagerModule, goToPage, getColumn, sortByColumn, getRowObject, removeSortColumn,
            clearSelection, selectRow, clearRowSelection, getItemKey, selectionSettings, selectionModule, getAggregateRowIndex,
            getMatchingAggregateColumn, aggregateSelection, refresh]);

        /**
         * Shows the context menu at the specified position targeting a specific element.
         */
        const showContextMenu: (args: ContextMenuArgs) => void = useCallback((args: ContextMenuArgs) => {
            focusModule.setGridFocus(true);
            const element: HTMLElement = args.target;
            const clientRect: DOMRect = element.getBoundingClientRect();
            targetElement.current = element;
            offsetPosition.current = {
                top: args.top ? args.top : clientRect.top + window.scrollY,
                left: args.left ? args.left : clientRect.left + window.scrollX
            };
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
