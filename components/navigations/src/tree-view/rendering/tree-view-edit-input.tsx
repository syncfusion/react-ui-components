import { FC, ReactNode, useCallback, useMemo, KeyboardEvent as ReactKeyboardEvent, HTMLAttributes, memo } from 'react';
import { TextBox, TextBoxChangeEvent } from '@syncfusion/react-inputs';
import { TREE_VIEW_CLASSES } from '../../common/constants';
import { useTreeViewItemContext } from '../tree-view-item-context';
import { TreeEditTemplateContext } from '../types';
import { TreeViewEditInputProvider, useTreeViewEditInputContext, TreeViewEditInputContextValue } from './tree-view-edit-input-context';

/**
 * `TreeViewEditInput` is a semantic container for the inline row editor in `TreeView`. Provides consistent styling and structure for displaying and capturing a node's label when the row is in edit mode.
 *
 * ```tsx
 * import { TreeView, TreeViewNodes, TreeViewNode, TreeViewItemToggle, TreeViewItemLabel, TreeViewEditInput, TreeEditEvent } from '@syncfusion/react-navigations';
 * import { useState, KeyboardEvent } from 'react';
 *
 * const dataSource = [
 *     { id: '1', label: 'Documents' },
 *     { id: '2', label: 'Resume.docx' }
 * ];
 * const fields = { id: 'id', label: 'label' };
 *
 * export default function App() {
 *
 *     const [data, setData] = useState(dataSource);
 *
 *     const onNodeEdit = (event: TreeEditEvent): boolean => {
 *         const next = event.newLabel.trim();
 *         if (!next || next === event.oldLabel) {
 *             return false;
 *         }
 *         setData((prev) =>
 *             prev.map((node) =>
 *                 node.id === event.id ? { ...node, label: next } : node
 *             )
 *         );
 *         return true;
 *     };
 *     return (
 *         <TreeView dataSource={data} fields={fields} editable onNodeEdit={onNodeEdit}>
 *             <TreeViewNodes>
 *                 {ctx => (
 *                     <TreeViewNode>
 *                         <TreeViewItemToggle />
 *                         {ctx.isEditing
 *                             ? <TreeViewEditInput>
 *                                 {(editCtx) => (
 *                                     <input
 *                                         className='tree-input-field'
 *                                         value={editCtx.value}
 *                                         onChange={(e) => editCtx.setValue(e.target.value ?? '')}
 *                                         autoFocus
 *                                         onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
 *                                             if (e.key === 'Enter') {
 *                                                 e.stopPropagation();
 *                                                 editCtx.commit();
 *                                             } else if (e.key === 'Escape') {
 *                                                 e.stopPropagation();
 *                                                 editCtx.cancel();
 *                                             }
 *                                         }}
 *                                         onBlur={() => editCtx.commit()}
 *                                     />
 *                                 )}
 *                             </TreeViewEditInput>
 *                             : <TreeViewItemLabel>{String((ctx.item as { label: string }).label)}</TreeViewItemLabel>}
 *                     </TreeViewNode>
 *                 )}
 *             </TreeViewNodes>
 *         </TreeView>
 *     );
 * }
 * ```
 */
export interface TreeViewEditInputProps {
    /**
     * Specifies a render function returning a custom input element.
     *
     * @default -
     */
    children?: ((ctx: TreeEditTemplateContext) => ReactNode);
    /**
     * Specifies the root element class name.
     *
     * @default -
     */
    className?: string;
}

type ITreeViewEditInputProps = TreeViewEditInputProps & Omit<HTMLAttributes<HTMLSpanElement>, 'children'>;

export const TreeViewEditInput: FC<ITreeViewEditInputProps> = memo((props: ITreeViewEditInputProps) => {
    const { children, className, ...restProps } = props;
    const {editApi, node} = useTreeViewItemContext();

    const defaultValue: string = node.label;
    const value: string = editApi ? editApi.currentValue : defaultValue;

    const setValue: (v: string) => void = useCallback((v: string): void => {
        if (editApi) { editApi.setValue(v); }
    }, [editApi]);

    const commit: () => void = useCallback((): void => {
        if (!editApi) { return; }
        editApi.commitEdit(editApi.currentValue);
    }, [editApi]);

    const cancel: () => void = useCallback((): void => {
        if (editApi) { editApi.cancelEdit(); }
    }, [editApi]);

    const slotValue: TreeViewEditInputContextValue = useMemo((): TreeViewEditInputContextValue => ({
        defaultValue: defaultValue,
        value: value,
        setValue: setValue,
        commit: commit,
        cancel: cancel
    }), [defaultValue, value, setValue, commit, cancel]);

    const wrapperClassName: string = useMemo((): string => {
        return [
            TREE_VIEW_CLASSES.EDIT_INPUT_WRAPPER,
            TREE_VIEW_CLASSES.CONTENT,
            className
        ].filter(Boolean).join(' ');
    }, [className]);

    return (
        <TreeViewEditInputProvider value={slotValue}>
            <span className={wrapperClassName} {...restProps}>
                {children === undefined || children === null ? <DefaultEditor /> : children(slotValue)}
            </span>
        </TreeViewEditInputProvider>
    );
});

TreeViewEditInput.displayName = 'TreeViewEditInput';

/**
 * Default editor. Renders a stock `<TextBox>` with the full editor.
 *
 * @private
 */
const DefaultEditor: FC = memo(() => {
    const slot: TreeViewEditInputContextValue = useTreeViewEditInputContext();

    const onChange: (e: TextBoxChangeEvent) => void = useCallback((e: TextBoxChangeEvent): void => {
        slot.setValue(typeof e.value === 'string' ? e.value : '');
    }, [slot]);

    const onKeyDown: (e: ReactKeyboardEvent<HTMLInputElement>) => void = useCallback((e: ReactKeyboardEvent<HTMLInputElement>): void => {
        if (e.key === 'Enter') {
            e.stopPropagation();
            slot.commit();
            return;
        }
        if (e.key === 'Escape') {
            e.stopPropagation();
            slot.cancel();
            return;
        }
    }, [slot]);

    const onBlur: () => void = useCallback((): void => {
        slot.commit();
    }, [slot]);

    return (
        <TextBox
            value={slot.value}
            autoFocus
            onChange={onChange}
            onKeyDown={onKeyDown}
            onBlur={onBlur}
            className={TREE_VIEW_CLASSES.EDIT_INPUT}
        />
    );
});

DefaultEditor.displayName = 'DefaultEditor';
