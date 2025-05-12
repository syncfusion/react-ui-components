import { useRef, useImperativeHandle, forwardRef, ButtonHTMLAttributes, useEffect, Ref } from 'react';
import { Button, IButton, IconPosition, Color, Size } from '../button/button';
import { preRender, useProviderContext } from '@syncfusion/react-base';
import * as React from 'react';

/**
 * Defines the position of FAB (Floating Action Button) in target.
 */
export enum FabPosition {
    /**
     * Positions the FAB at the target's top left corner.
     */
    TopLeft = 'TopLeft',

    /**
     * Places the FAB on the top-center position of the target.
     */
    TopCenter = 'TopCenter',

    /**
     * Positions the FAB at the target's top right corner.
     */
    TopRight = 'TopRight',

    /**
     * Positions the FAB in the middle of target's left side.
     */
    MiddleLeft = 'MiddleLeft',

    /**
     * Positions the FAB in the center of target.
     */
    MiddleCenter = 'MiddleCenter',

    /**
     * Positions the FAB in the middle of target's right side.
     */
    MiddleRight = 'MiddleRight',

    /**
     * Positions the FAB at the target's bottom left corner.
     */
    BottomLeft = 'BottomLeft',

    /**
     * Places the FAB on the bottom-center position of the target.
     */
    BottomCenter = 'BottomCenter',

    /**
     * Positions the FAB at the target's bottom right corner.
     */
    BottomRight = 'BottomRight'
}

export interface FabButtonProps {
    /**
     * Specifies the position of the Floating Action Button (FAB) relative to its target element. Options may include positions such as top-left, top-right, bottom-left, and bottom-right.
     *
     * @default FabPosition.BottomRight
     */
    position?: FabPosition;

    /**
     * Determines the visibility of the Floating Action Button. When `true`, the FAB is visible; when `false`, it is hidden.
     *
     * @default true
     */
    visible?: boolean;

    /**
     * Enables toggle behavior for the FAB. If `true`, the FAB will act as a toggle button, changing state on each click.
     *
     * @default false
     */
    togglable?: boolean;

    /**
     * Defines an icon for the button, which can either be a CSS class name for custom styling or an SVG element for rendering.
     *
     * @default -
     */
    icon?: string | React.ReactNode;

    /**
     * Defines the position of the icon relative to the text on the FAB. Options may include 'Left', 'Right', 'Top', or 'Bottom'.
     *
     * @default IconPosition.Left
     */
    iconPosition?: IconPosition;

    /**
     * Specifies the Color style of the FAB button. Options include 'Primary', 'Secondary', 'Warning', 'Success', 'Danger', and 'Info'.
     *
     * @default Color.Primary
     */
    color?: Color;

    /**
     * Specifies the size style of the FAB button. Options include 'Small', 'Medium' and 'Large'.
     *
     * @default Size.Medium
     */
    size?: Size;
}

export interface IFabButton extends FabButtonProps {

    /**
     * This is button component element.
     *
     * @private
     * @default null
     */
    element?: HTMLElement | null;

}

type IFabProps = FabButtonProps & ButtonHTMLAttributes<HTMLButtonElement>;

/**
 * The Floating Action Button (FAB) component offers a prominent primary action for an application interface, prominently positioned and styled to stand out with custom icon support.
 *
 * ```typescript
 * <Fab color={Color.Success} position={FabPosition.BottomLeft}>FAB</Fab>
 * ```
 */

export const Fab: React.ForwardRefExoticComponent<IFabProps & React.RefAttributes<IFabButton>> =
    forwardRef<IFabButton, IFabProps>((props: IFabProps, ref: Ref<IFabButton>) => {
        const buttonRef: any = useRef<IButton>(null);
        const { dir } = useProviderContext();
        const {
            disabled = false,
            position = FabPosition.BottomRight,
            iconPosition = IconPosition.Left,
            className = '',
            togglable = false,
            icon,
            children,
            color = Color.Primary,
            size,
            visible = true,
            ...domProps
        } = props;
        const fabPositionClasses: string[] = getFabPositionClasses(position, dir);
        const classNames: string = [
            'sf-control',
            'sf-fab',
            'sf-lib',
            'sf-btn',
            className || '',
            visible ? '' : 'sf-fab-hidden',
            dir === 'rtl' ? 'sf-rtl' : '',
            icon && !children ? 'sf-icon-btn' : '',
            ...fabPositionClasses
        ].filter(Boolean).join(' ');

        const publicAPI: Partial<IFabButton> = {
            iconPosition,
            icon,
            togglable,
            visible,
            color,
            size
        };

        useImperativeHandle(ref, () => ({
            ...publicAPI as IFabButton,
            element: buttonRef.current?.element
        }), [publicAPI]);

        useEffect(() => {
            preRender('fab');
        }, []);

        function getFabPositionClasses(position: FabPosition | string, dir: string): string[] {
            const positions: any  = {
                vertical: '',
                horizontal: '',
                middle: '',
                align: ''
            };
            if (['BottomLeft', 'BottomCenter', 'BottomRight'].indexOf(position) !== -1) {
                positions.vertical = 'sf-fab-bottom';
            } else {
                positions.middle = 'sf-fab-top';
            }
            if (['MiddleLeft', 'MiddleRight', 'MiddleCenter'].indexOf(position) !== -1) {
                positions.vertical = 'sf-fab-middle';
            }
            if (['TopCenter', 'BottomCenter', 'MiddleCenter'].indexOf(position) !== -1) {
                positions.align = 'sf-fab-center';
            }
            const isRight: boolean = ['TopRight', 'MiddleRight', 'BottomRight'].indexOf(position) !== -1;
            if (
                (!((dir === 'rtl') || isRight) || ((dir === 'rtl') && isRight))
            ) {
                positions.horizontal = 'sf-fab-left';
            } else {
                positions.horizontal = 'sf-fab-right';
            }
            return Object.values(positions).filter(Boolean) as string[];
        }

        return (
            <Button
                ref={buttonRef}
                className={classNames}
                icon={icon}
                color={color}
                size={size}
                disabled={disabled}
                iconPosition={icon ? iconPosition : undefined}
                togglable={togglable}
                {...domProps}
            >
                {children}
            </Button>
        );
    });

export default React.memo(Fab);
