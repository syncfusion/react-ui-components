import { RefObject, useCallback, useEffect, useMemo, useRef, type ChangeEvent, type MouseEvent } from 'react';
import { DataManager, Query } from '@syncfusion/react-data';
import { FilterEvent, T } from '../../drop-down-list/types';
import { getResolvedQuery, isPrimitive, normalizeOperator } from '../utils';
import { UseDropdownFilterProps, UseDropdownFilterReturn } from './hook-types';

export const useDropdownFilter: (props: UseDropdownFilterProps) => UseDropdownFilterReturn =
    (props: UseDropdownFilterProps): UseDropdownFilterReturn => {
        const {
            actions: { setTypedString },
            config: { fields, filterable, ignoreAccent, ignoreCase, filterType, dataSource, onFilter, debounceDelay, query: baseQuery,
                spanClickable },
            internalProps: { formListData },
            refs: { inputElementRef, filterInputElementRef }
        } = props;

        const filterTimerRef: RefObject<number | null> = useRef<number | null>(null);
        const currentInputRef: RefObject<HTMLInputElement | null> = useMemo(() =>
            spanClickable ? filterInputElementRef : inputElementRef, [spanClickable, filterInputElementRef, inputElementRef]);

        const filteringAction: (ds: T[] | DataManager, query?: Query | null) => void =
            useCallback((ds: T[] | DataManager, query?: Query | null) => {
                const filterQuery: Query = getResolvedQuery(query || baseQuery);
                if (currentInputRef?.current != null && currentInputRef.current.value.trim() !== '') {
                    if (!query) {
                        const op: string = normalizeOperator(filterType);
                        const primitive: boolean = Array.isArray(ds) && ds.length > 0 && isPrimitive(ds[0]);
                        if (primitive) {
                            filterQuery.where('', op, currentInputRef.current.value, ignoreCase, ignoreAccent);
                        } else {
                            filterQuery.where((fields?.text || 'text'), op, currentInputRef.current.value, ignoreCase, ignoreAccent);
                        }
                    }
                    formListData(ds, filterQuery, true, currentInputRef.current.value);
                } else {
                    formListData(ds, filterQuery, true);
                }
            }, [filterType, fields, ignoreCase, ignoreAccent, formListData, baseQuery, currentInputRef]);

        const searchLists: (e: ChangeEvent<HTMLInputElement>, filterValue?: string) => void =
            useCallback((e: ChangeEvent<HTMLInputElement>, filterValue?: string) => {
                if (filterable && currentInputRef?.current != null) {
                    const eventArgs: FilterEvent = {
                        preventDefaultAction: false,
                        text: filterValue as string,
                        event: e
                    };
                    if (onFilter) {
                        onFilter(eventArgs);
                    }
                    if (!eventArgs.preventDefaultAction && dataSource) {
                        filteringAction(dataSource, null);
                    }
                }
            }, [filterable, filteringAction, onFilter, dataSource]);

        const filter: (ds: T[], query?: Query) => void = useCallback((ds: T[], query?: Query) => {
            filteringAction(ds, query);
        }, [ignoreCase, filteringAction]);

        const clearFilterTimer: () => void = useCallback(() => {
            if (filterTimerRef.current) {
                clearTimeout(filterTimerRef.current);
                filterTimerRef.current = null;
            }
        }, [filterTimerRef]);

        const updateSearchAndTypedString: (e: ChangeEvent<HTMLInputElement>) => void =
            useCallback((e: ChangeEvent<HTMLInputElement>) => {
                setTypedString(e.target.value);
                searchLists(e, e.target.value);
            }, [setTypedString, searchLists]);

        const handleInputChange: (e: ChangeEvent<HTMLInputElement>) => void =
            useCallback((e: ChangeEvent<HTMLInputElement>) => {
                if (debounceDelay && debounceDelay > 0) {
                    if (filterTimerRef.current) {
                        clearFilterTimer();
                    }
                    filterTimerRef.current = window.setTimeout(() => {
                        updateSearchAndTypedString(e);
                        clearFilterTimer();
                    }, debounceDelay);
                } else {
                    updateSearchAndTypedString(e);
                }
            }, [searchLists, clearFilterTimer, updateSearchAndTypedString]);

        const clearText: (e: MouseEvent) => void = useCallback((e: MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            setTypedString('');
            formListData(dataSource, baseQuery || new Query(), true);
        }, [formListData, dataSource, baseQuery]);

        useEffect(() => {
            return () => {
                if (filterTimerRef.current) {
                    clearTimeout(filterTimerRef.current);
                    filterTimerRef.current = null;
                }
            };
        }, []);

        return { handleInputChange, clearText, filter };
    };
