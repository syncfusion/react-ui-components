import * as React from 'react';
import { useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState, RefObject, ReactNode } from 'react';

export interface TimeListRef {
    ensureSelectedVisible: () => void;
    selectFocused: () => void;
    focusNext: () => void;
    focusPrev: () => void;
    focusFirst: () => void;
    focusLast: () => void;
    getFocusedIndex: () => number | null;
    handleKeyDown: (e: KeyboardEvent | React.KeyboardEvent) => void;
    focus: () => void;
}

export interface TimeListProps {
    times: Date[];
    selected: Date | null;
    onSelect: (time: Date, e?: React.SyntheticEvent) => void;
    formatter?: (t: Date) => string;
    itemTemplate?: (time: Date, isSelected: boolean, isFocused: boolean, index: number) => React.ReactNode;
    idBase: string;
    listLabel?: string;
    ariaHidden?: boolean;
    className?: string;
    sizeClass?: string;
    dir?: 'ltr' | 'rtl';
    isOpen?: boolean;
}


export const TimeList: React.ForwardRefExoticComponent<TimeListProps & React.RefAttributes<TimeListRef>> =
React.forwardRef<TimeListRef, TimeListProps>((props: TimeListProps, ref: React.Ref<TimeListRef>) => {
    const {
        times,
        selected,
        onSelect,
        formatter,
        itemTemplate,
        idBase,
        listLabel = 'Time options',
        ariaHidden = false,
        className = 'sf-timepicker-list',
        sizeClass = '',
        isOpen = false,
        dir = 'ltr'
    } = props;

    const listRef: RefObject<HTMLUListElement | null> = useRef<HTMLUListElement | null>(null);
    const itemRefs: RefObject<(HTMLLIElement | null)[]> = useRef<Array<HTMLLIElement | null>>([]);
    const initialScrollDone: RefObject<boolean> = useRef<boolean>(false);
    const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
    const count: number = times.length;
    const formatDisplay: (t: Date) => string = useCallback((t: Date): string => {
        if (formatter) {
            return formatter(t);
        }
        return t.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
    }, [formatter]);

    const getSelectedIndex: () => number = useCallback((): number => {
        if (!selected) {
            return -1;
        }
        return times.findIndex(
            (t: Date) => t.getHours() === selected.getHours() && t.getMinutes() === selected.getMinutes()
        );
    }, [times, selected]);

    const scrollItemIntoView: (index: number | null) => void = useCallback((index: number | null): void => {
        if (index == null || index < 0) {
            return;
        }
        const el: HTMLLIElement | null = itemRefs.current[index as number];
        const listEl: HTMLUListElement | null = listRef.current;
        if (!el || !listEl) {
            return;
        }
        if (typeof el.scrollIntoView === 'function') {
            el.scrollIntoView({
                block: 'nearest',
                behavior: 'auto'
            });
        }
    }, []);

    const ensureSelectedVisible: () => void = useCallback((): void => {
        const sel: number = getSelectedIndex();
        const idx: number | null = sel >= 0 ? sel : (times.length ? 0 : null);
        if (idx == null || idx < 0) {
            return;
        }
        const el: HTMLLIElement | null = itemRefs.current[idx as number];
        const listEl: HTMLUListElement | null = listRef.current;
        if (!el || !listEl) {
            return;
        }
        const itemTop: number = el.offsetTop;
        const itemH: number = el.offsetHeight || 32;
        const target: number = Math.max(0, itemTop - Math.max(0, (listEl.clientHeight - itemH) / 2));
        listEl.scrollTop = target;
        setFocusedIndex(idx as number);
    }, [getSelectedIndex, times.length]);

    useEffect(() => {
        if (isOpen && !initialScrollDone.current) {
            initialScrollDone.current = true;
            ensureSelectedVisible();
        }
        if (!isOpen) {
            initialScrollDone.current = false;
            setFocusedIndex(null);
        }
    }, [isOpen, ensureSelectedVisible]);

    const focusNext: () => void = useCallback((): void => {
        if (!count) {
            return;
        }
        const start: number = focusedIndex != null && focusedIndex >= 0 && focusedIndex < count ? focusedIndex : getSelectedIndex();
        const next: number = (start < 0 ? 0 : (start + 1) % count);
        setFocusedIndex(next);
        scrollItemIntoView(next);
    }, [count, focusedIndex, getSelectedIndex, scrollItemIntoView]);

    const focusPrev: () => void = useCallback((): void => {
        if (!count) {
            return;
        }
        const start: number = focusedIndex != null && focusedIndex >= 0 && focusedIndex < count ? focusedIndex : getSelectedIndex();
        const prev: number = (start < 0 ? count - 1 : (start - 1 + count) % count);
        setFocusedIndex(prev);
        scrollItemIntoView(prev);
    }, [count, focusedIndex, getSelectedIndex, scrollItemIntoView]);

    const focusFirst: () => void = useCallback((): void => {
        if (!count) {
            return;
        }
        setFocusedIndex(0);
        scrollItemIntoView(0);
    }, [count, scrollItemIntoView]);

    const focusLast: () => void = useCallback((): void => {
        if (!count) {
            return;
        }
        setFocusedIndex(count - 1);
        scrollItemIntoView(count - 1);
    }, [count, scrollItemIntoView]);

    const selectFocused: () => void = useCallback((): void => {
        if (!count) {
            return;
        }
        const idx: number = (focusedIndex != null && focusedIndex >= 0 && focusedIndex < count)
            ? focusedIndex
            : getSelectedIndex();
        if (idx == null || idx < 0) {
            return;
        }
        onSelect(times[idx as number]);
    }, [count, focusedIndex, getSelectedIndex, onSelect, times]);

    const handleKeyDown: (e: React.KeyboardEvent<HTMLElement>)
    => void = useCallback((e: React.KeyboardEvent<HTMLElement>) => {
        switch (e.key) {
        case 'ArrowDown':
            e.preventDefault();
            focusNext();
            break;
        case 'ArrowUp':
            e.preventDefault();
            focusPrev();
            break;
        case 'Home':
            e.preventDefault();
            focusFirst();
            break;
        case 'End':
            e.preventDefault();
            focusLast();
            break;
        case 'Enter':
            e.preventDefault();
            selectFocused();
            break;
        default:
            break;
        }
    }, [focusNext, focusPrev, focusFirst, focusLast, selectFocused]);

    useImperativeHandle(ref, () => ({
        ensureSelectedVisible,
        selectFocused,
        focusNext,
        focusPrev,
        focusFirst,
        focusLast,
        getFocusedIndex: () => focusedIndex,
        handleKeyDown: (e: KeyboardEvent | React.KeyboardEvent) =>
            handleKeyDown(e as React.KeyboardEvent<HTMLElement>),
        focus: () => listRef.current?.focus()
    }), [ensureSelectedVisible, selectFocused, focusNext, focusPrev, focusFirst, focusLast, focusedIndex, handleKeyDown]);

    const listId: string = `${idBase}_options`;

    const activeDescendant: string | undefined = useMemo(() => {
        const inRange: boolean = focusedIndex != null && focusedIndex >= 0 && focusedIndex < count;
        return inRange ? `${idBase}_option_${focusedIndex}` : undefined;
    }, [idBase, focusedIndex, count]);

    const rootClass: string = [className, sizeClass, 'sf-ul', dir === 'rtl' ? 'sf-rtl' : '']
        .filter(Boolean)
        .join(' ');

    const empty: boolean = count === 0;

    return (
        <ul
            ref={listRef as React.Ref<HTMLUListElement>}
            className={rootClass}
            role="listbox"
            aria-label={listLabel}
            aria-activedescendant={activeDescendant}
            aria-hidden={ariaHidden}
            id={listId}
            tabIndex={0}
            onMouseDown={(e: React.SyntheticEvent) => e.preventDefault()}
            onKeyDown={handleKeyDown}
        >
            {empty ? (
                <li className="sf-timepicker-item sf-timepicker-empty" role="note" tabIndex={-1}>
                    No available times
                </li>
            ) : (
                times.map((t: Date, index: number) => {
                    const text: string = formatDisplay(t);
                    const isSelected: boolean = !!(selected &&
                        t.getHours() === selected.getHours() &&
                        t.getMinutes() === selected.getMinutes());
                    const isFocus: boolean = focusedIndex === index;

                    const content: ReactNode = itemTemplate
                        ? itemTemplate(t, isSelected, isFocus, index)
                        : text;

                    return (
                        <li
                            key={index}
                            ref={(el: HTMLLIElement) => { itemRefs.current[index as number] = el; }}
                            className={[
                                'sf-timepicker-item',
                                isSelected ? 'sf-active' : '',
                                isFocus ? 'sf-focus' : ''
                            ].filter(Boolean).join(' ')}
                            role="option"
                            data-value={text}
                            id={`${idBase}_option_${index}`}
                            aria-selected={isSelected}
                            onClick={(e: React.SyntheticEvent) => onSelect(t, e)}
                            onFocus={() => setFocusedIndex(index)}
                            onBlur={() => setFocusedIndex(null)}
                        >
                            {content}
                        </li>
                    );
                })
            )}
        </ul>
    );
});

TimeList.displayName = 'TimeList';
export default TimeList;
