import { useRef, useCallback, RefObject } from 'react';
import { AggregateType } from '../types/enum';
import { UseAggregateSelectionResult } from '../types/interfaces';

/**
 * Manages user-selected aggregate types via context menu.
 * Persists selections across page/sort/filter operations via useRef.
 *
 * @returns {UseAggregateSelectionResult} Methods to manage aggregate selections
 * @private
 */
export const useAggregateSelection: () => UseAggregateSelectionResult = (): UseAggregateSelectionResult => {
    const selectedAggregatesRef: RefObject<Map<string, AggregateType>> = useRef<Map<string, AggregateType>>(new Map());

    const getAggregate: (rowIndex: number, field: string) => AggregateType | undefined =
        useCallback((rowIndex: number, field: string): AggregateType | undefined => {
            return selectedAggregatesRef.current.get(`${rowIndex}-${field}`);
        }, []);

    const addAggregate: (rowIndex: number, field: string, type: AggregateType) => void =
        useCallback((rowIndex: number, field: string, type: AggregateType): void => {
            selectedAggregatesRef.current.set(`${rowIndex}-${field}`, type);
        }, []);

    return {
        getAggregate,
        addAggregate
    };
};
