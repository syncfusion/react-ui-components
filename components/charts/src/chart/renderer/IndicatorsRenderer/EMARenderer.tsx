import { defaultChartConfigs } from '../../base/default-properties';
import { Chart, ChartIndicatorSettings, Points, SeriesProperties } from '../../chart-area/chart-interfaces';
import { firstToLowerCase } from '../../utils/helper';
import { getDataPoint, setSeriesProperties, setSeriesRange } from './ChartIndicatorsBase';

/**
 * Initializes the series collection for EMA indicator.
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
        'EMA',
        indicator?.fill as string,
        indicator.width as number,
        chart
    );
};

/**
 * Defines the predictions based on EMA approach.
 *
 * @private
 * @param {ChartIndicatorSettings} indicator - The technical indicator for which the data source is to be initialized.
 * @returns {void}
 */
function initDataSource(indicator: ChartIndicatorSettings): void {
    const field: string = firstToLowerCase(indicator.field as string);
    const xField: string = 'x';
    const emaPoints: Points[] = [];
    const signalSeries: SeriesProperties = (indicator.targetSeries as SeriesProperties[])[0];

    //prepare data
    const validData: Points[] = indicator.points as Points[];

    if (validData && validData.length && validData.length >= (indicator.period as number)) {

        //find initial average
        let sum: number = 0;
        let average: number = 0;

        //smoothing factor
        const k: number = (2 / ((indicator.period as number) + 1));

        for (let i: number = 0; i < (indicator.period as number); i++) {
            sum += Number(validData[i as number][field as keyof Points]);
        }

        average = sum / (indicator.period as number);

        emaPoints.push(getDataPoint(
            Object(validData[(indicator.period as number) - 1][xField as keyof Points]), average,
            validData[(indicator.period as number) - 1], signalSeries, emaPoints.length));

        let index: number = indicator.period as number;
        while (index < validData.length) {
            //previous average
            const prevAverage: number = Number(emaPoints[index - (indicator.period as number)][signalSeries.yField as keyof Points]);

            const yValue: number = (Number(validData[index as number][field as keyof Points]) - prevAverage) * k + prevAverage;

            emaPoints.push(getDataPoint(
                Object(validData[index as number][xField as keyof Points]), yValue,
                validData[index as number], signalSeries, emaPoints.length));

            index++;
        }
    }
    setSeriesRange(emaPoints, indicator);
}

/**
 * EMA Renderer - exported API
 */
const EMARenderer: {
    initSeriesCollection: (indicator: ChartIndicatorSettings, chart: Chart) => void;
    initDataSource: (indicator: ChartIndicatorSettings) => void;
} = {
    initSeriesCollection,
    initDataSource
};

export default EMARenderer;
