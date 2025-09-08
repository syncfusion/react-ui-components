import { ChartContext } from '../layout/ChartProvider';
import { useContext, useEffect } from 'react';
import { defaultChartConfigs } from '../base/default-properties';
import { ChartStackLabelsProps } from '../base/interfaces';
import { ChartProviderChildProps } from './chart-interfaces';

/**
 * ChartStackLabels component for configuring stack labels in the chart.
 * Stack labels are used to display the total value of stacked series.
 * This is a configuration-only component and does not render any visual output.
 *
 * @param {ChartStackLabelsProps} props - Properties used to customize stack label appearance and behavior.
 * @returns {null} This component does not render any visible output.
 */
export const ChartStackLabels: React.FC<ChartStackLabelsProps> = (props: ChartStackLabelsProps) => {
    const context: ChartProviderChildProps = useContext(ChartContext);
    useEffect(() => {
        context?.setChartStackLabels({ ...defaultChartConfigs.ChartStackLabels, ...props });
    }, [
        props.visible,
        props.fill,
        props.format,
        props.rotationAngle,
        props.borderRadius?.x,
        props.borderRadius?.y,
        props.margin?.left,
        props.margin?.right,
        props.margin?.top,
        props.margin?.bottom,
        props.border?.width,
        props.border?.color,
        props.font?.color,
        props.font?.fontSize,
        props.font?.fontStyle,
        props.font?.fontFamily,
        props.font?.fontWeight,
        props.align
    ]);
    return null;
};

export default ChartStackLabels;
