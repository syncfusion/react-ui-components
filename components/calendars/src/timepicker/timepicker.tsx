import * as React from 'react';
import { useState, useRef, useEffect, useCallback, forwardRef, useImperativeHandle, useId, useMemo } from 'react';
import { InputBase, renderFloatLabelElement } from '@syncfusion/react-inputs';
import { formatDate, parseDate, preRender, useProviderContext, Browser, Variant, Size, IL10n, L10n } from '@syncfusion/react-base';
import { CollisionType, getZindexPartial, IPopup, Popup } from '@syncfusion/react-popups';
import { ClockIcon, CloseIcon } from '@syncfusion/react-icons';
import { createPortal } from 'react-dom';
import { getTimeValue, isSameCalendarDay, isTimeWithinRange } from './utils';
import { TimePickerProps } from './types';
import { PickerVariant } from '../datepicker/types';
import { Button } from '@syncfusion/react-buttons';

type ITimePickerProps = ITimePicker & Omit<React.HTMLAttributes<HTMLDivElement>, 'defaultValue' | 'value' | 'onChange'>;

export interface ITimePicker extends TimePickerProps {
    /**
     * TimePicker element reference.
     *
     * @private
     * @default -
     */
    element?: HTMLSpanElement | null;
}

/**
 * The TimePicker component provides a time input with a list-based selector. It supports custom formats,
 * min/max time, step intervals, validation, strict mode, localization, item templates, and inline or dialog popup display.
 *
 * ```typescript
 * import { TimePicker } from '@syncfusion/react-calendars';
 *
 * export default function App() {
 *   return <TimePicker placeholder="Choose a time" step={30} />;
 * }
 * ```
 */
export const TimePicker: React.ForwardRefExoticComponent<ITimePickerProps & React.RefAttributes<ITimePicker>> =
    forwardRef<ITimePicker, ITimePickerProps>((props: ITimePickerProps, ref: React.Ref<ITimePicker>) => {
        const {
            value,
            id= `timepicker_${useId()}`,
            defaultValue,
            format = 'h:mm a',
            minTime,
            maxTime,
            step = 30,
            placeholder = 'Choose a time',
            variant = Variant.Standard,
            size = Size.Medium,
            readOnly = false,
            disabled = false,
            itemTemplate,
            clearButton = true,
            className = '',
            zIndex = 1000,
            strictMode = false,
            open,
            editable = true,
            fullScreenMode = false,
            pickerVariant = PickerVariant.Auto,
            openOnFocus = false,
            required = false,
            valid,
            validMessage = '',
            validityStyles = true,
            labelMode = 'Never',
            onChange,
            onOpen,
            onClose,
            ...otherProps
        } = props;

        const [isOpen, setIsOpen] = useState<boolean>(false);
        const [inputValue, setInputValue] = useState<string>('');
        const [selectedTime, setSelectedTime] = useState<Date | null>(value ?? defaultValue ?? null);
        const [timeList, setTimeList] = useState<Date[]>([]);
        const [isFocused, setIsFocused] = useState<boolean>(false);
        const [isInputValid, setIsInputValid] = useState<boolean>(valid !== undefined ? valid : (required ? selectedTime !== null : true));
        const [focusedItem, setFocusedItem] = useState<number | null>(null);
        const [isIconActive, setIsIconActive] = useState<boolean>(false);
        const containerRef: React.RefObject<HTMLSpanElement | null> = useRef<HTMLSpanElement>(null);
        const inputRef: React.RefObject<HTMLInputElement | null> = useRef<HTMLInputElement>(null);
        const popupRef: React.RefObject<IPopup | null> = useRef<IPopup>(null);
        const listRef: React.RefObject<HTMLUListElement | null> = useRef<HTMLUListElement>(null);
        const itemRefs: React.RefObject<(HTMLLIElement | null)[]> = useRef<Array<HTMLLIElement | null>>([]);
        const initialScrollDone: React.RefObject<boolean> = useRef<boolean>(false);
        const { dir, locale } = useProviderContext();
        const isControlled: boolean = value !== undefined;
        const currentValue: Date | null = isControlled ? (value || null) : selectedTime;
        const isOpenControlled: boolean = open !== undefined;
        const currentOpenState: boolean = open !== undefined ? !!open : isOpen;
        const mobRef: React.RefObject<HTMLDivElement | null> = useRef<HTMLDivElement | null>(null);
        const useDialog: boolean =
            pickerVariant === PickerVariant.Popup ||
            (pickerVariant === PickerVariant.Auto && Browser.isDevice);
        const useInline: boolean =
            pickerVariant === PickerVariant.Inline ||
            (pickerVariant === PickerVariant.Auto && !Browser.isDevice);

        useEffect(() => {
            const times: Date[] = [];
            const startTime: Date = new Date();
            startTime.setHours(0, 0, 0, 0);
            const endTime: Date = new Date();
            endTime.setHours(23, 59, 59, 999);
            const current: Date = new Date(startTime);
            while (current <= endTime) {
                const newTime: Date = new Date(current);
                times.push(newTime);
                current.setMinutes(current.getMinutes() + step);
            }
            setTimeList(times);
        }, [step]);

        const formatTimeValue: (time: Date) => string = useCallback((time: Date): string => {
            if (!time || isNaN(time.getTime())) {
                return '';
            }
            return formatDate(time, { format: format || 'h:mm a', type: 'time', locale: locale || 'en-US' });
        }, [locale, format]);

        useEffect(() => {
            if (currentValue) {
                const formattedValue: string = formatTimeValue(currentValue);
                if (inputValue !== formattedValue) {
                    setInputValue(formattedValue);
                }
            }
        }, [currentValue, formatTimeValue]);

        const getPlaceholder: string = useMemo(() => {
            const l10n: IL10n = L10n('timepicker', { placeholder: placeholder }, locale);
            l10n.setLocale(locale);
            const localized: string = l10n.getConstant('placeholder') as string;
            return localized || (placeholder || '');
        }, [locale, placeholder]);

        const parseTimeValue: (inputVal: string, requireExact?: boolean) => Date | null = useCallback(
            (inputVal: string, requireExact: boolean = false): Date | null => {
                if (!inputVal || !inputVal.trim()) {
                    return null;
                }
                const normalizedInput: string = inputVal
                    .replace(/(am|pm|Am|aM|pM|Pm)/g, (match: string) => match.toUpperCase())
                    .trim();
                const tryFormats: string[] = [
                    format,
                    'h:mm a',
                    'h:mm:ss a',
                    'HH:mm',
                    'HH:mm:ss'
                ].filter(Boolean) as string[];
                for (const fmt of tryFormats) {
                    const parsed: Date = parseDate(normalizedInput, {
                        format: fmt,
                        type: 'time',
                        locale: locale || 'en-US'
                    });
                    if (parsed && !isNaN(parsed.getTime())) {
                        if (!requireExact) {
                            return parsed;
                        }
                        const back: string = formatDate(parsed, { format: fmt, type: 'time', locale: locale || 'en-US' }).trim();
                        if (back === normalizedInput) {
                            return parsed;
                        }
                    }
                }
                if (!requireExact) {
                    const today: Date = new Date();
                    const dateStr: string = today.toLocaleDateString(locale);
                    const parsedDate: Date = new Date(`${dateStr} ${normalizedInput}`);
                    if (!isNaN(parsedDate.getTime())) {
                        return parsedDate;
                    }
                }
                return null;
            },
            [locale, format]
        );

        const isValidTime: (time: Date) => boolean = useCallback((time: Date): boolean => {
            if (!time || isNaN(time.getTime())) {
                return false;
            }
            const safeMinTime: Date | null = minTime || null;
            const safeMaxTime: Date | null = maxTime || null;
            return isTimeWithinRange(time, safeMinTime, safeMaxTime);
        }, [minTime, maxTime]);

        const showPopup: () => void = useCallback((): void => {
            if (disabled || readOnly) {
                return;
            }
            if (!currentOpenState && !isOpenControlled) {
                setIsOpen(true);
            }
        }, [disabled, readOnly, currentOpenState, isOpenControlled]);

        const hidePopup: () => void = useCallback((): void => {
            if (currentOpenState) {
                if (!isOpenControlled) {
                    setIsOpen(false);
                }
                if (onClose && popupRef.current) {
                    onClose();
                }
            }
        }, [currentOpenState, isOpenControlled, onClose]);

        const togglePopup: () => void = useCallback((): void => {
            if (currentOpenState) {
                hidePopup();
            } else {
                showPopup();
            }
        }, [disabled, readOnly, currentOpenState, hidePopup, showPopup]);

        useEffect(() => {
            if (!currentOpenState) {
                return;
            }
            const handleClickOutside: (e: MouseEvent) => void = (e: MouseEvent): void => {
                const target: Node = e.target as Node;
                if (!containerRef.current?.contains(target) && !popupRef.current?.element?.contains(target) &&
                !mobRef.current?.contains(target)) {
                    hidePopup();
                }
            };
            const handleKeyDown: (e: KeyboardEvent) => void = (e: KeyboardEvent): void => {
                if ((e.altKey || e.metaKey) && e.key === 'ArrowUp' || e.key === 'Escape' || e.key === 'Esc') {
                    e.preventDefault();
                    e.stopPropagation();
                    hidePopup();
                    setIsIconActive(false);
                    inputRef.current?.focus();
                }
            };
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('keydown', handleKeyDown);
            return () => {
                document.removeEventListener('mousedown', handleClickOutside);
                document.removeEventListener('keydown', handleKeyDown);
            };
        }, [currentOpenState, hidePopup]);

        const displayedTimes: Date[] = React.useMemo(() => {
            if (minTime || maxTime) {
                return timeList.filter((t: Date) => isValidTime(t));
            }
            return timeList;
        }, [timeList, minTime, maxTime, isValidTime]);

        const getCurrentValueIndex: () => number = useCallback((): number => {
            if (!currentValue) {
                return -1;
            }
            return timeList.findIndex((t: Date) => t.getHours() === currentValue.getHours() && t.getMinutes()
            === currentValue.getMinutes());
        }, [timeList, currentValue]);

        const scrollItemIntoView: (index: number | null) => void = useCallback((index: number | null): void => {
            if (index == null || index < 0) {
                return;
            }
            const el: HTMLLIElement | null = itemRefs.current[index as number];
            const listEl: HTMLUListElement | null = listRef.current;
            if (!el || !listEl) {
                return;
            }
            const itemTop: number = el.offsetTop;
            const itemHeight: number = el.offsetHeight || 32;
            const listHeight: number = listEl.clientHeight || 0;
            const targetScrollTop: number = Math.max(
                0,
                itemTop - Math.max(0, (listHeight - itemHeight) / 2)
            );
            listEl.scrollTop = targetScrollTop;
        }, []);

        const navigateTimeList: (direction: 'next' | 'prev' | 'first' | 'last') => void = useCallback(
            (direction: 'next' | 'prev' | 'first' | 'last') => {
                const count: number = displayedTimes.length;
                if (!count) {
                    return;
                }

                const startIndex: number = (() => {
                    if (focusedItem != null && focusedItem >= 0 && focusedItem < count) {
                        return focusedItem;
                    }
                    const sel: number = getCurrentValueIndex();
                    return sel >= 0 ? sel : -1;
                })();

                let nextIndex: number = 0;
                switch (direction) {
                case 'next':
                    nextIndex = startIndex < 0 ? 0 : (startIndex + 1) % count;
                    break;
                case 'prev':
                    nextIndex = startIndex < 0 ? count - 1 : (startIndex - 1 + count) % count;
                    break;
                case 'first':
                    nextIndex = 0;
                    break;
                case 'last':
                    nextIndex = count - 1;
                    break;
                }
                setFocusedItem(nextIndex);
                scrollItemIntoView(nextIndex);
            },
            [displayedTimes.length, focusedItem, getCurrentValueIndex, scrollItemIntoView]
        );

        const updateValue: (newValue: Date | null, event?: React.SyntheticEvent
        ) => void = useCallback((newValue: Date | null, event?: React.SyntheticEvent): void => {
            if (!isControlled) {
                setSelectedTime(newValue);
            }
            const isValidNow: boolean = valid !== undefined ? valid : (required ? newValue !== null : true);
            setIsInputValid(isValidNow);
            if (onChange) {
                onChange({ value: newValue, event });
            }
        }, [isControlled, onChange, required, valid]);

        const handleTimeSelection: (time: Date, event?: React.MouseEvent<HTMLLIElement>) => void =
            useCallback((time: Date, event?: React.MouseEvent<HTMLLIElement>): void => {
                if (!isControlled) {
                    setInputValue(formatTimeValue(time));
                }
                updateValue(time, event);
                hidePopup();
            }, [formatTimeValue, updateValue, hidePopup, isControlled]);

        const selectFocusedItem: () => void = useCallback(() => {
            if (!displayedTimes.length) {
                return;
            }
            const index: number =
                focusedItem != null && focusedItem >= 0 && focusedItem < displayedTimes.length
                    ? focusedItem
                    : getCurrentValueIndex();

            if (index == null || index < 0) {
                return;
            }
            const time: Date = displayedTimes[index as number];
            handleTimeSelection(time);
        }, [displayedTimes, focusedItem, getCurrentValueIndex, handleTimeSelection]);

        const handleClear: () => void = useCallback((): void => {
            setInputValue('');
            updateValue(null);
            hidePopup();
            inputRef.current?.focus();
        }, [isControlled, updateValue, hidePopup]);

        const handleInvalidTime: (e?: React.FocusEvent<HTMLInputElement>) => void =
            useCallback((e?: React.FocusEvent<HTMLInputElement>): void => {
                if (strictMode) {
                    if (currentValue) {
                        setInputValue(formatTimeValue(currentValue));
                        setIsInputValid(true);
                    } else {
                        setInputValue('');
                        setIsInputValid(!required);
                    }
                } else {
                    updateValue(null, e);
                    setIsInputValid(false);
                }
            }, [strictMode, currentValue, formatTimeValue, required, updateValue]);

        const handleOutOfRangeTime: (parsedTime: Date, e?: React.FocusEvent<HTMLInputElement>) => void =
            useCallback((parsedTime: Date, e?: React.FocusEvent<HTMLInputElement>): void => {
                if (strictMode) {
                    if (currentValue) {
                        setInputValue(formatTimeValue(currentValue));
                        setIsInputValid(true);
                    } else if (minTime || maxTime) {
                        const minTimeValue: number = minTime ? getTimeValue(minTime) : -1;
                        const maxTimeValue: number = maxTime ? getTimeValue(maxTime) : Number.MAX_SAFE_INTEGER;
                        const timeValue: number = getTimeValue(parsedTime);
                        if (minTime && maxTime && isSameCalendarDay(minTime, maxTime) && getTimeValue(minTime) > getTimeValue(maxTime)) {
                            setInputValue('');
                            updateValue(null, e);
                            setIsInputValid(!required);
                            return;
                        }
                        if (minTimeValue !== -1 && timeValue < minTimeValue) {
                            if (minTime) {
                                setInputValue(formatTimeValue(minTime));
                                updateValue(minTime, e);
                                setIsInputValid(true);
                            }
                        } else if (maxTimeValue !== Number.MAX_SAFE_INTEGER && timeValue > maxTimeValue) {
                            if (maxTime) {
                                setInputValue(formatTimeValue(maxTime));
                                updateValue(maxTime, e);
                                setIsInputValid(true);
                            }
                        }
                    } else {
                        setInputValue('');
                        updateValue(null, e);
                        setIsInputValid(!required);
                    }
                } else {
                    updateValue(null, e);
                    setIsInputValid(false);
                }
            }, [strictMode, currentValue, formatTimeValue, updateValue, minTime, maxTime, required]);


        const commitInput: (
            e?: React.SyntheticEvent
        ) => void = useCallback((
            e?: React.SyntheticEvent
        ): void => {
            if (inputValue.trim() === '') {
                if (strictMode && required) {
                    if (currentValue) {
                        setInputValue(formatTimeValue(currentValue));
                        setIsInputValid(true);
                    } else {
                        setIsInputValid(!required);
                    }
                } else {
                    updateValue(null, e);
                    setIsInputValid(!required);
                }
                return;
            }

            if (strictMode) {
                const parsedTime: Date | null = parseTimeValue(inputValue, false);
                if (parsedTime === null) {
                    handleInvalidTime(e as React.FocusEvent<HTMLInputElement>);
                    return;
                }
                const withinRange: boolean = isValidTime(parsedTime);
                if (withinRange) {
                    const formattedValue: string = formatTimeValue(parsedTime);
                    setInputValue(formattedValue);
                    updateValue(parsedTime, e);
                    setIsInputValid(true);
                } else {
                    handleOutOfRangeTime(parsedTime, e as React.FocusEvent<HTMLInputElement>);
                }
                return;
            }

            const parsedExact: Date | null = parseTimeValue(inputValue, true);
            if (parsedExact && isValidTime(parsedExact)) {
                updateValue(parsedExact, e);
                setIsInputValid(true);
            } else {
                setIsInputValid(false);
            }
        }, [
            inputValue,
            strictMode,
            required,
            currentValue,
            parseTimeValue,
            isValidTime,
            formatTimeValue,
            updateValue,
            handleInvalidTime,
            handleOutOfRangeTime
        ]);

        const handleInputBlur: (e?: React.FocusEvent<HTMLInputElement>) => void =
            useCallback((e?: React.FocusEvent<HTMLInputElement>): void => {
                setIsFocused(false);
                commitInput(e);
            }, [commitInput]);

        const handleKeyDown: (e: React.KeyboardEvent<HTMLElement>) => void = useCallback((e: React.KeyboardEvent<HTMLElement>) => {
            switch (e.key) {
            case 'ArrowDown': {
                if (e.altKey || e.metaKey) {
                    e.preventDefault();
                    showPopup();
                } else if (currentOpenState) {
                    e.preventDefault();
                    navigateTimeList('next');
                }
                break;
            }
            case 'ArrowUp': {
                if (e.altKey || e.metaKey) {
                    e.preventDefault();
                    hidePopup();
                } else if (currentOpenState) {
                    e.preventDefault();
                    navigateTimeList('prev');
                }
                break;
            }
            case 'Home': {
                if (currentOpenState) {
                    e.preventDefault();
                    navigateTimeList('first');
                }
                break;
            }
            case 'End': {
                if (currentOpenState) {
                    e.preventDefault();
                    navigateTimeList('last');
                }
                break;
            }
            case 'Enter': {
                e.preventDefault();
                if (currentOpenState) {
                    selectFocusedItem();
                } else {
                    commitInput(e);
                }
                break;
            }
            default:
                break;
            }
        }, [currentOpenState, hidePopup, showPopup, navigateTimeList, selectFocusedItem, commitInput]);

        const isPartialTimeValid: (input: string) => boolean =
            useCallback((input: string): boolean => {
                if (!input.trim()) {
                    return !required;
                }
                if (/^\d{1,2}$/.test(input)) {
                    const hour: number = parseInt(input, 10);
                    return hour >= 0 && hour <= 23;
                }
                if (/^\d{1,2}:$/.test(input)) {
                    const hour: number = parseInt(input.split(':')[0], 10);
                    return hour >= 0 && hour <= 23;
                }
                if (/^\d{1,2}:\d{1,2}$/.test(input)) {
                    const [hourStr, minuteStr]: string[] = input.split(':');
                    const hour: number = parseInt(hourStr, 10);
                    const minute: number = parseInt(minuteStr, 10);
                    return hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59;
                }
                const parsedTime: Date | null = parseTimeValue(input);
                return parsedTime !== null && isValidTime(parsedTime);
            }, [parseTimeValue, isValidTime, required]);

        const handleInputChange: (event: React.ChangeEvent<HTMLInputElement>
        ) => void = useCallback((event: React.ChangeEvent<HTMLInputElement>): void => {
            const newInputValue: string = event.target.value;
            setInputValue(newInputValue);
            if (valid === undefined) {
                setIsInputValid(isPartialTimeValid(newInputValue));
            }
        }, [valid, isPartialTimeValid]);

        useEffect(() => {
            preRender('timepicker');
        }, []);

        useEffect(() => {
            if (!inputRef.current) {
                return;
            }
            const isValidNow: boolean = valid !== undefined ? valid : (required ? currentValue !== null : true);
            setIsInputValid(isValidNow);
            const message: string = isValidNow ? '' : validMessage || '';
            inputRef.current.setCustomValidity(message);
        }, [valid, validMessage, required, currentValue]);

        const publicAPI: Partial<ITimePicker> = {
            placeholder,
            format,
            labelMode,
            disabled,
            readOnly,
            editable,
            openOnFocus,
            open,
            clearButton,
            zIndex,
            strictMode,
            value: currentValue,
            minTime,
            maxTime,
            step,
            required,
            valid,
            validMessage,
            validityStyles
        };

        useImperativeHandle(ref, () => ({
            ...publicAPI as ITimePicker,
            element: containerRef.current
        }), [publicAPI]);

        useEffect(() => {
            if (currentOpenState && !initialScrollDone.current) {
                initialScrollDone.current = true;
                const sel: number = getCurrentValueIndex();
                const idx: number | null = sel >= 0 ? sel : (displayedTimes.length ? 0 : null);
                scrollItemIntoView(idx);
                if (idx != null) {
                    setFocusedItem(idx);
                }
            }
            if (!currentOpenState) {
                initialScrollDone.current = false;
                setFocusedItem(null);
            }
        }, [currentOpenState, getCurrentValueIndex, displayedTimes.length, scrollItemIntoView]);

        const ensureSelectedVisible: () => void = useCallback(() => {
            const sel: number = getCurrentValueIndex();
            const idx: number | null = sel >= 0 ? sel : (displayedTimes.length ? 0 : null);
            if (idx == null || idx < 0) {
                return;
            }
            const itemEl: HTMLLIElement | null = itemRefs.current[idx as number];
            const listEl: HTMLUListElement | null = listRef.current;
            if (!itemEl || !listEl) {
                return;
            }
            const itemTop: number = itemEl.offsetTop;
            const itemHeight: number = itemEl.offsetHeight || 32;
            const targetScrollTop: number = Math.max(0, itemTop - Math.max(0, (listEl.clientHeight - itemHeight) / 2));
            listEl.scrollTop = targetScrollTop;
            setFocusedItem(idx);
        }, [getCurrentValueIndex, displayedTimes.length]);

        const onItemClick: (time: Date, e: React.MouseEvent<HTMLLIElement>) => void = useCallback(
            (time: Date, e: React.MouseEvent<HTMLLIElement>) => {
                handleTimeSelection(time, e);
            },
            [isValidTime, handleTimeSelection]
        );

        const onItemFocus: React.FocusEventHandler<HTMLLIElement> = useCallback((e: React.FocusEvent<HTMLLIElement, Element>) => {
            const idx: number = Number(e.currentTarget.dataset.index);
            if (!Number.isNaN(idx)) {
                setFocusedItem(idx);
            }
        }, []);

        const onItemBlur: () => void = useCallback(() => {
            setFocusedItem(null);
        }, []);

        useEffect(() => {
            if (!currentOpenState) {
                return;
            }
            ensureSelectedVisible();
        }, [currentOpenState, ensureSelectedVisible, displayedTimes.length]);

        const activeDescendantId: string | undefined = useMemo(() => {
            const inRange: boolean =
                focusedItem != null &&
                focusedItem >= 0 &&
                focusedItem < displayedTimes.length;
            return currentOpenState && inRange ? `${id}_option_${focusedItem}` : undefined;
        }, [currentOpenState, focusedItem, displayedTimes.length, id]);

        const renderTimeItems: () => React.ReactNode = useCallback((): React.ReactNode => {
            const noItems: boolean = displayedTimes.length === 0;

            return (
                <ul
                    ref={listRef as React.Ref<HTMLUListElement>}
                    className = {`sf-timepicker-list sf-timepicker-list-${size.toLowerCase().substring(0, 2)} sf-ul`}
                    role='listbox'
                    aria-hidden={!currentOpenState}
                    id={`${id}_options`}
                    tabIndex={0}
                    onMouseDown={(e: React.MouseEvent<HTMLUListElement, MouseEvent>) => e.preventDefault()}
                    onKeyDown={handleKeyDown}
                >
                    {noItems ? (
                        <li
                            className="sf-timepicker-item sf-timepicker-empty"
                            role="note"
                            tabIndex={-1}
                        >
                            No available times
                        </li>
                    ) : (
                        displayedTimes.map((time: Date, index: number) => {
                            const timeString: string = formatTimeValue(time);
                            const isSelected: boolean = !!(currentValue &&
                                time.getHours() === currentValue.getHours() &&
                                time.getMinutes() === currentValue.getMinutes());
                            const isFocus: boolean = focusedItem === index;
                            const content: React.ReactNode = itemTemplate ? itemTemplate(time) : timeString;

                            return (
                                <li
                                    key={index}
                                    ref={(el: HTMLLIElement | null) => { itemRefs.current[index as number] = el; }}
                                    className={[
                                        'sf-timepicker-item',
                                        isSelected ? 'sf-active' : '',
                                        isFocus ? 'sf-focus' : ''
                                    ].filter(Boolean).join(' ')}
                                    role='option'
                                    data-value={timeString}
                                    id={`${id}_option_${index}`}
                                    aria-selected={isSelected}
                                    onClick={(e: React.MouseEvent<HTMLLIElement, MouseEvent>) => onItemClick(time, e)}
                                    onFocus={onItemFocus}
                                    onBlur={onItemBlur}
                                    tabIndex={0}
                                >
                                    {content}
                                </li>
                            );
                        })
                    )}
                </ul>
            );
        }, [
            displayedTimes,
            currentValue,
            formatTimeValue,
            handleKeyDown,
            onItemClick,
            currentOpenState,
            focusedItem,
            fullScreenMode,
            itemTemplate
        ]);

        const handleIconClick: () => void = useCallback((): void => {
            togglePopup();
            setIsIconActive(true);
            inputRef.current?.focus();
        }, [togglePopup]);

        const handleClearMouseDown: (e: React.MouseEvent<HTMLSpanElement>) => void = useCallback(
            (e: React.MouseEvent<HTMLSpanElement>): void => {
                e.preventDefault();
                handleClear();
            },
            [handleClear]
        );

        const classNames: string = [
            'sf-input-group sf-control', 'sf-timepicker',
            disabled ? 'sf-disabled' : '',
            readOnly ? 'sf-readonly' : '',
            currentOpenState || isFocused ? 'sf-input-focus' : '',
            labelMode !== 'Never' ? 'sf-float-input' : '',
            dir === 'rtl' ? 'sf-rtl' : '',
            size === Size.Small ? 'sf-small' : size === Size.Large ? 'sf-large' : 'sf-medium',
            !isInputValid && validityStyles ? 'sf-error' : '',
            variant && variant.toLowerCase() !== 'standard' ? variant.toLowerCase() === 'outlined' ? 'sf-outline' : `sf-${variant.toLowerCase()}`
                : '',
            className
        ].filter(Boolean).join(' ');

        const { zIndexPopup }: { zIndexPopup: number } = React.useMemo<{ zIndexPopup: number }>(() => {
            let baseValue: number = typeof zIndex === 'number' ? zIndex : 1000;
            if (baseValue === 1000 && containerRef.current) {
                baseValue = getZindexPartial(containerRef.current);
            }
            return { zIndexPopup: Math.max(3, baseValue + 1) };
        }, [zIndex, containerRef.current]);

        return (
            <span
                ref={containerRef}
                className={classNames}
                {...otherProps}
            >
                <InputBase
                    ref={inputRef}
                    id={id}
                    className={'sf-timepicker'}
                    placeholder={labelMode === 'Never' ? getPlaceholder : ''}
                    disabled={disabled}
                    readOnly={readOnly || !editable}
                    onFocus={() => {
                        setIsFocused(true);
                        if (openOnFocus && !disabled && !readOnly) {
                            showPopup();
                        }
                    }}
                    onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                        handleInputBlur(e);
                        hidePopup();
                    }}
                    value={inputValue}
                    onChange={editable && !readOnly && !disabled ? handleInputChange : undefined}
                    role='combobox'
                    aria-haspopup='listbox'
                    aria-autocomplete='list'
                    aria-expanded={currentOpenState}
                    aria-disabled={disabled}
                    aria-controls={currentOpenState ? `${id}_options` : undefined}
                    aria-label={getPlaceholder || 'Time picker input'}
                    aria-activedescendant={activeDescendantId}
                    onKeyDown={handleKeyDown}
                    tabIndex={0}
                    required={required}
                />

                {labelMode !== 'Never' && renderFloatLabelElement(
                    labelMode,
                    false,
                    inputValue,
                    placeholder,
                    id
                )}

                {clearButton && inputValue && (isFocused || currentOpenState) && (
                    <span
                        className='sf-clear-icon sf-input-icon'
                        aria-label='clear time value'
                        role='button'
                        onMouseDown={handleClearMouseDown}
                    >
                        <CloseIcon />
                    </span>
                )}

                <span
                    className={`sf-input-icon sf-time-icon sf-icons ${isIconActive ? 'sf-active' : ''}`}
                    aria-label='select time'
                    role='button'
                    onClick={handleIconClick}
                    onMouseDown={(e: React.MouseEvent<HTMLSpanElement, MouseEvent>): void => {
                        e.preventDefault();
                    }}
                >
                    <ClockIcon />
                </span>

                {currentOpenState &&
                    createPortal(
                        fullScreenMode && Browser.isDevice ? (
                            <div ref={mobRef} className='sf-timepicker-mob sf-control' style={{ zIndex }} role="dialog" aria-modal="true" aria-label="Time selection">
                                <div className='sf-timepicker-header'>
                                    <Button
                                        variant={Variant.Standard}
                                        onClick={hidePopup}
                                    >
                                        <CloseIcon />
                                    </Button>
                                    <span className="sf-timepicker-title">Select Time</span>
                                </div>
                                {renderTimeItems()}
                            </div>
                        ) : (
                            <>
                                {useDialog && (
                                    <div className="sf-timepicker-popup-wrap" style={{ zIndex: zIndexPopup.toString() }}>
                                        <div className="sf-overlay"></div>
                                        <Popup
                                            ref={popupRef}
                                            className="sf-timepicker sf-popup sf-content-center"
                                            open={currentOpenState}
                                            zIndex={zIndexPopup}
                                            onClose={() => {
                                                hidePopup();
                                            }}
                                            onOpen={() => {
                                                if (onOpen && popupRef.current) {
                                                    onOpen();
                                                }
                                                ensureSelectedVisible();
                                            }}
                                            relateTo={document.body}
                                            style={{ top: '0', left: '0' }}
                                            position={{ X: 'center', Y: 'center' }}
                                            collision={{ X: CollisionType.Fit, Y: CollisionType.Fit }}
                                            aria-modal="true"
                                            role="dialog"
                                            aria-label="Time selection"
                                        >
                                            {renderTimeItems()}
                                        </Popup>
                                    </div>
                                )}
                                {useInline && (
                                    <Popup
                                        ref={popupRef}
                                        className="sf-timepicker sf-popup"
                                        open={currentOpenState}
                                        zIndex={zIndexPopup}
                                        onClose={() => {
                                            hidePopup();
                                        }}
                                        onOpen={() => {
                                            if (onOpen && popupRef.current) {
                                                onOpen();
                                            }
                                            ensureSelectedVisible();
                                        }}
                                        relateTo={containerRef.current as HTMLElement}
                                        position={{ X: 'left', Y: 'bottom' }}
                                        collision={{ X: CollisionType.Flip, Y: CollisionType.Flip }}
                                        offsetY={4}
                                        aria-modal="true"
                                        role="dialog"
                                        aria-label="Time selection"
                                    >
                                        {renderTimeItems()}
                                    </Popup>
                                )}
                            </>
                        ),
                        document.body
                    )}

            </span>
        );
    });

TimePicker.displayName = 'TimePicker';
export default TimePicker;
