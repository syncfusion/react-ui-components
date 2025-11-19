import { Context, createContext, JSX, ReactElement, ReactNode, useContext } from 'react';
import { MutableGridBase } from '../types';
import { GridRef, IGrid } from '../types/grid.interfaces';
import { MutableGridSetter } from '../types/interfaces';
/**
 * Context for computed grid properties
 */
const GridComputedContext: Context<Partial<IGrid> & Partial<MutableGridSetter>> =
    createContext<Partial<IGrid> & Partial<MutableGridSetter>>(null);
/**
 * Provider component for computed grid properties
 *
 * @param {Object} props - The provider props
 * @param {Object} props.grid - Grid model and state setter
 * @param {Object} props.children - Child components
 * @returns {Object} Provider component with children
 */
export const GridComputedProvider: <T>(props: {
    grid: Partial<GridRef<T>> & Partial<MutableGridSetter<T>>;
    children: ReactElement | ReactNode;
}) => ReactElement = <T, >({ grid, children }: {
    grid: Partial<GridRef<T>> & Partial<MutableGridSetter<T>>; children: ReactElement | ReactNode;
}): JSX.Element => {
    return (
        <GridComputedContext.Provider value={grid}>
            {children}
        </GridComputedContext.Provider>
    );
};

/**
 * Hook to access computed grid properties from context
 *
 * @returns {Object} Grid computed context
 */
export const useGridComputedProvider: <T, >() => Partial<GridRef<T>> & Partial<MutableGridSetter<T>> =
    <T, >(): Partial<GridRef<T>> & Partial<MutableGridSetter<T>> => {
        return useContext<Partial<GridRef<T>> & Partial<MutableGridSetter<T>>>(GridComputedContext);
    };

/**
 * Context for mutable grid properties
 */
const GridMutableContext: Context<Partial<MutableGridBase>> = createContext<MutableGridBase>(null);

/**
 * Provider component for mutable grid properties
 *
 * @param {Object} props - The provider props
 * @param {Partial<MutableGridBase>} props.grid - Mutable grid properties
 * @param {ReactElement | ReactNode} props.children - Child components
 * @returns {JSX.Element} Provider component with children
 */
export const GridMutableProvider: <T>(props: {
    grid: Partial<MutableGridBase<T>>;
    children: ReactElement | ReactNode;
}) => JSX.Element = <T, >({ grid, children }: { grid: Partial<MutableGridBase<T>>; children: ReactElement | ReactNode; }): JSX.Element => {
    return (
        <GridMutableContext.Provider value={grid}>
            {children}
        </GridMutableContext.Provider>
    );
};

/**
 * Hook to access mutable grid properties from context
 *
 * @returns {MutableGridBase} Grid mutable context
 */
export const useGridMutableProvider: <T, >() => MutableGridBase<T> = <T, >(): MutableGridBase<T> => {
    return useContext<MutableGridBase<T>>(GridMutableContext);
};
