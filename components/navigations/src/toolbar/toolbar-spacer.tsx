import {
    forwardRef, useImperativeHandle, useRef, HTMLAttributes, memo,
    RefObject, Ref, ForwardRefExoticComponent, RefAttributes, useMemo
} from 'react';

const CLS_ITEM: string = 'sf-toolbar-item';
const CLS_SPACER: string = 'sf-toolbar-spacer';

/**
 * The ToolbarSpacer component is used to render an adjustable space within a Toolbar.
 *
 * ```typescript
 * import { Toolbar, ToolbarItem, ToolbarSpacer } from '@syncfusion/react-navigations';
 * export default function App() {
 *     return (
 *         <Toolbar>
 *             <ToolbarItem><button>New</button></ToolbarItem>
 *             <ToolbarItem><button>Open</button></ToolbarItem>
 *             <ToolbarSpacer />
 *             <ToolbarItem><button>Save</button></ToolbarItem>
 *         </Toolbar>
 *     );
 * }
 * ```
 */
export interface ToolbarSpacerProps {
    /**
     * Specifies an optional CSS class to apply to the toolbar spacer.
     * This is useful for reusing styling in a custom template.
     *
     * @default -
     */
    className?: string;

    /**
     * Spacer element within the toolbar.
     *
     * @private
     * @default -
     */
    element?: HTMLElement | null;
}

type IToolbarSpacerProps = ToolbarSpacerProps & HTMLAttributes<HTMLDivElement>;

export const ToolbarSpacer: ForwardRefExoticComponent<IToolbarSpacerProps & RefAttributes<IToolbarSpacerProps>> = memo(forwardRef<
ToolbarSpacerProps,
IToolbarSpacerProps
>((props: IToolbarSpacerProps, ref: Ref<ToolbarSpacerProps>) => {
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
