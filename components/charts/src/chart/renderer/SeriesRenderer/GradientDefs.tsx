import * as React from 'react';
import { JSX } from 'react';
import {
    ChartGradientColorStopProps,
    GradientRenderInfo,
    ChartLinearGradientProps,
    ChartRadialGradientProps
} from '../../../chart/base/interfaces';
import {
    ResolvedStrokeEndpoints
} from '../../../chart/utils/gradient/gradientParsing';
import {
    getGradientId,
    isStrokeGradientTarget,
    GradientTarget
} from '../../../chart/utils/gradient/gradientPipeline';

/**
 * Single `<defs>` family member. Carries enough metadata to emit the SVG
 * nodes without re-walking the host series children.
 *
 * @private
 */
export interface GradientDefSpec {
    id: string;
    owner: GradientRenderInfo['owner'];
    index: number;
    kind: 'linear' | 'radial';
    gradientProps: ChartLinearGradientProps | ChartRadialGradientProps;
    stops: ChartGradientColorStopProps[];

    /**
     * Resolved pixel-space endpoints for stroke targets. When null, the
     * renderer falls back to `objectBoundingBox`.
     */
    strokeEndpoints: ResolvedStrokeEndpoints | null;

    /**
     * Used by `<radialGradient>` stroke targets so the renderer can
     * re-derive `cx`, `cy`, and `r` in pixel space.
     */
    radialCenterPx: { cx: number; cy: number; r: number } | null;
    target: GradientTarget;
}

/**
 * Result of building a gradient definition list.
 *
 * @private
 */
export type GradientRegistry = GradientDefSpec[];

/**
 * Renders one SVG gradient definition.
 *
 * @param {GradientDefSpec} spec - Gradient definition to render.
 * @returns {JSX.Element} Rendered SVG definition.
 * @private
 */
export function renderGradientDefs(spec: GradientDefSpec): JSX.Element {
    const { id, kind, gradientProps, stops, strokeEndpoints, target } = spec;
    const strokeTarget: boolean = isStrokeGradientTarget(target);
    const stopNodes: JSX.Element[] = stops.map(
        (stop: ChartGradientColorStopProps, idx: number): JSX.Element => (
            <stop
                key={`${id}_stop_${idx}`}
                offset={`${stop.offset}%`}
                stopColor={stop.color}
                stopOpacity={stop.opacity ?? 1}
            />
        )
    );

    if (kind === 'linear') {
        const linear: ChartLinearGradientProps = gradientProps as ChartLinearGradientProps;
        const attrs: {
            x1: number | string;
            y1: number | string;
            x2: number | string;
            y2: number | string;
        } = strokeTarget && strokeEndpoints
            ? {
                x1: strokeEndpoints.x1,
                y1: strokeEndpoints.y1,
                x2: strokeEndpoints.x2,
                y2: strokeEndpoints.y2
            }
            : {
                x1: parseCoord(linear.x1, 0),
                y1: parseCoord(linear.y1, 0),
                x2: parseCoord(linear.x2, 1),
                y2: parseCoord(linear.y2, 0)
            };

        return (
            <defs key={id}>
                <linearGradient
                    id={id}
                    gradientUnits={
                        strokeTarget && strokeEndpoints
                            ? 'userSpaceOnUse'
                            : 'objectBoundingBox'
                    }
                    x1={attrs.x1}
                    y1={attrs.y1}
                    x2={attrs.x2}
                    y2={attrs.y2}
                >
                    {stopNodes}
                </linearGradient>
            </defs>
        );
    }

    const radial: ChartRadialGradientProps = gradientProps as ChartRadialGradientProps;
    const cx: number | string = strokeTarget && spec.radialCenterPx
        ? spec.radialCenterPx.cx
        : parseCoord(radial.cx, 0.5);
    const cy: number | string = strokeTarget && spec.radialCenterPx
        ? spec.radialCenterPx.cy
        : parseCoord(radial.cy, 0.5);
    const r: number | string = strokeTarget && spec.radialCenterPx
        ? spec.radialCenterPx.r
        : parseCoord(radial.r, 0.5);
    const fx: number | string = radial.fx !== undefined
        ? parseCoord(radial.fx, cx as number)
        : cx;
    const fy: number | string = radial.fy !== undefined
        ? parseCoord(radial.fy, cy as number)
        : cy;

    return (
        <defs key={id}>
            <radialGradient
                id={id}
                gradientUnits={
                    strokeTarget && spec.radialCenterPx
                        ? 'userSpaceOnUse'
                        : 'objectBoundingBox'
                }
                cx={cx}
                cy={cy}
                r={r}
                fx={fx}
                fy={fy}
            >
                {stopNodes}
            </radialGradient>
        </defs>
    );
}

/**
 * Renders a collection of SVG gradient definitions.
 *
 * @param {object} props - Gradient definition properties.
 * @returns {JSX.Element | null} Gradient group or `null`.
 * @private
 */
export const GradientDefs: React.FC<{ specs: GradientDefSpec[] }> = (
    { specs }: { specs: GradientDefSpec[] }
): JSX.Element | null => {
    if (!specs || specs.length === 0) { return null; }

    return (
        <g aria-hidden="true" data-sf-gradient-defs="true">
            {specs.map(renderGradientDefs)}
        </g>
    );
};

/**
 * Creates renderer information for a gradient.
 *
 * @param {string | undefined} chartId - Chart element ID.
 * @param {string} owner - Gradient owner.
 * @param {number} index - Gradient owner index.
 * @param {string} kind - Gradient type.
 * @param {GradientTarget} target - Gradient rendering target.
 * @returns {GradientRenderInfo} Gradient render information.
 * @private
 */
export function makeRenderInfo(
    chartId: string | undefined,
    owner: GradientRenderInfo['owner'],
    index: number,
    kind: 'linear' | 'radial',
    target: GradientTarget
): GradientRenderInfo {
    const id: string = getGradientId(chartId, owner, index, kind);
    const url: string = `url(#${id})`;
    const strokeTargets: GradientTarget[] = [
        'Line', 'Spline', 'StepLine', 'MultiColoredLine', 'StackingLine',
        'Trendline', 'IndicatorRSIStroke', 'IndicatorMACDStroke',
        'IndicatorLineStroke'
    ];
    const isStroke: boolean = strokeTargets.indexOf(target) > -1;
    return {
        id,
        fillUrl: isStroke ? null : url,
        strokeUrl: isStroke ? url : null,
        owner,
        index
    };
}

/**
 * Converts a gradient coordinate to a valid value.
 *
 * @param {number | string | undefined} value - Coordinate value.
 * @param {number} fallback - Fallback coordinate.
 * @returns {number | string} Parsed coordinate or fallback.
 * @private
 */
function parseCoord(
    value: number | string | undefined,
    fallback: number
): number | string {
    if (value === undefined || value === null) { return fallback; }
    if (typeof value === 'number') {
        if (!isFinite(value)) { return fallback; }
        return value;
    }
    const parsed: number = Number(value);
    return isFinite(parsed) ? parsed : fallback;
}
