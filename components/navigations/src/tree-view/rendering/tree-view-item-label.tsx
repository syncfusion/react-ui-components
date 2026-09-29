import { FC, HTMLAttributes, memo, ReactNode, useMemo } from 'react';
import { TREE_VIEW_CLASSES } from '../../common/constants';
import { TreeViewItemContextValue, useTreeViewItemContext } from '../tree-view-item-context';
import { useTreeViewContext } from '../tree-view-context';

/**
 * `TreeViewItemLabel` is a semantic container for a row's label text. Provides consistent styling and structure for displaying a node's resolved text or custom content within the `TreeViewItemLabel` component. When no children are supplied, defaults to the node's resolved label.
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
 *                         <TreeViewItemLabel><strong>{(ctx.item as { label: string }).label}</strong></TreeViewItemLabel>
 *                     </TreeViewNode>
 *                 )}
 *             </TreeViewNodes>
 *         </TreeView>
 *     );
 * }
 * ```
 */
export interface TreeViewItemLabelProps {
    /**
     * Specifies the child content for the component.
     *
     * @default -
     */
    children?: ReactNode;
    /**
     * Specifies the root element class name.
     *
     * @default -
     */
    className?: string;
}

type ITreeViewItemLabelProps = TreeViewItemLabelProps & HTMLAttributes<HTMLSpanElement>;

export const TreeViewItemLabel: FC<ITreeViewItemLabelProps> = memo((props: ITreeViewItemLabelProps) => {
    const { children, className, ...restProps } = props;
    const ctx: TreeViewItemContextValue = useTreeViewItemContext();
    const {textWrap, fullRowNavigable} = useTreeViewContext();

    const labelClassName: string = useMemo((): string => {
        return [
            TREE_VIEW_CLASSES.ITEM_LABEL,
            TREE_VIEW_CLASSES.CONTENT,
            textWrap ? '' : TREE_VIEW_CLASSES.ITEM_LABEL_NO_WRAP,
            className
        ].filter(Boolean).join(' ');
    }, [className, textWrap]);

    const inner: ReactNode = children !== undefined && children !== null ? children : ctx.node.label;
    const navigateUrl: string | undefined = ctx.node.navigateUrl;

    const anchorClassName: string = useMemo((): string => {
        return [
            TREE_VIEW_CLASSES.ITEM_LINK,
            fullRowNavigable ? TREE_VIEW_CLASSES.ITEM_LINK_FULL_ROW : ''
        ].filter(Boolean).join(' ');
    }, [fullRowNavigable]);

    if (navigateUrl) {
        return (
            <span className={labelClassName} {...restProps}>
                <a className={anchorClassName} href={navigateUrl} tabIndex={-1}>
                    {inner}
                </a>
            </span>
        );
    }

    return (
        <span className={labelClassName} {...restProps }>
            {inner}
        </span>
    );
});

TreeViewItemLabel.displayName = 'TreeViewItemLabel';
