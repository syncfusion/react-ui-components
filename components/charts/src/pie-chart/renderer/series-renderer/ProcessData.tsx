import { DataManager, Query, ODataV4Adaptor, UrlAdaptor } from '@syncfusion/react-data';
import { Chart, Points, SeriesProperties } from '../../base/internal-interfaces';
import { stringToNumber } from '../../utils/helper';
import { getSeriesColor } from '../../utils/theme';
import { extend, getValue, isNullOrUndefined } from '@syncfusion/react-base';
import { useRegisterChartRender } from '../../hooks/events';
import { applyPointRenderCallback } from './series-helper';

/**
 * Processes and manages chart series data.
 *
 * @param {Chart} chart - An array of Series objects to be processed.
 * @returns {void} - Returns the processed series array.
 */
export const processChartSeries: (chart: Chart) => void = (chart: Chart) => {
    const visibleSeries: SeriesProperties[] = chart.visibleSeries;

    /**
     * Processes the data for each visible series.
     *
     * @returns {void}
     */
    const processData: () => void = () => {
        for (let i: number = 0, len: number = visibleSeries.length; i < len; i++) {
            const series: SeriesProperties = visibleSeries[i as number];

            // Initialize data module for the series
            initializeDataModule(series);
        }
    };

    /**
     * Initializes the data module for the series and refreshes data management.
     *
     * @param {SeriesProperties} series - The series for which the data module is initialized.
     * @returns {void} This function does not return a value.
     */
    const initializeDataModule: (series: SeriesProperties) => void = (series: SeriesProperties) => {
        const dataSource: Object | DataManager | undefined = series.dataSource;
        series.dataModule = useData(dataSource, series.query as Query);
        series.points = [];
        refreshDataManager(series);
    };


    processData();
};

/**
 * Refreshes the data manager for the series.
 *
 * @param {SeriesProperties} series — The series needing source data fetch/refresh.
 * @returns {void}
 */
export const refreshDataManager: (series: SeriesProperties) => void = (series: SeriesProperties): void => {
    if (series.points && series.points.length > 0 && (series.dataSource instanceof DataManager)) {
        return;
    }

    const dataSource: Object | DataManager | undefined = series.dataSource;

    // Handle local array data source directly
    if (Array.isArray(dataSource) && !(dataSource instanceof DataManager) && !series.query) {
        dataManagerSuccess({ result: dataSource, count: dataSource.length }, series);
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
                })
                .catch(() => {
                    series.dataFetchRequested = false;
                });
        }
    }
};

// Normalize result payloads from @syncfusion/react-data adaptors
const normalizeResult: (payload: ResultData) => { result: Object[]; count: number } = (payload: any) => {

    if (payload && Array.isArray(payload)) { return { result: payload, count: payload.length }; }

    if (payload && Array.isArray(payload.result)) { return { result: payload.result, count: payload.count ?? payload.result.length }; }
    if (payload && payload.result && Array.isArray(payload.result.result)) {
        return { result: payload.result.result, count: payload.result.count ?? payload.result.result.length };
    }
    if (payload && Array.isArray(payload.records)) { return { result: payload.records, count: payload.count ?? payload.records.length }; }
    if (payload && payload.json && Array.isArray(payload.json)) { return { result: payload.json, count: payload.json.length }; }

    if (payload && payload.result && payload.result.value && Array.isArray(payload.result.value)) {
        return { result: payload.result.value, count: payload.result['@odata.count'] ?? payload.result.value.length };
    }
    if (payload && payload.value && Array.isArray(payload.value)) {
        return { result: payload.value, count: payload['@odata.count'] ?? payload.value.length };
    }
    if (payload && payload.result && payload.result.d && Array.isArray(payload.result.d.results)) {
        return { result: payload.result.d.results, count: payload.result.d.__count ?? payload.result.d.results.length };
    }
    if (payload && payload.d && Array.isArray(payload.d.results)) {
        return { result: payload.d.results, count: payload.d.__count ?? payload.d.results.length };
    }
    return { result: [], count: 0 };
};

const dataManagerSuccess: (dataObject: { result: Object; count: number }, series: SeriesProperties) => void =
    (dataObject: { result: Object; count: number }, series: SeriesProperties) => {
        const normalized: { result: Object[]; count: number; } = normalizeResult(dataObject);
        [series].filter(Boolean).forEach((seriesArray: SeriesProperties | undefined) => {
            // Skip if we already have points data
            if (seriesArray && (!seriesArray.points || seriesArray.points.length === 0)) {
                seriesArray.currentViewData = normalized.count ? normalized.result : [];
                getPoints(normalized.result as Object[], series);
                seriesArray.recordsCount = normalized.count;
                seriesArray.currentViewData = null;
            }
        });
    };

/**
 * Processes the result object and populates the series with point data.
 *
 * @param {Object} data - The result object containing raw data to be converted into points.
 * @param {SeriesProperties} series - The series object to which the generated points will be added.
 * @returns {void} This function does not return any value.
 * @private
 */
export function getPoints(data: Object[], series: SeriesProperties): void {
    let length: number = Object.keys(data).length;
    series.sumOfPoints = 0;
    if (length === 0) {
        // fix for Pie datalabels are not removed for empty datasource
        series.points = [];
        return;
    }
    const chart: Chart = series.chart;
    let result: Object[] = data;
    if (series.emptyPointSettings?.mode !== 'Average' && series.emptyPointSettings?.mode !== 'Zero') {
        const newData: Object[] = [];
        for (let i: number = 0; i < length; i++) {
            const yName: string = series.yField || '';
            if (!isNullOrUndefined((result[i as number] as Record<string, Object>)[yName as string])) {
                newData.push(result[i as number]);
            }
        }
        result = extend({}, newData) as Object[];
        length = Object.keys(result)?.length;
    }
    if (series.groupTo) { findSumOfPoints(result, series); }
    series.points = [];
    series.clubbedPoints = [];
    series.sumOfClub = 0;
    let point: Points;
    const colors: string[] = series.palettes?.length ? series.palettes : getSeriesColor(chart.theme || 'Material');
    const clubValue: number = stringToNumber(series.groupTo, series.sumOfPoints);
    for (let i: number = 0; i < length; i++) {
        point = setPoints(result, i, series);
        point.visible = true;
        if (!isClub(point, clubValue, i, series)) {
            if (isNullOrUndefined(point.y)) {
                point.visible = false;
            }
            pushPoints(point, colors, series);
        } else {
            point.index = series.clubbedPoints.length;
            point.isExplode = true;
            series.clubbedPoints.push(point);
            point.isSliced = true;
        }
    }
    if (!series.groupTo) { findSumOfPoints(result, series); }
    series.lastGroupTo = series.groupTo as string;
    if (series.sumOfClub > 0) {
        const clubPoint: Points = generateClubPoint(series);
        pushPoints(clubPoint, colors, series);
        const pointsLength: number = series.points.length - 1;
        series.clubbedPoints.map((point: Points) => {
            point.index += pointsLength;
            point.color = clubPoint.color;
        });
    }
    if (
        series.clubbedPoints.length && series.explode
        && (series.explodeAll || series.points[series.points.length - 1].index === series.explodeIndex)
    ) {
        series.points.splice(series.points.length - 1, 1);
        series.points = series.points.concat(series.clubbedPoints);
    }
}


/**
 * Calculates the number of keys in the result object and performs operations on the series.
 *
 * @param {Object} result - The result object containing data points or aggregated values.
 * @param {SeriesProperties} series - The series object to which the result may be applied.
 * @returns {void} This function does not return any value.
 */
function findSumOfPoints(result: Object[], series: SeriesProperties): void {
    const length: number = Object.keys(result).length;
    for (let i: number = 0; i < length; i++) {
        const item: Record<string, Object> = result[i as number] as Record<string, Object>;
        const yName: string = series.yField || '';
        const value: number = item?.[yName as string] as number;
        if (!isNullOrUndefined(result[i as number]) && !isNullOrUndefined(value)
            && !isNaN(value) && (series.points.length && series.points[i as number] &&
                series.points[i as number].visible && !isNullOrUndefined(series.points[i as number].y) || series.groupTo)) {
            series.sumOfPoints += Math.abs(value);
        }
    }
}

/**
 * Creates and initializes a point object from raw data for the chart series.
 *
 * @param {Object} data - The raw data object used to generate the point.
 * @param {number} i - The index of the data item in the series.
 * @param {SeriesProperties} series - The series object containing configuration and points.
 * @returns {Points} Returns a newly created point object.
 */
function setPoints(data: Object[], i: number, series: SeriesProperties): Points {
    const point: Points = {} as Points;
    point.x = getValue(series.xField as string, data[i as number]);
    point.y = getValue(series.yField as string, data[i as number]);
    point.color = getValue(series.colorField as string, data[i as number]);
    point.text = point.originalText = getValue(series.dataLabel?.name || '', data[i as number]);
    //point.tooltip = getValue(this.tooltipMappingName || '', data[i as number]);
    point.sliceRadius = getValue(series.radius as string, data[i as number]);
    point.sliceRadius = isNullOrUndefined(point.sliceRadius) ? '80%' : point.sliceRadius;
    //point.separatorY = accumulation.intl.formatNumber(point.y, { useGrouping: false });
    //setVisibility(point, i);
    setAccEmptyPoint(point, i, data, series);
    return point;
}


/**
 * Sets default values for an empty point in the series if its `y` value is null or NaN.
 *
 * @param {Points} point - The point to be checked and possibly modified.
 * @param {number} i - The index of the point in the data array.
 * @param {Object} data - The raw data object corresponding to the point.
 * @param {SeriesProperties} series - The series object containing configuration and points.
 * @returns {void} This function does not return any value.
 */
function setAccEmptyPoint(point: Points, i: number, data: Object[], series: SeriesProperties): void {
    if (!(isNullOrUndefined(point.y) || isNaN(point.y))) {
        return;
    }
    point.color = series.emptyPointSettings?.fill || point.color;
    switch (series.emptyPointSettings?.mode) {
    case 'Zero':
        point.y = 0;
        point.visible = true;
        break;
    case 'Average': {
        const previousPoint: Record<string, Object> = data[i - 1] as Record<string, Object>;
        const nextPoint: Record<string, Object> = data[i + 1] as Record<string, Object>;
        const yName: string = series.yField as string;
        const yValue: number = (previousPoint[yName as string]) as number || 0;
        const previous: number = data[i - 1] ? yValue : 0;
        const next: number = data[i + 1] ? ((nextPoint[yName as string] as number) || 0) : 0;
        point.y = (Math.abs(previous) + Math.abs(next)) / 2;
        series.sumOfPoints += point.y;
        point.visible = true;
        break;
    }
    default:
        point.visible = false;
        break;
    }
}

/**
 * Determines whether a point should be clubbed based on the club value and index.
 *
 * @param {Points} point - The data point being evaluated.
 * @param {number} clubValue - The threshold value for clubbing points.
 * @param {number} index - The index of the current point in the series.
 * @param {SeriesProperties} series - The series object containing configuration.
 * @returns {boolean} Returns true if the point should be clubbed; otherwise, false.
 */
function isClub(point: Points, clubValue: number, index: number, series: SeriesProperties): boolean {
    if (!isNullOrUndefined(clubValue)) {
        if (series.groupMode === 'Value' && Math.abs(point.y) <= clubValue) {
            series.sumOfClub += Math.abs(point.y);
            return true;
        } else if (series.groupMode === 'Point' && index >= clubValue) {
            series.sumOfClub += Math.abs(point.y);
            return true;
        }
    }
    return false;
}

/**
 * Pushes a point into the series and assigns visual properties like color and explode state.
 *
 * @param {Points} point - The point to be added to the series.
 * @param {string[]} colors - Array of color strings used to assign colors to points.
 * @param {SeriesProperties} series - The series object to which the point is added.
 * @param {Points[]} series.points - The array of existing points in the series.
 * @param {boolean} [series.explodeAll] - Flag to explode all points.
 * @param {number} [series.explodeIndex] - Index of the point to be exploded if not all.
 * @returns {void}
 * @private
 */
export function pushPoints(point: Points, colors: string[], series: SeriesProperties): void {
    point.index = series.points.length;
    point.isExplode = series.explodeAll || (point.index === series.explodeIndex);
    point.color = point.color || colors[point.index % colors.length];
    const customText: string =
        applyPointRenderCallback(
            {
                xValue: point.x as number | Date | string | null, yValue: point.y,
                pointIndex: point.index, color: point.color
            }
            , series.chart);
    point.color = customText;
    series.points.push(point);
}

/**
 * Generates a clubbed point representing aggregated data for the "Others" category.
 *
 * @param {SeriesProperties} series - The series object containing aggregated values.
 * @param {number} series.sumOfClub - The total value to be clubbed under "Others".
 * @returns {Points} A point object representing the clubbed data.
 * @private
 */
export function generateClubPoint(series: SeriesProperties): Points {
    const clubPoint: Points = {} as Points;
    clubPoint.isClubbed = true;
    clubPoint.visible = true;
    clubPoint.x = 'Others';
    clubPoint.y = series.sumOfClub;
    clubPoint.text = clubPoint.originalText = clubPoint.x + ': ' + series.sumOfClub;
    clubPoint.sliceRadius = '80%';
    return clubPoint;
}


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
        first: points[0]?.x,
        last: points[points.length - 1]?.x
    });

    if (dataSignature !== dataCache.previousSignatures[chartId as string] &&
        !dataCache.pendingRenders[chartId as string]) {

        dataCache.previousSignatures[chartId as string] = dataSignature;
        dataCache.pendingRenders[chartId as string] = true;
        dataCache.renderCount[chartId as string]++;
        const triggerAxisRender: (chartId?: string) => void = useRegisterChartRender();
        series.chart.animateSeries = false;
        triggerAxisRender(chartId);
        dataCache.pendingRenders[chartId as string] = false;
    }
};


/**
 * Custom hook to initialize a DataManager and Query based on the provided data source and query.
 *
 * @param {Object | DataManager} dataSource - The data source object or an instance of DataManager.
 * @param {Query} query - An optional instance of Query to be used with the data source.
 * @returns {Object} An object containing the following:
 *   - dataManager {DataManager} - The initialized DataManager instance.
 *   - query {Query} - The initialized Query instance.
 *   - generateQuery {Function} - Function to generate a new Query.
 *   - getData {Function} - Function to execute a query and get data.
 */
export const useData: (dataSource?: Object | DataManager, query?: Query) => {
    dataManager: DataManager;
    query: Query;
    generateQuery: () => Query;
    getData: (dataQuery: Query) => Promise<Object>;
} = (dataSource?: Object | DataManager, query?: Query) => {
    // Normalize to a DataManager from @syncfusion/react-data, attaching an adaptor when URL-based
    const initDataManager: (dataSource: Object | DataManager, query: Query) => {
        dataManager: DataManager;
        dataQuery: Query;
    } = (dataSource: Object | DataManager, query: Query) => {
        let dm: DataManager;
        if (dataSource instanceof DataManager) {
            dm = dataSource;
        } else if (dataSource && typeof dataSource === 'object' && 'url' in (dataSource as Record<string, unknown>)) {
            const src: { url: string; adaptor?: unknown; crossDomain?: boolean; } =
                dataSource as { url: string; adaptor?: unknown; crossDomain?: boolean };
            const hasAdaptor: boolean = !!src.adaptor && typeof src.adaptor === 'object';
            const isOData: boolean = /odata|\.svc/gi.test(src.url || '');
            dm = new DataManager({
                url: src.url,
                crossDomain: src.crossDomain === true,
                adaptor: hasAdaptor ? (src.adaptor) : (isOData ? new ODataV4Adaptor() : new UrlAdaptor())
            } as Partial<DataManager>);
        } else if (Array.isArray(dataSource)) {
            dm = new DataManager(dataSource as object[]);
        } else {
            dm = new DataManager({ json: [] });
        }
        const dq: Query = query instanceof Query ? query : new Query();
        return { dataManager: dm, dataQuery: dq };
    };

    const { dataManager, dataQuery } = initDataManager(dataSource || {}, query || new Query());

    const generateQuery: () => Query = (): Query => {
        return dataQuery.clone();
    };

    const getData: (dataQuery: Query) => Promise<Object> = (dataQuery: Query): Promise<Object> => {
        if (typeof (dataManager).executeQuery === 'function') {
            return (dataManager).executeQuery(dataQuery);
        }
        // Fallback for local arrays
        return Promise.resolve({
            result: (dataManager).dataSource?.json || [],
            count: ((dataManager).dataSource?.json || []).length
        });
    };

    return {
        dataManager,
        query: dataQuery,
        generateQuery,
        getData
    };
};

/**
 * Defines a single data point in a chart series.
 *
 * @private
 */
export interface DataPoint {
    /**
     * The x-value of the data point.
     * Can be a number (for a numeric axis) or a string (for a category or date axis).
     */
    x: number | string;
    /**
     * The y-value of the data point.
     * Represents the quantitative value plotted along the y-axis.
     */
    y: number;
}

/**
 * Adds a data point to the data source for the series.
 *
 * @function addPoint
 * @param {Object} dataPoint - The data point to be added.
 * @param {SeriesProperties} series – Chart series.
 * @returns {void}
 * @private
 */
export function addPoint(dataPoint: Object, series: SeriesProperties): void {
    (series.dataSource as Object[]).push(dataPoint);
    series.sumOfPoints = 0;
    const visiblepoints: Object[] = [];
    for (let i: number = 0; i < (series.dataSource as object[]).length; i++) {
        if (series.points[i as number] && series.points[i as number].visible) {
            visiblepoints.push((series.dataSource as object[])[i as number]);
        }
        else if (i === (series.dataSource as object[]).length - 1) {
            visiblepoints.push((series.dataSource as object[])[i as number]);
        }
    }
    getPoints(series.dataSource as object[], series);
}

/**
 * Removes a data point from the series data source at the specified index.
 *
 * @function removePoint
 * @param {number} index – The index of the data point to be removed from the series.
 * @param {SeriesProperties} series – Chart series.
 * @returns {void}
 * @private
 */
export function removePoint(index: number, series: SeriesProperties): void {
    const dataSource: Object[] = extend([], series.dataSource as Object[], undefined, true) as Object[];

    if (dataSource.length > 0 && index >= 0 && index < dataSource.length) {
        series.sumOfPoints = 0;
        const removepoints: Object[] = [];
        for (let i: number = 0; i < (series.dataSource as object[]).length; i++) {
            if (i !== index && series.points[i as number] && series.points[i as number].visible) {
                removepoints.push((series.dataSource as object[])[i as number]);
            }
        }
        dataSource.splice(index, 1);
        (series.dataSource as object[]).splice(index, 1);
        series.points.splice(index, 1);
        for (let i: number = index; i < series.points.length; i++) {
            const point: Points = series.points[i as number];
            point.index = i;
            point.y = series.points[i as number].y;
        }
        findSumOfPoints(removepoints, series);
    }
}

interface ResultData {
    result: Object;
    count: number
}
