import { FormState } from '@syncfusion/react-inputs';
import { EditCellRef, ValidationTooltipsProps } from '../../types/edit.interfaces';
import { RefObject, useEffect, useState, Fragment } from 'react';
import { Tooltip } from '@syncfusion/react-popups';
import { useGridComputedProvider, useGridMutableProvider } from '../../contexts';
import { GridRef } from '../../types/grid.interfaces';
import { MutableGridSetter } from '../../types/interfaces';
import { formatUnit } from '@syncfusion/react-base';
import { parseUnit } from '../../utils';

export const ValidationTooltips: React.FC<ValidationTooltipsProps> = ({ formState, editCellRefs, rowRef }: {
    formState: FormState | null,
    editCellRefs?: React.RefObject<{ [field: string]: EditCellRef }>,
    rowRef?: RefObject<HTMLTableRowElement>
}) => {
    const grid: Partial<GridRef> & Partial<MutableGridSetter> = useGridComputedProvider();
    const { editModule, commandColumnModule } = useGridMutableProvider();
    const { commandEdit } = commandColumnModule;
    const [tooltipTargets, setTooltipTargets] = useState<Record<string, React.RefObject<HTMLElement>>>({});
    const [activeTooltips, setActiveTooltips] = useState<Set<string>>(new Set());

    // Create container refs for all error fields - moved outside the render loop
    const [containerRefs, setContainerRefs] = useState<Record<string, RefObject<HTMLDivElement>>>({});

    // Create proper React refs for tooltip targets and manage tooltip visibility
    // Target the table cell (td) instead of the input element for proper arrow positioning
    useEffect(() => {
        const newTargets: Record<string, React.RefObject<HTMLElement>> = {};
        const newActiveTooltips: Set<string> = new Set<string>();
        const newContainerRefs: Record<string, RefObject<HTMLDivElement>> = {};

        Object.keys(formState.errors).forEach((field: string) => {
            // Target the table cell (td) containing the input for proper tooltip positioning
            let targetElement: HTMLElement | null = null;

            // First, try to find the input element
            let inputElement: HTMLElement = editModule?.isShowAddNewRowActive && editModule?.isShowAddNewRowDisabled ?
                grid.element?.querySelector(`.sf-grid-edit-row [id="grid-edit-${field}"]`) as HTMLElement :
                (editModule.editSettings.mode === 'Popup' ? rowRef.current : grid.element)?.querySelector(`[id="grid-edit-${field}"]`) as HTMLElement;
            if (commandEdit.current) {
                const uid: string = rowRef.current.getAttribute('data-uid');
                inputElement = rowRef.current.querySelector(`[id="${uid}-grid-edit-${field}"]`) as HTMLElement;
            }

            // Once we have the input element, find its containing table cell (td)
            // This ensures the tooltip arrow targets the cell, not the input itself
            // Find the closest table cell (td) that contains this input
            targetElement = inputElement?.closest('.sf-grid-content-row td.sf-cell, td.sf-grid-edit-cell') as HTMLElement;

            const targetElementRef: React.RefObject<HTMLElement> = { current: targetElement } as React.RefObject<HTMLElement>;
            newTargets[field as string] = targetElementRef;
            newActiveTooltips.add(field);

            // Create or reuse container ref for this field
            newContainerRefs[field as string] = containerRefs[field as string] || { current: null };
        });

        setTooltipTargets(newTargets);
        setActiveTooltips(newActiveTooltips);
        setContainerRefs(newContainerRefs);
    }, [formState?.errors, editCellRefs]);

    // Cleanup effect for container refs
    useEffect(() => {
        return () => {
            Object.values(containerRefs).forEach((ref: RefObject<HTMLDivElement>) => {
                if (ref.current) {
                    ref.current = null;
                }
            });
        };
    }, [containerRefs]);

    return (
        <>
            {Object.entries(formState.errors).map(([field, error]: [string, string]) => {
                const containerRef: RefObject<HTMLDivElement> = containerRefs[field as string];
                const targetRef: RefObject<HTMLElement> = tooltipTargets[field as string];
                const isActive: boolean = activeTooltips.has(field);

                if (!targetRef || !targetRef.current || !isActive || !containerRef) {
                    return null;
                }

                return (
                    <Fragment key={field}>
                        <div ref={containerRef} style={{
                            position: 'relative'
                        }}></div>
                        <Tooltip
                            key={`${field}_ValidationError`}
                            content={<label className="sf-error" htmlFor={field} id={`${field}-info`} style={{display: 'block'}}>{error}</label>}
                            target={targetRef}
                            container={containerRef}
                            style={{
                                maxWidth: formatUnit(targetRef.current?.getBoundingClientRect?.()?.width -
                                (parseUnit(getComputedStyle(targetRef.current)?.paddingRight) * 2))
                            }}
                            position="BottomCenter"
                            opensOn="Custom"
                            open={true}
                            className={`sf-grid-error sf-validation-error-${field}`}
                            windowCollision={true}
                        />
                    </Fragment>
                );
            })}
        </>
    );
};
