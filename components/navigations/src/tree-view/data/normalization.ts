import { useMemo } from 'react';
import { SortOrder, TreeNodeId, TreeViewFieldMapping } from '../types';
import { TreeNodeMap, ChildIndexMap, NormalizedTreeNode, ResolvedFieldKeys } from '../internal-types';
import { isLocalArray, isEmpty } from './data-source-detector';
import { sortChildIds } from './sort-nodes';
import { readCommonFields, readField } from './data-utils';

/**
 * Specifies the return value of `useTreeNormalization`.
 *
 * @private
 */
export interface UseTreeNormalizationResult {
    nodeMap: TreeNodeMap;
    childIndex: ChildIndexMap;
}

export const resolveFieldKeys: (fields: TreeViewFieldMapping, mode: 'hierarchical' | 'self-referential') => ResolvedFieldKeys =
    (fields: TreeViewFieldMapping, mode: 'hierarchical' | 'self-referential'): ResolvedFieldKeys => {
        const currentField: TreeViewFieldMapping = fields || {};
        return {
            id: currentField.id || 'id',
            label: currentField.label || 'label',
            disabled: currentField.disabled || 'disabled',
            selectable: currentField.selectable || 'selectable',
            hasChildren: currentField.hasChildren || 'hasChildren',
            parentId: currentField.parentId || 'parentId',
            children: mode === 'hierarchical' ? (currentField.children || 'children') : 'children',
            icon: currentField.icon || 'icon',
            tooltip: currentField.tooltip || 'tooltip',
            navigateUrl: currentField.navigateUrl || 'navigateUrl'
        };
    };

const orderedChildren: (list: TreeNodeId[], nodeMap: ReadonlyMap<TreeNodeId, NormalizedTreeNode>, sortOrder: SortOrder) =>
ReadonlyArray<TreeNodeId> =
    (list: TreeNodeId[], nodeMap: ReadonlyMap<TreeNodeId, NormalizedTreeNode>, sortOrder: SortOrder): ReadonlyArray<TreeNodeId> => {
        if (sortOrder === SortOrder.None) {
            return list;
        }
        return sortChildIds(list, nodeMap, sortOrder);
    };

export const buildHierarchical: <T = unknown>(items: readonly T[], fields: TreeViewFieldMapping, sortOrder: SortOrder) =>
UseTreeNormalizationResult =
    <T = unknown>(items: ReadonlyArray<T>, fields: TreeViewFieldMapping, sortOrder: SortOrder): UseTreeNormalizationResult => {
        const keys: ResolvedFieldKeys = resolveFieldKeys(fields, 'hierarchical');
        const childrenKey: string = keys.children;
        const nodeMap: Map<TreeNodeId, NormalizedTreeNode> = new Map();
        const childIndex: Map<TreeNodeId | null, TreeNodeId[]> = new Map();
        const rootIds: TreeNodeId[] = [];
        const counter: { i: number } = { i: 0 };
        const doSort: boolean = sortOrder !== SortOrder.None;

        const stack: Array<{ raw: T; parentId: TreeNodeId | null; depth: number; childList: ReadonlyArray<T> }> = [];
        for (let i: number = items.length - 1; i >= 0; i--) {
            const raw: T | undefined = items[i as number];
            if (raw === null || typeof raw !== 'object') { continue; }
            const childList: ReadonlyArray<T> = ((raw as Record<string, unknown>)[childrenKey as string] as ReadonlyArray<T>) || [];
            stack.push({ raw: raw, parentId: null, depth: 0, childList: childList });
        }

        while (stack.length > 0) {
            const frame: { raw: T; parentId: TreeNodeId | null; depth: number; childList: ReadonlyArray<T> } =
                stack.pop() as { raw: T; parentId: TreeNodeId | null; depth: number; childList: ReadonlyArray<T> };
            const raw: T = frame.raw;
            const parentId: TreeNodeId | null = frame.parentId;
            const depth: number = frame.depth;
            const children: ReadonlyArray<T> = frame.childList;

            const [id, label, disabled, selectable, hasChildren, icon, tooltip, navigateUrl] = readCommonFields(raw, keys);
            if (id === undefined || id === null || id === '') { continue; }

            let directChildren: TreeNodeId[];
            if (parentId === null) {
                rootIds.push(id);
                directChildren = (childIndex.get(id) as TreeNodeId[] | undefined) || [];
                childIndex.set(id, directChildren);
            } else {
                directChildren = (childIndex.get(parentId) as TreeNodeId[] | undefined) || [];
                childIndex.set(parentId, directChildren);
                directChildren.push(id);
            }
            const node: NormalizedTreeNode = {
                id: id,
                parentId: parentId,
                depth: depth,
                index: counter.i++,
                raw: raw,
                childIds: directChildren,
                isLeaf: children.length === 0 && !hasChildren,
                label: label,
                hasChildren: hasChildren,
                isDisabled: disabled,
                isSelectable: selectable,
                icon: icon,
                tooltip: tooltip,
                navigateUrl: navigateUrl
            };
            nodeMap.set(id, node);

            for (let i: number = children.length - 1; i >= 0; i--) {
                const child: T | undefined = children[i as number];
                if (child === null || typeof child !== 'object') { continue; }
                const childList: ReadonlyArray<T> = ((child as Record<string, unknown>)[childrenKey as string] as ReadonlyArray<T>) || [];
                stack.push({ raw: child, parentId: id, depth: depth + 1, childList: childList });
            }
        }

        if (rootIds.length > 0) {
            childIndex.set(null, rootIds);
        }

        if (!doSort) {
            return {
                nodeMap: nodeMap,
                childIndex: childIndex
            };
        }

        const readonlyChildIndex: Map<TreeNodeId | null, ReadonlyArray<TreeNodeId>> = new Map();
        childIndex.forEach((rawChildren: ReadonlyArray<TreeNodeId>, parentId: TreeNodeId | null): void => {
            if (readonlyChildIndex.has(parentId)) { return; }
            const sortedChildren: ReadonlyArray<TreeNodeId> = orderedChildren(
                rawChildren as TreeNodeId[], nodeMap, sortOrder);
            if (parentId !== null) {
                (nodeMap.get(parentId) as NormalizedTreeNode).childIds = sortedChildren as TreeNodeId[];
            }
            readonlyChildIndex.set(parentId, sortedChildren);
        });

        return {
            nodeMap: nodeMap,
            childIndex: readonlyChildIndex
        };
    };

export const buildTreeFromParentIds: <T = unknown>(items: readonly T[], fields: TreeViewFieldMapping, sortOrder: SortOrder) =>
UseTreeNormalizationResult =
    <T = unknown>(items: ReadonlyArray<T>, fields: TreeViewFieldMapping, sortOrder: SortOrder): UseTreeNormalizationResult => {
        const keys: ResolvedFieldKeys = resolveFieldKeys(fields, 'self-referential');
        const parentKey: string = keys.parentId;
        const doSort: boolean = sortOrder !== SortOrder.None;
        const nodeMap: Map<TreeNodeId, NormalizedTreeNode> = new Map();
        const children: Map<TreeNodeId | null, TreeNodeId[]> = new Map();

        for (let i: number = 0; i < items.length; i++) {
            const raw: T = items[i as number];
            const [id, label, disabled, selectable, hasChildren, icon, tooltip, navigateUrl] = readCommonFields(raw, keys);
            if (id === undefined || id === null || id === '') { continue; }
            const parentRaw: unknown = readField(raw, parentKey, null);
            const parentId: TreeNodeId | null =
                (parentRaw === null || parentRaw === undefined || parentRaw === '' || parentRaw === 0) ? null : (parentRaw as TreeNodeId);
            const node: NormalizedTreeNode = {
                id: id,
                parentId: parentId,
                depth: 0,
                index: 0,
                raw: raw,
                childIds: [],
                isLeaf: false,
                label: label,
                hasChildren: hasChildren,
                isDisabled: disabled,
                isSelectable: selectable,
                icon: icon,
                tooltip: tooltip,
                navigateUrl: navigateUrl
            };
            nodeMap.set(id, node);
            const list: TreeNodeId[] = children.get(parentId) || [];
            list.push(id);
            children.set(parentId, list);
        }

        const rootBucket: TreeNodeId[] = children.get(null) || [];

        if (rootBucket.length > 0) {
            children.set(null, rootBucket);
        }

        const counter: { i: number } = { i: 0 };
        const walkStack: Array<{ id: TreeNodeId; depth: number }> = [];
        for (let i: number = rootBucket.length - 1; i >= 0; i--) {
            walkStack.push({ id: rootBucket[i as number], depth: 0 });
        }
        while (walkStack.length > 0) {
            const frame: { id: TreeNodeId; depth: number } = walkStack.pop() as { id: TreeNodeId; depth: number };
            const id: TreeNodeId = frame.id;
            const node: NormalizedTreeNode | undefined = nodeMap.get(id);
            if (!node) { continue; }
            node.depth = frame.depth;
            node.index = counter.i++;
            const direct: ReadonlyArray<TreeNodeId> = children.get(id) || [];
            node.childIds = direct as TreeNodeId[];
            node.isLeaf = direct.length === 0 && !node.hasChildren;
            for (let i: number = direct.length - 1; i >= 0; i--) {
                walkStack.push({ id: direct[i as number], depth: frame.depth + 1 });
            }
        }

        if (!doSort) {
            return {
                nodeMap: nodeMap,
                childIndex: children
            };
        }

        const readonlyChildIndex: Map<TreeNodeId | null, ReadonlyArray<TreeNodeId>> = new Map();
        children.forEach((rawChildren: ReadonlyArray<TreeNodeId>, parentId: TreeNodeId | null): void => {
            if (readonlyChildIndex.has(parentId)) { return; }
            const sortedChildren: ReadonlyArray<TreeNodeId> = orderedChildren(
                rawChildren as TreeNodeId[], nodeMap, sortOrder);
            if (parentId !== null) {
                (nodeMap.get(parentId) as NormalizedTreeNode).childIds = sortedChildren as TreeNodeId[];
            }
            readonlyChildIndex.set(parentId, sortedChildren);
        });

        return {
            nodeMap: nodeMap,
            childIndex: readonlyChildIndex
        };
    };

const emptyResult: () => UseTreeNormalizationResult = (): UseTreeNormalizationResult => ({
    nodeMap: new Map(),
    childIndex: new Map()
});

export const detectAndBuild: <T>(data: T[] | unknown, fields: TreeViewFieldMapping, sortOrder: SortOrder) => UseTreeNormalizationResult =
    <T>(data: T[] | unknown, fields: TreeViewFieldMapping, sortOrder: SortOrder): UseTreeNormalizationResult => {
        if (isEmpty(data)) {
            return emptyResult();
        }
        if (isLocalArray(data)) {
            const items: ReadonlyArray<T> = data as ReadonlyArray<T>;
            if (fields.children) {
                return buildHierarchical<T>(items, fields, sortOrder);
            }
            return buildTreeFromParentIds<T>(items, fields, sortOrder);
        }
        return emptyResult();
    };

export const useTreeNormalization: <T = unknown>(data: T[] | unknown, fields: TreeViewFieldMapping | undefined, sortOrder?: SortOrder) =>
UseTreeNormalizationResult = <T = unknown>(
    data: T[] | unknown,
    fields: TreeViewFieldMapping | undefined,
    sortOrder: SortOrder = SortOrder.None
): UseTreeNormalizationResult => {
    return useMemo((): UseTreeNormalizationResult => {
        const resolvedFields: TreeViewFieldMapping = fields || {};
        const { nodeMap, childIndex } = detectAndBuild<T>(data, resolvedFields, sortOrder);
        return {
            nodeMap: nodeMap,
            childIndex: childIndex
        };
    }, [data, fields, sortOrder]);
};
