import { FieldValidationRules, FormValueType, ValidationRules } from '@syncfusion/react-inputs';
import { useMemo } from 'react';
import { ColumnProps, ColumnValidationParams } from '../types';

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

                    // Convert column validation rules to FormValidator format
                    if (validationRules.required !== undefined && validationRules.required !== false) {
                        columnRules.required = [validationRules.required, validationMessageTemplates.required];
                    }

                    if (validationRules.minLength !== undefined) {
                        columnRules.minLength = [
                            validationRules.minLength,
                            validationMessageTemplates.minLength(validationRules.minLength)
                        ];
                    }

                    if (validationRules.maxLength !== undefined) {
                        columnRules.maxLength = [
                            validationRules.maxLength,
                            validationMessageTemplates.maxLength(validationRules.maxLength)
                        ];
                    }

                    if (validationRules.min !== undefined) {
                        columnRules.min = [validationRules.min, validationMessageTemplates.min(validationRules.min)];
                    }

                    if (validationRules.max !== undefined) {
                        columnRules.max = [validationRules.max, validationMessageTemplates.max(validationRules.max)];
                    }

                    // Enhanced range validation support
                    if (validationRules.range && Array.isArray(validationRules.range) &&
                        validationRules.range.length === 2) {
                        columnRules.range = [
                            validationRules.range,
                            validationMessageTemplates.range(
                                validationRules.range[0],
                                validationRules.range[1]
                            )
                        ];
                    }

                    // Enhanced range length validation support
                    if (validationRules.rangeLength && Array.isArray(validationRules.rangeLength) &&
                        validationRules.rangeLength.length === 2) {
                        columnRules.rangeLength = [validationRules.rangeLength,
                            validationMessageTemplates.rangeLength(validationRules.rangeLength[0], validationRules.rangeLength[1])];
                    }

                    // Enhanced regex validation support
                    if (validationRules.regex) {
                        columnRules.regex = [validationRules.regex, validationMessageTemplates.regex];
                    }

                    if (validationRules.email) {
                        columnRules.email = [validationRules.email, validationMessageTemplates.email];
                    }

                    if (validationRules.url) {
                        columnRules.url = [validationRules.url, validationMessageTemplates.url];
                    }

                    if (validationRules.digits) {
                        columnRules.digits = [validationRules.digits, validationMessageTemplates.digits];
                    }

                    if (validationRules.creditCard) {
                        columnRules.creditCard = [validationRules.creditCard, validationMessageTemplates.creditCard];
                    }

                    if (validationRules.tel) {
                        columnRules.tel = [validationRules.tel, validationMessageTemplates.tel];
                    }

                    if (validationRules.equalTo) {
                        columnRules.equalTo = [validationRules.equalTo,
                            validationMessageTemplates.equalTo(validationRules.equalTo)];
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
                        columnRules.number = [validationRules.number, validationMessageTemplates.number];
                    }

                    if (column.type === 'date') {
                        columnRules.date = [validationRules.date, validationMessageTemplates.date];
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
