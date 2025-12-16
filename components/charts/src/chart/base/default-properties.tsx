
import { AxisModel, MarginModel, SeriesProperties } from '../chart-area/chart-interfaces';
import { ChartAxisLabelProps, ChartAxisTitleProps } from '../chart-axis/base';
import { ChartBorderProps, ChartAreaProps, ChartLegendProps, ChartStackLabelsProps, ChartTitleProps, Column, MajorGridLines, MajorTickLines, MinorGridLines, MinorTickLines, Row, ChartTooltipProps, ChartZoomSettingsProps, ChartStripLineProps, ChartAccessibilityProps, ChartCrosshairProps, ChartCrosshairTooltipProps, ChartSelectionProps, ChartHighlightProps, ChartAnnotationProps } from './interfaces';

// Define default stripline settings to avoid duplication
const defaultStripLineSettings: ChartStripLineProps = {
    visible: false,
    range: {
        shouldStartFromAxis: false,
        start: undefined,
        end: undefined,
        size: undefined,
        sizeType: 'Auto'
    },
    style: {
        color: '#808080',
        opacity: 1,
        dashArray: '',
        imageUrl: '',
        border: { color: '', width: 1, dashArray: '' },
        zIndex: 'Behind'
    },
    text: {
        content: '',
        font: { color: '', fontFamily: '', fontSize: '', fontStyle: '', fontWeight: '', opacity: 1 },
        rotation: undefined,
        hAlign: 'Center',
        vAlign: 'Center'
    },
    repeat: {
        enable: false,
        every: undefined,
        until: undefined
    },
    segment: {
        enable: false,
        start: undefined,
        end: undefined,
        axisName: undefined
    }
};

interface ChartConfig {
    chart: {
        border: ChartBorderProps;
        margin: MarginModel
        enableSideBySidePlacement: boolean;
    };
    ChartArea: ChartAreaProps;
    ChartTitle: ChartTitleProps;
    ChartSubTitle: ChartTitleProps;
    Column: Column;
    Row: Row;
    MajorGridLines: MajorGridLines
    MajorTickLines: MajorTickLines;
    MinorTickLines: MinorTickLines;
    MinorGridLines: MinorGridLines;
    LabelStyle: ChartAxisLabelProps;
    TitleStyle: ChartAxisTitleProps;
    PrimaryXAxis: Partial<AxisModel>;
    PrimaryYAxis: Partial<AxisModel>;
    SecondaryAxis: Partial<AxisModel>;
    AxisCrosshairTooltip: ChartCrosshairTooltipProps;
    ChartSeries: Partial<SeriesProperties>;
    ChartStackLabels: ChartStackLabelsProps;
    ChartLegend: ChartLegendProps;
    ChartZoom: ChartZoomSettingsProps;
    ChartTooltip: ChartTooltipProps;
    accessibility: ChartAccessibilityProps;
    ChartCrosshair: ChartCrosshairProps;
    ChartAnnotation: ChartAnnotationProps;
    StripLines: ChartStripLineProps[];
    ChartSelection: ChartSelectionProps;
    ChartHighlight: ChartHighlightProps;
}

export const defaultChartConfigs: ChartConfig = {

    chart: {
        border: { color: '#DDDDDD', width: 0, dashArray: '' },
        margin: { top: 10, right: 10, bottom: 10, left: 10 },
        enableSideBySidePlacement: true
    },
    accessibility: {
        ariaLabel: '',
        focusable: true,
        tabIndex: 0,
        role: ''
    },
    ChartArea: {
        border: { color: '', width: 0, dashArray: '' },
        margin: { top: 0, bottom: 0, left: 0, right: 0 },
        opacity: 1,
        backgroundImage: '',
        background: 'transparent',
        width: undefined
    },
    ChartTitle: {
        text: '',
        color: '',
        fontFamily: '',
        fontSize: '',
        fontStyle: '',
        fontWeight: '',
        align: 'Center',
        position: 'Top',
        opacity: 1,
        textOverflow: 'Wrap',
        x: 0,
        y: 0,
        background: 'transparent',
        border: { color: 'transparent', width: 0, dashArray: '', cornerRadius: 0.8 },
        accessibility: {
            ariaLabel: '',
            role: 'img',
            focusable: true,
            tabIndex: 0
        }

    },
    ChartSubTitle: {
        text: '',
        color: '',
        fontFamily: '',
        fontSize: '',
        fontStyle: '',
        fontWeight: '',
        align: 'Center',
        position: 'Top',
        opacity: 1,
        textOverflow: 'Wrap',
        x: 0,
        y: 0,
        background: 'transparent',
        border: { color: 'transparent', width: 0, dashArray: '', cornerRadius: 0.8 },
        accessibility: {
            ariaLabel: '',
            role: 'img',
            focusable: true,
            tabIndex: 0
        }
    },
    Column: {
        width: '100%',
        border: {
            color: '', dashArray: '', width: 1
        }
    },
    Row: {
        height: '100%',
        border: {
            color: '', dashArray: '', width: 1
        }
    },
    MajorGridLines: {
        width: null,
        color: '',
        dashArray: ''
    },
    MajorTickLines: {
        width: 0,
        height: 5,
        color: ''
    },
    MinorTickLines: {
        width: 0.7,
        height: 5,
        color: ''
    },
    MinorGridLines: {
        width: 0.7,
        color: '',
        dashArray: ''
    },
    LabelStyle: {
        color: '',
        fontFamily: '',
        fontStyle: '',
        fontWeight: '',
        opacity: 1,
        fontSize: '',
        align: 'Center',
        rotationAngle: 0,
        format: '',
        skeleton: '',
        padding: 5,
        position: 'Outside',
        placement: 'BetweenTicks',
        intersectAction: 'Trim',
        enableWrap: false,
        enableTrim: false,
        maxLabelWidth: 34,
        edgeLabelPlacement: 'Shift'
    },
    TitleStyle: {
        color: '',
        fontFamily: '',
        fontStyle: '',
        fontWeight: '',
        opacity: 1,
        fontSize: '',
        align: 'Center',
        overflow: 'Wrap',
        text: '',
        padding: 5,
        rotationAngle: undefined
    },
    PrimaryXAxis: {
        name: 'primaryXAxis',
        span: 1,
        rowIndex: 0,
        columnIndex: 0,
        valueType: 'Double',
        opposedPosition: false,
        indexed: false,
        visible: true,
        minimum: undefined,
        maximum: undefined,
        interval: undefined,
        startFromZero: true,
        desiredIntervals: undefined,
        maxLabelDensity: 3,
        zoomFactor: 1,
        zoomPosition: 0,
        series: [],
        labels: [],
        indexLabels: {},
        axisMajorGridLineOptions: [],
        axisMajorTickLineOptions: [],
        axisMinorGridLineOptions: [],
        axisMinorTickLineOptions: [],
        axisLabelBorderOptions: [],
        axislabelOptions: [],
        axisTitleOptions: [],
        internalVisibility: true,
        actualRange: { minimum: 0, maximum: 0, interval: 0, delta: 0 },
        doubleRange: { start: 0, end: 0, delta: 0, median: 0 },
        intervalDivs: [10, 5, 2, 1],
        visibleRange: { minimum: 0, maximum: 0, interval: 0, delta: 0 },
        visibleLabels: [],
        startLabel: '',
        endLabel: '',
        maxLabelSize: { height: 0, width: 0 },
        rect: { x: 0, y: 0, width: 0, height: 0 },
        updatedRect: { x: 0, y: 0, width: 0, height: 0 },
        axisLineOptions: {
            id: '',
            d: '',
            stroke: '',
            strokeWidth: 0,
            dashArray: '',
            fill: ''
        },
        paddingInterval: 0,
        maxPointLength: 0,
        isStack100: false,
        titleCollection: [],
        titleSize: { height: 0, width: 0 },
        isAxisOpposedPosition: false,
        isAxisInverse: false,
        angle: 0,
        rotatedLabel: '',
        labelStyle: {
            color: '',
            fontFamily: '',
            fontStyle: '',
            fontWeight: '',
            opacity: 1,
            fontSize: '',
            align: 'Center',
            rotationAngle: 0,
            format: '',
            skeleton: '',
            padding: 5,
            position: 'Outside',
            placement: 'BetweenTicks',
            intersectAction: 'Trim',
            enableWrap: false,
            enableTrim: false,
            maxLabelWidth: 34,
            edgeLabelPlacement: 'Shift'
        },
        titleStyle: {
            color: '',
            fontFamily: '',
            fontStyle: '',
            fontWeight: '',
            opacity: 1,
            fontSize: '',
            align: 'Center',
            overflow: 'Wrap',
            text: '',
            padding: 5,
            rotationAngle: undefined
        },
        lineStyle: { width: 1, color: '', dashArray: '' },
        plotOffset: {
            left: 0,
            top: 0,
            right: 0,
            bottom: 0
        },
        tickPosition: 'Outside',
        minorTicksPerInterval: 0,
        rangePadding: 'Auto',
        logBase: 10,
        crossAt: {
            value: undefined,
            axis: null,
            allowOverlap: true
        },
        majorGridLines: {
            width: 0,
            color: '',
            dashArray: ''
        },
        majorTickLines: {
            width: 0,
            height: 5,
            color: ''
        },
        minorTickLines: {
            width: 0.7,
            height: 5,
            color: ''
        },
        minorGridLines: {
            width: 0.7,
            color: '',
            dashArray: ''
        },
        intervalType: 'Auto',
        skeleton: '',
        skeletonType: 'DateTime',
        stripLines: [{ ...defaultStripLineSettings }]
    },
    PrimaryYAxis: {
        name: 'primaryYAxis',
        span: 1,
        rowIndex: 0,
        columnIndex: 0,
        valueType: 'Double',
        opposedPosition: false,
        indexed: false,
        visible: true,
        minimum: undefined,
        maximum: undefined,
        interval: undefined,
        startFromZero: true,
        desiredIntervals: undefined,
        maxLabelDensity: 3,
        zoomFactor: 1,
        zoomPosition: 0,
        logBase: 10,
        crossAt: {
            value: undefined,
            axis: undefined,
            allowOverlap: true
        },
        labelStyle: {
            color: '',
            fontFamily: '',
            fontStyle: '',
            fontWeight: '',
            opacity: 1,
            fontSize: '',
            align: 'Center',
            rotationAngle: 0,
            format: '',
            skeleton: '',
            padding: 5,
            position: 'Outside',
            placement: 'BetweenTicks',
            intersectAction: 'Trim',
            enableWrap: false,
            enableTrim: false,
            maxLabelWidth: 34,
            edgeLabelPlacement: 'Shift'
        },
        titleStyle: {
            color: '',
            fontFamily: '',
            fontStyle: '',
            fontWeight: '',
            opacity: 1,
            fontSize: '',
            align: 'Center',
            overflow: 'Wrap',
            text: '',
            padding: 5,
            rotationAngle: undefined
        },
        lineStyle: { width: 0, color: '', dashArray: '' },
        plotOffset: {
            left: 0,
            top: 0,
            right: 0,
            bottom: 0
        },
        tickPosition: 'Outside',
        minorTicksPerInterval: 0,
        rangePadding: 'Auto',
        majorGridLines: {
            width: 1,
            color: '',
            dashArray: ''
        },
        majorTickLines: {
            width: 0,
            height: 5,
            color: ''
        },
        minorTickLines: {
            width: 0.7,
            height: 5,
            color: ''
        },
        minorGridLines: {
            width: 0.7,
            color: '',
            dashArray: ''
        },
        stripLines: [{ ...defaultStripLineSettings }]
    },
    SecondaryAxis: {
        span: 1,
        rowIndex: 0,
        columnIndex: 0,
        valueType: 'Double',
        opposedPosition: false,
        indexed: false,
        visible: true,
        minimum: undefined,
        maximum: undefined,
        interval: undefined,
        startFromZero: true,
        desiredIntervals: undefined,
        maxLabelDensity: 3,
        zoomFactor: 1,
        zoomPosition: 0,
        series: [],
        labels: [],
        indexLabels: {},
        axisMajorGridLineOptions: [],
        axisMajorTickLineOptions: [],
        axisMinorGridLineOptions: [],
        axisMinorTickLineOptions: [],
        axisLabelBorderOptions: [],
        axislabelOptions: [],
        axisTitleOptions: [],
        internalVisibility: true,
        actualRange: { minimum: 0, maximum: 0, interval: 0, delta: 0 },
        doubleRange: { start: 0, end: 0, delta: 0, median: 0 },
        intervalDivs: [10, 5, 2, 1],
        visibleRange: { minimum: 0, maximum: 0, interval: 0, delta: 0 },
        visibleLabels: [],
        startLabel: '',
        endLabel: '',
        maxLabelSize: { height: 0, width: 0 },
        rect: { x: 0, y: 0, width: 0, height: 0 },
        updatedRect: { x: 0, y: 0, width: 0, height: 0 },
        axisLineOptions: {
            id: '',
            d: '',
            stroke: '',
            strokeWidth: 0,
            dashArray: '',
            fill: ''
        },
        paddingInterval: 0,
        maxPointLength: 0,
        isStack100: false,
        titleCollection: [],
        titleSize: { height: 0, width: 0 },
        isAxisOpposedPosition: false,
        isAxisInverse: false,
        angle: 0,
        rotatedLabel: '',
        labelStyle: {
            color: '',
            fontFamily: '',
            fontStyle: '',
            fontWeight: '',
            opacity: 1,
            fontSize: '',
            align: 'Center',
            rotationAngle: 0,
            format: '',
            skeleton: '',
            padding: 5,
            position: 'Outside',
            placement: 'BetweenTicks',
            intersectAction: 'Trim',
            enableWrap: false,
            enableTrim: false,
            maxLabelWidth: 34,
            edgeLabelPlacement: 'Shift'
        },
        titleStyle: {
            color: '',
            fontFamily: '',
            fontStyle: '',
            fontWeight: '',
            opacity: 1,
            fontSize: '',
            align: 'Center',
            overflow: 'Wrap',
            text: '',
            padding: 5,
            rotationAngle: undefined
        },
        lineStyle: { width: 0, color: '', dashArray: '' },
        plotOffset: {
            left: 0,
            top: 0,
            right: 0,
            bottom: 0
        },
        tickPosition: 'Outside',
        minorTicksPerInterval: 0,
        rangePadding: 'Auto',
        logBase: 10,
        crossAt: {
            value: undefined,
            axis: null,
            allowOverlap: true
        },
        majorGridLines: {
            width: 0,
            color: '',
            dashArray: ''
        },
        majorTickLines: {
            width: 0,
            height: 5,
            color: ''
        },
        minorTickLines: {
            width: 0.7,
            height: 5,
            color: ''
        },
        minorGridLines: {
            width: 0.7,
            color: '',
            dashArray: ''
        },
        stripLines: [{ ...defaultStripLineSettings }]
    },
    ChartSeries: {
        type: 'Line',
        visible: true,
        xField: '',
        yField: '',
        name: '',
        opacity: 1,
        dashArray: '',
        width: 2,
        marker: {
            visible: false,
            width: 7,
            height: 7,
            shape: null,
            filled: true,
            imageUrl: '',
            fill: null,
            border: {
                width: 2,
                color: '',
                dashArray: ''
            },
            offset: { x: 0, y: 0 },
            opacity: 1,
            highlightable: true,
            dataLabel: {
                visible: false,
                showZero: true,
                labelField: null,
                fill: 'transparent',
                format: null,
                opacity: 1,
                rotationAngle: 0,
                enableRotation: false,
                template: undefined,
                position: 'Auto',
                borderRadius: { x: 5, y: 5 },
                textAlign: 'Center',
                border: { width: 1, color: '' },
                margin: {
                    right: 5, bottom: 5, left: 5, top: 5
                },
                font: {
                    fontStyle: 'Normal',
                    fontSize: '12px',
                    fontWeight: 'Normal',
                    color: '',
                    fontFamily: '',
                    opacity: 1
                }
            }
        },
        fill: null,
        interior: '',
        border: { width: 0, color: '' },
        animation: { enable: true, duration: 1000, delay: 0 },
        xAxisName: null,
        yAxisName: null,
        dataSource: '',
        legendShape: 'SeriesType',
        query: '',
        enableComplexProperty: false,
        zOrder: 0,
        splineType: 'Natural',
        step: 'Left',
        clipRect: { x: 0, y: 0, width: 0, height: 0 },
        dataModule: null,
        points: [],
        category: '',
        index: 0,
        yMin: 0,
        xMin: 0,
        xMax: 0,
        xData: [],
        yData: [],
        yMax: 0,
        symbolElement: null,
        visiblePoints: [],
        currentViewData: [],
        emptyPointSettings: { fill: 'gray', mode: 'Gap', border: { color: 'gray', width: 1 } },
        noRisers: false,
        colorField: '',
        currentData: [],
        accessibility: {
            ariaLabel: '',
            focusable: true,
            tabIndex: 0,
            role: ''
        },
        cornerRadius: { topLeft: 0, topRight: 0, bottomLeft: 0, bottomRight: 0 },
        groupName: '',
        isLegendClicked: false,
        sizeField: '',
        minRadius: 1,
        maxRadius: 3,
        enableTooltip: true,
        errorBar: {
            visible: false,
            type: 'Custom',
            color: '',
            verticalError: 1,
            width: 1,
            horizontalError: 0,
            errorBarCap: {
                width: 1,
                length: 10,
                color: '',
                opacity: 1
            },
            errorBarColorField: ''
        },
        enableSolidCandles: false,
        bullFillColor: null,
        bearFillColor: null,
        high: '',
        low: '',
        open: '',
        close: ''
    },
    ChartStackLabels: {
        visible: false,
        fill: 'transparent',
        border: {
            width: undefined,
            color: undefined
        },
        font: {
            fontStyle: 'Normal',
            fontSize: '12px',
            fontWeight: 'Normal',
            color: '',
            fontFamily: ''
        },
        align: 'Center',
        margin: {
            left: 5,
            right: 5,
            top: 5,
            bottom: 5
        },
        rotationAngle: 0,
        borderRadius: { x: 5, y: 5 },
        format: ''
    },
    ChartTooltip: {
        enable: false,
        showMarker: true,
        shared: false,
        fill: undefined,
        headerText: undefined,
        opacity: undefined,
        format: undefined,
        template: undefined,
        enableAnimation: true,
        duration: 300,
        fadeOutDuration: 1000,
        showNearestPoint: true,
        showNearestTooltip: true,
        showHeaderLine: false,
        location: undefined,
        border: { color: '', width: 1, dashArray: '' },
        fadeOutMode: 'Move',
        textStyle: { color: '', fontFamily: '', fontSize: '', fontStyle: '' }

    },
    ChartLegend: {
        visible: true,
        height: undefined,
        width: undefined,
        location: { x: 0, y: 0 },
        position: 'Auto',
        padding: 8,
        itemPadding: 0,
        align: 'Center',
        textStyle: {
            opacity: 1
        },
        shapeHeight: undefined,
        shapeWidth: undefined,
        border: { width: 1, color: '', dashArray: '' },
        margin: { left: 0, right: 0, top: 0, bottom: 0 },
        containerPadding: { left: 0, right: 0, top: 0, bottom: 0 },
        shapePadding: 8,
        background: 'transparent',
        opacity: 1,
        toggleVisibility: true,
        title: undefined,
        titleAlign: 'Center',
        titleStyle: {
            opacity: 1
        },
        titleOverflow: 'Wrap',
        maxTitleWidth: 100,
        maxLabelWidth: undefined,
        enablePages: true,
        inversed: false,
        reverse: false,
        fixedWidth: false,
        accessibility: { tabIndex: 0, focusable: true }
    },
    ChartZoom: {
        selectionZoom: false,
        pan: false,
        mode: 'XY',
        toolbar: { visible: false, items: ['ZoomIn', 'ZoomOut', 'Pan', 'Reset'] },
        accessibility: {},
        mouseWheelZoom: false,
        pinchZoom: false
    },
    ChartSelection: {
        mode: 'None',
        allowMultiSelection: false,
        selectedDataIndexes: [],
        pattern: 'None'
    },
    ChartHighlight: {
        mode: 'None',
        fill: '',
        pattern: 'None'
    },
    AxisCrosshairTooltip: {
        enable: false,
        fill: undefined,
        textStyle: {
            fontStyle: 'Normal',
            fontSize: '',
            fontWeight: 'Normal',
            color: '',
            fontFamily: '',
            opacity: 1
        }
    },
    ChartCrosshair: {
        enable: false,
        lineStyle: {
            color: '',
            width: 1.3,
            dashArray: '5,5'
        },
        highlightCategory: false,
        lineType: 'Both',
        snap: true
    },
    ChartAnnotation: {
        x: '0',
        y: '0',
        content: '',
        coordinateUnit: 'Point',
        hAlign: 'Center',
        vAlign: 'Center',
        xAxisName: null,
        yAxisName: null,
        accessibility: {
            ariaLabel: '',
            role: 'img',
            focusable: false,
            tabIndex: 0
        }
    },
    StripLines: [{ ...defaultStripLineSettings }]
};

