
/**
 * Specifies the available modes for grouping points in a pie chart.
 * ```props
 * Point :- Groups the selected points together into a single slice.
 * Value :- Groups all points whose values are less than the specified threshold into a single slice.
 * ```
 */
export type GroupModes =
    'Point' |
    'Value';

/**
 * Specifies how empty data points should be rendered in a pie chart.
 * ```props
 * Zero :- Treats empty points as having a value of zero and renders them as a slice with zero size.
 * Drop :- Completely ignores empty points and excludes them from the chart rendering.
 * Average :- Calculates the value of empty points as the average of the previous and next data points.
 * ```
 */
export type PieEmptyPointMode =
    'Zero' |
    'Drop' |
    'Average';

/**
 * Defines the available positions for data labels in a pie chart series.
 * ```props
 * Inside :- Places the data label inside the corresponding pie slice.
 * Outside :- Places the data label outside the pie slice, typically connected with a line.
 * ```
 */
export type PieLabelPosition =
    'Inside' |
    'Outside';

/**
 * Defines the style of connector lines used for data labels in a pie chart.
 * ```props
 * Line :- Renders the connector as a straight line from the slice to the label.
 * Curve :- Renders the connector as a smooth curved line for a more elegant appearance.
 * ```
 */
export type ConnectorType =
    'Line' |
    'Curve';

/**
 * Defines the shapes available for legend items in the chart.
 * ```props
 * Circle :- Renders a circular legend shape.
 * Rectangle :-Renders a rectangular legend shape.
 * Triangle :- Renders a triangular legend shape.
 * Diamond :- Renders a diamond-shaped legend.
 * Cross :- Renders a cross-shaped legend.
 * HorizontalLine :- Renders a horizontal line as the legend shape.
 * VerticalLine :- Renders a vertical line as the legend shape.
 * Pentagon :- Renders a pentagon-shaped legend.
 * InvertedTriangle :- Renders an inverted triangle shape.
 * SeriesType :- Uses the shape based on the series type.
 * Plus :- Renders a plus (+) symbol as the legend shape.
 * Star :- Renders a star-shaped legend.
 * Image :- Renders a custom image as the legend shape.
 * ```
 */
export type PieLegendShape =
    'Circle' |
    'Rectangle' |
    'Triangle' |
    'Diamond' |
    'Cross' |
    'HorizontalLine' |
    'VerticalLine' |
    'Pentagon' |
    'InvertedTriangle' |
    'SeriesType' |
    'Plus' |
    'Star' |
    'Image';

/**
 * Specifies the alignment of the legend within its container.
 * ```props
 * Left :- Aligns to start for horizontal positions (Top/Bottom/Auto).
 * Top :- Aligns to top for vertical positions (Left/Right).
 * Center :- Aligns to the center of the container.
 * Bottom :- Aligns to bottom for vertical positions (Left/Right).
 * Right :- Aligns to end for horizontal positions (Top/Bottom/Auto).
 * ```
 */
export type LegendAlignment = 'Left' | 'Top' | 'Center' | 'Bottom' | 'Right';
