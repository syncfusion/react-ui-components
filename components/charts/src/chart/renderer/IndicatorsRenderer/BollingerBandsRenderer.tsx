import { defaultChartConfigs } from '../../base/default-properties';
import { Chart, ChartIndicatorSettings, Points, SeriesProperties } from '../../chart-area/chart-interfaces';
import { getDataPoint, getRangePoint, setSeriesProperties, setSeriesRange } from './ChartIndicatorsBase';

/**
 * Initializes the series collection for Bollinger Bands indicator.
 * Creates range area (if enabled), signal line, upper and lower bands.
 *
 * @param {ChartIndicatorSettings} indicator - The technical indicator configuration
 * @param {Chart} chart - Parent chart reference
 * @returns {void}
 */
export const initSeriesCollection: (
    indicator: ChartIndicatorSettings,
    chart: Chart
) => void = (indicator: ChartIndicatorSettings, chart: Chart): void => {

    indicator.targetSeries = [];
    const rangeArea: SeriesProperties = {
        ...defaultChartConfigs.ChartSeries
    } as SeriesProperties;
    rangeArea.type = 'RangeArea';
    if (indicator.bandColor !== 'transparent' && indicator.bandColor !== 'none') {
        setSeriesProperties(rangeArea, indicator, 'BollingerBand', indicator?.bandColor as string, 0, chart);
    }

    const signalLine: SeriesProperties = {
        ...defaultChartConfigs.ChartSeries
    } as SeriesProperties;
    setSeriesProperties(signalLine, indicator, 'BollingerBand', indicator?.fill as string, indicator.width as number, chart);

    const upperLine: SeriesProperties = {
        ...defaultChartConfigs.ChartSeries
    } as SeriesProperties;
    setSeriesProperties(
        upperLine, indicator, 'UpperLine', indicator.upperLine?.color as string, indicator.upperLine?.width as number, chart);

    const lowerLine: SeriesProperties = {
        ...defaultChartConfigs.ChartSeries
    } as SeriesProperties;
    setSeriesProperties(
        lowerLine, indicator, 'LowerLine', indicator.lowerLine?.color as string, indicator.lowerLine?.width as number, chart);
};

/**
 * Defines the predictions using Bollinger Band Approach
 *
 * @private
 * @param {ChartIndicatorSettings} indicator - The technical indicator for which the data source is to be initialized.
 * @returns {void}
 */
function initDataSource(indicator: ChartIndicatorSettings): void {
    const enableBand: boolean = indicator.bandColor !== 'transparent' && indicator.bandColor !== 'none';
    const start: number = enableBand ? 1 : 0;
    const signalCollection: Points[] = [];
    const upperCollection: Points[] = [];
    const lowerCollection: Points[] = [];
    const bandCollection: Points[] = [];
    const upperSeries: SeriesProperties = (indicator.targetSeries as SeriesProperties[])[start + 1];
    const lowerSeries: SeriesProperties = (indicator.targetSeries as SeriesProperties[])[start + 2];
    const signalSeries: SeriesProperties = (indicator.targetSeries as SeriesProperties[])[start as number];
    const rangeAreaSeries: SeriesProperties | null = enableBand ? (indicator.targetSeries as SeriesProperties[])[0] : null;
    //prepare data
    const validData: Points[] = indicator.points as Points[];
    if (validData.length && indicator.period && validData.length >= indicator.period) {
        let sum: number = 0;
        let deviationSum: number = 0;
        const multiplier: number = indicator.standardDeviation as number;
        const limit: number = validData.length;
        const length: number = Math.round(indicator.period);
        const smaPoints: number[] = [];
        const deviations: number[] = [];
        const bollingerPoints: Object[] = [];

        for (let i: number = 0; i < length; i++) {
            sum += Number(validData[i as number].close);
        }
        let sma: number = sum / indicator.period;
        for (let i: number = 0; i < limit; i++) {
            const y: number = Number(validData[i as number].close);
            if (i >= length - 1 && i < limit) {
                if (i - indicator.period >= 0) {
                    const diff: number = y - Number(validData[i - length].close);
                    sum = sum + diff;
                    sma = sum / (indicator.period);
                    smaPoints[i as number] = sma;
                    deviations[i as number] = Math.pow(y - sma, 2);
                    deviationSum += deviations[i as number] - deviations[i - length];
                } else {
                    smaPoints[i as number] = sma;
                    deviations[i as number] = Math.pow(y - sma, 2);
                    deviationSum += deviations[i as number];
                }
                const range: number = Math.sqrt(deviationSum / (indicator.period));
                const lowerBand: number = smaPoints[i as number] - (multiplier * range);
                const upperBand: number = smaPoints[i as number] + (multiplier * range);
                if (i + 1 === length) {
                    for (let j: number = 0; j < length - 1; j++) {
                        bollingerPoints[j as number] = {
                            'X': validData[j as number].x, 'mb': smaPoints[i as number],
                            'lb': lowerBand, 'ub': upperBand, visible: true
                        };
                    }
                }
                bollingerPoints[i as number] = {
                    'X': validData[i as number].x, 'mb': smaPoints[i as number],
                    'lb': lowerBand, 'ub': upperBand, visible: true
                };
            } else {
                if (i < indicator.period - 1) {
                    smaPoints[i as number] = sma;
                    deviations[i as number] = Math.pow(y - sma, 2);
                    deviationSum += deviations[i as number];
                }
            }
        }
        let i: number = -1; let j: number = -1;
        for (let k: number = 0; k < limit; k++) {
            if (k >= (length - 1)) {
                const ub: string = 'ub';
                const lb: string = 'lb';
                const mb: string = 'mb';
                upperCollection.push(getDataPoint(
                    validData[k as number].x, bollingerPoints[k as number][ub as keyof Object], validData[k as number], upperSeries,
                    upperCollection.length));
                lowerCollection.push(getDataPoint(
                    validData[k as number].x, bollingerPoints[k as number][lb as keyof Object], validData[k as number], lowerSeries,
                    lowerCollection.length));
                signalCollection.push(getDataPoint(
                    validData[k as number].x, bollingerPoints[k as number][mb as keyof Object], validData[k as number], signalSeries,
                    signalCollection.length));
                if (enableBand) {
                    bandCollection.push(getRangePoint(
                        validData[k as number].x, upperCollection[++i].y, lowerCollection[++j].y,
                        validData[k as number], rangeAreaSeries as SeriesProperties,
                        bandCollection.length
                    ));
                }
            }
        }
    }
    if (enableBand) {
        setSeriesRange(bandCollection, indicator, (indicator.targetSeries as SeriesProperties[])[0]);
    }
    setSeriesRange(signalCollection, indicator, (indicator.targetSeries as SeriesProperties[])[start as number]);
    setSeriesRange(upperCollection, indicator, (indicator.targetSeries as SeriesProperties[])[start + 1]);
    setSeriesRange(lowerCollection, indicator, (indicator.targetSeries as SeriesProperties[])[start + 2]);
}

/**
 * Bollinger Bands Renderer - exported API
 */
const BollingerBandsRenderer: {
    initSeriesCollection: (indicator: ChartIndicatorSettings, chart: Chart) => void;
    initDataSource: (indicator: ChartIndicatorSettings) => void;
} = {
    initSeriesCollection,
    initDataSource
};

export default BollingerBandsRenderer;
