import { useCallback, useMemo, type KeyboardEvent, type FocusEvent, type MouseEvent } from 'react';
import { T } from '../../drop-down-list/types';
import { compareTextWithCaseOption, getLastItemData, getTextValueField, normalizeRemoteData, updateItemData } from '../utils';
import { DataManager, Query } from '@syncfusion/react-data';
import { useDropdownKeyboard } from './useDropdownKeyboard';
import { UseDropdownKeyboardProps, UseDropdownProps, UseDropdownReturn } from './hook-types';
import { ListItemData } from '../types';
import { CSS_CLASSES } from '../constants';

export const useDropdown: (props: UseDropdownProps) => UseDropdownReturn = (props: UseDropdownProps): UseDropdownReturn => {
    const {
        state: { itemData, listData, textValue, dropdownValue, isPopupOpen, popupListData },
        actions: { setTextValue, setDropdownValue, setItemData, setIsLoading, setIsSpanFocused },
        config: { customValue, multiSelectable, maximumSelectionLength, closeOnSelect, autofill, spanClickable, addTagOnBlur, dataSource,
            query, filterable, openOnClick, disabled, readOnly, onCustomValueSelect, onChange, onDataRequest, onDataLoad, onError,
            skipDisabledItems, onScroll, virtualization, showSelectAll, mode, hideSelectedItem, enableGroupedCheckBox, ignoreCase },
        internalProps: { resolvedFields, hidePopup, showPopup, isRemoteData, clearText, getScrollContainer, computedDisabledItems,
            computedNonHiddenItems, handleSelectAll, toggleGroupByKey, getHeaderGroupKey },
        refs: { inputElementRef, remoteCacheRef, isFetchedRef }
    } = props;

    const keyboardCommitIfCustom: (evt?: KeyboardEvent<HTMLElement> | FocusEvent<HTMLElement> | MouseEvent<Element>,
        allowCustomVal?: boolean) => void = (evt?: KeyboardEvent<HTMLElement> | FocusEvent<HTMLElement> |
    MouseEvent<Element>, allowCustomVal: boolean = true) => {
        commitIfCustom(evt, allowCustomVal);
    };

    const prefetchIfNeeded: () => Promise<T[] | null> = useCallback(async (): Promise<T[] | null> => {
        if (!isRemoteData || isFetchedRef.current) {
            return null;
        }
        const dm: DataManager = dataSource as DataManager;
        try {
            setIsLoading(true);
            onDataRequest?.({ data: dm, query: query ?? new Query() });
            const res: unknown = await dm.executeQuery(query ?? new Query());
            const arr: T[] = (Array.isArray((res as { result: unknown })?.result) ? (res as { result: unknown }).result : []) as T[];
            isFetchedRef.current = true;
            onDataLoad?.({ data: arr });
            setIsLoading(false);
            return arr;
        } catch (err: unknown) {
            setIsLoading(false);
            onError?.(err as Error);
            return null;
        }
    }, [isRemoteData, dataSource, query, setIsLoading, onDataRequest, onDataLoad, onError]);

    const prefetchData: () => Promise<T[] | null> = useCallback(async () => {
        const data: T[] | null = await prefetchIfNeeded();
        const normalized: T[] | null = normalizeRemoteData(data);
        if (normalized) {
            remoteCacheRef.current = normalized;
            return normalized;
        }
        return null;
    }, [prefetchIfNeeded]);

    const dropdownKeyboardProps: UseDropdownKeyboardProps = useMemo(() => ({
        state: { listData, textValue, itemData, dropdownValue, isPopupOpen, popupListData },
        actions: { setIsSpanFocused, setDropdownValue, setItemData, setTextValue },
        config: { skipDisabledItems, onScroll, virtualization, filterable, showSelectAll, spanClickable, disabled, readOnly,
            multiSelectable, customValue, mode, maximumSelectionLength, hideSelectedItem, closeOnSelect, onChange, enableGroupedCheckBox },
        internalProps: { resolvedFields, showPopup, hidePopup, clearText, commitIfCustom: keyboardCommitIfCustom, getScrollContainer,
            computedDisabledItems, computedNonHiddenItems, isRemoteData, handleSelectAll, prefetchData, toggleGroupByKey,
            getHeaderGroupKey },
        refs: { inputElementRef }

    }), [listData, textValue, itemData, dropdownValue, isPopupOpen, popupListData, setIsSpanFocused, setDropdownValue, setItemData,
        setTextValue, skipDisabledItems, onScroll, virtualization, filterable, showSelectAll, spanClickable, disabled, readOnly,
        multiSelectable, customValue, mode, maximumSelectionLength, hideSelectedItem, closeOnSelect, onChange, getScrollContainer,
        computedDisabledItems, computedNonHiddenItems, isRemoteData, handleSelectAll, inputElementRef, resolvedFields, showPopup,
        hidePopup, clearText, keyboardCommitIfCustom, toggleGroupByKey, getHeaderGroupKey ]);

    const { keyActionHandler, handleCustomTypeAhead, typeAheadMatchedItem, isShowSelectAllFocused, setIsCustomElemFocused,
        setTypeAheadMatchedItem, isCustomElemFocused } = useDropdownKeyboard(dropdownKeyboardProps);

    const commitIfCustom: (evt?: KeyboardEvent<HTMLElement> | FocusEvent<HTMLElement> | MouseEvent<Element>,
        allowCustomVal?: boolean) => void = useCallback((evt?: KeyboardEvent<HTMLElement> | FocusEvent<HTMLElement> |
    MouseEvent<Element>, allowCustomVal: boolean = true) => {
        const text: string = inputElementRef.current ? inputElementRef.current.value : (textValue ?? '');
        if (!text) { return; }
        const filteredData: T[] = popupListData;
        const candidateItems: T[] =
                Array.isArray(filteredData) && filteredData.length > 0
                    ? (filteredData) : (listData?.map((li: ListItemData) => li.item) ?? []);
        const isTextMatchInItems: T | undefined = candidateItems.find((it: T) => {
            const itemText: string = String(getTextValueField(it, 'text', resolvedFields) ?? '');
            return compareTextWithCaseOption(itemText, text, Boolean(ignoreCase));
        });
        let currentDropdownValue: T | null = null;
        let currentItemData: T | null = null;
        let currentText: string = '';
        if (isTextMatchInItems) {
            currentDropdownValue = getTextValueField(isTextMatchInItems, 'value', resolvedFields);
            currentItemData = isTextMatchInItems;
            currentText = String(getTextValueField(isTextMatchInItems, 'text', resolvedFields));
            setTypeAheadMatchedItem(null);
        }
        if (!isTextMatchInItems && customValue && allowCustomVal) {
            currentDropdownValue = currentItemData = currentText = text;
        }
        if (!isTextMatchInItems && !customValue) {
            currentDropdownValue = currentItemData = null;
            if (multiSelectable) {
                setTextValue('');
                return;
            }
        }
        const newValues: T[] | null = updateItemData<T>(dropdownValue, currentDropdownValue, Boolean(multiSelectable),
                                                        maximumSelectionLength);
        setDropdownValue(newValues);
        setItemData(updateItemData(itemData, currentItemData as string, Boolean(multiSelectable), maximumSelectionLength));
        setTextValue(multiSelectable ? '' : currentText);
        if (isPopupOpen && closeOnSelect) {
            hidePopup?.();
        }
        if (!isTextMatchInItems && customValue && allowCustomVal) {
            onCustomValueSelect?.(currentText);
        }
        if (onChange) {
            onChange({
                event: (evt as KeyboardEvent<Element>),
                previousItemData: getLastItemData(itemData) ?? null,
                value: spanClickable ? currentDropdownValue : multiSelectable ? newValues : getTextValueField(currentItemData, 'text', resolvedFields),
                itemData: currentItemData
            });
        }
        if (autofill) {
            inputElementRef.current?.setSelectionRange(inputElementRef.current?.value.length, inputElementRef.current?.value.length);
        }
    }, [customValue, inputElementRef, textValue, popupListData, listData, resolvedFields, setDropdownValue,
        autofill, setItemData, setTextValue, onCustomValueSelect, onChange, itemData, hidePopup, isPopupOpen,
        setTypeAheadMatchedItem, spanClickable, multiSelectable, dropdownValue, closeOnSelect, maximumSelectionLength,
        addTagOnBlur, ignoreCase]);

    const onKeyHandler: (e: KeyboardEvent<HTMLSpanElement>) => void = useCallback((e: KeyboardEvent<HTMLSpanElement>) => {
        if (!spanClickable) {
            if ((!multiSelectable || isCustomElemFocused) && e.key === 'Enter' && textValue && (!itemData || itemData.length === 0) && !typeAheadMatchedItem) {
                commitIfCustom(e);
                e.preventDefault();
                e.stopPropagation();
                return;
            }
            const isPrintable: boolean = e.key.trim().length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey;
            if (!isShowSelectAllFocused && multiSelectable && isPrintable && customValue) {
                setIsCustomElemFocused(true);
            }
            if ((isPrintable && !filterable) || (e.key === ' ' && textValue)) {
                return;
            }
            if (multiSelectable) {
                if (!e.altKey && e.key === 'ArrowDown' && !isPopupOpen) {
                    setIsSpanFocused(true);
                    showPopup(e);
                    return;
                }
                if (e.key === 'Backspace' && !textValue && itemData && itemData.length > 0 && dropdownValue) {
                    setItemData(itemData.slice(0, -1));
                    const updatedValues: T[] = dropdownValue.slice(0, -1);
                    setDropdownValue(updatedValues);
                    if (onChange) {
                        onChange({
                            event: e, previousItemData: getLastItemData(itemData) ?? null,
                            value: updatedValues, itemData: getLastItemData(itemData)
                        });
                    }
                    return;
                }
            }
        }
        keyActionHandler(e);
    }, [keyActionHandler, filterable, spanClickable, commitIfCustom, textValue, itemData, typeAheadMatchedItem, multiSelectable,
        isPopupOpen, showPopup, setIsSpanFocused, dropdownValue, isCustomElemFocused, customValue, setIsCustomElemFocused,
        isShowSelectAllFocused, computedDisabledItems, computedNonHiddenItems]);

    const togglePopup: (e: MouseEvent<HTMLSpanElement>) => void = useCallback((e: MouseEvent<HTMLSpanElement>) => {
        if (isPopupOpen) {
            hidePopup(e);
        } else {
            showPopup(e);
        }
    }, [showPopup, isPopupOpen, hidePopup]);

    const handleLoadingOnClick: () => void = useCallback(() => {
        if (isRemoteData && isPopupOpen) {
            setIsLoading(false);
        }
    }, [isRemoteData, isPopupOpen, setIsLoading]);

    const dropdownIconClick: (e: MouseEvent<HTMLSpanElement>) => void = useCallback((e: MouseEvent<HTMLSpanElement>) => {
        if (spanClickable || e.button === 2 || disabled || readOnly) { return; }
        if ((e.target as HTMLElement).closest(`.${CSS_CLASSES.CHIP_DELETE_ICON}`)) {
            return;
        }
        e.preventDefault();
        setIsSpanFocused(!isPopupOpen);
        handleLoadingOnClick();
        togglePopup(e);
    }, [disabled, isPopupOpen, isRemoteData, readOnly, spanClickable, setIsSpanFocused, setIsLoading, hidePopup, showPopup, togglePopup,
        handleLoadingOnClick ]);

    const dropDownClick: (e: MouseEvent<HTMLSpanElement>) => void = useCallback((e: MouseEvent<HTMLSpanElement>) => {
        if (multiSelectable && openOnClick) {
            dropdownIconClick(e);
            return;
        }
        if (!spanClickable || e.button === 2 || disabled) { return; }
        const el: HTMLElement = e.target as HTMLElement;
        if (el && el.parentElement && el.parentElement.matches('.' + CSS_CLASSES.CLEAR_ICON)) { return; }
        setIsSpanFocused(!isPopupOpen);
        e.preventDefault();
        if (!readOnly) {
            togglePopup(e);
        }
        handleLoadingOnClick();
    }, [setIsLoading, disabled, readOnly, isPopupOpen, isRemoteData, spanClickable, setIsSpanFocused, openOnClick, dropdownIconClick,
        multiSelectable, togglePopup, handleLoadingOnClick]);

    return {
        commitIfCustom, prefetchData, onKeyHandler, dropDownClick, dropdownIconClick, keyActionHandler, handleCustomTypeAhead,
        typeAheadMatchedItem, isShowSelectAllFocused, setIsCustomElemFocused, setTypeAheadMatchedItem, isCustomElemFocused
    };
};
