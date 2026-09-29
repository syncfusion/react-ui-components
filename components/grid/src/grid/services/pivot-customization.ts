import { ColumnProps } from '../types/column.interfaces';
import { GridProps } from '../types/grid.interfaces';
import { PivotResultRow, PivotResultColumn } from '../types/pivot.interfaces';
import { PivotResult, PivotResultGroup } from './pivot-result';
import { isValidElement, ReactElement } from 'react';

const valueKeys: string[] = ['headerText', 'headerTemplate', 'template', 'format', 'width', 'minWidth', 'maxWidth',
    'textAlign', 'headerTextAlign', 'cellClass', 'customAttributes', 'visible', 'allowResize'];
const groupKeys: string[] = ['headerText', 'headerTemplate', 'headerTextAlign', 'customAttributes'];
const retainedKeys: string[] = ['width', 'minWidth', 'maxWidth', 'visible', 'pinDirection'];

/**
 * Copies definitions exposed to callbacks without sharing structural arrays.
 *
 * @param {ColumnProps} column - Source definition.
 * @returns {ColumnProps} Independent definition snapshot.
 */
function copyDefinition<T>(column: ColumnProps<T>): ColumnProps<T> {
    if (!column) { return undefined; }
    return {...column, ...(column.columns ? {columns: column.columns.map((child: ColumnProps<T>) => copyDefinition(child))} : {}),
        ...(column.customAttributes ? {customAttributes: {...column.customAttributes}} : {})};
}

/**
 * Applies presentation callbacks outside the engine and worker boundary.
 *
 * @param {PivotResult} result - Raw engine result and typed metadata.
 * @param {ColumnProps[]} sources - Source field definitions.
 * @param {Object} callbacks - Optional presentation callbacks.
 * @returns {ColumnProps[]} Customized copies with protected identities.
 */
export function customizePivotColumns<T>(result: PivotResult, sources: ColumnProps<T>[],
                                         callbacks: Pick<GridProps<T>, 'customizePivotColumn' | 'customizePivotColumnGroup'>
): ColumnProps<PivotResultRow>[] {
    const visit: (columns: ColumnProps<PivotResultRow>[]) => ColumnProps<PivotResultRow>[] =
        (columns: ColumnProps<PivotResultRow>[]): ColumnProps<PivotResultRow>[] => columns.map((column: ColumnProps<PivotResultRow>) => {
            const next: ColumnProps<PivotResultRow> = {...column};
            let overrides: object | undefined;
            if (column.columns?.length) {
                const metadata: PivotResultGroup = result.resultGroups?.find((item: PivotResultGroup) => item.id === column.uid);
                if (metadata && callbacks.customizePivotColumnGroup) {
                    const member: PivotResultGroup['path'][number] = metadata.path.slice(-1)[0];
                    overrides = callbacks.customizePivotColumnGroup({column: copyDefinition(column),
                        sourceColumn: copyDefinition(sources.find((source: ColumnProps<T>) => source.field === member?.field)),
                        field: member?.field, value: member?.value,
                        path: metadata.path.map((entry: PivotResultGroup['path'][number]) => ({...entry})),
                        level: Math.max(0, metadata.path.length - 1), totalKind: metadata.totalKind});
                }
                next.columns = visit(column.columns);
            } else {
                const metadata: PivotResultColumn = result.resultColumns.find((item: PivotResultColumn) =>
                    `cells.${item.id}` === column.field);
                if (metadata && callbacks.customizePivotColumn) {
                    overrides = callbacks.customizePivotColumn({column: copyDefinition(column),
                        sourceColumn: copyDefinition(sources.find((source: ColumnProps<T>) => source.field === metadata.measure.field)),
                        path: metadata.path.map((entry: PivotResultGroup['path'][number]) => ({...entry})),
                        measure: {...metadata.measure}, totalKind: metadata.totalKind});
                }
            }
            if (overrides) {
                (column.columns?.length ? groupKeys : valueKeys).forEach((key: string) => {
                    if (Object.prototype.hasOwnProperty.call(overrides, key)) { Reflect.set(next, key, Reflect.get(overrides, key)); }
                });
            }
            // Grid column comparison serializes definitions. Keep React elements (and
            // their owner fibers) behind the component-template boundary.
            if (isValidElement(next.template)) {
                const content: ReactElement = next.template;
                next.template = () => content;
            }
            if (isValidElement(next.headerTemplate)) {
                const content: ReactElement = next.headerTemplate;
                next.headerTemplate = () => content;
            }
            return next;
        });
    return visit(result.columns);
}

/**
 * Extracts actual presentation changes without treating callback defaults as user choices.
 *
 * @param {ColumnProps[]} previous - Last displayed definitions.
 * @param {ColumnProps[]} defaults - Last customized defaults.
 * @returns {ColumnProps[]} Identity/order skeleton containing only user adjustments.
 */
export function pivotUserPresentation(previous: ColumnProps<PivotResultRow>[], defaults: ColumnProps<PivotResultRow>[]
): ColumnProps<PivotResultRow>[] {
    return previous.map((column: ColumnProps<PivotResultRow>) => {
        const baseline: ColumnProps<PivotResultRow> = defaults.find((item: ColumnProps<PivotResultRow>) => item.uid === column.uid);
        const state: ColumnProps<PivotResultRow> = {uid: column.uid};
        retainedKeys.forEach((key: string) => {
            const value: unknown = Reflect.get(column, key);
            if (!baseline || value !== Reflect.get(baseline, key)) { Reflect.set(state, key, value); }
        });
        if (column.columns) { state.columns = pivotUserPresentation(column.columns, baseline?.columns || []); }
        return state;
    });
}
