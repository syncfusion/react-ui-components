import { MajorGridLines } from '../base/interfaces';


/**
 * ChartMinorGridLines component for configuring the appearance of minor grid lines in the chart.
 * This is a configuration-only component and does not render any visual output.
 *
 * @returns {null} - It is used only to pass the minor grid lines configuration to the chart through the React context.
 */
export const ChartMinorGridLines: React.FC<MajorGridLines> = () => {
    return null;
};

ChartMinorGridLines.displayName = 'MinorGridLines';
