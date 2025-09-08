import * as React from 'react';
import { forwardRef, useRef, useImperativeHandle, HTMLAttributes, useCallback, useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Popup, IPopup, getZindexPartial, PositionAxis } from '../popup/popup';
import { Button, Color, IButton, Variant } from '@syncfusion/react-buttons';
import { Effect, IL10n, L10n, preRender, useProviderContext, useDraggable, IDraggable, DragEvent, getUniqueID } from '@syncfusion/react-base';
import { useResize, ResizeDirections, IResize } from '../common/resize';
import { ResizerRightIcon, CloseIcon } from '@syncfusion/react-icons';

const DIALOG_VIEWPORT_MARGIN: number = 20;

/**
 * Specifies the animation effects available for the Dialog component.
 * These effects control how the dialog appears and disappears on the screen.
 */
export type DialogEffect = 'Fade' | 'FadeZoom' | 'FlipLeftDown' | 'FlipLeftUp' | 'FlipRightDown' | 'FlipRightUp'
| 'FlipXDown' | 'FlipXUp' | 'FlipYLeft' | 'FlipYRight' | 'SlideBottom' | 'SlideLeft' | 'SlideRight' | 'SlideTop' | 'Zoom'
| 'None';

/**
 * Specifies the positioning options available for the Dialog component.
 *
 * Available positions:
 * - LeftTop: Dialog positioned at the left-top corner
 * - CenterTop: Dialog positioned at the center-top
 * - RightTop: Dialog positioned at the right-top corner
 * - LeftCenter: Dialog positioned at the left-center
 * - Center: Dialog positioned at the screen center
 * - RightCenter: Dialog positioned at the right-center
 * - LeftBottom: Dialog positioned at the left-bottom corner
 * - CenterBottom: Dialog positioned at the center-bottom
 * - RightBottom: Dialog positioned at the right-bottom corner
 *
 */
export type DialogPosition = 'LeftTop' | 'CenterTop' | 'RightTop' | 'LeftCenter' | 'Center' | 'RightCenter' | 'LeftBottom' | 'CenterBottom' | 'RightBottom';

/**
 * Specifies the configuration for the dialog's animation behavior, controlling how it appears and disappears.
 */
export interface DialogAnimationProps {
    /**
     * Specifies the type of animation effect to apply to the dialog.
     *
     * @default 'Fade'
     */
    effect: DialogEffect;

    /**
     * Specifies the animation duration in milliseconds. Higher values result in slower animations.
     *
     * @default 400
     */
    duration: number;

    /**
     * Specifies the delay before starting the animation, in milliseconds.
     *
     * @default 0
     */
    delay: number;
}

/**
 * Specifies the event arguments for resize events.
 */
export interface ResizeEvent {
    /**
     * Specifies the original browser event that triggered the resize action.
     */
    event: Event;

    /**
     * Specifies the current width of the element being resized.
     * This value is updated during the resize operation.
     */
    width: number;

    /**
     * Specifies the current height of the element being resized.
     * This value is updated during the resize operation.
     */
    height: number;

    /**
     * Specifies the direction in which the resize is occurring (e.g., 'North', 'SouthEast').
     * Indicates which handle is being used for the current resize operation.
     */
    direction: ResizeDirections;

    /**
     * Specifies whether the resize operation should be canceled.
     * Set to true in event handlers to prevent the resize start operation from proceeding.
     */
    cancel?: boolean;
}

/**
 * Specifies the properties of the Dialog component.
 */
export interface DialogProps {
    /**
     * Specifies whether the dialog is displayed (true) or hidden (false).
     * This is a controlled property that must be managed by the parent component.
     *
     * @default false
     */
    open: boolean;

    /**
     * Specifies the content to display in the dialog header section.
     * This can be text or any valid React node.
     *
     * @default -
     */
    header?: React.ReactNode;

    /**
     * Specifies the content to display in the dialog footer section.
     * This is typically used for action buttons like "OK", "Cancel", etc.
     *
     * @default -
     */
    footer?: React.ReactNode;

    /**
     * Specifies if the dialog should behave as a modal.
     * When true, an overlay prevents interaction with the underlying content, traps focus within the dialog, and blocks scrolling of the background content.
     * When false, the dialog appears without an overlay and allows interaction with the page behind it.
     *
     * @default true
     */
    modal?: boolean;

    /**
     * Specifies the close icon to display in the dialog header.
     * When set to true, displays the default close icon. When set to a ReactNode, displays the custom icon/element provided.
     * When set to false, no close icon is displayed.
     *
     * @default true
     */
    closeIcon?: React.ReactNode;

    /**
     * Specifies the element that should receive focus when the dialog opens.
     * This overrides the default focus behavior, which focuses on the first focusable element.
     *
     * @default -
     */
    initialFocusRef?: React.RefObject<HTMLElement>;

    /**
     * Specifies whether the dialog can be dragged by its header to reposition it.
     *
     * @default false
     */
    draggable?: boolean;

    /**
     * Specifies whether the dialog can be resized by dragging its edges or corners.
     *
     * @default false
     */
    resizable?: boolean;

    /**
     * Specifies which edges or corners of the dialog can be dragged to resize it.
     * Only applies when the resizable is true.
     *
     * @default ['SouthEast']
     */
    resizeHandles?: ResizeDirections[];

    /**
     * Specifies the positioning of the dialog on the screen.
     * Uses predefined positions or custom coordinates via style properties.
     *
     * @default 'Center'
     */
    position?: DialogPosition;

    /**
     * Specifies the animation effect, duration, and delay for the dialog's entry and exit.
     *
     * @default { effect: 'Fade', duration: 400, delay: 0 }
     */
    animation?: DialogAnimationProps;

    /**
     * Specifies the element where the dialog should be rendered.
     * By default, dialogs are rendered at the document body, but this prop allows to render the dialog within any element.
     *
     * @default document.body
     */
    target?: HTMLElement;

    /**
     * Specifies whether the dialog should expand to fill the entire viewport.
     * The dialog maintains its header, content, and footer structure but takes up the full width and height of the screen.
     *
     * @default false
     */
    fullScreen?: boolean;

    /**
     * Specifies the callback function invoked when the dialog needs to close.
     * This occurs when the user clicks the overlay, presses the ESC key,
     * or clicks the close icon (if provided).
     *
     * @event onClose
     */
    onClose?: (event?: React.SyntheticEvent | React.KeyboardEvent) => void;

    /**
     * Specifies the callback function that triggers when the dialog starts being dragged.
     *
     * @event onDragStart
     */
    onDragStart?: (event: DragEvent) => void;

    /**
     * Specifies the callback function that triggers while the dialog is being dragged.
     *
     * @event onDrag
     */
    onDrag?: (event: MouseEvent | TouchEvent) => void;

    /**
     * Specifies the callback function that triggers when the dialog stops being dragged.
     *
     * @event onDragStop
     */
    onDragStop?: (event: MouseEvent | TouchEvent) => void;

    /**
     * Specifies the callback function that triggers when the dialog starts being resized.
     *
     * @event onResizeStart
     */
    onResizeStart?: (event: ResizeEvent) => void;

    /**
     * Specifies the callback function that triggers while the dialog is being resized.
     *
     * @event onResize
     */
    onResize?: (event: ResizeEvent) => void;

    /**
     * Specifies the callback function that triggers when the dialog stops being resized.
     *
     * @event onResizeStop
     */
    onResizeStop?: (event: ResizeEvent) => void;
}

/**
 * Specifies the interface representing the Dialog component.
 */
export interface IDialog extends DialogProps {
    /**
     * Specifies the DOM element of the Dialog component.
     *
     * @private
     */
    element?: HTMLElement | null;
}


type DialogComponentProps = DialogProps & Omit<HTMLAttributes<HTMLDivElement>, keyof DialogProps>;

type DialogState = {
    internalOpen: boolean;
    dynamicMaxHeight: string;
};

type AnimationMapping = {
    show: Effect;
    hide: Effect;
};

/**
 * Specifies a Dialog component that provides a modal or non-modal overlay to display content above the main interface.
 *
 * The Dialog component can be used to create alerts, confirmation dialogs, forms, or any content that requires
 * user attention or interaction. It supports multiple customization options including positioning, animation effects,
 * header/footer structure, and accessibility features.
 *
 * Use header and footer props to create a structured dialog layout:
 *
 * ```typescript
 * import { Dialog } from "@syncfusion/react-popups";
 *
 * const [isOpen, setIsOpen] = useState(false);
 *
 * <Dialog open={isOpen} onClose={() => setIsOpen(false)} modal={true} header="Dialog Title" footer={<><button onClick={() => setIsOpen(false)}>Close</button></>} >
 *      <p>This is the dialog content.</p>
 * </Dialog>
 * ```
 */
export const Dialog: React.ForwardRefExoticComponent<DialogComponentProps & React.RefAttributes<IDialog>> =
    forwardRef<IDialog, DialogComponentProps>((props: DialogComponentProps, ref: React.Ref<IDialog>) => {
        const {
            open,
            header,
            footer,
            modal = true,
            onClose,
            onDragStart,
            onDrag,
            onDragStop,
            onResizeStart,
            onResize,
            onResizeStop,
            closeIcon = true,
            initialFocusRef,
            draggable = false,
            resizable = false,
            resizeHandles = ['SouthEast'],
            position = 'Center',
            animation = { effect: 'Fade', duration: 400, delay: 0 },
            target = typeof document !== 'undefined' ? document.body : undefined,
            fullScreen = false,
            className = '',
            children,
            style,
            id = getUniqueID('dialog'),
            ...restProps
        } = props;

        const dialogElementRef: React.RefObject<HTMLDivElement | null> = useRef<HTMLDivElement>(null);
        const closeButtonRef: React.RefObject<IButton | null> = useRef<IButton>(null);
        const previousFocusElementRef: React.RefObject<HTMLElement | null> = useRef<HTMLElement | null>(null);
        const [dialogState, setDialogState] = useState<DialogState>({ internalOpen: open, dynamicMaxHeight: '' });
        const { internalOpen, dynamicMaxHeight } = dialogState;
        const { locale } = useProviderContext();

        const draggableOptions: Partial<IDraggable> = useMemo(() => ({
            handle: '.sf-dlg-header-content',
            clone: false,
            dragArea: target && target instanceof HTMLElement ? target : (typeof document !== 'undefined' ? document.body : undefined),
            abort: '.sf-dlg-closeicon-btn',
            isDragScroll: true,
            dragStart: (args: DragEvent) => {
                if (!draggable) { args.cancel = true; return; }
                if (onDragStart) {
                    onDragStart(args);
                }
            },
            drag: (args: DragEvent) => {
                if (!draggable) { return; }
                if (onDrag) {
                    onDrag(args.event as MouseEvent & TouchEvent);
                }
            },
            dragStop: (args: DragEvent) => {
                if (!draggable) { return; }
                if (onDragStop) {
                    onDragStop(args.event as MouseEvent & TouchEvent);
                }
            }
        }), [draggable, target, onDragStart, onDrag, onDragStop]);
        const stableRef : React.RefObject<HTMLElement | null> = useRef<HTMLElement | null>(null);

        const draggableRef: React.RefObject<IDraggable | null>  =
        useRef<IDraggable | null>(useDraggable({current: (draggable ? stableRef.current : null) as HTMLElement}, draggableOptions));

        const styleConstraints: {
            minWidth: number | string ;
            minHeight: number | string ;
            maxWidth: number | string ;
            maxHeight: number | string ;
        } = useMemo(() => {
            const parseDimensionValue: (value: string | number | undefined, defaultValue: number) => number | string  =
            (value: string | number | undefined, defaultValue: number): number | string => {
                if (value === undefined) {
                    return defaultValue;
                }
                if (typeof value === 'number') {
                    return value;
                }
                return value;
            };
            const defaultMaxWidth: number = fullScreen && typeof window !== 'undefined' ? window.innerWidth : typeof window !== 'undefined' ? window.innerWidth - DIALOG_VIEWPORT_MARGIN * 2 : 800;
            const defaultMaxHeight: number = fullScreen && typeof window !== 'undefined' ? window.innerHeight : typeof window !== 'undefined' ? window.innerHeight - DIALOG_VIEWPORT_MARGIN * 2 : 600;

            return {
                minWidth: parseDimensionValue(style?.minWidth, 100),
                minHeight: parseDimensionValue(style?.minHeight, 100),
                maxWidth: parseDimensionValue(style?.maxWidth, defaultMaxWidth),
                maxHeight: parseDimensionValue(style?.maxHeight, defaultMaxHeight)
            };
        }, [style?.minWidth, style?.minHeight, style?.maxWidth, style?.maxHeight, fullScreen]);

        const resizeOptions: IResize = useMemo(() => ({
            enabled: resizable && !fullScreen,
            handles: resizeHandles,
            boundary: target && target instanceof HTMLElement ? target : undefined,
            minWidth: styleConstraints.minWidth,
            minHeight: styleConstraints.minHeight,
            maxWidth: styleConstraints.maxWidth,
            maxHeight: styleConstraints.maxHeight,
            onResizeStart: onResizeStart,
            onResize: onResize,
            onResizeStop: onResizeStop
        }), [resizable, resizeHandles, target, styleConstraints]);

        const { renderResizeHandles } = useResize(stableRef as React.RefObject<HTMLElement>, resizeOptions);

        useEffect(() => {
            preRender('dialog');
            return () => {
                if (draggableRef.current && draggableRef.current.element?.current) {
                    draggableRef.current.destroy?.();
                }
                stableRef.current = null;
                draggableRef.current = null;
                dialogElementRef.current = null;
                closeButtonRef.current = null;
                previousFocusElementRef.current = null;
                if (typeof window !== 'undefined') {
                    window.removeEventListener('resize', handleResize);
                }
                setDialogState({
                    internalOpen: false,
                    dynamicMaxHeight: ''
                });
            };
        }, []);

        const getFocusableElements: () => HTMLElement[] = useCallback(() => {
            let currentElements: HTMLElement[] = [];
            if (stableRef.current) {
                const selector: string = ['a[href]:not([tabindex="-1"])', 'button:not([disabled]):not([tabindex="-1"])', 'input:not([disabled]):not([tabindex="-1"])', 'select:not([disabled]):not([tabindex="-1"])', 'textarea:not([disabled]):not([tabindex="-1"])', 'details:not([tabindex="-1"])', '[contenteditable]:not([tabindex="-1"])', '[tabindex]:not([tabindex="-1"])'
                ].join(',');
                const elements: NodeListOf<HTMLElement> = stableRef.current.querySelectorAll<HTMLElement>(selector);
                currentElements = Array.from(elements).filter((el: HTMLElement) => !el.hasAttribute('disabled')) as HTMLElement[];
            }
            return currentElements;
        }, [stableRef, children, open]);

        useEffect(() => {
            if (open) {
                if (typeof document === 'undefined' || typeof window === 'undefined'){
                    return;
                }
                previousFocusElementRef.current = document.activeElement as HTMLElement;
                if (modal) {
                    const currentTarget: HTMLElement = target && target instanceof HTMLElement ? target : document.body;
                    const originalStyles: { overflow: string; paddingRight: string; } = {
                        overflow: currentTarget.style.overflow,
                        paddingRight: currentTarget.style.paddingRight
                    };
                    const scrollbarWidth: number = window.innerWidth - document.documentElement.clientWidth;
                    currentTarget.style.overflow = 'hidden';
                    currentTarget.style.paddingRight = `${scrollbarWidth}px`;
                    return () => {
                        currentTarget.style.overflow = originalStyles.overflow;
                        currentTarget.style.paddingRight = originalStyles.paddingRight;
                        if (previousFocusElementRef.current && open) {
                            previousFocusElementRef.current.focus();
                        }
                    };
                }
            } else if (previousFocusElementRef.current) {
                previousFocusElementRef.current.focus();
                previousFocusElementRef.current = null;
            }
            return () => {
                if (previousFocusElementRef.current && open) {
                    previousFocusElementRef.current.focus();
                }
            };
        }, [internalOpen, modal]);

        useEffect(() => {
            if (open) {
                setDialogState((prevState: DialogState) => ({
                    ...prevState,
                    internalOpen: true
                }));
            }
        }, [open]);

        const calculateMaxHeight: () => string = useCallback(() => {
            if (fullScreen) {return '100%'; }
            if (target && target !== document.body && typeof window !== 'undefined') {
                return (target.offsetHeight < window.innerHeight) ? (target.offsetHeight - DIALOG_VIEWPORT_MARGIN) + 'px' : (window.innerHeight - DIALOG_VIEWPORT_MARGIN) + 'px';
            }
            return (typeof window !== 'undefined' ? (window.innerHeight - DIALOG_VIEWPORT_MARGIN) : 600) + 'px';
        }, [fullScreen, target]);

        useEffect(() => {
            if (open) {
                setDialogState((prevState: DialogState) => ({
                    ...prevState,
                    dynamicMaxHeight: calculateMaxHeight()
                }));
            }
        }, [open, calculateMaxHeight]);

        const handleResize: () => void = useCallback(() => {
            setDialogState((prevState: DialogState) => ({
                ...prevState,
                dynamicMaxHeight: calculateMaxHeight()
            }));
        }, [calculateMaxHeight]);

        useEffect(() => {
            if (!open || !internalOpen) {
                return;
            }
            if (dialogElementRef.current) {
                setDialogState((prevState: DialogState) => ({
                    ...prevState,
                    dynamicMaxHeight: calculateMaxHeight()
                }));
            }
            if (typeof window !== 'undefined') {
                window.addEventListener('resize', handleResize);
            }
            return () => {
                if (typeof window !== 'undefined') {
                    window.removeEventListener('resize', handleResize);
                }
            };
        }, [open, internalOpen, handleResize, calculateMaxHeight]);

        const publicAPI: Partial<IDialog> = useMemo(() => ({
            open,
            modal,
            draggable,
            resizable,
            resizeHandles,
            position,
            animation,
            target,
            fullScreen,
            closeIcon
        }), [open, modal, draggable, resizable, resizeHandles, position, animation, target, fullScreen]);

        useImperativeHandle(ref, () => ({
            ...publicAPI as IDialog,
            element: dialogElementRef.current
        }), [publicAPI]);

        const handleDialogKeyDown: (e: React.KeyboardEvent) => void = useCallback((e: React.KeyboardEvent) => {
            if (e.key === 'Escape' && onClose) {
                e.preventDefault();
                onClose(e);
                if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
                    document.activeElement.blur();
                }
            }
        }, [onClose]);

        const handleTabKey: (e: React.KeyboardEvent) => void = useCallback((e: React.KeyboardEvent) => {
            if (!modal) { return; }
            const focusableElements: HTMLElement[] = getFocusableElements();
            if (focusableElements.length === 0) { return; }
            switch (e.key) {
            case 'Tab':
            {
                const currentElement: HTMLElement = (typeof document !== 'undefined' ? document.activeElement : null) as HTMLElement;
                const currentElementIndex: number = focusableElements.indexOf(currentElement);
                if (currentElementIndex === -1) {
                    e.preventDefault();
                    focusableElements[focusableElements.length - 1]?.focus?.();
                    return;
                }
                e.preventDefault();
                let nextIndex: number;
                if (e.shiftKey) {
                    nextIndex = currentElementIndex <= 0 ? focusableElements.length - 1 : currentElementIndex - 1;
                } else {
                    nextIndex = currentElementIndex >= focusableElements.length - 1 ? 0  : currentElementIndex + 1;
                }

                focusableElements[nextIndex as number]?.focus?.();
                break;
            }
            }
        }, [modal, getFocusableElements]);

        const handlePopupOpen: () => void = useCallback(() => {
            if (dialogElementRef.current) {
                setDialogState((prevState: DialogState) => ({
                    ...prevState,
                    dynamicMaxHeight: calculateMaxHeight()
                }));
            }
            if (initialFocusRef?.current) {
                if ('element' in initialFocusRef.current && initialFocusRef.current.element) {
                    (initialFocusRef.current.element as HTMLElement).focus();
                } else {
                    initialFocusRef.current.focus();
                }
            }  else {
                const elements: HTMLElement[] = getFocusableElements();
                const elementsWithoutCloseButton: HTMLElement[] = elements.filter((el: HTMLElement) =>
                { return (!closeButtonRef.current || (closeButtonRef.current && el !== closeButtonRef.current.element)); });
                if (elementsWithoutCloseButton.length > 0) {
                    elementsWithoutCloseButton[0].focus();
                }
                else if (closeButtonRef.current?.element) {
                    closeButtonRef.current.element.focus();
                }
            }
        }, [initialFocusRef, calculateMaxHeight, getFocusableElements]);

        const handlePopupClose: () => void = useCallback(() => {
            if (dialogElementRef.current) {
                setDialogState((prevState: DialogState) => ({
                    ...prevState,
                    internalOpen: false
                }));
            }
        }, []);

        const handleCloseIconClick: (e: React.MouseEvent) => void = useCallback((e: React.MouseEvent) => {
            onClose?.(e);
        }, [onClose]);

        const handleOverlayClick: (event: React.MouseEvent) => void = useCallback((event: React.MouseEvent) => {
            if (modal && event.target === event.currentTarget) {
                onClose?.(event);
            }
        }, [modal, onClose]);

        const closeIconTitle: string = useMemo(() => {
            const l10n: IL10n = L10n('dialog', { close: 'Close' }, locale);
            return l10n.getConstant('close');
        }, [locale]);

        const renderCloseIcon: () => React.JSX.Element = useCallback(() => {
            return (
                <Button
                    ref={closeButtonRef}
                    icon={typeof closeIcon === 'boolean' ? <CloseIcon aria-label={closeIconTitle}/> : closeIcon}
                    title={closeIconTitle}
                    aria-label={closeIconTitle}
                    color={Color.Secondary}
                    onClick={handleCloseIconClick}
                    className="sf-dlg-closeicon-btn"
                    variant={Variant.Standard} />
            );
        }, [closeIcon, handleCloseIconClick, modal, closeIconTitle]);

        const mapDialogEffectToPopupAnimation: (effect: DialogEffect, isShow: boolean) => Effect =
        (effect: DialogEffect, isShow: boolean): Effect => {
            const animationMappings: Record<DialogEffect, AnimationMapping> = {
                'Fade': { show: 'FadeIn', hide: 'FadeOut' },
                'FadeZoom': { show: 'FadeZoomIn', hide: 'FadeZoomOut' },
                'FlipLeftDown': { show: 'FlipLeftDownIn', hide: 'FlipLeftDownOut' },
                'FlipLeftUp': { show: 'FlipLeftUpIn', hide: 'FlipLeftUpOut' },
                'FlipRightDown': { show: 'FlipRightDownIn', hide: 'FlipRightDownOut' },
                'FlipRightUp': { show: 'FlipRightUpIn', hide: 'FlipRightUpOut' },
                'FlipXDown': { show: 'FlipXDownIn', hide: 'FlipXDownOut' },
                'FlipXUp': { show: 'FlipXUpIn', hide: 'FlipXUpOut' },
                'FlipYLeft': { show: 'FlipYLeftIn', hide: 'FlipYLeftOut' },
                'FlipYRight': { show: 'FlipYRightIn', hide: 'FlipYRightOut' },
                'SlideBottom': { show: 'SlideBottomIn', hide: 'SlideBottomOut' },
                'SlideLeft': { show: 'SlideLeftIn', hide: 'SlideLeftOut' },
                'SlideRight': { show: 'SlideRightIn', hide: 'SlideRightOut' },
                'SlideTop': { show: 'SlideTopIn', hide: 'SlideTopOut' },
                'Zoom': { show: 'ZoomIn', hide: 'ZoomOut' },
                'None': { show: 'FadeIn', hide: 'FadeOut' }
            };
            const defaultAnimation: AnimationMapping = {
                show: 'FadeIn',
                hide: 'FadeOut'
            };
            const mapping: AnimationMapping = animationMappings[effect as DialogEffect] || defaultAnimation;
            return isShow ? mapping.show : mapping.hide;
        };

        const dialogClasses: string = useMemo(() => {
            return [
                'sf-control',
                'sf-dialog',
                modal ? 'sf-dlg-modal' : '',
                fullScreen ? 'sf-dlg-fullscreen' : '',
                resizable && !fullScreen ? 'sf-dlg-resizable' : '',
                className
            ].filter(Boolean).join(' ');
        }, [modal, fullScreen, className, resizable]);

        const positionClassName: string | undefined = useMemo(() => {
            if (style?.top && style?.left || position === null) {
                return;
            }
            const [X, Y] = position?.split(/(?=[A-Z])/);
            if (X && Y) {
                return `sf-dlg-${X?.toLowerCase()}-${Y?.toLowerCase()}`;
            }
            return 'sf-dlg-center';
        }, [position, style]);

        const popupPosition: PositionAxis = useMemo(() => {
            const [X, Y] = position ? position?.split(/(?=[A-Z])/) : [];
            if (X && Y) {
                return { X: X, Y: Y };
            }
            return { X: 'Center', Y: 'Center' };
        }, [position]);

        const dialogContainerClasses: string = useMemo(() => {
            return [
                'sf-dlg-container',
                positionClassName
            ].filter(Boolean).join(' ');
        }, [positionClassName]);

        const calculatedStyle: React.CSSProperties = useMemo(() => {
            const styleWithoutZIndex: React.CSSProperties = { ...style };
            delete styleWithoutZIndex.zIndex;
            return {
                maxHeight: fullScreen ? '100%' : dynamicMaxHeight,
                position: styleWithoutZIndex.left && styleWithoutZIndex.top ? 'absolute' : 'relative',
                ...(( !styleWithoutZIndex.left && !styleWithoutZIndex.top ) ? {
                    top: '0px',
                    left: '0px'
                } : {}),
                ...(fullScreen ? {
                    width: '100vw',
                    height: '100vh',
                    maxWidth: '100%',
                    maxHeight: '100%'
                } : {}),
                ...(!fullScreen && resizable ? {
                    minWidth: styleConstraints.minWidth,
                    minHeight: styleConstraints.minHeight,
                    maxWidth: styleConstraints.maxWidth,
                    maxHeight: styleConstraints.maxHeight
                } : {}),
                ...styleWithoutZIndex
            };
        }, [position, fullScreen, style, dynamicMaxHeight, resizable, styleConstraints]);

        const { zIndexBase, zIndexPopup, zIndexOverlay } = useMemo(() => {
            let baseValue: number = typeof style?.zIndex === 'number' ? style.zIndex : 1000;
            if ( baseValue === 1000 && dialogElementRef.current) {
                baseValue = getZindexPartial(dialogElementRef.current);
            }
            return {
                zIndexBase: Math.max(2, baseValue),
                zIndexPopup: Math.max(3, baseValue + 1),
                zIndexOverlay: Math.max(1, baseValue - 1)
            };
        }, [style?.zIndex, open, internalOpen, dialogElementRef.current]);

        if (!internalOpen) {
            return null;
        }

        const dialogContent: React.JSX.Element = (
            <div
                className={dialogContainerClasses}
                ref={dialogElementRef}
                style={{
                    zIndex: zIndexBase,
                    position: typeof document !== 'undefined' && target !== document.body ? 'absolute' : 'fixed'
                }}
                onKeyDown={handleDialogKeyDown} >
                <Popup
                    ref={(el: IPopup) => {
                        stableRef.current = el?.element as HTMLElement;
                    }}
                    open={open}
                    position={popupPosition}
                    zIndex={zIndexPopup}
                    relateTo={target as HTMLElement}
                    onOpen={handlePopupOpen}
                    onClose={handlePopupClose}
                    className={dialogClasses}
                    animation={{
                        show: {
                            name: mapDialogEffectToPopupAnimation(animation.effect, true),
                            duration: animation.effect === 'None' ? 0 :  animation.duration,
                            delay: animation.delay,
                            timingFunction: 'ease-out'
                        },
                        hide: {
                            name: mapDialogEffectToPopupAnimation(animation.effect, false),
                            duration: animation.effect === 'None' ? 0 :   animation.duration,
                            delay: animation.delay,
                            timingFunction: 'ease-in'
                        }
                    }}
                    style={calculatedStyle as React.CSSProperties}
                    role="dialog"
                    id={id}
                    {...(children && { 'aria-describedby': `${id}_dialog-content` })}
                    {...(header && { 'aria-labelledby': `${id}_dialog-header` })}
                    {...(!header && { 'aria-label': 'Dialog' })}
                    aria-modal={modal ? 'true' : 'false'}
                    tabIndex={-1}
                    onKeyDown={handleTabKey}
                    {...restProps} >

                    {(header || closeIcon) && (
                        <div className="sf-dlg-header-content" id={`${id}_dialog-header`}>
                            {closeIcon && renderCloseIcon()}
                            {header && (
                                <div className="sf-dlg-header sf-ellipsis" id={`${id}_title`}>
                                    {header}
                                </div>
                            )}
                        </div>
                    )}

                    <div className="sf-dlg-content" id={`${id}_dialog-content`}>
                        {children}
                    </div>

                    {footer && (
                        <div className="sf-dlg-footer-content sf-content-end">
                            {footer}
                        </div>
                    )}
                    {(resizable && !fullScreen) &&
                            renderResizeHandles(<ResizerRightIcon fill='currentColor'/>)
                    }
                </Popup>

                {modal && (
                    <div
                        className="sf-dlg-overlay"
                        style={{
                            zIndex: zIndexOverlay
                        }}
                        onClick={handleOverlayClick}
                        role="presentation"
                    />
                )}
            </div>
        );

        const portalTarget: HTMLElement = target && target instanceof HTMLElement ? target : (typeof document !== 'undefined' ? document.body : undefined) as HTMLElement;

        return createPortal(dialogContent, portalTarget);
    });

Dialog.displayName = 'Dialog';
export default React.memo(Dialog);
