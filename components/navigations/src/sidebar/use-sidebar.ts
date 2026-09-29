import { RefObject, useCallback, useEffect, useMemo, useRef, type KeyboardEventHandler, type SyntheticEvent } from 'react';
import { useControlledState } from './hooks/use-controlled-state';
import { useSidebarClickOutside } from './hooks/use-sidebar-click-outside';
import { getZindexPartial } from '@syncfusion/react-popups';
import type { SidebarChangeEvent, SidebarTransition, UseSidebarProps, UseSidebarReturn, UseSidebarState } from './types';
import { SIDEBAR_CSS_VARS, SIDEBAR_DEFAULTS, SIDEBAR_STATE_MODE, SIDEBAR_ZINDEX_BASE, SIDEBAR_ZINDEX_GAP } from './constants';
import { formatUnit } from '@syncfusion/react-base';

const resolveTransition: (
    transition: SidebarTransition | undefined
) => { enter: number; exit: number } = (
    transition: SidebarTransition | undefined
): { enter: number; exit: number } => {
    return {
        enter: typeof transition?.enter === 'number'
            ? transition.enter
            : SIDEBAR_DEFAULTS.TRANSITION_MS,
        exit: typeof transition?.exit === 'number'
            ? transition.exit
            : SIDEBAR_DEFAULTS.TRANSITION_MS
    };
};

const FOCUSABLE_SELECTOR: string = [
    'a[href]',
    'area[href]',
    'button:not([disabled])',
    'input:not([disabled]):not([type="hidden"])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    'iframe',
    'object',
    'embed',
    'audio[controls]',
    'video[controls]',
    '[contenteditable="true"]',
    '[tabindex]:not([tabindex="-1"])'
].join(',');

const getFocusableElements: (root: HTMLElement) => HTMLElement[] = (
    root: HTMLElement
): HTMLElement[] => Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
    .filter((el: HTMLElement): boolean => el.tabIndex !== -1);

const useSidebarKeyboard: (
    open: boolean,
    onOpenChange: (event: SidebarChangeEvent) => void
) => KeyboardEventHandler<HTMLDivElement> = (
    open: boolean, onOpenChange: (event: SidebarChangeEvent) => void
): KeyboardEventHandler<HTMLDivElement> => {
    return useCallback<KeyboardEventHandler<HTMLDivElement>>(
        (e: React.KeyboardEvent<HTMLDivElement>): void => {
            if (!open) { return; }
            const root: HTMLElement = e.currentTarget;
            switch (e.key) {
            case 'Escape': {
                e.preventDefault();
                e.stopPropagation();
                onOpenChange({ open: false, event: e });
                return;
            }
            case 'Tab': {
                const focusableElements: HTMLElement[] = getFocusableElements(root);
                if (!focusableElements.length) { return; }
                e.preventDefault();
                e.stopPropagation();
                const currentElement: HTMLElement | null =
                    document.activeElement as HTMLElement | null;
                const currentIndex: number = currentElement
                    ? focusableElements.indexOf(currentElement)
                    : -1;
                const nextIndex: number = e.shiftKey
                    ? (currentIndex <= 0 ? focusableElements.length - 1 : currentIndex - 1)
                    : (currentIndex >= focusableElements.length - 1 ? 0 : currentIndex + 1);
                focusableElements[nextIndex as number]?.focus();
                return;
            }
            default:
                return;
            }
        },
        [open, onOpenChange]
    );
};

const clampedZIndex: (anchor: HTMLElement | null, base: number) => number =
    (anchor: HTMLElement | null, base: number): number => {
        if (!anchor || typeof window === 'undefined') { return base; }
        return Math.min(Math.max(getZindexPartial(anchor), base), base);
    };

/**
 * Specifies the headless hook for building a sidebar.
 * It returns the sidebar state and props needed to wire your own UI.
 * Styling, layout, and ARIA are fully controlled by the consumer.
 *
 * ```tsx
 * import * as React from 'react';
 * import { useSidebar } from "@syncfusion/react-navigations";
 *
 * export function SidebarExample() {
 *   const [open, setOpen] = React.useState(false);
 *
 *   const sidebar = useSidebar({
 *     open,
 *     onOpenChange: (e) => setOpen(e.open),
 *     position: 'Left',
 *     mode: 'Over',
 *   });
 *
 *   return (
 *     <>
 *       <button {...sidebar.triggerProps}>
 *         Toggle Sidebar
 *       </button>
 *
 *       <div {...sidebar.rootProps}>
 *         Sidebar content
 *       </div>
 *     </>
 *   );
 * }
 *
 * ```
 * @private
 * @param {UseSidebarProps} [props] - Optional configuration for the sidebar. May be omitted for fully uncontrolled usage.
 * @returns {UseSidebarReturn} The sidebar state and the prop getters needed to render a custom UI.
 */
export const useSidebar: (props?: UseSidebarProps) => UseSidebarReturn =
    (props?: UseSidebarProps): UseSidebarReturn => {
        const publicProps: UseSidebarProps = props ?? {};
        const {
            open: controlledOpen,
            defaultOpen = false,
            onOpenChange,
            position = 'Left',
            mode = 'Push',
            backdrop = false,
            closeOnDocumentClick = true,
            transition,
            dockable = false,
            dockableWidth = `${SIDEBAR_DEFAULTS.DOCK_WIDTH}px`,
            style,
            mediaQuery = '',
            rootRef
        } = publicProps;

        const [open, setOpen] = useControlledState<boolean>(controlledOpen, defaultOpen);
        const resolvedDockWidth: string = dockableWidth.trim()
            ? dockableWidth
            : `${SIDEBAR_DEFAULTS.DOCK_WIDTH}px`;
        const resolvedWidth: string | number | undefined = dockable ? resolvedDockWidth : style?.width;
        const resolvedTransition: Required<SidebarTransition> =
            useMemo(() => resolveTransition(transition), [transition]);
        const dataPositionView: 'left' | 'right' = position === 'Right' ? 'right' : 'left';
        const view: 'over' | 'push' = mode === 'Push' ? SIDEBAR_STATE_MODE.PUSH : SIDEBAR_STATE_MODE.OVER;
        const resolvedBackdrop: boolean = open && backdrop;
        const onChangeRef: RefObject<((event: SidebarChangeEvent) => void) | null> = useRef(null);
        const openRef: RefObject<boolean | null> = useRef(null);
        onChangeRef.current = onOpenChange ?? null;
        openRef.current = open;

        useEffect(() => {
            if (!mediaQuery || typeof window === 'undefined' || window === null) {
                return;
            }

            const mediaQueryList: MediaQueryList = window.matchMedia(mediaQuery);
            const handleMediaQueryChange: (event: MediaQueryListEvent | MediaQueryList)
            => void = (event: MediaQueryListEvent | MediaQueryList) => {
                const nextOpen: boolean = event.matches;
                if (nextOpen === openRef.current) {
                    return;
                }
                handleChange({
                    open: nextOpen,
                    event: event instanceof Event ? event : undefined
                });
            };

            handleMediaQueryChange(mediaQueryList);
            if (mediaQueryList.addEventListener) {
                mediaQueryList.addEventListener('change', handleMediaQueryChange);
            } else {
                mediaQueryList.addListener(handleMediaQueryChange);
            }
            return (): void => {
                if (mediaQueryList.removeEventListener) {
                    mediaQueryList.removeEventListener('change', handleMediaQueryChange);
                } else {
                    mediaQueryList.removeListener(handleMediaQueryChange);
                }
            };
        }, [mediaQuery]);

        const handleChange: (event: SidebarChangeEvent) => void = useCallback(
            (event: SidebarChangeEvent): void => {
                if (event.open === openRef.current) { return; }
                onChangeRef.current?.(event);
                setOpen(event.open);
            },
            [setOpen]
        );

        const onKeyDown: KeyboardEventHandler<HTMLDivElement> = useSidebarKeyboard(open, handleChange);

        useSidebarClickOutside({
            rootRef,
            open,
            closeOnDocumentClick,
            onOpenChange: handleChange
        });

        useEffect(() => {
            if (!open) {
                return;
            }
            const root: HTMLDivElement | null = rootRef?.current ?? null;
            if (!root) {
                return;
            }
            const focusableElements: HTMLElement[] = getFocusableElements(root);
            if (focusableElements.length > 0) {
                focusableElements[0].focus({ preventScroll: true });
            }
        }, [open, rootRef]);

        const sidebarZIndex: number = useMemo(
            (): number => clampedZIndex(rootRef?.current?.parentElement ?? null, SIDEBAR_ZINDEX_BASE),
            [open, rootRef]
        );
        const backdropZIndex: number = useMemo(
            (): number => Math.max(1, sidebarZIndex - SIDEBAR_ZINDEX_GAP),
            [sidebarZIndex]
        );

        const onTriggerMouseDown: (event: React.MouseEvent<HTMLButtonElement>) => void =
            useCallback((event: React.MouseEvent<HTMLButtonElement>): void => {
                event.nativeEvent.stopImmediatePropagation();
                event.stopPropagation();
            }, []);

        const onTriggerClick: (event: React.MouseEvent<HTMLButtonElement>) => void =
            useCallback((event: React.MouseEvent<HTMLButtonElement>): void => {
                event.stopPropagation();
                handleChange({ open: !open, event });
            }, [open, handleChange]);

        const triggerProps: UseSidebarReturn['triggerProps'] = useMemo(() => ({
            onMouseDown: onTriggerMouseDown,
            onClick: onTriggerClick,
            type: 'button' as const
        }), [onTriggerMouseDown, onTriggerClick]);

        const onBackdropClick: (event: React.MouseEvent<HTMLDivElement>) => void = useCallback(
            (event: React.MouseEvent<HTMLDivElement>): void => {
                event.stopPropagation();
                handleChange({ open: false, event: event.nativeEvent });
            },
            [handleChange]
        );

        const onCloseClick: (event: React.MouseEvent<HTMLButtonElement>) => void = useCallback(
            (event: React.MouseEvent<HTMLButtonElement>): void => {
                event.stopPropagation();
                handleChange({ open: false, event: event as unknown as SyntheticEvent });
            },
            [handleChange]
        );

        const rootProps: UseSidebarReturn['rootProps'] = useMemo(() => ({
            'data-open': (open ? 'true' : 'false') as 'true' | 'false',
            'data-position': dataPositionView,
            'data-mode': view,
            'data-dockable': dockable ? 'true' : 'false',
            onKeyDown,
            ref: rootRef,
            style: {
                zIndex: sidebarZIndex,
                [SIDEBAR_CSS_VARS.TRANSITION_ENTER]: `${resolvedTransition.enter}ms`,
                [SIDEBAR_CSS_VARS.TRANSITION_EXIT]: `${resolvedTransition.exit}ms`,
                ...(resolvedWidth !== undefined ? {
                    ...(dockable ? { width: resolvedDockWidth } : {}),
                    [SIDEBAR_CSS_VARS.WIDTH]: formatUnit(resolvedWidth),
                    ...(dockable ? { [SIDEBAR_CSS_VARS.DOCK_WIDTH]: resolvedDockWidth } : {})
                } : {})
            }
        }), [open, dataPositionView, view, onKeyDown, rootRef, sidebarZIndex, dockable, resolvedDockWidth,
            resolvedWidth, resolvedTransition.enter, resolvedTransition.exit]);

        const backdropProps: UseSidebarReturn['backdropProps'] = useMemo(() => ({
            'data-open': (open ? 'true' : 'false') as 'true' | 'false',
            'data-backdrop': 'true',
            onClick: onBackdropClick,
            style: { zIndex: backdropZIndex }
        }), [open, onBackdropClick, backdropZIndex]);

        const closeProps: UseSidebarReturn['closeProps'] = useMemo(() => ({
            onClick: onCloseClick,
            type: 'button' as const
        }), [onCloseClick]);

        const mainProps: UseSidebarReturn['mainProps'] = useMemo(() => ({
            style: {
                [SIDEBAR_CSS_VARS.TRANSITION_ENTER]: `${resolvedTransition.enter}ms`,
                [SIDEBAR_CSS_VARS.TRANSITION_EXIT]: `${resolvedTransition.exit}ms`
            }
        }), [resolvedTransition.enter, resolvedTransition.exit]);

        const state: UseSidebarState = {
            open,
            position: position,
            mode,
            backdrop: resolvedBackdrop,
            transition: resolvedTransition,
            dockable,
            dockableWidth: resolvedDockWidth,
            width: resolvedWidth,
            mediaQuery
        };

        const returnValue: UseSidebarReturn = {
            state,
            rootProps,
            triggerProps,
            backdropProps,
            closeProps,
            mainProps
        };

        return returnValue;
    };

export default useSidebar;
