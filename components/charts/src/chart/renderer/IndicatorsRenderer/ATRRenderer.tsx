import { defaultChartConfigs } from '../../base/default-properties';
import { Chart, ChartIndicatorSettings, Points, SeriesProperties } from '../../chart-area/chart-interfaces';
import { getDataPoint, setSeriesProperties, setSeriesRange } from './ChartIndicatorsBase';

/**
 * Initializes the series collection for ATR indicator.
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
        'ATR',
        indicator?.fill as string,
        indicator.width as number,
        chart
    );
};

/**
 * Defines the predictions using Average True Range approach
 *
 * @private
 * @param {ChartIndicatorSettings} indicator - The technical indicator for which the data source is to be initialized.
 * @returns {void}
 */
function initDataSource(indicator: ChartIndicatorSettings): void {
    const validData: Points[] = indicator.points as Points[];
    if (validData.length > 0 && validData.length > (indicator.period as number)) {
        calculateATRPoints(indicator, validData);
    }
}

/**
 * Calculates the Average True Range (ATR) points for a technical indicator.
 *
 * @param {ChartIndicatorSettings} indicator - The technical indicator for which the ATR points are calculated.
 * @param {Points[]} validData - The valid data points used for calculation.
 * @returns {void}
 * @private
 */
function calculateATRPoints(indicator: ChartIndicatorSettings, validData: Points[]): void {
    let average: number = 0;
    let highLow: number = 0;
    let highClose: number = 0;
    let lowClose: number = 0;
    let trueRange: number = 0;
    const points: Points[] = [];
    const temp: Object[] = [];
    const period: number = indicator.period as number;
    let sum: number = 0;
    const y: string = 'y';
    const signalSeries: SeriesProperties = (indicator.targetSeries as SeriesProperties[])[0];
    for (let i: number = 0; i < validData.length; i++) {
        highLow = Number(validData[i as number].high) - Number(validData[i as number].low);
        if (i > 0) {
            //
            highClose = Math.abs(Number(validData[i as number].high) - Number(validData[i - 1].close));
            lowClose = Math.abs(Number(validData[i as number].low) - Number(validData[i - 1].close));
        }
        trueRange = Math.max(highLow, highClose, lowClose);
        sum = sum + trueRange;
        if (i >= period) {
            average = (Number(temp[i - 1][y as keyof Object]) * (period - 1) + trueRange) / period;
            points.push(getDataPoint(
                validData[i as number].x, average, validData[i as number], signalSeries, points.length));
        } else {
            average = sum / period;
            if (i === period - 1) {
                points.push(getDataPoint(
                    validData[i as number].x, average, validData[i as number], signalSeries, points.length));
            }
        }
        temp[i as number] = { x: validData[i as number].x, y: average };
    }
    setSeriesRange(points, indicator);
}

/**
 * ATR Renderer - exported API
 */
const ATRRenderer: {
    initSeriesCollection: (indicator: ChartIndicatorSettings, chart: Chart) => void;
    initDataSource: (indicator: ChartIndicatorSettings) => void;
} = {
    initSeriesCollection,
    initDataSource
};

export default ATRRenderer;
