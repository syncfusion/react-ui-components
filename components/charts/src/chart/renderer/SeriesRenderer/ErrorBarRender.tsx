import * as React from 'react';
import { Points, SeriesProperties } from '../../chart-area/chart-interfaces';
import { ChartErrorBarProps, ChartLocationProps, ChartMarkerProps } from '../../base/interfaces';
import { ChartSeriesType, ErrorBarType } from '../../base/enum';
import { getPoint } from '../../utils/helper';

/**
 * Interface defining the mean and dispersion values used for custom error-bar calculations.
 *
 * @private
 */
type Mean = {
    verticalStandard: number;
    verticalSquareRoot: number;
    horizontalStandard: number;
    horizontalSquareRoot: number;
    verticalMean: number;
    horizontalMean: number;
};

/**
 * Defines visual attributes and SVG path data for rendering an error-bar segment in charts.
 *
 * @private
 */
interface ErrorBarPathItem {
    id: string;
    fill: '';
    width: number;
    color: string;
    opacity: number;
    dashArray: string;
    d: string;
}

/**
 * Builds the SVG path and cap segments for a horizontal error bar.
 *
 * @param {ChartLocationProps} start - Error-bar start position (positive side).
 * @param {ChartLocationProps} mid - Midpoint corresponding to the data value.
 * @param {ChartLocationProps} end - Error-bar end position (negative side).
 * @param {number} capLength - Length of the cap lines at each end.
 * @returns {string[]} Tuple containing the horizontal path and cap path strings.
 * @private
 */
function getHorizontalDirection(
    start: ChartLocationProps, mid: ChartLocationProps, end: ChartLocationProps, capLength: number
): string[] {

    let path: string = '';
    let capDirection: string = '';
    path += `M ${start.x} ${mid.y} L ${end.x} ${mid.y}`;
    capDirection += `M ${start.x} ${mid.y - capLength} L 
        ${start.x} ${mid.y + capLength}`;
    capDirection += `M ${end.x} ${mid.y - capLength} L ${end.x} ${mid.y + capLength}`;
    return [path, capDirection];
}

/**
 * Builds the SVG path and cap segments for a vertical error bar.
 *
 * @param {ChartLocationProps} start - Error-bar start position (positive side).
 * @param {ChartLocationProps} mid - Midpoint corresponding to the data value.
 * @param {ChartLocationProps} end - Error-bar end position (negative side).
 * @param {number} capLength - Length of the cap lines at each end.
 * @returns {string[]} Tuple containing the vertical path and cap path strings.
 * @private
 */
function getVerticalDirection(
    start: ChartLocationProps, mid: ChartLocationProps, end: ChartLocationProps, capLength: number
): string[] {

    let path: string = '';
    let capDirection: string = '';
    path += `M ${mid.x} ${start.y} L ${mid.x} ${end.y}`;
    capDirection += `M ${mid.x - capLength} ${start.y} L ${mid.x + capLength} ${start.y}`;
    capDirection += `M ${mid.x - capLength} ${end.y} L ${mid.x + capLength} ${end.y}`;
    return [path, capDirection];
}

/**
 * Builds combined SVG path segments for error bars drawn in both axes.
 *
 * @param {ChartLocationProps} start - Error-bar start position (positive side).
 * @param {ChartLocationProps} mid - Midpoint corresponding to the data value.
 * @param {ChartLocationProps} end - Error-bar end position (negative side).
 * @param {number} capLength - Length of the cap lines at each end.
 * @returns {string[]} Tuple containing merged horizontal/vertical paths and caps.
 * @private
 */
function getBothDirection(
    start: ChartLocationProps, mid: ChartLocationProps, end: ChartLocationProps, capLength: number
): string[] {

    let capDirection: string = '';
    let path: string = '';
    const pathH: string[] = getHorizontalDirection(start, mid, end, capLength);
    const pathV: string[] = getVerticalDirection(start, mid, end, capLength);
    path = pathH[0].concat(pathV[0]);
    capDirection = pathH[1].concat(pathV[1]);
    return [path, capDirection];
}

/**
 * Determines the error bar orientation (horizontal/vertical/both) considering axis inversion.
 *
 * @param {Points} point - Data point carrying error values.
 * @param {ChartLocationProps} start - Error-bar start position (positive side).
 * @param {ChartLocationProps} mid - Midpoint corresponding to the data value.
 * @param {ChartLocationProps} end - Error-bar end position (negative side).
 * @param {SeriesProperties} series - Series configuration containing error bar settings.
 * @param {boolean} isInverted - Whether the chart axes are inverted.
 * @returns {string[]} Path and cap path strings for the resolved orientation.
 * @private
 */
function getErrorDirection(
    point: Points,
    start: ChartLocationProps,
    mid: ChartLocationProps,
    end: ChartLocationProps,
    series: SeriesProperties,
    isInverted: boolean
): string[] {
    const horizontalError: boolean = typeof series.errorBar.horizontalError === 'string' ? Number(point.horizontalError) >= 1 : Number(series.errorBar?.horizontalError) >= 1;
    const verticalError: boolean = typeof series.errorBar.verticalError === 'string' ? Number(point.verticalError) >= 1 : Number(series.errorBar?.verticalError) >= 1;
    const capLength: number = series.errorBar?.errorBarCap?.length as number;
    let paths: string[] = [];

    if (horizontalError && !verticalError) {
        paths = isInverted
            ? getVerticalDirection(start, mid, end, capLength)
            : getHorizontalDirection(start, mid, end, capLength);
    } else if (verticalError && !horizontalError) {
        paths = isInverted
            ? getHorizontalDirection(start, mid, end, capLength)
            : getVerticalDirection(start, mid, end, capLength);
    } else if (horizontalError && verticalError) {
        paths = getBothDirection(start, mid, end, capLength);
    }

    return [paths[0], paths[1]];
}

/**
 * Converts data-point error information into chart-space start/mid/end locations.
 *
 * @param {Points} point - Data point carrying error values.
 * @param {SeriesProperties} series - Series configuration including axes and error bar settings.
 * @param {boolean} isInverted - Whether the chart axes are inverted.
 * @param {number} x1 - Horizontal error magnitude.
 * @param {number} y1 - Vertical error magnitude.
 * @returns {string[]} SVG path data for the error bar and its caps.
 * @private
 */
export function findLocation(
    point: Points,
    series: SeriesProperties,
    isInverted: boolean,
    x1: number,
    y1: number
): string[] {
    const horizontalError: number = typeof series.errorBar.horizontalError === 'string' ? Number(point.horizontalError) : Number(series.errorBar?.horizontalError);
    const verticalError: number = typeof series.errorBar.verticalError === 'string' ? Number(point.verticalError) : Number(series.errorBar?.verticalError);
    const location: ChartLocationProps[] = [];
    const xVal: number = Number(point.xValue);
    const isStacking: boolean = (series.type as ChartSeriesType)?.indexOf('Stacking') > -1;

    const yBase: number = isStacking
        ? Number(series.stackedValues?.endValues?.[point.index])
        : Number(point.yValue);

    const horiz: boolean = horizontalError > 0 ||
                       (horizontalError > 0 && verticalError > 0);
    const vert: boolean = verticalError > 0 ||
                       (horizontalError > 0 && verticalError > 0);

    // Deltas without assigning in expressions
    const dxPlus: number =
        horiz
            ? Number(x1)
            : 0;

    const dyPlus: number = vert
        ? Number(y1)
        : 0;

    const dxMinus: number = horiz
        ? Number(x1)
        : 0;

    const dyMinus: number = vert
        ? Number(y1)
        : 0;

    // Start (plus) endpoint
    const startPoint: ChartLocationProps = getPoint(
        xVal + dxPlus,
        yBase + dyPlus,
        series.xAxis,
        series.yAxis,
        isInverted
    );
    location.push(startPoint);

    const midPoint: ChartLocationProps =
        series.isRectSeries && point.symbolLocations?.[0]
            ? point.symbolLocations[0]
            : getPoint(
                xVal,
                Number(point.yValue ?? yBase),
                series.xAxis,
                series.yAxis,
                isInverted
            );

    location.push(midPoint);
    const endPoint: ChartLocationProps = getPoint(
        xVal - dxMinus,
        yBase - dyMinus,
        series.xAxis,
        series.yAxis,
        isInverted
    );
    location.push(endPoint);
    point.error = (verticalError >= 1 && horizontalError >= 1) ?
        verticalError as number | string : horizontalError as number | string;
    const errorDirection: string[] = getErrorDirection(point, location[0], location[1], location[2], series, isInverted);
    return errorDirection;
}

/**
 * Calculates the sum of an array of numbers.
 *
 * @param {number[]} values - Numeric sequence to aggregate.
 * @returns {number} Total sum of the provided values.
 * @private
 */
export function sum(values: number[]): number {
    let sum: number = 0;
    for (const value of values) {
        sum += value;
    }
    return sum;
}

/**
 * Computes mean, variance, and standard deviation metrics for error bar modes.
 *
 * @param {SeriesProperties} series - Series containing x/y data collections.
 * @param {ErrorBarMode} mode - Axis mode to evaluate (horizontal/vertical/both).
 * @returns {Mean} Aggregate statistics required for deviation/error formulas.
 * @private
 */
export function meanCalculation(series: SeriesProperties, mode: ('Vertical' | 'Horizontal' | 'Both')): Mean {
    let sumOfX: number = 0; let sumOfY: number = 0;
    let verticalMean: number = 0; let horizontalMean: number = 0;
    const length: number = series.points.length;

    switch (mode) {
    case 'Vertical':
        sumOfY = sum(series.yData);
        verticalMean = sumOfY / length;
        break;
    case 'Horizontal':
        sumOfX = sum(series.xData);
        horizontalMean = sumOfX / length;
        break;
    case 'Both':
        sumOfY = sum(series.yData);
        verticalMean = sumOfY / length;
        sumOfX = sum(series.xData);
        horizontalMean = sumOfX / length;
    }

    for (const point of series.points) {
        if (mode === 'Vertical') {
            sumOfY = sumOfY + Math.pow((point.yValue as number - verticalMean), 2);
        } else if (mode === 'Horizontal') {
            sumOfX = sumOfX + Math.pow((point.xValue as number - horizontalMean), 2);
        } else {
            sumOfY = sumOfY + Math.pow((point.yValue as number - verticalMean), 2);
            sumOfX = sumOfX + Math.pow((point.xValue as number - horizontalMean), 2);
        }
    }
    const verStandardMean: number = sumOfY / (length - 1);
    const verSquareRoot: number = Math.sqrt(sumOfY / (length - 1));
    const horStandardMean: number = sumOfX / (length - 1);
    const horSquareRoot: number = Math.sqrt(sumOfX / (length - 1));

    return {
        verticalStandard: verStandardMean,
        verticalSquareRoot: verSquareRoot,
        horizontalStandard: horStandardMean,
        horizontalSquareRoot: horSquareRoot,
        verticalMean,
        horizontalMean
    };
}

/**
 * Resolves error bar endpoints when error is expressed as a percentage of the data value.
 *
 * @param {Points} point - Data point carrying error values.
 * @param {SeriesProperties} series - Series configuration including axes and error bar settings.
 * @param {boolean} isInverted - Whether the chart axes are inverted.
 * @param {number} errorX - Horizontal percentage error (0-100).
 * @param {number} errorY - Vertical percentage error (0-100).
 * @returns {string[]} SVG path commands for the rendered error bar.
 * @private
 */
export function calculatePercentageValue(
    point: Points, series: SeriesProperties, isInverted: boolean,
    errorX: number, errorY: number
): string[] {
    const xValue: number = Number(point.xValue);
    const yValue: number = Number(point.yValue);
    const horizontalPercentageOffset : number = Number(errorX) / 100 * xValue;
    const verticalPercentageOffset : number = Number(errorY) / 100 * yValue;
    return findLocation(point, series, isInverted, horizontalPercentageOffset, verticalPercentageOffset );
}

/**
 * Resolves error bar endpoints for standard deviation-based sizing.
 *
 * @param {Points} point - Data point carrying error values.
 * @param {SeriesProperties} series - Series configuration including axes and error bar settings.
 * @param {boolean} isInverted - Whether the chart axes are inverted.
 * @param {number} errorX - Horizontal deviation multiplier.
 * @param {number} errorY - Vertical deviation multiplier.
 * @returns {string[]} SVG path commands for the rendered error bar.
 * @private
 */
export function calculateStandardDeviationValue(
    point: Points, series: SeriesProperties, isInverted: boolean,
    errorX: number, errorY: number
): string[] {
    const horiz: boolean = typeof series.errorBar.horizontalError === 'string' ? Number(point.horizontalError) >= 1 : Number(series.errorBar?.horizontalError) >= 1;
    const vert: boolean = typeof series.errorBar.verticalError === 'string' ? Number(point.verticalError) >= 1 : Number(series.errorBar?.verticalError) >= 1;

    // Determine mode based on flags
    const mode: 'Both' | 'Vertical' | 'Horizontal' = horiz && vert
        ? 'Both'
        : horiz
            ? (isInverted ? 'Vertical' : 'Horizontal')
            : (isInverted ? 'Horizontal' : 'Vertical');
    const mean: Mean = meanCalculation(series, mode);
    const horizontalStandardError: number = Number(errorX) * (Number(mean.horizontalSquareRoot) + Number(mean.horizontalMean));
    const verticalStandardError: number = Number(errorY) * (Number(mean.verticalSquareRoot) + Number(mean.verticalMean));
    return findLocation(point, series, isInverted, horizontalStandardError, verticalStandardError);
}

/**
 * Resolves error bar endpoints for standard error-based sizing.
 *
 * @param {Points} point - Data point carrying error values.
 * @param {SeriesProperties} series - Series configuration including axes and error bar settings.
 * @param {boolean} isInverted - Whether the chart axes are inverted.
 * @param {number} errorX - Horizontal standard-error multiplier.
 * @param {number} errorY - Vertical standard-error multiplier.
 * @returns {string[]} SVG path commands for the rendered error bar.
 * @private
 */
export function calculateStandardErrorValue(
    point: Points, series: SeriesProperties, isInverted: boolean,
    errorX: number, errorY: number
): string[] {
    const pointsLength: number = series.points?.length as number;
    const horiz: boolean = typeof series.errorBar.horizontalError === 'string' ? Number(point.horizontalError) >= 1 : Number(series.errorBar?.horizontalError) >= 1;
    const vert: boolean = typeof series.errorBar.verticalError === 'string' ? Number(point.verticalError) >= 1 : Number(series.errorBar?.verticalError) >= 1;
    const mode: 'Vertical' | 'Horizontal' | 'Both' = horiz && vert
        ? 'Both'
        : horiz
            ? (isInverted ? 'Vertical' : 'Horizontal')
            : (isInverted ? 'Horizontal' : 'Vertical');
    const mean: Mean = meanCalculation(series, mode);
    const horizontalStandardError: number = (Number(errorX) * Number(mean.horizontalSquareRoot)) / Math.sqrt(pointsLength);
    const verticalStandardError: number = (Number(errorY) * Number(mean.verticalSquareRoot)) / Math.sqrt(pointsLength);
    return findLocation(point, series, isInverted, horizontalStandardError, verticalStandardError);
}


/**
 * Resolves error bar endpoints using custom error values supplied per point.
 *
 * @param {Points} point - Data point carrying error values.
 * @param {SeriesProperties} series - Series configuration including axes and error bar settings.
 * @param {boolean} isInverted - Whether the chart axes are inverted.
 * @param {number} errorX - Horizontal custom error magnitude.
 * @param {number} errorY - Vertical custom error magnitude.
 * @returns {string[]} SVG path commands for the rendered error bar.
 * @private
 */
export function calculateCustomValue(
    point: Points, series: SeriesProperties, isInverted: boolean,
    errorX: number, errorY: number
): string[] {
    return findLocation(point, series, isInverted, errorX, errorY);
}

/**
 * Renders the SVG elements necessary to display error bars and caps for a series.
 *
 * @param {SeriesProperties} series - Series configuration supplying error bar data and theme settings.
 * @param {boolean} [changeStyleProps] - When true, skips rendering and returns null.
 * @returns {React.ReactElement | null} Populated error bar group or null when not applicable.
 * @private
 */
export function renderErrorBarsJSX(series: SeriesProperties, changeStyleProps?: boolean): React.ReactElement | null {
    if (changeStyleProps) {
        return null;
    }
    const pathItems: Array<ErrorBarPathItem> = [];
    const capItems:  Array<ErrorBarPathItem > = [];
    const seriesIndex: number = series.index;
    let symbolId: string;
    let capId: string;
    const errorbar: ChartErrorBarProps = series.errorBar as ChartErrorBarProps;
    const errorBarCap: ChartErrorBarProps = series.errorBar.errorBarCap as ChartErrorBarProps;

    for (const point of series.points) {
        if (point.visible && (point.symbolLocations as ChartLocationProps[])[0]) {
            let errorX: number | string = 0;
            let errorY: number | string = 0;
            const horiz: boolean = typeof series.errorBar.horizontalError === 'string' ? Number(point.horizontalError) >= 1 : Number(series.errorBar?.horizontalError) >= 1;
            const vert: boolean = typeof series.errorBar.verticalError === 'string' ? Number(point.verticalError) >= 1 : Number(series.errorBar?.verticalError) >= 1;
            const mode: 'Both' | 'Vertical' | 'Horizontal' = horiz && vert
                ? 'Both'
                : horiz
                    ? ('Horizontal')
                    : ('Vertical');
            switch (mode) {
            case 'Vertical':
                errorY = point.verticalError as string;
                break;
            case 'Horizontal':
                errorX = point.horizontalError as string;
                break;
            case 'Both':
                errorX = point.horizontalError as string;
                errorY = point.verticalError as string;
                break;
            }

            const calculators: {
                Percentage: (point: Points, series: SeriesProperties, isInverted: boolean, errorX: number, errorY: number) => string[];
                StandardDeviation: (point: Points, series: SeriesProperties,
                    isInverted: boolean, errorX: number, errorY: number) => string[];
                StandardError: (point: Points, series: SeriesProperties, isInverted: boolean, errorX: number, errorY: number) => string[];
                Custom: (point: Points, series: SeriesProperties, isInverted: boolean, errorX: number, errorY: number) => string[];
            } = {
                Percentage: calculatePercentageValue,
                StandardDeviation: calculateStandardDeviationValue,
                StandardError: calculateStandardErrorValue,
                Custom: calculateCustomValue
            };

            const calc: ((point: Points, series: SeriesProperties, isInverted: boolean, errorX: number, errorY: number) => string[])
            = calculators[series.errorBar.type as ErrorBarType];
            const locations: string[] = calc(point, series, series.chart.requireInvertedAxis, Number(errorX), Number(errorY));
            symbolId = series.chart.element.id + '_Series_' + '_ErrorBarGroup_' + seriesIndex + '_Point_' + point.index;
            capId = series.chart.element.id + '_Series_' + '_ErrorBarCap_' + seriesIndex + '_Point_' + point.index;
            pathItems.push({ id: symbolId, fill: '', width: errorbar.width as number, color: point.errorBarColor && point.errorBarColor !== '' ? point.errorBarColor : (errorbar.color as string || series.chart.themeStyle.errorBar as string), opacity: 1, dashArray: '', d: locations[0] });
            capItems.push({ id: capId, fill: '', width: errorBarCap.width as number, color: (errorbar.errorBarCap?.color ? errorbar.errorBarCap.color as string : (errorbar.color || series.chart.themeStyle.errorBar as string)), opacity: series.errorBar.errorBarCap?.opacity as number, dashArray: '', d: locations[1] });

        }

    }
    const markerWidth: number = ((series.marker as ChartMarkerProps).width as number) / 2;
    const markerHeight: number = ((series.marker as ChartMarkerProps).height as number) / 2;
    const clipId: string = `${series.chart.element.id}_ChartErrorBarClipRect_${series.index}`;
    return (
        <g
            id={`${series.chart.element.id}ErrorBarGroup${series.index}`}
            transform={`translate(${series.clipRect?.x}, ${series.clipRect?.y})`}
            clipPath={`url(#${clipId})`}
        >
            <defs>
                <clipPath id={clipId}>
                    <rect
                        id={`${clipId}_Rect`}
                        fill="transparent"
                        stroke="grey"
                        strokeWidth={1}
                        opacity={1}
                        x={-markerWidth}
                        y={-markerHeight}
                        width={(series.clipRect?.width as number) + markerWidth * 2}
                        height={(series.clipRect?.height as number) + markerHeight * 2}
                        rx={0}
                        ry={0}
                        transform={''}
                    />
                </clipPath>
            </defs>

            {pathItems.map((pathOptions: ErrorBarPathItem ) => (
                <path
                    key={pathOptions.id}
                    id={pathOptions.id}
                    opacity={pathOptions.opacity as number}
                    stroke={pathOptions.color}
                    strokeWidth={pathOptions.width}
                    strokeDasharray={pathOptions.dashArray}
                    d={pathOptions.d}
                />
            ))}

            {capItems.map((pathOptions: ErrorBarPathItem) => (
                <path
                    key={pathOptions.id}
                    id={pathOptions.id}
                    opacity={pathOptions.opacity as number}
                    stroke={pathOptions.color}
                    strokeWidth={pathOptions.width}
                    strokeDasharray={pathOptions.dashArray}
                    d={pathOptions.d}
                />
            ))}
        </g>
    );
}

export default renderErrorBarsJSX;
