import * as React from 'react';
import { useCallback } from 'react';
import { IDropDownBase } from '../../common/types';
import { getValue } from '@syncfusion/react-base';
import { ChangeEvent, FieldSettingsModel } from '../types';
import { flushSync } from 'react-dom';
import { DataManager } from '@syncfusion/react-data';

/**
 * Specifies the list item data before opening the popup in dropdown list component.
 *
 * @private
 */
export interface ListItemData {
    item: string | number | { [key: string]: unknown };
    isDisabled: boolean;
    isHeader?: boolean;
}

/**
 * Specifies the properties used by the `useKeyboardNavigation` hook to manage the state and behavior of the DropDownList component.
 *
 * @private
 */
interface KeyboardParams {
    disabled: boolean;
    readOnly: boolean;
    isPopupOpen: boolean;
    skipDisabledItems: boolean;
    activeIndex: number | null;
    dataSource?: { [key: string]: unknown; }[] | DataManager | string[] | number[] | boolean[]
    dataSourceListItems: ListItemData[];
    fields?: FieldSettingsModel;
    onChange?: (args: ChangeEvent) => void;
    setTextValue?: (v: string) => void;
    setActiveIndex: (i: number | null) => void;
    dropdownbaseRef: React.RefObject<IDropDownBase | null>;
    setSelection: (li: Element, e: React.MouseEvent<Element> | React.KeyboardEvent<Element>) => void;
    showPopup: (e?: React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement> | Event) => void;
    hidePopup: (e?: React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement> | Event) => void;
    setIsSpanFocused: (v: boolean) => void;
    dropDownClickWithRemote?: (baseDropDownClick: () => void) => void;
    baseDropDownClick?: (e?: React.MouseEvent | React.KeyboardEvent | Event) => void;
    setDropdownValue?: (v: number | string | boolean | object | null) => void;
    prefetchData?: () => Promise<(string | number | boolean | { [key: string]: unknown })[] | null>;
    currentItemData?: string | number | boolean | { [key: string]: unknown } | null;
    setItemData?: (v:  string | number | boolean | { [key: string]: unknown } | null) => void;
}

/**
 * Specifies the return structure of the `useKeyboardNavigation` hook used in dropdown components.
 *
 * @private
 */
interface KeyboardNavigationReturn {
    keyActionHandler: (e: React.KeyboardEvent<HTMLElement>) => void;
}

export const useKeyboardNavigation: (params: KeyboardParams) => KeyboardNavigationReturn =
(params: KeyboardParams): KeyboardNavigationReturn => {
    const {
        disabled,
        readOnly,
        isPopupOpen,
        skipDisabledItems,
        activeIndex,
        dataSource,
        dataSourceListItems,
        fields,
        onChange,
        setTextValue,
        setActiveIndex,
        dropdownbaseRef,
        setSelection,
        showPopup,
        hidePopup,
        setIsSpanFocused,
        dropDownClickWithRemote,
        baseDropDownClick,
        setDropdownValue,
        prefetchData,
        currentItemData,
        setItemData
    } = params;

    const buildListItems: (raw: (string | number | boolean | { [key: string]: unknown; })[]) => ListItemData[] =
        useCallback((raw: (string | number | boolean | { [key: string]: unknown; })[]) => {
            return (raw as (string | number | { [key: string]: unknown })[]).map(
                (item: string | number | { [key: string]: unknown }) => {
                    const isDisabled: boolean | '' | undefined = fields?.disabled && typeof item === 'object' && getValue(fields.disabled, item) === true;
                    const isHeader: boolean = typeof item === 'object' && !!getValue('isHeader', item);
                    return { item, isDisabled: Boolean(isDisabled), isHeader };
                }
            );
        }, [fields?.disabled]);

    const isItemDisabled: (item: ListItemData) => boolean =
        useCallback((item: ListItemData) => {
            if (item?.isHeader) { return true; }
            return Boolean(item?.isDisabled);
        }, []);

    const scrollToView: (targetItem: HTMLLIElement) => void = useCallback((targetItem: HTMLLIElement) => {
        const parent: Element | null = targetItem.closest('.sf-list-parent');
        const stickyHeader: HTMLElement = parent?.querySelector('.sf-list-group-item') as HTMLElement;

        if (parent && stickyHeader) {
            const stickyHeight: number = stickyHeader.offsetHeight;
            const itemTop: number = targetItem.offsetTop;
            if (itemTop < parent.scrollTop + stickyHeight) {
                parent.scrollTop = itemTop - stickyHeight;
            } else {
                targetItem.scrollIntoView({ behavior: 'auto', block: 'nearest' });
            }
        } else {
            targetItem.scrollIntoView({ behavior: 'auto', block: 'nearest' });
        }
    }, [skipDisabledItems, isItemDisabled]);

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
            return startIndex;
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
                return items.length - 1;
            } else {
                for (let i: number = 0; i < items.length; i++) {
                    if (!isItemDisabled(items[i as number])) {
                        return i;
                    }
                }
                return 0;
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
            return targetIndex;
        },
        [skipDisabledItems, isItemDisabled]
    );

    const getTextValueField: (item: string | number | boolean | { [key: string]: unknown; }, type: string) => string | number | boolean  =
    (item: string | number | boolean | { [key: string]: unknown; }, type: string): string | number | boolean  => {
        let valueField: string;
        if (type === 'value') {
            valueField = fields?.value ?? 'value';
        } else {
            valueField = fields?.text ?? 'text';
        }
        if (typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean') {
            return item;
        } else if (typeof item === 'object' && item !== null) {
            return getValue(valueField, item);
        } else {
            return '';
        }
    };

    const getItemText: (li: ListItemData) => string = (li: ListItemData) => String(getTextValueField(li.item, 'text') ?? '');

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

    const triggerOnChangeEvent: (targetItem: ListItemData, e: React.KeyboardEvent<HTMLElement>, prevItem?: ListItemData) => void =
        (targetItem: ListItemData, e: React.KeyboardEvent<HTMLElement>, prevItem?: ListItemData) => {
            const nextValue: string | number | boolean = getTextValueField(targetItem.item, 'value');
            setTextValue?.(String(getTextValueField(targetItem.item, 'text')));
            if (nextValue !== undefined) {
                setDropdownValue?.(nextValue);
                setItemData?.(targetItem.item);
            }
            if (onChange && nextValue !== undefined) {
                onChange({
                    event: e as React.KeyboardEvent<Element> | React.MouseEvent<Element, MouseEvent>,
                    previousItemData: prevItem?.item as string | number | boolean | {[key: string]: unknown; },
                    value: nextValue,
                    itemData: targetItem.item
                });
            }
        };

    const handleTypeAhead: (e: React.KeyboardEvent<HTMLElement>) => void = useCallback((e: React.KeyboardEvent<HTMLElement>) => {

        const char: string = e.key.toLowerCase();

        const runOnItems: (items: ListItemData[], openState: boolean) => void = (items: ListItemData[], openState: boolean) => {
            const logical: ListItemData[] = items.filter((it: ListItemData) => !it.isHeader);
            if (logical.length === 0) { return; }
            const currIdx: number = (openState ? (activeIndex ?? -1) : (() => {
                const currValue: string | number | boolean | null = typeof currentItemData === 'object' && currentItemData !== null
                    ? (getValue(fields?.value as string, currentItemData) as string | number | boolean | null)
                    : (currentItemData as string | number | boolean | null);
                return logical.findIndex((li: ListItemData) => String(getTextValueField(li.item, 'value')) === String(currValue ?? ''));
            })());
            const matchIdx: number = findNextByChar(logical, char, currIdx);
            if (matchIdx === -1) { return; }
            if (openState) {
                const listEls: HTMLLIElement[] = dropdownbaseRef?.current?.getListItems() as HTMLLIElement[];
                if (!listEls || listEls.length === 0) { return; }
                setActiveIndex(matchIdx);
                const targetEl: HTMLLIElement | undefined = listEls[matchIdx as number];
                if (targetEl && (!skipDisabledItems || !targetEl.matches('[aria-disabled="true"], .sf-disabled'))) {
                    setSelection(targetEl, e);
                    scrollToView(targetEl);
                }
            } else {
                setActiveIndex(matchIdx);
                const prev: ListItemData | undefined = (currIdx > -1) ? logical[currIdx as number] : undefined;
                triggerOnChangeEvent(logical[matchIdx as number], e, prev);
            }
        };

        if (!isPopupOpen) {
            if (dataSourceListItems && dataSourceListItems.length > 0) {
                runOnItems(dataSourceListItems, false);
                return;
            }
            if (dataSource && !(dataSource instanceof DataManager) && (dataSource as unknown[]).length > 0) {
                runOnItems(buildListItems(dataSource as (string | number | boolean | { [key: string]: unknown })[]), false);
                return;
            }
            if (prefetchData) {
                prefetchData().then((fetched: (string | number | boolean | { [key: string]: unknown; })[] | null) => {
                    if (!fetched || fetched.length === 0) { return; }
                    const tempItems: ListItemData[] = buildListItems(fetched);
                    flushSync(() => runOnItems(tempItems, false));
                });
            }
            return;
        }

        const filteredData: (string | number | boolean | { [key: string]: unknown })[] | undefined =
            dropdownbaseRef.current?.getFilteredListData?.();
        const logicalItems: ListItemData[] | null = Array.isArray(filteredData) ? buildListItems(filteredData) : null;
        if (logicalItems) {
            runOnItems(logicalItems, true);
        }
    }, [activeIndex, isPopupOpen, dataSource, dataSourceListItems, prefetchData, buildListItems, dropdownbaseRef,
        setActiveIndex, setSelection, scrollToView, skipDisabledItems, triggerOnChangeEvent, currentItemData, fields]);

    const isNavKey: (key: string) => key is 'ArrowDown' | 'ArrowUp' | 'PageUp' | 'PageDown' |
    'Home' | 'End' = (key: string) => key === 'ArrowDown' || key === 'ArrowUp' || key === 'PageUp' || key === 'PageDown' || key === 'Home' || key === 'End';

    const computeNextIndex: (key: string, items: ListItemData[], currentIndex: number) => number =
    useCallback(( key: string, items: ListItemData[], currentIndex: number) => {
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
    }, [findNextEnabledItem, findNearestEnabledItem, findEdgeEnabledItem]);

    const runNavigationClosed: (e: React.KeyboardEvent<HTMLElement>, items: ListItemData[], key: string) => void = useCallback(
        (e: React.KeyboardEvent<HTMLElement>, items: ListItemData[], key: string) => {
            const logical: ListItemData[] = (items || []).filter((it: ListItemData) => !it.isHeader);
            if (logical.length === 0) { return; }
            const currValue: string | number | boolean | null = typeof currentItemData === 'object' && currentItemData !== null
                ? (getValue(fields?.value ?? 'value', currentItemData) as string | number | boolean | null)
                : (currentItemData as string | number | boolean | null);
            const currIndexFromItem: number = logical.findIndex((li: ListItemData) => String(getTextValueField(li.item, 'value')) === String(currValue ?? ''));
            const curr: number = currIndexFromItem !== -1 ? currIndexFromItem : (activeIndex ?? -1);
            const next: number = computeNextIndex(key, logical, curr);
            if (next !== curr && next >= 0 && next < logical.length) {
                setActiveIndex(next);
                const prev: ListItemData | undefined = curr > -1 ? logical[curr as number] : undefined;
                triggerOnChangeEvent(logical[next as number], e, prev);
            }
        }, [activeIndex, setActiveIndex, computeNextIndex, triggerOnChangeEvent, currentItemData, fields]
    );

    const runNavigationOpen: (e: React.KeyboardEvent<HTMLElement>, dataItems: ListItemData[], key: string) => void = useCallback(
        (e: React.KeyboardEvent<HTMLElement>, dataItems: ListItemData[], key: string) => {
            const listItems: HTMLLIElement[] = dropdownbaseRef?.current?.getListItems() as HTMLLIElement[];
            if (!listItems || listItems.length === 0) { return; }
            const logical: ListItemData[] = (dataItems || []).filter((it: ListItemData) => !it.isHeader);
            if (logical.length === 0) { return; }
            const currValue: string | number | boolean | null = typeof currentItemData === 'object' && currentItemData !== null
                ? (getValue(fields?.value ?? 'value', currentItemData) as string | number | boolean | null)
                : (currentItemData as string | number | boolean | null);
            const currIndexFromItem: number = logical.findIndex((li: ListItemData) => String(getTextValueField(li.item, 'value')) === String(currValue ?? ''));
            const curr: number = currIndexFromItem !== -1 ? currIndexFromItem : currentItemData ? currIndexFromItem : (activeIndex ?? -1);
            const next: number = computeNextIndex(key, logical, curr);
            if (next >= 0 && next < listItems.length) {
                setActiveIndex(next);
                const targetEl: HTMLLIElement | undefined = listItems[next as number];
                if (targetEl && (!skipDisabledItems || !targetEl.matches('[aria-disabled="true"], .sf-disabled'))) {
                    setSelection(targetEl, e);
                    scrollToView(targetEl);
                }
            }
        }, [dropdownbaseRef, activeIndex, setActiveIndex, computeNextIndex, setSelection,
            scrollToView, skipDisabledItems, currentItemData, fields]
    );

    const keyActionHandler: (e: React.KeyboardEvent<HTMLElement>) => void = useCallback(
        (e: React.KeyboardEvent<HTMLElement>) => {

            if (disabled || readOnly) {
                return;
            }
            if (e.altKey) {
                if (e.key === 'ArrowDown') {
                    showPopup(e);
                    e.preventDefault();
                    return;
                }
                if (e.key === 'ArrowUp') {
                    hidePopup(e);
                    e.preventDefault();
                    return;
                }
            }
            if (e.key === ' ') {
                showPopup(e);
                setIsSpanFocused(true);
                e.preventDefault();
                return;
            } else if (e.key === 'Enter') {
                if (isPopupOpen) {
                    const listItems: HTMLLIElement[] | undefined = dropdownbaseRef.current?.getListItems();
                    const currValue: string | number | boolean | null = typeof currentItemData === 'object' && currentItemData !== null
                        ? (getValue(fields?.value ?? 'value', currentItemData) as string | number | boolean | null)
                        : (currentItemData as string | number | boolean | null);
                    const activeItem: HTMLElement | undefined = listItems?.find((item: HTMLElement) => item.getAttribute('data-value') === String(currValue));

                    if (activeItem && listItems && listItems.length > 0 && listItems[0].classList.contains('sf-item-focus')) {
                        setSelection(listItems[0], e);
                    } else if (activeItem) {
                        setSelection(activeItem, e);
                    }
                    hidePopup();
                    e.preventDefault();
                    return;
                }
                if (!isPopupOpen) {
                    if (dropDownClickWithRemote && baseDropDownClick) {
                        dropDownClickWithRemote(() => {
                            baseDropDownClick(e);
                        });
                    } else {
                        showPopup(e);
                        setIsSpanFocused(true);
                    }
                    e.preventDefault();
                    return;
                }

            } else if (e.key === 'Tab' || e.key === 'Escape') {
                hidePopup(e);
                if (e.key === 'Tab') {
                    setIsSpanFocused(false);
                    return;
                }
                e.preventDefault();
                e.stopPropagation();
                return;
            }

            const isPrintable: boolean = e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey;
            if (isPrintable && !(e.target as HTMLElement)?.classList?.contains('sf-input-filter')) {
                e.preventDefault();
                handleTypeAhead(e);
                return;
            }

            const isNavigation: boolean = isNavKey(e.key);
            const listItems: HTMLLIElement[] = dropdownbaseRef?.current?.getListItems() as HTMLLIElement[];
            const isPopupClosed: boolean = !dropdownbaseRef.current;
            if (isPopupClosed && isNavigation && (!dataSourceListItems || dataSourceListItems.length === 0) && prefetchData) {
                e.preventDefault();
                if (dataSource && !(dataSource instanceof DataManager) && (dataSource as unknown[]).length > 0) {
                    runNavigationClosed(e, buildListItems(dataSource as (string|number|boolean|{[key: string]: unknown})[]), e.key);
                    return;
                }
                prefetchData().then((fetched: (string | number | boolean | {[key: string]: unknown; })[] | null) => {
                    if (!fetched || fetched.length === 0) {
                        return;
                    }
                    const tempItems: ListItemData[] = buildListItems(fetched);
                    flushSync(() => {
                        runNavigationClosed(e, tempItems, e.key);
                    });
                });
                return;
            }

            if (!isPopupClosed && isNavigation) {
                e.preventDefault();
                const filteredData: (string | number | boolean | { [key: string]: unknown })[] | undefined =
                dropdownbaseRef.current?.getFilteredListData?.();
                const logicalItems: ListItemData[] | null = Array.isArray(filteredData) ? buildListItems(filteredData) : null;
                if (logicalItems) {
                    runNavigationOpen(e, logicalItems, e.key);
                    return;
                }
            }

            if (isPopupClosed) {
                if (!dataSourceListItems || dataSourceListItems.length === 0) { return; }
                e.preventDefault();
                runNavigationClosed(e, dataSourceListItems, e.key);
            } else {
                if (!listItems || listItems.length === 0) { return; }
                e.preventDefault();
                const filteredData: (string | number | boolean | { [key: string]: unknown })[] | undefined =
                    dropdownbaseRef.current?.getFilteredListData?.();
                const logicalItems: ListItemData[] | null = Array.isArray(filteredData) ? buildListItems(filteredData) : null;
                if (logicalItems) {
                    runNavigationOpen(e, logicalItems, e.key);
                }
            }
        },
        [ disabled, readOnly, isPopupOpen, dropdownbaseRef, showPopup, hidePopup, setIsSpanFocused, setSelection, dataSourceListItems,
            prefetchData, buildListItems, runNavigationClosed, runNavigationOpen, dropDownClickWithRemote,
            baseDropDownClick, activeIndex, dataSource, currentItemData ]
    );

    return { keyActionHandler };
};
