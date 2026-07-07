import { useCallback } from 'react';
import { isNullOrUndefined, useProviderContext } from '@syncfusion/react-base';
import { EventModel, SchedulerEditorSubmitEvent, SchedulerResource } from '../types/scheduler-types';
import { EventService } from '../services/EventService';
import { DateService } from '../services/DateService';
import { useSchedulerPropsContext } from '../context/scheduler-context';
import { useSchedulerEventsContext } from '../context/scheduler-events-context';
import { useSchedulerLocalization } from '../common/locale';
import { useEditorContext } from '../context/scheduler-editor-popup-context';
import { CrudAction, AlertAction, AlertType } from '../types/enums';
import { getRecurrenceStringFromDate } from '../../recurrence-editor';
import { editOccurrenceValidation, showAlertDialog, showRecurrenceAlert } from '../utils/event-base';
import { AlertDialog } from '../types/internal-interface';
import { getEventMaxID } from '../utils/actions';
import { EVENT_MODEL_KEYS } from '../utils/default-props';
import { makeExternalRecord, makeInternalRecord } from '../utils/record-mapper';
import { validateRecurrencePattern, getRecurrenceEditAction, getActionBasedDeleteAction, getActionBasedSaveAction } from '../utils/recurrence-util';

/** @private */
export interface UseEditorActionsResult {
    handleSave: () => void;
    handleDelete: () => void;
    handleCancel: () => void;
    buildEventData: () => EventModel;
    validateEventConflicts: (eventData: EventModel) => boolean;
}

/**
 * Custom hook to manage common editor actions (save, delete, cancel).
 * Encapsulates validation, data merging, and confirmation logic.
 *
 * @param {void} onClose - Callback to close the editor
 * @returns {UseEditorActionsResult} Object with handler functions and utility methods
 *
 */
export const useEditorActions: (onClose: () => void) => UseEditorActionsResult = (
    onClose: () => void
): UseEditorActionsResult => {
    const { locale } = useProviderContext();
    const { getString } = useSchedulerLocalization(locale || 'en-US');
    const {
        schedulerRef,
        showDeleteAlert,
        eventSettings,
        eventOverlap,
        confirmationDialog,
        onEditorSubmit,
        enableRecurrenceValidation,
        resources
    } = useSchedulerPropsContext();
    const { eventsData, eventsProcessed } = useSchedulerEventsContext();

    const {
        data,
        action,
        originalData,
        startDateOnly,
        startTimeOnly,
        endDateOnly,
        endTimeOnly,
        slotDuration,
        formRef,
        validateRequiredFields
    } = useEditorContext();

    /**
     * Builds the event data object from editor state.
     * Merges default fields with custom fields and preserves extra fields on edit.
     * Converts display times from selected timezone.
     *
     * @returns {EventModel} Complete event object ready for save
     */
    const buildEventData: (internalData?: EventModel | null) => EventModel = useCallback((internalData?: EventModel | null): EventModel => {
        let computedStart: Date | undefined;
        let computedEnd: Date | undefined;

        if (data?.isAllDay) {
            const sDate: Date = startDateOnly ? DateService.normalizeDate(startDateOnly) : undefined;
            const eDate: Date = endDateOnly ? DateService.normalizeDate(endDateOnly) : sDate;
            computedStart = sDate;
            computedEnd = eDate;
        } else {
            const combine: (date?: Date, time?: Date) => Date = (date?: Date, time?: Date): Date =>
                DateService.combineDateAndTime(date, time);
            computedStart = combine(startDateOnly, startTimeOnly) ?? data?.startTime;
            computedEnd = combine(endDateOnly, endTimeOnly) ?? data?.endTime;
            if (computedStart && computedEnd && computedEnd <= computedStart) {
                const adjusted: Date = new Date(computedStart);
                adjusted.setMinutes(adjusted.getMinutes() + slotDuration);
                computedEnd = adjusted;
            }
        }

        const baseData: EventModel = {
            subject: data?.subject || getString('newEvent'),
            startTime: computedStart,
            endTime: computedEnd,
            isAllDay: !!data?.isAllDay,
            location: data?.location || '',
            description: data?.description || '',
            recurrenceRule: data?.recurrenceRule || '',
            recurrenceException: internalData?.recurrenceException,
            startTimezone: data?.startTimezone,
            endTimezone: data?.endTimezone
        };

        if (resources?.length) {
            for (let i: number = 0; i < resources.length; i++) {
                const resource: SchedulerResource = resources[parseInt(i.toString(), 10)];
                const resourceFieldName: string = resource.field;
                const dataValue: string | number | (string | number)[] = data
                    ? (Reflect.get(data as Record<string, unknown>, resourceFieldName) as string | number | (string | number)[])
                    : undefined;
                if (!isNullOrUndefined(dataValue)) {
                    Object.assign(baseData, { [resourceFieldName]: dataValue });
                } else {
                    const firstResourceData: Record<string, unknown> = (resource.dataSource as Record<string, unknown>[])?.[0];
                    if (firstResourceData) {
                        const defaultValue: string | number = firstResourceData[resource.idField] as string | number;
                        Object.assign(baseData, {
                            [resourceFieldName]: resource.multiple ? [defaultValue] : defaultValue
                        });
                    }
                }
            }
        }

        if (action === 'Edit' && internalData) {
            const INTERNAL_KEYS: Set<string> = new Set(EVENT_MODEL_KEYS);
            const mappedFieldKeys: Set<string> = new Set(
                Object.values(eventSettings?.fields).filter((k: string) => k !== eventSettings?.fields?.id) as string[]
            );
            if (resources && resources.length > 0) {
                resources.forEach((resource: SchedulerResource) => mappedFieldKeys.add(resource.field));
            }
            const preservedExtras: Record<string, unknown> = Object.fromEntries(
                Object.entries(internalData as Record<string, unknown>).filter(
                    ([k]: [string, unknown]) => !INTERNAL_KEYS.has(k) && !mappedFieldKeys.has(k)
                )
            );
            return {
                ...preservedExtras,
                ...baseData,
                id: internalData.id
            } as unknown as EventModel;
        } else {
            return {
                ...baseData,
                id: EventService.generateEventGuid()
            };
        }
    }, [data?.isAllDay, startDateOnly, startTimeOnly, endDateOnly, endTimeOnly, slotDuration, data?.startTime,
        data?.endTime, eventSettings, data?.subject, data?.location, data?.description, data?.startTimezone,
        data?.endTimezone, action, originalData, resources]);

    /**
     * Checks for overlapping events and block ranges.
     * Shows confirmation dialog if conflicts found.
     *
     * @param {EventModel} eventData - Event to validate
     * @returns {boolean} True if event can be saved, false if conflicts exist
     */
    const validateEventConflicts: (eventData: EventModel) => boolean = useCallback((eventData: EventModel): boolean => {
        if (!eventOverlap && EventService.checkEventOverlap(eventData, eventsData)) {
            confirmationDialog?.show({
                title: getString('eventOverlap'),
                message: getString('overlapAlert'),
                confirmText: getString('ok'),
                showCancel: false,
                onConfirm: () => confirmationDialog.hide()
            });
            return false;
        }

        if (EventService.isBlockRange(eventData, eventsData)) {
            confirmationDialog?.show({
                title: getString('alert'),
                message: getString('blockAlert'),
                confirmText: getString('ok'),
                showCancel: false,
                onConfirm: () => confirmationDialog.hide()
            });
            return false;
        }
        return true;
    }, [eventOverlap, eventsData, eventSettings, confirmationDialog]);

    /**
     * Handles save action with validation and data merging.
     */
    const handleSave: () => void = useCallback((): void => {
        const validationError: string | null = validateRequiredFields(getString);
        if (validationError) {
            confirmationDialog?.show({
                title: getString('alert'),
                message: validationError,
                confirmText: getString('ok'),
                showCancel: false,
                onConfirm: () => confirmationDialog.hide()
            });
            return;
        }

        if (formRef?.current && !formRef.current?.validate()) {
            return;
        }

        let internalData: EventModel | null = makeInternalRecord(originalData, eventSettings?.fields);
        // Build event data
        let eventData: EventModel = buildEventData(internalData);

        if (onEditorSubmit) {
            const saveArgs: SchedulerEditorSubmitEvent = {
                data: makeExternalRecord(eventData, eventSettings?.fields),
                cancel: false,
                requestType: action,
                originalData: action === 'Add' ? undefined : originalData
            };
            onEditorSubmit(saveArgs);
            if (saveArgs.cancel) { return; }
            eventData = makeInternalRecord(saveArgs.data, eventSettings?.fields);
            internalData = originalData ? makeInternalRecord(originalData, eventSettings?.fields) : undefined;
            const startTime: Date = eventData.startTime;
            const endTime: Date = eventData.endTime;
            if (!startTime || !endTime) {
                showAlertDialog(getString('alert'), getString('invalidDateValue'), getString('ok'), confirmationDialog);
                return;
            }
            if (!eventData.isAllDay && startTime && endTime && endTime <= startTime) {
                showAlertDialog(getString('alert'), getString('invalidDateRange'), getString('ok'), confirmationDialog);
                return;
            }
        }

        if (!validateEventConflicts(eventData)) { return; }
        const recurrenceValidationError: string | null = validateRecurrencePattern(eventData);
        if (recurrenceValidationError) {
            showAlertDialog(getString('alert'), getString(recurrenceValidationError), getString('ok'), confirmationDialog);
            return;
        }

        if (internalData) {
            eventData.id = internalData.id;
            eventData.recurrenceID = internalData.recurrenceID;
            eventData.guid = internalData.guid;
        }
        if (action === 'Edit' && internalData) {
            const eventsToSave: EventModel[] = EventService.splitEventForMultipleResources(eventData, resources, eventsData);
            if (eventsToSave.length > 1) {
                const originalEvent: EventModel = { ...eventsToSave[0], id: internalData.id, guid: internalData.guid };
                schedulerRef?.current?.saveEvent?.(originalEvent);

                const newEvents: EventModel[] = eventsToSave.slice(1);
                newEvents.forEach((event: EventModel, index: number) => {
                    event.id = getEventMaxID(eventsData, index);
                });
                if (newEvents.length > 0) {
                    schedulerRef?.current?.addEvent?.(newEvents);
                }
            } else {
                schedulerRef?.current?.saveEvent?.(eventData);
            }
        } else if (action === 'EditOccurrence' && internalData) {
            eventData.recurrenceException = getRecurrenceStringFromDate(internalData.startTime);
            if (internalData.recurrenceRule) {
                const newStartTime: Date = eventData.startTime;
                const newEndTime: Date = eventData.endTime;
                const recurrenceValidation: AlertDialog = enableRecurrenceValidation ?
                    editOccurrenceValidation(internalData, newStartTime, newEndTime, eventsProcessed, eventsData) :
                    { isValid: true, shouldAlert: false, messageKey: AlertType.SameDayAlert };
                if (!recurrenceValidation.isValid) {
                    showAlertDialog(getString('alert'), getString(recurrenceValidation.messageKey), getString('ok'), confirmationDialog);
                    return;
                }
            }
            schedulerRef?.current?.saveEvent?.(eventData, 'EditOccurrence');
        } else if (action === 'EditSeries' || action === 'EditFollowingEvents') {
            let isSeriesEventChanged: boolean = false;
            for (const e of eventsProcessed) {
                if ((e.recurrenceID && e.recurrenceID === internalData.recurrenceID && e.id !== internalData.recurrenceID) ||
                    (!e.recurrenceID && e.recurrenceRule && e.id === internalData.recurrenceID && e.recurrenceException)) {
                    if (action === 'EditSeries' || e.startTime.getTime() > internalData.startTime.getTime()) {
                        isSeriesEventChanged = true;
                        break;
                    }
                }
            }
            if (isSeriesEventChanged) {
                showRecurrenceAlert(AlertAction.SeriesChange, confirmationDialog, getString, (selectOption: CrudAction) => {
                    selectOption = getRecurrenceEditAction(selectOption, action);
                    schedulerRef?.current?.saveEvent?.(eventData, selectOption);
                    onClose();
                });
                return;
            } else {
                const currentAction: CrudAction = getActionBasedSaveAction(action, eventData.id, eventData.recurrenceID);
                schedulerRef?.current?.saveEvent?.(eventData, currentAction);
            }
        } else {
            let eventsToAdd: EventModel[] | EventModel = EventService.splitEventForMultipleResources(eventData, resources, eventsData);
            eventsToAdd = eventsToAdd.length > 1 ? eventsToAdd : eventData;
            schedulerRef?.current?.addEvent?.(eventsToAdd);
        }
        onClose();

    }, [validateRequiredFields, buildEventData, validateEventConflicts, validateRecurrencePattern, action, originalData,
        schedulerRef, onClose, confirmationDialog]);

    /**
     * Delete handler with confirmation.
     */
    const handleDelete: () => void = useCallback((): void => {
        if (!originalData) { return; }
        const internalData: EventModel | null = makeInternalRecord(originalData, eventSettings?.fields);
        const performDelete: () => void = (): void => {
            const deleteAction: CrudAction = getActionBasedDeleteAction(action, !!internalData.recurrenceID);
            schedulerRef?.current?.deleteEvent?.(internalData, deleteAction);
        };
        onClose();
        showDeleteAlert?.(performDelete);
    }, [originalData, action, schedulerRef, onClose, showDeleteAlert]);

    /**
     * Cancel handler - simply closes the editor.
     */
    const handleCancel: () => void = useCallback((): void => onClose(), [onClose]);

    return {
        handleSave,
        handleDelete,
        handleCancel,
        buildEventData,
        validateEventConflicts
    };
};

export default useEditorActions;
