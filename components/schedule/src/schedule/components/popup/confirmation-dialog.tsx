import { FC } from 'react';
import { Dialog } from '@syncfusion/react-popups';
import { Button, Variant } from '@syncfusion/react-buttons';
import { useProviderContext } from '@syncfusion/react-base';
import { useScheduleLocalization } from '../../common/locale';

interface ConfirmationDialogProps {
    visible: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

/**
 * Delete confirmation dialog component using Syncfusion Dialog.
 * Shows a modal dialog asking user to confirm before deleting an event.
 *
 * @param {ConfirmationDialogProps} props - The properties for the confirmation dialog component.
 * @returns {JSX.Element} The rendered delete confirmation dialog.
 */
export const ConfirmationDialog: FC<ConfirmationDialogProps> = (props: ConfirmationDialogProps) => {
    const { visible, onConfirm, onCancel } = props;
    const { locale } = useProviderContext();
    const { getString } = useScheduleLocalization(locale || 'en-US');

    return (
        <Dialog
            header={getString('deleteEvent')}
            open={visible}
            style={{ maxWidth: '400px' }}
            footer={
                <>
                    <Button onClick={onConfirm} variant={Variant.Standard}>
                        {getString('delete')}
                    </Button>
                    <Button onClick={onCancel} variant={Variant.Standard}>
                        {getString('cancel')}
                    </Button>
                </>
            }
            onClose={onCancel}
        >
            <div>{getString('confirmDeleteMessage')}</div>
        </Dialog>
    );
};

export default ConfirmationDialog;
