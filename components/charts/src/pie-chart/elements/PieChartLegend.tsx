import * as React from 'react';
import { ChartContext, ChartProviderChildProps } from '../layout/ChartProvider';
import { defaultChartConfigs } from '../base/default-properties';
import { PieChartLegendProps } from '../base/interfaces';

/**
 * Configures legend settings for the Pie Chart.
 *
 * @param {PieChartLegendProps} props - Properties to customize legend appearance and behavior, such as visibility, position, alignment, and styling.
 * @returns {null} - It is used only to pass the legend configuration into the pie chart through React context.
 */
export const PieChartLegend: React.FC<PieChartLegendProps> = (props: PieChartLegendProps) => {
    const context: ChartProviderChildProps = React.useContext(ChartContext);

    // Memoize the merged legend config
    const legendConfig: PieChartLegendProps = React.useMemo(() => ({
        ...defaultChartConfigs.ChartLegend,
        ...props
    }), [
        props.visible, props.height, props.width, props.location, props.position, props.padding,
        props.itemPadding, props.align, props.textStyle, props.shapeHeight, props.shapeWidth, props.border,
        props.margin, props.containerPadding, props.shapePadding, props.background, props.opacity,
        props.toggleVisibility, props.title, props.titleStyle,
        props.maxTitleWidth, props.maxLabelWidth, props.enablePages,
        props.inversed, props.reverse, props.fixedWidth, props.accessibility, props.titleAlign, props.shape, props.imageUrl
    ]);

    // Only update context when legendConfig changes
    React.useEffect(() => {
        context?.setChartLegend(legendConfig);
    }, [legendConfig]);

    return null;
};
