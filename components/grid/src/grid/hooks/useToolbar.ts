import { useState, useCallback, useRef, useEffect } from 'react';
import {
    IToolbar
} from '@syncfusion/react-navigations';
import { SelectionModel } from '../types/selection.interfaces';
import { editModule } from '../types/edit.interfaces';
import * as React from 'react';
import { ToolbarConfig, ToolbarAPI, ToolbarClickEvent } from '../types/toolbar.interfaces';

/**
 * Custom hook to manage toolbar operations for the grid
 *
 * @private
 * @param {ToolbarConfig} config - Toolbar configuration
 * @param {editModule} editModule - Edit module reference (passed directly to avoid context issues)
 * @param {SelectionModel} selectionModule - Selection module reference (passed directly to avoid context issues)
 * @param {Object[]} currentViewData - Current view data (passed directly to avoid context issues)
 * @param {boolean} allowSearching - Enable or disable the searching UI
 * @returns {ToolbarAPI} Toolbar API methods and state
 */
export const useToolbar: (config: ToolbarConfig, editModule?: editModule, selectionModule?: SelectionModel,
    currentViewData?: Object[], allowSearching?: boolean) => ToolbarAPI = (
    config: ToolbarConfig,
    editModule?: editModule,
    selectionModule?: SelectionModel,
    currentViewData?: Object[],
    allowSearching?: boolean
): ToolbarAPI => {
    // Always call hooks in the same order - no conditional hooks
    const [isRendered, setIsRendered] = useState<boolean>(false);
    // Track disabled state using React state instead of DOM manipulation
    const [disabledItemsState, setDisabledItemsState] = useState<Set<string>>(new Set<string>());
    const toolbarRef: React.RefObject<IToolbar> = useRef<IToolbar | null>(null);
    const editModuleRef: React.RefObject<editModule> = useRef(editModule);
    const selectionModuleRef: React.RefObject<SelectionModel> = useRef(selectionModule);
    const currentViewDataRef: React.RefObject<Object[]> = useRef(currentViewData);

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
        const editMod: editModule = editModuleRef.current;
        const selectionMod: SelectionModel = selectionModuleRef.current;
        const viewData: Object[] = currentViewDataRef.current;

        if (!editMod) {
            return;
        }

        const enableItemsList: string[] = [];
        const disableItemsList: string[] = [];
        const { editSettings } = editMod;

        const selectedRowIndexes: number[] = selectionMod?.selectedRowIndexes;
        const hasData: boolean = (viewData && viewData.length > 0);
        const hasSelection: boolean = selectedRowIndexes.length > 0;

        const gridElement: HTMLElement | null = toolbarRef.current?.element?.closest('.sf-grid');
        const addRow: boolean = editSettings?.showAddNewRow && !gridElement?.querySelector('.sf-editedrow');

        if (editSettings?.allowAdd) {
            enableItemsList.push(`${gridId}_add`);
        } else {
            disableItemsList.push(`${gridId}_add`);
        }

        if (editSettings?.allowEdit && hasData) {
            enableItemsList.push(`${gridId}_edit`);
        } else {
            disableItemsList.push(`${gridId}_edit`);
        }

        if (editSettings.allowDelete && hasData) {
            enableItemsList.push(`${gridId}_delete`);
        } else {
            disableItemsList.push(`${gridId}_delete`);
        }

        if (allowSearching) {
            enableItemsList.push(`${gridId}_search`);
        } else {
            disableItemsList.push(`${gridId}_search`);
        }

        if ((editMod.isEdit || editSettings.showAddNewRow) && (editSettings.allowAdd || editSettings.allowEdit)) {
            if (addRow) {
                const itemsToEnable: string[] = [`${gridId}_update`, `${gridId}_cancel`, `${gridId}_edit`, `${gridId}_delete`, `${gridId}_search`];
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
                const itemsToDisable: string[] = [`${gridId}_add`, `${gridId}_edit`, `${gridId}_delete`];

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

        // When editing an existing row with showAddNewRow enabled, the add new row inputs should be disabled
        if (editSettings.showAddNewRow && editMod.isEdit && !addRow) {
            // The add new row should remain visible but with disabled inputs
            disableShowAddNewRowInputs(false);
        } else if (editSettings.showAddNewRow && (!editMod.isEdit || addRow)) {
            // The add new row inputs should be re-enabled
            disableShowAddNewRowInputs(true);
        }

        // Apply enable/disable states
        enableItems(enableItemsList, true);
        enableItems(disableItemsList, false);
    }, [gridId, enableItems]);

    const disableShowAddNewRowInputs: (enable: boolean) => void = useCallback((enable: boolean): void => {
        const gridElement: HTMLElement | null = toolbarRef.current?.element?.closest('.sf-grid');
        const addRow: HTMLElement | null = gridElement?.querySelector('.sf-addedrow');
        if (!addRow) {
            return;
        }

        // Handle input elements in the add new row
        const inputs: NodeListOf<Element> = addRow.querySelectorAll('.sf-input');
        inputs.forEach((input: Element) => {
            const inputElement: HTMLInputElement = input as HTMLInputElement;

            // Enable/disable the input
            if (enable) {
                inputElement.classList.remove('sf-disabled');
                inputElement.removeAttribute('disabled');
            } else {
                inputElement.classList.add('sf-disabled');
                inputElement.setAttribute('disabled', 'disabled');
            }
        });
    }, []);

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

        switch (itemId) {
        case `${gridId}_add`:
            editMod?.addRecord();
            break;

        case `${gridId}_edit`:
            editMod?.editRow();
            break;

        case `${gridId}_update`:
            editMod?.saveChanges();
            break;

        case `${gridId}_cancel`:
            editMod?.cancelChanges();
            break;

        case `${gridId}_delete`:
            editMod?.deleteRecord();
            break;

        case `${gridId}_search`:
            break;
        }

        // Only refresh after actual actions, not on every click
        // Use a small delay to ensure the action has completed
        setTimeout(() => refreshToolbarItems(), 50);
    }, [gridId, onToolbarItemClick, refreshToolbarItems]);

    // Only set rendered state once, no other effects
    useEffect(() => {
        setIsRendered(true);
    }, []);

    return {
        getToolbar,
        enableItems,
        refreshToolbarItems,
        handleToolbarClick,
        isRendered,
        activeItems: new Set<string>(), // Always return empty set to prevent re-renders
        disabledItems: disabledItemsState, // Expose the disabled items state
        toolbarRef
    };
};

export default useToolbar;
