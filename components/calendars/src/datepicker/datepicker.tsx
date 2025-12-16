import { useState, useRef, useEffect, useCallback, forwardRef, useImperativeHandle, useMemo, useId } from 'react';
import { createPortal } from 'react-dom';
import { InputBase, renderFloatLabelElement } from '@syncfusion/react-inputs';
import { Browser, useProviderContext, formatDate, parseDate, preRender, LabelMode, Orientation, IL10n, L10n } from '@syncfusion/react-base';
import { Popup, CollisionType, getZindexPartial, type IPopup } from '@syncfusion/react-popups';
import { CloseIcon, TimelineTodayIcon } from '@syncfusion/react-icons';
import { Calendar } from '../calendar';
import { CalendarView, ViewChangeEvent, ICalendar, CalendarProps, CalendarChangeEvent } from '../calendar';
import { CalendarCellProps } from '../calendar/calendar-cell';
import { GregorianCalendar } from '../calendar-core';
import { inRange } from '../calendar/utils';
import { DatePickerProps, PickerVariant, Variant } from './types';
export { LabelMode };

type IDatePickerProps = IDatePicker & Omit<React.HTMLAttributes<HTMLDivElement>, 'defaultValue' | 'value' | 'onChange'>;

export interface IDatePicker extends DatePickerProps {
    /**
     * The content to be rendered inside the component.
     *
     * @private
     * @default -
     */
    element?: HTMLSpanElement | null;
}

/**
 * The DatePicker component provides an input with an integrated calendar popup for selecting a single date.
 * It supports formatting, parsing, min/max date constraints, validation, strict mode,
 * custom calendar templates, and inline or dialog picker variants.
 *
 * ```typescript
 * import { DatePicker } from '@syncfusion/react-calendars';
 *
 * export default function App() {
 *   return <DatePicker placeholder="Choose a date" />;
 * }
 * ```
 */
export const DatePicker: React.ForwardRefExoticComponent<IDatePickerProps & React.RefAttributes<IDatePicker>> =
    forwardRef<IDatePicker, IDatePickerProps>((props: IDatePickerProps, ref: React.Ref<IDatePicker>) => {
        const {
            className = '',
            placeholder = 'Choose a date',
            id = `datepicker_${useId()}`,
            disabled = false,
            readOnly = false,
            labelMode = 'Never',
            format = 'M/d/yyyy',
            clearButton = true,
            strictMode = false,
            orientation = Orientation.Vertical,
            value,
            defaultValue,
            minDate = new Date(1900, 0, 1),
            maxDate = new Date(2099, 11, 31),
            start = CalendarView.Month,
            depth = CalendarView.Month,
            firstDayOfWeek = 0,
            weekNumber = false,
            weekRule,
            showTodayButton = true,
            showToolBar = false,
            weekDaysFormat,
            open,
            inputFormats,
            pickerVariant = PickerVariant.Auto,
            showDaysOutsideCurrentMonth,
            disablePastDays,
            disableFutureDays,
            variant = Variant.Standard,
            zIndex = 1000,
            cellTemplate,
            footerTemplate,
            headerTemplate,
            onChange,
            onOpen,
            onClose,
            openOnFocus = false,
            editable = true,
            required = false,
            valid,
            validationMessage = '',
            validityStyles = true,
            ...otherProps
        } = props;

        const { locale, dir } = useProviderContext();
        const calendarSystem: GregorianCalendar = useMemo<GregorianCalendar>(() => new GregorianCalendar(), []);
        const [isOpen, setIsOpen] = useState<boolean>(false);
        const [inputValue, setInputValue] = useState<string>('');
        const [selectedDate, setSelectedDate] = useState<Date | null>(value ?? defaultValue ?? null);
        const [isFocused, setIsFocused] = useState<boolean>(false);
        const containerRef: React.RefObject<HTMLSpanElement | null> = useRef<HTMLSpanElement>(null);
        const inputRef: React.RefObject<HTMLInputElement | null> = useRef<HTMLInputElement>(null);
        const popupRef: React.RefObject<IPopup | null> = useRef<IPopup>(null);
        const calendarRef: React.RefObject<ICalendar | null> = useRef<ICalendar>(null);
        const iconRef: React.RefObject<HTMLSpanElement | null> = useRef<HTMLSpanElement>(null);
        const isControlled: boolean = value !== undefined;
        const currentValue: Date | null | undefined = isControlled ? value : selectedDate;
        const isOpenControlled: boolean = open !== undefined;
        const currentOpenState: boolean | undefined = isOpenControlled ? open : isOpen;
        const [isInputValid, setIsInputValid] = useState<boolean>(valid !== undefined ? valid : (required ? selectedDate !== null : true));
        const [isIconActive, setIsIconActive] = useState<boolean>(false);
        const [shouldFocusOnClose, setShouldFocusOnClose] = useState<boolean>(false);
        const isDevice: boolean = Browser.isDevice;
        const useDialog: boolean =
            pickerVariant === PickerVariant.Popup ||
            (pickerVariant === PickerVariant.Auto && isDevice);
        const useInline: boolean =
            pickerVariant === PickerVariant.Inline ||
            (pickerVariant === PickerVariant.Auto && !isDevice);

        const inputFormatsString: string[] = useMemo(() => {
            if (!inputFormats || inputFormats.length === 0) {
                return [];
            }
            return inputFormats
                .map((f: string): string => {
                    if (typeof f === 'string') {
                        return f;
                    }
                    return '';
                })
                .filter(Boolean);
        }, [inputFormats, locale]);

        useEffect((): void => {
            if (!inputRef.current) {
                return;
            }
            const isValidNow: boolean = valid !== undefined ? valid : (required ? currentValue !== null : true);
            setIsInputValid(isValidNow);
            const message: string = isValidNow ? '' : (validationMessage || '');
            inputRef.current.setCustomValidity(message);
        }, [valid, validationMessage, required, currentValue]);

        const formatDateValue: (date: Date) => string = useCallback((date: Date): string => {
            try {
                return formatDate(date, { locale: locale || 'en-US', format: format || 'M/d/yyyy', type: 'date' });
            } catch {
                return date.toLocaleDateString(locale || 'en-US');
            }
        }, [locale, format]);

        const getPlaceholder: string = useMemo(() => {
            const l10n: IL10n = L10n('datepicker', { placeholder: placeholder }, locale);
            l10n.setLocale(locale);
            const localized: string = l10n.getConstant('placeholder') as string;
            return localized || (placeholder || '');
        }, [locale, placeholder]);

        useEffect((): void => {
            if (currentValue) {
                const formatted: string = formatDateValue(currentValue);
                if (inputValue !== formatted) {
                    setInputValue(formatted);
                }
            } else if (inputValue !== '') {
                setInputValue('');
            }
        }, [currentValue, format, locale]);

        const showPopup: () => void = useCallback((): void => {
            if (disabled || readOnly) {
                return;
            }
            if (!currentOpenState && !isOpenControlled) {
                setIsOpen(true);
            }
        }, [disabled, readOnly, currentOpenState, isOpenControlled]);

        const hidePopup: () => void = useCallback((): void => {
            if (!currentOpenState) {
                return;
            }
            if (!isOpenControlled) {
                setIsOpen(false);
            }
            if (onClose && popupRef.current) {
                onClose();
            }
        }, [currentOpenState, isOpenControlled, onClose]);

        const togglePopup: () => void = useCallback((): void => {
            if (currentOpenState) {
                hidePopup();
                setIsIconActive(false);
            } else {
                showPopup();
            }
        }, [currentOpenState, hidePopup, showPopup]);

        const handlePopupInteraction: (e: Event) => void = useCallback((e: Event): void => {
            const targetEl: HTMLElement = e.target as HTMLElement;

            if (e.type === 'mousedown') {
                const containerEl: HTMLSpanElement | null = containerRef.current;
                const popupEl: HTMLElement | undefined = popupRef.current?.element as HTMLElement | undefined;
                const calendarEl: HTMLElement |undefined = calendarRef.current?.element as HTMLElement | undefined;
                const insideContainer: boolean = !!(containerEl && containerEl.contains(targetEl));
                const insidePopup: boolean = !!(popupEl && popupEl.contains(targetEl));
                const insideCalendar: boolean = !!(calendarEl && calendarEl.contains(targetEl));
                const shouldClose: boolean = useDialog
                    ? (!insideContainer && !insideCalendar)
                    : (!insideContainer && !insidePopup);

                if (shouldClose) {
                    hidePopup();
                    setIsIconActive(false);
                }
            }
        }, [hidePopup, useDialog]);

        useEffect((): (() => void) | void => {
            if (!currentOpenState) {
                if (shouldFocusOnClose) {
                    inputRef.current?.focus();
                    setShouldFocusOnClose(false);
                }
                return;
            }
            const handleKeyDown: (e: KeyboardEvent) => void = (e: KeyboardEvent): void => {
                if ((e.altKey || e.metaKey) && e.key === 'ArrowUp' || e.key === 'Escape' || e.key === 'Esc') {
                    e.preventDefault();
                    e.stopPropagation();
                    hidePopup();
                    setIsIconActive(false);
                    inputRef.current?.focus();
                }
            };
            document.addEventListener('mousedown', handlePopupInteraction);
            document.addEventListener('keydown', handleKeyDown, true);
            return (): void => {
                document.removeEventListener('mousedown', handlePopupInteraction);
                document.removeEventListener('keydown', handleKeyDown, true);
            };
        }, [currentOpenState, handlePopupInteraction, hidePopup, shouldFocusOnClose]);

        const getFocusableElements: () => HTMLElement[] = useCallback(() => {
            let currentElements: HTMLElement[] = [];
            if (popupRef.current) {
                const selector: string = ['a[href]:not([tabindex="-1"])', 'button:not([disabled]):not([tabindex="-1"])', 'input:not([disabled]):not([tabindex="-1"])', 'select:not([disabled]):not([tabindex="-1"])', 'textarea:not([disabled]):not([tabindex="-1"])', 'details:not([tabindex="-1"])', '[contenteditable]:not([tabindex="-1"])', '[tabindex]:not([tabindex="-1"])'
                ].join(',');
                const elements: NodeListOf<HTMLElement> = (popupRef.current?.element as Element).querySelectorAll<HTMLElement>(selector);
                currentElements = Array.from(elements).filter((el: HTMLElement) => !el.hasAttribute('disabled')) as HTMLElement[];
            }
            return currentElements;
        }, [open]);

        const handleKeyDown: (e: React.KeyboardEvent<HTMLElement>) => void = useCallback(
            (e: React.KeyboardEvent<HTMLElement>) => {
                let focusableElements: HTMLElement[];
                let currentElement: HTMLElement | null;
                let currentIndex: number;
                let nextIndex: number;
                switch (e.key) {
                case 'ArrowDown':
                    if (e.altKey || e.metaKey) {
                        e.preventDefault();
                        showPopup();
                    }
                    break;
                case 'ArrowUp':
                    if (e.altKey || e.metaKey) {
                        e.preventDefault();
                        hidePopup();
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
            },
            [showPopup, hidePopup, getFocusableElements]
        );

        const normalizeTwoDigitYear: (raw: string) => string = (raw: string): string => {
            const twoDigitYearPattern: RegExp = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2})$/;
            const m: RegExpExecArray | null = twoDigitYearPattern.exec(raw.trim());
            if (!m) {
                return raw;
            }
            const [, p1, p2, yy] = m;
            const fullYear: number = 2000 + parseInt(yy, 10);
            return `${p1}/${p2}/${fullYear}`;
        };

        const parseInputValue: (inputVal: string) => Date | null = useCallback((inputVal: string): Date | null => {
            if (!inputVal || !inputVal.trim()) {
                return null;
            }
            const normalizedAMPM: string = inputVal.replace(/(am|pm)/gi, (s: string): string => s.toUpperCase());
            const normalized: string = normalizeTwoDigitYear(normalizedAMPM);
            if (inputFormatsString.length) {
                for (const fmt of inputFormatsString) {
                    try {
                        const d: Date = parseDate(normalized, { locale: locale || 'en-US', format: fmt, type: 'date' });
                        if (d && !isNaN(d.getTime())) {
                            return d;
                        }
                    } catch {
                        continue;
                    }
                }
            } else {
                const d: Date = parseDate(normalized, { locale: locale || 'en-US', format, type: 'date' });
                if (d && !isNaN(d.getTime())) {
                    return d;
                }
            }
            return null;
        }, [format, inputFormatsString, locale]);

        const isDateDisabledByCellTemplate: (date: Date) => boolean = useCallback((date: Date): boolean => {
            if (typeof cellTemplate !== 'function') {
                return false;
            }
            try {
                const today: Date = new Date();
                const referenceDate: Date = currentValue && !Array.isArray(currentValue) ? currentValue : today;
                const isWeekend: boolean = date.getDay() === 0 || date.getDay() === 6;
                const isOtherMonth: boolean = calendarSystem.getMonth(date) !== calendarSystem.getMonth(referenceDate);
                const isToday: boolean = calendarSystem.isSameDate(date, today);
                const isSelected: boolean = !!(currentValue &&
                    !Array.isArray(currentValue) && calendarSystem.isSameDate(date, currentValue));

                const cellProps: CalendarCellProps = {
                    date,
                    isWeekend,
                    isDisabled: (minDate > date) || (maxDate < date),
                    isOutOfRange: isOtherMonth,
                    isToday,
                    isSelected: isSelected || false,
                    isFocused: false,
                    className: '',
                    id: `${date.valueOf()}`
                };
                const result: unknown = (cellTemplate as Function)(cellProps);
                if (result && typeof result === 'object' && 'props' in (result as Record<string, unknown>)) {
                    return Boolean((result as { props?: { isDisabled?: boolean } }).props?.isDisabled);
                }
                return false;
            } catch {
                return false;
            }
        }, [calendarSystem, cellTemplate, currentValue, maxDate, minDate]);

        const isValidDate: (date: Date | null) => boolean = useCallback((date: Date | null): boolean => {
            if (!date || isNaN(date.getTime())) {
                return false;
            }
            if (!inRange(date, minDate, maxDate)) {
                return false;
            }
            if (isDateDisabledByCellTemplate(date)) {
                return false;
            }
            return true;
        }, [minDate, maxDate, isDateDisabledByCellTemplate]);

        const commitValue: (
            newDate: Date | null,
            event?: React.SyntheticEvent
        ) => void = useCallback((
            newDate: Date | null,
            event?: React.SyntheticEvent
        ): void => {
            if (!isControlled) {
                setSelectedDate(newDate);
                setInputValue(newDate ? formatDateValue(newDate) : '');
            }
            const nextValid: boolean = valid !== undefined ? valid : (required ? newDate !== null : true);
            setIsInputValid(nextValid);
            if (onChange) {
                onChange({ value: newDate, event });
            }
        }, [formatDateValue, isControlled, onChange, required, valid]);

        const handleClear: () => void = useCallback((): void => {
            setInputValue('');
            commitValue(null);
            hidePopup();
            if (inputRef.current) {
                inputRef.current.focus();
            }
        }, [commitValue, hidePopup, isControlled]);

        const handleCalendarChange: (event: CalendarChangeEvent) => void = useCallback((event: CalendarChangeEvent): void => {
            const d: Date | null = (event?.value as Date) || null;
            if (d && isValidDate(d)) {
                commitValue(d, event.event);
                setShouldFocusOnClose(true);
                hidePopup();
            }
        }, [commitValue, hidePopup, isValidDate]);

        const handleInputBlur: () => void = useCallback((): void => {
            setIsFocused(false);
            const raw: string = inputValue.trim();

            if (!raw) {
                commitValue(null);
                setIsInputValid(valid !== undefined ? valid : !required);
                return;
            }

            const parsed: Date | null = parseInputValue(raw);
            const ok: boolean = parsed !== null && isValidDate(parsed);

            if (ok) {
                commitValue(parsed);
            } else {
                if (strictMode) {
                    setInputValue(currentValue ? formatDateValue(currentValue) : '');
                    commitValue(currentValue ?? null);
                } else {
                    setIsInputValid(false);
                }
            }
        }, [commitValue, currentValue, formatDateValue, inputValue, isValidDate, parseInputValue, required, strictMode, valid]);

        const handleInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void = useCallback(
            (event: React.ChangeEvent<HTMLInputElement>): void => {
                const newInputValue: string = event.target.value;
                setInputValue(newInputValue);
                if (valid === undefined) {
                    if (newInputValue.trim() === '') {
                        setIsInputValid(!required);
                    } else if (!strictMode) {
                        const parsedDate: Date | null = parseInputValue(newInputValue);
                        setIsInputValid(parsedDate !== null && isValidDate(parsedDate));
                    }
                }
            },
            [valid, required, strictMode, parseInputValue, isValidDate]
        );

        const publicAPI: Partial<IDatePicker> = {
            placeholder,
            editable,
            inputFormats,
            openOnFocus,
            format,
            labelMode,
            disabled,
            open,
            clearButton,
            zIndex,
            strictMode,
            pickerVariant,
            value: currentValue || null,
            minDate,
            maxDate,
            firstDayOfWeek,
            start,
            depth,
            weekNumber,
            weekRule,
            showTodayButton,
            weekDaysFormat,
            required,
            valid,
            validationMessage,
            validityStyles,
            cellTemplate,
            footerTemplate,
            headerTemplate,
            showToolBar
        };

        const { zIndexPopup }: { zIndexPopup: number } = useMemo<{ zIndexPopup: number }>(() => {
            let baseValue: number = typeof zIndex === 'number' ? zIndex : 1000;
            if (baseValue === 1000 && containerRef.current) {
                baseValue = getZindexPartial(containerRef.current);
            }
            return { zIndexPopup: Math.max(3, baseValue + 1) };
        }, [zIndex, currentOpenState]);

        useImperativeHandle(ref, (): IDatePicker => ({
            ...(publicAPI as IDatePicker),
            element: containerRef.current
        }), [publicAPI]);

        useEffect((): void => {
            preRender('datepicker');
        }, []);

        const handleViewChange: (args: ViewChangeEvent) => void = useCallback(
            (args: ViewChangeEvent): void => {
                props.onViewChange?.({
                    view: args.view,
                    date: args.date,
                    event: args.event
                });
            },
            [props.onViewChange]
        );

        const calendarProps: CalendarProps = useMemo(() => ({
            value: currentValue && !Array.isArray(currentValue) ? currentValue : null,
            minDate,
            maxDate,
            start,
            depth,
            firstDayOfWeek,
            weekNumber,
            weekRule,
            showToolBar,
            showTodayButton,
            orientation,
            showDaysOutsideCurrentMonth,
            disablePastDays,
            disableFutureDays,
            weekDaysFormat,
            cellTemplate,
            headerTemplate,
            footerTemplate,
            onChange: handleCalendarChange,
            onViewChange: handleViewChange
        }), [
            currentValue, minDate, maxDate, start, depth, firstDayOfWeek, weekNumber, weekRule,
            showToolBar, showTodayButton, orientation, weekDaysFormat, cellTemplate,
            headerTemplate, footerTemplate, handleCalendarChange, handleViewChange, showDaysOutsideCurrentMonth,
            disablePastDays, disableFutureDays
        ]);

        const handleIconClick: () => void = useCallback((): void => {
            togglePopup();
            setIsIconActive(true);
        }, [togglePopup]);

        const openPopup: () => void = useCallback((): void => {
            calendarRef.current?.focusGrid?.();
            if (onOpen) {
                onOpen();
            }
        }, [onOpen]);

        const handleInputFocus : () => void = useCallback((): void => {
            setIsFocused(true);
            if (openOnFocus && !disabled && !readOnly) {
                showPopup();
            }
        }, [openOnFocus, disabled, readOnly, showPopup]);

        const handleClearMouseDown: (e: React.MouseEvent<HTMLSpanElement>) => void = useCallback(
            (e: React.MouseEvent<HTMLSpanElement>): void => {
                e.preventDefault();
                handleClear();
            },
            [handleClear]
        );

        const classNames: string = [
            'sf-input-group sf-control', 'sf-medium', 'sf-datepicker', className,
            disabled ? 'sf-disabled' : '', readOnly ? 'sf-readonly' : '',
            currentOpenState ? 'sf-input-focus' : '',
            isFocused ? 'sf-input-focus' : '',
            labelMode !== 'Never' ? 'sf-float-input' : '',
            dir === 'rtl' ? 'sf-rtl' : '',
            !isInputValid && validityStyles ? 'sf-error' : '',
            variant && variant.toLowerCase() !== 'standard' ? variant.toLowerCase() === 'outlined' ? 'sf-outline' : `sf-${variant.toLowerCase()}`
                : ''
        ].filter(Boolean).join(' ');

        return (
            <span
                ref={containerRef}
                className={classNames}
                {...otherProps}
            >
                <InputBase
                    ref={inputRef}
                    id={id}
                    placeholder={labelMode === 'Never' ? getPlaceholder : ''}
                    disabled={disabled}
                    readOnly={readOnly || !editable}
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur}
                    value={inputValue}
                    onChange={editable && !readOnly && !disabled ? handleInputChange : undefined}
                    role="combobox"
                    aria-haspopup="dialog"
                    aria-autocomplete='none'
                    aria-expanded={!!currentOpenState}
                    aria-controls={currentOpenState ? `${id}_options` : undefined}
                    aria-disabled={disabled}
                    aria-label={getPlaceholder ||  'Date picker input'}
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

                {clearButton && !!inputValue && (isFocused || !!currentOpenState) && !readOnly && (
                    <span
                        className="sf-clear-icon sf-input-icon"
                        aria-label="clear date value"
                        role="button"
                        onMouseDown={handleClearMouseDown}
                    >
                        <CloseIcon />
                    </span>
                )}

                <span
                    ref={iconRef}
                    className={`sf-input-icon sf-icons ${isIconActive ? 'sf-active' : ''}`}
                    aria-label="select date"
                    role="button"
                    onClick={handleIconClick}
                    onMouseDown={(e: React.MouseEvent<HTMLSpanElement, MouseEvent>): void => {
                        e.preventDefault();
                    }}
                >
                    <TimelineTodayIcon viewBox='0 0 24 26'/>
                </span>

                {currentOpenState && createPortal(
                    <>
                        {useDialog && (
                            <div id={`${id}_options`} className="sf-datepick-popup-wrap" style={{ zIndex: zIndexPopup.toString() }}>
                                <div className={'sf-overlay'}></div>
                                <Popup
                                    ref={popupRef}
                                    className={'sf-datepicker sf-popup sf-content-center'}
                                    open={!!currentOpenState}
                                    style={{ top: '0', left: '0' }}
                                    zIndex={zIndexPopup}
                                    onClose={hidePopup}
                                    onOpen={openPopup}
                                    relateTo={document.body}
                                    position={{ X: 'center', Y: 'center' }}
                                    onKeyDown={handleKeyDown}
                                    collision={{ X: CollisionType.Fit, Y: CollisionType.Fit }}
                                >
                                    <Calendar ref={calendarRef} {...calendarProps} />
                                </Popup>
                            </div>
                        )}
                        {useInline && typeof document != 'undefined' && (
                            <Popup
                                ref={popupRef}
                                id={`${id}_options`}
                                className="sf-datepicker sf-popup"
                                open={!!currentOpenState}
                                zIndex={zIndexPopup}
                                onClose={hidePopup}
                                onOpen={openPopup}
                                relateTo={containerRef.current as HTMLElement}
                                position={{ X: 'left', Y: 'bottom' }}
                                offsetY={4}
                                onKeyDown={handleKeyDown}
                                collision={{ X: CollisionType.Flip, Y: CollisionType.Flip }}
                            >
                                <Calendar ref={calendarRef} {...calendarProps} />
                            </Popup>
                        )}
                    </>,
                    document.body
                )}
            </span>
        );
    });

DatePicker.displayName = 'DatePicker';
export default DatePicker;
