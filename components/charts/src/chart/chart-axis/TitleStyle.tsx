import { ChartAxisTitleProps } from './base';

/**
 * ChartAxisTitle component for configuring the style of axis titles in the chart.
 * This is a configuration-only component and does not render any visual output.
 *
 * @returns {null} - It is used only to pass the axis title configuration to the chart through the React context.
 */
export const ChartAxisTitle: React.FC<ChartAxisTitleProps> = () => {
    return null;
};

ChartAxisTitle.displayName = 'TitleStyle';
