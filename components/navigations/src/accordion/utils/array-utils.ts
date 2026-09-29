import type { AccordionPanelValue } from '../types';
import type { RegisteredPanel } from '../internal-types';

export const shallowEqual: (prev: AccordionPanelValue[], next: AccordionPanelValue[]) => boolean =
    (prev: AccordionPanelValue[], next: AccordionPanelValue[]): boolean => {
        if (prev === next) { return true; }
        if (prev.length !== next.length) { return false; }
        for (let i: number = 0; i < prev.length; i += 1) {
            if (prev[i as number] !== next[i as number]) {
                return false;
            }
        }
        return true;
    };

export const pushUnique: (values: AccordionPanelValue[], value: AccordionPanelValue) => AccordionPanelValue[] =
    (values: AccordionPanelValue[], value: AccordionPanelValue): AccordionPanelValue[] => {
        if (values.indexOf(value) >= 0) { return values; }
        const next: AccordionPanelValue[] = values.slice();
        next.push(value);
        return next;
    };

export const filterByAllowed: (
    values: AccordionPanelValue[],
    allowed: (value: AccordionPanelValue) => boolean
) => AccordionPanelValue[] =
    (values: AccordionPanelValue[], allowed: (value: AccordionPanelValue) => boolean): AccordionPanelValue[] => {
        const next: AccordionPanelValue[] = [];
        for (let i: number = 0; i < values.length; i += 1) {
            const candidate: AccordionPanelValue = values[i as number];
            if (allowed(candidate)) {
                next.push(candidate);
            }
        }
        return next;
    };

const isEnabled: (panel: RegisteredPanel | undefined) => boolean = (panel: RegisteredPanel | undefined): boolean =>
    Boolean(panel) && !(panel as RegisteredPanel).disabled;

export const nextEnabled: (
    order: Map<AccordionPanelValue, RegisteredPanel>,
    current: AccordionPanelValue
) => RegisteredPanel | undefined =
    (order: Map<AccordionPanelValue, RegisteredPanel>, current: AccordionPanelValue): RegisteredPanel | undefined => {
        let firstEnabled: RegisteredPanel | undefined;
        let firstAfterCurrent: RegisteredPanel | undefined;
        let currentEntry: RegisteredPanel | undefined;
        let currentPos: number = -1;
        let pos: number = 0;
        for (const panel of order.values()) {
            const isCurrent: boolean = currentPos === -1 && panel.value === current;
            if (isCurrent) {
                currentPos = pos;
                currentEntry = panel;
            } else if (isEnabled(panel)) {
                if (!firstEnabled) { firstEnabled = panel; }
                if (currentPos >= 0 && !firstAfterCurrent) { firstAfterCurrent = panel; }
            }
            pos += 1;
        }
        if (currentPos >= 0) {
            if (firstAfterCurrent !== undefined) { return firstAfterCurrent; }
            if (firstEnabled !== undefined) { return firstEnabled; }
            if (currentEntry !== undefined && isEnabled(currentEntry)) { return currentEntry; }
            return undefined;
        }
        return firstEnabled;
    };

export const prevEnabled: (
    order: Map<AccordionPanelValue, RegisteredPanel>,
    current: AccordionPanelValue
) => RegisteredPanel | undefined =
    (order: Map<AccordionPanelValue, RegisteredPanel>, current: AccordionPanelValue): RegisteredPanel | undefined => {
        let lastEnabled: RegisteredPanel | undefined;
        let lastBeforeCurrent: RegisteredPanel | undefined;
        let currentEntry: RegisteredPanel | undefined;
        let currentPos: number = -1;
        let pos: number = 0;
        for (const panel of order.values()) {
            const isCurrent: boolean = currentPos === -1 && panel.value === current;
            if (isCurrent) {
                currentPos = pos;
                lastBeforeCurrent = lastEnabled;
                currentEntry = panel;
            } else if (isEnabled(panel)) {
                lastEnabled = panel;
            }
            pos += 1;
        }
        if (currentPos >= 0) {
            if (lastBeforeCurrent !== undefined) { return lastBeforeCurrent; }
            if (lastEnabled !== undefined) { return lastEnabled; }
            if (currentEntry !== undefined && isEnabled(currentEntry)) { return currentEntry; }
            return undefined;
        }
        return lastEnabled;
    };

export const firstEnabled: (order: Map<AccordionPanelValue, RegisteredPanel>) => AccordionPanelValue | undefined =
    (order: Map<AccordionPanelValue, RegisteredPanel>): AccordionPanelValue | undefined => {
        for (const panel of order.values()) {
            if (isEnabled(panel)) { return panel.value; }
        }
        return undefined;
    };

export const lastEnabled: (order: Map<AccordionPanelValue, RegisteredPanel>) => AccordionPanelValue | undefined =
    (order: Map<AccordionPanelValue, RegisteredPanel>): AccordionPanelValue | undefined => {
        let last: RegisteredPanel | undefined;
        for (const panel of order.values()) {
            if (isEnabled(panel)) { last = panel; }
        }
        return last?.value;
    };

export const triggerId: (rootId: string, value: AccordionPanelValue) => string =
    (rootId: string, value: AccordionPanelValue): string => `${rootId}-trigger-${String(value)}`;


export const contentId: (rootId: string, value: AccordionPanelValue) => string =
    (rootId: string, value: AccordionPanelValue): string => `${rootId}-content-${String(value)}`;
