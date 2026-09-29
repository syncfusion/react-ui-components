import * as React from 'react';
import { PivotColumnMenuContext } from '../contexts/PivotColumnMenuContext';
import {
    ContextMenu,
    MenuSelectEvent,
    MenuItem,
    MenuItemLabel,
    OffsetPosition
} from '@syncfusion/react-navigations';
import {
    SortAscendingIcon,
    SortDescendingIcon,
    FilterIcon,
    ExpandIcon,
    CollapseIcon,
    ColumnsIcon,
    GroupIconIcon,
    ClearSortIcon
} from '@syncfusion/react-icons';
import { useGridComputedProvider, useGridMutableProvider } from '../contexts';
import { AggregateColumnProps, AggregateType, ColumnMenuOpenEvent, ColumnProps, ColumnType, GridRef, MutableGridSetter } from '../types';
import type { PivotColumnMenuHostProps } from '../contexts/PivotColumnMenuContext';

type ColumnMenuItem = {
    id: string;
    text?: string;
    items?: ColumnMenuItem[];
    disabled?: boolean;
};


export interface ColumnMenuArgs {
    target: HTMLElement;
    top?: number;
    left?: number;
}

interface ColumnMenuProps {
    column: ColumnProps;
    position: { top: number; left: number } | null;
    targetRef?: React.RefObject<HTMLElement>;
    onClose: () => void;
}

const ColumnMenu: React.FC<ColumnMenuProps> = ({
    column,
    position,
    targetRef,
    onClose
}: ColumnMenuProps): React.JSX.Element | null => {
    const grid: Partial<GridRef> & Partial<MutableGridSetter> = useGridComputedProvider();
    const { groupModule, aggregateModule, filterModule, columnChooserModule, aggregateSelection, uiColumns,
        focusModule } = useGridMutableProvider();
    const localization: { getConstant: (key: string) => string } | undefined =
        grid?.serviceLocator?.getService?.('localization') as { getConstant: (key: string) => string } | undefined;
    const isSortEnabled: boolean = !!grid?.sortSettings?.enabled;
    const isFilterEnabled: boolean = !!filterModule && !!grid?.filterSettings?.enabled;
    const isColumnChooserEnabled: boolean = !!columnChooserModule && !!grid?.showColumnChooser;
    const isGroupingEnabled: boolean = !!groupModule && !!grid?.groupSettings?.enabled;
    const hasGroupedColumns: boolean = !!groupModule && isGroupingEnabled && !!grid?.groupSettings?.columns?.length;
    const isColumnGrouped: boolean = !!groupModule?.groupedColumns?.includes(column.field as string);
    const hasExpandedGroups: boolean = !!groupModule &&
        (groupModule.expandedGroups?.has('ALL') || !!groupModule.expandedGroups?.size) &&
        !groupModule.collapsedGroups?.has('ALL');
    const areAllGroupsExpanded: boolean = !!groupModule?.expandedGroups?.has('ALL') &&
        !groupModule.collapsedGroups?.has('ALL');
    const sortColumnExistsForThisField: boolean = React.useMemo<boolean>(() => {
        return !!grid?.sortSettings?.columns?.some((sortColumn: { field?: string }) => sortColumn?.field === column.field);
    }, [grid?.sortSettings?.columns, column.field]);
    const hasAggregateForThisColumn: boolean = React.useMemo<boolean>(() => {
        const aggregateRows: Array<{ columns?: AggregateColumnProps[] }> =
            (grid?.aggregates as Array<{ columns?: AggregateColumnProps[] }> | undefined) ?? [];

        return aggregateRows.some((row: { columns?: AggregateColumnProps[] }): boolean => {
            return Array.isArray(row?.columns) && row.columns.some((aggregateColumn: AggregateColumnProps): boolean => {
                return aggregateColumn?.field === column.field;
            });
        });
    }, [grid?.aggregates, column.field]);
    const items: ColumnMenuItem[] = React.useMemo<ColumnMenuItem[]>((): ColumnMenuItem[] => {
        const base: ColumnMenuItem[] = [];

        base.push(
            {
                id: 'SortAsc', text: localization?.getConstant(column?.type === ColumnType.Number ? 'sortSmallestToLargest' :
                    (column?.type === ColumnType.Date || column?.type === ColumnType.DateTime || column?.type === 'datetime' ?
                        'sortByOldest' : 'sortAtoZ')),
                disabled: !isSortEnabled
            },
            {
                id: 'SortDesc', text: localization?.getConstant(column?.type === ColumnType.Number ? 'sortLargestToSmallest' :
                    (column?.type === ColumnType.Date || column?.type === ColumnType.DateTime || column?.type === 'datetime' ?
                        'sortByNewest' : 'sortZtoA')), disabled: !isSortEnabled
            },
            {
                id: 'ClearSort',
                text: localization?.getConstant('clearSortLabel'),
                disabled: !isSortEnabled || !sortColumnExistsForThisField
            }
        );

        if (isFilterEnabled && grid?.columnMenuSettings?.showFilter) {
            base.push({ id: 'Filter', text: localization?.getConstant('filterLabel') });
        }

        if (isColumnChooserEnabled) {
            base.push({ id: 'ColumnChooser', text: localization?.getConstant('columnChooser') });
        }

        if (isGroupingEnabled) {
            base.push(
                {
                    id: 'GroupColumn',
                    text: localization?.getConstant('singleColumnGroupLabel'),
                    disabled: isColumnGrouped
                },
                {
                    id: 'UngroupColumn',
                    text: localization?.getConstant('singleColumnUnGroupLabel'),
                    disabled: !isColumnGrouped
                }
            );
        }

        if (hasGroupedColumns) {
            base.push(
                {
                    id: 'ExpandAllGroups',
                    text: localization?.getConstant('expandAllGroups'),
                    disabled: areAllGroupsExpanded
                },
                {
                    id: 'CollapseAllGroups',
                    text: localization?.getConstant('collapseAllGroups'),
                    disabled: !hasExpandedGroups
                }
            );
        } else if (isGroupingEnabled) {
            base.push(
                {
                    id: 'ExpandAllGroups',
                    text: localization?.getConstant('expandAllGroups'),
                    disabled: true
                },
                {
                    id: 'CollapseAllGroups',
                    text: localization?.getConstant('collapseAllGroups'),
                    disabled: true
                }
            );
        }

        if (aggregateModule && hasAggregateForThisColumn) {
            base.push({
                id: 'Aggregates',
                text: localization?.getConstant('aggregateLabel'),
                items: [
                    { id: 'Sum', text: localization?.getConstant('sumLabel') },
                    { id: 'Average', text: localization?.getConstant('averageLabel') },
                    { id: 'Min', text: localization?.getConstant('minLabel') },
                    { id: 'Max', text: localization?.getConstant('maxLabel') },
                    { id: 'Count', text: localization?.getConstant('countLabel') },
                    { id: 'TrueCount', text: localization?.getConstant('trueCountLabel') },
                    { id: 'FalseCount', text: localization?.getConstant('falseCountLabel') },
                    { id: 'Custom', text: localization?.getConstant('customLabel') }
                ]
            });
        }

        return base;
    }, [
        localization,
        uiColumns?.current?.length,
        grid?.columns,
        isSortEnabled,
        isFilterEnabled,
        isColumnChooserEnabled,
        isGroupingEnabled,
        hasGroupedColumns,
        isColumnGrouped,
        hasExpandedGroups,
        areAllGroupsExpanded,
        sortColumnExistsForThisField,
        hasAggregateForThisColumn,
        aggregateModule,
        filterModule,
        columnChooserModule
    ]);

    const offsetPosition: React.MutableRefObject<OffsetPosition | null> =
        React.useRef<OffsetPosition | null>(null);
    const targetElement: React.RefObject<HTMLElement> = React.useRef<HTMLElement>(null);
    const [open, setOpen] = React.useState<boolean>(false);

    const onOpen: (event?: Event) => void = React.useCallback((): void => {
        const element: HTMLElement | null = targetElement.current;
        const rect: DOMRect = element.getBoundingClientRect();
        const parentRect: DOMRect | undefined =
            (grid?.element as HTMLElement | null)?.getBoundingClientRect?.() as DOMRect | undefined;
        offsetPosition.current = {
            top: rect.bottom - parentRect.top,
            left: rect.left - parentRect.left
        } as OffsetPosition;
    }, [grid?.element]);

    const getMatchingAggregateColumn: (fieldName: string) => { rowIndex: number; field: string } =
        React.useCallback((fieldName: string): { rowIndex: number; field: string } => {
            const aggregateRows: Array<{ columns?: AggregateColumnProps[] }> =
                (grid.aggregates as unknown) as Array<{ columns?: AggregateColumnProps[] }>;

            for (const [rowIndex, row] of aggregateRows.entries()) {
                const aggregateColumns: AggregateColumnProps[] = Array.isArray(row?.columns) ? row.columns : [];
                const aggregateColumn: AggregateColumnProps | undefined = aggregateColumns.find(
                    (aggregateColumnItem: AggregateColumnProps): boolean => {
                        return aggregateColumnItem?.field === fieldName;
                    }
                );
                if (aggregateColumn) {
                    return {
                        rowIndex,
                        field: aggregateColumn.field
                    };
                }
            }
            return { rowIndex: 0, field: fieldName };
        }, [grid?.aggregates]);

    // Keep an up-to-date offset ref
    if (position) {
        const parentRect: DOMRect | undefined =
            (grid?.element as HTMLElement | null)?.getBoundingClientRect?.() as DOMRect | undefined;
        offsetPosition.current = {
            top: position.top - parentRect.top,
            left: position.left - parentRect.left
        } as OffsetPosition;
    }

    React.useEffect((): void => {
        if (position && targetRef?.current) {
            targetElement.current = targetRef.current;
            onOpen();
            const openArgs: ColumnMenuOpenEvent = {
                cancel: false,
                items: items.map((item: ColumnMenuItem): string => item.id),
                column,
                target: targetRef.current,
                event: undefined
            };
            const openResult: Promise<ColumnMenuOpenEvent> | ColumnMenuOpenEvent | undefined | void =
                grid.onColumnMenuOpen?.(openArgs);
            if (openResult && typeof (openResult as Promise<ColumnMenuOpenEvent>).then === 'function') {
                (openResult as Promise<ColumnMenuOpenEvent>).then(
                    (resolvedArgs: ColumnMenuOpenEvent): void => {
                        if (resolvedArgs?.cancel) {
                            setOpen(false);
                            onClose();
                            return;
                        }
                        setOpen(true);
                    }
                ).catch((): void => {
                    setOpen(false);
                    onClose();
                });
            } else {
                const resolvedArgs: ColumnMenuOpenEvent | undefined =
                    (openResult as ColumnMenuOpenEvent | undefined) ?? openArgs;
                if (resolvedArgs?.cancel) {
                    setOpen(false);
                    onClose();
                    return;
                }
                setOpen(true);
            }
        }
    }, [position, targetRef, onOpen, items, column, grid.onColumnMenuOpen, onClose]);

    const onSelect: (args: MenuSelectEvent) => void = (args: MenuSelectEvent): void => {
        const id: string = args.item.id as string;
        switch (id) {
        case 'Filter': {
            const headerCell: Element | null = (grid.element as HTMLElement | null)?.querySelector(
                `[data-mappinguid='${column.uid}']`
            );
            const filterIcon: Element | null | undefined = headerCell?.querySelector('.sf-grid-filter-container');
            (filterIcon as HTMLElement | null | undefined)?.click();
            break;
        }
        case 'SortAsc':
            grid.sortByColumn?.(column.field as string, 'Ascending');
            break;
        case 'SortDesc':
            grid.sortByColumn?.(column.field as string, 'Descending');
            break;
        case 'ClearSort':
            grid.removeSortColumn?.(column.field as string);
            break;
        case 'GroupColumn':
            groupModule?.groupColumn?.([column.field as string]);
            break;
        case 'UngroupColumn':
            groupModule?.ungroupColumn?.([column.field as string]);
            break;
        case 'ExpandAllGroups':
            groupModule?.expandAll();
            break;
        case 'CollapseAllGroups':
            groupModule?.collapseAll();
            break;
        case 'Sum':
        case 'Average':
        case 'Min':
        case 'Max':
        case 'Count':
        case 'TrueCount':
        case 'FalseCount':
        case 'Custom': {
            if (aggregateSelection?.addAggregate) {
                const aggregateTarget: { rowIndex: number; field: string } =
                    getMatchingAggregateColumn(column.field as string);
                aggregateSelection.addAggregate(
                    aggregateTarget.rowIndex,
                    aggregateTarget.field,
                    id as AggregateType
                );
                grid.refresh?.();
            }
            break;
        }
        case 'ColumnChooser': {
            if (grid.openColumnChooser) {
                const rect: DOMRect = targetRef?.current.getBoundingClientRect();
                const gridRect: DOMRect = (grid.element as HTMLElement).getBoundingClientRect();
                const x: number = rect.left - gridRect.left;
                const y: number = rect.bottom - gridRect.top;
                grid.openColumnChooser(x, y);
            }
            break;
        }
        }
        grid.onColumnMenuClick?.({
            item: id,
            column,
            target: targetElement.current,
            event: args
        });
        setOpen(false);
        onClose();
    };

    return (
        <>
            <ContextMenu
                open={open}
                targetRef={targetRef ? targetRef : targetElement}
                onClose={() => {
                    setOpen(false);
                    /* restore grid focus when column menu closes */
                    focusModule?.setGridFocus?.(true);
                    grid.onColumnMenuClose?.({
                        column,
                        target: targetElement.current,
                        event: undefined
                    });
                    onClose();
                }}
                container={grid.element}
                closeOnScroll={false}
                className="sf-column-menu"
                onSelect={onSelect}
                {...(offsetPosition.current ? { offset: offsetPosition.current } : {})}
            >
                {items.map((it: ColumnMenuItem): React.ReactNode => {
                    const icon: React.ReactNode = (() => {
                        switch (it.id) {
                        case 'Filter':
                            return <FilterIcon className="sf-font-size-xl" />;
                        case 'SortAsc':
                            return <SortAscendingIcon className="sf-font-size-xl" />;
                        case 'SortDesc':
                            return <SortDescendingIcon className="sf-font-size-xl" />;
                        case 'ClearSort':
                            return <ClearSortIcon className="sf-font-size-xl" />;
                        case 'GroupColumn':
                        case 'UngroupColumn':
                            return <GroupIconIcon className="sf-font-size-xl" />;
                        case 'ExpandAllGroups':
                            return <ExpandIcon className="sf-font-size-xl" />;
                        case 'CollapseAllGroups':
                            return <CollapseIcon className="sf-font-size-xl" />;
                        case 'ColumnChooser':
                            return <ColumnsIcon className="sf-font-size-xl" />;
                        default:
                            return null;
                        }
                    })();
                    // Render separators above and below ColumnChooser to match Excel menu
                    if (it.id === 'ColumnChooser') {
                        return (
                            <React.Fragment key={it.id}>
                                <MenuItem className={'sf-separator sf-excel-separator'} key={it.id + '-sep-top'} />
                                <MenuItem key={it.id} id={it.id} disabled={it.disabled}>
                                    <MenuItemLabel>
                                        <span className="sf-menu-item-icon">{icon}</span>
                                        <span className="sf-menu-item-text">{it.text}</span>
                                    </MenuItemLabel>
                                </MenuItem>
                                <MenuItem className={'sf-separator sf-excel-separator'} key={it.id + '-sep-bottom'} />
                            </React.Fragment>
                        );
                    }

                    return (
                        <MenuItem key={it.id} id={it.id} disabled={it.disabled}>
                            <MenuItemLabel>
                                <span className="sf-menu-item-icon">{icon}</span>
                                <span className="sf-menu-item-text">{it.text}</span>
                            </MenuItemLabel>
                            {it.items && it.items.length > 0 && it.items.map(
                                (sub: ColumnMenuItem): React.ReactNode => (
                                    <MenuItem key={sub.id} id={sub.id} disabled={sub.disabled}>
                                        <MenuItemLabel>
                                            <span className="sf-menu-item-text">{sub.text}</span>
                                        </MenuItemLabel>
                                    </MenuItem>
                                )
                            )}
                        </MenuItem>
                    );
                })}
            </ContextMenu>
        </>
    );
};

ColumnMenu.displayName = 'ColumnMenu';

const ColumnMenuHost: React.FC<ColumnMenuProps> = (props: ColumnMenuProps) => {
    const renderPivotMenu: (props: PivotColumnMenuHostProps) => React.ReactElement = React.useContext(PivotColumnMenuContext);
    return renderPivotMenu ? renderPivotMenu(props) : <ColumnMenu {...props}/>;
};
export default ColumnMenuHost;
