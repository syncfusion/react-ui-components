import * as React from 'react';
import { useState, useCallback, useEffect, useMemo, useRef, JSX } from 'react';
import { flushSync } from 'react-dom';
import { Dialog, IDialog } from '@syncfusion/react-popups/src/dialog/index';
import { calculatePosition } from '@syncfusion/react-popups/src/common/popup-positioning';
import { Button } from '@syncfusion/react-buttons/src/button/button';
import { Checkbox, CheckboxChangeEvent } from '@syncfusion/react-buttons/src/check-box/check-box';
import { Chip, ChipDeleteEvent, IChip } from '@syncfusion/react-buttons/src/chip/chip';
import { Color, Variant } from '@syncfusion/react-base/src/enums';
import { HelperEvent, useDraggable, DragEvent } from '@syncfusion/react-base/src/draggable';
import { useGridComputedProvider, useGridMutableProvider } from '../contexts/GridProviders';
import { ColumnProps } from '../types/column.interfaces';
import { AggregateType } from '../types/enum';
import { AggregateColumnProps, AggregateRowProps } from '../types/aggregate.interfaces';
import { ColumnChooserSettings, ColumnChooserFooterProps, ColumnChooserTemplateProps } from '../types/grid.interfaces';
import { SearchIcon } from '@syncfusion/react-icons/src/icons/search';
import { DragAndDropIcon } from '@syncfusion/react-icons/src/icons/drag-and-drop';
import { RowGroupicon } from '@syncfusion/react-icons/src/icons/row-group';
import { SumIcon } from '@syncfusion/react-icons/src/icons/sum';
import { closest } from '@syncfusion/react-base/src/dom';
import { IL10n } from '@syncfusion/react-base/src/l10n';
import { isNullOrUndefined } from '@syncfusion/react-base/src/util';
import { InputBase, renderClearButton } from '@syncfusion/react-inputs/src/common/inputbase';
import { ColumnChooserDialogProps } from '../types/column-chooser.interface';
import { DataManager, Query } from '@syncfusion/react-data';
import { getApplicableAggregateTypes } from '../utils/utils';

export const ColumnChooserDialog: <T>(props: ColumnChooserDialogProps<T>) => JSX.Element | null = <T, >(props:
ColumnChooserDialogProps<T>): JSX.Element | null => {
    const { isOpen, onClose, columns, embedded = false, position, settings, onBeforeOpen, onApply } = props;
    const { getParentElement, cssClass, setColumnChooserState, uiColumns, columnWidthInfo, setColumnWidthState,
        editModule, reorderModule, groupModule, aggregateSelection } = useGridMutableProvider();
    const { id, serviceLocator, isStackedHeader, allStackedColumnProps, groupSettings, aggregates, refresh } = useGridComputedProvider();
    const localization: IL10n = serviceLocator?.getService<IL10n>('localization');
    const dialogRef: React.RefObject<IDialog> = useRef<IDialog>(null);
    const searchInputRef: React.RefObject<HTMLInputElement> = useRef<HTMLInputElement>(null);
    const isRender: React.RefObject<boolean> = useRef<boolean>(true);
    const immediateVisibilityTimer: React.RefObject<number | undefined> = useRef<number | undefined>(undefined);
    const chooserContentRef: React.RefObject<HTMLDivElement> = useRef<HTMLDivElement>(null);
    const dragCloneRef: React.RefObject<HTMLElement> = useRef<HTMLElement | null>(null);

    // Extract settings with defaults
    const {
        mode = 'deferred',
        immediateModeDelay = 1500,
        enableSearch = true,
        operator = 'startsWith',
        ignoreAccent = false,
        sortDirection = 'None',
        selectedColumns = [],
        headerTemplate,
        footerTemplate,
        template
    } = settings || {};

    const [internalOpen, setInternalOpen] = useState<boolean>(false);
    const [searchInputValue, setSearchInputValue] = useState<string>('');
    const [searchValue, setSearchValue] = useState<string>('');
    const draggedColumnKeyRef: React.RefObject<string | null> = useRef<string | null>(null);
    const [dragCloneText, setDragCloneText] = useState<string>('');
    const [dragCloneNotAllowed, setDragCloneNotAllowed] = useState<boolean>(false);
    const [columnOrderVersion, setColumnOrderVersion] = useState<number>(0);
    const canReorderChooser: boolean = Boolean(settings?.enableReorder && reorderModule?.reorderSettings?.enabled);
    const showGroupDropArea: boolean = Boolean(embedded && groupSettings?.enabled);
    const showAggregateDropArea: boolean = Boolean(embedded && aggregates?.length);

    // Optimized: Single state for column visibility
    const [columnVisibility, setColumnVisibility] = useState<Map<string, boolean>>(new Map());

    // True when all visibility values are false, false if any value is true.
    const allColumnsHidden: boolean = useMemo(() => {
        return Array.from(columnVisibility.values()).every((value: boolean) => value === false);
    }, [columnVisibility]);

    // Fire beforeOpen event when dialog is about to open
    useEffect(() => {
        if (isOpen && !internalOpen && onBeforeOpen) {
            const args: { cancel: boolean; columnChooserSettings?: ColumnChooserSettings } = {
                cancel: false,
                columnChooserSettings: settings
            };
            onBeforeOpen(args);
            if (!args.cancel) {
                setInternalOpen(true);
            }
        } else if (isOpen && !internalOpen && !onBeforeOpen) {
            // If no beforeOpen callback, just open the dialog
            setInternalOpen(true);
        } else if (!isOpen && internalOpen) {
            setInternalOpen(false);
        }
    }, [isOpen, internalOpen, onBeforeOpen, settings]);

    // Ensure positioning logic runs on every open by resetting the render flag
    useEffect(() => {
        if (internalOpen) {
            isRender.current = true;
        }
    }, [internalOpen]);

    const groupedFields: string[] = groupModule?.groupedColumns || [];
    const getColumnDisplayText: (field?: string) => string = useCallback((field?: string): string => {
        return columns.find((column: Partial<ColumnProps<T>>) => column.field === field)?.headerText || field;
    }, [columns]);
    const aggregateColumns: Partial<ColumnProps<T>>[] = aggregates?.flatMap((aggregate: AggregateRowProps) =>
        (aggregate?.columns).map((column: AggregateColumnProps) => ({
            field: column.field,
            headerText: getColumnDisplayText(column.field)
        }))
    ) || [];

    const handleGroupDelete: (event: ChipDeleteEvent) => void = useCallback((event: ChipDeleteEvent): void => {
        groupModule?.ungroupColumn?.([event.data.value as string]);
    }, [groupModule]);

    const handleAggregateDelete: (event: ChipDeleteEvent) => void = useCallback((event: ChipDeleteEvent): void => {
        const field: string = event.data.value as string;
        aggregates?.forEach((aggregate: AggregateRowProps) => {
            aggregate.columns = (aggregate?.columns).filter((column: AggregateColumnProps) => column.field !== field);
        });
        setColumnChooserState({});
    }, [aggregates, getColumnDisplayText, setColumnChooserState]);

    const canDropColumn: (column: Partial<ColumnProps<T>> | undefined, dropType: string | null) => boolean =
        useCallback((column: Partial<ColumnProps<T>> | undefined, dropType: string | null): boolean => {
            if (!column?.field || !dropType) {
                return false;
            }
            if (dropType === 'group') {
                return showGroupDropArea && column.allowGroup !== false && !groupedFields.includes(column.field);
            }
            if (dropType === 'aggregate') {
                return showAggregateDropArea && !!aggregateSelection?.addAggregate &&
                    !aggregates?.some((aggregate: AggregateRowProps) => aggregate.columns?.some(
                        (aggregateColumn: AggregateColumnProps) => aggregateColumn.field === column.field)) &&
                    getApplicableAggregateTypes(column.type as string).includes(AggregateType.Count);
            }
            return false;
        }, [aggregateSelection, aggregates, groupedFields, showAggregateDropArea, showGroupDropArea]);

    const handleDropIntoArea: (column: Partial<ColumnProps<T>>, dropType: string) => void =
        useCallback((column: Partial<ColumnProps<T>>, dropType: string): void => {
            if (!column.field || !canDropColumn(column, dropType)) {
                return;
            }
            if (dropType === 'group') {
                if (groupedFields.includes(column.field)) {
                    return;
                }
                groupModule?.groupColumn?.([column.field]);
                return;
            }
            const aggregateRow: AggregateRowProps | undefined = aggregates?.[0];
            if (!aggregateRow || aggregateRow.columns?.some(
                (aggregateColumn: AggregateColumnProps) => aggregateColumn.field === column.field)) {
                return;
            }
            aggregateRow.columns = [...(aggregateRow?.columns), { field: column.field, type: AggregateType.Count }];
            aggregateSelection?.addAggregate?.(0, column.field, AggregateType.Count);
            refresh?.();
            setColumnChooserState({});
        }, [aggregateSelection, aggregates, canDropColumn, groupedFields, groupModule, refresh, setColumnChooserState]);

    /**
     * Optimized: Process and order columns based on settings
     */
    const processedColumns: Partial<ColumnProps<T>>[] = useMemo(() => {
        let cols: Partial<ColumnProps<T>>[] = columns?.filter((col: Partial<ColumnProps<T>>) => col.showInColumnChooser !== false);

        // Apply custom column ordering if selectedColumns provided - ONLY render selectedColumns
        if (selectedColumns.length > 0) {
            const orderedCols: Partial<ColumnProps<T>>[] = [];

            // Add columns in the specified order - only those in selectedColumns
            selectedColumns.forEach((fieldName: string) => {
                const col: Partial<ColumnProps<T>> = cols.find((c: Partial<ColumnProps<T>>) => c.field === fieldName);
                if (col) {
                    orderedCols.push(col);
                }
            });

            // Replace cols with only the selected columns - no remaining columns
            cols = orderedCols;
        }

        // Apply sorting if specified
        if (sortDirection === 'Ascending') {
            cols = [...cols].sort((a: Partial<ColumnProps<T>>, b: Partial<ColumnProps<T>>) => {
                const fieldA: string = (a.field || '').toLowerCase();
                const fieldB: string = (b.field || '').toLowerCase();
                return fieldA.localeCompare(fieldB);
            });
        } else if (sortDirection === 'Descending') {
            cols = [...cols].sort((a: Partial<ColumnProps<T>>, b: Partial<ColumnProps<T>>) => {
                const fieldA: string = (a.field || '').toLowerCase();
                const fieldB: string = (b.field || '').toLowerCase();
                return fieldB.localeCompare(fieldA);
            });
        } else if (selectedColumns.length === 0) {
            cols = [...cols].sort((a: Partial<ColumnProps<T>>, b: Partial<ColumnProps<T>>) =>
                (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
        }
        return cols;
    }, [columns, selectedColumns, sortDirection, columnOrderVersion]);

    /**
     * Optimized: Apply search filter with custom operator and accent sensitivity using DataManager
     */
    const filteredColumns: Partial<ColumnProps<T>>[] = useMemo(() => {
        if (!searchValue) {
            return processedColumns;
        }

        // Convert columns to plain objects for DataManager processing
        const columnsData: Array<Partial<ColumnProps<T>> & { headerText: string; field: string }> =
            processedColumns.map((col: Partial<ColumnProps<T>>) => ({
                ...col,
                headerText: col.headerText || (col.type === 'checkbox' ? localization?.getConstant('checkBox') : col.field) || '',
                field: col.field || ''
            }));

        // DataManager's executeLocal with Query to filter columns automatically handles ignoreAccent and operator functionalities
        const dataManager: DataManager = new DataManager(columnsData as Object[] as JSON[]);
        const query: Query = new Query().where('headerText', operator, searchValue, true, ignoreAccent);
        const filtered: Partial<ColumnProps<T>>[] = dataManager.executeLocal(query) as Partial<ColumnProps<T>>[];
        return filtered;
    }, [processedColumns, searchValue, operator, ignoreAccent]);

    /**
     * Apply Column Chooser search updates immediately.
     */
    useEffect(() => {
        setSearchValue(searchInputValue);
    }, [searchInputValue]);

    /**
     * Optimized: Initialize column visibility from current state.
     * Uses col.uid as the map key when col.field is absent (e.g. command columns).
     */
    useEffect(() => {
        if (isOpen) {
            const visibility: Map<string, boolean> = new Map<string, boolean>();
            columns.forEach((col: Partial<ColumnProps<T>>) => {
                const key: string = col.field || col.uid;
                if (col.showInColumnChooser !== false && key) {
                    visibility.set(key, isNullOrUndefined(col.visible) ? true : col.visible);
                }
            });
            setColumnVisibility(visibility);
        }
    }, [isOpen, columns]);

    /**
     * Optimized: Compute Select All state
     */
    const selectAllState: { checked: boolean; indeterminate: boolean; } = useMemo(() => {
        if (filteredColumns.length === 0) {
            return { checked: false, indeterminate: false };
        }

        const checkedCount: number = filteredColumns.filter((col: Partial<ColumnProps<T>>) => {
            const key: string = col.field || col.uid;
            return key && columnVisibility.get(key);
        }).length;

        if (checkedCount === filteredColumns.length) {
            return { checked: true, indeterminate: false };
        } else if (checkedCount === 0) {
            return { checked: false, indeterminate: false };
        } else {
            return { checked: false, indeterminate: true };
        }
    }, [columnVisibility, filteredColumns]);

    /**
     * Compute footer statistics for footer template
     */
    const footerStats: ColumnChooserFooterProps = useMemo((): ColumnChooserFooterProps => {
        const visibleCols: string[] = [];
        const hiddenCols: string[] = [];

        columns.forEach((col: Partial<ColumnProps<T>>) => {
            const key: string = col.field || col.uid;
            if (key) {
                const displayText: string = col.headerText || (col.type === 'checkbox' ? localization?.getConstant('checkBox') : key);
                if (columnVisibility.get(key)) {
                    visibleCols.push(displayText);
                } else {
                    hiddenCols.push(displayText);
                }
            }
        });

        return {
            visibleCount: visibleCols.length,
            totalCount: columns.length,
            visibleColumns: visibleCols,
            hiddenColumns: hiddenCols
        };
    }, [columnVisibility, columns]);

    /**
     * Handle cancel action - close dialog and reset state
     */
    const handleCancel: () => void = useCallback((): void => {
        if (immediateVisibilityTimer.current !== undefined) {
            window.clearTimeout(immediateVisibilityTimer.current);
            immediateVisibilityTimer.current = undefined;
        }
        setSearchInputValue('');
        setSearchValue('');
        onClose?.();
        setInternalOpen(false);
    }, [onClose]);

    /**
     * Apply column visibility changes and close dialog.
     * Uses col.uid as the fallback key for field-less columns such as command columns.
     */
    const applyColumnVisibility: (visibility: Map<string, boolean>) => Promise<boolean> = useCallback(
        async (visibility: Map<string, boolean>): Promise<boolean> => {
            if (Array.from(visibility.values()).every((value: boolean) => value === false)) {
                return false;
            }
            if (editModule?.editSettings?.allowUndoRedo && !await editModule?.confirmUndoRedoClear?.()) {
                return false;
            }
            const updateColumns: (columnsToUpdate?: ColumnProps[]) => void = (columnsToUpdate?: ColumnProps[]): void => {
                columnsToUpdate?.forEach((col: ColumnProps) => {
                    const key: string = col.field || col.uid;
                    if (key && visibility.has(key)) {
                        col.visible = visibility.get(key);
                    }
                    if (col.columns?.length) {
                        updateColumns(col.columns as ColumnProps[]);
                    }
                });
            };

            // uiColumns is the source passed back to prepareColumns as typeDetectedUIColumns.
            updateColumns(uiColumns.current);
            if (isStackedHeader) {
                updateColumns(allStackedColumnProps);
            }
            setColumnChooserState({});
            return true;
        }, [editModule, isStackedHeader, allStackedColumnProps, uiColumns, setColumnChooserState]);

    /**
     * Apply an immediate visibility change and notify the existing chooser apply callback.
     */
    const applyImmediateVisibility: (visibility: Map<string, boolean>) => void = useCallback((visibility: Map<string, boolean>): void => {
        if (immediateVisibilityTimer.current !== undefined) {
            window.clearTimeout(immediateVisibilityTimer.current);
        }
        immediateVisibilityTimer.current = window.setTimeout(async () => {
            immediateVisibilityTimer.current = undefined;
            const applied: boolean = await applyColumnVisibility(visibility);
            if (applied && onApply) {
                onApply({
                    columnVisibility: visibility,
                    columnChooserSettings: settings
                });
            }
        }, immediateModeDelay);
    }, [applyColumnVisibility, immediateModeDelay, onApply, settings]);

    /**
     * Apply staged column visibility changes and close the dialog.
     */
    const handleOk: () => void = useCallback(async (): Promise<void> => {
        if (allColumnsHidden || !await applyColumnVisibility(columnVisibility)) { return; }
        // Fire onApply event with column visibility changes
        if (onApply) {
            onApply({
                columnVisibility,
                columnChooserSettings: settings
            });
        }
        if (!columnWidthInfo.current.resizeTableWidth) {
            columnWidthInfo.current.renderInitialWidth = true;
            setColumnWidthState({});
        }
        setSearchInputValue('');
        setSearchValue('');
        onClose?.();
        setInternalOpen(false);
    }, [allColumnsHidden, applyColumnVisibility, columnVisibility, onClose, onApply, settings]);

    /**
     * Optimized: Handle individual column checkbox toggle
     */
    const handleColumnToggle: (field: string, checked: boolean) => void = useCallback((field: string, checked: boolean) : void => {
        const nextVisibility: Map<string, boolean> = new Map(columnVisibility).set(field, checked);
        setColumnVisibility(nextVisibility);
        if (mode === 'immediate' && !Array.from(nextVisibility.values()).every((value: boolean) => value === false)) {
            applyImmediateVisibility(nextVisibility);
        }
    }, [applyImmediateVisibility, columnVisibility, mode]);

    const getColumnKey: (column: Partial<ColumnProps<T>>) => string =
        (column: Partial<ColumnProps<T>>): string => column.field || column.uid;

    const helper: (args: HelperEvent) => HTMLElement | null = useCallback((args: HelperEvent): HTMLElement | null => {
        const listItem: HTMLElement | null = (args.sender?.target as HTMLElement)?.closest('.sf-columnchooser-listitem');
        const columnKey: string | undefined = listItem?.getAttribute('data-column-key');
        const column: Partial<ColumnProps<T>> | undefined = columns.find((item: Partial<ColumnProps<T>>) =>
            getColumnKey(item) === columnKey);
        if (!listItem || !column) {
            return null;
        }
        draggedColumnKeyRef.current = getColumnKey(column);
        flushSync(() => {
            setDragCloneNotAllowed(column.allowReorder === false);
            setDragCloneText(column.headerText || (column.type === 'checkbox' ? localization?.getConstant('checkBox') : column.field) || '');
        });
        return dragCloneRef.current;
    }, [columns, localization]);

    const getDropArea: (args: DragEvent) => HTMLElement | null = useCallback((args: DragEvent): HTMLElement | null => {
        const target: HTMLElement | null = args.target;
        const dropArea: HTMLElement | null | undefined = target?.closest('.sf-columnchooser-drop-area');
        if (dropArea) {
            return dropArea;
        }
        if (!target?.closest('.sf-columnchooser-main, .sf-column-chooser-embedded')) {
            return null;
        }
        return target.querySelector<HTMLElement>('.sf-columnchooser-drop-area');
    }, []);

    const drag: (args: DragEvent) => void = useCallback((args: DragEvent): void => {
        const cloneHelper: HTMLElement | null = dragCloneRef.current;
        if (!cloneHelper) {
            return;
        }
        const dropAreas: NodeListOf<HTMLElement> = chooserContentRef.current?.querySelectorAll('.sf-columnchooser-drop-area') ||
            document.querySelectorAll('.sf-columnchooser-drop-area');
        dropAreas.forEach((dropArea: HTMLElement) => dropArea.classList.remove('sf-columnchooser-drop-area-hover'));
        const targetItem: HTMLElement | null = args.target?.closest('.sf-columnchooser-listitem');
        const targetDropArea: HTMLElement | null = getDropArea(args);
        const sourceColumn: Partial<ColumnProps<T>> | undefined = columns.find((column: Partial<ColumnProps<T>>) =>
            getColumnKey(column) === draggedColumnKeyRef.current);
        const dropType: string | null = targetDropArea?.getAttribute('data-drop-type') || null;
        const canDrop: boolean = Boolean(
            (targetItem && sourceColumn?.allowReorder !== false) ||
            (targetDropArea && canDropColumn(sourceColumn, dropType)));
        if (targetDropArea && sourceColumn && canDropColumn(sourceColumn, dropType)) {
            targetDropArea.classList.add('sf-columnchooser-drop-area-hover');
        }
        cloneHelper.classList.toggle('sf-cursor-not-allowed', !canDrop);
    }, [canDropColumn, columns, getDropArea]);

    const handleDragStop: (args: DragEvent) => void = useCallback((args: DragEvent): void => {
        const sourceKey: string | null = draggedColumnKeyRef.current;
        const targetDropArea: HTMLElement | null = getDropArea(args);
        const dropType: string | null = targetDropArea?.getAttribute('data-drop-type') || null;
        const targetItem: HTMLElement | null = args.target?.closest('.sf-columnchooser-listitem');
        const targetKey: string | null = targetItem?.getAttribute('data-column-key') || null;
        const sourceColumn: Partial<ColumnProps<T>> | undefined = columns.find((column: Partial<ColumnProps<T>>) =>
            getColumnKey(column) === sourceKey);
        const targetColumn: Partial<ColumnProps<T>> | undefined = columns.find((column: Partial<ColumnProps<T>>) =>
            getColumnKey(column) === targetKey);
        if (targetDropArea && sourceColumn && dropType) {
            handleDropIntoArea(sourceColumn, dropType);
        } else if (canReorderChooser && reorderModule && sourceColumn?.allowReorder !== false && sourceColumn &&
            targetColumn && sourceKey !== targetKey && sourceColumn.orderIndex !== undefined &&
            targetColumn.orderIndex !== undefined) {
            void reorderModule.reorderColumnByIndex(sourceColumn.orderIndex, targetColumn.orderIndex).then(() => {
                setColumnOrderVersion((version: number) => version + 1);
            });
        }
        const dropAreas: NodeListOf<HTMLElement> = chooserContentRef.current?.querySelectorAll('.sf-columnchooser-drop-area') ||
            document.querySelectorAll('.sf-columnchooser-drop-area');
        dropAreas.forEach((dropArea: HTMLElement) => {
            dropArea.classList.remove('sf-columnchooser-drop-area-hover');
        });
        draggedColumnKeyRef.current = null;
        setDragCloneNotAllowed(false);
        setDragCloneText('');
    }, [canReorderChooser, columns, getDropArea, handleDropIntoArea, reorderModule]);

    useDraggable(chooserContentRef, {
        dragTarget: canReorderChooser ? '.sf-columnchooser-listitem' : undefined,
        distance: canReorderChooser ? 5 : undefined,
        helper: canReorderChooser ? helper : undefined,
        clone: canReorderChooser,
        onDrag: canReorderChooser ? drag : undefined,
        onDragStop: canReorderChooser ? handleDragStop : undefined,
        isReplaceDragEle: canReorderChooser,
        enableTailMode: canReorderChooser,
        cursorAt: { left: 20, top: 10 }
    });

    /**
     * Optimized: Handle Select All checkbox toggle.
     * Uses col.uid as fallback key for field-less columns (e.g. command columns).
     */
    const handleSelectAllToggle: (checked: boolean) => void = useCallback((checked: boolean) : void => {
        const nextVisibility: Map<string, boolean> = new Map(columnVisibility);
        filteredColumns.forEach((col: Partial<ColumnProps<T>>) => {
            const key: string = col.field || col.uid;
            if (key) {
                nextVisibility.set(key, checked);
            }
        });
        setColumnVisibility(nextVisibility);
        if (mode === 'immediate' && Array.from(nextVisibility.values()).some((value: boolean) => value === true)) {
            applyImmediateVisibility(nextVisibility);
        }
    }, [applyImmediateVisibility, columnVisibility, filteredColumns, mode]);

    /**
     * Handle search input change
     */
    const handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchInputValue(e.target.value);
    }, []);

    /**
     * Clear search input and reset search state
     */
    const clearInput: (e?: React.MouseEvent) => void = useCallback((e?: React.MouseEvent): void => {
        // Prevent default and stop propagation if event is provided
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        setSearchInputValue('');
        setSearchValue('');

        // Ensure input gets focus but after a short delay to let events settle
        setTimeout(() => {
            searchInputRef.current?.focus();
        }, 0);
    }, []);



    /**
     * Set focus highlight on elements (similar to FilterDialog)
     */
    const setFocusElement: (elem?: Element, className?: string) => void = useCallback((elem?: Element, className?: string) => {
        const currentFocusElem: Element = (dialogRef.current?.element)?.querySelector('.' + className);
        if (currentFocusElem) {
            currentFocusElem.classList.remove(className);
        }
        if (elem) {
            elem.classList.add(className);
        }
    }, [dialogRef]);

    /**
     * Navigate to next or previous focusable element
     */
    const focusNextOrPrevElement: (e: KeyboardEvent | React.KeyboardEvent<Element>, focusableElements: HTMLElement[],
        focusClassName: string) => void = useCallback((e: KeyboardEvent | React.KeyboardEvent<Element>, focusableElements: HTMLElement[],
                                                       focusClassName: string) => {
        const nextIndex: number = (e.key === 'ArrowUp' || (e.key === 'Tab' && e.shiftKey)) ? focusableElements.indexOf(document.activeElement as HTMLElement) - 1
            : focusableElements.indexOf(document.activeElement as HTMLElement) + 1;
        const nextElement: Element = focusableElements[((nextIndex + focusableElements.length) % focusableElements.length)];

        // Set focus on the next / previous element
        if (nextElement) {
            (nextElement as HTMLElement).focus();
            const focusClass: string = nextElement.classList.contains('sf-checkboxfiltertext') ? 'sf-checkbox-focus' : focusClassName;
            const target: Element = nextElement.classList.contains('sf-checkboxfiltertext')
                ? closest(nextElement, '.sf-columnchooser-listitem, .sf-columnchooser-selectall')
                : nextElement;
            setFocusElement(target, focusClass);
        }
    }, [setFocusElement]);

    /**
     * Handle Tab key navigation on keydown to intercept before focus moves
     */
    const keyDownHandler: (e: React.KeyboardEvent | KeyboardEvent) => void = useCallback((e: React.KeyboardEvent | KeyboardEvent) => {
        if (e.key === 'Tab') {
            const currentElement: HTMLElement = e.target as HTMLElement;
            const dialogElement: HTMLElement = dialogRef.current?.element;
            // Find cancel button (last button in footer)
            const footerButtons: HTMLElement[] = Array.from(dialogElement?.querySelectorAll('button') || []);
            const cancelButton: HTMLElement = footerButtons[footerButtons.length - 1]; // Last button (Cancel)
            // Find search input
            const searchInput: HTMLElement = searchInputRef.current as HTMLElement;
            // Handle Tab from cancel button ONLY -> focus search box (if it exists)
            if (!e.shiftKey && currentElement === cancelButton && searchInput && enableSearch) {
                e.preventDefault();
                searchInput.focus();
                setFocusElement(searchInput, 'sf-menu-focus');
                return;
            }
            // Handle Shift+Tab from search box -> focus cancel button
            if (e.shiftKey && currentElement === searchInput && cancelButton) {
                e.preventDefault();
                cancelButton.focus();
                setFocusElement(cancelButton, 'sf-menu-focus');
                return;
            }
        }
        // Prevent up and down arrow key press default functionality to prevent the browser scroll when performing keyboard navigation in column chooser dialog.
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            e.preventDefault();
        }
    }, [dialogRef, searchInputRef, enableSearch, setFocusElement]);

    /**
     * Handle keyboard navigation with comprehensive support for Arrow keys, Tab, Enter, and Escape
     */
    const keyUpHandler: (e: React.KeyboardEvent | KeyboardEvent) => void = useCallback((e: React.KeyboardEvent | KeyboardEvent) => {
        if (e.key === 'Escape') {
            handleCancel();
        } else if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'INPUT') {
            handleOk();
        } else if ((e.key === 'Tab' && e.shiftKey) || e.key === 'Tab') {
            // Default tab behavior with focus highlighting
            const currentElement: HTMLElement = e.target as HTMLElement;
            const focusClass: string = currentElement.classList.contains('sf-checkboxfiltertext') ? 'sf-checkbox-focus' : 'sf-menu-focus';
            const target: Element = currentElement.classList.contains('sf-checkboxfiltertext')
                ? closest(currentElement, '.sf-columnchooser-listitem, .sf-columnchooser-selectall')
                : currentElement;
            setFocusElement(target, focusClass);
        } else if ((e.key === 'ArrowUp' || e.key === 'ArrowDown') && !e.altKey) {
            e.preventDefault();
            const focusableElements: HTMLElement[] = Array.from(dialogRef.current?.element.querySelectorAll(
                'input, button, [tabindex]:not([tabindex="-1"])'
            ));
            focusNextOrPrevElement(e, focusableElements, 'sf-menu-focus');
        }
    }, [handleCancel, handleOk, dialogRef, focusNextOrPrevElement, setFocusElement]);
    /**
     * Handle clicks inside/outside the dialog with focus management
     */
    const clickHandler: (e: MouseEvent) => void = useCallback((e: MouseEvent) => {
        const target: Element = e.target as Element;
        const popup: Element = closest(target, '.sf-column-chooser-dialog');
        const toolbarButton: Element = closest(target, '.sf-toolbar-item');
        const elem: Element = closest(target, '.sf-columnchooser-listitem, .sf-columnchooser-selectall');

        // Set focus highlight on checkbox clicks
        if (popup && elem) {
            setFocusElement(elem, 'sf-checkbox-focus');
        }

        if (!popup && !toolbarButton) {
            handleCancel();
        }
    }, [handleCancel, setFocusElement]);

    useEffect(() => {
        if (internalOpen && !embedded) {
            document.body.addEventListener('click', clickHandler);
            document.body.addEventListener('keydown', keyDownHandler);
            document.body.addEventListener('keyup', keyUpHandler);
        }
        return () => {
            document.body.removeEventListener('click', clickHandler);
            document.body.removeEventListener('keydown', keyDownHandler);
            document.body.removeEventListener('keyup', keyUpHandler);
        };
    }, [embedded, internalOpen, clickHandler, keyDownHandler, keyUpHandler]);

    /**
     * Position dialog relative to anchor element or custom position
     */
    useEffect(() => {
        if (internalOpen && isRender.current) {
            const hostEl: HTMLElement = dialogRef.current?.element as HTMLElement | undefined;
            const dialogElement: HTMLElement = hostEl?.firstElementChild as HTMLElement | undefined;
            const target: HTMLElement = document.getElementById(`${id}_columnchooser`);
            if (!dialogElement) {
                return;
            }

            // Temporarily display to calculate dimensions
            dialogElement.style.display = 'block';
            dialogElement.style.visibility = 'hidden';
            const dlgWidth: number = dialogElement.offsetWidth as number;
            hostEl.style.position = 'absolute';
            hostEl.style.width = dialogElement.style.width;
            hostEl.style.height = dialogElement.offsetHeight + 'px';

            if (position && (position.x !== undefined || position.y !== undefined)) {
                const parentElement: HTMLElement = getParentElement();
                if (position.x !== undefined) {
                    const maxLeft: number = Math.max(0, parentElement.clientWidth - dlgWidth);
                    hostEl.style.left = Math.min(Math.max(0, position.x), maxLeft) + 'px';
                }
                if (position.y !== undefined) {
                    hostEl.style.top = position.y + 'px';
                }
            } else {
                // Calculate position relative to toolbar button
                if (target) {
                    const newpos: { left: number; top: number; } = calculatePosition(
                        target,
                        dialogElement,
                        { horizontal: 'right', vertical: 'bottom' },
                        { horizontal: 'right', vertical: 'top' },
                        0, 0, getParentElement()
                    );
                    dialogElement.style.display = '';
                    dialogElement.style.visibility = '';
                    hostEl.style.top = newpos.top + 9 + 'px';
                    const leftPos: number = newpos.left;
                    if (leftPos < 1) {
                        hostEl.style.left = (dlgWidth + leftPos) - 120 + 'px';
                    } else {
                        hostEl.style.left = leftPos + 'px';
                    }
                }
            }
            dialogElement.style.display = '';
            dialogElement.style.visibility = '';
            isRender.current = false;
        }
    }, [internalOpen, id, position]);


    /**
     * Render custom header template if provided
     *
     * @returns {JSX.Element | string} - The header element or string
     */
    const renderHeader: () => JSX.Element | string = (): JSX.Element | string => {
        if (headerTemplate) {
            if (typeof headerTemplate === 'function') {
                const HeaderComponent: React.ComponentType = headerTemplate;
                return <HeaderComponent />;
            }
            return headerTemplate as string;
        }
        return localization?.getConstant('chooseColumns');
    };

    /**
     * Render dialog footer - either custom template or default OK/Cancel buttons
     *
     * @returns {JSX.Element} - The footer element
     */
    const renderFooter: () => JSX.Element = (): JSX.Element => {
        // If custom footer template is provided, use it for the Dialog footer
        if (footerTemplate) {
            if (typeof footerTemplate === 'function') {
                const FooterComponent: React.ComponentType<ColumnChooserFooterProps> = footerTemplate;
                return <FooterComponent {...footerStats} onApply={handleOk} onClose={handleCancel} columnVisibility={columnVisibility} />;
            }
            if (React.isValidElement(footerTemplate)) {
                return React.cloneElement(
                    footerTemplate as JSX.Element,
                    { ...footerStats, onApply: handleOk, onClose: handleCancel, columnVisibility }
                );
            }
        }

        if (mode === 'immediate') {
            return <span aria-hidden='true' />;
        }

        // Default footer with OK/Cancel buttons (OK on left, Cancel on right)
        return (
            <>
                <Button
                    variant={Variant.Standard}
                    color={Color.Primary}
                    className={cssClass}
                    disabled={allColumnsHidden}
                    onClick={handleOk}
                    onKeyDown={(event: React.KeyboardEvent<HTMLButtonElement>) => event.code === 'Enter' ? handleOk() : undefined}
                >
                    {localization?.getConstant('okButtonLabel')}
                </Button>
                <Button
                    variant={Variant.Standard}
                    className={cssClass}
                    onClick={handleCancel}
                    onKeyDown={(event: React.KeyboardEvent<HTMLButtonElement>) => event.code === 'Enter' ? handleCancel() : undefined}
                >
                    {localization?.getConstant('cancelButtonLabel')}
                </Button>
            </>
        );
    };

    /**
     * Render custom template or default column list
     *
     * @returns {JSX.Element} - The content element
     */
    const renderContent: () => JSX.Element = (): JSX.Element => {
        // If custom template is provided, use it
        if (template) {
            const templateProps: ColumnChooserTemplateProps<T> = {
                columns: filteredColumns,
                showColumns: footerStats.visibleColumns,
                hideColumns: footerStats.hiddenColumns,
                searchValue,
                columnVisibility,
                onToggle: handleColumnToggle,
                onSelectAll: handleSelectAllToggle,
                onApply: handleOk,
                onClose: handleCancel
            };

            if (typeof template === 'function') {
                const TemplateComponent: React.ComponentType<ColumnChooserTemplateProps<unknown>> = template;
                return <TemplateComponent {...templateProps} />;
            }
            if (React.isValidElement(template)) {
                return template;
            }
        }

        // Default rendering
        return (
            <div
                className={'sf-columnchooser-main' + ((showGroupDropArea || showAggregateDropArea) ? ' sf-columnchooser-main-with-drop-areas' : '')}
            >
                {/* Search Box - conditionally render based on enableSearch */}
                {enableSearch && (
                    <div className='sf-columnchooser-search sf-input-group'>
                        <InputBase
                            ref={searchInputRef}
                            tabIndex={0}
                            className='sf-columnchooser-searchbox'
                            placeholder={localization?.getConstant('searchButtonLabel')}
                            value={searchInputValue}
                            onChange={handleChange}
                            onKeyDown={(event: React.KeyboardEvent<HTMLButtonElement>) => event.code === 'Enter' ? handleOk() : undefined}
                        />
                        {renderClearButton(searchValue, clearInput)}
                        {!searchValue?.length && <span
                            className='sf-columnchooser-search-icon sf-icons sf-input-group-icon'
                            title={localization?.getConstant('searchButtonLabel')}
                        >
                            <SearchIcon className='sf-font-size-xl'/>
                        </span>}
                    </div>
                )}

                {/* Select All Checkbox */}
                <div className="sf-columnchooser-selectall">
                    <div className='sf-columnchooser-checkbox' data-uid={`${id}-selectAll`}>
                        <Checkbox
                            checked={selectAllState.checked}
                            indeterminate={selectAllState.indeterminate}
                            label={localization?.getConstant('selectAll')}
                            className="sf-checkboxfiltertext"
                            onChange={(e: CheckboxChangeEvent) => {
                                handleSelectAllToggle(!!e?.value);
                            }}
                            disabled={filteredColumns.length === 0}
                        />
                    </div>
                </div>

                {/* Column List */}
                <div
                    ref={chooserContentRef}
                    className='sf-columnchooser-content'
                >
                    {filteredColumns.length === 0 ? (
                        <div className="sf-columnchooser-empty">
                            {localization?.getConstant('noMatches')}
                        </div>
                    ) : (
                        filteredColumns.map((col: Partial<ColumnProps<T>>, index: number) => {
                            const colKey: string = col.field || col.uid || String(index);
                            return (
                                <div
                                    key={colKey}
                                    className="sf-columnchooser-listitem"
                                    data-column-key={colKey}
                                >
                                    <div className='sf-columnchooser-checkbox' data-uid={`${id}-column${index}`}>
                                        <Checkbox
                                            checked={columnVisibility.get(colKey) || false}
                                            className="sf-checkboxfiltertext"
                                            label={!canReorderChooser
                                                ? (col.headerText || (col.type === 'checkbox' ? localization?.getConstant('checkBox') : col.field))
                                                : undefined}
                                            onChange={(e: CheckboxChangeEvent) => {
                                                handleColumnToggle(colKey, !!e?.value);
                                            }}
                                        />
                                    </div>
                                    {canReorderChooser && <span
                                        className='sf-columnchooser-drag-handle sf-icons'
                                        aria-label='Drag to reorder column'
                                        title='Drag to reorder column'
                                    >
                                        <DragAndDropIcon width={16} height={16} />
                                    </span>}
                                    {canReorderChooser && <span className='sf-columnchooser-label'>
                                        {col.headerText || (col.type === 'checkbox' ? localization?.getConstant('checkBox') : col.field)}
                                    </span>}
                                </div>
                            );
                        })
                    )}
                </div>
                {(showGroupDropArea || showAggregateDropArea) && <div className='sf-columnchooser-drop-areas'>
                    {showGroupDropArea && <section className='sf-columnchooser-drop-section'>
                        <div className='sf-columnchooser-drop-area-title'>
                            <RowGroupicon />
                            <span>{localization?.getConstant('groupDropAreaTitle')}</span>
                        </div>
                        <div className={'sf-columnchooser-drop-area' + (groupedFields.length ? ' sf-columnchooser-drop-area-filled' : '')}
                            data-drop-type='group'
                            role='region'
                            aria-label={localization?.getConstant('groupDropAreaLabel')}
                        >
                            {groupedFields.length ? groupedFields.map((field: string) => <Chip
                                key={field}
                                value={field}
                                text={getColumnDisplayText(field)}
                                removable={true}
                                onDelete={handleGroupDelete}
                            >{getColumnDisplayText(field)}</Chip>) :
                                <span className='sf-columnchooser-drop-area-hint'>{localization?.getConstant('columnChooserGroupDropAreaHintText')}</span>}
                        </div>
                    </section>}
                    {showAggregateDropArea && <section className='sf-columnchooser-drop-section'>
                        <div className='sf-columnchooser-drop-area-title'>
                            <SumIcon />
                            <span>{localization?.getConstant('aggregateDropAreaTitle')}</span>
                        </div>
                        <div className={'sf-columnchooser-drop-area' + (aggregateColumns.length ? ' sf-columnchooser-drop-area-filled' : '')}
                            data-drop-type='aggregate'
                            role='region'
                            aria-label={localization?.getConstant('aggregateDropAreaLabel')}
                        >
                            {aggregateColumns.length ? aggregateColumns.map((column: Partial<ColumnProps<T>>) => <Chip
                                key={column.field}
                                value={column.field}
                                text={column.headerText}
                                removable={true}
                                onDelete={handleAggregateDelete}
                            >{column.headerText}</Chip>) :
                                <span className='sf-columnchooser-drop-area-hint'>{localization?.getConstant('columnChooserAggregateDropAreaHintText')}</span>}
                        </div>
                    </section>}
                </div>}
            </div>
        );
    };

    if (!isOpen) {
        return null;
    }

    const dragClone: JSX.Element | null = dragCloneText ? <Chip
        ref={(chipRef: IChip) => {
            dragCloneRef.current = chipRef?.element || null;
        }}
        className={'sf-columnchooser-header-clone sf-header-cell-clone' + (dragCloneNotAllowed ? ' sf-cursor-not-allowed' : '')}
    >
        {dragCloneText}
    </Chip> : null;

    if (embedded) {
        return (
            <div id={id + '_ColumnChooser'} className={cssClass + ' sf-column-chooser-embedded'}>
                <div className='sf-column-chooser-embedded-content'>{renderContent()}</div>
                {dragClone}
            </div>
        );
    }

    return (
        <>{internalOpen && <Dialog
            id={id + '_ColumnChooser'}
            ref={dialogRef}
            className={cssClass + ' sf-column-chooser-dialog'}
            open={internalOpen}
            modal={false}
            target={getParentElement()}
            closeIcon={false}
            header={renderHeader()}
            style={{ width: '280px', maxHeight: '500px', zIndex: 10000, position: 'absolute' }}
            footer={renderFooter()}
        >
            {renderContent()}
        </Dialog>}
        {dragClone}
        </>
    );
};
