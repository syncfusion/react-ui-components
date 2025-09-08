import { useState, useCallback } from 'react';
import { IL10n } from '@syncfusion/react-base';
import { ServiceLocator } from '../types/interfaces';
import { DialogState, ConfirmDialogConfig, UseConfirmDialogResult } from '../types/edit.interfaces';
/**
 * Hook for managing edit confirmation dialogs
 *
 * This hook provides a React-based dialog system to replace window.confirm
 * and window.alert usage in the grid editing functionality.
 *
 * @private
 * @param {ServiceLocator} serviceLocator - Grid service locator
 * @returns {UseConfirmDialogResult} Dialog state and control methods
 */
export const useConfirmDialog: (serviceLocator: ServiceLocator) => UseConfirmDialogResult =
    (serviceLocator: ServiceLocator): UseConfirmDialogResult => {
        const [dialogState, setDialogState] = useState<DialogState>({
            isOpen: false,
            config: null,
            onConfirm: null,
            onCancel: null
        });
        const localization: IL10n = serviceLocator?.getService<IL10n>('localization');
        /**
         * Show a confirmation dialog
         *
         * @param {ConfirmDialogConfig} config - Dialog configuration
         * @returns {Promise<boolean>} - Promise that resolves to true if confirmed, false if cancelled
         */
        const confirmOnEdit: (config: ConfirmDialogConfig) => Promise<boolean> =
            useCallback((config: ConfirmDialogConfig): Promise<boolean> => {
                return new Promise((resolve: (value: boolean | PromiseLike<boolean>) => void) => {
                    setDialogState({
                        isOpen: true,
                        config: {
                            confirmText: localization?.getConstant('okButtonLabel'),
                            cancelText: localization?.getConstant('cancelButtonLabel'),
                            type: 'confirm',
                            ...config
                        },
                        onConfirm: () => {
                            setDialogState((prev: DialogState) => ({ ...prev, isOpen: false }));
                            resolve(true);
                        },
                        onCancel: () => {
                            setDialogState((prev: DialogState) => ({ ...prev, isOpen: false }));
                            resolve(false);
                        }
                    });
                });
            }, [localization]);

        /**
         * Show a delete confirmation dialog
         *
         * @returns {Promise<boolean>} - Promise that resolves to true if confirmed, false if cancelled
         */
        const confirmOnDelete: () => Promise<boolean> =
            useCallback((): Promise<boolean> => {
                const message: string = localization?.getConstant('confirmDeleteMessage');

                return confirmOnEdit({
                    title: '',
                    message,
                    confirmText: localization?.getConstant('okButtonLabel'),
                    cancelText: localization?.getConstant('cancelButtonLabel'),
                    type: 'delete'
                });
            }, [confirmOnEdit, localization]);

        return {
            // Dialog state
            isDialogOpen: dialogState.isOpen,
            dialogConfig: dialogState.config,

            // Dialog actions
            onDialogConfirm: dialogState.onConfirm,
            onDialogCancel: dialogState.onCancel,

            // Dialog methods
            confirmOnEdit,
            confirmOnDelete
        };
    };
