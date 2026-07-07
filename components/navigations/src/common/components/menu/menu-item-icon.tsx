import { FC, useMemo, HTMLAttributes, memo } from 'react';
import { COMMON_CLASSES } from '../../constants';

/**
 * MenuItemIcon displays icons within a menu item.
 * Ensures consistent styling and structure for icon content or nodes in MenuItem components.
 *
 * ```typescript
 * <Menu orientation={Orientation.Horizontal} itemOnClick={false}>
 *   <MenuItem>
 *     <MenuItemLabel>Open</MenuItemLabel>
 *     <MenuItemIcon><FileIcon /></MenuItemIcon>
 *   </MenuItem>
 * </Menu>
 * ```
 */

export interface MenuItemIconProps {
    /**
     * Specifies an optional CSS class to apply to the icon container.
     *
     * @default -
     */
    className?: string;

    /**
     * Specifies the content of the icon.
     * Typically an icon, a class name for custom styling or any SVG element.
     *
     * @default -
     */
    children?: React.ReactNode;
}

type IMenuItemIconProps = MenuItemIconProps & HTMLAttributes<HTMLSpanElement>;

export const MenuItemIcon: FC<IMenuItemIconProps> = memo((props: IMenuItemIconProps) => {

    const { children, className, ...restProps } = props;

    const iconClassName: string = useMemo(() => {
        return [
            COMMON_CLASSES.MENU_ICON,
            COMMON_CLASSES.ICON,
            COMMON_CLASSES.ICON_SIZE,
            className
        ].filter(Boolean).join(' ');
    }, [className]);

    return (
        <span className={iconClassName} {...restProps}>
            {children}
        </span>
    );
});

MenuItemIcon.displayName = 'MenuItemIcon';
