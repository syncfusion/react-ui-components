import { ReactNode, createElement } from 'react';
import type { PivotAxisPath } from '../types/pivot-contracts';
import type { PivotCellContext, PivotResultColumn, PivotResultRow } from '../types/pivot.interfaces';

/**
 * Formats a pivot axis path into a single display line.
 *
 * @param {PivotAxisPath} path - Axis path segments.
 * @returns {string} Joined member labels.
 * @private
 */
export function formatPivotAxisPath(path: PivotAxisPath | undefined): string {
    if (!path?.length) {
        return '';
    }
    return path
        .map((segment: PivotAxisPath[number]) => {
            if (segment.value === null || segment.value === undefined || segment.value === '') {
                return '';
            }
            return String(segment.value);
        })
        .filter((label: string) => label.length > 0)
        .join(' - ');
}

/**
 * Formats a pivot measure value for tooltip display.
 *
 * @param {number | undefined} value - Aggregated cell value.
 * @param {string | undefined} format - Optional source-field format string.
 * @returns {string} Display text for the value.
 * @private
 */
export function formatPivotTooltipValue(value: number | undefined, format?: string): string {
    if (value === null || value === undefined || Number.isNaN(value as number)) {
        return '';
    }
    if (format && typeof Intl !== 'undefined') {
        try {
            // Prefer numeric locale formatting when a format string is present without a full formatter host.
            return new Intl.NumberFormat(undefined, { maximumFractionDigits: 20 }).format(value);
        } catch {
            return String(value);
        }
    }
    return String(value);
}

/**
 * Builds default EJ2-style multi-line tooltip content for a pivot value cell.
 *
 * @template T
 * @param {PivotCellContext} context - Hovered value cell context.
 * @param {string | undefined} measureHeader - Optional measure column caption.
 * @param {string | undefined} format - Optional numeric format from the measure field.
 * @param {string | undefined} displayValue - Value already formatted by the grid.
 * @param {string | undefined} columnCaption - Displayed column hierarchy, including total captions.
 * @param {string | undefined} rowCaption - Row hierarchy formatted using source Grid columns.
 * @returns {ReactNode} Default tooltip content.
 * @private
 */
export function buildDefaultPivotTooltipContent<T>(
    context: PivotCellContext<T>,
    measureHeader?: string,
    format?: string,
    displayValue?: string,
    columnCaption?: string,
    rowCaption?: string
): ReactNode {
    const rowLine: string = rowCaption ?? formatPivotAxisPath(context.row?.path);
    const columnMembers: string = columnCaption ?? formatPivotAxisPath(context.column?.path);
    const measureCaption: string = measureHeader
        || context.column?.measure?.field
        || '';
    const columnLine: string = [columnMembers, measureCaption].filter((part: string) => part.length > 0).join(' - ');
    const aggregate: string = context.column?.measure?.aggregateType === 'Avg'
        ? 'Average'
        : String(context.column?.measure?.aggregateType || 'Sum');
    const formattedValue: string = displayValue ?? formatPivotTooltipValue(context.value, format);
    const valueLine: string = `${aggregate} of ${measureCaption}: ${formattedValue}`;

    return createElement(
        'div',
        { className: 'sf-pivot-tooltip-content' },
        createElement('div', { className: 'sf-pivot-tooltip-row' }, `Row: ${rowLine || context.row?.label || 'Grand Total'}`),
        createElement('div', { className: 'sf-pivot-tooltip-column' }, `Column: ${columnLine || 'Grand Total'}`),
        createElement('div', { className: 'sf-pivot-tooltip-value' }, valueLine)
    );
}

/**
 * Resolves a pivot result column identity from a grid mapping uid.
 * Strips pin-section suffixes from group uids while preserving leaf identities.
 *
 * @param {string | null | undefined} mappingUid - Cell `data-mappinguid` value.
 * @returns {string} Normalized column identity.
 * @private
 */
export function normalizePivotMappingUid(mappingUid: string | null | undefined): string {
    if (!mappingUid) {
        return '';
    }
    const pinIndex: number = mappingUid.indexOf('::pin:');
    return pinIndex >= 0 ? mappingUid.slice(0, pinIndex) : mappingUid;
}

/**
 * Locates the pivot result column that matches a leaf mapping uid.
 *
 * @param {PivotResultColumn[]} resultColumns - Generated value columns.
 * @param {string | null | undefined} mappingUid - Cell mapping uid.
 * @returns {PivotResultColumn | undefined} Matching result column.
 * @private
 */
export function findPivotResultColumn(
    resultColumns: readonly PivotResultColumn[],
    mappingUid: string | null | undefined
): PivotResultColumn | undefined {
    const identity: string = normalizePivotMappingUid(mappingUid);
    if (!identity || identity === 'label' || identity.startsWith('g')) {
        return undefined;
    }
    return resultColumns.find((column: PivotResultColumn) => column.id === identity);
}

/**
 * Resolves a pivot result row from current view data by row id.
 *
 * @param {PivotResultRow[]} rows - Visible or full pivot result rows.
 * @param {string | null | undefined} rowId - Row identifier from the grid row model.
 * @returns {PivotResultRow | undefined} Matching result row.
 * @private
 */
export function findPivotResultRow(
    rows: readonly PivotResultRow[],
    rowId: string | null | undefined
): PivotResultRow | undefined {
    if (!rowId) {
        return undefined;
    }
    return rows.find((row: PivotResultRow) => row.id === rowId);
}
