import { RefObject, useRef } from 'react';
import { contextMenuModule, ContextMenuPanelRef } from '../types/context.interfaces';
import { ContextMenuPanelBase } from '../views/ContextMenuPanel';

const useContextMenu: () => contextMenuModule = (): contextMenuModule => {
    const contextMenuRef: RefObject<ContextMenuPanelRef> = useRef<ContextMenuPanelRef>(null);
    return { ContextMenuPanelBase, contextMenuRef };
};
export { useContextMenu as ContextMenuModule };
