import { createContext, useContext, useMemo, memo, ReactNode, Dispatch, Context, SyntheticEvent, FC } from 'react';
import { CheckState, TreeNodeId, TreeViewProps, TreeEditEvent } from './types';
import { TreeNodeMap, ChildIndexMap, TreeViewState, TreeViewAction, NormalizedTreeNode } from './internal-types';
import { UseTreeEditResult } from './state/use-tree-edit';

/**
 * The full context value exposed to the rendering layer.
 *
 * @private
 */
export interface TreeViewContextValue extends TreeViewProps {
    nodeMap: TreeNodeMap;
    childIndex: ChildIndexMap;
    state: TreeViewState;
    dispatch: Dispatch<TreeViewAction>;
    checkStateMap: Map<TreeNodeId, CheckState>;
    toggleCheck: (id: TreeNodeId, e: SyntheticEvent) => void;
    autoCheck: boolean;
    checkDisabledChildren: boolean;
    checkOnClick: boolean;
    editable?: boolean;
    onNodeEdit?: (detail: TreeEditEvent) => boolean;
    editApi?: UseTreeEditResult;
    expandAll: (ids?: TreeNodeId[]) => void;
    collapseAll: (ids?: TreeNodeId[]) => void;
    onNodeClick: (node: NormalizedTreeNode, e: React.MouseEvent | React.KeyboardEvent) => void;
    onItemDoubleClick?: (node: NormalizedTreeNode, e: React.MouseEvent) => void;
    onItemToggleClick: (node: NormalizedTreeNode, e: React.MouseEvent) => void;
    onKeyDown: (e: React.KeyboardEvent<HTMLLIElement>, nodeId: TreeNodeId) => void;
    onFocus: (id: TreeNodeId | null) => void;
    registerNode: (id: TreeNodeId, el: HTMLLIElement | null) => void;
    rowTemplate?: ReactNode | null;
}

export interface TreeViewProviderProps {
    value: TreeViewContextValue;
    children: ReactNode;
}

export const TreeViewContext: Context<TreeViewContextValue | undefined> =
    createContext<TreeViewContextValue | undefined>(undefined);

export const useTreeViewContext: () => TreeViewContextValue = (): TreeViewContextValue => {
    const ctx: TreeViewContextValue | undefined = useContext(TreeViewContext);
    if (ctx === undefined) {
        throw new Error('useTreeViewContext must be used within a TreeView component.');
    }
    return ctx;
};

export const TreeViewProvider: FC<TreeViewProviderProps> = memo((props: TreeViewProviderProps): ReactNode => {

    const memoValue: TreeViewContextValue = useMemo((): TreeViewContextValue => {
        return props.value;
    }, [props.value]);

    return (
        <TreeViewContext.Provider value={memoValue}>
            {props.children}
        </TreeViewContext.Provider>
    );
});
