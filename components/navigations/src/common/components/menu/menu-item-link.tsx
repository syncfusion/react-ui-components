import { COMMON_CLASSES } from '../../constants';
import {
    AnchorHTMLAttributes, memo, useMemo, MouseEvent,
    useCallback, forwardRef, Ref, NamedExoticComponent, RefAttributes
} from 'react';

/**
 * MenuItemLink displays links within a menu item.
 * Ensures consistent styling and structure for link content or nodes in MenuItem components.
 *
 * ```typescript
 * <Menu orientation={Orientation.Horizontal} itemOnClick={false}>
 *   <MenuItem>
 *     <MenuItemLink href="/help">
 *       <MenuItemLabel>Help</MenuItemLabel>
 *     </MenuItemLink>
 *   </MenuItem>
 * </Menu>
 * ```
 */
export interface MenuItemLinkProps {
    /**
     * Specifies an optional CSS class to apply to the link.
     *
     * @default -
     */
    className?: string;

    /**
     * Specifies the content of the link.
     * Can be text or any valid React node.
     *
     * @default -
     */
    children?: React.ReactNode;
}

type IMenuItemLinkProps = MenuItemLinkProps & AnchorHTMLAttributes<HTMLAnchorElement>;

export const MenuItemLink: NamedExoticComponent<IMenuItemLinkProps & RefAttributes<HTMLAnchorElement>> =
    memo(forwardRef<HTMLAnchorElement, IMenuItemLinkProps>(
        (props: IMenuItemLinkProps, ref: Ref<HTMLAnchorElement>) => {

            const { children, className, ...restProps } = props;

            const iconClassName: string = useMemo(() => {
                return [
                    COMMON_CLASSES.URL,
                    className
                ].filter(Boolean).join(' ');
            }, [className]);

            const stopPropagation: (e: MouseEvent<HTMLAnchorElement>) => void = useCallback((e: MouseEvent<HTMLAnchorElement>): void => {
                e.stopPropagation();
            }, []);


            return (
                <a ref={ref} className={iconClassName} tabIndex={-1} onClick={stopPropagation} {...restProps}>
                    <div className={COMMON_CLASSES.ANCHOR_WRAP}> {children} </div>
                </a>
            );
        }));

MenuItemLink.displayName = 'ItemUrl';
