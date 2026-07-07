import { useCallback, useEffect, KeyboardEvent, RefObject, Dispatch, SetStateAction, useRef } from 'react';
import { FocusHoverState, MenuSelectEvent, Orientation, SubmenuType } from '../../menu/types';
import type { MenuItemRegistration } from './useMenu';
import { swapRtlArrowKey, isPrintableKey, isValidItem } from '../utils/menu-keyboard-utils';
import { getAt, getLast, getFirst, getChildElement, getFirstEnabledIndex, getLastEnabledIndex, getNextEnabledIndex } from '../utils/menu-utils';

/**
 * Configuration options for the `useMenuKeyboard` hook.
 * All refs and callbacks are expected to be stable (created with `useRef` / `useCallback`).
 *
 * @private
 */
interface UseMenuKeyboardOptions {
    dir: string;
    orientation?: Orientation;
    parentRef: RefObject<HTMLUListElement | null>;
    submenuRefs: RefObject<Map<string, HTMLElement | null>>;
    hoverTimeoutRef: RefObject<number | null>;
    openSubmenus: Array<SubmenuType>;
    focusedItem: FocusHoverState;
    setFocusedItem: Dispatch<SetStateAction<FocusHoverState>>;
    getItemsByPath: (indexPath: number[]) => MenuItemRegistration[];
    openSubmenu: (parentIndexPath: number[], target: HTMLElement, triggerEvent?: Event) => void;
    openSubmenuImmediate: (parentIndexPath: number[], target: HTMLElement, triggerEvent?: Event) => void;
    handleBackNavigation: () => void;
    closeAllSubmenus: () => void;
    onSelect?: (args: MenuSelectEvent) => void;
    onClose?: (event: Event) => void;
}

/**
 * Return value of the `useMenuKeyboard` hook.
 *
 * @private
 */
interface UseMenuKeyboardReturn {
    handleKeyDown: (e: KeyboardEvent) => void;
}

export const useMenuKeyboard: (opts: UseMenuKeyboardOptions) => UseMenuKeyboardReturn =
    (opts: UseMenuKeyboardOptions): UseMenuKeyboardReturn => {

        const {
            dir,
            orientation,
            parentRef,
            submenuRefs,
            hoverTimeoutRef,
            openSubmenus,
            focusedItem,
            setFocusedItem,
            getItemsByPath,
            openSubmenu,
            openSubmenuImmediate,
            handleBackNavigation,
            closeAllSubmenus,
            onSelect,
            onClose
        } = opts;

        const rafIdRef: RefObject<number | null> = useRef<number | null>(null);

        const deferredFocusChild: (parentPath: number[], childSelector: 'first' | 'last') => void =
            useCallback((parentPath: number[], childSelector: 'first' | 'last'): void => {
                if (rafIdRef.current) {
                    cancelAnimationFrame(rafIdRef.current);
                }

                rafIdRef.current = window.requestAnimationFrame((): void => {
                    const childItems: MenuItemRegistration[] = getItemsByPath(parentPath);
                    if (childItems.length === 0) {
                        rafIdRef.current = null;
                        return;
                    }

                    const childIndex: number = childSelector === 'first'
                        ? getFirstEnabledIndex(childItems)
                        : getLastEnabledIndex(childItems);

                    if (childIndex >= 0) {
                        setFocusedItem({
                            focusedItems: [...parentPath, childIndex],
                            hoveredItems: null
                        });
                    }
                    rafIdRef.current = null;
                });
            }, [getItemsByPath, setFocusedItem]);

        const navigateToNextLevel: ( triggerEvent?: Event) => void =
            useCallback((triggerEvent?: Event): void => {
                const currentFocusedItem: number[] | null = focusedItem?.focusedItems;
                if (!currentFocusedItem || currentFocusedItem.length === 0) { return; }
                let targetElement: HTMLElement | null = null;
                if (openSubmenus.length > 0) {
                    const parentPath: number[] = currentFocusedItem.slice(0, -1);
                    const parentKey: string = parentPath.join('-');
                    const parentUl: HTMLElement | null = submenuRefs.current.get(parentKey) ?? null;
                    const parentIndex: number | undefined = getLast<number>(currentFocusedItem);
                    targetElement = parentIndex !== undefined ? getChildElement(parentUl, parentIndex) : null;
                } else {
                    const rootIndex: number | undefined = getFirst<number>(currentFocusedItem);
                    targetElement = rootIndex !== undefined ? getChildElement(parentRef.current, rootIndex) : null;
                }
                if (!targetElement) { return; }

                openSubmenuImmediate(currentFocusedItem, targetElement, triggerEvent);
                deferredFocusChild(currentFocusedItem, 'first');
            }, [focusedItem, openSubmenus, openSubmenu, openSubmenuImmediate, deferredFocusChild, getItemsByPath, setFocusedItem]);

        const navigateToPosition: (type: 'first' | 'last' | 'character', char?: string) => void =
            useCallback((type: 'first' | 'last' | 'character', char?: string): void => {
                const lastOpen: SubmenuType | undefined = getLast<SubmenuType>(openSubmenus);
                const activeItems: MenuItemRegistration[] = lastOpen ? getItemsByPath(lastOpen.parentIndex) : getItemsByPath([]);
                if (activeItems.length === 0) { return; }
                const currentPath: number[] = lastOpen ? [...lastOpen.parentIndex] : [];
                const focusedPath: number[] | null = focusedItem.focusedItems;
                const focusedLastIndex: number | undefined = focusedPath ? getLast<number>(focusedPath) : undefined;
                const currentIndex: number =
                    focusedPath && focusedPath.length === currentPath.length + 1 && focusedLastIndex !== undefined ? focusedLastIndex : -1;
                let targetIndex: number = -1;
                if (type === 'first') { targetIndex = activeItems.findIndex((item: MenuItemRegistration) => isValidItem(item)); }
                else if (type === 'last') {
                    targetIndex = activeItems.reduceRight((acc: number, item: MenuItemRegistration, idx: number): number =>
                        acc >= 0 ? acc : (isValidItem(item) ? idx : -1), -1);
                } else if (type === 'character') {
                    if (typeof char !== 'string') { return; }
                    const startIndex: number = Math.max(0, currentIndex + 1);
                    const searchOrder: MenuItemRegistration[] = [...activeItems.slice(startIndex), ...activeItems.slice(0, startIndex)];
                    const foundItem: MenuItemRegistration | undefined = searchOrder.find((entry: MenuItemRegistration) =>
                        isValidItem(entry) && !!entry.text && typeof entry.text === 'string' && entry.text.toLowerCase().startsWith(char));
                    if (foundItem) { targetIndex = activeItems.indexOf(foundItem); }
                }
                if (targetIndex >= 0) {
                    setFocusedItem((prev: FocusHoverState) =>
                        ({ focusedItems: [...currentPath, targetIndex], hoveredItems: prev?.hoveredItems || null }));
                }
            }, [openSubmenus, focusedItem, getItemsByPath, setFocusedItem]);

        const isSafeUrl: (url: string) => boolean = useCallback((url: string): boolean => {
            try {
                const parsed: URL = new URL(url, window.location.href);
                return parsed.protocol === 'https:' || parsed.protocol === 'http:';
            } catch {
                return false;
            }
        }, []);

        const activateItemUrl: (item: MenuItemRegistration, event: Event) => boolean =
            useCallback((item: MenuItemRegistration, event: Event): boolean => {
                if (!item.url) { return false; }
                if (!isSafeUrl(item.url)) { return false; }
                onClose?.(event);
                window.location.assign(item.url);
                return true;
            }, [onClose, isSafeUrl]);

        const focusParentLevel: () => void = useCallback((): void => {
            setFocusedItem((prev: FocusHoverState): FocusHoverState => {
                if (!prev.focusedItems || prev.focusedItems.length <= 1) {
                    return prev;
                }
                return {
                    focusedItems: prev.focusedItems.slice(0, -1), hoveredItems: prev.hoveredItems
                };
            });
        }, [setFocusedItem]);

        const navigateVertical: (direction: number) => void =
            useCallback((direction: number): void => {
                const lastOpen: SubmenuType | undefined = getLast<SubmenuType>(openSubmenus);
                const activeItems: MenuItemRegistration[] = lastOpen ? getItemsByPath(lastOpen.parentIndex) : getItemsByPath([]);
                if (activeItems.length === 0) { return; }
                const currentPath: number[] = lastOpen ? [...lastOpen.parentIndex] : [];
                const focusedPath: number[] | null = focusedItem.focusedItems;
                const focusedLastIndex: number | undefined = focusedPath ? getLast<number>(focusedPath) : undefined;
                const currentIndex: number | null =
                    focusedPath && focusedPath.length === currentPath.length + 1 && focusedLastIndex !== undefined ?
                        focusedLastIndex : null;
                const startIndex: number =
                    currentIndex === null ? (direction > 0 ? 0 : activeItems.length - 1) :
                        ((currentIndex + direction + activeItems.length) % activeItems.length);
                const nextIndex: number = (() => {
                    let candidateIndex: number = startIndex;
                    for (let checked: number = 0; checked < activeItems.length; checked++) {
                        const candidate: MenuItemRegistration | undefined = getAt<MenuItemRegistration>(activeItems, candidateIndex);
                        if (isValidItem(candidate)) { return candidateIndex; }
                        candidateIndex = (candidateIndex + direction + activeItems.length) % activeItems.length;
                    }
                    return -1;
                })();
                if (nextIndex === -1) { return; }
                setFocusedItem((prev: FocusHoverState) =>
                    ({ focusedItems: [...currentPath, nextIndex], hoveredItems: prev?.hoveredItems }));
            }, [openSubmenus, focusedItem, getItemsByPath, setFocusedItem]);

        const handleVerticalMenuKeyDown: (e: KeyboardEvent) => void =
            useCallback((e: KeyboardEvent): void => {
                const key: string = swapRtlArrowKey(e.key, dir);
                const lastOpen: SubmenuType | undefined = getLast<SubmenuType>(openSubmenus);
                const activeItems: MenuItemRegistration[] = lastOpen ? getItemsByPath(lastOpen.parentIndex) : getItemsByPath([]);
                if (key === 'Escape') {
                    e.preventDefault();
                    if (openSubmenus.length > 0) {
                        handleBackNavigation();
                        focusParentLevel();
                    } else {
                        onClose?.(e.nativeEvent);
                    }
                    return;
                }
                if (key === 'Enter' || key === ' ') {
                    if (activeItems.length === 0) { e.preventDefault(); return; }
                    const focusedPath: number[] | null = focusedItem.focusedItems;
                    const focusedLastIndex: number | undefined = focusedPath ? getLast<number>(focusedPath) : undefined;
                    const currentItem: MenuItemRegistration | undefined =
                        focusedLastIndex !== undefined ? getAt<MenuItemRegistration>(activeItems, focusedLastIndex) : undefined;
                    if (!currentItem) { e.preventDefault(); return; }
                    if (!currentItem?.hasChildren) {
                        e.preventDefault();
                        onSelect?.({ item: currentItem.props, event: e });
                        if (activateItemUrl(currentItem, e.nativeEvent)) { return; }
                        onClose?.(e.nativeEvent);
                        return;
                    }
                    navigateToNextLevel(e.nativeEvent);
                    e.preventDefault();
                    return;
                }
                if (key === 'ArrowUp') { e.preventDefault(); navigateVertical(-1); return; }
                if (key === 'ArrowDown') { e.preventDefault(); navigateVertical(1); return; }
                if (key === 'ArrowLeft') {
                    e.preventDefault();
                    focusParentLevel();
                    if (openSubmenus.length > 0) { handleBackNavigation(); }
                    return;
                }
                if (key === 'ArrowRight') { e.preventDefault(); navigateToNextLevel(e.nativeEvent); return; }
                if (key === 'Home') { e.preventDefault(); navigateToPosition('first'); return; }
                if (key === 'End') { e.preventDefault(); navigateToPosition('last'); return; }
                if (isPrintableKey(key)) { e.preventDefault(); navigateToPosition('character', key.toLowerCase()); return; }
            }, [openSubmenus, focusedItem, getItemsByPath, navigateToNextLevel, navigateVertical, navigateToPosition,
                handleBackNavigation, onClose, dir, activateItemUrl, focusParentLevel, onSelect]);

        const handleMenubarRootKeyDown: (e: KeyboardEvent) => void =
            useCallback((e: KeyboardEvent): void => {
                const key: string = swapRtlArrowKey(e.key, dir);
                const rootItems: MenuItemRegistration[] = getItemsByPath([]);
                const currentPath: number[] | null = focusedItem.focusedItems;
                const currentTopIndex: number = currentPath && currentPath.length === 1 ? currentPath[0] : -1;
                const currentTopItem: MenuItemRegistration | undefined =
                    currentTopIndex >= 0 ? getAt<MenuItemRegistration>(rootItems, currentTopIndex) : undefined;

                const openTopLevelSubmenu: (topIndex: number) => void = (topIndex: number): void => {
                    const topItem: MenuItemRegistration | undefined = getAt<MenuItemRegistration>(rootItems, topIndex);
                    const hasSubmenu: boolean = !!topItem && topItem.hasChildren;
                    if (!topItem || topItem.disabled || !hasSubmenu) { return; }

                    const targetElement: HTMLElement | null = getChildElement(parentRef.current, topIndex);
                    if (!targetElement) { return; }
                    openSubmenuImmediate([topIndex], targetElement, e.nativeEvent);
                    deferredFocusChild([topIndex], 'first');
                };

                if (key === 'Tab') {
                    if (openSubmenus.length > 0) { closeAllSubmenus(); }
                    setFocusedItem((prev: FocusHoverState) => ({ focusedItems: prev.focusedItems, hoveredItems: null }));
                    return;
                }

                if (key === 'ArrowLeft') {
                    e.preventDefault();
                    const startIndex: number = currentTopIndex >= 0 ? currentTopIndex : getFirstEnabledIndex(rootItems);
                    if (startIndex === -1) { return; }
                    const nextIndex: number = getNextEnabledIndex(rootItems, startIndex, -1);
                    if (openSubmenus.length > 0) { closeAllSubmenus(); openTopLevelSubmenu(nextIndex); return; }
                    setFocusedItem({ focusedItems: [nextIndex], hoveredItems: null });
                    return;
                }

                if (key === 'ArrowRight') {
                    e.preventDefault();
                    const startIndex: number = currentTopIndex >= 0 ? currentTopIndex : getFirstEnabledIndex(rootItems);
                    if (startIndex === -1) { return; }
                    const nextIndex: number = getNextEnabledIndex(rootItems, startIndex, 1);
                    if (openSubmenus.length > 0) { closeAllSubmenus(); openTopLevelSubmenu(nextIndex); return; }
                    setFocusedItem({ focusedItems: [nextIndex], hoveredItems: null });
                    return;
                }

                if (key === 'Home') { e.preventDefault(); navigateToPosition('first'); return; }
                if (key === 'End') { e.preventDefault(); navigateToPosition('last'); return; }
                if (key === 'ArrowDown') { e.preventDefault(); if (currentTopIndex >= 0) { openTopLevelSubmenu(currentTopIndex); } return; }

                if (key === 'ArrowUp') {
                    e.preventDefault();
                    if (currentTopItem && currentTopItem.hasChildren && currentTopIndex >= 0) {
                        const targetElement: HTMLElement | null = getChildElement(parentRef.current, currentTopIndex);
                        if (!targetElement) { return; }
                        openSubmenuImmediate([currentTopIndex], targetElement, e.nativeEvent);
                        deferredFocusChild([currentTopIndex], 'last');
                    }
                    return;
                }

                if (key === 'Enter' || key === ' ') {
                    e.preventDefault();
                    if (!currentTopItem || currentTopItem.disabled) { return; }
                    if (!currentTopItem.hasChildren) {
                        onSelect?.({ item: currentTopItem.props, event: e });
                        if (activateItemUrl(currentTopItem, e.nativeEvent)) { return; }
                        onClose?.(e.nativeEvent);
                        return;
                    }
                    openTopLevelSubmenu(currentTopIndex);
                    return;
                }

                if (key === 'Escape') {
                    e.preventDefault();
                    if (openSubmenus.length > 0) { closeAllSubmenus(); return; }
                    onClose?.(e.nativeEvent);
                    return;
                }

                if (isPrintableKey(key)) { e.preventDefault(); navigateToPosition('character', key.toLowerCase()); return; }
            }, [openSubmenus, focusedItem, onClose, navigateToPosition, openSubmenuImmediate,
                dir, closeAllSubmenus, activateItemUrl, deferredFocusChild, onSelect]);

        const handleKeyDown: (e: KeyboardEvent) => void =
            useCallback((e: KeyboardEvent): void => {
                if (hoverTimeoutRef.current) { clearTimeout(hoverTimeoutRef.current); hoverTimeoutRef.current = null; }
                const isHorizontal: boolean = orientation === Orientation.Horizontal;
                const isInsideSubmenu: boolean = !!focusedItem.focusedItems && focusedItem.focusedItems.length > 1;
                if (isHorizontal && !isInsideSubmenu) { handleMenubarRootKeyDown(e); return; }
                handleVerticalMenuKeyDown(e);
            }, [orientation, focusedItem, handleMenubarRootKeyDown, handleVerticalMenuKeyDown, onSelect, onClose]);

        useEffect(() => {
            return (): void => {
                if (rafIdRef.current) {
                    cancelAnimationFrame(rafIdRef.current);
                    rafIdRef.current = null;
                }
                if (hoverTimeoutRef.current) {
                    clearTimeout(hoverTimeoutRef.current);
                    hoverTimeoutRef.current = null;
                }
            };
        }, []);

        return { handleKeyDown };
    };
