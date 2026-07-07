import { JSX, ReactNode, FunctionComponent } from 'react';
import { AggregateRowProps, AggregateColumnProps } from '../types/aggregate.interfaces';

/**
 * Aggregates component for declarative usage in user code.
 * Container for aggregate row and column definitions.
 *
 * @param {Object} props - Component properties
 * @param {ReactNode} [props.children] - Aggregate row and column definitions
 * @returns {JSX.Element} Rendered component
 */
export const Aggregates: FunctionComponent<{ children?: ReactNode }> = (): JSX.Element => {
    return null;
};

/**
 * AggregateRow component for declarative usage in user code.
 * Defines aggregation configuration for a single row.
 *
 * @component
 * @param {Partial<AggregateRowProps>} props - Aggregate row configuration properties
 * @param {AggregateColumnProps[]} props.columns - Columns to aggregate
 * @example
 * ```tsx
 * <AggregateRow columns={[]} />
 * ```
 * @returns {JSX.Element} Aggregate row component with the provided properties
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const AggregateRow: (props: Partial<AggregateRowProps>) => JSX.Element = (_props: Partial<AggregateRowProps>): JSX.Element => {
    return null;
};

/**
 * AggregateColumn component for declarative usage in user code.
 * Defines aggregation configuration for a specific column.
 *
 * @component
 * @template T - Data type for the column
 * @param {Partial<AggregateColumnProps<T>>} props - Aggregate column configuration properties
 * @param {string} props.field - Field name for aggregation
 * @param {string} props.type - Aggregation type (Sum, Average, Count, Min, Max, etc.)
 * @param {string} [props.footerTemplate] - Template for footer cell
 * @example
 * ```tsx
 * <AggregateColumn field="name" type="Sum" />
 * ```
 * @returns {JSX.Element} Aggregate column component with the provided properties
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const AggregateColumn: <T>(props: Partial<AggregateColumnProps<T>>) => JSX.Element =
    <T, >(_props: Partial<AggregateColumnProps<T>>): JSX.Element => {
        return null;
    };
