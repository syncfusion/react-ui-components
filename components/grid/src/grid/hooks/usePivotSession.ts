import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { PivotHost } from '@syncfusion/pivot-engine';
import type { GridProps } from '../types/grid.interfaces';
import type { ColumnProps } from '../types/column.interfaces';
import type { PivotSettings, PivotErrorEvent } from '../types/pivot.interfaces';
import type { FilterSettings } from '../types/filter.interfaces';
import type { SearchSettings } from '../types/search.interfaces';
import type { DataRequestEvent } from '../types/interfaces';
import { selectPivotSource } from '../models/pivot-data';
import { preparePivotInput } from '../services/pivot-result';
import { PivotSession, PivotPage, PivotWindow } from '../services/pivot-session';
import { packPivotInput } from '../services/pivot-transfer';
import { PivotWorkerClient } from '../services/pivot-worker-client';
import type { PivotResultRow } from '../types/pivot.interfaces';
import type { PageSizeMode } from '../../../grid';
import type { ReactElement, RefObject } from 'react';
import type { PivotInput } from '../services/pivot-result';
import type { PivotTransfer } from '../services/pivot-transfer';

const empty: PivotPage = { rows: [], columns: [], resultColumns: [], count: 0, skip: 0, expanded: [] };

/**
 * Owns the lifetime of the opt-in paged/worker calculation and rejects obsolete responses.
 *
 * @param {*} props - props.
 * @param {*} settings - settings.
 * @param {*} columns - columns.
 * @param {*} host - host.
 * @param {*} filter - filter.
 * @param {*} search - search.
 * @param {*} expanded - expanded.
 * @param {*} sort - sort.
 * @param {*} sort.field - sort.field.
 * @param {*} sort.descending - sort.descending.
 * @private
 * @returns {*} Result.
 */
export function usePivotSession<T>(props: Partial<GridProps<T>>, settings: PivotSettings<T>, columns: ColumnProps<T>[],
                                   host: PivotHost, filter: FilterSettings, search: SearchSettings,
                                   expanded: Set<string>, sort: { field?: string; descending?: boolean }): { dataSource: { result: PivotResultRow[]; count: number; }; onDataRequest: (event: DataRequestEvent) => void; pageSettings: { enabled: boolean; pageSize: number; currentPage: number; pageSizeControlledBy?: 'server' | 'client'; pageCount?: number; totalRecordsCount?: number; estimatedTotalRecordsCount?: number; pageSizeMode?: PageSizeMode; template?: string | ReactElement | Function; }; page: PivotPage; status: 'idle' | 'calculating' | 'ready' | 'error'; error?: PivotErrorEvent; enabled: boolean; } {
    const enabled: boolean = !!settings.enabled && (settings.useEnginePaging || settings.execution === 'worker');
    const configuredTake: number = props.pageSettings?.pageSize || 50;
    const queryKey: string = JSON.stringify([settings.defaultExpanded, [...expanded], sort, props.sortSettings?.enabled, configuredTake]);
    const [request, setRequest] = useState({ key: queryKey, skip: 0, take: configuredTake, configuredTake });
    const window: PivotWindow = useMemo<PivotWindow>(() => ({ skip: request.key === queryKey ? request.skip : 0,
        take: request.configuredTake === configuredTake ? request.take : configuredTake,
        expanded: [...expanded], defaultExpanded: settings.defaultExpanded,
        sortField: props.sortSettings?.enabled === false ? undefined : sort.field,
        descending: props.sortSettings?.enabled === false ? false : sort.descending,
        virtual: props.virtualizationSettings?.enabled === true || props.virtualizationSettings?.scrollMode === 'Virtual'
    }), [request, queryKey, props.virtualizationSettings]);
    const latestWindow: RefObject<PivotWindow> = useRef(window);
    latestWindow.current = window;
    const [state, setState] = useState<{ page: PivotPage; status: 'idle' | 'calculating' | 'ready' | 'error'; error?: PivotErrorEvent }>(
        { page: empty, status: 'idle' });
    const revision: RefObject<number> = useRef(0);
    const sequence: RefObject<number> = useRef(0);
    const calculate: RefObject<(window: PivotWindow) => void> = useRef<(window: PivotWindow) => void>(undefined);
    const lastWindow: RefObject<string> = useRef('');
    useEffect(() => {
        const currentRevision: number = ++revision.current;
        let client: PivotWorkerClient;
        let session: PivotSession<T>;
        let cancelled: boolean = false;
        calculate.current = undefined;
        if (!enabled) { return undefined; }
        setState((previous: {
            page: PivotPage;
            status: 'idle' | 'calculating' | 'ready' | 'error';
            error?: PivotErrorEvent;
        }) => ({ page: previous.page, status: 'calculating' }));
        const run: (work: () => PivotPage | Promise<PivotPage>, nextWindow: PivotWindow) => void =
            (work: () => PivotPage | Promise<PivotPage>, nextWindow: PivotWindow): void => {
                const currentSequence: number = ++sequence.current;
                lastWindow.current = JSON.stringify(nextWindow);
                setState((previous: {
                    page: PivotPage;
                    status: 'idle' | 'calculating' | 'ready' | 'error';
                    error?: PivotErrorEvent;
                }) => ({ page: previous.page, status: 'calculating' }));
                Promise.resolve().then(work).then((page: PivotPage) => {
                    if (!cancelled && revision.current === currentRevision && sequence.current === currentSequence) {
                        setState({ page, status: 'ready' });
                    }
                }, (error: unknown) => {
                    if (!cancelled && revision.current === currentRevision && sequence.current === currentSequence) {
                        setState((previous: {
                            page: PivotPage;
                            status: 'idle' | 'calculating' | 'ready' | 'error';
                            error?: PivotErrorEvent;
                        }) => ({ page: previous.page, status: 'error', error: {
                            code: (error as PivotErrorEvent).code || 'CalculationFailed', message: (error as Error).message
                        } }));
                    }
                });
            };
        const initialize: () => Promise<void> = async (): Promise<void> => {
            try {
                if (settings.execution === 'worker' && !settings.customAggregates?.length) {
                    const { createPivotWorker } = await import('../services/pivot-worker-factory');
                    if (cancelled) { return; }
                    client = new PivotWorkerClient(createPivotWorker(), currentRevision);
                }
                const source: T[] = selectPivotSource({...props, pivotSettings: settings}, columns, filter, search);
                const input: PivotInput<T> = preparePivotInput(source, columns, settings);
                if (client) {
                    const packed: {
                        payload: PivotTransfer;
                        transfer: ArrayBuffer[];
                    } = packPivotInput(input);
                    calculate.current = (next: PivotWindow) => run(() => client.send(next), next);
                    const initialWindow: PivotWindow = latestWindow.current;
                    run(() => client.send(initialWindow, { ...packed, locale: props.locale }), initialWindow);
                } else {
                    session = new PivotSession(input, host);
                    calculate.current = (next: PivotWindow) => run(() => session.page(next), next);
                    calculate.current(latestWindow.current);
                }
            } catch (error) { run(() => { throw error; }, latestWindow.current); }
        };
        void initialize();
        return () => {
            cancelled = true;
            calculate.current = undefined;
            client?.dispose();
            session = undefined;
        };
    }, [enabled, props.dataSource, props.query, props.onDataRequest, props.virtualizationSettings,
        columns, filter, search, settings, host]);
    useEffect(() => {
        if (enabled && lastWindow.current !== JSON.stringify(window)) { calculate.current?.(window); }
    }, [window, enabled]);
    const onDataRequest: (event: DataRequestEvent) => void = useCallback((event: DataRequestEvent): void => {
        setRequest({ key: queryKey, skip: event.skip || 0, take: event.take || configuredTake, configuredTake });
        // A custom-bound Grid can request its current page again after a schema/layout update.
        // Reply with a fresh wrapper even when no new engine calculation is necessary.
        setState((previous: {
            page: PivotPage;
            status: 'idle' | 'calculating' | 'ready' | 'error';
            error?: PivotErrorEvent;
        }) => previous.status === 'ready' && previous.page.skip === (event.skip || 0) ?
            { ...previous, page: { ...previous.page, rows: [...previous.page.rows] } } : previous);
    }, [queryKey, props.pageSettings?.pageSize]);
    const dataSource: {
        result: PivotResultRow[];
        count: number;
    } = useMemo(() => ({ result: state.page.rows, count: state.page.count }), [state.page]);
    const pageSettings: {
        enabled: boolean;
        pageSize: number;
        currentPage: number;
        pageSizeControlledBy?: 'server' | 'client';
        pageCount?: number;
        totalRecordsCount?: number;
        estimatedTotalRecordsCount?: number;
        pageSizeMode?: PageSizeMode;
        template?: string | ReactElement | Function;
    } = useMemo(() => ({ ...props.pageSettings, enabled: !window.virtual,
        pageSize: window.take, currentPage: Math.floor(window.skip / window.take) + 1 }),
                [props.pageSettings, window.skip, window.take, window.virtual]);
    return { enabled, ...state, dataSource, onDataRequest, pageSettings };
}
