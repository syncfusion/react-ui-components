import * as React from 'react';
import { ChartLastValueLabelProps } from '../base/interfaces';

/**
 * Component for configuring the last value label in a chart series
 * It must be a child of ChartSeries to apply last value label.
 *
 * @example
 * ```tsx
 * <ChartSeries name="Series 1" type="Line" xField="x" yField="y" dataSource={data}>
 *   <ChartLastValueLabel enable={true} background={'#ffffff'} font={{ fontSize: '14px', color: '#000' }} />
 * </ChartSeries>
 * ```
 * @returns {null} - It is used only to pass the last value label configuration to the chart through the React context.
 */
export const ChartLastValueLabel: React.FC<ChartLastValueLabelProps> = (): null => {
    return null;
};

ChartLastValueLabel.displayName = 'ChartLastValueLabel';
