import { useMemo, useCallback } from 'react';
import { EventModel } from '../types/schedule-types';
import { ProcessedEventsData } from '../types/internal-interface';
import { DateService } from '../services/DateService';
import { EventService } from '../services/EventService';
import { useSchedulePropsContext } from '../context/schedule-context';
import { useScheduleEventsContext } from '../context/schedule-events-context';

const EVENT_HEIGHT: number = 24; // Height of each event in pixels
const BASE_ROW_HEIGHT: number = 124; // Base row height
const DATE_HEADER_HEIGHT: number = 25; // Height of the date header
const TOOLBAR_HEIGHT: number = 48;
const EMPTY_SPACE_IN_BOTTOM: number = 30; // 30 px empty space in bottom.
const EVENT_GAP: number = 4;

/**
 * Interface for the result of useMonthEvents hook
 */
export interface UseMonthEventsResult {

    /**
     * Get visible events for a specific date
     */
    getVisibleEvents: (dateKey: string) => ProcessedEventsData[];

    getAlldayBlockEvent: (dateKey: string) => ProcessedEventsData;

    /**
     * Get hidden event count for a specific date
     */
    getHiddenEventCount: (dateKey: string) => number;

    /**
     * Get all events for a specific date (visible and hidden)
     */
    getAllEventsForDate: (dateKey: string) => ProcessedEventsData[];

    /**
     * Check if a date has more events than can be displayed
     */
    hasMoreIndicator: (dateKey: string) => boolean;

    /**
     * Check if a date has a block indicator (isBlock: true, isAllDay: false)
     */
    hasBlockIndicator: (dateKey: string) => boolean;

    /**
     * Check if a date has an all-day block event (isBlock: true, isAllDay: true)
     */
    hasAllDayBlock: (dateKey: string) => boolean;

    /**
     * calculated height for a specific row
     */
    calculatedRowHeight: string;

    /**
     * Utility function to sort events by start time
     */
    sortEventsByTime: (events: EventModel[]) => EventModel[];
}

/**
 * Process and organize events for month view rendering
 *
 * @param {Date[]} renderDates - The dates being rendered
 * @param {number} maxEventsPerRow - Maximum number of events to display per row.
 * @returns {UseMonthEventsResult} - Processed events data and related functions
 */
export const useMonthEvents: (
    renderDates: Date[],
    maxEventsPerRow: number
) => UseMonthEventsResult = (
    renderDates: Date[],
    maxEventsPerRow: number
): UseMonthEventsResult => {
    const { height, rowAutoHeight, numberOfWeeks, eventSettings } = useSchedulePropsContext();
    const { eventsData } = useScheduleEventsContext();

    /**
     * Process all events and prepare them for display in the month view
     */
    const processedEvents: ProcessedEventsData[] = useMemo(() => {
        return EventService.processDayEvents(renderDates, eventsData);
    }, [eventsData, renderDates]);

    // Group events by date
    const eventsByDate: Map<string, ProcessedEventsData[]> = useMemo((): Map<string, ProcessedEventsData[]> => {
        return EventService.getEventsMap(renderDates, processedEvents);
    }, [renderDates, processedEvents]);

    /**
     * Calculate the height for a specific row
     */
    const calculatedRowHeight: string = useMemo(() => {
        const maxEventsInRow: number = EventService.getMaxEventsInCell(eventsByDate, renderDates);

        if (!rowAutoHeight || maxEventsInRow === 0) {
            return `${BASE_ROW_HEIGHT}px`;
        }

        const eventsHeight: number = (maxEventsInRow * EVENT_HEIGHT) + DATE_HEADER_HEIGHT +
            (rowAutoHeight && eventSettings?.ignoreWhitespace ? 16 : EMPTY_SPACE_IN_BOTTOM) +
            ((maxEventsInRow > 0 ? maxEventsInRow - 1 : 0) * EVENT_GAP);
        let rowHeight: number = BASE_ROW_HEIGHT;

        if (height !== 'auto' && numberOfWeeks && rowAutoHeight) {
            const contentHeight: number = parseInt(height, 10) - TOOLBAR_HEIGHT;
            rowHeight = parseInt(Math.abs(contentHeight / numberOfWeeks).toFixed(2), 10);
        }
        return `${Math.max(eventsHeight, rowHeight)}px`;
    }, [renderDates, eventsByDate, rowAutoHeight, numberOfWeeks]);

    /**
     * Gets visible events for a specific date
     *
     * @param {string} dateKey - The date key
     * @returns {ProcessedEventsData[]} Array of visible events
     */
    const getVisibleEvents: (dateKey: string) => ProcessedEventsData[] = useCallback((dateKey: string): ProcessedEventsData[] => {
        const sortedEvents: ProcessedEventsData[] = getAllEventsForDate(dateKey);

        return rowAutoHeight ? sortedEvents : sortedEvents.slice(0, maxEventsPerRow);
    }, [eventsByDate, maxEventsPerRow, rowAutoHeight]);

    /**
     * Gets all day blocked events for a specific date
     *
     * @param {string} dateKey - The date key
     * @returns {ProcessedEventsData} Array of visible events
     */
    const getAlldayBlockEvent: (dateKey: string) => ProcessedEventsData = useCallback((dateKey: string): ProcessedEventsData => {
        const events: ProcessedEventsData[] = eventsByDate.get(dateKey);

        const allDayBlockEvent: ProcessedEventsData = events.find(
            (event: ProcessedEventsData) => event.event.isBlock &&
            (event.event.isAllDay || DateService.isFullDayEvent(event.startDate, event.endDate))
        );
        return allDayBlockEvent;
    }, [eventsByDate, maxEventsPerRow]);

    /**
     * Gets all events for a specific date (visible and hidden)
     *
     * @param {string} dateKey - The date key
     * @returns {ProcessedEventsData[]} Array of all events for the date
     */
    const getAllEventsForDate: (dateKey: string) => ProcessedEventsData[] = useCallback((dateKey: string): ProcessedEventsData[] => {
        const events: ProcessedEventsData[] = eventsByDate.get(dateKey)?.filter(
            (eventInfo: ProcessedEventsData) => !eventInfo.event.isBlock
        );

        const sortedEvents: ProcessedEventsData[] = [...events].sort((a: ProcessedEventsData, b: ProcessedEventsData) =>
            (a.positionIndex || 0) - (b.positionIndex || 0)
        );
        return sortedEvents;
    }, [eventsByDate]);

    /**
     * Gets the count of hidden events for a specific date
     *
     * @param {string} dateKey - The date key
     * @returns {number} Number of hidden events
     */
    const getHiddenEventCount: (dateKey: string) => number = useCallback((dateKey: string): number => {
        if (getAlldayBlockEvent(dateKey)) {
            return 0;
        }
        const events: ProcessedEventsData[] = eventsByDate.get(dateKey)?.filter(
            (eventInfo: ProcessedEventsData) => !eventInfo.event.isBlock
        );
        return Math.max(0, events.length - maxEventsPerRow);
    }, [eventsByDate, maxEventsPerRow]);

    /**
     * Checks if a date has more events than can be displayed
     *
     * @param {string} dateKey - The date key
     * @returns {boolean} True if date has more events than maxEventsPerRow
     */
    const hasMoreIndicator: (dateKey: string) => boolean = useCallback((dateKey: string): boolean => {
        return getHiddenEventCount(dateKey) > 0;
    }, [getHiddenEventCount]);

    /**
     * Checks if a date has a block indicator
     *
     * @param {string} dateKey - The date key
     * @returns {boolean} True if date has block indicator
     */
    const hasBlockIndicator: (dateKey: string) => boolean = useCallback((dateKey: string): boolean => {
        const events: ProcessedEventsData[] = eventsByDate.get(dateKey);
        return events.some((event: ProcessedEventsData) => event.event.isBlock && !event.event.isAllDay &&
            !DateService.isFullDayEvent(event.startDate, event.endDate)
        );
    }, [eventsByDate]);

    /**
     * Checks if a date has an all-day block event (isBlock: true, isAllDay: true)
     *
     * @param {string} dateKey - The date key
     * @returns {boolean} True if date has all-day block event
     */
    const hasAllDayBlock: (dateKey: string) => boolean = useCallback((dateKey: string): boolean => {
        const events: ProcessedEventsData[] = eventsByDate.get(dateKey);
        return events.some((event: ProcessedEventsData) => event.event.isBlock && (event.event.isAllDay ||
            DateService.isFullDayEvent(event.startDate, event.endDate))
        );
    }, [eventsByDate]);

    /**
     * Utility function to sort events by start time
     *
     * @param {EventModel[]} events - The events to sort
     * @returns {EventModel[]} Sorted events
     */
    const sortEventsByTime: (events: EventModel[]) => EventModel[] = (events: EventModel[]): EventModel[] => {
        return events.sort((a: EventModel, b: EventModel): number => {
            return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
        });
    };

    return {
        getVisibleEvents,
        getAlldayBlockEvent,
        getHiddenEventCount,
        getAllEventsForDate,
        hasMoreIndicator,
        hasBlockIndicator,
        hasAllDayBlock,
        calculatedRowHeight,
        sortEventsByTime
    };
};

export default useMonthEvents;
