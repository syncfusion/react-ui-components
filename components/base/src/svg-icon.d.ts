import * as React from 'react';
import { HTMLAttributes } from 'react';
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
     * @default ''
     */
    fill?: string;
    /**
     * Specifies the height of the SVG icon.
     *
     * @default '16'
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
     * @default '16'
     */
    width?: string;
}
type SvgProps = IconProps & HTMLAttributes<HTMLOrSVGElement>;
/**
 * The SVG component displays SVG icons with a given height, width, and viewBox.
 *
 * @private
 * @param {SvgProps} props - The props of the component.
 * @returns {void} Returns the SVG element.
 */
export declare const SvgIcon: React.FC<SvgProps>;
export default SvgIcon;
