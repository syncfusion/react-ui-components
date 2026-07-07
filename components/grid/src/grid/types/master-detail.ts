
import { ReactNode } from 'react';


/**
 * Provides parameters for rendering detail content in a master-detail row setup.
 * Defines the master row index and associated data object used to generate
 * detail templates such as nested grids or custom React elements.
 */
export interface DetailRowTemplateParams<T = unknown> {
    /**
     * Identifies the master row by its index value.
     */
    rowIndex: number;

    /**
     * Represents the complete data object for the master row.
     * Used to extract values for rendering detail content.
     */
    row: T;
}

/**
 * Represents a template function for rendering detail rows.
 * Returns React elements that define the complete detail content,
 * typically including a nested grid or custom components.
 *
 * @template T - Specifies the type of the master row data object.
 * @param params - Template parameters containing row index and row data.
 * @returns ReactNode representing the rendered detail content.
 *
 * @example
 * ```tsx
 * detailRowTemplate={(params) => (
 *   <div style={{ padding: '20px' }}>
 *     <h4>Order {params.rowIndex} Details</h4>
 *     <Grid
 *       dataSource={getDetailDataForOrder(params.row.orderId)}
 *       columns={detailColumns}
 *     />
 *   </div>
 * )}
 * ```
 */
export type DetailRowTemplate<T = unknown> = (params: DetailRowTemplateParams<T>) => ReactNode;

/**
 *
 * Provides event arguments for the `onRowExpand` handler.
 * Triggered when a master row is expanded to display detail content.
 */
export interface RowExpandEvent<T = unknown> {
    /**
     * Identifies the expanded row by its index value.
     */
    rowIndex: number;

    /**
     * Represents the complete data object for the expanded row.
     */
    data: T;

    /**
     * Indicates whether the current expand action should be canceled.
     */
    cancel?: boolean;
}

/**
 * Provides event arguments for the `onRowCollapse` handler.
 * Triggered when a master row is collapsed to hide detail content.
 */
export interface RowCollapseEvent<T = unknown> {
    /**
     * Identifies the collapsed row by its index value.
     */
    rowIndex: number;

    /**
     * Represents the complete data object for the collapsed row.
     */
    data: T;

    /**
     * Indicates whether the current collapse action should be canceled.
     */
    cancel?: boolean;
}
