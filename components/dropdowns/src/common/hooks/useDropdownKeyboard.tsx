import { useCallback, useMemo, useState, type MouseEvent, type KeyboardEvent } from 'react';
import { getValue } from '@syncfusion/react-base';
import { scrollIntoItem } from '@syncfusion/react-lists';
import { ListItemData } from '../types';
import { T } from '../../drop-down-list/types';
import { compareItemData, getLastItemData, getTextValueField, updateItemData } from '../utils';
import { DropdownKeyboardReturn, UseDropdownKeyboardProps } from './hook-types';
import { DisplayMode } from '../../multi-select/types';

export const useDropdownKeyboard: (props: UseDropdownKeyboardProps) => DropdownKeyboardReturn = (props: UseDropdownKeyboardProps):
DropdownKeyboardReturn => {
    const {
        state: { listData, textValue, itemData, dropdownValue, isPopupOpen },
        actions: { setIsSpanFocused, setDropdownValue, setItemData, setTextValue },
        config: { skipDisabledItems, onScroll, virtualization, filterable, showSelectAll, spanClickable, disabled, readOnly,
            multiSelectable, customValue, mode, maximumSelectionLength, hideSelectedItem, closeOnSelect, onChange, enableGroupedCheckBox },
        internalProps: { resolvedFields: fields, showPopup, hidePopup, clearText, commitIfCustom, getScrollContainer,
            computedDisabledItems, computedNonHiddenItems, isRemoteData, handleSelectAll, prefetchData, toggleGroupByKey,
            getHeaderGroupKey },
        refs: { inputElementRef }
    } = props;

    const currentItemData: T | null = useMemo(() => getLastItemData(itemData), [itemData]);
    const [typeAheadMatchedItem, setTypeAheadMatchedItem] = useState<ListItemData | null>(null);
    const [isShowSelectAllFocused, setIsShowSelectAllFocused] =
        useState<boolean>(Boolean(showSelectAll) && !typeAheadMatchedItem && !currentItemData);
    const [isCustomElemFocused, setIsCustomElemFocused] = useState<boolean>(false);
    const isInteractive: boolean = useMemo(() => !disabled && !readOnly, [disabled, readOnly]);
    const hasCustomValue: boolean = useMemo(() =>
        Boolean(multiSelectable && customValue && textValue), [textValue, multiSelectable, customValue]);
    const hasChip: boolean = useMemo(() =>
        Boolean(multiSelectable && mode !== DisplayMode.Delimiter && itemData && itemData.length > 0), [mode, multiSelectable, itemData]);

    const keyBoardSelectionCallback: (nextValue: string | number | boolean, currentItem: T, currentText: string,
        e: KeyboardEvent<HTMLElement>, prevItem?: T, clearAll?: boolean) => void =
        useCallback((nextValue: string | number | boolean, currentItem: T, currentText: string,
                     e: KeyboardEvent<HTMLElement>, prevItem?: T, clearAll?: boolean) => {
            let newValues: T[] | null = null;
            if (clearAll) {
                setTextValue('');
                setDropdownValue(updateItemData(dropdownValue, null, Boolean(multiSelectable)));
                setItemData(updateItemData(itemData, null, Boolean(multiSelectable)));
            }
            else {
                newValues = updateItemData(dropdownValue, nextValue, Boolean(multiSelectable), maximumSelectionLength);
                setDropdownValue(newValues as { [key: string]: unknown; }[]);
                setItemData(updateItemData(itemData, currentItem, Boolean(multiSelectable), maximumSelectionLength) as string[]);
                setTextValue?.(multiSelectable ? '' : currentText);
                if (multiSelectable && filterable) {
                    clearText(e as unknown as MouseEvent<Element>);
                }
            }

            if (onChange) {
                onChange({
                    event: e,
                    previousItemData: prevItem as { [key: string]: unknown; },
                    value: spanClickable ? nextValue : multiSelectable ? newValues : currentText,
                    itemData: currentItem as { [key: string]: unknown; }
                });
            }
        }, [itemData, multiSelectable, spanClickable, setItemData, setDropdownValue, setTextValue, onChange,
            dropdownValue, maximumSelectionLength, filterable, clearText]);

    const isItemDisabledByMaxSelection: (item: T) => boolean =  useCallback((item: T): boolean => {
        const isDisabled: boolean = Array.from(computedDisabledItems).some((disabledItem: T) =>
            compareItemData(disabledItem, item));
        let isExist: boolean = true;
        if (hideSelectedItem && itemData && itemData.length > 0) {
            isExist = computedNonHiddenItems.some((data: T) => compareItemData(data, item));
        }
        return isDisabled || !isExist;
    }, [computedDisabledItems, computedNonHiddenItems, hideSelectedItem, itemData]);

    const buildListItems: (raw: T[]) => ListItemData[] = useCallback((raw: T[]) => {
        return (raw).map(
            (item: T) => {
                const isDisabled: boolean | '' | undefined = fields?.disabled && typeof item === 'object' && getValue(fields.disabled, item) === true;
                const isHeader: boolean = typeof item === 'object' && !!getValue('isHeader', item);
                const isMaxDisabled: boolean = isPopupOpen ? isItemDisabledByMaxSelection(item) : false;
                return { item, isDisabled: Boolean(isDisabled) || isMaxDisabled, isHeader };
            }
        );
    }, [fields?.disabled, isPopupOpen, computedDisabledItems, computedNonHiddenItems]);

    const isItemDisabled: (item: ListItemData) => boolean = useCallback((item: ListItemData) => {
        if (item?.isHeader && !enableGroupedCheckBox) { return true; }
        return Boolean(item?.isDisabled);
    }, [enableGroupedCheckBox]);

    const findNextEnabledItem: (items: ListItemData[], startIndex: number, direction: number) => number = useCallback(
        (items: ListItemData[], startIndex: number, direction: number) => {
            if (!skipDisabledItems) {
                return Math.max(0, Math.min(items.length - 1, startIndex + direction));
            }
            let index: number = startIndex;
            const maxIterations: number = items.length;
            for (let i: number = 0; i < maxIterations; i++) {
                index += direction;
                if (index < 0 || index >= items.length) {
                    break;
                }
                if (!isItemDisabled(items[index as number])) {
                    return index;
                }
            }
            return -1;
        }, [skipDisabledItems, isItemDisabled]);

    const findEdgeEnabledItem: (items: ListItemData[], fromEnd?: boolean) => number = useCallback(
        (items: ListItemData[], fromEnd: boolean = false) => {
            if (!skipDisabledItems) {
                return fromEnd ? items.length - 1 : 0;
            }
            if (fromEnd) {
                for (let i: number = items.length - 1; i >= 0; i--) {
                    if (!isItemDisabled(items[i as number])) {
                        return i;
                    }
                }
                return -1;
            } else {
                for (let i: number = 0; i < items.length; i++) {
                    if (!isItemDisabled(items[i as number])) {
                        return i;
                    }
                }
                return -1;
            }
        }, [skipDisabledItems, isItemDisabled]);

    const findNearestEnabledItem: (items: ListItemData[], targetIndex: number) => number = useCallback(
        (items: ListItemData[], targetIndex: number) => {
            if (!skipDisabledItems) {
                return targetIndex;
            }
            if (!isItemDisabled(items[targetIndex as number])) {
                return targetIndex;
            }
            let forwardIndex: number = targetIndex;
            let backwardIndex: number = targetIndex;
            while (forwardIndex < items.length - 1 || backwardIndex > 0) {
                if (forwardIndex < items.length - 1) {
                    forwardIndex++;
                    if (!isItemDisabled(items[forwardIndex as number])) {
                        return forwardIndex;
                    }
                }
                if (backwardIndex > 0) {
                    backwardIndex--;
                    if (!isItemDisabled(items[backwardIndex as number])) {
                        return backwardIndex;
                    }
                }
            }
            return -1;
        },
        [skipDisabledItems, isItemDisabled]
    );

    const getItemText: (li: ListItemData) => string = (li: ListItemData) => String(getTextValueField(li.item, 'text', fields) ?? '');

    const findNextByChar: (items: ListItemData[], char: string, startFrom: number) => number =
        (items: ListItemData[], char: string, startFrom: number) => {
            if (!items || items.length === 0 || !char) { return -1; }
            const total: number = items.length;
            let idx: number = Math.max(-1, Math.min(total - 1, startFrom));
            for (let i: number = 0; i < total; i++) {
                idx = (idx + 1) % total;
                const it: ListItemData = items[idx as number];
                if (isItemDisabled(it)) { continue; }
                if (getItemText(it).toLowerCase().startsWith(char)) { return idx; }
            }
            return -1;
        };

    const triggerOnChangeEvent: (targetItem: ListItemData, e: KeyboardEvent<HTMLElement>, prevItem?: ListItemData) => void =
        (targetItem: ListItemData, e: KeyboardEvent<HTMLElement>, prevItem?: ListItemData) => {
            const nextValue: string | number | boolean = getTextValueField(targetItem.item, 'value', fields) as string;
            const currentText: string = String(getTextValueField(targetItem.item, 'text', fields) ?? nextValue);
            if (nextValue !== undefined) {
                keyBoardSelectionCallback(nextValue, targetItem.item, currentText, e, prevItem?.item);
            }
        };

    const handleGroupToggle: (groupHeaderItem: ListItemData, e: KeyboardEvent<HTMLElement>) => void =
    useCallback((groupHeaderItem: ListItemData, e: KeyboardEvent<HTMLElement>) => {
        const groupKey: string = getHeaderGroupKey(groupHeaderItem.item);
        const { newItemData, newDropdownValue } = toggleGroupByKey(groupKey);
        setItemData(updateItemData(itemData, newItemData.length > 0 ? newItemData : [], Boolean(multiSelectable),
                                   maximumSelectionLength) as T[]);
        setDropdownValue(updateItemData(dropdownValue, newDropdownValue.length > 0 ? newDropdownValue : null, Boolean(multiSelectable),
                                        maximumSelectionLength) as T[]);
        if (onChange) {
            onChange({
                event: e,
                previousItemData: getLastItemData(itemData) ?? null,
                value: newDropdownValue,
                itemData: getLastItemData(newItemData) as string
            });
        }
    }, [getHeaderGroupKey, toggleGroupByKey, setItemData, setDropdownValue, onChange, itemData, multiSelectable, maximumSelectionLength,
        dropdownValue]);

    const getData: () => ListItemData[] = useCallback((): ListItemData[] => {
        const displayData: T[] | null = isPopupOpen ? computedNonHiddenItems : null;
        return Array.isArray(displayData) ? buildListItems(displayData) : listData;
    }, [isPopupOpen, computedNonHiddenItems, buildListItems, listData]);

    const getCurrentIndex: (items: ListItemData[]) => number = (items: ListItemData[]) => {
        const currentData: T | ListItemData | null | undefined =
            multiSelectable && typeAheadMatchedItem ? typeAheadMatchedItem.item : currentItemData;
        const currValue: string = typeof currentData === 'object' && currentData !== null ? (getValue(fields?.value ?? 'value', currentData)) : (currentData);
        const currIndexFromItem: number = items.findIndex((li: ListItemData) => String(getTextValueField(li.item, 'value', fields)) === String(currValue ?? ''));
        return currIndexFromItem !== -1 ? currIndexFromItem : currentData ? currIndexFromItem : -1;
    };

    const selectItem: (e: KeyboardEvent<HTMLElement>, items: ListItemData[], targetIndex: number, currentIndex: number,
        isPreviewOnly?: boolean) => void = useCallback((e: KeyboardEvent<HTMLElement>, items: ListItemData[],
                                                        targetIndex: number, currentIndex: number, isPreviewOnly: boolean = true) => {
        const prev: ListItemData | undefined = currentIndex > -1 ? items[currentIndex as number] : undefined;
        if (isPreviewOnly && multiSelectable) {
            setTypeAheadMatchedItem(items[targetIndex as number]);
            setIsShowSelectAllFocused(false);
            setIsCustomElemFocused(false);
        } else {
            triggerOnChangeEvent(items[targetIndex as number], e, prev);
        }

        const isEndReached: boolean = targetIndex >= items.length - 1;
        if (isEndReached && virtualization && onScroll) {
            const startIndex: number = Array.isArray(items) ? items.length : 0;
            const overscan: number = virtualization.overscanCount ?? 5;
            const count: number = virtualization.pageSize + overscan;
            onScroll({ originalEvent: (e.nativeEvent as unknown as Event), startIndex, count });
        }
    }, [triggerOnChangeEvent, virtualization, onScroll, multiSelectable, setIsShowSelectAllFocused, setIsCustomElemFocused]);

    const scrollItemIntoView: (index: number) => void = useCallback((index: number) => {
        if (isPopupOpen) {
            scrollIntoItem(index, getScrollContainer() as HTMLElement);
        }
    }, [isPopupOpen, scrollIntoItem, getScrollContainer]);

    const handleTypeAhead: (e: KeyboardEvent<HTMLElement>) => void = useCallback((e: KeyboardEvent<HTMLElement>) => {
        const char: string = e.key.toLowerCase();
        const runOnItems: (items: ListItemData[]) => void = (items: ListItemData[]) => {
            if (items.length === 0) { return; }
            const curr: number = getCurrentIndex(items);
            const matchIdx: number = findNextByChar(items, char, curr);
            if (matchIdx === -1) { return; }
            selectItem(e, items, matchIdx, curr, multiSelectable);
            scrollItemIntoView(matchIdx);
        };

        if ((!listData || listData.length === 0) && isRemoteData) {
            fetchData(e);
            return;
        }
        const logicalItems: ListItemData[] = getData();
        if (logicalItems) {
            runOnItems(logicalItems);
        }
    }, [isRemoteData, listData, prefetchData, buildListItems, isPopupOpen, scrollItemIntoView,
        skipDisabledItems, triggerOnChangeEvent, currentItemData, fields, selectItem, multiSelectable]);

    const handleCustomTypeAhead: (text: string) => string | null = useCallback((text: string) => {
        const searchItems: ListItemData[] = getData();
        if (!searchItems || searchItems.length === 0) {
            setTypeAheadMatchedItem(null);
            return null;
        }
        const matchIndex: number = findNextByChar(searchItems, text.toLowerCase(), -1);
        let matchedText: string | null = null;
        if (matchIndex === -1) {
            setTypeAheadMatchedItem(null);
        } else {
            setTypeAheadMatchedItem(searchItems[matchIndex as number]);
            matchedText = String(getTextValueField(searchItems[matchIndex as number].item, 'text', fields));
            scrollItemIntoView(matchIndex);
        }
        return matchedText;
    }, [getData, findNextByChar, setTypeAheadMatchedItem, isPopupOpen, scrollItemIntoView]);

    const isNavKey: (key: string) => boolean | undefined = (key: string) => key === 'ArrowDown' || key === 'ArrowUp' || key === 'PageUp' || key === 'PageDown' || (spanClickable && (key === 'Home' || key === 'End'));

    const computeNextIndex: (key: string, items: ListItemData[], currentIndex: number) => number =
        useCallback((key: string, items: ListItemData[], currentIndex: number) => {
            if (!multiSelectable && typeAheadMatchedItem) {
                const matchedIndex: number = items.findIndex((li: ListItemData) => String(getTextValueField(li.item, 'value', fields)) ===
                    String(getTextValueField(typeAheadMatchedItem.item, 'value', fields)));
                setTypeAheadMatchedItem(null);
                return matchedIndex;
            }
            const len: number = items.length;
            switch (key) {
            case 'ArrowDown':
                return findNextEnabledItem(items, currentIndex, 1);
            case 'ArrowUp':
                return findNextEnabledItem(items, currentIndex, -1);
            case 'PageDown': {
                const base: number = currentIndex !== -1 ? currentIndex : 0;
                const raw: number = Math.max(0, Math.min(len - 1, base + 10));
                return findNearestEnabledItem(items, raw);
            }
            case 'PageUp': {
                const base: number = currentIndex !== -1 ? currentIndex : len - 1;
                const raw: number = Math.max(0, Math.min(len - 1, base - 10));
                return findNearestEnabledItem(items, raw);
            }
            case 'Home':
                return findEdgeEnabledItem(items, false);
            case 'End':
                return findEdgeEnabledItem(items, true);
            default:
                return currentIndex;
            }
        }, [findNextEnabledItem, findNearestEnabledItem, findEdgeEnabledItem, getTextValueField, typeAheadMatchedItem]);

    const fetchData: (e: KeyboardEvent<HTMLElement>) => void = (e: KeyboardEvent<HTMLElement>) => {
        prefetchData?.().then((fetched: T[] | null) => {
            if (!fetched || fetched.length === 0) {
                return;
            }
            const tempItems: ListItemData[] = buildListItems(fetched);
            runNavigation(e, tempItems, e.key);
        });
    };

    const runNavigation: (e: KeyboardEvent<HTMLElement>, items: ListItemData[], key: string) => void = useCallback(
        (e: KeyboardEvent<HTMLElement>, items: ListItemData[], key: string) => {
            if (items.length === 0) { return; }
            let curr: number = getCurrentIndex(items);
            const isUp: boolean = key === 'ArrowUp';
            const isDown: boolean = key === 'ArrowDown';
            if (isShowSelectAllFocused && showSelectAll) {
                if (isUp) {
                    return;
                }
                if (isDown) {
                    setIsShowSelectAllFocused(false);
                    if (hasCustomValue) {
                        setIsCustomElemFocused(true);
                        return;
                    }
                    curr = -1;
                }
            }
            if (isCustomElemFocused) {
                if (isUp) {
                    setIsCustomElemFocused(false);
                    setIsShowSelectAllFocused(true);
                    return;
                }
                if (isDown) {
                    setIsCustomElemFocused(false);
                    curr = -1;
                }
            }
            const next: number = computeNextIndex(key, items, curr);
            if (next !== curr && next >= 0 && next < items.length) {
                selectItem(e, items, next, curr);
                scrollItemIntoView(next);
                return;
            }
            if (isUp && next === -1) {
                if (hasCustomValue) {
                    setIsCustomElemFocused(true);
                    setTypeAheadMatchedItem(null);
                    return;
                }
                if (showSelectAll) {
                    setIsCustomElemFocused(false);
                    setIsShowSelectAllFocused(true);
                    setTypeAheadMatchedItem(null);
                    return;
                }
            }
        }, [computeNextIndex, triggerOnChangeEvent, currentItemData, fields, selectItem, setIsShowSelectAllFocused, showSelectAll,
            setTypeAheadMatchedItem, isShowSelectAllFocused, setIsCustomElemFocused, hasCustomValue, isCustomElemFocused,
            scrollItemIntoView]);

    const togglePopup: (e: KeyboardEvent<HTMLElement>, isOpen: boolean) => void =
        useCallback((e: KeyboardEvent<HTMLElement>, isOpen: boolean) => {
            if (isOpen) {
                showPopup(e);
                setIsSpanFocused(true);
                e.preventDefault();
            } else if (closeOnSelect || (e?.key !== 'Enter' && e?.key !== ' ')) {
                hidePopup(e);
                inputElementRef.current?.focus();
            }
            setIsSpanFocused(true);
        }, [showPopup, setIsSpanFocused, hidePopup, closeOnSelect, inputElementRef]);

    const handleEnterOrSpace: (e: KeyboardEvent<HTMLElement>) => void = useCallback(
        (e: KeyboardEvent<HTMLElement>) => {
            e.preventDefault();
            if (isPopupOpen) {
                const logicalItems: ListItemData[] = getData();
                if (!logicalItems) { return; }
                let curr: number = getCurrentIndex(logicalItems);
                if (curr === -1 && spanClickable && filterable && logicalItems.length > 0) {
                    curr = findEdgeEnabledItem(logicalItems, false);
                }
                if (isShowSelectAllFocused && showSelectAll && handleSelectAll) {
                    handleSelectAll(e);
                    togglePopup(e, false);
                    return;
                }
                if (isCustomElemFocused && hasCustomValue && commitIfCustom) {
                    commitIfCustom(e);
                    togglePopup(e, false);
                    return;
                }
                if (typeAheadMatchedItem) {
                    curr = logicalItems.findIndex((li: ListItemData) => String(getTextValueField(li.item, 'value', fields)) ===
                        String(getTextValueField(typeAheadMatchedItem.item, 'value', fields)));
                    if (!multiSelectable) {
                        setTypeAheadMatchedItem(null);
                    }
                    const filterElement: HTMLInputElement | null | undefined = inputElementRef?.current;
                    if (filterElement) {
                        filterElement.setSelectionRange(filterElement.value.length, filterElement.value.length);
                    }
                }
                if (curr >= 0 && curr < logicalItems.length) {
                    const currentItem: ListItemData = logicalItems[curr as number];
                    if (currentItem?.isHeader && enableGroupedCheckBox) {
                        handleGroupToggle(currentItem, e);
                    } else {
                        selectItem(e, logicalItems, curr, curr, false);
                    }
                }
                togglePopup(e, false);
                return;
            }
            else {
                togglePopup(e, true);
                return;
            }
        }, [isPopupOpen, getData, getCurrentIndex, spanClickable, filterable, findEdgeEnabledItem, isShowSelectAllFocused, showSelectAll,
            handleSelectAll, togglePopup, isCustomElemFocused, hasCustomValue, commitIfCustom, typeAheadMatchedItem,
            setTypeAheadMatchedItem, fields, multiSelectable, inputElementRef, selectItem, enableGroupedCheckBox, handleGroupToggle] );

    const keyActionHandler: (e: KeyboardEvent<HTMLElement>) => void = useCallback(
        (e: KeyboardEvent<HTMLElement>) => {
            if (!isInteractive) {
                return;
            }
            if (e.altKey) {
                if (e.key === 'ArrowDown') {
                    togglePopup(e, true);
                    return;
                }
                if (e.key === 'ArrowUp') {
                    togglePopup(e, false);
                    e.preventDefault();
                    return;
                }
            }
            if (e.key === ' ' && !multiSelectable) {
                togglePopup(e, true);
                return;
            } else if (e.key === 'Enter' || e.key === ' ') {
                handleEnterOrSpace(e);
                return;
            } else if (e.key === 'Tab' || e.key === 'Escape') {
                if ((e.shiftKey && hasChip && (e.target as HTMLElement)?.dataset.index !== '0')) {
                    return;
                }
                if (e.key === 'Escape' && !isPopupOpen && !spanClickable) {
                    setTypeAheadMatchedItem(null);
                    setIsShowSelectAllFocused(false);
                    setIsCustomElemFocused(false);
                    keyBoardSelectionCallback('', {}, '', e, undefined, true);
                    e.preventDefault();
                    e.stopPropagation();
                    return;
                }
                setTypeAheadMatchedItem(null);
                togglePopup(e, false);
                if (e.key === 'Tab') {
                    setIsSpanFocused(false);
                    return;
                }
                e.preventDefault();
                e.stopPropagation();
                return;
            }
            const isPrintable: boolean = e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey;
            if (isPrintable && !filterable) {
                e.preventDefault();
                handleTypeAhead(e);
                return;
            }
            if (isNavKey(e.key)) {
                e.preventDefault();
                if ((!listData || listData.length === 0) && isRemoteData) {
                    fetchData(e);
                    return;
                }
                const logicalItems: ListItemData[] = getData();
                if (logicalItems) {
                    runNavigation(e, logicalItems, e.key);
                }
            }
        },
        [isInteractive, isPopupOpen, showPopup, hidePopup, setIsSpanFocused, listData, prefetchData, buildListItems,
            runNavigation, isRemoteData, currentItemData, togglePopup, getData, fetchData, typeAheadMatchedItem,
            setTypeAheadMatchedItem, handleCustomTypeAhead, multiSelectable, showSelectAll, handleSelectAll, isShowSelectAllFocused,
            setIsShowSelectAllFocused, isCustomElemFocused, hasCustomValue, commitIfCustom, computedDisabledItems, computedNonHiddenItems,
            handleEnterOrSpace]
    );
    return {
        keyActionHandler, handleCustomTypeAhead, typeAheadMatchedItem, setTypeAheadMatchedItem, isShowSelectAllFocused,
        isCustomElemFocused, setIsCustomElemFocused
    };
};
