// ChartAreaRenderer.tsx
import { useLayout } from '../layout/LayoutContext';
import { ChartAreaProps } from '../base/interfaces';
import { useEffect, useLayoutEffect, useState } from 'react';
import { useRegisterClipRectSetter, useUnregisterClipRectSetter } from '../hooks/useClipRect';
import { Chart, Rect } from '../chart-area/chart-interfaces';

/**
 * `ChartAreaRenderer` is a functional component responsible for rendering the main plotting area of the chart.
 * It manages the clip rectangle used to restrict drawing within the chart bounds and integrates with
 * the layout system for measurement and positioning.
 *
 * @param {ChartAreaProps} props - The properties required for rendering the chart area,
 * including background, border, and layout-related settings.
 * @returns {React.JSX.Element | null} The rendered chart area or null if not applicable.
 */
export const ChartAreaRenderer: React.FC<ChartAreaProps> = (props: ChartAreaProps) => {
    const { layoutRef, phase, setLayoutValue, reportMeasured, triggerRemeasure } = useLayout();
    const [clipRect, setClip] = useState<Rect | null>(null);
    const registerClipRect: (fn: (clipRect: Rect) => void) => void = useRegisterClipRectSetter();
    const unregisterClipRect: () => void = useUnregisterClipRectSetter();

    /**
     * Sets the clipping rectangle for the chart area.
     * This rectangle defines the boundaries where chart content can be drawn.
     *
     * @param {Rect} rect - The rectangle coordinates and dimensions
     * @returns {void} - cha
     */
    const setClipRect: (rect: Rect) => void =
        (rect: Rect): void => {
            setClip(rect);
        };

    useEffect(() => {
        registerClipRect(setClipRect);
        return () => {
            // clear the stored setter on unmount to break retaining path
            unregisterClipRect();
        };
    }, [registerClipRect]);

    useLayoutEffect(() => {
        if (phase === 'measuring') {
            const chart: Chart = layoutRef.current.chart as Chart;
            const borderWidth: number = props.border?.width as number;
            chart.clipRect.x = chart.clipRect.x + (props.margin?.left || 0);
            chart.clipRect.width = chart.clipRect.width - (props.margin?.left || 0) - (props.margin?.right || 0);
            chart.clipRect.y = chart.clipRect.y + borderWidth / 2 + (props.margin?.top || 0);
            chart.clipRect.height = chart.clipRect.height + borderWidth / 2 - (props.margin?.top || 0) - (props.margin?.bottom || 0);
            chart.chartAreaRect = {
                x: chart.clipRect.x,
                y: chart.clipRect.y,
                width: chart.clipRect.width,
                height: chart.clipRect.height
            };
            setLayoutValue('chartArea', {
                clipRect: { ...chart.clipRect, ...clipRect }
            });
            setClip(chart.clipRect);
        }
        reportMeasured('ChartArea');

    }, [phase, layoutRef]);

    useEffect(() => {
        if (phase !== 'measuring') {
            triggerRemeasure();
        }
    }, [props.width, props.border?.width]);

    const chart: Chart = layoutRef.current.chart as Chart;
    return phase === 'rendering' && (
        <>
            {props.backgroundImage && <image
                id={chart.element?.id + '_ChartAreaBackground'}
                href={props.backgroundImage}
                x={chart.clipRect.x}
                y={chart.clipRect.y}
                width={chart.clipRect.width}
                height={(chart.clipRect.height)}
                visibility="visible"
                style={{ transition: 'all 0.4s ease' }}
            />
            }
            <rect
                id={chart.element?.id + '_ChartAreaBorder'}
                x={chart.clipRect.x}
                y={(chart.clipRect.y)}
                width={chart.clipRect.width}
                height={(chart.clipRect.height)}
                fill={props.background}
                stroke={props.border?.color || chart.themeStyle.areaBorder}
                strokeWidth={props.border?.width}
                strokeDasharray={props.border?.dashArray}
                opacity={props.opacity}
                style={{ transition: 'all 0.4s ease' }}
            />
        </>
    );
};
