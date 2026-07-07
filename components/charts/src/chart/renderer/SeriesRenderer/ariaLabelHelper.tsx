import { ChartSeriesProps } from '../../base/interfaces';
import { MarkerOptions, Points, SeriesProperties } from '../../chart-area/chart-interfaces';

type AriaLabelValue = string | number | Date | boolean | object | null | undefined;
type BoxAndWhiskerPoint = Points & {
    q1?: number;
    q3?: number;
};

type WaterfallPoint = Points & {
    isSum?: boolean;
    isIntermediateSum?: boolean;
};

type MarkerAccessibilityLabelParams = {
    markerOption: MarkerOptions;
    markerIndex: number;
    seriesType?: string;
    series?: SeriesProperties;
    isEnhancedOutliers: boolean;
};

type ResolveMarkerAriaLabelParams = MarkerAccessibilityLabelParams & {
    point?: Points;
};

type SeriesGroupAriaLabelParams = {
    series: SeriesProperties | undefined;
    seriesIndex: number;
    totalSeriesCount: number;
};
type SeriesAccessibilityLabelParams = {
    series: SeriesProperties;
    point?: Points;
    pathId: string;
    seriesIndex: number;
    totalSeriesCount: number;
};

/**
 * Converts a non-nullish value to text for aria-label construction.
 *
 * @param {AriaLabelValue} value - The value to convert.
 * @returns {string | undefined} The string value, or undefined when the value is null or undefined.
 *
 * @private
 */
function getValueText(value: AriaLabelValue): string | undefined {
    return value !== undefined && value !== null ? String(value) : undefined;
}

/**
 * Formats an accessibility description for a point using the series' descriptionFormat template.
 * Supported placeholders: ${series.name}, ${point.x}, ${point.y}.
 *
 * @param {Points} point - The data point to format values from.
 * @param {(ChartSeriesProps | SeriesProperties)} series - The series configuration, either runtime SeriesProperties or component ChartSeriesProps.
 * @returns {string} A formatted string when a valid format exists and all placeholders resolve; otherwise an empty string.
 *
 * @private
 */
export function formatAccessibilityDescription(point: Points, series: ChartSeriesProps | SeriesProperties): string {
    const format: string | undefined = series.accessibility?.descriptionFormat as string | undefined;

    if (!format) {
        return '';
    }

    const result : string = format
        .replace('${series.name}', series?.name ? String(series.name) : '${series.name}')
        .replace('${point.x}', point?.x !== undefined ? String(point.x) : '${point.x}')
        .replace('${point.y}', point?.y !== undefined ? String(point.y) : '${point.y}');
    // If any placeholder remains unreplaced, return empty to trigger fallback
    if (result.includes('${')) {
        return '';
    }
    return result;
}

/**
 * Builds the optional series name prefix used in generic aria-labels.
 *
 * @param {SeriesProperties | undefined} series - The series whose name should be used as a prefix.
 * @returns {string} The formatted series name prefix, or an empty string when no series name is available.
 *
 * @private
 */
function getSeriesNamePrefix(series: SeriesProperties | undefined): string {
    return series?.name ? `${series.name}, ` : '';
}

/**
 * Builds an aria-label for a scatter or bubble marker.
 *
 * If the series provides a descriptionFormat, that template is used through
 * formatAccessibilityDescription(). Otherwise, this falls back to
 * "x: y, seriesName" when both x and y are available.
 *
 * @param {Points} point - The marker's data point.
 * @param {SeriesProperties} series - The runtime series configuration.
 * @returns {string | undefined} The aria-label string, or undefined when insufficient data is available.
 *
 * @private
 */
export function getScatterMarkerAriaLabel(
    point: Points,
    series: ChartSeriesProps | SeriesProperties
): string | undefined {
    if (!point) {
        return undefined;
    }
    if (series.accessibility?.descriptionFormat) {
        const formattedLabel: string = formatAccessibilityDescription(point, series);
        return formattedLabel || undefined;
    }
    const hasXValue: boolean = point.x !== undefined && point.x !== null;
    const hasYValue: boolean = point.y !== undefined && point.y !== null;
    if (!hasXValue || !hasYValue) {
        return undefined;
    }
    const seriesNameSuffix: string = series?.name ? `, ${series.name}` : '';
    return `${String(point.x)}: ${String(point.y)}${seriesNameSuffix}`;
}

/**
 * Produces an aria-label for a BoxAndWhisker outlier marker based on the marker id and parent series.
 *
 * @param {string | undefined} markerId - The marker element id. Expected pattern: _Point_{index}_Outlier_Symbol{outlierIndex}.
 * @param {SeriesProperties | undefined} series - The parent series properties containing point data.
 * @returns {string | undefined} An aria-label describing the outlier category and value, or undefined when the marker id, series, source point, category, or outlier value cannot be resolved.
 *
 * @private
 */
export function getBoxAndWhiskerOutlierAriaLabel(
    markerId: string | undefined,
    series: SeriesProperties | undefined
): string | undefined {
    if (!markerId || !series) {
        return undefined;
    }
    const outlierMatch: RegExpMatchArray | null = markerId.match(/_Point_(\d+)_Outlier_Symbol(\d+)/);
    if (!outlierMatch) {
        return undefined;
    }
    const sourcePointIndex: number = Number(outlierMatch[1]);
    const outlierIndex: number = Number(outlierMatch[2]);
    const sourcePoint: Points | undefined =
        series.points?.[sourcePointIndex as number] as Points | undefined;
    if (!sourcePoint) {
        return undefined;
    }
    const categoryLabel: string | undefined = getValueText(sourcePoint.x);
    const outlierValue: string | undefined = getValueText(sourcePoint.outliers?.[outlierIndex as number]);

    if (!categoryLabel || !outlierValue) {
        return undefined;
    }
    return (categoryLabel + ', outlier: ' + outlierValue + (series.name ? '. ' + series.name + '.' : '.'));
}

/**
 * Resolves the specialized aria-label for marker elements.
 *
 * Enhanced BoxAndWhisker outlier markers are labeled from the marker id and parent series.
 * Scatter and Bubble markers are labeled from their corresponding point values.
 * For other marker types, this function returns undefined so the caller can use a default marker label.
 *
 * @param {MarkerAccessibilityLabelParams} params - Parameters used to resolve the marker aria-label.
 * @returns {string | undefined} The specialized marker aria-label, or undefined when no specialized marker label applies.
 *
 * @private
 */
export function markerAccessibilityLabel({
    markerOption,
    markerIndex,
    seriesType,
    series,
    isEnhancedOutliers
}: MarkerAccessibilityLabelParams): string | undefined {
    if (isEnhancedOutliers) {
        return getBoxAndWhiskerOutlierAriaLabel(markerOption.id, series);
    }

    const currentPoint: Points | undefined = series?.points?.[markerIndex as number];
    const isScatterOrBubble: boolean = ((seriesType?.indexOf('Scatter') ?? -1) > -1) || series?.type === 'Bubble';
    if (isScatterOrBubble && currentPoint && series) {
        return getScatterMarkerAriaLabel(currentPoint, series);
    }
    return undefined;
}

/**
 * Builds the default aria-label for marker elements from point and series data.
 *
 * If a series descriptionFormat is available, that format is used first.
 * Otherwise, the label is built from the point category and value, with the series name appended when available.
 *
 * @param {Points | undefined} point - The data point represented by the marker.
 * @param {SeriesProperties | undefined} series - The parent runtime series.
 * @returns {string | undefined} The default marker aria-label, or undefined when required data is unavailable.
 *
 * @private
 */
function getDefaultMarkerAriaLabel(
    point: Points | undefined,
    series: SeriesProperties | undefined
): string | undefined {
    if (!point) {
        return undefined;
    }

    if (series?.accessibility?.descriptionFormat) {
        const formattedLabel: string = formatAccessibilityDescription(point, series);
        return formattedLabel || undefined;
    }
    const categoryLabel: string | undefined = getValueText(point.x);
    const pointValue: string | undefined = getValueText(point.yValue ?? point.y);
    if (!categoryLabel || !pointValue) {
        return undefined;
    }
    return categoryLabel + ': ' + pointValue + (series?.name ? ', ' + series.name : '');
}

/**
 * Resolves the final aria-label for a marker element.
 *
 * This first attempts to return a specialized marker label, such as a BoxAndWhisker
 * outlier label or Scatter/Bubble marker label. If no specialized label applies,
 * it falls back to a default marker label based on the provided point and series.
 *
 * @param {ResolveMarkerAriaLabelParams} params - Parameters used to resolve the marker aria-label.
 * @param {MarkerOptions} params.markerOption - The rendered marker option, including the marker element id.
 * @param {number} params.markerIndex - The index of the marker within the series marker collection.
 * @param {string} [params.seriesType] - The series type used to detect Scatter marker variants.
 * @param {SeriesProperties} [params.series] - The parent runtime series that owns the marker.
 * @param {Points} [params.point] - The data point used for the default marker aria-label fallback.
 * @param {boolean} params.isEnhancedOutliers - Indicates whether the marker represents an enhanced BoxAndWhisker outlier.
 * @returns {string | undefined} The resolved marker aria-label, or undefined when neither specialized nor default marker data is available.
 *
 * @private
 */
export function resolveMarkerAriaLabel({
    markerOption,
    markerIndex,
    seriesType,
    series,
    point,
    isEnhancedOutliers
}: ResolveMarkerAriaLabelParams): string | undefined {
    const specialMarkerLabel: string | undefined = markerAccessibilityLabel({
        markerOption,
        markerIndex,
        seriesType,
        series,
        isEnhancedOutliers
    });

    if (specialMarkerLabel) {
        return specialMarkerLabel;
    }
    return getDefaultMarkerAriaLabel(point, series);
}


/**
 * Builds the generic aria-label for a rendered series group.
 *
 * The label includes the optional series name, series type, series position, total series count,
 * and number of data points.
 *
 * @param {SeriesGroupAriaLabelParams} params - Parameters used to build the generic series group label.
 * @returns {string} The generic aria-label for the series group.
 *
 * @private
 */
function getGenericSeriesGroupAriaLabel({
    series,
    seriesIndex,
    totalSeriesCount
}: SeriesGroupAriaLabelParams): string {
    const pointCount: number = series?.points?.length ?? 0;
    return (getSeriesNamePrefix(series) + `${series?.type ?? 'Series'} ${seriesIndex + 1} of ${totalSeriesCount} series with ${pointCount} data points`
    );
}

/**
 * Builds the generic aria-label for a rendered series path.
 *
 * This is used when a chart-specific point label cannot be generated. Column and Scatter
 * series receive more descriptive generic labels such as "bar series" and "scatter plot".
 *
 * @param {SeriesGroupAriaLabelParams} params - Parameters used to build the generic series path label.
 * @returns {string} The generic aria-label for the series path.
 *
 * @private
 */
function getGenericSeriesPathAriaLabel({
    series,
    seriesIndex,
    totalSeriesCount
}: SeriesGroupAriaLabelParams): string {
    const pointCount: number = series?.points?.length ?? 0;
    const seriesTypeLabel: string = series?.type === 'Column' ? 'bar series' : series?.type === 'Scatter' ? 'scatter plot' : `${series?.type ?? 'Series'} series`;
    const pointCountLabel: string = series?.type === 'Column' ? 'bars.' : series?.type === 'Scatter' ? 'points.' : 'data points.';
    return (getSeriesNamePrefix(series) + `${seriesTypeLabel} ${seriesIndex + 1} of ${totalSeriesCount} with ${pointCount} ${pointCountLabel}`);
}

/**
 * Builds an aria-label for the BoxPath of a BoxAndWhisker point.
 *
 * A label is returned only for the box body path and only when all required statistical
 * values are available: category, minimum, q1, median, q3, and maximum.
 *
 * @param {SeriesProperties} series - The BoxAndWhisker series.
 * @param {Points | undefined} point - The data point represented by the box path.
 * @param {string} pathId - The SVG path id used to identify the BoxPath.
 * @returns {string | undefined} The BoxAndWhisker point aria-label, or undefined when the path is not a box body path or required data is missing.
 *
 * @private
 */
function getBoxAndWhiskerLabel(
    series: SeriesProperties,
    point: Points | undefined,
    pathId: string
): string | undefined {
    const isBoxBodyPath: boolean = pathId.includes('_BoxPath');

    if (!isBoxBodyPath || !point) {
        return undefined;
    }

    const boxPoint: BoxAndWhiskerPoint = point as BoxAndWhiskerPoint;
    const categoryLabel: string | undefined = getValueText(point.x);
    const minimumValue: string | undefined = getValueText(boxPoint.minimum ?? boxPoint.low);
    const q1Value: string | undefined = getValueText(boxPoint.lowerQuartile ?? boxPoint.q1);
    const medianValue: string | undefined = getValueText(point.median);
    const q3Value: string | undefined = getValueText(boxPoint.upperQuartile ?? boxPoint.q3);
    const maximumValue: string | undefined = getValueText(boxPoint.maximum ?? boxPoint.high);
    if (!categoryLabel || !minimumValue || !q1Value || !medianValue || !q3Value || !maximumValue) {
        return undefined;
    }
    return ( categoryLabel + ', low: ' + minimumValue + ', q1: ' + q1Value + ', median: ' + medianValue + ', q3: ' + q3Value + ', high: ' + maximumValue + (series?.name ? '. ' + series.name + '.' : '.')
    );
}

/**
 * Builds an aria-label for a Histogram bin path.
 *
 * Normal distribution line paths are ignored because they are not point-based data bins.
 * A label is returned only when bin width, bin center, and frequency are available.
 *
 * @param {SeriesProperties} series - The Histogram series.
 * @param {Points | undefined} point - The histogram bin point.
 * @param {string} pathId - The SVG path id used to identify histogram paths.
 * @returns {string | undefined} The Histogram bin aria-label, or undefined when the path is not labelable or required data is missing.
 *
 * @private
 */
function getHistogramLabel(
    series: SeriesProperties,
    point: Points | undefined,
    pathId: string
): string | undefined {
    const isNormalDistributionLine: boolean = pathId.endsWith('_NDLine');

    if (isNormalDistributionLine || !point) {
        return undefined;
    }
    const histogramBinWidth: number | null | undefined = series?.histogramSettings?.binInterval;
    const histogramCenterValue: number | undefined =
        point.xValue !== undefined && point.xValue !== null ? Number(point.xValue) :
            point.x !== undefined && point.x !== null ? Number(point.x) :
                undefined;
    const histogramFrequencyValue: string | undefined = getValueText(point.yValue ?? point.y);
    if (histogramBinWidth === undefined || histogramBinWidth === null || histogramCenterValue === undefined ||
        Number.isNaN(histogramCenterValue) || !histogramFrequencyValue) {
        return undefined;
    }
    const histogramBinStartValue: string = String(histogramCenterValue - (histogramBinWidth / 2));
    const histogramBinEndValue: string = String(histogramCenterValue + (histogramBinWidth / 2));
    return ( histogramBinStartValue + ' - ' + histogramBinEndValue + ', frequency: ' + histogramFrequencyValue + (series?.name ? '. ' + series.name + '.' : '.'));
}

/**
 * Builds an aria-label for a Waterfall data column.
 *
 * Connector paths are ignored because they are visual connectors rather than independent data points.
 * Sum and intermediate-sum points are labeled as total and subtotal when the corresponding flags are present.
 *
 * @param {SeriesProperties} series - The Waterfall series.
 * @param {Points | undefined} point - The Waterfall data point.
 * @param {string} pathId - The SVG path id used to identify Waterfall paths and connectors.
 * @returns {string | undefined} The Waterfall point aria-label, or undefined when the path is a connector or required data is missing.
 *
 * @private
 */
function getWaterfallLabel(
    series: SeriesProperties,
    point: Points | undefined,
    pathId: string
): string | undefined {
    const isConnectorPath: boolean = pathId.includes('_Connector_');

    if (isConnectorPath || !point) {
        return undefined;
    }

    const waterfallPoint: WaterfallPoint = point as WaterfallPoint;
    const categoryLabel: string | undefined = getValueText(point.x);
    const pointValue: string | undefined = getValueText(waterfallPoint.yValue ?? waterfallPoint.y);
    const pointKind: string = waterfallPoint?.isSum ? 'total' : waterfallPoint?.isIntermediateSum ? 'subtotal' : '';

    if (!categoryLabel || !pointValue) {
        return undefined;
    }
    return (categoryLabel + (pointKind ? ', ' + pointKind + ': ' : ', ') + pointValue + (series?.name ? '. ' + series.name + '.' : '.'));
}

/**
 * Builds an aria-label for financial chart points.
 *
 * Candle and HiloOpenClose points require category, open, high, low, and close values.
 * Hilo points require category, high, and low values.
 *
 * @param {SeriesProperties} series - The financial series.
 * @param {Points | undefined} point - The financial data point.
 * @returns {string | undefined} The financial point aria-label, or undefined when the series type is unsupported or required data is missing.
 *
 * @private
 *
 */
function getFinancialLabel(
    series: SeriesProperties,
    point: Points | undefined
): string | undefined {
    if (!point) {
        return undefined;
    }

    const categoryLabel: string | undefined = getValueText(point.x);
    const highValue: string | undefined = getValueText(point.high);
    const lowValue: string | undefined = getValueText(point.low);

    if (!categoryLabel || !highValue || !lowValue) {
        return undefined;
    }

    if (series.type === 'Candle' || series.type === 'HiloOpenClose') {
        const openValue: string | undefined = getValueText(point.open);
        const closeValue: string | undefined = getValueText(point.close);

        if (!openValue || !closeValue) {
            return undefined;
        }
        return ( categoryLabel + ', open: ' + openValue + ', high: ' + highValue + ', low: ' + lowValue + ', close: ' + closeValue + (series.name ? '. ' + series.name + '.' : '.'));
    }
    if (series.type === 'Hilo') {
        return (categoryLabel + ', high: ' + highValue + ', low: ' + lowValue + (series.name ? '. ' + series.name + '.' : '.'));
    }
    return undefined;
}

/**
 * Builds an aria-label for a Pareto bar point.
 *
 * Pareto line paths are excluded because this label applies only to Pareto bar values.
 *
 * @param {SeriesProperties} series - The Pareto series.
 * @param {Points | undefined} point - The Pareto bar point.
 * @returns {string | undefined} The Pareto bar aria-label, or undefined when the point is not a Pareto bar or required data is missing.
 *
 * @private
 */
function getParetoBarLabel(
    series: SeriesProperties,
    point: Points | undefined
): string | undefined {
    const isParetoBarPoint: boolean = series.category === 'Pareto' && series.type !== 'Line';

    if (!isParetoBarPoint || !point) {
        return undefined;
    }
    const categoryLabel: string | undefined = getValueText(point.x);
    const pointValue: string | undefined = getValueText(point.yValue ?? point.y);

    if (!categoryLabel || !pointValue) {
        return undefined;
    }
    return (categoryLabel + ', ' + ((series?.name ?? 'value').toLowerCase()) + ': ' + pointValue + '.');
}

/**
 * Builds an aria-label for standard Column and Bar points.
 *
 * Pareto columns are excluded because they use Pareto-specific label formatting.
 * A label is returned only when both category and point value are available.
 *
 * @param {SeriesProperties} series - The Column or Bar series.
 * @param {Points | undefined} point - The Column or Bar point.
 * @returns {string | undefined} The Column or Bar point aria-label, or undefined when the series is not a standard Column/Bar or required data is missing.
 *
 * @private
 */
function getColumnBarLabel(
    series: SeriesProperties,
    point: Points | undefined
): string | undefined {
    const isStandardColumnOrBarSeries: boolean =
        series?.category !== 'Pareto' &&
        (series?.type === 'Column' || series?.type === 'Bar');

    if (!isStandardColumnOrBarSeries || !point) {
        return undefined;
    }

    const categoryLabel: string | undefined = getValueText(point.x);
    const pointValue: string | undefined = getValueText(point.yValue ?? point.y);
    if (!categoryLabel || !pointValue) {
        return undefined;
    }
    return (categoryLabel + ': ' + pointValue + (series?.name ? ', ' + series.name : ''));
}

/**
 * Determines whether a rendered series path should be hidden from assistive technologies.
 *
 * Scatter paths are hidden because their accessible labels are provided by marker elements.
 * Decorative BoxAndWhisker paths such as stem, whisker, median, and mean are hidden because
 * the BoxPath carries the complete accessible summary for the data point.
 *
 * @param {SeriesProperties | undefined} series - The series associated with the path.
 * @param {string} pathId - The SVG path id.
 * @returns {boolean} True when the path should be aria-hidden; otherwise false.
 * @private
 */
export function shouldHideSeriesPathFromAccessibility(
    series: SeriesProperties | undefined,
    pathId: string
): boolean {
    const isBoxAndWhiskerSeries: boolean = series?.type === 'BoxAndWhisker';
    const isBoxAndWhiskerDecorativePath: boolean = isBoxAndWhiskerSeries &&
        (pathId.includes('_StemPath') || pathId.includes('_WhiskerPath') || pathId.includes('_MedianPath') || pathId.includes('_MeanPath'));
    return series?.type === 'Scatter' || isBoxAndWhiskerDecorativePath;
}

/**
 * Resolves the aria-label for a series group.
 *
 * If a custom accessibility ariaLabel is provided on the series, that label is used.
 * Otherwise, a generic series group label is generated.
 *
 * @param {SeriesGroupAriaLabelParams} params - Parameters used to resolve the series group aria-label.
 * @returns {string} The resolved series group aria-label.
 * @private
 */
export function seriesGroupAriaLabel({
    series,
    seriesIndex,
    totalSeriesCount
}: SeriesGroupAriaLabelParams): string {
    if (series?.accessibility?.ariaLabel) {
        return series.accessibility.ariaLabel;
    }
    return getGenericSeriesGroupAriaLabel({
        series,
        seriesIndex,
        totalSeriesCount
    });
}

/**
 * Resolves the aria-label for a rendered series path.
 *
 * Chart-specific label builders are attempted first for BoxAndWhisker, Histogram,
 * Waterfall, financial, Pareto, and Column/Bar series. If no chart-specific label
 * can be built, a custom series accessibility ariaLabel is used when available;
 * otherwise, a generic series path label is returned.
 *
 * @param {SeriesAccessibilityLabelParams} params - Parameters used to resolve the path aria-label.
 * @returns {string | undefined} The resolved series path aria-label, or undefined when no label can be generated.
 * @private
 */
export function accessibilityLabel({
    series,
    point,
    pathId,
    seriesIndex,
    totalSeriesCount
}: SeriesAccessibilityLabelParams): string | undefined {
    if (series.type === 'BoxAndWhisker') {
        const boxAndWhiskerLabel: string | undefined = getBoxAndWhiskerLabel(series, point, pathId);
        if (boxAndWhiskerLabel) {
            return boxAndWhiskerLabel;
        }
    }

    if (series.type === 'Histogram') {
        const histogramLabel: string | undefined = getHistogramLabel(series, point, pathId);
        if (histogramLabel) {
            return histogramLabel;
        }
    }

    if (series.type === 'Waterfall') {
        const waterfallLabel: string | undefined = getWaterfallLabel(series, point, pathId);
        if (waterfallLabel) {
            return waterfallLabel;
        }
    }

    const financialLabel: string | undefined = getFinancialLabel(series, point);
    if (financialLabel) {
        return financialLabel;
    }

    const paretoBarLabel: string | undefined = getParetoBarLabel(series, point);
    if (paretoBarLabel) {
        return paretoBarLabel;
    }

    const columnBarLabel: string | undefined = getColumnBarLabel(series, point);
    if (columnBarLabel) {
        return columnBarLabel;
    }

    if (series.accessibility?.ariaLabel) {
        return series.accessibility.ariaLabel;
    }

    return getGenericSeriesPathAriaLabel({
        series,
        seriesIndex,
        totalSeriesCount
    });
}
