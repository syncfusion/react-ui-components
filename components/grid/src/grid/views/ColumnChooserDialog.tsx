import * as React from 'react';
import { useState, useCallback, useEffect, useMemo, useRef, JSX } from 'react';
import { Dialog, IDialog, calculateRelativeBasedPosition } from '@syncfusion/react-popups';
import { Button, Color, Variant, Checkbox, CheckboxChangeEvent } from '@syncfusion/react-buttons';
import { useGridComputedProvider, useGridMutableProvider } from '../contexts';
import { ColumnProps, ColumnChooserSettings, ColumnChooserFooterProps, ColumnChooserTemplateProps } from '../types';
import { SearchIcon } from '@syncfusion/react-icons';
import { closest, IL10n, isNullOrUndefined } from '@syncfusion/react-base';
import { InputBase, renderClearButton } from '@syncfusion/react-inputs';
import { DataManager, Query } from '@syncfusion/react-data';

/**
 * ColumnChooserDialog component renders a modal dialog for column selection
 * with advanced features including custom templates, search operators, and column ordering
 *
 * @component
 * @private
 */
export interface ColumnChooserDialogProps<T> {
    isOpen: boolean;
    onClose: () => void;
    columns: Partial<ColumnProps<T>>[];
    position?: { x?: number; y?: number };
    settings?: ColumnChooserSettings;
    onBeforeOpen?: (event: { cancel: boolean; columnChooserSettings?: ColumnChooserSettings }) => void;
    onApply?: (event: { columnVisibility?: Map<string, boolean>; columnChooserSettings?: ColumnChooserSettings }) => void;
}

export const ColumnChooserDialog: <T>(props: ColumnChooserDialogProps<T>) => JSX.Element | null = <T, >(props:
ColumnChooserDialogProps<T>): JSX.Element | null => {
    const { isOpen, onClose, columns, position, settings, onBeforeOpen, onApply } = props;
    const { getParentElement, cssClass, setColumnChooserState, uiColumns } = useGridMutableProvider();
    const { id, serviceLocator } = useGridComputedProvider();
    const localization: IL10n = serviceLocator?.getService<IL10n>('localization');
    const dialogRef: React.RefObject<IDialog> = useRef<IDialog>(null);
    const searchInputRef: React.RefObject<HTMLInputElement> = useRef<HTMLInputElement>(null);
    const isRender: React.RefObject<boolean> = useRef<boolean>(true);

    // Extract settings with defaults
    const {
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
    const [searchValue, setSearchValue] = useState<string>('');

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

    /**
     * Optimized: Process and order columns based on settings
     */
    const processedColumns: Partial<ColumnProps<T>>[] = useMemo(() => {
        let cols: Partial<ColumnProps<T>>[] = columns.filter((col: Partial<ColumnProps<T>>) => col.showInColumnChooser !== false);

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
        }
        return cols;
    }, [columns, selectedColumns, sortDirection]);

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
                headerText: col.headerText || (col.type === 'checkbox' ? localization?.getConstant('CheckBox') : col.field) || '',
                field: col.field || ''
            }));

        // DataManager's executeLocal with Query to filter columns automatically handles ignoreAccent and operator functionalities
        const dataManager: DataManager = new DataManager(columnsData as Object[] as JSON[]);
        const query: Query = new Query().where('headerText', operator, searchValue, true, ignoreAccent);
        const filtered: Partial<ColumnProps<T>>[] = dataManager.executeLocal(query) as Partial<ColumnProps<T>>[];
        return filtered;
    }, [processedColumns, searchValue, operator, ignoreAccent]);

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
                const displayText: string = col.headerText || (col.type === 'checkbox' ? localization?.getConstant('CheckBox') : key);
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
        setSearchValue('');
        onClose?.();
        setInternalOpen(false);
    }, [onClose]);

    /**
     * Apply column visibility changes and close dialog.
     * Uses col.uid as the fallback key for field-less columns such as command columns.
     */
    const handleOk: () => void = useCallback((): void => {
        if (allColumnsHidden) { return; }
        if (uiColumns) {
            uiColumns.current?.forEach((col: ColumnProps) => {
                const key: string = col.field || col.uid;
                if (key && columnVisibility.has(key)) {
                    if (!isNullOrUndefined(col.visible) || columnVisibility.get(key) !== true) {
                        col.visible = columnVisibility.get(key);
                    }
                }
            });
        }
        // Fire onApply event with column visibility changes
        if (onApply) {
            onApply({
                columnVisibility,
                columnChooserSettings: settings
            });
        }
        setColumnChooserState({});
        setSearchValue('');
        onClose?.();
        setInternalOpen(false);
    }, [columnVisibility, onClose, onApply, settings, uiColumns, setColumnChooserState]);

    /**
     * Optimized: Handle individual column checkbox toggle
     */
    const handleColumnToggle: (field: string, checked: boolean) => void = useCallback((field: string, checked: boolean) : void => {
        setColumnVisibility((prev: Map<string, boolean>) => new Map(prev).set(field, checked));
    }, []);

    /**
     * Optimized: Handle Select All checkbox toggle.
     * Uses col.uid as fallback key for field-less columns (e.g. command columns).
     */
    const handleSelectAllToggle: (checked: boolean) => void = useCallback((checked: boolean) : void => {
        setColumnVisibility((prev: Map<string, boolean>) => {
            const newState: Map<string, boolean> = new Map(prev);
            filteredColumns.forEach((col: Partial<ColumnProps<T>>) => {
                const key: string = col.field || col.uid;
                if (key) {
                    newState.set(key, checked);
                }
            });
            return newState;
        });
    }, [filteredColumns]);

    /**
     * Handle search input change
     */
    const handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchValue(e.target.value);
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
        if (internalOpen) {
            document.body.addEventListener('click', clickHandler);
            document.body.addEventListener('keydown', keyDownHandler);
            document.body.addEventListener('keyup', keyUpHandler);
        }
        return () => {
            document.body.removeEventListener('click', clickHandler);
            document.body.removeEventListener('keydown', keyDownHandler);
            document.body.removeEventListener('keyup', keyUpHandler);
        };
    }, [internalOpen, clickHandler, keyDownHandler, keyUpHandler]);

    /**
     * Position dialog relative to anchor element or custom position
     */
    useEffect(() => {
        if (internalOpen && isRender.current) {
            const hostEl: HTMLElement = dialogRef.current?.element as HTMLElement | undefined;
            const dialogElement: HTMLElement = hostEl?.firstElementChild as HTMLElement | undefined;

            if (!dialogElement) {
                return;
            }

            // Temporarily display to calculate dimensions
            dialogElement.style.display = 'block';
            const dlgWidth: number = dialogElement.offsetWidth as number;
            dialogElement.style.display = '';

            if (position && (position.x !== undefined || position.y !== undefined)) {
                // Use custom position if provided
                if (position.x !== undefined) {
                    dialogElement.style.left = position.x + 'px';
                }
                if (position.y !== undefined) {
                    dialogElement.style.top = position.y + 'px';
                }
            } else {
                // Calculate position relative to toolbar button
                const target: HTMLElement = document.getElementById(`${id}_columnchooser`);
                if (target) {
                    const newpos: { top: number, left: number } = calculateRelativeBasedPosition(target, dialogRef.current?.element);
                    dialogElement.style.top = (newpos.top + target.getBoundingClientRect().height) + 9 + 'px';
                    const leftPos: number = ((newpos.left - dlgWidth) + target.clientWidth);
                    if (leftPos < 1) {
                        dialogElement.style.left = (dlgWidth + leftPos) - 120 + 'px';
                    } else {
                        dialogElement.style.left = leftPos + 'px';
                    }
                }
            }
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
        return localization?.getConstant('ChooseColumns');
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
            <div className='sf-columnchooser-main'>
                {/* Search Box - conditionally render based on enableSearch */}
                {enableSearch && (
                    <div className='sf-columnchooser-search sf-input-group'>
                        <InputBase
                            ref={searchInputRef}
                            tabIndex={0}
                            className='sf-columnchooser-searchbox'
                            placeholder={localization?.getConstant('searchButtonLabel')}
                            value={searchValue}
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
                            label={localization?.getConstant('SelectAll')}
                            className="sf-checkboxfiltertext"
                            onChange={(e: CheckboxChangeEvent) => {
                                handleSelectAllToggle(!!e?.value);
                            }}
                            disabled={filteredColumns.length === 0}
                        />
                    </div>
                </div>

                {/* Column List */}
                <div className='sf-columnchooser-content'>
                    {filteredColumns.length === 0 ? (
                        <div className="sf-columnchooser-empty">
                            {localization?.getConstant('NoMatches')}
                        </div>
                    ) : (
                        filteredColumns.map((col: Partial<ColumnProps<T>>, index: number) => {
                            const colKey: string = col.field || col.uid || String(index);
                            return (
                                <div
                                    key={colKey}
                                    className="sf-columnchooser-listitem"
                                >
                                    <div className='sf-columnchooser-checkbox' data-uid={`${id}-column${index}`}>
                                        <Checkbox
                                            checked={columnVisibility.get(colKey) || false}
                                            label={col.headerText || (col.type === 'checkbox' ? localization?.getConstant('CheckBox') : col.field)}
                                            className="sf-checkboxfiltertext"
                                            onChange={(e: CheckboxChangeEvent) => {
                                                handleColumnToggle(colKey, !!e?.value);
                                            }}
                                        />
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        );
    };

    if (!isOpen) {
        return null;
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
        </Dialog>
        }</>
    );
};
