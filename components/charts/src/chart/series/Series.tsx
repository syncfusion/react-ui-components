/**
 * @module Chart/Series
 */
import * as React from 'react';
import { useContext, useEffect, useRef } from 'react';
import { ChartDataLabelProps, ChartMarkerProps, ChartSeriesProps, SeriesProps, ChartErrorBarProps } from '../base/interfaces';
import { ChartContext } from '../layout/ChartProvider';
import { defaultChartConfigs } from '../base/default-properties';
import { ChartMarker } from './Marker';
import { ChartErrorBar } from './ErrorBar';
import { SeriesProperties } from '../chart-area/chart-interfaces';

/**
 * Creates a replacer function for JSON.stringify that handles circular references.
 * Uses a WeakSet to track seen objects and avoid serializing circular structures.
 *
 * @returns {function} A replacer function that can be used with JSON.stringify.
 * @private
 */
export function getCircularReplacer(): (key: string, value: object | string | number | boolean | null) =>
     object | string | number | boolean | null | undefined {
    const seen: WeakSet<object> = new WeakSet();
    return function (_key: string, value: object | string | number | boolean | null):
     object | string | number | boolean | null | undefined {
        if (typeof value === 'object' && value !== null) {
            if (seen.has(value)) {
                return '[Circular]';
            }
            seen.add(value);
        }
        // Don't try serializing React elements (too complex)
        if (value && typeof value === 'object' && (
            ('$$typeof' in value) ||
            ('_owner' in value))
        ) {
            return undefined;
        }
        return value;
    };
}

/**
 * Map used to track visited objects for circular reference detection during JSON serialization.
 *
 * @private
 * @type {Map<object, boolean>}
 */
export const visited: Map<object, boolean> = new Map();

/**
 * Provides a function that returns a JSON replacer function to handle circular references.
 * Used when serializing complex objects to prevent circular reference errors.
 *
 * @returns {Function} A function that detects and handles circular references in objects during JSON serialization.
 * @private
 */
export const replacerFunc: () => (key: string, value: object | string | number | boolean | null) =>
    object | string | number | boolean | null | undefined = () => {
    return (_key: string, value: object | string | number | boolean | null) => {
        if (typeof value === 'object' && value !== null) {
            if (visited.has(value)) {
                return '[Circular]';
            }
            return;
        }
        return value;
    };
};

/**
 * Interface defining the chart context type used for communication between chart components.
 *
 * @private
 */
interface ChartContextType {
    /**
     * Function to update the series collection in the chart.
     *
     * @param series - Array of series models to be rendered in the chart.
     * @private
     */
    setChartSeries: (series: ChartSeriesProps[]) => void;
}

/**
 * Component that manages a collection of chart series and transforms them into the format expected by the chart rendering engine.
 * This component processes its children (individual ChartSeries components), extracts their properties,
 * and passes the processed series data to the chart context.
 *
 * @param {SeriesProps} props - The properties for the series collection component.
 * @returns {React.ReactElement|null} A React component that processes series definitions or null.
 */
export const ChartSeriesCollection: React.FC<SeriesProps> = (props: SeriesProps) => {
    const context: ChartContextType | null = useContext(ChartContext);
    const previousSeriesRef: React.RefObject<ChartSeriesProps[]> = useRef<ChartSeriesProps[]>([]);
    const childArray: React.ReactNode[] = React.Children.toArray(props.children);

    /**
     * Extracts a specific property from all chart series children and returns it as a JSON string.
     * Used to track changes in specific series properties for dependency arrays in useEffect.
     *
     * @param {React.ReactNode[]} children - Array of React children nodes to process.
     * @param {string} propertyName - Name of the property to extract from each series.
     * @returns {string} JSON string representation of the extracted property values.
     */
    const extractProperty: (children: React.ReactNode[], propertyName: string) => string = (
        children: React.ReactNode[],
        propertyName: string
    ): string => JSON.stringify(children.map((child: React.ReactNode) =>
        React.isValidElement(child) && child.type === ChartSeries
            ? (child.props as ChartSeriesProperty)[propertyName as keyof ChartSeriesProperty]
            : null
    ));

    // Extract commonly changed properties from series for dependency tracking
    const dataSourcesSignature: string = extractProperty(childArray, 'dataSource');
    const fill: string = extractProperty(childArray, 'fill');
    const width: string = extractProperty(childArray, 'width');
    const dashArray: string = extractProperty(childArray, 'dashArray');
    const opacity: string = extractProperty(childArray, 'opacity');
    const visible: string = extractProperty(childArray, 'visible');
    const splineType: string = extractProperty(childArray, 'splineType');
    const legendShape: string = extractProperty(childArray, 'legendShape');
    const pointColorMapping: string = extractProperty(childArray, 'pointColorMapping');

    /**
     * Extracts primitive properties from an object, ignoring objects, functions, and the 'children' property.
     * Used to get simple property values from component props.
     *
     * @param {ChartSeriesProperty} obj - The source object to extract properties from.
     * @returns {Partial<ChartSeriesProperty>} A new object containing only the primitive properties from the source object.
     */
    function pickPrimitiveProps(obj: ChartSeriesProperty): Partial<ChartSeriesProperty> {
        const copy: Partial<ChartSeriesProperty> = {};
        for (const [key, val] of Object.entries(obj)) {
            if (key === 'children') { continue; }
            if (typeof val !== 'object' && typeof val !== 'function') {
                (copy as Record<string, string | number | boolean>)[key as string] = val as string | number | boolean;
            }
        }
        return copy;
    }

    /**
     * String representation of marker configurations for all series.
     * Used to track changes in marker properties for dependency arrays in useEffect.
     */
    const markerSignature: string = JSON.stringify(
        childArray.map((child: React.ReactNode) => {
            if (
                React.isValidElement(child) &&
                child.type === ChartSeries &&
                (child.props as ChartSeriesProperty).children
            ) {
                let mSignature: Partial<ChartSeriesProperty> = {};
                React.Children.forEach(
                    (child.props as ChartSeriesProperty).children,
                    (markerChild: React.ReactNode) => {
                        if (React.isValidElement(markerChild) && markerChild.type === ChartMarker) {
                            mSignature = {
                                ...mSignature,
                                ...pickPrimitiveProps(markerChild.props as ChartSeriesProperty)
                            };
                        }
                    }
                );
                return mSignature;
            }
            return null;
        })
    );

    // String representation of error bar configurations for all series.
    const errorBarSignature: string = JSON.stringify(
        childArray.map((child: React.ReactNode) => {
            if (
                React.isValidElement(child) &&
                child.type === ChartSeries &&
                (child.props as ChartSeriesProperty).children
            ) {
                let eSignature: Partial<ChartSeriesProperty> = {};
                React.Children.forEach(
                    (child.props as ChartSeriesProperty).children,
                    (c: React.ReactNode) => {
                        if (React.isValidElement(c)) {
                            const type: React.ElementType = c.type as React.ElementType<keyof React.JSX.IntrinsicElements>;
                            const isNamedComponent: boolean =
                                (typeof type === 'function') &&
                                ('displayName' in type) &&
                                ((type as { displayName?: string }).displayName === 'ChartErrorBar');
                            if (c.type === ChartErrorBar || isNamedComponent) {
                                eSignature = {
                                    ...eSignature,
                                    ...pickPrimitiveProps(c.props as ChartSeriesProperty)
                                };
                            }
                        }
                    }
                );
                return eSignature;
            }
            return null;
        })
    );

    /**
     * Extracts and processes the series array from child components.
     * This core method transforms React component hierarchy into a data structure
     * that can be consumed by the chart rendering engine.
     * @private
     * @returns {Series[]} Array of processed Series objects ready for rendering.
     */
    const getSeriesArray: () => ChartSeriesProps[] = (): ChartSeriesProps[] => {
        return childArray
            .map((child: React.ReactNode) => {
                if (!React.isValidElement(child) || child.type !== ChartSeries) { return null; }

                const seriesProps: ChartSeriesProps | SeriesProperties = {
                    ...defaultChartConfigs.ChartSeries,
                    ...(child.props as ChartSeriesProperty),
                    ...defaultChartConfigs.ChartSeries
                } as ChartSeriesProps;

                // Get user props from the child
                const childProps: ChartSeriesProperty = child.props as ChartSeriesProperty;

                // Deep merge for border property to maintain default values
                if (childProps.border && defaultChartConfigs.ChartSeries.border) {
                    seriesProps.border = {
                        ...defaultChartConfigs.ChartSeries.border,
                        ...childProps.border
                    };
                    const { border, ...restProps } = childProps;
                    Object.assign(seriesProps, restProps);
                } else if (childProps.animation && defaultChartConfigs.ChartSeries.animation) {
                    seriesProps.animation = {
                        ...defaultChartConfigs.ChartSeries.animation,
                        ...childProps.animation
                    };
                    const { animation, ...restProps } = childProps;
                    Object.assign(seriesProps, restProps);
                } else {
                    Object.assign(seriesProps, childProps);
                }

                // Process marker and data label configuration
                React.Children.forEach(
                    (child.props as ChartSeriesProperty).children,
                    (seriesChild: React.ReactNode) => {
                        if (React.isValidElement(seriesChild) && seriesChild.type === ChartMarker) {
                            const { children: markerChildren, ...markerProps } = seriesChild.props as ChartSeriesProperty;

                            const markerConfig: ChartMarkerProps = {
                                ...defaultChartConfigs.ChartSeries.marker,
                                ...markerProps
                            } as ChartMarkerProps;

                            React.Children.forEach(markerChildren, (dataLabelChild: React.ReactNode) => {
                                if (React.isValidElement(dataLabelChild)) {
                                    const type: React.ElementType = dataLabelChild.type as
                                    React.ElementType<keyof React.JSX.IntrinsicElements>;

                                    const isNamedComponent: boolean =
                                        (typeof type === 'function') &&
                                        ('displayName' in type) &&
                                        ((type as { displayName?: string }).displayName === 'ChartDataLabel');

                                    if (isNamedComponent) {
                                        markerConfig.dataLabel = {
                                            ...defaultChartConfigs.ChartSeries.marker?.dataLabel,
                                            ...(dataLabelChild.props as ChartDataLabelProps)
                                        };
                                        markerConfig.dataLabel.font = {
                                            ...defaultChartConfigs.ChartSeries.marker?.dataLabel?.font,
                                            ...((dataLabelChild.props as ChartDataLabelProps).font)
                                        };
                                    }
                                }
                            });

                            seriesProps.marker = markerConfig;
                        }

                        // Process error bar configuration
                        if (React.isValidElement(seriesChild)) {
                            const type: React.ElementType = seriesChild.type as React.ElementType<keyof React.JSX.IntrinsicElements>;
                            const isErrorBarNamed: boolean =
                                (typeof type === 'function') &&
                                ('displayName' in type) &&
                                ((type as { displayName?: string }).displayName === 'ChartErrorBar');

                            if (seriesChild.type === ChartErrorBar || isErrorBarNamed) {
                                const errorBarProps: ChartErrorBarProps = seriesChild.props as ChartErrorBarProps;
                                const defaultErrorBar: ChartErrorBarProps | undefined =
                                    (defaultChartConfigs.ChartSeries as Partial<SeriesProperties>)
                                        .errorBar as ChartErrorBarProps | undefined;
                                // Deep-merge to ensure nested errorBarCap properties fall back to defaults
                                const mergedErrorBar: ChartErrorBarProps = {
                                    ...(defaultErrorBar || {}),
                                    ...errorBarProps,
                                    errorBarCap: {
                                        ...(defaultErrorBar?.errorBarCap || {}),
                                        ...(errorBarProps?.errorBarCap || {})
                                    }
                                };
                                (seriesProps as SeriesProperties).errorBar = mergedErrorBar as ChartErrorBarProps;
                            }
                        }
                    }
                );

                // Create a clean copy without internal properties
                const seriesCopy: ChartSeriesProps = { ...seriesProps };
                delete (seriesCopy as Record<string, string | number | boolean | object>).chart;
                delete (seriesCopy as Record<string, string | number | boolean | object>).series;
                delete (seriesCopy as Record<string, string | number | boolean | object>).points;

                return seriesCopy;
            })
            .filter((s: ChartSeriesProps | null): s is ChartSeriesProps => s !== null);
    };

    /**
     * Creates a deep signature of all series components, their properties, and nested children.
     * This signature is used to determine when the series configuration has fundamentally changed
     * and needs to be reprocessed.
     */
    const deepSignature: string = JSON.stringify(
        childArray.map((child: React.ReactNode) => {
            if (!React.isValidElement(child)) { return null; }
            const typeName: string = typeof child.type === 'string'
                ? child.type
                : ((child.type as { name: string }).name);
            const seriesPropsSignature: ChartSeriesProperty | SeriesProperties =
                typeof child.props === 'object' && child.props !== null
                    ? { ...(child.props as ChartSeriesProperty) }
                    : {} as ChartSeriesProperty;
            // If this is a ChartSeries, check for marker & dataLabel children
            if (child.type === ChartSeries) {
                React.Children.forEach(
                    (child.props as { children?: React.ReactNode }).children,
                    (seriesChild: React.ReactNode) => {
                        if (React.isValidElement(seriesChild) && seriesChild.type === ChartMarker) {
                            const markerProps: ChartMarkerProps = { ...seriesChild.props as ChartMarkerProps };
                            // Look for a ChartDataLabel inside marker
                            if ((seriesChild.props as ChartSeriesProperty).children) {
                                React.Children.forEach(
                                    (seriesChild.props as ChartSeriesProperty).children,
                                    (dlChild: React.ReactNode) => {
                                        if (React.isValidElement(dlChild)) {
                                            const type: React.ElementType =
                                            dlChild.type as React.ElementType<keyof React.JSX.IntrinsicElements>;
                                            const isNamedComponent: boolean =
                                                (typeof type === 'function') &&
                                                ('displayName' in type) &&
                                                ((type as { name: string }).name === 'ChartDataLabel');
                                            if (isNamedComponent) {
                                                markerProps.dataLabel = dlChild.props as ChartDataLabelProps;
                                            }
                                        }
                                    }
                                );
                            }
                            seriesPropsSignature.marker = markerProps;
                        }

                        // Capture error bar props in deep signature
                        if (React.isValidElement(seriesChild)) {
                            const type: React.ElementType = seriesChild.type as React.ElementType<keyof React.JSX.IntrinsicElements>;
                            const isErrorBarNamed: boolean =
                                (typeof type === 'function') &&
                                ('displayName' in type) &&
                                ((type as { displayName?: string }).displayName === 'ChartErrorBar');
                            if (seriesChild.type === ChartErrorBar || isErrorBarNamed) {
                                const ebProps: ChartErrorBarProps = { ...seriesChild.props as ChartErrorBarProps };
                                (seriesPropsSignature as SeriesProperties).errorBar = ebProps;
                            }
                        }
                    }
                );
            }
            return { typeName, ...seriesPropsSignature };
        }),
        getCircularReplacer()
    );

    /**
     * Effect that performs a deep comparison of series data and updates the chart only when necessary.
     * Prevents unnecessary re-renders by checking if the series array has actually changed.
     */
    useEffect(() => {
        const seriesArray: ChartSeriesProps[] = getSeriesArray();
        visited.clear();
        const shouldUpdate: boolean =
            JSON.stringify(previousSeriesRef.current, replacerFunc()) !==
            JSON.stringify(seriesArray, replacerFunc());

        if (shouldUpdate) {
            previousSeriesRef.current = seriesArray;
            context?.setChartSeries(seriesArray);
        }
    }, [deepSignature]);

    /**
     * Effect that updates the chart series whenever key properties change.
     * This ensures the chart reflects changes to visual properties like color, width, and visibility.
     */
    useEffect(() => {
        const seriesArray: ChartSeriesProps[] = getSeriesArray();
        context?.setChartSeries(seriesArray);
    }, [
        dataSourcesSignature,
        fill,
        width,
        dashArray,
        opacity,
        visible,
        markerSignature,
        errorBarSignature,
        deepSignature,
        splineType,
        legendShape,
        pointColorMapping
    ]);

    // The component itself doesn't render anything visible
    return null;
};

/**
 * Type definition for ChartSeries props, extending the Series with optional children.
 */
type ChartSeriesProperty = ChartSeriesProps & { children?: React.ReactNode };

/**
 * Component representing a single series in the chart.
 * This is a container component that holds configuration for one data series
 * and can contain child components like ChartMarker and ChartDataLabel.
 *
 * @param {ChartSeriesProps} props - The properties for the chart series.
 * @param {React.ReactNode} [props.children] - Optional child components for this series.
 * @returns {JSX.Element} A React component that renders its children.
 */
export const ChartSeries: React.FC<ChartSeriesProperty> = ({ children }: ChartSeriesProperty) => {
    return <>{children}</>;
};
