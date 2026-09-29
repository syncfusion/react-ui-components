import { Children, ReactElement, ReactNode, RefObject, useMemo } from 'react';
import { AggregateColumnProps, aggregateModule, AggregateRowProps } from '../types/aggregate.interfaces';
import { GridRef, IGridBase } from '../types/grid.interfaces';
import { compareSelectedProperties } from '../utils/utils';
import { FooterPanelBase } from '../views/FooterPanel';

type AggregateColumnCompareKeys = Array<keyof AggregateColumnProps>;

/**
 * Get relevant aggregate column properties that should trigger change detection
 * This allows for better performance by only comparing properties that matter
 *
 * @returns {AggregateColumnCompareKeys} - Data Affecting aggregate column properties comparison keys
 */
function getAggregateColumnCompareKeys(): AggregateColumnCompareKeys {
    return [
        'type', 'format', 'columnName', 'field'
    ];
}

const generateDirectiveAggregates: (props: { children?: ReactNode }) => AggregateRowProps[] =
    (props: { children?: ReactNode }): AggregateRowProps[] => {
        const aggregates: AggregateRowProps[] = [];
        const rowArray: ReactElement[] = Array.isArray(props.children)
            ? props.children as ReactElement[]
            : Children.toArray(props.children) as ReactElement[];
        for (let i: number = 0; i < rowArray.length; i++) {
            const aggregateRow: AggregateRowProps = { columns: [] };
            const childRow: AggregateRowProps = rowArray[parseInt(i.toString(), 10)].props;
            if (childRow.columns) {
                aggregateRow.columns = childRow.columns;
            } else if (childRow.children) {
                const aggregateColumns: AggregateColumnProps[] = [];
                const columnArray: ReactElement[] = Array.isArray(childRow.children)
                    ? childRow.children as ReactElement[]
                    : Children.toArray(childRow.children) as ReactElement[];
                for (let j: number = 0; j < columnArray.length; j++) {
                    const column: AggregateColumnProps = columnArray[parseInt(j.toString(), 10)].props;
                    aggregateColumns.push({...column});
                }
                aggregateRow.columns = aggregateColumns;
            }
            aggregates.push(aggregateRow);
        }
        return aggregates;
    };

const prepareAggregates: <T>(aggregates: AggregateRowProps[], gridRef: RefObject<GridRef<T>>) => boolean =
<T, >(aggregates: AggregateRowProps[], gridRef: RefObject<GridRef<T>>): boolean => {
    let isAggregateColumnsChanged: boolean = false;
    for (let i: number = 0; i < aggregates?.length; i++) {
        const columns: AggregateColumnProps<T>[] = aggregates[parseInt(i.toString(), 10)].columns;
        for (let j: number = 0; j < columns.length; j++) {
            if (!columns[parseInt(j.toString(), 10)].columnName) {
                if (gridRef.current?.aggregates?.[i as number]?.columns?.[j as number]?.columnName === columns[j as number].columnName
                ) {
                    // Only compare specific properties that should trigger a change
                    const hasChanged: boolean = !compareSelectedProperties(
                        gridRef.current?.aggregates?.[i as number]?.columns?.[j as number],
                        columns[j as number],
                        getAggregateColumnCompareKeys()
                    );
                    // Update isColumnChanged if any changes detected
                    isAggregateColumnsChanged = isAggregateColumnsChanged || hasChanged;
                }
                columns[parseInt(j.toString(), 10)].columnName = columns[parseInt(j.toString(), 10)].field;
            }
        }
    }
    return isAggregateColumnsChanged;
};

const useAggregates: <T>(props: Partial<IGridBase<T>>, gridRef?: RefObject<GridRef<T>>, directiveAggregates?: ReactElement) =>
aggregateModule =
    <T, >(props: Partial<IGridBase<T>>, gridRef?: RefObject<GridRef<T>>, directiveAggregates?: ReactElement): aggregateModule => {
        let aggregates: AggregateRowProps[] = [];
        let isAggregateColumnsChanged: boolean = false;
        if (props.aggregates) {
            aggregates = useMemo(() => props.aggregates, [props.aggregates]);
        } else if (directiveAggregates) {
            aggregates = useMemo(() => generateDirectiveAggregates(directiveAggregates.props), [props.children]);
        }
        isAggregateColumnsChanged = prepareAggregates<T>(aggregates, gridRef);
        return useMemo(() => {
            if (isAggregateColumnsChanged) {
                return { aggregates, FooterPanelBase };
            } else {
                return { aggregates: gridRef.current?.aggregates ?? aggregates, FooterPanelBase };
            }
        }, [isAggregateColumnsChanged]);
    };
export { useAggregates as AggregateModule };
