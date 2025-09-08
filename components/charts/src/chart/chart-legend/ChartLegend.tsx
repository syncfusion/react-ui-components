import * as React from 'react';
import { ChartContext } from '../layout/ChartProvider';
import { defaultChartConfigs } from '../base/default-properties';
import { ChartLegendProps } from '../base/interfaces';
import { ChartProviderChildProps } from '../chart-area/chart-interfaces';

/**
 * React component that configures the legend appearance and behavior for the chart.
 * This component doesn't render any UI elements but manages legend configuration through context.
 *
 * @param {ChartLegendProps} props - Legend configuration properties.
 * @returns {null} This component doesn't render any elements.
 */
export const ChartLegend: React.FC<ChartLegendProps> = (props: ChartLegendProps) => {
    const context: ChartProviderChildProps = React.useContext(ChartContext);

    // Memoize the merged legend config
    const legendConfig: ChartLegendProps = React.useMemo(() => ({
        ...defaultChartConfigs.ChartLegend,
        ...props
    }), [
        props.visible, props.height, props.width, props.location, props.position, props.padding,
        props.itemPadding, props.align, props.textStyle, props.shapeHeight, props.shapeWidth, props.border,
        props.margin, props.containerPadding, props.shapePadding, props.background, props.opacity,
        props.toggleVisibility, props.title, props.titleStyle,
        props.maxTitleWidth, props.maxLabelWidth, props.enablePages,
        props.inversed, props.reverse, props.fixedWidth, props.accessibility, props.titleAlign
    ]);

    // Only update context when legendConfig changes
    React.useEffect(() => {
        context?.setChartLegend(legendConfig);
    }, [legendConfig]);

    return null;
};
