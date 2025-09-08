import { useEffect, useState } from 'react';
import { useLayout } from '../../layout/LayoutContext';
import { useAxisOutsideRendereVersion } from '../../hooks/useClipRect';
import { AxisModel, Chart } from '../../chart-area/chart-interfaces';


/**
 * Renders axis elements that are positioned outside the main chart area.
 * This includes labels, tick lines, and borders for axes that are not rendered within the chart bounds.
 *
 * @returns {Element} - Returns the JSX elements representing axis labels and tick lines.
 */
export const AxisOutsideRenderer: React.FC = () => {
    const { layoutRef, phase } = useLayout();
    const chart: Chart = layoutRef.current.chart as Chart;

    const [, setTrigger] = useState<number>(0);
    const axesChanged: number = useAxisOutsideRendereVersion();

    /**
     * React effect hook that triggers an update to the `trigger` state
     * whenever the `axesChanged` dependency changes, but only if the current phase is not 'measuring'.
     *
     * @remarks
     * This is typically used to re-render or recalculate chart layout or measurements
     * after axis changes, excluding the measuring phase to avoid unnecessary updates.
     *
     * @dependency axesChanged - A flag or value indicating that the chart axes have changed.
     */
    useEffect(() => {
        if (phase !== 'measuring') {
            setTrigger((prev: number) => prev + 1);
        }
    }, [axesChanged]);
    // Don't render while measuring
    if (phase === 'measuring') {
        return null;
    }
    return (
        <g id={chart.element.id + '_AxisOutsideCollection'}>
            {chart.axisCollection.map((axis: AxisModel, idx: number) => {
                return (
                    <g
                        id={chart.element.id + '_AxisGroup_' + idx + '_Inside'}
                        key={idx}
                    >

                        {axis.visible && axis.orientation === 'Vertical' && (
                            <>
                                <defs>
                                    <clipPath id={`${chart.element.id}_Axis_${idx}_Clip`}>
                                        <rect x={0}
                                            y={chart.chartAreaRect.y - (axis.majorGridLines.width as number)}
                                            width={chart.chartAreaRect.width + chart.chartAreaRect.x}
                                            height={chart.chartAreaRect.height + (axis.majorGridLines.width as number)} />
                                    </clipPath>
                                </defs>
                                {axis.labelStyle.position === 'Inside' && axis.labelElement}
                                {axis.tickPosition === 'Inside' && axis.majorTickLineElement}
                                {axis.tickPosition === 'Inside' && axis.minorTickLineElement}
                                {axis.labelStyle.position === 'Inside' && axis.borderElement}
                            </>
                        )}

                        {axis.visible && axis.orientation === 'Horizontal' && (
                            <>
                                <defs>
                                    <clipPath id={`${chart.element.id}_Axis_${idx}_Clip`}>
                                        <rect x={chart.clipRect.x} y={chart.chartAreaRect.y}
                                            width={chart.chartAreaRect.width} height={chart.chartAreaRect.height} />
                                    </clipPath>
                                </defs>
                                {axis.labelStyle.position === 'Inside' && axis.labelElement}
                                {axis.tickPosition === 'Inside' && axis.majorTickLineElement}
                                {axis.tickPosition === 'Inside' && axis.minorTickLineElement}
                                {axis.labelStyle.position === 'Inside' && axis.borderElement}
                            </>
                        )}
                    </g>
                );
            })}
        </g>
    );
};
