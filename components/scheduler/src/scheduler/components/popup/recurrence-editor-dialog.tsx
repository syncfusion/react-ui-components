import { FC, ReactNode, useCallback, useMemo, useState, useEffect } from 'react';
import { Dialog } from '@syncfusion/react-popups';
import { useSchedulerLocalization } from '../../common/locale';
import { useProviderContext, Variant } from '@syncfusion/react-base';
import { CSS_CLASSES } from '../../common/constants';
import { useEditorContext } from '../../context/scheduler-editor-popup-context';
import { RecurrenceChangeEvent, RecurrenceEditor } from '../../../recurrence-editor';
import { Button } from '@syncfusion/react-buttons';

const RecurrenceEditorDialog: FC = () => {
    const { locale } = useProviderContext();
    const { getString } = useSchedulerLocalization(locale || 'en-US');
    const { recurrenceOpen, closeRecurrenceEditor, recurrenceStart, data, handleRecurrenceRuleChange } = useEditorContext();
    const [rule, setRule] = useState<string>(data?.recurrenceRule ?? '');

    useEffect(() => {
        setRule(data?.recurrenceRule ?? '');
    }, [data?.recurrenceRule, recurrenceOpen]);

    const handleRecurrenceChange: (e: RecurrenceChangeEvent) => void = useCallback((e: RecurrenceChangeEvent): void => {
        setRule(e.value);
    }, []);

    const handleSave: () => void = useCallback((): void => {
        handleRecurrenceRuleChange(rule);
        closeRecurrenceEditor();
    }, [rule, closeRecurrenceEditor, handleRecurrenceRuleChange]);

    const handleCancel: () => void = useCallback((): void => {
        closeRecurrenceEditor();
    }, [closeRecurrenceEditor]);

    const footer: ReactNode = useMemo(() => {
        return (
            <div className={CSS_CLASSES.DIALOG_FOOTER}>
                <Button
                    className={CSS_CLASSES.SAVE_EVENT}
                    variant={Variant.Standard}
                    onClick={handleSave}>
                    {getString('save')}
                </Button>
                <Button
                    className={CSS_CLASSES.CANCEL_EVENT}
                    variant={Variant.Standard}
                    onClick={handleCancel}>
                    {getString('cancel')}
                </Button>
            </div>
        );
    }, [getString, handleSave, handleCancel]);


    if (!recurrenceOpen) { return null; }

    return (
        <Dialog
            header={getString('customRecurrence')}
            footer={footer}
            open={recurrenceOpen}
            onClose={closeRecurrenceEditor}
            modal={true}
            style={{ width: '500px', minHeight: '388px' }}
            className={`${CSS_CLASSES.DIALOG}`}>
            <RecurrenceEditor
                value={rule}
                onChange={handleRecurrenceChange}
                startDate={recurrenceStart}
            />
        </Dialog>
    );
};

export default RecurrenceEditorDialog;

