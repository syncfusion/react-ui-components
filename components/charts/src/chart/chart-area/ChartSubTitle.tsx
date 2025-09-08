import { useContext, useEffect } from 'react';
import { ChartContext } from '../layout/ChartProvider';
import { defaultChartConfigs } from '../base/default-properties';
import { ChartTitleProps } from '../base/interfaces';
import { ChartProviderChildProps } from './chart-interfaces';

/**
 * ChartSubtitle component for configuring and setting the subtitle of the chart.
 *
 * @param {ChartTitleProps} props - Props used to customize the chart subtitle.
 * @returns {null} This component does not render any visible output.
 */
export const ChartSubtitle: React.FC<ChartTitleProps> = (props: ChartTitleProps) => {
    const context: ChartProviderChildProps = useContext(ChartContext);

    /**
     * Updates the chart subtitle in the shared chart context whenever relevant props change.
     */
    useEffect(() => {
        context?.setChartSubTitle({ ...defaultChartConfigs.ChartSubTitle, ...props });
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
    return null;  // This is a configuration component with no UI representation.
};
