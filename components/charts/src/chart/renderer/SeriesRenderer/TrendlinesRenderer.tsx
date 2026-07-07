import { ChartSeriesType, TrendlineTypes } from '../../base/enum';
import { ChartComponentProps, ChartMarkerProps, SeriesAccessibility } from '../../base/interfaces';
import { SeriesProperties, Points, ChartTrendlineModel, RenderOptions, MarkerProperties, DataLabelRendererResult, SlopeInterceptProps } from '../../chart-area/chart-interfaces';
import { defaultChartConfigs } from '../../base/default-properties';
import * as React from 'react';
import { seriesModules } from './SeriesRenderer';
import { firstToLowerCase } from '../../utils/helper';
import { renderMarkerJSX } from './MarkerRenderer';
import { LayoutMap } from '../../layout/LayoutContext';
import { renderDataLabelJSX } from './DataLabelRender';
import { getExponentialPoints, getLinearPoints, getMovingAveragePoints, getPolynomialPoints, getPowerPoints, getLogarithmicPoints } from '../../utils/trendlineHelper';
import { seriesGroupAriaLabel } from './ariaLabelHelper';


/**
 * Represents animation state properties for trendline rendering.
 *
 * @interface TrendlineAnimationState
 * @private
 */
interface TrendlineAnimationState {
    previousPathLengthRef: React.RefObject<number[]>;
    isInitialRenderRef: React.RefObject<boolean[]>;
    renderedPathDRef: React.RefObject<string[]>;
    animationProgress: number;
    isFirstRenderRef: React.RefObject<boolean>;
    previousSeriesOptionsRef: React.RefObject<RenderOptions[][]>;
}

/**
 * Represents the properties for rendering animated trendline paths.
 *
 * @interface AnimatedPathProps
 * @private
 */
interface AnimatedPathProps {
    interpolatedD?: string;
    strokeDasharray: string | 'none';
    strokeDashoffset: number;
    animatedTransform?: string;
    animatedClipPath?: string;
}

/**
 * Initializes the series collection for the specified trendline in the chart.
 * Creates a new series object with default configurations and applies trendline-specific properties.
 *
 * @param {SeriesProperties} series - The source series of trendline.
 * @param {ChartTrendlineModel} trendline - The trendline configuration object containing type, styling, and behavior settings.
 * @param {ChartComponentProps} chart - The parent chart instance that will contain the trendline series.
 * @returns {void}
 *
 * @remarks
 * - Sets the series type based on trendline type (Linear/MovingAverage use 'Line', others use 'Spline')
 * - Applies default styling with blue color as fallback
 * - Initializes empty data arrays for points, x-values, and y-values
 * - Sets min/max values to infinity for subsequent calculations
 *
 * @private
 */
export function initTrendlineSeriesCollection(series: SeriesProperties
    , trendline: ChartTrendlineModel, chart: ChartComponentProps): void {
    trendline.targetSeries = {
        ...defaultChartConfigs.ChartSeries
    } as SeriesProperties;

    const seriesType: ChartSeriesType =
        trendline.type === 'Linear' || trendline.type === 'MovingAverage' ? 'Line' : 'Spline';
    trendline.targetSeries.type = seriesType;

    Object.assign(trendline.targetSeries, {
        name: trendline.name,
        xField: 'x',
        yField: 'y',
        xAxisName: series.xAxisName,
        yAxisName: series.yAxisName,
        seriesType: series.seriesType,
        sourceIndex: series.index,
        fill: trendline.stroke || series.fill,
        width: trendline.width,
        dashArray: trendline.dashArray,
        enableTooltip: trendline.enableTooltip,
        opacity: trendline.opacity,
        interior: trendline.stroke || series.interior,
        animation: trendline.animation,
        legendShape: trendline.legendShape,
        marker: trendline.marker,
        category: 'TrendLine',
        chartProps: chart,
        xMin: Infinity,
        xMax: -Infinity,
        yMin: Infinity,
        yMax: -Infinity,
        points: [] as Points[],
        xData: [] as number[],
        yData: [] as number[]
    });
}

/**
 * Initializes the data source for the trendline by calculating points based on the trendline type.
 * Dispatches to specific calculation functions based on the selected trendline algorithm.
 *
 * @param {ChartTrendlineModel} trendline - The trendline configuration containing type, forecast settings, and target series.
 * @returns {void}
 *
 * @remarks
 * Supported trendline types:
 * - Linear: Straight line using least squares regression
 * - Exponential: Exponential growth/decay curve
 * - MovingAverage: Rolling average over a specified period
 * - Polynomial: Polynomial curve of specified order (2-6)
 * - Power: Power law relationship
 * - Logarithmic: Logarithmic relationship
 *
 * @private
 */
export function initDataSource(trendline: ChartTrendlineModel): void {
    const dataPoints: Points[] = trendline.points as Points[];

    if (!dataPoints || dataPoints.length === 0) {
        return;
    }

    const trendlineSeries: SeriesProperties = trendline.targetSeries as  SeriesProperties;
    const trendlineType: TrendlineTypes | undefined = trendline.type;

    switch (trendlineType) {
    case 'Linear':
        setLinearRange(dataPoints, trendline, trendlineSeries);
        break;
    case 'Exponential':
        setExponentialRange(dataPoints, trendline, trendlineSeries);
        break;
    case 'MovingAverage':
        setMovingAverageRange(dataPoints, trendline, trendlineSeries);
        break;
    case 'Polynomial':
        setPolynomialRange(dataPoints, trendline, trendlineSeries);
        break;
    case 'Power':
        setPowerRange(dataPoints, trendline, trendlineSeries);
        break;
    case 'Logarithmic':
        setLogarithmicRange(dataPoints, trendline, trendlineSeries);
        break;
    }
}

/**
 * Sets the range for an exponential trendline by calculating exponential regression.
 * Uses logarithmic transformation of y-values to compute the exponential fit.
 *
 * @param {Points[]} dataPoints - The array of data points from the parent series.
 * @param {ChartTrendlineModel} trendline - The exponential trendline configuration.
 * @param {SeriesProperties} series - The target series object to store calculated points.
 * @returns {void}
 *
 * @remarks
 * Exponential equation: y = a * e^(b*x)
 * Uses ln(y) transformation for linear regression, then exponentiates results.
 *
 * @private
 */
function setExponentialRange(
    dataPoints: Points[],
    trendline: ChartTrendlineModel,
    series: SeriesProperties
): void {
    const xValues: number[] = [];
    const transformedYValues: number[] = [];

    for (let pointIndex: number = 0; pointIndex < dataPoints.length; pointIndex++) {
        const currentPoint: Points = dataPoints[pointIndex as number];
        const logYValue: number = currentPoint.yValue ? Math.log(currentPoint.yValue) : 0;

        xValues.push(Number(currentPoint.xValue));
        transformedYValues.push(logYValue);
    }

    const regressionParams: SlopeInterceptProps = findSlopeIntercept(
        xValues,
        transformedYValues,
        trendline,
        dataPoints
    );

    series.points = getExponentialPoints(
        trendline,
        dataPoints,
        xValues,
        series,
        regressionParams
    );
}

/**
 * Sets the range for a linear trendline by calculating linear regression using least squares method.
 *
 * @param {Points[]} dataPoints - The array of data points from the parent series.
 * @param {ChartTrendlineModel} trendline - The linear trendline configuration.
 * @param {SeriesProperties} series - The target series object to store calculated points.
 * @returns {void}
 *
 * @remarks
 * Linear equation: y = mx + b
 * Calculates best-fit line through data points with optional forecasting.
 *
 * @private
 */
function setLinearRange(
    dataPoints: Points[],
    trendline: ChartTrendlineModel,
    series: SeriesProperties
): void {
    const xValues: number[] = [];
    const yValues: number[] = [];

    for (let pointIndex: number = 0; pointIndex < dataPoints.length; pointIndex++) {
        const currentPoint: Points = dataPoints[pointIndex as number];
        xValues.push(Number(currentPoint.xValue));
        yValues.push(Number(currentPoint.yValue));
    }

    const regressionParams: SlopeInterceptProps = findSlopeIntercept(
        xValues,
        yValues,
        trendline,
        dataPoints
    );

    series.points = getLinearPoints(
        trendline,
        xValues,
        series,
        regressionParams
    );
}

/**
 * Sets the range for a moving average trendline by calculating rolling average values.
 *
 * @param {Points[]} dataPoints - The array of data points from the parent series.
 * @param {ChartTrendlineModel} trendline - The moving average trendline configuration.
 * @param {SeriesProperties} series - The target series object to store calculated points.
 * @returns {void}
 *
 * @remarks
 * Computes average of values within a sliding window defined by the period property.
 * Handles null/undefined values by excluding them from the average calculation.
 *
 * @private
 */
function setMovingAverageRange(
    dataPoints: Points[],
    trendline: ChartTrendlineModel,
    series: SeriesProperties
): void {
    const xValues: number[] = [];
    const yValues: number[] = [];
    const originalXValues: number[] = [];

    for (let pointIndex: number = 0; pointIndex < dataPoints.length; pointIndex++) {
        const currentPoint: Points = dataPoints[pointIndex as number];
        originalXValues.push(Number(currentPoint.xValue));
        xValues.push(pointIndex + 1);
        yValues.push(Number(currentPoint.yValue));
    }

    series.points = getMovingAveragePoints(
        trendline,
        dataPoints,
        originalXValues,
        yValues,
        series
    );
}

/**
 * Sets the range for a polynomial trendline by calculating polynomial regression coefficients.
 *
 * @param {Points[]} dataPoints - The array of data points from the parent series.
 * @param {ChartTrendlineModel} trendline - The polynomial trendline configuration.
 * @param {SeriesProperties} series - The target series object to store calculated points.
 * @returns {void}
 *
 * @remarks
 * Polynomial equation: y = a₀ + a₁x + a₂x² + ... + aₙxⁿ
 * Uses Gauss-Jordan elimination to solve the system of equations.
 * Polynomial order is constrained between 2 and 6.
 *
 * @private
 */
function setPolynomialRange(
    dataPoints: Points[],
    trendline: ChartTrendlineModel,
    series: SeriesProperties
): void {
    const xValues: number[] = [];
    const yValues: number[] = [];

    for (let pointIndex: number = 0; pointIndex < dataPoints.length; pointIndex++) {
        const currentPoint: Points = dataPoints[pointIndex as number];
        xValues.push(Number(currentPoint.xValue));
        yValues.push(Number(currentPoint.yValue));
    }

    series.points = getPolynomialPoints(
        trendline,
        dataPoints,
        xValues,
        yValues,
        series
    );
}

/**
 * Sets the range for a power trendline by calculating power regression using logarithmic transformation.
 *
 * @param {Points[]} dataPoints - The array of data points from the parent series.
 * @param {ChartTrendlineModel} trendline - The power trendline configuration.
 * @param {SeriesProperties} series - The target series object to store calculated points.
 * @returns {void}
 *
 * @remarks
 * Power equation: y = a * x^b
 * Uses log-log transformation for linear regression, then exponentiates results.
 *
 * @private
 */
function setPowerRange(
    dataPoints: Points[],
    trendline: ChartTrendlineModel,
    series: SeriesProperties
): void {
    const logXValues: number[] = [];
    const logYValues: number[] = [];
    const originalXValues: number[] = [];

    for (let pointIndex: number = 0; pointIndex < dataPoints.length; pointIndex++) {
        const currentPoint: Points = dataPoints[pointIndex as number];
        const logX: number = currentPoint.xValue ? Math.log(Number(currentPoint.xValue)) : 0;
        const logY: number = currentPoint.yValue ? Math.log(Number(currentPoint.yValue)) : 0;

        originalXValues.push(Number(currentPoint.xValue));
        logXValues.push(logX);
        logYValues.push(logY);
    }

    const regressionParams: SlopeInterceptProps = findSlopeIntercept(
        logXValues,
        logYValues,
        trendline,
        dataPoints
    );

    series.points = getPowerPoints(
        trendline,
        dataPoints,
        originalXValues,
        series,
        regressionParams
    );
}

/**
 * Sets the range for a logarithmic trendline by calculating logarithmic regression.
 *
 * @param {Points[]} dataPoints - The array of data points from the parent series.
 * @param {ChartTrendlineModel} trendline - The logarithmic trendline configuration.
 * @param {SeriesProperties} series - The target series object to store calculated points.
 * @returns {void}
 *
 * @remarks
 * Logarithmic equation: y = a + b * ln(x)
 * Uses semi-log transformation for linear regression.
 *
 * @private
 */
function setLogarithmicRange(
    dataPoints: Points[],
    trendline: ChartTrendlineModel,
    series: SeriesProperties
): void {
    const logXValues: number[] = [];
    const yValues: number[] = [];
    const originalXValues: number[] = [];

    for (let pointIndex: number = 0; pointIndex < dataPoints.length; pointIndex++) {
        const currentPoint: Points = dataPoints[pointIndex as number];
        const logX: number = currentPoint.xValue ? Math.log(Number(currentPoint.xValue)) : 0;

        originalXValues.push(Number(currentPoint.xValue));
        logXValues.push(logX);
        yValues.push(Number(currentPoint.yValue));
    }

    const regressionParams: SlopeInterceptProps = findSlopeIntercept(
        logXValues,
        yValues,
        trendline,
        dataPoints
    );

    series.points = getLogarithmicPoints(
        trendline,
        dataPoints,
        originalXValues,
        series,
        regressionParams
    );
}

/**
 * Calculates the slope and intercept for a trendline using least squares regression.
 * Handles special cases for Linear and Exponential trendlines with custom intercepts.
 *
 * @param {number[]} xValues - The array of x-axis values (may be transformed for non-linear regression).
 * @param {number[]} yValues - The array of y-axis values (may be transformed for non-linear regression).
 * @param {ChartTrendlineModel} trendline - The trendline configuration object.
 * @param {Points[]} dataPoints - The original array of data points.
 * @returns {SlopeInterceptProps} The calculated slope and intercept values for the regression line.
 *
 * @remarks
 * Uses the least squares method: slope = (n∑xy - ∑x∑y) / (n∑x² - (∑x)²)
 * Handles NaN values by interpolating between adjacent valid values.
 * Custom intercept handling for Linear and Exponential types when specified.
 *
 * @private
 */
function findSlopeIntercept(
    xValues: number[],
    yValues: number[],
    trendline: ChartTrendlineModel,
    dataPoints: Points[]
): SlopeInterceptProps {
    let sumX: number = 0;
    let sumY: number = 0;
    let sumXY: number = 0;
    let sumXSquared: number = 0;

    const pointCount: number = dataPoints.length;

    for (let pointIndex: number = 0; pointIndex < pointCount; pointIndex++) {
        // Interpolate NaN values using adjacent points
        if (isNaN(yValues[pointIndex as number])) {
            const previousY: number = yValues[pointIndex - 1];
            const nextY: number = yValues[pointIndex + 1];
            yValues[pointIndex as number] = (previousY + nextY) / 2;
        }

        const xValue: number = xValues[pointIndex as number];
        const yValue: number = yValues[pointIndex as number];

        sumX += xValue;
        sumY += yValue;
        sumXY += xValue * yValue;
        sumXSquared += xValue * xValue;
    }

    const trendlineType: TrendlineTypes | undefined = trendline.type;
    let slope: number = 0;
    let intercept: number = 0;

    // Handle custom intercept for Linear and Exponential types
    if (trendline.intercept && (trendlineType === 'Linear' || trendlineType === 'Exponential')) {
        intercept = trendline.intercept;

        if (trendlineType === 'Linear') {
            slope = (sumXY - (trendline.intercept * sumX)) / sumXSquared;
        } else if (trendlineType === 'Exponential') {
            slope = (sumXY - (Math.log(Math.abs(trendline.intercept)) * sumX)) / sumXSquared;
        }
    } else {
        // Standard least squares calculation
        const numerator: number = (pointCount * sumXY) - (sumX * sumY);
        const denominator: number = (pointCount * sumXSquared) - (sumX * sumX);
        slope = numerator / denominator;

        // Ensure positive slope for non-linear types
        slope = trendlineType === 'Linear' ? slope : Math.abs(slope);

        // Calculate intercept based on trendline type
        if (trendlineType === 'Exponential' || trendlineType === 'Power') {
            intercept = Math.exp((sumY - (slope * sumX)) / pointCount);
        } else {
            intercept = (sumY - (slope * sumX)) / pointCount;
        }
    }

    return { slope, intercept };
}

/**
 * Renders trendline series paths with animation support.
 * Groups trendlines by their source series and renders them with proper accessibility and animation.
 *
 * @param {Object} layoutRef - Reference to the layout map for data label positioning.
 * @param {string} chartId - The unique identifier of the chart component.
 * @param {Object} trendSeriesOptions - Trendline series options grouped by source series index.
 * @param {Array} visibleSeries - Array of all visible series in the chart.
 * @param {Object} animationState - Animation state object containing refs and progress tracking.
 * @param {number} animationProgress - Current animation progress value (0 to 1).
 * @param {Object} [trendlineMarkers] - Optional marker configurations for trendlines.
 * @param {Object} [dataLabel] - Optional data label configurations for trendlines.
 * @param {number} [labelOpacity] - Optional opacity value for data labels (0 to 1).
 * @returns {Object|null} Rendered trendline paths JSX element or null if no trendlines exist.
 *
 * @private
 */
export function renderTrendlineSeriesJSX(
    layoutRef: React.MutableRefObject<LayoutMap>,
    chartId: string,
    trendSeriesOptions: { [sourceIndex: number]: RenderOptions[][] },
    visibleSeries: SeriesProperties[],
    animationState: TrendlineAnimationState,
    animationProgress: number,
    trendlineMarkers?: { [sourceIndex: number]: ChartMarkerProps[] },
    dataLabel?: { [sourceIndex: number]: DataLabelRendererResult[][] },
    labelOpacity?: number
): React.ReactElement | null {
    // Early return if no trendline options provided
    if (!trendSeriesOptions || Object.keys(trendSeriesOptions).length === 0) {
        return null;
    }

    return (
        <g id={`${chartId}TrendlineCollection`}>
            {Object.entries(trendSeriesOptions).map(
                ([_sourceIndexKey, trendlinePathOptionsList]: [string, RenderOptions[][]]): React.ReactElement | null => {
                    // Extract indices and series references
                    const firstPathOption: RenderOptions = trendlinePathOptionsList[0][0];
                    const trendlineSeriesIndex: number = parseInt(
                        firstPathOption.id.split('_Series_')[1].split('_')[0],
                        10
                    );
                    const trendlineSeries: SeriesProperties = visibleSeries[trendlineSeriesIndex as number];
                    const sourceSeriesIndex: number = trendlineSeries.sourceIndex;
                    const sourceSeries: SeriesProperties = visibleSeries[sourceSeriesIndex as number];
                    if (!sourceSeries.visible) {
                        return null;
                    }
                    // Get accessibility configuration
                    const accessibility: SeriesAccessibility = sourceSeries.accessibility as SeriesAccessibility;
                    const isFocusable: boolean = accessibility?.focusable as boolean;
                    const tabIndex: number = isFocusable ? (accessibility?.tabIndex as number) : -1;

                    // Get clip rectangle dimensions
                    const clipRectX: number = sourceSeries.clipRect?.x as number;
                    const clipRectY: number = sourceSeries.clipRect?.y as number;
                    const clipRectWidth: number = sourceSeries.clipRect?.width as number;
                    const clipRectHeight: number = sourceSeries.clipRect?.height as number;

                    // Generate unique IDs
                    const groupId: string = `${chartId}TrendlineSeriesGroup${sourceSeriesIndex}`;
                    const clipPathId: string = `${chartId}_ChartTrendlineClipRect_${sourceSeriesIndex}`;
                    const clipPathRectId: string = `${clipPathId}_Rect`;

                    return (
                        <g
                            key={groupId}
                            id={groupId}
                            clipPath={`url(#${clipPathId})`}
                            transform={`translate(${clipRectX}, ${clipRectY})`}
                            style={{ outline: 'none' }}
                            role="region"
                            aria-label={seriesGroupAriaLabel({ series: trendlineSeries
                                , seriesIndex: trendlineSeriesIndex, totalSeriesCount: visibleSeries.length })}
                            aria-hidden="false"
                        >
                            {/* Clip path definition for trendlines */}
                            <defs>
                                <clipPath id={clipPathId}>
                                    <rect
                                        id={clipPathRectId}
                                        fill="transparent"
                                        stroke="grey"
                                        strokeWidth={1}
                                        opacity={1}
                                        x={0}
                                        y={0}
                                        width={clipRectWidth}
                                        height={clipRectHeight}
                                    />
                                </clipPath>
                            </defs>

                            {/* Render each trendline path */}
                            {trendlinePathOptionsList.map(
                                (trendlinePathOptions: RenderOptions[], trendlineIndex: number): React.ReactElement => {
                                    const trendlineGroupKey: string = `${chartId}_Trendline_${sourceSeriesIndex}_${trendlineIndex}`;
                                    return (
                                        <React.Fragment key={trendlineGroupKey}>
                                            {trendlinePathOptions.map(
                                                (pathOption: RenderOptions, pathSegmentIndex: number): React.ReactElement => {
                                                    // Extract current trendline series information
                                                    const currentTrendlineSeriesIndex: number = parseInt(
                                                        pathOption.id.split('_Series_')[1].split('_')[0],
                                                        10
                                                    );
                                                    const currentTrendlineSeries: SeriesProperties =
                                                    visibleSeries[currentTrendlineSeriesIndex as number];
                                                    const currentTrendIndex: number = currentTrendlineSeries.trendIndex!;
                                                    const currentPoint: Points =
                                                    currentTrendlineSeries.visiblePoints![pathSegmentIndex as number];

                                                    // Get series module for animation
                                                    const seriesType: string = firstToLowerCase(currentTrendlineSeries.type as string);
                                                    // Calculate animation properties
                                                    const isAnimationEnabled: boolean = currentTrendlineSeries.animation?.enable as boolean;
                                                    const hasPropsChanged: boolean = sourceSeries.propsChange as boolean;

                                                    const animationProps: AnimatedPathProps = hasPropsChanged
                                                        ? { strokeDasharray: 'none', strokeDashoffset: 0 }
                                                        : seriesModules[seriesType + 'SeriesModule' as keyof typeof seriesModules].doAnimation(
                                                            pathOption,
                                                            currentTrendlineSeriesIndex,
                                                            animationState,
                                                            isAnimationEnabled,
                                                            currentTrendlineSeries,
                                                            currentPoint,
                                                            pathSegmentIndex,
                                                            visibleSeries
                                                        );

                                                    // Generate unique path ID
                                                    const trendlinePathId: string = `${chartId}_Series_${currentTrendlineSeries.sourceIndex}_Trendline_${currentTrendIndex}`;

                                                    // Determine stroke width (hide if invisible and animation complete)
                                                    const isSeriesInvisible: boolean = !currentTrendlineSeries.visible
                                                    && animationProgress === 1;
                                                    const strokeWidth: number = isSeriesInvisible ? 0 : (pathOption.strokeWidth as number);
                                                    const ariaLabel: string = accessibility?.ariaLabel as string;

                                                    // Calculate animation progress for added/removed points
                                                    const markerAnimationProgress: number = sourceSeries.isPointAdded
                                                        ? animationProgress
                                                        : 1;
                                                    const markerRemovalProgress: number = sourceSeries.isPointRemoved
                                                        ? animationProgress
                                                        : 1;

                                                    return (
                                                        <React.Fragment key={trendlinePathId}>
                                                            {/* Trendline path */}
                                                            <path
                                                                id={trendlinePathId}
                                                                d={animationProps.interpolatedD ?? pathOption.d}
                                                                stroke={pathOption.stroke}
                                                                strokeWidth={strokeWidth}
                                                                fill={pathOption.fill}
                                                                fillOpacity={pathOption.opacity}
                                                                strokeOpacity={pathOption.opacity}
                                                                strokeDasharray={animationProps.strokeDasharray}
                                                                strokeDashoffset={animationProps.strokeDashoffset}
                                                                opacity={pathOption.opacity}
                                                                transform={animationProps.animatedTransform}
                                                                style={{
                                                                    clipPath: animationProps.animatedClipPath,
                                                                    outline: 'none'
                                                                }}
                                                                role={accessibility?.role}
                                                                tabIndex={tabIndex}
                                                                aria-label={ariaLabel}
                                                            />

                                                            {/* Render markers if provided */}
                                                            {trendlineMarkers && renderMarkerJSX(
                                                                trendlineMarkers[sourceSeriesIndex as number] as MarkerProperties[],
                                                                currentTrendlineSeriesIndex,
                                                                animationProgress,
                                                                currentTrendlineSeries.type,
                                                                chartId,
                                                                hasPropsChanged,
                                                                currentTrendlineSeries,
                                                                markerAnimationProgress,
                                                                markerRemovalProgress
                                                            )}

                                                            {/* Render data labels if provided */}
                                                            {dataLabel && dataLabel[sourceSeriesIndex as number]
                                                            && dataLabel[sourceSeriesIndex as number][currentTrendIndex as number] && (
                                                                <g id={`${chartId}Trendline_${currentTrendIndex}_DataLabelCollection`} style={{ opacity: labelOpacity }}>
                                                                    {renderDataLabelJSX(
                                                                        dataLabel[sourceSeriesIndex as number][currentTrendIndex as number],
                                                                        currentTrendlineSeriesIndex,
                                                                        layoutRef,
                                                                        1,
                                                                        animationProgress
                                                                    )}
                                                                </g>
                                                            )}
                                                        </React.Fragment>
                                                    );
                                                }
                                            )}
                                        </React.Fragment>
                                    );
                                }
                            )}
                        </g>
                    );
                }
            )}
        </g>
    );
}
