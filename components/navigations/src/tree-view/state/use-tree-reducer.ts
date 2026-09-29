import { useCallback, useEffect, useMemo, useReducer, useRef, SyntheticEvent, RefObject } from 'react';
import { TreeNodeId, TreeViewProps, DataManager, SortOrder } from '../types';
import { treeViewReducer } from './tree-view-reducer';
import { TreeViewState, TreeViewDispatch, TreeNodeMap, ChildIndexMap, TreeViewAction, NormalizedTreeNode } from '../internal-types';
import { isDataManager } from '../data/data-source-detector';
import { useTreeNormalization, UseTreeNormalizationResult } from '../data/normalization';
import { useRemoteDataAdapter, UseRemoteDataAdapterResult } from '../data/use-remote-data-adapter';
import { applyCheckDown, isNodeEligible, syncAncestors } from './tree-view-reducer';
import { recomputeSelectedIds } from './selectors';

interface UseTreeReducerResult {
    state: TreeViewState;
    dispatch: TreeViewDispatch;
    expandAll: (ids?: TreeNodeId[]) => void;
    collapseAll: (ids?: TreeNodeId[]) => void;
    nodeMap: TreeNodeMap;
    childIndex: ChildIndexMap;
    isRemote: boolean;
    ensureChildren: ((id: TreeNodeId) => Promise<void>) | null;
    updateNodeLabel: ((id: TreeNodeId, newLabel: string) => Promise<void>) | null;
}

interface ReducerDataSnapshot {
    nodeMap: TreeNodeMap;
    childIndex: ChildIndexMap;
    autoCheck: boolean;
    checkDisabledChildren: boolean;
}

export const useTreeReducer: (props: Partial<TreeViewProps>) => UseTreeReducerResult =
    (props: Partial<TreeViewProps>): UseTreeReducerResult => {

        const {
            dataSource,
            fields,
            sortOrder = SortOrder.None,
            query,
            onError,
            selectionMode = 'Single',
            autoCheck = false,
            checkDisabledChildren = false,
            expandedIds,
            defaultExpandedIds,
            selectedIds,
            defaultSelectedIds,
            onExpandedChange,
            onSelectedChange
        } = props;

        const isRemote: boolean = isDataManager(dataSource);
        const expansionControlled: boolean = expandedIds !== undefined;
        const selectionControlled: boolean = selectedIds !== undefined;

        const lastActionRef: RefObject<TreeViewAction | null> = useRef<TreeViewAction | null>(null);
        const lastEventRef: RefObject<SyntheticEvent | undefined> = useRef<SyntheticEvent | undefined>(undefined);
        const prevStateRef: RefObject<TreeViewState | null> = useRef<TreeViewState | null>(null);

        const reducerDataRef: RefObject<ReducerDataSnapshot> = useRef<ReducerDataSnapshot>({
            nodeMap: new Map<TreeNodeId, NormalizedTreeNode>(),
            childIndex: new Map<TreeNodeId | null, ReadonlyArray<TreeNodeId>>(),
            autoCheck: autoCheck,
            checkDisabledChildren: checkDisabledChildren
        });

        const computeInitial: () => TreeViewState = useCallback((): TreeViewState => {
            const init: TreeViewState = {
                editingId: null,
                loadingChildIds: new Set<TreeNodeId>(),
                focusedId: null,
                expandedIds: new Set<TreeNodeId>(
                    expansionControlled ? (expandedIds || []) : (defaultExpandedIds || [])
                ),
                selectedIds: new Set<TreeNodeId>(
                    selectionControlled ? (selectedIds || []) : (defaultSelectedIds || [])
                ),
                rangeAnchorId: null
            };
            return init;
        }, []);

        const [internalState, baseDispatch] = useReducer(
            (s: TreeViewState, a: TreeViewAction): TreeViewState => {
                const snapshot: ReducerDataSnapshot = reducerDataRef.current;
                return treeViewReducer(
                    s, a, snapshot.nodeMap, snapshot.childIndex, snapshot.autoCheck, snapshot.checkDisabledChildren
                );
            },
            undefined,
            computeInitial
        );

        const dispatch: TreeViewDispatch = useCallback((action: TreeViewAction, event?: SyntheticEvent): void => {
            lastActionRef.current = action;
            lastEventRef.current = event;
            baseDispatch(action);
        }, [baseDispatch]);

        const localResult: UseTreeNormalizationResult =
            useTreeNormalization(isRemote ? [] : dataSource, fields, sortOrder);

        const syncAutoCheckOnLoad: (
            parentId: TreeNodeId,
            childIds: ReadonlyArray<TreeNodeId>,
            updatedNodeMap: ReadonlyMap<TreeNodeId, NormalizedTreeNode>,
            updatedChildIndex: ReadonlyMap<TreeNodeId | null, ReadonlyArray<TreeNodeId>>
        ) => void = useCallback((
            parentId: TreeNodeId,
            childIds: ReadonlyArray<TreeNodeId>,
            updatedNodeMap: ReadonlyMap<TreeNodeId, NormalizedTreeNode>,
            updatedChildIndex: ReadonlyMap<TreeNodeId | null, ReadonlyArray<TreeNodeId>>
        ): void => {
            if (!autoCheck || childIds.length === 0 || !internalState.selectedIds.has(parentId)) { return; }
            const next: Set<TreeNodeId> = new Set(internalState.selectedIds);
            const isEligible: (id: TreeNodeId) => boolean =
                (id: TreeNodeId): boolean => isNodeEligible(id, updatedNodeMap, checkDisabledChildren );
            applyCheckDown( parentId, updatedChildIndex, isEligible, true, next );
            if (isEligible(parentId)) {
                next.add(parentId);
            }
            syncAncestors( parentId, updatedNodeMap, updatedChildIndex, isEligible, next );
            if (next.size === internalState.selectedIds.size) {
                return;
            }
            dispatch({ type: 'SET_SELECTED_IDS', ids: Array.from(next) });
        }, [autoCheck, checkDisabledChildren, internalState.selectedIds, dispatch]);

        const remoteAdapter: UseRemoteDataAdapterResult = useRemoteDataAdapter({
            dataManager: isRemote ? (dataSource as DataManager) : null,
            query: query,
            fields: fields || {},
            sortOrder: sortOrder,
            onError: onError,
            dispatch: baseDispatch,
            onChildrenLoaded: isRemote ? syncAutoCheckOnLoad : undefined
        });

        const nodeMap: TreeNodeMap = isRemote ? remoteAdapter.nodeMap : localResult.nodeMap;
        const childIndex: ChildIndexMap = isRemote ? remoteAdapter.childIndex : localResult.childIndex;
        const ensureChildren: ((id: TreeNodeId) => Promise<void>) | null =
            isRemote ? remoteAdapter.ensureChildren : null;
        const updateNodeLabel: ((id: TreeNodeId, newLabel: string) => Promise<void>) | null =
            isRemote ? remoteAdapter.updateNodeLabel : null;

        reducerDataRef.current = {
            nodeMap: nodeMap,
            childIndex: childIndex,
            autoCheck: autoCheck,
            checkDisabledChildren: checkDisabledChildren
        };

        const state: TreeViewState = useMemo((): TreeViewState => ({
            ...internalState,
            expandedIds: expansionControlled ? new Set<TreeNodeId>(expandedIds || []) : internalState.expandedIds,
            selectedIds: selectionControlled ? new Set<TreeNodeId>(selectedIds || []) : internalState.selectedIds
        }), [internalState, expansionControlled, expandedIds, selectionControlled, selectedIds]);

        useEffect(() => {
            if (!expansionControlled) { return; }
            baseDispatch({ type: 'SET_EXPANDED_IDS', ids: expandedIds || [] });
        }, [expansionControlled, expandedIds, baseDispatch]);

        useEffect(() => {
            if (!selectionControlled) { return; }
            baseDispatch({ type: 'SET_SELECTED_IDS', ids: selectedIds || [] });
        }, [selectionControlled, selectedIds, baseDispatch]);

        useEffect(() => {
            const result: { next: Set<TreeNodeId>; changed: boolean } =
            recomputeSelectedIds(internalState.selectedIds, nodeMap, childIndex, checkDisabledChildren, autoCheck, selectionMode );
            if (!result.changed) { return; }
            dispatch({ type: 'SET_SELECTED_IDS', ids: Array.from(result.next) });
        }, [autoCheck, checkDisabledChildren, selectionMode, nodeMap, childIndex]);

        useEffect((): void => {
            const prev: TreeViewState | null = prevStateRef.current;
            if (prev === null) {
                prevStateRef.current = internalState;
                return;
            }
            const expandedChanged: boolean = prev.expandedIds !== internalState.expandedIds;
            const selectedChanged: boolean = prev.selectedIds !== internalState.selectedIds;
            prevStateRef.current = internalState;

            if (!expandedChanged && !selectedChanged) { return; }
            const action: TreeViewAction | null = lastActionRef.current;
            if (action !== null) { lastActionRef.current = null; }
            if ((!onExpandedChange && !onSelectedChange) || action === null) { return; }

            const snapshot: ReducerDataSnapshot = reducerDataRef.current;
            const affectedId: TreeNodeId = extractId(action);
            const affectedNode: NormalizedTreeNode | undefined =
                affectedId ? snapshot.nodeMap.get(affectedId) : undefined;
            const affectedItem: unknown | undefined = affectedNode ? (affectedNode.raw) : undefined;
            const event: SyntheticEvent | undefined = lastEventRef.current;
            lastEventRef.current = undefined;

            if (expandedChanged && onExpandedChange) {
                onExpandedChange({
                    item: affectedItem ,
                    id: affectedId,
                    expandedIds: Array.from(internalState.expandedIds),
                    event: event as SyntheticEvent
                });
            }
            if (selectedChanged && onSelectedChange) {
                onSelectedChange({
                    item: affectedItem,
                    id: affectedId,
                    selectedIds: Array.from(internalState.selectedIds),
                    event: event as SyntheticEvent
                });
            }
        }, [internalState, onExpandedChange, onSelectedChange]);

        const expandAll: (ids?: TreeNodeId[]) => void = useCallback((ids?: TreeNodeId[]) => {
            if (ids !== undefined && ids.length > 0) {
                dispatch({ type: 'EXPAND_SPECIFIC', ids: ids });
            } else {
                dispatch({ type: 'EXPAND_ALL', ids: ids });
            }
        }, [dispatch]);

        const collapseAll: (ids?: TreeNodeId[]) => void = useCallback((ids?: TreeNodeId[]) => {
            if (ids !== undefined && ids.length > 0) {
                dispatch({ type: 'COLLAPSE_SPECIFIC', ids: ids });
            } else {
                dispatch({ type: 'COLLAPSE_ALL', ids: ids });
            }
        }, [dispatch]);

        return {
            state,
            dispatch,
            expandAll,
            collapseAll,
            nodeMap,
            childIndex,
            isRemote,
            ensureChildren,
            updateNodeLabel
        };
    };

const extractId: (action: TreeViewAction) => TreeNodeId = (action: TreeViewAction): TreeNodeId => {
    switch (action.type) {
    case 'EXPAND_NODE':
    case 'COLLAPSE_NODE':
    case 'SELECT_NODE':
    case 'DESELECT_NODE':
    case 'TOGGLE_CHECK':
    case 'SET_FOCUSED':
    case 'BEGIN_EDIT':
    case 'COMMIT_EDIT':
        return (action.id === null ? '' : action.id);
    default:
        return '';
    }
};
