import { CSSProperties } from 'react';
import { TimeScaleModel } from '../types/schedule-types';
import { ProcessedEventsData } from '../types/internal-interface';
import { DateService, MINUTES_PER_DAY, MINUTES_PER_HOUR, MS_PER_DAY } from './DateService';
import { ROW_HEIGHT, ALL_DAY_EVENT_HEIGHT, EVENTS_GAP } from './EventService';

/**
 * PositioningService provides methods for calculating event positions and styles
 * for rendering in the Schedule component.
 */
export class PositioningService {
    /**
     * Calculates the position and dimensions for an event
     *
     * @param {ProcessedEventsData} eventInfo - The event information
     * @param {TimeScaleModel} timeScale - The time scale configuration
     * @param {string} startHour - The start hour of the schedule
     * @param {string} endHour - The end hour of the schedule
     * @returns {CSSProperties} CSS properties for positioning
     */
    static calculateEventPosition(
        eventInfo: ProcessedEventsData,
        timeScale: TimeScaleModel,
        startHour: string,
        endHour: string
    ): CSSProperties {
        const top: string = (eventInfo.event.isAllDay && eventInfo.event.isBlock) ? '0px' :
            this.calculateTopPosition(eventInfo.startDate, timeScale, startHour);
        const height: string = this.calculateHeight(eventInfo, timeScale, startHour, endHour);
        let widthValue: number = 96;
        let left: string = '0%';

        if (eventInfo.totalOverlapping > 1) {
            widthValue = (widthValue - eventInfo.totalOverlapping) / eventInfo.totalOverlapping;
            left = `${(eventInfo.positionIndex * widthValue) + eventInfo.positionIndex}%`;
        }

        const width: string = (eventInfo.event.isBlock) ? `${'calc(100% - 1px)'}` : `${widthValue}%`;
        return { top, height, width, left };
    }

    /**
     * Determines if an event overflows the visible area
     *
     * @param {ProcessedEventsData} eventInfo - The event information
     * @param {Date[]} renderDates - The dates being rendered
     * @returns {Object} Overflow direction indicators
     */
    static getOverflowDirection(
        eventInfo: ProcessedEventsData,
        renderDates: Date[]
    ): { isOverflowLeft: boolean, isOverflowRight: boolean, isOverflowTop: boolean, isOverflowBottom: boolean } {
        if (!eventInfo.totalSegments || !eventInfo.event?.startTime || !eventInfo.event?.endTime || !renderDates?.length) {
            return { isOverflowLeft: false, isOverflowRight: false, isOverflowTop: false, isOverflowBottom: false };
        }
        const eventStartDay: Date = DateService.normalizeDate(eventInfo.event.startTime);
        const eventEndDay: Date = DateService.normalizeDate(eventInfo.event.endTime);
        const firstRenderDate: Date = DateService.normalizeDate(renderDates[0]);
        const lastRenderDate: Date = DateService.normalizeDate(renderDates[renderDates.length - 1]);
        const isOverflowTop: boolean = eventInfo.isFirstDay === false;
        const isOverflowBottom: boolean = eventInfo.isLastDay === false;
        if (!eventStartDay || !eventEndDay || !firstRenderDate || !lastRenderDate) {
            return { isOverflowLeft: false, isOverflowRight: false, isOverflowTop, isOverflowBottom };
        }
        const isOverflowLeft: boolean = eventStartDay.getTime() < firstRenderDate.getTime();
        const isOverflowRight: boolean = eventEndDay.getTime() > lastRenderDate.getTime();
        return { isOverflowLeft, isOverflowRight, isOverflowTop, isOverflowBottom };
    }

    /**
     * Calculates position styles based on event information and type
     *
     * @param {ProcessedEventsData} eventInfo - The event information
     * @param {Date[]} renderDates - The dates being rendered in the current view
     * @param {TimeScaleModel} timeScale - The time scale configuration (for non-allday events)
     * @param {string} startHour - The start hour of the schedule (for non-allday events)
     * @param {string} endHour - The end hour of the schedule (for non-allday events)
     * @returns {CSSProperties} CSS properties for positioning
     */
    static calculatePositionStyles(
        eventInfo: ProcessedEventsData,
        renderDates: Date[],
        timeScale?: TimeScaleModel,
        startHour?: string,
        endHour?: string
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
            return this.calculateEventPosition(eventInfo, timeScale, startHour, endHour);
        }
        return {};
    }

    /**
     * Calculates the top position for an event
     *
     * @param {Date} startTime - The event start time
     * @param {TimeScaleModel} timeScale - The time scale configuration
     * @param {string} startHour - The start hour of the schedule
     * @returns {string} The top position as a CSS value
     */
    static calculateTopPosition(
        startTime: Date,
        timeScale: TimeScaleModel,
        startHour: string
    ): string {
        const startHourDate: Date = DateService.getStartEndHours(startHour);
        const scheduleStartMinutes: number = startHourDate.getHours() * MINUTES_PER_HOUR + startHourDate.getMinutes();
        const eventStartMinutes: number = startTime.getHours() * MINUTES_PER_HOUR + startTime.getMinutes();
        // Calculate minutes from scheduler start time
        const minutesFromStart: number = eventStartMinutes - scheduleStartMinutes;
        const rowHeight: number = ROW_HEIGHT;
        const pixelsPerMinute: number = rowHeight / (timeScale.interval / timeScale.slotCount);
        const top: number = minutesFromStart * pixelsPerMinute;
        return `${Math.max(0, top)}px`;
    }

    /**
     * Calculates the height of an event
     *
     * @param {ProcessedEventsData} eventInfo - The event information
     * @param {TimeScaleModel} timeScale - The time scale configuration
     * @param {string} startHour - The start hour of the schedule
     * @param {string} endHour - The end hour of the schedule
     * @returns {string} The height as a CSS value
     */
    static calculateHeight(
        eventInfo: ProcessedEventsData,
        timeScale: TimeScaleModel,
        startHour: string,
        endHour: string
    ): string {
        const eventStartTime: Date = new Date(eventInfo.startDate);
        const eventEndTime: Date = new Date(eventInfo.endDate);
        if (eventInfo.event.isBlock && eventInfo.event.isAllDay) {
            eventStartTime.setHours(0, 0, 0, 0);
            eventEndTime.setDate(eventEndTime.getDate() + 1);
            eventEndTime.setHours(0, 0, 0, 0);
        }
        const intervalMinutes: number = timeScale.interval / timeScale.slotCount;
        const { scheduleStartMinutes, scheduleEndMinutes } = DateService.getScheduleStartAndEndMinutes(startHour, endHour);
        const eventStartMinutes: number = eventStartTime.getHours() * MINUTES_PER_HOUR + eventStartTime.getMinutes();
        // Adjust calculations based on scheduler view boundaries
        const effectiveStartMinutes: number = Math.max(eventStartMinutes, scheduleStartMinutes);
        const remainingMinutesInView: number = scheduleEndMinutes - effectiveStartMinutes;
        let cellsSpanned: number;
        if (DateService.isSameDay(eventStartTime, eventEndTime)) {
            // Calculate how many minutes of the event are visible in the view
            const eventEndMinutes: number = (eventStartTime.getDate() !== eventEndTime.getDate()) ? MINUTES_PER_DAY :
                eventEndTime.getHours() * MINUTES_PER_HOUR + eventEndTime.getMinutes();
            const visibleEventDuration: number = Math.min(eventEndMinutes, scheduleEndMinutes) - effectiveStartMinutes;
            cellsSpanned = Math.max(1, Math.ceil(visibleEventDuration / intervalMinutes));
            const maxCellsInView: number = Math.ceil(remainingMinutesInView / intervalMinutes);
            cellsSpanned = Math.min(cellsSpanned, maxCellsInView);
        } else {
            // For multi-day events, extend to the end of the current view
            cellsSpanned = Math.min(remainingMinutesInView / intervalMinutes);
        }
        const height: number = cellsSpanned * ROW_HEIGHT - 2;
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
}
