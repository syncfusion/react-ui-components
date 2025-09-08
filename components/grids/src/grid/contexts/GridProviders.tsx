import { Context, createContext, FC, JSX, ReactElement, ReactNode, useContext } from 'react';
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
export const GridComputedProvider: FC<{
    grid: Partial<GridRef> & Partial<MutableGridSetter>;
    children: ReactElement | ReactNode;
}> = ({ grid, children }: { grid: Partial<GridRef> & Partial<MutableGridSetter>; children: ReactElement | ReactNode; }): JSX.Element => {
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
export const useGridComputedProvider: () => Partial<GridRef> & Partial<MutableGridSetter> =
    (): Partial<GridRef> & Partial<MutableGridSetter> => {
        return useContext(GridComputedContext);
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
export const GridMutableProvider: FC<{
    grid: Partial<MutableGridBase>;
    children: ReactElement | ReactNode;
}> = ({ grid, children }: { grid: Partial<MutableGridBase>; children: ReactElement | ReactNode; }): JSX.Element => {
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
export const useGridMutableProvider: () => MutableGridBase = (): MutableGridBase => {
    return useContext(GridMutableContext);
};
