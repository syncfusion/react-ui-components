import * as React from 'react';
import { useEffect, useRef, useState, forwardRef, HTMLAttributes, useImperativeHandle, useMemo, useCallback, Ref } from 'react';
import { IL10n, L10n, preRender, useProviderContext, SvgIcon } from '@syncfusion/react-base';

/**
 * Specifies the type of severity to display the message with distinctive icons and colors.
 */
export enum Severity {
    /**
     * The message is displayed with icons and colors that indicate it is a normal message.
     */
    Normal = 'Normal',
    /**
     * The message is displayed with icons and colors that indicate it is a success message.
     */
    Success = 'Success',
    /**
     * The message is displayed with icons and colors that indicate it contains information.
     */
    Info = 'Info',
    /**
     * The message is displayed with icons and colors that indicate it is a warning message.
     */
    Warning = 'Warning',
    /**
     * The message is displayed with icons and colors that indicate it is an error message.
     */
    Error = 'Error'
}

/**
 * Specifies the predefined appearance variants for the component to display.
 */
export enum Variant {
    /**
     * Denotes that severity is differentiated using text color and light background color.
     */
    Text = 'Text',
    /**
     * Denotes that severity is differentiated using text color and border without background.
     */
    Outlined = 'Outlined',
    /**
     * Denotes that severity is differentiated using text color and dark background color.
     */
    Filled = 'Filled'
}

export interface MessageProps {
    /**
     * Shows or hides the severity icon in the Message component. This icon will be distinctive based on the severity property.
     *
     * When set to `true` (default), displays a severity-specific icon at the left edge of the Message.
     * When set to `false`, no icon is displayed.
     * When a React node is provided, displays the custom element instead of the default severity icon.
     *
     * @default true
     */
    icon?: boolean | React.ReactNode;

    /**
     * Shows or hides the close icon in the Message component. An end user can click the close icon to hide the message, and the onClose event will be triggered.
     *
     * When set to `false` (default), the close icon is not rendered.
     * When set to `true`, a default close icon (SVG) is displayed on the right side of the message.
     * When a React node is provided, it will be rendered as a custom close icon, replacing the default one.
     *
     * @default false
     */
    closeIcon?: boolean | React.ReactNode;

    /**
     * Specifies the severity of the message, which is used to define the appearance (icons and colors) of the message. The available severity messages are Normal, Success, Info, Warning, and Error.
     *
     * @default Severity.Normal
     */
    severity?: Severity;

    /**
     * Specifies the variant from predefined appearance variants to display the content of the Message component. The available variants are Text, Outlined, and Filled.
     *
     * @default Variant.Text
     */
    variant?: Variant;

    /**
     * Shows or hides the visibility of the Message component. When set to false, the Message component will be hidden.
     *
     * @default true
     */
    visible?: boolean;

    /**
     * Triggers when the Message component is closed successfully.
     *
     * @event closed
     */
    onClose?: (event: React.SyntheticEvent) => void;
}
export interface IMessage extends MessageProps {
    /**
     * This is message component element.
     *
     * @private
     * @default null
     */
    element?: HTMLDivElement | null;
}

type MsgProps = IMessage & HTMLAttributes<HTMLDivElement>;

/**
 * The Message component displays messages with severity by differentiating icons and colors to denote the importance and context of the message to the end user.
 *
 * ```typescript
 * <Message closeIcon={true}>Editing is restricted</Message>
 * ```
 */
export const Message: React.ForwardRefExoticComponent<MsgProps & React.RefAttributes<IMessage>> =
    forwardRef<IMessage, MsgProps>((props: MsgProps, ref: Ref<IMessage>) => {
        const {
            children,
            icon = true,
            closeIcon = false,
            severity = Severity.Normal,
            variant = Variant.Text,
            visible,
            onClose,
            className = '',
            ...eleAttr
        } = props;
        const [isVisible, setIsVisible] = useState(true);
        const eleRef: React.RefObject<HTMLDivElement | null> = useRef<HTMLDivElement>(null);
        const { locale, dir } = useProviderContext();
        const msgCloseIcon: string = 'M10.5858 12.0001L2.58575 4.00003L3.99997 2.58582L12 10.5858L20 2.58582L21.4142 4.00003L13.4142 12.0001L21.4142 20L20 21.4142L12 13.4143L4.00003 21.4142L2.58581 20L10.5858 12.0001Z';
        const infoIcon: string = 'M12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3ZM1 12C1 5.92487 5.92487 1 12 1C18.0751 1 23 5.92487 23 12C23 18.0751 18.0751 23 12 23C5.92487 23 1 18.0751 1 12ZM13 11V17H11V11H13ZM13 9V7H11V9H13Z';
        const successIcon: string = 'M3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12ZM12 1C5.92487 1 1 5.92487 1 12C1 18.0751 5.92487 23 12 23C18.0751 23 23 18.0751 23 12C23 5.92487 18.0751 1 12 1ZM10.5 16.4142L17.9142 9L16.5 7.58578L10.5 13.5858L7.50003 10.5858L6.08582 12L10.5 16.4142Z';
        const warningIcon: string = 'M10.2691 2.99378C11.0395 1.66321 12.9605 1.6632 13.7308 2.99378L22.9964 18.9979C23.7683 20.3312 22.8062 22 21.2655 22H2.73444C1.19378 22 0.231653 20.3313 1.00358 18.9979L10.2691 2.99378ZM21.2655 20L12 3.99585L2.73444 20L21.2655 20ZM13 14V9H11V14H13ZM13 16H11V18.5H13V16Z';
        const errorIcon: string = 'M3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12ZM12 1C5.92487 1 1 5.92487 1 12C1 18.0751 5.92487 23 12 23C18.0751 23 23 18.0751 23 12C23 5.92487 18.0751 1 12 1ZM12 10.5858L8.50003 7.08582L7.08582 8.50003L10.5858 12L7.08582 15.5L8.50003 16.9142L12 13.4142L15.5 16.9142L16.9142 15.5L13.4142 12L16.9142 8.50003L15.5 7.08582L12 10.5858Z';
        const [msgIcon, setMsgIcon] = useState(infoIcon);

        const closeIconTitle: string = useMemo(() => {
            const l10n: IL10n = L10n('message', { close: 'Close' }, locale);
            l10n.setLocale(locale);
            return l10n.getConstant('close');
        }, [locale]);

        const classArray: string[] = ['sf-control sf-message sf-lib', className];
        const hasWrap: boolean = useMemo(() => classArray.join(' ').split(' ').includes('sf-content-center'), [className]);

        const classes: string = useMemo(() => {
            if (dir === 'rtl') { classArray.push('sf-rtl'); }
            if ((visible === undefined && !isVisible) || (visible !== undefined && !visible)) { classArray.push('sf-hidden'); }

            switch (severity) {
            case Severity.Success: classArray.push('sf-success'); setMsgIcon(successIcon); break;
            case Severity.Warning: classArray.push('sf-warning'); setMsgIcon(warningIcon); break;
            case Severity.Error: classArray.push('sf-error'); setMsgIcon(errorIcon); break;
            case Severity.Info: classArray.push('sf-info'); setMsgIcon(infoIcon); break;
            default: setMsgIcon(infoIcon); break;
            }

            switch (variant) {
            case Variant.Outlined: classArray.push('sf-outlined'); break;
            case Variant.Filled: classArray.push('sf-filled'); break;
            default: break;
            }

            return classArray.join(' ');
        }, [className, dir, isVisible, visible, severity, variant]);

        useEffect(() => {
            preRender('message');
        }, []);

        /**
         * Function to perform message close action.
         *
         * @private
         * @param {React.SyntheticEvent} event - The original mouse or keyboard event arguments.
         * @returns {void}
         */
        function closeMessage(event: React.SyntheticEvent): void {
            setIsVisible(false);
            onClose?.(event);
        }

        /**
         * Function to perform key down action.
         *
         * @private
         * @param {React.KeyboardEvent} event - The original keyboard event arguments.
         * @returns {void}
         */
        function handleKeyDown(event: React.KeyboardEvent): void {
            if (event.key === 'Enter' || event.key === ' ') {
                closeMessage(event);
            }
        }

        /**
         * Gets the content of the message component.
         *
         * @private
         * @returns {React.JSX.Element} - The content of the message component.
         */
        const getContent: () => React.JSX.Element = useCallback((): React.JSX.Element => (
            <>
                {icon && (
                    <span className="sf-msg-icon">
                        {typeof icon === 'boolean' ? (
                            <SvgIcon width="16" height="16" d={msgIcon} />
                        ) : (
                            icon
                        )}
                    </span>
                )}
                <div className="sf-msg-content">
                    {children}
                </div>
            </>
        ), [icon, children, severity, msgIcon]);

        const publicAPI: Partial<IMessage> = {
            icon,
            closeIcon,
            severity,
            variant,
            visible
        };

        useImperativeHandle(ref, () => {
            return {
                ...publicAPI as IMessage,
                element: eleRef.current
            };
        });

        return (
            <div ref={eleRef} role="alert" className={classes} {...eleAttr}>
                {hasWrap ? (
                    <div className="sf-msg-content-wrap">{getContent()}</div>
                ) : (getContent())}

                {closeIcon && (
                    <button type="button" className="sf-msg-close-icon" onClick={closeMessage} onKeyDown={handleKeyDown} title={closeIconTitle} aria-label={closeIconTitle}>
                        {typeof closeIcon === 'boolean' ? (
                            <SvgIcon width="14" height="14" d={msgCloseIcon} />
                        ) : (
                            closeIcon
                        )}
                    </button>
                )}
            </div>
        );
    });

export default Message;
