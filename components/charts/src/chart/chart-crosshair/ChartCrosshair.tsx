import * as React from 'react';
import { ChartContext } from '../layout/ChartProvider';
import { useContext, useEffect } from 'react';
import { defaultChartConfigs } from '../base/default-properties';
import { ChartCrosshairProps } from '../base/interfaces';
import { ChartProviderChildProps } from '../chart-area/chart-interfaces';

/**
 * ChartCrosshair component provides crosshair functionality for chart interactions.
 * This component configures crosshair settings including line styles, opacity, and visibility.
 * It acts as a configuration component that updates the chart context with crosshair properties.
 *
 * @param {ChartCrosshairProps} props - The crosshair configuration properties including enable, dashArray, line styles, and opacity
 * @returns {null} React functional component (returns null as it's a configuration component)
 */
export const ChartCrosshair: React.FC<ChartCrosshairProps> = (props: ChartCrosshairProps) => {
    /**
     * Chart context containing shared state and configuration methods.
     *
     * @type {ChartProviderChildProps}
     */
    const context: ChartProviderChildProps = useContext(ChartContext);

    /**
     * Effect hook that updates the chart crosshair configuration when props change.
     * Merges default crosshair configurations with provided props and updates the chart context.
     *
     * @returns {void}
     */
    useEffect((): void => {
        context?.setChartCrosshair({ ...defaultChartConfigs.ChartCrosshair, ...props });
    }, [
        props.enable,
        props.lineStyle,
        props.lineType,
        props.highlightCategory,
        props.snap
    ]);

    /**
     * This component doesn't render any UI elements as it's purely for configuration.
     * The actual crosshair rendering is handled by the ChartCrosshairRenderer component.
     *
     * @returns {null} - No visual output
     */
    return null;
};

export default ChartCrosshair;
