/**
 * Helper functions for Polar and Radar chart coordinate transformations and calculations.
 * Supports linear and logarithmic axes.
 *
 * @private
 */

import { AxisModel, Chart, Points, PolarColumnHitRegion, SeriesProperties, VisibleLabel, VisibleRangeProps } from '../chart-area/chart-interfaces';
import { ChartLocationProps } from '../base/interfaces';
import { logBase } from './helper';

/**
 * Converts a numerical value to a coefficient in the range [0, 1] relative to polar/radar axes.
 * This is used for both radial (Y-axis) and angular (X-axis) dimensions.
 * Handles both linear and logarithmic axes properly.
 *
 * @param {number} value - The numerical value to convert
 * @param {AxisModel} axis - The axis model containing visible range information
 * @returns {number} Coefficient in range [0, 1]
 * @private
 */
export function valueToPolarCoefficient(value: number, axis: AxisModel): number {
    const range: VisibleRangeProps = axis.visibleRange;
    let transformedValue: number = value;

    // For logarithmic axes, convert the value to log scale first
    if (axis.valueType === 'Logarithmic' && axis.logBase) {
        // Ensure value is positive (logarithm of negative/zero is undefined)
        if (value <= 0) {
            transformedValue = range.minimum;
        } else {
            transformedValue = logBase(value, axis.logBase);
            // If the transformation resulted in an invalid number, use the minimum range
            if (!isFinite(transformedValue)) {
                transformedValue = range.minimum;
            }
        }
    }

    // Calculate coefficient using the (possibly log-transformed) value
    const coefficient: number = (transformedValue - range.minimum) / (range.delta || 1);

    // Clamp coefficient to [0, 1] range to handle edge cases
    return Math.max(0, Math.min(1, coefficient));
}

/**
 * Converts a coefficient and start angle to a unit vector.
 * Used to determine the direction from the chart center for polar and radar layouts.
 *
 * @param {number} coefficient - Value in range [0, 1] representing angular position
 * @param {number} startAngle - Starting angle in degrees for the polar/radar chart
 * @returns {ChartLocationProps} Vector with x and y components representing direction
 * @private
 */
export function coefficientToVector(coefficient: number, startAngle: number): ChartLocationProps {
    // Normalize start angle to [0, 360)
    startAngle = startAngle < 0 ? startAngle + 360 : startAngle;

    // Convert coefficient to radians, starting from 270 degrees (top of chart)
    let angle: number = Math.PI * (1.5 + 2 * coefficient);

    // Apply start angle offset
    angle = angle + (startAngle * Math.PI) / 180;

    // Return unit vector in the direction of the angle
    return { x: Math.cos(angle), y: Math.sin(angle) };
}

/**
 * Transforms data coordinates (value on axis) to visible pixel coordinates in a polar chart.
 * This is the primary coordinate transformation function for polar series rendering.
 * Properly handles both linear and logarithmic axes.
 *
 * @param {number} xValue - X-axis data value
 * @param {number} yValue - Y-axis data value (radial distance)
 * @param {AxisModel} xAxis - X-axis model (angular axis)
 * @param {AxisModel} yAxis - Y-axis model (radial axis)
 * @param {Chart} chart - Chart instance containing center and radius information
 * @returns {ChartLocationProps} Pixel coordinates in the chart
 * @private
 *
 * @example
 * // Transform data point (x=2020, y=500) on linear X and logarithmic Y axes
 * const pixel = transformToPolarCoordinates(2020, 500, xAxis, logYAxis, chart);
 * // Returns: { x: 650.5, y: 215.3 }
 */
export function transformToPolarCoordinates(
    xValue: number,
    yValue: number,
    xAxis: AxisModel,
    yAxis: AxisModel,
    chart: Chart
): ChartLocationProps {
    // Get chart center and radius
    const centerX: number = (chart as Chart).polarCenterX as number;
    const centerY: number = (chart as Chart).polarCenterY as number;
    const radius: number = (chart as Chart).radius as number;

    // Get start angle from X-axis (angular axis)
    const startAngle: number = (xAxis.startAngle as number) || 0;

    // Convert Y value (radial) to coefficient (0-1 range)
    // This handles both linear and logarithmic Y axes
    let radialCoefficient: number = valueToPolarCoefficient(yValue, yAxis);

    // Apply inversion for Y-axis (radial)
    const isYAxisInverted: boolean = (yAxis.isAxisInverse as boolean) || false;
    if (isYAxisInverted) {
        radialCoefficient = 1 - radialCoefficient;
    }

    // Calculate actual radius for this point
    const pointRadius: number = radius * radialCoefficient;

    // Convert X value (angle) to coefficient and then to vector
    // For category axes with OnTicks placement, use direct index distribution
    // For category axes with BetweenTicks placement, offset by 0.5
    let angularCoefficient: number;

    if (xAxis.valueType === 'Category') {
        const visibleLabels: VisibleLabel[] = (xAxis.visibleLabels && xAxis.visibleLabels.length) ? xAxis.visibleLabels : [];
        const totalCount: number = visibleLabels.length;

        if (xAxis.labelStyle.placement === 'BetweenTicks' && totalCount > 0) {
            // BetweenTicks: offset by 0.5
            angularCoefficient = (xValue + 0.5) / totalCount;
        } else if (totalCount > 0) {
            // OnTicks: direct index distribution
            angularCoefficient = xValue / totalCount;
        } else {
            // Fallback for empty labels
            angularCoefficient = valueToPolarCoefficient(xValue, xAxis);
        }
    } else {
        // For numeric axes, use value-based coefficient
        angularCoefficient = valueToPolarCoefficient(xValue, xAxis);
    }

    // Apply axis inversion if enabled (using the computed isAxisInverse property)
    const isInverted: boolean = (xAxis.isAxisInverse as boolean) || false;
    if (isInverted) {
        angularCoefficient = 1 - angularCoefficient;
    }

    const vector: ChartLocationProps = coefficientToVector(angularCoefficient, startAngle);

    // Convert from center + vector + radius to pixel coordinates
    return {
        x: centerX + pointRadius * vector.x,
        y: centerY + pointRadius * vector.y
    };
}

/**
 * Transforms data coordinates (value on axis) to visible pixel coordinates in a radar chart.
 * Radar charts are similar to polar but use polygonal grid instead of circular.
 * This is the primary coordinate transformation function for radar series rendering.
 * Properly handles both linear and logarithmic axes.
 *
 * @param {number} xValue - X-axis data value
 * @param {number} yValue - Y-axis data value (radial distance)
 * @param {AxisModel} xAxis - X-axis model (angular axis)
 * @param {AxisModel} yAxis - Y-axis model (radial axis)
 * @param {Chart} chart - Chart instance containing center and radius information
 * @returns {ChartLocationProps} Pixel coordinates in the chart
 * @private
 *
 * @example
 * // Transform data point (x=2, y=50) on category X and logarithmic Y axes
 * const pixel = transformToRadarCoordinates(2, 50, xAxis, logYAxis, chart);
 * // Returns: { x: 632.0, y: 250.5 }
 */
export function transformToRadarCoordinates(
    xValue: number,
    yValue: number,
    xAxis: AxisModel,
    yAxis: AxisModel,
    chart: Chart
): ChartLocationProps {
    // Radar coordinates are identical to polar in terms of transformation
    // The difference is in the grid rendering (polygon vs circle)
    return transformToPolarCoordinates(xValue, yValue, xAxis, yAxis, chart);
}

/**
 * Returns the visible polar column point for the given mouse coordinates.
 * Iterates through hit regions from topmost to bottommost and returns the first match.
 *
 * @param {SeriesProperties} series - Series containing polar column hit regions.
 * @param {number} mouseX - Mouse X coordinate in chart space.
 * @param {number} mouseY - Mouse Y coordinate in chart space.
 * @returns {Points | null} The matching point if the coordinates are inside a hit region; otherwise null.
 *
 * @private
 */
export function getPolarColumnPoint(
    series: SeriesProperties,
    mouseX: number,
    mouseY: number
): Points | null {

    const regions: PolarColumnHitRegion[] = series.polarColumnHitRegions as PolarColumnHitRegion[];
    if (!series.visible || !regions || regions.length === 0) {
        return null;
    }

    const x: number = mouseX;
    const y: number = mouseY;

    //  Last drawn path is visually on top
    for (let i: number = regions.length - 1; i >= 0; i--) {
        if (isInsidePolarArcSVG(x, y, regions[i as number])) {
            return regions[i as number].point;
        }
    }

    return null;
}

/**
 * Determines whether a point lies inside a polar SVG arc region.
 * Performs both radial distance and angular range checks, including wrap-around handling.
 *
 * @param {number} x - X coordinate to test.
 * @param {number} y - Y coordinate to test.
 * @param {object} region - Arc region definition used for the hit test.
 * @param {number} region.startAngle - Arc start angle in radians.
 * @param {number} region.endAngle - Arc end angle in radians.
 * @param {number} region.innerRadius - Inner radius of the arc.
 * @param {number} region.outerRadius - Outer radius of the arc.
 * @param {number} region.centerX - Center X coordinate of the arc.
 * @param {number} region.centerY - Center Y coordinate of the arc.
 * @returns {boolean} True when the point lies inside the arc region; otherwise false.
 *
 * @private
 */
export function isInsidePolarArcSVG(
    x: number,
    y: number,
    region: {
        startAngle: number;
        endAngle: number;
        innerRadius: number;
        outerRadius: number;
        centerX: number;
        centerY: number;
    }
): boolean {

    const dx: number = x - region.centerX;
    const dy: number = y - region.centerY;

    //  Radial distance check
    const distance: number = Math.sqrt(dx * dx + dy * dy);
    if (distance < region.innerRadius || distance > region.outerRadius) {
        return false;
    }

    //  SVG angle: 0 at +X axis, clockwise
    let angle: number = Math.atan2(dy, dx);
    if (angle < 0) {
        angle += 2 * Math.PI;
    }

    let start: number = region.startAngle;
    let end: number = region.endAngle;

    if (start < 0) {start += 2 * Math.PI; }
    if (end < 0) {end += 2 * Math.PI; }

    //  Handle arc wrap‑around
    if (start > end) {
        return angle >= start || angle <= end;
    }

    return angle >= start && angle <= end;
}

/**
 * Calculates monotonic spline coefficients for polar series
 * Implements Fritsch-Carlson monotonic spline algorithm
 *
 * @param {Points[]} points - Array of data points
 * @returns {number[]} - Array of calculated monotonic spline coefficients
 * @private
 */
export const monotonicSplineCoefficients: (points: Points[]) => number[] = (points: Points[]): number[] => {
    const count: number = points.length;
    const ySpline: number[] = [];

    if (count < 2) {
        return ySpline;
    }

    // Calculate differences and slopes
    const deltaX: number[] = [];
    const deltaY: number[] = [];
    const slope: number[] = [];

    for (let i: number = 0; i < count - 1; i++) {
        deltaX[i as number] = (points[i + 1].xValue as number) - (points[i as number].xValue as number);
        deltaY[i as number] = (points[i + 1].yValue as number) - (points[i as number].yValue as number);

        if (deltaX[i as number] !== 0) {
            slope[i as number] = deltaY[i as number] / deltaX[i as number];
        } else {
            slope[i as number] = 0;
        }
    }

    // Initialize with zero slopes at endpoints
    ySpline[0] = 0;
    ySpline[count - 1] = 0;

    // Calculate interior slopes using Fritsch-Carlson method
    for (let i: number = 1; i < count - 1; i++) {
        if (slope[i - 1] * slope[i as number] <= 0) {
            // If slopes have different signs, set derivative to 0
            ySpline[i as number] = 0;
        } else {
            // Weighted harmonic mean of adjacent slopes
            const weight1: number = 2 * deltaX[i as number] + deltaX[i - 1];
            const weight2: number = deltaX[i as number] + 2 * deltaX[i - 1];

            if (weight1 + weight2 > 0) {
                ySpline[i as number] = (weight1 + weight2) / (weight1 / slope[i - 1] + weight2 / slope[i as number]);
            } else {
                ySpline[i as number] = 0;
            }
        }

        // Ensure the result is a finite number
        if (!Number.isFinite(ySpline[i as number])) {
            ySpline[i as number] = 0;
        }
    }

    return ySpline;
};
