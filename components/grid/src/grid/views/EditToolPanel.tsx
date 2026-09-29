import { ReactElement, useEffect, useMemo, useState } from 'react';
import { Checkbox, CheckboxChangeEvent } from '@syncfusion/react-buttons/src/check-box/check-box';
import { DatePicker, DatePickerChangeEvent } from '@syncfusion/react-calendars/src/datepicker/index';
import { DropDownList, ChangeEvent as DDLChangeEvent } from '@syncfusion/react-dropdowns/src/drop-down-list/index';
import { NumericTextBox, NumericChangeEvent } from '@syncfusion/react-inputs/src/numeric-textbox/index';
import { TextBox, TextBoxChangeEvent } from '@syncfusion/react-inputs/src/textbox/index';
import { Form, FormField, FormValueType } from '@syncfusion/react-inputs/src/form-validator/index';
import { Accordion, AccordionContent, AccordionHeader, AccordionIndicator, AccordionPanel, AccordionTrigger } from '@syncfusion/react-navigations';
import { EditIcon } from '@syncfusion/react-icons/src/icons/edit';
import { EditType } from '../types/enum';
import { ColumnProps, FlattenedColumn } from '../types/column.interfaces';
import { GridRef } from '../types/grid.interfaces';
import { MutableGridSetter, ValueType } from '../types/interfaces';
import { useGridComputedProvider } from '../contexts/GridProviders';
import { DataManager } from '@syncfusion/react-data';
import { DataUtil } from '@syncfusion/react-data';

const MIXED_VALUE: unique symbol = Symbol('mixed-value');
type EditValue = ValueType | null | typeof MIXED_VALUE;

export const getEditValue: (records: unknown[], column: ColumnProps) => EditValue =
    (records: unknown[], column: ColumnProps): EditValue => {
        if (!records.length) {
            return null;
        }
        const values: unknown[] = records.map((record: unknown) => Reflect.get(record as object, column.field));
        return values.every((value: unknown) => isSameValue(value, values[0])) ? values[0] as ValueType : MIXED_VALUE;
    };

export const isSameValue: (left: unknown, right: unknown) => boolean = (left: unknown, right: unknown): boolean => {
    if (left instanceof Date && right instanceof Date) {
        return left.getTime() === right.getTime();
    }
    return left === right || String(left) === String(right);
};

export const getEditType: (column: ColumnProps) => EditType | string = (column: ColumnProps): EditType | string => {
    if (column.edit?.type) {
        return column.edit.type;
    }
    if (column.type === 'number') {
        return EditType.NumericTextBox;
    }
    if (column.type === 'date' || column.type === 'dateTime') {
        return EditType.DatePicker;
    }
    if (column.type === 'boolean') {
        return EditType.CheckBox;
    }
    return EditType.TextBox;
};

export const getOptions: (column: ColumnProps) => string[] = (column: ColumnProps): string[] => {
    const params: { dataSource?: unknown[] } | undefined = column.edit?.params as { dataSource?: unknown[] } | undefined;
    return Array.isArray(params?.dataSource) ? params.dataSource.map((option: unknown) => String(option)) : [];
};

/**
 * Resolves the grid's raw record array from any supported data source shape,
 * mirroring the cell-edit dropdown resolution in EditCell (DataManager,
 * remote-style DataResult, or plain array).
 *
 * @param {unknown} dataSource - Grid data source (DataManager, DataResult, or array).
 * @returns {unknown[]} Flattened record array.
 */
export const resolveGridRecords: (dataSource: unknown) => unknown[] =
    (dataSource: unknown): unknown[] => {
        if (dataSource instanceof DataManager) {
            const json: unknown = (dataSource.dataSource as { json?: unknown[] })?.json;
            return Array.isArray(json) ? json : [];
        }
        if (Array.isArray(dataSource)) {
            return dataSource;
        }
        if (dataSource && typeof dataSource === 'object' && Array.isArray((dataSource as { result?: unknown[] }).result)) {
            return (dataSource as { result: unknown[] }).result;
        }
        return [];
    };

/**
 * Resolves the dropdown data source for a column from the grid's full record
 * set. The column's distinct values across all records are offered, regardless
 * of the current selection. Explicit `edit.params.dataSource` always takes
 * precedence. Distinct filtering reuses `DataUtil.distinct`, the same utility
 * applied by the cell-edit dropdown.
 *
 * @param {ColumnProps} column - Column to resolve options for.
 * @param {unknown[]} allRecords - Full grid data source records.
 * @returns {unknown[]} Options for the DropDownList editor.
 */
export const getDropdownDataSource: (column: ColumnProps, allRecords: unknown[]) => unknown[] =
    (column: ColumnProps, allRecords: unknown[]): unknown[] => {
        const params: { dataSource?: unknown[] } | undefined = column.edit?.params as { dataSource?: unknown[] } | undefined;
        if (Array.isArray(params?.dataSource) && params.dataSource.length) {
            return params.dataSource;
        }
        if (!allRecords.length) {
            return [];
        }
        return DataUtil.distinct(allRecords
            .map((record: unknown) => Reflect.get(record as object, column.field))
            .filter((value: unknown) => value !== null && value !== undefined), column.field) as unknown[];
    };

export const toValueType: (value: unknown) => ValueType | null = (value: unknown): ValueType | null => {
    if (value === null || value === undefined) {
        return null;
    }
    if (value instanceof Date || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        return value;
    }
    return String(value);
};

const EditToolPanel: () => ReactElement = (): ReactElement => {
    const grid: Partial<GridRef> & Partial<MutableGridSetter> = useGridComputedProvider();
    const [selectedRecords, setSelectedRecords] = useState<unknown[]>([]);

    const readSelectedRecords: () => unknown[] = (): unknown[] => {
        const records: unknown[] | { isSelectAll: boolean; primaryKeys: string[] } | undefined = grid.getSelectedRecords?.();
        return Array.isArray(records) ? records : [];
    };

    useEffect(() => {
        const gridElement: HTMLElement | undefined = grid.element;
        if (!gridElement) {
            return undefined;
        }
        const OnSelectionChange: () => void = (): void => setSelectedRecords(readSelectedRecords());
        OnSelectionChange();
        gridElement.addEventListener('selectionChanged', OnSelectionChange);
        return () => gridElement.removeEventListener('selectionChanged', OnSelectionChange);
    }, [grid.element, grid.getSelectedRecords]);

    const columns: ColumnProps[] = useMemo((): ColumnProps[] => {
        const sourceColumns: ColumnProps[] = (grid.isStackedHeader
            ? grid.stackedFlattedColumnProps : grid.getColumns?.()) as unknown as ColumnProps[];
        return sourceColumns.filter((column: ColumnProps) => Boolean(column.field) &&
            !column.isPrimaryKey && column.allowEdit !== false);
    }, [grid.getColumns, grid.isStackedHeader, grid.stackedFlattedColumnProps]);

    const getLocalizedText: (key: string, fallback: string) => string = (key: string, fallback: string): string =>
        grid.localeObj?.getConstant(key) || fallback;

    const stackedTree: { topLevelParents: FlattenedColumn[]; topLevelLeaves: ColumnProps[] } = useMemo(() => {
        const entries: FlattenedColumn[] = grid.stackedHeaderColumns;
        const parentEntries: FlattenedColumn[] = entries.filter((entry: FlattenedColumn) => entry.childDetails?.length);
        const topLevelParents: FlattenedColumn[] = parentEntries.filter((entry: FlattenedColumn) => entry.depth === 0);
        const groupedFields: Set<string | undefined> = new Set(entries
            .filter((entry: FlattenedColumn) => Boolean(entry.ParentHeaderText) && Boolean(entry.columnProps?.field))
            .map((entry: FlattenedColumn) => entry.columnProps?.field));
        const topLevelLeaves: ColumnProps[] = columns.filter((column: ColumnProps) => !groupedFields.has(column.field));
        return { topLevelParents, topLevelLeaves };
    }, [columns, grid.stackedHeaderColumns]);

    const getFieldValue: (column: ColumnProps) => EditValue = (column: ColumnProps): EditValue =>
        getEditValue(selectedRecords, column);

    const OnFieldChange: (column: ColumnProps, value: ValueType | null) => void =
        (column: ColumnProps, value: ValueType | null): void => {
            const primaryKey: string | undefined = grid.getPrimaryKeyFieldNames?.()[0];
            if (!primaryKey || !grid.setCellValue) {
                return;
            }
            selectedRecords.forEach((record: unknown) => {
                const key: unknown = Reflect.get(record as object, primaryKey);
                if (typeof key === 'string' || typeof key === 'number') {
                    grid.setCellValue(key, column.field, value, true);
                }
            });
            setSelectedRecords((records: unknown[]) => records.map((record: unknown) => ({ ...record as object, [column.field]: value })));
        };

    const renderEditor: (column: ColumnProps, value: EditValue) => ReactElement =
        (column: ColumnProps, value: EditValue): ReactElement => {
            const editorValue: ValueType | null = value === MIXED_VALUE ? null : value;
            const placeholder: string = value === MIXED_VALUE ? '' : column.headerText ?? column.field;
            const type: EditType | string = getEditType(column);
            if (type === EditType.NumericTextBox) {
                return <NumericTextBox value={editorValue as number ?? null} placeholder={placeholder}
                    onChange={(event: NumericChangeEvent) => OnFieldChange(column, event.value)} />;
            }
            if (type === EditType.DatePicker) {
                return <DatePicker value={editorValue ? new Date(editorValue as string | number | Date) : null}
                    placeholder={placeholder} onChange={(event: DatePickerChangeEvent) => OnFieldChange(column, event.value )} />;
            }
            if (type === EditType.DropDownList) {
                return <DropDownList dataSource={getDropdownDataSource(column, resolveGridRecords(grid.dataSource)) as unknown as string[]}
                    value={editorValue as string | number}
                    placeholder={placeholder} onChange={(event: DDLChangeEvent) => OnFieldChange(column, toValueType(event.value))} />;
            }
            if (type === EditType.CheckBox) {
                return <Checkbox checked={Boolean(editorValue)}
                    onChange={(event: CheckboxChangeEvent) => OnFieldChange(column, event.value)} />;
            }
            return <TextBox value={editorValue?.toString() ?? ''} placeholder={placeholder}
                onChange={(event: TextBoxChangeEvent) => OnFieldChange(column, event.value)} />;
        };

    const getPanelId: (entry: FlattenedColumn, path: string) => string =
        (entry: FlattenedColumn, path: string): string =>
            `edit-section-${path}-${entry.uid}`.replace(/[^a-zA-Z0-9_-]/g, '-');

    const getTreePanelIds: (entry: FlattenedColumn, path: string) => string[] =
        (entry: FlattenedColumn, path: string): string[] => {
            const panelId: string = getPanelId(entry, path);
            return [panelId, ...(entry.childDetails ?? [])
                .filter((child: FlattenedColumn) => child.childDetails?.length)
                .flatMap((child: FlattenedColumn, index: number) => getTreePanelIds(child, `${path}-${index}`))];
        };

    const defaultExpandedSections: string[] = [
        ...(stackedTree.topLevelLeaves.length ? ['edit-section-general'] : []),
        ...stackedTree.topLevelParents.flatMap((entry: FlattenedColumn, index: number) =>
            getTreePanelIds(entry, String(index)))
    ];

    const renderLeaf: (column: ColumnProps) => ReactElement = (column: ColumnProps): ReactElement => (
        <FormField key={column.field} name={column.field}>
            <div className='sf-grid-edit-tool-panel-field'>
                <label htmlFor={`sf-grid-edit-tool-panel-${column.field}`}>{column.headerText ?? column.field}</label>
                <div id={`sf-grid-edit-tool-panel-${column.field}`}>{renderEditor(column, getFieldValue(column))}</div>
            </div>
        </FormField>
    );

    const renderTreeNode: (entry: FlattenedColumn, path: string) => ReactElement =
        (entry: FlattenedColumn, path: string): ReactElement => {
            const panelId: string = getPanelId(entry, path);
            const childLeaves: FlattenedColumn[] = (entry.childDetails ?? []).filter((child: FlattenedColumn) => child.childDetails?.length
                || (Boolean(child.columnProps?.field) && columns.some((column: ColumnProps) => column.field === child.columnProps?.field)));
            const nestedPanels: FlattenedColumn[] = childLeaves.filter((child: FlattenedColumn) => child.childDetails?.length);
            const leafColumns: ColumnProps[] = childLeaves.filter((child: FlattenedColumn) => !child.childDetails?.length)
                .map((child: FlattenedColumn) => child.columnProps as ColumnProps);
            return <AccordionPanel key={panelId} value={panelId}>
                <AccordionHeader><AccordionTrigger><div className='sf-grid-edit-tool-panel-header'>
                    <AccordionIndicator />{entry.columnProps?.headerText ?? entry.columnProps?.field}
                </div></AccordionTrigger></AccordionHeader>
                <AccordionContent><div className='sf-grid-edit-tool-panel-fields'>
                    {leafColumns.map(renderLeaf)}
                    {nestedPanels.map((child: FlattenedColumn, index: number) => renderTreeNode(child, `${path}-${index}`))}
                </div></AccordionContent>
            </AccordionPanel>;
        };

    if (!selectedRecords.length) {
        return <div className='sf-grid-edit-tool-panel sf-grid-edit-tool-panel-empty' data-panel-id='editing'>
            <div className='sf-grid-edit-tool-panel-empty-icon' aria-hidden='true'>
                <EditIcon />
            </div>
            <div className='sf-grid-edit-tool-panel-empty-title'>
                {getLocalizedText('selectRowsToEdit', 'Select rows to edit')}
            </div>
        </div>;
    }

    const initialValues: Record<string, FormValueType> = {};
    columns.forEach((column: ColumnProps) => {
        const value: EditValue = getFieldValue(column);
        if (value !== MIXED_VALUE) {
            initialValues[column.field] = value as FormValueType;
        }
    });

    return <div className='sf-grid-edit-tool-panel' data-panel-id='editing'>
        <div className='sf-grid-edit-tool-panel-count' style={{ display: 'none' }} >{selectedRecords.length} selected record(s)</div>
        <Form rules={{}} initialValues={initialValues} validateOnChange={false}
            className='sf-grid-edit-tool-panel-form' aria-label='Selected records editing form' role='form'>
            <Accordion borderless={true} openOnFocus={true} multiple={true}
                defaultValue={defaultExpandedSections} renderMode='All'>
                {stackedTree.topLevelLeaves.length > 0 && <AccordionPanel value='edit-section-general'>
                    <AccordionHeader><AccordionTrigger><div className='sf-grid-edit-tool-panel-header'>
                        <AccordionIndicator />{getLocalizedText('editRecordDetails', 'Edit Record Details')}
                    </div></AccordionTrigger></AccordionHeader>
                    <AccordionContent><div className='sf-grid-edit-tool-panel-fields'>{stackedTree.topLevelLeaves.map(renderLeaf)}</div></AccordionContent>
                </AccordionPanel>}
                {stackedTree.topLevelParents.map((entry: FlattenedColumn, index: number) => renderTreeNode(entry, String(index)))}
            </Accordion>
        </Form>
    </div>;
};

export { EditToolPanel };
