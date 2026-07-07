import { FC, LiHTMLAttributes, memo, useMemo } from 'react';
import { COMMON_CLASSES } from '../../constants';
import { useMenuContext } from '../../context-provider/useMenuContext';
import { Orientation } from '../../../menu/types';


/**
 * MenuSeparator is used to visually separate menu items.
 * Provides consistent styling and structure for displaying dividers within Menu components.
 *
 * ```typescript
 * <Menu orientation={Orientation.Horizontal} itemOnClick={false}>
 *   <MenuItem>
 *     <MenuItemLabel>File</MenuItemLabel>
 *   </MenuItem>
 *   <MenuSeparator />
 *   <MenuItem>
 *     <MenuItemLabel>Edit</MenuItemLabel>
 *   </MenuItem>
 * </Menu>
 * ```
 */
export interface MenuSeparatorProps {
    /**
     * Specifies an optional CSS class to apply to the separator.
     *
     * @default -
     */
    className?: string;
}

type IMenuSeparatorProps = MenuSeparatorProps & LiHTMLAttributes<HTMLLIElement>;

export const MenuSeparator: FC<IMenuSeparatorProps> = memo(
    (props: IMenuSeparatorProps) => {

        const { className, ...restProps } = props;

        const {
            config: { orientation },
            state: { parentPath }
        } = useMenuContext();

        const separatorClassName: string = useMemo(() => {
            return [
                COMMON_CLASSES.SEPARATOR,
                COMMON_CLASSES.ITEM,
                className
            ].filter(Boolean).join(' ');
        }, [className]);

        const ariaOrientation: 'horizontal' | 'vertical' = useMemo<'horizontal' | 'vertical'>(() => {
            return orientation === Orientation.Horizontal && parentPath.length === 0 ? 'vertical' : 'horizontal';
        }, [orientation, parentPath]);

        return (
            <li
                role="separator"
                aria-orientation={ariaOrientation}
                className={separatorClassName}
                {...restProps}
            />
        );
    }
);

MenuSeparator.displayName = 'MenuSeparator';
