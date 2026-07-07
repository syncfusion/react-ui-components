import { getRecurrenceDates, getRecurrenceStringFromDate } from '../../../recurrence-editor';
import { extend } from '@syncfusion/react-base';
import { EventModel } from '../types/scheduler-types';
import { CrudAction } from '../types/enums';
import { getRecurrenceMaxId } from './event-base';
import { DateService } from '../services/DateService';

/**
 * Extracts the end date from a recurrence rule
 * Uses getRecurrenceDates to get actual recurrence dates and returns the last one
 * This approach matches crud.ts logic which generates actual dates instead of parsing the rule
 * Returns null for infinite recurrence rules (no UNTIL or COUNT)
 *
 * @param {string} rule - RFC 5545 recurrence rule
 * @param {Date} startTime - Event start time
 * @returns {Date|null} - The end date of the series, or null if infinite
 * @private
 */
function extractRuleEndDate(rule: string, startTime: Date): Date | null {
    if (!rule) { return new Date(startTime); }
    const hasUntil: boolean = /UNTIL=/i.test(rule);
    const hasCount: boolean = /COUNT=/i.test(rule);
    if (!hasUntil && !hasCount) { return null; }
    const occurrenceDates: number[] = getRecurrenceDates(startTime, rule, undefined, 0);
    if (occurrenceDates?.length > 0) {
        return new Date(occurrenceDates[occurrenceDates.length - 1]);
    }
    return new Date(new Date(startTime));
}

/**
 * Splits a recurrence rule into two separate rules at a specific date
 * Original rule ends with UNTIL=dayBefore, new rule starts from targetDate with UNTIL=seriesEnd
 * Uses getRecurrenceStringFromDate to format dates matching crud.ts approach
 * Handles infinite recurrence (seriesEndDate = null) by not adding UNTIL to followingRule
 *
 * @param {string} originalRule - Original RFC 5545 rule (e.g., FREQ=DAILY;COUNT=5)
 * @param {Date} splitDate - Date to split at (when "following events" edit happens)
 * @param {Date|null} seriesEndDate - Original series end date, or null for infinite recurrence
 * @returns {Object} - { parentRule: string, followingRule: string }
 * @private
 */
function splitRecurrenceRuleByDate(
    originalRule: string,
    splitDate: Date,
    seriesEndDate: Date | null
): { parentRule: string; followingRule: string } {
    if (!originalRule) { return { parentRule: '', followingRule: '' }; }

    const dayBefore: Date = new Date(splitDate);
    dayBefore.setDate(dayBefore.getDate() - 1);
    const parentUntil: string = getRecurrenceStringFromDate(dayBefore);
    const baseRule: string = originalRule.replace(/;?COUNT=\d+/gi, '').replace(/;?UNTIL=\d+T?\d*Z?/gi, '');
    const parentRule: string = baseRule.replace(/;$/, '') + ';UNTIL=' + parentUntil;
    let followingRule: string = baseRule.replace(/;$/, '');
    if (seriesEndDate !== null) {
        const followingUntil: string = getRecurrenceStringFromDate(seriesEndDate);
        followingRule += ';UNTIL=' + followingUntil;
    }
    return { parentRule, followingRule };
}

/**
 * Gets the following parent event from following occurrences
 *
 * @param {EventModel} occurrence - The event with followingId
 * @param {EventModel[]} eventsProcessed - All processed events
 * @returns {EventModel | undefined} - The following parent event
 * @private
 */
export function getFollowingParent(
    occurrence: EventModel,
    eventsProcessed: EventModel[]
): EventModel | undefined {
    return eventsProcessed?.find((e: EventModel) => e.id === occurrence.followingId ||
        e.followingId === occurrence.id);
}

/**
 * Merges recurrence rule end dates from following event with parent event structure
 * If following event has UNTIL or COUNT, replaces parent's end constraint with following's
 * If following event has no end constraint (infinite), removes end date from parent rule
 *
 * @param {EventModel} parentEvent - The parent event with original recurrence rule
 * @param {EventModel[]} eventsProcessed - Array of processed events to find following event
 * @returns {string | undefined} - Merged recurrence rule or undefined if no following event found
 * @private
 */
export function getMergedRecurrenceRule(
    parentEvent: EventModel,
    eventsProcessed?: EventModel[]
): string | undefined {
    const followingEvent: EventModel | undefined = eventsProcessed?.find((e: EventModel) => parentEvent.id === e.followingId);
    if (followingEvent?.recurrenceRule && parentEvent?.recurrenceRule) {
        const rule: string = followingEvent.recurrenceRule;
        const untilMatch: RegExpMatchArray = rule.match(/UNTIL=[^;]*/);
        const countMatch: RegExpMatchArray = rule.match(/COUNT=[^;]*/);
        const cleanedParentRule: string = parentEvent.recurrenceRule.replace(/;?UNTIL=[^;]*/g, '').replace(/;?COUNT=[^;]*/g, '');
        return (untilMatch || countMatch)
            ? cleanedParentRule + ';' + (untilMatch?.[0] || countMatch?.[0])
            : cleanedParentRule;
    }
    return undefined;
}

/**
 * Handles editing the current and following occurrences of a recurring event
 * Creates new parent event for following series with split rule
 * Updates original parent to end before following date
 *
 * @param {EventModel} originalEvent - The occurrence being edited
 * @param {EventModel} parentEvent - New event data (startTime, endTime, subject, etc.)
 * @param {EventModel[]} eventsData - Original events datasource for ID generation
 * @returns {Object} - { updatedParent, newFollowingParent, changedOccurrence }
 * @private
 */
export function editFollowingEvents(
    originalEvent: EventModel,
    parentEvent: EventModel,
    eventsData: EventModel[]
): { updatedParent: EventModel; originalEvent: EventModel; changedOccurrence: EventModel | undefined; } {
    if (!parentEvent || !parentEvent.recurrenceRule) {
        return { updatedParent: {} as EventModel, originalEvent: originalEvent, changedOccurrence: undefined };
    }
    const seriesEndDate: Date | null = extractRuleEndDate(originalEvent.recurrenceRule, parentEvent.startTime);
    DateService.setHours(seriesEndDate, originalEvent.startTime);
    const { parentRule } = splitRecurrenceRuleByDate(
        parentEvent.recurrenceRule,
        originalEvent.startTime as Date,
        seriesEndDate
    );
    const { followingRule } = splitRecurrenceRuleByDate(
        originalEvent.recurrenceRule,
        originalEvent.startTime as Date,
        seriesEndDate
    );
    originalEvent.recurrenceRule = followingRule;
    let changedOccurrence: EventModel = undefined;
    if (originalEvent.id !== originalEvent.recurrenceID) {
        changedOccurrence = extend({}, originalEvent, null, true) as EventModel;
        if (parentEvent?.recurrenceException?.length && String(originalEvent.recurrenceException)?.length) {
            const toRemove: string = String(originalEvent.recurrenceException)?.trim();
            parentEvent.recurrenceException = parentEvent.recurrenceException.split(/\s*,\s*/).
                filter((id: string) => id !== toRemove).join(',');
            parentEvent.recurrenceException = parentEvent.recurrenceException.length ? parentEvent.recurrenceException : undefined;
        }
    }
    let updatedParent: EventModel = {};
    if (parentEvent.followingId) {
        updatedParent = extend({}, parentEvent, null, true) as EventModel;
        updatedParent.recurrenceRule = parentRule;
        delete updatedParent.recurrenceID;
    } else {
        updatedParent = {
            ...parentEvent,
            id: parentEvent.id,
            recurrenceRule: parentRule,
            recurrenceException: parentEvent.recurrenceException
        };
    }
    originalEvent.id = getRecurrenceMaxId(eventsData) + 1;
    if (isValidFollowingTime(originalEvent.startTime, parentEvent.startTime)) {
        originalEvent.followingId = parentEvent.id;
    } else if (parentEvent.followingId) {
        originalEvent.followingId = null;
    }
    originalEvent.recurrenceException = parentEvent.recurrenceException;
    delete originalEvent.recurrenceID;
    return { updatedParent, originalEvent, changedOccurrence };
}

/**
 * Gets the following parent event from following occurrences
 *
 * @param {Date} occurrenceTime - The start time of the occurrence being edited
 * @param {Date} parentTime - The start time of the parent event
 * @returns {boolean} - Whether the occurrence is a following event
 * @private
 */
export function isValidFollowingTime(occurrenceTime: Date, parentTime: Date): boolean {
    return parentTime.getHours() === occurrenceTime.getHours() && parentTime.getMinutes() === occurrenceTime.getMinutes() &&
        parentTime.getSeconds() === occurrenceTime.getSeconds();
}

/**
 * Gets following parent events and their occurrences linked to a parent event
 *
 * @param {EventModel} parentEvent - The parent event to find following events for
 * @param {EventModel[]} eventsProcessed - All processed events
 * @returns {Object} - { followingParentEvents, followingOccurrences }
 * @private
 */
export function getFollowingParentEventsAndOccurrences(
    parentEvent: EventModel,
    eventsProcessed: EventModel[]
): { followingParentEvents: EventModel[]; followingOccurrences: EventModel[] } {
    const followingParentEvents: EventModel[] = (eventsProcessed || [])?.filter((e: EventModel) => {
        return e.followingId && e.followingId === parentEvent?.id && !e.recurrenceID;
    });
    const followingOccurrences: EventModel[] = (eventsProcessed || [])?.filter((e: EventModel) => {
        return e.recurrenceID && followingParentEvents.some((fp: EventModel) => fp.id === e.recurrenceID);
    });
    return { followingParentEvents, followingOccurrences };
}

/**
 * Handles deleting the current and following occurrences of a recurring event
 * Updates original parent rule to end before the deletion date
 *
 * @param {EventModel} originalEvent - The occurrence being deleted
 * @param {EventModel[]} eventsProcessed - All processed events
 * @param {EventModel} originalParent - (Optional) The original parent event, if already determined to avoid redundant lookup
 * @returns {Object} - { updatedParent, deletedIds }
 * @private
 */
export function deleteFollowingEvents(
    originalEvent: EventModel,
    eventsProcessed: EventModel[],
    originalParent: EventModel
): { updatedParent: EventModel; deletedEvents: EventModel[] } {
    if (!originalParent || !originalParent.recurrenceRule) {
        return { updatedParent: {} as EventModel, deletedEvents: [] };
    }
    const seriesEndDate: Date | null = extractRuleEndDate(originalEvent.recurrenceRule, originalParent.startTime);
    const { parentRule } = splitRecurrenceRuleByDate(originalParent.recurrenceRule, originalEvent.startTime, seriesEndDate);
    const updatedParent: EventModel = {
        ...originalParent,
        id: originalParent.id,
        recurrenceRule: parentRule
    };
    const parentId: unknown = originalParent.id;
    const deletedEvents: EventModel[] = eventsProcessed?.filter((event: EventModel) =>
        event.recurrenceID === parentId &&
        event.startTime &&
        (event.startTime).getTime() >= (originalEvent.startTime).getTime()
    );
    return { updatedParent, deletedEvents };
}

/**
 * Validates recurrence pattern to ensure start/end times are within the interval bounds.
 * For example, if interval is 1 (DAILY), start and end should be within the same day.
 *
 * @param {EventModel} eventData - Event to validate
 * @returns {string | null} Message key if invalid, null if valid
 */
export function validateRecurrencePattern(eventData: EventModel): string | null {
    const recurrenceRule: string = eventData.recurrenceRule as string;
    if (!recurrenceRule) { return null; }
    const startTime: Date = eventData.startTime;
    const endTime: Date = eventData.endTime;
    if (!startTime || !endTime) { return null; }
    const freqMatch: RegExpMatchArray | null = recurrenceRule.match(/FREQ=(\w+)/);
    const intervalMatch: RegExpMatchArray | null = recurrenceRule.match(/INTERVAL=(\d+)/);
    const freqType: string = freqMatch?.[1] || 'DAILY';
    const interval: number = intervalMatch ? parseInt(intervalMatch[1], 10) : 1;
    const timeDiffHours: number = (endTime.getTime() - startTime.getTime()) / (1000 * 3600);
    switch (freqType) {
    case 'DAILY':
        if (timeDiffHours > interval * 24) { return 'createError'; }
        break;

    case 'WEEKLY': {
        const byDayMatch: RegExpMatchArray | null = recurrenceRule.match(/BYDAY=([^;]+)/);
        if (byDayMatch) {
            const types: string[] = byDayMatch[1].split(',');
            const dayObj: Record<string, number> = { 'SU': 0, 'MO': 1, 'TU': 2, 'WE': 3, 'TH': 4, 'FR': 5, 'SA': 6 };
            const temp: number[] = [];
            const tempDiff: number[] = [];
            for (let index: number = 0; index < types.length * (interval + 1); index++) {
                if (types.length > index) {
                    temp[index as number] = dayObj[types[index as number].trim()];
                } else {
                    temp[index as number] = temp[index - types.length] + (7 * interval);
                }
            }
            const tempValue: number[] = temp.sort((a: number, b: number) => a - b);
            for (let index: number = 1; index < tempValue.length; index++) {
                tempDiff.push(tempValue[index as number] - tempValue[index - 1 as number]);
            }
            if ((timeDiffHours >= (Math.min(...tempDiff) * 24)) || !interval) { return 'createError'; }
        }
        break;
    }

    case 'MONTHLY':
        if (endTime.getTime() >= new Date(startTime).setMonth(startTime.getMonth() + interval)) { return 'createError'; }
        break;

    case 'YEARLY':
        if (endTime.getTime() >= new Date(startTime).setFullYear(startTime.getFullYear() + interval)) { return 'createError'; }
        break;
    }
    return null;
}

/**
 * Filters events by recurrence ID and returns matching events along with parent event.
 * Used when we need to identify the parent event while filtering by recurrence ID.
 *
 * @param {EventModel[]} events The events array to filter
 * @param {string | number} recurrenceID The recurrence ID to match against
 * @param {boolean} forFollowingEvent Filter parent related events
 * @returns {Object} Filtered events and parent event
 */
export function filterEventsByRecurrenceIdWithParent(
    events: EventModel[],
    recurrenceID: string | number,
    forFollowingEvent: boolean = true
): { events: EventModel[]; parentEvent?: EventModel } {
    let parentEvent: EventModel | undefined;
    const filteredEvents: EventModel[] = (events || []).filter((e: EventModel) => {
        if (e.id === recurrenceID) {
            parentEvent = e;
        }
        return forFollowingEvent ? (e.recurrenceID || e.id) === recurrenceID : e.recurrenceID === recurrenceID;
    });
    return { events: filteredEvents, parentEvent };
}

/**
 * Converts a recurrence alert selection option to the appropriate edit action.
 * Maps user selection from recurrence dialog to the corresponding edit CrudAction.
 * Handles special case for EditFollowingEvents where selectOption needs conversion.
 * Common function used across multiple components for edit operations.
 *
 * @param {string} selectOption - The selected option from recurrence alert
 * @param {string} currentAction - The current action context ('EditFollowingEvents', 'EditSeries', etc.)
 * @returns {CrudAction} - The corresponding edit action
 * @private
 */
export function getRecurrenceEditAction(selectOption: string, currentAction: string): CrudAction {
    if (currentAction === 'EditFollowingEvents') {
        return selectOption === 'EditSeries' ? 'EditFollowingEvents' : 'EditCurrentFollowingEvents';
    }
    return selectOption as CrudAction;
}

/**
 * Maps the current editor action context to the appropriate delete action.
 * Used during delete confirmation when user is in EditFollowingEvents or EditSeries context.
 * Common function used in editor delete handlers to determine which delete operation to perform.
 *
 * @param {string} action - The current editor action ('EditFollowingEvents', 'EditSeries', 'EditOccurrence', etc.)
 * @param {boolean} hasRecurrenceID - Whether the event has a recurrenceID (indicates occurrence)
 * @returns {CrudAction} - The corresponding delete action
 * @private
 */
export function getActionBasedDeleteAction(action: string, hasRecurrenceID: boolean): CrudAction {
    if (action === 'EditFollowingEvents') {
        return 'DeleteFollowingEvents';
    }
    if (action === 'EditSeries' && hasRecurrenceID) {
        return 'DeleteSeries';
    }
    return 'DeleteOccurrence';
}

/**
 * Determines the appropriate save action when series events have changed.
 * Maps the editor action context and event IDs to determine if we're editing current + following or just the series.
 * Used after user confirms series change in the recurrence alert dialog.
 *
 * @param {string} action - The current editor action ('EditFollowingEvents', 'EditSeries')
 * @param {any} eventDataId - The modified event's ID
 * @param {any} eventDataRecurrenceID - The modified event's recurrence ID
 * @returns {CrudAction} - The appropriate save action
 * @private
 */
export function getActionBasedSaveAction(action: string, eventDataId: string | number, eventDataRecurrenceID: string | number): CrudAction {
    const currentAction: CrudAction = (action === 'EditFollowingEvents' ? 'EditFollowingEvents' : 'EditSeries') as CrudAction;
    if (action === 'EditFollowingEvents' && eventDataId !== eventDataRecurrenceID) {
        return 'EditCurrentFollowingEvents';
    }
    return currentAction;
}
