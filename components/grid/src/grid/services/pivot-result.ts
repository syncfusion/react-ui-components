import { createPivotEngine, IDataSet, IAxisSet, PivotHost, IDataOptions, SummaryTypes } from '@syncfusion/pivot-engine';
import { ColumnProps } from '../types/column.interfaces';
import { PivotSettings, PivotErrorEvent, PivotErrorCode, PivotResultColumn, PivotResultColumnId,
    PivotResultRow, PivotResultRowId, PivotCustomAggregate } from '../types/pivot.interfaces';
import type { PivotAxisPath, PivotMemberValue, PivotMeasureMetadata, PivotTotalKind } from '../types/pivot-contracts';
import type { PivotValue, PivotMemberSort } from '../types/pivot.interfaces';
import type { PivotEngine } from '@syncfusion/pivot-engine';

/** Internal rows intentionally do not implement the consumer's source-record type. */
export type PivotRow = PivotResultRow;
export interface PivotResultGroup { id: string; path: PivotAxisPath; totalKind: PivotTotalKind; }
export interface PivotResult {
    fieldTypes?: Record<string, string>;
    rows: PivotRow[]; columns: ColumnProps<PivotRow>[]; resultColumns: PivotResultColumn[];
    resultGroups?: PivotResultGroup[];
}
/**
 * @param {*} code - code.
 * @param {*} message - message.
 * @returns {*} Result.
 */
export function pivotFailure(code: PivotErrorCode, message: string): Error & PivotErrorEvent {
    return Object.assign(new Error(message), { code });
}
/**
 * Read source paths without confusing missing values with zero.
 *
 * @param {*} record - record.
 * @param {*} field - field.
 * @returns {*} Result.
 */
export function readPivotField<T>(record: T, field: string): unknown {
    return field.split('.').reduce<unknown>((value: unknown, key: string) => value == null ? undefined :
        Reflect.get(value as { [key: string]: unknown }, key), record);
}
/**
 * Typed encoding prevents EJ2 member maps merging 1 with "1", or delimiters in labels.
 *
 * @param {*} value - value.
 * @returns {*} Result.
 */
export function pivotMemberKey(value: unknown): string {
    if (value != null && !['string', 'number', 'boolean'].includes(typeof value) && !(value instanceof Date)) {
        throw pivotFailure('InvalidField', 'Pivot dimensions must contain scalar values or dates.');
    }
    const text: string = value instanceof Date ? `date:${value.getTime()}` : `${typeof value}:${String(value)}`;
    return 'k' + Array.from(text).map((char: string) => char.codePointAt(0).toString(16).padStart(6, '0')).join('');
}
/**
 * @param {*} columns - columns.
 * @returns {*} Result.
 */
export function flattenPivotColumns<T>(columns: ColumnProps<T>[]): ColumnProps<T>[] {
    return columns.flatMap((column: ColumnProps<T>) => column.columns?.length ? flattenPivotColumns(column.columns) : [column]);
}

const pivotPresentationKeys: (keyof ColumnProps<PivotRow>)[] =
    ['width', 'minWidth', 'maxWidth', 'visible', 'pinDirection'];

/**
 * Retains compatible user presentation choices while accepting the latest pivot schema.
 *
 * @param {*} next - next.
 * @param {*} previous - previous.
 * @param {*} preserveOrder - preserveOrder.
 * @returns {*} Result.
 */
export function reconcilePivotColumns(
    next: ColumnProps<PivotRow>[], previous: ColumnProps<PivotRow>[], preserveOrder: boolean = true
): ColumnProps<PivotRow>[] {
    const previousById: Map<string, ColumnProps<PivotRow>> = new Map(previous.filter((column: ColumnProps<PivotResultRow>) => column.uid)
        .map((column: ColumnProps<PivotResultRow>) => [column.uid, column]));
    const reconciled: ColumnProps<PivotRow>[] = next.map((column: ColumnProps<PivotResultRow>) => {
        const prior: ColumnProps<PivotRow> = previousById.get(column.uid);
        const result: ColumnProps<PivotRow> = { ...column };
        if (prior) {
            pivotPresentationKeys.forEach((key: keyof ColumnProps<PivotResultRow>) => {
                const value: unknown = Reflect.get(prior, key);
                if (value !== undefined) { Reflect.set(result, key, value); }
            });
        }
        if (column.columns?.length) { result.columns = reconcilePivotColumns(column.columns, prior?.columns || [], preserveOrder); }
        return result;
    });
    if (!preserveOrder) { return reconciled; }
    const nextIds: Set<string> = new Set(reconciled.map((column: ColumnProps<PivotResultRow>) => column.uid));
    const priorOrder: Map<string, number> = new Map(previous.filter((column: ColumnProps<PivotResultRow>) => nextIds.has(column.uid))
        .map((column: ColumnProps<PivotResultRow>, index: number) => [column.uid, index]));
    return reconciled.map((column: ColumnProps<PivotResultRow>, index: number) => ({ column, index })).sort((left: {
        column: ColumnProps<PivotResultRow>;
        index: number;
    }, right: {
        column: ColumnProps<PivotResultRow>;
        index: number;
    }) => {
        const leftOrder: number = priorOrder.get(left.column.uid);
        const rightOrder: number = priorOrder.get(right.column.uid);
        if (leftOrder === undefined && rightOrder === undefined) { return left.index - right.index; }
        if (leftOrder === undefined) { return 1; }
        if (rightOrder === undefined) { return -1; }
        return leftOrder - rightOrder;
    }).map((item: {
        column: ColumnProps<PivotResultRow>;
        index: number;
    }) => item.column);
}

export interface PivotInput<T> {
    report: IDataOptions; labels: Map<string, string>; members: Map<string, PivotMemberValue>; fields: ColumnProps<T>[];
    settings: PivotSettings<T>; rowFields: string[]; columnFields: string[];
}
/**
 * Validates and projects only report fields; caller-owned records remain untouched.
 *
 * @param {*} data - data.
 * @param {*} sourceColumns - sourceColumns.
 * @param {*} settings - settings.
 * @returns {*} Result.
 */
export function preparePivotInput<T>(data: T[], sourceColumns: ColumnProps<T>[], settings: PivotSettings<T>): PivotInput<T> {
    const rowFields: string[] = settings.rows || [];
    const columnFields: string[] = settings.columns || [];
    const measures: PivotValue<T>[] = settings.values || [];
    const fields: ColumnProps<T>[] = flattenPivotColumns(sourceColumns);
    const allowed: Set<string> = new Set(fields.map((column: ColumnProps<T>) => column.field).filter(Boolean));
    const dimensions: string[] = [...rowFields, ...columnFields];
    const maximum: number = settings.maxGeneratedColumns ?? 200;
    if (!Number.isInteger(maximum) || maximum < 1 || new Set(dimensions).size !== dimensions.length) {
        throw pivotFailure('InvalidSettings', 'Use unique row/column fields and a positive integer column limit.');
    }
    const fieldsToValidate: string[] = [
        ...dimensions,
        ...measures.map((value: PivotValue<T>) => value.field),
        ...(settings.memberSorts || []).map((sort: PivotMemberSort<T>) => sort.field)
    ];
    for (const field of fieldsToValidate) {
        if (!allowed.has(field)) { throw pivotFailure('InvalidField', `Unknown pivot field: ${field}`); }
    }
    if ((settings.memberSorts || []).some((sort: PivotMemberSort<T>) => !dimensions.includes(sort.field) || !['Ascending', 'Descending'].includes(sort.direction)) ||
        new Set((settings.memberSorts || []).map((sort: PivotMemberSort<T>) => sort.field)).size !== (settings.memberSorts || []).length) {
        throw pivotFailure('InvalidSettings', 'Member sorts require distinct active row or column fields.');
    }
    const custom: readonly PivotCustomAggregate[] = settings.customAggregates || [];
    const builtins: string[] = ['Sum', 'Count', 'Min', 'Max', 'Average'];
    if (custom.some((item: PivotCustomAggregate) => !item.name?.trim() || [...builtins, 'Avg'].includes(item.name) ||
        typeof item.aggregate !== 'function') || new Set(custom.map((item: PivotCustomAggregate) => item.name)).size !== custom.length) {
        throw pivotFailure('InvalidSettings', 'Custom aggregates require unique names and callbacks; built-in names are reserved.');
    }
    if (measures.some((value: PivotValue<T>) => ![
        ...builtins, ...custom.map((item: PivotCustomAggregate) => item.name)
    ].includes(value.type)) ||
        new Set(measures.map((value: PivotValue<T>) => JSON.stringify([value.field, value.type]))).size !== measures.length) {
        throw pivotFailure('InvalidSettings', 'Use distinct field/aggregation pairs with Sum, Count, Min, Max, or Average; registered custom aggregates are also supported.');
    }
    if (!measures.length) { data = []; }
    const labels: Map<string, string> = new Map();
    const members: Map<string, PivotMemberValue> = new Map();
    const columnKeys: Set<string> = new Set();
    const records: IDataSet[] = data.map((record: T) => {
        const output: IDataSet = {};
        const keys: string[] = dimensions.map((field: string, index: number) => {
            const value: unknown = readPivotField(record, field);
            const key: string = pivotMemberKey(value);
            labels.set(key, value == null ? '(Blank)' : String(value));
            members.set(key, value as PivotMemberValue);
            output[`d${index}`] = key;
            return key;
        });
        const columnPath: string[] = keys.slice(rowFields.length);
        if (columnPath.length) {
            for (let depth: number = 1; depth <= columnPath.length; depth++) { columnKeys.add(columnPath.slice(0, depth).join('.')); }
        } else { columnKeys.add(''); }
        const count: number = (columnKeys.size + (columnFields.length && settings.showGrandTotals !== false ? 1 : 0)) * measures.length;
        if (count > maximum) { throw pivotFailure('ColumnLimitExceeded', `Pivot exceeds the ${maximum} generated column limit. Remove a column field or filter the source data.`); }
        measures.forEach((measure: PivotValue<T>, index: number) => {
            const value: unknown = readPivotField(record, measure.field);
            if (value != null && !['string', 'number', 'boolean'].includes(typeof value) && !(value instanceof Date)) {
                throw pivotFailure('InvalidField', `${measure.field} must contain scalar values or dates.`);
            }
            if (value != null && measure.type !== 'Count' && (typeof value !== 'number' || !Number.isFinite(value))) {
                throw pivotFailure('InvalidField', `${measure.field} requires finite numeric values for ${measure.type}.`);
            }
            output[`v${index}`] = value as IDataSet[string];
        });
        return output;
    });
    const report: IDataOptions = {
        dataSource: records,
        rows: rowFields.map((_: string, index: number) => ({ name: `d${index}`, showSubTotals: settings.showSubTotals !== false })),
        columns: columnFields.map((_: string, index: number) => ({ name: `d${index + rowFields.length}`, showSubTotals: true })),
        values: measures.map((measure: PivotValue<T>, index: number) => ({ name: `v${index}`,
            type: (custom.some((item: PivotCustomAggregate) => item.name === measure.type) ? 'Sum' : measure.type === 'Average' ? 'Avg' : measure.type) as SummaryTypes })),
        filters: [], filterSettings: [], enableSorting: true, sortSettings: (settings.memberSorts ||
            []).map((sort: PivotMemberSort<T>) => ({
            name: `d${dimensions.indexOf(sort.field)}`, order: sort.direction
        })).filter((item: {
            name: string;
            order: 'Ascending' | 'Descending';
        }) => item.name !== 'd-1'), formatSettings: [], drilledMembers: [], groupSettings: [],
        calculatedFieldSettings: [], valueSortSettings: { headerDelimiter: '.' }, expandAll: true,
        showSubTotals: true, showRowSubTotals: settings.showSubTotals !== false,
        showColumnSubTotals: true, subTotalsPosition: 'Top', grandTotalsPosition: 'Bottom',
        showGrandTotals: true, showRowGrandTotals: settings.showGrandTotals !== false || !rowFields.length,
        showColumnGrandTotals: settings.showGrandTotals !== false || !columnFields.length,
        valueAxis: 'column', alwaysShowValueHeader: true
    };
    return { report, labels, members, fields, settings, rowFields, columnFields };
}

/**
 * Converts the supplied engine viewport, without applying another page operation.
 *
 * @param {*} matrix - matrix.
 * @param {*} input - input.
 * @returns {*} Result.
 */
export function convertPivotResult<T>(matrix: IAxisSet[][], input: PivotInput<T>): PivotResult {
    const { labels, members, fields, settings, rowFields, columnFields } = input;
    const measures: PivotValue<T>[] = settings.values || [];
    const body: IAxisSet[][] = matrix.filter((row: IAxisSet[]) => row?.[0]?.axis === 'row');
    const columns: ColumnProps<PivotRow>[] = [];
    const resultColumns: PivotResultColumn[] = [];
    const resultGroups: PivotResultGroup[] = [];
    const cellsByColumn: Map<number, string> = new Map();
    const first: IAxisSet[] = body.slice(0, 1)[0] || [];
    for (let index: number = 1; index < first.length; index++) {
        const cell: IAxisSet = first.slice(index, index + 1)[0];
        if (!cell || cell.axis !== 'value') { continue; }
        const measureIndex: number = Number(String(cell.actualText).slice(1));
        const measure: PivotValue<T> = measures.slice(measureIndex, measureIndex + 1)[0];
        if (!measure) { continue; }
        const path: string[] = cell.columnHeaders ? String(cell.columnHeaders).split('.') : [];
        const keys: string[] = path.filter((key: string) => labels.has(key));
        const total: boolean = columnFields.length > 0 && keys.length === 0;
        const identity: string = `c${pivotMemberKey(JSON.stringify([keys, measure.field, measure.type, total]))}`;
        const typedPath: PivotAxisPath = keys.map((key: string, pathIndex: number) =>
            ({ field: columnFields.slice(pathIndex, pathIndex + 1)[0], value: members.get(key) }));
        const measureMetadata: PivotMeasureMetadata = { id: `m${pivotMemberKey(JSON.stringify([measure.field, measure.type]))}`,
            field: measure.field, aggregateType: measure.type === 'Average' ? 'Avg' : measure.type };
        const totalKind: PivotTotalKind = total ? 'grandTotal' : (keys.length < columnFields.length ? 'subtotal' : 'detail');
        resultColumns.push({ id: identity as PivotResultColumnId, path: typedPath, measure: measureMetadata, totalKind });
        cellsByColumn.set(index, identity);
        let siblings: ColumnProps<PivotRow>[] = columns;
        const ancestors: string[] = [];
        for (const key of total ? ['grandTotal'] : keys) {
            ancestors.push(key);
            const groupId: string = `g${ancestors.join('_')}`;
            let group: ColumnProps<PivotRow> = siblings.find((column: ColumnProps<PivotRow>) => column.uid === groupId);
            if (!group) {
                group = {uid: groupId, headerText: key === 'grandTotal' ? 'Grand Total' : labels.get(key),
                    allowGroup: false, columns: []};
                siblings.push(group);
                resultGroups.push({id: groupId, path: total ? [] : typedPath.slice(0, ancestors.length),
                    totalKind: total ? 'grandTotal' : 'detail'});
            }
            siblings = group.columns;
        }
        const original: ColumnProps<T> = fields.find((column: ColumnProps<T>) => column.field === measure.field);
        const aggregateCaption: string = settings.customAggregates?.find(
            (item: PivotCustomAggregate) => item.name === measure.type
        )?.label || measure.type;
        siblings.push({ field: `cells.${identity}`, uid: identity, headerText: `${original?.headerText || measure.field} (${aggregateCaption})`,
            type: 'number', format: original?.format, width: original?.width || 140, allowResize: original?.allowResize, allowSort: original?.allowSort,
            minWidth: original?.minWidth ?? 140, textAlign: 'Right' });
    }
    const rows: PivotRow[] = body.map((cells: IAxisSet[]) => {
        const header: IAxisSet = cells[0];
        const path: string[] = String(header.valueSort?.levelName || '').split('.').filter((key: string) => labels.has(key));
        const grandTotal: boolean = header.type === 'grand sum' || !path.length;
        const totalKind: PivotTotalKind = grandTotal ? 'grandTotal' : (path.length < rowFields.length ? 'subtotal' : 'detail');
        const resultCells: { [key: string]: number } = {};
        cellsByColumn.forEach((identity: string, index: number) => {
            Reflect.set(resultCells, identity, cells.slice(index, index + 1)[0]?.value);
        });
        const row: PivotRow = { id: (grandTotal ? 'grandTotal' : path.join('.')) as PivotResultRowId,
            label: grandTotal ? 'Grand Total' : labels.get(path.slice(-1)[0]) || header.formattedText,
            path: path.map((key: string, pathIndex: number) => ({
                field: rowFields.slice(pathIndex, pathIndex + 1)[0],
                value: members.get(key)
            })),
            level: Math.max(0, path.length - 1), parentId: path.length > 1 ? path.slice(0, -1).join('.') as PivotResultRowId : undefined,
            hasChildren: !!header.hasChild, totalKind, grandTotal, cells: resultCells };
        for (const column of resultColumns) {
            if (settings.customAggregates?.some((item: PivotCustomAggregate) => item.name === column.measure.aggregateType)) {
                resultCells[column.id] = row.hasChildren && settings.showSubTotals === false ? undefined :
                    calculateCustomPivotValue(input, row.path, column.path, column.measure);
            }
        }
        return row;
    });
    return { rows, columns, resultColumns, resultGroups };
}

/**
 * Calculates a custom aggregate from the source rows that match the current pivot intersections.
 * Keeps non-additive summaries consistent for detail, subtotal, and grand total cells.
 *
 * @param {PivotInput<T>} input - Pivot projection and source data.
 * @param {PivotAxisPath} rowPath - Current row-axis path.
 * @param {PivotAxisPath} columnPath - Current column-axis path.
 * @param {PivotMeasureMetadata} measure - Target measure metadata.
 * @returns {number | undefined} Calculated custom summary value.
 */
export function calculateCustomPivotValue<T>(input: PivotInput<T>, rowPath: PivotAxisPath,
                                             columnPath: PivotAxisPath, measure: PivotMeasureMetadata): number | undefined {
    const definition: PivotCustomAggregate = input.settings.customAggregates?.find((item: PivotCustomAggregate) =>
        item.name === measure.aggregateType) as PivotCustomAggregate;
    const measureIndex: number = input.settings.values.findIndex((item: PivotValue<T>) => item.field === measure.field &&
        item.type === measure.aggregateType);
    const dimensions: string[] = [...input.rowFields, ...input.columnFields];
    const match: { field: string; key: string; }[] = [...rowPath, ...columnPath].map((item: PivotAxisPath[number]) => ({
        field: `d${dimensions.indexOf(item.field)}`, key: pivotMemberKey(item.value)
    }));
    const values: number[] = (input.report.dataSource as IDataSet[])
        .filter((record: IDataSet) => match.every((item: { field: string; key: string; }) => record[item.field] === item.key))
        .map((record: IDataSet) => record[`v${measureIndex}`])
        .filter((value: unknown): value is number => typeof value === 'number' && Number.isFinite(value));
    const result: number | undefined = definition.aggregate(values);
    if (result !== undefined && (typeof result !== 'number' || !Number.isFinite(result))) {
        throw pivotFailure('CalculationFailed', `${definition.name} must return a finite number or undefined.`);
    }
    return result;
}

/**
 * Existing synchronous, complete-result path.
 *
 * @param {*} data - data.
 * @param {*} sourceColumns - sourceColumns.
 * @param {*} settings - settings.
 * @param {*} host - host.
 * @returns {*} Result.
 */
export function buildPivotResult<T>(data: T[], sourceColumns: ColumnProps<T>[], settings: PivotSettings<T>, host: PivotHost): PivotResult {
    const input: PivotInput<T> = preparePivotInput(data, sourceColumns, settings);
    if (!input.report.dataSource.length) { return { rows: [], columns: [], resultColumns: [] }; }
    const engine: PivotEngine = createPivotEngine(host);
    engine.renderEngine(input.report, { ...host });
    return {...convertPivotResult(engine.pivotValues as IAxisSet[][], input),
        fieldTypes: getPivotEngineFieldTypes(engine, input)};
}

/**
 * Maps projected measure types back to the source fields.
 *
 * @param {PivotEngine} engine - Engine containing the projected field types.
 * @param {PivotInput<T>} input - Prepared input mapping measures to source fields.
 * @returns {Record<string, string>} Types indexed by source field name.
 */
export function getPivotEngineFieldTypes<T>(engine: PivotEngine, input: PivotInput<T>): Record<string, string> {
    const types: Record<string, string> = {};
    (input.settings.values || []).forEach((measure: PivotValue<T>, index: number) => {
        const type: string = engine.fieldList[`v${index}`]?.type;
        if (type) { types[measure.field] = type; }
    });
    return types;
}

/**
 * Sort siblings, retain totals at the end, then apply expansion before Grid paging.
 *
 * @param {*} rows - rows.
 * @param {*} expanded - expanded.
 * @param {*} sortField - sortField.
 * @param {*} descending - descending.
 * @param {PivotMemberSort[]} memberSorts - Sort directions for dimension members.
 * @returns {*} Result.
 */
export function visiblePivotRows(rows: PivotRow[], expanded: Set<string>, sortField?: string, descending: boolean = false,
                                 memberSorts: PivotMemberSort<unknown>[] = []): PivotRow[] {
    const compare: (x: string, y: string) => number = new Intl.Collator(undefined, { numeric: true }).compare;
    const groups: Map<string, PivotRow[]> = new Map();
    rows.forEach((row: PivotRow) => {
        const key: string = row.parentId || '';
        if (!groups.has(key)) { groups.set(key, []); }
        groups.get(key).push(row);
    });
    const output: PivotRow[] = [];
    const visit: (parent: string) => void = (parent: string): void => {
        const children: PivotRow[] = [...(groups.get(parent) || [])];
        children.sort((left: PivotRow, right: PivotRow) => {
            if (left.grandTotal !== right.grandTotal) { return left.grandTotal ? 1 : -1; }
            const a: unknown = readPivotField(left, sortField || 'label');
            const b: unknown = readPivotField(right, sortField || 'label');
            const order: number = typeof a === 'number' && typeof b === 'number' ? a - b : compare(String(a ?? ''), String(b ?? ''));
            const memberDirection: '' | 'Ascending' | 'Descending' = !sortField &&
                memberSorts.find((sort: PivotMemberSort<unknown>) =>
                    sort.field === left.path?.[left.path.length - 1]?.field)?.direction;
            return (memberDirection ? memberDirection === 'Descending' : descending) ? -order : order;
        });
        for (const row of children) { output.push(row); if (expanded.has(row.id)) { visit(row.id); } }
    };
    visit('');
    return output;
}
