import { FC, HTMLAttributes, memo, ReactNode, useMemo } from 'react';
import { TREE_VIEW_CLASSES } from '../../common/constants';
import { TreeViewItemContextValue, useTreeViewItemContext } from '../tree-view-item-context';

/**
 * `TreeViewItemIcon` is a semantic container for a row's icon. Provides consistent styling and structure for displaying a node's resolved icon or a custom icon node within the `TreeViewItemIcon` component. When no children are supplied, defaults to the node's resolved icon.
 *
 * ```tsx
 * import { TreeView, TreeViewNodes, TreeViewNode, TreeViewItemIcon, TreeViewItemLabel } from '@syncfusion/react-navigations';
 * import { FolderIcon } from '@syncfusion/react-icons';
 *
 * const data = [
 *     { id: '1', label: 'Documents' },
 *     { id: '2', label: 'Resume.docx', icon: <FolderIcon /> }
 * ];
 * const fields = { id: 'id', label: 'label', icon: 'icon' };
 *
 * export default function App() {
 *     return (
 *         <TreeView dataSource={data} fields={fields}>
 *             <TreeViewNodes>
 *                 {() => (
 *                     <TreeViewNode>
 *                         <TreeViewItemIcon><FolderIcon /></TreeViewItemIcon>
 *                         <TreeViewItemLabel />
 *                     </TreeViewNode>
 *                 )}
 *             </TreeViewNodes>
 *         </TreeView>
 *     );
 * }
 * ```
 *
 */
export interface TreeViewItemIconProps {
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
type ITreeViewItemIconProps = TreeViewItemIconProps & HTMLAttributes<HTMLSpanElement>;

export const TreeViewItemIcon: FC<ITreeViewItemIconProps> = memo((props: ITreeViewItemIconProps) => {
    const { children, className, ...restProps } = props;
    const ctx: TreeViewItemContextValue = useTreeViewItemContext();

    const iconClassName: string = useMemo((): string => {
        return [
            TREE_VIEW_CLASSES.ITEM_ICON,
            TREE_VIEW_CLASSES.CONTENT_CENTER,
            className
        ].filter(Boolean).join(' ');
    }, [className]);

    const defaultIcon: ReactNode | null = useMemo((): ReactNode | null => {
        if (children !== undefined && children !== null) { return null; }
        return ctx.node.icon ?? null;
    }, [children, ctx.node.icon]);

    if (children === undefined || children === null) {
        if (defaultIcon === null) {
            return null;
        }
        return <span className={iconClassName} {...restProps}>{defaultIcon}</span>;
    }

    return <span className={iconClassName} {...restProps}>{children}</span>;
});

TreeViewItemIcon.displayName = 'TreeViewItemIcon';
