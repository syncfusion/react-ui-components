import { SanitizeHtmlHelper } from '@syncfusion/react-base';
import { ChartSizeProps, TextOption } from '../../../chart-area/chart-interfaces';

/**
 * Per-element measurement cache for axis-label template resolution.
 *
 * @private
 */
const templateResolutionCache: WeakMap<HTMLElement, {
    html: string;
    text: string;
    size: ChartSizeProps;
}> = new WeakMap();

/**
 * Shared measurement cache keyed by the sanitized template output.
 *
 * @private
 */
const templateSizeCache: Map<string, ChartSizeProps> = new Map();

/**
 * Type guard for formatter return values.
 *
 * @param {*} value - The value to inspect.
 * @returns {boolean} True when the value is an HTMLElement.
 * @private
 */
export function isHtmlElement(value: unknown): value is HTMLElement {
    return typeof HTMLElement !== 'undefined' && value instanceof HTMLElement;
}

/**
 * Resolves a template string or function into an HTMLElement using the label value and text.
 *
 * @param {string | Function} template The HTML template string or function to resolve.
 * @param {number} value The axis label value.
 * @param {string} text The formatted axis label text.
 * @returns {HTMLElement | null} The resolved template element or null when it cannot be created.
 * @private
 */
export function createAxisLabelTemplateElement(template: string | Function, value: number, text: string): HTMLElement | null {
    if (typeof document === 'undefined' || !template) {
        return null;
    }

    const templateResult: string | HTMLElement | null | undefined = typeof template === 'function'
        ? (() => {
            try {
                return template(value, text);
            } catch (error) {
                return null;
            }
        })()
        : template;

    if (isHtmlElement(templateResult)) {
        return templateResult;
    }

    const templateString: string = typeof templateResult === 'string'
        ? templateResult
        : templateResult === null || templateResult === undefined || templateResult === false
            ? ''
            : `${templateResult}`;

    if (!templateString) {
        return null;
    }

    const resolvedTemplate: string = templateString.replace(/\$\{([^}]+)\}/g, (_match: string, expression: string): string => {
        try {
            const templateFunction: (value: number, label: string, textValue: string) => unknown
                = new Function('value', 'label', 'text', `return (${expression});`) as (
                    value: number,
                    label: string,
                    textValue: string
                ) => unknown;
            const resolvedValue: unknown = templateFunction(value, text, text);
            return resolvedValue === null || resolvedValue === undefined ? '' : `${resolvedValue}`;
        } catch (error) {
            return '';
        }
    });

    const container: HTMLDivElement = document.createElement('div');
    container.innerHTML = resolvedTemplate;

    if (container.childElementCount === 1 && container.childNodes.length === 1) {
        return container.firstElementChild as HTMLElement;
    }

    if (container.childElementCount > 0 || container.textContent) {
        return container;
    }

    return null;
}

export const renderAxisLabelTemplates: (
    options: TextOption[]
) => React.ReactNode = (options: TextOption[]) => {
    if (!options.length) {
        return null;
    }

    return options.map((option: TextOption) => {
        const size: ChartSizeProps = option.templateSize || {
            width: 0,
            height: 0
        };

        let left: number = option.x;
        let top: number = option.y;

        switch (option.anchor) {
        case 'middle':
            left -= size.width / 2;
            break;
        case 'end':
            left -= size.width;
            break;
        default:
            break;
        }

        top -= size.height / 2;

        return (
            <div
                key={option.id}
                id={option.id}
                style={{
                    position: 'absolute',
                    left: `${left}px`,
                    top: `${top}px`,
                    width: `${size.width}px`,
                    height: `${size.height}px`,
                    transition: 'fill 0.4s ease, opacity 0.4s ease',
                    pointerEvents: 'auto',
                    transform: option.labelRotation
                        ? `rotate(${option.labelRotation}deg)`
                        : undefined,
                    transformOrigin: `${option.anchor || 'start'} center`,
                    opacity: option.opacity
                }}
                dangerouslySetInnerHTML={{
                    __html: option.templateHtml as string
                }}
            />
        );
    });
};

/**
 * Resolves an axis label formatter result into sanitized HTML,
 * display text, and measured dimensions.
 *
 * @param {HTMLElement} element The formatter result. Must not be `null`.
 * @param {string} fallbackText The axis label text used when the element has no
 * text content (empty or whitespace-only after trim).
 * @returns {{html: string, text: string, size: ChartSizeProps}} The sanitized
 * HTML, resolved text, and measured size.
 * @private
 */
export function resolveAxisLabelTemplate(element: HTMLElement, fallbackText: string): {
    html: string;
    text: string;
    size: ChartSizeProps;
} {
    const cached: { html: string; text: string; size: ChartSizeProps } | undefined
        = templateResolutionCache.get(element);
    if (cached) {
        return cached;
    }
    const html: string = SanitizeHtmlHelper.sanitize(element.outerHTML || '');
    const text: string = (element.textContent || '').trim() || fallbackText;
    const cacheKey: string = `${html.length}\u0001${html}\u0001${text.length}\u0001${text}`;
    const cachedSize: ChartSizeProps | undefined = templateSizeCache.get(cacheKey);

    if (cachedSize) {
        const cachedResult: { html: string; text: string; size: ChartSizeProps } = {
            html,
            text,
            size: cachedSize
        };
        templateResolutionCache.set(element, cachedResult);
        return cachedResult;
    }

    if (typeof document === 'undefined') {
        const result: { html: string; text: string; size: ChartSizeProps } = {
            html,
            text,
            size: { width: 0, height: 0 }
        };
        templateResolutionCache.set(element, result);
        templateSizeCache.set(cacheKey, result.size);
        return result;
    }

    const container: HTMLDivElement = document.createElement('div');
    container.style.position = 'absolute';
    container.style.visibility = 'hidden';
    container.style.pointerEvents = 'none';
    container.style.left = '-10000px';
    container.style.top = '-10000px';
    container.style.display = 'inline-block';
    container.style.whiteSpace = 'normal';
    container.innerHTML = html;

    document.body.appendChild(container);
    const rect: DOMRect = container.getBoundingClientRect();
    const size: ChartSizeProps = {
        width: Math.max(1, Math.ceil(rect.width)),
        height: Math.max(1, Math.ceil(rect.height))
    };
    document.body.removeChild(container);

    const result: { html: string; text: string; size: ChartSizeProps } = {
        html,
        text,
        size
    };
    templateResolutionCache.set(element, result);
    templateSizeCache.set(cacheKey, size);
    return result;
}
