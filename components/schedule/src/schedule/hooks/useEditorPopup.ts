import { useCallback, useMemo, useState, Dispatch, SetStateAction, useEffect, useReducer } from 'react';
import { CellClickEvent, EventClickArgs, EventModel } from '../types/schedule-types';
import { DateService } from '../services/DateService';
import { CalendarChangeEvent } from '@syncfusion/react-calendars';
import { CheckboxChangeEvent } from '@syncfusion/react-buttons';
import { TextBoxChangeEvent, TextAreaChangeEvent } from '@syncfusion/react-inputs';
import { useSchedulePropsContext } from '../context/schedule-context';

export interface UseEditorPopupResult {
    open: boolean;
    setOpen: Dispatch<SetStateAction<boolean>>;
    onCellDoubleClickHandler: (args: CellClickEvent) => void;
    onEventDoubleClickHandler: (args: EventClickArgs) => void;
    onClose: () => void;
    subject: string;
    location: string;
    description: string;
    startTime?: Date;
    endTime?: Date;
    isAllDay: boolean;
    mode: 'cell' | 'event';
    originalData?: EventModel;
    startDateOnly?: Date;
    startTimeOnly?: Date;
    endDateOnly?: Date;
    endTimeOnly?: Date;
    slotDuration: number;
    handleSubjectChange: (args: TextBoxChangeEvent) => void;
    handleLocationChange: (args: TextBoxChangeEvent) => void;
    handleDescriptionChange: (args: TextAreaChangeEvent) => void;
    handleStartDateChange: (args: CalendarChangeEvent) => void;
    handleStartTimeChange: (args: CalendarChangeEvent) => void;
    handleEndDateChange: (args: CalendarChangeEvent) => void;
    handleEndTimeChange: (args: CalendarChangeEvent) => void;
    handleIsAllDayChange: (args: CheckboxChangeEvent) => void;
    onEditEvent: (eventData: EventModel) => void;
    onMoreDetails: (cellData: CellClickEvent) => void;
}

type EditorState = {
    subject: string;
    location: string;
    description: string;
    startTime?: Date;
    endTime?: Date;
    isAllDay: boolean;
    mode: 'cell' | 'event';
    originalData?: EventModel;
};

// useReducer for complex EditorState management
export type EditorFieldKey = keyof EditorState;

type EditorAction =
    | { type: 'setField'; key: EditorFieldKey; value: EditorState[EditorFieldKey] }
    | { type: 'setMany'; payload: Partial<EditorState> };

function editorReducer(state: EditorState, action: EditorAction): EditorState {
    switch (action.type) {
    case 'setField':
        return { ...state, [action.key]: action.value } as EditorState;
    case 'setMany':
        return { ...state, ...action.payload } as EditorState;
    default:
        return state;
    }
}

export const useEditorPopup: (
    onCellDoubleClick?: (args: CellClickEvent) => void,
    onEventDoubleClick?: (args: EventClickArgs) => void,
    closeAllPopups?: () => void
) => UseEditorPopupResult = (
    onCellDoubleClick?: (args: CellClickEvent) => void,
    onEventDoubleClick?: (args: EventClickArgs) => void,
    closeAllPopups?: () => void
): UseEditorPopupResult => {
    const [open, setOpen] = useState<boolean>(false);

    const initialEditorState: EditorState = {
        subject: '',
        location: '',
        description: '',
        startTime: undefined,
        endTime: undefined,
        isAllDay: false,
        mode: 'cell',
        originalData: undefined
    };

    const [state, dispatch] = useReducer(editorReducer, initialEditorState);

    const setSubject: (value: string) => void = useCallback((value: string) => dispatch({ type: 'setField', key: 'subject', value }), [dispatch]);
    const setLocation: (value: string) => void = useCallback((value: string) => dispatch({ type: 'setField', key: 'location', value }), [dispatch]);
    const setDescription: (value: string) => void = useCallback((value: string) => dispatch({ type: 'setField', key: 'description', value }), [dispatch]);
    const setStartTime: (value: Date | undefined) => void = useCallback((value: Date | undefined) => dispatch({ type: 'setField', key: 'startTime', value }), [dispatch]);
    const setEndTime: (value: Date | undefined) => void = useCallback((value: Date | undefined) => dispatch({ type: 'setField', key: 'endTime', value }), [dispatch]);
    const setIsAllDay: (value: boolean) => void = useCallback((value: boolean) => dispatch({ type: 'setField', key: 'isAllDay', value }), [dispatch]);
    const setMode: (value: 'cell' | 'event') => void = useCallback((value: 'cell' | 'event') => dispatch({ type: 'setField', key: 'mode', value }), [dispatch]);
    const setOriginalData: (value: EventModel) => void = useCallback((value?: EventModel) => dispatch({ type: 'setField', key: 'originalData', value }), [dispatch]);

    const onCellDoubleClickHandler: (args: CellClickEvent) => void = useCallback((args: CellClickEvent): void => {
        onCellDoubleClick?.(args);
        closeAllPopups?.();
        const start: Date = args.isAllDay ? DateService.normalizeDate(args.startTime) : args.startTime;
        const duration: {startTime: Date, endTime: Date} = { startTime: start, endTime: args.isAllDay ? start : args.endTime } as const;

        dispatch({
            type: 'setMany',
            payload: {
                subject: '',
                location: '',
                description: '',
                isAllDay: args.isAllDay,
                mode: 'cell',
                startTime: duration.startTime,
                endTime: duration.endTime
            }
        });
        setOpen(true);
    }, [onCellDoubleClick, closeAllPopups]);

    const onEventDoubleClickHandler: (args: EventClickArgs) => void = useCallback((args: EventClickArgs): void => {
        onEventDoubleClick?.(args);
        closeAllPopups?.();
        const isAllDay: boolean = Boolean(args?.data?.isAllDay);
        const start: Date = isAllDay ? DateService.normalizeDate(args.data.startTime) : args?.data?.startTime;
        const end: Date = isAllDay ? DateService.normalizeDate(args.data.endTime) : args?.data?.endTime;
        const duration: {startTime: Date, endTime: Date} = { startTime: start, endTime: end } as const;

        dispatch({
            type: 'setMany',
            payload: {
                mode: 'event',
                originalData: args?.data as EventModel,
                subject: args?.data?.subject ?? '',
                location: args?.data?.location ?? '',
                description: args?.data?.description ?? '',
                isAllDay,
                startTime: duration.startTime,
                endTime: duration.endTime
            }
        });
        setOpen(true);
    }, [onEventDoubleClick, closeAllPopups]);

    const onClose: () => void = useCallback(() => setOpen(false), []);

    const { subject, location, description, startTime, endTime, isAllDay, mode, originalData } = state;

    const { timeScale } = useSchedulePropsContext();

    // slot duration
    const slotDuration: number = useMemo(() => (
        timeScale?.interval / timeScale?.slotCount
    ), [timeScale?.interval, timeScale?.slotCount]);

    // local split date/time state
    const [startDateOnly, setStartDateOnly] = useState<Date | undefined>(undefined);
    const [startTimeOnly, setStartTimeOnly] = useState<Date | undefined>(undefined);
    const [endDateOnly, setEndDateOnly] = useState<Date | undefined>(undefined);
    const [endTimeOnly, setEndTimeOnly] = useState<Date | undefined>(undefined);
    const [endTimeChanged, setEndTimeChanged] = useState<boolean>(false);

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

    const combineDateAndTime: (date?: Date, time?: Date) => Date = useCallback((date?: Date, time?: Date): Date =>
        DateService.combineDateAndTime(date, time)
    , []);

    const handleStartDateChange: (args: CalendarChangeEvent) => void = useCallback((args: CalendarChangeEvent): void => {
        setStartDateOnly(args?.value as Date);
    }, []);

    const handleStartTimeChange: (args: CalendarChangeEvent) => void = useCallback((args: CalendarChangeEvent): void => {
        const time: Date = args?.value as Date;
        setStartTimeOnly(time);
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
        setEndTimeOnly(args?.value as Date);
        setEndTimeChanged(true);
    }, []);

    const handleIsAllDayChange: (args: CheckboxChangeEvent) => void = useCallback((args: CheckboxChangeEvent): void => {
        setIsAllDay(args?.value);
        if (mode === 'cell' && args?.value === false) {
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
    }, [mode, endTimeChanged, endTimeOnly, startTimeOnly, slotDuration, combineDateAndTime, startDateOnly, endDateOnly]);

    const handleSubjectChange: (args: TextBoxChangeEvent) => void = useCallback((args: TextBoxChangeEvent): void => {
        setSubject(args.value);
    }, []);

    const handleLocationChange: (args: TextBoxChangeEvent) => void = useCallback((args: TextBoxChangeEvent): void => {
        setLocation(args.value);
    }, []);

    const handleDescriptionChange: (args: TextAreaChangeEvent) => void = useCallback((args: TextAreaChangeEvent): void => {
        setDescription(args?.value);
    }, []);

    const onEditEvent: (eventData: EventModel) => void = useCallback((eventData: EventModel): void => {
        setMode('event');
        setSubject(eventData?.subject);
        setLocation(eventData?.location);
        setDescription(eventData?.description);
        setStartTime(eventData?.startTime);
        setEndTime(eventData?.endTime);
        setIsAllDay(!!eventData?.isAllDay);
        setOriginalData(eventData);
        setOpen(true);
    }, []);

    const onMoreDetails: (cellData: CellClickEvent) => void = useCallback((cellData: CellClickEvent): void => {
        setMode('cell');
        setSubject('');
        setLocation('');
        setDescription('');
        setOriginalData(undefined);
        if (cellData?.isAllDay) {
            const cellStartEnd: Date = DateService.normalizeDate(cellData.startTime);
            setStartTime(cellStartEnd);
            setEndTime(cellStartEnd);
        } else {
            setStartTime(cellData?.startTime);
            setEndTime(cellData?.endTime);
        }
        setIsAllDay(!!cellData?.isAllDay);
        setOpen(true);
    }, []);

    return {
        open,
        subject,
        location,
        description,
        startTime,
        endTime,
        isAllDay,
        mode,
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
        handleSubjectChange,
        handleLocationChange,
        handleDescriptionChange,
        handleStartDateChange,
        handleStartTimeChange,
        handleEndDateChange,
        handleEndTimeChange,
        handleIsAllDayChange,
        onEditEvent,
        onMoreDetails
    };
};

export default useEditorPopup;

