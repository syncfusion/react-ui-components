import { PivotMemberFilter } from '../types/pivot.interfaces';
import { pivotFailure, pivotMemberKey, readPivotField } from './pivot-result';

export interface PivotMemberOption { key: string; label: string; }

/**
 * Complete-source member identities; labels never participate in equality.
 *
 * @param {*} records - records.
 * @param {*} field - field.
 * @param {*} blankLabels - blankLabels.
 * @param {*} blankLabels.null - blankLabels.null.
 * @param {*} blankLabels.undefined - blankLabels.undefined.
 * @param {*} blankLabels.empty - blankLabels.empty.
 * @returns {*} Result.
 */
export function pivotMemberOptions<T>(records: readonly T[], field: string,
                                      blankLabels: {
                                          null: string;
                                          undefined: string;
                                          empty: string;
                                      } = {null: '(Null)', undefined: '(Undefined)', empty: '(Empty)'}): PivotMemberOption[] {
    const members: Map<string, {
        label: string;
        type: string;
    }> = new Map<string, {label: string; type: string}>();
    for (const record of records) {
        const value: unknown = readPivotField(record, field);
        const label: string = value === null ? blankLabels.null : value === undefined ? blankLabels.undefined : value === '' ? blankLabels.empty :
            value instanceof Date ? value.toISOString() : String(value);
        members.set(pivotMemberKey(value), {label, type: value instanceof Date ? 'date' : typeof value});
    }
    const counts: Map<string, number> = new Map<string, number>();
    members.forEach((item: {
        label: string;
        type: string;
    }) => counts.set(item.label, (counts.get(item.label) || 0) + 1));
    return [...members].map(([key, item]: [string, { label: string; type: string }]) =>
        ({key, label: (counts.get(item.label) || 0) > 1 ? `${item.label} (${item.type})` : item.label}))
        .sort((a: {
            key: string;
            label: string;
        }, b: {
            key: string;
            label: string;
        }) => a.label.localeCompare(b.label));
}

/**
 * @param {*} records - records.
 * @param {*} filters - filters.
 * @param {*} fields - fields.
 * @returns {*} Result.
 */
export function filterPivotMembers<T>(records: T[], filters: readonly PivotMemberFilter<T>[] = [], fields: readonly string[]): T[] {
    const seen: Set<string> = new Set<string>();
    const selections: {
        field: (string & {}) | Extract<keyof T, string>;
        keys: Set<string>;
    }[] = filters.map((filter: PivotMemberFilter<T>) => {
        if (!fields.includes(filter.field)) { throw pivotFailure('InvalidField', `Unknown pivot member filter field: ${filter.field}`); }
        if (seen.has(filter.field) || !Array.isArray(filter.memberKeys) || filter.memberKeys.some((key: string) => typeof key !== 'string')) {
            throw pivotFailure('InvalidSettings', 'Use one member filter per field with an array of member keys.');
        }
        seen.add(filter.field);
        return {field: filter.field, keys: new Set(filter.memberKeys)};
    });
    return selections.length ? records.filter((record: T) => selections.every((selection: {
        field: (string & {}) | Extract<keyof T, string>;
        keys: Set<string>;
    }) => selection.keys.has(pivotMemberKey(readPivotField(record, selection.field))))) : records;
}

/**
 * Select-all-matching changes only the visible popup options.
 *
 * @param {*} selected - selected.
 * @param {*} matching - matching.
 * @param {*} checked - checked.
 * @returns {*} Result.
 */
export function updatePivotMemberSelection(
    selected: ReadonlySet<string>, matching: readonly PivotMemberOption[], checked: boolean
): Set<string> {
    const next: Set<string> = new Set(selected);
    matching.forEach((member: PivotMemberOption) => { if (checked) { next.add(member.key); } else { next.delete(member.key); } });
    return next;
}

/**
 * Removed members are pruned against the complete domain, not other filters' visible subset.
 *
 * @param {*} filters - filters.
 * @param {*} records - records.
 * @returns {*} Result.
 */
export function reconcilePivotMemberFilters<T>(filters: readonly PivotMemberFilter<T>[], records: readonly T[]): PivotMemberFilter<T>[] {
    return filters.map((filter: PivotMemberFilter<T>) => {
        const domain: Set<string> = new Set(records.map((record: T) => pivotMemberKey(readPivotField(record, filter.field))));
        return {...filter, memberKeys: filter.memberKeys.filter((key: string) => domain.has(key))};
    });
}
