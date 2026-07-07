import {  Dispatch, RefObject, SetStateAction, useCallback, useEffect, useState } from 'react';
import {  SearchEvent, SearchSettings } from '../types/search.interfaces';
import { isNullOrUndefined} from '@syncfusion/react-base';
import { GridRef } from '../types/grid.interfaces';
import { SearchAPI } from '../types/search.interfaces';
import { ActionType, ScrollMode, VirtualSettings } from '../types';

/**
 * Manages search configuration and execution for the Grid component.
 * Handles search value updates, numeric validation, and pagination integration with virtual scrolling support.
 * Provides search API with settings state management and search execution method.
 *
 * @private
 * @param {RefObject<GridRef>} gridRef - Reference to the grid component instance for accessing search configuration and triggering events
 * @param {SearchSettings} searchSetting - Search configuration including enabled state, fields, value, operator, and case sensitivity
 * @param {Function} setGridAction - Callback function to dispatch search action events of type SearchEvent for state management
 * @param {Function} setCurrentPage - State setter function to update pagination when search is applied with virtual scrolling
 * @param {VirtualSettings} virtualSettings - Virtual scrolling configuration containing row virtualization and cache settings
 * @param {ScrollMode} scrollMode - Current scroll mode determining virtualization behavior
 * @returns {SearchAPI} Object containing search method, searchSettings state, and setSearchSetting updater function
 */
export const useSearch: (gridRef?: RefObject<GridRef>, searchSetting?: SearchSettings,
    setGridAction?: (action: SearchEvent) => void, setCurrentPage?: Dispatch<SetStateAction<number>>, virtualSettings?: VirtualSettings,
    scrollMode?: ScrollMode) => SearchAPI = (gridRef?: RefObject<GridRef>, searchSetting?: SearchSettings,
                                             setGridAction?: (action: SearchEvent) => void,
                                             setCurrentPage?: Dispatch<SetStateAction<number>>, virtualSettings?: VirtualSettings,
                                             scrollMode?: ScrollMode) => {
    const [searchSettings, setSearchSetting] = useState<SearchSettings>(searchSetting);

    /**
     * Updates search settings state when searchSetting prop changes.
     * Resets pagination when search is updated with virtual scrolling enabled.
     */
    useEffect(() => {
        setSearchSetting(searchSetting);
        if (gridRef?.current?.contentScrollRef && scrollMode === ScrollMode.Virtual && virtualSettings?.enableRow &&
            virtualSettings?.enableCache) {
            setCurrentPage?.(1);
        }
    }, [searchSetting]);

    /**
     * Checks if the input string contains non-numeric characters.
     *
     * @param {string} searchString - The string to be checked for non-numeric characters.
     * @returns {boolean} - `true` if the input string contains non-numeric characters, `false` otherwise.
     */
    const hasNonNumericCharacters: (searchString: string) => boolean = useCallback((searchString: string): boolean => {
        let decimalFound: boolean = false;
        for (const char of searchString) {
            if ((char < '0' || char > '9') && char !== '.') {
                return true;
            }
            if (char === '.') {
                if (decimalFound) {
                    // If decimal is found more than once, it's not valid
                    return true;
                }
                decimalFound = true;
            }
        }
        return false;
    }, []);

    /**
     * Executes search operation on grid records based on the provided search string.
     * Validates search input, triggers search events, updates search state, and resets pagination for virtual scrolling.
     * Checks for unsaved changes before executing search to prevent data loss.
     *
     * @param {string} searchString - Search query string to filter grid records across configured fields
     * @returns {void}
     */
    const search: (searchString: string) => Promise<void> = async (searchString: string): Promise<void> => {
        searchString = isNullOrUndefined(searchString) ? '' : searchString;
        let searchValue: string | number;
        if (gridRef.current?.searchSettings?.enabled === false) { return; }
        if (searchString !== gridRef.current.searchSettings.value) {
            // Check searchString is number and parseFloat to remove trailing zeros
            if (searchString !== '' && !hasNonNumericCharacters(searchString)) {
                if (searchString === '.' || (searchString.indexOf('.') === -1)) {
                    searchValue = searchString.toString();
                } else {
                    searchValue = parseFloat(searchString).toString();
                }
            } else {
                searchValue = searchString.toString();
            }
            const args: SearchEvent = { cancel: false, requestType: ActionType.Searching, value: searchValue };
            args.type = ActionType.Searching;
            const confirmResult: boolean = await gridRef.current?.editModule?.checkUnsavedChanges?.();
            if (!isNullOrUndefined(confirmResult) && !confirmResult) {
                return;
            }
            gridRef.current.onSearchStart?.(args);
            if (args.cancel) {
                return;
            }
            gridRef.current.searchSettings.value = searchValue;
            setSearchSetting((prevSettings: SearchSettings) => {
                return { ...prevSettings, key: searchValue as string };
            });
            args.type = ActionType.Searching;
            setGridAction?.(args);
            if (gridRef?.current?.contentScrollRef && scrollMode === ScrollMode.Virtual && virtualSettings?.enableRow &&
                virtualSettings?.enableCache) {
                setCurrentPage?.(1);
            }
        }
    };


    return { search, searchSettings, setSearchSetting };
};
