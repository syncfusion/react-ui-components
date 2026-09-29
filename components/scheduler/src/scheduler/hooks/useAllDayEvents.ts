import { useMemo, useCallback } from 'react';
import { EventModel } from '../types/scheduler-types';
import { ProcessedEventsData, CellData } from '../types/internal-interface';
import { EventService, ALL_DAY_EVENT_HEIGHT, EVENTS_GAP } from '../services/EventService';
import { ResourceLevel } from '../services/ResourceGroupingService';
import { DateService } from '../services/DateService';
import { PositioningService } from '../services/PositioningService';
import { useSchedulerPropsContext } from '../context/scheduler-context';
import { useSchedulerRenderDatesContext } from '../context/scheduler-render-dates-context';
import { useSchedulerEventsContext } from '../context/scheduler-events-context';
import { useResourceGroupingContext } from '../context/resource-grouping-context';
import { MAX_EVENTS_STACK_ALLDAY } from '../utils/default-props';

type ResourceEventsByDate = Map<number, Map<string, ProcessedEventsData[]>>;

/**
 * Custom hook to process all-day events and provide related functionalities
 *
 * @param {boolean} isCollapsed - Whether the all-day row is collapsed
 * @param {number} maxEventsStack - Maximum number of events to display per cell
 * @returns {AllDayEventsResult} Processed events data and related functions
 *
 * @private
 */
interface AllDayEventsResult {
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
     * Get visible events for a specific date and optional resource leaf
     * When resource leaf is provided, filters events by that resource
     *
     * @param {string} dateKey - The date key
     * @param {CellData|ResourceLevel} [resourceLeaf] - The resource leaf object (optional, for resource grouping)
     * @returns {ProcessedEventsData[]} Array of visible events
     */
    getVisibleEvents: (dateKey: string, resourceLeaf?: CellData | ResourceLevel) => ProcessedEventsData[];

    /**
     * Get hidden event count for a specific date and optional resource leaf
     * When resource leaf is provided, counts only events for that resource
     *
     * @param {string} dateKey - The date key
     * @param {CellData|ResourceLevel} [resourceLeaf] - The resource leaf object (optional, for resource grouping)
     * @returns {number} Count of hidden events
     */
    getHiddenEventCount: (dateKey: string, resourceLeaf?: CellData | ResourceLevel) => number;
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
 * @param {number} maxEventsStack - Maximum number of events to display per cell
 * @returns {AllDayEventsResult} Processed events data and related functions
 * @private
 */
export const useAllDayEvents: (
    isCollapsed: boolean,
    maxEventsStack?: number
) => AllDayEventsResult = (
    isCollapsed: boolean,
    maxEventsStack: number = MAX_EVENTS_STACK_ALLDAY
): AllDayEventsResult => {

    const { eventSettings, resources } = useSchedulerPropsContext();
    const { renderDates } = useSchedulerRenderDatesContext();
    const { eventsData } = useSchedulerEventsContext();
    const { leafResources, isGroupingEnabled, groupConfig } = useResourceGroupingContext();
    const isAllDayPlacement: boolean = eventSettings.spannedEventPlacement === 'AllDayRow';
    const eligibleEvents: EventModel[] = useMemo((): EventModel[] => {
        if (!renderDates?.length || !eventsData?.length) {
            return [];
        }

        return EventService.filterEventsByDateRange(eventsData, renderDates).filter((event: EventModel): boolean => {
            if (!event.startTime || !event.endTime || event.isBlock) {
                return false;
            }
            if (event.isAllDay) {
                return true;
            }
            return isAllDayPlacement && !DateService.isLessthan24Hours(event.startTime, event.endTime) &&
                EventService.isMultiDayEvent(event);
        });
    }, [eventsData, renderDates, isAllDayPlacement]);

    const processAllDayCollection: (
        sourceEvents: EventModel[],
        groupIndex?: number
    ) => ProcessedEventsData[] = useCallback((
        sourceEvents: EventModel[],
        groupIndex?: number
    ): ProcessedEventsData[] => {
        if (!sourceEvents?.length || !renderDates?.length) {
            return [];
        }
        const { sharedPositionMap } = PositioningService.initializePositionMaps(renderDates, false);
        const positionMap: Map<string, boolean[]> = sharedPositionMap;
        const processedEvents: ProcessedEventsData[] = [];
        const sortedEventsByTime: EventModel[] = DateService.sortByTimeAndSpan(sourceEvents);

        sortedEventsByTime.forEach((event: EventModel): void => {
            if (!event.startTime || !event.endTime) {
                return;
            }

            const startDate: Date = DateService.normalizeDate(event.startTime);
            const endDate: Date = DateService.normalizeDate(event.endTime);
            const isMultiDay: boolean = EventService.isMultiDayEvent(event);
            const renderEndDate: Date = (!event.isAllDay && DateService.isMidnight(event.endTime)) ?
                DateService.addDays(endDate, -1) : endDate;
            const totalSegments: number = isMultiDay ? DateService.getDaysCount(event.startTime, event.endTime, event.isAllDay) : 1;

            const positionIndex: number = findNonConflictingPosition(
                renderDates, startDate, renderEndDate, positionMap
            );

            const eventClasses: string[] = ['sf-appointment'];

            if (event.isAllDay || totalSegments > 1) {
                eventClasses.push('sf-all-day-appointment');
            }

            if (event.isReadonly) {
                eventClasses.push('sf-read-only');
            }

            if (isMultiDay) {
                const firstVisibleSegmentIndex: number = renderDates.findIndex((renderDate: Date): boolean => {
                    const normalizedRenderDate: Date = DateService.normalizeDate(renderDate);
                    return normalizedRenderDate >= startDate && normalizedRenderDate <= renderEndDate;
                });

                for (const date of renderDates) {
                    const currentDate: Date = DateService.normalizeDate(date);

                    if (currentDate < startDate || currentDate > renderEndDate) {
                        continue;
                    }

                    PositioningService.setIndexPosition(positionMap, date, positionIndex);

                    const isFirstDay: boolean = currentDate.getTime() === startDate.getTime();
                    const isLastDay: boolean = currentDate.getTime() === renderEndDate.getTime();
                    const segmentIndex: number = Math.floor(
                        (currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
                    );
                    const currentRenderIndex: number = renderDates.findIndex((renderDate: Date): boolean =>
                        DateService.normalizeDate(renderDate).getTime() === currentDate.getTime()
                    );
                    const isFirstSegmentInRenderRange: boolean = firstVisibleSegmentIndex === currentRenderIndex;

                    const segmentStartTime: Date = isFirstDay ?
                        new Date(event.startTime.getTime()) :
                        new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 0, 0, 0);

                    const segmentEndTime: Date = isLastDay ?
                        new Date(event.endTime.getTime()) :
                        new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 0, 0, 0);

                    const eventKey: string = typeof groupIndex === 'number' ?
                        `${date.toISOString()}-${event.id}-${groupIndex}` : `${date.toISOString()}-${event.id}`;

                    processedEvents.push({
                        event: event,
                        startDate: segmentStartTime,
                        endDate: segmentEndTime,
                        isFirstDay: isFirstDay,
                        isLastDay: isLastDay,
                        isFirstSegmentInRenderRange: isFirstSegmentInRenderRange,
                        segmentIndex: segmentIndex,
                        totalSegments: groupConfig?.byDate ? 1 : totalSegments,
                        positionIndex: positionIndex,
                        eventClasses,
                        eventKey,
                        groupIndex
                    });
                }
            } else {
                PositioningService.setIndexPosition(positionMap, startDate, positionIndex);
                const eventKey: string = typeof groupIndex === 'number' ?
                    `${startDate.toISOString()}-${event.id}-${groupIndex}` : `${startDate.toISOString()}-${event.id}`;

                processedEvents.push({
                    event: event,
                    startDate: event.startTime,
                    endDate: event.endTime,
                    positionIndex: positionIndex,
                    eventClasses,
                    eventKey,
                    groupIndex
                });
            }
        });

        return processedEvents.sort((a: ProcessedEventsData, b: ProcessedEventsData): number => {
            const aIndex: number = a.positionIndex ?? 0;
            const bIndex: number = b.positionIndex ?? 0;
            return aIndex - bIndex;
        });
    }, [renderDates, groupConfig?.byDate]);

    const eventsByResource: ResourceEventsByDate = useMemo((): ResourceEventsByDate => {
        const result: ResourceEventsByDate = new Map();

        if (!isGroupingEnabled || !leafResources?.length || !renderDates?.length) {
            return result;
        }

        leafResources.forEach((resourceLeaf: ResourceLevel): void => {
            if (typeof resourceLeaf.groupIndex !== 'number') {
                return;
            }
            const resourceEvents: EventModel[] = eligibleEvents.filter((event: EventModel): boolean =>
                EventService.matchesResource(event, resourceLeaf, resources)
            );
            const processedResourceEvents: ProcessedEventsData[] = processAllDayCollection(
                resourceEvents, resourceLeaf.groupIndex
            );
            result.set(
                resourceLeaf.groupIndex,
                EventService.getEventsMap(renderDates, processedResourceEvents)
            );
        });

        return result;
    }, [isGroupingEnabled, leafResources, renderDates, eligibleEvents, resources, processAllDayCollection]);

    // Group events by date
    const eventsByDate: Map<string, ProcessedEventsData[]> = useMemo((): Map<string, ProcessedEventsData[]> => {
        if (isGroupingEnabled) {
            return new Map<string, ProcessedEventsData[]>();
        }
        const processed: ProcessedEventsData[] = processAllDayCollection(eligibleEvents);
        return EventService.getEventsMap(renderDates, processed);
    }, [isGroupingEnabled, renderDates, eligibleEvents, processAllDayCollection]);

    const getResourceScopedEvents: (
        dateKey: string,
        resourceLeaf?: CellData | ResourceLevel
    ) => ProcessedEventsData[] = useCallback((
        dateKey: string,
        resourceLeaf?: CellData | ResourceLevel
    ): ProcessedEventsData[] => {
        if (!isGroupingEnabled) {
            return eventsByDate.get(dateKey) || [];
        }
        if (!resourceLeaf || typeof resourceLeaf.groupIndex !== 'number') {
            return [];
        }
        return eventsByResource.get(resourceLeaf.groupIndex)?.get(dateKey) || [];
    }, [isGroupingEnabled, eventsByDate, eventsByResource]);

    const maxEventsInAnyColumn: number = useMemo((): number => {
        if (!isGroupingEnabled) {
            return EventService.getMaxEventsInCell(eventsByDate, renderDates);
        }
        let maxPerResource: number = 0;

        eventsByResource.forEach((dateMap: Map<string, ProcessedEventsData[]>): void => {
            dateMap.forEach((dateEvents: ProcessedEventsData[]): void => {
                const eventCount: number = dateEvents.filter(
                    (eventData: ProcessedEventsData): boolean => !eventData.event.isBlock
                ).length;
                maxPerResource = Math.max(maxPerResource, eventCount);
            });
        });
        return maxPerResource;
    }, [isGroupingEnabled, eventsByDate, renderDates, eventsByResource]);

    const hasEventsExceedingMaxCount: boolean = useMemo((): boolean => {
        if (isGroupingEnabled) {
            return maxEventsInAnyColumn > maxEventsStack;
        }
        return EventService.isAlldayHasMoreEvents(renderDates, eventsByDate, maxEventsStack);
    }, [eventsByDate, maxEventsStack, renderDates, isGroupingEnabled, maxEventsInAnyColumn]);

    // Calculate the limit for visible events based on collapsed state
    const visibleEventLimit: number = useMemo((): number => {
        if (!isCollapsed) {
            return Infinity;
        }
        if (maxEventsInAnyColumn > maxEventsStack) {
            return maxEventsStack - 1;
        }
        return maxEventsStack;
    }, [isCollapsed, maxEventsInAnyColumn, maxEventsStack]);

    // Calculate height based on events and collapsed state
    const calculateHeight: () => number = useCallback((): number => {
        if (maxEventsInAnyColumn > 3 && !isCollapsed) {
            return maxEventsInAnyColumn * (ALL_DAY_EVENT_HEIGHT + EVENTS_GAP);
        } else {
            return Math.min(3, maxEventsInAnyColumn) * (ALL_DAY_EVENT_HEIGHT + EVENTS_GAP);
        }
    }, [isCollapsed, maxEventsInAnyColumn]);

    const getVisibleEvents: (dateKey: string, resourceLeaf?: CellData | ResourceLevel) => ProcessedEventsData[] = useCallback(
        (dateKey: string, resourceLeaf?: CellData | ResourceLevel): ProcessedEventsData[] => {
            let filteredEvents: ProcessedEventsData[] = getResourceScopedEvents(dateKey, resourceLeaf);
            const groupOrder: (string | number)[] | undefined = resourceLeaf?.groupOrder;

            filteredEvents = filteredEvents.map((eventData: ProcessedEventsData): ProcessedEventsData => {
                const resourceColor: string | undefined = EventService.getResourceColor(
                    eventData.event, resources, eventSettings?.resourceColorField, groupOrder
                );
                return resourceColor ? { ...eventData, eventStyle: { backgroundColor: resourceColor } } : eventData;
            });

            const sortedEvents: ProcessedEventsData[] = [...filteredEvents].sort(
                (a: ProcessedEventsData, b: ProcessedEventsData): number => (a.positionIndex ?? 0) - (b.positionIndex ?? 0)
            );
            return sortedEvents.slice(0, visibleEventLimit);
        },
        [getResourceScopedEvents, visibleEventLimit, resources, eventSettings?.resourceColorField]
    );

    const getHiddenEventCount: (dateKey: string, resourceLeaf?: CellData | ResourceLevel) => number = useCallback(
        (dateKey: string, resourceLeaf?: CellData | ResourceLevel): number => {
            const scopedEvents: ProcessedEventsData[] = getResourceScopedEvents(dateKey, resourceLeaf);
            return Math.max(0, scopedEvents.length - visibleEventLimit);
        },
        [getResourceScopedEvents, visibleEventLimit]
    );

    return {
        eventsByDate,
        hasEventsExceedingMaxCount,
        maxEventsInAnyColumn,
        visibleEventLimit,
        calculateHeight,
        getVisibleEvents,
        getHiddenEventCount
    };
};
