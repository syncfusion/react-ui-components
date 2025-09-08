import { ChartLocationProps, EmptyPointSettings } from '../../base/interfaces';
import { drawSymbol, getPoint, withInRange } from '../../utils/helper';
import { LineBase, LineBaseReturnType } from './LineBase';
import { ChartMarkerShape } from '../../base/enum';
import { MarkerElementData, MarkerOptions, MarkerProperties, PointRenderingEvent, Points, RenderOptions, ScatterSeriesType, SeriesProperties } from '../../chart-area/chart-interfaces';
import { markerAnimate } from './MarkerRenderer';

export const SCATTER_MARKER_SHAPES: ChartMarkerShape[] = [
    'Circle', 'Triangle', 'Diamond', 'Rectangle',
    'Pentagon', 'InvertedTriangle', 'VerticalLine',
    'Cross', 'Plus', 'HorizontalLine', 'Star'] as const;
const isLineShapeMarker: (shape: string) => boolean =  (shape: string) =>
    shape === 'HorizontalLine' || shape === 'VerticalLine' || shape === 'Cross';

const lineBaseInstance: LineBaseReturnType = LineBase;

const ScatterSeriesRenderer: ScatterSeriesType = {
    /**
     * Renders the scatter series.
     *
     * @param {SeriesProperties} series - The series to be rendered.
     * @param {boolean} isInverted - Specifies whether the chart is inverted.
     * @returns {Object} Returns the final series with assigned data point properties.
     */
    render: (series: SeriesProperties, isInverted: boolean):
    { options: RenderOptions[]; marker: MarkerProperties } => {
        series.isRectSeries = false;
        const marker: MarkerProperties = series.marker as MarkerProperties;

        if (!series.marker) {
            series.marker = {
                visible: true,
                shape: 'Circle',
                width: 5,
                height: 5,
                opacity: 1
            };
        } else if (series.marker.visible === undefined) {
            series.marker.visible = true;
        }
        const visiblePoints: Points[] = lineBaseInstance.enableComplexProperty(series);
        const markerShape: ChartMarkerShape = marker?.shape || SCATTER_MARKER_SHAPES[series.index % SCATTER_MARKER_SHAPES.length];
        if (!visiblePoints || visiblePoints?.length === 0) {
            return {
                options: [],
                marker: {}
            };
        }

        const markerOptionsList: MarkerOptions[] = [];

        /**
         * Determines the border properties of each scatter points.
         * * color - whether the color of series or marker.
         * * width - whether the width of series or marker.
         * * dashArray - whether the dimension of series or marker.
         */
        const scatterBorder: {
            width: number;
            color: string;
            dashArray: string;
        } = {
            width: isLineShapeMarker(markerShape)
                ? series.width as number
                : series.border?.width as number,
            color: isLineShapeMarker(markerShape)
                ? series.interior
                : series.border?.color ?? series.interior,
            dashArray: isLineShapeMarker(markerShape)
                ? series.dashArray as string
                : series.border?.dashArray as string
        };

        for (const point of visiblePoints) {
            point.regions = [];

            if (
                point.visible &&
                withInRange(
                    series.points[point.index - 1],
                    point,
                    series.points[point.index + 1],
                    series
                )
            ) {
                const markerOption: MarkerOptions = ScatterSeriesRenderer.renderPoint(
                    point,
                    series,
                    markerShape,
                    scatterBorder,
                    isInverted
                ) as MarkerOptions;

                if (markerOption) {
                    markerOptionsList.push(markerOption);
                }
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
     * Renders scatters in each point.
     *
     * @param {Points} point - Respective data points.
     * @param {SeriesProperties} series - Indicates the current series.
     * @param {ChartMarkerShape} markerShape - Represents the shape of markers.
     * @param {Object} scatterBorder - Border properties of scatter points.
     * @param {boolean} isInverted - Indicates whether the chart is inverted or not.
     * @returns {MarkerOptions} Returns the data points with finally assigned marker properties.
     */
    renderPoint: (
        point: Points,
        series: SeriesProperties,
        markerShape: ChartMarkerShape,
        scatterBorder: { width: number; color: string; dashArray: string },
        isInverted: boolean
    ): MarkerOptions | null => {
        const marker: MarkerProperties = series.marker as MarkerProperties;
        const location: ChartLocationProps = getPoint(
            point?.xValue as number,
            point?.yValue as number,
            series?.xAxis,
            series?.yAxis,
            isInverted
        );

        const isEmptyPoint: boolean = point.isEmpty || point.yValue === null;

        const emptyPointFillColor: string = (series.emptyPointSettings as EmptyPointSettings).fill
            || series.interior;
        const emptyPointBorderColor: string = (series.emptyPointSettings as EmptyPointSettings).border?.color
            || series.border?.color || series.interior;
        const emptyPointBorderWidth: number = (series.emptyPointSettings as EmptyPointSettings).border?.width
            ?? series.border?.width as number;

        let fill: string = isEmptyPoint ? emptyPointFillColor : (point.interior || series.interior);
        let border: { color: string; width: number; } = {
            color: isEmptyPoint ? emptyPointBorderColor : scatterBorder.color,
            width: isEmptyPoint ? emptyPointBorderWidth : scatterBorder.width
        };
        let height: number = marker.height as number;
        let width: number = marker.width as number;
        let shape: ChartMarkerShape = markerShape as ChartMarkerShape;

        point.marker = {
            border: border, fill: fill,
            height: marker.height, visible: true,
            width: marker.width, shape: markerShape, imageUrl: marker.imageUrl
        };

        const argsData: PointRenderingEvent = {
            cancel: false,
            seriesName: series.name as string,
            point: point,
            fill: fill,
            border: border,
            markerHeight: marker.height as number,
            markerWidth: marker.width as number,
            markerShape: markerShape
        };

        fill = argsData.fill;
        border = argsData.border as {
            color: string;
            width: number;
        };

        height = argsData.markerHeight as number;
        width = argsData.markerWidth as number;
        shape = argsData.markerShape as ChartMarkerShape;

        point.marker = {
            border: argsData.border, fill: argsData.fill,
            height: argsData.markerHeight, visible: true,
            width: argsData.markerWidth, shape: argsData.markerShape, imageUrl: marker.imageUrl
        };

        point.color = argsData.fill;

        (point.symbolLocations as ChartLocationProps[])?.push(location);

        // Add region for the scatter point tooltip detection
        point.regions?.push({
            x: location.x - (width / 2),
            y: location.y - (height / 2),
            width: width,
            height: height
        });

        const pointId: string = `${series.chart.element.id}_Series_${series.index}_Point_${point.index}`;

        const shapeOpts: Element = drawSymbol(
            location,
            shape,
            { width: width as number, height: height as number },
            marker.imageUrl as string,
            {
                fill: fill,
                stroke: border.color,
                id: pointId,
                strokeWidth: border.width as number,
                strokeDasharray: scatterBorder.dashArray as string,
                opacity: series.opacity as number,
                d: ''
            }
        );

        return {
            ...shapeOpts,
            shape: shape,
            fill: fill,
            border: border,
            opacity: series.opacity as number,
            cx: location.x,
            cy: location.y,
            rx: width / 2,
            ry: height / 2,
            id: pointId,
            stroke: border.color || series.border?.color || fill,
            strokeWidth: border.width || series.border?.width
        };
    },

    /**
     * Animates the scatter points.
     *
     * @param {SeriesProperties} series - Series which should be animated.
     * @returns {Function} Returns the animated points.
     */
    doAnimation: (series: SeriesProperties) => {
        const duration: number = series.animation?.duration as number;
        const delay: number = series.animation?.delay as number;
        const rectElements: NodeList = series?.seriesElement?.childNodes;
        let count: number = 1;

        for (const point of series.points) {
            if (!(point.symbolLocations as ChartLocationProps[])?.length || !rectElements[count as number]) {
                continue;
            }

            // Create a MarkerElementData object
            const markerData: MarkerElementData = {
                // For elliptical markers (most common in scatter charts)
                rx: point.marker?.width,
                ry: point.marker?.height,

                // For circular markers
                r: point.marker?.width,

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

export default ScatterSeriesRenderer;
