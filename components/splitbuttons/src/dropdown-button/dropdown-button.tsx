import { useState, useRef, forwardRef, useImperativeHandle, useEffect, Ref, ButtonHTMLAttributes, JSX, useCallback, useMemo,
    ReactNode, SyntheticEvent, ForwardRefExoticComponent, RefAttributes, memo, type MouseEvent, type KeyboardEvent,
    isValidElement, Dispatch, SetStateAction, RefObject
} from 'react';
import { IPopup, Popup, CollisionType, PositionAxis, CollisionAxis, PopupAnimationOptions, PopupSettings } from '@syncfusion/react-popups';
import { Button, Position, Color, Size, Variant, IButton } from '@syncfusion/react-buttons';
import { useProviderContext, preRender, IAnimation, AnimationOptions, Animation, Effect } from '@syncfusion/react-base';
import { createPortal } from 'react-dom';
export { Color, Size, Variant, Position, PositionAxis, CollisionAxis, CollisionType, PopupSettings };

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
    icon?: ReactNode;

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
    event?: SyntheticEvent;

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
    icon?: ReactNode;

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
     * Controls whether the popup element is created upon clicking open. When set to `true`, the popup is created on click.
     *
     * @default false
     */
    lazyOpen?: boolean;

    /**
     * Provides a template for displaying content within the dropdown items.
     *
     * @default -
     */
    itemTemplate?: (item: ItemModel) => ReactNode;

    /**
     * Specifies the popup settings including position, offset, collision handling, animation, and target element configuration.
     *
     * @default {}
     */
    popupSettings?: PopupSettings;

    /**
     * Triggers while closing the Dropdown Button popup.
     *
     * @event onClose
     */
    onClose?: (event?: SyntheticEvent) => void;

    /**
     * Triggers while opening the Dropdown Button popup.
     *
     * @event onOpen
     */
    onOpen?: (event?: SyntheticEvent) => void;

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

type IDropDownButtonProps = IDropDownButton & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onSelect'>;

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
export const DropDownButton: ForwardRefExoticComponent<IDropDownButtonProps & RefAttributes<IDropDownButton>> =
    forwardRef<IDropDownButton, IDropDownButtonProps>((props: IDropDownButtonProps, ref: Ref<IDropDownButton>) => {
        const {
            children,
            className = '',
            icon,
            iconPosition = Position.Left,
            items = [],
            disabled = false,
            lazyOpen = false,
            itemTemplate,
            popupSettings = {},
            color,
            variant,
            size = Size.Medium,
            onClose,
            onOpen,
            onSelect,
            ...domProps
        } = props;

        const { dir } = useProviderContext();
        const {
            position = { X: 'left', Y: 'bottom' },
            offsetX = 0,
            offsetY = 0,
            collision,
            zIndex,
            autoReposition,
            width = 'auto',
            height,
            viewPortElementRef
        } = popupSettings;
        const animation: PopupAnimationOptions = { show: { name: 'SlideDown', duration: 100, timingFunction: 'ease' },
            hide: { name: 'SlideUp', duration: 100, timingFunction: 'ease' } };
        const resolvedCollision: CollisionAxis = collision || ((dir === 'rtl') ? { X: CollisionType.Fit, Y: CollisionType.Flip } : { X: CollisionType.Flip, Y: CollisionType.Flip });
        const buttonRef: RefObject<IButton | null> = useRef<IButton>(null);
        const popupRef: RefObject<IPopup | null> = useRef<IPopup>(null);
        const listRef: RefObject<HTMLUListElement | null> = useRef<HTMLUListElement>(null);
        const itemRefs: RefObject<Array<HTMLLIElement | null>> = useRef<Array<HTMLLIElement | null>>([]);
        const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

        const [isPopupOpen, setIsPopupOpen] = useState<boolean>(false);
        const [menuItems, setMenuItems] = useState<ItemModel[]>(items);
        const [mounted, setMounted] = useState(false);

        useEffect(() => {
            setMounted(true);
        }, []);

        const isMounted: RefObject<boolean> = useRef(true);

        const itemClickHandler: (
            item: ItemModel,
            event?: SyntheticEvent
        ) => void = useCallback((item: ItemModel, event?: SyntheticEvent) => {
            if (item.disabled) {
                return;
            }
            setIsPopupOpen(false);
            if (onSelect) {
                const args: ButtonSelectEvent = { event, item };
                onSelect(args);
            }
        }, [onSelect]);

        const updateMenuItems: (items: ItemModel[], setMenuItems: Dispatch<SetStateAction<ItemModel[]>>) => void
        = useCallback((items: ItemModel[], setMenuItems: Dispatch<SetStateAction<ItemModel[]>>) => {
            if (isMounted) {
                setMenuItems((prevItems: ItemModel[]) => {
                    const isDifferent: boolean = items.length !== prevItems.length || items.some((item: ItemModel, index: number) => {
                        const prevItem: ItemModel | undefined = prevItems[index as number];
                        return (
                            item.id !== prevItem?.id ||
                               item.text !== prevItem?.text ||
                               item.url !== prevItem?.url ||
                               item.disabled !== prevItem?.disabled ||
                               (typeof item.icon === 'string' ? item.icon !== prevItem?.icon : !isValidElement(item.icon))
                        );
                    });
                    return isDifferent ? items : prevItems;
                });
            }
        }, []);

        useEffect(() => {
            updateMenuItems(items, setMenuItems);

            return () => {
                isMounted.current = false;
            };
        }, [items]);

        useEffect(() => {
            preRender('dropDownButton');
        }, []);

        const focusableIndices: number[] = useMemo(() => {
            return menuItems
                .map((it: ItemModel, idx: number) => (!it.disabled && !it.hasSeparator ? idx : -1))
                .filter((idx: number) => idx >= 0);
        }, [menuItems]);

        const getNextFocusableIndex: (current: number, down: boolean) => number =
        useCallback((current: number, down: boolean): number => {
            const len: number = focusableIndices.length;
            if (!len) { return -1; }
            const pos: number = focusableIndices.indexOf(current);
            if (pos < 0) {
                return focusableIndices[down ? 0 : len - 1];
            }
            const nextPos: number = (pos + (down ? 1 : -1) + len) % len;
            return focusableIndices[nextPos as number];
        }, [focusableIndices]);

        const ensureValidFocusIndex: (idx: number | null) => number | null =
        useCallback((idx: number | null): number | null => {
            if (idx != null && focusableIndices.includes(idx)) {
                return idx;
            }
            return null;
        }, [focusableIndices]);

        const focusIndex: (idx: number | null) => void = useCallback(
            (idx: number | null): void => {
                const valid: number | null = ensureValidFocusIndex(idx);
                setFocusedIndex(valid);
                if (valid != null) {
                    itemRefs.current[valid as number]?.focus();
                }
            }, [ensureValidFocusIndex]);

        useEffect(() => {
            setFocusedIndex((prev: number | null) => ensureValidFocusIndex(prev));
        }, [menuItems, ensureValidFocusIndex]);

        useEffect(() => {
            const handleClickOutside: (event: globalThis.MouseEvent) => void = (event: globalThis.MouseEvent): void => {
                const buttonElement: HTMLElement | null | undefined = buttonRef.current?.element;
                const popupElement: HTMLElement | null | undefined = popupRef.current?.element;
                const targetNode: Node = event.target as Node;
                if (buttonElement && popupElement) {
                    if (!buttonElement.contains(targetNode) && !popupElement.contains(targetNode)) {
                        setIsPopupOpen(false);
                        if (onClose && isPopupOpen) {
                            onClose(event as unknown as MouseEvent);
                        }
                    }
                }
            };

            const handleKeyDown: (e: globalThis.KeyboardEvent) => void = (e: globalThis.KeyboardEvent): void => {
                if ((e.altKey || e.metaKey) && e.key === 'ArrowUp' || e.key === 'Escape' || e.key === 'Esc') {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsPopupOpen(false);
                    onClose?.(e as unknown as MouseEvent);
                    buttonRef.current?.element?.focus();
                }
            };

            if (isPopupOpen) {
                document.addEventListener('mousedown', handleClickOutside);
                document.addEventListener('keydown', handleKeyDown);
            }
            return () => {
                document.removeEventListener('mousedown', handleClickOutside);
                document.removeEventListener('keydown', handleKeyDown);
            };
        }, [isPopupOpen, onClose]);

        const publicAPI: Partial<IDropDownButton> = useMemo(() => ({
            iconPosition,
            icon,
            items,
            lazyOpen,
            itemTemplate,
            popupSettings,
            color,
            variant,
            size
        }), [iconPosition, icon, items, lazyOpen, itemTemplate, popupSettings, color, variant, size]);

        const animationOption: {
            name: Effect;
            duration: number | undefined;
            timingFunction: string | undefined;
        } | null = animation.show?.name !== undefined ? {
            name: animation.show?.name,
            duration: animation.show.duration,
            timingFunction: animation.show.timingFunction
        } : null;

        const togglePopup: (event?: SyntheticEvent) => void = (event?: SyntheticEvent) => {
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
                const initial: number | null = ensureValidFocusIndex(focusedIndex);
                focusIndex(initial);
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

        const handleKeyDown: (e: KeyboardEvent<HTMLElement>) => void =
            useCallback((e: KeyboardEvent<HTMLElement>): void => {
                switch (e.key) {
                case 'ArrowDown': {
                    e.preventDefault();
                    e.stopPropagation();
                    if (e.altKey || e.metaKey) {
                        togglePopup(e as SyntheticEvent);
                    } else {
                        const nextIndex: number = getNextFocusableIndex(focusedIndex ?? -1, true);
                        focusIndex(nextIndex);
                    }
                    break;
                }
                case 'ArrowUp': {
                    e.preventDefault();
                    e.stopPropagation();
                    if (e.altKey || e.metaKey) {
                        setIsPopupOpen(false);
                        onClose?.(e as KeyboardEvent<HTMLElement>);
                        buttonRef.current?.element?.focus();
                    } else {
                        const prevIndex: number = getNextFocusableIndex(focusedIndex ?? -1, false);
                        focusIndex(prevIndex);
                    }
                    break;
                }
                case 'Home': {
                    if (isPopupOpen) {
                        e.preventDefault();
                        focusIndex(focusableIndices[0] ?? null);
                    }
                    break;
                }
                case 'End': {
                    if (isPopupOpen) {
                        e.preventDefault();
                        focusIndex(focusableIndices[focusableIndices.length - 1] ?? null);
                    }
                    break;
                }
                case 'Enter':
                case ' ': {
                    e.preventDefault();
                    if (isPopupOpen) {
                        const idx: number | null = ensureValidFocusIndex(focusedIndex);
                        if (idx != null) {
                            itemClickHandler(menuItems[idx as number], e);
                        }
                    } else {
                        togglePopup(e as unknown as MouseEvent);
                    }
                    break;
                }
                case 'Escape':
                case 'Esc': {
                    e.preventDefault();
                    if (isPopupOpen) {
                        setIsPopupOpen(false);
                        onClose?.(e as SyntheticEvent);
                        buttonRef.current?.element?.focus();
                    }
                    break;
                }
                default:
                    break;
                }
            }, [
                isPopupOpen,
                focusedIndex,
                focusableIndices,
                getNextFocusableIndex,
                ensureValidFocusIndex,
                togglePopup,
                setIsPopupOpen,
                onClose,
                buttonRef,
                focusIndex,
                itemClickHandler,
                menuItems
            ]);

        const renderItemContent: (item: ItemModel) => ReactNode = useCallback((item: ItemModel): ReactNode => {
            if (itemTemplate) {
                return itemTemplate(item);
            }

            const content: JSX.Element = (
                <>
                    {item.icon && (
                        <span className="sf-menu-icon">
                            {typeof item.icon === 'string' ? <span className={item.icon} /> : item.icon}
                        </span>
                    )}
                    <span>{item.text}</span>
                </>
            );

            return item.url ? (
                <a href={item.url} className="sf-menu-link">
                    {content}
                </a>
            ) : content;
        }, [itemTemplate]);

        const handleItemClick: (item: ItemModel, event: MouseEvent<HTMLLIElement, globalThis.MouseEvent>) => void
        = useCallback((item: ItemModel, event: MouseEvent<HTMLLIElement, globalThis.MouseEvent>) => {
            event.stopPropagation();
            const el: Element = event.currentTarget;
            const idx: number = itemRefs.current.findIndex((li: HTMLLIElement | null) => li === el);
            focusIndex(idx);
            itemClickHandler(item, event);
        }, [itemClickHandler, focusIndex]);

        const renderItems: () => JSX.Element = useCallback(() => (
            <ul
                role='menu'
                tabIndex={0}
                aria-label='dropdown menu'
                ref={listRef}
                onKeyDown={handleKeyDown}
                onMouseDown={(e: SyntheticEvent) => e.preventDefault()}
            >
                {menuItems.map((item: ItemModel, index: number) => {
                    const isFocused: boolean = focusedIndex === index;
                    const liClassName: string = `sf-item sf-ellipsis ${item.hasSeparator ? 'sf-separator' : ''} ${item.disabled ? 'sf-disabled' : ''} ${isFocused ? 'sf-focused' : ''}`;
                    return (
                        <li
                            key={item.id || `item-${index}`}
                            ref={(el: HTMLLIElement | null) => { itemRefs.current[index as number] = el; }}
                            className={liClassName}
                            role={item.hasSeparator ? 'separator' : 'menuitem'}
                            aria-label={item.text}
                            aria-disabled={item.disabled ? 'true' : 'false'}
                            onClick={item.disabled || item.hasSeparator ? undefined :
                                (event: MouseEvent<HTMLLIElement, globalThis.MouseEvent>) => handleItemClick(item, event)}
                        >
                            {!item.hasSeparator && renderItemContent(item)}
                        </li>
                    );
                })}
            </ul>
        ), [menuItems, renderItemContent, handleItemClick, focusedIndex, focusIndex, handleKeyDown]);

        return (
            <>
                <Button
                    ref={buttonRef}
                    className={`${className} sf-dropdown-btn sf-drp-btn-${size.toLowerCase().substring(0, 2)} ${isPopupOpen ? 'sf-active' : ''}`}
                    icon={icon}
                    color={color}
                    dropIcon={true}
                    variant={variant}
                    size={size}
                    iconPosition={iconPosition}
                    disabled={disabled}
                    onKeyDown={handleKeyDown}
                    onClick={(event: MouseEvent) => {
                        event.preventDefault();
                        togglePopup(event);
                    }}
                    aria-haspopup='true'
                    aria-expanded={isPopupOpen ? 'true' : 'false'}
                    {...domProps}
                >
                    {children}
                </Button>

                {mounted && (isPopupOpen || !lazyOpen) && typeof document !== 'undefined' && createPortal(
                    <Popup
                        open={isPopupOpen}
                        ref={popupRef}
                        viewPortElementRef={viewPortElementRef}
                        relateTo={buttonRef.current?.element as HTMLElement}
                        position={position}
                        offsetX={offsetX}
                        offsetY={offsetY}
                        animation={animation}
                        collision={resolvedCollision}
                        zIndex={zIndex}
                        autoReposition={autoReposition}
                        width={width}
                        height={height}
                        className={`sf-dropdown-popup sf-drp-btn-${size.toLowerCase().substring(0, 2)} ${width !== 'auto' ? 'sf-dropdown-popup-width' : ''}`}
                        onClose={() => {
                            setIsPopupOpen(false);
                            if (buttonRef.current?.element) {
                                buttonRef.current.element.focus();
                            }
                        }}
                        onOpen={() => {
                            listRef.current?.focus();
                        }}
                    >
                        {renderItems()}
                    </Popup>,
                    document.body
                )}
            </>
        );
    });

export default memo(DropDownButton);
