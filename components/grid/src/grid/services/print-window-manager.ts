import * as React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { RefObject } from 'react';
import { Provider } from '@syncfusion/react-base';
import { Grid } from '../../index';
import { PrintResult, PrintSettings } from '../types/print.interfaces';
import { ColumnProps } from '../types/column.interfaces';
import { GridRef } from '../types/grid.interfaces';

// Print window constants
const PRINT_ROOT_ELEMENT_ID: string = 'root';
const PRINT_TEXT_DIRECTION_RTL: string = 'rtl';
const PRINT_TEXT_DIRECTION_LTR: string = 'ltr';
const PRINT_GRID_CLASS: string = 'sf-print-grid';
const PRINT_GRID_CONTENT_CLASS: string = 'sf-grid-content';
const PRINT_ROOT_ELEMENT_ERROR: string = 'Root element not found in print window.';
const PRINT_WINDOW_BLOCKED_ERROR: string = 'Print window blocked or failed to open. Please check browser popup settings.';
const PRINT_RENDER_DELAY: number = 500;
const PRINT_CLOSE_DELAY: number = 100;

/**
 * Extract styles from document head and body elements
 *
 * @returns {string} Concatenated style references as HTML string
 */
function extractStylesFromDocument(): string {
    let styleReference: string = '';

    const headStyles: HTMLElement[] = [].slice.call(
        document.getElementsByTagName('head')[0].querySelectorAll('base, link, style')
    ) as HTMLElement[];

    const bodyStyles: HTMLElement[] = [].slice.call(
        document.getElementsByTagName('body')[0].querySelectorAll('link, style')
    ) as HTMLElement[];

    const allStyles: HTMLElement[] = [...headStyles, ...bodyStyles];

    allStyles.forEach((element: HTMLElement) => {
        styleReference += element.outerHTML;
    });

    return styleReference;
}

/**
 * Build HTML boilerplate for print window with styles and locale settings
 *
 * @param {string} title - The title for the print window
 * @param {string} locale - The locale setting for the print window
 * @param {boolean} enableRtl - Whether to enable right-to-left text direction
 * @returns {string} The HTML boilerplate string
 */
function buildHtmlBoilerplate(title: string, locale: string, enableRtl: boolean): string {
    const lang: string = locale.split('-')[0];
    const dir: string = enableRtl ? PRINT_TEXT_DIRECTION_RTL : PRINT_TEXT_DIRECTION_LTR;
    const styleReference: string = extractStylesFromDocument();

    return `
<!DOCTYPE html>
<html lang="${lang}" dir="${dir}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  ${styleReference}
  <style>
    .${PRINT_GRID_CLASS} .${PRINT_GRID_CONTENT_CLASS} {
        overflow-x: hidden;
    }
  </style>
</head>
<body>
  <div id="${PRINT_ROOT_ELEMENT_ID}"></div>
</body>
</html>
  `;
}

/**
 * Render grid in print window and trigger print operation
 *
 * @param {Window} printWindow - The print window object
 * @param {T[]} dataSource - The data to print
 * @param {ColumnProps[]} columns - The grid columns
 * @param {PrintSettings} config - The print configuration settings
 * @param {RefObject<GridRef<T>>} gridRef - Reference to the grid component
 * @returns {Promise<PrintResult>} Print operation result
 */
async function executeNewGridStrategy<T>(
    printWindow: Window,
    dataSource: T[],
    columns: ColumnProps[],
    config: PrintSettings,
    gridRef: RefObject<GridRef<T>>
): Promise<PrintResult> {
    try {
        const locale: string = gridRef.current?.locale;
        const enableRtl: boolean = gridRef.current?.enableRtl;

        printWindow.document.write(
            buildHtmlBoilerplate(
                config.title,
                locale,
                enableRtl
            )
        );
        printWindow.document.close();

        return new Promise((resolve: (value: PrintResult) => void) => {
            printWindow.addEventListener('load', () => {
                try {
                    const rootElement: HTMLElement = printWindow.document.getElementById(PRINT_ROOT_ELEMENT_ID);
                    if (!rootElement) {
                        throw new Error(PRINT_ROOT_ELEMENT_ERROR);
                    }

                    const root: Root = createRoot(rootElement);

                    const { scrollModule: _scrollModule, ...grid } = gridRef.current;

                    const gridElement: React.ReactElement = React.createElement(
                        Provider,
                        {
                            locale: locale,
                            dir: enableRtl ? PRINT_TEXT_DIRECTION_RTL : PRINT_TEXT_DIRECTION_LTR,
                            children: React.createElement(Grid, {
                                ...(grid),
                                dataSource: dataSource,
                                columns: columns,
                                className: `${grid.className} ${PRINT_GRID_CLASS}`,
                                height: 'auto',
                                width: 'auto',
                                toolbar: null,
                                filterSettings: { enabled: false },
                                sortSettings: { enabled: false },
                                pageSettings: { enabled: false },
                                virtualizationSettings: { enabled: false, preventMaxRenderedRows: true },
                                onDataLoad: () => {
                                    setTimeout(() => {
                                        printWindow.print();

                                        setTimeout(() => {
                                            printWindow.close();
                                        }, PRINT_CLOSE_DELAY);

                                        resolve({
                                            success: true
                                        });
                                    }, PRINT_RENDER_DELAY);
                                }
                            })
                        }
                    );

                    root.render(gridElement);
                } catch (error) {
                    resolve({
                        success: false,
                        ...(error && { error })
                    });
                }
            });
        });
    } catch (error) {
        return {
            success: false,
            ...(error && { error })
        };
    }
}

/**
 * Open print window and manage print execution lifecycle
 *
 * @private
 * @param {T[]} dataSource - The data to print
 * @param {ColumnProps[]} columns - The grid columns
 * @param {PrintSettings} config - The print configuration settings
 * @param {RefObject<GridRef<T>>} gridRef - Reference to the grid component
 * @returns {Promise<PrintResult>} Print window operation result
 */
export async function printWindowManager<T>(
    dataSource: T[],
    columns: ColumnProps[],
    config: PrintSettings,
    gridRef: RefObject<GridRef<T>>
): Promise<PrintResult> {
    try {
        const printWindow: Window = window.open(
            '',
            'PRINT_GRID',
            `height=${config.windowHeight},width=${config.windowWidth}`
        );

        if (!printWindow) {
            throw new Error(PRINT_WINDOW_BLOCKED_ERROR);
        }

        return await executeNewGridStrategy(
            printWindow,
            dataSource,
            columns,
            config,
            gridRef
        );
    } catch (error) {
        return {
            success: false,
            ...(error && { error })
        };
    }
}
