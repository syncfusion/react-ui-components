import { useState, useCallback, useMemo } from 'react';
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

        const localization: IL10n | undefined = serviceLocator.getService<IL10n>('localization');

        const l10nConstants: { okButtonLabel: string; cancelButtonLabel: string; confirmDeleteMessage: string } = useMemo(
            () => ({
                okButtonLabel: localization?.getConstant('okButtonLabel'),
                cancelButtonLabel: localization?.getConstant('cancelButtonLabel'),
                confirmDeleteMessage: localization?.getConstant('confirmDeleteMessage')
            }),
            [localization]
        );
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
                            confirmText: l10nConstants.okButtonLabel,
                            cancelText: l10nConstants.cancelButtonLabel,
                            type: 'Confirm',
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
            }, [l10nConstants]);

        /**
         * Show a delete confirmation dialog
         *
         * @returns {Promise<boolean>} - Promise that resolves to true if confirmed, false if cancelled
         */
        const confirmOnDelete: () => Promise<boolean> =
            useCallback((): Promise<boolean> => {
                return confirmOnEdit({
                    title: '',
                    message: l10nConstants.confirmDeleteMessage,
                    confirmText: l10nConstants.okButtonLabel,
                    cancelText: l10nConstants.cancelButtonLabel,
                    type: 'Delete'
                });
            }, [confirmOnEdit, l10nConstants]);

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
