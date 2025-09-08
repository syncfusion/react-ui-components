import { ChartMarkerProps, ChartLocationProps } from '../../base/interfaces';
import { PathCommand } from '../../common/base';
import { getPoint, withInRange } from '../../utils/helper';
import { LineBase, LineBaseReturnType } from './LineBase';
import { calculatePathAnimation, interpolate, parsePathCommands } from './SeriesAnimation';
import MarkerRenderer from './MarkerRenderer';
import { AxisModel, ControlPoints, Points, RenderOptions, SeriesProperties } from '../../chart-area/chart-interfaces';
import { IntervalType } from '../../base/enum';

const lineBaseInstance: LineBaseReturnType = LineBase;

/**
 * SplineSeriesInterface defines the structure for rendering spline series charts.
 * This interface includes methods and properties for calculating control points,
 * rendering spline curves, and handling animations for spline series in charts.
 *
 * @interface SplineSeriesInterface
 */
interface SplineSeriesInterface {
    /** Previous X coordinate used in calculations */
    previousX: number;
    /** Previous Y coordinate used in calculations */
    previousY: number;

    /**
     * Generates the SVG path direction string for a spline curve between two points
     *
     * @param {ChartLocationProps} controlPoint1 - First bezier control point
     * @param {ChartLocationProps} controlPoint2 - Second bezier control point
     * @param {Points} firstPoint - Starting point of the spline segment
     * @param {Points} secondPoint - Ending point of the spline segment
     * @param {SeriesProperties} series - Series configuration object
     * @param {boolean} isInverted - Whether axes are inverted
     * @param {Function} getPointLocation - Function to translate data points to screen coordinates
     * @param {string} startPoint - Starting SVG path command
     * @returns {string} - SVG path command string for the spline segment
     */
    getSplineDirection: (
        controlPoint1: ChartLocationProps,
        controlPoint2: ChartLocationProps,
        firstPoint: Points,
        secondPoint: Points,
        series: SeriesProperties,
        isInverted: boolean,
        getPointLocation: (
            x: number,
            y: number,
            xAxis: AxisModel,
            yAxis: AxisModel,
            isInverted?: boolean,
            series?: SeriesProperties
        ) => ChartLocationProps,
        startPoint: string
    ) => string;

    /**
     * Calculates spline coefficients based on the specified spline type
     *
     * @param {Points[]} points - Array of data points
     * @param {SeriesProperties} [series] - Optional series configuration
     * @returns {number[]} - Array of calculated spline coefficients
     */
    findSplineCoefficients: (
        points: Points[],
        series?: SeriesProperties
    ) => number[];

    /**
     * Calculates natural spline coefficients for smooth curve rendering
     *
     * @param {Points[]} points - Array of data points
     * @returns {number[]} - Array of calculated natural spline coefficients
     */
    naturalSplineCoefficients: (
        points: Points[]
    ) => number[];

    /**
     * Calculates cardinal spline coefficients with tension control
     *
     * @param {Points[]} points - Array of data points
     * @param {SeriesProperties} series - Series configuration with tension values
     * @returns {number[]} - Array of calculated cardinal spline coefficients
     */
    cardinalSplineCofficients: (
        points: Points[],
        series: SeriesProperties
    ) => number[];

    /**
     * Calculates monotonic spline coefficients to ensure monotonic curves
     *
     * @param {Points[]} points - Array of data points
     * @returns {number[]} - Array of calculated monotonic spline coefficients
     */
    monotonicSplineCoefficients: (
        points: Points[]
    ) => number[];

    /**
     * Calculates clamped spline coefficients with specific boundary conditions
     *
     * @param {Points[]} points - Array of data points
     * @returns {number[]} - Array of calculated clamped spline coefficients
     */
    clampedSplineCofficients: (
        points: Points[]
    ) => number[];

    /**
     * Generates control points for bezier curves based on spline coefficients
     *
     * @param {Points} point1 - First data point
     * @param {Points} point2 - Second data point
     * @param {number} ySpline1 - Spline coefficient for first point
     * @param {number} ySpline2 - Spline coefficient for second point
     * @param {SeriesProperties} series - Series configuration object
     * @returns {ControlPoints} - Control points for bezier curve rendering
     */
    getControlPoints: (
        point1: Points,
        point2: Points,
        ySpline1: number,
        ySpline2: number,
        series: SeriesProperties
    ) => ControlPoints;

    /**
     * Renders the spline series
     *
     * @param {SeriesProperties} series - Series configuration object
     * @param {boolean} isInverted - Whether axes are inverted
     * @param {Object} chartProps - Chart properties including event handlers
     * @returns {RenderOptions[] | { options: RenderOptions[]; marker: ChartMarkerProps }} - Render options for path and markers
     */
    render: (
        series: SeriesProperties,
        isInverted: boolean
    ) => RenderOptions[] | { options: RenderOptions[]; marker: ChartMarkerProps };

    /**
     * Handles animation for spline series paths
     *
     * @param {RenderOptions} pathOptions - Path rendering options
     * @param {number} index - Series index
     * @param {Object} animationState - Animation state object with refs
     * @param {boolean} enableAnimation - Whether animation is enabled
     * @param {SeriesProperties} _currentSeries - Current series being animated
     * @param {Points | undefined} _currentPoint - Current point being animated
     * @param {number} _pointIndex - Index of the current point
     * @param {SeriesProperties[]} [visibleSeries] - Array of visible series
     * @returns {void} - This method doesn't return anything
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
        visibleSeries?: SeriesProperties[]
    ) => void

    /**
     * Calculates the appropriate date-time interval in milliseconds based on axis settings
     *
     * @param {SeriesProperties} series - Series configuration object with axis information
     * @returns {number} - Interval in milliseconds
     */
    dateTimeInterval?: (
        series: SeriesProperties
    ) => number;
}

const SplineSeriesRenderer: SplineSeriesInterface = {
    previousX: 0,
    previousY: 0,

    getSplineDirection: (
        controlPoint1: ChartLocationProps,
        controlPoint2: ChartLocationProps,
        firstPoint: Points,
        secondPoint: Points,
        series: SeriesProperties,
        isInverted: boolean,
        getPointLocation: Function,
        startPoint: string
    ): string => {
        let direction: string = '';
        if (firstPoint != null) {
            const pt1: ChartLocationProps = getPointLocation(
                firstPoint.xValue, firstPoint.yValue, series.xAxis, series.yAxis, isInverted, series
            );
            const pt2: ChartLocationProps = getPointLocation(
                secondPoint.xValue, secondPoint.yValue, series.xAxis, series.yAxis, isInverted, series
            );

            // Get bezier control points
            const bpt1: ChartLocationProps = getPointLocation(
                controlPoint1.x, controlPoint1.y, series.xAxis, series.yAxis, isInverted, series
            );
            const bpt2: ChartLocationProps = getPointLocation(
                controlPoint2.x, controlPoint2.y, series.xAxis, series.yAxis, isInverted, series
            );

            // Create the cubic bezier curve command
            direction = startPoint + ' ' + (pt1.x) + ' ' + (pt1.y) + ' ' +
                'C' + ' ' + (bpt1.x) + ' ' + (bpt1.y) + ' ' +
                (bpt2.x) + ' ' + (bpt2.y) + ' ' +
                (pt2.x) + ' ' + (pt2.y) + ' ';
        }
        return direction;
    },

    dateTimeInterval: (series: SeriesProperties): number => {
        if (!series?.xAxis || !series.xAxis?.actualIntervalType) {
            return 30 * 24 * 60 * 60 * 1000; // Default to month
        }

        const interval: IntervalType = series?.xAxis?.actualIntervalType as IntervalType;
        let intervalInMilliseconds: number;

        if (interval === 'Years') {
            intervalInMilliseconds = 365 * 24 * 60 * 60 * 1000;
        } else if (interval === 'Months') {
            intervalInMilliseconds = 30 * 24 * 60 * 60 * 1000;
        } else if (interval === 'Days') {
            intervalInMilliseconds = 24 * 60 * 60 * 1000;
        } else if (interval === 'Hours') {
            intervalInMilliseconds = 60 * 60 * 1000;
        } else if (interval === 'Minutes') {
            intervalInMilliseconds = 60 * 1000;
        } else if (interval === 'Seconds') {
            intervalInMilliseconds = 1000;
        } else {
            intervalInMilliseconds = 30 * 24 * 60 * 60 * 1000;
        }
        return intervalInMilliseconds;
    },

    findSplineCoefficients: (points: Points[], series?: SeriesProperties): number[] => {

        let ySpline: number[] = [];
        const ySplineDuplicate: number[] = [];
        let cardinalSplineTension: number = series?.cardinalSplineTension ? series.cardinalSplineTension : 0.5;
        if (cardinalSplineTension < 0) {
            cardinalSplineTension = 0;
        }
        else if (cardinalSplineTension > 1) {
            cardinalSplineTension = 1;
        }
        switch (series?.splineType) {
        case 'Monotonic':
            ySpline = SplineSeriesRenderer.monotonicSplineCoefficients(points);
            break;
        case 'Cardinal':
            ySpline = SplineSeriesRenderer.cardinalSplineCofficients(points, series);
            break;
        default:
            if (series?.splineType === 'Clamped') {
                ySpline = SplineSeriesRenderer.clampedSplineCofficients(points);
            } else {
                // assigning the first and last value as zero
                ySpline[0] = ySplineDuplicate[0] = 0;
                ySpline[points.length - 1] = 0;
            }
            ySpline = SplineSeriesRenderer.naturalSplineCoefficients(points);
            break;
        }
        return ySpline;
    },

    naturalSplineCoefficients: (points: Points[]): number[] => {
        const count: number = points.length;

        const ySpline: number[] = [];
        const ySplineDuplicate: number[] = [];

        // Setting first and last values as 0
        ySpline[0] = ySplineDuplicate[0] = 0;
        ySpline[points.length - 1] = 0;

        // Natural spline algorithm
        for (let i: number = 1; i < count - 1; i++) {
            // Use nullish coalescing operator to provide default values if xValue is null
            const coefficient1: number = Number(points[i as number].xValue) - Number(points[i - 1].xValue);
            const coefficient2: number = ((points[i + 1]?.xValue) as number) - (points[i - 1]?.xValue as Required<number>) as number;
            const coefficient3: number = ((points[i + 1]?.xValue) as number) - (points[i as number]?.xValue as Required<number>) as number;

            const dy1: number = (points[i + 1]?.yValue) as number - (points[i as number]?.yValue as Required<number>) as number;
            const dy2: number = (points[i as number]?.yValue) as number - (points[i - 1]?.yValue as Required<number>) as number;
            if (coefficient1 === 0 || coefficient2 === 0 || coefficient3 === 0) {
                ySpline[i as number] = 0;
                ySplineDuplicate[i as number] = 0;
            } else {
                const p: number = 1 / Math.max(Number.EPSILON, Math.abs(coefficient1 * ySpline[i - 1] + 2 * coefficient2));
                ySpline[i as number] = -p * coefficient3;
                ySplineDuplicate[i as number] = p * (6 * (dy1 / coefficient3 - dy2 / coefficient1) -
                    coefficient1 * ySplineDuplicate[i - 1]);
            }
        }

        // Back substitution for tridiagonal algorithm
        for (let k: number = count - 2; k >= 0; k--) {
            ySpline[k as number] = ySpline[k as number] * ySpline[k + 1] + ySplineDuplicate[k as number];
        }

        return ySpline;
    },

    cardinalSplineCofficients: (points: Points[], series: SeriesProperties): number[] => {
        const count: number = points.length;
        const ySpline: number[] = [];
        let cardinalSplineTension: number = series.cardinalSplineTension ? series.cardinalSplineTension : 0.5;
        cardinalSplineTension = cardinalSplineTension < 0 ? 0 : cardinalSplineTension > 1 ? 1 : cardinalSplineTension;
        for (let i: number = 0; i < count; i++) {
            if (i === 0) {
                ySpline[i as number] = (count > 2) ?
                    (cardinalSplineTension * ((points[i + 2].xValue as number) - (points[i as number].xValue as number))) : 0;
            } else if (i === (count - 1)) {
                ySpline[i as number] = (count > 2) ?
                    (cardinalSplineTension * ((points[count - 1].xValue as number) - (points[count - 3].xValue as number))) : 0;
            } else {
                ySpline[i as number] = (cardinalSplineTension * ((points[i + 1].xValue as number) - (points[i - 1].xValue as number)));
            }
        }
        return ySpline;
    },

    monotonicSplineCoefficients: (points: Points[]): number[] => {
        const count: number = points.length;
        const ySpline: number[] = [];
        const dx: number[] = [];
        // const dy: number[] = [];
        const slope: number[] = [];
        let interPoint: number;
        //interpolant points
        const slopeLength: number = slope.length;
        // to find the first and last co-efficient value
        ySpline[0] = slope[0];
        ySpline[count - 1] = slope[slopeLength - 1];
        //to find the other co-efficient values
        for (let j: number = 0; j < dx.length; j++) {
            if (slopeLength > j + 1) {
                if (slope[j as number] * slope[j + 1] <= 0) {
                    ySpline[j + 1] = 0;
                } else {
                    interPoint = dx[j as number] + dx[j + 1];
                    ySpline[j + 1] = 3 * interPoint / ((interPoint + dx[j + 1]) / slope[j as number] +
                        (interPoint + dx[j as number]) / slope[j + 1]);
                }
            }
        }

        return ySpline;
    },

    clampedSplineCofficients: (points: Points[]): number[] => {
        const count: number = points.length;
        const ySpline: number[] = [];
        const ySplineDuplicate: number[] = [];
        for (let i: number = 0; i < count - 1; i++) {
            ySpline[0] = (3 * ((points[1].yValue as number) - (points[0].yValue as number))) /
                ((points[1].xValue as number) - (points[0].xValue as number)) - 3;
            ySplineDuplicate[0] = 0.5;
            ySpline[points.length - 1] = (3 * ((points[points.length - 1].yValue as number) - (points[points.length - 2].yValue as number)))
                / ((points[points.length - 1].xValue as number) - (points[points.length - 2].xValue as number));
            ySpline[0] = ySplineDuplicate[0] = Number.isFinite(Math.abs(ySpline[0])) ? Math.abs(ySpline[0]) : 0;
            ySpline[points.length - 1] = ySplineDuplicate[points.length - 1] = Number.isFinite(Math.abs(ySpline[points.length - 1])) ?
                ySpline[points.length - 1] : 0;
        }

        return ySpline;
    },

    getControlPoints: (point1: Points, point2: Points, ySpline1: number, ySpline2: number, series: SeriesProperties): ControlPoints => {
        let controlPoint1: ChartLocationProps;
        let controlPoint2: ChartLocationProps;
        let point: ControlPoints;
        let ySplineDuplicate1: number = ySpline1;
        let ySplineDuplicate2: number = ySpline2;
        const xValue1: number = point1.xValue as number;
        const yValue1: number = point1.yValue as number;
        const xValue2: number = point2.xValue as number;
        const yValue2: number = point2.yValue as number;
        switch (series.splineType) {
        case 'Cardinal':
            if (series.xAxis.valueType === 'DateTime') {
                ySplineDuplicate1 = ySpline1 / (SplineSeriesRenderer.dateTimeInterval as Function)(series);
                ySplineDuplicate2 = ySpline2 / (SplineSeriesRenderer.dateTimeInterval as Function)(series);
            }
            controlPoint1 = { x: xValue1 + ySpline1 / 3, y: yValue1 + ySplineDuplicate1 / 3 };
            controlPoint2 = { x: xValue2 - ySpline2 / 3, y: yValue2 - ySplineDuplicate2 / 3 };
            point = { controlPoint1: controlPoint1, controlPoint2: controlPoint2 };
            break;
        case 'Monotonic': {
            const value: number = (xValue2 - xValue1) / 3;
            controlPoint1 = { x: xValue1 + value, y: yValue1 + ySpline1 * value };
            controlPoint2 = { x: xValue2 - value, y: yValue2 - ySpline2 * value };
            point = { controlPoint1: controlPoint1, controlPoint2: controlPoint2 };
            break;
        }
        default: {
            const one3: number = 1 / 3.0;
            let deltaX2: number = (xValue2 - xValue1);
            deltaX2 = deltaX2 * deltaX2;
            const y1: number = one3 * (((2 * yValue1) + yValue2) - one3 * deltaX2 * (ySpline1 + 0.5 * ySpline2));
            const y2: number = one3 * ((yValue1 + (2 * yValue2)) - one3 * deltaX2 * (0.5 * ySpline1 + ySpline2));
            controlPoint1 = { x: (2 * xValue1 + xValue2) * one3, y: y1 };
            controlPoint2 = { x: (xValue1 + 2 * xValue2) * one3, y: y2 };
            point = { controlPoint1: controlPoint1, controlPoint2: controlPoint2 };
            break;
        }
        }
        return point;
    },

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

    render: (series: SeriesProperties, isInverted: boolean ):
    RenderOptions[] | { options: RenderOptions[]; marker: ChartMarkerProps } => {
        if (!series || series === null || !series.points || series.points === null || series.points.length < 1) {
            return [];
        }

        const getCoordinate:
        (x: number, y: number, xAxis: AxisModel, yAxis: AxisModel, isInverted?: boolean, series?: SeriesProperties) =>
        ChartLocationProps = getPoint;
        const visiblePoints: Points[] = lineBaseInstance.enableComplexProperty(series);
        const points: Points[] = [];
        let pointIndex: number = 0;

        for (let i: number = 0; i < visiblePoints.length; i++) {
            const point: Points = visiblePoints[i as number];
            if (point.xValue === null) {continue; }
            point.index = pointIndex++;
            points.push(point);
        }

        series.visiblePoints = visiblePoints;

        const splineCoefficients: number[] = SplineSeriesRenderer.findSplineCoefficients(points, series);
        if (!series.drawPoints) {series.drawPoints = []; }

        const pointsLength: number = points.length;
        if (!series.drawPoints || series.drawPoints.length < pointsLength - 1) {
            series.drawPoints = new Array(pointsLength - 1);
        }
        for (let i: number = 1; i < pointsLength; i++) {
            const currentPoint: Points = points[i as number];
            const previousPoint: Points = points[i - 1];
            const currentCoefficient: number = splineCoefficients[i as number] || 0;
            const previousCoefficient: number = splineCoefficients[i - 1] || 0;

            series.drawPoints[i - 1] = SplineSeriesRenderer.getControlPoints(
                previousPoint,
                currentPoint,
                previousCoefficient,
                currentCoefficient,
                series
            );
        }

        let direction: string = '';
        let firstPoint: Points | null = null;
        // let prevIndex = 0;
        const isDropMode: boolean = series.emptyPointSettings?.mode === 'Drop';

        for (let i: number = 0; i < points.length; i++) {
            const point: Points = points[i as number];
            point.symbolLocations = [];
            point.regions = [];

            const previous: number = i > 0 ? i - 1 : 0;
            const next: number = i < points.length - 1 ? i + 1 : i;

            if (
                point.visible &&
                (i === 0 || withInRange(points[previous as number], point, points[next as number], series))
            ) {
                if (firstPoint === null) {
                    const pt: ChartLocationProps =
                    getCoordinate((point.xValue as number), (point.yValue as number), series.xAxis, series.yAxis, isInverted, series);
                    direction += `M ${pt.x} ${pt.y} `;
                } else {
                    let controlPt1: ChartLocationProps; let controlPt2: ChartLocationProps;
                    if (isDropMode && previous < i && !points[previous as number].visible) {
                        controlPt1 = series.drawPoints[previous - 1]?.controlPoint1 ?? firstPoint;
                        controlPt2 = series.drawPoints[previous - 1]?.controlPoint2 ?? firstPoint;
                    } else {
                        controlPt1 = series.drawPoints[previous as number]?.controlPoint1;
                        controlPt2 = series.drawPoints[previous as number]?.controlPoint2;
                    }

                    const pt2: ChartLocationProps = getCoordinate(
                        (point.xValue as number), (point.yValue as number), series.xAxis, series.yAxis, isInverted, series);
                    const bpt1: ChartLocationProps = getCoordinate(
                        controlPt1.x, controlPt1.y, series.xAxis, series.yAxis, isInverted, series);
                    const bpt2: ChartLocationProps = getCoordinate(
                        controlPt2.x, controlPt2.y, series.xAxis, series.yAxis, isInverted, series);

                    direction += `C ${bpt1.x} ${bpt1.y} ${bpt2.x} ${bpt2.y} ${pt2.x} ${pt2.y} `;
                }

                lineBaseInstance.storePointLocation(point, series, isInverted, getCoordinate);
                firstPoint = point;
            } else {
                if (!isDropMode && firstPoint) {
                    firstPoint = null;
                }
            }
        }

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

        const marker: Object | null = series.marker?.visible ? MarkerRenderer.render(series) as Object : null;
        return marker ? { options, marker } : options;
    }
};

/**
 * Interpolates spline path data strings (containing cubic bezier curves)
 *
 * @param {string} fromD - Starting path data
 * @param {string} toD - Ending path data
 * @param {number} progress - Animation progress (0-1)
 * @returns {string} - Interpolated path data
 * @private
 */
export function interpolateSplinePathD(fromD: string, toD: string, progress: number): string {
    // Parse path commands into structured objects
    const fromCommands: PathCommand[] = parsePathCommands(fromD);
    const toCommands: PathCommand[] = parsePathCommands(toD);

    // If different number of commands, use simple interpolation between points
    if (fromCommands.length !== toCommands.length) {
        // Use simple path transitions for paths with different structure
        return progress < 0.5 ? fromD : toD;
    }

    // Interpolate between matching commands
    let result: string = '';
    for (let i: number = 0; i < fromCommands.length; i++) {
        const fromCmd: PathCommand = fromCommands[i as number];
        const toCmd: PathCommand = toCommands[i as number];

        // Skip if commands don't match
        if (fromCmd.type !== toCmd.type) {
            return progress < 0.5 ? fromD : toD;
        }

        result += fromCmd.type + ' ';

        // Interpolate parameters based on command type
        switch (fromCmd.type) {
        case 'M': // Move to
        case 'L': // Line to
            for (let j: number = 0; j < fromCmd.params.length; j += 2) {
                const x: number = interpolate(fromCmd.params[j as number], toCmd.params[j as number], progress);
                const y: number = interpolate(fromCmd.params[j + 1], toCmd.params[j + 1], progress);
                result += `${x} ${y} `;
            }
            break;

        case 'C': // Cubic bezier
            // Cubics have 6 params: [x1, y1, x2, y2, x, y]
            for (let j: number = 0; j < fromCmd.params.length; j += 2) {
                const x: number = interpolate(fromCmd.params[j as number], toCmd.params[j as number], progress);
                const y: number = interpolate(fromCmd.params[j + 1], toCmd.params[j + 1], progress);
                result += `${x} ${y} `;
            }
            break;

        default:
            // Just copy parameters for unsupported commands
            result += fromCmd.params.join(' ') + ' ';
        }
    }

    return result.trim();
}

export default SplineSeriesRenderer;
