import { useMemo, useCallback } from 'react';
import { EventModel } from '../types/scheduler-types';
import { ProcessedEventsData } from '../types/internal-interface';
import { DateService } from '../services/DateService';
import { EventService, EVENTS_GAP } from '../services/EventService';
import { useSchedulerPropsContext } from '../context/scheduler-context';
import { useSchedulerEventsContext } from '../context/scheduler-events-context';
import { CSS_CLASSES } from '../common/constants';
import { ResourceLevel } from '../services/ResourceGroupingService';
import { isBlockEventIndicator } from '../utils/actions';
import { useResourceGroupingContext } from '../context/resource-grouping-context';

const EVENT_HEIGHT: number = 24; // Height of each event in pixels
const BASE_ROW_HEIGHT: number = 124; // Base row height
type ResourceEventsByDate = Map<number, Map<string, ProcessedEventsData[]>>;

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
 * @param {number} maxEventsStack - Maximum number of events to display per row.
 * @returns {UseMonthEventsResult} - Processed events data and related functions
 * @private
 */
export const useMonthEvents: (
    renderDates: Date[],
    maxEventsStack: number
) => UseMonthEventsResult = (
    renderDates: Date[],
    maxEventsStack: number
): UseMonthEventsResult => {
    const { height, rowAutoHeight, numberOfWeeks, eventSettings, schedulerRef, resources } = useSchedulerPropsContext();
    const { eventsData } = useSchedulerEventsContext();
    const { groupConfig, leafResources, isGroupingEnabled } = useResourceGroupingContext();

    /**
     * Process all events and prepare them for display in the month view
     */
    const processedEvents: ProcessedEventsData[] = useMemo((): ProcessedEventsData[] => {
        if (isGroupingEnabled) {
            return [];
        }
        return EventService.processDayEvents(renderDates, eventsData, resources, groupConfig);
    }, [isGroupingEnabled, renderDates, eventsData, resources, groupConfig]);

    // Group events by date
    const eventsByDate: Map<string, ProcessedEventsData[]> = useMemo((): Map<string, ProcessedEventsData[]> => {
        return EventService.getEventsMap(renderDates, processedEvents);
    }, [renderDates, processedEvents]);

    const eventsByResource: ResourceEventsByDate = useMemo((): ResourceEventsByDate => {
        const result: ResourceEventsByDate = new Map();
        if (!isGroupingEnabled || !renderDates?.length || !leafResources?.length) {
            return result;
        }
        const rangeFilteredEvents: EventModel[] = EventService.filterEventsByDateRange(eventsData, renderDates);
        if (!rangeFilteredEvents.length) {
            return result;
        }

        leafResources.forEach((resourceLeaf: ResourceLevel): void => {
            if (typeof resourceLeaf.groupIndex !== 'number') {
                return;
            }
            const resourceEvents: EventModel[] = rangeFilteredEvents.filter((event: EventModel): boolean =>
                EventService.matchesResource(event, resourceLeaf, resources)
            );
            const processedResourceEvents: ProcessedEventsData[] = EventService.processDayEvents(
                renderDates,
                resourceEvents,
                resources,
                groupConfig,
                resourceLeaf.groupIndex
            );

            result.set(
                resourceLeaf.groupIndex,
                EventService.getEventsMap(renderDates, processedResourceEvents)
            );
        });

        return result;
    }, [isGroupingEnabled, leafResources, renderDates, eventsData, resources, groupConfig]);

    const getResourceScopedEvents: (
        dateKey: string,
        resourceLeaf?: ResourceLevel
    ) => ProcessedEventsData[] = useCallback(
        (
            dateKey: string,
            resourceLeaf?: ResourceLevel
        ): ProcessedEventsData[] => {
            if (!isGroupingEnabled) {
                return eventsByDate.get(dateKey) ?? [];
            }
            if (!resourceLeaf || typeof resourceLeaf.groupIndex !== 'number') {
                return [];
            }
            return eventsByResource.get(resourceLeaf.groupIndex)?.get(dateKey) ?? [];
        },
        [isGroupingEnabled, eventsByDate, eventsByResource]
    );

    /**
     * Calculate the height for a specific row
     */
    const calculatedRowHeight: string = useMemo(() => {
        let maxEventsInRow: number = 0;
        if (isGroupingEnabled) {
            eventsByResource.forEach((resourceDateMap: Map<string, ProcessedEventsData[]>): void => {
                resourceDateMap.forEach((dateEvents: ProcessedEventsData[]): void => {
                    const eventCount: number = dateEvents.filter(
                        (eventInfo: ProcessedEventsData): boolean => !eventInfo.event.isBlock
                    ).length;
                    maxEventsInRow = Math.max(maxEventsInRow, eventCount);
                });
            });
        } else {
            maxEventsInRow = EventService.getMaxEventsInCell(eventsByDate, renderDates);
        }

        const eventHeight: number = (schedulerRef?.current?.element?.querySelector('.' + CSS_CLASSES.MONTH_VIEW + ' ' + '.' + CSS_CLASSES.APPOINTMENT) as HTMLElement)?.offsetHeight ?? EVENT_HEIGHT;
        const dateHeaderHeight: number = (schedulerRef?.current?.element?.querySelector('.' + CSS_CLASSES.MONTH_VIEW + ' ' + '.' + CSS_CLASSES.DATE_HEADER) as HTMLElement)?.offsetHeight ?? 0;
        let rowHeight: number = (schedulerRef?.current?.element?.querySelector('.' + CSS_CLASSES.MONTH_VIEW + ' ' + '.' + CSS_CLASSES.WORK_CELLS_ROW) as HTMLElement)?.offsetHeight ?? BASE_ROW_HEIGHT;

        const eventsHeight: (maxEventsInRow: number) => number = (maxEventsInRow: number) =>
            maxEventsInRow * eventHeight + ((maxEventsInRow > 0 ? maxEventsInRow - 1 : 0) * EVENTS_GAP);

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

        if (numberOfWeeks && height !== 'auto' && maxEventsStack >= 3) {
            const calculatedRowHeight: number = getCalculatedRowHeight();
            const contentHeightForMaxEvents: number = eventsHeight(maxEventsStack) + dateHeaderHeight +
                eventHeight + EVENTS_GAP;
            return `${Math.max(contentHeightForMaxEvents, calculatedRowHeight)}px`;
        }

        if (maxEventsInRow >= 3) {
            const eventsToDisplay: number = Math.min(maxEventsInRow, maxEventsStack);
            const contentHeight: number = eventsHeight(eventsToDisplay) + dateHeaderHeight +
                (maxEventsInRow > maxEventsStack ? eventHeight : 0) + EVENTS_GAP;
            return `${Math.max(contentHeight, rowHeight)}px`;
        }

        return `${rowHeight}px`;
    }, [renderDates, eventsByDate, rowAutoHeight, numberOfWeeks, height, eventSettings?.ignoreWhitespace, maxEventsStack,
        schedulerRef, isGroupingEnabled, eventsByResource]);

    const getAllEventsForDate: (
        dateKey: string,
        resourceLeaf?: ResourceLevel
    ) => ProcessedEventsData[] = useCallback(
        (
            dateKey: string,
            resourceLeaf?: ResourceLevel
        ): ProcessedEventsData[] => {
            const events: ProcessedEventsData[] = getResourceScopedEvents(dateKey, resourceLeaf).filter(
                (eventInfo: ProcessedEventsData): boolean => !eventInfo.event.isBlock
            );

            return [...events].sort((a: ProcessedEventsData, b: ProcessedEventsData): number =>
                (a.positionIndex ?? 0) - (b.positionIndex ?? 0)
            );
        },
        [getResourceScopedEvents]
    );

    /**
     * Gets visible events for a specific date
     *
     * @param {string} dateKey - The date key
     * @param {ResourceLevel} resourceLeaf - Optional leaf-level resource for filtering
     * @returns {ProcessedEventsData[]} Array of visible events
     */
    const getVisibleEvents: (
        dateKey: string,
        resourceLeaf?: ResourceLevel
    ) => ProcessedEventsData[] = useCallback(
        (
            dateKey: string,
            resourceLeaf?: ResourceLevel
        ): ProcessedEventsData[] => {
            const sortedEvents: ProcessedEventsData[] = getAllEventsForDate(dateKey, resourceLeaf);
            const eventsWithColors: ProcessedEventsData[] = sortedEvents.map(
                (eventData: ProcessedEventsData): ProcessedEventsData => {
                    const resourceColor: string | undefined = EventService.getResourceColor(
                        eventData.event,
                        resources,
                        eventSettings?.resourceColorField,
                        resourceLeaf?.groupOrder
                    );
                    return resourceColor ? { ...eventData, eventStyle: { backgroundColor: resourceColor } } : eventData;
                }
            );
            return rowAutoHeight ? eventsWithColors : eventsWithColors.slice(0, maxEventsStack);
        },
        [getAllEventsForDate, maxEventsStack, rowAutoHeight, resources, eventSettings?.resourceColorField]
    );

    /**
     * Gets all day blocked events for a specific date
     *
     * @param {string} dateKey - The date key
     * @param {ResourceLevel} resourceLeaf - Optional leaf-level resource for filtering
     * @returns {ProcessedEventsData} All-day block event if found
     */
    const getAlldayBlockEvent: (dateKey: string, resourceLeaf?: ResourceLevel) => ProcessedEventsData =
        useCallback((dateKey: string, resourceLeaf?: ResourceLevel): ProcessedEventsData => {
            const filteredEvents: ProcessedEventsData[] = getResourceScopedEvents(dateKey, resourceLeaf);

            const allDayBlockEvent: ProcessedEventsData = filteredEvents.find(
                (event: ProcessedEventsData) => event.event.isBlock &&
                    (event.event.isAllDay || DateService.isFullDayEvent(event.startDate, event.endDate))
            );
            if (!allDayBlockEvent || allDayBlockEvent.event.isAllDay || groupConfig?.byDate) {
                return allDayBlockEvent;
            }
            const dateIndex: number = renderDates.findIndex((date: Date) => DateService.generateDateKey(date) === dateKey);
            if (dateIndex === -1) {
                return allDayBlockEvent;
            }
            const hasFullDaySegment: (date: Date) => boolean = (date: Date): boolean => {
                const filteredSegmentEvents: ProcessedEventsData[] = getResourceScopedEvents(
                    DateService.generateDateKey(date),
                    resourceLeaf
                );
                return filteredSegmentEvents.some((event: ProcessedEventsData) =>
                    event.event === allDayBlockEvent.event && DateService.isFullDayEvent(event.startDate, event.endDate)
                );
            };
            let startIndex: number = dateIndex;
            while (startIndex > 0 && hasFullDaySegment(renderDates[startIndex - 1])) {
                startIndex--;
            }
            let endIndex: number = dateIndex;
            while (endIndex < renderDates.length - 1 && hasFullDaySegment(renderDates[endIndex + 1])) {
                endIndex++;
            }
            return {
                ...allDayBlockEvent,
                totalSegments: endIndex - startIndex + 1,
                isFirstSegmentInRenderRange: dateIndex === startIndex
            };
        }, [getResourceScopedEvents, renderDates, groupConfig?.byDate]);

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
            const events: ProcessedEventsData[] = getResourceScopedEvents(dateKey, resourceLeaf).filter(
                (eventInfo: ProcessedEventsData): boolean => !eventInfo.event.isBlock
            );
            return Math.max(0, events.length - maxEventsStack);
        }, [getResourceScopedEvents, maxEventsStack, getAlldayBlockEvent]);

    /**
     * Checks if a date has more events than can be displayed
     *
     * @param {string} dateKey - The date key
     * @param {ResourceLevel} resourceLeaf - Optional leaf-level resource for filtering
     * @returns {boolean} True if date has more events than maxEventsStack
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
            return getResourceScopedEvents(dateKey, resourceLeaf).some((eventInfo: ProcessedEventsData): boolean =>
                isBlockEventIndicator(eventInfo.event, eventInfo.startDate, eventInfo.endDate)
            );
        }, [getResourceScopedEvents]);

    /**
     * Checks if a date has an all-day block event (isBlock: true, isAllDay: true)
     *
     * @param {string} dateKey - The date key
     * @param {ResourceLevel} resourceLeaf - Optional leaf-level resource for filtering
     * @returns {boolean} True if date has all-day block event
     */
    const hasAllDayBlock: (dateKey: string, resourceLeaf?: ResourceLevel) => boolean =
        useCallback((dateKey: string, resourceLeaf?: ResourceLevel): boolean => {
            return getResourceScopedEvents(dateKey, resourceLeaf).some((eventInfo: ProcessedEventsData): boolean =>
                eventInfo.event.isBlock && (eventInfo.event.isAllDay ||
                    DateService.isFullDayEvent(eventInfo.startDate, eventInfo.endDate))
            );
        }, [getResourceScopedEvents]);

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
