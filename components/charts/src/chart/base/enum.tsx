/**
 * Defines the possible orientations for an axis.
 * ```props
 * Horizontal :- Represents a horizontal axis.
 * Vertical :- Represents a vertical axis.
 * ```
 *
 * @private
 */
export type Orientation =
    'Horizontal' |
    'Vertical';

/**
 * Defines the position of ticks or labels relative to the axis line.
 * ```props
 * Inside :- Positions ticks or labels inside the axis line.
 * Outside :- Positions ticks or labels outside the axis line.
 * ```
 */
export type AxisLabelPosition =
    'Inside' |
    'Outside';

/**
 * Defines the action to take when axis labels intersect.
 * ```props
 * None :- Display all labels without any modification.
 * Hide :- Hide the label when it intersects.
 * Trim :- Trim the label text when it intersects.
 * Wrap :- Wrap the label text to the next line when it intersects.
 * MultipleRows :- Arrange labels in multiple rows when they intersect.
 * Rotate45 :- Rotate the label 45 degrees when it intersects.
 * Rotate90 :- Rotate the label 90 degrees when it intersects.
 * ```
 */
export type LabelIntersectMode =
    'None' |
    'Hide' |
    'Trim' |
    'Wrap' |
    'MultipleRows' |
    'Rotate45' |
    'Rotate90';

/**
 * Defines how axis labels are positioned relative to the tick marks.
 * ```props
 * BetweenTicks :- Render the label between the tick marks.
 * OnTicks :- Render the label directly on the tick marks.
 * ```
 */
export type LabelPlacement =
    'BetweenTicks' |
    'OnTicks';

/**
 * Defines the type of padding applied to the chart axis range.
 * ```props
 * Auto :- Automatically applies padding: 'Normal' for vertical axes and 'None' for horizontal axes.
 * None :- No padding is applied to the axis range.
 * Normal :- Applies standard padding based on range calculations.
 * Additional :- Adds one interval of the axis as padding to both the minimum and maximum values.
 * Round :- Rounds the axis range to the nearest value divisible by the interval.
 * ```
 */
export type ChartRangePadding =
    'Auto' |
    'None' |
    'Normal' |
    'Additional' |
    'Round';

/**
 * Defines how empty data points are handled in the chart.
 * ```props
 * Gap :- Displays empty points as gaps in the chart.
 * Zero :- Displays empty points with a value of zero.
 * Drop :- Ignores empty points during rendering.
 * Average :- Displays empty points using the average of the previous and next data points.
 * ```
 */
export type EmptyPointMode =
    'Gap' |
    'Zero' |
    'Drop' |
    'Average';

/**
 * Specifies the available types of chart series.
 * ```props
 * Line :- Represents a line series.
 * MultiColoredLine :- Represents a multicolored line series.
 * Column :- Represents a column series.
 * Area :- Represents an area series.
 * Bar :- Represents a bar series.
 * StackingColumn :- Represents a stacking column series.
 * StackingColumn100 :- Represents a 100% stacking column series.
 * StackingBar :- Represents a stacking bar series.
 * StackingBar100 :- Represents a 100% stacking Bar series.
 * StepLine :- Represents a step line series.
 * SplineArea :- Represents a spline area series.
 * Scatter :- Represents a scatter series.
 * Spline :- Represents a spline series.
 * StepArea :- Represents a step area series.
 * Bubble :- Represents a bubble series.
 * Candle :- Represents a candle series.
 * Hilo :- Represents a hilo series.
 * HiloOpenClose :- Represents a hiloOpenClose series.
 * RangeArea :- Represents a rangeArea series.
 * RangeColumn :- Represents a rangeColumn series.
 * StackingArea :- Represents a stacking area series.
 * StackingArea100 :- Represents a 100% stacking area series.
 * SplineRangeArea :- Represents a spline range area series.
 * ```
 */
export type ChartSeriesType =
    'Line' |
    'MultiColoredLine'|
    'Column' |
    'Area' |
    'Bar' |
    'StackingColumn' |
    'StackingColumn100'|
    'StackingBar' |
    'StackingBar100'|
    'StepLine' |
    'SplineArea' |
    'SplineRangeArea' |
    'Scatter' |
    'Spline' |
    'StepArea'|
    'Bubble' |
    'Candle' |
    'Hilo' |
    'HiloOpenClose'|
    'RangeArea'|
    'RangeColumn'|
    'StackingArea'|
    'StackingArea100';

/**
 * Specifies the position where the step begins in a step line series.
 * ```props
 * Left :- Steps begin from the left side of the second data point.
 * Right :- Steps begin from the right side of the first data point.
 * Center :- Steps begin between the data points.
 * ```
 */
export type StepPosition =
    'Left' |
    'Right' |
    'Center';

/**
 * Specifies how labels at the edges of the axis are handled.
 * ```props
 * None :- Displays edge labels without any adjustment.
 * Hide :- Hides the labels at the edges of the axis.
 * Shift :- Shifts the edge labels to avoid overlap or clipping.
 * ```
 */
export type EdgeLabelPlacement =
    'None' |
    'Hide' |
    'Shift';

/**
 * Represents the data type used for axis values.
 * ```props
 * Double :- Represents a numeric axis. Suitable for continuous numerical data.
 * DateTime :- Represents a DateTime axis. Used for time-based data.
 * Category :- Represents a category axis. Ideal for discrete categories or labels.
 * Logarithmic :- Represents a logarithmic axis. Useful for data with exponential scale.
 * ```
 */
export type AxisValueType =
    'Double' |
    'DateTime' |
    'Category' |
    'Logarithmic';

/**
 * Defines the actions to take when data labels intersect.
 * ```props
 * None :- Displays all labels without modification.
 * Hide :- Hides the label when it intersects.
 * Rotate90 :- Rotates the label 90 degrees when it intersects.
 * ```
 */
export type DataLabelIntersectMode =
    'None' |
    'Hide' |
    'Rotate90';

/**
 * Specifies the position options for labels in the chart.
 * ```props
 * Outer :- Positions the label outside the data point.
 * Top :- Positions the label on top of the data point.
 * Bottom :- Positions the label below the data point.
 * Middle :- Positions the label at the center of the data point.
 * Auto :- Automatically positions the label based on the series type.
 * ```
 */
export type LabelPosition =
    'Outer' |
    'Top' |
    'Bottom' |
    'Middle' |
    'Auto';

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
 * Image :- Renders a custom image as the legend shape.
 * ```
 */
export type LegendShape =
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
    'Image';


/**
 * Defines the shapes available for chart markers.
 * ```props
 * Circle :- Specifies the marker shape as a circle.
 * Rectangle :- Specifies the marker shape as a rectangle.
 * Triangle :- Specifies the marker shape as a triangle.
 * Diamond :- Specifies the marker shape as a diamond.
 * Cross :- Specifies the marker shape as a cross.
 * Plus :- Specifies the marker shape as a plus symbol.
 * HorizontalLine :- Specifies the marker shape as a horizontal line.
 * VerticalLine :- Specifies the marker shape as a vertical line.
 * Pentagon :- Specifies the marker shape as a pentagon.
 * InvertedTriangle :- Specifies the marker shape as an inverted triangle.
 * Image :- Specifies the marker shape as an image.
 * Star :- Specifies the marker shape as a star.
 * None :- Disables the marker by not rendering any shape.
 * ```
 */
export type ChartMarkerShape =
    'Circle' |
    'Rectangle' |
    'Triangle' |
    'Diamond' |
    'Cross' |
    'Plus' |
    'HorizontalLine' |
    'VerticalLine' |
    'Pentagon' |
    'InvertedTriangle' |
    'Image' |
    'Star' |
    'None';

/**
 * Defines the set of interactive tools available in the chart's zooming toolbar.
 * ```props
 * ZoomIn :- Displays a tool that allows users to zoom into the chart.
 * ZoomOut :- Displays a tool that allows users to zoom out of the chart.
 * Pan :- Enables panning across the chart by dragging.
 * Reset :- Resets the chart view to its original state.
 * ```
 */
export type ToolbarItems =
    'ZoomIn' |
    'ZoomOut' |
    'Pan' |
    'Reset';

/**
 * Specifies the zooming mode for the chart.
 * ```props
 * XY :- Zooms both the horizontal (X) and vertical (Y) axes.
 * X :- Zooms only the horizontal (X) axis.
 * Y:- Zooms only the vertical (Y) axis.
 * ```
 */
export type ZoomMode =
    'XY' |
    'X' |
    'Y';

/**
 * Specifies the selection mode for chart elements.
 * ```props
 * * None :- Disables selection.
 * * Series :- Allows selecting an entire series.
 * * Point :- Allows selecting an individual data point.
 * * Cluster :- Allows selecting a cluster of points.
 * ```
 */
export type SelectionMode =
    'None' |
    'Series' |
    'Point' |
    'Cluster';

/**
 * Specifies the pattern used for highlighting or selecting chart elements.
 *
 * ```props
 * * None :- No highlighting or selection pattern.
 * * Chessboard :- Applies a chessboard pattern.
 * * Dots :- Applies a dotted pattern.
 * * DiagonalForward :- Applies a diagonal forward pattern
 * * Crosshatch :- Applies a crosshatch pattern.
 * * Pacman :- Applies a pacman-style pattern.
 * * Diagonalbackward :- Applies a diagonal backward pattern.
 * * Grid :- Applies a grid pattern.
 * * Turquoise :- Applies a turquoise pattern.
 * * Star :- Applies a star pattern.
 * * Triangle :- Applies a triangle pattern.
 * * Circle :- Applies a circle pattern.
 * * Tile :- Applies a tile pattern.
 * * Horizontaldash :- Applies a vertical dash pattern.
 * * Verticaldash :- Applies a rectangle pattern.
 * * Rectangle :- Applies a box pattern.
 * * Box :- Applies a vertical stripe pattern.
 * * Verticalstripe :- Applies a vertical stripe pattern.
 * * Horizontalstripe :- Applies a horizontal stripe pattern.
 * * Bubble :- Applies a bubble pattern.
 * ```
 */
export type SelectionPattern =
    'None' |
    'Chessboard' |
    'Dots' |
    'DiagonalForward' |
    'Crosshatch' |
    'Pacman' |
    'DiagonalBackward' |
    'Grid' |
    'Turquoise' |
    'Star' |
    'Triangle' |
    'Circle' |
    'Tile' |
    'HorizontalDash' |
    'VerticalDash' |
    'Rectangle' |
    'Box' |
    'VerticalStripe' |
    'HorizontalStripe' |
    'Bubble';

/**
 * Specifies the type of spline used for rendering.
 * ```props
 * Natural :- Renders a natural spline.
 * Monotonic :- Renders a monotonic spline.
 * Cardinal :- Renders a cardinal spline.
 * Clamped :- Renders a clamped spline.
 * ```
 */
export type SplineType =
    'Natural' |
    'Monotonic' |
    'Cardinal' |
    'Clamped';

/**
 * Specifies the interval type for a datetime axis.
 * ```props
 * Auto :- Automatically determines the interval based on the data.
 * Years :- Sets the interval in years.
 * Months :- Sets the interval in months.
 * Days :- Sets the interval in days.
 * Hours :- Sets the interval in hours.
 * Minutes :- Sets the interval in minutes.
 * Seconds :- Sets the interval in seconds.
 * ```
 */
export type IntervalType =
    'Auto' |
    'Years' |
    'Months' |
    'Days' |
    'Hours' |
    'Minutes' |
    'Seconds';

/**
 * Specifies the types of skeleton formats available for date and time formatting.
 * ```props
 * Date :- Formats only the date.
 * DateTime :- Formats both date and time.
 * Time :- Formats only the time.
 * ```
 */
export type SkeletonType =
    'Date' |
    'DateTime' |
    'Time';

/**
 * Defines the unit of strip line size.
 * ```props
 * Auto :- In numeric axis, it will consider a number and DateTime axis, it will consider as milliseconds.
 * Pixel :- The stripline gets their size in pixel.
 * Years :- The stripline size is based on year in the DateTime axis.
 * Months :- The stripline size is based on month in the DateTime axis.
 * Days :- The stripline size is based on day in the DateTime axis.
 * Hours :- The stripline size is based on hour in the DateTime axis.
 * Minutes :- The stripline size is based on minutes in the DateTime axis.
 * Seconds:- The stripline size is based on seconds in the DateTime axis.
 * ```
 */
export type StripLineSizeUnit =
    'Auto' |
    'Pixel' |
    'Years' |
    'Months' |
    'Days' |
    'Hours' |
    'Minutes' |
    'Seconds';

/**
 *  Specifies the order of the strip line.
 * ```props
 * Over :- Places the strip line over the series elements.
 * Behind :- Places the strip line behind the series elements.
 * ```
 */
export type ZIndex =
    'Over' |
    'Behind';

/**
 * Specifies the display mode for crosshair lines in the chart. They are:
 * ```props
 * Both :- Displays both vertical and horizontal crosshair lines.
 * Vertical :- Displays only the vertical crosshair line.
 * Horizontal :- Displays only the horizontal crosshair line.
 * ```
 */
export type CrosshairLineType =
    'Both' |
    'Vertical' |
    'Horizontal';

/**
 * Defines series type of chart. They are
 * ```props
 * XY :- Represents XY type series.
 * HighLow :- Represents HighLow type series.
 * HighLowOpenClose :- Represents HLOC type series.
 * ```
 *
 *  @private
 */
export type SeriesValueType =
    'XY' |
    'HighLow' |
    'HighLowOpenClose';

/**
 * Specifies the coordinate unit type for chart annotations. They are:
 * ```props
 * Pixel :- Positions annotations using pixel values relative to the chart container.
 * Point :- Positions annotations using axis values relative to chart data points.
 * ```
 */
export type AnnotationCoordinateUnit =
    'Pixel' |
    'Point';

/**
 * Specifies the type of error bar to be rendered in the chart.
 * Available options are:
 * ```props
 * * Percentage :- Renders an error bar based on percentage.
 * * StandardDeviation :- Renders an error bar using standard deviation.
 * * StandardError :- Renders an error bar using standard error.
 * * Custom :-  Renders a custom-defined error bar.
 * ```
 */
export type ErrorBarType =
    'Percentage' |
    'StandardDeviation' |
    'StandardError' |
    'Custom';
