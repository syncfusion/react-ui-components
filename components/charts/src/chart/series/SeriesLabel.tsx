import * as React from 'react';
import { ChartSeriesLabelProps } from '../base/interfaces';

/**
 * @description Component for configuring series labels in a chart series.
 * This component is configuration-only and does not render any UI elements.
 * It must be a child of ChartSeries to apply series label settings.
 *
 * @example
 * ```tsx
 * <ChartSeries name="Series 1" type="Line" xField="x" yField="y" dataSource={data}>
 *   <ChartSeriesLabel visible={true} text="My Series" font={{ fontSize: '14px', color: '#000' }} />
 * </ChartSeries>
 * ```
 * @returns {null} - It is used only to pass the series label configuration to the chart through the React context.
 */
export const ChartSeriesLabel: React.FC<ChartSeriesLabelProps> = (): null => {
    return null;
};

ChartSeriesLabel.displayName = 'ChartSeriesLabel';
