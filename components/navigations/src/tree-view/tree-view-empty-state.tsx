import { FC, HTMLAttributes, memo, ReactNode, useMemo } from 'react';
import { TREE_VIEW_CLASSES } from '../common/constants';

/**
 * `TreeViewEmptyState` is a semantic container for the placeholder shown when a `TreeView` has no visible nodes to render. Provides consistent styling and structure for displaying an empty-state message within the `TreeViewEmptyState` component. Renders nothing when no children are supplied.
 *
 * ```tsx
 * import { TreeView, TreeViewEmptyState } from '@syncfusion/react-navigations';
 *
 * export default function App() {
 *     return (
 *         <TreeView dataSource={[]}>
 *             <TreeViewEmptyState>
 *                 <span>Nothing here</span>
 *             </TreeViewEmptyState>
 *         </TreeView>
 *     );
 * }
 * ```
 *
 */
export interface TreeViewEmptyStateProps {
    /**
     * Specifies a custom empty-state message.
     *
     * @default -
     */
    children?: ReactNode;
    /**
     * Specifies an additional CSS class name for the empty-state element.
     *
     * @default -
     */
    className?: string;
}

type ITreeViewEmptyStateProps = TreeViewEmptyStateProps & HTMLAttributes<HTMLDivElement>;

export const TreeViewEmptyState: FC<ITreeViewEmptyStateProps> = memo((props: ITreeViewEmptyStateProps) => {
    const { children, className, ...restProps } = props;

    const emptyClassName: string = useMemo((): string => {
        return [
            TREE_VIEW_CLASSES.EMPTY_STATE,
            className
        ].filter(Boolean).join(' ');
    }, [className]);

    if (!children) {
        return null;
    }

    return (
        <div className={emptyClassName} role="status" aria-live="polite" {...restProps}>
            {children}
        </div>
    );
});

TreeViewEmptyState.displayName = 'TreeViewEmptyState';
