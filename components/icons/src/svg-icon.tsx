import * as React from 'react';
import { HTMLAttributes, SVGProps } from 'react';

/**
 * Common icon props interface
 */
export interface IIcons {
    /**
     * Specifies the width of the icon.
     *
     * @default -
     */
    width?: number | string;

    /**
     * Specifies the height of the icon.
     *
     * @default -
     */
    height?: number | string;

    /**
     * Defines the SVG viewBox attribute which controls the visible area of the icon.
     *
     * @default "0 0 24 24"
     */
    viewBox?: string;

    /**
     * Sets the color of the SVG icon, can be any valid CSS color value.
     *
     * @default -
     */
    color?: string;

    /**
     * Additional CSS class names to apply to the icon component.
     *
     * @private
     */
    className?: string;
}

type SvgProps = HTMLAttributes<SVGElement | HTMLElement> & SVGProps<SVGSVGElement>;

/**
 * The SVG component displays SVG icons with a given height, width, and viewBox.
 *
 * @private
 * @param {SvgProps} props - The props of the component.
 * @returns {void} Returns the SVG element.
 */
export const SvgIcon: React.FC<SvgProps> = ((props: SvgProps) => {
    const {
        viewBox = '0 0 24 24',
        children,
        className = '',
        width = null,
        height = null,
        focusable = 'false',
        'aria-hidden': ariaHidden = true,
        ...restProps
    } = props;

    return (
        <svg
            {...restProps}
            className={`sf-icon ${(!width || !height) ? 'sf-icon-size' : ''} ${className}`.trim()}
            width={typeof width === 'number' ? `${width}px` : width}
            height={typeof height === 'number' ? `${height}px` : height}
            viewBox={viewBox}
            focusable = {focusable}
            aria-hidden = {ariaHidden}
        >
            {children}
        </svg>
    );
});

export default SvgIcon;
