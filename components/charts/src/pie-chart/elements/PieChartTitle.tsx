import { ChartContext, ChartProviderChildProps } from '../layout/ChartProvider';
import { useContext, useEffect } from 'react';
import { defaultChartConfigs } from '../base/default-properties';
import { PieChartTitleProps } from '../base/interfaces';

/**
 * PieChartTitle component for configuring and setting the main title of the chart.
 *
 * @param {PieChartTitleProps} props - Props used to customize the chart title.
 * @returns {null} This component does not render any visible output.
 */
export const PieChartTitle: React.FC<PieChartTitleProps> = (props: PieChartTitleProps) => {
    const context: ChartProviderChildProps = useContext(ChartContext);

    /**
     * Updates the chart title in the shared chart context whenever relevant props change.
     */
    useEffect(() => {
        context?.setChartTitle({ ...defaultChartConfigs.ChartTitle, ...props });
    }, [props.text,
        props.font?.color,
        props.font?.fontSize,
        props.position,
        props.font?.opacity,
        props.textOverflow,
        props.x,
        props.y,
        props.border?.color,
        props.border?.width,
        props.background,
        props.font?.fontFamily,
        props.font?.fontWeight,
        props.align
    ]);
    return null;
};
