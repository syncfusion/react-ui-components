import { useRef, useImperativeHandle, useState, useEffect, forwardRef, Ref, InputHTMLAttributes, useCallback, useMemo,
    ChangeEvent, ForwardRefExoticComponent, RefAttributes, RefObject, ChangeEventHandler, memo, type MouseEvent
} from 'react';
import { preRender, useProviderContext, useRippleEffect, Color, Size, LabelPlacement, useStableId } from '@syncfusion/react-base';
export { LabelPlacement };

/**
 * Interface for RadioButton change event arguments
 */
export interface RadioButtonChangeEvent {
    /**
     * The initial event object received from the input element.
     */
    event: ChangeEvent<HTMLInputElement>;

    /**
     * The selected value of the RadioButton.
     */
    value: string;
}

/**
 * Defines the properties for the RadioButton component.
 */
export interface RadioButtonProps {
    /**
     * Specifies whether the RadioButton is `checked` (`true`) or unchecked (`false`). Use for controlled components.
     *
     * @default false
     */
    checked?: boolean;

    /**
     * Specifies the initial checked state of the RadioButton. Use for uncontrolled components.
     *
     * @default false
     */
    defaultChecked?: boolean;

    /**
     * Defines the caption for the RadioButton, that describes the purpose of the RadioButton.
     *
     * @default -
     */
    label?: string;

    /**
     * Specifies the size style of the checkbox. Options include 'Small', 'Medium' and 'Large'.
     *
     * @default Size.Medium
     */
    size?: Size;

    /**
     * Specifies the Color style of the radio-button. Options include 'Primary', 'Secondary', 'Warning', 'Success', 'Error', and 'Info'.
     *
     * @default -
     */
    color?: Color;

    /**
     * Specifies the position of the label relative to the RadioButton. It determines whether the label appears before or after the radio button element in the UI.
     *
     * @default LabelPlacement.After
     */
    labelPlacement?: LabelPlacement;

    /**
     * Defines `value` attribute for the RadioButton. It is a form data passed to the server when submitting the form.
     *
     * @default -
     */
    value?: string;

    /**
     * Event trigger when the RadioButton state has been changed by user interaction.
     *
     * @event onChange
     */
    onChange?: (event: RadioButtonChangeEvent) => void;
}

export interface IRadioButton extends RadioButtonProps {
    /**
     * This is RadioButton component input element.
     *
     * @private
     * @default null
     */
    element?: HTMLInputElement | null;
}

type IRadioButtonProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'size'> & IRadioButton;

/**
 * The RadioButton component allows users to select a single option from a group, utilizing a circular input field that provides a clear user selection interface.
 *
 * ```typescript
 * import { RadioButton } from "@syncfusion/react-buttons";
 *
 * <RadioButton checked={true} label="Choose this option" name="choices" />
 * ```
 */
export const RadioButton: ForwardRefExoticComponent<IRadioButtonProps & RefAttributes<IRadioButton>> =
    forwardRef<IRadioButton, IRadioButtonProps>((props: IRadioButtonProps, ref: Ref<IRadioButton>) => {
        const {
            checked,
            defaultChecked = false,
            className = '',
            disabled = false,
            label = '',
            color,
            size = Size.Medium,
            labelPlacement = 'After',
            name = '',
            value = '',
            onChange,
            ...domProps
        } = props;
        const isControlled: boolean = checked !== undefined;
        const [isChecked, setIsChecked] = useState<boolean>(() => isControlled ? !!checked : defaultChecked);
        const radioInputRef: RefObject<HTMLInputElement | null> = useRef<HTMLInputElement>(null);
        const [isFocused, setIsFocused] = useState(false);
        const rippleContainerRef: RefObject<HTMLSpanElement | null> = useRef<HTMLSpanElement>(null);
        const { dir, ripple } = useProviderContext();
        const { rippleMouseDown, Ripple} = useRippleEffect(ripple, { duration: 400, isCenterRipple: true });
        const inputId: string = domProps.id ?? useStableId('sf-radio');

        useEffect(() => {
            if (isControlled) {
                setIsChecked(!!checked);
            }
        }, [checked, isControlled]);

        useEffect(() => {
            preRender('radio');
        }, []);

        const publicAPI: Partial<IRadioButton> = useMemo<Partial<IRadioButton>>(() => ({
            checked: isChecked,
            label,
            labelPlacement,
            value,
            size,
            color
        }), [isChecked, label, labelPlacement, value, size, color]);

        useImperativeHandle(ref, () => ({
            ...publicAPI as IRadioButton,
            element: radioInputRef.current
        }), [publicAPI]);

        const onRadioChange: ChangeEventHandler<HTMLInputElement> = useCallback(
            (event: ChangeEvent<HTMLInputElement>): void => {
                if (!isControlled) {
                    setIsChecked(event.target.checked);
                }
                if (onChange) {
                    onChange({ event, value: value });
                }
            }, [disabled, onChange, value]);

        const handleMouseDown: (e: MouseEvent<HTMLDivElement>) => void = useCallback(
            (e: MouseEvent<HTMLDivElement>) => {
                if (disabled) { return; }
                if (ripple && rippleContainerRef.current && rippleMouseDown) {
                    const syntheticEvent: MouseEvent<HTMLSpanElement, globalThis.MouseEvent> = {
                        ...e,
                        currentTarget: rippleContainerRef.current,
                        target: rippleContainerRef.current
                    } as unknown as MouseEvent<HTMLSpanElement>;
                    rippleMouseDown(syntheticEvent);
                }
            }, [disabled, ripple, rippleMouseDown]);

        const handleFocus: () => void = (): void => setIsFocused(true);

        const handleBlur: () => void = (): void => setIsFocused(false);

        const sizeLower: string = String(size).toLowerCase();
        const colorLower: string = color ? String(color).toLowerCase() : '';

        const classNames: string = [
            'sf-radio-wrapper',
            'sf-wrapper',
            className,
            size !== undefined && sizeLower !== 'medium' ? `sf-${sizeLower}` : '',
            color && `sf-radio-${colorLower}`,
            'sf-pos-relative sf-display-inline-block'
        ].filter(Boolean).join(' ');

        const rtlClass: string = (dir === 'rtl') ? 'sf-rtl' : '';
        const labelBefore: boolean = labelPlacement === 'Before';
        const labelBottom: boolean = labelPlacement === 'Bottom';

        return (
            <div className={classNames} onMouseDown={!disabled ? handleMouseDown : undefined}>
                <input
                    ref={radioInputRef}
                    type="radio"
                    id={inputId}
                    name={name}
                    value={value}
                    disabled={disabled}
                    onChange={onRadioChange}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    className={`sf-control sf-radio ${className} sf-pos-absolute`}
                    checked={isControlled ? !!checked : undefined}
                    defaultChecked={!isControlled ? isChecked : undefined}
                    {...domProps}
                />
                <label className={`sf-radio-label sf-control sf-radio-${size.toLowerCase().substring(0, 2)} ${labelBefore ? 'sf-right' : ''} ${labelBottom ? 'sf-bottom' : ''} ${isFocused ? 'sf-focus' : ''} ${rtlClass}`} htmlFor={inputId}>
                    <span ref={rippleContainerRef} className="sf-ripple-container" >
                        {ripple && !disabled && <Ripple />}
                    </span>
                    <span className="sf-label">{label}</span>
                </label>
            </div>
        );
    });

export default memo(RadioButton);
