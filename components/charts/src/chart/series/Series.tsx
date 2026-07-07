/**
 * @module Chart/Series
 */
import * as React from 'react';
import { useContext, useEffect, useRef } from 'react';
import { ChartDataLabelProps, ChartMarkerProps, ChartSeriesProps, SeriesProps, ChartErrorBarProps, ChartSeriesLabelProps, ChartLastValueLabelProps } from '../base/interfaces';
import { ChartContext } from '../layout/ChartProvider';
import { defaultChartConfigs } from '../base/default-properties';
import { ChartMarker } from './Marker';
import { ChartErrorBar } from './ErrorBar';
import { ChartLastValueLabel } from './ChartLastValueLabel';
import { ChartTrendlineModel, SeriesProperties } from '../chart-area/chart-interfaces';
import { ChartTrendline, ChartTrendlineCollection } from './Trendlines';
import { ChartSeriesLabel } from './SeriesLabel';
import { buildParetoSignature, handleParetoInGetSeries, handleParetoInDeepSignature } from '../utils/pareto';

/**
 * Extracts primitive properties from an object, ignoring objects, functions, and the 'children' property.
 * Used to get simple property values from component props.
 *
 * @param {ChartSeriesProperty} obj - The source object to extract properties from.
 * @returns {Partial<ChartSeriesProperty>} A new object containing only the primitive properties from the source object.
 * @private
 */
export function pickPrimitiveProps(obj: ChartSeriesProperty): Partial<ChartSeriesProperty> {
    const copy: Partial<ChartSeriesProperty> = {};
    for (const [key, handler] of Object.entries(obj)) {
        if (key === 'children') { continue; }
        if (typeof handler !== 'object' && typeof handler !== 'function') {
            (copy as Record<string, string | number | boolean>)[key as string] = handler as string | number | boolean;
        }
    }
    return copy;
}

/**
 * Creates a replacer function for JSON.stringify that handles circular references.
 * Uses a WeakSet to track seen objects and avoid serializing circular structures.
 *
 * @returns {Function} A replacer function that can be used with JSON.stringify.
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
    const isClosedPath: string = extractProperty(childArray, 'isClosedPath');

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

    const seriesLabelSignature: string = JSON.stringify(
        childArray.map((child: React.ReactNode) => {
            if (
                React.isValidElement(child) &&
                child.type === ChartSeries &&
                (child.props as ChartSeriesProperty).children
            ) {
                let slSignature: Partial<ChartSeriesLabelProps> = {};
                React.Children.forEach((child.props as ChartSeriesProperty).children, (c: React.ReactNode) => {
                    if (React.isValidElement(c)) {
                        const type: React.ElementType = c.type as React.ElementType<keyof React.JSX.IntrinsicElements>;
                        const isNamed: boolean =
                            (typeof type === 'function') &&
                            ('displayName' in type) &&
                            ((type as { displayName?: string }).displayName === 'ChartSeriesLabel');

                        if (c.type === ChartSeriesLabel || isNamed) {
                            slSignature = {
                                ...slSignature,
                                ...(c.props as ChartSeriesLabelProps)
                            };
                        }
                    }
                });
                return slSignature;
            }
            return null;
        })
    );

    // String representation of Pareto options (including nested marker and data label) for all series.
    const paretoSignature: string = buildParetoSignature(childArray);

    // String representation of last value label configurations for all series.
    // Captures full lastValueLabel object including nested properties (border, font, lineStyle).
    const lastValueLabelSignature: string = JSON.stringify(
        childArray.map((child: React.ReactNode) => {
            if (
                React.isValidElement(child) &&
                child.type === ChartSeries &&
                (child.props as ChartSeriesProperty).children
            ) {
                let lvlSignature: ChartLastValueLabelProps | null = null;
                React.Children.forEach(
                    (child.props as ChartSeriesProperty).children,
                    (lvlChild: React.ReactNode) => {
                        if (React.isValidElement(lvlChild)) {
                            const type: React.ElementType = lvlChild.type as React.ElementType<keyof React.JSX.IntrinsicElements>;
                            const isNamedComponent: boolean =
                                (typeof type === 'function') &&
                                ('displayName' in type) &&
                                ((type as { displayName?: string }).displayName === 'ChartLastValueLabel');
                            if (lvlChild.type === ChartLastValueLabel || isNamedComponent) {
                                lvlSignature = { ...(lvlChild.props as ChartLastValueLabelProps) };
                            }
                        }
                    }
                );
                return lvlSignature;
            }
            return null;
        })
    );

    /**
     * Extracts and processes the series array from child components.
     * This core method transforms React component hierarchy into a data structure
     * that can be consumed by the chart rendering engine.
     *
     * @private
     * @returns {ChartSeriesProps[]} Array of processed Series objects ready for rendering.
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

                // BoxAndWhisker settings for default value preserved
                if (childProps.boxAndWhiskerSettings) {
                    seriesProps.boxAndWhiskerSettings = {
                        ...defaultChartConfigs.ChartSeries.boxAndWhiskerSettings,
                        ...childProps.boxAndWhiskerSettings
                    };
                } else if (defaultChartConfigs.ChartSeries.boxAndWhiskerSettings) {
                    seriesProps.boxAndWhiskerSettings = {
                        ...defaultChartConfigs.ChartSeries.boxAndWhiskerSettings
                    };
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
                            markerConfig.border = { ...defaultChartConfigs.ChartSeries.marker?.border, ...markerProps.border };

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
                                        markerConfig.dataLabel.border = {
                                            ...defaultChartConfigs.ChartSeries.marker?.dataLabel?.border,
                                            ...((dataLabelChild.props as ChartDataLabelProps).border)
                                        };
                                        markerConfig.dataLabel.margin = {
                                            ...defaultChartConfigs.ChartSeries.marker?.dataLabel?.margin,
                                            ...((dataLabelChild.props as ChartDataLabelProps).margin)
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

                        // Process last value label configuration
                        if (React.isValidElement(seriesChild)) {
                            const type: React.ElementType = seriesChild.type as React.ElementType<keyof React.JSX.IntrinsicElements>;
                            const isLastValueLabelNamed: boolean =
                                (typeof type === 'function') &&
                                ('displayName' in type) &&
                                ((type as { displayName?: string }).displayName === 'ChartLastValueLabel');

                            if (seriesChild.type === ChartLastValueLabel || isLastValueLabelNamed) {
                                const lvlProps: ChartLastValueLabelProps = seriesChild.props as ChartLastValueLabelProps;
                                const defaultLastValueLabel: ChartLastValueLabelProps | undefined =
                                    (defaultChartConfigs.ChartSeries as Partial<SeriesProperties>)
                                        .lastValueLabel as ChartLastValueLabelProps | undefined;
                                // Deep-merge to ensure nested properties fall back to defaults
                                const mergedLastValueLabel: ChartLastValueLabelProps = {
                                    ...(defaultLastValueLabel || {}),
                                    ...lvlProps,
                                    border: {
                                        ...(defaultLastValueLabel?.border || {}),
                                        ...(lvlProps?.border || {})
                                    },
                                    font: {
                                        ...(defaultLastValueLabel?.font || {}),
                                        ...(lvlProps?.font || {})
                                    },
                                    lineStyle: {
                                        ...(defaultLastValueLabel?.lineStyle || {}),
                                        ...(lvlProps?.lineStyle || {})
                                    }
                                };
                                (seriesProps as SeriesProperties).lastValueLabel = mergedLastValueLabel as ChartLastValueLabelProps;
                            }
                        }

                        // Process series label configuration
                        if (React.isValidElement(seriesChild)) {
                            const type: React.ElementType = seriesChild.type as React.ElementType<keyof React.JSX.IntrinsicElements>;
                            const isSeriesLabelNamed: boolean = (typeof type === 'function') && ('displayName' in type) &&
                                ((type as { displayName?: string }).displayName === 'ChartSeriesLabel');
                            if (seriesChild.type === ChartSeriesLabel || isSeriesLabelNamed) {
                                const seriesLabelProps: ChartSeriesLabelProps = seriesChild.props as ChartSeriesLabelProps;
                                const defaultSeriesLabel: ChartSeriesLabelProps =
                                    (defaultChartConfigs.ChartSeries as Partial<SeriesProperties>).seriesLabel as ChartSeriesLabelProps;
                                // Deep-merge series label props with defaults
                                const mergedSeriesLabel: ChartSeriesLabelProps = {
                                    ...(defaultSeriesLabel),
                                    ...(seriesLabelProps),
                                    font: {
                                        ...(defaultSeriesLabel?.font),
                                        ...(seriesLabelProps?.font)
                                    },
                                    border: {
                                        ...(defaultSeriesLabel?.border),
                                        ...(seriesLabelProps?.border)
                                    }
                                } as ChartSeriesLabelProps;
                                (seriesProps as SeriesProperties).seriesLabel = mergedSeriesLabel;
                            }
                        }

                        // Process Pareto options configuration (including nested marker and data label)
                        handleParetoInGetSeries(seriesChild, seriesProps as SeriesProperties);

                        // Process trendline collection configuration
                        if (React.isValidElement(seriesChild)) {
                            const childType: React.ElementType =
                                seriesChild.type as React.ElementType<keyof React.JSX.IntrinsicElements>;
                            const isTrendlineCollectionComponent: boolean =
                                (typeof childType === 'function') &&
                                ('displayName' in childType) &&
                                ((childType as { displayName?: string }).displayName === 'ChartTrendlineCollection');

                            if (seriesChild.type === ChartTrendlineCollection || isTrendlineCollectionComponent) {
                                const trendlineCollectionChildren: React.ReactNode =
                                    (seriesChild.props as ChartSeriesProperty).children;

                                if (trendlineCollectionChildren) {
                                    // Initialize trendlines array if it doesn't exist
                                    if (!(seriesProps).trendlines) {
                                        (seriesProps).trendlines = [];
                                    }

                                    // Process each ChartTrendline inside the collection
                                    React.Children.forEach(
                                        trendlineCollectionChildren,
                                        (trendlineChild: React.ReactNode): void => {
                                            if (React.isValidElement(trendlineChild)) {
                                                const trendlineType: React.ElementType =
                                                    trendlineChild.type as React.ElementType<keyof React.JSX.IntrinsicElements>;
                                                const isTrendlineComponent: boolean =
                                                    (typeof trendlineType === 'function') &&
                                                    ('displayName' in trendlineType) &&
                                                    ((trendlineType as { displayName?: string }).displayName === 'ChartTrendline');

                                                if (trendlineChild.type === ChartTrendline || isTrendlineComponent) {
                                                    const { children: trendlineChildren, ...trendlinePropsFromChild } =
                                                        trendlineChild.props as ChartSeriesProperty;

                                                    const defaultTrendlineConfig: ChartTrendlineModel | undefined =
                                                        defaultChartConfigs.ChartTrendline as ChartTrendlineModel | undefined;

                                                    // Deep-merge trendline props with defaults
                                                    const mergedTrendlineConfig: ChartTrendlineModel = {
                                                        ...(defaultTrendlineConfig || {}),
                                                        ...trendlinePropsFromChild,
                                                        animation: {
                                                            ...(defaultTrendlineConfig?.animation || {}),
                                                            ...(trendlinePropsFromChild?.animation || {})
                                                        },
                                                        accessibility: {
                                                            ...(defaultTrendlineConfig?.accessibility || {}),
                                                            ...(trendlinePropsFromChild?.accessibility || {})
                                                        }
                                                    } as ChartTrendlineModel;

                                                    // Process marker and data label inside trendline
                                                    if (trendlineChildren) {
                                                        React.Children.forEach(
                                                            trendlineChildren,
                                                            (trendlineNestedChild: React.ReactNode): void => {
                                                                if (React.isValidElement(trendlineNestedChild) &&
                                                                    trendlineNestedChild.type === ChartMarker) {
                                                                    const { children: markerChildren, ...markerPropsFromChild } =
                                                                        trendlineNestedChild.props as ChartSeriesProperty;

                                                                    const defaultMarkerConfig: ChartMarkerProps | undefined =
                                                                        defaultChartConfigs.ChartSeries.marker;

                                                                    const mergedMarkerConfig: ChartMarkerProps = {
                                                                        ...defaultMarkerConfig,
                                                                        ...markerPropsFromChild
                                                                    } as ChartMarkerProps;

                                                                    // Process data label inside marker
                                                                    if (markerChildren) {
                                                                        React.Children.forEach(
                                                                            markerChildren,
                                                                            (markerChild: React.ReactNode): void => {
                                                                                if (React.isValidElement(markerChild)) {
                                                                                    const dataLabelType: React.ElementType =
                                                                                        markerChild.type as React.ElementType<keyof
                                                                                        React.JSX.IntrinsicElements>;

                                                                                    const isDataLabelComponent: boolean =
                                                                                        (typeof dataLabelType === 'function') &&
                                                                                        ('displayName' in dataLabelType) &&
                                                                                        ((dataLabelType as { displayName?: string }).displayName === 'ChartDataLabel');

                                                                                    if (isDataLabelComponent) {
                                                                                        const dataLabelPropsFromChild: ChartDataLabelProps =
                                                                                            markerChild.props as ChartDataLabelProps;

                                                                                        const defaultDataLabelConfig: ChartDataLabelProps
                                                                                        | undefined = defaultChartConfigs.
                                                                                            ChartSeries.marker?.dataLabel;

                                                                                        mergedMarkerConfig.dataLabel = {
                                                                                            ...defaultDataLabelConfig,
                                                                                            ...dataLabelPropsFromChild,
                                                                                            font: {
                                                                                                ...defaultDataLabelConfig?.font,
                                                                                                ...dataLabelPropsFromChild.font
                                                                                            }
                                                                                        };
                                                                                    }
                                                                                }
                                                                            }
                                                                        );
                                                                    }

                                                                    mergedTrendlineConfig.marker = mergedMarkerConfig;
                                                                }
                                                            }
                                                        );
                                                    }

                                                    // Add the trendline to the series
                                                    ((seriesProps).trendlines as  ChartTrendlineModel[]).push(
                                                        mergedTrendlineConfig as ChartTrendlineModel);
                                                }
                                            }
                                        }
                                    );
                                }
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

                        // Capture last value label props in deep signature
                        if (React.isValidElement(seriesChild)) {
                            const type: React.ElementType = seriesChild.type as React.ElementType<keyof React.JSX.IntrinsicElements>;
                            const isLastValueLabelNamed: boolean =
                                (typeof type === 'function') &&
                                ('displayName' in type) &&
                                ((type as { displayName?: string }).displayName === 'ChartLastValueLabel');
                            if (seriesChild.type === ChartLastValueLabel || isLastValueLabelNamed) {
                                const lvlProps: ChartLastValueLabelProps = { ...seriesChild.props as ChartLastValueLabelProps };
                                (seriesPropsSignature as SeriesProperties).lastValueLabel = lvlProps;
                            }
                        }

                        // Capture Pareto options (including nested marker & data label) in deep signature
                        handleParetoInDeepSignature(seriesChild, seriesPropsSignature as SeriesProperties);

                        // Capture trendline collection props in deep signature
                        if (React.isValidElement(seriesChild)) {
                            const childType: React.ElementType =
                                seriesChild.type as React.ElementType<keyof React.JSX.IntrinsicElements>;
                            const isTrendlineCollectionComponent: boolean =
                                (typeof childType === 'function') &&
                                ('displayName' in childType) &&
                                ((childType as { displayName?: string }).displayName === 'ChartTrendlineCollection');

                            if (seriesChild.type === ChartTrendlineCollection || isTrendlineCollectionComponent) {
                                const trendlineCollectionChildren: React.ReactNode =
                                    (seriesChild.props as ChartSeriesProperty).children;

                                if (trendlineCollectionChildren) {
                                    // Initialize trendlines array if it doesn't exist
                                    if (!(seriesPropsSignature).trendlines) {
                                        (seriesPropsSignature).trendlines = [];
                                    }

                                    // Process each ChartTrendline inside the collection
                                    React.Children.forEach(
                                        trendlineCollectionChildren,
                                        (trendlineChild: React.ReactNode): void => {
                                            if (React.isValidElement(trendlineChild)) {
                                                const trendlineType: React.ElementType =
                                                    trendlineChild.type as React.ElementType<keyof React.JSX.IntrinsicElements>;
                                                const isTrendlineComponent: boolean =
                                                    (typeof trendlineType === 'function') &&
                                                    ('displayName' in trendlineType) &&
                                                    ((trendlineType as { displayName?: string }).displayName === 'ChartTrendline');

                                                if (trendlineChild.type === ChartTrendline || isTrendlineComponent) {
                                                    const trendlinePropsForSignature: ChartTrendlineModel = {
                                                        ...trendlineChild.props as ChartTrendlineModel
                                                    };

                                                    // Check for marker inside trendline
                                                    const trendlineChildrenNodes: React.ReactNode =
                                                        (trendlineChild.props as ChartSeriesProperty).children;

                                                    if (trendlineChildrenNodes) {
                                                        React.Children.forEach(
                                                            trendlineChildrenNodes,
                                                            (trendlineNestedChild: React.ReactNode): void => {
                                                                if (React.isValidElement(trendlineNestedChild) &&
                                                                    trendlineNestedChild.type === ChartMarker) {
                                                                    const markerPropsForSignature: ChartMarkerProps = {
                                                                        ...trendlineNestedChild.props as ChartMarkerProps
                                                                    };

                                                                    // Look for ChartDataLabel inside marker
                                                                    const markerChildrenNodes: React.ReactNode =
                                                                        (trendlineNestedChild.props as ChartSeriesProperty).children;

                                                                    if (markerChildrenNodes) {
                                                                        React.Children.forEach(
                                                                            markerChildrenNodes,
                                                                            (markerChild: React.ReactNode): void => {
                                                                                if (React.isValidElement(markerChild)) {
                                                                                    const dataLabelType: React.ElementType =
                                                                                        markerChild.type as React.ElementType<
                                                                                        keyof React.JSX.IntrinsicElements>;
                                                                                    const isDataLabelComponent: boolean =
                                                                                        (typeof dataLabelType === 'function') &&
                                                                                        ('displayName' in dataLabelType) &&
                                                                                        ((dataLabelType as { displayName?: string }).displayName === 'ChartDataLabel');

                                                                                    if (isDataLabelComponent) {
                                                                                        const dataLabelPropsForSignature
                                                                                        : ChartDataLabelProps = markerChild
                                                                                            .props as ChartDataLabelProps;
                                                                                        markerPropsForSignature.dataLabel
                                                                                        = dataLabelPropsForSignature;
                                                                                    }
                                                                                }
                                                                            }
                                                                        );
                                                                    }

                                                                    trendlinePropsForSignature.marker = markerPropsForSignature;
                                                                }
                                                            }
                                                        );
                                                    }

                                                    // Add trendline to signature
                                                    (seriesPropsSignature.trendlines as  ChartTrendlineModel[]).push(
                                                        trendlinePropsForSignature as ChartTrendlineModel);
                                                }
                                            }
                                        }
                                    );
                                }
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
     * String representation of trendline configurations for all series, including nested markers and data labels.
     * Used to track changes in trendline properties for dependency arrays in useEffect.
     */
    const trendlineSignature: string = JSON.stringify(
        childArray.map((child: React.ReactNode): Partial<ChartSeriesProperty>[] | null => {
            if (
                React.isValidElement(child) &&
                child.type === ChartSeries &&
                (child.props as ChartSeriesProperty).children
            ) {
                const trendlineSignaturesArray: Partial<ChartSeriesProperty>[] = [];

                React.Children.forEach(
                    (child.props as ChartSeriesProperty).children,
                    (seriesChild: React.ReactNode): void => {
                        if (React.isValidElement(seriesChild)) {
                            const childType: React.ElementType =
                                seriesChild.type as React.ElementType<keyof React.JSX.IntrinsicElements>;
                            const isTrendlineCollectionComponent: boolean =
                                (typeof childType === 'function') &&
                                ('displayName' in childType) &&
                                ((childType as { displayName?: string }).displayName === 'ChartTrendlineCollection');

                            // Check if this is a ChartTrendlineCollection
                            if (seriesChild.type === ChartTrendlineCollection || isTrendlineCollectionComponent) {
                                const trendlineCollectionChildren: React.ReactNode =
                                    (seriesChild.props as ChartSeriesProperty).children;

                                if (trendlineCollectionChildren) {
                                    // Process each ChartTrendline inside the collection
                                    React.Children.forEach(
                                        trendlineCollectionChildren,
                                        (trendlineChild: React.ReactNode): void => {
                                            if (React.isValidElement(trendlineChild)) {
                                                const trendlineType: React.ElementType =
                                                    trendlineChild.type as React.ElementType<keyof React.JSX.IntrinsicElements>;
                                                const isTrendlineComponent: boolean =
                                                    (typeof trendlineType === 'function') &&
                                                    ('displayName' in trendlineType) &&
                                                    ((trendlineType as { displayName?: string }).displayName === 'ChartTrendline');

                                                if (trendlineChild.type === ChartTrendline || isTrendlineComponent) {
                                                    const trendlineSignature: Partial<ChartSeriesProperty> = {
                                                        ...pickPrimitiveProps(trendlineChild.props as ChartSeriesProperty)
                                                    };

                                                    // Check for marker inside trendline
                                                    const trendlineChildren: React.ReactNode =
                                                        (trendlineChild.props as ChartSeriesProperty).children;

                                                    if (trendlineChildren) {
                                                        React.Children.forEach(
                                                            trendlineChildren,
                                                            (trendlineNestedChild: React.ReactNode): void => {
                                                                if (React.isValidElement(trendlineNestedChild) &&
                                                                    trendlineNestedChild.type === ChartMarker) {
                                                                    const markerSignature: Partial<ChartSeriesProperty> = {
                                                                        ...pickPrimitiveProps(trendlineNestedChild
                                                                            .props as ChartSeriesProperty)
                                                                    };

                                                                    trendlineSignature.marker = markerSignature;

                                                                    // Check for dataLabel inside marker
                                                                    const markerChildren: React.ReactNode =
                                                                        (trendlineNestedChild.props as ChartSeriesProperty).children;

                                                                    if (markerChildren) {
                                                                        React.Children.forEach(
                                                                            markerChildren,
                                                                            (markerChild: React.ReactNode): void => {
                                                                                if (React.isValidElement(markerChild)) {
                                                                                    const dataLabelType: React.ElementType =
                                                                                        markerChild.type as React.ElementType<
                                                                                        keyof React.JSX.IntrinsicElements>;
                                                                                    const isDataLabelComponent: boolean =
                                                                                        (typeof dataLabelType === 'function') &&
                                                                                        ('displayName' in dataLabelType) &&
                                                                                        ((dataLabelType as { displayName?: string }).displayName === 'ChartDataLabel');

                                                                                    if (isDataLabelComponent) {
                                                                                        const dataLabelSignature: Partial<
                                                                                        ChartSeriesProperty> = pickPrimitiveProps(
                                                                                            markerChild.props as ChartSeriesProperty);

                                                                                        if (!trendlineSignature.marker) {
                                                                                            trendlineSignature.marker = {};
                                                                                        }
                                                                                        (trendlineSignature.marker as { dataLabel?: Partial<
                                                                                        ChartSeriesProperty> }).dataLabel
                                                                                        = dataLabelSignature;
                                                                                    }
                                                                                }
                                                                            }
                                                                        );
                                                                    }
                                                                }
                                                            }
                                                        );
                                                    }

                                                    trendlineSignaturesArray.push(trendlineSignature);
                                                }
                                            }
                                        }
                                    );
                                }
                            }
                        }
                    }
                );

                return trendlineSignaturesArray.length > 0 ? trendlineSignaturesArray : null;
            }
            return null;
        })
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
        seriesLabelSignature,
        lastValueLabelSignature,
        trendlineSignature,
        deepSignature,
        splineType,
        legendShape,
        pointColorMapping,
        paretoSignature,
        isClosedPath
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
 * @returns {Element} A React component that renders its children.
 */
export const ChartSeries: React.FC<ChartSeriesProperty> = ({ children }: ChartSeriesProperty) => {
    return <>{children}</>;
};
