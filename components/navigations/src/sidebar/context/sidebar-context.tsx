import { createContext, Dispatch, SetStateAction, useContext, type Context } from 'react';
import { SidebarHookReturn } from '../sidebar';
import { UseSidebarReturn } from '../types';

export interface ISidebarContext {
    useSidebarState: SidebarHookReturn | null;
    setSidebarState: Dispatch<SetStateAction<UseSidebarReturn | null>>;
    unstyled: boolean;
    setUnstyled: Dispatch<SetStateAction<boolean>>;
}

export const SidebarContext: Context<ISidebarContext | undefined> =
    createContext<ISidebarContext | undefined>(undefined);

export function useSidebarContext(): ISidebarContext | undefined {
    return useContext(SidebarContext);
}
