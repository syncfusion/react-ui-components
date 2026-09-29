import { useCallback, useEffect, useReducer, useRef, SyntheticEvent, RefObject, Dispatch } from 'react';
import { TabValue, TabsOptions, TabsFocusEvent } from '../types';
import { TabsState, TabsAction, TabMeta } from '../internal-types';
import { createTabRegistry } from '../state/tab-registry';

const initialState: TabsState = {
    value: null,
    focusedValue: null,
    tabOrder: [],
    tabCount: 0
};

/**
 * Internal reducer for managing tabs state.
 *
 * @private
 * @param {TabsState} state The current tabs state.
 * @param {TabsAction} action The action to apply to the state.
 * @returns {TabsState} The updated tabs state.
 */
export const tabsReducer: (state: TabsState, action: TabsAction) => TabsState =
    (state: TabsState, action: TabsAction): TabsState => {
        switch (action.type) {
        case 'SET_VALUE': {
            if (state.value === action.value) { return state; }
            return { ...state, value: action.value, focusedValue: action.value };
        }
        case 'SET_FOCUSED': {
            if (state.focusedValue === action.value) { return state; }
            return { ...state, focusedValue: action.value };
        }
        case 'SET_DEFAULT': {
            if (state.value !== null) { return state; }
            if (action.value === null) { return state; }
            return { ...state, value: action.value, focusedValue: action.value };
        }
        case 'REGISTER_TAB': {
            if (state.tabOrder.indexOf(action.value) !== -1) { return state; }
            return {
                ...state,
                tabOrder: [...state.tabOrder, action.value],
                tabCount: state.tabOrder.length + 1,
                value: state.value === null ? action.value : state.value,
                focusedValue: state.focusedValue === null ? action.value : state.focusedValue
            };
        }
        case 'UNREGISTER_TAB': {
            const idx: number = state.tabOrder.indexOf(action.value);
            if (idx === -1) { return state; }
            const nextOrder: TabValue[] = state.tabOrder.slice();
            nextOrder.splice(idx, 1);
            const next: TabsState = {
                ...state,
                tabOrder: nextOrder,
                tabCount: nextOrder.length
            };

            if (state.value === action.value) {
                next.value = nextOrder[0] !== undefined ? nextOrder[0] : null;
                next.focusedValue = next.value;
            } else if (state.focusedValue === action.value) {
                next.focusedValue = state.value;
            }
            return next;
        }
        default:
            return state;
        }
    };

export interface UseTabsReducerResult {
    state: TabsState;
    dispatch: Dispatch<TabsAction>;
    registry: ReturnType<typeof createTabRegistry>;
    selectValue: (value: TabValue, event: Event | SyntheticEvent) => void;
    setFocused: (value: TabValue | null, event?: SyntheticEvent) => void;
    registerTab: (meta: TabMeta) => () => void;
}

export const useTabsReducer: (options: TabsOptions) => UseTabsReducerResult =
    (options: TabsOptions): UseTabsReducerResult => {
        const {
            value: controlledValue,
            defaultValue,
            onValueChange,
            onFocusChange
        } = options;

        const registryRef: RefObject<ReturnType<typeof createTabRegistry>> =
            useRef<ReturnType<typeof createTabRegistry>>(createTabRegistry());
        const registry: ReturnType<typeof createTabRegistry> = registryRef.current;

        const computeInitial: () => TabsState = useCallback((): TabsState => {
            const init: TabsState = { ...initialState };
            if (controlledValue !== undefined) {
                init.value = controlledValue;
                init.focusedValue = controlledValue;
            } else if (defaultValue !== undefined) {
                init.value = defaultValue;
                init.focusedValue = defaultValue;
            }
            return init;
        }, [controlledValue, defaultValue]);

        const [internalState, baseDispatch] = useReducer(
            tabsReducer,
            undefined,
            computeInitial
        );

        const valueControlled: boolean = controlledValue !== undefined;

        const state: TabsState = valueControlled
            ? { ...internalState, value: controlledValue ?? null, focusedValue: controlledValue ?? null }
            : internalState;

        const selectValue: (value: TabValue, event: Event | SyntheticEvent) => void =
            useCallback((value: TabValue, event: Event | SyntheticEvent): void => {
                if (valueControlled) {
                    if (value === controlledValue) { return; }
                    if (onValueChange) {
                        onValueChange({ value, previousValue: controlledValue ?? null, event });
                    }
                } else {
                    const previousValue: TabValue | null = state.value;
                    if (value === previousValue) { return; }
                    baseDispatch({ type: 'SET_VALUE', value, event });
                    if (onValueChange) {
                        onValueChange({ value, previousValue, event });
                    }
                }
            }, [valueControlled, onValueChange, controlledValue, state.value]);

        const setFocused: (value: TabValue | null, event?: SyntheticEvent) => void =
            useCallback((value: TabValue | null, event?: SyntheticEvent): void => {
                if (state.focusedValue === value) { return; }
                if (onFocusChange && value !== null) {
                    onFocusChange({
                        focusedValue: value,
                        previousFocusedValue: state.focusedValue,
                        event: (event as TabsFocusEvent['event']) ?? undefined
                    });
                }
                baseDispatch({ type: 'SET_FOCUSED', value, event });
            }, [state.focusedValue, onFocusChange]);

        useEffect(() => {
            if (!valueControlled) { return; }
            if (controlledValue === undefined) { return; }
            baseDispatch({ type: 'SET_VALUE', value: controlledValue });
        }, [valueControlled, controlledValue]);

        const registerTab: (meta: TabMeta) => () => void = useCallback((meta: TabMeta): (() => void) => {
            registry.register(meta);
            baseDispatch({ type: 'REGISTER_TAB', value: meta.value });
            return (): void => {
                registry.unregister(meta.value);
                baseDispatch({ type: 'UNREGISTER_TAB', value: meta.value });
            };
        }, [registry]);

        return {
            state,
            dispatch: baseDispatch,
            registry,
            selectValue,
            setFocused,
            registerTab
        };
    };
