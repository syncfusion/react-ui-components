import { TreeViewState, ChildIndexMap, TreeNodeMap, TreeViewAction, NormalizedTreeNode } from '../internal-types';
import { TreeNodeId } from '../types';

const applySelection: (set: Set<TreeNodeId>, id: TreeNodeId, willSelect: boolean) => void =
    (set: Set<TreeNodeId>, id: TreeNodeId, willSelect: boolean): void => {
        if (willSelect) { set.add(id); } else { set.delete(id); }
    };

const collectDescendants: (id: TreeNodeId, childIndex: ChildIndexMap) => Set<TreeNodeId> =
    (id: TreeNodeId, childIndex: ChildIndexMap): Set<TreeNodeId> => {
        const out: Set<TreeNodeId> = new Set();
        const walk: (cursor: TreeNodeId) => void = (cursor: TreeNodeId): void => {
            const children: ReadonlyArray<TreeNodeId> | undefined = childIndex.get(cursor);
            if (!children) { return; }
            for (let i: number = 0; i < children.length; i++) {
                const childId: TreeNodeId | undefined = children[i as number];
                if (childId === undefined || out.has(childId)) { continue; }
                out.add(childId);
                walk(childId);
            }
        };
        walk(id);
        return out;
    };

const expandAllOf: (expandedIds: Set<TreeNodeId>, ids: ReadonlyArray<TreeNodeId> | undefined,
    nodeMap: TreeNodeMap, childIndex: ChildIndexMap) => Set<TreeNodeId> =
    (expandedIds: Set<TreeNodeId>, ids: ReadonlyArray<TreeNodeId> | undefined,
     nodeMap: TreeNodeMap, childIndex: ChildIndexMap): Set<TreeNodeId> => {
        const next: Set<TreeNodeId> = new Set(expandedIds);
        const startIds: ReadonlyArray<TreeNodeId> = ids || Array.from(nodeMap.keys());
        for (let i: number = 0; i < startIds.length; i++) {
            const id: TreeNodeId | undefined = startIds[i as number];
            if (id === undefined) { continue; }
            next.add(id);
            const desc: Set<TreeNodeId> = collectDescendants(id, childIndex);
            desc.forEach((d: TreeNodeId) => next.add(d));
        }
        return next;
    };

const collapseAllOf: (expandedIds: Set<TreeNodeId>, ids: ReadonlyArray<TreeNodeId> | undefined,
    childIndex: ChildIndexMap) => Set<TreeNodeId> =
    (expandedIds: Set<TreeNodeId>, ids: ReadonlyArray<TreeNodeId> | undefined,
     childIndex: ChildIndexMap): Set<TreeNodeId> => {
        if (!ids) {
            return new Set<TreeNodeId>();
        }
        const toRemove: Set<TreeNodeId> = new Set<TreeNodeId>();
        for (let i: number = 0; i < ids.length; i++) {
            const id: TreeNodeId | undefined = ids[i as number];
            if (id === undefined) { continue; }
            toRemove.add(id);
            const desc: Set<TreeNodeId> = collectDescendants(id, childIndex);
            desc.forEach((d: TreeNodeId) => toRemove.add(d));
        }
        const next: Set<TreeNodeId> = new Set<TreeNodeId>();
        expandedIds.forEach((id: TreeNodeId) => {
            if (!toRemove.has(id)) { next.add(id); }
        });
        return next;
    };

export const isNodeSelectable: (id: TreeNodeId, nodeMap: TreeNodeMap) => boolean =
    (id: TreeNodeId, nodeMap: TreeNodeMap): boolean => {
        const node: NormalizedTreeNode | undefined = nodeMap.get(id);
        return node === undefined || node.isSelectable;
    };

export const isNodeEligible: (id: TreeNodeId, nodeMap: TreeNodeMap,
    checkDisabledChildren: boolean) => boolean =
    (id: TreeNodeId, nodeMap: TreeNodeMap, checkDisabledChildren: boolean): boolean => {
        const node: NormalizedTreeNode | undefined = nodeMap.get(id);
        if (node === undefined) { return true; }
        if (!node.isSelectable) { return false; }
        if (checkDisabledChildren) { return true; }
        return !node.isDisabled;
    };

export const applyCheckDown: (id: TreeNodeId, childIndex: ChildIndexMap,
    isEligible: (id: TreeNodeId) => boolean, willSelect: boolean,
    next: Set<TreeNodeId>) => Set<TreeNodeId> =
    (id: TreeNodeId, childIndex: ChildIndexMap,
     isEligible: (id: TreeNodeId) => boolean, willSelect: boolean,
     next: Set<TreeNodeId>): Set<TreeNodeId> => {
        const children: ReadonlyArray<TreeNodeId> | undefined = childIndex.get(id);
        if (children === undefined) { return next; }
        for (let i: number = 0; i < children.length; i++) {
            const cid: TreeNodeId | undefined = children[i as number];
            if (cid === undefined) { continue; }
            if (!isEligible(cid)) { continue; }
            applySelection(next, cid, willSelect);
            applyCheckDown(cid, childIndex, isEligible, willSelect, next);
        }
        return next;
    };

export const syncAncestors: (startId: TreeNodeId, nodeMap: TreeNodeMap,
    childIndex: ChildIndexMap, isEligible: (id: TreeNodeId) => boolean,
    next: Set<TreeNodeId>) => Set<TreeNodeId> =
    (startId: TreeNodeId, nodeMap: TreeNodeMap,
     childIndex: ChildIndexMap, isEligible: (id: TreeNodeId) => boolean,
     next: Set<TreeNodeId>): Set<TreeNodeId> => {
        let cursor: TreeNodeId | null = nodeMap.get(startId)?.parentId ?? null;
        while (cursor !== null) {
            const siblings: ReadonlyArray<TreeNodeId> | undefined = childIndex.get(cursor);
            if (siblings !== undefined) {
                let eligibleCount: number = 0;
                let selectedCount: number = 0;
                for (let i: number = 0; i < siblings.length; i++) {
                    const sid: TreeNodeId | undefined = siblings[i as number];
                    if (sid === undefined) { continue; }
                    if (!isEligible(sid)) { continue; }
                    eligibleCount++;
                    if (next.has(sid)) { selectedCount++; }
                }
                if (eligibleCount > 0 && selectedCount === eligibleCount) {
                    next.add(cursor);
                } else {
                    next.delete(cursor);
                }
            }
            cursor = nodeMap.get(cursor)?.parentId ?? null;
        }
        return next;
    };

export const treeViewReducer: (state: TreeViewState, action: TreeViewAction, nodeMap: TreeNodeMap,
    childIndex: ChildIndexMap, autoCheck?: boolean, checkDisabledChildren?: boolean) => TreeViewState =
    (state: TreeViewState, action: TreeViewAction, nodeMap: TreeNodeMap, childIndex: ChildIndexMap,
     autoCheck: boolean = false, checkDisabledChildren: boolean = false): TreeViewState => {
        switch (action.type) {
        case 'EXPAND_NODE': {
            if (state.expandedIds.has(action.id)) { return state; }
            const next: Set<TreeNodeId> = new Set(state.expandedIds);
            next.add(action.id);
            return { ...state, expandedIds: next };
        }
        case 'COLLAPSE_NODE': {
            if (!state.expandedIds.has(action.id)) { return state; }
            const next: Set<TreeNodeId> = new Set(state.expandedIds);
            next.delete(action.id);
            return { ...state, expandedIds: next };
        }
        case 'SET_EXPANDED_IDS': {
            return { ...state, expandedIds: new Set(action.ids) };
        }
        case 'EXPAND_ALL': {
            return {
                ...state,
                expandedIds: expandAllOf(state.expandedIds, action.ids, nodeMap, childIndex)
            };
        }
        case 'COLLAPSE_ALL': {
            return {
                ...state,
                expandedIds: collapseAllOf(state.expandedIds, action.ids, childIndex)
            };
        }
        case 'EXPAND_SPECIFIC': {
            if (action.ids.length === 0) { return state; }
            const next: Set<TreeNodeId> = new Set(state.expandedIds);
            for (let i: number = 0; i < action.ids.length; i++) {
                const id: TreeNodeId | undefined = action.ids[i as number];
                if (id === undefined) { continue; }
                if (!nodeMap.has(id)) { continue; }
                next.add(id);
            }
            return { ...state, expandedIds: next };
        }
        case 'COLLAPSE_SPECIFIC': {
            if (action.ids.length === 0) { return state; }
            const toRemove: Set<TreeNodeId> = new Set<TreeNodeId>();
            for (let i: number = 0; i < action.ids.length; i++) {
                const id: TreeNodeId | undefined = action.ids[i as number];
                if (id === undefined) { continue; }
                toRemove.add(id);
            }
            const next: Set<TreeNodeId> = new Set<TreeNodeId>();
            state.expandedIds.forEach((id: TreeNodeId) => {
                if (!toRemove.has(id)) { next.add(id); }
            });
            return { ...state, expandedIds: next };
        }
        case 'SELECT_NODE': {
            if (!isNodeEligible(action.id, nodeMap, checkDisabledChildren)) { return state; }
            const next: Set<TreeNodeId> = new Set(state.selectedIds);
            if (action.range) {
                if (next.has(action.id)) { next.delete(action.id); }
                else { next.add(action.id); }
                return { ...state, selectedIds: next };
            }
            if (action.multi) {
                if (next.has(action.id)) { next.delete(action.id); }
                else { next.add(action.id); }
                return { ...state, selectedIds: next };
            }
            return { ...state, selectedIds: new Set([action.id]), rangeAnchorId: action.id };
        }
        case 'DESELECT_NODE': {
            if (!state.selectedIds.has(action.id)) { return state; }
            const next: Set<TreeNodeId> = new Set(state.selectedIds);
            next.delete(action.id);
            return { ...state, selectedIds: next };
        }
        case 'SET_SELECTED_IDS': {
            return { ...state, selectedIds: new Set(action.ids) };
        }
        case 'SET_RANGE_ANCHOR': {
            if (state.rangeAnchorId === action.id) { return state; }
            return { ...state, rangeAnchorId: action.id };
        }
        case 'RANGE_SELECT': {
            if (action.fromId === null || action.fromId === action.toId) {
                if (!isNodeEligible(action.toId, nodeMap, checkDisabledChildren)) {
                    return state;
                }
                return { ...state, selectedIds: new Set([action.toId]), rangeAnchorId: action.toId };
            }
            const fromIdx: number = action.ids.indexOf(action.fromId);
            const toIdx: number = action.ids.indexOf(action.toId);
            if (fromIdx === -1 || toIdx === -1) {
                if (!isNodeEligible(action.toId, nodeMap, checkDisabledChildren)) {
                    return state;
                }
                return { ...state, selectedIds: new Set([action.toId]), rangeAnchorId: action.toId };
            }
            const start: number = Math.min(fromIdx, toIdx);
            const end: number = Math.max(fromIdx, toIdx);
            const next: Set<TreeNodeId> = new Set<TreeNodeId>();
            for (let i: number = start; i <= end; i++) {
                const id: TreeNodeId | undefined = action.ids[i as number];
                if (id === undefined) { continue; }
                if (!isNodeEligible(id, nodeMap, checkDisabledChildren)) { continue; }
                next.add(id);
            }
            return { ...state, selectedIds: next };
        }
        case 'TOGGLE_CHECK': {
            if (!isNodeSelectable(action.id, nodeMap)) { return state; }
            const wasSelected: boolean = state.selectedIds.has(action.id);
            const willSelect: boolean = !wasSelected;
            const next: Set<TreeNodeId> = new Set(state.selectedIds);

            if (!autoCheck) {
                applySelection(next, action.id, willSelect);
                return { ...state, selectedIds: next };
            }
            const isEligible: (id: TreeNodeId) => boolean =
                    (id: TreeNodeId): boolean => isNodeEligible(id, nodeMap, checkDisabledChildren);
            applyCheckDown(action.id, childIndex, isEligible, willSelect, next);
            if (isEligible(action.id)) {
                applySelection(next, action.id, willSelect);
            }
            syncAncestors(action.id, nodeMap, childIndex, isEligible, next);
            return { ...state, selectedIds: next };
        }
        case 'SET_FOCUSED': {
            if (state.focusedId === action.id) { return state; }
            return { ...state, focusedId: action.id };
        }
        case 'BEGIN_EDIT': {
            if (state.editingId === action.id) { return state; }
            return { ...state, editingId: action.id };
        }
        case 'COMMIT_EDIT': {
            if (state.editingId !== action.id) { return state; }
            return { ...state, editingId: null };
        }
        case 'CANCEL_EDIT': {
            if (state.editingId === null) { return state; }
            return { ...state, editingId: null };
        }
        case 'LOAD_CHILDREN_START': {
            if (state.loadingChildIds.has(action.id)) { return state; }
            const next: Set<TreeNodeId> = new Set(state.loadingChildIds);
            next.add(action.id);
            return { ...state, loadingChildIds: next };
        }
        case 'LOAD_CHILDREN_SUCCESS':
        case 'LOAD_CHILDREN_FAILURE': {
            if (!state.loadingChildIds.has(action.id)) { return state; }
            const next: Set<TreeNodeId> = new Set(state.loadingChildIds);
            next.delete(action.id);
            return { ...state, loadingChildIds: next };
        }
        default: {
            return state;
        }
        }
    };
