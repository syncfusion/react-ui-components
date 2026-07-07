import { useContext } from 'react';
import { Chart } from '../../base/internal-interfaces';
import { ChartContext } from '../../layout/ChartProvider';
import { useLayout } from '../../layout/LayoutContext';
import { PieChartSeriesProps } from '../../base/interfaces';
import { SanitizeHtmlHelper } from '@syncfusion/react-base';

/**
 * Renders a no-data template overlay for PieChart when all series have no data.
 *
 * The overlay is displayed only during the rendering phase when:
 * - All series have empty dataSource arrays
 * - OR DataManager is expected to load data asynchronously
 *
 * The template is positioned below the pie chart title and subtitle.
 *
 * @returns {Element | null} NoData template wrapper element or null when data is available.
 */
export const NoDataTemplateRenderer: React.FC = () => {

    const { layoutRef, phase } = useLayout();
    const { chartProps, parentElement, chartSeries } = useContext(ChartContext);

    const chart: Chart = layoutRef.current as Chart;

    const hasSeriesData: boolean = Array.isArray(chartSeries) && chartSeries.some((series: PieChartSeriesProps) => {
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

    // Render only in rendering phase when the current series data source is empty.
    if (phase !== 'rendering' || hasSeriesData || !chart || !chartProps.noDataTemplate) {
        return null;
    }

    // Title + Subtitle height calculation (Pie uses same pattern)
    const titleHeight: number = chart.titleSettings?.titleSize?.height || 0;
    const subTitleHeight: number = chart.subTitleSettings?.titleSize?.height || 0;

    const topOffset: number = titleHeight + subTitleHeight;

    return (
        <div
            id={`${parentElement?.element?.parentElement?.id || parentElement?.element?.id}_NoDataTemplate_wrapper`}
            style={{
                position: 'absolute',
                left: 0,
                top: topOffset,                          //  below title/subtitle
                width: '100%',
                height: `calc(100% - ${topOffset}px)`,   // reduced height
                display: 'flex',
                alignItems: 'center',                   //  vertical center
                justifyContent: 'center',               //  horizontal center
                pointerEvents: 'auto',
                zIndex: 1000
            }}
        >
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
