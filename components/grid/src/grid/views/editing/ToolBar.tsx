import { Button, Color, Variant } from '@syncfusion/react-buttons';
import { Toolbar, ToolbarItem, ToolbarSpacer } from '@syncfusion/react-navigations';
import { JSX, RefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ToolbarAPI, ToolbarClickEvent, ToolbarItemConfig, ToolbarConfig } from '../../types/toolbar.interfaces';
import { MutableGridBase } from '../../types';
import { SelectionModel } from '../../types/selection.interfaces';
import { editModule } from '../../types/edit.interfaces';
import { searchModule } from '../../types/search.interfaces';
import { useGridComputedProvider, useGridMutableProvider } from '../../contexts';
import { IL10n } from '@syncfusion/react-base';
import { CloseIcon, EditIcon, PlusIcon, SaveIcon, SearchIcon, TrashIcon } from '@syncfusion/react-icons';
import { InputBase, renderClearButton, renderFloatLabelElement } from '@syncfusion/react-inputs';

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

    const searchId: string = `${gridId}_searchbar`;

    return (
        <div className={`sf-input-group sf-search${isFocused ? ' sf-input-focus' : ''}`}>
            <InputBase
                ref={searchInputRef}
                id={searchId}
                className="sf-search"
                type="search"
                tabIndex={0}
                placeholder="Search"
                value={disabled ? '' : searchValue}
                onClick={(e: React.MouseEvent<HTMLInputElement>) => handleClick(e)}
                onChange={handleChange}
                onKeyDown={allowKeyboard ? handleKeyDown : undefined}
                onFocus={handleFocus}
                onBlur={handleBlur}
                disabled={disabled}
            />
            {renderFloatLabelElement('Never', isFocused, searchValue, localization?.getConstant('searchButtonLabel'), searchId)}
            {renderClearButton(searchValue, clearInput)}
            <span
                id={`${gridId}_searchbutton`}
                className="sf-input-group-icon sf-search-icon"
                role="button"
                title={localization?.getConstant('searchButtonLabel')}
                onClick={(e: React.MouseEvent<HTMLSpanElement>) => {
                    // Prevent default and stop propagation to avoid focus issues
                    e.preventDefault();
                    e.stopPropagation();
                    handleSearch(searchValue);
                    // Move focus back to the search input to ensure consistent UX
                    searchInputRef.current?.focus();
                }}
            >
                <SearchIcon key={`${gridId}_searchicon`}/>
            </span>
        </div>
    );
};

const rearrangeToolbar: (toolbar: (string | ToolbarItemConfig)[]) => (string | ToolbarItemConfig)[] =
    (toolbar: (string | ToolbarItemConfig)[]): (string | ToolbarItemConfig)[] => {
        const withoutSearch: (string | ToolbarItemConfig)[] = toolbar.filter((item: string | ToolbarItemConfig) => {
            if (typeof item === 'string') {
                return item !== 'Search';
            }
            return item.id !== 'Search' && item.text !== 'Search';
        });

        const hasSearch: boolean = toolbar.some((item: string | ToolbarItemConfig) => {
            if (typeof item === 'string') {
                return item === 'Search';
            }
            return item.id === 'Search' || item.text === 'Search';
        });

        return hasSearch ? [...withoutSearch, toolbar.find((item: string | ToolbarItemConfig) => {
            if (typeof item === 'string') {
                return item === 'Search';
            }
            return item.id === 'Search' || item.text === 'Search';
        })!] : toolbar;
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
    toolbar?: (string | ToolbarItemConfig)[],
    gridId?: string,
    className?: string,
    toolbarAPI?: ToolbarAPI
}) => {
    toolbar = rearrangeToolbar(toolbar || []);
    const { serviceLocator, allowKeyboard } = useGridComputedProvider();
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
            const args: ToolbarClickEvent = {
                item: { id: itemId },
                event: originalEvent?.nativeEvent,
                cancel: false
            };
            toolbarAPI.handleToolbarClick(args);
        }, [toolbarAPI.handleToolbarClick]); // Only depend on the stable function

    // Use disabledItems from the toolbar API for rendering
    const disabledItems: Set<string> = toolbarAPI.disabledItems;

    // Create toolbar items only once based on configuration
    const renderToolbarItems: React.ReactElement<unknown, string | React.JSXElementConstructor<unknown>>[] = useMemo(() => {
        const items: React.ReactElement[] = [];

        toolbar.forEach((item: string | ToolbarItemConfig, index: number) => {
            let itemConfig: ToolbarItemConfig;

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
                case 'Search':
                    items.push(<ToolbarSpacer />); // condition based need to handle adding spacer.
                    // Search functionality using InputBase component similar to FilterBar pattern
                    items.push(
                        <ToolbarItem key={`search-${index}`} className='sf-search-wrapper'>
                            <SearchInputWrapper
                                gridId={gridId}
                                handleClick={(args: React.MouseEvent<HTMLInputElement>) => handleButtonClick(`${gridId}_search`, args)}
                                localization={localization}
                                searchModule={modulesRef.current.searchModule}
                                allowKeyboard={allowKeyboard}
                                disabled={disabledItems.has(`${gridId}_search`)}
                            />
                        </ToolbarItem>
                    );
                    return;
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
    }, [toolbar, gridId, handleButtonClick, disabledItems]); // Include disabledItems in dependencies

    // Only do initial refresh once when toolbar is ready
    useEffect(() => {
        if (toolbarAPI.isRendered) {
            // Single initial refresh after a short delay
            toolbarAPI.refreshToolbarItems();
        }
        return undefined;
    }, [toolbarAPI.isRendered]); // Only depend on isRendered

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
        const toolbarElement: HTMLElement | null = toolbarAPI.getToolbar();
        const gridElement: HTMLElement | null = toolbarElement?.closest('.sf-grid');
        gridElement?.addEventListener('selectionChanged', handleSelectionChange);
        gridElement?.addEventListener('editStateChanged', handleEditStateChange);
        gridElement?.addEventListener('toolbarRefresh', handleToolbarRefresh);

        return () => {
            gridElement?.removeEventListener('selectionChanged', handleSelectionChange);
            gridElement?.removeEventListener('editStateChanged', handleEditStateChange);
            gridElement?.removeEventListener('toolbarRefresh', handleToolbarRefresh);
        };
    }, [toolbarAPI.isRendered, toolbarAPI.refreshToolbarItems, gridId]);

    return (
        <Toolbar
            key={gridId + '_toolbar'}
            id={gridId + '_toolbar'}
            ref={toolbarAPI.toolbarRef}
            className={className}
            aria-label="Grid Toolbar"
            onClick={(args: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
                if ((args.target as HTMLElement)?.closest('.sf-toolbar-item button')?.id) {
                    handleButtonClick((args.target as HTMLElement)?.closest('.sf-toolbar-item button')?.id, args);
                }
            }}
        >
            {renderToolbarItems}
        </Toolbar>
    );
};
