import { useRef, forwardRef, useImperativeHandle, Ref, useEffect, useMemo, ButtonHTMLAttributes } from 'react';
import { Button, Position, Color, Size, Variant, IButton } from '@syncfusion/react-buttons';
import { preRender, useProviderContext } from '@syncfusion/react-base';
import { DropDownButton, IDropDownButton, ButtonSelectEvent, ItemModel, PopupSettings } from '../dropdown-button/dropdown-button';
import * as React from 'react';

/**
 * Split Button properties used to customize its behavior and appearance.
 */
export interface SplitButtonProps {

    /**
     * Specifies an icon for the button, which can be defined using a CSS class name for custom styling or an SVG element for rendering.
     *
     * @default -
     */
    icon?: React.ReactNode;

    /**
     * Specifies the position of the icon relative to the Dropdown Button text. Options include placing the icon at the left, right, top, or bottom of the button content.
     *
     * @default 'Left'
     */
    iconPosition?: Position;

    /**
     * Specifies action items with its properties which will be rendered as Split Button secondary button popup.
     *
     * @default []
     */
    items?: ItemModel[];

    /**
     * Specifies the popup element creation on open.
     *
     * @default false
     */
    lazyOpen?: boolean;

    /**
     * Provides a template for displaying content within the dropdown items.
     *
     * @default -
     */
    itemTemplate?: (item: ItemModel) => React.ReactNode;

    /**
     * Specifies the popup settings including position, offset, collision handling, animation, and target element configuration.
     *
     * @default {}
     */
    popupSettings?: PopupSettings;

    /**
     * Specifies the color style of the Split Button. Options include 'Primary', 'Secondary', 'Warning', 'Success', 'Error' and 'Info'.
     *
     * @default Color.Primary
     */
    color?: Color;

    /**
     * Specifies the variant style of the Split Button. Options include 'Outlined', 'Filled' and 'Standard'.
     *
     * @default Variant.Filled
     */
    variant?: Variant;

    /**
     * Specifies the size style of the Split Button. Options include 'Small', 'Medium' and 'Large'.
     *
     * @default Size.Medium
     */
    size?: Size;

    /**
     * Event triggered while closing the Split Button popup.
     *
     * @event onClose
     */
    onClose?: (event?: React.SyntheticEvent) => void;

    /**
     * Event triggered while opening the Split Button popup.
     *
     * @event onOpen
     */
    onOpen?: (event?: React.SyntheticEvent) => void;

    /**
     * Event triggered while selecting an action item in Split Button popup.
     *
     * @event onSelect
     */
    onSelect?: (event: ButtonSelectEvent) => void;

    /**
     * Specifies additional properties to apply to the trailing dropdown button element.
     * User-provided props will override internal default values.
     *
     * @default -
     */
    trailingButtonProps?: Partial<IDropDownButton & React.ButtonHTMLAttributes<HTMLButtonElement>>;
}

/**
 * Represents the methods of the Split Button component.
 */
export interface ISplitButton extends SplitButtonProps {
    /**
     * This is Split Button component element.
     *
     * @private
     * @default null
     */
    element?: HTMLElement | null;

    /**
     * To open/close Split Button popup based on current state of the Split Button.
     *
     * @public
     * @returns {void}
     */
    toggle?(): void;
}

type ISplitButtonProps = ISplitButton & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onSelect'>;

/**
 * The Split Button component provides a combination of a default button action and a Dropdown Button, enabling users to quickly access additional options or actions in a compact interface.
 *
 * ```typescript
 * import { SplitButton } from "@syncfusion/react-splitbuttons";
 *
 * const menuItems = [{ text: 'Cut' }, { text: 'Copy' }, { text: 'Paste' }];
 * <SplitButton items={menuItems}>Default Action</SplitButton>
 * ```
 */
export const SplitButton: React.ForwardRefExoticComponent<ISplitButtonProps & React.RefAttributes<ISplitButton>> =
    forwardRef<ISplitButton, ISplitButtonProps>((props: ISplitButtonProps, ref: Ref<ISplitButton>) => {
        const {
            className = '',
            icon,
            iconPosition = Position.Left,
            items = [],
            disabled = false,
            lazyOpen = false,
            children,
            itemTemplate,
            popupSettings = {},
            color,
            variant,
            size = Size.Medium,
            onOpen,
            onClose,
            onSelect,
            trailingButtonProps,
            ...domProps
        } = props;

        const buttonRef: React.RefObject<IButton | null> = useRef<IButton>(null);
        const dropDownRef: React.RefObject<IDropDownButton | null> = useRef<IDropDownButton>(null);
        const wrapperRef: React.RefObject<HTMLDivElement | null> = useRef<HTMLDivElement | null>(null);
        const { dir } = useProviderContext();
        const publicAPI: Partial<ISplitButton> = useMemo(() => ({
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

        useEffect(() => {
            preRender('splitButton');
        }, []);

        useImperativeHandle(ref, () => ({
            ...publicAPI as ISplitButton,
            toggle: () => {
                if (dropDownRef.current && dropDownRef.current.toggle) {
                    dropDownRef.current.toggle();
                }
            },
            element: wrapperRef.current
        }), [publicAPI]);

        const wrapperClassName: string = [
            'sf-split-btn-wrapper',
            size ? `sf-split-btn-${String(size).toLowerCase().substring(0, 2)}` : '',
            variant ? `sf-${String(variant).toLowerCase()}` : '',
            dir === 'rtl' ? 'sf-rtl' : ''
        ].filter(Boolean).join(' ');
        return (
            <div ref={wrapperRef} className={wrapperClassName}>
                <Button
                    ref={buttonRef}
                    className={`${className} ${(dir === 'rtl') ? 'sf-rtl' : ''} sf-control sf-btn sf-split-btn`}
                    type="button"
                    icon={icon}
                    color={color}
                    variant={variant}
                    size={size}
                    iconPosition={iconPosition}
                    disabled={disabled}
                    {...domProps}
                >
                    {children}
                </Button>
                <DropDownButton
                    ref={dropDownRef}
                    className={`${className} ${(dir === 'rtl') ? 'sf-rtl' : ''} sf-icon-btn sf-control sf-dropdown-btn sf-btn`}
                    items={items}
                    color={color}
                    variant={variant}
                    size={size}
                    itemTemplate={itemTemplate}
                    disabled={disabled}
                    lazyOpen={lazyOpen}
                    popupSettings={{
                        ...popupSettings
                    }}
                    onOpen={onOpen}
                    onClose={onClose}
                    onSelect={onSelect}
                    {...trailingButtonProps}
                >
                </DropDownButton>
            </div>
        );
    });

export default SplitButton;
