import { Children, isValidElement, useMemo, useState, useEffect, useRef } from 'react';
import { PivotHost } from '@syncfusion/pivot-engine';
import { createReactPivotHost } from '../services/pivot-host';
import { usePivotSession } from './usePivotSession';
import { GridProps } from '../types/grid.interfaces';
import { ColumnProps } from '../types/column.interfaces';
import { PivotSettings, PivotErrorEvent } from '../types/pivot.interfaces';
import { FilterSettings } from '../types/filter.interfaces';
import { SearchSettings } from '../types/search.interfaces';
import { buildPivotResult, flattenPivotColumns, visiblePivotRows, PivotRow, PivotResult } from '../services/pivot-result';
import { selectPivotSource } from '../models/pivot-data';
import { reconcilePivotMemberFilters } from '../services/pivot-members';
import type { PivotResultRow, PivotResultColumn, PivotValue, PivotMemberSort, PivotMemberFilter } from '../types/pivot.interfaces';
import type { Dispatch, SetStateAction, ReactElement, ReactNode, RefObject } from 'react';
import type { DataRequestEvent, PageSizeMode } from '../../../grid';
import type { PivotPage } from '../services/pivot-session';

/**
 * Structural comparison keeps callback identity significant while tolerating equivalent inline objects.
 *
 * @param {*} left - left.
 * @param {*} right - right.
 * @returns {*} Result.
 */
export function pivotInputEqual(left: unknown, right: unknown): boolean {
    if (Object.is(left, right)) { return true; }
    if (typeof left !== typeof right || left == null || right == null || typeof left !== 'object') { return false; }
    if (left instanceof Date || right instanceof Date) {
        return left instanceof Date && right instanceof Date && left.getTime() === right.getTime();
    }
    if (Array.isArray(left) || Array.isArray(right)) {
        return Array.isArray(left) && Array.isArray(right) && left.length === right.length &&
            left.every((value: unknown, index: number) => pivotInputEqual(value, right.slice(index, index + 1)[0]));
    }
    const leftRecord: Record<string, unknown> = left as Record<string, unknown>;
    const rightRecord: Record<string, unknown> = right as Record<string, unknown>;
    const leftKeys: string[] = Object.keys(leftRecord).sort();
    const rightKeys: string[] = Object.keys(rightRecord).sort();
    return leftKeys.length === rightKeys.length && leftKeys.every((key: string, index: number) =>
        key === rightKeys.slice(index, index + 1)[0] &&
        pivotInputEqual(Reflect.get(leftRecord, key), Reflect.get(rightRecord, key)));
}

/**
 * Atomic prop synchronization: equivalent inline props do not reset interactive choices.
 *
 * @param {*} input - input.
 * @returns {*} Result.
 */
function usePivotInput<V>(input: V): [V, (value: V) => void] {
    const [state, setState] = useState({ external: input, value: input });
    if (!pivotInputEqual(state.external, input)) { setState({ external: input, value: input }); }
    return [pivotInputEqual(state.external, input) ? state.value : input,
        (value: V) => setState((current: {
            external: V;
            value: V;
        }) => ({ ...current, value }))];
}

/**
 * Owns a React pivot report and derives immutable result state. @private
 *
 * @param {*} props - props.
 * @returns {*} Result.
 */
export function usePivot<T>(props: Partial<GridProps<T>>): { settings: PivotSettings<T>; change: (next: PivotSettings<T>) => void; columns: ColumnProps<T>[]; result: PivotResult; error: PivotErrorEvent; rows: PivotResultRow[]; expanded: Set<string>; toggle: (id: string) => void; setAllExpanded: (all?: boolean) => void; schema: string; sort: { field?: string; descending?: boolean; }; setSort: Dispatch<SetStateAction<{ field?: string; descending?: boolean; }>>; filter: FilterSettings; setFilter: (value: FilterSettings) => void; search: SearchSettings; setSearch: (value: SearchSettings) => void; session: { dataSource: { result: PivotResultRow[]; count: number; }; onDataRequest: (event: DataRequestEvent) => void; pageSettings: { enabled: boolean; pageSize: number; currentPage: number; pageSizeControlledBy?: 'server' | 'client'; pageCount?: number; totalRecordsCount?: number; estimatedTotalRecordsCount?: number; pageSizeMode?: PageSizeMode; template?: string | ReactElement | Function; }; page: PivotPage; status: 'idle' | 'calculating' | 'ready' | 'error'; error?: PivotErrorEvent; enabled: boolean; }; } {
    const [settings, setSettings] = usePivotInput<PivotSettings<T>>(props.pivotSettings || {});
    const [filter, setFilter] = usePivotInput<FilterSettings>(props.filterSettings || {});
    const [search, setSearch] = usePivotInput<SearchSettings>(props.searchSettings || {});
    const columns: ColumnProps<T>[] = useMemo(() => {
        if (props.columns?.length) { return flattenPivotColumns(props.columns as ColumnProps<T>[]); }
        const result: ColumnProps<T>[] = [];
        const walk: (children: GridProps<T>['children']) => void = (children: GridProps<T>['children']): void => Children.forEach(children, (child: ReactNode) => {
            if (isValidElement<ColumnProps<T> & { children?: GridProps<T>['children'] }>(child)) {
                if (child.props.field) { result.push(child.props); }
                else { walk(child.props.children); }
            }
        });
        walk(props.children);
        if (!result.length && Array.isArray(props.dataSource) && props.dataSource.length) {
            return Object.keys(props.dataSource[0]).map((field: string) => ({ field }));
        }
        return result;
    }, [props.columns, props.children, props.dataSource]);
    const host: PivotHost = useMemo(() => createReactPivotHost(props.locale), [props.locale]);
    const paged: boolean = !!settings.useEnginePaging || settings.execution === 'worker';
    const calculation: {
        result: PivotResult;
        error?: PivotErrorEvent;
    } = useMemo<{ result: PivotResult; error?: PivotErrorEvent }>(() => {
        try {
            const result: PivotResult = settings.enabled && !paged ?
                buildPivotResult(selectPivotSource({...props, pivotSettings: settings}, columns, filter, search),
                                 columns, settings, host) : { rows: [], columns: [], resultColumns: [] };
            return { result };
        } catch (error) {
            return { result: { rows: [], columns: [], resultColumns: [] }, error: {
                code: (error as PivotErrorEvent).code || 'CalculationFailed', message: (error as Error).message
            } };
        }
    }, [props.dataSource, props.query, props.onDataRequest, props.virtualizationSettings, columns, filter, search, settings, host]);
    const errorCallback: RefObject<(event: PivotErrorEvent) => void> = useRef(props.onPivotError);
    errorCallback.current = props.onPivotError;
    const lastError: RefObject<string> = useRef<string>('');
    // New source members also change the generated schema and must reset result paging.
    const schema: string = JSON.stringify([settings.enabled, settings.rows, settings.columns, settings.values, settings.defaultExpanded,
        settings.showGrandTotals, calculation.result.resultColumns.map((column: PivotResultColumn) => column.id)]);
    const expansionKey: string = JSON.stringify([settings.enabled, settings.rows, settings.defaultExpanded]);
    const [expansion, setExpansion] =
        useState<{ schema: string; ids: Set<string>; all?: boolean }>({ schema: expansionKey, ids: new Set() });
    const expanded: Set<string> = useMemo(
        () => expansion.schema === expansionKey ? expansion.ids : new Set<string>(), [expansion, expansionKey]);
    const [sort, setSort] = useState<{ field?: string; descending?: boolean }>({});
    const rowDefaultExpanded: boolean =
        expansion.schema === expansionKey ? expansion.all ?? settings.defaultExpanded : settings.defaultExpanded;
    const rowSettings: {
        defaultExpanded: boolean;
        enabled?: boolean;
        rows?: ((string & {}) | Extract<keyof T, string>)[];
        columns?: ((string & {}) | Extract<keyof T, string>)[];
        values?: PivotValue<T>[];
        memberSorts?: PivotMemberSort<T>[];
        memberFilters?: PivotMemberFilter<T>[];
        showPanel?: boolean;
        deferLayoutUpdate?: boolean;
        showSubTotals?: boolean;
        showGrandTotals?: boolean;
        maxGeneratedColumns?: number;
        useEnginePaging?: boolean;
        execution?: 'sync' | 'worker';
    } = useMemo(() => ({...settings, defaultExpanded: rowDefaultExpanded}), [settings, rowDefaultExpanded]);
    const session: { dataSource: { result: PivotResultRow[]; count: number; }; onDataRequest: (event: DataRequestEvent) => void; pageSettings: { enabled: boolean; pageSize: number; currentPage: number; pageSizeControlledBy?: 'server' | 'client'; pageCount?: number; totalRecordsCount?: number; estimatedTotalRecordsCount?: number; pageSizeMode?: PageSizeMode; template?: string | ReactElement | Function; }; page: PivotPage; status: 'idle' | 'calculating' | 'ready' | 'error'; error?: PivotErrorEvent; enabled: boolean; } = usePivotSession(props, rowSettings, columns, host, filter, search, expanded, sort);
    const error: PivotErrorEvent = session.enabled ? session.error : calculation.error;
    useEffect(() => {
        const key: string = JSON.stringify(error) || '';
        if (key && key !== lastError.current) { errorCallback.current?.(error); }
        lastError.current = key;
    }, [error]);
    const effectiveExpanded: Set<string> = useMemo(() => {
        const ids: Set<string> = new Set<string>();
        for (const row of calculation.result.rows) {
            if (rowDefaultExpanded ? !expanded.has(row.id) : expanded.has(row.id)) { ids.add(row.id); }
        }
        return ids;
    }, [calculation.result.rows, rowDefaultExpanded, expanded]);
    const rows: PivotRow[] = useMemo(() => visiblePivotRows(calculation.result.rows, effectiveExpanded,
                                                            props.sortSettings?.enabled === false ? undefined : sort.field,
                                                            props.sortSettings?.enabled === false ? false : sort.descending,
                                                            settings.memberSorts),
                                     [calculation.result.rows, effectiveExpanded, sort, props.sortSettings?.enabled, settings.memberSorts]);
    const change: (next: PivotSettings<T>) => void = (next: PivotSettings<T>): void => {
        setSettings(next);
        props.onPivotChange?.({ settings: next });
    };
    useEffect(() => {
        if (!settings.memberFilters?.length) { return; }
        try {
            const source: T[] = selectPivotSource({...props, pivotSettings: {...settings, memberFilters: []}}, columns, {}, {});
            const next: PivotMemberFilter<T>[] = reconcilePivotMemberFilters(settings.memberFilters, source);
            if (!pivotInputEqual(next, settings.memberFilters)) { change({...settings, memberFilters: next}); }
        } catch {
            // The calculation path reports invalid or unsupported source data.
        }
    }, [props.dataSource, props.query, settings.memberFilters, columns]);
    const toggle: (id: string) => void = (id: string): void => {
        const ids: Set<string> = new Set(expanded);
        if (ids.has(id)) { ids.delete(id); } else { ids.add(id); }
        setExpansion({ schema: expansionKey, ids, all: expansion.schema === expansionKey ? expansion.all : undefined });
    };
    return { settings, change, columns, result: session.enabled ? session.page : calculation.result, error,
        rows: session.enabled ? session.page.rows : rows,
        expanded: session.enabled ? new Set(session.page.expanded) : effectiveExpanded,
        toggle, setAllExpanded: (all?: boolean): void => setExpansion({schema: expansionKey, ids: new Set(), all}),
        schema: session.enabled ? JSON.stringify([schema, session.page.columns]) : schema,
        sort, setSort, filter, setFilter, search, setSearch, session };
}
