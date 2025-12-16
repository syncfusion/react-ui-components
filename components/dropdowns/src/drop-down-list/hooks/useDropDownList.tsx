import * as React from 'react';
import { useEffect, useMemo } from 'react';
import { Query } from '@syncfusion/react-data';
import { addSorting, getData, groupDataSource } from '@syncfusion/react-lists';
import { SortOrder } from '../../drop-down-list';

export const useValidation: (props: { dropdownValue: string | number | boolean | object | null; inputElementRef:
React.RefObject<HTMLInputElement | null>; required: boolean | undefined; valid: boolean | undefined; validationMessage?: string; })
=> { isInputValid: boolean; } = (props: {
    dropdownValue: string | number | boolean | object | null;
    inputElementRef: React.RefObject<HTMLInputElement | null>; required: boolean | undefined; valid: boolean | undefined,
    validationMessage?: string
}): { isInputValid: boolean } => {
    const { dropdownValue, inputElementRef, required, valid, validationMessage } = props;

    const isInputValid: boolean = useMemo<boolean>(() => {
        if (valid !== undefined) { return Boolean(valid); }
        return required ? dropdownValue != null : true;
    }, [valid, required, dropdownValue]);

    useEffect(() => {
        const message: string = isInputValid ? '' : (validationMessage || '');
        const el: HTMLInputElement | null | undefined = inputElementRef?.current ?? undefined;
        if (el && typeof el.setCustomValidity === 'function') {
            el.setCustomValidity(message);
        }
    }, [isInputValid, validationMessage, inputElementRef]);

    return { isInputValid };
};

export const processDataResult: (
    result: Array<{ [key: string]: Object } | string | number | boolean>,
    fields: { text?: string; value?: string; groupBy?: string },
    sortOrder: SortOrder,
    query: Query
) => (Array<{ [key: string]: Object } | string | number | boolean>) = (
    result: Array<{ [key: string]: Object } | string | number | boolean>,
    fields: { text?: string; value?: string; groupBy?: string },
    sortOrder: SortOrder,
    query: Query
) => {
    const isPrimitiveArray: boolean = result.length > 0 && (
        typeof result[0] === 'string' || typeof result[0] === 'number' || typeof result[0] === 'boolean'
    );
    if (isPrimitiveArray || !fields.groupBy) {
        if (isPrimitiveArray && sortOrder !== SortOrder.None) {
            const sortedResult: (string | number | boolean | { [key: string]: Object })[] = [...result];
            if (sortOrder === SortOrder.Ascending) {
                sortedResult.sort((a: string | number | boolean | { [key: string]: object },
                                   b: string | number | boolean | { [key: string]: object }) =>
                    String(a).localeCompare(String(b))
                );
            } else if (sortOrder === SortOrder.Descending) {
                sortedResult.sort((a: string | number | boolean | { [key: string]: object },
                                   b: string | number | boolean | { [key: string]: object }) =>
                    String(b).localeCompare(String(a))
                );
            }
            return sortedResult;
        } else {
            const sortQuery: Query = addSorting(sortOrder, fields?.text || 'text', query);
            return getData(result as { [key: string]: Object }[], sortQuery);
        }
    } else {
        return groupDataSource(result as { [key: string]: Object }[], fields, sortOrder);
    }
};

export const normalizeOperator: (op: unknown) => 'startsWith' | 'endsWith' | 'contains' = (op: unknown) => {
    const raw: string = String(op ?? '');
    switch (raw) {
    case 'StartsWith':
        return 'startsWith';
    case 'EndsWith':
        return 'endsWith';
    case 'Contains':
        return 'contains';
    default:
        return 'contains';
    }
};
