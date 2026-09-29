import { FC, memo, ReactNode, useCallback, useMemo } from 'react';
import { useTreeViewItemContext, TreeViewItemContextValue } from '../tree-view-item-context';
import { TreeItemTemplateContext } from '../types';
import { TreeViewNode } from './tree-view-node';
import { TreeViewItemToggle } from './tree-view-item-toggle';
import { TreeViewItemIcon } from './tree-view-item-icon';
import { TreeViewItemCheckbox } from './tree-view-item-checkbox';
import { TreeViewItemLabel } from './tree-view-item-label';
import { TreeViewEditInput } from './tree-view-edit-input';
import { TreeviewLoadIcon } from './tree-view-load-icon';

/**
 * `TreeViewNodes` is a semantic container that orchestrates the per-row composition of a `TreeView`. Provides consistent styling and structure for composing a node's toggle, checkbox, icon, label, editor, and loading indicator within the `TreeViewNodes` component. When no render-prop children are supplied, renders the default row composition.
 *
 * ```tsx
 * import { TreeView, TreeViewNodes, TreeViewNode, TreeViewItemLabel } from '@syncfusion/react-navigations';
 *
 * const data = [
 *     { id: '1', label: 'Documents' },
 *     { id: '2', label: 'Resume.docx' }
 * ];
 * const fields = { id: 'id', label: 'label' };
 *
 * export default function App() {
 *     return (
 *         <TreeView dataSource={data} fields={fields}>
 *             <TreeViewNodes>
 *                 {(ctx) => (
 *                     <TreeViewNode>
 *                         <TreeViewItemLabel>{String((ctx.item as { label: string }).label)}</TreeViewItemLabel>
 *                     </TreeViewNode>
 *                 )}
 *             </TreeViewNodes>
 *         </TreeView>
 *     );
 * }
 * ```
 *
 */
export interface TreeViewNodesProps {
    /**
     * Specifies the child content for the component.
     */
    children?: ((ctx: TreeItemTemplateContext) => ReactNode) | null;
}

export const TreeViewNodes: FC<TreeViewNodesProps> = memo((_props: TreeViewNodesProps) => {
    const ctx: TreeViewItemContextValue = useTreeViewItemContext();

    const beginEdit: () => void = useCallback((): void => {
        if (!ctx.editApi) { return; }
        ctx.editApi.beginEdit(ctx.node.id);
    }, [ctx.editApi, ctx.node.id]);

    const templateCtx: TreeItemTemplateContext = useMemo((): TreeItemTemplateContext => {
        return {
            item: ctx.node.raw,
            id: ctx.node.id,
            expanded: ctx.expanded,
            selected: ctx.selected,
            checkState: ctx.checkState,
            disabled: ctx.disabled,
            isLeaf: ctx.isLeaf,
            depth: ctx.depth,
            isEditing: ctx.isEditing === true,
            loading: ctx.loading,
            beginEdit: beginEdit
        };
    }, [ctx, beginEdit]);

    const { children } = _props;

    if (typeof children === 'function') {
        return (
            <>
                {children(templateCtx)}
            </>
        );
    }

    if (children !== undefined && children !== null) {
        return null;
    }

    return (
        <TreeViewNode>
            {ctx.loading ? <TreeviewLoadIcon /> : <TreeViewItemToggle />}
            <TreeViewItemCheckbox />
            <TreeViewItemIcon />
            {ctx.isEditing ? <TreeViewEditInput /> : <TreeViewItemLabel />}
        </TreeViewNode>
    );
});

TreeViewNodes.displayName = 'TreeViewNodes';
