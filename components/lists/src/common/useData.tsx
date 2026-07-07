import { useRef, useEffect, useCallback, useState, useMemo, RefObject } from 'react';
import type {ScrollEvent, DataRequestEvent, DataLoadEvent } from '../list-view/list-view';
import { FieldsMapping, SortOrder, DataSource, VirtualizationProps } from './types';
import { addSorting, groupDataSource, getData } from './utils';
import { DataManager, Query, QueryOptions, ReturnOption } from '@syncfusion/react-data';

const ERROR_MESSAGE_PREFIX: string = 'ListView data processing failed';
const VIRTUAL_OVERSCAN_FALLBACK: number = 5;

export interface UseDataProps {
    dataSource?: DataSource[] | DataManager,
    query?: Query | undefined,
    virtualization?: VirtualizationProps | undefined,
    onDataRequest?: (event: DataRequestEvent) => void,
    onDataLoad?: (event: DataLoadEvent) => void,
    onScroll?: (event: ScrollEvent) => void,
    sortOrder: SortOrder;
    fieldOptions: FieldsMapping;
}

export interface UseDataResult {
    items: DataSource[];
    virtualizationOptions?: VirtualizationProps;
    onScrollRequest: (args: ScrollEvent) => void | Promise<void>;
}

export const useData: (params: UseDataProps) => UseDataResult
= (params: UseDataProps): UseDataResult => {

    const {
        dataSource,
        fieldOptions,
        sortOrder,
        query,
        virtualization,
        onDataRequest,
        onDataLoad,
        onScroll
    } = params;

    const inFlightRef: RefObject<boolean> = useRef<boolean>(false);

    const [items, setItems] = useState<DataSource[]>([]);
    const [count, setCount] = useState<number | undefined>(virtualization?.totalCount);

    const dataManagerInstance: DataManager | null =
            useMemo(() => (dataSource instanceof DataManager ? dataSource : null), [dataSource]);
    const isLocalArray: boolean = useMemo<boolean>(() => Array.isArray(dataSource) && dataSource.length > 0, [dataSource]);
    const isRemoteDM: boolean = useMemo<boolean>(() => dataSource instanceof DataManager, [dataSource]);

    const shouldVirtualize: boolean = useMemo<boolean>(() => {
        return Boolean(virtualization) &&
                    Number(virtualization?.itemSize) > 0 &&
                    Number(virtualization?.pageSize) > 0 &&
                    (isLocalArray || isRemoteDM);
    }, [virtualization, isLocalArray, isRemoteDM]);

    const isRemoteVirtual: boolean = useMemo<boolean>(() => (isRemoteDM && shouldVirtualize), [isRemoteDM, shouldVirtualize]);

    const { sortBy, text, groupBy } = fieldOptions;

    const setCountGuard: (next: number | undefined) => void = useCallback((next: number | undefined) => {
        setCount((prev: number | undefined) => (next !== undefined && prev !== next ? next : prev));
    }, []);

    const appendItemsGuard: (next: DataSource[]) => void = useCallback((next: DataSource[]) => {
        setItems((prev: DataSource[]) => (next.length > 0 ? prev.concat(next) : prev));
    }, []);

    const resetItemsIfNeeded: () => void = useCallback(() => {
        setItems((prev: DataSource[]) => (prev.length > 0 ? [] : prev));
    }, []);

    const emitDataRequest: (dm: DataManager, q: Query) => void = useCallback((dm: DataManager, q: Query) => {
        onDataRequest?.({ data: dm, query: q });
    }, [onDataRequest]);

    const executeDM: (dm: DataManager, q: Query) => Promise<{ items: DataSource[]; count?: number; }>
    = useCallback(async (dm: DataManager, q: Query): Promise<{ items: DataSource[]; count?: number }> => {
        const response: ReturnOption = await dm.executeQuery(q) as ReturnOption;
        const resultItems: DataSource[] = Array.isArray(response.result) ? (response.result as DataSource[]) : [];
        const nextCount: number | undefined = typeof (response as { count?: number }).count === 'number' ?
            (response as { count?: number }).count as number : undefined;
        return { items: resultItems, count: nextCount };
    }, []);

    const cloneSafeBaseQuery: (base?: Query | undefined) => Query = useCallback((base?: Query): Query => {
        const composed: Query = new Query();
        if (base && base.queries) {
            const safeBase: QueryOptions[] = base.queries.filter((q: QueryOptions) => (
                q.fn !== 'onSkip' && q.fn !== 'onTake' && q.fn !== 'onPage' && q.fn !== 'onRequiresCount' && q.fn !== 'onSortBy'
            ));
            composed.queries = safeBase.map((q: QueryOptions) => ({ ...q }));
        }
        return composed;
    }, []);

    const throwError: (e: Error) => void = (e: Error) => {
        throw new Error(`${ERROR_MESSAGE_PREFIX}${e instanceof Error && e.message ? `: ${e.message}` : ''}`);
    };

    useEffect(() => {
        if (!isRemoteVirtual) { return; }
        resetItemsIfNeeded();
        setCountGuard(virtualization?.totalCount);
        inFlightRef.current = false;
    }, [isRemoteVirtual, dataManagerInstance, query, sortOrder, virtualization, setCountGuard, resetItemsIfNeeded]);

    const computeTransformedItems: (source: DataSource[], order: SortOrder, applySort: boolean) => DataSource[] =
        useCallback((source: DataSource[], order: SortOrder, applySort: boolean): DataSource[] => {
            let updated: DataSource[] = source;
            if (applySort && order !== SortOrder.None) {
                const sortField: string = (sortBy ?? text) as string;
                updated = getData(updated as DataSource[], addSorting(order, sortField));
            }
            if (groupBy) {
                updated = groupDataSource(updated as DataSource[], fieldOptions, order);
            }
            return updated;
        }, [sortBy, text, groupBy, fieldOptions]);

    useEffect(() => {
        if (isRemoteVirtual && items.length > 0) {
            const transformed: DataSource[] = fieldOptions.groupBy ?
                groupDataSource(items as DataSource[], fieldOptions, sortOrder) : items;
            onDataLoad?.({ data: transformed });
        }
    }, [items, isRemoteVirtual, onDataLoad]);

    const buildWindowQuery: (skip: number, take: number) => Query = useCallback((skip: number, take: number): Query => {
        const composed: Query = cloneSafeBaseQuery(query);
        if (sortOrder !== SortOrder.None) {
            const sortField: string = (sortBy ?? text) as string;
            addSorting(sortOrder, sortField, composed);
        }
        composed.skip(Math.max(0, skip)).take(Math.max(0, take)).requiresCount();
        return composed;
    }, [query, sortOrder, sortBy, text, cloneSafeBaseQuery]);

    const onScrollRequest: (args: ScrollEvent) => void | Promise<void> =
            useCallback(async (args: ScrollEvent) => {
                onScroll?.(args);
                if (!isRemoteVirtual || !dataManagerInstance) { return; }
                if (inFlightRef.current) { return; }
                if (count && items.length >= count) {
                    return;
                }
                inFlightRef.current = true;
                const currentLen: number = Math.max(0, items.length);
                const remaining: number | undefined = count ? Math.max(0, count - currentLen) : undefined;

                const requestedCount: number = Math.max(0, args.count);
                const take: number = typeof remaining === 'number' ? Math.min(requestedCount, remaining) : requestedCount;
                const startIndex: number = currentLen;
                const windowQuery: Query = buildWindowQuery(startIndex, take);
                emitDataRequest(dataManagerInstance, windowQuery);

                try {
                    const { items: resultItems, count: respCount } = await executeDM(dataManagerInstance, windowQuery);
                    const nextTotal: number | undefined = typeof respCount === 'number' ? respCount : count;
                    setCountGuard(nextTotal);
                    appendItemsGuard(resultItems);
                } catch (e) {
                    throwError(e as Error);
                } finally {
                    inFlightRef.current = false;
                }
            }, [
                onScroll,
                isRemoteVirtual,
                dataManagerInstance,
                buildWindowQuery,
                count,
                items,
                appendItemsGuard,
                setCountGuard,
                executeDM,
                emitDataRequest
            ]);

    useEffect(() => {
        let active: boolean = true;
        if (!(isRemoteVirtual && dataManagerInstance)) { return; }

        const page: number = Number(virtualization?.pageSize);
        const over: number = Number(virtualization?.overscanCount) || VIRTUAL_OVERSCAN_FALLBACK;
        const initialCount: number = page + over;
        const windowQuery: Query = buildWindowQuery(0, initialCount);
        emitDataRequest(dataManagerInstance, windowQuery);
        (async () => {
            try {
                const { items: resultItems, count: respCount } = await executeDM(dataManagerInstance, windowQuery);
                if (!active) { return; }
                const nextTotal: number | undefined = typeof respCount === 'number' ? respCount : count;

                setCountGuard(nextTotal);
                setItems(resultItems);
            } catch (e) {
                if (active) {
                    throwError(e as Error);
                }
            }
        })();

        return () => { active = false; };
    }, [isRemoteVirtual, dataManagerInstance, virtualization, buildWindowQuery, emitDataRequest, executeDM, setCountGuard]);

    useEffect(() => {
        let active: boolean = true;
        if (!(dataManagerInstance && !isRemoteVirtual)) { return; }
        const requestQuery: Query = query ?? new Query();
        emitDataRequest(dataManagerInstance, requestQuery);
        (async () => {
            try {
                const { items: raw } = await executeDM(dataManagerInstance, requestQuery);
                if (!active) { return; }
                const transformed: DataSource[] = computeTransformedItems(raw, sortOrder, true);
                setItems(transformed);
                onDataLoad?.({ data: transformed });
            } catch (e) {
                if (active) {
                    throwError(e as Error);
                }
            }
        })();

        return () => { active = false; };
    }, [dataManagerInstance, isRemoteVirtual, query, sortOrder, emitDataRequest, executeDM, computeTransformedItems]);

    useEffect(() => {
        if (dataManagerInstance || isRemoteVirtual) { return; }
        const localItems: DataSource[] = (dataSource as DataSource[]) || [];
        try {
            const transformed: DataSource[] = computeTransformedItems(localItems, sortOrder, true);
            setItems(transformed);
            onDataLoad?.({ data: transformed });
        } catch (e) {
            throwError(e as Error);
        }
    }, [dataSource, sortOrder]);

    const itemsForReturn: DataSource[] = useMemo<DataSource[]>(() => {
        if (isRemoteVirtual) {
            const remoteDatas: DataSource[] = (items || []).filter(
                (item: DataSource): item is DataSource => item != null
            );
            if (fieldOptions.groupBy) {
                return groupDataSource(remoteDatas as DataSource[], fieldOptions, sortOrder);
            }
            return remoteDatas;
        }
        return items;
    }, [isRemoteVirtual, items, fieldOptions, sortOrder]);

    const virtualizationOptions: VirtualizationProps | undefined = useMemo(() => {
        if (!shouldVirtualize) { return undefined; }
        if (isRemoteVirtual) {
            return {
                ...virtualization,
                totalCount: count ? count : virtualization?.totalCount
            } as VirtualizationProps;
        }
        return virtualization;
    }, [shouldVirtualize, isRemoteVirtual, virtualization, count]);

    return {
        items: itemsForReturn,
        virtualizationOptions,
        onScrollRequest
    };
};
