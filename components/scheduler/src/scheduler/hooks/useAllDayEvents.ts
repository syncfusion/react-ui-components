import { useMemo, useCallback } from 'react';
import { EventModel } from '../types/scheduler-types';
import { ProcessedEventsData } from '../types/internal-interface';
import { EventService, ALL_DAY_EVENT_HEIGHT, EVENTS_GAP } from '../services/EventService';
import { DateService } from '../services/DateService';
import { PositioningService } from '../services/PositioningService';
import { useSchedulerPropsContext } from '../context/scheduler-context';
import { useSchedulerRenderDatesContext } from '../context/scheduler-render-dates-context';
import { useSchedulerEventsContext } from '../context/scheduler-events-context';

/**
 * Custom hook to process all-day events and provide related functionalities
 *
 * @param {boolean} isCollapsed - Whether the all-day row is collapsed
 * @param {number} maxEventsPerRow - Maximum number of events to display per cell
 * @returns {AllDayEventsResult} Processed events data and related functions
 *
 * @private
 */
interface AllDayEventsResult {
    /**
     * The processed all-day events
     */
    allDayRowEvents: ProcessedEventsData[];

    /**
     * Events mapped by date
     */
    eventsByDate: Map<string, ProcessedEventsData[]>;

    /**
     * Whether there are events that exceed the max count
     */
    hasEventsExceedingMaxCount: boolean;

    /**
     * Maximum number of events in any column
     */
    maxEventsInAnyColumn: number;

    /**
     * The visible event limit based on collapsed state
     */
    visibleEventLimit: number;

    /**
     * Calculates the height of the all-day row
     *
     * @returns {number} The calculated height
     */
    calculateHeight: () => number;

    /**
     * Get visible events for a specific date
     *
     * @param {string} dateKey - The date key
     * @returns {ProcessedEventsData[]} Array of visible events
     */
    getVisibleEvents: (dateKey: string) => ProcessedEventsData[];

    /**
     * Get hidden event count for a specific date
     *
     * @param {string} dateKey - The date key
     * @returns {number} Count of hidden events
     */
    getHiddenEventCount: (dateKey: string) => number;

}

/**
 * Finds a non-conflicting position for an event
 *
 * @param {Date[]} renderDates - The dates being rendered
 * @param {Date} startDate - The start date of the event
 * @param {Date} endDate - The end date of the event
 * @param {Map<string, boolean[]>} occupiedPositions - Map of occupied positions
 * @returns {number} A non-conflicting position index
 */
const findNonConflictingPosition: (
    renderDates: Date[],
    startDate: Date,
    endDate: Date,
    occupiedPositions: Map<string, boolean[]>
) => number = (
    renderDates: Date[],
    startDate: Date,
    endDate: Date,
    occupiedPositions: Map<string, boolean[]>
): number => {
    let positionIndex: number = 0;
    let foundPosition: boolean = false;

    while (!foundPosition) {
        foundPosition = true;

        for (const date of renderDates) {
            const currentDate: Date = DateService.normalizeDate(date);
            if (currentDate >= startDate && currentDate <= endDate) {
                const dateKey: string = DateService.generateDateKey(date);
                const positions: boolean[] = occupiedPositions.get(dateKey) || [];
                const isOccupied: boolean  = positions.findIndex(
                    (occupied: boolean, idx: number) => idx === positionIndex && occupied) !== -1;
                if (isOccupied) {
                    foundPosition = false;
                    positionIndex++;
                    break;
                }
            }
        }
    }

    return positionIndex;
};

/**
 * Process all-day events and provide related functionalities
 *
 * @param {boolean} isCollapsed - Whether the all-day row is collapsed
 * @param {number} maxEventsPerRow - Maximum number of events to display per cell
 * @returns {AllDayEventsResult} Processed events data and related functions
 * @private
 */
export const useAllDayEvents: (
    isCollapsed: boolean,
    maxEventsPerRow?: number
) => AllDayEventsResult = (
    isCollapsed: boolean,
    maxEventsPerRow: number = 2
): AllDayEventsResult => {

    const { eventSettings } = useSchedulerPropsContext();
    const { renderDates } = useSchedulerRenderDatesContext();
    const { eventsData } = useSchedulerEventsContext();

    // Process all-day events - exported so that it can be used directly from the component if needed
    const allDayRowEvents: ProcessedEventsData[] = useMemo((): ProcessedEventsData[] => {
        if (!renderDates?.length || !eventsData?.length) {
            return [];
        }

        // Get all-day events (single day)
        const allDayOnlyEvents: EventModel[] = eventsData.filter((event: EventModel) => {
            if (!event.startTime || !event.endTime || event.isBlock) {
                return false;
            }
            return event.isAllDay && !EventService.isMultiDayEvent(event);
        });

        // Get multi-day events based on spanned event placement
        const multiDayEvents: EventModel[] = eventsData.filter((event: EventModel) => {
            if (!event.startTime || !event.endTime) {
                return false;
            }

            if (eventSettings.spannedEventPlacement === 'AllDayRow') {
                if (!event.isAllDay && DateService.isLessthan24Hours(event.startTime, event.endTime)) {
                    return false;
                }
                return EventService.isMultiDayEvent(event);
            } else {
                return event.isAllDay && EventService.isMultiDayEvent(event);
            }
        });

        // Create position map for all render dates
        let sharedPositionMap: Map<string, boolean[]> = new Map<string, boolean[]>();
        renderDates.forEach((date: Date) => {
            const dateKey: string = DateService.generateDateKey(date);
            sharedPositionMap.set(dateKey, []);
        });

        const processedEvents: ProcessedEventsData[] = [];
        const allEventsTogether: EventModel[] = [...allDayOnlyEvents, ...multiDayEvents];
        const sortedEventsByTime: EventModel[] = DateService.sortByTimeAndSpan(allEventsTogether);

        sortedEventsByTime.forEach((event: EventModel) => {
            if (!event.startTime || !event.endTime) {
                return;
            }

            const startDate: Date = DateService.normalizeDate(event.startTime);
            const endDate: Date = DateService.normalizeDate(event.endTime);
            const isMultiDay: boolean = EventService.isMultiDayEvent(event);
            const totalSegments: number = isMultiDay ? DateService.getDaysCount(startDate, endDate) + 1 : 1;

            // Find a non-conflicting position for the event
            const positionIndex: number = findNonConflictingPosition(
                renderDates, startDate, endDate, sharedPositionMap
            );

            const eventClasses: string[] = ['sf-appointment'];

            if (event.isAllDay || totalSegments > 1) {
                eventClasses.push('sf-all-day-appointment');
            }

            if (event.isReadonly) {
                eventClasses.push('sf-read-only');
            }

            if (isMultiDay) {
                // Process multi-day events as segments
                for (const date of renderDates) {
                    const currentDate: Date = DateService.normalizeDate(date);

                    if (currentDate >= startDate && currentDate <= endDate) {
                        sharedPositionMap = PositioningService.setIndexPosition(sharedPositionMap, date, positionIndex);

                        const isFirstDay: boolean = currentDate.getTime() === startDate.getTime();
                        const isLastDay: boolean = currentDate.getTime() === endDate.getTime();
                        const segmentIndex: number = Math.floor(
                            (currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
                        );

                        const isFirstSegmentInRenderRange: boolean = renderDates.findIndex((renderDate: Date) => {
                            const normalizedRenderDate: Date = DateService.normalizeDate(renderDate);
                            return normalizedRenderDate >= startDate && normalizedRenderDate <= endDate;
                        }) === renderDates.findIndex((renderDate: Date) => {
                            const normalizedRenderDate: Date = DateService.normalizeDate(renderDate);
                            return normalizedRenderDate.getTime() === currentDate.getTime();
                        });

                        // Calculate segment start and end times
                        const segmentStartTime: Date = isFirstDay ?
                            new Date(event.startTime.getTime()) :
                            new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 0, 0, 0);

                        const segmentEndTime: Date = isLastDay ?
                            new Date(event.endTime.getTime()) :
                            new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 0, 0, 0);

                        const eventKey: string = `${date.toISOString()}-${event.id}`;

                        processedEvents.push({
                            event: event,
                            startDate: segmentStartTime,
                            endDate: segmentEndTime,
                            isFirstDay: isFirstDay,
                            isLastDay: isLastDay,
                            isFirstSegmentInRenderRange: isFirstSegmentInRenderRange,
                            segmentIndex: segmentIndex,
                            totalSegments: totalSegments,
                            positionIndex: positionIndex,
                            eventClasses,
                            eventKey
                        });
                    }
                }
            } else {
                sharedPositionMap = PositioningService.setIndexPosition(sharedPositionMap, startDate, positionIndex);
                const eventKey: string = `${startDate.toISOString()}-${event.id}`;

                processedEvents.push({
                    event: event,
                    startDate: event.startTime,
                    endDate: event.endTime,
                    positionIndex: positionIndex,
                    eventClasses,
                    eventKey
                });
            }
        });

        // Sort by position index
        return processedEvents.sort((a: ProcessedEventsData, b: ProcessedEventsData) => {
            const aIndex: number = a.positionIndex ?? 0;
            const bIndex: number = b.positionIndex ?? 0;
            return aIndex - bIndex;
        });
    }, [eventsData, renderDates, eventSettings.spannedEventPlacement, eventSettings.fields]);

    // Group events by date
    const eventsByDate: Map<string, ProcessedEventsData[]> = useMemo((): Map<string, ProcessedEventsData[]> => {
        return EventService.getEventsMap(renderDates, allDayRowEvents);
    }, [renderDates, allDayRowEvents]);

    // Check if any date has more events than allowed
    const hasEventsExceedingMaxCount: boolean = useMemo((): boolean => {
        return EventService.isAlldayHasMoreEvents(renderDates, eventsByDate, maxEventsPerRow);
    }, [eventsByDate, maxEventsPerRow, renderDates]);

    // Get the maximum number of events in any column
    const maxEventsInAnyColumn: number = useMemo((): number => {
        return EventService.getMaxEventsInCell(eventsByDate, renderDates);
    }, [eventsByDate, renderDates]);

    // Calculate the limit for visible events based on collapsed state
    const visibleEventLimit: number = useMemo((): number => {
        if (!isCollapsed) {
            return Infinity;
        }
        if (maxEventsInAnyColumn > maxEventsPerRow) {
            return maxEventsPerRow - 1;
        }
        return maxEventsPerRow;
    }, [isCollapsed, maxEventsInAnyColumn, maxEventsPerRow]);

    // Calculate height based on events and collapsed state
    const calculateHeight: () => number = useCallback((): number => {
        const maxEventsCount: number = EventService.getMaxEventsInCell(eventsByDate, renderDates);
        if (maxEventsCount > 3 && !isCollapsed) {
            return maxEventsCount * (ALL_DAY_EVENT_HEIGHT + EVENTS_GAP);
        } else {
            return Math.min(3, maxEventsCount) * (ALL_DAY_EVENT_HEIGHT + EVENTS_GAP);
        }
    }, [isCollapsed, eventsByDate, renderDates]);

    const getVisibleEvents: (dateKey: string) => ProcessedEventsData[] = useCallback((dateKey: string): ProcessedEventsData[] => {
        const dateEvents: ProcessedEventsData[] = eventsByDate.get(dateKey) || [];
        const sortedEvents: ProcessedEventsData[] = [...dateEvents].sort(
            (a: ProcessedEventsData, b: ProcessedEventsData) => (a.positionIndex ?? 0) - (b.positionIndex ?? 0)
        );
        return sortedEvents.slice(0, visibleEventLimit);
    }, [eventsByDate, visibleEventLimit]);

    const getHiddenEventCount: (dateKey: string) => number = useCallback((dateKey: string): number => {
        const dateEvents: ProcessedEventsData[] = eventsByDate.get(dateKey) || [];
        return Math.max(0, dateEvents.length - visibleEventLimit);
    }, [eventsByDate, visibleEventLimit]);


    return {
        allDayRowEvents,
        eventsByDate,
        hasEventsExceedingMaxCount,
        maxEventsInAnyColumn,
        visibleEventLimit,
        calculateHeight,
        getVisibleEvents,
        getHiddenEventCount
    };
};
