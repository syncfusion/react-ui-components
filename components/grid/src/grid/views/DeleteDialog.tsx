import * as React from 'react';
import { useState, useCallback, useMemo, useEffect} from 'react';
import { Dialog } from '@syncfusion/react-popups/src/dialog/index';
import { Button } from '@syncfusion/react-buttons/src/button/button';
import { Color, Variant } from '@syncfusion/react-base/src/enums';
import { RadioButton } from '@syncfusion/react-buttons/src/radio-button/radio-button';
import { IL10n } from '@syncfusion/react-base/src/l10n';
import { useGridComputedProvider, useGridMutableProvider } from '../contexts/GridProviders';
import { AutoSelectMode } from '../types/enum';
import { GridRef } from '../types/grid.interfaces';
import { DeleteDialogProps, DeleteDialogEventArgs, DeleteOption } from '../types/edit.interfaces';
import { getCurrentPageSelectedItems } from '../utils/utils';

/**
 * DeleteDialog component for handling bulk delete operations with selection options.
 *
 * This component renders a dialog that allows users to delete selected records with two options:
 * - Delete only the current page selection
 * - Delete all selected records across pages
 *
 * @template T
 * @private
 * @param {DeleteDialogProps} props - The props for the DeleteDialog component.
 * @param {boolean} props.isOpen - Determines whether the dialog is visible.
 * @param {Function} props.onConfirm - Callback triggered when the delete action is confirmed.
 * @param {Function} props.onCancel - Callback triggered when the dialog is canceled.
 * @returns {React.ReactElement | null} The rendered dialog component or null if not visible.
 * @private
 */
export const DeleteDialog: React.FC<DeleteDialogProps> = ({
    isOpen,
    onConfirm,
    onCancel,
    onDialogOpen
}: DeleteDialogProps): React.ReactElement | null => {
    const { currentViewData, selectionModule, editModule, id, serviceLocator, selectionSettings, ...gridRef } = useGridComputedProvider();
    const { totalRecordsCount, getParentElement, cssClass } = useGridMutableProvider();
    const [deleteOption, setDeleteOption] = useState<string>('page');
    const [internalOpen, setInternalOpen] = useState<boolean>(false);
    const [pageOptionDisabled, setPageOptionDisabled] = useState<boolean>(false);
    const [allOptionDisabled, setAllOptionDisabled] = useState<boolean>(false);
    const [hidePageOption, setHidePageOption] = useState<boolean>(false);
    const [hideAllOption, setHideAllOption] = useState<boolean>(false);
    const [customOptions, setCustomOptions] = useState<any[]>([]);
    const localization: IL10n = serviceLocator?.getService<IL10n>('localization');

    // Check if autoSelectMode is Intermediate
    const isIntermediateMode: boolean = selectionSettings?.autoSelectMode === AutoSelectMode.Intermediate;

    // Calculate selected page and total counts first
    const { selectedPageCount, totalSelectedCount }: { selectedPageCount: number; totalSelectedCount: number } = useMemo(() => {
        const totalSelected: number = selectionModule?.isHeaderSelectAllMode ? totalRecordsCount -
            selectionModule?.unselectedRowState?.size : selectionModule?.selectedRowState?.size;
        const result: { count: number; } = getCurrentPageSelectedItems(
            currentViewData,
            selectionModule?.selectedRowState,
            gridRef as GridRef,
            false
        );

        return {
            selectedPageCount: result.count,
            totalSelectedCount: isIntermediateMode ? selectionModule?.selectedRowState?.size : totalSelected
        };
    }, [
        selectionModule,
        totalRecordsCount,
        currentViewData,
        editModule?.isDeleteDialogOpen
    ]);

    // Sync internal state with props
    useEffect((): void => {
        setInternalOpen(isOpen);
    }, [isOpen]);

    // Fire onDialogOpen event when dialog opens with selection counts
    useEffect((): void => {
        if (internalOpen && onDialogOpen) {
            const defaultOption: string = selectedPageCount === 0 ? 'all' : 'page';
            const eventArgs: DeleteDialogEventArgs = {
                selectedPageCount,
                totalSelectedCount,
                isIntermediateMode,
                defaultDeleteOption: defaultOption,
                customizations: undefined
            };

            // Call the event handler
            onDialogOpen(eventArgs);

            // Apply customizations if provided
            if (eventArgs.customizations) {
                if (eventArgs.customizations.pageOptionDisabled !== undefined) {
                    setPageOptionDisabled(eventArgs.customizations.pageOptionDisabled);
                }
                if (eventArgs.customizations.allOptionDisabled !== undefined) {
                    setAllOptionDisabled(eventArgs.customizations.allOptionDisabled);
                }
                if (eventArgs.customizations.hidePageOption !== undefined) {
                    setHidePageOption(eventArgs.customizations.hidePageOption);
                }
                if (eventArgs.customizations.hideAllOption !== undefined) {
                    setHideAllOption(eventArgs.customizations.hideAllOption);
                }
                if (eventArgs.customizations.options && eventArgs.customizations.options.length > 0) {
                    setCustomOptions(eventArgs.customizations.options);
                    const defaultCustomOption: DeleteOption | undefined =
                            eventArgs.customizations.options.find(
                                (opt: DeleteOption) => opt.isDefault
                            );
                    setDeleteOption(defaultCustomOption?.value || eventArgs.customizations.options[0]?.value || defaultOption);
                } else {
                    setCustomOptions([]);
                    if (eventArgs.customizations.defaultOption !== undefined) {
                        setDeleteOption(eventArgs.customizations.defaultOption);
                    } else {
                        setDeleteOption(defaultOption);
                    }
                }
            } else {
                setPageOptionDisabled(selectedPageCount === 0);
                setAllOptionDisabled(false);
                setHidePageOption(false);
                setHideAllOption(false);
                setCustomOptions([]);
                setDeleteOption(defaultOption);
            }
        }
    }, [internalOpen, selectedPageCount, totalSelectedCount, isIntermediateMode, onDialogOpen]);

    const handleDelete: () => Promise<void> = useCallback(async () => {
        try {
            await onConfirm(deleteOption);
        } finally {
            setDeleteOption('page'); // Reset to default
            setInternalOpen(false);
        }
    }, [deleteOption, onConfirm]);

    const handleCancel: () => void = useCallback(() => {
        setDeleteOption('page'); // Reset to default
        onCancel();
        setInternalOpen(false);
    }, [onCancel]);

    // Helper function to format localization strings with parameters
    const formatMessage: (template: string, ...args: (string | number)[]) => string = useCallback((
        template: string,
        ...args: (string | number)[]
    ): string => {
        return template.replace(/{(\d+)}/g, (match: string, index: string) => {
            const argIndex: number = parseInt(index, 10);
            return typeof args[argIndex as number] !== 'undefined' ? String(args[argIndex as number]) : match;
        });
    }, []);

    // Get localized messages
    const pageOptionLabel: string = useMemo(() => {
        const template: string = localization?.getConstant('deleteSelectedRecordsOnPage');
        const pluralSuffix: string = selectedPageCount !== 1 ? 's' : '';
        return formatMessage(template, selectedPageCount, pluralSuffix);
    }, [localization, selectedPageCount, formatMessage]);

    const allPagesOptionLabel: string = useMemo(() => {
        // Use different label based on autoSelectMode
        const templateKey: string = isIntermediateMode
            ? 'deleteAllSelectedRecordsFromLoadedPages'
            : 'deleteAllSelectedRecordsAcrossPages';
        const template: string = localization?.getConstant(templateKey);
        return formatMessage(template, totalSelectedCount);
    }, [localization, totalSelectedCount, formatMessage, isIntermediateMode]);

    const allPagesOptionDescription: string = useMemo(() => {
        if (selectedPageCount === 0) {
            // Use different description based on autoSelectMode
            const templateKey: string = isIntermediateMode
                ? 'deleteAllSelectedRecordsFromLoadedPagesDescriptionNoCurrentPage'
                : 'deleteAllSelectedRecordsAcrossPagesDescriptionNoCurrentPage';
            const template: string = localization?.getConstant(templateKey);
            const pluralSuffix: string = totalSelectedCount !== 1 ? 's' : '';
            return formatMessage(template, totalSelectedCount, pluralSuffix);
        }
        // Use different description based on autoSelectMode
        const templateKey: string = isIntermediateMode
            ? 'deleteAllSelectedRecordsFromLoadedPagesDescription'
            : 'deleteAllSelectedRecordsAcrossPagesDescription';
        const template: string = localization?.getConstant(templateKey);
        const additionalCount: number = totalSelectedCount - selectedPageCount;
        const pluralSuffix: string = additionalCount !== 1 ? 's' : '';
        return formatMessage(template, additionalCount, pluralSuffix);
    }, [localization, totalSelectedCount, selectedPageCount, formatMessage, isIntermediateMode]);

    return (
        <Dialog
            id={id + 'SelectionDelete'}
            open={internalOpen}
            modal={true}
            target={getParentElement()}
            header={localization?.getConstant('chooseRecordsToDelete')}
            style={{ width: '475px' }}
            closeIcon={false}
            className={cssClass}
            footer={
                <>
                    <Button
                        variant={Variant.Standard}
                        color={Color.Primary}
                        onClick={handleDelete}
                        className={cssClass}
                        onKeyDown={(event: React.KeyboardEvent<HTMLButtonElement>) => event.code === 'Enter' ? handleDelete() : undefined}
                    >
                        {localization?.getConstant('okButtonLabel')}
                    </Button>
                    <Button
                        variant={Variant.Standard}
                        onClick={handleCancel}
                        className={cssClass}
                        onKeyDown={(event: React.KeyboardEvent<HTMLButtonElement>) => event.code === 'Enter' ? handleCancel() : undefined}
                    >
                        {localization?.getConstant('cancelButtonLabel')}
                    </Button>
                </>
            }
        >
            <div className="sf-selection-delete-dialog-content">
                {customOptions.length > 0 ? (
                    // Render custom options
                    customOptions.map((option: DeleteOption) => (
                        <div
                            key={option.value}
                            className={`sf-selection-delete-option ${deleteOption === option.value ? 'selected' : ''} ${option.disabled ? 'disabled' : ''}`}
                            onClick={() => {
                                if (!option.disabled) {
                                    setDeleteOption(option.value);
                                }
                            }}
                            aria-disabled={option.disabled}
                        >
                            <div className="sf-selection-delete-option-inner">
                                <div className="sf-selection-delete-radio-wrapper">
                                    <RadioButton
                                        name="deleteOption"
                                        value={option.value}
                                        checked={deleteOption === option.value}
                                        disabled={option.disabled}
                                        onChange={() => !option.disabled ? setDeleteOption(option.value) : undefined}
                                    />
                                </div>
                                <div className="sf-selection-delete-text-wrapper">
                                    <div className="sf-selection-delete-option-label">
                                        {option.label}
                                    </div>
                                    {option.description && (
                                        <div className="sf-selection-delete-option-description">
                                            {option.description}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    // Render default options
                    <>
                        {!hidePageOption && (
                            <div
                                className={`sf-selection-delete-option ${deleteOption === 'page' && !pageOptionDisabled ? 'selected' : ''} ${pageOptionDisabled ? 'disabled' : ''}`}
                                onClick={() => {
                                    if (!pageOptionDisabled) {
                                        setDeleteOption('page');
                                    }
                                }}
                                aria-disabled={pageOptionDisabled}
                            >
                                <div className="sf-selection-delete-option-inner">
                                    <div className="sf-selection-delete-radio-wrapper">
                                        <RadioButton
                                            name="deleteOption"
                                            value="page"
                                            checked={deleteOption === 'page' && !pageOptionDisabled}
                                            disabled={pageOptionDisabled}
                                            onChange={() => !pageOptionDisabled ? setDeleteOption('page') : undefined}
                                        />
                                    </div>
                                    <div className="sf-selection-delete-text-wrapper">
                                        <div className="sf-selection-delete-option-label">
                                            {pageOptionLabel}
                                        </div>
                                        <div className="sf-selection-delete-option-description">
                                            {localization?.getConstant('deleteSelectedRecordsOnPageDescription')}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        {!hideAllOption && (
                            <div
                                className={`sf-selection-delete-option ${deleteOption === 'all' || pageOptionDisabled ? 'selected' : ''} ${allOptionDisabled ? 'disabled' : ''}`}
                                onClick={() => {
                                    if (!allOptionDisabled) {
                                        setDeleteOption('all');
                                    }
                                }}
                                aria-disabled={allOptionDisabled}
                            >
                                <div className="sf-selection-delete-option-inner">
                                    <div className="sf-selection-delete-radio-wrapper">
                                        <RadioButton
                                            name="deleteOption"
                                            value="all"
                                            checked={deleteOption === 'all' || pageOptionDisabled}
                                            disabled={allOptionDisabled}
                                            onChange={() => !allOptionDisabled ? setDeleteOption('all') : undefined}
                                        />
                                    </div>
                                    <div className="sf-selection-delete-text-wrapper">
                                        <div className="sf-selection-delete-option-label">
                                            {allPagesOptionLabel}
                                        </div>
                                        <div className="sf-selection-delete-option-description">
                                            {allPagesOptionDescription}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </Dialog>
    );
};

DeleteDialog.displayName = 'DeleteDialog';


