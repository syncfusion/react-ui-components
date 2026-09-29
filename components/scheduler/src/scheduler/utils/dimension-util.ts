import { CSSProperties } from 'react';
import { ROW_HEIGHT, DEFAULT_TIMELINE_EVENT_HEIGHT } from '../services/EventService';
import { isNullOrUndefined } from '@syncfusion/react-base';
import { calculateTimelineEventRowHeight } from './actions';
import { CSS_CLASSES } from '../common/constants';
import { ViewDimensions } from '../types/internal-interface';

/**
 * Measures the actual cell dimensions from the DOM.
 *
 * This utility function dynamically reads the actual rendered cell height
 * from the DOM (from `.sf-time-slots` or `.sf-work-cells-row` elements)
 * instead of relying on a hardcoded constant. This ensures accurate
 * positioning when CSS customizations are applied to cell dimensions.
 *
 * @param {HTMLElement | null} schedulerRef - Reference to the scheduler element
 * @returns {ViewDimensions} The measured dimensions object with cellHeight and optional cellWidth
 * @private
 */
export function getCellDimensions(schedulerRef: HTMLElement | null): ViewDimensions {
    if (!schedulerRef) {
        return { cellHeight: ROW_HEIGHT };
    }
    let cellElement: Element | null = schedulerRef.querySelector('.sf-time-slots');
    if (!cellElement) {
        cellElement = schedulerRef.querySelector('.sf-work-cells-row');
    }
    if (cellElement && cellElement instanceof HTMLElement) {
        const cellHeight: number = cellElement.clientHeight;
        if (cellHeight > 0) {
            return { cellHeight };
        }
    }
    return { cellHeight: ROW_HEIGHT };
}

/**
 * Returns the rendered timeline event height by measuring an appointment element from the DOM.
 *
 * @param {HTMLElement | null | undefined} element - Reference element for locating the appointment element.
 * @returns {number} The event height in pixels, or the default height when unavailable.
 * @private
 */
export function getTimelineEventHeight(element: HTMLElement | null | undefined): number {
    const timelineView: Element | null = element?.closest(`.${CSS_CLASSES.TIMELINE_VIEW}`) ?? null;
    if (!timelineView) {
        return DEFAULT_TIMELINE_EVENT_HEIGHT;
    }
    const appointment: HTMLElement | null = timelineView.querySelector<HTMLElement>(`.${CSS_CLASSES.APPOINTMENT}`);
    return appointment?.offsetHeight || DEFAULT_TIMELINE_EVENT_HEIGHT;
}

type ResourceRowHeightStyleArgs = (
    isGroupingEnabled: boolean,
    rowAutoHeight: boolean,
    resourceRowHeights: Map<number, number> | undefined,
    groupIndex: number | undefined,
    maxEventsStack?: number,
    eventHeight?: number,
    isTimelineView?: boolean
) => CSSProperties | undefined;

/**
 * Builds the inline style object for the `--sf-scheduler-resource-row-height`
 * CSS variable based on the rowAutoHeight or maxEventsPerStack settings.
 *
 * - Returns `undefined` when grouping/auto-height is disabled, the view is
 *   not a timeline view, or `groupIndex` is undefined/missing in the map.
 *
 * @param {boolean} isGroupingEnabled - Whether resource grouping is active
 * @param {boolean} rowAutoHeight - Whether row auto-height is enabled
 * @param {Map<number, number> | undefined} resourceRowHeights - Map of groupIndex → row height in px (published by TimelineEvent for `rowAutoHeight=true`)
 * @param {number | undefined} groupIndex - The resource group index to look up
 * @param {number} [maxEventsStack] - User-supplied event-stack cap. When set, drives a fixed per-row height.
 * @param {number} [eventHeight] - Rendered event-bar height in pixels. Defaults to `DEFAULT_TIMELINE_EVENT_HEIGHT`.
 * @param {boolean} [isTimelineView=true] - Timeline-view guard. Pass `false` to skip
 * @returns {CSSProperties | undefined} Style object with the CSS var, or undefined
 * @private
 */
export const getResourceRowHeightStyle: ResourceRowHeightStyleArgs = (
    isGroupingEnabled: boolean, rowAutoHeight: boolean, resourceRowHeights: Map<number, number>, groupIndex: number,
    maxEventsStack?: number, eventHeight: number = DEFAULT_TIMELINE_EVENT_HEIGHT, isTimelineView: boolean = true
) => {
    if (!isGroupingEnabled || !isTimelineView || isNullOrUndefined(groupIndex)) {
        return undefined;
    }
    if (rowAutoHeight) {
        const hasEntry: boolean = resourceRowHeights?.has(groupIndex) ?? false;
        const height: number | undefined = hasEntry ? resourceRowHeights?.get(groupIndex) : undefined;
        if (isNullOrUndefined(height)) {
            return undefined;
        }
        return { '--sf-scheduler-resource-row-height': `${height}px` } as CSSProperties;
    }
    if (!isNullOrUndefined(maxEventsStack) && maxEventsStack > 0) {
        const height: number = calculateTimelineEventRowHeight(maxEventsStack, eventHeight, true);
        return { '--sf-scheduler-resource-row-height': `${height}px` } as CSSProperties;
    }
    return undefined;
};
