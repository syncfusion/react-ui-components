import { PathOptions } from '../../chart-area/chart-interfaces';



/**
 * Creates a PathOption object with the specified properties for marker rendering.
 *
 * @param {string} id - Unique identifier for the path element
 * @param {string} fill - Fill color of the path
 * @param {number} strokeWidth - Width of the stroke line
 * @param {string} stroke - Stroke color of the path
 * @param {number} opacity - Opacity value between 0 and 1
 * @param {string} strokeDasharray - SVG dash array pattern for the stroke
 * @param {string} d - SVG path data string
 * @returns {PathOptions} A complete path option configuration
 */
export const createMarkerPathOption: (
    id: string,
    fill: string,
    strokeWidth: number,
    stroke: string,
    opacity: number,
    strokeDasharray: string,
    d: string
) => PathOptions = (
    id: string,
    fill: string,
    strokeWidth: number,
    stroke: string,
    opacity: number,
    strokeDasharray: string,
    d: string
): PathOptions => {
    return {
        id,
        fill,
        stroke,
        strokeWidth,
        strokeDasharray,
        opacity,
        d
    };
};
