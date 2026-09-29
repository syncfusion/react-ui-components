import { forwardRef, useImperativeHandle, useMemo, useCallback, useRef, useEffect, MouseEvent as ReactMouseEvent, KeyboardEvent as ReactKeyboardEvent, SyntheticEvent, HTMLAttributes, RefObject, ForwardRefExoticComponent, Ref, RefAttributes, Children, ReactNode, isValidElement } from 'react';
import { preRender, SortOrder, useProviderContext } from '@syncfusion/react-base';
import { TreeViewProps, TreeNodeId, CheckState } from './types';
import { TreeViewContextValue } from './tree-view-context';
import { TREE_VIEW_CLASSES, COMMON_CLASSES } from '../common/constants';
import { useTreeReducer } from './state/use-tree-reducer';
import { deriveCheckStateMap } from './state/selectors';
import { useTreeProjection } from './projection/flatten-tree';
import { useTreeKeyboard } from './state/use-tree-keyboard';
import { useTreeEdit, UseTreeEditResult } from './state/use-tree-edit';
import { useTreeSelection, useSelectAll, useSelectRange } from './state/use-tree-selection';
import { TreeViewProvider } from './tree-view-context';
import { TreeNodeList } from './rendering/tree-node-list';
import { TreeViewEmptyState } from './tree-view-empty-state';
import { TreeViewNodes } from './rendering/tree-view-nodes';
import { NormalizedTreeNode } from './internal-types';

/**
 * Interface for TreeView component instance.
 */
export interface ITreeView extends TreeViewProps {
    /**
     * Expands every loaded node whose ancestors are already present in the data source.
     *
     * @param {Array<string|number>} ids - Optional subset of root ids to expand; when omitted, all ids are expanded.
     * @public
     * @returns {void}
     */
    expandAll(ids?: Array<string|number>): void;

    /**
     * Collapses every currently-expanded node.
     *
     * @param {Array<string|number>} ids - Optional subset of root ids to collapse; when omitted, every expanded id is collapsed.
     * @public
     * @returns {void}
     */
    collapseAll(ids?: Array<string|number>): void;

    /**
     * Specifies the DOM element of the TreeView.
     *
     * @private
     * @default null
     */
    element: HTMLUListElement | null;
}

type TreeViewComponentProps = TreeViewProps & Omit<HTMLAttributes<HTMLUListElement>, 'onChange' | 'onKeyPress' | 'onKeyDown'>;

/**
 * A tree component that renders a navigable list of nodes with selection, expansion, and keyboard interaction.
 * Supports controlled and uncontrolled modes for expanded and selected node IDs.
 *
 * ```typescript
 * import { TreeView } from "@syncfusion/react-navigations";
 *
 * interface Node { id: string; label: string; parentId?: string | null; }
 *
 * export default function App() {
 *     const dataSource: Node[] = [
 *         { id: '1', label: 'Documents' },
 *         { id: '2', label: 'Reports', parentId: '1' },
 *         { id: '3', label: 'Invoices', parentId: '1' },
 *         { id: '4', label: 'Downloads' },
 *         { id: '5', label: 'Pictures' }
 *     ];
 *     return (
 *         <TreeView dataSource={dataSource} defaultExpandedIds={['1']} />
 *     );
 * }
 * ```
 */
export const TreeView: ForwardRefExoticComponent<TreeViewComponentProps & RefAttributes<ITreeView>> =
    forwardRef<ITreeView, TreeViewComponentProps>((props: TreeViewComponentProps, ref: Ref<ITreeView>) => {
        const {
            dataSource,
            fields,
            sortOrder = SortOrder.None,
            selectionMode = 'Single',
            expandOn = 'None',
            query,
            defaultExpandedIds,
            expandedIds,
            selectedIds,
            defaultSelectedIds,
            autoCheck = false,
            checkDisabledChildren = false,
            checkOnClick = false,
            editable = false,
            disabled = false,
            textWrap = true,
            fullRowNavigable = false,
            fullRowSelect = true,
            className,
            onItemClick,
            onKeyPress,
            onExpandedChange,
            onSelectedChange,
            onError,
            onNodeEdit,
            children,
            ...rest
        } = props;

        const { dir } = useProviderContext();

        const nodeElementsRef: RefObject<Map<TreeNodeId, HTMLLIElement>> = useRef<Map<TreeNodeId, HTMLLIElement>>(new Map());
        const rootRef: RefObject<HTMLUListElement | null> = useRef<HTMLUListElement | null>(null);
        const lastFocusedIdRef: RefObject<TreeNodeId | null> = useRef<TreeNodeId | null>(null);

        const {
            state,
            dispatch,
            expandAll,
            collapseAll,
            ensureChildren,
            updateNodeLabel,
            nodeMap,
            childIndex,
            isRemote
        } = useTreeReducer({dataSource, fields, sortOrder, query, onError, selectionMode, autoCheck, checkDisabledChildren,
            expandedIds, defaultExpandedIds, selectedIds,  defaultSelectedIds, onExpandedChange, onSelectedChange});

        const checkStateMap: Map<TreeNodeId, CheckState> = useMemo((): Map<TreeNodeId, CheckState> => {
            if (!autoCheck) { return new Map(); }
            return deriveCheckStateMap(
                state.selectedIds, nodeMap, childIndex, checkDisabledChildren
            );
        }, [state.selectedIds, nodeMap, childIndex, checkDisabledChildren]);

        const visibleNodes: NormalizedTreeNode[] = useTreeProjection(nodeMap, childIndex, state.expandedIds);

        const { rowTemplate, EmptyContent } = useMemo(() => {
            let TreeContent: ReactNode | null = null;
            let EmptyContent: ReactNode | null = null;
            Children.toArray(children).forEach((child: ReactNode) => {
                if (isValidElement(child)) {
                    if (child.type === TreeViewNodes) {
                        TreeContent = child;
                        return;
                    }
                    if (child.type === TreeViewEmptyState) {
                        EmptyContent = child;
                        return;
                    }
                }
            });
            return { rowTemplate: TreeContent, EmptyContent };
        }, [children]);

        useEffect(() => {
            preRender('treeview');
        }, []);

        useEffect(() => {
            if (state.focusedId !== null) {
                lastFocusedIdRef.current = state.focusedId;
            }
        }, [state.focusedId]);

        const visibleIds: TreeNodeId[] = useMemo((): TreeNodeId[] => visibleNodes.map((n: NormalizedTreeNode) => n.id), [visibleNodes]);

        const selectAll: (visibleIds: ReadonlyArray<TreeNodeId>, event?: SyntheticEvent) => void = useSelectAll(selectionMode, dispatch);

        const selectRange: (fromId: TreeNodeId | null, toId: TreeNodeId, visibleIds: ReadonlyArray<TreeNodeId>,
            event?: SyntheticEvent) => void = useSelectRange(selectionMode, dispatch);

        const onSelectRangeFromKeyboard: (fromId: TreeNodeId | null, toId: TreeNodeId, visibleIds: ReadonlyArray<TreeNodeId>,
            event?: SyntheticEvent) => void = useCallback((fromId: TreeNodeId | null, toId: TreeNodeId,
                                                           visibleIds: ReadonlyArray<TreeNodeId>, event?: SyntheticEvent): void => {
            selectRange(fromId, toId, visibleIds, event);
        }, [selectRange]);

        const selectHandler: (id: TreeNodeId, e: ReactMouseEvent | ReactKeyboardEvent) => void =
            useTreeSelection(selectionMode, checkOnClick, state.selectedIds, state.rangeAnchorId, selectRange, dispatch, visibleIds);

        const keyboard: ReturnType<typeof useTreeKeyboard> = useTreeKeyboard(
            {
                nodeMap,
                childIndex,
                expandedIds: state.expandedIds,
                visibleIds,
                dispatch,
                editingId: state.editingId,
                selectedIds: state.selectedIds,
                rangeAnchorId: state.rangeAnchorId,
                options: {
                    onSelect: selectHandler,
                    onSelectAll: selectAll,
                    onSelectRange: onSelectRangeFromKeyboard,
                    selectionMode: selectionMode,
                    editable: editable
                }
            });

        useImperativeHandle(ref, (): ITreeView => ({
            dataSource,
            fields,
            sortOrder,
            selectionMode,
            expandOn,
            defaultExpandedIds,
            expandedIds,
            selectedIds,
            defaultSelectedIds,
            query,
            autoCheck,
            checkDisabledChildren,
            checkOnClick,
            editable,
            textWrap,
            fullRowNavigable,
            fullRowSelect,
            expandAll,
            collapseAll,
            element: rootRef.current
        }), [dataSource, fields, sortOrder, selectionMode, expandOn, defaultExpandedIds, expandedIds, selectedIds, defaultSelectedIds,
            expandAll, collapseAll]);

        const onFocusHandler: (id: TreeNodeId | null, event?: SyntheticEvent) => void = useCallback((id: TreeNodeId | null,
                                                                                                     event?: SyntheticEvent): void => {
            if (state.focusedId === id) { return; }
            dispatch({ type: 'SET_FOCUSED', id: id }, event);
        }, [state.focusedId, dispatch]);

        const focusNodeById: (id: TreeNodeId | null) => void = useCallback((id: TreeNodeId | null): void => {
            if (id === null) { return; }
            const el: HTMLLIElement | undefined = nodeElementsRef.current.get(id);
            if (el && document.activeElement !== el) {
                el.focus();
            }
        }, []);

        const focusEditedRow: (id: TreeNodeId) => void = useCallback((id: TreeNodeId): void => {
            if (state.focusedId !== id) {
                dispatch({ type: 'SET_FOCUSED', id: id });
            }
            focusNodeById(id);
        }, [state.focusedId, dispatch, focusNodeById]);

        const editApi: UseTreeEditResult = useTreeEdit({
            nodeMap: nodeMap,
            editingId: state.editingId ,
            dispatch: dispatch,
            props: props,
            focusRow: focusEditedRow,
            isRemote: isRemote,
            updateNodeLabel: updateNodeLabel
        });

        useEffect((): void => {
            if (!ensureChildren) { return; }
            state.expandedIds.forEach((id: TreeNodeId): void => {
                if (childIndex.has(id)) { return; }
                const node: NormalizedTreeNode | undefined = nodeMap.get(id);
                if (node && (node.hasChildren || node.isLeaf === false)) {
                    ensureChildren(id);
                }
            });
        }, [state.expandedIds, childIndex, nodeMap]);

        const onItemClickHandler: (node: NormalizedTreeNode, e: ReactMouseEvent | ReactKeyboardEvent) => void = useCallback((
            node: NormalizedTreeNode, e: ReactMouseEvent | ReactKeyboardEvent): void => {
            if (node.isDisabled) {
                if (onItemClick) {
                    onItemClick({
                        item: node.raw,
                        id: node.id,
                        event: e
                    });
                }
                return;
            }
            if (state.focusedId !== node.id) {
                dispatch({ type: 'SET_FOCUSED', id: node.id }, e);
                focusNodeById(node.id);
            }
            if (expandOn === 'Click') {
                if (state.expandedIds.has(node.id)) {
                    dispatch({ type: 'COLLAPSE_NODE', id: node.id }, e);
                } else if (!node.isLeaf) {
                    dispatch({ type: 'EXPAND_NODE', id: node.id }, e);
                }
            }
            selectHandler(node.id, e);
            if (onItemClick) {
                onItemClick({
                    item: node.raw,
                    id: node.id,
                    event: e
                });
            }
        }, [selectHandler, state.expandedIds, state.focusedId, dispatch, onItemClick, expandOn, focusNodeById]);

        const onItemDoubleClickHandler: (node: NormalizedTreeNode, e: ReactMouseEvent) => void = useCallback((
            node: NormalizedTreeNode, e: ReactMouseEvent): void => {
            if (editable && !node.isDisabled) {
                editApi.beginEdit(node.id);
                return;
            }
            if (expandOn !== 'DoubleClick' || node.isDisabled || node.isLeaf) { return; }
            if (state.expandedIds.has(node.id)) {
                dispatch({ type: 'COLLAPSE_NODE', id: node.id }, e);
            } else {
                dispatch({ type: 'EXPAND_NODE', id: node.id }, e);
            }
        }, [expandOn, state.expandedIds, dispatch, editable, editApi]);

        const onItemToggleClickHandler: (node: NormalizedTreeNode, e: ReactMouseEvent) => void = useCallback((
            node: NormalizedTreeNode, e: ReactMouseEvent): void => {
            if (node.isDisabled) { return; }
            if (state.expandedIds.has(node.id)) {
                dispatch({ type: 'COLLAPSE_NODE', id: node.id }, e);
            } else {
                dispatch({ type: 'EXPAND_NODE', id: node.id }, e);
            }
        }, [state.expandedIds, dispatch]);

        const registerNode: (id: TreeNodeId, el: HTMLLIElement | null) => void =
            useCallback((id: TreeNodeId, el: HTMLLIElement | null): void => {
                if (el) {
                    nodeElementsRef.current.set(id, el);
                } else {
                    nodeElementsRef.current.delete(id);
                }
            }, []);

        const onItemKeyDown: (e: ReactKeyboardEvent<HTMLLIElement>, nodeId: TreeNodeId) => void = useCallback((
            e: ReactKeyboardEvent<HTMLLIElement>, nodeId: TreeNodeId): void => {
            const newFocusedId: TreeNodeId | null = keyboard.onKeyDown(e, nodeId);
            if (newFocusedId !== null) {
                focusNodeById(newFocusedId);
            }
            if (onKeyPress) {
                const node: NormalizedTreeNode | undefined = nodeMap.get(nodeId);
                if (node) {
                    onKeyPress({
                        item: node.raw,
                        id: node.id,
                        event: e
                    });
                }
            }
        }, [keyboard, onKeyPress, nodeMap, focusNodeById]);

        const toggleCheck: (id: TreeNodeId, e: SyntheticEvent) => void = useCallback(
            (id: TreeNodeId, e?: SyntheticEvent): void => {
                if (nodeMap.get(id)?.isDisabled) { return; }
                dispatch({ type: 'TOGGLE_CHECK', id: id }, e);
            }, [dispatch, nodeMap]);

        const ctxValue: TreeViewContextValue = useMemo((): TreeViewContextValue => ({
            dataSource: dataSource,
            fields: fields,
            nodeMap: nodeMap,
            childIndex: childIndex,
            state: state,
            dispatch: dispatch,
            selectionMode: selectionMode,
            expandOn: expandOn,
            autoCheck: autoCheck,
            checkDisabledChildren: checkDisabledChildren,
            checkOnClick: checkOnClick,
            editable: editable,
            disabled: disabled,
            onNodeEdit: onNodeEdit,
            textWrap: textWrap,
            fullRowNavigable: fullRowNavigable,
            fullRowSelect: fullRowSelect,
            editApi: editApi,
            checkStateMap: checkStateMap,
            toggleCheck: toggleCheck,
            expandAll: expandAll,
            collapseAll: collapseAll,
            onNodeClick: onItemClickHandler,
            onItemDoubleClick: onItemDoubleClickHandler,
            onItemToggleClick: onItemToggleClickHandler,
            onKeyDown: onItemKeyDown,
            onFocus: onFocusHandler,
            registerNode: registerNode,
            onExpandedChange,
            onSelectedChange,
            rowTemplate: rowTemplate
        }), [dataSource, fields, nodeMap, childIndex, state, dispatch, selectionMode, expandOn, autoCheck,
            checkDisabledChildren, checkOnClick, editable, onNodeEdit, editApi, checkStateMap, toggleCheck, expandAll, collapseAll,
            onItemClickHandler, onItemDoubleClickHandler, onItemToggleClickHandler, onItemKeyDown, onFocusHandler,
            registerNode, onExpandedChange, onSelectedChange, rowTemplate, textWrap, fullRowNavigable, fullRowSelect]);

        const onRootFocus: (e: React.FocusEvent<HTMLUListElement>) => void =
            useCallback((e: React.FocusEvent<HTMLUListElement>): void => {
                if (state.focusedId !== null) { return; }
                const remembered: TreeNodeId | null = lastFocusedIdRef.current;
                if (remembered !== null) {
                    const rememberedNode: NormalizedTreeNode | undefined = nodeMap.get(remembered);
                    if (rememberedNode && !rememberedNode.isDisabled) {
                        dispatch({ type: 'SET_FOCUSED', id: rememberedNode.id }, e);
                        focusNodeById(rememberedNode.id);
                        return;
                    }
                }
                const target: HTMLElement = e.target as HTMLElement;
                const li: HTMLElement | null = target.closest('.' + TREE_VIEW_CLASSES.ITEM);
                if (li === null) { return; }
                const rawId: string | undefined = li.dataset.id;
                if (rawId === undefined || rawId === '') { return; }
                let node: NormalizedTreeNode | undefined = nodeMap.get(rawId);
                if (node === undefined) {
                    const numericId: number = Number(rawId);
                    if (Number.isFinite(numericId) && String(numericId) === rawId) {
                        node = nodeMap.get(numericId);
                    }
                }
                if (node === undefined || node.isDisabled) { return; }
                dispatch({ type: 'SET_FOCUSED', id: node.id }, e);
                focusNodeById(node.id);
            }, [state.focusedId, dispatch, nodeMap, focusNodeById]);

        const onRootBlur: (e: React.FocusEvent<HTMLUListElement>) => void =
            useCallback((e: React.FocusEvent<HTMLUListElement>): void => {
                const next: EventTarget | null = e.relatedTarget;
                if (next instanceof Node && e.currentTarget.contains(next)) { return; }
                if (state.focusedId !== null) {
                    lastFocusedIdRef.current = state.focusedId;
                }
                dispatch({ type: 'SET_FOCUSED', id: null }, e);
            }, [state.focusedId, dispatch]);

        const rootClassName: string = useMemo((): string => {
            return [
                TREE_VIEW_CLASSES.ROOT,
                COMMON_CLASSES.CONTROL,
                dir === 'rtl' ? COMMON_CLASSES.RTL : '',
                disabled ? COMMON_CLASSES.DISABLED : ''
            ].filter(Boolean).join(' ');
        }, [dir, className, disabled]);

        const multiselectable: boolean | undefined = useMemo(() =>
            selectionMode === 'Multiple' || selectionMode === 'Checkbox' || undefined, [selectionMode]);

        return (
            <TreeViewProvider value={ctxValue} >
                <ul
                    {...rest}
                    ref={rootRef}
                    role="tree"
                    aria-multiselectable={multiselectable}
                    tabIndex={-1}
                    onFocus={onRootFocus}
                    onBlur={onRootBlur}
                    className={rootClassName}
                >
                    {visibleNodes.length === 0 ? null : <TreeNodeList nodes={visibleNodes} />}
                </ul>
                {visibleNodes.length === 0 ? EmptyContent : null}
            </TreeViewProvider>
        );
    });

TreeView.displayName = 'TreeView';
