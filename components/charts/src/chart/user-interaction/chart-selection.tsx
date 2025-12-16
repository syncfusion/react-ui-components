import { useContext, useEffect } from 'react';
import { ChartSelectionProps } from '../base/interfaces';
import { ChartContext } from '../layout/ChartProvider';
import { defaultChartConfigs } from '../base/default-properties';
import { ChartProviderChildProps } from '../chart-area/chart-interfaces';

/**
 * ChartSelection component applies selection settings to the chart.
 *
 * This component is non-visual and updates the chart context with selection configuration
 * such as mode, multi-select, selected indexes, and pattern when mounted.
 *
 * @param {ChartSelectionProps} props - Selection configuration properties.
 * @returns {null} This component does not render any UI and returns null.
 */
export const ChartSelection: React.FC<ChartSelectionProps> = (props: ChartSelectionProps) => {
    const context: ChartProviderChildProps = useContext(ChartContext);
    useEffect(() => {
        context?.setChartSelection({ ...defaultChartConfigs.ChartSelection, ...props });
    }, [props.mode,
        props.allowMultiSelection,
        props.selectedDataIndexes,
        props.pattern
    ]);
    return null;
};
