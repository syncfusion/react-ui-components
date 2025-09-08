import { Query, DataManager } from '@syncfusion/react-data';

/**
 * Custom hook to initialize a DataManager and Query based on the provided data source and query.
 *
 * @param {Object | DataManager} dataSource - The data source object or an instance of DataManager.
 * @param {Query} query - An optional instance of Query to be used with the data source.
 * @returns {Object} An object containing the following:
 *   - dataManager {DataManager} - The initialized DataManager instance.
 *   - query {Query} - The initialized Query instance.
 *   - generateQuery {Function} - Function to generate a new Query.
 *   - getData {Function} - Function to execute a query and get data.
 */
export const useData: (dataSource?: Object | DataManager, query?: Query) => {
    dataManager: DataManager;
    query: Query;
    generateQuery: () => Query;
    getData: (dataQuery: Query) => Promise<Object>;
} = (dataSource?: Object | DataManager, query?: Query) => {
    const initDataManager: (dataSource: Object | DataManager, query: Query) => {
        dataManager: DataManager;
        dataQuery: Query;
    } = (dataSource: Object | DataManager, query: Query) => {
        const dataManager: DataManager = dataSource instanceof DataManager ? dataSource : new DataManager(dataSource);
        const dataQuery: Query = query instanceof Query ? query : new Query();
        return { dataManager, dataQuery };
    };

    const { dataManager, dataQuery } = initDataManager(dataSource || {}, query || new Query());

    const generateQuery: () => Query = (): Query => {
        return dataQuery.clone();
    };

    const getData: (dataQuery: Query) => Promise<Object> = (dataQuery: Query): Promise<Object> => {
        return dataManager.executeQuery(dataQuery);
    };

    return {
        dataManager,
        query: dataQuery,
        generateQuery,
        getData
    };
};
