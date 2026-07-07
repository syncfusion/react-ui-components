import { defaultChartConfigs } from '../../base/default-properties';
import { Chart, ChartIndicatorSettings, Points, SeriesProperties } from '../../chart-area/chart-interfaces';
import { getDataPoint, setSeriesProperties, setSeriesRange } from './ChartIndicatorsBase';

/**
 * Initializes MACD series collection.
 *
 * @param {ChartIndicatorSettings} indicator - Technical indicator configuration
 * @param {Chart} chart - Parent chart reference
 * @returns {void}
 */
export const initSeriesCollection: (
    indicator: ChartIndicatorSettings,
    chart: Chart
) => void = (
    indicator: ChartIndicatorSettings,
    chart: Chart
): void => {
    indicator.targetSeries = [];

    const signalLine: SeriesProperties = {
        ...defaultChartConfigs.ChartSeries
    } as SeriesProperties;

    setSeriesProperties(
        signalLine,
        indicator,
        indicator?.type as string,
        indicator?.fill as string,
        indicator.width as number,
        chart
    );

    if (indicator.macdType === 'Line' || indicator.macdType === 'Both') {
        const macdLine: SeriesProperties = {
            ...defaultChartConfigs.ChartSeries
        } as SeriesProperties;

        setSeriesProperties(
            macdLine,
            indicator,
            'MacdLine',
            indicator.macdLine?.color as string,
            indicator.macdLine?.width as number,
            chart
        );
    }

    if (indicator.macdType === 'Histogram' || indicator.macdType === 'Both') {
        const histogramSeries: SeriesProperties = {
            ...defaultChartConfigs.ChartSeries
        } as SeriesProperties;

        histogramSeries.type = 'Column';

        setSeriesProperties(
            histogramSeries,
            indicator,
            'Histogram',
            indicator.macdPositiveColor as string,
            indicator.width as number,
            chart
        );
    }
};

/**
 * Calculates Exponential Moving Average (EMA) values for the given period and valid data points.
 *
 * @private
 * @param {number} period - The period for which EMA values are to be calculated.
 * @param {Points[]} validData - The valid data points used for calculating EMA.
 * @param {string} field - The field of the data points to be used for EMA calculation.
 * @returns {number[]} - An array containing the calculated EMA values.
 */
function calculateEMAValues(period: number, validData: Points[], field: string): number[] {
    let sum: number = 0;
    let initialEMA: number = 0;
    const emaValues: number[] = [];
    const emaPercent: number = (2 / (period + 1));
    for (let i: number = 0; i < period; i++) {
        sum += Number(validData[i as number][field as keyof Points]);
    }
    initialEMA = (sum / period);
    emaValues.push(initialEMA);
    let emaAvg: number = initialEMA;
    for (let j: number = period; j < validData.length; j++) {
        emaAvg = (Number(validData[j as number][field as keyof Points]) - emaAvg) * emaPercent + emaAvg;
        emaValues.push(emaAvg);
    }
    return emaValues;
}

/**
 * Calculates Moving Average Convergence Divergence (MACD) points based on the provided MACD values,
 * valid data points, and series information.
 *
 * @private
 * @param {ChartIndicatorSettings} indicator - The MACD indicator.
 * @param {number[]} macdPoints - The array of MACD values.
 * @param {Points[]} validData - The valid data points used for calculating MACD.
 * @param {SeriesProperties} series - The series information.
 * @returns {Points[]} - An array containing the calculated MACD points.
 */
function getMACDPoints(
    indicator: ChartIndicatorSettings, macdPoints: number[], validData: Points[], series: SeriesProperties): Points[] {
    const macdCollection: Points[] = [];
    let dataMACDIndex: number = (indicator.fastPeriod as number) - 1;
    let macdIndex: number = 0;
    while (dataMACDIndex < validData.length) {
        macdCollection.push(getDataPoint(
            validData[dataMACDIndex as number].x, macdPoints[macdIndex as number], validData[dataMACDIndex as number], series,
            macdCollection.length));
        dataMACDIndex++;
        macdIndex++;
    }
    return macdCollection;
}

/**
 * Calculates the signal line points for the Moving Average Convergence Divergence (MACD) indicator
 * based on the provided signal EMA values, valid data points, and series information.
 *
 * @private
 * @param {ChartIndicatorSettings} indicator - The MACD indicator.
 * @param {number[]} signalEma - The array of signal EMA values.
 * @param {Points[]} validData - The valid data points used for calculating MACD.
 * @param {SeriesProperties} series - The series information.
 * @returns {Points[]} - An array containing the calculated signal line points.
 */
function getSignalPoints(
    indicator: ChartIndicatorSettings, signalEma: number[], validData: Points[], series: SeriesProperties): Points[] {

    let dataSignalIndex: number = (indicator.fastPeriod as number) + (indicator.period as number) - 2;
    let signalIndex: number = 0;
    const signalCollection: Points[] = [];
    while (dataSignalIndex < validData.length) {
        signalCollection.push(getDataPoint(
            validData[dataSignalIndex as number].x, signalEma[signalIndex as number], validData[dataSignalIndex as number], series,
            signalCollection.length));
        dataSignalIndex++;
        signalIndex++;
    }
    return signalCollection;
}

/**
 * Calculates the Moving Average Convergence Divergence (MACD) values based on the provided short EMA
 * and long EMA values for the MACD indicator.
 *
 * @private
 * @param {ChartIndicatorSettings} indicator - The MACD indicator.
 * @param {number[]} shortEma - The array of short EMA values.
 * @param {number[]} longEma - The array of long EMA values.
 * @returns {number[]} - An array containing the calculated MACD values.
 */
function getMACDVales(indicator: ChartIndicatorSettings, shortEma: number[], longEma: number[]): number[] {
    const macdPoints: number[] = [];
    const diff: number = (indicator.fastPeriod as number) - (indicator.slowPeriod as number);
    for (let i: number = 0; i < longEma.length; i++) {
        macdPoints.push((shortEma[i + diff] - longEma[i as number]));
    }
    return macdPoints;
}

/**
 * Calculates the histogram points for the MACD indicator based on the provided MACD values and signal EMA values.
 *
 * @private
 * @param {ChartIndicatorSettings} indicator - The MACD indicator.
 * @param {number[]} macdPoints - The array of MACD values.
 * @param {number[]} signalEma - The array of signal EMA values.
 * @param {Points[]} validData - The array of valid data points.
 * @param {SeriesProperties} series - The series associated with the MACD indicator.
 * @returns {Points[]} - An array containing the calculated histogram points.
 */
function getHistogramPoints(
    indicator: ChartIndicatorSettings, macdPoints: number[], signalEma: number[],
    validData: Points[], series: SeriesProperties): Points[] {

    let dataHistogramIndex: number = (indicator.fastPeriod as number) + (indicator.period as number) - 2;
    let histogramIndex: number = 0;
    const histogramCollection: Points[] = [];

    while (dataHistogramIndex < validData.length) {
        histogramCollection.push(getDataPoint(
            validData[dataHistogramIndex as number].x, macdPoints[histogramIndex + ((indicator.period as number) - 1)] -
        signalEma[histogramIndex as number],
            validData[dataHistogramIndex as number], series, histogramCollection.length, indicator));
        dataHistogramIndex++;
        histogramIndex++;
    }
    return histogramCollection;
}

/**
 * Defines the predictions using MACD approach.
 *
 * @private
 * @param {ChartIndicatorSettings} indicator - The technical indicator for which the data source is to be initialized.
 * @returns {void}
 */
function initDataSource(indicator: ChartIndicatorSettings): void {
    let signalCollection: Points[] = [];
    const fastPeriod: number = indicator.fastPeriod as number;
    const slowPeriod: number = indicator.slowPeriod as number;
    const trigger: number = indicator.period as number;
    const length: number = fastPeriod + trigger;
    let macdCollection: Points[] = [];
    let histogramCollection: Points[] = [];
    const validData: Points[] = indicator.points as Points[];
    const signalSeries: SeriesProperties = (indicator.targetSeries as SeriesProperties[])[0];

    let histogramSeries: SeriesProperties | null = null;
    let macdLineSeries: SeriesProperties | null = null;

    if (indicator.macdType === 'Histogram') {
        histogramSeries = (indicator.targetSeries as SeriesProperties[])[1];
    } else {
        macdLineSeries = (indicator.targetSeries as SeriesProperties[])[1];
        if (indicator.macdType === 'Both') {
            histogramSeries = (indicator.targetSeries as SeriesProperties[])[2];
        }
    }

    if (validData && length < validData.length && slowPeriod <= fastPeriod &&
        slowPeriod > 0 && (length - 2) >= 0) {
        const shortEMA: number[] = calculateEMAValues(slowPeriod, validData, 'close');
        const longEMA: number[] = calculateEMAValues(fastPeriod, validData, 'close');
        const macdValues: number[] = getMACDVales(indicator, shortEMA, longEMA);
        macdCollection = getMACDPoints(indicator, macdValues, validData, macdLineSeries || signalSeries);
        const signalEMA: number[] = calculateEMAValues(trigger, macdCollection, 'y');
        signalCollection = getSignalPoints(indicator, signalEMA, validData, signalSeries);
        if (histogramSeries) {
            histogramCollection = getHistogramPoints(
                indicator, macdValues, signalEMA, validData, histogramSeries);
        }
    }

    setSeriesRange(signalCollection, indicator, (indicator.targetSeries as SeriesProperties[])[0]);
    if (histogramSeries) {
        setSeriesRange(histogramCollection, indicator, histogramSeries);
    }
    if (macdLineSeries) {
        setSeriesRange(macdCollection, indicator, macdLineSeries);
    }
}

/**
 * MACD Renderer - exported API
 */
const MACDRenderer: {
    initSeriesCollection: (indicator: ChartIndicatorSettings, chart: Chart) => void;
    initDataSource: (indicator: ChartIndicatorSettings) => void;
} = {
    initSeriesCollection,
    initDataSource
};

export default MACDRenderer;
