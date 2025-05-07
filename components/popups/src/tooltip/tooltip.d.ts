import * as React from 'react';
import { HTMLAttributes } from 'react';
/**
 * Applicable positions where the Tooltip can be displayed over specific target elements.
 * ```props
 * TopLeft :- The Tooltip is positioned at the top-left corner of the trigger element.
 * TopCenter :- The Tooltip is positioned at the top-center of the trigger element.
 * TopRight :- The Tooltip is positioned at the top-right corner of the trigger element.
 * BottomLeft :- The Tooltip is positioned at the bottom-left corner of the trigger element.
 * BottomCenter :- The Tooltip is positioned at the bottom-center of the trigger element.
 * BottomRight :- The Tooltip is positioned at the bottom-right corner of the trigger element.
 * LeftTop :- The Tooltip is positioned at the left-top corner of the trigger element.
 * LeftCenter :- The Tooltip is positioned at the left-center of the trigger element.
 * LeftBottom :- The Tooltip is positioned at the left-bottom corner of the trigger element.
 * RightTop :- The Tooltip is positioned at the right-top corner of the trigger element.
 * RightCenter :- The Tooltip is positioned at the right-center of the trigger element.
 * RightBottom :- The Tooltip is positioned at the right-bottom corner of the trigger element.
 * ```
 */
export type Position = 'TopLeft' | 'TopCenter' | 'TopRight' | 'BottomLeft' | 'BottomCenter' | 'BottomRight' | 'LeftTop' | 'LeftCenter' | 'LeftBottom' | 'RightTop' | 'RightCenter' | 'RightBottom';
/**
 * Applicable tip positions attached to the Tooltip.
 * ```props
 * Auto :- The tip pointer position is automatically calculated based on the available space.
 * Start :- The tip pointer is positioned at the start of the Tooltip.
 * Middle :- The tip pointer is positioned at the middle of the Tooltip.
 * End :- The tip pointer is positioned at the end of the Tooltip.
 * ```
 */
export type TipPointerPosition = 'Auto' | 'Start' | 'Middle' | 'End';
/**
 * Animation effects that are applicable for Tooltip.
 * ```props
 * FadeIn :- A fade-in animation effect where the Tooltip gradually increases in opacity from 0 to full.
 * FadeOut :- A fade-out animation effect where the Tooltip gradually decreases in opacity from full to 0.
 * FadeZoomIn :- A fade-in animation effect combined with a zoom-in effect.
 * FadeZoomOut :- A fade-out animation effect combined with a zoom-out effect.
 * FlipXDownIn :- A flip-down animation effect where the Tooltip starts upside down and flips down to become fully visible.
 * FlipXDownOut :- A flip-down animation effect where the Tooltip starts fully visible and flips down to become invisible.
 * FlipXUpIn :- A flip-up animation effect where the Tooltip starts upside down and flips up to become fully visible.
 * FlipXUpOut :- A flip-up animation effect where the Tooltip starts fully visible and flips up to become invisible.
 * FlipYLeftIn :- A flip-left animation effect where the Tooltip starts from the right side and flips left to become fully visible.
 * FlipYLeftOut :- A flip-left animation effect where the Tooltip starts from the left side and flips left to become invisible.
 * FlipYRightIn :- A flip-right animation effect where the Tooltip starts from the left side and flips right to become fully visible.
 * FlipYRightOut :- A flip-right animation effect where the Tooltip starts from the right side and flips right to become invisible.
 * ZoomIn :- A zoom-in animation effect where the Tooltip starts small and gradually grows in size to become fully visible.
 * ZoomOut :- A zoom-out animation effect where the Tooltip starts full size and gradually decreases in size to become invisible.
 * None :- No animation effect, the Tooltip simply appears or disappears without any animation.
 * ```
 */
export type Effect = 'FadeIn' | 'FadeOut' | 'FadeZoomIn' | 'FadeZoomOut' | 'FlipXDownIn' | 'FlipXDownOut' | 'FlipXUpIn' | 'FlipXUpOut' | 'FlipYLeftIn' | 'FlipYLeftOut' | 'FlipYRightIn' | 'FlipYRightOut' | 'ZoomIn' | 'ZoomOut' | 'None';
/**
 * Animation options that are common for both open and close actions of the Tooltip.
 */
export interface TooltipAnimationSettings {
    /**
     * Specifies the animation effect on the Tooltip, during open and close actions.
     */
    effect?: Effect;
    /**
     * Specifies the duration of the animation that is completed per animation cycle.
     */
    duration?: number;
    /**
     * Specifies the delay value in milliseconds and indicating the waiting time before animation begins.
     */
    delay?: number;
}
export interface AnimationModel {
    /**
     * Animation settings to be applied on the Tooltip, while it is being shown over the target.
     */
    open?: TooltipAnimationSettings;
    /**
     * Animation settings to be applied on the Tooltip, when it is closed.
     */
    close?: TooltipAnimationSettings;
}
/**
 * @ignore
 */
export interface TooltipProps {
    /**
     * Specifies the width of the Tooltip component.
     *
     * @default 'auto'
     */
    width?: string | number;
    /**
     * Specifies the height of the Tooltip component.
     *
     * @default 'auto'
     */
    height?: string | number;
    /**
     * Specifies the content of the Tooltip.
     *
     * @default -
     */
    content?: React.ReactNode | Function;
    /**
     * Specifies the container element in which the Tooltip's pop-up will be appended.
     *
     * @default 'body'
     */
    container?: React.RefObject<HTMLElement>;
    /**
     * Specifies the target where the Tooltip needs to be displayed.
     *
     * @default -
     */
    target?: React.RefObject<HTMLElement>;
    /**
     * Specifies the position of the Tooltip element with respect to the target element.
     *
     * @default 'TopCenter'
     */
    position?: Position;
    /**
     * Specifies the space between the target and Tooltip element in X axis.
     *
     * @default 0
     */
    offsetX?: number;
    /**
     * Specifies the space between the target and Tooltip element in Y axis.
     *
     * @default 0
     */
    offsetY?: number;
    /**
     * Shows or hides the tip pointer of Tooltip.
     *
     * @default true
     */
    arrow?: boolean;
    /**
     * Specifies the collision target element as page viewport (window) or Tooltip element.
     *
     * @default false
     */
    windowCollision?: boolean;
    /**
     * Specifies the position of tip pointer on Tooltip.
     *
     * @default 'Auto'
     */
    arrowPosition?: TipPointerPosition;
    /**
     * Specifies the device mode to display the Tooltip content.
     *
     * Set of open modes available for Tooltip.
     * ```props
     * Auto :- The Tooltip opens automatically when the trigger element is hovered over.
     * Hover :- The Tooltip opens when the trigger element is hovered over.
     * Click :- The Tooltip opens when the trigger element is clicked.
     * Focus :- The Tooltip opens when the trigger element is focused.
     * Custom :- The Tooltip opens when the trigger element is triggered by a custom event.
     * ```
     *
     * @default 'Auto'
     */
    opensOn?: string;
    /**
     * Allows the Tooltip to follow the mouse pointer movement over the specified target element.
     *
     * @default false
     */
    followCursor?: boolean;
    /**
     * Displays the Tooltip in an open state until closed manually.
     *
     * @default false
     */
    sticky?: boolean;
    /**
     * Determines whether the Tooltip is open or closed.
     * When set to true, the Tooltip will be displayed; when false, it will be hidden.
     *
     * @default false
     */
    open?: boolean;
    /**
     * Specifies the same or different animation options to Tooltip while it is in open or close state.
     *
     * @default { open: { effect: 'FadeIn', duration: 150, delay: 0 }, close: { effect: 'FadeOut', duration: 150, delay: 0 } }
     */
    animation?: AnimationModel;
    /**
     * Opens the Tooltip after the specified delay in milliseconds.
     *
     * @default 0
     */
    openDelay?: number;
    /**
     * Closes the Tooltip after the specified delay in milliseconds.
     *
     * @default 0
     */
    closeDelay?: number;
    /**
     * Triggers before the Tooltip is displayed over the target element.
     *
     * @event onOpen
     */
    onOpen?: (event: Event) => void;
    /**
     * Triggers before the Tooltip hides from the screen.
     *
     * @event onClose
     */
    onClose?: (event: Event) => void;
    /**
     * Specifies a callback function that determines the target elements on which the Tooltip should be displayed.
     * This can be used for showing Tooltip with multiple targets.
     *
     * @param {HTMLElement} args - The target element for which the Tooltip is being evaluated.
     * @returns {boolean} True to display the Tooltip, false to prevent it from showing.
     * @event onFilterTarget
     */
    onFilterTarget?: (args: HTMLElement) => boolean;
}
export interface ITooltip extends TooltipProps {
    /**
     * Specifies the Tooltip component element.
     *
     * @private
     */
    element: HTMLDivElement | null;
    /**
     * Shows the Tooltip on the specified target with specific animation settings.
     *
     * @param {HTMLElement} element - Target element where the Tooltip is to be displayed. (Optional)
     * @param {TooltipAnimationSettings} animation - Sets the specific animation, while showing the Tooltip on the screen. (Optional)
     * @public
     * @returns {void}
     */
    openTooltip(element?: HTMLElement, animationSettings?: TooltipAnimationSettings): void;
    /**
     * Hides the Tooltip with specific animation effect.
     *
     * @param {TooltipAnimationSettings} animation - Sets the specific animation when hiding Tooltip from the screen. (Optional)
     * @public
     * @returns {void}
     */
    closeTooltip(animationSettings?: TooltipAnimationSettings): void;
    /**
     * Refreshes the Tooltip content and its position.
     *
     * @public
     * @returns {void}
     */
    refresh(): void;
}
type TooltipComponentProps = TooltipProps & Omit<HTMLAttributes<HTMLDivElement>, 'content'>;
/**
 * The Tooltip component displays additional information when users hover, click, or focus on an element.
 * It supports various positions, animations, and customization options.
 *
 * ```typescript
 * <Tooltip content={<>This is a Tooltip</>} position='BottomCenter'>Hover me</Tooltip>
 * ```
 */
export declare const Tooltip: React.ForwardRefExoticComponent<TooltipComponentProps & React.RefAttributes<ITooltip>>;
declare const _default: React.NamedExoticComponent<TooltipProps & Omit<React.HTMLAttributes<HTMLDivElement>, "content"> & React.RefAttributes<ITooltip>>;
export default _default;
