import {
    forwardRef, useImperativeHandle, useRef, HTMLAttributes, memo,
    RefObject, Ref, ForwardRefExoticComponent, RefAttributes, useMemo
} from 'react';

const CLS_ITEM: string = 'sf-toolbar-item';
const CLS_SEPARATOR: string = 'sf-separator';

export interface IToolbarSeparator {
    /**
     * Separator element within the toolbar.
     *
     * @default null
     */
    element?: HTMLElement | null;
}

type IToolbarSeparatorProps = IToolbarSeparator & HTMLAttributes<HTMLDivElement>;

/**
 * The ToolbarSeparator component is used for rendering a visual separation between items in a Toolbar.
 *
 * ```typescript
 * <Toolbar>
 *   <ToolbarItem><Button>Cut</Button></ToolbarItem>
 *   <ToolbarSeparator />
 *   <ToolbarItem><Button>Copy</Button></ToolbarItem>
 * </Toolbar>
 * ```
 */
export const ToolbarSeparator: ForwardRefExoticComponent<IToolbarSeparatorProps & RefAttributes<IToolbarSeparator>> = memo(forwardRef<
IToolbarSeparator, IToolbarSeparatorProps
>((props: IToolbarSeparatorProps, ref: Ref<IToolbarSeparator>) => {
    const {
        className = '',
        ...eleAttr
    } = props;

    const separatorRef: RefObject<HTMLDivElement | null> = useRef<HTMLDivElement | null>(null);

    const classes: string = useMemo(() => {
        const classes: string[] = [CLS_ITEM, CLS_SEPARATOR];
        if (className) {
            classes.push(className);
        }
        return classes.join(' ');
    }, [className]);

    useImperativeHandle(ref, () => {
        return {
            element: separatorRef.current
        };
    });

    return (
        <div
            ref={separatorRef}
            className={classes}
            {...eleAttr}
        />
    );
}));
ToolbarSeparator.displayName = 'ToolbarSeparator';
export default ToolbarSeparator;
