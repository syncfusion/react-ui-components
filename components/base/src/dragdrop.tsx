import { createContext, useContext, useState, ReactNode, RefObject, useRef } from 'react';
import { IDroppable } from './droppable';

/**
 * Interface defining the methods available in the DragDropContext.
 *
 * @private
 */
export interface DragDropContextProps {
    /**
     * Registers a droppable instance with a unique identifier.
     *
     * @param {string} id - The unique identifier for the droppable instance
     * @param {DragDropContext} instance - The droppable instance to register
     * @returns {void}
     */
    registerDroppable: (id: string, instance: DroppableContext) => void;

    /**
     * Unregisters a droppable instance by its identifier.
     *
     * @param {string} id - The unique identifier of the droppable instance to unregister
     * @returns {void}
     */
    unregisterDroppable: (id: string) => void;

    /**
     * Retrieves all registered droppable instances.
     *
     * @returns {Record<string, DragDropContext>} A record of all droppable instances indexed by their identifiers
     */
    getAllDroppables: () => Record<string, DroppableContext>;
}

/**
 * Interface defining the Droppable instance reference with element.
 *
 * @private
 */
export interface DroppableContext extends IDroppable {
    element?: RefObject<HTMLElement>;
}

const DragDropContext: React.Context<DragDropContextProps | undefined> = createContext<DragDropContextProps | undefined>(undefined);

/**
 * Custom hook that provides access to the droppable context functionality.
 *
 * @private
 * @returns {DragDropContextProps} The droppable context methods and state
 */
export const useDragDropContext: () => DragDropContextProps | undefined = (): DragDropContextProps | undefined => {
    const context: DragDropContextProps | undefined = useContext(DragDropContext);
    if (!context) {
        return undefined;
    }
    return context;
};

/**
 * Props for the DragDrop component.
 */
interface DragDropProps {
    /**
     * The child components that will have access to the droppable context.
     */
    children: ReactNode;
}

/**
 * Provider component that manages droppable instances throughout the application, provides registration and retrieval methods for droppable elements.
 *
 * @param {DragDropProps} props - The component props
 * @param {ReactNode} props.children - The child elements to render within the provider
 * @returns {Element} The rendered DragDrop provider component
 */
export const DragDrop: React.FC<DragDropProps> = ({ children }: { children: ReactNode }) => {
    const [droppables, setDroppables] = useState<Record<string, DroppableContext>>({});
    const currentDroppables: RefObject<Record<string, DroppableContext>> = useRef<Record<string, DroppableContext>>({});

    /**
     * Registers a droppable instance with a unique identifier.
     *
     * @param {string} id - The unique identifier for the droppable instance
     * @param {DragDropContext} instance - The droppable instance to register
     * @returns {void}
     */
    const registerDroppable: (id: string, instance: DroppableContext) => void = (id: string, instance: DroppableContext): void => {
        setDroppables((prev: Record<string, DroppableContext>) => {
            const updated: {[x: string]: DroppableContext} = {
                ...prev,
                [id]: instance
            };
            currentDroppables.current = updated;
            return updated;
        });
    };

    /**
     * Unregisters a droppable instance by its identifier.
     *
     * @param {string} id - The unique identifier of the droppable instance to unregister
     * @returns {void}
     */
    const unregisterDroppable: (id: string) => void = (id: string): void => {
        setDroppables((prev: Record<string, DroppableContext>) => {
            const newDroppables: Record<string, DroppableContext> = { ...prev };
            delete newDroppables[`${id}`];
            return newDroppables;
        });
    };

    /**
     * Retrieves all registered droppable instances.
     *
     * @returns {Record<string, DragDropContext>} A record of all droppable instances indexed by their identifiers
     */
    const getAllDroppables: () => Record<string, DroppableContext> = (): Record<string, DroppableContext> => {
        return currentDroppables.current || droppables;
    };

    return (
        <DragDropContext.Provider value={{
            registerDroppable,
            unregisterDroppable,
            getAllDroppables
        }}>
            {children}
        </DragDropContext.Provider>
    );
};
