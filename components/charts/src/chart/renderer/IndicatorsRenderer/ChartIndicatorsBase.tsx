import * as React from 'react';
import { ChartIndicatorProps } from '../../base/interfaces';
import { SeriesProperties, Points, RenderOptions, Chart, ChartIndicatorSettings } from '../../chart-area/chart-interfaces';
import { firstToLowerCase } from '../../utils/helper';
import { seriesModules } from '../SeriesRenderer/SeriesRenderer';
import BollingerBandsRenderer from './BollingerBandsRenderer';
import SMARenderer from './SMARenderer';
import EMARenderer from './EMARenderer';
import MACDRenderer from './MACDRenderer';
import RSIRenderer from './RSIRenderer';
import ATRRenderer from './ATRRenderer';
import MomentumRenderer from './MomentumRenderer';
import TMARenderer from './TMARenderer';
import StochasticRenderer from './StochasticRenderer';
import ADRenderer from './ADRenderer';

/**
 * Registry of all available indicator modules
 * Key format: {indicatorType}IndicatorModule (e.g., 'smaIndicatorModule')
 */

export const indicatorModules: {
    [key: string]: IndicatorRenderer;
} = {
    'bollingerBandsIndicatorModule': BollingerBandsRenderer,
    'smaIndicatorModule': SMARenderer,
    'emaIndicatorModule': EMARenderer,
    'macdIndicatorModule': MACDRenderer,
    'rsiIndicatorModule': RSIRenderer,
    'atrIndicatorModule': ATRRenderer,
    'momentumIndicatorModule': MomentumRenderer,
    'tmaIndicatorModule': TMARenderer,
    'stochasticIndicatorModule': StochasticRenderer,
    'accumulationDistributionIndicatorModule': ADRenderer
};

/**
 * Type for indicator renderer interface
 */
export interface IndicatorRenderer {
    initSeriesCollection: (indicator: ChartIndicatorSettings, chart: Chart) => void;
    initDataSource: (indicator: ChartIndicatorSettings) => void;
}

/**
 * Creates a data point for a technical indicator series.
 *
 * @param {Object} x - The x-axis value
 * @param {Object | number} y - The y-axis value
 * @param {Points} sourcePoint - The source data point
 * @param {SeriesProperties} series - The target series
 * @param {number} index - The point index
 * @param {ChartIndicatorSettings} [indicator] - Optional technical indicator model
 * @returns {Points} The created data point
 * @private
 */
export function getDataPoint(
    x: Object,
    y: Object | number,
    sourcePoint: Points,
    series: SeriesProperties,
    index: number,
    indicator?: ChartIndicatorSettings
): Points {
    const point: Points = {} as Points;
    point.x = x;
    point.y = y;
    point.xValue = sourcePoint.xValue;
    point.color = series.fill as string;
    point.index = index;
    point.yValue = Number(y);
    point.visible = true;
    series.xMin = Math.min(series.xMin as number, point.xValue as number);
    series.yMin = Math.min(series.yMin as number, point.yValue as number);
    series.xMax = Math.max(series.xMax as number, point.xValue as number);
    series.yMax = Math.max(series.yMax as number, point.yValue as number);
    series.xData.push(point.xValue as number);
    if (indicator && indicator.type === 'Macd' && series.type === 'Column') {
        if (point.yValue >= 0) {
            point.color = indicator.macdPositiveColor as string;
        } else {
            point.color = indicator.macdNegativeColor as string;
        }
    }
    return point;
}

/**
 * Creates a range data point for range area series.
 *
 * @param {Object} x - The x-axis value
 * @param {Object | number} high - The high value
 * @param {Object | number} low - The low value
 * @param {Points} sourcePoint - The source data point
 * @param {SeriesProperties} series - The target series
 * @param {number} index - The point index
 * @returns {Points} The created range data point
 * @private
 */
export function getRangePoint(
    x: Object,
    high: Object | number,
    low: Object | number,
    sourcePoint: Points,
    series: SeriesProperties,
    index: number
): Points {
    const point: Points = {} as Points;
    point.x = x;
    point.high = Number(high);
    point.low = Number(low);
    point.xValue = sourcePoint.xValue;
    point.color = series.fill as string;
    point.index = index;
    point.visible = true;
    series.xData.push(point.xValue as number);
    return point;
}

/**
 * Assigns data points to a series for the technical indicator.
 *
 * @param {Points[]} points - Array of data points to assign
 * @param {ChartIndicatorSettings} indicator - The technical indicator model
 * @param {SeriesProperties} [series] - Optional target series
 * @returns {void}
 * @private
 */
export function setSeriesRange(points: Points[], indicator: ChartIndicatorSettings, series?: SeriesProperties): void {
    if (!series) {
        (indicator.targetSeries as SeriesProperties[])[0].points = points;
    } else {
        series.points = points;
    }
}

interface AnimationState {
    previousPathLengthRef: React.RefObject<number[]>;
    isInitialRenderRef: React.RefObject<boolean[]>;
    renderedPathDRef: React.RefObject<string[]>;
    animationProgress: number;
    isFirstRenderRef: React.RefObject<boolean>;
    previousSeriesOptionsRef: React.RefObject<RenderOptions[][]>;
}
/**
 * Represents the properties for rendering animated indicator paths.
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
 * Extracts technical indicator signature data for change detection.
 * Creates a lightweight representation of indicator configurations.
 *
 * @param {ChartIndicatorProps[]} chartIndicators - Array of indicator configurations
 * @returns {ChartIndicatorProps[]} Array of indicator signature objects
 *
 * @private
 */
export function extractIndicatorSignature(
    chartIndicators: ChartIndicatorProps[]
): ChartIndicatorProps[] {

    return chartIndicators.map(
        (indicator: ChartIndicatorProps, idx: number) => {

            return {
                index: idx,

                /* core */
                type: indicator.type,
                period: indicator.period,
                kPeriod: indicator.kPeriod,
                dPeriod: indicator.dPeriod,
                field: indicator.field,

                /* zones */
                overBought: indicator.overBought,
                overSold: indicator.overSold,
                showZones: indicator.showZones,

                /* MACD */
                slowPeriod: indicator.slowPeriod,
                fastPeriod: indicator.fastPeriod,
                macdType: indicator.macdType,
                macdPositiveColor: indicator.macdPositiveColor,
                macdNegativeColor: indicator.macdNegativeColor,
                macdLine: indicator.macdLine,

                /* Bollinger */
                standardDeviation: indicator.standardDeviation,
                bandColor: indicator.bandColor,

                /* lines */
                upperLine: indicator.upperLine,
                lowerLine: indicator.lowerLine,
                periodLine: indicator.periodLine,

                /* accessibility / gradients */
                accessibility: indicator.accessibility,

                /* binding */
                seriesName: indicator.seriesName,

                /* axis */
                xAxisName: indicator.xAxisName,
                yAxisName: indicator.yAxisName,

                /* appearance */
                fill: indicator.fill,
                width: indicator.width,
                dashArray: indicator.dashArray,
                visible: indicator.visible,

                /* animation */
                animation: indicator.animation
            };
        }
    ).filter(Boolean);
}

/**
 * Configures a series with common indicator properties.
 *
 * @param {SeriesProperties} series - Series object to configure
 * @param {ChartIndicatorSettings} indicator - Technical indicator model
 * @param {string} name - Series display name
 * @param {string} color - Line color
 * @param {number} width - Line width
 * @param {Chart} chart - Parent chart reference
 * @returns {void}
 */
export const setSeriesProperties: (
    series: SeriesProperties,
    indicator: ChartIndicatorSettings,
    name: string,
    color: string,
    width: number,
    chart: Chart
) => void = (
    series: SeriesProperties,
    indicator: ChartIndicatorSettings,
    name: string,
    color: string,
    width: number,
    chart: Chart
): void => {
    series.name = name.length <= 4 ? name.toLocaleUpperCase() : name;
    series.xField = 'x';
    series.yField = 'y';
    series.fill = color;
    series.dashArray = indicator.dashArray;
    series.width = width;
    series.xAxisName = indicator.xAxisName;
    series.animation = indicator.animation;
    series.yAxisName = indicator.yAxisName;
    series.clipRectElement = indicator.clipRectElement;
    series.points = [];
    series.enableTooltip = true;
    series.interior = series.fill;
    series.category = 'Indicator';
    series.index = indicator.index;
    series.chart = chart;
    series.xMin = Infinity;
    series.xMax = -Infinity;
    series.yMin = Infinity;
    series.yMax = -Infinity;
    series.xData = [];
    series.yData = [];
    series.marker = { visible: false };
    (indicator.targetSeries as SeriesProperties[])?.push(series);
};

/**
 * Renders technical indicators as JSX elements with animation support.
 *
 * @param {Chart} chart - The parent chart instance
 * @param {string} chartId - Unique identifier for the chart
 * @param {Object} indicatorSeriesOptions - Mapped indicator rendering options by source index
 * @param {SeriesProperties[]} visibleSeries - Array of visible series properties
 * @param {AnimationState} animationState - Current animation state object
 * @param {number} animationProgress - Current animation progress (0 to 1)
 * @returns {(React.ReactElement|null)} Rendered indicator SVG elements or null if no options provided
 * @private
 */
export function renderIndicatorsJSX(
    chart: Chart,
    chartId: string,
    indicatorSeriesOptions: { [sourceIndex: number]: RenderOptions[][] },
    visibleSeries: SeriesProperties[],
    animationState: AnimationState,
    animationProgress: number
): React.ReactElement | null {

    return (
        <g id={`${chartId}IndicatorCollection`}>
            {Object.entries(indicatorSeriesOptions).map(
                ([sourceIndexKey, indicatorPathOptionsList]: [string, RenderOptions[][]]): React.ReactElement | null => {
                    const currentIndicator: ChartIndicatorSettings | undefined = chart.indicators?.[Number(sourceIndexKey)];
                    if (!currentIndicator) {
                        return null;
                    }

                    const firstIndicatorSeries: SeriesProperties = (currentIndicator.targetSeries as SeriesProperties[])[0];


                    // Get clip rectangle dimensions
                    const clipRectX: number = firstIndicatorSeries.clipRect?.x as number;
                    const clipRectY: number = firstIndicatorSeries.clipRect?.y as number;
                    const clipRectWidth: number = firstIndicatorSeries.clipRect?.width as number;
                    const clipRectHeight: number = firstIndicatorSeries.clipRect?.height as number;

                    // Generate unique IDs
                    const groupId: string = `${chartId}IndicatorGroup${currentIndicator.index}`;
                    const clipPathId: string = `${chartId}_ChartIndicatorClipRect_${currentIndicator.index}`;
                    const clipPathRectId: string = `${clipPathId}_Rect`;

                    return (
                        <g
                            key={groupId}
                            id={groupId}
                            clipPath={`url(#${clipPathId})`}
                            transform={`translate(${clipRectX}, ${clipRectY})`}
                            style={{ outline: 'none' }}
                            role="region"
                            aria-hidden="false"
                        >
                            {/* Clip path definition for indicators */}
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

                            {/* Render each indicator path */}
                            {indicatorPathOptionsList.map(
                                (indicatorPathOptions: RenderOptions[], indicatorIndex: number): React.ReactElement => {
                                    const indicatorGroupID: string =
                                        `${chartId}_Indicator_${sourceIndexKey}_${(currentIndicator.targetSeries as SeriesProperties[])[indicatorIndex as number].name}_Group`;

                                    return (
                                        <React.Fragment key={indicatorGroupID + '_' + indicatorIndex}>
                                            <g id={indicatorGroupID}>
                                                {indicatorPathOptions.map(
                                                    (pathOption: RenderOptions, pathSegmentIndex: number): React.ReactElement | null => {
                                                        const currentindicatorSeriesIndex: number = parseInt(
                                                            pathOption.id.split('_Series_')[1].split('_')[0],
                                                            10
                                                        );

                                                        const currentIndicatorSeries: SeriesProperties =
                                                            visibleSeries[currentindicatorSeriesIndex as number];

                                                        const currentPoint: Points =
                                                            currentIndicatorSeries.visiblePoints?.[pathSegmentIndex as number] as Points;

                                                        if (
                                                            !currentIndicatorSeries.visiblePoints ||
                                                            pathSegmentIndex >= currentIndicatorSeries.visiblePoints.length
                                                        ) {
                                                            return null;
                                                        }

                                                        const seriesType: string = firstToLowerCase(currentIndicatorSeries.type as string);
                                                        const isAnimationEnabled: boolean = currentIndicatorSeries.
                                                            animation?.enable as boolean;

                                                        const animationProps: AnimatedPathProps =
                                                            seriesModules[
                                                                seriesType + 'SeriesModule' as keyof typeof seriesModules
                                                            ].doAnimation(
                                                                pathOption,
                                                                currentIndicatorSeries.index,
                                                                animationState,
                                                                isAnimationEnabled,
                                                                currentIndicatorSeries,
                                                                currentPoint,
                                                                pathSegmentIndex,
                                                                visibleSeries
                                                            );

                                                        const isSeriesInvisible: boolean =
                                                            !currentIndicatorSeries.visible && animationProgress === 1;

                                                        const strokeWidth: number =
                                                            isSeriesInvisible ? 0 : (pathOption.strokeWidth as number);

                                                        return (
                                                            <path
                                                                key={pathOption.id}
                                                                id={pathOption.id}
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
                                                            />
                                                        );
                                                    }
                                                )}
                                            </g>
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
