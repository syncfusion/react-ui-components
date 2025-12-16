import { PieChartTooltipProps, PieChartBorderProps, PieChartCenterLabelProps, PieChartMarginProps, PieChartTitleProps, PieChartDataLabelProps } from './interfaces';
import { BaseLegend, Chart, SeriesProperties } from './internal-interfaces';

/**
 * Defines the configuration structure for a chart, including layout, title, and subtitle settings.
 *
 * @private
 */
interface ChartConfig {
    chart: {
        border: PieChartBorderProps;
        margin: PieChartMarginProps
    };
    ChartTitle: PieChartTitleProps;
    ChartSubTitle: PieChartTitleProps;
    ChartLegend: BaseLegend;
    ChartSeries: Partial<SeriesProperties>;
    CenterLabel: PieChartCenterLabelProps;
    ChartTooltip: PieChartTooltipProps;
    ChartDataLabel: PieChartDataLabelProps;
}

/**
 * Default configuration values for rendering a chart.
 * Includes layout settings such as border and margin, as well as title and subtitle styles.
 *
 * @type {ChartConfig}
 */
export const defaultChartConfigs: ChartConfig = {
    chart: {
        border: { color: '#DDDDDD', width: 0, dashArray: '' },
        margin: { top: 10, right: 10, bottom: 10, left: 10 }
    },
    ChartTitle: {
        text: '',
        font: {
            color: '',
            fontFamily: '',
            fontSize: '',
            fontStyle: '',
            fontWeight: '',
            opacity: 1
        },
        align: 'Center',
        position: 'Top',
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
        font: {
            color: '',
            fontFamily: '',
            fontSize: '',
            fontStyle: '',
            fontWeight: '',
            opacity: 1
        },
        align: 'Center',
        position: 'Top',
        textOverflow: 'Wrap',
        x: 0,
        y: 0,
        background: 'transparent',
        border: { color: 'transparent', width: 0, dashArray: '', cornerRadius: 0.8 },
        accessibility: {
            ariaLabel: '',
            role: 'img',
            focusable: false,
            tabIndex: 0
        }
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
        accessibility: { tabIndex: 0, focusable: true },
        maxItemHeight: 0,
        rowHeights: [],
        pageHeights: [],
        columnHeights: [],
        legendCollections: [],
        legendTitleCollections: [],
        legendItemPadding: 0,
        isRtlEnable: false,
        isReverse: false,
        isVertical: false,
        isPaging: false,
        clipPathHeight: 0,
        totalPages: 0,
        fivePixel: 5,
        rowCount: 0,
        pageButtonSize: 8,
        maxWidth: 0,
        legendID: '',
        currentPage: 1,
        backwardArrowOpacity: 0,
        forwardArrowOpacity: 1,
        accessbilityText: '',
        arrowWidth: 26,
        arrowHeight: 26,
        chartRowCount: 1,
        legendTitleSize: { height: 0, width: 0 },
        isTitle: false,
        currentPageNumber: 1,
        legendRegions: [],
        pagingRegions: [],
        totalNoOfPages: 0,
        legendTranslate: '',
        legendPosition: 'Auto',
        shape: 'SeriesType'
    },
    ChartSeries: {
        visible: true,
        dataSource: {},
        chart: {} as Chart,
        index: 0,
        points: [],
        sumOfPoints: 0,
        clubbedPoints: [],
        query: '',
        xField: '',
        yField: '',
        colorField: '',
        radius: '80%',
        elementOptions: [],
        startAngle: 0,
        groupTo: null,
        animation: { enable: true, duration: 1000, delay: 0 },
        borderRadius: 5,
        border: { width: 1, color: '' },
        explodeOffset: '15%',
        showBorderOnHover: true,
        accessibility: {
            ariaLabel: '',
            role: 'img',
            focusable: true,
            tabIndex: 0
        }
    },
    ChartDataLabel: {
        visible: false,
        showZero: true,
        name: undefined,
        fill: 'transparent',
        enableRotation: false,
        position: 'Inside',
        rotationAngle: 0,
        border: { width: 1, color: '' },
        rx: 5,
        ry: 5,
        font: {
            fontStyle: 'Normal',
            fontSize: '12px',
            fontWeight: 'Normal',
            color: '',
            fontFamily: '',
            opacity: 1
        },
        connectorStyle: {},
        format: '',
        maxLabelWidth: undefined
    },
    CenterLabel: {
        label: [{
            text: '',
            textStyle: {
                fontFamily: 'Roboto',
                fontSize: '16px',
                fontStyle: 'Normal',
                fontWeight: '600',
                color: '',
                opacity: 1
            }
        }],
        hoverTextFormat: ''
    },
    ChartTooltip: {
        enable: false,
        showMarker: true,
        fill: undefined,
        headerText: undefined,
        opacity: undefined,
        format: undefined,
        template: undefined,
        enableAnimation: true,
        duration: 300,
        fadeOutDuration: 150,
        showHeaderLine: false,
        location: undefined,
        border: { color: '', width: 1, dashArray: '' },
        fadeOutMode: 'Move',
        textStyle: { color: '', fontFamily: '', fontSize: '', fontStyle: '' }

    }
};
