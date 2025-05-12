import { selectAll } from './dom';

/**
 * Animation effect names
 */
export type Effect = 'FadeIn' | 'FadeOut' | 'FadeZoomIn' | 'FadeZoomOut' | 'FlipLeftDownIn' | 'FlipLeftDownOut' | 'FlipLeftUpIn' |
'FlipLeftUpOut' | 'FlipRightDownIn' | 'FlipRightDownOut' | 'FlipRightUpIn' | 'FlipRightUpOut' | 'FlipXDownIn' | 'FlipXDownOut' |
'FlipXUpIn' | 'FlipXUpOut' | 'FlipYLeftIn' | 'FlipYLeftOut' | 'FlipYRightIn' | 'FlipYRightOut' | 'SlideBottomIn' | 'SlideBottomOut' |
'SlideDown' | 'SlideLeft' | 'SlideLeftIn' | 'SlideLeftOut' | 'SlideRight' | 'SlideRightIn' | 'SlideRightOut' | 'SlideTopIn' |
'SlideTopOut' | 'SlideUp' | 'ZoomIn' | 'ZoomOut';

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
    easing: { [key: string]: string };
}

export let animationMode: string | GlobalAnimationMode;

/**
 * The Animation function provide options to animate the html DOM elements
 *
 * @param {AnimationOptions} props - The animation options
 * @returns {Animation} The animation object
 */
export function Animation(props: AnimationOptions): IAnimation {
    /**
     * @param {AnimationOptions} props - The animation options
     * @returns {Animation} The animation object
     */

    const propsRef: IAnimation = {...props} as IAnimation;

    propsRef.easing = {
        ease: 'cubic-bezier(0.250, 0.100, 0.250, 1.000)',
        linear: 'cubic-bezier(0.250, 0.250, 0.750, 0.750)',
        easeIn: 'cubic-bezier(0.420, 0.000, 1.000, 1.000)',
        easeOut: 'cubic-bezier(0.000, 0.000, 0.580, 1.000)',
        easeInOut: 'cubic-bezier(0.420, 0.000, 0.580, 1.000)',
        elasticInOut: 'cubic-bezier(0.5,-0.58,0.38,1.81)',
        elasticIn: 'cubic-bezier(0.17,0.67,0.59,1.81)',
        elasticOut: 'cubic-bezier(0.7,-0.75,0.99,1.01)'
    };

    /**
     * Applies animation to the current element.
     *
     * @param {string | HTMLElement} element - Element which needs to be animated.
     * @param {AnimationOptions} props - Animation options.
     * @returns {void}
     */
    propsRef.animate = (element: HTMLElement, props?: AnimationOptions): void => {
        const model: AnimationOptions = getModel(props || {});
        if (typeof element === 'string') {
            const elements: HTMLElement[] = Array.from(selectAll(element, document));
            elements.forEach((ele: HTMLElement) => {
                model.element = ele ;
                Animation.delayAnimation(model);
            });
        } else {
            model.element = element;
            Animation.delayAnimation(model);
        }
    };

    /**
     * Returns Animation Model
     *
     * @param {AnimationOptions} props - Animation options
     * @returns {AnimationOptions} The animation model
     */
    function getModel(props: AnimationOptions): AnimationOptions {
        return {
            name: props.name || propsRef.name || 'FadeIn',
            delay: props.delay || propsRef.delay || 0,
            duration: props.duration !== undefined ? props.duration : propsRef.duration || 400,
            begin: props.begin || propsRef.begin,
            end: props.end || propsRef.end,
            fail: props.fail || propsRef.fail,
            progress: props.progress || propsRef.progress,
            timingFunction: props.timingFunction && propsRef.easing[props.timingFunction] ? propsRef.easing[props.timingFunction] : (props.timingFunction || propsRef.timingFunction) || 'ease'
        };
    }

    /**
     * Returns the module name for animation.
     *
     * @returns {string} The module name.
     */
    propsRef.getModuleName = (): string => 'animation';

    return propsRef;
}

/**
 * Stop the animation effect on animated element.
 *
 * @param {HTMLElement} element - Element which needs to be stop the animation.
 * @param {AnimationOptions} model - Handling the animation model at stop function.
 * @returns {void}
 */
Animation.stop = (element: HTMLElement, model?: AnimationOptions) => {
    element.style.animation = '';
    element.removeAttribute('sf-animate');
    const animationId: string | null = element.getAttribute('sf-animation-id');
    if (animationId) {
        const frameId: number = parseInt(animationId, 10);
        cancelAnimationFrame(frameId);
        element.removeAttribute('sf-animation-id');
    }
    if (model && model.end) {
        model.end(model);
    }
};

/**
 * Set delay to animation element
 *
 * @param {AnimationOptions} model ?
 * @returns {void}
 */
Animation.delayAnimation = (model: AnimationOptions): void => {
    if (animationMode === 'Disable' || animationMode === GlobalAnimationMode.Disable) {
        if (model.begin) {
            model.begin(model);
        }
        if (model.end) {
            model.end(model);
        }
    } else {
        if (model.delay) {
            setTimeout(() => { Animation.applyAnimation(model); }, model.delay);
        } else {
            Animation.applyAnimation(model);
        }
    }
};

/**
 * Triggers animation
 *
 * @param {AnimationOptions} model ?
 * @returns {void}
 */
Animation.applyAnimation = (model: AnimationOptions): void => {
    model.timeStamp = 0;
    let step: number = 0;
    let timerId: number = 0;
    let prevTimeStamp: number = 0;
    const duration: number | null = model.duration || null;
    model.element.setAttribute('sf-animate', 'true');

    const startAnimation: (timeStamp?: number) => void = (timeStamp?: number): void => {
        try {
            if (timeStamp) {
                prevTimeStamp = prevTimeStamp === 0 ? timeStamp : prevTimeStamp;
                model.timeStamp = (timeStamp + (model.timeStamp || 0)) - prevTimeStamp;
                prevTimeStamp = timeStamp;

                if (!step && model.begin) {
                    model.begin(model);
                }

                step = step + 1;
                const avg: number = model.timeStamp / step;

                if (duration && model.timeStamp < duration && model.timeStamp + avg < duration && model.element && model.element.getAttribute('sf-animate')) {
                    model.element.style.animation = `${model.name} ${model.duration}ms ${model.timingFunction}`;
                    if (model.progress) {
                        model.progress(model);
                    }
                    requestAnimationFrame(startAnimation);
                } else {
                    cancelAnimationFrame(timerId);
                    model.element.removeAttribute('sf-animation-id');
                    model.element.removeAttribute('sf-animate');
                    model.element.style.animation = '';
                    if (model.end) {
                        model.end(model);
                    }
                }
            } else {
                timerId = requestAnimationFrame(startAnimation);
                model.element.setAttribute('sf-animation-id', timerId.toString());
            }
        } catch (e) {
            cancelAnimationFrame(timerId);
            model.element.removeAttribute('sf-animation-id');
            if (model.fail) {
                model.fail(e);
            }
        }
    };

    startAnimation();
};

/**
 * This method is used to enable or disable the animation for all components.
 *
 * @param {string|GlobalAnimationMode} value - Specifies the value to enable or disable the animation for all components. When set to 'enable', it enables the animation for all components, regardless of the individual component's animation settings. When set to 'disable', it disables the animation for all components, regardless of the individual component's animation settings.
 * @returns {void}
 */
export function setGlobalAnimation(value: string | GlobalAnimationMode): void {
    animationMode = value;
}

/**
 * Defines the global animation modes for all components.
 */
export enum GlobalAnimationMode {
    /**
     * Defines the global animation mode as Default. Animation is enabled or disabled based on the component's animation settings.
     */
    Default = 'Default',
    /**
     * Defines the global animation mode as Enable. Enables the animation for all components, regardless of the individual component's animation settings.
     */
    Enable = 'Enable',
    /**
     * Defines the global animation mode as Disable. Disables the animation for all components, regardless of the individual component's animation settings.
     */
    Disable = 'Disable'
}
