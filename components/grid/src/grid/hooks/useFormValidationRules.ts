import { FieldValidationRules, FormValueType, ValidationRules } from '@syncfusion/react-inputs';
import { useMemo } from 'react';
import { ColumnProps, ColumnValidationParams } from '../types';

/**
 * Hook to generate FormValidator validation rules from column.
 * These rules are used by the Form component to validate user input during add/edit operations.
 *
 * @private
 * @param {ColumnProps<T>[]} columns - Array of column definitions from the grid.
 * @returns {ValidationRules} Object containing validation rules keyed by field name, formatted for FormValidator.
 */
export const useFormValidationRules: <T>(columns: ColumnProps<T>[]) => ValidationRules =
    <T>(columns: ColumnProps<T>[]): ValidationRules => {

        return useMemo(() => {
            const rules: ValidationRules = {};

            columns.forEach((column: ColumnProps<T>) => {
                if (column.field && column.visible && (column.validationRules || column.type || column.edit?.type)) {
                    const columnRules: FieldValidationRules = {};
                    const validationRules: ColumnValidationParams = column.validationRules || {};

                    // Convert column validation rules to FormValidator format
                    if (validationRules.required !== undefined && validationRules.required !== false) {
                        columnRules.required = [validationRules.required, 'This field is required.'];
                    }

                    if (validationRules.minLength !== undefined) {
                        columnRules.minLength = [validationRules.minLength, `Please enter at least ${validationRules.minLength} characters.`];
                    }

                    if (validationRules.maxLength !== undefined) {
                        columnRules.maxLength = [validationRules.maxLength, `Please enter no more than ${validationRules.maxLength} characters.`];
                    }

                    if (validationRules.min !== undefined) {
                        columnRules.min = [validationRules.min, `Please enter a value greater than or equal to ${validationRules.min}.`];
                    }

                    if (validationRules.max !== undefined) {
                        columnRules.max = [validationRules.max, `Please enter a value less than or equal to ${validationRules.max}.`];
                    }

                    // Enhanced range validation support
                    if (validationRules.range && Array.isArray(validationRules.range) && validationRules.range.length === 2) {
                        columnRules.range = [validationRules.range, `Please enter a value in between ${validationRules.range[0]} and ${validationRules.range[1]}.`];
                    }

                    // Enhanced range length validation support
                    if (validationRules.rangeLength && Array.isArray(validationRules.rangeLength) &&
                        validationRules.rangeLength.length === 2) {
                        columnRules.rangeLength = [validationRules.rangeLength,
                            `Please enter between ${validationRules.rangeLength[0]
                            } and ${validationRules.rangeLength[1]} characters.`];
                    }

                    // Enhanced regex validation support
                    if (validationRules.regex) {
                        columnRules.regex = [validationRules.regex, 'This field format is invalid.'];
                    }

                    if (validationRules.email) {
                        columnRules.email = [validationRules.email, 'Please enter a valid email.'];
                    }

                    if (validationRules.url) {
                        columnRules.url = [validationRules.url, 'Please enter a valid url.'];
                    }

                    if (validationRules.digits) {
                        columnRules.digits = [validationRules.digits, 'Please enter digits(0-9) only.'];
                    }

                    if (validationRules.creditCard) {
                        columnRules.creditCard = [validationRules.creditCard, 'Please enter a valid creditcard number.'];
                    }

                    if (validationRules.tel) {
                        columnRules.tel = [validationRules.tel, 'Please enter a valid telephone number.'];
                    }

                    if (validationRules.equalTo) {
                        columnRules.equalTo = [validationRules.equalTo,
                            `This field value not matches with ${validationRules.equalTo} field value.`];
                    }

                    // Enhanced custom validation with proper error handling
                    if (validationRules.customValidator && typeof validationRules.customValidator === 'function') {
                        columnRules.customValidator = (value: FormValueType) => {
                            try {
                                const result: string | null = validationRules.customValidator(value);
                                return result || null;
                            } catch (error) {
                                return `Validation error: ${(error as Error).message}`;
                            }
                        };
                    }

                    if (column.type === 'number') {
                        columnRules.number = [validationRules.number, 'Please enter a valid number.'];
                    }

                    if (column.type === 'date') {
                        columnRules.date = [validationRules.date, 'Please enter a valid date.'];
                    }

                    // Only add rules if there are actual validation rules defined
                    if (Object.keys(columnRules).length > 0) {
                        rules[column.field] = columnRules;
                    }
                }
            });

            return rules;
        }, [columns]);
    };
