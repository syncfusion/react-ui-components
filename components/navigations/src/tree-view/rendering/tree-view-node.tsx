import { memo, useCallback, useMemo, MouseEvent, KeyboardEvent, ReactNode, CSSProperties, AriaAttributes } from 'react';
import { useProviderContext, useRippleEffect } from '@syncfusion/react-base';
import { CheckState, SelectionMode } from '../types';
import { TREE_VIEW_CLASSES } from '../../common/constants';
import { useTreeViewContext } from '../tree-view-context';
import { buildAriaAttributes } from '../a11y/aria-attrs';
import { getSiblingSetSize, getSiblingPosInset } from '../state/selectors';
import { useTreeViewItemContext, TreeViewItemContextValue } from '../tree-view-item-context';
import { NormalizedTreeNode } from '../internal-types';

/**
 * `TreeViewNode` is a semantic container for a single tree-view node row. Provides consistent styling and structure for displaying an interactive row within the `TreeViewNode` component.
 *
 * ```tsx
 * import { TreeView, TreeViewNodes, TreeViewNode, TreeViewItemLabel } from '@syncfusion/react-navigations';
 *
 * const data = [{ id: '1', label: 'Documents' }];
 * const fields = { id: 'id', label: 'label' };
 *
 * export default function App() {
 *     return (
 *         <TreeView dataSource={data} fields={fields}>
 *             <TreeViewNodes>
 *                 {(ctx) => (
 *                     <TreeViewNode className="my-row">
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
export interface TreeViewNodeProps {
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

export const TreeViewNode: (props: TreeViewNodeProps) => ReactNode = memo((props: TreeViewNodeProps): ReactNode => {
    const { children, className } = props;

    const ctx: TreeViewItemContextValue = useTreeViewItemContext();
    const {
        state,
        nodeMap,
        childIndex,
        checkStateMap,
        selectionMode: ctxSelectionMode,
        onNodeClick,
        onItemDoubleClick,
        onKeyDown,
        onFocus,
        registerNode,
        fullRowSelect
    } = useTreeViewContext();
    const { ripple } = useProviderContext();
    const { Ripple, rippleMouseDown } = useRippleEffect(ripple);

    const node: NormalizedTreeNode = ctx.node;
    const computedIsFocusable: boolean = ctx.isFocusable ?? false;

    const setRowRef: (el: HTMLLIElement | null) => void = useCallback((el: HTMLLIElement | null): void => {
        registerNode(node.id, el);
    }, [registerNode, node.id]);

    const setSize: number = getSiblingSetSize(nodeMap, childIndex, node.id);
    const posInset: number = getSiblingPosInset(nodeMap, childIndex, node.id);
    const isExpanded: boolean = state.expandedIds.has(node.id);
    const isSelected: boolean = state.selectedIds.has(node.id);
    const checkState: CheckState = checkStateMap.get(node.id) ?? 'Unchecked';
    const isEditing: boolean = state.editingId === node.id;
    const isLoading: boolean = state.loadingChildIds.has(node.id);
    const isDisabled: boolean = node.isDisabled;
    const isLeaf: boolean = node.isLeaf;
    const selectionMode: SelectionMode = ctxSelectionMode || 'Single';
    const multiple: boolean = selectionMode === 'Multiple';

    const handleRipple: (e: MouseEvent<HTMLElement>) => void = useCallback((e: MouseEvent<HTMLElement>): void => {
        if (ripple) { rippleMouseDown(e); }
    }, [ripple, rippleMouseDown]);

    const onContentClick: (e: MouseEvent<HTMLElement>) => void = useCallback((e: MouseEvent<HTMLElement>): void => {
        onNodeClick(node, e);
    }, [onNodeClick, node]);

    const onRowClick: (e: MouseEvent<HTMLLIElement>) => void = useCallback((e: MouseEvent<HTMLLIElement>): void => {
        onNodeClick(node, e);
    }, [onNodeClick, node]);

    const onRowRippleMouseDown: (e: MouseEvent<HTMLLIElement>) => void = useCallback((e: MouseEvent<HTMLLIElement>): void => {
        if (ripple) { rippleMouseDown(e); }
    }, [ripple, rippleMouseDown]);

    const aria: AriaAttributes = useMemo((): AriaAttributes => buildAriaAttributes(node, state, {
        selectionMode: selectionMode,
        siblingSetSize: setSize,
        siblingPosInset: posInset,
        focusedId: state.focusedId,
        multiple: multiple,
        isFocusable: computedIsFocusable,
        checkStateMap: checkStateMap
    }), [node, state, selectionMode, setSize, posInset, state.focusedId, multiple, computedIsFocusable, checkStateMap]);

    const onRowDoubleClick: (e: MouseEvent<HTMLLIElement>) => void = useCallback((e: MouseEvent<HTMLLIElement>): void => {
        if (onItemDoubleClick) {
            onItemDoubleClick(node, e);
        }
    }, [onItemDoubleClick, node]);

    const onContentDoubleClick: (e: MouseEvent<HTMLDivElement>) => void = useCallback((e: MouseEvent<HTMLDivElement>): void => {
        if (onItemDoubleClick) {
            onItemDoubleClick(node, e);
        }
    }, [onItemDoubleClick, node]);

    const onItemKeyDown: (e: KeyboardEvent<HTMLLIElement>) => void = useCallback((e: KeyboardEvent<HTMLLIElement>): void => {
        if (state.focusedId !== node.id) {
            onFocus(node.id);
        }
        onKeyDown(e, node.id);
    }, [state.focusedId, node.id, onFocus, onKeyDown]);

    const stateClassName: string = useMemo((): string => [
        TREE_VIEW_CLASSES.ITEM,
        fullRowSelect ? TREE_VIEW_CLASSES.ROW_SURFACE : '',
        isExpanded ? TREE_VIEW_CLASSES.EXPANDED : TREE_VIEW_CLASSES.COLLAPSED,
        isSelected && selectionMode !== 'Checkbox' ? TREE_VIEW_CLASSES.SELECTED : '',
        checkState === 'Indeterminate' ? TREE_VIEW_CLASSES.PARTIALLY_SELECTED : '',
        isDisabled ? TREE_VIEW_CLASSES.DISABLED : '',
        isLeaf ? TREE_VIEW_CLASSES.LEAF : '',
        isLoading ? TREE_VIEW_CLASSES.LOADING : '',
        isEditing ? TREE_VIEW_CLASSES.EDITING : '',
        state.focusedId === node.id ? TREE_VIEW_CLASSES.FOCUSED : '',
        isLeaf && node.parentId === null ? TREE_VIEW_CLASSES.ROOT_LEAF_ITEM : ''
    ].filter(Boolean).join(' '), [fullRowSelect, isExpanded, isSelected, selectionMode, checkState, isDisabled, isLeaf, isLoading, isEditing, state.focusedId, node.id]);

    const finalClassName: string = useMemo((): string =>
        className ? `${stateClassName} ${className}` : stateClassName,
                                           [className, stateClassName]);

    const rowStyle: CSSProperties = useMemo((): CSSProperties =>
        ({ '--tree-level': node.depth } as CSSProperties),
                                            [node.depth]);

    const wrapperClassName: string = useMemo((): string => [
        TREE_VIEW_CLASSES.ITEM_CONTENT,
        TREE_VIEW_CLASSES.CONTENT_CENTER,
        fullRowSelect ? '' : TREE_VIEW_CLASSES.ROW_SURFACE
    ].filter(Boolean).join(' '), [fullRowSelect]);

    const rowInteractionProps: {
        onClick?: (e: MouseEvent<HTMLLIElement>) => void;
        onMouseDown?: (e: MouseEvent<HTMLLIElement>) => void;
        onDoubleClick?: (e: MouseEvent<HTMLLIElement>) => void;
    } = useMemo(() =>
        fullRowSelect
            ? { onClick: onRowClick, onMouseDown: onRowRippleMouseDown, onDoubleClick: onRowDoubleClick }
            : {}, [fullRowSelect, onRowClick, onRowRippleMouseDown, onRowDoubleClick]);

    const wrapperInteractionProps: {
        onClick?: (e: MouseEvent<HTMLDivElement>) => void;
        onMouseDown?: (e: MouseEvent<HTMLDivElement>) => void;
        onDoubleClick?: (e: MouseEvent<HTMLDivElement>) => void;
    } = useMemo(() =>
        fullRowSelect
            ? {}
            : { onClick: onContentClick, onMouseDown: handleRipple, onDoubleClick: onContentDoubleClick },
                [fullRowSelect, onContentClick, handleRipple, onContentDoubleClick]);

    return (
        <li
            ref={setRowRef}
            className={finalClassName}
            data-id={String(node.id)}
            style={rowStyle}
            {...(node.tooltip ? { title: node.tooltip } : {})}
            {...aria}
            onKeyDown={onItemKeyDown}
            {...rowInteractionProps}
        >
            <div className={wrapperClassName} {...wrapperInteractionProps}>
                {children}
                {ripple ? <Ripple /> : null}
            </div>
        </li>
    );
});
