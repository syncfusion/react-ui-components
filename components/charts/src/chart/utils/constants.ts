/**
 * Constants used throughout the chart component
 */

// Layout and spacing constants
export const DEFAULT_PADDING: number = 5;
export const CHART_AREA_PADDING: number = 10;

// Contrast ratio calculation constants for accessibility
export const CONTRAST_RATIO: {
    RED_FACTOR: number;
    GREEN_FACTOR: number;
    BLUE_FACTOR: number;
    DIVISOR: number;
} = {
    RED_FACTOR: 299,
    GREEN_FACTOR: 587,
    BLUE_FACTOR: 114,
    DIVISOR: 1000
};
