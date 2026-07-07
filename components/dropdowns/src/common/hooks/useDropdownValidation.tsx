import { useEffect, useMemo } from 'react';
import { UseDropdownValidationProps, UseDropdownValidationReturn } from './hook-types';

export const useDropdownValidation: (props: UseDropdownValidationProps) => UseDropdownValidationReturn =
    (props: UseDropdownValidationProps): UseDropdownValidationReturn => {
        const {
            state: { dropdownValue },
            config: { required, valid, validationMessage },
            refs: { inputElementRef }
        } = props;

        const isInputValid: boolean = useMemo<boolean>(() => {
            if (valid !== undefined) { return Boolean(valid); }
            return required ? dropdownValue != null && dropdownValue.length > 0 : true;
        }, [valid, required, dropdownValue]);

        useEffect(() => {
            const message: string = isInputValid ? '' : (validationMessage || '');
            const el: HTMLInputElement | null | undefined = inputElementRef?.current ?? undefined;
            if (el && typeof el.setCustomValidity === 'function') {
                el.setCustomValidity(message);
            }
        }, [isInputValid, validationMessage, inputElementRef]);

        return { isInputValid };
    };
