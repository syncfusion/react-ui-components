import { JSX, ReactNode } from 'react';
import { AggregateRowProps, AggregateColumnProps } from '../types/aggregate.interfaces';

/**
 * Aggregates component for declarative usage in user code
 *
 * @returns {JSX.Element} Rendered component
 */
export const Aggregates: React.FC<{ children?: ReactNode }> = (): JSX.Element => {
    return null;
};

/**
 * AggregateRow component for declarative usage in user code
 *
 * @component
 * @example
 * ```tsx
 * <AggregateRow columns={[]} />
 * ```
 * @param {Partial<AggregateRowProps>} _props - Aggregate row configuration properties
 * @returns {JSX.Element} Aggregate row component with the provided properties
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const AggregateRow: (props: Partial<AggregateRowProps>) => JSX.Element = (_props: Partial<AggregateRowProps>): JSX.Element => {
    return null;
};

/**
 * AggregateColumn component for declarative usage in user code
 *
 * @component
 * @example
 * ```tsx
 * <AggregateColumn field="name" type="Sum" />
 * ```
 * @param {Partial<AggregateColumnProps>} _props - Aggregate column configuration properties
 * @returns {JSX.Element} Aggregate column component with the provided properties
 */
export const AggregateColumn: (props: Partial<AggregateColumnProps>) => JSX.Element =
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (_props: Partial<AggregateColumnProps>): JSX.Element => {
        return null;
    };
