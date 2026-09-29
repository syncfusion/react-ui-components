
import { NormalizedTreeNode } from '..';
import { SortOrder, TreeNodeId } from '../types';

export const sortChildIds: (childIds: readonly TreeNodeId[], nodeMap: ReadonlyMap<TreeNodeId, NormalizedTreeNode>,
    sortOrder: SortOrder) => TreeNodeId[] = (
    childIds: ReadonlyArray<TreeNodeId>,
    nodeMap: ReadonlyMap<TreeNodeId, NormalizedTreeNode>,
    sortOrder: SortOrder
): TreeNodeId[] => {
    if (sortOrder === SortOrder.None || childIds.length < 2) {
        return childIds.slice();
    }
    const direction: 1 | -1 = sortOrder === SortOrder.Ascending ? 1 : -1;
    const labelOf: (id: TreeNodeId) => string = (id: TreeNodeId): string => {
        const node: NormalizedTreeNode | undefined = nodeMap.get(id);
        return (node && node.label) ? node.label : '';
    };
    const out: TreeNodeId[] = childIds.slice();
    out.sort((a: TreeNodeId, b: TreeNodeId): number => {
        const la: string = labelOf(a);
        const lb: string = labelOf(b);
        if (la < lb) { return -1 * direction; }
        if (la > lb) { return 1 * direction; }
        return 0;
    });
    return out;
};
