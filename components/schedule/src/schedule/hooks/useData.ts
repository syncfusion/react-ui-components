import { useCallback, useEffect, useMemo, useState } from 'react';
import { Query, DataManager, ReturnType } from '@syncfusion/react-data';
import { extend } from '@syncfusion/react-base';
import { EventModel, ActionEventArgs  } from '../types/schedule-types';
import { DateService } from '../services/DateService';
import { EventService } from '../services/EventService';
import { ActiveViewProps } from '../types/internal-interface';

interface CrudArgs extends ActionEventArgs {
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
}

interface UseDataResult {

    /**
     * Schedule component events data.
     */
    eventsData: EventModel[];

    /**
     * Adds the newly created event into the Schedule dataSource.
     */
    addEvent: (data: Record<string, any> | Record<string, any>[]) => void;

    /**
     * Deletes the events based on the provided ID or event collection in the argument list.
     */
    deleteEvent?: (id: string | number | Record<string, any> | Record<string, any>[]) => void;

    /**
     * Updates the changes made in the event object by passing it as an parameter into the dataSource.
     */
    saveEvent?: (data: Record<string, any> | Record<string, any>[]) => void;
}

/**
 * Custom hook to manage data operations for the schedule
 *
 * @param {UseDataProps} props Schedule useData hook props.
 * @returns {UseDataResult} Object containing APIs for data operations
 */
export const useData: (props: UseDataProps) => UseDataResult = (props: UseDataProps): UseDataResult => {
    const { activeViewProps, renderDates } = props;
    const { eventSettings, readOnly, onActionBegin, onActionComplete, onActionFailure, onDataBinding } = activeViewProps;
    const [eventsData, setEventsData] = useState<EventModel[]>();

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

    const dataManagerSuccess: (e: ReturnType) => void = (e: ReturnType): void => {
        if (onDataBinding) {
            onDataBinding(e);
        }
        const originalData: Record<string, any>[] = e.result;
        const mappedEvents: EventModel[] = EventService.mapEventData(originalData, eventSettings.fields);
        setEventsData(mappedEvents);
    };

    const dataManagerFailure: (e: ReturnType) => void = (e: ReturnType): void => {
        if (onActionFailure) {
            onActionFailure(e);
        }
    };

    const refreshDataManager: () => void = useCallback((): void => {
        if (!renderDates || renderDates.length === 0) { return; }
        const dmQuery: Query = generateQuery(renderDates[0], renderDates[renderDates.length - 1]);
        const dmResult: Object[] | Promise<Response> = getData(dmQuery);
        (dmResult as any).then(
            (e: ReturnType) => dataManagerSuccess(e)
        ).catch(
            (e: ReturnType) => dataManagerFailure(e)
        );
    }, [renderDates, getData, generateQuery]);

    const updateEventDateTime: (eventData: Record<string, any>) => Record<string, any> =
    (eventData: Record<string, any>): Record<string, any> => {
        if (typeof eventData[eventSettings.fields.startTime] === 'string') {
            eventData[eventSettings.fields.startTime] = DateService.getDateFromString(eventData[eventSettings.fields.startTime]);
        }
        if (typeof eventData[eventSettings.fields.endTime] === 'string') {
            eventData[eventSettings.fields.endTime] = DateService.getDateFromString(eventData[eventSettings.fields.endTime]);
        }
        return eventData;
    };

    const refreshData: (args: CrudArgs) => void = useCallback((args: CrudArgs): void => {
        const actionArgs: ActionEventArgs = {
            requestType: args.requestType,
            cancel: false,
            addedRecords: args.editParams.addedRecords,
            changedRecords: args.editParams.changedRecords,
            deletedRecords: args.editParams.deletedRecords
        };
        if (dataManager.dataSource?.offline) {
            if (onActionComplete) {
                onActionComplete(actionArgs);
            }
            refreshDataManager();
        } else {
            args.promise.then(() => {
                if (onActionComplete) {
                    onActionComplete(actionArgs);
                }
                refreshDataManager();
            }).catch((e: any) => {
                if (onActionFailure) {
                    onActionFailure(e);
                }
            });
        }
    }, [onActionComplete, onActionFailure, refreshDataManager, dataManager]);

    const processAddEvent: (addArgs: ActionEventArgs) => void = useCallback((addArgs: ActionEventArgs): void => {
        const editParams: SaveChanges = { addedRecords: [], changedRecords: [], deletedRecords: [] };
        let promise: Promise<any>;
        if (addArgs.addedRecords instanceof Array) {
            for (let event of addArgs.addedRecords) {
                event = updateEventDateTime(event);
                const eventData: Record<string, any> = <Record<string, any>>extend({}, event, null, true);
                editParams.addedRecords.push(eventData);
            }
            promise = dataManager.saveChanges(editParams, eventSettings.fields.id, getTable(), generateQuery()) as Promise<any>;
        } else {
            const event: Record<string, any> = addArgs.addedRecords;
            editParams.addedRecords.push(event);
            promise = dataManager.insert(event, getTable(), generateQuery()) as Promise<any>;
        }
        const crudArgs: CrudArgs = {
            requestType: 'eventCreated',
            cancel: false,
            promise: promise,
            editParams: editParams
        };
        refreshData(crudArgs);
    }, [dataManager, eventSettings, getTable, generateQuery, refreshData]);

    const processDeleteEvent: (deleteArgs: ActionEventArgs) => void = useCallback((deleteArgs: ActionEventArgs): void => {
        let promise: Promise<any>;
        const editParams: SaveChanges = { addedRecords: [], changedRecords: [], deletedRecords: [] };
        if (deleteArgs.deletedRecords.length > 1) {
            editParams.deletedRecords = editParams.deletedRecords.concat(deleteArgs.deletedRecords);
            promise = dataManager.saveChanges(editParams, eventSettings.fields.id, getTable(), generateQuery()) as Promise<any>;
        } else {
            editParams.deletedRecords.push(deleteArgs.deletedRecords[0]);
            promise = dataManager.remove(eventSettings.fields.id, deleteArgs.deletedRecords[0],
                                         getTable(), generateQuery()) as Promise<any>;
        }
        const crudArgs: CrudArgs = {
            requestType: 'eventRemoved',
            cancel: false,
            promise: promise,
            editParams: editParams
        };
        refreshData(crudArgs);
    }, [dataManager, eventSettings, getTable, generateQuery, refreshData]);

    const processSaveEvent: (saveArgs: ActionEventArgs) => void = useCallback((saveArgs: ActionEventArgs): void => {
        let promise: Promise<any>;
        const editParams: SaveChanges = { addedRecords: [], changedRecords: [], deletedRecords: [] };
        if (saveArgs.changedRecords instanceof Array) {
            for (let event of saveArgs.changedRecords) {
                event = updateEventDateTime(event);
                const eventData: Record<string, any> = <Record<string, any>>extend({}, event, null, true);
                editParams.changedRecords.push(eventData);
            }
            promise = dataManager.saveChanges(editParams, eventSettings.fields.id, getTable(), generateQuery()) as Promise<any>;
        } else {
            const event: Record<string, any> = saveArgs.changedRecords;
            editParams.changedRecords.push(event);
            promise = dataManager.update(eventSettings.fields.id, event, getTable(), generateQuery()) as Promise<any>;
        }
        const crudArgs: CrudArgs = {
            requestType: 'eventChanged',
            cancel: false,
            promise: promise,
            editParams: editParams
        };
        refreshData(crudArgs);
    }, [dataManager, eventSettings, getTable, generateQuery, refreshData, updateEventDateTime]);

    const addEvent: (eventData: Record<string, any> | Record<string, any>[]) => void =
    useCallback(async (eventData: Record<string, any> | Record<string, any>[]) => {
        if (eventSettings.allowAdding && !readOnly) {
            const addEvents: Record<string, any>[] = (eventData instanceof Array) ? eventData : [eventData];
            if (addEvents.length === 0) {
                return;
            }
            const addArgs: ActionEventArgs = {
                requestType: 'eventCreate',
                cancel: false,
                addedRecords: addEvents,
                changedRecords: [],
                deletedRecords: []
            };
            if (onActionBegin) {
                onActionBegin(addArgs);
            }
            if (addArgs.promise) {
                addArgs.promise.then((hasContinue: boolean) => {
                    if (hasContinue) {
                        processAddEvent(addArgs);
                    }
                }).catch((e: ReturnType) => {
                    if (onActionFailure) {
                        onActionFailure(e);
                    }
                });
            } else {
                processAddEvent(addArgs);
            }
        }
    }, [eventSettings, readOnly, onActionBegin, onActionFailure, processAddEvent]);

    const deleteEvent: (id: string | number | Record<string, any> | Record<string, any>[]) => void =
    useCallback(async (id: string | number | Record<string, any> | Record<string, any>[]) => {
        if (eventSettings.allowDeleting && !readOnly) {
            const deleteEvents: Record<string, any>[] = (id instanceof Array ? id : [id]) as Record<string, any>[];
            if (deleteEvents.length === 0) {
                return;
            }
            const deleteArgs: ActionEventArgs = {
                requestType: 'eventRemove', cancel: false,
                addedRecords: [], changedRecords: [], deletedRecords: deleteEvents
            };
            if (onActionBegin) {
                onActionBegin(deleteArgs);
            }
            if (deleteArgs.promise) {
                deleteArgs.promise.then((hasContinue: boolean) => {
                    if (hasContinue) {
                        processDeleteEvent(deleteArgs);
                    }
                }).catch((e: ReturnType) => {
                    if (onActionFailure) {
                        onActionFailure(e);
                    }
                });
            } else {
                processDeleteEvent(deleteArgs);
            }
        }
    }, [eventSettings, readOnly, onActionBegin, onActionFailure, processDeleteEvent]);

    const saveEvent: (data: Record<string, any> | Record<string, any>[]) => void =
    useCallback(async (data: Record<string, any> | Record<string, any>[]) => {
        if (eventSettings.allowEditing && !readOnly) {
            const updateEvents: Record<string, any>[] = (data instanceof Array) ? data : [data];
            if (updateEvents.length === 0) {
                return;
            }
            const saveArgs: ActionEventArgs = {
                requestType: 'eventChange', cancel: false,
                addedRecords: [], changedRecords: updateEvents, deletedRecords: []
            };
            if (onActionBegin) {
                onActionBegin(saveArgs);
            }
            if (saveArgs.promise) {
                saveArgs.promise.then((hasContinue: boolean) => {
                    if (hasContinue) {
                        processSaveEvent(saveArgs);
                    }
                }).catch((e: ReturnType) => {
                    if (onActionFailure) {
                        onActionFailure(e);
                    }
                });
            } else {
                processSaveEvent(saveArgs);
            }
        }
    }, [eventSettings, readOnly, onActionBegin, onActionFailure, processSaveEvent]);

    useEffect(() => {
        refreshDataManager();
    }, [dataManager, query, renderDates]);

    return {
        eventsData,
        addEvent,
        deleteEvent,
        saveEvent
    };
};
