import { Children, isValidElement, ReactElement, ReactNode } from 'react';
import { ColumnProps } from '../types/column.interfaces';

export interface PivotFieldNode { id: string; label: string; field?: string; children?: PivotFieldNode[]; }

/**
 * Preserve declarative column groups for the panel without changing engine columns.
 *
 * @param {ColumnProps[]} columns - Flattened or prepared grid columns used as fallback.
 * @param {ReactNode} [children] - Declarative column children that retain nested groups.
 * @returns {ColumnProps[]} Column tree preserved for pivot panel field lists.
 * @private
 */
export function pivotPanelColumns<T>(columns: ColumnProps<T>[], children?: ReactNode): ColumnProps<T>[] {
    if (!children) { return columns; }
    const visit: (nodes: ReactNode) => ColumnProps<T>[] = (nodes: ReactNode): ColumnProps<T>[] =>
        Children.toArray(nodes).flatMap((child: ReactNode) => {
            if (!isValidElement<ColumnProps<T>>(child)) { return []; }
            const props: ColumnProps<T> = (child as ReactElement<ColumnProps<T>>).props;
            const nested: ColumnProps<T>[] = props.columns || visit(props.children);
            if (props.field || props.headerText) { return [{...props, columns: nested.length ? nested : undefined}]; }
            return nested;
        });
    const result: ColumnProps<T>[] = visit(children);
    return result.length ? result : columns;
}

/**
 * Builds a searchable field tree from nested pivot panel columns.
 *
 * @param {ColumnProps[]} columns - Nested column definitions for the panel.
 * @param {string} search - Case-insensitive field label filter text.
 * @param {string} [locale] - Locale used for case folding.
 * @param {string} [path] - Parent path used to build stable group identifiers.
 * @returns {PivotFieldNode[]} Filtered field tree nodes.
 * @private
 */
export function pivotFieldTree<T>(columns: ColumnProps<T>[], search: string, locale?: string, path: string = ''): PivotFieldNode[] {
    return columns.flatMap((column: ColumnProps<T>, index: number): PivotFieldNode[] => {
        const label: string = column.headerText || column.field || '';
        const id: string = `${path}/${index}`;
        if (column.columns?.length) {
            const children: PivotFieldNode[] = pivotFieldTree(column.columns, search, locale, id);
            return children.length ? [{id: `group:${id}`, label, children}] : [];
        }
        return column.field && label.toLocaleLowerCase(locale).includes(search.toLocaleLowerCase(locale)) ?
            [{id: column.field, label, field: column.field}] : [];
    });
}

/**
 * Collects leaf field nodes from a nested pivot field tree.
 *
 * @param {PivotFieldNode[]} nodes - Nested field tree nodes.
 * @returns {PivotFieldNode[]} Leaf field nodes only.
 * @private
 */
export function pivotTreeLeaves(nodes: PivotFieldNode[]): PivotFieldNode[] {
    return nodes.flatMap((node: PivotFieldNode) => node.children ? pivotTreeLeaves(node.children) : [node]);
}
