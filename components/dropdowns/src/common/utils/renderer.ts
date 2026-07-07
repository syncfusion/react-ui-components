import { IL10n, L10n } from '@syncfusion/react-base';
import { CSS_CLASSES } from '../constants';

interface ContainerClassNames {
    baseClasses: string[];
    componentClassName?: string;
    isLoading?: boolean;
    disabled?: boolean;
    isRtl?: boolean;
    readOnly?: boolean;
    floatLabel?: boolean;
    size?: string;
    isInputValid?: boolean;
    validityStyles?: boolean;
    variant?: string;
    isFocused?: boolean;
    isMultiSelect?: boolean;
    mode?: string;
    hasSelectedItems?: boolean;
}

interface InputClassNames {
    baseClasses?: string[];
    isRtl?: boolean;
    isInputValid?: boolean;
    inputClassName?: string;
    showValueTemplate?: boolean;
}

export const renderHighlightedText: (rawText: string, term: string) => Array<{ text: string; highlight: boolean }> =
    (rawText: string, term: string): Array<{ text: string; highlight: boolean }> => {
        const text: string = rawText ?? '';
        const search: string = (term ?? '').toLowerCase();
        if (!search) {
            return [{ text, highlight: false }];
        }
        const lower: string = text.toLowerCase();
        const parts: Array<{ text: string; highlight: boolean }> = [];
        let i: number = 0;
        while (i < text.length) {
            const idx: number = lower.indexOf(search, i);
            if (idx === -1) {
                parts.push({ text: text.slice(i), highlight: false });
                break;
            }
            if (idx > i) {
                parts.push({ text: text.slice(i, idx), highlight: false });
            }
            parts.push({ text: text.slice(idx, idx + search.length), highlight: true });
            i = idx + search.length;
        }
        return parts;
    };

export const splitMatches: (rawText: string, term: string) => Array<{ text: string; highlight: boolean }> =
    (rawText: string, term: string): Array<{ text: string; highlight: boolean }> => {
        return renderHighlightedText(rawText, term);
    };

export const buildContainerClasses: (conditions: ContainerClassNames) => string = (conditions: ContainerClassNames): string => {
    const {
        baseClasses,
        componentClassName,
        isLoading,
        disabled,
        isRtl,
        readOnly,
        floatLabel,
        size,
        isInputValid,
        validityStyles,
        variant,
        isFocused,
        isMultiSelect,
        mode,
        hasSelectedItems
    } = conditions;

    const classList: string[] = [...baseClasses];

    if (componentClassName) {
        classList.push(componentClassName);
    }
    if (isLoading) {
        classList.push(CSS_CLASSES.LOADING);
    }
    if (disabled) {
        classList.push(CSS_CLASSES.DISABLED);
    }
    if (isRtl) {
        classList.push(CSS_CLASSES.RTL);
    }
    if (readOnly) {
        classList.push(CSS_CLASSES.READONLY);
    }
    if (floatLabel) {
        classList.push(CSS_CLASSES.FLOAT_INPUT);
    }
    if (isFocused) {
        classList.push(CSS_CLASSES.INPUT_FOCUS);
    }
    if (!isInputValid && validityStyles) {
        classList.push(CSS_CLASSES.ERROR);
    }

    if (size) {
        const sizeClass: string = size === 'Small' ? CSS_CLASSES.SMALL :
            size === 'Large' ? CSS_CLASSES.LARGE : CSS_CLASSES.MEDIUM;
        classList.push(sizeClass);
    }

    if (variant) {
        const variantClass: string = variant.toLowerCase() === 'outlined' ? CSS_CLASSES.OUTLINE : `sf-${variant.toLowerCase()}`;
        classList.push(variantClass);
    }

    if (isMultiSelect && mode !== 'Box' && !isFocused && hasSelectedItems) {
        classList.push(CSS_CLASSES.DELIMITER);
    }

    if (isMultiSelect && hasSelectedItems) {
        classList.push(CSS_CLASSES.MIN_INPUT);
    }

    return classList.filter(Boolean).join(' ');
};

export const buildInputClasses: (conditions: InputClassNames) => string = (conditions: InputClassNames): string => {
    const {
        baseClasses = [],
        isRtl,
        isInputValid,
        inputClassName,
        showValueTemplate
    } = conditions;

    const classList: string[] = [...baseClasses];

    if (isRtl) {
        classList.push(CSS_CLASSES.RTL);
    }
    if (isInputValid) {
        classList.push(CSS_CLASSES.VALID_INPUT);
    }
    if (inputClassName) {
        classList.push(inputClassName);
    }
    if (showValueTemplate) {
        classList.push(CSS_CLASSES.INPUT_VALUE_TEMPLATE);
    }
    classList.push(CSS_CLASSES.ELLIPSIS);

    return classList.filter(Boolean).join(' ');
};

export const buildPopupElementClasses: (conditions: { popupClassNames?: string; isResizable?: boolean; }) => string =
    (conditions: { popupClassNames?: string; isResizable?: boolean; }): string => {
        const { popupClassNames = '', isResizable } = conditions;

        const classList: string[] = [CSS_CLASSES.DDL, CSS_CLASSES.POPUP];
        if (popupClassNames) {
            classList.push(popupClassNames);
        }
        if (isResizable) {
            classList.push(CSS_CLASSES.DROPDOWN_RESIZABLE);
        }

        return classList.filter(Boolean).join(' ');
    };


export const buildIconClasses: (isPopupOpen?: boolean) => string = (isPopupOpen?: boolean): string => {
    const classList: string[] = [CSS_CLASSES.INPUT_ICON, CSS_CLASSES.DDL_ICON];
    if (isPopupOpen) {
        classList.push(CSS_CLASSES.ICON_ROTATE);
    } else {
        classList.push(CSS_CLASSES.ICON_NORMAL);
    }
    return classList.join(' ');
};

export const buildCustomValueClasses: (isFocused?: boolean) => string = (isFocused?: boolean): string => {
    const classList: string[] = [CSS_CLASSES.MULTISELECT_CUSTOM_VALUE, CSS_CLASSES.LIST_ITEM];
    if (isFocused) {
        classList.push(CSS_CLASSES.ITEM_FOCUS);
    }
    return classList.join(' ');
};

export const buildSelectAllNodeClasses: (isFocused?: boolean) => string = (isFocused?: boolean): string => {
    const classList: string[] = [CSS_CLASSES.DD_SELECT_ALL_WRAPPER, CSS_CLASSES.LIST_ITEM, CSS_CLASSES.CHECKBOX_WRAPPER];
    if (isFocused) {
        classList.push(CSS_CLASSES.ITEM_FOCUS);
    }
    return classList.join(' ');
};

export const resolveLocalizationPlaceholder: (placeholder: string | undefined, localeComponentName: string | undefined, locale: string,
    showPlaceholder: boolean) => string = (placeholder: string | undefined, localeComponentName: string | undefined, locale: string,
                                           showPlaceholder: boolean): string => {
    if (!showPlaceholder) {
        return '';
    }
    const l10n: IL10n = L10n(String(localeComponentName), { placeholder: placeholder }, locale);
    l10n.setLocale(locale);
    const localized: string = l10n.getConstant('placeholder');
    return localized || (placeholder || '');
};

export const isFilterKeyBlocked: (key: string) => boolean =
    (key: string): boolean => new Set([' ', 'Home', 'End']).has(key);
