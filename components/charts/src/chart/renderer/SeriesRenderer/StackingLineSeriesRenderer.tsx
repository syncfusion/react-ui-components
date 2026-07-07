import { ChartLocationProps, ChartMarkerProps } from '../../base/interfaces';
import {
    PathCommand,
    Points,
    RenderOptions,
    SeriesProperties,
    StackingSeriesRendererType
} from '../../chart-area/chart-interfaces';
import { applyPointRenderCallback, getPoint } from '../../utils/helper';
import { parsePathCommands } from './AreaSeriesRenderer';
import { LineBase, LineBaseReturnType } from './LineBase';
import MarkerRenderer from './MarkerRenderer';
import { AnimationState, interpolatePathD } from './SeriesAnimation';
/** Type for stacked series end/start value tracking. Used internally for cumulative stacking calculations. */
import { StackValuesType } from './StackingAreaSeriesRenderer';

const lineBaseInstance: LineBaseReturnType = LineBase;

/**
 * Renderer for stacking line series.
 * Follows stacking area logic but renders only top boundary.
 */
export const StackingLineSeriesRenderer: StackingSeriesRendererType = {

    /**
     * Animate the stacking line series path and return animation configuration.
     *
     * @param {RenderOptions} pathOptions - Path options.
     * @param {number} index - Series index.
     * @param {AnimationState} animationState - Animation state.
     * @param {boolean} enableAnimation - Enable animation flag.
     * @param {SeriesProperties} series - Series configuration.
     * @returns { {strokeDasharray: string, strokeDashoffset: number} }- Animation configuration.
     */
    doAnimation: (
        pathOptions: RenderOptions,
        index: number,
        animationState: AnimationState,
        enableAnimation: boolean,
        series: SeriesProperties
    ) => {
        const pathData: string = pathOptions.d as string;
        const isInitialRender: boolean = animationState.isInitialRenderRef.current[index as number] ?? false;
        const isInvertedAxis: boolean = series.chart?.requireInvertedAxis || false;
        const isXAxisInverse: boolean = series.xAxis?.isAxisInverse || false;
        const isYAxisInverse: boolean = series.yAxis?.isAxisInverse || false;
        const id: string = pathOptions.id as string;
        const idParts: string[] = id.split('_');
        const parsedSeriesIndex: number = parseInt(idParts[idParts.length - 1], 10);

        if (!enableAnimation) { return { strokeDasharray: pathOptions.dashArray || 'none', strokeDashoffset: 0 }; }

        if (isInitialRender) {
            if (animationState.animationProgress === 1) {
                animationState.isInitialRenderRef.current[index as number] = false;
                animationState.renderedPathDRef.current[parsedSeriesIndex as number] = pathData;
            }

            const commands: PathCommand[] = parsePathCommands(pathData);
            const axisCoordinates: number[] = commands
                .filter((cmd: PathCommand): boolean => cmd.type !== 'Z' && cmd.coords.length >= 2)
                .map((cmd: PathCommand): number => (isInvertedAxis ? cmd.coords[1] : cmd.coords[0]));

            if (!axisCoordinates.length) {
                return { strokeDasharray: pathOptions.dashArray || 'none', strokeDashoffset: 0 };
            }

            const min: number = Math.min(...axisCoordinates);
            const max: number = Math.max(...axisCoordinates);
            const axisRange: number = max - min;
            const progressDistance: number = axisRange * animationState.animationProgress;

            let clipPath: string = '';
            if (!isInvertedAxis) {
                clipPath = isXAxisInverse ? `inset(0 0 0 ${axisRange - progressDistance}px)` : `inset(0 ${axisRange - progressDistance}px 0 0)`;
            } else {
                clipPath = isYAxisInverse ? `inset(0 0 ${axisRange - progressDistance}px 0)` : `inset(${axisRange - progressDistance}px 0 0 0)`;
            }

            return { strokeDasharray: pathOptions.dashArray || 'none', strokeDashoffset: 0, animatedClipPath: clipPath };
        }

        const previousPath: string | undefined = animationState.renderedPathDRef.current[parsedSeriesIndex as number];
        if (previousPath && previousPath !== pathData) {
            const interpolatedD: string = interpolatePathD(previousPath, pathData, animationState.animationProgress);
            if (animationState.animationProgress === 1) {
                animationState.renderedPathDRef.current[parsedSeriesIndex as number] = pathData; }
            return { strokeDasharray: pathOptions.dashArray || 'none', strokeDashoffset: 0, interpolatedD };
        }

        if (animationState.animationProgress === 1) {
            animationState.renderedPathDRef.current[parsedSeriesIndex as number] = pathData; }
        return { strokeDasharray: pathOptions.dashArray || 'none', strokeDashoffset: 0 };
    },

    /**
     * Build the stacking line path and optional marker render options.
     * Generates SVG path commands for stacking line series, handling stacked values by accumulating
     * from previous stacking series. Supports animation, markers, and multiple empty point modes.
     *
     * @param {SeriesProperties} series - Series configuration with stackedValues, visibility state, and style properties.
     * @param {boolean} isInverted - Axis inversion flag for coordinate transformation.
     * @returns {RenderOptions[]|{options: RenderOptions[], marker: ChartMarkerProps}} Array of path options, or object with options and marker if markers are visible.
     */
    render: (series: SeriesProperties, isInverted: boolean) => {
        let pathDataString: string = '';
        let strokeColor: string | undefined;

        const visiblePoints: Points[] = lineBaseInstance.enableComplexProperty(series) as Points[];
        const visibleSeries: SeriesProperties[] = series.chart.visibleSeries || [];

        let previousStackSeries: SeriesProperties | null = null;
        for (let i: number = (series.index as number) - 1; i >= 0; i--) {
            const previousSeries: SeriesProperties = visibleSeries[i as number];
            if (previousSeries && previousSeries.visible && (previousSeries.type ?? '').includes('Stacking') && previousSeries.yAxisName === series.yAxisName) {
                previousStackSeries = previousSeries;
                break;
            }
        }

        const stackedValues: StackValuesType = series.stackedValues || {};
        const emptyMode: string = (series.emptyPointSettings?.mode || 'Gap').toLowerCase();
        const includeEmpty: boolean = emptyMode === 'zero' || emptyMode === 'average';
        const isEmptyPointArray: boolean[] = visiblePoints
            .map((point: Points): boolean => point.yValue == null || point.yValue === undefined);

        // pointValues stores either actual y-values or interpolated averages (in 'average' mode).
        // In 'zero' mode: empty points treated as 0. In 'average' mode: empty points interpolated.
        let pointValues: number[] = [];
        if (includeEmpty) {
            pointValues = new Array(visiblePoints.length).fill(0);
            // Populate with actual non-empty y-values
            for (let i: number = 0; i < visiblePoints.length; i++) {
                if (!isEmptyPointArray[i as number]) {
                    pointValues[i as number] = (visiblePoints[i as number].yValue as number) || 0;
                }
            }
            // For 'average' mode, interpolate empty points with surrounding valid values
            if (emptyMode === 'average') {
                for (let i: number = 0; i < visiblePoints.length; i++) {
                    if (!isEmptyPointArray[i as number]) { continue; }
                    let prevIndex: number = i - 1;
                    let nextIndex: number = i + 1;
                    // Skip consecutive empty points to find nearest valid values on both sides
                    while (prevIndex >= 0 && isEmptyPointArray[prevIndex as number]) { prevIndex--; }
                    while (nextIndex < visiblePoints.length && isEmptyPointArray[nextIndex as number]) { nextIndex++; }
                    // Calculate average of surrounding valid values:
                    // - If no valid previous value exists (series starts with nulls), default to 0
                    // - If no valid next value exists (series ends with nulls), use prevValue
                    // - If entire series is null, this results in 0 (consistent with 'zero' mode)
                    const prevValue: number = prevIndex >= 0 ? pointValues[prevIndex as number] : 0;
                    const nextValue: number = nextIndex < visiblePoints.length ? pointValues[nextIndex as number] : prevValue;
                    // Average the surrounding values for this empty point
                    pointValues[i as number] = (prevValue + nextValue) / 2;
                }
            }
        }

        let lastSegmentIndex: number = -1;
        for (let i: number = 0; i < visiblePoints.length; i++) {
            const point: Points = visiblePoints[i as number];
            point.symbolLocations ||= [];
            point.regions ||= [];

            const isEmpty: boolean = isEmptyPointArray[i as number];
            if (isEmpty && !includeEmpty) { continue; }

            const pointIndex: number = point.index as number;
            // Get baseline from previous stacking series, or default to 0 for first series
            const baselineStart: number = previousStackSeries ?
                (previousStackSeries.stackedValues?.endValues?.[pointIndex as number] ?? 0) : 0;
            let stackedTotal: number;
            if (includeEmpty) {
                // In empty-inclusive modes, use interpolated/zero-filled values
                stackedTotal = baselineStart + (pointValues[i as number] ?? 0);
            }
            else {
                // In gap mode, use pre-calculated stacked values from chart framework
                const startValue: number = stackedValues?.startValues?.[pointIndex as number] ?? 0;
                const endValue: number = stackedValues?.endValues?.[pointIndex as number] ?? 0;
                const stackDelta: number = endValue - startValue;
                stackedTotal = baselineStart + stackDelta;
            }

            const renderedYValue: number = (!series.visible && (series.isLegendClicked ?? false)) ? baselineStart : stackedTotal;
            const location: ChartLocationProps = getPoint(point.xValue as number, renderedYValue, series.xAxis, series.yAxis, isInverted);
            point.symbolLocations.push(location);

            const pointColor: string = applyPointRenderCallback({
                seriesIndex: series.index as number, color: series.interior as string,
                xValue: point.xValue, yValue: point.yValue
            }, series.chart);
            point.interior = pointColor;
            if (!strokeColor) { strokeColor = pointColor; }

            const isNewSegment: boolean = lastSegmentIndex === -1 || (i > lastSegmentIndex + 1 && emptyMode === 'gap');
            pathDataString += isNewSegment ? `M ${location.x} ${location.y}` : ` L ${location.x} ${location.y}`;
            lastSegmentIndex = i;
        }

        series.visiblePoints = visiblePoints.filter((point: Points): boolean => !!point.symbolLocations?.length);

        const id: string = `${series.chart.element.id}_Series_${series.index}`;
        const options: RenderOptions[] = [{
            id, fill: 'none', strokeWidth: series.width || 2, stroke: strokeColor || series.interior,
            opacity: series.opacity, dashArray: series.dashArray, d: pathDataString
        }];

        const marker: ChartMarkerProps | null = series.visible && series.marker?.visible ?
            MarkerRenderer.render(series) as ChartMarkerProps : null;
        return marker ? { options, marker } : options;
    }
};

export default StackingLineSeriesRenderer;
