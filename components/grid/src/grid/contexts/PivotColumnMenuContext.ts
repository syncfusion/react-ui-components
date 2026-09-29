import { createContext } from 'react';
import type { ColumnProps } from '../types/column.interfaces';
import type { Context, ReactElement, RefObject } from 'react';

/** Internal menu adapter keeps derived-row commands outside ordinary Grid logic. */
export interface PivotColumnMenuHostProps {
    column: ColumnProps;
    position: {top: number; left: number} | null;
    targetRef?: RefObject<HTMLElement>;
    onClose(): void;
}
export const PivotColumnMenuContext: Context<(props: PivotColumnMenuHostProps) => ReactElement> =
    createContext<((props: PivotColumnMenuHostProps) => ReactElement) | null>(null);
