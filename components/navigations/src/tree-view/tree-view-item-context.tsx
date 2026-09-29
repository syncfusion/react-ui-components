import { createContext, useContext, useMemo, memo, ReactNode, Context, MouseEvent as ReactMouseEvent, KeyboardEvent as ReactKeyboardEvent, SyntheticEvent, FC } from 'react';
import { NormalizedTreeNode } from './internal-types';
import { CheckState, SelectionMode } from './types';
import { UseTreeEditResult } from './state/use-tree-edit';

/**
 * Specifies the per-row context value. The system MUST provide one `TreeViewItemContextValue`
 * per visible row, owned by `TreeNode`.
 *
 * @private
 */
export interface TreeViewItemContextValue {
    /**
     * Specifies the normalized node for this row.
     */
    node: NormalizedTreeNode;
    /**
     * Specifies whether the node is currently expanded.
     */
    expanded: boolean;
    /**
     * Specifies whether the node is currently selected.
     */
    selected: boolean;
    /**
     * Specifies the tri-state checkbox state for the row.
     */
    checkState: CheckState;
    /**
     * Specifies whether the node is disabled.
     */
    disabled: boolean;
    /**
     * Specifies whether the node has no children.
     */
    isLeaf: boolean;
    /**
     * Specifies the 0-indexed depth in the tree.
     */
    depth: number;
    /**
     * Specifies the current selection mode.
     */
    selectionMode: SelectionMode;
    /**
     * Specifies the row click handler that dispatches focus + selection + (when `expandOn==='Click'`) expansion.
     */
    onNodeClick: (node: NormalizedTreeNode, e: ReactMouseEvent | ReactKeyboardEvent) => void;
    /**
     * Specifies the toggle click handler that dispatches expand/collapse and stops event propagation.
     */
    onItemToggleClick: (node: NormalizedTreeNode, e: ReactMouseEvent) => void;
    /**
     * Specifies the checkbox toggle handler.
     */
    toggleCheck: (e: SyntheticEvent) => void;
    /**
     * Specifies whether the row's editor is currently open.
     */
    isEditing?: boolean;
    /**
     * Specifies the editor lifecycle API shared by the row.
     */
    editApi?: UseTreeEditResult;
    /**
     * Specifies whether the row's children are currently being fetched.
     */
    loading?: boolean;
    /**
     * Specifies whether this row owns the roving `tabIndex`.
     */
    isFocusable?: boolean;
}

/**
 * Specifies the props accepted by the `TreeViewItemProvider` component.
 *
 * @private
 */
export interface TreeViewItemProviderProps {
    /**
     * Specifies the per-row context value to expose to descendants.
     */
    value: TreeViewItemContextValue;
    /**
     * Specifies the row content.
     */
    children: ReactNode;
}

/**
 * Specifies the React context for per-row state. Created with `undefined` so the
 * `useTreeViewItemContext` hook can throw when used outside a provider.
 *
 * @private
 */
export const TreeViewItemContext: Context<TreeViewItemContextValue | undefined> =
    createContext<TreeViewItemContextValue | undefined>(undefined);

export const useTreeViewItemContext: () => TreeViewItemContextValue = (): TreeViewItemContextValue => {
    const ctx: TreeViewItemContextValue | undefined = useContext(TreeViewItemContext);
    if (ctx === undefined) {
        throw new Error('useTreeViewItemContext must be used within a TreeViewItemProvider.');
    }
    return ctx;
};

export const TreeViewItemProvider: FC<TreeViewItemProviderProps> = memo(
    (props: TreeViewItemProviderProps): ReactNode => {
        const memoValue: TreeViewItemContextValue = useMemo((): TreeViewItemContextValue => props.value, [props.value]);
        return (
            <TreeViewItemContext.Provider value={memoValue}>
                {props.children}
            </TreeViewItemContext.Provider>
        );
    });

TreeViewItemProvider.displayName = 'TreeViewItemProvider';
