import  { useContext } from 'react';
import { useLayout } from '../layout/LayoutContext';
import { ChartContext } from '../layout/ChartProvider';
import { AxisModel, Chart, SeriesProperties } from '../chart-area/chart-interfaces';
import { ChartSeriesProps } from '../base/interfaces';
import { SanitizeHtmlHelper } from '@syncfusion/react-base';
import * as React from 'react';

/**
 * Renders a no-data template overlay when all chart series have no data.
 *
 * The overlay is displayed only during the rendering phase when:
 * - All series have empty dataSource arrays
 * - OR visibleSeries has no visiblePoints
 *
 * The template is positioned below the chart title and subtitle.
 *
 * @returns {React.ReactElement | null} NoData template wrapper element or null when data is available.
 */
export const NoDataTemplateRenderer: React.FC = () => {
    const { layoutRef, phase } = useLayout();
    const { chartProps, parentElement, chartSeries } = useContext(ChartContext);

    const chart: Chart | undefined = layoutRef.current.chart as Chart;

    const hasSeriesData: boolean = Array.isArray(chartSeries) && chartSeries.some((series: ChartSeriesProps) => {
        const dataSource: Object[] = series?.dataSource as Object[];
        if (Array.isArray(dataSource)) {
            return dataSource.length > 0;
        }
        // Check for DataManager async loading
        if (dataSource && typeof dataSource === 'object' && 'executeQuery' in dataSource) {
            return true; // DataManager will load data asynchronously
        }
        return false;
    });

    // Strict no-data check
    const isNoData: boolean = !chart ||
        !chart.visibleSeries ||
        chart.visibleSeries.length === 0 ||
        chart.visibleSeries.every((series: SeriesProperties) =>
            !series.visiblePoints || series.visiblePoints.length === 0
        ) || !hasSeriesData;

    if (phase !== 'rendering' || !isNoData || !chart || !chartProps.noDataTemplate) {
        return null;
    }

    if (isNoData) {
        chart.isZoomed = false;
        chart.isChartDrag = false;
        chart.startPanning = false;

        // Reset axis zoom state
        chart.axisCollection?.forEach((axis: AxisModel) => {
            axis.zoomFactor = 1;
            axis.zoomPosition = 0;
        });

        // Reset visible points + transforms
        chart.visibleSeries?.forEach((series: SeriesProperties) => {
            series.visiblePoints = [];
            if (series.seriesElement) {
                series.seriesElement.removeAttribute('transform');
            }
        });
    }

    // Height calculation
    const titleHeight: number = chart.titleSettings?.titleSize?.height || 0;
    const subTitleHeight: number = chart.subTitleSettings?.titleSize?.height || 0;
    const marginTop: number = chart.margin?.top || 0;

    const topOffset: number = titleHeight + subTitleHeight + marginTop;

    return (
        <div
            id={`${parentElement?.element?.parentElement?.id || parentElement?.element?.id}_NoDataTemplate_wrapper`}
            style={{
                position: 'absolute',
                left: 0,
                top: topOffset,                      // BELOW TITLE
                width: '100%',
                height: `calc(100% - ${topOffset}px)`, //  REDUCED HEIGHT
                display: 'flex',
                alignItems: 'center',               //  vertical center
                justifyContent: 'center',           //  horizontal center
                pointerEvents: 'auto',
                zIndex: 1000
            }}
        >
            {/* USER TEMPLATE CONTAINER */}
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
            >
                {typeof chartProps.noDataTemplate === 'function'
                    ? chartProps.noDataTemplate()
                    : (() => {
                        const sanitizedHtml: string = SanitizeHtmlHelper.sanitize(chartProps.noDataTemplate as string);
                        return (
                            <div
                                dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
                            />
                        );
                    })()}
            </div>
        </div>
    );
};
