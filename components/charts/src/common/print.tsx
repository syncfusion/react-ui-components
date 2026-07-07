import { createElement, print as printWindow } from '@syncfusion/react-base';
import { IPieChart } from '../pie-chart';
import { Theme } from './enum';
import { IChart } from '../chart';

/**
 * Opens the provided chart in a new browser window and triggers the browser's print dialog.
 *
 * This method prepares the chart's HTML content and renders it in a dedicated
 * print window. The browser's native print dialog is then triggered, allowing
 * the user to print the chart.
 *
 * ### Key Features:
 * - Renders chart content in a dedicated print window
 * - Automatically adjusts window size for better print layout
 * - Applies the chart's current theme (defaults to `'Material'` if not specified)
 * - Triggers the browser print dialog without additional user interaction
 *
 * @param {IPieChart | IChart} chart - The chart instance to print.
 * This must be a fully initialized chart object containing a valid `element`
 * property that represents the chart's root DOM node.
 *
 * @returns {void} This method does not return a value. It opens a new browser
 * window and invokes the print dialog for the rendered chart content.
 *
 */
export function print(chart: IPieChart | IChart): void {
    if (!chart.element) {
        return;
    }
    const elements: HTMLElement = chart.element;
    const printWindows: Window | null = window.open('', 'print', 'height=' + window.outerHeight + ',width=' + window.outerWidth + ',tabbar=no');
    printWindows?.moveTo(0, 0);
    printWindows?.resizeTo(screen.availWidth, screen.availHeight);
    const htmlContent: Element = getHTMLContent(elements, chart?.theme || 'Material');
    printWindow(htmlContent, printWindows);
}

/**
 * Generates printable HTML content by cloning the chart element and applying theme-based background adjustments.
 *
 * @param {HTMLElement} element - Specifies the root chart element to clone for printing.
 * @param {Theme} theme - Specifies the theme applied to the chart. This is used to determine the appropriate SVG background color (light or dark).
 * @returns {HTMLElement} - Returns a container element holding the prepared printable content.
 * @private
 */
export function getHTMLContent(element: HTMLElement, theme: Theme): HTMLElement {
    const div: HTMLElement = createElement('div');
    const printStyle: HTMLStyleElement = createElement('style') as HTMLStyleElement;

    const clonedElement: HTMLElement = element.cloneNode(true) as HTMLElement;

    const computedStyle: CSSStyleDeclaration = window.getComputedStyle(element as HTMLElement);
    clonedElement.style.width = computedStyle.width;
    clonedElement.style.height = computedStyle.height;
    clonedElement.style.display = computedStyle.display;
    clonedElement.style.position = 'relative';
    clonedElement.style.overflow = 'visible';

    printStyle.textContent = [
        '@page { margin: 0; }',
        'html, body { margin: 0; padding: 0; }'
    ].join(' ');

    div.appendChild(printStyle);
    div.appendChild(clonedElement);

    div.style.width = 'fit-content';
    div.style.maxWidth = '100%';
    div.style.height = 'fit-content';
    div.style.overflow = 'visible';

    for (let index: number = 0; index < div.children.length; index++) {
        const backgroundColor: string = theme.indexOf('Dark') > -1 || theme.indexOf('HighContrast') > -1
            ? 'rgba(0, 0, 0, 1)' : 'rgba(255, 255, 255, 1)';

        const svg: HTMLElement = div.children[index as number] as HTMLElement;

        for (let childIndex: number = 0; childIndex < svg.children.length; childIndex++) {
            const child: HTMLElement = svg.children[childIndex as number] as HTMLElement;

            if (child.id.indexOf('_svg') > -1) {
                const svgRoot: SVGElement = child.children[0] as SVGElement;
                let fill: string = svgRoot.getAttribute('fill') || backgroundColor;

                if (fill === 'transparent') {
                    fill = backgroundColor;
                }

                svgRoot.setAttribute('fill', fill);
            }
        }
    }

    return div;
}
