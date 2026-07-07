import { JSX, useEffect, useState } from 'react';
import { AxisModel, Chart, ChartAxisLayout, Rect } from '../../chart-area/chart-interfaces';
import { redrawOnZooming } from './zooming';
import { minMax } from '../../utils/helper';
import { useLayout } from '../../layout/LayoutContext';
import { Orientation, ScrollbarPosition } from '../../base/enum';
import { useRegisterAxisRender, useRegisterSeriesRender } from '../../hooks/useClipRect';
import { ChartScrollbarProps } from '../../base/interfaces';

/**
 * The minimum allowable size of the scrollbar thumb.
 *
 * Ensures that the thumb remains usable and visible even at high zoom levels.
 *
 * @private
 */
const MIN_THUMB_SIZE: number = 20;

/**
 * The gap, in pixels, between the axis line and its associated scrollbar.
 *
 * Applied when positioning axis-bound scrollbars to maintain visual separation.
 *
 * @private
 */
export const SCROLLBAR_GAP: number = 8;

/**
 * Represents the active drag mode for a scrollbar interaction.
 *
 * - 'thumb'        : Dragging the scrollbar thumb for panning
 * - 'resize-start': Resizing from the start edge of the scrollbar range
 * - 'resize-end'  : Resizing from the end edge of the scrollbar range
 * - null           : No active drag operation
 *
 * @private
 */
type ScrollbarDragMode = 'thumb' | 'resize-start' | 'resize-end' | null;

/**
 * Callback invoked to request a scrollbar re-render.
 *
 * Registered via {@link registerScrollbarRender} and triggered when scrollbar
 * state changes require a React re-render.
 *
 * @private
 */
const scrollbarRenderCallbacks: Map<string, () => void> = new Map<string, () => void>();

/**
 * Represents the complete state of an active scrollbar drag operation.
 *
 * Stores all information required to compute zoom and thumb position updates
 * during dragging, including axis and chart context, drag mode, initial pointer
 * position, and scrollbar geometry.
 *
 * @private
 */
interface ScrollbarDragState {
    /**
     * The axis associated with the active scrollbar interaction.
     */
    axis: AxisModel;

    /**
     * The chart instance containing the axis being interacted with.
     */
    chart: Chart;

    /**
     * The current drag mode indicating the type of scrollbar interaction.
     */
    mode: ScrollbarDragMode;

    /**
     * The pointer coordinate (X or Y) at the start of the drag operation.
     */
    startPointerPixel: number;

    /**
     * The axis zoom position at the start of the drag operation.
     */
    startZoomPosition: number;

    /**
     * The total length of the scrollbar track.
     */
    trackLength: number;

    /**
     * The length of the scrollbar thumb during the drag operation.
     */
    thumbLength: number;

    /**
     * The thumb offset position when the drag operation began.
     */
    startThumbOffset: number;
}

/**
 * Maintains active scrollbar drag state indexed by chart identifier.
 *
 * Enables independent drag handling for multiple charts by isolating
 * drag interaction state per chart instance.
 *
 * @private
 */
const dragStateByChart: Map<string, ScrollbarDragState> = new Map();

/**
 * React renderer component responsible for drawing and managing all chart scrollbars.
 *
 * Handles both axis-specific scrollbars (placed next to individual axis lines)
 * and global scrollbars (Top, Bottom, Left, Right). The component registers a
 * re-render callback to support external scrollbar updates and responds only
 * during the chart's rendering phase.
 *
 * Manages thumb-drag lifecycle events, including pointer capture, zoom position
 * updates, and redraw coordination while maintaining proper chart interaction
 * state.
 *
 * @returns {JSX.Element | null} - The rendered scrollbars group element, or null
 * if rendering is not in progress
 * @private
 */
export const ChartScrollbarsRenderer: React.FC<ChartScrollbarProps> = (): JSX.Element | null => {
    const { layoutRef, phase } = useLayout();
    const [, triggerRerender] = useState(0);
    const triggerAxisRender: (chartId?: string | undefined) => void = useRegisterAxisRender();
    const triggerSeriesRender: (chartId?: string | undefined) => void = useRegisterSeriesRender();
    useEffect(() => {
        const chartId: string = (layoutRef.current.chart as Chart).element.id;
        const unregister: () => void = registerScrollbarRender(chartId, () =>
            triggerRerender((prev: number) => prev + 1)
        );
        return () => {
            unregister();
        };
    }, []);
    if (phase !== 'rendering') { return null; }

    const chart: Chart = layoutRef.current.chart as Chart;
    if (chart.zoomSettings?.enableScrollbar !== true) { return null; }
    const globalScrollbars: ('Top' | 'Bottom' | 'Left' | 'Right')[] = [];
    const axisScrollbars: AxisModel[] = [];

    chart.axisCollection.forEach((axis: AxisModel) => {
        const scrollbarPosition: ScrollbarPosition = axis.scrollbarSettings?.position as ScrollbarPosition;
        if (scrollbarPosition === 'Top' || scrollbarPosition === 'Bottom' || scrollbarPosition === 'Left' || scrollbarPosition === 'Right') {
            // Global scrollbars - only add first instance of each position
            globalScrollbars.push(scrollbarPosition);
        } else {
            axisScrollbars.push(axis);
        }
    });

    const handleThumbDragStart: (e: React.PointerEvent<SVGGraphicsElement>, axis: AxisModel, chart: Chart,
        trackLength: number, thumbLength: number, orientation: 'Horizontal' | 'Vertical') => void = (
        e: React.PointerEvent<SVGGraphicsElement>, axis: AxisModel, chart: Chart, trackLength: number,
        thumbLength: number, orientation: 'Horizontal' | 'Vertical'
    ): void => {
        e.preventDefault();
        e.stopPropagation();
        chart.isScrollbarThumbDrag = true;
        chart.isGestureZooming = true;
        chart.zoomRedraw = true;

        const target: SVGElement = e.target as SVGElement;
        const handleType: string = (target.getAttribute('data-handle') as string) ?? '';

        const mode: ScrollbarDragMode = (handleType === 'resize-start' || handleType === 'resize-end')
            ? handleType as ScrollbarDragMode : 'thumb';

        const pointerEvent: PointerEvent = e.nativeEvent;
        const targetElement: SVGGraphicsElement = e.currentTarget;

        targetElement.setPointerCapture(pointerEvent.pointerId);

        chart.isChartDrag = true;
        chart.startPanning = true;
        chart.disableTrackTooltip = true;
        chart.delayRedraw = false;

        const chartId: string = chart.element.id;
        dragStateByChart.set(chartId, {
            axis, chart, mode: mode, startPointerPixel: orientation === 'Horizontal' ? pointerEvent.clientX : pointerEvent.clientY,
            startZoomPosition: axis.zoomPosition as number, trackLength, thumbLength,
            startThumbOffset: calculateThumbOffset(trackLength, thumbLength, axis, chart.enableRtl)
        });

        (chart.element).addEventListener('pointermove', handleThumbDragMove);
        (chart.element).addEventListener('pointerup', handleThumbDragEnd, { once: true });
    };

    const handleThumbDragMove: (e: PointerEvent) => void = (e: PointerEvent): void => {
        e.preventDefault();

        const target: HTMLElement = e.currentTarget as HTMLElement;
        const chartId: string = target.id;

        const state: ScrollbarDragState = dragStateByChart.get(chartId) as ScrollbarDragState;
        if (!state) { return; }

        const { axis, chart, mode, startPointerPixel, startZoomPosition,
            trackLength, thumbLength: startThumbLength, startThumbOffset } = state;

        const axisOrientation: Orientation = axis.orientation as Orientation;
        const currentPixel: number = axisOrientation === 'Horizontal' ? e.clientX : e.clientY;
        const delta: number = currentPixel - startPointerPixel;

        // ---------- CASE 1: Thumb PAN (existing behavior) ----------
        if (mode === 'thumb') {
            const movableSpace: number = trackLength - startThumbLength;

            const zoomFactor: number = axis.zoomFactor as number;
            const maxZoomPosition: number = 1 - zoomFactor;
            if (maxZoomPosition <= 0) {
                return;
            }

            let normalizedStartPosition: number = (startZoomPosition as number) / maxZoomPosition;

            if (axis.isAxisInverse) {
                normalizedStartPosition = 1 - normalizedStartPosition;
            }
            if (chart.enableRtl && axisOrientation === 'Horizontal') {
                normalizedStartPosition = 1 - normalizedStartPosition;
            }

            let newVisualPosition: number = normalizedStartPosition + (delta / movableSpace);
            newVisualPosition = clampToUnitRange(newVisualPosition);

            let newlyNormalizedPosition: number = newVisualPosition;
            if (chart.enableRtl && axisOrientation === 'Horizontal') {
                newlyNormalizedPosition = 1 - newlyNormalizedPosition;
            }
            if (axis.isAxisInverse) {
                newlyNormalizedPosition = 1 - newlyNormalizedPosition;
            }

            axis.zoomPosition = minMax(newlyNormalizedPosition * maxZoomPosition, 0, maxZoomPosition);

            triggerScrollbarRender(chart.element.id);

            const plot: Rect = chart.chartAxislayout?.seriesClipRect;
            const plotLength: number = axisOrientation === 'Horizontal' ? plot?.width : plot?.height;

            if (zoomFactor > 0 && plotLength > 0) {
                const chartId: string = chart.element.id;
                chart.isGestureZooming = true;
                chart.zoomRedraw = true;
                chart.isScrollbarThumbDrag = true;
                triggerAxisRender(chartId);
                triggerSeriesRender(chartId);
                chart.isChartDrag = true;
                chart.startPanning = true;
                chart.disableTrackTooltip = true;
            }
            return;
        }

        // ---------- CASE 2: RESIZE ----------
        let newThumbOffset: number = startThumbOffset;
        let newThumbLength: number = startThumbLength;

        if (mode === 'resize-start') {
            newThumbOffset = startThumbOffset + delta;
            newThumbLength = startThumbLength - delta;
        } else {
            newThumbLength = startThumbLength + delta;
        }

        if (newThumbLength < MIN_THUMB_SIZE) { return; }
        const newZoomFactor: number = newThumbLength / trackLength;
        const resizeMovable: number = trackLength - newThumbLength;
        const visualPosition: number = resizeMovable > 0 ? newThumbOffset / resizeMovable : 0;

        let normalizedPosition: number = visualPosition;
        if (chart.enableRtl && axisOrientation === 'Horizontal') {
            normalizedPosition = 1 - normalizedPosition;
        }
        if (axis.isAxisInverse) {
            normalizedPosition = 1 - normalizedPosition;
        }

        axis.zoomFactor = newZoomFactor;
        axis.zoomPosition = minMax(normalizedPosition * (1 - newZoomFactor), 0, 1 - newZoomFactor);

        triggerScrollbarRender(chart.element.id);

        chart.isGestureZooming = true;
        chart.zoomRedraw = true;
        chart.isScrollbarThumbDrag = true;
        triggerAxisRender(chartId);
        triggerSeriesRender(chartId);

        redrawOnZooming(chart, false, false);
    };

    const handleThumbDragEnd: () => void = (): void => {
        let state: ScrollbarDragState | undefined;
        dragStateByChart.forEach((currentState: ScrollbarDragState) => { state = currentState; });
        if (!state) { return; }
        const chart: Chart = state.chart;
        const chartId: string = state.chart.element.id;
        chart.isChartDrag = false;
        chart.startPanning = false;
        chart.disableTrackTooltip = false;
        chart.isScrollbarThumbDrag = false;
        chart.pendingGestureEnd = true;
        dragStateByChart.delete(chartId);
        chart.element.removeEventListener('pointermove', handleThumbDragMove);
        chart.isScrollbarThumbDrag = false;
    };

    return (
        <g key={chart.element.id} id={`${chart.element.id}_Scrollbars`}>
            {/* Render axis-specific scrollbars (PlaceNextToAxisLine) */}
            {axisScrollbars.map((axis: AxisModel) => {
                if (axis.orientation === 'Horizontal') {
                    return drawHorizontalScrollbar(
                        axis, chart, axis.updatedRect, handleThumbDragStart
                    );
                }
                return drawVerticalScrollbar(axis, chart, axis.updatedRect, handleThumbDragStart);
            })}

            {/* Render global scrollbars (Top, Bottom, Left, Right) */}
            {globalScrollbars.map((position: 'Top' | 'Bottom' | 'Left' | 'Right') => {
                const scrollbarRect: Rect = calculateGlobalScrollbarRect(chart, position);
                const axis: AxisModel = chart.axisCollection.find((currentAxis: AxisModel) =>
                    currentAxis.scrollbarSettings?.position === position) as AxisModel;

                if (!axis || !shouldAllocateScrollbarSpace(chart, axis)) { return null; }

                // Determine orientation based on position
                if (position === 'Top' || position === 'Bottom') {
                    return drawHorizontalScrollbar(axis, chart, scrollbarRect, handleThumbDragStart);
                }
                return drawVerticalScrollbar(axis, chart, scrollbarRect, handleThumbDragStart);
            })}
        </g>
    );
};

/**
 * Registers a callback to be invoked when the scrollbar needs to be re-rendered.
 *
 * Stores the provided callback and returns a cleanup function that unregisters
 * the callback when invoked.
 *
 * @param {string} chartId - Id of current chart.
 * @param {Function} callbackFunction - The callback function to execute during scrollbar rendering
 * @returns {Function} - A function that unregisters the scrollbar render callback
 * @private
 */
export function registerScrollbarRender(chartId: string, callbackFunction: () => void): () => void {
    scrollbarRenderCallbacks.set(chartId, callbackFunction);
    return () => { scrollbarRenderCallbacks.delete(chartId); };
}

/**
 * Triggers the registered scrollbar render callback, if available.
 *
 * Invokes the callback registered via {@link registerScrollbarRender} to
 * request a scrollbar re-render.
 *
 * @param {string} chartId - Id of current chart.
 * @returns {void}
 * @private
 */
export function triggerScrollbarRender(chartId: string): void {
    scrollbarRenderCallbacks.get(chartId)?.();
}

/**
 * Clamps the given numeric value between 0 and 1.
 * If the value is not a finite number, returns 0.
 *
 * @param {number} value - The value to be clamped
 * @returns {number} - The clamped value between 0 and 1
 * @private
 */
function clampToUnitRange(value: number): number { return isFinite(value) ? Math.max(0, Math.min(1, value)) : 0; }

/**
 * Calculates the length of the scrollbar thumb based on the track length and zoom factor.
 *
 * Ensures that the thumb length does not fall below the minimum allowed size.
 *
 * @param {number} trackLength - The total length of the scrollbar track
 * @param {number} zoomFactor - The current zoom factor applied to the chart
 * @returns {number} - The calculated thumb length
 * @private
 */
function getThumbLength(trackLength: number, zoomFactor: number): number {
    return Math.max(trackLength * zoomFactor, MIN_THUMB_SIZE);
}

/**
 * Calculates the offset position of the scrollbar thumb within the track.
 *
 * The offset is determined based on the axis zoom position, axis inversion,
 * RTL settings, and the available movable space in the track.
 *
 * @param {number} trackLength - The total length of the scrollbar track
 * @param {number} thumbLength - The length of the scrollbar thumb
 * @param {AxisModel} axis - The axis configuration containing zoom and orientation details
 * @param {boolean} enableRtl - Whether right-to-left layout is enabled
 * @returns {number} - The calculated thumb offset position
 * @private
 */
function calculateThumbOffset(trackLength: number, thumbLength: number, axis: AxisModel, enableRtl: boolean): number {

    const zoomFactor: number = axis.zoomFactor as number;
    const maxZoomPosition: number = 1 - zoomFactor;
    if (maxZoomPosition <= 0) { return 0; }

    // Normalize zoomPosition from data-space → thumb-space
    let position: number = (axis.zoomPosition as number) / maxZoomPosition;
    if (axis.isAxisInverse) { position = 1 - position; }
    if (enableRtl && axis.orientation === 'Horizontal') { position = 1 - position; }
    const movable: number = trackLength - thumbLength;
    if (movable <= 0) { return 0; }
    return movable * clampToUnitRange(position);
}

/**
 * Handles pointer click events on the scrollbar track.
 *
 * Determines whether the click occurred before or after the thumb and
 * updates the axis zoom position accordingly. Applies axis inversion
 * and RTL adjustments, triggers a zoom redraw, and manages chart
 * interaction states during the operation.
 *
 * @param {PointerEvent<SVGRectElement>} pointerEvent - The pointer event triggered on the track
 * @param {AxisModel} axis - The axis associated with the scrollbar track
 * @param {Chart} chart - The chart instance containing the axis
 * @param {number} thumbOffset - The current offset position of the scrollbar thumb
 * @param {'Horizontal' | 'Vertical'} orientation - The orientation of the scrollbar
 * @returns {void}
 * @private
 */
function handleTrackClick(pointerEvent: React.PointerEvent<SVGRectElement>, axis: AxisModel, chart: Chart,
                          thumbOffset: number, orientation: 'Horizontal' | 'Vertical'): void {
    const target: SVGElement = pointerEvent.target as SVGElement;
    if (target.getAttribute('data-is-thumb') === 'true') { return; }

    pointerEvent.preventDefault();
    pointerEvent.stopPropagation();

    const rect: DOMRect = (pointerEvent.currentTarget as SVGRectElement).getBoundingClientRect();
    const clickPosition: number = orientation === 'Horizontal' ? pointerEvent.clientX - rect.left : pointerEvent.clientY - rect.top;

    const clickedBeforeThumb: boolean = clickPosition < thumbOffset;
    const zoomFactor: number = axis.zoomFactor as number;
    const currentPosition: number = axis.zoomPosition as number;

    let shouldDecrease: boolean = clickedBeforeThumb;
    if (axis.isAxisInverse) { shouldDecrease = !shouldDecrease; }
    if (chart.enableRtl && axis.orientation === 'Horizontal') { shouldDecrease = !shouldDecrease; }
    let newPosition: number = shouldDecrease ? currentPosition - zoomFactor : currentPosition + zoomFactor;

    newPosition = minMax(newPosition, 0, 1 - zoomFactor);
    axis.zoomPosition = newPosition;
    chart.isChartDrag = true;
    chart.startPanning = true;
    chart.disableTrackTooltip = true;
    redrawOnZooming(chart, true, true);
    chart.isChartDrag = false;
    chart.startPanning = false;
}

/**
 * Renders a vertical scrollbar for the given axis when zooming is enabled.
 *
 * Supports both axis-bound and global scrollbars. Calculates the scrollbar
 * track size, thumb size, and thumb offset based on the zoom state, axis
 * configuration, and layout direction. Handles pointer interactions for
 * track clicks and thumb dragging.
 *
 * @param {AxisModel} axis - The axis configuration for which the vertical scrollbar is rendered
 * @param {Chart} chart - The chart instance containing zoom and scrollbar settings
 * @param {Rect} rect - The rectangle defining the scrollbar region (used for global scrollbars)
 * @param {Function} [startThumbDrag] - Optional handler to initiate thumb dragging
 * @returns {JSX.Element | null} - The rendered vertical scrollbar element, or null if not required
 * @private
 */
export function drawVerticalScrollbar(axis: AxisModel, chart: Chart, rect: Rect,
                                      startThumbDrag?: (e: React.PointerEvent<SVGGraphicsElement>,
                                          axis: AxisModel, chart: Chart, trackLength: number,
                                          thumbLength: number, orientation: 'Horizontal' | 'Vertical'
                                      ) => void
): JSX.Element | null {
    const zoomFactor: number = axis.zoomFactor as number;
    const zoomPosition: number = axis.zoomPosition as number;

    const isAxisZoomed: boolean = zoomFactor < 1 || (zoomFactor === 1 && zoomPosition !== 0);


    if (!chart.zoomSettings?.enableScrollbar || axis.scrollbarSettings?.enable === false ||
        (axis.scrollbarThickness as number) <= 0 || !isAxisZoomed) { return null; }

    const scrollbarThickness: number = axis.scrollbarThickness as number;

    // Use provided rect if available (for global scrollbars), otherwise use axis rect
    const scrollbarRect: Rect = rect && rect.width > 0 && rect.height > 0 ? rect : axis.updatedRect;

    const trackHeight: number = scrollbarRect.height;
    const thumbHeight: number = getThumbLength(trackHeight, axis.zoomFactor as number);
    const thumbOffset: number = calculateThumbOffset(trackHeight, thumbHeight, axis, chart.enableRtl);

    // Determine if this is a global scrollbar (by checking position)
    const isGlobalScrollbar: boolean = axis.scrollbarSettings?.position === 'Left' ||
        axis.scrollbarSettings?.position === 'Right';

    // Adjust X position based on scrollbar type
    let scrollbarX: number;
    if (isGlobalScrollbar) {
        scrollbarX = scrollbarRect.x;
    } else {
        const lineWidth: number = (axis.lineStyle?.width as number);
        scrollbarX = axis.isAxisOpposedPosition
            ? scrollbarRect.x - scrollbarRect.width - SCROLLBAR_GAP
            : scrollbarRect.x + lineWidth * 0.5;
    }
    const isAxisNextToLineRtlOpposedY: boolean = axis.orientation === 'Vertical' && axis.isAxisOpposedPosition === true &&
        axis.scrollbarSettings?.position === 'PlaceNextToAxisLine';
    const trackX: number = isAxisNextToLineRtlOpposedY ? -scrollbarThickness : 0;
    const thumbX: number = isAxisNextToLineRtlOpposedY ? (-scrollbarThickness + 1) : 1;

    const topArrowPath: string = `M ${scrollbarThickness / 2} ${thumbOffset - scrollbarThickness * 0.32}
        L ${scrollbarThickness / 2 - scrollbarThickness * 0.25} ${thumbOffset + scrollbarThickness * 0.08}
        L ${scrollbarThickness / 2 + scrollbarThickness * 0.25} ${thumbOffset + scrollbarThickness * 0.08} 
        Z`;
    const bottomArrowPath: string = `M ${scrollbarThickness / 2} ${thumbOffset + thumbHeight + scrollbarThickness * 0.32}
        L ${scrollbarThickness / 2 - scrollbarThickness * 0.25} ${thumbOffset + thumbHeight - scrollbarThickness * 0.08}
        L ${scrollbarThickness / 2 + scrollbarThickness * 0.25} ${thumbOffset + thumbHeight - scrollbarThickness * 0.08}
        Z`;

    return (
        <g id={`${chart.element.id}_${axis.name}_Scrollbar`}
            key={`${chart.element.id}_${axis.name}`}
            transform={`translate(${scrollbarX}, ${scrollbarRect.y})`}>
            {/* Track */}
            <rect
                x={trackX}
                y={0}
                width={scrollbarThickness}
                height={trackHeight}
                rx={axis.scrollbarSettings?.trackRadius ?? scrollbarThickness / 2}
                fill={axis.scrollbarSettings?.trackColor ?? chart.themeStyle.scrollbarTrackColor}
                opacity={0.9}
                style={{ pointerEvents: 'all' }}
                onPointerDown={(e: React.PointerEvent<SVGRectElement>) =>
                    handleTrackClick(e, axis, chart, thumbOffset, 'Vertical')
                }
            />
            {/* Thumb */}
            <rect
                key={`${axis.name}_thumb`}
                data-is-thumb="true"
                x={thumbX}
                y={thumbOffset}
                width={scrollbarThickness - 2}
                height={thumbHeight}
                rx={axis.scrollbarSettings?.thumbRadius ?? (scrollbarThickness - 2) / 2}
                fill={axis.scrollbarSettings?.thumbColor ?? chart.themeStyle.scrollbarThumbColor}
                cursor="grab"
                style={{ pointerEvents: 'all' }}
                onPointerDown={(e: React.PointerEvent<SVGGraphicsElement>) =>
                    startThumbDrag?.(e, axis, chart, trackHeight, thumbHeight, 'Vertical')
                }
            />
            {axis.scrollbarSettings?.enableZoom && (
                <>
                    {/* Top */}
                    <circle
                        cx={scrollbarThickness / 2}
                        cy={thumbOffset}
                        r={scrollbarThickness / 2}
                        fill={axis.scrollbarSettings.resizeCircle?.circleColor ?? chart.themeStyle.resizeCircleColor}
                        stroke={axis.scrollbarSettings.resizeCircle?.borderColor ?? chart.themeStyle.resizeCircleBorderColor}
                        strokeWidth={axis.scrollbarSettings.resizeCircle?.borderWidth ?? 1}
                        data-handle="resize-start"
                        style={{ cursor: 'ns-resize' }}
                        onPointerDown={(e: React.PointerEvent<SVGGraphicsElement>) =>
                            startThumbDrag?.(e, axis, chart, trackHeight, thumbHeight, 'Vertical')
                        }
                    />

                    <path
                        d={topArrowPath}
                        fill={axis.scrollbarSettings.resizeCircle?.arrowColor ?? chart.themeStyle.resizeCircleArrowColor}
                        pointerEvents="none"
                    />

                    {/* Bottom */}
                    <circle
                        cx={scrollbarThickness / 2}
                        cy={thumbOffset + thumbHeight}
                        r={scrollbarThickness / 2}
                        fill={axis.scrollbarSettings.resizeCircle?.circleColor ?? chart.themeStyle.resizeCircleColor}
                        stroke={axis.scrollbarSettings.resizeCircle?.borderColor ?? chart.themeStyle.resizeCircleBorderColor}
                        strokeWidth={axis.scrollbarSettings.resizeCircle?.borderWidth ?? 1}
                        data-handle="resize-end"
                        style={{ cursor: 'ns-resize' }}
                        onPointerDown={(e: React.PointerEvent<SVGGraphicsElement>) =>
                            startThumbDrag?.(e, axis, chart, trackHeight, thumbHeight, 'Vertical')
                        }
                    />

                    <path
                        d={bottomArrowPath}
                        fill={axis.scrollbarSettings.resizeCircle?.arrowColor ?? chart.themeStyle.resizeCircleArrowColor}
                        pointerEvents="none"
                    />

                </>
            )}
        </g>
    );
}

/**
 * Renders a horizontal scrollbar for the given axis when zooming is enabled.
 *
 * Supports both axis-bound and global horizontal scrollbars. Calculates
 * scrollbar track and thumb dimensions based on the zoom state and axis
 * configuration, determines the appropriate vertical placement, and renders
 * the scrollbar with interaction handlers for track clicks and thumb dragging.
 *
 * @param {AxisModel} axis - The axis configuration for which the horizontal scrollbar is rendered
 * @param {Chart} chart - The chart instance containing zoom and scrollbar settings
 * @param {Rect} rect - The rectangle defining the scrollbar region (used for global scrollbars)
 * @param {Function} [startThumbDrag] - Optional handler to initiate thumb dragging
 * @returns {JSX.Element | null} - The rendered horizontal scrollbar element, or null if not required
 * @private
 */
export function drawHorizontalScrollbar(axis: AxisModel, chart: Chart, rect: Rect,
                                        startThumbDrag?: (e: React.PointerEvent<SVGGraphicsElement>,
                                            axis: AxisModel, chart: Chart, trackLength: number,
                                            thumbLength: number, orientation: 'Horizontal' | 'Vertical'
                                        ) => void
): JSX.Element | null {
    const zoomFactor: number = axis.zoomFactor as number;
    const zoomPosition: number = axis.zoomPosition as number;

    const isAxisZoomed: boolean = zoomFactor < 1 || (zoomFactor === 1 && zoomPosition !== 0);

    if (!chart.zoomSettings?.enableScrollbar || axis.scrollbarSettings?.enable === false ||
        (axis.scrollbarThickness as number) <= 0 || !isAxisZoomed) { return null; }

    const thickness: number = axis.scrollbarThickness as number;

    // Use provided rect if available (for global scrollbars), otherwise use axis rect
    const scrollbarRect: Rect = rect && rect.width > 0 && rect.height > 0 ? rect : axis.updatedRect;

    const trackWidth: number = scrollbarRect.width;
    const thumbWidth: number = getThumbLength(trackWidth, axis.zoomFactor as number);
    const thumbOffset: number = calculateThumbOffset(trackWidth, thumbWidth, axis, chart.enableRtl);

    // Determine if this is a global scrollbar
    const isGlobalScrollbar: boolean = axis.scrollbarSettings?.position === 'Top' ||
        axis.scrollbarSettings?.position === 'Bottom';

    let scrollbarY: number;
    if (isGlobalScrollbar) {
        scrollbarY = scrollbarRect.y;
    } else {
        scrollbarY = axis.isAxisOpposedPosition
            ? scrollbarRect.y - SCROLLBAR_GAP + scrollbarRect.height
            : scrollbarRect.y + scrollbarRect.height - thickness;
    }
    const leftArrowPath: string = `M ${thumbOffset - thickness * 0.32} ${thickness / 2}
        L ${thumbOffset + thickness * 0.08} ${thickness / 2 - thickness * 0.25}
        L ${thumbOffset + thickness * 0.08} ${thickness / 2 + thickness * 0.25}
        Z`;
    const rightArrowPath: string = `M ${thumbOffset + thumbWidth + thickness * 0.32} ${thickness / 2}
        L ${thumbOffset + thumbWidth - thickness * 0.08} ${thickness / 2 - thickness * 0.25}
        L ${thumbOffset + thumbWidth - thickness * 0.08} ${thickness / 2 + thickness * 0.25}
        Z`;

    return (
        <g id={`${chart.element.id}_${axis.name}_Scrollbar`}
            key={`${chart.element.id}_${axis.name}`}
            transform={`translate(${scrollbarRect.x}, ${scrollbarY})`}
        >
            {/* Track */}
            <rect
                x={0}
                y={0}
                width={trackWidth}
                height={thickness}
                rx={axis.scrollbarSettings?.trackRadius ?? thickness / 2}
                fill={axis.scrollbarSettings?.trackColor ?? chart.themeStyle.scrollbarTrackColor}
                opacity={0.9}
                style={{ pointerEvents: 'all' }}
                onPointerDown={(e: React.PointerEvent<SVGRectElement>) =>
                    handleTrackClick(e, axis, chart, thumbOffset, 'Horizontal')
                }
            />

            {/* Thumb */}
            <rect
                key={`${axis.name}_thumb`}
                data-is-thumb="true"
                x={thumbOffset}
                y={1}
                width={thumbWidth}
                height={thickness - 2}
                rx={axis.scrollbarSettings?.thumbRadius ?? (thickness - 2) / 2}
                fill={axis.scrollbarSettings?.thumbColor ?? chart.themeStyle.scrollbarThumbColor}
                cursor="grab"
                style={{ pointerEvents: 'all' }}
                onPointerDown={(e: React.PointerEvent<SVGRectElement>) =>
                    startThumbDrag?.(e, axis, chart, trackWidth, thumbWidth, 'Horizontal')
                }
            />
            {axis.scrollbarSettings?.enableZoom && (
                <>
                    {/* Left circle */}
                    <circle
                        cx={thumbOffset}
                        cy={thickness / 2}
                        r={thickness / 2}
                        fill={axis.scrollbarSettings.resizeCircle?.circleColor ?? chart.themeStyle.resizeCircleColor}
                        stroke={axis.scrollbarSettings.resizeCircle?.borderColor ?? chart.themeStyle.resizeCircleBorderColor}
                        strokeWidth={axis.scrollbarSettings.resizeCircle?.borderWidth ?? 1}
                        data-handle="resize-start"
                        style={{ cursor: 'ew-resize' }}
                        onPointerDown={(e: React.PointerEvent<SVGGraphicsElement>) =>
                            startThumbDrag?.(e, axis, chart, trackWidth, thumbWidth, 'Horizontal')
                        }
                    />

                    <path
                        d={leftArrowPath}
                        fill={axis.scrollbarSettings.resizeCircle?.arrowColor ?? chart.themeStyle.resizeCircleArrowColor}
                        pointerEvents="none"
                    />


                    {/* Right circle */}
                    <circle
                        cx={thumbOffset + thumbWidth}
                        cy={thickness / 2}
                        r={thickness / 2}
                        fill={axis.scrollbarSettings.resizeCircle?.circleColor ?? chart.themeStyle.resizeCircleColor}
                        stroke={axis.scrollbarSettings.resizeCircle?.borderColor ?? chart.themeStyle.resizeCircleBorderColor}
                        strokeWidth={axis.scrollbarSettings.resizeCircle?.borderWidth ?? 1}
                        data-handle="resize-end"
                        style={{ cursor: 'ew-resize' }}
                        onPointerDown={(e: React.PointerEvent<SVGGraphicsElement>) =>
                            startThumbDrag?.(e, axis, chart, trackWidth, thumbWidth, 'Horizontal')
                        }
                    />

                    <path
                        d={rightArrowPath}
                        fill={axis.scrollbarSettings.resizeCircle?.arrowColor ?? chart.themeStyle.resizeCircleArrowColor}
                        pointerEvents="none"
                    />
                </>
            )}
        </g>
    );
}

/**
 * Determines whether layout space should be allocated for an axis scrollbar.
 *
 * Evaluates the current zoom state, chart scrollbar settings, axis-specific
 * scrollbar configuration, and scrollbar thickness to decide if scrollbar
 * space needs to be reserved during layout calculation.
 *
 * @param {Chart} chart - The chart instance containing zoom and scrollbar settings
 * @param {AxisModel} axis - The axis configuration to evaluate for scrollbar allocation
 * @returns {boolean} - A value indicating whether scrollbar space should be allocated
 * @private
 */
export function shouldAllocateScrollbarSpace(chart: Chart, axis: AxisModel): boolean {
    const isZoomed: boolean = (axis.zoomFactor as number) < 1 || (axis.zoomPosition as number) > 0;
    return (isZoomed && chart.zoomSettings?.enableScrollbar === true &&
        axis.scrollbarSettings?.enable !== false &&
        (axis.scrollbarThickness as number) > 0
    );
}

/**
 * Normalizes the scrollbar position based on the axis orientation.
 *
 * Ensures that the specified scrollbar position is valid for the given
 * axis orientation. If an invalid position is provided, the scrollbar
 * is positioned next to the axis line by default.
 *
 * @param {AxisModel} axis - The axis configuration containing scrollbar settings
 * @returns {'Top' | 'Bottom' | 'Left' | 'Right' | 'PlaceNextToAxisLine'} -
 * The normalized scrollbar position compatible with the axis orientation
 * @private
 */
export function normalizeScrollbarPosition(
    axis: AxisModel
): 'Top' | 'Bottom' | 'Left' | 'Right' | 'PlaceNextToAxisLine' {
    const position: ScrollbarPosition = axis.scrollbarSettings?.position as ScrollbarPosition;
    if (axis.orientation === 'Horizontal') {
        if (position === 'Top' || position === 'Bottom' || position === 'PlaceNextToAxisLine') {
            return position;
        }
        return 'PlaceNextToAxisLine';
    }
    if (axis.orientation === 'Vertical') {
        if (position === 'Left' || position === 'Right' || position === 'PlaceNextToAxisLine') {
            return position;
        }
        return 'PlaceNextToAxisLine';
    }
    return 'PlaceNextToAxisLine';
}

/**
 * Calculates the scrollbar rectangle for global positions (Top, Bottom, Left, Right).
 *
 * @param {Chart} chart - The chart instance
 * @param {'Top' | 'Bottom' | 'Left' | 'Right'} position - The global position for the scrollbar
 * @returns {Rect} - The calculated scrollbar rectangle
 * @private
 */
export function calculateGlobalScrollbarRect(chart: Chart, position: 'Top' | 'Bottom' | 'Left' | 'Right'): Rect {
    const seriesClipRect: Rect = chart.chartAxislayout?.seriesClipRect;
    if (position === 'Top') {
        const axis: AxisModel = chart.axisCollection.find(
            (currentAxis: AxisModel) => currentAxis.scrollbarSettings?.position === 'Top'
        ) as AxisModel;

        const thickness: number = axis?.scrollbarThickness as number;
        const layout: ChartAxisLayout = chart.chartAxislayout;
        const clip: Rect = layout.seriesClipRect;

        return {
            x: clip.x,
            y: clip.y - layout.topSize - 10,
            width: clip.width,
            height: thickness
        };
    }
    else if (position === 'Bottom') {
        const axis: AxisModel = chart.axisCollection.find(
            (currentAxis: AxisModel) => currentAxis.scrollbarSettings?.position === 'Bottom'
        ) as AxisModel;
        const thickness: number = axis?.scrollbarThickness as number;
        const layout: ChartAxisLayout = chart.chartAxislayout;
        const clip: Rect = seriesClipRect;

        const bottomBand: number = layout?.bottomSize;
        const y: number = clip.y + clip.height + Math.max(0, bottomBand - thickness) + SCROLLBAR_GAP;

        return {
            x: clip.x,
            y: y,
            width: clip.width,
            height: thickness
        };
    }
    else if (position === 'Left') {
        const axis: AxisModel = chart.axisCollection.find(
            (currentAxis: AxisModel) => currentAxis.scrollbarSettings?.position === 'Left'
        ) as AxisModel;
        const thickness: number = axis?.scrollbarThickness as number;
        const layout: ChartAxisLayout = chart.chartAxislayout;
        const clip: Rect = layout.seriesClipRect;

        const leftBandWithoutScrollbar: number = Math.max(0, layout.leftSize - thickness);
        return {
            x: clip.x - leftBandWithoutScrollbar - thickness - SCROLLBAR_GAP,
            y: clip.y,
            width: thickness,
            height: clip.height
        };
    }
    else {
        const axis: AxisModel = chart.axisCollection.find(
            (currentAxis: AxisModel) => currentAxis.scrollbarSettings?.position === 'Right'
        ) as AxisModel;
        const thickness: number = axis?.scrollbarThickness as number;
        const layout: ChartAxisLayout = chart.chartAxislayout;
        const clip: Rect = layout.seriesClipRect;

        const rightBandWithoutScrollbar: number = Math.max(0, layout.rightSize - thickness);
        return {
            x: clip.x + clip.width + rightBandWithoutScrollbar + SCROLLBAR_GAP,
            y: clip.y,
            width: thickness,
            height: clip.height
        };
    }
}

/**
 * Adds the thickness of global scrollbars to the chart layout dimensions.
 *
 * Iterates through supported global scrollbar positions (Top, Bottom, Left, Right)
 * and, if a scrollbar is enabled and needs space allocation for that position,
 * increments the corresponding layout size by the scrollbar thickness.
 *
 * This ensures sufficient space is reserved during layout calculation for
 * rendering global scrollbars without overlapping chart content.
 *
 * @param {Chart} chart - The chart instance containing axis and scrollbar configuration
 * @param {ChartAxisLayout} layout - The layout object whose size values will be updated
 * @returns {void}
 * @private
 */
export function addGlobalScrollbarThickness(chart: Chart, layout: ChartAxisLayout): void {
    const positionToLayoutKeyMap: Record<'Left' | 'Right' | 'Top' | 'Bottom', keyof ChartAxisLayout> = {
        Left: 'leftSize',
        Right: 'rightSize',
        Top: 'topSize',
        Bottom: 'bottomSize'
    };

    (Object.keys(positionToLayoutKeyMap) as Array<'Left' | 'Right' | 'Top' | 'Bottom'>).forEach((scrollbarPosition: 'Left' | 'Right' | 'Top' | 'Bottom') => {
        const axis: AxisModel = chart.axisCollection.find((currentAxis: AxisModel) =>
            currentAxis.scrollbarSettings?.position === scrollbarPosition &&
      shouldAllocateScrollbarSpace(chart, currentAxis)
        ) as AxisModel;

        if (axis) {
            (layout[positionToLayoutKeyMap[scrollbarPosition as 'Left' | 'Right' | 'Top' | 'Bottom']] as number) += axis.scrollbarThickness as number;
        }
    });
}
