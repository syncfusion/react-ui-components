import { ForwardedRef, forwardRef, ForwardRefExoticComponent, ReactNode, RefAttributes, useMemo } from 'react';
import { HorizontalAlignment, useProviderContext } from '@syncfusion/react-base';
export { HorizontalAlignment };

const HELPERTEXT: string = 'sf-helper-text';
const HELPERTEXT_ON_FOCUS: string = 'sf-helper-text-on-focus';
const HELPERTEXT_FOCUSED: string = 'sf-helper-text-focused';
const RTL_CLASS: string = 'sf-rtl';


const DIRECTION_CLASS_MAP: Record<string, string> = {
    Left: 'sf-content-left',
    Right: 'sf-content-right',
    Center: 'sf-content-center'
};

export interface HelperTextProps {
    /**
     * The helper text content to display below the input.
     *
     * @default -
     */
    helperText?: ReactNode;

    /**
     * If true, helper text is only visible when the input is focused.
     *
     * @default false
     */
    helperTextOnFocus?: boolean;

    /**
     * Passed by the parent component to indicate current focus state of the input.
     *
     * @default false
     * @private
     */
    isFocused?: boolean;

    /**
     * Controls horizontal alignment of the helper text below the input.
     *
     * @default 'Left'
     */
    helperTextDirection?: HorizontalAlignment;
}

export const HelperText: ForwardRefExoticComponent<HelperTextProps & RefAttributes<HTMLDivElement>> =
forwardRef<HTMLDivElement, HelperTextProps>((props: HelperTextProps, ref: ForwardedRef<HTMLDivElement>) => {
    const {
        helperText,
        helperTextOnFocus = false,
        isFocused = false,
        helperTextDirection = 'Left'
    } = props;

    const { dir } = useProviderContext();

    const classNames: string = useMemo(() => {
        return [
            'sf-control',
            HELPERTEXT,
            DIRECTION_CLASS_MAP[`${helperTextDirection}`],
            helperTextOnFocus ? HELPERTEXT_ON_FOCUS : '',
            helperTextOnFocus && isFocused ? HELPERTEXT_FOCUSED : '',
            dir === 'rtl' ? RTL_CLASS : ''
        ].filter(Boolean).join(' ');
    }, [helperTextOnFocus, helperTextDirection, isFocused, dir]);

    if (!helperText) { return null; }

    return (
        <div className='sf-helper-text-container'>
            <div ref={ref} className={classNames}>
                {helperText}
            </div>
        </div>
    );
});

HelperText.displayName = 'HelperText';

export default HelperText;
