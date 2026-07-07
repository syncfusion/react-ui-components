/**
 * Radar Scatter Series Renderer
 * Renders scatter series in radar coordinate systems using markers at transformed coordinates.
 *
 * @private
 */

import { ChartLocationProps } from '../../base/interfaces';
import { transformToRadarCoordinates } from '../../utils/polarRadarHelper';
import {
    Points,
    RenderOptions,
    SeriesProperties,
    MarkerProperties
} from '../../chart-area/chart-interfaces';
import MarkerRenderer from '../SeriesRenderer/MarkerRenderer';
import { calculatePolarRadarAnimation } from './PolarRadarAnimation';
import { applyPointRenderCallback } from '../../utils/helper';

const render: (
    series: SeriesProperties,
    _isInverted: boolean
) => RenderOptions[] | { options: RenderOptions[]; marker: MarkerProperties } = (
    series: SeriesProperties,
    _isInverted: boolean
) => {
    void _isInverted;
    const options: RenderOptions[] = [];
    series.isRectSeries = false;
    const visiblePoints: Points[] = series.points.filter((p: Points) => p.visible);
    if (visiblePoints.length === 0) {
        return [];
    }

    for (const point of visiblePoints) {
        point.regions = [];
        point.symbolLocations = [];

        //  ONLY CHANGE: radar coordinate transformation
        const radarPoint: ChartLocationProps = transformToRadarCoordinates(
            point.xValue as number,
            point.yValue as number,
            series.xAxis,
            series.yAxis,
            series.chart
        );

        point.symbolLocations = [{
            x: radarPoint.x - (series.clipRect?.x as number),
            y: radarPoint.y - (series.clipRect?.y as number)
        }];

        const markerWidth: number = series.marker?.width as number;
        const markerHeight: number = series.marker?.height as number;

        point.regions.push({
            x: point.symbolLocations[0].x - markerWidth,
            y: point.symbolLocations[0].y - markerHeight,
            width: 2 * markerWidth,
            height: 2 * markerHeight
        });

        const customizedValues: string = applyPointRenderCallback(
            {
                seriesIndex: series.index as number,
                color: series.interior as string,
                xValue: point.xValue,
                yValue: point.yValue
            },
            series.chart
        );

        point.interior = customizedValues;
    }

    series.visiblePoints = visiblePoints;

    // Invisible anchor path (REQUIRED – unchanged)
    const pathId: string = `${series.chart.element.id}_Series_${series.index}_anchor_0`;
    options.push({
        id: pathId,
        fill: 'none',
        stroke: 'transparent',
        strokeWidth: 0,
        opacity: 0,
        dashArray: '',
        d: 'M 0 0'
    });

    const markerOptions: MarkerProperties = MarkerRenderer.render(series) as Object;
    const markerResult: MarkerProperties = {
        ...markerOptions,
        symbolGroup: {
            id: `${series.chart.element.id}_Series_${series.index}_SymbolGroup`,
            transform: `translate(${series.clipRect?.x}, ${series.clipRect?.y})`
        }
    };

    return {
        options,
        marker: markerResult
    };
};

const doAnimation: (pathOptions: RenderOptions, index: number, animationState: {
    previousPathLengthRef: React.RefObject<number[]>;
    isInitialRenderRef: React.RefObject<boolean[]>;
    renderedPathDRef: React.RefObject<string[]>;
    animationProgress: number;
    isFirstRenderRef: React.RefObject<boolean>;
    previousSeriesOptionsRef: React.RefObject<RenderOptions[][]>;
}, enableAnimation: boolean, currentSeries: SeriesProperties,
    _currentPoint: Points | undefined, _pointIndex: number, visibleSeries: SeriesProperties[]) => {} = (
    pathOptions: RenderOptions,
    index: number,
    animationState: {
        previousPathLengthRef: React.RefObject<number[]>;
        isInitialRenderRef: React.RefObject<boolean[]>;
        renderedPathDRef: React.RefObject<string[]>;
        animationProgress: number;
        isFirstRenderRef: React.RefObject<boolean>;
        previousSeriesOptionsRef: React.RefObject<RenderOptions[][]>;
    },
    enableAnimation: boolean,
    currentSeries: SeriesProperties,
    _currentPoint: Points | undefined,
    _pointIndex: number,
    visibleSeries: SeriesProperties[]
) => {
    return calculatePolarRadarAnimation(
        pathOptions,
        index,
        animationState,
        enableAnimation,
        currentSeries,
        undefined,
        _pointIndex,
        visibleSeries
    );
};

/**
 * Radar Scatter Series Renderer
 */
const RadarScatterSeriesRenderer: {
    render: (series: SeriesProperties, _isInverted: boolean) => RenderOptions[] | {
        options: RenderOptions[];
        marker: MarkerProperties;
    };
    doAnimation: (pathOptions: RenderOptions, index: number, animationState: {
        previousPathLengthRef: React.RefObject<number[]>;
        isInitialRenderRef: React.RefObject<boolean[]>;
        renderedPathDRef: React.RefObject<string[]>;
        animationProgress: number;
        isFirstRenderRef: React.RefObject<boolean>;
        previousSeriesOptionsRef: React.RefObject<RenderOptions[][]>;
    }, enableAnimation: boolean, currentSeries: SeriesProperties,
        _currentPoint: Points | undefined, _pointIndex: number, visibleSeries: SeriesProperties[]) => {};
} = {
    render,
    doAnimation
};

export default RadarScatterSeriesRenderer;
