import { ReactElement, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Dialog } from '@syncfusion/react-popups/src/dialog/index';
import { Checkbox } from '@syncfusion/react-buttons/src/check-box';
import { Button } from '@syncfusion/react-buttons/src/button';
import { TextBox } from '@syncfusion/react-inputs/src/textbox';
import { SearchIcon } from '@syncfusion/react-icons/src/icons/search';
import { TreeView, ITreeView, TreeViewNodes, TreeViewNode, TreeViewItemToggle, TreeViewItemCheckbox, TreeViewItemLabel } from '@syncfusion/react-navigations/src/tree-view';
import { PivotMemberOption, updatePivotMemberSelection } from '../services/pivot-members';
import { createPivotLocalization } from '../services/pivot-controls';
import type { IL10n } from '@syncfusion/react-base';
import type { Size } from '@syncfusion/react-base';
import type { RefObject } from 'react';
import type { TextBoxChangeEvent } from '@syncfusion/react-inputs';
import type { CheckboxChangeEvent } from '@syncfusion/react-buttons';
import type { TreeSelectionEvent, TreeItemTemplateContext } from '@syncfusion/react-navigations';

interface PivotMemberFilterProps {
    caption: string; options: PivotMemberOption[]; allKeys: string[]; selectedKeys?: string[];
    anchor?: HTMLElement; locale?: string; enableRtl?: boolean;
    onApply(keys: string[] | undefined): void; onClose(): void;
}

/**
 * A source-member popup. Search and checkbox changes remain local until Apply.
 *
 * @param {*} root0 - root0.
 * @param {*} root0.caption - root0.caption.
 * @param {*} root0.options - root0.options.
 * @param {*} root0.allKeys - root0.allKeys.
 * @param {*} root0.selectedKeys - root0.selectedKeys.
 * @param {*} root0.anchor - root0.anchor.
 * @param {*} root0.locale - root0.locale.
 * @param {*} root0.enableRtl - root0.enableRtl.
 * @param {*} root0.onApply - root0.onApply.
 * @param {*} root0.onClose - root0.onClose.
 * @returns {*} Result.
 */
export function PivotMemberFilter(
    {caption, options, allKeys, selectedKeys, anchor, locale, enableRtl, onApply, onClose}: PivotMemberFilterProps
): ReactElement {
    const searchId: string = useId();
    const localization: IL10n = useMemo(() => createPivotLocalization(locale), [locale]);
    const text: (key: string) => string = (key: string): string => localization.getConstant(key);
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState(() => new Set(selectedKeys ?? allKeys));
    const dirty: RefObject<boolean> = useRef(false);
    const treeRef: RefObject<ITreeView> = useRef<ITreeView>(null);
    const domainKey: string = JSON.stringify(allKeys);
    const dialogTarget: HTMLElement | null = anchor?.closest('.sf-pivot-view') as HTMLElement | null;
    const [position] = useState(() => {
        const rect: DOMRect = anchor?.getBoundingClientRect();
        const targetRect: DOMRect | undefined = dialogTarget?.getBoundingClientRect();
        const targetWidth: number = dialogTarget?.clientWidth || window.innerWidth;
        const targetHeight: number = dialogTarget?.clientHeight || window.innerHeight;
        return {left: Math.max(8, Math.min((rect?.left || 8) - (targetRect?.left || 0), targetWidth - 312)),
            top: Math.max(8, Math.min((rect?.bottom || 8) - (targetRect?.top || 0), targetHeight - 450))};
    });
    useEffect(() => {
        setSelected((previous: Set<string>) => new Set(allKeys.filter((key: string) =>
            previous.has(key) || (!dirty.current && selectedKeys === undefined))));
    }, [domainKey]);
    const matching: PivotMemberOption[] = options.filter((option: PivotMemberOption) =>
        option.label.toLocaleLowerCase(locale).includes(search.toLocaleLowerCase(locale)));
    const header: string = text('pivotFilterField').replace('{0}', caption);
    const checked: number = matching.filter((option: PivotMemberOption) => selected.has(option.key)).length;
    const noSelection: boolean = !allKeys.some((key: string) => selected.has(key));
    const memberTreeData: {
        id: string;
        label: string;
    }[] = useMemo(() => matching.map((option: PivotMemberOption) => ({id: option.key, label: option.label})), [matching]);
    const close: () => void = (): void => {
        onClose();
        // Dialog's Escape handler blurs the current element after onClose.
        queueMicrotask(() => { if (anchor?.isConnected) { anchor.focus({preventScroll: true}); } });
    };
    const apply: (keys: string[] | undefined) => void = (keys: string[] | undefined): void => { onApply(keys); close(); };
    return <Dialog open modal={false} target={dialogTarget ?? undefined} header={<span title={header}>{header}</span>} onClose={close}
        className="sf-pivot-member-filter" dir={enableRtl ? 'rtl' : 'ltr'}
        animation={{effect: 'None', duration: 0, delay: 0}}
        style={{width: 304, maxWidth: 'calc(100vw - 16px)', position: 'absolute', left: position.left, top: position.top, zIndex: 10000}}
        footer={<><Button size={'Small' as Size} disabled={noSelection} onClick={() => apply(undefined)}>{text('pivotClearMemberFilter')}</Button>
            <Button size={'Small' as Size} disabled={noSelection} onClick={close}>{text('pivotCancel')}</Button>
            <Button size={'Small' as Size} disabled={noSelection} onClick={() => apply(allKeys.filter((key: string) => selected.has(key)))}>{text('pivotApply')}</Button></>}>
        <span id={searchId} className="sf-pivot-visually-hidden">{text('pivotSearchMembers')}</span>
        <TextBox aria-labelledby={searchId} value={search} placeholder={text('pivotSearchMembers')} prefix={<SearchIcon/>}
            onChange={(event: TextBoxChangeEvent) => setSearch(event.value || '')}/>
        <div className="sf-pivot-member-select-all"><Checkbox
            label={text(search ? 'pivotSelectMatchingMembers' : 'pivotSelectAllMembers')}
            checked={!!matching.length && checked === matching.length} indeterminate={checked > 0 && checked < matching.length}
            disabled={!matching.length} onChange={(event: CheckboxChangeEvent) => {
                dirty.current = true;
                setSelected((previous: Set<string>) => updatePivotMemberSelection(previous, matching, event.value));
            }}/></div>
        <div className="sf-pivot-member-options">
            <TreeView ref={treeRef} dataSource={memberTreeData} autoCheck checkOnClick selectionMode="Checkbox" selectedIds={[...selected]}
                onSelectedChange={(event: TreeSelectionEvent) => {
                    dirty.current = true;
                    setSelected(new Set(event.selectedIds.map(String)));
                }}>
                <TreeViewNodes>{(_node: TreeItemTemplateContext) => <TreeViewNode>
                    <TreeViewItemToggle/><TreeViewItemCheckbox/><TreeViewItemLabel/>
                </TreeViewNode>}</TreeViewNodes>
            </TreeView>
            {!matching.length && <div role="status">{text('pivotNoMatchingMembers')}</div>}
        </div>
        <div className="sf-pivot-member-count" aria-live="polite">{text('pivotSelectedMembers').replace('{0}', String(allKeys.filter((key: string) => selected.has(key)).length))}</div>
    </Dialog>;
}
