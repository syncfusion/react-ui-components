
import * as React from 'react';
import { ChartContext } from '../layout/ChartProvider';
import { defaultChartConfigs } from '../base/default-properties';
import { ChartZoomSettingsProps } from '../base/interfaces';
import { ChartProviderChildProps } from '../chart-area/chart-interfaces';

/**
 * React component that configures zoom settings for the chart.
 * This component doesn't render any UI elements but manages zoom configuration through context.
 *
 * @param {ChartZoomSettingsProps} props - Zoom settings configuration properties.
 * @returns {null} This component doesn't render any elements.
 */
export const ChartZoomSettings: React.FC<ChartZoomSettingsProps> = (props: ChartZoomSettingsProps) => {
    const context: ChartProviderChildProps = React.useContext(ChartContext);

    // Memoize the merged zoom config
    const zoomConfig: ChartZoomSettingsProps = React.useMemo(() => ({
        ...defaultChartConfigs.ChartZoom,
        ...props
    }), [
        props.selectionZoom, props.accessibility, props.mouseWheelZoom,
        props.pinchZoom, props.pan,
        props.mode, props.toolbar
    ]);

    // Only update context when zoomConfig changes
    React.useEffect(() => {
        context?.setChartZoom(zoomConfig);
    }, [zoomConfig]);

    return null;
};
