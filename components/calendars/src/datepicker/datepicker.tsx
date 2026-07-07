import { useState, useRef, useEffect, useCallback, forwardRef, useImperativeHandle, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { InputBase, HelperText, renderFloatLabelElement } from '@syncfusion/react-inputs';
import { Browser, useProviderContext, preRender, LabelMode, Orientation, Size, useStableId } from '@syncfusion/react-base';
import { Popup, CollisionType, type IPopup } from '@syncfusion/react-popups';
import { CloseIcon, TimelineTodayIcon } from '@syncfusion/react-icons';
import { Calendar, InputPrefix, InputSuffix } from '../calendar';
import { CalendarView, ViewChangeEvent, ICalendar, CalendarProps, CalendarChangeEvent } from '../calendar';
import { CalendarSystem, createCalendarSystem } from '../calendar-core';
import { inRange } from '../calendar/utils';
import { DatePickerProps, PickerVariant, Variant } from './types';
import { createIsDateDisabledByCellTemplate, getFocusableElementsInRoot } from './utils';
import usePickerInput, { UsePickerInputResult } from '../hooks/usePickerInputs';
import usePickerInputKeyDown from '../hooks/usePickerInputKeyDown';
import usePickerPopup from '../hooks/usePickerPopup';
import * as React from 'react';
import useDateFormatting from '../hooks/useDateFormatting';
export { LabelMode };

type IDatePickerProps = IDatePicker & Omit<React.InputHTMLAttributes<HTMLInputElement>, keyof IDatePicker>;

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
 * It supports date formatting, parsing, min/max date constraints, strict mode validation, custom calendar templates,
 * and can be rendered as an inline picker or a dialog-based picker.
 *
 * ```typescript
 * import { DatePicker } from '@syncfusion/react-calendars';
 *
 * export default function App() {
 *   return <DatePicker />;
 * }
 * ```
 */
export const DatePicker: React.ForwardRefExoticComponent<IDatePickerProps & React.RefAttributes<IDatePicker>> =
    forwardRef<IDatePicker, IDatePickerProps>((props: IDatePickerProps, ref: React.Ref<IDatePicker>) => {
        const {
            className = '',
            placeholder = 'Choose a date',
            id,
            disabled = false,
            readOnly = false,
            labelMode = 'Never',
            size = Size.Medium,
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
            pickerIcon = true,
            weekDaysFormat,
            open,
            inputFormats,
            pickerVariant = PickerVariant.Auto,
            showDaysOutsideCurrentMonth,
            disablePastDays,
            disableFutureDays,
            variant = Variant.Standard,
            prefix,
            suffix,
            cellTemplate,
            footerTemplate,
            headerTemplate,
            onChange,
            onViewChange,
            onOpen,
            onClose,
            openOnFocus = false,
            editable = true,
            required = false,
            valid,
            validationMessage = '',
            validityStyles = true,
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

        const generatedId: string = useStableId('sf-datepicker');
        const datePickerId: string = id ?? generatedId;
        const { locale, dir } = useProviderContext();
        const calendarSystem: CalendarSystem = useMemo<CalendarSystem>(() => createCalendarSystem(calendarType || 'gregorian'), [calendarType]);
        const [selectedDate, setSelectedDate] = useState<Date | null>(value ?? defaultValue ?? null);
        const containerRef: React.RefObject<HTMLSpanElement | null> = useRef<HTMLSpanElement | null>(null);
        const inputRef: React.RefObject<HTMLInputElement | null> = useRef<HTMLInputElement>(null);
        const popupRef: React.RefObject<IPopup | null> = useRef<IPopup | null>(null);
        const calendarRef: React.RefObject<ICalendar | null> = useRef<ICalendar | null>(null);
        const isControlled: boolean = value !== undefined;
        const currentValue: Date | null | undefined = isControlled ? value : selectedDate;
        const isDevice: boolean = Browser.isDevice;
        const useDialog: boolean =
            pickerVariant === PickerVariant.Popup ||
            (pickerVariant === PickerVariant.Auto && isDevice);
        const useInline: boolean =
            pickerVariant === PickerVariant.Inline ||
            (pickerVariant === PickerVariant.Auto && !isDevice);

        const isDateDisabledByCellTemplate: (date: Date) => boolean = useCallback((date: Date) =>
            createIsDateDisabledByCellTemplate(
                cellTemplate,
                currentValue && !Array.isArray(currentValue) ? currentValue : null,
                minDate,
                maxDate,
                calendarSystem
            )(date), [cellTemplate, currentValue, minDate, maxDate, calendarSystem]);

        const isValidDate: (date: Date | null) => boolean = useCallback((date: Date | null) => {
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

        const commitValue: (newDate: Date | null, event?: React.SyntheticEvent)
        => void = useCallback((newDate: Date | null, event?: React.SyntheticEvent) => {
            if (!isControlled) {
                setSelectedDate(newDate);
            }
            onChange?.({ value: newDate, event });
        }, [isControlled, onChange]);

        const { isOpen, showPopup, hidePopup, togglePopup, resolvedPopupSettings } = usePickerPopup({
            open,
            defaultOpen: false,
            disabled,
            readOnly,
            onOpen,
            onClose,
            containerRef,
            contentRefs: [popupRef as unknown as React.RefObject<HTMLElement | null>,
                calendarRef as unknown as React.RefObject<HTMLElement | null>],
            inputRef,
            popupSettings
        });

        const getFocusableElements: () => HTMLElement[] = useCallback((): HTMLElement[] => {
            const root: Element | undefined = popupRef.current?.element as Element | undefined;
            return getFocusableElementsInRoot(root);
        }, []);

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
        }, [showPopup, hidePopup, getFocusableElements]);

        const handleCalendarChange: (event: CalendarChangeEvent) => void = useCallback((event: CalendarChangeEvent) => {
            const d: Date | null = (event?.value as Date) || null;
            if (d && isValidDate(d)) {
                commitValue(d, event.event);
                hidePopup();
            }
        }, [commitValue, hidePopup, isValidDate]);

        const handleViewChange: (args: ViewChangeEvent) => void = useCallback((args: ViewChangeEvent): void => {
            onViewChange?.({ view: args.view, date: args.date, event: args.event });
        }, [onViewChange]);

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
            calendarType,
            cellTemplate,
            headerTemplate,
            footerTemplate,
            onChange: handleCalendarChange,
            onViewChange: handleViewChange
        }), [
            currentValue, minDate, maxDate, start, depth, firstDayOfWeek, weekNumber, weekRule,
            showToolBar, showTodayButton, orientation, weekDaysFormat, cellTemplate,
            headerTemplate, footerTemplate, handleCalendarChange, handleViewChange, showDaysOutsideCurrentMonth,
            disablePastDays, disableFutureDays, calendarType
        ]);

        const handleIconClick: () => void = useCallback((): void => {
            togglePopup();
        }, [togglePopup]);

        const openPopup: () => void = useCallback((): void => {
            calendarRef.current?.focusGrid?.();
        }, [onOpen]);

        useEffect((): void => {
            preRender('datepicker');
        }, []);

        const { formatValue: formatDateValue, parseInput } = useDateFormatting({
            locale,
            type: 'date',
            format,
            inputFormats,
            calendarType
        });

        const pickerInput: UsePickerInputResult = usePickerInput({
            locale,
            inputRef,
            placeholder,
            placeholderKey: 'datepicker',
            labelMode,
            disabled,
            readOnly,
            editable,
            openOnFocus,
            strictMode,
            required,
            valid,
            validationMessage,
            value: (currentValue && !Array.isArray(currentValue)) ? currentValue : null,
            formatValue: formatDateValue,
            parseInput,
            isValid: isValidDate,
            commitValue,
            onOpen: showPopup,
            inputMask,
            format,
            maskPlaceholder,
            calendarType
        });

        const handleInputKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void = usePickerInputKeyDown({
            maskOnKeyDown: pickerInput.maskInputProps?.onKeyDown,
            pickerOnKeyDown: handleKeyDown
        });

        const handleClearMouseDown: (e: React.MouseEvent<HTMLSpanElement>)
        => void = useCallback((e: React.MouseEvent<HTMLSpanElement>): void => {
            e.preventDefault();
            pickerInput.handleClear();
            hidePopup();
        }, [pickerInput, hidePopup]);

        const publicAPI: Partial<IDatePicker> = {
            placeholder,
            editable,
            inputFormats,
            openOnFocus,
            format,
            labelMode,
            size,
            disabled,
            open,
            clearButton,
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
            pickerIcon,
            weekDaysFormat,
            required,
            valid,
            validationMessage,
            validityStyles,
            cellTemplate,
            footerTemplate,
            headerTemplate,
            showToolBar,
            inputProps,
            helperText,
            helperTextOnFocus,
            helperTextDirection,
            calendarType
        };

        useImperativeHandle(ref, (): IDatePicker => ({
            ...(publicAPI as IDatePicker),
            element: containerRef.current
        }), [publicAPI]);

        const classNames: string = [
            'sf-input-group sf-control', 'sf-medium', 'sf-datepicker', className,
            disabled ? 'sf-disabled' : '', readOnly ? 'sf-readonly' : '',
            isOpen ? 'sf-input-focus' : '',
            pickerInput.isFocused ? 'sf-input-focus' : '',
            labelMode !== 'Never' ? 'sf-float-input' : '',
            dir === 'rtl' ? 'sf-rtl' : '',
            !pickerInput.isInputValid && validityStyles ? 'sf-error' : '',
            size === Size.Small ? 'sf-small' : size === Size.Large ? 'sf-large' : 'sf-medium',
            variant && variant.toLowerCase() !== 'standard' ? (variant.toLowerCase() === 'outlined' ? 'sf-outline' : `sf-${variant.toLowerCase()}`)
                : ''
        ].filter(Boolean).join(' ');

        const iconClassNames: string = [
            'sf-input-icon', 'sf-icons',
            (disabled || inputProps?.disabled) ? 'sf-disabled' : ''
        ].filter(Boolean).join(' ');

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
            <>
                <span
                    ref={containerRef}
                    className={classNames}
                    {...otherProps}
                >
                    <InputPrefix prefix={prefix} />
                    <InputBase
                        ref={inputRef}
                        id={datePickerId}
                        placeholder={labelMode === 'Never' && !pickerInput.showMaskSegments ? pickerInput.getPlaceholder : ''}
                        disabled={disabled || (inputProps && inputProps.disabled)}
                        readOnly={readOnly || (inputProps && inputProps.readOnly) || (!editable && !inputMask) || !editable}
                        onFocus={pickerInput.handleInputFocus}
                        onBlur={pickerInput.handleInputBlur}
                        value={pickerInput.maskInputProps ? pickerInput.maskInputProps.value : pickerInput.inputValue}
                        onChange={(pickerInput.maskInputProps || (editable && !readOnly && !disabled)) ? handleChange : undefined}
                        onKeyDown={handleInputKeyDown}
                        onClick={pickerInput.maskInputProps?.onClick}
                        onPaste={pickerInput.maskInputProps?.onPaste}
                        role="combobox"
                        aria-haspopup="dialog"
                        aria-autocomplete='none'
                        aria-expanded={!!isOpen}
                        aria-controls={isOpen ? `${datePickerId}_options` : undefined}
                        aria-disabled={disabled || (inputProps && inputProps.disabled)}
                        aria-label={pickerInput.getPlaceholder || 'Date picker input'}
                        tabIndex={inputProps?.disabled ? -1 : 0}
                        required={required}
                        {...inputProps}
                    ></InputBase>
                    <InputSuffix suffix={suffix} />
                    {labelMode !== 'Never' && renderFloatLabelElement(
                        labelMode,
                        false,
                        pickerInput.inputValue,
                        placeholder,
                        datePickerId
                    )}

                    {clearButton && (!!pickerInput.inputValue || !!pickerInput.hasPartialInput) && (pickerInput.isFocused || !!isOpen)
                    && !readOnly && (
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
                        className={iconClassNames}
                        aria-label="select date"
                        role="button"
                        onClick={handleIconClick}
                        onMouseDown={(e: React.MouseEvent<HTMLSpanElement, MouseEvent>): void => {
                            e.preventDefault();
                        }}
                    >
                        {pickerIcon === true ? <TimelineTodayIcon viewBox="0 0 24 26" /> : pickerIcon}
                    </span>

                    {isOpen && createPortal(
                        <>
                            {useDialog && (
                                <div id={`${datePickerId}_options`} className="sf-datepick-popup-wrap sf-picker-popup" style={{ zIndex: resolvedPopupSettings?.zIndex?.toString() }}>
                                    <div className={'sf-overlay'}></div>
                                    <Popup
                                        ref={popupRef}
                                        className={'sf-datepicker sf-popup sf-content-center'}
                                        open={!!isOpen}
                                        style={{ top: '0px', left: '0px', position: 'relative' }}
                                        onOpen={openPopup}
                                        relateTo={document.body}
                                        position={{ X: 'center', Y: 'center' }}
                                        onKeyDown={handleKeyDown}
                                        collision={{ X: CollisionType.Fit, Y: CollisionType.Fit }}
                                        {...resolvedPopupSettings}
                                    >
                                        <Calendar ref={calendarRef} {...calendarProps} />
                                    </Popup>
                                </div>
                            )}
                            {useInline && typeof document != 'undefined' && (
                                <Popup
                                    ref={popupRef}
                                    id={`${datePickerId}_options`}
                                    className="sf-datepicker sf-popup"
                                    open={!!isOpen}
                                    onOpen={openPopup}
                                    relateTo={containerRef.current as HTMLElement}
                                    position={{ X: 'left', Y: 'bottom' }}
                                    offsetY={4}
                                    onKeyDown={handleKeyDown}
                                    collision={{ X: CollisionType.Flip, Y: CollisionType.Flip }}
                                    {...resolvedPopupSettings}
                                >
                                    <Calendar ref={calendarRef} {...calendarProps} />
                                </Popup>
                            )}
                        </>,
                        document.body
                    )}
                </span>
                <HelperText
                    helperText={helperText}
                    helperTextOnFocus={helperTextOnFocus}
                    isFocused={pickerInput.isFocused || isOpen}
                    helperTextDirection={helperTextDirection}
                />
            </>

        );
    });

DatePicker.displayName = 'DatePicker';
export default DatePicker;
