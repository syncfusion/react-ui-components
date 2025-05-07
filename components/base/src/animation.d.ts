/**
 * Animation effect names
 */
export type Effect = 'FadeIn' | 'FadeOut' | 'FadeZoomIn' | 'FadeZoomOut' | 'FlipLeftDownIn' | 'FlipLeftDownOut' | 'FlipLeftUpIn' | 'FlipLeftUpOut' | 'FlipRightDownIn' | 'FlipRightDownOut' | 'FlipRightUpIn' | 'FlipRightUpOut' | 'FlipXDownIn' | 'FlipXDownOut' | 'FlipXUpIn' | 'FlipXUpOut' | 'FlipYLeftIn' | 'FlipYLeftOut' | 'FlipYRightIn' | 'FlipYRightOut' | 'SlideBottomIn' | 'SlideBottomOut' | 'SlideDown' | 'SlideLeft' | 'SlideLeftIn' | 'SlideLeftOut' | 'SlideRight' | 'SlideRightIn' | 'SlideRightOut' | 'SlideTopIn' | 'SlideTopOut' | 'SlideUp' | 'ZoomIn' | 'ZoomOut';
/**
 * Interface for Animation propsRef
 */
export interface AnimationOptions {
    /**
     * Specify the type of animation
     *
     * @default FadeIn
     */
    name?: Effect;
    /**
     * Specify the duration to animate
     *
     * @default 400
     */
    duration?: number;
    /**
     * Specify the animation timing function
     *
     * @default ease
     */
    timingFunction?: string;
    /**
     * Specify the delay to start animation
     *
     * @default 0
     */
    delay?: number;
    /**
     * Triggers when animation is in-progress
     *
     * @event progress
     */
    progress?: (args: AnimationOptions) => void;
    /**
     * Triggers when the animation is started
     *
     * @event begin
     */
    begin?: (args: AnimationOptions) => void;
    /**
     * Triggers when animation is completed
     *
     * @event end
     */
    end?: (args: AnimationOptions) => void;
    /**
     * Triggers when animation is failed due to any scripts
     *
     * @event fail
     */
    fail?: (args: AnimationOptions) => void;
    /**
     * Get current time-stamp in progress EventHandler
     */
    timeStamp?: number;
    /**
     * Get current animation element in progress EventHandler
     */
    element?: HTMLElement;
}
export interface IAnimation extends AnimationOptions {
    /**
     * Returns module name as animation
     *
     * @private
     * @returns {void} ?
     */
    getModuleName(): string;
    animate(element: HTMLElement | string, props?: AnimationOptions): void;
    easing: {
        [key: string]: string;
    };
}
export declare let animationMode: string | GlobalAnimationMode;
/**
 * The Animation function provide options to animate the html DOM elements
 *
 * @param {AnimationOptions} props - The animation options
 * @returns {Animation} The animation object
 */
export declare function Animation(props: AnimationOptions): IAnimation;
export declare namespace Animation {
    var stop: (element: HTMLElement, model?: AnimationOptions) => void;
    var delayAnimation: (model: AnimationOptions) => void;
    var applyAnimation: (model: AnimationOptions) => void;
}
/**
 * This method is used to enable or disable the animation for all components.
 *
 * @param {string|GlobalAnimationMode} value - Specifies the value to enable or disable the animation for all components. When set to 'enable', it enables the animation for all components, regardless of the individual component's animation settings. When set to 'disable', it disables the animation for all components, regardless of the individual component's animation settings.
 * @returns {void}
 */
export declare function setGlobalAnimation(value: string | GlobalAnimationMode): void;
/**
 * Defines the global animation modes for all components.
 */
export declare enum GlobalAnimationMode {
    /**
     * Defines the global animation mode as Default. Animation is enabled or disabled based on the component's animation settings.
     */
    Default = "Default",
    /**
     * Defines the global animation mode as Enable. Enables the animation for all components, regardless of the individual component's animation settings.
     */
    Enable = "Enable",
    /**
     * Defines the global animation mode as Disable. Disables the animation for all components, regardless of the individual component's animation settings.
     */
    Disable = "Disable"
}
