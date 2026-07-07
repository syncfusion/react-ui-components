import { useCallback, useState, useEffect, useReducer, SetStateAction, Dispatch, useRef, RefObject, useMemo } from 'react';
import { SchedulerCellClickEvent, SchedulerEventClickEvent, EventModel, SchedulerResource, SchedulerGroup, EventFields } from '../types/scheduler-types';
import { DateService } from '../services/DateService';
import { EventService } from '../services/EventService';
import { CalendarChangeEvent } from '@syncfusion/react-calendars';
import { CheckboxChangeEvent } from '@syncfusion/react-buttons';
import { TextBoxChangeEvent, TextAreaChangeEvent, FormState, IFormValidator } from '@syncfusion/react-inputs';
import { ChangeEvent } from '@syncfusion/react-dropdowns';
import { getDefaultRule } from '../../recurrence-editor/util';
import { CrudAction, AlertAction, EditAction } from '../types/enums';
import { getRecurrenceParent } from '../utils/event-base';
import { IL10n, useProviderContext, isNullOrUndefined } from '@syncfusion/react-base';
import { useSchedulerLocalization } from '../common/locale';
import { useRecurrenceEditorLocalization } from '../../recurrence-editor/locale';
import { getRecurrenceSummary } from '../../recurrence-editor/date-generator';
import { makeExternalRecord } from '../utils/record-mapper';
import { getFollowingParent, getMergedRecurrenceRule } from '../utils/recurrence-util';

/** @private */
export interface UseEditorPopupResult {
    data?: EventModel
    open: boolean;
    setOpen: Dispatch<SetStateAction<boolean>>;
    onCellDoubleClickHandler: (args: SchedulerCellClickEvent) => void;
    onEventDoubleClickHandler: (args: SchedulerEventClickEvent) => void;
    onClose: () => void;
    startDateOnly?: Date;
    startTimeOnly?: Date;
    endDateOnly?: Date;
    endTimeOnly?: Date;
    slotDuration: number;
    recurrenceStart?: Date;
    repeatModeValue: string;
    recurrenceOpen: boolean;
    setSlotDuration: Dispatch<SetStateAction<number>>;
    handleSubjectChange: (args: TextBoxChangeEvent) => void;
    handleLocationChange: (args: TextBoxChangeEvent) => void;
    handleDescriptionChange: (args: TextAreaChangeEvent) => void;
    handleStartDateChange: (args: CalendarChangeEvent) => void;
    handleStartTimeChange: (args: CalendarChangeEvent) => void;
    handleEndDateChange: (args: CalendarChangeEvent) => void;
    handleEndTimeChange: (args: CalendarChangeEvent) => void;
    handleIsAllDayChange: (args: CheckboxChangeEvent) => void;
    handleRecurrenceRuleChange: (args: string) => void;
    handleRepeatModeChange: (args: ChangeEvent) => void;
    handleStartTimezoneChange: (args: ChangeEvent) => void;
    handleEndTimezoneChange: (args: ChangeEvent) => void;
    handleUseTimezoneChange: (args: CheckboxChangeEvent) => void;
    closeRecurrenceEditor: () => void;
    onEditEvent: (eventData: EventModel, action?: EditAction) => void;
    onMoreDetails: (cellData: SchedulerCellClickEvent) => void;
    formState?: FormState;
    setFormState: (state: FormState) => void;
    formRef: React.RefObject<IFormValidator>;
    validateRequiredFields: (getString: (key: string) => string) => string | null;
    action: CrudAction;
    originalData?: EventModel;
    repeatData?: DropdownData[];
    timezone?: string;
    resourceValues: Record<string, string | number | (string | number)[]>;
    setResourceValues: Dispatch<SetStateAction<Record<string, string | number | (string | number)[]>>>;
    handleResourceChange: (resourceIndex: number) => (args: ChangeEvent) => void;
    currentCellGroupIndex?: number;
}

type DropdownData = { text: string; value: string };


// useReducer for complex EditorState management
type EditorFieldKey = keyof EventModel;

type EditorAction =
    | { type: 'setField'; key: EditorFieldKey; value: EventModel[EditorFieldKey] }
    | { type: 'setMany'; payload: Partial<EventModel> };

/**
 * Reducer for the editor popup state.
 * Updates either a single field (setField) or merges multiple fields (setMany).
 *
 * @param {EventModel} state - Current editor state
 * @param {EditorAction} action - Action describing the update to perform
 * @returns {EventModel} Updated editor state
 */
function editorReducer(state: EventModel, action: EditorAction): EventModel {
    switch (action.type) {
    case 'setField':
        return { ...state, [action.key]: action.value } as EventModel;
    case 'setMany':
        return { ...state, ...action.payload } as EventModel;
    default:
        return state;
    }
}

/**
 * Hook that manages the Scheduler editor popup state and event handlers.
 * Initializes state based on cell/event double-clicks and provides helpers for
 * editing subject, location, description, date/time parts, and all-day flag.
 *
 * @param {Function} onCellDoubleClick - Callback invoked on cell double-click.
 * @param {Function} onEventDoubleClick - Callback invoked on event double-click.
 * @param {Function} closeAllPopups - Callback to close other popups when opening the editor.
 * @param {Function} showRecurrenceAlert - Callback to show recurrence alert options.
 * @param {EventModel[]} eventsProcessed - Array of processed events for recurrence rule calculation.
 * @param {string} timezone - Scheduler's default timezone.
 * @param {SchedulerResource[]} resources - Array of resource configurations for the scheduler.
 * @param {SchedulerGroup} group - Grouping configuration for the scheduler
 * @param {EventFields} eventSettingsFields - Custom field mappings from event settings.
 * @returns {UseEditorPopupResult} API with current state and handlers to control the editor popup.
 * @private
 */
export const useEditorPopup: (
    onCellDoubleClick?: (args: SchedulerCellClickEvent) => void,
    onEventDoubleClick?: (args: SchedulerEventClickEvent) => void,
    closeAllPopups?: () => void,
    showRecurrenceAlert?: (action: AlertAction, onSelect: (selectOption: CrudAction) => void) => void,
    eventsProcessed?: EventModel[],
    timezone?: string,
    resources?: SchedulerResource[],
    group?: SchedulerGroup,
    eventSettingsFields?: EventFields
) => UseEditorPopupResult = (
    onCellDoubleClick?: (args: SchedulerCellClickEvent) => void,
    onEventDoubleClick?: (args: SchedulerEventClickEvent) => void,
    closeAllPopups?: () => void,
    showRecurrenceAlert?: (action: AlertAction, onSelect: (selectOption: CrudAction) => void) => void,
    eventsProcessed?: EventModel[],
    timezone?: string,
    resources?: SchedulerResource[],
    group?: SchedulerGroup,
    eventSettingsFields?: EventFields
): UseEditorPopupResult => {
    const [open, setOpen] = useState<boolean>(false);
    const [formState, setFormState] = useState<FormState>();
    const formRef: RefObject<IFormValidator> = useRef<IFormValidator>(null);
    const eventsProcessedRef: RefObject<EventModel[] | undefined> = useRef<EventModel[] | undefined>(eventsProcessed);
    const { locale } = useProviderContext();
    const { getString: getSchedulerString } = useSchedulerLocalization(locale || 'en-US');
    const { getString: getRecurrenceString } = useRecurrenceEditorLocalization(locale || 'en-US');
    const localeObj: IL10n = useMemo(() => ({ getConstant: (key: string) => getRecurrenceString(key) } as IL10n), [getRecurrenceString]);

    // Update ref whenever eventsProcessed changes, ensuring we always have the latest data
    useEffect(() => {
        eventsProcessedRef.current = eventsProcessed;
    }, [eventsProcessed]);

    const initialRepeatData: DropdownData[] = useMemo(() => [
        { value: 'Never', text: getSchedulerString('never') },
        { value: 'FREQ:DAILY', text: getSchedulerString('daily') },
        { value: 'FREQ:WEEKLY', text: getSchedulerString('weekly') },
        { value: 'FREQ:MONTHLY', text: getSchedulerString('monthly') },
        { value: 'FREQ:YEARLY', text: getSchedulerString('yearly') },
        { value: 'Custom', text: getSchedulerString('custom') }
    ], [getSchedulerString]);
    const [action, setAction] = useState<CrudAction>('Add');
    const [originalData, setOriginalData] = useState<EventModel>(undefined);
    const [repeatData, setRepeatData] = useState<DropdownData[]>(initialRepeatData);
    const [useTimezone, setUseTimezone] = useState<boolean>(false);

    const initialEditorState: EventModel = {
        subject: '',
        location: '',
        description: '',
        startTime: undefined,
        endTime: undefined,
        isAllDay: false,
        recurrenceRule: undefined
    };

    const [state, dispatch] = useReducer(editorReducer, initialEditorState);

    const setSubject: (value: string) => void = useCallback((value: string) => dispatch({ type: 'setField', key: 'subject', value }), [dispatch]);
    const setLocation: (value: string) => void = useCallback((value: string) => dispatch({ type: 'setField', key: 'location', value }), [dispatch]);
    const setDescription: (value: string) => void = useCallback((value: string) => dispatch({ type: 'setField', key: 'description', value }), [dispatch]);
    const setStartTime: (value: Date | undefined) => void = useCallback((value: Date | undefined) => dispatch({ type: 'setField', key: 'startTime', value }), [dispatch]);
    const setEndTime: (value: Date | undefined) => void = useCallback((value: Date | undefined) => dispatch({ type: 'setField', key: 'endTime', value }), [dispatch]);
    const setIsAllDay: (value: boolean) => void = useCallback((value: boolean) => dispatch({ type: 'setField', key: 'isAllDay', value }), [dispatch]);
    const setRecurrenceRule: (value: string) => void = useCallback((value: string) => dispatch({ type: 'setField', key: 'recurrenceRule', value }), [dispatch]);
    const setStartTimezone: (value: string | undefined) => void = useCallback((value: string | undefined) => dispatch({ type: 'setField', key: 'startTimezone', value }), [dispatch]);
    const setEndTimezone: (value: string | undefined) => void = useCallback((value: string | undefined) => dispatch({ type: 'setField', key: 'endTimezone', value }), [dispatch]);

    const resolveUseTimezone: (eventData?: EventModel) => boolean = useCallback((eventData?: EventModel): boolean => {
        return Boolean(eventData?.startTimezone || eventData?.endTimezone);
    }, []);

    const [currentCellGroupIndex, setCurrentCellGroupIndex] = useState<number | undefined>(undefined);

    const updateRepeatDropData: (rule: string) => void = useCallback((rule: string): void => {
        setRepeatData((prev: DropdownData[]) => {
            const match: DropdownData | undefined = prev.find((item: DropdownData) => item.value === rule);
            if (match) {
                setRepeatModeValue(match.value);
                return prev;
            }
            const newItem: DropdownData = { value: rule, text: getRecurrenceSummary(rule, locale, localeObj) };
            const insertIndex: number = Math.max(0, prev.length - 1);
            const updated: DropdownData[] = [
                ...prev.slice(0, insertIndex),
                newItem,
                ...prev.slice(insertIndex)
            ];
            setRepeatModeValue(rule);
            return updated;
        });
    }, [locale, localeObj]);

    const setRepeatDropData: (start: Date, rule?: string) => void = useCallback((start: Date, rule?: string): void => {
        const repeatDropdownData: DropdownData[] = [
            { value: 'Never', text: getSchedulerString('never') },
            { value: getDefaultRule('DAILY', start), text: getSchedulerString('daily') },
            { value: getDefaultRule('WEEKLY', start), text: getSchedulerString('weekly') },
            { value: getDefaultRule('MONTHLY', start), text: getSchedulerString('monthly') },
            { value: getDefaultRule('YEARLY', start), text: getSchedulerString('yearly') },
            { value: 'Custom', text: getSchedulerString('custom') }
        ];

        if (!rule) {
            setRepeatData(repeatDropdownData);
            setRecurrenceRule('');
            setRepeatModeValue('Never');
            return;
        }

        const match: DropdownData | undefined = repeatDropdownData.find((item: DropdownData) => item.value === rule);
        if (match) {
            setRepeatData(repeatDropdownData);
            setRecurrenceRule(rule);
            setRepeatModeValue(match.value);
            return;
        }
        const newItem: DropdownData = { value: rule, text: getRecurrenceSummary(rule, locale, localeObj) };
        const insertIndex: number = Math.max(0, repeatDropdownData.length - 1);
        const updated: DropdownData[] = [
            ...repeatDropdownData.slice(0, insertIndex),
            newItem,
            ...repeatDropdownData.slice(insertIndex)
        ];
        setRepeatData(updated);
        setRecurrenceRule(rule);
        setRepeatModeValue(rule);
    }, [getSchedulerString, locale, localeObj]);

    const onCellDoubleClickHandler: (args: SchedulerCellClickEvent) => void = useCallback((args: SchedulerCellClickEvent): void => {
        onCellDoubleClick?.(args);
        if (args.cancel) { return; }
        closeAllPopups?.();
        if (!isNullOrUndefined(args.groupIndex) && args.groupIndex >= 0) {
            setCurrentCellGroupIndex(args.groupIndex);
        } else {
            setCurrentCellGroupIndex(undefined);
        }
        const start: Date = args.isAllDay ? DateService.normalizeDate(args.startTime) : args.startTime;
        const duration: {startTime: Date, endTime: Date} = { startTime: start, endTime: args.isAllDay ? start : args.endTime } as const;
        setRepeatDropData(start);
        setOriginalData(undefined);
        dispatch({
            type: 'setMany',
            payload: {
                subject: '',
                location: '',
                description: '',
                isAllDay: args.isAllDay,
                startTime: duration.startTime,
                endTime: duration.endTime,
                startTimezone: undefined,
                endTimezone: undefined
            }
        });
        setAction('Add');
        setOpen(true);
    }, [onCellDoubleClick, closeAllPopups, setRepeatDropData]);

    const onEventDoubleClickHandler: (args: SchedulerEventClickEvent) => void = useCallback((args: SchedulerEventClickEvent): void => {
        onEventDoubleClick?.(args);
        if (args.cancel) { return; }
        closeAllPopups?.();
        if (!args?.data) { args.data = {}; }
        const isAllDay: boolean = Boolean(args.data.isAllDay);
        const start: Date = isAllDay ? DateService.normalizeDate(args.data.startTime) : args.data.startTime;
        const end: Date = isAllDay ? DateService.normalizeDate(args.data.endTime) : args.data.endTime;
        setRepeatDropData(start, args.data.recurrenceRule);
        setOriginalData(makeExternalRecord(args.data, eventSettingsFields));
        const normalizedEvent: EventModel = { ...args.data, startTime: start, endTime: end };
        const { start: startDate, end: endDate } = resolveEventTimezone(normalizedEvent, normalizedEvent, 'Edit');
        setCurrentCellGroupIndex(undefined);
        const basePayload: Object = {
            subject: args.data.subject ?? getSchedulerString('addTitle'),
            location: args.data.location ?? '',
            description: args.data.description ?? '',
            startTime: startDate,
            endTime: endDate,
            startTimezone: args.data.startTimezone ?? '',
            endTimezone: args.data.endTimezone ?? ''
        };
        if (args.data.recurrenceID || args.data[eventSettingsFields?.recurrenceID]) {
            showRecurrenceAlert?.(AlertAction.RecurrenceEdit, (selectOption: CrudAction) => {
                let parentEvent: EventModel = {};
                let mergedRule: string | undefined;
                if (selectOption === 'EditSeries' || selectOption === 'EditFollowingEvents') {
                    parentEvent = getRecurrenceParent(args.data, eventsProcessedRef.current);
                    mergedRule = getMergedRecurrenceRule(parentEvent, eventsProcessedRef.current);
                    setRepeatDropData(start, mergedRule ?? args.data.recurrenceRule ?? parentEvent?.recurrenceRule);
                    if (selectOption === 'EditSeries') {
                        parentEvent = getUpdateParentTimes(parentEvent, eventsProcessedRef.current);
                    }
                }
                const { start: seriesStart, end: seriesEnd } = resolveEventTimezone(normalizedEvent, parentEvent, selectOption);
                dispatch({
                    type: 'setMany',
                    payload: {
                        ...basePayload,
                        startTime: seriesStart,
                        endTime: seriesEnd,
                        isAllDay: selectOption === 'EditSeries' ? !!parentEvent.isAllDay : isAllDay
                    }
                });
                setUseTimezone(resolveUseTimezone(args.data));
                setAction(selectOption);
                setOpen(true);
            });
            return;
        }

        dispatch({
            type: 'setMany',
            payload: {
                ...basePayload,
                isAllDay: isAllDay
            }
        });
        setUseTimezone(resolveUseTimezone(args.data));
        setAction('Edit');
        setOpen(true);
    }, [onEventDoubleClick, closeAllPopups, eventSettingsFields,
        showRecurrenceAlert, resolveUseTimezone, setRepeatDropData, getSchedulerString]);

    const onClose: () => void = useCallback(() => setOpen(false), []);

    const { subject, location, description, startTime, endTime, isAllDay, recurrenceRule, startTimezone, endTimezone } = state;

    const [slotDuration, setSlotDuration] = useState<number>(30);
    // local split date/time state
    const [startDateOnly, setStartDateOnly] = useState<Date | undefined>(undefined);
    const [startTimeOnly, setStartTimeOnly] = useState<Date | undefined>(undefined);
    const [endDateOnly, setEndDateOnly] = useState<Date | undefined>(undefined);
    const [endTimeOnly, setEndTimeOnly] = useState<Date | undefined>(undefined);
    const [endTimeChanged, setEndTimeChanged] = useState<boolean>(false);
    const [ repeatModeValue, setRepeatModeValue] = useState<string>('Never');
    const [ recurrenceOpen, setRecurrenceOpen] = useState<boolean>(false);
    const [resourceValues, setResourceValues] = useState<Record<string, string | number | (string | number)[]>>({});

    // initialize local date/time parts when popup opens
    useEffect(() => {
        if (!open) { return; }
        const initStartDate: Date | undefined = startTime ? new Date(startTime) : undefined;
        const initEndDate: Date | undefined = endTime ? new Date(endTime) : undefined;
        setStartDateOnly(initStartDate ? DateService.normalizeDate(initStartDate) : undefined);
        setEndDateOnly(initEndDate ? DateService.normalizeDate(initEndDate) : undefined);
        setEndTimeChanged(false);
        setStartTimeOnly(startTime ? new Date(startTime) : startTimeOnly);
        setEndTimeOnly(endTime ? new Date(endTime) : endTimeOnly);
    }, [open, startTime, endTime]);

    useEffect(() => {
        if (!open || (action === 'Add' && isNullOrUndefined(originalData) && group?.resources?.length > 0)) { return; }
        if (!resources || resources.length === 0) {
            setResourceValues({});
            return;
        }
        const values: Record<string, string | number | (string | number)[]> = {};
        resources.forEach((resource: SchedulerResource) => {
            const fieldName: string = resource.field;
            const eventResourceValue: string | number | (string | number)[] | undefined =
                (originalData?.[resource.field]) as string | number | (string | number)[] | undefined;

            if (!isNullOrUndefined(eventResourceValue)) {
                values[`${fieldName}`] = eventResourceValue as string | number | (string | number)[];
            } else {
                const firstResourceData: Record<string, unknown> = (resource.dataSource as Record<string, unknown>[])?.[0];
                if (firstResourceData && resource.idField) {
                    const defaultValue: string | number = firstResourceData[resource.idField] as string | number;
                    values[`${fieldName}`] = resource.multiple ? [defaultValue] : defaultValue;
                }
            }
        });
        setResourceValues(values);
    }, [open, originalData, action, resources]);

    const combineDateAndTime: (date?: Date, time?: Date) => Date = useCallback((date?: Date, time?: Date): Date =>
        DateService.combineDateAndTime(date, time)
    , []);

    const handleStartDateChange: (args: CalendarChangeEvent) => void = useCallback((args: CalendarChangeEvent): void => {
        setStartDateOnly(args?.value as Date);
    }, []);

    const handleStartTimeChange: (args: CalendarChangeEvent) => void = useCallback((args: CalendarChangeEvent): void => {
        const time: Date = args?.value as Date;
        setStartTimeOnly(time);
        if (!time) { return; }
        const startCombined: Date = combineDateAndTime(startDateOnly, time);
        const endCombined: Date = combineDateAndTime(endDateOnly ?? startDateOnly, endTimeOnly);
        if (!endTimeChanged && DateService.isMidnight(endTimeOnly)) {
            const bumped: Date = new Date(time);
            bumped.setMinutes(bumped.getMinutes() + slotDuration);
            setEndTimeOnly(bumped);
        } else if (startCombined && endCombined && endCombined <= startCombined) {
            const bumped: Date = new Date(time);
            bumped.setMinutes(bumped.getMinutes() + slotDuration);
            setEndTimeOnly(bumped);
        }
    }, [startDateOnly, endDateOnly, endTimeOnly, endTimeChanged, slotDuration, combineDateAndTime]);

    const handleEndDateChange: (args: CalendarChangeEvent) => void = useCallback((args: CalendarChangeEvent): void => {
        setEndDateOnly(args?.value as Date);
    }, []);

    const handleEndTimeChange: (args: CalendarChangeEvent) => void = useCallback((args: CalendarChangeEvent): void => {
        const time: Date = args?.value as Date;
        setEndTimeOnly(time);
        setEndTimeChanged(!!time);
    }, []);

    const handleIsAllDayChange: (args: CheckboxChangeEvent) => void = useCallback((args: CheckboxChangeEvent): void => {
        setIsAllDay(args?.value);
        if (action === 'Add' && args?.value === false) {
            if (!endTimeChanged && DateService.isMidnight(endTimeOnly)) {
                const baseStart: Date = startTimeOnly ? new Date(startTimeOnly) : new Date(0);
                if (!startTimeOnly) {
                    baseStart.setHours(0, 0, 0, 0);
                }
                baseStart.setMinutes(baseStart.getMinutes() + slotDuration);
                setEndTimeOnly(baseStart);
            } else {
                const startCombined: Date = combineDateAndTime(startDateOnly, startTimeOnly);
                const endCombined: Date = combineDateAndTime(endDateOnly ?? startDateOnly, endTimeOnly);
                if (startCombined && endCombined && endCombined <= startCombined) {
                    const base: Date = startTimeOnly ? new Date(startTimeOnly) : new Date(endCombined);
                    base.setMinutes(base.getMinutes() + slotDuration);
                    setEndTimeOnly(base);
                }
            }
        }
    }, [action, endTimeChanged, endTimeOnly, startTimeOnly, slotDuration, combineDateAndTime, startDateOnly, endDateOnly]);

    const handleSubjectChange: (args: TextBoxChangeEvent) => void = useCallback((args: TextBoxChangeEvent): void => {
        setSubject(args.value);
    }, []);

    const handleLocationChange: (args: TextBoxChangeEvent) => void = useCallback((args: TextBoxChangeEvent): void => {
        setLocation(args.value);
    }, []);

    const openRecurrenceEditor: () => void = useCallback((): void => {
        setRecurrenceOpen(true);
    }, []);

    const closeRecurrenceEditor: () => void = useCallback((): void => {
        setRecurrenceOpen(false);
    }, []);

    const handleRepeatModeChange: (args: ChangeEvent) => void = useCallback((args: ChangeEvent) => {
        const value: string = args?.value as string;
        setRepeatModeValue(value);
        if (value !== 'Never' && value !== 'Custom') {
            setRecurrenceRule(value);
        }
        if (value === 'Never') {
            setRecurrenceRule('');
        }
        if (value === 'Custom') {
            openRecurrenceEditor();
        }

    }, [setRepeatModeValue, openRecurrenceEditor]);

    const handleRecurrenceRuleChange: (value: string) => void = useCallback((value: string): void => {
        setRecurrenceRule(value);
        updateRepeatDropData(value);
    }, []);

    const handleDescriptionChange: (args: TextAreaChangeEvent) => void = useCallback((args: TextAreaChangeEvent): void => {
        setDescription(args?.value);
    }, []);

    const handleStartTimezoneChange: (args: ChangeEvent) => void = useCallback((args: ChangeEvent): void => {
        const newTimezone: string = args?.value as string;
        setStartTimezone(newTimezone);
        setEndTimezone(newTimezone);
    }, []);

    const handleEndTimezoneChange: (args: ChangeEvent) => void = useCallback((args: ChangeEvent): void => {
        const newTimezone: string = args?.value as string;
        setEndTimezone(newTimezone);
    }, []);

    const handleUseTimezoneChange: (args: CheckboxChangeEvent) => void = useCallback((args: CheckboxChangeEvent): void => {
        const enableTZ: boolean = Boolean(args?.value);
        setUseTimezone(enableTZ);
    }, []);

    const handleResourceChange: (resourceIndex: number) => (args: ChangeEvent) => void = useCallback(
        (resourceIndex: number) => (args: ChangeEvent): void => {
            if (resources) {
                const resource: SchedulerResource = resources[parseInt(resourceIndex.toString(), 10)];
                const fieldName: string = resource.field;

                const nextResourceValues: Record<string, string | number | (string | number)[]> = {
                    ...resourceValues,
                    [fieldName]: args.value as string | number | (string | number)[] ?? []
                };

                dispatch({
                    type: 'setField',
                    key: fieldName as string,
                    value: args.value ?? []
                });

                if (resourceIndex < resources.length - 1) {
                    for (let i: number = resourceIndex + 1; i < resources.length; i++) {
                        const dependentResource: SchedulerResource = resources[parseInt(i.toString(), 10)];
                        const dependentFieldName: string = dependentResource.field;
                        const parentResource: SchedulerResource = resources[i - 1];
                        const parentFieldName: string = parentResource.field;
                        const parentValue: string | number | (string | number)[] = nextResourceValues[`${parentFieldName}`];

                        let filteredData: Record<string, unknown>[] = [];
                        if (!isNullOrUndefined(parentValue) && dependentResource.groupIDField &&
                            dependentResource.dataSource && Array.isArray(dependentResource.dataSource)) {
                            const parentValues: (string | number)[] = Array.isArray(parentValue) ? parentValue : [parentValue];
                            filteredData = (dependentResource.dataSource as Record<string, unknown>[]).filter(
                                (item: Record<string, unknown>) => {
                                    const itemGroupId: string | number = item[dependentResource.groupIDField] as string | number;
                                    return parentValues.includes(itemGroupId);
                                }
                            );
                        } else if (dependentResource.dataSource && Array.isArray(dependentResource.dataSource)) {
                            filteredData = dependentResource.dataSource as Record<string, unknown>[];
                        }

                        if (filteredData.length > 0 && dependentResource.idField) {
                            const defaultValue: string | number = filteredData[0][dependentResource.idField] as string | number;
                            nextResourceValues[`${dependentFieldName}`] = defaultValue;
                            dispatch({
                                type: 'setField',
                                key: dependentFieldName as string,
                                value: defaultValue
                            });
                        }
                    }
                }
                setResourceValues(nextResourceValues);
            }
        }, [resources, resourceValues]
    );
    const getUpdateParentTimes: (parentEvent: EventModel, eventsProcessed?: EventModel[]) => EventModel =
        (parentEvent: EventModel, eventsProcessed?: EventModel[]): EventModel => {
            if (parentEvent?.followingId && eventsProcessed) {
                const newParent: EventModel = getFollowingParent(parentEvent, eventsProcessed);
                if (newParent) {
                    const clonedEvent: EventModel = { ...parentEvent };
                    clonedEvent.startTime = newParent.startTime;
                    clonedEvent.endTime = newParent.endTime;
                    return clonedEvent;
                }
            }
            return parentEvent;
        };

    const onEditEvent: (eventData: EventModel, action?: EditAction) => void =
    useCallback((eventData: EventModel, action?: EditAction): void => {
        if (!eventData) { return; }
        const applyEventData: (recurrenceRule?: string, parentEvent?: EventModel, action?: EditAction) => void =
            (recurrenceRule?: string, parentEvent?: EventModel, action?: EditAction) => {
                setSubject(eventData.subject ?? getSchedulerString('addTitle'));
                setLocation(eventData.location);
                setDescription(eventData.description);
                const { start, end } = resolveEventTimezone(eventData, parentEvent, action);
                setStartTime(start);
                setEndTime(end);
                setIsAllDay(Boolean(action === 'EditSeries' ? parentEvent.isAllDay : eventData.isAllDay));
                setUseTimezone(resolveUseTimezone(eventData));
                setStartTimezone(eventData.startTimezone);
                setEndTimezone(eventData.endTimezone);
                setOriginalData(makeExternalRecord(eventData, eventSettingsFields));
                setRepeatDropData(eventData.startTime, recurrenceRule ?? eventData.recurrenceRule ?? parentEvent?.recurrenceRule);
                setOpen(true);
            };

        const handleSelectedOption: (action: EditAction) => void = (action: EditAction) => {
            let parentEvent: EventModel = {};
            let mergedRecurrenceRule: string | undefined;
            if (action === 'EditSeries' || action === 'EditFollowingEvents') {
                parentEvent = getRecurrenceParent(eventData, eventsProcessedRef.current);
                mergedRecurrenceRule = getMergedRecurrenceRule(parentEvent, eventsProcessedRef.current);
                if (action === 'EditSeries') {
                    parentEvent = getUpdateParentTimes(parentEvent, eventsProcessedRef.current);
                }
            }
            setAction(action);
            const recurrenceRule: string = action === 'EditSeries' ? (mergedRecurrenceRule ?? eventData.recurrenceRule ??
                parentEvent?.recurrenceRule) : undefined;
            applyEventData(recurrenceRule, parentEvent, action);
        };

        if (eventData.recurrenceID || eventData[eventSettingsFields?.recurrenceID]) {
            if (action) {
                handleSelectedOption(action);
            } else {
                showRecurrenceAlert?.(AlertAction.RecurrenceEdit, (action: EditAction) => {
                    handleSelectedOption(action);
                });
            }
        } else {
            setAction('Edit');
            applyEventData();
        }
    }, [eventSettingsFields, showRecurrenceAlert, resolveUseTimezone, setRepeatDropData]);

    const resolveEventTimezone: (data: EventModel, parent: EventModel, action?: CrudAction) => { start: Date, end: Date } =
        useCallback((data: EventModel, parent: EventModel, action?: CrudAction): { start: Date, end: Date } => {
            const isSeries: boolean = action === 'EditSeries';
            let start: Date = isSeries ? parent.startTime : data.startTime;
            let end: Date = isSeries ? parent.endTime : data.endTime;
            const startTz: string | undefined = isSeries ? parent.startTimezone : data.startTimezone;
            const endTz: string | undefined = isSeries ? parent.endTimezone : data.endTimezone;
            if (timezone && (startTz || endTz)) {
                start = EventService.convertEventTime(start, timezone, (startTz || endTz)) ?? start;
                end = EventService.convertEventTime(end, timezone, (endTz || startTz)) ?? end;
            }
            return { start, end };
        }, [timezone]);

    const onMoreDetails: (cellData: SchedulerCellClickEvent | EventModel) => void =
        useCallback((cellData: SchedulerCellClickEvent | EventModel): void => {
            setAction('Add');
            const cellInfo: EventModel = {
                subject: cellData[eventSettingsFields?.subject] ?? '',
                location: cellData[eventSettingsFields?.location] ?? '',
                description: cellData[eventSettingsFields?.description] ?? '',
                startTime: cellData[eventSettingsFields?.startTime] ?? cellData.startTime,
                endTime: cellData[eventSettingsFields?.endTime] ?? cellData.endTime,
                isAllDay: cellData[eventSettingsFields?.isAllDay] ?? cellData?.isAllDay ?? false,
                recurrenceRule: cellData[eventSettingsFields?.recurrenceRule] ?? (cellData as EventModel)?.recurrenceRule
            };
            if (!isNullOrUndefined(cellData?.groupIndex)) {
                setCurrentCellGroupIndex(cellData.groupIndex as number);
            }
            setSubject(cellInfo.subject);
            setLocation(cellInfo.location);
            setDescription(cellInfo.description);
            setOriginalData(undefined);
            setRepeatDropData(cellInfo.startTime, cellInfo.recurrenceRule);
            if (cellInfo.isAllDay) {
                const cellStartEnd: Date = DateService.normalizeDate(cellInfo.startTime);
                setStartTime(cellStartEnd);
                setEndTime(cellStartEnd);
            } else {
                setStartTime(cellInfo.startTime);
                setEndTime(cellInfo.endTime);
            }
            setIsAllDay(cellInfo.isAllDay);
            setUseTimezone(false);
            setOpen(true);
        }, [setRepeatDropData]);

    const validateRequiredFields: (getString: (key: string) => string) => string | null = useCallback(
        (getString: (key: string) => string): string | null => {
            if (!startDateOnly || !endDateOnly) {
                return getString('invalidDateValue');
            }
            if (!isAllDay && (!startTimeOnly || !endTimeOnly)) {
                return getString('invalidTimeValue');
            }
            let computedStart: Date | undefined;
            let computedEnd: Date | undefined;

            if (isAllDay) {
                computedStart = startDateOnly ? DateService.normalizeDate(startDateOnly) : undefined;
                computedEnd = endDateOnly ? DateService.normalizeDate(endDateOnly) : undefined;
            } else {
                computedStart = DateService.combineDateAndTime(startDateOnly, startTimeOnly);
                computedEnd = DateService.combineDateAndTime(endDateOnly, endTimeOnly);
            }

            if (computedStart && computedEnd && computedEnd < computedStart) {
                return getString('invalidDateRange');
            }
            return null;
        }, [startDateOnly, startTimeOnly, endDateOnly, endTimeOnly, isAllDay]);

    const recurrenceStart: Date | undefined = useMemo((): Date | undefined => {
        if (isAllDay) {
            return startDateOnly ? DateService.normalizeDate(startDateOnly) : startTime;
        }
        return DateService.combineDateAndTime(startDateOnly, startTimeOnly) ?? startTime;
    }, [isAllDay, startDateOnly, startTimeOnly, startTime]);

    const computedStartTime: Date | undefined = isAllDay
        ? (startDateOnly ? DateService.normalizeDate(startDateOnly) : startTime)
        : (DateService.combineDateAndTime(startDateOnly, startTimeOnly) ?? startTime);

    const computedEndTime: Date | undefined = isAllDay
        ? (endDateOnly ? DateService.normalizeDate(endDateOnly) : endTime)
        : (DateService.combineDateAndTime(endDateOnly, endTimeOnly) ?? endTime);

    const data: EventModel = {
        subject, location, startTime: computedStartTime, endTime: computedEndTime, isAllDay,
        description, recurrenceRule, startTimezone: useTimezone ? startTimezone : undefined,
        endTimezone: useTimezone ? endTimezone : undefined, ...resourceValues
    };

    return {
        open,
        data,
        action,
        originalData,
        setOpen,
        onCellDoubleClickHandler,
        onEventDoubleClickHandler,
        onClose,
        startDateOnly,
        startTimeOnly,
        endDateOnly,
        endTimeOnly,
        slotDuration,
        recurrenceStart,
        repeatModeValue,
        repeatData,
        recurrenceOpen,
        setSlotDuration,
        handleSubjectChange,
        handleLocationChange,
        handleDescriptionChange,
        handleStartDateChange,
        handleStartTimeChange,
        handleEndDateChange,
        handleEndTimeChange,
        handleIsAllDayChange,
        handleRecurrenceRuleChange,
        handleRepeatModeChange,
        handleStartTimezoneChange,
        handleEndTimezoneChange,
        handleUseTimezoneChange,
        closeRecurrenceEditor,
        onEditEvent,
        onMoreDetails,
        formState,
        setFormState,
        formRef,
        validateRequiredFields,
        resourceValues,
        setResourceValues,
        handleResourceChange,
        currentCellGroupIndex
    };
};

export default useEditorPopup;

