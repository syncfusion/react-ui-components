import { EmptyPointSettings, ChartMarkerProps, ChartLocationProps } from '../../base/interfaces';
import { StepPosition } from '../../base/enum';
import { getPoint } from '../../utils/helper';
import { LineBase, LineBaseReturnType } from './LineBase';
import MarkerRenderer from './MarkerRenderer';
import { calculatePathAnimation } from './SeriesAnimation';
import { Points, RenderOptions, SeriesProperties, StepLineSeriesType } from '../../chart-area/chart-interfaces';

const lineBaseInstance: LineBaseReturnType = LineBase;
const StepLineSeriesRenderer: StepLineSeriesType = {
    previousX: 0,
    previousY: 0,

    /**
     * Animates the step line while rendering.
     *
     * @param {RenderOptions} pathOptions - The rendering options for the step line path.
     * @param {number} index - The index of the current series in the chart.
     * @param {Object} animationState - Represent the state of animation and its properties.
     * @param {boolean} enableAnimation - Flag indicating whether animation should be performed.
     * @param {SeriesProperties} _currentSeries - The current series being rendered.
     * @param {Points | undefined} _currentPoint - The current point being rendered.
     * @param {number} _pointIndex - The index of the current point.
     * @param {SeriesProperties[]} [visibleSeries] - Optional array of all visible series in the chart.
     * @returns {RenderOptions} The animated render options with interpolated path data
     */
    doAnimation: (
        pathOptions: RenderOptions,
        index: number,
        animationState: {
            previousPathLengthRef: React.RefObject<number[]>;
            isInitialRenderRef: React.RefObject<boolean[]>;
            renderedPathDRef: React.RefObject<string[]>;
            animationProgress: number;
            isFirstRenderRef: React.RefObject<boolean>;
            previousSeriesOptionsRef: React.RefObject<RenderOptions[][]>;
        },
        enableAnimation: boolean,
        _currentSeries: SeriesProperties,
        _currentPoint: Points | undefined,
        _pointIndex: number,
        visibleSeries? : SeriesProperties[]
    ) => {
        return calculatePathAnimation(pathOptions, index, animationState, enableAnimation, visibleSeries);
    },

    /**
     * Renders the step line series.
     *
     * @param {SeriesProperties} series - The series to be rendered.
     * @param {boolean} isInverted - Specifies whether the chart is inverted.
     * @returns {Object} Returns step line with markers if enabled.
     */
    render: (series: SeriesProperties, isInverted: boolean):
    RenderOptions[] | { options: RenderOptions[]; marker: ChartMarkerProps } => {
        let direction: string = '';
        let prevPoint: Points | null = null;
        let startPoint: string = 'M';
        const getCoordinate: Function = getPoint;
        const isDrop: boolean = ((series.emptyPointSettings as EmptyPointSettings).mode === 'Drop') as boolean;
        const visiblePoints: Points[] = lineBaseInstance.enableComplexProperty(series);

        for (const point of visiblePoints) {
            point.regions = [];
            point.symbolLocations = [];

            if (point.visible && point.yValue !== null && point.yValue !== undefined) {
                if (prevPoint != null) {
                    const point1: ChartLocationProps = getCoordinate(
                        prevPoint.xValue, prevPoint.yValue, series.xAxis, series.yAxis, isInverted, series
                    );
                    const point2: ChartLocationProps = getCoordinate(
                        point.xValue, point.yValue, series.xAxis, series.yAxis, isInverted, series
                    );
                    const stepType: StepPosition = series.step as StepPosition;
                    direction += lineBaseInstance.getStepLineDirection(
                        point2, point1, stepType, startPoint, series, false
                    );
                } else {
                    // First point in a segment
                    const point1: ChartLocationProps = getCoordinate(
                        point.xValue, point.yValue, series.xAxis, series.yAxis, isInverted, series
                    );
                    direction += `${startPoint} ${point1.x} ${point1.y} `;
                }
                startPoint = 'L';
                prevPoint = point;
                lineBaseInstance.storePointLocation(point, series, isInverted, getCoordinate);

                if (direction === '') {
                    direction = 'M ' + point.symbolLocations[0].x + ' ' + point.symbolLocations[0].y;
                }
            } else {
                // Handle empty points based on mode
                prevPoint = isDrop ? prevPoint : null;
                startPoint = isDrop ? startPoint : 'M';
            }
        }

        series.visiblePoints = visiblePoints;
        const name: string = series.chart.element.id + '_Series_' + series.index;
        const options: RenderOptions[] = [{
            id: name,
            fill: 'none',
            strokeWidth: series.width,
            stroke: series.interior,
            opacity: series.opacity,
            dashArray: series.dashArray,
            d: direction
        }];
        const marker: ChartMarkerProps | null = series.marker?.visible
            ? MarkerRenderer.render(series) as ChartMarkerProps : null;
        return marker ? { options, marker } : options;
    }
};

/**
 * Interpolating  the path of the step line series.
 *
 * @param {string} sourcePath - The source path of the step line series.
 * @param {string} targetPath - The target path of the step line series.
 * @param {number} progress - The progress of the animation.
 * @param {string} step - The step type of the step line series.
 * @returns {string} - The interpolated path of the step line series.
 * @private
 */
export function interpolateSteplinePathD(
    sourcePath: string,
    targetPath: string,
    progress: number,
    step: string = 'Center'
): string {
    // Parse the path data
    const sourcePoints: [number, number][] = parseStepPath(sourcePath);
    const targetPoints: [number, number][] = parseStepPath(targetPath);

    // If we have different numbers of points, handle specially
    if (sourcePoints.length !== targetPoints.length) {
        // For removing points, we'll animate the disappearance
        if (sourcePoints.length > targetPoints.length) {
            const interpolatedPoints: [number, number][] = [];
            // Keep the points that are in the destination
            for (let i: number = 0; i < targetPoints.length; i++) {
                const x: number = sourcePoints[i as number][0] + (targetPoints[i as number][0] - sourcePoints[i as number][0]) * progress;
                const y: number = sourcePoints[i as number][1] + (targetPoints[i as number][1] - sourcePoints[i as number][1]) * progress;
                interpolatedPoints.push([x, y]);
            }
            return generateStepLinePath(interpolatedPoints, step);
        }
    }

    // For equal length paths, interpolate each coordinate
    const interpolatedPoints: [number, number][] = sourcePoints.map((sourcePoint: [number, number], i: number) => {
        const targetPoint: [number, number] = targetPoints[Math.min(i, targetPoints.length - 1)];
        return [
            sourcePoint[0] + (targetPoint[0] - sourcePoint[0]) * progress,
            sourcePoint[1] + (targetPoint[1] - sourcePoint[1]) * progress
        ] as [number, number];
    });

    return generateStepLinePath(interpolatedPoints, step);
}

/**
 * Parses a step line path data string into an array of points.
 *
 * @param {string} pathData - The step line path data string to parse.
 * @returns {[number, number][]} - The array of points parsed from the path data.
 * @private
 */
function parseStepPath(pathData: string): [number, number][] {
    const points: [number, number][] = [];
    const segments: string[] = pathData.split(/(?=[ML])/);

    segments.forEach((segment: string) => {
        const match: RegExpMatchArray = (segment as string).match(/([ML]) ([\d.-]+) ([\d.-]+)/) as RegExpMatchArray;
        if (match) {
            const [, command, xStr, yStr] = match;
            if (command === 'M' || command === 'L') {
                points.push([parseFloat(xStr), parseFloat(yStr)]);
            }
        }
    });

    return points;
}

/**
 * Generates a step line path data string from an array of points.
 *
 * @param {[number, number][]} points - The array of points to generate the step line path from.
 * @param {string} stepPosition - The position of the step.
 * @returns {string} - The generated step line path data string.
 * @private
 */
function generateStepLinePath(points: [number, number][], stepPosition: string = 'Center'): string {
    if (points.length === 0) { return ''; }

    let pathData: string = `M ${points[0][0]} ${points[0][1]}`;

    for (let i: number = 1 as number; i < points.length; i++) {
        const [x1, y1]: number[] = points[i - 1] as number[];
        const [x2, y2]: number[] = points[i as number];

        if (stepPosition === 'Center') {
            const midX: number = (x1 + x2) / 2;
            pathData += ` L ${midX} ${y1} L ${midX} ${y2}`;
        } else if (stepPosition === 'Left') {
            pathData += ` L ${x1} ${y2}`;
        } else if (stepPosition === 'Right') {
            pathData += ` L ${x2} ${y1}`;
        }

        pathData += ` L ${x2} ${y2}`;
    }

    return pathData;
}

export default StepLineSeriesRenderer;

