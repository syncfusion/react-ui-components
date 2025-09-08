import { ChartAreaProps } from '../base/interfaces';
import { useContext, useEffect } from 'react';
import { ChartContext } from '../layout/ChartProvider';
import { defaultChartConfigs } from '../base/default-properties';
import { ChartProviderChildProps } from './chart-interfaces';

/**
 * ChartArea component for configuring the area within the chart where the series are rendered.
 *
 * @param {ChartAreaProps} props - Props for configuring the chart area.
 * @returns {null} This component does not render any visible output.
 */
export const ChartArea: React.FC<ChartAreaProps> = (props: ChartAreaProps) => {
    const context: ChartProviderChildProps = useContext(ChartContext);

    /**
     * Update the chart area configuration when relevant props change.
     * Merges the provided props with default configuration values, with proper handling of nested objects.
     */
    useEffect(() => {
        context?.setChartArea(
            {
                ...defaultChartConfigs.ChartArea,
                ...props,
                border: {
                    ...defaultChartConfigs.ChartArea.border,
                    ...props.border
                },
                margin: {
                    ...defaultChartConfigs.ChartArea.margin,
                    ...props.margin
                }
            }
        );
    }, [props.width, props.border?.width, props.border?.color,
        props.border?.dashArray, props.background, props.backgroundImage, props.margin, props.opacity]);
    return null; // This is a configuration component with no UI representation.
};
