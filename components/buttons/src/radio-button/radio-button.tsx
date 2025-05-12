import * as React from 'react';
import { useRef, useImperativeHandle, useState, useEffect, forwardRef, Ref, ChangeEvent, InputHTMLAttributes } from 'react';
import { preRender, useProviderContext, useRippleEffect } from '@syncfusion/react-base';
import {LabelPlacement} from '../button/button';

/**
 * Defines the properties for the RadioButton component.
 */
export interface RadioButtonProps {
    /**
     * Specifies a value that indicates whether the RadioButton is `checked` or not. When set to `true`, the RadioButton will be in `checked` state.
     *
     * @default false
     */
    checked?: boolean;

    /**
     * Defines the caption for the RadioButton, that describes the purpose of the RadioButton.
     *
     * @default -
     */
    label?: string;

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
     * @event change
     */
    onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
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

type IRadioButtonProps = IRadioButton & InputHTMLAttributes<HTMLInputElement>;

/**
 * The RadioButton component allows users to select a single option from a group, utilizing a circular input field that provides a clear user selection interface.
 *
 * ```typescript
 * <RadioButton checked={true} label="Choose this option" name="choices" />
 * ```
 */
export const RadioButton: React.ForwardRefExoticComponent<IRadioButtonProps & React.RefAttributes<IRadioButton>> =
    forwardRef<IRadioButton, IRadioButtonProps>((props: IRadioButtonProps, ref: Ref<IRadioButton>) => {
        const {
            checked,
            className = '',
            disabled = false,
            label = '',
            labelPlacement = 'After',
            name = '',
            value = '',
            onChange,
            ...domProps
        } = props;
        const isControlled: boolean = checked !== undefined;
        const [isChecked, setIsChecked] = useState<boolean>(() => isControlled ? !!checked : !!domProps.defaultChecked);
        const radioInputRef: React.RefObject<HTMLInputElement | null> = useRef<HTMLInputElement>(null);
        const { dir, ripple } = useProviderContext();
        const { rippleMouseDown, Ripple} = useRippleEffect(ripple, { duration: 400, isCenterRipple: true });

        useEffect(() => {
            if (isControlled) {
                setIsChecked(!!checked);
            }
        }, [checked, isControlled]);

        useEffect(() => {
            preRender('radio');
        }, []);

        const publicAPI: Partial<IRadioButton> = {
            checked: isChecked,
            label,
            labelPlacement,
            value
        };

        useImperativeHandle(ref, () => ({
            ...publicAPI as IRadioButton,
            element: radioInputRef.current
        }), [publicAPI]);

        const onRadioChange: React.ChangeEventHandler<HTMLInputElement> = (event: ChangeEvent<HTMLInputElement>): void => {
            if (!isControlled) {
                setIsChecked(event.target.checked);
            }
            if (onChange) {
                onChange(event);
            }
        };

        const classNames: string = [
            'sf-radio-wrapper',
            'sf-wrapper',
            className
        ].filter(Boolean).join(' ');

        const rtlClass: string = (dir === 'rtl') ? 'sf-rtl' : '';
        const labelBefore: boolean = labelPlacement === 'Before';

        return (
            <div className={classNames}>
                <input
                    ref={radioInputRef}
                    type="radio"
                    id={`sf-${value}`}
                    name={name}
                    value={value}
                    disabled={disabled}
                    onChange={onRadioChange}
                    className={`sf-control sf-radio sf-lib ${className}`}
                    checked={isControlled ? !!checked : undefined}
                    defaultChecked={!isControlled ? isChecked : undefined}
                    {...domProps}
                />
                <label className={`${labelBefore ? 'sf-right' : ''} ${rtlClass}`} htmlFor={`sf-${value}`}>
                    <span className="sf-ripple-container" onMouseDown={rippleMouseDown}>
                        {ripple && <Ripple />}
                    </span>
                    <span className="sf-label">{label}</span>
                </label>
            </div>
        );
    });

export default React.memo(RadioButton);
