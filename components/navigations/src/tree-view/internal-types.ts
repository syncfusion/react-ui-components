import { ReactNode, SyntheticEvent } from 'react';
import { TreeNodeId } from './types';

/**
 * Specifies the normalized internal representation of a single node.
 *
 * @private
 */
export interface NormalizedTreeNode {
    /**
     * Specifies the resolved unique identifier.
     */
    id: TreeNodeId;
    /**
     * Specifies the resolved parent ID. `null` for root nodes.
     */
    parentId: TreeNodeId | null;
    /**
     * Specifies the 0-indexed depth in the tree.
     */
    depth: number;
    /**
     * Specifies the 0-indexed position among siblings (post-sort).
     */
    index: number;
    /**
     * Specifies the original user-supplied item.
     */
    raw: unknown;
    /**
     * Specifies the resolved child IDs (already sorted).
     */
    childIds: TreeNodeId[];
    /**
     * Specifies whether this node has no children.
     */
    isLeaf: boolean;
    /**
     * Specifies the resolved label string (cached).
     */
    label: string;
    /**
     * Specifies whether `hasChildren` was set on the source item.
     */
    hasChildren: boolean;
    /**
     * Specifies whether the node is disabled.
     */
    isDisabled: boolean;
    /**
     * Specifies whether the node can be selected.
     */
    isSelectable: boolean;
    /**
     * Specifies the resolved icon, lifted from the source item during normalization.
     */
    icon?: ReactNode;
    /**
     * Specifies the resolved tooltip string, lifted from the source item during normalization.
     */
    tooltip?: string;
    /**
     * Specifies the resolved, scheme-validated navigation URL.
     */
    navigateUrl?: string;
}

/**
 * Specifies the read-only map of all nodes keyed by ID. Used for O(1) lookups.
 *
 * @private
 */
export type TreeNodeMap = ReadonlyMap<TreeNodeId, NormalizedTreeNode>;

/**
 * Specifies the per-parent index of child IDs (already sorted). Roots live under `null`.
 *
 * @private
 */
export type ChildIndexMap = ReadonlyMap<TreeNodeId | null, ReadonlyArray<TreeNodeId>>;

/**
 * Specifies the reducer action union. Internal — the public surface is the imperative ref
 * and the event callbacks.
 *
 * @private
 */
export type TreeViewAction =
    | { type: 'EXPAND_NODE'; id: TreeNodeId }
    | { type: 'COLLAPSE_NODE'; id: TreeNodeId }
    | { type: 'SET_EXPANDED_IDS'; ids: TreeNodeId[] }
    | { type: 'EXPAND_ALL'; ids?: TreeNodeId[] }
    | { type: 'COLLAPSE_ALL'; ids?: TreeNodeId[] }
    | { type: 'EXPAND_SPECIFIC'; ids: TreeNodeId[] }
    | { type: 'COLLAPSE_SPECIFIC'; ids: TreeNodeId[] }
    | { type: 'SELECT_NODE'; id: TreeNodeId; multi?: boolean; range?: boolean }
    | { type: 'DESELECT_NODE'; id: TreeNodeId }
    | { type: 'SET_SELECTED_IDS'; ids: TreeNodeId[] }
    | { type: 'RANGE_SELECT'; fromId: TreeNodeId | null; toId: TreeNodeId; ids: TreeNodeId[] }
    | { type: 'SET_RANGE_ANCHOR'; id: TreeNodeId | null }
    | { type: 'TOGGLE_CHECK'; id: TreeNodeId }
    | { type: 'SET_FOCUSED'; id: TreeNodeId | null }
    | { type: 'BEGIN_EDIT'; id: TreeNodeId }
    | { type: 'COMMIT_EDIT'; id: TreeNodeId }
    | { type: 'CANCEL_EDIT' }
    | { type: 'LOAD_CHILDREN_START'; id: TreeNodeId }
    | { type: 'LOAD_CHILDREN_SUCCESS'; id: TreeNodeId; rows: unknown[] }
    | { type: 'LOAD_CHILDREN_FAILURE'; id: TreeNodeId; error: Error }

/**
 * Specifies the dispatch contract exposed by useTreeReducer.
 *
 * @private
 */
export type TreeViewDispatch = (action: TreeViewAction, event?: SyntheticEvent) => void;

/**
 * Specifies the UI state shape. Managed by the reducer in Phase 1.
 *
 * @private
 */
export interface TreeViewState {
    /**
     * Specifies the set of expanded node ids.
     */
    expandedIds: Set<TreeNodeId>;
    /**
     * Specifies the set of selected node ids.
     */
    selectedIds: Set<TreeNodeId>;
    /**
     * Specifies the node id currently being edited. `null` when no edit is active.
     */
    editingId: TreeNodeId | null;
    /**
     * Specifies the set of node ids currently loading children.
     */
    loadingChildIds: Set<TreeNodeId>;
    /**
     * Specifies the node id that owns keyboard focus. `null` when none focused.
     */
    focusedId: TreeNodeId | null;
    /**
     * Specifies the persistent range-anchor id for shift-selection in `Multiple` mode.
     */
    rangeAnchorId: TreeNodeId | null;
}

/**
 * Specifies the resolved fields.
 *
 * @private
 */
export interface ResolvedFieldKeys {
    id: string;
    label: string;
    disabled: string;
    selectable: string;
    hasChildren: string;
    parentId: string;
    children: string;
    icon: string;
    tooltip: string;
    navigateUrl: string;
}
