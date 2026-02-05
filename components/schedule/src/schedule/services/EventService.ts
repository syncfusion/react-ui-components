import { CSSProperties, RefObject } from 'react';
import { EventModel, TimeScaleModel } from '../types/schedule-types';
import { ProcessedEventsData } from '../types/internal-interface';
import { DateService, MS_PER_DAY } from './DateService';
import { PositioningService } from './PositioningService';
import { ISchedule } from '../schedule';
import { getCellFromIndex } from '../utils/actions';
import { CSS_CLASSES } from '../common/constants';

export const ALL_DAY_EVENT_HEIGHT: number = 24;
export const EVENTS_GAP: number = 4;
export const ROW_HEIGHT: number = 40;

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
     * @param {Record<string, unknown>[]} events - Raw event data to process
     * @param {Record<string, string>} [fields] - Field mapping configuration
     * @returns {EventModel[]} Array of EventModel objects with mapped properties
     */
    static mapEventData(events: Record<string, unknown>[], fields?: Record<string, string>): EventModel[] {
        if (!events || events.length === 0) {
            return [];
        }

        // Default field mappings if none provided
        const fieldMappings: Record<string, string> = fields || {
            id: 'Id',
            subject: 'Subject',
            startTime: 'StartTime',
            endTime: 'EndTime',
            isAllDay: 'IsAllDay',
            location: 'Location',
            description: 'Description',
            isReadonly: 'IsReadonly',
            isBlock: 'IsBlock'
        };

        return events.map((eventData: Record<string, unknown>): EventModel => {
            const mappedEvent: Partial<EventModel> = {};
            if (fieldMappings.id && Object.prototype.hasOwnProperty.call(eventData, fieldMappings.id)) {
                mappedEvent.id = eventData[fieldMappings.id] as string | number;
            }
            if (fieldMappings.subject && Object.prototype.hasOwnProperty.call(eventData, fieldMappings.subject)) {
                mappedEvent.subject = eventData[fieldMappings.subject] as string;
            }
            if (fieldMappings.startTime && Object.prototype.hasOwnProperty.call(eventData, fieldMappings.startTime)) {
                const startTimeVal: any = eventData[fieldMappings.startTime];
                if (startTimeVal instanceof Date) {
                    mappedEvent.startTime = startTimeVal;
                } else if (typeof startTimeVal === 'string' || typeof startTimeVal === 'number') {
                    mappedEvent.startTime = new Date(startTimeVal);
                }
            }
            if (fieldMappings.endTime && Object.prototype.hasOwnProperty.call(eventData, fieldMappings.endTime)) {
                const endTimeVal: any = eventData[fieldMappings.endTime];
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

            // Preserve any additional fields from the original event that are not mapped
            const mappedSourceKeys: Set<string> = new Set(Object.values(fieldMappings));
            const preservedExtras: Record<string, unknown> = Object.fromEntries(
                Object.entries(eventData).filter(([key]: [string, unknown]) => !mappedSourceKeys.has(key))
            );
            Object.assign(mappedEvent as Record<string, unknown>, preservedExtras);

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

    static calculateOverlappingEvents(events: ProcessedEventsData[], allowOverlap: boolean = true): ProcessedEventsData[][] {
        if (!events || events.length === 0) {
            return [];
        }
        if (!allowOverlap) {
            return this.resolveOverlappingEvents(events);
        }
        const sortedEvents: ProcessedEventsData[] = this.sortEventsByStartTimeAndDuration(events);
        return this.identifyOverlapGroups(sortedEvents);
    }

    static identifyOverlapGroups(sortedEvents: ProcessedEventsData[]): ProcessedEventsData[][] {
        const overlapGroups: ProcessedEventsData[][] = [];
        for (const currentEvent of sortedEvents) {
            let addedToGroup: boolean = false;
            for (const group of overlapGroups) {
                let overlapsWithAllInGroup: boolean = true;
                for (const groupEvent of group) {
                    if (!this.eventsOverlap(currentEvent, groupEvent)) {
                        overlapsWithAllInGroup = false;
                        break;
                    }
                }
                // If it overlaps with all events in this group, add it to the group
                if (overlapsWithAllInGroup) {
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
        const eventGroups: ProcessedEventsData[][] = [];
        for (const group of overlapGroups) {
            const groupEvents: ProcessedEventsData[] = [];
            // If there's only one event in the group, it's straightforward
            if (group.length === 1) {
                groupEvents.push({
                    ...group[0],
                    positionIndex: 0,
                    totalOverlapping: 1
                });
            } else {
                // For multiple events, assign proper position indices
                const sortedGroupEvents: ProcessedEventsData[] = [...group].sort((a: ProcessedEventsData, b: ProcessedEventsData) => {
                    if (!a.event.startTime || !b.event.startTime) { return 0; }
                    return a.event.startTime.getTime() - b.event.startTime.getTime();
                });
                for (const [index, currentEvent] of sortedGroupEvents.entries()) {
                    groupEvents.push({
                        ...currentEvent,
                        positionIndex: index,
                        totalOverlapping: sortedGroupEvents.length
                    });
                }
            }
            eventGroups.push(groupEvents);
        }
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
        return (
            (event1.event.startTime < event2.event.endTime && event1.event.endTime > event2.event.startTime) ||
            (event2.event.startTime < event1.event.endTime && event2.event.endTime > event1.event.startTime)
        );
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

    static processDayEvents(renderDates: Date[], eventsData: EventModel[]): ProcessedEventsData[] {
        if (!renderDates?.length || !eventsData?.length) { return []; }

        // Filter events within the render dates range
        const filteredEvents: EventModel[] = EventService.filterEventsByDateRange(eventsData, renderDates);
        const events: ProcessedEventsData[] = [];

        // Prepare shared occupied positions for all days in range
        let sharedPositionMap: Map<string, boolean[]> = new Map<string, boolean[]>();
        renderDates.forEach((date: Date) => {
            const dateKey: string = DateService.generateDateKey(date);
            sharedPositionMap.set(dateKey, []);
        });

        const sortedEventsByTime: EventModel[] = DateService.sortByTimeAndSpan(filteredEvents);

        sortedEventsByTime.forEach((event: EventModel) => {
            if (!event.startTime || !event.endTime) { return; }

            const eventClasses: string[] = EventService.getEventClassNames(event);
            const startDate: Date = DateService.normalizeDate(event.startTime);
            const endDate: Date = DateService.normalizeDate(event.endTime);
            const isMultiDay: boolean = EventService.isMultiDayEvent(event);
            const totalSegments: number = isMultiDay ? DateService.getDaysCount(event.startTime, event.endTime, event.isAllDay) : 1;
            const includeEndMidnight: boolean = event.isAllDay ? true : !DateService.isMidnight(event.endTime);
            // Calculate stacking index across span
            const positionIndex: number = !event.isBlock ?
                EventService.findNonConflictingPosition(renderDates, startDate, endDate, includeEndMidnight, sharedPositionMap) : null;

            if (isMultiDay) {
                for (const date of renderDates) {
                    const currentDate: Date = DateService.normalizeDate(date);
                    const shouldIncludeDate: boolean = currentDate >= startDate && (currentDate < endDate ||
                        (currentDate.getTime() === endDate.getTime() && includeEndMidnight)
                    );
                    if (!shouldIncludeDate) { continue; }

                    if (!event.isBlock) {
                        sharedPositionMap = PositioningService.setIndexPosition(sharedPositionMap, date, positionIndex);
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
                        isMonthEvent: true
                    });
                }
            } else {
                if (!event.isBlock) {
                    sharedPositionMap = PositioningService.setIndexPosition(sharedPositionMap, startDate, positionIndex);
                }
                const eventKey: string = `${startDate.toISOString()}-${event.id}`;
                events.push({
                    event: event,
                    startDate: event.startTime,
                    endDate: event.endTime,
                    positionIndex,
                    eventClasses,
                    eventKey,
                    isMonthEvent: true
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

    /**
     * Calculates pixel position and size for a cloned month event using DOM measurements.
     *
     * @param {RefObject<ISchedule>} scheduleRef - Reference to the Schedule instance.
     * @param {ProcessedEventsData} eventInfo - Event metadata including rowIndex/columnIndex and dates.
     * @param {number} cellWidth - Width of a single date cell in pixels.
     * @param {boolean} isAllDaySource - Indicates all day row events.
     * @param {boolean} isRtl - Defines its RTL.
     * @returns {CSSProperties} Inline style object containing top, left, and width (in pixels).
     */
    static cloneEventPosition(
        scheduleRef: RefObject<ISchedule>,
        eventInfo: ProcessedEventsData,
        cellWidth: number,
        isAllDaySource: boolean,
        isRtl: boolean = false
    ): CSSProperties {
        const eventStartDay: Date = DateService.normalizeDate(eventInfo.startDate);
        const eventEndDay: Date = DateService.normalizeDate(eventInfo.endDate);
        const { visibleDayCount } = DateService.getVisibleAndStartDays(eventInfo.week, eventStartDay, eventEndDay, eventInfo.event);
        const widthPx: number = Math.max(0, (cellWidth * visibleDayCount) - EVENTS_GAP);

        let targetCell: HTMLElement;
        let topPx: number;
        if (isAllDaySource) {
            const alldayRow: HTMLElement = scheduleRef.current?.element.querySelector(`.${CSS_CLASSES.ALL_DAY_ROW}`);
            const alldayCells: NodeListOf<HTMLElement> = alldayRow.querySelectorAll<HTMLElement>(`.${CSS_CLASSES.ALL_DAY_CELL}`);
            targetCell = alldayCells.item(eventInfo.columnIndex);
            topPx = alldayRow.offsetTop;
        }
        else {
            targetCell = getCellFromIndex(scheduleRef.current?.element, eventInfo.rowIndex, eventInfo.columnIndex);
            topPx = (targetCell.querySelector(`.${CSS_CLASSES.APPOINTMENT_WRAPPER}`) as HTMLElement).offsetTop;
        }

        const style: CSSProperties = { top: `${topPx}px`, width: `${widthPx}px` };
        if (isRtl) {
            const rightpx: number = targetCell.parentElement ? Math.max(0, (targetCell.parentElement.clientWidth -
                (targetCell.offsetLeft + targetCell.offsetWidth))) : 0;
            style.right = `${rightpx}px`;
        } else {
            style.left = `${targetCell.offsetLeft}px`;
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

            const overlaps: boolean = (originalEventStart < weekEndExclusive) && (originalEventEnd > weekStart);
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
        scheduleRef: RefObject<ISchedule>,
        renderDates: Date[],
        event: EventModel,
        showWeekend: boolean,
        workDays: number[],
        cellWidth: number,
        isAllDaySource: boolean,
        isRtl: boolean = false
    ): ProcessedEventsData[] {
        const rowDates: Date[][] = isAllDaySource ? [renderDates] :
            DateService.getRenderWeeks(renderDates, showWeekend, workDays);
        const segments: ProcessedEventsData[] = this.splitEventByWeek(rowDates, event);
        const isMultiDay: boolean = EventService.isMultiDayEvent(event);

        segments.forEach((segment: ProcessedEventsData) => {
            segment.eventStyle = this.cloneEventPosition(scheduleRef, segment, cellWidth, isAllDaySource, isRtl);
            segment.totalSegments = isMultiDay ? DateService.getDaysCount(segment.startDate, segment.endDate, segment.event?.isAllDay) : 1;
        });

        return segments;
    }

    static processTimeSlotCloneEvent(
        scheduleRef: RefObject<ISchedule>,
        renderDates: Date[],
        event: EventModel,
        timeScale: TimeScaleModel,
        startHour: string,
        endHour: string,
        cellWidth: number,
        isRtl: boolean = false
    ): ProcessedEventsData[] {
        const segments: ProcessedEventsData[] = this.splitEventByDay(event, renderDates);
        segments.forEach((segment: ProcessedEventsData) => {
            const topPx: string = PositioningService.calculateTopPosition(segment.startDate, timeScale, startHour);
            const heightPx: string = PositioningService.calculateHeight(segment, timeScale, startHour, endHour);
            const targetCell: HTMLElement = getCellFromIndex(scheduleRef.current?.element, 0, segment.columnIndex); // first index '0'
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
}
