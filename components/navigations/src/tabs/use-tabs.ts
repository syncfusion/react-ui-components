import { useCallback, useEffect, useMemo, useRef, MouseEvent as ReactMouseEvent, RefObject, useState, HTMLAttributes, RefAttributes, SyntheticEvent } from 'react';
import { TabValue, TabsProps, HeaderPlacement, TabsOptions, TabOverflowMode, TabVariant, TabCloseEvent, UseTabContainerProps, UseTabIndicatorProps, UseTabsGetters, UseTabsHelpers, UseTabsRootProps } from './types';
import { TabProps } from './rendering/tab';
import { TabsState, TabMeta } from './internal-types';
import { orientationFromPlacement } from './constants';
import { useTabsReducer } from './state/use-tabs-reducer';
import { useTabsKeyboard } from './state/use-tabs-keyboard';
import { useTabsIndicator } from './state/use-tabs-indicator';
import { buildTabAriaAttrs, buildTabPanelAriaAttrs } from './a11y/aria-attrs';
import { TabsContextValue } from './tabs-context';
import { useStableId } from '@syncfusion/react-base';

/**
 * Specifies the public return shape of the `useTabs` hook.
 *
 *  @private
 */
export interface UseTabsResult {

    /**
     * Specifies the pre-built props bag for the `TabsContext.Provider`.
     *
     */
    contextValue: TabsContextValue;

    /**
     * Specifies the current internal tabs state (active value, focused value, and cached metadata per registered tab).
     *
     */
    state: TabsState;

    /**
     * Specifies the ref attached to the tab-list container, used to measure layout and position the active-tab indicator.
     *
     */
    listRef: RefObject<HTMLDivElement | null>;

    /**
     * Specifies memoized DOM-prop getters that return the exact props (role, aria-*, onClick, ref, etc.) for each element to spread.
     *
     */
    getters: UseTabsGetters;

    /**
     * Specifies imperative helpers for keyboard shortcuts, programmatic navigation, and scroll-into-view.
     *
     */
    helpers: UseTabsHelpers;
}

/**
 * Specifies the options accepted by the `useTabs` hook.
 *
 * @private
 */
export interface UseTabOptions extends TabsProps {

    /**
     * Specifies the explicit id base for every id attribute in the tabs tree; falls back to a stable auto-generated id.
     *
     * @default -
     */
    id?: string;
}

export const useTabs: (options?: UseTabOptions) => UseTabsResult =
    (options: UseTabOptions = {
    }): UseTabsResult => {
        const reactId: string = useStableId('tabs');
        const idBase: string = options.id !== undefined ? options.id : `sf-tabs-${reactId.replace(/:/g, '')}`;

        const reducerOptions: TabsOptions = {
            defaultValue: options.defaultValue,
            value: options.value,
            onValueChange: options.onValueChange,
            onFocusChange: options.onFocusChange,
            selectOnFocus: options.selectOnFocus,
            loopFocus: options.loopFocus
        };
        const reducer: ReturnType<typeof useTabsReducer> = useTabsReducer(reducerOptions);
        const { state, dispatch, registry, selectValue, setFocused, registerTab } = reducer;

        const orientation: 'horizontal' | 'vertical' = orientationFromPlacement(options.headerPlacement || 'Top');

        const registryRef: RefObject<ReturnType<typeof useTabsReducer>['registry']> =  useRef(registry);

        useEffect(() => {
            registryRef.current = registry;
        }, [registry]);

        const tabOrderRef: { current: ReadonlyArray<TabValue> } = useRef<ReadonlyArray<TabValue>>(state.tabOrder);
        useEffect(() => {
            tabOrderRef.current = state.tabOrder;
        }, [state.tabOrder]);

        const getElementStable: (value: TabValue) => HTMLElement | null =
            useCallback((value: TabValue): HTMLElement | null => {
                const meta: TabMeta | undefined = registryRef.current.get(value);
                return meta ? meta.element : null;
            }, []);

        const [hasIndicator, setHasIndicator] = useState<boolean>(false);

        const indicator: ReturnType<typeof useTabsIndicator> = useTabsIndicator(
            state,
            getElementStable,
            hasIndicator,
            options.headerPlacement || 'Top'
        );

        const [popupOpen, setPopupOpen] = useState<boolean>(false);

        const isTabDisabled: (value: TabValue) => boolean = useCallback((value: TabValue): boolean => {
            const meta: TabMeta | undefined = registryRef.current.get(value);
            return !!(meta && meta.disabled);
        }, []);

        const hasTabClose: (value: TabValue) => boolean = useCallback((value: TabValue): boolean => {
            const meta: TabMeta | undefined = registryRef.current.get(value);
            if (!meta) {
                return false;
            }
            if (meta.disabled) {
                return false;
            }
            return meta.closeable === true;
        }, []);

        const onTabCloseStable: (value: TabValue, event: Event | SyntheticEvent) => void =
         useCallback((value: TabValue, event: Event | SyntheticEvent): void => {
             const meta: TabMeta | undefined = registryRef.current.get(value);
             const closeEvent: TabCloseEvent = { value, event: (event as SyntheticEvent).nativeEvent || event };
             if (meta && typeof meta.onClose === 'function') {
                 meta.onClose(closeEvent);
             }
             else if (options.onClose) {
                 options.onClose(closeEvent);
             }
         }, [options.onClose]);

        const keyboard: ReturnType<typeof useTabsKeyboard> = useTabsKeyboard(
            state,
            reducerOptions,
            orientation,
            selectValue,
            setFocused,
            getElementStable,
            isTabDisabled,
            hasTabClose,
            onTabCloseStable
        );

        const getTabMetaCached: (value: TabValue) => TabMeta | undefined =
            useCallback((value: TabValue): TabMeta | undefined => registry.get(value), [registry]);

        const handleTabClick: (value: TabValue) => (event: ReactMouseEvent) => void =
            useCallback((value: TabValue) => (event: ReactMouseEvent): void => {
                const meta: TabMeta | undefined = getTabMetaCached(value);
                if (meta && meta.disabled) { return; }
                selectValue(value, event);
            }, [selectValue, getTabMetaCached]);

        const handleTabFocus: (value: TabValue) => () => void =
            useCallback((value: TabValue) => (): void => {
                setFocused(value);
            }, [setFocused]);

        const getTabProps: (value: TabValue, props?: TabProps) => HTMLAttributes<HTMLDivElement> & RefAttributes<HTMLDivElement> =
            useCallback((value: TabValue, props?: TabProps): HTMLAttributes<HTMLDivElement> & RefAttributes<HTMLDivElement> => {
                const meta: TabMeta | undefined = registry.get(value);
                const disabled: boolean = !!(meta?.disabled || props?.disabled);
                const closeable: boolean = !disabled && (
                    typeof props?.onClose === 'function' ||
                    typeof options.onClose === 'function'
                );

                return {
                    ...buildTabAriaAttrs(state, value, { idBase, disabled }),
                    onClick: handleTabClick(value),
                    onKeyDown: keyboard.handleTabKeyDown(value),
                    onFocus: handleTabFocus(value),
                    ref: (el: HTMLElement | null): void => {
                        if (el) {
                            registerTab({
                                value,
                                element: el,
                                disabled,
                                rect: null,
                                closeable,
                                onClose: props?.onClose
                            });
                        } else {
                            registerTab({
                                value,
                                element: null,
                                disabled,
                                rect: null,
                                closeable: false
                            });
                        }
                    }
                };
            }, [state, idBase, handleTabClick, keyboard.handleTabKeyDown, handleTabFocus, registry, registerTab, options.onClose]);
        const getPanelProps: (value: TabValue) => HTMLAttributes<HTMLDivElement> =
            useCallback((value: TabValue): HTMLAttributes<HTMLDivElement> & RefAttributes<HTMLDivElement> => {
                const base: HTMLAttributes<HTMLDivElement> = buildTabPanelAriaAttrs(state, value, { idBase, mountState: 'mounted' });
                return { ...base };
            }, [state.value, state.focusedValue, idBase]);

        const getTabListProps: (props?: UseTabContainerProps) => HTMLAttributes<HTMLDivElement> & RefAttributes<HTMLDivElement> =
            useCallback((props?: UseTabContainerProps): HTMLAttributes<HTMLDivElement> & RefAttributes<HTMLDivElement> => {
                const orientationLocal: 'horizontal' | 'vertical' = orientationFromPlacement(options.headerPlacement || 'Top');
                const out: HTMLAttributes<HTMLDivElement> = {
                    role: 'tablist',
                    'data-collection': idBase,
                    'data-orientation': orientationLocal,
                    id: (props && props.id) ? props.id : `${idBase}-tablist`
                } as HTMLAttributes<HTMLDivElement>;
                if (orientationLocal === 'vertical') {
                    (out as Record<string, unknown>)['aria-orientation'] = 'vertical';
                }
                return out as unknown as HTMLAttributes<HTMLDivElement> & RefAttributes<HTMLDivElement>;
            }, [idBase, options.headerPlacement]);

        const getTabPanelsProps: (props?: UseTabContainerProps) => HTMLAttributes<HTMLDivElement> =
            useCallback((props?: UseTabContainerProps): HTMLAttributes<HTMLDivElement> => {
                return {
                    'data-collection': idBase,
                    id: (props && props.id) ? props.id : `${idBase}-tabpanels`
                } as HTMLAttributes<HTMLDivElement>;
            }, [idBase]);

        const getTabIndicatorProps: (props: UseTabIndicatorProps) => HTMLAttributes<HTMLDivElement> =
            useCallback((props: UseTabIndicatorProps): HTMLAttributes<HTMLDivElement> => {
                const placement: HeaderPlacement = props.placement;
                const orientationLocal: 'horizontal' | 'horizontal-bottom' | 'vertical' | 'vertical-right' =
                    placement === 'Bottom' ? 'horizontal-bottom'
                        : placement === 'Right' ? 'vertical-right'
                            : placement === 'Left' ? 'vertical'
                                : 'horizontal';
                return {
                    'data-orientation': orientationLocal,
                    'data-placement': placement,
                    id: (props.id !== null) ? props.id : `${idBase}-indicator`,
                    'aria-hidden': 'true'
                } as HTMLAttributes<HTMLDivElement>;
            }, [idBase]);

        const getTabsRootProps: (props: UseTabsRootProps) => HTMLAttributes<HTMLDivElement> =
            useCallback((props: UseTabsRootProps): HTMLAttributes<HTMLDivElement> => {
                const orientation: 'horizontal' | 'vertical' = orientationFromPlacement(props.placement);
                const out: HTMLAttributes<HTMLDivElement> = {
                    id: (props.id !== null) ? props.id : `sf-tabs-${idBase}`,
                    role: 'presentation',
                    'data-orientation': orientation,
                    'data-placement': props.placement
                } as HTMLAttributes<HTMLDivElement>;
                return out;
            }, [idBase]);

        const getTabMenuItemProps: (value: TabValue, props?: { className?: string; style?: unknown }) =>
        HTMLAttributes<HTMLButtonElement> & RefAttributes<HTMLButtonElement> =
            useCallback((value: TabValue, props?: { className?: string; style?: unknown }):
            HTMLAttributes<HTMLButtonElement> & RefAttributes<HTMLButtonElement> => {
                const meta: TabMeta | undefined = registry.get(value);
                const disabled: boolean = !!(meta && meta.disabled);
                return {
                    type: 'button',
                    role: 'menuitem',
                    'aria-disabled': disabled ? 'true' : undefined,
                    'data-key': String(value),
                    'data-value': String(value),
                    onClick: (event: ReactMouseEvent<HTMLButtonElement>): void => {
                        if (disabled) { return; }
                        event.preventDefault();
                        selectValue(value, event);
                    },
                    className: (props && props.className) || undefined,
                    style: (props && props.style as HTMLAttributes<HTMLButtonElement>['style']) || undefined
                } as unknown as HTMLAttributes<HTMLButtonElement> & RefAttributes<HTMLButtonElement>;
            }, [registry, selectValue]);

        const scrollToValue: (value: TabValue) => void = useCallback((value: TabValue): void => {
            const meta: TabMeta | undefined = registry.get(value);
            if (!meta || !meta.element) { return; }
            meta.element.scrollIntoView({ inline: 'nearest', block: 'nearest' });
        }, [registry]);

        const isItemActive: (value: TabValue) => boolean = useCallback(
            (value: TabValue): boolean => state.value === value,
            [state.value]
        );
        const isItemFocused: (value: TabValue) => boolean = useCallback(
            (value: TabValue): boolean => state.focusedValue === value,
            [state.focusedValue]
        );

        const rootConfig: {
            unstyled: boolean;
            selectOnFocus: boolean;
            loopFocus: boolean;
            headerPlacement: HeaderPlacement;
            renderMode: 'All' | 'Retained' | 'Active';
            overflowMode: TabOverflowMode;
            scrollStep: number | null;
            variant: TabVariant;
        } = useMemo(() => ({
            unstyled: options.unstyled === true,
            selectOnFocus: options.selectOnFocus === true,
            loopFocus: options.loopFocus !== false,
            headerPlacement: options.headerPlacement || 'Top',
            renderMode: options.renderMode || 'Active',
            overflowMode: (options.overflowMode || 'Scrollable') as TabOverflowMode,
            scrollStep: options.scrollStep === undefined ? null : options.scrollStep,
            variant: (options.variant || 'default') as TabVariant
        }), [
            options.unstyled, options.selectOnFocus, options.loopFocus,
            options.headerPlacement, options.renderMode,
            options.overflowMode, options.scrollStep, options.variant
        ]);


        const getTabCloseButtonProps: (
            value: TabValue,
            onClose?: (event: TabCloseEvent) => void
        ) => Omit<HTMLAttributes<HTMLButtonElement>, 'color'> & { type: 'button' } = useCallback(
            (
                value: TabValue,
                onClose?: (event: TabCloseEvent) => void
            ): Omit<HTMLAttributes<HTMLButtonElement>, 'color'> & { type: 'button' } => {
                return {
                    type: 'button',
                    'aria-label': 'Close',
                    onClick: (event: ReactMouseEvent<HTMLButtonElement>): void => {
                        event.stopPropagation();
                        event.preventDefault();
                        if (options.onClose) {
                            options.onClose({ value, event: event.nativeEvent });
                        } else if (onClose) {
                            onClose({ value, event: event.nativeEvent });
                        }
                    },
                    onMouseDown: (event: ReactMouseEvent<HTMLButtonElement>): void => {
                        event.stopPropagation();
                    }
                };
            },
            [options.onClose]
        );

        const getOverflowTriggerProps: () => Omit<HTMLAttributes<HTMLButtonElement>, 'color'> & { type: 'button' } = useCallback(
            (): Omit<HTMLAttributes<HTMLButtonElement>, 'color'> & { type: 'button' } => {
                return {
                    type: 'button',
                    'aria-haspopup': 'menu',
                    'aria-expanded': popupOpen ? 'true' : 'false',
                    'aria-label': 'More tabs',
                    onClick: (event: ReactMouseEvent<HTMLButtonElement>): void => {
                        event.stopPropagation();
                        setPopupOpen((v: boolean) => !v);
                    }
                };
            },
            [popupOpen]
        );

        const getOverflowPopupProps: () => HTMLAttributes<HTMLDivElement> = useCallback(
            (): HTMLAttributes<HTMLDivElement> => {
                return {
                    role: 'menu',
                    onMouseDown: (event: ReactMouseEvent<HTMLDivElement>): void => {
                        event.stopPropagation();
                    }
                };
            },
            []
        );

        const getOverflowItemProps: (value: TabValue) => Omit<HTMLAttributes<HTMLButtonElement>, 'color'> & { type: 'button' } = useCallback(
            (value: TabValue): Omit<HTMLAttributes<HTMLButtonElement>, 'color'> & { type: 'button' } => {
                return {
                    type: 'button',
                    onClick: (event: ReactMouseEvent<HTMLButtonElement>): void => {
                        event.stopPropagation();
                        event.preventDefault();
                        selectValue(value, event);
                        setPopupOpen(false);
                    }
                };
            },
            [selectValue]
        );

        const config: TabsContextValue = useMemo((): TabsContextValue => ({
            state,
            unstyled: rootConfig.unstyled,
            selectOnFocus: rootConfig.selectOnFocus,
            loopFocus: rootConfig.loopFocus,
            headerPlacement: rootConfig.headerPlacement,
            renderMode: rootConfig.renderMode,
            overflowMode: rootConfig.overflowMode,
            scrollStep: rootConfig.scrollStep,
            variant: rootConfig.variant,
            onValueChange: options.onValueChange,
            onFocusChange: options.onFocusChange,
            onTabClose: onTabCloseStable,
            selectValue,
            setFocused,
            handleTabClick,
            handleTabKeyDown: keyboard.handleTabKeyDown,
            handleTabFocus,
            registerTab,
            isItemActive,
            isItemFocused,
            isItemDisabled: isTabDisabled,
            getTabProps,
            getPanelProps,
            getTabListProps,
            getTabPanelsProps,
            getTabIndicatorProps,
            getTabsRootProps,
            getTabMenuItemProps,
            getTabCloseButtonProps,
            getOverflowTriggerProps,
            getOverflowPopupProps,
            getOverflowItemProps,
            popupOpen,
            setPopupOpen,
            hasIndicator,
            setHasIndicator,
            dispatch,
            listRef: indicator.hostRef
        }), [
            state.value, state.focusedValue, state.tabOrder, state.tabCount,
            rootConfig, options.onValueChange, options.onFocusChange, onTabCloseStable,
            selectValue, setFocused, handleTabClick, keyboard.handleTabKeyDown, handleTabFocus,
            registerTab, getTabMetaCached, isItemActive, isItemFocused, isTabDisabled,
            getTabProps, getPanelProps,
            getTabListProps, getTabPanelsProps, getTabIndicatorProps, getTabsRootProps, getTabMenuItemProps, getTabCloseButtonProps,
            getOverflowTriggerProps, getOverflowPopupProps, getOverflowItemProps,
            indicator.hostRef, popupOpen, setPopupOpen, hasIndicator, setHasIndicator, dispatch
        ]);

        return {
            contextValue: config,
            state,
            listRef: indicator.hostRef,
            getters: {
                getTabProps, getPanelProps,
                getTabListProps, getTabPanelsProps, getTabIndicatorProps, getTabsRootProps
            },
            helpers: { selectValue, setFocused, scrollToValue }
        };
    };
