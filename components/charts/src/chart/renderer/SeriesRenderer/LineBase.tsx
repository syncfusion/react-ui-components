import { isNullOrUndefined } from '@syncfusion/react-base';
import { StepPosition } from '../../base/enum';
import { Points, Rect, SeriesProperties, VisibleRangeProps } from '../../chart-area/chart-interfaces';
import { ChartLocationProps } from '../../base/interfaces';


/**
 * Interface defining the functions available in the LineBase utility.
 *
 * @private
 */
export type LineBaseReturnType = {
    /**
     * Stores the point location in the chart and calculates its region
     *
     * @param {Points} point - The data point to store location for
     * @param {SeriesProperties} series - Series configuration properties
     * @param {boolean} isInverted - Flag indicating if chart orientation is inverted
     * @param {GetLocationFunction} getLocation - Function to convert data coordinates to chart pixel coordinates
     * @returns {void} This function doesn't return a value
     */
    storePointLocation: (point: Points, series: SeriesProperties, isInverted: boolean, getLocation: Function) => void;

    /**
     * Processes series points and enables complex properties for rendering optimization
     *
     * @param {SeriesProperties} series - Series configuration properties including axes information
     * @returns {Points[]} Array of processed points with optimized visibility
     */
    enableComplexProperty: (series: SeriesProperties) => Points[];

    /**
     * Gets the step line direction path between two points
     *
     * @param {ChartLocationProps} currentPoint - The current point coordinates
     * @param {ChartLocationProps} previousPoint - The previous point coordinates
     * @param {StepPosition} stepLineType - The type of step line (Left, Right, Center)
     * @param {string} command - SVG path command for the starting point (typically 'M' or 'L')
     * @param {SeriesProperties} series - Series configuration properties
     * @param {boolean} isBorder - Flag indicating if this is a border path
     * @returns {string} SVG path string representing the step line direction
     */
    getStepLineDirection: (currentPoint: ChartLocationProps, previousPoint: ChartLocationProps,
        stepLineType: StepPosition, command: string, series: SeriesProperties, isBorder?: boolean) => string;

    /**
     * Removes empty points from the border direction path
     *
     * @param {string} borderDirection - The SVG path string to process
     * @returns {string} Processed SVG path with empty points removed
     */
    removeEmptyPointsBorder: (borderDirection: string) => string;
};


/**
 * Processes series points and enables complex properties for rendering optimization
 *
 * @param {SeriesProperties} series - Series configuration properties including axes information
 * @returns {Points[]} Array of processed points with optimized visibility based on tolerance values
 */
const enableComplexProperty: (series: SeriesProperties) => Points[] = (series: SeriesProperties): Points[] => {
    const tempPoints: Points[] = [];
    const tempPointsTwo: Points[] = [];
    const xVisibleRange: VisibleRangeProps = series.xAxis.visibleRange;
    const yVisibleRange: VisibleRangeProps = series.yAxis.visibleRange;
    const seriesPoints: Points[] | undefined = series.points;
    const areaBounds: Rect | undefined = series.clipRect;

    const xTolerance: number = (series.chart && !series.chart.delayRedraw && series.xTolerance) ?
        series.xTolerance : Math.abs(xVisibleRange.delta / areaBounds!.width);
    const yTolerance: number = (series.chart && !series.chart.delayRedraw && series.yTolerance) ?
        series.yTolerance : Math.abs(yVisibleRange.delta / areaBounds!.height);
    series.xTolerance = xTolerance;
    series.yTolerance = yTolerance;

    let prevXValue: number = (Number(seriesPoints?.[0]?.xValue) > xTolerance!) ? 0 : xTolerance!;
    let prevYValue: number = (Number(seriesPoints?.[0]?.y) > yTolerance!) ? 0 : yTolerance!;

    for (const currentPoint of seriesPoints!) {
        currentPoint.symbolLocations = [];
        const xVal: number = !isNullOrUndefined(currentPoint.xValue) ? (currentPoint.xValue) as number : xVisibleRange.minimum;
        const yVal: number = !isNullOrUndefined(currentPoint.yValue) ? (currentPoint.yValue) as number : yVisibleRange.minimum;
        void ((Math.abs(prevXValue! - xVal) >= xTolerance! || Math.abs(prevYValue! - yVal) >= yTolerance!) && (
            tempPoints.push(currentPoint),
            prevXValue = xVal,
            prevYValue = yVal
        ));
    }

    for (let i: number = 0; i < tempPoints.length; i++) {
        const tempPoint: Points = tempPoints[i as number];
        tempPointsTwo.push(tempPoint);
    }

    return tempPointsTwo;
};

/**
 * Stores the point location in the chart and calculates its region for interaction
 *
 * @param {Points} point - The data point to store location for
 * @param {SeriesProperties} series - Series configuration properties including marker information
 * @param {boolean} isInverted - Flag indicating if chart orientation is inverted
 * @param {GetLocationFunction} getLocation - Function to convert data coordinates to chart pixel coordinates
 * @returns {void} This function doesn't return a value
 */
const storePointLocation: (point: Points, series: SeriesProperties, isInverted: boolean, getLocation: Function) => void
    = (point: Points, series: SeriesProperties, isInverted: boolean, getLocation: Function): void => {
        const markerWidth: number = (series.marker && series.marker.width) ? series.marker.width : 0;
        const markerHeight: number = (series.marker && series.marker.height) ? series.marker.height : 0;
        point.symbolLocations!.push(
            getLocation(
                point.xValue, point.yValue,
                series.xAxis, series.yAxis, isInverted, series
            )
        );
        point.regions!.push({
            x: point.symbolLocations![0].x - markerWidth,
            y: point.symbolLocations![0].y - markerHeight,
            width: 2 * markerWidth,
            height: 2 * markerHeight
        });
    };

/**
 * To get the point location for step line type series.
 *
 * @param {ChartLocationProps} currentPoint - Defines the current point.
 * @param {ChartLocationProps} previousPoint - Defines the previous point.
 * @param {StepPosition} stepLineType - Defines the step line type.
 * @param {string} command - Defines the command.
 * @param {Series} series - Defines the series.
 * @param {boolean} isBorder - Defines the isBorder.
 * @returns {string} - Returns a string of path.
 */
const getStepLineDirection: (currentPoint: ChartLocationProps,
    previousPoint: ChartLocationProps,
    stepLineType: StepPosition,
    command: string,
    series: SeriesProperties,
    isBorder?: boolean) => string = (
    currentPoint: ChartLocationProps,
    previousPoint: ChartLocationProps,
    stepLineType: StepPosition,
    command: string = 'L',
    series: SeriesProperties
): string => {
    // Input validation
    if (!currentPoint || !previousPoint || !series) {
        return '';
    }

    // Validate point coordinates
    if (currentPoint.x === undefined || currentPoint.y === undefined ||
            previousPoint.x === undefined || previousPoint.y === undefined) {
        return '';
    }

    // Ensure command is valid
    command = command || 'L';

    const useRisers: boolean = !(series.noRisers === true);
    const riserCommand: string = useRisers ? ' L ' : ' M ';

    if (stepLineType === 'Right') {
        const startCommand: string = command === 'M' ? 'M' : (useRisers ? 'L' : 'M');
        return `${startCommand} ${previousPoint.x} ${currentPoint.y} L ${currentPoint.x} ${currentPoint.y} `;
    }
    if (stepLineType === 'Center') {
        const midpointX: number = previousPoint.x + (currentPoint.x - previousPoint.x) / 2;
        return `${command} ${midpointX} ${previousPoint.y}${riserCommand}${midpointX} ${currentPoint.y} L ${currentPoint.x} ${currentPoint.y} `;
    }
    return `${command} ${currentPoint.x} ${previousPoint.y}${riserCommand}${currentPoint.x} ${currentPoint.y} `;
};

/**
 * Removes empty points from the border direction path
 *
 * @param {string} borderDirection - The SVG path string to process
 * @returns {string} Processed SVG path with empty points removed
 */
const removeEmptyPointsBorder: (
    borderDirection: string
) => string = (borderDirection: string): string => {
    // Input validation
    if (!borderDirection || typeof borderDirection !== 'string') {
        return '';
    }

    let startIndex: number = 0;
    const coordinates: string[] = borderDirection.split(' ').filter((item: string) => item !== '');
    let point: number;

    // Early return for simple paths
    if (coordinates.length <= 4) {
        return coordinates.join(' ');
    }

    do {
        point = coordinates.indexOf('M', startIndex);
        if (point > -1) {
            // Ensure we don't go out of bounds
            if (point + 3 < coordinates.length) {
                coordinates.splice(point + 1, Math.min(3, coordinates.length - (point + 1)));
            }
            startIndex = point + 1;

            if (point - 6 > 0 && coordinates.length >= point - 6 + 6) {
                coordinates.splice(point - 6, 6);
                startIndex -= 6;
            }
        }
    } while (point !== -1 && startIndex < coordinates.length);

    return coordinates.join(' ');
};

/**
 * LineBase utility object providing functions for line-based chart series rendering.
 */
export const LineBase: LineBaseReturnType = {
    storePointLocation,
    enableComplexProperty,
    getStepLineDirection,
    removeEmptyPointsBorder
};
export default LineBase;
