import { useState, useEffect, useCallback, forwardRef, useImperativeHandle, createContext, useContext, useRef } from 'react';
import { Button } from '@syncfusion/react-buttons';
import { getUniqueID, IAnimation, preRender, SvgIcon, useProviderContext } from '@syncfusion/react-base';
import { AnimationOptions, Animation } from '@syncfusion/react-base';
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
export enum PositionX {
    /**
     * Positions the component at the left edge of its container or target element.
     */
    Left = 'Left',

    /**
     * Positions the component at the right edge of its container or target element.
     */
    Right = 'Right',

    /**
     * Positions the component horizontally centered within its container or relative to its target element.
     */
    Center = 'Center'
}

/**
 * Defines the vertical positioning options for Toasts component.
 */
export enum PositionY {
    /**
     * Positions the component at the top edge of its container or target element.
     */
    Top = 'Top',

    /**
     * Positions the component at the bottom edge of its container or target element.
     */
    Bottom = 'Bottom'
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
    buttons?: Array<{ model: Record<string, unknown>; click: () => void }>;

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
export interface IToast extends ToastProps{
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
let toastCounter: number = 0;

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
export const Toast: React.ForwardRefExoticComponent<IToastProps & React.RefAttributes<IToast>> =
 forwardRef<IToast, IToastProps>((props: IToastProps, ref: React.ForwardedRef<IToast>) => {
     const {
         width = 'auto',
         height = 'auto',
         open = false,
         id = getUniqueID('toast_'),
         title,
         icon,
         className = '',
         content,
         newestOnTop = true,
         closeButton = false,
         progressBar = false,
         timeout = 5000,
         progressDirection = 'Rtl',
         position = { X: PositionX.Left, Y: PositionY.Top },
         buttons = [],
         target = 'body',
         animation = {
             show: {
                 name: 'FadeIn',
                 duration: 0,
                 timingFunction: 'ease-out'
             },
             hide: {
                 name: 'FadeOut',
                 duration: 0,
                 timingFunction: 'ease-out'
             }
         },
         onOpen,
         severity,
         onClose,
         onClick,
         children,
         extendedTimeout = 1000
     } = props;
     const [toasts, setToasts] = useState<Array<{ id: string; content: React.ReactNode }>>([]);
     const toastRef: React.RefObject<HTMLDivElement | null> = useRef < HTMLDivElement > (null);
     const initialOpenState: React.RefObject<boolean> = useRef(open);
     const [interactionToasts, setInteractionToasts] = useState<Record<string, boolean>>({});
     const { dir } = useProviderContext();
     const closeIcon: string = 'M8.58578 10.0001L0.585754 2.00003L1.99997 0.585815L10 8.58584L18 0.585815L19.4142 2.00003L11.4142 10.0001L19.4142 18L18 19.4142L10 11.4143L2.00003 19.4142L0.585812 18L8.58578 10.0001Z';
     const progressWidth: string = '100%';
     const progressRefs: React.RefObject<Map<string, HTMLDivElement>> = useRef<Map<string, HTMLDivElement>>(new Map());
     const publicAPI: Partial<IToastProps> = {
         open,
         animation,
         position
     };

     useImperativeHandle(ref, () => ({
         ...publicAPI as IToast,
         element: toastRef.current
     }));

     useEffect(() => {
         progressRefs.current.forEach((bar: HTMLDivElement) => {
             if (bar) {
                 requestAnimationFrame(() => {
                     bar.style.width = '0%';
                 });
             }
         });
     }, [toasts]);

     useEffect(() => {
         if (!open && initialOpenState.current === open) {
             return;
         }
         initialOpenState.current = open;
         if (open) {
             show(content || children);
         } else {
             hide();
         }
     }, [open]);

     useEffect(() => {
         preRender('toast');
     }, []);

     const show: (content: React.ReactNode) => string = useCallback((content: React.ReactNode) => {
         const toastId: string = `toast-${++toastCounter}`;
         if (animation.show) {
             animation.show.begin = () => {
                 setToasts((prevToasts: Array<{ id: string; content: React.ReactNode }>) => {
                     const newToast: {
                         id: string;
                         content: React.ReactNode;
                     } = { id: toastId, content };
                     return newestOnTop ? [newToast, ...prevToasts] : [...prevToasts, newToast];
                 });
             };
             animation.show.end = () => {
                 onOpen?.();
             };
             if (Animation) {
                 const animationInstance: IAnimation = Animation(animation.show);
                 if (animationInstance.animate) {
                     animationInstance.animate(toastRef.current as HTMLElement);
                 }
             }
         }
         if (timeout > 0) {
             setTimeout(() => {
                 if (!Object.prototype.hasOwnProperty.call(interactionToasts, String(toastId))) {
                     hide(toastId);
                 }
             }, timeout);
         }
         return toastId;
     }, [newestOnTop, timeout, interactionToasts]);

     const hide: (toastId?: string) => void = useCallback((toastId?: string) => {
         const toastElement: Element | null | undefined
         = toastId
             ? document.getElementById(toastId)
             : toastRef.current?.querySelector('.sf-toast');

         if (!toastElement) {return; }

         if (animation.hide) {
             animation.hide.begin = () => {
                 let duration: number = animation.hide?.duration ? animation.hide.duration - 30 : 0;
                 duration = duration > 0 ? duration : 0;
                 setTimeout(() => {
                     setToasts((prevToasts: Array<{ id: string; content: React.ReactNode }>) => {
                         if (toastId) {
                             return prevToasts.filter((toast: { id: string; content: React.ReactNode }) => toast.id !== toastId);
                         } else {
                             return prevToasts.slice(1);
                         }
                     });
                     if (toastId) {
                         setInteractionToasts((prev: Record<string, boolean>) => {
                             const newState: {
                                 [x: string]: boolean;
                             } = { ...prev };
                             delete newState[String(toastId)];
                             return newState;
                         });
                     }
                 }, duration);
             };
             animation.hide.end = () => {
                 onClose?.();
             };
             if (Animation) {
                 const animationInstance: IAnimation = Animation(animation.hide);
                 if (animationInstance.animate) {
                     animationInstance.animate(toastElement as HTMLElement);
                 }
             }
         }
     }, [onClose]);

     useImperativeHandle(ref, () => ({ show, hide }));

     const handleClick: (e: React.MouseEvent<HTMLDivElement>, toastId: string) => void =
     useCallback((e: React.MouseEvent<HTMLDivElement>, toastId: string) => {
         onClick?.(e);
         setInteractionToasts((prev: Record<string, boolean>) => ({ ...prev, [toastId]: true }));
         if (timeout !== 0 && extendedTimeout > 0) {
             setTimeout(() => hide(toastId), extendedTimeout);
         }
         if (closeButton && (e.target as HTMLElement).closest('.sf-toast-close-icon')) {
             hide(toastId);
         }
     }, [onClick, closeButton, hide]);
     const containerPosition: string = `sf-toast-${position?.Y?.toLowerCase()}-${position?.X?.toLowerCase()}`;
     return (
         <div
             ref={toastRef}
             id={id}
             className={`sf-control sf-toast sf-lib sf-toast-container ${containerPosition} ${(severity && severity !== 'Normal') ? severity === 'Error' ? 'sf-toast-danger' : `sf-toast-${severity.toLowerCase()}` : ''} ${className} ${(dir === 'rtl') ? 'sf-rtl' : ''}`}
             style={{
                 position: target !== 'body' ? 'absolute' : 'fixed',
                 zIndex: target !== 'body' ? 1000000001 : 1004
             }}
         >
             {toasts.map(({ id, content }: { id: string; content: React.ReactNode }) => (
                 <div
                     key={id}
                     id={id}
                     className={`sf-toast ${className || ''} ${(severity && severity !== 'Normal') ? severity === 'Error' ? 'sf-toast-danger' : `sf-toast-${severity.toLowerCase()}` : ''} ${icon ? 'sf-toast-header-icon' : ''}`}
                     role="alert"
                     style={{ width, height }}
                     onClick={(e: React.MouseEvent<HTMLDivElement, MouseEvent>
                     ) => handleClick(e, id)}
                 >
                     {icon && <div className={'sf-toast-icon sf-icons'}>{icon}</div>}
                     <div className="sf-toast-message">
                         {title && <div className="sf-toast-title">{title}</div>}
                         <div className="sf-toast-content">{content}</div>
                     </div>
                     {closeButton && (
                         <div className="sf-toast-close-icon"><SvgIcon d={closeIcon}></SvgIcon></div>
                     )}
                     {progressBar && (
                         <div className="sf-toast-progress">
                             <div ref={(el: HTMLDivElement | null) => {
                                 if (el) {
                                     progressRefs.current.set(id, el);
                                 } else {
                                     progressRefs.current.delete(id);
                                 }
                             }} className={`sf-toast-progress-bar ${progressDirection === 'Rtl' ? 'sf-toast-progress-rtl' : ''}`}
                             style={{
                                 width: progressWidth,
                                 transition: `width ${timeout}ms linear`,
                                 transform: progressDirection === 'Rtl' ? 'scaleX(-1)' : 'none'
                             }}
                             />
                         </div>
                     )}
                     {buttons.length > 0 && (
                         <div className="sf-toast-actions">
                             {buttons.map((btn: {
                                 model: Record<string, unknown>;
                                 click: () => void;
                             }, index: number
                             ) => (
                                 <Button key={index} {...btn.model} onClick={btn.click} />
                             ))}
                         </div>
                     )}
                 </div>
             ))}
         </div>
     );
 });

interface ToastContextType {
    show: (content: React.ReactNode, options?: Record<string, unknown>) => string;
    hide: (toastId?: string) => void;
}

const ToastContext: React.Context<ToastContextType | null> = createContext<ToastContextType | null>(null);

export let globalToastRef: IToast | null = null;

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }: { children: React.ReactNode }) => {
    const toastRef: React.RefObject<IToast | null> = useRef<IToast>(null);
    const [toastProps, setToastProps] = useState({});
    const info: string = 'M12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3ZM1 12C1 5.92487 5.92487 1 12 1C18.0751 1 23 5.92487 23 12C23 18.0751 18.0751 23 12 23C5.92487 23 1 18.0751 1 12ZM13 11V17H11V11H13ZM13 9V7H11V9H13Z';
    const success: string = 'M3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12ZM12 1C5.92487 1 1 5.92487 1 12C1 18.0751 5.92487 23 12 23C18.0751 23 23 18.0751 23 12C23 5.92487 18.0751 1 12 1ZM10.5 16.4142L17.9142 9L16.5 7.58578L10.5 13.5858L7.50003 10.5858L6.08582 12L10.5 16.4142Z';
    const warning: string = 'M10.2691 2.99378C11.0395 1.66321 12.9605 1.6632 13.7308 2.99378L22.9964 18.9979C23.7683 20.3312 22.8062 22 21.2655 22H2.73444C1.19378 22 0.231653 20.3313 1.00358 18.9979L10.2691 2.99378ZM21.2655 20L12 3.99585L2.73444 20L21.2655 20ZM13 14V9H11V14H13ZM13 16H11V18.5H13V16Z';
    const danger: string = 'M3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12ZM12 1C5.92487 1 1 5.92487 1 12C1 18.0751 5.92487 23 12 23C18.0751 23 23 18.0751 23 12C23 5.92487 18.0751 1 12 1ZM12 10.5858L8.50003 7.08582L7.08582 8.50003L10.5858 12L7.08582 15.5L8.50003 16.9142L12 13.4142L15.5 16.9142L16.9142 15.5L13.4142 12L16.9142 8.50003L15.5 7.08582L12 10.5858Z';

    useEffect(() => {
        ToastUtility.setGlobalToastRef(toastRef.current);
        return () => {
            ToastUtility.setGlobalToastRef(null);
        };
    }, []);

    const show: (content: React.ReactNode, options?: ToastProps) => string = (content: React.ReactNode, options: ToastProps = {}) => {
        const {
            severity = Severity.Info,
            timeout = 5000,
            extendedTimeout = 1000,
            position = { X: 'Right', Y: 'Top' },
            closeButton = true,
            title
        }: ToastProps = options;

        let icon: React.ReactNode;
        let className: string;

        switch (severity) {
        case 'Success':
            icon = <SvgIcon d={success}></SvgIcon>;
            className = 'sf-toast-success';
            break;
        case 'Warning':
            icon = <SvgIcon d={warning}></SvgIcon>;
            className = 'sf-toast-warning';
            break;
        case 'Error':
            icon = <SvgIcon d={danger}></SvgIcon>;
            className = 'sf-toast-danger';
            break;
        case 'Info':
        default:
            icon = <SvgIcon d={info}></SvgIcon>;
            className = 'sf-toast-info';
            break;
        }

        setToastProps({
            content: (
                <div className={className}>
                    {content}
                </div>
            ),
            className,
            icon,
            timeout,
            extendedTimeout,
            position,
            closeButton,
            title
        });

        if (toastRef.current) {
            return toastRef.current?.show(content);
        } else {
            return '';
        }
    };

    const hide: (toastId?: string) => void = (toastId?: string) => {
        if (toastRef.current) {
            toastRef.current.hide(toastId);
        } else {
            console.warn('Toast reference is not available');
        }
    };

    return (
        <ToastContext.Provider value={{ show, hide }}>
            {children}
            <Toast ref={toastRef} {...toastProps} />
        </ToastContext.Provider>
    );
};

/**
 * Hook to use the Toast context
 *
 * @returns {Object} An object with show and hide methods for managing toasts
 */
export const useToast: () => ToastContextType | undefined = () => {
    const context: ToastContextType | null = useContext(ToastContext);
    if (!context) {
        return;
    }
    return context;
};

/**
 * Utility object for managing toasts globally
 */
export const ToastUtility: {
    setGlobalToastRef: (ref: IToast | null) => void;
    show: (content: React.ReactNode, options?: ToastProps) => string | undefined;
    hide: (toastId?: string) => void;
} = {
    setGlobalToastRef: (ref: IToast | null) => {
        globalToastRef = ref;
    },

    show: (content: React.ReactNode) => {
        if (globalToastRef) {
            return globalToastRef.show(content);
        } else {
            return '';
        }
    },

    hide: (toastId?: string) => {
        if (globalToastRef) {
            globalToastRef.hide(toastId);
        }
    }
};
