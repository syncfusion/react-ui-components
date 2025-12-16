import { FC, ReactNode } from 'react';
import { Dialog } from '@syncfusion/react-popups';
import { Button, Variant } from '@syncfusion/react-buttons';
import { useProviderContext } from '@syncfusion/react-base';
import { useSchedulerLocalization } from '../../common/locale';

interface ConfirmationDialogProps {
    visible: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    title?: string;
    message?: string;
    confirmText?: string;
    showCancel?: boolean;
}

/**
 * Confirmation dialog component using Syncfusion Dialog.
 * Shows a modal dialog for confirmations (delete, overlap, etc.).
 *
 * @param {ConfirmationDialogProps} props - The properties for the confirmation dialog component.
 * @returns {ReactNode} The rendered confirmation dialog.
 */
export const ConfirmationDialog: FC<ConfirmationDialogProps> = (props: ConfirmationDialogProps): ReactNode => {
    const { visible, onConfirm, onCancel, title, message, confirmText, showCancel = true } = props;
    const { locale } = useProviderContext();
    const { getString } = useSchedulerLocalization(locale || 'en-US');

    return (
        <Dialog
            header={title || getString('deleteEvent')}
            open={visible}
            style={{ maxWidth: '400px' }}
            footer={
                <>
                    <Button onClick={onConfirm} variant={Variant.Standard}>
                        {confirmText || getString('delete')}
                    </Button>
                    {showCancel && (
                        <Button onClick={onCancel} variant={Variant.Standard}>
                            {getString('cancel')}
                        </Button>
                    )}
                </>
            }
            onClose={onCancel}
        >
            <div>{message || getString('confirmDeleteMessage')}</div>
        </Dialog>
    );
};

export default ConfirmationDialog;
