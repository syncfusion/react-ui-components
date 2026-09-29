import { useCallback, useEffect, useMemo, useState } from 'react';
import { applyPivotControlCommand, PivotControlCommand, PivotFieldCapability } from '../services/pivot-controls';
import { PivotSettings } from '../types/pivot.interfaces';

/**
 * Owns transient pivot panel state while leaving committed report ownership with usePivot.
 *
 * @param {PivotSettings} settings - Committed pivot report settings.
 * @param {PivotFieldCapability[]} capabilities - Available source fields and supported roles.
 * @param {Function} onChange - Commits the next pivot report.
 * @returns {{draft: PivotSettings, dirty: boolean, dispatch: Function, apply: Function, cancel: Function}} Draft panel state handlers.
 * @private
 */
export function usePivotPanel<T>(settings: PivotSettings<T>, capabilities: PivotFieldCapability<T>[],
                                 onChange: (next: PivotSettings<T>) => void): {
        draft: PivotSettings<T>; dirty: boolean; dispatch: (command: PivotControlCommand) => void;
        apply: () => void; cancel: () => void;
    } {
    const committedKey: string = JSON.stringify(settings);
    const [draftState, setDraftState] = useState<{key: string; value: PivotSettings<T>}>({key: committedKey, value: settings});
    const draft: PivotSettings<T> = useMemo(() => {
        const report: PivotSettings<T> = draftState.key === committedKey ? draftState.value : settings;
        return report.customAggregates === settings.customAggregates ? report :
            {...report, customAggregates: settings.customAggregates};
    }, [draftState, committedKey, settings]);
    useEffect(() => {
        if (draftState.key !== committedKey) { setDraftState({key: committedKey, value: settings}); }
    }, [committedKey]);
    const dirty: boolean = useMemo(() => JSON.stringify(draft) !== committedKey, [draft, committedKey]);
    const dispatch: (command: PivotControlCommand) => void = useCallback((command: PivotControlCommand): void => {
        const next: PivotSettings<T> = applyPivotControlCommand(draft, command, capabilities);
        setDraftState({key: committedKey, value: next});
        if (!settings.deferLayoutUpdate && next !== draft) { onChange(next); }
    }, [draft, capabilities, committedKey, settings.deferLayoutUpdate, onChange]);
    return {draft, dirty, dispatch,
        apply: (): void => { if (dirty) { onChange(draft); } },
        cancel: (): void => setDraftState({key: committedKey, value: settings})};
}

