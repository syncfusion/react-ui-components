import { type KeyboardEvent, type RefObject, type SyntheticEvent } from 'react';
import type { AccordionPanelValue } from '../types';
import type { RegisteredPanel } from '../internal-types';
import { firstEnabled, lastEnabled, nextEnabled, prevEnabled } from '../utils/array-utils';

/**
 * @private
 */
export interface UseAccordionKeyboardOptions {
    registryRef: RefObject<Map<AccordionPanelValue, RegisteredPanel> | null>;
    onToggle: (target: AccordionPanelValue, event?: SyntheticEvent) => void;
    onFocusPanel: (target: AccordionPanelValue | undefined) => void;
}

/**
 * @private
 */
export interface UseAccordionKeyboardHandlers {
    onKeyDown: (value: AccordionPanelValue) => (e: KeyboardEvent<HTMLButtonElement>) => void;
}

export const useAccordionKeyboard: (options: UseAccordionKeyboardOptions) => UseAccordionKeyboardHandlers =
    (options: UseAccordionKeyboardOptions): UseAccordionKeyboardHandlers => {
        const { registryRef, onToggle, onFocusPanel } = options;

        const onKeyDown: (target: AccordionPanelValue) => (e: KeyboardEvent<HTMLButtonElement>) => void =
            (target: AccordionPanelValue) => (e: KeyboardEvent<HTMLButtonElement>): void => {
                const order: Map<AccordionPanelValue, RegisteredPanel> | undefined = registryRef.current ?? undefined;
                switch (e.key) {
                case 'ArrowDown': {
                    e.preventDefault();
                    if (!order) { return; }
                    const next: RegisteredPanel | undefined = nextEnabled(order, target);
                    if (!next) { return; }
                    onFocusPanel(next.value);
                    return;
                }
                case 'ArrowUp': {
                    e.preventDefault();
                    if (!order) { return; }
                    const prev: RegisteredPanel | undefined = prevEnabled(order, target);
                    if (!prev) { return; }
                    onFocusPanel(prev.value);
                    return;
                }
                case 'Home': {
                    e.preventDefault();
                    if (!order) { return; }
                    const first: AccordionPanelValue | undefined = firstEnabled(order);
                    if (first === undefined) { return; }
                    onFocusPanel(first);
                    return;
                }
                case 'End': {
                    e.preventDefault();
                    if (!order) { return; }
                    const last: AccordionPanelValue | undefined = lastEnabled(order);
                    if (last === undefined) { return; }
                    onFocusPanel(last);
                    return;
                }
                case 'Enter':
                case ' ': {
                    e.preventDefault();
                    onToggle(target, e);
                    return;
                }
                default:
                    return;
                }
            };

        return { onKeyDown };
    };
