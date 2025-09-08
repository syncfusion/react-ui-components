import * as React from 'react';
import { Column, ColumnsProps } from '../base/interfaces';
import { isValidElement, useContext, useEffect, useRef } from 'react';
import { ChartContext } from '../layout/ChartProvider';
import { defaultChartConfigs } from '../base/default-properties';
import { ChartProviderChildProps, ColumnProps } from '../chart-area/chart-interfaces';

/**
 * ChartColumns component for configuring and rendering multiple column definitions within the chart.
 * It collects all valid ChartColumn children, merges them with default configurations,
 * and updates the chart context accordingly.
 *
 * @param {ColumnsProps} props - Props containing ChartColumn children.
 * @returns {null} This component does not render any visible output.
 */
export const ChartColumns: React.FC<ColumnsProps> = (props: ColumnsProps) => {
    const context: ChartProviderChildProps = useContext(ChartContext);
    const previousColumnsRef: React.RefObject<Column[]> = useRef<Column[]>([]);
    useEffect(() => {
        const columnArray: Column[] = React.Children.map(props.children, (child: React.ReactNode) => {
            if (isValidElement<Column>(child) && child.type === ChartColumn) {
                return {
                    ...defaultChartConfigs.Column,
                    ...child.props
                };
            }
            return null;
        })?.filter((column: Column): column is ColumnProps => column !== null) as Column[];
        previousColumnsRef.current = columnArray;
        context?.setChartColumns(columnArray);
    }, [props.children]);

    return null;
};

/**
 * ChartColumn component representing a single column configuration within the chart.
 * This component is used as a child of ChartColumns and does not render any output directly.
 *
 * @returns {null} This component does not render any visible output.
 */
export const ChartColumn: React.FC<Column> = () => {
    return null;
};

