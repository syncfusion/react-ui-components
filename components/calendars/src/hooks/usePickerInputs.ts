import { useCallback, useEffect, useMemo, useState } from 'react';
import { getPlaceholderL10n } from '../datepicker/utils';
import { useMask, UseMaskResult } from './useMask';
import { CalendarType } from '../calendar-core';
import { MaskPlaceholder } from '../datepicker';
import { IL10n, L10n } from '@syncfusion/react-base';

export interface UsePickerInputOptions {
    locale?: string | null;
    inputRef?: React.RefObject<HTMLInputElement | null>;
    placeholder?: string;
    placeholderKey?: 'datepicker' | 'datetimepicker' | 'timepicker' | 'daterangepicker';
    labelMode?: 'Never' | 'Always' | 'Auto';
    disabled?: boolean;
    readOnly?: boolean;
    editable?: boolean;
    openOnFocus?: boolean;
    strictMode?: boolean;
    required?: boolean;
    valid?: boolean;
    validationMessage?: string;
    value: Date | null | undefined;
    formatValue: (d: Date) => string;
    parseInput: (raw: string) => Date | null;
    isValid: (d: Date | null) => boolean;
    commitValue: (d: Date | null, event?: React.SyntheticEvent) => void;
    onOpen?: () => void;
    inputMask?: boolean;
    format?: string;
    minDate?: Date;
    maskPlaceholder?: MaskPlaceholder;
    calendarType?: CalendarType;
}

export interface UsePickerInputResult {
    inputValue: string;
    isInputValid: boolean;
    isFocused: boolean;
    getPlaceholder: string;
    handleInputFocus: () => void;
    handleInputBlur: () => void;
    handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleClear: () => void;
    handleClearMouseDown: (e: React.MouseEvent<HTMLSpanElement>) => void;
    setInputValue: React.Dispatch<React.SetStateAction<string>>;
    setIsInputValid: React.Dispatch<React.SetStateAction<boolean>>;
    setIsFocused: React.Dispatch<React.SetStateAction<boolean>>;
    showMaskSegments: boolean,
    setShowSegments: React.Dispatch<React.SetStateAction<boolean>>;
    maskInputProps?: ReturnType<typeof useMask>['inputProps'];
    hasPartialInput?: boolean;
}

/**
 * Hook for managing picker input state, including value formatting, parsing, focus, blur, and clear interactions.
 *
 * @param {UsePickerInputOptions} options - Configuration options for the picker input.
 * @returns {UsePickerInputResult} Object containing input state and handlers.
 */
export default function usePickerInput(options: UsePickerInputOptions): UsePickerInputResult {
    const {
        locale,
        inputRef,
        placeholder = '',
        placeholderKey = 'picker',
        disabled = false,
        readOnly = false,
        openOnFocus = false,
        strictMode = false,
        required = false,
        valid,
        validationMessage = '',
        value,
        formatValue,
        parseInput,
        isValid,
        commitValue,
        onOpen,
        inputMask = false,
        minDate,
        format = '',
        maskPlaceholder,
        calendarType
    } = options;

    const l10n: IL10n = useMemo<IL10n>(
        () => L10n(
            placeholderKey,
            { day: 'day', month: 'month', year: 'year', hour: 'hour', minute: 'minute', second: 'second', meridiem: 'AM' },
            locale ?? 'en-US'
        ),
        [placeholderKey, locale]
    );

    const localeMaskPlaceholders: MaskPlaceholder = useMemo(() => ({
        day: l10n.getConstant('day'),
        month: l10n.getConstant('month'),
        year: l10n.getConstant('year'),
        hour: l10n.getConstant('hour'),
        minute: l10n.getConstant('minute'),
        second: l10n.getConstant('second'),
        meridiem: l10n.getConstant('meridiem')
    }), [l10n]);

    const effectiveMaskPlaceholder: MaskPlaceholder = useMemo(() => ({
        ...localeMaskPlaceholders,
        ...(maskPlaceholder || {})
    }), [localeMaskPlaceholders, maskPlaceholder]);

    const showMaskByDefault: boolean = useMemo(() => {
        return inputMask && maskPlaceholder !== undefined;
    }, [inputMask, maskPlaceholder]);

    const [showMaskSegments, setShowMaskSegments] = useState<boolean>(() => showMaskByDefault);

    const maskResult: UseMaskResult = useMask({
        format: inputMask ? format : '',
        locale: locale ?? 'en-US',
        value: inputMask ? value : null,
        minDate,
        maskPlaceholder: inputMask ? effectiveMaskPlaceholder : undefined,
        onChange: undefined,
        inputRef: inputMask ? inputRef : undefined,
        calendarType
    });


    const [inputValue, setInputValue] = useState<string>('');
    const [isFocused, setIsFocused] = useState<boolean>(false);
    const [isInputValid, setIsInputValid] = useState<boolean>(
        valid !== undefined ? valid : (required ? !!value : true)
    );

    useEffect(() => {
        if (value) {
            const formatted: string = formatValue(value);
            if (formatted !== inputValue) {
                setInputValue(formatted);
            }
        } else if (inputValue) {
            setInputValue('');
        }
    }, [value, formatValue]);

    useEffect(() => {
        const isValidNow: boolean = valid !== undefined ? valid : (required ? !!value : true);
        setIsInputValid(isValidNow);
        if (inputRef?.current) {
            inputRef.current.setCustomValidity(isValidNow ? '' : (validationMessage || ''));
        }
    }, [valid, validationMessage, required, value, inputRef]);

    const getPlaceholder: string = useMemo(() => {
        return getPlaceholderL10n(placeholderKey, placeholder, locale as string);
    }, [placeholderKey, locale, placeholder]);

    const handleInputFocus: (e?: React.FocusEvent<HTMLInputElement>)
    => void = useCallback((e?: React.FocusEvent<HTMLInputElement>): void => {
        setIsFocused(true);
        if (inputMask && !showMaskByDefault) {
            setShowMaskSegments(true);
        }
        if (inputMask && e && maskResult.inputProps.onFocus) {
            maskResult.inputProps.onFocus(e);
        }
        if (openOnFocus && !disabled && !readOnly) {
            onOpen?.();
        }
    }, [inputMask, maskResult.inputProps, openOnFocus, disabled, readOnly, onOpen, showMaskByDefault, setShowMaskSegments]);

    const handleInputBlur: () => void = useCallback((): void => {
        setIsFocused(false);
        if (inputMask && !showMaskByDefault) {
            const isEmpty: boolean = !maskResult.hasPartialInput;
            if (isEmpty) {
                setShowMaskSegments(false);
            }
        }
        const raw: string = inputMask ? maskResult.inputProps.value.trim() : inputValue.trim();
        const isEmpty: boolean = inputMask ? !maskResult.hasPartialInput : !raw;
        if (isEmpty) {
            if (!inputMask && inputValue !== '') {
                setInputValue('');
            }
            commitValue(null);
            setIsInputValid(valid !== undefined ? valid : !required);
            return;
        }
        const parsed: Date | null = parseInput(raw);
        const ok: boolean = parsed !== null && isValid(parsed);
        if (ok) {
            commitValue(parsed);
            setIsInputValid(true);
        } else {
            if (strictMode) {
                if (inputMask) {
                    maskResult.reset();
                } else {
                    setInputValue(value ? formatValue(value) : '');
                }
                commitValue(value ?? null);
                setIsInputValid(valid !== undefined ? valid : !required);
            } else {
                setIsInputValid(false);
            }
        }
    }, [inputMask, value, isValid, strictMode, valid, required, commitValue, inputValue,
        parseInput, formatValue, maskResult.inputProps.value, maskResult.hasPartialInput,
        maskResult.reset]);

    const handleInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>): void => {
            const next: string = event.target.value;
            setInputValue(next);
            if (valid === undefined) {
                if (!next.trim()) {
                    setIsInputValid(!required);
                } else if (!strictMode) {
                    const parsed: Date | null = parseInput(next);
                    setIsInputValid(parsed !== null && isValid(parsed));
                }
            }
        }, [valid, required, strictMode, parseInput, isValid]);

    const handleClear: () => void = useCallback((): void => {
        if (inputMask) {
            maskResult.reset();
        }
        setInputValue('');
        commitValue(null);
        if (inputRef?.current) {
            inputRef.current.focus();
        }
    }, [commitValue, inputRef, inputMask, maskResult]);

    const handleClearMouseDown: (e: React.MouseEvent<HTMLSpanElement>)
    => void = useCallback((e: React.MouseEvent<HTMLSpanElement>): void => {
        e.preventDefault();
        handleClear();
    }, [handleClear]);

    return {
        inputValue,
        isInputValid,
        isFocused,
        getPlaceholder,
        handleInputFocus,
        handleInputBlur,
        handleInputChange,
        handleClear,
        handleClearMouseDown,
        setInputValue,
        setIsInputValid,
        setIsFocused,
        showMaskSegments,
        setShowSegments: setShowMaskSegments,
        maskInputProps: inputMask && showMaskSegments ? {...maskResult.inputProps, onFocus: handleInputFocus} : undefined,
        hasPartialInput: inputMask ? maskResult.hasPartialInput : false
    };
}
