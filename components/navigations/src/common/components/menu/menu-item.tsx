import { useCallback, useMemo, useRef, useState, useEffect, HTMLAttributes, Children, FC, isValidElement, memo, ReactNode, MouseEvent, RefObject, ReactPortal, JSX, AnchorHTMLAttributes, cloneElement } from 'react';
import { createPortal } from 'react-dom';
import { COMMON_CLASSES, MENU_CLASSES } from '../../constants';
import { ArrowLeftIcon, ChevronRightIcon } from '@syncfusion/react-icons';
import { useMenuContext, MenuContext, MenuContextValue } from '../../context-provider/useMenuContext';
import { useProviderContext, useRippleEffect } from '@syncfusion/react-base';
import { FocusHoverState, SubmenuType, Orientation } from '../../../menu/types';
import { MenuSeparator } from './menu-separator';
import { MenuItemIcon } from './menu-item-icon';
import { MenuItemLabel } from './menu-item-label';
import { MenuItemRegistration } from '../../hooks';
import { MenuItemLink } from './menu-item-link';

/**
 * MenuItem displays an item within a menu.
 * Ensures consistent styling and structure for content, icons, links, and submenus in Menu components.
 *
 * ```typescript
 * <Menu orientation={Orientation.Horizontal} itemOnClick={false}>
 *   <MenuItem>
 *     <MenuItemIcon><FileIcon /></MenuItemIcon>
 *   </MenuItem>
 * </Menu>
 * ```
 */
export interface MenuItemProps extends HTMLAttributes<HTMLLIElement> {
    /**
     * Specifies whether the menu item is disabled.
     *
     * @default false
     */
    disabled?: boolean;

    /**
     * Specifies an optional CSS class to apply to the menu item.
     *
     * @default -
     */
    className?: string;

    /**
     * Specifies the menu item element.
     *
     * @private
     * @default null
     */
    element?: HTMLLIElement | null;

    /**
     * Specifies the content of the menu item.
     * Can be text or any valid React node.
     *
     * @default -
     */
    children?: React.ReactNode;
}

export const MenuItem: FC<MenuItemProps> = memo((props: MenuItemProps) => {

    const {
        disabled = false,
        children,
        className,
        ...restProps
    } = props;

    const contextValue: MenuContextValue = useMenuContext();
    const propsRef: RefObject<MenuItemProps> = useRef(props);

    const {
        config: { orientation, embedded, itemOnClick, isDeviceMode, zIndex, submenuRenderMode },
        state: { openSubmenus, pathStates, setPathStates, parentPath, setOpenSubmenus },
        handlers: { handleSubmenuOpen, onSelect, onClose, blurFocusedMenuElement, handleBackNavigation, openSubmenu },
        refs: { submenuRefs, menuItemsRef, portalContainerRef }
    } = contextValue;

    const { ripple } = useProviderContext();
    const { Ripple, rippleMouseDown } = useRippleEffect(ripple);

    const [myPath, setMyPath] = useState<number[]>([]);
    const liRef: RefObject<HTMLLIElement | null> = useRef<HTMLLIElement>(null);
    const anchorRef: RefObject<HTMLAnchorElement | null> = useRef<HTMLAnchorElement | null>(null);

    const handleRipple: (e: MouseEvent<HTMLLIElement>) => void = useCallback((e: MouseEvent<HTMLLIElement>): void => {
        if (ripple && !disabled) { rippleMouseDown(e); }
    }, [ripple, disabled, rippleMouseDown]);

    const hasSubmenu: boolean = useMemo(() =>
        Children.toArray(children).some(
            (child: ReactNode) => isValidElement(child) && child.type === MenuItem
        ), [children]);

    const myPathKey: string = useMemo(() => myPath?.join('-') ?? null, [myPath]);

    const isSubmenuOpen: boolean = useMemo(() =>
        myPathKey && myPath ? openSubmenus.some((submenu: SubmenuType): boolean => {
            if (parentPath.length === 0) {
                return submenu.parentIndex[0] === myPath[myPath.length - 1];
            }
            return (
                parentPath.length === submenu.parentIndex.length - 1 &&
                submenu.parentIndex.slice(0, -1).join('-') === parentPath.join('-') &&
                submenu.parentIndex[submenu.parentIndex.length - 1] === myPath[myPath.length - 1]
            );
        }) : false, [myPathKey, myPath, openSubmenus, parentPath]);

    const isFocused: boolean = useMemo(() => {
        return myPath && pathStates.focusedItems
            ? myPath.length === pathStates.focusedItems.length &&
            myPath.every((v: number, i: number) => v === pathStates.focusedItems?.[i as number]) : false;
    }, [myPath, pathStates.focusedItems]);

    const isHovered: boolean = useMemo(() => {
        return myPath && pathStates.hoveredItems
            ? myPath.length === pathStates.hoveredItems.length &&
            myPath.every((v: number, i: number) => v === pathStates.hoveredItems?.[i as number]) : false;
    }, [myPath, pathStates.hoveredItems]);

    const isMenubarRootItem: boolean = useMemo(() =>
        orientation === Orientation.Horizontal && parentPath.length === 0, [orientation, parentPath]);

    const { menuItemChildren, otherChildren } = useMemo(() => {
        const menuItems: ReactNode[] = [];
        const others: ReactNode[] = [];
        Children.toArray(children).forEach((child: ReactNode) => {
            if (isValidElement(child)) {
                if (child.type === MenuItem || child.type === MenuSeparator) {
                    menuItems.push(child);
                    return;
                }
                if (child.type === MenuItemLink) {
                    others.push(cloneElement(
                        child as React.ReactElement<AnchorHTMLAttributes<HTMLAnchorElement> & React.RefAttributes<HTMLAnchorElement>>,
                        { ref: anchorRef }
                    ));
                    return;
                }
            }
            others.push(child);
        });
        return { menuItemChildren: menuItems, otherChildren: others };
    }, [children]);

    const extractUrl: string | undefined = useMemo(() => {
        return Children.toArray(otherChildren).reduce((acc: string | undefined, child: ReactNode) => {
            if (acc) { return acc; }
            if (isValidElement(child)) {
                if (child.type === MenuItemLink) {
                    return (child.props as AnchorHTMLAttributes<HTMLAnchorElement>).href as string;
                }
            }
            return acc;
        }, undefined);
    }, [otherChildren]);

    const handleClick: (e: MouseEvent<HTMLLIElement>) => void = useCallback((e: MouseEvent<HTMLLIElement>): void => {
        if (disabled) { return; }
        if (hasSubmenu) {
            e.preventDefault();
        }
        if (!(!(embedded) && itemOnClick === true)) {
            setPathStates((prev: FocusHoverState): FocusHoverState => ({
                focusedItems: myPath, hoveredItems: prev.hoveredItems ?? null
            }));
        }
        if (hasSubmenu) {
            if (!embedded && isDeviceMode) {
                handleSubmenuOpen(myPath, e.currentTarget, e.nativeEvent);
                return;
            }
            if ((embedded && isDeviceMode) || itemOnClick === true) {
                const isOpen: boolean =
                    openSubmenus.some((s: SubmenuType) => s.parentIndex.join('-') === myPath.join('-'));
                if (isOpen) {
                    setOpenSubmenus((prev: SubmenuType[]): SubmenuType[] =>
                        prev.slice(0, Math.max(0, myPath.length - 1))
                    );
                    submenuRefs.current?.clear();
                    setPathStates({ focusedItems: null, hoveredItems: null });
                    return;
                }
                handleSubmenuOpen(myPath, e.currentTarget, e.nativeEvent);
                return;
            }
            return;
        }
        onSelect?.({ item: propsRef.current, event: e });
        if (extractUrl) {
            anchorRef.current?.click();
        }
        onClose?.(e.nativeEvent as Event);
        if (embedded) {
            blurFocusedMenuElement();
            setPathStates({ focusedItems: null, hoveredItems: null });
        }
    }, [disabled, setPathStates, handleSubmenuOpen, openSubmenus, setOpenSubmenus,
        onSelect, onClose, embedded, itemOnClick, isDeviceMode, extractUrl,
        blurFocusedMenuElement, myPath, hasSubmenu, submenuRefs]);

    const handleMouseEnter: (e: MouseEvent<HTMLLIElement>) => void =
        useCallback((e: MouseEvent<HTMLLIElement>): void => {
            const allowFocusOnHover: boolean = !(!embedded && itemOnClick === true);
            setPathStates((prev: FocusHoverState): FocusHoverState => ({
                focusedItems: allowFocusOnHover ? myPath : (prev.focusedItems ?? null), hoveredItems: myPath
            }));
            if (!hasSubmenu && !itemOnClick) {
                if (openSubmenus.length === myPath.length) {
                    handleBackNavigation();
                } else if (openSubmenus.length > myPath.length) {
                    setOpenSubmenus(openSubmenus.slice(0, myPath.length - 1));
                    submenuRefs.current?.clear();
                }
                return;
            }
            if (!isDeviceMode && !itemOnClick && !disabled) {
                const alreadyOpen: boolean = openSubmenus.some((s: SubmenuType) => s.parentIndex.join('-') === myPath.join('-'));
                if (alreadyOpen) { return; }
                submenuRefs.current?.clear();
                openSubmenu?.(myPath, e.currentTarget, e.nativeEvent);
            }
        }, [setPathStates, openSubmenus, embedded,
            setOpenSubmenus, itemOnClick, openSubmenu, isDeviceMode, myPath, disabled, hasSubmenu, handleBackNavigation, submenuRefs]);

    const childContextValue: MenuContextValue | undefined = useMemo(() => {
        if (!myPath) { return undefined; }

        return {
            ...contextValue,
            state: {
                ...contextValue.state,
                parentPath: myPath
            }
        };
    }, [contextValue, myPath]);

    const submenuIconClassName: string = useMemo((): string => {
        return [
            isMenubarRootItem ? COMMON_CLASSES.CHEVRON_DOWN : COMMON_CLASSES.CHEVRON_RIGHT,
            COMMON_CLASSES.SUBMENU_ICON
        ].filter(Boolean).join(' ');
    }, [isMenubarRootItem]);

    const extractText: string | undefined = useMemo(() => {
        return Children.toArray(otherChildren).reduce((acc: string | undefined, child: ReactNode) => {
            if (acc) { return acc; }
            if (isValidElement(child)) {
                if (child.type === MenuItemLabel) {
                    return typeof (child.props as HTMLAttributes<HTMLSpanElement>).children === 'string' ? (child.props as HTMLAttributes<HTMLSpanElement>).children as string : undefined;
                }
            }
            return acc;
        }, undefined);
    }, [otherChildren]);

    const itemClasses: string = useMemo(() => {
        return [
            COMMON_CLASSES.ITEM,
            COMMON_CLASSES.ALIGN_CENTER,
            disabled && COMMON_CLASSES.DISABLED,
            isFocused && !isHovered && COMMON_CLASSES.FOCUSED,
            isHovered && COMMON_CLASSES.HOVERED,
            isSubmenuOpen && COMMON_CLASSES.HAS_SUBMENU,
            className
        ].filter(Boolean).join(' ');
    }, [disabled, isFocused, isSubmenuOpen, className, isHovered]);

    useEffect(() => {
        if (!liRef.current?.parentElement) { return; }

        const siblings: Element[] = Array.from(liRef.current.parentElement.children);
        const liItems: Element[] = siblings.filter((item: Element) => !item.classList.contains(COMMON_CLASSES.SEPARATOR));
        const index: number = liItems.indexOf(liRef.current);

        if (index !== -1) {
            const fullPath: number[] = [...parentPath, index];
            setMyPath(fullPath);
            const pathKey: string = fullPath.join('-');
            menuItemsRef.current.set(pathKey, {
                path: fullPath,
                element: liRef.current,
                hasChildren: Boolean(menuItemChildren.length),
                disabled,
                parentPath: parentPath,
                text: extractText,
                url: extractUrl,
                props: propsRef.current
            });
            return (): void => {
                menuItemsRef.current?.delete(pathKey);
            };
        }
        return undefined;
    }, [parentPath, menuItemsRef, otherChildren, menuItemChildren.length, disabled, extractText, extractUrl]);

    const setSubmenuRef: (pathKey: string) => (element: HTMLUListElement | null) => void = useCallback(
        (pathKey: string) => (element: HTMLUListElement | null): void => {
            if (element && submenuRefs.current) {
                submenuRefs.current.set(pathKey, element);
            }
        }, [submenuRefs]);

    const handleBackIconClick: (e: MouseEvent<HTMLLIElement>) => void = useCallback((e: MouseEvent<HTMLLIElement>) => {
        e.preventDefault();
        if (!(!embedded && itemOnClick === true)) {
            setPathStates((prev: FocusHoverState): FocusHoverState => ({
                focusedItems: myPath, hoveredItems: prev.hoveredItems ?? null
            }));
        }
        handleBackNavigation();
    }, [setPathStates, embedded, itemOnClick, handleBackNavigation, myPath]);

    const getParentItemText: () => string | undefined = useCallback((): string | undefined => {
        if (!myPath || myPath.length === 0) { return undefined; }
        const parentItem: MenuItemRegistration | undefined = menuItemsRef.current?.get(myPathKey);
        return parentItem?.text;
    }, [myPath, myPathKey, menuItemsRef]);

    const headerItemClasses: string = useMemo(() => {
        return [
            COMMON_CLASSES.ITEM,
            COMMON_CLASSES.ALIGN_CENTER,
            COMMON_CLASSES.HEADER,
            disabled && COMMON_CLASSES.DISABLED,
            isFocused && !isHovered && COMMON_CLASSES.FOCUSED,
            isHovered && COMMON_CLASSES.HOVERED,
            isSubmenuOpen && COMMON_CLASSES.HAS_SUBMENU,
            className
        ].filter(Boolean).join(' ');
    }, [disabled, isFocused, isHovered, isSubmenuOpen, className]);

    const subMenuClasses: string = useMemo(() => {
        return [
            MENU_CLASSES.PARENT,
            COMMON_CLASSES.UL,
            embedded ? MENU_CLASSES.SUBMENU : ''
        ].filter(Boolean).join(' ');
    }, [embedded]);

    const submenuWrapperClass: string = useMemo(() => {
        return [
            COMMON_CLASSES.CONTROL,
            MENU_CLASSES.ROOT,
            MENU_CLASSES.SUBMENU_WRAPPER
        ].filter(Boolean).join(' ');
    }, []);

    const renderSubmenu: () => ReactPortal | null = useCallback(() => {
        if (!isSubmenuOpen || !hasSubmenu || !myPathKey || !childContextValue) {
            return null;
        }
        const currentSubmenu: SubmenuType | undefined = openSubmenus.find((item: SubmenuType) => item.parentIndex.join('-') === myPath.join('-'));
        if (!currentSubmenu) {
            return null;
        }
        const portalTarget: HTMLElement = embedded && submenuRenderMode === 'portal' ? document.body : portalContainerRef?.current || document.body;
        const shouldShowHeader: boolean | undefined = !embedded && isDeviceMode;
        const parentText: string | undefined = shouldShowHeader ? getParentItemText() : undefined;

        const submenuContent: JSX.Element = (
            <ul
                ref={setSubmenuRef(myPathKey)}
                className={subMenuClasses}
                role="menu"
                style={{
                    left: currentSubmenu?.position.x,
                    top: currentSubmenu?.position.y,
                    ...(!embedded && isDeviceMode && !currentSubmenu?.isVisible ? { display: 'none' } : {}),
                    visibility: 'hidden',
                    ...(typeof zIndex === 'number' ? { zIndex: zIndex } : {})
                }}
                tabIndex={-1}
            >
                {shouldShowHeader && parentText && (
                    <li className={headerItemClasses} onClick={handleBackIconClick} onMouseDown={handleRipple} role="menuitem" aria-disabled="false">
                        <MenuItemIcon><ArrowLeftIcon aria-label="Previous" key="previous" /></MenuItemIcon>
                        <MenuItemLabel>{parentText}</MenuItemLabel>
                        {ripple && !disabled ? <Ripple /> : null}
                    </li>
                )}
                {menuItemChildren}
            </ul>
        );

        return createPortal(
            <MenuContext.Provider value={childContextValue}>
                {embedded && submenuRenderMode === 'portal' ? <div className={submenuWrapperClass}>{submenuContent}</div> : submenuContent}
            </MenuContext.Provider>,
            portalTarget
        );
    }, [isSubmenuOpen, hasSubmenu, myPathKey, childContextValue, openSubmenus, myPath, portalContainerRef, zIndex, embedded, isDeviceMode,
        getParentItemText, setSubmenuRef, subMenuClasses, headerItemClasses, handleBackIconClick, handleRipple, menuItemChildren, ripple,
        disabled, parentPath, submenuRenderMode, submenuWrapperClass]);

    return (
        <>
            <li
                ref={liRef}
                className={itemClasses}
                role="menuitem"
                aria-disabled={disabled}
                aria-haspopup={hasSubmenu ? 'menu' : undefined}
                aria-expanded={hasSubmenu ? isSubmenuOpen : undefined}
                aria-label={typeof extractText === 'string' ? extractText : undefined}
                data-item-path={myPathKey}
                onClick={handleClick}
                onMouseEnter={handleMouseEnter}
                onMouseDown={handleRipple}
                tabIndex={-1}
                {...restProps}
            >
                {otherChildren}
                {hasSubmenu ? (
                    <span className={submenuIconClassName}>
                        <ChevronRightIcon aria-hidden="true" />
                    </span>
                ) : null}
                {ripple && !disabled ? <Ripple /> : null}
            </li>
            {renderSubmenu()}
        </>
    );
}
);

MenuItem.displayName = 'MenuItem';
