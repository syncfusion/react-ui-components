import { useRef, useImperativeHandle, forwardRef, useEffect, useState, HTMLAttributes, useCallback } from 'react';
import { calculatePosition, isCollide, fit } from '@syncfusion/react-popups';
import { AnimationOptions, Browser, Effect, IAnimation, MouseEventArgs, preRender, TouchEventArgs } from '@syncfusion/react-base';
import { Animation, useProviderContext, SvgIcon, useRippleEffect, Touch, ITouch, TapEventArgs  } from '@syncfusion/react-base';
import * as React from 'react';
import { createPortal } from 'react-dom';

const SUBMENU_ICON: string = 'M7.58582 18L13.5858 12L7.58582 6L9.00003 4.58578L16.4142 12L9.00003 19.4142L7.58582 18Z';
const PREVIOUS_ICON: string = 'M12.4142 19L6.41424 13H21V11H6.41424L12.4142 5L11 3.58578L2.58582 12L11 20.4142L12.4142 19Z';

/**
 * Interface for select event arguments when an item is selected from the ContextMenu.
 */
export interface ContextMenuSelectEvent {
    /**
     * Specifies the item data object of the selected menu item.
     *
     * @default -
     */
    item: MenuItemProps;

    /**
     * Specifies the React synthetic event triggered by the user interaction.
     *
     * @default -
     */
    event?: React.SyntheticEvent;
}

/**
 * Specifies the absolute position of the component.
 */
export interface OffsetPosition {
    /**
     * Specifies the horizontal offset position.
     */
    left: number;

    /**
     * Specifies the vertical offset position.
     */
    top: number;
}

/**
 * Interface for menu item model.
 */
export interface MenuItemProps {
    /**
     * Specifies the display text for the menu item.
     *
     * @default -
     */
    text?: string;

    /**
     * Specifies the unique identifier for the menu item.
     *
     * @default -
     */
    id?: string;

    /**
     * Specifies the icon CSS class or React node for the menu item that is used to include an icon.
     * Can be a string (CSS class) or a React element.
     *
     * @default -
     */
    icon?: React.ReactNode;

    /**
     * Specifies the URL for the menu item that creates an anchor link to navigate to the provided URL.
     * When clicked, the browser will navigate to this URL.
     *
     * @default -
     */
    url?: string;

    /**
     * Specifies a separator between the items. Separators are used to group menu items visually.
     * When true, renders a horizontal line instead of a clickable menu item.
     *
     * @default false
     */
    separator?: boolean;

    /**
     * Specifies the sub menu items as an array of MenuItem models for creating nested menu structures.
     *
     * @default []
     */
    items?: MenuItemProps[];

    /**
     * Specifies the htmlAttributes property to support adding custom HTML attributes to the menu item.
     * These attributes will be directly applied to the rendered list item element.
     *
     * @default -
     */
    htmlAttributes?: HTMLAttributes<HTMLLIElement>;

    /**
     * Specifies whether the item is disabled or not. When true, the item will be non-interactive
     * and displayed with a disabled visual state.
     *
     * @default false
     */
    disabled?: boolean;
}

interface SubmenuType {
    parentIndex: number[];
    position: { x: number; y: number; };
    isVisible: boolean;
    currentTarget: HTMLElement;
    positionChanged?: boolean;
}

/**
 * Specifies the animation effect for the ContextMenu.
 *
 */
export type MenuEffect = 'None' | 'SlideDown' | 'ZoomIn' | 'FadeIn';

/**
 * Interface for ContextMenu animation settings that controls how the menu appears.
 */
export interface MenuAnimationProps {
    /**
     * Specifies the effect shown in the ContextMenu transform.
     * The possible effects are:
     * * None: Specifies the ContextMenu transform with no animation effect.
     * * SlideDown: Specifies the ContextMenu transform with slide down effect.
     * * ZoomIn: Specifies the ContextMenu transform with zoom in effect.
     * * FadeIn: Specifies the ContextMenu transform with fade in effect.
     *
     * @default 'FadeIn'
     */
    effect?: MenuEffect;

    /**
     * Specifies the time duration in milliseconds for the transform animation.
     *
     * @default 400
     */
    duration?: number;

    /**
     * Specifies the easing effect applied during the transform animation.
     *
     * @default 'ease'
     */
    easing?: string;
}

/**
 * Interface for ContextMenu component props.
 */
export interface ContextMenuProps {
    /**
     * Specifies whether to show the sub menu on click instead of hover.
     * When set to true, the sub menu will open only on mouse click rather than on hover.
     *
     * @default false
     */
    itemOnClick?: boolean;

    /**
     * Specifies menu items with their properties which will be rendered as ContextMenu.
     * This array defines the structure and content of the menu.
     *
     * @default []
     */
    items?: MenuItemProps[];

    /**
     * Specifies the delay time in milliseconds before opening the submenu when hovering.
     *
     * @default 0
     */
    hoverDelay?: number;

    /**
     * Specifies the animation settings for the ContextMenu open.
     *
     * @default { duration: 400, easing: 'ease', effect: 'FadeIn' }
     */
    animation?: MenuAnimationProps;

    /**
     * Specifies the visibility of the ContextMenu.
     * If set to true, the ContextMenu is displayed. If false, it is hidden.
     *
     * @default -
     */
    open?: boolean;

    /**
     * Specifies the position (left/top coordinates) of the ContextMenu.
     * This determines where the menu will appear on the screen.
     *
     * @default -
     */
    offset?: OffsetPosition;

    /**
     * Specifies target element on which the ContextMenu should be opened. When provided, ContextMenu
     * events on this element will automatically trigger the context menu to appear at the cursor position.
     *
     * The standard contextmenu event is not supported on iOS devices, so this component automatically
     * implements a tapHold touch event handler when iOS is detected. This ensures consistent context menu
     * functionality across all platforms and devices. If you prefer to use your own event handling mechanism
     * or need different trigger behaviors, you can omit this prop and manually control menu display with
     * the `open` and `offset` props instead.
     *
     * @default -
     */
    targetRef?: React.RefObject<HTMLElement>;

    /**
     * Specifies whether to close the ContextMenu when the document is scrolled.
     * When set to true, scrolling the page will automatically close the menu.
     *
     * @default true
     */
    closeOnScroll?: boolean;

    /**
     * Specifies a custom template for menu items. This function receives the entire item object
     * as an argument and should return a React node that will replace the default content.
     *
     * @default -
     */
    itemTemplate?: (item: MenuItemProps) => React.ReactNode;

    /**
     * Specifies the callback function that triggers before open the ContextMenu.
     *
     * @event onOpen
     */
    onOpen?: (event: Event) => void;

    /**
     * Specifies the callback function that triggers before closing the ContextMenu.
     *
     * @event onClose
     */
    onClose?: (event: Event) => void;

    /**
     * Specifies the callback function that triggers when selecting a ContextMenu item.
     *
     * @event onSelect
     */
    onSelect?: (event: ContextMenuSelectEvent) => void;
}

/**
 * Interface for ContextMenu component instance.
 */
export interface IContextMenu extends ContextMenuProps {
    /**
     * Specifies the DOM element of the ContextMenu.
     *
     * @private
     */
    element: HTMLDivElement | null;
}

type ContextMenuComponentProps = ContextMenuProps & Omit< HTMLAttributes<HTMLDivElement>, 'onSelect'>;

type MenuItemComponentProps = MenuItemProps & Omit<MenuItemProps, 'items' | 'htmlAttributes'> & HTMLAttributes<HTMLLIElement>;

/**
 * The MenuItem component represents an individual item within a ContextMenu.
 * It serves as a configuration component and doesn't render anything directly.
 *
 * @example
 * ```jsx
 * <ContextMenu>
 *   <MenuItem text="File">
 *     <MenuItem text="New" />
 *     <MenuItem text="Open" />
 *     <MenuItem text="Save" />
 *   </MenuItem>
 *   <MenuItem separator={true} />
 *   <MenuItem text="Edit" icon={<svg>...</svg>}>
 *     <MenuItem text="Cut" icon={<svg>...</svg>} />
 *   </MenuItem>
 * </ContextMenu>
 * ```
 *
 * @returns {null} This is a wrapper component that doesn't render anything directly.
 */
export const MenuItem: React.FC<MenuItemComponentProps> = () => {
    return null;
};

interface MenuListItemProps  {
    item: MenuItemProps;
    itemClasses: string;
    isFocused: boolean;
    hasSubmenu: boolean;
    isDisabled: boolean;
    isSelected: boolean;
    isSeparator: boolean;
    onMouseEnter: (e: React.MouseEvent<HTMLLIElement, MouseEvent>) => void;
    onClick: (e: React.MouseEvent<HTMLLIElement, MouseEvent>) => void;
    getContent: (item: MenuItemProps) => React.ReactNode;
    focusedItemRef: React.RefObject<HTMLLIElement>;
    attributes?: React.HTMLAttributes<HTMLLIElement>;
}

const MenuListItem: React.FC<MenuListItemProps > = (props: MenuListItemProps ) => {
    const { item, itemClasses, isFocused, hasSubmenu, isDisabled, isSelected, isSeparator,
        onMouseEnter, onClick, getContent, focusedItemRef, attributes } = props;
    const { ripple } = useProviderContext();
    const { rippleMouseDown, Ripple } = useRippleEffect(ripple);
    const handleMouseDown: (e: React.MouseEvent<HTMLLIElement, MouseEvent>) => void =
    (e: React.MouseEvent<HTMLLIElement, MouseEvent>): void => {
        if (ripple && !isDisabled && !isSeparator) {
            rippleMouseDown(e);
        }
    };

    return (
        <li
            ref={isFocused ? focusedItemRef : undefined}
            className={itemClasses}
            onMouseEnter={onMouseEnter}
            onMouseDown={handleMouseDown}
            onClick={onClick}
            tabIndex={-1}
            role='menuitem'
            aria-disabled={!isSeparator ? isDisabled : undefined}
            aria-haspopup={!isSeparator ? hasSubmenu : undefined}
            aria-expanded={!isSeparator ? (hasSubmenu && isSelected ? true : false) : undefined}
            aria-label={isSeparator ? 'separator' : (item.text || undefined)}
            {...attributes}
        >
            {!isSeparator && (item.url ? (
                <a className='sf-menu-url' href={item.url} onClick={(e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => e.stopPropagation()}>
                    <div className='sf-anchor-wrap'>
                        {getContent(item)}
                    </div>
                </a>
            ) : (getContent(item)))}
            {hasSubmenu && <span className='sf-submenu-icon'><SvgIcon d={SUBMENU_ICON} aria-label='submenu-icon'></SvgIcon></span>}
            {ripple && !isDisabled && !isSeparator && <Ripple />}
        </li>
    );
};

/**
 * The ContextMenu component displays a menu with a list of options when triggered by a right-click.
 * It supports nested submenus, keyboard navigation, icons, and various animation effects.
 *
 * ```typescript
 * import { ContextMenu } from "@syncfusion/react-navigations";
 *
 * const targetRef = useRef<HTMLButtonElement>(null);
 * return (
 *       <div >
 *          <button ref={targetRef}> Right Click Me </button>
 *           <ContextMenu targetRef={targetRef as React.RefObject<HTMLElement>}>
 *              <MenuItem text="Cut" />
 *               <MenuItem text="Copy" />
 *              <MenuItem text="Rename" />
 *          </ContextMenu>
 *       </div>
 *  );
 * ```
 */
export const ContextMenu: React.ForwardRefExoticComponent<ContextMenuComponentProps & React.RefAttributes<IContextMenu>> =
    forwardRef<IContextMenu, ContextMenuProps>((props: ContextMenuComponentProps, ref: React.Ref<IContextMenu>) => {
        const {
            items = [],
            hoverDelay = 0,
            onOpen,
            onClose,
            onSelect,
            open,
            offset,
            animation = { duration: 400, easing: 'ease', effect: 'FadeIn' },
            itemOnClick,
            closeOnScroll = true,
            targetRef,
            className,
            children,
            itemTemplate,
            ...restProps
        } = props;

        const elementRef: React.RefObject<HTMLDivElement | null> = useRef<HTMLDivElement>(null);
        const parentRef: React.RefObject<HTMLUListElement | null> = useRef<HTMLUListElement>(null);
        const [isOpen, setIsOpen] = useState(false);
        const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
        const [openSubmenus, setOpenSubmenus] = useState<Array<SubmenuType>>([]);
        const hoverTimeoutRef: React.RefObject<number | null> = useRef<number | null>(null);
        const submenuRefs: React.RefObject<Map<string, HTMLElement | null>> = React.useRef<Map<string, HTMLElement | null>>(new Map());
        const [focusedItem, setFocusedItem] = useState<{focusedItems: number[] | null, hoveredItems?: number[] | null}>
        ({focusedItems: null, hoveredItems: null});
        const focusedItemRef: React.RefObject<HTMLLIElement | null> = useRef<HTMLLIElement | null>(null);
        const initialShowState: React.RefObject<boolean| undefined> = useRef(open);
        const { dir } = useProviderContext();
        const menuItemsRef: React.RefObject<MenuItemProps[]> = useRef<MenuItemProps[]>([]);

        const handleTargetContextMenu: (event: MouseEvent | TapEventArgs | React.MouseEvent<HTMLDivElement>) => void =
            useCallback((event: MouseEvent | TapEventArgs | React.MouseEvent<HTMLDivElement>): void => {
                if (Browser.isIos && touchModule.current && (event as TapEventArgs).originalEvent) {
                    (event as TapEventArgs).originalEvent?.preventDefault();
                    const touch: TouchEventArgs | MouseEventArgs = (event as TapEventArgs).originalEvent.changedTouches[0];
                    setMenuPosition({ x: touch.clientX, y: touch.clientY });
                }
                else {
                    (event as MouseEvent).preventDefault();
                    setMenuPosition({ x: (event as MouseEvent).pageX, y: (event as MouseEvent).pageY });
                }
                onOpen?.(((event as TapEventArgs).originalEvent ? (event as TapEventArgs).originalEvent : event) as Event);
                if (onOpen && open === false) { return; }
                setIsOpen(true);
            }, [onOpen, open]);

        const touchModule: React.RefObject<ITouch | null> =
            useRef<ITouch>(Touch(Browser.isIos && targetRef ? targetRef : { current: null } as unknown as React.RefObject<HTMLElement>,
                                 { tapHold: handleTargetContextMenu }));
        const refInstance: Partial<ContextMenuProps & IContextMenu> = {
            items: menuItemsRef.current,
            hoverDelay,
            animation,
            open,
            offset,
            itemOnClick,
            targetRef,
            closeOnScroll,
            itemTemplate
        };
        useEffect(() => {
            preRender('contextmenu');
            return () => {
                submenuRefs.current?.clear();
                if (hoverTimeoutRef.current) {
                    clearTimeout(hoverTimeoutRef.current);
                    hoverTimeoutRef.current = null;
                }
                touchModule.current?.destroy?.();
            };
        }, []);

        const handleScroll: (args: Event) => void = (args: Event) => {
            if (isOpen && closeOnScroll && !elementRef?.current?.contains(args.target as Node)) {
                onClose?.(args);
                if (onClose && open === true) { return; }
                closeMenu();
            }
        };

        useEffect(() => {
            if (closeOnScroll) {
                document.addEventListener('scroll', handleScroll, true);
            }
            return () => {
                document.removeEventListener('scroll', handleScroll, true);
            };
        }, [isOpen, closeOnScroll, onClose, open]);

        useEffect(() => {
            const targetElement: HTMLElement = targetRef?.current as HTMLElement;
            if (targetElement) {
                targetElement.addEventListener('contextmenu', handleTargetContextMenu);
            }
            return () => {
                if (targetElement) {
                    targetElement.removeEventListener('contextmenu', handleTargetContextMenu);
                }
            };
        }, [targetRef, onOpen]);

        useEffect(() => {
            if (!open && initialShowState.current === open) { return; }
            initialShowState.current = open;
            if (open){
                if (offset && offset.left !== undefined && offset.top !== undefined){
                    setMenuPosition({ x: offset.left, y: offset.top });
                }
                setIsOpen(true);
            }
            else {
                closeMenu();
            }
        }, [open, offset]);

        useEffect(() => {
            if (isOpen) {
                let left: number = menuPosition.x;
                let top: number = menuPosition.y;
                const collide: string[] = isCollide(parentRef.current as HTMLElement, document.documentElement, left, top);
                if (collide.includes('left') || collide.includes('right')) {
                    left = left - (parentRef?.current?.offsetWidth || 0);
                }
                if (collide.includes('bottom')) {
                    const position: OffsetPosition = fit(parentRef.current as HTMLElement, null, { X: false, Y: true },
                                                         { top: top, left: left }) as OffsetPosition;
                    top = position.top;
                }
                if (left !== menuPosition.x || top !== menuPosition.y) {
                    setMenuPosition({x: left, y: top});
                }
                applyAnimation(parentRef.current as HTMLUListElement);
                document.addEventListener('mousedown', handleClickOutside);
            } else {
                document.removeEventListener('mousedown', handleClickOutside);
            }
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }, [isOpen, menuPosition]);

        useEffect(() => {
            if (focusedItemRef.current) {
                focusedItemRef.current.focus();
            }
        }, [focusedItem]);

        useEffect(() => {
            const filteredChildren: React.ReactNode[] = (children
                ? React.Children.toArray(children).filter((child: React.ReactNode) =>
                    React.isValidElement(child) && child.type === MenuItem) : null) as React.ReactNode[];
            const rawMenuItems: MenuItemProps[] = filteredChildren?.length ? parseMenuItemChildren(filteredChildren) : items;
            menuItemsRef.current = addMobileHeaderToNestedItems(rawMenuItems);
        }, [items, children]);

        useImperativeHandle(ref, () => ({
            ...refInstance as IContextMenu,
            element: elementRef.current
        }));

        useEffect(() => {
            if (openSubmenus.length > 0) {
                const pathKey: string = openSubmenus[openSubmenus.length - 1].parentIndex.join('-');
                const currentUl: HTMLElement = submenuRefs.current?.get(pathKey) as HTMLElement;
                if (Browser.isDevice) {
                    applyAnimation(currentUl);
                    return;
                }
                const lastSubmenu: SubmenuType = openSubmenus[openSubmenus.length - 1];
                if (lastSubmenu.positionChanged) {
                    applyAnimation(currentUl);
                    return;
                }
                let left: number = lastSubmenu.position.x;
                let top: number = lastSubmenu.position.y;
                const collide: string[] = isCollide(currentUl, document.documentElement, dir === 'rtl' ? left - (currentUl?.offsetWidth || 0) : left, top);
                if (collide.includes('left') || collide.includes('right')) {
                    left = calculatePosition(lastSubmenu.currentTarget, dir === 'rtl' ? 'right' : 'left', 'top').left;
                    left = dir === 'rtl' ? left :  left - (currentUl?.offsetWidth || 0);
                }
                if ((dir === 'rtl' && !collide.includes('right') && !collide.includes('left') )) {
                    left = left - (submenuRefs.current?.get(pathKey)?.offsetWidth || 0);
                }
                if (collide.includes('bottom')) {
                    const position: OffsetPosition = fit(currentUl, null, { X: false, Y: true },
                                                         { top: top, left: left }) as OffsetPosition;
                    top = position.top;
                }
                const previousUlKey: string = openSubmenus.length > 1 ? openSubmenus[openSubmenus.length - 2].parentIndex.join('-') : '';
                const previousUl: HTMLElement = submenuRefs.current?.size === 1 ?
                    parentRef.current as HTMLElement : submenuRefs.current?.get(previousUlKey) as HTMLElement;
                if (previousUl && !collide.includes('right')) {
                    const scrollBarWidth: number = previousUl.offsetWidth - previousUl.clientWidth;
                    if (scrollBarWidth > 5) {
                        left += dir === 'rtl' ? -scrollBarWidth : scrollBarWidth;
                    }
                }
                if (lastSubmenu.position.x !== left || lastSubmenu.position.y !== top) {
                    setOpenSubmenus((prev: SubmenuType[]) => prev.map((submenu: SubmenuType, index: number) => {
                        if (index === prev.length - 1) {
                            submenuRefs.current?.clear();
                            return {
                                ...submenu,
                                position: { x: left, y: top }, positionChanged: true
                            };
                        }
                        return submenu;
                    }));
                }
                else {
                    applyAnimation(currentUl);
                }
            }
        }, [openSubmenus]);

        const closeMenu: () => void = () => {
            setIsOpen(false);
            setOpenSubmenus([]);
            submenuRefs?.current?.clear();
            setFocusedItem({focusedItems: null, hoveredItems: null});
        };

        const handleClickOutside: (event: MouseEvent) => void = (event: MouseEvent) => {
            if (elementRef.current?.contains(event.target as Node)) { return; }
            onClose?.(event);
            if (onClose && open === true) { return; }
            closeMenu();
        };

        const processChild: (child: React.ReactNode) => MenuItemComponentProps | null =
        (child: React.ReactNode): MenuItemComponentProps | null => {
            if (!React.isValidElement(child) || child.type !== MenuItem) { return null; }
            const { children: subChildren, text, id, icon, url, separator, disabled, ...restProps } =
            child.props as MenuItemComponentProps;
            const menuItem: MenuItemComponentProps = { text, id, icon, url, separator, disabled };
            if (subChildren) {
                const validTemplateNodes: React.ReactNode[] | Function = typeof subChildren === 'function' ? subChildren : React.Children.toArray(subChildren).filter((subChild: React.ReactNode) =>
                    React.isValidElement(subChild) && subChild.type !== MenuItem
                );
                if (validTemplateNodes.length > 0) {
                    menuItem.children = typeof validTemplateNodes !== 'function' ? (validTemplateNodes.length === 1 ? validTemplateNodes[0] : validTemplateNodes) : validTemplateNodes;
                }
                const subItems: MenuItemComponentProps[] = React.Children.toArray(subChildren).map(processChild)
                    .filter(Boolean) as MenuItemComponentProps[];
                if (subItems.length > 0) {
                    menuItem.items = subItems;
                }
            }
            if (Object.keys(restProps).length > 0) {
                menuItem.htmlAttributes = restProps;
            }
            return menuItem;
        };

        const parseMenuItemChildren: (childrenNodes: React.ReactNode) => MenuItemProps[] =
        (childrenNodes: React.ReactNode): MenuItemProps[] => {
            if (!childrenNodes) { return items; }
            const menuItems: MenuItemProps[] = React.Children.toArray(childrenNodes).map(processChild).filter(Boolean) as MenuItemProps[];
            return menuItems.length > 0 ? menuItems : items;
        };


        const addMobileHeaderToNestedItems: (menuItems: MenuItemProps[]) => MenuItemProps[]
        = (menuItems: MenuItemProps[]): MenuItemProps[] => {
            if (!Browser.isDevice) {
                return menuItems;
            }
            const processItems: (items: MenuItemProps[]) => MenuItemProps[]
            = (items: MenuItemProps[]): MenuItemProps[] => {
                return items.map((item: MenuItemComponentProps) => {
                    if (item.items && item.items.length > 0) {
                        const hasHeader: boolean = item.items.length > 0 && (item.items[0]?.icon as React.ReactElement)?.key === 'previous';
                        let processedSubItems: MenuItemProps[] = item.items;
                        if (!hasHeader) {
                            const headerItem: MenuItemComponentProps = {
                                text: item.text,
                                children: item.children,
                                icon: previousIcon,
                                separator: false,
                                items: []
                            };
                            processedSubItems = [headerItem, ...item.items];
                        }
                        processedSubItems = processItems(processedSubItems);
                        return { ...item, items: processedSubItems };
                    }
                    return item;
                });
            };
            return processItems(menuItems);
        };

        const handleSubmenuOpen: (parentIndexPath: number[], target: HTMLElement) => void =
            (parentIndexPath: number[], target: HTMLElement) => {
                if (!target || !parentRef.current) { return; }
                let left: number = menuPosition.x;
                let top: number = menuPosition.y;
                if (!Browser.isDevice) {
                    const offset: OffsetPosition = calculatePosition(target, dir === 'rtl' ? 'left' : 'right', 'top');
                    top = offset.top;
                    left = offset.left;
                }
                setOpenSubmenus((prev: SubmenuType[]) => [
                    ...prev.filter((submenu: SubmenuType) => submenu.parentIndex.length < parentIndexPath.length)
                        .map((submenu: SubmenuType) => ({ ...submenu, isVisible: false })),
                    { parentIndex: parentIndexPath, position: { x: left, y: top }, isVisible: true, currentTarget: target,
                        positionChanged: false }
                ]);
                submenuRefs.current?.clear();
            };

        const handleBackNavigation: () => void = () => {
            if (openSubmenus.length < 1) { return; }
            setOpenSubmenus((prev: SubmenuType[]) => {
                const newSubmenus: SubmenuType[] = prev.filter((_: SubmenuType, index: number) => index !== prev.length - 1);
                return newSubmenus.map((submenu: SubmenuType, index: number) => ({
                    ...submenu,
                    isVisible: index === newSubmenus.length - 1
                }));
            });
            submenuRefs.current?.clear();
        };

        const applyAnimation: (targetElement: HTMLElement) => void = (targetElement: HTMLElement) => {
            if (!targetElement) { return; }
            if (animation == null || (animation.duration && animation.duration <= 0) || animation?.effect === 'None' || targetElement.style.visibility === 'visible') {
                targetElement.style.visibility = 'visible';
                parentRef.current?.focus();
                return;
            }
            const animationRef: IAnimation = Animation({
                duration: animation.duration,
                timingFunction: animation.easing,
                name: animation.effect as Effect,
                begin: (args?: AnimationOptions) => {
                    if ( args?.element) {
                        args.element.style.visibility = 'visible';
                        if (animation.effect === 'SlideDown'){
                            args.element.style.maxHeight = args.element.offsetHeight + 'px';
                            args.element.style.overflow = 'hidden';
                        }
                    }
                },
                end: (args?: AnimationOptions) => {
                    if (args?.element) {
                        if (animation.effect === 'SlideDown') {
                            args.element.style.maxHeight = '';
                        }
                        parentRef.current?.focus();
                    }
                }
            });
            if (targetElement) {
                animationRef.animate(targetElement);
            }
        };

        const navigateToNextLevel: () => void = () => {
            const currentFocusedItem: number[] | null = focusedItem?.focusedItems;
            const itemsToOpen: MenuItemProps[] = currentFocusedItem ? getItemsByPath(currentFocusedItem) : [];
            if (itemsToOpen.length === 0) { return; }
            let nextIndex: number = 0;
            while (nextIndex < itemsToOpen.length && (itemsToOpen[nextIndex as number].separator ||
                itemsToOpen[nextIndex as number].disabled)) {
                nextIndex++;
            }
            if (nextIndex >= itemsToOpen.length) { return; }
            setFocusedItem((prev: { focusedItems: number[] | null; hoveredItems?: number[] | null; }) =>
                ({focusedItems: [...currentFocusedItem as number[], nextIndex], hoveredItems: prev?.hoveredItems}));
            let targetElement: HTMLElement;
            if (openSubmenus.length > 0) {
                const parentPath: number[] = currentFocusedItem?.slice(0, -1) as number[];
                targetElement = submenuRefs.current.get(parentPath.join('-'))?.children[currentFocusedItem?.[currentFocusedItem.length - 1] as number] as HTMLElement;
            }
            else {
                targetElement = parentRef.current?.children[currentFocusedItem?.[0] as number] as HTMLElement;
            }
            openSubmenu(currentFocusedItem as number[], targetElement);
        };

        const openSubmenu: (parentIndexPath: number[], target: HTMLElement) => void = (parentIndexPath: number[], target: HTMLElement) => {
            if (hoverTimeoutRef.current) {
                clearTimeout(hoverTimeoutRef.current);
            }
            hoverTimeoutRef.current = window.setTimeout(() => {
                handleSubmenuOpen(parentIndexPath, target);
            }, hoverDelay);
        };

        const handleKeyDown: (e: React.KeyboardEvent) => void = (e: React.KeyboardEvent) => {
            const key: string = e.key;
            switch (key) {
            case 'Escape':
                if (openSubmenus.length > 0) {
                    handleBackNavigation();
                    if (focusedItem.focusedItems && focusedItem.focusedItems.length > 1) {
                        setFocusedItem((prev: { focusedItems: number[] | null; hoveredItems?: number[] | null; }) =>
                            ({focusedItems: prev?.focusedItems?.slice(0, -1) as number[], hoveredItems: prev?.hoveredItems}));
                    }
                } else {
                    closeMenu();
                }
                e.preventDefault();
                break;

            case 'Enter':
            case ' ': {
                const activeItems: MenuItemProps[] = openSubmenus.length > 0
                    ? getItemsByPath(openSubmenus[openSubmenus.length - 1].parentIndex) : menuItemsRef.current;
                const currentItem: MenuItemProps | undefined = focusedItem.focusedItems && focusedItem.focusedItems.length > 0
                    ? activeItems[focusedItem.focusedItems[focusedItem.focusedItems.length - 1]] : undefined;
                if (!currentItem?.items || currentItem.items.length === 0) {
                    onSelect?.({item: currentItem as MenuItemProps, event: e});
                    closeMenu();
                    return;
                }
                navigateToNextLevel();
                e.preventDefault();
                break;
            }

            case 'ArrowUp':
                e.preventDefault();
                navigateVertical(-1);
                break;

            case 'ArrowDown':
                e.preventDefault();
                navigateVertical(1);
                break;

            case 'ArrowLeft':
                e.preventDefault();
                if (focusedItem.focusedItems && focusedItem.focusedItems.length > 1) {
                    setFocusedItem((prev: {  focusedItems: number[] | null; hoveredItems?: number[] | null; }) =>
                        ({focusedItems: prev?.focusedItems?.slice(0, -1) as number[], hoveredItems: prev?.hoveredItems}));
                }
                if (openSubmenus.length > 0) {
                    handleBackNavigation();
                }
                break;

            case 'ArrowRight':
                e.preventDefault();
                navigateToNextLevel();
                break;
            case 'Home':
                e.preventDefault();
                navigateToPosition('first');
                break;

            case 'End':
                e.preventDefault();
                navigateToPosition('last');
                break;
            default:
                if (key.length === 1 && /[a-zA-Z0-9]/.test(key)) {
                    e.preventDefault();
                    navigateToPosition('character', key.toLowerCase());
                }
                break;
            }
        };

        const navigateToPosition: (type: 'first' | 'last' | 'character', char?: string) => void =
        (type: 'first' | 'last' | 'character', char?: string) => {
            const activeItems: MenuItemProps[] = openSubmenus.length > 0 ?
                getItemsByPath(openSubmenus[openSubmenus.length - 1].parentIndex) : menuItemsRef.current;
            if (!activeItems?.length) {return; }
            const currentPath: number[] = openSubmenus.length > 0 ? [...(openSubmenus[openSubmenus.length - 1]?.parentIndex || [])] :
                [];
            const currentIndex: number = focusedItem?.focusedItems?.length === currentPath.length + 1
                ? focusedItem.focusedItems[focusedItem.focusedItems.length - 1] : -1;

            const isValidItem: (item: MenuItemProps) => boolean = (item: MenuItemProps): boolean =>
                item && !item.separator && !item.disabled;

            const matchesChar: (item: MenuItemProps, searchChar: string) => boolean = (item: MenuItemProps, searchChar: string): boolean =>
                (item.text && typeof item.text === 'string' && item.text.toLowerCase().startsWith(searchChar)) as boolean;
            let targetIndex: number = -1;
            switch (type) {
            case 'first':
                targetIndex = activeItems.findIndex(isValidItem);
                break;

            case 'last':
                targetIndex = activeItems.map((item: MenuItemProps, idx: number) => ({ item, idx }))
                    .reverse().find(( {item}: { item: MenuItemProps; } ) => isValidItem(item))?.idx ?? -1;
                break;

            case 'character':
                if (!char || typeof char !== 'string' || char.length !== 1) { return; }

                {
                    const startIndex: number = Math.max(0, currentIndex + 1);
                    const searchOrder: MenuItemProps[] = [
                        ...activeItems.slice(startIndex),
                        ...activeItems.slice(0, startIndex)
                    ];
                    const foundItem: MenuItemProps | undefined = searchOrder.find((item: MenuItemProps) =>
                        isValidItem(item) && matchesChar(item, char)
                    );
                    if (foundItem) {
                        targetIndex = activeItems.indexOf(foundItem);
                    }
                }
                break;
            }
            if (targetIndex >= 0) {
                setFocusedItem?.((prev: { focusedItems: number[] | null; hoveredItems?: number[] | null; }) => ({
                    focusedItems: [...currentPath, targetIndex],
                    hoveredItems: prev?.hoveredItems || null
                }));
            }
        };

        const navigateVertical: (direction: number) => void  = (direction: number) => {
            const activeItems: MenuItemProps[] = openSubmenus.length > 0
                ? getItemsByPath(openSubmenus[openSubmenus.length - 1].parentIndex) : menuItemsRef.current;
            if (activeItems.length === 0) { return; }
            const currentPath: number[] = openSubmenus.length > 0 ? [...openSubmenus[openSubmenus.length - 1].parentIndex] : [];
            const currentIndex: number | null = focusedItem.focusedItems && (focusedItem.focusedItems.length === currentPath.length + 1)
                ? focusedItem.focusedItems[focusedItem.focusedItems.length - 1] : null;
            let nextIndex: number = currentIndex === null
                ? (direction > 0 ? 0 : activeItems.length - 1) : (currentIndex + direction + activeItems.length) % activeItems.length;
            let itemsChecked: number = 0;
            while (nextIndex < activeItems.length && (activeItems[nextIndex as number].separator ||
                activeItems[nextIndex as number].disabled) && itemsChecked < activeItems.length) {
                nextIndex = (nextIndex + direction + activeItems.length) % activeItems.length;
                itemsChecked++;
            }
            if (itemsChecked >= activeItems.length) { return; }
            setFocusedItem((prev: { focusedItems: number[] | null; hoveredItems?: number[] | null;  }) => ({focusedItems:
                [...currentPath, nextIndex], hoveredItems: prev?.hoveredItems}));
        };

        const getItemsByPath: (indexPath: number[]) => MenuItemProps[] = useCallback((indexPath: number[]) => {
            return indexPath.reduce(
                (currentItems: MenuItemProps[], subIndex: number) => currentItems[subIndex as number]?.items || [], menuItemsRef.current );
        }, []);

        const previousIcon: React.ReactNode = React.useMemo(() => <SvgIcon d={PREVIOUS_ICON} aria-label='Previous' key={'previous'} />, []);

        const getContent: (item: MenuItemProps) => React.ReactNode = (item: MenuItemProps) => {
            if (itemTemplate) {
                return (item as MenuItemComponentProps).children || itemTemplate(item);
            }
            return (<>
                {item.icon && <span className={['sf-menu-icon sf-icon sf-icon-size', typeof item.icon === 'string' ? item.icon : ''].filter(Boolean).join(' ')}>
                    {typeof item.icon !== 'string' && item.icon}
                </span>}
                {(item as MenuItemComponentProps).children || item.text}
            </>);
        };

        const renderMenuItems: (menuItems: MenuItemProps[], parentIndexPath: number[]) => React.ReactNode =
        (menuItems: MenuItemProps[], parentIndexPath: number[]) => {
            return menuItems.map((item: MenuItemProps, index: number) => {
                const currentIndexPath: number[] = [...parentIndexPath, index];
                const hasSubmenu: boolean = (item.items ? item.items.length > 0 : false);
                const isDisabled: boolean = item.disabled === true;
                const isHeaderItem: boolean = Browser.isDevice && (item.icon as React.ReactElement)?.key === 'previous';
                const { className, ...restAttributes } = item.htmlAttributes || {};
                const isFocused: boolean = currentIndexPath.join('-') === focusedItem.focusedItems?.join('-');
                const isHovered: boolean = currentIndexPath.join('-') === focusedItem.hoveredItems?.join('-');
                const isBlankIcon: boolean = !item.icon && menuItems.find((iconItem: MenuItemProps, iconIndex: number) =>
                    iconIndex !== index && iconItem.icon) !== undefined;
                const isSelected: boolean = openSubmenus.some((submenu: SubmenuType) => {
                    if (parentIndexPath.length === 0) {
                        return submenu.parentIndex[0] === index;
                    }
                    return (
                        parentIndexPath.length === submenu.parentIndex.length - 1 &&
                        submenu.parentIndex.slice(0, -1).join('-') === parentIndexPath.join('-') &&
                        submenu.parentIndex[submenu.parentIndex.length - 1] === index
                    );
                });
                const itemClasses: string = [
                    'sf-menu-item sf-align-center sf-ellipsis',
                    item.separator && 'sf-separator',
                    isDisabled && 'sf-disabled',
                    isHeaderItem && 'sf-menu-header',
                    (isFocused || isHovered) && 'sf-focused',
                    isSelected && hasSubmenu && 'sf-has-submenu',
                    isBlankIcon && 'sf-blank-icon',
                    className
                ].filter(Boolean).join(' ');

                const handleMouseEnter: (e: React.MouseEvent<HTMLLIElement, MouseEvent>) => void =
                (e: React.MouseEvent<HTMLLIElement, MouseEvent>): void => {
                    setFocusedItem((prev: { focusedItems: number[] | null; hoveredItems?: number[] | null; }) =>
                        ({focusedItems: prev?.focusedItems, hoveredItems: currentIndexPath}));
                    if (!hasSubmenu) {
                        if (openSubmenus.length === currentIndexPath.length) {
                            handleBackNavigation();
                        }
                        else if (openSubmenus.length > currentIndexPath.length) {
                            setOpenSubmenus(openSubmenus.slice(0, currentIndexPath.length - 1));
                            submenuRefs?.current?.clear();
                        }
                        return;
                    }

                    if (!Browser.isDevice && hasSubmenu && !itemOnClick && !isDisabled) {
                        if (openSubmenus && openSubmenus.find((submenu: SubmenuType) => submenu.parentIndex.join('-') === currentIndexPath.join('-'))) {
                            return;
                        }
                        submenuRefs?.current?.clear();
                        openSubmenu(currentIndexPath, e.currentTarget);
                    }
                };

                const handleItemClick: (e: React.MouseEvent<HTMLLIElement, MouseEvent>) => void =
                (e: React.MouseEvent<HTMLLIElement, MouseEvent>): void => {
                    e.preventDefault();
                    if (isDisabled) { return; }
                    if (isHeaderItem) {
                        handleBackNavigation();
                    } else if (hasSubmenu) {
                        if (Browser.isDevice) {
                            handleSubmenuOpen(currentIndexPath, e.currentTarget as HTMLElement);
                        } else if (itemOnClick) {
                            openSubmenu(currentIndexPath, e.currentTarget);
                        }
                    } else {
                        onSelect?.({item: item, event: e});
                        onClose?.(e as unknown as Event);
                        if (onClose && open === true) { return; }
                        closeMenu();
                    }
                };

                return (
                    <MenuListItem
                        key={currentIndexPath.join('-')}
                        item={item}
                        itemClasses={itemClasses}
                        isFocused={isFocused}
                        hasSubmenu={hasSubmenu}
                        isDisabled={isDisabled}
                        isSelected={isSelected}
                        isSeparator={!!item.separator}
                        onMouseEnter={handleMouseEnter}
                        onClick={handleItemClick}
                        getContent={getContent}
                        focusedItemRef={focusedItemRef as React.RefObject<HTMLLIElement>}
                        attributes={restAttributes}
                    />
                );
            });
        };

        const renderSubmenus: () => React.ReactNode = () => {
            return openSubmenus.map(({ parentIndex, position, isVisible }: SubmenuType) => {
                const submenuItems: MenuItemProps[] = getItemsByPath(parentIndex);
                const pathKey: string = parentIndex.join('-');
                return (
                    <ul
                        key={`submenu-${pathKey}`}
                        ref={(el: HTMLUListElement) => {
                            if (el && submenuRefs.current) { submenuRefs.current.set(pathKey, el); }
                        }}
                        className={'sf-menu-parent'}
                        style={{ left: position.x, top: position.y, display: Browser.isDevice && !isVisible ? 'none' : 'block', visibility: 'hidden' }}
                        tabIndex={0}
                        role="menu"
                    >
                        {renderMenuItems(submenuItems, parentIndex)}
                    </ul>
                );
            });
        };

        const rootClassName: string = React.useMemo(() => {
            return [
                'sf-contextmenu',
                'sf-control',
                dir === 'rtl' ? 'sf-rtl' : '',
                className
            ].filter(Boolean).join(' ');
        }, [dir]);
        const portalContainer: HTMLElement | null = typeof document !== 'undefined' ? document.body : null;
        if (!portalContainer) {
            return null;
        }

        return (<>
            {isOpen && createPortal(
                <div
                    ref={elementRef}
                    className={rootClassName}
                    onKeyDown={handleKeyDown}
                    {...restProps}
                >
                    <ul
                        className="sf-menu-parent"
                        style={{
                            top: menuPosition.y,
                            left: menuPosition.x,
                            display: Browser.isDevice && openSubmenus.length > 0 ? 'none' : 'block',
                            visibility: 'hidden'
                        }}
                        role="menu"
                        tabIndex={0}
                        ref={parentRef}
                    >
                        {(menuItemsRef.current && menuItemsRef.current.length > 0) && renderMenuItems(menuItemsRef.current, [])}
                    </ul>
                    {renderSubmenus()}
                </div>
                ,
                portalContainer
            )}
        </>);
    });

export default ContextMenu;
