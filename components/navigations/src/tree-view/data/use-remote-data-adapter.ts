import { RefObject, useCallback, useEffect, useRef, useState } from 'react';
import { SortOrder, TreeNodeId, TreeViewFieldMapping } from '../types';
import { DataManager, Query } from '@syncfusion/react-data';
import { TreeNodeMap, ChildIndexMap, NormalizedTreeNode, TreeViewDispatch, ResolvedFieldKeys } from '../internal-types';
import { mergeIntoNodeMap, mergeIntoChildIndex } from './data-utils';
import { detectAndBuild, resolveFieldKeys } from './normalization';

interface UseRemoteDataAdapterArgs {
    dataManager: DataManager | null;
    query?: Query;
    fields: TreeViewFieldMapping;
    sortOrder: SortOrder;
    onError?: (err: Error) => void;
    dispatch: TreeViewDispatch;
    onChildrenLoaded?: (parentId: TreeNodeId, childIds: ReadonlyArray<TreeNodeId>, updatedNodeMap: TreeNodeMap,
        updatedChildIndex: ChildIndexMap) => void;
}

/**
 * Specifies the return value of `useRemoteDataAdapter`.
 *
 * @private
 */
export interface UseRemoteDataAdapterResult {
    nodeMap: TreeNodeMap;
    childIndex: ChildIndexMap;
    ensureChildren: (id: TreeNodeId) => Promise<void>;
    updateNodeLabel: (id: TreeNodeId, newLabel: string) => Promise<void>;
}

const extractResult: (resp: unknown) => unknown[] = (resp: unknown): unknown[] => {
    if (resp === null || resp === undefined) { return []; }
    if (Array.isArray(resp)) { return resp; }
    const wrapped: { result?: unknown[]; } = (resp as { result?: unknown[]; });
    if (wrapped && Array.isArray(wrapped.result)) { return wrapped.result; }
    return [];
};

export const useRemoteDataAdapter: (args: UseRemoteDataAdapterArgs) => UseRemoteDataAdapterResult =
    (args: UseRemoteDataAdapterArgs): UseRemoteDataAdapterResult => {

        const { dataManager, query, fields, sortOrder, onError, dispatch, onChildrenLoaded } = args;
        const isHierarchicalSchema: boolean = Boolean(fields && fields.children);
        const resolvedFields: ResolvedFieldKeys = resolveFieldKeys(fields || {},
                                                                   isHierarchicalSchema ? 'hierarchical' : 'self-referential');
        const parentKey: string = resolvedFields.parentId;

        const [nodeMap, setNodeMap] = useState<TreeNodeMap>(() => new Map());
        const [childIndex, setChildIndex] = useState<ChildIndexMap>(() => new Map());

        const inFlightRef: RefObject<Map<TreeNodeId, Promise<void>>> = useRef(new Map());
        const isMountedRef: RefObject<boolean> = useRef(true);

        useEffect((): (() => void) => {
            isMountedRef.current = true;
            return (): void => {
                isMountedRef.current = false;
            };
        }, []);

        const ensureChildren: (id: TreeNodeId) => Promise<void> = useCallback((id: TreeNodeId): Promise<void> => {
            if (!dataManager) {
                return Promise.resolve();
            }
            return new Promise<void>((resolve: () => void, reject: (error: Error) => void): void => {
                if (childIndex.has(id)) {
                    resolve();
                    return;
                }
                const existing: Promise<void> | undefined = inFlightRef.current.get(id);
                if (existing) {
                    existing.then(resolve, reject);
                    return;
                }
                const childQuery: Query = new Query();
                childQuery.where(parentKey, 'equal', id);
                dispatch({ type: 'LOAD_CHILDREN_START', id: id });
                const fetchPromise: Promise<void> = dataManager.executeQuery(childQuery)
                    .then((resp: unknown): void => {
                        if (!isMountedRef.current) { return; }
                        const allRows: unknown[] = extractResult(resp);
                        const childIds: TreeNodeId[] = [];
                        for (let rowIndex: number = 0; rowIndex < allRows.length; rowIndex++) {
                            const raw: unknown = allRows[rowIndex as number];
                            if (raw === null || typeof raw !== 'object') { continue; }
                            const childId: unknown = (raw as Record<string, unknown>)[resolvedFields.id];
                            if (childId === undefined || childId === null || childId === '') { continue; }
                            childIds.push(childId as TreeNodeId);
                        }
                        const parentNode: NormalizedTreeNode | undefined = nodeMap.get(id);
                        const seedDepth: number = parentNode ? parentNode.depth : 0;
                        const parentContext: { id: TreeNodeId; depth: number } | null = { id: id, depth: seedDepth };
                        const updatedNodeMap: TreeNodeMap = mergeIntoNodeMap(nodeMap, allRows, resolvedFields, parentContext);
                        setNodeMap(updatedNodeMap);
                        const updatedChildIndex: ChildIndexMap =
                            mergeIntoChildIndex(childIndex, id, childIds, sortOrder, updatedNodeMap);
                        setChildIndex(updatedChildIndex);
                        dispatch({ type: 'LOAD_CHILDREN_SUCCESS', id: id, rows: allRows });
                        onChildrenLoaded?.(id, childIds, updatedNodeMap, updatedChildIndex);
                        resolve();
                    })
                    .catch((err: unknown): void => {
                        if (!isMountedRef.current) { return; }
                        dispatch({ type: 'LOAD_CHILDREN_FAILURE', id: id, error: err as Error });
                        onError?.(err as Error);
                        reject(err as Error);
                    })
                    .finally((): void => {
                        inFlightRef.current.delete(id);
                    });
                inFlightRef.current.set(id, fetchPromise);
            });
        }, [childIndex, dataManager, dispatch, onError, onChildrenLoaded, parentKey, resolvedFields, sortOrder, nodeMap]);

        const updateNodeLabel: (id: TreeNodeId, newLabel: string) => Promise<void> = useCallback((id: TreeNodeId,
                                                                                                  newLabel: string): Promise<void> => {
            if (!dataManager) {
                return Promise.resolve();
            }
            return new Promise<void>((resolve: () => void, reject: (err: Error) => void): void => {
                const current: NormalizedTreeNode | undefined = nodeMap.get(id);
                if (!current) {
                    reject(new Error(`TreeView: cannot update label for unknown node "${String(id)}".`));
                    return;
                }
                const oldLabel: string = current.label;
                if (newLabel.trim() === oldLabel.trim()) {
                    resolve();
                    return;
                }
                setNodeMap((prev: TreeNodeMap): TreeNodeMap => {
                    const node: NormalizedTreeNode | undefined = prev.get(id);
                    if (!node) { return prev; }
                    const next: Map<TreeNodeId, NormalizedTreeNode> = new Map(prev);
                    next.set(id, { ...node, label: newLabel });
                    return next;
                });
                const row: Record<string, unknown> = { ...(current.raw as Record<string, unknown>) };
                row[resolvedFields.label] = newLabel;
                const updateResult: Object | Promise<Object> = dataManager.update(resolvedFields.id, row);
                Promise.resolve(updateResult)
                    .then((): void => {
                        if (!isMountedRef.current) { return; }
                        resolve();
                    })
                    .catch((err: unknown): void => {
                        if (!isMountedRef.current) {
                            reject(err instanceof Error ? err : new Error(String(err)));
                            return;
                        }
                        setNodeMap((prev: TreeNodeMap): TreeNodeMap => {
                            const node: NormalizedTreeNode | undefined = prev.get(id);
                            if (!node) { return prev; }
                            const next: Map<TreeNodeId, NormalizedTreeNode> = new Map(prev);
                            next.set(id, { ...node, label: oldLabel });
                            return next;
                        });
                        onError?.(err as Error);
                        reject(err as Error);
                    });
            });
        }, [nodeMap, dataManager, resolvedFields.id, resolvedFields.label, onError, dispatch]);

        useEffect(() => {
            if (!dataManager) { return; }
            let cancelled: boolean = false;
            const initialQuery: Query = query || new Query();
            dataManager.executeQuery(initialQuery)
                .then((resp: unknown): void => {
                    if (cancelled) { return; }
                    if (!isMountedRef.current) { return; }
                    const allRows: unknown[] = extractResult(resp);
                    const built: { nodeMap: TreeNodeMap; childIndex: ChildIndexMap } =
                        detectAndBuild(allRows, fields || {}, sortOrder);
                    if (built.nodeMap.size === 0) { return; }
                    setNodeMap(built.nodeMap);
                    setChildIndex(built.childIndex);
                })
                .catch((err: unknown) => {
                    if (cancelled) { return; }
                    if (!isMountedRef.current) { return; }
                    onError?.(err as Error);
                });
            return () => {
                cancelled = true;
            };
        }, [dataManager]);

        return {
            nodeMap: nodeMap,
            childIndex: childIndex,
            ensureChildren: ensureChildren,
            updateNodeLabel: updateNodeLabel
        };
    };
