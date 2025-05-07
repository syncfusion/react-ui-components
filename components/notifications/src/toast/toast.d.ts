import { AnimationOptions } from '@syncfusion/react-base';
import { Severity } from '../message';
export interface ToastAnimationOptions {
    /**
     * Specifies the animation that should happen when toast opens.
     */
    show?: AnimationOptions;
    /**
     * Specifies the animation that should happen when toast closes.
     */
    hide?: AnimationOptions;
}
/**
 * Defines the horizontal positioning options for components like Toasts, Popups, and Dialogs.
 */
export declare enum PositionX {
    /**
     * Positions the component at the left edge of its container or target element.
     */
    Left = "Left",
    /**
     * Positions the component at the right edge of its container or target element.
     */
    Right = "Right",
    /**
     * Positions the component horizontally centered within its container or relative to its target element.
     */
    Center = "Center"
}
/**
 * Defines the vertical positioning options for Toasts component.
 */
export declare enum PositionY {
    /**
     * Positions the component at the top edge of its container or target element.
     */
    Top = "Top",
    /**
     * Positions the component at the bottom edge of its container or target element.
     */
    Bottom = "Bottom"
}
/**
 * Represents the positional axis for UI components like Toasts.
 * This interface defines configurable positioning options along the X and Y axes.
 */
export interface PositionAxis {
    /**
     * Specifies position on the X-Axis, accepts string or number.
     *
     * @default 'left'
     */
    X?: PositionX | string;
    /**
     * Specifies position on the Y-Axis, accepts string or number.
     *
     * @default 'top'
     */
    Y?: PositionY | string;
}
/**
 * Interface defining the props for the Toast component.
 */
export interface ToastProps {
    /**
     * Specifies the width of the toast component.
     * Can be set to a pixel value or percentage as a string,
     * or a number representing pixels.
     *
     * @default 'auto'
     */
    width?: string | number;
    /**
     * Specifies the height of the toast component.
     * Can be set to a pixel value or percentage as a string,
     * or a number representing pixels.
     *
     * @default 'auto'
     */
    height?: string | number;
    /**
     * The title displayed at the top of the toast.
     * Can be a simple string or any valid React node.
     * Useful for providing a brief header or context to the notification content.
     *
     * @default -
     */
    title?: string | React.ReactNode;
    /**
     * The icon displayed alongside the toast content.
     * Can be any valid React node, typically an SVG or image.
     * Helps to visually reinforce the message type (e.g., success, error).
     *
     * @default -
     */
    icon?: React.ReactNode;
    /**
     * Determines the stacking order of items in a collection or notification system.
     *
     * When set to true, newer items are displayed at the top of the container,
     * with subsequent items appearing below in descending order of creation time.
     *
     * When set to false, newer items are added to the bottom of the container,
     * with older items positioned above.
     *
     * @default false
     * @type {boolean}
     */
    newestOnTop?: boolean;
    /**
     * Determines whether to display a progress bar that indicates the remaining time
     * before the component (typically a Toast or notification) automatically dismisses.
     *
     * The progress bar provides visual feedback about the time remaining before
     * the notification disappears.
     *
     * @default false
     * @type {boolean}
     */
    progressBar?: boolean;
    /**
     * Determines whether to display a close button that allows users to manually
     * dismiss the component (typically a Toast, Dialog, or notification).
     *
     * When enabled, this gives users control over when to remove the notification
     * rather than relying solely on automatic timeout dismissal.
     *
     * @default false
     * @type {boolean}
     */
    closeButton?: boolean;
    /**
     * Time in milliseconds before the toast auto-closes
     *
     * @default 5000
     */
    timeout?: number;
    /**
     * Direction of the progress bar
     *
     * @default 'Rtl'
     */
    progressDirection?: 'Rtl' | 'Ltr';
    /**
     * Position of the toast on the screen
     *
     * @default { X: PositionX.Right, Y: PositionY.Bottom }
     */
    position?: PositionAxis;
    /**
     * An array of button configurations that will be rendered within the component.
     *
     * Each button consists of a model object containing button properties (such as text,
     * icon, disabled state, etc.) and a click handler function that will be executed
     * when the button is clicked.
     *
     * @type {Array<{model: any; click: () => void}>}
     * @optional
     *
     * @example
     * buttons={[
     *   {
     *     model: { content: 'OK', isPrimary: true },
     *     click: () => handleOkClick()
     *   },
     *   {
     *     model: { content: 'Cancel' },
     *     click: () => handleCancelClick()
     *   }
     * ]}
     *
     * @default []
     */
    buttons?: Array<{
        model: Record<string, unknown>;
        click: () => void;
    }>;
    /**
     * Target element to render the toast
     *
     * @default 'body'
     */
    target?: string;
    /**
     * Triggered when the toast is opened and becomes visible to the user.
     *
     * @event onOpen
     * @default null
     */
    onOpen?: () => void;
    /**
     * Triggered when the toast is closed and removed from view.
     *
     * @event onClose
     * @default null
     */
    onClose?: () => void;
    /**
     * Triggered when the user clicks anywhere within the toast.
     *
     * @event onClick
     * @default null
     */
    onClick?: (args: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
    /**
     * Specifies the animations that should happen when toast opens and closes.
     *
     * @default { show: { name: 'FadeIn', duration: 0, timingFunction: 'ease-out' },
     *            hide: { name: 'FadeOut', duration: 0, timingFunction: 'ease-out' } }
     */
    animation?: ToastAnimationOptions;
    /**
     * Specifies the Toast display time duration after interacting with the Toast.
     *
     * @default 1000
     */
    extendedTimeout?: number;
    /**
     * Specifies the severity of the toast content, which is used to define the appearance (icons and colors) of the toast. The available severity messages are Success, Info, Warning, and Error.
     *
     * @default Severity.Normal
     */
    severity?: Severity;
    /**
     * Controls whether the component is in open/expanded state.
     *
     * When true, the component will be displayed in its open state.
     * When false, the component will be in its closed state.
     * If not provided, the component will use its default closed state.
     * This property is useful for controlling the component's state programmatically as controlled component.
     *
     * @default false
     */
    open?: boolean;
    /**
     * The content to be displayed within the component.
     * Can be a string of text or any valid React node (elements, components, fragments, etc.).
     * If not provided, the component will render without content.
     *
     * @default -
     */
    content?: string | React.ReactNode;
}
/**
 * Ref object for the Toast component
 */
export interface IToast extends ToastProps {
    /**
     * Shows a new toast
     *
     * @param content - The content to be displayed in the toast
     * @returns The id of the newly created toast
     */
    show: (content: React.ReactNode) => string;
    /**
     * Hides a specific toast or the oldest one if no id is provided
     *
     * @param toastId - The id of the toast to hide (optional)
     */
    hide: (toastId?: string) => void;
}
type IToastProps = ToastProps & Omit<React.InputHTMLAttributes<HTMLDivElement>, keyof ToastProps>;
/**
 * Toast component for displaying temporary notifications to users.
 *
 * The Toast component provides a non-intrusive way to show informational,
 * success, warning, or error messages that automatically dismiss after
 * a configurable timeout period.
 *
 * ```typescript
 * <Toast content="Operation completed successfully" open={true} position={{ X: 'Right', Y: 'Bottom' }} />
 *```
 */
export declare const Toast: React.ForwardRefExoticComponent<IToastProps & React.RefAttributes<IToast>>;
interface ToastContextType {
    show: (content: React.ReactNode, options?: Record<string, unknown>) => string;
    hide: (toastId?: string) => void;
}
export declare let globalToastRef: IToast | null;
export declare const ToastProvider: React.FC<{
    children: React.ReactNode;
}>;
/**
 * Hook to use the Toast context
 *
 * @returns {Object} An object with show and hide methods for managing toasts
 */
export declare const useToast: () => ToastContextType | undefined;
/**
 * Utility object for managing toasts globally
 */
export declare const ToastUtility: {
    setGlobalToastRef: (ref: IToast | null) => void;
    show: (content: React.ReactNode, options?: ToastProps) => string | undefined;
    hide: (toastId?: string) => void;
};
export {};
