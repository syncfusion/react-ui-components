import { FC, memo, useMemo } from 'react';
import { DropdownContextType, useDropdownContext } from '../context';
import { T } from '../../drop-down-list/types';
import { isPrimitive } from '../utils';
import { getValue } from '@syncfusion/react-base';
import { CSS_CLASSES } from '../constants';

export const DropdownValueTemplate: FC = memo(() => {
    const context: DropdownContextType = useDropdownContext();
    const {
        config: { valueTemplate, spanClickable, allowObjectBinding, dataSource },
        state: { dropdownValue },
        internalProps: { resolvedFields }
    } = context;

    const selectedItem: T | undefined | null = useMemo(() => {
        if (!valueTemplate || dropdownValue == null || !Array.isArray(dataSource) || dataSource.length === 0) {
            return null;
        }
        const selectedValue: T | null = Array.isArray(dropdownValue) && dropdownValue.length > 0 ? dropdownValue[0] : null;
        if (selectedValue == null) {
            return null;
        }

        if (isPrimitive(dataSource[0])) {
            const map: Map<T, T> = new Map((dataSource).map((item: T): [T, T] => [item, item]));
            return map.get(selectedValue) ?? null;
        }

        const match: T | undefined =
            dataSource.find((item: T) => {
                const fieldValue: T = resolvedFields.value ? getValue(resolvedFields.value, item) : item;
                if (allowObjectBinding) {
                    return item === selectedValue;
                }
                return (
                    fieldValue === selectedValue ||
                    (fieldValue != null && selectedValue != null && fieldValue.toString() === selectedValue.toString())
                );
            });
        return match;
    }, [valueTemplate, dropdownValue, dataSource, resolvedFields, allowObjectBinding]);

    if (!spanClickable || !valueTemplate || selectedItem === null) {
        return null;
    }
    return (
        <span className={CSS_CLASSES.VALUE_TEMPLATE}>
            {typeof valueTemplate === 'function' ? valueTemplate(selectedItem) : valueTemplate}
        </span>
    );
});

DropdownValueTemplate.displayName = 'DropdownValueTemplate';

export default DropdownValueTemplate;
