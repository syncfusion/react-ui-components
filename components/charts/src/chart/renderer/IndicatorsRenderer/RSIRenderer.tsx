import { defaultChartConfigs } from '../../base/default-properties';
import { Chart, ChartIndicatorSettings, Points, SeriesProperties } from '../../chart-area/chart-interfaces';
import { getDataPoint, setSeriesProperties, setSeriesRange } from './ChartIndicatorsBase';

/**
 * Initializes the series collection for RSI indicator.
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

    // RSI signal line
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

    // Upper & lower zone lines
    if (indicator.showZones) {
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
    }
};

/**
 * Defines the predictions using RSI approach
 *
 * @private
 * @param {ChartIndicatorSettings} indicator - The technical indicator for which the data source is to be initialized.
 * @returns {void}
 */
function initDataSource(indicator: ChartIndicatorSettings): void {
    const signalCollection: Points[] = [];
    const lowerCollection: Points[] = [];
    const upperCollection: Points[] = [];
    const signalSeries: SeriesProperties = (indicator.targetSeries as SeriesProperties[])[0];

    //prepare data
    const validData: Points[] = indicator.points as Points[];

    if (validData.length && validData.length > (indicator.period as number)) {

        //Find upper band and lower band values
        if (indicator.showZones) {
            for (let i: number = 0; i < validData.length; i++) {
                upperCollection.push(getDataPoint(
                    validData[i as number].x, indicator.overBought as number, validData[i as number]
                    , (indicator.targetSeries as SeriesProperties[])[1],
                    upperCollection.length));
                lowerCollection.push(getDataPoint(
                    validData[i as number].x, indicator.overSold as number, validData[i as number]
                    , (indicator.targetSeries as SeriesProperties[])[2],
                    lowerCollection.length));
            }
        }
        //Find signal line value
        let prevClose: number = Number(validData[0].close);
        let gain: number = 0;
        let loss: number = 0;
        for (let i: number = 1; i <= (indicator.period as number); i++) {
            const close: number = Number(validData[i as number].close);
            if (close > prevClose) {
                gain += close - prevClose;
            } else {
                loss += prevClose - close;
            }
            prevClose = close;
        }
        gain = gain / (indicator.period as number);
        loss = loss / (indicator.period as number);

        signalCollection.push(getDataPoint(
            validData[indicator.period as number].x, 100 - (100 / (1 + gain / loss)), validData[indicator.period as number],
            signalSeries, signalCollection.length));

        for (let j: number = (indicator.period as number) + 1; j < validData.length; j++) {
            const close: number = Number(validData[j as number].close);
            if (close > prevClose) {
                gain = (gain * ((indicator.period as number) - 1) + (close - prevClose)) / (indicator.period as number);
                loss = (loss * ((indicator.period as number) - 1)) / (indicator.period as number);
            } else if (close < prevClose) {
                loss = (loss * ((indicator.period as number) - 1) + (prevClose - close)) / (indicator.period as number);
                gain = (gain * ((indicator.period as number) - 1)) / (indicator.period as number);
            }
            prevClose = close;
            signalCollection.push(getDataPoint(
                validData[j as number].x, 100 - (100 / (1 + gain / loss)), validData[j as number], signalSeries,
                signalCollection.length));
        }
    }
    setSeriesRange(signalCollection, indicator, (indicator.targetSeries as SeriesProperties[])[0]);
    if (indicator.showZones) {
        setSeriesRange(upperCollection, indicator, (indicator.targetSeries as SeriesProperties[])[1]);
        setSeriesRange(lowerCollection, indicator, (indicator.targetSeries as SeriesProperties[])[2]);
    }
}
/**
 * RSI Renderer - exported API
 */
const RSIRenderer: {
    initSeriesCollection: (indicator: ChartIndicatorSettings, chart: Chart) => void;
    initDataSource: (indicator: ChartIndicatorSettings) => void;
} = {
    initSeriesCollection,
    initDataSource
};

export default RSIRenderer;
