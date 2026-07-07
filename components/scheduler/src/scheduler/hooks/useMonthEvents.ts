import { useMemo, useCallback } from 'react';
import { EventModel } from '../types/scheduler-types';
import { ProcessedEventsData } from '../types/internal-interface';
import { DateService } from '../services/DateService';
import { EventService } from '../services/EventService';
import { useSchedulerPropsContext } from '../context/scheduler-context';
import { useSchedulerEventsContext } from '../context/scheduler-events-context';
import { CSS_CLASSES } from '../common/constants';
import { ResourceLevel } from '../services/ResourceGroupingService';
import { useResourceGroupingContext } from '../context/resource-grouping-context';

const EVENT_HEIGHT: number = 24; // Height of each event in pixels
const BASE_ROW_HEIGHT: number = 124; // Base row height
const EVENT_GAP: number = 4;

/**
 * Interface for the result of useMonthEvents hook
 *
 * @private
 */
export interface UseMonthEventsResult {

    /**
     * Get visible events for a specific date, optionally filtered by resource
     */
    getVisibleEvents: (dateKey: string, resourceLeaf?: ResourceLevel) => ProcessedEventsData[];

    getAlldayBlockEvent: (dateKey: string, resourceLeaf?: ResourceLevel) => ProcessedEventsData;

    /**
     * Get hidden event count for a specific date, optionally filtered by resource
     */
    getHiddenEventCount: (dateKey: string, resourceLeaf?: ResourceLevel) => number;

    /**
     * Get all events for a specific date (visible and hidden), optionally filtered by resource
     */
    getAllEventsForDate: (dateKey: string, resourceLeaf?: ResourceLevel) => ProcessedEventsData[];

    /**
     * Check if a date has more events than can be displayed, optionally filtered by resource
     */
    hasMoreIndicator: (dateKey: string, resourceLeaf?: ResourceLevel) => boolean;

    /**
     * Check if a date has a block indicator (isBlock: true, isAllDay: false), optionally filtered by resource
     */
    hasBlockIndicator: (dateKey: string, resourceLeaf?: ResourceLevel) => boolean;

    /**
     * Check if a date has an all-day block event (isBlock: true, isAllDay: true), optionally filtered by resource
     */
    hasAllDayBlock: (dateKey: string, resourceLeaf?: ResourceLevel) => boolean;

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
 * @private
 */
export const useMonthEvents: (
    renderDates: Date[],
    maxEventsPerRow: number
) => UseMonthEventsResult = (
    renderDates: Date[],
    maxEventsPerRow: number
): UseMonthEventsResult => {
    const { height, rowAutoHeight, numberOfWeeks, eventSettings, schedulerRef, resources } = useSchedulerPropsContext();
    const { eventsData } = useSchedulerEventsContext();
    const { isGroupingEnabled } = useResourceGroupingContext();

    /**
     * Process all events and prepare them for display in the month view
     */
    const processedEvents: ProcessedEventsData[] = useMemo(() => {
        return EventService.processDayEvents(renderDates, eventsData, resources, isGroupingEnabled, eventSettings?.resourceColorField);
    }, [eventsData, renderDates, resources]);

    /**
     * Helper function to filter events by resource when resource grouping is enabled
     *
     * @param {ProcessedEventsData[]} events - The events to filter
     * @param {ResourceLevel} leafResource - The leaf-level resource to filter by
     * @returns {ProcessedEventsData[]} Filtered events if leafResource is provided, otherwise original events
     */
    const filterEventsByResource: (events: ProcessedEventsData[], leafResource?: ResourceLevel) => ProcessedEventsData[] =
        (events: ProcessedEventsData[], leafResource?: ResourceLevel): ProcessedEventsData[] => {
            if (!leafResource || !events) {
                return events;
            }
            return events.filter((eventData: ProcessedEventsData) =>
                EventService.matchesResource(eventData.event, leafResource, resources)
            );
        };

    // Group events by date
    const eventsByDate: Map<string, ProcessedEventsData[]> = useMemo((): Map<string, ProcessedEventsData[]> => {
        return EventService.getEventsMap(renderDates, processedEvents);
    }, [renderDates, processedEvents]);

    /**
     * Calculate the height for a specific row
     */
    const calculatedRowHeight: string = useMemo(() => {
        const maxEventsInRow: number = EventService.getMaxEventsInCell(eventsByDate, renderDates);
        const eventHeight: number = (schedulerRef?.current?.element?.querySelector('.' + CSS_CLASSES.MONTH_VIEW + ' ' + '.' + CSS_CLASSES.APPOINTMENT) as HTMLElement)?.offsetHeight ?? EVENT_HEIGHT;
        const dateHeaderHeight: number = (schedulerRef?.current?.element?.querySelector('.' + CSS_CLASSES.MONTH_VIEW + ' ' + '.' + CSS_CLASSES.DATE_HEADER) as HTMLElement)?.offsetHeight ?? 0;
        let rowHeight: number = (schedulerRef?.current?.element?.querySelector('.' + CSS_CLASSES.MONTH_VIEW + ' ' + '.' + CSS_CLASSES.WORK_CELLS_ROW) as HTMLElement)?.offsetHeight ?? BASE_ROW_HEIGHT;

        const eventsHeight: (maxEventsInRow: number) => number = (maxEventsInRow: number) =>
            maxEventsInRow * eventHeight + ((maxEventsInRow > 0 ? maxEventsInRow - 1 : 0) * EVENT_GAP);

        const getCalculatedRowHeight: () => number = (): number => {
            const toolbarHeight: number = (schedulerRef?.current?.element?.querySelector('.' + CSS_CLASSES.SCHEDULER_TOOLBAR_CONTAINER) as HTMLElement)?.offsetHeight ?? 0;
            const headerRow: number = (schedulerRef?.current?.element?.querySelector('.' + CSS_CLASSES.MONTH_VIEW + ' ' + '.' + CSS_CLASSES.HEADER_ROW) as HTMLElement)?.offsetHeight ?? 0;
            const totalHeight: number = schedulerRef?.current?.element?.offsetHeight ?? parseInt(height, 10);
            const available: number = totalHeight - toolbarHeight - headerRow;
            return parseInt(Math.abs(available / numberOfWeeks).toFixed(2), 10);
        };

        if (rowAutoHeight) {
            const contentHeight: number = eventsHeight(maxEventsInRow) + dateHeaderHeight +
                (rowAutoHeight && eventSettings?.ignoreWhitespace ? 0 : EVENT_HEIGHT);

            if (height !== 'auto' && numberOfWeeks) {
                rowHeight = getCalculatedRowHeight();
            }
            return `${Math.max(contentHeight, rowHeight)}px`;
        }

        if (numberOfWeeks && height !== 'auto' && maxEventsPerRow >= 3) {
            const calculatedRowHeight: number = getCalculatedRowHeight();
            const contentHeightForMaxEvents: number = eventsHeight(maxEventsPerRow) + dateHeaderHeight +
                eventHeight + EVENT_GAP;
            return `${Math.max(contentHeightForMaxEvents, calculatedRowHeight)}px`;
        }

        if (maxEventsInRow >= 3) {
            const eventsToDisplay: number = Math.min(maxEventsInRow, maxEventsPerRow);
            const contentHeight: number = eventsHeight(eventsToDisplay) + dateHeaderHeight +
                (maxEventsInRow > maxEventsPerRow ? eventHeight : 0) + EVENT_GAP;
            return `${Math.max(contentHeight, rowHeight)}px`;
        }

        return `${rowHeight}px`;
    }, [renderDates, eventsByDate, rowAutoHeight, numberOfWeeks, height, eventSettings?.ignoreWhitespace, maxEventsPerRow, schedulerRef]);

    /**
     * Gets visible events for a specific date
     *
     * @param {string} dateKey - The date key
     * @param {ResourceLevel} resourceLeaf - Optional leaf-level resource for filtering
     * @returns {ProcessedEventsData[]} Array of visible events
     */
    const getVisibleEvents: (dateKey: string, resourceLeaf?: ResourceLevel) => ProcessedEventsData[] =
        useCallback((dateKey: string, resourceLeaf?: ResourceLevel): ProcessedEventsData[] => {
            const sortedEvents: ProcessedEventsData[] = getAllEventsForDate(dateKey, resourceLeaf);

            return rowAutoHeight ? sortedEvents : sortedEvents.slice(0, maxEventsPerRow);
        }, [eventsByDate, maxEventsPerRow, rowAutoHeight]);

    /**
     * Gets all day blocked events for a specific date
     *
     * @param {string} dateKey - The date key
     * @param {ResourceLevel} resourceLeaf - Optional leaf-level resource for filtering
     * @returns {ProcessedEventsData} All-day block event if found
     */
    const getAlldayBlockEvent: (dateKey: string, resourceLeaf?: ResourceLevel) => ProcessedEventsData =
        useCallback((dateKey: string, resourceLeaf?: ResourceLevel): ProcessedEventsData => {
            const events: ProcessedEventsData[] = eventsByDate.get(dateKey);
            const filteredEvents: ProcessedEventsData[] = resourceLeaf ? filterEventsByResource(events, resourceLeaf) : events;

            const allDayBlockEvent: ProcessedEventsData = filteredEvents.find(
                (event: ProcessedEventsData) => event.event.isBlock &&
                    (event.event.isAllDay || DateService.isFullDayEvent(event.startDate, event.endDate))
            );
            return allDayBlockEvent;
        }, [eventsByDate]);

    /**
     * Gets all events for a specific date (visible and hidden)
     *
     * @param {string} dateKey - The date key
     * @param {ResourceLevel} resourceLeaf - Optional leaf-level resource for filtering
     * @returns {ProcessedEventsData[]} Array of all events for the date
     */
    const getAllEventsForDate: (dateKey: string, resourceLeaf?: ResourceLevel) => ProcessedEventsData[] =
        useCallback((dateKey: string, resourceLeaf?: ResourceLevel): ProcessedEventsData[] => {
            const events: ProcessedEventsData[] = eventsByDate.get(dateKey)?.filter(
                (eventInfo: ProcessedEventsData) => !eventInfo.event.isBlock
            );

            const filteredEvents: ProcessedEventsData[] = resourceLeaf ? filterEventsByResource(events, resourceLeaf) : events;

            const sortedEvents: ProcessedEventsData[] = [...filteredEvents].sort((a: ProcessedEventsData, b: ProcessedEventsData) =>
                (a.positionIndex || 0) - (b.positionIndex || 0)
            );
            return sortedEvents;
        }, [eventsByDate]);

    /**
     * Gets the count of hidden events for a specific date
     *
     * @param {string} dateKey - The date key
     * @param {ResourceLevel} resourceLeaf - Optional leaf-level resource for filtering
     * @returns {number} Number of hidden events
     */
    const getHiddenEventCount: (dateKey: string, resourceLeaf?: ResourceLevel) => number =
        useCallback((dateKey: string, resourceLeaf?: ResourceLevel): number => {
            if (getAlldayBlockEvent(dateKey, resourceLeaf)) {
                return 0;
            }
            const events: ProcessedEventsData[] = eventsByDate.get(dateKey)?.filter(
                (eventInfo: ProcessedEventsData) => !eventInfo.event.isBlock
            );
            const filteredEvents: ProcessedEventsData[] = resourceLeaf ? filterEventsByResource(events, resourceLeaf) : events;
            return Math.max(0, filteredEvents.length - maxEventsPerRow);
        }, [eventsByDate, maxEventsPerRow]);

    /**
     * Checks if a date has more events than can be displayed
     *
     * @param {string} dateKey - The date key
     * @param {ResourceLevel} resourceLeaf - Optional leaf-level resource for filtering
     * @returns {boolean} True if date has more events than maxEventsPerRow
     */
    const hasMoreIndicator: (dateKey: string, resourceLeaf?: ResourceLevel) => boolean =
        useCallback((dateKey: string, resourceLeaf?: ResourceLevel): boolean => {
            return getHiddenEventCount(dateKey, resourceLeaf) > 0;
        }, [getHiddenEventCount]);

    /**
     * Checks if a date has a block indicator
     *
     * @param {string} dateKey - The date key
     * @param {ResourceLevel} resourceLeaf - Optional leaf-level resource for filtering
     * @returns {boolean} True if date has block indicator
     */
    const hasBlockIndicator: (dateKey: string, resourceLeaf?: ResourceLevel) => boolean =
        useCallback((dateKey: string, resourceLeaf?: ResourceLevel): boolean => {
            const events: ProcessedEventsData[] = eventsByDate.get(dateKey);
            const filteredEvents: ProcessedEventsData[] = resourceLeaf ? filterEventsByResource(events, resourceLeaf) : events;
            return filteredEvents.some((event: ProcessedEventsData) => event.event.isBlock && !event.event.isAllDay &&
                !DateService.isFullDayEvent(event.startDate, event.endDate)
            );
        }, [eventsByDate]);

    /**
     * Checks if a date has an all-day block event (isBlock: true, isAllDay: true)
     *
     * @param {string} dateKey - The date key
     * @param {ResourceLevel} resourceLeaf - Optional leaf-level resource for filtering
     * @returns {boolean} True if date has all-day block event
     */
    const hasAllDayBlock: (dateKey: string, resourceLeaf?: ResourceLevel) => boolean =
        useCallback((dateKey: string, resourceLeaf?: ResourceLevel): boolean => {
            const events: ProcessedEventsData[] = eventsByDate.get(dateKey);
            const filteredEvents: ProcessedEventsData[] = resourceLeaf ? filterEventsByResource(events, resourceLeaf) : events;
            return filteredEvents.some((event: ProcessedEventsData) => event.event.isBlock && (event.event.isAllDay ||
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
