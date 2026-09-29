import { useCallback, useState, useEffect, useMemo, useRef, RefObject } from 'react';
import { TreeNodeId, TreeViewProps, TreeEditEvent } from '../types';
import { NormalizedTreeNode, TreeNodeMap, TreeViewDispatch } from '../internal-types';

/**
 * Specifies the per-hook return value for the editor lifecycle.
 *
 * @private
 */
export interface UseTreeEditResult {
    beginEdit: (id: TreeNodeId) => void;
    commitEdit: (inputValue: string) => void;
    cancelEdit: () => void;
    currentValue: string;
    setValue: (v: string) => void;
}

interface UseTreeEditArgs {
    nodeMap: TreeNodeMap;
    editingId?: TreeNodeId | null;
    dispatch: TreeViewDispatch;
    props: TreeViewProps;
    focusRow?: (id: TreeNodeId) => void;
    isRemote?: boolean;
    updateNodeLabel?: ((id: TreeNodeId, newLabel: string) => Promise<void>) | null;
}

export const useTreeEdit: (args: UseTreeEditArgs) => UseTreeEditResult =
    (args: UseTreeEditArgs): UseTreeEditResult => {
        const { nodeMap, editingId, dispatch, props, focusRow, isRemote, updateNodeLabel } = args;
        const { editable , onNodeEdit } = props;

        const editingNode: NormalizedTreeNode | undefined = useMemo(
            (): NormalizedTreeNode | undefined => {
                if (editingId === null || editingId === undefined) {
                    return undefined;
                }
                return nodeMap.get(editingId);
            },
            [editingId, nodeMap]
        );

        const [currentValue, setCurrentValue] = useState<string>(editingNode ? editingNode.label : '' );
        const lastEditingIdRef: RefObject<TreeNodeId | null> = useRef<TreeNodeId | null>(null);

        useEffect((): void => {
            if (editingId === null || editingId === undefined) {
                const closedId: TreeNodeId | null = lastEditingIdRef.current;
                if (closedId !== null) {
                    lastEditingIdRef.current = null;
                    focusRow?.(closedId);
                }
                return;
            }
            lastEditingIdRef.current = editingId;
            if (editingNode) {
                setCurrentValue(editingNode.label);
            }
        }, [editingId, editingNode, focusRow]);

        const beginEdit: (id: TreeNodeId) => void = useCallback((id: TreeNodeId): void => {
            if (!editable) { return; }
            const node: NormalizedTreeNode | undefined = nodeMap.get(id);
            if (!node || node.isDisabled || editingId === id) { return; }
            dispatch({ type: 'BEGIN_EDIT', id: id });
        }, [editable, nodeMap, editingId, dispatch]);

        const commitEdit: (inputValue: string) => void =
            useCallback((inputValue: string): void => {
                if (editingId === null || editingId === undefined) { return; }
                const node: NormalizedTreeNode | undefined = nodeMap.get(editingId);
                if (!node) {
                    dispatch({ type: 'CANCEL_EDIT' });
                    return;
                }
                const oldLabel: string = node.label;
                const trimmed: string = (inputValue).trim();
                if (trimmed === '') {
                    dispatch({ type: 'CANCEL_EDIT' });
                    return;
                }
                if (trimmed === oldLabel.trim()) {
                    dispatch({ type: 'COMMIT_EDIT', id: editingId });
                    return;
                }
                if (onNodeEdit) {
                    const detail: TreeEditEvent = {
                        item: node.raw,
                        id: editingId,
                        oldLabel: oldLabel,
                        newLabel: trimmed
                    };
                    const gate: boolean = onNodeEdit(detail);
                    if (gate === false) {
                        return;
                    }
                }
                if (!isRemote || !updateNodeLabel) {
                    dispatch({ type: 'COMMIT_EDIT', id: editingId });
                    return;
                }
                dispatch({ type: 'COMMIT_EDIT', id: editingId });
                updateNodeLabel(editingId, trimmed).catch((): void => {
                    dispatch({ type: 'BEGIN_EDIT', id: editingId });
                });
            }, [editingId, nodeMap, onNodeEdit, dispatch, isRemote, updateNodeLabel]);

        const cancelEdit: () => void = useCallback((): void => {
            if (editingId === null || editingId === undefined) { return; }
            dispatch({ type: 'CANCEL_EDIT' });
        }, [editingId, dispatch]);

        const setValue: (v: string) => void = useCallback((v: string): void => {
            setCurrentValue(v);
        }, []);

        return {
            beginEdit: beginEdit,
            commitEdit: commitEdit,
            cancelEdit: cancelEdit,
            currentValue: currentValue,
            setValue: setValue
        };
    };
