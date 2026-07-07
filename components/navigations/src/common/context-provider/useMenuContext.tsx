import type { FocusHoverState, MenuSelectEvent, Orientation, SubmenuType } from '../../menu/types';
import { MenuItemRegistration } from '../hooks/useMenu';
import { Context, createContext, Dispatch, RefObject, SetStateAction, useContext } from 'react';
import { SubmenuRenderMode } from '../../menu';

/**
 * Internal context value for Menu and ContextMenu components
 *
 * @internal
 */
export interface MenuContextValue {
    config: {
        itemOnClick: boolean;
        orientation: Orientation;
        embedded?: boolean;
        isDeviceMode?: boolean;
        zIndex?: number;
        submenuRenderMode?: SubmenuRenderMode;
    };

    state: {
        openSubmenus: Array<SubmenuType>;
        setOpenSubmenus: Dispatch<SetStateAction<Array<SubmenuType>>>;
        pathStates: FocusHoverState;
        setPathStates: Dispatch<SetStateAction<FocusHoverState>>;
        parentPath: number[];
    };

    refs: {
        submenuRefs: RefObject<Map<string, HTMLElement | null>>;
        focusedItemRef: RefObject<HTMLLIElement | null>;
        menuItemsRef: RefObject<Map<string, MenuItemRegistration>>;
        portalContainerRef?: RefObject<HTMLElement | null>;
    };

    handlers: {
        onSelect?: (event: MenuSelectEvent) => void;
        onClose?: (event: Event) => void;
        openSubmenu: (parentIndexPath: number[], target: HTMLElement, triggerEvent?: Event) => void;
        handleBackNavigation: () => void;
        handleSubmenuOpen: (parentIndexPath: number[], target: HTMLElement, triggerEvent?: Event) => void;
        blurFocusedMenuElement: () => void;
    };
}

/**
 * Internal context for Menu and ContextMenu components
 *
 * @internal
 */
export const MenuContext: Context<MenuContextValue | undefined> = createContext<MenuContextValue | undefined>(undefined);


export const useMenuContext: () => MenuContextValue = (): MenuContextValue => {
    const context: MenuContextValue | undefined = useContext(MenuContext);

    if (context === undefined) {
        throw new Error(
            'useMenuContext must be used within Menu or ContextMenu component'
        );
    }

    return context;
};

