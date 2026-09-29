import { createElement } from 'react';
import { SideBarPanelContent } from '../types/sidebar.interfaces';
import { FilterToolPanel } from '../views/FilterToolPanel';

const useFilterToolPanel: () => SideBarPanelContent = (): SideBarPanelContent => ({
    render: () => createElement(FilterToolPanel)
});

export { useFilterToolPanel as FilterToolPanelModule };
