import { ROW_HEIGHT } from '../services/EventService';

export interface ViewDimensions {
    cellHeight: number;
    cellWidth?: number;
}

/**
 * Measures the actual cell dimensions from the DOM.
 *
 * This utility function dynamically reads the actual rendered cell height
 * from the DOM (from `.sf-time-slots` or `.sf-work-cells-row` elements)
 * instead of relying on a hardcoded constant. This ensures accurate
 * positioning when CSS customizations are applied to cell dimensions.
 *
 * @param {HTMLElement | null} schedulerRef - Reference to the scheduler element
 * @returns {ViewDimensions} The measured dimensions object with cellHeight and optional cellWidth
 *
 */
export function getCellDimensions(schedulerRef: HTMLElement | null): ViewDimensions {
    if (!schedulerRef) {
        return { cellHeight: ROW_HEIGHT };
    }
    let cellElement: Element | null = schedulerRef.querySelector('.sf-time-slots');
    if (!cellElement) {
        cellElement = schedulerRef.querySelector('.sf-work-cells-row');
    }
    if (cellElement && cellElement instanceof HTMLElement) {
        const cellHeight: number = cellElement.clientHeight;
        if (cellHeight > 0) {
            return { cellHeight };
        }
    }
    return { cellHeight: ROW_HEIGHT };
}
