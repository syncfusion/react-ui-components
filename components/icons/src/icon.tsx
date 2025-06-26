import { HTMLAttributes, memo, SVGProps } from 'react';
import { SvgIcon } from './svg-icon';

/**
 * Type for the icon component
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
        width = 24,
        height = 24,
        viewBox = '0 0 24 24',
        className = '',
        ...otherProps
    }: HTMLAttributes<SVGElement | HTMLElement> & SVGProps<SVGSVGElement>) => {
        return (
            <SvgIcon
                width={typeof width === 'number' ? `${width}px` : width}
                height={typeof height === 'number' ? `${height}px` : height}
                viewBox={viewBox}
                className={`sf-icons ${className}`.trim()}
                {...otherProps}
            >
                {svgElements}
            </SvgIcon>

        );
    };
    return memo(IconComponent);
};
