import { Button, Color, Variant } from '@syncfusion/react-buttons';
import { Toolbar, ToolbarItem, ToolbarSpacer } from '@syncfusion/react-navigations';
import { JSX, RefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ToolbarAPI, ToolbarClickEvent, ToolbarItemProps, ToolbarConfig } from '../../types/toolbar.interfaces';
import { MutableGridBase } from '../../types';
import { SelectionModel } from '../../types/selection.interfaces';
import { editModule } from '../../types/edit.interfaces';
import { searchModule } from '../../types/search.interfaces';
import { useGridComputedProvider, useGridMutableProvider } from '../../contexts';
import { IL10n, Position } from '@syncfusion/react-base';
import { ChevronDownFillIcon, CloseIcon, EditIcon, PlusIcon, SaveIcon, SearchIcon, TrashIcon, PrintIcon, ExportPdfIcon } from '@syncfusion/react-icons';
import { InputBase, renderClearButton, renderFloatLabelElement } from '@syncfusion/react-inputs';

// Constants for CSS classes to avoid hardcoding
const INPUT_GROUP: string = 'sf-input-group';
const CONTROL: string = 'sf-control';
const MEDIUM: string = 'sf-medium';
const GRID_SEARCH: string = 'sf-grid-search';
const INPUT_FOCUS: string = 'sf-input-focus';
const TOOLBAR_ITEM: string = 'sf-toolbar-item';
const SEARCH_WRAPPER: string = 'sf-search-wrapper';
const INPUT_ICON: string = 'sf-input-icon';
const SEARCH_ICON: string = 'sf-search-icon';
const GRID: string = 'sf-grid';

// Constants for hardcoded strings
const SEARCH_PLACEHOLDER: string = 'Search';
const SEARCH_BUTTON_LABEL: string = 'searchButtonLabel';
const COLUMN_CHOOSER_TITLE: string = 'Column Chooser';

/**
 * Search Input Wrapper Component using InputBase similar to FilterBar pattern
 *
 * @param {Object} props - The component props
 * @param {string} props.gridId - The ID of the grid
 * @param {IL10n} props.localization - The localization object
 * @param {searchModule} [props.searchModule] - The search module
 * @param {Function} [props.handleClick] - The click handler
 * @param {boolean} [props.allowKeyboard] - To allow keyboard
 * @param {boolean} [props.disabled] - To allow disabled
 * @returns {JSX.Element} - The rendered SearchInputWrapper component
 */
const SearchInputWrapper: React.FC<{
    gridId: string;
    localization: IL10n;
    searchModule?: searchModule;
    handleClick?: (args: React.MouseEvent<HTMLInputElement>) => void;
    allowKeyboard?: boolean;
    disabled?: boolean;
}> = ({ gridId, localization, searchModule, handleClick, allowKeyboard, disabled }: {
    gridId: string;
    localization: IL10n;
    searchModule?: searchModule;
    handleClick?: (args: React.MouseEvent<HTMLInputElement>) => void;
    allowKeyboard?: boolean;
    disabled?: boolean;
}): JSX.Element => {
    const [searchValue, setSearchValue] = useState<string>(disabled ? '' : searchModule.searchSettings?.value || '');
    const [isFocused, setIsFocused] = useState<boolean>(false);
    const searchInputRef: RefObject<HTMLInputElement> = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setSearchValue(searchModule.searchSettings?.value);
    }, [searchModule.searchSettings?.value]);

    const clearInput: () => void = useCallback((e?: React.MouseEvent) => {
        // Prevent default and stop propagation if event is provided
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        setSearchValue('');
        searchModule.search('');

        // Ensure input gets focus but after a short delay to let events settle
        setTimeout(() => {
            searchInputRef.current?.focus();
        }, 0);
    }, [searchModule]);

    const handleSearch: (value: string) => void = useCallback((value: string) => {
        searchModule?.search(value);
    }, [searchModule]);

    const handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === 'Tab' || (e.shiftKey && e.key === 'Tab')) {
            if (e.key === 'Enter') {
                e.preventDefault(); // Prevent default to avoid focus movement
                e.stopPropagation(); // Stop propagation to avoid grid focus handlers
            }
            handleSearch(searchValue);
        } else if (e.key === 'Escape') {
            clearInput();
        }
    }, [searchValue, handleSearch]);

    const handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchValue(e.target.value);
    }, []);

    const handleFocus: () => void = useCallback(() => {
        setIsFocused(true);
    }, []);

    const handleBlur: () => void = useCallback(() => {
        setIsFocused(false);
    }, []);

    // Memoized click handler for search icon
    const handleSearchIconClick: (e: React.MouseEvent<HTMLSpanElement>) => void = useCallback((e: React.MouseEvent<HTMLSpanElement>) => {
        e.preventDefault();
        e.stopPropagation();
        handleSearch(searchValue);
        searchInputRef.current?.focus();
    }, [searchValue, handleSearch]);

    const searchId: string = `${gridId}_searchbar`;
    const focusClass: string = isFocused ? ` ${INPUT_FOCUS}` : '';

    return (
        <div className={`${INPUT_GROUP} ${CONTROL} ${MEDIUM} ${GRID_SEARCH}${focusClass}`}>
            <InputBase
                ref={searchInputRef}
                id={searchId}
                tabIndex={0}
                placeholder={SEARCH_PLACEHOLDER}
                value={disabled ? '' : searchValue}
                onClick={handleClick}
                onChange={handleChange}
                onKeyDown={allowKeyboard ? handleKeyDown : undefined}
                onFocus={handleFocus}
                onBlur={handleBlur}
                disabled={disabled}
            />
            {renderFloatLabelElement('Never', isFocused, searchValue, localization?.getConstant(SEARCH_BUTTON_LABEL), searchId)}
            {renderClearButton(searchValue, clearInput)}
            <span
                id={`${gridId}_searchbutton`}
                className={`${INPUT_ICON} ${SEARCH_ICON}`}
                role="button"
                title={localization?.getConstant(SEARCH_BUTTON_LABEL)}
                onClick={handleSearchIconClick}
            >
                <SearchIcon key={`${gridId}_searchicon`}/>
            </span>
        </div>
    );
};

const rearrangeToolbar: (toolbar: (string | ToolbarItemProps)[]) => (string | ToolbarItemProps)[] =
    (toolbar: (string | ToolbarItemProps)[]): (string | ToolbarItemProps)[] => {
        // Filter out Search and ColumnChooser to move them to the right
        const withoutRightItems: (string | ToolbarItemProps)[] = toolbar.filter((item: string | ToolbarItemProps) => {
            if (typeof item === 'string') {
                return item !== 'Search' && item !== 'ColumnChooser';
            }
            return item.id !== 'Search' && item.text !== 'Search' &&
                   item.id !== 'ColumnChooser' && item.text !== 'ColumnChooser';
        });

        const columnChooserItem: string | ToolbarItemProps | undefined = toolbar.find((item: string | ToolbarItemProps) => {
            if (typeof item === 'string') {
                return item === 'ColumnChooser';
            }
            return item.id === 'ColumnChooser' || item.text === 'ColumnChooser';
        });

        const searchItem: string | ToolbarItemProps | undefined = toolbar.find((item: string | ToolbarItemProps) => {
            if (typeof item === 'string') {
                return item === 'Search';
            }
            return item.id === 'Search' || item.text === 'Search';
        });

        // Add right-side items in order: ColumnChooser, then Search
        const rightItems: (string | ToolbarItemProps)[] = [];
        if (columnChooserItem !== undefined) {
            rightItems.push(columnChooserItem);
        }
        if (searchItem !== undefined) {
            rightItems.push(searchItem);
        }

        return rightItems.length > 0 ? [...withoutRightItems, ...rightItems] : toolbar;
    };

/**
 * Toolbar component for the grid
 *
 * @param {Object} props - Toolbar props
 * @param {Array} props.toolbar - Toolbar props
 * @param {string} props.gridId - Toolbar props
 * @param {string} props.className - Toolbar props
 * @param {ToolbarAPI} props.toolbarAPI - Toolbar props
 * @returns {Element} Toolbar component
 */
export const GridToolbar: React.FC<ToolbarConfig> = ({
    toolbar,
    gridId,
    className,
    toolbarAPI
}: {
    toolbar?: (string | ToolbarItemProps)[],
    gridId?: string,
    className?: string,
    toolbarAPI?: ToolbarAPI
}) => {
    toolbar = rearrangeToolbar(toolbar || []);
    const { serviceLocator, allowKeyboard, editSettings, openColumnChooser } = useGridComputedProvider();
    const localization: IL10n = serviceLocator?.getService<IL10n>('localization');
    const modulesRef: React.RefObject<{
        editModule?: editModule,
        selectionModule?: SelectionModel,
        searchModule?: searchModule,
        currentViewData?: Object[]
    }> = useRef<{
        editModule?: editModule,
        selectionModule?: SelectionModel,
        searchModule?: searchModule,
        currentViewData?: Object[]
    }>({});

    const gridContext: MutableGridBase = useGridMutableProvider();
    const {
        editModule,
        selectionModule,
        searchModule,
        currentViewData
    } = gridContext;

    // Update refs without causing re-renders
    modulesRef.current = { editModule, selectionModule, searchModule, currentViewData };

    //  Stable button click handler that never changes
    const handleButtonClick: (itemId: string, originalEvent?: React.MouseEvent) => void =
        useCallback((itemId: string, originalEvent?: React.MouseEvent) => {
            // Handle Column Chooser button click - access from computed context
            if (itemId === `${gridId}_columnchooser`) {
                openColumnChooser?.();
                return;
            }

            const args: ToolbarClickEvent = {
                item: { id: itemId },
                event: originalEvent?.nativeEvent,
                cancel: false
            };
            toolbarAPI.handleToolbarClick(args);
        }, [toolbarAPI.handleToolbarClick, gridId, openColumnChooser]); // Only depend on the stable function

    // Use disabledItems from the toolbar API for rendering
    const disabledItems: Set<string> = toolbarAPI.disabledItems;

    // Use constants for CSS classes in renderToolbarItems
    const searchWrapperClass: string = SEARCH_WRAPPER;
    const columnChooserId: string = `${gridId}_columnchooser`;
    const searchId: string = `${gridId}_search`;

    // Create handleSearchClick callback once per render pass (not per item)
    type SearchClickHandler = (args: React.MouseEvent<HTMLInputElement>) => void;
    const handleSearchClick: SearchClickHandler = useCallback((args: React.MouseEvent<HTMLInputElement>) => {
        handleButtonClick(searchId, args);
    }, [handleButtonClick, searchId]);

    // Create handleColumnChooserClick callback
    const handleColumnChooserClick: () => void = useCallback(() => {
        handleButtonClick(columnChooserId);
    }, [handleButtonClick, columnChooserId]);

    // Create toolbar items only once based on configuration
    const renderToolbarItems: React.ReactElement<unknown, string | React.JSXElementConstructor<unknown>>[] = useMemo(() => {
        const items: React.ReactElement[] = [];

        toolbar.forEach((item: string | ToolbarItemProps, index: number) => {
            let itemConfig: ToolbarItemProps;

            if (typeof item === 'string') {
                // Predefined items
                switch (item) {
                case 'Add':
                    itemConfig = {
                        id: `${gridId}_add`,
                        title: localization?.getConstant('addButtonLabel'),
                        text: localization?.getConstant('addButtonLabel'),
                        icon: <PlusIcon key={`${gridId}_addicon`}/>,
                        disabled: disabledItems.has(`${gridId}_add`)
                    };
                    break;
                case 'Edit':
                    itemConfig = {
                        id: `${gridId}_edit`,
                        title: localization?.getConstant('editButtonLabel'),
                        text: localization?.getConstant('editButtonLabel'),
                        icon: <EditIcon key={`${gridId}_editicon`}/>,
                        disabled: disabledItems.has(`${gridId}_edit`)
                    };
                    break;
                case 'Update':
                    itemConfig = {
                        id: `${gridId}_update`,
                        title: localization?.getConstant('updateButtonLabel'),
                        text: localization?.getConstant('updateButtonLabel'),
                        icon: <SaveIcon key={`${gridId}_updateicon`}/>,
                        disabled: disabledItems.has(`${gridId}_update`)
                    };
                    break;
                case 'Delete':
                    itemConfig = {
                        id: `${gridId}_delete`,
                        title: localization?.getConstant('deleteButtonLabel'),
                        text: localization?.getConstant('deleteButtonLabel'),
                        icon: <TrashIcon key={`${gridId}_deleteicon`}/>,
                        disabled: disabledItems.has(`${gridId}_delete`)
                    };
                    break;
                case 'Cancel':
                    itemConfig = {
                        id: `${gridId}_cancel`,
                        title: localization?.getConstant('cancelButtonLabel'),
                        text: localization?.getConstant('cancelButtonLabel'),
                        icon: <CloseIcon key={`${gridId}_cancelicon`}/>,
                        disabled: disabledItems.has(`${gridId}_cancel`)
                    };
                    break;
                case 'Print':
                    itemConfig = {
                        id: `${gridId}_print`,
                        title: localization?.getConstant('printButtonLabel'),
                        text: localization?.getConstant('printButtonLabel'),
                        icon: <PrintIcon key={`${gridId}_printicon`}/>
                    };
                    break;
                case 'PdfExport':
                    itemConfig = {
                        id: `${gridId}_pdfexport`,
                        title: localization?.getConstant('pdfButtonLabel'),
                        text: localization?.getConstant('pdfButtonLabel'),
                        icon: <ExportPdfIcon key={`${gridId}_pdfexporticon`}/>
                    };
                    break;
                case 'ColumnChooser':
                    items.push(<ToolbarSpacer key={`spacer-${index}`} />); // Add spacer before ColumnChooser
                    // Column Chooser needs custom rendering with suffix icon on the right
                    items.push(
                        <ToolbarItem key={`columnchooser-${index}`}>
                            <Button
                                id={columnChooserId}
                                variant={Variant.Standard}
                                color={Color.Secondary}
                                onClick={handleColumnChooserClick}
                                title={COLUMN_CHOOSER_TITLE}
                                disabled={disabledItems.has(columnChooserId)}
                                tabIndex={disabledItems.has(columnChooserId) ? -1 : 0}
                                icon={<ChevronDownFillIcon key={`${gridId}_columnchooserchevronicon`}/>}
                                iconPosition={Position.Right}
                            >
                                Columns
                            </Button>
                        </ToolbarItem>
                    );
                    return;
                case 'Search': {
                    // Only add spacer if ColumnChooser is not present (otherwise spacer already added)
                    const hasColumnChooser: boolean = toolbar.some((item: string | ToolbarItemProps) => {
                        if (typeof item === 'string') {
                            return item === 'ColumnChooser';
                        }
                        return item.id === 'ColumnChooser' || item.text === 'ColumnChooser';
                    });
                    if (!hasColumnChooser) {
                        items.push(<ToolbarSpacer key={`spacer-${index}`} />);
                    }
                    // Search functionality using InputBase component similar to FilterBar pattern
                    items.push(
                        <ToolbarItem key={`search-${index}`} className={searchWrapperClass}>
                            <SearchInputWrapper
                                gridId={gridId}
                                handleClick={handleSearchClick}
                                localization={localization}
                                searchModule={modulesRef.current.searchModule}
                                allowKeyboard={allowKeyboard}
                                disabled={disabledItems.has(searchId)}
                            />
                        </ToolbarItem>
                    );
                    return;
                }
                }
            } else {
                // For custom items, merge the existing config with the disabled state
                itemConfig = {
                    ...item,
                    disabled: disabledItems.has(item.id) || item.disabled
                };
            }

            // Create toolbar button
            items.push(
                <ToolbarItem key={itemConfig?.id}>
                    <Button
                        key={itemConfig.id + '_button'}
                        id={itemConfig.id}
                        variant={Variant.Standard}
                        color={Color.Secondary}
                        icon={itemConfig?.icon}
                        onClick={itemConfig?.onClick}
                        title={itemConfig?.title}
                        disabled={itemConfig?.disabled}
                        tabIndex={itemConfig?.disabled ? -1 : 0}
                    >
                        {itemConfig?.text}
                    </Button>
                </ToolbarItem>
            );
        });

        return items;
    }, [toolbar, gridId, handleButtonClick, disabledItems, localization]); // Include disabledItems in dependencies

    // Only do initial refresh once when toolbar is ready
    useEffect(() => {
        if (toolbarAPI.isRendered) {
            // Single initial refresh after a short delay
            toolbarAPI.refreshToolbarItems();
        }
        return undefined;
    }, [toolbarAPI.isRendered, editSettings]); // Only depend on isRendered

    // Add event-based toolbar refresh to prevent reactive dependencies
    useEffect(() => {
        if (!toolbarAPI.isRendered) {
            return undefined;
        }

        // Create a custom event listener for toolbar refresh
        const handleToolbarRefresh: () => void = () => {
            toolbarAPI.refreshToolbarItems();
        };

        // Listen for selection changes via custom events instead of reactive dependencies
        const handleSelectionChange: () => void = () => {
            setTimeout(handleToolbarRefresh, 0);
        };

        const handleEditStateChange: () => void = () => {
            setTimeout(handleToolbarRefresh, 0);
        };

        // Add event listeners to the grid element for state changes
        // Store reference to ensure proper cleanup (prevents memory leaks)
        const toolbarElement: HTMLElement | null = toolbarAPI.getToolbar();
        const gridElement: HTMLElement | null = toolbarElement?.closest(`.${GRID}`);
        gridElement?.addEventListener('selectionChanged', handleSelectionChange);
        gridElement?.addEventListener('editStateChanged', handleEditStateChange);
        gridElement?.addEventListener('toolbarRefresh', handleToolbarRefresh);

        return () => {
            gridElement?.removeEventListener('selectionChanged', handleSelectionChange);
            gridElement?.removeEventListener('editStateChanged', handleEditStateChange);
            gridElement?.removeEventListener('toolbarRefresh', handleToolbarRefresh);
        };
    }, [toolbarAPI.isRendered, toolbarAPI.refreshToolbarItems, gridId]);

    // Memoized toolbar click handler using event delegation
    type ToolbarClickHandler = (args: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
    const handleToolbarClick: ToolbarClickHandler = useCallback((args: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        const buttonSelector: string = `.${TOOLBAR_ITEM} button`;
        const buttonElement: HTMLElement | null = (args.target as HTMLElement)?.closest(buttonSelector);
        if (buttonElement?.id) {
            handleButtonClick(buttonElement.id, args);
        }
    }, [handleButtonClick]);

    return (
        <Toolbar
            key={gridId + '_toolbar'}
            id={gridId + '_toolbar'}
            ref={toolbarAPI.toolbarRef}
            className={className}
            aria-label="Grid Toolbar"
            onClick={handleToolbarClick}
        >
            {renderToolbarItems}
        </Toolbar>
    );
};
