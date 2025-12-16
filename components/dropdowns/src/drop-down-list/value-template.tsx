import * as React from 'react';
import { useEffect, useMemo } from 'react';
import { getValue } from '@syncfusion/react-base';
import { FieldSettingsModel } from './types';

export interface ValueTemplateProps {
    valueTemplate?: Function | React.ReactNode;
    dropdownValue?: number | string | boolean | object | null;
    dataSource?: { [key: string]: unknown }[] | string[] | number[] | boolean[];
    fields: FieldSettingsModel;
    allowObjectBinding?: boolean;
    onRenderedChange?: (rendered: boolean) => void;
}

const ValueTemplate: React.FC<ValueTemplateProps> = ({
    valueTemplate,
    dropdownValue,
    dataSource,
    fields,
    allowObjectBinding = false,
    onRenderedChange
}: ValueTemplateProps) => {
    const selectedItem: string | number | boolean | { [key: string]: unknown; } | null = useMemo(() => {
        if (!valueTemplate || dropdownValue == null || !Array.isArray(dataSource) || dataSource.length === 0) {
            return null;
        }
        const first: unknown = dataSource[0] as unknown;
        if (typeof first === 'string' || typeof first === 'number' || typeof first === 'boolean') {
            type DataItem = string | number | boolean | { [key: string]: object };
            const map: Map<DataItem, DataItem> = new Map((dataSource as DataItem[]).map((item: DataItem):
            [DataItem, DataItem] => [item, item]));
            return map.get(dropdownValue as DataItem) ?? null;
        }
        const arr: (string | number | boolean | { [key: string]: unknown; })[] = dataSource as Array<
        | string | number | boolean | { [key: string]: unknown }>;

        const match: string | number | boolean | { [key: string]: unknown; } | undefined =
        arr.find((item: string | number | boolean | { [key: string]: unknown; }) => {
            const fieldValue: unknown = fields.value ? (getValue(fields.value as string, item) as unknown) : item;
            if (allowObjectBinding) {
                return fieldValue === dropdownValue;
            }
            return (
                fieldValue === dropdownValue ||
                (fieldValue != null && dropdownValue != null && fieldValue.toString() === (dropdownValue as unknown as string).toString())
            );
        });
        return match ?? null;
    }, [valueTemplate, dropdownValue, dataSource, fields, allowObjectBinding]);

    useEffect(() => {
        if (onRenderedChange) {
            onRenderedChange(selectedItem !== null && Boolean(valueTemplate));
        }
    }, [onRenderedChange, selectedItem, valueTemplate]);

    if (!valueTemplate || selectedItem === null) {
        return null;
    }

    if (typeof valueTemplate === 'function') {
        return <>{valueTemplate(selectedItem)}</>;
    }

    return <>{valueTemplate}</>;
};

export default React.memo(ValueTemplate);
