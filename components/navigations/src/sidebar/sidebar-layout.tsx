import { forwardRef, memo, useMemo, useState, type CSSProperties, type ForwardRefExoticComponent, type HTMLAttributes, type ReactNode, type Ref, type RefAttributes } from 'react';
import { SidebarContext, type ISidebarContext } from './context/sidebar-context';
import { SIDEBAR_CLASSES, SIDEBAR_CSS_VARS, SIDEBAR_DEFAULTS } from './constants';
import { SidebarHookReturn } from './sidebar';
import { useProviderContext, formatUnit } from '@syncfusion/react-base';

/**
 * Specifies the layout structure for sidebar navigation and main content.
 * Provides the root container that coordinates the interaction between
 * `Sidebar`, `SidebarMain`, and `SidebarTrigger`.
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
 *                 <div>
 *                     Dashboard Content
 *                 </div>
 *             </SidebarMain>
 *         </SidebarLayout>
 *     );
 * }
 * ```
 */
export interface SidebarLayoutProps {
    /**
     * Specifies the content of the layout shell. Typically contains a
     * `<Sidebar>`, a `<SidebarMain>`, and one or more `<SidebarTrigger>`s.
     */
    children?: ReactNode;
}

type ISidebarLayoutProps = SidebarLayoutProps & HTMLAttributes<HTMLDivElement>;

export const SidebarLayout: ForwardRefExoticComponent<ISidebarLayoutProps & RefAttributes<HTMLDivElement>> =
    memo(forwardRef<HTMLDivElement, ISidebarLayoutProps>((props: ISidebarLayoutProps, ref: Ref<HTMLDivElement>) => {
        const { children, className, style: _ignoredStyle, ...eleAttr } = props;
        const [useSidebarState, setSidebarState] = useState<SidebarHookReturn | null>(null);
        const [unstyled, setUnstyled] = useState<boolean>(false);
        const { dir }: { dir: string } = useProviderContext();

        const ctx: ISidebarContext = useMemo(
            () => ({ useSidebarState, setSidebarState, unstyled, setUnstyled }),
            [useSidebarState, unstyled]
        );

        const transitionStyle: CSSProperties = useMemo(
            () => (useSidebarState?.state.transition
                ? {
                    [SIDEBAR_CSS_VARS.TRANSITION_ENTER]: `${useSidebarState.state.transition.enter}ms`,
                    [SIDEBAR_CSS_VARS.TRANSITION_EXIT]: `${useSidebarState.state.transition.exit}ms`
                }
                : {}),
            [useSidebarState?.state.transition]
        );

        const widthStyle: CSSProperties = useMemo(
            () => ({
                [SIDEBAR_CSS_VARS.WIDTH]: useSidebarState?.state.width !== undefined
                    ? formatUnit(useSidebarState.state.width)
                    : formatUnit(SIDEBAR_DEFAULTS.DEFAULT_WIDTH)
            }),
            [useSidebarState?.state.width]
        );

        const layoutStyle: CSSProperties = useMemo(
            () => ({
                ...transitionStyle,
                ...widthStyle,
                ...((_ignoredStyle as Record<string, unknown> | undefined) ?? {})
            }),
            [transitionStyle, widthStyle, _ignoredStyle]
        );

        const layoutClassName: string = useMemo(
            () => [
                unstyled ? '' : SIDEBAR_CLASSES.LAYOUT,
                !unstyled && dir === 'rtl' ? SIDEBAR_CLASSES.RTL : '',
                className
            ].filter(Boolean).join(' '),
            [unstyled, dir, className]
        );

        return (
            <SidebarContext.Provider value={ctx}>
                <div
                    {...eleAttr}
                    ref={ref}
                    data-unstyled={unstyled ? 'true' : undefined}
                    className={layoutClassName}
                    style={layoutStyle}
                >
                    {children}
                </div>
            </SidebarContext.Provider>
        );
    }));

export default SidebarLayout;
