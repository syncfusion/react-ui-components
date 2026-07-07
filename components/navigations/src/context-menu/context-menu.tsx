import { useRef, useImperativeHandle, forwardRef, useEffect, useState, useMemo, type HTMLAttributes, useCallback, RefAttributes,
    Ref, RefObject, ForwardRefExoticComponent, type KeyboardEvent, memo } from 'react';
import { Browser, MouseEventArgs, preRender, TouchEventArgs, useProviderContext, Touch, ITouch, TapEventArgs } from '@syncfusion/react-base';
import { getZindexPartial } from '@syncfusion/react-popups';
import { createPortal } from 'react-dom';
import { IMenuList, MenuList } from '../common/components';
import { useCloseOnScroll } from '../common/hooks/';
import { COMMON_CLASSES, CONTEXTMENU_CLASSES } from '../common/constants';
import { getContainerPosition, isRootContainer } from '../common';
import { ContextMenuProps } from './types';

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

type ContextMenuComponentProps = ContextMenuProps & Omit<HTMLAttributes<HTMLDivElement>, 'onSelect'>;

/**
 * A context menu component that displays options when triggered by a right-click or tap-hold action.
 * Supports nested submenus, keyboard navigation, icons, and various animation effects.
 *
 * ```tsx
 * import { ContextMenu, MenuItem, MenuItemLabel, MenuItemIcon } from "@syncfusion/react-navigations";
 *
 * const targetRef = useRef<HTMLDivElement>(null);
 * return (
 *   <div ref={targetRef}>
 *     <button>Right Click Me</button>
 *     <ContextMenu targetRef={targetRef as RefObject<HTMLElement>}>
 *       <MenuItem>
 *         <MenuItemIcon><CutIcon /></MenuItemIcon>
 *         <MenuItemLabel>Cut</MenuItemLabel>
 *       </MenuItem>
 *       <MenuItem>
 *         <MenuItemIcon><CopyIcon /></MenuItemIcon>
 *         <MenuItemLabel>Copy</MenuItemLabel>
 *       </MenuItem>
 *       <MenuItem>
 *         <MenuItemIcon><RenameIcon /></MenuItemIcon>
 *         <MenuItemLabel>Rename</MenuItemLabel>
 *       </MenuItem>
 *     </ContextMenu>
 *   </div>
 * );
 * ```
 */
export const ContextMenu: ForwardRefExoticComponent<ContextMenuComponentProps & RefAttributes<IContextMenu>> =
    forwardRef<IContextMenu, ContextMenuComponentProps>((props: ContextMenuComponentProps, ref: Ref<IContextMenu>) => {
        const {
            hoverDelay = 0,
            onOpen,
            onClose,
            onSelect,
            open,
            offset,
            animation = { duration: 400, easing: 'ease', effect: 'FadeIn' },
            itemOnClick,
            closeOnScroll = true,
            allowBrowserContext = false,
            targetRef,
            className,
            children,
            container,
            ...restProps
        } = props;

        const elementRef: RefObject<HTMLDivElement | null> = useRef<HTMLDivElement | null>(null);
        const menuListRef: RefObject<IMenuList | null> = useRef<IMenuList | null>(null);
        const [isOpen, setIsOpen] = useState(false);
        const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
        const initialShowState: RefObject<boolean | undefined> = useRef(open);
        const { dir } = useProviderContext();
        const DEFAULT_MENU_Z_BASE: number = 1000;
        const MINIMUM_MENU_Z_INDEX: number = 3;
        const [zIndex, setZIndex] = useState<number>(
            Math.max(MINIMUM_MENU_Z_INDEX, DEFAULT_MENU_Z_BASE + 1)
        );

        const computeZIndex: (anchorElement?: HTMLElement | null) => number =
            useCallback((anchorElement?: HTMLElement | null): number => {
                const anchor: HTMLElement | null =
                    anchorElement || (typeof document !== 'undefined' ? document.body : null);
                let base: number = DEFAULT_MENU_Z_BASE;
                if (anchor) {
                    const partial: number = Number(getZindexPartial(anchor));
                    if (Number.isFinite(partial) && partial > 0) {
                        base = Math.max(DEFAULT_MENU_Z_BASE, partial);
                    }
                }
                return Math.max(MINIMUM_MENU_Z_INDEX, base + 1);
            }, []);

        const handleTargetContextMenu: (event: globalThis.MouseEvent | TapEventArgs) => void =
            useCallback((event: globalThis.MouseEvent | TapEventArgs): void => {
                const mouseEvent: globalThis.MouseEvent = event as globalThis.MouseEvent;
                if (allowBrowserContext && (mouseEvent.ctrlKey || mouseEvent.metaKey)) {
                    return;
                }
                const anchor: HTMLElement | null = targetRef?.current as HTMLElement;
                setZIndex(computeZIndex(anchor));
                if (Browser.isDevice && touchModule.current && (event as TapEventArgs).originalEvent) {
                    (event as TapEventArgs).originalEvent?.preventDefault();
                    const touch: TouchEventArgs | MouseEventArgs = (event as TapEventArgs).originalEvent.changedTouches[0];
                    if (!isRootContainer(container) && container) {
                        const pageX: number = touch.clientX + (window.pageXOffset || window.scrollX);
                        const pageY: number = touch.clientY + (window.pageYOffset || window.scrollY);
                        setPopupPosition(getContainerPosition(pageX, pageY, container));
                    } else {
                        setPopupPosition({ x: touch.clientX, y: touch.clientY });
                    }
                } else {
                    mouseEvent.preventDefault();
                    setPopupPosition(getContainerPosition(mouseEvent.pageX, mouseEvent.pageY, container));
                }
                const tapArgs: TapEventArgs = event as TapEventArgs;
                const nativeEvent: Event = tapArgs.originalEvent instanceof Event
                    ? tapArgs.originalEvent
                    : mouseEvent;
                onOpen?.(nativeEvent);
                if (onOpen && open === false) { return; }
                setIsOpen(true);
            }, [onOpen, open, allowBrowserContext, targetRef, computeZIndex, container]);

        const tapHoldHandlerRef: { current: (event: globalThis.MouseEvent | TapEventArgs) => void } =
            useRef(handleTargetContextMenu) as unknown as {
                current: (event: globalThis.MouseEvent | TapEventArgs) => void
            };

        useEffect(() => {
            tapHoldHandlerRef.current = handleTargetContextMenu;
        }, [handleTargetContextMenu]);

        const touchModule: RefObject<ITouch | null> = useRef<ITouch | null>(
            Touch((Browser.isDevice && targetRef
                ? (targetRef as RefObject<HTMLElement>)
                : ({ current: null } as unknown as RefObject<HTMLElement>)
            ), { tapHold: (evt: TapEventArgs) => tapHoldHandlerRef.current?.(evt) }
            )
        );

        useEffect(() => {
            preRender('contextmenu');
            return () => {
                touchModule.current?.destroy?.();
                touchModule.current = null;
            };
        }, []);

        const refInstance: Partial<ContextMenuProps & IContextMenu> = useMemo(
            (): Partial<ContextMenuProps & IContextMenu> => ({
                hoverDelay,
                animation,
                open,
                offset,
                itemOnClick,
                targetRef,
                allowBrowserContext,
                closeOnScroll,
                container,
                onSelect,
                onClose,
                onOpen
            }),
            [hoverDelay, animation, open, offset, itemOnClick, targetRef,
                allowBrowserContext, closeOnScroll, container, onSelect, onClose, onOpen]
        );

        const closeMenu: () => void = useCallback((): void => {
            setIsOpen(false);
        }, []);

        const handleClose: (evt: Event) => void = useCallback((evt: Event): void => {
            onClose?.(evt);
            if (onClose && open === true) {
                return;
            }
            closeMenu();
        }, [onClose, open, closeMenu]);

        useCloseOnScroll({
            enabled: closeOnScroll === true && isOpen,
            rootRef: elementRef,
            onClose: handleClose
        });

        const onRootKeyDown: (e: KeyboardEvent<HTMLDivElement>) => void =
            useCallback((e: KeyboardEvent<HTMLDivElement>): void => {
                menuListRef.current?.handleKeyDown(e);
            }, []);

        const handleClickOutside: (event: globalThis.MouseEvent) => void = useCallback(
            (event: globalThis.MouseEvent): void => {
                if (elementRef.current?.contains(event.target as Node)) { return; }
                handleClose(event);
            }, [handleClose]);

        useEffect(() => {
            const targetElement: HTMLElement | null = targetRef?.current ?? null;
            if (!targetElement) { return; }
            const proxyHandler: (evt: globalThis.MouseEvent) => void = (evt: globalThis.MouseEvent): void => {
                tapHoldHandlerRef.current?.(evt);
            };
            targetElement.addEventListener('contextmenu', proxyHandler);
            return () => targetElement.removeEventListener('contextmenu', proxyHandler);
        }, [targetRef]);

        useEffect(() => {
            if (!open && initialShowState.current === open) { return; }
            initialShowState.current = open;
            if (open) {
                if (offset?.left != null && offset?.top != null) {
                    setPopupPosition({ x: offset.left, y: offset.top });
                }
                setZIndex(computeZIndex(targetRef?.current ?? null));
                setIsOpen(true);
            } else {
                closeMenu();
            }
        }, [open, offset, closeMenu, computeZIndex]);

        useImperativeHandle(ref, () => {
            return {
                ...(refInstance as IContextMenu),
                element: elementRef.current
            } as IContextMenu;
        });

        useEffect(() => {
            if (!isOpen) { return; }
            const onResize: (evt: Event) => void = (evt: Event) => {
                handleClose(evt);
            };
            window.addEventListener('resize', onResize);
            return () => window.removeEventListener('resize', onResize);
        }, [isOpen, handleClose]);

        useEffect(() => {
            if (isOpen) {
                document.addEventListener('mousedown', handleClickOutside);
            } else {
                document.removeEventListener('mousedown', handleClickOutside);
            }
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }, [isOpen, handleClickOutside]);

        const rootClassName: string = useMemo(() => {
            return [
                CONTEXTMENU_CLASSES.ROOT,
                COMMON_CLASSES.CONTROL,
                dir === 'rtl' ? COMMON_CLASSES.RTL : '',
                className
            ].filter(Boolean).join(' ');
        }, [dir, className]);

        const portalContainer: HTMLElement | null = useMemo(() =>
            container || (typeof document !== 'undefined' ? document.body : null), [container]);

        if (!portalContainer) {
            return null;
        }

        return (<>
            {isOpen && createPortal(
                <div
                    ref={elementRef}
                    className={rootClassName}
                    onKeyDown={onRootKeyDown}
                    {...restProps}
                >
                    <MenuList
                        ref={menuListRef}
                        hoverDelay={hoverDelay}
                        animation={animation}
                        itemOnClick={itemOnClick}
                        isOpen={isOpen}
                        popupPosition={popupPosition}
                        subMenuContainerRef={elementRef}
                        setPopupPosition={setPopupPosition}
                        zIndex={zIndex}
                        onClose={handleClose}
                        onSelect={onSelect}
                        container={container}
                    >
                        {children}
                    </MenuList>
                </div>
                ,
                portalContainer
            )}
        </>);
    });

export default memo(ContextMenu);
