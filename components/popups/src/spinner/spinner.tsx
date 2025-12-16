import * as React from 'react';
import { forwardRef, useImperativeHandle, useMemo, useEffect, useRef} from 'react';
import { Color, preRender, formatUnit } from '@syncfusion/react-base';
export { Color };

/**
 * Specifies the visual style of the spinner animation.
 */
export enum SpinnerType {
    /**
     * Specifies a circular stroke animation (default).
     * Suitable for most use cases and provides a smooth rotating effect.
     */
    Circular = 'Circular',

    /**
     * Specifies a Cupertino-style spinner with 12 fading dots.
     * Inspired by iOS loading indicators.
     */
    Cupertino = 'Cupertino',

    /**
     * Specifies a single circular stroke animation.
     * This is a slight variation of the default Circular type.
     */
    SingleCircle = 'SingleCircle',

    /**
     * Specifies a double circle animation with two concentric strokes.
     * Each circle animates with alternating dash segments.
     */
    DoubleCircle = 'DoubleCircle'
}


export interface SpinnerProps {
    /**
     * Specifies optional text displayed next to the spinner.
     * Recommended for accessibility when the surrounding UI lacks context.
     *
     * @default -
     */
    label?: string;

    /**
     * Specifies whether the spinner is visible.
     * When set to false, renders null.
     *
     * @default true
     */
    visible?: boolean;

    /**
     * Specifies the stroke thickness for circular variants.
     * Accepts any valid CSS length (e.g., '3px').
     *
     * @default '3px'
     */
    thickness?: string;

    /**
     * Specifies the animation duration for spinner effects such as rotation, fade, or pulse.
     * Accepts values like '1s' or '800ms'.
     *
     * @default '1s'
     */
    animationDuration?: string;

    /**
     * Specifies whether the spinner should render as a fullscreen fixed overlay with a dimmed backdrop.
     *
     * @default false
     */
    overlay?: boolean;

    /**
     * Specifies the visual style of the spinner.
     * Available options (SpinnerType):
     * - Circular: Single circular stroke with continuous rotation
     * - Cupertino: Fading tick marks around a circle (iOS-style)
     * - SingleCircle: Dashed single circle rotating
     * - DoubleCircle: Two concentric dashed circles animating
     *
     * @default SpinnerType.Circular
     */
    type?: SpinnerType;

    /**
     * Specifies the spinner size.
     * - number: interpreted as pixels (e.g., 40 → 40px)
     * - string: supports 'px' and 'em' units (e.g., '40px', '2em')
     *
     * @default 36px
     */
    size?: string | number;

    /**
     *Specifies the Color style of the spinner. Options include 'Primary', 'Secondary', 'Warning', 'Success', 'Error', and 'Info'.
     *
     * @default Color.Primary
     */
    color?: Color;
}
/**
 * Renders the default circular spinner SVG graphic.
 *
 * @param props - Spinner visualization settings.
 */
export interface ISpinner extends SpinnerProps {
    /**
     * Ref to the rendered root element. Exposed via forwardRef/useImperativeHandle.
     *
     * @private
     */
    element?: HTMLDivElement | null;
}
type SpinnerComponentProps = SpinnerProps & React.HTMLAttributes<HTMLDivElement>;

/**
 * Spinner shows a lightweight loading indicator for pending operations. It supports multiple styles
 * (Circular, Cupertino, SingleCircle, DoubleCircle), configurable size and thickness, theme colors, and a fullscreen overlay mode.
 *
 * Example
 * ```typescript
 * import { Spinner, SpinnerType, Color } from "@syncfusion/react-popups";
 *
 * export default function App() {
 *   return (<Spinner label="Loading data…" type={SpinnerType.Circular} size={36} color={Color.Primary} />);
 * }
 * ```
 */
export const Spinner: React.ForwardRefExoticComponent<SpinnerComponentProps & React.RefAttributes<ISpinner>> =
forwardRef<ISpinner, SpinnerComponentProps>((props: SpinnerComponentProps, ref: React.Ref<ISpinner>) => {
    const {
        className,
        label = '',
        visible = true,
        thickness = '3px',
        animationDuration = '1s',
        color = Color.Primary,
        size = '36px',
        overlay = false,
        type = SpinnerType.Circular,
        children,
        ...rest
    } = props;
    const elRef: React.RefObject<HTMLDivElement | null> = useRef<HTMLDivElement>(null);
    useEffect(() => {
        preRender('spinner');
    }, []);
    const spinnerSize: number = 36;
    const publicAPI: Partial<ISpinner> = useMemo(() => ({
        label,
        visible,
        thickness,
        animationDuration,
        color,
        size,
        overlay,
        type
    }), [label, visible, thickness, animationDuration, color, size, overlay, type]);
    useImperativeHandle(
        ref,
        () => ({ ...(publicAPI as ISpinner), element: elRef.current }),
        [publicAPI]
    );
    /**
     * Renders a circular SVG spinner.
     *
     * @param {Object} props - Component props.
     * @param {number} props.thickness - Thickness of the spinner stroke.
     * @param {string} props.duration - Duration of the rotation animation.
     * @returns {React.JSX.Element} - SVG spinner element.
     */
    const CircularSVG: React.FC<{
        thickness: number;
        duration: string;
    }> = ({
        thickness,
        duration
    }: {
        thickness: number;
        duration: string;
    }): React.JSX.Element => {
        const memoizedSVG: React.JSX.Element = useMemo(() => {
            const radius: number = (spinnerSize - thickness) / 2;
            const circumference: number = 2 * Math.PI * radius;
            return (
                <svg viewBox={`0 0 ${spinnerSize} ${spinnerSize}`} >
                    <circle
                        cx={spinnerSize / 2}
                        cy={spinnerSize / 2}
                        r={(spinnerSize - thickness) / 2}
                        strokeWidth={thickness}
                        strokeDasharray={circumference}
                        strokeDashoffset={circumference * 0.25}
                        strokeLinecap="round"
                        fill="none"
                        className={'sf-spinner-circle-inner'}
                        style={{
                            animation: `spinner-rotate ${duration} linear infinite`
                        }}
                    />
                </svg>
            );
        }, [thickness, duration, spinnerSize]);
        return memoizedSVG;
    };
    /**
     * Renders a Cupertino SVG spinner.
     *
     * @param {Object} props - Component props.
     * @param {number} props.thickness - Thickness of the spinner stroke.
     * @param {string} props.duration - Duration of the rotation animation.
     * @returns {React.JSX.Element} - SVG spinner element.
     */
    const CupertinoSVG: React.FC<{
        thickness: number;
        duration: string;
    }> = ({
        duration,
        thickness
    }: {
        thickness: number;
        duration: string;
    }): React.JSX.Element => {
        const dotElements: React.JSX.Element[] = useMemo(() => {
            const dotCount: number = 12;
            const radius: number = spinnerSize / 2 - spinnerSize * 0.1;
            const strokeWidth: number = thickness;
            const lineLength: number = spinnerSize * 0.15;
            const angleStep: number = 360 / dotCount;

            return Array.from({ length: dotCount }, (_: unknown, i: number) => {
                const angle: number = angleStep * i;
                const opacity: number = (i + 1) / dotCount;
                return (
                    <line
                        key={i}
                        x1={spinnerSize / 2}
                        y1={spinnerSize / 2 - radius}
                        x2={spinnerSize / 2}
                        y2={spinnerSize / 2 - radius + lineLength}
                        className="sf-spinner-cupertino-dots-inner"
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                        opacity={opacity}
                        transform={`rotate(${angle} ${spinnerSize / 2} ${spinnerSize / 2})`}
                    />
                );
            });
        }, [thickness]);

        return (
            <svg
                viewBox={`0 0 ${spinnerSize} ${spinnerSize}`}
                className={'sf-spinner-cupertino-dots'}
                style={{ animation: `spinner-rotate ${duration} linear infinite` }}
            >
                {dotElements}
            </svg>
        );
    };
    /**
     * Renders a DoubleCircle SVG spinner.
     *
     * @param {Object} props - Component props.
     * @param {number} props.thickness - Thickness of the spinner stroke.
     * @param {string} props.duration - Duration of the rotation animation.
     * @returns {React.JSX.Element} - SVG spinner element.
     */
    const DoubleCircle: React.FC<{
        thickness: number;
        duration: string;
    }> = ({
        thickness,
        duration
    }: {
        thickness: number;
        duration: string;
    }): React.JSX.Element => {
        const {
            outerCircleRadius,
            innerCircleRadius,
            outerDashLength,
            innerDashLength
        } = React.useMemo(() => {
            const outerCircleRadius: number = (spinnerSize - thickness) / 2;
            const innerCircleRadius: number = (spinnerSize - thickness * 5) / 2;
            const outerCircleCircumference: number = 2 * Math.PI * outerCircleRadius;
            const innerCircleCircumference: number = 2 * Math.PI * innerCircleRadius;
            const dashSegmentPairs: number = 4;
            const outerDashLength: number = outerCircleCircumference / (dashSegmentPairs * 2);
            const innerDashLength: number = innerCircleCircumference / (dashSegmentPairs * 2);
            return {
                outerCircleRadius,
                innerCircleRadius,
                outerDashLength,
                innerDashLength
            };
        }, [thickness, spinnerSize]);

        return (
            <>
                <svg
                    viewBox={`0 0 ${spinnerSize} ${spinnerSize}`}
                    className={'sf-spinner-doublecircle-inner'}
                >
                    <circle
                        cx={spinnerSize / 2}
                        cy={spinnerSize / 2}
                        r={outerCircleRadius}
                        strokeWidth={thickness}
                        fill="none"
                        strokeDasharray={`${outerDashLength} ${outerDashLength}`}
                        strokeLinecap="round"
                        style={{
                            animation: `spinner-dash ${duration} linear infinite`
                        }}
                    />
                </svg>
                <svg
                    viewBox={`0 0 ${spinnerSize} ${spinnerSize}`}
                    className={'sf-spinner-doublecircle-second-inner'}
                >
                    <circle
                        cx={spinnerSize / 2}
                        cy={spinnerSize / 2}
                        r={innerCircleRadius}
                        strokeWidth={Math.max(1, thickness - 1)}
                        fill="none"
                        strokeDasharray={`${innerDashLength} ${innerDashLength}`}
                        strokeLinecap="round"
                        style={{
                            animation: `spinner-dash ${duration} linear infinite`
                        }}
                    />
                </svg>
            </>
        );
    };
    /**
     * Renders a SingleCircle SVG spinner.
     *
     * @param {Object} props - Component props.
     * @param {number} props.thickness - Thickness of the spinner stroke.
     * @param {string} props.duration - Duration of the rotation animation.
     * @returns {React.JSX.Element} - SVG spinner element.
     */
    const SingleCircle: React.FC<{
        thickness: number;
        duration: string;
    }>  = ({
        thickness,
        duration
    }: {
        thickness: number;
        duration: string;
    }): React.JSX.Element => {
        const svgContent: React.JSX.Element = React.useMemo(() => {
            const radius: number = (spinnerSize - thickness) / 2;
            const circumference: number = 2 * Math.PI * radius;
            const segmentCount: number = 8;
            const dashLength: number = circumference / (segmentCount * 2);

            return (
                <svg
                    viewBox={`0 0 ${spinnerSize} ${spinnerSize}`}
                >
                    <circle
                        cx={spinnerSize / 2}
                        cy={spinnerSize / 2}
                        r={radius}
                        strokeWidth={thickness}
                        fill="none"
                        className={'sf-spinner-singlecircle-inner'}
                        strokeDasharray={`${dashLength} ${dashLength}`}
                        strokeLinecap="round"
                        style={{
                            animation: `spinner-rotate ${duration} linear infinite`
                        }}
                    />
                </svg>
            );
        }, [thickness, duration]);

        return svgContent;
    };

    const normalizeAnimationDuration: (input: string) => string = (input: string) => {
        if (typeof input !== 'string') {return '1s'; }
        const validUnits: string[] = ['ms', 's'];
        for (const unit of validUnits) {
            if (input.endsWith(unit)) {
                const numberPart: string = input.slice(0, -unit.length);
                const number: number = parseFloat(numberPart);
                if (!isNaN(number)) {
                    return `${number}${unit}`;
                }
            }
        }
        return '1s';
    };

    const colorValue: Color = color;
    const thickValue: number = Math.max(1, parseFloat(thickness) || 3);
    const durationValue: string = React.useMemo( () => normalizeAnimationDuration(animationDuration), [animationDuration] );
    const spinnerNode: React.ReactNode = useMemo(() => {
        if (children != null) {
            return children;
        }
        switch (type) {
        case SpinnerType.Cupertino:
            return <CupertinoSVG  thickness={thickValue} duration={durationValue} />;
        case SpinnerType.DoubleCircle:
            return <DoubleCircle  thickness={thickValue} duration={durationValue} />;
        case SpinnerType.SingleCircle:
            return <SingleCircle  thickness={thickValue} duration={durationValue} />;
        case SpinnerType.Circular:
        default:
            return <CircularSVG  thickness={thickValue} duration={durationValue} />;
        }
    }, [children, type, colorValue, thickValue, durationValue]);
    const spinnerWidth: string = formatUnit(size);
    const spinnerSizeStyle: React.CSSProperties = useMemo(() => ({
        width: spinnerWidth,
        height: spinnerWidth
    }), [spinnerWidth]);
    const rootClassName: string = useMemo(() => (
        `sf-spinner${overlay ? ' sf-spinner-overlay' : ''} sf-control${className ? ' ' + className : ''} sf-spinner-${String(color).toLowerCase()}`
    ), [overlay, className, color]);
    const contentSpanClassName: string = useMemo(() => (
        type === SpinnerType.DoubleCircle && !children ? 'sf-spinner-doublecircle' : ''
    ), [type, children]);
    if (!visible) {
        return null;
    }
    return (
        <div
            ref={elRef}
            className={rootClassName}
            aria-live='polite'
            role='status'
            {...rest}
        >
            <div className={'sf-content-center sf-spinner-content '} >
                <span className={contentSpanClassName}  style={spinnerSizeStyle}>
                    {spinnerNode}
                </span>
                {label ? <div className="sf-spinner-label">{label}</div> : null}
            </div>
        </div>
    );
});

Spinner.displayName = 'Spinner';

export default Spinner;
