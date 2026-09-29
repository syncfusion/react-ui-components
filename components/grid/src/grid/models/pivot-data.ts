import { DataManager, Query, Predicate } from '@syncfusion/react-data';
import { GridProps } from '../types/grid.interfaces';
import { ColumnProps } from '../types/column.interfaces';
import { FilterSettings } from '../types/filter.interfaces';
import { SearchSettings } from '../types/search.interfaces';
import { getPredicate } from '../utils/utils';
import { pivotFailure } from '../services/pivot-result';
import { filterPivotMembers } from '../services/pivot-members';
import type { PivotSettings } from '../types/pivot.interfaces';
import type { DataResponse } from '../../../grid';
import type { FilterPredicates } from '../types/filter.interfaces';
import type { PivotMemberFilter } from '../types/pivot.interfaces';

/**
 * Complete-source branch: filtering/search precede pivot aggregation; source paging is never applied.
 *
 * @param {*} props - props.
 * @param {*} fields - fields.
 * @param {*} filter - filter.
 * @param {*} search - search.
 * @returns {*} Result.
 */
export function selectPivotSource<T>(props: Partial<GridProps<T>>, fields: ColumnProps<T>[],
                                     filter: FilterSettings, search: SearchSettings): T[] {
    const source: DataManager | DataResponse | T[] = props.dataSource;
    let records: T[];
    if (Array.isArray(source)) { records = source as T[]; }
    else if (source instanceof DataManager && (!source.dataSource.url || source.dataSource.offline === true)) {
        records = source.dataSource.json as T[];
    } else if (source == null && !props.onDataRequest) { records = []; }
    else { throw pivotFailure('UnsupportedDataSource', 'Pivot mode requires a complete local array or offline DataManager.'); }
    if (props.onDataRequest) { throw pivotFailure('UnsupportedDataSource', 'Custom paged data requests are not supported in pivot mode.'); }
    const mode: string = props.virtualizationSettings?.scrollMode;
    const enginePaging: boolean = !!props.pivotSettings?.useEnginePaging || props.pivotSettings?.execution === 'worker';
    if ((mode && mode !== 'Auto' && !(enginePaging && mode === 'Virtual')) ||
        (props.virtualizationSettings?.enabled === true && !enginePaging)) {
        throw pivotFailure('UnsupportedScrollMode', 'Use Auto scrolling without virtualization, with optional local result paging in pivot mode.');
    }
    const query: Query = props.query?.clone() || new Query();
    if (query.queries.some((operation: { fn: string }) => !['onWhere', 'onSearch', 'onSortBy'].includes(operation.fn))) {
        throw pivotFailure('UnsupportedDataSource', 'Pivot source queries may filter, search, or sort complete records; paging and grouping are result operations.');
    }
    if (filter?.enabled && filter.columns?.length) {
        const predicates: Predicate = getPredicate(filter.columns.map((column: FilterPredicates) => ({ ...column })), true);
        query.where(Predicate.and(Object.keys(predicates).map((key: string) => Reflect.get(predicates, key))));
    }
    if (search?.enabled && search.value) {
        query.search(search.value, search.fields || fields.map((column: ColumnProps<T>) => column.field).filter(Boolean),
                     search.operator || 'contains', search.caseSensitive ?? true, search.ignoreAccent ?? false);
    }
    // Query count wrappers are deliberately not propagated to the pivot calculator.
    query.isCountRequired = false;
    return filterPivotMembers(new DataManager(records || []).executeLocal(query) as T[],
                              props.pivotSettings?.memberFilters, fields.map((column: ColumnProps<T>) => column.field));
}

/**
 * Options ignore their own UI filter, but retain all other source constraints.
 *
 * @param {*} props - props.
 * @param {*} fields - fields.
 * @param {*} filter - filter.
 * @param {*} search - search.
 * @param {*} settings - settings.
 * @param {*} field - field.
 * @returns {*} Result.
 */
export function selectPivotMemberDomain<T>(props: Partial<GridProps<T>>, fields: ColumnProps<T>[], filter: FilterSettings,
                                           search: SearchSettings, settings: PivotSettings<T>, field: string): {all: T[]; available: T[]} {
    const all: T[] = selectPivotSource({...props, pivotSettings: {...settings, memberFilters: []}}, fields, {}, {});
    const available: T[] = selectPivotSource({...props, pivotSettings: {...settings,
        memberFilters: (settings.memberFilters || []).filter((item: PivotMemberFilter<T>) => item.field !== field)}}, fields,
                                             {...filter, columns: (filter.columns || []).filter((item: FilterPredicates) =>
                                                 item.field !== field)}, search);
    return {all, available};
}
