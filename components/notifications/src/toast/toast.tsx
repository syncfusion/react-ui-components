import { useState, useEffect, useCallback, forwardRef, useImperativeHandle, createContext, useContext, useRef, ReactNode, type KeyboardEvent, type MouseEvent, InputHTMLAttributes, ForwardRefExoticComponent, RefAttributes, ForwardedRef, RefObject, Context, FC, useLayoutEffect, Dispatch, SetStateAction, MouseEventHandler, FocusEventHandler, type FocusEvent, useMemo } from 'react';
import { IAnimation, IL10n, L10n, preRender, useProviderContext, useStableId} from '@syncfusion/react-base';
import { AnimationOptions, Animation, Severity } from '@syncfusion/react-base';
import { CircleCheckIcon, CircleCloseIcon, CircleInfoIcon, CloseIcon, WarningIcon } from '@syncfusion/react-icons';

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
    title?: ReactNode;

    /**
     * Specifies the icon displayed alongside the Toast content.
     * Can be any valid React node, typically an SVG or image.
     * Helps to visually reinforce the message type (e.g., success, error).
     *
     * @default -
     */
    icon?: ReactNode;

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
     * @default { xAxis: PositionX.Left, yAxis: PositionY.Top }
     */
    position?: PositionAxis;

    /**
     * Specifies the action elements rendered at the bottom of the Toast component.
     *
     * @default -
     */
    actions?: ReactNode;

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
    onClick?: (event: MouseEvent) => void;

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
    content?: ReactNode;
}

/**
 * Specifies the interface representing the Toast component.
 */
export interface IToast extends ToastProps{
    /**
     * Shows a new Toast.
     *
     * @param content - The content to be displayed in the Toast.
     * @param options - Optional per-toast props that override component-level props.
     * @returns The id of the newly created Toast.
     */
    show(content: ReactNode, options?: ToastProps): string;

    /**
     * Hides a specific Toast or the oldest one if no id is provided.
     *
     * @param toastId - The id of the Toast to hide (optional).
     */
    hide(toastId?: string): void;
}
let toastCounter: number = 0;

type IToastProps = ToastProps & Omit<InputHTMLAttributes<HTMLDivElement>, keyof ToastProps>;

/**
 * Internal structure that tracks each running auto-dismiss timer so we can
 * pause and resume it as the user hovers/focuses the Toast item.
 */
interface ToastTimer {
    timeoutId: ReturnType<typeof setTimeout> | null;
    startTime: number;
    remainingTimeMs: number;
}

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
export const Toast: ForwardRefExoticComponent<IToastProps & RefAttributes<IToast>> =
 forwardRef<IToast, IToastProps>((props: IToastProps, ref: ForwardedRef<IToast>) => {
     const {
         width = 'auto',
         height = 'auto',
         open = false,
         id,
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
     const {locale} = useProviderContext();
     const toastId: string = id ?? useStableId('sf-toast');
     const [toasts, setToasts] = useState<Array<{ id: string; content: ReactNode }>>([]);
     const toastRef: RefObject<HTMLDivElement | null> = useRef < HTMLDivElement > (null);
     const initialOpenState: RefObject<boolean> = useRef(open);
     const { dir } = useProviderContext();
     const timersRef: RefObject<Map<string, ToastTimer>> = useRef<Map<string, ToastTimer>>(new Map());
     const toastElementsByIdRef: RefObject<Map<string, { el: RefObject<HTMLDivElement | null>; ext?: ReturnType<typeof setTimeout> }>>
     = useRef(new Map());
     const [pausedToasts, setPausedToasts] = useState<Set<string>>(() => new Set());
     const [interactionToasts, setInteractionToasts] = useState<Set<string>>(() => new Set());

     const publicAPI: Partial<IToastProps> = {
         open,
         animation,
         position,
         actions
     };

     useImperativeHandle(ref, () => ({
         ...publicAPI as IToast,
         show,
         hide,
         element: toastRef.current
     }));

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
         return () => {
             timersRef.current.forEach((timer: ToastTimer) => {
                 timer.timeoutId = clearTimeoutSafe(timer.timeoutId);
             });
             timersRef.current.clear();
         };
     }, []);

     const registerToastRef: (id: string) => RefObject<HTMLDivElement | null> = useCallback(
         (id: string): RefObject<HTMLDivElement | null> => {
             const previouslyRegisteredRef: { el: RefObject<HTMLDivElement | null>; ext?: ReturnType<typeof setTimeout> } | undefined =
             toastElementsByIdRef.current.get(id);
             if (previouslyRegisteredRef) {
                 return previouslyRegisteredRef.el;
             }
             const newRef: RefObject<HTMLDivElement | null> = { current: null };
             toastElementsByIdRef.current.set(id, { el: newRef });
             return newRef;
         },
         []
     );

     const clearTimeoutSafe: (timeoutId: NodeJS.Timeout | null) => null = useCallback(
         (timeoutId: ReturnType<typeof setTimeout> | null): null => {
             if (timeoutId) {
                 clearTimeout(timeoutId);
             }
             return null;
         }, []);

     const shouldHideToast: (toastId: string) => boolean = useCallback((toastId: string): boolean =>
         !interactionToasts.has(toastId), [interactionToasts]);

     const updateToastStatus: (setter: Dispatch<SetStateAction<Set<string>>>, toastId: string, shouldAdd: boolean) => void = (
         setter: Dispatch<SetStateAction<Set<string>>>, toastId: string, shouldAdd: boolean ): void => {
         setter((prev: Set<string>) => {
             const hasToast: boolean = prev.has(toastId);
             if ((shouldAdd && hasToast) || (!shouldAdd && !hasToast)) {
                 return prev;
             }
             const next: Set<string> = new Set(prev);
             if (shouldAdd) {
                 next.add(toastId);
             } else {
                 next.delete(toastId);
             }
             return next;
         });
     };

     const clearToastTimer: (toastId: string) => void = useCallback((toastId: string): void => {
         const timer: ToastTimer | undefined = timersRef.current.get(toastId);
         if (!timer) {return; }
         timer.timeoutId = clearTimeoutSafe(timer.timeoutId);
         timersRef.current.delete(toastId);
     }, [clearTimeoutSafe]);

     const hide: (toastId?: string) => void = useCallback((toastId?: string) => {
         const targetEntry: { el: RefObject<HTMLDivElement | null> } | undefined = toastId
             ? toastElementsByIdRef.current.get(toastId)
             : undefined;

         const toastElement: Element | null | undefined = toastId
             ? targetEntry?.el.current ?? null
             : toastRef.current?.querySelector('.sf-toast');

         if (!toastElement) { return; }
         const effectiveHideAnim: ToastAnimationProps | undefined = animation.hide;
         if (!effectiveHideAnim) { return; }

         const hideAnimation: AnimationOptions = { ...effectiveHideAnim };
         hideAnimation.begin = () => {
             const duration: number = Math.max(0, (effectiveHideAnim.duration ?? 0) - 30);
             setTimeout(() => {
                 setToasts((prevToasts: Array<{ id: string; content: ReactNode; options?: ToastProps }>) => {
                     if (toastId) {
                         return prevToasts.filter((toast: { id: string; content: ReactNode; options?: ToastProps }) =>
                             toast.id !== toastId);
                     }
                     return prevToasts.slice(1);
                 });
                 if (toastId) {
                     setInteractionToasts((prev: Set<string>) => {
                         const newState: Set<string> = new Set(prev);
                         newState.delete(String(toastId));
                         return newState;
                     });
                     clearToastTimer(toastId);
                     updateToastStatus(setPausedToasts, toastId, false);
                     const entry: { el: RefObject<HTMLDivElement | null>; ext?: ReturnType<typeof setTimeout> } | undefined =
                     toastElementsByIdRef.current.get(toastId);
                     if (entry?.ext) {
                         clearTimeout(entry.ext);
                         entry.ext = undefined;
                     }
                     toastElementsByIdRef.current.delete(toastId);
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
     }, [onClose, animation, clearToastTimer]);

     const createToastTimeout: (toastId: string, timer: ToastTimer, duration: number) => NodeJS.Timeout = useCallback(
         (toastId: string, timer: ToastTimer, duration: number): NodeJS.Timeout => {
             return setTimeout(() => {
                 timer.timeoutId = null;
                 if (shouldHideToast(toastId)) {
                     hide(toastId);
                 }
             }, duration);
         }, [shouldHideToast, hide]);

     const startToastTimer: (toastId: string, duration: number) => void = useCallback(
         (toastId: string, duration: number): void => {
             if (duration <= 0) {return; }
             const now: number = Date.now();
             const existing: ToastTimer | undefined = timersRef.current.get(toastId);
             if (existing) {
                 existing.timeoutId = clearTimeoutSafe(existing.timeoutId);
             }
             const timer: ToastTimer = {
                 timeoutId: null as ReturnType<typeof setTimeout> | null,
                 startTime: now,
                 remainingTimeMs: duration
             };
             timer.timeoutId = createToastTimeout(toastId, timer, duration);
             timersRef.current.set(toastId, timer);
         }, [clearTimeoutSafe, createToastTimeout]);

     const pauseToastTimer: (toastId: string) => void = useCallback((toastId: string): void => {
         const timer: ToastTimer | undefined = timersRef.current.get(toastId);
         if (!timer || !timer.timeoutId) {return; }
         const now: number = Date.now();
         timer.timeoutId = clearTimeoutSafe(timer.timeoutId);
         timer.remainingTimeMs = Math.max(0, timer.remainingTimeMs - (now - timer.startTime));
         updateToastStatus(setPausedToasts, toastId, true);
     }, [clearTimeoutSafe]);

     const resumeToastTimer: (toastId: string) => void = useCallback(
         (toastId: string): void => {
             const timer: ToastTimer | undefined = timersRef.current.get(toastId);
             if (!timer || timer.timeoutId) {
                 updateToastStatus(setPausedToasts, toastId, false);
                 return;
             }
             if (timer.remainingTimeMs > 0) {
                 timer.startTime = Date.now();
                 timer.timeoutId = createToastTimeout(
                     toastId,
                     timer,
                     timer.remainingTimeMs
                 );
             }
             updateToastStatus(setPausedToasts, toastId, false);
         }, [createToastTimeout]);

     const toastAnimationQueueRef: RefObject<Array<{ id: string; animation: ToastAnimationOptions; onOpen?: () => void }>> =
        useRef<Array<{ id: string; animation: ToastAnimationOptions; onOpen?: () => void }>>([]);
     useLayoutEffect(() => {
         if (toastAnimationQueueRef.current.length === 0) { return; }
         const pending: Array<{ id: string; animation: ToastAnimationOptions; onOpen?: () => void }> =
         toastAnimationQueueRef.current;
         toastAnimationQueueRef.current = [];
         pending.forEach(({ id: toastId, animation: toastAnim, onOpen: toastOpen }: {
             id: string; animation: ToastAnimationOptions; onOpen? : () => void
         }) => {
             const newEl: HTMLElement | null = toastElementsByIdRef.current.get(toastId)?.el.current ?? null;
             if (!newEl) { toastOpen?.(); return; }
             if (toastAnim.show) {
                 const showAnimation: AnimationOptions = { ...toastAnim.show };
                 showAnimation.end = () => {
                     toastOpen?.();
                 };
                 if (Animation) {
                     const animationInstance: IAnimation = Animation(showAnimation);
                     animationInstance.animate?.(newEl);
                 }
             } else {
                 toastOpen?.();
             }
         });
     }, [toasts]);

     const show: (content: ReactNode, options?: ToastProps) => string = useCallback(
         (content: ReactNode, options?: ToastProps) => {
             const toastId: string = `toast-${++toastCounter}`;
             registerToastRef(toastId);
             const effectiveAnimation: ToastAnimationOptions = options?.animation ?? animation;
             const effectiveTimeout: number = options?.timeout ?? timeout;
             const effectiveNewestOnTop: boolean = options?.newestOnTop ?? newestOnTop;
             const effectiveOnOpen: (() => void) | undefined = options?.onOpen ?? onOpen;
             toastAnimationQueueRef.current.push({id: toastId, animation: effectiveAnimation, onOpen: effectiveOnOpen});
             setToasts((prevToasts: Array<{ id: string; content: ReactNode; options?: ToastProps }>) => {
                 const newToast: { id: string; content: ReactNode; options?: ToastProps } =
                    { id: toastId, content, options };
                 return effectiveNewestOnTop ? [newToast, ...prevToasts] : [...prevToasts, newToast];
             });

             if (effectiveTimeout > 0) {
                 startToastTimer(toastId, effectiveTimeout);
             }
             return toastId;
         }, [newestOnTop, timeout, animation, onOpen, startToastTimer, registerToastRef]);

     const handleCloseKey: (e: KeyboardEvent<HTMLDivElement>, toastId: string) => void =
     useCallback((e: KeyboardEvent<HTMLDivElement>, toastId: string) => {
         if (e.key === 'Enter' || e.key === ' ') {
             e.preventDefault();
             hide(toastId);
         }
     }, [hide]);

     const mergeProps: (defaults: ToastProps, overrides?: ToastProps) => ToastProps =
            (defaults: ToastProps, overrides?: ToastProps): ToastProps => {
                if (!overrides) { return defaults; }
                const cleaned: ToastProps = {};
                (Object.keys(overrides) as Array<keyof ToastProps>).forEach((k: keyof ToastProps) => {
                    if (overrides[k as keyof ToastProps] !== undefined) {
                        (cleaned as Record<string, unknown>)[k as string] = overrides[k as keyof ToastProps];
                    }
                });
                return { ...defaults, ...cleaned };
            };

     const handleClick: (e: MouseEvent<HTMLDivElement>, toastId: string) => void =
     useCallback((e: MouseEvent<HTMLDivElement>, toastId: string) => {
         onClick?.(e);
         updateToastStatus(setInteractionToasts, toastId, true);
         if (timeout !== 0 && extendedTimeout > 0) {
             const entry: { el: RefObject<HTMLDivElement | null>; ext?: ReturnType<typeof setTimeout> } | undefined =
             toastElementsByIdRef.current.get(toastId);
             if (entry?.ext) {
                 clearTimeout(entry.ext);
             }
             const handle: ReturnType<typeof setTimeout> = setTimeout((): void => {
                 if (entry && entry.ext === handle) {
                     entry.ext = undefined;
                 }
                 hide(toastId);
             }, extendedTimeout);
             toastElementsByIdRef.current.set(toastId, {
                 el: entry?.el ?? { current: null },
                 ext: handle
             });
         }
         if (closeButton && (e.target as HTMLElement).closest('.sf-toast-close-icon')) {
             hide(toastId);
         }
     }, [onClick, closeButton, hide]);

     const handleMouseEnter: (toastId: string) => MouseEventHandler<HTMLDivElement> =
    useCallback((toastId: string) => () => {
        pauseToastTimer(toastId);
    }, [pauseToastTimer]);

     const handleMouseLeave: (toastId: string) => MouseEventHandler<HTMLDivElement> =
    useCallback((toastId: string) => () => {
        resumeToastTimer(toastId);
    }, [resumeToastTimer]);

     const handleFocus: (toastId: string) => FocusEventHandler<HTMLDivElement> =
    useCallback((toastId: string) => () => {
        pauseToastTimer(toastId);
    }, [pauseToastTimer]);

     const handleBlur: (e: FocusEvent<HTMLDivElement>, toastId: string) => void =
     useCallback((e: FocusEvent<HTMLDivElement>, toastId: string) => {
         const next: Node | null = e.relatedTarget as Node | null;
         if (!next || !e.currentTarget.contains(next)) {
             resumeToastTimer(toastId);
         }
     }, [resumeToastTimer]);

     const l10n: IL10n = L10n('toast', {
         close: 'Close'
     }, locale);
     const close: string = l10n.getConstant('close');
     const getToastGroups: () => Record<string, { pos: PositionAxis; items: typeof toasts }> = () => {
         const groupedToasts: Record<string, { pos: PositionAxis; items: typeof toasts }> = {};
         toasts.forEach((toast: { id: string; content: ReactNode; options?: ToastProps }) => {
             const positionAxis: PositionAxis = toast.options?.position ?? position;
             const key: string = `${positionAxis?.yAxis}-${positionAxis?.xAxis}`;
             if (!groupedToasts[key as string]) {
                 groupedToasts[key as string] = { pos: positionAxis, items: [] };
             }
             groupedToasts[key as string].items.push(toast);
         });
         const defaultKey: string = `${position?.yAxis}-${position?.xAxis}`;
         if (!groupedToasts[defaultKey as string]) {
             groupedToasts[defaultKey as string] = { pos: position, items: [] };
         }
         return groupedToasts;
     };
     const groups: Record<string, { pos: PositionAxis; items: typeof toasts }> = useMemo(() => getToastGroups(), [toasts]);
     const componentDefaults: ToastProps = {
         severity, icon, title, closeButton, progressBar,
         width, height, actions, timeout, progressDirection, animation
     };

     const getSeverityClass: (severity?: Severity) => string = (severity?: Severity) =>
         (severity && severity !== 'Normal')
             ? (severity === 'Error' ? 'sf-toast-danger' : `sf-toast-${(severity as string).toLowerCase()}`)
             : '';
     return (
         <>
             {Object.entries(groups).map(([key, group]: [string, { pos: PositionAxis; items: typeof toasts }]) => {
                 const containerPosition: string = `sf-toast-${group.pos?.yAxis?.toString().toLowerCase()}-${group.pos?.xAxis?.toString().toLowerCase()}`;

                 return (
                     <div
                         key={key}
                         ref={toastRef}
                         id={toastId}
                         className={`sf-control sf-toast sf-lib sf-toast-container ${containerPosition} ${getSeverityClass(severity)} ${className} ${(dir === 'rtl') ? 'sf-rtl' : ''}`}
                         style={{
                             position: target !== 'body' ? 'absolute' : 'fixed',
                             zIndex: target !== 'body' ? 1000000001 : 1004
                         }}
                     >
                         {
                             group.items.map(({ id: toastid, content: toastContent, options: toastOpts }: {
                                 id: string; content: React.ReactNode; options?: Partial<ToastProps>;
                             }) => {
                                 const toast: ToastProps = mergeProps(componentDefaults, toastOpts);
                                 const progressDelay: number = Math.max(0, toast.animation?.show?.duration ?? 0);
                                 return (
                                     <div
                                         key={toastid}
                                         id={toastid}
                                         className={`sf-toast  ${getSeverityClass(toast.severity)} ${toast.icon ? 'sf-toast-header-icon' : ''}`}
                                         role="alert"
                                         ref={registerToastRef(toastid)}
                                         style={{ width: toast.width, height: toast.height }}
                                         onClick={(e: MouseEvent<HTMLDivElement>) => handleClick(e, toastid)}
                                         onMouseEnter={handleMouseEnter(toastid)}
                                         onMouseLeave={handleMouseLeave(toastid)}
                                         onFocus={handleFocus(toastid)}
                                         onBlur={(e: FocusEvent<HTMLDivElement>) => handleBlur(e, toastid)}
                                     >
                                         {toast.icon && <div className={'sf-toast-icon sf-icon'}>{toast.icon}</div>}
                                         <div className="sf-toast-message">
                                             {toast.title && <div className="sf-toast-title">{toast.title}</div>}
                                             <div className="sf-toast-content">{toastContent}</div>
                                             {toast.actions && <div className="sf-toast-actions">{toast.actions}</div>}
                                         </div>
                                         {toast.closeButton && (
                                             <div
                                                 className="sf-toast-close-icon sf-icon"
                                                 aria-label={close}
                                                 tabIndex={0}
                                                 onKeyDown={(e: KeyboardEvent<HTMLDivElement>) => handleCloseKey(e, toastid)}
                                             >
                                                 <CloseIcon></CloseIcon>
                                             </div>
                                         )}
                                         {toast.progressBar && (
                                             <div className="sf-toast-progress">
                                                 <div
                                                     className={`sf-toast-progress-bar ${toast.progressDirection === 'Rtl' ? 'sf-toast-progress-rtl' : 'sf-toast-progress-ltr'}`}
                                                     style={{
                                                         animationDuration: `${toast.timeout}ms`,
                                                         animationDelay: `${progressDelay}ms`
                                                         ,
                                                         animationPlayState: pausedToasts.has(`${toastid}`) ? 'paused' : 'running'
                                                     }}
                                                 />
                                             </div>
                                         )}
                                     </div>
                                 );
                             })}
                     </div>
                 );
             })}
         </>
     );
 });

interface ToastContextType {
    show: (content: ReactNode, options?: Record<string, unknown>) => string;
    hide: (toastId?: string) => void;
}

const ToastContext: Context<ToastContextType | null> = createContext<ToastContextType | null>(null);

export const globalToastRef: IToast | null = null;

export const ToastProvider: FC<{ children: ReactNode }> = ({ children }: { children: ReactNode }) => {
    const toastRef: RefObject<IToast | null> = useRef<IToast>(null);

    const show: (content: ReactNode, options?: ToastProps) => string = (content: ReactNode, options: ToastProps = {}) => {
        const {
            severity = Severity.Info,
            timeout = 5000,
            extendedTimeout = 1000,
            position = { xAxis: 'Left', yAxis: 'Top' },
            closeButton = true,
            title
        }: ToastProps = options;

        let icon: ReactNode;
        let className: string;

        switch (severity) {
        case 'Success':
            icon = <CircleCheckIcon></CircleCheckIcon>;
            className = 'sf-toast-success';
            break;
        case 'Warning':
            icon = <WarningIcon></WarningIcon>;
            className = 'sf-toast-warning';
            break;
        case 'Error':
            icon = <CircleCloseIcon></CircleCloseIcon>;
            className = 'sf-toast-danger';
            break;
        case 'Info':
        default:
            icon = <CircleInfoIcon></CircleInfoIcon>;
            className = 'sf-toast-info';
            break;
        }

        const perToastOptions: ToastProps = {
            className,
            icon,
            timeout,
            extendedTimeout,
            position,
            closeButton,
            title,
            ...options,
            severity
        } as ToastProps;
        return toastRef.current ? toastRef.current.show(content, perToastOptions) : '';
    };

    const hide: (toastId?: string) => void = (toastId?: string) => {
        if (toastRef.current) {
            toastRef.current.hide(toastId);
        }
    };

    return (
        <ToastContext.Provider value={{ show, hide }}>
            {children}
            <Toast ref={toastRef} />
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


