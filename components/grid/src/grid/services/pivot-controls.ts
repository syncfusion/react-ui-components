import { IL10n, L10n } from '@syncfusion/react-base/src/l10n';
import { ColumnProps } from '../types/column.interfaces';
import {
    PivotAggregateType, PivotCustomAggregate, PivotMemberFilter, PivotMemberSort, PivotSettings, PivotValue
} from '../types/pivot.interfaces';

export const pivotLocale: Record<string, string> = {
    pivotGrandTotal: 'Grand Total', noRecordsMessage: 'No records to display', pivotValueAggregation: 'Value Aggregation',
    pivotConfiguration: 'Pivot configuration', pivotMode: 'Pivot Mode', pivotRows: 'Row Groups',
    pivotEnableModeHint: 'Enable Pivot Mode to configure rows, columns, and values.',
    pivotColumns: 'Column Labels', pivotValues: 'Values', pivotApply: 'Apply', pivotCancel: 'Cancel',
    pivotSortAscending: 'Sort Ascending', pivotSortDescending: 'Sort Descending', pivotClearSort: 'Clear Sort',
    pivotUp: 'Up', pivotDown: 'Down', pivotRemoveAction: 'Remove', pivotAddField: 'Add field...',
    pivotAddFieldTo: 'Add {0} to {1}', pivotMoveUp: 'Move {0} up in {1}', pivotMoveDown: 'Move {0} down in {1}',
    pivotRemove: 'Remove {0} from {1}', pivotAggregate: 'Aggregate {0}', pivotRowLabels: 'Row Groups',
    pivotColumnLabels: 'Column Labels', pivotDropHint: 'Drag fields here', pivotMoveEarlier: 'Move {0} earlier',
    pivotMoveLater: 'Move {0} later', pivotMoveOtherAxis: 'Move {0} to {1}', pivotSort: 'Sort {0} {1}',
    pivotUnsorted: 'unsorted', pivotAscending: 'ascending', pivotDescending: 'descending',
    pivotFilterMembers: 'Filter Members', pivotFilterField: 'Filter {0}', pivotSearchMembers: 'Search members',
    pivotSelectAllMembers: 'Select all members', pivotSelectMatchingMembers: 'Select all matching',
    pivotNoMatchingMembers: 'No matching members', pivotClearMemberFilter: 'Clear filter',
    pivotNullMember: '(Null)', pivotUndefinedMember: '(Undefined)', pivotEmptyMember: '(Empty)',
    pivotSelectedMembers: '{0} selected', pivotMemberFilters: 'Member filters',
    pivotSearchFields: 'Search fields', pivotAvailableFields: 'Available fields',
    pivotNoMatchingFields: 'No matching fields', pivotPendingChanges: 'Pivot changes pending',
    pivotHidePanel: 'Hide pivot panel', pivotShowPanel: 'Show pivot panel',
    pivotFieldActions: 'Actions for {0}', pivotDragField: 'Drag {0}', pivotInvalidDrop: 'Cannot drop here',
    pivotDropPosition: 'Insert in {0} at position {1}', pivotMoveTo: 'Move to {0}', pivotAddTo: 'Add to {0}'
};

/**
 * @param {*} locale - locale.
 * @returns {*} Result.
 */
export function createPivotLocalization(locale?: string): IL10n {
    const localization: IL10n = L10n('grid', pivotLocale, locale || 'en-US');
    localization.setLocale(locale || 'en-US');
    return localization;
}

export interface PivotFieldCapability<T> {
    column: ColumnProps<T>; field: string; caption: string; dimension: boolean; locked: boolean;
    aggregates: readonly PivotAggregateType[];
}
/**
 * Collects the pivot field capabilities available for the supplied columns.
 * Recurses through nested columns and resolves dimension and aggregate support.
 *
 * @param {ColumnProps<T>[]} columns - Source columns.
 * @param {PivotSettings<T>} [settings] - Current pivot settings.
 * @param {Record<string, string>} [fieldTypes] - Engine-inferred types indexed by source field name.
 * @returns {PivotFieldCapability<T>[]} Available pivot field capabilities.
 */
export function getPivotFieldCapabilities<T>(
    columns: ColumnProps<T>[], settings?: PivotSettings<T>, fieldTypes: Record<string, string> = {}
): PivotFieldCapability<T>[] {
    return columns.flatMap((column: ColumnProps<T>) => column.columns?.length ?
        getPivotFieldCapabilities(column.columns, settings, fieldTypes) :
        column.field ? [{
            column, field: column.field, caption: column.headerText || column.field,
            dimension: column.allowGroup !== false, locked: column.allowGroup === false,
            aggregates: (column.type ?? fieldTypes[column.field]) === 'number' ? ['Sum', 'Count', 'Min', 'Max', 'Average',
                ...(settings?.customAggregates || []).map((item: PivotCustomAggregate) => item.name)] : ['Count']
        }] : []);
}

export type PivotControlAxis = 'rows' | 'columns' | 'values';
export type PivotControlAction =
    { type: 'add'; axis: PivotControlAxis; field: string; aggregate?: PivotAggregateType; index?: number } |
    { type: 'transfer'; axis: PivotControlAxis; from: number; target: PivotControlAxis; index: number } |
    { type: 'mode'; enabled: boolean } |
    { type: 'remove'; axis: PivotControlAxis; index: number } |
    { type: 'removeField'; field: string } |
    { type: 'move'; axis: PivotControlAxis; from: number; to: number } |
    { type: 'aggregate'; index: number; aggregate: PivotAggregateType } |
    { type: 'sort'; field: string; direction?: 'Ascending' | 'Descending' } |
    { type: 'filter'; field: string; memberKeys?: string[] } |
    { type: 'apply' } | { type: 'cancel' };

export type PivotControlCommand = PivotControlAction | { type: 'batch'; commands: PivotControlAction[] };

/**
 * Applies one validated panel command without mutating the current report.
 *
 * @param {*} settings - Current committed or draft report.
 * @param {*} command - Panel command to apply.
 * @param {*} capabilities - Available source fields and their supported roles.
 * @returns {*} Updated report.
 */
export function applyPivotControlCommand<T>(settings: PivotSettings<T>, command: PivotControlCommand,
                                            capabilities: PivotFieldCapability<T>[]): PivotSettings<T> {
    if (command.type === 'apply' || command.type === 'cancel') { return settings; }
    if (command.type === 'mode') { return settings.enabled === command.enabled ? settings : {...settings, enabled: command.enabled}; }
    if (command.type === 'batch') {
        return command.commands.reduce(
            (next: PivotSettings<T>, item: PivotControlAction) => applyPivotControlCommand(next, item, capabilities),
            settings
        );
    }
    const rows: string[] = [...(settings.rows || [])] as string[];
    const columns: string[] = [...(settings.columns || [])] as string[];
    const values: PivotValue<T>[] = (settings.values || []).map((value: PivotValue<T>) => ({...value}));
    const capability: (field: string) => PivotFieldCapability<T> = (field: string): PivotFieldCapability<T> => {
        const match: PivotFieldCapability<T> = capabilities.find((item: PivotFieldCapability<T>) => item.field === field);
        if (!match) { throw new Error(`${field} is not an available pivot field.`); }
        return match;
    };
    const cleanup: (nextRows: string[], nextColumns: string[]) => Partial<PivotSettings<T>> =
        (nextRows: string[], nextColumns: string[]): Partial<PivotSettings<T>> => {
            const dimensions: Set<string> = new Set([...nextRows, ...nextColumns]);
            return {
                memberSorts: (settings.memberSorts || []).filter((item: PivotMemberSort<T>) => dimensions.has(item.field)),
                memberFilters: (settings.memberFilters || []).filter((item: PivotMemberFilter<T>) => dimensions.has(item.field))
            };
        };
    if (command.type === 'transfer') {
        const source: string[] | PivotValue<T>[] = command.axis === 'rows' ? rows :
            command.axis === 'columns' ? columns : values;
        const item: string | PivotValue<T> = source[command.from];
        const destination: string[] | PivotValue<T>[] = command.target === 'rows' ? rows :
            command.target === 'columns' ? columns : values;
        if (!item || command.index < 0 || command.index > destination.length) { return settings; }
        if (command.axis === command.target) {
            const to: number = command.index > command.from ? command.index - 1 : command.index;
            return applyPivotControlCommand(settings, {type: 'move', axis: command.axis, from: command.from, to}, capabilities);
        }
        const field: string = typeof item === 'string' ? item : String(item.field);
        const info: PivotFieldCapability<T> | undefined =
            capabilities.find((entry: PivotFieldCapability<T>) => entry.field === field);
        if (!info || (command.target !== 'values' && !info.dimension)) { return settings; }
        const aggregate: PivotAggregateType = typeof item === 'string' ? info.aggregates[0] : item.type;
        if (command.target === 'values' ? values.some((value: PivotValue<T>) => value.field === field && value.type === aggregate) :
            (destination as string[]).includes(field)) { return settings; }
        // Add first so dimension metadata survives an atomic move between dimensions.
        const added: PivotSettings<T> = applyPivotControlCommand(
            settings,
            {type: 'add', axis: command.target, field, aggregate, index: command.index},
            capabilities
        );
        if (command.axis !== 'values' && command.target !== 'values') { return added; }
        return applyPivotControlCommand(added, {type: 'remove', axis: command.axis, index: command.from}, capabilities);
    }
    if (command.type === 'add') {
        const field: PivotFieldCapability<T> = capability(command.field);
        if (command.axis === 'values') {
            const aggregate: PivotAggregateType = command.aggregate || field.aggregates[0];
            if (!field.aggregates.includes(aggregate)) {
                throw new Error(`${aggregate} is not an available aggregate for ${field.caption}.`);
            }
            if (values.some((value: PivotValue<T>) => value.field === command.field && value.type === aggregate)) {
                return settings;
            }
            const index: number = command.index ?? values.length;
            if (index < 0 || index > values.length) { return settings; }
            values.splice(index, 0, {field: command.field, type: aggregate} as PivotValue<T>);
            return {...settings, values};
        }
        if (!field.dimension) { throw new Error(`${field.caption} is not available as a pivot dimension.`); }
        const target: string[] = command.axis === 'rows' ? rows : columns;
        const other: string[] = command.axis === 'rows' ? columns : rows;
        if (target.includes(command.field)) { return settings; }
        const index: number = command.index ?? target.length;
        if (index < 0 || index > target.length) { return settings; }
        const nextTarget: string[] = [...target];
        nextTarget.splice(index, 0, command.field);
        const nextOther: string[] = other.filter((item: string) => item !== command.field);
        const nextRows: string[] = command.axis === 'rows' ? nextTarget : nextOther;
        const nextColumns: string[] = command.axis === 'columns' ? nextTarget : nextOther;
        return {...settings, rows: nextRows, columns: nextColumns, ...cleanup(nextRows, nextColumns)};
    }
    if (command.type === 'aggregate') {
        const value: PivotValue<T> = values[command.index];
        if (!value) { return settings; }
        const field: PivotFieldCapability<T> = capability(String(value.field));
        if (!field.aggregates.includes(command.aggregate)) {
            throw new Error(`${command.aggregate} is not an available aggregate for ${field.caption}.`);
        }
        if (value.type === command.aggregate || values.some((entry: PivotValue<T>, index: number) => index !== command.index &&
            entry.field === value.field && entry.type === command.aggregate)) { return settings; }
        values[command.index] = {...value, type: command.aggregate};
        return {...settings, values};
    }
    if (command.type === 'removeField') {
        const nextRows: string[] = rows.filter((field: string) => field !== command.field);
        const nextColumns: string[] = columns.filter((field: string) => field !== command.field);
        return {...settings, rows: nextRows, columns: nextColumns,
            values: values.filter((value: PivotValue<T>) => value.field !== command.field),
            ...cleanup(nextRows, nextColumns)};
    }
    if (command.type === 'filter') {
        if (!rows.includes(command.field) && !columns.includes(command.field)) { return settings; }
        return {...settings, memberFilters: [
            ...(settings.memberFilters || []).filter((item: PivotMemberFilter<T>) => item.field !== command.field),
            ...(command.memberKeys === undefined ? [] : [{field: command.field, memberKeys: command.memberKeys}])
        ]};
    }
    if (command.type === 'sort') {
        return {...settings, memberSorts: [
            ...(settings.memberSorts || []).filter((item: PivotMemberSort<T>) => item.field !== command.field),
            ...(command.direction ? [{field: command.field, direction: command.direction}] : [])
        ]};
    }
    const items: string[] | PivotValue<T>[] = command.axis === 'rows' ? rows : command.axis === 'columns' ? columns : values;
    if (command.type === 'move') {
        if (command.from < 0 || command.from >= items.length ||
            command.to < 0 || command.to >= items.length || command.from === command.to) {
            return settings;
        }
        const next: (string | PivotValue<T>)[] = [...items];
        const moved: string | PivotValue<T> = next.splice(command.from, 1)[0];
        next.splice(command.to, 0, moved);
        return {...settings, [command.axis]: next};
    }
    if (command.index < 0 || command.index >= items.length) { return settings; }
    const next: (string | PivotValue<T>)[] = items.filter((_item: string | PivotValue<T>, index: number) => index !== command.index);
    if (command.axis === 'values') { return {...settings, values: next as PivotValue<T>[]}; }
    const nextRows: string[] = command.axis === 'rows' ? next as string[] : rows;
    const nextColumns: string[] = command.axis === 'columns' ? next as string[] : columns;
    return {...settings, [command.axis]: next, ...cleanup(nextRows, nextColumns)};
}

/**
 * @param {*} gridElement - gridElement.
 * @returns {*} Result.
 */
export function getPivotPopupTarget(gridElement?: HTMLElement | null): HTMLElement {
    return gridElement?.parentElement || gridElement || document.body;
}
