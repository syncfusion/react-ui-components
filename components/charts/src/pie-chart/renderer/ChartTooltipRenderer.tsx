import { TooltipRefHandle, Tooltip } from '@syncfusion/react-svg-tooltip';
import { useRef, useState, useEffect } from 'react';
import { registerChartEventHandler } from '../hooks/events';
import { useLayout } from '../layout/LayoutContext';
import { Chart, Points, Rect, SeriesProperties, TooltipContentFunction } from '../base/internal-interfaces';
import { PieChartTooltipProps, PieChartFontProps, PieChartLocationProps, PieChartTooltipFormatterProps } from '../base/interfaces';
import { indexFinder } from '../utils/helper';

/**
 * Resolved point and series for a hovered element.
 *
 * @private
 */
export interface PointData {
    point: Points | null;
    series: SeriesProperties | null;
}

/**
 * Internal tooltip state model.
 *
 * @private
 */
interface TooltipState {
    header: string;
    content: string[];
    pointData: Points | undefined;
    textStyle: PieChartFontProps | object;
}

/**
 * TooltipRenderer for Circular Charts (Accumulation/Pie/Donut).
 * Resolves hovered slice from pointer events, builds tooltip content, and manages fade-in/out behavior.
 *
 * @param {PieChartTooltipProps} props - Tooltip renderer props
 * @returns {Element} - Tooltip React element or null during measuring
 */
export const PieChartTooltipRenderer: React.FC<PieChartTooltipProps> = (props: PieChartTooltipProps) => {
    const { layoutRef, phase } = useLayout();

    const tooltipRef: React.MutableRefObject<TooltipRefHandle | null> =
      useRef<TooltipRefHandle | null>(null);

    const hideTooltipTimeoutRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null> =
      useRef<ReturnType<typeof setTimeout> | null>(null);

    const touchTimeoutRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null> =
      useRef<ReturnType<typeof setTimeout> | null>(null);

    const [tooltipVisible, setTooltipVisible] = useState<boolean>(false);
    const [tooltipLocation, setTooltipLocation] = useState<PieChartLocationProps>({ x: 0, y: 0 });
    const [tooltipState, setTooltipState] = useState<TooltipState>({
        header: '',
        content: [],
        pointData: undefined,
        textStyle: (props.textStyle) as PieChartFontProps | object
    });

    const [palette, setPalette] = useState<string[]>([]);
    const previousPointRef: React.MutableRefObject<{ pointIndex: number; seriesIndex: number } | null> =
      useRef<{ pointIndex: number; seriesIndex: number } | null>(null);

    const fadeOutDuration: number = Number(props.fadeOutDuration);

    useEffect(() => {
        if (phase === 'rendering' && layoutRef.current) {
            const chart: Chart = layoutRef.current as Chart;

            const unregisterMouseMove: () => void = registerChartEventHandler(
                'mouseMove',
                (e: Event, c: Chart) => handleMouseMove(e, c),
                chart.element.id
            );

            const unregisterMouseDown: () => void = registerChartEventHandler(
                'mouseDown',
                (e: Event, c: Chart) => handleMouseDown(e, c),
                chart.element.id
            );

            const unregisterMouseUp: () => void = registerChartEventHandler(
                'mouseUp',
                (e: Event) => handleMouseUp(e),
                chart.element.id
            );

            const unregisterMouseLeave: () => void = registerChartEventHandler(
                'mouseLeave',
                () => handleMouseLeave(),
                chart.element.id
            );

            chart.tooltipRef = tooltipRef;

            return () => {
                unregisterMouseMove();
                unregisterMouseDown();
                unregisterMouseUp();
                unregisterMouseLeave();
            };
        }
        return;
    }, [phase, layoutRef.current]);

    useEffect(() => {
        return () => {
            if (hideTooltipTimeoutRef.current) { clearTimeout(hideTooltipTimeoutRef.current); }
            if (touchTimeoutRef.current) { clearTimeout(touchTimeoutRef.current); }
        };
    }, []);

    /**
     * Mouse move handler: updates tooltip when pointer is inside the clipping rectangle.
     *
     * @param {Event} event - Source DOM event
     * @param {Chart} chart - Chart instance
     * @returns {void} Nothing
     */
    function handleMouseMove(event: Event, chart: Chart): void {
        if (isWithinBounds(chart.mouseX, chart.mouseY, chart.clipRect as Rect)) {
            if (hideTooltipTimeoutRef.current) {
                clearTimeout(hideTooltipTimeoutRef.current);
                hideTooltipTimeoutRef.current = null;
            }
            renderSeriesTooltip(event as PointerEvent, chart);
        } else {
            scheduleFadeOut(fadeOutDuration);
        }
    }

    /**
     * Mouse down handler: handles touchstart to render tooltip (synchronized with chart tooltip behavior).
     *
     * @param {Event} event - Source DOM event
     * @param {Chart} chart - Chart instance
     * @returns {void} Nothing
     */
    function handleMouseDown(event: Event, chart: Chart): void {
        const isTouchStart: boolean = event.type === 'touchstart';
        if (!isTouchStart) {
            return;
        }

        // Clear pending timeouts
        if (touchTimeoutRef.current) {
            clearTimeout(touchTimeoutRef.current);
            touchTimeoutRef.current = null;
        }
        if (hideTooltipTimeoutRef.current) {
            clearTimeout(hideTooltipTimeoutRef.current);
            hideTooltipTimeoutRef.current = null;
        }

        if (isWithinBounds(chart.mouseX, chart.mouseY, chart.clipRect as Rect)) {
            renderSeriesTooltip(event as PointerEvent, chart);
        }
    }

    /**
     * Mouse leave handler: schedule fade-out.
     *
     * @returns {void} Nothing
     */
    function handleMouseLeave(): void {
        scheduleFadeOut(fadeOutDuration);
    }

    /**
     * Mouse up handler.
     * For touchend, fades out after a small delay. If fadeOutMode is Click, schedules fade-out.
     *
     * @param {Event} [event] - Source DOM event
     * @returns {void} Nothing
     */
    function handleMouseUp(event?: Event): void {
        const isTouchEnd: boolean = !!event && event.type === 'touchend';

        if (isTouchEnd) {
            if (touchTimeoutRef.current) {
                clearTimeout(touchTimeoutRef.current);
                touchTimeoutRef.current = null;
            }
            touchTimeoutRef.current = setTimeout((): void => {
                tooltipRef.current?.fadeOut();
                setTooltipVisible(false);
                touchTimeoutRef.current = null;
            }, 2000);
        }

        const shouldFadeOnClick: boolean = props.fadeOutMode === 'Click';
        if (shouldFadeOnClick) {
            scheduleFadeOut(fadeOutDuration);
        }
    }

    /**
     * Schedules tooltip fade-out after the provided delay.
     *
     * @param {number} delay - Delay in milliseconds
     * @returns {void} Nothing
     */
    function scheduleFadeOut(delay: number): void {
        if (!tooltipRef.current) { return; }
        if (hideTooltipTimeoutRef.current) { clearTimeout(hideTooltipTimeoutRef.current); }
        hideTooltipTimeoutRef.current = setTimeout((): void => {
            tooltipRef.current?.fadeOut();
            setTooltipVisible(false);
            hideTooltipTimeoutRef.current = null;
        }, delay);
    }

    /**
     * Applies a custom tooltip content callback to modify the tooltip's appearance or content.
     *
     * @param {string | string[] | boolean} text - The original tooltip content, which can be a string or an array of strings.
     * @param {PieChartTooltipProps} tooltipProps - The tooltip configuration object that may contain a custom content callback.
     * @returns {string} The modified tooltip content as a string, array of strings, or boolean.
     *
     * @private
     */
    function applyTooltipContentCallback(
        text: string | string[],
        tooltipProps: PieChartTooltipProps
    ): string | string[] | boolean {
        const contentCallback: TooltipContentFunction = tooltipProps.formatter as TooltipContentFunction;
        if (contentCallback && typeof contentCallback === 'function') {
            try {
                const args: PieChartTooltipFormatterProps = { text };
                const customProps: string | string[] | boolean = contentCallback(args);
                return customProps;
            } catch (error) {
                return text;
            }
        }
        return text;
    }

    /**
     * Resolves series/point from event target and renders the tooltip accordingly.
     *
     * @param {PointerEvent} e - Pointer event
     * @param {Chart} chart - Chart instance
     * @returns {void} Nothing
     */
    function renderSeriesTooltip(e: PointerEvent, chart: Chart): void {
        const targetEl: Element | null = e.target as Element | null;
        let resolved: PointData = { point: null, series: null };

        if (targetEl !== null && targetEl.id) {
            const indices: number = indexFinder(targetEl.id) as number;
            if (indices !== null) {
                const series: SeriesProperties = chart.visibleSeries[0];
                const point: Points | undefined = series?.points[indices as number];
                if (point) {
                    resolved = { point, series };
                }
            }
        }

        const hasResolved: boolean = !!resolved.point && !!resolved.series;
        if (!hasResolved) {
            const fadeOnMove: boolean = props.fadeOutMode === 'Move';
            if (fadeOnMove) {
                scheduleFadeOut(fadeOutDuration);
            }
            return;
        }

        const isSamePoint: boolean =
          !!previousPointRef.current &&
          previousPointRef.current.pointIndex === (resolved.point as Points).index &&
          previousPointRef.current.seriesIndex === (resolved.series as SeriesProperties).index;

        if (isSamePoint) {
            if (!tooltipVisible && tooltipRef.current) {
                tooltipRef.current.fadeIn();
                setTooltipVisible(true);
            }
            return;
        }

        previousPointRef.current = {
            pointIndex: (resolved.point as Points).index,
            seriesIndex: (resolved.series as SeriesProperties).index
        };

        const header: string = buildHeader(resolved, props);
        let content: string = buildTooltipText(resolved, props);

        const customText: boolean | string | string[] = applyTooltipContentCallback(content, props);
        const cancelled: boolean = typeof customText === 'boolean' && customText === false;
        if (cancelled) {
            return;
        }
        if (typeof customText === 'string') {
            content = customText;
        }

        const symbolLocX: number = (resolved.point as Points).symbolLocation.x;
        const symbolLocY: number = (resolved.point as Points).symbolLocation.y;
        const hasFixedX: boolean = props.location !== undefined && props.location.x !== undefined;
        const hasFixedY: boolean = props.location !== undefined && props.location.y !== undefined;

        const location: PieChartLocationProps = {
            x: hasFixedX ? (props.location?.x as number) : symbolLocX,
            y: hasFixedY ? (props.location?.y as number) : symbolLocY
        };

        setTooltipState({
            header,
            content: [content],
            pointData: resolved.point as Points,
            textStyle: (props.textStyle) as PieChartFontProps
        });

        setTooltipLocation(location);

        const color: string = resolveColor(resolved);
        setPalette([color]);

        setTooltipVisible(true);
        tooltipRef.current?.fadeIn();
    }

    /**
     * Resolves color for the tooltip marker/palette, preferring point color, then interiors, then props.fill.
     *
     * @param {PointData} data - Resolved point and series data
     * @returns {string} CSS color string for the tooltip marker/palette
     */
    function resolveColor(data: PointData): string {
        const pointColor: string | undefined = data.point?.color;
        return pointColor || '';

    }

    /**
     * Replaces ${prefix.key} tokens in the format using a strongly-typed object.
     *
     * @template T
     * @param {T} obj - Source object
     * @param {string} format - Template string containing ${prefix.key} tokens
     * @param {string} prefix - Prefix of the tokens (e.g., 'point' or 'series')
     * @returns {string} A new string with tokens replaced by the object's values
     */
    function replaceTokensFromObject<T extends object>(obj: T, format: string, prefix: string): string {
        let result: string = format;
        for (const key of typedKeys(obj)) {
            const value: T[typeof key] = obj[key as keyof T];
            const placeholder: string = `\${${prefix}.${String(key)}}`;
            const str: string = value != null ? String(value) : '';
            result = result.split(placeholder).join(str);
        }
        return result;
    }

    /**
     * Builds the tooltip text by replacing ${point.*} and ${series.*} tokens in the format.
     * Defaults mirror EJ2 Accumulation tooltip behavior:
     * - Tailwind3: '${point.x} : ${point.y}'
     * - Others: '${point.x} : <b>${point.y}</b>'
     *
     * @param {PointData} data - Resolved point and series data
     * @param {PieChartTooltipProps} tooltipProps - Tooltip props for format and customization
     * @returns {string} The final tooltip content string
     */
    function buildTooltipText(data: PointData, tooltipProps: PieChartTooltipProps): string {

        let format: string = tooltipProps.format || '';

        if (data.point) {
            format = replaceTokensFromObject<Points>(data.point, format, 'point');
        }
        if (data.series) {
            format = replaceTokensFromObject<SeriesProperties>(data.series, format, 'series');
        }
        return format;
    }

    /**
     * Builds the tooltip header by replacing ${point.*} and ${series.*} tokens.
     * Defaults to '${point.x}' when headerText is not provided.
     *
     * @param {PointData} data - Resolved point and series data
     * @param {PieChartTooltipProps} tooltipProps - Tooltip props containing optional headerText
     * @returns {string} The final tooltip header string (or empty string if blank)
     */
    function buildHeader(data: PointData, tooltipProps: PieChartTooltipProps): string {
        const headerTemplate: string = tooltipProps.headerText == null ? '${point.x}' : (tooltipProps.headerText as string);

        let header: string = headerTemplate;

        void (data.point && (header = replaceTokensFromObject<Points>(data.point, header, 'point')));
        void (data.series && (header = replaceTokensFromObject<SeriesProperties>(data.series, header, 'series')));

        const stripped: string = header.replace(/<b>/g, '').replace(/<\/b>/g, '').trim();
        if (stripped !== '') {
            return header;
        }
        return '';
    }

    if (phase === 'measuring') {
        return null;
    }

    const chartInstance: Chart | null = (layoutRef.current as Chart);
    const areaBounds: Rect = chartInstance?.rect;
    const hasFixedPosition: boolean = props.location !== undefined;
    const arrowPadding: number = hasFixedPosition ? 0 : 7;

    return (
        <g id={`${layoutRef.current.element.id}_tooltip`} pointerEvents="none">
            <Tooltip
                ref={tooltipRef}
                location={tooltipLocation}
                header={tooltipState.header}
                content={tooltipState.content}
                template={props.template}
                data={tooltipState.pointData}
                enableShadow={false}
                showHeaderLine={props.showHeaderLine}
                shapes={props.showMarker ? ['Circle'] : []}
                palette={palette}
                shared={false}
                arrowPadding={arrowPadding}
                offset={0}
                areaBounds={areaBounds}
                isFixed={hasFixedPosition}
                controlName="CircularChart"
                enableAnimation={props.enableAnimation}
                textStyle={tooltipState.textStyle}
                duration={props.duration}
                opacity={props.opacity}
                fill={props.fill}
                border={props.border}
                inverted={false}
                theme={chartInstance?.theme}
                enableRTL={chartInstance?.enableRtl}
                markerSize={7}
            />
        </g>
    );
};


/**
 * Returns the own enumerable property keys of an object.
 * Uses a generic to retain strong typing.
 *
 * @template {object} T
 * @param {T} obj - Source object.
 * @returns {Array<string | number | symbol>} Keys of the object.
 */
function typedKeys<T extends object>(obj: T): Array<keyof T> {
    return Object.keys(obj) as Array<keyof T>;
}

/**
 * Checks whether a coordinate lies within the given rectangle bounds.
 *
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @param {Rect} bounds - Bounds rectangle
 * @returns {boolean} True if the point is within bounds; otherwise false
 */
function isWithinBounds(x: number, y: number, bounds: Rect): boolean {
    const withinX: boolean = x >= bounds.x && x <= bounds.x + bounds.width;
    const withinY: boolean = y >= bounds.y && y <= bounds.y + bounds.height;
    return withinX && withinY;
}
