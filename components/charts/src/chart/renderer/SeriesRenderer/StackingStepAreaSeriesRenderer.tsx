import { ChartLocationProps, ChartMarkerProps } from '../../base/interfaces';
import { StepPosition } from '../../base/enum';
import { AxisModel, PathCommand, Points, RenderOptions, SeriesProperties } from '../../chart-area/chart-interfaces';
import { getPoint } from '../../utils/helper';
import { LineBase, LineBaseReturnType } from './LineBase';
import { parsePathCommands } from './AreaSeriesRenderer';
import MarkerRenderer from './MarkerRenderer';
import { AnimationState, interpolatePathD } from './SeriesAnimation';
import { generateStepAreaPath, interpolateStepBorderPath } from './StepAreaSeriesRenderer';
import { interpolateStackingAreaPath } from './StackingAreaSeriesRenderer';

const lineBaseInstance: LineBaseReturnType = LineBase;
const ID_PREFIX: string = '_Series_';
const BORDER_SUFFIX: string = '_Series_border_';
const stackingStepRenderedPathStore: Map<string, string> = new Map<string, string>();

/**
 * Clears all stored path and animation data related to stacking step area series.
 *
 * @returns {void} Does not return a value.
 * @private
 */
export function clearStackingStepAreaPathStore(): void {
    stackingStepRenderedPathStore.clear();
    stackingStepAnimationConfigStore.clear();

}

type StackingStepAnimationConfig = {
    step: StepPosition;
    noRisers: boolean;
};
const stackingStepAnimationConfigStore: Map<string, StackingStepAnimationConfig> =
    new Map<string, StackingStepAnimationConfig>();
type PointLocation = { x: number; y: number };

type GetCoordinateFn = (
    x: number,
    y: number,
    xAxis: AxisModel | undefined,
    yAxis: AxisModel | undefined,
    isInverted: boolean,
    series: SeriesProperties
) => ChartLocationProps;

/**
 * Resolves the configured step mode to a supported step position.
 *
 * @param {StepPosition} [step] - The configured step mode.
 * @returns {StepPosition} The resolved step position. Falls back to 'Left' when undefined or unsupported.
 * @private
 */
function resolveStepPosition(step?: StepPosition): StepPosition {
    if (step === 'Center' || step === 'Right') {
        return step;
    }
    return 'Left';
}

/**
 * Returns the reversed step position used when building the lower boundary
 * in reverse order.
 *
 * @param {StepPosition} step - The original step position.
 * @returns {StepPosition} The reversed step position.
 * @private
 */
function buildStepPathFromLocations(step: StepPosition): StepPosition {
    if (step === 'Left') { return 'Right'; }
    if (step === 'Right') { return 'Left'; }
    return 'Center';
}

/**
 * Removes the leading move command (`M x y`) from an SVG path string.
 * Useful when multiple path fragments need to be concatenated into a single path.
 *
 * @param {string} path - The SVG path data string.
 * @returns {string} The path data without the leading move command.
 * @private
 */
function removeLeadingMoveCommand(path: string): string {
    return path.replace(/^M\s+[-\d.]+\s+[-\d.]+\s*/i, '').trim();
}

/**
 * Builds an SVG step path from screen-space point locations.
 *
 * @param {PointLocation[]} locations - The screen-space locations used to build the step path.
 * @param {StepPosition} resolvedStepPosition - The resolved step mode used to shape the path.
 * @returns {string} The generated SVG path data string.
 * @private
 */
function generateStepPathFromLocations(
    locations: PointLocation[],
    resolvedStepPosition: StepPosition
): string {
    if (!locations.length) {
        return '';
    }
    const tuples: [number, number][] = locations.map((point: PointLocation) => [point.x, point.y]);
    return generateStepAreaPath(tuples, resolvedStepPosition);
}

/**
 * Builds the closed stacked step-area fill path from upper and lower boundary points.
 *
 * @param {PointLocation[]} upperPoints - Screen-space points for the stacked upper boundary.
 * @param {PointLocation[]} lowerPoints - Screen-space points for the stacked lower boundary.
 * @param {StepPosition} resolvedStepPosition - The resolved step mode used for the upper boundary.
 * @returns {string} The generated SVG path data string for the stacked step-area fill.
 * @private
 */
function buildStackedStepAreaPath(
    upperPoints: PointLocation[],
    lowerPoints: PointLocation[],
    resolvedStepPosition: StepPosition
): string {
    if (!upperPoints.length || !lowerPoints.length) {
        return '';
    }
    const upperPath: string = generateStepPathFromLocations(upperPoints, resolvedStepPosition);
    const reversedLowerPoints: PointLocation[] = [...lowerPoints].reverse();
    const mirroredLowerStep: StepPosition = buildStepPathFromLocations(resolvedStepPosition);
    const lowerPath: string = generateStepPathFromLocations(reversedLowerPoints, mirroredLowerStep);
    const firstLower: PointLocation = lowerPoints[0];
    const firstUpper: PointLocation = upperPoints[0];
    const lastLower: PointLocation = lowerPoints[lowerPoints.length - 1];

    let seriesPath: string = `M ${firstLower.x} ${firstLower.y} `;
    seriesPath += `L ${firstUpper.x} ${firstUpper.y} `;
    const upperBody: string = removeLeadingMoveCommand(upperPath);
    if (upperBody) {
        seriesPath += `${upperBody} `;
    }
    seriesPath += `L ${lastLower.x} ${lastLower.y} `;
    const lowerBody: string = removeLeadingMoveCommand(lowerPath);
    if (lowerBody) {
        seriesPath += `${lowerBody} `;
    }
    seriesPath += 'Z';
    return seriesPath;
}

/**
 * Builds the top stacked step-border path.
 *
 * When `noRisers` is enabled, the border skips vertical jump segments
 * and renders only the horizontal step plateaus.
 *
 * @param {PointLocation[]} upperPoints - Screen-space points for the stacked upper boundary.
 * @param {StepPosition} resolvedStepPosition - The resolved step mode used to shape the border.
 * @param {boolean} [noRisers] - Whether vertical border risers should be skipped.
 * @returns {string} The generated SVG path data string for the stacked step border.
 * @private
 */
function buildStackedStepBorderPath(
    upperPoints: PointLocation[],
    resolvedStepPosition: StepPosition,
    noRisers?: boolean
): string {
    if (!upperPoints.length) {
        return '';
    }

    if (noRisers) {
        return buildNoRisersStackedBorderPath(upperPoints, resolvedStepPosition);
    }
    return generateStepPathFromLocations(upperPoints, resolvedStepPosition);
}

/**
 * Determines whether a point can be rendered in the stacked step-area path.
 *
 * A point is considered renderable when:
 * - the point object exists,
 * - the point is visible,
 * - and the point has a valid x-value.
 *
 * @param {Points | undefined | null} point - The point to validate.
 * @returns {boolean} True when the point can be rendered; otherwise false.
 * @private
 */
function isRenderablePoint(point: Points | undefined | null): boolean {
    if (!point) { return false; }
    if (point.visible === false) { return false; }
    if (point.xValue === null || point.xValue === undefined) { return false; }
    return true;
}

/**
 * Builds a stacked step-border path without vertical risers.
 *
 * For `Left` and `Right` step modes, this produces one horizontal plateau
 * segment per interval. For `Center`, it produces two horizontal half-segments
 * around the midpoint and skips the vertical connector entirely.
 *
 * @param {PointLocation[]} upperPoints - Screen-space points for the stacked upper boundary.
 * @param {StepPosition} resolvedStepPosition - The resolved step mode used to shape the border.
 * @returns {string} The generated SVG path data string for the no-risers border.
 * @private
 */
function buildNoRisersStackedBorderPath(
    upperPoints: PointLocation[],
    resolvedStepPosition: StepPosition
): string {
    if (upperPoints.length < 2) {
        return '';
    }
    let noRiserBorderPath: string = '';

    for (let i: number = 1; i < upperPoints.length; i++) {
        const previousUpperPoint: PointLocation = upperPoints[i - 1];
        const currentUpperPoint: PointLocation = upperPoints[i as number];

        if (resolvedStepPosition === 'Left') {
            noRiserBorderPath += ` M ${previousUpperPoint.x} ${currentUpperPoint.y} L ${currentUpperPoint.x} ${currentUpperPoint.y}`;
        } else if (resolvedStepPosition === 'Right') {
            noRiserBorderPath += ` M ${previousUpperPoint.x} ${previousUpperPoint.y} L ${currentUpperPoint.x} ${previousUpperPoint.y}`;
        } else {
            const midePointX: number = (previousUpperPoint.x + currentUpperPoint.x) / 2;
            noRiserBorderPath += ` M ${previousUpperPoint.x} ${previousUpperPoint.y} L ${midePointX} ${previousUpperPoint.y}`;
            noRiserBorderPath += ` M ${midePointX} ${currentUpperPoint.y} L ${currentUpperPoint.x} ${currentUpperPoint.y}`;
        }
    }
    return noRiserBorderPath.trim();
}

/**
 * The StackingStepAreaSeriesRenderer object.
 */
const StackingStepAreaSeriesRenderer: {
    doAnimation: (
        pathOptions: RenderOptions,
        index: number,
        animationState: AnimationState,
        enableAnimation: boolean,
        currentSeries: SeriesProperties
    ) => {
        strokeDasharray: string | number;
        strokeDashoffset: number;
        interpolatedD?: string;
        animatedDirection?: string;
        animatedTransform?: string;
        animatedClipPath?: string;
        scatterTransform?: string;
    };
    render: (
        series: SeriesProperties,
        isInverted: boolean
    ) => RenderOptions[] | { options: RenderOptions[]; marker: ChartMarkerProps };
} = {
    doAnimation: (
        pathOptions: RenderOptions,
        index: number,
        animationState: AnimationState,
        enableAnimation: boolean,
        currentSeries: SeriesProperties
    ): {
        strokeDasharray: string | number;
        strokeDashoffset: number;
        interpolatedD?: string;
        animatedDirection?: string;
        animatedTransform?: string;
        animatedClipPath?: string;
        scatterTransform?: string;
    } => {
        const {
            isInitialRenderRef,
            animationProgress
        } = animationState;

        const targetPathData: string = (pathOptions.d as string) ?? '';
        const pathElementId: string = String(pathOptions.id ?? '');
        const isSeriesBorderPath: boolean = pathElementId.includes('_border_');
        const resolvedDashArray: string = isSeriesBorderPath ? (pathOptions.dashArray ?? 'none') : 'none';
        const idParts: string[] = pathElementId.split('_');
        const seriesIndexString: string = idParts[idParts.length - 1];
        const seriesIndex: number = parseInt(seriesIndexString, 10);
        const storedPathKey: string = `${isSeriesBorderPath ? 'border' : 'area'}_${seriesIndex}`;
        const resolvedStepPosition: StepPosition = resolveStepPosition(currentSeries.step);
        const currentNoRisers: boolean = !!currentSeries.noRisers;

        const currentAnimationConfig: StackingStepAnimationConfig = {
            step: resolvedStepPosition,
            noRisers: currentNoRisers
        };

        const previousAnimationConfig: StackingStepAnimationConfig | undefined =
            stackingStepAnimationConfigStore.get(storedPathKey);

        const hasAnimationConfigChanged: boolean = !!previousAnimationConfig && (
            previousAnimationConfig.step !== currentAnimationConfig.step ||
            previousAnimationConfig.noRisers !== currentAnimationConfig.noRisers
        );

        // Keep the same default contract when animation is off.
        if (!enableAnimation) {
            stackingStepRenderedPathStore.set(storedPathKey, targetPathData);
            stackingStepAnimationConfigStore.set(storedPathKey, currentAnimationConfig);

            return {
                strokeDasharray: 'none',
                strokeDashoffset: 0
            };
        }

        const previousRenderedPathData: string =
            stackingStepRenderedPathStore.get(storedPathKey) ?? targetPathData;

        if (hasAnimationConfigChanged) {
            stackingStepRenderedPathStore.set(storedPathKey, targetPathData);
            stackingStepAnimationConfigStore.set(storedPathKey, currentAnimationConfig);

            if (animationProgress === 1) {
                isInitialRenderRef.current[index as number] = false;
            }

            return {
                strokeDasharray: resolvedDashArray,
                strokeDashoffset: 0
            };
        }

        if (isInitialRenderRef.current[index as number]) {
            if (animationProgress === 1) {
                isInitialRenderRef.current[index as number] = false;
                stackingStepRenderedPathStore.set(storedPathKey, targetPathData);
                stackingStepAnimationConfigStore.set(storedPathKey, currentAnimationConfig);
            }
            const pathCommands: PathCommand[] = parsePathCommands(targetPathData);

            const xCoordinates: number[] = pathCommands
                .filter((command: PathCommand) => command.type !== 'Z' && command.coords.length >= 2)
                .map((command: PathCommand) => command.coords[0]);

            if (!xCoordinates.length) {
                return {
                    strokeDasharray: resolvedDashArray,
                    strokeDashoffset: 0
                };
            }

            const minimumX: number = Math.min(...xCoordinates);
            const maximumX: number = Math.max(...xCoordinates);
            const xRange: number = maximumX - minimumX;
            const animatedWidth: number = xRange * animationProgress;

            const isChartInverted: boolean = !!currentSeries.chart?.requireInvertedAxis;
            const isXAxisInverted: boolean = !!currentSeries.xAxis?.isAxisInverse;
            const isYAxisInverted: boolean = !!currentSeries.yAxis?.isAxisInverse;

            let animatedClipPath: string = '';

            if (!isChartInverted) {
                animatedClipPath = isXAxisInverted
                    ? `inset(0 0 0 ${xRange - animatedWidth}px)`
                    : `inset(0 ${xRange - animatedWidth}px 0 0)`;
            } else {
                const yCoordinates: number[] = pathCommands
                    .filter((command: PathCommand) => command.type !== 'Z' && command.coords.length >= 2)
                    .map((command: PathCommand) => command.coords[1]);

                if (!yCoordinates.length) {
                    return {
                        strokeDasharray: resolvedDashArray,
                        strokeDashoffset: 0
                    };
                }
                const minimumY: number = Math.min(...yCoordinates);
                const maximumY: number = Math.max(...yCoordinates);
                const yRange: number = maximumY - minimumY;
                const animatedHeight: number = yRange * animationProgress;

                animatedClipPath = isYAxisInverted
                    ? `inset(${Math.max(0, yRange - animatedHeight)}px 0 0 0)`
                    : `inset(${Math.max(0, yRange - animatedHeight)}px 0 0 0)`;
            }

            return {
                strokeDasharray: resolvedDashArray,
                strokeDashoffset: 0,
                animatedClipPath
            };
        }

        if (previousRenderedPathData && previousRenderedPathData !== targetPathData) {
            const interpolatedPathData: string = isSeriesBorderPath
                ? ( currentSeries.noRisers ? interpolatePathD(previousRenderedPathData, targetPathData, animationProgress)
                    : interpolateStepBorderPath(previousRenderedPathData, targetPathData, animationProgress,
                                                resolveStepPosition(currentSeries.step)))
                : interpolateStackingAreaPath(previousRenderedPathData, targetPathData, animationProgress);

            if (animationProgress === 1) {
                stackingStepRenderedPathStore.set(storedPathKey, targetPathData);
                stackingStepAnimationConfigStore.set(storedPathKey, currentAnimationConfig);
            }

            return {
                strokeDasharray: resolvedDashArray,
                strokeDashoffset: 0,
                interpolatedD: interpolatedPathData
            };
        }

        if (animationProgress === 1) {
            stackingStepRenderedPathStore.set(storedPathKey, targetPathData);
            stackingStepAnimationConfigStore.set(storedPathKey, currentAnimationConfig);
        }

        return {
            strokeDasharray: resolvedDashArray,
            strokeDashoffset: 0
        };
    },

    /**
     * render - build step-area fill and border renderOptions and associated marker (if any).
     *
     * @param {SeriesProperties} series - The series properties.
     * @param {boolean} isInverted - Flag indicating if the chart is inverted.
     * @returns {RenderOptions[] | {options: RenderOptions[], marker: ChartMarkerProps}} The render options and optional marker.
     */
    render: (
        series: SeriesProperties,
        isInverted: boolean
    ): RenderOptions[] | { options: RenderOptions[]; marker: ChartMarkerProps } => {
        if (!series.visible ||  !series.chart?.element?.id) {
            series.visiblePoints = [];
            return [];
        }
        const chartId: string = series.chart.element.id;
        const getCoordinate: GetCoordinateFn = getPoint as GetCoordinateFn;
        const visiblePointsRaw: Points[] = lineBaseInstance.enableComplexProperty(series);
        const visiblePoints: Points[] = Array.isArray(visiblePointsRaw) ? visiblePointsRaw : [];
        const stackStartValues: number[] = series.stackedValues?.startValues ?? [];
        const stackEndValues: number[] = series.stackedValues?.endValues ?? [];
        if (
            stackStartValues.length !== visiblePoints.length ||
            stackEndValues.length !== visiblePoints.length
        ) {
            series.visiblePoints = visiblePoints;
            return [];
        }
        const resolvedStepPosition: StepPosition = resolveStepPosition(series.step);

        // Build point segments, mainly for Gap-style empty point behavior.
        const pointSegments: Points[][] = [];
        let currentSegment: Points[] = [];

        for (let pointIndex: number = 0; pointIndex < visiblePoints.length; pointIndex++) {
            const point: Points = visiblePoints[pointIndex as number];
            point.regions = [];
            point.symbolLocations = [];

            if (!isRenderablePoint(point)) {
                if (currentSegment.length > 0) {
                    pointSegments.push([...currentSegment]);
                    currentSegment = [];
                }
                continue;
            }

            currentSegment.push(point);
        }

        if (currentSegment.length > 0) {
            pointSegments.push([...currentSegment]);
        }

        let combinedAreaDirection: string = '';
        let combinedBorderDirection: string = '';
        const renderOptions: RenderOptions[] = [];

        const seriesFill: string = (series.fill as string) || (series.interior as string) || 'transparent';
        for (const segment of pointSegments) {
            const upperLocations: PointLocation[] = [];
            const lowerLocations: PointLocation[] = [];

            for (let localIndex: number = 0; localIndex < segment.length; localIndex++) {
                const point: Points = segment[localIndex as number];
                if (point.index === undefined || point.index === null) {
                    continue;
                }
                const pointIndex: number = point.index as number;
                const xValue: number = point.xValue as number;
                const stackedTopValue: number | undefined = stackEndValues[pointIndex as number];
                const stackedBottomValue: number | undefined = stackStartValues[pointIndex as number];
                if (xValue === undefined || xValue === null || stackedTopValue === undefined || stackedTopValue === null ||
                    stackedBottomValue === undefined || stackedBottomValue === null) {
                    continue;
                }

                const upperScreenLocation: ChartLocationProps = getCoordinate(
                    xValue, stackedTopValue, series.xAxis, series.yAxis, isInverted, series);

                const lowerScreenLocation: ChartLocationProps = getCoordinate(
                    xValue, stackedBottomValue, series.xAxis, series.yAxis, isInverted, series);
                point.symbolLocations = [];
                point.regions = [];

                point.symbolLocations.push({x: upperScreenLocation.x, y: upperScreenLocation.y});

                const markerWidth: number = series.marker?.width as number;
                const markerHeight: number = series.marker?.height as number;

                point.regions.push({
                    x: upperScreenLocation.x - markerWidth,
                    y: upperScreenLocation.y - markerHeight,
                    width: 2 * markerWidth,
                    height: 2 * markerHeight
                });

                upperLocations.push({ x: upperScreenLocation.x, y: upperScreenLocation.y });
                lowerLocations.push({ x: lowerScreenLocation.x, y: lowerScreenLocation.y });
            }

            if (!upperLocations.length || !lowerLocations.length || upperLocations.length !== lowerLocations.length) {
                continue;
            }

            const areaDirection: string = buildStackedStepAreaPath(
                upperLocations,
                lowerLocations,
                resolvedStepPosition
            );

            const borderDirection: string = buildStackedStepBorderPath(
                upperLocations,
                resolvedStepPosition,
                series.noRisers
            );

            if (areaDirection) {
                combinedAreaDirection += `${areaDirection} `;
            }
            if (borderDirection) {
                combinedBorderDirection += `${borderDirection} `;
            }
        }

        const seriesElementId: string = `${chartId}${ID_PREFIX}${series.index}`;
        renderOptions.push({
            id: seriesElementId,
            fill: seriesFill,
            strokeWidth: 0,
            stroke: 'none',
            opacity: series.opacity,
            dashArray: '',
            d: combinedAreaDirection.trim()
        });

        if (series.border?.width) {
            renderOptions.push({
                id: `${chartId}${BORDER_SUFFIX}${series.index}`,
                fill: 'transparent',
                strokeWidth: series.border.width,
                stroke: series.border.color || seriesFill,
                opacity: series.opacity,
                dashArray: series.border?.dashArray ?? '',
                d: combinedBorderDirection.trim()
            });
        }
        series.visiblePoints = visiblePoints;
        const marker: ChartMarkerProps | null =
            series.marker?.visible ? (MarkerRenderer.render(series) as ChartMarkerProps) : null;

        return marker ? { options: renderOptions, marker } : renderOptions;
    }
};

export default StackingStepAreaSeriesRenderer;
