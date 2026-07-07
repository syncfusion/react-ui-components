import { defaultChartConfigs } from '../../base/default-properties';
import { Chart, ChartIndicatorSettings, Points, SeriesProperties } from '../../chart-area/chart-interfaces';
import { getDataPoint, setSeriesProperties, setSeriesRange } from './ChartIndicatorsBase';

/**
 * Initializes the series collection for Momentum indicator.
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

    // Momentum line
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

    // Upper reference line (100 baseline)
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
};

/**
 * Defines the predictions using momentum approach
 *
 * @private
 * @param {ChartIndicatorSettings} indicator - The technical indicator for which the data source is to be initialized.
 * @returns {void}
 */
function initDataSource(indicator: ChartIndicatorSettings): void {
    const upperCollection: Points[] = [];
    const signalCollection: Points[] = [];

    const validData: Points[] = indicator.points as Points[];

    if (validData && validData.length) {
        const upperSeries: SeriesProperties = (indicator.targetSeries as SeriesProperties[])[1];
        const signalSeries: SeriesProperties = (indicator.targetSeries as SeriesProperties[])[0];

        const length: number = indicator.period as number;
        if (validData.length >= (indicator.period as number)) {
            for (let i: number = 0; i < validData.length; i++) {
                upperCollection.push(getDataPoint(
                    validData[i as number].x, 100, validData[i as number], upperSeries, upperCollection.length));
                if (!(i < length)) {
                    signalCollection.push(getDataPoint(
                        validData[i as number].x,
                        (Number(validData[i as number].close) / Number(validData[i - length].close) * 100),
                        validData[i as number], signalSeries, signalCollection.length));
                }
            }
        }
        setSeriesRange(signalCollection, indicator, (indicator.targetSeries as SeriesProperties[])[0]);
        setSeriesRange(upperCollection, indicator, (indicator.targetSeries as SeriesProperties[])[1]);
    }
}

/**
 * Momentum Renderer - exported API
 */
const MomentumRenderer: {
    initSeriesCollection: (indicator: ChartIndicatorSettings, chart: Chart) => void;
    initDataSource: (indicator: ChartIndicatorSettings) => void;
} = {
    initSeriesCollection,
    initDataSource
};

export default MomentumRenderer;
