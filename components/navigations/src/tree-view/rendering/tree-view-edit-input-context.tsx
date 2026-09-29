import { createContext, useContext, useMemo, ReactNode, Context, FC } from 'react';

/**
 * Specifies the per-editor slot context value. Parallel to `TreeViewItemContextValue`
 *
 * @private
 */
export interface TreeViewEditInputContextValue {
    defaultValue: string;
    value: string;
    setValue: (v: string) => void;
    commit: () => void;
    cancel: () => void;
}

export const TreeViewEditInputContext: Context<TreeViewEditInputContextValue | undefined> =
    createContext<TreeViewEditInputContextValue | undefined>(undefined);

export const useTreeViewEditInputContext: () => TreeViewEditInputContextValue = (): TreeViewEditInputContextValue => {
    const ctx: TreeViewEditInputContextValue | undefined = useContext(TreeViewEditInputContext);
    if (ctx === undefined) {
        throw new Error('useTreeViewEditInputContext must be used within a TreeViewEditInput.');
    }
    return ctx;
};

export interface TreeViewEditInputProviderProps {
    value: TreeViewEditInputContextValue;
    children: ReactNode;
}

export const TreeViewEditInputProvider: FC<TreeViewEditInputProviderProps> =
    (props: TreeViewEditInputProviderProps): ReactNode => {
        const memoValue: TreeViewEditInputContextValue = useMemo((): TreeViewEditInputContextValue =>
            props.value, [props.value]);
        return (
            <TreeViewEditInputContext.Provider value={memoValue}>
                {props.children}
            </TreeViewEditInputContext.Provider>
        );
    };

TreeViewEditInputProvider.displayName = 'TreeViewEditInputProvider';
