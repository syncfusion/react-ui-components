import { useContext, useEffect } from 'react';
import { PieChartHighlightProps } from '../base/interfaces';
import { ChartContext, ChartProviderChildProps } from '../layout/ChartProvider';
import { defaultChartConfigs } from '../base/default-properties';

/**
 * PieChartHighlight component is used to configure highlight behavior for pie and donut charts.
 *
 * @param {PieChartHighlightProps} props - Defines highlight options such as mode, fill, and pattern.
 * @returns {null} It is used only for passing highlight configuration into the chart through React context.
 */
export const PieChartHighlight: React.FC<PieChartHighlightProps> = (props: PieChartHighlightProps) => {
    const context: ChartProviderChildProps = useContext(ChartContext);

    useEffect(() => {
        context?.setChartHighlight({ ...defaultChartConfigs.ChartHighlight, ...props });
    }, [
        props.mode,
        props.fill,
        props.pattern
    ]);

    return null;
};
