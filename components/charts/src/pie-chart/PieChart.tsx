import { forwardRef, useEffect, useRef, useState, useImperativeHandle, Ref } from 'react';
import { preRender, useProviderContext } from '@syncfusion/react-base';
import { PieChartSizeProps, PieChartComponentProps } from './base/interfaces';
import { stringToNumber } from './utils/helper';
import { ChartProvider } from './layout/ChartProvider';
import { ElementWithSize } from './base/internal-interfaces';
import { ExportSourceContext } from '../common/interfaces';
import type { ExportSource } from '../common/interfaces';

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

    /**
     * Returns the latest snapshot of the PieChart's post-process state,
     * published by the renderer during the `useLayoutEffect` commit.
     *
     * `undefined` until the first layout commit has run.
     *
     * @returns {ExportSource | undefined}
     * Current export snapshot, or `undefined` when unmeasured.
     *
     * @private
     */
    getExportSource?: () => ExportSource | undefined;
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
        // Stores the latest processed data for spreadsheet export.
        const exportSourceRef: React.MutableRefObject<ExportSource | undefined> =
            useRef<ExportSource | undefined>(undefined);
        const { dir } = useProviderContext();
        const [element, setElement] = useState<ElementWithSize | null>(null);
        useEffect(() => {
            const container: HTMLDivElement = chartRef.current as HTMLDivElement;
            container.style.touchAction = 'element';
            container.style.userSelect = 'none';
            container.style.webkitUserSelect = 'none';
            container.style.position = 'relative';
            container.style.display = 'block';
            // Apply width and height props to the container div
            if (props.width && props.width.indexOf('%') > -1) {
                container.style.width = props.width;
            }
            if (props.height && props.height.indexOf('%') > -1) {
                container.style.height = props.height;
            }
            // If no explicit height prop provided, inherit from parent
            if (!props.height) {
                container.style.height = 'inherit';
            }
            const containerWidth: number = container?.clientWidth || container?.offsetWidth || 600;
            const containerHeight: number = container?.clientHeight || 450;
            container.id = sanitizeElementIds(container.id);
            const availableSize: PieChartSizeProps = {
                width: (props.width && props.width.indexOf('%') > -1) ? containerWidth : (stringToNumber(props.width, containerWidth) || containerWidth),
                height: stringToNumber(props.height, containerHeight) || containerHeight
            };
            if (!container.classList.contains('sf-chart-focused')) {
                container.classList.add('sf-chart-focused');
            }
            setElement({ element: container, availableSize });
        }, [props.height, props.width, props.background]);

        useImperativeHandle(ref, () => ({
            element: chartRef.current,
            theme: props.theme || 'Material',
            getExportSource: (): ExportSource | undefined => exportSourceRef.current
        }), [props.theme]);

        useEffect(() => {
            preRender('piechart');
        }, []);

        const chartProps: PieChartComponentProps = { ...props };
        chartProps.accessibility = { ...props.accessibility };
        return (
            (
                <ExportSourceContext.Provider value={exportSourceRef}>
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
                </ExportSourceContext.Provider>
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
