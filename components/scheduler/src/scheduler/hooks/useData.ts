import { useCallback, useEffect, useMemo, useState } from 'react';
import { Query, DataManager, ReturnType } from '@syncfusion/react-data';
import { extend, isNullOrUndefined, useProviderContext } from '@syncfusion/react-base';
import { EventModel, SchedulerDataBindEvent, SchedulerDataChangeEvent, SchedulerDataRequestEvent  } from '../types/scheduler-types';
import { DateService } from '../services/DateService';
import { EventService } from '../services/EventService';
import { Timezone } from '../services/Timezone';
import { ActiveViewProps } from '../types/internal-interface';
import { expandRecurringEvents, getRecurrenceMaxId, updateParentRecurrenceEvent, getRecurrenceParent } from '../utils/event-base';
import { makeInternalRecord, makeExternalRecord } from '../utils/record-mapper';
import { CrudAction } from '../types/enums';
import { getRecurrenceStringFromDate } from '../../recurrence-editor';
import { ConfirmationDialogState } from './useConfirmationDialog';
import { useSchedulerLocalization } from '../common/locale';
import { deleteFollowingEvents, editFollowingEvents, filterEventsByRecurrenceIdWithParent, getFollowingParent, getFollowingParentEventsAndOccurrences } from '../utils/recurrence-util';

interface CrudArgs extends SchedulerDataChangeEvent {
    promise?: Promise<any>;
    editParams?: SaveChanges;
}

interface SaveChanges {
    addedRecords: Record<string, any>[];
    changedRecords: Record<string, any>[];
    deletedRecords: Record<string, any>[];
}

interface UseDataProps {
    activeViewProps: ActiveViewProps;
    renderDates: Date[];
    confirmationDialog?: {
        show: (config: Omit<ConfirmationDialogState, 'visible'>) => void;
        hide: () => void;
        setStateUpdater: (callback: (state: ConfirmationDialogState) => void) => void;
    };
}

/** @private */
interface UseDataResult {

    /**
     * Scheduler component events data.
     */
    eventsData: EventModel[];

    /**
     * Processed events data before expansion.
     */
    eventsProcessed: EventModel[];

    /**
     * Adds the newly created event into the Scheduler dataSource.
     */
    addEvent: (data: Record<string, any> | Record<string, any>[]) => void;

    /**
     * Deletes the events based on the provided ID or event collection in the argument list.
     */
    deleteEvent?: (id: string | number | Record<string, any> | Record<string, any>[], action?: CrudAction) => void;

    /**
     * Updates the changes made in the event object by passing it as an parameter into the dataSource.
     */
    saveEvent?: (data: Record<string, any> | Record<string, any>[], action?: CrudAction) => void;
}

/**
 * Custom hook to manage data operations for the scheduler
 *
 * @param {UseDataProps} props Scheduler useData hook props.
 * @returns {UseDataResult} Object containing APIs for data operations
 * @private
 */
export const useData: (props: UseDataProps) => UseDataResult = (props: UseDataProps): UseDataResult => {
    const { activeViewProps, renderDates, confirmationDialog } = props;
    const { eventSettings, readOnly, onDataChangeStart, onDataChangeComplete, onError,
        onDataBind, onDataRequest, eventOverlap, timezone } = activeViewProps;
    const { locale } = useProviderContext();
    const { getString } = useSchedulerLocalization(locale || 'en-US');
    const [eventsData, setEventsData] = useState<EventModel[]>();
    const [eventsProcessed, setEventsProcessed] = useState<EventModel[]>();

    const dataManager: DataManager = useMemo(() => {
        if (eventSettings?.dataSource instanceof DataManager) {
            return eventSettings.dataSource;
        }
        else if (Array.isArray(eventSettings?.dataSource)) {
            return new DataManager(eventSettings.dataSource);
        }
        return new DataManager([]);
    }, [eventSettings?.dataSource]);

    const query: Query = useMemo(() => {
        if (eventSettings?.query instanceof Query) {
            return eventSettings?.query;
        } else {
            return new Query();
        }
    }, [eventSettings?.query]);

    /**
     * The function is used to generate updated Query.
     *
     * @param {Date} startDate Accepts the start date
     * @param {Date} endDate Accepts the end date
     * @returns {Query} returns the Query
     */
    const generateQuery: (startDate?: Date, endDate?: Date) => Query = (startDate?: Date, endDate?: Date): Query => {
        const newQuery: Query = query.clone();
        if (startDate && endDate) {
            newQuery.addParams('StartDate', startDate.toISOString());
            newQuery.addParams('EndDate', endDate.toISOString());
        }
        return newQuery;
    };

    const getData: (query: Query) => Object[] | Promise<Response> = (query: Query): Object[] | Promise<Response> => {
        return dataManager.executeQuery(query);
    };

    const getTable: () => string = (): string =>  {
        if (eventSettings.query) {
            const query: Query = eventSettings.query.clone();
            return query.fromTable;
        }
        return null;
    };

    /**
     * Helper method to convert all EventModel objects in editParams to external records.
     * This converts events in addedRecords, changedRecords, and deletedRecords arrays
     * using the makeExternalRecord utility function.
     * String or number IDs in deletedRecords are preserved as-is.
     *
     * @param {SaveChanges} editParams The edit parameters containing events to convert
     * @returns {void} This function modifies the editParams object in place
     */
    const convertEditParamsRecords: (editParams: SaveChanges) => void =
    (editParams: SaveChanges): void => {
        if (editParams.addedRecords && editParams.addedRecords.length > 0) {
            editParams.addedRecords = editParams.addedRecords.map((record: any) =>
                typeof record === 'object'
                    ? makeExternalRecord(record as EventModel, eventSettings.fields)
                    : record
            );
        }
        if (editParams.changedRecords && editParams.changedRecords.length > 0) {
            editParams.changedRecords = editParams.changedRecords.map((record: any) =>
                typeof record === 'object'
                    ? makeExternalRecord(record as EventModel, eventSettings.fields)
                    : record
            );
        }
        if (editParams.deletedRecords && editParams.deletedRecords.length > 0) {
            editParams.deletedRecords = editParams.deletedRecords.map((record: any) =>
                typeof record === 'object'
                    ? makeExternalRecord(record as EventModel, eventSettings.fields)
                    : record
            );
        }
    };

    const dataManagerSuccess: (e: ReturnType) => void = (e: ReturnType): void => {
        const event: SchedulerDataBindEvent = {
            result: e.result,
            count: e.count
        };
        if (onDataBind) {
            onDataBind(event);
        }
        const originalData: Record<string, any>[] = event.result;
        const mappedEvents: EventModel[] = EventService.mapEventData(originalData, eventSettings.fields);
        const timeZoneEvents: EventModel[] = EventService.processTimeZone(mappedEvents, timezone);
        let expandedEvents: EventModel[] = expandRecurringEvents(timeZoneEvents, renderDates, activeViewProps.firstDayOfWeek);
        if (eventOverlap === false && renderDates && renderDates.length > 0) {
            expandedEvents = EventService.filterNonOverlappingEvents(expandedEvents, renderDates);
        }
        setEventsProcessed(timeZoneEvents);
        setEventsData(expandedEvents);
    };

    const dataManagerFailure: (error: Error) => void = (error: Error): void => {
        if (onError) {
            onError(error);
        }
    };

    const refreshDataManager: () => void = useCallback(async (): Promise<void> => {
        if (!renderDates || renderDates.length === 0) { return; }
        let startDate: Date = renderDates[0];
        let endDate: Date = renderDates[renderDates.length - 1];
        if (activeViewProps.timezone) {
            startDate = Timezone.remove(startDate, activeViewProps.timezone);
            endDate = Timezone.remove(endDate, activeViewProps.timezone);
        }
        const dmQuery: Query = generateQuery(startDate, endDate);
        const dataRequestEvent: SchedulerDataRequestEvent = {
            startDate: startDate,
            endDate: endDate,
            cancel: false
        };

        let dmResult: Record<string, any> | Promise<Response> | Promise<Record<string, any>>;

        if (eventSettings?.dataSource instanceof DataManager) {
            dmResult = getData(dmQuery);
        } else {
            if (onDataRequest) {
                await onDataRequest(dataRequestEvent);
                if (dataRequestEvent.cancel) {
                    return;
                }
                dmResult = Promise.resolve(dataRequestEvent as Record<string, any>);
            } else {
                dmResult = getData(dmQuery);
            }
        }

        (dmResult as any).then(
            (e: ReturnType) => dataManagerSuccess(e)
        ).catch(
            (e: Error) => dataManagerFailure(e)
        );
    }, [renderDates, getData, generateQuery, onDataRequest]);

    const updateEventDateTime: (eventData: EventModel) => EventModel =
    (eventData: EventModel): EventModel => {
        if (typeof eventData.startTime === 'string') {
            eventData.startTime = DateService.getDateFromString(eventData.startTime as unknown as string);
        }
        if (typeof eventData.endTime === 'string') {
            eventData.endTime = DateService.getDateFromString(eventData.endTime as unknown as string);
        }
        return eventData;
    };

    const processTimezoneEvent: (eventData: EventModel | Record<string, any>) => EventModel =
     (eventData: EventModel | Record<string, any>): EventModel => {
         const internalEvent: EventModel = makeInternalRecord(eventData as Record<string, any>, eventSettings?.fields);
         const updatedEvent: EventModel = updateEventDateTime(internalEvent);
         return EventService.processTimeZone([updatedEvent as EventModel], timezone, true)[0];
     };

    const processTimezoneEventsArray: (events?: EventModel[]) => EventModel[] =
    (events?: EventModel[]): EventModel[] => {
        return (events || []).map((e: EventModel) => processTimezoneEvent(e));
    };

    const refreshData: (args: CrudArgs) => void = useCallback((args: CrudArgs): void => {
        const actionArgs: SchedulerDataChangeEvent = {
            cancel: false,
            addedRecords: args.editParams.addedRecords,
            changedRecords: args.editParams.changedRecords,
            deletedRecords: args.editParams.deletedRecords
        };
        if (dataManager.dataSource?.offline) {
            if (onDataChangeComplete) {
                onDataChangeComplete(actionArgs);
            }
            refreshDataManager();
        } else {
            args.promise.then(() => {
                if (onDataChangeComplete) {
                    onDataChangeComplete(actionArgs);
                }
                refreshDataManager();
            }).catch((error: Error) => {
                if (onError) {
                    onError(error);
                }
            });
        }
    }, [onDataChangeComplete, onError, refreshDataManager, dataManager]);

    const processAddEvent: (addArgs: SchedulerDataChangeEvent) => void = useCallback((addArgs: SchedulerDataChangeEvent): void => {
        const editParams: SaveChanges = { addedRecords: [], changedRecords: [], deletedRecords: [] };
        let promise: Promise<EventModel>;
        if (addArgs.addedRecords instanceof Array) {
            for (let event of addArgs.addedRecords as EventModel[]) {
                event = updateEventDateTime(event);
                const tzEvent: EventModel = processTimezoneEvent(event);
                if (tzEvent.recurrenceRule && isNullOrUndefined(tzEvent.id)) {
                    tzEvent.id = getRecurrenceMaxId(eventsData) + 1;
                }
                editParams.addedRecords.push(makeExternalRecord(tzEvent, eventSettings.fields));
            }
            promise = dataManager.saveChanges(editParams, eventSettings.fields.id, getTable(), generateQuery()) as Promise<EventModel>;
        }
        const crudArgs: CrudArgs = {
            cancel: false,
            promise: promise,
            editParams: editParams
        };
        refreshData(crudArgs);
    }, [dataManager, eventSettings, getTable, generateQuery, refreshData, eventsData]);

    const processDeleteEvent: (deleteArgs: SchedulerDataChangeEvent, action?: CrudAction) => SaveChanges =
        useCallback((deleteArgs: SchedulerDataChangeEvent, action?: CrudAction): SaveChanges => {
            const editParams: SaveChanges = { addedRecords: [], changedRecords: [], deletedRecords: [] };
            if (action === 'DeleteOccurrence' || action === 'DeleteSeries') {
                for (const event of deleteArgs.deletedRecords as EventModel[]) {
                    const clonedEvent: EventModel = <EventModel>extend({}, event, null, true);
                    if (clonedEvent.recurrenceID) {
                        if (action === 'DeleteOccurrence') {
                            if (clonedEvent.recurrenceID !== clonedEvent.id) {
                                editParams.deletedRecords.push(processTimezoneEvent(clonedEvent));
                            } else {
                                clonedEvent.recurrenceException = getRecurrenceStringFromDate(clonedEvent.startTime);
                                const parentUpdate: EventModel =
                                    updateParentRecurrenceEvent(clonedEvent, eventSettings.fields, eventsProcessed);
                                editParams.changedRecords.push(processTimezoneEvent(parentUpdate));
                            }
                        } else if (action === 'DeleteSeries') {
                            const filterResult: { events: EventModel[]; parentEvent?: EventModel } =
                                filterEventsByRecurrenceIdWithParent(eventsProcessed || [], clonedEvent.recurrenceID);
                            let parentEvent: EventModel = filterResult.parentEvent;
                            let deleteEvents: EventModel[] = filterResult.events;
                            const tzDeleteEvents: EventModel[] = processTimezoneEventsArray(deleteEvents);
                            editParams.deletedRecords.push(...tzDeleteEvents);
                            if (parentEvent?.followingId) {
                                parentEvent = getFollowingParent(parentEvent, eventsProcessed);
                                deleteEvents = eventsProcessed?.filter((e: EventModel) => (e.recurrenceID || e.id) === parentEvent.id);
                                const tzDeleteEvents: EventModel[] = processTimezoneEventsArray(deleteEvents);
                                editParams.deletedRecords.push(...tzDeleteEvents);
                            } else {
                                const { followingParentEvents, followingOccurrences } =
                                    getFollowingParentEventsAndOccurrences(parentEvent, eventsProcessed);
                                const tzFollowingParentEvents: EventModel[] = processTimezoneEventsArray(followingParentEvents);
                                const tzFollowingOccurrences: EventModel[] = processTimezoneEventsArray(followingOccurrences);
                                editParams.deletedRecords.push(...tzFollowingParentEvents, ...tzFollowingOccurrences);
                            }
                        }
                    } else {
                        editParams.deletedRecords.push(processTimezoneEvent(clonedEvent));
                    }
                }
            } else if (action === 'DeleteFollowingEvents') {
                for (const event of deleteArgs.deletedRecords) {
                    const clonedEvent: Record<string, any> = <Record<string, any>>extend({}, event, null, true);
                    const parentEvent: EventModel = getRecurrenceParent(clonedEvent, eventsProcessed);
                    const { updatedParent, deletedEvents } =
                        deleteFollowingEvents(clonedEvent, eventsProcessed, parentEvent);
                    const tzChangeEvents: EventModel = processTimezoneEvent(updatedParent);
                    editParams.changedRecords.push(tzChangeEvents);
                    editParams.deletedRecords.push(...EventService.processTimeZone(deletedEvents));
                    const { followingParentEvents, followingOccurrences } =
                        getFollowingParentEventsAndOccurrences(parentEvent, eventsProcessed);
                    const tzFollowingParentEvents: EventModel[] = processTimezoneEventsArray(followingParentEvents);
                    const tzFollowingOccurrences: EventModel[] = processTimezoneEventsArray(followingOccurrences);
                    editParams.deletedRecords.push(...tzFollowingParentEvents, ...tzFollowingOccurrences);
                }
            } else {
                editParams.deletedRecords = editParams.deletedRecords.concat(EventService.processTimeZone(deleteArgs.deletedRecords));
            }
            convertEditParamsRecords(editParams);
            return editParams;
        }, [eventSettings, eventsProcessed]);

    const performDeleteEvent: (editParams: SaveChanges) => void =
        useCallback((editParams: SaveChanges): void => {
            let promise: Promise<any>;
            if (editParams.deletedRecords.length > 1 || editParams.changedRecords.length > 0) {
                promise = dataManager.saveChanges(editParams, eventSettings.fields.id, getTable(), generateQuery()) as Promise<any>;
            } else if (editParams.deletedRecords.length === 1) {
                promise = dataManager.remove(eventSettings.fields.id, editParams.deletedRecords[0],
                                             getTable(), generateQuery()) as Promise<any>;
            } else {
                promise = Promise.resolve();
            }
            const crudArgs: CrudArgs = {
                cancel: false,
                promise: promise,
                editParams: editParams
            };
            refreshData(crudArgs);
        }, [dataManager, eventSettings, getTable, generateQuery, refreshData]);

    const handleEditOccurrence: (records: EventModel[], editParams: SaveChanges) => void =
    (records: EventModel[], editParams: SaveChanges): void => {
        for (const event of records) {
            let clonedEvent: EventModel = <EventModel>extend({}, event, null, true);
            if (!clonedEvent.recurrenceID) { continue; }
            const isOccurrence: boolean = clonedEvent.id !== clonedEvent.recurrenceID;
            if (isOccurrence && !clonedEvent.recurrenceRule) {
                clonedEvent = updateEventDateTime(clonedEvent);
                const tzClonedEvent: EventModel = processTimezoneEvent(clonedEvent);
                editParams.changedRecords.push(tzClonedEvent);
                continue;
            }
            clonedEvent = updateEventDateTime(clonedEvent);
            if (!isOccurrence) {
                const parentEvent: EventModel = updateParentRecurrenceEvent(clonedEvent, eventSettings.fields, eventsProcessed);
                const followingParent: EventModel = getFollowingParent(parentEvent, eventsProcessed);
                if (followingParent && parentEvent.recurrenceException) {
                    if (followingParent.recurrenceException) {
                        const combined: string = `${followingParent.recurrenceException},${parentEvent.recurrenceException}`;
                        followingParent.recurrenceException = Array.from(new Set(combined.split(','))).join(',');
                    } else {
                        followingParent.recurrenceException = parentEvent.recurrenceException;
                    }
                }
                const tzClonedEvent: EventModel = processTimezoneEvent(parentEvent);
                if (followingParent) {
                    const tzfollowingParent: EventModel = processTimezoneEvent(followingParent);
                    editParams.changedRecords.push(tzClonedEvent, tzfollowingParent);
                } else {
                    editParams.changedRecords.push(tzClonedEvent);
                }
                clonedEvent.id = getRecurrenceMaxId(eventsData) + 1;
                const tzProcessedEvent: EventModel = processTimezoneEvent(clonedEvent);
                editParams.addedRecords.push(tzProcessedEvent);
            } else {
                const tzClonedEvent: EventModel = processTimezoneEvent(clonedEvent);
                editParams.changedRecords.push(tzClonedEvent);
            }
        }
    };

    const handleEditSeries: (records: EventModel[], editParams: SaveChanges, action: string) => void =
    (records: EventModel[], editParams: SaveChanges, action: string): void => {
        for (const event of records) {
            const clonedEvent: EventModel = <EventModel>extend({}, event, null, true);
            if (clonedEvent.recurrenceID) {
                const filterResult: { events: EventModel[]; parentEvent?: EventModel } =
                    filterEventsByRecurrenceIdWithParent(eventsProcessed || [], clonedEvent.recurrenceID);
                let parentEvent: EventModel = filterResult.parentEvent || {};
                const filteredEvents: EventModel[] = filterResult.events;
                let isRegularEvent: boolean = true;
                let filterParent: { events: EventModel[]; parentEvent?: EventModel };
                if (parentEvent?.followingId) {
                    isRegularEvent = false;
                    parentEvent = getFollowingParent(parentEvent, eventsProcessed);
                    filterParent = filterEventsByRecurrenceIdWithParent(eventsProcessed || [], parentEvent.id, false);
                }

                clonedEvent.id = parentEvent?.id ?? clonedEvent.id;
                delete clonedEvent.recurrenceID;
                const { followingParentEvents, followingOccurrences } =
                    getFollowingParentEventsAndOccurrences(parentEvent, eventsProcessed);
                const tzFollowingParentEvents: EventModel[] = processTimezoneEventsArray(followingParentEvents);
                const tzFollowingOccurrences: EventModel[] = processTimezoneEventsArray(followingOccurrences);
                const tzFilterParent: EventModel[] = processTimezoneEventsArray(filterParent?.events);
                if (action === 'EditCurrentSeries') {
                    editParams.deletedRecords.push(...tzFollowingParentEvents);
                } else {
                    editParams.deletedRecords.push(...tzFollowingParentEvents, ...tzFollowingOccurrences, ...tzFilterParent);
                }
                if (action === 'EditSeries' || !clonedEvent.recurrenceRule || (!isRegularEvent && action === 'EditCurrentSeries')) {
                    delete clonedEvent.recurrenceException;
                    if (isRegularEvent || (!isRegularEvent && action === 'EditSeries')) {
                        const tzFiltered: EventModel[] = processTimezoneEventsArray(filteredEvents);
                        editParams.deletedRecords.push(...tzFiltered);
                    }
                    if (isRegularEvent || clonedEvent.id !== parentEvent?.id) {
                        editParams.addedRecords.push(processTimezoneEvent(clonedEvent));
                    } else {
                        clonedEvent.recurrenceException = undefined;
                        if (action === 'EditCurrentSeries') {
                            clonedEvent.recurrenceException = parentEvent?.recurrenceException;
                        }
                        editParams.changedRecords.push(processTimezoneEvent(clonedEvent));
                    }
                } else {
                    clonedEvent.recurrenceException = parentEvent?.recurrenceException;
                    editParams.changedRecords.push(processTimezoneEvent(clonedEvent));
                }
            }
        }
    };

    const handleFollowingEvents: (records: Record<string, any>[], editParams: SaveChanges, action: string) => void =
        (records: Record<string, any>[], editParams: SaveChanges, action: string): void => {
            for (const event of records) {
                const clonedEvent: Record<string, any> = <Record<string, any>>extend({}, event, null, true);
                if (clonedEvent.recurrenceID) {
                    let parentEvent: EventModel = {};
                    let filteredEvents: EventModel[] = (eventsProcessed || [])?.filter((e: EventModel) => {
                        if (e.id === clonedEvent.recurrenceID) {
                            parentEvent = e;
                        }
                        return e.recurrenceID === clonedEvent.recurrenceID && e.id !== clonedEvent.recurrenceID &&
                            (e.startTime.getTime() >= clonedEvent.startTime.getTime());
                    });
                    const { updatedParent, originalEvent, changedOccurrence } =
                        editFollowingEvents(clonedEvent, parentEvent, eventsData);
                    if (parentEvent.followingId && action === 'EditFollowingEvents') {
                        updatedParent[eventSettings.fields.recurrenceException] = undefined;
                        filteredEvents = filteredEvents?.filter((e: EventModel) => e.id !== parentEvent.id);
                    } else if (!parentEvent.followingId && action === 'EditCurrentFollowingEvents') {
                        const updatedFilteredEvents: EventModel[] = filteredEvents?.filter((e: EventModel) =>
                            e.recurrenceID && e.id !== e.recurrenceID
                        ).map((e: EventModel) => {
                            const tz: EventModel = processTimezoneEvent(e);
                            return ({
                                ...makeExternalRecord(tz, eventSettings.fields),
                                [eventSettings.fields.id]: e.id,
                                [eventSettings.fields.recurrenceID]: originalEvent.id,
                                [eventSettings.fields.recurrenceRule]: originalEvent.recurrenceRule
                            } as EventModel);
                        }) || [];
                        editParams.changedRecords.push(...updatedFilteredEvents);
                    }
                    const tzUpdatedParent: EventModel = processTimezoneEvent(updatedParent);
                    editParams.changedRecords.push(tzUpdatedParent);
                    if (changedOccurrence) { editParams.deletedRecords.push(processTimezoneEvent(changedOccurrence)); }
                    const { followingParentEvents, followingOccurrences } =
                        getFollowingParentEventsAndOccurrences(parentEvent, eventsProcessed);
                    const tzFollowingParentEvents: EventModel[] = processTimezoneEventsArray(followingParentEvents);
                    const tzFollowingOccurrences: EventModel[] = processTimezoneEventsArray(followingOccurrences);
                    editParams.deletedRecords.push(...tzFollowingParentEvents, ...tzFollowingOccurrences);
                    if (!parentEvent.followingId || updatedParent.followingId) {
                        const tzOriginalEvent: EventModel = processTimezoneEvent(originalEvent);
                        editParams.addedRecords.push(tzOriginalEvent);
                    }

                    if (action === 'EditFollowingEvents') {
                        delete clonedEvent.recurrenceException;
                        const tzFiltered: EventModel[] = processTimezoneEventsArray(filteredEvents);
                        editParams.deletedRecords.push(...tzFiltered);
                    } else {
                        clonedEvent.recurrenceException = parentEvent.recurrenceException;
                    }
                }
            }
        };

    const handleDefaultEdit: (records: EventModel[] | EventModel, editParams: SaveChanges) => void =
    (records: EventModel[] | EventModel, editParams: SaveChanges): void => {
        if (records instanceof Array) {
            for (let event of records) {
                event = updateEventDateTime(<EventModel>extend({}, event, null, true));
                const eventData: EventModel[] = EventService.processTimeZone([event], timezone, true);
                editParams.changedRecords.push(eventData[0]);
            }
        } else {
            const eventData: EventModel[] = EventService.processTimeZone([records], timezone);
            editParams.changedRecords.push(updateEventDateTime(eventData[0]));
        }
    };

    const processSaveEvent: (saveArgs: SchedulerDataChangeEvent, action?: CrudAction) => SaveChanges =
        useCallback((saveArgs: SchedulerDataChangeEvent, action?: CrudAction): SaveChanges => {
            const editParams: SaveChanges = { addedRecords: [], changedRecords: [], deletedRecords: [] };
            switch (action) {
            case 'EditOccurrence':
                if (saveArgs.changedRecords instanceof Array && saveArgs.changedRecords.length > 0) {
                    handleEditOccurrence(saveArgs.changedRecords, editParams);
                }
                break;

            case 'EditCurrentSeries':
            case 'EditSeries':
                if (saveArgs.changedRecords instanceof Array && saveArgs.changedRecords.length > 0) {
                    handleEditSeries(saveArgs.changedRecords, editParams, action);
                }
                break;

            case 'EditFollowingEvents':
            case 'EditCurrentFollowingEvents':
                if (saveArgs.changedRecords instanceof Array && saveArgs.changedRecords.length > 0) {
                    handleFollowingEvents(saveArgs.changedRecords, editParams, action);
                }
                break;

            default:
                handleDefaultEdit(saveArgs.changedRecords, editParams);
                break;
            }
            convertEditParamsRecords(editParams);
            return editParams;
        }, [eventSettings, eventsData, eventsProcessed, updateEventDateTime]);

    const performSaveEvent: (editParams: SaveChanges) => void =
        useCallback((editParams: SaveChanges): void => {
            let promise: Promise<any>;
            if (editParams.changedRecords.length > 1 || editParams.addedRecords.length > 0 || editParams.deletedRecords.length > 0) {
                promise = dataManager.saveChanges(editParams, eventSettings.fields.id, getTable(), generateQuery()) as Promise<any>;
            } else if (editParams.changedRecords.length === 1) {
                promise =
                    dataManager.update(eventSettings.fields.id, editParams.changedRecords[0], getTable(), generateQuery()) as Promise<any>;
            } else {
                promise = Promise.resolve();
            }
            const crudArgs: CrudArgs = {
                cancel: false,
                promise: promise,
                editParams: editParams
            };
            refreshData(crudArgs);
        }, [dataManager, eventSettings, getTable, generateQuery, refreshData]);

    const addEvent: (eventData: Record<string, any> | Record<string, any>[]) => void =
    useCallback(async (eventData: Record<string, any> | Record<string, any>[]) => {
        if (eventSettings.allowAdding && !readOnly) {
            const rawEvents: Record<string, any>[] = (eventData instanceof Array) ? eventData : [eventData];
            if (rawEvents.length === 0) {
                return;
            }
            let addEvents: EventModel[] = rawEvents.map((e: Record<string, any>) => makeInternalRecord(e, eventSettings?.fields));

            if (eventsData && EventService.isBlockRange(addEvents, eventsData)) {
                confirmationDialog?.show({
                    title: getString('alert'),
                    message: getString('blockAlert'),
                    confirmText: getString('ok'),
                    showCancel: false,
                    onConfirm: () => confirmationDialog?.hide()
                });
                return;
            }

            // Check for event overlap when eventOverlap is enabled
            if (eventOverlap === false && eventsData) {
                for (const newEvent of addEvents) {
                    if (EventService.checkEventOverlap(newEvent, eventsData)) {
                        confirmationDialog?.show({
                            title: getString('eventOverlap'),
                            message: getString('overlapAlert'),
                            confirmText: getString('ok'),
                            showCancel: false,
                            onConfirm: () => confirmationDialog?.hide()
                        });
                        return;
                    }
                }
            }

            addEvents = addEvents.map((e: Record<string, any>) => makeExternalRecord(e, eventSettings?.fields));
            const addArgs: SchedulerDataChangeEvent = {
                cancel: false,
                addedRecords: addEvents,
                changedRecords: [],
                deletedRecords: []
            };
            if (onDataChangeStart) {
                onDataChangeStart(addArgs);
            }
            if (addArgs.cancel) {
                return;
            }
            addEvents = addEvents.map((e: Record<string, any>) => makeInternalRecord(e, eventSettings?.fields));
            if (addArgs.promise) {
                addArgs.promise.then((hasContinue: boolean) => {
                    if (hasContinue) {
                        processAddEvent(addArgs);
                    }
                }).catch((error: Error) => {
                    if (onError) {
                        onError(error);
                    }
                });
            } else {
                processAddEvent(addArgs);
            }
        }
    }, [eventSettings, readOnly, onDataChangeStart, onError, processAddEvent, eventOverlap, eventsData, confirmationDialog, getString]);

    const deleteEvent: (id: string | number | Record<string, any> | Record<string, any>[], action?: CrudAction) => void =
    useCallback(async (id: string | number | Record<string, any> | Record<string, any>[], action?: CrudAction) => {
        if (eventSettings.allowDeleting && !readOnly) {
            const rawEvents: (string | number | Record<string, any>)[] = (id instanceof Array ? id : [id]);
            if (rawEvents.length === 0) {
                return;
            }
            const deleteEvents: Record<string, any>[] = rawEvents.map(
                (e: string | number | Record<string, any>) =>
                    (typeof e === 'object' && e !== null) ? makeInternalRecord(e as Record<string, any>, eventSettings?.fields) : e
            ) as Record<string, any>[];
            const deleteArgs: SchedulerDataChangeEvent = {
                cancel: false,
                addedRecords: [], changedRecords: [], deletedRecords: deleteEvents
            };
            const editParams: SaveChanges = processDeleteEvent(deleteArgs, action);
            deleteArgs.addedRecords = editParams.addedRecords;
            deleteArgs.changedRecords = editParams.changedRecords;
            deleteArgs.deletedRecords = editParams.deletedRecords;
            if (onDataChangeStart) {
                onDataChangeStart(deleteArgs);
            }
            if (deleteArgs.cancel) {
                return;
            }
            if (deleteArgs.promise) {
                deleteArgs.promise.then((hasContinue: boolean) => {
                    if (hasContinue) {
                        performDeleteEvent(editParams);
                    }
                }).catch((error: Error) => {
                    if (onError) {
                        onError(error);
                    }
                });
            } else {
                performDeleteEvent(editParams);
            }
        }
    }, [eventSettings, readOnly, onDataChangeStart, onError, processDeleteEvent]);

    const saveEvent: (data: Record<string, any> | Record<string, any>[], action?: CrudAction) => void =
    useCallback(async (data: Record<string, any> | Record<string, any>[], action?: CrudAction) => {
        if (eventSettings.allowEditing && !readOnly) {
            const rawEvents: Record<string, any>[] = (data instanceof Array) ? data : [data];
            if (rawEvents.length === 0) {
                return;
            }
            const updateEvents: EventModel[] = rawEvents.map((e: Record<string, any>) => makeInternalRecord(e, eventSettings?.fields));
            const saveArgs: SchedulerDataChangeEvent = {
                cancel: false,
                addedRecords: [], changedRecords: updateEvents, deletedRecords: []
            };
            const editParams: SaveChanges = processSaveEvent(saveArgs, action);
            saveArgs.addedRecords = editParams.addedRecords;
            saveArgs.changedRecords = editParams.changedRecords;
            saveArgs.deletedRecords = editParams.deletedRecords;
            if (onDataChangeStart) {
                onDataChangeStart(saveArgs);
            }
            if (saveArgs.cancel) {
                return;
            }
            if (saveArgs.promise) {
                saveArgs.promise.then((hasContinue: boolean) => {
                    if (hasContinue) {
                        performSaveEvent(editParams);
                    }
                }).catch((error: Error) => {
                    if (onError) {
                        onError(error);
                    }
                });
            } else {
                performSaveEvent(editParams);
            }
        }
    }, [eventSettings, readOnly, onDataChangeStart, onError, processSaveEvent]);

    useEffect(() => {
        refreshDataManager();
    }, [dataManager, query, renderDates]);

    return {
        eventsData,
        eventsProcessed,
        addEvent,
        deleteEvent,
        saveEvent
    };
};
