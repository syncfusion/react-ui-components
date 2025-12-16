import * as React from 'react';
import { useCallback, useState } from 'react';
import { DataManager, Query } from '@syncfusion/react-data';
import { FieldSettingsModel, FilterEvent, FilterType } from '../types';
import { normalizeOperator } from './useDropDownList';

/**
 * Specifies the properties used by the `useFilter` hook to manage the state and behavior of the DropDownList component.
 *
 * @private
 */
interface UseFilterParams {
    isDropdownFiltering: boolean;
    ignoreCase?: boolean;
    ignoreAccent?: boolean;
    filterType: FilterType;
    fields: FieldSettingsModel;
    dataSource: { [key: string]: unknown }[] | DataManager | string[] | number[] | boolean[];
    baseQuery: Query;
    onFilter?: (args: FilterEvent) => void;
    setListData: (dataSource: { [key: string]: unknown }[] | DataManager |
    string[] | number[] | boolean[], query?: Query, fromFilter?: boolean, typedText?: string ) => void;
    externalTypedString?: string;
    setExternalTypedString?: (v: string) => void;
    externalFilterInputRef?: React.RefObject<HTMLInputElement | null>;
}

/**
 * Specifies the return structure of the `useFilter` hook used in dropdown components.
 *
 * @private
 */
interface UseFilterReturn {
    typedString: string;
    setTypedString: (v: string) => void;
    filterInputElementRef: React.RefObject<HTMLInputElement | null>;
    onFilterUp: (e: React.KeyboardEvent<HTMLInputElement>, keyActionHandler?: (e: React.KeyboardEvent<HTMLElement>) => void) => void;
    handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    searchLists: (e: React.ChangeEvent<HTMLInputElement>, filterValue?: string) => void;
    clearText: (e: React.MouseEvent) => void;
    filter: (ds: { [key: string]: unknown }[] | DataManager | string[] | number[] | boolean[],
        query?: Query, flds?: FieldSettingsModel) => void;
}

export const useFilter: (params: UseFilterParams) => UseFilterReturn = (params: UseFilterParams): UseFilterReturn => {
    const {
        isDropdownFiltering,
        ignoreCase,
        ignoreAccent,
        filterType,
        fields,
        dataSource,
        onFilter,
        setListData,
        baseQuery
    } = params;

    const [internalTypedString, setInternalTypedString] = useState<string>('');
    const [isCustomFilter, setIsCustomFilter] = useState<boolean>(false);

    const internalFilterInputElementRef: React.RefObject<HTMLInputElement | null> = React.useRef<HTMLInputElement | null>(null);

    const typedString: string = params.externalTypedString !== undefined ? params.externalTypedString : internalTypedString;
    const setTypedString: (v: string) => void = params.setExternalTypedString || setInternalTypedString;
    const filterInputElementRef: React.RefObject<HTMLInputElement | null> = params.externalFilterInputRef || internalFilterInputElementRef;

    const filteringAction: ( ds: { [key: string]: unknown }[] | DataManager | string[] | number[] | boolean[], query?: Query | null )
    => void = useCallback(( ds: { [key: string]: unknown }[] | DataManager | string[] | number[] | boolean[], query?: Query | null ) => {
        if (filterInputElementRef.current != null && filterInputElementRef.current.value.trim() !== '') {
            const filterQuery: Query = query || baseQuery || new Query();
            if (!query) {
                const op: 'startsWith' | 'endsWith' | 'contains' = normalizeOperator(filterType);
                const isPrimitive: boolean = Array.isArray(ds) && ds.length > 0 && (typeof (ds)[0] === 'string' || typeof (ds)[0] === 'number'
                || typeof (ds)[0] === 'boolean');
                if (isPrimitive) {
                    filterQuery.where('', op, filterInputElementRef.current.value, ignoreCase, ignoreAccent);
                } else {
                    filterQuery.where((fields.text || 'text') as string, op, filterInputElementRef.current.value, ignoreCase, ignoreAccent);
                }
            }
            setListData(ds, filterQuery, true, filterInputElementRef.current.value);
        } else {
            setListData(ds, query || baseQuery || new Query(), true);
        }
    }, [filterType, fields, ignoreCase, ignoreAccent, setListData, baseQuery] );

    const searchLists: (e: React.ChangeEvent<HTMLInputElement>, filterValue?: string) => void =
        useCallback((e: React.ChangeEvent<HTMLInputElement>, filterValue?: string) => {
            if (isDropdownFiltering && filterInputElementRef.current != null) {
                const eventArgs: {
                    preventDefaultAction: boolean;
                    text: string;
                    event: React.ChangeEvent<HTMLInputElement>;
                } = {
                    preventDefaultAction: false,
                    text: filterValue as string,
                    event: e
                };
                if (onFilter) {
                    onFilter(eventArgs);
                }
                if (!isCustomFilter && !eventArgs.preventDefaultAction && dataSource) {
                    filteringAction(dataSource, null);
                }
            }
        }, [isDropdownFiltering, filteringAction, onFilter, isCustomFilter, dataSource] );

    const onFilterUp: (  e: React.KeyboardEvent<HTMLInputElement>,  keyActionHandler?: (e: React.KeyboardEvent<HTMLElement>) => void )
    => void = useCallback( (e: React.KeyboardEvent<HTMLInputElement>, keyActionHandler?: (e: React.KeyboardEvent<HTMLElement>) => void) => {
        if (keyActionHandler) {
            keyActionHandler(e);
        }
    }, []);

    const filter: ( ds: { [key: string]: unknown }[] | DataManager | string[] | number[] | boolean[], query?: Query,
        flds?: FieldSettingsModel  ) => void = useCallback( (  ds: { [key: string]: unknown }[] | DataManager | string[] | number[] |
    boolean[], query?: Query, flds?: FieldSettingsModel ) => {
        setIsCustomFilter(true);
        const currentValue: string = filterInputElementRef.current?.value || typedString;
        if (currentValue) {
            const filterQuery: Query = query || new Query();
            if (!query) {
                filterQuery.where((flds?.text || 'text') as string, 'contains', currentValue, ignoreCase);
            }
            filteringAction(ds, filterQuery);
        } else {
            filteringAction(ds, query);
        }
    }, [typedString, ignoreCase, filteringAction] );

    const handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            setTypedString(e.target.value);
            searchLists(e, e.target.value);
        },
        [searchLists]
    );

    const clearText: (e: React.MouseEvent) => void = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setTypedString('');
        setListData(dataSource, baseQuery || new Query(), true);
    }, [setTypedString, setListData, dataSource, baseQuery]);

    return { typedString, setTypedString, filterInputElementRef, onFilterUp, handleInputChange, searchLists, clearText, filter };
};
