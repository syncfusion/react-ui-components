import { useContext, useEffect } from 'react';
import { PieChartSelectionProps } from '../base/interfaces';
import { ChartContext, ChartProviderChildProps } from '../layout/ChartProvider';
import { defaultChartConfigs } from '../base/default-properties';

/**
 * PieChartSelection component is used to configure selection behavior for pie and donut charts
 *
 * This component is non-visual and updates the pie and donut chart context with selection configuration
 * such as mode, multi-select, selected indexes, and pattern when mounted.
 *
 * @param {PieChartSelectionProps} props - Defines selection options such as mode, allowMultiSelection, selectedDataIndexes, and pattern.
 * @returns {null} It is used only for passing selection configuration into the chart through React context.
 */
export const PieChartSelection: React.FC<PieChartSelectionProps> = (props: PieChartSelectionProps) => {
    const context: ChartProviderChildProps = useContext(ChartContext);

    useEffect(() => {
        context?.setChartSelection({ ...defaultChartConfigs.ChartSelection, ...props });
    }, [
        props.mode,
        props.allowMultiSelection,
        props.selectedDataIndexes,
        props.pattern
    ]);
    return null;
};
