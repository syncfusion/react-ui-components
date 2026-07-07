
import { defaultChartConfigs } from '../../base/default-properties';
import { Chart, ChartIndicatorSettings, Points, SeriesProperties } from '../../chart-area/chart-interfaces';
import { getDataPoint, setSeriesProperties, setSeriesRange } from './ChartIndicatorsBase';

/**
 * Initializes the series collection for Accumulation/Distribution indicator.
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

    setSeriesProperties(signalLine, indicator, indicator.type as string, indicator.fill as string, indicator.width as number, chart);
};

/**
 * Defines the predictions using accumulation distribution approach.
 *
 * @private
 * @param {ChartIndicatorSettings} indicator - The technical indicator for which the data source is to be initialized.
 * @returns {void}
 */
function initDataSource(indicator: ChartIndicatorSettings): void {
    let adPoints: Points[] = [];
    const validData: Points[] = indicator.points as Points[];
    if (validData.length > 0 && validData.length > (indicator.period as number)) {
        adPoints = calculateADPoints(indicator, validData);
    }
    setSeriesRange(adPoints, indicator);
}

/**
 * Calculates the accumulation distribution (AD) points for a technical indicator.
 *
 * @param {ChartIndicatorSettings} indicator - The technical indicator for which the AD points are calculated.
 * @param {Points[]} validData - The valid data points used for calculation.
 * @returns {Points[]} - The calculated accumulation distribution (AD) points.
 * @private
 */
function calculateADPoints(indicator: ChartIndicatorSettings, validData: Points[]): Points[] {
    const temp: Points[] = [];
    let sum: number = 0;
    let i: number = 0;
    let value: number = 0;
    let high: number = 0;
    let low: number = 0;
    let close: number = 0;
    const signalSeries: SeriesProperties = (indicator.targetSeries as SeriesProperties[])[0];
    for (i = 0; i < validData.length; i++) {
        high = Number(validData[i as number].high);
        low = Number(validData[i as number].low);
        close = Number(validData[i as number].close);
        value = ((close - low) - (high - close)) / ((high - low) ? (high - low) : 1);
        sum = sum + value * Number(validData[i as number].volume);
        temp[i as number] = getDataPoint(
            validData[i as number].x, sum, validData[i as number], signalSeries, temp.length);
    }
    return temp;
}

/**
 * Accumulation/Distribution Renderer - exported API
 */
const ADRenderer: {
    initSeriesCollection: (indicator: ChartIndicatorSettings, chart: Chart) => void;
    initDataSource: (indicator: ChartIndicatorSettings) => void;
} = {
    initSeriesCollection,
    initDataSource
};

export default ADRenderer;
