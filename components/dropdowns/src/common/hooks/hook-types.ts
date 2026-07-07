
import { Dispatch, RefObject, SetStateAction, type KeyboardEvent, type FocusEvent, type MouseEvent, type SyntheticEvent, type ChangeEvent as ReactChangeEvent } from 'react';
import { ChangeEvent, DataRequestEvent, DropdownVirtualProps, FieldSettingsModel, FilterEvent, PopupEvent, PopupSettings, ScrollEvent, SortOrder, T } from '../../drop-down-list/types';
import { ListItemData } from '../types';
import { DataManager, Query } from '@syncfusion/react-data';
import { IPopup } from '@syncfusion/react-popups';
import { IDropdownProps } from '../dropdown';
import { DisplayMode } from '../../multi-select/types';

/**
 * Specifies the return structure of the `useDropdown` hook.
 *
 * @private
 */
export interface UseDropdownReturn {
    commitIfCustom: (evt?: KeyboardEvent<HTMLElement> | FocusEvent<HTMLElement> | MouseEvent<Element>,
        allowCustomVal?: boolean) => void;
    prefetchData: () => Promise<T[] | null>;
    onKeyHandler: (e: KeyboardEvent<HTMLSpanElement>) => void;
    dropdownIconClick: (e: MouseEvent<HTMLSpanElement>) => void;
    dropDownClick: (e: MouseEvent<HTMLSpanElement>) => void;
    keyActionHandler: (e: KeyboardEvent<HTMLElement>) => void;
    handleCustomTypeAhead: (text: string) => string | null;
    typeAheadMatchedItem: ListItemData | null;
    isShowSelectAllFocused: boolean;
    isCustomElemFocused: boolean
    setTypeAheadMatchedItem: Dispatch<SetStateAction<ListItemData | null>>
    setIsCustomElemFocused: Dispatch<SetStateAction<boolean>>
}

/**
 * Specifies the props passed to the `useDropdown` hook.
 *
 * @private
 */
export interface UseDropdownProps {
    state: {
        itemData: T[] | null;
        listData: ListItemData[];
        textValue: string;
        dropdownValue: T[] | null;
        isPopupOpen: boolean;
        popupListData: T[];
        isLoading: boolean;
    };
    actions: {
        setTextValue: (value: string) => void;
        setDropdownValue: (value: T[] | null) => void;
        setItemData: (value: T[] | null) => void;
        setIsLoading: (value: boolean) => void;
        setIsSpanFocused: (value: boolean) => void;
    };
    refs: {
        inputElementRef: RefObject<HTMLInputElement | null>;
        remoteCacheRef: RefObject<T[] | null>;
        isFetchedRef: RefObject<boolean>;
    };
    config: {
        customValue?: boolean;
        multiSelectable?: boolean;
        maximumSelectionLength?: number;
        closeOnSelect?: boolean;
        autofill?: boolean;
        spanClickable?: boolean;
        addTagOnBlur?: boolean;
        dataSource: T[] | DataManager;
        query?: Query;
        filterable?: boolean;
        openOnClick?: boolean;
        disabled?: boolean;
        loading?: boolean;
        readOnly?: boolean;
        onCustomValueSelect?: (value: string) => void;
        onChange?: (e: ChangeEvent) => void;
        onDataRequest?: (e: { data: DataManager; query: Query }) => void;
        onDataLoad?: (e: { data: T[] }) => void;
        onError?: (e: Error) => void;
        skipDisabledItems?: boolean;
        onScroll?: (e: { originalEvent: Event; startIndex: number; count: number }) => void;
        virtualization?: DropdownVirtualProps;
        showSelectAll?: boolean;
        mode?: DisplayMode;
        hideSelectedItem?: boolean;
        enableGroupedCheckBox?: boolean;
        ignoreCase?: boolean;
    };
    internalProps: {
        resolvedFields: FieldSettingsModel;
        showPopup: (e?: MouseEvent<HTMLElement> | KeyboardEvent<HTMLElement> | Event) => void;
        hidePopup: (e?: MouseEvent<HTMLElement> | KeyboardEvent<HTMLElement> | Event) => void;
        clearText: (e: MouseEvent) => void;
        getScrollContainer: () => HTMLElement | null;
        computedDisabledItems: Set<T>;
        computedNonHiddenItems: T[];
        isRemoteData: boolean;
        handleSelectAll?: (e: SyntheticEvent) => void;
        getHeaderGroupKey: (headerItem: T) => string;
        toggleGroupByKey: (groupKey: string) => ToggleResult;
    };
}

/**
 * Specifies the props passed to the `useDropdownData` hook.
 *
 * @private
 */
export interface UseDropdownDataProps {
    state: {
        isDataInitialized: boolean;
        itemData: T[] | null;
        isRequesting: boolean;
        popupListData: T[];
        isPopupOpen: boolean;
    };
    actions: {
        setIsDataInitialized: (value: boolean) => void;
        setPopupListData: (value: T[]) => void;
        setIsRequesting: (value: boolean) => void;
        setIsActionFailed: (value: boolean) => void;
        setIsLoading: (value: boolean) => void;
        setIsPopupFilterLoading: (value: boolean) => void
    };
    refs: {
        remoteCacheRef: RefObject<T[] | null>;
        filterInputElementRef: RefObject<HTMLInputElement | null>;
        listBaseKey: RefObject<number>;
        popupContentRef: RefObject<HTMLDivElement | null>;
        inputElementRef: RefObject<HTMLInputElement | null>;
        isFetchedRef: RefObject<boolean>;
    };
    config: {
        filterable?: boolean;
        sortOrder: SortOrder;
        query?: Query;
        virtualization?: DropdownVirtualProps;
        maxSuggestions?: number;
        filterType?: string;
        dataSource: T[] | DataManager;
        ignoreAccent?: boolean;
        ignoreCase?: boolean;
        spanClickable?: boolean;
        forceFilterOnOpen?: boolean;
        maximumSelectionLength?: number;
        hideSelectedItem?: boolean;
        multiSelectable?: boolean;
        checkbox?: boolean;
        enableSelectionOrder?: boolean;
        onScroll?: (e: ScrollEvent) => void;
        onDataRequest?: (event: DataRequestEvent) => void;
        onError?: (error: Error) => void;
        onDataLoad?: (e: { data: T[] | DataManager }, fromFilter?: boolean) => void;
    };
    internalProps: {
        fields: FieldSettingsModel;
        isRemoteData: boolean;
    };
}

/**
 * Specifies the return structure of the `useDropdownData` hook used.
 *
 * @private
 */
export interface UseDropdownDataReturn {
    formListData: (dataSource: T[] | DataManager, query?: Query, fromFilter?: boolean, typedText?: string) => void;
    fetchRemoteVirtualData: (dataSource: DataManager, query: Query, fromFilter?: boolean, typedText?: string,
        fromScroll?: boolean) => Promise<void>;
    handleInternalScrollRequest: (e: ScrollEvent) => void;
    getFormattedValue: (value: T) => T;
    getDataByValue: (value: T) => T | undefined;
    getTextByValue: (value: T) => string;
    getQuery: (newQuery?: Query) => Query;
    getScrollContainer: () => HTMLElement | null;
    computedNonHiddenItems: T[];
    computedDisabledItems: Set<T>;
    reorderSelectedItemCount: number;
}

/**
 * Specifies the return structure of the `useDropdownFilter` hook.
 *
 * @private
 */
export interface UseDropdownFilterReturn {
    handleInputChange: (e: ReactChangeEvent<HTMLInputElement>) => void;
    clearText: (e: MouseEvent) => void;
    filter: (ds: T[], query?: Query) => void;
}

/**
 * Specifies the props passed to the `useDropdownFilter` hook.
 *
 * @private
 */
export interface UseDropdownFilterProps {
    actions: {
        setTypedString: (value: string) => void;
    };
    config: {
        fields?: FieldSettingsModel;
        filterable?: boolean;
        ignoreAccent?: boolean;
        ignoreCase?: boolean;
        filterType?: string;
        dataSource: T[] | DataManager;
        onFilter?: (e: FilterEvent) => void;
        debounceDelay?: number;
        query?: Query;
        spanClickable?: boolean;
    };
    internalProps: {
        formListData: (ds: T[] | DataManager, query: Query, isFilter?: boolean, filterValue?: string) => void;
    };
    refs: {
        inputElementRef: RefObject<HTMLInputElement | null>;
        filterInputElementRef: RefObject<HTMLInputElement | null>;
    };
}

/**
 * Specifies the return structure of the `useDropdownKeyboard` hook.
 *
 * @private
 */
export interface DropdownKeyboardReturn {
    keyActionHandler: (e: KeyboardEvent<HTMLElement>) => void;
    handleCustomTypeAhead: (text: string) => string | null;
    typeAheadMatchedItem: ListItemData | null;
    isShowSelectAllFocused: boolean;
    isCustomElemFocused: boolean
    setTypeAheadMatchedItem: Dispatch<SetStateAction<ListItemData | null>>
    setIsCustomElemFocused: Dispatch<SetStateAction<boolean>>
}

/**
 * Specifies the props passed to the `useDropdownKeyboard` hook.
 *
 * @private
 */
export interface UseDropdownKeyboardProps {
    state: {
        listData: ListItemData[];
        textValue: string;
        itemData: T[] | null;
        dropdownValue: T[] | null;
        isPopupOpen: boolean;
        popupListData: T[];
    };
    actions: {
        setIsSpanFocused: (value: boolean) => void;
        setDropdownValue: (value: T[] | null) => void;
        setItemData: (value: T[] | null) => void;
        setTextValue: (value: string) => void;
    };
    config: {
        skipDisabledItems?: boolean;
        onScroll?: (e: { originalEvent: Event; startIndex: number; count: number }) => void;
        virtualization?: DropdownVirtualProps;
        filterable?: boolean;
        showSelectAll?: boolean;
        spanClickable?: boolean;
        disabled?: boolean;
        readOnly?: boolean;
        multiSelectable?: boolean;
        customValue?: boolean;
        mode?: DisplayMode;
        maximumSelectionLength?: number;
        hideSelectedItem?: boolean;
        closeOnSelect?: boolean;
        onChange?: (e: ChangeEvent) => void;
        enableGroupedCheckBox?: boolean;
    };
    internalProps: {
        resolvedFields: FieldSettingsModel;
        showPopup: (e?: MouseEvent<HTMLElement> | KeyboardEvent<HTMLElement> | Event) => void;
        hidePopup: (e?: MouseEvent<HTMLElement> | KeyboardEvent<HTMLElement> | Event) => void;
        clearText: (e: MouseEvent) => void;
        commitIfCustom?: (evt?: KeyboardEvent<HTMLElement> | FocusEvent<HTMLElement> | MouseEvent<Element>,
            allowCustomVal?: boolean) => void;
        getScrollContainer: () => HTMLElement | null;
        computedDisabledItems: Set<T>;
        computedNonHiddenItems: T[];
        isRemoteData: boolean;
        handleSelectAll?: (e: SyntheticEvent) => void;
        prefetchData?: () => Promise<T[] | null>;
        getHeaderGroupKey: (headerItem: T) => string;
        toggleGroupByKey: (groupKey: string) => ToggleResult;
    };
    refs: {
        inputElementRef: RefObject<HTMLInputElement | null>;
    };
}

/**
 * Specifies the return structure of the `useDropdownPopup` hook.
 *
 * @private
 */
export interface useDropdownPopupReturn {
    showPopup: (e?: MouseEvent<HTMLElement> | KeyboardEvent<HTMLElement> | Event) => void;
    hidePopup: (e?: MouseEvent<HTMLElement> | KeyboardEvent<HTMLElement> | Event) => void;
    setPopupWidth: () => string;
    setPopupHeight: () => string;
}

/**
 * Specifies the props passed to the `useDropdownPopup` hook.
 *
 * @private
 */
export interface UseDropdownPopupProps {
    state: {
        isPopupOpen: boolean;
    };
    actions: {
        setIsPopupOpen: (value: boolean) => void;
        setIsSpanFocused: (value: boolean) => void;
    };
    refs: {
        dropdownRootRef: RefObject<HTMLSpanElement | null>;
        inputElementRef: RefObject<HTMLInputElement | null>;
        popupRef: RefObject<IPopup | null>;
    };
    config: {
        onOpen?: (e: PopupEvent) => void;
        onClose?: (e: PopupEvent) => void;
        multiSelectable?: boolean;
        open?: boolean;
        combinedPopupSettings: PopupSettings;
    };
}

/**
 * Specifies the return structure of the `useDropdownSelectAll` hook.
 *
 * @private
 */
export interface UseDropdownSelectAllReturn {
    isAllSelected: boolean;
    isIndeterminate: boolean;
    handleSelectAll: (e: SyntheticEvent) => void;
}

/**
 * Specifies the props passed to the `useDropdownSelectAll` hook.
 *
 * @private
 */
export interface UseDropdownSelectAllProps {
    state: {
        listData: ListItemData[];
        itemData: T[] | null;
    };
    actions: {
        setItemData: (value: T[] | null) => void;
        setDropdownValue: (value: T[] | null) => void;
    };
    config: {
        fields?: FieldSettingsModel;
        onSelectAll?: (e: { selectedItems: string[]; event: SyntheticEvent }) => void;
        maximumSelectionLength?: number;
        multiSelectable?: boolean;
        checkbox?: boolean;
        showSelectAll?: boolean;
    };
}

/**
 * @private
 */
export interface UseDropdownStateProps extends IDropdownProps {
    locale: string;
    dir: string;
}

/**
 * Specifies the return structure of the `useDropdownValidation` hook.
 *
 * @private
 */
export interface UseDropdownValidationReturn {
    isInputValid: boolean;
}

/**
 * Specifies the props passed to the `useDropdownValidation` hook.
 *
 * @private
 */
export interface UseDropdownValidationProps {
    state: {
        dropdownValue: T[] | null;
    };
    config: {
        required?: boolean;
        valid?: boolean;
        validationMessage?: string;
    };
    refs: {
        inputElementRef: RefObject<HTMLInputElement | null>;
    };
}

/**
 * Specifies the props passed to the `useDropdownValueSync` hook.
 *
 * @private
 */
export interface UseDropdownValueSyncProps {
    state: {
        itemData: T[] | null;
        dropdownValue: T[] | null;
        listData: ListItemData[] | undefined;
        isPopupOpen: boolean;
        popupListData: T[];
    };
    actions: {
        setTextValue: (value: string) => void;
        setItemData: (value: T[] | null) => void;
        setDropdownValue: (value: T[] | null) => void;
    };
    config: {
        spanClickable?: boolean;
        dataSource: T[] | DataManager;
        customValue?: boolean;
        multiSelectable?: boolean;
        value?: T | T[] | null;
        defaultValue?: T | T[] | null;
        allowObjectBinding?: boolean;
    };
    internalProps: {
        resolvedFields: FieldSettingsModel;
        prefetchData?: () => Promise<T[] | null>;
        getTextByValue?: (value: T) => string;
    };
}

export type GroupState = {
    checked: boolean;
    indeterminate: boolean;
    total: number;
    selected: number;
};

export type ToggleResult = {
    newItemData: T[];
    newDropdownValue: T[];
};

/**
 * Specifies the return structure of the `UseDropdownGroupedSelection` hook.
 *
 * @private
 */
export type UseDropdownGroupedSelectionReturn = {
    groupStates: Record<string, GroupState>;
    getHeaderGroupKey: (headerItem: T) => string;
    toggleGroupByKey: (groupKey: string) => ToggleResult;
};


/**
 * Specifies the props passed to the `UseDropdownGroupedSelection` hook.
 *
 * @private
 */
export interface UseDropdownGroupedSelectionProps {
    config: {
        skipDisabledItems?: boolean;
        maximumSelectionLength?: number;
    },
    state: {
        dropdownValue: T[] | null;
        itemData: T[] | null;
        listData: ListItemData[];
    },
    internalProps: {
        resolvedFields: FieldSettingsModel;
    }
}
