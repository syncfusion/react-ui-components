import {
    forwardRef, useImperativeHandle, useRef, HTMLAttributes, useMemo, memo,
    RefObject, Ref, ForwardRefExoticComponent, RefAttributes
} from 'react';

const CLS_ITEM: string = 'sf-toolbar-item';

export interface IToolbarItem {
    /**
     * Toolbar item element.
     *
     * @default null
     */
    element?: HTMLElement | null;
}

type IToolbarItemProps = IToolbarItem & HTMLAttributes<HTMLDivElement>;

/**
 * The ToolbarItem component allows for the rendering of individual items within a Toolbar.
 *
 * ```typescript
 * <Toolbar>
 *   <ToolbarItem id='saveButton' className='action-button' style={{ backgroundColor: '#f0f0f0' }}>
 *     <button type="button">Save</button>
 *   </ToolbarItem>
 * </Toolbar>
 * ```
 */
export const ToolbarItem: ForwardRefExoticComponent<IToolbarItemProps & RefAttributes<IToolbarItem>> = memo(forwardRef<
IToolbarItem, IToolbarItemProps
>((props: IToolbarItemProps, ref: Ref<IToolbarItem>) => {
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
