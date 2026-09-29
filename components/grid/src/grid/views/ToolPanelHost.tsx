import { ReactElement, ReactNode, useEffect, useMemo, useState } from 'react';
import { Button, Color, Variant } from '@syncfusion/react-buttons';
import { Sidebar } from '@syncfusion/react-navigations';
import { ColumnsIcon } from '@syncfusion/react-icons/src/icons/columns';
import { FilterIcon } from '@syncfusion/react-icons/src/icons/filter';
import { EditIcon } from '@syncfusion/react-icons/src/icons/edit';
import { ColumnProps, GridModules, SideBar, SideBarDef, SideBarPanelContext, SideBarPanelContent, SideBarToolPanel } from '../types';
import { useGridComputedProvider } from '../contexts/GridProviders';
import { ColumnChooserDialog } from './ColumnChooserDialog';

interface ToolPanelHostProps<T> {
    sideBar?: SideBar<T>;
    modules?: GridModules<T>;
    rowData?: T[];
    isOpen?: boolean;
    onOpenChange?: (isOpen: boolean, isColumnPanel?: boolean) => void;
}

interface ResolvedToolPanel<T> extends SideBarToolPanel<T> {
    id: string;
    label: string;
    type: 'columns' | 'filters' | 'editing' | 'custom';
}

export const getPanelDefinition: <T>(panel: string | SideBarToolPanel<T>) => ResolvedToolPanel<T> =
<T, >(panel: string | SideBarToolPanel<T>): ResolvedToolPanel<T> => {
    if (typeof panel !== 'string') {
        return {
            ...panel,
            id: panel.id,
            label: panel.label ?? panel.id,
            type: panel.type ?? 'custom'
        };
    }

    const normalizedPanel: string = panel.toLowerCase();
    if (normalizedPanel === 'columns') {
        return { id: 'columns', label: 'Columns', type: 'columns' };
    }

    if (normalizedPanel === 'filters' || normalizedPanel === 'filter') {
        return { id: 'filters', label: 'Filters', type: 'filters' };
    }

    if (normalizedPanel === 'editing' || normalizedPanel === 'edit') {
        return { id: 'editing', label: 'Editing', type: 'editing' };
    }

    if (normalizedPanel === 'custom') {
        return { id: 'custom', label: 'Custom', type: 'custom' };
    }

    return { id: panel, label: panel, type: 'custom' };
};

/**
 * Converts sidebar configuration into renderable panel definitions.
 *
 * @param {SideBar<T> | undefined} sideBar - Sidebar configuration object.
 * @returns {ResolvedToolPanel<T>[]} Resolved panel definitions in the configured order.
 */
export const normalizeSideBar: <T>(sideBar?: SideBar<T>) => ResolvedToolPanel<T>[] =
<T, >(sideBar?: SideBar<T>): ResolvedToolPanel<T>[] => {
    if (!sideBar || sideBar.enabled === false) {
        return [];
    }

    const toolPanels: Array<string | SideBarToolPanel<T>> = sideBar.toolPanels ?? ['columns', 'filters'];
    return toolPanels.map(getPanelDefinition);
};

export const getPanelIcon: (panelId: string) => ReactElement | undefined = (panelId: string): ReactElement | undefined => {
    if (panelId === 'columns') {
        return <ColumnsIcon />;
    }
    if (panelId === 'filters') {
        return <FilterIcon />;
    }
    if (panelId === 'editing') {
        return <EditIcon />;
    }
    return undefined;
};

export const renderPanelContent: <T>(panel: ResolvedToolPanel<T>, modules?: GridModules<T>, rowData?: T[]) => ReactElement =
<T, >(panel: ResolvedToolPanel<T>, modules?: GridModules<T>, rowData?: T[]): ReactElement => {
    const context: SideBarPanelContext<T> = { panelId: panel.id, rowData };
    const moduleContent: SideBarPanelContent<T> | undefined = panel.type === 'columns'
        ? modules?.ColumnToolPanelModule?.()
        : panel.type === 'filters' ? modules?.FilterToolPanelModule?.()
            : panel.type === 'editing' ? modules?.EditToolPanelModule?.() : undefined;
    const content: ReactNode = panel.content?.render?.(context)
        ?? panel.content?.content
        ?? moduleContent?.render?.(context)
        ?? moduleContent?.content;
    return <div className='sf-grid-tool-panel-content' id={`sf-tool-panel-content-${panel.id}`} role='tabpanel' aria-labelledby={`sf-tool-panel-button-${panel.id}`}>
        {content ?? <div data-panel-id={panel.id}>{panel.label} tool panel</div>}
    </div>;
};

/**
 * Renders the sidebar rail and the selected tool panel.
 *
 * @param {ToolPanelHostProps<T>} props - Sidebar host properties.
 * @returns {ReactElement | null} The rendered sidebar host or null when no panels are configured.
 */
export const ToolPanelHost: <T>(props: ToolPanelHostProps<T>) => ReactElement | null =
<T, >({ sideBar, modules, rowData, isOpen: controlledIsOpen, onOpenChange }: ToolPanelHostProps<T>):
ReactElement | null => {
    const { columns, getColumns, columnChooserSettings, localeObj } = useGridComputedProvider<T>();
    const panels: ResolvedToolPanel<T>[] = useMemo(() => normalizeSideBar(sideBar).map(
        (panel: ResolvedToolPanel<T>): ResolvedToolPanel<T> => {
            if (panel.type === 'columns' && panel.label === 'Columns') {
                return { ...panel, label: localeObj?.getConstant('columnsToolPanelLabel') || panel.label };
            }
            if (panel.type === 'filters' && panel.label === 'Filters') {
                return { ...panel, label: localeObj?.getConstant('filtersToolPanelLabel') || panel.label };
            }
            if (panel.type === 'editing' && panel.label === 'Editing') {
                return { ...panel, label: localeObj?.getConstant('editToolPanelLabel') || panel.label };
            }
            if (panel.id === 'custom' && panel.label === 'Custom') {
                return { ...panel, label: localeObj?.getConstant('customToolPanelLabel') || panel.label };
            }
            return panel;
        }
    ), [sideBar, localeObj]);
    const resolvedModules: GridModules<T> | undefined = modules?.GridAllModules ?? modules;
    const definition: SideBarDef<T> | undefined = sideBar;
    const defaultPanelId: string | undefined = definition?.defaultToolPanel
        ? getPanelDefinition(definition.defaultToolPanel).id : panels[0]?.id;
    const [selectedPanelId, setSelectedPanelId] = useState<string | null>(
        defaultPanelId ?? null
    );
    const [uncontrolledIsOpen, setUncontrolledIsOpen] = useState<boolean>(definition?.openByDefault === true && panels.length > 0);
    const isOpen: boolean = controlledIsOpen ?? uncontrolledIsOpen;
    const selectedPanel: ResolvedToolPanel<T> | undefined = panels.find(
        (panel: ResolvedToolPanel<T>) => panel.id === selectedPanelId);
    const chooserColumns: ColumnProps<T>[] = selectedPanel?.type === 'columns'
        ? (getColumns?.() ?? columns) as unknown as ColumnProps<T>[] : [];

    useEffect(() => {
        onOpenChange?.(isOpen, selectedPanel?.type === 'columns');
    }, [isOpen, onOpenChange, selectedPanel?.type]);

    if (panels.length === 0) {
        return null;
    }

    const setOpenState: (nextOpen: boolean, isColumnPanel?: boolean) => void =
        (nextOpen: boolean, isColumnPanel: boolean = selectedPanel?.type === 'columns'): void => {
            if (controlledIsOpen === undefined) {
                setUncontrolledIsOpen(nextOpen);
            } else {
                onOpenChange?.(nextOpen, isColumnPanel);
            }
        };

    const selectPanel: (panelId: string) => void = (panelId: string): void => {
        const panel: ResolvedToolPanel<T> | undefined = panels.find((item: ResolvedToolPanel<T>) => item.id === panelId);
        setSelectedPanelId(panelId);
        setOpenState(selectedPanelId === panelId ? !isOpen : true, panel?.type === 'columns');
    };

    const panelPosition: 'left' | 'right' = definition?.position === 'left' ? 'left' : 'right';

    return <div className={`sf-grid-tool-panel-host sf-grid-tool-panel-${panelPosition}`} data-open={isOpen}>
        <Sidebar
            open={isOpen}
            position={definition?.position === 'left' ? 'Left' : 'Right'}
            mode='Over'
            style={{ width: 320, height: '100%' }}
            closeOnDocumentClick={false}
            onOpenChange={(event: { open: boolean }) => setOpenState(event.open)}
        >
            <div
                className='sf-grid-tool-panel-sidebar'
                data-open={isOpen}            >
                {selectedPanel?.type === 'columns' ? (
                    <ColumnChooserDialog
                        isOpen={isOpen}
                        embedded={true}
                        onClose={() => setOpenState(false)}
                        columns={chooserColumns}
                        settings={{ ...columnChooserSettings, mode: 'immediate', immediateModeDelay: 0 }}
                    />
                ) : selectedPanel && renderPanelContent(selectedPanel, resolvedModules, rowData)}
            </div>
        </Sidebar>
        {!definition?.hideButtons && <div className='sf-grid-tool-panel-rail' role='tablist' >
            {panels.map((panel: ResolvedToolPanel<T>) => <Button
                key={panel.id}
                id={`sf-tool-panel-button-${panel.id}`}
                className='sf-grid-tool-panel-button'
                variant={Variant.Standard}
                color={Color.Secondary}
                icon={getPanelIcon(panel.id)}
                onClick={() => selectPanel(panel.id)}
            >
                {panel.label}
            </Button>)}
        </div>}
    </div>;
};
