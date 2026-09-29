import { ReactElement, useEffect, useMemo, useState } from 'react';
import {
    Accordion,
    AccordionContent,
    AccordionHeader,
    AccordionIndicator,
    AccordionPanel,
    AccordionTrigger
} from '@syncfusion/react-navigations';
import { ColumnProps } from '../types/column.interfaces';
import { ExcelFilterArgs, FilterPredicates } from '../types/filter.interfaces';
import { GridRef } from '../types/grid.interfaces';
import { MutableGridSetter } from '../types/interfaces';
import { useGridComputedProvider, useGridMutableProvider } from '../contexts/GridProviders';
import { ExcelFilter } from './common/Excel-CheckBox-filter';
import { FilterType } from '../types/enum';
import { DataManager } from '@syncfusion/react-data';
import { FilterActiveIcon } from '@syncfusion/react-icons/src/icons/filter-active';

// Event dispatched on the grid root when a header-originated filter dialog opens
const HEADER_FILTER_OPEN_EVENT: string = 'sf-header-filter-open';

const getColumnKey: (column: Partial<ColumnProps>) => string =
    (column: Partial<ColumnProps>): string => column.field || column.uid;
export const getColumnLabel: (column: Partial<ColumnProps>) => string =
    (column: Partial<ColumnProps>): string => column.headerText || column.field || column.uid || '';
const isFilterEnabled: (column: Partial<ColumnProps>) => boolean =
    (column: Partial<ColumnProps>): boolean => column.allowFilter !== false && !!getColumnKey(column);

const FilterToolPanel: () => ReactElement = (): ReactElement => {
    const grid: Partial<GridRef> & Partial<MutableGridSetter> = useGridComputedProvider();
    const { filterModule, currentViewData } = useGridMutableProvider();
    const [expandedPanels, setExpandedPanels] = useState<string[]>([]);
    const columns: ColumnProps[] = useMemo(
        () => (grid.getColumns?.()).filter(isFilterEnabled),
        [grid.getColumns]
    );
    const activeFilters: FilterPredicates[] = filterModule?.filterSettings?.columns;

    const createFilterOptions: (column: ColumnProps) => ExcelFilterArgs =
        (column: ColumnProps): ExcelFilterArgs => {
            const resolvedFilterType: FilterType | string = column.filter?.type === 'FilterBar' ? 'Menu' : column.filter?.type;
            const resolvedColumnType: string = column.type ?? 'string';
            const dataManager: DataManager = grid.dataSource instanceof DataManager
                ? grid.dataSource
                : new DataManager(grid.dataSource as Object[]);
            // Resolve the column's header cell so ExcelFilter can read `aria-sort`
            // to disable the sort entry matching the current sort direction.
            const headerCell: HTMLElement | null = grid.element instanceof HTMLElement
                ? grid.element.querySelector(`th[data-mappinguid="${column.uid}"], th:has([data-mappinguid="${column.uid}"])`)
                : null;
            return {
                filterType: resolvedFilterType,
                type: column.type,
                field: column.field,
                column,
                columns,
                dataSource: grid.dataSource,
                dataManager,
                filteredColumns: activeFilters,
                parentCurrentViewDataCount: currentViewData?.length,
                parentElement: grid.element,
                target: headerCell ?? grid.element,
                query: grid.query?.clone?.(),
                cssClass: grid.cssClass,
                handler: filterModule?.filterHandler,
                serviceLocator: grid.serviceLocator,
                id: `${grid.id}_${getColumnKey(column)}`,
                loadingIndicator: grid.filterSettings?.loadingIndicator,
                operators: filterModule?.customOperators?.[`${resolvedColumnType}Operator`] ??
                    filterModule?.customOperators?.stringOperator,
                ignoreAccent: grid.filterSettings?.ignoreAccent,
                caseSensitive: grid.filterSettings?.caseSensitive,
                enableSort: grid.sortSettings?.enabled,
                disableSearchOption: column.filter?.hideSearchbox,
                disableSortOption: false,
                enableHtmlSanitizer: grid.enableHtmlSanitizer,
                mode: grid.filterSettings?.mode,
                immediateModeDelay: grid.filterSettings?.immediateModeDelay,
                height: 360,
                isRemote: false
            };
        };

    const handleAccordionChange: (event: { value: Array<string | number> }) => void =
            (event: { value: Array<string | number> }): void => {
                setExpandedPanels(event.value.map((value: string | number) => String(value)));
            };

    /**
     * Collapses the matching column's accordion item when a header-originated
     * filter dialog opens, keeping a single active filter editor per column.
     */
    useEffect(() => {
        const element: HTMLElement | null = grid.element instanceof HTMLElement ? grid.element : null;
        if (!element) {
            return undefined;
        }
        const handleHeaderFilterOpen: (event: Event) => void = (event: Event): void => {
            const detail: { columnKey?: string } | null =
                (event as CustomEvent<{ columnKey?: string }>).detail;
            const columnKey: string = detail?.columnKey;
            if (!columnKey) {
                return;
            }
            setExpandedPanels((current: string[]): string[] =>
                current.includes(columnKey) ? current.filter((value: string) => value !== columnKey) : current);
        };
        element.addEventListener(HEADER_FILTER_OPEN_EVENT, handleHeaderFilterOpen);
        return (): void => {
            element.removeEventListener(HEADER_FILTER_OPEN_EVENT, handleHeaderFilterOpen);
        };
    }, [grid.element]);

    return (
        <div className='sf-grid-filter-tool-panel' data-panel-id='filters'>
            <div className='sf-grid-filter-tool-panel-list'>
                <Accordion multiple={true} value={expandedPanels} renderMode='All' onChange={handleAccordionChange}>
                    {columns.map((column: ColumnProps) => {
                        const field: string = getColumnKey(column);
                        const label: string = getColumnLabel(column);
                        const isFiltered: boolean = activeFilters.some((filter: FilterPredicates) =>
                            filter.field === column.field || (!column.field && filter.uid === column.uid));
                        return (
                            <AccordionPanel key={field} value={field}>
                                <AccordionHeader>
                                    <AccordionTrigger>
                                        <div className='sf-grid-filter-tool-panel-header'>
                                            <AccordionIndicator />
                                            {label}
                                            {isFiltered && <span className='sf-grid-filter-tool-panel-filtered-icon' aria-label='Filtered'>
                                                <FilterActiveIcon color='#4285F4' />
                                            </span>}
                                        </div>
                                    </AccordionTrigger>
                                </AccordionHeader>
                                <AccordionContent>
                                    {expandedPanels.includes(field) && <ExcelFilter
                                        isOpen={true}
                                        embedded={true}
                                        options={createFilterOptions(column)}
                                        onCancel={() => setExpandedPanels((current: string[]) =>
                                            current.filter((value: string) => value !== field))}
                                    />}
                                </AccordionContent>
                            </AccordionPanel>
                        );
                    })}
                </Accordion>
            </div>
        </div>
    );
};

export { FilterToolPanel };
