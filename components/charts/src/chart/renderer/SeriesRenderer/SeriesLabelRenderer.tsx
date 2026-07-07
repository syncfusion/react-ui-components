import * as React from 'react';
import { ChartBorderProps, ChartFontProps, ChartLocationProps, ChartSeriesLabelProps } from '../../base/interfaces';
import { Chart, Rect, SeriesProperties, Points, TextStyleModel, ChartSizeProps, ColorValue, AxisModel, VisibleRangeProps } from '../../chart-area/chart-interfaces';
import { colorNameToHex, convertHexToColor } from './DataLabelRender';
import { getVisiblePoints, isCollide, measureText } from '../../utils/helper';

/**
 * Defines the properties required for rendering series labels within a chart.
 *
 * Provides access to the associated series collection, the parent chart
 * instance, and visual settings such as label opacity used during label
 * rendering.
 *
 * @private
 */
type SeriesLabelRenderingProps = {
    /**
     * The collection of series for which labels are rendered.
     */
    series: SeriesProperties[];

    /**
     * The chart instance containing the series and rendering context.
     */
    chart: Chart;

    /**
     * The opacity value applied to the rendered series labels.
     */
    labelOpacity: number;
};

/**
 * Represents a potential anchor position for placing an element.
 *
 * Commonly used during layout or collision-detection routines to evaluate
 * candidate X and Y coordinates for rendering labels, markers, or other
 * chart annotations.
 *
 * @private
 */
type CandidatePositionProps = {
    /**
     * The horizontal coordinate of the candidate position.
     */
    x: number;

    /**
     * The vertical coordinate of the candidate position.
     */
    y: number;
};

/**
 * Normalizes an optional boolean value.
 *
 * Returns true only when the provided value is explicitly true;
 * all other values (false or undefined) resolve to false.
 *
 * @param {boolean | undefined} value - The boolean value to normalize
 * @returns {boolean} - The normalized boolean result
 * @private
 */
const normalizeBooleanValue: (value: boolean | undefined) => boolean = (value: boolean | undefined): boolean => value === true;

/**
 * React renderer component responsible for delegating series label rendering.
 *
 * Acts as a lightweight wrapper that forwards the provided series data,
 * chart instance, and opacity settings to the underlying series label
 * rendering implementation.
 *
 * @param {SeriesLabelRenderingProps} props - The properties required for rendering series labels
 * @returns {React.JSX.Element | null} - The rendered series labels SVG group, or null if none are rendered
 * @private
 */
export const SeriesLabelRenderer: React.FC<SeriesLabelRenderingProps> = (
    { series, chart, labelOpacity }: SeriesLabelRenderingProps): React.JSX.Element | null => {
    return renderSeriesLabelsJSX(series, chart, labelOpacity);
};


/**
 * Renders series labels as SVG JSX elements based on visibility, zoom state,
 * collision detection, and label configuration.
 *
 * Iterates through the provided series collection and determines optimal label
 * placement for each visible series using anchor candidates derived from data
 * points. Ensures labels are positioned within the clip region and do not
 * collide with existing chart elements such as other labels, markers, error
 * bars, or series paths.
 *
 * Supports filled and non-filled series with different placement strategies,
 * applies background and border styling when configured, and respects overall
 * label opacity.
 *
 * @param {SeriesProperties[]} series - The collection of series to render labels for
 * @param {Chart} chart - The chart instance containing rendering context and collections
 * @param {number} labelOpacity - The global opacity applied to all series labels
 * @returns {React.ReactElement | null} -
 * A grouped SVG element containing rendered series labels, or null if no labels are rendered
 * @private
 */
export function renderSeriesLabelsJSX(series: SeriesProperties[], chart: Chart, labelOpacity: number): React.ReactElement | null {
    const labelContainerId: string = `${chart.element.id}_SeriesLabelCollection`;
    const elements: React.JSX.Element[] = [];
    chart.seriesLabelCollections = [];
    if (!chart.visibleSeries.some((series: SeriesProperties) => series.seriesLabel?.visible)) { return null; }
    for (const currentSeries of (series as SeriesProperties[])) {
        if (!currentSeries.visible || !currentSeries.seriesLabel?.visible) { continue; }
        const seriesIndex: number = typeof currentSeries.index === 'number' ? currentSeries.index : 0;
        const label: ChartSeriesLabelProps = currentSeries.seriesLabel as ChartSeriesLabelProps;
        const visiblePoints: Points[] = getZoomVisiblePoints(currentSeries);
        const clip: Rect = currentSeries.clipRect as Rect;
        const font: ChartFontProps = label.font as ChartFontProps;
        const background: string = label.background as string;
        const border: ChartBorderProps = label.border as ChartBorderProps;
        const labelText: string = label.text || currentSeries.name as string;
        const baseOpacity: number = (currentSeries.seriesLabel.opacity as number) * (currentSeries.seriesLabel.font?.opacity as number);
        const textId: string = `${chart.element.id}_Series_${seriesIndex}_SeriesLabelText`;
        const textSize: ChartSizeProps = measureText(labelText, font as TextStyleModel, chart.themeStyle?.serieslabelFont);
        const padding: number = background !== 'transparent' || (border?.width as number) > 0 ? 4 : 0;
        const blockers: Rect[] = [
            ...(chart.seriesLabelCollections),
            ...(chart.dataLabelCollections),
            ...(chart.markerCollections)
        ];
        // ---- Build series path rectangles (separate collision set) ----
        const seriesRect: Rect[] = [];
        for (const otherSeries of chart.visibleSeries) {
            seriesRect.push(...buildPathRectangles(otherSeries));
        }
        // ---- Filter valid points ----
        const validPoints: Points[] = visiblePoints.filter((point: Points) => point?.symbolLocations?.[0]);
        if (!validPoints.length) { continue; }
        // ---- Anchor candidates ----
        const lastPoint: Points = validPoints[validPoints.length - 1];
        const peakPoint: Points = validPoints.reduce((previousPoint: Points, currentPoint: Points) =>
            (currentPoint.symbolLocations as ChartLocationProps[])[0].y < (previousPoint.symbolLocations as ChartLocationProps[])[0].y
                ? currentPoint : previousPoint
        );
        const anchorCandidates: CandidatePositionProps[] = [
            {
                x: (lastPoint.symbolLocations as ChartLocationProps[])[0].x + clip.x,
                y: (lastPoint.symbolLocations as ChartLocationProps[])[0].y + clip.y
            },
            {
                x: (peakPoint.symbolLocations as ChartLocationProps[])[0].x + clip.x,
                y: (peakPoint.symbolLocations as ChartLocationProps[])[0].y + clip.y
            }
        ];
        // ---- Segment midpoints (from end → start) ----
        for (let i: number = validPoints.length - 1; i > 0; i--) {
            const currentPoint: ChartLocationProps = ((validPoints as Points[])[i as number].symbolLocations as ChartLocationProps[])[0];
            const previousPoint: ChartLocationProps = ((validPoints as Points[])[i - 1].symbolLocations as ChartLocationProps[])[0];
            anchorCandidates.push({
                x: (currentPoint.x + previousPoint.x) / 2 + clip.x,
                y: (currentPoint.y + previousPoint.y) / 2 + clip.y
            });
        }
        // ---- Try placements ----
        const baseOffset: number = 5;
        const visualGap: number = background !== 'transparent' || (border?.width as number) > 0 ? padding + 4 : 0;
        const effectiveOffset: number = baseOffset + visualGap;
        const isFilled: boolean = isFilledSeries(currentSeries);
        let placement: CandidatePositionProps | null = null;
        let lastTriedInClip: CandidatePositionProps | null = null;
        let placedInsideFill: boolean = false;
        for (const anchor of anchorCandidates) {
            const candidatePositions: CandidatePositionProps[] = [
                { x: anchor.x - textSize.width / 2, y: anchor.y - effectiveOffset - textSize.height },
                { x: anchor.x - textSize.width / 2, y: anchor.y + effectiveOffset + 5 }];
            for (const pos of candidatePositions) {
                // ---- withinClip check ----
                if (pos.x < clip.x || pos.y < clip.y || pos.x + textSize.width > clip.x + clip.width ||
                    pos.y + textSize.height > clip.y + clip.height) { continue; }
                lastTriedInClip = pos;
                let rectToTest: Rect = { x: pos.x, y: pos.y, width: textSize.width, height: textSize.height };
                if (padding > 0) {
                    rectToTest = {
                        x: pos.x - padding, y: pos.y - padding,
                        width: textSize.width + padding * 2,
                        height: textSize.height + padding * 2
                    };
                }
                const emptyRect: Rect = { x: 0, y: 0, width: 0, height: 0 };
                if (!isCollide(rectToTest, blockers, emptyRect) && !isCollide(rectToTest, seriesRect, emptyRect)) {
                    placement = pos;
                    placedInsideFill = isFilled && pos.y >= anchor.y;
                    blockers.push(rectToTest);
                    chart.seriesLabelCollections.push(rectToTest);
                    break;
                }
            }
            if (placement) { break; }
        }
        // ---- showOverlapText fallback ----
        if (!placement && label.showOverlapText && lastTriedInClip) { placement = lastTriedInClip; }
        if (!placement) { continue; }
        // ---- Render label ----
        const textColor: string = getLabelColor(currentSeries, font, placedInsideFill, chart.themeStyle?.serieslabelFont);
        const keyBase: string = `series-label-${seriesIndex}-${chart.seriesLabelCollections.length}`;
        const bgRect: Rect = {
            x: placement.x - padding, y: placement.y - padding,
            width: textSize.width + padding * 2, height: textSize.height + padding * 2
        };

        elements.push(
            <g key={labelContainerId + '_' + seriesIndex}>
                <>
                    {background !== 'transparent' && (
                        <rect
                            key={`${keyBase}-bg`}
                            x={bgRect.x}
                            y={bgRect.y}
                            width={bgRect.width}
                            height={bgRect.height}
                            fill={background}
                            rx="2"
                            ry="2"
                            opacity={baseOpacity}
                            aria-hidden="true"
                        />
                    )}
                    {(border?.width as number) > 0 && (
                        <rect
                            key={`${keyBase}-border`}
                            x={bgRect.x}
                            y={bgRect.y}
                            width={bgRect.width}
                            height={bgRect.height}
                            stroke={border.color}
                            strokeWidth={border.width}
                            strokeDasharray={border.dashArray}
                            fill="none"
                            rx="2"
                            ry="2"
                            opacity={baseOpacity}
                            aria-hidden="true"
                        />
                    )}
                </>
                <text
                    key={textId}
                    id={textId}
                    x={placement.x + textSize.width / 2}
                    y={placement.y + textSize.height / 1.5}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontFamily={font.fontFamily || 'Arial'}
                    fontSize={font.fontSize}
                    fontStyle={font.fontStyle === 'Italic' ? 'italic' : 'normal'}
                    fontWeight={font.fontWeight === 'Bold' ? 'bold' : 'normal'}
                    fill={textColor}
                    opacity={baseOpacity}
                    role="img"
                    aria-label={`Series label: ${labelText}`}
                >
                    {labelText}
                </text>
            </g>
        );
    }
    return <g id={labelContainerId} opacity={labelOpacity} aria-hidden="true">{elements}</g>;
}

/**
 * Determines whether the given series is a filled-area type.
 *
 * @param {SeriesProperties} series - The series configuration to evaluate
 * @returns {boolean} - A value indicating whether the series is a filled type
 * @private
 */
function isFilledSeries(series: SeriesProperties): boolean {
    return series.type ? (
        series.type === 'Area' || series.type === 'StackingArea' || series.type === 'RangeArea' || series.type === 'StepArea' ||
        series.type === 'SplineArea' || series.type === 'RangeStepArea' || series.type === 'SplineRangeArea' ||
        series.type === 'StackingStepArea'
    ) : false;
}


/**
 * Resolves the text color for a series label.
 *
 * Priority order: user font color → series interior (if not inside fill) → theme series label font color
 *
 * @param {SeriesProperties} series - The series for which the label color is determined
 * @param {ChartFontProps} font - The font configuration applied to the series label
 * @param {boolean} isPlacedInsideFill - Check whether the color is for filled area
 * @param {TextStyleModel | undefined} themeSerieslabelFont - The theme font settings for series labels
 * @returns {string} - The resolved label color as a hex or CSS color value
 * @private
 */
export function getLabelColor(series: SeriesProperties, font: ChartFontProps,
                              isPlacedInsideFill: boolean, themeSerieslabelFont?: TextStyleModel): string {
    if (font.color && font.color !== '') { return font.color; }
    if (isFilledSeries(series) && isPlacedInsideFill && series.interior && series.interior !== '') {
        const base: string = series.interior;
        const rgb: ColorValue = convertHexToColor(colorNameToHex(base));
        const brightness: number = Math.round((rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000);
        return brightness >= 128 ? '#000000' : '#FFFFFF';
    }
    if (series.interior && series.interior !== '') { return series.interior; }
    if (themeSerieslabelFont?.color && themeSerieslabelFont.color !== '') { return themeSerieslabelFont.color; }
    return '#000000';
}

/**
 * Retrieves the series points that are visible within the current zoom ranges.
 *
 * @param {SeriesProperties} series - The series from which visible points are retrieved
 * @returns {Points[]} - The collection of points visible within the current zoom bounds
 * @private
 */
function getZoomVisiblePoints(series: SeriesProperties): Points[] {
    const points: Points[] = getVisiblePoints(series) || [];
    const xAxis: AxisModel = series.xAxis;
    const yAxis: AxisModel = series.yAxis;
    const zoomed: boolean = xAxis.zoomFactor !== 1 || xAxis.zoomPosition !== 0 || yAxis.zoomFactor !== 1 || yAxis.zoomPosition !== 0;
    if (!zoomed) { return points; }
    const xRange: VisibleRangeProps = xAxis.visibleRange;
    const yRange: VisibleRangeProps = yAxis.visibleRange;
    return points.filter((point: Points) => {
        const xValue: number = typeof point.x === 'number' ? point.x : point.x instanceof Date ? point.x.getTime() : +point.x;
        const yValue: number = typeof point.y === 'number' ? point.y : +point.y;
        return (xValue >= xRange.minimum && xValue <= xRange.maximum && yValue >= yRange.minimum && yValue <= yRange.maximum);
    });
}


/**
 * Builds bounding rectangles representing the visible path segments of a series.
 *
 * @param {SeriesProperties} series - The series for which path rectangles are computed
 * @returns {Rect[]} - A collection of rectangles approximating the visible series path
 * @private
 */
function buildPathRectangles(series: SeriesProperties): Rect[] {
    const rects: Rect[] = [];
    const points: Points[] = getZoomVisiblePoints(series);
    const lineWidth: number = series.border?.width ?? series.width as number;
    const halfWidth: number = lineWidth / 2;
    for (let i: number = points.length - 1; i > 0; i--) {
        const currentPoint: ChartLocationProps = points[i as number]?.symbolLocations?.[0] as ChartLocationProps;
        const previousPoint: ChartLocationProps = points[i - 1]?.symbolLocations?.[0] as ChartLocationProps;
        const currentX: number = currentPoint.x + (series.clipRect as Rect).x;
        const currentY: number = currentPoint.y + (series.clipRect as Rect).y;
        const previousX: number = previousPoint.x + (series.clipRect as Rect).x;
        const previousY: number = previousPoint.y + (series.clipRect as Rect).y;
        const rect: Rect = {
            x: Math.min(previousX, currentX) - halfWidth,
            y: Math.min(previousY, currentY) - halfWidth,
            width: Math.abs(currentX - previousX) + lineWidth,
            height: Math.abs(currentY - previousY) + lineWidth
        };
        rects.push(rect);
    }
    return rects;
}

/**
 * Compares two series label configurations for equality.
 *
 * Performs a deep comparison of all supported series label properties,
 * including visibility, text, background, opacity, overlap behavior,
 * border settings, and font settings. Optional values are normalized
 * to their defaults for a reliable comparison.
 *
 * @param {ChartSeriesLabelProps} sourceLabel - The first series label configuration
 * @param {ChartSeriesLabelProps} targetLabel - The second series label configuration
 * @returns {boolean} - True if both label configurations are equivalent
 * @private
 */
export function isSeriesLabelEqual(sourceLabel: ChartSeriesLabelProps, targetLabel: ChartSeriesLabelProps): boolean {
    if (sourceLabel === targetLabel) { return true; }
    if (!sourceLabel || !targetLabel) { return false; }

    const sourceBorder: ChartBorderProps = sourceLabel.border as ChartBorderProps;
    const targetBorder: ChartBorderProps = targetLabel.border as ChartBorderProps;
    const sourceFont: ChartFontProps = sourceLabel.font as ChartFontProps;
    const targetFont: ChartFontProps = targetLabel.font as ChartFontProps;

    return (
        normalizeBooleanValue(sourceLabel.visible) === normalizeBooleanValue(targetLabel.visible) &&
        (sourceLabel.text) === (targetLabel.text) &&
        (sourceLabel.background) === (targetLabel.background) &&
        (sourceLabel.opacity) === (targetLabel.opacity) &&
        normalizeBooleanValue(sourceLabel.showOverlapText) === normalizeBooleanValue(targetLabel.showOverlapText) &&

        // ---- Border comparison ----
        ((sourceBorder?.width) === (targetBorder?.width)) &&
        ((sourceBorder?.color) === (targetBorder?.color)) &&
        ((sourceBorder?.dashArray) === (targetBorder?.dashArray)) &&

        // ---- Font comparison ----
        ((sourceFont?.fontSize) === (targetFont?.fontSize)) &&
        ((sourceFont?.fontStyle) === (targetFont?.fontStyle)) &&
        ((sourceFont?.fontWeight) === (targetFont?.fontWeight)) &&
        ((sourceFont?.color) === (targetFont?.color)) &&
        ((sourceFont?.fontFamily) === (targetFont?.fontFamily)) &&
        ((sourceFont?.opacity) === (targetFont?.opacity))
    );
}

/**
 * Applies or removes blur effect (opacity changes) on series labels based on selection state.
 * This function handles the visual dimming of non-selected series labels during selection/highlighting.
 *
 * The function:
 * - Traverses series label DOM structure (g > text/rect elements)
 * - Stores original opacity values in data attributes on first access
 * - Dims non-selected labels to 30% of their original opacity
 * - Restores original opacity when selection is cleared or series is selected
 *
 * @param {Element} seriesLabelRoot - The root SVG group element containing all series labels
 * @param {Set<number>} selectedSeriesSet - Set of selected series indices
 * @param {boolean} hasSelection - Whether any series is currently selected
 * @param {Function} indexFinder - Function to extract series index from element ID
 * @returns {void}
 * @private
 */
export function applySeriesLabelBlurEffect(seriesLabelRoot: Element, selectedSeriesSet: Set<number>, hasSelection: boolean,
                                           indexFinder: (id: string) => { seriesIndex?: number }): void {
    const labelGroups: Element[] = Array.from((seriesLabelRoot as SVGGElement).children);
    for (const labelGroup of labelGroups) {
        if (labelGroup.tagName.toLowerCase() !== 'g') { continue; }
        const children: Element[] = Array.from((labelGroup as SVGGElement).children);
        for (const child of children) {
            const isText: boolean = child.tagName.toLowerCase() === 'text';
            const isRect: boolean = child.tagName.toLowerCase() === 'rect';
            if (!isText && !isRect) { continue; }
            let seriesIndex: number | undefined;
            if (isText) {
                seriesIndex = indexFinder((child as SVGTextElement).id)?.seriesIndex;
            } else {
                const textInGroup: SVGTextElement | null = (labelGroup as SVGGElement).querySelector('text');
                if (textInGroup) { seriesIndex = indexFinder(textInGroup.id)?.seriesIndex; }
            }
            if (typeof seriesIndex !== 'number') { continue; }
            const element: SVGElement = child as SVGElement;
            if (!hasSelection) {
                // Reset to inherited opacity (animation group controls it)
                element.style.opacity = '';
            } else {
                const isSelected: boolean = selectedSeriesSet.has(seriesIndex);
                // Apply relative dimming only
                element.style.opacity = isSelected ? '' : '0.3';
            }
        }
    }
}
