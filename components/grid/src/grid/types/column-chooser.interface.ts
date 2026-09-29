import { JSX, RefObject } from 'react';
import { ColumnProps } from './column.interfaces';
import { ColumnChooserSettings, GridRef } from './grid.interfaces';
import { ToolbarAPI, ToolbarConfig } from './toolbar.interfaces';
import { SelectionModel, SelectionSettings } from './selection.interfaces';
import { UseCommandColumnResult } from './command.interfaces';
import { VirtualSettings } from './virtualization.interface';
import { editModule } from './edit.interfaces';

/**
 * ColumnChooserDialog component renders a modal dialog for column selection
 * with advanced features including custom templates, search operators, and column ordering
 *
 * @component
 * @private
 */
export interface ColumnChooserDialogProps<T> {
    isOpen: boolean;
    onClose: () => void;
    columns: Partial<ColumnProps<T>>[];
    embedded?: boolean;
    isContentHeightUpdateRequired?: Object;
    contentPanelHeight?: number;
    position?: { x?: number; y?: number };
    settings?: ColumnChooserSettings;
    onBeforeOpen?: (event: { cancel: boolean; columnChooserSettings?: ColumnChooserSettings }) => void;
    onApply?: (event: { columnVisibility?: Map<string, boolean>; columnChooserSettings?: ColumnChooserSettings }) => void;
}

/**
 * @private
 */
export type columnChooserModule = {
    ColumnChooserDialog: <T>(props: ColumnChooserDialogProps<T>) => JSX.Element | null;
    ToolbarModule: (
        config: ToolbarConfig,
        editModule?: editModule,
        selectionModule?: SelectionModel,
        currentViewData?: unknown[],
        allowSearching?: boolean,
        commandColumnModule?: UseCommandColumnResult,
        selectionSettings?: SelectionSettings,
        showColumnChooser?: boolean,
        virtualSettings?: VirtualSettings,
        totalRecordsCount?: number,
        gridRef?: RefObject<GridRef>
    ) => ToolbarAPI;
}
