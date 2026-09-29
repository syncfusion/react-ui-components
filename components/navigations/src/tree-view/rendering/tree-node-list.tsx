import { memo, ReactNode, useCallback, useMemo, SyntheticEvent } from 'react';
import { TreeNodeId } from '../types';
import { useTreeViewContext } from '../tree-view-context';
import { TreeViewItemProvider, TreeViewItemContextValue } from '../tree-view-item-context';
import { TreeViewNodes } from './tree-view-nodes';
import { NormalizedTreeNode } from '../internal-types';
import { CheckState, SelectionMode } from '../types';

interface TreeNodeListProps {
    nodes: NormalizedTreeNode[];
}

interface RowProps {
    node: NormalizedTreeNode;
    firstFocusableNode?: TreeNodeId;
}

const RowBase: (props: RowProps) => ReactNode = (props: RowProps): ReactNode => {
    const { node, firstFocusableNode } = props;
    const {
        state,
        checkStateMap,
        selectionMode: ctxSelectionMode,
        onNodeClick,
        onItemToggleClick,
        toggleCheck,
        editApi,
        rowTemplate
    } = useTreeViewContext();

    const onRowToggleCheck: (e: SyntheticEvent) => void = useCallback((e: SyntheticEvent): void => {
        toggleCheck(node.id, e);
    }, [toggleCheck, node.id]);

    const selectionMode: SelectionMode = ctxSelectionMode || 'Single';
    const isExpanded: boolean = state.expandedIds.has(node.id);
    const isSelected: boolean = state.selectedIds.has(node.id);
    const checkState: CheckState = checkStateMap.get(node.id) ?? 'Unchecked';
    const isEditing: boolean = state.editingId === node.id;
    const isLoading: boolean = state.loadingChildIds.has(node.id);

    const isFocusable: boolean = useMemo((): boolean => {
        if (state.focusedId !== null) {
            return state.focusedId === node.id;
        }
        return firstFocusableNode !== undefined && firstFocusableNode === node.id;
    }, [state.focusedId, node.id, firstFocusableNode]);

    const itemContextValue: TreeViewItemContextValue = useMemo((): TreeViewItemContextValue => {
        return {
            node: node,
            expanded: isExpanded,
            selected: isSelected,
            checkState: checkState,
            disabled: node.isDisabled,
            isLeaf: node.isLeaf,
            depth: node.depth,
            selectionMode: selectionMode,
            onNodeClick,
            onItemToggleClick,
            toggleCheck: onRowToggleCheck,
            isEditing: isEditing,
            editApi: editApi,
            loading: isLoading,
            isFocusable: isFocusable
        };
    }, [node, isExpanded, isSelected, checkState, selectionMode, onNodeClick,
        onItemToggleClick, isEditing, editApi, isLoading, isFocusable, onRowToggleCheck]);

    return (
        <TreeViewItemProvider value={itemContextValue}>
            {rowTemplate ? rowTemplate : <TreeViewNodes />}
        </TreeViewItemProvider>
    );
};

const areEqual: (prev: RowProps, next: RowProps) => boolean = (prev: RowProps, next: RowProps): boolean => {
    return prev.node === next.node;
};

const Row: (props: RowProps) => ReactNode = memo(RowBase, areEqual);

export const TreeNodeList: (props: TreeNodeListProps) => ReactNode = (props: TreeNodeListProps): ReactNode => {

    const { nodes } = props;

    if (!nodes || nodes.length === 0) {
        return null;
    }
    const firstFocusableNode: TreeNodeId | undefined = nodes.find((item: NormalizedTreeNode) => !item.isDisabled)?.id;
    return (
        <>
            {nodes.map((node: NormalizedTreeNode) => (
                <Row key={String(node.id)} node={node} firstFocusableNode={firstFocusableNode} />
            ))}
        </>
    );
};
