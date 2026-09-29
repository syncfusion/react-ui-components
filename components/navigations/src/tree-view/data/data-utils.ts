import { ReactNode } from 'react';
import { SortOrder, TreeNodeId } from '../types';
import { TreeNodeMap, ChildIndexMap, NormalizedTreeNode, ResolvedFieldKeys } from '../internal-types';
import { sortChildIds } from './sort-nodes';
import { getValue } from '@syncfusion/react-base';

export const readField: (item: unknown, key: string, fallback: unknown) => unknown =
    (item: unknown, key: string, fallback: unknown): unknown => {
        if (item === null || typeof item !== 'object') {
            return fallback;
        }
        const value: unknown = getValue(key, item);
        return value === undefined ? fallback : value;
    };

export const readCommonFields: (
    raw: unknown, keys: ResolvedFieldKeys
) => [TreeNodeId, string, boolean, boolean, boolean, ReactNode | undefined, string | undefined, string | undefined] =
    (raw: unknown, keys: ResolvedFieldKeys)
    : [TreeNodeId, string, boolean, boolean, boolean, ReactNode | undefined, string | undefined, string | undefined] => {
        const id: TreeNodeId = readField(raw, keys.id, undefined) as TreeNodeId;
        const label: string = String(readField(raw, keys.label, ''));
        const disabled: boolean = Boolean(readField(raw, keys.disabled, false));
        const selectable: boolean = readField(raw, keys.selectable, true) !== false;
        const hasChildren: boolean = Boolean(readField(raw, keys.hasChildren, false));
        const icon: ReactNode | undefined = readField(raw, keys.icon, undefined) as ReactNode | undefined;
        const tooltip: string | undefined = readTooltip(readField(raw, keys.tooltip, undefined));
        const navigateUrl: string | undefined = sanitizeNavigateUrl(readField(raw, keys.navigateUrl, undefined));
        return [id, label, disabled, selectable, hasChildren, icon, tooltip, navigateUrl];
    };

const readTooltip: (raw: unknown) => string | undefined =
    (raw: unknown): string | undefined => {
        if (typeof raw !== 'string') { return undefined; }
        const trimmed: string = raw.trim();
        return trimmed === '' ? undefined : trimmed;
    };

export const mergeIntoNodeMap: (prev: TreeNodeMap, rows: ReadonlyArray<unknown>, fields: ResolvedFieldKeys,
    parentContext?: { id: TreeNodeId; depth: number } | null) => TreeNodeMap =
    (prev: TreeNodeMap, rows: ReadonlyArray<unknown>, fields: ResolvedFieldKeys,
     parentContext?: { id: TreeNodeId; depth: number } | null): TreeNodeMap => {
        if (rows.length === 0) {
            return prev;
        }
        const next: Map<TreeNodeId, NormalizedTreeNode> = new Map(prev);
        let changed: boolean = false;
        const seedParentId: TreeNodeId | null = parentContext ? parentContext.id : null;
        const seedDepth: number = parentContext ? parentContext.depth + 1 : 0;
        for (let i: number = 0; i < rows.length; i++) {
            const raw: unknown = rows[i as number];
            if (raw === null || typeof raw !== 'object') { continue; }
            const [id, label, disabled, selectable, hasChildren, icon, tooltip, navigateUrl] = readCommonFields(raw, fields);
            if (id === undefined || id === null || id === '') { continue; }
            if (next.has(id)) { continue; }
            next.set(id, {
                id: id,
                parentId: seedParentId,
                depth: seedDepth,
                index: 0,
                raw: raw,
                childIds: [],
                isLeaf: !hasChildren,
                label: label,
                hasChildren: hasChildren,
                isDisabled: disabled,
                isSelectable: selectable,
                icon: icon,
                tooltip: tooltip,
                navigateUrl: navigateUrl
            });
            changed = true;
        }
        if (!changed) {
            return prev;
        }
        return next;
    };

export const mergeIntoChildIndex: (prev: ChildIndexMap, parentId: TreeNodeId | null, childIds: ReadonlyArray<TreeNodeId>,
    sortOrder: SortOrder, nodeMap: TreeNodeMap) => ChildIndexMap =
    (prev: ChildIndexMap, parentId: TreeNodeId | null, childIds: ReadonlyArray<TreeNodeId>, sortOrder: SortOrder,
     nodeMap: TreeNodeMap): ChildIndexMap => {
        if (childIds.length === 0) {
            return prev;
        }
        const existing: ReadonlyArray<TreeNodeId> = prev.get(parentId) || [];
        const combined: TreeNodeId[] = existing.slice();
        for (let i: number = 0; i < childIds.length; i++) {
            const cid: TreeNodeId | undefined = childIds[i as number];
            if (cid === undefined) { continue; }
            if (combined.indexOf(cid) !== -1) { continue; }
            combined.push(cid);
        }
        if (combined.length === existing.length) {
            return prev;
        }
        const sorted: TreeNodeId[] = sortOrder === SortOrder.None ? combined : sortChildIds(combined, nodeMap, sortOrder);
        const next: Map<TreeNodeId | null, ReadonlyArray<TreeNodeId>> = new Map(prev);
        next.set(parentId, sorted);
        if (parentId !== null) {
            const parent: NormalizedTreeNode | undefined = nodeMap.get(parentId);
            if (parent) {
                const mutated: Map<TreeNodeId, NormalizedTreeNode> = new Map(nodeMap);
                mutated.set(parentId, { ...parent, childIds: sorted });
                (nodeMap as Map<TreeNodeId, NormalizedTreeNode>).set(parentId, mutated.get(parentId) as NormalizedTreeNode);
            }
        }
        return next;
    };

export const sanitizeNavigateUrl: (raw: unknown) => string | undefined =
    (raw: unknown): string | undefined => {
        if (typeof raw !== 'string') { return undefined; }
        const trimmed: string = raw.trim();
        if (trimmed === '') { return undefined; }
        const lowered: string = trimmed.toLowerCase();
        const schemeMatch: RegExpMatchArray | null = lowered.match(/^([a-z][a-z0-9+.-]*):/);
        if (schemeMatch) {
            const scheme: string = (schemeMatch[1] as string).toLowerCase();
            if (
                scheme === 'http' ||
                scheme === 'https' ||
                scheme === 'mailto' ||
                scheme === 'tel'
            ) {
                return trimmed;
            }
            return undefined;
        }
        if (trimmed.startsWith('//')) { return trimmed; }
        if (trimmed.startsWith('/')) { return trimmed; }
        if (trimmed.startsWith('?') || trimmed.startsWith('#')) { return trimmed; }
        if (/^[a-zA-Z0-9._~-]/.test(trimmed)) { return trimmed; }
        return undefined;
    };
