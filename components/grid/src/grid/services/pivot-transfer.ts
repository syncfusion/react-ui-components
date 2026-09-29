import type { IDataSet } from '@syncfusion/pivot-engine';
import type { PivotInput } from './pivot-result';
import type { NumberFormatOptions, DateFormatOptions } from '@syncfusion/react-base';

interface NumericColumn { name: string; numbers: Float64Array; missing: Uint8Array; }
interface MemberColumn { name: string; ordinals: Uint32Array; members: IDataSet[string][]; }
export interface PivotTransfer { input: PivotInput<unknown>; count: number; columns: (NumericColumn | MemberColumn)[]; }

/**
 * All transfer buffers are newly allocated and owned by this adapter.
 *
 * @param {*} input - input.
 * @returns {*} Result.
 */
export function packPivotInput<T>(input: PivotInput<T>): { payload: PivotTransfer; transfer: ArrayBuffer[] } {
    const records: IDataSet[] = input.report.dataSource as IDataSet[];
    const transfer: ArrayBuffer[] = [];
    const columns: PivotTransfer['columns'] = [];
    for (const name of Object.keys(records[0] || {})) {
        const numeric: boolean = records.every((record: IDataSet) =>
            Reflect.get(record, name) == null || typeof Reflect.get(record, name) === 'number');
        if (numeric) {
            const numbers: Float64Array<ArrayBuffer> = new Float64Array(records.length);
            const missing: Uint8Array<ArrayBuffer> = new Uint8Array(records.length);
            records.forEach((record: IDataSet, i: number) => {
                const value: string | number | Date = Reflect.get(record, name);
                missing.set([value === undefined ? 1 : value === null ? 2 : 0], i);
                numbers.set([value as number], i);
            });
            columns.push({ name, numbers, missing });
            transfer.push(numbers.buffer as ArrayBuffer, missing.buffer as ArrayBuffer);
        } else {
            const ordinals: Uint32Array<ArrayBuffer> = new Uint32Array(records.length);
            const members: IDataSet[string][] = [];
            const lookup: Map<string | number | Date, number> = new Map<IDataSet[string], number>();
            records.forEach((record: IDataSet, i: number) => {
                const value: string | number | Date = Reflect.get(record, name);
                if (!lookup.has(value)) { lookup.set(value, members.length); members.push(value); }
                ordinals.set([lookup.get(value)], i);
            });
            columns.push({ name, ordinals, members });
            transfer.push(ordinals.buffer as ArrayBuffer);
        }
    }
    // Only conversion metadata crosses the worker boundary; templates and UI callbacks stay in React.
    const fields: {
        field: string;
        headerText: string;
        format: string | NumberFormatOptions | DateFormatOptions;
        width: string | number;
        minWidth: number;
    }[] = input.fields.map(({ field, headerText, format, width, minWidth }: PivotInput<T>['fields'][number]) =>
        ({ field, headerText, format, width, minWidth }));
    return { payload: { input: { ...input, fields, report: { ...input.report, dataSource: [] } },
        count: records.length, columns }, transfer };
}

/**
 * @param {*} payload - payload.
 * @returns {*} Result.
 */
export function unpackPivotInput(payload: PivotTransfer): PivotInput<unknown> {
    const records: IDataSet[] = Array.from({ length: payload.count }, () => ({}));
    for (const column of payload.columns) {
        for (let i: number = 0; i < records.length; i++) {
            const record: IDataSet = records.slice(i, i + 1)[0];
            let value: IDataSet[string];
            if ('numbers' in column) {
                const missing: number = column.missing.slice(i, i + 1)[0];
                value = missing === 1 ? undefined : missing === 2 ? null : column.numbers.slice(i, i + 1)[0];
            } else {
                const ordinal: number = column.ordinals.slice(i, i + 1)[0];
                value = column.members.slice(ordinal, ordinal + 1)[0];
            }
            Reflect.set(record, column.name, value);
        }
    }
    return { ...payload.input, report: { ...payload.input.report, dataSource: records } };
}
