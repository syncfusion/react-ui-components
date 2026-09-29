import { useMemo } from 'react';
import { TreeNodeId } from '../types';
import { TreeNodeMap, ChildIndexMap, NormalizedTreeNode } from '../internal-types';

export const projectVisibleNodes: (nodeMap: ReadonlyMap<TreeNodeId, NormalizedTreeNode>, childIndex: ReadonlyMap<TreeNodeId | null,
ReadonlyArray<TreeNodeId>>, expandedIds: ReadonlySet<TreeNodeId>) => NormalizedTreeNode[] =
    (nodeMap: ReadonlyMap<TreeNodeId, NormalizedTreeNode>, childIndex: ReadonlyMap<TreeNodeId | null, ReadonlyArray<TreeNodeId>>,
     expandedIds: ReadonlySet<TreeNodeId>): NormalizedTreeNode[] => {
        const out: NormalizedTreeNode[] = [];
        const walk: (id: TreeNodeId) => void = (id: TreeNodeId): void => {
            const node: NormalizedTreeNode | undefined = nodeMap.get(id);
            if (!node) { return; }
            out.push(node);
            if (expandedIds.has(id)) {
                const children: ReadonlyArray<TreeNodeId> | undefined = childIndex.get(id);
                if (children) {
                    for (let i: number = 0; i < children.length; i++) {
                        const cid: TreeNodeId | undefined = children[i as number];
                        if (cid !== undefined) { walk(cid); }
                    }
                }
            }
        };
        const roots: ReadonlyArray<TreeNodeId> | undefined = childIndex.get(null);
        if (roots) {
            for (let i: number = 0; i < roots.length; i++) {
                const id: TreeNodeId | undefined = roots[i as number];
                if (id !== undefined) { walk(id); }
            }
        }
        return out;
    };

export const useTreeProjection: (nodeMap: TreeNodeMap, childIndex: ChildIndexMap, expandedIds: ReadonlySet<TreeNodeId>) =>
NormalizedTreeNode[] = (nodeMap: TreeNodeMap, childIndex: ChildIndexMap, expandedIds: ReadonlySet<TreeNodeId>):
NormalizedTreeNode[] => {
    if (nodeMap === undefined || childIndex === undefined || expandedIds === undefined) {
        return [];
    }
    return useMemo((): NormalizedTreeNode[] => {
        return projectVisibleNodes(
            nodeMap,
            childIndex,
            expandedIds
        );
    }, [nodeMap, childIndex, expandedIds]);
};
