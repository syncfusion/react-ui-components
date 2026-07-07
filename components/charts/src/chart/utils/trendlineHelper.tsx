import { isNullOrUndefined } from '@syncfusion/react-base';
import { ChartSeriesProps } from '..';
import { SeriesProperties, ChartTrendlineModel, TrendlineSeriesSignature, Points, SlopeInterceptProps } from '../chart-area/chart-interfaces';
import { createPoint } from '../renderer/SeriesRenderer/ProcessData';

/**
 * Calculates the data points for an exponential trendline.
 * Creates three points: start (with backward forecast), middle, and end (with forward forecast).
 *
 * @param {ChartTrendlineModel} trendline - The exponential trendline configuration.
 * @param {Points[]} dataPoints - The original array of data points from the series.
 * @param {number[]} xValues - The x-axis values from the data points.
 * @param {SeriesProperties} series - The target series object for the trendline.
 * @param {SlopeInterceptProps} regressionParams - The calculated slope and intercept values.
 * @returns {Points[]} The array of calculated exponential trendline points.
 *
 * @remarks
 * Exponential equation: y = a * e^(bx)
 * Creates three key points to define the exponential curve.
 * NaN values are replaced with 0 to prevent rendering issues.
 *
 * @private
 */
export function getExponentialPoints(
    trendline: ChartTrendlineModel,
    dataPoints: Points[],
    xValues: number[],
    series: SeriesProperties,
    regressionParams: SlopeInterceptProps
): Points[] {
    const calculatedPoints: Points[] = [];
    const midPointIndex: number = Math.round(dataPoints.length / 2);

    // Start point with backward forecast
    const startX: number = xValues[0] - Number(trendline.backwardForecast);
    const startY: number = regressionParams.intercept * Math.exp(regressionParams.slope * startX);
    calculatedPoints.push(getDataPoint(startX, isNaN(startY) ? 0 : startY, series, calculatedPoints.length));

    // Middle point
    const midX: number = xValues[midPointIndex - 1];
    const midY: number = regressionParams.intercept * Math.exp(regressionParams.slope * midX);
    calculatedPoints.push(getDataPoint(midX, isNaN(midY) ? 0 : midY, series, calculatedPoints.length));

    // End point with forward forecast
    const endX: number = xValues[xValues.length - 1] + Number(trendline.forwardForecast);
    const endY: number = regressionParams.intercept * Math.exp(regressionParams.slope * endX);
    calculatedPoints.push(getDataPoint(endX, isNaN(endY) ? 0 : endY, series, calculatedPoints.length));

    return calculatedPoints;
}

/**
 * Calculates the data points for a linear trendline.
 * Creates two points at the minimum and maximum x-values with forecasting applied.
 *
 * @param {ChartTrendlineModel} trendline - The linear trendline configuration.
 * @param {number[]} xValues - The x-axis values from the data points.
 * @param {SeriesProperties} series - The target series object for the trendline.
 * @param {SlopeInterceptProps} regressionParams - The calculated slope and intercept values.
 * @returns {Points[]} The array of calculated linear trendline points (always 2 points).
 *
 * @remarks
 * Linear equation: y = mx + b
 * Two points define the entire linear trendline.
 * Backward and forward forecasts extend the line beyond the data range.
 *
 * @private
 */
export function getLinearPoints(
    trendline: ChartTrendlineModel,
    xValues: number[],
    series: SeriesProperties,
    regressionParams: SlopeInterceptProps
): Points[] {
    const calculatedPoints: Points[] = [];

    const minX: number = Math.min(...xValues);
    const maxX: number = Math.max(...xValues);

    // Start point with backward forecast
    const startX: number = minX - Number(trendline.backwardForecast);
    const startY: number = regressionParams.slope * startX + regressionParams.intercept;
    calculatedPoints.push(getDataPoint(startX, startY, series, calculatedPoints.length));

    // End point with forward forecast
    const endX: number = maxX + Number(trendline.forwardForecast);
    const endY: number = regressionParams.slope * endX + regressionParams.intercept;
    calculatedPoints.push(getDataPoint(endX, endY, series, calculatedPoints.length));

    return calculatedPoints;
}

/**
 * Calculates the points for a moving average trendline.
 *
 * @param {ChartTrendlineModel} trendline - The moving average trendline configuration.
 * @param {Points[]} points - The data points of the series.
 * @param {number[]} xValues - The x values of the data points.
 * @param {number[]} yValues - The y values of the data points.
 * @param {SeriesProperties} series - The series to which the trendline belongs.
 * @returns {Points[]} - The calculated points for the moving average trendline.
 * @private
 */
export function getMovingAveragePoints(
    trendline: ChartTrendlineModel, points: Points[],
    xValues: number[], yValues: number[], series: SeriesProperties): Points[] {
    const calculatedPoints: Points[] = [];
    let period: number | undefined = (trendline.period as number) >= points.length ? points.length - 1 : trendline.period;
    period = period === 1 ? 1 : Math.max(2, period as number);
    let index: number = 0; let y: number | null; let x: number; let count: number; let nullCount: number;
    while (index < points.length) {
        y = count = nullCount = 0;
        for (let j: number = index; count < period; j++) {
            count++;
            y += yValues[j as number];
        }
        y = period - nullCount < 0 ? null : y ? y / (period - nullCount) : y;
        if (!isNullOrUndefined(y) && !isNaN(y as number)) {
            x = xValues[period - 1 + index];
            calculatedPoints.push(
                getDataPoint(x, y as number, series, calculatedPoints.length));
        }
        index++;
    }
    return calculatedPoints;
}

/**
 * Calculates the data points for a polynomial trendline.
 * Uses Gauss-Jordan elimination to solve for polynomial coefficients.
 *
 * @param {ChartTrendlineModel} trendline - The polynomial trendline configuration.
 * @param {Points[]} dataPoints - The original array of data points from the series.
 * @param {number[]} xValues - The x-axis values from the data points.
 * @param {number[]} yValues - The y-axis values from the data points.
 * @param {SeriesProperties} series - The target series object for the trendline.
 * @returns {Points[]} The array of calculated polynomial trendline points.
 *
 * @remarks
 * Polynomial equation: y = a₀ + a₁x + a₂x² + ... + aₙxⁿ
 * Polynomial order is constrained between 2 and 6.
 * Uses matrix operations to solve the system of equations.
 * Returns empty array if Gauss-Jordan elimination fails.
 *
 * @private
 */
export function getPolynomialPoints(
    trendline: ChartTrendlineModel,
    dataPoints: Points[],
    xValues: number[],
    yValues: number[],
    series: SeriesProperties
): Points[] {
    const MIN_POLYNOMIAL_ORDER: number = 2;
    const MAX_POLYNOMIAL_ORDER: number = 6;

    let polynomialOrder: number = Number(trendline.polynomialOrder);

    // Constrain polynomial order to valid range
    polynomialOrder = dataPoints.length <= polynomialOrder ? dataPoints.length : polynomialOrder;
    polynomialOrder = Math.max(MIN_POLYNOMIAL_ORDER, polynomialOrder);
    polynomialOrder = Math.min(MAX_POLYNOMIAL_ORDER, polynomialOrder);
    trendline.polynomialOrder = polynomialOrder;
    // Initialize coefficient array
    const coefficients: number[] = new Array(polynomialOrder + 1).fill(0);

    // Calculate sum of x^i * y for each coefficient
    for (let pointIndex: number = 0; pointIndex < xValues.length; pointIndex++) {
        const xValue: number = xValues[pointIndex as number];
        const yValue: number = yValues[pointIndex as number];

        for (let powerIndex: number = 0; powerIndex <= polynomialOrder; powerIndex++) {
            coefficients[powerIndex as number] += Math.pow(xValue, powerIndex) * yValue;
        }
    }

    // Build matrix for Gauss-Jordan elimination
    const sumOfPowers: number[] = new Array(1 + 2 * polynomialOrder).fill(0);
    const coefficientMatrix: number[][] = Array.from(
        { length: polynomialOrder + 1 },
        () => new Array(polynomialOrder + 1)
    );

    // Calculate sum of powers for matrix
    for (let pointIndex: number = 0; pointIndex < xValues.length; pointIndex++) {
        const xValue: number = xValues[pointIndex as number];
        let powerValue: number = 1.0;

        for (let powerIndex: number = 0; powerIndex < sumOfPowers.length; powerIndex++) {
            sumOfPowers[powerIndex as number] += powerValue;
            powerValue *= xValue;
        }
    }

    // Fill coefficient matrix
    for (let rowIndex: number = 0; rowIndex <= polynomialOrder; rowIndex++) {
        for (let colIndex: number = 0; colIndex <= polynomialOrder; colIndex++) {
            coefficientMatrix[rowIndex as number][colIndex as number] = sumOfPowers[rowIndex + colIndex];
        }
    }

    // Solve using Gauss-Jordan elimination
    const isSolved: boolean = gaussJordanElimination(coefficientMatrix, coefficients);

    if (isSolved) {
        return getPolynomialTrendlinePoints(trendline, dataPoints, xValues, series, coefficients);
    }

    return [];
}

/**
 * Calculates the data points for a power trendline.
 * Creates three points using the power equation: y = a * x^b.
 *
 * @param {ChartTrendlineModel} trendline - The power trendline configuration.
 * @param {Points[]} dataPoints - The original array of data points from the series.
 * @param {number[]} xValues - The original x-axis values from the data points.
 * @param {SeriesProperties} series - The target series object for the trendline.
 * @param {SlopeInterceptProps} regressionParams - The calculated slope (exponent) and intercept (coefficient) values.
 * @returns {Points[]} The array of calculated power trendline points.
 *
 * @remarks
 * Power equation: y = a * x^b where a is intercept and b is slope
 * Creates three key points to define the power curve.
 * Prevents negative x-values by clamping to 0.
 *
 * @private
 */
export function getPowerPoints(
    trendline: ChartTrendlineModel,
    dataPoints: Points[],
    xValues: number[],
    series: SeriesProperties,
    regressionParams: SlopeInterceptProps
): Points[] {
    const calculatedPoints: Points[] = [];
    const midPointIndex: number = Math.round(dataPoints.length / 2);

    // Start point with backward forecast (prevent negative x)
    let startX: number = xValues[0] - Number(trendline.backwardForecast);
    startX = Math.max(0, startX); // Clamp to 0 to prevent negative values
    const startY: number = regressionParams.intercept * Math.pow(startX, regressionParams.slope);
    calculatedPoints.push(getDataPoint(startX, startY, series, calculatedPoints.length));

    // Middle point
    const midX: number = xValues[midPointIndex - 1];
    const midY: number = regressionParams.intercept * Math.pow(midX, regressionParams.slope);
    calculatedPoints.push(getDataPoint(midX, midY, series, calculatedPoints.length));

    // End point with forward forecast
    const endX: number = xValues[xValues.length - 1] + Number(trendline.forwardForecast);
    const endY: number = regressionParams.intercept * Math.pow(endX, regressionParams.slope);
    calculatedPoints.push(getDataPoint(endX, endY, series, calculatedPoints.length));

    return calculatedPoints;
}

/**
 * Calculates the data points for a logarithmic trendline.
 * Creates three points using the logarithmic equation: y = a + b * ln(x).
 *
 * @param {ChartTrendlineModel} trendline - The logarithmic trendline configuration.
 * @param {Points[]} dataPoints - The original array of data points from the series.
 * @param {number[]} xValues - The original x-axis values from the data points.
 * @param {SeriesProperties} series - The target series object for the trendline.
 * @param {SlopeInterceptProps} regressionParams - The calculated slope and intercept values.
 * @returns {Points[]} The array of calculated logarithmic trendline points.
 *
 * @remarks
 * Logarithmic equation: y = a + b * ln(x)
 * Creates three key points to define the logarithmic curve.
 * Handles zero/negative x-values by using conditional logic.
 *
 * @private
 */
export function getLogarithmicPoints(
    trendline: ChartTrendlineModel,
    dataPoints: Points[],
    xValues: number[],
    series: SeriesProperties,
    regressionParams: SlopeInterceptProps
): Points[] {
    const calculatedPoints: Points[] = [];
    const midPointIndex: number = Math.round(dataPoints.length / 2);

    // Start point with backward forecast
    const startXOriginal: number = xValues[0] - Number(trendline.backwardForecast);
    const startXLog: number = startXOriginal > 0 ? Math.log(startXOriginal) : 0;
    const startY: number = regressionParams.intercept + (regressionParams.slope * startXLog);
    calculatedPoints.push(getDataPoint(startXOriginal, startY, series, calculatedPoints.length));

    // Middle point
    const midXOriginal: number = xValues[midPointIndex - 1];
    const midXLog: number = midXOriginal > 0 ? Math.log(midXOriginal) : 0;
    const midY: number = regressionParams.intercept + (regressionParams.slope * midXLog);
    calculatedPoints.push(getDataPoint(midXOriginal, midY, series, calculatedPoints.length));

    // End point with forward forecast
    const endXOriginal: number = xValues[xValues.length - 1] + Number(trendline.forwardForecast);
    const endXLog: number = endXOriginal > 0 ? Math.log(endXOriginal) : 0;
    const endY: number = regressionParams.intercept + (regressionParams.slope * endXLog);
    calculatedPoints.push(getDataPoint(endXOriginal, endY, series, calculatedPoints.length));

    return calculatedPoints;
}

/**
 * Calculates the data points from polynomial coefficients for the trendline.
 * Distributes points evenly across the data range including forecasts.
 *
 * @param {ChartTrendlineModel} trendline - The polynomial trendline configuration.
 * @param {Points[]} dataPoints - The original array of data points from the series.
 * @param {number[]} xValues - The x-axis values from the data points.
 * @param {SeriesProperties} series - The target series object for the trendline.
 * @param {number[]} coefficients - The calculated polynomial coefficients [a₀, a₁, a₂, ..., aₙ].
 * @returns {Points[]} The array of calculated polynomial trendline points.
 *
 * @remarks
 * Distributes points evenly to ensure smooth curve rendering.
 * First and last points include backward and forward forecasts respectively.
 * Middle points are distributed proportionally across the data range.
 *
 * @private
 */
export function getPolynomialTrendlinePoints(
    trendline: ChartTrendlineModel,
    dataPoints: Points[],
    xValues: number[],
    series: SeriesProperties,
    coefficients: number[]
): Points[] {
    const calculatedPoints: Points[] = [];

    // Sort points and x-values in ascending order
    const sortedPoints: Points[] = [...dataPoints].sort(
        (pointA: Points, pointB: Points) => Number(pointA.xValue) - Number(pointB.xValue)
    );
    const sortedXValues: number[] = [...xValues].sort((a: number, b: number) => a - b);

    const totalPoints: number = coefficients.length;
    const lastPointIndex: number = sortedPoints.length - 1;
    let distributionFactor: number = 1;

    for (let pointIndex: number = 1; pointIndex <= totalPoints; pointIndex++) {
        let xValue: number;
        let yValue: number;

        if (pointIndex === 1) {
            // First point with backward forecast
            xValue = sortedXValues[0] - Number(trendline.backwardForecast);
            yValue = getPolynomialYValue(coefficients, xValue);
        } else if (pointIndex === totalPoints) {
            // Last point with forward forecast
            xValue = sortedXValues[lastPointIndex as number] + Number(trendline.forwardForecast);
            yValue = getPolynomialYValue(coefficients, xValue);
        } else {
            // Middle points distributed proportionally
            distributionFactor += (sortedPoints.length + Number(trendline.forwardForecast)) / totalPoints;
            const distributionIndex: number = Math.floor(distributionFactor) - 1;
            xValue = sortedXValues[distributionIndex as number];
            yValue = getPolynomialYValue(coefficients, xValue);
        }

        calculatedPoints.push(getDataPoint(xValue, yValue, series, calculatedPoints.length));
    }

    return calculatedPoints;
}

/**
 * Calculates the y-value for a given x-value using the polynomial equation.
 * Uses the formula: y = a₀ + a₁x + a₂x² + ... + aₙxⁿ
 *
 * @param {number[]} coefficients - The polynomial coefficients array [a₀, a₁, a₂, ..., aₙ].
 * @param {number} xValue - The x-value for which to calculate the y-value.
 * @returns {number} The calculated y-value.
 *
 * @remarks
 * Evaluates the polynomial at the given x-value using Horner's method implicitly.
 * Each coefficient represents the multiplier for the corresponding power of x.
 *
 * @private
 */
export function getPolynomialYValue(coefficients: number[], xValue: number): number {
    let yValue: number = 0;

    for (let powerIndex: number = 0; powerIndex < coefficients.length; powerIndex++) {
        yValue += coefficients[powerIndex as number] * Math.pow(xValue, powerIndex);
    }

    return yValue;
}


/**
 * Applies Gauss-Jordan elimination to solve a system of linear equations represented by a matrix.
 * Updates the coefficients of the polynomial equation.
 *
 * @param {Array.<Array.<number>>} matrix - The matrix representing the system of linear equations.
 * @param {Array.<number>} polynomialSlopes - The coefficients of the polynomial equation to be updated.
 * @returns {boolean} True if the elimination process was successful, otherwise false.
 *
 * @private
 */
export function gaussJordanElimination(matrix: number[][], polynomialSlopes: number[]): boolean {
    const matrixSize: number = matrix.length;
    const columnIndices: number[] = [];
    const rowIndices: number[] = [];
    const pivotFlags: number[] = [];
    columnIndices.length = matrixSize;
    rowIndices.length = matrixSize;
    pivotFlags.length = matrixSize;
    let index: number = 0;
    while (index < matrixSize) {
        pivotFlags[index as number] = 0;
        ++index;
    }
    let pivotIteration: number = 0;
    while (pivotIteration < matrixSize) {
        let maxValue: number = 0; let pivotRow: number = 0; let pivotCol: number = 0;
        let row: number = 0;
        while (row < matrixSize) {
            if (pivotFlags[row as number] !== 1) {
                let col: number = 0;
                while (col < matrixSize) {
                    if (pivotFlags[col as number] === 0 && Math.abs(matrix[row as number][col as number]) >= maxValue) {
                        maxValue = Math.abs(matrix[row as number][col as number]);
                        pivotRow = row;
                        pivotCol = col;
                    }
                    ++col;
                }
            }
            ++row;
        }
        ++pivotFlags[pivotCol as number];
        if (pivotRow !== pivotCol) {
            let col: number = 0;
            while (col < matrixSize) {
                const tempValue: number = matrix[pivotRow as number][col as number];
                matrix[pivotRow as number][col as number] = matrix[pivotCol as number][col as number];
                matrix[pivotCol as number][col as number] = tempValue;
                ++col;
            }
            const tempSlope: number = polynomialSlopes[pivotRow as number];
            polynomialSlopes[pivotRow as number] = polynomialSlopes[pivotCol as number];
            polynomialSlopes[pivotCol as number] = tempSlope;
        }
        rowIndices[pivotIteration as number] = pivotRow;
        columnIndices[pivotIteration as number] = pivotCol;
        if (matrix[pivotCol as number][pivotCol as number] === 0.0) {
            return false;
        }
        const pivotInverse: number = 1.0 / matrix[pivotCol as number][pivotCol as number];
        matrix[pivotCol as number][pivotCol as number] = 1.0;
        let col: number = 0;
        while (col < matrixSize) {
            matrix[pivotCol as number][col as number] *= pivotInverse;
            ++col;
        }
        polynomialSlopes[pivotCol as number] *= pivotInverse;
        let eliminationRow: number = 0;
        while (eliminationRow < matrixSize) {
            if (eliminationRow !== pivotCol) {
                const multiplier: number = matrix[eliminationRow as number][pivotCol as number];
                matrix[eliminationRow as number][pivotCol as number] = 0.0;
                let col: number = 0;
                while (col < matrixSize) {
                    matrix[eliminationRow as number][col as number] -= matrix[pivotCol as number][col as number] * multiplier;
                    ++col;
                }
                polynomialSlopes[eliminationRow as number] -= polynomialSlopes[pivotCol as number] * multiplier;
            }
            ++eliminationRow;
        }
        ++pivotIteration;
    }
    let backSubstitution: number = matrixSize - 1;
    while (backSubstitution >= 0) {
        if (rowIndices[backSubstitution as number] !== columnIndices[backSubstitution as number]) {
            let row: number = 0;
            while (row < matrixSize) {
                const tempValue: number = matrix[row as number][rowIndices[backSubstitution as number]];
                matrix[row as number][rowIndices[backSubstitution as number]] = matrix[row as
                    number][columnIndices[backSubstitution as number]];
                matrix[row as number][columnIndices[backSubstitution as number]] = tempValue;
                ++row;
            }
        }
        --backSubstitution;
    }
    return true;
}

/**
 * Creates a data point object for the trendline with all necessary properties.
 * Updates the series min/max values and adds the x-value to the series data array.
 *
 * @param {number | Object} x - The x-value of the data point (number or Date object).
 * @param {number | Object} y - The y-value of the data point.
 * @param {SeriesProperties} series - The series to which the point belongs.
 * @param {number} pointIndex - The index of the point in the trendline series.
 * @returns {Points} The created data point object with all required properties.
 *
 * @remarks
 * Automatically converts x-values to Date objects for DateTime axis types.
 * Updates series min/max bounds for proper axis scaling.
 * Adds x-value to series data array for reference.
 * Sets point visibility to true by default.
 *
 * @private
 */
export function getDataPoint(
    x: number | Object,
    y: number | Object,
    series: SeriesProperties,
    pointIndex: number
): Points {
    const trendPoint: Points = createPoint();
    const xNumericValue: number = Number(x);
    const yNumericValue: number = Number(y);

    // Handle DateTime axis type
    trendPoint.x = series.xAxis.valueType === 'DateTime'
        ? new Date(xNumericValue)
        : x;
    trendPoint.y = y;
    trendPoint.xValue = xNumericValue;
    trendPoint.yValue = yNumericValue;
    trendPoint.color = String(series.fill);
    trendPoint.index = pointIndex;
    trendPoint.visible = true;

    // Update series bounds
    series.xMin = Math.min(series.xMin, xNumericValue);
    series.yMin = Math.min(series.yMin, yNumericValue);
    series.xMax = Math.max(series.xMax, xNumericValue);
    series.yMax = Math.max(series.yMax, yNumericValue);

    // Add to series data array
    series.xData.push(xNumericValue);

    return trendPoint;
}

/**
 * Extracts trendline signature data from series list for change detection.
 * Creates a lightweight representation of trendline configurations to detect changes.
 *
 * @param {ChartSeriesProps[]} seriesList - Array of chart series configurations
 * @returns {Array} Array of trendline signature objects containing essential properties
 *
 * @private
 */
export function extractTrendlineSignature(seriesList: ChartSeriesProps[]): TrendlineSeriesSignature[] {
    return seriesList.map((series: ChartSeriesProps, idx: number) => {
        const trendlines: ChartTrendlineModel[] = (series as SeriesProperties)?.trendlines || [];

        return {
            seriesIndex: idx,
            trendlineCount: trendlines.length,
            trendlines: trendlines.map((trendline: ChartTrendlineModel, tIdx: number) => {
                if (!trendline) { return null; }

                return {
                    index: tIdx,
                    name: trendline.name,
                    dashArray: trendline.dashArray,
                    visible: trendline.visible,
                    type: trendline.type,
                    period: trendline.period,
                    polynomialOrder: trendline.polynomialOrder,
                    backwardForecast: trendline.backwardForecast,
                    forwardForecast: trendline.forwardForecast,
                    intercept: trendline.intercept,
                    fill: trendline.stroke,
                    opacity: trendline.opacity,
                    width: trendline.width,
                    legendShape: trendline.legendShape,
                    enableTooltip: trendline.enableTooltip
                };
            }).filter(Boolean)
        };
    });
}
