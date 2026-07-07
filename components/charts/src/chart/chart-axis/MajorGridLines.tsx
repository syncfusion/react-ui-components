import { MajorGridLines } from '../base/interfaces';

/**
 * ChartMajorGridLines component for configuring the appearance of major grid lines in the chart.
 * This is a configuration-only component and does not render any visual output.
 *
 * @returns {null} - It is used only to pass the major gridlines configuration to the chart through the React context.
 */
export const ChartMajorGridLines: React.FC<MajorGridLines> = () => {
    return null;
};

ChartMajorGridLines.displayName = 'MajorGridLines';
