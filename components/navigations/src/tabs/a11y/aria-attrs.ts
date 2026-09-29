import { TabValue } from '../types';
import { TabsState } from '../internal-types';

export interface TabAriaAttrs {
    role: 'tab';
    'data-collection': string;
    'data-key': string;
    id: string;
    'aria-selected': 'true' | 'false';
    'aria-controls'?: string;
    'aria-disabled'?: 'true';
    'data-selected'?: 'true';
    'data-focused'?: 'true';
    'data-disabled'?: 'true';
    tabIndex: 0 | -1;
}

export const buildTabAriaAttrs: (
    state: TabsState,
    value: TabValue,
    options: {
        idBase: string;
        disabled?: boolean;
    }
) => TabAriaAttrs =
    (state: TabsState, value: TabValue, options: { idBase: string; disabled?: boolean }): TabAriaAttrs => {
        const isActive: boolean = state.value === value;
        const isFocused: boolean = state.focusedValue === value;
        const isDisabled: boolean = options.disabled === true;
        const collection: string = options.idBase;
        const attrs: TabAriaAttrs = {
            role: 'tab',
            'data-collection': collection,
            'data-key': String(value),
            id: `${options.idBase}-tab-${String(value)}`,
            'aria-selected': isActive ? 'true' : 'false',
            tabIndex: isFocused || (isActive && state.focusedValue === null) ? 0 : -1
        };
        if (isActive) {
            attrs['aria-controls'] = `${options.idBase}-tabpanel-${String(value)}`;
            attrs['data-selected'] = 'true';
        }
        if (isFocused) {
            attrs['data-focused'] = 'true';
        }
        if (isDisabled) {
            attrs['aria-disabled'] = 'true';
            attrs['data-disabled'] = 'true';
        }
        return attrs;
    };

export interface TabPanelAriaAttrs {
    role: 'tabpanel';
    id: string;
    'aria-labelledby': string;
    hidden?: boolean;
    tabIndex?: 0;
    'data-active'?: 'true';
}

export const buildTabPanelAriaAttrs: (
    state: TabsState,
    value: TabValue,
    options: { idBase: string; mountState: 'mounted' | 'unmounted' }
) => TabPanelAriaAttrs =
    (state: TabsState, value: TabValue, options: { idBase: string; mountState: 'mounted' | 'unmounted' }): TabPanelAriaAttrs => {
        const isActive: boolean = state.value === value;
        const attrs: TabPanelAriaAttrs = {
            role: 'tabpanel',
            id: `${options.idBase}-tabpanel-${String(value)}`,
            'aria-labelledby': `${options.idBase}-tab-${String(value)}`
        };
        if (!isActive) {
            attrs.hidden = true;
        } else if (options.mountState === 'mounted') {
            attrs.tabIndex = 0;
            attrs['data-active'] = 'true';
        }
        return attrs;
    };
