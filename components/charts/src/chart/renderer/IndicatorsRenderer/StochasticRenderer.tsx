import { defaultChartConfigs } from '../../base/default-properties';
import { Chart, ChartIndicatorSettings, Points, SeriesProperties } from '../../chart-area/chart-interfaces';
import { getDataPoint, setSeriesProperties, setSeriesRange } from './ChartIndicatorsBase';

/**
 * Initializes series collection for Stochastic indicator.
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

    // %D Signal line
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

    // %K Period line
    const periodLine: SeriesProperties = {
        ...defaultChartConfigs.ChartSeries
    } as SeriesProperties;

    setSeriesProperties(
        periodLine,
        indicator,
        'PeriodLine',
        indicator.periodLine?.color as string,
        indicator.periodLine?.width as number,
        chart
    );

    // Zone lines
    if (indicator.showZones) {
        const upperLine: SeriesProperties = {
            ...defaultChartConfigs.ChartSeries
        } as SeriesProperties;

        setSeriesProperties(
            upperLine,
            indicator,
            'UpperLine',
            indicator.upperLine?.color as string,
            indicator.upperLine?.width as number,
            chart
        );

        const lowerLine: SeriesProperties = {
            ...defaultChartConfigs.ChartSeries
        } as SeriesProperties;

        setSeriesProperties(
            lowerLine,
            indicator,
            'LowerLine',
            indicator.lowerLine?.color as string,
            indicator.lowerLine?.width as number,
            chart
        );
    }
};


/**
 * Calculates the Simple Moving Average (SMA) for the given period.
 *
 * @private
 * @param {number} period - The period for the SMA calculation.
 * @param {number} kPeriod - The 'k' period used in the calculation.
 * @param {Points[]} data - The array of data points.
 * @param {SeriesProperties} sourceSeries - The series associated with the data.
 * @returns {Points[]} - An array containing the calculated SMA points.
 */
function smaCalculation(period: number, kPeriod: number, data: Points[], sourceSeries: SeriesProperties): Points[] {
    const pointCollection: Points[] = [];
    if (data.length >= period + kPeriod) {
        const count: number = period + (kPeriod - 1);
        const temp: Object[] = [];
        const values: Object[] = [];
        for (let i: number = 0; i < data.length; i++) {
            const value: number = Number(data[i as number].y);
            temp.push(value);
        }
        let length: number = temp.length;
        while (length >= count) {
            let sum: number = 0;
            for (let i: number = period - 1; i < (period + kPeriod - 1); i++) {
                sum = sum + (temp[i as number] as number);

            }
            sum = sum / kPeriod;
            values.push(sum.toFixed(2));
            temp.splice(0, 1);
            length = temp.length;
        }
        const len: number = count - 1;
        for (let i: number = 0; i < data.length; i++) {
            if (!(i < len)) {
                pointCollection.push(getDataPoint(
                    data[i as number].x, Number(values[i - len]), data[i as number], sourceSeries, pointCollection.length));
                data[i as number].y = Number((values[i - len]));
            }
        }
    }
    return pointCollection;
}

/**
 * Calculates the period for the indicator.
 *
 * @private
 * @param {number} period - The period for the calculation.
 * @param {Points[]} data - The array of data points.
 * @param {SeriesProperties} series - The series associated with the data.
 * @returns {Points[]} - An array containing the calculated points for the period.
 */
function calculatePeriod(
    period: number, data: Points[], series: SeriesProperties): Points[] {
    const lowValues: Object[] = [];
    const highValues: Object[] = [];
    const closeValues: Object[] = [];
    const modifiedSource: Points[] = [];
    for (let j: number = 0; j < data.length; j++) {
        lowValues[j as number] = data[j as number].low;
        highValues[j as number] = data[j as number].high;
        closeValues[j as number] = data[j as number].close;
    }
    if (data.length > period) {
        const mins: Object[] = [];
        const maxs: Object[] = [];
        for (let i: number = 0; i < period - 1; ++i) {
            maxs.push(0);
            mins.push(0);
            modifiedSource.push(getDataPoint(
                data[i as number].x, data[i as number].close, data[i as number], series, modifiedSource.length));
        }
        for (let i: number = period - 1; i < data.length; ++i) {
            let min: number = Number.MAX_VALUE;
            let max: number = Number.MIN_VALUE;
            for (let j: number = 0; j < period; ++j) {
                min = Math.min(min, (lowValues[i - j] as number));
                max = Math.max(max, (highValues[i - j] as number));
            }
            maxs.push(max);
            mins.push(min);
        }

        for (let i: number = period - 1; i < data.length; ++i) {
            let top: number = 0;
            let bottom: number = 0;
            top += (closeValues[i as number] as number) - (mins[i as number] as number);
            bottom += (maxs[i as number] as number) - (mins[i as number] as number);
            modifiedSource.push(getDataPoint(
                data[i as number].x, (top / bottom) * 100, data[i as number], series, modifiedSource.length));
        }
    }
    return modifiedSource;
}

/**
 * Defines the predictions based on stochastic approach.
 *
 * @private
 * @param {ChartIndicatorSettings} indicator - The technical indicator for which the data source is to be initialized.
 * @returns {void}
 */
function initDataSource(indicator: ChartIndicatorSettings): void {
    let signalCollection: Points[] = [];
    const upperCollection: Points[] = [];
    const lowerCollection: Points[] = [];
    let periodCollection: Points[] = [];
    let source: Points[] = [];
    //prepare data
    const validData: Points[] = indicator.points as Points[];
    if (validData.length && validData.length >= (indicator.period as number)) {
        if (indicator.showZones) {
            for (let i: number = 0; i < validData.length; i++) {
                upperCollection.push(getDataPoint(
                    validData[i as number].x, indicator.overBought as number, validData[i as number]
                    , (indicator.targetSeries as SeriesProperties[])[2],
                    upperCollection.length));
                lowerCollection.push(getDataPoint(
                    validData[i as number].x, indicator.overSold as number, validData[i as number]
                    , (indicator.targetSeries as SeriesProperties[])[3],
                    lowerCollection.length));
            }
        }
        source = calculatePeriod(
            indicator.period as number, validData, (indicator.targetSeries as SeriesProperties[])[1]);
        periodCollection = smaCalculation(
            indicator.period as number, indicator.kPeriod as number, source, (indicator.targetSeries as SeriesProperties[])[1]);
        signalCollection = smaCalculation(
            (indicator.period as number) + (indicator.kPeriod  as number) - 1, indicator.dPeriod as number
            , source, (indicator.targetSeries as SeriesProperties[])[0]);
    }

    setSeriesRange(signalCollection, indicator, (indicator.targetSeries as SeriesProperties[])[0]);
    setSeriesRange(periodCollection, indicator, (indicator.targetSeries as SeriesProperties[])[1]);
    if (indicator.showZones) {
        setSeriesRange(upperCollection, indicator, (indicator.targetSeries as SeriesProperties[])[2]);
        setSeriesRange(lowerCollection, indicator, (indicator.targetSeries as SeriesProperties[])[3]);
    }
}

/**
 * Stochastic Renderer - exported API
 */
const StochasticRenderer: {
    initSeriesCollection: (indicator: ChartIndicatorSettings, chart: Chart) => void;
    initDataSource: (indicator: ChartIndicatorSettings) => void;
} = {
    initSeriesCollection,
    initDataSource
};

export default StochasticRenderer;
