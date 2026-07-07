import {
    forwardRef, useImperativeHandle, useRef, HTMLAttributes, useMemo, memo,
    RefObject, Ref, ForwardRefExoticComponent, RefAttributes
} from 'react';

const CLS_ITEM: string = 'sf-toolbar-item';

/**
 * The ToolbarItem component allows for the rendering of individual items within a Toolbar.
 *
 * ```typescript
 * <Toolbar>
 *   <ToolbarItem className='action-button' style={{ backgroundColor: '#f0f0f0' }}><Button>Cut</Button></ToolbarItem>
 * </Toolbar>
 * ```
 */
export interface ToolbarItemProps {
    /**
     * Specifies an optional CSS class to apply to the toolbar item.
     * This is useful for reusing styling in a custom template.
     *
     * @default -
     */
    className?: string;

    /**
     * Toolbar item element.
     *
     * @private
     * @default -
     */
    element?: HTMLElement | null;

    /**
     * Specifies the content of the toolbar item.
     * Can be text or any valid React node.
     *
     * @default -
     */
    children?: React.ReactNode;
}

type IToolbarItemProps = ToolbarItemProps & HTMLAttributes<HTMLDivElement>;

export const ToolbarItem: ForwardRefExoticComponent<IToolbarItemProps & RefAttributes<IToolbarItemProps>> = memo(forwardRef<
IToolbarItemProps, IToolbarItemProps
>((props: IToolbarItemProps, ref: Ref<ToolbarItemProps>) => {
    const {
        className = '',
        children,
        ...eleAttr
    } = props;

    const itemRef: RefObject<HTMLDivElement | null> = useRef<HTMLDivElement | null>(null);

    const classes: string = useMemo(() => {
        const classes: string[] = [CLS_ITEM];
        if (className) {
            classes.push(className);
        }
        return classes.join(' ');
    }, [className]);

    useImperativeHandle(ref, () => {
        return {
            element: itemRef.current
        };
    });

    return (
        <div
            ref={itemRef}
            className={classes}
            {...eleAttr}
        >
            {children}
        </div>
    );
}));
ToolbarItem.displayName = 'ToolbarItem';
export default ToolbarItem;
