import { useState, useRef, useMemo, RefObject } from 'react';
import { T, FieldSettingsModel, SortOrder, DropdownVirtualProps, PopupSettings, ScrollMode } from '../../drop-down-list/types';
import { CollisionType, IPopup } from '@syncfusion/react-popups';
import { ListItemData } from '../types';
import { DropdownState, DropdownActions, DropdownRefs, DropdownConfig, DropdownContextType, DropdownInternalProps } from '../context/context-types';
import { DataManager, Query } from '@syncfusion/react-data';
import { useDropdownData, UseDropdownDataProps, useDropdownFilter, UseDropdownFilterProps, useDropdownGroupedSelection, UseDropdownGroupedSelectionProps, useDropdownPopup, UseDropdownPopupProps, UseDropdownStateProps } from '.';
import { useDropdown, UseDropdownProps, useDropdownValidation, UseDropdownValidationProps, useDropdownSelectAll, UseDropdownSelectAllProps } from '.';
import { compareItemData, normalizeListData } from '../utils';

export const useDropdownState: (props: UseDropdownStateProps) => DropdownContextType = (props: UseDropdownStateProps):
DropdownContextType => {
    const {
        dataSource = [],
        fields,
        open,
        defaultOpen,
        loading,
        virtualization,
        locale,
        dir,
        popupSettings,
        sortOrder,
        query,
        filterable,
        filterType,
        maxSuggestions,
        ignoreAccent,
        ignoreCase,
        spanClickable,
        forceFilterOnOpen,
        maximumSelectionLength,
        hideSelectedItem,
        customValue,
        closeOnSelect,
        autofill,
        addTagOnBlur,
        openOnClick,
        disabled,
        readOnly,
        enableGroupedCheckBox,
        onCustomValueSelect,
        onChange,
        onOpen,
        onClose,
        multiSelectable,
        onScroll,
        onDataRequest,
        onError,
        onDataLoad,
        onFilter,
        debounceDelay,
        required,
        valid,
        validationMessage,
        onSelectAll,
        checkbox,
        showSelectAll,
        skipDisabledItems,
        mode,
        enableSelectionOrder
    } = props;

    const [isPopupOpen, setIsPopupOpen] = useState<boolean>(defaultOpen || !!open);
    const [text, setText] = useState<string>('');
    const [isSpanFocused, setIsSpanFocused] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(loading || false);
    const [isActionFailed, setIsActionFailed] = useState<boolean>(false);
    const [popupDimensions, setPopupDimensions] = useState<{ height: number; width: number }>({ height: 0, width: 0 });
    const [itemData, setItemData] = useState<T[] | null>(null);
    const [dropdownValue, setDropdownValue] = useState<T[] | null>(null);
    const [isPopupFilterLoading, setIsPopupFilterLoading] = useState<boolean>(false);
    const [popupListData, setPopupListData] = useState<T[]>([]);
    const [isRequesting, setIsRequesting] = useState<boolean>(false);
    const [isDataInitialized, setIsDataInitialized] = useState<boolean>(false);
    const [typedString, setTypedString] = useState<string>('');
    const inputElementRef: RefObject<HTMLInputElement | null> = useRef<HTMLInputElement>(null);
    const popupRef: RefObject<IPopup | null> = useRef<IPopup>(null);
    const dropdownRootRef: RefObject<HTMLSpanElement | null> = useRef<HTMLSpanElement>(null);
    const popupContentRef: RefObject<HTMLDivElement | null> = useRef<HTMLDivElement>(null);
    const remoteCacheRef: RefObject<T[] | null> = useRef<T[] | null>(null);
    const filterInputElementRef: RefObject<HTMLInputElement | null> = useRef<HTMLInputElement>(null);
    const listBaseKey: RefObject<number> = useRef<number>(0);
    const isFetchedRef: RefObject<boolean> = useRef<boolean>(false);
    const isRemoteData: boolean = useMemo(() => dataSource instanceof DataManager, [dataSource]);

    const actions: DropdownActions = useMemo(() => ({
        setText,
        setIsPopupOpen,
        setItemData: (v: T[] | null) => setItemData((prev: T[] | null) => {
            if (compareItemData(prev, v)) {
                return prev;
            }
            return v;
        }),
        setDropdownValue: (v: T[] | null) => setDropdownValue((prev: T[] | null) => {
            if (compareItemData(prev, v)) {
                return prev;
            }
            return v;
        }),
        setIsLoading,
        setIsSpanFocused,
        setPopupDimensions,
        setPopupListData,
        setIsRequesting,
        setIsDataInitialized,
        setIsActionFailed,
        setTypedString,
        setIsPopupFilterLoading
    }), [setText, setIsPopupOpen, setItemData, setDropdownValue, setIsLoading, setIsSpanFocused, setPopupDimensions, setPopupListData,
        setIsRequesting, setIsDataInitialized, setIsActionFailed, setTypedString, setIsPopupFilterLoading]);

    const refs: DropdownRefs = useMemo(() => ({
        inputElementRef,
        popupRef,
        dropdownRootRef,
        popupContentRef,
        remoteCacheRef,
        filterInputElementRef,
        listBaseKey,
        isFetchedRef
    }), [inputElementRef, popupRef, dropdownRootRef, popupContentRef, remoteCacheRef, filterInputElementRef, listBaseKey, isFetchedRef]);

    const config: DropdownConfig = useMemo(() => ({
        ...props,
        dataSource,
        fields,
        open,
        defaultOpen,
        loading,
        virtualization,
        locale,
        dir,
        popupSettings,
        sortOrder,
        query,
        filterable,
        filterType,
        maxSuggestions,
        ignoreAccent,
        ignoreCase,
        spanClickable,
        forceFilterOnOpen,
        maximumSelectionLength,
        hideSelectedItem,
        customValue,
        closeOnSelect,
        autofill,
        addTagOnBlur,
        openOnClick,
        disabled,
        readOnly,
        enableGroupedCheckBox,
        onCustomValueSelect,
        onChange,
        onOpen,
        onClose,
        multiSelectable,
        onScroll,
        onDataRequest,
        onError,
        onDataLoad,
        onFilter,
        debounceDelay,
        required,
        valid,
        validationMessage,
        onSelectAll,
        checkbox,
        showSelectAll,
        skipDisabledItems,
        mode,
        enableSelectionOrder
    }), [dataSource, fields, open, defaultOpen, loading, virtualization, locale, dir, popupSettings, sortOrder, query, filterable,
        filterType, maxSuggestions, ignoreAccent, ignoreCase, spanClickable, forceFilterOnOpen, maximumSelectionLength,
        hideSelectedItem, customValue, closeOnSelect, autofill, addTagOnBlur, openOnClick, disabled, readOnly, onCustomValueSelect,
        onChange, onOpen, onClose, multiSelectable, onScroll, onDataRequest, onError, onDataLoad, onFilter, debounceDelay, required,
        valid, validationMessage, onSelectAll, checkbox, showSelectAll, skipDisabledItems, mode, enableSelectionOrder,
        enableGroupedCheckBox, props]);

    const resolvedFields: FieldSettingsModel = useMemo(() => {
        return { text: fields?.text, value: fields?.value ?? 'value', disabled: fields?.disabled ?? 'disabled', groupBy: fields?.groupBy, htmlAttributes: fields?.htmlAttributes };
    }, [fields?.text, fields?.value, fields?.groupBy, fields?.disabled, fields?.htmlAttributes]);

    const listData: ListItemData[] = useMemo(() => {
        return normalizeListData(dataSource as T[], remoteCacheRef.current, resolvedFields, sortOrder as SortOrder, query ?? new Query());
    }, [remoteCacheRef.current, dataSource, resolvedFields, sortOrder, query]);

    const combinedPopupSettings: PopupSettings = useMemo(() => {
        return {
            ...{
                position: { X: 'left', Y: 'bottom' }, collision: dir === 'rtl' ?
                    { X: CollisionType.Fit, Y: CollisionType.Flip } : { X: CollisionType.Flip, Y: CollisionType.Flip },
                autoReposition: true, width: '100%', height: '300px'
            }, ...popupSettings
        };
    }, [popupSettings, dir]);

    const resolvedVirtualization: DropdownVirtualProps | undefined = useMemo(() => {
        if (!virtualization) { return undefined; }
        return { ...virtualization, scrollMode: virtualization.scrollMode ?? ScrollMode.FetchAll };
    }, [virtualization]);

    const state: DropdownState = useMemo(() => ({
        isPopupOpen,
        text,
        isSpanFocused,
        isLoading,
        isActionFailed,
        popupDimensions,
        itemData,
        dropdownValue,
        popupListData,
        isRequesting,
        isDataInitialized,
        typedString,
        listData,
        isPopupFilterLoading
    }), [isPopupOpen, text, isSpanFocused, isLoading, isActionFailed, popupDimensions, itemData, dropdownValue, popupListData,
        isRequesting, isDataInitialized, typedString, listData, isPopupFilterLoading]);

    const dropdownDataProps: UseDropdownDataProps = useMemo(() => ({
        state: { isDataInitialized, itemData, isRequesting, popupListData, isPopupOpen },
        actions: { setIsDataInitialized, setPopupListData, setIsRequesting, setIsActionFailed, setIsLoading, setIsPopupFilterLoading },
        refs: { remoteCacheRef, filterInputElementRef, listBaseKey, popupContentRef, inputElementRef, isFetchedRef },
        config: {
            filterable, sortOrder: sortOrder ?? SortOrder.None, query, virtualization: resolvedVirtualization, maxSuggestions,
            filterType, dataSource, ignoreAccent, ignoreCase, spanClickable, forceFilterOnOpen, maximumSelectionLength, hideSelectedItem,
            multiSelectable, checkbox, enableSelectionOrder, onScroll, onDataRequest, onError, onDataLoad
        },
        internalProps: { fields: resolvedFields, isRemoteData }

    }), [isDataInitialized, itemData, isRequesting, popupListData, isPopupOpen, sortOrder, query, resolvedVirtualization,
        dataSource, resolvedFields, isRemoteData, filterable, filterType, maxSuggestions, ignoreAccent, ignoreCase,
        spanClickable, forceFilterOnOpen, maximumSelectionLength, hideSelectedItem, isFetchedRef, multiSelectable,
        checkbox, enableSelectionOrder, onScroll, onDataRequest, onError, onDataLoad]);

    const { formListData, fetchRemoteVirtualData, handleInternalScrollRequest, getDataByValue, getFormattedValue, getTextByValue, getQuery,
        getScrollContainer, computedDisabledItems, computedNonHiddenItems, reorderSelectedItemCount } = useDropdownData(dropdownDataProps);

    const dropdownFilterProps: UseDropdownFilterProps = useMemo(() => ({
        actions: { setTypedString },
        config: { fields, filterable, ignoreAccent, ignoreCase, filterType, dataSource, onFilter, debounceDelay, query, spanClickable },
        internalProps: { formListData },
        refs: { inputElementRef, filterInputElementRef }
    }), [setTypedString, fields, filterable, ignoreAccent, ignoreCase, filterType, dataSource, onFilter, debounceDelay, query,
        spanClickable, formListData, inputElementRef, filterInputElementRef]);

    const { handleInputChange, filter, clearText } = useDropdownFilter(dropdownFilterProps);

    const dropdownPopupProps: UseDropdownPopupProps = useMemo(() => ({
        state: { isPopupOpen },
        actions: { setIsPopupOpen, setIsSpanFocused },
        refs: { dropdownRootRef, inputElementRef, popupRef },
        config: { onOpen, onClose, multiSelectable, open, combinedPopupSettings }
    }), [isPopupOpen, setIsPopupOpen, setIsSpanFocused, dropdownRootRef, inputElementRef, popupRef, onOpen, onClose, multiSelectable,
        open, combinedPopupSettings]);

    const { showPopup, hidePopup, setPopupHeight, setPopupWidth } = useDropdownPopup(dropdownPopupProps);

    const dropdownSelectAllProps: UseDropdownSelectAllProps = useMemo(() => ({
        state: { listData, itemData },
        actions: { setItemData, setDropdownValue },
        config: { fields, onSelectAll, maximumSelectionLength, multiSelectable, checkbox, showSelectAll }
    }), [listData, itemData, setItemData, setDropdownValue, fields, onSelectAll, maximumSelectionLength, multiSelectable, checkbox,
        showSelectAll]);

    const { isAllSelected, isIndeterminate, handleSelectAll } = useDropdownSelectAll(dropdownSelectAllProps);

    const groupCheckboxProps: UseDropdownGroupedSelectionProps = useMemo(() => ({
        config: { skipDisabledItems, maximumSelectionLength },
        state: { dropdownValue, itemData, listData },
        internalProps: { resolvedFields }

    }), [skipDisabledItems, maximumSelectionLength, dropdownValue, itemData, listData, resolvedFields]);

    const { groupStates, getHeaderGroupKey, toggleGroupByKey } = useDropdownGroupedSelection(groupCheckboxProps);

    const dropdownProps: UseDropdownProps = useMemo(() => ({
        state: { itemData, listData, textValue: text, dropdownValue, isPopupOpen, popupListData, isLoading },
        actions: { setTextValue: setText, setDropdownValue, setItemData, setIsLoading, setIsSpanFocused },
        refs: { inputElementRef, remoteCacheRef, isFetchedRef },
        config: {
            customValue, multiSelectable, maximumSelectionLength, closeOnSelect, autofill, spanClickable, addTagOnBlur, dataSource,
            query, filterable, openOnClick, disabled, loading, readOnly, onCustomValueSelect, onChange, onDataRequest, onDataLoad, onError,
            skipDisabledItems, onScroll, virtualization, showSelectAll, mode, hideSelectedItem, enableGroupedCheckBox, ignoreCase
        },
        internalProps: {
            resolvedFields, hidePopup, showPopup, isRemoteData, clearText, getScrollContainer, computedDisabledItems,
            computedNonHiddenItems, handleSelectAll, getHeaderGroupKey, toggleGroupByKey
        }

    }), [itemData, listData, text, dropdownValue, isPopupOpen, popupListData, isLoading, setText, setDropdownValue, setItemData,
        setIsLoading, setIsSpanFocused, inputElementRef, remoteCacheRef, isFetchedRef, customValue, multiSelectable,
        maximumSelectionLength, closeOnSelect, autofill, spanClickable, addTagOnBlur, dataSource, query, filterable, openOnClick, disabled,
        loading, readOnly, onCustomValueSelect, onChange, onDataRequest, onDataLoad, onError, resolvedFields, hidePopup, showPopup,
        isRemoteData, computedNonHiddenItems, enableGroupedCheckBox, getHeaderGroupKey, toggleGroupByKey, ignoreCase]);

    const { commitIfCustom, prefetchData, onKeyHandler, dropDownClick, dropdownIconClick, keyActionHandler, handleCustomTypeAhead,
        typeAheadMatchedItem, isShowSelectAllFocused, setIsCustomElemFocused,
        setTypeAheadMatchedItem, isCustomElemFocused } = useDropdown(dropdownProps);

    const dropdownValidationProps: UseDropdownValidationProps = useMemo(() => ({
        state: { dropdownValue },
        config: { required, valid, validationMessage },
        refs: { inputElementRef }
    }), [dropdownValue, required, valid, validationMessage, inputElementRef]);

    const { isInputValid } = useDropdownValidation(dropdownValidationProps);

    const uiLoading: boolean = useMemo(() => (((Boolean(loading) && !isPopupOpen) || isLoading)), [isLoading, isPopupOpen, loading]);

    const internalProps: DropdownInternalProps = useMemo(() => ({
        resolvedFields,
        combinedPopupSettings,
        isInputValid,
        uiLoading,
        groupStates,
        getHeaderGroupKey,
        toggleGroupByKey,
        formListData,
        fetchRemoteVirtualData,
        handleInternalScrollRequest,
        getDataByValue,
        getFormattedValue,
        getTextByValue,
        getQuery,
        getScrollContainer,
        handleInputChange,
        filter,
        clearText,
        showPopup,
        hidePopup,
        setPopupHeight,
        setPopupWidth,
        commitIfCustom,
        computedDisabledItems,
        computedNonHiddenItems,
        reorderSelectedItemCount,
        isAllSelected,
        isIndeterminate,
        handleSelectAll,
        prefetchData,
        keyActionHandler,
        handleCustomTypeAhead,
        typeAheadMatchedItem,
        isShowSelectAllFocused,
        setIsCustomElemFocused,
        setTypeAheadMatchedItem,
        isCustomElemFocused,
        onKeyHandler,
        resolvedVirtualization,
        isRemoteData,
        dropDownClick,
        dropdownIconClick
    }), [resolvedFields, combinedPopupSettings, isInputValid, uiLoading, formListData, fetchRemoteVirtualData, handleInternalScrollRequest,
        getDataByValue, getFormattedValue, getTextByValue, getQuery, getScrollContainer, handleInputChange, filter, clearText, showPopup,
        hidePopup, setPopupHeight, setPopupWidth, commitIfCustom, computedDisabledItems, computedNonHiddenItems, isAllSelected,
        isIndeterminate, handleSelectAll, prefetchData, keyActionHandler, handleCustomTypeAhead, typeAheadMatchedItem,
        isShowSelectAllFocused, setIsCustomElemFocused, setTypeAheadMatchedItem, isCustomElemFocused, onKeyHandler, resolvedVirtualization,
        isRemoteData, dropDownClick, dropdownIconClick, reorderSelectedItemCount, groupStates, getHeaderGroupKey, toggleGroupByKey]);

    return {
        state,
        actions,
        refs,
        config,
        internalProps
    };
};
