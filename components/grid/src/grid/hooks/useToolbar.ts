import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
    IToolbar
} from '@syncfusion/react-navigations';
import { SelectionModel, SelectionSettings } from '../types/selection.interfaces';
import { editModule, EditSettings } from '../types/edit.interfaces';
import * as React from 'react';
import { ToolbarConfig, ToolbarAPI, ToolbarClickEvent } from '../types/toolbar.interfaces';
import { ColumnProps, IRow, UseCommandColumnResult, VirtualSettings } from '../types';

/**
 * Custom hook to manage toolbar operations for the grid.
 * Handles item enable/disable state, input visibility, and toolbar click events.
 *
 * @private
 * @param {ToolbarConfig} config - Toolbar configuration (required)
 * @param {editModule} editModule - Edit module reference for CRUD operations
 * @param {SelectionModel<T>} selectionModule - Selection module reference for row selection state
 * @param {T[]} currentViewData - Current paginated/filtered view data for row count validation
 * @param {boolean} allowSearching - Enables toolbar search item
 * @param {UseCommandColumnResult} commandColumnModule - Command column module with action references
 * @param {SelectionSettings} selectionSettings - Defines selection behavior and modes
 * @param {boolean} showColumnChooser - Enables column chooser toolbar item
 * @param {VirtualSettings} virtualSettings - Virtual scrolling configuration for lazy-loaded data
 * @param {number} totalRecordsCount - Total records across all pages for row validation
 * @returns {ToolbarAPI} API methods and state for toolbar management
 */
export const useToolbar: (config: ToolbarConfig, editModule?: editModule, selectionModule?: SelectionModel, currentViewData?: unknown[],
    allowSearching?: boolean, commandColumnModule?: UseCommandColumnResult, selectionSettings?: SelectionSettings,
    showColumnChooser?: boolean, virtualSettings?: VirtualSettings, totalRecordsCount?: number) => ToolbarAPI = <T = unknown>(
    config: ToolbarConfig,
    editModule?: editModule,
    selectionModule?: SelectionModel<T>,
    currentViewData?: T[],
    allowSearching?: boolean,
    commandColumnModule?: UseCommandColumnResult,
    selectionSettings?: SelectionSettings,
    showColumnChooser?: boolean,
    virtualSettings?: VirtualSettings,
    totalRecordsCount?: number
): ToolbarAPI => {
    const commandEdit: React.RefObject<boolean> = commandColumnModule?.commandEdit;
    const commandAddRef: React.RefObject<IRow<ColumnProps>[]> = commandColumnModule?.commandAddRef;
    // Always call hooks in the same order - no conditional hooks
    const [isRendered, setIsRendered] = useState<boolean>(false);
    // Track disabled state using React state instead of DOM manipulation
    const [disabledItemsState, setDisabledItemsState] = useState<Set<string>>(new Set<string>());
    // Track add new row input disabled state instead of DOM manipulation
    const [addRowInputsDisabled, setAddRowInputsDisabled] = useState<boolean>(false);
    const toolbarRef: React.RefObject<IToolbar> = useRef<IToolbar | null>(null);
    const editModuleRef: React.RefObject<editModule> = useRef(editModule);
    const selectionModuleRef: React.RefObject<SelectionModel> = useRef(selectionModule);
    const currentViewDataRef: React.RefObject<T[]> = useRef(currentViewData);

    const {
        gridId,
        onToolbarItemClick
    } = config;

    // Update refs without causing re-renders
    editModuleRef.current = editModule;
    selectionModuleRef.current = selectionModule;
    currentViewDataRef.current = currentViewData;

    /**
     * Gets the toolbar element
     *
     * @returns {HTMLElement | null} The toolbar element
     */
    const getToolbar: () => HTMLElement | null = useCallback((): HTMLElement | null => {
        return toolbarRef.current?.element;
    }, []);

    /**
     * React-compliant enableItems function that updates state instead of DOM
     */
    const enableItems: (items: string[], isEnable: boolean) => void = useCallback((items: string[], isEnable: boolean): void => {
        setDisabledItemsState((prevDisabled: Set<string>) => {
            const newDisabled: Set<string> = new Set(prevDisabled);
            items.forEach((itemId: string) => {
                if (isEnable) {
                    newDisabled.delete(itemId);
                } else {
                    newDisabled.add(itemId);
                }
            });
            return newDisabled;
        });
    }, []);

    const refreshToolbarItems: () => void = useCallback((): void => {
        const editMod: editModule | undefined = editModuleRef.current;
        const selectionMod: SelectionModel = selectionModuleRef.current;
        const viewData: T[] | undefined = currentViewDataRef.current;

        if (!editMod) {
            return;
        }

        const enableItemsList: string[] = [];
        const disableItemsList: string[] = [];
        const editSettings: EditSettings = editMod.editSettings;
        const persistSelection: boolean = selectionSettings?.persistSelection ?? false;

        const selectedRowIndexes: number[] = selectionMod?.selectedRowIndexes ?? [];
        const hasData: boolean = (viewData && viewData.length > 0);
        const hasSelection: boolean = persistSelection
            ? (selectionMod?.getPersistSelectedData?.().length ?? 0) > 0
            : selectedRowIndexes.length > 0;

        const gridElement: HTMLElement | null = toolbarRef.current?.element?.closest('.sf-grid') ?? null;
        const hasEditRow: boolean = gridElement?.querySelector('.sf-grid-edit-row') !== null;
        const addRow: boolean = editSettings?.showAddNewRow === true && !hasEditRow;

        if (editSettings?.allowAdd === true) {
            enableItemsList.push(`${gridId}_add`);
        } else {
            disableItemsList.push(`${gridId}_add`);
        }

        if (editSettings?.allowEdit === true && hasData && !commandEdit?.current) {
            enableItemsList.push(`${gridId}_edit`);
        } else {
            disableItemsList.push(`${gridId}_edit`);
        }

        if (editSettings?.allowDelete === true && hasData && !commandEdit?.current) {
            enableItemsList.push(`${gridId}_delete`);
        } else {
            disableItemsList.push(`${gridId}_delete`);
        }

        if (allowSearching) {
            enableItemsList.push(`${gridId}_search`);
        } else {
            disableItemsList.push(`${gridId}_search`);
        }

        // Handle column chooser enable/disable based on showColumnChooser property
        // Default is false (disabled) when undefined
        if (showColumnChooser === true) {
            enableItemsList.push(`${gridId}_columnchooser`);
        } else {
            disableItemsList.push(`${gridId}_columnchooser`);
        }

        if ((editMod.isEdit === true || editSettings?.showAddNewRow === true) && (editSettings?.allowAdd === true
            || editSettings?.allowEdit === true)) {
            if (addRow || (virtualSettings?.enableRow === true && commandEdit?.current && commandAddRef?.current?.length)) {
                const itemsToEnable: string[] = !addRow ? [`${gridId}_search`] :
                    [`${gridId}_update`, `${gridId}_cancel`, `${gridId}_edit`, `${gridId}_delete`, `${gridId}_search`];
                const itemsToDisable: string[] = [`${gridId}_add`];

                itemsToEnable.forEach((item: string) => {
                    if (!enableItemsList.includes(item)) {
                        enableItemsList.push(item);
                    }
                });
                itemsToDisable.forEach((item: string) => {
                    const index: number = enableItemsList.indexOf(item);
                    if (index > -1) {
                        enableItemsList.splice(index, 1);
                    }
                    if (!disableItemsList.includes(item)) {
                        disableItemsList.push(item);
                    }
                });
            } else {
                // Normal edit mode or showAddNewRow with edited row
                // When editing an existing row with showAddNewRow enabled, the add new row should be disabled
                const itemsToEnable: string[] = [`${gridId}_update`, `${gridId}_cancel`, `${gridId}_search`];
                const itemsToDisable: string[] = commandEdit?.current
                    ? [`${gridId}_edit`, `${gridId}_delete`, `${gridId}_update`, `${gridId}_cancel`]
                    : [`${gridId}_add`, `${gridId}_edit`, `${gridId}_delete`];

                itemsToEnable.forEach((item: string) => {
                    if (!enableItemsList.includes(item)) {
                        enableItemsList.push(item);
                    }
                });
                itemsToDisable.forEach((item: string) => {
                    const index: number = enableItemsList.indexOf(item);
                    if (index > -1) {
                        enableItemsList.splice(index, 1);
                    }
                    if (!disableItemsList.includes(item)) {
                        disableItemsList.push(item);
                    }
                });
            }
        } else {
            // Not in edit mode - disable Update/Cancel
            disableItemsList.push(`${gridId}_update`, `${gridId}_cancel`);
        }

        // Apply selection-based logic for Edit/Delete buttons
        // This ensures Edit/Delete are only enabled when rows are selected
        if (!hasSelection) {
            // Remove Edit/Delete from enable list if no selection
            const editIndex: number = enableItemsList.indexOf(`${gridId}_edit`);
            const deleteIndex: number = enableItemsList.indexOf(`${gridId}_delete`);

            if (editIndex > -1) {
                enableItemsList.splice(editIndex, 1);
                if (!disableItemsList.includes(`${gridId}_edit`)) {
                    disableItemsList.push(`${gridId}_edit`);
                }
            }
            if (deleteIndex > -1) {
                enableItemsList.splice(deleteIndex, 1);
                if (!disableItemsList.includes(`${gridId}_delete`)) {
                    disableItemsList.push(`${gridId}_delete`);
                }
            }
        }

        // Track add new row input disabled state
        if (editSettings?.showAddNewRow === true && editMod.isEdit === true && !addRow) {
            setAddRowInputsDisabled(true);
        } else if (editSettings?.showAddNewRow === true && (!editMod.isEdit || addRow)) {
            setAddRowInputsDisabled(false);
        }

        // Apply enable/disable states
        enableItems(enableItemsList, true);
        enableItems(disableItemsList, false);
    }, [gridId, enableItems, totalRecordsCount, selectionSettings?.persistSelection]);

    /**
     * Effect to apply input disabled state to add new row inputs.
     * Uses state-driven approach instead of direct DOM manipulation.
     */
    useEffect(() => {
        const gridElement: HTMLElement | null = toolbarRef.current?.element?.closest('.sf-grid') ?? null;
        const addRow: HTMLElement | null = gridElement?.querySelector('.sf-grid-add-row') ?? null;
        if (!addRow) {
            return;
        }

        const inputs: NodeListOf<HTMLInputElement> = addRow.querySelectorAll('.sf-input');
        inputs.forEach((inputElement: HTMLInputElement) => {
            if (addRowInputsDisabled) {
                inputElement.classList.add('sf-disabled');
                inputElement.setAttribute('disabled', 'disabled');
            } else {
                inputElement.classList.remove('sf-disabled');
                inputElement.removeAttribute('disabled');
            }
        });
    }, [addRowInputsDisabled]);

    const handleToolbarClick: (args: ToolbarClickEvent) => void = useCallback((args: ToolbarClickEvent): void => {
        const editMod: editModule = editModuleRef.current;

        if (!args.item || !editMod) {
            return;
        }

        const itemId: string = args.item.id;

        const extendedArgs: ToolbarClickEvent = {
            ...args,
            cancel: false
        };

        // Trigger custom event handler first
        onToolbarItemClick?.(extendedArgs);
        if (extendedArgs.cancel) {
            return;
        }
        const cellEdit: boolean = editMod?.editSettings?.mode === 'Cell';
        switch (itemId) {
        case `${gridId}_add`:
            editMod?.addRecord();
            break;

        case `${gridId}_edit`:
            if (cellEdit) {
                editMod?.editFocusedCell();
            } else {
                editMod?.editRecord();
            }
            break;

        case `${gridId}_update`:
            if (cellEdit) {
                editMod?.saveCellChanges();
            } else {
                editMod?.saveDataChanges();
            }
            break;

        case `${gridId}_cancel`:
            if (cellEdit) {
                editMod?.cancelCellChanges();
            } else {
                editMod?.cancelDataChanges();
            }
            break;

        case `${gridId}_delete`:
            if (cellEdit) {
                editMod?.deleteCell();
            } else {
                editMod?.deleteRecord();
            }
            break;

        case `${gridId}_search`:
            break;
        }

        // Refresh after actual actions with minimal delay to ensure completion
        setTimeout(() => refreshToolbarItems(), 50);
    }, [gridId, onToolbarItemClick, refreshToolbarItems, totalRecordsCount]);

    // Only set rendered state once, no other effects
    useEffect(() => {
        setIsRendered(true);
    }, []);

    // Refresh toolbar items when toolbar config changes or when view data changes (e.g., after filter)
    useEffect(() => {
        refreshToolbarItems();
    }, [config.toolbar, currentViewData]);

    // Memoize activeItems to prevent unnecessary re-renders in downstream consumers
    const activeItems: Set<string> = useMemo(() => new Set<string>(), []);

    return {
        getToolbar,
        enableItems,
        refreshToolbarItems,
        handleToolbarClick,
        isRendered,
        activeItems,
        disabledItems: disabledItemsState,
        toolbarRef
    };
};

export default useToolbar;
