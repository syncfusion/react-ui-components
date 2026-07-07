import { CSSProperties } from 'react';
import { EventFields, EventModel, SchedulerResource, TimeScaleProps } from '../types/scheduler-types';
import { ProcessedEventsData, CellData } from '../types/internal-interface';
import { DateService, MS_PER_DAY } from './DateService';
import { PositioningService } from './PositioningService';
import { Timezone } from './Timezone';
import { getCellFromIndex, getEventMaxID } from '../utils/actions';
import { CSS_CLASSES } from '../common/constants';
import { DEFAULT_FIELDS } from '../utils/default-props';
import { ResourceGroupingMetadata, ResourceLevel } from './ResourceGroupingService';
import { isNullOrUndefined } from '@syncfusion/react-base';

export const ALL_DAY_EVENT_HEIGHT: number = 24;
export const EVENTS_GAP: number = 4;
export const ROW_HEIGHT: number = 40;

/** @private */
export class EventService {

    /**
     * Filters events that fall within the given render dates range
     *
     * @param {EventModel[]} events - The events to filter
     * @param {Date[]} renderDates - The dates being rendered
     * @returns {EventModel[]} - Filtered events that intersect with render dates
     */
    static filterEventsByDateRange(events: EventModel[], renderDates: Date[]): EventModel[] {
        if (!events?.length || !renderDates?.length) { return []; }
        const firstRenderDate: Date = DateService.normalizeDate(renderDates[0]);
        const lastRenderDate: Date = DateService.normalizeDate(renderDates[renderDates.length - 1]);
        return events.filter((event: EventModel) => {
            if (!event.startTime || !event.endTime) { return false; }
            const eventStart: Date = DateService.normalizeDate(event.startTime);
            const eventEnd: Date = DateService.normalizeDate(event.endTime);
            return !(eventEnd < firstRenderDate || eventStart > lastRenderDate);
        });
    }

    /**
     * Finds a non-conflicting position for an event
     *
     * @param {Date[]} renderDates - The dates being rendered
     * @param {Date} startDate - The start date of the event
     * @param {Date} endDate - The end date of the event
     * @param {boolean} includeEndMidnight - Indicates to include event mid night end event.
     * @param {Map<string, boolean[]>} occupiedPositions - Map of occupied positions
     * @returns {number} A non-conflicting position index
     */
    static findNonConflictingPosition(
        renderDates: Date[],
        startDate: Date,
        endDate: Date,
        includeEndMidnight: boolean,
        occupiedPositions: Map<string, boolean[]>
    ): number {
        let positionIndex: number = 0;
        let foundPosition: boolean = false;
        while (!foundPosition) {
            foundPosition = true;
            for (const date of renderDates) {
                const currentDate: Date = DateService.normalizeDate(date);
                const shouldIncludeDate: boolean = currentDate >= startDate && (currentDate < endDate ||
                    (currentDate.getTime() === endDate.getTime() && includeEndMidnight)
                );
                if (shouldIncludeDate) {
                    const dateKey: string = DateService.generateDateKey(date);
                    const positions: boolean[] = occupiedPositions.get(dateKey) || [];
                    const isOccupied: boolean = positions.findIndex(
                        (occupied: boolean, idx: number) => idx === positionIndex && occupied
                    ) !== -1;
                    if (isOccupied) {
                        foundPosition = false;
                        positionIndex++;
                        break;
                    }
                }
            }
        }
        return positionIndex;
    }

    /**
     * Maps raw event data to EventModel objects based on field mappings
     *
     * @param {Record<string, any>[]} events - Raw event data to process
     * @param {Record<string, string>} [fields] - Field mapping configuration
     * @returns {EventModel[]} Array of EventModel objects with mapped properties
     */
    static mapEventData(events: Record<string, any>[], fields?: EventFields): EventModel[] {
        if (!events || events.length === 0) {
            return [];
        }

        // Default field mappings if none provided
        const fieldMappings: EventFields = fields || DEFAULT_FIELDS;

        return events.map((eventData: Record<string, any>): EventModel => {
            const mappedEvent: Partial<EventModel> = {};
            if (fieldMappings.id && Object.prototype.hasOwnProperty.call(eventData, fieldMappings.id)) {
                mappedEvent.id = eventData[fieldMappings.id] as string | number;
            }
            if (fieldMappings.subject && Object.prototype.hasOwnProperty.call(eventData, fieldMappings.subject)) {
                mappedEvent.subject = eventData[fieldMappings.subject] as string;
            }
            if (fieldMappings.startTime && Object.prototype.hasOwnProperty.call(eventData, fieldMappings.startTime)) {
                const startTimeVal: Date | string | number = eventData[fieldMappings.startTime] as Date | string | number;
                if (startTimeVal instanceof Date) {
                    mappedEvent.startTime = startTimeVal;
                } else if (typeof startTimeVal === 'string' || typeof startTimeVal === 'number') {
                    mappedEvent.startTime = new Date(startTimeVal);
                }
            }
            if (fieldMappings.endTime && Object.prototype.hasOwnProperty.call(eventData, fieldMappings.endTime)) {
                const endTimeVal: Date | string | number = eventData[fieldMappings.endTime] as Date | string | number;
                if (endTimeVal instanceof Date) {
                    mappedEvent.endTime = endTimeVal;
                } else if (typeof endTimeVal === 'string' || typeof endTimeVal === 'number') {
                    mappedEvent.endTime = new Date(endTimeVal);
                }
            }
            if (fieldMappings.isAllDay && Object.prototype.hasOwnProperty.call(eventData, fieldMappings.isAllDay)) {
                mappedEvent.isAllDay = eventData[fieldMappings.isAllDay] as boolean;
            }
            if (fieldMappings.location && Object.prototype.hasOwnProperty.call(eventData, fieldMappings.location)) {
                mappedEvent.location = eventData[fieldMappings.location] as string;
            }
            if (fieldMappings.description && Object.prototype.hasOwnProperty.call(eventData, fieldMappings.description)) {
                mappedEvent.description = eventData[fieldMappings.description] as string;
            }
            if (fieldMappings.isReadonly && Object.prototype.hasOwnProperty.call(eventData, fieldMappings.isReadonly)) {
                mappedEvent.isReadonly = eventData[fieldMappings.isReadonly] as boolean;
            }
            if (fieldMappings.isBlock && Object.prototype.hasOwnProperty.call(eventData, fieldMappings.isBlock)) {
                mappedEvent.isBlock = eventData[fieldMappings.isBlock] as boolean;
            }
            if (fieldMappings.recurrenceRule && Object.prototype.hasOwnProperty.call(eventData, fieldMappings.recurrenceRule)) {
                mappedEvent.recurrenceRule = eventData[fieldMappings.recurrenceRule] as string;
            }
            if (fieldMappings.recurrenceID && Object.prototype.hasOwnProperty.call(eventData, fieldMappings.recurrenceID)) {
                mappedEvent.recurrenceID = eventData[fieldMappings.recurrenceID] as string | number;
            }
            if (fieldMappings.recurrenceException && Object.prototype.hasOwnProperty.call(eventData, fieldMappings.recurrenceException)) {
                mappedEvent.recurrenceException = eventData[fieldMappings.recurrenceException] as string;
            }
            if (fieldMappings.followingId && Object.prototype.hasOwnProperty.call(eventData, fieldMappings.followingId)) {
                mappedEvent.followingId = eventData[fieldMappings.followingId] as string | number;
            }
            if (fieldMappings.startTimezone && Object.prototype.hasOwnProperty.call(eventData, fieldMappings.startTimezone)) {
                mappedEvent.startTimezone = eventData[fieldMappings.startTimezone] as string;
            }
            if (fieldMappings.endTimezone && Object.prototype.hasOwnProperty.call(eventData, fieldMappings.endTimezone)) {
                mappedEvent.endTimezone = eventData[fieldMappings.endTimezone] as string;
            }

            // Preserve any additional fields from the original event that are not mapped
            const mappedSourceKeys: Set<string> = new Set(Object.values(fieldMappings));
            const mappedFieldKeys: Set<string> = new Set(Object.values(DEFAULT_FIELDS));
            const preservedExtras: Record<string, any> = Object.fromEntries(
                Object.entries(eventData).filter(([key]: [string, any]) => !(mappedSourceKeys.has(key) && mappedFieldKeys.has(key)))
            );
            Object.assign(mappedEvent as Record<string, any>, preservedExtras);

            mappedEvent.guid = EventService.generateEventGuid();
            return mappedEvent as EventModel;
        });
    }

    /**
     * Sorts events by start time and duration
     *
     * @param {ProcessedEventsData[]} events - Array of events to sort
     * @returns {ProcessedEventsData[]} Sorted array of events
     */
    static sortEventsByStartTimeAndDuration(events: ProcessedEventsData[]): ProcessedEventsData[] {
        return [...events].sort((a: ProcessedEventsData, b: ProcessedEventsData) => {
            if (!a.event.startTime || !b.event.startTime) {
                return 0;
            }
            const startDiff: number = a.event.startTime.getTime() - b.event.startTime.getTime();
            if (startDiff !== 0) {
                return startDiff;
            }
            const aDuration: number = a.event.endTime ? a.event.endTime.getTime() - a.event.startTime.getTime() : 0;
            const bDuration: number = b.event.endTime ? b.event.endTime.getTime() - b.event.startTime.getTime() : 0;
            return bDuration - aDuration;
        });
    }

    static calculateOverlappingEvents(events: ProcessedEventsData[]): ProcessedEventsData[][] {
        if (!events || events.length === 0) {
            return [];
        }
        const sortedEvents: ProcessedEventsData[] = this.sortEventsByStartTimeAndDuration(events);
        return this.identifyOverlapGroups(sortedEvents);
    }

    static identifyOverlapGroups(sortedEvents: ProcessedEventsData[]): ProcessedEventsData[][] {
        const overlapGroups: ProcessedEventsData[][] = [];
        for (const currentEvent of sortedEvents) {
            let addedToGroup: boolean = false;
            for (const group of overlapGroups) {
                const overlapsWithAnyInGroup: boolean = group.some((groupEvent: ProcessedEventsData) =>
                    this.eventsOverlap(currentEvent, groupEvent));
                // If it overlaps with any events in this group, add it to the group
                if (overlapsWithAnyInGroup) {
                    group.push(currentEvent);
                    addedToGroup = true;
                    break;
                }
            }
            // If the event doesn't belong to any existing group, create a new group
            if (!addedToGroup) {
                overlapGroups.push([currentEvent]);
            }
        }
        return this.convertOverlapGroupsToEventGroups(overlapGroups);
    }

    static convertOverlapGroupsToEventGroups(overlapGroups: ProcessedEventsData[][]): ProcessedEventsData[][] {
        const eventGroups: ProcessedEventsData[][] = overlapGroups
            .filter((group: ProcessedEventsData[]) => group.length > 0)
            .map((group: ProcessedEventsData[]) => {
                if (group.length === 1) {
                    return [{
                        ...group[0],
                        positionIndex: 0,
                        totalOverlapping: 1
                    }];
                }
                // For multiple events, assign proper position indices
                const sortedGroupEvents: ProcessedEventsData[] = [...group].sort((a: ProcessedEventsData, b: ProcessedEventsData) => {
                    if (!a.event.startTime || !b.event.startTime) { return 0; }
                    return a.event.startTime.getTime() - b.event.startTime.getTime();
                });

                const eventEndTimes: Date[] = [];
                const positions: number[] = [];

                sortedGroupEvents.forEach((event: ProcessedEventsData) => {
                    let positionIndex: number = eventEndTimes.findIndex((endTime: Date) => endTime <= event.event.startTime);
                    if (positionIndex === -1) {
                        positionIndex = eventEndTimes.length;
                        eventEndTimes.push(event.event.endTime);
                    } else {
                        eventEndTimes[parseInt(positionIndex.toString(), 10)] = event.event.endTime;
                    }
                    positions.push(positionIndex);
                });

                return sortedGroupEvents.map((event: ProcessedEventsData, i: number) => ({
                    ...event,
                    positionIndex: positions[parseInt(i.toString(), 10)],
                    totalOverlapping: eventEndTimes.length
                }));
            });
        return eventGroups;
    }

    /**
     * Prioritizes events based on all-day status, duration, and start time
     *
     * @param {ProcessedEventsData[]} events - Array of events
     * @returns {ProcessedEventsData[]} Sorted array of events
     */
    static prioritizeEvents(events: ProcessedEventsData[]): ProcessedEventsData[] {
        return [...events].sort((a: ProcessedEventsData, b: ProcessedEventsData) => {
            if (a.event.isAllDay && !b.event.isAllDay) {
                return -1;
            }
            if (!a.event.isAllDay && b.event.isAllDay) {
                return 1;
            }
            if (!a.event.startTime || !b.event.startTime || !a.event.endTime || !b.event.endTime) {
                return 0;
            }
            const aDuration: number = a.event.endTime.getTime() - a.event.startTime.getTime();
            const bDuration: number = b.event.endTime.getTime() - b.event.startTime.getTime();
            if (aDuration !== bDuration) {
                return bDuration - aDuration;
            }
            return a.event.startTime.getTime() - b.event.startTime.getTime();
        });
    }

    static resolveOverlappingEvents(events: ProcessedEventsData[]): ProcessedEventsData[][] {
        if (!events || events.length === 0) {
            return [];
        }

        const prioritizedEvents: ProcessedEventsData[] = this.prioritizeEvents(events);
        const eventGroups: ProcessedEventsData[][] = [];
        const processedEvents: Set<ProcessedEventsData> = new Set();

        prioritizedEvents.forEach((eventInfo: ProcessedEventsData) => {
            if (processedEvents.has(eventInfo)) {
                return;
            }
            const conflicts: ProcessedEventsData[] = prioritizedEvents.filter((otherEvent: ProcessedEventsData) =>
                eventInfo !== otherEvent && !processedEvents.has(otherEvent) && this.eventsOverlap(eventInfo, otherEvent)
            );
            const group: ProcessedEventsData[] = [{
                ...eventInfo,
                positionIndex: 0,
                totalOverlapping: 1
            }];
            eventGroups.push(group);
            processedEvents.add(eventInfo);
            conflicts.forEach((conflictEvent: ProcessedEventsData) => {
                processedEvents.add(conflictEvent);
            });
        });
        return eventGroups;
    }

    /**
     * Groups events by each render date they span.
     *
     * @param {EventModel[]} events - Events to group.
     * @param {Date[]} renderDates - Render dates to check against.
     * @param {boolean} [excludeBlockEvents=true] - Whether to exclude block events.
     * @returns {Map<string, EventModel[]>} Events grouped by date key.
     */
    static groupEventsByRenderDates(
        events: EventModel[],
        renderDates: Date[],
        excludeBlockEvents: boolean = true
    ): Map<string, EventModel[]> {
        const eventsByDate: Map<string, EventModel[]> = new Map<string, EventModel[]>();
        if (!events?.length || !renderDates?.length) {
            return eventsByDate;
        }

        const filteredEvents: EventModel[] = excludeBlockEvents
            ? events.filter((event: EventModel) => !event.isBlock)
            : events;

        renderDates.forEach((date: Date) => {
            const dateKey: string = DateService.generateDateKey(date);
            const dateNormalized: Date = DateService.normalizeDate(date);

            const eventsOnDate: EventModel[] = filteredEvents.filter((event: EventModel) => {
                if (!event.startTime || !event.endTime) { return false; }

                const eventStartNormalized: Date = DateService.normalizeDate(event.startTime);
                const eventEndNormalized: Date = DateService.normalizeDate(event.endTime);

                return eventStartNormalized <= dateNormalized && eventEndNormalized >= dateNormalized;
            });

            if (eventsOnDate.length > 0) {
                eventsByDate.set(dateKey, eventsOnDate);
            }
        });

        return eventsByDate;
    }

    /**
     * Filters out overlapping events, keeping only the highest priority event from each overlapping group.
     * Events are grouped by date first, then overlap resolution is applied within each date.
     *
     * @param {EventModel[]} events - Array of events to filter
     * @param {Date[]} renderDates - Array of render dates for date-based grouping
     * @returns {EventModel[]} - Filtered array containing only non-overlapping events (highest priority from each group within same date)
     * @private
     */
    static filterNonOverlappingEvents(events: EventModel[], renderDates: Date[]): EventModel[] {
        if (!events || events.length === 0 || !renderDates || renderDates.length === 0) {
            return events;
        }

        const nonBlockEvents: EventModel[] = events.filter((event: EventModel) => !event.isBlock);
        const blockEvents: EventModel[] = events.filter((event: EventModel) => event.isBlock);
        if (nonBlockEvents.length === 0) { return events; }

        // Group events by date
        const eventsByDate: Map<string, EventModel[]> = this.groupEventsByRenderDates(nonBlockEvents, renderDates, false);

        const filteredOutEvents: Set<string> = new Set();
        const selectedEvents: EventModel[] = [];
        const selectedSet: Set<string> = new Set();

        eventsByDate?.forEach((dateEvents: EventModel[]) => {
            const processedEvents: ProcessedEventsData[] = dateEvents
                .filter((event: EventModel) => !filteredOutEvents.has(event.guid || `${event.id}`))
                .map((event: EventModel) => ({
                    event,
                    startDate: event.startTime,
                    endDate: event.endTime
                }));

            if (processedEvents.length === 0) { return; }

            const resolvedGroups: ProcessedEventsData[][] = this.resolveOverlappingEvents(processedEvents);
            const processedEventGuids: Set<string> = new Set(processedEvents.map((e: ProcessedEventsData) => e.event.guid || `${e.event.id}`));
            const resolvedGroupGuids: Set<string> = new Set(resolvedGroups.flatMap((group: ProcessedEventsData[]) => group.map((e: ProcessedEventsData) => e.event.guid || `${e.event.id}`)));

            processedEventGuids.forEach((guid: string) => {
                if (!resolvedGroupGuids.has(guid)) {
                    filteredOutEvents.add(guid);
                }
            });

            resolvedGroups.forEach((group: ProcessedEventsData[]) => {
                if (group.length > 0) {
                    const selectedEvent: EventModel = group[0].event;
                    const eventKey: string = selectedEvent.guid || `${selectedEvent.id}`;

                    if (!selectedSet.has(eventKey)) {
                        selectedEvents.push(selectedEvent);
                        selectedSet.add(eventKey);
                    }
                }
            });
        });

        return [...selectedEvents, ...blockEvents];
    }

    /**
     * Checks if two events overlap in time
     *
     * @param {ProcessedEventsData} event1 - First event
     * @param {ProcessedEventsData} event2 - Second event
     * @returns {boolean} True if events overlap
     */
    static eventsOverlap(event1: ProcessedEventsData, event2: ProcessedEventsData): boolean {
        if (!event1?.event.startTime || !event1?.event.endTime || !event2?.event.startTime || !event2?.event.endTime) {
            return false;
        }
        if (event1.event.isAllDay || event2.event.isAllDay) {
            const event1StartDate: Date = DateService.normalizeDate(event1.event.startTime);
            const event1EndDate: Date = DateService.normalizeDate(event1.event.endTime);
            const event2StartDate: Date = DateService.normalizeDate(event2.event.startTime);
            const event2EndDate: Date = DateService.normalizeDate(event2.event.endTime);

            return event1StartDate <= event2EndDate && event1EndDate >= event2StartDate;
        }
        return (
            (event1.event.startTime < event2.event.endTime && event1.event.endTime > event2.event.startTime) ||
            (event2.event.startTime < event1.event.endTime && event2.event.endTime > event1.event.startTime)
        );
    }

    /**
     * Checks if an event overlaps with any other events in the collection
     *
     * @param {EventModel} event - Event to check
     * @param {EventModel[]} allEvents - All events in the scheduler
     * @returns {boolean} True if event overlaps with any other event
     */
    static checkEventOverlap(event: EventModel, allEvents: EventModel[]): boolean {
        const newStartTime: Date = event.startTime;
        const newEndTime: Date = event.endTime;

        if (!newStartTime || !newEndTime) {
            return false;
        }

        const eventStartDate: Date = DateService.normalizeDate(newStartTime);
        const eventEndDate: Date = DateService.normalizeDate(newEndTime);
        const renderedEvents: EventModel[] = (allEvents || []).filter((e: EventModel) => {
            if (e.isBlock || !e.startTime || !e.endTime) { return false; }
            const eStart: Date = DateService.normalizeDate(e.startTime);
            const eEnd: Date = DateService.normalizeDate(e.endTime);
            return !(eEnd < eventStartDate || eStart > eventEndDate);
        });

        return renderedEvents.some((otherEvent: EventModel) => {
            const oldStartTime: Date = otherEvent.startTime;
            const oldEndTime: Date = otherEvent.endTime;
            const isAllDay: boolean = otherEvent.isAllDay;
            if (otherEvent.id === event.id || otherEvent.guid === event.guid) {
                return false;
            }
            if (!oldStartTime || !oldEndTime) {
                return false;
            }
            if (isAllDay || event?.isAllDay) {
                const oldStartDateOnly: Date = DateService.normalizeDate(oldStartTime);
                const oldEndDateOnly: Date = DateService.normalizeDate(oldEndTime);
                return (eventStartDate <= oldEndDateOnly && eventEndDate >= oldStartDateOnly);
            } else {
                return (newStartTime < oldEndTime && newEndTime > oldStartTime);
            }
        });
    }

    /**
     * Checks if an event overlaps with any blocked events
     *
     * @param {EventModel | EventModel[]} eventData - Event(s) to check
     * @param {EventModel[]} allEvents - All events in the scheduler
     * @returns {boolean} True if event overlaps with a blocked event
     */
    static isBlockRange(eventData: EventModel | EventModel[], allEvents?: EventModel[]): boolean {
        const eventCollection: EventModel[] = Array.isArray(eventData) ? eventData : [eventData];

        if (eventCollection && eventCollection.length === 0) { return false; }

        const blockEvents: EventModel[] = allEvents?.filter((event: EventModel) => event.isBlock) || [];
        if (blockEvents && blockEvents.length === 0) { return false; }

        for (const block of blockEvents) {
            const blockStart: Date = block.startTime;
            const blockEnd: Date = block.endTime;

            if (!blockStart || !blockEnd) { continue; }

            const blockIsAllDayOrMultiDay: boolean = block.isAllDay || EventService.isMultiDayEvent(block);

            for (const event of eventCollection) {
                const eventStart: Date = event.startTime;
                const eventEnd: Date = event.endTime;

                if (!eventStart || !eventEnd) { continue; }

                let overlaps: boolean;

                if (blockIsAllDayOrMultiDay || event.isAllDay) {
                    const eventStartDate: Date = DateService.normalizeDate(eventStart);
                    const eventEndDate: Date = DateService.normalizeDate(eventEnd);
                    const blockStartDate: Date = DateService.normalizeDate(blockStart);
                    const blockEndDate: Date = DateService.normalizeDate(blockEnd);

                    overlaps = eventStartDate <= blockEndDate && blockStartDate <= eventEndDate;
                } else {
                    overlaps = eventStart < blockEnd && eventEnd > blockStart;
                }

                if (overlaps) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Splits a multi-day event into daily segments
     *
     * @param {EventModel} event - The event to split
     * @param {Date[]} renderDates - The dates being rendered
     * @returns {ProcessedEventsData[]} Array of event segments
     */
    static splitEventByDay(event: EventModel, renderDates: Date[]): ProcessedEventsData[] {
        const processedEvents: ProcessedEventsData[] = [];
        const startDate: Date = DateService.normalizeDate(event.startTime);
        const endDate: Date = DateService.normalizeDate(event.endTime);

        // Count total segments (days) for this event
        const totalSegments: number = renderDates.filter((date: Date) => {
            const currentDate: Date = DateService.normalizeDate(date);
            return currentDate >= startDate && currentDate <= endDate;
        }).length;

        let segmentIndex: number = 0;

        renderDates.forEach((renderDate: Date, columnIndex: number) => {
            const currentDate: Date = DateService.normalizeDate(renderDate);
            if (currentDate >= startDate && currentDate <= endDate) {
                const isFirstDay: boolean = currentDate.getTime() === startDate.getTime();
                const isLastDay: boolean = currentDate.getTime() === endDate.getTime();

                // For first day, use the original start time; for other days, start at 00:00
                const segmentStartTime: Date = isFirstDay
                    ? new Date(event.startTime)
                    : new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 0, 0, 0);

                // For last day, use the original end time; for other days, end at 00:00
                const segmentEndTime: Date = isLastDay
                    ? new Date(event.endTime)
                    : new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 1, 0, 0, 0);

                const segmentEvent: ProcessedEventsData = {
                    event,
                    startDate: segmentStartTime,
                    endDate: segmentEndTime,
                    isFirstDay,
                    isLastDay,
                    segmentIndex,
                    totalSegments,
                    columnIndex
                };

                processedEvents.push(segmentEvent);
                segmentIndex++;
            }
        });

        return processedEvents;
    }

    /**
     * Processes events specifically for Agenda View to calculate segments.
     * Matches EJ2 AgendaBase.processAgendaEvents logic.
     *
     * @param {EventModel[]} events - Events to process
     * @param {Date[]} dates - Current view dates
     * @returns {Map<string, ProcessedEventsData[]>} Processed events grouped by date key
     */
    static processAgendaEvents(
        events: EventModel[],
        dates: Date[]
    ): Map<string, ProcessedEventsData[]> {
        const eventsByDate: Map<string, ProcessedEventsData[]> = new Map();
        if (!events?.length || !dates?.length) { return eventsByDate; }

        const filteredEvents: EventModel[] = this.filterEventsByDateRange(
            events.filter((event: EventModel) => !event.isBlock),
            dates
        );

        if (!filteredEvents?.length) { return eventsByDate; }

        const datesMap: Map<number, string> = new Map();
        dates.forEach((d: Date) => {
            const dateNormalized: Date = DateService.resetTime(d);
            const dateTime: number = dateNormalized.getTime();
            const key: string = DateService.generateDateKey(dateNormalized);
            datesMap.set(dateTime, key);
            eventsByDate.set(key, []);
        });

        filteredEvents.forEach((event: EventModel) => {
            const start: Date = DateService.resetTime(new Date(event.startTime));
            const end: Date = (event.isAllDay || !DateService.isMidnight(event.endTime)) ?
                DateService.resetTime(new Date(event.endTime)) :
                DateService.addDays(DateService.resetTime(new Date(event.endTime)), -1);
            const totalSegments: number = DateService.getDaysCount(event.startTime, event.endTime, event.isAllDay);

            let current: Date = new Date(start);
            let segmentIndex: number = 0;

            while (current <= end) {
                const currentTimestamp: number = current.getTime();
                const dateKey: string | undefined = datesMap.get(currentTimestamp);
                if (dateKey) {
                    const isFirstDay: boolean = currentTimestamp === start.getTime();
                    const isLastDay: boolean = currentTimestamp === end.getTime();

                    const startDate: Date = isFirstDay ? new Date(event.startTime) : new Date(current);
                    const endDate: Date = isLastDay ? new Date(event.endTime) : DateService.addDays(new Date(current), 1);

                    const segment: ProcessedEventsData = {
                        event,
                        startDate,
                        endDate,
                        segmentIndex,
                        totalSegments
                    };

                    eventsByDate.get(dateKey).push(segment);
                }
                current = DateService.addDays(current, 1);
                segmentIndex++;
            }
        });

        eventsByDate.forEach((events: ProcessedEventsData[]): void => {
            events.sort((a: ProcessedEventsData, b: ProcessedEventsData): number => {
                return (a.startDate as any) - (b.startDate as any);
            });
        });

        return eventsByDate;
    }

    /**
     * Checks if any date has more events than the allowed maximum
     *
     * @param {Date[]} renderDates - The dates being rendered
     * @param {Map<string, ProcessedEventsData[]>} eventsByDate - Map of events by date
     * @param {number} maxEventsPerRow - Maximum events allowed per row.
     * @returns {boolean} True if any date has more events than allowed
     */
    static isAlldayHasMoreEvents(
        renderDates: Date[],
        eventsByDate: Map<string, ProcessedEventsData[]>,
        maxEventsPerRow: number = 2): boolean {
        let hasExceedingEvents: boolean = false;
        renderDates.forEach((date: Date) => {
            const dateKey: string = DateService.generateDateKey(date);
            const dateEvents: ProcessedEventsData[] = eventsByDate.get(dateKey) || [];
            if (dateEvents.length > maxEventsPerRow) {
                hasExceedingEvents = true;
            }
        });
        return hasExceedingEvents;
    }

    /**
     * Checks if an event spans multiple days
     *
     * @param {EventModel} event - The event to check
     * @returns {boolean} True if the event spans multiple days
     */
    static isMultiDayEvent(event: EventModel): boolean {
        if (!event?.startTime || !event?.endTime) {
            return false;
        }

        const startTime: Date = new Date(event.startTime);
        const endTime: Date = new Date(event.endTime);

        if (DateService.isSameDay(startTime, endTime)) {
            return false;
        }
        // If not the same day and it's an all-day event, it's multi-day
        if (event.isAllDay) {
            return true;
        }

        const startDate: Date = DateService.normalizeDate(startTime);
        const endDate: Date = DateService.normalizeDate(endTime);
        const dayDiffDays: number = Math.round((endDate.getTime() - startDate.getTime()) / MS_PER_DAY);
        if (dayDiffDays <= 0) {
            return false;
        }
        if (dayDiffDays >= 2) {
            return true;
        }
        if (DateService.isMidnight(endTime)) {
            return false;
        }
        return true;
    }

    /**
     * Gets accessibility label for an event
     *
     * @param {EventModel} event - The event
     * @returns {string} Accessibility label text
     */
    static getAriaLabel(event: EventModel): string {
        const { subject, startTime, endTime } = event;
        const startDateString: string = startTime ? startTime.toString() : '';
        const endDateString: string = endTime ? endTime.toString() : '';

        return `${subject} Begin From ${startDateString} Ends At ${endDateString}`;
    }

    /**
     * Generates a unique ID for an event
     *
     * @returns {string} A unique ID string
     */
    static generateEventGuid(): string {
        return 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'.replace(/[x]/g, () => {
            const r: number = Math.random() * 16 | 0;
            return r.toString(16);
        });
    }

    static getEventClassNames(event: EventModel): string[] {
        const eventClasses: string[] = [];
        if (!event.isBlock) {
            eventClasses.push('sf-appointment');
            if (event.isReadonly) {
                eventClasses.push('sf-read-only');
            }
        } else {
            eventClasses.push('sf-block-appointment');
        }
        return eventClasses;
    }

    static getEventsMap(renderDates: Date[], events: ProcessedEventsData[]): Map<string, ProcessedEventsData[]> {
        const eventsMap: Map<string, ProcessedEventsData[]> = new Map<string, ProcessedEventsData[]>();

        renderDates.forEach((date: Date) => {
            const dateKey: string = DateService.generateDateKey(date);
            eventsMap.set(dateKey, []);
        });

        events.forEach((eventInfo: ProcessedEventsData) => {
            if (!eventInfo.startDate) { return; }
            const dateKey: string = DateService.generateDateKey(eventInfo.startDate);
            const dateEvents: ProcessedEventsData[] = eventsMap.get(dateKey) || [];
            if (dateEvents) {
                dateEvents.push(eventInfo);
                eventsMap.set(dateKey, dateEvents);
            }
        });

        return eventsMap;
    }

    /**
     * Gets the maximum number of events in any cell
     *
     * @param {Map<string, ProcessedEventsData[]>} eventsByDate - Map of events by date
     * @param {Date[]} [renderDates] - Optional array of dates to consider
     * @returns {number} The maximum number of events in any cell
     */
    static getMaxEventsInCell(eventsByDate: Map<string, ProcessedEventsData[]>, renderDates?: Date[]): number {
        let maxEventCount: number = 0;
        renderDates.forEach((date: Date) => {
            const dateKey: string = DateService.generateDateKey(date);
            const dateEvents: ProcessedEventsData[] = eventsByDate.get(dateKey)?.filter(
                (eventInfo: ProcessedEventsData) => !eventInfo.event.isBlock
            );
            maxEventCount = Math.max(maxEventCount, dateEvents?.length);
        });
        return maxEventCount;
    }

    static processDayEvents(
        renderDates: Date[],
        eventsData: EventModel[],
        resources?: SchedulerResource[],
        isGroupingEnabled?: boolean,
        resourceColorField?: string
    ): ProcessedEventsData[] {
        if (!renderDates?.length || !eventsData?.length) { return []; }

        // Filter events within the render dates range
        const filteredEvents: EventModel[] = EventService.filterEventsByDateRange(eventsData, renderDates);
        const events: ProcessedEventsData[] = [];

        const { sharedPositionMap, positionMapsPerResource } =
            PositioningService.initializePositionMaps(renderDates, isGroupingEnabled);

        const sortedEventsByTime: EventModel[] = DateService.sortByTimeAndSpan(filteredEvents);

        sortedEventsByTime.forEach((event: EventModel) => {
            if (!event.startTime || !event.endTime) { return; }

            const eventClasses: string[] = EventService.getEventClassNames(event);
            const startDate: Date = DateService.normalizeDate(event.startTime);
            const endDate: Date = DateService.normalizeDate(event.endTime);
            const isMultiDay: boolean = EventService.isMultiDayEvent(event);
            const totalSegments: number = isMultiDay ? DateService.getDaysCount(event.startTime, event.endTime, event.isAllDay) : 1;
            const includeEndMidnight: boolean = event.isAllDay ? true : !DateService.isMidnight(event.endTime);
            const positionMapForEvent: Map<string, boolean[]> = PositioningService.getPositionMapForEvent(
                event, resources, positionMapsPerResource, renderDates, sharedPositionMap
            );

            const positionIndex: number = !event.isBlock ?
                EventService.findNonConflictingPosition(renderDates, startDate, endDate, includeEndMidnight, positionMapForEvent) : null;

            if (isMultiDay) {
                for (const date of renderDates) {
                    const currentDate: Date = DateService.normalizeDate(date);
                    const shouldIncludeDate: boolean = currentDate >= startDate && (currentDate < endDate ||
                        (currentDate.getTime() === endDate.getTime() && includeEndMidnight)
                    );
                    if (!shouldIncludeDate) { continue; }

                    if (!event.isBlock) {
                        PositioningService.setIndexPosition(positionMapForEvent, date, positionIndex);
                    }

                    const isFirstDay: boolean = currentDate.getTime() === startDate.getTime();
                    const isLastDay: boolean = currentDate.getTime() === endDate.getTime() && includeEndMidnight;
                    const segmentIndex: number = Math.floor(
                        (currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
                    );

                    const isFirstSegmentInRenderRange: boolean = renderDates.findIndex((renderDate: Date) => {
                        const normalizedRenderDate: Date = DateService.normalizeDate(renderDate);
                        return normalizedRenderDate >= startDate && (normalizedRenderDate < endDate ||
                            (normalizedRenderDate.getTime() === endDate.getTime() && includeEndMidnight)
                        );
                    }) === renderDates.findIndex((renderDate: Date) => {
                        const normalizedRenderDate: Date = DateService.normalizeDate(renderDate);
                        return normalizedRenderDate.getTime() === currentDate.getTime();
                    });

                    const segmentStartTime: Date = isFirstDay ?
                        new Date(event.startTime.getTime()) :
                        new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 0, 0, 0);

                    const segmentEndTime: Date = isLastDay ?
                        new Date(event.endTime.getTime()) :
                        new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 1, 0, 0, 0);

                    const eventKey: string = `${date.toISOString()}-${event.id}`;
                    const resourceColor: string = EventService.getResourceColor(event, resources, resourceColorField);

                    events.push({
                        event: event,
                        startDate: segmentStartTime,
                        endDate: segmentEndTime,
                        isFirstDay,
                        isLastDay,
                        isFirstSegmentInRenderRange,
                        segmentIndex,
                        totalSegments,
                        positionIndex,
                        eventClasses,
                        eventKey,
                        isMonthEvent: true,
                        eventStyle: resourceColor ? { backgroundColor: resourceColor } : undefined
                    });
                }
            } else {
                if (!event.isBlock) {
                    PositioningService.setIndexPosition(positionMapForEvent, startDate, positionIndex);
                }
                const eventKey: string = `${startDate.toISOString()}-${event.id}`;
                const resourceColor: string = EventService.getResourceColor(event, resources, resourceColorField);
                events.push({
                    event: event,
                    startDate: event.startTime,
                    endDate: event.endTime,
                    positionIndex,
                    eventClasses,
                    eventKey,
                    isMonthEvent: true,
                    eventStyle: resourceColor ? { backgroundColor: resourceColor } : undefined
                });
            }
        });

        // Sort by position index to stabilize stacking order
        return events.sort((a: ProcessedEventsData, b: ProcessedEventsData) => {
            const aIndex: number = a.positionIndex ?? 0;
            const bIndex: number = b.positionIndex ?? 0;
            return aIndex - bIndex;
        });
    }

    private static getAbsoluteColumnIndex(
        columnIndex: number,
        groupIndex: number | undefined,
        rowLength: number,
        groupingConfig?: ResourceGroupingMetadata
    ): number {
        if (!groupingConfig || groupIndex === undefined) {
            return columnIndex;
        }
        if (groupingConfig.byDate) {
            return (columnIndex * (groupingConfig.leafResources?.length ?? 1)) + groupIndex;
        }
        return (groupIndex * rowLength) + columnIndex;
    }

    /**
     * Calculates pixel position and size for a cloned month event using DOM measurements.
     *
     * @param {HTMLDivElement} schedulerRef - Reference to the Scheduler instance.
     * @param {ProcessedEventsData} eventInfo - Event metadata including rowIndex/columnIndex and dates.
     * @param {number} cellWidth - Width of a single date cell in pixels.
     * @param {boolean} isAllDaySource - Indicates all day row events.
     * @param {boolean} isRtl - Defines its RTL.
     * @param {boolean} isMonthView - Define current view is month view or not.
     * @param {HTMLElement} currentCell - Contains current target.
     * @param {ResourceGroupingMetadata} groupingConfig - Grouping configuration for resource grouping.
     * @returns {CSSProperties} Inline style object containing top, left, and width (in pixels).
     */
    static cloneEventPosition(
        schedulerRef: HTMLDivElement,
        eventInfo: ProcessedEventsData,
        cellWidth: number,
        isAllDaySource: boolean,
        isRtl: boolean = false,
        isMonthView: boolean,
        currentCell?: HTMLElement,
        groupingConfig?: ResourceGroupingMetadata
    ): CSSProperties {
        const eventStartDay: Date = DateService.normalizeDate(eventInfo.startDate);
        const eventEndDay: Date = DateService.normalizeDate(eventInfo.endDate);
        const { visibleDayCount } = DateService.getVisibleAndStartDays(eventInfo.week, eventStartDay, eventEndDay, eventInfo.event);
        const widthPx: number = Math.max(0, (cellWidth * visibleDayCount) - EVENTS_GAP);

        let targetCell: HTMLElement;
        let topPx: number;
        let heightPx: number;
        const absoluteColumnIndex: number = EventService.getAbsoluteColumnIndex(
            eventInfo.columnIndex,
            eventInfo.groupIndex,
            eventInfo.week?.length ?? 0,
            groupingConfig
        );

        if (isAllDaySource) {
            const alldayRow: HTMLElement = schedulerRef?.querySelector(`.${CSS_CLASSES.ALL_DAY_ROW}`);
            const alldayCells: NodeListOf<HTMLElement> = alldayRow.querySelectorAll<HTMLElement>(`.${CSS_CLASSES.ALL_DAY_CELL}`);
            targetCell = alldayCells.item(absoluteColumnIndex);
            topPx = alldayRow.offsetTop;
        } else {
            targetCell = getCellFromIndex(schedulerRef, eventInfo.rowIndex, absoluteColumnIndex);
            if (isMonthView) {
                topPx = (targetCell?.querySelector(`.${CSS_CLASSES.APPOINTMENT_WRAPPER}`) as HTMLElement)?.offsetTop;
            } else {
                topPx = targetCell?.offsetTop;
                heightPx = Math.max(0, (currentCell.offsetHeight));
            }
        }

        const style: CSSProperties = { top: `${topPx}px`, width: `${widthPx}px`, height: `${heightPx}px` };
        if (isRtl) {
            const rightpx: number = targetCell.parentElement ? Math.max(0, (targetCell.parentElement.clientWidth -
                (targetCell.offsetLeft + targetCell.offsetWidth))) : 0;
            style.insetInlineStart = `${rightpx}px`;
        } else {
            style.insetInlineStart = `${targetCell.offsetLeft}px`;
        }
        return style;
    }

    static splitEventByWeek(rowDates: Date[][], event: EventModel): ProcessedEventsData[] {
        const originalEventStart: Date = new Date(event.startTime);
        const originalEventEnd: Date = new Date(event.endTime);
        const eventStartDate: Date = DateService.normalizeDate(originalEventStart);
        const eventEndDate: Date = DateService.normalizeDate(originalEventEnd);

        const segments: ProcessedEventsData[] = [];
        rowDates.forEach((week: Date[], rowIndex: number) => {
            const weekStart: Date = DateService.normalizeDate(week[0]);
            const weekEnd: Date = DateService.normalizeDate(week[week.length - 1]);
            const weekEndExclusive: Date = DateService.addDays(weekEnd, 1);

            const overlaps: boolean = (originalEventStart <= weekEndExclusive) && (originalEventEnd >= weekStart);
            if (!overlaps) { return; }

            const isStartInThisWeek: boolean = eventStartDate >= weekStart && eventStartDate <= weekEnd;
            const isEndInThisWeek: boolean = eventEndDate >= weekStart && eventEndDate <= weekEnd;

            const segmentStartTime: Date = isStartInThisWeek ? originalEventStart : weekStart;
            const segmentEndTime: Date = isEndInThisWeek ? originalEventEnd : weekEndExclusive;

            const weekTimes: number[] = week.map((d: Date) => DateService.normalizeDate(d).getTime());
            const segmentStartTimeKey: number = DateService.normalizeDate(segmentStartTime).getTime();
            let columnIndex: number = weekTimes.indexOf(segmentStartTimeKey);
            if (columnIndex === -1) { columnIndex = 0; }

            // Overflow flags relative to this week's render range
            const isOverflowLeft: boolean = eventStartDate.getTime() < weekStart.getTime();
            const isOverflowRight: boolean = eventEndDate.getTime() > weekEnd.getTime();

            const segment: ProcessedEventsData = {
                event,
                startDate: segmentStartTime,
                endDate: segmentEndTime,
                week,
                rowIndex,
                columnIndex,
                isOverflowLeft,
                isOverflowRight
            };
            segments.push(segment);
        });

        return segments;
    }

    static processCloneEvent(
        schedulerRef: HTMLDivElement,
        renderDates: Date[],
        event: EventModel,
        showWeekend: boolean,
        workDays: number[],
        cellWidth: number,
        isAllDaySource: boolean,
        isRtl: boolean = false,
        isMonthView: boolean,
        currentCell?: HTMLElement,
        resources?: SchedulerResource[],
        groupIndex?: number,
        groupingConfig?: ResourceGroupingMetadata,
        resourceColorField?: string
    ): ProcessedEventsData[] {
        const rowDates: Date[][] = isAllDaySource ? [renderDates] :
            DateService.getRenderWeeks(renderDates, showWeekend, workDays);
        const segments: ProcessedEventsData[] = this.splitEventByWeek(rowDates, event);
        const isMultiDay: boolean = EventService.isMultiDayEvent(event);

        segments.forEach((segment: ProcessedEventsData) => {
            if (!isNullOrUndefined(groupIndex)) {
                segment.groupIndex = groupIndex;
            }
            segment.eventStyle = this.cloneEventPosition(
                schedulerRef,
                segment,
                cellWidth,
                isAllDaySource,
                isRtl,
                isMonthView,
                currentCell,
                groupingConfig
            );
            segment.totalSegments = isMultiDay ? DateService.getDaysCount(segment.startDate, segment.endDate, segment.event?.isAllDay) : 1;
            const resourceColor: string | undefined = EventService.getResourceColor(event, resources, resourceColorField);
            if (resourceColor) {
                segment.eventStyle.backgroundColor = resourceColor;
            }
        });

        return segments;
    }

    static processTimeSlotCloneEvent(
        schedulerRef: HTMLDivElement,
        renderDates: Date[],
        event: EventModel,
        timeScale: TimeScaleProps,
        startHour: string,
        endHour: string,
        cellWidth: number,
        isRtl: boolean = false,
        cellHeight?: number,
        resources?: SchedulerResource[],
        groupIndex?: number,
        groupingConfig?: ResourceGroupingMetadata,
        resourceColorField?: string
    ): ProcessedEventsData[] {
        const measuredCellHeight: number | undefined = cellHeight;
        const segments: ProcessedEventsData[] = this.splitEventByDay(event, renderDates);
        segments.forEach((segment: ProcessedEventsData) => {
            const topPx: string = PositioningService.calculateTopPosition(segment.startDate, timeScale, startHour, measuredCellHeight);
            const heightPx: string = PositioningService.calculateHeight(segment, timeScale, startHour, endHour, measuredCellHeight);
            const absoluteColumnIndex: number = this.getAbsoluteColumnIndex(
                segment.columnIndex,
                groupIndex,
                renderDates.length,
                groupingConfig
            );

            const targetCell: HTMLElement = getCellFromIndex(schedulerRef, 0, absoluteColumnIndex); // first index '0'
            segment.eventStyle = {
                top: topPx,
                height: heightPx,
                width: `${cellWidth}px`
            };

            if (isRtl) {
                const rightpx: number = targetCell.parentElement ? Math.max(0, (targetCell.parentElement.clientWidth -
                    (targetCell.offsetLeft + targetCell.offsetWidth))) : 0;
                segment.eventStyle.right = `${rightpx}px`;
            } else {
                segment.eventStyle.left = `${targetCell.offsetLeft}px`;
            }
            const resourceColor: string | undefined = EventService.getResourceColor(event, resources, resourceColorField);
            if (resourceColor) {
                segment.eventStyle.backgroundColor = resourceColor;
            }
        });

        return segments;
    }

    /**
     * Returns an event from the given collection that matches the provided guid.
     *
     * @param {EventModel[]} events - Collection of events to search
     * @param {string} guid - The guid to match
     * @returns {EventModel | undefined} The matched event, if any
     */
    static getEventByGuid(events: EventModel[], guid: string): EventModel | undefined {
        if (!events?.length || !guid) { return undefined; }
        return events.find((e: EventModel) => e?.guid === guid);
    }

    /**
     * Converts event times from UTC to display timezone for calendar rendering.
     * For events with timezone metadata, their startTime/endTime are converted
     * from UTC to the assigned timezone. All-day events bypass conversion.
     *
     * Priority order:
     * 1. Event-level timezone (startTimezone/endTimezone) - converted if present
     * 2. Scheduler-level timezone - used as fallback for events without event-level timezone
     * 3. No conversion if neither is present
     *
     * @param {EventModel[]} events - Events to convert for display
     * @param {string} [schedulerTimezone] - Optional scheduler-level timezone to apply to all events without event-level timezone
     * @param {boolean} [isReverse] - perform reverse conversion (remove timezone offsets / convert back to scheduler/UTC)
     * @returns {EventModel[]} Events with timezone-converted times for display
     */
    static processTimeZone(events: EventModel[], schedulerTimezone?: string, isReverse: boolean = false): EventModel[] {
        if (!events || events.length === 0) {
            return events;
        }
        return events.map((event: EventModel): EventModel => {
            if (event.isAllDay) {
                return event;
            }
            if (event.startTimezone || event.endTimezone) {
                const startTimezone: string = event.startTimezone || event.endTimezone;
                const endTimezone: string = event.endTimezone || event.startTimezone;
                if (isReverse) {
                    if (schedulerTimezone) {
                        event.startTime = Timezone.convert(new Date(event.startTime), startTimezone, schedulerTimezone);
                        event.endTime = Timezone.convert(new Date(event.endTime), endTimezone, schedulerTimezone);
                        event.startTime = Timezone.remove(new Date(event.startTime), schedulerTimezone);
                        event.endTime = Timezone.remove(new Date(event.endTime), schedulerTimezone);
                    } else {
                        event.startTime = Timezone.remove(new Date(event.startTime), schedulerTimezone);
                        event.endTime = Timezone.remove(new Date(event.endTime), schedulerTimezone);
                    }
                } else {
                    event.startTime = Timezone.add(new Date(event.startTime), startTimezone);
                    event.endTime = Timezone.add(new Date(event.endTime), endTimezone);
                    if (schedulerTimezone) {
                        event.startTime = Timezone.convert(new Date(event.startTime), startTimezone, schedulerTimezone);
                        event.endTime = Timezone.convert(new Date(event.endTime), endTimezone, schedulerTimezone);
                    }
                }
            } else if (schedulerTimezone) {
                if (isReverse) {
                    event.startTime = Timezone.remove(new Date(event.startTime), schedulerTimezone);
                    event.endTime = Timezone.remove(new Date(event.endTime), schedulerTimezone);
                } else {
                    event.startTime = Timezone.add(new Date(event.startTime), schedulerTimezone);
                    event.endTime = Timezone.add(new Date(event.endTime), schedulerTimezone);
                }
            }
            return event;
        });
    }

    /**
     * Converts a single event time from scheduler timezone to event timezone (or vice versa)
     * Returns the original time if any parameter is missing.
     *
     * @param {Date} time - The date/time to convert
     * @param {string} tz - The source timezone (typically scheduler timezone)
     * @param {string} eventTz - The target event timezone
     * @returns {Date} Converted date or original/undefined
     */
    static convertEventTime(time: Date, tz?: string, eventTz?: string): Date {
        if (!tz || !eventTz || !time) { return time; }
        return Timezone.convert(new Date(time), tz, eventTz);
    }

    /**
     * Gets the resource color for an event based on the resource configuration.
     * If the event doesn't have a resource field value, returns the first resource's color as default.
     *
     * @param {EventModel} event - The event to get the color for
     * @param {SchedulerResource[]} resources - Array of resource configurations
     * @param {string} [resourceColorField] - Optional name of the resource level to use for coloring
     * @returns {string | undefined} The color value from the resource, or undefined if no resources or no color field
     */
    static getResourceColor(event: EventModel, resources?: SchedulerResource[], resourceColorField?: string): string | undefined {
        if (!resources || resources.length === 0) {
            return undefined;
        }
        let targetResource: SchedulerResource;
        if (resourceColorField) {
            targetResource = resources.find((resource: SchedulerResource) => resource.name === resourceColorField);
            if (!targetResource || !targetResource.colorField) {
                targetResource = resources[resources.length - 1];
            }
        } else {
            targetResource = resources[resources.length - 1];
        }
        if (!targetResource.colorField) { return undefined; }
        let resourceID: string | number | (string | number)[] =
            event[targetResource.field] as string | number | (string | number)[];
        resourceID = typeof (resourceID) === 'object' ? resourceID[0] : resourceID;
        if (isNullOrUndefined(resourceID)) {
            return undefined;
        }
        const resourceData: Record<string, unknown> | undefined = this.findResourceData(
            targetResource,
            resourceID
        );
        if (!resourceData) {
            return this.getDefaultResourceColor(targetResource);
        }
        return resourceData[targetResource.colorField] as string | undefined;
    }

    /**
     * Finds a resource data item that matches the given resource field value.
     *
     * @param {SchedulerResource} resource - The resource configuration
     * @param {unknown} fieldValue - The value to match against the resource's idField
     * @returns {Record<string, unknown>} The matching resource data item
     */
    private static findResourceData(resource: SchedulerResource, fieldValue: unknown): Record<string, unknown> {
        if (!resource.dataSource || !Array.isArray(resource.dataSource)) {
            return undefined;
        }
        return (resource.dataSource as Record<string, unknown>[]).find(
            (item: Record<string, unknown>) => item[resource.idField] === fieldValue
        );
    }

    /**
     * Gets the color from the first resource data item (default resource).
     *
     * @param {SchedulerResource} resource - The resource configuration
     * @returns {string} The color value from the first resource
     */
    private static getDefaultResourceColor(resource: SchedulerResource): string {
        if (!resource.colorField || !resource.dataSource || !Array.isArray(resource.dataSource)) {
            return undefined;
        }
        const firstResourceData: Record<string, unknown> = (resource.dataSource as Record<string, unknown>[])[0];
        if (!firstResourceData) {
            return undefined;
        }
        return firstResourceData[resource.colorField] as string;
    }

    /**
     * Splits a single event into multiple events when it has resources configured with multiple: true.
     * Each split event gets a unique ID and GUID. Used during save operation to ensure proper event creation.
     *
     * @param {EventModel} event - The event to split
     * @param {SchedulerResource[]} resources - The resource configurations
     * @param {EventModel[]} [eventsData] - Optional array of existing events for ID generation
     * @returns {EventModel[]} Array of events, one per resource ID, each with unique ID and GUID
     */
    static splitEventForMultipleResources(event: EventModel, resources?: SchedulerResource[], eventsData?: EventModel[]): EventModel[] {
        if (!resources || resources.length === 0) {
            return [event];
        }
        let splitEvents: EventModel[] = [event];
        let nextEventId: string | number = getEventMaxID(eventsData);
        const isNumericId: boolean = typeof nextEventId === 'number';

        for (const resource of resources) {
            if (resource.multiple === true) {
                const resourceIds: string | number | (string | number)[] = event[resource.field] as string | number | (string | number)[];
                if (Array.isArray(resourceIds) && resourceIds.length > 1) {
                    const newSplitEvents: EventModel[] = [];

                    splitEvents.forEach((currentEvent: EventModel) => {
                        resourceIds.forEach((resourceId: string | number) => {
                            const clonedEvent: EventModel = {
                                ...currentEvent,
                                id: isNumericId ? nextEventId : this.generateEventGuid(),
                                guid: this.generateEventGuid()
                            };

                            if (isNumericId) {
                                nextEventId = (nextEventId as number) + 1;
                            }
                            clonedEvent[resource.field] = resourceId;
                            newSplitEvents.push(clonedEvent);
                        });
                    });
                    splitEvents = newSplitEvents;
                }
            }
        }
        return splitEvents;
    }

    /**
     * Checks if an event matches a specific resource leaf (for resource grouping).
     * Validates that the event's resource field values align with the leaf resource's groupOrder chain.
     *
     * @param {EventModel} event - The event to check
     * @param {CellData} resourceLeaf - The leaf-level resource object with groupOrder and resourceData properties
     * @param {SchedulerResource[]} resources - Array of resource configurations (defines field mappings)
     * @returns {boolean} True if event belongs to this resource leaf
     *
     * @private
     */
    static matchesResource(
        event: EventModel,
        resourceLeaf: CellData | ResourceLevel,
        resources?: SchedulerResource[]
    ): boolean {
        if (!resources || resources.length === 0 || !resourceLeaf || !resourceLeaf.groupOrder
            || !Array.isArray(resourceLeaf.groupOrder)) {
            return true;
        }
        for (let i: number = 0; i < resources.length; i++) {
            const resource: SchedulerResource = resources[parseInt(i.toString(), 10)];
            const expectedGroupId: string = resourceLeaf.groupOrder[parseInt(i.toString(), 10)];
            const eventResourceValue: string | number | (string | number)[] =
                event[resource.field] as string | number | (string | number)[];
            if (isNullOrUndefined(eventResourceValue)) {
                return false;
            }
            const eventResourceIds: (string | number)[] = Array.isArray(eventResourceValue)
                ? (eventResourceValue as (string | number)[])
                : [eventResourceValue as string | number];
            const matches: boolean = eventResourceIds.some((id: string | number) =>
                String(id) === String(expectedGroupId)
            );
            if (!matches) {
                return false;
            }
        }
        return true;
    }
}
