import { ChartContext, ChartProviderChildProps } from '../layout/ChartProvider';
import { useContext, useEffect } from 'react';
import { defaultChartConfigs } from '../base/default-properties';
import { PieChartTitleProps } from '../base/interfaces';

/**
 * Configures the main title for the Pie Chart.
 *
 * @param {PieChartTitleProps} props - Properties used to customize the chart title, including text, position, and font styling.
 * @returns {null} It is used only to pass the title configuration into the pie chart through React context.
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
