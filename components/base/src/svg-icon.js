import { jsx as _jsx } from "react/jsx-runtime";
/**
 * The SVG component displays SVG icons with a given height, width, and viewBox.
 *
 * @private
 * @param {SvgProps} props - The props of the component.
 * @returns {void} Returns the SVG element.
 */
export const SvgIcon = ((props) => {
    const { height = '16', viewBox = '0 0 24 24', width = '16', fill, d = '', ...restProps } = props;
    return (_jsx("svg", { ...restProps, height: height, viewBox: viewBox, width: width, children: _jsx("path", { d: d, fill: fill }) }));
});
export default SvgIcon;
