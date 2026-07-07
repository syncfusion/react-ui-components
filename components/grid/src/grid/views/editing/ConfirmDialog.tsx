import * as React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { Dialog } from '@syncfusion/react-popups';
import { Button, Color, Variant } from '@syncfusion/react-buttons';
import { useGridComputedProvider, useGridMutableProvider } from '../../contexts';
import { ConfirmDialogProps } from '../../types/edit.interfaces';

/**
 * Constants for dialog configuration
 */
const CONFIRM_DIALOG_ID_SUFFIX: string = 'EditAlert';
const ENTER_KEY_CODE: string = 'Enter';

/**
 * ConfirmDialog component for handling confirmation dialogs in grid editing
 *
 * This component provides a React-based dialog system to replace window.confirm
 * and window.alert usage in the grid editing functionality, following the original
 * grid component's dialog patterns and using sf- classes as per React implementation standards.
 *
 * @param {ConfirmDialogProps} props - ConfirmDialog component props
 * @param {boolean} props.isOpen - Whether the dialog is open
 * @param {Object} props.config - Dialog configuration with title, message, confirmText, and optional cancelText
 * @param {Function} [props.onConfirm] - Callback when confirm button is clicked
 * @param {Function} [props.onCancel] - Callback when cancel button is clicked
 * @returns {React.ReactElement | null} ConfirmDialog component or null if not open
 */
export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    isOpen,
    config,
    onConfirm,
    onCancel
}: ConfirmDialogProps): React.ReactElement | null => {
    const { getParentElement, cssClass } = useGridMutableProvider();
    const { id } = useGridComputedProvider();
    const [isDialogOpen, setIsDialogOpen] = useState<boolean>(isOpen);

    // Sync internal state with props
    useEffect((): void => {
        setIsDialogOpen(isOpen);
    }, [isOpen]);

    /**
     * Handle confirm button click - triggers callback and closes dialog
     */
    const handleConfirm: () => void = useCallback((): void => {
        onConfirm?.();
        setIsDialogOpen(false);
    }, [onConfirm]);

    /**
     * Handle cancel button click - triggers callback and closes dialog
     */
    const handleCancel: () => void = useCallback((): void => {
        onCancel?.();
        setIsDialogOpen(false);
    }, [onCancel]);

    /**
     * Handle key down event on buttons
     */
    const handleKeyDown: (callback: () => void) => (event: React.KeyboardEvent<HTMLButtonElement>) => void = useCallback(
        (callback: () => void): ((event: React.KeyboardEvent<HTMLButtonElement>) => void) => {
            return (event: React.KeyboardEvent<HTMLButtonElement>): void => {
                if (event.code === ENTER_KEY_CODE) {
                    callback();
                }
            };
        },
        []
    );

    return (
        <Dialog
            id={`${id}${CONFIRM_DIALOG_ID_SUFFIX}`}
            className={cssClass}
            open={isDialogOpen}
            modal={true}
            target={getParentElement()}
            header={config.title}
            style={{ width: '320px' }}
            closeIcon={false}
            footer={
                <>
                    <Button
                        variant={Variant.Standard}
                        color={Color.Primary}
                        className={cssClass}
                        onClick={handleConfirm}
                        onKeyDown={handleKeyDown(handleConfirm)}
                        aria-label={config?.confirmText}
                    >
                        {config?.confirmText}
                    </Button>
                    {config.cancelText && config?.cancelText.trim() !== '' && (
                        <Button
                            variant={Variant.Standard}
                            className={cssClass}
                            onClick={handleCancel}
                            onKeyDown={handleKeyDown(handleCancel)}
                            aria-label={config?.cancelText}
                        >
                            {config?.cancelText}
                        </Button>
                    )}
                </>
            }
        >
            {config?.message}
        </Dialog>
    );
};

ConfirmDialog.displayName = 'ConfirmDialog';
