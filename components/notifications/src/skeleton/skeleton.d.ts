/**
 * Defines the available variant types for skeleton loading placeholders.
 * These placeholder variants represent different UI elements during loading states.
 */
export declare enum Variants {
    /**
     * Represents a text line or paragraph placeholder with rounded corners,
     * suitable for displaying loading states for textual content.
     */
    Text = "Text",
    /**
     * Represents a circular placeholder, suitable for avatars, profile pictures,
     * icons, or other circular UI elements.
     */
    Circle = "Circle",
    /**
     * Represents a square placeholder with equal width and height,
     * suitable for buttons, icons, or thumbnails with 1:1 aspect ratio.
     */
    Square = "Square",
    /**
     * Represents a rectangular placeholder with different width and height dimensions,
     * suitable for cards, images, buttons, or other non-square UI elements.
     */
    Rectangle = "Rectangle"
}
/**
 * Enum representing the different shimmer animations for the skeleton.
 */
export declare enum AnimationType {
    /**
     * Animates a wave-like gradient that moves across the shimmer element,
     * creating a smooth flowing animation from one side to the other.
     */
    Wave = "Wave",
    /**
     * Creates a fading opacity animation that alternates between more and less
     * visible states, providing a subtle pulsing animation.
     */
    Fade = "Fade",
    /**
     * Applies a pulsing animation that changes the opacity or intensity of the
     * shimmer element in a rhythmic pattern.
     */
    Pulse = "Pulse",
    /**
     * Disables animation effects, showing a static shimmer placeholder
     * without any movement or transition.
     */
    None = "None"
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
 * <Skeleton type={SkeletonType.Circle} width={50} height={50} animation={AnimationType.Wave} />
 * ```
 */
export declare const Skeleton: React.ForwardRefExoticComponent<ISkeletonProps & React.RefAttributes<ISkeleton>>;
export default Skeleton;
