import { FormState } from '@syncfusion/react-inputs';
import { EditCellRef, ValidationTooltipsProps } from '../../types/edit.interfaces';
import { RefObject, useEffect, useState, Fragment, memo, useCallback, JSX, NamedExoticComponent } from 'react';
import { Tooltip } from '@syncfusion/react-popups';
import { useGridComputedProvider, useGridMutableProvider } from '../../contexts';
import { GridRef } from '../../types/grid.interfaces';
import { MutableGridSetter } from '../../types/interfaces';
import { formatUnit } from '@syncfusion/react-base';
import { parseUnit } from '../../utils';

// Selector constants to avoid hardcoded strings
const ADD_NEW_ROW_CLASS: string = '.sf-grid-edit-row';
const EDIT_INPUT_ID_PREFIX: string = 'grid-edit-';
const ROW_UID_ATTR: string = 'data-uid';
const CONTENT_ROW_CELL: string = '.sf-grid-content-row td.sf-cell';
const EDIT_CELL: string = 'td.sf-grid-edit-cell';
const ERROR_CLASS: string = 'sf-error';
const VALIDATION_ERROR_CLASS: string = 'sf-grid-error';

/**
 * Renders form validation error tooltips in grid cells.
 * Displays validation messages for each failed field using tooltip components.
 *
 * @component
 * @param {Object} props - Component props
 * @param {FormState | null} props.formState - Form validation state containing error messages
 * @param {Object.<string, EditCellRef>} [props.editCellRefs] - References to edit cell components
 * @param {RefObject<HTMLTableRowElement>} [props.rowRef] - Reference to the table row element
 * @returns {JSX.Element} Fragment containing tooltip elements for each validation error
 *
 * @example
 * ```tsx
 * <ValidationTooltips
 *   formState={formState}
 *   editCellRefs={editCellRefs}
 *   rowRef={rowRef}
 * />
 * ```
 */
const ValidationTooltipsComponent: React.FC<ValidationTooltipsProps> = ({ formState, editCellRefs, rowRef }: {
    formState: FormState | null,
    editCellRefs?: React.RefObject<{ [field: string]: EditCellRef }>,
    rowRef?: RefObject<HTMLTableRowElement>
}) => {
    const grid: Partial<GridRef> & Partial<MutableGridSetter> = useGridComputedProvider();
    const { editModule, commandColumnModule, offsetX, virtualSettings } = useGridMutableProvider();
    const { commandEdit } = commandColumnModule;
    const [tooltipTargets, setTooltipTargets] = useState<Record<string, React.RefObject<HTMLElement>>>({});
    const [activeTooltips, setActiveTooltips] = useState<Set<string>>(new Set());

    // Create container refs for all error fields - moved outside the render loop
    const [containerRefs, setContainerRefs] =
        useState<Record<string, { openedTranslateX?: number, container: RefObject<HTMLDivElement> }>>({});

    // Create proper React refs for tooltip targets and manage tooltip visibility
    // Target the table cell (td) instead of the input element for proper arrow positioning
    useEffect(() => {
        const newTargets: Record<string, React.RefObject<HTMLElement>> = {};
        const newActiveTooltips: Set<string> = new Set<string>();
        const newContainerRefs: Record<string, { openedTranslateX?: number, container: RefObject<HTMLDivElement> }> = {};

        Object.keys(formState.errors).forEach((field: string) => {
            // Target the table cell (td) containing the input for proper tooltip positioning
            let targetElement: HTMLElement | null = null;

            // First, try to find the input element
            let inputElement: HTMLElement | null = null;

            if (editModule?.isShowAddNewRowActive && editModule?.isShowAddNewRowDisabled) {
                inputElement = grid.element?.querySelector(
                    `${ADD_NEW_ROW_CLASS} [id="${EDIT_INPUT_ID_PREFIX}${field}"]`
                ) as HTMLElement;
            } else {
                const queryTarget: HTMLDivElement = editModule.editSettings.mode === 'Popup' ? rowRef?.current : grid.element;
                inputElement = queryTarget?.querySelector(
                    `[id="${EDIT_INPUT_ID_PREFIX}${field}"]`
                ) as HTMLElement;
            }

            if (commandEdit?.current && rowRef?.current) {
                const uid: string | null = rowRef.current.getAttribute(ROW_UID_ATTR);
                inputElement = rowRef.current.querySelector(
                    `[id="${uid}-${EDIT_INPUT_ID_PREFIX}${field}"]`
                ) as HTMLElement;
            }

            // Once we have the input element, find its containing table cell (td)
            // This ensures the tooltip arrow targets the cell, not the input itself
            if (inputElement) {
                targetElement = inputElement.closest(
                    `${CONTENT_ROW_CELL}, ${EDIT_CELL}`
                ) as HTMLElement;
            }

            const targetElementRef: React.RefObject<HTMLElement> = { current: targetElement } as React.RefObject<HTMLElement>;
            newTargets[field as string] = targetElementRef;
            newActiveTooltips.add(field);

            // Create or reuse container ref for this field
            newContainerRefs[field as string] = {
                container: containerRefs[field as string]?.container || { current: null },
                ...(virtualSettings.enableColumn ? {
                    openedTranslateX: containerRefs[field as string]?.container.current ?
                        containerRefs[field as string]?.openedTranslateX : offsetX
                } : {})
            };
        });

        setTooltipTargets(newTargets);
        setActiveTooltips(newActiveTooltips);
        setContainerRefs(newContainerRefs);

        // Cleanup: clear refs on unmount or when errors change
        return () => {
            setTooltipTargets({});
            setActiveTooltips(new Set());
        };
    }, [formState?.errors, editCellRefs, offsetX]);

    // Memoized tooltip row renderer to avoid recreating component on each render
    const renderTooltipRow: ([field, error]: [string, string]) => JSX.Element = useCallback(
        ([field, error]: [string, string]) => {
            const containerRef: { openedTranslateX?: number, container: RefObject<HTMLDivElement> } = containerRefs[field as string];
            const targetRef: RefObject<HTMLElement> = tooltipTargets[field as string];
            const isActive: boolean = activeTooltips.has(field);

            if (!targetRef || !targetRef.current || !isActive || !containerRef) {
                return null;
            }

            const width: string = formatUnit(targetRef.current?.getBoundingClientRect?.()?.width -
                (parseUnit(getComputedStyle(targetRef.current)?.paddingRight) * 2));
            const popup: boolean = editModule.editSettings.mode === 'Popup';
            if (!popup) {
                containerRef.container.current = grid.contentScrollRef;
            }

            return (
                <Fragment key={field}>
                    {popup ? <div ref={containerRef.container} style={{ position: 'relative' }}></div> : null}
                    <Tooltip
                        key={`${field}_ValidationError`}
                        content={<label className={ERROR_CLASS} htmlFor={field} id={`${field}-info`} style={{display: 'block'}}>{error}</label>}
                        target={targetRef}
                        container={containerRef.container}
                        style={{ maxWidth: width }}
                        position="BottomCenter"
                        opensOn="Custom"
                        open={true}
                        className={`${VALIDATION_ERROR_CLASS} sf-validation-error-${field}`}
                        windowCollision={popup}
                    />
                </Fragment>
            );
        },
        [containerRefs, tooltipTargets, activeTooltips, virtualSettings.enableColumn, offsetX]
    );

    return (
        <>
            {Object.entries(formState.errors).map(renderTooltipRow)}
        </>
    );
};

export const ValidationTooltips: NamedExoticComponent<ValidationTooltipsProps> = memo(ValidationTooltipsComponent);
