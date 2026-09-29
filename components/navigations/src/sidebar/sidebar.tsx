import { forwardRef, useImperativeHandle, useLayoutEffect, useMemo, ForwardRefExoticComponent,
    Ref, RefAttributes, memo, HTMLAttributes, useRef, CSSProperties,
    RefObject, SetStateAction, Dispatch} from 'react';
import { preRender, useStableId } from '@syncfusion/react-base';
import { useSidebar } from './use-sidebar';
import { SidebarProps, SidebarTransition, UseSidebarReturn } from './types';
import { SIDEBAR_CLASSES, SIDEBAR_CSS_VARS, SIDEBAR_DATA_ATTRS, SIDEBAR_DEFAULTS, SIDEBAR_STATE_MODE } from './constants';
import { ISidebarContext, useSidebarContext } from './context/sidebar-context';

/**
 * @private
 */
export type SidebarHookReturn = ReturnType<typeof useSidebar>;

/**
 * Interface for Sidebar component instance.
 */
export interface ISidebar extends SidebarProps {
    /**
     * Specifies the underlying DOM element of the Sidebar root.
     *
     * @private
     * @default null
     */
    element?: HTMLElement | null;
}

type SidebarComponentProps = SidebarProps & Omit<HTMLAttributes<HTMLDivElement>, keyof SidebarProps>;

const sidebarRegistry: Map<string, SidebarHookReturn> = new Map();

const registerSidebar: (id: string, value: SidebarHookReturn) => () => void = (id: string, value: SidebarHookReturn) => {
    sidebarRegistry.set(id, value);

    return () => {
        if (sidebarRegistry.get(id) === value) {
            sidebarRegistry.delete(id);
        }
    };
};

export function getSidebarById(id: string): SidebarHookReturn | undefined {
    return sidebarRegistry.get(id);
}

/**
 * Sidebar renders a collapsible navigation panel with support for responsive layouts and custom content.
 *
 * ```tsx
 * import { useState } from "react";
 * import { Sidebar, SidebarLayout, SidebarMain, SidebarTrigger } from "@syncfusion/react-navigations";
 *
 * export default function App() {
 *     const [open, setOpen] = useState(false);
 *
 *     return (
 *         <SidebarLayout>
 *             <Sidebar
 *                 open={open}
 *                 onOpenChange={(e) => setOpen(e.open)}
 *             >
 *                 <nav>
 *                     <ul>
 *                         <li>Dashboard</li>
 *                         <li>Projects</li>
 *                         <li>Settings</li>
 *                     </ul>
 *                 </nav>
 *             </Sidebar>
 *
 *             <SidebarMain>
 *                 <SidebarTrigger aria-label="Toggle navigation">
 *                     ☰
 *                 </SidebarTrigger>
 *
 *                 <div>Dashboard Content</div>
 *             </SidebarMain>
 *         </SidebarLayout>
 *     );
 * }
 * ```
 */
export const Sidebar: ForwardRefExoticComponent<SidebarComponentProps & RefAttributes<ISidebar>> =
    memo(forwardRef<ISidebar, SidebarComponentProps>((props: SidebarComponentProps, ref: Ref<ISidebar>) => {
        const {
            open: controlledOpen,
            defaultOpen = false,
            onOpenChange,
            position = 'Left',
            mode = 'Push',
            backdrop = false,
            closeOnDocumentClick = true,
            transition,
            dockable = false,
            dockableWidth = `${SIDEBAR_DEFAULTS.DOCK_WIDTH}px`,
            mediaQuery = '',
            unstyled = false,
            className,
            children,
            id,
            ...eleAttr
        } = props;

        const ctx: ISidebarContext | undefined = useSidebarContext();
        const setSidebarState: Dispatch<SetStateAction<UseSidebarReturn | null>> | undefined = ctx?.setSidebarState;
        const setUnstyled: Dispatch<SetStateAction<boolean>> | undefined = ctx?.setUnstyled;

        const reactId: string = useStableId('sf-sidebar-');
        const sidebarId: string = (id as string | undefined) ?? reactId;
        const sidebarRootRef: RefObject<HTMLDivElement | null> = useRef<HTMLDivElement | null>(null);
        const sidebar: SidebarHookReturn = useSidebar({
            open: controlledOpen,
            defaultOpen,
            onOpenChange,
            position,
            mode,
            backdrop,
            closeOnDocumentClick,
            transition,
            dockable,
            dockableWidth,
            style: eleAttr.style,
            mediaQuery,
            className,
            rootRef: sidebarRootRef
        } as Parameters<typeof useSidebar>[0]) as SidebarHookReturn;
        const { rootProps, state } = sidebar;
        const { open } = state;
        useLayoutEffect((): (() => void) | void => {
            return registerSidebar(sidebarId, sidebar);
        }, [sidebarId, sidebar]);

        useLayoutEffect((): (() => void) | void => {
            if (!setSidebarState) { return; }
            setSidebarState(sidebar);
        }, [ setSidebarState, sidebar.state.open, sidebar.state.position, sidebar.state.mode,
            sidebar.state.backdrop, sidebar.state.dockableWidth, sidebar.state.width,
            sidebar.state.transition
        ]);

        useLayoutEffect((): (() => void) | void => {
            if (!setUnstyled) { return; }
            setUnstyled(unstyled);
            return (): void => {
                setUnstyled(false);
            };
        }, [setUnstyled, unstyled]);

        useLayoutEffect((): void => {
            preRender('sidebar');
        }, []);
        const { ...restEleAttr } = eleAttr;
        const resolvedTransition: Required<SidebarTransition> = useMemo(() => ({
            enter: typeof transition?.enter === 'number' ? transition.enter : SIDEBAR_DEFAULTS.TRANSITION_MS,
            exit: typeof transition?.exit === 'number' ? transition.exit : SIDEBAR_DEFAULTS.TRANSITION_MS
        }), [transition]);

        const dataPositionView: 'left' | 'right' = position === 'Right' ? 'right' : 'left';
        const view: 'over' | 'push' = mode === 'Push' ? SIDEBAR_STATE_MODE.PUSH : SIDEBAR_STATE_MODE.OVER;

        const hookClassName: string = useMemo(
            () => !unstyled
                ? [
                    SIDEBAR_CLASSES.ROOT,
                    state.open ? SIDEBAR_CLASSES.OPEN : SIDEBAR_CLASSES.CLOSE,
                    view === SIDEBAR_STATE_MODE.PUSH ? SIDEBAR_CLASSES.PUSH : SIDEBAR_CLASSES.OVER,
                    dataPositionView === 'right' ? SIDEBAR_CLASSES.RIGHT : SIDEBAR_CLASSES.LEFT
                ].filter(Boolean).join(' ')
                : '',
            [unstyled, state.open, view, dataPositionView]
        );

        const rootClassName: string = useMemo(() => [
            hookClassName,
            className
        ].filter(Boolean).join(' '), [hookClassName, unstyled, className]);

        const transitionStyle: CSSProperties = useMemo(() => ({
            [SIDEBAR_CSS_VARS.TRANSITION_ENTER]: `${resolvedTransition.enter}ms`,
            [SIDEBAR_CSS_VARS.TRANSITION_EXIT]: `${resolvedTransition.exit}ms`
        } as CSSProperties), [resolvedTransition]);

        const mergedRootStyle: HTMLAttributes<HTMLDivElement>['style'] = useMemo(() => (
            (() => {
                const consumerStyle: CSSProperties = (eleAttr as { style?: CSSProperties }).style ?? {};
                const expandedWidth: string | number | undefined = consumerStyle.width;
                const activeWidth: string | number | undefined = dockable ? state.dockableWidth : expandedWidth;

                return {
                    ...((rootProps as { style?: CSSProperties }).style ?? {}),
                    ...consumerStyle,
                    ...transitionStyle,
                    ...(activeWidth !== undefined && dockable ? {
                        width: state.dockableWidth
                    } : {})
                };
            })()
        ), [rootProps.style, transitionStyle, eleAttr.style, dockable, state.dockableWidth]);

        useImperativeHandle(ref, (): ISidebar => ({
            open,
            defaultOpen,
            onOpenChange,
            position,
            mode,
            backdrop,
            closeOnDocumentClick,
            transition,
            unstyled,
            dockable,
            dockableWidth: state.dockableWidth,
            mediaQuery,
            element: sidebarRootRef.current
        }), [
            open, defaultOpen, onOpenChange, position, mode,
            backdrop, closeOnDocumentClick, transition, unstyled
            , dockable, state.dockableWidth, mediaQuery
        ]);

        return (
            <>
                <div
                    ref={sidebarRootRef}
                    {...restEleAttr}
                    {...rootProps}
                    {...(unstyled ? { [SIDEBAR_DATA_ATTRS.UNSTYLED]: 'true' } : {})}
                    className={rootClassName}
                    style={mergedRootStyle}
                >
                    {children}
                </div>
            </>
        );
    }));

export default Sidebar;
