import { ReactNode, ReactElement, ComponentType } from 'react';
import { AggregateType } from './enum';
import { DateFormatOptions, NumberFormatOptions } from '@syncfusion/react-base';
import { CellClassProps } from './column.interfaces';
import { Query } from '@syncfusion/react-data';

/**
 * Represents the structure of aggregate result values returned by the Data Grid component.
 * Includes raw numeric values for computation and formatted display values for rendering.
 *
 * Raw values are keyed by `field - type` (e.g., `Freight - sum` for summation on the "Freight" field).
 * Formatted values are keyed by `AggregateType` enum members (e.g., `Sum` for rendering summation results).
 *
 * Used in `footerTemplate` rendering and custom aggregation logic.
 *
 * @template T - Data model used for grid aggregate columns.
 *
 * @example
 * ```ts
 * {
 *   "Freight - sum": 1234.56,
 *   "Salary - max": 98000,
 *   Sum: "$1,234.56",
 *   Max: "$98,000"
 * }
 * ```
 */
export type AggregateData<T = unknown> = {
    [key in `${Extract<keyof T, string>} - ${Lowercase<AggregateType>}`]?: string | number;
} & {
    [type in AggregateType]?: string;
};

/**
 * Represents the input structure for the `customAggregate` function used in data grid aggregation.
 * Supports custom logic for computing aggregate values over a dataset.
 *
 * @template T - Data model used for aggregation.
 *
 * @example
 * ```ts
 * {
 *   query: { ... },
 *   count: 25,
 *   aggregates: {
 *     "Salary - max": 98000,
 *     Max: "$98,000"
 *   },
 *   result: [{ name: "John", salary: 98000 }, ...]
 * }
 * ```
 */
export interface CustomAggregateData<T = unknown> {
    /**
     * Metadata for the current aggregation context.
     * Includes filters, sort orders, or other query parameters.
     */
    query?: Query;

    /**
     * Total number of records considered for aggregation.
     */
    count?: number;

    /**
     * Pre-computed aggregated values keyed by `field - type` format.
     * Structure mirrors `AggregateData<T>`, including raw and formatted results.
     */
    aggregates?: AggregateData<T>;

    /**
     * Subset of records matching the `query` criteria.
     * Used as input for custom aggregate computation.
     */
    result?: T[];
}

/**
 * Defines the configuration properties for aggregate columns in grid component.
 * Specifies how data calculations are performed and displayed in summary rows.
 * Controls aggregation behavior including calculation types, display formatting, and custom functions.
 */
export interface AggregateColumnProps<T = unknown> {
    /**
     * Defines the `field` name from the data source for performing aggregate calculations.
     * Specifies which column `field` contains the data to be processed for summary operations.
     * Must correspond to an existing `field` in the grid's data source collection.
     *
     * @default -
     * @example
     * ```tsx
     * // Define field for price aggregation
     * <AggregateColumn field="price" type="Sum" />
     * ```
     */
    field?: string;

    /**
     * Defines the column name where calculated aggregate results will be displayed.
     * Specifies the target column for showing computed summary values in the grid.
     * Uses the `field` name as default when this property is not explicitly defined.
     *
     * @default -
     * @example
     * ```tsx
     * // Display results in summary column
     * <AggregateColumn field="price" columnName="summary" type="Sum" />
     * ```
     */
    columnName?: string;

    /**
     * Defines the aggregate calculation type to be applied on the column data.
     * Specifies one or multiple calculation methods for comprehensive data analysis.
     * Supports built-in types including `Sum`, `Average`, `Count`, `Min`, `Max`, and `Custom` calculations.
     *
     * @default -
     * @example
     * ```tsx
     * // Apply multiple aggregation types
     * <AggregateColumn field="quantity" type={["Sum", "Average"]} />
     * ```
     */
    type?: AggregateType | AggregateType[] | string | string[];

    /**
     * Defines the template for rendering aggregate values in grid footer cells.
     * Specifies custom content and formatting for displaying calculated results.
     * Accepts string templates, React elements, or functions for dynamic content generation.
     *
     * @default -
     * @example
     * ```tsx
     * // Custom footer template with formatting
     * <AggregateColumn
     *   field="price"
     *   type="Sum"
     *   footerTemplate={(props) => <strong>Total: ${props.Sum}</strong>}
     * />
     * ```
     */
    footerTemplate?: ComponentType<AggregateData<T>> | ReactElement | string;

    /**
     * Defines the format string applied to calculated aggregate values before display.
     * Specifies number or date formatting rules for presenting results in readable format.
     * Supports standard format strings and detailed `NumberFormatOptions` or `DateFormatOptions`.
     *
     * @default -
     * @example
     * ```tsx
     * // Apply currency formatting
     * <AggregateColumn field="price" type="Sum" format="C2" />
     * ```
     */
    format?: string | NumberFormatOptions | DateFormatOptions;

    /**
     * Defines the custom function for calculating aggregate values when using custom aggregation.
     * Specifies the calculation logic to be executed when the `type` property is set to `Custom`.
     * Enables implementation of specialized calculations beyond the standard built-in aggregate types.
     *
     * @default -
     * @example
     * ```tsx
     * // Define custom calculation function
     * <AggregateColumn
     *   field="Score"
     *   type="Custom"
     *   customAggregate={(data) => calculateWeightedAverage(data)}
     * />
     * ```
     */
    customAggregate?: string | ((data: CustomAggregateData<T>[] | CustomAggregateData<T>, column: AggregateColumnProps) => Object);
    /**
     * Applies a CSS class to individual aggregate cells either globally or conditionally.
     * Accepts a static class name or a callback function that returns a class name based on cell context.
     *
     * The callback receives a `CellClassProps` object with the following properties:
     * * `cellType` – Identifies the structural role of the cell: `Header`, `Content`, or `Aggregate`. Useful for styling header, data, or summary cells.
     * * `column` – The column configuration object associated with the aggregate cell.
     * * `data` – The full data object for the aggregate row, enabling conditional styling based on field values.
     * * `rowIndex` – The zero-based index of the row.
     *
     * @param props - Optional event payload containing cell type, column configuration, row data, and row index.
     * @returns A CSS class name string to apply to the aggregate cell.
     *
     * @default -
     *
     * @example
     * const GridComponent = () => {
     *   const handleAggregateCellClass = (props?: CellClassProps): string => {
     *     if (props?.cellType === CellType.Aggregate && props.column.field === 'Total') {
     *       return 'total-cell';
     *     }
     *     return '';
     *   };
     *
     *   return (
     *     <Grid dataSource={data}>
     *       <Aggregates>
     *         <AggregateRow>
     *           <AggregateColumn
     *             field="Total"
     *             type={['Sum']}
     *             cellClass={handleAggregateCellClass}
     *           />
     *         </AggregateRow>
     *       </Aggregates>
     *     </Grid>
     *   );
     * };
     */
    cellClass?: string | ((props?: CellClassProps<T>) => string);
}

/**
 * Defines the properties interface for aggregate row components in grid component.
 * Specifies configuration for rows containing calculated summary values and aggregate information.
 * Controls the collection of aggregate columns and child elements within summary rows.
 */
export interface AggregateRowProps {
    /**
     * Defines the array of aggregate column configurations for performing calculations on grid data.
     * Specifies which columns will have aggregate operations applied such as sum, average, count, or custom calculations.
     * Contains the complete set of column definitions that determine how summary values are computed and displayed.
     *
     * @default []
     */
    columns?: AggregateColumnProps[];

    /**
     * Defines the child elements to be rendered within the aggregate row structure.
     * Specifies React components or nodes for custom rendering of aggregate row content.
     * Enables advanced customization of how aggregate information is presented within the row.
     *
     * @default -
     * @private
     */
    children?: ReactNode;
}

/**
 * Defines the event interface for aggregate cell rendering operations in grid components.
 * Provides context information during the rendering process of individual aggregate cells.
 * Contains cell element, associated data, and column configuration for customization purposes.
 *
 * @private
 */
export interface AggregateCellRenderEvent<T = unknown> {
    /**
     * Defines the aggregate row data object containing all calculated summary values.
     * Specifies the complete set of aggregated information associated with the current cell.
     * Provides access to computed results for implementing custom rendering logic.
     *
     * @default {}
     */
    data: T;
    /**
     * Defines the DOM element representing the aggregate cell being rendered.
     * Specifies the actual HTML element that will display the aggregate value.
     * Enables direct manipulation of the cell element for advanced customization scenarios.
     *
     * @default null
     */
    cell: Element;
    /**
     * Defines the aggregate column configuration object associated with the current cell.
     * Specifies the column settings including field mapping, calculation type, and display properties.
     * Contains metadata necessary for understanding how the cell value was calculated and should be presented.
     *
     * @default {}
     */
    column: AggregateColumnProps;
}
/**
 * Defines the event interface for aggregate row rendering operations in grid components.
 * Provides comprehensive context during the rendering process of entire aggregate rows.
 * Contains row element, associated data, and dimensional information for layout customization.
 *
 * @private
 */
export interface AggregateRowRenderEvent<T = unknown> {
    /**
     * Defines the complete row data object containing all aggregate calculations for the current row.
     * Specifies the full set of summary values and calculated results associated with the row.
     * Provides access to all computed aggregate information for implementing custom row rendering logic.
     *
     * @default {}
     */
    data: T;
    /**
     * Defines the DOM element representing the aggregate row being rendered in the grid.
     * Specifies the actual HTML element that will contain all aggregate cells within the row.
     * Enables direct manipulation of the row element for advanced styling and layout customization.
     *
     * @default null
     */
    row: Element;
    /**
     * Defines the height dimension of the aggregate row in pixels.
     * Specifies the vertical space allocated for displaying the aggregate row content.
     * Controls the visual spacing and layout of aggregate information within the grid structure.
     *
     * @default -
     */
    rowHeight: number;
}

/**
 * Defines the function signature for custom aggregate calculation implementations.
 * Specifies the contract for functions that perform specialized summary operations on grid data.
 * Enables implementation of custom aggregation logic beyond standard built-in calculation types.
 *
 * @private
 */
export type CustomSummaryType<T> = (data: CustomAggregateData<T>[] | CustomAggregateData<T>, column: AggregateColumnProps<T>) => Object;
