import { ChartContext } from '../layout/ChartProvider';
import { useContext, useEffect } from 'react';
import { defaultChartConfigs } from '../base/default-properties';
import { ChartTitleProps } from '../base/interfaces';
import { ChartProviderChildProps } from './chart-interfaces';

/**
 * ChartTitle component for configuring and setting the main title of the chart.
 *
 * @param {ChartTitleProps} props - Props used to customize the chart title.
 * @returns {null} This component does not render any visible output.
 */
export const ChartTitle: React.FC<ChartTitleProps> = (props: ChartTitleProps) => {
    const context: ChartProviderChildProps = useContext(ChartContext);

    /**
     * Updates the chart title in the shared chart context whenever relevant props change.
     */
    useEffect(() => {
        context?.setChartTitle({ ...defaultChartConfigs.ChartTitle, ...props });
    }, [props.text,
        props.color,
        props.fontSize,
        props.position,
        props.opacity,
        props.textOverflow,
        props.x,
        props.y,
        props.border?.color,
        props.border?.width,
        props.background,
        props.fontFamily,
        props.fontWeight,
        props.align
    ]);
    return null;
};
