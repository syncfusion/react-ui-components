import { useContext, useEffect } from 'react';
import { ChartHighlightProps } from '../base/interfaces';
import { ChartContext } from '../layout/ChartProvider';
import { defaultChartConfigs } from '../base/default-properties';
import { ChartProviderChildProps } from '../chart-area/chart-interfaces';

/**
 * ChartHighlight component applies highlight settings to the chart.
 *
 * This component is non-visual and updates the chart context with highlight configuration
 * such as mode, color, and pattern when mounted.
 *
 * @param {ChartHighlightProps} props - Highlight configuration properties.
 * @returns {null} - It is used only to pass the highlight configuration to the chart through the React context.
 */
export const ChartHighlight: React.FC<ChartHighlightProps> = (props: ChartHighlightProps) => {
    const context: ChartProviderChildProps = useContext(ChartContext);
    useEffect(() => {
        context?.setChartHighlight({ ...defaultChartConfigs.ChartHighlight, ...props });
    }, [props.mode,
        props.fill,
        props.pattern
    ]);
    return null;
};
