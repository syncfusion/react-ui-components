import { useState, useEffect, useRef } from 'react';
import { useLayout } from '../layout/LayoutContext';
import { ChartFontProps, ChartTooltipProps, TooltipContentFunction } from '../base/interfaces';
import { Tooltip, TooltipRefHandle } from '@syncfusion/react-svg-tooltip';
import { registerChartEventHandler } from '../hooks/useClipRect';
import { isNullOrUndefined } from '@syncfusion/react-base';
import { AxisModel, BaseZoom, Chart, Points, Rect, SeriesProperties, VisibleRangeProps } from '../chart-area/chart-interfaces';
import { ChartMarkerShape } from '../base/enum';

/**
 * Represents data for a specific point in a chart series.
 * Contains information about the point, its associated series, and positioning details.
 *
 * @private
 */
export interface PointData {
    /** Defines the data point object containing values and visualization properties. */
    point: Points;

    /** Defines the series that contains this data point. */
    series: SeriesProperties;

    /** Optional index when multiple points overlap or are in outlier positions. */
    lierIndex?: number;

    /** Optional coordinates specifying the position of the point on the chart. */
    location?: { x: number, y: number };
}

/**
 * Checks if the provided coordinates are within the bounds of the rectangle.
 *
 * @param {number} x - The x-coordinate to check.
 * @param {number} y - The y-coordinate to check.
 * @param {Rect} bounds - The bounding rectangle.
 * @param {number} width - The width of the area to include in the bounds check.
 * @param {number} height - The height of the area to include in the bounds check.
 * @returns {boolean} - Returns true if the coordinates are within the bounds; otherwise, false.
 */
function withInBounds(x: number, y: number, bounds: Rect, width: number = 0, height: number = 0): boolean {
    return (
        x >= bounds.x - width &&
        x <= bounds.x + bounds.width + width &&
        y >= bounds.y - height &&
        y <= bounds.y + bounds.height + height
    );
}


export const TooltipRenderer: React.FC<ChartTooltipProps> = (props: ChartTooltipProps) => {
    const { layoutRef, phase } = useLayout();
    const [tooltipVisible, setTooltipVisible] = useState(false);
    const [tooltipLocation, setTooltipLocation] = useState({ x: 0, y: 0 });
    const [tooltipData, setTooltipData] = useState<{
        header: string;
        content: string[];
        pointData: Points | undefined;
        textStyle: object;
    }>({
        header: '',
        content: [],
        pointData: undefined,
        textStyle: props.textStyle || {}
    });
    const [shapes, setShapes] = useState<ChartMarkerShape[]>([]);
    const [palette, setPalette] = useState<string[]>([]);
    const [currentPoints, setCurrentPoints] = useState<PointData[]>([]);
    const [lierIndex, setLierIndex] = useState(0);

    // Use refs for values that shouldn't trigger re-renders
    const previousPointsRef: React.RefObject<PointData[]> = useRef<PointData[]>([]);
    const tooltipRef: React.RefObject<TooltipRefHandle | null> = useRef<TooltipRefHandle>(null);
    const hideTooltipTimeoutRef: React.RefObject<NodeJS.Timeout | null> = useRef<NodeJS.Timeout | null>(null);
    const lastUpdateTimeRef: React.RefObject<number> = useRef(0);
    const touchTimeoutRef: React.RefObject<NodeJS.Timeout | null> = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (phase === 'rendering' && layoutRef.current.chart) {
            // Register tooltip mouse handlers
            const unregisterMouseMove: () => void = registerChartEventHandler(
                'mouseMove',
                (_e: Event, chart: Chart) => handleMouseMove(chart), (layoutRef.current?.chart as Chart)?.element.id
            );

            const unregisterMouseDown: () => void = registerChartEventHandler(
                'mouseDown',
                (e: Event, chart: Chart) => {
                    if (layoutRef.current?.chartZoom && (layoutRef.current?.chartZoom as BaseZoom).isPanning) {
                        return;
                    }
                    handleMouseDown(e, chart);
                }, (layoutRef.current?.chart as Chart)?.element.id
            );

            const unregisterMouseUp: () => void = registerChartEventHandler(
                'mouseUp',
                (e: Event) => handleMouseUp(e), (layoutRef.current?.chart as Chart)?.element.id
            );

            const unregisterMouseLeave: () => void = registerChartEventHandler(
                'mouseLeave',
                () => handleMouseOut(), (layoutRef.current?.chart as Chart)?.element.id
            );
            const chart: Chart = (layoutRef.current.chart as Chart);
            chart.tooltipRef = tooltipRef;
            // Return cleanup function
            return () => {
                unregisterMouseMove();
                unregisterMouseDown();
                unregisterMouseUp();
                unregisterMouseLeave();
            };
        }
        return;
    }, [phase, layoutRef.current.chart, props.shared]);

    useEffect(() => {
        return () => {
            if (hideTooltipTimeoutRef.current) {
                clearTimeout(hideTooltipTimeoutRef.current);
            }
            if (touchTimeoutRef.current) {
                clearTimeout(touchTimeoutRef.current);
            }
        };
    }, []);

    /**
     * Handle touch start events for tooltip updates - synchronized with trackball
     *
     * @param {Event} event - The touch event that initiates the tooltip interaction
     * @param {Chart} chart - The chart object
     * @returns {void}
     */
    function handleMouseDown(event: Event, chart: Chart): void {
        if (event.type === 'touchstart') {
            if (touchTimeoutRef.current) {
                clearTimeout(touchTimeoutRef.current);
                touchTimeoutRef.current = null;
            }
            if (hideTooltipTimeoutRef.current) {
                clearTimeout(hideTooltipTimeoutRef.current);
                hideTooltipTimeoutRef.current = null;
            }

            if (withInBounds(chart.mouseX, chart.mouseY, chart.chartAxislayout.seriesClipRect) &&
                !chart.zoomRedraw && !chart.startPanning) {
                if (props.shared) {
                    renderGroupedTooltip(chart);
                } else {
                    renderSeriesTooltip();
                }
            }
        }
    }

    /**
     * Handles mouse move events on the chart, updating tooltip visibility and position.
     *
     * @param {Chart} chart - The chart object containing layout and data details.
     * @returns {void}
     */
    function handleMouseMove(chart: Chart): void {
        // Check if mouse is within chart area
        if (chart.chartAxislayout?.seriesClipRect &&
            withInBounds(chart.mouseX, chart.mouseY, chart.chartAxislayout.seriesClipRect) && !chart.zoomRedraw && !chart.startPanning) {
            // Clear any pending hide timeout
            if (hideTooltipTimeoutRef.current) {
                clearTimeout(hideTooltipTimeoutRef.current);
                hideTooltipTimeoutRef.current = null;
            }
            // Handle tooltip display based on shared setting
            if (!props.shared) {
                renderSeriesTooltip();
            } else {
                renderGroupedTooltip(chart);
            }
        } else {
            // Hide tooltip if mouse is outside chart area
            if (tooltipRef.current) {
                if (hideTooltipTimeoutRef.current) {
                    clearTimeout(hideTooltipTimeoutRef.current);
                }
                hideTooltipTimeoutRef.current = setTimeout(() => {
                    tooltipRef.current?.fadeOut();
                    setTooltipVisible(false);
                    hideTooltipTimeoutRef.current = null;
                }, props.fadeOutDuration);
            }
        }
    }

    /**
     * Handles mouse out events on the chart, hiding the tooltip.
     *
     * @returns {void}
     */
    function handleMouseOut(): void {
        if (tooltipRef.current) {
            setTimeout(() => {
                tooltipRef.current?.fadeOut();
            }, props.fadeOutDuration);
        }
        setTooltipVisible(false);
    }

    /**
     * Handles mouse up events on the chart, hiding the tooltip with timeout for touch events.
     * Synchronized with TrackballRenderer timeout behavior.
     *
     * @param {Event} [event] - The mouse or touch event (optional).
     * @returns {void}
     */
    function handleMouseUp(event?: Event): void {
        if (event && event.type === 'touchend') {
            if (touchTimeoutRef.current) {
                clearTimeout(touchTimeoutRef.current);
                touchTimeoutRef.current = null;
            }

            touchTimeoutRef.current = setTimeout(() => {
                tooltipRef.current?.fadeOut();
                setTooltipVisible(false);
                touchTimeoutRef.current = null;
            }, 2000);
        }
        const data: PointData = getData() as PointData;
        if (lierIndex) {
            data.lierIndex = lierIndex;
        }
        // If no data point found, hide tooltip and return
        if ((!data || !data.point) && props.fadeOutMode === 'Click') {
            if (tooltipRef.current) {
                // Schedule hiding the tooltip after delay
                if (hideTooltipTimeoutRef.current) {
                    clearTimeout(hideTooltipTimeoutRef.current);
                }
                hideTooltipTimeoutRef.current = setTimeout(() => {
                    tooltipRef.current?.fadeOut();
                    setTooltipVisible(false);
                    hideTooltipTimeoutRef.current = null;
                }, props.fadeOutDuration);
            }
            return;
        }
    }

    /**
     * Retrieves data needed for displaying the tooltip based on the current mouse position.
     *
     * @returns {PointData | null} The PointData object containing information for the tooltip, or null if no data is found.
     */
    function getData(): PointData | null {
        const chart: Chart = layoutRef.current.chart as Chart;
        let point: Points | null = null;
        let series: SeriesProperties | null = null;
        for (let len: number = chart.visibleSeries.length, i: number = len - 1; i >= 0; i--) {
            series = chart.visibleSeries[i as number];
            const width: number = (series.type === 'Scatter' || series.drawType === 'Scatter' || (series.marker?.visible))
                ? (series.marker?.height as number + 5) / 2 : 0;
            const height: number = (series.type === 'Scatter' || series.drawType === 'Scatter' || (series.marker?.visible))
                ? (series.marker?.width as number + 5) / 2 : 0;
            const mouseX: number = chart.mouseX;
            const mouseY: number = chart.mouseY;
            if (series.visible && series.clipRect && withInBounds(mouseX, mouseY, series.clipRect, width, height)) {
                point = getRectPoint(series, series.clipRect, mouseX, mouseY);
            }
            if (point) {
                return { point, series, lierIndex };
            }
        }
        return null;
    }

    /**
     * Determines which point, if any, is located within a specified rectangle.
     *
     * @param {SeriesProperties} series - The chart series to evaluate points on.
     * @param {Rect} rect - The rectangle to check points against.
     * @param {number} x - The x-coordinate to check.
     * @param {number} y - The y-coordinate to check.
     * @returns {Points | null} The found point or null if no points are within the rectangle.
     */
    function getRectPoint(series: SeriesProperties, rect: Rect, x: number, y: number): Points | null {
        const insideRegion: boolean = false;
        for (const point of series.visiblePoints as Points[]) {
            if (!point.regionData) {
                if (!point.regions || !point.regions.length) {
                    continue;
                }
            }

            // Check if point is in region
            if (!insideRegion && point.regions && checkRegionContainsPoint(point.regions, rect, x, y)) {
                return point;
            } else if (insideRegion && point.regions && checkRegionContainsPoint(point.regions, rect, x, y)) {
                return point;
            }
        }
        return null;
    }

    /**
     * Checks whether a region rectangle contains a specific point.
     *
     * @param {Rect[]} regionRect - An array of regions describing rectangles.
     * @param {Rect} rect - The parent rectangle area.
     * @param {number} x - The x-coordinate of the point to check.
     * @param {number} y - The y-coordinate of the point to check.
     * @returns {boolean} Returns true if the region contains the point, false otherwise.
     */
    function checkRegionContainsPoint(regionRect: Rect[], rect: Rect, x: number, y: number): boolean {
        return regionRect.some((region: Rect, index: number) => {
            setLierIndex(index);
            return withInBounds(
                x, y,
                {
                    x: (rect.x) + region.x,
                    y: (rect.y) + region.y,
                    width: region.width,
                    height: region.height
                }
            );
        });
    }

    /**
     * Generates a tooltip header based on the PointData object.
     *
     * @param {PointData} data - The data object containing point and series information.
     * @returns {string} The formatted header string for the tooltip.
     */
    function findHeader(data: PointData): string {
        const headerTemplate: string = props.headerText === null || props.headerText === undefined ?
            (props.shared ? '${point.x}' : '${series.name}') :
            props.headerText!;
        // Parse template
        let header: string = headerTemplate;
        // Replace point values
        Object.entries(data.point).forEach(([key, val]: [string, object]) => {
            const placeholder: string = `\${point.${key}}`;
            const xAxis: AxisModel = data.series.xAxis;
            const yAxis: AxisModel = data.series.yAxis;
            const value: string = formatPointValue(val, placeholder === '${point.x}' ? xAxis : yAxis, placeholder === '${point.x}', placeholder === '${point.y}');
            header = header.split(placeholder).join(value);
        });
        // Replace series values using Object.entries
        Object.entries(data.series).forEach(([key, val]: [string, string]) => {
            const placeholder: string = `\${series.${key}}`;
            const value: string = val?.toString() || '';
            header = header.split(placeholder).join(value);
        });
        if (header.replace(/<b>/g, '').replace(/<\/b>/g, '').trim() !== '') {
            return header;
        }
        return '';
    }

    /**
     * Formats the text content for the tooltip using data from PointData.
     *
     * @param {PointData} data - The data object containing point and series information.
     * @returns {string} The formatted text for the tooltip.
     */
    function getTooltipText(data: PointData): string {
        // Get format
        let format: string | undefined = props.format || data.series.tooltipFormat;
        if (!format) {
            const textX: string = '${point.x}';
            format = !props.shared ? textX : '${series.name}';
            format += ': ' + ('<b>${point.y}</b>');
        }
        // Parse template
        let text: string = format;
        // Replace point values
        // Replace point values using Object.entries
        Object.entries(data.point).forEach(([key, val]: [string, object]) => {
            const placeholder: string = `\${point.${key}}`;
            const xAxis: AxisModel = data.series.xAxis;
            const yAxis: AxisModel = data.series.yAxis;
            const value: string = formatPointValue(val, placeholder === '${point.x}' ? xAxis : yAxis, placeholder === '${point.x}', placeholder === '${point.y}');
            text = text.split(placeholder).join(value);
        });

        // Replace series values using Object.entries
        Object.entries(data.series).forEach(([key, val]: [string, string]) => {
            const placeholder: string = `\${series.${key}}`;
            const value: string = val?.toString() || '';
            text = text.split(placeholder).join(value);
        });
        return text;
    }

    /**
     * Formats the point value based on axis settings and point type.
     *
     * @param {object} pointValue - The value of the point to format.
     * @param {AxisModel} axis - The axis model containing format information.
     * @param {boolean} isXPoint - Whether this is an X-axis point.
     * @param {boolean} isYPoint - Whether this is a Y-axis point.
     * @returns {string} The formatted point value as a string.
     */
    function formatPointValue(pointValue: object, axis: AxisModel, isXPoint: boolean, isYPoint: boolean): string {
        let textValue: string;
        let customLabelFormat: boolean;
        let value: string;
        const axisLabelFormat: string = axis.labelStyle?.format || '';
        if (axis.valueType !== 'Category' && isXPoint) {
            customLabelFormat = axisLabelFormat !== '' && axisLabelFormat.match('{value}') !== null;
            const formattedValue: string | number | Object = axis.valueType === 'Double' ? +pointValue : pointValue;
            textValue = customLabelFormat ? axisLabelFormat.replace('{value}', axis.format(formattedValue)) :
                axis.format(formattedValue);
        } else if (isYPoint && !isNullOrUndefined(pointValue)) {
            customLabelFormat = axisLabelFormat !== '' && axisLabelFormat.match('{value}') !== null;
            value = axis.format(+pointValue);
            textValue = customLabelFormat ? axisLabelFormat.replace('{value}', value) : value;
        } else {
            textValue = pointValue?.toString() || '';
        }
        return textValue;
    }

    /**
     * Renders a series tooltip with the relevant data and styles.
     *
     * @returns {void}
     */
    function renderSeriesTooltip(): void {
        let data: PointData = getData() as PointData;
        let closestPointData: PointData | null = null;
        let smallestDistance: number = Infinity;

        if (lierIndex) {
            data.lierIndex = lierIndex;
        }
        // If no data point found directly under cursor, check for nearest point if enabled
        if (!data || !data.point) {
            const chart: Chart = layoutRef.current.chart as Chart;

            if (props.showNearestTooltip && withInBounds(chart.mouseX, chart.mouseY, chart.chartAxislayout.seriesClipRect)) {
                const commonXvalues: number[] = getCommonXValues(chart.visibleSeries);

                // Find nearest point in any visible series
                for (let i: number = chart.visibleSeries.length - 1; i >= 0; i--) {
                    const series: SeriesProperties = chart.visibleSeries[i as number];
                    if (!series.visible || !series.enableTooltip || series.isRectSeries || series.type === 'Scatter' || series.type === 'Bubble') {
                        continue;
                    }
                    const pointData: PointData | null = getClosestX(chart, series, commonXvalues);

                    if (pointData && pointData.point && series.clipRect && pointData.point.symbolLocations &&
                        pointData.point.symbolLocations[0]) {
                        const symbolX: number = series.clipRect.x + pointData.point.symbolLocations[0].x;
                        const symbolY: number = series.clipRect.y + pointData.point.symbolLocations[0].y;
                        if (!withInBounds(symbolX, symbolY, chart.chartAxislayout.seriesClipRect)) {
                            continue;
                        }
                        // Calculate distance to current point
                        const currentDistance: number = Math.sqrt(
                            Math.pow((chart.mouseX - series.clipRect.x) - pointData.point.symbolLocations[0].x, 2) +
                            Math.pow((chart.mouseY - series.clipRect.y) - pointData.point.symbolLocations[0].y, 2)
                        );

                        if (currentDistance < smallestDistance) {
                            smallestDistance = currentDistance;
                            closestPointData = pointData;
                        }
                    }
                }

                if (closestPointData) {
                    data = closestPointData;
                }
            }
        }

        // If still no data found or point found but tooltip should hide
        if ((!data || !data.point) || !data.series?.enableTooltip) {
            if (tooltipRef.current && props.fadeOutMode === 'Move') {
                // Schedule hiding the tooltip after delay
                if (hideTooltipTimeoutRef.current) {
                    clearTimeout(hideTooltipTimeoutRef.current);
                }
                hideTooltipTimeoutRef.current = setTimeout(() => {
                    tooltipRef.current?.fadeOut();
                    setTooltipVisible(false);
                    hideTooltipTimeoutRef.current = null;
                }, props.fadeOutDuration);
            }
            return;
        }
        // Check if it's the same point as before
        const isSamePoint: boolean = previousPointsRef.current.length > 0 &&
            previousPointsRef.current[0]?.point?.index === data.point.index &&
            previousPointsRef.current[0]?.series?.index === data.series.index;
        if (isSamePoint) {
            // If it's the same point and tooltip is not visible, make it visible
            void (!tooltipVisible && tooltipRef.current && (
                tooltipRef.current.fadeIn(),
                setTooltipVisible(true)
            ));
            return;
        }
        // Update previous points BEFORE updating tooltip data to prevent blinking
        previousPointsRef.current = [data];

        const header: string = findHeader(data);
        let content: string = getTooltipText(data);

        const customText: string | string[] | boolean = applyTooltipContentCallback(content, props);
        if (typeof customText === 'boolean' && !customText) {
            return; // Don't show tooltip if event is canceled
        } else if (typeof customText !== 'boolean') {
            content = customText as string;
        }

        // Get tooltip location
        const location: { x: number, y: number } | null = getSymbolLocation(data);
        location!.x = props.location?.x !== undefined ? props.location!.x : location!.x;
        location!.y = props.location?.y !== undefined ? props.location!.y : location!.y;

        // Update tooltip data
        setTooltipData({
            header,
            content: [content],
            pointData: data.point,
            textStyle: props.textStyle as ChartFontProps
        });
        setTooltipLocation(location!);
        setShapes([getShapeForSeries(data)]);
        setPalette([findColor(data)]);
        setTooltipVisible(true);

        // Show tooltip
        tooltipRef.current?.fadeIn();
        // Update current points
        setCurrentPoints([data]);
    }


    /**
     * Determines the color for a data point in a series.
     *
     * @param {PointData} data - The data object containing point and series information.
     * @returns {string} The determined color for the data point.
     */
    function findColor(data: PointData): string {
        return data.point.color && data.point.color !== '#ffffff' ? data.point.color :
            data.point.interior || data.series.marker?.fill || data.series.interior;
    }

    /**
     * Finds the symbol location for a given data point.
     *
     * @param {PointData} data - The data object containing point and series information.
     * @returns {{x: number, y: number} | null} The calculated symbol location or null if not available.
     */
    function getSymbolLocation(data: PointData): { x: number, y: number } | null {
        if (!data.point.symbolLocations || !data.point.symbolLocations[0]) {
            return null;
        }
        return {
            x: data.series.clipRect!.x + data.point.symbolLocations[0].x,
            y: data.series.clipRect!.y + data.point.symbolLocations[0].y
        };
    }

    /**
     * Determines the shape of the tooltip marker based on the series type.
     *
     * @param {PointData} data - The data object containing point and series information.
     * @returns {ChartMarkerShape} The shape of the tooltip marker.
     */
    function getShapeForSeries(data: PointData): ChartMarkerShape {
        if (!props.showMarker) {
            return 'None';
        }
        const markerShape: ChartMarkerShape = data.series.marker?.shape === 'None' ? 'None' : ((data).point.marker.shape || data.series.marker?.shape || 'Circle');
        return markerShape;
    }

    /**
     * Renders a grouped tooltip for shared tooltip mode, handling multiple data points.
     *
     * @param {Chart} chart - The chart object containing layout and data details.
     * @returns {void} This function does not return a value.[/SUFFIX]
     */
    function renderGroupedTooltip(chart: Chart): void {
        // Clear current points and prepare for new data
        setCurrentPoints([]);
        const dataCollection: PointData[] = [];
        let lastData: PointData | null = null;
        let tempData: PointData | null = null;
        let closestXValue: number = Number.MAX_VALUE;
        let closetYValue: number = Number.MAX_VALUE;
        let pointXValue: number;
        let pointYValue: number;
        // Get common X values across all visible series
        const commonXValues: number[] = getCommonXValues(chart.visibleSeries);
        // Process each visible series to find points at the same X position
        for (const series of chart.visibleSeries) {
            if (!series.visible || !series.enableTooltip) {
                continue;
            }
            // Get closest point in this series
            const data: PointData | null = getClosestX(chart, series, commonXValues);
            if (data && data.point) {
                // Calculate distance to determine the closest point overall
                pointXValue = (!chart.requireInvertedAxis) ?
                    chart.mouseX - (data.series.clipRect!.x) :
                    chart.mouseY - (data.series.clipRect!.y);
                pointYValue = chart.mouseY - (data.series.clipRect!.y);
                if (data.point.symbolLocations && data.point.symbolLocations.length &&
                    Math.abs(pointXValue - data.point.symbolLocations[0].x) <= closestXValue &&
                    Math.abs(data.point.symbolLocations[0].y - pointYValue) < Math.abs(closetYValue - pointYValue)) {
                    closestXValue = Math.abs(pointXValue - data.point.symbolLocations[0].x);
                    closetYValue = data.point.symbolLocations[0].y;
                    tempData = data;
                }
                lastData = tempData || data;
                dataCollection.push(data);
            }
        }

        // If no data points found, hide tooltip
        if (dataCollection.length === 0) {
            tooltipRef.current?.fadeOut();
            setTooltipVisible(false);
            return;
        }

        // Filter points to only include those at the same X position as the closest point
        const collection: PointData[] = [];
        for (const data of dataCollection) {
            if (data.point.symbolLocations?.[0].x === lastData?.point?.symbolLocations?.[0].x || ((data.series.type?.indexOf('Column') !== -1 ||
                lastData?.series.type?.indexOf('Column') !== -1) && (data.point.xValue === lastData?.point.xValue))) {
                collection.push(data);
            }
        }
        // Prepare tooltip data
        const header: string = findHeader(collection[0]);
        let contentArray: string[] = [];
        const newShapes: ChartMarkerShape[] = [];
        const newPalette: string[] = [];
        // Generate content for each point
        for (const data of collection) {
            contentArray.push(getTooltipText(data));
            newShapes.push(getShapeForSeries(data));
            newPalette.push(findColor(data));
        }

        const customText: string | string[] | boolean = applyTooltipContentCallback(contentArray, props);
        if (typeof customText === 'boolean' && !customText) {
            return; // Don't show tooltip if event is canceled
        }
        else if (typeof customText !== 'boolean') {
            contentArray = customText as string[];
        }

        // Find tooltip location
        let location: { x: number, y: number } | null = null;
        void (lastData && (location = findSharedLocation(collection, lastData)));
        if (!location) {
            location = { x: chart.mouseX, y: chart.mouseY };
        }

        // Update tooltip data
        setTooltipData({
            header,
            content: contentArray,
            pointData: collection.length === 1 ? collection[0].point : lastData?.point,
            textStyle: props.textStyle as ChartFontProps
        });

        const now: number = Date.now();
        const timeSinceLastUpdate: number = now - lastUpdateTimeRef.current;
        const shouldUpdatePosition: boolean = timeSinceLastUpdate > 50; // Only update position every 50ms

        if (shouldUpdatePosition) {
            setTooltipLocation(location);
            lastUpdateTimeRef.current = now;
        }
        setShapes(newShapes);
        setPalette(newPalette);
        setCurrentPoints(collection);
        setTooltipVisible(true);
        // Show tooltip
        tooltipRef.current?.fadeIn();
    }

    /**
     * Helper function to get common X values across all visible series.
     *
     * @param {SeriesProperties[]} visibleSeries - The array of visible series in the chart.
     * @returns {number[]} An array of common X values across the series.
     */
    function getCommonXValues(visibleSeries: SeriesProperties[]): number[] {
        const commonXValues: number[] = [];
        for (let j: number = 0; j < visibleSeries.length; j++) {
            for (let i: number = 0; i < (visibleSeries[j as number].points && visibleSeries[j as number].points.length); i++) {
                const point: Points = visibleSeries[j as number].points[i as number];
                if (point && (point.index === 0 || point.index === visibleSeries[j as number].points.length - 1 ||
                    (point.symbolLocations && point.symbolLocations.length > 0))) {
                    void (point.xValue != null && commonXValues.push(point.xValue));
                }
            }
        }
        return commonXValues;
    }

    /**
     * Finds the point closest to the current X position in the series.
     *
     * @param {Chart} chart - The chart object containing layout and data details.
     * @param {SeriesProperties} series - The series within the chart to find the point in.
     * @param {number[]} [xvalues] - Optional array of X values to consider.
     * @returns {PointData | null} The closest PointData object or null if not found.
     */
    function getClosestX(chart: Chart, series: SeriesProperties, xvalues?: number[]): PointData | null {
        let value: number = 0;
        const rect: Rect = series.clipRect as Rect;

        // Determine value based on axis inversion and mouse position
        void (chart.mouseX <= rect.x + rect.width && chart.mouseX >= rect.x &&
            (value = chart.requireInvertedAxis ?
                getValueYByPoint(chart.mouseY - rect.y, rect.height, series.xAxis) :
                getValueXByPoint(chart.mouseX - rect.x, rect.width, series.xAxis)));
        // Get closest x value
        const closest: number | null = getClosest(series, value, xvalues);

        // Find the point with this X value using the closest result
        const point: Points | undefined = closest !== null ? series.visiblePoints?.find((p: Points) => p.xValue === closest && p.visible)
            : undefined;
        // Return the point and series only if a point is found; otherwise, return null
        return point ? { point, series, lierIndex } : null;
    }

    /**
     * Finds the closest numeric value to a target within an array of `xData` values in the series.
     *
     * @param {SeriesProperties} series - The series within which to find the closest value.
     * @param {number} value - The target value to find closest to.
     * @param {number[]} [xvalues] - An optional array of X values to use for reference.
     * @returns {number | null} The closest value or null if not found.
     */
    function getClosest(series: SeriesProperties, value: number, xvalues?: number[]): number | null {
        let closest: number = 0; let data: number;
        const xData: number[] = xvalues ? xvalues : series.xData;
        const xLength: number = xData.length;
        const leftSideNearest: number = 0.5;
        const rightSideNearest: number = 0.5;
        if (value >= series.xAxis.visibleRange.minimum - leftSideNearest && value <= series.xAxis.visibleRange.maximum + rightSideNearest) {
            for (let i: number = 0; i < xLength; i++) {
                data = xData[i as number];
                if (closest == null || Math.abs(data - value) < Math.abs(closest - value)) {
                    closest = data;
                }
            }
        }
        const isDataExist: boolean = series.xData.indexOf(closest) !== -1;
        if (isDataExist) {
            return closest;
        } else {
            return null;
        }
    }

    /**
     * Converts an X coordinate to a value using the axis configuration.
     *
     * @param {number} value - The position value to convert.
     * @param {number} size - The size of the plotting area.
     * @param {AxisModel} axis - The axis containing the range and scaling information.
     * @returns {number} The equivalent value on the axis.
     */
    function getValueXByPoint(value: number, size: number, axis: AxisModel): number {
        const actualValue: number = !axis.isAxisInverse ? value / size : (1 - (value / size));
        return actualValue * (axis.visibleRange.delta) + axis.visibleRange.minimum;
    }

    /**
     * Converts a Y coordinate to a value using the axis configuration.
     *
     * @param {number} value - The position value to convert.
     * @param {number} size - The size of the plotting area.
     * @param {AxisModel} axis - The axis containing the range and scaling information.
     * @returns {number} The equivalent value on the axis.
     */
    function getValueYByPoint(value: number, size: number, axis: AxisModel): number {
        const actualValue: number = axis.isAxisInverse ? value / size : (1 - (value / size));
        return actualValue * (axis.visibleRange.delta) + axis.visibleRange.minimum;
    }

    /**
     * Finds the shared location of the tooltip when multiple points are grouped.
     *
     * @param {PointData[]} points - An array of PointData representing the grouped points.
     * @param {PointData} lastData - The last data point used for positioning.
     * @returns {{x: number, y: number} | null} The shared tooltip location or null if not available.
     */
    function findSharedLocation(points: PointData[], lastData: PointData): { x: number, y: number } | null {
        const chart: Chart = layoutRef.current.chart as Chart;
        if (points.length > 1) {
            // Calculate proper position using mouse values
            const mouseValues: { valueX: number, valueY: number } = findMouseValues(lastData, chart);

            return {
                x: mouseValues.valueX,
                y: mouseValues.valueY
            };
        } else {
            return getSymbolLocation(points[0]);
        }
    }


    /**
     * Converts a value to a coefficient based on the axis configuration.
     *
     * @param {number} value - The value to convert to a coefficient.
     * @param {AxisModel} axis - The axis containing the range and scaling information.
     * @returns {number} The coefficient based on the axis configuration.
     */
    function valueToCoefficient(value: number | null, axis: AxisModel): number {
        const range: VisibleRangeProps = axis.visibleRange;
        const result: number = (value! - range.minimum) / (range.delta);
        const isInverse: boolean = axis.isAxisInverse;
        return isInverse ? (1 - result) : result;
    }

    /**
     * Calculates mouse values used for positioning the tooltip.
     *
     * @param {PointData} data - The data point containing X and Y values.
     * @param {Chart} chart - The chart containing layout and axis information.
     * @returns {{valueX: number, valueY: number}} The calculated mouse X and Y values.
     */
    function findMouseValues(data: PointData, chart: Chart): { valueX: number, valueY: number } {
        let valueX: number = 0;
        let valueY: number = 0;

        if (!chart.requireInvertedAxis) {
            valueX = valueToCoefficient(data.point.xValue, data.series.xAxis) * data.series.xAxis.rect.width
                + data.series.xAxis.rect.x;
            valueY = chart.mouseY;
        } else {
            valueY = (1 - valueToCoefficient(data.point.xValue, data.series.xAxis)) * data.series.xAxis.rect.height
                + data.series.xAxis.rect.y;
            valueX = chart.mouseX;
        }

        return { valueX, valueY };
    }

    /**
     * Calculates the marker height for tooltip offset
     *
     * @param {PointData} pointData - The point data to calculate marker height for
     * @returns {number} The calculated marker height
     */
    function findMarkerHeight(pointData: PointData): number {
        let markerHeight: number = 0;
        const series: SeriesProperties = pointData.series;
        markerHeight = (((series.marker?.visible) || ((props.shared || props.showNearestTooltip) &&
            (!series.isRectSeries || series.marker?.visible)) || series.type === 'Scatter') && series.marker?.shape !== 'Image') ?
            ((series.marker?.height as number) + 2) / 2 + (2 * (series.marker?.border?.width || 0)) : 0;
        return markerHeight;
    }

    if (phase === 'measuring') {
        return null;
    }
    const chart: Chart = layoutRef.current.chart as Chart;
    chart.tooltipRef = tooltipRef;
    const areaBounds: Rect = chart?.rect;
    return (
        <Tooltip
            ref={tooltipRef}
            location={tooltipLocation}
            header={tooltipData.header}
            content={tooltipData.content}
            template={undefined}
            data={tooltipData.pointData}
            enableShadow={false}
            showHeaderLine={props.showHeaderLine}
            shapes={props.showMarker ? shapes : []}
            palette={palette}
            shared={props.shared}
            arrowPadding={currentPoints.length > 1 ||
                (props.location && (props.location.x !== undefined || props.location.y !== undefined)) ? 0 : 7}
            offset={currentPoints[0] && findMarkerHeight(currentPoints[0])}
            areaBounds={areaBounds}
            isFixed={(props.location && (props.location.x !== undefined || props.location.y !== undefined))}
            controlName="Chart"
            enableAnimation={props.enableAnimation}
            textStyle={tooltipData.textStyle}
            // isTextWrap={true}
            duration={props.duration}
            opacity={props.opacity}
            fill={props.fill}
            border={props.border}
            inverted={chart.requireInvertedAxis && currentPoints?.[0]?.series?.isRectSeries}
            theme={chart?.theme}
            enableRTL={chart?.enableRtl}
            markerSize={7}
        />
    );
};

/**
 * Applies a custom tooltip content callback to modify the tooltip's appearance or content.
 *
 * @param {string | string[] | boolean} text - The original tooltip content, which can be a string or an array of strings.
 * @param {ChartTooltipProps} tooltipProps - The tooltip configuration object that may contain a custom content callback.
 * @returns {string} The modified tooltip content as a string, array of strings, or boolean.
 *
 * @private
 */
export function applyTooltipContentCallback(
    text: string | string[],
    tooltipProps: ChartTooltipProps
): string | string[] | boolean {
    const contentCallback: TooltipContentFunction = tooltipProps.formatter as TooltipContentFunction;
    if (contentCallback && typeof contentCallback === 'function') {
        try {
            const customProps: string | string[] | boolean = contentCallback(text);
            return customProps;
        } catch (error) {
            return text;
        }
    }
    return text;
}
