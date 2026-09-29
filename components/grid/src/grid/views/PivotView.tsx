import { ReactElement, ReactNode, createElement, isValidElement, useRef, useMemo,
    useImperativeHandle, useEffect, useState, useCallback } from 'react';
import { ChevronRightIcon } from '@syncfusion/react-icons/src/icons/chevron-right';
import { ChevronDownIcon } from '@syncfusion/react-icons/src/icons/chevron-down';
import { ITooltip, Tooltip } from '@syncfusion/react-popups/src/tooltip/index';
import { GridBase } from '../components/Grid';
import { GridRef } from '../types/grid.interfaces';
import { PivotCellContext, PivotViewProps } from '../types/pivot.interfaces';
import { ColumnProps, ColumnTemplateProps, ColumnHeaderTemplateProps } from '../types/column.interfaces';
import { SortDirection, ScrollMode, AutoFitMode } from '../types/enum';
import { VirtualDomType } from '../types/virtualization.interface';
import { FilterPredicates } from '../types/filter.interfaces';
import { PivotRow, flattenPivotColumns, reconcilePivotColumns } from '../services/pivot-result';
import { customizePivotColumns, pivotUserPresentation } from '../services/pivot-customization';
import { createPivotMemberFormatter } from '../services/pivot-format';
import { useValueFormatter } from '../services/value-formatter';
import {
    buildDefaultPivotTooltipContent,
    findPivotResultColumn
} from '../services/pivot-tooltip-content';
import { usePivot } from '../hooks/usePivot';
import { PagerModule } from '../hooks/usePager';
import { ResizeModule } from '../hooks/useColumnResize';
import { AutoFitModule } from '../hooks/useColumnAutoFit';
import { ReorderModule } from '../hooks/useColumnReorder';
import { ColumnChooserModule } from '../hooks/useColumnChooser';
import { ToolbarModule } from '../hooks/useToolbar';
import { ContextMenuModule } from '../hooks/useContextMenu';
import { SortAscendingIcon, SortDescendingIcon, ClearSortIcon, PinIcon, UnpinIcon, ExpandIcon, CollapseIcon, ResizeIcon } from '@syncfusion/react-icons';
import { PivotColumnMenuContext, PivotColumnMenuHostProps } from '../contexts/PivotColumnMenuContext';
import { PivotColumnMenu, PivotColumnMenuItem } from './PivotColumnMenu';
import { PinningModule } from '../hooks/usePinning';
import { PinScope } from '../types/enum';
import { FilterIcon } from '@syncfusion/react-icons/src/icons/filter';
import { SumIcon } from '@syncfusion/react-icons/src/icons/sum';
import { Button } from '@syncfusion/react-buttons/src/button';
import { PivotMemberFilter } from './PivotMemberFilter';
import { PivotPanel } from './PivotPanel';
import { pivotMemberOptions } from '../services/pivot-members';
import { selectPivotMemberDomain } from '../models/pivot-data';
import { applyPivotControlCommand, createPivotLocalization, getPivotFieldCapabilities } from '../services/pivot-controls';
import type { PivotFieldCapability } from '../services/pivot-controls';
import type { PivotSettings, PivotErrorEvent, PivotResultRow, PivotResultColumn, PivotMemberFilter as PivotMemberFilterType,
    PivotAggregateType, PivotCustomAggregate, PivotValue } from '../types/pivot.interfaces';
import type { PivotResult } from '../services/pivot-result';
import type { Dispatch, SetStateAction, RefObject, FocusEvent, MouseEvent as ReactMouseEvent, JSX } from 'react';
import type { FilterSettings } from '../types/filter.interfaces';
import type { SearchSettings, DataRequestEvent, ColumnResizeEndEvent } from '../../../grid';
import type { PageSizeMode } from '../types/enum';
import type { PivotPage } from '../services/pivot-session';
import type { VirtualBufferSettings } from '../types/virtualization.interface';
import type { IL10n } from '@syncfusion/react-base';
import type { PivotMemberOption } from '../services/pivot-members';
import type { RowClassProps } from '../types/grid.interfaces';
import type { IRow, IValueFormatter } from '../types/interfaces';
import type { PivotAxisPath } from '../types/pivot-contracts';

/**
 * Composes source and derived Grid renderers without crossing their row-type boundaries. @private
 *
 * @param {*} root0 - root0.
 * @param {*} root0.gridProps - root0.gridProps.
 * @param {*} root0.gridRef - root0.gridRef.
 * @returns {*} Result.
 */
export function PivotView<T>({ gridProps: props, gridRef }: PivotViewProps<T>): ReactElement {
    const pivot: { settings: PivotSettings<T>; change: (next: PivotSettings<T>) => void; columns: ColumnProps<T>[]; result: PivotResult; error: PivotErrorEvent; rows: PivotResultRow[]; expanded: Set<string>; toggle: (id: string) => void; setAllExpanded: (all?: boolean) => void; schema: string; sort: { field?: string; descending?: boolean; }; setSort: Dispatch<SetStateAction<{ field?: string; descending?: boolean; }>>; filter: FilterSettings; setFilter: (value: FilterSettings) => void; search: SearchSettings; setSearch: (value: SearchSettings) => void; session: { dataSource: { result: PivotResultRow[]; count: number; }; onDataRequest: (event: DataRequestEvent) => void; pageSettings: { enabled: boolean; pageSize: number; currentPage: number; pageSizeControlledBy?: 'server' | 'client'; pageCount?: number; totalRecordsCount?: number; estimatedTotalRecordsCount?: number; pageSizeMode?: PageSizeMode; template?: string | ReactElement | Function; }; page: PivotPage; status: 'idle' | 'calculating' | 'ready' | 'error'; error?: PivotErrorEvent; enabled: boolean; }; } = usePivot(props);
    const latestPivot: RefObject<{ settings: PivotSettings<T>; change: (next: PivotSettings<T>) => void; columns: ColumnProps<T>[]; result: PivotResult; error: PivotErrorEvent; rows: PivotResultRow[]; expanded: Set<string>; toggle: (id: string) => void; setAllExpanded: (all?: boolean) => void; schema: string; sort: { field?: string; descending?: boolean; }; setSort: Dispatch<SetStateAction<{ field?: string; descending?: boolean; }>>; filter: FilterSettings; setFilter: (value: FilterSettings) => void; search: SearchSettings; setSearch: (value: SearchSettings) => void; session: { dataSource: { result: PivotResultRow[]; count: number; }; onDataRequest: (event: DataRequestEvent) => void; pageSettings: { enabled: boolean; pageSize: number; currentPage: number; pageSizeControlledBy?: 'server' | 'client'; pageCount?: number; totalRecordsCount?: number; estimatedTotalRecordsCount?: number; pageSizeMode?: PageSizeMode; template?: string | ReactElement | Function; }; page: PivotPage; status: 'idle' | 'calculating' | 'ready' | 'error'; error?: PivotErrorEvent; enabled: boolean; }; }> = useRef(pivot);
    latestPivot.current = pivot;
    const disabled: {
        virtualization: {
            enabled: boolean;
        };
        selection: {
            enabled: boolean;
        };
        sort: {
            enabled: boolean;
        };
        filter: {
            enabled: boolean;
        };
    } = useMemo(() => ({ virtualization: { enabled: false }, selection: { enabled: false },
        sort: { enabled: false }, filter: { enabled: false } }), []);
    const virtualization: {
        enabled: boolean;
    } | {
        enabled: boolean;
        type: VirtualDomType;
        scrollMode: ScrollMode;
        viewPortBuffer?: VirtualBufferSettings;
        preventMaxRenderedRows?: boolean;
        enableCache?: boolean;
        throttleTime?: number;
    } = useMemo(() => pivot.session.enabled &&
        (props.virtualizationSettings?.enabled || props.virtualizationSettings?.scrollMode === ScrollMode.Virtual) ?
        { ...props.virtualizationSettings, enabled: true, type: props.virtualizationSettings?.type || VirtualDomType.Row,
            scrollMode: ScrollMode.Virtual } : disabled.virtualization,
                [pivot.session.enabled, props.virtualizationSettings, disabled]);
    const sourceRef: RefObject<GridRef<T>> = useRef<GridRef<T>>(null);
    const resultRef: RefObject<GridRef<PivotResultRow>> = useRef<GridRef<PivotRow>>(null);
    const pivotTooltipRef: RefObject<ITooltip> = useRef<ITooltip>(null);
    const pivotTooltipContentRef: RefObject<ReactNode> = useRef<ReactNode>(null);
    const pivotTooltipTargetRef: RefObject<HTMLElement | null> = useRef<HTMLElement | null>(null);
    const [sourceVisited, setSourceVisited] = useState(!pivot.settings.enabled);
    const [memberPopup, setMemberPopup] = useState<{field: string; anchor?: HTMLElement}>();
    const localization: IL10n = useMemo(() => createPivotLocalization(props.locale), [props.locale]);
    const showValueTooltip: boolean = pivot.settings.showTooltip === true;
    const getMemberData: (field: string, report: PivotSettings<T>) =>
    { allKeys: string[]; options: PivotMemberOption[]; error?: string; } = useCallback((field: string,
                                                                                        report: PivotSettings<T>) => {
        try {
            const domain: {
                all: T[];
                available: T[];
            } = selectPivotMemberDomain(props, pivot.columns, pivot.filter, pivot.search, report, field);
            const blanks: {
                null: string;
                undefined: string;
                empty: string;
            } = {null: localization.getConstant('pivotNullMember'), undefined: localization.getConstant('pivotUndefinedMember'), empty: localization.getConstant('pivotEmptyMember')};
            const all: PivotMemberOption[] = pivotMemberOptions(domain.all, field, blanks);
            const availableKeys: Set<string> = new Set(pivotMemberOptions(domain.available, field, blanks)
                .map((item: PivotMemberOption) => item.key));
            return {allKeys: all.map((item: PivotMemberOption) => item.key),
                options: all.filter((item: PivotMemberOption) => availableKeys.has(item.key))};
        } catch (error) { return {allKeys: [], options: [], error: (error as Error).message}; }
    }, [ props.dataSource, props.query, props.virtualizationSettings, props.onDataRequest,
        pivot.columns, pivot.filter, pivot.search, localization]);
    const memberData: { allKeys: string[]; options: PivotMemberOption[]; error?: string; } = useMemo(() => memberPopup ?
        getMemberData(memberPopup.field, pivot.settings) : undefined, [memberPopup, getMemberData, pivot.settings]);
    const previousPivotColumns: RefObject<ColumnProps<PivotResultRow>[]> = useRef<ColumnProps<PivotRow>[]>([]);
    const previousDefaults: RefObject<ColumnProps<PivotResultRow>[]> = useRef([]);
    const userPresentation: RefObject<Map<string, Partial<ColumnProps<PivotResultRow>>>> = useRef(new Map());
    const customizationRevision: RefObject<number> = useRef(0);
    const callbacks: RefObject<unknown[]> = useRef([]);
    const previousMemberSort: RefObject<string> = useRef('');
    const capturePresentation: (kind: 'visibility' | 'order') => void = (kind: 'visibility' | 'order'): void => {
        queueMicrotask(() => {
            const live: ColumnProps<PivotResultRow>[] = (resultRef.current?.getColumns() || []) as ColumnProps<PivotResultRow>[];
            const ranks: Map<string, number> = new Map(live.map((column: ColumnProps<PivotResultRow>, index: number) =>
                [column.field, column.orderIndex ?? index]));
            if (kind === 'visibility') {
                live.filter((column: ColumnProps<PivotResultRow>) => column.field?.startsWith('cells.'))
                    .forEach((column: ColumnProps<PivotResultRow>) => {
                        userPresentation.current.set(column.field,
                                                     {...userPresentation.current.get(column.field), visible: column.visible !== false});
                    });
            } else {
                const rank: (column: ColumnProps<PivotResultRow>) => number = (column: ColumnProps<PivotResultRow>): number =>
                    Math.min(...flattenPivotColumns([column]).map((leaf: ColumnProps<PivotResultRow>) =>
                        ranks.get(leaf.field) ?? Number.MAX_SAFE_INTEGER));
                const order: (items: ColumnProps<PivotResultRow>[]) => void = (items: ColumnProps<PivotResultRow>[]): void => {
                    items.sort((a: ColumnProps<PivotResultRow>, b: ColumnProps<PivotResultRow>) => rank(a) - rank(b));
                    items.forEach((column: ColumnProps<PivotResultRow>) => { if (column.columns) { order(column.columns); } });
                };
                order(previousPivotColumns.current);
            }
        });
    };
    const [pinRevision, setPinRevision] = useState(0);
    const [labelPresentation, setLabelPresentation] = useState<Partial<ColumnProps<PivotRow>>>({});
    const labelWidth: RefObject<number> = useRef<number | undefined>(undefined);
    const active: boolean = !!pivot.settings.enabled;
    useEffect(() => {
        if (!active) { setSourceVisited(true); }
        if (active && sourceRef.current) {
            pivot.setFilter({ ...sourceRef.current.filterSettings });
            pivot.setSearch({ ...sourceRef.current.searchSettings });
        }
        sourceRef.current?.clearSelection?.();
    }, [active]);
    const valueFormatter: IValueFormatter = useValueFormatter(props.locale);
    const formatMember: (path: PivotAxisPath, fallback: string) => string = useMemo(
        () => createPivotMemberFormatter(pivot.columns, valueFormatter), [pivot.columns, valueFormatter]);
    const generatedColumns: ColumnProps<PivotRow>[] = useMemo(() => {
        if (props.customizePivotColumn || props.customizePivotColumnGroup ||
            callbacks.current[0] !== props.customizePivotColumn || callbacks.current[1] !== props.customizePivotColumnGroup) {
            callbacks.current = [props.customizePivotColumn, props.customizePivotColumnGroup];
            customizationRevision.current++;
        }
        // Hierarchy, sort, and member-filter changes must use the engine's order;
        // otherwise surviving totals sort ahead of restored members.
        const memberSort: string = JSON.stringify([
            pivot.settings.columns || [], pivot.settings.memberSorts || [], pivot.settings.memberFilters || []
        ]);
        const formatHeaders: (items: ColumnProps<PivotRow>[]) => ColumnProps<PivotRow>[] =
            (items: ColumnProps<PivotRow>[]): ColumnProps<PivotRow>[] => items.map((column: ColumnProps<PivotRow>) => {
                const group: PivotResult['resultGroups'][number] = pivot.result.resultGroups?.find(
                    (item: PivotResult['resultGroups'][number]) => item.id === column.uid);
                return {...column, headerText: group ? formatMember(group.path, column.headerText) : column.headerText,
                    ...(column.columns ? {columns: formatHeaders(column.columns)} : {})};
            });
        const customized: ColumnProps<PivotResultRow>[] = customizePivotColumns(
            {...pivot.result, columns: formatHeaders(pivot.result.columns)}, pivot.columns, props);
        const presentation: ColumnProps<PivotResultRow>[] =
            pivotUserPresentation(previousPivotColumns.current, previousDefaults.current);
        const reconciled: ColumnProps<PivotResultRow>[] =
            reconcilePivotColumns(customized, presentation, memberSort === previousMemberSort.current);
        flattenPivotColumns(reconciled).forEach((column: ColumnProps<PivotResultRow>) => {
            Object.assign(column, userPresentation.current.get(column.field));
        });
        previousDefaults.current = customized;
        previousMemberSort.current = memberSort;
        previousPivotColumns.current = reconciled;
        return reconciled;
    }, [pivot.result.columns, formatMember, props.customizePivotColumn, props.customizePivotColumnGroup]);
    const columnExpansionKey: string = JSON.stringify([
        pivot.settings.columns, pivot.settings.values, pivot.settings.defaultExpanded
    ]);
    const [columnExpansion, setColumnExpansion] = useState<{key: string; toggled: Set<string>}>(
        {key: columnExpansionKey, toggled: new Set()});
    const toggledColumns: Set<string> = columnExpansion.key === columnExpansionKey ?
        columnExpansion.toggled : new Set<string>();
    const columnFocus: RefObject<string> = useRef<string | undefined>(undefined);
    const visibleColumns: ColumnProps<PivotResultRow>[] = useMemo(() => {
        const project: (items: ColumnProps<PivotRow>[], path?: string[]) => ColumnProps<PivotRow>[] =
            (items: ColumnProps<PivotRow>[], path: string[] = []): ColumnProps<PivotRow>[] =>
                items.map((column: ColumnProps<PivotResultRow>) => {
                    if (!column.columns?.length) { return {...column}; }
                    const groupPath: string[] = [...path, column.headerText];
                    const groups: ColumnProps<PivotResultRow>[] = column.columns.filter((child: ColumnProps<PivotResultRow>) =>
                        child.columns?.length);
                    const summaries: ColumnProps<PivotResultRow>[] = column.columns.filter((child: ColumnProps<PivotResultRow>) =>
                        !child.columns?.length);
                    // Only dimension groups with both children and engine totals can collapse.
                    if (!groups.length || !summaries.length) {
                        return {...column, columns: project(column.columns, groupPath)};
                    }
                    const expanded: boolean = !!pivot.settings.defaultExpanded !== toggledColumns.has(column.uid);
                    return {...column, columns: expanded ? project(groups, groupPath) :
                        summaries.map((child: ColumnProps<PivotResultRow>) => ({...child})),
                    headerTemplate: (context: ColumnHeaderTemplateProps) => <span className="sf-pivot-column-label"><span>
                        {column.headerTemplate ? typeof column.headerTemplate === 'string' || isValidElement(column.headerTemplate) ?
                            column.headerTemplate : createElement(column.headerTemplate, context) : column.headerText}</span>
                    <button type="button" className="sf-pivot-expand" data-pivot-column-group={column.uid}
                        onFocus={(event: FocusEvent<HTMLButtonElement, Element>) => event.stopPropagation()}
                        onBlur={(event: FocusEvent<HTMLButtonElement, Element>) => {
                            if (event.relatedTarget) { columnFocus.current = undefined; }
                        }}
                        ref={(button: HTMLButtonElement) => {
                            if (button && columnFocus.current === column.uid) {
                                requestAnimationFrame(() => {
                                    if (button.isConnected && button.getClientRects().length && columnFocus.current === column.uid) {
                                        button.focus({preventScroll: true});
                                    }
                                });
                            }
                        }}
                        aria-expanded={expanded} aria-label={`${expanded ? 'Collapse' : 'Expand'} column group ${groupPath.join(' / ')}`}
                        onClick={(event: ReactMouseEvent<HTMLButtonElement, globalThis.MouseEvent>) => {
                            event.stopPropagation();
                            columnFocus.current = column.uid;
                            setColumnExpansion((previous: {
                                key: string;
                                toggled: Set<string>;
                            }) => {
                                const toggled: Set<string> = new Set(previous.key === columnExpansionKey ? previous.toggled : []);
                                if (toggled.has(column.uid)) { toggled.delete(column.uid); } else { toggled.add(column.uid); }
                                return {key: columnExpansionKey, toggled};
                            });
                        }}>{expanded ? <ChevronDownIcon aria-hidden="true" width={20} height={20} /> : <ChevronRightIcon aria-hidden="true" width={20} height={20} />}</button>
                    </span>};
                });
        const projected: ColumnProps<PivotResultRow>[] = project(generatedColumns);
        // A group can straddle pinned and scrolling columns. Keep its hierarchy in
        // each section, with distinct group IDs and unchanged leaf identities.
        const section: (items: ColumnProps<PivotRow>[], side?: 'Left' | 'Right') => ColumnProps<PivotRow>[] = (items: ColumnProps<PivotRow>[], side?: 'Left'|'Right'): ColumnProps<PivotRow>[] => items.flatMap((item: ColumnProps<PivotResultRow>) => {
            if (!item.columns?.length) {
                const pin: 'Left' | 'Right' = item.pinDirection === 'Left' || item.pinDirection === 'Right' ? item.pinDirection : undefined;
                return pin === side ? [item] : [];
            }
            const children: ColumnProps<PivotResultRow>[] = section(item.columns, side);
            return children.length ? [{...item, uid: side ? `${item.uid}::pin:${side}` : item.uid, columns: children, pinDirection: side}] : [];
        });
        return [...section(projected, 'Left'), ...section(projected), ...section(projected, 'Right')];
    }, [generatedColumns, columnExpansion, columnExpansionKey, pinRevision]);
    const rowLabelTemplate: ({ data }: ColumnTemplateProps<PivotRow>) => JSX.Element = useCallback(
        ({ data }: ColumnTemplateProps<PivotRow>) => {
            if (!data || !('id' in data)) { return null; }
            const expanded: boolean = latestPivot.current.expanded.has(data.id);
            const label: string = formatMember(data.path, data.label);
            return <span className="sf-pivot-row-label" style={{ paddingInlineStart: `${data.level}em` }}>
                {data.hasChildren && <button type="button" className="sf-pivot-expand" aria-expanded={expanded}
                    aria-label={`${expanded ? 'Collapse' : 'Expand'} ${label}`} onClick={() => latestPivot.current.toggle(data.id)}>
                    {expanded ? <ChevronDownIcon aria-hidden="true" width={20} height={20} /> : <ChevronRightIcon aria-hidden="true" width={20} height={20} />}
                </button>}<span>{label}</span>
            </span>;
        }, [pivot.expanded, formatMember]);
    const columns: ColumnProps<PivotRow>[] = useMemo(() => {
        const label: ColumnProps<PivotRow> = {
            field: 'label', headerText: pivot.settings.rows?.length ? localization.getConstant('pivotRows') : 'Summary', minWidth: 160,
            ...labelPresentation,
            width: labelWidth.current ?? 240,
            template: rowLabelTemplate
        };
        const left: ColumnProps<PivotResultRow>[] = visibleColumns.filter((column: ColumnProps<PivotResultRow>) => column.pinDirection === 'Left');
        const right: ColumnProps<PivotResultRow>[] = visibleColumns.filter((column: ColumnProps<PivotResultRow>) => column.pinDirection === 'Right');
        const center: ColumnProps<PivotResultRow>[] = visibleColumns.filter((column: ColumnProps<PivotResultRow>) => column.pinDirection !== 'Left' && column.pinDirection !== 'Right');
        return [{field: 'id', isPrimaryKey: true, visible: false, showInColumnChooser: false},
            ...(label.pinDirection === 'Left' ? [label, ...left] : left),
            ...(label.pinDirection !== 'Left' && label.pinDirection !== 'Right' ? [label, ...center] : center),
            ...right, ...(label.pinDirection === 'Right' ? [label] : [])];
    }, [visibleColumns, rowLabelTemplate, pivot.settings.rows, labelPresentation, localization]);
    useImperativeHandle(gridRef, () => new Proxy({} as GridRef<T>, {
        get: (_target: GridRef<T>, key: string) => {
            if (!active) {
                const member: unknown = sourceRef.current ? Reflect.get(sourceRef.current, key) : undefined;
                return typeof member === 'function' ? member.bind(sourceRef.current) : member;
            }
            if (key === 'element') { return resultRef.current?.element; }
            if (key === 'getColumns') { return () => pivot.columns.map((column: ColumnProps<T>) => ({ ...column })); }
            if (key === 'columns') { return pivot.columns; }
            if (key === 'filterSettings') { return pivot.filter; }
            if (key === 'searchSettings') { return pivot.search; }
            if (key === 'selectedRowIndexes') { return []; }
            if (key === 'currentViewData') { return []; }
            if (key === 'search') { return (value: string) => pivot.setSearch({ ...pivot.search, enabled: true, value }); }
            if (key === 'filterByColumn') { return (field: string, operator: string, value: FilterPredicates['value']) =>
                pivot.setFilter({ ...pivot.filter, enabled: true, columns: [
                    ...(pivot.filter.columns || []).filter((item: FilterPredicates) => item.field !== field),
                    { field, operator, value }
                ] }); }
            if (key === 'clearFilter') { return () => {
                pivot.setFilter({ ...pivot.filter, columns: [] });
                pivot.change({...pivot.settings, memberFilters: []});
            }; }
            if (key === 'sortByColumn') { return (field: string, direction: string) => pivot.setSort({ field, descending: direction === SortDirection.Descending }); }
            if (key === 'clearSort') { return () => pivot.setSort({}); }
            if (key === 'goToPage') { return (page: number) => resultRef.current?.goToPage(page); }
            if (key === 'clearSelection') { return () => resultRef.current?.clearSelection(); }
            // Source-record APIs cannot safely expose or mutate internal summary rows.
            return () => { throw new Error(`${key} is unavailable in pivot mode.`); };
        }
    }), [active, pivot.columns, pivot.filter, pivot.search, pivot.setFilter, pivot.setSearch]);
    const renderColumnMenu: (menu: PivotColumnMenuHostProps) => ReactElement = (menu: PivotColumnMenuHostProps): ReactElement => {
        const column: ColumnProps<PivotResultRow> = menu.column as ColumnProps<PivotRow>;
        const leaves: ColumnProps<PivotResultRow>[] = flattenPivotColumns([column])
            .filter((item: ColumnProps<PivotResultRow>) => item.field && item.field !== 'id');
        let dimension: string | undefined;
        const findDimension: (items: ColumnProps<PivotRow>[], depth: number) => void =
            (items: ColumnProps<PivotRow>[], depth: number): void => {
                for (const item of items) {
                    if (item.uid === column.uid?.split('::pin:')[0] && item.columns?.length && item.headerText !== 'Grand Total') {
                        dimension = pivot.settings.columns?.slice(depth, depth + 1)[0];
                    }
                    if (item.columns?.length) { findDimension(item.columns, depth + 1); }
                }
            };
        findDimension(generatedColumns, 0);
        const valueColumn: PivotResultColumn | undefined = pivot.result.resultColumns.find((item: PivotResultColumn) => `cells.${item.id}` === column.field);
        const sourceField: string = dimension || valueColumn?.measure.field;
        const valueIndex: number = valueColumn ? (pivot.settings.values || []).findIndex(
            (value: PivotValue<T>) => value.field === sourceField &&
            (value.type === 'Average' ? 'Avg' : value.type) === valueColumn.measure.aggregateType
        ) : -1;
        const capabilities: PivotFieldCapability<T>[] = getPivotFieldCapabilities(pivot.columns, pivot.settings, pivot.result.fieldTypes);
        const aggregates: readonly PivotAggregateType[] = capabilities.find(
            (item: PivotFieldCapability<T>) => item.field === sourceField
        )?.aggregates || [];
        const sortable: boolean = props.sortSettings?.enabled === true && (!!dimension || column.allowSort !== false) && (sourceField ?
            pivot.columns.find((item: ColumnProps<T>) => item.field === sourceField)?.allowSort !== false : column.field === 'label' ?
                (pivot.settings.rows || []).every((field: (string & {}) | Extract<keyof T, string>) =>
                    pivot.columns.find((item: ColumnProps<T>) => item.field === field)?.allowSort !== false) :
                !!column.field && column.field !== 'id');
        const sortField: (field: string, descending?: boolean) => void = (field: string, descending?: boolean): void => {
            const next: PivotSettings<T> = applyPivotControlCommand(
                pivot.settings, {type: 'sort', field,
                    direction: descending === undefined ? undefined : descending ? 'Descending' : 'Ascending'},
                getPivotFieldCapabilities(pivot.columns, pivot.settings, pivot.result.fieldTypes));
            if (next !== pivot.settings) { pivot.change(next); }
        };
        const sort: (descending?: boolean) => void = (descending?: boolean): void => {
            if (dimension) {
                sortField(dimension, descending);
            } else { pivot.setSort(descending === undefined ? {} : {field: column.field, descending}); }
        };
        const rowSortItems: (descending?: boolean) => PivotColumnMenuItem[] | undefined =
            (descending?: boolean): PivotColumnMenuItem[] | undefined => column.field === 'label' ?
                (pivot.settings.rows || []).map((field: (string & {}) | Extract<keyof T, string>) =>
                    ({id: `sort:${field}:${descending}`, text: pivot.columns.find((item: ColumnProps<T>) =>
                        item.field === field)?.headerText || field,
                    disabled: props.sortSettings?.enabled !== true || pivot.columns.find((item: ColumnProps<T>) =>
                        item.field === field)?.allowSort === false,
                    run: () => sortField(field, descending)})) : undefined;
        const rowSortable: boolean = column.field === 'label' && props.sortSettings?.enabled === true &&
            (pivot.settings.rows || []).some((field: (string & {}) | Extract<keyof T, string>) =>
                pivot.columns.find((item: ColumnProps<T>) => item.field === field)?.allowSort !== false);
        const pin: (direction?: 'Left' | 'Right') => void = (direction?: 'Left'|'Right'): void => {
            for (const leaf of leaves) {
                userPresentation.current.set(leaf.field, {...userPresentation.current.get(leaf.field), pinDirection: direction || 'None'});
                if (direction) { resultRef.current?.pinColumn(leaf.field, direction); } else { resultRef.current?.unpinColumn(leaf.field); }
                const saved: ColumnProps<PivotResultRow> = flattenPivotColumns(previousPivotColumns.current)
                    .find((item: ColumnProps<PivotResultRow>) => item.uid === leaf.uid);
                if (saved) { saved.pinDirection = direction; }
                if (leaf.field === 'label') {
                    setLabelPresentation((previous: Partial<ColumnProps<PivotResultRow>>) =>
                        ({...previous, pinDirection: direction}));
                }
            }
            setPinRevision((previous: number) => previous + 1);
        };
        const hasRows: boolean = !!pivot.settings.rows?.length;
        const memberFields: string[] = (column.field === 'label' ? pivot.settings.rows || [] : dimension ? [dimension] : [])
            .filter((field: string) => pivot.columns.find((item: ColumnProps<T>) => item.field === field)?.allowFilter !== false);
        const autoSize: (items: ColumnProps<PivotRow>[]) => void = (items: ColumnProps<PivotRow>[]): void => {
            resultRef.current?.autoFitColumns(items.filter((item: ColumnProps<PivotResultRow>) =>
                item.field && item.visible !== false && item.allowResize !== false)
                .map((item: ColumnProps<PivotResultRow>) => ({field: item.field, autoFit: AutoFitMode.All})));
        };
        const items: PivotColumnMenuItem[] = [
            {id: 'sortAsc', text: 'Sort Ascending', icon: <SortAscendingIcon/>, disabled: !(sortable || rowSortable), items: rowSortItems(false), run: column.field === 'label' ? undefined : () => sort(false)},
            {id: 'sortDesc', text: 'Sort Descending', icon: <SortDescendingIcon/>, disabled: !(sortable || rowSortable), items: rowSortItems(true), run: column.field === 'label' ? undefined : () => sort(true)},
            {id: 'clearSort', text: 'Clear Sort', icon: <ClearSortIcon/>, disabled: !(sortable || rowSortable), items: rowSortItems(), run: column.field === 'label' ? undefined : () => sort()},
            ...(props.filterSettings?.enabled === true && props.columnMenuSettings?.showFilter === true && memberFields.length ? [{id: 'members', text: localization.getConstant('pivotFilterMembers'), icon: <FilterIcon/>,
                items: memberFields.map((field: string) => ({id: `member:${field}`,
                    text: pivot.columns.find((item: ColumnProps<T>) => item.field === field)?.headerText || field,
                    icon: <FilterIcon/>, run: () => setMemberPopup({field, anchor: menu.targetRef?.current})}))}] : []),
            {id: 'sep1', separator: true},
            {id: 'pin', text: 'Pin Column', icon: <PinIcon/>, disabled: !leaves.length || props.pinningSettings?.enabled !== true, items: [
                {id: 'pinLeft', text: 'Pin Left', icon: <PinIcon/>, run: () => pin('Left')},
                {id: 'pinRight', text: 'Pin Right', icon: <PinIcon/>, run: () => pin('Right')},
                {id: 'unpin', text: 'No Pin', icon: <UnpinIcon/>, run: () => pin()}
            ]},
            {id: 'sep2', separator: true},
            ...(valueIndex >= 0 ? [{id: 'aggregation', text: localization.getConstant('pivotValueAggregation'), icon: <SumIcon/>,
                items: aggregates.map((aggregate: PivotAggregateType) => ({id: `aggregate:${aggregate}`,
                    text: pivot.settings.customAggregates?.find(
                        (item: PivotCustomAggregate) => item.name === aggregate
                    )?.label || aggregate,
                    icon: pivot.settings.values[valueIndex as number].type === aggregate ?
                        <svg aria-label="Selected" width="16" height="16" viewBox="0 0 16 16">
                            <path d="M3 8l3 3 7-7" fill="none" stroke="currentColor" strokeWidth="2"/>
                        </svg> : undefined,
                    disabled: pivot.settings.values.some((value: PivotValue<T>, index: number) => index !== valueIndex &&
                        value.field === sourceField && value.type === aggregate),
                    run: () => {
                        const next: PivotSettings<T> = applyPivotControlCommand(pivot.settings, {type: 'aggregate', index: valueIndex, aggregate}, capabilities);
                        if (next !== pivot.settings) { pivot.change(next); }
                    }}))}] : []),
            {id: 'sizeThis', text: 'Autosize This Column', icon: <ResizeIcon/>,
                disabled: !leaves.some((item: ColumnProps<PivotResultRow>) => item.allowResize !== false) ||
                    props.resizeSettings?.enabled !== true,
                run: () => autoSize(leaves)},
            {id: 'sizeAll', text: 'Autosize All Columns', icon: <ResizeIcon/>, disabled: props.resizeSettings?.enabled !== true,
                run: () => autoSize(flattenPivotColumns(columns))},
            {id: 'sep3', separator: true},
            {id: 'expandAll', text: 'Expand All Row Groups', icon: <ExpandIcon/>, disabled: !hasRows, run: () => pivot.setAllExpanded(true)},
            {id: 'collapseAll', text: 'Collapse All Row Groups', icon: <CollapseIcon/>, disabled: !hasRows, run: () => pivot.setAllExpanded(false)}
        ];
        return <PivotColumnMenu {...menu} items={items}/>;
    };
    // GridBase caches its header and data layout. Recreate that layout when its
    // paging, pin placement or menu mode changes, while retaining the pivot report above it.
    // Aggregate types change values and bindings, but not the result grid's structure.
    // Keep the grid mounted for those updates to avoid replaying its loading state.
    const resultLayoutKey: string = JSON.stringify([pivot.settings.enabled, pivot.settings.rows, pivot.settings.columns,
        pivot.settings.defaultExpanded, pivot.settings.showGrandTotals,
        pivot.result.resultColumns.map((column: PivotResultColumn) => [column.path, column.measure.field, column.totalKind]),
        virtualization.enabled,
        props.pageSettings?.enabled, props.columnMenuSettings?.enabled, pinRevision, customizationRevision.current]);
    const sourceRecords: readonly T[] = useMemo(() => {
        return Array.isArray(props.dataSource) ? props.dataSource as T[] : [];
    }, [props.dataSource]);
    const closePivotValueTooltip: () => void = useCallback(() => {
        pivotTooltipTargetRef.current = null;
        pivotTooltipContentRef.current = null;
        pivotTooltipRef.current?.closeTooltip?.();
    }, []);
    const openPivotValueTooltip: (event: ReactMouseEvent<HTMLDivElement>) => void = useCallback((event:
    ReactMouseEvent<HTMLDivElement>) => {
        if (!showValueTooltip || !active) {
            return;
        }
        const cell: HTMLElement | null = (event.target as Element | null)?.closest?.('td[role="gridcell"][data-mappinguid]') as HTMLElement | null;
        if (!cell || !resultRef.current?.element?.contains(cell)) {
            if (pivotTooltipTargetRef.current) {
                closePivotValueTooltip();
            }
            return;
        }
        const mappingUid: string | null = cell.getAttribute('data-mappinguid');
        const cellColumn: ColumnProps<PivotResultRow> = flattenPivotColumns(columns)[Number(cell.getAttribute('data-colindex'))];
        const fieldIdentity: string = cellColumn?.field?.startsWith('cells.') ? cellColumn.field.slice(6) : undefined;
        const resultColumn: PivotResultColumn | undefined =
            findPivotResultColumn(pivot.result.resultColumns || [], fieldIdentity || mappingUid);
        if (!resultColumn) {
            if (pivotTooltipTargetRef.current) {
                closePivotValueTooltip();
            }
            return;
        }
        const rowElement: HTMLElement | null = cell.closest('tr[data-uid]') as HTMLElement | null;
        const rowUid: string | null = rowElement?.getAttribute('data-uid') || null;
        const rowObject: IRow<ColumnProps<PivotResultRow>> | undefined = rowUid
            ? resultRef.current?.getRowObjectFromUID?.(rowUid)
            : undefined;
        const rowData: PivotResultRow | undefined = rowObject?.data as PivotResultRow | undefined;
        if (!rowData) {
            if (pivotTooltipTargetRef.current) {
                closePivotValueTooltip();
            }
            return;
        }
        const value: number | undefined = rowData.cells?.[resultColumn.id] as number | undefined;
        const context: PivotCellContext<T> = {
            source: sourceRecords,
            row: rowData,
            column: resultColumn,
            value
        };
        const leafColumn: ColumnProps<PivotResultRow> | undefined = flattenPivotColumns(columns)
            .find((item: ColumnProps<PivotResultRow>) => item.uid === resultColumn.id || item.field === `cells.${resultColumn.id}`);
        const format: string | undefined = typeof leafColumn?.format === 'string' ? leafColumn.format : undefined;
        const measureHeader: string | undefined = pivot.columns.find((column: ColumnProps<T>) =>
            column.field === resultColumn.measure?.field)?.headerText
            || resultColumn.measure?.field;
        const findColumnCaption: (items: ColumnProps<PivotRow>[], ancestors?: string[]) => string | undefined =
            (items: ColumnProps<PivotRow>[], ancestors: string[] = []): string | undefined => {
                for (const item of items) {
                    if (item.field === `cells.${resultColumn.id}`) { return ancestors.join(' - '); }
                    if (item.columns?.length) {
                        const match: string = findColumnCaption(item.columns, [...ancestors, item.headerText || '']);
                        if (match !== undefined) { return match; }
                    }
                }
                return undefined;
            };
        const content: ReactNode = pivot.settings.tooltipTemplate
            ? pivot.settings.tooltipTemplate(context)
            : buildDefaultPivotTooltipContent(context, measureHeader, format, cell.textContent?.trim(),
                                              findColumnCaption(generatedColumns),
                                              rowData.path.map((member: PivotAxisPath[number]) => formatMember(
                                                  [member], member.value == null ? '' : String(member.value))).filter(Boolean).join(' - '));
        pivotTooltipContentRef.current = content;
        if (pivotTooltipTargetRef.current !== cell) {
            pivotTooltipTargetRef.current = cell;
            pivotTooltipRef.current?.openTooltip?.(cell);
        }
    }, [showValueTooltip, active, pivot.result.resultColumns, pivot.settings.tooltipTemplate, pivot.columns,
        sourceRecords, columns, generatedColumns, formatMember, closePivotValueTooltip]);
    const handlePivotMouseOut: (event: ReactMouseEvent<HTMLDivElement>) => void = useCallback((event: ReactMouseEvent<HTMLDivElement>) => {
        if (!showValueTooltip || !pivotTooltipTargetRef.current) {
            return;
        }
        const related: Element | null = event.relatedTarget as Element | null;
        const nextCell: HTMLElement | null = related?.closest?.('td[role="gridcell"][data-mappinguid]') as HTMLElement | null;
        if (nextCell && nextCell === pivotTooltipTargetRef.current) {
            return;
        }
        if (related && pivotTooltipTargetRef.current.contains(related)) {
            return;
        }
        closePivotValueTooltip();
    }, [showValueTooltip, closePivotValueTooltip]);
    const pivotValueTooltip: JSX.Element | null = useMemo(() => {
        if (!showValueTooltip || !active) {
            return null;
        }
        return (
            <Tooltip
                key={`${props.id || 'pivot'}_ValueTooltip`}
                ref={pivotTooltipRef}
                opensOn={'Custom'}
                className={'sf-pivot-value-tooltip'}
                target={undefined}
                content={() => <div className="sf-pivot-tooltip-host">{pivotTooltipContentRef.current}</div>}
            />
        );
    }, [showValueTooltip, active, props.id]);
    return <div className="sf-pivot-view" dir={props.enableRtl ? 'rtl' : undefined}
        aria-busy={pivot.session.enabled && pivot.session.status === 'calculating'} data-pivot-status={pivot.session.status}
        onMouseOver={showValueTooltip ? openPivotValueTooltip : undefined}
        onMouseOut={showValueTooltip ? handlePivotMouseOut : undefined}>
        <div className="sf-pivot-workspace">
            <div className="sf-pivot-main">
                {active && <>
                    {pivot.session.enabled && pivot.session.status === 'calculating' && <div role="status">Calculating pivot results…</div>}
                    {pivot.error ? <div role="alert" className="sf-pivot-message">{pivot.error.message}</div> :
                        !pivot.settings.values?.length ? <GridBase<{label: string; message: string}>
                            key="empty-pivot" id={props.id} className={props.className}
                            width={props.width} height={props.height} locale={props.locale}
                            enableRtl={props.enableRtl} theme={props.theme} gridLines={props.gridLines || 'Both'}
                            rowHeight={props.rowHeight} allowKeyboard={props.allowKeyboard}
                            dataSource={[{label: localization.getConstant('pivotGrandTotal'),
                                message: localization.getConstant('noRecordsMessage')}]}
                            columns={[
                                {field: 'label', headerText: '', width: 160,
                                    template: () => <strong>{localization.getConstant('pivotGrandTotal')}</strong>},
                                {field: 'message', headerText: localization.getConstant('pivotGrandTotal'),
                                    headerTextAlign: 'Left', textAlign: 'Right'}
                            ]}
                            selectionSettings={disabled.selection} sortSettings={disabled.sort}
                            filterSettings={disabled.filter}/> :
                            <PivotColumnMenuContext.Provider value={renderColumnMenu}>
                                <GridBase<PivotRow> key={resultLayoutKey} ref={resultRef}
                                    dataSource={pivot.session.enabled ? pivot.session.dataSource : pivot.rows}
                                    onDataRequest={pivot.session.enabled ? pivot.session.onDataRequest : undefined} columns={columns}
                                    id={props.id} className={props.className} height={props.height} width={props.width}
                                    locale={props.locale} enableRtl={props.enableRtl} theme={props.theme}
                                    modules={{ PagerModule, ResizeModule, AutoFitModule, ReorderModule, ColumnChooserModule,
                                        ToolbarModule, ContextMenuModule, PinningModule }}
                                    pinningSettings={{enabled: props.pinningSettings?.enabled === true,
                                        type: PinScope.Column}}
                                    pageSettings={pivot.session.enabled ? pivot.session.pageSettings :
                                        { ...props.pageSettings, currentPage: 1 }}
                                    resizeSettings={props.resizeSettings} reorderSettings={props.reorderSettings}
                                    onColumnChooserApply={() => capturePresentation('visibility')}
                                    onColumnReorderEnd={() => capturePresentation('order')}
                                    onColumnResizeEnd={(event: ColumnResizeEndEvent) => {
                                        const savedState: Partial<ColumnProps<PivotResultRow>> =
                                            {...userPresentation.current.get(event.column.field), width: event.width};
                                        userPresentation.current.set(event.column.field, savedState);
                                        const column: ColumnProps<PivotResultRow> = flattenPivotColumns(previousPivotColumns.current)
                                            .find((item: ColumnProps<PivotResultRow>) => item.uid === event.column.uid);
                                        if (column) { column.width = event.width; }
                                        const displayed: ColumnProps<PivotResultRow> = flattenPivotColumns(visibleColumns)
                                            .find((item: ColumnProps<PivotResultRow>) => item.uid === event.column.uid);
                                        if (displayed) { displayed.width = event.width; }
                                        if (event.column.field === 'label') {
                                            labelWidth.current = event.width;
                                            const label: ColumnProps<PivotResultRow> = columns.find((item: ColumnProps<PivotResultRow>) => item.field === 'label');
                                            if (label) { label.width = event.width; }
                                        }
                                    }}
                                    textWrapSettings={props.textWrapSettings} rowNumberSettings={props.rowNumberSettings}
                                    gridLines={props.gridLines} rowHeight={props.rowHeight} allowKeyboard={props.allowKeyboard}
                                    showColumnChooser={props.showColumnChooser === true}
                                    columnChooserSettings={props.columnChooserSettings}
                                    columnMenuSettings={{enabled: props.columnMenuSettings?.enabled === true, showFilter: false}}
                                    toolbar={props.toolbar?.length && props.showColumnChooser ? ['ColumnChooser'] : []}
                                    contextMenuSettings={{enabled: props.contextMenuSettings?.enabled && props.pageSettings?.enabled,
                                        items: props.pageSettings?.enabled ? ['FirstPage', 'PrevPage', 'NextPage', 'LastPage'] : []}}
                                    virtualizationSettings={virtualization} selectionSettings={disabled.selection}
                                    sortSettings={disabled.sort} filterSettings={disabled.filter}
                                    rowClass={(args: RowClassProps<PivotResultRow>) => args.data && 'grandTotal' in args.data && args.data.grandTotal ? 'sf-pivot-grand-total' : ''}/></PivotColumnMenuContext.Provider>
                    }
                </>}
                {(sourceVisited || !active) && <div hidden={active}>
                    <GridBase<T> ref={sourceRef} {...props} id={active && props.id ? `${props.id}-source` : props.id}/>
                </div>}
                {memberPopup && memberData && (memberData.error ? <div role="alert">{memberData.error}<Button onClick={() => setMemberPopup(undefined)}>{localization.getConstant('pivotCancel')}</Button></div> :
                    <PivotMemberFilter key={JSON.stringify([memberPopup.field,
                        pivot.settings.memberFilters?.find((item: PivotMemberFilterType<T>) =>
                            item.field === memberPopup.field)])}
                    caption={pivot.columns.find((item: ColumnProps<T>) => item.field === memberPopup.field)?.headerText ||
                        memberPopup.field}
                    {...memberData} anchor={memberPopup.anchor} locale={props.locale} enableRtl={props.enableRtl}
                    selectedKeys={pivot.settings.memberFilters?.find((item: PivotMemberFilterType<T>) =>
                        item.field === memberPopup.field)?.memberKeys}
                    onClose={() => setMemberPopup(undefined)} onApply={(keys: string[]) => {
                        pivot.setFilter({...pivot.filter,
                            columns: (pivot.filter.columns || []).filter((item: FilterPredicates) =>
                                item.field !== memberPopup.field)});
                        pivot.change({...pivot.settings,
                            memberFilters: [...(pivot.settings.memberFilters || []).filter((item: PivotMemberFilterType<T>) =>
                                item.field !== memberPopup.field),
                            ...(keys === undefined ? [] : [{field: memberPopup.field, memberKeys: keys}])]});
                    }}/>)}
            </div>
            {pivot.settings.showPanel === true && <PivotPanel<T> columns={(props.columns || pivot.columns) as ColumnProps<T>[]}
                fieldTypes={pivot.result.fieldTypes}
                height={props.height}
                columnChildren={props.columns?.length ? undefined : props.children}
                settings={pivot.settings} locale={props.locale} enableRtl={props.enableRtl} onChange={pivot.change}
                getMemberData={getMemberData} sortingEnabled={props.sortSettings?.enabled === true}
                filteringEnabled={props.filterSettings?.enabled === true}/>}
        </div>
        {pivotValueTooltip}
    </div>;
}
