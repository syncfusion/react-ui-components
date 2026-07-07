import { memo, useCallback, JSX } from 'react';
import { ChevronRightIcon, DragAndDropIcon, SortAscendingListIcon, SortDescendingListIcon } from '@syncfusion/react-icons';
import { Chip, ChipDeleteEvent } from '@syncfusion/react-buttons';
import { SortDirection } from '../types/enum';
import { useGridComputedProvider, useGridMutableProvider } from '../contexts';
import { ColumnProps, IGroupModule } from '../types';
import { IL10n } from '@syncfusion/react-base';

/** CSS class constants for GroupDropArea */
const CSS_DROP_AREA: string = 'sf-group-drop-area';
const CSS_DROP_HINT: string = 'sf-group-drop-hint';
const CSS_GROUP_CHIP_CONTAINER: string = 'sf-group-chip-container';
const CSS_GROUP_CHIP_TEMPLATE: string = 'sf-group-chip-template';
const CSS_CHIP_SELECTOR: string = '.sf-chip';
const CSS_ASCENDING_CLASS: string = 'sf-ascending';
const CSS_DESCENDING_CLASS: string = 'sf-descending';

/**
 * Props for the GroupDropArea component.
 *
 * @private
 */
export interface GroupDropAreaProps {
    /**
     * Array of field names currently in the grouping hierarchy (ordered).
     *
     */
    groupColumns: ColumnProps[];

    /**
     * Optional CSS class name for custom styling of the group drop area container.
     */
    cssClass?: string;

    /**
     * Callback fired when user clicks the ungroup (close) button on a group chip.
     *
     * @param field - Field name to remove from grouping
     */
    onUngroupColumn?: IGroupModule['ungroupColumn'];

    /**
     * Current sort direction for each grouped column.
     *
     * Key = field name, value = sort direction.
     */
    sortDirections?: Record<string, SortDirection | string>;
}

/**
 * GroupDropArea renders the drag-drop zone displayed above the grid table
 * when `groupSettings.showDropArea = true`.
 *
 * Shows group chips for each grouped column with sort toggle and ungroup button.
 * Shows a hint text when no columns are grouped.
 *
 * @component
 * @private
 * @remarks
 * - ATOMIC: No separate GroupItem component; group items rendered inline per ATOMIC principle.
 * - No DataManager instantiation.
 * - Methods exposed via parent Grid.tsx; this component is purely presentational.
 *
 * @example
 * ```tsx
 * <GroupDropArea
 *   groupColumns={['ShipCountry', 'CustomerID']}
 *   onUngroupColumn={(field) => gridRef.current.ungroupColumn(field)}
 *   sortDirections={{ ShipCountry: 'Ascending', CustomerID: 'Descending' }}
 * />
 * ```
 */
export const GroupDropArea: React.NamedExoticComponent<GroupDropAreaProps> = memo(function GroupDropArea({
    groupColumns,
    cssClass,
    onUngroupColumn,
    sortDirections
}: GroupDropAreaProps): JSX.Element {
    const { groupSettings, id, serviceLocator, element } = useGridComputedProvider();
    const { groupModule } = useGridMutableProvider();
    const localization: IL10n = serviceLocator?.getService<IL10n>('localization');

    /**
     * Handle ungroup click on a chip.
     */
    const handleUngroupClick: (event: ChipDeleteEvent) => void = useCallback((event: ChipDeleteEvent): void => {
        onUngroupColumn?.([event.data.value as string]);
        const ungroupActionComplete: () => void = () => {
            requestAnimationFrame(() => {
                const firstChip: HTMLDivElement = groupModule?.groupDropAreaRef?.current?.querySelector(CSS_CHIP_SELECTOR);
                if (firstChip) {
                    firstChip?.focus();
                } else {
                    groupModule?.groupDropAreaRef?.current?.focus();
                }
            });
            element.removeEventListener('actionComplete', ungroupActionComplete);
        };
        element.addEventListener('actionComplete', ungroupActionComplete);
    }, [onUngroupColumn]);

    const hasGroupedColumns: boolean = groupColumns.length > 0;

    return (
        <div
            ref={groupModule?.groupDropAreaRef}
            className={CSS_DROP_AREA + (cssClass ? ` ${cssClass}` : '')}
            tabIndex={!hasGroupedColumns ? 0 : -1}
            role="region"
            aria-label={localization?.getConstant('groupDropAreaLabel')}
        >
            {!hasGroupedColumns ? (
                <span
                    className={CSS_DROP_HINT}
                >
                    {localization?.getConstant('groupDropAreaHintText')}
                </span>
            ) : groupColumns.map((column: ColumnProps, index: number) => {
                return <div className={CSS_GROUP_CHIP_CONTAINER} key={id + `_${column?.field}_` + '_chip_container_' + index}>
                    {(index > 0 && groupSettings?.allowReorder ? <ChevronRightIcon /> : <></>)}
                    <Chip
                        removable={true}
                        value={column?.field}
                        text={column?.field}
                        leadingIcon={groupSettings?.allowReorder ? <DragAndDropIcon /> : undefined}
                        onDelete={handleUngroupClick}
                    >
                        <div
                            className={CSS_GROUP_CHIP_TEMPLATE}
                            data-mappinguid={column?.uid}
                        >
                            {column?.headerText}{sortDirections?.[column?.field] === 'Ascending' ?
                                <SortAscendingListIcon className={CSS_ASCENDING_CLASS} /> :
                                <SortDescendingListIcon className={CSS_DESCENDING_CLASS} />}
                        </div>
                    </Chip>
                </div>;
            })}
        </div>
    );
});

/**
 * Set display name for debugging purposes
 */
GroupDropArea.displayName = 'GroupDropArea';
