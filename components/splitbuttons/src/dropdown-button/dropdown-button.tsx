import { useState, useRef, forwardRef, useImperativeHandle, useEffect, Ref, ButtonHTMLAttributes, JSX, useCallback } from 'react';
import { IPopup, Popup, CollisionType } from '@syncfusion/react-popups';
import { Button, Position, Color, Size, Variant, IButton } from '@syncfusion/react-buttons';
import { AnimationOptions, useProviderContext, preRender, IAnimation, Animation, Effect } from '@syncfusion/react-base';
import * as React from 'react';
import { createPortal } from 'react-dom';
export {  Color, Size, Variant, Position };

interface AnimationProps {
    /**
     * Specifies the animation that should happen when Popup opens.
     */
    show?: AnimationOptions;
    /**
     * Specifies the animation that should happen when Popup closes.
     */
    hide?: AnimationOptions;
}

/**
 * ItemModel interface defines properties for each dropdown item.
 */
export interface ItemModel {
    /**
     * Defines class/multiple classes separated by a space for the item that is used to include an icon.
     * Action item can include font icon and sprite image.
     *
     * @default -
     */
    icon?: React.ReactNode;

    /**
     * Specifies the id for item.
     *
     * @default -
     */
    id?: string;

    /**
     * Specifies separator between the items. Separator are horizontal lines used to group action items.
     *
     * @default false
     */
    hasSeparator?: boolean;

    /**
     * Specifies text for item.
     *
     * @default -
     */
    text?: string;

    /**
     * Specifies url for item that creates the anchor link to navigate to the url provided.
     *
     * @default -
     */
    url?: string;

    /**
     * Specifies to enable or disable the item.
     *
     * @default false
     */
    disabled?: boolean;
}

/**
 * Interface representing the event arguments for item selection in dropdown components.
 */
export interface ButtonSelectEvent {
    /**
     * The original mouse event that triggered the selection.
     * Contains information about the click event on the list item.
     */
    event: React.MouseEvent<HTMLLIElement, MouseEvent>;

    /**
     * The data object representing the selected item.
     * Contains properties like id, text, icon, and other attributes of the selected item.
     */
    item: ItemModel;
}

/**
 * Dropdown Button properties used to customize its behavior and appearance.
 */
export interface DropDownButtonProps {

    /**
     * Specifies an icon for the Dropdown Button, defined using a CSS class name for custom styling or an SVG element for rendering.
     *
     * @default -
     */
    icon?: React.ReactNode;

    /**
     * Specifies the position of the icon relative to the Dropdown Button text. Options include placing the icon at the left, right, top, or bottom of the button content.
     *
     * @default Position.Left
     */
    iconPosition?: Position;

    /**
     * Specifies action items with their properties to render as a popup in the Dropdown Button.
     *
     * @default []
     */
    items?: ItemModel[];

    /**
     * This property defines the width of the dropdown popup for the Dropdown Button component.
     * Set the width as a string or number using valid CSS units like `px`, `%`, or `rem`, or as pixels.
     * The default value of `auto` allows the popup to adjust based on the content length, but a specific width can be provided for more precise control.
     *
     * @default auto
     */
    popupWidth?: string | number;

    /**
     * Controls whether the popup element is created upon clicking open. When set to `true`, the popup is created on click.
     *
     * @default false
     */
    lazyOpen?: boolean;

    /**
     * Specifies the target element for the Dropdown Button's popup content.
     *
     * @default -
     */
    target?: React.RefObject<HTMLElement>;

    /**
     * Provides a template for displaying content within the dropdown items.
     *
     * @default -
     */
    itemTemplate?: (item: ItemModel) => React.ReactNode;

    /**
     * Specifies the animation settings for opening the dropdown.
     * The settings control the duration, easing, and effect of the animation applied when the dropdown opens.
     *
     * @default { effect: 'SlideDown', duration: 400, easing: 'ease' }
     * @private
     */
    animation?: AnimationProps;

    /**
     * Triggers while closing the Dropdown Button popup.
     *
     * @event onClose
     */
    onClose?: (event?: React.MouseEvent) => void;

    /**
     * Triggers while opening the Dropdown Button popup.
     *
     * @event onOpen
     */
    onOpen?: (event?: React.MouseEvent) => void;

    /**
     * Triggers while selecting action item in Dropdown Button popup.
     *
     * @event onSelect
     */
    onSelect?: (event: ButtonSelectEvent) => void;

    /**
     * Specifies the color style of the Dropdown Button. Options include 'Primary', 'Secondary', 'Warning', 'Success', 'Error' and 'Info'.
     *
     * @default Color.Primary
     */
    color?: Color;

    /**
     * Specifies the variant style of the Dropdown Button. Options include 'Outlined', 'Filled' and 'Standard'.
     *
     * @default Variant.Filled
     */
    variant?: Variant;

    /**
     * Specifies the size style of the Dropdown Button. Options include 'Small', 'Medium' and 'Large'.
     *
     * @default Size.Medium
     */
    size?: Size;

    /**
     * Specifies the relative container element of the dropdown popup element.Based on the relative element, popup element will be positioned.
     *
     * @default 'body'
     * @private
     */
    relateTo?: HTMLElement | string;
}

/**
 * Represents the methods of the Dropdown Button component.
 */
export interface IDropDownButton extends DropDownButtonProps {

    /**
     * To open/close Dropdown Button popup based on current state of the Dropdown Button.
     *
     * @public
     * @returns {void}
     */
    toggle?(): void;

    /**
     * This is button component element.
     *
     * @private
     * @default -
     */
    element?: HTMLElement | null;
}

type IDropDownButtonProps = IDropDownButton & ButtonHTMLAttributes<HTMLButtonElement>;

/**
 * The Dropdown Button component is an interactive button that reveals a menu of actions or options when clicked, providing a dropdown interface for intuitive user interaction.
 *
 * ```typescript
 * import { DropDownButton } from "@syncfusion/react-splitbuttons";
 *
 * const menuItems = [{ text: 'Cut' }, { text: 'Copy' }, { text: 'Paste' }];
 * <DropDownButton items={menuItems}>Default</DropDownButton>
 * ```
 */
export const DropDownButton: React.ForwardRefExoticComponent<IDropDownButtonProps & React.RefAttributes<IDropDownButton>> =
    forwardRef<IDropDownButton, IDropDownButtonProps>((props: IDropDownButtonProps, ref: Ref<IDropDownButton>) => {
        const {
            children,
            className = '',
            icon,
            iconPosition = Position.Left,
            items = [],
            popupWidth = 'auto',
            animation = { show: {name: 'SlideDown', duration: 100, timingFunction: 'ease'},
                hide: {name: 'SlideUp', duration: 100, timingFunction: 'ease'} },
            disabled = false,
            lazyOpen = false,
            itemTemplate,
            target,
            relateTo,
            color,
            variant,
            size = Size.Medium,
            onClose,
            onOpen,
            onSelect,
            ...domProps
        } = props;

        const buttonRef: React.RefObject<IButton | null> = useRef<IButton>(null);
        const popupRef: React.RefObject<IPopup | null> = useRef<IPopup>(null);
        const [isPopupOpen, setIsPopupOpen] = useState<boolean>(false);
        const [menuItems, setMenuItems] = useState<ItemModel[]>(items);
        const { dir } = useProviderContext();

        const isMounted: React.RefObject<boolean> = useRef(true);
        const itemClickHandler: (
            item: ItemModel,
            event: React.MouseEvent<HTMLLIElement, MouseEvent>
        ) => void = useCallback((item: ItemModel, event: React.MouseEvent<HTMLLIElement, MouseEvent>) => {
            if (item.disabled) {
                return;
            }
            setIsPopupOpen(false);
            if (onSelect) {
                const args: ButtonSelectEvent = { event, item };
                onSelect(args);
            }
            if (buttonRef.current?.element) {
                buttonRef.current.element.focus();
            }
        }, [onSelect]);

        const updateMenuItems: (items: ItemModel[], setMenuItems: React.Dispatch<React.SetStateAction<ItemModel[]>>) => void
         = (items: ItemModel[], setMenuItems: React.Dispatch<React.SetStateAction<ItemModel[]>>) => {
             if (isMounted) {
                 setMenuItems((prevItems: ItemModel[]) => {
                     const isDifferent: boolean = items.length !== prevItems.length || items.some((item: ItemModel, index: number) => {
                         const prevItem: ItemModel | undefined = prevItems[index as number];
                         return (
                             item.id !== prevItem?.id ||
                                item.text !== prevItem?.text ||
                                item.url !== prevItem?.url ||
                                item.disabled !== prevItem?.disabled ||
                                typeof item.icon === 'string' ? item.icon !== prevItem?.icon : !React.isValidElement(item.icon)
                         );
                     });
                     return isDifferent ? items : prevItems;
                 });
             }
         };

        useEffect(() => {
            updateMenuItems(items, setMenuItems);

            return () => {
                isMounted.current = false;
            };
        }, [items]);

        useEffect(() => {
            preRender('dropDownButton');
        }, []);

        useEffect(() => {
            const handleClickOutside: (event: MouseEvent) => void = (event: MouseEvent) => {
                const buttonElement: HTMLElement | null | undefined = buttonRef.current?.element;
                const popupElement: HTMLElement | null | undefined = popupRef.current?.element;
                const targetNode: Node = event.target as Node;
                if (buttonElement && popupElement) {
                    if (!buttonElement.contains(targetNode) && !popupElement.contains(targetNode)) {
                        setIsPopupOpen(false);
                        if (onClose && isPopupOpen) {
                            onClose(event as unknown as React.MouseEvent);
                        }
                    }
                }
            };

            if (isPopupOpen) {
                document.addEventListener('mousedown', handleClickOutside);
            } else {
                document.removeEventListener('mousedown', handleClickOutside);
            }

            const handleKeyDown: (event: KeyboardEvent) => void = (event: KeyboardEvent) => {
                if (!isPopupOpen || !popupRef.current) { return; }
                const popupElement: HTMLElement | null | undefined = popupRef.current?.element;
                const ul: HTMLUListElement | null | undefined = popupElement?.querySelector('ul');

                if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                    event.preventDefault();
                    const isDownKey: boolean = event.key === 'ArrowDown';
                    upDownKeyHandler(ul as HTMLElement, isDownKey);
                    if (buttonRef.current?.element) {
                        (buttonRef.current?.element as HTMLElement).blur();
                    }
                }

                if (event.key === 'Enter') {
                    event.preventDefault();
                    const focusedItem: HTMLElement = popupElement?.querySelector('.sf-focused') as HTMLElement;
                    if (focusedItem) {
                        const items: Element[] = Array.from(ul?.children || []);
                        const itemIndex: number = items.indexOf(focusedItem);
                        if (itemIndex !== -1 && itemIndex < menuItems.length) {
                            const item: ItemModel = menuItems[itemIndex as number];
                            if (!item.disabled && !item.hasSeparator) {
                                try {
                                    focusedItem.click();
                                } catch (e) {
                                    const syntheticEvent: React.MouseEvent<HTMLLIElement, MouseEvent> = {
                                        currentTarget: focusedItem,
                                        target: focusedItem,
                                        type: 'click'
                                    } as unknown as React.MouseEvent<HTMLLIElement, MouseEvent>;
                                    itemClickHandler(item, syntheticEvent);
                                }
                                if (buttonRef.current?.element) {
                                    buttonRef.current.element.focus();
                                }
                            }
                        }
                    }
                }

                if (event.key === 'Escape') {
                    setIsPopupOpen(false);
                }
            };

            document.addEventListener('keydown', handleKeyDown);

            return () => {
                document.removeEventListener('mousedown', handleClickOutside);
                document.removeEventListener('keydown', handleKeyDown);
            };
        }, [isPopupOpen, onClose, menuItems, itemClickHandler]);

        const publicAPI: Partial<IDropDownButton> = {
            iconPosition,
            icon,
            target,
            popupWidth,
            items,
            lazyOpen,
            relateTo,
            itemTemplate,
            color,
            variant,
            size
        };

        const animationOption: {
            name: Effect;
            duration: number | undefined;
            timingFunction: string | undefined;
        } | null = animation.show?.name !== undefined ? {
            name: animation.show?.name,
            duration: animation.show.duration,
            timingFunction: animation.show.timingFunction
        } : null;

        const togglePopup: (event?: React.MouseEvent) => void = (event?: React.MouseEvent) => {
            if (!isPopupOpen) {
                if (animationOption) {
                    const animationInstance: IAnimation = Animation(animationOption);
                    if (animationInstance.animate) {
                        const popupElement: HTMLElement = popupRef.current?.element?.children[0] as HTMLElement;
                        if (popupElement) {
                            animationInstance.animate(popupElement, {
                                begin: (args: AnimationOptions) => {
                                    const element: HTMLElement = args?.element as HTMLElement;
                                    if (element && element.parentElement) {
                                        const parent: HTMLElement = element.parentElement as HTMLElement;
                                        const originalDisplay: string = parent.style.display;
                                        parent.style.display = 'block';
                                        parent.style.maxHeight = parent.offsetHeight + 'px';
                                        parent.style.display = originalDisplay;
                                    }
                                }
                            });
                        }
                    }
                }
                setIsPopupOpen(true);
                if (onOpen) {
                    onOpen(event);
                }
            } else {
                setIsPopupOpen(false);
                if (onClose) {
                    onClose(event);
                }
            }
        };

        useImperativeHandle(ref, () => ({
            ...publicAPI as IDropDownButton,
            toggle: togglePopup,
            element: buttonRef.current?.element
        }), [publicAPI]);
        const renderItemContent: (item: ItemModel) => React.ReactNode = React.useCallback((item: ItemModel): React.ReactNode => {
            if (itemTemplate) {
                return (itemTemplate as Function)(item);
            }
            return (
                <>
                    {item.icon && typeof item.icon === 'string' && (
                        <span className={`sf-menu-icon ${item.icon}`}></span>
                    )}
                    {item.icon && typeof item.icon !== 'string' && (
                        <span className='sf-menu-icon'>{item.icon}</span>
                    )}
                    <span>{item.text}</span>
                </>
            );
        }, [itemTemplate]);

        const handleItemClick: (item: ItemModel, event: React.MouseEvent<HTMLLIElement, MouseEvent>) => void
        = React.useCallback((item: ItemModel, event: React.MouseEvent<HTMLLIElement, MouseEvent>) => {
            event.stopPropagation();
            itemClickHandler(item, event);
        }, [itemClickHandler]);

        const renderItems: () => JSX.Element = React.useCallback(() => (
            <ul role='menu' tabIndex={0} aria-label='dropdown menu'>
                {menuItems.map((item: ItemModel, index: number) => {
                    const liClassName: string = `sf-item ${item.hasSeparator ? 'sf-separator' : ''} ${item.disabled ? 'sf-disabled' : ''}`;

                    return (
                        <li
                            key={item.id || `item-${index}`}
                            className={liClassName}
                            role={item.hasSeparator ? 'separator' : 'menuitem'}
                            aria-label={item.text}
                            aria-disabled={item.disabled ? 'true' : 'false'}
                            onClick={item.disabled && item.hasSeparator ? undefined :
                                (event: React.MouseEvent<HTMLLIElement, MouseEvent>) => handleItemClick(item, event)}
                        >
                            {!item.hasSeparator && renderItemContent(item)}
                        </li>
                    );
                })}
            </ul>
        ), [menuItems, renderItemContent, handleItemClick]);


        const upDownKeyHandler: (ul: HTMLElement, isDownKey: boolean) => void = (ul: HTMLElement, isDownKey: boolean): void => {
            const items: HTMLElement[] = Array.from(ul.children) as HTMLElement[];
            const currentIdx: number = items.findIndex((item: HTMLElement) => item.classList.contains('sf-focused'));
            items.forEach((item: HTMLElement) => {
                item.classList.remove('sf-selected', 'sf-focused');
            });
            const itemsCount: number = items.length;
            let nextIdx: number;
            if (currentIdx === -1) {
                nextIdx = isDownKey ? 0 : itemsCount - 1;
            } else {
                nextIdx = isDownKey ? currentIdx + 1 : currentIdx - 1;
                if (nextIdx < 0) {nextIdx = itemsCount - 1; }
                else if (nextIdx >= itemsCount) {nextIdx = 0; }
            }
            let tries: number = 0;
            while (
                (items[nextIdx as number].classList.contains('sf-disabled') ||
                 items[nextIdx as number].classList.contains('sf-separator')) &&
                tries < itemsCount
            ) {
                nextIdx = isDownKey
                    ? (nextIdx + 1) % itemsCount
                    : (nextIdx - 1 + itemsCount) % itemsCount;
                tries++;
            }
            const nextItem: HTMLElement = items[nextIdx as number];
            nextItem.classList.add('sf-focused');
            nextItem.focus();
        };

        return (
            <>
                <Button
                    ref={buttonRef}
                    className={`${className} sf-dropdown-btn sf-drp-btn-${size.toLowerCase().substring(0, 2)}`}
                    icon={icon}
                    color={color}
                    dropIcon={true}
                    variant={variant}
                    size={size}
                    iconPosition={iconPosition}
                    disabled={disabled}
                    onClick={(event: React.MouseEvent) => {
                        event.preventDefault();
                        togglePopup(event);
                    }}
                    aria-haspopup='true'
                    aria-expanded={isPopupOpen ? 'true' : 'false'}
                    {...domProps}
                >
                    {children}
                </Button>

                {(isPopupOpen || !lazyOpen) && createPortal(
                    <Popup
                        open={isPopupOpen}
                        ref={popupRef}
                        targetRef={target || buttonRef.current as React.RefObject<HTMLElement> }
                        relateTo={relateTo || (buttonRef.current?.element as HTMLElement)}
                        position={{ X: 'left', Y: 'bottom' }}
                        animation={animation}
                        collision={(dir === 'rtl') ? { X: CollisionType.Fit, Y: CollisionType.Flip } : { X: CollisionType.Flip, Y: CollisionType.Flip }}
                        width={popupWidth}
                        className={`sf-dropdown-popup sf-drp-btn-${size.toLowerCase().substring(0, 2)} ${popupWidth !== 'auto' ? 'sf-dropdown-popup-width' : ''}`}
                        onClose={() => setIsPopupOpen(false)}
                    >
                        {renderItems()}
                    </Popup>,
                    document.body
                )}
            </>
        );
    });

export default React.memo(DropDownButton);
