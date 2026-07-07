/**
 * FilterBar component constants
 * Centralizes all hardcoded strings for easier maintenance and consistency
 */

import { LabelMode } from '@syncfusion/react-base';

/**
 * CSS class names used in FilterBar component
 */
export const FILTER_CSS_CLASSES: { [key: string]: string } = {
    FILTER_DIV_INPUT: 'sf-filter-cell',
    FILTER_INPUT_TEXT: 'sf-filter-text',
    FILTER_TEMPLATE_CELL: 'sf-filter-template-cell',
    GRID_FILTERBAR: 'sf-grid-filterbar',
    DISABLED: 'sf-disabled',
    FILTERBAR_DROPDOWN: 'sf-filterbar-dropdown',
    FOCUSED: 'sf-focused'
} as const;

/**
 * Filter operator values that disable input
 */
export const NULL_OPERATORS: string[] = [
    'isNotNull',
    'isNull',
    'isNotEmpty',
    'isEmpty'
];

/**
 * Filter input element ID suffix
 */
export const FILTER_INPUT_ID_SUFFIX: string = '_filterBarcell';

/**
 * Default date format for DatePicker
 */
export const DEFAULT_DATE_FORMAT: string = 'M/d/yyyy';

/**
 * Label modes for Syncfusion inputs
 */
export const LABEL_MODES: { [key: string]: LabelMode } = {
    ALWAYS: 'Always',
    NEVER: 'Never'
} as const;

/**
 * Dropdown field settings
 */
export const DROPDOWN_FIELD_SETTINGS: { [key: string]: string } = {
    text: 'text',
    value: 'value'
} as const;

/**
 * Popup settings for dropdown
 */
export const DROPDOWN_POPUP_SETTINGS: { [key: string]: unknown } = {
    width: 'auto'
} as const;
