import { ChartAxisLabelProps } from './base';

/**
 * ChartAxisLabel component for configuring the style of axis labels in the chart.
 * This component is used as a configuration-only component and does not render any output.
 *
 * @returns {null} - It is used only to pass the axis label configuration to the chart through the React context.
 */
export const ChartAxisLabel: React.FC<ChartAxisLabelProps> = () => {
    return null;
};

ChartAxisLabel.displayName = 'ChartAxisLabel';
