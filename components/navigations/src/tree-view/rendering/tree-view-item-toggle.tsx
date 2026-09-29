import { FC, memo, ReactNode, useCallback, MouseEvent, useMemo, HTMLAttributes } from 'react';
import { ChevronRightIcon } from '@syncfusion/react-icons';
import { TREE_VIEW_CLASSES } from '../../common/constants';
import { TreeViewItemContextValue, useTreeViewItemContext } from '../tree-view-item-context';

/**
 * `TreeViewItemToggle` is a semantic container for a row's expand/collapse toggle. Provides consistent styling and structure for displaying a toggle affordance within the `TreeViewItemToggle` component. When no children are supplied, defaults to a chevron icon that reflects the current expanded state.
 *
 * ```tsx
 * import { TreeView, TreeViewNodes, TreeViewNode, TreeViewItemLabel, TreeViewItemToggle } from '@syncfusion/react-navigations';
 * import { ChevronDownFillIcon, ChevronRightFillIcon } from '@syncfusion/react-icons';
 *
 * const data = [
 *     { id: '1', label: 'Documents', child: [{ id: '2', label: 'Resume.docx' }] }
 * ];
 * const fields = { id: 'id', label: 'label', children: 'child' };
 *
 * export default function App() {
 *     return (
 *         <TreeView dataSource={data} fields={fields}>
 *             <TreeViewNodes>
 *                 {(ctx) => (
 *                     <TreeViewNode>
 *                         <TreeViewItemToggle>
 *                             {ctx.expanded ? <ChevronDownFillIcon /> : <ChevronRightFillIcon />}
 *                         </TreeViewItemToggle>
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
export interface TreeViewItemToggleProps {
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

type ITreeViewItemToggleProps = TreeViewItemToggleProps & HTMLAttributes<HTMLSpanElement>;

export const TreeViewItemToggle: FC<ITreeViewItemToggleProps> = memo((props: ITreeViewItemToggleProps) => {
    const { children, className, onClick, ...restProps } = props;
    const ctx: TreeViewItemContextValue = useTreeViewItemContext();

    const onToggleClick: (e: MouseEvent<HTMLElement>) => void = useCallback((e: MouseEvent<HTMLElement>): void => {
        e.stopPropagation();
        if (onClick) {
            onClick(e);
        } else {
            ctx.onItemToggleClick(ctx.node, e);
        }
    }, [ctx, onClick]);

    const toggleClassName: string = useMemo((): string => {
        return [
            TREE_VIEW_CLASSES.ITEM_TOGGLE,
            TREE_VIEW_CLASSES.CONTENT_CENTER,
            !children ? TREE_VIEW_CLASSES.ITEM_DEFAULT_TOGGLE : '',
            ctx.expanded ? TREE_VIEW_CLASSES.ITEM_TOGGLE_EXPANDED : '',
            className
        ].filter(Boolean).join(' ');
    }, [className, children, ctx.expanded]);

    const renderedChildren: ReactNode = useMemo((): ReactNode => {
        if (children === undefined || children === null) {
            return <ChevronRightIcon />;
        }
        return children;
    }, [children]);

    if (ctx.isLeaf) {
        return;
    }

    return (
        <span
            className={toggleClassName}
            aria-hidden="true"
            onClick={onToggleClick}
            {...restProps}
        >
            {renderedChildren}
        </span>
    );
});

TreeViewItemToggle.displayName = 'TreeViewItemToggle';
