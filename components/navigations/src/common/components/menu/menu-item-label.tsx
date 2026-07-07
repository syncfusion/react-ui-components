import { FC, memo, useMemo, type HTMLAttributes } from 'react';
import { COMMON_CLASSES } from '../../constants';

/**
 * MenuItemLabel is a semantic container for menu item content.
 * Provides consistent styling and structure for displaying text or nodes within MenuItem components.
 *
 * ```typescript
 * <Menu orientation={Orientation.Horizontal} itemOnClick={false}>
 *   <MenuItem>
 *     <MenuItemLabel>File</MenuItemLabel>
 *   </MenuItem>
 *
 *   <MenuItem>
 *     <MenuItemLabel>Edit</MenuItemLabel>
 *   </MenuItem>
 * </Menu>
 * ```
 */
export interface MenuItemLabelProps {
    /**
     * Specifies an optional CSS class to apply to the label.
     *
     * @default -
     */
    className?: string;

    /**
     * Specifies the content of the label.
     * Can be text or any valid React node.
     *
     * @default -
     */
    children?: React.ReactNode;
}

type IMenuItemLabelProps = MenuItemLabelProps & HTMLAttributes<HTMLSpanElement>;

export const MenuItemLabel: FC<IMenuItemLabelProps> = memo((props: IMenuItemLabelProps) => {

    const { children, className, ...restProps } = props;

    const labelClassName: string = useMemo(() => {
        return [
            COMMON_CLASSES.ITEM_LABEL,
            COMMON_CLASSES.ELLIPSIS, className
        ].filter(Boolean).join(' ');
    }, [className]);

    return (
        <span className={labelClassName} {...restProps}>
            {children}
        </span>
    );
});

MenuItemLabel.displayName = 'MenuItemLabel';
