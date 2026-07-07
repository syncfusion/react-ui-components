import { useContext, useEffect } from 'react';
import { ChartProviderChildProps, ChartContext } from '../layout/ChartProvider';
import { defaultChartConfigs } from '../base/default-properties';
import { PieChartTooltipProps } from '../base/interfaces';

/**
 * PieChartTooltip component for configuring and setting the tooltip behavior in the pie chart.
 *
 * @param {PieChartTooltipProps} props - Defines tooltip options such as enable, showMarker, fill, location, headerText, format, border, textStyle, animation, and related settings.
 * @returns {null} It is used only for passing tooltip configuration into the chart through React context.
 */
export const PieChartTooltip: React.FC<PieChartTooltipProps> = (props: PieChartTooltipProps) => {
    const context: ChartProviderChildProps = useContext(ChartContext);

    /**
     * Updates the chart tooltip configuration in the shared chart context
     * whenever relevant props change.
     */
    useEffect(() => {
        void (context && context.setChartTooltip && context.setChartTooltip({
            ...defaultChartConfigs.ChartTooltip,
            ...props
        }));
    }, [
        props.enable,
        props.showMarker,
        props.fill,
        props.location,
        props.headerText,
        props.opacity,
        props.format,
        props.border,
        props.textStyle,
        props.fadeOutMode,
        props.enableAnimation,
        props.duration,
        props.fadeOutDuration,
        props.showHeaderLine
    ]);

    // This component doesn't render anything directly
    return null;
};

// Set a display name for the component
PieChartTooltip.displayName = 'PieChartTooltip';
