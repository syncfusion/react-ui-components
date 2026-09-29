import { createContext, useContext, useMemo, ReactNode, Context, RefObject, SyntheticEvent, MouseEvent as ReactMouseEvent, KeyboardEvent as ReactKeyboardEvent, HTMLAttributes, RefAttributes, Dispatch, FocusEvent as ReactFocusEvent } from 'react';
import { TabValue, TabsChangeEvent, TabsFocusEvent, HeaderPlacement, TabOverflowMode, TabVariant, UseTabContainerProps, UseTabIndicatorProps, UseTabsRootProps, TabCloseEvent } from './types';
import { TabProps } from './rendering/tab';
import { TabPanelProps } from './rendering/tab-panel';
import { TabsState, TabsAction, TabMeta } from './internal-types';
import { RenderMode } from '..';

export interface TabsContextValue {

    state: TabsState;
    unstyled: boolean;
    selectOnFocus: boolean;
    loopFocus: boolean;
    headerPlacement: HeaderPlacement;
    renderMode: RenderMode;

    overflowMode: TabOverflowMode;
    scrollStep: number | null;
    variant: TabVariant;

    onValueChange: ((e: TabsChangeEvent) => void) | undefined;
    onFocusChange: ((e: TabsFocusEvent) => void) | undefined;
    onTabClose: ((value: TabValue, event: Event | SyntheticEvent) => void) | undefined;
    selectValue: (value: TabValue, event: Event | SyntheticEvent) => void;
    setFocused: (value: TabValue | null, event?: SyntheticEvent) => void;
    handleTabClick: (value: TabValue) => (event: ReactMouseEvent) => void;
    handleTabKeyDown: (value: TabValue) => (event: ReactKeyboardEvent) => void;
    handleTabFocus: (value: TabValue) => (event: ReactFocusEvent<HTMLDivElement>) => void;

    registerTab: (meta: TabMeta) => () => void;
    isItemActive: (value: TabValue) => boolean;
    isItemFocused: (value: TabValue) => boolean;
    isItemDisabled: (value: TabValue) => boolean;

    getTabProps: (value: TabValue, props?: TabProps) => HTMLAttributes<HTMLDivElement> & RefAttributes<HTMLDivElement>;
    getPanelProps: (value: TabValue, props?: TabPanelProps) => HTMLAttributes<HTMLDivElement> & RefAttributes<HTMLDivElement>;
    getTabListProps: (props?: UseTabContainerProps) => HTMLAttributes<HTMLDivElement> & RefAttributes<HTMLDivElement>;
    getTabPanelsProps: (props?: UseTabContainerProps) => HTMLAttributes<HTMLDivElement>;
    getTabIndicatorProps: (props: UseTabIndicatorProps) => HTMLAttributes<HTMLDivElement>;
    getTabsRootProps: (props: UseTabsRootProps) => HTMLAttributes<HTMLDivElement>;
    getTabMenuItemProps: (value: TabValue, props?: { className?: string; style?: unknown }) =>
    HTMLAttributes<HTMLButtonElement> & RefAttributes<HTMLButtonElement>;
    listRef: RefObject<HTMLDivElement | null>;
    hasIndicator: boolean;
    setHasIndicator: (has: boolean) => void;
    popupOpen: boolean;
    setPopupOpen: (open: boolean) => void;
    getOverflowTriggerProps: () => Omit<HTMLAttributes<HTMLButtonElement>, 'color'> & { type: 'button' };
    getOverflowPopupProps: () => HTMLAttributes<HTMLDivElement>;
    getOverflowItemProps: (value: TabValue) => Omit<HTMLAttributes<HTMLButtonElement>, 'color'> & { type: 'button' };
    dispatch: Dispatch<TabsAction>;
    getTabCloseButtonProps: (
        value: TabValue,
        onClose?: (event: TabCloseEvent) => void
    ) => Omit<HTMLAttributes<HTMLButtonElement>, 'color'> & { type: 'button' };
}

export const TabsContext: Context<TabsContextValue | undefined> = createContext<TabsContextValue | undefined>(undefined);

export const useTabsContext: () => TabsContextValue = (): TabsContextValue => {
    const ctx: TabsContextValue | undefined = useContext(TabsContext);
    if (ctx === undefined) {
        throw new Error('useTabsContext must be used within a Tabs component.');
    }
    return ctx;
};

export interface TabsProviderProps {
    value: TabsContextValue;
    children: ReactNode;
}

export const TabsProvider: (props: TabsProviderProps) => ReactNode = (props: TabsProviderProps): ReactNode => {
    const memoValue: TabsContextValue = useMemo((): TabsContextValue => props.value, [props.value]);
    return (
        <TabsContext.Provider value={memoValue}>
            {props.children}
        </TabsContext.Provider>
    );
};
