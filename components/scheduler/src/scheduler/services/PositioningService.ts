import { CSSProperties } from 'react';
import { EventModel, SchedulerResource, TimeScaleProps } from '../types/scheduler-types';
import { ProcessedEventsData } from '../types/internal-interface';
import { DateService, MINUTES_PER_DAY, MINUTES_PER_HOUR, MS_PER_DAY } from './DateService';
import { ROW_HEIGHT, ALL_DAY_EVENT_HEIGHT, EVENTS_GAP } from './EventService';

/**
 * PositioningService provides methods for calculating event positions and styles
 * for rendering in the Scheduler component.
 *
 * @private
 */
export class PositioningService {
    /**
     * Calculates the position and dimensions for an event
     *
     * @param {ProcessedEventsData} eventInfo - The event information
     * @param {TimeScaleProps} timeScale - The time scale configuration
     * @param {string} startHour - The start hour of the scheduler
     * @param {string} endHour - The end hour of the scheduler
     * @param {number} [cellHeight] - Optional custom cell height. If not provided or 0, falls back to ROW_HEIGHT
     * @returns {CSSProperties} CSS properties for positioning
     */
    static calculateEventPosition(
        eventInfo: ProcessedEventsData,
        timeScale: TimeScaleProps,
        startHour: string,
        endHour: string,
        cellHeight?: number
    ): CSSProperties {
        const top: string = (eventInfo.event.isAllDay && eventInfo.event.isBlock) ? '0px' :
            this.calculateTopPosition(eventInfo.startDate, timeScale, startHour, cellHeight);
        const height: string = this.calculateHeight(eventInfo, timeScale, startHour, endHour, cellHeight);
        let widthValue: number = 96;
        let left: string = eventInfo.event.isBlock ? '1px' : '0%';

        if (eventInfo.totalOverlapping > 1) {
            widthValue = (widthValue - eventInfo.totalOverlapping) / eventInfo.totalOverlapping;
            left = `${(eventInfo.positionIndex * widthValue) + eventInfo.positionIndex}%`;
        }

        const width: string = (eventInfo.event.isBlock) ? `${'calc(100% - 2px)'}` : `${widthValue}%`;
        return { top, height, width, left };
    }

    /**
     * Determines if an event overflows the visible area
     *
     * @param {ProcessedEventsData} eventInfo - The event information
     * @param {Date[]} renderDates - The dates being rendered
     * @param {[number, number]} startHourTuple - The start hour of the scheduler
     * @param {[number, number]} endHourTuple - The end hour of the scheduler
     * @returns {Object} Overflow direction indicators
     */
    static getOverflowDirection(
        eventInfo: ProcessedEventsData,
        renderDates: Date[],
        startHourTuple?: [number, number],
        endHourTuple?: [number, number]
    ): { isOverflowLeft: boolean, isOverflowRight: boolean, isOverflowTop: boolean, isOverflowBottom: boolean } {
        if ((!eventInfo.totalSegments && !startHourTuple && !endHourTuple)
            || !eventInfo.event?.startTime || !eventInfo.event?.endTime || !renderDates?.length) {
            return { isOverflowLeft: false, isOverflowRight: false, isOverflowTop: false, isOverflowBottom: false };
        }
        const eventStartDay: Date = DateService.normalizeDate(eventInfo.event.startTime);
        const eventEndDay: Date = DateService.normalizeDate(eventInfo.event.endTime);
        const firstRenderDate: Date = DateService.normalizeDate(renderDates[0]);
        const lastRenderDate: Date = DateService.normalizeDate(renderDates[renderDates.length - 1]);
        let isOverflowTop: boolean = eventInfo.isFirstDay === false;
        let isOverflowBottom: boolean = eventInfo.isLastDay === false;
        if (!eventStartDay || !eventEndDay || !firstRenderDate || !lastRenderDate) {
            return { isOverflowLeft: false, isOverflowRight: false, isOverflowTop, isOverflowBottom };
        }
        const isOverflowLeft: boolean = eventStartDay.getTime() < firstRenderDate.getTime();
        const isOverflowRight: boolean = eventEndDay.getTime() > lastRenderDate.getTime();
        if (startHourTuple && endHourTuple) {
            eventStartDay.setHours(startHourTuple[0], startHourTuple[1], 0, 0);
            eventEndDay.setHours(endHourTuple[0], endHourTuple[1], 0, 0);
            if (!isOverflowTop && eventStartDay > eventInfo.event.startTime) {
                isOverflowTop = true;
            }
            if (!isOverflowBottom && eventEndDay < eventInfo.event.endTime) {
                isOverflowBottom = true;
            }
        }
        return { isOverflowLeft, isOverflowRight, isOverflowTop, isOverflowBottom };
    }

    /**
     * Calculates position styles based on event information and type
     *
     * @param {ProcessedEventsData} eventInfo - The event information
     * @param {Date[]} renderDates - The dates being rendered in the current view
     * @param {TimeScaleProps} timeScale - The time scale configuration (for non-allday events)
     * @param {string} startHour - The start hour of the scheduler (for non-allday events)
     * @param {string} endHour - The end hour of the scheduler (for non-allday events)
     * @param {number} [cellHeight] - Optional custom cell height. If not provided or 0, falls back to ROW_HEIGHT
     * @returns {CSSProperties} CSS properties for positioning
     */
    static calculatePositionStyles(
        eventInfo: ProcessedEventsData,
        renderDates: Date[],
        timeScale?: TimeScaleProps,
        startHour?: string,
        endHour?: string,
        cellHeight?: number
    ): CSSProperties {
        // For spanned events
        if (eventInfo.totalSegments) {
            const styles: CSSProperties = {
                top: `${eventInfo.positionIndex * (ALL_DAY_EVENT_HEIGHT + EVENTS_GAP)}px`,
                width: this.calculateEventWidth(eventInfo, renderDates)
            };
            return styles;
        }
        // For all-day events and month events height.
        if (!eventInfo.event.isBlock && eventInfo.positionIndex !== undefined && (eventInfo.event.isAllDay || eventInfo.isMonthEvent)) {
            return {
                top: `${eventInfo.positionIndex * (ALL_DAY_EVENT_HEIGHT + EVENTS_GAP)}px`
            };
        }
        // For regular time slot events
        if (timeScale && startHour && endHour) {
            return this.calculateEventPosition(eventInfo, timeScale, startHour, endHour, cellHeight);
        }
        return {};
    }

    /**
     * Calculates the top position for an event
     *
     * @param {Date} startTime - The event start time
     * @param {TimeScaleProps} timeScale - The time scale configuration
     * @param {string} startHour - The start hour of the scheduler
     * @param {number} [cellHeight] - Optional custom cell height. If not provided or 0, falls back to ROW_HEIGHT
     * @returns {string} The top position as a CSS value
     *
     * **Note on Dynamic Cell Heights:**
     * The cellHeight parameter allows this method to adapt to CSS customizations
     * of cell dimensions. When cellHeight is provided and non-zero, it is used
     * instead of the hardcoded ROW_HEIGHT constant. This ensures that event
     * positioning correctly accounts for custom cell heights applied via CSS.
     */
    static calculateTopPosition(
        startTime: Date,
        timeScale: TimeScaleProps,
        startHour: string,
        cellHeight?: number
    ): string {
        const startHourDate: Date = DateService.getStartEndHours(startHour);
        const schedulerStartMinutes: number = startHourDate.getHours() * MINUTES_PER_HOUR + startHourDate.getMinutes();
        const eventStartMinutes: number = startTime.getHours() * MINUTES_PER_HOUR + startTime.getMinutes();
        // Calculate minutes from scheduler start time
        const minutesFromStart: number = eventStartMinutes - schedulerStartMinutes;
        // Use passed cellHeight if provided and valid, otherwise fall back to ROW_HEIGHT
        const rowHeight: number = (cellHeight && cellHeight > 0) ? cellHeight : ROW_HEIGHT;
        const pixelsPerMinute: number = rowHeight / (timeScale.interval / timeScale.slotCount);
        const top: number = minutesFromStart * pixelsPerMinute;
        return `${Math.max(0, top)}px`;
    }

    /**
     * Calculates the height of an event
     *
     * @param {ProcessedEventsData} eventInfo - The event information
     * @param {TimeScaleProps} timeScale - The time scale configuration
     * @param {string} startHour - The start hour of the scheduler
     * @param {string} endHour - The end hour of the scheduler
     * @param {number} [cellHeight] - Optional custom cell height. If not provided or 0, falls back to ROW_HEIGHT
     * @returns {string} The height as a CSS value
     *
     * **Note on Dynamic Cell Heights:**
     * The cellHeight parameter enables this method to correctly calculate event
     * heights based on actual DOM cell dimensions rather than hardcoded constants.
     * This is essential for supporting CSS-customized cell heights (e.g., 100px cells).
     */
    static calculateHeight(
        eventInfo: ProcessedEventsData,
        timeScale: TimeScaleProps,
        startHour: string,
        endHour: string,
        cellHeight?: number
    ): string {
        const eventStartTime: Date = new Date(eventInfo.startDate);
        const eventEndTime: Date = new Date(eventInfo.endDate);
        if (eventInfo.event.isBlock && eventInfo.event.isAllDay) {
            eventStartTime.setHours(0, 0, 0, 0);
            eventEndTime.setDate(eventEndTime.getDate() + 1);
            eventEndTime.setHours(0, 0, 0, 0);
        }
        const intervalMinutes: number = timeScale.interval / timeScale.slotCount;
        const { schedulerStartMinutes, schedulerEndMinutes } = DateService.getSchedulerStartAndEndMinutes(startHour, endHour);
        const eventStartMinutes: number = eventStartTime.getHours() * MINUTES_PER_HOUR + eventStartTime.getMinutes();
        // Adjust calculations based on scheduler view boundaries
        const effectiveStartMinutes: number = Math.max(eventStartMinutes, schedulerStartMinutes);
        const remainingMinutesInView: number = schedulerEndMinutes - effectiveStartMinutes;
        let cellsSpanned: number;
        if (DateService.isSameDay(eventStartTime, eventEndTime)) {
            // Calculate how many minutes of the event are visible in the view
            const eventEndMinutes: number = (eventStartTime.getDate() !== eventEndTime.getDate()) ? MINUTES_PER_DAY :
                eventEndTime.getHours() * MINUTES_PER_HOUR + eventEndTime.getMinutes();
            const visibleEventDuration: number = Math.min(eventEndMinutes, schedulerEndMinutes) - effectiveStartMinutes;
            cellsSpanned = visibleEventDuration / intervalMinutes;
            const maxCellsInView: number = Math.ceil(remainingMinutesInView / intervalMinutes);
            cellsSpanned = Math.min(cellsSpanned, maxCellsInView);
        } else {
            // For multi-day events, extend to the end of the current view
            cellsSpanned = Math.min(remainingMinutesInView / intervalMinutes);
        }
        // Use passed cellHeight if provided and valid, otherwise fall back to ROW_HEIGHT
        const rowHeight: number = (cellHeight && cellHeight > 0) ? cellHeight : ROW_HEIGHT;
        let height: number = Math.round(cellsSpanned * rowHeight - 2);
        height = height > 0 ? height : 1;
        return `${height}px`;
    }

    /**
     * Calculates the width of an event that spans multiple days
     *
     * @param {ProcessedEventsData} eventInfo - The event information
     * @param {Date[]} renderDates - The dates being rendered
     * @returns {string} The width as a CSS value
     */
    private static calculateEventWidth(
        eventInfo: ProcessedEventsData,
        renderDates: Date[]
    ): string {
        const eventStartDay: Date = DateService.normalizeDate(eventInfo.event.startTime);
        const eventEndDay: Date = DateService.normalizeDate(eventInfo.event.endTime);
        const firstRenderDate: Date = DateService.normalizeDate(renderDates[0]);
        const lastRenderDate: Date = DateService.normalizeDate(renderDates[renderDates.length - 1]);
        const { isOverflowLeft, isOverflowRight } = this.getOverflowDirection(eventInfo, renderDates);

        // When working with week-based renderDates
        if (renderDates.length <= 7) {
            const { visibleDayCount, startDayIndex } =
                    DateService.getVisibleAndStartDays(renderDates, eventStartDay, eventEndDay, eventInfo.event);

            if (visibleDayCount > 0 && startDayIndex !== -1) {
                // Calculate width as percentage based on cell width (100% per cell)
                return `calc(${visibleDayCount * 100}% - 4px)`;
            }
        }

        if (isOverflowLeft && isOverflowRight) {
            return `${renderDates.length * 100}%`;
        } else if (isOverflowLeft) {
            const visibleEndDay: Date = eventEndDay.getTime() <= lastRenderDate.getTime() ?
                eventEndDay : lastRenderDate;
            const dayDiff: number = Math.floor(
                (visibleEndDay.getTime() - firstRenderDate.getTime()) / MS_PER_DAY
            ) + 1;
            return `${dayDiff * 100}%`;
        } else if (isOverflowRight) {
            const dayDiff: number = Math.floor(
                (lastRenderDate.getTime() - eventStartDay.getTime()) / MS_PER_DAY
            ) + 1;
            return `${dayDiff * 100}%`;
        } else {
            return `${eventInfo.totalSegments ? eventInfo.totalSegments * 100 : 100}%`;
        }
    }

    static setIndexPosition(sharedPositionMap: Map<string, boolean[]>, date: Date, positionIndex: number): Map<string, boolean[]> {
        const dateKey: string = DateService.generateDateKey(date);
        const positions: boolean[] = sharedPositionMap.get(dateKey) || [];

        while (positions.length <= positionIndex) {
            positions.push(false);
        }

        positions.splice(positionIndex, 1, true);
        sharedPositionMap.set(dateKey, positions);
        return sharedPositionMap;
    }

    /**
     * Initializes position maps for event rendering.
     * Creates a shared position map when no resources are configured,
     * or prepares the per-resource map structure when resources are present.
     *
     * @param {Date[]} renderDates - The dates to initialize position maps for
     * @param {boolean} usePerResourcePositioning - Whether to use per-resource position maps
     * @returns {Object} The initialized maps with sharedPositionMap and positionMapsPerResource
     */
    static initializePositionMaps(
        renderDates: Date[],
        usePerResourcePositioning: boolean
    ): {
            sharedPositionMap: Map<string, boolean[]> | undefined;
            positionMapsPerResource: Map<string, Map<string, boolean[]>>;
        } {
        let sharedPositionMap: Map<string, boolean[]> | undefined;
        const positionMapsPerResource: Map<string, Map<string, boolean[]>> = new Map();

        if (!usePerResourcePositioning) {
            sharedPositionMap = new Map<string, boolean[]>();
            renderDates.forEach((date: Date) => {
                const dateKey: string = DateService.generateDateKey(date);
                sharedPositionMap!.set(dateKey, []);
            });
        }

        return { sharedPositionMap, positionMapsPerResource };
    }

    /**
     * Gets or creates the position map for an event based on its resource key.
     * When per-resource positioning is enabled, creates a composite key from
     * all resource field values to identify the correct position map.
     *
     * @param {EventModel} event - The event to get position map for
     * @param {SchedulerResource[]} resources - The scheduler resources
     * @param {Map<string, Map<string, boolean[]>>} positionMapsPerResource - Map of position maps per resource key
     * @param {Date[]} renderDates - The dates being rendered
     * @param {Map<string, boolean[]>} sharedPositionMap - The shared position map when not using per-resource positioning
     * @returns {Map<string, boolean[]>} The position map for the event
     */
    static getPositionMapForEvent(
        event: EventModel,
        resources: SchedulerResource[],
        positionMapsPerResource: Map<string, Map<string, boolean[]>>,
        renderDates: Date[],
        sharedPositionMap: Map<string, boolean[]> | undefined
    ): Map<string, boolean[]> {
        if (!sharedPositionMap) {
            const resourceKeyParts: (string | number)[] = resources.map((resource: SchedulerResource) => {
                const value: string | number | (string | number)[] =
                        Reflect.get(event, resource.field) as string | number | (string | number)[];
                return (value as string | number) || '';
            }).filter((v: string | number) => v !== '');
            const resourceKey: string = resourceKeyParts.join('|');

            if (!positionMapsPerResource.has(resourceKey)) {
                const newMap: Map<string, boolean[]> = new Map();
                renderDates.forEach((date: Date) => {
                    newMap.set(DateService.generateDateKey(date), []);
                });
                positionMapsPerResource.set(resourceKey, newMap);
            }
            return positionMapsPerResource.get(resourceKey)!;
        }
        return sharedPositionMap;
    }
}
