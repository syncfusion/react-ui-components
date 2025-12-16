import * as React from 'react';
import {
    useEffect,
    useLayoutEffect,
    useMemo,
    useState
} from 'react';
import {
    DateFormatOptions,
    HorizontalAlignment,
    VerticalAlignment,
    getDateParser,
    getDateFormat,
    SanitizeHtmlHelper
} from '@syncfusion/react-base';
import { DataUtil } from '@syncfusion/react-data';
import {
    AxisModel,
    Chart,
    ChartSizeProps,
    Rect,
    SeriesProperties
} from '../chart-area/chart-interfaces';
import { ChartAnnotationProps, ChartLocationProps, SeriesAccessibility } from '../base/interfaces';
import { useLayout } from '../layout/LayoutContext';
import { withIn, logBase, getPoint, stringToNumber } from '../utils/helper';

/**
 * Internal result shape that mirrors the "options" pattern in stack labels.
 * We keep the existing rendering shape but compute and store all values ahead of render.
 */
interface AnnotationRendererResults {
    id: string;
    left: number;
    top: number;
    width: number;
    height: number;
    visible: boolean;
    contentHtml: string;
    ariaLabel: string;
    role: string;
    tabIndex: number;
}

/**
 * Determines whether the given content string contains HTML markup.
 *
 * Heuristic:
 * - Trims the string and checks if it starts with "<"
 * - Verifies presence of an HTML-like tag using a regex
 *
 * @param {string | null | undefined} content - The annotation content to evaluate.
 * @returns {boolean} True if the content appears to be HTML; otherwise, false.
 * @private
 */
export function isHtmlContent(content?: string | null): boolean {
    if (!content) { return false; }
    const textElement: string = String(content).trim();
    return (textElement.startsWith('<') && /<\/?[a-z][\s\S]*>/i.test(textElement));
}

/**
 * Calculates position based on alignment parameters
 * @param {HorizontalAlignment | VerticalAlignment | undefined} alignment - Horizontal or vertical alignment
 * @param {number} size - Size value in direction to align
 * @param {number} value - Base coordinate value
 * @returns {number} Adjusted coordinate position
 */
function setAlignmentValue(
    alignment: HorizontalAlignment | VerticalAlignment | undefined,
    size: number,
    value: number
): number {
    switch (alignment) {
    case 'Top':
    case 'Left':
        return value - size;
    case 'Bottom':
    case 'Right':
        return value;
    case 'Center':
        return value - size / 2;
    default:
        return value;
    }
}

/**
 * Calculates pixel-based annotation position
 *
 * @param {Chart} control - Chart control instance
 * @param {ChartAnnotationProps} annotation - Annotation properties containing position info
 * @param {ChartLocationProps} location - Output parameter for calculated location
 * @returns {boolean} True if position is valid, false otherwise
 */
function setAnnotationPixelValue(
    control: Chart,
    annotation: ChartAnnotationProps,
    location: ChartLocationProps
): boolean {
    const rect: Rect = {
        x: 0,
        y: 0,
        width: control.availableSize.width,
        height: control.availableSize.height
    };
    location.x =
        (typeof annotation.x !== 'string'
            ? (typeof annotation.x === 'number'
                ? (annotation.x as number)
                : 0)
            : stringToNumber(annotation.x as string, rect.width)
        ) + rect.x;
    location.y =
        (typeof annotation.y === 'number'
            ? (annotation.y as number)
            : stringToNumber(annotation.y as string, rect.height)
        ) + rect.y;
    return true;
}

/**
 * Measures the rendered width and height of an HTML snippet by temporarily
 * injecting it into an off-screen container and reading its layout box.
 *
 * The returned values are in pixels and clamped to a minimum of 1 to avoid
 * zero-sized results in headless/JSDOM environments.
 *
 * @param {string} html - The HTML markup to measure.
 * @returns {ChartSizeProps} The measured size in pixels.
 */
function measureAnnotationHtml(html: string): ChartSizeProps {
    const container: HTMLElement = document.createElement('div');
    container.style.position = 'absolute';
    container.style.visibility = 'hidden';
    container.style.pointerEvents = 'none';
    container.style.left = '-10000px';
    container.style.top = '-10000px';
    container.style.whiteSpace = 'normal';
    container.style.display = 'inline-block';
    container.innerHTML = html || '';

    document.body.appendChild(container);
    const rect: Rect = container.getBoundingClientRect();
    const width: number = Math.max(1, Math.round(rect.width));
    const height: number = Math.max(1, Math.round(rect.height));
    document.body.removeChild(container);

    return { width, height };
}

/**
 * Calculates data point-based annotation position
 *
 * @param {Chart} chart - Chart instance
 * @param {ChartAnnotationProps} annotation - Annotation properties
 * @param {ChartLocationProps} location - Output parameter for calculated location
 * @returns {boolean} True if position is valid, false otherwise
 */
function setAnnotationPointValueChart(
    chart: Chart,
    annotation: ChartAnnotationProps,
    location: ChartLocationProps
): boolean {
    let symbolLocation: ChartLocationProps = { x: 0, y: 0 };
    const xAxisName: string | undefined | null = annotation.xAxisName as string | undefined | null;
    const yAxisName: string | undefined | null = annotation.yAxisName as string | undefined | null;
    const isInverted: boolean = chart.requireInvertedAxis as boolean;

    let xAxis: AxisModel | undefined;
    let yAxis: AxisModel | undefined;
    let xValue: number = 0;

    for (const axis of chart.axisCollection as AxisModel[]) {
        if (xAxisName === axis.name || (xAxisName == null && axis.name === 'primaryXAxis')) {
            xAxis = axis;

            if (xAxis.indexed as boolean) {
                xValue = Number(annotation.x);
            } else if ((xAxis.valueType as string | undefined)?.includes('Category')) {
                const xAnnotation: string = annotation.x as string;

                if ((xAxis.labels as string[]).includes(xAnnotation)) {
                    xValue = (xAxis.labels as string[]).indexOf(xAnnotation);
                } else {
                    return false;
                }
            } else if (xAxis.valueType === 'DateTime') {
                const option: DateFormatOptions = { skeleton: 'full', type: 'dateTime' };
                xValue = typeof annotation.x === 'object'
                    ? Date.parse(
                        getDateParser(option)(
                            getDateFormat(option)(
                                new Date(
                                    (DataUtil.parse as Required<typeof DataUtil.parse>).parseJson(
                                        { val: annotation.x as object }).val as string | number | Date
                                )
                            )
                        )
                    )
                    : 0;
            } else {
                xValue = Number(annotation.x);
            }
        } else if (yAxisName === axis.name || (yAxisName == null && axis.name === 'primaryYAxis')) {
            yAxis = axis;
        }
    }

    if (xAxis && yAxis) {
        const xValueToCheck: number = xAxis.valueType === 'Logarithmic'
            ? logBase(xValue, Number(xAxis.logBase))
            : xValue;

        const yValue: number = Number(annotation.y);
        const yValueToCheck: number = yAxis.valueType === 'Logarithmic'
            ? logBase(yValue, Number(yAxis.logBase))
            : yValue;

        if (withIn(xValueToCheck, xAxis.visibleRange) && withIn(yValueToCheck, yAxis.visibleRange)) {
            const computedPoint: ChartLocationProps = getPoint(xValue, yValue, xAxis, yAxis, isInverted);
            symbolLocation = computedPoint;
            location.x = symbolLocation.x + (isInverted ? (yAxis.rect as Rect).x : (xAxis.rect as Rect).x);
            location.y = symbolLocation.y + (isInverted ? (xAxis.rect as Rect).y : (yAxis.rect as Rect).y);
            return true;
        }
    }
    return false;
}

/**
 * Computes the render-time options for all annotations.
 *
 * This function mirrors the structural approach used for stack labels by
 * precomputing annotation positions, sizes, sanitized HTML, and accessibility
 * metadata. It returns a list of options that the renderer uses to produce
 * the final SVG/HTML output.
 *
 * It does not mutate the chart instance and does not rely on external state.
 *
 * @param {Chart} chart - Chart instance providing layout, axis, and size information.
 * @param {ChartAnnotationProps[]} annotations - The annotation configuration list.
 * @param {(HTMLDivElement | null)[]} htmlDivs - References to HTML divs for measurement when available.
 * @returns {AnnotationRendererResults[]} Computed options for rendering annotations.
 * @internal
 */
function renderAnnotations(
    chart: Chart,
    annotations: ChartAnnotationProps[]
): AnnotationRendererResults[] {
    const results: AnnotationRendererResults[] = [];

    for (let index: number = 0; index < annotations.length; index++) {
        const annotation: ChartAnnotationProps = annotations[index as number];
        const location: ChartLocationProps = { x: 0, y: 0 };
        const isValidPosition: boolean = annotation.coordinateUnit === 'Pixel'
            ? setAnnotationPixelValue(chart as Chart, annotation, location)
            : setAnnotationPointValueChart(chart as Chart, annotation, location);

        const id: string = `${(chart.element as HTMLElement).id}_Annotation_${index}`;
        const annotationAccessibility: SeriesAccessibility | undefined = annotation.accessibility;
        const ariaLabel: string = (annotationAccessibility?.ariaLabel as string | undefined) || '';
        const role: string = (annotationAccessibility?.role as string | undefined) || 'img';
        const tabIndex: number = annotationAccessibility?.focusable ? (annotationAccessibility?.tabIndex ?? 0) : -1;

        if (!isValidPosition) {
            results.push({
                id,
                left: 0,
                top: 0,
                width: 1,
                height: 1,
                visible: false,
                contentHtml: '',
                ariaLabel,
                role,
                tabIndex
            });
            continue;
        }

        const rawHtmlContent: string | undefined = annotation.content;
        const sanitizedHtml: string | undefined = SanitizeHtmlHelper.sanitize(rawHtmlContent as string);

        if (!sanitizedHtml) {
            results.push({
                id,
                left: 0,
                top: 0,
                width: 1,
                height: 1,
                visible: false,
                contentHtml: '',
                ariaLabel,
                role,
                tabIndex
            });
            continue;
        }

        const size: ChartSizeProps = sanitizedHtml ? measureAnnotationHtml(sanitizedHtml) : { width: 1, height: 1 };
        const measuredWidth: number = size.width;
        const measuredHeight: number = size.height;
        const left: number = setAlignmentValue(annotation.hAlign, measuredWidth, location.x);
        const top: number = setAlignmentValue(annotation.vAlign, measuredHeight, location.y);

        results.push({
            id,
            left: left,
            top: top,
            width: Math.max(1, measuredWidth),
            height: Math.max(1, measuredHeight),
            visible: true,
            contentHtml: sanitizedHtml,
            ariaLabel,
            role,
            tabIndex
        });
    }

    return results;
}

/**
 * Renders the HTML container and absolutely positioned children for chart annotations.
 * Use this when you already have precomputed annotation layout options.
 *
 * The returned element is a normal HTML div (not SVG) with position: relative.
 * Each annotation is rendered as an absolutely positioned child based on the
 * provided options. Visibility is controlled using the chart's series animation
 * state in combination with the given animationProgress.
 *
 * @param {Chart} chart - The chart instance used for id generation and animation checks.
 * @param {AnnotationRendererResults[]} annotationOptions - Precomputed annotation render options.
 * @param {number} animationProgress - Normalized animation progress (0 to 1).
 * @returns {React.JSX.Element | null} A container div with annotation elements, or null if none.
 * @private
 */
export function renderAnnotationTemplates(
    chart: Chart,
    annotationOptions: AnnotationRendererResults[],
    animationProgress: number
): React.JSX.Element | null {
    if (!chart || !annotationOptions?.length) { return null; }

    const containerId: string = chart?.element?.id
        ? `${(chart.element as HTMLElement).id}_AnnotationTemplate_Collections`
        : 'AnnotationTemplate_Collections';

    const animationEnabled: boolean = Boolean(
        chart?.visibleSeries &&
        Array.isArray(chart.visibleSeries) &&
        (chart.visibleSeries as SeriesProperties[]).some(
            (series: SeriesProperties) => series?.animation?.enable === true
        )
    );

    return (
        <div
            id={containerId}
            style={{
                position: 'relative',
                visibility: (animationProgress === 1 || !animationEnabled) ? 'visible' : 'hidden'
            }}
        >
            {annotationOptions.map((option: AnnotationRendererResults, index: number) => {
                if (!option.visible) { return null; }

                return (
                    <div
                        key={index}
                        id={`${(chart.element as HTMLElement).id}_AnnotationTemplate_${index}`}
                        role={option.role}
                        aria-label={option.ariaLabel}
                        tabIndex={option.tabIndex}
                        style={{
                            outline: 'none',
                            position: 'absolute',
                            display: 'inline-block',
                            left: option.left,
                            top: option.top
                        }}
                    >
                        <div
                            style={{ display: 'inline-block' }}
                            dangerouslySetInnerHTML={{ __html: option.contentHtml }}
                        />
                    </div>
                );
            })}
        </div>
    );
}

/**
 * Computes annotation layout and returns the annotation HTML container in a single call.
 * Intended for use from the layout layer so annotations can be placed before the SVG.
 *
 * Internally, this:
 * - Calculates positions/sizes for all annotations
 * - Builds a positioned HTML container with children for each visible annotation
 * - Controls visibility based on series animation state and the provided animationProgress
 *
 * @param {Chart} chart - The chart instance used to derive size, axes, id, and animation state.
 * @param {ChartAnnotationProps[]} annotations - The raw annotation configuration array.
 * @param {number} animationProgress - Normalized animation progress (0 to 1).
 * @returns {React.JSX.Element | null} The rendered annotation container or null if nothing to render.
 * @private
 */
export function renderChartAnnotations(
    chart: Chart,
    annotations: ChartAnnotationProps[],
    animationProgress: number
): React.JSX.Element | null {
    if (!chart || !annotations?.length) { return null; }

    const htmlAnnotations: ChartAnnotationProps[] = annotations.filter(
        (annotationItem: ChartAnnotationProps) => isHtmlContent(annotationItem.content as string)
    );
    if (!htmlAnnotations.length) { return null; }

    const options: AnnotationRendererResults[] = renderAnnotations(chart, htmlAnnotations);
    if (!options?.length) { return null; }
    return renderAnnotationTemplates(chart, options, animationProgress);
}

/**
 * Renders chart annotations with proper positioning and types
 *
 * @param {ChartAnnotationProps[]} props - Array of annotation properties
 * @returns {JSX.Element} HTML container containing all annotations
 */
export const ChartAnnotationRenderer: React.FC<ChartAnnotationProps[]> = (props: ChartAnnotationProps[] ): React.JSX.Element | null => {
    const { layoutRef, reportMeasured, phase, animationProgress } = useLayout();

    const annotations: ChartAnnotationProps[] = useMemo((): ChartAnnotationProps[] => {
        return Object.keys(props)
            .filter((keyStr: string): boolean => !isNaN(Number(keyStr)))
            .map((keyStr: string): ChartAnnotationProps => props[Number(keyStr)])
            .filter((annotationItem: ChartAnnotationProps) => !isHtmlContent(annotationItem.content as string));
    }, [props]);

    const annotationsKey: string = useMemo(() => {
        return annotations.map((annotation: ChartAnnotationProps) => [
            annotation.x, annotation.y, annotation.content,
            annotation.hAlign, annotation.vAlign,
            annotation.coordinateUnit,
            annotation.xAxisName, annotation.yAxisName,
            annotation.accessibility?.ariaLabel,
            annotation.accessibility?.role,
            annotation.accessibility?.focusable,
            annotation.accessibility?.tabIndex
        ].join('|')).join('||');
    }, [annotations]);

    const [annotationOptions, setAnnotationOptions] = useState<AnnotationRendererResults[] | null>(null);

    useEffect((): void => {
        if (phase !== 'measuring' && layoutRef.current?.chart as Chart && annotations.length > 0) {
            const computed: AnnotationRendererResults[] = renderAnnotations(
                layoutRef.current?.chart as Chart,
                annotations
            );

            setAnnotationOptions(computed);
            reportMeasured('ChartAnnotations');
        }
    }, [annotationsKey]);

    useLayoutEffect((): void => {
        if ((phase === 'measuring')) {
            if (layoutRef.current?.chart as Chart && annotations.length > 0) {
                const computed: AnnotationRendererResults[] = renderAnnotations(
                    layoutRef.current?.chart as Chart,
                    annotations
                );

                setAnnotationOptions(computed);
                reportMeasured('ChartAnnotations');
            }

        }
    }, [phase, layoutRef]);

    if (phase !== 'rendering' || !annotationOptions) {
        return null;
    }
    const chart: Chart = layoutRef.current?.chart as Chart;
    const containerId: string = chart?.element?.id
        ? `${(chart.element as HTMLElement).id}_Annotation_Collections`
        : 'Annotation_Collections';

    const animationEnabled: boolean = Boolean(
        chart?.visibleSeries &&
        Array.isArray(chart.visibleSeries) &&
        (chart.visibleSeries as SeriesProperties[]).some(
            (series: SeriesProperties) => series?.animation?.enable === true
        )
    );
    return (
        <g
            id={containerId}
            style={{
                position: 'relative',
                visibility: (animationProgress === 1 || !animationEnabled) ? 'visible' : 'hidden'
            }}
        >
            {annotationOptions.map((option: AnnotationRendererResults, index: number) => {
                if (!option.visible) { return null; }

                return (
                    <g
                        key={index}
                        id={option.id}
                        role={option.role}
                        aria-label={option.ariaLabel}
                        tabIndex={option.tabIndex}
                        transform={`translate(${option.left}, ${option.top})`}
                    >
                        <text>{option.contentHtml}</text>
                    </g>
                );
            })}
        </g>
    );
};

export default ChartAnnotationRenderer;
