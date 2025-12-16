import { useContext, useEffect } from 'react';
import { ChartContext, ChartProviderChildProps } from '../layout/ChartProvider';
import { defaultChartConfigs } from '../base/default-properties';
import { PieChartTitleProps } from '../base/interfaces';

/**
 * PieChartSubtitle component for configuring and setting the subtitle of the chart.
 *
 * @param {PieChartTitleProps} props - Props used to customize the chart subtitle.
 * @returns {null} This component does not render any visible output.
 */
export const PieChartSubtitle: React.FC<PieChartTitleProps> = (props: PieChartTitleProps) => {
    const context: ChartProviderChildProps = useContext(ChartContext);

    /**
     * Updates the chart subtitle in the shared chart context whenever relevant props change.
     */
    useEffect(() => {
        context?.setChartSubTitle({ ...defaultChartConfigs.ChartSubTitle, ...props });
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
    return null;  // This is a configuration component with no UI representation.
};
