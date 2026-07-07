import { getRecurrenceDates } from '../../../recurrence-editor';
import { extend, isNullOrUndefined } from '@syncfusion/react-base';
import { EventModel, EventFields } from '../types/scheduler-types';
import { AlertAction, AlertType, CrudAction } from '../types/enums';
import { DateService, MS_PER_DAY } from '../services/DateService';
import { EventService } from '../services/EventService';
import { IScheduler } from '../index';
import { AlertDialog } from '../types/internal-interface';
import { makeExternalRecord } from './record-mapper';

/**
 * Expands recurring events into individual event instances within a date range
 * Handles both original parent events (recurrenceRule + no recurrenceID)
 * and following parent events (recurrenceRule + followingId + no recurrenceID)
 *
 * @param {EventModel[]} events - The events to process
 * @param {Date[]} dateRange - The date range to expand events for
 * @param {number} firstDayOfWeek - First day of week
 * @private
 * @returns {EventModel[]} - Expanded events including recurring instances with correct parent references
 */
export function expandRecurringEvents(events: EventModel[], dateRange: Date[], firstDayOfWeek?: number): EventModel[] {
    if (!events || events.length === 0 || !dateRange || dateRange.length === 0) {
        return events;
    }
    const expandedEvents: EventModel[] = [];
    for (const event of events) {
        if (event.recurrenceRule && !event.recurrenceID) {
            const occurrences: EventModel[] = generateRecurrenceEvents(event, dateRange, firstDayOfWeek);
            expandedEvents.push(...occurrences);
        } else {
            expandedEvents.push(event);
        }
    }
    return expandedEvents;
}

/**
 * Generates occurrences based on a recurrence pattern.
 *
 * The `viewDate` optimisation in `getRecurrenceDates` skips occurrences whose
 * start time precedes `viewDate`. To avoid missing cross-page occurrences (where
 * an occurrence starts before `dateRange[0]` but its end time falls within the
 * current render range), we look back by the event duration before `dateRange[0]`.
 * This ensures the engine sees the occurrence even when the view has navigated
 * past its start date.
 *
 * @param {EventModel} event - The base event
 * @param {Date[]} dateRange - Current render dates
 * @param {number} firstDayOfWeek - First day of week
 * @private
 * @returns {EventModel[]} - Generated occurrences
 */
function generateRecurrenceEvents(
    event: EventModel,
    dateRange: Date[],
    firstDayOfWeek?: number
): EventModel[] {
    let effectiveViewDate: Date | null = null;
    if (dateRange?.length) {
        const duration: number = (event.endTime as Date).getTime() - (event.startTime as Date).getTime();
        const lookbackMs: number = Math.ceil(duration / MS_PER_DAY) * MS_PER_DAY;
        const lookbackDate: Date = new Date(dateRange[0].getTime() - lookbackMs);
        effectiveViewDate = lookbackDate > (event.startTime as Date) ? lookbackDate : null;
    }
    const occurrenceDates: number[] = getRecurrenceDates(
        event.startTime as Date,
        event.recurrenceRule as string,
        event.recurrenceException as string,
        firstDayOfWeek ?? 0, undefined, effectiveViewDate
    );
    const occurrenceDuration: number = event.endTime.getTime() - event.startTime.getTime();
    const occurrenceCollection: EventModel[] = [];
    for (let i: number = 0; i < occurrenceDates.length; i++) {
        const occurrenceDate: number = occurrenceDates[i as number];
        const clonedEvent: EventModel = <EventModel>extend({}, event, null, true);
        clonedEvent.startTime = new Date(occurrenceDate);
        clonedEvent.endTime = new Date(new Date(occurrenceDate).getTime() + occurrenceDuration);
        clonedEvent.recurrenceID = clonedEvent.id;
        clonedEvent.guid = generateGuid();
        delete clonedEvent.recurrenceException;
        delete clonedEvent.followingId;
        occurrenceCollection.push(clonedEvent);
    }
    return occurrenceCollection;
}

/**
 * Generates a unique GUID for each occurrence
 *
 * @private
 * @returns {string} - Generated GUID in UUID v4 format
 */
function generateGuid(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (idNumber: string) => {
        const randomNumber: number = Math.random() * 16 | 0;
        const guid: number = idNumber === 'x' ? randomNumber : (randomNumber & 0x3 | 0x8);
        return guid.toString(16);
    });
}

/**
 * Validates whether a recurring event can be dragged to a new start time
 *
 * @param {EventModel} original - The event being dragged
 * @param {Date} newStartTime - The new start time for the event
 * @param {Date} newEndTime - The new end time for the event
 * @param {EventModel[]} eventsProcessed - The processed events array
 * @param {EventModel[]} eventsData - The original events data
 *
 * @private
 * @returns {Object} - Validation result with isValid, shouldAlert, and optional messageKey
 */
export function editOccurrenceValidation(
    original: EventModel,
    newStartTime: Date,
    newEndTime: Date,
    eventsProcessed: EventModel[],
    eventsData: EventModel[]
): AlertDialog {
    if (!original.recurrenceID || !original.recurrenceRule) {
        return { isValid: true, shouldAlert: false, messageKey: AlertType.SameDayAlert };
    }
    const parentEvent: EventModel | undefined = getRecurrenceParent(original, eventsProcessed);
    let reccurrenceCollection: EventModel[] = eventsData.filter((e: EventModel) =>
        e.recurrenceID === parentEvent?.id && e.recurrenceRule
    );
    reccurrenceCollection = reccurrenceCollection.sort((a: EventModel, b: EventModel) =>
        a.startTime.getTime() - b.startTime.getTime());
    const index: number = reccurrenceCollection.findIndex((e: EventModel) => e.guid === original.guid);
    if (index === -1) {
        return { isValid: true, shouldAlert: false };
    }
    const previousEventDate: number = DateService.normalizeDate(reccurrenceCollection[index - 1]?.startTime)?.getTime();
    const nextEventDate: number = DateService.normalizeDate(reccurrenceCollection[index + 1]?.startTime)?.getTime();
    const normalizedNewDate: number = DateService.normalizeDate(newStartTime).getTime();
    if (!previousEventDate && !nextEventDate) {
        return { isValid: true, shouldAlert: false };
    }
    if (index === 0 && (normalizedNewDate < nextEventDate || !nextEventDate)) {
        return { isValid: true, shouldAlert: false };
    }
    if (index === reccurrenceCollection.length - 1 && (normalizedNewDate > previousEventDate || !previousEventDate)) {
        return { isValid: true, shouldAlert: false };
    }
    if (normalizedNewDate > previousEventDate && normalizedNewDate < nextEventDate) {
        if (reccurrenceCollection[index + 1]?.startTime.getTime() < newEndTime.getTime()) {
            return { isValid: false, shouldAlert: true, messageKey: AlertType.SameDayAlert };
        }
        return { isValid: true, shouldAlert: false };
    }
    if ((normalizedNewDate < previousEventDate && normalizedNewDate < nextEventDate) ||
        (normalizedNewDate > previousEventDate && normalizedNewDate > nextEventDate) ||
        (!previousEventDate && normalizedNewDate > nextEventDate) || (!nextEventDate && normalizedNewDate < previousEventDate)) {
        return { isValid: false, shouldAlert: true, messageKey: AlertType.OccurrenceAlert };
    }
    return { isValid: false, shouldAlert: true, messageKey: AlertType.SameDayAlert };
}

/**
 * Validates whether a recurring event can be dragged to a new start time
 *
 * @param {EventModel} original - The event being dragged
 * @param {EventModel[]} eventsProcessed - The processed events array
 * @private
 * @returns {EventModel} - Returns parent event
 */
export function getRecurrenceParent(
    original: EventModel,
    eventsProcessed: EventModel[]
): EventModel | undefined {
    return eventsProcessed?.find((e: EventModel) => e.id === original.recurrenceID);
}

/**
 * Validates whether a recurring event can be dragged to a new start time
 *
 * @param {EventModel[]} eventsData - The processed events array
 * @private
 * @returns {EventModel} - Returns parent event
 */
export function getRecurrenceMaxId(eventsData: EventModel[]): number {
    if (!eventsData || eventsData.length === 0) { return 0; }
    return eventsData.reduce((max: number, event: EventModel) => {
        if (!event) { return max; }
        const idValue: unknown = event.id;
        if (isNullOrUndefined(idValue)) { return max; }
        const eventId: number = Number(idValue);
        if (isNaN(eventId)) { return max; }
        return Math.max(max, eventId);
    }, 0);
}

/**
 * Updates the datasource with a modified event, handling recurrence rules
 *
 * @param {EventModel} original - The original event
 * @param {Date} newStartTime - The new start time
 * @param {Date} newEndTime - The new end time
 * @param {IScheduler} schedulerRef - Reference to the scheduler
 * @param {EventFields} fields - The event field mapping
 * @param {EventModel[]} eventsData - The events data array
 * @param {string} timezone - The timezone of the scheduler.
 * @param {Record<string, any>} [resourceFields] - Optional resource field values to assign to the event
 * @private
 * @returns {EventModel} - The updated event
 */
export function updateDatasource(
    original: EventModel,
    newStartTime: Date,
    newEndTime: Date,
    schedulerRef: React.RefObject<IScheduler>,
    fields: EventFields,
    eventsData: EventModel[],
    timezone?: string,
    resourceFields?: Record<string, any>
): EventModel {
    const updatedEvent: Record<string, any> = extend({}, makeExternalRecord(original, fields), null, true);
    if (Array.isArray(eventsData) || original || fields) {
        updatedEvent[fields.id] = original.id;
        populateEventFields(updatedEvent, original, newStartTime, newEndTime, fields);
        const evStartTz: string | undefined = original?.startTimezone || original?.endTimezone;
        const evEndTz: string | undefined = original?.endTimezone || original?.startTimezone;
        if (timezone && (evStartTz || evEndTz)) {
            const convertedStart: Date | undefined = EventService.convertEventTime(newStartTime, timezone, evStartTz);
            const convertedEnd: Date | undefined = EventService.convertEventTime(newEndTime, timezone, evEndTz);
            updatedEvent[fields.startTime] = convertedStart ?? updatedEvent[fields.startTime];
            updatedEvent[fields.endTime] = convertedEnd ?? updatedEvent[fields.endTime];
        }
        if (resourceFields && Object.keys(resourceFields).length > 0) {
            Object.assign(updatedEvent, resourceFields);
        }
        if (schedulerRef?.current?.saveEvent) {
            schedulerRef.current.saveEvent(updatedEvent, original.recurrenceID ? 'EditOccurrence' : 'Edit');
        }
    }
    return updatedEvent;
}

/**
 * Updates the datasource with a modified event, handling recurrence rules
 * Determines parent (original or following) based on event's recurrenceID or followingId
 *
 * @param {EventModel} original - The original event
 * @param {EventFields} fields - The event field mapping
 * @param {EventModel[]} eventsProcessed - The processed events array
 * @private
 * @returns {EventModel} - Returns the updated parent event
 */
export function updateParentRecurrenceEvent(
    original: EventModel,
    fields: EventFields,
    eventsProcessed: EventModel[]
): EventModel {
    const parentEvent: EventModel = getRecurrenceParent(original, eventsProcessed) ?? {};
    const parentExceptionRaw: unknown = parentEvent[fields.recurrenceException] ?? parentEvent.recurrenceException;
    const occurrenceExceptionRaw: unknown = original[fields.recurrenceException] ?? original.recurrenceException;
    const existingException: string = parentExceptionRaw ? String(parentExceptionRaw) : '';
    const occurrenceException: string = occurrenceExceptionRaw ? String(occurrenceExceptionRaw) : '';
    const exceptions: string[] = [];
    if (existingException?.trim()) { exceptions.push(existingException.trim()); }
    if (occurrenceException?.trim()) { exceptions.push(occurrenceException.trim()); }
    const combinedException: string = exceptions.length > 0 ? exceptions.join(',') : '';
    const parentEventUpdate: EventModel = {
        ...parentEvent,
        id: parentEvent[fields.id] as string || parentEvent.id,
        recurrenceException: combinedException
    };
    return parentEventUpdate;
}

/**
 * Populates event fields with updated time and recurrence information
 * Handles both original parent occurrences (recurrenceID) and following parent occurrences (followingId)
 *
 * @param {EventModel} updatedEvent - The event object to populate
 * @param {EventModel} original - The original event
 * @param {Date} newStartTime - The new start time
 * @param {Date} newEndTime - The new end time
 * @param {EventFields} fields - The event field mapping
 *
 * @private
 * @returns {void}
 */
export function populateEventFields(
    updatedEvent: EventModel,
    original: EventModel,
    newStartTime: Date,
    newEndTime: Date,
    fields: EventFields
): void {
    updatedEvent[fields.subject] = original.subject;
    updatedEvent[fields.startTime] = newStartTime;
    updatedEvent[fields.endTime] = newEndTime;
    updatedEvent[fields.isAllDay] = original.isAllDay;
    updatedEvent[fields.recurrenceID] = original.recurrenceID;
    updatedEvent[fields.recurrenceException] = original.recurrenceException;
    updatedEvent[fields.recurrenceRule] = original.recurrenceRule;
    if (original.followingId) {
        updatedEvent[fields.followingId] = original.followingId;
    }
}

/**
 * Handles recurrence deletion based on occurrence or series selection
 *
 * @param {string} title - The title of the alert dialog
 * @param {string} message - The message to display in the alert dialog
 * @param {string} confirmText - The text for the confirm button in the alert dialog
 * @param {object} confirmationDialog - An optional confirmation dialog instance with show and hide methods
 * @param {Function} confirmationDialog.show - Method to display the confirmation dialog
 * @param {Function} confirmationDialog.hide - Method to hide the confirmation dialog
 * @private
 * @returns {void}
 */
export function showAlertDialog(
    title: string,
    message: string,
    confirmText: string,
    confirmationDialog: {
        show: (options: { title: string; message: string; confirmText: string; showCancel: boolean; onConfirm: () => void }) => void;
        hide: () => void;
    }
): void {
    confirmationDialog?.show({
        title: title,
        message: message,
        confirmText: confirmText,
        showCancel: false,
        onConfirm: () => confirmationDialog.hide()
    });
}

/**
 * Shows a recurrence alert dialog (edit, delete, or series change) based on the action type
 *
 * @param {string} action - The action type: 'recurrenceEdit', 'recurrenceDelete', or 'seriesChange'
 * @param {object} confirmationDialog - The confirmation dialog instance with show and hide methods
 * @param {Function} confirmationDialog.show - Method to display the confirmation dialog
 * @param {Function} confirmationDialog.hide - Method to hide the confirmation dialog
 * @param {Function} getString - Function to get localized strings
 * @param {Function} onSelect - Callback when user selects an option
 * @private
 * @returns {void}
 */
export function showRecurrenceAlert(
    action: CrudAction | AlertAction,
    confirmationDialog: {
        show: (options: any) => void;
        hide: () => void;
    },
    getString: (key: string) => string,
    onSelect: (selectOption: CrudAction) => void
): void {
    const alertConfig: Record<string, { title: string; message: string; showCancel?: boolean; confirmText?: string }> = {
        [AlertAction.RecurrenceEdit]: {
            title: getString('editEvent'),
            message: getString('editEventContent'),
            showCancel: false
        },
        [AlertAction.RecurrenceDelete]: {
            title: getString('deleteEvent'),
            message: getString('editEventContent'),
            showCancel: false
        },
        [AlertAction.SeriesChange]: {
            title: getString('alert'),
            message: getString('seriesChangeAlert'),
            showCancel: true,
            confirmText: getString('yes')
        }
    };

    const config: { title: string; message: string; showCancel?: boolean; confirmText?: string; } = alertConfig[action as string];
    confirmationDialog?.show({
        action: action,
        title: config.title,
        message: config.message,
        confirmText: config.confirmText || getString('ok'),
        showCancel: config.showCancel ?? false,
        onConfirm: (selectOption: CrudAction) => {
            onSelect(selectOption);
            confirmationDialog.hide();
        }
    });
}
