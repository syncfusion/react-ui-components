import { useRef, useMemo, useImperativeHandle, forwardRef, MouseEvent, HTMLAttributes, useCallback, CSSProperties, Dispatch, FocusEventHandler, ReactElement, ReactNode, Ref, RefObject, SetStateAction, FocusEvent, KeyboardEvent, ForwardRefExoticComponent, RefAttributes } from 'react';
import { Browser } from '@syncfusion/react-base';
import { MenuAnimationProps, MenuSelectEvent, Orientation, SubmenuRenderMode } from '../../../menu';
import { MenuContext, type MenuContextValue } from '../../context-provider/useMenuContext';
import { COMMON_CLASSES, MENU_CLASSES } from '../../constants';
import { MenuItemRegistration, useMenu } from '../../hooks/useMenu';
import { getFirstEnabledIndex } from '../../utils';

export interface IMenuList {
    handleKeyDown: (e: KeyboardEvent) => void;
    closeSubmenus: () => void;
}

export interface MenuListProps extends Omit<HTMLAttributes<HTMLUListElement>, 'onSelect'> {
    children?: ReactNode;
    hoverDelay?: number;
    onSelect?: (event: MenuSelectEvent) => void;
    onOpen?: (event: Event) => void;
    onClose?: (event: Event) => void;
    itemOnClick?: boolean;
    animation?: MenuAnimationProps;
    orientation?: Orientation;
    embedded?: boolean;
    isOpen?: boolean;
    zIndex?: number;
    popupPosition?: { x: number; y: number };
    setPopupPosition?: Dispatch<SetStateAction<{ x: number; y: number }>>;
    subMenuContainerRef?: RefObject<HTMLElement | null>;
    container?: HTMLElement;
    submenuRenderMode?: SubmenuRenderMode;
}

const DEFAULT_HOVER_DELAY: number = 0;
const DEFAULT_ANIMATION: MenuAnimationProps = {
    duration: 400,
    easing: 'ease',
    effect: 'FadeIn'
};

/**
 * MenuList - Internal orchestrator component for rendering hierarchical menu structures.
 * Manages focus, hover states, keyboard navigation, and submenu positioning.
 *
 * @internal
 */
export const MenuList: ForwardRefExoticComponent<MenuListProps & RefAttributes<IMenuList>> =
    forwardRef<IMenuList, MenuListProps>((props: MenuListProps, ref: Ref<IMenuList>) => {
        const {
            children,
            hoverDelay = DEFAULT_HOVER_DELAY,
            onSelect,
            onOpen,
            onClose,
            itemOnClick = false,
            animation = DEFAULT_ANIMATION,
            orientation = Orientation.Vertical,
            embedded = false,
            isOpen = true,
            zIndex,
            popupPosition = { x: 0, y: 0 },
            setPopupPosition,
            subMenuContainerRef,
            container,
            className,
            submenuRenderMode = 'portal',
            ...restUlProps
        } = props;

        const rootRef: RefObject<HTMLDivElement | null> = useRef<HTMLDivElement>(null);
        const isDeviceMode: boolean = Browser.isDevice;
        const isRootMenubar: boolean = useMemo(() =>
            orientation === Orientation.Horizontal || (embedded && orientation === Orientation.Vertical), [orientation, embedded]);

        const { parentRef, submenuRefs, focusedItemRef, openSubmenus, setOpenSubmenus, pathStates, setPathStates, handleSubmenuOpen,
            handleBackNavigation, openSubmenu, menuItemsRef, handleKeyDown, closeAllSubmenus, getItemsByPath } =
            useMenu({
                hoverDelay, onSelect, onOpen, animation, itemOnClick, orientation, isOpen, popupPosition, setPopupPosition, onClose,
                embedded, container, submenuRenderMode
            });

        const blurFocusedMenuElement: () => void = useCallback((): void => {
            const activeElement: Element | null = document.activeElement;
            if (activeElement instanceof HTMLElement && parentRef.current?.contains(activeElement)) {
                activeElement.blur();
            }
        }, [parentRef]);

        const focusFirstEnabledTopLevel: (e: FocusEvent<HTMLUListElement, Element>) => void =
        useCallback((e: FocusEvent<HTMLUListElement, Element>): void => {
            const rootItems: MenuItemRegistration[] = getItemsByPath([]) || [];
            if (rootItems.length === 0 || (pathStates.focusedItems?.length ?? 0) > 0) {
                return;
            }
            const targetPath: string | undefined = e.target?.dataset.itemPath;
            const targetIndexArray: number[] = targetPath ? targetPath.split('-').map(Number) : [];
            const firstEnabledIndex: number = getFirstEnabledIndex(rootItems);
            const focusedItems: number[] = targetIndexArray.length > 0 ? targetIndexArray :
                (firstEnabledIndex >= 0 ? [firstEnabledIndex] : []);
            if (focusedItems.length > 0) {
                setPathStates({ focusedItems, hoveredItems: null });
            }
        }, [pathStates.focusedItems, setPathStates, getItemsByPath]);

        const handleRootMouseLeave: (e: MouseEvent<HTMLDivElement>) => void = useCallback((e: MouseEvent<HTMLDivElement>): void => {
            blurFocusedMenuElement();
            setPathStates({ focusedItems: null, hoveredItems: null });
            if (!itemOnClick) {
                closeAllSubmenus();
                onClose?.(e.nativeEvent as Event);
            }
        }, [itemOnClick, closeAllSubmenus, setPathStates, blurFocusedMenuElement, onClose]);

        const handleRootBlur: FocusEventHandler<HTMLDivElement> = useCallback((e: FocusEvent<HTMLDivElement, Element>) => {
            const related: Node | null = e.relatedTarget as Node | null;
            if (related && e.currentTarget.contains(related)) {
                return;
            }
            if (related && submenuRefs.current) {
                for (const submenuRef of submenuRefs.current.values()) {
                    if (submenuRef?.contains(related)) {
                        return;
                    }
                }
            }
            closeAllSubmenus();
            setPathStates({ focusedItems: null, hoveredItems: null });
        }, [closeAllSubmenus, setPathStates, submenuRefs]);

        const handleRootFocus: (e: FocusEvent<HTMLUListElement, Element>) => void =
            useCallback((e: FocusEvent<HTMLUListElement, Element>): void => {
                if (!isRootMenubar) {
                    return;
                }
                const related: EventTarget | null = e.relatedTarget as EventTarget | null;
                const cameFromInside: boolean =
                    !!related && related instanceof Node && e.currentTarget.contains(related);
                if (!cameFromInside) {
                    focusFirstEnabledTopLevel(e);
                }
            }, [isRootMenubar, focusFirstEnabledTopLevel]);

        const contextValue: MenuContextValue = useMemo<MenuContextValue>(() => {
            return {
                config: {
                    itemOnClick,
                    orientation,
                    embedded,
                    isDeviceMode,
                    zIndex,
                    submenuRenderMode
                },
                state: {
                    openSubmenus,
                    pathStates,
                    setPathStates,
                    parentPath: [],
                    setOpenSubmenus
                },
                handlers: {
                    onSelect,
                    onClose,
                    openSubmenu,
                    handleBackNavigation,
                    handleSubmenuOpen,
                    blurFocusedMenuElement
                },
                refs: {
                    submenuRefs,
                    focusedItemRef,
                    portalContainerRef: subMenuContainerRef?.current ? subMenuContainerRef : rootRef,
                    menuItemsRef
                }
            };
        }, [itemOnClick, orientation, embedded, isDeviceMode, openSubmenus,
            pathStates, setPathStates, submenuRefs, focusedItemRef, menuItemsRef, subMenuContainerRef, zIndex, onSelect,
            onClose, openSubmenu, handleBackNavigation, handleSubmenuOpen, blurFocusedMenuElement, setOpenSubmenus, rootRef,
            submenuRenderMode]);

        useImperativeHandle(ref, () => ({
            handleKeyDown,
            closeSubmenus: closeAllSubmenus
        }), [handleKeyDown, closeAllSubmenus]);

        const rootStyle: CSSProperties = useMemo((): CSSProperties => {
            if (isRootMenubar) {
                return { visibility: 'visible' };
            }
            return {
                top: popupPosition.y,
                left: popupPosition.x,
                display: isDeviceMode && openSubmenus.length > 0 ? 'none' : 'block',
                visibility: 'hidden',
                ...(!embedded && typeof zIndex === 'number' ? { zIndex } : {})
            };
        }, [isRootMenubar, popupPosition.x, popupPosition.y, isDeviceMode, openSubmenus.length, zIndex, embedded]);

        const ulClasses: string = useMemo(() => {
            return [
                MENU_CLASSES.PARENT,
                embedded ? MENU_CLASSES.ROOT_LIST : COMMON_CLASSES.UL,
                className
            ].filter(Boolean).join(' ');
        }, [embedded, className]);

        const content: ReactElement = (
            <>
                <ul
                    className={ulClasses}
                    style={rootStyle}
                    role={isRootMenubar ? 'menubar' : 'menu'}
                    tabIndex={0}
                    aria-orientation={embedded && orientation === Orientation.Vertical ? 'vertical' : undefined}
                    ref={parentRef}
                    onFocus={handleRootFocus}
                    {...restUlProps}
                >
                    {children}
                </ul>
            </>
        );

        return (
            <MenuContext.Provider value={contextValue}>
                {embedded ? (<div
                    ref={rootRef}
                    className={MENU_CLASSES.BASE}
                    onMouseLeave={handleRootMouseLeave}
                    onBlur={handleRootBlur}
                >
                    {content}
                </div>) : (content)}
            </MenuContext.Provider>
        );
    });

MenuList.displayName = 'MenuList';

export default MenuList;
