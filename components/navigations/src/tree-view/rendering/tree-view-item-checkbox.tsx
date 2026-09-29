import { FC, memo, useCallback, SyntheticEvent, useMemo, ReactNode, HTMLAttributes } from 'react';
import { Checkbox } from '@syncfusion/react-buttons';
import { TREE_VIEW_CLASSES } from '../../common/constants';
import { TreeViewItemContextValue, useTreeViewItemContext } from '../tree-view-item-context';
import { useTreeViewContext } from '../tree-view-context';

/**
 * `TreeViewItemCheckbox` is a semantic container for a row's checkbox in checkbox-selection mode. Provides consistent styling and structure for displaying and toggling a node's check state within the `TreeViewItemCheckbox` component. When no children are supplied, defaults to a `<CheckBox/>` bound to the row's check state.
 *
 * ```tsx
 * import { TreeView, TreeViewNodes, TreeViewNode, TreeViewItemToggle, TreeViewItemCheckbox, TreeViewItemIcon, TreeViewItemLabel } from '@syncfusion/react-navigations';
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
 *                 {() => (
 *                     <TreeViewNode>
 *                         <TreeViewItemToggle />
 *                         <TreeViewItemCheckbox />
 *                         <TreeViewItemIcon />
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
export interface TreeViewItemCheckboxProps {
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

type ITreeViewItemCheckboxProps = TreeViewItemCheckboxProps & HTMLAttributes<HTMLSpanElement>;

export const TreeViewItemCheckbox: FC<ITreeViewItemCheckboxProps> = memo((props: ITreeViewItemCheckboxProps) => {
    const { children, className, ...restProps } = props;
    const ctx: TreeViewItemContextValue = useTreeViewItemContext();
    const { selectionMode, autoCheck } = useTreeViewContext();

    const onCheckClick: (e: SyntheticEvent) => void = useCallback((e: SyntheticEvent): void => {
        e.stopPropagation();
        ctx.toggleCheck(e);
    }, [ctx]);

    const wrapperClassName: string = useMemo((): string => {
        return [
            TREE_VIEW_CLASSES.ITEM_CHECKBOX,
            TREE_VIEW_CLASSES.CONTENT_CENTER,
            className
        ].filter(Boolean).join(' ');
    }, [className]);

    const {checked, indeterminate} = useMemo((): { checked: boolean; indeterminate: boolean } => ({
        checked: ctx.checkState === 'Checked' || ctx.selected,
        indeterminate: autoCheck && ctx.checkState === 'Indeterminate'
    }), [ctx.checkState, ctx.selected, autoCheck]);

    if (selectionMode !== 'Checkbox') {
        return null;
    }

    if (children !== undefined && children !== null) {
        return (
            <span
                className={wrapperClassName}
                onClick={onCheckClick}
                {...restProps }
            >
                {children}
            </span>
        );
    }

    return (
        <span
            className={wrapperClassName}
            onClick={onCheckClick}
            {...restProps }
        >
            <Checkbox
                checked={checked}
                indeterminate={indeterminate}
                disabled={ctx.disabled}
                readOnly
                tabIndex={-1}
                type='hidden'
            />
        </span>
    );
});

TreeViewItemCheckbox.displayName = 'TreeViewItemCheckbox';
