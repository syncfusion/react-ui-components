import { MinorTickLines } from '../base/interfaces';

/**
 * ChartMinorTickLines component for configuring the appearance of minor tick lines on chart axes.
 * This is a configuration-only component and does not render any visual output.
 *
 * @returns {null} - It is used only to pass the minor tick lines configuration to the chart through the React context.
 */
export const ChartMinorTickLines: React.FC<MinorTickLines> = () => {
    return null;
};

ChartMinorTickLines.displayName = 'MinorTickLines';
