import { AriaAttributes, HTMLAttributes } from 'react';
import { CheckState, SelectionMode, TreeNodeId } from '../types';
import { NormalizedTreeNode, TreeViewState } from '../internal-types';

interface AriaAttrsContext {
    selectionMode: SelectionMode;
    siblingSetSize: number;
    siblingPosInset: number;
    focusedId: TreeNodeId | null;
    multiple: boolean;
    isFocusable: boolean;
    checkStateMap?: ReadonlyMap<TreeNodeId, CheckState>;
}

export const buildAriaAttributes: (node: NormalizedTreeNode, state: TreeViewState, context: AriaAttrsContext) => AriaAttributes = (
    node: NormalizedTreeNode,
    state: TreeViewState,
    context: AriaAttrsContext
): AriaAttributes => {
    const isSelected: boolean = state.selectedIds.has(node.id);
    const isExpanded: boolean = state.expandedIds.has(node.id);
    const isDisabled: boolean = node.isDisabled;
    const isLeaf: boolean = node.isLeaf;
    const derivedCheck: CheckState | undefined = context.checkStateMap?.get(node.id);

    const attrs: HTMLAttributes<HTMLLIElement> & AriaAttributes = {
        role: 'treeitem',
        'aria-level': node.depth + 1,
        'aria-setsize': context.siblingSetSize,
        'aria-posinset': context.siblingPosInset,
        'aria-disabled': isDisabled || undefined
    };

    if (!isLeaf) {
        attrs['aria-expanded'] = isExpanded;
    }

    if (context.selectionMode === 'Checkbox') {
        if (derivedCheck === 'Indeterminate') {
            attrs['aria-checked'] = 'mixed';
        } else if (derivedCheck === 'Checked' || (derivedCheck === undefined && isSelected)) {
            attrs['aria-checked'] = true;
        } else {
            attrs['aria-checked'] = false;
        }
    } else {
        attrs['aria-selected'] = isSelected;
    }
    attrs.tabIndex = context.isFocusable ? 0 : -1;

    return attrs;
};
