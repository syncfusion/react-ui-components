import * as React from 'react';
import { HTMLAttributes } from 'react';
/**
 * Specifies the type of severity to display the message with distinctive icons and colors.
 */
export declare enum Severity {
    /**
     * The message is displayed with icons and colors that indicate it is a normal message.
     */
    Normal = "Normal",
    /**
     * The message is displayed with icons and colors that indicate it is a success message.
     */
    Success = "Success",
    /**
     * The message is displayed with icons and colors that indicate it contains information.
     */
    Info = "Info",
    /**
     * The message is displayed with icons and colors that indicate it is a warning message.
     */
    Warning = "Warning",
    /**
     * The message is displayed with icons and colors that indicate it is an error message.
     */
    Error = "Error"
}
/**
 * Specifies the predefined appearance variants for the component to display.
 */
export declare enum Variant {
    /**
     * Denotes that severity is differentiated using text color and light background color.
     */
    Text = "Text",
    /**
     * Denotes that severity is differentiated using text color and border without background.
     */
    Outlined = "Outlined",
    /**
     * Denotes that severity is differentiated using text color and dark background color.
     */
    Filled = "Filled"
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
export declare const Message: React.ForwardRefExoticComponent<MsgProps & React.RefAttributes<IMessage>>;
export default Message;
