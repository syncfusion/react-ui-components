import { useCallback, useMemo, KeyboardEvent as ReactKeyboardEvent, useRef, SyntheticEvent, RefObject } from 'react';
import { TabValue, TabsOptions, TabsChangeEvent } from '../types';
import { TabsState } from '../internal-types';
import { TAB_KEYS } from '../constants';

export interface UseTabsKeyboardResult {
    handleTabKeyDown: (value: TabValue) => (event: ReactKeyboardEvent) => void;
    moveFocus: (current: TabValue | null, direction: 'next' | 'prev' | 'first' | 'last') => TabValue | null;
}

export const isTabDisabled: (
    state: TabsState,
    value: TabValue,
    isDisabledFn: (value: TabValue) => boolean
) => boolean =
    (state: TabsState, value: TabValue, isDisabledFn: (value: TabValue) => boolean): boolean => {
        if (state.value === value && state.tabCount === 0) { return true; }
        if (isDisabledFn(value)) { return true; }
        return false;
    };

export const findFirstEnabled: (
    state: TabsState,
    startIdx: number,
    step: 1 | -1,
    isDisabledFn: (value: TabValue) => boolean
) => TabValue | null =
    (state: TabsState, startIdx: number, step: 1 | -1, isDisabledFn: (value: TabValue) => boolean): TabValue | null => {
        const length: number = state.tabOrder.length;
        if (length === 0) { return null; }
        let i: number = startIdx;
        if (step === 1) {
            for (; i < length; i++) {
                const id: TabValue | undefined = state.tabOrder[i as number];
                if (id === undefined) { continue; }
                if (!isTabDisabled(state, id, isDisabledFn)) { return id; }
            }
            return null;
        }
        for (; i >= 0; i--) {
            const id: TabValue | undefined = state.tabOrder[i as number];
            if (id === undefined) { continue; }
            if (!isTabDisabled(state, id, isDisabledFn)) { return id; }
        }
        return null;
    };

export const useTabsKeyboard: (
    state: TabsState,
    options: TabsOptions,
    orientation: 'horizontal' | 'vertical',
    selectValue: (value: TabValue, event: TabsChangeEvent['event']) => void,
    setFocused: (value: TabValue | null, event?: ReactKeyboardEvent) => void,
    getElement: (value: TabValue) => HTMLElement | null,
    isDisabledFn?: (value: TabValue) => boolean,
    hasTabClose?: (value: TabValue) => boolean,
    onTabClose?: (value: TabValue, event: Event | SyntheticEvent) => void
) => UseTabsKeyboardResult =
    (
        state: TabsState,
        options: TabsOptions,
        orientation: 'horizontal' | 'vertical',
        selectValue: (value: TabValue, event: TabsChangeEvent['event']) => void,
        setFocused: (value: TabValue | null, event?: ReactKeyboardEvent) => void,
        getElement: (value: TabValue) => HTMLElement | null,
        isDisabledFn: (value: TabValue) => boolean = (_value: TabValue): boolean => false,
        hasTabClose?: (value: TabValue) => boolean,
        onTabClose?: (value: TabValue, event: Event | SyntheticEvent) => void
    ): UseTabsKeyboardResult => {
        const { selectOnFocus = false, loopFocus = true } = options;

        const getElementRef: RefObject<(value: TabValue) => HTMLElement | null> =
            useRef<(value: TabValue) => HTMLElement | null>(getElement);
        getElementRef.current = getElement;

        const isDisabledFnRef: RefObject<(value: TabValue) => boolean> = useRef<(value: TabValue) => boolean>(isDisabledFn);
        isDisabledFnRef.current = isDisabledFn;

        const hasTabCloseRef: RefObject<((value: TabValue) => boolean) | undefined> =
            useRef<((value: TabValue) => boolean) | undefined>(hasTabClose);
        hasTabCloseRef.current = hasTabClose;

        const onTabCloseRef: RefObject<((value: TabValue, event: Event | SyntheticEvent) => void) | undefined> =
            useRef<((value: TabValue, event: Event | SyntheticEvent) => void) | undefined>(onTabClose);
        onTabCloseRef.current = onTabClose;

        const checkDisabled: (value: TabValue) => boolean = useCallback((value: TabValue): boolean => isDisabledFnRef.current(value), []);

        const focusElement: (value: TabValue | null) => void = useCallback((value: TabValue | null): void => {
            if (value === null) { return; }
            const el: HTMLElement | null = getElementRef.current(value);
            if (el && typeof el.focus === 'function') {
                el.focus();
            }
        }, []);

        const moveFocus: (current: TabValue | null, direction: 'next' | 'prev' | 'first' | 'last') => TabValue | null
            = useCallback((current: TabValue | null, direction: 'next' | 'prev' | 'first' | 'last'): TabValue | null => {
                if (state.tabOrder.length === 0) { return null; }
                if (current === null) {
                    switch (direction) {
                    case 'last':
                        return findFirstEnabled(state, state.tabOrder.length - 1, -1, checkDisabled);
                    case 'first':
                        return findFirstEnabled(state, 0, 1, checkDisabled);
                    default:
                        return findFirstEnabled(state, 0, 1, checkDisabled);
                    }
                }
                const idx: number = state.tabOrder.indexOf(current);
                if (idx === -1) {
                    return findFirstEnabled(state, 0, 1, checkDisabled);
                }
                switch (direction) {
                case 'next': {
                    if (idx >= state.tabOrder.length - 1) {
                        return loopFocus ? findFirstEnabled(state, 0, 1, checkDisabled) : current;
                    }
                    const next: TabValue | null = findFirstEnabled(state, idx + 1, 1, checkDisabled);
                    if (next !== null) { return next; }
                    return loopFocus ? findFirstEnabled(state, 0, 1, checkDisabled) : current;
                }
                case 'prev': {
                    if (idx <= 0) {
                        return loopFocus ? findFirstEnabled(state, state.tabOrder.length - 1, -1, checkDisabled) : current;
                    }
                    const prev: TabValue | null = findFirstEnabled(state, idx - 1, -1, checkDisabled);
                    if (prev !== null) { return prev; }
                    return loopFocus ? findFirstEnabled(state, state.tabOrder.length - 1, -1, checkDisabled) : current;
                }
                case 'first':
                    return findFirstEnabled(state, 0, 1, checkDisabled);
                case 'last':
                    return findFirstEnabled(state, state.tabOrder.length - 1, -1, checkDisabled);
                default:
                    return current;
                }
            }, [state, loopFocus, checkDisabled]);

        const handleTabKeyDown: (value: TabValue) => (event: ReactKeyboardEvent) => void = useCallback((value: TabValue) =>
            (event: ReactKeyboardEvent): void => {
                if (checkDisabled(value)) {
                    event.preventDefault();
                    return;
                }
                const key: string = event.key;
                if (key === 'Delete' || key === 'Del' || key === 'Backspace') {
                    if (hasTabCloseRef.current && hasTabCloseRef.current(value)) {
                        event.preventDefault();
                        event.stopPropagation();
                        const nextTarget: TabValue | null = moveFocus(value, 'next') || moveFocus(value, 'prev');
                        if (nextTarget !== null && nextTarget !== value) {
                            setFocused(nextTarget);
                            focusElement(nextTarget);
                            if (selectOnFocus) {
                                selectValue(nextTarget, event);
                            }
                        }

                        if (onTabCloseRef.current) {
                            onTabCloseRef.current(value, event);
                        }
                        return;
                    }
                }

                const isHorizontal: boolean = orientation === 'horizontal';
                const prevKey: string = isHorizontal ? TAB_KEYS.ARROW_LEFT : TAB_KEYS.ARROW_UP;
                const nextKey: string = isHorizontal ? TAB_KEYS.ARROW_RIGHT : TAB_KEYS.ARROW_DOWN;

                if (key === prevKey) {
                    event.preventDefault();
                    const prev: TabValue | null = moveFocus(value, 'prev');
                    if (prev !== null && prev !== value && !checkDisabled(prev)) {
                        setFocused(prev, event);
                        focusElement(prev);
                        if (selectOnFocus) { selectValue(prev, event); }
                    }
                    return;
                }
                if (key === nextKey) {
                    event.preventDefault();
                    const next: TabValue | null = moveFocus(value, 'next');
                    if (next !== null && next !== value && !checkDisabled(next)) {
                        setFocused(next, event);
                        focusElement(next);
                        if (selectOnFocus) { selectValue(next, event); }
                    }
                    return;
                }
                if (key === TAB_KEYS.HOME) {
                    event.preventDefault();
                    const first: TabValue | null = moveFocus(value, 'first');
                    if (first !== null && !checkDisabled(first)) {
                        setFocused(first, event);
                        focusElement(first);
                        if (selectOnFocus) { selectValue(first, event); }
                    }
                    return;
                }
                if (key === TAB_KEYS.END) {
                    event.preventDefault();
                    const last: TabValue | null = moveFocus(value, 'last');
                    if (last !== null && !checkDisabled(last)) {
                        setFocused(last, event);
                        focusElement(last);
                        if (selectOnFocus) { selectValue(last, event); }
                    }
                    return;
                }
                if (key === TAB_KEYS.ENTER || key === TAB_KEYS.SPACE) {
                    event.preventDefault();
                    const target: TabValue = state.focusedValue !== null ? state.focusedValue : value;
                    if (checkDisabled(target)) {
                        return;
                    }
                    selectValue(target, event);
                    return;
                }
            }, [orientation, moveFocus, setFocused, selectValue, selectOnFocus, focusElement, checkDisabled]);

        return useMemo((): UseTabsKeyboardResult => ({ handleTabKeyDown, moveFocus }),
                       [handleTabKeyDown, moveFocus]);
    };
