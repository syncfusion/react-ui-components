import { preRender } from '@syncfusion/react-base';
import * as React from 'react';
import { useState, useEffect, useRef, useImperativeHandle, forwardRef, useMemo } from 'react';
import * as ReactDOM from 'react-dom';

const DEFT_WIDTHS: Record<SpinnerType, number> = {
    Material3: 30,
    Fluent2: 30,
    Bootstrap5: 36,
    Tailwind3: 30
};

const CLS_MAPPINGS: Record<SpinnerType, string> = {
    Material3: 'sf-spin-material3',
    Fluent2: 'sf-spin-fluent2',
    Bootstrap5: 'sf-spin-bootstrap5',
    Tailwind3: 'sf-spin-tailwind3'
};

const CLS_SPINWRAP: string = 'sf-spinner-pane';
const CLS_SPININWRAP: string = 'sf-spinner-inner';
const CLS_SPINCIRCLE: string = 'sf-path-circle';
const CLS_SPINARC: string = 'sf-path-arc';
const CLS_SPINLABEL: string = 'sf-spin-label';
const CLS_SPINTEMPLATE: string = 'sf-spin-template';

/**
 * Defines the available design systems for spinner appearance.
 * Each option represents a different visual style based on popular UI frameworks.
 */
export enum SpinnerType {
    /**
     * Material Design 3 spinner style with circular animation following
     * Google's Material Design guidelines.
     */
    Material3 = 'Material3',

    /**
     * Bootstrap 5 spinner style following the Bootstrap framework's
     * visual design patterns.
     */
    Bootstrap5 = 'Bootstrap5',

    /**
     * Fluent Design 2 spinner style following Microsoft's Fluent design
     * system guidelines.
     */
    Fluent2 = 'Fluent2',

    /**
     * Tailwind CSS 3 spinner style following the Tailwind design
     * aesthetic and principles.
     */
    Tailwind3 = 'Tailwind3'
}

/**
 * Interface for the Spinner component props
 *
 * @public
 */
export interface SpinnerProps {
    /**
     * Defines the type/style of the Spinner
     *
     * @default SpinnerType.Material3
     */
    type?: SpinnerType;

    /**
     * Text to be displayed below the Spinner
     *
     * @default -
     */
    label?: string;

    /**
     * Width of the Spinner in pixels or as string with units
     *
     * @default Based on the type selected (DEFT_WIDTHS mapping)
     */
    width?: string | number;

    /**
     * Controls the visibility state of the component.
     *
     * When true, the component will be rendered and displayed.
     * When false, the component will be hidden but may remain in the DOM based on implementation.
     * If not specified, the component will follow its default visibility behavior.
     *
     * @default false
     */
    visible?: boolean;

    /**
     * Custom HTML template for the Spinner
     *
     * @default -
     */
    template?: string;

    /**
     * Target element where the Spinner should be rendered
     *
     * @default -
     */
    target?: HTMLElement | string;
}

/**
 * Interface for Spinner component with additional method.
 */
export interface ISpinner extends SpinnerProps {
    /**
     * This is spinner component element.
     *
     * @private
     * @default null
     */
    element?: HTMLElement | null;
}

type ISpinnerProps = SpinnerProps & Omit<React.InputHTMLAttributes<HTMLDivElement>, keyof SpinnerProps>;


const globalTemplate: string | null = null;
const globalCssClass: string | null = null;
const globalType: SpinnerType | null = null;
const spinnerInstances: React.RefObject<ISpinner>[] = [];

/**
 * A versatile Spinner component that provides visual feedback for loading states.
 *
 * The Spinner supports multiple design systems through the SpinnerType enum
 * and can be customized with various properties for size, color, and behavior.
 *
 * ```typescript
 * <Spinner
 *   type={SpinnerType.Material3}
 *   visible={true}
 * />
 * ```
 */
export const Spinner: React.ForwardRefExoticComponent<
ISpinnerProps & React.RefAttributes<ISpinner>
> = forwardRef<ISpinner, ISpinnerProps & React.HTMLAttributes<HTMLDivElement>>(
    (props: ISpinnerProps, ref: React.Ref<ISpinner>) => {
        const animationFrameRef: React.RefObject<number | null> = useRef<number | null>(null);
        const {
            className = '',
            label,
            width,
            visible = false,
            template,
            target,
            type: propType,
            ...restProps
        } = props;

        const [show, setIsVisible] = useState(visible);
        const type: SpinnerType | null = propType || globalType || null;
        const spinnerRef: React.RefObject<HTMLDivElement | null> = useRef<HTMLDivElement>(null);
        const targetRef: React.RefObject<HTMLElement | null> = useRef<HTMLElement | null>(null);
        useImperativeHandle(ref, () => ({
            element: spinnerRef.current
        }));
        useEffect(() => {
            spinnerInstances.push(ref as React.RefObject<ISpinner>);
            return () => {
                const index: number = spinnerInstances.indexOf(ref as React.RefObject<ISpinner>);
                if (index > -1) {
                    spinnerInstances.splice(index, 1);
                }
            };
        }, [ref]);

        useEffect(() => {
            preRender('spinner');
        }, []);

        useEffect(() => {
            setIsVisible(visible);
        }, [visible]);

        useEffect(() => {
            if (target) {
                targetRef.current = typeof target === 'string' ? document.querySelector(target) : target;
            }
        }, [target]);

        const calculateRadius: number = useMemo(() => {
            const baseWidth: number = DEFT_WIDTHS[type || 'Material3'];
            const parsedWidth: number = width !== undefined ? parseFloat(width.toString()) : baseWidth;
            return parsedWidth / (2);
        }, [width, type]);

        const getSpinnerClassNames: () => string = () => {
            return [
                CLS_SPINWRAP,
                className || globalCssClass,
                show ? 'sf-spin-show' : 'sf-spin-hide',
                template || globalTemplate ? CLS_SPINTEMPLATE : ''
            ].filter(Boolean).join(' ');
        };
        const useAnimatedRotation: (deps?: never[]) => number = (deps: never[] | undefined = []): number => {
            const [rotation, setRotation] = useState(0);
            useEffect(() => {
                if (!show) { return; }
                const interval: NodeJS.Timeout = setInterval(() => {
                    setRotation((prev: number) => (prev + 45) % 360);
                }, 100);

                return () => clearInterval(interval);
            }, [show, ...deps]);

            return rotation;
        };
        const randomGenerator: () => string = () => {
            const combine: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            return Array.from({ length: 5 }, () => combine.charAt(Math.floor(Math.random() * combine.length))).join('');
        };

        const getStrokeSize: (diameter: number) => number = (diameter: number) => {
            return (10 / 100) * diameter;
        };
        const drawArc: (diameter: number, strokeSize: number) => string = (diameter: number, strokeSize: number) => {
            const radius: number = diameter / 2;
            const offset: number = strokeSize / 2;
            return `M${radius},${offset}A${radius - offset},${radius - offset} 0 1 1 ${offset},${radius}`;
        };
        const defineCircle: (x: number, y: number, radius: number) => string = (x: number, y: number, radius: number) => {
            return `M ${x} ${y} m ${-radius} 0 a ${radius} ${radius} 0 1 0 ${radius * 2} 0 a ${radius} ${radius} 0 1 0 ${-radius * 2} 0`;
        };

        const defineArc: (x: number, y: number, radius: number, startArc: number, endArc: number) => string =
            (x: number, y: number, radius: number, startArc: number, endArc: number) => {
                const start: { x: number; y: number; } = defineArcPoints(x, y, radius, endArc);
                const end: { x: number; y: number; } = defineArcPoints(x, y, radius, startArc);
                return `M ${start.x} ${start.y} A ${radius} ${radius} 0 0 0 ${end.x} ${end.y}`;
            };

        const defineArcPoints: (centerX: number, centerY: number, radius: number, angle: number) => { x: number; y: number } =
            (centerX: number, centerY: number, radius: number, angle: number) => {
                const radians: number = (angle - 90) * Math.PI / 180.0;
                return {
                    x: centerX + (radius * Math.cos(radians)),
                    y: centerY + (radius * Math.sin(radians))
                };
            };

        const renderBootstrapLikeSpinner: (spinnerType: 'Bootstrap5') => React.ReactNode =
            (spinnerType: 'Bootstrap5') => {
                const uniqueID: string = useRef(randomGenerator()).current;
                const rotation: number = useAnimatedRotation();
                const className: string = spinnerType;
                return show ? (
                    <svg
                        id={uniqueID}
                        className={CLS_MAPPINGS[className as SpinnerType]}
                        viewBox={`0 0 ${calculateRadius * 2} ${calculateRadius * 2}`}
                        style={{
                            width: `${calculateRadius * 2}px`,
                            height: `${calculateRadius * 2}px`,
                            transform: `rotate(${rotation}deg)`,
                            transition: 'transform 0.1s linear'
                        }}
                    >
                        <path
                            className={CLS_SPINCIRCLE}
                            d={drawArc(calculateRadius * 2, getStrokeSize(calculateRadius * 2))}
                            strokeWidth={getStrokeSize(calculateRadius * 2)}
                            fill="none"
                        />
                    </svg>
                ) : null;
            };
        const getDashOffset: (
            diameter: number,
            strokeSize: number,
            value: number,
            max: number
        ) => number = (diameter: number, strokeSize: number, value: number, max: number) => {
            return (diameter - strokeSize) * Math.PI * ((3 * (max) / 100) - (value / 100));
        };
        const easeAnimation: (current: number, start: number, change: number, duration: number) => number =
            (current: number, start: number, change: number, duration: number) => {
                const timestamp: number = (current /= duration) * current;
                const timecount: number = timestamp * current;
                return start + change * (6 * timecount * timestamp + -15 * timestamp * timestamp + 10 * timecount);
            };
        const renderMaterialLikeSpinner: (spinnerType: SpinnerType, radius: number) => React.ReactNode =
            (spinnerType: SpinnerType, radius: number) => {
                const uniqueID: string = useRef(randomGenerator()).current;
                const diameter: number = radius * 2;
                const strokeSize: number = getStrokeSize(diameter);
                const [offset, setOffset] = useState(getDashOffset(diameter, strokeSize, 1, 75));
                const [rotation, setRotation] = useState(0);
                const startTimeRef: React.RefObject<number | null> = useRef<number | null>(null);
                const rotationCountRef: React.RefObject<number> = useRef(0);
                useEffect(() => {
                    if (!show) { return; }
                    const animate: (timestamp: number) => void = (timestamp: number) => {
                        if (!startTimeRef.current) { startTimeRef.current = timestamp; }
                        const elapsed: number = timestamp - startTimeRef.current;
                        const duration: number = 1333;
                        const progress: number = (elapsed % duration) / duration;
                        const easedProgress: number = easeAnimation(progress, 0, 1, 1);
                        const start: number = 1;
                        const end: number = 149;
                        const max: number = 75;
                        const currentValue: number = start + (end - start) * easedProgress;
                        setOffset(getDashOffset(diameter, strokeSize, currentValue, max));
                        if (elapsed >= duration) {
                            rotationCountRef.current += 1;
                            setRotation(rotationCountRef.current * -90);
                            startTimeRef.current = timestamp;
                        }
                        animationFrameRef.current = requestAnimationFrame(animate);
                    };
                    animationFrameRef.current = requestAnimationFrame(animate);
                    return () => {
                        if (animationFrameRef.current !== null) {
                            cancelAnimationFrame(animationFrameRef.current);
                        }
                    };
                }, [show, diameter, strokeSize]);
                let className: string;
                switch (spinnerType) {
                case 'Tailwind3':
                    className = CLS_MAPPINGS['Tailwind3'];
                    break;
                default:
                    className = CLS_MAPPINGS['Material3'];
                }
                return  show ? (
                    <svg
                        id={uniqueID}
                        className={className}
                        viewBox={`0 0 ${diameter} ${diameter}`}
                        style={{
                            width: `${diameter}px`,
                            height: `${diameter}px`,
                            transformOrigin: `${diameter / 2}px ${diameter / 2}px`
                        }}
                    >
                        <path
                            className={CLS_SPINCIRCLE}
                            d={drawArc(diameter, strokeSize)}
                            strokeWidth={strokeSize}
                            strokeDasharray={((diameter - strokeSize) * Math.PI * 0.75).toString()}
                            strokeDashoffset={offset}
                            transform={`rotate(${rotation} ${diameter / 2} ${diameter / 2})`}
                            fill="none"
                        />
                    </svg>
                ) : null;
            };

        const renderCommonSpinner: (spinnerType: SpinnerType) => React.ReactNode =
            (spinnerType: SpinnerType) => {
                const uniqueID: string = useRef(randomGenerator()).current;
                const className: string = spinnerType;
                return (
                    <svg
                        id={uniqueID}
                        className={CLS_MAPPINGS[className as SpinnerType]}
                        viewBox={`0 0 ${calculateRadius * 2} ${calculateRadius * 2}`}
                        style={{
                            width: `${calculateRadius * 2}px`,
                            height: `${calculateRadius * 2}px`,
                            transformOrigin: 'center'
                        }}
                    >
                        <path className={CLS_SPINCIRCLE} d={defineCircle(calculateRadius, calculateRadius, calculateRadius)} fill="none" />
                        <path className={CLS_SPINARC} d={defineArc(calculateRadius, calculateRadius, calculateRadius, 315, 45)} fill="none" />
                    </svg>
                );
            };
        const renderSpinnerContent: () => React.ReactNode = () => {
            const effectiveTemplate: string | null = template || globalTemplate;
            if (effectiveTemplate) {
                return <div dangerouslySetInnerHTML={{ __html: effectiveTemplate }} />;
            }
            const spinnerType: SpinnerType = type || SpinnerType.Material3;
            const radius: number = calculateRadius;
            switch (spinnerType) {
            case 'Bootstrap5':
                return renderBootstrapLikeSpinner(spinnerType);
            case 'Fluent2':
                return renderCommonSpinner(spinnerType);
            case 'Material3':
            case 'Tailwind3':
            default:
                return renderMaterialLikeSpinner(spinnerType, radius);
            }
        };

        const spinnerContent: React.JSX.Element = (
            <div ref={spinnerRef} className={getSpinnerClassNames()} {...restProps}>
                <div className={CLS_SPININWRAP} aria-disabled="true">
                    {renderSpinnerContent()}
                    {label && <div className={CLS_SPINLABEL}>{label}</div>}
                </div>
            </div>
        );

        if (targetRef.current) {
            return ReactDOM.createPortal(spinnerContent, targetRef.current);
        }

        return spinnerContent;
    });

export default Spinner;
