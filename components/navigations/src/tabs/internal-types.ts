import { SyntheticEvent } from 'react';
import { TabValue, HeaderPlacement, TabCloseEvent } from './types';
import { RenderMode } from '..';


/**
 * @private
 */
export interface TabMeta {
    value: TabValue;
    element: HTMLElement | null;
    disabled: boolean;
    rect: DOMRect | null;
    closeable?: boolean;
    onClose?: (event: TabCloseEvent) => void;
}

/**
 * @private
 */
export interface TabsState {
    value: TabValue | null;
    focusedValue: TabValue | null;
    tabOrder: ReadonlyArray<TabValue>;
    tabCount: number;
}

/**
 * @private
 */
export type TabsAction =
    | { type: 'SET_VALUE'; value: TabValue; event?: Event | SyntheticEvent }
    | { type: 'SET_FOCUSED'; value: TabValue | null; event?: SyntheticEvent }
    | { type: 'REGISTER_TAB'; value: TabValue }
    | { type: 'UNREGISTER_TAB'; value: TabValue }
    | { type: 'SET_DEFAULT'; value: TabValue | null };

/**
 * @private
 */
export interface TabsRootConfig {
    unstyled: boolean;
    selectOnFocus: boolean;
    loopFocus: boolean;
    headerPlacement: HeaderPlacement;
    renderMode: RenderMode;
}
