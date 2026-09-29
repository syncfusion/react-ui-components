import { FC, PropsWithChildren, ReactNode } from 'react';
import { Sidebar, SidebarLayout, SidebarMain } from '@syncfusion/react-navigations';
import { useResourceGroupingContext } from '../context/resource-grouping-context';
import { ResourceTreeView } from './resource-tree-view';

/**
 * CompactViewSidebar renders a Syncfusion Sidebar-based layout for mobile/compact views.
 * Integrates the ResourceTreeView within the Sidebar component and renders the main
 * scheduler content in SidebarMain.
 *
 * @private
 * @returns {ReactNode} The rendered compact sidebar or its children.
 */
export const CompactViewSidebar: FC<PropsWithChildren> = ({ children }: PropsWithChildren): ReactNode => {
    const { isCompact, treeVisible, toggleTree } = useResourceGroupingContext() ?? {};
    if (!isCompact) {
        return children || null;
    }
    const handleSidebarChange: (event: { open: boolean }) => void = (event: { open: boolean }): void => {
        if (event.open === false) {
            toggleTree?.(false);
        }
    };
    return (
        <SidebarLayout>
            <Sidebar
                open={!!treeVisible}
                mode="Over"
                backdrop
                onOpenChange={handleSidebarChange}
            >
                <ResourceTreeView />
            </Sidebar>
            <SidebarMain>
                {children}
            </SidebarMain>
        </SidebarLayout>
    );
};

export default CompactViewSidebar;
