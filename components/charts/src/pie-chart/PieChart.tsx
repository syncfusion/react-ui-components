import { forwardRef, useEffect, useRef, useState, useImperativeHandle, Ref } from 'react';
import { preRender, useProviderContext } from '@syncfusion/react-base';
import { PieChartSizeProps, PieChartComponentProps } from './base/interfaces';
import { stringToNumber } from './utils/helper';
import { ChartProvider } from './layout/ChartProvider';
import { ElementWithSize } from './base/internal-interfaces';

/**
 * Extends the base chart component properties with optional lifecycle methods.
 *
 */
export interface IPieChart extends PieChartComponentProps {

    /**
     * Reference to the pie chart's root HTML element.
     *
     * @private
     */
    element?: HTMLElement | null;
}

/**
 * The React Pie Chart component is used to visualize data as slices of a circle, where each slice represents a proportion of the whole dataset.
 * It supports interactive features such as tooltips, legends, data labels, and animations, making it ideal for displaying percentage or categorical data.
 *
 * ```typescript
 * import { PieChart, PieChartLegend, PieChartTitle,,PieChartTooltip, PieChartSeriesCollection, PieChartSeries } from '@syncfusion/react-charts';
 *
 * <PieChart>
 *     <PieChartSeriesCollection>
 *         <PieChartSeries  xField={'x'} yField='y' dataSource={data}></PieChartSeries>
 *     </PieChartSeriesCollection>
 *     <PieChartTitle title='Pie Chart'></PieChartTitle>
 *     <PieChartTooltip enable={true}></PieChartTooltip>
 *     <PieChartLegend visible={true}></PieChartLegend>
 * </PieChart>
 * ```
 */
export const PieChart: React.ForwardRefExoticComponent<PieChartComponentProps & React.RefAttributes<IPieChart>> =
    forwardRef<IPieChart, PieChartComponentProps>((props: PieChartComponentProps, ref: Ref<IPieChart>) => {

        const chartRef: React.RefObject<HTMLDivElement | null> = useRef<HTMLDivElement>(null);
        const { dir } = useProviderContext();
        const [element, setElement] = useState<ElementWithSize | null>(null);
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
            container.id = sanitizeElementIds(container.id);
            const availableSize: PieChartSizeProps = {
                width: stringToNumber(props.width, containerWidth) || containerWidth,
                height: stringToNumber(props.height, containerHeight) || containerHeight
            };
            if (!container.classList.contains('sf-chart-focused')) {
                container.classList.add('sf-chart-focused');
            }
            setElement({ element: container, availableSize });
        }, [props.height, props.width]);

        useImperativeHandle(ref, () => ({
            element: chartRef.current
        }), []);

        useEffect(() => {
            preRender('piechart');
        }, []);

        const chartProps: PieChartComponentProps = { ...props };
        chartProps.accessibility = { ...props.accessibility };
        return (
            (
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
                        <ChartProvider chartProps={chartProps} parentElement={element} />
                    )}
                </div>
            )
        );
    });

export default PieChart;

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
export function sanitizeElementIds(elementId: string): string {
    if (elementId === '') {
        const uniqueSuffix: number = Math.floor(Math.random() * 1000000);
        const childElementId: string = `piechart_${uniqueSuffix}`;
        return childElementId;
    }
    else {
        return elementId;
    }
}
