import * as React from 'react';
import {
    ChartGradientColorStopProps,
    ChartLinearGradientProps,
    ChartRadialGradientProps
} from '../../base/interfaces';
import { Rect, Points } from '../../chart-area/chart-interfaces';

/**
 * Discriminated union of gradient child props.
 *
 * @private
 */
type GradientChild = ChartLinearGradientProps | ChartRadialGradientProps;

/**
 * Result of parsing and validating a `<LinearGradient>` or
 * `<RadialGradient>` child.
 *
 * @private
 */
export interface ParsedGradient {
    /**
     * Resolved numeric offset `0..100`. Returns `null` when fewer than two
     * valid stops could be derived.
     */
    stops: ChartGradientColorStopProps[] | null;
    /**
     * `'linear'` if the gradient was authored as `<LinearGradient>`;
     * `'radial'` for `<RadialGradient>`. `null` for invalid inputs.
     */
    kind: 'linear' | 'radial' | null;
    /**
     * First valid stop's color, used as the high-contrast fallback when no
     * override is configured.
     */
    firstStopColor: string | null;
}

/**
 * Walks the `children` of a host element (`<ChartSeries>`, `<ChartMarker>`,
 * `<ChartTooltip>`, `<ChartTrendline>`, `<ChartIndicator>`) and resolves
 * only the first qualifying gradient child. Mixed gradient children
 * resolve with first-wins semantics.
 *
 * @param {React.ReactNode} children - Host node children.
 * @returns {GradientChild | null} The first gradient child's properties,
 * or `null` when no qualifying gradient child exists.
 * @private
 */
export function extractGradientChildren(children: React.ReactNode): GradientChild | null {
    let result: GradientChild | null = null;
    if (!children) { return result; }
    const arr: React.ReactNode[] = React.Children.toArray(children);
    for (const node of arr) {
        if (!React.isValidElement(node)) { continue; }
        const type: { displayName?: string; name?: string } =
            node.type as { displayName?: string; name?: string };
        const display: string | undefined = type?.displayName;
        if (display === 'ChartLinearGradient') {
            if (result === null) {
                result = node.props as ChartLinearGradientProps;
            }
        } else if (display === 'ChartRadialGradient') {
            if (result === null) {
                result = node.props as ChartRadialGradientProps;
            }
        }
    }
    return result;
}

/**
 * Walks the `children` of a gradient host and returns an ordered array of
 * `<GradientColorStop>` properties.
 *
 * @param {React.ReactNode} children - Gradient children.
 * @returns {ChartGradientColorStopProps[]} The ordered gradient color stop
 * properties found among the children.
 * @private
 */
export function extractStops(children: React.ReactNode): ChartGradientColorStopProps[] {
    if (!children) { return []; }
    const arr: React.ReactNode[] = React.Children.toArray(children);
    const out: ChartGradientColorStopProps[] = [];
    for (const node of arr) {
        if (!React.isValidElement(node)) { continue; }
        const type: { displayName?: string } =
            node.type as { displayName?: string };
        if (type?.displayName === 'ChartGradientColorStop') {
            out.push(node.props as ChartGradientColorStopProps);
        }
    }
    return out;
}

/**
 * Converts a stop offset to a clamped numeric percentage from `0` to `100`.
 *
 * @param {string | number | undefined} offset - Raw offset such as
 * `'50%'`, `50`, or `undefined`.
 * @returns {number} The offset clamped to the range `0..100`.
 * @private
 */
export function clampOffset(offset: string | number | undefined): number {
    if (offset === undefined || offset === null) { return 0; }
    let n: number;
    if (typeof offset === 'number') {
        n = offset;
    } else {
        // "50%" or "50" or "50 %" - strip the percentage symbol.
        const trimmed: string = String(offset).trim().replace('%', '').trim();
        n = Number(trimmed);
    }
    if (!isFinite(n)) { return 0; }
    if (n < 0) { return 0; }
    if (n > 100) { return 100; }
    return n;
}

/**
 * Clamps and sanitizes a stop color string. Returns the color when the value
 * is semantically valid. Otherwise, returns `null` so the caller can remove
 * the invalid stop.
 *
 * @param {string | undefined} color - Raw CSS color string.
 * @returns {string | null} The sanitized color or `null` when the color is
 * empty or contains a disallowed URL-like value.
 * @private
 */
export function clampStopColor(color: string | undefined): string | null {
    if (!color) { return null; }
    const trimmed: string = color.trim();
    if (trimmed.length === 0) { return null; }
    const lower: string = trimmed.toLowerCase();
    if (lower.startsWith('javascript:')) { return null; }
    if (lower.startsWith('data:')) { return null; }
    if (lower.startsWith('url(')) { return null; }
    return trimmed;
}

/**
 * Clamps an opacity value to the range `0..1`.
 *
 * @param {number | undefined} opacity - Raw opacity value.
 * @returns {number} The opacity value clamped to `0..1`. The default is `1`.
 * @private
 */
export function clampOpacity(opacity: number | undefined): number {
    if (opacity === undefined || opacity === null) { return 1; }
    if (!isFinite(opacity)) { return 1; }
    if (opacity < 0) { return 0; }
    if (opacity > 1) { return 1; }
    return opacity;
}

/**
 * Clamps a `lighten` modifier to the range `0..1`.
 *
 * @param {number | undefined} value - Raw lighten value.
 * @returns {number} The value clamped to `0..1`. The default is `0`.
 * @private
 */
export function clampLighten(value: number | undefined): number {
    if (value === undefined || value === null) { return 0; }
    if (!isFinite(value)) { return 0; }
    if (value < 0) { return 0; }
    if (value > 1) { return 1; }
    return value;
}

/**
 * Clamps a `brighten` modifier to the range `-1..1`.
 *
 * @param {number | undefined} value - Raw brighten value.
 * @returns {number} The value clamped to `-1..1`. The default is `0`.
 * @private
 */
export function clampBrighten(value: number | undefined): number {
    if (value === undefined || value === null) { return 0; }
    if (!isFinite(value)) { return 0; }
    if (value < -1) { return -1; }
    if (value > 1) { return 1; }
    return value;
}

/**
 * Converts a numeric byte (0-255) into a 2-character uppercase hex string.
 *
 * @param {number} value - Numeric byte.
 * @returns {string} Hex representation padded to two characters.
 * @private
 */
function toHex2(value: number): string {
    const hex: string = Math.max(0, Math.min(255, Math.round(value))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
}

/**
 * Normalizes a CSS-style color token into the 6-length `#rrggbb` form.
 * Returns `null` when the input cannot be expanded to a hex triplet.
 *
 * @param {string} color - Any CSS color string the host chart already accepts.
 * @returns {string | null} Six-character hex with leading `#`, or `null`.
 * @private
 */
function toHexColor(color: string): string | null {
    if (!color) { return null; }
    let hex: string = color;
    if (hex.charAt(0) !== '#') {
        hex = '#' + hex;
    }
    hex = hex.replace(/^#/, '');
    if (hex.length === 3) {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    if (!/^[0-9a-fA-F]{6}$/.test(hex)) {
        return null;
    }
    return '#' + hex.toLowerCase();
}

/**
 * Lightens the given color by moving each channel toward white by
 * the supplied factor (matches the ej2 `lightenColor` behavior).
 *
 * @param {string} color - Color string as authored.
 * @param {number} lighten - Lightness factor in `0..1`. `0` is a no-op.
 * @returns {string} The lightened color as a 6-character hex string, or the
 * original `color` when the channel expansion fails.
 * @private
 */
export function lightenColor(color: string, lighten: number): string {
    if (!color) {
        return color;
    }
    const hex: string | null = toHexColor(color);
    if (!hex) {
        return color;
    }
    const factor: number = Math.min(1, Math.max(0, lighten));
    let r: number = parseInt(hex.substring(1, 3), 16);
    let g: number = parseInt(hex.substring(3, 5), 16);
    let b: number = parseInt(hex.substring(5, 7), 16);
    r = Math.round(r + (255 - r) * factor);
    g = Math.round(g + (255 - g) * factor);
    b = Math.round(b + (255 - b) * factor);
    return '#' + toHex2(r) + toHex2(g) + toHex2(b);
}

/**
 * Adjusts the brightness of the given color by the supplied factor
 * (matches the ej2 `brightenColor` behavior). Positive values lighten,
 * negative values darken, `0` is a no-op.
 *
 * @param {string} color - Color string as authored.
 * @param {number} brighten - Brightness factor in `-1..1`.
 * @returns {string} The adjusted color as a 6-character hex string, or the
 * original `color` when the channel expansion fails.
 * @private
 */
export function brightenColor(color: string, brighten: number): string {
    if (!color || brighten === 0) {
        return color;
    }
    const hex: string | null = toHexColor(color);
    if (!hex) {
        return color;
    }
    let r: number = parseInt(hex.substring(1, 3), 16);
    let g: number = parseInt(hex.substring(3, 5), 16);
    let b: number = parseInt(hex.substring(5, 7), 16);
    if (brighten > 0) {
        r = Math.round(r + (255 - r) * brighten);
        g = Math.round(g + (255 - g) * brighten);
        b = Math.round(b + (255 - b) * brighten);
    } else {
        const factor: number = 1 + brighten;
        r = Math.round(r * factor);
        g = Math.round(g * factor);
        b = Math.round(b * factor);
    }
    return '#' + toHex2(r) + toHex2(g) + toHex2(b);
}

/**
 * Validates a stop list and produces a sorted, deduplicated array suitable
 * for direct SVG emission. Returns `null` when fewer than two valid stops
 * remain or when no stops were supplied.
 *
 * @param {ChartGradientColorStopProps[]} rawStops - Stops as authored.
 * @returns {ChartGradientColorStopProps[] | null} The sorted and deduplicated
 * gradient stops, or `null` when fewer than two valid stops remain.
 * @private
 */
export function parseStops(
    rawStops: ChartGradientColorStopProps[]
): ChartGradientColorStopProps[] | null {
    if (!rawStops || rawStops.length === 0) { return null; }

    const parsed: ChartGradientColorStopProps[] = [];
    const byOffset: Map<number, ChartGradientColorStopProps> = new Map();

    for (let i: number = 0; i < rawStops.length; i++) {
        const raw: ChartGradientColorStopProps = rawStops[i as number];
        const color: string | null = clampStopColor(raw.color);
        if (!color) {
            continue;
        }
        const offset: number = clampOffset(raw.offset);
        const opacity: number = clampOpacity(raw.opacity);
        const lighten: number = clampLighten(raw.lighten);
        const brighten: number = clampBrighten(raw.brighten);
        const adjustedColor: string = lighten > 0
            ? lightenColor(color, lighten)
            : (brighten !== 0 ? brightenColor(color, brighten) : color);
        const stop: ChartGradientColorStopProps = { offset, color: adjustedColor, opacity, lighten, brighten };
        // Last-in-wins for duplicate offsets.
        byOffset.set(offset, stop);
    }

    byOffset.forEach((value: ChartGradientColorStopProps): void => {
        parsed.push(value);
    });
    parsed.sort((a: ChartGradientColorStopProps, b: ChartGradientColorStopProps): number => {
        const ao: number = typeof a.offset === 'number' ? a.offset : Number(a.offset);
        const bo: number = typeof b.offset === 'number' ? b.offset : Number(b.offset);
        return (isFinite(ao) ? ao : 0) - (isFinite(bo) ? bo : 0);
    });

    if (parsed.length < 2) {
        return null;
    }

    return parsed;
}

/**
 * Combines a `gradientProps` value with the parsed stops into the structure
 * consumed by the renderer.
 *
 * @param {GradientChild | null} raw - Linear or radial gradient properties.
 * @param {ChartGradientColorStopProps[]} stopsRaw - Stops extracted from the
 * gradient's children.
 * @returns {ParsedGradient | null} The parsed gradient configuration, or
 * `null` when the gradient or its stops are invalid.
 * @private
 */
export function buildParsedGradient(
    raw: GradientChild | null,
    stopsRaw: ChartGradientColorStopProps[]
): ParsedGradient | null {
    if (!raw) { return null; }
    const stopsParsed: ChartGradientColorStopProps[] | null = parseStops(stopsRaw);
    if (!stopsParsed) { return null; }
    const kind: 'linear' | 'radial' = (raw as ChartRadialGradientProps).cx !== undefined ||
        (raw as ChartRadialGradientProps).r !== undefined ? 'radial' : 'linear';
    const firstStopColor: string | null = stopsParsed[0] ? stopsParsed[0].color : null;
    return {
        stops: stopsParsed,
        kind,
        firstStopColor
    };
}

/**
 * Resolved pixel-space endpoints for a stroke gradient.
 *
 * @private
 */
export interface ResolvedStrokeEndpoints {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
}

/**
 * Returns the first and last valid visible points.
 *
 * @param {Points[]} points - Chart points.
 * @returns {object} First and last visible points.
 * @private
 */
export function pickFirstAndLastVisible(points: Points[]): { first: Points | null; last: Points | null } {
    let first: Points | null = null;
    let last: Points | null = null;
    for (let i: number = 0; i < points.length; i++) {
        const p: Points = points[i as number];
        if (!p) { continue; }
        if (!isFinite(p.yValue as number) && typeof p.yValue !== 'string') { continue; }
        if (first === null) { first = p; }
        last = p;
    }
    return { first, last };
}

/**
 * Converts a chart point to its absolute symbol location.
 *
 * @param {Points} point - Chart point.
 * @param {Rect} clipRect - Series clip rectangle.
 * @returns {object | null} Absolute location or `null`.
 * @private
 */
export function absoluteSymbolLocation(point: Points, clipRect: Rect): { x: number; y: number } | null {
    if (!point.symbolLocations || point.symbolLocations.length === 0) { return null; }
    const loc: { x: number; y: number } = point.symbolLocations[0];
    return { x: loc.x + clipRect.x, y: loc.y + clipRect.y };
}

/**
 * Resolves stroke endpoints from visible points.
 *
 * @param {Points[]} points - Chart points.
 * @param {Rect | undefined} clipRect - Series clip rectangle.
 * @returns {object | null} Resolved endpoints or `null`.
 * @private
 */
export function resolveStrokeEndpoints(
    points: Points[],
    clipRect: Rect | undefined
): ResolvedStrokeEndpoints | null {
    if (!clipRect) { return null; }
    const { first, last } = pickFirstAndLastVisible(points);
    if (!first || !last) { return null; }
    const p0: { x: number; y: number } | null = absoluteSymbolLocation(first, clipRect);
    const p1: { x: number; y: number } | null = absoluteSymbolLocation(last, clipRect);
    if (!p0 || !p1) { return null; }
    return { x1: p0.x, y1: p0.y, x2: p1.x, y2: p1.y };
}

/**
 * Resolves stroke endpoints from chart points.
 *
 * @param {Points[] | null | undefined} points - Chart points.
 * @param {Rect | undefined} clipRect - Series clip rectangle.
 * @returns {object | null} Resolved endpoints or `null`.
 * @private
 */
export function buildStrokeEndpoints(
    points: Points[] | null | undefined,
    clipRect: Rect | undefined
): { x1: number; y1: number; x2: number; y2: number } | null {
    if (!points || points.length === 0) { return null; }
    return resolveStrokeEndpoints(
        points,
        clipRect
    );
}
