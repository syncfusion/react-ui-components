import { useCallback, MouseEvent as ReactMouseEvent, KeyboardEvent as ReactKeyboardEvent, SyntheticEvent } from 'react';
import { SelectionMode, TreeNodeId } from '../types';
import { TreeViewDispatch } from '../internal-types';

export const resolveRangeAnchor: (
    set: ReadonlySet<TreeNodeId>,
    direction: 'next' | 'prev'
) => TreeNodeId | null =
    (set: ReadonlySet<TreeNodeId>, direction: 'next' | 'prev'): TreeNodeId | null => {
        if (set.size === 0) { return null; }
        if (direction === 'next') {
            for (const v of set) { return v; }
            return null;
        }
        let last: TreeNodeId | undefined;
        for (const v of set) { last = v; }
        return last ?? null;
    };

export const useTreeSelection: (selectionMode: SelectionMode, checkOnClick: boolean,
    selectedIds: ReadonlySet<TreeNodeId>,
    rangeAnchorId: TreeNodeId | null,
    selectRange: (fromId: TreeNodeId | null, toId: TreeNodeId, visibleIds: ReadonlyArray<TreeNodeId>,
        event?: SyntheticEvent) => void,
    dispatch: TreeViewDispatch,
    visibleIds: ReadonlyArray<TreeNodeId>) =>
((id: TreeNodeId, e: ReactMouseEvent | ReactKeyboardEvent) => void) =
    (selectionMode: SelectionMode, checkOnClick: boolean, selectedIds: ReadonlySet<TreeNodeId>,
     rangeAnchorId: TreeNodeId | null,
     selectRange: (fromId: TreeNodeId | null, toId: TreeNodeId, visibleIds: ReadonlyArray<TreeNodeId>,
         event?: SyntheticEvent) => void,
     dispatch: TreeViewDispatch,
     visibleIds: ReadonlyArray<TreeNodeId>): ((id: TreeNodeId,
            e: ReactMouseEvent | ReactKeyboardEvent) => void) => {
        return useCallback((id: TreeNodeId, e: ReactMouseEvent | ReactKeyboardEvent): void => {
            if (selectionMode === 'None') { return; }
            if (selectionMode === 'Single') {
                dispatch({ type: 'SELECT_NODE', id: id, multi: false }, e);
                return;
            }
            if (selectionMode === 'Checkbox') {
                if (!checkOnClick) { return; }
                dispatch({ type: 'TOGGLE_CHECK', id: id }, e);
                return;
            }
            if (e.shiftKey) {
                const anchor: TreeNodeId | null = rangeAnchorId !== null ? rangeAnchorId : (selectedIds.size > 0 ? resolveRangeAnchor(selectedIds, 'prev') : id);
                selectRange(anchor, id, visibleIds, e);
                return;
            }
            const ctrl: boolean = e.ctrlKey || e.metaKey;
            dispatch({ type: 'SELECT_NODE', id: id, multi: ctrl }, e);
        }, [selectionMode, checkOnClick, selectedIds, rangeAnchorId, selectRange, dispatch, visibleIds]);
    };

export const useSelectAll: (selectionMode: SelectionMode, dispatch: TreeViewDispatch) =>
((visibleIds: ReadonlyArray<TreeNodeId>, event?: SyntheticEvent) => void) =
    (selectionMode: SelectionMode, dispatch: TreeViewDispatch): ((visibleIds: ReadonlyArray<TreeNodeId>,
        event?: SyntheticEvent) => void) => {
        return useCallback((visibleIds: ReadonlyArray<TreeNodeId>, event?: SyntheticEvent): void => {
            if (selectionMode !== 'Multiple') { return; }
            dispatch({ type: 'SET_SELECTED_IDS', ids: Array.from(visibleIds) }, event);
        }, [selectionMode, dispatch]);
    };

export const useSelectRange: (selectionMode: SelectionMode, dispatch: TreeViewDispatch) =>
((fromId: TreeNodeId | null, toId: TreeNodeId, visibleIds: ReadonlyArray<TreeNodeId>, event?: SyntheticEvent) => void) =
    (selectionMode: SelectionMode, dispatch: TreeViewDispatch): ((fromId: TreeNodeId | null, toId: TreeNodeId,
        visibleIds: ReadonlyArray<TreeNodeId>, event?: SyntheticEvent) => void) => {
        return useCallback((fromId: TreeNodeId | null, toId: TreeNodeId, visibleIds: ReadonlyArray<TreeNodeId>,
                            event?: SyntheticEvent): void => {
            if (selectionMode !== 'Multiple') { return; }
            dispatch({ type: 'RANGE_SELECT', fromId: fromId, toId: toId, ids: Array.from(visibleIds) }, event);
        }, [selectionMode, dispatch]);
    };
