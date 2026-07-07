import { forwardRef, JSX, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { InputBase, HelperText, renderFloatLabelElement } from '@syncfusion/react-inputs';
import { Browser, Color, IL10n, L10n, preRender, Size, useProviderContext, Variant, useStableId } from '@syncfusion/react-base';
import { Popup, CollisionType, type IPopup } from '@syncfusion/react-popups';
import { ChevronLeftIcon, ChevronRightIcon, CloseIcon, TimelineTodayIcon } from '@syncfusion/react-icons';
import { Calendar, InputPrefix, InputSuffix } from '../calendar';
import type { CalendarProps, CalendarChangeEvent, CalendarHeaderProps } from '../calendar';
import { CalendarView } from '../calendar';
import type { ICalendar } from '../calendar';
import { inRange } from '../calendar/utils';
import { DateTimePickerProps, DateTimePickerChangeEvent } from './types';
import TimeList, { TimeListRef } from '../timepicker/timepicker-list';
import { clampTimeToRange, getTimeValue, isTimeWithinRange } from '../timepicker/utils';
import * as React from 'react';
import { createIsDateDisabledByCellTemplate, getFocusableElementsInRoot } from '../datepicker/utils';
import { PickerVariant } from '../datepicker/types';
import { CalendarSystem, createCalendarSystem } from '../calendar-core';
import usePickerInput, { UsePickerInputResult } from '../hooks/usePickerInputs';
import usePickerInputKeyDown from '../hooks/usePickerInputKeyDown';
import usePickerPopup from '../hooks/usePickerPopup';
import useTimePanel from '../hooks/useTimePanel';
import useDateFormatting from '../hooks/useDateFormatting';
import { Button } from '@syncfusion/react-buttons';

type IDateTimePickerProps = IDateTimePicker & Omit<React.InputHTMLAttributes<HTMLInputElement>, keyof IDateTimePicker>;

export interface IDateTimePicker extends DateTimePickerProps {
    /**
     * The component root element.
     *
     * @private
     */
    element?: HTMLSpanElement | null;
}

/**
 * The DateTimePicker component provides an input with an integrated calendar and time popup for selecting a single date and time value.
 * It supports date and time formatting, parsing, min/max date-time constraints, strict mode validation, custom calendar and time templates,
 * and can be rendered as an inline picker or a dialog-based picker.
 *
 * ```typescript
 * import { DateTimePicker } from '@syncfusion/react-calendars';
 *
 * export default function App() {
 *   return <DateTimePicker />;
 * }
 * ```
 */
export const DateTimePicker: React.ForwardRefExoticComponent<IDateTimePickerProps & React.RefAttributes<IDateTimePicker>> =
    forwardRef<IDateTimePicker, IDateTimePickerProps>((props: IDateTimePickerProps, ref: React.Ref<IDateTimePicker>) => {
        const {
            className = '',
            id,
            placeholder = 'Select a date and time',
            disabled = false,
            readOnly = false,
            variant = Variant.Standard,
            labelMode = 'Never',
            format = 'M/d/yyyy hh:mm a',
            inputFormats,
            clearButton = true,
            strictMode = false,
            openOnFocus = false,
            editable = true,
            value,
            defaultValue,
            minDate = new Date(1900, 0, 1),
            maxDate = new Date(2099, 11, 31),
            minTime,
            maxTime,
            step = 30,
            start = CalendarView.Month,
            depth = CalendarView.Month,
            open,
            firstDayOfWeek = 0,
            weekNumber = false,
            weekRule,
            showTodayButton = true,
            weekDaysFormat,
            pickerVariant = PickerVariant.Auto,
            showDaysOutsideCurrentMonth,
            disablePastDays,
            disableFutureDays,
            required = false,
            valid,
            validationMessage = '',
            validityStyles = true,
            pickerIcon = true,
            prefix,
            suffix,
            itemTemplate,
            cellTemplate,
            headerTemplate,
            onChange,
            onOpen,
            onClose,
            onViewChange,
            inputProps,
            popupSettings,
            helperText,
            helperTextOnFocus = false,
            helperTextDirection = 'Left',
            calendarType,
            inputMask = false,
            maskPlaceholder,
            ...otherProps
        } = props;

        const generatedId: string = useStableId('sf-datetimepicker');
        const dateTimePickerId: string = id ?? generatedId;
        const { locale, dir } = useProviderContext();
        const l10n: IL10n = useMemo<IL10n>(() => L10n('datetimepicker', {
            date: 'Date',
            time: 'Time',
            cancel: 'Cancel',
            set: 'Set',
            now: 'Now',
            today: 'Today',
            toggleDateTime: 'Toggle date-time selector',
            clearValue: 'Clear value',
            previous: 'Previous',
            next: 'Next'
        }, locale || 'en-US'), [locale]);
        const calendarSystem: CalendarSystem = useMemo<CalendarSystem>(() => createCalendarSystem(calendarType || 'gregorian'), [calendarType]);
        const containerRef: React.RefObject<HTMLSpanElement | null> = useRef<HTMLSpanElement | null>(null);
        const inputRef: React.RefObject<HTMLInputElement | null> = useRef<HTMLInputElement | null>(null);
        const popupRef: React.RefObject<IPopup | null> = useRef<IPopup | null>(null);
        const calendarRef: React.RefObject<ICalendar | null> = useRef<ICalendar | null>(null);
        const [isIconActive, setIsIconActive] = useState(false);
        const [isPopupOpen, setIsPopupOpen] = useState(false);
        const isOpenControlled: boolean = open !== undefined;
        const currentOpen: boolean = isOpenControlled ? !!open : isPopupOpen;
        const isControlled: boolean = value !== undefined;
        const [innerValue, setInnerValue] = useState<Date | null>(value ?? defaultValue ?? null);
        const currentValue: Date | null = isControlled ? (value ?? null) : innerValue;
        const [activePanel, setActivePanel] = useState<'date' | 'time'>('date');
        const [tempValue, setTempValue] = useState<Date | null>(currentValue);
        const useDialog: boolean = pickerVariant === PickerVariant.Popup || (pickerVariant === PickerVariant.Auto && Browser.isDevice);
        const useInline: boolean = pickerVariant === PickerVariant.Inline || (pickerVariant === PickerVariant.Auto && !Browser.isDevice);
        const chevronLeft: React.ReactNode = <ChevronLeftIcon viewBox="0 0 26 24" />;
        const chevronRight: React.ReactNode = <ChevronRightIcon viewBox="0 0 20 26" />;
        const [nowClicked, setNowClicked] = useState<boolean>(false);
        const { formatValue: formatDateTime, parseInput } = useDateFormatting({
            locale,
            type: 'dateTime',
            format,
            inputFormats,
            calendarType
        });

        const deriveTimeFormat: string = useMemo(() => {
            const f: string = typeof format === 'string' ? format : '';
            if (!f) {
                return 'hh:mm a';
            }
            const is24h: boolean = /(^|[^aA])[Hk]{1,2}/.test(f);
            const hasSeconds: boolean = /s{1,2}/.test(f);
            const hasAmPm: boolean = /a+/.test(f);
            let timeFmt: string = is24h ? 'HH:mm' : 'hh:mm';
            if (hasSeconds) {
                timeFmt += ':ss';
            }
            if (!is24h) {
                timeFmt += hasAmPm ? ' a' : ' a';
            }
            return timeFmt;
        }, [format]);

        const isDateDisabledByCellTemplate: (date: Date) => boolean = useCallback((date: Date) =>
            createIsDateDisabledByCellTemplate(
                cellTemplate,
                currentValue && !Array.isArray(currentValue) ? currentValue : null,
                minDate,
                maxDate,
                calendarSystem
            )(date), [cellTemplate, currentValue, minDate, maxDate, calendarSystem]);

        const isDateValid: (d: Date | null) => boolean = useCallback((d: Date | null) => {
            if (!d || isNaN(d.getTime())) {
                return false;
            }
            const onlyDate: Date = new Date(d);
            onlyDate.setHours(0, 0, 0, 0);
            if (!inRange(onlyDate, minDate, maxDate)) {
                return false;
            }
            if (isDateDisabledByCellTemplate(onlyDate)) {
                return false;
            }
            return true;
        }, [minDate, maxDate, isDateDisabledByCellTemplate]);

        const isDateTimeValid: (date: Date | null)
        => boolean = useCallback((date: Date | null): boolean => {
            if (!isDateValid(date)) {
                return false;
            }
            if (!date) {
                return false;
            }
            if (minTime || maxTime) {
                return isTimeWithinRange(date, minTime || null, maxTime || null);
            }
            return true;
        }, [isDateValid, minTime, maxTime]);

        const commitValue: (d: Date | null, event?: React.SyntheticEvent)
        => void = useCallback((d: Date | null, event?: React.SyntheticEvent): void => {
            if (!isControlled) {
                setInnerValue(d);
            }
            const nextValid: boolean = valid !== undefined ? valid : (required ? d !== null : true);
            if (inputRef.current) {
                inputRef.current.setCustomValidity(nextValid ? '' : (validationMessage || ''));
            }
            onChange?.({ value: d, event } as DateTimePickerChangeEvent);
        }, [isControlled, onChange, required, valid, validationMessage]);

        const {
            displayedTimes,
            formatTime,
            timeListRef,
            ensureSelectedVisible,
            forwardListKeyDown
        } = useTimePanel({
            step,
            minTime,
            maxTime,
            locale,
            timeFormat: deriveTimeFormat
        });

        const snapToNearestTime: (date: Date | null) => Date | null = useCallback((date: Date | null): Date | null => {
            if (date == null || displayedTimes.length === 0) {
                return date;
            }
            const target: number = getTimeValue(date);
            const nearest: Date = displayedTimes.reduce((prev: Date, curr: Date) => {
                const diffPrev: number = Math.abs(getTimeValue(prev) - target);
                const diffCurr: number = Math.abs(getTimeValue(curr) - target);
                if (diffCurr === diffPrev) {
                    return getTimeValue(curr) < getTimeValue(prev) ? curr : prev;
                }
                return diffCurr < diffPrev ? curr : prev;
            });
            const snapped: Date = new Date(date);
            snapped.setHours(nearest.getHours(), nearest.getMinutes(), 0, 0);
            return snapped;
        }, [displayedTimes]);

        const openPopup: () => void = useCallback((): void => {
            if (disabled || readOnly) {
                return;
            }
            if (!currentOpen && !isOpenControlled) {
                setIsPopupOpen(true);
                const snapped: Date | null = snapToNearestTime(currentValue);
                setTempValue(snapped);
                setActivePanel('date');
            }
            setIsIconActive(true);
        }, [disabled, readOnly, currentOpen, isOpenControlled, currentValue, snapToNearestTime, onOpen]);

        const closePopup: () => void = useCallback((): void => {
            if (currentOpen) {
                if (!isOpenControlled) {
                    setIsPopupOpen(false);
                }
                setIsIconActive(false);
                setActivePanel('date');
                onClose?.();
            }
        }, [currentOpen, isOpenControlled, onClose]);

        const { resolvedPopupSettings } = usePickerPopup({
            open: currentOpen,
            disabled,
            readOnly,
            onClose: () => {
                closePopup();
                setIsIconActive(false);
            },
            containerRef,
            contentRefs: [popupRef as unknown as React.RefObject<HTMLElement | null>],
            inputRef,
            popupSettings,
            onAltDownGlobal: () => {
                if (!currentOpen) {
                    openPopup();
                } else {
                    closePopup();
                }
            },
            onAltUpGlobal: () => {
                closePopup();
                inputRef.current?.focus();
            },
            onEscapeGlobal: () => {
                closePopup();
                inputRef.current?.focus();
            }
        });

        const getFocusableElements: () => HTMLElement[] = useCallback((): HTMLElement[] => {
            const root: Element | undefined = popupRef.current?.element as Element | undefined;
            return getFocusableElementsInRoot(root);
        }, []);

        const onCalendarChange: (e: CalendarChangeEvent)
        => void = useCallback((e: CalendarChangeEvent): void => {
            const pickedDate: Date | null = (e?.value as Date) || null;
            if (!pickedDate) {
                return;
            }
            const hours: number = currentValue ? currentValue.getHours() : 0;
            const minutes: number = currentValue ? currentValue.getMinutes() : 0;
            const combined: Date = new Date(pickedDate);
            combined.setHours(hours, minutes, 0, 0);
            if (isDateValid(combined)) {
                setTempValue(combined);
            }
        }, [tempValue, isDateValid]);

        const onTodayClick: () => void = useCallback((): void => {
            if (disabled || readOnly) {
                return;
            }
            const now: Date = new Date();
            setTempValue(now);
        }, [disabled, readOnly, calendarRef]);

        const customHeaderTemplate: ((props: CalendarHeaderProps) => React.ReactNode) | undefined = useMemo(() => {
            if (headerTemplate) {
                return headerTemplate;
            }
            return ({ headerTitle, onPrevClick, onNextClick, onTitleClick, disabled, currentView }: CalendarHeaderProps) => {
                const isDecade: boolean = String(currentView).toLowerCase() === 'decade';
                return (
                    <div className="sf-calendar-header">
                        <Button
                            onClick={onPrevClick}
                            className="sf-radius-full"
                            aria-label={l10n.getConstant('previous')}
                            variant={Variant.Standard}
                            tabIndex={(disabled || isDecade) ? -1 : 0}
                            color={Color.Secondary}
                            icon={dir === 'rtl' ? chevronRight : chevronLeft}
                            aria-disabled={disabled}
                        ></Button>
                        <Button
                            size={Size.Small}
                            variant={Variant.Standard}
                            color={Color.Secondary}
                            onClick={onTitleClick}
                            aria-label={`${headerTitle}`}
                            aria-disabled={disabled}

                        >
                            {headerTitle}
                        </Button>
                        <Button
                            onClick={onNextClick}
                            className="sf-radius-full"
                            variant={Variant.Standard}
                            color={Color.Secondary}
                            tabIndex={(disabled || isDecade) ? -1 : 0}
                            aria-label={l10n.getConstant('next')}
                            aria-disabled={disabled}
                            icon={dir === 'rtl' ? chevronLeft : chevronRight}>
                        </Button>
                        {showTodayButton && (
                            <Button
                                tabIndex={disabled ? -1 : 0}
                                className="sf-today sf-radius-2"
                                variant={Variant.Standard}
                                disabled={disabled}
                                onClick={onTodayClick}

                            >
                                {l10n.getConstant('today')}
                            </Button>
                        )}
                    </div>
                );
            };
        }, [headerTemplate]);

        const calendarProps: CalendarProps = useMemo(() => ({
            value: tempValue,
            minDate,
            maxDate,
            start,
            depth,
            firstDayOfWeek,
            weekNumber,
            weekRule,
            showTodayButton: false,
            showDaysOutsideCurrentMonth,
            disablePastDays,
            disableFutureDays,
            weekDaysFormat,
            calendarType,
            cellTemplate,
            headerTemplate: customHeaderTemplate,
            onChange: onCalendarChange,
            onViewChange: onViewChange
        }), [
            tempValue, minDate, maxDate, start, depth, firstDayOfWeek, weekNumber, weekRule,
            weekDaysFormat, cellTemplate, customHeaderTemplate, calendarType,
            onCalendarChange, onViewChange, showDaysOutsideCurrentMonth, disablePastDays, disableFutureDays
        ]);

        useImperativeHandle(ref, () => ({
            placeholder,
            editable,
            inputFormats,
            openOnFocus,
            format,
            labelMode,
            disabled,
            readOnly,
            open,
            clearButton,
            strictMode,
            pickerVariant,
            value: currentValue,
            minDate, maxDate, minTime, maxTime,
            step,
            firstDayOfWeek,
            start,
            depth,
            weekNumber,
            weekRule,
            showTodayButton,
            pickerIcon,
            weekDaysFormat,
            required,
            valid,
            validationMessage,
            validityStyles,
            prefix,
            suffix,
            cellTemplate,
            headerTemplate,
            showDaysOutsideCurrentMonth,
            disablePastDays,
            disableFutureDays,
            inputProps,
            popupSettings,
            helperText,
            helperTextOnFocus,
            helperTextDirection,
            calendarType,
            element: containerRef.current
        } as IDateTimePicker), [
            placeholder, editable, inputFormats, openOnFocus, format, labelMode, disabled, readOnly, open, clearButton,
            strictMode, pickerVariant, currentValue, minDate, maxDate, minTime, maxTime, step, firstDayOfWeek,
            start, depth, weekNumber, weekRule, showTodayButton, pickerIcon, weekDaysFormat, required, valid, validationMessage,
            validityStyles, cellTemplate, headerTemplate, showDaysOutsideCurrentMonth,
            disablePastDays, disableFutureDays, calendarType
        ]);

        useEffect(() => {
            preRender('datetimepicker');
        }, []);

        const pickerInput: UsePickerInputResult = usePickerInput({
            locale,
            inputRef,
            placeholder,
            placeholderKey: 'datetimepicker',
            labelMode,
            disabled,
            readOnly,
            editable,
            openOnFocus,
            strictMode,
            required,
            valid,
            validationMessage,
            value: currentValue,
            formatValue: formatDateTime,
            parseInput,
            isValid: isDateTimeValid,
            commitValue,
            onOpen: openPopup,
            inputMask,
            format,
            maskPlaceholder
        });

        const onPopupOpen: () => void = useCallback((): void => {
            if (activePanel === 'date') {
                calendarRef.current?.focusGrid?.();
            } else {
                ensureSelectedVisible();
            }
            onOpen?.();
        }, [onOpen, activePanel]);

        const togglePopup: () => void = useCallback((): void => {
            if (currentOpen) {
                closePopup();
            } else {
                openPopup();
            }
        }, [currentOpen, openPopup, closePopup]);

        const handleIconClick: () => void = useCallback((): void => {
            togglePopup();
            setIsIconActive(true);
        }, [togglePopup]);

        const handleClearMouseDown: (e: React.MouseEvent<HTMLSpanElement>)
        => void = useCallback((e: React.MouseEvent<HTMLSpanElement>): void => {
            e.preventDefault();
            pickerInput.handleClear();
            if (currentOpen) {
                closePopup();
            }
        }, [pickerInput, currentOpen, closePopup]);

        const handleTimeSelect: (t: Date) => void = useCallback((t: Date): void => {
            const datePart: Date = tempValue ? new Date(tempValue) : new Date();
            datePart.setHours(t.getHours(), t.getMinutes(), 0, 0);
            if (isDateTimeValid(datePart)) {
                setTempValue(datePart);
            } else {
                if (!isControlled) {
                    setInnerValue(datePart);
                    pickerInput.setInputValue(formatDateTime(datePart));
                } else {
                    onChange?.({ value: datePart } as DateTimePickerChangeEvent);
                }
                pickerInput.setIsInputValid(false);
            }
        }, [tempValue, isDateTimeValid, commitValue, isControlled, onChange, formatDateTime, pickerInput]);

        const handleKeyDown: (e: React.KeyboardEvent<HTMLElement>)
        => void = useCallback((e: React.KeyboardEvent<HTMLElement>): void => {
            let focusableElements: HTMLElement[];
            let currentElement: HTMLElement | null;
            let currentIndex: number;
            let nextIndex: number;
            switch (e.key) {
            case 'ArrowDown':
                if (e.altKey || e.metaKey) {
                    e.preventDefault();
                    if (!currentOpen) {
                        openPopup();
                    }
                }
                break;
            case 'ArrowUp':
                if (e.altKey || e.metaKey) {
                    e.preventDefault();
                    closePopup();
                }
                break;
            case 'Enter':
                if (e.target === inputRef.current) {
                    e.preventDefault();
                    if (editable && !readOnly && !disabled) {
                        commitInput(e);
                    }
                }
                break;
            case 'Tab':
                focusableElements = getFocusableElements();
                if (!focusableElements.length) {
                    return;
                }
                e.preventDefault();
                e.stopPropagation();
                currentElement = document.activeElement as HTMLElement | null;
                currentIndex = currentElement ? focusableElements.indexOf(currentElement) : -1;
                nextIndex = e.shiftKey
                    ? (currentIndex <= 0 ? focusableElements.length - 1 : currentIndex - 1)
                    : (currentIndex >= focusableElements.length - 1 ? 0 : currentIndex + 1);
                focusableElements[nextIndex as number]?.focus();
                break;
            default:
                break;
            }
        }, [openPopup, closePopup, editable, readOnly, disabled, pickerInput.inputValue, parseInput,
            isDateValid, strictMode, currentValue, commitValue, formatDateTime, currentOpen, activePanel,
            isDateTimeValid, pickerInput, forwardListKeyDown]);

        const applyCommitAndInput: (d: Date | null, e?: React.SyntheticEvent, isValid?: boolean)
        => void = useCallback((d: Date | null, e?: React.SyntheticEvent, isValid?: boolean) => {
            if (d) {
                pickerInput.setInputValue(formatDateTime(d));
            } else {
                pickerInput.setInputValue('');
            }
            commitValue(d, e);
            const validFlag: boolean = isValid ?? (d ? true : !required);
            pickerInput.setIsInputValid(validFlag);
        }, [pickerInput, commitValue, formatDateTime, required]);

        const handleInputKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void = usePickerInputKeyDown({
            maskOnKeyDown: pickerInput.maskInputProps?.onKeyDown,
            pickerOnKeyDown: handleKeyDown
        });

        const handleOutOfRangeDateTime: (candidate: Date, e?: React.SyntheticEvent)
        => void = useCallback((candidate: Date, e?: React.SyntheticEvent): void => {
            const clamped: Date | null = clampTimeToRange(candidate, minTime ?? null, maxTime ?? null);
            if (clamped) {
                applyCommitAndInput(clamped, e, true);
            } else {
                applyCommitAndInput(null, e);
            }
        }, [minTime, maxTime, applyCommitAndInput]);

        const commitInput: (e?: React.SyntheticEvent) => void = useCallback((e?: React.SyntheticEvent): void => {
            const text: string = pickerInput.inputValue;
            const trimmed: string = text.trim();
            if (trimmed === '') {
                if (strictMode && required) {
                    if (currentValue) {
                        applyCommitAndInput(currentValue, e, true);
                    } else {
                        applyCommitAndInput(null, e, false);
                    }
                } else {
                    applyCommitAndInput(null, e);
                }
                return;
            }
            const parsed: Date | null = parseInput(text);
            if (strictMode) {
                if (!parsed || !isDateValid(parsed)) {
                    if (currentValue) {
                        applyCommitAndInput(currentValue, e, true);
                    } else {
                        applyCommitAndInput(null, e);
                    }
                    return;
                }
                if (isDateTimeValid(parsed)) {
                    applyCommitAndInput(parsed, e, true);
                } else {
                    handleOutOfRangeDateTime(parsed, e);
                }
                return;
            }
            if (parsed && isDateValid(parsed) && isDateTimeValid(parsed)) {
                applyCommitAndInput(parsed, e, true);
            } else {
                pickerInput.setIsInputValid(false);
            }
        }, [
            pickerInput,
            strictMode,
            required,
            currentValue,
            formatDateTime,
            parseInput,
            isDateValid,
            isDateTimeValid,
            commitValue,
            handleOutOfRangeDateTime,
            applyCommitAndInput
        ]);

        const classNames: string = [
            'sf-input-group sf-medium sf-control',
            'sf-datetimepicker',
            disabled ? 'sf-disabled' : '',
            readOnly ? 'sf-readonly' : '',
            (currentOpen || pickerInput.isFocused) ? 'sf-input-focus' : '',
            labelMode !== 'Never' ? 'sf-float-input' : '',
            dir === 'rtl' ? 'sf-rtl' : '',
            !pickerInput.isInputValid && validityStyles ? 'sf-error' : '',
            variant && variant.toLowerCase() !== 'standard'
                ? variant.toLowerCase() === 'outlined' ? 'sf-outline' : `sf-${variant.toLowerCase()}`
                : '',
            className
        ].filter(Boolean).join(' ');

        const iconClassNames: string = [
            'sf-input-icon', 'sf-icons',
            isIconActive ? 'sf-active' : '',
            (disabled || inputProps?.disabled) ? 'sf-disabled' : ''
        ].filter(Boolean).join(' ');

        const getCurrentTimeString: () => string = useCallback((): string => {
            if (tempValue) {
                return formatTime(tempValue);
            }
            if (displayedTimes.length > 0) {
                return formatTime(displayedTimes[0]);
            }
            return '';
        }, [tempValue, formatTime, displayedTimes]);

        const handleNowClick: () => void = useCallback((): void => {
            if (!displayedTimes || displayedTimes.length === 0) {
                return;
            }
            const now: Date = new Date();
            const snapped: Date | null = snapToNearestTime(now);
            setTempValue(snapped);
            setNowClicked(true);
        }, [displayedTimes, snapToNearestTime]);

        useEffect(() => {
            if (nowClicked) {
                timeListRef.current?.ensureSelectedVisible();
                setNowClicked(false);
            }
        }, [nowClicked]);

        const handleCalendarRef: (node: ICalendar) => void = useCallback((node: ICalendar) => {
            (calendarRef as React.RefObject<ICalendar>).current = node;
        }, []);

        const handleTimeListRef: (node: TimeListRef) => void = useCallback((node: TimeListRef) => {
            (timeListRef as React.RefObject<TimeListRef>).current = node;
        }, []);

        useEffect(() => {
            if (!currentOpen) {
                return;
            }
            if (activePanel === 'date') {
                calendarRef.current?.focusGrid?.();
            } else if (activePanel === 'time') {
                timeListRef.current?.focus?.();
            }
        }, [currentOpen, activePanel]);

        const timeListNode: JSX.Element = useMemo(() => (
            <>
                <div className="sf-datetimepicker-toolbar">
                    <span className="sf-toolbar-time sf-size-medium">{getCurrentTimeString()}</span>
                    <Button
                        className="sf-now-btn"
                        onClick={handleNowClick}
                        variant={Variant.Standard}
                    >
                        {l10n.getConstant('now')}
                    </Button>
                </div>
                <TimeList
                    ref={handleTimeListRef}
                    times={displayedTimes}
                    selected={tempValue}
                    onSelect={handleTimeSelect}
                    formatter={formatTime}
                    itemTemplate={itemTemplate}
                    idBase={`${dateTimePickerId}_time`}
                    className="sf-timepicker-list"
                    sizeClass="sf-timepicker-list-la"
                    isOpen={currentOpen && activePanel === 'time'}
                    dir={dir as 'ltr' | 'rtl'}
                />
            </>
        ), [
            displayedTimes,
            currentValue,
            formatTime,
            itemTemplate,
            currentOpen,
            activePanel,
            dir,
            handleTimeSelect,
            handleTimeListRef,
            dateTimePickerId
        ]);

        const handleSetClick: () => void = useCallback((): void => {
            if (tempValue && isDateTimeValid(tempValue)) {
                commitValue(tempValue);
                closePopup();
                inputRef.current?.focus();
            }
        }, [tempValue, isDateTimeValid, commitValue, closePopup]);

        const handleCancelClick: () => void = useCallback((): void => {
            setTempValue(currentValue);
            closePopup();
            inputRef.current?.focus();
        }, [currentValue, closePopup]);

        const isSetEnabled: boolean = useMemo(() => {
            if (!tempValue) {
                return false;
            }
            return isDateTimeValid(tempValue);
        }, [tempValue, isDateTimeValid]);

        const renderHeaderTabs: () => JSX.Element = () => (
            <div className="sf-datetimepicker-tab" role="tablist">
                <Button
                    type="button"
                    role="tab"
                    aria-selected={activePanel === 'date'}
                    selected={activePanel === 'date'}
                    className={'sf-dtp-tab date'}
                    variant={activePanel === 'date' ? Variant.Filled : Variant.Outlined}
                    color={activePanel === 'date' ? Color.Primary : Color.Secondary}
                    onClick={() => setActivePanel('date')}
                >
                    {l10n.getConstant('date')}
                </Button>
                <Button
                    type="button"
                    role="tab"
                    aria-selected={activePanel === 'time'}
                    selected={activePanel === 'time'}
                    className={'sf-dtp-tab time'}
                    variant={activePanel === 'time' ? Variant.Filled : Variant.Outlined}
                    color={activePanel === 'time' ? Color.Primary : Color.Secondary}
                    onClick={() => setActivePanel('time')}
                >
                    {l10n.getConstant('time')}
                </Button>
            </div>
        );

        const renderFooter: () => JSX.Element = () => (
            <div className="sf-datetimepicker-footer">
                <Button
                    type="button"
                    className="sf-dtp-cancel"
                    color={Color.Secondary}
                    variant={Variant.Standard}
                    onClick={handleCancelClick}
                >
                    {l10n.getConstant('cancel')}
                </Button>
                <Button
                    type="button"
                    className="sf-dtp-set"
                    onClick={handleSetClick}
                    variant={Variant.Standard}
                    disabled={!isSetEnabled}
                >
                    {l10n.getConstant('set')}
                </Button>
            </div>
        );

        const handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void = (
            e: React.ChangeEvent<HTMLInputElement>
        ) => {
            if (!pickerInput.maskInputProps && (!editable || readOnly || disabled)) {
                return;
            }
            if (pickerInput.maskInputProps?.onChange) {
                pickerInput.maskInputProps.onChange(e);
            } else {
                pickerInput.handleInputChange(e);
            }
        };

        return (
            <><span ref={containerRef} className={classNames} {...otherProps}>
                <InputPrefix prefix={prefix} />
                <InputBase
                    ref={inputRef}
                    id={dateTimePickerId}
                    placeholder={labelMode === 'Never' && !pickerInput.showMaskSegments ? pickerInput.getPlaceholder : ''}
                    disabled={disabled || (inputProps && inputProps.disabled)}
                    readOnly={readOnly || (inputProps && inputProps.readOnly) || (!editable && !inputMask) || !editable}
                    onFocus={pickerInput.handleInputFocus}
                    onBlur={pickerInput.handleInputBlur}
                    value={pickerInput.maskInputProps ? pickerInput.maskInputProps?.value : pickerInput.inputValue}
                    onChange={handleChange}
                    onKeyDown={handleInputKeyDown}
                    onClick={pickerInput.maskInputProps ? pickerInput.maskInputProps?.onClick : undefined}
                    onPaste={pickerInput.maskInputProps ? pickerInput.maskInputProps?.onPaste : undefined}
                    role="combobox"
                    aria-haspopup="dialog"
                    autoComplete='off'
                    aria-autocomplete="none"
                    aria-expanded={!!currentOpen}
                    aria-controls={currentOpen ? `${dateTimePickerId}_popup` : undefined}
                    aria-disabled={disabled || (inputProps && inputProps.disabled)}
                    tabIndex={inputProps?.disabled ? -1 : 0}
                    required={required}
                    {...inputProps}
                />
                <InputSuffix suffix={suffix} />
                {labelMode !== 'Never' && renderFloatLabelElement(
                    labelMode, false, pickerInput.inputValue, placeholder, dateTimePickerId
                )}
                {clearButton && (!!pickerInput.inputValue || !!pickerInput.hasPartialInput) && (pickerInput.isFocused || currentOpen)
                && !readOnly && (
                    <span
                        className="sf-clear-icon sf-input-icon"
                        aria-label={l10n.getConstant('clearValue')}
                        role="button"
                        onMouseDown={handleClearMouseDown}
                    >
                        <CloseIcon />
                    </span>
                )}
                <span
                    className={iconClassNames}
                    aria-label={l10n.getConstant('toggleDateTime')}
                    role="button"
                    onMouseDown={handleIconClick}
                >
                    {pickerIcon === true ? <TimelineTodayIcon viewBox="0 0 24 26" /> : pickerIcon}
                </span>
                {currentOpen && createPortal(
                    <>
                        {useDialog && (
                            <div className="sf-picker-popup" style={{ zIndex: resolvedPopupSettings?.zIndex?.toString() }}>
                                <div className="sf-overlay"></div>
                                <Popup
                                    ref={popupRef}
                                    id={`${dateTimePickerId}_popup`}
                                    className="sf-datetimepicker sf-popup sf-content-center"
                                    open={currentOpen}
                                    onClose={closePopup}
                                    onOpen={onPopupOpen}
                                    onKeyDown={handleKeyDown}
                                    relateTo={document.body}
                                    style={{ top: '0px', left: '0px', position: 'relative' }}
                                    position={{ X: 'center', Y: 'center' }}
                                    collision={{ X: CollisionType.Fit, Y: CollisionType.Fit }}
                                    role="dialog"
                                    {...resolvedPopupSettings}
                                >
                                    {renderHeaderTabs()}
                                    {activePanel === 'date' ? (
                                        <Calendar ref={handleCalendarRef} {...calendarProps} />
                                    ) : (
                                        timeListNode
                                    )}
                                    {renderFooter()}
                                </Popup>
                            </div>
                        )}
                        {useInline && (
                            <Popup
                                ref={popupRef}
                                id={`${dateTimePickerId}_popup`}
                                className="sf-datetimepicker sf-popup"
                                open={currentOpen}
                                onClose={closePopup}
                                onOpen={onPopupOpen}
                                onKeyDown={handleKeyDown}
                                relateTo={containerRef.current as HTMLElement}
                                position={{ X: 'left', Y: 'bottom' }}
                                collision={{ X: CollisionType.Flip, Y: CollisionType.Flip }}
                                offsetY={4}
                                role="dialog"
                                {...resolvedPopupSettings}
                            >
                                {renderHeaderTabs()}
                                {activePanel === 'date' ? (
                                    <Calendar ref={handleCalendarRef} {...calendarProps} />
                                ) : (
                                    timeListNode
                                )}
                                {renderFooter()}
                            </Popup>
                        )}
                    </>,
                    document.body
                )}
            </span>
            <HelperText
                helperText={helperText}
                helperTextOnFocus={helperTextOnFocus}
                isFocused={pickerInput.isFocused || currentOpen}
                helperTextDirection={helperTextDirection}
            />
            </>

        );
    });

DateTimePicker.displayName = 'DateTimePicker';
export default DateTimePicker;
