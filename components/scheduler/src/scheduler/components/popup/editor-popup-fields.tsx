import { FC, JSX, ReactNode, useCallback, useEffect, useMemo } from 'react';
import { isNullOrUndefined, useProviderContext } from '@syncfusion/react-base';
import { TextBox, FormField, TextArea, ResizeMode, ValidationRules, Form, TextBoxChangeEvent, TextAreaChangeEvent, FormInitialValues, FormValueType } from '@syncfusion/react-inputs';
import { Checkbox, CheckboxChangeEvent } from '@syncfusion/react-buttons';
import { DatePicker, DatePickerChangeEvent, TimePicker, TimePickerChangeEvent } from '@syncfusion/react-calendars';
import { ChangeEvent } from '@syncfusion/react-dropdowns';
import { SchedulerEditorField, TimezoneFields, SchedulerResource } from '../../types/scheduler-types';
import { useSchedulerLocalization } from '../../common/locale';
import { useSchedulerPropsContext } from '../../context/scheduler-context';
import { CSS_CLASSES } from '../../common/constants';
import { useEditorContext } from '../../context/scheduler-editor-popup-context';
import { DropDownList, MultiSelect } from '@syncfusion/react-dropdowns';
import { useExtractResourceValuesFromGroupIndex } from '../../hooks/useResourceGrouping';
import { Timezone } from '../../services/Timezone';

/**
 * EditorPopupFields renders the form fields for the scheduler popup.
 *
 * @param fields Optional custom field configuration.
 */
interface EditorPopupFieldsProps {
    fields?: SchedulerEditorField[];
}

const DEFAULT_FIELD_CONFIG: SchedulerEditorField[] = [
    { name: 'subject', visible: true, className: CSS_CLASSES.SUBJECT_CONTAINER },
    { name: 'location', visible: true, className: CSS_CLASSES.LOCATION_CONTAINER },
    { name: 'startDate', visible: true, className: CSS_CLASSES.START_DATE_CONTAINER },
    { name: 'startTime', visible: true, className: CSS_CLASSES.START_TIME_CONTAINER },
    { name: 'endDate', visible: true, className: CSS_CLASSES.END_DATE_CONTAINER },
    { name: 'endTime', visible: true, className: CSS_CLASSES.END_TIME_CONTAINER },
    { name: 'isAllDay', visible: true, className: CSS_CLASSES.ALL_DAY_CONTAINER },
    { name: 'startTimezone', visible: true, className: CSS_CLASSES.START_TIMEZONE_CONTAINER },
    { name: 'endTimezone', visible: true, className: CSS_CLASSES.END_TIMEZONE_CONTAINER },
    { name: 'resource', visible: true, className: CSS_CLASSES.RESOURCE_CONTAINER },
    { name: 'description', visible: true, className: CSS_CLASSES.DESCRIPTION_CONTAINER },
    { name: 'repeatMode', visible: true, className: CSS_CLASSES.REPEAT_MODE}
];

const DEFAULT_ROW_GROUPS: string[][] = [
    ['subject', 'location'],
    ['startDate', 'startTime'],
    ['endDate', 'endTime'],
    ['isAllDay', 'timezone'],
    ['startTimezone', 'endTimezone'],
    ['repeatMode'],
    ['resource'],
    ['description']
];

export const EditorPopupFields: FC<EditorPopupFieldsProps> = ({ fields }: EditorPopupFieldsProps) => {
    const { locale } = useProviderContext();
    const { getString } = useSchedulerLocalization(locale || 'en-US');
    const { dateFormat, timeFormat, timeScale, timezone, timezoneDataSource, resources, group } = useSchedulerPropsContext();

    const {
        data,
        startDateOnly,
        startTimeOnly,
        endDateOnly,
        endTimeOnly,
        slotDuration,
        repeatData,
        repeatModeValue,
        formState,
        formRef,
        setFormState,
        handleSubjectChange,
        handleLocationChange,
        handleDescriptionChange,
        handleStartDateChange,
        handleStartTimeChange,
        handleEndDateChange,
        handleEndTimeChange,
        handleIsAllDayChange,
        handleRepeatModeChange,
        handleStartTimezoneChange,
        handleEndTimezoneChange,
        handleUseTimezoneChange,
        setSlotDuration,
        action,
        resourceValues,
        setResourceValues,
        handleResourceChange,
        currentCellGroupIndex
    } = useEditorContext();

    useExtractResourceValuesFromGroupIndex(currentCellGroupIndex, setResourceValues, action);

    const getFilteredResourceData: (resourceIndex: number) => Record<string, unknown>[] = useCallback((resourceIndex: number) => {
        if (!resources || resourceIndex >= resources.length) {
            return [];
        }
        const resource: SchedulerResource = resources[parseInt(resourceIndex.toString(), 10)];
        if (!resource.dataSource || !Array.isArray(resource.dataSource)) {
            return [];
        }
        if (resourceIndex > 0 && group?.byGroupID) {
            const parentResource: SchedulerResource = resources[resourceIndex - 1];
            const parentFieldName: string = parentResource.field;
            const parentValue: string | number | (string | number)[] = resourceValues[`${parentFieldName}`];

            if (!isNullOrUndefined(parentValue) && resource.groupIDField) {
                const parentValues: (string | number)[] = Array.isArray(parentValue) ? parentValue : [parentValue];
                return (resource.dataSource as Record<string, unknown>[]).filter(
                    (item: Record<string, unknown>) => {
                        const itemGroupId: string | number = item[resource.groupIDField] as string | number;
                        return parentValues.includes(itemGroupId);
                    }
                );
            }
        }
        return resource.dataSource as Record<string, unknown>[];
    }, [resources, resourceValues]);

    const validationRules: ValidationRules = useMemo(() => {
        if (!fields) { return {}; }
        return fields.reduce((acc: ValidationRules, field: SchedulerEditorField) => {
            if (field.validationRule) {
                acc[field.name] = field.validationRule;
            }
            return acc;
        }, {} as ValidationRules);
    }, [fields]);

    const initialFormValues: FormInitialValues = useMemo(() => {
        const values: Record<string, FormValueType> = {};

        if (data?.subject) { values.subject = data.subject; }
        if (data?.location) { values.location = data.location; }
        if (data?.description) { values.description = data.description; }
        if (startDateOnly) { values.startDate = startDateOnly; }
        if (startTimeOnly) { values.startTime = startTimeOnly; }
        if (endDateOnly) { values.endDate = endDateOnly; }
        if (endTimeOnly) { values.endTime = endTimeOnly; }
        if (data?.isAllDay !== undefined) { values.isAllDay = data.isAllDay; }
        if (data?.startTimezone) { values.startTimezone = data.startTimezone; }
        if (data?.endTimezone) { values.endTimezone = data.endTimezone; }
        return values;
    }, [data, startDateOnly, startTimeOnly, endDateOnly, endTimeOnly]);

    const computedSlotDuration: number = useMemo(() => {
        return timeScale?.interval / timeScale?.slotCount || 30;
    }, [timeScale]);

    const getDropDownOption: (currentTimeZone: string) => { options: TimezoneFields[]; current?: string } =
        (currentTimeZone: string) => {
            const tzData: TimezoneFields[] = timezoneDataSource;
            let current: string;
            if (currentTimeZone === 'start') {
                current = (formState?.values?.startTimezone as string) ?? data?.startTimezone;
            } else if (currentTimeZone === 'end') {
                current = (formState?.values?.endTimezone as string) ?? data?.endTimezone;
            }

            current = current ?? timezone ?? Timezone.getLocalTimezoneName();
            const exists: boolean = tzData.some((o: TimezoneFields) => o && (o.value === current || o.text === current));
            if (exists) {
                return { options: tzData, current };
            }

            return { options: [{ text: current, value: current }, ...tzData], current };
        };

    useEffect(() => {
        setSlotDuration?.(computedSlotDuration);
    }, [computedSlotDuration]);

    const getSubjectField: (overrides?: Partial<SchedulerEditorField>) => JSX.Element =
        useCallback((overrides: Partial<SchedulerEditorField> = {}) => {
            const extraProps: Record<string, any> = overrides.props ?? {};
            return (
                <FormField name="subject">
                    <TextBox
                        placeholder={extraProps.placeholder ?? getString('title')}
                        value={extraProps.value ?? (formState?.values.subject as string || data?.subject)}
                        onChange={(args: TextBoxChangeEvent) => {
                            formState?.onChange('subject', { value: args.value || '' });
                            (extraProps.onChange ?? handleSubjectChange)?.(args);
                        }}
                        onBlur={() => formState?.onBlur('subject')}
                        className={`${extraProps.className ?? CSS_CLASSES.EVENT_SUBJECT} ${formState?.errors.subject ? 'sf-error' : ''}`}
                        labelMode={extraProps.labelMode ?? 'Always'}
                        {...extraProps}
                    />
                    {formState?.errors?.subject && <div className="sf-form-error">{formState.errors.subject}</div>}
                </FormField>
            );
        }, [formState, data?.subject, handleSubjectChange]);

    const getLocationField: (overrides?: Partial<SchedulerEditorField>) => JSX.Element =
        useCallback((overrides: Partial<SchedulerEditorField> = {}) => {
            const extraProps: Record<string, any> = overrides.props ?? {};
            return (
                <FormField name="location">
                    <TextBox
                        placeholder={extraProps.placeholder ?? getString('location')}
                        value={extraProps.value ?? (formState?.values.location as string || data?.location)}
                        onChange={(args: TextBoxChangeEvent) => {
                            formState?.onChange('location', { value: args.value || '' });
                            (extraProps.onChange ?? handleLocationChange)?.(args);
                        }}
                        onBlur={() => formState?.onBlur('location')}
                        className={`${extraProps.className ?? CSS_CLASSES.EVENT_LOCATION} ${formState?.errors.location ? 'sf-error' : ''}`}
                        labelMode={extraProps.labelMode ?? 'Always'}
                        {...extraProps}
                    />
                    {formState?.errors?.location && <div className="sf-form-error">{formState.errors.location}</div>}
                </FormField>
            );
        }, [formState, data?.location, handleLocationChange]);

    const getStartDateField: (overrides?: Partial<SchedulerEditorField>) => JSX.Element =
        useCallback((overrides: Partial<SchedulerEditorField> = {}) => {
            const extraProps: Record<string, any> = overrides.props ?? {};
            return (
                <FormField name="startDate">
                    <DatePicker
                        placeholder={extraProps.placeholder ?? getString('startDate')}
                        className={`${extraProps.className ?? CSS_CLASSES.EVENT_START_DATE} ${formState?.errors.startDate ? 'sf-error' : ''}`}
                        labelMode={extraProps.labelMode ?? 'Always'}
                        value={extraProps.value || (formState?.values.startDate as Date || startDateOnly)}
                        format={extraProps.format ?? dateFormat}
                        onChange={(args: DatePickerChangeEvent) => {
                            formState?.onChange('startDate', { value: args.value });
                            (extraProps.onChange ?? handleStartDateChange)?.(args);
                        }}
                        onBlur={() => formState?.onBlur('startDate')}
                        strictMode={extraProps.strictMode ?? true}
                        {...extraProps}
                    />
                    {formState?.errors?.startDate && <div className="sf-form-error">{formState.errors.startDate}</div>}
                </FormField>
            );
        }, [formState, startDateOnly, handleStartDateChange]);

    const getStartTimeField: (overrides?: Partial<SchedulerEditorField>) => JSX.Element =
        useCallback((overrides: Partial<SchedulerEditorField> = {}) => {
            const extraProps: Record<string, any> = overrides.props ?? {};
            return (
                <FormField name="startTime">
                    <TimePicker
                        placeholder={extraProps.placeholder ?? getString('startTime')}
                        className={`${extraProps.className ?? CSS_CLASSES.EVENT_START_TIME} ${formState?.errors.startTime ? 'sf-error' : ''}`}
                        labelMode={extraProps.labelMode ?? 'Always'}
                        step={extraProps.step ?? slotDuration}
                        value={extraProps.value ?? (formState?.values.startTime as Date || startTimeOnly)}
                        format={extraProps.format ?? timeFormat}
                        onChange={(args: TimePickerChangeEvent) => {
                            formState?.onChange('startTime', { value: args.value });
                            (extraProps.onChange ?? handleStartTimeChange)?.(args);
                        }}
                        onBlur={() => formState?.onBlur('startTime')}
                        strictMode={extraProps.strictMode ?? true}
                        {...extraProps}
                    />
                    {formState?.errors?.startTime && <div className="sf-form-error">{formState.errors.startTime}</div>}
                </FormField>
            );
        }, [formState, startTimeOnly, handleStartTimeChange]);

    const getEndDateField: (overrides?: Partial<SchedulerEditorField>) => JSX.Element =
        useCallback((overrides: Partial<SchedulerEditorField> = {}) => {
            const extraProps: Record<string, any> = overrides.props ?? {};
            return (
                <FormField name="endDate">
                    <DatePicker
                        placeholder={extraProps.placeholder ?? getString('endDate')}
                        className={`${extraProps.className ?? CSS_CLASSES.EVENT_END_DATE} ${formState?.errors.endDate ? 'sf-error' : ''}`}
                        labelMode={extraProps.labelMode ?? 'Always'}
                        value={extraProps.value ?? (formState?.values.endDate as Date || endDateOnly)}
                        format={extraProps.format ?? dateFormat}
                        onChange={(args: DatePickerChangeEvent) => {
                            formState?.onChange('endDate', { value: args.value });
                            (extraProps.onChange ?? handleEndDateChange)?.(args);
                        }}
                        onBlur={() => formState?.onBlur('endDate')}
                        strictMode={extraProps.strictMode ?? true}
                        {...extraProps}
                    />
                    {formState?.errors?.endDate && <div className="sf-form-error">{formState.errors.endDate}</div>}
                </FormField>
            );
        }, [formState, endDateOnly, handleEndDateChange]);

    const getEndTimeField: (overrides?: Partial<SchedulerEditorField>) => JSX.Element =
        useCallback((overrides: Partial<SchedulerEditorField> = {}) => {
            const extraProps: Record<string, any> = overrides.props ?? {};
            return (
                <FormField name="endTime">
                    <TimePicker
                        placeholder={extraProps.placeholder ?? getString('endTime')}
                        className={`${extraProps.className ?? CSS_CLASSES.EVENT_END_TIME} ${formState?.errors.endTime ? 'sf-error' : ''}`}
                        labelMode={extraProps.labelMode ?? 'Always'}
                        step={extraProps.step ?? slotDuration}
                        value={extraProps.value ?? (formState?.values.endTime as Date || endTimeOnly)}
                        format={extraProps.format ?? timeFormat}
                        onChange={(args: TimePickerChangeEvent) => {
                            formState?.onChange('endTime', { value: args.value });
                            (extraProps.onChange ?? handleEndTimeChange)?.(args);
                        }}
                        onBlur={() => formState?.onBlur('endTime')}
                        strictMode={extraProps.strictMode ?? true}
                        {...extraProps}
                    />
                    {formState?.errors?.endTime && <div className="sf-form-error">{formState.errors.endTime}</div>}
                </FormField>
            );
        }, [formState, endTimeOnly, handleEndTimeChange]);

    const getAllDayField: (overrides?: Partial<SchedulerEditorField>) => JSX.Element =
        useCallback((overrides: Partial<SchedulerEditorField> = {}) => {
            const extraProps: Record<string, any> = overrides.props ?? {};
            return (
                <FormField name="isAllDay">
                    <Checkbox
                        label={extraProps.label ?? getString('allDay')}
                        className={`${extraProps.className ?? CSS_CLASSES.EVENT_ALLDAY} ${formState?.errors.isAllDay ? 'sf-error' : ''}`}
                        checked={extraProps.checked ?? (formState?.values.isAllDay as boolean ?? data?.isAllDay)}
                        onChange={(args: CheckboxChangeEvent) => {
                            formState?.onChange('isAllDay', { value: args.value });
                            (extraProps.onChange ?? handleIsAllDayChange)?.(args);
                        }}
                        {...extraProps}
                    />
                    {formState?.modified?.isAllDay && formState?.errors?.isAllDay && <div className="sf-form-error">{formState.errors.isAllDay}</div>}
                </FormField>
            );
        }, [formState, data?.isAllDay, handleIsAllDayChange]);

    const getUseTimezone: () => boolean = useCallback((): boolean => {
        return formState?.values?.useTimezone !== undefined
            ? Boolean(formState?.values?.useTimezone)
            : Boolean(data?.startTimezone || data?.endTimezone);
    }, [formState?.values?.useTimezone, data?.startTimezone, data?.endTimezone]);

    const showTimezoneControls: boolean = getUseTimezone();

    const getUseTimezoneField: (overrides?: Partial<SchedulerEditorField>) => JSX.Element =
        useCallback((overrides: Partial<SchedulerEditorField> = {}) => {
            const extraProps: Record<string, any> = overrides.props ?? {};
            if (data?.isAllDay) { return null; }
            return (
                <FormField name="useTimezone">
                    <Checkbox
                        label={extraProps.label ?? getString('timezone')}
                        className={`${extraProps.className ?? CSS_CLASSES.TIMEZONE} ${formState?.errors?.useTimezone ? 'sf-error' : ''}`}
                        checked={extraProps.checked ?? showTimezoneControls}
                        onChange={(args: CheckboxChangeEvent) => {
                            formState?.onChange('useTimezone', { value: args.value });
                            (extraProps.onChange ?? handleUseTimezoneChange)?.(args);
                            if (!args.value) {
                                formState?.onChange('startTimezone', { value: undefined });
                                formState?.onChange('endTimezone', { value: undefined });
                                (extraProps.onChange ?? handleStartTimezoneChange)?.({ value: undefined } as ChangeEvent);
                                (extraProps.onChange ?? handleEndTimezoneChange)?.({ value: undefined } as ChangeEvent);
                            } else {
                                const defaultStart: string = (formState?.values?.startTimezone as string)
                                    ?? data?.startTimezone ?? timezone ?? Timezone.getLocalTimezoneName();
                                const defaultEnd: string = (formState?.values?.endTimezone as string)
                                    ?? data?.endTimezone ?? timezone ?? Timezone.getLocalTimezoneName();
                                formState?.onChange('startTimezone', { value: defaultStart });
                                formState?.onChange('endTimezone', { value: defaultEnd });
                                (extraProps.onChange ?? handleStartTimezoneChange)?.({ value: defaultStart } as ChangeEvent);
                                (extraProps.onChange ?? handleEndTimezoneChange)?.({ value: defaultEnd } as ChangeEvent);
                            }
                        }}
                        {...extraProps}
                    />
                </FormField>
            );
        }, [formState, data?.isAllDay, data?.startTimezone, data?.endTimezone, handleUseTimezoneChange,
            handleStartTimezoneChange, handleEndTimezoneChange, getString, timezone]);

    const getRepeatModeField: (overrides?: Partial<SchedulerEditorField>) => JSX.Element = useCallback((
        overrides: Partial<SchedulerEditorField> = {}) => {
        const extraProps: Record<string, any> = overrides.props ?? {};
        return (
            <FormField name='repeatMode'>
                <DropDownList
                    dataSource={repeatData}
                    fields={{ text: 'text', value: 'value' }}
                    value={extraProps.value ?? repeatModeValue}
                    placeholder={extraProps.placeholder ?? getString('repeat')}
                    labelMode='Always'
                    onChange={extraProps.onChange ?? handleRepeatModeChange}
                    {...extraProps}
                />
            </FormField>
        );
    }, [formState, repeatModeValue, handleRepeatModeChange]);

    const getStartTimezoneField: (overrides?: Partial<SchedulerEditorField>) => JSX.Element = useCallback((
        overrides: Partial<SchedulerEditorField> = {}) => {
        const extraProps: Record<string, any> = overrides.props ?? {};
        if (!showTimezoneControls || data?.isAllDay) {
            return null;
        }
        const { options: dropdownOptions, current: currentValue } = getDropDownOption('start');

        return (
            <FormField name='startTimezone'>
                <DropDownList
                    dataSource={dropdownOptions}
                    fields={{ text: 'text', value: 'value' }}
                    value={extraProps.value ?? currentValue}
                    placeholder={extraProps.placeholder ?? getString('startTimezone')}
                    labelMode='Always'
                    filterable={true}
                    filterPlaceholder={getString('searchTimezone')}
                    filterType='Contains'
                    onChange={(args: ChangeEvent) => {
                        formState?.onChange('startTimezone', { value: args?.value as string });
                        formState?.onChange('endTimezone', { value: args?.value as string });
                        (extraProps.onChange ?? handleStartTimezoneChange)?.(args);
                    }}
                    disabled={data?.isAllDay}
                    aria-label={getString('startTimezone')}
                    {...extraProps}
                />
            </FormField>
        );
    }, [formState, data?.startTimezone, data?.isAllDay, timezone,
        handleStartTimezoneChange, getString, getUseTimezoneField]);

    const getEndTimezoneField: (overrides?: Partial<SchedulerEditorField>) => JSX.Element = useCallback((
        overrides: Partial<SchedulerEditorField> = {}) => {
        const extraProps: Record<string, any> = overrides.props ?? {};
        if (!showTimezoneControls || data?.isAllDay) {
            return null;
        }
        const { options: dropdownOptions, current: currentValue } = getDropDownOption('end');

        return (
            <FormField name='endTimezone'>
                <DropDownList
                    dataSource={dropdownOptions}
                    fields={{ text: 'text', value: 'value' }}
                    value={extraProps.value ?? currentValue}
                    placeholder={extraProps.placeholder ?? getString('endTimezone')}
                    labelMode='Always'
                    filterable={true}
                    filterPlaceholder={getString('searchTimezone')}
                    filterType='Contains'
                    onChange={(args: ChangeEvent) => {
                        formState?.onChange('endTimezone', { value: args?.value as string });
                        (extraProps.onChange ?? handleEndTimezoneChange)?.(args);
                    }}
                    disabled={data?.isAllDay}
                    aria-label={getString('endTimezone')}
                    {...extraProps}
                />
            </FormField>
        );
    }, [formState, data?.endTimezone, data?.isAllDay, timezone,
        handleEndTimezoneChange, getString, getUseTimezoneField]);

    const getResourceField: (resourceIndex: number, overrides?: Partial<SchedulerEditorField>) => JSX.Element | null =
        useCallback((resourceIndex: number, overrides: Partial<SchedulerEditorField> = {}) => {
            if (!resources || resources.length === 0 || resourceIndex >= resources.length) {
                return null;
            }
            const resource: SchedulerResource = resources[parseInt(resourceIndex.toString(), 10)];
            const fieldName: string = resource.field;
            const extraProps: Record<string, any> = overrides.props ?? {};
            const filteredData: Record<string, unknown>[] = getFilteredResourceData(resourceIndex);
            const currentValue: string | number | (string | number)[] = resourceValues[`${fieldName}`];
            if (resource.multiple) {
                return (
                    <FormField name={fieldName}>
                        <MultiSelect
                            placeholder={extraProps.placeholder ?? resource.title}
                            className={extraProps.className ?? `sf-${fieldName} ${CSS_CLASSES.EVENT_RESOURCE}`}
                            labelMode={extraProps.labelMode ?? 'Always'}
                            dataSource={extraProps.dataSource ?? filteredData}
                            fields={{ text: resource.textField, value: resource.idField }}
                            value={extraProps.value ?? (Array.isArray(currentValue) ? currentValue : (currentValue ? [currentValue] : []))}
                            onChange={extraProps.onChange ?? handleResourceChange(resourceIndex)}
                            key={`${fieldName}-${resourceIndex}-${Array.isArray(currentValue) ? currentValue.join(',') : currentValue}`}
                            {...extraProps}
                        />
                    </FormField>
                );
            } else {
                return (
                    <FormField name={fieldName}>
                        <DropDownList
                            placeholder={extraProps.placeholder ?? resource.title}
                            className={extraProps.className ?? `sf-${fieldName} ${CSS_CLASSES.EVENT_RESOURCE}`}
                            labelMode={extraProps.labelMode ?? 'Always'}
                            dataSource={extraProps.dataSource ?? filteredData}
                            fields={{ text: resource.textField, value: resource.idField }}
                            value={extraProps.value ?? (currentValue as string | number)}
                            onChange={extraProps.onChange ?? handleResourceChange(resourceIndex)}
                            key={`${fieldName}-${resourceIndex}-${currentValue}`}
                            {...extraProps}
                        />
                    </FormField>
                );
            }
        }, [resources, resourceValues, getFilteredResourceData, handleResourceChange]);

    const getDescriptionField: (overrides?: Partial<SchedulerEditorField>) => JSX.Element =
        useCallback((overrides: Partial<SchedulerEditorField> = {}) => {
            const extraProps: Record<string, any> = overrides.props ?? {};
            return (
                <div className={CSS_CLASSES.DESCRIPTION_ROW}>
                    <FormField name="description">
                        <TextArea
                            placeholder={extraProps.placeholder ?? getString('description')}
                            className={`${extraProps.className ?? CSS_CLASSES.EVENT_DESCRIPTION} ${formState?.errors.description ? 'sf-error' : ''}`}
                            labelMode={extraProps.labelMode ?? 'Always'}
                            value={extraProps.description ?? (formState?.values.description as string || data?.description)}
                            width={extraProps.width ?? '100%'}
                            resizeMode={extraProps.resizeMode ?? ResizeMode.Vertical}
                            onChange={(args: TextAreaChangeEvent) => {
                                formState?.onChange('description', { value: args.value || '' });
                                (extraProps.onChange ?? handleDescriptionChange)?.(args);
                            }}
                            onBlur={() => formState?.onBlur('description')}
                            {...extraProps}
                        />
                        {formState?.errors?.description && <div className="sf-form-error">{formState.errors.description}</div>}
                    </FormField>
                </div>
            );
        }, [formState, data?.description, handleDescriptionChange]);

    const getResourceFields: (overrides?: Partial<SchedulerEditorField>) => JSX.Element | null =
        useCallback((overrides: Partial<SchedulerEditorField> = {}) => {
            if (!resources || resources.length === 0) { return null; }

            return (
                <>
                    {resources.map((_resource: SchedulerResource, index: number) => (
                        <div key={`resource-field-${_resource.field}`} className={`${CSS_CLASSES.RESOURCE_CONTAINER}`}>
                            {getResourceField(index, overrides)}
                        </div>
                    ))}
                </>
            );
        }, [resources, getResourceField]);

    const fieldComponents: Record<string, (o: Partial<SchedulerEditorField>) => ReactNode> = useMemo(() => ({
        subject: getSubjectField,
        location: getLocationField,
        startDate: getStartDateField,
        startTime: getStartTimeField,
        endDate: getEndDateField,
        endTime: getEndTimeField,
        isAllDay: getAllDayField,
        startTimezone: getStartTimezoneField,
        endTimezone: getEndTimezoneField,
        repeatMode: getRepeatModeField,
        resource: getResourceFields,
        description: getDescriptionField
    }), [getSubjectField, getLocationField, getStartDateField, getStartTimeField, getEndDateField,
        getEndTimeField, getAllDayField, getStartTimezoneField, getEndTimezoneField, getRepeatModeField, getResourceFields,
        getDescriptionField]);

    /**
     * Return the visible fields of default fields.
     */
    const mergedFields: SchedulerEditorField[] = useMemo(() => {
        if (!fields || fields.length === 0) {
            return DEFAULT_FIELD_CONFIG;
        }
        return fields.filter((f: SchedulerEditorField) => f.visible !== false);
    }, [fields]);

    /**
     * Groups fields into rows based on default grouping.
     */
    const fieldRows: SchedulerEditorField[][] = useMemo(() => {
        const rows: SchedulerEditorField[][] = [];
        const fieldMap: Map<string, SchedulerEditorField> = new Map(mergedFields.map((f: SchedulerEditorField) => [f.name, f]));
        DEFAULT_ROW_GROUPS.forEach((group: string[]) => {
            const rowFields: SchedulerEditorField[] = group
                .map((name: string) => fieldMap.get(name))
                .filter((f: SchedulerEditorField) => !!f);
            if (rowFields.length > 0) {
                rows.push(rowFields);
            }
        });

        return rows;
    }, [mergedFields]);

    const getDefaultFieldClass: (fieldName: string) => string | undefined = (fieldName: string): string | undefined => {
        return DEFAULT_FIELD_CONFIG.find((f: SchedulerEditorField) => f.name === fieldName)?.className;
    };

    const renderField: (field: SchedulerEditorField) => ReactNode = useCallback((field: SchedulerEditorField): ReactNode => {
        const containerClass: string = [
            (field.name === 'isAllDay' ? [] : [CSS_CLASSES.EDITOR_FIELD_CONTAINER]),
            getDefaultFieldClass(field.name),
            field.className
        ].filter(Boolean).join(' ');
        if (field.component) {
            return (
                <div key={field.name} className={containerClass}>
                    {field.component}
                </div>
            );
        }
        const getField: (o: Partial<SchedulerEditorField>) => ReactNode = fieldComponents[field.name];
        if (getField) {
            if ((field.name === 'startTime' || field.name === 'endTime' || field.name === 'startTimezone' || field.name === 'endTimezone') && data?.isAllDay) {
                return null;
            }
            if (field.name === 'repeatMode' && action === 'EditOccurrence') {
                return null;
            }
            return (
                <div key={field.name} className={containerClass}>
                    {getField(field)}
                </div>
            );
        }
        return null;
    }, [data?.isAllDay, getString, fieldComponents, action]);

    const isDefaultMode: boolean = !fields || fields.length === 0;

    if (isDefaultMode) {
        return (
            <Form ref={formRef} rules={validationRules} initialValues={initialFormValues} onFormStateChange={setFormState} validateOnChange={true} autoComplete="off" >
                <div className={`${CSS_CLASSES.DIALOG_CONTENT} ${CSS_CLASSES.DISPLAY_FLEX}`}>
                    <div className={`${CSS_CLASSES.TITLE_LOCATION_ROW} ${CSS_CLASSES.DISPLAY_FLEX} ${CSS_CLASSES.EDITOR_FIELDS_ROW}`}>
                        <div className={`${CSS_CLASSES.SUBJECT_CONTAINER} ${CSS_CLASSES.EDITOR_FIELD_CONTAINER}`}>
                            {getSubjectField()}
                        </div>
                        <div className={`${CSS_CLASSES.LOCATION_CONTAINER} ${CSS_CLASSES.EDITOR_FIELD_CONTAINER}`}>
                            {getLocationField()}
                        </div>
                    </div>

                    <div className={`${CSS_CLASSES.START_ROW} ${CSS_CLASSES.DISPLAY_FLEX} ${CSS_CLASSES.EDITOR_FIELDS_ROW}`}>
                        <div className={`${CSS_CLASSES.START_DATE_CONTAINER} ${CSS_CLASSES.EDITOR_FIELD_CONTAINER}`}>
                            {getStartDateField()}
                        </div>
                        {!data?.isAllDay && (
                            <div className={`${CSS_CLASSES.START_TIME_CONTAINER} ${CSS_CLASSES.EDITOR_FIELD_CONTAINER}`}>
                                {getStartTimeField()}
                            </div>
                        )}
                    </div>

                    <div className={`${CSS_CLASSES.END_ROW} ${CSS_CLASSES.DISPLAY_FLEX} ${CSS_CLASSES.EDITOR_FIELDS_ROW}`}>
                        <div className={`${CSS_CLASSES.END_DATE_CONTAINER} ${CSS_CLASSES.EDITOR_FIELD_CONTAINER}`}>
                            {getEndDateField()}
                        </div>
                        {!data?.isAllDay && (
                            <div className={`${CSS_CLASSES.END_TIME_CONTAINER} ${CSS_CLASSES.EDITOR_FIELD_CONTAINER}`}>
                                {getEndTimeField()}
                            </div>
                        )}
                    </div>

                    <div className={`${CSS_CLASSES.ALL_DAY_TIMEZONE_ROW} ${CSS_CLASSES.DISPLAY_FLEX}`}>
                        <div className={`${CSS_CLASSES.ALL_DAY_CONTAINER}`}>
                            {getAllDayField()}
                        </div>
                        <div className={`${CSS_CLASSES.TIMEZONE_CONTAINER}`}>
                            {getUseTimezoneField()}
                        </div>
                    </div>

                    {!data?.isAllDay && showTimezoneControls && (
                        <div className={`${CSS_CLASSES.EDITOR_FIELDS_ROW} ${CSS_CLASSES.DISPLAY_FLEX}`}>
                            <div className={`${CSS_CLASSES.START_TIMEZONE_CONTAINER} ${CSS_CLASSES.EDITOR_FIELD_CONTAINER}`}>
                                {getStartTimezoneField()}
                            </div>
                            <div className={`${CSS_CLASSES.END_TIMEZONE_CONTAINER} ${CSS_CLASSES.EDITOR_FIELD_CONTAINER}`}>
                                {getEndTimezoneField()}
                            </div>
                        </div>
                    )}

                    {action !== 'EditOccurrence' && (
                        <div className={`${CSS_CLASSES.EDITOR_FIELDS_ROW} ${CSS_CLASSES.DISPLAY_FLEX}`}>
                            {getRepeatModeField()}
                        </div>
                    )}

                    {resources && resources.length > 0 && resources.map((_resource: SchedulerResource, index: number) => (
                        <div key={`resource-row-${index}`} className={`${CSS_CLASSES.RESOURCE_ROW} ${CSS_CLASSES.DISPLAY_FLEX} ${CSS_CLASSES.EDITOR_FIELDS_ROW}`}>
                            <div className={`${CSS_CLASSES.RESOURCE_CONTAINER} ${CSS_CLASSES.EDITOR_FIELD_CONTAINER}`}>
                                {getResourceField(index)}
                            </div>
                        </div>
                    ))}

                    <div className={CSS_CLASSES.DESCRIPTION_ROW}>
                        <div className={CSS_CLASSES.DESCRIPTION_CONTAINER}>
                            {getDescriptionField()}
                        </div>
                    </div>
                </div>
            </Form>
        );
    }

    return (
        <Form ref={formRef} rules={validationRules} initialValues={initialFormValues} onFormStateChange={setFormState} validateOnChange={true} autoComplete="off">
            <div className={`${CSS_CLASSES.DIALOG_CONTENT} ${CSS_CLASSES.DISPLAY_FLEX}`}>
                {fieldRows.map((row: SchedulerEditorField[], idx: number) => {
                    const rendered: ReactNode[] = row.map(renderField).filter(Boolean);
                    if (!rendered.length) { return null; }

                    return (
                        <div key={`row-${idx}`} className={`${CSS_CLASSES.EDITOR_FIELDS_ROW} ${CSS_CLASSES.DISPLAY_FLEX}`} >
                            {rendered}
                        </div>
                    );
                })}
            </div>
        </Form>
    );
};

export default EditorPopupFields;
