import { ChartMarkerProps } from '../base/interfaces';

/**
 * @typedef ChartMarkerProps
 * @extends ChartMarkerProps
 * @property {React.ReactNode} [children] - Optional content to be rendered inside the marker
 * @private
 */
type ChartMarkerProperty = ChartMarkerProps & {
    children?: React.ReactNode
};

/**
 * @description Represents a marker in a chart series
 * @param {ChartMarkerProps} props - Properties for configuring the chart marker
 * @returns {JSX.Element} A React element that renders the marker with its children
 */
export const ChartMarker: React.FC<ChartMarkerProperty> = (props: ChartMarkerProperty) => {
    return <>{props.children}</>;
};
