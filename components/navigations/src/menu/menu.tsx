import { useCallback, useEffect, useImperativeHandle, useMemo, useRef, forwardRef, useState, ForwardRefExoticComponent,
    RefAttributes, RefObject, type HTMLAttributes, type Ref, type KeyboardEvent, memo } from 'react';
import { preRender, useProviderContext } from '@syncfusion/react-base';
import { getZindexPartial } from '@syncfusion/react-popups';
import { MenuProps, Orientation } from './types';
import { MenuList, type IMenuList } from '../common/components';
import { useCloseOnScroll } from '../common/hooks/useCloseOnScroll';
import { COMMON_CLASSES, MENU_CLASSES } from '../common/constants';

/**
 * Specifies the animation effect for the Menu.
 *
 */
export type MenuEffect = 'None' | 'SlideDown' | 'ZoomIn' | 'FadeIn';

/**
 * Specifies the type for submenu mount location.
 */
export type SubmenuRenderMode = 'inline' | 'portal';

/**
 * Interface for Menu component instance.
 */
export interface IMenu extends MenuProps {
    /**
     * Specifies the DOM element of the Menu.
     *
     * @private
     * @default null
     */
    element: HTMLDivElement | null;
}

type MenuComponentProps = MenuProps & Omit<HTMLAttributes<HTMLDivElement>, 'onSelect'>;

/**
 * A layout navigation menu component with support for hierarchical menu items.
 * Manages submenu interactions and supports both horizontal and vertical orientations.
 *
 * @example
 * ```tsx
 * import { Menu, MenuItem, MenuItemLabel, MenuItemIcon, Orientation } from "@syncfusion/react-navigations";
 *
 * return (
 *   <Menu orientation={Orientation.Horizontal} itemOnClick={false}>
 *     <MenuItem>
 *       <MenuItemIcon><FileIcon /></MenuItemIcon>
 *       <MenuItemLabel>File</MenuItemLabel>
 *       <MenuItem>
 *         <MenuItemLabel>New</MenuItemLabel>
 *       </MenuItem>
 *       <MenuItem>
 *         <MenuItemLabel>Open</MenuItemLabel>
 *       </MenuItem>
 *     </MenuItem>
 *     <MenuItem>
 *       <MenuItemLabel>Edit</MenuItemLabel>
 *     </MenuItem>
 *   </Menu>
 * );
 * ```
 *
 */
export const Menu: ForwardRefExoticComponent<MenuComponentProps & RefAttributes<IMenu>> =
    forwardRef<IMenu, MenuComponentProps>((props: MenuComponentProps, ref: Ref<IMenu>) => {
        const {
            hoverDelay = 0,
            onOpen,
            onClose,
            onSelect,
            animation = { duration: 400, easing: 'ease', effect: 'FadeIn' },
            closeOnScroll = true,
            itemOnClick = false,
            orientation = Orientation.Horizontal,
            submenuRenderMode = 'inline',
            className,
            children,
            ...restProps
        } = props;


        const { dir } = useProviderContext();
        const elementRef: RefObject<HTMLDivElement | null> = useRef<HTMLDivElement | null>(null);
        const menuListRef: RefObject<IMenuList | null> = useRef<IMenuList | null>(null);

        const DEFAULT_MENU_Z_BASE: number = 1000;
        const MINIMUM_MENU_Z_INDEX: number = 3;
        const [zIndex, setZIndex] = useState<number>(
            Math.max(MINIMUM_MENU_Z_INDEX, DEFAULT_MENU_Z_BASE + 1)
        );

        const computeZIndex: (anchorElement: HTMLElement | null) => number =
            useCallback((anchorElement: HTMLElement | null): number => {
                const anchor: HTMLElement | null = anchorElement;
                let base: number = DEFAULT_MENU_Z_BASE;
                if (anchor) {
                    const partial: number = Number(getZindexPartial(anchor));
                    if (Number.isFinite(partial) && partial > 0) {
                        base = Math.max(DEFAULT_MENU_Z_BASE, partial);
                    }
                }
                return Math.max(MINIMUM_MENU_Z_INDEX, base + 1);
            }, []);


        useEffect((): void => {
            preRender('menu');
            setZIndex(computeZIndex(elementRef.current));
        }, [computeZIndex]);

        const closeSubmenus: () => void = useCallback((): void => {
            menuListRef.current?.closeSubmenus();
        }, []);

        useCloseOnScroll({
            enabled: closeOnScroll === true,
            rootRef: elementRef,
            onClose: closeSubmenus
        });

        const onRootKeyDown: (e: KeyboardEvent<HTMLDivElement>) => void =
            useCallback((e: KeyboardEvent<HTMLDivElement>): void => {
                menuListRef.current?.handleKeyDown(e);
            }, []);

        const handleClose: (evt: Event) => void = useCallback((evt: Event): void => {
            onClose?.(evt);
            closeSubmenus();
        }, [onClose, closeSubmenus]);

        const rootClassName: string = useMemo((): string => {
            return [
                MENU_CLASSES.ROOT,
                COMMON_CLASSES.CONTROL,
                orientation === Orientation.Horizontal ? MENU_CLASSES.HORIZONTAL : MENU_CLASSES.VERTICAL,
                dir === 'rtl' ? COMMON_CLASSES.RTL : '',
                className
            ].filter(Boolean).join(' ');
        }, [orientation, dir, className]);

        useImperativeHandle(ref, (): IMenu => ({
            hoverDelay,
            onOpen,
            onClose,
            onSelect,
            animation,
            closeOnScroll,
            itemOnClick,
            orientation,
            submenuRenderMode,
            element: elementRef.current
        }), [hoverDelay, onOpen, onClose, onSelect, animation, closeOnScroll, itemOnClick, orientation, submenuRenderMode]);

        return (
            <div
                ref={elementRef}
                className={rootClassName}
                onKeyDown={onRootKeyDown}
                {...restProps}
            >
                <MenuList
                    ref={menuListRef}
                    onOpen={onOpen}
                    hoverDelay={hoverDelay}
                    animation={animation}
                    itemOnClick={itemOnClick}
                    embedded={true}
                    isOpen={true}
                    onClose={handleClose}
                    onSelect={onSelect}
                    orientation={orientation}
                    zIndex={zIndex}
                    submenuRenderMode={submenuRenderMode}
                >
                    {children}
                </MenuList>
            </div>
        );
    });

export default memo(Menu);
