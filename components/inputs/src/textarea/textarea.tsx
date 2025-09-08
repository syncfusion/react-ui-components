import * as React from 'react';
import { forwardRef, ReactNode, Ref, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { CLASS_NAMES, LabelMode, renderClearButton, renderFloatLabelElement } from '../common/inputbase';
import { getUniqueID, preRender, useProviderContext } from '@syncfusion/react-base';
import { Variant } from '../textbox/textbox';
export { LabelMode };

export interface TextAreaChangeEvent {
    /**
     * Specifies the initial event object received from the textarea element.
     */
    event?: React.ChangeEvent<HTMLTextAreaElement>;

    /**
     * Specifies the current value of the TextArea.
     */
    value?: string;
}

/**
 * Constant for horizontal resize mode
 */
const RESIZE_X: string = 'sf-resize-x';

/**
 * Constant for vertical resize mode
 */
const RESIZE_Y: string = 'sf-resize-y';

/**
 * Constant for both horizontal and vertical resize mode
 */
const RESIZE_XY: string = 'sf-resize-xy';

/**
 * Constant for no resize mode
 */
const RESIZE_NONE: string = 'sf-resize-none';

/**
 * Constant for multi-line input class
 */
const MULTILINE: string = 'sf-multi-line-input';

/**
 * Constant for auto-width class
 */
const AUTOWIDTH: string = 'sf-auto-width';

/**
 * Specifies the available resize modes for components that support resizing.
 *
 * @enum {string}
 */
export enum ResizeMode {
    /**
     * Disables resizing functionality.
     */
    None = 'None',

    /**
     * Enables resizing in both horizontal and vertical directions.
     */
    Both = 'Both',

    /**
     * Enables resizing only in the horizontal direction.
     */
    Horizontal = 'Horizontal',

    /**
     * Enables resizing only in the vertical direction.
     */
    Vertical = 'Vertical'
}


export interface TextAreaProps {
    /**
     * Specifies the value of the component. When provided, the component will be controlled.
     *
     * @default -
     */
    value?: string;

    /**
     * Specifies the default value of the component. Used for uncontrolled mode.
     *
     * @default -
     */
    defaultValue?: string;

    /**
     * Specifies the floating label type for the component.
     *
     * @default 'Never'
     */
    labelMode?: LabelMode;

    /**
     * Specifies the placeholder text for the component.
     *
     * @default -
     */
    placeholder?: string;

    /**
     * Specifies the resize mode for the textarea
     *
     * @default ResizeMode.Both
     */
    resizeMode?: ResizeMode;

    /**
     * Specifies the number of columns for the textarea
     *
     * @default -
     */
    cols?: number;

    /**
     * Specifies whether to show a clear button within the input field.
     * When enabled, a clear button (×) appears when the field has a value,
     * allowing users to quickly clear the input with a single click.
     *
     * @default false
     */
    clearButton?: ReactNode;

    /**
     * Specifies the number of rows for the textarea
     *
     * @default 2
     */
    rows?: number;

    /**
     * Specifies the Callback that fired when the input value is changed.
     *
     * @event onChange
     * @returns {void}
     */
    onChange?: (event: TextAreaChangeEvent) => void;

    /**
     * Specifies the visual style variant of the component.
     *
     * @default Variant.Standard
     */
    variant?: Variant;
}

export interface ITextArea extends TextAreaProps {
    /**
     * Specifies the TextArea component element.
     *
     * @private
     * @default null
     */
    element?: HTMLTextAreaElement | null;
}

type ITextAreaProps = TextAreaProps & Omit<React.InputHTMLAttributes<HTMLTextAreaElement>, keyof TextAreaProps>;

/**
 * TextArea component that provides a multi-line text input field with enhanced functionality.
 * Supports both controlled and uncontrolled modes based on presence of value or defaultValue prop.
 *
 * ```typescript
 * import { TextArea } from '@syncfusion/react-inputs';
 *
 * <TextArea defaultValue="Initial text" placeholder="Enter text" rows={5} cols={40} />
 * ```
 */
export const TextArea: React.ForwardRefExoticComponent<ITextAreaProps & React.RefAttributes<ITextArea>> =
forwardRef<ITextArea, ITextAreaProps>((props: ITextAreaProps, ref: Ref<ITextArea>) => {
    const {
        readOnly = false,
        value,
        defaultValue,
        labelMode = 'Never',
        placeholder = '',
        disabled = false,
        width,
        resizeMode = ResizeMode.Both,
        maxLength,
        cols = null,
        rows = null,
        clearButton = false,
        className = '',
        variant,
        onChange,
        onBlur,
        onFocus,
        ...rest
    } = props;

    const isControlled: boolean = value !== undefined;

    const [uncontrolledValue, setUncontrolledValue] = useState<string | undefined>(
        defaultValue || ''
    );

    const displayValue: string | undefined = isControlled ? value : uncontrolledValue;

    const [isFocused, setIsFocused] = useState(false);
    const id: string = useMemo(() => rest.id || getUniqueID('textArea_'), [rest.id]);
    const elementRef: React.RefObject<HTMLTextAreaElement | null> = useRef<HTMLTextAreaElement>(null);
    const { locale, dir } = useProviderContext();

    const publicAPI: Partial<ITextAreaProps> = {
        clearButton,
        labelMode,
        disabled,
        readOnly,
        resizeMode
    };

    useEffect(() => {
        preRender('textarea');
    }, []);

    useEffect(() => {
        if (isControlled) {
            setUncontrolledValue(value || '');
        }
    }, [isControlled, value]);

    const getContainerClassNames: () => string = () => {
        return classNames(
            CLASS_NAMES.INPUTGROUP,
            CLASS_NAMES.WRAPPER,
            labelMode !== 'Never' ? CLASS_NAMES.FLOATINPUT : '',
            MULTILINE,
            className,
            (dir === 'rtl') ? CLASS_NAMES.RTL : '',
            disabled ? CLASS_NAMES.DISABLE : '',
            isFocused ? CLASS_NAMES.TEXTBOX_FOCUS : '',
            ((displayValue) !== '') ? CLASS_NAMES.VALIDINPUT : '',
            variant && variant.toLowerCase() !== 'standard'  ? variant.toLowerCase() === 'outlined' ? 'sf-outline' : `sf-${variant.toLowerCase()}` : '',
            AUTOWIDTH,
            'sf-medium'
        );
    };

    const classNames: (...classes: string[]) => string = (...classes: string[]) => {
        return classes.filter(Boolean).join(' ');
    };

    const containerClassNames: string = getContainerClassNames();

    useImperativeHandle(ref, () => ({
        ...publicAPI as ITextArea,
        element: elementRef.current
    }));

    const handleChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void =
    useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue: string = event.target.value;
        if (!isControlled) {
            setUncontrolledValue(newValue);
        }
        if (onChange) {
            onChange({ event, value: newValue });
        }
    }, [isControlled, onChange, uncontrolledValue, value]);

    const handleFocus: (event: React.FocusEvent<HTMLTextAreaElement, Element>) => void =
    useCallback((event: React.FocusEvent<HTMLTextAreaElement, Element>) => {
        setIsFocused(true);
        if (onFocus) {
            onFocus(event);
        }
    }, [onFocus]);

    const handleBlur: (event: React.FocusEvent<HTMLTextAreaElement, Element>) => void =
    useCallback((event: React.FocusEvent<HTMLTextAreaElement, Element>) => {
        setIsFocused(false);
        if (onBlur) {
            onBlur(event);
        }
    }, [onBlur]);

    const clearValue: () => void = useCallback(() => {
        const newValue: string = '';
        if (!isControlled) {
            setUncontrolledValue(newValue);
        }

        if (onChange) {
            onChange({ value: newValue, event: undefined });
        }
    }, [onChange, isControlled]);

    const getCurrentResizeClass: (resizeMode: string) => string = (resizeMode: string) => {
        return resizeMode === 'None' ? RESIZE_NONE : (resizeMode === 'Both' ? RESIZE_XY : resizeMode === 'Horizontal' ? RESIZE_X : RESIZE_Y );
    };

    return (
        <div className={containerClassNames} >
            <textarea
                ref={elementRef}
                id={id}
                value={isControlled ? (value) : undefined}
                defaultValue={!isControlled ? (defaultValue) : undefined}
                onChange={handleChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
                readOnly={readOnly}
                placeholder={labelMode === 'Never' ? placeholder : undefined}
                disabled={disabled}
                maxLength={maxLength}
                cols={cols ?? undefined}
                rows={rows ?? undefined}
                {...rest}
                style={{
                    width: width ? (typeof width === 'number' ? `${width}px` : width) : undefined,
                    resize: resizeMode === 'None' ? 'none' : undefined
                }}
                className={`sf-control sf-textarea sf-lib sf-input ${getCurrentResizeClass(resizeMode)}`}
                aria-multiline="true"
                aria-labelledby={`label_${id}`}
            />
            {renderFloatLabelElement(
                labelMode,
                isFocused || (displayValue) !== '',
                (displayValue as string),
                placeholder,
                id
            )}
            {clearButton && renderClearButton(
                (displayValue) ? (displayValue).toString() : '',
                clearValue, clearButton, 'textarea', locale
            )}
        </div>
    );
});

export default TextArea;
