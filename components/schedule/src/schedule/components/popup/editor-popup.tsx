import { FC, useCallback } from 'react';
import { Dialog } from '@syncfusion/react-popups';
import { TextBox, Form, FormField, TextArea } from '@syncfusion/react-inputs';
import { Checkbox, Button, Variant } from '@syncfusion/react-buttons';
import { DatePicker, TimePicker } from '@syncfusion/react-calendars';
import { useScheduleLocalization } from '../../common/locale';
import { useProviderContext } from '@syncfusion/react-base';
import { UseEditorPopupResult } from '../../hooks/useEditorPopup';
import { useSchedulePropsContext } from '../../context/schedule-context';
import { EventModel } from '../../types/schedule-types';
import { EventService } from '../../services/EventService';
import { DateService } from '../../services/DateService';
import { CSS_CLASSES } from '../../common/constants';

export interface EditorPopupProps {
    open: boolean;
    onClose: () => void;
    editor: UseEditorPopupResult;
}

export const EditorPopup: FC<EditorPopupProps> = ({ open, onClose, editor }: EditorPopupProps) => {
    const { locale } = useProviderContext();
    const { getString } = useScheduleLocalization(locale || 'en-US');
    const { scheduleRef, eventSettings } = useSchedulePropsContext();

    const {
        subject,
        location,
        description,
        isAllDay,
        mode,
        originalData,
        startTime,
        endTime,
        startDateOnly,
        startTimeOnly,
        endDateOnly,
        endTimeOnly,
        slotDuration,
        handleSubjectChange,
        handleLocationChange,
        handleDescriptionChange,
        handleStartDateChange,
        handleStartTimeChange,
        handleEndDateChange,
        handleEndTimeChange,
        handleIsAllDayChange
    } = editor;

    const handleSave: () => void = useCallback((): void => {
        let computedStart: Date | undefined;
        let computedEnd: Date | undefined;

        if (isAllDay) {
            const sDate: Date = startDateOnly ? DateService.normalizeDate(startDateOnly) : undefined;
            const eDate: Date = endDateOnly ? DateService.normalizeDate(endDateOnly) : sDate;
            computedStart = sDate;
            computedEnd = eDate;
        } else {
            const combine: (date?: Date, time?: Date) => Date = (date?: Date, time?: Date): Date =>
                DateService.combineDateAndTime(date, time);
            computedStart = combine(startDateOnly, startTimeOnly) ?? startTime;
            computedEnd = combine(endDateOnly, endTimeOnly) ?? endTime;
            if (computedStart && computedEnd && computedEnd <= computedStart) {
                const adjusted: Date = new Date(computedStart);
                adjusted.setMinutes(adjusted.getMinutes() + slotDuration);
                computedEnd = adjusted;
            }
        }

        const baseData: EventModel = {
            [eventSettings.fields.subject]: subject || getString('newEvent'),
            [eventSettings.fields.startTime]: computedStart,
            [eventSettings.fields.endTime]: computedEnd,
            [eventSettings.fields.isAllDay]: !!isAllDay,
            [eventSettings.fields.location]: location,
            [eventSettings.fields.description]: description
        };

        if (mode === 'event' && originalData) {
            const INTERNAL_KEYS: Set<string> = new Set([
                'id', 'subject', 'startTime', 'endTime', 'isAllDay', 'location', 'description', 'isReadonly', 'isBlock'
            ]);
            const mappedFieldKeys: Set<string> = new Set(
                Object.values(eventSettings?.fields).filter((k: string) => k !== eventSettings?.fields?.id) as string[]
            );
            const preservedExtras: Record<string, unknown> = Object.fromEntries(
                Object.entries(originalData as Record<string, unknown>).filter(
                    ([k]: [string, unknown]) => !INTERNAL_KEYS.has(k) && !mappedFieldKeys.has(k)
                )
            );

            const eventData: EventModel = {
                ...preservedExtras,
                ...baseData,
                [eventSettings.fields.id]: originalData.id
            } as unknown as EventModel;
            scheduleRef?.current?.saveEvent?.(eventData);
        } else {
            const eventData: EventModel = {
                ...baseData,
                [eventSettings.fields.id]: EventService.generateEventGuid()
            };
            scheduleRef?.current?.addEvent?.(eventData);
        }
        onClose();
    }, [ isAllDay, startDateOnly, endDateOnly, startTimeOnly, endTimeOnly,
        startTime, endTime, slotDuration, eventSettings, subject,
        location, description, mode, originalData, scheduleRef, onClose]);

    const handleCancel: () => void = useCallback((): void => onClose(), [onClose]);

    return (
        <Dialog
            header={getString('newEvent')}
            open={open}
            onClose={onClose}
            modal={true}
            style={{ width: '500px', minHeight: '300px' }}
            className={`${CSS_CLASSES.DIALOG} ${CSS_CLASSES.DIALOG_CONTAINER}`}
            footer={
                <>
                    <Button variant={Variant.Standard} onClick={handleSave}>{getString('save')}</Button>
                    <Button variant={Variant.Standard} onClick={handleCancel}>{getString('cancel')}</Button>
                </>
            }
        >
            <div className={CSS_CLASSES.FORM_CONTAINER}>
                <Form rules={{}}>
                    <div className={`${CSS_CLASSES.DIALOG_CONTENT} ${CSS_CLASSES.DISPLAY_FLEX}`}>
                        <div className={`${CSS_CLASSES.TITLE_LOCATION_ROW} ${CSS_CLASSES.DISPLAY_FLEX} ${CSS_CLASSES.EDITOR_FIELDS_ROW}`}>
                            <div className={`${CSS_CLASSES.SUBJECT_CONTAINER} ${CSS_CLASSES.EDITOR_FIELD_CONTAINER}`}>
                                <FormField name="subject">
                                    <TextBox
                                        placeholder={getString('title')}
                                        value={subject || ''}
                                        onChange={handleSubjectChange}
                                        className={CSS_CLASSES.EVENT_SUBJECT}
                                        labelMode="Always"
                                    />
                                </FormField>
                            </div>
                            <div className={`${CSS_CLASSES.LOCATION_CONTAINER} ${CSS_CLASSES.EDITOR_FIELD_CONTAINER}`}>
                                <FormField name="location">
                                    <TextBox
                                        placeholder={getString('location')}
                                        value={location || ''}
                                        onChange={handleLocationChange}
                                        className={CSS_CLASSES.EVENT_LOCATION}
                                        labelMode="Always"
                                    />
                                </FormField>
                            </div>
                        </div>
                        <div className={`${CSS_CLASSES.START_ROW} ${CSS_CLASSES.DISPLAY_FLEX} ${CSS_CLASSES.EDITOR_FIELDS_ROW}`}>
                            <div className={`${CSS_CLASSES.START_DATE_CONTAINER} ${CSS_CLASSES.EDITOR_FIELD_CONTAINER}`}>
                                <FormField name="startDate">
                                    <DatePicker
                                        placeholder={getString('startDate')}
                                        className={CSS_CLASSES.EVENT_START_DATE}
                                        labelMode="Always"
                                        value={startDateOnly}
                                        onChange={handleStartDateChange}
                                    />
                                </FormField>
                            </div>
                            {!isAllDay && (
                                <div className={`${CSS_CLASSES.START_TIME_CONTAINER} ${CSS_CLASSES.EDITOR_FIELD_CONTAINER}`}>
                                    <FormField name="startTime">
                                        <TimePicker
                                            className={CSS_CLASSES.EVENT_START_TIME}
                                            placeholder={getString('startTime')}
                                            labelMode="Always"
                                            step={slotDuration}
                                            value={startTimeOnly}
                                            onChange={handleStartTimeChange}
                                        />
                                    </FormField>
                                </div>
                            )}
                        </div>
                        <div className={`${CSS_CLASSES.END_ROW} ${CSS_CLASSES.DISPLAY_FLEX} ${CSS_CLASSES.EDITOR_FIELDS_ROW}`}>
                            <div className={`${CSS_CLASSES.END_DATE_CONTAINER} ${CSS_CLASSES.EDITOR_FIELD_CONTAINER}`}>
                                <FormField name="endDate">
                                    <DatePicker
                                        placeholder={getString('endDate')}
                                        className={CSS_CLASSES.EVENT_END_DATE}
                                        labelMode="Always"
                                        value={endDateOnly}
                                        onChange={handleEndDateChange}
                                    />
                                </FormField>
                            </div>
                            {!isAllDay && (
                                <div className={`${CSS_CLASSES.END_TIME_CONTAINER} ${CSS_CLASSES.EDITOR_FIELD_CONTAINER}`}>
                                    <FormField name="endTime">
                                        <TimePicker
                                            className={CSS_CLASSES.EVENT_END_TIME}
                                            placeholder={getString('endTime')}
                                            labelMode="Always"
                                            step={slotDuration}
                                            value={endTimeOnly}
                                            onChange={handleEndTimeChange}
                                        />
                                    </FormField>
                                </div>
                            )}
                        </div>
                        <div className={`${CSS_CLASSES.ALL_DAY_TIMEZONE_ROW} ${CSS_CLASSES.DISPLAY_FLEX}`}>
                            <div className={`${CSS_CLASSES.ALL_DAY_CONTAINER}`}>
                                <FormField name="allDay">
                                    <Checkbox
                                        label={getString('allDay')}
                                        className={CSS_CLASSES.EVENT_ALLDAY}
                                        checked={isAllDay}
                                        onChange={handleIsAllDayChange}
                                    />
                                </FormField>
                            </div>
                        </div>
                        <div className={CSS_CLASSES.DESCRIPTION_ROW}>
                            <div className={CSS_CLASSES.DESCRIPTION_CONTAINER}>
                                <FormField name="description">
                                    <TextArea
                                        placeholder={getString('description')}
                                        className={CSS_CLASSES.EVENT_DESCRIPTION}
                                        labelMode='Always'
                                        value={description}
                                        width={'100%'}
                                        onChange={handleDescriptionChange}
                                    />
                                </FormField>
                            </div>
                        </div>
                    </div>
                </Form>
            </div>
        </Dialog>
    );
};

export default EditorPopup;
