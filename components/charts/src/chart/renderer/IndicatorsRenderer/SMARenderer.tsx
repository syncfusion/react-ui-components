import { defaultChartConfigs } from '../../base/default-properties';
import { Chart, ChartIndicatorSettings, Points, SeriesProperties } from '../../chart-area/chart-interfaces';
import { firstToLowerCase } from '../../utils/helper';
import { getDataPoint, setSeriesProperties, setSeriesRange } from './ChartIndicatorsBase';

/**
 * Initializes the series collection for SMA indicator.
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
        'SMA',
        indicator?.fill as string,
        indicator.width as number,
        chart
    );
};

/**
 * Defines the predictions based on SMA approach.
 *
 * @private
 * @param {ChartIndicatorSettings} indicator - The technical indicator for which the data source is to be initialized.
 * @returns {void}
 */
function initDataSource(indicator: ChartIndicatorSettings): void {
    const smaPoints: Points[] = [];
    const points: Points[] = indicator.points as Points[];
    if (points && points.length) {
        //prepare data
        const validData: Points[] = points;
        const field: string = firstToLowerCase(indicator.field as string);
        const xField: string = 'x';

        const signalSeries: SeriesProperties = (indicator.targetSeries as SeriesProperties[])[0];

        if (validData && validData.length && validData.length >= (indicator.period as number)) {
            //find initial average
            let average: number = 0;
            let sum: number = 0;

            for (let i: number = 0; i < (indicator.period as number); i++) {
                sum += Number(validData[i as number][field as keyof Points]);
            }

            average = sum / (indicator.period as number);

            smaPoints.push(getDataPoint(
                Object(validData[(indicator.period as number) - 1][xField as keyof Points])
                , average, validData[(indicator.period as number) - 1],
                signalSeries, smaPoints.length));

            let index: number = (indicator.period as number);
            while (index < validData.length) {
                sum -= Number(validData[index - (indicator.period as number)][field as keyof Points]);
                sum += Number(validData[index as number][field as keyof Points]);
                average = sum / (indicator.period as number);
                smaPoints.push(getDataPoint(
                    Object(validData[index as number][xField as keyof Points]), average, validData[index as number],
                    signalSeries, smaPoints.length));
                index++;
            }
        }
        setSeriesRange(smaPoints, indicator);
    }
}


/**
 * SMA Renderer - exported API
 */
const SMARenderer: {
    initSeriesCollection: (indicator: ChartIndicatorSettings, chart: Chart) => void;
    initDataSource: (indicator: ChartIndicatorSettings) => void;
} = {
    initSeriesCollection,
    initDataSource
};

export default SMARenderer;
