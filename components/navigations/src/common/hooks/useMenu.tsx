import * as React from 'react';
import { useEffect, useLayoutEffect, useRef, useState, useCallback } from 'react';
import { calculatePosition, isCollide, fit } from '@syncfusion/react-popups';
import { Browser, Orientation, useProviderContext } from '@syncfusion/react-base';
import type { CommonMenuProps, SubmenuType, FocusHoverState } from '../../menu/types';
import { useMenuAnimation, useMenuPosition, useSubmenuPositionEffect } from '.';
import { useMenuKeyboard } from './useMenuKeyboard';
import { MenuItemProps } from '../components';
import { getBoundedHorizontalPosition, getBoundedVerticalPosition, getCollisionBoundary, getContainerPosition, isRootContainer } from '../utils';
import { SubmenuRenderMode } from '../../menu';
import { OffsetPosition } from '../../context-menu';

/**
 * Represents a registered menu item tracked by the menu system.
 * Stored in `menuItemsRef` and used for keyboard navigation, selection, and submenu resolution.
 *
 * @private
 */
export interface MenuItemRegistration {
    path: number[];
    element: HTMLLIElement;
    hasChildren: boolean;
    disabled: boolean;
    parentPath: number[];
    text?: string;
    url?: string;
    props: MenuItemProps
}

/**
 * Arguments accepted by the `useMenu` hook.
 * Extends `CommonMenuProps` (minus `items`) with runtime-only concerns such as open state and popup position.
 *
 * @private
 */
export interface UseMenuArgs extends Omit<CommonMenuProps, 'items'> {
    isOpen: boolean;
    popupPosition: { x: number; y: number };
    setPopupPosition?: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
    orientation?: Orientation;
    embedded?: boolean;
    container?: HTMLElement;
    submenuRenderMode?: SubmenuRenderMode;
}

/**
 * Return value of the `useMenu` hook.
 * Provides refs, state, and handlers that the Menu / ContextMenu component wires into the DOM.
 *
 * @private
 */
export interface UseMenuReturn {
    parentRef: React.RefObject<HTMLUListElement | null>;
    submenuRefs: React.RefObject<Map<string, HTMLElement | null>>;
    focusedItemRef: React.RefObject<HTMLLIElement | null>;
    menuItemsRef: React.RefObject<Map<string, MenuItemRegistration>>;
    openSubmenus: Array<SubmenuType>;
    setOpenSubmenus: React.Dispatch<React.SetStateAction<Array<SubmenuType>>>;
    pathStates: FocusHoverState;
    setPathStates: React.Dispatch<React.SetStateAction<FocusHoverState>>;
    handleSubmenuOpen: (parentIndexPath: number[], target: HTMLElement, triggerEvent?: Event) => void;
    handleBackNavigation: () => void;
    openSubmenu: (parentIndexPath: number[], target: HTMLElement, triggerEvent?: Event) => void;
    handleKeyDown: (e: React.KeyboardEvent) => void;
    closeAllSubmenus: () => void;
    getItemsByPath: (indexPath: number[]) => MenuItemRegistration[];
}

export const useMenu: (args: UseMenuArgs) => UseMenuReturn = (args: UseMenuArgs): UseMenuReturn => {
    const {
        hoverDelay,
        animation,
        onOpen,
        onClose,
        isOpen,
        popupPosition,
        setPopupPosition,
        orientation,
        embedded = false,
        container,
        submenuRenderMode,
        onSelect
    } = args;
    const isEmbedded: boolean = embedded === true;
    const parentRef: React.RefObject<HTMLUListElement | null> = useRef<HTMLUListElement | null>(null);
    const submenuRefs: React.RefObject<Map<string, HTMLElement | null>> = useRef<Map<string, HTMLElement | null>>(new Map());
    const hoverTimeoutRef: React.RefObject<number | null> = useRef<number | null>(null);
    const [openSubmenus, setOpenSubmenus] = useState<Array<SubmenuType>>([]);
    const [pathStates, setPathStates] = useState<FocusHoverState>({ focusedItems: null, hoveredItems: null });
    const focusedItemRef: React.RefObject<HTMLLIElement | null> = useRef<HTMLLIElement | null>(null);
    const menuItemsRef: React.RefObject<Map<string, MenuItemRegistration>> = useRef<Map<string, MenuItemRegistration>>(new Map());
    const lastPopupPositionRef: React.RefObject<{ x: number; y: number } | null> = useRef<{ x: number; y: number } | null>(null);
    const { dir } = useProviderContext();
    const { toLocalPosition, toPagePosition } = useMenuPosition({ parentRef, isPopup: !isEmbedded || submenuRenderMode === 'portal' });

    const closeAllSubmenus: () => void = useCallback((): void => {
        setOpenSubmenus([]);
        submenuRefs.current.clear();
    }, [setOpenSubmenus, submenuRefs]);

    useEffect((): (() => void) => {
        const rafHandle: number = window.requestAnimationFrame((): void => {
            if (!pathStates.focusedItems) {
                return;
            }
            const element: HTMLLIElement | null = focusedItemRef.current = menuItemsRef.current.get(pathStates.focusedItems.join('-'))?.element as HTMLLIElement;
            if (!element) { return; }
            const style: CSSStyleDeclaration = window.getComputedStyle(element);
            if (style.visibility === 'hidden' || style.display === 'none') { return; }
            element.focus();
        });
        return (): void => { window.cancelAnimationFrame(rafHandle); };
    }, [pathStates]);

    useEffect(() => {
        return () => {
            submenuRefs.current.clear();
            if (hoverTimeoutRef.current) {
                clearTimeout(hoverTimeoutRef.current);
                hoverTimeoutRef.current = null;
            }
        };
    }, []);

    const { applyAnimation, focusAfterOpen } = useMenuAnimation({ animation, isPopup: !isEmbedded, parentRef, focusedItemRef });

    useLayoutEffect((): void => {
        if (!isOpen || isEmbedded || orientation === Orientation.Horizontal) { return; }
        const rootEl: HTMLUListElement | null = parentRef.current;
        if (!rootEl) { return; }
        let left: number = popupPosition.x;
        let top: number = popupPosition.y;
        const collisionBoundary: HTMLElement = getCollisionBoundary(container);
        const menuWidth: number = rootEl.offsetWidth || 0;
        const collide: string[] = isCollide(rootEl, collisionBoundary, left, top);
        const isDefaultContainer: boolean = isRootContainer(container);
        const customRightCollision: boolean = !isDefaultContainer && menuWidth > 0 && collisionBoundary.clientWidth > 0 &&
            left + menuWidth > collisionBoundary.scrollLeft + collisionBoundary.clientWidth;
        if ((isDefaultContainer && (collide.includes('left') || collide.includes('right'))) || customRightCollision) {
            left = left - menuWidth;
        }
        if (isDefaultContainer && collide.includes('bottom')) {
            const fitBoundary: HTMLElement | null = isDefaultContainer ? null : collisionBoundary;
            const position: OffsetPosition = fit(rootEl, fitBoundary, { X: false, Y: true }, { top: top, left: left }) as OffsetPosition;
            top = position.top;
        }
        if (!isDefaultContainer) {
            left = getBoundedHorizontalPosition(left, rootEl, collisionBoundary);
            top = getBoundedVerticalPosition(top, rootEl, collisionBoundary);
        }
        if ((left !== popupPosition.x || top !== popupPosition.y) && Number.isFinite(left) && Number.isFinite(top)) {
            if (!lastPopupPositionRef.current || lastPopupPositionRef.current.x !== popupPosition.x ||
                lastPopupPositionRef.current.y !== popupPosition.y) {
                lastPopupPositionRef.current = { x: left, y: top };
                setPopupPosition?.({ x: left, y: top });
            }
        }
        applyAnimation(rootEl);
    }, [isOpen, isEmbedded, orientation, popupPosition.x, popupPosition.y, applyAnimation, setPopupPosition, container]);

    const getItemsByPath: (parentPath: number[]) => MenuItemRegistration[] = useCallback((parentPath: number[]): MenuItemRegistration[] => {
        if (!menuItemsRef.current) { return []; }

        const children: MenuItemRegistration[] = [];
        const parentPathKey: string = parentPath.join('-');

        menuItemsRef.current.forEach((registration: MenuItemRegistration) => {
            if (registration.parentPath.join('-') === parentPathKey) {
                children.push(registration);
            }
        });

        return children;
    }, [menuItemsRef]);

    const handleSubmenuOpen: (parentIndexPath: number[], target: HTMLElement, triggerEvent?: Event) => void = useCallback((
        parentIndexPath: number[], target: HTMLElement, triggerEvent?: Event): void => {
        if (!target || !parentRef.current) { return; }
        if (isEmbedded && triggerEvent) {
            onOpen?.(triggerEvent);
        }
        let left: number = popupPosition.x;
        let top: number = popupPosition.y;
        if (isEmbedded) {
            const isMenubarRootSubmenu: boolean = orientation === Orientation.Horizontal && parentIndexPath.length === 1;
            if (submenuRenderMode === 'portal' ) {
                const x: string = isMenubarRootSubmenu ? 'left' : dir === 'rtl' ? 'left' : 'right';
                const y: string = isMenubarRootSubmenu ? 'bottom' : 'top';
                const offset: OffsetPosition = calculatePosition(target, x, y);
                const localPosition: { x: number; y: number } = toLocalPosition({ x: offset.left, y: offset.top });
                left = localPosition.x;
                top = localPosition.y;
            } else {
                const containerEl: HTMLElement | null = parentRef.current?.parentElement ?? null;
                const containerRect: DOMRect = containerEl?.getBoundingClientRect() as DOMRect;
                const targetRect: DOMRect = target.getBoundingClientRect();
                if (isMenubarRootSubmenu) {
                    left = targetRect.left - containerRect.left;
                    top = targetRect.bottom - containerRect.top;
                } else {
                    left = dir === 'rtl' ? targetRect.left - containerRect.left : targetRect.right - containerRect.left;
                    top = targetRect.top - containerRect.top;
                }
            }
        } else if (!Browser.isDevice) {
            const offset: OffsetPosition = calculatePosition(target, dir === 'rtl' ? 'left' : 'right', 'top');
            const { x, y }: { x: number; y: number } = getContainerPosition(offset.left, offset.top, container);
            left = x;
            top = y;
        }
        const position: { x: number; y: number } = isEmbedded ? { x: left, y: top } : toLocalPosition({ x: left, y: top });
        setOpenSubmenus((prev: SubmenuType[]) => [
            ...prev.filter((submenu: SubmenuType) => submenu.parentIndex.length < parentIndexPath.length)
                .map((submenu: SubmenuType) => ({ ...submenu, isVisible: false })),
            {
                parentIndex: parentIndexPath, position: { x: position.x, y: position.y }, isVisible: true,
                currentTarget: target, positionChanged: false
            }
        ]);
        submenuRefs.current.clear();
    }, [getItemsByPath, onOpen, popupPosition.x, popupPosition.y, submenuRenderMode,
        isEmbedded, orientation, dir, toLocalPosition, getContainerPosition]);

    const openSubmenuImmediate: (parentIndexPath: number[], target: HTMLElement, triggerEvent?: Event) => void =
        useCallback((parentIndexPath: number[], target: HTMLElement, triggerEvent?: Event): void => {
            if (hoverTimeoutRef.current) { clearTimeout(hoverTimeoutRef.current); hoverTimeoutRef.current = null; }
            handleSubmenuOpen(parentIndexPath, target, triggerEvent);
        }, [handleSubmenuOpen]);

    const handleBackNavigation: () => void = useCallback((): void => {
        setOpenSubmenus((prev: SubmenuType[]) => {
            if (prev.length < 1) { return prev; }
            return prev.slice(0, prev.length - 1).map((submenu: SubmenuType, index: number) =>
                ({ ...submenu, isVisible: index === (prev.length - 2) }));
        });
        submenuRefs.current.clear();
    }, []);

    const openSubmenu: (parentIndexPath: number[], target: HTMLElement, triggerEvent?: Event) => void = useCallback((
        parentIndexPath: number[], target: HTMLElement, triggerEvent?: Event): void => {
        if (hoverTimeoutRef.current !== null) { clearTimeout(hoverTimeoutRef.current); hoverTimeoutRef.current = null; }
        if (hoverDelay === 0) {
            if (isEmbedded && (!target.isConnected || target.getClientRects().length === 0)) { return; }
            handleSubmenuOpen(parentIndexPath, target, triggerEvent);
            return;
        }
        hoverTimeoutRef.current = window.setTimeout((): void => {
            hoverTimeoutRef.current = null;
            if (isEmbedded && (!target.isConnected || target.getClientRects().length === 0)) { return; }
            handleSubmenuOpen(parentIndexPath, target, triggerEvent);
        }, hoverDelay);
    }, [hoverDelay, isEmbedded, handleSubmenuOpen]);

    const { handleKeyDown } = useMenuKeyboard({
        dir, orientation, parentRef, submenuRefs,
        hoverTimeoutRef, openSubmenus, focusedItem: pathStates, setFocusedItem: setPathStates, getItemsByPath, openSubmenu,
        openSubmenuImmediate, handleBackNavigation, closeAllSubmenus, onClose, onSelect
    });

    useSubmenuPositionEffect({
        openSubmenus, submenuRefs, layoutDir: dir, isEmbedded, orientation, parentRef,
        setOpenSubmenus, applyAnimation, focusAfterOpen, toLocalPosition, toPagePosition, container, submenuRenderMode
    });

    return {
        parentRef, submenuRefs, focusedItemRef, openSubmenus, setOpenSubmenus, pathStates, setPathStates,
        handleSubmenuOpen, handleBackNavigation, openSubmenu, handleKeyDown, closeAllSubmenus, menuItemsRef, getItemsByPath
    };
};
