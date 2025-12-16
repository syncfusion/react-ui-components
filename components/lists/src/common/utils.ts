import { isNullOrUndefined, getValue, extend } from '@syncfusion/react-base';
import { Query, QueryOptions } from '@syncfusion/react-data';
import { DataManager } from '@syncfusion/react-data';
import { defaultMappedFields } from './listItems';
import { FieldsMapping, SortOrder } from './types';

/**
 * Groups the data source based on the specified fields and sort order.
 *
 * @param {{Object}[]} dataSource - The data source to group.
 * @param {FieldsMapping} fields - The fields configuration for grouping.
 * @param {SortOrder} sortOrder - Optional sort order for the grouped data.
 * @returns {Object[]} An array of grouped data objects.
 */
export function groupDataSource(
    dataSource: { [key: string]: Object }[],
    fields: FieldsMapping,
    sortOrder: SortOrder = SortOrder.None
): { [key: string]: Object }[] {
    const curFields: FieldsMapping = extend({}, defaultMappedFields, fields);
    let cusQuery: Query = new Query().group(curFields.groupBy as string);
    cusQuery = addSorting(sortOrder, 'key', cusQuery);
    const ds: { [key: string]: Object }[] = getData(dataSource, cusQuery);
    const groupedData: { [key: string]: Object }[] = [];
    ds.forEach((group: { [key: string]: Object }) => {
        const groupItem: { [key: string]: Object } = {};
        groupItem[curFields.text as string] = (group as { key: string } & { [key: string]: Object }).key;
        groupItem['isHeader'] = true;
        let newtext: string = curFields.text as string;
        if (newtext === 'id') {
            newtext = 'text';
            Object.assign(groupItem, { 'text': group.key });
        }
        groupItem['_id'] = `group-list-item-${(group as { [key: string]: Object }).key ?
            (group as { [key: string]: Object }).key.toString().trim() : 'undefined'}`;
        groupItem['items'] = (group as { items: { [key: string]: Object }[] } & { [key: string]: Object }).items;
        groupedData.push(groupItem);
        groupedData.push(...(group as { items: { [key: string]: Object }[] } & { [key: string]: Object }).items);
    });

    return groupedData;
}

/**
 * Adds sorting to a query based on the specified sort order and field.
 *
 * @param {SortOrder} sortOrder - The sort order to apply.
 * @param {string} sortBy - The field to sort by.
 * @param {Query} query - Optional existing query to add sorting to.
 * @returns {Query} The query with added sorting.
 */
export function addSorting(sortOrder: SortOrder, sortBy: string, query: Query = new Query()): Query {
    const safeQuery: Query = query instanceof Query ? query : new Query();
    if (sortOrder === 'Ascending') {
        safeQuery.sortBy(sortBy, 'ascending', true);
    } else if (sortOrder === 'Descending') {
        safeQuery.sortBy(sortBy, 'descending', true);
    } else if (safeQuery.queries) {
        safeQuery.queries = safeQuery.queries.filter((q: QueryOptions) => q.fn !== 'onSortBy');
    }
    return safeQuery;
}

/**
 * Executes a query on the data source.
 *
 * @param {{Object}[]} dataSource - The data source to query.
 * @param {Query} query - The query to execute.
 * @returns {Object[]} The result of the query execution.
 */
export function getData(dataSource: { [key: string]: Object }[], query: Query): { [key: string]: Object }[] {
    if (!dataSource || !query) {
        return [];
    }
    return new DataManager(dataSource).executeLocal(query) as { [key: string]: Object }[];
}

/**
 * Gets the field values from a data item based on the specified fields mapping.
 *
 * @param {Object} dataItem - The data item to extract field values from.
 * @param {FieldsMapping} fields - The fields mapping configuration.
 * @returns {Object|string|number} An object containing the extracted field values, or the original data item if it's a primitive value.
 */
export function getFieldValues(dataItem: { [key: string]: Object } | string | number | boolean, fields: FieldsMapping)
    : { [key: string]: Object } | string | number | boolean {
    const fieldData: { [key: string]: Object } = {};
    if (isNullOrUndefined(dataItem)) {
        return dataItem;
    }
    else if (typeof dataItem === 'string' || typeof dataItem === 'number' || typeof dataItem === 'boolean') {
        const stringValue: string = dataItem.toString();
        fieldData[fields.text || 'text'] = stringValue;
        fieldData[fields.value || 'value'] = dataItem;
        return fieldData;
    }
    else if (!isNullOrUndefined((dataItem as { [key: string]: Object }).isHeader)) {
        return dataItem;
    }
    else {
        for (const field of Object.keys(fields)) {
            if (Object.prototype.hasOwnProperty.call(fields, field)) {
                const dataField: string = fields[field as keyof FieldsMapping] as string;
                const value: { [key: string]: Object } = !isNullOrUndefined(dataField) &&
                    typeof (dataField) === 'string' ? getValue(dataField, dataItem) : undefined;
                if (!isNullOrUndefined(value) && typeof dataField === 'string' && dataField.trim()) {
                    fieldData[dataField as string] = value;
                }
            }
        }
        if (!fields.text && fields.value && !isNullOrUndefined(getValue(fields.value, dataItem))) {
            const valueField: string = fields.value;
            const valueData: string = getValue(valueField, dataItem);
            fieldData['text'] = valueData;
        }
    }
    return fieldData;
}
