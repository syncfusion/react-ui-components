import { SortOrder } from '@syncfusion/react-base';
import { SyntheticEvent } from 'react';
import { DataManager, Query } from '@syncfusion/react-data';
export { SortOrder, DataManager, Query };

/**
 * Specifies a unique identifier for a tree node. Either a string or a number.
 *
 * @private
 */
export type TreeNodeId = string | number;

/**
 * Specifies the mapping of custom datasource field names to TreeView fields.
 *
 */
export interface TreeViewFieldMapping {
    /**
     * Specifies the mapping field for the unique identifier of a node.
     *
     * @default 'id'
     */
    id?: string;
    /**
     * Specifies the mapping field for the display label of a node.
     *
     * @default 'label'
     */
    label?: string;
    /**
     * Specifies the mapping field for the child array in hierarchical data.
     *
     * @default -
     */
    children?: string;
    /**
     * Specifies the mapping field for the parent's id in self-referential data.
     *
     * @default 'parentId'
     */
    parentId?: string;
    /**
     * Specifies the mapping field for the disabled flag of a node.
     *
     * @default 'disabled'
     */
    disabled?: string;
    /**
     * Specifies the mapping field for the selectable flag of a node.
     *
     * @default 'selectable'
     */
    selectable?: string;
    /**
     * Specifies the mapping field for the icon of a node.
     *
     * @default 'icon'
     */
    icon?: string;
    /**
     * Specifies the mapping field for hasChildren to check whether a node has child nodes or not.
     *
     * @default 'hasChildren'
     */
    hasChildren?: string;
    /**
     * Specifies the mapping field for the tooltip string of a node.
     *
     * @default 'tooltip'
     */
    tooltip?: string;
    /**
     * Specifies the mapping field for the navigation URL of a node.
     *
     * @default 'navigateUrl'
     */
    navigateUrl?: string;
}

/**
 * Specifies the selection mode of TreeView.
 *
 * - `None` - no selection.
 * - `Single` - only one node can be selected.
 * - `Multiple` - multiple nodes can be selected.
 * - `Checkbox` - multi-node selection driven by checkboxes.
 *
 */
export type SelectionMode = 'None' | 'Single' | 'Multiple' | 'Checkbox';

/**
 * Specifies the action that triggers expansion/collapse on a row.
 *
 * - `Click` - expands or collapses on a single click.
 * - `DoubleClick` - expands or collapses on a double click.
 * - `None` - expansion is triggered only via the expand icon or the controlled `expandedIds`.
 *
 */
export type ExpandOnAction = 'Click' | 'DoubleClick' | 'None';

/**
 * Specifies the node event detail.
 *
 */
export interface TreeNodeEvent {
    /**
     * Specifies the node item.
     */
    item: unknown;
    /**
     * Specifies the node id.
     */
    id: string | number;
    /**
     * Specifies the underlying SyntheticEvent.
     */
    event: SyntheticEvent;
}

/**
 * Specifies the selection change event detail.
 *
 */
export interface TreeSelectionEvent extends TreeNodeEvent {
    /**
     * Specifies the full selected id list after the change.
     */
    selectedIds: (string | number)[];
}

/**
 * Specifies the expansion change event detail.
 *
 */
export interface TreeExpansionEvent extends TreeNodeEvent {
    /**
     * Specifies the full expanded id list after the change.
     */
    expandedIds: (string | number)[];
}

/**
 * Specifies the props for the `<TreeView>` root component.
 *
 * @private
 */
export interface TreeViewProps<T = unknown> {

    /**
     * Specifies the tree datasource.
     *
     * @default -
     */
    dataSource?: DataManager | T[];

    /**
     * Specifies the mapping of datasource field names to TreeView fields.
     *
     * @default -
     */
    fields?: TreeViewFieldMapping;

    /**
     * Specifies the list of expanded node IDs.
     *
     * @default -
     */
    expandedIds?: (string | number)[];

    /**
     * Specifies the initial list of expanded node IDs used when no expanded list is supplied.
     *
     * @default -
     */
    defaultExpandedIds?: (string | number)[];

    /**
     * Specifies the action that triggers expansion or collapse on a row.
     *
     * @default 'None'
     */
    expandOn?: ExpandOnAction;

    /**
     * Specifies the selection behavior.
     *
     * @default 'Single'
     */
    selectionMode?: SelectionMode;

    /**
     * Specifies the list of selected node IDs.
     *
     * @default -
     */
    selectedIds?: (string | number)[];

    /**
     * Specifies the initial list of selected node IDs used when no selected list is supplied.
     *
     * @default -
     */
    defaultSelectedIds?: (string | number)[];

    /**
     * Specifies whether toggling a node's checkbox cascades the selection
     * to its descendants and recomputes the ancestor selection state.
     *
     * @default false
     */
    autoCheck?: boolean;

    /**
     * Specifies whether disabled children participate in `autoCheck` propagation.
     *
     * @default false
     */
    checkDisabledChildren?: boolean;

    /**
     * Specifies whether clicking the row's content area also toggles the row's selection when `selectionMode`
     * is `'Checkbox'`.
     *
     * @default false
     */
    checkOnClick?: boolean;

    /**
     * Specifies the sort order applied to sibling nodes.
     *
     * @default 'SortOrder.None'
     */
    sortOrder?: SortOrder;

    /**
     * Specifies the `Query` applied to the root-level DataManager fetch.
     *
     * @default new Query()
     */
    query?: Query;

    /**
     * Triggers for every DataManager fetch failure.
     *
     * @event onError
     */
    onError?: (event: Error) => void;

    /**
     * Triggers whenever the expanded set changes.
     *
     * @event onExpandedChange
     */
    onExpandedChange?: (event: TreeExpansionEvent) => void;

    /**
     * Triggers whenever the selected set changes.
     *
     * @event onSelectedChange
     */
    onSelectedChange?: (event: TreeSelectionEvent) => void;

    /**
     * Triggers when a node is clicked.
     *
     * @event onItemClick
     */
    onItemClick?: (event: TreeNodeEvent) => void;

    /**
     * Triggers when a key is pressed on a focused node.
     *
     * @event onKeyPress
     */
    onKeyPress?: (event: TreeNodeEvent) => void;

    /**
     * Specifies whether inline label editing is enabled for this TreeView.
     *
     * @default false
     */
    editable?: boolean;

    /**
     * Specifies whether the TreeView is disabled, preventing user interaction with any row.
     *
     * @default false
     */
    disabled?: boolean;

    /**
     * Triggers when the user commits a label change for a row.
     *
     * @event onNodeEdit
     */
    onNodeEdit?: (event: TreeEditEvent) => boolean;

    /**
     * Specifies whether the node label wraps onto multiple lines when it exceeds the row width.
     *
     * @default true
     */
    textWrap?: boolean;

    /**
     * Specifies whether the entire row becomes the navigable click surface for
     * a node that has a `navigateUrl`.
     *
     * @default false
     */
    fullRowNavigable?: boolean;

    /**
     * Specifies whether the entire row owns the click and interaction surface.
     *
     * @default true
     */
    fullRowSelect?: boolean;
}

/**
 * Specifies the transient tri-state of a row's checkbox.
 *
 * - `Checked` - the row's checkbox is fully checked.
 * - `Unchecked` - the row's checkbox is fully unchecked.
 * - `Indeterminate` - the row's checkbox is in a mixed state, with only some of its child nodes checked.
 *
 */
export type CheckState = 'Checked' | 'Unchecked' | 'Indeterminate';

/**
 * Specifies the event detail for the `onNodeEdit` callback.
 *
 */
export interface TreeEditEvent {
    /**
     * Specifies the row's data item.
     */
    item: unknown;
    /**
     * Specifies the row's id.
     */
    id: string | number;
    /**
     * Specifies the row's label as it was when the editor opened.
     */
    oldLabel: string;
    /**
     * Specifies the new user input.
     */
    newLabel: string;
}

/**
 * Specifies the slot context for the `<TreeViewEditInput>` sub-component.
 *
 */
export interface TreeEditTemplateContext {
    /**
     * Specifies the row's label as it was when the editor opened.
     */
    defaultValue: string;
    /**
     * Specifies the current input value.
     */
    value: string;
    /**
     * Specifies the function that updates the mirrored value.
     */
    setValue: (value: string) => void;
    /**
     * Specifies the function that applies the new value.
     */
    commit: () => void;
    /**
     * Specifies the function that discards the new value.
     */
    cancel: () => void;
}

/**
 * Specifies the full per-row context passed to the `<TreeViewNodes>` render-prop.
 *
 */
export interface TreeItemTemplateContext {
    /**
     * Specifies the original item.
     *
     * @default -
     */
    item: unknown;
    /**
     * Specifies the resolved node id.
     *
     * @default -
     */
    id: string | number;
    /**
     * Specifies whether the node is currently expanded.
     *
     * @default false
     */
    expanded: boolean;
    /**
     * Specifies whether the node is currently selected.
     *
     * @default false
     */
    selected: boolean;
    /**
     * Specifies the tri-state checkbox state for the row.
     *
     * @default 'Unchecked'
     */
    checkState: CheckState;
    /**
     * Specifies whether the node is disabled.
     *
     * @default false
     */
    disabled: boolean;
    /**
     * Specifies whether the node has no children.
     *
     * @default true
     */
    isLeaf: boolean;
    /**
     * Specifies the 0-indexed depth in the tree.
     *
     * @default 0
     */
    depth: number;
    /**
     * Specifies whether the row's editor is currently open
     *
     * @default false
     */
    isEditing: boolean;
    /**
     * Specifies the function that opens the editor for current row.
     *
     * @default -
     */
    beginEdit: () => void;
    /**
     * Specifies whether the row's children are currently being fetched.
     */
    loading?: boolean;
}
