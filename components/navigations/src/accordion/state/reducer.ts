import { ReducerAction, ReducerState } from '../internal-types';
import type { AccordionPanelValue } from '../types';
import { filterByAllowed, pushUnique, shallowEqual } from '../utils/array-utils';

export const initialReducerState: (value?: AccordionPanelValue[]) => ReducerState =
    (value: AccordionPanelValue[] = []): ReducerState => ({
        value: value.slice(),
        focusedValue: undefined,
        everOpened: value.slice()
    });

export const accordionReducer: (state: ReducerState, action: ReducerAction) => ReducerState =
    (state: ReducerState, action: ReducerAction): ReducerState => {
        switch (action.type) {
        case 'SET_FOCUSED': {
            if (state.focusedValue === action.value) {
                return state;
            }
            return { value: state.value, focusedValue: action.value, everOpened: state.everOpened };
        }
        case 'SET_VALUE': {
            const filtered: AccordionPanelValue[] = filterByAllowed(action.value, (): boolean => true);
            const valueUnchanged: boolean = shallowEqual(state.value, filtered);
            let nextEverOpened: AccordionPanelValue[] = state.everOpened;
            for (let i: number = 0; i < filtered.length; i += 1) {
                nextEverOpened = pushUnique(nextEverOpened, filtered[i as number]);
            }
            if (valueUnchanged && nextEverOpened === state.everOpened) {
                return state;
            }
            return { value: filtered, focusedValue: state.focusedValue, everOpened: nextEverOpened };
        }
        default:
            return state;
        }
    };

export default accordionReducer;
