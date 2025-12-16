import * as React from 'react';
import { useCallback } from 'react';
import type { IDropDownBase } from '../../common/types';
import type { SelectEvent } from '../types';

/**
 * Specifies the properties used by the `useSelection` hook to manage the state and behavior of the DropDownList component.
 *
 * @private
 */
interface UseSelectionProps {
    onSelect?: (args: SelectEvent) => void;
    dataSource?: { [key: string]: Object }[]  | string[] | number[] | boolean[];
    dropdownbaseRef?: React.RefObject<IDropDownBase | null>;
    getFormattedValue?: (val: string) => string | number | boolean;
    setActiveIndex?: (i: number | null) => void;
    selectEventCallback?: (
        li: Element,
        e: React.MouseEvent<Element> | React.KeyboardEvent<Element> | null,
        selectedData?: string | number | boolean | { [key: string]: object },
        value?: string | number | boolean | null
    ) => void;
    setTextValue?: (v: string) => void;
    setDropdownValue?: (v: string | number | boolean) => void;
    hidePopup?: () => void;
}

/**
 * Specifies the return structure of the `useSelection` hook used in dropdown components.
 *
 * @private
 */
interface UseSelectionReturn {
    updateSelectedItem: (
        li: Element,
        e: React.MouseEvent<Element> | React.KeyboardEvent<Element> | null
    ) => void;
    setSelection: (
        li: Element,
        e: React.MouseEvent<Element> | React.KeyboardEvent<Element> | null
    ) => void;
    onItemClick: (e: React.MouseEvent<HTMLLIElement>) => void;
}

export const useSelection: (props: UseSelectionProps) => UseSelectionReturn = (props: UseSelectionProps) => {
    const {
        onSelect,
        dataSource,
        dropdownbaseRef,
        getFormattedValue,
        setActiveIndex,
        selectEventCallback,
        setTextValue,
        setDropdownValue,
        hidePopup
    } = props;

    const updateSelectedItem: (  li: Element, e: React.MouseEvent<Element, MouseEvent> | React.KeyboardEvent<Element> | null ) => void =
    useCallback( (li: Element, e: React.MouseEvent<Element> | React.KeyboardEvent<Element> | null) => {
        const rawDataValueAttr: string | null = (li as HTMLElement).dataset?.value ?? null;
        const value: string | number | boolean | null =
                getFormattedValue && rawDataValueAttr != null ? getFormattedValue(rawDataValueAttr) : null;
        const formattedValue: string | number | boolean | null = value as string | number | boolean;
        let selectedData: string | number | boolean | { [key: string]: object } | undefined;
        if (formattedValue != null) {
            const base: IDropDownBase | null | undefined = dropdownbaseRef?.current ?? undefined;
            const getDataByValue: unknown = base ? (base as unknown as IDropDownBase &
            { getDataByValue?: unknown }).getDataByValue : undefined;
            if (typeof getDataByValue === 'function') {
                selectedData = (getDataByValue as (v: string | number | boolean) =>
                { [key: string]: object } | string | number | boolean | undefined).call(base as IDropDownBase, formattedValue);
            } else {
                selectedData = undefined;
            }
        } else {
            selectedData = undefined;
        }

        if (setActiveIndex) {
            const base: IDropDownBase | null | undefined = dropdownbaseRef?.current ?? undefined;
            const getItems: (() => HTMLLIElement[]) | undefined = base ? (base as IDropDownBase).getListItems : undefined;
            if (typeof getItems === 'function') {
                const items: HTMLLIElement[] = getItems.call(base as IDropDownBase) || [];
                const idx: number = items.indexOf(li as HTMLLIElement);
                if (idx >= 0) {
                    setActiveIndex(idx);
                }
            }
        }

        const dataType: 'string' | 'number' | 'bigint' | 'boolean' | 'symbol' |
        'undefined' | 'object' | 'function' | undefined = Array.isArray(dataSource) && dataSource.length > 0 ? typeof dataSource[0] : undefined;
        let itemDataToPass: string | number | boolean | { [key: string]: object } | undefined | null;
        if (dataType === 'string' || dataType === 'number' || dataType === 'boolean') {
            itemDataToPass = formattedValue;
        } else {
            itemDataToPass = selectedData;
        }

        if (e && itemDataToPass && onSelect) {
            const eventArgs: SelectEvent = { event: e, itemData: itemDataToPass };
            onSelect(eventArgs);
        }

        selectEventCallback?.(li, e, selectedData, value as string | number | boolean | null);
    }, [dataSource, dropdownbaseRef, onSelect, getFormattedValue, setActiveIndex, selectEventCallback]);

    const setSelection: (li: Element, e: React.MouseEvent<Element, MouseEvent> | React.KeyboardEvent<Element> | null) => void =
    useCallback( (li: Element, e: React.MouseEvent<Element> | React.KeyboardEvent<Element> | null) => {
        const dataValue: string | null = (li as HTMLElement).dataset?.value ?? null;
        if (dataValue) {
            const formattedValue: string | number | boolean | [] | undefined = getFormattedValue?.(dataValue);
            const domText: string | undefined = (li as HTMLElement).textContent?.trim();
            let displayText: string = domText && domText.length ? domText : dataValue;
            if (!domText && dropdownbaseRef?.current && formattedValue !== undefined && formattedValue !== null) {
                const getTextByValue: unknown = dropdownbaseRef.current.getTextByValue;
                if (typeof getTextByValue === 'function') {
                    displayText = (getTextByValue as (v: string | number | boolean) => string)
                        .call(dropdownbaseRef.current, formattedValue as string | number | boolean);
                }
            }
            setTextValue?.(displayText);
            if (formattedValue !== undefined) {
                setDropdownValue?.(formattedValue);
            }
            updateSelectedItem(li as HTMLElement, e);
        }
    }, [getFormattedValue, updateSelectedItem, setTextValue, setDropdownValue, dropdownbaseRef]);

    const onItemClick: (e: React.MouseEvent<HTMLLIElement, MouseEvent>) => void = useCallback(
        (e: React.MouseEvent<HTMLLIElement>) => {
            const target: Element = e.target as Element;
            const li: HTMLLIElement | null = target.closest('.sf-list-item');
            if (li) {
                const dataValue: string | null = (li as HTMLElement).dataset?.value ?? null;
                if (dataValue) {
                    const formattedValue: string | number | boolean | undefined = getFormattedValue?.(dataValue);
                    const domText: string | undefined = (li as HTMLElement).textContent?.trim();
                    let displayText: string = domText && domText.length ? domText : dataValue;
                    if (!domText && dropdownbaseRef?.current && formattedValue !== undefined && formattedValue !== null) {
                        const getTextByValue: unknown = dropdownbaseRef.current.getTextByValue;
                        if (typeof getTextByValue === 'function') {
                            displayText = (getTextByValue as (v: string | number | boolean) => string)
                                .call(dropdownbaseRef.current, formattedValue as string | number | boolean);
                        }
                    }
                    setTextValue?.(displayText);
                    if (formattedValue !== undefined) {
                        setDropdownValue?.(formattedValue);
                    }
                    updateSelectedItem(li, e);
                }
                hidePopup?.();
            }
        },
        [hidePopup, getFormattedValue, updateSelectedItem, setTextValue, setDropdownValue, dropdownbaseRef]
    );

    return {updateSelectedItem, setSelection, onItemClick };
};
