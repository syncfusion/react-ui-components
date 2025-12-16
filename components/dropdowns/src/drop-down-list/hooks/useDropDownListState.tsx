import { useCallback, useEffect, useMemo, useState } from 'react';
import type * as React from 'react';
import type { DropDownListProps } from '../types';

/**
 * Specifies the properties used by the `useDropDownListState` hook to manage the state and behavior of the DropDownList component.
 *
 * @private
 */
interface UseDropDownListStateProps {
    value?: number | string | boolean | object | null;
    defaultValue?: number | string | boolean | object | null;
    open?: boolean;
    loading?: boolean;
    onChange?: DropDownListProps['onChange'];
}

/**
 * Represents the internal state structure used by the DropDownList component.
 *
 * @private
 */
interface DropDownListState {
    isPopupOpen: boolean;
    ariaExpanded: boolean;
    dropdownValue: number | string | boolean | object | null;
    textValue: string;
    isSpanFocused: boolean;
    isLoading: boolean;
    activeIndex: number | null;
    itemData: string | number | boolean | { [key: string]: unknown } | null;
    previousItemData: string | number | boolean | { [key: string]: unknown } | null;
    changeEvent: React.MouseEvent<Element> | React.KeyboardEvent<Element> | null;
}

/**
 * Defines the action methods used to update the internal state of the DropDownList component.
 *
 * @private
 */
interface DropDownListActions {
    setIsPopupOpen: (v: boolean) => void;
    setAriaExpanded: (v: boolean) => void;
    setDropdownValue: (v: number | string | boolean | object | null) => void;
    setTextValue: (v: string) => void;
    setIsSpanFocused: (v: boolean) => void;
    setIsLoading: (v: boolean) => void;
    setActiveIndex: (v: number | null) => void;
    setItemData: (v:  string | number | boolean | { [key: string]: unknown } | null) => void;
    setPreviousItemData: (v: string | number | boolean | { [key: string]: unknown } | null) => void;
    setChangeEvent: (v: React.MouseEvent<Element> | React.KeyboardEvent<Element> | null) => void;
    openPopup: () => void;
    closePopup: () => void;
}

type UseDropDownListStateReturn = [DropDownListState, DropDownListActions];

export const useDropDownListState: (props?: UseDropDownListStateProps) => UseDropDownListStateReturn
= (props: UseDropDownListStateProps = {}): UseDropDownListStateReturn => {
    const {
        value,
        defaultValue,
        open,
        loading,
        onChange
    } = props;

    const [isPopupOpen, setIsPopupOpen] = useState<boolean>(!!open);
    const [ariaExpanded, setAriaExpanded] = useState<boolean>(false);
    const [textValue, setTextValue] = useState<string>('');
    const [isSpanFocused, setIsSpanFocused] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(!!loading);
    const [activeIndex, setActiveIndex] = useState<number | null>(null);
    const [itemData, setItemData] = useState< string | number | boolean | { [key: string]: unknown } | null>(null);
    const [previousItemData, setPreviousItemData] =
        useState<string | number | boolean | { [key: string]: unknown } | null>(null);
    const [changeEvent, setChangeEvent] = useState<React.MouseEvent<Element> | React.KeyboardEvent<Element> | null>(null);

    const isOpenControlled: boolean = useMemo(() => open !== undefined, [open]);
    const isValueControlled: boolean = useMemo(() => value !== undefined && !!onChange, [value, onChange]);
    const initialValue: number | string | boolean | object | null = useMemo(() => {
        if (isValueControlled) { return value as number | string | boolean | object | null; }
        if (value !== undefined) { return value; }
        if (defaultValue !== undefined) { return defaultValue; }
        return null;
    }, [isValueControlled, value, defaultValue]);
    const [dropdownValue, setDropdownValue] = useState<number | string | boolean | object | null>(initialValue);

    useEffect(() => {
        if (isOpenControlled) {
            setIsPopupOpen(!!open);
        }
    }, [isOpenControlled, open]);

    useEffect(() => {
        setIsLoading(!!loading);
    }, [loading]);

    useEffect(() => {
        if (isValueControlled) {
            setDropdownValue(value as number | string | boolean | object | null);
        }
    }, [isValueControlled, value]);

    const openPopup: () => void = useCallback(() => {
        if (!isOpenControlled) {
            setIsPopupOpen(true);
        }
        setAriaExpanded(true);
    }, [isOpenControlled]);

    const closePopup: () => void = useCallback(() => {
        if (!isOpenControlled) {
            setIsPopupOpen(false);
        }
        setAriaExpanded(false);
    }, [isOpenControlled]);

    const state: DropDownListState = {
        isPopupOpen,
        ariaExpanded,
        dropdownValue,
        textValue,
        isSpanFocused,
        isLoading,
        activeIndex,
        itemData,
        previousItemData,
        changeEvent
    };

    const actions: DropDownListActions = {
        setIsPopupOpen: (v: boolean) => setIsPopupOpen(v),
        setAriaExpanded: (v: boolean) => setAriaExpanded(v),
        setDropdownValue: (v: number | string | boolean | object | null) => setDropdownValue(v),
        setTextValue: (v: string) => setTextValue(v),
        setIsSpanFocused: (v: boolean) => setIsSpanFocused(v),
        setIsLoading: (v: boolean) => setIsLoading(v),
        setActiveIndex: (v: number | null) => setActiveIndex(v),
        setItemData: (v:  string | number | boolean | {
            [key: string]: unknown;
        } | null) => setItemData(v),
        setPreviousItemData: (v: string | number | boolean | {
            [key: string]: unknown;
        } | null) => setPreviousItemData(v),
        setChangeEvent: (v: React.MouseEvent<Element> | React.KeyboardEvent<Element> | null) => setChangeEvent(v),
        openPopup,
        closePopup
    };

    return [state, actions];
};
