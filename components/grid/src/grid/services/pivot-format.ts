import { ColumnProps } from '../types/column.interfaces';
import { IValueFormatter } from '../types/interfaces';
import { PivotAxisPath } from '../types/pivot-contracts';
import { setStringFormatter } from '../utils/utils';

/**
 * Creates a Grid formatter for pivot member captions without changing their identities.
 *
 * @param {ColumnProps[]} columns - Source Grid columns.
 * @param {IValueFormatter} formatter - Locale-aware Grid formatting service.
 * @returns {Function} Formats the final member of an axis path.
 */
export function createPivotMemberFormatter<T>(columns: ColumnProps<T>[], formatter: IValueFormatter):
(path: PivotAxisPath, fallback: string) => string {
    const formats: Map<string, Function> = new Map();
    return (path: PivotAxisPath, fallback: string): string => {
        const member: PivotAxisPath[number] = path?.[path.length - 1];
        if (!member || member.value == null) { return fallback; }
        const column: ColumnProps<T> = columns.find((item: ColumnProps<T>) => item.field === member.field);
        if (column?.format == null || !(member.value instanceof Date || typeof member.value === 'number')) { return fallback; }
        const type: string = !column.type || column.type === 'string' ?
            (member.value instanceof Date ? 'date' : 'number') : column.type;
        const key: string = `${member.field}:${type}`;
        if (!formats.has(key)) {
            formats.set(key, typeof column.format === 'string' ? setStringFormatter(formatter, type, column.format) :
                formatter.getFormatFunction({...column.format}));
        }
        const format: Function = formats.get(key);
        return format ? String(formatter.toView(member.value as number | Date, format)) : fallback;
    };
}
