import { pushCategoryPoint, pushDateTimePoint } from './ProcessData';
import { extend, getValue } from '@syncfusion/react-base';
import { createPoint, getObjectValue, pushData, pushDoublePoint, setEmptyPoint } from './ProcessData';
import { useRegisterAxisRender } from '../../hooks/useClipRect';
import { DataPoint, Points, SeriesProperties } from '../../chart-area/chart-interfaces';

/**
 * Updates a specific point within a series based on the axis value type.
 *
 * @param {number} index - The index of the point to update
 * @param {SeriesProperties} series - The series containing the point
 * @returns {void}
 * @private
 */
export const updatePoint: (index: number, series: SeriesProperties) => void = (index: number, series: SeriesProperties): void => {
    const point: Points = createPoint();
    const xField: string | undefined = series.xField as string;
    const textMappingName: string = series.marker?.dataLabel?.labelField ?
        series.marker.dataLabel.labelField : '';
    if (series.xAxis.valueType === 'Category') {
        pushCategoryPoint(series, point, index, xField, textMappingName);
    }
    else if (series.xAxis.valueType === 'DateTime') {
        pushDateTimePoint(series, point, index, xField, textMappingName);
    }
    else {
        pushDoublePoint(series, point, index, xField);
    }
};

/**
 * Adjusts the series points after a point has been removed, ensuring consistent series data.
 *
 * @param {number} index - The index of the removed point
 * @param {SeriesProperties} series - The series to update
 * @returns {void}
 * @private
 */
const updatePointsAfterRemoval: (index: number, series: SeriesProperties) => void = (index: number, series: SeriesProperties): void => {
    void (series.points?.[index as number]
        && (pushData(series.points[index as number], index, series),
        setEmptyPoint(series.points[index as number], series, index))
    );
};

/**
 * Animates the path of the series by controlling the animation progress.
 *
 * @param {number} timestamp - The current timestamp from requestAnimationFrame
 * @param {number} duration - The duration of the animation in milliseconds
 * @param {(progress: number) => void} setAnimationProgress - Function to update animation progress state (0-1)
 * @param {React.MutableRefObject<number>} animationFrameRef - Ref object to store animation frame ID
 * @param {number} startTime - The start time of the animation in milliseconds
 * @returns {void}
 * @private
 */

export const animatePath: (timestamp: number, duration: number, setAnimationProgress: (progress: number) => void,
    animationFrameRef: React.MutableRefObject<number>, startTime: number) => void = (timestamp: number, duration: number,
                                                                                     setAnimationProgress: (progress: number) => void,
                                                                                     animationFrameRef: React.MutableRefObject<number>,
                                                                                     startTime: number): void => {
    const elapsed: number = timestamp - startTime;
    const progress: number = duration === 0 ? 1 : Math.min((elapsed / duration), 1);
    setAnimationProgress(progress);
    if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame((time: DOMHighResTimeStamp) =>
            animatePath(time, duration, setAnimationProgress, animationFrameRef, startTime)
        );
    } else {
        cancelAnimationFrame(animationFrameRef.current);
    }
};

/**
 * Adds a point to the series.
 *
 * @param {DataPoint} pointData - The data point to add.
 * @param {number} pointData.x - The x-coordinate of the point.
 * @param {number} duration - Animation duration.
 * @param {number} pointData.y - The y-coordinate of the point.
 * @param {Series} series - The series to add the point to.
 * @param {MutableRefObject<boolean>} internalDataUpdateRef - Reference to track internal data updates.
 * @param {React.Dispatch<React.SetStateAction<number>>} setAnimationProgress - Function to update animation progress state.
 * @param {MutableRefObject<number | null>} animationFrameRef - Reference to the animation frame.
 * @param {number | null} animationFrameRef.current - The current animation frame ID.
 * @param {Function} updateSeries - Function to update the series data after animation.
 * @returns {void} This function does not return a value
 * @private
 */
export const addPoint: (pointData: DataPoint, duration: number, series: SeriesProperties,
    internalDataUpdateRef: React.MutableRefObject<boolean>,
    setAnimationProgress: (progress: number) => void, animationFrameRef: React.MutableRefObject<number>,
    updateSeries: (xAxis: boolean, yAxis: boolean, series: SeriesProperties) => void) => void = (
    pointData: DataPoint,
    duration: number,
    series: SeriesProperties,
    internalDataUpdateRef: React.MutableRefObject<boolean>,
    setAnimationProgress: (progress: number) => void,
    animationFrameRef: React.MutableRefObject<number>,
    updateSeries: (xAxis: boolean, yAxis: boolean, series: SeriesProperties) => void
): void => {
    if (!Array.isArray(series.dataSource)) {
        return;
    }
    (series.dataSource as Object[]).push(pointData);
    series.currentViewData = series.dataSource as DataPoint[];
    const lastIndex: number = series.points?.[series.points.length - 1]?.index as number;
    const pointIndex: number = lastIndex + 1;
    updatePoint(pointIndex, series);

    void(internalDataUpdateRef && (internalDataUpdateRef.current = true));

    series.chart.axisRender();
    requestAnimationFrame((startTime: number) => {
        updateSeries(true, false, series);
        animatePath(startTime, duration, setAnimationProgress, animationFrameRef, startTime);
    });
};

/**
 * Removes a point from the series.
 *
 * @param {number} index - The index of the point to remove.
 * @param {number} duration - Animation duration.
 * @param {Series} series - The series to remove the point from.
 * @param {MutableRefObject<boolean>} internalDataUpdateRef - Reference to track internal data updates.
 * @param {Function} setAnimationProgress - Function to set animation progress.
 * @param {MutableRefObject<number>} animationFrameRef - Reference to the animation frame.
 * @param {number|null} animationFrameRef.current - The current animation frame ID.
 * @param {Function} updateSeries - Function to update the series.
 * @returns {void} - This function doesn't return a value.
 * @private
 */
export const removePoint: (index: number, duration: number, series: SeriesProperties,
    internalDataUpdateRef: React.MutableRefObject<boolean>,
    setAnimationProgress: (progress: number) => void,
    animationFrameRef: React.MutableRefObject<number>,
    updateSeries: (xAxis: boolean, yAxis: boolean, series: SeriesProperties) => void) => void = (
    index: number,
    duration: number,
    series: SeriesProperties,
    internalDataUpdateRef: React.MutableRefObject<boolean>,
    setAnimationProgress: (progress: number) => void,
    animationFrameRef: React.MutableRefObject<number>,
    updateSeries: (xAxis: boolean, yAxis: boolean, series: SeriesProperties) => void
): void => {
    const dataSource: Object[] = extend([], series.dataSource as Object, void 0, true) as Object[];
    void (dataSource.length > 0 && index >= 0 && index < dataSource.length && (() => {
        dataSource.splice(index, 1);
        (series.dataSource as object[]).splice(index, 1);
        series.removedPointIndex = index;
        series?.points?.splice(index, 1);
        series?.visiblePoints?.splice(index, 1);
        series.yData = [];
        series.xData = [];

        void(internalDataUpdateRef && (internalDataUpdateRef.current = true));

        series.yMin = Infinity;
        series.xMin = Infinity;
        series.yMax = -Infinity;
        series.xMax = -Infinity;
        for (let i: number = 0; i < (series.points).length; i++) {
            updatePointsAfterRemoval(i, series);
        }
    })());

    series.chart.axisRender();
    requestAnimationFrame((startTime: number) => {
        updateSeries(true, false, series);
        animatePath(startTime, duration, setAnimationProgress, animationFrameRef, startTime);
    });
};


/**
 * Sets new data for the series with animation support.
 *
 * @param {Object[]} data - The new data array to set for the series.
 * @param {number} duration - Animation duration.
 * @param {Series} series - The series to update.
 * @param {MutableRefObject<boolean>} internalDataUpdateRef - Reference to track internal data updates.
 * @param {Function} setAnimationProgress - Function to set animation progress.
 * @param {MutableRefObject<number>} animationFrameRef - Reference to the animation frame.
 * @param {number|null} animationFrameRef.current - The current animation frame ID.
 * @param {Function} updateSeries - Function to update the series.
 * @returns {void} - This function doesn't return a value.
 * @private
 */
export const setData: (data: Object[], duration: number,
    series: SeriesProperties, internalDataUpdateRef: React.MutableRefObject<boolean>,
    setAnimationProgress: (progress: number) => void,
    animationFrameRef: React.MutableRefObject<number>,
    updateSeries: (xAxis: boolean, yAxis: boolean, series: SeriesProperties) => void) => void = (
    data: Object[],
    duration: number,
    series: SeriesProperties,
    internalDataUpdateRef: React.MutableRefObject<boolean>,
    setAnimationProgress: (progress: number) => void,
    animationFrameRef: React.MutableRefObject<number>,
    updateSeries: (xAxis: boolean, yAxis: boolean, series: SeriesProperties) => void
): void => {
    void(internalDataUpdateRef && (internalDataUpdateRef.current = true));

    series.yMin = Infinity;
    series.yMax = -Infinity;
    const points: number[] = [];
    let samePoints: boolean = false;

    void ((series.dataSource as Object[]).length === data.length && (() => {
        samePoints = true;
        series.yData = [];
        for (let i: number = 0; i < data.length; i++) {
            const point: Points = series.points?.[i as number];
            const getObjectValueByMappingString: Function = series.enableComplexProperty ? getValue : getObjectValue;
            const newPoint: Object = data[i as number];
            point.y = getObjectValueByMappingString(series.yField, newPoint);
            points.push(i);

            point.yValue = (typeof point.y === 'number' && point.y !== null) ? point.y : 0;
            point.x = getObjectValueByMappingString(series.xField, newPoint);
            setEmptyPoint(point, series, series.index);
            (series.dataSource as Object[])[i as number] = data[i as number];
        }
    })());

    const triggerRender: (chartId?: string) => void = useRegisterAxisRender();
    triggerRender(series?.chart?.element?.id);
    void (
        !samePoints
            ? (series.dataSource = data)
            : requestAnimationFrame((startTime: number) => {
                updateSeries(false, true, series);
                animatePath(startTime, duration, setAnimationProgress, animationFrameRef, startTime);
            })
    );
};

