import { useMemo, useEffect, forwardRef, useImperativeHandle, useRef, useId } from 'react';
import { formatUnit, preRender, useProviderContext } from '@syncfusion/react-base';

/**
 * Defines the available variant types for skeleton loading placeholders.
 * These placeholder variants represent different UI elements during loading states.
 */
export enum Variants {
    /**
     * Represents a text line or paragraph placeholder with rounded corners,
     * suitable for displaying loading states for textual content.
     */
    Text = 'Text',

    /**
     * Represents a circular placeholder, suitable for avatars, profile pictures,
     * icons, or other circular UI elements.
     */
    Circle = 'Circle',

    /**
     * Represents a square placeholder with equal width and height,
     * suitable for buttons, icons, or thumbnails with 1:1 aspect ratio.
     */
    Square = 'Square',

    /**
     * Represents a rectangular placeholder with different width and height dimensions,
     * suitable for cards, images, buttons, or other non-square UI elements.
     */
    Rectangle = 'Rectangle'
}

/**
 * Enum representing the different shimmer animations for the skeleton.
 */
export enum AnimationType {
    /**
     * Animates a wave-like gradient that moves across the shimmer element,
     * creating a smooth flowing animation from one side to the other.
     */
    Wave = 'Wave',

    /**
     * Creates a fading opacity animation that alternates between more and less
     * visible states, providing a subtle pulsing animation.
     */
    Fade = 'Fade',

    /**
     * Applies a pulsing animation that changes the opacity or intensity of the
     * shimmer element in a rhythmic pattern.
     */
    Pulse = 'Pulse',

    /**
     * Disables animation effects, showing a static shimmer placeholder
     * without any movement or transition.
     */
    None = 'None'
}

/**
 * Props interface for the Skeleton component.
 */
export interface SkeletonProps {
    /**
     * Width of the skeleton element. Can be specified as a CSS-valid string (e.g., '100px', '50%')
     * or as a number of pixels.
     *
     * @default 'auto'
     */
    width?: string | number;

    /**
     * Height of the skeleton element. Can be specified as a CSS-valid string (e.g., '100px', '50%')
     * or as a number of pixels.
     *
     * @default 'auto'
     */
    height?: string | number;

    /**
     * Determines the variant of the skeleton element.
     * Can be one of the predefined types from Variants enum or a custom string value.
     *
     * @default Variants.Text
     */
    variant?: Variants;

    /**
     * The animation effect applied to the skeleton during loading state.
     * Can be one of the predefined effects from AnimationType enum or a custom string value.
     *
     * @default AnimationType.Wave
     */
    animation?: AnimationType;

    /**
     * Optional text label for the skeleton for accessibility or identification purposes.
     * This is typically not displayed visually but can be used for screen readers.
     *
     * @default -
     */
    label?: string;
}

export interface ISkeleton extends SkeletonProps {
    /**
     * This is Skeleton component element.
     *
     * @private
     * @default null
     */
    element?: HTMLDivElement | null;
}

type ISkeletonProps = SkeletonProps & Omit<React.InputHTMLAttributes<HTMLDivElement>, keyof SkeletonProps>;

/**
 * Skeleton component for displaying loading placeholders while content is being fetched.
 *
 * This component renders various variants that mimic the eventual content layout,
 * providing visual feedback to users during loading states. It supports different
 * variants, animations, and customization options to match your application's design.
 *
 * ```typescript
 * import { Skeleton, Variants } from "@syncfusion/react-notifications";
 *
 * <Skeleton variant={Variants.Circle} width={50} height={50} animation={AnimationType.Wave} />
 * ```
 */
export const Skeleton: React.ForwardRefExoticComponent<ISkeletonProps & React.RefAttributes<ISkeleton>> =
 forwardRef<ISkeleton, ISkeletonProps>((props: ISkeletonProps, ref: React.Ref<ISkeleton>) => {
     const {
         width = 'auto',
         height = 'auto',
         variant = Variants.Text,
         animation = AnimationType.Wave,
         label = 'Loading...',
         className = ''
     } = props;
     const id: string = `sf-skeleton_${useId()}`;
     const { dir } = useProviderContext();
     const getShapeClass: (variant: Variants) => string = (variant: Variants): string => {
         switch (variant) {
         case Variants.Circle: return 'sf-skeleton-circle';
         case Variants.Square: return 'sf-skeleton-square';
         case Variants.Rectangle: return 'sf-skeleton-rectangle';
         default: return 'sf-skeleton-text';
         }
     };

     const getEffectClass: (animation: AnimationType) => string = (animation: AnimationType): string => {
         switch (animation) {
         case AnimationType.Wave: return 'sf-skeleton-wave';
         case AnimationType.Fade: return 'sf-skeleton-fade';
         case AnimationType.Pulse: return 'sf-skeleton-pulse';
         default: return '';
         }
     };

     const classNames: string = useMemo(() => {
         const classes: string[] = ['sf-skeleton', getShapeClass(variant as Variants), getEffectClass(animation as AnimationType)];
         if (className) {classes.push(...className.split(' ')); }
         if (dir === 'rtl') { classes.push('sf-rtl'); }
         return classes.join(' ');
     }, [variant, animation, className]);

     const style: {
         width: string;
         height: string;
     } = useMemo(() => {
         const widthValue: string = (!width && [Variants.Text, Variants.Rectangle].includes(variant as Variants)) ? '100%' : formatUnit(width);
         const heightValue: string = [Variants.Circle, Variants.Square].includes(variant as Variants) ?
             widthValue : formatUnit(height);
         return {
             width: widthValue,
             height: heightValue
         };
     }, [width, height, variant]);

     //To expose a controlled API/handle instead of a raw DOM node.
     // To keep the public ref stable and typed (ISkeleton) while you manage an internal elementRef to the div.
     const elementRef: React.RefObject<HTMLDivElement | null> = useRef<HTMLDivElement>(null);

     const publicAPI: Partial<ISkeleton> = {
         width,
         height,
         variant,
         animation,
         label
     };

     useImperativeHandle(ref, (): ISkeleton => ({
         ...publicAPI as ISkeleton,
         element: elementRef.current
     }), [publicAPI]);

     useEffect(() => {
         preRender('skeleton');
     }, []);

     return (
         <div
             id={id}
             className={classNames}
             style={style}
             role="alert"
             aria-busy="true"
             aria-live="polite"
             aria-label={label}
             ref={elementRef}
         />
     );
 });

export default Skeleton;
