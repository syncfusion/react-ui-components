import { RefObject } from 'react';
import { DragEvent } from '@syncfusion/react-base';
import { ContentTableRef } from './interfaces';

/**
 * Provides the row reordering handler set returned by the module factory.
 *
 * @template T - Data record type for the grid data source.
 */
export type RowReorderModuleType<T = unknown> = (
    contentTableRef: RefObject<ContentTableRef<T>>
) => {
    dragHelper: (args: { sender?: MouseEvent & TouchEvent }) => HTMLElement | null;
    dragStart: (args: DragEvent) => void;
    drag: (args: DragEvent) => void;
    dragStop: (args: DragEvent) => Promise<void>;
};

/**
 * Provides event arguments for row drag-and-drop reordering events.
 * Carries dragged records, source and target indices, the native event, and row elements.
 *
 * @template T - Data record type for the grid data source.
 */
export interface RowDragEventArgs<T = unknown> {
    /**
     * Data records associated with the dragged rows.
     *
     * @type {T[]}
     */
    data: T[];

    /**
     * Zero-based target row index, or `-1` when no valid target exists.
     *
     * @type {number}
     */
    dropIndex: number;

    /**
     * Zero-based source row index.
     *
     * @type {number}
     */
    fromIndex: number;

    /**
     * Native mouse event associated with the drag action.
     *
     * @type {MouseEvent}
     */
    originalEvent: MouseEvent;

    /**
     * DOM row elements included in the drag operation.
     *
     * @type {Element[]}
     */
    rows: Element[];

    /**
     * Row element under the pointer at the time of the event.
     *
     * @type {Element | null}
     */
    target: Element | null;
}
