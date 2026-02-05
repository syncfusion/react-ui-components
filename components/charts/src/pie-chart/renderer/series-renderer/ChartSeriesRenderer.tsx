
// Pie chart series renderer
import { forwardRef, useEffect, useLayoutEffect, useState, useRef, useContext } from 'react';
import { PieChartBorderProps, PieChartLocationProps, PieChartSeriesProps, PieChartDataLabelProps, PieChartFontProps } from '../../base/interfaces';
import { useLayout } from '../../layout/LayoutContext';
import { stringToNumber } from '../../utils/helper';
import { degreeToLocation, indexFinder } from '../../utils/helper';
import { ChartEventArg, registerChartEventHandler, useChartRenderVersion, useRegisterCenterLabelRender, useSeriesRenderVersion, useRegisterLegendUpdate } from '../../hooks/events';
import { addPoint, generateClubPoint, getPoints, pushPoints, removePoint, refreshDataManager } from './ProcessData';
import { AccPointData, angleDelta, computeAngles, findCenter, getPathArc, getPieData, initAngles, isEmpty, lerpAngleShortest } from './series-helper';
import { getSeriesColor } from '../../utils/theme';
import { extend } from '@syncfusion/react-base';
import { ChartContext } from '../../layout/ChartProvider';
import { renderCenterLabel } from '../ChartCenterLabelRender';
import { Chart, PathElementOption, PieBase, Points, Rect, SeriesProperties } from '../../base/internal-interfaces';
import { buildConnectorPath, renderDataLabels } from './DataLabelRenderer';
import { calculateVisibleSeries } from '../ChartRenderer';
import { Animation } from '../../../common/interfaces';
import { TextAnchor } from '../../../common';

/**
 * Represents a single data point with dynamic keys and object values.
 */
type DataPoint = Record<string, Object>;

/**
 * Defines the angular range for an arc segment, typically used in pie or radial charts.
 */
interface ArcAngle {
    start: number;
    end: number;
}

/**
 * ChartSeriesRenderer is a React component responsible for rendering circular chart series.
 * It uses forwardRef to expose the underlying SVG group element for external manipulation.
 *
 * @param props - An array of CircularChartSeriesProps defining each series to be rendered.
 * @param ref - A forwarded ref to the SVG group element (`<g>`) that wraps the chart series.
 * @returns A rendered SVG group element containing the circular chart series.
 */
export const ChartSeriesRenderer: React.ForwardRefExoticComponent<PieChartSeriesProps[] & React.RefAttributes<SVGGElement>> =
    forwardRef<SVGGElement, PieChartSeriesProps[]>((props: PieChartSeriesProps[], ref: React.ForwardedRef<SVGGElement>) => {
        const triggerCenterLabelRender: (chartId?: string) => void = useRegisterCenterLabelRender();
        const { layoutRef, reportMeasured, phase, setSeriesAnimated } = useLayout();
        const { centerLabel } = useContext(ChartContext);
        const [progres, setProgress] = useState(0);
        // New state to control the animation sequence
        const [isInitialAnimationComplete, setIsInitialAnimationComplete] = useState(false);
        const [startExplodeTransition, setStartExplodeTransition] = useState(false);
        const [explodedPointIndex, setExplodedPointIndex] = useState<number | null | undefined>(props[0]?.explodeIndex ?? undefined);
        const [userHasInteracted, setUserHasInteracted] = useState(false);
        const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null | undefined>(null);
        const [elementOptions, setElementOptions] = useState<PathElementOption[]>([]);
        const [hoverBorderProps, setHoverBorderProps] = useState<{
            key: number;
            d: string;
            transform: string;
            fill: string;
            opacity: number;
            style: React.CSSProperties;
        } | null>(null);
        const borderAnimationTimeoutRef: React.RefObject<NodeJS.Timeout | null> = useRef<NodeJS.Timeout | null>(null);

        const prevExpodeIndex: React.RefObject<number | null> = useRef<number>(null);

        // Angle tweening for pie update morph
        const prevAnglesRef: React.RefObject<ArcAngle[]> = useRef<ArcAngle[]>([]);
        const nextAnglesRef: React.RefObject<ArcAngle[]> = useRef<ArcAngle[]>([]);
        const tweenPointsRef: React.RefObject<Points[] | null> = useRef<Points[] | null>(null);
        const updateAnimRef: React.RefObject<{ start: number; duration: number; } | null> = useRef<{
            start: number; duration: number
        } | null>(null);
        const updateRafRef: React.RefObject<number | null> = useRef<number | null>(null);
        const lastAnglesSnapshotRef: React.RefObject<ArcAngle[]> = useRef<ArcAngle[]>([]);
        const lastVisibilitySnapshotRef: React.RefObject<boolean[]> = useRef<boolean[]>([]);
        const previesPointData: React.RefObject<AccPointData | null> = useRef<AccPointData | null>(null);

        // Legend update trigger hook
        const triggerLegendUpdate: (chartId?: string) => void = useRegisterLegendUpdate();

        const easeInOutCubic: (t: number) => number = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
        const easeOutCubic: (t: number) => number = (t: number) => 1 - Math.pow(1 - t, 3);
        const ANGLE_EPS: number = 1e-3;
        const normalizeAngles: (angles: ArcAngle[], pieStart: number, pieTotal: number) => ArcAngle[] =
            (angles: ArcAngle[], pieStart: number, pieTotal: number): ArcAngle[] => {
                const minimumEnd: number = pieStart;
                const maximumEnd: number = pieStart + pieTotal - ANGLE_EPS;
                let previousEnd: number | null = null;
                return angles.map((a: ArcAngle): ArcAngle => {
                    let start: number = ((a.start % 360) + 360) % 360;
                    let end: number = ((a.end % 360) + 360) % 360;
                    // Map into [pieStart, pieStart + pieTotal] in absolute space
                    if (start < pieStart) { start += 360; }
                    if (end < pieStart) { end += 360; }
                    // Maintain sequential order if needed
                    if (previousEnd !== null && start < previousEnd) { start = previousEnd; }
                    // Clamp to bounds
                    start = Math.max(pieStart, Math.min(start, pieStart + pieTotal));
                    end = Math.max(minimumEnd, Math.min(end, pieStart + pieTotal));
                    // Avoid zero-length tiny spans flickering
                    if (Math.abs(end - start) < ANGLE_EPS) { end = start; }
                    // Avoid touching the absolute end to prevent full-arc rounding issues
                    if (end > maximumEnd) { end = maximumEnd; }
                    previousEnd = end;
                    return { start: start, end: end }; // keep absolute, no wrap to 0
                });
            };

        useLayoutEffect(() => {
            if (phase === 'measuring' && layoutRef.current?.visibleSeries?.[0]) {
                initProperties(layoutRef.current, layoutRef.current.visibleSeries[0]);
                reportMeasured('ChartSeries');
            }
        }, [phase, layoutRef]);

        const legendClickedInfo: { version: number; id: string } = useSeriesRenderVersion();
        const updateLegendSnapshots: (series: SeriesProperties, angles?: ArcAngle[]) => void =
            (series: SeriesProperties, angles?: ArcAngle[]): void => {
                lastAnglesSnapshotRef.current = angles ? angles : computeAngles(series);
                lastVisibilitySnapshotRef.current = series.points.map((p: Points) => !!p.visible);
            };
        const applyLastVisibility: (series: SeriesProperties) => void = (series: SeriesProperties): void => {
            const snap: boolean[] = lastVisibilitySnapshotRef.current;
            if (!snap || snap.length === 0 || !series?.points) { return; }
            const n: number = Math.min(snap.length, series.points.length);
            for (let i: number = 0; i < n; i++) {
                if (snap[i as number] === false) {
                    series.points[i as number].visible = false;
                }
            }
            let sum: number = 0;
            for (const p of series.points) {
                if (p.visible) { sum += Math.abs(p.y as number); }
            }
            series.sumOfPoints = sum;
        };

        useEffect(() => {
            if (phase === 'rendering' && layoutRef.current?.visibleSeries?.[0] && legendClickedInfo &&
                legendClickedInfo.id === (layoutRef.current as Chart)?.element.id) {
                const chart: Chart = layoutRef.current;
                const series: SeriesProperties = chart.visibleSeries[0];
                // Ensure pie geometry (start/end/totalAngle) is up-to-date before computing angles
                initAngles(series, chart.pieSeries);
                const previousAnglesRaw: ArcAngle[] = lastAnglesSnapshotRef.current.length
                    ? lastAnglesSnapshotRef.current
                    : computeAngles(series);
                const pieStart: number = (layoutRef.current?.pieSeries?.startAngle ?? series.startAngle) as number;
                const pieTotal: number = (layoutRef.current?.pieSeries?.totalAngle ?? 360);
                const previousAngles: ArcAngle[] = normalizeAngles(previousAnglesRaw, pieStart, pieTotal);
                // previousVisibility no longer needed due to pure tween finalization
                if (updateAnimRef.current) {
                    if (updateRafRef.current) {
                        cancelAnimationFrame(updateRafRef.current);
                        updateRafRef.current = null;
                    }
                }
                const visibleIndex: number = series.points.findIndex((p: Points) => !!p.visible);
                const visibleCount: number = series.points.reduce((c: number, p: Points) => c + (p.visible ? 1 : 0), 0);
                let nextAngles: ArcAngle[];
                if (visibleCount === 1 && visibleIndex >= 0) {
                    const startA: number = ((series.startAngle as number) - 90 + 360) % 360;
                    const total: number = (layoutRef.current?.pieSeries?.totalAngle ?? 360);
                    const adjust: number = (startA + total - 0.001) % 360;
                    nextAngles = series.points.map((_: Points, idx: number) => idx === visibleIndex ? { start: startA, end: adjust } :
                        { start: startA, end: startA });
                } else {
                    nextAngles = computeAngles(series);
                }
                nextAngles = normalizeAngles(nextAngles, pieStart, pieTotal);
                lastAnglesSnapshotRef.current = nextAngles;

                if (visibleCount === 1 && visibleIndex >= 0) {
                    if (updateRafRef.current) { cancelAnimationFrame(updateRafRef.current); updateRafRef.current = null; }
                    updateAnimRef.current = null;
                    series.points.forEach((p: Points, i: number) => { p.visible = (i === visibleIndex); });
                    series.elementOptions = [];
                    renderPointsWithAngles(chart, nextAngles, series.points);
                    if (!series.elementOptions || series.elementOptions.length === 0) {
                        renderPoints(chart);
                    }
                    if (series.dataLabel && series.dataLabel.visible) {
                        renderDataLabels(chart, series);
                    }
                    setElementOptions(series.elementOptions);
                    updateLegendSnapshots(series, nextAngles.slice());
                    return;
                }

                if (updateRafRef.current) { cancelAnimationFrame(updateRafRef.current); }
                updateAnimRef.current = { start: performance.now(), duration: 350 };
                const step: (now: number) => void = (now: number) => {
                    const animState: { start: number; duration: number; } | null = updateAnimRef.current;
                    if (!animState) { return; }
                    const normalized: number = Math.min(1, (now - animState.start) / animState.duration);
                    const eased: number = easeInOutCubic(normalized);
                    let interpolatedAngles: ArcAngle[] = nextAngles.map((angle: ArcAngle, index: number) => {
                        const fromAngle: ArcAngle | undefined = previousAngles[index as number];
                        if (!fromAngle) { return angle; }
                        return {
                            start: lerpAngleShortest(fromAngle.start, angle.start, eased),
                            end: lerpAngleShortest(fromAngle.end, angle.end, eased)
                        };
                    });
                    interpolatedAngles = normalizeAngles(interpolatedAngles, pieStart, pieTotal);
                    renderPointsWithAngles(chart, interpolatedAngles, series.points);
                    setElementOptions(series.elementOptions);
                    updateLegendSnapshots(series, interpolatedAngles.slice());
                    if (normalized < 1) {
                        updateRafRef.current = requestAnimationFrame(step);
                    } else {
                        updateAnimRef.current = null;
                    }
                };
                updateRafRef.current = requestAnimationFrame(step);
            }
        }, [legendClickedInfo]);

        const pieInfo: { version: number; id: string } = useChartRenderVersion();
        // Normal rebuild (skipped while tweening)
        useEffect(() => {
            if (phase === 'rendering' && layoutRef.current?.visibleSeries?.[0]) {
                if (updateAnimRef.current) { return; } // skip during tween
                const chart: Chart = layoutRef.current;
                const series: SeriesProperties = chart.visibleSeries[0];
                //initAngles(series, chart.pieSeries);
                initProperties(layoutRef.current, layoutRef.current.visibleSeries[0]);
                if (!series.query) {
                    getPoints(series.dataSource as Object[], series);
                } else if (!series.points || series.points.length === 0) {
                    // Ensure remote data fetch kicks in if initial process was too early
                    refreshDataManager(series);
                }
                applyLastVisibility(series);
                initAngles(series, chart.pieSeries);
                series.elementOptions = [];
                renderPoints(chart);
                if (series.dataLabel && series.dataLabel.visible) {
                    renderDataLabels(chart, series);
                }
                setElementOptions(series.elementOptions);
                updateLegendSnapshots(series);
            }
        }, [phase, progres, userHasInteracted, pieInfo.version]);

        useEffect(() => {
            if (phase === 'rendering' && layoutRef.current?.visibleSeries?.[0]) {
                if (updateAnimRef.current) { return; } // skip during tween
                const chart: Chart = layoutRef.current;
                // Pass through the series; calculateVisibleSeries will clone while preserving DataManager/Query
                calculateVisibleSeries(chart, [props[0] as unknown as SeriesProperties]);
                initProperties(layoutRef.current, chart.visibleSeries[0]);
                const series: SeriesProperties = chart.visibleSeries[0];
                getPoints(series.dataSource as Object[], chart.visibleSeries[0]);
                applyLastVisibility(series);
                initAngles(series, chart.pieSeries);
                series.elementOptions = [];
                renderPoints(chart);
                if (series.dataLabel && series.dataLabel.visible) {
                    renderDataLabels(chart, series);
                }
                setElementOptions(series.elementOptions);
                updateLegendSnapshots(series);
            }
        }, [
            props[0]?.radius, props[0]?.groupMode, props[0]?.groupTo,
            props[0]?.innerRadius, props[0]?.emptyPointSettings?.mode,
            props[0]?.startAngle, props[0]?.endAngle]);

        useEffect(() => {
            if (phase === 'rendering' && layoutRef.current?.visibleSeries?.[0]) {
                layoutRef.current.visibleSeries[0].dataLabel = props[0]?.dataLabel;
                if (updateAnimRef.current) { return; }
                const chart: Chart = layoutRef.current;
                const series: SeriesProperties = chart.visibleSeries[0];
                initProperties(layoutRef.current, layoutRef.current.visibleSeries[0]);
                getPoints(series.dataSource as Object[], series);
                applyLastVisibility(series);
                initAngles(series, chart.pieSeries);
                series.elementOptions = [];
                renderPoints(chart);
                if (series.dataLabel && series.dataLabel.visible) {
                    renderDataLabels(chart, series);
                }
                setElementOptions(series.elementOptions);
            }
        }, [props[0]?.dataLabel]);

        useEffect(() => {
            if (phase === 'rendering' && layoutRef.current?.visibleSeries?.[0]) {
                if (updateAnimRef.current) { return; } // skip during tween
                const chart: Chart = layoutRef.current;
                const series: SeriesProperties = chart.visibleSeries[0];
                initAngles(series, chart.pieSeries);
                //initProperties(layoutRef.current, layoutRef.current.visibleSeries[0]);
                series.elementOptions = [];
                const explodePoint: Points = series.points[explodedPointIndex as number];
                const points: Points[] = series.points;
                if (explodePoint?.isClubbed) {
                    points.splice(points.length - 1, 1);
                    const previousPoint: Points = series.points[prevExpodeIndex.current as number];
                    series.clubbedPoints.forEach((point: Points) => {
                        point.visible = true;
                        point.isExplode = true;
                    });
                    const clubbedPoints: Points[] = extend([], series.clubbedPoints) as Points[];
                    series.points = points.concat(clubbedPoints);
                    if (previousPoint && !previousPoint.isClubbed) {
                        previousPoint.isExplode = false;
                    }
                    // Ensure CSS transition fires for grouped expand
                    setUserHasInteracted(true);
                    kickExplodeTransition(true);
                } else if (explodePoint) {
                    const clubPointsExploded: boolean = (explodePoint.isSliced || (series.clubbedPoints.length > 0 &&
                        points[points.length - 1].index === series.clubbedPoints[series.clubbedPoints.length - 1].index));
                    if (clubPointsExploded) {
                        points.splice(points.length - series.clubbedPoints.length, series.clubbedPoints.length);
                        const clubPoint: Points = generateClubPoint(series);
                        const colors: string[] = series.palettes?.length ? series.palettes : getSeriesColor(chart.theme || 'Material');
                        pushPoints(clubPoint, colors, series);
                        // Ensure CSS transition fires for grouped collapse back to single "Others"
                        setUserHasInteracted(true);
                        kickExplodeTransition(false);
                    }
                    series.points.forEach((point: Points) => {
                        if (explodePoint.index === point.index) {
                            point.isExplode = true;
                        } else {
                            point.isExplode = false;
                        }
                    });

                } else if (explodedPointIndex === null) {
                    series.points.forEach((point: Points) => {
                        point.isExplode = false;
                    });
                    const newExplodePoint: Points = series.points[prevExpodeIndex.current as number];
                    if (newExplodePoint && newExplodePoint.isSliced) {
                        points.splice(points.length - series.clubbedPoints.length, series.clubbedPoints.length);
                        const clubPoint: Points = generateClubPoint(series);
                        const colors: string[] = series.palettes?.length ? series.palettes : getSeriesColor(chart.theme || 'Material');
                        pushPoints(clubPoint, colors, series);
                        // Restore single "Others" with animated transition
                        setUserHasInteracted(true);
                        kickExplodeTransition(false);
                    }
                }
                prevExpodeIndex.current = explodedPointIndex as number;
                renderPoints(chart);
                if (series.dataLabel && series.dataLabel.visible) {
                    renderDataLabels(chart, series);
                }
                const triggerLegendUpdate: (chartId?: string) => void = useRegisterLegendUpdate();
                triggerLegendUpdate(layoutRef.current?.element?.id);
                setElementOptions(series.elementOptions);
            }
        }, [explodedPointIndex, phase]);

        useEffect(() => {
            if (phase !== 'rendering' || !layoutRef.current?.visibleSeries?.[0]) { return; }

            const chart: Chart = layoutRef.current;
            const series: SeriesProperties = chart.visibleSeries[0];
            const prevDataSource: DataPoint[] = series.dataSource as DataPoint[];
            const newDataSource: DataPoint[] = props[0].dataSource as DataPoint[];
            const lengthDiff: number = newDataSource.length - prevDataSource.length;
            let xValueChanged: boolean = false;
            if (prevDataSource && newDataSource && prevDataSource.length < newDataSource.length) {
                for (let id: number = 0; id < newDataSource.length; id++) {
                    if (prevDataSource && id < prevDataSource.length && prevDataSource[id as number] &&
                        prevDataSource[id as number][series.xField as string] !== newDataSource[id as number][series.xField as string]) {
                        xValueChanged = true;
                        break;
                    }
                }
            }

            if (xValueChanged || lengthDiff > 1 || lengthDiff < -1) {
                const chart: Chart = layoutRef.current;
                const series: SeriesProperties = chart.visibleSeries[0];
                series.dataSource = newDataSource; // Set the new data source
                series.points = []; // Clear points to force re-computation
                series.elementOptions = [];
                getPoints(newDataSource as Object[], series);
                applyLastVisibility(series);
                initAngles(series, chart.pieSeries);
                renderPoints(chart);
                if (series.dataLabel && series.dataLabel.visible) {
                    renderDataLabels(chart, series);
                }
                setElementOptions(series.elementOptions);
            }
            // Point addition animation
            if (lengthDiff === 1) {
                const addedPoint: DataPoint | undefined = (newDataSource as DataPoint[]).find((np: DataPoint) =>
                    !(prevDataSource as DataPoint[]).some((p: DataPoint) =>
                        p[series.xField as string] === np[series.xField as string] &&
                        p[series.yField as string] === np[series.yField as string]
                    )
                );
                if (addedPoint) {
                    const prevAngles: ArcAngle[] = computeAngles(series);

                    // Add the point to the series and update points/angles
                    addPoint(addedPoint, series);
                    const nextPoints: Points[] = series.points; // Newly added points array
                    const nextAngles: ArcAngle[] = computeAngles(series);

                    prevAnglesRef.current = prevAngles;
                    nextAnglesRef.current = nextAngles;
                    tweenPointsRef.current = nextPoints;

                    // Start tween
                    if (updateRafRef.current) { cancelAnimationFrame(updateRafRef.current); updateRafRef.current = null; }
                    updateAnimRef.current = { start: performance.now(), duration: 300 };

                    const step: (now: number) => void = (now: number) => {
                        if (!updateAnimRef.current) { return; }
                        const tLin: number = Math.min(1, (now - updateAnimRef.current.start) / updateAnimRef.current.duration);
                        const t: number = easeInOutCubic(tLin);

                        const interp: ArcAngle[] = nextAnglesRef.current.map((nextAngle: ArcAngle, i: number) => {
                            const previousAngle: ArcAngle = prevAnglesRef.current[i as number];
                            return previousAngle
                                ? {
                                    start: lerpAngleShortest(previousAngle.start, nextAngle.start, t),
                                    end: lerpAngleShortest(previousAngle.end, nextAngle.end, t)
                                }
                                : nextAngle; // For new points, use nextAngle directly
                        });

                        renderPointsWithAngles(chart, interp, tweenPointsRef.current || []);
                        setElementOptions(series.elementOptions);

                        if (tLin < 1) {
                            updateRafRef.current = requestAnimationFrame(step);
                        } else {
                            updateAnimRef.current = null;
                            // Commit data change and rebuild normally
                            series.elementOptions = [];
                            renderPoints(chart);
                            if (series.dataLabel && series.dataLabel.visible) {
                                renderDataLabels(chart, series);
                            }
                            setElementOptions(series.elementOptions);
                            // Trigger legend update after point addition
                            triggerLegendUpdate(layoutRef.current?.element?.id);
                            tweenPointsRef.current = null;
                        }
                    };
                    updateRafRef.current = requestAnimationFrame(step);
                }
            }
            // Point removal animation
            else if (lengthDiff === -1) {
                const preData: DataPoint[] = prevDataSource as DataPoint[];
                const newData: DataPoint[] = newDataSource as DataPoint[];
                const removedIndex: number = preData.findIndex((p: DataPoint) =>
                    !newData.some((np: DataPoint) =>
                        (np as DataPoint)[series.xField as string] === (p as DataPoint)[series.xField as string] &&
                        (np as DataPoint)[series.yField as string] === (p as DataPoint)[series.yField as string]
                    )
                );

                if (removedIndex >= 0) {
                    const prevAngles: ArcAngle[] = computeAngles(series);
                    const nextPoints: Points[] = series.points.filter((_: Points, i: number) => i !== removedIndex);
                    const nextSum: number = Math.max(0, (series.sumOfPoints || 0) -
                        Math.abs(series.points[removedIndex as number]?.y || 0));
                    const nextAngles: ArcAngle[] = computeAngles(series, nextPoints, nextSum);

                    prevAnglesRef.current = prevAngles.filter((_: ArcAngle, i: number) => i !== removedIndex);
                    nextAnglesRef.current = nextAngles;
                    tweenPointsRef.current = nextPoints;

                    if (updateRafRef.current) { cancelAnimationFrame(updateRafRef.current); updateRafRef.current = null; }
                    updateAnimRef.current = { start: performance.now(), duration: 300 };

                    const step: (now: number) => void = (now: number) => {
                        if (!updateAnimRef.current) { return; }
                        const tLin: number = Math.min(1, (now - updateAnimRef.current.start) / updateAnimRef.current.duration);
                        const t: number = easeInOutCubic(tLin);

                        const interp: ArcAngle[] = nextAnglesRef.current.map((na: ArcAngle, i: number) => {
                            const pa: ArcAngle = prevAnglesRef.current[i as number];
                            return pa ? {
                                start: lerpAngleShortest(pa.start, na.start, t),
                                end: lerpAngleShortest(pa.end, na.end, t)
                            } : na;
                        });

                        renderPointsWithAngles(chart, interp, tweenPointsRef.current || []);
                        setElementOptions(series.elementOptions);

                        if (tLin < 1) {
                            updateRafRef.current = requestAnimationFrame(step);
                        } else {
                            updateAnimRef.current = null;
                            removePoint(removedIndex, series);
                            series.elementOptions = [];
                            renderPoints(chart);
                            if (series.dataLabel && series.dataLabel.visible) {
                                renderDataLabels(chart, series);
                            }
                            setElementOptions(series.elementOptions);
                            // Trigger legend update after point removal
                            triggerLegendUpdate(layoutRef.current?.element?.id);
                            tweenPointsRef.current = null;
                        }
                    };
                    updateRafRef.current = requestAnimationFrame(step);
                }
            }
            // Data update animation
            else if (prevDataSource.length === newDataSource.length) {
                let dataChanged: boolean = false;
                for (let i: number = 0; i < newDataSource.length; i++) {
                    const prevPoint: DataPoint = prevDataSource[i as number] as DataPoint;
                    const newPoint: DataPoint = newDataSource[i as number] as DataPoint;
                    if (prevPoint[series.yField as string] !== newPoint[series.yField as string] ||
                        prevPoint[series.xField as string] !== newPoint[series.xField as string]) {
                        dataChanged = true;
                        break;
                    }
                }

                if (dataChanged) {
                    const prevPoints: Points[] = series.points;
                    const prevAngles: ArcAngle[] = computeAngles(series);

                    // Create a new data source array instance to trigger React's change detection
                    const temporaryDataSource: Object[] = [...newDataSource];
                    series.dataSource = temporaryDataSource; // Temporarily update dataSource

                    series.points = []; // Clear points to force re-computation
                    getPoints(newDataSource as Object[], series); // Recompute points based on new data
                    const nextPoints: Points[] = series.points;
                    const nextAngles: ArcAngle[] = computeAngles(series);

                    // Restore original dataSource and points for consistent state prior to tween
                    series.dataSource = prevDataSource;
                    series.points = prevPoints;

                    prevAnglesRef.current = prevAngles;
                    nextAnglesRef.current = nextAngles;
                    tweenPointsRef.current = nextPoints;

                    if (updateRafRef.current) { cancelAnimationFrame(updateRafRef.current); updateRafRef.current = null; }
                    updateAnimRef.current = { start: performance.now(), duration: 500 };

                    const step: (now: number) => void = (now: number) => {
                        if (!updateAnimRef.current) { return; }
                        const tLin: number = Math.min(1, (now - updateAnimRef.current.start) / updateAnimRef.current.duration);
                        const t: number = easeInOutCubic(tLin);

                        const interp: ArcAngle[] = nextAnglesRef.current.map((na: ArcAngle, i: number) => {
                            const pa: ArcAngle = prevAnglesRef.current[i as number];
                            return pa ? {
                                start: lerpAngleShortest(pa.start, na.start, t),
                                end: lerpAngleShortest(pa.end, na.end, t)
                            } : na;
                        });
                        renderPointsWithAngles(chart, interp, tweenPointsRef.current || []);
                        setElementOptions(series.elementOptions);

                        if (tLin < 1) {
                            updateRafRef.current = requestAnimationFrame(step);
                        } else {
                            updateAnimRef.current = null;
                            // Commit the actual data change after animation
                            series.dataSource = newDataSource; // Set the new data source
                            series.points = []; // Clear points to force re-computation
                            series.elementOptions = [];
                            getPoints(newDataSource as Object[], series); // Final computation of points
                            renderPoints(chart); // Render the final state
                            if (series.dataLabel && series.dataLabel.visible) {
                                renderDataLabels(chart, series);
                            }
                            setElementOptions(series.elementOptions);
                            // Trigger legend update after data update
                            triggerLegendUpdate(layoutRef.current?.element?.id);
                            tweenPointsRef.current = null;
                        }
                    };
                    updateRafRef.current = requestAnimationFrame(step);
                }
            }

            return () => {
                if (updateRafRef.current) { cancelAnimationFrame(updateRafRef.current); updateRafRef.current = null; }
                updateAnimRef.current = null;
            };
        }, [props[0]?.dataSource, phase]);

        // Mouse handlers (hover border, click explode)
        useEffect(() => {
            if (phase !== 'rendering' || !layoutRef.current) { return; }

            const unregisterMouseMove: () => void = registerChartEventHandler('mouseMove', (_e: Event, chart: Chart, ...args: (ChartEventArg | { x?: number; y?: number; targetId?: string })[]) => handleMouseMove(_e, chart, ...args), layoutRef.current?.element.id);
            const unregisterMouseClick: () => void = registerChartEventHandler('click', (_e: Event) => handleMouseClick(_e), layoutRef.current?.element.id);
            const unregisterMouseLeave: () => void = registerChartEventHandler('mouseLeave', () => handleMouseOut(), layoutRef.current?.element.id);

            return () => {
                unregisterMouseClick();
                unregisterMouseMove();
                unregisterMouseLeave();
            };
        }, [phase, layoutRef.current]);

        /**
         * Handles the mouse out event by resetting the hovered point index.
         *
         * @returns {void}
         */
        function handleMouseOut(): void { setHoveredPointIndex(null); }

        /**
         * Handles mouse move events on the chart, updating tooltip visibility and position.
         *
         * @param {Event} event - The chart object containing layout and data details.
         * @param {Chart} _chart - The current chart.
         * @param {ChartEventArg} args - Arguments.
         * @returns {void}
         */
        function handleMouseMove(event: Event, _chart?: Chart,
                                 ...args: (ChartEventArg | { x?: number; y?: number; targetId?: string })[]): void {
            let target: HTMLElement = (event?.target as HTMLElement);

            if (!target || !target.id) {
                const argObj: { targetId?: string; } = args.find((a: ChartEventArg | { x?: number; y?: number; targetId?: string }) => a && typeof a === 'object'
                    && ('targetId' in a || 'x' in a || 'y' in a)) as { targetId?: string };
                if (argObj?.targetId) {
                    target = document.getElementById(argObj.targetId) as HTMLElement;
                }
            }
            if (!target || !target.id) { return; }

            if (layoutRef.current?.visibleSeries?.[0]?.showBorderOnHover) {
                if (target.id.includes('_Series_') && target.id.includes('_Point_')) {
                    const pointIndex: number = indexFinder(target.id) as number;
                    if (!isNaN(pointIndex) && pointIndex !== hoveredPointIndex) { setHoveredPointIndex(pointIndex); }
                } else {
                    setHoveredPointIndex(null);
                }
            }
            if (centerLabel.hoverTextFormat) {
                updateCenterLabel(event);
            }
        }

        /**
         * Function to get format of pie data on mouse move.
         *
         * @param {Points} point - The point data.
         * @param {SeriesProperties} series - The series to which the point belongs.
         * @param {string} format - The format string for the data.
         * @returns {string} - The formatted data.
         */
        function parseFormat(point: Points, series: SeriesProperties, format: string): string {
            let value: RegExp;
            let textValue: string = '';
            const regExp: RegExpConstructor = RegExp;
            for (const dataValue of Object.keys(point)) {
                value = new regExp('${point' + '.' + dataValue + '}', 'gm');
                if (dataValue in point) {
                    format = format.replace(value.source, point[dataValue as keyof Points]?.toString());
                }
            }
            for (const dataValue of Object.keys(Object.getPrototypeOf(series))) {
                value = new regExp('${series' + '.' + dataValue + '}', 'gm');
                if (dataValue in series) {
                    textValue = series[dataValue as keyof SeriesProperties] as string;
                }
                format = format.replace(value.source, textValue as string);
            }
            return format;
        }

        /**
         * Updates the center label of the chart based on hover events, formatting and rendering dynamic text for the hovered pie slice.
         * This function retrieves pie data from the event, applies formatting, and triggers re-rendering of the center label.
         *
         * @param {Event} event - The mouse move event that triggers the center label update.
         *
         * @returns {void} This function does not return a value; it mutates the chart's format and re-renders the label.
         */
        function updateCenterLabel(event: Event): void {
            const data: AccPointData = getPieData(event as PointerEvent, layoutRef.current);
            if (data.point || previesPointData.current?.point) {
                previesPointData.current = data;
                const hoveredtext: string = data.point === null ? '' :
                    parseFormat(data.point as Points, layoutRef.current?.visibleSeries[0], centerLabel.hoverTextFormat as string);
                layoutRef.current.textHoverRenderResults = data.point === null ? [] : layoutRef.current.textHoverRenderResults;
                renderCenterLabel(centerLabel, layoutRef, hoveredtext);
                triggerCenterLabelRender(layoutRef.current?.element?.id);
            }
        }

        /**
         * Handles the click event on the chart to toggle explode/de-explode behavior for data points.
         *
         * @param {Event} event - The mouse click event triggered on the chart.
         * @returns {void}
         */
        function handleMouseClick(event: Event): void {
            const targetElement: HTMLElement = event.target as HTMLElement;
            if (targetElement.id.indexOf('_Series_') > -1 && targetElement.id.indexOf('_datalabel_') === -1) {
                const pointIndex: number = indexFinder(targetElement.id) as number;
                if (!isNaN(pointIndex)) {
                    setUserHasInteracted(true);
                    const series: SeriesProperties = layoutRef.current.visibleSeries[0];
                    const clickedPoint: Points = series.points[pointIndex as number];
                    setExplodedPointIndex(() => (clickedPoint?.isExplode ? null : pointIndex));
                    setHoveredPointIndex(undefined);
                }
            }
        }


        // Initial sweep animation
        useEffect(() => {
            const animation: Animation = props[0]?.animation as Animation;
            if (!animation?.enable || layoutRef.current.animateSeries) {
                setProgress(1);
                setIsInitialAnimationComplete(true);
                setSeriesAnimated(true);
                return;
            }
            if (phase !== 'rendering') {
                setProgress(0);
                setIsInitialAnimationComplete(false);
                setSeriesAnimated(false);
                return;
            }
            layoutRef.current.animateSeries = true;
            const duration: number = animation.duration as number;
            const start: number = performance.now();
            let animationFrameId: number;

            const animate: (time: number) => void = (time: number) => {
                const elapsed: number = time - start;
                const easedProgress: number = easeOutCubic(Math.min(elapsed / duration, 1));
                setProgress(easedProgress);
                if (elapsed < duration) {
                    animationFrameId = requestAnimationFrame(animate);
                } else {
                    setIsInitialAnimationComplete(true);
                    setSeriesAnimated(true);
                }
            };

            animationFrameId = requestAnimationFrame(animate);

            return () => { if (animationFrameId) { cancelAnimationFrame(animationFrameId); } };
        }, [phase, props[0]?.animation?.enable, props[0]?.animation?.duration, layoutRef]);

        useEffect(() => {
            if (isInitialAnimationComplete) {
                const timer: NodeJS.Timeout = setTimeout(() => { setStartExplodeTransition(true); }, 10);
                return () => clearTimeout(timer);
            } else {
                setStartExplodeTransition(false);
                return;
            }
        }, [isInitialAnimationComplete]);

        /**
         * Initializes pie chart-specific properties for the given chart and series.
         *
         * This function configures internal pie chart settings such as geometry, animation,
         * and rendering parameters based on the provided chart and series data.
         *
         * @param {Chart} chart - The chart instance that contains the pie series to be initialized.
         * @param {SeriesProperties} series - The configuration object containing values such as data points, colors, and labels for the pie chart.
         * @returns {void} This function does not return a value.
         */
        function initProperties(chart: Chart, series: SeriesProperties): void {
            const pieSeries: PieBase = chart.pieSeries;
            pieSeries.size = Math.min(chart.clipRect.width, chart.clipRect.height);
            initAngles(series, pieSeries);
            const pieCoefficient: number = 0.8;
            const r: number = parseInt(series.radius as string, 10);
            if ((series.radius?.indexOf('%') !== -1 || typeof r === 'number') && !isNaN(r)) {
                pieSeries.isRadiusMapped = false;
                pieSeries.pieBaseRadius = stringToNumber(series.radius, (series.border?.width as number) > 20 ?
                    (0.5 * pieCoefficient * pieSeries.size) : pieSeries.size / 2);
                pieSeries.innerRadius = stringToNumber(series.innerRadius, pieSeries.pieBaseRadius);
                pieSeries.pieBaseLabelRadius = (((pieSeries.pieBaseRadius - pieSeries.innerRadius) / 2) + pieSeries.innerRadius);
            } else {
                const radiusCollection: number[] = [];
                pieSeries.isRadiusMapped = true;
                for (let i: number = 0; i < Object.keys(series.points).length; i++) {
                    if (series.points[i as number].sliceRadius.indexOf('%') !== -1) {
                        radiusCollection[i as number] = stringToNumber(series.points[i as number].sliceRadius, pieSeries.size / 2);
                    } else {
                        radiusCollection[i as number] = parseInt(series.points[i as number].sliceRadius, 10);
                    }
                }
                const minRadius: number = Math.min.apply(null, radiusCollection);
                const maxRadius: number = Math.max.apply(null, radiusCollection);
                pieSeries.pieBaseRadius = pieSeries.seriesRadius = maxRadius;
                pieSeries.innerRadius = stringToNumber(series.innerRadius, pieSeries.seriesRadius);
                pieSeries.innerRadius = pieSeries.innerRadius > minRadius ? (pieSeries.innerRadius / 2) : pieSeries.innerRadius;
            }

            pieSeries.radius = pieSeries.pieBaseRadius;
            pieSeries.labelRadius = pieSeries.pieBaseLabelRadius;
            chart.explodeDistance = series.explode ? stringToNumber(series.explodeOffset, pieSeries.pieBaseRadius) : 0;
            if (phase === 'measuring') { findCenter(chart, series, pieSeries); }
            pieSeries.center = pieSeries.pieBaseCenter;
            pieSeries.totalAngle -= 0.001;
        }

        /**
         * Renders chart points based on a set of angular ranges.
         *
         * @param {Chart} accumulation - The chart instance where points will be rendered.
         * @param {ArcAngle[]} angles - An array of angular ranges (start and end angles) used to position each point.
         * @param {Points[]} pointsOverride - Optional array of points to override the default chart data.
         * @returns {void}
         */
        function renderPointsWithAngles(accumulation: Chart, angles: ArcAngle[], pointsOverride?: Points[]): void {
            const series: SeriesProperties = accumulation.visibleSeries[0];
            const pieSeries: PieBase = accumulation.pieSeries;
            const seriesPoints: Points[] = pointsOverride && pointsOverride.length ? pointsOverride : series.points;
            const pointId: string = accumulation.element.id + '_Series_' + series.index + '_Point_';
            series.elementOptions = [];
            for (let i: number = 0; i < Math.min(seriesPoints.length, angles.length); i++) {
                const point: Points = seriesPoints[i as number];
                point.percentage = (+(point.y / (series.sumOfPoints || 1) * 100).toFixed(2));
                const border: PieChartBorderProps = isEmpty(point, series) ? {
                    width: series.emptyPointSettings?.border?.width,
                    color: series.emptyPointSettings?.border?.color
                } : { width: series.border?.width, color: series.border?.color };
                const option: PathElementOption = {
                    id: pointId + point.index,
                    borderWidth: border.width as number,
                    borderColor: border.color as string,
                    opacity: series.opacity as number,
                    dashArray: border.dashArray as string,
                    d: '',
                    fill: point.color,
                    transform: 'translate(0, 0)',
                    borderDirection: '',
                    point: point
                };
                const startA: number = angles[i as number].start;
                const totalAngle: number = pieSeries.totalAngle;
                const rawDeg: number = angles[i as number].end - angles[i as number].start;
                const deg: number = (totalAngle < 359.999)
                    ? Math.max(0, Math.min(totalAngle, rawDeg))
                    : angleDelta(angles[i as number].start, angles[i as number].end);
                const midAngle: number = startA + deg / 2;
                point.originalMidAngle = point.midAngle = midAngle % 360;
                point.endAngle = (startA + deg) % 360;
                let isExplode: boolean = false;
                if (series.explode) {
                    isExplode = userHasInteracted ? (point.isExplode) :
                        (series.explodeAll || point.isExplode);
                }
                if (isExplode) {
                    const offset: PieChartLocationProps = degreeToLocation(midAngle, accumulation.explodeDistance, { x: 0, y: 0 });
                    option.transform = `translate(${offset.x}, ${offset.y})`;
                }
                const finalRadius: number = pieSeries.isRadiusMapped ?
                    stringToNumber(point.sliceRadius, pieSeries.size / 2) : pieSeries.radius;
                const innerR: number = pieSeries.innerRadius;
                const borderRadius: number = series.borderRadius || 0;
                const path: string = getPathArc(
                    pieSeries, startA % 360, (startA + deg) % 360, finalRadius, innerR, borderRadius, false, seriesPoints);
                const hoverRadiusOffset: number = 10;
                const borderPath: string = getPathArc(
                    pieSeries, startA % 360, (startA + deg) % 360, finalRadius + hoverRadiusOffset,
                    innerR > 0 ? innerR + hoverRadiusOffset : 0, borderRadius, false, seriesPoints);
                option.d = path;
                option.borderDirection = borderPath;
                const animatedRadius: number = ((finalRadius + innerR) / 2);
                point.symbolLocation = degreeToLocation(midAngle, animatedRadius, pieSeries.center);
                series.elementOptions.push(option);
                if (series.dataLabel && series.dataLabel.visible) {
                    const originalPoints: Points[] = series.points;
                    if (pointsOverride && pointsOverride.length) {
                        series.points = seriesPoints;
                    }
                    renderDataLabels(accumulation, series);
                    if (pointsOverride && pointsOverride.length) {
                        const n: number = Math.min(originalPoints.length, seriesPoints.length);
                        for (let i: number = 0; i < n; i++) {
                            originalPoints[i as number].midAngle = seriesPoints[i as number].midAngle;
                            originalPoints[i as number].originalMidAngle = seriesPoints[i as number].originalMidAngle;
                            originalPoints[i as number].endAngle = seriesPoints[i as number].endAngle;
                            originalPoints[i as number].symbolLocation = seriesPoints[i as number].symbolLocation;
                            originalPoints[i as number].labelRegion = seriesPoints[i as number].labelRegion;
                            originalPoints[i as number].labelPosition = seriesPoints[i as number].labelPosition;
                            originalPoints[i as number].labelAngle = seriesPoints[i as number].labelAngle;
                            originalPoints[i as number].textSize = seriesPoints[i as number].textSize;
                            originalPoints[i as number].labelVisible = seriesPoints[i as number].labelVisible;
                            originalPoints[i as number].labelCollection = seriesPoints[i as number].labelCollection;
                            originalPoints[i as number].marginValue = seriesPoints[i as number].marginValue;
                            originalPoints[i as number].argsData = seriesPoints[i as number].argsData;
                        }
                    }
                    series.points = originalPoints;
                }
            }
        }

        /**
         * Renders all points (slices) in the first visible series of the accumulation chart.
         *
         * @param {Chart} accumulation - The chart instance containing series and rendering context.
         * @returns {void} This function does not return any value.
         */
        function renderPoints(accumulation: Chart): void {
            const series: SeriesProperties = accumulation.visibleSeries[0];
            const pointId: string = accumulation.element.id + '_Series_' + series.index + '_Point_';
            for (const point of series.points) {
                point.percentage = (+(point.y / (series.sumOfPoints || 1) * 100).toFixed(2));
                const border: PieChartBorderProps = isEmpty(point, series) ? {
                    width: series.emptyPointSettings?.border?.width,
                    color: series.emptyPointSettings?.border?.color,
                    dashArray: series.emptyPointSettings?.border?.dashArray
                } : { width: series.border?.width, color: series.border?.color, dashArray: series.border?.dashArray };
                const pathElementOption: PathElementOption = {
                    id: pointId + point.index,
                    borderWidth: border.width as number,
                    borderColor: border.color as string,
                    opacity: series.opacity as number,
                    dashArray: border.dashArray as string,
                    d: '',
                    fill: point.color,
                    transform: 'translate(0, 0)',
                    borderDirection: '',
                    point: point
                };
                const elementOption: PathElementOption = renderPoint(point, series, accumulation, pathElementOption);
                series.elementOptions.push(elementOption);
            }
        }

        /**
         * Renders a single chart point (e.g., pie or doughnut slice) using the provided path options.
         *
         * @param {Points} point - The data point to be rendered.
         * @param {SeriesProperties} series - The series configuration containing chart data and settings.
         * @param {Chart} chart - The chart instance where the point will be rendered.
         * @param {PathElementOption} option - The path configuration options for rendering the slice.
         * @returns {PathElementOption} Returns the updated path element options after rendering.
         */
        function renderPoint(point: Points, series: SeriesProperties, chart: Chart, option: PathElementOption): PathElementOption {
            const pieSeries: PieBase = chart.pieSeries;
            const sum: number = series.sumOfPoints;
            const seriesPoints: Points[] = chart.visibleSeries[0].points;
            const borderRadius: number = series.borderRadius || 0;
            point.startAngle = pieSeries.startAngle;
            const yValue: number = point.visible ? point.y : 0;

            const degree: number = (sum) ? ((Math.abs(yValue) / sum) * (pieSeries.totalAngle * progres)) : 0;
            const midAngle: number = pieSeries.startAngle + (degree / 2);

            let isExplode: boolean = false;
            if (series.explode) {
                if (userHasInteracted) {
                    isExplode = point.isExplode;
                } else {
                    isExplode = series.explodeAll || point.isExplode;
                }
            }

            if (isExplode) {
                const offset: PieChartLocationProps = degreeToLocation(midAngle, chart.explodeDistance, { x: 0, y: 0 });
                option.transform = `translate(${offset.x}, ${offset.y})`;
            }

            const start: number = Math.PI / 180 * ((90 - (360 - pieSeries.startAngle)) - 90);
            pieSeries.radius = pieSeries.isRadiusMapped ? stringToNumber(point.sliceRadius, pieSeries.seriesRadius) : pieSeries.radius;
            const pieSlicePaths: { fillPath: string, borderPath: string } =
                getPathOption(pieSeries, point, degree, pieSeries.startAngle % 360, borderRadius, seriesPoints);
            option.d = pieSlicePaths.fillPath;
            pieSeries.originalStartAngle += (sum) ? ((Math.abs(yValue) / sum) * (pieSeries.totalAngle)) : 0;
            option.borderDirection = pieSlicePaths.borderPath;
            point.midAngle = (pieSeries.startAngle - (degree / 2)) % 360;
            point.endAngle = pieSeries.startAngle % 360;
            point.originalMidAngle = (pieSeries.originalStartAngle -
                (((sum) ? ((Math.abs(yValue) / sum) * (pieSeries.totalAngle)) : 0) / 2)) % 360;
            const finalRadius: number = pieSeries.isRadiusMapped ?
                stringToNumber(point.sliceRadius, pieSeries.seriesRadius) : pieSeries.pieBaseRadius;
            const animatedRadius: number = ((finalRadius + pieSeries.innerRadius) / 2) * progres;
            point.symbolLocation = degreeToLocation(midAngle, animatedRadius, pieSeries.center);

            if (point.degree === undefined) {
                point.degree = degree;
                point.start = start;
            }
            return option;
        }

        /**
         * Generates the SVG path string for a pie slice based on its angle, radius, and corner styling.
         *
         * @param {PieBase} pieSeries - The pie series configuration object.
         * @param {Points} point - The data point representing the slice.
         * @param {number} degree - The angular span of the slice in degrees.
         * @param {number} startAngle - The starting angle of the slice in degrees.
         * @param {number} borderRadius - The radius to apply to the slice corners for rounded edges.
         * @param {Points[]} seriesPoints - Array of point objects representing all slices in the series.
         * @returns {string} Returns the SVG path string representing the pie slice.
         */
        function getPathOption(
            pieSeries: PieBase, point: Points, degree: number, startAngle: number,
            borderRadius: number, seriesPoints: Points[]): { fillPath: string, borderPath: string } {
            const animatedDegree: number = Math.max(degree, 0.0001);
            if (!animatedDegree) {
                return { fillPath: '', borderPath: '' };
            }

            const finalRadius: number = pieSeries.isRadiusMapped
                ? stringToNumber(point.sliceRadius, pieSeries.size / 2)
                : pieSeries.radius;
            const animatedOuterRadius: number = finalRadius * progres;
            const animatedInnerRadius: number = pieSeries.innerRadius * progres;

            // Normalize angles and avoid end==start for single-slice/full-circle cases
            const normStart: number = ((startAngle % 360) + 360) % 360;
            const isFullSweep: boolean = animatedDegree >= (pieSeries.totalAngle - 0.0005);
            const rawEnd: number = isFullSweep ? (startAngle + animatedDegree - 0.001) : (startAngle + animatedDegree);
            const normEnd: number = ((rawEnd % 360) + 360) % 360;

            const path: string = getPathArc(
                pieSeries,
                normStart, normEnd,
                animatedOuterRadius,
                animatedInnerRadius,
                borderRadius,
                false,
                seriesPoints
            );
            const hoverRadiusOffset: number = 10;
            const borderpath: string = getPathArc(
                pieSeries,
                normStart, normEnd,
                animatedOuterRadius + hoverRadiusOffset,
                animatedInnerRadius > 0 ? animatedInnerRadius + hoverRadiusOffset : 0,
                borderRadius,
                false,
                seriesPoints
            );

            pieSeries.startAngle += degree;
            return { fillPath: path, borderPath: borderpath };
        }

        const visibleSeries: SeriesProperties = layoutRef.current?.visibleSeries?.[0];

        useEffect(() => {
            if (borderAnimationTimeoutRef.current) {
                clearTimeout(borderAnimationTimeoutRef.current);
                borderAnimationTimeoutRef.current = null;
            }

            if (!visibleSeries?.showBorderOnHover || !startExplodeTransition) {
                if (hoverBorderProps) {
                    setHoverBorderProps(null);
                }
                return;
            }
            const elementOptions: PathElementOption[] = visibleSeries.elementOptions;

            if (hoveredPointIndex !== null && hoveredPointIndex !== undefined && elementOptions?.[hoveredPointIndex as number] &&
                (!visibleSeries.explode || !visibleSeries.points[hoveredPointIndex as number].isExplode)) {
                const pointOptions: PathElementOption = elementOptions[hoveredPointIndex as number];
                if (hoverBorderProps?.key === hoveredPointIndex && hoverBorderProps.opacity > 0) { return; }
                setHoverBorderProps({
                    key: hoveredPointIndex,
                    d: pointOptions.borderDirection,
                    transform: pointOptions.transform,
                    fill: pointOptions.fill,
                    opacity: 0.25,
                    style: { transition: 'opacity 0.1s linear', pointerEvents: 'none' }
                });
            } else if (hoverBorderProps && hoverBorderProps.opacity > 0) {
                const lastHoveredIndex: number = hoverBorderProps.key;
                if (elementOptions?.[lastHoveredIndex as number]) {
                    const pointOptions: PathElementOption = elementOptions[lastHoveredIndex as number];
                    setHoverBorderProps({
                        ...hoverBorderProps,
                        d: pointOptions.d,
                        opacity: 0,
                        style: { transition: (hoveredPointIndex !== undefined ? 'd 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.4s' : ''), pointerEvents: 'none' }
                    });
                }
            }

            return () => {
                if (borderAnimationTimeoutRef.current) {
                    clearTimeout(borderAnimationTimeoutRef.current);
                }
            };
        }, [hoveredPointIndex, startExplodeTransition, visibleSeries?.elementOptions]);

        /**
         * Temporarily disables and re-enables explode CSS transitions across two rAF frames
         * and performs a layout read to force a reflow, ensuring transforms animate even when
         * slices are newly mounted (e.g., when expanding/collapsing grouped points).
         */
        /**
         * Force explode animations to run reliably.
         * - When mounting new slice elements (group expand/collapse to a new set), toggle transitions off then on.
         * - For live updates (de-exploding an existing slice), keep transitions on and just force a reflow.
         *
         * @param {boolean} toggle - Whether to toggle the startExplodeTransition flag (use true for mount cases)
         * @returns {void}
         */
        function kickExplodeTransition(toggle: boolean): void {
            if (toggle) {
                setStartExplodeTransition(false);
                requestAnimationFrame(() => {
                    const el: HTMLElement | undefined = layoutRef.current?.element as unknown as HTMLElement;
                    if (el && typeof (el as HTMLElement).getBoundingClientRect === 'function') {
                        void (el as HTMLElement).getBoundingClientRect(); // layout read to ensure reflow
                    }
                    requestAnimationFrame(() => {
                        setStartExplodeTransition(true);
                    });
                });
            } else {
                // Ensure transitions remain enabled, but force a layout read so transform change animates back to origin
                if (!startExplodeTransition) { setStartExplodeTransition(true); }
                const el: HTMLElement | undefined = layoutRef.current?.element as unknown as HTMLElement;
                if (el && typeof (el as HTMLElement).getBoundingClientRect === 'function') {
                    void (el as HTMLElement).getBoundingClientRect();
                }
            }
        }

        const explodeTransition: string = 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';

        return (
            phase === 'rendering' && visibleSeries && (
                <>
                    <g
                        id={layoutRef.current.element.id + '_Series_' + visibleSeries.index}
                        ref={ref}
                        aria-hidden='false'
                        role='region'
                    >
                        {visibleSeries.showBorderOnHover && hoverBorderProps && (
                            <path
                                id={`${layoutRef.current.element.id}_hover_border`}
                                key={hoverBorderProps.key}
                                d={hoverBorderProps.d}
                                transform={hoverBorderProps.transform}
                                fill={hoverBorderProps.fill}
                                opacity={hoverBorderProps.opacity}
                                style={hoverBorderProps.style}
                            />
                        )}
                        {elementOptions.map((option: PathElementOption) => (
                            <path
                                key={option.id}
                                id={option.id}
                                d={option.d}
                                stroke={option.borderColor || ((layoutRef.current.theme?.indexOf('Dark') as number) > -1 ? '#000000' : '#FFFFFF')}
                                strokeWidth={option.borderWidth}
                                fill={option.fill}
                                strokeDasharray={option.dashArray}
                                transform={startExplodeTransition ? option.transform : 'translate(0,0)'}
                                style={{
                                    transition: `${startExplodeTransition ? explodeTransition : 'none'}`,
                                    outline: 'none',
                                    visibility: (((layoutRef.current as Chart)?.isLegendClicked) && option.point && option.point.visible === false) ? 'hidden' : 'visible'
                                }}
                                role={visibleSeries.accessibility?.role ? visibleSeries.accessibility.role : 'img'}
                                tabIndex={visibleSeries.accessibility?.focusable ? visibleSeries.accessibility.tabIndex : -1}
                                aria-label={(visibleSeries.accessibility?.ariaLabel ? visibleSeries.accessibility.ariaLabel : `${option.point.x}: ${option.point.y}%. ${visibleSeries.name} `)}
                            />
                        ))}
                    </g>
                    {/* DataLabel group */}
                    {visibleSeries.dataLabel?.visible && (
                        <g id={`${layoutRef.current.element.id}_datalabel_Series_${visibleSeries.index}`} opacity={progres < 0.8 ? 0 : progres} style={{ visibility: 'visible' }}>
                            {visibleSeries.points.map((point: Points) => {
                                if (!point.visible || !point.labelVisible || !point.labelRegion || !point.argsData) { return null; }
                                const idRoot: string = `${layoutRef.current.element.id}_datalabel_Series_${visibleSeries.index}`;
                                const margin: number = point.marginValue || 0;
                                const labelRegion: Rect = point.labelRegion as Rect;
                                const textSize: { width: number; height: number } = point.textSize as { width: number; height: number };
                                const labelLines: string[] = point.labelCollection && point.labelCollection.length ? point.labelCollection : [point.text || point.label || ''];
                                const dataLabel: PieChartDataLabelProps = visibleSeries.dataLabel as PieChartDataLabelProps;
                                const font: PieChartFontProps = point.argsData.font;
                                const fill: string = point.argsData.color || 'transparent';
                                const border: PieChartBorderProps = point.argsData.border || {} as PieChartBorderProps;
                                const rx: number = dataLabel.rx as number;
                                const ry: number = dataLabel.ry as number;
                                const isOutside: boolean = (point.labelPosition === 'Outside' || dataLabel.position === 'Outside');
                                let explodeTransform: string = 'translate(0,0)';
                                if (visibleSeries.explode) {
                                    const isExplode: boolean = userHasInteracted ? !!point.isExplode : (visibleSeries.explodeAll ||
                                        !!point.isExplode);
                                    if (isExplode) {
                                        const offset: PieChartLocationProps =
                                            degreeToLocation(point.originalMidAngle, layoutRef.current.explodeDistance, { x: 0, y: 0 });
                                        explodeTransform = `translate(${offset.x}, ${offset.y})`;
                                    }
                                }
                                const textX: number = labelRegion.x + margin + 1; // +1 to avoid touching border
                                const textYBase: number = labelRegion.y + (textSize.height * 3 / (labelLines.length * 4)) + margin;
                                const textAnchor: string = (layoutRef.current.enableRtl ? 'end' : 'start') as string;
                                const configuredAngle: number = typeof dataLabel.rotationAngle === 'number' ? (dataLabel.rotationAngle as number) : 0;
                                const degree: number = (dataLabel.enableRotation && point.labelAngle !== undefined)
                                    ? (configuredAngle === 0 ? (isOutside ? 0 : (point.originalMidAngle >= 90 &&
                                        point.originalMidAngle <= 260 ? point.originalMidAngle + 180 : point.originalMidAngle))
                                        : (Math.abs(configuredAngle) > 360 ? (configuredAngle % 360) : configuredAngle)) : 0;
                                const rotate: string = `rotate(${degree}, ${textX + (textSize.width / 2)}, ${textYBase})`;
                                const connectorPath: string = isOutside ? buildConnectorPath(point, layoutRef.current) : '';
                                return (
                                    <g id={`${idRoot}_g_${point.index}`} key={`${idRoot}_g_${point.index}`} aria-hidden="true"
                                        transform={startExplodeTransition ? explodeTransform : 'translate(0,0)'}
                                        style={{ transition: `${startExplodeTransition ? explodeTransition : 'none'}` }}>
                                        <rect
                                            id={`${idRoot}_shape_${point.index}`}
                                            opacity={progres < 0.8 ? 0 : progres}
                                            fill={fill || 'transparent'}
                                            stroke={border.color as string || ''}
                                            strokeWidth={border.width as number | undefined}
                                            strokeDasharray={visibleSeries.dataLabel?.border?.dashArray as string | undefined}
                                            x={labelRegion.x}
                                            y={labelRegion.y}
                                            width={labelRegion.width}
                                            height={labelRegion.height}
                                            rx={rx as number}
                                            ry={ry as number}
                                            transform={rotate}
                                        />
                                        <text
                                            id={`${idRoot}_text_${point.index}`}
                                            x={textX}
                                            y={textYBase}
                                            fill={font?.color}
                                            fontSize={(font as PieChartFontProps)?.fontSize}
                                            fontStyle={font?.fontStyle as string}
                                            fontFamily={font?.fontFamily as string}
                                            fontWeight={font?.fontWeight as string}
                                            textAnchor={textAnchor as TextAnchor}
                                            transform={rotate}
                                            dominantBaseline="auto"
                                        >
                                            {Array.isArray(labelLines) && labelLines.length > 1 ? (
                                                labelLines.map((ln: string, i: number) => {
                                                    const lineHeight: number = (textSize.height && labelLines.length) ?
                                                        (textSize.height / labelLines.length) : 12;
                                                    return (
                                                        <tspan x={textX} y={textYBase + (i * lineHeight)} key={i}>{ln}</tspan>
                                                    );
                                                })
                                            ) : (
                                                labelLines[0]
                                            )}
                                        </text>
                                        {isOutside && connectorPath && (
                                            <path
                                                id={`${idRoot}_connector_${point.index}`}
                                                opacity={progres < 0.8 ? 0 : progres}
                                                fill="transparent"
                                                stroke={(visibleSeries.dataLabel?.connectorStyle?.color as string) || point.color}
                                                strokeWidth={visibleSeries.dataLabel?.connectorStyle?.width as number}
                                                strokeDasharray={visibleSeries.dataLabel?.connectorStyle?.dashArray as string}
                                                d={connectorPath}
                                            />
                                        )}
                                    </g>
                                );
                            })}
                        </g>
                    )}
                </>
            )
        );
    });

