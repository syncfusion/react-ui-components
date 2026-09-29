import { createPivotEngine } from '@syncfusion/pivot-engine';
import { getPivotEngineFieldTypes } from './pivot-result';
import type { PivotEngine, PivotHost, IAxisSet, HeaderCollection } from '@syncfusion/pivot-engine';
import type { ColumnProps } from '../types/column.interfaces';
import type { PivotResultColumn } from '../types/pivot.interfaces';
import { calculateCustomPivotValue, convertPivotResult, flattenPivotColumns, PivotInput, PivotResult, PivotRow, visiblePivotRows } from './pivot-result';
import type { PivotResultRow, PivotResultRowId } from '../types/pivot.interfaces';
import type { IFieldOptions, IField } from '@syncfusion/pivot-engine';
import type { PivotAxisPath, PivotTotalKind } from '../../../grid';
import type { PivotCustomAggregate } from '../types/pivot.interfaces';

export interface PivotWindow {
    skip: number;
    take: number;
    expanded: string[];
    defaultExpanded?: boolean;
    sortField?: string;
    descending?: boolean;
    virtual?: boolean;
}
export interface PivotPage extends PivotResult { count: number; skip: number; expanded: string[]; }

/** Owns projected records and full headers, while calculating only the requested cells. */
export class PivotSession<T> {
    private input: PivotInput<T>;
    private engine: PivotEngine;
    private headers: HeaderCollection;
    private rowHeaders: Map<string, IAxisSet> = new Map<string, IAxisSet>();
    private allRows: PivotRow[] = [];
    private expanded: Set<string> = new Set<string>();
    private columns: ColumnProps<PivotRow>[] = [];
    private resultColumns: PivotResultColumn[] = [];
    private resultGroups: PivotResult['resultGroups'] = [];
    private sortColumns: Map<string, {
        header: IAxisSet;
        measure: number;
    }> = new Map<string, { header: IAxisSet; measure: number }>();
    private orderKey: string;
    private ordered: PivotRow[] = [];
    private orderedHeaders: IAxisSet[] = [];

    constructor(input: PivotInput<T>, host: PivotHost) {
        this.input = input;
        if (!input.report.dataSource.length) { return; }
        this.engine = createPivotEngine(host);
        this.engine.renderEngine(input.report, { ...host, enablePaging: true,
            pageSettings: { rowPageSize: 1, columnPageSize: input.settings.maxGeneratedColumns ?? 200,
                currentRowPage: 1, currentColumnPage: 1 } });
        this.headers = this.engine.headerCollection;
        const visit: (headers: IAxisSet[]) => void = (headers: IAxisSet[]): void => {
            for (const header of headers) {
                const row: PivotResultRow = convertPivotResult([[header]], input).rows[0];
                if (row) { this.allRows.push(row); this.rowHeaders.set(row.id, header); }
                visit(header.members || []);
            }
        };
        visit(this.headers.rowHeaders);
        const initial: PivotResult = convertPivotResult(this.engine.pivotValues as IAxisSet[][], input);
        this.columns = initial.columns;
        this.resultColumns = initial.resultColumns;
        this.resultGroups = initial.resultGroups;
        const leaves: ColumnProps<PivotResultRow>[] = flattenPivotColumns(this.columns);
        const cells: IAxisSet[] = (this.engine.pivotValues as IAxisSet[][]).find((row: IAxisSet[]) => row?.[0]?.axis === 'row') || [];
        const findHeader: (headers: IAxisSet[], name: string) => IAxisSet = (headers: IAxisSet[], name: string): IAxisSet => {
            for (const header of headers) {
                if ((!name && header.type === 'grand sum') || String(header.valueSort?.levelName || '') === name) { return header; }
                const match: IAxisSet = findHeader(header.members || [], name);
                if (match) { return match; }
            }
            return undefined;
        };
        let index: number = 0;
        for (const cell of cells.slice(1)) {
            if (cell?.axis !== 'value') { continue; }
            const header: IAxisSet = findHeader(this.headers.columnHeaders, String(cell.columnHeaders || ''));
            const leaf: ColumnProps<PivotRow> = leaves.slice(index, index + 1)[0];
            if (header && leaf) {
                this.sortColumns.set(leaf.field, { header, measure: Number(String(cell.actualText).slice(1)) });
            }
            index++;
        }
    }

    page(window: PivotWindow): PivotPage {
        if (!this.engine) { return { rows: [], columns: [], resultColumns: [], count: 0, skip: 0, expanded: [] }; }
        const orderKey: string = JSON.stringify([window.expanded, window.defaultExpanded, window.sortField, window.descending]);
        if (orderKey !== this.orderKey) {
            const expanded: Set<string> = new Set(window.expanded);
            this.expanded = new Set(this.allRows
                .filter((row: PivotResultRow) => window.defaultExpanded ? !expanded.has(row.id) : expanded.has(row.id))
                .map((row: PivotResultRow) => row.id));
            const sortColumn: {
                header: IAxisSet;
                measure: number;
            } = this.sortColumns.get(window.sortField);
            const identity: string = window.sortField?.startsWith('cells.') ? window.sortField.slice(6) : undefined;
            const sortable: PivotResultRow[] = this.allRows.map((row: PivotResultRow) => {
                if (!sortColumn || !identity) { return row; }
                const header: IAxisSet = this.rowHeaders.get(row.id);
                const measure: IFieldOptions = this.input.report.values[sortColumn.measure];
                const metadata: PivotResultColumn | undefined = this.resultColumns.find(
                    (column: PivotResultColumn) => column.id === identity
                );
                const custom: boolean = this.input.settings.customAggregates?.some((item: PivotCustomAggregate) =>
                    item.name === metadata?.measure.aggregateType) || false;
                const field: IField = Reflect.get(this.engine.fieldList, measure.name);
                const value: number = row.hasChildren && this.input.settings.showSubTotals === false ? undefined : custom ?
                    calculateCustomPivotValue(this.input, row.path, metadata.path, metadata.measure) :
                    this.engine.getAggregateValue(
                        header.index,
                        sortColumn.header.indexObject,
                        field.index ?? 0,
                        measure.type,
                        false
                    );
                return { ...row, cells: { [identity]: value } };
            });
            // This is the existing adapter comparator, applied globally before engine slicing.
            this.ordered = visiblePivotRows(sortable, this.expanded, window.sortField, window.descending);
            this.orderedHeaders = this.ordered.map((row: PivotResultRow) => ({
                ...this.rowHeaders.get(row.id),
                members: [],
                isDrilled: false
            }));
            this.orderKey = orderKey;
        }
        const count: number = this.ordered.length;
        const take: number = Math.max(1, Math.floor(window.take));
        const skip: number = Math.min(Math.max(0, Math.floor(window.skip)), Math.max(0, Math.ceil(count / take) - 1) * take);
        this.engine.pageSettings.rowPageSize = take;
        this.engine.pageSettings.currentRowPage = Math.floor(skip / take) + 1;
        this.engine.enablePaging = !window.virtual;
        this.engine.enableVirtualization = !!window.virtual;
        const collection: HeaderCollection = { ...this.headers, rowHeaders: this.orderedHeaders, rowHeadersCount: count };
        this.engine.headerCollection = collection;
        this.engine.generateGridData(this.input.report, false, false, collection, true);
        const result: PivotResult = convertPivotResult(this.engine.pivotValues as IAxisSet[][], this.input);
        const byId: Map<PivotResultRowId, PivotResultRow> = new Map(result.rows.map((row: PivotResultRow) => [row.id, row]));
        const rows: ({
            hasChildren: true;
            cells: {
                [k: string]: number | undefined;
            };
            id: PivotResultRowId;
            label: string;
            path: PivotAxisPath;
            level: number;
            parentId?: PivotResultRowId;
            totalKind: PivotTotalKind;
            grandTotal: boolean;
        } | {
            hasChildren: boolean;
            id: PivotResultRowId;
            label: string;
            path: PivotAxisPath;
            level: number;
            parentId?: PivotResultRowId;
            totalKind: PivotTotalKind;
            grandTotal: boolean;
            cells: Readonly<Record<string, number | undefined>>;
        })[] = this.ordered.slice(skip, skip + take).map((meta: PivotResultRow) => {
            const row: PivotResultRow = byId.get(meta.id);
            if (!row) { throw new Error('The engine paging window did not contain an expected row.'); }
            if (meta.hasChildren && this.input.settings.showSubTotals === false) {
                return { ...row, hasChildren: meta.hasChildren,
                    cells: Object.fromEntries(Object.keys(row.cells).map((key: string) => [key, undefined])) };
            }
            return { ...row, hasChildren: meta.hasChildren };
        });
        return { rows, columns: this.columns, resultColumns: this.resultColumns, resultGroups: this.resultGroups,
            fieldTypes: getPivotEngineFieldTypes(this.engine, this.input), count, skip,
            expanded: rows.filter((row: {
                hasChildren: true;
                cells: {
                    [k: string]: number | undefined;
                };
                id: PivotResultRowId;
                label: string;
                path: PivotAxisPath;
                level: number;
                parentId?: PivotResultRowId;
                totalKind: PivotTotalKind;
                grandTotal: boolean;
            } | {
                hasChildren: boolean;
                id: PivotResultRowId;
                label: string;
                path: PivotAxisPath;
                level: number;
                parentId?: PivotResultRowId;
                totalKind: PivotTotalKind;
                grandTotal: boolean;
                cells: Readonly<Record<string, number | undefined>>;
            }) => this.expanded.has(row.id)).map((row: {
                hasChildren: true;
                cells: {
                    [k: string]: number | undefined;
                };
                id: PivotResultRowId;
                label: string;
                path: PivotAxisPath;
                level: number;
                parentId?: PivotResultRowId;
                totalKind: PivotTotalKind;
                grandTotal: boolean;
            } | {
                hasChildren: boolean;
                id: PivotResultRowId;
                label: string;
                path: PivotAxisPath;
                level: number;
                parentId?: PivotResultRowId;
                totalKind: PivotTotalKind;
                grandTotal: boolean;
                cells: Readonly<Record<string, number | undefined>>;
            }) => row.id) };
    }
}
