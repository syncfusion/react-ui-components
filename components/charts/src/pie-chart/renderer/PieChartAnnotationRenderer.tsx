import * as React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { SanitizeHtmlHelper } from '@syncfusion/react-base';
import { Rect, Chart, SeriesProperties, Points } from '../../pie-chart/base/internal-interfaces';
import { useLayout } from '../layout/LayoutContext';
import { stringToNumber, measureText } from '../utils/helper';
import { PieChartSizeProps, PieChartAnnotationProps, PieChartLocationProps, PieChartFontProps } from '../base/interfaces';
import { AnnotationRendererResults, isHtmlContent, setAlignmentValue } from '../../common/annotation';
import { useSeriesRenderVersion, usePieAnnotationRenderVersion } from '../hooks/events';

/**
 * Calculates pixel-based annotation position
 *
 * @param {Chart} control - Chart control instance
 * @param {PieChartAnnotationProps} annotation - Annotation properties containing position info
 * @param {PieChartLocationProps} location - Output parameter for calculated location
 * @returns {boolean} True if position is valid, false otherwise
 */
function setAnnotationPixelValue(
    control: Chart,
    annotation: PieChartAnnotationProps,
    location: PieChartLocationProps
): boolean {
    const rect: Rect = {
        x: 0,
        y: 0,
        width: control.availableSize.width,
        height: control.availableSize.height
    };
    location.x = (typeof annotation.x !== 'string'
        ? (typeof annotation.x === 'number'
            ? (annotation.x as number)
            : 0)
        : stringToNumber(annotation.x as string, rect.width)) + rect.x;
    location.y = (typeof annotation.y === 'number'
        ? (annotation.y as number)
        : stringToNumber(annotation.y as string, rect.height)) + rect.y;
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
 * @returns {PieChartSizeProps} The measured size in pixels.
 */
function measureHtmlSize(html: string): PieChartSizeProps {
    const container: HTMLElement = document.createElement('div');
    container.style.position = 'absolute';
    container.style.visibility = 'hidden';
    container.style.pointerEvents = 'none';
    container.style.left = '-10000px';
    container.style.top = '-10000px';
    container.style.whiteSpace = 'normal';
    container.style.display = 'inline-block';
    container.innerHTML = html;

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
 * @param {PieChartAnnotationProps} annotation - Annotation properties
 * @param {PieChartLocationProps} location - Output parameter for calculated location
 * @returns {boolean} True if position is valid, false otherwise
 */
function setAnnotationPointValuePie(
    chart: Chart,
    annotation: PieChartAnnotationProps,
    location: PieChartLocationProps
): boolean {
    if (!chart || !chart.visibleSeries || chart.visibleSeries.length === 0) {
        return false;
    }
    let point: Points | undefined;
    for (const accPoint of chart.visibleSeries[0].points) {
        if (typeof accPoint.x === 'object') {
            if (Date.parse(accPoint.x as string) === Date.parse(annotation.x as string) &&
                    accPoint.y === annotation.y) {
                point = accPoint;
                break;
            }
        } else {
            if (accPoint.x === annotation.x && accPoint.y === annotation.y) {
                point = accPoint;
                break;
            }
        }
    }
    if (!point || !point.visible || !point.symbolLocation) {
        return false;
    }
    location.x = point.symbolLocation.x;
    const isHtmlAnnotation: boolean = isHtmlContent(annotation.content as string);
    if (isHtmlAnnotation) {
        location.y = point.symbolLocation.y;
    } else {
        const textSize: PieChartSizeProps = point.textSize ?? getAnnotationTextSize(chart, annotation);
        location.y = point.symbolLocation.y + textSize.height;
    }
    return true;
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
 * @param {PieChartAnnotationProps[]} annotations - The annotation configuration list.
 * @returns {AnnotationRendererResults[]} Computed options for rendering annotations.
 * @internal
 */
function renderPieAnnotations(
    chart: Chart,
    annotations: PieChartAnnotationProps[]
): AnnotationRendererResults[] {
    const results: AnnotationRendererResults[] = [];
    if (!chart || !chart.element) {
        return results;
    }
    for (let index: number = 0; index < annotations.length; index++) {
        const annotation: PieChartAnnotationProps = annotations[index as number];
        const location: PieChartLocationProps = { x: 0, y: 0 };
        const isValidPosition: boolean = annotation.coordinateUnit === 'Pixel'
            ? setAnnotationPixelValue(chart as Chart, annotation, location)
            : setAnnotationPointValuePie(chart as Chart, annotation, location);
        const id: string = `${(chart.element as HTMLElement).id}_Annotation_${index}`;
        const ariaLabel: string = (annotation.accessibility?.ariaLabel as string) || 'Annotation';
        const role: string = (annotation.accessibility?.role as string) || 'img';
        const tabIndex: number = (annotation.accessibility?.focusable as boolean) ? (annotation.accessibility?.tabIndex ?? 0) : -1;
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
        const size: PieChartSizeProps = sanitizedHtml ? measureHtmlSize(sanitizedHtml) : { width: 1, height: 1 };
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
export function renderPieAnnotationTemplates(
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
 * @param {PieChartAnnotationProps[]} annotations - The raw annotation configuration array.
 * @param {number} animationProgress - Normalized animation progress (0 to 1).
 * @returns {React.JSX.Element | null} The rendered annotation container or null if nothing to render.
 * @private
 */
export function renderPieChartAnnotations(
    chart: Chart,
    annotations: PieChartAnnotationProps[],
    animationProgress: number
): React.JSX.Element | null {
    if (!chart || !annotations?.length) { return null; }
    const htmlAnnotations: PieChartAnnotationProps[] = annotations.filter(
        (annotationItem: PieChartAnnotationProps) => isHtmlContent(annotationItem.content as string)
    );
    if (!htmlAnnotations.length) { return null; }
    const options: AnnotationRendererResults[] = renderPieAnnotations(chart, htmlAnnotations);
    if (!options?.length) { return null; }
    return renderPieAnnotationTemplates(chart, options, animationProgress);
}

/**
 * Renders pie chart annotations with proper positioning and types
 *
 * @param {PieChartAnnotationProps[]} props - Array of annotation properties
 * @returns {React.JSX.Element | null} HTML container containing all annotations
 */
export const PieAnnotationRenderer: React.FC<PieChartAnnotationProps[]> = (props: PieChartAnnotationProps[] ): React.JSX.Element | null => {
    const { layoutRef, phase, isSeriesAnimated } = useLayout();
    const legendClickedInfo: { version: number; id: string } = useSeriesRenderVersion();
    const pieAnnoInfo: { version: number; id: string } = usePieAnnotationRenderVersion();
    const annotations: PieChartAnnotationProps[] = useMemo((): PieChartAnnotationProps[] => {
        return Object.keys(props)
            .filter((keyStr: string): boolean => !isNaN(Number(keyStr)))
            .map((keyStr: string): PieChartAnnotationProps => props[Number(keyStr)])
            .filter((annotationItem: PieChartAnnotationProps) => !isHtmlContent(annotationItem.content as string));
    }, [props]);
    const annotationsKey: string = useMemo(() => {
        return annotations.map((annotation: PieChartAnnotationProps) => [
            annotation.x, annotation.y, annotation.content,
            annotation.hAlign, annotation.vAlign,
            annotation.coordinateUnit,
            annotation.accessibility?.ariaLabel,
            annotation.accessibility?.role,
            annotation.accessibility?.focusable,
            annotation.accessibility?.tabIndex
        ].join('|')).join('||');
    }, [annotations]);
    const [annotationOptions, setAnnotationOptions] = useState<AnnotationRendererResults[] | null>(null);

    useEffect((): void => {
        if (phase !== 'rendering') { return; }
        const chart: Chart = layoutRef.current as Chart;
        if (!chart || annotations.length === 0) { return; }
        const computed: AnnotationRendererResults[] = renderPieAnnotations(chart, annotations);
        setAnnotationOptions((previousAnnotationOptions: AnnotationRendererResults[] | null) => {
            if (!previousAnnotationOptions) { return computed.map((annotationOption: AnnotationRendererResults) =>
                ({ ...annotationOption, visible: false })); }
            return computed.map((annotationOption: AnnotationRendererResults, optionIndex: number) => ({
                ...annotationOption,
                visible: annotationOption.visible && (previousAnnotationOptions[optionIndex as number]?.visible ?? false)
            }));
        });

    }, [phase, annotationsKey, legendClickedInfo.version]);

    useEffect((): void => {
        if (phase !== 'rendering') {
            setAnnotationOptions(null);
            return;
        }
        const chart: Chart = layoutRef.current as Chart;
        if (!chart || annotations.length === 0) {
            setAnnotationOptions(null);
            return;
        }
        const computed: AnnotationRendererResults[] = renderPieAnnotations(chart, annotations);
        setAnnotationOptions(computed);
    }, [phase, annotationsKey, pieAnnoInfo.version]);

    if (phase !== 'rendering' || !annotationOptions) {
        return null;
    }

    const chart: Chart = layoutRef.current as Chart;
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
                visibility: (isSeriesAnimated ? 1 : 0 || !animationEnabled) ? 'visible' : 'hidden'
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

/**
 * Calculates the text size required for rendering a pie chart annotation.
 *
 * @param {Chart} chart - Chart control instance
 * @param {PieChartAnnotationProps} annotation - Annotation properties containing position info
 * @returns {PieChartSizeProps} The calculated width and height of the annotation text in pixels.
 * @private
 */
function getAnnotationTextSize(
    chart: Chart,
    annotation: PieChartAnnotationProps
): PieChartSizeProps {
    const content: string = annotation.content as string;
    if (!content) {
        return { width: 0, height: 0 };
    }
    const series: SeriesProperties = chart.visibleSeries?.[0];
    const font: PieChartFontProps =
        (series && series.dataLabel && series.dataLabel.font)
            ? series.dataLabel.font as PieChartFontProps
            : chart.themeStyle.datalabelFont as PieChartFontProps;
    const size: PieChartSizeProps = measureText(
        content,
        font,
        chart.themeStyle.datalabelFont as PieChartFontProps
    );
    return {
        width: size.width,
        height: size.height
    };
}

export default PieAnnotationRenderer;
