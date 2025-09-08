import * as React from 'react';
import { Row } from '../base/interfaces';
import { useContext, useEffect, useRef } from 'react';
import { ChartContext } from '../layout/ChartProvider';
import { defaultChartConfigs } from '../base/default-properties';
import { ChartProviderChildProps, RowProps } from '../chart-area/chart-interfaces';

/**
 * Props for the ChartRows component.
 * Contains optional children which are expected to be ChartRow components.
 */
interface RowsProps {
    children?: React.ReactNode;
}

/**
 * ChartRows component for configuring multiple row definitions within the chart layout.
 * It collects all valid ChartRow children, merges them with default configurations,
 * and updates the chart context accordingly.
 *
 * @param {RowsProps} props - Props containing ChartRow children.
 * @returns {null} This component does not render any visible output.
 */
export const ChartRows: React.FC<RowsProps> = (props: RowsProps) => {
    const context: ChartProviderChildProps = useContext(ChartContext);
    const previousRowsRef: React.RefObject<Row[]> = useRef<Row[]>([]);
    useEffect(() => {
        const rowArray: Row[] = React.Children.map(props.children, (child: React.ReactNode) => {
            if (React.isValidElement<Row>(child) && child.type === ChartRow) {
                return {
                    ...defaultChartConfigs.Row,
                    ...child.props
                };
            }
            return null;
        })?.filter((row: Row): row is RowProps => row !== null) as Row[];
        previousRowsRef.current = rowArray;
        context?.setChartRows(rowArray);
    }, [props.children]);

    return null;
};

/**
 * ChartRow component representing a single row configuration within the chart layout.
 * This component is used as a child of ChartRows and does not render any output directly.
 *
 * @returns {null} This component does not render any visible output.
 */
export const ChartRow: React.FC<Row> = () => {
    return null;
};
