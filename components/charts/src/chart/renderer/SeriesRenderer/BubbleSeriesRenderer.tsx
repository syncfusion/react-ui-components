
import { ChartLocationProps, EmptyPointSettings } from '../../base/interfaces';
import { drawSymbol, getPoint, withInRange } from '../../utils/helper';
import { BubbleSeriesType, MarkerElementData, MarkerOptions, MarkerProperties, PointRenderingEvent, Points, RenderOptions, SeriesProperties } from '../../chart-area/chart-interfaces';
import { markerAnimate } from './MarkerRenderer';

/**
 * The `BubbleSeries` module is used to render the bubble series.
 */
const BubbleSeries: BubbleSeriesType = {
    /**
     * Renders the Bubble series.
     *
     * @param {SeriesProperties} series - The series to be rendered.
     * @param {boolean} isInverted - Specifies whether the chart is inverted.
     * @returns {Object} Returns the final series with assigned data point properties.
     */
    render: (series: SeriesProperties, isInverted: boolean):
    { options: RenderOptions[]; marker: MarkerProperties } => {
        series.isRectSeries = false;

        const visiblePoints: Points[] = series.points;

        const chartAreaLength: number = Math.max(
            series.chart.chartAxislayout.initialClipRect.height,
            series.chart.chartAxislayout.initialClipRect.width
        );
        const percentChange: number = chartAreaLength / 100;
        let maxRadius: number = (series.maxRadius as number) * percentChange;
        let minRadius: number = (series.minRadius as number) * percentChange;
        let maxSize: number | null = series.sizeMax ?? null;

        if (series.maxRadius == null || series.minRadius == null) {
            for (const value of series.chart.visibleSeries) {
                if (value.type === 'Bubble' && value.visible === true && (value.maxRadius === null || value.minRadius === null)) {
                    maxSize = value.sizeMax > maxSize ? value.sizeMax : maxSize;
                }
            }
            minRadius = maxRadius = 1;
        }
        const radius: number = maxRadius - minRadius;
        const markerOptionsList: MarkerOptions[] = [];

        const emptyPointFillColor: string = (series.emptyPointSettings as EmptyPointSettings).fill
            || series.interior;
        const emptyPointBorderColor: string = (series.emptyPointSettings as EmptyPointSettings).border?.color
            || series.border?.color || series.interior;
        const emptyPointBorderWidth: number = (series.emptyPointSettings as EmptyPointSettings).border?.width
            ?? series.border?.width as number;

        const maxValue: number = (chartAreaLength / 5) / 2;

        for (const bubblePoint of visiblePoints) {
            bubblePoint.symbolLocations = [];
            bubblePoint.regions = [];

            const isEmptyPoint: boolean = bubblePoint.isEmpty || bubblePoint.yValue === null;

            if (
                bubblePoint.visible &&
                withInRange(
                    visiblePoints[bubblePoint.index - 1],
                    bubblePoint,
                    visiblePoints[bubblePoint.index + 1],
                    series
                )
            ) {
                let bubbleRadius: number;
                if (series.maxRadius == null || series.minRadius == null) {
                    minRadius = maxRadius = 1;
                    const calculatedRadius: number = maxValue;
                    bubbleRadius = maxSize && bubblePoint.size ?
                        calculatedRadius * Math.abs(+bubblePoint.size / maxSize) :
                        minRadius;
                } else {
                    const sizeValue: number = bubblePoint?.size as number;
                    bubbleRadius = minRadius + (radius) * Math.abs(+sizeValue / (maxSize));
                }
                bubbleRadius = bubbleRadius || minRadius;
                const yValue: number = bubblePoint?.yValue as number;
                const location: ChartLocationProps = getPoint(
                    bubblePoint?.xValue as number,
                    yValue,
                    series?.xAxis,
                    series?.yAxis,
                    isInverted
                );
                bubblePoint.symbolLocations.push(location);
                const pointId: string = `${series.chart.element.id}_Series_${series.index}_Point_${bubblePoint.index}`;
                let fillColor: string = isEmptyPoint ? emptyPointFillColor : (bubblePoint.interior || series.interior);
                let strokeColor: string = isEmptyPoint ? emptyPointBorderColor : series.border?.color || series.fill as string;
                let pointWidth: number = bubbleRadius * 2;
                let pointHeight: number = bubbleRadius * 2;
                let pointBorderWidth: number = isEmptyPoint ? emptyPointBorderWidth : series.border?.width as number;

                const pointRenderArgs: PointRenderingEvent = {
                    cancel: false,
                    seriesName: series.name as string,
                    point: bubblePoint,
                    fill: fillColor,
                    border: {
                        color: strokeColor,
                        width: pointBorderWidth
                    },
                    markerWidth: pointWidth,
                    markerHeight: pointHeight
                };

                // Create region for bubble point tooltip
                bubblePoint.regions.push({
                    x: bubblePoint.symbolLocations[0].x - bubbleRadius,
                    y: bubblePoint.symbolLocations[0].y - bubbleRadius,
                    width: 2 * bubbleRadius,
                    height: 2 * bubbleRadius
                });

                bubblePoint.color = pointRenderArgs.fill as string;
                fillColor = pointRenderArgs.fill as string;
                strokeColor = pointRenderArgs.border.color as string;
                pointBorderWidth = pointRenderArgs.border.width as number;
                pointWidth = pointRenderArgs.markerWidth as number;
                pointHeight = pointRenderArgs.markerHeight as number;
                const shapeOpts: Element = drawSymbol(
                    location,
                    'Circle',
                    { width: pointWidth, height: pointHeight },
                    series.marker?.imageUrl as string,
                    {
                        fill: fillColor,
                        stroke: strokeColor,
                        id: pointId,
                        strokeWidth: pointBorderWidth,
                        strokeDasharray: series.border?.dashArray as string,
                        opacity: series.opacity as number,
                        d: ''
                    }
                );

                bubblePoint.marker = {
                    border: {
                        color: strokeColor,
                        width: pointBorderWidth,
                        dashArray: series.border?.dashArray as string
                    },
                    fill: fillColor,
                    height: pointHeight,
                    width: pointWidth,
                    visible: true,
                    shape: 'Circle'
                };

                const markerOption: MarkerOptions = {
                    ...shapeOpts,
                    shape: 'Circle',
                    cx: location.x,
                    cy: location.y,
                    rx: bubbleRadius,
                    ry: bubbleRadius,
                    isEmptyPoint: isEmptyPoint,
                    fill: fillColor,
                    stroke: strokeColor,
                    strokeWidth: pointBorderWidth as number,
                    border: {
                        color: strokeColor,
                        width: pointBorderWidth,
                        dashArray: series.border?.dashArray as string
                    },
                    opacity: series.opacity as number
                };
                markerOptionsList.push(markerOption);
            }
        }
        const pathOptions: RenderOptions[] = [];

        return {
            options: pathOptions,
            marker: {
                markerOptionsList,
                symbolGroup: {
                    id: `${series.chart.element.id}_Series_${series.index}_SymbolGroup`,
                    transform: `translate(${series.clipRect?.x}, ${series.clipRect?.y})`
                }
            }
        };
    },

    /**
     * Animates the Bubble points.
     *
     * @param {SeriesProperties} series - Series which should be animated.
     * @returns {Function} Returns the animated points.
     */
    doAnimation: (series: SeriesProperties) => {
        const duration: number = series.animation?.duration as number;
        const delay: number = series.animation?.delay as number;
        const rectElements: NodeList = series.seriesElement.childNodes;
        let count: number = 1;

        for (const point of series.points) {
            if (!(point.symbolLocations as ChartLocationProps[]).length || !rectElements[count as number]) {
                continue;
            }

            // Create a MarkerElementData object
            const markerData: MarkerElementData = {
                // For elliptical markers (most common in scatter charts)
                rx: point.marker?.width ? point.marker.width / 2 : 5,
                ry: point.marker?.height ? point.marker.height / 2 : 5,

                // For circular markers
                r: point.marker?.width ? point.marker.width / 2 : 5,

                // Opacity
                opacity: point.marker?.opacity !== undefined ? point.marker.opacity : 1,

                // Optional animation tracking data if needed
                _animationData: {
                    originalX: point.symbolLocations?.[0]?.x,
                    originalY: point.symbolLocations?.[0]?.y,
                    targetX: point.symbolLocations?.[0]?.x,
                    targetY: point.symbolLocations?.[0]?.y
                }
            };

            markerAnimate(markerData, delay as number, duration as number);
            count++;
        }
    }
};

export default BubbleSeries;
