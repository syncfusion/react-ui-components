import { useCallback, useRef, KeyboardEvent as ReactKeyboardEvent, SyntheticEvent, RefObject } from 'react';
import { TreeNodeId, SelectionMode } from '../types';
import { TREE_VIEW_KEYS, TYPE_AHEAD_DEBOUNCE_MS } from '../constants';
import { TreeNodeMap, ChildIndexMap, TreeViewDispatch, NormalizedTreeNode } from '../internal-types';

interface UseTreeKeyboardResult {
    onKeyDown: (e: ReactKeyboardEvent<HTMLLIElement>, nodeId: TreeNodeId) => TreeNodeId | null;
    setFocused: (id: TreeNodeId | null) => void;
}

interface UseTreeKeyboardOptions {
    onExpand?: (id: TreeNodeId, event?: SyntheticEvent) => void;
    onCollapse?: (id: TreeNodeId, event?: SyntheticEvent) => void;
    onSelect?: (id: TreeNodeId, event: ReactKeyboardEvent) => void;
    onSelectAll?: (visibleIds: ReadonlyArray<TreeNodeId>, event?: SyntheticEvent) => void;
    onSelectRange?: (fromId: TreeNodeId | null, toId: TreeNodeId, visibleIds: ReadonlyArray<TreeNodeId>, event?: SyntheticEvent) => void;
    selectionMode?: SelectionMode;
    editable?: boolean;
}

interface UseTreeKeyboardHookArgs {
    nodeMap: TreeNodeMap;
    childIndex: ChildIndexMap;
    expandedIds: ReadonlySet<TreeNodeId>;
    visibleIds: ReadonlyArray<TreeNodeId>;
    dispatch: TreeViewDispatch;
    options?: UseTreeKeyboardOptions;
    editingId?: TreeNodeId | null;
    selectedIds?: ReadonlySet<TreeNodeId>;
    rangeAnchorId?: TreeNodeId | null;
}

export const isNodeDisabled: (nodeMap: TreeNodeMap, id: TreeNodeId | null) => boolean = (nodeMap: TreeNodeMap, id: TreeNodeId | null):
boolean => {
    if (id === null) { return false; }
    const node: NormalizedTreeNode | undefined = nodeMap.get(id);
    if (!node) { return false; }
    return Boolean(node.isDisabled);
};

export const getNodeLabel: (nodeMap: TreeNodeMap, id: TreeNodeId | null) => string =
    (nodeMap: TreeNodeMap, id: TreeNodeId | null): string => {
        if (id === null) { return ''; }
        const node: NormalizedTreeNode | undefined = nodeMap.get(id);
        if (!node) { return ''; }
        return String(node.label || '').toLowerCase();
    };

export const getNodeParentId: (nodeMap: TreeNodeMap, id: TreeNodeId | null) => TreeNodeId | null =
    (nodeMap: TreeNodeMap, id: TreeNodeId | null): TreeNodeId | null => {
        if (id === null) { return null; }
        const node: NormalizedTreeNode | undefined = nodeMap.get(id);
        return node ? (node.parentId ?? null) : null;
    };

export const findFirstEnabled: (nodeMap: TreeNodeMap, visibleIds: ReadonlyArray<TreeNodeId>, startIdx: number, step: 1 | -1) =>
TreeNodeId | null =
    (nodeMap: TreeNodeMap, visibleIds: ReadonlyArray<TreeNodeId>, startIdx: number, step: 1 | -1): TreeNodeId | null => {
        const length: number = visibleIds.length;
        if (length === 0) { return null; }
        let i: number = startIdx;
        if (step === 1) {
            for (; i < length; i++) {
                const id: TreeNodeId | undefined = visibleIds[i as number];
                if (id === undefined) { continue; }
                if (!isNodeDisabled(nodeMap, id)) { return id; }
            }
            return null;
        }
        for (; i >= 0; i--) {
            const id: TreeNodeId | undefined = visibleIds[i as number];
            if (id === undefined) { continue; }
            if (!isNodeDisabled(nodeMap, id)) { return id; }
        }
        return null;
    };

export const moveFocus: (nodeMap: TreeNodeMap, currentId: TreeNodeId | null, visibleIds: ReadonlyArray<TreeNodeId>,
    direction: 'next' | 'prev' | 'first' | 'last') => TreeNodeId | null =
    (nodeMap: TreeNodeMap, currentId: TreeNodeId | null, visibleIds: ReadonlyArray<TreeNodeId>, direction: 'next' | 'prev' | 'first' | 'last'): TreeNodeId | null => {
        if (visibleIds.length === 0) { return null; }
        if (currentId === null) {
            switch (direction) {
            case 'last':
                return findFirstEnabled(nodeMap, visibleIds, visibleIds.length - 1, -1);
            case 'first':
                return findFirstEnabled(nodeMap, visibleIds, 0, 1);
            default:
                return findFirstEnabled(nodeMap, visibleIds, 0, 1);
            }
        }
        const idx: number = visibleIds.indexOf(currentId);
        if (idx === -1) {
            return findFirstEnabled(nodeMap, visibleIds, 0, 1);
        }
        switch (direction) {
        case 'next': {
            const next: TreeNodeId | null = findFirstEnabled(nodeMap, visibleIds, idx + 1, 1);
            return next !== null ? next : currentId;
        }
        case 'prev': {
            const prev: TreeNodeId | null = findFirstEnabled(nodeMap, visibleIds, idx - 1, -1);
            return prev !== null ? prev : currentId;
        }
        case 'first':
            return findFirstEnabled(nodeMap, visibleIds, 0, 1);
        case 'last':
            return findFirstEnabled(nodeMap, visibleIds, visibleIds.length - 1, -1);
        default:
            return currentId;
        }
    };

export const buildAriaKeyboardAction: (key: string) => string = (key: string): string => {
    switch (key) {
    case TREE_VIEW_KEYS.ARROW_DOWN: return 'NEXT';
    case TREE_VIEW_KEYS.ARROW_UP: return 'PREV';
    case TREE_VIEW_KEYS.ARROW_RIGHT: return 'EXPAND_OR_DESCEND';
    case TREE_VIEW_KEYS.ARROW_LEFT: return 'COLLAPSE_OR_ASCEND';
    case TREE_VIEW_KEYS.HOME: return 'FIRST';
    case TREE_VIEW_KEYS.END: return 'LAST';
    case TREE_VIEW_KEYS.ENTER:
    case TREE_VIEW_KEYS.SPACE: return 'SELECT';
    case TREE_VIEW_KEYS.ASTERISK: return 'EXPAND_SIBLINGS';
    case TREE_VIEW_KEYS.F2: return 'BEGIN_EDIT';
    case TREE_VIEW_KEYS.ESCAPE: return 'CANCEL_EDIT';
    case TREE_VIEW_KEYS.TAB: return 'NOOP';
    default:
        return (key.length === 1) ? 'TYPE_AHEAD' : 'NOOP';
    }
};

export const isCtrlOnly: (e: ReactKeyboardEvent<HTMLLIElement>) => boolean = (e: ReactKeyboardEvent<HTMLLIElement>): boolean => {
    return (e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey;
};

export const buildAriaModifierAction: (key: string, e: ReactKeyboardEvent<HTMLLIElement>) => string | null =
    (key: string, e: ReactKeyboardEvent<HTMLLIElement>): string | null => {
        if ((key === 'a' || key === 'A') && isCtrlOnly(e)) {
            return 'SELECT_ALL';
        }
        return null;
    };

export const useTreeKeyboard: (args: UseTreeKeyboardHookArgs) => UseTreeKeyboardResult =
    (args: UseTreeKeyboardHookArgs): UseTreeKeyboardResult => {
        const {
            nodeMap,
            childIndex,
            expandedIds,
            visibleIds,
            dispatch,
            options = {},
            editingId: editingIdArg = null,
            selectedIds: selectedIdsArg,
            rangeAnchorId: rangeAnchorIdArg
        } = args;
        const typeAheadRef: RefObject<{ buffer: string; lastKeyAt: number }> = useRef({ buffer: '', lastKeyAt: 0 });

        const updateFocused: (id: TreeNodeId | null, event?: SyntheticEvent) => void =
            useCallback((id: TreeNodeId | null, event?: SyntheticEvent) => {
                if (id !== null && isNodeDisabled(nodeMap, id)) { return; }
                dispatch({ type: 'SET_FOCUSED', id: id }, event);
            }, [dispatch, nodeMap]);

        const setFocused: (id: TreeNodeId | null) => void = updateFocused;

        const dispatchVerticalStep: (
            currentId: TreeNodeId | null,
            direction: 'next' | 'prev',
            event: ReactKeyboardEvent<HTMLLIElement>
        ) => TreeNodeId | null = useCallback(
            (currentId: TreeNodeId | null,
             direction: 'next' | 'prev',
             event: ReactKeyboardEvent<HTMLLIElement>): TreeNodeId | null => {
                const movedId: TreeNodeId | null = moveFocus(nodeMap, currentId, visibleIds, direction);
                if (event.shiftKey && options.selectionMode === 'Multiple' && movedId !== null && movedId !== currentId) {
                    const anchor: TreeNodeId | null = rangeAnchorIdArg !== undefined && rangeAnchorIdArg !== null
                        ? rangeAnchorIdArg : currentId;
                    if (options.onSelectRange) {
                        options.onSelectRange(anchor, movedId, visibleIds, event);
                    }
                }
                updateFocused(movedId, event);
                return movedId;
            }, [nodeMap, visibleIds, options, rangeAnchorIdArg, updateFocused]);

        const onKeyDown: (event: ReactKeyboardEvent<HTMLLIElement>, nodeId: TreeNodeId) => TreeNodeId | null = useCallback(
            (event: ReactKeyboardEvent<HTMLLIElement>, nodeId: TreeNodeId): TreeNodeId | null => {
                const key: string = event.key;
                const modifierAction: string | null = buildAriaModifierAction(key, event) || null;
                const action: string = modifierAction !== null ? modifierAction : buildAriaKeyboardAction(key);
                const currentId: TreeNodeId | null = nodeId;
                const isStepwiseNavigationKey: boolean = action === 'NEXT' || action === 'PREV' || action === 'EXPAND_OR_DESCEND' || action === 'COLLAPSE_OR_ASCEND';
                if (isStepwiseNavigationKey && isNodeDisabled(nodeMap, currentId)) {
                    event.preventDefault();
                    return null;
                }

                if (editingIdArg !== null && editingIdArg === currentId) {
                    if (action === 'TYPE_AHEAD' || (action !== 'BEGIN_EDIT' && action !== 'CANCEL_EDIT')) {
                        return null;
                    }
                }

                if (key.length === 1 && /\S/.test(key) && action === 'TYPE_AHEAD') {
                    const now: number = Date.now();
                    if (now - typeAheadRef.current.lastKeyAt > TYPE_AHEAD_DEBOUNCE_MS) {
                        typeAheadRef.current.buffer = '';
                    }
                    typeAheadRef.current.buffer += key.toLowerCase();
                    typeAheadRef.current.lastKeyAt = now;
                    const buffer: string = typeAheadRef.current.buffer;
                    for (let i: number = 0; i < visibleIds.length; i++) {
                        const id: TreeNodeId | undefined = visibleIds[i as number];
                        if (id === undefined) { continue; }
                        if (isNodeDisabled(nodeMap, id)) { continue; }
                        if (getNodeLabel(nodeMap, id).startsWith(buffer)) {
                            updateFocused(id, event);
                            event.preventDefault();
                            return id;
                        }
                    }
                    return null;
                }

                switch (action) {
                case 'NEXT': {
                    event.preventDefault();
                    return dispatchVerticalStep(currentId, 'next', event);
                }
                case 'PREV': {
                    event.preventDefault();
                    return dispatchVerticalStep(currentId, 'prev', event);
                }
                case 'FIRST': {
                    const first: TreeNodeId | null = moveFocus(nodeMap, currentId, visibleIds, 'first');
                    updateFocused(first, event);
                    event.preventDefault();
                    return first;
                }
                case 'LAST': {
                    const last: TreeNodeId | null = moveFocus(nodeMap, currentId, visibleIds, 'last');
                    updateFocused(last, event);
                    event.preventDefault();
                    return last;
                }
                case 'EXPAND_OR_DESCEND': {
                    if (currentId === null) { return null; }
                    if (expandedIds.has(currentId)) {
                        const children: ReadonlyArray<TreeNodeId> | undefined = childIndex.get(currentId);
                        if (children && children.length > 0) {
                            const nextId: TreeNodeId | null = findFirstEnabled(nodeMap, children, 0, 1);
                            if (nextId !== null) {
                                updateFocused(nextId, event);
                                event.preventDefault();
                                return nextId;
                            }
                        }
                        event.preventDefault();
                        return null;
                    }
                    dispatch({ type: 'EXPAND_NODE', id: currentId }, event);
                    if (options.onExpand) { options.onExpand(currentId, event); }
                    event.preventDefault();
                    return null;
                }
                case 'COLLAPSE_OR_ASCEND': {
                    if (currentId === null) { return null; }
                    if (expandedIds.has(currentId)) {
                        dispatch({ type: 'COLLAPSE_NODE', id: currentId }, event);
                        if (options.onCollapse) { options.onCollapse(currentId, event); }
                        event.preventDefault();
                        return null;
                    }
                    let nextId: TreeNodeId | null = getNodeParentId(nodeMap, currentId);
                    while (nextId !== null && isNodeDisabled(nodeMap, nextId)) {
                        nextId = getNodeParentId(nodeMap, nextId);
                    }
                    if (nextId !== null) {
                        updateFocused(nextId, event);
                        event.preventDefault();
                        return nextId;
                    }
                    event.preventDefault();
                    return null;
                }
                case 'SELECT': {
                    if (currentId === null) { return null; }
                    if (isNodeDisabled(nodeMap, currentId)) {
                        event.preventDefault();
                        return null;
                    }
                    const ctrl: boolean = event.ctrlKey || event.metaKey;
                    const shift: boolean = event.shiftKey;
                    if (options.selectionMode === 'Checkbox' && !shift && !ctrl) {
                        dispatch({ type: 'TOGGLE_CHECK', id: currentId }, event);
                        event.preventDefault();
                        return null;
                    }
                    if (shift) {
                        if (options.onSelectRange) {
                            const anchor: TreeNodeId | null = rangeAnchorIdArg !== undefined && rangeAnchorIdArg !== null
                                ? rangeAnchorIdArg : currentId;
                            options.onSelectRange(anchor, currentId, visibleIds, event);
                        } else if (options.onSelect) {
                            options.onSelect(currentId, event);
                        }
                        event.preventDefault();
                        return null;
                    } else if (ctrl) {
                        if (options.onSelect) {
                            options.onSelect(currentId, event);
                        }
                        event.preventDefault();
                        return null;
                    }
                    const nodeForNav: NormalizedTreeNode | undefined = nodeMap.get(currentId);
                    const navigateUrl: string | undefined = nodeForNav?.navigateUrl;
                    if (navigateUrl) {
                        window.location.assign(navigateUrl);
                        event.preventDefault();
                        return null;
                    }
                    if (options.onSelect) {
                        options.onSelect(currentId, event);
                    }
                    event.preventDefault();
                    return null;
                }
                case 'SELECT_ALL': {
                    if (options.onSelectAll) {
                        const enabledIds: TreeNodeId[] = [];
                        for (let i: number = 0; i < visibleIds.length; i++) {
                            const id: TreeNodeId | undefined = visibleIds[i as number];
                            if (id === undefined) { continue; }
                            if (!isNodeDisabled(nodeMap, id)) {
                                enabledIds.push(id);
                            }
                        }
                        options.onSelectAll(enabledIds, event);
                    }
                    event.preventDefault();
                    return null;
                }
                case 'EXPAND_SIBLINGS': {
                    if (currentId === null || isNodeDisabled(nodeMap, currentId)) { event.preventDefault(); return null; }
                    const parentId: TreeNodeId | null = getNodeParentId(nodeMap, currentId);
                    const siblings: ReadonlyArray<TreeNodeId> | undefined = childIndex.get(parentId);
                    if (!siblings || siblings.length === 0) { event.preventDefault(); return null; }
                    const expandable: TreeNodeId[] = [];
                    for (let i: number = 0; i < siblings.length; i++) {
                        const sib: TreeNodeId | undefined = siblings[i as number];
                        if (sib === undefined || expandedIds.has(sib)) { continue; }
                        const sibNode: NormalizedTreeNode | undefined = nodeMap.get(sib);
                        if (!sibNode || sibNode.isLeaf === true) { continue; }
                        expandable.push(sib);
                    }
                    if (expandable.length > 0) {
                        dispatch({ type: 'EXPAND_SPECIFIC', ids: expandable }, event);
                    }
                    event.preventDefault();
                    return null;
                }
                case 'BEGIN_EDIT': {
                    if ( options.editable !== true ||
                        currentId === null ||
                        isNodeDisabled(nodeMap, currentId) ||
                        editingIdArg === currentId) {
                        return null;
                    }
                    dispatch({ type: 'BEGIN_EDIT', id: currentId }, event);
                    event.preventDefault();
                    return null;
                }
                case 'CANCEL_EDIT': {
                    if (editingIdArg === null || editingIdArg !== currentId) { return null; }
                    dispatch({ type: 'CANCEL_EDIT' }, event);
                    event.preventDefault();
                    return null;
                }
                case 'NOOP':
                default:
                    return null;
                }
            }, [nodeMap, childIndex, expandedIds, visibleIds, dispatch, options, updateFocused, editingIdArg, selectedIdsArg,
                rangeAnchorIdArg, dispatchVerticalStep]);

        return {
            onKeyDown: onKeyDown,
            setFocused: setFocused
        };
    };
