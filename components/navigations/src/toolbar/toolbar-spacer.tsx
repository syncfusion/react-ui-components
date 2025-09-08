import {
    forwardRef, useImperativeHandle, useRef, HTMLAttributes, memo,
    RefObject, Ref, ForwardRefExoticComponent, RefAttributes, useMemo
} from 'react';

const CLS_ITEM: string = 'sf-toolbar-item';
const CLS_SPACER: string = 'sf-toolbar-spacer';

export interface IToolbarSpacer {
    /**
     * Spacer element within the toolbar.
     *
     * @default null
     */
    element?: HTMLElement | null;
}

type IToolbarSpacerProps = IToolbarSpacer & HTMLAttributes<HTMLDivElement>;

/**
 * The ToolbarSpacer component is used to render an adjustable space within a Toolbar.
 *
 * ```typescript
 * <Toolbar>
 *   <ToolbarItem><Button>New</Button></ToolbarItem>
 *   <ToolbarItem><Button>Open</Button></ToolbarItem>
 *   <ToolbarSpacer />
 *   <ToolbarItem><Button>Save</Button></ToolbarItem>
 * </Toolbar>
 * ```
 */
export const ToolbarSpacer: ForwardRefExoticComponent<IToolbarSpacerProps & RefAttributes<IToolbarSpacer>> = memo(forwardRef<
IToolbarSpacer,
IToolbarSpacerProps
>((props: IToolbarSpacerProps, ref: Ref<IToolbarSpacer>) => {
    const {
        className = '',
        ...eleAttr
    } = props;

    const spacerRef: RefObject<HTMLDivElement | null> = useRef<HTMLDivElement | null>(null);

    const classes: string = useMemo(() => {
        const classes: string[] = [CLS_ITEM, CLS_SPACER];
        if (className) {
            classes.push(className);
        }
        return classes.join(' ');
    }, [className]);

    useImperativeHandle(ref, () => {
        return {
            element: spacerRef.current
        };
    });

    return (
        <div
            ref={spacerRef}
            className={classes}
            {...eleAttr}
        />
    );
}));
ToolbarSpacer.displayName = 'ToolbarSpacer';
export default ToolbarSpacer;
