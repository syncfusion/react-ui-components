import { IPopup } from '@syncfusion/react-popups';
import { DataManager, Query } from '@syncfusion/react-data';
import { T, FieldSettingsModel, DropdownVirtualProps, PopupSettings, ScrollEvent } from '../../drop-down-list/types';
import { ListItemData } from '../types';
import { GroupState, ToggleResult, UseDropdownStateProps } from '../hooks';
import { type ChangeEvent, Dispatch, RefObject, SetStateAction, type SyntheticEvent, type MouseEvent, type KeyboardEvent, type FocusEvent } from 'react';

/**
 * Represents the complete internal state of the Dropdown component.
 * This is managed by useDropdownState and provided via DropdownContext.
 *
 * @private
 */
export interface DropdownState {
    isPopupOpen: boolean;
    text: string;
    isSpanFocused: boolean;
    isLoading: boolean;
    isActionFailed: boolean;
    popupDimensions: { height: number; width: number };
    itemData: T[] | null;
    dropdownValue: T[] | null;
    isPopupFilterLoading: boolean;
    listData: ListItemData[];
    isRequesting: boolean;
    isDataInitialized: boolean;
    popupListData: T[];
    typedString: string;
}

/**
 * Action methods for updating the Dropdown state.
 * These are provided by useDropdownState and available via context.
 *
 * @private
 */
export interface DropdownActions {
    setText: (value: string) => void;
    setIsPopupOpen: (value: boolean) => void;
    setItemData: (value: T[] | null) => void;
    setDropdownValue: (value: T[] | null) => void;
    setIsLoading: (value: boolean) => void;
    setIsSpanFocused: (value: boolean) => void;
    setPopupDimensions: (value: { height: number; width: number }) => void;
    setIsRequesting: (value: boolean) => void;
    setIsDataInitialized: (value: boolean) => void;
    setIsActionFailed: (value: boolean) => void;
    setTypedString: (v: string) => void;
    setPopupListData: (v: T[]) => void;
    setIsPopupFilterLoading: (value: boolean) => void;
}

/**
 * DOM references used by the Dropdown component and its children.
 * These are managed by useDropdownState and available via context.
 *
 * @private
 */
export interface DropdownRefs {
    inputElementRef: RefObject<HTMLInputElement | null>;
    popupRef: RefObject<IPopup | null>;
    dropdownRootRef: RefObject<HTMLSpanElement | null>;
    popupContentRef: RefObject<HTMLDivElement | null>;
    remoteCacheRef: RefObject<T[] | null>;
    filterInputElementRef: RefObject<HTMLInputElement | null>;
    listBaseKey: RefObject<number>
    isFetchedRef: RefObject<boolean>;
}

/**
 * Configuration object containing all component settings and options.
 * This is derived from the component props and provided via context.
 *
 * @private
 */
export type DropdownConfig = UseDropdownStateProps

/**
 * Configuration object containing all component settings and options.
 * This is derived from the component props and provided via context.
 *
 * @private
 */
export interface DropdownInternalProps {
    resolvedFields: FieldSettingsModel;
    combinedPopupSettings: PopupSettings;
    isInputValid: boolean;
    uiLoading: boolean;
    computedNonHiddenItems: T[];
    computedDisabledItems: Set<T>;
    reorderSelectedItemCount: number;
    isAllSelected: boolean;
    isIndeterminate: boolean;
    typeAheadMatchedItem: ListItemData | null;
    isShowSelectAllFocused: boolean;
    isCustomElemFocused: boolean;
    resolvedVirtualization: DropdownVirtualProps | undefined;
    isRemoteData: boolean;
    groupStates: Record<string, GroupState>;
    getHeaderGroupKey: (headerItem: T) => string;
    toggleGroupByKey: (groupKey: string) => ToggleResult;
    formListData: (dataSource: T[] | DataManager, query?: Query, fromFilter?: boolean, typedText?: string) => void;
    fetchRemoteVirtualData: (dataSource: DataManager, query: Query, fromFilter?: boolean, typedText?: string,
        fromScroll?: boolean) => Promise<void>;
    handleInternalScrollRequest: (e: ScrollEvent) => void;
    getFormattedValue: (value: T) => T;
    getDataByValue: (value: T) => T | undefined;
    getTextByValue: (value: T) => string;
    getQuery: (newQuery?: Query) => Query;
    getScrollContainer: () => HTMLElement | null;
    handleInputChange: (e: ChangeEvent<HTMLInputElement>) => void;
    clearText: (e: MouseEvent) => void;
    filter: (ds: T[], query?: Query) => void;
    showPopup: (e?: MouseEvent<HTMLElement> | KeyboardEvent<HTMLElement> | Event) => void;
    hidePopup: (e?: MouseEvent<HTMLElement> | KeyboardEvent<HTMLElement> | Event) => void;
    setPopupWidth: () => string;
    setPopupHeight: () => string;
    commitIfCustom: (evt?: KeyboardEvent<HTMLElement> | FocusEvent<HTMLElement> | MouseEvent<Element>,
        allowCustomVal?: boolean) => void;
    handleSelectAll: (e: SyntheticEvent) => void;
    prefetchData: () => Promise<T[] | null>;
    keyActionHandler: (e: KeyboardEvent<HTMLElement>) => void;
    handleCustomTypeAhead: (text: string) => string | null;
    setTypeAheadMatchedItem: Dispatch<SetStateAction<ListItemData | null>>;
    setIsCustomElemFocused: Dispatch<SetStateAction<boolean>>;
    onKeyHandler: (e: KeyboardEvent<HTMLSpanElement>) => void;
    dropdownIconClick: (e: MouseEvent<HTMLSpanElement>) => void;
    dropDownClick: (e: MouseEvent<HTMLSpanElement>) => void;
}

/**
 * The complete Dropdown context type containing state, actions, refs, config, and internalProps.
 * This is the interface for the DropdownContext value.
 *
 * @private
 */
export interface DropdownContextType {
    state: DropdownState;
    actions: DropdownActions;
    refs: DropdownRefs;
    config: DropdownConfig;
    internalProps: DropdownInternalProps
}
