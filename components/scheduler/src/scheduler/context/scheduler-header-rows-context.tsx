import { createContext, useContext, FC, ReactNode, useMemo, Context, RefObject, useRef } from 'react';
import { useSchedulerPropsContext } from './scheduler-context';
import { useSchedulerRenderDatesContext } from './scheduler-render-dates-context';
import { useProviderContext } from '@syncfusion/react-base';
import { HeaderService } from '../services/HeaderService';
import { HeaderRowConfig } from '../types/scheduler-types';
import { CellData, HeaderRowGroup } from '../types/internal-interface';

/**
 * Value exposed by the SchedulerHeaderRowsContext.
 *
 * @private
 */
export interface SchedulerHeaderRowsType {
    /**
     * Last-level header cells — the header-side equivalent of resource-grouping.
     * Work-cell formation iterates this track instead of raw `renderDates`.
     */
    headerLastLevel: CellData[];

    /**
     * Year/Month/Week grouping metadata for the active header rows, keyed by option.
     * share the same precomputed groups without re-invoking the hook logic.
     */
    allHeaderGroups: { Year?: HeaderRowGroup[]; Month?: HeaderRowGroup[]; Week?: HeaderRowGroup[] } | null;

    /** Holds actual header rows. */
    actualHeaderRows: HeaderRowConfig[];

    /**
     * Mutable ref the timeline view writes its measured content height to, so other
     * views (e.g. month) can read the timeline content height without re-measuring.
     */
    schedulerContentHeight: RefObject<number | null>;
}

/** @private */
const SchedulerHeaderRowsContext: Context<SchedulerHeaderRowsType | null> =
    createContext<SchedulerHeaderRowsType | null>(null);

/**
 * SchedulerHeaderRowsProvider — publishes the timeline header last-row
 * `CellData[]` (finest track for work cells) plus Year/Month/Week groups.
 *
 * @param {ReactNode} props.children - Child components.
 * @returns {JSX.Element} React component that provides the header-track context.
 *
 * @private
 */
export const SchedulerHeaderRowsProvider: FC<{ children: ReactNode }> = ({
    children
}: { children: ReactNode }) => {
    const { viewType, startHour, endHour, timeScale, headerRows, weekRule, firstDayOfWeek, workDays } = useSchedulerPropsContext();
    const { renderDates } = useSchedulerRenderDatesContext();
    const { locale = 'en-US' } = useProviderContext();
    const schedulerContentHeight: RefObject<number | null> = useRef<number | null>(null);

    const value: SchedulerHeaderRowsType = useMemo<SchedulerHeaderRowsType>(() => {
        const actualHeaderRows: HeaderRowConfig[] = headerRows?.length > 0 ? headerRows :
            ((viewType !== 'TimelineMonth' && timeScale?.enable) ? [{ option: 'Date' }, { option: 'Hour' }] : [{ option: 'Date' }]);
        const allHeaderGroups: { Year?: HeaderRowGroup[]; Month?: HeaderRowGroup[]; Week?: HeaderRowGroup[] } | null =
            HeaderService.buildAllHeaderGroups(actualHeaderRows, renderDates, locale, weekRule, firstDayOfWeek);
        const headerLastLevel: CellData[] = HeaderService.buildHeaderLastLevelCells(
            renderDates, headerRows, viewType, locale, startHour, endHour, timeScale, allHeaderGroups, workDays
        );

        return {
            headerLastLevel, allHeaderGroups, actualHeaderRows, schedulerContentHeight
        };
    }, [
        headerRows, weekRule, firstDayOfWeek, startHour, endHour,
        timeScale, renderDates, viewType, locale, workDays,
        schedulerContentHeight
    ]);

    return (
        <SchedulerHeaderRowsContext.Provider value={value}>
            {children}
        </SchedulerHeaderRowsContext.Provider>
    );
};

/**
 * Hook to safely access the scheduler header-track context.
 *
 * @returns {SchedulerHeaderRowsType | null} Context value or null when
 * used outside a provider.
 *
 * @private
 */
export function useSchedulerHeaderRowsContext(): SchedulerHeaderRowsType | null {
    return useContext(SchedulerHeaderRowsContext);
}

export default SchedulerHeaderRowsContext;
