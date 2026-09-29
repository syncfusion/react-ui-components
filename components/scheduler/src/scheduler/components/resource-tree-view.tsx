import { FC, ReactNode, useCallback } from 'react';
import { TreeView, TreeSelectionEvent } from '@syncfusion/react-navigations';
import { useProviderContext } from '@syncfusion/react-base';
import { ResourceTreeItem } from '../types/internal-interface';
import { useResourceGroupingContext } from '../context/resource-grouping-context';
import { useSchedulerLocalization } from '../common/locale';

export const ResourceTreeView: FC = (): ReactNode => {
    const { locale } = useProviderContext();
    const { getString } = useSchedulerLocalization(locale || 'en-US');
    const { resourceTreeData, selectedTreeIds, defaultExpandedTreeIds, selectResource } = useResourceGroupingContext() ?? {};
    const treeData: ResourceTreeItem[] = resourceTreeData ?? [];
    const selectedIds: string[] = selectedTreeIds ?? [];
    const defaultExpandedIds: string[] = defaultExpandedTreeIds ?? [];

    const handleSelectedChange: (event: TreeSelectionEvent) => void = useCallback((event: TreeSelectionEvent): void => {
        const leafIndex: number | undefined = (event.item as ResourceTreeItem)?.leafIndex;
        if (leafIndex === undefined) {
            return;
        }
        selectResource?.(leafIndex);
    }, [selectResource]);

    return (
        <TreeView
            dataSource={treeData}
            fields={{
                id: 'id',
                label: 'label',
                children: 'child',
                selectable: 'selectable'
            }}
            selectionMode="Single"
            selectedIds={selectedIds}
            defaultExpandedIds={defaultExpandedIds}
            onSelectedChange={handleSelectedChange}
            aria-label={getString('resources')}
        >
        </TreeView>
    );
};

export default ResourceTreeView;
