import * as React from 'react';
import {
    useState, useRef, useEffect, useCallback, forwardRef, useImperativeHandle,
    useMemo
} from 'react';
import { Calendar, CalendarView, WeekRule, WeekDaysFormats, ViewChangeEvent, ICalendar, ChangeEvent } from '../calendar/calendar';
import { CalendarCellProps } from '../calendar/calendar-cell';
import { InputBase, renderFloatLabelElement } from '@syncfusion/react-inputs';
import { Browser, formatDate, getDatePattern, parseDate, preRender, LabelMode } from '@syncfusion/react-base';
import { useProviderContext } from '@syncfusion/react-base';
import { CollisionType, getZindexPartial, IPopup, Popup } from '@syncfusion/react-popups';
import { CloseIcon, TimelineDayIcon } from '@syncfusion/react-icons';
import { createPortal } from 'react-dom';
export { LabelMode };

export interface DatePickerProps {
    /**
     * Specifies the placeholder text to display in the input box when no value is set.
     *
     * @default -
     */
    placeholder?: string;

    /**
     * Specifies whether the component is disabled or not.
     *
     * @default false
     */
    disabled?: boolean;

    /**
     * Specifies whether the component is in read-only mode.
     * When enabled, users cannot change input value or open the picker.
     *
     * @default false
     */
    readOnly?: boolean;

    /**
     * Specifies the float label behavior.
     * Possible values:
     * * `Never` - The label will never float.
     * * `Auto` - The label floats when the input has focus, value, or placeholder.
     * * `Always` - The label always floats.
     *
     * @default 'Never'
     */
    labelMode?: LabelMode;

    /**
     * Specifies the date format string for displaying and parsing date values.
     * Examples: 'MM/dd/yyyy', 'yyyy-MM-dd', etc.
     *
     * @default 'M/d/yyyy'
     */
    format?: string;

    /**
     * Specifies an array of acceptable date input formats for parsing user input.
     * Can be an array of strings or FormatObject.
     *
     * @default -
     */
    inputFormats?: string[] | FormatObject[];

    /**
     * Specifies whether to show the clear button within the input field.
     *
     * @default true
     */
    clearButton?: boolean;

    /**
     * Enables strict date validation mode.
     * When enabled, invalid values are prevented or auto-corrected.
     *
     * @default false
     */
    strictMode?: boolean;

    /**
     * When true, should open the calendar popup on input focus.
     *
     * @default false
     */
    openOnFocus?: boolean;

    /**
     * Specifies the selected date of the DatePicker for controlled usage.
     *
     * @default null
     *
     */
    value?: Date | null;

    /**
     * Specifies the default selected date of the DatePicker for uncontrolled mode.
     *
     * @default null
     *
     */
    defaultValue?: Date;

    /**
     * Specifies the minimum date that can be selected in the DatePicker.
     *
     * @default new Date(1900, 0, 1)
     */
    minDate?: Date;

    /**
     * Specifies the maximum date that can be selected in the DatePicker.
     *
     * @default new Date(2099, 11, 31)
     */
    maxDate?: Date;

    /**
     * Specifies the initial view of the Calendar when it is opened.
     *
     * @default Month
     */
    start?: CalendarView;

    /**
     * Sets the maximum level of view such as month, year, and decade.
     * Depth view should be smaller than the start view to restrict its view navigation.
     *
     * @default Month
     */
    depth?: CalendarView;

    /**
     * Specifies whether the calendar popup is open or closed.
     *
     * @default false
     */
    open?: boolean;

    /**
     * Specifies the first day of the week for the calendar.
     *
     * @default 0
     */
    firstDayOfWeek?: number;

    /**
     * Specifies whether the week number of the year is to be displayed in the calendar or not.
     *
     * @default false
     */
    weekNumber?: boolean;

    /**
     * Specifies the rule for defining the first week of the year.
     * Used only if `weekNumber` is enabled.
     *
     * @default FirstDay
     */
    weekRule?: WeekRule;

    /**
     * Specifies whether the today button is to be displayed or not.
     *
     * @default true
     */
    showTodayButton?: boolean;

    /**
     * Specifies the format of the day that to be displayed in header.
     * Possible formats are:
     * * `Short` - Sets the short format of day name (like Su) in day header.
     * * `Narrow` - Sets the single character of day name (like S) in day header.
     * * `Abbreviated` - Sets the min format of day name (like Sun) in day header.
     * * `Wide` - Sets the long format of day name (like Sunday) in day header.
     *
     * @default Short
     */
    weekDaysFormat?: WeekDaysFormats;

    /**
     * Provides a template for rendering custom content for each day cell in the calendar.
     *
     * @default null
     */
    cellTemplate?: Function | React.ReactNode;

    /**
     * Specifies whether the input field can be edited directly.
     * When false, only allows selection via calendar.
     *
     * @default true
     */
    editable?: boolean;

    /**
     * Sets the z-index value for the dropdown popup, controlling its stacking order relative to other elements on the page.
     *
     * @default 1000
     */
    zIndex?: number;

    /**
     * Specifies whether the component popup should display in full screen mode on mobile devices.
     *
     * @default false
     */
    fullScreenMode?: boolean;


    /**
     * Specifies whether the DatePicker is a required field in a form.
     * When set to true, the component will be marked as required.
     *
     * @default false
     */
    required?: boolean;

    /**
     * Overrides the validity state of the component.
     * If valid is set, the required property will be ignored.
     *
     * @default false
     */
    valid?: boolean;

    /**
     * Controls the form error message of the component.
     *
     * @default -
     */
    validationMessage?: string;

    /**
     * If set to false, no visual representation of the invalid state of the component will be applied.
     *
     * @default true
     */
    validityStyles?: boolean;

    /**
     * Triggers when the DatePicker value is changed.
     *
     * @event onChange
     */
    onChange?: ((args: ChangeEvent) => void);

    /**
     * Triggers when the calendar popup opens.
     *
     * @event onOpen
     */
    onOpen?: (args: { popup: IPopup }) => void;

    /**
     * Triggers when the calendar popup closes.
     *
     * @event onClose
     */
    onClose?: (args: { popup: IPopup }) => void;

    /**
     * Triggers when the Calendar is navigated to another level or within the same level of view.
     *
     * @event onViewChange
     */
    onViewChange?: (args: ViewChangeEvent) => void;
}

export interface FormatObject {
    /**
     * Specifies the format skeleton to use for formatting dates.
     *
     */
    skeleton?: string;
}

export interface IDatePicker extends DatePickerProps {
    /**
     * The content to be rendered inside the component.
     *
     * @private
     * @default null
     */
    element?: HTMLSpanElement | null;
}

type IDatePickerProps = IDatePicker & Omit<React.HTMLAttributes<HTMLDivElement>, 'defaultValue' | 'value'>;

export const DatePicker: React.ForwardRefExoticComponent<IDatePickerProps & React.RefAttributes<IDatePicker>> =
    forwardRef<IDatePicker, IDatePickerProps>((props: IDatePickerProps, ref: React.Ref<IDatePicker>) => {
        const {
            className = '',
            placeholder = 'Choose a date',
            disabled = false,
            readOnly = false,
            labelMode = 'Never',
            format = 'M/d/yyyy',
            clearButton = true,
            strictMode = false,
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
            weekDaysFormat,
            open,
            inputFormats,
            fullScreenMode = false,
            zIndex = 1000,
            cellTemplate,
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
        const [isOpen, setIsOpen] = useState(false);
        const [inputValue, setInputValue] = useState('');
        const [selectedDate, setSelectedDate] = useState<Date | null>(value ?? defaultValue ?? null);
        const [isFocused, setIsFocused] = useState(false);
        const containerRef: React.RefObject<HTMLSpanElement | null> = useRef<HTMLSpanElement>(null);
        const inputRef: React.RefObject<HTMLInputElement | null> = useRef<HTMLInputElement>(null);
        const popupRef: React.RefObject<IPopup | null> = useRef<IPopup>(null);
        const calendarRef: React.RefObject<ICalendar | null> = useRef<ICalendar>(null);
        const iconRef: React.RefObject<HTMLSpanElement | null> = useRef<HTMLSpanElement>(null);
        const isControlled: boolean = value !== undefined;
        const currentValue: Date | null | undefined = isControlled ? value : selectedDate;
        const isOpenControlled: boolean = open !== undefined;
        const currentOpenState: boolean | undefined = isOpenControlled ? open : isOpen;
        const [inputFormatsString, setInputFormatsString] = useState<string[]>([]);
        const [isInputValid, setIsInputValid] = useState<boolean>(valid !== undefined ? valid : (required ? selectedDate !== null : true));
        const [isIconActive, setIsIconActive] = useState<boolean>(false);
        const isFullScreenMode: boolean = fullScreenMode && Browser.isDevice;
        const [shouldFocusOnClose, setShouldFocusOnClose] = useState<boolean>(false);

        useEffect(() => {
            if (inputFormats && inputFormats.length > 0) {
                const formats: string[] = inputFormats.map((format: string | FormatObject) => {
                    if (typeof format === 'string') {
                        return format;
                    } else if (format.skeleton) {
                        return getDatePattern( {locale: locale || 'en-US', skeleton: format.skeleton, type: 'date' });
                    }
                    return '';
                }).filter(Boolean);
                setInputFormatsString(formats);
            } else {
                setInputFormatsString([]);
            }
        }, [inputFormats, locale]);

        useEffect(() => {
            if (!inputRef.current) { return; }
            const isValid: boolean = valid !== undefined ? valid : (required ? currentValue !== null : true);
            setIsInputValid(isValid);
            const message: string = isValid ? '' : validationMessage || '';
            inputRef.current.setCustomValidity(message);
        }, [valid, validationMessage, required, currentValue]);

        const formatDateValue: (date: Date) => string = useCallback((date: Date) => {
            try {
                return formatDate(date, {locale: locale || 'en-US', format: format || 'M/d/yyyy', type: 'date' });
            } catch {
                return date.toLocaleDateString(locale || 'en-US');
            }
        }, [locale, format]);

        useEffect(() => {
            if (currentValue) {
                const formattedValue: string = formatDateValue(currentValue);
                if (inputValue !== formattedValue) {
                    setInputValue(formattedValue);
                }
            } else {
                if (inputValue !== '') {
                    setInputValue('');
                }
            }
        }, [currentValue, format, locale]);

        const showPopup: () => void = useCallback(() => {
            if (disabled || readOnly) {
                return;
            }
            if (!currentOpenState) {
                if (!isOpenControlled) {
                    setIsOpen(true);
                }
            }
        }, [disabled, readOnly, currentOpenState, isOpenControlled]);

        const hidePopup: () => void = useCallback(() => {
            if (currentOpenState) {
                if (!isOpenControlled) {
                    setIsOpen(false);
                }
                if (onClose && popupRef.current) {
                    onClose({
                        popup: popupRef.current as IPopup
                    });
                }
            }
        }, [currentOpenState, isOpenControlled, onClose]);


        const togglePopup: () => void = useCallback(() => {
            if (currentOpenState) {
                hidePopup();
                setIsIconActive(false);
            } else {
                showPopup();
            }
        }, [currentOpenState, hidePopup, showPopup]);

        const handlePopupInteraction: (e: Event) => void = useCallback((e: Event) => {
            const target: HTMLElement = e.target as HTMLElement;
            if (isFullScreenMode && target.closest('.sf-popup-close')) {
                hidePopup();
                setIsIconActive(false);
                return;
            }
            if (!isFullScreenMode && e.type === 'mousedown') {
                const targetNode: Node = e.target as Node;
                if (!containerRef.current?.contains(targetNode) && !popupRef.current?.element?.contains(targetNode)) {
                    hidePopup();
                    setIsIconActive(false);
                }
            }
        }, [isFullScreenMode, hidePopup]);

        useEffect(() => {
            if (!currentOpenState) {
                if (shouldFocusOnClose) {
                    if (inputRef.current) {
                        inputRef.current.focus();
                    }
                    setShouldFocusOnClose(false);
                }
                return;
            }
            const handleGlobalKeyDown: (e: KeyboardEvent) => void = (e: KeyboardEvent) => {
                if (e.altKey && e.key === 'ArrowUp' && currentOpenState) {
                    e.preventDefault();
                    e.stopPropagation();
                    const inputElement: HTMLInputElement | null = inputRef.current;

                    hidePopup();
                    setIsIconActive(false);

                    if (inputElement) {
                        inputElement.focus();
                    }
                }
                if (e.key === 'Escape' && currentOpenState) {
                    e.preventDefault();
                    e.stopPropagation();
                    hidePopup();
                    setIsIconActive(false);
                    if (inputRef.current) {
                        inputRef.current.focus();
                    }
                }
            };
            document.addEventListener('mousedown', handlePopupInteraction);
            document.addEventListener('keydown', handleGlobalKeyDown, true);
            return () => {
                document.removeEventListener('mousedown', handlePopupInteraction);
                document.removeEventListener('keydown', handleGlobalKeyDown, true);
            };
        }, [currentOpenState, handlePopupInteraction, hidePopup]);

        const handleKeyDown: (e: React.KeyboardEvent<HTMLElement>) => void = (e: React.KeyboardEvent<HTMLElement>) => {
            if (e.key === 'ArrowDown' && e.altKey) {
                showPopup();
            } else if (e.key === 'Tab' && currentOpenState) {
                if (isIconActive || e.target === iconRef.current || e.target === inputRef.current) {
                    if (isIconActive || e.target === iconRef.current) {
                        setIsIconActive(false);
                    }
                }
            }
            if ((e.key === 'Enter' || e.key === ' ') && e.target !== inputRef.current) {
                togglePopup();
            }
        };

        const parseInputValue: (inputVal: string) => Date | null = useCallback((inputVal: string) => {
            if (!inputVal || !inputVal.trim()) {
                return null;
            }
            const normalizedInput: string = inputVal.replace(/(am|pm|Am|aM|pM|Pm)/g, (match: string) => match.toUpperCase());
            if (inputFormatsString && inputFormatsString.length > 0) {
                for (const formatStr of inputFormatsString) {
                    try {
                        const parsedDate: Date = parseDate(normalizedInput, {locale: locale || 'en-US', format: formatStr, type: 'date' });
                        if (parsedDate && !isNaN(parsedDate.getTime())) {
                            return parsedDate;
                        }
                    } catch (e) {
                        continue;
                    }
                }
            }
            try {
                const parsedDate: Date = parseDate(normalizedInput, { locale: locale || 'en-US', format: format, type: 'date' });
                if (parsedDate && !isNaN(parsedDate.getTime())) {
                    return parsedDate;
                }
            } catch (e) {
                return null;
            }
            return null;
        }, [locale, format, inputFormatsString]);


        const updateValue: (
            newValue: Date | null,
            event?: React.MouseEvent<Element> | React.FocusEvent<Element> | React.KeyboardEvent<Element>
        ) => void = useCallback((
            newValue: Date | null,
            event?: React.MouseEvent<Element> | React.FocusEvent<Element> | React.KeyboardEvent<Element>
        ) => {
            if (!isControlled) {
                setSelectedDate(newValue);
            }
            const isValid: boolean = valid !== undefined ? valid : (required ? newValue !== null : true);
            setIsInputValid(isValid);
            if (onChange) {
                onChange({ value: newValue, event });
            }
        }, [isControlled, onChange, required, valid]);

        const handleClear: () => void = useCallback(() => {
            setInputValue('');
            updateValue(null);
            hidePopup();
            inputRef.current?.focus();
        }, [updateValue, hidePopup]);

        const handleCalendarChange: (event: ChangeEvent) => void = useCallback((event: ChangeEvent) => {
            if (event && event.value) {
                if (!isControlled) {
                    setInputValue(formatDateValue(event.value as Date));
                }
                updateValue(event.value as Date, event.event);
                setShouldFocusOnClose(true);
                hidePopup();
            }
        }, [formatDateValue, updateValue, hidePopup, isControlled]);

        const isDateDisabledByCellTemplate: (date: Date) => boolean = (date: Date) => {
            if (typeof cellTemplate !== 'function') {
                return false;
            }
            try {
                const isWeekend: boolean = date.getDay() === 0 || date.getDay() === 6;
                const today: Date = new Date();
                const referenceDate: Date = currentValue && !Array.isArray(currentValue) ? currentValue : today;
                const isOtherMonth: boolean = date.getMonth() !== referenceDate.getMonth();
                const isToday: boolean = today.toDateString() === date.toDateString();
                const isSelected: boolean | null | undefined = currentValue &&
                    !Array.isArray(currentValue) &&
                    currentValue.toDateString() === date.toDateString();
                const cellProps: CalendarCellProps = {
                    date: date,
                    isWeekend: isWeekend,
                    isDisabled: (minDate > date) || (maxDate < date),
                    isOutOfRange: isOtherMonth,
                    isToday: isToday,
                    isSelected: isSelected || false,
                    isFocused: false,
                    className: '',
                    id: `${date.valueOf()}`
                };

                const result: React.ReactNode = cellTemplate(cellProps);
                if (result && typeof result === 'object' && 'props' in result) {
                    return (result as any).props.isDisabled === true;
                }
                if (result === null || result === undefined) {
                    return true;
                }

                return false;
            } catch (error) {
                return false;
            }
        };

        const isValidDate: (date: Date) => boolean = (date: Date) => {
            if (!date || isNaN(date.getTime())) {
                return false;
            }
            if (strictMode) {
                if (minDate && maxDate && minDate.getTime() === maxDate.getTime()) {
                    return date.getTime() === minDate.getTime();
                }
                if (minDate && date < minDate) {
                    return false;
                }
                if (maxDate && date > maxDate) {
                    return false;
                }
            }

            const basicValidation: boolean = date >= (minDate || date) && date <= (maxDate || date);
            if (!basicValidation) {
                return false;
            }

            if (isDateDisabledByCellTemplate(date)) {
                return false;
            }

            return true;
        };

        const handleInputBlur: () => void = useCallback(() => {
            setIsFocused(false);
            const trimmedValue: string = inputValue.trim();
            if (trimmedValue === '') {
                setInputValue('');
                updateValue(null);
                setIsInputValid(valid !== undefined ? valid : !required);
                return;
            }
            if (strictMode && inputValue.trim() !== '') {
                let parsedDate: Date | null = parseInputValue(inputValue);
                if (!parsedDate) {
                    const twoDigitYearPattern: RegExp = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2})$/;
                    const match: RegExpExecArray | null = twoDigitYearPattern.exec(inputValue.trim());
                    if (match) {
                        const [_, part1, part2, twoDigitYear] = match;
                        const fullYear: number = 2000 + parseInt(twoDigitYear, 10);
                        const modifiedInput: string = `${part1}/${part2}/${fullYear}`;
                        parsedDate = parseInputValue(modifiedInput);
                    }
                }
                if (!parsedDate || !isValidDate(parsedDate)) {
                    setInputValue(currentValue ? formatDateValue(currentValue) : '');
                    setIsInputValid(valid !== undefined ? valid : !inputValue.trim());
                    if (!currentValue) {
                        updateValue(null);
                    }
                    return;
                } else {
                    setInputValue(formatDateValue(parsedDate));
                    updateValue(parsedDate);
                    return;
                }
            }
            let parsedDate: Date | null = parseInputValue(inputValue);
            if (!parsedDate && inputValue.trim() !== '') {
                const twoDigitYearPattern: RegExp = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2})$/;
                const match: RegExpExecArray | null = twoDigitYearPattern.exec(inputValue.trim());
                if (match) {
                    const [_, part1, part2, twoDigitYear] = match;
                    const fullYear: number = 2000 + parseInt(twoDigitYear, 10);
                    const modifiedInput: string = `${part1}/${part2}/${fullYear}`;
                    parsedDate = parseInputValue(modifiedInput);
                }
            }
            let isValid: boolean = true;
            if (inputValue.trim() !== '' && !parsedDate) {
                isValid = false;
            }
            if (parsedDate && !isValidDate(parsedDate)) {
                isValid = false;
            }
            if (valid !== undefined) {
                setIsInputValid(valid);
            } else if (inputValue.trim() === '') {
                setIsInputValid(!required);
            } else if (!isValid) {
                setIsInputValid(false);
            } else if (required) {
                setIsInputValid(currentValue !== null);
            } else {
                setIsInputValid(isValid);
            }
            if (parsedDate && isValidDate(parsedDate)) {
                setInputValue(formatDateValue(parsedDate));
                updateValue(parsedDate);
            } else if (inputValue.trim() === '') {
                updateValue(null);
            } else if (!strictMode) {
                updateValue(null);
                if (valid === undefined && inputValue.trim() !== '' && !isValid) {
                    setIsInputValid(false);
                }
            } else {
                updateValue(null);
            }
        }, [parseInputValue, inputValue, strictMode, formatDateValue, isValidDate, updateValue, currentValue, valid, required]);

        const handleInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void = (event: React.ChangeEvent<HTMLInputElement>) => {
            const newInputValue: string = event.target.value;
            setInputValue(newInputValue);
            if (valid === undefined) {
                if (newInputValue.trim() === '') {
                    setIsInputValid(!required);
                }
                else if (!strictMode) {
                    const parsedDate: Date | null  = parseInputValue(newInputValue);
                    setIsInputValid(parsedDate !== null && isValidDate(parsedDate));
                }
            }
        };

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
            value: currentValue,
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
            cellTemplate
        };

        const { zIndexPopup } = useMemo(() => {
            let baseValue: number = typeof zIndex === 'number' ? zIndex : 1000;
            if (baseValue === 1000 && containerRef.current) {
                baseValue = getZindexPartial(containerRef.current);
            }
            return {
                zIndexPopup: Math.max(3, baseValue + 1)
            };
        }, [zIndex,  containerRef.current]);

        useImperativeHandle(ref, () => ({
            ...publicAPI as IDatePicker,
            element: containerRef.current
        }), [publicAPI]);

        useEffect(() => {
            preRender('datepicker');
        }, []);

        return (
            <span
                ref={containerRef}
                className={[
                    'sf-input-group', 'sf-medium', 'sf-control-wrapper', 'sf-date-wrapper', className,
                    disabled ? 'sf-disabled' : '', readOnly ? 'sf-readonly' : '',
                    currentOpenState ? 'sf-input-focus' : '',
                    isFocused ? 'sf-input-focus' : '',
                    labelMode !== 'Never' ? 'sf-float-input' : '',
                    dir === 'rtl' ? 'sf-rtl' : '',
                    !isInputValid && validityStyles ? 'sf-error' : ''
                ].filter(Boolean).join(' ')}
                {...otherProps}
            >
                <InputBase
                    ref={inputRef}
                    className={'sf-datepicker'}
                    placeholder={labelMode === 'Never' ? placeholder : ''}
                    disabled={disabled}
                    readOnly={readOnly || !editable}
                    onFocus={() => {
                        setIsFocused(true);
                        if (openOnFocus && !disabled && !readOnly) {
                            showPopup();
                        }
                    }}
                    onBlur={() => {
                        setIsFocused(false);
                        handleInputBlur();
                    }}
                    value={inputValue}
                    onChange={editable && !readOnly && !disabled ? handleInputChange : undefined}
                    role="combobox"
                    aria-haspopup="dialog"
                    aria-expanded={currentOpenState}
                    aria-disabled={disabled}
                    onKeyDown={handleKeyDown}
                    tabIndex={0}
                    required={required}
                />
                {labelMode !== 'Never' && renderFloatLabelElement(
                    labelMode,
                    false,
                    inputValue,
                    placeholder,
                    'datepicker-input'
                )}

                {clearButton && inputValue && (isFocused || currentOpenState) && !readOnly && (
                    <span
                        className="sf-clear-icon"
                        aria-label="clear"
                        role="button"
                        onMouseDown={(e: React.MouseEvent<HTMLSpanElement>) => {
                            e.preventDefault();
                            handleClear();
                        }}
                    >
                        <CloseIcon width={14} height={14} />
                    </span>
                )}

                <span
                    ref={iconRef}
                    className={`sf-input-group-icon sf-date-icon sf-icons ${isIconActive ? 'sf-active' : ''}`}
                    aria-label="select"
                    role="button"
                    onClick={() => {
                        togglePopup();
                        setIsIconActive(true);
                    }}
                    onKeyDown={handleKeyDown}
                >
                    <TimelineDayIcon />
                </span>
                {currentOpenState && createPortal(
                    <>
                        {isFullScreenMode && (
                            <div className="sf-datepick-mob-popup-wrap" style={{ zIndex: zIndex.toString() }}>
                                <div className="sf-dlg-overlay"></div>
                                <Popup
                                    ref={popupRef}
                                    className={`sf-datepicker sf-popup-wrapper ${isFullScreenMode ? 'sf-popup-expand' : ''}`}
                                    open={currentOpenState}
                                    zIndex={zIndexPopup}
                                    onClose={() => {
                                        hidePopup();
                                    }}
                                    onOpen={() => {
                                        const element: HTMLElement | null = calendarRef.current?.element ?? null;
                                        if (element) {
                                            setTimeout(() => {
                                                element.focus();
                                            });
                                        }
                                        if (onOpen) {
                                            onOpen({
                                                popup: popupRef.current as IPopup
                                            });
                                        }
                                    }}
                                    relateTo={document.body}
                                    position={{ X: 'center', Y: 'center' }}
                                    collision={{
                                        X: CollisionType.Fit,
                                        Y: CollisionType.Fit
                                    }}
                                >
                                    <Calendar
                                        ref={calendarRef}
                                        value={currentValue && !Array.isArray(currentValue) ? currentValue : null}
                                        minDate={minDate}
                                        maxDate={maxDate}
                                        start={start}
                                        depth={depth}
                                        firstDayOfWeek={firstDayOfWeek}
                                        weekNumber={weekNumber}
                                        weekRule={weekRule}
                                        showTodayButton={showTodayButton}
                                        weekDaysFormat={weekDaysFormat}
                                        cellTemplate={cellTemplate}
                                        onChange={handleCalendarChange}
                                        onViewChange={(args: ViewChangeEvent) => {
                                            if (props.onViewChange) {
                                                props.onViewChange({
                                                    view: args.view,
                                                    date: args.date,
                                                    event: args.event
                                                });
                                            }
                                        }}
                                        className={isFullScreenMode ? 'sf-fullscreen-calendar' : ''}
                                        fullScreenMode={isFullScreenMode}
                                    />
                                </Popup>
                            </div>
                        )}
                        {!isFullScreenMode && (
                            <Popup
                                ref={popupRef}
                                className="sf-datepicker sf-popup-wrapper"
                                open={currentOpenState}
                                zIndex={zIndexPopup}
                                onClose={() => {
                                    hidePopup();
                                }}
                                onOpen={() => {
                                    const element: HTMLElement | null = calendarRef.current?.element ?? null;
                                    if (element) {
                                        setTimeout(() => {
                                            element.focus();
                                        });
                                    }
                                    if (onOpen) {
                                        onOpen({
                                            popup: popupRef.current as IPopup
                                        });
                                    }
                                }}
                                relateTo={containerRef.current as HTMLElement}
                                position={{ X: 'left', Y: 'bottom' }}
                                collision={{
                                    X: CollisionType.Flip,
                                    Y: CollisionType.Flip
                                }}
                            >
                                <Calendar
                                    ref={calendarRef}
                                    value={currentValue && !Array.isArray(currentValue) ? currentValue : null}
                                    minDate={minDate}
                                    maxDate={maxDate}
                                    start={start}
                                    depth={depth}
                                    firstDayOfWeek={firstDayOfWeek}
                                    weekNumber={weekNumber}
                                    weekRule={weekRule}
                                    showTodayButton={showTodayButton}
                                    weekDaysFormat={weekDaysFormat}
                                    cellTemplate={cellTemplate}
                                    onChange={handleCalendarChange}
                                    onViewChange={(args: ViewChangeEvent) => {
                                        if (props.onViewChange) {
                                            props.onViewChange({
                                                view: args.view,
                                                date: args.date,
                                                event: args.event
                                            });
                                        }
                                    }}
                                />
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
