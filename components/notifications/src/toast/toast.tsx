import { useState, useEffect, useCallback, forwardRef, useImperativeHandle, createContext, useContext, useRef } from 'react';
import { getUniqueID, IAnimation, preRender, SvgIcon, useProviderContext } from '@syncfusion/react-base';
import { AnimationOptions, Animation, Severity } from '@syncfusion/react-base';

/**
 * Specifies animation effects that are applicable for Toast.
 */
export type Effect = 'FadeIn' | 'FadeOut' | 'FadeZoomIn' | 'FadeZoomOut' | 'FlipLeftDownIn' | 'FlipLeftDownOut' | 'FlipLeftUpIn' | 'FlipLeftUpOut' | 'FlipRightDownIn' | 'FlipRightDownOut' | 'FlipRightUpIn' | 'FlipRightUpOut' | 'FlipXDownIn' | 'FlipXDownOut' | 'FlipXUpIn' | 'FlipXUpOut' | 'FlipYLeftIn' | 'FlipYLeftOut' | 'FlipYRightIn' | 'FlipYRightOut' | 'SlideBottomIn' | 'SlideBottomOut' | 'SlideDown' | 'SlideLeft' | 'SlideLeftIn' | 'SlideLeftOut' | 'SlideRight' | 'SlideRightIn' | 'SlideRightOut' | 'SlideTopIn' | 'SlideTopOut' | 'SlideUp' | 'ZoomIn' | 'ZoomOut';

/**
 * Specifies animation props for both show and hide actions of the Toast.
 */
export interface ToastAnimationProps {
    /**
     * Specifies the animation effect on the Toast, show and hide actions.
     *
     * @default 'FadeIn'
     */
    name?: Effect;
    /**
     * Specifies the duration of the animation that is completed per animation cycle.
     *
     * @default 400
     */
    duration?: number;
    /**
     * Specifies the animation timing function.
     *
     * @default 'ease'
     */
    timingFunction?: string;

}

/**
 * Specifies the animation configuration for Toast show and hide animations.
 */
export interface ToastAnimationOptions {
    /**
     * Specifies the animation that should happen when Toast opens.
     *
     * @default { name: 'FadeIn', duration: 400, timingFunction: 'ease-out' }
     */
    show?: ToastAnimationProps;

    /**
     * Specifies the animation that should happen when Toast closes.
     *
     * @default { name: 'FadeOut', duration: 400, timingFunction: 'ease-out' }
     */
    hide?: ToastAnimationProps;
}

/**
 * Specifies the horizontal positioning options for components like Toasts, Popups, and Dialogs.
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
 * Specifies the vertical positioning options for Toast component.
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
 * Specifies the positional axis for UI components like Toast.
 * This interface defines configurable positioning options along the X and Y axes.
 */
export interface PositionAxis {
    /**
     * Specifies position on the X-Axis, accepts string or number.
     *
     * @default 'Left'
     */
    xAxis?: PositionX | string;

    /**
     * Specifies position on the Y-Axis, accepts string or number.
     *
     * @default 'Top'
     */
    yAxis?: PositionY | string;
}

/**
 * Specifies the props for the Toast component.
 */
export interface ToastProps {
    /**
     * Specifies the width of the Toast component.
     * Can be set to a pixel value or percentage as a string,
     * or a number representing pixels.
     *
     * @default 'auto'
     */
    width?: string | number;

    /**
     * Specifies the height of the Toast component.
     * Can be set to a pixel value or percentage as a string,
     * or a number representing pixels.
     *
     * @default 'auto'
     */
    height?: string | number;

    /**
     * Specifies the title displayed at the top of the Toast.
     * Can be a simple string or any valid React node.
     * Useful for providing a brief header or context to the notification content.
     *
     * @default -
     */
    title?: React.ReactNode;

    /**
     * Specifies the icon displayed alongside the Toast content.
     * Can be any valid React node, typically an SVG or image.
     * Helps to visually reinforce the message type (e.g., success, error).
     *
     * @default -
     */
    icon?: React.ReactNode;

    /**
     * Specifies the stacking order of items in a collection or notification system.
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
     * Specifies whether to display a progress bar that indicates the remaining time
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
     * Specifies whether to display a close button that allows users to manually
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
     * Specifies the time in milliseconds before the Toast auto-closes.
     *
     * @default 5000
     */
    timeout?: number;

    /**
     * Specifies the direction of the progress bar.
     *
     * @default 'Rtl'
     */
    progressDirection?: 'Rtl' | 'Ltr';

    /**
     * Specifies the position of the Toast on the screen.
     *
     * @default { xAxis: PositionX.Right, yAxis: PositionY.Bottom }
     */
    position?: PositionAxis;

    /**
     * Specifies the action elements rendered at the bottom of the Toast component.
     *
     * @default -
     */
    actions?: React.ReactNode;

    /**
     * Specifies the target element to render the Toast.
     *
     * @default 'body'
     */
    target?: string;

    /**
     * Specifies the callback that triggered when the Toast is opened and becomes visible to the user.
     *
     * @event onOpen
     * @default null
     */
    onOpen?: () => void;

    /**
     * Specifies the callback that triggered when the Toast is closed and removed from view.
     *
     * @event onClose
     * @default null
     */
    onClose?: () => void;

    /**
     * Specifies the callback that triggered when the user clicks anywhere within the Toast.
     *
     * @event onClick
     * @default null
     */
    onClick?: (event: React.MouseEvent) => void;

    /**
     * Specifies the animations that should happen when Toast opens and closes.
     *
     * @default { show: { name: 'FadeIn', duration: 400, timingFunction: 'ease-out' },
     *            hide: { name: 'FadeOut', duration: 400, timingFunction: 'ease-out' } }
     */
    animation?: ToastAnimationOptions;

    /**
     * Specifies the Toast display time duration after interacting with the Toast.
     *
     * @default 1000
     */
    extendedTimeout?: number;

    /**
     * Specifies the severity of the Toast content, which is used to define the appearance (icons and colors) of the Toast. The available severity messages are Success, Info, Warning, and Error.
     *
     * @default Severity.Normal
     */
    severity?: Severity;

    /**
     * Specifies whether the component is in open/expanded state.
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
     * Specifies the content to be displayed within the component.
     * Can be a string of text or any valid React node (elements, components, fragments, etc.).
     * If not provided, the component will render without content.
     *
     * @default -
     */
    content?: React.ReactNode;
}

/**
 * Specifies the interface representing the Toast component.
 */
export interface IToast extends ToastProps{
    /**
     * Shows a new Toast.
     *
     * @param content - The content to be displayed in the Toast.
     * @returns The id of the newly created Toast.
     */
    show(content: React.ReactNode): string;

    /**
     * Hides a specific Toast or the oldest one if no id is provided.
     *
     * @param toastId - The id of the Toast to hide (optional).
     */
    hide(toastId?: string): void;
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
 * import { Toast } from "@syncfusion/react-notifications";
 *
 * <Toast content="Operation completed successfully" open={true} position={{ xAxis: 'Right', yAxis: 'Bottom' }} />
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
         position = { xAxis: PositionX.Left, yAxis: PositionY.Top },
         actions,
         target = 'body',
         animation = {
             show: {
                 name: 'FadeIn',
                 duration: 400,
                 timingFunction: 'ease-out'
             },
             hide: {
                 name: 'FadeOut',
                 duration: 400,
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
     const closeIcon: string = 'M10.5858 12.0001L2.58575 4.00003L3.99997 2.58582L12 10.5858L20 2.58582L21.4142 4.00003L13.4142 12.0001L21.4142 20L20 21.4142L12 13.4143L4.00003 21.4142L2.58581 20L10.5858 12.0001Z';
     const progressWidth: string = progressDirection === 'Rtl' ? '100%' : '0%';
     const progressRefs: React.RefObject<Map<string, HTMLDivElement>> = useRef<Map<string, HTMLDivElement>>(new Map());
     const publicAPI: Partial<IToastProps> = {
         open,
         animation,
         position,
         actions
     };

     useImperativeHandle(ref, () => ({
         ...publicAPI as IToast,
         element: toastRef.current
     }));

     useEffect(() => {
         progressRefs.current.forEach((bar: HTMLDivElement) => {
             if (bar) {
                 requestAnimationFrame(() => {
                     bar.style.width = progressDirection === 'Rtl' ? '0%' : '100%';
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
             const showAnimation: AnimationOptions = {...animation.show};
             showAnimation.begin = () => {
                 setToasts((prevToasts: Array<{ id: string; content: React.ReactNode }>) => {
                     const newToast: {
                         id: string;
                         content: React.ReactNode;
                     } = { id: toastId, content };
                     return newestOnTop ? [newToast, ...prevToasts] : [...prevToasts, newToast];
                 });
             };
             showAnimation.end = () => {
                 onOpen?.();
             };
             if (Animation) {
                 const animationInstance: IAnimation = Animation(showAnimation);
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
             const hideAnimation: AnimationOptions = { ...animation.hide };
             hideAnimation.begin = () => {
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
             hideAnimation.end = () => {
                 onClose?.();
             };
             if (Animation) {
                 const animationInstance: IAnimation = Animation(hideAnimation);
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
     const containerPosition: string = `sf-toast-${position?.yAxis?.toLowerCase()}-${position?.xAxis?.toLowerCase()}`;
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
                     {icon && <div className={'sf-toast-icon sf-icon'}>{icon}</div>}
                     <div className="sf-toast-message">
                         {title && <div className="sf-toast-title sf-ellipsis">{title}</div>}
                         <div className="sf-toast-content sf-ellipsis">{content}</div>
                         {actions && (
                             <div className="sf-toast-actions">
                                 {actions}
                             </div>
                         )}
                     </div>
                     {closeButton && (
                         <div className="sf-toast-close-icon sf-icon"><SvgIcon d={closeIcon}></SvgIcon></div>
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
                                 transition: `width ${timeout}ms linear`
                             }}
                             />
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
            position = { xAxis: 'Right', yAxis: 'Top' },
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

        return toastRef.current ? toastRef.current.show(content) : '';
    };

    const hide: (toastId?: string) => void = (toastId?: string) => {
        if (toastRef.current) {
            toastRef.current.hide(toastId);
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
        return globalToastRef ? globalToastRef.show(content) : '';
    },

    hide: (toastId?: string) => {
        if (globalToastRef) {
            globalToastRef.hide(toastId);
        }
    }
};
