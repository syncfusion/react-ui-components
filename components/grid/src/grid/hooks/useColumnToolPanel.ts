import { createElement } from 'react';
import { SideBarPanelContent, SideBarPanelContext } from '../types/sidebar.interfaces';

const useColumnToolPanel: () => SideBarPanelContent = (): SideBarPanelContent => ({
    render: ({ panelId }: SideBarPanelContext) => createElement('div', { 'data-panel-id': panelId }, 'Columns tool panel')
});

export { useColumnToolPanel as ColumnToolPanelModule };
