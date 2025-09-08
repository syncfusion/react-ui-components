import { forwardRef, JSX, useEffect, useRef, useState } from 'react';
import { useLayout } from '../layout/LayoutContext';
import { ChartTooltipProps, ChartMarkerProps, ChartBorderProps, ChartLocationProps } from '../base/interfaces';
import { drawSymbol, withInBounds } from '../utils/helper';
import { registerChartEventHandler } from '../hooks/useClipRect';
import { PointData } from './TooltipRenderer';
import { colorNameToHex, convertHexToColor } from './SeriesRenderer/DataLabelRender';
import { AxisModel, Chart, ColorValue, PathOptions, Points, Rect, SeriesProperties, ChartSizeProps, BaseZoom } from '../chart-area/chart-interfaces';
import { ChartMarkerShape } from '../base/enum';
/**
 * Interface representing a trackball marker displayed on the chart.
 */
interface TrackballMarker {
    /** Index of the series this marker belongs to */
    seriesIndex: number;
    /** X coordinate of the marker */
    x: number;
    /** Y coordinate of the marker */
    y: number;
    /** Fill color of the marker */
    fill: string;
    /** Border properties of the marker */
    border: {
        /** Width of the marker border */
        width: number;
        /** Color of the marker border */
        color: string;
    };
    /** Size properties of the marker */
    size: {
        /** Width of the marker */
        width: number;
        /** Height of the marker */
        height: number;
    };
    /** Visibility state of the marker */
    visible: boolean;
    /** Shape of the marker */
    shape: ChartMarkerShape;
    /** Optional image URL for image markers */
    imageUrl?: string;
    /** Index of the current point being tracked */
    currentPointIndex: number;
    /** Data point associated with this marker */
    point?: PointData;
    /** Stroke color for the marker */
    stroke: string;
    /** Shadow effect for the marker */
    markerShadow: string;
    /** Animation state management. */
    animationState: 'appearing' | 'visible' | 'disappearing';
    /** Current radius for smooth animation. */
    currentRadius: number;
    /** Target radius to animate towards. */
    targetRadius: number;
}

/**
 * Renders trackball markers for chart series data points.
 *
 * @component TrackballRenderer.
 * @param {ChartTooltipProps} props - The tooltip model properties.
 * @returns {JSX.Element} A trackball renderer component.
 */
export const TrackballRenderer: React.ForwardRefExoticComponent<ChartTooltipProps & React.RefAttributes<SVGGElement>> =
    forwardRef<SVGGElement, ChartTooltipProps>((props: ChartTooltipProps, ref: React.ForwardedRef<SVGGElement>) => {
        const { layoutRef, phase } = useLayout();
        const [trackballMarkers, setTrackballMarkers] = useState<TrackballMarker[]>([]);
        const animationFrameRef: React.RefObject<number | null> = useRef<number | null>(null);
        const markerTimeoutRef: React.RefObject<NodeJS.Timeout | null> = useRef<NodeJS.Timeout | null>(null);
        const touchTimeoutRef: React.RefObject<NodeJS.Timeout | null> = useRef<NodeJS.Timeout | null>(null);
        const isTouchModeRef: React.RefObject<boolean> = useRef<boolean>(false);
        const isProcessingTouchRef: React.RefObject<boolean> = useRef(false);
        const previousPointRef: React.RefObject<{
            seriesIndex: number;
            pointIndex: number;
        } | null>
            = useRef<{
                seriesIndex: number;
                pointIndex: number;
            } | null>(null);
        const commonXValueRef: React.RefObject<number | null> = useRef<number | null>(null);
        const markersCreatedRef: React.RefObject<boolean> = useRef(false);
        /**
         * Initialize trackball markers for each series
         */
        useEffect(() => {
            if (phase !== 'rendering' || !layoutRef.current.chart) {
                return;
            }
            markersCreatedRef.current = false;
            const chart: Chart = layoutRef.current.chart as Chart;
            // Initialize one marker per series with visible: false
            const initialMarkers: TrackballMarker[] = [];
            // Don't render markers if tooltip is disabled
            if (!props.enable) {
                markersCreatedRef.current = true;
                return;
            }
            // Create one marker for each visible series
            for (const series of chart.visibleSeries) {
                if (!series.visible || !series.enableTooltip || !series.points || series.points.length === 0) { continue; }
                // Check if marker should be shown for this series
                // For shared tooltip or showNearestTooltip, show markers regardless of series marker visibility
                const shouldShowMarker: boolean = ((props.shared || props.showNearestTooltip) && !series.isRectSeries)
                    || (series.marker?.visible !== false);
                if (!shouldShowMarker) { continue; }
                // Get marker and series marker settings
                const seriesMarker: ChartMarkerProps | undefined = series.marker;
                // Create a single marker for this series
                if (seriesMarker?.highlightable) {
                    const baseRadius: number = (seriesMarker?.width || 8) + 3;
                    initialMarkers.push({
                        seriesIndex: series.index || 0,
                        x: 0, // Will be updated when showing
                        y: 0, // Will be updated when showing
                        fill: seriesMarker?.fill || series.interior,
                        border: {
                            width: seriesMarker?.border?.width || 1,
                            color: seriesMarker?.border?.color || series.interior
                        },
                        size: {
                            width: (seriesMarker?.width || 8) + 3,
                            height: (seriesMarker?.height as number) + 3
                        },
                        visible: false, // Initially hidden
                        shape: seriesMarker?.shape || 'Circle',
                        imageUrl: seriesMarker?.imageUrl,
                        currentPointIndex: -1,
                        stroke: '',
                        markerShadow: '',
                        animationState: 'visible',
                        currentRadius: 0,
                        targetRadius: baseRadius
                    });
                }
            }
            setTrackballMarkers(initialMarkers);
            markersCreatedRef.current = true;
        }, [phase, props.enable, props.shared, props.showNearestTooltip, (layoutRef.current.chart as Chart)?.visibleSeries.map((s: SeriesProperties) => s.visible).join('')]);
        /**
         * Set up mouse event listeners for trackball tracking
         */
        useEffect(() => {
            if (phase !== 'rendering' || !layoutRef.current.chart) {
                return;
            }
            /**
             * Handle mouse movement for trackball updates
             *
             * @param {Chart} chart - The chart object
             * @returns {void}
             */
            function handleMouseMove(chart: Chart): void {
                if (withInBounds(chart.mouseX, chart.mouseY, chart.chartAxislayout.seriesClipRect) &&
                    !chart.zoomRedraw && !chart.startPanning) {
                    if (props.shared) {
                        updateSharedTrackballVisibility();
                    } else {
                        updateTrackballVisibility();
                    }
                } else {
                    hideAllMarkers();
                }
            }

            /**
             * Handle mouse leave events to hide trackball.
             *
             * @returns {void}
             */
            function handleMouseLeave(): void {
                isTouchModeRef.current = false;
                hideAllMarkers();
            }

            /**
             * Handle touch movement events for trackball updates
             * @param {Event} event - The touch event that initiates the trackball interaction
             * @param {Chart} chart - The chart object
             * @returns {void}
             */
            function handleMouseDown(event: Event, chart: Chart): void {
                if (event.type === 'touchstart') {
                    if (isProcessingTouchRef.current) {
                        return;
                    }
                    isProcessingTouchRef.current = true;
                    isTouchModeRef.current = true;
                    if (touchTimeoutRef.current) {
                        clearTimeout(touchTimeoutRef.current);
                        touchTimeoutRef.current = null;
                    }

                    setTimeout(() => {
                        if (withInBounds(chart.mouseX, chart.mouseY, chart.chartAxislayout.seriesClipRect) &&
                            !chart.zoomRedraw && !chart.startPanning) {
                            if (props.shared) {
                                updateSharedTrackballVisibility();
                            } else {
                                updateTrackballVisibility();
                            }
                        }

                        setTimeout(() => {
                            isProcessingTouchRef.current = false;
                        }, 50);
                    }, 16);
                }
            }

            /**
             * Handle touch end events specifically for trackball with separate timeout
             *
             * @param {Event} event - The touch end event
             * @returns {void}
             */
            function handleTrackballTouchEnd(event: Event): void {
                if (event.type === 'touchend') {
                    isTouchModeRef.current = false;
                    if (touchTimeoutRef.current) {
                        clearTimeout(touchTimeoutRef.current);
                        touchTimeoutRef.current = null;
                    }

                    touchTimeoutRef.current = setTimeout(() => {
                        setTrackballMarkers((currentMarkers: TrackballMarker[]) =>
                            currentMarkers.map((marker: TrackballMarker) => ({ ...marker, visible: false }))
                        );
                        previousPointRef.current = null;
                        commonXValueRef.current = null;
                        touchTimeoutRef.current = null;
                    }, 2000);
                }
            }

            const unregisterMouseDown: () => void = registerChartEventHandler(
                'mouseDown',
                (e: Event, chart: Chart) => {
                    if (layoutRef.current?.chartZoom && (layoutRef.current?.chartZoom as BaseZoom).isPanning) {
                        return;
                    }
                    handleMouseDown(e, chart);
                }, (layoutRef.current?.chart as Chart)?.element.id
            );

            const unregisterMouseMove: () => void = registerChartEventHandler(
                'mouseMove',
                (_e: Event, chart: Chart) => handleMouseMove(chart), (layoutRef.current?.chart as Chart)?.element.id
            );

            const unregisterMouseLeave: () => void = registerChartEventHandler(
                'mouseLeave',
                () => handleMouseLeave(), (layoutRef.current?.chart as Chart)?.element.id
            );
            const unregisterTouchEnd: () => void = registerChartEventHandler(
                'mouseUp', // This handles touchend events as well
                (e: Event) => handleTrackballTouchEnd(e),
                (layoutRef.current?.chart as Chart)?.element.id
            );

            // Return cleanup function
            return () => {
                unregisterMouseMove();
                unregisterMouseLeave();
                unregisterMouseDown();
                unregisterTouchEnd();
            };
        }, [phase, trackballMarkers.length]);

        /**
         * Hides all trackball markers with a timeout
         *
         * @returns {void}
         */
        function hideAllMarkers(): void {
            if (markerTimeoutRef.current) {
                clearTimeout(markerTimeoutRef.current);
            }
            markerTimeoutRef.current = setTimeout(() => {
                setTrackballMarkers((currentMarkers: TrackballMarker[]) =>
                    currentMarkers.map((marker: TrackballMarker) => ({ ...marker, visible: false }))
                );
                previousPointRef.current = null;
                commonXValueRef.current = null;
            }, (layoutRef.current.chart as Chart).zoomRedraw ? 0 : 1000);
        }

        const animateMarkers: () => void = () => {
            setTrackballMarkers((currentMarkers: TrackballMarker[]) => {
                let hasActiveAnimation: boolean = false;

                const updatedMarkers: TrackballMarker[] = currentMarkers.map((marker: TrackballMarker) => {
                    if (marker.animationState === 'appearing' || marker.animationState === 'disappearing') {
                        const animationSpeed: number = 0.15;
                        const difference: number = marker.targetRadius - marker.currentRadius;
                        const series: SeriesProperties = (layoutRef.current.chart as Chart)?.visibleSeries[marker.seriesIndex];
                        const markerVisibility: boolean = series && (series.marker?.visible || series.type === 'Bubble' || series.type === 'Scatter');
                        if (Math.abs(difference) > 0.5 && markerVisibility) {
                            hasActiveAnimation = true;
                            const newRadius: number = marker.currentRadius + (difference * animationSpeed);

                            return {
                                ...marker,
                                currentRadius: newRadius
                            };
                        } else {
                            // Animation complete
                            if (marker.animationState === 'appearing') {
                                return {
                                    ...marker,
                                    currentRadius: marker.targetRadius,
                                    animationState: 'visible' as const
                                };
                            } else {
                                return {
                                    ...marker,
                                    currentRadius: 0,
                                    visible: false,
                                    animationState: 'visible' as const
                                };
                            }
                        }
                    }
                    return marker;
                });

                if (hasActiveAnimation) {
                    animationFrameRef.current = requestAnimationFrame(animateMarkers);
                }

                return updatedMarkers;
            });
        };
        const startMarkerAnimation: (seriesIndex: number, appearing: boolean) => void = (seriesIndex: number, appearing: boolean) => {
            setTrackballMarkers((currentMarkers: TrackballMarker[]) =>
                currentMarkers.map((marker: TrackballMarker) => {
                    if (marker.seriesIndex === seriesIndex) {
                        const chart: Chart = layoutRef.current.chart as Chart;
                        const series: SeriesProperties = chart?.visibleSeries[marker.seriesIndex];
                        const isBubbleSeries: boolean = series?.type === 'Bubble';
                        const targetRadius: number = appearing ? (marker.size.width + marker.size.height) / 4 : 0;
                        return {
                            ...marker,
                            animationState: appearing ? 'appearing' : 'disappearing',
                            targetRadius,
                            currentRadius: appearing ? (isBubbleSeries ? marker.currentRadius : 0) : marker.currentRadius
                        };
                    }
                    return marker;
                })
            );

            // Start animation loop
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }

            animationFrameRef.current = requestAnimationFrame(animateMarkers);

        };

        useEffect(() => {
            return () => {
                if (animationFrameRef.current) {
                    cancelAnimationFrame(animationFrameRef.current);
                }
                if (markerTimeoutRef.current) {
                    clearTimeout(markerTimeoutRef.current);
                }
                if (touchTimeoutRef.current) {
                    clearTimeout(touchTimeoutRef.current);
                }
            };
        }, []);
        /**
         * Finds the data point at the current cursor position.
         *
         * @param {Chart} chart - The chart object
         *
         * @returns {Object} Object containing the point and series at cursor position
         */
        function findPointAtCursor(chart: Chart): { point: Points | null, series: SeriesProperties | null } {
            for (let i: number = chart.visibleSeries.length - 1; i >= 0; i--) {
                const series: SeriesProperties = chart.visibleSeries[i as number];
                if (series.visible && series.clipRect &&
                    withInBounds(chart.mouseX, chart.mouseY, series.clipRect)) {
                    // For showNearestTooltip and shared tooltip, check points regardless of marker visibility
                    const shouldCheckPoints: boolean = props.shared || props.showNearestTooltip ||
                        (series.marker?.visible !== false);
                    if (!shouldCheckPoints) { continue; }
                    const point: Points | null = findPointInSeries(series, chart.mouseX, chart.mouseY);
                    if (point) {
                        return { point, series };
                    }
                }
            }
            return { point: null, series: null };
        }

        /**
         * Gets the common X values across all visible series
         *
         * @param {SeriesProperties[]} visibleSeries - Array of visible series
         * @returns {number[]} Array of common X values
         */
        function getCommonXValues(visibleSeries: SeriesProperties[]): number[] {
            const commonXValues: number[] = [];
            for (let j: number = 0; j < visibleSeries.length; j++) {
                const series: SeriesProperties = visibleSeries[j as number];
                if (!series.points) { continue; }
                for (let i: number = 0; i < series.points.length; i++) {
                    const point: Points = series.points[i as number];
                    if (point && (point.index === 0 || point.index === series.points.length - 1 ||
                        (point.symbolLocations && point.symbolLocations.length > 0))) {
                        void (point.xValue != null && commonXValues.push(point.xValue));
                    }
                }
            }
            return commonXValues;
        }

        /**
         * Finds the closest point in a series to the current mouse position
         *
         * @param {Chart} chart - The chart object
         * @param {SeriesProperties} series - The series to check
         * @param {number[]} [xvalues] - Optional array of X values
         * @returns {PointData | null} The closest point data or null
         */
        function getClosestPoint(chart: Chart, series: SeriesProperties, xvalues?: number[]):
        { point: Points, series: SeriesProperties } | null {

            const rect: Rect = series.clipRect!;
            let value: number = 0;

            // Determine value based on axis inversion and mouse position
            if (chart.mouseX <= rect.x + rect.width && chart.mouseX >= rect.x) {
                value = chart.requireInvertedAxis ?
                    getValueYByPoint(chart.mouseY - rect.y, rect.height, series.xAxis) :
                    getValueXByPoint(chart.mouseX - rect.x, rect.width, series.xAxis);
            }

            // Find closest X value
            const closest: number | null = getClosestXValue(series, value, xvalues);

            // Find the point with this X value
            const point: Points | undefined = closest !== null ?
                series.visiblePoints?.find((p: Points) => p.xValue === closest && p.visible) : undefined;

            // Return the point and series only if a point is found
            return point ? { point, series } : null;
        }

        /**
         * Finds the closest X value in a series to a target value
         *
         * @param {SeriesProperties} series - The series to search in
         * @param {number} value - The target value
         * @param {number[]} [xvalues] - Optional array of X values to use
         * @returns {number | null} The closest X value or null if not found
         */
        function getClosestXValue(series: SeriesProperties, value: number, xvalues?: number[]): number | null {
            let closest: number = 0;
            const xData: number[] = xvalues ? xvalues : series.xData;
            const xLength: number = xData.length;
            const leftSideNearest: number = 0.5;
            const rightSideNearest: number = 0.5;

            if (value >= series.xAxis.visibleRange.minimum - leftSideNearest &&
                value <= series.xAxis.visibleRange.maximum + rightSideNearest) {
                for (let i: number = 0; i < xLength; i++) {
                    const data: number = xData[i as number];
                    if (closest == null || Math.abs(data - value) < Math.abs(closest - value)) {
                        closest = data;
                    }
                }
            }

            const isDataExist: boolean = series.xData.indexOf(closest) !== -1;
            return isDataExist ? closest : null;
        }

        /**
         * Converts an X position to a value on the axis
         *
         * @param {number} value - The X position
         * @param {number} size - The width of the plotting area
         * @param {AxisModel} axis - The axis model
         * @returns {number} The converted value
         */
        function getValueXByPoint(value: number, size: number, axis: AxisModel): number {
            const actualValue: number = !axis.isAxisInverse ? value / size : (1 - (value / size));
            return actualValue * (axis.visibleRange.delta) + axis.visibleRange.minimum;
        }

        /**
         * Converts a Y position to a value on the axis
         *
         * @param {number} value - The Y position
         * @param {number} size - The height of the plotting area
         * @param {AxisModel} axis - The axis model
         * @returns {number} The converted value
         */
        function getValueYByPoint(value: number, size: number, axis: AxisModel): number {
            const actualValue: number = axis.isAxisInverse ? value / size : (1 - (value / size));
            return actualValue * (axis.visibleRange.delta) + axis.visibleRange.minimum;
        }

        /**
         * Finds a point in a series at the given mouse coordinates
         *
         * @param {SeriesProperties} series - The series to search in
         * @param {number} mouseX - Mouse X coordinate
         * @param {number} mouseY - Mouse Y coordinate
         * @returns {Points | null} The found point or null if not found
         */
        function findPointInSeries(series: SeriesProperties, mouseX: number, mouseY: number): Points | null {
            for (const point of series.visiblePoints as Points[]) {
                if (point.regions && checkRegionContainsPoint(point, series, mouseX, mouseY)) {
                    return point;
                }
            }
            return null;
        }
        /**
         * Checks if a given point contains the mouse position
         *
         * @param {Points} point - The point to check
         * @param {SeriesProperties} series - The series the point belongs to
         * @param {number} mouseX - Mouse X coordinate
         * @param {number} mouseY - Mouse Y coordinate
         * @returns {boolean} True if the point contains the mouse position
         */
        function checkRegionContainsPoint(point: Points, series: SeriesProperties, mouseX: number, mouseY: number): boolean {
            if (!point.regions || point.regions.length === 0) { return false; }
            for (const region of point.regions) {
                if (withInBounds(
                    mouseX, mouseY,
                    {
                        x: (series.clipRect?.x || 0) + region.x,
                        y: (series.clipRect?.y || 0) + region.y,
                        width: region.width,
                        height: region.height
                    }
                )) {
                    return true;
                }
            }
            return false;
        }
        /**
         * Finds the closest X value to the current mouse position
         *
         * @param {Chart} chart - The chart object
         * @returns {number | null} The closest X value or null if not found
         */
        function findClosestXValue(chart: Chart): number | null {
            if (!chart.visibleSeries || chart.visibleSeries.length === 0) { return null; }
            const mouseX: number = chart.mouseX;
            let closestDistance: number = Number.MAX_VALUE;
            let closestXValue: number | null = null;
            for (const series of chart.visibleSeries) {
                if (!series.visible || !series.clipRect || !series.points) { continue; }
                for (const point of series.points) {
                    if (!point.symbolLocations || !point.symbolLocations[0]) { continue; }
                    const distance: number = Math.abs((series.clipRect.x + point.symbolLocations[0].x) - mouseX);
                    if (distance < closestDistance) {
                        closestDistance = distance;
                        closestXValue = point.xValue;
                    }
                }
            }
            return closestXValue;
        }
        /**
         * Updates trackball visibility for single point tracking
         *
         * @returns {void}
         */
        function updateTrackballVisibility(): void {
            const chart: Chart = layoutRef.current.chart as Chart;
            let result: {
                point: Points | null;
                series: SeriesProperties | null;
            } = findPointAtCursor(chart);

            // Clear existing timeout
            if (markerTimeoutRef.current) {
                clearTimeout(markerTimeoutRef.current);
                markerTimeoutRef.current = null;
            }

            // If mouse is outside chart area, hide all markers
            if (!withInBounds(chart.mouseX, chart.mouseY, chart.chartAxislayout.seriesClipRect)) {
                hideAllMarkers();
                return;
            }

            // If no point found directly under cursor, check for nearest point if enabled
            if ((!result.point || !result.series) && props.showNearestTooltip) {
                let closestPointData: PointData | null = null;
                let smallestDistance: number = Infinity;

                const commonXValues: number[] = getCommonXValues(chart.visibleSeries);

                // Find nearest point in any visible series
                for (let i: number = chart.visibleSeries.length - 1; i >= 0; i--) {
                    const series: SeriesProperties = chart.visibleSeries[i as number];
                    // For showNearestTooltip, check all visible series regardless of marker visibility
                    if (!series.visible || !series.enableTooltip || series.isRectSeries || series.type === 'Scatter' || series.type === 'Bubble') { continue; }

                    const pointData: {
                        point: Points;
                        series: SeriesProperties;
                    } | null = getClosestPoint(chart, series, commonXValues);

                    if (pointData && series.clipRect && pointData.point.symbolLocations?.[0]) {
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
                    result = { point: closestPointData.point, series: closestPointData.series };
                }
            }

            // If still no point found, hide all markers
            if (!result.point || !result.series || !result.series.enableTooltip) {
                hideAllMarkers();
                return;
            }

            if (result.point.symbolLocations && result.point.symbolLocations[0] && result.series.clipRect) {
                const symbolX: number = result.series.clipRect.x + result.point.symbolLocations[0].x;
                const symbolY: number = result.series.clipRect.y + result.point.symbolLocations[0].y;
                if (!withInBounds(symbolX, symbolY, chart.chartAxislayout.seriesClipRect)) {
                    hideAllMarkers();
                    return;
                }
            }

            // Check if it's the same point as before
            const isSamePoint: boolean = previousPointRef.current?.seriesIndex === result.series.index &&
                previousPointRef.current?.pointIndex === result.point.index;
            if (isSamePoint) {
                return;
            }

            // Update current point for reference
            previousPointRef.current = {
                seriesIndex: result.series.index,
                pointIndex: result.point.index
            };

            // Update the position of the marker for this series
            setTrackballMarkers((currentMarkers: TrackballMarker[]) =>
                currentMarkers.map((marker: TrackballMarker) => {
                    if (marker.seriesIndex === result.series?.index) {
                        const point: Points = result.point!;
                        const location: ChartLocationProps | null = point.symbolLocations && point.symbolLocations[0];
                        if (!location) { return marker; }
                        const size: ChartSizeProps = { height: point.marker?.height as number, width: point.marker?.width as number };
                        const series: SeriesProperties = result.series!;
                        const border: ChartBorderProps = (point.marker.border || series.border) as ChartBorderProps;
                        const explodeSeries: boolean = (series.type === 'Bubble' || series.type === 'Scatter');
                        const borderColor: string = (border.color && border.color !== 'transparent') ? border.color :
                            point.marker.fill || point.interior || (explodeSeries ? point.color : series.interior);
                        const colorValue: ColorValue = convertHexToColor(colorNameToHex(borderColor));
                        const markerShadow: string = series.chart.themeStyle.markerShadow ||
                            'rgba(' + colorValue.r + ',' + colorValue.g + ',' + colorValue.b + ',0.2)';
                        const markerShape: ChartMarkerShape = series?.marker?.shape === 'None' ? 'None' : point.marker?.shape || marker.shape || 'Circle';
                        const markerRadius: number = series.type === 'Bubble' ? ((point.marker?.width as number + (point.marker?.height as number)) / 4) - 5 : // 5px padding for bubble animation.
                            ((series.marker?.width as number) + (series.marker?.height as number)) / 4;
                        const updatedMarker: TrackballMarker = {
                            ...marker,
                            size: (result.series.type === 'Bubble' ? size : marker.size),
                            shape: markerShape,
                            x: location.x + (result.series?.clipRect?.x || 0),
                            y: location.y + (result.series?.clipRect?.y || 0),
                            visible: true,
                            currentPointIndex: point.index || 0,
                            fill: (point.marker.fill || point.color || (explodeSeries ? series.interior : '#ffffff')),
                            stroke: borderColor,
                            markerShadow: markerShadow,
                            currentRadius: markerRadius,
                            animationState: 'appearing' as const
                        };

                        setTimeout(() => startMarkerAnimation(marker.seriesIndex, true), 0);

                        return updatedMarker;
                    }
                    if (marker.visible) {
                        setTimeout(() => startMarkerAnimation(marker.seriesIndex, false), 0);
                    }
                    return { ...marker, visible: false };
                })
            );

            // Set timeout for auto hiding only if not in touch mode
            if (!isTouchModeRef.current) {
                markerTimeoutRef.current = setTimeout(() => {
                    setTrackballMarkers((currentMarkers: TrackballMarker[]) =>
                        currentMarkers.map((marker: TrackballMarker) => ({ ...marker, visible: false }))
                    );
                }, 2000);
            }
        }

        /**
         * Updates trackball visibility for shared tooltip mode
         *
         * @returns {void}
         */
        function updateSharedTrackballVisibility(): void {
            const chart: Chart = layoutRef.current.chart as Chart;
            const xValue: number | null = findClosestXValue(chart);
            // Clear timeout if any
            if (markerTimeoutRef.current) {
                clearTimeout(markerTimeoutRef.current);
                markerTimeoutRef.current = null;
            }
            // If no X value found or mouse outside chart area, hide markers
            if (xValue === null || !withInBounds(chart.mouseX, chart.mouseY, chart.chartAxislayout.seriesClipRect)) {
                hideAllMarkers();
                return;
            }
            // Check if same X value as before
            if (commonXValueRef.current === xValue) {
                return;
            }
            commonXValueRef.current = xValue;
            // Update markers for each series
            setTrackballMarkers((currentMarkers: TrackballMarker[]) =>
                currentMarkers.map((marker: TrackballMarker) => {
                    const series: SeriesProperties = chart.visibleSeries[marker.seriesIndex];
                    if (!series || !series.points || !series.visible || !series.enableTooltip) {
                        return { ...marker, visible: false };
                    }
                    // Find the point in this series that matches the X value
                    const matchingPoint: Points | undefined = series.visiblePoints?.find((p: Points) => p.xValue === xValue);
                    if (matchingPoint && matchingPoint.symbolLocations && matchingPoint.symbolLocations[0]) {
                        const size: ChartSizeProps = {
                            height: matchingPoint.marker?.height as number,
                            width: matchingPoint.marker?.width as number
                        };
                        const border: ChartBorderProps = (matchingPoint.marker.border || series.border) as ChartBorderProps;
                        const explodeSeries: boolean = (series.type === 'Bubble' || series.type === 'Scatter');
                        const borderColor: string = (border.color && border.color !== 'transparent') ? border.color :
                            matchingPoint.marker.fill || matchingPoint.interior || (explodeSeries ? matchingPoint.color : series.interior);
                        const colorValue: ColorValue = convertHexToColor(colorNameToHex(borderColor));
                        const markerShadow: string = series.chart.themeStyle.markerShadow ||
                            'rgba(' + colorValue.r + ',' + colorValue.g + ',' + colorValue.b + ',0.2)';
                        const markerShape: ChartMarkerShape = series?.marker?.shape === 'None' ? 'None' : matchingPoint.marker?.shape || marker.shape || 'Circle';
                        const markerRadius: number = series.type === 'Bubble' ? (matchingPoint.marker?.width as number + (matchingPoint.marker?.height as number)) / 4 - 5 : // 5px padding for bubble animation.
                            ((series.marker?.width as number) + (series.marker?.height as number)) / 4;
                        const updatedMarker: TrackballMarker = {
                            ...marker,
                            x: matchingPoint.symbolLocations[0].x + (series.clipRect?.x as number),
                            y: matchingPoint.symbolLocations[0].y + (series.clipRect?.y as number),
                            size: (series.type === 'Bubble' ? size : marker.size),
                            shape: markerShape,
                            visible: true,
                            currentPointIndex: matchingPoint.index || 0,
                            // Update fill and other properties from the specific point if needed
                            fill: (matchingPoint.marker.fill || matchingPoint.color || (explodeSeries ? series.interior : '#ffffff')),
                            stroke: borderColor,
                            markerShadow: markerShadow,
                            currentRadius: markerRadius,
                            animationState: 'appearing' as const
                        };
                        setTimeout(() => startMarkerAnimation(marker.seriesIndex, true), 0);

                        return updatedMarker;
                    }
                    if (marker.visible) {
                        setTimeout(() => startMarkerAnimation(marker.seriesIndex, false), 0);
                    }
                    return { ...marker, visible: false };
                })
            );
            // Set timeout for auto hiding only if not in touch mode
            if (!isTouchModeRef.current) {
                markerTimeoutRef.current = setTimeout(() => {
                    setTrackballMarkers((currentMarkers: TrackballMarker[]) =>
                        currentMarkers.map((marker: TrackballMarker) => ({ ...marker, visible: false }))
                    );
                }, 2000);
            }
        }
        // Only render if in rendering phase and tooltip is enabled
        if (phase !== 'rendering' || !props.enable) {
            return null;
        }

        /**
         * Renders an animated trackball marker as a JSX element.
         *
         * @param {TrackballMarker} marker - The `TrackballMarker` object containing visibility and animation state.
         * @returns {JSX.Element} A JSX element representing the marker if it is visible or animating; otherwise, `null`.
         */
        function renderAnimatedMarker(marker: TrackballMarker): JSX.Element | null {
            if (!marker.visible && marker.currentRadius <= 0) {
                return null;
            }

            const radius: number = marker.currentRadius;
            const targetRadius: number = (marker.size.width + marker.size.height) / 4;
            const opacity: number = marker.visible ?
                Math.min(1, radius / ((marker.size.width + marker.size.height) / 4)) :
                Math.max(0, radius / ((marker.size.width + marker.size.height) / 4));
            const chart: Chart = layoutRef.current.chart as Chart;
            const series: SeriesProperties = chart?.visibleSeries[marker.seriesIndex];
            const isBubbleSeries: boolean = series?.type === 'Bubble';
            if (marker.shape === 'Circle' || !marker.shape) {
                return (
                    <g
                        key={`trackball-${marker.seriesIndex}`}
                        style={{ display: marker.visible ? 'block' : 'none' }}
                    >
                        <circle
                            cx={marker.x}
                            cy={marker.y}
                            r={radius + 4}
                            fill="transparent"
                            stroke={marker.markerShadow}
                            strokeWidth={marker.border.width + 4}
                            opacity={opacity}
                            className={`trackball-shadow-${marker.seriesIndex}`}
                        />

                        <circle
                            cx={marker.x}
                            cy={marker.y}
                            r={radius}
                            fill={isBubbleSeries ? 'transparent' : marker.fill}
                            stroke={marker.stroke}
                            strokeWidth={marker.border.width}
                            opacity={opacity}
                            className={`trackball-marker-${marker.seriesIndex}`}
                        />
                    </g>
                );
            } else {
                const location: { x: number, y: number } = { x: marker.x, y: marker.y };
                const sizeRatio: number = radius / targetRadius;
                const animatedWidth: number = marker.size.width * sizeRatio;
                const animatedHeight: number = marker.size.height * sizeRatio;
                // Create shape with animated size
                const shapeOption: {
                    id: string;
                    fill: string;
                    strokeWidth: number;
                    stroke: string;
                    opacity: number;
                    strokeDasharray: string;
                    d: string;
                } = {
                    id: `trackball-marker-${marker.seriesIndex}`,
                    fill: marker.fill,
                    strokeWidth: marker.border.width,
                    stroke: marker.stroke,
                    opacity: 1,
                    strokeDasharray: '',
                    d: ''
                };

                const markerOptions: Object | null = drawSymbol(
                    location,
                    marker.shape,
                    { width: animatedWidth, height: animatedHeight },
                    marker.imageUrl || '',
                    shapeOption
                );

                // Create shadow with slightly larger animated size
                const shadowShapeOption: {
                    id: string;
                    fill: string;
                    strokeWidth: number;
                    stroke: string;
                    opacity: number;
                    strokeDasharray: string;
                    d: string;
                } = {
                    id: `trackball-shadow-${marker.seriesIndex}`,
                    fill: 'transparent',
                    strokeWidth: marker.border.width + 6,
                    stroke: marker.markerShadow,
                    opacity: 1,
                    strokeDasharray: '',
                    d: ''
                };

                const shadowOptions: Object | null = drawSymbol(
                    location,
                    marker.shape,
                    {
                        width: animatedWidth + 6,
                        height: animatedHeight + 6
                    },
                    marker.imageUrl || '',
                    shadowShapeOption
                );
                const shadowPath: {
                    d: string;
                    fill: string;
                } = shadowOptions as {
                    d: string;
                    fill: string;
                };
                const options: PathOptions = markerOptions as PathOptions;
                return (
                    <g
                        key={`trackball-${marker.seriesIndex}`}
                        style={{ display: marker.visible ? 'block' : 'none' }}
                    >
                        <path
                            d={shadowPath.d}
                            fill="transparent"
                            stroke={marker.markerShadow}
                            strokeWidth={marker.border.width + 6}
                            opacity={opacity}
                            className={`trackball-shadow-${marker.seriesIndex}`}
                        />

                        {/* Main marker with animated size */}
                        <path
                            d={options.d}
                            fill={marker.fill}
                            stroke={marker.stroke}
                            strokeWidth={marker.border.width}
                            opacity={opacity}
                            className={`trackball-marker-${marker.seriesIndex}`}
                        />
                    </g>
                );
            }
        }
        return (
            <g id="trackballGroup" ref={ref}>
                {trackballMarkers.map((marker: TrackballMarker) => renderAnimatedMarker(marker))}
            </g>
        );
    });
export default TrackballRenderer;
