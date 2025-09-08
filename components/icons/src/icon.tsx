import { HTMLAttributes, memo, SVGProps } from 'react';
import { SvgIcon } from './svg-icon';

/**
 * Type for the icon component
 *
 * @private
 */
export type IconComponent = React.FC<HTMLAttributes<SVGElement | HTMLElement> & SVGProps<SVGSVGElement>>;

/**
 * Type definition for the icon creator function
 * Represents a function that creates a memoized icon component from an SVG path
 *
 * @param path - The SVG path data string
 * @returns A memoized React component that renders the icon
 */
type IconGenerator = (svgElements: React.ReactNode
) => React.NamedExoticComponent<HTMLAttributes<SVGElement | HTMLElement> & SVGProps<SVGSVGElement>>;

/**
 * Base icon component creator function creates a reusable icon component from an SVG path.
 *
 * @param {string} svgElements - The SVG path data string
 * @returns {IconComponent} A memoized React functional component
 */
export const createIcon: IconGenerator = (svgElements: React.ReactNode) => {
    const IconComponent: React.FC<HTMLAttributes<SVGElement | HTMLElement> & SVGProps<SVGSVGElement>> = ({
        viewBox = '0 0 24 24',
        ...otherProps
    }: HTMLAttributes<SVGElement | HTMLElement> & SVGProps<SVGSVGElement>) => {
        return (
            <SvgIcon
                viewBox={viewBox}
                {...otherProps}
            >
                {svgElements}
            </SvgIcon>

        );
    };
    return memo(IconComponent);
};
