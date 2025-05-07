import { HTMLAttributes } from 'react';
import { ChipModel } from '../chip/chip';
import * as React from 'react';
/**
 * Selection types for ChipList
 */
export type SelectionType = 'single' | 'multiple' | 'none';
/**
 * Defines the possible chip data types
 */
export type ChipData = string | number | ChipItemProps;
/**
 * @ignore
 */
export interface ChipListProps {
    /**
     * This chips property helps to render ChipList component.
     * ```html
     * <ChipList chips={['Chip1', 'Chip2']} />
     * ```
     *
     * @default []
     */
    chips?: ChipData[];
    /**
     * Specifies a value that indicates whether the ChipList component is disabled or not.
     * ```html
     * <ChipList isDisabled={true} />
     * ```
     *
     * @default false
     */
    disabled?: boolean;
    /**
     * Specifies the selected chip items in the ChipList.
     * ```html
     * <ChipList selectedChips={[0, 1]} />
     * ```
     *
     * @default []
     */
    selectedChips?: number[];
    /**
     * Defines the selection type of the ChipList. The available types are:
     * 1. single
     * 2. multiple
     * 3. none
     *
     * @default 'none'
     */
    selection?: SelectionType;
    /**
     * Enables or disables the delete functionality of a ChipList.
     * ```html
     * <ChipList removable={true} />
     * ```
     *
     * @default false
     */
    removable?: boolean;
    /**
     * Triggers when the chip item is removed.
     *
     * @event onDelete
     */
    onDelete?: (args: ChipDeleteEvent) => void;
    /**
     * Triggers when the selected chips in the ChipList change.
     * ```html
     * <ChipList chips={['Chip1', 'Chip2', 'Chip3']} selectedChips={[0, 1]} onSelect={(args) => console.log(args)} />
     * ```
     *
     * @event onSelect
     */
    onSelect?: (args: ChipSelectEvent) => void;
}
/**
 * Represents the properties of a Chip component.
 */
export interface ChipItemProps extends ChipModel {
    /**
     * Specifies the custom classes to be added to the chip element.
     *
     * @default -
     */
    className?: string;
    /**
     * Specifies the additional HTML attributes in a key-value pair format.
     *
     * @default -
     */
    htmlAttributes?: React.HTMLAttributes<HTMLDivElement>;
    /**
     * Specifies the children to be rendered for the chip item.
     * This can be a React node, a function that returns a React node, or a string.
     *
     * @default -
     */
    children?: React.ReactNode;
}
/**
 * Represents the arguments for the chip selection event.
 */
export interface ChipSelectEvent {
    /**
     * Specifies the indexes of the chips that are currently selected.
     */
    selectedChipIndexes: number[];
    /**
     * Specifies the event that triggered the select action.
     */
    event: React.MouseEvent | React.KeyboardEvent;
}
/**
 * Represents the arguments for the chip deletion event.
 */
export interface ChipDeleteEvent {
    /**
     * Specifies the remaining chips after deletion.
     */
    chips: ChipData[];
    /**
     * Specifies the event that triggered the delete action.
     */
    event: React.MouseEvent | React.KeyboardEvent;
}
/**
 * Represents the main properties and methods of the ChipList component.
 */
export interface IChipList extends ChipListProps {
    /**
     * Specifies the ChipList component element.
     *
     * @private
     */
    element: HTMLDivElement | null;
    /**
     * Gets the selected chips from the ChipList.
     *
     * @public
     * @returns {ChipData[]}
     */
    getSelectedChips(): ChipData[];
}
type ChipListComponentProps = ChipListProps & Omit<HTMLAttributes<HTMLDivElement>, 'onSelect'>;
/**
 * The ChipList component displays a collection of chips that can be used to represent multiple items in a compact form.
 * It supports various selection modes, chip deletion, and customization options.
 *
 * ```typescript
 * <ChipList chips={['Apple', 'Banana', 'Cherry']} selection='multiple' removable={true} />
 * ```
 */
export declare const ChipList: React.ForwardRefExoticComponent<ChipListComponentProps & React.RefAttributes<IChipList>>;
declare const _default: React.NamedExoticComponent<ChipListProps & Omit<HTMLAttributes<HTMLDivElement>, "onSelect"> & React.RefAttributes<IChipList>>;
export default _default;
