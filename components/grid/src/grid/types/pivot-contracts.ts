/**
 * Defines the path of a generated pivot member within a row or column hierarchy.
 * Each segment identifies the source field and member value that produced the current hierarchy node.
 * Used by pivot result rows and columns to preserve typed member identity for rendering and interaction.
 *
 * @example
 * ```ts
 * [{ field: 'Country', value: 'United States' }, { field: 'Year', value: 2026 }]
 * ```
 */
export type PivotAxisPath = Array<{
    /**
     * Identifies the source field that produced the hierarchy segment.
     */
    field: string;
    /**
     * Stores the member value carried by the hierarchy segment.
     * Preserves the original scalar value so numeric, boolean, date, and string members remain distinct.
     */
    value: unknown;
}>;

/**
 * Represents the scalar value carried by a generated pivot member identity.
 * The value is opaque to the Grid contract so member comparison and filtering remain independent of the source record type.
 */
export type PivotMemberValue = unknown;

/**
 * Defines metadata for a generated pivot measure column in the final result matrix.
 * Describes the generated column identity, source field, and aggregate used to calculate its value.
 *
 * @example
 * ```ts
 * { id: 'm1', field: 'Sales', aggregateType: 'Sum' }
 * ```
 */
export type PivotMeasureMetadata = {
    /** Identifies the generated measure column. */
    id: string;
    /** Identifies the source field consumed by the aggregate. */
    field: string;
    /** Identifies the aggregate applied to the source field. */
    aggregateType: 'Sum' | 'Count' | 'Min' | 'Max' | 'Average' | 'Avg' | string;
};

/**
 * Identifies the total state for a generated pivot row or column.
 * A detail entry represents a leaf member, a subtotal represents an intermediate group, and a grand total represents the complete report.
 */
export type PivotTotalKind = 'detail' | 'subtotal' | 'grandTotal';
