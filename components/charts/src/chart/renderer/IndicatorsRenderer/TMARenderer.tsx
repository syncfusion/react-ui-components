import { defaultChartConfigs } from '../../base/default-properties';
import { Chart, ChartIndicatorSettings, Points, SeriesProperties } from '../../chart-area/chart-interfaces';
import { firstToLowerCase } from '../../utils/helper';
import { getDataPoint, setSeriesProperties, setSeriesRange } from './ChartIndicatorsBase';

/**
 * Initializes the series collection for TMA indicator.
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
        'TMA',
        indicator?.fill as string,
        indicator.width as number,
        chart
    );
};

/**
 * Defines the predictions based on TMA approach.
 *
 * @private
 * @param {ChartIndicatorSettings} indicator - The technical indicator for which the data source is to be initialized.
 * @returns {void}
 */
function initDataSource(indicator: ChartIndicatorSettings): void {
    const tmaPoints: Points[] = [];
    const field: string = firstToLowerCase(indicator.field as string);
    const xField: string = 'x';

    //prepare data
    const validData: Points[] = indicator.points as Points[];

    if (validData && validData.length && indicator.period && validData.length >= indicator.period) {

        const signalSeries: SeriesProperties = (indicator.targetSeries as SeriesProperties[])[0];
        //prepare data
        const validData: Points[] = indicator.points as Points[];
        let sum: number = 0;
        const smaValues: number[] = [];
        //sma values
        let index: number = 0;
        let length: number = validData.length;
        const period: number = indicator.period;
        while (length >= period) {
            sum = 0;
            index = validData.length - length;
            for (let j: number = index; j < index + period; j++) {
                sum = sum + Number(validData[j as number][field as keyof Points]);
            }
            sum = sum / period;
            smaValues.push(sum);
            length--;
        }

        //initial values
        for (let k: number = 0; k < period - 1; k++) {
            sum = 0;
            for (let j: number = 0; j < k + 1; j++) {
                sum = sum + Number(validData[j as number][field as keyof Points]);
            }
            sum = sum / (k + 1);
            smaValues.splice(k, 0, sum);
        }

        index = indicator.period;
        while (index <= smaValues.length) {
            sum = 0;
            for (let j: number = index - indicator.period; j < index; j++) {
                sum = sum + smaValues[j as number];
            }
            sum = sum / indicator.period;
            tmaPoints.push(getDataPoint(
                Object(validData[index - 1][xField as keyof Points]), sum, validData[index - 1], signalSeries, tmaPoints.length));
            index++;
        }
    }
    setSeriesRange(tmaPoints, indicator);
}
/**
 * TMA Renderer - exported API
 */
const TMARenderer: {
    initSeriesCollection: (indicator: ChartIndicatorSettings, chart: Chart) => void;
    initDataSource: (indicator: ChartIndicatorSettings) => void;
} = {
    initSeriesCollection,
    initDataSource
};

export default TMARenderer;
