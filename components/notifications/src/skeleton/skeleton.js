import { jsx as _jsx } from "react/jsx-runtime";
import { useState, useMemo, useEffect, forwardRef } from 'react';
import { getUniqueID, formatUnit, preRender } from '@syncfusion/react-base';
/**
 * Defines the available variant types for skeleton loading placeholders.
 * These placeholder variants represent different UI elements during loading states.
 */
export var Variants;
(function (Variants) {
    /**
     * Represents a text line or paragraph placeholder with rounded corners,
     * suitable for displaying loading states for textual content.
     */
    Variants["Text"] = "Text";
    /**
     * Represents a circular placeholder, suitable for avatars, profile pictures,
     * icons, or other circular UI elements.
     */
    Variants["Circle"] = "Circle";
    /**
     * Represents a square placeholder with equal width and height,
     * suitable for buttons, icons, or thumbnails with 1:1 aspect ratio.
     */
    Variants["Square"] = "Square";
    /**
     * Represents a rectangular placeholder with different width and height dimensions,
     * suitable for cards, images, buttons, or other non-square UI elements.
     */
    Variants["Rectangle"] = "Rectangle";
})(Variants || (Variants = {}));
/**
 * Enum representing the different shimmer animations for the skeleton.
 */
export var AnimationType;
(function (AnimationType) {
    /**
     * Animates a wave-like gradient that moves across the shimmer element,
     * creating a smooth flowing animation from one side to the other.
     */
    AnimationType["Wave"] = "Wave";
    /**
     * Creates a fading opacity animation that alternates between more and less
     * visible states, providing a subtle pulsing animation.
     */
    AnimationType["Fade"] = "Fade";
    /**
     * Applies a pulsing animation that changes the opacity or intensity of the
     * shimmer element in a rhythmic pattern.
     */
    AnimationType["Pulse"] = "Pulse";
    /**
     * Disables animation effects, showing a static shimmer placeholder
     * without any movement or transition.
     */
    AnimationType["None"] = "None";
})(AnimationType || (AnimationType = {}));
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
export const Skeleton = forwardRef((props, ref) => {
    const { width = 'auto', height = 'auto', variant = Variants.Text, animation = AnimationType.Wave, label = 'Loading...', className = '' } = props;
    const [id] = useState(() => getUniqueID('sf-skeleton'));
    const getShapeClass = (variant) => {
        switch (variant) {
            case Variants.Circle: return 'sf-skeleton-circle';
            case Variants.Square: return 'sf-skeleton-square';
            case Variants.Rectangle: return 'sf-skeleton-rectangle';
            default: return 'sf-skeleton-text';
        }
    };
    const getEffectClass = (animation) => {
        switch (animation) {
            case AnimationType.Wave: return 'sf-shimmer-wave';
            case AnimationType.Fade: return 'sf-shimmer-fade';
            case AnimationType.Pulse: return 'sf-shimmer-pulse';
            default: return '';
        }
    };
    const classNames = useMemo(() => {
        const classes = ['sf-skeleton', getShapeClass(variant), getEffectClass(animation)];
        if (className) {
            classes.push(...className.split(' '));
        }
        return classes.join(' ');
    }, [variant, animation, className]);
    const style = useMemo(() => {
        const widthValue = (!width && [Variants.Text, Variants.Rectangle].includes(variant)) ? '100%' : formatUnit(width);
        const heightValue = [Variants.Circle, Variants.Square].includes(variant) ?
            widthValue : formatUnit(height);
        return {
            width: widthValue,
            height: heightValue
        };
    }, [width, height, variant]);
    useEffect(() => {
        preRender('skeleton');
    }, []);
    return (_jsx("div", { id: id, className: classNames, style: style, role: "alert", "aria-busy": "true", "aria-live": "polite", "aria-label": label, ref: ref }));
});
export default Skeleton;
