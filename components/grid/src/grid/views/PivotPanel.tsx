import type { CSSProperties, RefObject, KeyboardEvent as ReactKeyboardEvent, MouseEvent as ReactMouseEvent } from 'react';
import type { IL10n } from '@syncfusion/react-base';
import { formatUnit } from '@syncfusion/react-base/src/util';
import type { SwitchChangeEvent } from '@syncfusion/react-buttons';
import type { TextBoxChangeEvent } from '@syncfusion/react-inputs';
import type { TreeExpansionEvent, TreeSelectionEvent, TreeItemTemplateContext,
    AccordionChangeEvent } from '@syncfusion/react-navigations';
import type { ColumnProps } from '../types/column.interfaces';
import type { PivotFieldCapability } from '../services/pivot-controls';
import type { PivotMemberOption } from '../services/pivot-members';
import type { PivotMemberSort, PivotAggregateType, PivotMemberFilter as PivotMemberFilterType } from '../types/pivot.interfaces';
import type { PivotCustomAggregate } from '../types/pivot.interfaces';
import { ReactElement, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Button, Size, Variant } from '@syncfusion/react-buttons/src/button';
import { Switch } from '@syncfusion/react-buttons/src/switch';
import { Chip } from '@syncfusion/react-buttons/src/chip/chip';
import { Draggable, DragEvent } from '@syncfusion/react-base/src/draggable';
import { TextBox, Variant as InputVariant } from '@syncfusion/react-inputs/src/textbox';
import { SearchIcon } from '@syncfusion/react-icons/src/icons/search';
import { GripVerticalIcon } from '@syncfusion/react-icons/src/icons/grip-vertical';
import { MoreVerticalFilledIcon } from '@syncfusion/react-icons/src/icons/more-vertical-filled';
import { SumIcon } from '@syncfusion/react-icons/src/icons/sum';
import { RowGroupicon as RowGroupIcon } from '@syncfusion/react-icons/src/icons/row-group';
import { ColumnsIcon } from '@syncfusion/react-icons/src/icons/columns';
import { ChevronLeftIcon } from '@syncfusion/react-icons/src/icons/chevron-left';
import { ChevronRightIcon } from '@syncfusion/react-icons/src/icons/chevron-right';
import { Tooltip } from '@syncfusion/react-popups/src/tooltip';
import { Accordion, AccordionContent, AccordionHeader, AccordionIndicator, AccordionPanel,
    AccordionTrigger } from '@syncfusion/react-navigations/src/accordion';
import { TreeView, TreeViewNodes, TreeViewNode, TreeViewItemToggle, TreeViewItemCheckbox,
    TreeViewItemLabel } from '@syncfusion/react-navigations/src/tree-view';
import { usePivotPanel } from '../hooks/usePivotPanel';
import { applyPivotControlCommand, createPivotLocalization, getPivotFieldCapabilities, PivotControlAxis,
    PivotControlAction, PivotControlCommand } from '../services/pivot-controls';
import { pivotFieldTree, pivotPanelColumns, pivotTreeLeaves, PivotFieldNode } from '../services/pivot-field-tree';
import { PivotColumnMenu, PivotColumnMenuItem } from './PivotColumnMenu';
import { PivotMemberFilter } from './PivotMemberFilter';
import { PivotPanelProps, PivotValue } from '../types/pivot.interfaces';
interface FieldAction { field: string; axis?: PivotControlAxis; index?: number; }
interface DropTarget { axis: PivotControlAxis; index: number; valid: boolean; command: PivotControlCommand; }
const axes: PivotControlAxis[] = ['rows', 'values', 'columns'];

/**
 * Syncfusion field catalogue and assignment controls for a relational pivot report.
 *
 * @param {PivotPanelProps} props - Panel settings and callbacks.
 * @returns {ReactElement} Pivot configuration panel.
 */
export function PivotPanel<T>(props: PivotPanelProps<T>): ReactElement {
    const height: string = formatUnit(props.height ?? 'auto');
    const {columns, columnChildren, settings, locale, enableRtl, onChange, getMemberData, sortingEnabled = true,
        filteringEnabled = true} = props;
    const searchId: string = useId();
    const panel: RefObject<HTMLElement> = useRef<HTMLElement>(null);
    const localization: IL10n = useMemo(() => createPivotLocalization(locale), [locale]);
    const text: (key: string) => string = (key: string): string => localization.getConstant(key);
    const hierarchy: ColumnProps<T>[] = useMemo(() => pivotPanelColumns(columns, columnChildren), [columns, columnChildren]);
    const capabilities: PivotFieldCapability<T>[] = useMemo(() => getPivotFieldCapabilities(hierarchy, settings, props.fieldTypes),
                                                            [hierarchy, settings, props.fieldTypes]);
    const {draft, dirty, dispatch, apply, cancel} = usePivotPanel(settings, capabilities, onChange);
    const [search, setSearch] = useState('');
    const [collapsed, setCollapsed] = useState(false);
    const [expanded, setExpanded] = useState<string[]>([]);
    const [sections, setSections] = useState<string[]>(axes);
    const [menu, setMenu] = useState<{action: FieldAction; anchor: HTMLElement}>();
    const [drop, setDrop] = useState<DropTarget>();
    const [filterField, setFilterField] = useState<{field: string; anchor: HTMLElement}>();
    const memberData: { allKeys: string[]; options: PivotMemberOption[]; error?: string; } = useMemo(() => filterField &&
        getMemberData?.(filterField.field, draft), [filterField, getMemberData, draft]);
    useEffect(() => { setFilterField(undefined); }, [settings, collapsed, draft.enabled]);
    const cancelled: RefObject<boolean> = useRef(false);
    const dragging: RefObject<boolean> = useRef(false);
    const preview: RefObject<HTMLElement> = useRef<HTMLElement>(undefined);
    const clearPreview: () => void = (): void => { preview.current?.remove(); preview.current = undefined; };
    const tree: PivotFieldNode[] = useMemo(() => pivotFieldTree(hierarchy, search, locale), [hierarchy, search, locale]);
    const leaves: PivotFieldNode[] = useMemo(() => pivotTreeLeaves(tree), [tree]);
    const axisItems: (axis: PivotControlAxis) => (string | PivotValue<T>)[] =
        (axis: PivotControlAxis): (string | PivotValue<T>)[] => axis === 'values' ? draft.values || [] : (axis === 'rows' ?
            draft.rows : draft.columns) || [];
    const caption: (field: string) => string = (field: string): string =>
        capabilities.find((item: PivotFieldCapability<T>) => item.field === field)?.caption || field;
    const axisLabel: (axis: PivotControlAxis) => string = (axis: PivotControlAxis): string => text(axis === 'rows' ?
        'pivotRows' : axis === 'values' ? 'pivotValues' : 'pivotColumnLabels');
    const assigned: (field: string) => boolean = (field: string): boolean => !!draft.rows?.includes(field) ||
        !!draft.columns?.includes(field) ||
        !!draft.values?.some((value: PivotValue<T>) => value.field === field);
    const selectedIds: string[] = capabilities.filter((item: PivotFieldCapability<T>) =>
        assigned(item.field)).map((item: PivotFieldCapability<T>) => item.field);
    const groups: (nodes: PivotFieldNode[]) => string[] = (nodes: PivotFieldNode[]): string[] =>
        nodes.flatMap((node: PivotFieldNode) => node.children ? [node.id, ...groups(node.children)] : []);
    useEffect(() => {
        const key: (event: KeyboardEvent) => void = (event: KeyboardEvent): void => {
            if (event.key === 'Escape' && dragging.current) { cancelled.current = true; clearPreview(); setDrop(undefined); }
        };
        const abort: () => void = (): void => { cancelled.current = true; dragging.current =
            false; clearPreview(); setDrop(undefined); };
        document.addEventListener('keydown', key, true);
        window.addEventListener('blur', abort);
        document.addEventListener('touchcancel', abort, true);
        document.addEventListener('pointercancel', abort, true);
        return () => {
            cancelled.current = true; dragging.current = false; clearPreview();
            document.removeEventListener('keydown', key, true);
            window.removeEventListener('blur', abort);
            document.removeEventListener('touchcancel', abort, true);
            document.removeEventListener('pointercancel', abort, true);
        };
    }, []);
    useEffect(() => { cancelled.current = true; clearPreview(); setMenu(undefined); setDrop(undefined); }, [settings,
        collapsed, draft.enabled]);
    const focusField: (field: string) => void = (field: string): void => {
        requestAnimationFrame(() => {
            const target: HTMLElement = Array.from(panel.current?.querySelectorAll<HTMLElement>('[data-field-action]') || [])
                .find((item: HTMLElement) => item.dataset.fieldAction === field);
            (target || panel.current?.querySelector<HTMLElement>('input'))?.focus({preventScroll: true});
        });
    };
    const execute: (command: PivotControlCommand, field?: string) => void = (command: PivotControlCommand, field?: string): void => {
        dispatch(command);
        if (field) { focusField(field); }
    };
    const targetFor: (action: FieldAction, event: DragEvent) => DropTarget = (action: FieldAction, event: DragEvent): DropTarget => {
        const pointer: (MouseEvent & TouchEvent) | Touch = event.event?.changedTouches?.[0] || event.event;
        const target: Element = event.target || (pointer && document.elementFromPoint?.(pointer.clientX, pointer.clientY));
        const section: HTMLElement = target?.closest<HTMLElement>('[data-pivot-axis]');
        if (!section || !panel.current?.contains(section)) { return undefined; }
        const axis: PivotControlAxis = section.dataset.pivotAxis as PivotControlAxis;
        const chip: HTMLElement = target.closest<HTMLElement>('[data-pivot-index]');
        const rect: DOMRect = chip?.getBoundingClientRect();
        const index: number = chip ? Number(chip.dataset.pivotIndex) + (pointer &&
            pointer.clientY > rect.top + rect.height / 2 ? 1 : 0) : axisItems(axis).length;
        const command: PivotControlCommand = action.axis ? {type: 'transfer', axis: action.axis, from: action.index,
            target: axis, index} :
            {type: 'add', axis, field: action.field, index};
        let valid: boolean = false;
        try { valid = applyPivotControlCommand(draft, command, capabilities) !== draft; } catch { /* Ineligible drop. */ }
        return {axis, index, valid, command};
    };
    const draggable: (action: FieldAction, child: ReactElement) => ReactElement = (action: FieldAction,
                                                                                   child: ReactElement): ReactElement => <Draggable clone handle=".sf-pivot-drag-handle" distance={5}
        helper={() => {
            clearPreview();
            const helper: HTMLDivElement = document.createElement('div');
            helper.className = 'sf-pivot-drag-preview';
            helper.textContent = caption(action.field);
            document.body.appendChild(helper);
            preview.current = helper;
            return helper;
        }}
        onDragStart={() => { dragging.current = true; cancelled.current = false; setMenu(undefined); }}
        onDrag={(event: DragEvent) => { if (!cancelled.current) { setDrop(targetFor(action, event)); } }}
        onDragStop={(event: DragEvent) => {
            try {
                const destination: DropTarget = targetFor(action, event);
                if (!cancelled.current && destination?.valid) { execute(destination.command, action.field); }
            } finally {
                clearPreview(); dragging.current = false; setDrop(undefined);
            }
        }}>{child}</Draggable>;
    const actionButton: (action: FieldAction) => ReactElement = (action: FieldAction): ReactElement => <Button size=
        {Size.Small} variant={Variant.Standard}
    className="sf-pivot-action" data-field-action={action.field} aria-label={text('pivotFieldActions').replace('{0}', caption(action.field))}
    onKeyDown={(event: ReactKeyboardEvent<HTMLButtonElement>) => event.stopPropagation()}
    aria-haspopup="menu" onClick={(event: ReactMouseEvent<HTMLButtonElement>) =>
    { event.stopPropagation(); setMenu({action, anchor: event.currentTarget}); }}>
        <span aria-hidden="true"><MoreVerticalFilledIcon/></span></Button>;
    const menuItems: () => PivotColumnMenuItem[] = (): PivotColumnMenuItem[] => {
        if (!menu) { return []; }
        const {field, axis, index} = menu.action;
        const info: PivotFieldCapability<T> = capabilities.find((item: PivotFieldCapability<T>) => item.field === field);
        const items: PivotColumnMenuItem[] = axes.filter((target: PivotControlAxis) =>
            target !== axis).map((target: PivotControlAxis) => {
            const command: PivotControlCommand = axis ? {type: 'transfer', axis, from: index, target,
                index: axisItems(target).length} :
                {type: 'add', axis: target, field};
            let disabled: boolean = target !== 'values' && !info?.dimension;
            try { disabled ||= applyPivotControlCommand(draft, command, capabilities) === draft; } catch { disabled = true; }
            return {id: target, text: text(axis ? 'pivotMoveTo' : 'pivotAddTo').replace('{0}', axisLabel(target)), disabled,
                run: () => execute(command, field)};
        });
        if (axis) {
            if (axis !== 'values') {
                const canSort: boolean = sortingEnabled && info.column.allowSort !== false;
                const canFilter: boolean = filteringEnabled && info.column.allowFilter !== false;
                const direction: 'Ascending' | 'Descending' = draft.memberSorts?.find((item: PivotMemberSort<T>) =>
                    item.field === field)?.direction;
                items.unshift(
                    {id: 'sortAscending', text: text('pivotSortAscending'), disabled: !canSort || direction === 'Ascending',
                        run: () => execute({type: 'sort', field, direction: 'Ascending'})},
                    {id: 'sortDescending', text: text('pivotSortDescending'), disabled: !canSort ||
                        direction === 'Descending', run: () => execute({type: 'sort', field, direction: 'Descending'})},
                    {id: 'clearSort', text: text('pivotClearSort'), disabled: !canSort || !direction, run: () =>
                        execute({type: 'sort', field})},
                    {id: 'filterMembers', text: text('pivotFilterMembers'), disabled: !canFilter || !getMemberData,
                        run: () => setFilterField({field, anchor: menu.anchor})},
                    {id: 'clearFilter', text: text('pivotClearMemberFilter'), disabled: !canFilter ||
                        !draft.memberFilters?.some((item: PivotMemberFilterType<T>) => item.field === field), run: () =>
                        execute({type: 'filter', field})}
                );
            }
            if (axis === 'values') {
                const value: PivotValue<T> = draft.values.slice(index, index + 1)[0];
                items.unshift(...info.aggregates.map((aggregate: PivotAggregateType) => ({id: `aggregate-${aggregate}`,
                    text: settings.customAggregates?.find((item: PivotCustomAggregate) => item.name === aggregate)?.label || aggregate,
                    disabled: value.type === aggregate || draft.values.some((entry: PivotValue<T>, other: number) => other !== index &&
                        entry.field === field && entry.type === aggregate),
                    run: () => execute({type: 'aggregate', index, aggregate}, field)})));
            }
            items.push({id: 'earlier', text: text('pivotMoveEarlier').replace('{0}', caption(field)), disabled: index === 0,
                run: () => execute({type: 'move', axis, from: index, to: index - 1}, field)},
                       {id: 'later', text: text('pivotMoveLater').replace('{0}', caption(field)),
                           disabled: index === axisItems(axis).length - 1,
                           run: () => execute({type: 'move', axis, from: index, to: index + 1}, field)},
                       {id: 'remove', text: text('pivotRemoveAction'), disabled: false, run: () => execute({type: 'remove',
                           axis, index}, field)});
        }
        return items;
    };
    const renderAxis: (axis: PivotControlAxis) => ReactElement = (axis: PivotControlAxis): ReactElement => {
        const items: (string | PivotValue<T>)[] = axisItems(axis);
        return <section className={`sf-pivot-axis${drop?.axis === axis ? drop.valid ? ' sf-pivot-drop-valid' : ' sf-pivot-drop-invalid' : ''}`}
            role="group" aria-label={axisLabel(axis)} data-pivot-axis={axis}>
            {!items.length && <div className="sf-pivot-drop-hint">{text('pivotDropHint')}</div>}
            {items.map((item: string | PivotValue<T>, index: number) => {
                const field: string = typeof item === 'string' ? item : String(item.field);
                const label: string = typeof item === 'string' ? caption(field) : `${item.type}(${caption(field)})`;
                return <div key={`${field}:${index}`} className={drop?.axis === axis && drop.valid && drop.index === index ? 'sf-pivot-insert-before' : ''}>
                    {draggable({field, axis, index}, <div className="sf-pivot-field-chip" data-pivot-index={index}>
                        <span className="sf-pivot-drag-handle" title={text('pivotDragField').replace('{0}', caption(field))} aria-hidden="true"><GripVerticalIcon/></span>
                        <Chip text={label} size={Size.Large} variant="Filled" removable
                            aria-label={axis === 'values' ? text('pivotAggregate').replace('{0}', caption(field)) : label}
                            onClick={(event: ReactMouseEvent<HTMLDivElement>) =>
                            { if (!(event.target as HTMLElement).closest('.sf-chip-delete')) {
                                setMenu({action: {field, axis, index}, anchor: event.currentTarget});
                            } }} onDelete={() => execute({type: 'remove', axis, index}, field)}/>
                        {actionButton({field, axis, index})}
                    </div>)}
                </div>;
            })}
            {drop?.axis === axis && drop.valid && drop.index === items.length && <div className="sf-pivot-insert-before"/>}
        </section>;
    };
    return <aside ref={panel} className={`sf-pivot-panel${collapsed ? ' sf-collapsed' : ''}`}
        style={{'--sf-pivot-panel-height': height,
            '--sf-pivot-panel-max-height': height === 'auto' ? 'none' : height} as CSSProperties}
        aria-label={text('pivotConfiguration')} dir={enableRtl ? 'rtl' : 'ltr'}>
        <div className="sf-pivot-panel-header">
            {!collapsed && <Switch size={Size.Small} label={text('pivotMode')} checked={!!draft.enabled}
                onChange={(event: SwitchChangeEvent) => dispatch({type: 'mode', enabled: event.value})}/>}
            <Tooltip className="sf-pivot-toggle-tooltip"
                content={() => text(collapsed ? 'pivotShowPanel' : 'pivotHidePanel')} opensOn="Hover Focus" position="BottomCenter">
                <Button size={Size.Small} variant={Variant.Standard} className="sf-pivot-action sf-pivot-panel-toggle"
                    aria-label={text(collapsed ? 'pivotShowPanel' : 'pivotHidePanel')}
                    aria-expanded={!collapsed}
                    onClick={() => {setCollapsed((value: boolean) => !value); setMenu(undefined); }}>
                    <span aria-hidden="true">{collapsed !== !!enableRtl ? <ChevronLeftIcon/> : <ChevronRightIcon/>}</span>
                </Button></Tooltip>
        </div>
        {!collapsed && <>
            {draft.enabled ? <>
                <span id={searchId} className="sf-pivot-visually-hidden">{text('pivotSearchFields')}</span>
                <div className="sf-pivot-search"><TextBox aria-labelledby={searchId} value={search} placeholder=
                    {text('pivotSearchFields')} prefix={<SearchIcon/>}
                size={Size.Small} variant={InputVariant.Outlined} onChange={(event: TextBoxChangeEvent) =>
                    setSearch(event.value || '')}/></div>
                <div className={`sf-pivot-field-list${hierarchy.some((column: ColumnProps<T>) => column.columns?.length) ?
                    '' : ' sf-pivot-flat-fields'}`} aria-label={text('pivotAvailableFields')}>
                    <TreeView dataSource={tree} fields={{children: 'children'}} selectionMode="Checkbox" autoCheck selectedIds={selectedIds}
                        expandedIds={search ? groups(tree) : expanded} onExpandedChange={(event: TreeExpansionEvent) =>
                            setExpanded(event.expandedIds.map(String))}
                        onSelectedChange={(event: TreeSelectionEvent) => {
                            const selected: Set<string> = new Set(event.selectedIds.map(String));
                            const commands: PivotControlAction[] = leaves.filter((node: PivotFieldNode) =>
                                selected.has(node.id) !== assigned(node.field)).map((node: PivotFieldNode) => {
                                const info: PivotFieldCapability<T> = capabilities.find((item: PivotFieldCapability<T>) =>
                                    item.field === node.field);
                                return selected.has(node.id) ? {type: 'add', axis: info.aggregates[0] === 'Sum' ||
                                    !info.dimension ? 'values' : 'rows', field: node.field} :
                                    {type: 'removeField', field: node.field};
                            });
                            if (commands.length) { dispatch({type: 'batch', commands}); }
                        }}>
                        <TreeViewNodes>{(context: TreeItemTemplateContext) => {
                            const node: PivotFieldNode = context.item as PivotFieldNode;
                            return <TreeViewNode><TreeViewItemToggle/><TreeViewItemCheckbox/>
                                {node.field ? draggable({field: node.field}, <div className="sf-pivot-available-field">
                                    <span className="sf-pivot-drag-handle" title={text('pivotDragField').replace('{0}',
                                                                                                                 node.label)} aria-hidden="true"><GripVerticalIcon/></span>
                                    <TreeViewItemLabel/>{actionButton({field: node.field})}
                                </div>) : <TreeViewItemLabel/>}
                            </TreeViewNode>;
                        }}</TreeViewNodes>
                    </TreeView>
                    {!leaves.length && <div role="status" className="sf-pivot-drop-hint">{text('pivotNoMatchingFields')}</div>}
                </div>
                <Accordion value={sections} onChange={(event: AccordionChangeEvent) =>
                    setSections(event.value as string[])} multiple>
                    {axes.map((axis: PivotControlAxis) => <AccordionPanel value={axis} key={axis}><AccordionHeader><AccordionTrigger>
                        <span aria-hidden="true" className="sf-pivot-axis-icon">
                            {axis === 'values' ? <SumIcon/> : axis === 'rows' ? <RowGroupIcon/> : <ColumnsIcon/>}</span>
                        {axisLabel(axis)}<AccordionIndicator/></AccordionTrigger></AccordionHeader>
                    <AccordionContent>{renderAxis(axis)}</AccordionContent></AccordionPanel>)}
                </Accordion>
            </> : <p className="sf-pivot-mode-hint" role="status">{text('pivotEnableModeHint')}</p>}
            {settings.deferLayoutUpdate && <div className="sf-pivot-panel-actions">
                <Button size={Size.Small} disabled={!dirty} onClick={apply}>{text('pivotApply')}</Button>
                <Button size={Size.Small} variant={Variant.Outlined} disabled={!dirty} onClick={cancel}>{text('pivotCancel')}</Button>
            </div>}
        </>}
        {menu && <PivotColumnMenu targetRef={{current: menu.anchor}} onClose={() => setMenu(undefined)} items={menuItems()}/>}
        {filterField && memberData && (memberData.error ? <div role="alert">{memberData.error}<Button onClick={() =>
            setFilterField(undefined)}>{text('pivotCancel')}</Button></div> :
            <PivotMemberFilter caption={caption(filterField.field)} {...memberData} anchor={filterField.anchor} locale=
                {locale} enableRtl={enableRtl}
            selectedKeys={draft.memberFilters?.find((item: PivotMemberFilterType<T>) =>
                item.field === filterField.field)?.memberKeys}
            onClose={() => setFilterField(undefined)} onApply={(memberKeys: string[]) => execute({type: 'filter',
                field: filterField.field, memberKeys})}/>)}
        <span className="sf-pivot-visually-hidden" aria-live="polite">{drop ? drop.valid ?
            text('pivotDropPosition').replace('{0}', axisLabel(drop.axis)).replace('{1}', String(drop.index + 1)) :
            text('pivotInvalidDrop') :
            dirty && settings.deferLayoutUpdate ? text('pivotPendingChanges') : ''}</span>
    </aside>;
}

