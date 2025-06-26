import { useState, useRef, forwardRef, useImperativeHandle, useEffect, Ref, ButtonHTMLAttributes, JSX } from 'react';
import { IPopup, Popup, CollisionType } from '@syncfusion/react-popups';
import { Button, IconPosition, Color, Size, Variant, IButton } from '@syncfusion/react-buttons';
import { AnimationOptions, useProviderContext, preRender, IAnimation, Animation, Effect } from '@syncfusion/react-base';
import * as React from 'react';

export interface AnimationProps {
    /**
     * Specifies the animation that should happen when toast opens.
     */
    show?: AnimationOptions;
    /**
     * Specifies the animation that should happen when toast closes.
     */
    hide?: AnimationOptions;
}

/**
 * ItemModel interface defines properties for each dropdown item.
 */
interface ItemModel {
    /**
     * Defines class/multiple classes separated by a space for the item that is used to include an icon.
     * Action item can include font icon and sprite image.
     *
     * @default -
     */
    icon?: string | React.ReactNode;

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
     * Used to enable or disable the item.
     *
     * @default false
     */
    disabled?: boolean;
}

/**
 * Interface representing the event arguments for item selection in dropdown components.
 */
export interface SelectMenuEvent {
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
 * DropDownButtonProps interface defines properties for DropDownButton component.
 */
export interface DropDownButtonProps {

    /**
     * Defines class/multiple classes separated by a space for the DropDownButton that is used to include an icon. DropDownButton can also include font icon and sprite image.
     *
     * @default -
     */
    icon?: string | React.ReactNode;

    /**
     * Specifies the position of the icon relative to the dropdownbutton text. Options include placing the icon at the left, right, top, or bottom of the button content.
     *
     * @default {IconPosition.Left}
     */
    iconPosition?: IconPosition;

    /**
     * Specifies action items with their properties to render as a popup in the DropDownButton.
     *
     * @default []
     */
    items?: ItemModel[];

    /**
     * This property defines the width of the dropdown popup for the DropDownButton component.
     *
     * @property {string | number} popupWidth - A string or number representing the width of the dropdown.
     * It can be a valid CSS unit such as `px`, `%`, or `rem`, or a number interpreted as pixels.
     * @default "auto"
     * @remarks
     * The `popupWidth` property allows developers to control the width of the dropdown popup, ensuring it fits their design requirements.
     * The default value of `auto` allows the popup to adjust based on the content length, but a specific width can be provided for more precise control.
     */
    popupWidth?: string | number;

    /**
     * Controls whether the popup element is created upon clicking open. When set to `true`, the popup is created on click.
     *
     * @default false
     */
    lazyOpen?: boolean;

    /**
     * Allows the specification of the target element for the DropDownButton's popup content.
     *
     * @default -
     */
    target?: React.RefObject<HTMLElement>;

    /**
     * Provides a template for displaying content within the dropdown items.
     *
     * @default null
     */
    itemTemplate?: string | Function;

    /**
     * Specifies the animation settings for opening the dropdown.
     * The settings control the duration, easing, and effect of the animation applied when the dropdown opens.
     *
     * @default { effect: 'SlideDown', duration: 400, easing: 'ease' }
     * @private
     */
    animation?: AnimationProps;

    /**
     * Triggers while closing the DropDownButton popup.
     *
     * @event close
     */
    onClose?: (event?: React.MouseEvent | MouseEvent) => void;

    /**
     * Triggers while opening the DropDownButton popup.
     *
     * @event open
     */
    onOpen?: (event?: React.MouseEvent | MouseEvent) => void;

    /**
     * Triggers while selecting action item in DropDownButton popup.
     *
     * @event select
     */
    onSelect?: (args: SelectMenuEvent) => void;

    /**
     * Specifies the color style of the Dropdown button. Options include 'Primary', 'Secondary', 'Warning', 'Success', 'Danger' and 'Info'.
     *
     * @default Color.Primary
     */
    color?: Color;

    /**
     * Specifies the variant style of the Dropdown button. Options include 'Outlined', 'Filled' and 'Flat'.
     *
     * @default Variant.Filled
     */
    variant?: Variant;

    /**
     * Specifies the size style of the Dropdown button. Options include 'Small', 'Medium' and 'Large'.
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
 * Interface representing the Button component methods.
 */
export interface IDropDownButton extends DropDownButtonProps {

    /**
     * To open/close DropDownButton popup based on current state of the DropDownButton.
     *
     * @public
     * @returns {void}
     */
    toggle?(): void;

    /**
     * This is button component element.
     *
     * @private
     * @default null
     */
    element?: HTMLElement | null;
}

type IDropDownButtonProps = IDropDownButton & ButtonHTMLAttributes<HTMLButtonElement>;

/**
 * The DropDownButton component is an interactive button that reveals a menu of actions or options when clicked, providing a dropdown interface for intuitive user interaction.
 *
 * ```typescript
 * <DropDownButton items={menuItems} icon={profileIcon} iconPosition={IconPosition.Right}/>
 * ```
 */
export const DropDownButton: React.ForwardRefExoticComponent<IDropDownButtonProps & React.RefAttributes<IDropDownButton>> =
    forwardRef<IDropDownButton, IDropDownButtonProps>((props: IDropDownButtonProps, ref: Ref<IDropDownButton>) => {
        const {
            children,
            className = '',
            icon,
            iconPosition = IconPosition.Left,
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
            size,
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
                            onClose(event);
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
        }, [isPopupOpen, onClose, menuItems]);

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

        const itemClickHandler: (
            item: ItemModel,
            event: React.MouseEvent<HTMLLIElement, MouseEvent>
        ) => void = (item: ItemModel, event: React.MouseEvent<HTMLLIElement, MouseEvent>) => {
            if (item.disabled) {
                return;
            }
            setIsPopupOpen(false);
            if (onSelect) {
                const args: {
                    event: React.MouseEvent<HTMLLIElement, MouseEvent>;
                    item: ItemModel;
                } = {
                    event,
                    item
                };
                onSelect(args);
            }
        };

        const renderItemContent: (item: ItemModel) => React.ReactNode = React.useCallback((item: ItemModel): React.ReactNode => {
            if (typeof itemTemplate === 'function') {
                return (itemTemplate as Function)(item);
            }
            if (typeof itemTemplate === 'string') {
                return <div>{itemTemplate}</div>;
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
                    className={`${className} sf-dropdown-btn`}
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

                {(isPopupOpen || !lazyOpen) && (
                    <Popup
                        isOpen={isPopupOpen}
                        ref={popupRef}
                        targetRef={target || buttonRef.current as React.RefObject<HTMLElement> }
                        relateTo={relateTo || (buttonRef.current?.element as HTMLElement)}
                        position={{ X: 'left', Y: 'bottom' }}
                        animation={animation}
                        collision={(dir === 'rtl') ? { X: CollisionType.Fit, Y: CollisionType.Flip } : { X: CollisionType.Flip, Y: CollisionType.Flip }}
                        width={popupWidth}
                        className={`sf-dropdown-popup ${popupWidth !== 'auto' ? 'sfdropdown-popup-width' : ''}`}
                        onClose={() => setIsPopupOpen(false)}
                    >
                        {renderItems()}
                    </Popup>
                )}
            </>
        );
    });

export default React.memo(DropDownButton);
