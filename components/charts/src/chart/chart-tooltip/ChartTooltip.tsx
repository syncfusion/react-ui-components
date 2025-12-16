import * as React from 'react';
import { useContext, useEffect } from 'react';
import { ChartContext } from '../layout/ChartProvider';
import { defaultChartConfigs } from '../base/default-properties';
import { ChartTooltipProps } from '../base/interfaces';
import { ChartProviderChildProps } from '../chart-area/chart-interfaces';

/**
 * ChartTooltip component for configuring and setting the tooltip behavior in the chart.
 *
 * @param {ChartTooltipProps} props - Props used to customize the chart tooltip.
 * @returns {null} This component does not render any visible output.
 */
export const ChartTooltip: React.FC<ChartTooltipProps> = (props: ChartTooltipProps) => {
    const context: ChartProviderChildProps = useContext(ChartContext);

    /**
     * Updates the chart tooltip configuration in the shared chart context
     * whenever relevant props change.
     */
    useEffect(() => {
        void(context && context.setChartTooltip && context.setChartTooltip({
            ...defaultChartConfigs.ChartTooltip,
            ...props
        }));
    }, [
        props.enable,
        props.showMarker,
        props.shared,
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
        props.showNearestPoint,
        props.showHeaderLine,
        props.showNearestTooltip,
        props.template
    ]);

    // This component doesn't render anything directly
    return null;
};

// Set a display name for the component
ChartTooltip.displayName = 'ChartTooltip';
