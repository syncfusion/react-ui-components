import { FC, HTMLAttributes, memo, ReactNode, useMemo } from 'react';
import { Spinner } from '@syncfusion/react-popups';
import { TREE_VIEW_CLASSES } from '../../common/constants';

/**
 * `TreeviewLoadIcon` is a semantic container for a row's loading indicator. Provides consistent styling and structure for displaying a busy/pending affordance within the `TreeviewLoadIcon` component. When no children are supplied, defaults to a spinner shown while a node's children are being fetched from a remote data source.
 *
 * ```tsx
 * import { TreeView, TreeViewNodes, TreeViewNode, TreeViewItemLabel, TreeviewLoadIcon } from '@syncfusion/react-navigations';
 * import { SaturationIcon } from '@syncfusion/react-icons';
 *
 * const data = [
 *     { id: '1', label: 'Documents' }
 * ];
 * const fields = { id: 'id', label: 'label' };
 *
 * export default function App() {
 *     return (
 *         <TreeView dataSource={data} fields={fields}>
 *             <TreeViewNodes>
 *                 {() => (
 *                     <TreeViewNode>
 *                         <TreeviewLoadIcon>
 *                             <SaturationIcon />
 *                         </TreeviewLoadIcon>
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
export interface TreeviewLoadIconProps {
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

type ITreeviewLoadIconProps = TreeviewLoadIconProps & HTMLAttributes<HTMLSpanElement>;

export const TreeviewLoadIcon: FC<ITreeviewLoadIconProps> = memo((props: ITreeviewLoadIconProps) => {
    const { children, className, ...restProps } = props;

    const wrapperClassName: string = useMemo((): string => {
        return [
            TREE_VIEW_CLASSES.LOADING_INDICATOR,
            TREE_VIEW_CLASSES.CONTENT_CENTER,
            className
        ].filter(Boolean).join(' ');
    }, [className]);

    const renderedChildren: ReactNode = useMemo((): ReactNode => {
        if (children === undefined || children === null) {
            return <Spinner size={'1em'} visible />;
        }
        return children;
    }, [children]);

    return (
        <span className={wrapperClassName} {...restProps}>
            {renderedChildren}
        </span>
    );
});

TreeviewLoadIcon.displayName = 'TreeviewLoadIcon';
