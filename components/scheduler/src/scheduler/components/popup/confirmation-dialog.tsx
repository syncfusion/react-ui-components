import { FC, ReactNode } from 'react';
import { Dialog } from '@syncfusion/react-popups';
import { Button, Variant } from '@syncfusion/react-buttons';
import { useProviderContext } from '@syncfusion/react-base';
import { useSchedulerLocalization } from '../../common/locale';
import { AlertAction, CrudAction } from '../../types/enums';
import { useSchedulerPropsContext } from '../..';
import { CSS_CLASSES } from '../../common/constants';

interface ConfirmationDialogProps {
    visible: boolean;
    onConfirm: (selectOption?: CrudAction) => void;
    onCancel: () => void;
    title?: string;
    message?: string;
    confirmText?: string;
    showCancel?: boolean;
    action?: AlertAction;
}

/**
 * Confirmation dialog component using Syncfusion Dialog.
 * Shows a modal dialog for confirmations (delete, overlap, etc.).
 *
 * @param {ConfirmationDialogProps} props - The properties for the confirmation dialog component.
 * @returns {ReactNode} The rendered confirmation dialog.
 */
export const ConfirmationDialog: FC<ConfirmationDialogProps> = (props: ConfirmationDialogProps): ReactNode => {
    const { visible, onConfirm, onCancel, title, message, confirmText, showCancel = true, action = 'delete' } = props;
    const { locale } = useProviderContext();
    const { eventSettings } = useSchedulerPropsContext();
    const { getString } = useSchedulerLocalization(locale || 'en-US');
    const isRecurrenceAction: boolean = action === AlertAction.RecurrenceEdit || action === AlertAction.RecurrenceDelete;
    const isDeleteAction: boolean = action === AlertAction.RecurrenceDelete;

    return (
        <Dialog
            header={title || getString('deleteEvent')}
            open={visible}
            className={`${CSS_CLASSES.CONFIRMATION_DIALOG}`}
            style={{ maxWidth: '470px' }}
            animation={{effect: 'Zoom', duration: 400, delay: 1}}
            footer={
                <>
                    {isRecurrenceAction ? (
                        <>
                            <Button onClick={() => onConfirm(isDeleteAction ? 'DeleteOccurrence' : 'EditOccurrence')} variant={Variant.Standard}>
                                {isDeleteAction ? getString('deleteEvent') : getString('editThisEvent')}
                            </Button>
                            {eventSettings?.editFollowingEvents && (
                                <Button onClick={() => onConfirm(isDeleteAction ? 'DeleteFollowingEvents' : 'EditFollowingEvents')} variant={Variant.Standard}>
                                    {getString('followingEvents')}
                                </Button>
                            )}
                            <Button onClick={() => onConfirm(isDeleteAction ? 'DeleteSeries' : 'EditSeries')} variant={Variant.Standard}>
                                {getString('editEntireSeries')}
                            </Button>
                        </>
                    ) : action === AlertAction.SeriesChange ? (
                        <>
                            <Button onClick={() => onConfirm(isDeleteAction ? 'DeleteSeries' : 'EditSeries')} variant={Variant.Standard}>
                                {getString('yes')}
                            </Button>
                            <Button onClick={() => onConfirm('EditCurrentSeries')} variant={Variant.Standard}>
                                {getString('no')}
                            </Button>
                        </>
                    ) : (
                        <Button onClick={() => onConfirm()} variant={Variant.Standard}>
                            {confirmText || getString('delete')}
                        </Button>
                    )}
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
