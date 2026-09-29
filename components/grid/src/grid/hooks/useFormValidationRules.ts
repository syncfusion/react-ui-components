import { FieldValidationRules, FormValueType, ValidationRule, ValidationRules } from '@syncfusion/react-inputs/src/form-validator/form-validator';
import { useMemo } from 'react';
import { ColumnProps, ColumnValidationParams } from '../types/column.interfaces';

type ValidationMessageTemplatesType = {
    readonly required: string;
    readonly minLength: (value: number) => string;
    readonly maxLength: (value: number) => string;
    readonly min: (value: number | string) => string;
    readonly max: (value: number | string) => string;
    readonly range: (min: number | string, max: number | string) => string;
    readonly rangeLength: (min: number, max: number) => string;
    readonly regex: string;
    readonly email: string;
    readonly url: string;
    readonly digits: string;
    readonly creditCard: string;
    readonly tel: string;
    readonly equalTo: (field: string) => string;
    readonly customValidatorError: (message: string) => string;
    readonly number: string;
    readonly date: string;
};

const validationMessageTemplates: ValidationMessageTemplatesType = {
    required: 'This field is required.',
    minLength: (value: number): string => `Please enter at least ${value} characters.`,
    maxLength: (value: number): string => `Please enter no more than ${value} characters.`,
    min: (value: number | string): string => `Please enter a value greater than or equal to ${value}.`,
    max: (value: number | string): string => `Please enter a value less than or equal to ${value}.`,
    range: (min: number | string, max: number | string): string =>
        `Please enter a value in between ${min} and ${max}.`,
    rangeLength: (min: number, max: number): string =>
        `Please enter between ${min} and ${max} characters.`,
    regex: 'This field format is invalid.',
    email: 'Please enter a valid email.',
    url: 'Please enter a valid url.',
    digits: 'Please enter digits(0-9) only.',
    creditCard: 'Please enter a valid creditcard number.',
    tel: 'Please enter a valid telephone number.',
    equalTo: (field: string): string => `This field value not matches with ${field} field value.`,
    customValidatorError: (message: string): string => `Validation error: ${message}`,
    number: 'Please enter a valid number.',
    date: 'Please enter a valid date.'
};

/**
 * Hook to generate FormValidator validation rules from column.
 * These rules are used by the Form component to validate user input during add/edit operations.
 *
 * @private
 * @param {ColumnProps<T>[]} columns - Array of column definitions from the grid.
 * @returns {ValidationRules} Object containing validation rules keyed by field name, formatted for FormValidator.
 */
export const useFormValidationRules: <T>(columns: ColumnProps<T>[]) => { rules: ValidationRules, columns: Map<string, ColumnProps<T>> } =
    <T>(columns: ColumnProps<T>[]): { rules: ValidationRules, columns: Map<string, ColumnProps<T>> } => {

        return useMemo(() => {
            const rules: ValidationRules = {};
            const validationColumns: Map<string, ColumnProps<T>> = new Map();

            columns.forEach((column: ColumnProps<T>) => {
                if (column.field && column.visible && (column.validationRules || column.type || column.edit?.type)) {
                    const columnRules: FieldValidationRules = {};
                    const validationRules: ColumnValidationParams = column.validationRules || {};

                    const getRuleConfig: <T>(rule: ValidationRule | T | [T, string?]) => {
                        value: T;
                        message: string;
                    } = <T>(rule: T | [T, string?] | ValidationRule | undefined) => {
                        if (Array.isArray(rule)) {
                            return { value: rule[0] as T, message: rule[1] };
                        }

                        return { value: rule as T | undefined, message: undefined };
                    };

                    // Convert column validation rules to FormValidator format
                    if (validationRules.required !== undefined && validationRules.required !== false) {
                        const { value, message } = getRuleConfig<boolean>(validationRules.required);
                        if (typeof value === 'boolean' && value !== false) {
                            columnRules.required = [value, message ?? validationMessageTemplates.required];
                        }
                    }

                    if (validationRules.minLength !== undefined) {
                        const { value, message } = getRuleConfig<number>(validationRules.minLength);
                        if (typeof value === 'number') {
                            columnRules.minLength = [value, message ?? validationMessageTemplates.minLength(value)];
                        }
                    }

                    if (validationRules.maxLength !== undefined) {
                        const { value, message } = getRuleConfig<number>(validationRules.maxLength);
                        if (typeof value === 'number') {
                            columnRules.maxLength = [value, message ?? validationMessageTemplates.maxLength(value)];
                        }
                    }

                    if (validationRules.min !== undefined) {
                        const { value, message } = getRuleConfig<number>(validationRules.min);
                        if (typeof value === 'number') {
                            columnRules.min = [value, message ?? validationMessageTemplates.min(value)];
                        }
                    }

                    if (validationRules.max !== undefined) {
                        const { value, message } = getRuleConfig<number>(validationRules.max);
                        if (typeof value === 'number') {
                            columnRules.max = [value, message ?? validationMessageTemplates.max(value)];
                        }
                    }

                    // Enhanced range validation support
                    if (validationRules.range && Array.isArray(validationRules.range) &&
                        validationRules.range.length === 2) {
                        if (typeof validationRules.range[0] === 'number' && typeof validationRules.range[1] === 'number') {
                            columnRules.range = [
                                validationRules.range as [number, number],
                                validationMessageTemplates.range(
                                    validationRules.range[0],
                                    validationRules.range[1]
                                )
                            ];
                        } else if (Array.isArray(validationRules.range[0]) && typeof validationRules.range[1] === 'string') {
                            const { value, message } = getRuleConfig<number[]>(validationRules.range as ValidationRule);
                            columnRules.range = [
                                value,
                                message ?? validationMessageTemplates.range(
                                    value[0],
                                    value[1]
                                )
                            ];
                        }
                    }

                    // Enhanced range length validation support
                    if (validationRules.rangeLength && Array.isArray(validationRules.rangeLength) &&
                        validationRules.rangeLength.length === 2) {
                        if (typeof validationRules.rangeLength[0] === 'number' && typeof validationRules.rangeLength[1] === 'number') {
                            columnRules.rangeLength = [validationRules.rangeLength as [number, number],
                                validationMessageTemplates.rangeLength(validationRules.rangeLength[0], validationRules.rangeLength[1])];
                        } else if (Array.isArray(validationRules.rangeLength[0]) && typeof validationRules.rangeLength[1] === 'string') {
                            const { value, message } = getRuleConfig<number[]>(validationRules.rangeLength as ValidationRule);
                            columnRules.rangeLength = [
                                value,
                                message ?? validationMessageTemplates.rangeLength(value[0], value[1])
                            ];
                        }
                    }

                    // Enhanced regex validation support
                    if (validationRules.regex !== undefined) {
                        const { value, message } = getRuleConfig<RegExp | string>(validationRules.regex);
                        if (value instanceof RegExp || typeof value === 'string') {
                            columnRules.regex = [value, message ?? validationMessageTemplates.regex];
                        }
                    }

                    if (validationRules.email !== undefined) {
                        const { value, message } = getRuleConfig<boolean>(validationRules.email);
                        if (typeof value === 'boolean' && value !== false) {
                            columnRules.email = [value, message ?? validationMessageTemplates.email];
                        }
                    }

                    if (validationRules.url !== undefined) {
                        const { value, message } = getRuleConfig<boolean>(validationRules.url);
                        if (typeof value === 'boolean' && value !== false) {
                            columnRules.url = [value, message ?? validationMessageTemplates.url];
                        }
                    }

                    if (validationRules.digits !== undefined) {
                        const { value, message } = getRuleConfig<boolean>(validationRules.digits);
                        if (typeof value === 'boolean' && value !== false) {
                            columnRules.digits = [value, message ?? validationMessageTemplates.digits];
                        }
                    }

                    if (validationRules.creditCard !== undefined) {
                        const { value, message } = getRuleConfig<boolean>(validationRules.creditCard);
                        if (typeof value === 'boolean' && value !== false) {
                            columnRules.creditCard = [value, message ?? validationMessageTemplates.creditCard];
                        }
                    }

                    if (validationRules.tel !== undefined) {
                        const { value, message } = getRuleConfig<boolean>(validationRules.tel);
                        if (typeof value === 'boolean' && value !== false) {
                            columnRules.tel = [value, message ?? validationMessageTemplates.tel];
                        }
                    }

                    if (validationRules.equalTo !== undefined) {
                        const { value, message } = getRuleConfig<string>(validationRules.equalTo);
                        if (typeof value === 'string') {
                            columnRules.equalTo = [value, message ?? validationMessageTemplates.equalTo(value)];
                        }
                    }

                    // Enhanced custom validation with proper error handling
                    if (validationRules.customValidator && typeof validationRules.customValidator === 'function') {
                        columnRules.customValidator = (value: FormValueType) => {
                            try {
                                const result: string | null = validationRules.customValidator(value);
                                return result || null;
                            } catch (error) {
                                return validationMessageTemplates.customValidatorError((error as Error).message);
                            }
                        };
                    }

                    if (column.type === 'number') {
                        const { value, message } = getRuleConfig<boolean>(validationRules.number);
                        if (typeof value === 'boolean' && value !== false) {
                            columnRules.number = [value, message ?? validationMessageTemplates.number];
                        }
                    }

                    if (column.type === 'date') {
                        const { value, message } = getRuleConfig<boolean>(validationRules.date);
                        if (typeof value === 'boolean' && value !== false) {
                            columnRules.date = [value, message ?? validationMessageTemplates.date];
                        }
                    }

                    // Only add rules if there are actual validation rules defined
                    if (Object.keys(columnRules).length > 0) {
                        rules[column.field] = columnRules;
                        validationColumns.set(column.field, column);
                    }
                }
            });

            return {rules: rules, columns: validationColumns};
        }, [columns]);
    };
