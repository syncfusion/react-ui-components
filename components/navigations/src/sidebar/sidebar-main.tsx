import { forwardRef, memo, useMemo, type ForwardRefExoticComponent, type HTMLAttributes, type ReactNode, type Ref, type RefAttributes } from 'react';
import { ISidebarContext, useSidebarContext } from './context/sidebar-context';
import { SIDEBAR_CLASSES } from './constants';
import { UseSidebarReturn } from './types';

/**
 * Specifies the main content area displayed alongside a `Sidebar`.
 * Contains the primary content within a `SidebarLayout`.
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
 *                     <h1>Dashboard</h1>
 *                     <p>Welcome to the dashboard.</p>
 *                 </div>
 *             </SidebarMain>
 *         </SidebarLayout>
 *     );
 * }
 * ```
 */
export interface SidebarMainProps {
    /**
     * Specifies the content of the main area.
     */
    children?: ReactNode;
}

type ISidebarMainProps = SidebarMainProps & HTMLAttributes<HTMLDivElement>;

export const SidebarMain: ForwardRefExoticComponent<ISidebarMainProps & RefAttributes<HTMLDivElement>> =
    memo(forwardRef<HTMLDivElement, ISidebarMainProps>((props: ISidebarMainProps, ref: Ref<HTMLDivElement>) => {
        const { children, className, ...eleAttr } = props;
        const ctx: ISidebarContext | undefined = useSidebarContext();
        const unstyled: boolean = ctx?.unstyled ?? false;
        const useSidebarState: UseSidebarReturn | null = ctx?.useSidebarState ?? null;

        const mainClassName: string = useMemo(
            () => [
                unstyled ? '' : SIDEBAR_CLASSES.MAIN,
                unstyled ? '' : SIDEBAR_CLASSES.CONTENT_SHIFTED,
                className
            ].filter(Boolean).join(' '),
            [unstyled, className]
        );

        return (
            <div
                {...eleAttr}
                ref={(node: HTMLDivElement | null): void => {
                    if (typeof ref === 'function') { ref(node); }
                    else if (ref) { (ref as { current: HTMLDivElement | null }).current = node; }
                }}
                data-unstyled={unstyled ? 'true' : undefined}
                className={mainClassName}
            >
                {useSidebarState?.state.backdrop && (
                    <div
                        {...useSidebarState.backdropProps}
                        className={[
                            useSidebarState.backdropProps?.className,
                            !unstyled ? SIDEBAR_CLASSES.BACKDROP : '',
                            !unstyled ? 'sf-overlay' : ''
                        ]
                            .filter(Boolean)
                            .join(' ')}
                        style={{
                            ...useSidebarState.backdropProps?.style
                        }}
                    />
                )}
                {children}
            </div>
        );
    }));

export default SidebarMain;
