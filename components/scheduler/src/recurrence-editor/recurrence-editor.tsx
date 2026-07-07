import { ReactNode, useCallback, useEffect, memo, useId } from 'react';
import { Color, useProviderContext, Variant } from '@syncfusion/react-base';
import { NumericTextBox } from '@syncfusion/react-inputs';
import { DropDownList } from '@syncfusion/react-dropdowns';
import { Button, RadioButton } from '@syncfusion/react-buttons';
import { DatePicker } from '@syncfusion/react-calendars';
import { Dialog } from '@syncfusion/react-popups';
import { CSS_CLASSES } from './constants';
import { useRecurrenceEditorLocalization } from './locale';
import { RecurrenceItems, RecurrenceEditorProps } from './types';
import { useRecurrenceEditor } from './useRecurrenceEditor';

export const RecurrenceEditor: React.FC<RecurrenceEditorProps> = (props: RecurrenceEditorProps) => {
    const { locale, dir } = useProviderContext();
    const { getString } = useRecurrenceEditorLocalization(locale || 'en-US');
    const recurrenceRadioButtonId: string = useId();
    const {
        value,
        onChange,
        frequencies = ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'],
        endTypes = ['Never', 'Until', 'Count'],
        startDate = new Date(),
        firstDayOfWeek = 0
    } = props;

    const {
        freq,
        endType,
        interval,
        count,
        month,
        weekDay,
        monthDate,
        dayWeekMode,
        weekNumber,
        weekDays,
        until,
        maxDate,
        monthDataSource,
        monthPosDataSource,
        freqDataSource,
        endDataSource,
        dayDataSource,
        weekDayDataSource,
        handlers,
        buildRecurrenceRule,
        alertDialogOpen,
        setAlertDialogOpen
    } = useRecurrenceEditor(value, startDate, frequencies, endTypes, firstDayOfWeek);

    useEffect(() => {
        if (!onChange) {
            return;
        }
        const newRule: string = buildRecurrenceRule();
        if (newRule !== value) {
            onChange({ value: newRule });
        }
    }, [
        onChange, value, buildRecurrenceRule
    ]);

    const renderRepeatEveryField: ReactNode = (
        <div className={`${CSS_CLASSES.RECURRENCE_EDITOR_ROW} ${CSS_CLASSES.RECURRENCE_EDITOR_ALIGN_END}`}>
            <div className={`${CSS_CLASSES.RECURRENCE_EDITOR_WIDTH_50}`}>
                <NumericTextBox
                    placeholder={getString('repeatEvery')}
                    className={CSS_CLASSES.REPEAT_EVERY}
                    labelMode="Always"
                    min={1}
                    value={interval}
                    onChange={handlers.onIntervalChange}
                    aria-label={getString('intervalAriaLabel')}
                />
            </div>
            <div className={`${CSS_CLASSES.RECURRENCE_EDITOR_WIDTH_50}`}>
                <DropDownList
                    dataSource={freqDataSource}
                    value={freq}
                    fields={{ text: 'text', value: 'value' }}
                    className={CSS_CLASSES.REPEAT_MODE}
                    aria-label={getString('frequencyAriaLabel')}
                    onChange={handlers.onFreqChange}
                />
            </div>
        </div>
    );

    const renderWeekDayButtons: () => ReactNode = useCallback((): ReactNode => {
        return (
            <div className={`${CSS_CLASSES.REPEAT_ON_WEEK_CONTAINER}`}>
                <label className={`${CSS_CLASSES.FORM_LABEL}`}>
                    {getString('repeatOn')}
                </label>
                <div className={`${CSS_CLASSES.REPEAT_WEEK_BUTTON_CONTAINER}`}>
                    {weekDayDataSource.map((day: RecurrenceItems) => (
                        <Button
                            key={day.value}
                            className={CSS_CLASSES.WEEK_BUTTON}
                            variant={weekDays.includes(day.value) ? Variant.Filled : Variant.Outlined}
                            onClick={() => handlers.onToggleSelectedWeekDay(day.value)}
                            color={weekDays.includes(day.value) ? Color.Primary : Color.Secondary}
                            toggleable={weekDays.includes(day.value)}
                            aria-label={day.text}
                        >
                            {day.text}
                        </Button>
                    ))}
                </div>
            </div>
        );
    }, [freq, getString, weekDayDataSource, weekDays]);

    const renderYearMonthField: () => ReactNode = (): ReactNode => {
        return (
            <div className={`${CSS_CLASSES.RECURRENCE_EDITOR_WIDTH_100}`}>
                <DropDownList
                    dataSource={monthDataSource}
                    value={month}
                    fields={{ text: 'text', value: 'value' }}
                    placeholder={getString('repeatOn')}
                    labelMode="Always"
                    onChange={handlers.onMonthChange}
                    className={CSS_CLASSES.REPEAT_MONTH}
                    aria-label={getString('byMonthAriaLabel')}
                />
            </div>
        );
    };

    const renderMonthYearDayField: () => ReactNode = (): ReactNode => {
        if (!(freq === 'MONTHLY' || freq === 'YEARLY')) {
            return null;
        }

        return (
            <div className={`${CSS_CLASSES.RECURRENCE_EDITOR_MONTH_YEAR_ROW}`}>
                {freq === 'MONTHLY' && (
                    <div className={CSS_CLASSES.RECURRENCE_EDITOR_ROW}>
                        <label className={CSS_CLASSES.FORM_LABEL}>
                            {getString('repeatOn')}
                        </label>
                    </div>
                )}
                <div className={`${CSS_CLASSES.REPEAT_MONTH_DAY_ROW}`}>
                    <div className={`${CSS_CLASSES.DISPLAY_FLEX} ${CSS_CLASSES.DAY_RADIO_BUTTON}`}>
                        <RadioButton
                            id={`${recurrenceRadioButtonId}-repeatByDay`}
                            label={getString('day')}
                            labelPlacement="After"
                            name={`${recurrenceRadioButtonId}-repeatBy`}
                            value="day"
                            checked={dayWeekMode === 'day'}
                            onChange={handlers.onDayWeekChange}
                            aria-label={getString('repeatOn')}
                        />
                    </div>
                    <div className={`${CSS_CLASSES.REPEAT_YEAR_DAY_NUMBER_CONTAINER}`}>
                        <NumericTextBox
                            value={monthDate}
                            min={1}
                            max={maxDate ?? undefined}
                            className={CSS_CLASSES.BY_MONTH_DAY}
                            aria-label={getString('byMonthDayAriaLabel')}
                            onChange={handlers.onMonthDateChange}
                        />
                    </div>
                </div>
            </div>
        );
    };

    const renderWeekNumberDayMode: () => ReactNode = (): ReactNode => {
        if (!(freq === 'MONTHLY' || freq === 'YEARLY')) {
            return null;
        }

        return (
            <div className={`${CSS_CLASSES.WEEK_NUMBER_DAY_MODE_ROW}`}>
                <div className={`${CSS_CLASSES.DISPLAY_FLEX}`}>
                    <RadioButton
                        id={`${recurrenceRadioButtonId}-repeatByWeek`}
                        name={`${recurrenceRadioButtonId}-repeatBy`}
                        className={CSS_CLASSES.WEEK_RADIO_BUTTON}
                        checked={dayWeekMode === 'week'}
                        value="week"
                        aria-label={getString('repeatOn')}
                        labelPlacement="After"
                        onChange={handlers.onDayWeekChange}
                    />
                </div>
                <div className={`${CSS_CLASSES.WEEK_NUMBER_CONTAINER}`}>
                    <DropDownList
                        dataSource={monthPosDataSource}
                        value={weekNumber}
                        fields={{ text: 'text', value: 'value' }}
                        aria-label={getString('bySetPositionAriaLabel')}
                        onChange={handlers.onWeekNumber}
                        className={CSS_CLASSES.BY_SET_POSITION}
                    />
                </div>
                <div className={`${CSS_CLASSES.RECURRENCE_EDITOR_WIDTH_50}`}>
                    <DropDownList
                        dataSource={dayDataSource}
                        value={weekDay}
                        fields={{ text: 'text', value: 'value' }}
                        aria-label={getString('byDayAriaLabel')}
                        onChange={handlers.onWeekDayChange}
                        className={CSS_CLASSES.REPEAT_BY_DAY_DROPDOWN}
                    />
                </div>
            </div>
        );
    };

    const renderEndFields: () => ReactNode = (): ReactNode => (
        <div className={`${CSS_CLASSES.RECURRENCE_EDITOR_ROW} ${CSS_CLASSES.RECURRENCE_EDITOR_ALIGN_END}`}>
            <div className={`${CSS_CLASSES.RECURRENCE_EDITOR_WIDTH_50}`}>
                <DropDownList
                    dataSource={endDataSource}
                    value={endType}
                    fields={{ text: 'text', value: 'value' }}
                    placeholder={getString('end')}
                    className={CSS_CLASSES.REPEAT_END_DAY_WEEK}
                    labelMode="Always"
                    onChange={handlers.onEndTypeChange}
                    aria-label={getString('endTypeAriaLabel')}
                />
            </div>

            {endType === 'Count' && (
                <div className={`${CSS_CLASSES.RECURRENCE_EDITOR_WIDTH_50}`}>
                    <NumericTextBox
                        className={CSS_CLASSES.REPEAT_COUNT}
                        value={count}
                        min={1}
                        aria-label={getString('countAriaLabel')}
                        onChange={handlers.onCountChange}
                    />
                </div>
            )}

            {endType === 'Until' && (
                <div className={`${CSS_CLASSES.RECURRENCE_EDITOR_WIDTH_50}`}>
                    <DatePicker
                        className={CSS_CLASSES.REPEAT_UNTIL}
                        value={until}
                        format={'MM/dd/yyyy'}
                        aria-label={getString('untilAriaLabel')}
                        onChange={handlers.onUntilChange}
                    />
                </div>
            )}
        </div>
    );

    return (
        <div className={`${CSS_CLASSES.CONTROL} ${CSS_CLASSES.RECURRENCE_EDITOR} ${CSS_CLASSES.RECURRENCE_EDITOR_CONTENT} ${dir === 'rtl' ? CSS_CLASSES.RTL : ''}`}>
            {renderRepeatEveryField}

            {freq === 'WEEKLY' && renderWeekDayButtons()}

            {freq === 'YEARLY' && renderYearMonthField()}

            {(freq === 'MONTHLY' || freq === 'YEARLY') && renderMonthYearDayField()}

            {(freq === 'MONTHLY' || freq === 'YEARLY') && renderWeekNumberDayMode()}

            {renderEndFields()}

            {alertDialogOpen && (
                <Dialog
                    header={getString('alert')}
                    open={alertDialogOpen}
                    onClose={() => setAlertDialogOpen(false)}
                    footer={
                        <Button onClick={() => setAlertDialogOpen(false)} variant={Variant.Standard}>
                            {getString('ok')}
                        </Button>
                    }
                >
                    <div>{getString('untilEarlierThanStart')}</div>
                </Dialog>
            )}
        </div>
    );
};

export default memo(RecurrenceEditor);
