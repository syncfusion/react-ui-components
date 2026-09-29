import { forwardRef, type ForwardRefExoticComponent, type ButtonHTMLAttributes, type ReactNode, type RefAttributes, type ForwardedRef} from 'react';
import { ISidebarContext, useSidebarContext } from './context/sidebar-context';
import { SIDEBAR_CLASSES } from './constants';
import { getSidebarById } from './sidebar';
import { Button, IButton } from '@syncfusion/react-buttons';
import { UseSidebarReturn } from './types';

/**
 * Specifies a trigger element that toggles the associated `Sidebar`.
 * Renders content that opens and closes a sidebar when activated.
 *
 * ```tsx
 * import { useState } from "react";
 * import { Sidebar, SidebarLayout, SidebarMain, SidebarTrigger } from "@syncfusion/react-navigations";
 * import { MenuIcon } from "@syncfusion/react-icons";
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
 *                     <MenuIcon />
 *                 </SidebarTrigger>
 *
 *                 <div>Dashboard Content</div>
 *             </SidebarMain>
 *         </SidebarLayout>
 *     );
 * }
 * ```
 */
export interface SidebarTriggerProps {
    /**
     * Specifies the target sidebar id.
     */
    target?: string;

    /**
     * Specifies the trigger content (typically an icon).
     */
    children?: ReactNode;
}

type ISidebarTriggerProps = SidebarTriggerProps & IButton & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'color'>;

export const SidebarTrigger: ForwardRefExoticComponent<ISidebarTriggerProps & RefAttributes<IButton>> =
    forwardRef<IButton, ISidebarTriggerProps>((props: ISidebarTriggerProps, ref: ForwardedRef<IButton>) => {
        const { children, className, target, ...rest } = props;
        const { useSidebarState } = useSidebarContext() as ISidebarContext;
        let triggerProps: Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'color'>;
        if (target) {
            const found: UseSidebarReturn | undefined = getSidebarById(target);
            if (found) {
                triggerProps = found.triggerProps;
            } else {
                triggerProps = useSidebarState?.triggerProps ?? {};
            }
        } else {
            triggerProps = useSidebarState?.triggerProps ?? {};
        }

        return (
            <Button
                {...triggerProps}
                {...rest}
                ref={ref}
                className={[SIDEBAR_CLASSES.TRIGGER, className].filter(Boolean).join(' ')}
            >
                {children}
            </Button>
        );
    });

export default SidebarTrigger;
