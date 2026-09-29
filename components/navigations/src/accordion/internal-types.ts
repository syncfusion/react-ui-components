import type { Dispatch } from 'react';
import type { AccordionPanelValue, UseAccordionReturn } from './types';

/**
 * Specifies the per-panel entry recorded in the hook's registry.
 *
 * @private
 */
export interface RegisteredPanel {
    /**
     * Specifies the panel identity.
     */
    value: AccordionPanelValue;

    /**
     * Specifies whether the panel is currently disabled.
     */
    disabled: boolean;

    /**
     * Specifies the live trigger host element for keyboard focus.
     */
    triggerEl: HTMLButtonElement | null;
}

/**
 * Specifies the payload exposed via `AccordionContext`.
 *
 * @private
 */
export interface AccordionContextValue {
    /**
     * Specifies the hook return to read getters from.
     */
    hook: UseAccordionReturn;

    /**
     * Specifies a read-only selector proxying to the hook's registry.
     */
    getDisabled: (value: AccordionPanelValue) => boolean;

    /**
     * Specifies the mount predicate used by `<AccordionContent>`.
     */
    shouldMount: (value: AccordionPanelValue) => boolean;

    /**
     * Specifies whether the styled component should omit its default classes
     *
     * @default false
     */
    unstyled?: boolean;
}

/**
 * Specifies the value emitted on `AccordionItemContext`.
 *
 * @private
 */
export interface AccordionItemContextValue {
    /**
     * Specifies the panel value owning this row.
     */
    value: AccordionPanelValue;

    /**
     * Specifies the panel disabled flag at authoring time.
     */
    disabled: boolean;
}

/**
 * Specifies the dispatch surface exposed to the keyboard handler.
 *
 * @private
 */
export type AccordionDispatch = Dispatch<ReducerAction>;

/**
 * Specifies the reducer state shape (`{ value, focusedValue, everOpened }`).
 *
 *
 * @private
 */
export interface ReducerState {
    /**
     * Specifies the resolved open-set.
     */
    value: AccordionPanelValue[];

    /**
     * Specifies the panel value whose trigger is keyboard-focused.
     */
    focusedValue?: AccordionPanelValue;

    /**
     * Specifies the deduped list of panel values that have ever joined `value`.
     */
    everOpened: AccordionPanelValue[];
}

/**
 * Specifies the reducer action discriminated union.
 *
 * @private
 */
export type ReducerAction =
    | { type: 'SET_FOCUSED'; value?: AccordionPanelValue }
    | { type: 'SET_VALUE'; value: AccordionPanelValue[] };
