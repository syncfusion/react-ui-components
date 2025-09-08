import * as React from 'react';
import { useState, useCallback, useEffect } from 'react';
import { Dialog } from '@syncfusion/react-popups';
import { Button, Color, Variant } from '@syncfusion/react-buttons';
import { useGridComputedProvider, useGridMutableProvider } from '../../contexts';
import { ConfirmDialogProps } from '../../types/edit.interfaces';

/**
 * ConfirmDialog component for handling confirmation dialogs in grid editing
 *
 * This component provides a React-based dialog system to replace window.confirm
 * and window.alert usage in the grid editing functionality, following the original
 * grid component's dialog patterns and using sf- classes as per React implementation standards.
 *
 * @param {ConfirmDialogProps} props - ConfirmDialog component props
 * @param {boolean} props.isOpen - Whether the dialog is open
 * @param {Object} props.config - Dialog configuration
 * @param {Function} [props.onConfirm] - Callback when confirm button is clicked
 * @param {Function} [props.onCancel] - Callback when cancel button is clicked
 * @returns {React.ReactElement} ConfirmDialog component
 */
export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    isOpen,
    config,
    onConfirm,
    onCancel
}: ConfirmDialogProps): React.ReactElement | null => {
    const { getParentElement, cssClass } = useGridMutableProvider();
    const { id } = useGridComputedProvider();
    const [internalOpen, setInternalOpen] = useState<boolean>(false);

    // Sync internal state with props
    useEffect((): void => {
        setInternalOpen(isOpen);
    }, [isOpen]);

    /**
     * Handle confirm button click
     */
    const handleConfirm: () => void = useCallback((): void => {
        onConfirm?.();
        setInternalOpen(false);
    }, [onConfirm]);

    /**
     * Handle cancel button click
     *
     * @returns {void}
     */
    const handleCancel: () => void = useCallback((): void => {
        onCancel?.();
        setInternalOpen(false);
    }, [onCancel]);

    return (
        <Dialog
            id={id + 'EditAlert'}
            className={cssClass}
            open={internalOpen}
            modal={true}
            target={getParentElement()}
            header={config?.title}
            style={{ width: '320px' }}
            closeIcon={false}
            footer={
                <>
                    <Button
                        variant={Variant.Standard}
                        color={Color.Primary}
                        className={cssClass}
                        onClick={handleConfirm}
                        onKeyDown={(event: React.KeyboardEvent<HTMLButtonElement>) => event.code === 'Enter' ? handleConfirm() : undefined}
                    >
                        {config?.confirmText}
                    </Button>
                    {/* Only show cancel button if cancelText is provided and not empty */}
                    {config.cancelText && config?.cancelText.trim() !== '' && (
                        <Button
                            variant={Variant.Standard}
                            className={cssClass}
                            onClick={handleCancel}
                            onKeyDown={(event: React.KeyboardEvent<HTMLButtonElement>) => event.code === 'Enter' ? handleCancel() : undefined}
                        >
                            {config?.cancelText}
                        </Button>
                    )}
                </>
            }
        >
            {config.message}
        </Dialog>
    );
};

ConfirmDialog.displayName = 'ConfirmDialog';
