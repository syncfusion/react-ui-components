import { type FocusEvent, type FocusEventHandler, type MouseEvent, type MouseEventHandler, type SyntheticEvent, useCallback, useEffect, useMemo, useReducer, useRef, type HTMLAttributes, type RefObject } from 'react';
import { useStableId } from '@syncfusion/react-base';
import type { AccordionPanelValue, AccordionValue, UseAccordionOptions, UseAccordionReturn } from './types';
import type { RegisteredPanel } from './internal-types';
import { accordionReducer, initialReducerState } from './state/reducer';
import { pushUnique, shallowEqual, contentId, triggerId } from './utils/array-utils';
import { useAccordionKeyboard, UseAccordionKeyboardHandlers } from './hooks/use-accordion-keyboard';

/**
 * Specifies the public headless hook backing the Accordion component.
 *
 * An Accordion is a vertically stacked list of expandable panels where one or
 * more sections can be revealed to show additional content.
 *
 * @param {UseAccordionOptions} [options] - Optional configuration forwarded from the consumer.
 * @returns {UseAccordionReturn} The accordion state and prop getters.
 */
export const useAccordion: (options?: UseAccordionOptions) => UseAccordionReturn =
    (options?: UseAccordionOptions): UseAccordionReturn => {
        const publicOptions: UseAccordionOptions = options ?? {};
        const {
            value: controlledValue,
            defaultValue,
            onChange,
            multiple = false,
            openOnFocus = false,
            renderMode = 'Active',
            borderless = false
        } = publicOptions;

        const rootId: string = useStableId('sf-accordion');
        const rootRef: RefObject<HTMLDivElement | null> = useRef<HTMLDivElement | null>(null);

        const [state, dispatch] = useReducer(accordionReducer,
                                             undefined, (): { value: AccordionPanelValue[]; focusedValue?: AccordionPanelValue;
                                                 everOpened: AccordionPanelValue[] } => initialReducerState(
                                                 controlledValue === undefined ? (defaultValue ?? []) : []));

        const registryRef: RefObject<Map<AccordionPanelValue, RegisteredPanel>> =
            useRef<Map<AccordionPanelValue, RegisteredPanel>>(new Map<AccordionPanelValue, RegisteredPanel>());

        const isControlled: boolean = controlledValue !== undefined;

        const effectiveValue: AccordionValue = useMemo((): AccordionValue => {
            if (!isControlled || controlledValue === undefined) {
                return state.value;
            }
            const ids: Set<AccordionPanelValue> = new Set<AccordionPanelValue>();
            registryRef.current.forEach((_e: RegisteredPanel, k: AccordionPanelValue): void => { ids.add(k); });
            const next: AccordionValue = [];
            for (let i: number = 0; i < controlledValue.length; i += 1) {
                const candidate: AccordionPanelValue = controlledValue[i as number];
                if (ids.has(candidate)) {
                    next.push(candidate);
                }
            }
            return next;
        }, [isControlled, controlledValue, state.value]);

        const applyOpenChange: (next: AccordionValue, event?: SyntheticEvent) => void =
            useCallback((next: AccordionValue, event?: SyntheticEvent): void => {
                if (!isControlled) {
                    dispatch({ type: 'SET_VALUE', value: next });
                }
                onChange?.({ value: next, event });
            }, [isControlled, onChange]);

        const openOnFocusHelper: (target: AccordionPanelValue, event?: SyntheticEvent) => void =
            useCallback((target: AccordionPanelValue, event?: SyntheticEvent): void => {
                if (effectiveValue.indexOf(target) >= 0) { return; }
                if (!multiple) {
                    applyOpenChange([target], event);
                    return;
                }
                applyOpenChange(pushUnique(effectiveValue, target), event);
            }, [effectiveValue, multiple, applyOpenChange]);

        const toggle: (target: AccordionPanelValue, event?: SyntheticEvent) => void =
            useCallback((target: AccordionPanelValue, event?: SyntheticEvent): void => {
                if (registryRef.current.get(target)?.disabled) { return; }
                const open: boolean = effectiveValue.indexOf(target) >= 0;
                if (open) {
                    applyOpenChange(effectiveValue.filter((v: AccordionPanelValue): boolean => v !== target), event);
                    return;
                }
                if (!multiple) {
                    applyOpenChange([target], event);
                    return;
                }
                applyOpenChange(pushUnique(effectiveValue, target), event);
            }, [effectiveValue, multiple, applyOpenChange]);

        const focusPanel: (target: AccordionPanelValue | undefined) => void =
            useCallback((target: AccordionPanelValue | undefined): void => {
                if (target !== undefined) {
                    const entry: RegisteredPanel | undefined = registryRef.current.get(target);
                    entry?.triggerEl?.focus();
                }
                dispatch({ type: 'SET_FOCUSED', value: target });
            }, []);

        const getDisabled: (value: AccordionPanelValue) => boolean =
            (value: AccordionPanelValue): boolean => Boolean(registryRef.current.get(value)?.disabled);

        const shouldMount: (value: AccordionPanelValue) => boolean =
            (value: AccordionPanelValue): boolean => {
                const isOpen: boolean = effectiveValue.indexOf(value) >= 0;
                switch (renderMode) {
                case 'Active':
                    return isOpen;
                case 'Retained':
                    return isOpen || state.everOpened.indexOf(value) >= 0;
                case 'All':
                    return true;
                default:
                    return isOpen;
                }
            };

        const resolveOpenSet: (registered: Set<AccordionPanelValue>) => AccordionValue = useCallback(
            (registered: Set<AccordionPanelValue>): AccordionValue => {
                if (controlledValue !== undefined) {
                    const next: AccordionValue = [];
                    for (let i: number = 0; i < controlledValue.length; i += 1) {
                        const candidate: AccordionPanelValue = controlledValue[i as number];
                        if (registered.has(candidate)) {
                            next.push(candidate);
                        }
                    }
                    return next;
                }
                if (state.value.length > 0) {
                    return state.value;
                }
                if (defaultValue !== undefined) {
                    const seeded: AccordionValue = [];
                    for (let i: number = 0; i < defaultValue.length; i += 1) {
                        const candidate: AccordionPanelValue = defaultValue[i as number];
                        if (registered.has(candidate)) {
                            seeded.push(candidate);
                        }
                    }
                    return seeded;
                }
                return state.value;
            },
            [controlledValue, defaultValue]
        );

        useEffect((): void => {
            const ids: Set<AccordionPanelValue> = new Set<AccordionPanelValue>();
            registryRef.current.forEach((_entry: RegisteredPanel, key: AccordionPanelValue): void => {
                ids.add(key);
            });
            const next: AccordionValue = resolveOpenSet(ids);
            if (!shallowEqual(state.value, next)) {
                dispatch({ type: 'SET_VALUE', value: next });
            }
        }, [controlledValue, defaultValue]);

        useEffect((): void => {
            if (multiple || state.value.length <= 1) {
                return;
            }
            const last: AccordionPanelValue = state.value[state.value.length - 1] as AccordionPanelValue;
            applyOpenChange([last]);
        }, [multiple]);

        const handlers: UseAccordionKeyboardHandlers = useAccordionKeyboard({
            registryRef,
            onToggle: toggle,
            onFocusPanel: focusPanel
        });

        const onFocus: (target: AccordionPanelValue) => FocusEventHandler<HTMLDivElement> = useCallback(
            (target: AccordionPanelValue) => (e: FocusEvent<HTMLDivElement>): void => {
                focusPanel(target);
                if (openOnFocus) {
                    openOnFocusHelper(target, e);
                }
            },
            [focusPanel, openOnFocus, openOnFocusHelper]
        );

        const onBlur: (e: FocusEvent<HTMLDivElement>) => void = useCallback((e: FocusEvent<HTMLDivElement>): void => {
            const root: HTMLElement | null = rootRef.current;
            const next: EventTarget | null = e.relatedTarget;
            if (root && next && root.contains(next as Node)) {
                return;
            }
            focusPanel(undefined);
        }, [focusPanel, rootRef]);

        const onMouseDown: (target: AccordionPanelValue) => MouseEventHandler<HTMLDivElement> = useCallback(
            (target: AccordionPanelValue): MouseEventHandler<HTMLDivElement> => (e: MouseEvent<HTMLDivElement>): void => {
                toggle(target, e);
            }, [toggle]);


        const setTriggerRef: (value: AccordionPanelValue) => (el: HTMLButtonElement | null) => void =
            useCallback((value: AccordionPanelValue) =>
                (el: HTMLButtonElement | null): void => {
                    const existing: RegisteredPanel | undefined = registryRef.current.get(value);
                    if (!existing) {
                        return;
                    }
                    existing.triggerEl = el;
                }, []);

        const getPanelProps: (
            value: AccordionPanelValue,
            disabled?: boolean
        ) => HTMLAttributes<HTMLElement> = useCallback(
            (value: AccordionPanelValue, disabled?: boolean): HTMLAttributes<HTMLElement> => {
                const flag: boolean = Boolean(disabled);
                const existing: RegisteredPanel | undefined = registryRef.current.get(value);
                if (!existing) {
                    registryRef.current.set(value, { value, disabled: flag, triggerEl: null });
                } else if (existing.disabled !== flag) {
                    existing.disabled = flag;
                }
                const isOpen: boolean = effectiveValue.indexOf(value) >= 0;
                const props: Record<string, unknown> = {
                    'data-accordion-panel': true,
                    'data-panel': String(value),
                    'data-open': isOpen ? 'true' : 'false',
                    'data-disabled': flag ? 'true' : undefined,
                    'data-focused': state.focusedValue === value ? 'true' : 'false'
                };
                return props as HTMLAttributes<HTMLElement>;
            },
            [effectiveValue, state.focusedValue]
        );

        const getHeaderProps: (value: AccordionPanelValue) => HTMLAttributes<HTMLElement> = useCallback(
            (value: AccordionPanelValue): HTMLAttributes<HTMLElement> => {
                const isOpen: boolean = effectiveValue.indexOf(value) >= 0;
                const flag: boolean = getDisabled(value);
                const props: Record<string, unknown> = {
                    'data-accordion-header': true,
                    'data-open': isOpen ? 'true' : 'false',
                    'data-disabled': flag ? 'true' : undefined
                };
                return props as HTMLAttributes<HTMLElement>;
            },
            [effectiveValue, getDisabled]
        );

        const getTriggerProps: (value: AccordionPanelValue) => HTMLAttributes<HTMLDivElement> = useCallback(
            (value: AccordionPanelValue): HTMLAttributes<HTMLDivElement> => {
                const isOpen: boolean = effectiveValue.indexOf(value) >= 0;
                const flag: boolean = getDisabled(value);
                const props: Record<string, unknown> = {
                    'data-accordion-trigger': true,
                    'id': triggerId(rootId, value),
                    'role': 'button',
                    'aria-controls': contentId(rootId, value),
                    'aria-expanded': isOpen ? 'true' : 'false',
                    'aria-disabled': flag ? 'true' : undefined,
                    'tabIndex': flag ? -1 : 0,
                    'data-state': isOpen ? 'open' : 'closed',
                    'data-disabled': flag ? 'true' : undefined,
                    'onMouseDown': onMouseDown(value),
                    'onKeyDown': handlers.onKeyDown(value),
                    'onFocus': onFocus(value),
                    'onBlur': onBlur,
                    'ref': setTriggerRef(value)
                };
                return props as HTMLAttributes<HTMLDivElement>;
            },
            [effectiveValue, getDisabled, handlers, onFocus, onBlur, rootId, setTriggerRef, onMouseDown]
        );

        const getContentProps: (value: AccordionPanelValue) => HTMLAttributes<HTMLDivElement> = useCallback(
            (value: AccordionPanelValue): HTMLAttributes<HTMLDivElement> => {
                const isOpen: boolean = effectiveValue.indexOf(value) >= 0;
                const props: Record<string, unknown> = {
                    'data-accordion-content': true,
                    'id': contentId(rootId, value),
                    'role': 'region',
                    'aria-labelledby': triggerId(rootId, value)
                };
                if (renderMode === 'Retained' && !isOpen) {
                    props['hidden'] = true;
                }
                return props as HTMLAttributes<HTMLDivElement>;
            },
            [effectiveValue, renderMode, rootId]
        );

        const getIndicatorProps: (value: AccordionPanelValue) => HTMLAttributes<HTMLSpanElement> = useCallback(
            (value: AccordionPanelValue): HTMLAttributes<HTMLSpanElement> => {
                const isOpen: boolean = effectiveValue.indexOf(value) >= 0;
                const props: Record<string, unknown> = {
                    'data-accordion-indicator': true,
                    'aria-hidden': 'true',
                    'data-state': isOpen ? 'open' : 'closed'
                };
                return props as HTMLAttributes<HTMLSpanElement>;
            },
            [effectiveValue]
        );

        const isOpen: (value: AccordionPanelValue) => boolean =
            (value: AccordionPanelValue): boolean => effectiveValue.indexOf(value) >= 0;

        const openDispatch: (value: AccordionPanelValue) => void = useCallback(
            (value: AccordionPanelValue): void => {
                if (registryRef.current.get(value)?.disabled) { return; }
                const open: boolean = effectiveValue.indexOf(value) >= 0;
                if (!multiple) {
                    applyOpenChange(open ? [] : [value]);
                    return;
                }
                applyOpenChange(open
                    ? effectiveValue.filter((v: AccordionPanelValue): boolean => v !== value)
                    : pushUnique(effectiveValue, value));
            },
            [effectiveValue, multiple, applyOpenChange]
        );

        const closeDispatch: (value: AccordionPanelValue) => void = useCallback(
            (value: AccordionPanelValue): void => {
                if (effectiveValue.indexOf(value) < 0) { return; }
                applyOpenChange(effectiveValue.filter((v: AccordionPanelValue): boolean => v !== value));
            },
            [effectiveValue, applyOpenChange]
        );

        const rootProps: HTMLAttributes<HTMLDivElement> = useMemo(
            (): HTMLAttributes<HTMLDivElement> => {
                const props: Record<string, unknown> = {
                    'data-accordion-root': true,
                    'data-render-mode': renderMode,
                    'data-borderless': borderless,
                    'ref': rootRef
                };
                return props as HTMLAttributes<HTMLDivElement>;
            },
            [renderMode, borderless]
        );

        return {
            state: { value: effectiveValue, focusedValue: state.focusedValue },
            rootProps,
            rootRef,
            getPanelProps,
            getHeaderProps,
            getTriggerProps,
            getContentProps,
            getIndicatorProps,
            isOpen,
            open: openDispatch,
            close: closeDispatch,
            getDisabled,
            shouldMount
        };
    };
