import { useState, useEffect, useRef, useCallback } from 'react';
import { useLayout } from '../layout/LayoutContext';
import { registerChartEventHandler, useSeriesRenderVersion } from '../hooks/useClipRect';
import { withInBounds, getCommonXValues, valueToCoefficient, getClosestX, measureText, getValueXByPoint, getValueYByPoint } from '../utils/helper';
import { Chart, Rect, SeriesProperties, ColorValue, Points, AxisModel, TextStyleModel, ChartSizeProps } from '../chart-area/chart-interfaces';
import { ChartCrosshairProps } from '../base/interfaces';
import { colorNameToHex, convertHexToColor } from './SeriesRenderer/DataLabelRender';
import { CrosshairLineType } from '../base/enum';

/**
 * Interface representing data structure for individual point information used in crosshair calculations.
 *
 * @interface PointData
 * @property {Points} point - The actual data point with coordinates and metadata
 * @property {SeriesProperties} series - The series containing this point with styling and axis information
 */
interface PointData {
    point: Points;
    series: SeriesProperties;
}

/**
 * Interface representing data structure for axis tooltip used in crosshair rendering.
 *
 * @interface AxisTooltipRenderData
 * @property {string} id - Unique identifier for the tooltip element
 * @property {string} d - SVG path command string describing the tooltip shape
 * @property {string[]} textLines - Lines of text displayed inside the tooltip
 * @property {number} textX - X-coordinate for the tooltip text baseline (first line)
 * @property {number} textY - Y-coordinate for the tooltip text baseline (first line)
 * @property {TextStyleModel} textStyle - Text style applied to tooltip content
 * @property {number} lineHeight - Line height for multi-line text layout (in pixels)
 * @property {string} fill - Background fill color of the tooltip
 */
interface AxisTooltipRenderData {
    id: string;
    d: string;
    textLines: string[];
    textX: number;
    textY: number;
    textStyle: TextStyleModel;
    lineHeight: number;
    fill: string;
}

/**
 * Interface containing comprehensive data for category highlighting functionality.
 * Used when highlightCategory is enabled to show visual feedback for categorical data.
 *
 * @interface HighlightCategoryData
 * @property {number} valueX - X-coordinate position for crosshair rendering
 * @property {number} valueY - Y-coordinate position for crosshair rendering
 * @property {number} highlightWidth - Width of the highlight rectangle for category visualization
 * @property {number} leftOverflow - Amount of overflow on the left side requiring position adjustment
 * @property {number} rightOverflow - Amount of overflow on the right side requiring position adjustment
 * @property {boolean} seriesVisible - Flag indicating if any series are visible for rendering
 */
interface HighlightCategoryData {
    valueX: number;
    valueY: number;
    highlightWidth: number;
    leftOverflow: number;
    rightOverflow: number;
    seriesVisible: boolean;
}

/**
 * Crosshair path pair for horizontal and vertical elements.
 */
interface CrosshairPaths {
    horizontal: string;
    vertical: string;
}

/**
 * Renders a crosshair indicator for chart components.
 *
 * The crosshair appears when hovering over chart elements and displays precise data values
 * at the cursor position. This component handles the visual representation and positioning
 * of the crosshair based on current mouse coordinates.
 *
 * @param {ChartCrosshairProps} props - Configuration properties for the chart crosshair
 * @param {string} [props.color] - Color of the crosshair lines (default: theme-based)
 * @param {number} [props.lineWidth] - Width of crosshair lines in pixels (default: 1)
 * @param {boolean} [props.showLabel] - Toggles visibility of data value labels (default: true)
 * @param {'horizontal' | 'vertical' | 'both'} [props.orientation] - Crosshair direction (default: 'both')
 * @param {React.CSSProperties} [props.style] - Additional CSS styles for the crosshair container
 * @param {function} [props.onHover] - Callback invoked when crosshair position changes
 *
 * @returns {React.ReactElement | null} Crosshair component JSX or null if inactive
 */
export const ChartCrosshairRenderer: React.FC<ChartCrosshairProps> = (props: ChartCrosshairProps): React.ReactElement | null => {
    const { layoutRef, phase } = useLayout();

    /**
     * State managing the visibility of crosshair elements.
     * Controls whether crosshair lines are rendered and visible to users.
     *
     * @state {boolean}
     */
    const [crosshairVisible, setCrosshairVisible] = useState<boolean>(false);

    /**
     * State containing the SVG path string for horizontal crosshair line rendering.
     * Updated when mouse position changes or highlight categories are activated.
     *
     * @state {string}
     */
    const [horizontalPath, setHorizontalPath] = useState<string>('');

    /**
     * State containing the SVG path string for vertical crosshair line rendering.
     * Updated when mouse position changes or highlight categories are activated.
     *
     * @state {string}
     */
    const [verticalPath, setVerticalPath] = useState<string>('');

    /**
     * State object containing current crosshair positioning and dimension data.
     * Used for rendering calculations and overflow adjustments.
     *
     * @state {object}
     */
    const [currentCrosshairData, setCurrentCrosshairData] = useState<{
        valueX: number;
        valueY: number;
        highlightWidth: number;
        leftOverflow: number;
        rightOverflow: number;
    }>({
        valueX: 0,
        valueY: 0,
        highlightWidth: 0,
        leftOverflow: 0,
        rightOverflow: 0
    });

    /**
     * Reference to timeout handle for delayed crosshair removal.
     * Prevents flickering when mouse quickly moves in and out of chart area.
     *
     * @ref {React.MutableRefObject<NodeJS.Timeout | null>}
     */
    const crosshairTimeoutRef: React.MutableRefObject<NodeJS.Timeout | null> = useRef<NodeJS.Timeout | null>(null);

    const touchTimeoutRef: React.MutableRefObject<NodeJS.Timeout | null> = useRef<NodeJS.Timeout | null>(null);
    const [axisTooltips, setAxisTooltips] = useState<AxisTooltipRenderData[]>([]);

    /**
     * Effect hook for registering and cleaning up chart event handlers.
     * Manages mouse movement, clicks, and touch interactions for crosshair functionality.
     * Only active during rendering phase when chart and crosshair are properly initialized.
     */
    useEffect((): (() => void) | void => {

        if (phase !== 'rendering' || !layoutRef.current?.chart) {
            return;
        }
        removeCrosshair(0);
        const chart: Chart = layoutRef.current.chart as Chart;

        // Register all necessary event handlers for crosshair interaction
        const unregisterMouseMove: () => void = registerChartEventHandler(
            'mouseMove',
            (e: Event, chartInstance: Chart): void => handleMouseMove(e, chartInstance),
            chart.element.id
        );

        const unregisterMouseDown: () => void = registerChartEventHandler(
            'mouseDown',
            (e: Event, chart: Chart): void => handleMouseDown(e, chart),
            chart.element.id
        );

        const unregisterMouseUp: () => void = registerChartEventHandler(
            'mouseUp',
            (e: Event): void => handleMouseUp(e),
            chart.element.id
        );

        const unregisterMouseLeave: () => void = registerChartEventHandler(
            'mouseLeave',
            (): void => handleMouseLeave(),
            chart.element.id
        );

        // Cleanup function to remove event handlers and clear timeouts
        return (): void => {
            unregisterMouseMove();
            unregisterMouseDown();
            unregisterMouseUp();
            unregisterMouseLeave();

            if (crosshairTimeoutRef.current) {
                clearTimeout(crosshairTimeoutRef.current);
                crosshairTimeoutRef.current = null;
            }

            if (touchTimeoutRef.current) {
                clearTimeout(touchTimeoutRef.current);
                touchTimeoutRef.current = null;
            }

        };
    }, [phase, layoutRef.current?.chart, props.enable, props.highlightCategory, props.lineStyle, props.lineType, props.snap]);

    const legendClickedInfo: { version: number; id: string } = useSeriesRenderVersion();

    useEffect(() => {
        if (legendClickedInfo && legendClickedInfo.id === (layoutRef.current.chart as Chart)?.element.id) {
            removeCrosshair(0);
        }
    }, [legendClickedInfo.version]);
    /**
     * Calculates precise mouse position values for crosshair rendering based on point data and chart orientation.
     * Handles both standard and inverted axis configurations for accurate visual feedback.
     *
     * @function
     * @param {PointData} data - Data containing the point and series information
     * @param {Chart} chart - Chart instance with axis layout and mouse position data
     * @returns {{ valueX: number, valueY: number }} Object containing calculated X and Y coordinates for crosshair positioning
     *
     */
    const findMouseValues: (data: PointData, chart: Chart) => { valueX: number, valueY: number }
        = useCallback((data: PointData, chart: Chart): { valueX: number, valueY: number } => {
            let mouseValueX: number = 0;
            let mouseValueY: number = 0;

            if (!chart.requireInvertedAxis) {
                mouseValueX = valueToCoefficient(Number(data.point.xValue), data.series.xAxis) * data.series.xAxis.rect.width
                    + data.series.xAxis.rect.x;
                mouseValueY = chart.mouseY;
            } else {
                mouseValueY = (1 - valueToCoefficient(Number(data.point.xValue), data.series.xAxis)) * data.series.xAxis.rect.height
                    + data.series.xAxis.rect.y;
                mouseValueX = chart.mouseX;
            }

            return { valueX: mouseValueX, valueY: mouseValueY };
        }, [valueToCoefficient]);

    /**
     * Analyzes mouse position and calculates comprehensive highlight category data for crosshair rendering.
     * Handles category axis highlighting, overflow detection, and series visibility checks.
     *
     * @function
     * @param {Chart} chart - Chart instance containing all series and mouse position data
     * @returns {HighlightCategoryData} Complete data object containing positioning, dimensions, and overflow information
     *
     */
    const findMousePoints: (chart: Chart) => HighlightCategoryData = useCallback((chart: Chart): HighlightCategoryData => {
        const defaultData: HighlightCategoryData = {
            valueX: chart.mouseX,
            valueY: chart.mouseY,
            highlightWidth: 0,
            leftOverflow: 0,
            rightOverflow: 0,
            seriesVisible: true
        };

        if (!props.highlightCategory) {
            return defaultData;
        }

        const pointLocations: number[] = [];
        const axisCoordinate: string = chart.iSTransPosed ? 'x' : 'y';
        let nearestDataPoint: PointData | null = null;
        let minDifference: number = Infinity;
        const mouseCoordinate: number = axisCoordinate === 'x' ? chart.mouseX : chart.mouseY;
        let seriesVisibility: boolean = false;

        // Get common X values across all visible series
        const commonXvalues: number[] = getCommonXValues(chart.visibleSeries);

        for (const series of chart.visibleSeries) {
            seriesVisibility = seriesVisibility || series.visible;

            if (series.visible && series.category !== 'TrendLine') {
                // Get the closest X value using existing method
                const closestData: PointData | null = getClosestX(chart, series, commonXvalues);

                if (closestData && closestData.point && closestData.point.symbolLocations &&
                    closestData.point.symbolLocations[0] && closestData.series.clipRect) {

                    const pointLocation: number = closestData.point.symbolLocations[0][axisCoordinate as 'x' | 'y'] +
                        closestData.series.clipRect[axisCoordinate as 'x' | 'y'];

                    pointLocations.push(pointLocation);

                    // Calculate the nearest point to the mouse
                    const difference: number = Math.abs(pointLocation - mouseCoordinate);
                    if (difference < minDifference) {
                        minDifference = difference;
                        nearestDataPoint = closestData;
                    }
                }
            }
        }

        // Use the nearest data point for highlight category
        if (props.highlightCategory && nearestDataPoint) {
            let highlightWidth: number = 0;
            let leftOverflow: number = 0;
            let rightOverflow: number = 0;

            if (nearestDataPoint.series.xAxis?.valueType === 'Category' &&
                nearestDataPoint.series.xAxis.visibleRange) {

                const clipRectSize: number = chart.iSTransPosed || chart.requireInvertedAxis ?
                    chart.chartAxislayout.seriesClipRect.height :
                    chart.chartAxislayout.seriesClipRect.width;

                const highlightCategoryWidth: number = clipRectSize / nearestDataPoint.series.xAxis.visibleRange.delta;
                const pointRelativePosition: number =
                    (Number(nearestDataPoint.point.xValue) - nearestDataPoint.series.xAxis.visibleRange.minimum) /
                    (nearestDataPoint.series.xAxis.visibleRange.maximum - nearestDataPoint.series.xAxis.visibleRange.minimum);

                leftOverflow = Math.max(0, (highlightCategoryWidth / 2) -
                    pointRelativePosition * clipRectSize);
                rightOverflow = Math.max(0, (pointRelativePosition * clipRectSize +
                    (highlightCategoryWidth / 2)) - clipRectSize);

                highlightWidth = Math.max(0, highlightCategoryWidth - leftOverflow - rightOverflow);
            }

            // Calculate mouse values
            const mouseValues: { valueX: number; valueY: number; } = findMouseValues(nearestDataPoint, chart);

            return {
                valueX: mouseValues.valueX,
                valueY: mouseValues.valueY,
                highlightWidth,
                leftOverflow,
                rightOverflow,
                seriesVisible: seriesVisibility
            };
        }

        return { ...defaultData, seriesVisible: seriesVisibility };
    }, [props.highlightCategory, getCommonXValues, getClosestX, findMouseValues]);

    /**
     * Adjusts crosshair position to handle overflow situations when highlight extends beyond chart boundaries.
     * Implements different adjustment strategies for horizontal and vertical orientations.
     *
     * @function
     * @param {number} initialPosition - The original calculated position before adjustment
     * @param {boolean} isHorizontalOrientation - Flag indicating horizontal (true) vs vertical (false) chart orientation
     * @param {number} leftOverflow - Amount of overflow on the left/top side requiring adjustment
     * @param {number} rightOverflow - Amount of overflow on the right/bottom side requiring adjustment
     * @returns {number} Adjusted position value accounting for overflow constraints
     *
     */
    const adjustCrosshairPositionForOverflow: (
        initialPosition: number,
        isHorizontalOrientation: boolean,
        leftOverflow: number,
        rightOverflow: number
    ) => number = useCallback(
        (initialPosition: number, isHorizontalOrientation: boolean, leftOverflow: number, rightOverflow: number): number => {
            let adjustedPosition: number = initialPosition;

            if (leftOverflow > 0) {
                adjustedPosition += isHorizontalOrientation ? -leftOverflow / 2 : leftOverflow / 2;
            }

            if (rightOverflow > 0) {
                adjustedPosition += isHorizontalOrientation ? rightOverflow / 2 : -rightOverflow / 2;
            }

            return adjustedPosition;
        },
        []
    );

    /**
     * Converts a color string into a semi-transparent RGBA format for highlight visualization.
     * Supports various color formats including color names, hex values, and existing RGBA strings.
     *
     * @function
     * @param {string} color - Input color in any supported format (name, hex, rgb, rgba)
     * @returns {string} Semi-transparent RGBA color string with 0.25 opacity for subtle highlighting
     *
     */
    const crosshairLightenColor: (color: string) => string = useCallback((color: string): string => {
        const rgbValue: ColorValue = convertHexToColor(colorNameToHex(color));
        return `rgba(${rgbValue.r}, ${rgbValue.g}, ${rgbValue.b}, 0.25)`;
    }, []);

    /**
     * Handle touch start events for crosshair updates - synchronized with tooltip
     *
     * @param {Event} event - The touch event that initiates the crosshair interaction
     * @param {Chart} chart - The chart object
     * @returns {void}
     */
    function handleMouseDown(event: Event, chart: Chart): void {

        if (event.type === 'touchstart') {

            if (touchTimeoutRef.current) {
                clearTimeout(touchTimeoutRef.current);
                touchTimeoutRef.current = null;
            }
            chart.startMove = true;
            if (withInBounds(chart.mouseX, chart.mouseY, chart.chartAxislayout.seriesClipRect)) {
                renderCrosshair(chart);
            }
        }
    }

    /**
     * Handles mouse movement events within the chart area to show or hide crosshair based on position and settings.
     * Implements intelligent timeout management to prevent flickering during rapid mouse movements.
     *
     * @function
     * @param {Event} [event] - The mouse or touch event (optional).
     * @param {Chart} chart - Chart instance containing mouse position and configuration data
     * @returns {void}
     *
     */
    const handleMouseMove: (event: Event, chart: Chart) => void = (event: Event, chart: Chart): void => {

        if (!chart.disableTrackTooltip &&
            props.enable &&
            withInBounds(chart.mouseX, chart.mouseY, chart.chartAxislayout.seriesClipRect)) {

            if (chart.startMove || !chart.isTouch) {
                if (crosshairTimeoutRef.current) {
                    clearTimeout(crosshairTimeoutRef.current);
                    crosshairTimeoutRef.current = null;
                }
                renderCrosshair(chart);
            }
        } else {
            const duration: number = (event.target as HTMLElement).id.includes('legend') ? 0 : 1000;
            removeCrosshair(duration);
        }
    };

    /**
     * Handles mouse up events to manage crosshair visibility during drag operations and touch events.
     * Applies longer timeout delay during active chart manipulation for better user experience.
     * For touch events, hides the crosshair after a delay similar to TooltipRenderer.
     *
     * @function
     * @param {Event} [event] - The mouse or touch event (optional).
     * @returns {void}
     */
    const handleMouseUp: (event?: Event) => void = (event?: Event): void => {

        if (event && event.type === 'touchend') {
            removeCrosshair(2000);
        }

    };

    /**
     * Handles mouse leave events to hide crosshair when cursor exits chart area.
     * Uses shorter timeout to provide responsive feedback for mouse exit scenarios.
     *
     * @function
     * @returns {void}
     */
    const handleMouseLeave: () => void = (): void => {
        removeCrosshair(1000);
    };

    /**
     * Schedules crosshair removal with specified delay while managing timeout conflicts.
     * Prevents multiple concurrent timeouts and ensures smooth transitions during rapid interactions.
     *
     * @function
     * @param {number} duration - Delay in milliseconds before hiding the crosshair
     * @returns {void}
     *
     */
    const removeCrosshair: (duration: number) => void = (duration: number): void => {
        const chart: Chart = layoutRef.current.chart as Chart;
        const timeoutRef: React.MutableRefObject<NodeJS.Timeout | null> = chart.isTouch ? touchTimeoutRef : crosshairTimeoutRef;

        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
            setCrosshairVisible(false);
            setAxisTooltips([]);
            setCurrentCrosshairData({
                valueX: 0,
                valueY: 0,
                highlightWidth: 0,
                leftOverflow: 0,
                rightOverflow: 0
            });

            chart.startMove = false;
            timeoutRef.current = null;
        }, duration);
    };

    /**
     * Safely applies the crosshair-specific formatter defined on the axis, if available.
     *
     * Invokes axis.crosshairTooltip.formatter with the raw numeric value and the already
     * formatted base text. If the formatter returns a string, that string is used. If it
     * returns a boolean, the original text is preserved. Any exceptions are caught and the
     * original text is returned.
     *
     * @function applyCrosshairFormatter
     * @param {number} value - The raw numeric axis value at the crosshair position.
     * @param {string} text - The already formatted label text (base text) to be refined by the formatter.
     * @param {AxisModel} axis - The target axis containing the crosshairTooltip configuration.
     * @returns {string | boolean} The formatter result: a string to use as the label, or a boolean to indicate no change.
     */

    function applyCrosshairFormatter(
        value: number,
        text: string,
        axis: AxisModel
    ): string | boolean {
        const formatter: (value: number, text: string) => string | boolean =
            axis.crosshairTooltip?.formatter as (value: number, text: string) => string | boolean ;

        if (typeof formatter === 'function') {
            try {
                return formatter(value, text);
            } catch {
                return text;
            }
        }
        return text;
    }

    /**
     * Returns formatted axis text for the given numeric value, matching the axis label formatting.
     *
     * - DateTime: formats using axis.format(new Date(value))
     * - Category: picks the label at the floored index (if available)
     * - Logarithmic: converts numericValue using axis.logBase and formats the result
     * - Double/others: uses axis.labelStyle.format if it contains '{value}', otherwise axis.format(value)
     *
     * @function getAxisFormattedText
     * @param {AxisModel} axis - The target axis containing valueType, labels, formatters, and style.
     * @param {number} numericValue - The axis value in numeric form to be formatted.
     * @returns {string | string[] | undefined} The formatted label text (multi-line supported) or undefined.
     */
    function getAxisFormattedText(
        axis: AxisModel,
        numericValue: number
    ): string | string[] | undefined {
        let formattedBaseText: string | undefined;

        if (axis.valueType === 'DateTime') {
            formattedBaseText = axis.format(new Date(numericValue));
        } else if (axis.valueType === 'Category') {
            const categoryIndex: number = Math.floor(numericValue);
            formattedBaseText =
                axis.labels.length > categoryIndex ? String(axis.labels[categoryIndex as number]) : '';
        } else if (axis.valueType === 'Logarithmic') {
            const logBase: number = Number(axis.logBase) || 10;
            const linearValue: number = Math.pow(logBase, numericValue);
            formattedBaseText = axis.format(linearValue);
        } else {

            const formatPattern: string | undefined = axis.labelStyle?.format;
            let normalizedValueText: string = numericValue.toString();

            const hasNumberPattern: boolean = !!(formatPattern && formatPattern.indexOf('n') > -1);

            if (!hasNumberPattern) {
                normalizedValueText =
                    numericValue % 1 === 0
                        ? numericValue.toFixed(0)
                        : numericValue.toFixed(2).slice(-1) === '0'
                            ? numericValue.toFixed(1)
                            : numericValue.toFixed(2);
            }

            const hasValueTemplate: boolean = !!(formatPattern && formatPattern.match('{value}') !== null);
            const normalizedValue: number = parseFloat(normalizedValueText);

            formattedBaseText = hasValueTemplate
                ? (formatPattern as string).replace('{value}', axis.format(normalizedValue))
                : axis.format(normalizedValue);
        }

        const formatterResult: string | boolean = applyCrosshairFormatter(
            numericValue,
            formattedBaseText ?? '',
            axis
        );

        return typeof formatterResult === 'boolean' ? formattedBaseText : formatterResult;
    }

    /**
     * Generates an SVG path string for a rounded-rectangle tooltip shape (no arrow).
     *
     * Uses fixed corner radii rx=3 and ry=3, and directly reads coordinates from the given Rect.
     *
     * @function findCrosshairDirection
     * @param {Rect} tooltipRect - Tooltip bounding rectangle with x, y, width, and height
     * @returns {string} SVG path data (d attribute) for a rounded rectangle
     */
    const findCrosshairDirection: (tooltipRect: Rect) => string = (tooltipRect: Rect): string => {
        const rx: number = 3;
        const ry: number = 3;
        const d: string =
            `M ${tooltipRect.x + rx} ${tooltipRect.y} ` +
            `L ${tooltipRect.x + tooltipRect.width - rx} ${tooltipRect.y} ` +
            `A ${rx} ${ry} 0 0 1 ${tooltipRect.x + tooltipRect.width} ${tooltipRect.y + ry} ` +
            `L ${tooltipRect.x + tooltipRect.width} ${tooltipRect.y + tooltipRect.height - ry} ` +
            `A ${rx} ${ry} 0 0 1 ${tooltipRect.x + tooltipRect.width - rx} ${tooltipRect.y + tooltipRect.height} ` +
            `L ${tooltipRect.x + rx} ${tooltipRect.y + tooltipRect.height} ` +
            `A ${rx} ${ry} 0 0 1 ${tooltipRect.x} ${tooltipRect.y + tooltipRect.height - ry} ` +
            `L ${tooltipRect.x} ${tooltipRect.y + ry} ` +
            `A ${rx} ${ry} 0 0 1 ${tooltipRect.x + rx} ${tooltipRect.y} Z`;
        return d;
    };

    /**
     * Builds axis crosshair tooltips for all axes that have crosshairTooltip enabled.
     * - Computes the axis value at the crosshair (X for horizontal, Y for vertical)
     * - Formats the value via getAxisFormattedText (string or string[])
     * - Measures text to size the tooltip and positions it near the axis (inside/opposed aware)
     * - Clamps within chart.availableSize and generates a rounded-rect path
     *
     * @function computeAxisTooltips
     * @param {Chart} chart - The chart instance containing axes, theme styles, and available size.
     * @param {number} crosshairX - Current crosshair X coordinate in chart pixels.
     * @param {number} crosshairY - Current crosshair Y coordinate in chart pixels.
     * @returns {AxisTooltipRenderData[]} Array of tooltip render descriptors (path, text, styles, position).
     */
    const computeAxisTooltips: (chart: Chart, crosshairX: number, crosshairY: number) => AxisTooltipRenderData[] = useCallback(
        (chart: Chart, crosshairX: number, crosshairY: number): AxisTooltipRenderData[] => {
            return chart.axisCollection
                .filter((axis: AxisModel) => axis.crosshairTooltip?.enable && axis.rect)
                .map((axis: AxisModel, index: number) => {
                    const isHorizontal: boolean = axis.orientation === 'Horizontal';
                    const isOpposed: boolean = axis.isAxisOpposedPosition;
                    const labelValueOffset: number =
                        axis.valueType === 'Category' && axis.labelStyle.placement === 'BetweenTicks' ? 0.5 : 0;

                    let numericValue: number;
                    if (isHorizontal) {
                        numericValue =
                            getValueXByPoint(Math.abs(crosshairX - axis.rect.x), axis.rect.width, axis) +
                            labelValueOffset;
                    } else {
                        numericValue =
                            getValueYByPoint(Math.abs(crosshairY - axis.rect.y), axis.rect.height, axis) +
                            labelValueOffset;
                    }

                    const rawText: string | string[] | undefined = getAxisFormattedText(axis, numericValue);
                    if (rawText === null || rawText === undefined) { return null; }

                    const textLines: string[] = Array.isArray(rawText) ? rawText.map(String) : [String(rawText)];
                    if (!textLines.join('')) { return null; }

                    const padding: number = 6;
                    const textStyle: TextStyleModel = {
                        ...chart.themeStyle.crosshairLabelFont,
                        ...axis.crosshairTooltip?.textStyle
                    };

                    const totalTextSize: ChartSizeProps = { width: 0, height: 0 };
                    let firstLineHeight: number = 0;

                    textLines.forEach((line: string, i: number) => {
                        const lineSize: ChartSizeProps = measureText(line, textStyle, chart.themeStyle.crosshairLabelFont);
                        if (i === 0) { firstLineHeight = lineSize.height; }
                        totalTextSize.width = Math.max(totalTextSize.width, lineSize.width);
                        totalTextSize.height += lineSize.height;
                    });

                    const bounds: ChartSizeProps = chart.availableSize;
                    const axisRect: Rect = axis.rect;
                    const tooltipRect: Rect = {
                        x: 0,
                        y: 0,
                        width: totalTextSize.width + padding * 2,
                        height: totalTextSize.height + padding * 2
                    };
                    const islabelInside: boolean = axis.labelStyle?.position === 'Inside';

                    if (isHorizontal) {
                        const baseY: number = islabelInside
                            ? axisRect.y - tooltipRect.height - padding
                            : axisRect.y;

                        let tooltipY: number;
                        if (isOpposed) {
                            tooltipY = islabelInside ? axisRect.y : axisRect.y - tooltipRect.height - padding;
                        } else {
                            tooltipY = baseY + axisRect.height + padding;
                        }
                        tooltipRect.x = crosshairX - tooltipRect.width / 2;
                        tooltipRect.y = tooltipY;
                    } else {
                        let tooltipX: number;
                        if (isOpposed) {
                            tooltipX = islabelInside
                                ? axisRect.x - tooltipRect.width
                                : axisRect.x + axisRect.width + padding;
                        } else {
                            tooltipX = islabelInside ? axisRect.x : axisRect.x - tooltipRect.width - padding;
                        }
                        tooltipRect.x = tooltipX;
                        tooltipRect.y = crosshairY - tooltipRect.height / 2;
                    }

                    // Clamp within bounds (simplified overflow check)
                    tooltipRect.x = Math.max(0, Math.min(tooltipRect.x, bounds.width - tooltipRect.width));
                    tooltipRect.y = Math.max(0, Math.min(tooltipRect.y, bounds.height - tooltipRect.height));

                    const d: string = findCrosshairDirection(tooltipRect);
                    const textX: number = tooltipRect.x + tooltipRect.width / 2;
                    const textY: number = tooltipRect.y + totalTextSize.height / 6.5 + tooltipRect.height / 2 - totalTextSize.height / 2;

                    return {
                        id: `${chart.element.id}_axis_tooltip_${index}`,
                        d,
                        textLines,
                        textX,
                        textY,
                        textStyle,
                        lineHeight: firstLineHeight,
                        fill: axis.crosshairTooltip?.fill || chart.themeStyle.crosshairFill
                    };
                })
                .filter(
                    (tooltip: AxisTooltipRenderData | null): tooltip is AxisTooltipRenderData =>
                        tooltip !== null
                );
        },
        [findCrosshairDirection, getAxisFormattedText]
    );

    /**
     * Builds the final (static) crosshair paths for the given crosshairX/Y and highlight data.
     * This is used for the "snap" (non-animated) update, and as target shapes for reference.
     *
     * @param {Chart} chart - Chart instance
     * @param {number} crosshairX - Target crosshair x-coordinate
     * @param {number} crosshairY - Target crosshair y-coordinate
     * @param {HighlightCategoryData} highlight - Computed highlight-category information
     * @param {CrosshairLineType} lineType - Which crosshair lines to render
     * @returns {CrosshairPaths} Horizontal and vertical path strings
     */
    const computeCrosshairPaths : (
        chart: Chart,
        crosshairX: number,
        crosshairY: number,
        highlight: HighlightCategoryData,
        lineType?: CrosshairLineType
    ) => CrosshairPaths = (
        chart: Chart,
        crosshairX: number,
        crosshairY: number,
        highlight: HighlightCategoryData,
        lineType?: CrosshairLineType
    ): CrosshairPaths => {
        const rect: Rect = chart.chartAxislayout.seriesClipRect;
        let horizontal: string = '';
        let vertical: string = '';

        // Horizontal
        if (lineType === 'Both' || lineType === 'Horizontal') {
            if ((props.highlightCategory && highlight.highlightWidth !== 0) && (chart.iSTransPosed || chart.requireInvertedAxis)) {
                const w: number = highlight.highlightWidth;
                const adjY: number = adjustCrosshairPositionForOverflow(
                    crosshairY, true, highlight.leftOverflow, highlight.rightOverflow
                );
                const yTop: number = adjY - w / 2;
                horizontal =
                    `M ${rect.x} ${yTop} L ${rect.x + rect.width} ${yTop} ` +
                    `L ${rect.x + rect.width} ${yTop + w} L ${rect.x} ${yTop + w} Z`;
            } else {
                horizontal = `M ${rect.x} ${crosshairY} L ${rect.x + rect.width} ${crosshairY}`;
            }
        }

        // Vertical
        if (lineType === 'Both' || lineType === 'Vertical') {
            if ((props.highlightCategory && highlight.highlightWidth !== 0) && !chart.requireInvertedAxis) {
                const w: number = highlight.highlightWidth;
                const adjX: number = adjustCrosshairPositionForOverflow(
                    crosshairX, false, highlight.leftOverflow, highlight.rightOverflow
                );
                const xLeft: number = adjX - w / 2;
                vertical =
                    `M ${xLeft} ${rect.y} L ${xLeft + w} ${rect.y} ` +
                    `L ${xLeft + w} ${rect.y + rect.height} L ${xLeft} ${rect.y + rect.height} Z`;
            } else {
                vertical = `M ${crosshairX} ${rect.y} L ${crosshairX} ${rect.y + rect.height}`;
            }
        }

        return { horizontal, vertical };
    };

    /**
     * Computes the snapped crosshair anchor location in pixels for the given chart state.
     *
     * - Aggregates the closest X-aligned point from each visible, tooltip-enabled series.
     * - If multiple points align on the same X, aligns to the axis position from the best candidate.
     * - If only one candidate exists, snaps to the point’s symbol location.
     * - Falls back to mouse coordinates when no candidates exist.
     *
     * @param {Chart} chart - The chart instance containing the current mouse position, visible series, and axis layout.
     * @returns {{x: number, y: number}} The snapped crosshair anchor coordinates in chart pixel space.
     */
    function computeSnapAnchor(chart: Chart): { x: number; y: number } {
        const commonXValues: number[] = getCommonXValues(chart.visibleSeries);
        const candidates: PointData[] = [];
        let lastData: PointData | null = null;

        let closestXDelta: number = Number.MAX_VALUE;
        let bestY: number = Number.MAX_VALUE;

        for (const series of chart.visibleSeries) {
            if (!series.visible || !series.enableTooltip) {
                continue;
            }

            const data: PointData | null = getClosestX(chart, series, commonXValues);
            const hasSymbol: boolean = !!(data && data.point?.symbolLocations?.length);
            const hasClip: boolean = !!(data && data.series.clipRect);
            if (
                !data ||
                !data.point ||
                !data.point.symbolLocations ||
                data.point.symbolLocations.length === 0 ||
                !data.series.clipRect
            ) {
                continue;
            }
            if (data && hasSymbol && hasClip) {
                candidates.push(data);

                const pointAxisX: number = chart.requireInvertedAxis
                    ? data.point.symbolLocations[0].y
                    : data.point.symbolLocations[0].x;

                const mouseAxisCoord: number = chart.requireInvertedAxis
                    ? (chart.mouseY - data.series.clipRect!.y)
                    : (chart.mouseX - data.series.clipRect!.x);

                const pointYInSeries: number = data.point.symbolLocations[0].y;
                const mouseYInSeries: number = chart.mouseY - data.series.clipRect!.y;

                const xDelta: number = Math.abs(mouseAxisCoord - pointAxisX);
                const isBetter: boolean =
                    xDelta <= closestXDelta &&
                    Math.abs(pointYInSeries - mouseYInSeries) < Math.abs(bestY - mouseYInSeries);

                if (isBetter) {
                    closestXDelta = xDelta;
                    bestY = pointYInSeries;
                    lastData = data;
                }
            }
        }

        if (candidates.length === 0) {
            return { x: chart.mouseX, y: chart.mouseY };
        }

        if (candidates.length > 1 && lastData) {
            const mv: { valueX: number; valueY: number } = findMouseValues(lastData, chart);
            return { x: mv.valueX, y: mv.valueY };
        }

        const single: PointData = candidates[0] as PointData;
        if (single.point?.symbolLocations?.[0] && single.series.clipRect) {
            const anchorX: number = single.series.clipRect.x + single.point.symbolLocations[0].x;
            const anchorY: number = single.series.clipRect.y + single.point.symbolLocations[0].y;
            return { x: anchorX, y: anchorY };
        }

        return { x: chart.mouseX, y: chart.mouseY };
    }

    /**
     * Main crosshair rendering function that calculates positions, generates SVG paths, and updates component state.
     * Handles both simple crosshair lines and complex category highlighting with overflow adjustments.
     *
     * @function
     * @param {Chart} chart - Chart instance containing all necessary data for crosshair rendering
     * @returns {void}
     *
     */
    const renderCrosshair: (chart: Chart) => void = (chart: Chart): void => {

        const visibleSeriesLength: number = chart.visibleSeries?.filter((series: SeriesProperties): boolean => series.visible).length || 0;

        const highlightData: HighlightCategoryData = findMousePoints(chart);

        const chartRect: Rect = chart.chartAxislayout.seriesClipRect;

        if (visibleSeriesLength === 0 ||
            highlightData.valueY === undefined ||
            !withInBounds(chart.mouseX, chart.mouseY, chartRect) ||
            (props.highlightCategory && !highlightData.seriesVisible)) {
            return;
        }

        let crosshairX: number = highlightData.valueX;
        let crosshairY: number = highlightData.valueY;

        if (!props.highlightCategory) {
            if (props.snap) {
                const anchor: { x: number; y: number } = computeSnapAnchor(chart);
                crosshairX = anchor.x;
                crosshairY = anchor.y;
            } else {
                // Tooltip disabled: use mouse directly
                crosshairX = chart.mouseX;
                crosshairY = chart.mouseY;
            }
        }

        setCurrentCrosshairData({
            valueX: crosshairX,
            valueY: crosshairY,
            highlightWidth: highlightData.highlightWidth,
            leftOverflow: highlightData.leftOverflow,
            rightOverflow: highlightData.rightOverflow
        });

        setCrosshairVisible(true);

        const targetPaths: CrosshairPaths = computeCrosshairPaths(
            chart,
            crosshairX,
            crosshairY,
            highlightData,
            props.lineType
        );

        setHorizontalPath(targetPaths.horizontal);
        setVerticalPath(targetPaths.vertical);
        const newAxisTooltips: AxisTooltipRenderData[] = computeAxisTooltips(chart, crosshairX, crosshairY);
        setAxisTooltips(newAxisTooltips);

    };

    // Only render if in rendering phase and crosshair is enabled
    if (phase !== 'rendering' || !props.enable) {
        return null;
    }

    const chart: Chart = layoutRef.current?.chart as Chart;

    const shouldUseHorizontalHighlight: boolean | undefined = props.highlightCategory &&
        currentCrosshairData.highlightWidth > 0 &&
        (chart.iSTransPosed || chart.requireInvertedAxis);

    const shouldUseVerticalHighlight: boolean | undefined = props.highlightCategory &&
        currentCrosshairData.highlightWidth > 0 &&
        !chart.requireInvertedAxis;

    return (
        <g id={`${chart.element.id}_Crosshair`} style={{ visibility: crosshairVisible ? 'visible' : 'hidden' }}
            key={`${chart.element.id}_Crosshair`}>
            {/* Horizontal crosshair line */}
            {(props.lineType === 'Both' || props.lineType === 'Horizontal') && (
                <path
                    key={`${chart.element.id}_HorizontalLine`}
                    id={`${chart.element.id}_HorizontalLine`}
                    d={horizontalPath}
                    fill={shouldUseHorizontalHighlight ? crosshairLightenColor(props.lineStyle?.color ?? chart.themeStyle.crosshairLine)
                        : props.lineStyle?.color || chart.themeStyle.crosshairLine}
                    stroke={shouldUseHorizontalHighlight ? 'none' : props.lineStyle?.color || chart.themeStyle.crosshairLine}
                    strokeWidth={shouldUseHorizontalHighlight ? 0 : props.lineStyle?.width ?? 1}
                    strokeDasharray={shouldUseHorizontalHighlight ? undefined : props.lineStyle?.dashArray}
                    opacity={props.lineStyle?.opacity ?? 1}
                />
            )}

            {/* Vertical crosshair line */}
            {(props.lineType === 'Both' || props.lineType === 'Vertical') && (
                <path
                    key={`${chart.element.id}_VerticalLine`}
                    id={`${chart.element.id}_VerticalLine`}
                    d={verticalPath}
                    fill={shouldUseVerticalHighlight ? crosshairLightenColor(props.lineStyle?.color ?? chart.themeStyle.crosshairLine)
                        : props.lineStyle?.color || chart.themeStyle.crosshairLine}
                    stroke={shouldUseVerticalHighlight ? 'none' : props.lineStyle?.color || chart.themeStyle.crosshairLine}
                    strokeWidth={shouldUseVerticalHighlight ? 0 : props.lineStyle?.width ?? 1}
                    strokeDasharray={shouldUseVerticalHighlight ? undefined : props.lineStyle?.dashArray}
                    opacity={props.lineStyle?.opacity ?? 1}
                />
            )}

            {axisTooltips.map((tooltip: AxisTooltipRenderData) => (
                <g id={tooltip.id} key={tooltip.id}>
                    <path
                        key={`${tooltip.id}_Rect`}
                        id={`${tooltip.id}_Rect`}
                        d={tooltip.d}
                        fill={tooltip.fill}
                    />
                    {tooltip.textLines.map((line: string, index: number) => (
                        <text
                            key={`${tooltip.id}_Text_${index}`}
                            id={`${tooltip.id}_Text_${index}`}
                            textAnchor='middle'
                            dominantBaseline={'hanging'}
                            fill={tooltip.textStyle?.color || chart.themeStyle.crosshairLabelFont?.color}
                            fontStyle={tooltip.textStyle?.fontStyle || chart.themeStyle.crosshairLabelFont?.fontStyle}
                            fontSize={tooltip.textStyle?.fontSize || chart.themeStyle.crosshairLabelFont?.fontSize}
                            fontFamily={tooltip.textStyle?.fontFamily || chart.themeStyle.crosshairLabelFont?.fontFamily}
                            fontWeight={tooltip.textStyle?.fontWeight || chart.themeStyle.crosshairLabelFont?.fontWeight}
                            style={{
                                transform: `translate(${tooltip.textX}px, ${tooltip.textY + index * tooltip.lineHeight}px)`
                            }}
                        >
                            {line}
                        </text>
                    ))}
                </g>
            ))}
        </g>
    );
};

export default ChartCrosshairRenderer;
