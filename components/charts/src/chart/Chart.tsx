import { forwardRef, useEffect, useRef, useState, useImperativeHandle, Ref } from 'react';
import { ChartProvider } from './layout/ChartProvider';
import { ChartComponentProps } from './base/interfaces';
import { stringToNumber } from './utils/helper';
import { defaultChartConfigs } from './base/default-properties';
import { preRender, useProviderContext } from '@syncfusion/react-base';
import { ElementWithSize, ChartSizeProps } from './chart-area/chart-interfaces';

/**
 * Extends the base chart component properties with optional lifecycle methods.
 *
 */
export interface IChart extends ChartComponentProps {
    /**
     * Optional method to clean up or destroy the chart instance.
     * Can be used to release resources or detach event listeners when the chart is no longer needed.
     *
     * @private
     */
    destroy?: () => void;
}

/**
 * **The React Chart component** enables developers to visualize data through a wide range of interactive and customizable chart types.
 * It supports real-time updates, responsive layouts, and efficient rendering of large datasets for modern web applications.
 *
 * ```typescript
 * import { Chart, ChartPrimaryXAxis, ChartSeries, ChartSeriesCollection } from '@syncfusion/react-charts';
 *
 * <Chart >
 *   <ChartPrimaryXAxis valueType='Category' />
 *   <ChartSeriesCollection>
 *     <ChartSeries dataSource={categoryData} xField="x" yField="y" type="Line" />
 *   </ChartSeriesCollection>
 * </Chart>
 * ```
 */
export const Chart: React.ForwardRefExoticComponent<ChartComponentProps & React.RefAttributes<IChart>> =
    forwardRef<IChart, ChartComponentProps>((props: ChartComponentProps, ref: Ref<IChart>) => {

        const chartRef: React.RefObject<HTMLDivElement | null> = useRef<HTMLDivElement>(null);
        const { dir } = useProviderContext();
        const [element, setElement] = useState<ElementWithSize | null>(null);
        const [isDestroyed, setIsDestroyed] = useState(false);
        useEffect(() => {
            const container: HTMLDivElement = chartRef.current as HTMLDivElement;
            container.style.touchAction = 'element';
            container.style.userSelect = 'none';
            container.style.webkitUserSelect = 'none';
            container.style.position = 'relative';
            container.style.display = 'block';
            container.style.height = 'inherit';
            const containerWidth: number = container?.clientWidth || container?.offsetWidth || 600;
            const containerHeight: number = container?.clientHeight || 450;
            container.id = sanitizeElementId(container.id);
            const availableSize: ChartSizeProps = {
                width: stringToNumber(props.width, containerWidth) || containerWidth,
                height: stringToNumber(props.height, containerHeight) || containerHeight
            };
            if (!container.classList.contains('sf-chart-focused')) {
                container.classList.add('sf-chart-focused');
            }
            setElement({ element: container, availableSize });
        }, [props.height, props.width]);

        useImperativeHandle(ref, () => ({
            destroy: () => { setIsDestroyed(true); }
        }), []);

        useEffect(() => {
            preRender('chart');
        }, []);

        const chartProps: ChartComponentProps = { ...defaultChartConfigs.chart, ...props };
        chartProps.accessibility = { ...defaultChartConfigs.accessibility, ...props.accessibility };
        return (
            !isDestroyed && (
                <div ref={chartRef}
                    dir={dir}
                    id={props.id}
                    className="sf-control sf-chart sf-lib sf-touch"
                    aria-label={chartProps.accessibility?.ariaLabel || '. Syncfusion interactive chart.'}
                    role={chartProps.accessibility?.role || 'region'}
                    tabIndex={chartProps.accessibility?.focusable ? (chartProps.accessibility?.tabIndex) : -1}
                    style={{ outline: 'none' }}
                >
                    {element && (
                        <ChartProvider props={chartProps} parentElement={element} />
                    )}
                </div>
            )
        );
    });

export default Chart;

/**
 * Sanitizes and returns a valid element ID for a chart.
 *
 * - If the `elementId` is an empty string, it generates a unique ID based on a static chart ID and
 *   the current number of `.sf-chart` elements in the DOM.
 *
 * @param {string} elementId - The input element ID to sanitize or use for generating a unique one.
 * @returns {string} A valid and unique element ID string safe for use in the DOM.
 * @private
 */
export function sanitizeElementId(elementId: string): string {
    if (elementId === '') {
        const uniqueSuffix: number = Math.floor(Math.random() * 1000000);
        const childElementId: string = `chart_${uniqueSuffix}`;
        return childElementId;
    }
    else {
        return elementId;
    }
}
