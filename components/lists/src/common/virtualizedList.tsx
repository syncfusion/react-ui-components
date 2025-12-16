import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import { ListItemsProps } from './listItems';
import { ListItem } from './listItem';
import { DataSource, FieldsMapping, VirtualizationProps } from './types';
import { DataManager, Query, ReturnOption } from '@syncfusion/react-data';

export interface VirtualizedListProps extends ListItemsProps {
    /** Click handler for each ListItem (overrides options.itemClick when provided). */
    onItemClick?: (e: React.MouseEvent<HTMLLIElement>, index: number) => void;
    /** IDs of active items for selection/expand state. */
    activeItemsId?: string[];
}

export const computeLocalRange: (
    ds: DataSource[],
    scrollTop: number,
    headerRef: React.RefObject<HTMLDivElement | null>,
    options: VirtualizationProps
) => {
    startIndex: number;
    endIndex: number;
    topHeight: number;
    bottomHeight: number;
    visibleData: DataSource[];
} = (ds: DataSource[], scrollTop: number, headerRef: React.RefObject<HTMLDivElement | null>, options: VirtualizationProps) => {
    const liHeight: number = options.itemSize || 40;
    const itemsCount: number = options.itemsCount || 15;
    const overscan: number = options.overscanCount || 5;
    const totalHeight: number = ds.length * liHeight;
    const headerHeight: number = headerRef?.current ? headerRef.current.getBoundingClientRect().height : 0;
    const adjustedScrollTop: number = Math.max(0, scrollTop - headerHeight);
    const baseIndex: number = Math.floor(adjustedScrollTop / liHeight);
    const startIndex: number = Math.max(0, baseIndex - overscan);
    const endIndex: number = Math.min(startIndex + itemsCount + overscan * 2, ds.length);
    const topHeight: number = startIndex * liHeight;
    const visibleHeight: number = (endIndex - startIndex) * liHeight;
    const bottomHeight: number = Math.max(0, totalHeight - (topHeight + visibleHeight));
    const visibleData: DataSource[] = ds.slice(startIndex, endIndex);

    return { startIndex, endIndex, topHeight, bottomHeight, visibleData };
};

export const computeRemoteRange: (
    scrollTop: number,
    headerRef: React.RefObject<HTMLDivElement | null>,
    options: VirtualizationProps,
    totalCount: number
) => { startIndex: number; endIndex: number } = (scrollTop: number, headerRef: React.RefObject<HTMLDivElement | null>,
                                                 options: VirtualizationProps, totalCount: number) => {
    const liHeight: number = options.itemSize as number;
    const itemsCount: number = options.itemsCount as number;
    const overscan: number = options.overscanCount as number;
    const headerHeight: number = headerRef?.current ? headerRef.current.getBoundingClientRect().height : 0;
    const adjustedScrollTop: number = Math.max(0, scrollTop - headerHeight);
    let startIndex: number = Math.floor(adjustedScrollTop / liHeight);
    startIndex = Math.min(startIndex, Math.max(0, totalCount - 1));
    const take: number = itemsCount + overscan;
    const endIndex: number = Math.min(startIndex + take, totalCount);
    return { startIndex, endIndex };
};

export const applyActiveFlags: (
    items: DataSource[],
    fields: FieldsMapping,
    activeItemsId: string[] | undefined,
    checkBox: boolean | undefined
) => DataSource[] = (items: DataSource[], fields: FieldsMapping, activeItemsId: string[] | undefined, checkBox: boolean | undefined) => {
    if (!activeItemsId || activeItemsId.length === 0) { return items; }
    const idField: string = (fields.id as string) || 'id';
    const checkedField: string = (fields.checked as string) || 'checked';
    const selectedField: string = (fields.selected as string) || 'selected';
    return items.map((item: DataSource) => {
        const id: string = item[idField as string]?.toString();
        const active: boolean = id != null && activeItemsId.includes(String(id));
        return {
            ...item,
            [(checkBox ? checkedField : selectedField) as string]: active
        } as DataSource;
    });
};

export const VirtualizedList: React.NamedExoticComponent<VirtualizedListProps> = React.memo(({
    items,
    fields,
    onItemClick,
    onItemKeyDown,
    scrollParent,
    baseQuery,
    virtualization,
    parentClass,
    itemTemplate,
    groupTemplate,
    ariaAttributes,
    checkBox,
    checkBoxPosition,
    headerRef, dataSource, activeItemsId, setListItemDatas, onActionBegin, onActionComplete, onActionFailure, getItemProps
}: VirtualizedListProps) => {
    const [visibleData, setVisibleData] = useState<DataSource[]>([]);
    const [topHeight, setTopHeight] = useState<number>(0);
    const [bottomHeight, setBottomHeight] = useState<number>(0);
    const [startIndex, setStartIndex] = useState<number>(0);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const totalCountRef: React.RefObject<number> = useRef<number>(0);
    const requestedRange: React.RefObject<{ start: number; end: number; }> = useRef<{ start: number; end: number }>({ start: 0, end: 0 });
    const debounceId: React.RefObject<number | null> = useRef<number | null>(null);
    const ticking: React.RefObject<boolean> = useRef<boolean>(false);

    const handleLocal: (ScrollElement: HTMLElement, virtualization: VirtualizationProps) => void =
        (ScrollElement: HTMLElement, virtualization: VirtualizationProps) => {
            const all: DataSource[] = Array.isArray(items) ? (items as DataSource[]) : [];
            const win: { startIndex: number; endIndex: number; topHeight: number; bottomHeight: number; visibleData: DataSource[]; }
                = computeLocalRange(all, ScrollElement.scrollTop, headerRef as React.RefObject<HTMLDivElement | null>, virtualization);

            const data: DataSource[] = applyActiveFlags(win.visibleData, fields as FieldsMapping, activeItemsId, checkBox);
            setVisibleData(data);

            setStartIndex(win.startIndex);
            setTopHeight(win.topHeight);
            setBottomHeight(win.bottomHeight);
        };

    useEffect(() => {
        if (!virtualization || !fields) { return; }
        if (activeItemsId && activeItemsId.length > 0) {
            setVisibleData((prev: DataSource[]) => applyActiveFlags(prev, fields as FieldsMapping, activeItemsId, checkBox));
        }
    }, [activeItemsId, checkBox, fields, virtualization]);

    useEffect(() => {
        if (dataSource instanceof DataManager) {
            setListItemDatas?.(visibleData);
        }
    }, [visibleData, setListItemDatas]);

    useEffect(() => {
        const ScrollElement: HTMLElement | null = scrollParent?.current as HTMLElement | null;
        if (!virtualization || !ScrollElement) {
            return;
        }
        const liHeight: number = virtualization.itemSize || 40;

        const initRemote: () => Promise<void> = async () => {
            try {
                setIsLoading(true);
                onActionBegin?.();
                const itemsCount: number = virtualization?.itemsCount || 15;
                const overscan: number = virtualization?.overscanCount || 5;
                const take: number = itemsCount + overscan;
                const currentQuery: Query = baseQuery ? (baseQuery.clone() as Query) : new Query();
                const initialQuery: Query = currentQuery.skip(0).take(take).requiresCount() as Query;
                const result: ReturnOption = await (dataSource as DataManager).executeQuery(initialQuery);
                const raw: DataSource[] = (result.result || []) as DataSource[];
                const total: number = (result.count as number) ?? raw.length ?? 0;
                totalCountRef.current = total;
                const data: DataSource[] = applyActiveFlags(raw, fields as FieldsMapping, activeItemsId, checkBox);
                requestedRange.current = { start: 0, end: data.length };
                const totalPx: number = total * liHeight;
                const renderedPx: number = data.length * liHeight;
                const bottomPx: number = Math.max(0, totalPx - renderedPx);
                setVisibleData(data);
                setStartIndex(0);
                setTopHeight(0);
                setBottomHeight(bottomPx);
                setIsLoading(false);
                onActionComplete?.();
            } catch (err) {
                setIsLoading(false);
                onActionFailure?.(err as object);
            }
        };

        if (dataSource instanceof DataManager) {
            initRemote();
        } else {
            handleLocal(ScrollElement, virtualization);
        }
    }, [virtualization, scrollParent?.current, dataSource, fields, checkBox, baseQuery, onActionBegin, onActionComplete,
        onActionFailure]);

    useEffect(() => {
        const ScrollElement: HTMLElement | null = scrollParent?.current as HTMLElement | null;
        if (!virtualization || !ScrollElement) { return; }
        const liHeight: number = virtualization.itemSize || 40;
        const overscan: number = virtualization.overscanCount || 5;

        const handleRemote: () => Promise<void> = async () => {
            if (debounceId.current) {
                window.clearTimeout(debounceId.current);
                debounceId.current = null;
            }
            debounceId.current = window.setTimeout(async () => {
                const totalCount: number = totalCountRef.current;
                if (!Number.isFinite(totalCount) || totalCount <= 0) { return; }
                const range: { startIndex: number; endIndex: number; } =
                    computeRemoteRange(ScrollElement.scrollTop, headerRef as React.RefObject<HTMLDivElement | null>,
                                       virtualization as VirtualizationProps, totalCount);
                const currentStart: number = requestedRange.current.start;

                if (Math.abs(range.startIndex - currentStart) > Math.floor(overscan / 2) &&
                    range.endIndex > range.startIndex) {
                    try {
                        setTopHeight(range.startIndex * liHeight);
                        setBottomHeight(Math.max(0, (totalCount - range.endIndex) * liHeight));
                        setIsLoading(true);
                        onActionBegin?.();
                        requestedRange.current = { start: range.startIndex, end: range.endIndex };
                        const currentQuery: Query = baseQuery ? (baseQuery.clone() as Query) : new Query();
                        const fetchQuery: Query = currentQuery.skip(range.startIndex).take(range.endIndex - range.startIndex);
                        const result: ReturnOption = await (dataSource as DataManager).executeQuery(fetchQuery);
                        const raw: DataSource[] = (result.result || []) as DataSource[];
                        const data: DataSource[] = applyActiveFlags(raw, fields as FieldsMapping, activeItemsId, checkBox);
                        setVisibleData(data);
                        setStartIndex(range.startIndex);
                        setIsLoading(false);
                        onActionComplete?.();
                    } catch (err) {
                        setIsLoading(false);
                        onActionFailure?.(err as object);
                    }
                }
            }, 30);
        };

        const onScroll: () => void = () => {
            if (ticking.current) { return; }
            ticking.current = true;
            requestAnimationFrame(() => {
                if (dataSource instanceof DataManager) {
                    handleRemote();
                } else {
                    handleLocal(ScrollElement, virtualization as VirtualizationProps);
                }
                ticking.current = false;
            });
        };

        ScrollElement.addEventListener('scroll', onScroll, { passive: true });
        return () => {
            ScrollElement.removeEventListener('scroll', onScroll);
            if (debounceId.current) {
                window.clearTimeout(debounceId.current);
                debounceId.current = null;
            }
        };
    }, [virtualization, scrollParent?.current, dataSource, fields, activeItemsId, checkBox, headerRef,
        baseQuery, onActionBegin, onActionComplete, onActionFailure]);

    if (visibleData.length === 0) {
        return null;
    }

    const skeletonCount: number = ((virtualization?.itemsCount || 15) + ((virtualization?.overscanCount || 5) * 2) * 2);

    return (
        <>
            <div style={{ height: `${topHeight}px` }} />
            {isLoading && skeletonCount !== 0
                ? Array.from({ length: skeletonCount }).map((_: unknown, index: number) => (
                    <div key={`skeleton-${index}`} className='sf-list-skeleton' style={{width: '100%', height: (virtualization?.itemSize || 40) - 16}}></div>
                ))
                : visibleData?.map((item: DataSource, index: number) => {
                    const actualIndex: number = startIndex + index;
                    return (
                        <ListItem
                            key={`item-${actualIndex}`}
                            item={item}
                            fields={fields as FieldsMapping}
                            index={actualIndex}
                            onItemClick={onItemClick}
                            onItemKeyDown={onItemKeyDown}
                            getItemProps={getItemProps}
                            itemTemplate={itemTemplate}
                            groupTemplate={groupTemplate}
                            checkBoxPosition={checkBoxPosition}
                            virtualization={virtualization}
                            parentClass={parentClass}
                            ariaAttributes={ariaAttributes}
                            checkBox={checkBox}
                        />
                    );
                })
            }
            <div style={{ height: `${bottomHeight}px` }} />
        </>
    );
});

export default VirtualizedList;
