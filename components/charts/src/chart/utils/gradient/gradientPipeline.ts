import {
    RenderOptions,
    SeriesProperties,
    ChartTrendlineModel,
    ChartIndicatorSettings,
    MarkerOptionsList
} from '../../chart-area/chart-interfaces';
import {
    ChartGradientColorStopProps,
    GradientRenderInfo,
    ChartLinearGradientProps,
    ChartRadialGradientProps
} from '../../base/interfaces';
import { makeRenderInfo, GradientDefSpec } from '../../renderer/SeriesRenderer/GradientDefs';
import { buildParsedGradient, buildStrokeEndpoints, extractGradientChildren, extractStops } from './gradientParsing';

/* ============================================================================
 * Target classification + id generation
 * ========================================================================== */

/**
 * Targets whose paint phase is "stroke"-dominated. The renderer promotes
 * these to `userSpaceOnUse` automatically so endpoints resolve in chart
 * pixel space instead of object-bbox space.
 *
 * @private
 */
export type GradientStrokeTarget =
    | 'Line'
    | 'Spline'
    | 'StepLine'
    | 'MultiColoredLine'
    | 'StackingLine'
    | 'Trendline'
    | 'IndicatorRSIStroke'
    | 'IndicatorMACDStroke'
    | 'IndicatorLineStroke';

/**
 * Targets that prefer fill (per-shape) — they stay on `objectBoundingBox`.
 *
 * @private
 */
export type GradientFillTarget =
    | 'Column'
    | 'Bar'
    | 'Area'
    | 'SplineArea'
    | 'StepArea'
    | 'StackingColumn'
    | 'StackingBar'
    | 'StackingArea'
    | 'StackingStepArea'
    | 'MultiColoredArea'
    | 'RangeArea'
    | 'RangeColumn'
    | 'RangeStepArea'
    | 'SplineRangeArea'
    | 'Bubble'
    | 'Scatter'
    | 'PolarLine'
    | 'PolarColumn'
    | 'PolarArea'
    | 'PolarStackingArea'
    | 'PolarStackingColumn'
    | 'PolarRangeColumn'
    | 'PolarScatter'
    | 'PolarSpline'
    | 'PolarSplineArea'
    | 'RadarLine'
    | 'RadarColumn'
    | 'RadarArea'
    | 'RadarStackingArea'
    | 'RadarStackingColumn'
    | 'RadarRangeColumn'
    | 'RadarScatter'
    | 'RadarSpline'
    | 'RadarSplineArea'
    | 'Histogram'
    | 'Waterfall'
    | 'BoxAndWhisker'
    | 'Pareto'
    | 'Candle'
    | 'Hilo'
    | 'HiloOpenClose'
    | 'BollingerBands'
    | 'MACDHistogram'
    | 'TooltipMarker'
    | 'Marker';

/**
 * Represents all supported gradient rendering targets.
 *
 * @private
 */
export type GradientTarget = GradientStrokeTarget | GradientFillTarget;

/**
 * Determines whether a gradient target requires user-space coordinates
 * (stroke targets such as `Line` must be emitted with `gradientUnits="userSpaceOnUse"`,
 * fill targets stay on `objectBoundingBox`).
 *
 * @param {GradientTarget} target - Gradient target.
 * @returns {boolean} Whether the gradient requires user-space coordinates.
 * @private
 */
export function isStrokeGradientTarget(target: GradientTarget): boolean {
    const strokeTargets: GradientStrokeTarget[] = [
        'Line', 'Spline', 'StepLine', 'MultiColoredLine', 'StackingLine',
        'Trendline', 'IndicatorRSIStroke', 'IndicatorMACDStroke', 'IndicatorLineStroke'
    ];
    return strokeTargets.indexOf(target as GradientStrokeTarget) > -1;
}

/**
 * Generates a stable gradient ID.
 *
 * @param {string} chartId - Chart container ID.
 * @param {string} owner - Gradient owner.
 * @param {number} index - Owner index.
 * @param {string} kind - Gradient type.
 * @returns {string} Generated gradient ID.
 * @private
 */
export function getGradientId(
    chartId: string | undefined,
    owner: 'series' | 'marker' | 'tooltip' | 'trendline' | 'indicator',
    index: number,
    kind: string
): string {
    const prefix: string = (chartId && chartId.length > 0) ? chartId : 'container';
    return `${prefix}_${owner}_${index}_${kind}_gradient`;
}

/* ============================================================================
 * Apply / capture pipeline
 * ========================================================================== */

export interface GradientApplyResult {
    options: RenderOptions[] | MarkerOptionsList;
    defSpec: GradientDefSpec | null;
}

/**
 * Inputs for `applyGradientToOptions`.
 *
 * @private
 */
export interface GradientApplierSpec {
    chartId: string;
    owner: 'series' | 'marker' | 'tooltip' | 'trendline' | 'indicator';
    index: number;
    target: GradientTarget;
    gradientProps: ChartLinearGradientProps | ChartRadialGradientProps;
    gradientStops: ChartGradientColorStopProps[];
    gradientKind: 'linear' | 'radial';
    endpoints?: { x1: number; y1: number; x2: number; y2: number } | null;
    strokeEndpoints?: { x1: number; y1: number; x2: number; y2: number } | null;
    radialCenterPx?: { cx: number; cy: number; r: number } | null;
}

/**
 * Applies a gradient to the render options.
 *
 * @param {RenderOptions[] | MarkerOptionsList} options - Render options.
 * @param {GradientApplierSpec} spec - Gradient configuration.
 * @returns {GradientApplyResult} Updated options and gradient definition.
 * @private
 */
export function applyGradientToOptions(
    options: RenderOptions[] | MarkerOptionsList,
    spec: GradientApplierSpec
): { options: RenderOptions[] | MarkerOptionsList; defSpec: GradientDefSpec | null } {
    if (!spec.gradientStops || spec.gradientStops.length < 2 || !spec.gradientKind) {
        return { options, defSpec: null };
    }
    if (!spec.target) {
        return { options, defSpec: null };
    }

    const id: string = getGradientId(spec.chartId, spec.owner, spec.index, spec.gradientKind);
    const info: GradientRenderInfo =
        makeRenderInfo(spec.chartId, spec.owner, spec.index, spec.gradientKind, spec.target);

    for (let i: number = 0; i < options.length; i++) {
        const opt: RenderOptions | { fill?: string | null; stroke?: string } = options[i as number] as
            RenderOptions | { fill?: string | null; stroke?: string };
        const url: string = `url(#${id})`;
        if (info.fillUrl && opt.fill !== undefined && opt.fill !== null) {
            (opt as { fill?: string | null }).fill = url;
        }
        if (info.strokeUrl && opt.stroke) {
            (opt as { stroke?: string }).stroke = url;
        }
    }

    const defSpec: GradientDefSpec = {
        id,
        owner: spec.owner,
        index: spec.index,
        kind: spec.gradientKind,
        gradientProps: spec.gradientProps,
        stops: spec.gradientStops,
        strokeEndpoints: spec.strokeEndpoints || null,
        radialCenterPx: spec.radialCenterPx ?? null,
        target: spec.target
    };
    return { options, defSpec };
}

/**
 * Captures the gradient information required by `applyGradientToOptions`
 * using the merged props found on a `SeriesProperties`.
 *
 * @param {SeriesProperties} series - Series containing the parsed gradient configuration and rendered points.
 * @param {string} chartId - Chart element ID used to namespace the gradient definition.
 * @param {GradientTarget} target - Series target that determines whether the gradient is applied to fill or stroke.
 * @returns {GradientApplierSpec | null} The captured series gradient specification,
 * or `null` when the series does not contain a valid gradient.
 * @private
 */
export function captureSeriesGradientSpec(
    series: SeriesProperties,
    chartId: string,
    target: GradientTarget
): GradientApplierSpec | null {
    if (!series.gradientStops || !series.gradientKind || !series.gradientProps) {
        return null;
    }
    return {
        chartId,
        owner: 'series',
        index: series.index ?? 0,
        target,
        gradientProps: series.gradientProps,
        gradientStops: series.gradientStops,
        gradientKind: series.gradientKind,
        strokeEndpoints: buildStrokeEndpoints(
            series.points,
            series.clipRect
        ),
        radialCenterPx: null
    };
}

/**
 * Captures gradient information for a trendline target.
 *
 * @param {ChartTrendlineModel} trendline - Trendline containing the parsed gradient configuration and rendered points.
 * @param {string} chartId - Chart element ID used to namespace the trendline gradient definition.
 * @returns {GradientApplierSpec | null} The captured trendline gradient specification,
 * or `null` when the trendline does not contain a valid gradient.
 * @private
 */
export function captureTrendlineGradientSpec(
    trendline: ChartTrendlineModel,
    chartId: string
): GradientApplierSpec | null {
    if (!trendline.gradientStops || !trendline.gradientKind || !trendline.gradientProps) {
        return null;
    }
    return {
        chartId,
        owner: 'trendline',
        index: trendline.gradientIndex ?? 0,
        target: 'Trendline',
        gradientProps: trendline.gradientProps,
        gradientStops: trendline.gradientStops,
        gradientKind: trendline.gradientKind,
        strokeEndpoints: buildStrokeEndpoints(
            trendline.points,
            trendline.targetSeries?.clipRect
        ),
        radialCenterPx: null
    };
}

/**
 * Captures indicator gradient information.
 *
 * @param {ChartIndicatorSettings} indicator - Indicator containing the parsed gradient configuration and generated target series.
 * @param {string} chartId - Chart element ID used to namespace the indicator gradient definition.
 * @returns {GradientApplierSpec | null} The captured indicator gradient specification,
 * or `null` when the indicator does not contain a valid gradient.
 * @private
 */
export function captureIndicatorGradientSpec(
    indicator: ChartIndicatorSettings,
    chartId: string
): GradientApplierSpec | null {
    if (!indicator.gradientStops || !indicator.gradientKind || !indicator.gradientProps) {
        return null;
    }
    const target: GradientTarget = indicator.type === 'Macd' ? 'IndicatorMACDStroke' : 'IndicatorLineStroke';
    const targetSeriesArr: SeriesProperties[] = Array.isArray(indicator.targetSeries)
        ? indicator.targetSeries
        : (indicator.targetSeries ? [indicator.targetSeries] : []);
    const firstSeries: SeriesProperties | undefined = targetSeriesArr[0];
    return {
        chartId,
        owner: 'indicator',
        index: indicator.index ?? 0,
        target,
        gradientProps: indicator.gradientProps,
        gradientStops: indicator.gradientStops,
        gradientKind: indicator.gradientKind,
        strokeEndpoints: buildStrokeEndpoints(
            firstSeries?.points,
            firstSeries?.clipRect
        ),
        radialCenterPx: null
    };
}

/* ============================================================================
 * Public URL lookup
 * ========================================================================== */

/**
 * Returns the gradient `url(#…)` paint reference for a series, or `null`
 * when the series does not carry a valid gradient.
 *
 * Most consumers should read the cached `series.gradientFill` property
 * instead. The series renderer populates the cached property on every render
 * so the gradient ID is computed only once. This helper provides a fallback
 * for callers that have a `SeriesProperties` reference but no cached
 * `gradientFill`, such as during early initialization or unit testing.
 *
 * @param {SeriesProperties | null | undefined} series - Series containing
 * the cached or configured gradient information.
 * @param {string | undefined} chartId - Chart element ID used to namespace
 * the generated gradient ID.
 * @returns {string | null} The namespaced SVG gradient URL, or `null` when
 * the series does not contain a valid gradient.
 * @private
 */
export function getSeriesGradientUrl(
    series: SeriesProperties | null | undefined,
    chartId: string | undefined
): string | null {
    if (series?.gradientFill) { return series.gradientFill; }
    if (!series) { return null; }
    const kind: 'linear' | 'radial' | null | undefined = series.gradientKind;
    if (kind !== 'linear' && kind !== 'radial') { return null; }
    if (!series.gradientStops || series.gradientStops.length < 2) { return null; }
    const isTrendline: boolean = series.category === 'TrendLine';
    const owner: 'series' | 'trendline' = isTrendline ? 'trendline' : 'series';
    const index: number = isTrendline ?
        ((series as ChartTrendlineModel).gradientIndex ?? series.trendIndex ?? 0) :
        (series.index ?? 0);
    return `url(#${getGradientId(chartId, owner, index, kind)})`;
}

/**
 * Builds a serializable signature for the gradient component nested inside
 * a chart series.
 *
 * The signature tracks the gradient type, coordinates, and parsed color-stop
 * properties so dynamic gradient changes trigger series processing.
 *
 * @param {React.ReactNode} children - The chart series children that may
 * contain a linear or radial gradient component.
 * @returns {string} The serialized gradient signature, or `'none'` when the
 * series does not contain a gradient.
 * @private
 */
export function buildGradientSignature(
    children: React.ReactNode
): string {
    const gradientProps:
    ChartLinearGradientProps |
    ChartRadialGradientProps |
    null = extractGradientChildren(children);

    if (!gradientProps) {
        return 'none';
    }

    const parsedGradient:
    ReturnType<typeof buildParsedGradient> =
        buildParsedGradient(
            gradientProps,
            extractStops(gradientProps.children)
        );

    if (!parsedGradient) {
        return 'invalid';
    }

    if (parsedGradient.kind === 'linear') {
        const linearGradientProps:
        ChartLinearGradientProps =
            gradientProps as ChartLinearGradientProps;

        return JSON.stringify({
            kind: parsedGradient.kind,
            x1: linearGradientProps.x1,
            y1: linearGradientProps.y1,
            x2: linearGradientProps.x2,
            y2: linearGradientProps.y2,
            stops: parsedGradient.stops
        });
    }

    const radialGradientProps:
    ChartRadialGradientProps =
        gradientProps as ChartRadialGradientProps;

    return JSON.stringify({
        kind: parsedGradient.kind,
        cx: radialGradientProps.cx,
        cy: radialGradientProps.cy,
        r: radialGradientProps.r,
        fx: radialGradientProps.fx,
        fy: radialGradientProps.fy,
        stops: parsedGradient.stops
    });
}

/**
 * Builds a serializable signature from the parsed gradient properties
 * stored on a series, trendline, or indicator model.
 *
 * @param {SeriesProperties | ChartTrendlineModel | ChartIndicatorSettings | undefined} owner
 * The chart owner containing parsed gradient properties.
 * @returns {string} Serialized gradient configuration.
 * @private
 */
export function getOwnerGradientSignature(
    owner:
    SeriesProperties |
    ChartTrendlineModel |
    ChartIndicatorSettings |
    undefined
): string {
    if (
        !owner ||
        !owner.gradientProps ||
        !owner.gradientKind
    ) {
        return 'none';
    }

    if (owner.gradientKind === 'linear') {
        const gradientProps: ChartLinearGradientProps =
            owner.gradientProps as ChartLinearGradientProps;

        return JSON.stringify({
            kind: owner.gradientKind,
            x1: gradientProps.x1,
            y1: gradientProps.y1,
            x2: gradientProps.x2,
            y2: gradientProps.y2,
            stops: owner.gradientStops?.map(
                (stop: ChartGradientColorStopProps): ChartGradientColorStopProps => ({
                    offset: stop.offset,
                    color: stop.color,
                    opacity: stop.opacity,
                    lighten: stop.lighten,
                    brighten: stop.brighten
                })
            )
        });
    }

    const gradientProps: ChartRadialGradientProps =
        owner.gradientProps as ChartRadialGradientProps;

    return JSON.stringify({
        kind: owner.gradientKind,
        cx: gradientProps.cx,
        cy: gradientProps.cy,
        r: gradientProps.r,
        fx: gradientProps.fx,
        fy: gradientProps.fy,
        stops: owner.gradientStops?.map(
            (stop: ChartGradientColorStopProps): ChartGradientColorStopProps => ({
                offset: stop.offset,
                color: stop.color,
                opacity: stop.opacity,
                lighten: stop.lighten,
                brighten: stop.brighten
            })
        )
    });
}
