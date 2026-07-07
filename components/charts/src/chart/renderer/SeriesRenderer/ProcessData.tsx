import { DataManager, DataUtil, Query } from '@syncfusion/react-data';
import { useData } from '../../common/data';
import { isNullOrUndefined, extend } from '@syncfusion/react-base';
import { ChartSeriesType, EmptyPointMode, IndicatorsType } from '../../base/enum';
import { findSeriesCollection, firstToLowerCase, isRectangularSeriesType, setRange, calculateVisiblePoints } from '../../utils/helper';
import { refreshAxisLabel } from '../AxesRenderer/AxisRender';
import { Chart, ChartIndicatorSettings, ChartTrendlineModel, Points, SeriesProperties } from '../../chart-area/chart-interfaces';
import { initDataSource } from './TrendlinesRenderer';
import HistogramSeriesRenderer from './HistogramSeriesRenderer';
import { performCumulativeCalculation } from './ParetoSeriesRenderer';
import { indicatorModules } from '../IndicatorsRenderer/ChartIndicatorsBase';
import { ChartRangeColorProps } from '../../base/interfaces';

/**
 * Constants used in the ProcessData component
 */
const PROCESS_DATA_CONSTANTS: {
    readonly DEFAULT_PADDING: number;
    readonly CHART_AREA_PADDING: number;
    readonly COLLISION_PADDING: number;
    readonly MAX_RENDER_COUNT: number;
    readonly DEFAULT_RENDER_COUNT: number;
    readonly INFINITY_VALUE: number;
    readonly NEGATIVE_INFINITY_VALUE: number;
} = {
    DEFAULT_PADDING: 5,
    CHART_AREA_PADDING: 10,
    COLLISION_PADDING: 5,
    MAX_RENDER_COUNT: 100,
    DEFAULT_RENDER_COUNT: 0,
    INFINITY_VALUE: Infinity,
    NEGATIVE_INFINITY_VALUE: -Infinity
} as const;

type DataRecord = Record<string, string | number | boolean | Date | null>;

/**
 * Handles the success event when the DataManager fetches data for the circular 3D series.
 *
 * @private
 * @param {Object} dataObject - Specifies the series data object.
 * @param {Object} dataObject.result - The actual data.
 * @param {number} dataObject.count - The count of data.
 * @param {SeriesProperties} [series] - Optional series instance to be updated with fetched data.
 * @param {ChartIndicatorSettings[]} [chartIndicators] - Optional array of chart technical indicators.
 * @param {ChartRangeColorProps[]} [rangeColor] - Optional range color mapping configurations.
 * @param {SeriesProperties[]} [visibleSeries] - Optional visible series array used for range color processing.
 * @returns {void}
 */
const dataManagerSuccess: (dataObject: { result: Object; count: number }, series?: SeriesProperties
    , chartIndicators?: ChartIndicatorSettings[], rangeColor?: ChartRangeColorProps[], visibleSeries?: SeriesProperties[]) => void =
    (dataObject: { result: Object; count: number }, series?: SeriesProperties, chartIndicators?: ChartIndicatorSettings[]
        , rangeColor?: ChartRangeColorProps[], visibleSeries?: SeriesProperties[]) => {
        [series].filter(Boolean).forEach((seriesArray: SeriesProperties | undefined) => {
            // Skip if we already have points data
            if (seriesArray && (!seriesArray.points || seriesArray.points.length === 0)) {
                seriesArray.currentViewData = dataObject.count ? dataObject.result : [];
                processJsonData(seriesArray, rangeColor, visibleSeries);
                seriesArray.recordsCount = dataObject.count;
                seriesArray.currentViewData = null;
            }
            if (seriesArray && seriesArray.trendlines && seriesArray.category !== 'TrendLine') {
                for (const trendline of seriesArray.trendlines) {
                    if (trendline.visible) {
                        trendline.points = seriesArray.points;
                        initDataSource(trendline);
                    }
                }
            }
            refreshTechnicalIndicator(seriesArray, chartIndicators);
        });
    };

/**
 * Find and refresh the technical indicator associated with a series.
 *
 * @private
 * @param {SeriesProperties} [series] - The source series or indicator instance.
 * @param {ChartIndicatorSettings[]} [chartIndicators] - Global indicator list to search.
 * @returns {void}
 */
function refreshTechnicalIndicator(series: SeriesProperties | undefined, chartIndicators?: ChartIndicatorSettings[]): void {
    if (chartIndicators?.length) {
        if (series && series?.category !== 'Indicator') {
            for (const indicator of chartIndicators) {
                if (indicator.seriesName !== '' && indicator.seriesName === series?.name) {
                    setDataSource(series, indicator);
                }
            }
        }
    }
}

/**
 * Processes data for the series.
 *
 * @hidden
 * @param {SeriesProperties} series - The chart series object to process.
 * @param {ChartRangeColorProps[]} [rangeColor] - Optional range color mapping configurations.
 * @param {SeriesProperties[]} [visibleSeries] - Optional visible series array used for range color processing.
 * @returns {void}
 */
export const processJsonData: (series: SeriesProperties, rangeColor?: ChartRangeColorProps[]
    , visibleSeries?: SeriesProperties[]) => void = (series: SeriesProperties, rangeColor?: ChartRangeColorProps[]
    , visibleSeries?: SeriesProperties[]) => {
    let i: number = 0;
    const point: Points = createPoint();
    const xName: string = series.xField as string;
    const textMappingName: string = series.marker?.dataLabel?.labelField ?
        series.marker.dataLabel.labelField : '';
    if (series) {
        if (series.category === 'Pareto') {
            series.currentViewData = extend([], series.currentViewData as Object, undefined, true) as Object[];
            if (series.type === 'Line') {
                series.currentViewData = performCumulativeCalculation(series.currentViewData, series);
            }
        }
    }
    // Check if currentViewData exists and is an array before accessing length
    if (!series.currentViewData || !Array.isArray(series.currentViewData)) {
        series.points = [];
        series.xMin = PROCESS_DATA_CONSTANTS.INFINITY_VALUE;
        series.xMax = PROCESS_DATA_CONSTANTS.NEGATIVE_INFINITY_VALUE;
        series.yMin = PROCESS_DATA_CONSTANTS.INFINITY_VALUE;
        series.yMax = PROCESS_DATA_CONSTANTS.NEGATIVE_INFINITY_VALUE;
        series.sizeMax = PROCESS_DATA_CONSTANTS.NEGATIVE_INFINITY_VALUE;
        return; // Exit early if no valid data
    }

    const len: number = (series.currentViewData as object[]).length;
    series.points = [];
    series.xMin = PROCESS_DATA_CONSTANTS.INFINITY_VALUE;
    series.xMax = PROCESS_DATA_CONSTANTS.NEGATIVE_INFINITY_VALUE;
    series.yMin = PROCESS_DATA_CONSTANTS.INFINITY_VALUE;
    series.yMax = PROCESS_DATA_CONSTANTS.NEGATIVE_INFINITY_VALUE;
    series.sizeMax = PROCESS_DATA_CONSTANTS.NEGATIVE_INFINITY_VALUE;
    getSeriesType(series);

    // Check if xAxis exists before accessing its properties
    if (!series.xAxis) {
        return; // Exit if no xAxis is defined
    }

    // Process points based on axis type
    if (series.xAxis.valueType === 'Category') {
        while (i < len) {
            pushCategoryPoint(series, point, i, xName, textMappingName, rangeColor, visibleSeries);
            i++;
        }
    } else if (series.xAxis.valueType === 'DateTime') {
        while (i < len) {
            pushDateTimePoint(series, point, i, xName, textMappingName, rangeColor, visibleSeries);
            i++;
        }
    } else {
        while (i < len) {
            pushDoublePoint(series, point, i, xName, textMappingName, rangeColor, visibleSeries);
            i++;
        }
    }
    if (series.type === 'Histogram') {
        HistogramSeriesRenderer.processInternalData(series);
    }
};

/**
 * Finds the type of the series.
 *
 * @private
 * @param {SeriesProperties} series - The series object whose type needs to be identified.
 * @returns {void}
 */
const getSeriesType: (series: SeriesProperties) => void = (series: SeriesProperties): void => {
    [series].filter(Boolean).forEach((s: SeriesProperties) => {
        const type: string = 'XY';
        s.seriesType = type;
        const seriesType: string = series.type as string;
        if (seriesType) {
            switch (seriesType) {
            case 'HiloOpenClose':
            case 'Candle':
                s.seriesType = 'HighLowOpenClose';
                break;
            case 'Hilo':
            case 'RangeArea':
            case 'RangeStepArea':
            case 'SplineRangeArea':
            case 'RangeColumn':
            case 'PolarRangeColumn':
            case 'RadarRangeColumn':
                s.seriesType = 'HighLow';
                break;
            case 'BoxAndWhisker':
                s.seriesType = 'BoxPlot';
                break;
            default:
                s.seriesType = 'XY';
            }
        }
        series.seriesType = s.seriesType;
        if (series.trendlines && series.trendlines.length > 0) {
            series.trendlines.forEach((trendline: ChartTrendlineModel) => {
                if (trendline.targetSeries) {
                    trendline.targetSeries.seriesType = s.seriesType;
                }
            });
        }

    });
};


/**
 * Initialize the indicator's data from a source series and invoke its module initializer.
 *
 * @private
 * @param {SeriesProperties | undefined} series - Optional source series supplying x/y data and points.
 * @param {ChartIndicatorSettings} indicator - The indicator model to initialize.
 * @returns {void}
 */
function setDataSource(series: SeriesProperties | undefined, indicator: ChartIndicatorSettings): void {
    if (series) {
        indicator.xData = series.xData ?? [];
        indicator.yData = series.yData ?? [];
        indicator.points = series.points ?? [];
    }

    const rawType: IndicatorsType | undefined = indicator.type as IndicatorsType | undefined;
    if (!rawType || !indicator.visible) {
        return;
    }

    const moduleKey: string = `${firstToLowerCase(rawType)}IndicatorModule` as string;
    const maybeModule: {
        initDataSource?: ((ind: ChartIndicatorSettings) => void) | undefined;
    } | undefined = indicatorModules[moduleKey as string] as {
        initDataSource?: (ind:
        ChartIndicatorSettings) => void
    } | undefined;

    if (maybeModule && typeof maybeModule.initDataSource === 'function') {
        maybeModule.initDataSource(indicator);
    }

    // chart.visibleSeriesCount += this.targetSeries.length; // preserved for future use
}

/**
 * Refreshes the data manager for the series.
 *
 * @param {SeriesProperties} series - The series needing source data fetch/refresh.
 * @param {ChartIndicatorSettings[]} [chartIndicators] - Optional array of chart technical indicators.
 * @param {ChartRangeColorProps[]} [rangeColor] - Optional range color mapping configurations.
 * @param {SeriesProperties[]} [visibleSeries] - Optional visible series array used for range color processing.
 * @returns {void}
 */
export const refreshDataManager: (series: SeriesProperties, chartIndicators?: ChartIndicatorSettings[]
    , rangeColor?: ChartRangeColorProps[], visibleSeries?: SeriesProperties[]) => void = (series:
SeriesProperties, chartIndicators?: ChartIndicatorSettings[], rangeColor?: ChartRangeColorProps[]
, visibleSeries?: SeriesProperties[]): void => {
    if (series.points && series.points.length > 0 && (series.dataSource instanceof DataManager)) {
        return;
    }

    const dataSource: Object | DataManager | undefined = series.dataSource;

    // Handle local array data source directly
    if (Array.isArray(dataSource) && !(dataSource instanceof DataManager) && !series.query) {
        dataManagerSuccess({ result: dataSource, count: dataSource.length }, series, chartIndicators, rangeColor, visibleSeries);
        triggerChartRerender(series);
        return;
    }

    // Handle remote data source using DataManager
    if (series.dataModule && !series.dataFetchRequested) {
        let dataQuery: Query;

        series.dataFetchRequested = true;

        if (typeof series.dataModule.generateQuery === 'function') {
            dataQuery = series.dataModule.generateQuery();
        } else if (series.query instanceof Query) {
            dataQuery = series.query;
        } else {
            dataQuery = new Query();
        }

        if (dataQuery instanceof Query && typeof dataQuery.requiresCount === 'function') {
            dataQuery = dataQuery.requiresCount();
        }

        // Execute the query
        if (typeof series.dataModule.dataManager?.executeQuery === 'function') {
            const dataPromise: Promise<Object> = series.dataModule.dataManager.executeQuery(dataQuery);

            dataPromise
                .then((e: Object) => {
                    // Reset the request flag after data is received
                    series.dataFetchRequested = false;

                    // Process data only if points don't already exist
                    if (!series.points || series.points.length === 0) {
                        dataManagerSuccess(e as { result: Object; count: number }, series);

                        if (series.chart?.element) {
                            triggerChartRerender(series);
                        }
                    }
                });
        }
    }
};

const dataCache: {
    previousSignatures: Record<string, string>;
    pendingRenders: Record<string, boolean>;
    renderCount: Record<string, number>;
} = {
    previousSignatures: {} as Record<string, string>,
    pendingRenders: {} as Record<string, boolean>,
    renderCount: {} as Record<string, number>
};

export const triggerChartRerender: (series: SeriesProperties) => void = (series: SeriesProperties): void => {
    if (!series.chart?.triggerRemeasure) {
        return;
    }

    const chartId: string = series.chart.element?.id ||
            `chart-${series.name}-${Math.random().toString(36).substr(2, 9)}`;

    dataCache.renderCount[chartId as string] ||= PROCESS_DATA_CONSTANTS.DEFAULT_RENDER_COUNT;

    // Skip update if we don't have points yet
    if (!series.points || series.points.length === 0) {
        return;
    }

    const points: Points[] = series.points;
    const dataSignature: string = JSON.stringify({
        count: points.length,
        first: points[0]?.xValue,
        last: points[points.length - 1]?.xValue,
        yMin: series.yMin,
        yMax: series.yMax,
        xMin: series.xMin,
        xMax: series.xMax
    });

    if (dataSignature !== dataCache.previousSignatures[chartId as string] &&
            !dataCache.pendingRenders[chartId as string]) {

        dataCache.previousSignatures[chartId as string] = dataSignature;
        dataCache.pendingRenders[chartId as string] = true;
        dataCache.renderCount[chartId as string]++;

        if (series.chart?.triggerRemeasure) {
            series.chart.triggerRemeasure();
        }
        dataCache.pendingRenders[chartId as string] = false;
    }
};


/**
 * Creates and returns a new data point with default attribute values.
 *
 * @returns {Points} A new data point object with default values.
 * @private
 */
export function createPoint(): Points {
    return {
        x: {},
        y: {},
        visible: true,
        text: '',
        tooltip: '',
        color: '',
        symbolLocations: null,
        xValue: null,
        yValue: null,
        index: 0,
        regions: null,
        percentage: null,
        isEmpty: false,
        regionData: null,
        minimum: 0,
        maximum: 0,
        interior: '',
        series: {},
        isPointInRange: true,
        marker: {
            visible: false
        },
        size: {},
        originalY: 0,
        errorBarColor: '',
        textValue: '',
        /** Specifies the vertical error value for the point. */
        verticalError: 1,
        /** Specifies the horizontal error value for the point. */
        horizontalError: 1,
        /** Specifies the error value of the point. */
        error: '',
        high: {},
        low: {},
        open: {},
        close: {}
    };
}

/**
 * Processes and manages chart series data.
 *
 * @param {SeriesProperties[]} chartSeries - An array of SeriesProperties objects to be processed.
 * @param {ChartIndicatorSettings[]} [chartIndicators] - Optional array of chart technical indicators.
 * @param {ChartRangeColorProps[]} [rangeColor] - Optional range color mapping configurations.
 * @returns {SeriesProperties[]} - Returns the processed series array.
 */
export const processChartSeries: (chartSeries: SeriesProperties[]
    , chartIndicators?: ChartIndicatorSettings[], rangeColor?: ChartRangeColorProps[]) =>
SeriesProperties[] = (chartSeries: SeriesProperties[]
    , chartIndicators?: ChartIndicatorSettings[], rangeColor?: ChartRangeColorProps[]) => {
    const visibleSeries: SeriesProperties[] = chartSeries;

    /**
     * Processes the data for each visible series.
     *
     * @returns {void}
     */
    const processData: () => void = () => {
        for (let i: number = 0, len: number = visibleSeries.length; i < len; i++) {
            const series: SeriesProperties = visibleSeries[i as number];

            // Skip series that are already completely processed
            const isDataManager: boolean = series.dataSource as boolean &&
                typeof series.dataSource === 'object' &&
                !Array.isArray(series.dataSource) &&
                'executeQuery' in (series.dataSource as Object[]);

            // Skip if already processed and has points
            if (series.points && series.points.length > 0 && isDataManager) {
                refreshAxisLabel(series);
                continue;
            }

            // Initialize data module for the series
            if (series.category !== 'Indicator' && series.category !== 'TrendLine') {
                initializeDataModule(series, chartIndicators, rangeColor);
            }
        }
    };

    /**
     * Initializes the data module for the series and refreshes data management.
     *
     * @param {SeriesProperties} series - The series for which the data module is initialized.
     * @param {ChartIndicatorSettings[]} [chartIndicators] - Optional array of chart technical indicators.
     * @param {ChartRangeColorProps[]} [rangeColor] - Optional range color mapping configurations.
     * @returns {void}
     */
    const initializeDataModule: (series: SeriesProperties, chartIndicators?: ChartIndicatorSettings[]
        , rangeColor?: ChartRangeColorProps[]) => void =
    (series: SeriesProperties, chartIndicators?: ChartIndicatorSettings[], rangeColor?: ChartRangeColorProps[]) => {
        series.xData = [];
        series.yData = [];
        const dataSource: Object | DataManager | undefined = series.dataSource;
        series.dataModule = useData(dataSource, series.query as Query);
        series.points = [];
        refreshDataManager(series, chartIndicators, rangeColor, visibleSeries);
    };


    processData();
    return visibleSeries;
};

/**
 * Pushes a category point to the data collection.
 *
 * @param {SeriesProperties} series - The series model
 * @param {Points} point - The point to be pushed.
 * @param {number} index - The index of the point.
 * @param {string} xName - The name of the x-coordinate.
 * @param {string} textMappingName - The name of dataLabel mapping.
 * @param {ChartRangeColorProps[]} [rangeColor] - Optional range color mapping configurations.
 * @param {SeriesProperties[]} [visibleSeries] - Optional visible series array used for range color processing.
 * @returns {void}
 */
export const pushCategoryPoint: (series: SeriesProperties, point: Points, index: number, xName: string,
    textMappingName: string, rangeColor?: ChartRangeColorProps[], visibleSeries?: SeriesProperties[]) => void =
(series: SeriesProperties, point: Points, index: number, xName: string, textMappingName: string,
 rangeColor?: ChartRangeColorProps[], visibleSeries?: SeriesProperties[]): void => {
    point = dataPoint(index, textMappingName, xName, series, rangeColor, visibleSeries);
    pushCategoryData(point, point.x as string, series, index);
    pushData(point, index, series);
    setEmptyPoint(point, series, index);
    rangeColorsInterior(point, series, rangeColor, visibleSeries as SeriesProperties[]);
};
/**
 * Pushes category data into the series points.
 *
 * @param {Points} point - The point to which category data will be pushed.
 * @param {string} pointX - The x-value of the point.
 * @param {SeriesProperties} series - The series object.
 * @param {number} index - The index of the point.
 * @returns {void}
 * @private
 */
export const pushCategoryData: (point: Points, pointX: string, series: SeriesProperties, index: number) => void =
(point: Points,  pointX: string, series: SeriesProperties, index: number): void => {
    if (!series.xAxis.indexed) {
        if (series.xAxis.indexLabels && (series.xAxis.indexLabels as Record<string, number>)[pointX as string] === undefined) {
            (series.xAxis.indexLabels as Record<string, number>)[pointX as string] = series.xAxis.labels.length;
            series.xAxis.labels.push(pointX as string);
        }
        point.xValue = (series.xAxis.indexLabels as Record<string, number>)[pointX as string];
    } else {
        if (series.xAxis.labels[index as number]) {
            series.xAxis.labels[index as number] += ', ' + pointX;
        }
        else {
            series.xAxis.labels.push(pointX);
        }
        point.xValue = index;
    }
};

/**
 * Groups points by their color and stores them in the series' range color points collection.
 * Only applies to supported series types (Column, Bar, Scatter, Bubble) with range color mapping.
 *
 * @private
 * @param {Points} point - The data point to be grouped by color.
 * @param {SeriesProperties} series - The series object containing the range color points collection.
 * @param {ChartRangeColorProps[]} [rangeColor] - Optional range color mapping configurations.
 * @param {SeriesProperties[]} [visibleSeries] - Optional visible series array used to validate supported types.
 * @returns {void}
 */
function rangeColorsInterior(point: Points, series: SeriesProperties, rangeColor?: ChartRangeColorProps[]
    , visibleSeries?: SeriesProperties[]): void {
    if (visibleSeries && rangeColor && rangeColor.length > 0
        && visibleSeries.length === 1 &&
        (visibleSeries[0].type === 'Column' || visibleSeries[0].type === 'Bar' ||
            visibleSeries[0].type === 'Scatter' || visibleSeries[0].type === 'Bubble')) {
        series.rangeColorPoints = series.rangeColorPoints || {};
        const key: string = String(point.interior);
        if (!series.rangeColorPoints[key as string]) {
            series.rangeColorPoints[key as string] = [];
        }
        series.rangeColorPoints[key as string].push(point);
    }
}
/**
 * Pushes a DateTime point to the data collection.
 *
 * @param {SeriesProperties} series - The series object
 * @param {Points} point -The point to be pushed.
 * @param {number} index -The index of the point.
 * @param {string} xName -The name of the x-coordinate.
 * @param {string} textMappingName - The name of dataLabel mapping.
 * @param {ChartRangeColorProps[]} [rangeColor] - Optional range color mapping configurations.
 * @param {SeriesProperties[]} [visibleSeries] - Optional visible series array used for range color processing.
 * @returns {void}
 * @private
 */
export const pushDateTimePoint: (series: SeriesProperties, point: Points, index: number, xName: string
    , textMappingName: string, rangeColor?: ChartRangeColorProps[], visibleSeries?: SeriesProperties[]) => void =
(series: SeriesProperties, point: Points, index: number, xName: string, textMappingName: string
    , rangeColor?: ChartRangeColorProps[], visibleSeries?: SeriesProperties[]): void => {
    point = dataPoint(index, textMappingName as string, xName, series, rangeColor, visibleSeries);
    if (!isNullOrUndefined(point.x) && point.x !== '') {
        point.x = new Date(
            (DataUtil.parse as Required<typeof DataUtil.parse>).parseJson({ val: point.x }).val
        );
        point.xValue = Date.parse(point.x.toString());
        pushData(point, index, series);
        setEmptyPoint(point, series, index);
        rangeColorsInterior(point, series, rangeColor, visibleSeries as SeriesProperties[]);
    } else {
        point.visible = false;
    }
};

/**
 * Pushes a double point to the data collection.
 *
 * @param {SeriesProperties} series - The series to which the point belongs.
 * @param {Points} point - The point to be pushed.
 * @param {number} index - The index of the point.
 * @param {string} xName - The name of the x-coordinate.
 * @param {string} textMappingName - The name of dataLabel mapping.
 * @param {ChartRangeColorProps[]} [rangeColor] - Optional range color mapping configurations.
 * @param {SeriesProperties[]} [visibleSeries] - Optional visible series array used for range color processing.
 * @returns {void}
 * @private
 */
export const pushDoublePoint: (series: SeriesProperties, point: Points, index: number, xName: string
    , textMappingName?: string, rangeColor?: ChartRangeColorProps[], visibleSeries?: SeriesProperties[]) => void =
    (series: SeriesProperties, point: Points, index: number, xName: string, textMappingName?: string
        , rangeColor?: ChartRangeColorProps[], visibleSeries?: SeriesProperties[]): void => {
        point = dataPoint(index, textMappingName as string, xName, series, rangeColor, visibleSeries);
        point.xValue = point.x as number;
        pushData(point, index, series);
        setEmptyPoint(point, series, index);
        rangeColorsInterior(point, series, rangeColor, visibleSeries as SeriesProperties[]);
    };

/**
 * Retrieves the data point at the specified index with the given text mapping name and x-name.
 *
 * @param {number} i - The index of the data point to retrieve.
 * @param {string} textMappingName - The name of dataLabel mapping.
 * @param {string} xName - The name used for the x-axis.
 * @param {SeriesProperties} series - The series object containing points and data.
 * @param {ChartRangeColorProps[]} [rangeColor] - Optional range color mapping configurations.
 * @param {SeriesProperties[]} [visibleSeries] - Optional visible series array used for range color processing.
 * @returns {Points} - The data point at the specified index.
 * @private
 */
const dataPoint: (i: number, textMappingName: string, xName: string, series: SeriesProperties
    , rangeColor?: ChartRangeColorProps[], visibleSeries?: SeriesProperties[]) => Points = (i: number, textMappingName: string
    , xName: string, series: SeriesProperties, rangeColor?: ChartRangeColorProps[], visibleSeries?: SeriesProperties[]) => {
    series.points[i as number] = createPoint();
    const point: Points = series.points[i as number];
    const currentViewData: Object = (series.currentViewData as DataRecord[])[i as number];
    point.x = getObjectValueByMappingString(xName, currentViewData as DataRecord) as Object;
    point.y = getObjectValueByMappingString(series.yField as string, currentViewData as DataRecord) as Object;
    point.size = getObjectValueByMappingString(series.sizeField as string, currentViewData as DataRecord) as string;
    point.tooltip = getObjectValueByMappingString((series.tooltipField as string),
                                                  currentViewData as DataRecord) as string;
    point.text = getObjectValueByMappingString(textMappingName, currentViewData as DataRecord) as string;
    point.interior = getObjectValueByMappingString(series.colorField as string,
                                                   currentViewData as DataRecord) as string;
    if (series.errorBar?.visible) {
        point.verticalError = typeof series.errorBar.verticalError == 'string' ? getObjectValueByMappingString(series.errorBar.verticalError, currentViewData as DataRecord) as string : series.errorBar.verticalError as number;
        point.horizontalError = typeof series.errorBar.horizontalError == 'string' ? getObjectValueByMappingString(series.errorBar.horizontalError, currentViewData as DataRecord) as string : series.errorBar.horizontalError as number;
        point.errorBarColor = typeof series.errorBar.errorBarColorField == 'string' ? getObjectValueByMappingString(series.errorBar.errorBarColorField, currentViewData as DataRecord) as string : String(series.errorBar?.errorBarColorField);
    }
    point.high = getObjectValueByMappingString(series.high as string, currentViewData as DataRecord) as string;
    point.low = getObjectValueByMappingString(series.low as string, currentViewData as DataRecord) as string;
    point.open = getObjectValueByMappingString(series.open as string, currentViewData as DataRecord) as string;
    point.close = getObjectValueByMappingString(series.close as string, currentViewData as DataRecord) as string;
    point.volume =  getObjectValueByMappingString(series.volume as string, currentViewData as DataRecord) as string;
    if (rangeColor && isAdvancedColorSupported(series, rangeColor, visibleSeries as SeriesProperties[])) {
        series.rangeColorName = series.colorField?.length as number > 0 ? series.colorField : series.yField;
        point.colorValue = getObjectValueByMappingString(series.rangeColorName  as string, currentViewData as DataRecord) as number;
        point.interior = getPointFillColor(point.interior, point.colorValue, rangeColor);
    }
    return point;
};

/**
 * Determines if the series supports advanced color mapping based on series type and range color configuration.
 * Caches the result in the series object for subsequent calls.
 *
 * @private
 * @param {SeriesProperties} series - The series object to check for advanced color support.
 * @param {ChartRangeColorProps[]} rangeColor - The range color mapping configurations.
 * @param {SeriesProperties[]} visibleSeries - The array of visible series used to validate supported types.
 * @returns {boolean} - Returns true if advanced color is supported, false otherwise.
 */
function isAdvancedColorSupported(series: SeriesProperties
    , rangeColor: ChartRangeColorProps[], visibleSeries: SeriesProperties[]): boolean {
    if (isNullOrUndefined(series.isAdvancedColor)) {
        if (rangeColor && rangeColor.length > 0 &&
            (visibleSeries[0].type === 'Column' || visibleSeries[0].type === 'Bar' ||
                visibleSeries[0].type === 'Scatter' || visibleSeries[0].type === 'Bubble')) {
            series.isAdvancedColor = true;
        } else {
            series.isAdvancedColor = false;
        }
    }
    return series.isAdvancedColor;
}

/**
 * Retrieves the fill color for a point based on its value and the applicable range color mapping.
 * If multiple colors are defined in the range, interpolates the color; otherwise, uses the single defined color.
 *
 * @private
 * @param {string} pointFill - The default fill color for the point.
 * @param {number} value - The numeric value used to determine the applicable color range.
 * @param {ChartRangeColorProps[]} rangeColor - The array of range color mapping configurations.
 * @returns {string} - The color for the point, either from range mapping or the default fill color.
 */
function getPointFillColor(pointFill: string, value: number, rangeColor: ChartRangeColorProps[]): string {
    let color: string = pointFill;
    if (value && rangeColor && rangeColor.length > 0) {
        for (const rangeMap of rangeColor) {
            if (rangeMap.start && rangeMap.end && value >= rangeMap.start && value <= rangeMap.end) {
                if (rangeMap.fill && rangeMap.fill !== '') {
                    color = rangeMap.fill as string;
                }
            }
        }
    }
    return color;
}

/**
 * Sets the empty point values.
 *
 * @param {Points} point - The point to be set.
 * @param {number} i - The index of the point.
 * @param {SeriesProperties} series - The series to which the point belongs.
 * @private
 * @returns {void}
 */
export const pushData: (point: Points, i: number, series: SeriesProperties) => void =
(point: Points, i: number, series: SeriesProperties): void => {
    point.index = i;
    point.yValue = point.y as number;
    point.series = series;
    series.xMin = Math.min(series.xMin, point.xValue as number);
    series.xMax = Math.max(series.xMax, point.xValue as number);
    series.xData.push(point.xValue as number);
};

const getObjectValueByMappingString: (mappingName: string, data: DataRecord) => string | number | boolean | Date | null = (
    mappingName: string,
    data: DataRecord
) =>
    data && Object.prototype.hasOwnProperty.call(data, mappingName)
        ? data[mappingName as string]
        : null;

export const setEmptyPoint: (point: Points, series: SeriesProperties, i: number) => void =
(point: Points, series: SeriesProperties, i: number): void => {
    if (!findVisibility(point, series)) {
        point.visible = true;
        return;
    }
    point.isEmpty = true;
    const mode: EmptyPointMode | undefined = point.isPointInRange ? series.emptyPointSettings?.mode : 'Drop';
    switch (mode) {
    case 'Zero':
        point.visible = true;
        point.y = point.yValue = series.yData[i as number] = 0;
        if (series.seriesType.indexOf('HighLow') > -1) {
            point.high = point.low = 0;
            if (series.seriesType.indexOf('HighLowOpenClose') > -1) {
                point.open = point.close = 0;
            }
        } else {
            point.y = point.yValue = series.yData[i as number] = 0;
        }
        break;
    case 'Average':
        if (series.seriesType.indexOf('HighLow') > -1) {
            point.high = (isNullOrUndefined(point.high) || isNaN(+point.high)) ?
                getAverage(series.high as string, i as number, series, series.currentViewData as Object) : point.high;
            point.low = (isNullOrUndefined(point.low) || isNaN(+point.low)) ?
                getAverage(series.low as string, i as number, series, series.currentViewData as Object) : point.low;
            if (series.seriesType.indexOf('HighLowOpenClose') > -1) {
                point.open = (isNullOrUndefined(point.open) || isNaN(+point.open)) ?
                    getAverage(series.open as string, i as number, series, series.currentViewData as Object) : point.open;
                point.close = (isNullOrUndefined(point.close) || isNaN(+point.close)) ?
                    getAverage(series.close as string, i as number, series, series.currentViewData as Object) : point.close;
            }
        } else {
            point.y = point.yValue = series.yData[i as number] =
                getAverage(series.yField as string, i as number, series, series.currentViewData as Object);
        }
        point.visible = true;
        break;
    case 'Drop':
    case 'Gap':
        series.yData[i as number] = PROCESS_DATA_CONSTANTS.DEFAULT_RENDER_COUNT;
        point.visible = false;
        break;
    }
};

/**
 * Gets the average value of a member in the specified data array or current view data.
 *
 * @param {string} member - The member whose average is to be calculated.
 * @param {number} i - The index of the data point.
 * @param {SeriesProperties} series - The series object containing currentViewData.
 * @param {Object} data - The data array from which to calculate the average. Defaults to the current view data.
 * @returns {number} - The average value of the specified member.
 */
export const getAverage: (member: string, i: number, series: SeriesProperties, data: Object) =>
number = (member: string, i: number, series: SeriesProperties, data: any): number => {
    data = series.currentViewData as Object;
    const previous: number = data[i - 1] ? (data[i - 1][member as string]) : PROCESS_DATA_CONSTANTS.DEFAULT_RENDER_COUNT;
    const next: number = data[i + 1] ? (data[i + 1][member as string]) : PROCESS_DATA_CONSTANTS.DEFAULT_RENDER_COUNT;
    return (previous + next) / 2;
};

const findVisibility: (point: Points, series: SeriesProperties) => boolean = (point: Points, series: SeriesProperties): boolean => {
    const type: string = series.seriesType;
    switch (type) {
    case 'XY':
        setXYMinMax(point.yValue as number, series);
        series.yData.push(point.yValue as number);
        if (series.type === 'Bubble') {
            series.sizeMax = Math.max(series.sizeMax, (isNullOrUndefined(point.size) || isNaN(+point.size)) ?
                series.sizeMax : point.size as number);
        }
        return isNullOrUndefined(point.x) || isNullOrUndefined(point.y) || isNaN(+point.y);
    case 'HighLow':
        setHiloMinMax(series, point.high as number, point.low as number);
        return isNullOrUndefined(point.x) || (isNullOrUndefined(point.low) || isNaN(+point.low)) ||
                (isNullOrUndefined(point.high) || isNaN(+point.high));
    case 'HighLowOpenClose':
        setHiloMinMax(series, point.high as number, point.low as number);
        return isNullOrUndefined(point.x) || (isNullOrUndefined(point.low) || isNaN(+point.low)) ||
                (isNullOrUndefined(point.open) || isNaN(+point.open)) || (isNullOrUndefined(point.close) || isNaN(+point.close))
                || (isNullOrUndefined(point.high) || isNaN(+point.high));
    case 'BoxPlot': {
        const rawYValues: number[] = point.y as number[];
        const numericYValues: number[] = Array.isArray(rawYValues)
            ? rawYValues
                .map((value: number) => (typeof value === 'number' ? value : Number(value)))
                .filter((value: number) => Number.isFinite(value)) // Excludes NaN, Infinity, and invalid numeric conversions
            : [];
        if (numericYValues.length === 0 || isNullOrUndefined(point.x)) {
            return true;
        }
        const localMin: number = Math.min(...numericYValues);
        const localMax: number = Math.max(...numericYValues);
        series.yMin = Math.min(series.yMin, localMin);
        series.yMax = Math.max(series.yMax, localMax);
        const valueCount: number = numericYValues.length;
        const mid: number = Math.floor(valueCount / 2);
        const sorted: number[] = [...numericYValues].sort((a: number, b: number) => a - b);
        const median: number =
                valueCount % 2 ? sorted[mid as number] : (sorted[mid - 1] + sorted[mid as number]) / 2;
        point.yValue = median;
        point.y = numericYValues as number[];
        return false;
    }
    default:
        return true;
    }
};

/**
 * Updates the y-axis minimum and maximum values for the given series based on the specified y-value.
 *
 * @private
 * @param {number} yValue - The y value used to determine the min and max for the series.
 * @param {SeriesProperties} series - The series for which the yMin and yMax should be updated.
 * @returns {void}
 */
const setXYMinMax: (yValue: number, series: SeriesProperties) => void = (yValue: number, series: SeriesProperties): void => {
    const isLogAxis: boolean = (series.yAxis.valueType === 'Logarithmic' || series.xAxis.valueType === 'Logarithmic');
    const isNegativeValue: boolean = yValue < 0 || series.yAxis.rangePadding === 'None';
    let seriesMinY: number;
    if (isRectangularSeriesType(series, (series.type as ChartSeriesType).indexOf('100') > -1) && !setRange(series.yAxis)) {
        seriesMinY = ((isLogAxis ? (yValue) : isNegativeValue ? yValue : 0));
    }
    else {
        seriesMinY = yValue;
    }
    series.yMin = isLogAxis ?
        Math.min(series.yMin, (isNullOrUndefined(seriesMinY) || isNaN(seriesMinY) || (seriesMinY === 0) ||
                (seriesMinY.toString() === '0') || (seriesMinY.toString() === '')) ? series.yMin : seriesMinY) :
        Math.min(series.yMin, seriesMinY || series.yMin);
    series.yMax = Math.max(series.yMax, yValue || series.yMax);
};

/**
 * Sets the minimum and maximum values for the high and low values.
 *
 * @param {SeriesProperties} series - The series for which the yMin and yMax should be updated.
 * @param {number} high - The high value used to determine the maximum value.
 * @param {number} low - The low value used to determine the minimum value.
 * @returns {void}
 */
const setHiloMinMax: (series: SeriesProperties, high: number, low: number) => void =
(series: SeriesProperties, high: number, low: number): void => {
    series.yMin = Math.min(series.yMin, Math.min((isNullOrUndefined(low) || isNaN(low)) ?
        series.yMin : low, (isNullOrUndefined(high) || isNaN(high)) ? series.yMin : high));
    series.yMax = Math.max(series.yMax, Math.max((isNullOrUndefined(low) || isNaN(low)) ?
        series.yMax : low, (isNullOrUndefined(high) || isNaN(high)) ? series.yMax : high));
};

/**
 * Retrieves the value of the given mapping name from the data object.
 *
 * @param {string} mappingName - The name of the property to retrieve.
 * @param {Record<string, Object>} data - The object containing key-value pairs.
 * @returns {Object} The value corresponding to the mapping name.
 */
export const getObjectValue: (mappingName: string, data: Record<string, Object>
) => Object = (mappingName: string, data: Record<string, Object>): Object => {
    return data[mappingName as string];
};


/**
 * Calculates the stack values for the chart.
 *
 * @param {Chart} chart - The chart object to calculate stack values for.
 * @returns {void}
 */
export const calculateStackValues: (chart: Chart) => void = (chart: Chart): void => {
    let series: SeriesProperties;
    let isCalculateStacking: boolean = false;

    for (let i: number = 0, len: number = chart.visibleSeries.length; i < len; i++) {
        series = chart.visibleSeries[i as number] as SeriesProperties;

        if (series.visible) {
            series.position = undefined;
            series.rectCount = undefined;
        }

        if (((series.type?.indexOf('Stacking') !== -1) ||
            ( series.drawType && series.drawType.indexOf('Stacking') !== -1)) &&
            !isCalculateStacking) {

            calculateStackedValue(chart);
            isCalculateStacking = true;
        }
    }
};

/**
 * Calculates the stacked value for the chart.
 *
 * @param {Chart} chart - The chart for which the stacked value is calculated.
 * @returns {void}
 */
export const calculateStackedValue: (chart: Chart) => void = (chart: Chart): void => {
    for (const columnItem of chart.columns) {
        for (const item of chart.rows) {
            calculateStackingValues(findSeriesCollection(columnItem, item, true), chart);
        }
    }
};

/**
 * Calculates stacking values for a collection of series.
 *
 * @param  {SeriesProperties[]} seriesCollection - Collection of series for which stacking values are calculated.
 * @param {Chart} chart - Chart instance used to store positive and negative stacked values.
 * @returns {void}
 */
export const calculateStackingValues: (seriesCollection: SeriesProperties[], chart?: Chart) => void
    = (seriesCollection: SeriesProperties[], chart?: Chart): void => {
        let startValues: number[];
        let endValues: number[];
        let yValues: number[] = [];
        const lastPositive: Map<string | number, number[]> = new Map();
        const lastNegative: Map<string | number, number[]> = new Map();
        let stackingGroup: string;
        let lastValue: number;
        let value: number;

        const groupingValues: Map<string, SeriesProperties[]> = new Map();
        let visiblePoints: Points[] = [];

        // Group series by stackingGroup
        for (let i: number = 0; i < seriesCollection.length; i++) {
            const series: SeriesProperties = seriesCollection[i as number];
            const key: string = String(series.stackingGroup || '');

            if (!groupingValues.has(key)) {
                groupingValues.set(key, [series]);
            } else {
                const existingSeries: SeriesProperties[] = groupingValues.get(key) || [];
                existingSeries.push(series);
                groupingValues.set(key, existingSeries);
            }
        }

        // Process each group
        groupingValues.forEach((seriesList: SeriesProperties[]) => {
            const stackingSeies: SeriesProperties[] = [];
            const stackedValues: number[] = [];
            // calculate total (sum of absolute values) per xKey across all series in this group - 100% normalization
            const stackedYTotalsByX: number[] = [];
            for (const series of seriesList) {
                if ((series.type?.indexOf('Stacking') !== -1 && series.type?.indexOf('100') !== -1) || ((series.drawType?.indexOf('Stacking') !== -1) && series.type?.indexOf('100') !== -1)) {
                    const points: Points[] = calculateVisiblePoints(series);
                    const yValues: number[] = series.yData;
                    for (let j: number = 0; j < points.length; j++) {
                        const valueX: number = points[j as number].xValue as number;
                        const xKey: number = Number.isFinite(valueX) ? valueX : j;
                        const value: number = +yValues[j as number];
                        if (!Number.isFinite(value)) { continue; }
                        stackedYTotalsByX[xKey as number] = (stackedYTotalsByX[xKey as number] || 0) + Math.abs(value);
                    }
                }
            }

            //Calculates per-series start/end positions using totals - Actual stacking rendering
            for (const series of seriesList) {
                if (series.type?.indexOf('Stacking') !== -1 || (series.drawType?.indexOf('Stacking') !== -1)) {

                    stackingGroup = String(series.stackingGroup);

                    if (!lastPositive.has(stackingGroup)) {
                        lastPositive.set(stackingGroup, []);
                        lastNegative.set(stackingGroup, []);
                    }

                    yValues = series.yData;
                    startValues = [];
                    endValues = [];
                    stackingSeies.push(series);
                    visiblePoints = calculateVisiblePoints(series);

                    for (let j: number = 0, pointsLength: number = visiblePoints.length; j < pointsLength; j++) {
                        lastValue = 0;
                        value = +yValues[j as number]; // Fix for chart not rendering while y value is given as string issue

                        const xValueKey: number = visiblePoints[j as number].xValue || j;
                        const posValues: number[] = lastPositive.get(stackingGroup as string) || [];
                        const negValues: number[] = lastNegative.get(stackingGroup as string) || [];

                        if (posValues[xValueKey as number] === undefined) {
                            posValues[xValueKey as number] = PROCESS_DATA_CONSTANTS.DEFAULT_RENDER_COUNT;
                            lastPositive.set(stackingGroup, posValues);
                        }

                        if (negValues[xValueKey as number] === undefined) {
                            negValues[xValueKey as number] = PROCESS_DATA_CONSTANTS.DEFAULT_RENDER_COUNT;
                            lastNegative.set(stackingGroup, negValues);
                        }


                        stackedValues[j as number] = stackedValues[j as number] ?
                            stackedValues[j as number] + Math.abs(value) : Math.abs(value);

                        if (value >= 0) {
                            lastValue = posValues[xValueKey as number] || PROCESS_DATA_CONSTANTS.DEFAULT_RENDER_COUNT;
                            posValues[xValueKey as number] = lastValue + value;
                            lastPositive.set(stackingGroup, posValues);
                        } else {
                            lastValue = negValues[xValueKey as number] || PROCESS_DATA_CONSTANTS.DEFAULT_RENDER_COUNT;
                            negValues[xValueKey as number] = lastValue + value;
                            lastNegative.set(stackingGroup, negValues);
                        }

                        startValues.push(lastValue);
                        endValues.push(value + lastValue);

                    }

                    // --- Calculate 100% stacked values separately for StackingColumn100 and StackingBar100 ---
                    const isHundredStack: boolean = (series.type?.indexOf('100') ?? -1) > -1;
                    const isBar: boolean = series.type?.indexOf('Bar') !== -1;

                    if (isHundredStack) {
                        const startPercentages: number[] = [];
                        const endPercentages: number[] = [];

                        for (let index: number = 0; index < endValues.length; index++) {
                            const point: Points = visiblePoints[index as number];
                            const xv: number = point?.xValue as number;
                            const xKey: number = Number.isFinite(xv) ? xv : index;

                            // Total value for this category (sum of absolute y values across all series)
                            const totalForCategory: number = stackedYTotalsByX[xKey as number] || stackedValues[index as number] || 0;

                            if (totalForCategory === 0) {
                                startPercentages[index as number] = 0;
                                endPercentages[index as number] = 0;
                                continue;
                            }

                            if (isBar) {
                                // Horizontal stacking (StackingBar100)
                                startPercentages[index as number] = (startValues[index as number] / totalForCategory) * 100;
                                endPercentages[index as number] = (endValues[index as number] / totalForCategory) * 100;
                            } else {
                                //  Vertical stacking (StackingColumn100)
                                startPercentages[index as number] = (startValues[index as number] / totalForCategory) * 100;
                                endPercentages[index as number] = (endValues[index as number] / totalForCategory) * 100;
                            }
                        }

                        // Assign normalized stacked values
                        series.stackedValues = { startValues: startPercentages, endValues: endPercentages };
                        series.yMin = 0;
                        series.yMax = 100;
                    }

                    else{
                        series.stackedValues = { startValues: startValues, endValues: endValues };

                        const isLogAxis: boolean = series.yAxis.valueType === 'Logarithmic';
                        const isColumnBarType: boolean = (series.type?.indexOf('Column') !== -1 || series.type?.indexOf('Bar') !== -1);

                        series.yMin = isLogAxis && isColumnBarType && series.yMin < 1 ?
                            series.yMin :
                            (series.yAxis.startFromZero && series.yAxis.rangePadding === 'Auto' && series.yMin >= 0) ?
                                PROCESS_DATA_CONSTANTS.DEFAULT_RENDER_COUNT :
                                parseFloat((Math.min.apply(0, endValues)).toFixed(PROCESS_DATA_CONSTANTS.CHART_AREA_PADDING));

                        series.yMax = Math.max.apply(0, endValues);

                        if (series.yMin > Math.min.apply(0, endValues)) {
                            series.yMin = isLogAxis && isColumnBarType && series.yMin < 1 ? series.yMin : Math.min.apply(0, endValues);
                        }

                        if (series.yMax < Math.max.apply(0, startValues)) {
                            series.yMax = PROCESS_DATA_CONSTANTS.DEFAULT_RENDER_COUNT;
                        }
                    }
                }
            }
            if ( chart)
            {
                chart.positiveStackedValues = lastPositive;
                chart.negativeStackedValues = lastNegative;
            }

            findPercentageOfStacking(stackingSeies, stackedValues);
        });
    };

/**
 * Calculates the percentage for stacking series.
 *
 * @param {SeriesProperties[]} stackingSeies - Collection of stacking series.
 * @param {number[]} values - The stacked values.
 * @returns {void}
 */
export const findPercentageOfStacking: (stackingSeies: SeriesProperties[], values: number[]) => void
    = (stackingSeies: SeriesProperties[], values: number[]): void => {
        for (const item of stackingSeies) {
            for (const point of calculateVisiblePoints(item)) {
                point.percentage = Math.abs(+((point.y as number) / values[point.index] * 100).toFixed(2));
            }
        }
    };
