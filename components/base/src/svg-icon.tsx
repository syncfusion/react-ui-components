import * as React from 'react';
import { HTMLAttributes, SVGProps } from 'react';

export interface IconProps {
    /**
     * Specifies the path data for the SVG icon.
     *
     * @default ''
     */
    d?: string;

    /**
     * Specifies the path fill color of the SVG icon.
     *
     * @default 'currentColor'
     */
    fill?: string;

    /**
     * Specifies the height of the SVG icon.
     *
     * @default -
     */
    height?: string;

    /**
     * Specifies the viewBox of the SVG icon.
     *
     * @default '0 0 24 24'
     */
    viewBox?: string;

    /**
     * Specifies the width of the SVG icon.
     *
     * @default -
     */
    width?: string;
}

type SvgProps = IconProps & HTMLAttributes<HTMLOrSVGElement> & SVGProps<SVGSVGElement>;

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
        fill = 'currentColor',
        className = '',
        width = null,
        height = null,
        focusable = 'false',
        'aria-hidden': ariaHidden = true,
        d = '',
        ...restProps
    } = props;

    return (<svg {...restProps}
        className={`sf-icon ${(!width || !height) ? 'sf-icon-size' : ''} ${className}`.trim()}
        focusable={focusable}
        aria-hidden={ariaHidden}
        height={height} width={width}
        viewBox={viewBox}>
        <path d={d} fill={fill}></path>
    </svg>
    );
});

export default SvgIcon;
