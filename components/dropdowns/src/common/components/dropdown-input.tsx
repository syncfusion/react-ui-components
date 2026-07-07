import { InputBase } from '@syncfusion/react-inputs';
import { DropdownContextType, useDropdownContext } from '../context';
import { ChangeEvent, FC, InputHTMLAttributes, JSX, memo, useCallback, useMemo, type FocusEvent } from 'react';
import { buildInputClasses, getIndexOfItemData, getLastItemData, hasItemData, resolveLocalizationPlaceholder, updateItemData } from '../utils';
import { DropdownProps } from '../types';
import { CSS_CLASSES } from '../constants';

const ROLE: string = 'combobox';
const TYPE: string = 'text';

export const DropdownInput: FC = memo(() => {
    const context: DropdownContextType = useDropdownContext();
    const {
        state: { itemData, dropdownValue, isPopupOpen, popupListData, text },
        refs: { inputElementRef, popupRef, dropdownRootRef },
        actions: { setText, setItemData, setDropdownValue, setIsSpanFocused },
        config: { id, ariaLabel, disabled, readOnly, labelMode, required, multiSelectable, placeholder, localeComponentName, locale,
            spanClickable, minLength, filterable, autofill, value, addTagOnBlur, open, inputProps, inputClassName, dir, valueTemplate,
            onChange, inputValueRenderer },
        internalProps: { hidePopup, showPopup, handleInputChange, commitIfCustom, handleCustomTypeAhead, resolvedFields, isInputValid }
    } = context;

    const getPlaceholder: string = useMemo(() => {
        const showPlaceholder: boolean = !(multiSelectable && itemData && itemData.length > 0);
        return resolveLocalizationPlaceholder(placeholder, localeComponentName, locale, showPlaceholder);
    }, [locale, placeholder, localeComponentName, multiSelectable, itemData]);

    const onInputChange: (event: ChangeEvent<HTMLInputElement>) => void = useCallback((event: ChangeEvent<HTMLInputElement>) => {
        const currentText: string = event.target.value;
        setText(currentText);
        if (spanClickable) { return; }
        const inputEvent: InputEvent = event.nativeEvent as InputEvent;
        const isDeletion: boolean = !!(inputEvent && inputEvent.inputType && inputEvent.inputType.toLowerCase().includes('delete'));
        const meetsThreshold: boolean = minLength !== undefined && currentText?.length >= minLength;
        if (value !== undefined && !multiSelectable) {
            onChange?.({
                event: event,
                previousItemData: getLastItemData(itemData) ?? null,
                value: currentText,
                itemData: null
            });
        }
        if (isDeletion) {
            if (!multiSelectable) {
                setItemData(updateItemData(itemData, null, Boolean(multiSelectable)));
                setDropdownValue(updateItemData(dropdownValue, null, Boolean(multiSelectable)));
            }
            if (!meetsThreshold) {
                hidePopup();
            }
        }
        if (!meetsThreshold) {
            return;
        }
        if (!isPopupOpen) {
            showPopup(event.nativeEvent);
        }
        if (filterable) {
            requestAnimationFrame(() => {
                handleInputChange(event);
                if (autofill && !isDeletion) {
                    requestAnimationFrame(() => {
                        const matchedText: string | null = handleCustomTypeAhead(currentText);
                        if (autofill && matchedText) {
                            setText(matchedText);
                            requestAnimationFrame(() => {
                                if (inputElementRef.current) {
                                    const start: number = currentText.length;
                                    const end: number = matchedText.length;
                                    inputElementRef.current.setSelectionRange(start, end);
                                }
                            });
                        }
                    });
                }
            });

        } else if (!isDeletion) {
            const matchedText: string | null = handleCustomTypeAhead(currentText);
            if (autofill && matchedText) {
                setText(matchedText);
                requestAnimationFrame(() => {
                    if (inputElementRef.current) {
                        const start: number = currentText.length;
                        const end: number = matchedText.length;
                        inputElementRef.current.setSelectionRange(start, end);
                    }
                });
            }
        }
    }, [setText, spanClickable, filterable, handleCustomTypeAhead, isPopupOpen, autofill, inputElementRef, minLength, dropdownValue,
        itemData, multiSelectable, hidePopup]);

    const handleFocus: () => void = useCallback(() => {
        setIsSpanFocused(true);
        if (spanClickable) {
            const length: number | undefined = inputElementRef.current?.value.length;
            if (length) {
                inputElementRef.current?.setSelectionRange(length, length);
            }
        }
    }, [setIsSpanFocused, spanClickable, inputElementRef]);

    const onBlurHandler: (e: FocusEvent<HTMLElement>) => void = useCallback((e: FocusEvent<HTMLElement>) => {
        if (disabled) { return; }
        const target: (EventTarget & Element) | null = e.relatedTarget;
        const movedToPopup: boolean = !!(target && popupRef?.current && popupRef?.current?.element?.contains(target));
        if (!spanClickable && !movedToPopup) {
            commitIfCustom(e, Boolean(!multiSelectable || (multiSelectable && addTagOnBlur)));
        }
        if (!dropdownRootRef.current?.contains(target) && !movedToPopup) {
            setIsSpanFocused(false);
        }
    }, [disabled, dropdownRootRef, setIsSpanFocused, commitIfCustom, spanClickable, popupRef, multiSelectable, addTagOnBlur]);

    const comboboxA11yProps: Omit<InputHTMLAttributes<HTMLInputElement>, keyof DropdownProps> = useMemo(() => ({
        'aria-controls': isPopupOpen ? `${id}_popup` : undefined,
        'aria-activedescendant': isPopupOpen && hasItemData(itemData) ? `${id}_option_${getIndexOfItemData(getLastItemData(itemData), popupListData, resolvedFields)}` : undefined,
        'aria-expanded': open ?? isPopupOpen
    }), [id, open, isPopupOpen, itemData, resolvedFields, getIndexOfItemData]);

    const inputClassNames: string = useMemo(() => {
        return buildInputClasses({
            baseClasses: [],
            isRtl: dir === 'rtl',
            isInputValid,
            inputClassName,
            showValueTemplate: Boolean(spanClickable && valueTemplate && itemData && itemData.length > 0)
        });
    }, [dir, isInputValid, inputClassName, spanClickable, valueTemplate, itemData]);

    const restInputProps: Omit<InputHTMLAttributes<HTMLInputElement>, keyof DropdownProps> = useMemo(() => {
        const { className: inputPropsClassName, ...otherInputProps } = inputProps || {};
        const mergedClassName: string = [inputPropsClassName, inputClassNames].filter(Boolean).join(' ');
        return {
            ...otherInputProps, id, className: mergedClassName, readOnly: spanClickable || readOnly,
            required, disabled, value: text, defaultValue: undefined
        };
    }, [inputProps, text, inputClassNames, id, readOnly, required, disabled, spanClickable]);

    const rootInput: JSX.Element = useMemo(() => (
        <InputBase
            id={id}
            ref={inputElementRef}
            type={TYPE}
            role={ROLE}
            aria-haspopup='listbox'
            aria-label={ariaLabel}
            aria-autocomplete='list'
            aria-disabled={disabled}
            aria-readonly={readOnly}
            placeholder={getPlaceholder}
            floatLabelType={labelMode}
            required={required}
            onChange={onInputChange}
            onFocus={handleFocus}
            onBlur={onBlurHandler}
            {...comboboxA11yProps}
            {...restInputProps}
        />
    ), [id, inputElementRef, ariaLabel, disabled, readOnly, getPlaceholder, labelMode, handleInputChange, handleFocus,
        onBlurHandler, comboboxA11yProps, restInputProps]);

    return (<>
        {!inputValueRenderer ? rootInput : (<span className={CSS_CLASSES.VALUE_RENDERER_CLASS}>
            {inputValueRenderer(rootInput)}
        </span>)}
    </>);
});

DropdownInput.displayName = 'DropdownInput';

export default DropdownInput;
