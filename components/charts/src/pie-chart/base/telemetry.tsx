import { initializeTelemetryFeature } from '@syncfusion/react-base';


/**
 * Constant identifier for the chart telemetry scope.
 *
 * @private
 */
export const CHART_TELEMETRY_KEY: string = 'Pie-Chart';
const PIE_TELEMETRY_FEATURE_TITLE: string = 'Title';
const PIE_TELEMETRY_FEATURE_SUBTITLE: string = 'SubTitle';
const PIE_TELEMETRY_FEATURE_LEGEND: string = 'Legend';
const PIE_TELEMETRY_FEATURE_PIE: string = 'Pie';
const PIE_TELEMETRY_FEATURE_TOOLTIP: string = 'Tooltip';
const PIE_TELEMETRY_FEATURE_CENTER_LABEL: string = 'CenterLabel';
const PIE_TELEMETRY_FEATURE_ANNOTATION: string = 'Annotation';

/**
 * Resolved feature flags derived from the React child tree for the PieChart.
 * Mirrors the `expectedKeys` derivation in `pie-chart/layout/LayoutContext`.
 *
 * @private
 */
export interface PieChartReactChildNodeBasedProps {
    title: boolean;
    subTitle: boolean;
    legend: boolean;
    pie: boolean;
    tooltip: boolean;
    centerLabel: boolean;
    annotation: boolean;
}

/**
 * Reports PieChart feature usage to telemetry based on the React child-node based props.
 * Mirrors the grid-side `setGridTelemetryFeatureList` and chart-side
 * `setChartTelemetryFeatureList` patterns so the same `initializeTelemetryFeature`
 * call can be used across components.
 *
 * @param {PieChartReactChildNodeBasedProps} reactChildNodeBasedProps - Feature flags derived from React children.
 * @returns {void} This function does not return a value.
 * @private
 */
export const setPieChartTelemetryFeatureList: (
    reactChildNodeBasedProps: PieChartReactChildNodeBasedProps
) => void =
    (reactChildNodeBasedProps: PieChartReactChildNodeBasedProps): void => {
        if (reactChildNodeBasedProps.title) {
            initializeTelemetryFeature(PIE_TELEMETRY_FEATURE_TITLE, CHART_TELEMETRY_KEY);
        }
        if (reactChildNodeBasedProps.subTitle) {
            initializeTelemetryFeature(PIE_TELEMETRY_FEATURE_SUBTITLE, CHART_TELEMETRY_KEY);
        }
        if (reactChildNodeBasedProps.legend) {
            initializeTelemetryFeature(PIE_TELEMETRY_FEATURE_LEGEND, CHART_TELEMETRY_KEY);
        }
        if (reactChildNodeBasedProps.pie) {
            initializeTelemetryFeature(PIE_TELEMETRY_FEATURE_PIE, CHART_TELEMETRY_KEY);
        }
        if (reactChildNodeBasedProps.tooltip) {
            initializeTelemetryFeature(PIE_TELEMETRY_FEATURE_TOOLTIP, CHART_TELEMETRY_KEY);
        }
        if (reactChildNodeBasedProps.centerLabel) {
            initializeTelemetryFeature(PIE_TELEMETRY_FEATURE_CENTER_LABEL, CHART_TELEMETRY_KEY);
        }
        if (reactChildNodeBasedProps.annotation) {
            initializeTelemetryFeature(PIE_TELEMETRY_FEATURE_ANNOTATION, CHART_TELEMETRY_KEY);
        }
    };
