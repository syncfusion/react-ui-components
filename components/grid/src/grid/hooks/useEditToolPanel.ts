import { createElement } from 'react';
import { SideBarPanelContent } from '../types/sidebar.interfaces';
import { EditToolPanel } from '../views/EditToolPanel';

const useEditToolPanel: () => SideBarPanelContent = (): SideBarPanelContent => ({
    render: () => createElement(EditToolPanel)
});

export { useEditToolPanel as EditToolPanelModule };
