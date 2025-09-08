import { ReactNode, ReactElement } from 'react';
import { AggregateType } from './enum';
import { DateFormatOptions, NumberFormatOptions } from '@syncfusion/react-base';
import { ColumnProps } from './column.interfaces';

/**
 * Defines the configuration properties for aggregate columns in grid component.
 * Specifies how data calculations are performed and displayed in summary rows.
 * Controls aggregation behavior including calculation types, display formatting, and custom functions.
 */
export interface AggregateColumnProps {
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
    footerTemplate?: string | ReactElement | ((props?: Object) => ReactElement | string);

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
    customAggregate?: string | ((data: Object[] | Object, column: AggregateColumnProps) => Object);
    /**
     * Defines the CSS class name  for styling aggregate cells based on data context.
     * Specifies custom styling rules that are applied to individual aggregate cells during rendering.
     * Enables conditional styling based on column details, row data, and aggregate values.
     *
     * @param props - Contains column configuration, complete aggregate row data, and row index information.
     * @returns A CSS class name string to apply to the aggregate cell.
     *
     * @default -
     * @example
     * ```tsx
     * const GridComponent = () => {
     *   const handleAggregateCellClass = (args: AggregateCellClassEvent) => {
     *     return args.column.field === 'Total' ? 'total-cell' : '';
     *   };
     *
     *   return (
     *     <Grid dataSource={data}>
     *       <Aggregates>
     *         <AggregateRow>
     *           <AggregateColumn field='Total' type={['Sum']} aggregateCellClass={handleAggregateCellClass}/>
     *         </AggregateRow>
     *       </Aggregates>
     *     </Grid>
     *   );
     * };
     * ```
     */
    aggregateCellClass?: string | ((props?: AggregateCellClassEvent) => string);
}

/**
 * Defines the event interface for applying custom CSS classes to aggregate cells.
 * Provides comprehensive context information including column details, row data, and positioning details.
 * Enables conditional styling of aggregate cells based on calculated values and column properties.
 */
export interface AggregateCellClassEvent {
    /**
     * Defines the column configuration object containing properties.
     * Specifies information about the target aggregate column including field mapping and display settings.
     * Contains essential details for identifying which column is being processed for styling operations.
     *
     * @defaut -
     */
    column: ColumnProps;

    /**
     * Defines the complete data object representing the entire aggregate row being processed.
     * Contains all calculated aggregate values and summary information for the current row.
     * Provides access to computed results for implementing conditional styling logic.
     *
     * @defaut -
     */
    rowData: Object;

    /**
     * Defines the numeric index indicating the position of the aggregate row within the grid structure.
     * Specifies whether the row represents a footer summary, group summary, or other aggregate row type.
     * Enables position-specific styling rules and visual hierarchy implementation.
     *
     * @defaut -
     */
    rowIndex: number;
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
     * @defaut -
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
export interface AggregateCellRenderEvent {
    /**
     * Defines the aggregate row data object containing all calculated summary values.
     * Specifies the complete set of aggregated information associated with the current cell.
     * Provides access to computed results for implementing custom rendering logic.
     *
     * @default {}
     */
    rowData: Object;
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
export interface AggregateRowRenderEvent {
    /**
     * Defines the complete row data object containing all aggregate calculations for the current row.
     * Specifies the full set of summary values and calculated results associated with the row.
     * Provides access to all computed aggregate information for implementing custom row rendering logic.
     *
     * @default {}
     */
    rowData: Object;
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
export type CustomSummaryType = (data: Object[] | Object, column: AggregateColumnProps) => Object;
