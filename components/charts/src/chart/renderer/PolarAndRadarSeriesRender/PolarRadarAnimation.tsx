/**
 * Polar/Radar Series Animation Utilities
 * Provides common animation functionality for all polar/radar series types.
 * Animation starts from the chart center and expands radially to the final position.
 *
 * @private
 */

import { SeriesProperties, RenderOptions, Chart } from '../../chart-area/chart-interfaces';

/**
 * Animation state interface for polar/radar animations
 */
export interface PolarRadarAnimationState {
    /**
     * Previous path length reference for tracking changes
     */
    previousPathLengthRef: React.RefObject<number[]>;

    /**
     * Tracks whether this is the initial render for each series
     */
    isInitialRenderRef: React.RefObject<boolean[]>;

    /**
     * Stores the previously rendered path data
     */
    renderedPathDRef: React.RefObject<string[]>;

    /**
     * Current animation progress (0-1)
     */
    animationProgress: number;

    /**
     * Tracks if this is the first render overall
     */
    isFirstRenderRef: React.RefObject<boolean>;

    /**
     * Stores previous render options for comparison
     */
    previousSeriesOptionsRef: React.RefObject<RenderOptions[][]>;
}

/**
 * Calculates the scale factor for radial expansion animation.
 * Uses easing function for smooth animation.
 *
 * @param {number} progress - Animation progress from 0 to 1
 * @returns {number} Scale factor to apply to the series
 * @private
 */
export const calculateRadialScale: (progress: number) => number = (progress: number): number => {
    // Use easeOutCubic for smooth, natural-looking radial expansion
    const easeOutCubic: number = 1 - Math.pow(1 - progress, 3);
    return easeOutCubic;
};

/**
 * Generates an SVG transform string for polar/radar animation.
 * Scales the series from the center outward using the scale factor.
 *
 * @param {SeriesProperties} series - The series configuration
 * @param {number} scaleProgress - Scale progress (0-1)
 * @returns {string} SVG transform string for the series element
 * @private
 */
export const generatePolarRadarTransform: (
    series: SeriesProperties,
    scaleProgress: number
) => string = (
    series: SeriesProperties,
    scaleProgress: number
): string => {
    const chart: Chart = series.chart;
    const centerX: number = chart.polarCenterX;
    const centerY: number = chart.polarCenterY;

    return `translate(${centerX} ${centerY}) scale(${scaleProgress}) translate(${-centerX} ${-centerY})`;
};

/**
 * Main animation handler for all polar/radar series.
 * Coordinates scaling animation from the center with optional stroke animation.
 * Returns transform for radial expansion animation.
 *
 * @param {RenderOptions} _pathOptions - The path rendering options
 * @param {number} _index - The series index (for compatibility)
 * @param {PolarRadarAnimationState} state - Animation state
 * @param {boolean} enableAnimation - Whether animation is enabled
 * @param {SeriesProperties} currentSeries - Current series (used for center calculation)
 * @param {undefined} _currentPoint - Current point (for compatibility)
 * @param {number} _pointIndex - Current point index (for compatibility)
 * @param {SeriesProperties[]} _visibleSeries - Array of visible series (for compatibility)
 * @returns {Object} Animation properties with transform for radial expansion
 * @private
 */
export const calculatePolarRadarAnimation: (
    _pathOptions: RenderOptions,
    _index: number,
    state: PolarRadarAnimationState,
    enableAnimation: boolean,
    currentSeries: SeriesProperties,
    _currentPoint: undefined,
    _pointIndex: number,
    _visibleSeries: SeriesProperties[]
) => {
    strokeDasharray: string | number;
    strokeDashoffset: number;
    interpolatedD?: string;
    animatedTransform?: string;
} = (
    _pathOptions: RenderOptions,
    _index: number,
    state: PolarRadarAnimationState,
    enableAnimation: boolean,
    currentSeries: SeriesProperties,
    _currentPoint: undefined,
    _pointIndex: number,
    _visibleSeries: SeriesProperties[]
): { strokeDasharray: string | number; strokeDashoffset: number; interpolatedD?: string; animatedTransform?: string } => {
    void _currentPoint;
    void _pointIndex;
    void _visibleSeries;

    // Preserve the original dashArray from pathOptions
    const dashArray: string | number | undefined = _pathOptions.dashArray;
    const defaultDashArray: string | number = dashArray || 'none';

    if (!enableAnimation || !currentSeries.chart?.animateSeries || currentSeries.isLegendClicked) {
        return {
            strokeDasharray: defaultDashArray,
            strokeDashoffset: 0,
            animatedTransform: ''
        };
    }

    const { animationProgress } = state;

    // At animation end, return no transform/animation but preserve dashArray
    if (animationProgress === 1) {
        currentSeries.chart.animateSeries = false;
        return {
            strokeDasharray: defaultDashArray,
            strokeDashoffset: 0,
            animatedTransform: ''
        };
    }

    // Calculate radial scale for expansion from center
    const scaleProgress: number = calculateRadialScale(animationProgress);
    const transform: string = generatePolarRadarTransform(currentSeries, scaleProgress);

    return {
        strokeDasharray: defaultDashArray,
        strokeDashoffset: 0,
        animatedTransform: transform
    };
};

export default {
    calculateRadialScale,
    generatePolarRadarTransform,
    calculatePolarRadarAnimation
};
