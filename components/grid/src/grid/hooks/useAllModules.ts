import { GridModules } from '../types/grid.interfaces';
import { PagerModule } from '../hooks/usePager';
import { GroupModule } from '../hooks/useGroup';
import { TreeDataModule } from '../hooks/useTreeData';
import { ToolbarModule } from '../hooks/useToolbar';
import { ColumnChooserModule } from '../hooks/useColumnChooser';
import { ContextMenuModule } from '../hooks/useContextMenu';
import { EditModule } from '../hooks/useEdit';
import { FilterModule } from '../hooks/useFilter';
import { ClipboardModule } from '../hooks/useClipboard';
import { SearchModule } from '../hooks/useSearch';
import { CommandColumnModule } from '../hooks/useCommandColumn';
import { AggregateModule } from '../hooks/useAggregate';
import { AutoFillModule } from '../hooks/useAutoFill';
import { ResizeModule } from '../hooks/useColumnResize';
import {AutoFitModule} from '../hooks/useColumnAutoFit';
import { DetailGridModule } from '../hooks/useDetailGrid';
import { ReorderModule } from '../hooks/useColumnReorder';
import { PinningModule } from '../hooks/usePinning';
import { PivotModule } from './usePivotModule';
import { FormulaModule } from '../hooks/useFormula';
import { ColumnToolPanelModule } from '../hooks/useColumnToolPanel';
import { FilterToolPanelModule } from '../hooks/useFilterToolPanel';
import { EditToolPanelModule } from '../hooks/useEditToolPanel';

const useAllModules: Omit<GridModules, 'GridAllModules'> = {
    ColumnToolPanelModule,
    FilterToolPanelModule,
    EditToolPanelModule,
    ClipboardModule,
    ResizeModule,
    AutoFitModule,
    AutoFillModule,
    DetailGridModule,
    FilterModule,
    EditModule,
    PagerModule,
    GroupModule,
    TreeDataModule,
    ToolbarModule,
    ContextMenuModule,
    ColumnChooserModule,
    SearchModule,
    CommandColumnModule,
    AggregateModule,
    ReorderModule,
    PinningModule,
    PivotModule,
    FormulaModule
};

export { useAllModules as GridAllModules };
