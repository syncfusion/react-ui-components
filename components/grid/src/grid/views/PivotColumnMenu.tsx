import { ReactElement, ReactNode, useLayoutEffect, useRef, useState } from 'react';
import { ContextMenu } from '@syncfusion/react-navigations/src/context-menu/context-menu';
import { MenuItem } from '@syncfusion/react-navigations/src/common/components/menu/menu-item';
import { MenuItemIcon } from '@syncfusion/react-navigations/src/common/components/menu/menu-item-icon';
import { MenuItemLabel } from '@syncfusion/react-navigations/src/common/components/menu/menu-item-label';
import type { PivotColumnMenuHostProps } from '../contexts/PivotColumnMenuContext';
import type { KeyboardEvent, FocusEvent, MouseEvent as ReactMouseEvent } from 'react';
import type { MenuSelectEvent } from '@syncfusion/react-navigations';

export interface PivotColumnMenuItem {
    id: string; text?: string; icon?: ReactNode; disabled?: boolean; separator?: boolean;
    items?: PivotColumnMenuItem[]; run?(): void;
}
/**
 * Uses the same Pure React menu and submenu slots as the ordinary Grid.
 *
 * @param {*} root0 - root0.
 * @param {*} root0.targetRef - root0.targetRef.
 * @param {*} root0.onClose - root0.onClose.
 * @param {*} root0.items - root0.items.
 * @returns {*} Result.
 */
export function PivotColumnMenu({targetRef, onClose, items}: Pick<PivotColumnMenuHostProps, 'targetRef' | 'onClose'> & Partial<PivotColumnMenuHostProps> & {items: PivotColumnMenuItem[]}): ReactElement {
    const target: HTMLElement = targetRef?.current;
    const dismissRef: {current: () => void} = useRef(onClose);
    dismissRef.current = onClose;
    useLayoutEffect(() => {
        const owner: Document = target?.ownerDocument || document;
        // Dismiss existing menus without restoring their trigger's focus.
        // The newly opened menu owns focus, including its nested submenus.
        owner.dispatchEvent(new Event('sf-pivot-menu-opening'));
        const dismiss: () => void = (): void => dismissRef.current();
        owner.addEventListener('sf-pivot-menu-opening', dismiss);
        return () => owner.removeEventListener('sf-pivot-menu-opening', dismiss);
    }, [target]);
    const [offset] = useState(() => {
        const rect: DOMRect = target?.getBoundingClientRect();
        // Reserve the compact menu's row heights before focus can scroll the page.
        const height: number = items.reduce((size: number, item: PivotColumnMenuItem) => size + (item.separator ? 7 : 28), 10);
        return {left: Math.max(8, Math.min(rect?.left || 0, window.innerWidth - 218)) + window.scrollX,
            top: Math.max(8, Math.min(rect?.bottom || 0, window.innerHeight - height - 8)) + window.scrollY};
    });
    const close: () => void = (): void => {
        onClose();
        if (target?.isConnected) { target.focus({preventScroll: true}); }
    };
    const render: (entries: PivotColumnMenuItem[], parentDisabled?: boolean) => ReactNode =
        (entries: PivotColumnMenuItem[], parentDisabled: boolean = false): ReactNode =>
            entries.map((item: PivotColumnMenuItem) => item.separator ?
                <MenuItem key={item.id} className="sf-separator"/> :
                <MenuItem key={item.id} id={item.id} disabled={parentDisabled || item.disabled}>
                    {item.icon && <MenuItemIcon>{item.icon}</MenuItemIcon>}<MenuItemLabel>{item.text}</MenuItemLabel>
                    {item.items && render(item.items, parentDisabled || item.disabled)}
                </MenuItem>);
    return <span style={{display: 'contents'}} onKeyDown={(event: KeyboardEvent<HTMLSpanElement>) => event.stopPropagation()}><ContextMenu open closeOnScroll={false} onFocus={(event: FocusEvent<HTMLDivElement, Element>) => event.stopPropagation()}
        onClick={(event: ReactMouseEvent<HTMLDivElement, globalThis.MouseEvent>) => event.stopPropagation()}
        onMouseDown={(event: ReactMouseEvent<HTMLDivElement, globalThis.MouseEvent>) => event.stopPropagation()}
        offset={offset}
        className="sf-pivot-column-menu" animation={{effect: 'None', duration: 0}} onClose={close}
        onSelect={(event: MenuSelectEvent) => {
            const flatten: (entries: PivotColumnMenuItem[], parentDisabled?: boolean) => PivotColumnMenuItem[] =
                (entries: PivotColumnMenuItem[], parentDisabled: boolean = false): PivotColumnMenuItem[] =>
                    entries.flatMap((item: PivotColumnMenuItem) => {
                        const disabled: boolean = parentDisabled || !!item.disabled;
                        return [{...item, disabled}, ...flatten(item.items || [], disabled)];
                    });
            const all: PivotColumnMenuItem[] = flatten(items);
            const item: PivotColumnMenuItem = all.find((entry: PivotColumnMenuItem) => entry.id === event.item.id);
            if (item?.run && !item.disabled) { item.run(); close(); }
        }}>{render(items)}</ContextMenu></span>;
}
