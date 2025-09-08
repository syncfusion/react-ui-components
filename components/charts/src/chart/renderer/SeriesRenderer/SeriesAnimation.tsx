import { getPathLength, valueToCoefficient } from '../../utils/helper';
import { PathCommand } from '../../common/base';
import { interpolateSteplinePathD } from './StepLineSeriesRenderer';
import { StepPosition } from '../../base/enum';
import { interpolateSplinePathD } from './SplineSeriesRenderer';
import { Points, RenderOptions, SeriesProperties } from '../../chart-area/chart-interfaces';
import { interpolateBorderPath } from './AreaSeriesRenderer';
import { ChartLocationProps } from '../../base/interfaces';

export interface AnimationState {
    previousPathLengthRef: React.MutableRefObject<number[]>;
    isInitialRenderRef: React.MutableRefObject<boolean[]>;
    renderedPathDRef: React.MutableRefObject<string[]>;
    animationProgress: number;
    isFirstRenderRef: React.MutableRefObject<boolean>;
    previousSeriesOptionsRef: React.MutableRefObject<RenderOptions[][]>;
}

/**
 * Calculates the length of a path based on its SVG path data.
 *
 * @param {string} d - The SVG path data string
 * @returns {number} The length of the path, or 0 if no path data is provided
 */
export const calculatePathLength: (d?: string | undefined) => number = (d?: string): number => {
    return d ? getPathLength(d) : 0;
};


/**
 * Applies an easing function to the progress for smoother animations.
 *
 * @param {number} progress - The animation progress value between 0 and 1
 * @returns {number} The eased progress value
 */
export const easeIn: (progress: number) => number = (progress: number): number => progress * progress;

/**
 * Interpolates between two path data strings based on animation progress.
 *
 * @param {string} fromD - The starting path data string
 * @param {string} toD - The ending path data string
 * @param {number} progress - The animation progress value between 0 and 1
 * @param {boolean} legendClicked - Denotes whether legend is clicked
 * @param {string} type - Type of series
 * @returns {string} The interpolated path data at the specified progress
 * @private
 */
export function interpolatePathD(fromD: string, toD: string, progress: number, legendClicked?: boolean, type?: string): string {
    if (fromD !== undefined && toD !== undefined) {
    // Check if this involves spline series (contains cubic bezier 'C' commands)
        if (fromD.includes('C') || toD.includes('C')) {
            return interpolateSplinePathD(fromD, toD, progress);
        }

        const parsePath: (d: string) => [number, number][] = (d: string): [number, number][] =>
            d.replace(/[ML]/g, '')
                .trim()
                .split(/\s+/)
                .reduce<[number, number][]>((acc: [number, number][], val: string, i: number, arr: string[]): [number, number][] => {
                if (i % 2 === 0) {
                    acc.push([parseFloat(val), parseFloat(arr[i + 1])]);
                }
                return acc;
            }, []);

        const interpolatePoints: (from: [number, number][], to: [number, number][], t: number) => [number, number][] =
    (from: [number, number][], to: [number, number][], t: number): [number, number][] => {
        const result: [number, number][] = [];
        let toIndex: number = 0;
        const EPSILON: number = 0.01;

        for (let i: number = 0; i < from.length; i++) {
            const [fx, fy] = from[i as number];
            let matched: boolean = false;

            for (let k: number = toIndex; k < to.length; k++) {
                const [tx, ty] = to[k as number];
                if (Math.abs(fx - tx) < EPSILON && Math.abs(fy - ty) < EPSILON) {
                    result.push([fx, fy]);
                    toIndex = k + 1;
                    matched = true;
                    break;
                }
            }

            void (!matched &&
        (
            () => {
                const prev: [number, number] = to[toIndex - 1];
                const next: [number, number] = to[toIndex as number];
                const [tx, ty] = prev || next;
                const x: number = fx + (tx - fx) * t;
                const y: number = fy + (ty - fy) * t;
                void (t < 1 && result.push([x, y]));
            }
        )()
            );
        }
        return result;
    };

        const fromParts: RegExpMatchArray | [] = fromD?.match(/[a-zA-Z]|-?\d+\.?\d*/g) as RegExpMatchArray;
        const toParts: RegExpMatchArray | [] = toD?.match(/[a-zA-Z]|-?\d+\.?\d*/g) as RegExpMatchArray;

        if (fromParts?.length !== toParts?.length) {
            const clamp: (v: number, min?: number, max?: number) => number = (v: number, min: number = 0, max: number = 1): number =>
                Math.max(min, Math.min(v, max));
            const t: number = clamp(progress);
            const fromPoints: [number, number][] = parsePath(fromD);
            const toPoints: [number, number][] = parsePath(toD);

            const interpolatedPoints: [number, number][] = interpolatePoints(fromPoints, toPoints, t);

            return interpolatedPoints
                .map(([x, y]: [number, number], i: number) => (i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`))
                .join(' ');
        }

        return fromParts.map((fromVal: string, i: number) => {
            if (isNaN(Number(fromVal))) { return fromVal; }
            const fromNum: number = parseFloat(fromVal);
            const toNum: number = parseFloat(toParts[i as number]);
            const easedProgress: number = easeIn(progress);
            const interpolated: number = fromNum + (toNum - fromNum) * (legendClicked && type === 'Spline' ? progress : easedProgress);
            return interpolated.toString();
        }).join(' ');
    }

    // Default return value if conditions above aren't met
    return toD || fromD || '';
}

/**
 * Handles dashed line animation separately using path truncation
 *
 * @param {Object} pathOptions The path rendering options
 * @param {AnimationState} state Animation state including references and animation progress
 * @returns {Object} Object with animation properties for dashed lines
 */
export const calculateDashedPathAnimation: (pathOptions: RenderOptions, state: AnimationState) => {
    strokeDasharray: string;
    strokeDashoffset: number;
    interpolatedD: string;
} = (
    pathOptions: RenderOptions,
    state: AnimationState
): { strokeDasharray: string; strokeDashoffset: number; interpolatedD: string } => {
    const { animationProgress } = state;

    if (/[cCsS]/.test(pathOptions.d as string)) {
        return calculateSplineDashedPathAnimation(pathOptions, state);
    }

    // Parse path commands to get points
    const pathCommands: RegExpMatchArray = pathOptions.d.match(/[MLHVCSQTAZ][^MLHVCSQTAZ]*/gi) as RegExpMatchArray;
    const points: { x: number; y: number }[] = [];

    pathCommands.forEach((cmd: string) => {
        const coords: RegExpMatchArray = cmd.match(/-?\d+\.?\d*/g) as RegExpMatchArray;
        void (coords.length >= 2 && coords[0] && coords[1] && void points.push({
            x: parseFloat(coords[0]),
            y: parseFloat(coords[1])
        }));
    });

    // Calculate cumulative distances
    const distances: number[] = [0];
    let totalDistance: number = 0;

    for (let i: number = 1; i < points.length; i++) {
        const dx: number = points[i as number].x - points[i - 1].x;
        const dy: number = points[i as number].y - points[i - 1].y;
        const distance: number = Math.sqrt(dx * dx + dy * dy);
        totalDistance += distance;
        distances.push(totalDistance);
    }

    // Find target distance based on animation progress
    const targetDistance: number = totalDistance * animationProgress;

    // Build animated path up to target distance
    let animatedPath: string = `M ${points[0].x} ${points[0].y}`;
    let currentDistance: number = 0;
    for (let i: number = 1; i < points.length; i++) {
        const segmentDistance: number = distances[i as number] - distances[i - 1];
        if (currentDistance + segmentDistance <= targetDistance) {
            // Include complete segment
            animatedPath += ` L ${points[i as number].x} ${points[i as number].y}`;
            currentDistance += segmentDistance;
        } else {
            // Include partial segment
            const remainingDistance: number = targetDistance - currentDistance;
            const ratio: number = remainingDistance / segmentDistance;
            const prevPoint: {
                x: number;
                y: number;
            } = points[i - 1];
            const currPoint: {
                x: number;
                y: number;
            } = points[i as number];
            const interpX: number = prevPoint.x + (currPoint.x - prevPoint.x) * ratio;
            const interpY: number = prevPoint.y + (currPoint.y - prevPoint.y) * ratio;
            animatedPath += ` L ${interpX} ${interpY}`;
            break;
        }
    }
    return {
        strokeDasharray: pathOptions.dashArray as string,
        strokeDashoffset: 0,
        interpolatedD: animatedPath
    };
};

/**
 * Handles dashed line animation for spline paths by keeping the path cubic (M/C only).
 * It truncates the last cubic at the exact arc-length using De Casteljau splitting,
 * so the dash pattern remains consistent with the final rendered spline.
 *
 * @param {Object} pathOptions The path rendering options (expects 'd' and 'dashArray')
 * @param {AnimationState} state Animation state including references and animation progress
 * @returns {Object} Object with animation properties for dashed lines
 */
export const calculateSplineDashedPathAnimation: (
    pathOptions: RenderOptions,
    state: AnimationState
) => {
    strokeDasharray: string;
    strokeDashoffset: number;
    interpolatedD: string;
} = (
    pathOptions: RenderOptions,
    state: AnimationState
): { strokeDasharray: string; strokeDashoffset: number; interpolatedD: string } => {
    const { animationProgress }: { animationProgress: number } = state;
    const pathData: string = String(pathOptions.d ?? '');

    if (!pathData) {
        return {
            strokeDasharray: (pathOptions.dashArray as string) ?? 'none',
            strokeDashoffset: 0,
            interpolatedD: ''
        };
    }

    const tGlobal: number = Math.max(0, Math.min(1, animationProgress));
    if (tGlobal >= 1) {
        return {
            strokeDasharray: (pathOptions.dashArray as string) ?? 'none',
            strokeDashoffset: 0,
            interpolatedD: pathData
        };
    }

    const distanceBetweenPoints: (a: ChartLocationProps, b: ChartLocationProps) => number =
            (a: ChartLocationProps, b: ChartLocationProps): number => Math.hypot(b.x - a.x, b.y - a.y);
    const interpolatePoint: (a: ChartLocationProps, b: ChartLocationProps, t: number) => ChartLocationProps =
            (a: ChartLocationProps, b: ChartLocationProps, t: number): ChartLocationProps => ({
                x: a.x + (b.x - a.x) * t,
                y: a.y + (b.y - a.y) * t
            });

    const getCubicPoint: (p0: ChartLocationProps, p1: ChartLocationProps, p2: ChartLocationProps, p3: ChartLocationProps,
        t: number) => ChartLocationProps = (p0: ChartLocationProps, p1: ChartLocationProps, p2: ChartLocationProps,
                                            p3: ChartLocationProps, t: number): ChartLocationProps => {
        const mt: number = 1 - t;
        const a: number = mt * mt * mt;
        const b: number = 3 * mt * mt * t;
        const c: number = 3 * mt * t * t;
        const d: number = t * t * t;
        return {
            x: a * p0.x + b * p1.x + c * p2.x + d * p3.x,
            y: a * p0.y + b * p1.y + c * p2.y + d * p3.y
        };
    };

    const splitCubicFirstHalf: (p0: ChartLocationProps, p1: ChartLocationProps, p2: ChartLocationProps, p3: ChartLocationProps,
        t: number) => [ChartLocationProps, ChartLocationProps, ChartLocationProps, ChartLocationProps] = (p0: ChartLocationProps
        , p1: ChartLocationProps, p2: ChartLocationProps, p3: ChartLocationProps, t: number): [ChartLocationProps,
        ChartLocationProps, ChartLocationProps, ChartLocationProps] => {
        const p01: ChartLocationProps = interpolatePoint(p0, p1, t);
        const p12: ChartLocationProps = interpolatePoint(p1, p2, t);
        const p23: ChartLocationProps = interpolatePoint(p2, p3, t);
        const p012: ChartLocationProps = interpolatePoint(p01, p12, t);
        const p123: ChartLocationProps = interpolatePoint(p12, p23, t);
        const p0123: ChartLocationProps = interpolatePoint(p012, p123, t);
        return [p0, p01, p012, p0123];
    };

    const getCubicLength: (p0: ChartLocationProps, p1: ChartLocationProps, p2: ChartLocationProps, p3: ChartLocationProps,
        samples?: number) => number = (p0: ChartLocationProps, p1: ChartLocationProps, p2: ChartLocationProps,
                                       p3: ChartLocationProps, samples: number = 32): number => {
        let length: number = 0;
        let previousPoint: ChartLocationProps = p0;
        for (let i: number = 1; i <= samples; i++) {
            const t: number = i / samples;
            const currentPoint: ChartLocationProps = getCubicPoint(p0, p1, p2, p3, t);
            length += distanceBetweenPoints(previousPoint, currentPoint);
            previousPoint = currentPoint;
        }
        return length;
    };

    const getPartialCubicLength: (p0: ChartLocationProps, p1: ChartLocationProps, p2: ChartLocationProps,
        p3: ChartLocationProps, t: number, samples?: number) => number =
        (p0: ChartLocationProps, p1: ChartLocationProps, p2: ChartLocationProps, p3: ChartLocationProps,
         t: number, samples: number = 32): number => {
            if (t <= 0) {return 0; }
            if (t >= 1) {return getCubicLength(p0, p1, p2, p3, samples); }

            let length: number = 0;
            let previousPoint: ChartLocationProps = p0;
            const steps: number = Math.max(2, Math.round(samples * t));
            for (let i: number = 1; i <= steps; i++) {
                const ti: number = (i / steps) * t;
                const currentPoint: ChartLocationProps = getCubicPoint(p0, p1, p2, p3, ti);
                length += distanceBetweenPoints(previousPoint, currentPoint);
                previousPoint = currentPoint;
            }
            return length;
        };

    const commands: PathCommand[] = parsePathCommands(pathData);
    if (commands.length === 0) {
        return {
            strokeDasharray: (pathOptions.dashArray as string) ?? 'none',
            strokeDashoffset: 0,
            interpolatedD: pathData
        };
    }

    let cursor: ChartLocationProps = { x: 0, y: 0 };
    let interpolatedPath: string = '';
    let totalPathLength: number = 0;

    {
        let currentPoint: ChartLocationProps = cursor;
        for (const command of commands) {
            if (command.type === 'M' && command.params.length >= 2) {
                currentPoint = { x: command.params[0], y: command.params[1] };
            } else if (command.type === 'L' && command.params.length >= 2) {
                const nextPoint: ChartLocationProps = { x: command.params[0], y: command.params[1] };
                totalPathLength += distanceBetweenPoints(currentPoint, nextPoint);
                currentPoint = nextPoint;
            } else if (command.type === 'C' && command.params.length >= 6) {
                const p0: ChartLocationProps = currentPoint;
                const p1: ChartLocationProps = { x: command.params[0], y: command.params[1] };
                const p2: ChartLocationProps = { x: command.params[2], y: command.params[3] };
                const p3: ChartLocationProps = { x: command.params[4], y: command.params[5] };
                totalPathLength += getCubicLength(p0, p1, p2, p3);
                currentPoint = p3;
            }
        }
    }

    const targetLength: number = totalPathLength * tGlobal;
    let accumulatedLength: number = 0;
    let hasStarted: boolean = false;
    cursor = { x: 0, y: 0 };

    for (const command of commands) {
        if (command.type === 'M' && command.params.length >= 2) {
            cursor = { x: command.params[0], y: command.params[1] };
            interpolatedPath += hasStarted ? ` M ${cursor.x} ${cursor.y}` : `M ${cursor.x} ${cursor.y}`;
            hasStarted = true;
        } else if (command.type === 'L' && command.params.length >= 2) {
            const nextPoint: ChartLocationProps = { x: command.params[0], y: command.params[1] };
            const segmentLength: number = distanceBetweenPoints(cursor, nextPoint);
            if (accumulatedLength + segmentLength <= targetLength) {
                interpolatedPath += ` L ${nextPoint.x} ${nextPoint.y}`;
                accumulatedLength += segmentLength;
                cursor = nextPoint;
            } else {
                const remainingLength: number = targetLength - accumulatedLength;
                const ratio: number = segmentLength === 0 ? 0 : remainingLength / segmentLength;
                const endPoint: ChartLocationProps = interpolatePoint(cursor, nextPoint, Math.max(0, Math.min(1, ratio)));
                interpolatedPath += ` L ${endPoint.x} ${endPoint.y}`;
                accumulatedLength = targetLength;
                break;
            }
        } else if (command.type === 'C' && command.params.length >= 6) {
            const p0: ChartLocationProps = cursor;
            const p1: ChartLocationProps = { x: command.params[0], y: command.params[1] };
            const p2: ChartLocationProps = { x: command.params[2], y: command.params[3] };
            const p3: ChartLocationProps = { x: command.params[4], y: command.params[5] };
            const segmentLength: number = getCubicLength(p0, p1, p2, p3);

            if (accumulatedLength + segmentLength <= targetLength) {
                interpolatedPath += ` C ${p1.x} ${p1.y} ${p2.x} ${p2.y} ${p3.x} ${p3.y}`;
                accumulatedLength += segmentLength;
                cursor = p3;
            } else {
                const requiredLength: number = targetLength - accumulatedLength;
                let low: number = 0;
                let high: number = 1;
                for (let i: number = 0; i < 12; i++) {
                    const mid: number = (low + high) / 2;
                    const lengthAtMid: number = getPartialCubicLength(p0, p1, p2, p3, mid);
                    if (lengthAtMid < requiredLength) {
                        low = mid;
                    } else {
                        high = mid;
                    }
                }
                const tSplit: number = (low + high) / 2;
                const [, q1, q2, q3]: [ChartLocationProps, ChartLocationProps, ChartLocationProps,
                    ChartLocationProps] = splitCubicFirstHalf(p0, p1, p2, p3, tSplit);
                interpolatedPath += ` C ${q1.x} ${q1.y} ${q2.x} ${q2.y} ${q3.x} ${q3.y}`;
                accumulatedLength = targetLength;
                cursor = q3;
                break;
            }
        }
    }

    return {
        strokeDasharray: (pathOptions.dashArray as string) ?? 'none',
        strokeDashoffset: 0,
        interpolatedD: interpolatedPath
    };
};

/**
 * Handles the initial animation for a path.
 *
 * @param {RenderOptions} pathOptions - The path rendering options
 * @param {AnimationState} state - Animation state including references and progress
 * @param {number} index - The series index
 * @param {number} pathLength - The calculated path length
 * @param {boolean} shouldUseDashedAnimation - Whether to use dashed animation
 * @returns {Object} Animation properties for initial state
 */
export const handleInitialAnimation: (pathOptions: RenderOptions, state: AnimationState,
    index: number, pathLength: number, shouldUseDashedAnimation: boolean) => {
    strokeDasharray: string | number;
    strokeDashoffset: number;
    interpolatedD?: string;
} = (
    pathOptions: RenderOptions,
    state: AnimationState,
    index: number,
    pathLength: number,
    shouldUseDashedAnimation: boolean
): { strokeDasharray: string | number; strokeDashoffset: number; interpolatedD?: string } => {
    const { isInitialRenderRef, animationProgress } = state;

    // Handle completion of initial animation
    if (animationProgress === 1) {
        isInitialRenderRef.current[index as number] = false;
    }

    // For dashed lines, use specialized animation
    if (shouldUseDashedAnimation) {
        return calculateDashedPathAnimation(pathOptions, state);
    }

    // Standard initial animation using dash offset
    return {
        strokeDasharray: pathLength,
        strokeDashoffset: pathLength * (1 - animationProgress)
    };
};

/**
 * Handles path interpolation when the path structure remains the same.
 *
 * @param {string} renderedD - The previously rendered path
 * @param {RenderOptions} pathOptions - The path rendering options
 * @param {number} animationProgress - The animation progress
 * @returns {Object} Animation properties for path interpolation
 */
export const handlePathInterpolation: (renderedD: string, pathOptions: RenderOptions, animationProgress: number) => {
    strokeDasharray: string | number;
    strokeDashoffset: number;
    interpolatedD: string;
} = (
    renderedD: string,
    pathOptions: RenderOptions,
    animationProgress: number
): { strokeDasharray: string | number; strokeDashoffset: number; interpolatedD: string } => {
    return {
        interpolatedD: interpolatePathD(renderedD, pathOptions.d as string, animationProgress),
        strokeDasharray: pathOptions.dashArray as string,
        strokeDashoffset: 0
    };
};

/**
 * Handles animation when the start path has more commands than the end path.
 *
 * @param {string} renderedD - The previously rendered path
 * @param {RenderOptions} pathOptions - The path rendering options
 * @param {RegExpMatchArray} startPathCommands - The parsed start path commands
 * @param {RegExpMatchArray} endPathCommands - The parsed end path commands
 * @param {SeriesProperties} currentSeries - The current series properties
 * @param {number} animationProgress - The animation progress
 * @returns {Object} Animation properties when reducing path commands
 */
export const handlePathCommandReduction: (renderedD: string, pathOptions: RenderOptions,
    startPathCommands: RegExpMatchArray, endPathCommands: RegExpMatchArray,
    currentSeries: SeriesProperties | undefined, animationProgress: number) => {
    strokeDasharray: string;
    strokeDashoffset: number;
    interpolatedD: string;
} = (
    renderedD: string,
    pathOptions: RenderOptions,
    startPathCommands: RegExpMatchArray,
    endPathCommands: RegExpMatchArray,
    currentSeries: SeriesProperties | undefined,
    animationProgress: number
): { strokeDasharray: string; strokeDashoffset: number; interpolatedD: string } => {
    let interpolatedD: string = '';

    // Handle different series types differently
    if (currentSeries?.type === 'StepLine') {
        const stepPosition: StepPosition = currentSeries.step as StepPosition;
        interpolatedD = interpolateSteplinePathD(renderedD, pathOptions.d as string, animationProgress, stepPosition);
    }
    else if (currentSeries?.type === 'Spline') {
        const adjustedCommands: string[] = adjustSplineCommands(startPathCommands, endPathCommands, currentSeries);
        interpolatedD = interpolatePathD(renderedD, adjustedCommands.join(''), animationProgress);
    }
    else if (currentSeries?.type === 'Line') {
        const maxLength: number = Math.max(startPathCommands.length, endPathCommands.length);
        const minLength: number = Math.min(startPathCommands.length, endPathCommands.length);

        for (let i: number = minLength; i < maxLength; i++) {
            endPathCommands.splice(1, 0, endPathCommands[0].replace('M', 'L'));
        }

        interpolatedD = interpolateBorderPath(renderedD, endPathCommands.join(''), animationProgress);
    }
    else {
        interpolatedD = interpolatePathD(renderedD || '', pathOptions.d as string, animationProgress);
    }

    return {
        interpolatedD,
        strokeDasharray: pathOptions.dashArray as string,
        strokeDashoffset: 0
    };
};

/**
 * Adjusts spline commands to match count between start and end paths.
 *
 * @param {RegExpMatchArray} startCommands - The start path commands
 * @param {RegExpMatchArray} endCommands - The end path commands
 * @param {SeriesProperties} series - The series properties
 * @returns {Array<string>} The adjusted end commands
 */
export const adjustSplineCommands: (startCommands: RegExpMatchArray,
    endCommands: RegExpMatchArray, series: SeriesProperties) => string[] = (
    startCommands: RegExpMatchArray,
    endCommands: RegExpMatchArray,
    series: SeriesProperties
): string[] => {
    const endCmdsCopy: string[] = [...endCommands];
    const maxLength: number = Math.max(startCommands.length, endCmdsCopy.length);
    const minLength: number = Math.min(startCommands.length, endCmdsCopy.length);

    for (let i: number = minLength; i < maxLength; i++) {
        if (series && series.removedPointIndex === series.points.length &&
            endCmdsCopy.length !== startCommands.length) {
            if (endCmdsCopy[endCmdsCopy.length - 1].indexOf('C') === 0) {
                const points: string[] = endCmdsCopy[endCmdsCopy.length - 1].split(' ').slice(-3);
                endCmdsCopy.push('C ' + points.join(' ') + points.join(' ') + points.join(' '));
            }
            else {
                const points: string = endCmdsCopy[endCmdsCopy.length - 1].replace('M', '');
                endCmdsCopy.push('C' + points + points + points);
            }
        } else {
            if (endCmdsCopy.length !== startCommands.length) {
                endCmdsCopy.splice(1, 0, 'C ' +
                    endCmdsCopy[0].split(' ').slice(-3).join(' ') +
                    endCmdsCopy[0].split(' ').slice(-3).join(' ') +
                    endCmdsCopy[0].split(' ').slice(-3).join(' '));
            }
        }
    }

    return endCmdsCopy;
};

/**
 * Handles animation when the start path has fewer commands than the end path.
 *
 * @param {RegExpMatchArray} startPathCommands - The parsed start path commands
 * @param {RegExpMatchArray} endPathCommands - The parsed end path commands
 * @param {SeriesProperties} currentSeries - The current series properties
 * @param {RenderOptions} pathOptions - The path rendering options
 * @param {number} pathLength - The calculated path length
 * @param {number} prevLength - The previous path length
 * @param {number} animationProgress - The animation progress
 * @returns {Object} Animation properties when adding path commands
 */
export const handlePathCommandAddition: (startPathCommands: RegExpMatchArray,
    endPathCommands: RegExpMatchArray, currentSeries: SeriesProperties | undefined,
    pathOptions: RenderOptions, pathLength: number, prevLength: number, animationProgress: number) => {
    strokeDasharray: string | number;
    strokeDashoffset: number;
    interpolatedD?: string;
} = (
    startPathCommands: RegExpMatchArray,
    endPathCommands: RegExpMatchArray,
    currentSeries: SeriesProperties | undefined,
    pathOptions: RenderOptions,
    pathLength: number,
    prevLength: number,
    animationProgress: number
): { strokeDasharray: string | number; strokeDashoffset: number; interpolatedD?: string } => {
    const result: { strokeDasharray: string | number; strokeDashoffset: number; interpolatedD?: string } = {
        strokeDasharray: 'none',
        strokeDashoffset: 0
    };

    const addedLength: number = Math.max(pathLength - prevLength, 0);

    if (currentSeries?.type === 'Spline') {
        const adjustedStartCommands: string[] = adjustStartCommandsForSpline(startPathCommands, endPathCommands);
        result.interpolatedD = interpolatePathD(
            adjustedStartCommands.join(' '),
            pathOptions.d as string,
            animationProgress
        );
        result.strokeDasharray = pathOptions.dashArray || 'none';
    }
    else if (currentSeries?.type === 'Line') {
        const adjustedStartCommands: string[] = adjustStartCommandsForLine(startPathCommands, endPathCommands);
        result.interpolatedD = interpolateBorderPath(
            adjustedStartCommands.join(' '),
            pathOptions.d as string,
            animationProgress
        );
        result.strokeDasharray = pathOptions.dashArray || 'none';
    }
    else {
        // For added points, apply dash array with animation offset
        if (pathOptions.dashArray !== '') {
            result.strokeDasharray = pathOptions.dashArray as string;
            result.strokeDashoffset = addedLength * (1 - animationProgress);
        } else {
            result.strokeDasharray = `${pathLength}`;
            result.strokeDashoffset = addedLength * (1 - animationProgress);
        }
    }

    return result;
};

/**
 * Adjusts start commands for spline series when adding points.
 *
 * @param {RegExpMatchArray} startCommands - The start path commands
 * @param {RegExpMatchArray} endCommands - The end path commands
 * @returns {Array<string>} The adjusted start commands
 */
export const adjustStartCommandsForSpline: (startCommands: RegExpMatchArray, endCommands: RegExpMatchArray) => string[] = (
    startCommands: RegExpMatchArray,
    endCommands: RegExpMatchArray
): string[] => {
    const startCmdsCopy: string[] = [...startCommands];

    for (let i: number = startCmdsCopy.length; i < endCommands.length; i++) {
        if (endCommands.length !== startCmdsCopy.length) {
            if (endCommands.length === startCmdsCopy.length + 1 &&
                endCommands[endCommands.length - 1].indexOf('M') === 0) {
                startCmdsCopy.push(endCommands[endCommands.length - 1]);
            }
            else if (startCmdsCopy[startCmdsCopy.length - 1].indexOf('C') === 0) {
                const points: string[] = startCmdsCopy[startCmdsCopy.length - 1].split(' ').slice(-3);
                startCmdsCopy.push('C ' + points.join(' ') + points.join(' ') + points.join(' '));
            }
            else {
                const points: string = startCmdsCopy[startCmdsCopy.length - 1].replace('M', '');
                startCmdsCopy.push('C' + points + points + points);
            }
        }
    }

    return startCmdsCopy;
};

/**
 * Adjusts start commands for line series when adding points.
 *
 * @param {RegExpMatchArray} startCommands - The start path commands
 * @param {RegExpMatchArray} endCommands - The end path commands
 * @returns {Array<string>} The adjusted start commands
 */
export const adjustStartCommandsForLine: (startCommands: RegExpMatchArray, endCommands: RegExpMatchArray) => string[] = (
    startCommands: RegExpMatchArray,
    endCommands: RegExpMatchArray
): string[] => {
    const startCmdsCopy: string[] = [...startCommands];

    const maxLength: number = Math.max(startCmdsCopy.length, endCommands.length);
    const minLength: number = Math.min(startCmdsCopy.length, endCommands.length);

    for (let i: number = minLength; i < maxLength; i++) {
        if (endCommands.length !== startCmdsCopy.length) {
            startCmdsCopy.push(startCmdsCopy[startCmdsCopy.length - 1].replace('M', 'L'));
        }
    }

    return startCmdsCopy;
};

/**
 * Updates animation state references when animation completes.
 *
 * @param {AnimationState} state - Animation state including references
 * @param {number} index - The series index
 * @param {number} seriesIndex - The series index extracted from ID
 * @param {number} pathLength - The calculated path length
 * @param {RenderOptions} pathOptions - The path rendering options
 * @returns {void}
 */
export const updateAnimationReferences: (state: AnimationState, index: number, seriesIndex: number,
    pathLength: number, pathOptions: RenderOptions) => void = (
    state: AnimationState,
    index: number,
    seriesIndex: number,
    pathLength: number,
    pathOptions: RenderOptions
): void => {
    const { previousPathLengthRef, renderedPathDRef } = state;

    previousPathLengthRef.current[index as number] = pathLength;
    renderedPathDRef.current[seriesIndex as number] = pathOptions.d as string;
};

/**
 * Handles path animation calculations and returns animation properties.
 *
 * @param {Object} pathOptions The path rendering options
 * @param {number} index The series index
 * @param {AnimationState} state Animation state including references and animation progress
 * @param {boolean} enableAnimation Whether animation is enabled for this series
 * @param {Series[]} [visibleSeries] The visible series for the chart
 * @returns {Object} Object with animation properties (strokeDasharray, strokeDashoffset, interpolatedD)
 */
export const calculatePathAnimation: (pathOptions: RenderOptions, index: number,
    state: AnimationState, enableAnimation: boolean, visibleSeries?: SeriesProperties[]) => {
    strokeDasharray: string | number;
    strokeDashoffset: number;
    interpolatedD?: string;
} = (
    pathOptions: RenderOptions,
    index: number,
    state: AnimationState,
    enableAnimation: boolean,
    visibleSeries?: SeriesProperties[]
): { strokeDasharray: string | number; strokeDashoffset: number; interpolatedD?: string } => {
    const { previousPathLengthRef, isInitialRenderRef, renderedPathDRef, animationProgress } = state;

    // Get the series index from the ID
    const match: RegExpMatchArray | null = (pathOptions.id as string).match(/Series_(\d+)/);
    const seriesIndex: number = match ? parseInt(match[1], 10) : 0;
    const currentSeries: SeriesProperties | undefined = visibleSeries?.[seriesIndex as number];

    // Calculate current and previous path lengths
    const pathLength: number = calculatePathLength(pathOptions.d);
    const prevLength: number = previousPathLengthRef.current[index as number];
    const isInitial: boolean = isInitialRenderRef.current[index as number];
    const renderedD: string | undefined = renderedPathDRef.current[seriesIndex as number];

    // Extract path commands for analysis
    const startPathCommands: RegExpMatchArray = renderedD?.match(/[MLHVCSQTAZ][^MLHVCSQTAZ]*/g) as RegExpMatchArray;
    const endPathCommands: RegExpMatchArray = pathOptions.d.match(/[MLHVCSQTAZ][^MLHVCSQTAZ]*/g) as RegExpMatchArray;

    // Default animation values
    let result: { strokeDasharray: string | number; strokeDashoffset: number; interpolatedD?: string } = {
        strokeDasharray: pathOptions.dashArray || 'none',
        strokeDashoffset: 0
    };

    if (enableAnimation) {
        // Initial animation when the path is first rendered
        if (isInitial) {
            const shouldUseDashedAnimation: boolean = !!pathOptions.dashArray &&
                !(visibleSeries?.some((series: SeriesProperties) => series.isLegendClicked)) &&
                pathOptions.dashArray !== 'none' &&
                !(visibleSeries?.some((series: SeriesProperties) => series.skipMarkerAnimation));

            result = handleInitialAnimation(pathOptions, state, index, pathLength, shouldUseDashedAnimation);
        }
        // Path structure remains the same, just interpolate values
        else if (
            renderedD &&
            pathOptions.d &&
            renderedD.match(/[a-zA-Z]/g)?.join('') === pathOptions.d.match(/[a-zA-Z]/g)?.join('')
        ) {
            result = handlePathInterpolation(renderedD, pathOptions, animationProgress);
        }
        // Path has fewer commands in the end (points removed)
        else if (startPathCommands?.length > endPathCommands?.length) {
            result = handlePathCommandReduction(
                renderedD as string,
                pathOptions,
                startPathCommands,
                endPathCommands,
                currentSeries,
                animationProgress
            );
        }
        // Path has more commands in the end (points added)
        else if (startPathCommands?.length < endPathCommands?.length) {
            result = handlePathCommandAddition(
                startPathCommands,
                endPathCommands,
                currentSeries,
                pathOptions,
                pathLength,
                prevLength,
                animationProgress
            );

            // Apply dash array during point addition animation if path is interpolated
            if (result.interpolatedD) {
                result.strokeDasharray = pathOptions.dashArray || 'none';
            }
        }
    }

    // Update reference values when animation completes
    if (animationProgress === 1) {
        result.strokeDasharray = pathOptions.dashArray || 'none';
        result.strokeDashoffset = 0;
        updateAnimationReferences(state, index, seriesIndex, pathLength, pathOptions);
    }

    return result;
};

/**
 * Handles animation for rectangle-based series elements (columns/bars)
 *
 * @param {RenderOptions} pathOption - The rendering options for the current path
 * @param {Series} currentSeries - The series that contains the point being animated
 * @param {number} index - The index of the series in the chart
 * @param {Points} currentPoint - The data point being animated
 * @param {number} pointIndex - The index of the point within the series
 * @param {AnimationState} state - Object containing animation state references and values
 * @param {boolean} enableAnimation - Flag indicating whether animation is enabled
 * @returns {Object} Object containing animation properties - animatedDirection and animatedTransform
 * @private
 */
export function handleRectAnimation(pathOption: RenderOptions, currentSeries:
SeriesProperties, index: number, currentPoint: Points | undefined
, pointIndex: number, state: AnimationState, enableAnimation: boolean): { animatedDirection?: string; animatedTransform?: string; } {
    const isFirstRenderRef: React.MutableRefObject<boolean> = state.isFirstRenderRef;
    const isInitialRenderRef: React.MutableRefObject<boolean[]> = state.isInitialRenderRef;
    const animationProgress: number = state.animationProgress;
    const previousSeriesOptionsRef: React.MutableRefObject<RenderOptions[][]> = state.previousSeriesOptionsRef;
    const isInitial: boolean = isInitialRenderRef.current[index as number];
    let direction: string = pathOption.d;

    if (animationProgress === 1) {
        previousSeriesOptionsRef.current[index as number] ||= [];
        previousSeriesOptionsRef.current[index as number][pointIndex as number] = pathOption;
    }
    if (currentSeries && currentPoint && enableAnimation) {
        if (isFirstRenderRef.current && isInitial) {
            if (animationProgress === 1) {
                isFirstRenderRef.current = false;
                isInitialRenderRef.current[index as number] = false;
            }
            return { animatedTransform: animateRect(currentSeries, currentPoint, animationProgress), animatedDirection: undefined };
        }

        if (!isFirstRenderRef.current &&
            previousSeriesOptionsRef.current &&
            previousSeriesOptionsRef.current[index as number] &&
            previousSeriesOptionsRef.current[index as number][pointIndex as number] &&
            (previousSeriesOptionsRef.current[index as number][pointIndex as number].d !== pathOption.d)) {

            direction = calculateRectPathDirection(
                previousSeriesOptionsRef.current[index as number][pointIndex as number].d,
                pathOption.d,
                animationProgress
            );
            return { animatedTransform: '', animatedDirection: direction };
        }
    }

    return {};
}

/**
 * Calculates the transform string for animating a column/bar rect element.
 *
 * @param {Series} series - The series containing the point.
 * @param {Points} point - The data point to animate.
 * @param {number} progress - Animation progress (0-1).
 * @returns {string} The SVG transform string.
 */
export const animateRect: (series: SeriesProperties, point: Points, progress?: number) => string = (
    series: SeriesProperties,
    point: Points,
    progress: number = 1
): string => {
    if (!point.regions || !point.regions[0]) {
        return '';
    }
    const isPlot: boolean = (point.yValue !== null && point.yValue < 0);
    const x: number = +point.regions[0].x;
    const y: number = +point.regions[0].y;
    const elementHeight: number = +point.regions[0].height;
    let elementWidth: number = +point.regions[0].width;
    let centerX: number;
    let centerY: number;
    if (!series.chart.requireInvertedAxis) {
        if (series?.type!.indexOf('Stacking') > -1) {
            centerX = x;
            centerY = (1 - valueToCoefficient(0, series.yAxis)) * (series.yAxis.rect.height);
        } else {
            centerY = (isPlot !== series.yAxis.isAxisInverse) ? y : y + elementHeight;
            centerX = isPlot ? x : x + elementWidth;
        }
    } else {
        if (series?.type!.indexOf('Stacking') > -1) {
            centerX = (valueToCoefficient(0, series.yAxis)) * series.yAxis.rect.width;
            centerY = y;
        } else {
            centerY = isPlot ? y : y + elementHeight;
            centerX = (isPlot !== series.yAxis.isAxisInverse) ? x + elementWidth : x;
        }
    }
    const value: number = (progress) * (series.chart.requireInvertedAxis ? elementWidth : elementHeight);
    if (!series.chart.requireInvertedAxis) {
        return `translate(${centerX} ${centerY}) scale(1,${value / elementHeight}) translate(${-centerX} ${-centerY})`;
    } else {
        elementWidth = elementWidth || 1;
        return `translate(${centerX} ${centerY}) scale(${value / elementWidth}, 1) translate(${-centerX} ${-centerY})`;
    }
};

/**
 * Calculates the path direction based on animation progress for both X and Y coordinates.
 * Smoothly animates from start path to end path by interpolating all coordinates.
 * Works with rectangle-like SVG path elements.
 *
 * @param {string} startDirection - Starting path direction
 * @param {string} endDirection - Ending path direction
 * @param {number} progress - Animation progress (0-1)
 * @returns {string} Interpolated path direction
 * @private
 */
export function calculateRectPathDirection(
    startDirection: string,
    endDirection: string,
    progress: number
): string {
    if (!startDirection || !endDirection) {
        return endDirection || startDirection || '';
    }
    const startCommands: PathCommand[] = parsePathCommands(startDirection);
    const endCommands: PathCommand[] = parsePathCommands(endDirection);
    if (!startCommands.length || !endCommands.length) {
        return endDirection;
    }
    let result: string = '';
    const commandCount: number = Math.min(startCommands.length, endCommands.length);

    for (let i: number = 0; i < commandCount; i++) {
        const startCmd: PathCommand = startCommands[i as number];
        const endCmd: PathCommand = endCommands[i as number];
        if (startCmd.type !== endCmd.type) {
            continue;
        }
        result += startCmd.type + ' ';
        switch (startCmd.type) {
        case 'M':
        case 'L': {
            const x: number = interpolate(startCmd.params[0], endCmd.params[0], progress);
            const y: number = interpolate(startCmd.params[1], endCmd.params[1], progress);
            result += `${x} ${y} `;
            break;
        }
        case 'Q': {
            const cx: number = interpolate(startCmd.params[0], endCmd.params[0], progress);
            const cy: number = interpolate(startCmd.params[1], endCmd.params[1], progress);
            const ex: number = interpolate(startCmd.params[2], endCmd.params[2], progress);
            const ey: number = interpolate(startCmd.params[3], endCmd.params[3], progress);
            result += `${cx} ${cy} ${ex} ${ey} `;
            break;
        }
        }
    }
    return result.trim();
}

/**
 * Helper function to parse SVG path commands into structured objects
 *
 * @param {string} path - SVG path string
 * @returns {Array<PathCommand>} Array of command objects
 * @private
 */
export function parsePathCommands(path: string): PathCommand[] {
    const commands: PathCommand[] = [];
    const parts: string[] = path.split(/([MLHVCSQTAZ])/i).filter(Boolean);
    let currentType: string = '';
    for (let i: number = 0; i < parts.length; i++) {
        const part: string = parts[i as number].trim();
        if (/^[MLHVCSQTAZ]$/i.test(part)) {
            currentType = part;
            continue;
        }
        if (currentType && part) {
            const params: number[] = part.split(/[\s,]+/)
                .filter(Boolean)
                .map(parseFloat);
            if (params.length > 0) {
                commands.push({
                    type: currentType,
                    params: params
                });
            }
        }
    }
    return commands;
}

/**
 * Interpolate between two numbers based on progress
 *
 * @param {number} start - Starting value
 * @param {number} end - Ending value
 * @param {number} progress - Progress value (0-1)
 * @returns {number} Interpolated value
 * @private
 */
export function interpolate(start: number, end: number, progress: number): number {
    return start + (end - start) * progress;
}


/**
 * Helper function for smooth scatter & bubble transitions.
 *
 * @param {SeriesProperties} series  - The series containing scatter and bubble points and animation settings
 * @param {number} animationProgress - Represents the calculated animation progress.
 * @returns {Object} Return the interpolated opacity and scale for smooth rendering.
 */
export const doInitialAnimation: (series: SeriesProperties, animationProgress: number) => {
    opacity: number;
    scale: number;
} = (
    series: SeriesProperties,
    animationProgress: number
): { opacity: number; scale: number } => {
    if (!series.animation?.enable || series.propsChange || series.isLegendClicked) {
        return { opacity: 1, scale: 1 };
    }

    // Easing function for smooth growth animation
    const easeOutCubic: (time: number) => number = (time: number): number => 1 - Math.pow(1 - time, 3);
    const easedProgress: number = easeOutCubic(animationProgress);

    return {
        opacity: animationProgress,
        scale: easedProgress
    };
};
