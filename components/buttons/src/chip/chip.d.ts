import { HTMLAttributes } from 'react';
import * as React from 'react';
/**
 * Represents the variant types for the Chip component.
 */
export type ChipVariant = 'filled' | 'outlined';
/**
 * Represents the color types for the Chip component.
 */
export type ChipColor = 'primary' | 'info' | 'danger' | 'success' | 'warning';
/**
 * Represents the model for the Chip component.
 *
 */
export interface ChipModel {
    /**
     * Specifies the text content for the Chip.
     *
     * @default -
     */
    text?: string;
    /**
     * Defines the value of the Chip.
     *
     * @default -
     */
    value?: string | number;
    /**
     * Specifies the icon CSS class or React node for the avatar in the Chip.
     *
     * @default -
     */
    avatar?: string | React.ReactNode;
    /**
     * Specifies the leading icon CSS class or React node for the Chip.
     *
     * @default -
     */
    leadingIcon?: string | React.ReactNode;
    /**
     * Specifies the trailing icon CSS or React node for the Chip.
     *
     * @default -
     */
    trailingIcon?: string | React.ReactNode;
    /**
     * Specifies whether the Chip component is disabled or not.
     *
     * @default false
     */
    disabled?: boolean;
    /**
     * Specifies the leading icon url for the Chip.
     *
     * @default -
     */
    leadingIconUrl?: string;
    /**
     * Specifies the trailing icon url for the Chip.
     *
     * @default -
     */
    trailingIconUrl?: string;
    /**
     * Specifies whether the Chip is removable.
     *
     * @default false
     */
    removable?: boolean;
    /**
     * Specifies the variant of the Chip, either 'filled' or 'outlined'.
     *
     * @default -
     */
    variant?: ChipVariant;
    /**
     * Specifies the color of the Chip, one of 'primary', 'info', 'danger', 'success', or 'warning'.
     *
     * @default -
     */
    color?: ChipColor;
}
/**
 * Represents the props for the Chip component.
 *
 * @ignore
 */
export interface ChipProps extends ChipModel {
    /**
     * Event handler for the delete action.
     * @event onDelete
     */
    onDelete?: (event: DeleteEvent) => void;
}
/**
 * Represents the arguments for the delete event of a Chip.
 */
export interface DeleteEvent {
    /**
     * Specifies the data associated with the deleted Chip.
     */
    data: ChipModel;
    /**
     * Specifies the event that triggered the delete action.
     */
    event: React.MouseEvent | React.KeyboardEvent;
}
/**
 * Represents the interface for the Chip component.
 */
export interface IChip extends ChipProps {
    /**
     * Specifies the Chip component element.
     *
     * @private
     */
    element?: HTMLDivElement | null;
}
type ChipComponentProps = ChipProps & HTMLAttributes<HTMLDivElement>;
/**
 * The Chip component represents information in a compact form, such as entity attribute, text, or action.
 *
 * ```typescript
 * <Chip color="primary" removable={true}>Anne</Chip>
 * ```
 */
export declare const Chip: React.ForwardRefExoticComponent<ChipComponentProps & React.RefAttributes<IChip>>;
export default Chip;
