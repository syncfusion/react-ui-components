import * as React from 'react';
import { AxisModel, Chart, ChartSizeProps, Rect, TextStyleModel } from '../chart-area/chart-interfaces';
import { SeriesProperties, Points } from '../chart-area/chart-interfaces';
import { ChartLocationProps, ChartLastValueLabelProps } from '../base/interfaces';
import { measureText } from '../utils/helper';
import { ReactNode, useEffect, useRef, RefObject } from 'react';
import { getFormat } from './AxesRenderer/AxisTypeRenderer/DoubleAxisRenderer';

/**
 * Renders last value labels for all visible series in the chart.
 * Labels appear on the axis edge for the last visible data point of each series.
 * Uses shared animationProgress from chart context for synchronized animation.
 *
 * @param {Chart} chart - The chart instance
 * @param {number} [animationProgress] - Shared animation progress (0-1) from series renderer
 * @returns {ReactNode} SVG group with all labels, or null if not needed
 * @private
 */
export function LastValueLabelRenderer(chart: Chart, animationProgress: number): ReactNode {
    // Validate animation progress is in valid range [0-1]
    const progress: number = Math.max(0, Math.min(1, animationProgress ?? 1));

    // Check if any series has labels enabled
    if (!chart.visibleSeries || chart.visibleSeries.length === 0) {
        return null;
    }

    // Filter and render labels with shared animation progress
    const renderData: React.ReactNode[] = chart.visibleSeries
        .filter((s: SeriesProperties) => s.visible && s.lastValueLabel?.enable)
        .map((series: SeriesProperties, idx: number) => (
            <LastValueLabelAnimator key={`lvl_${idx}`} series={series} seriesIndex={idx} chart={chart} animationProgress={progress} />
        ))
        .filter((node: ReactNode) => node !== null);

    // Return null if no labels to render
    if (renderData.length === 0) {
        return null;
    }

    return (
        <g
            id={`${chart.element?.id}_LastValueLabelCollection`}
            key={`${chart.element?.id}_LastValueLabelCollection`}
            style={{ pointerEvents: 'none' }}
        >
            {renderData}
        </g>
    );
}

/**
 * Stateful wrapper component for last value label with animation support.
 * Synchronizes label animation with series animation using shared animationProgress.
 * Label geometry animates based on series animation progress, ensuring perfect sync.
 *
 * @param {Object} props - Component props
 * @param {SeriesProperties} props.series - The series to render label for
 * @param {number} props.seriesIndex - Index of the series
 * @param {Chart} props.chart - The chart instance
 * @param {number} [props.animationProgress] - Shared animation progress (0-1) from series renderer
 * @returns {ReactNode | null} SVG group element or null
 * @private
 */
function LastValueLabelAnimator(props: {
    series: SeriesProperties;
    seriesIndex: number;
    chart: Chart;
    animationProgress?: number;
}): React.ReactNode | null {
    const { series, seriesIndex, chart, animationProgress } = props;

    // Get current geometry immediately for initial rendering
    const getCurrentGeometry: () => ChartLocationProps = (): ChartLocationProps => {
        const visiblePoints: Points[] = series.visiblePoints as Points[];
        if (!visiblePoints || visiblePoints.length === 0) {
            return { x: 0, y: 0 };
        }

        const lastPoint: Points = visiblePoints[visiblePoints.length - 1];
        if (!lastPoint || !lastPoint.isPointInRange) {
            return { x: 0, y: 0 };
        }

        const geometry: ChartLocationProps = getLastPointGeometry(series, lastPoint)  as ChartLocationProps;
        if (!geometry) {
            return { x: 0, y: 0 };
        }

        return { x: geometry.x, y: geometry.y };
    };

    // Store previous and target geometry for interpolation
    const previousGeometryRef: RefObject<ChartLocationProps | null> = useRef<ChartLocationProps | null>(getCurrentGeometry());
    const targetGeometryRef: RefObject<ChartLocationProps | null> = useRef<ChartLocationProps | null>(getCurrentGeometry());
    const isAnimatingRef: RefObject<boolean> = useRef<boolean>(false);

    useEffect(() => {
        // Get last visible point
        const visiblePoints: Points[] = series.visiblePoints as Points[];
        if (!visiblePoints || visiblePoints.length === 0) {
            return;
        }

        const lastPoint: Points = visiblePoints[visiblePoints.length - 1];
        if (!lastPoint || !lastPoint.isPointInRange) {
            return;
        }

        // Get point geometry (transform should be based on data point)
        const geometry: ChartLocationProps = getLastPointGeometry(series, lastPoint) as ChartLocationProps;
        if (!geometry) {
            return;
        }

        const newGeometry: ChartLocationProps = { x: geometry.x, y: geometry.y };

        // Check if geometry position changed (trigger animation)
        if (previousGeometryRef.current) {
            const positionChanged: boolean = Math.abs(previousGeometryRef.current.x - newGeometry.x) > 0.5 ||
                Math.abs(previousGeometryRef.current.y - newGeometry.y) > 0.5;

            if (positionChanged) {
                // Geometry changed - mark animation as active
                // The animation will be driven by the shared animationProgress
                targetGeometryRef.current = newGeometry;
                isAnimatingRef.current = true;
            } else {
                // Animation disabled - jump directly to new position
                previousGeometryRef.current = newGeometry;
                targetGeometryRef.current = newGeometry;
                isAnimatingRef.current = false;
            }
        } else {
            // First time - set both references
            previousGeometryRef.current = newGeometry;
            targetGeometryRef.current = newGeometry;
            isAnimatingRef.current = false;
        }
    }, [series.visiblePoints, series.seriesType]);

    // Calculate interpolated geometry based on shared animationProgress
    // This ensures label animates in perfect sync with series
    const interpolatedGeometry: ChartLocationProps = (() => {
        // Fallback to current geometry if refs not initialized
        const prevGeometry: ChartLocationProps = previousGeometryRef.current || getCurrentGeometry();
        const targetGeometry: ChartLocationProps = targetGeometryRef.current || getCurrentGeometry();

        if (!isAnimatingRef.current) {
            return targetGeometry;
        }

        // When animation completes, update references and stop animating
        if ((animationProgress as number) >= 0.99) {
            previousGeometryRef.current = targetGeometry;
            isAnimatingRef.current = false;
            return targetGeometry;
        }

        // Interpolate between previous and target geometry using shared animationProgress
        const x: number = prevGeometry.x + (targetGeometry.x - prevGeometry.x) * (animationProgress as number);
        const y: number = prevGeometry.y + (targetGeometry.y - prevGeometry.y) * (animationProgress as number);

        return { x, y };
    })();

    // Calculate transform using interpolated geometry
    const transform: string = `translate(${interpolatedGeometry.x}, ${interpolatedGeometry.y})`;
    const transformX: number = interpolatedGeometry.x;
    const transformY: number = interpolatedGeometry.y;

    return renderLastValueLabelWithTransform(series, seriesIndex, chart, transform, transformX, transformY, interpolatedGeometry);
}

/**
 * Renders a single last value label with animated transform.
 * Used by LastValueLabelAnimator to render with SVG transform for smooth animation.
 * This approach ensures the entire label group (including connector line) animates together.
 * The animated geometry is used to calculate label position during animation for smooth movement.
 *
 * @param {SeriesProperties} series - The series to render label for
 * @param {number} seriesIndex - Index of the series
 * @param {Chart} chart - The chart instance
 * @param {string} transform - Animated SVG transform (translate)
 * @param {number} transformX - Extracted X value from transform
 * @param {number} transformY - Extracted Y value from transform
 * @param {ChartLocationProps} animatedGeometry - Animated geometry position for label calculation
 * @returns {ReactNode | null} SVG group element or null
 * @private
 */
function renderLastValueLabelWithTransform(
    series: SeriesProperties,
    seriesIndex: number,
    chart: Chart,
    transform: string,
    transformX: number,
    transformY: number,
    animatedGeometry: ChartLocationProps
): React.ReactNode | null {
    // Get last visible point
    const visiblePoints: Points[] = series.visiblePoints as Points[];
    if (!visiblePoints || visiblePoints.length === 0) {
        return null;
    }

    const lastPoint: Points = visiblePoints[visiblePoints.length - 1];
    if (!lastPoint || !lastPoint.isPointInRange) {
        return null;
    }

    // Get point geometry (also used as transform origin)
    const geometry: ChartLocationProps = getLastPointGeometry(series, lastPoint) as ChartLocationProps;
    if (!geometry) {
        return null;
    }

    // Format value
    const isHighLowOpenClose: boolean = series.seriesType === 'HighLowOpenClose';
    const isHighLow: boolean = series.seriesType === 'HighLow';
    let formattedValue: string = isHighLowOpenClose ? lastPoint.close as string
        : isHighLow ? lastPoint.low as string : lastPoint.yValue?.toString() as string;
    if (!formattedValue) {
        return null;
    }
    const axis: AxisModel = series.yAxis;
    const format: string = getFormat(axis);
    const isCustom: boolean = format.match('{value}') !== null;
    formattedValue = isCustom ? format.replace('{value}', axis.format(formattedValue))
        : format && axis ? axis.format(formattedValue) : formattedValue;

    // Measure label dimensions
    const labelDims: ChartSizeProps = measureText(
        formattedValue,
        series.lastValueLabel?.font as TextStyleModel,
        chart.themeStyle.crosshairLabelFont
    );
    labelDims.width += 16; // 8px padding each side
    labelDims.height += 8; // 4px padding each side

    // Calculate label position using animated geometry during animation
    // This ensures the label animates smoothly from old to new position
    const position: ChartLocationProps = getAxisAlignedLabelPosition(
        animatedGeometry,
        series,
        labelDims.width,
        labelDims.height
    );

    // Apply clip rect bounds - ensure label stays within chart area
    const clipRect: Rect = series.clipRect as Rect;
    const clipRectX: number = clipRect?.x as number;
    const clipRectY: number = clipRect?.y as number;
    const clipRectWidth: number = clipRect?.width as number;
    const clipRectHeight: number = clipRect?.height as number;

    // For X position: don't clamp to clipRect bounds - allow label to extend into axis area
    // where axis labels are rendered
    const isRTL: boolean = !!chart.enableRtl;
    let clampedLabelX: number = position.x;

    // Mirror for RTL
    if (isRTL) {
        clampedLabelX = position.x - labelDims.width;
    }

    // Clamp Y position to stay within chart bounds
    const clampedLabelY: number = Math.max(
        clipRectY,
        Math.min(position.y, clipRectY + clipRectHeight - labelDims.height)
    );

    // Render SVG with transform on group element (transform is based on geometry)
    // This ensures the entire label (including connector line) animates together
    const config: ChartLastValueLabelProps = series.lastValueLabel as ChartLastValueLabelProps;
    const backgroundColor: string = config?.background || chart.themeStyle.crosshairFill;
    const borderColor: string = config?.border?.color || chart.themeStyle.crosshairFill;
    const borderWidth: number = config?.border?.width as number;
    const borderDashArray: string = config?.border?.dashArray || '';
    const rx: number = config?.rx as number;
    const ry: number = config?.ry as number;
    const fontSize: string = config?.font?.fontSize as string;
    const fontFamily: string = config?.font?.fontFamily as string;
    const fontWeight: string = config?.font?.fontWeight as string;
    const fontStyle: string = config?.font?.fontStyle as string;
    const textColor: string = config?.font?.color || chart.themeStyle.crosshairLabel;

    // Calculate positions relative to the group's transform (geometry point)
    // Label box position relative to group origin
    const labelX: number = clampedLabelX - transformX;
    const labelY: number = clampedLabelY - transformY;

    // Calculate line endpoints (relative to group origin at data point)
    let lineStartX: number = 0; // Group origin is at geometry point (data point)
    let lineStartY: number = 0;
    const lineEndX: number = labelX + labelDims.width / 2;
    const lineEndY: number = labelY + labelDims.height / 2;

    // For bar series - extend line vertically (full chart height)
    const isBarType: boolean = chart.requireInvertedAxis;
    if (isBarType) {
        const chartHeight: number = clipRectY + clipRectHeight;
        lineStartY = -chartHeight; // Top of chart area
    }
    else if (series.category === 'Pareto'){
        if (series.type === 'Pareto') {
            lineStartX = - clipRectX / 2;
        }
        else {
            lineStartX = - clipRectWidth;
        }
    }
    else {
        const chartWidth: number = clipRectX + clipRectWidth;
        lineStartX = chartWidth;
        if (series.yAxis?.opposedPosition && !isBarType) {
            lineStartX = -lineStartX;
        }
        if (isRTL) {
            lineStartX = lineEndX - lineStartX;
        }
    }

    return (
        <g
            id={`${chart.element?.id}_LastValueLabel_Group_${seriesIndex}`}
            key={`${chart.element?.id}_LastValueLabel_Group_${seriesIndex}`}
            style={{ pointerEvents: 'none' }}
            transform={transform}
            aria-hidden="true"
        >
            {/* Connector line (optional) - relative positioning, animated by group transform */}
            {config?.lineStyle?.width && config.lineStyle.width > 0 && (
                <line
                    id={`${chart.element?.id}_LastValueLine_${seriesIndex}`}
                    x1={lineStartX}
                    y1={lineStartY}
                    x2={lineEndX}
                    y2={lineEndY}
                    stroke={config.lineStyle.color || chart.themeStyle.crosshairLine}
                    strokeWidth={config.lineStyle.width}
                    strokeDasharray={config.lineStyle.dashArray}
                />
            )}

            {/* Label background box - relative positioning, animated by group transform */}
            <rect
                id={`${chart.element?.id}_LastValueLabel_Background_${seriesIndex}`}
                x={labelX}
                y={labelY}
                width={labelDims.width}
                height={labelDims.height}
                fill={backgroundColor}
                stroke={borderColor}
                strokeWidth={borderWidth}
                strokeDasharray={borderDashArray}
                rx={rx}
                ry={ry}
            />

            {/* Label text - relative positioning, animated by group transform */}
            <text
                id={`${chart.element?.id}_LastValueLabel_${seriesIndex}`}
                x={labelX + labelDims.width / 2}
                y={labelY + labelDims.height / 2}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={textColor}
                fontSize={fontSize}
                fontFamily={fontFamily}
                fontWeight={fontWeight}
                fontStyle={fontStyle}
                opacity={config?.font?.opacity ?? 1}
            >
                {formattedValue}
            </text>
        </g>
    );
}

/**
 * Resolves the point geometry based on series type and point data.
 * Returns null for unsupported types.
 *
 * @param {SeriesProperties} series - The series to get geometry for
 * @param {Points} lastPoint - The last point in series
 * @returns {ChartLocationProps | null} Point geometry or null
 * @private
 */
export function getLastPointGeometry(
    series: SeriesProperties,
    lastPoint: Points
): ChartLocationProps | null {
    const type: string = series.type as string;

    if (['Candle', 'Hilo', 'HiloOpenClose'].includes(type as string)) {
        if (!lastPoint.symbolLocations?.length) {
            return null;
        }
        const loc: ChartLocationProps = lastPoint.symbolLocations[1] ? lastPoint.symbolLocations[1] : lastPoint.symbolLocations[0];
        if (typeof loc?.x !== 'number' || typeof loc?.y !== 'number') {
            return null;
        }
        return {
            x: (series.clipRect?.x as number) + loc.x,
            y: (series.clipRect?.y as number) + loc.y
        };
    }
    else if (series.chart?.chartAreaType !== 'PolarRadar') {
        if (!lastPoint.symbolLocations?.length) {
            return null;
        }
        const loc: ChartLocationProps = lastPoint.symbolLocations[0];
        if (typeof loc?.x !== 'number' || typeof loc?.y !== 'number') {
            return null;
        }
        return { x: (series.clipRect?.x as number) + loc.x, y: (series.clipRect?.y as number) + loc.y };
    }

    return null;
}

/**
 * Calculates axis-aligned label position for a given point geometry.
 * Positions label on the axis edge (left/right for Y-axis, top/bottom for X-axis).
 *
 * @param {ChartLocationProps} pointGeometry - The point geometry
 * @param {SeriesProperties} series - The series properties
 * @param {number} labelWidth - Width of label
 * @param {number} labelHeight - Height of label
 * @returns {ChartLocationProps} Calculated label position
 * @private
 */
export function getAxisAlignedLabelPosition(
    pointGeometry: ChartLocationProps,
    series: SeriesProperties,
    labelWidth: number,
    labelHeight: number
): ChartLocationProps {
    const yAxis: AxisModel = series.yAxis;
    const clipRect: Rect = series.clipRect as Rect;
    const isOpposed: boolean = yAxis.isAxisOpposedPosition;
    const axisRect: Rect = yAxis.rect;
    let totalAxisTitleHeight: number = yAxis?.titleSize?.height + (yAxis?.titleStyle?.padding as number * 2);

    if (series.chart && series.category !== 'Pareto' && series.chart.axisCollection?.length > 2) {
        series.chart.axisCollection.forEach((axis: AxisModel) => {
            // Check only Y axes with same orientation
            if (axis.orientation === yAxis.orientation && axis.opposedPosition === yAxis.opposedPosition) {
                const axisTitleHeight: number = axis.titleSize.height + ((axis.titleStyle.padding as number) * 2)
                + axis.maxLabelSize.width + (axis.majorTickLines.height as number);
                totalAxisTitleHeight += axisTitleHeight;
            }
        });
    }

    let labelX: number;
    let labelY: number;

    // Vertical axis (Y-axis is typically vertical)
    if (yAxis.orientation === 'Vertical') {
        // Label Y = centered on point's Y coordinate
        labelY = pointGeometry.y - labelHeight / 2;

        // Clamp Y to clip rect bounds
        const clipRectY: number = (clipRect?.y as number);
        const clipRectHeight: number = (clipRect?.height as number);
        labelY = Math.max(clipRectY, Math.min(labelY, clipRectY + clipRectHeight - labelHeight));

        // Label X positioned adjacent to chart area in axis label region
        if (isOpposed) {
            // Left side: label positioned outside chart to the left
            labelX = series.chart?.rect?.x + series.chart?.rect?.width
            - (labelWidth + totalAxisTitleHeight + (series.lastValueLabel?.border?.width as number));
            if (series.chart?.legendSettings && series.chart.legendSettings.position === 'Right' && series.chart.legendSettings.legendBounds) {
                labelX -= series.chart.legendSettings.legendBounds.width as number;
            }
            if ((yAxis.multiLevelLabels?.length as number) > 0) {
                labelX -= yAxis.multiLevelLabelHeight as number;
            }
        } else {
            // Right side: label positioned outside chart to the right
            labelX = series.chart?.rect?.x  + totalAxisTitleHeight + (series.lastValueLabel?.border?.width as number);
            if (series.chart?.legendSettings && series.chart.legendSettings.position === 'Left' && series.chart.legendSettings.legendBounds) {
                labelX += series.chart.legendSettings.legendBounds.width as number;
            }
            if ((yAxis.multiLevelLabels?.length as number) > 0) {
                labelX += yAxis.multiLevelLabelHeight as number;
            }
        }
    } else {
        // Horizontal axis (X-axis)
        // Label X = centered on point's X coordinate
        labelX = pointGeometry.x - labelWidth / 2;

        // Clamp to clip rect
        labelX = Math.max(
            clipRect?.x as number,
            Math.min(labelX, (clipRect?.x as number) + (clipRect?.width as number) - labelWidth)
        );

        // Label Y depends on opposed position
        if (isOpposed) {
            // Bottom side
            labelY = axisRect.y;
        } else {
            // Top side
            labelY = axisRect.y - labelHeight - 8;
        }
    }

    return {
        x: labelX,
        y: labelY
    };
}
