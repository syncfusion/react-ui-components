import { ReactNode, isValidElement, useCallback, useEffect, useMemo, useRef, HTMLAttributes, RefObject, RefAttributes } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@syncfusion/react-icons';
import { HScroll, VScroll } from '../../common/components/scroll';
import { COMMON_CLASSES, TABS_CLASSES } from '../../common/constants';
import { TabsContextValue, useTabsContext } from '../tabs-context';
import { useTabsOverflow, UseTabsOverflowResult } from '../state/use-tabs-overflow';
import { TabValue } from '../types';

/**
 * Specifies the props for the `<TabList>` sub-component.
 *
 * @public
 */
export interface TabListProps {
    /**
     * Specifies the class name appended to the list element.
     *
     * @default -
     */
    className?: string;
    /**
     * Specifies the tab children composed of `<Tab>` elements.
     *
     * @default -
     */
    children: ReactNode;
}

type TabListComponentProps = TabListProps & Omit<HTMLAttributes<HTMLDivElement>, 'onClick' | 'onKeyDown' | 'onKeyPress' | 'onKeyUp' | 'onFocus' | 'onBlur'>;

interface TabChildMeta {
    value: TabValue;
    element: ReactNode;
}

const collectTabChildren: (children: ReactNode) => Array<TabChildMeta> = (children: ReactNode): Array<TabChildMeta> => {
    const out: Array<TabChildMeta> = [];
    const walk: (nodes: ReactNode) => void = (nodes: ReactNode): void => {
        if (Array.isArray(nodes)) {
            nodes.forEach((n: ReactNode) => walk(n));
            return;
        }
        if (!isValidElement(nodes)) { return; }
        const props: { value?: unknown } = nodes.props as { value?: unknown };
        if (typeof props.value === 'string' || typeof props.value === 'number') {
            out.push({ value: props.value, element: nodes });
        }
    };
    walk(children);
    return out;
};

const extractLabel: (element: ReactNode) => string = (element: ReactNode): string => {
    if (!isValidElement(element)) { return ''; }
    const props: { children?: unknown } = element.props as { children?: unknown };
    const walk: (node: unknown) => string = (node: unknown): string => {
        if (node === null || node === undefined) { return ''; }
        if (typeof node === 'string') { return node; }
        if (typeof node === 'number') { return String(node); }
        if (Array.isArray(node)) { return node.map((c: unknown) => walk(c)).filter(Boolean).join(' '); }
        if (isValidElement(node)) { return walk((node.props as { children?: unknown }).children); }
        return '';
    };
    return walk(props.children) || '';
};

export const TabList: (props: TabListComponentProps) => ReactNode = (props: TabListComponentProps): ReactNode => {
    const { className, style, id, children } = props;
    const ctx: TabsContextValue = useTabsContext();
    const hostRef: RefObject<HTMLDivElement | null> = useRef<HTMLDivElement | null>(null);
    const triggerRef: RefObject<HTMLButtonElement | null> = useRef<HTMLButtonElement | null>(null);
    const popupRef: RefObject<HTMLDivElement | null> = useRef<HTMLDivElement | null>(null);

    const tabChildren: TabChildMeta[] = useMemo(() => collectTabChildren(children), [children]);
    const order: readonly TabValue[] = ctx.state.tabOrder;
    const tabOrderRef: RefObject<readonly TabValue[]> = useRef<ReadonlyArray<TabValue>>(order);
    useEffect(() => { tabOrderRef.current = order; }, [order]);

    const isVertical: boolean = ctx.headerPlacement === 'Left' || ctx.headerPlacement === 'Right';

    useEffect(() => {
        if (ctx.listRef && hostRef.current) {
            ctx.listRef.current = hostRef.current;
        }
    }, [ctx.listRef]);

    const overflow: UseTabsOverflowResult = useTabsOverflow({
        hostRef,
        triggerRef,
        tabOrderRef,
        orientation: isVertical ? 'vertical' : 'horizontal',
        enabled: ctx.overflowMode === 'Popup' || ctx.overflowMode === 'Scrollable'
    });

    useEffect(() => {
        return () => {
            ctx.setPopupOpen(false);
            if (ctx.listRef && ctx.listRef.current === hostRef.current) {
                ctx.listRef.current = null;
            }
            hostRef.current = null;
            triggerRef.current = null;
            popupRef.current = null;
        };
    }, []);

    const handleClickOutside: (event: MouseEvent) => void = useCallback((event: MouseEvent): void => {
        const target: HTMLElement | null = event.target as HTMLElement | null;
        if (!target) {
            return;
        }
        if (triggerRef.current && triggerRef.current.contains(target)) {
            return;
        }
        if (popupRef.current && popupRef.current.contains(target)) {
            return;
        }
        ctx.setPopupOpen(false);
    }, [ctx]);

    useEffect(() => {
        if (!ctx.popupOpen) {
            return undefined;
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [ctx.popupOpen, handleClickOutside]);

    const composedClassName: string = useMemo((): string => {
        return ctx.unstyled
            ? (className || '')
            : [
                TABS_CLASSES.LIST,
                isVertical ? TABS_CLASSES.LIST_VERTICAL : TABS_CLASSES.LIST_HORIZONTAL,
                TABS_CLASSES.POS_RELATIVE,
                TABS_CLASSES.DISPLAY_FLEX,
                className
            ].filter(Boolean).join(' ');
    }, [ctx.unstyled, isVertical, className]);

    const listDOMProps: HTMLAttributes<HTMLDivElement> & RefAttributes<HTMLDivElement> = ctx.getTabListProps({ id });

    const overflowTriggerClassName: string = useMemo((): string => (
        [
            TABS_CLASSES.OVERFLOW_TRIGGER,
            COMMON_CLASSES.ICON,
            TABS_CLASSES.CURSOR_POINTER,
            ctx.popupOpen ? TABS_CLASSES.OVERFLOW_OPEN : null
        ].filter(Boolean).join(' ')
    ), [ctx.popupOpen]);

    const overflowPopupClassName: string = useMemo((): string => (
        [
            TABS_CLASSES.POPUP_ITEMS,
            TABS_CLASSES.DISPLAY_FLEX,
            TABS_CLASSES.POS_ABSOLUTE
        ].join(' ')
    ), []);

    const overflowItemClassName: string = useMemo((): string => (
        [
            TABS_CLASSES.OVERFLOW_ITEM,
            TABS_CLASSES.CURSOR_POINTER
        ].join(' ')
    ), []);

    const overflowItemActiveClassName: string = useMemo((): string => (
        [
            TABS_CLASSES.OVERFLOW_ITEM,
            TABS_CLASSES.CURSOR_POINTER,
            TABS_CLASSES.OVERFLOW_ITEM_ACTIVE
        ].filter(Boolean).join(' ')
    ), []);

    let wrappedChildren: ReactNode = children;
    let overflowTrigger: ReactNode = null;
    let overflowPopup: ReactNode = null;

    if (ctx.overflowMode === 'Popup') {
        const visibleIds: readonly TabValue[] = overflow.visibleTabIds;
        const overflowIds: readonly TabValue[] = overflow.overflowTabIds;

        if (visibleIds.length > 0) {
            wrappedChildren = tabChildren
                .filter((meta: TabChildMeta) => visibleIds.indexOf(meta.value) !== -1)
                .map((meta: TabChildMeta) => meta.element);
        }

        if (overflow.hasOverflow) {
            overflowTrigger = (
                <button
                    ref={triggerRef}
                    {...ctx.getOverflowTriggerProps()}
                    role="tab"
                    aria-label="More tabs"
                    className={overflowTriggerClassName}
                >
                    {ctx.popupOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
                </button>
            );

            const byValue: Map<TabValue, TabChildMeta> = new Map(tabChildren.map((meta: TabChildMeta) => [meta.value, meta]));
            if (ctx.popupOpen) {
                overflowPopup = (
                    <div
                        ref={popupRef}
                        {...ctx.getOverflowPopupProps()}
                        className={overflowPopupClassName}
                    >
                        {overflowIds.map((value: TabValue): ReactNode => {
                            const meta: TabChildMeta | undefined = byValue.get(value);
                            const label: string = meta ? extractLabel(meta.element) : String(value);
                            const isActive: boolean = ctx.isItemActive(value);
                            const itemProps: Omit<HTMLAttributes<HTMLButtonElement>, 'color'> & { type: 'button' } =
                                ctx.getOverflowItemProps(value);

                            return (
                                <button
                                    key={String(value)}
                                    {...itemProps}
                                    className={isActive ? overflowItemActiveClassName : overflowItemClassName}
                                >
                                    {label}
                                </button>
                            );
                        })}
                    </div>
                );
            }
        }
    }

    let tablistElement: ReactNode = (
        <div
            ref={hostRef}
            className={composedClassName}
            style={style}
            {...listDOMProps}
        >
            {wrappedChildren}
            {overflowTrigger}
        </div>
    );

    if (ctx.overflowMode === 'Scrollable' && overflow.hasOverflow) {
        const step: number | undefined = ctx.scrollStep ?? undefined;
        tablistElement = isVertical ? (
            <VScroll scrollStep={step}>{tablistElement}</VScroll>
        ) : (
            <HScroll scrollStep={step}>{tablistElement}</HScroll>
        );
    }

    return (
        <>
            {tablistElement}
            {overflowPopup}
        </>
    );
};
