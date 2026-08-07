import { initializeTelemetryFeature } from '@syncfusion/react-base';

/**
 * Constant identifier for the chart telemetry scope.
 *
 * @private
 */
export const CHART_TELEMETRY_KEY: string = 'chart';
const CHART_TELEMETRY_FEATURE_TITLE: string = 'Title';
const CHART_TELEMETRY_FEATURE_SUBTITLE: string = 'SubTitle';
const CHART_TELEMETRY_FEATURE_LEGEND: string = 'Legend';
const CHART_TELEMETRY_FEATURE_SERIES: string = 'Series';
const CHART_TELEMETRY_FEATURE_STACK_LABELS: string = 'StackLabels';
const CHART_TELEMETRY_FEATURE_STRIP_LINE: string = 'StripLine';
const CHART_TELEMETRY_FEATURE_ANNOTATION: string = 'Annotation';

/**
 * Resolved feature flags derived from the React child tree (mirrors the
 * `expectedKeys` derivation in `LayoutContext`). These cannot be read from
 * `props` alone because they depend on which sub-components are mounted.
 *
 * @private
 */
export interface ChartReactChildNodeBasedProps {
    title: boolean;
    subTitle: boolean;
    series: boolean;
    legend: boolean;
    stackLabels: boolean;
    stripLines: boolean;
    annotation: boolean;
}

/**
 * Reports chart feature usage to telemetry based on the React child-node based props.
 * Mirrors the grid-side `setGridTelemetryFeatureList` pattern so that the same
 * `initializeTelemetryFeature` call can be used across components.
 *
 * @param {ChartReactChildNodeBasedProps} reactChildNodeBasedProps - Feature flags derived from React children.
 * @returns {void} This function does not return a value.
 * @private
 */
export const setChartTelemetryFeatureList: (
    reactChildNodeBasedProps: ChartReactChildNodeBasedProps
) => void =
    (reactChildNodeBasedProps: ChartReactChildNodeBasedProps): void => {
        if (reactChildNodeBasedProps.title) {
            initializeTelemetryFeature(CHART_TELEMETRY_FEATURE_TITLE, CHART_TELEMETRY_KEY);
        }
        if (reactChildNodeBasedProps.subTitle) {
            initializeTelemetryFeature(CHART_TELEMETRY_FEATURE_SUBTITLE, CHART_TELEMETRY_KEY);
        }
        if (reactChildNodeBasedProps.legend) {
            initializeTelemetryFeature(CHART_TELEMETRY_FEATURE_LEGEND, CHART_TELEMETRY_KEY);
        }
        if (reactChildNodeBasedProps.series) {
            initializeTelemetryFeature(CHART_TELEMETRY_FEATURE_SERIES, CHART_TELEMETRY_KEY);
        }
        if (reactChildNodeBasedProps.stackLabels) {
            initializeTelemetryFeature(CHART_TELEMETRY_FEATURE_STACK_LABELS, CHART_TELEMETRY_KEY);
        }
        if (reactChildNodeBasedProps.stripLines) {
            initializeTelemetryFeature(CHART_TELEMETRY_FEATURE_STRIP_LINE, CHART_TELEMETRY_KEY);
        }
        if (reactChildNodeBasedProps.annotation) {
            initializeTelemetryFeature(CHART_TELEMETRY_FEATURE_ANNOTATION, CHART_TELEMETRY_KEY);
        }
    };
