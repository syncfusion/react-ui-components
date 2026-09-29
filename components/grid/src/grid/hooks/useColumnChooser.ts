import { columnChooserModule } from '../types/column-chooser.interface';
import { ColumnChooserDialog } from '../views/ColumnChooserDialog';
import { ToolbarModule } from './useToolbar';

const useColumnChooser: () => columnChooserModule = (): columnChooserModule => {
    return { ColumnChooserDialog, ToolbarModule };
};
export { useColumnChooser as ColumnChooserModule };
