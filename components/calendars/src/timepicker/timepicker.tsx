import * as React from 'react';
import { useState, useRef, useEffect, useCallback, forwardRef, useImperativeHandle, useMemo, JSX } from 'react';
import { InputBase, HelperText, renderFloatLabelElement } from '@syncfusion/react-inputs';
import { preRender, useProviderContext, Browser, Variant, Size, useStableId } from '@syncfusion/react-base';
import { CollisionType, type IPopup, Popup } from '@syncfusion/react-popups';
import { ClockIcon, CloseIcon } from '@syncfusion/react-icons';
import { createPortal } from 'react-dom';
import { clampTimeToRange } from './utils';
import { TimePickerProps } from './types';
import { PickerVariant } from '../datepicker/types';
import { Button } from '@syncfusion/react-buttons';
import TimeList from './timepicker-list';
import usePickerInput, { UsePickerInputResult } from '../hooks/usePickerInputs';
import usePickerPopup from '../hooks/usePickerPopup';
import usePickerInputKeyDown from '../hooks/usePickerInputKeyDown';
import useTimePanel from '../hooks/useTimePanel';
import { InputPrefix, InputSuffix } from '../calendar';

type ITimePickerProps = ITimePicker & Omit<React.InputHTMLAttributes<HTMLInputElement>, keyof ITimePicker>;

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
 * The TimePicker component provides a time input with a list-based selector for choosing time values.
 * It supports time formatting, parsing, min/max time constraints, time intervals (step), strict mode validation,
 * and can be rendered as an inline picker, dialog-based picker, or full-screen mode on mobile devices.
 *
 * ```typescript
 * import { TimePicker } from '@syncfusion/react-calendars';
 *
 * export default function App() {
 *   return <TimePicker />;
 * }
 * ```
 */
export const TimePicker: React.ForwardRefExoticComponent<ITimePickerProps & React.RefAttributes<ITimePicker>> =
    forwardRef<ITimePicker, ITimePickerProps>((props: ITimePickerProps, ref: React.Ref<ITimePicker>) => {
        const {
            value,
            id,
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
            strictMode = false,
            open,
            pickerIcon = true,
            editable = true,
            fullScreenMode = false,
            pickerVariant = PickerVariant.Auto,
            openOnFocus = false,
            required = false,
            valid,
            validationMessage = '',
            validityStyles = true,
            labelMode = 'Never',
            prefix,
            suffix,
            helperText,
            helperTextOnFocus = false,
            helperTextDirection = 'Left',
            onChange,
            onOpen,
            onClose,
            inputProps,
            popupSettings,
            inputMask = false,
            maskPlaceholder,
            ...otherProps
        } = props;

        const generatedId: string = useStableId('sf-timepicker');
        const timePickerId: string = id ?? generatedId;
        const [selectedTime, setSelectedTime] = useState<Date | null>(value ?? defaultValue ?? null);
        const [isIconActive, setIsIconActive] = useState<boolean>(false);

        const containerRef: React.RefObject<HTMLSpanElement | null> = useRef<HTMLSpanElement | null>(null);
        const inputRef: React.RefObject<HTMLInputElement | null> = useRef<HTMLInputElement>(null);
        const popupRef: React.RefObject<IPopup | null> = useRef<IPopup | null>(null);
        const mobRef: React.RefObject<HTMLDivElement | null> = useRef<HTMLDivElement | null>(null);

        const { dir, locale } = useProviderContext();
        const isControlled: boolean = value !== undefined;
        const currentValue: Date | null = isControlled ? (value || null) : selectedTime;

        const useDialog: boolean =
            pickerVariant === PickerVariant.Popup ||
            (pickerVariant === PickerVariant.Auto && Browser.isDevice);
        const useInline: boolean =
            pickerVariant === PickerVariant.Inline ||
            (pickerVariant === PickerVariant.Auto && !Browser.isDevice);

        const {
            displayedTimes,
            formatTime: formatTimeValue,
            parseTime,
            isValidTime,
            timeListRef,
            ensureSelectedVisible,
            forwardListKeyDown
        } = useTimePanel({
            step,
            minTime,
            maxTime,
            locale,
            timeFormat: format
        });

        const updateValue: (newValue: Date | null, event?: React.SyntheticEvent
        ) => void = useCallback((newValue: Date | null, event?: React.SyntheticEvent): void => {
            if (!isControlled) {
                setSelectedTime(newValue);
            }
            if (onChange) {
                onChange({ value: newValue, event });
            }
        }, [isControlled, onChange, required, valid]);

        const pickerInput: UsePickerInputResult = usePickerInput({
            locale,
            inputRef,
            placeholder,
            placeholderKey: 'timepicker',
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
            formatValue: formatTimeValue,
            parseInput: (raw: string) => parseTime(raw, false),
            isValid: (d: Date | null) => isValidTime(d),
            commitValue: updateValue,
            onOpen: () => {
                showPopup();
            },
            inputMask,
            format,
            maskPlaceholder
        });

        const { isOpen, showPopup, hidePopup, togglePopup, resolvedPopupSettings } = usePickerPopup({
            open,
            defaultOpen: false,
            disabled,
            readOnly,
            onOpen,
            onClose,
            containerRef,
            contentRefs: [popupRef as unknown as React.RefObject<HTMLElement | null>],
            extraInsideRefs: [mobRef as unknown as React.RefObject<HTMLElement | null>],
            inputRef,
            popupSettings
        });

        const handleTimeSelection: (time: Date, event?: React.SyntheticEvent) => void =
            useCallback((time: Date, event?: React.SyntheticEvent): void => {
                if (!isControlled) {
                    pickerInput.setInputValue(formatTimeValue(time));
                }
                updateValue(time, event);
                hidePopup();
            }, [formatTimeValue, updateValue, hidePopup, isControlled, pickerInput]);

        const handleInvalidTime: () => void = useCallback((): void => {
            if (currentValue) {
                pickerInput.setInputValue(formatTimeValue(currentValue));
                pickerInput.setIsInputValid(true);
            } else {
                pickerInput.setInputValue('');
                pickerInput.setIsInputValid(!required);
            }
        }, [strictMode, currentValue, formatTimeValue, required, updateValue, pickerInput]);

        const handleOutOfRangeTime: (parsedTime: Date, e?: React.FocusEvent<HTMLInputElement>)
        => void = useCallback((parsedTime: Date, e?: React.FocusEvent<HTMLInputElement>): void => {
            const clamped: Date | null = clampTimeToRange(parsedTime, minTime ?? null, maxTime ?? null);
            if (clamped) {
                pickerInput.setInputValue(formatTimeValue(clamped));
                updateValue(clamped, e);
                pickerInput.setIsInputValid(true);
            } else {
                pickerInput.setInputValue('');
                updateValue(null, e);
                pickerInput.setIsInputValid(!required);
            }
        }, [strictMode, minTime, maxTime, required, formatTimeValue, updateValue, pickerInput]);

        const commitInput: (e?: React.SyntheticEvent) => void = useCallback((e?: React.SyntheticEvent): void => {
            const text: string = pickerInput.maskInputProps
                ? pickerInput.maskInputProps!.value
                : pickerInput.inputValue;
            const isEmpty: boolean = pickerInput.maskInputProps
                ? !pickerInput.hasPartialInput
                : text.trim() === '';

            if (isEmpty) {
                if (strictMode && required) {
                    if (currentValue) {
                        pickerInput.setInputValue(formatTimeValue(currentValue));
                        pickerInput.setIsInputValid(true);
                    } else {
                        pickerInput.setIsInputValid(!required);
                    }
                } else {
                    updateValue(null, e);
                    pickerInput.setIsInputValid(!required);
                }
                return;
            }

            if (strictMode) {
                const parsedTime: Date | null = parseTime(text, false);
                if (parsedTime === null) {
                    handleInvalidTime();
                    return;
                }
                const withinRange: boolean = isValidTime(parsedTime);
                if (withinRange) {
                    const formattedValue: string = formatTimeValue(parsedTime);
                    pickerInput.setInputValue(formattedValue);
                    updateValue(parsedTime, e);
                    pickerInput.setIsInputValid(true);
                } else {
                    handleOutOfRangeTime(parsedTime, e as React.FocusEvent<HTMLInputElement>);
                }
                return;
            }

            const parsedExact: Date | null = parseTime(text, true);
            if (parsedExact && isValidTime(parsedExact)) {
                updateValue(parsedExact, e);
                pickerInput.setIsInputValid(true);
            } else {
                pickerInput.setIsInputValid(false);
            }
        }, [
            pickerInput,
            strictMode,
            required,
            currentValue,
            parseTime,
            isValidTime,
            formatTimeValue,
            updateValue,
            handleInvalidTime,
            handleOutOfRangeTime
        ]);

        const handleKeyDown: (e: React.KeyboardEvent<HTMLElement>) => void = useCallback((e: React.KeyboardEvent<HTMLElement>) => {
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
            case 'Enter':
                if (!isOpen) {
                    e.preventDefault();
                    commitInput(e);
                }
                break;
            default:
                break;
            }
            forwardListKeyDown(e, isOpen);
        }, [isOpen, showPopup, hidePopup, commitInput, forwardListKeyDown]);

        const mergedKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void = usePickerInputKeyDown({
            maskOnKeyDown: pickerInput.maskInputProps?.onKeyDown,
            pickerOnKeyDown: handleKeyDown
        });

        const handleInputKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void = (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (isOpen && e.key === 'Tab' && !e.shiftKey) {
                e.preventDefault();
                timeListRef.current?.focus();
                return;
            }
            mergedKeyDown(e);
        };

        const isPartialTimeValid: (input: string) => boolean = useCallback((input: string): boolean => {
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
                const [hourStr, minuteStr] = input.split(':');
                const hour: number = parseInt(hourStr, 10);
                const minute: number = parseInt(minuteStr, 10);
                return hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59;
            }
            const parsedTime: Date | null = parseTime(input);
            return parsedTime !== null && isValidTime(parsedTime);
        }, [parseTime, isValidTime, required]);

        const handleInputChange: (event: React.ChangeEvent<HTMLInputElement>
        ) => void = useCallback((event: React.ChangeEvent<HTMLInputElement>): void => {
            const newInputValue: string = event.target.value;
            pickerInput.setInputValue(newInputValue);
            if (valid === undefined) {
                pickerInput.setIsInputValid(isPartialTimeValid(newInputValue));
            }
        }, [valid, isPartialTimeValid]);

        useEffect(() => {
            preRender('timepicker');
        }, []);

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
            strictMode,
            value: currentValue,
            minTime,
            maxTime,
            step,
            required,
            valid,
            validationMessage,
            validityStyles,
            inputProps,
            popupSettings,
            helperText,
            helperTextOnFocus,
            helperTextDirection
        };

        useImperativeHandle(ref, () => ({
            ...publicAPI as ITimePicker,
            element: containerRef.current
        }), [publicAPI]);

        const handleIconClick: () => void = useCallback((): void => {
            togglePopup();
            setIsIconActive(true);
            inputRef.current?.focus();
        }, [togglePopup]);

        const handleClearMouseDown: (e: React.MouseEvent<HTMLSpanElement>)
        => void = useCallback((e: React.MouseEvent<HTMLSpanElement>): void => {
            e.preventDefault();
            pickerInput.handleClear();
            hidePopup();
        }, [pickerInput, hidePopup]);

        const classNames: string = [
            'sf-input-group sf-control', 'sf-timepicker',
            disabled ? 'sf-disabled' : '',
            readOnly ? 'sf-readonly' : '',
            isOpen || pickerInput.isFocused ? 'sf-input-focus' : '',
            labelMode !== 'Never' ? 'sf-float-input' : '',
            dir === 'rtl' ? 'sf-rtl' : '',
            size === Size.Small ? 'sf-small' : size === Size.Large ? 'sf-large' : 'sf-medium',
            !pickerInput.isInputValid && validityStyles ? 'sf-error' : '',
            variant && variant.toLowerCase() !== 'standard' ? (variant.toLowerCase() === 'outlined' ? 'sf-outline' : `sf-${variant.toLowerCase()}`)
                : '',
            className
        ].filter(Boolean).join(' ');

        const iconClassNames: string = [
            'sf-input-icon', 'sf-time-icon', 'sf-icons',
            isIconActive ? 'sf-active' : '',
            (disabled || inputProps?.disabled) ? 'sf-disabled' : ''
        ].filter(Boolean).join(' ');

        const sizeSuffix: string = size.toLowerCase().substring(0, 2);
        const timeListNode: JSX.Element = useMemo(() => (
            <TimeList
                ref={timeListRef}
                times={displayedTimes}
                selected={currentValue}
                onSelect={(t: Date, e: React.SyntheticEvent | undefined) => {
                    handleTimeSelection(t as Date, e);
                }}
                formatter={formatTimeValue}
                itemTemplate={itemTemplate}
                idBase={`${timePickerId}`}
                className="sf-timepicker-list"
                sizeClass={`sf-timepicker-list-${sizeSuffix}`}
                isOpen={isOpen}
                dir={dir as 'ltr' | 'rtl'}
            />
        ), [
            displayedTimes,
            currentValue,
            formatTimeValue,
            itemTemplate,
            isOpen,
            dir,
            handleTimeSelection,
            sizeSuffix,
            timePickerId,
            timeListRef
        ]);

        const handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void = (
            e: React.ChangeEvent<HTMLInputElement>
        ) => {
            if (!pickerInput.maskInputProps && (!editable || readOnly || disabled)) {
                return;
            }
            if (pickerInput.maskInputProps?.onChange) {
                pickerInput.maskInputProps.onChange(e);
            } else {
                handleInputChange(e);
            }
        };

        const handleInputBlur: (e: React.FocusEvent<HTMLInputElement>) => void = (e: React.FocusEvent<HTMLInputElement>) => {
            pickerInput.setIsFocused(false);
            commitInput(e);
            if (!(inputMask && maskPlaceholder !== undefined)) {
                pickerInput.setShowSegments(false);
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
                        id={timePickerId}
                        className={'sf-timepicker'}
                        placeholder={labelMode === 'Never' && !pickerInput.showMaskSegments ? pickerInput.getPlaceholder : ''}
                        disabled={disabled || (inputProps && inputProps.disabled)}
                        readOnly={readOnly || (inputProps && inputProps.readOnly) || (!editable && !inputMask) || !editable}
                        onFocus={pickerInput.handleInputFocus}
                        onBlur={handleInputBlur}
                        value={pickerInput.maskInputProps ? pickerInput.maskInputProps?.value : pickerInput.inputValue}
                        onChange={handleChange}
                        onKeyDown={handleInputKeyDown}
                        onClick={pickerInput.maskInputProps ? pickerInput.maskInputProps?.onClick : undefined}
                        onPaste={pickerInput.maskInputProps ? pickerInput.maskInputProps?.onPaste : undefined}
                        role='combobox'
                        aria-haspopup='listbox'
                        autoComplete='off'
                        aria-expanded={isOpen}
                        aria-disabled={disabled || (inputProps && inputProps.disabled)}
                        aria-controls={isOpen ? `${timePickerId}_options` : undefined}
                        aria-label={pickerInput.getPlaceholder || 'Time picker input'}
                        tabIndex={inputProps?.disabled ? -1 : 0}
                        required={required}
                        {...inputProps}
                    />
                    <InputSuffix suffix={suffix} />
                    {labelMode !== 'Never' && renderFloatLabelElement(
                        labelMode,
                        false,
                        pickerInput.inputValue,
                        placeholder,
                        timePickerId
                    )}

                    {clearButton && (!!pickerInput.inputValue || !!pickerInput.hasPartialInput) && (pickerInput.isFocused || isOpen)
                    && !readOnly && (
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
                        className={iconClassNames}
                        aria-label='select time'
                        role='button'
                        onClick={handleIconClick}
                        onMouseDown={(e: React.MouseEvent<HTMLSpanElement, MouseEvent>): void => {
                            e.preventDefault();
                        }}
                    >
                        {pickerIcon === true ? <ClockIcon /> : pickerIcon}
                    </span>

                    {isOpen &&
                        createPortal(
                            fullScreenMode && Browser.isDevice ? (
                                <div ref={mobRef} className='sf-timepicker-mob sf-control' style={{ zIndex: resolvedPopupSettings?.zIndex?.toString() }} role="dialog" aria-modal="true" aria-label="Time selection">
                                    <div className='sf-timepicker-header'>
                                        <Button
                                            variant={Variant.Standard}
                                            onClick={hidePopup}
                                        >
                                            <CloseIcon />
                                        </Button>
                                        <span className="sf-timepicker-title">Select Time</span>
                                    </div>
                                    {timeListNode}
                                </div>
                            ) : (
                                <>
                                    {useDialog && (
                                        <div className="sf-timepicker-popup-wrap sf-picker-popup" style={{ zIndex: resolvedPopupSettings?.zIndex?.toString() }}>
                                            <div className="sf-overlay"></div>
                                            <Popup
                                                ref={popupRef}
                                                className="sf-timepicker sf-popup sf-content-center"
                                                open={isOpen}
                                                onOpen={() => {
                                                    ensureSelectedVisible();
                                                }}
                                                relateTo={document.body}
                                                style={{ top: '0px', left: '0px', position: 'relative' }}
                                                position={{ X: 'center', Y: 'center' }}
                                                collision={{ X: CollisionType.Fit, Y: CollisionType.Fit }}
                                                aria-modal="true"
                                                role="dialog"
                                                aria-label="Time selection"
                                                {...resolvedPopupSettings}
                                            >
                                                {timeListNode}
                                            </Popup>
                                        </div>
                                    )}
                                    {useInline && (
                                        <Popup
                                            ref={popupRef}
                                            className="sf-timepicker sf-popup"
                                            open={isOpen}
                                            onOpen={() => {
                                                ensureSelectedVisible();
                                            }}
                                            relateTo={containerRef.current as HTMLElement}
                                            position={{ X: 'left', Y: 'bottom' }}
                                            collision={{ X: CollisionType.Flip, Y: CollisionType.Flip }}
                                            offsetY={4}
                                            aria-modal="true"
                                            role="dialog"
                                            aria-label="Time selection"
                                            {...resolvedPopupSettings}
                                        >
                                            {timeListNode}
                                        </Popup>
                                    )}
                                </>
                            ),
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

TimePicker.displayName = 'TimePicker';
export default TimePicker;
