import { JSX, memo, MemoExoticComponent, useMemo, MouseEvent, ComponentProps, ReactElement } from 'react';
import { CommandItemType, CommandItemProps, ICommandColumnBase, IRow, ColumnProps } from '../types';
import { Button, Variant } from '@syncfusion/react-buttons';
import { SaveIcon, CloseIcon, EditIcon, TrashIcon } from '@syncfusion/react-icons';
import { useGridComputedProvider, useGridMutableProvider } from '../contexts';
import { Color, IL10n, isNullOrUndefined, Size } from '@syncfusion/react-base';

// CSS class constants
const CSS_COMMAND_ITEMS: string = 'sf-grid-command-items';

/**
 * Generates an appropriate aria-label based on the command item type
 * Provides descriptive accessibility labels for screen reader users
 *
 * @param {CommandItemType} [type] - The CommandItemType (Edit, Delete, Update, or Cancel)
 * @param {IL10n} [localization] - The localization object
 * @returns {string} Descriptive aria-label string for accessibility
 * @private
 */
const getAriaLabel: (type?: CommandItemType, localization?: IL10n) => string = (type?: CommandItemType, localization?: IL10n): string => {
    switch (type) {
    case CommandItemType.Edit:
        return localization?.getConstant('editRowLabel');
    case CommandItemType.Delete:
        return localization?.getConstant('deleteRowLabel');
    case CommandItemType.Update:
        return localization?.getConstant('updateRowLabel');
    case CommandItemType.Cancel:
        return localization?.getConstant('cancelRowLabel');
    }
};

/**
 * Generates an appropriate title/tooltip based on the command item type
 * Provides user-friendly tooltip text for command buttons
 *
 * @param {CommandItemType} [type] - The CommandItemType (Edit, Delete, Update, or Cancel)
 * @param {IL10n} [localization] - The localization object
 * @returns {string} Descriptive title string for button tooltips
 * @private
 */
const getButtonTitle: (type?: CommandItemType, localization?: IL10n) => string = (type?: CommandItemType, localization?: IL10n): string => {
    switch (type) {
    case CommandItemType.Edit:
        return localization?.getConstant('editButtonLabel');
    case CommandItemType.Delete:
        return localization?.getConstant('deleteButtonLabel');
    case CommandItemType.Update:
        return localization?.getConstant('updateButtonLabel');
    case CommandItemType.Cancel:
        return localization?.getConstant('cancelButtonLabel');
    }
};

/**
 * CommandItem component renders a single command button with proper accessibility and event handling
 * Supports Edit, Delete, Update, and Cancel command types with appropriate icons and colors
 *
 * @component
 * @private
 * @param {Partial<CommandItemProps>} props - Command item properties
 * @param {CommandItemType} props.type - The type of command button (Edit, Delete, Update, or Cancel)
 * @param {ComponentProps<typeof Button>} [props.buttonProps] - Optional custom button properties
 * @returns {JSX.Element} A Syncfusion Button component with command-specific styling and handlers
 * @example
 * ```tsx
 * <CommandItem type={CommandItemType.Edit} />
 * ```
 */
const CommandItem: (props: Partial<CommandItemProps>) => JSX.Element = memo((props: Partial<CommandItemProps>) => {

    const { getRowObjectFromUID, serviceLocator } = useGridComputedProvider();
    const { editModule, currentViewData, cssClass } = useGridMutableProvider();
    const localization: IL10n = serviceLocator?.getService<IL10n>('localization');

    const itemType: CommandItemType = props.type;
    const buttonProps: ComponentProps<typeof Button> = props.buttonProps || {};

    /**
     * Memoized command button with accessibility attributes
     * Builds button with appropriate icon, color, and event handlers based on command type
     */
    const item: JSX.Element = useMemo(() => {
        // Build accessibility attributes with proper ARIA roles
        const accessibilityAttrs: ComponentProps<typeof Button> = {
            // Add aria-label if not already provided
            'aria-label': (buttonProps)?.['aria-label'] || getAriaLabel(itemType, localization),
            // Add title for tooltip if not already provided
            title: (buttonProps)?.title || getButtonTitle(itemType, localization),
            // Explicit role=button for screen reader clarity (though implicit on button elements)
            role: (buttonProps)?.role || 'button',
            // Data attribute for command type tracking and testing
            ...(itemType !== undefined && {
                'data-command-type': CommandItemType[`${itemType}`]?.toLowerCase()
            })
        };

        const buttonClass: string = cssClass ? cssClass + ' sf-radius-28' : 'sf-radius-28';

        return (
            <Button
                variant={Variant.Standard}
                icon={itemType === CommandItemType.Edit ? <EditIcon />
                    : itemType === CommandItemType.Delete ? <TrashIcon />
                        : itemType === CommandItemType.Update ? <SaveIcon />
                            : itemType === CommandItemType.Cancel ? <CloseIcon />
                                : <></>}
                size={Size.Small}
                color={itemType === CommandItemType.Update ? Color.Primary : Color.Secondary}
                onClick={(args: MouseEvent) => {
                    const row: HTMLTableRowElement = (args.target as HTMLElement).closest('.sf-grid-content-row');
                    const uid: string = row.getAttribute('data-uid');
                    if (itemType === CommandItemType.Edit) {
                        editModule.editRecord(row);
                    } else if (itemType === CommandItemType.Delete) {
                        const rowObj: IRow<ColumnProps> = getRowObjectFromUID(uid);
                        editModule.deleteRecord(undefined, rowObj.data);
                    } else if (itemType === CommandItemType.Update) {
                        (editModule.saveDataChanges as Function)?.(undefined, undefined, undefined, uid);
                    } else if (itemType === CommandItemType.Cancel) {
                        (editModule.cancelDataChanges as Function)?.(undefined, uid);
                    }
                }}
                {...buttonProps}
                className={buttonProps.className ? buttonProps.className + ' ' + buttonClass : buttonClass}
                {...accessibilityAttrs}
            />
        );
    }, [currentViewData, itemType]);

    return (
        <>
            {item}
        </>
    );
}) as (props: Partial<CommandItemProps>) => JSX.Element;

/**
 * CommandColumnBase component renders a group of command buttons within a grid cell
 * Manages the display of built-in (Edit, Delete, Update, Cancel) and custom command items
 * Dynamically shows appropriate commands based on the current row state (edit or normal mode)
 *
 * @component
 * @private
 * @param {Partial<ICommandColumnBase>} props - Command column properties
 * @param {ColumnProps} props.column - The command column configuration
 * @param {IRow<ColumnProps>} props.row - The current grid row data
 * @returns {JSX.Element} A container div with command buttons grouped for accessibility
 * @example
 * ```tsx
 * <CommandColumnBase row={row} column={commandColumn} />
 * ```
 */
const CommandColumnBase: (props: Partial<ICommandColumnBase>) => JSX.Element = memo((props: Partial<ICommandColumnBase>) => {

    const { serviceLocator } = useGridComputedProvider();
    const { commandColumnModule, currentViewData } = useGridMutableProvider();
    const localization: IL10n = serviceLocator?.getService<IL10n>('localization');
    const { commandEdit, commandEditRef, commandAddRef } = commandColumnModule;

    const commandItems: ReactElement<CommandItemProps>[] = props.column
        .getCommandItems?.({ column: props.column, data: props.row.data });
    const isAdd: boolean = commandAddRef.current.find((row: IRow<ColumnProps>) => { return row.uid === props.row.uid; }) ? true : false;

    /**
     * Filter command items based on the current row edit state
     * Shows Edit/Delete in normal mode, Update/Cancel in edit mode
     */
    const builtinItems: ReactElement<CommandItemProps>[] = commandItems?.filter((item: ReactElement<CommandItemProps>) => {
        if (commandEditRef.current[props.row.uid] || isAdd) {
            return item.props.type === CommandItemType.Update || item.props.type === CommandItemType.Cancel;
        }
        return item.props.type === CommandItemType.Edit || item.props.type === CommandItemType.Delete;
    });
    commandEdit.current = props.column.visible && builtinItems?.length ? true : false;

    /**
     * Find any custom command items without a specific type
     */
    const customizeItems: ReactElement<CommandItemProps> = commandItems?.find((item: ReactElement<CommandItemProps>) => {
        return isNullOrUndefined(item.props.type);
    });

    /**
     * Memoized command items container
     * Combines built-in command buttons with any custom command elements
     */
    const items: JSX.Element = useMemo(() => {
        return (
            <>
                {builtinItems}
                {customizeItems?.props.children}
            </>
        );
    }, [currentViewData]);

    return (
        <div
            className={CSS_COMMAND_ITEMS}
            role="group"
            aria-label={localization?.getConstant('commandActionsLabel')}
        >
            {items}
        </div>
    );
}) as (props: Partial<ICommandColumnBase>) => JSX.Element;

/**
 * Set display name for debugging purposes
 */
(CommandItem as MemoExoticComponent<(props: Partial<CommandItemProps>) => JSX.Element>).displayName = 'CommandItem';
(CommandColumnBase as MemoExoticComponent<(props: Partial<ICommandColumnBase>) => JSX.Element>).displayName = 'CommandColumnBase';

export { CommandItem, CommandColumnBase };
