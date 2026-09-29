import { TreeNodeMap, ChildIndexMap, NormalizedTreeNode } from '../internal-types';
import { CheckState, SelectionMode, TreeNodeId } from '../types';
import { applyCheckDown, isNodeEligible } from './tree-view-reducer';

type NodeState = 'fully-checked' | 'partial' | 'inactive';

export const getSiblingSetSize: (nodeMap: TreeNodeMap, childIndex: ChildIndexMap, id: TreeNodeId) => number =
    (nodeMap: TreeNodeMap, childIndex: ChildIndexMap, id: TreeNodeId): number => {
        const node: NormalizedTreeNode | undefined = nodeMap.get(id);
        if (!node) { return 1; }
        const parentId: TreeNodeId | null = node.parentId ?? null;
        const siblings: ReadonlyArray<TreeNodeId> | undefined = childIndex.get(parentId);
        return siblings ? siblings.length : 1;
    };

export const getSiblingPosInset: (nodeMap: TreeNodeMap, childIndex: ChildIndexMap, id: TreeNodeId) => number =
    (nodeMap: TreeNodeMap, childIndex: ChildIndexMap, id: TreeNodeId): number => {
        const node: NormalizedTreeNode | undefined = nodeMap.get(id);
        if (!node) { return 1; }
        const parentId: TreeNodeId | null = node.parentId ?? null;
        const siblings: ReadonlyArray<TreeNodeId> | undefined = childIndex.get(parentId);
        if (!siblings) { return 1; }
        const idx: number = siblings.indexOf(id);
        return idx === -1 ? 1 : idx + 1;
    };

export const deriveCheckStateMap: (
    selectedIds: ReadonlySet<TreeNodeId>,
    nodeMap: ReadonlyMap<TreeNodeId, NormalizedTreeNode>,
    childIndex: ReadonlyMap<TreeNodeId | null, ReadonlyArray<TreeNodeId>>,
    includeDisabled: boolean
) => Map<TreeNodeId, CheckState> = (
    selectedIds: ReadonlySet<TreeNodeId>,
    nodeMap: ReadonlyMap<TreeNodeId, NormalizedTreeNode>,
    childIndex: ReadonlyMap<TreeNodeId | null, ReadonlyArray<TreeNodeId>>,
    includeDisabled: boolean
): Map<TreeNodeId, CheckState> => {
    const internal: Map<TreeNodeId, NodeState> = new Map<TreeNodeId, NodeState>();
    const parentIds: TreeNodeId[] = [];

    nodeMap.forEach((n: NormalizedTreeNode, id: TreeNodeId): void => {
        if (n.isLeaf) {
            internal.set(id, selectedIds.has(id) ? 'fully-checked' : 'inactive');
        } else {
            internal.set(id, 'inactive');
            parentIds.push(id);
        }
    });

    parentIds.sort((a: TreeNodeId, b: TreeNodeId): number => {
        const da: number = nodeMap.get(a)?.depth ?? 0;
        const db: number = nodeMap.get(b)?.depth ?? 0;
        return db - da;
    });

    for (let p: number = 0; p < parentIds.length; p++) {
        const id: TreeNodeId = parentIds[p as number];
        const childIds: ReadonlyArray<TreeNodeId> | undefined = childIndex.get(id);
        if (childIds === undefined) {
            internal.set(id, selectedIds.has(id) ? 'fully-checked' : 'inactive');
            continue;
        }
        let activeCount: number = 0;
        let fullCount: number = 0;
        let eligibleCount: number = 0;
        for (let i: number = 0; i < childIds.length; i++) {
            const cid: TreeNodeId | undefined = childIds[i as number];
            if (cid === undefined) { continue; }
            const childNode: NormalizedTreeNode | undefined = nodeMap.get(cid);
            if (childNode !== undefined && !childNode.isSelectable) { continue; }
            if (!includeDisabled) {
                if (childNode !== undefined && childNode.isDisabled) { continue; }
            }
            eligibleCount++;
            const childState: NodeState | undefined = internal.get(cid);
            if (childState === 'fully-checked' || childState === 'partial') {
                activeCount++;
            }
            if (childState === 'fully-checked') {
                fullCount++;
            }
        }
        if (eligibleCount === 0) {
            internal.set(id, selectedIds.has(id) ? 'fully-checked' : 'inactive');
        } else if (fullCount === eligibleCount) {
            internal.set(id, 'fully-checked');
        } else if (activeCount === 0 && !selectedIds.has(id)) {
            internal.set(id, 'inactive');
        } else {
            internal.set(id, 'partial');
        }
    }

    const out: Map<TreeNodeId, CheckState> = new Map<TreeNodeId, CheckState>();
    internal.forEach((s: NodeState, id: TreeNodeId): void => {
        if (s === 'fully-checked') {
            out.set(id, 'Checked');
        } else if (s === 'partial') {
            out.set(id, 'Indeterminate');
        } else {
            out.set(id, 'Unchecked');
        }
    });
    return out;
};

export const recomputeSelectedIds: (
    prev: ReadonlySet<TreeNodeId>,
    nodeMap: ReadonlyMap<TreeNodeId, NormalizedTreeNode>,
    childIndex: ReadonlyMap<TreeNodeId | null, ReadonlyArray<TreeNodeId>>,
    checkDisabledChildren: boolean,
    autoCheck: boolean,
    selectionMode: SelectionMode
) => { next: Set<TreeNodeId>; changed: boolean } =
    (
        prev: ReadonlySet<TreeNodeId>,
        nodeMap: ReadonlyMap<TreeNodeId, NormalizedTreeNode>,
        childIndex: ReadonlyMap<TreeNodeId | null, ReadonlyArray<TreeNodeId>>,
        checkDisabledChildren: boolean,
        autoCheck: boolean,
        selectionMode: SelectionMode
    ): { next: Set<TreeNodeId>; changed: boolean } => {
        if (selectionMode === 'Single' || !autoCheck || nodeMap.size === 0) {
            return { next: prev as Set<TreeNodeId>, changed: false };
        }

        const isEligible: (id: TreeNodeId) => boolean = (id: TreeNodeId): boolean => isNodeEligible(id, nodeMap, checkDisabledChildren);

        const next: Set<TreeNodeId> = new Set(prev);
        prev.forEach((id: TreeNodeId): void => {
            const node: NormalizedTreeNode | undefined = nodeMap.get(id);
            if (!node || node.childIds.length === 0) { return; }
            applyCheckDown(id, childIndex, isEligible, true, next);
        });
        const parentBucket: TreeNodeId[] = [];
        childIndex.forEach((_childIds: ReadonlyArray<TreeNodeId>, parentId: TreeNodeId | null): void => {
            if (parentId === null || nodeMap.get(parentId) === undefined) { return; }
            const childList: ReadonlyArray<TreeNodeId> | undefined = childIndex.get(parentId);
            if (childList === undefined || childList.length === 0) { return; }
            parentBucket.push(parentId);
        });
        parentBucket.sort((a: TreeNodeId, b: TreeNodeId): number => {
            const da: number = nodeMap.get(a)?.depth ?? 0;
            const db: number = nodeMap.get(b)?.depth ?? 0;
            return db - da;
        });
        for (let p: number = 0; p < parentBucket.length; p++) {
            const parentId: TreeNodeId = parentBucket[p as number];
            const childIds: ReadonlyArray<TreeNodeId> | undefined = childIndex.get(parentId);
            if (childIds === undefined) { continue; }
            let eligibleCount: number = 0;
            let selectedCount: number = 0;
            for (let i: number = 0; i < childIds.length; i++) {
                const cid: TreeNodeId | undefined = childIds[i as number];
                if (cid === undefined || !isEligible(cid)) { continue; }
                eligibleCount++;
                if (next.has(cid)) { selectedCount++; }
            }
            if (eligibleCount === 0) {
                continue;
            }
            if (selectedCount === eligibleCount) {
                next.add(parentId);
            } else if (next.has(parentId)) {
                next.delete(parentId);
            }
        }

        if (next.size !== prev.size) {
            return { next, changed: true };
        }
        for (const id of prev) {
            if (!next.has(id)) { return { next, changed: true }; }
        }
        return { next: prev as Set<TreeNodeId>, changed: false };
    };
