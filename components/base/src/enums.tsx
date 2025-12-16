/**
 * Defines a color categories for the components. Each color category is used to visually differentiate components based on context.
 */
export enum Color {
    /**
     * Indicates the color for success, often used to convey the completion of an action.
     */
    Success = 'Success',
    /**
     * Indicates the color for informational content, assisting in the communication of status or updates.
     */
    Info = 'Info',
    /**
     * Indicates the color for warnings or cautions, drawing attention to potential issues.
     */
    Warning = 'Warning',
    /**
     * Indicates the color for error or danger, signaling urgent problem requiring attention.
     */
    Error = 'Error',
    /**
     * Indicates the primary color for highlighting the main role or action.
     */
    Primary = 'Primary',
    /**
     * Indicates secondary colors for support actions with a subtle tone.
     */
    Secondary = 'Secondary'
}

/**
 * Specifies positioning options for the components. Determines how the element should be displayed relative to a reference context.
 */
export enum Position {
    /**
     * Represents the positioning left of the reference context.
     */
    Left = 'Left',
    /**
     * Represents the positioning right of the reference context.
     */
    Right = 'Right',
    /**
     * Represents the positioning above the reference context.
     */
    Top = 'Top',
    /**
     * Represents the positioning below the reference context.
     */
    Bottom = 'Bottom'
}

/**
 * Defines visual variants for UI components. Each variant modifies the appearance to convey distinct user preferences.
 */
export enum Variant {
    /**
     * Indicates a solid background to emphasize content with contrasting text.
     */
    Filled = 'Filled',
    /**
     * Indicates a boundary outline to highlight content with colored text, excluding a background.
     */
    Outlined = 'Outlined',
    /**
     * Indicates a minimalist style with colored text and a subtle or absent background.
     */
    Standard = 'Standard'
}

/**
 * Defines size levels for UI components.
 */
export enum Size {
    /**
     * Represents a larger size for the component, used for greater emphasis.
     */
    Large = 'Large',
    /**
     * Represents a medium size for the component, offering a balanced appearance.
     */
    Medium = 'Medium',
    /**
     * Represents a smaller size for the component, suitable for less prominent display.
     */
    Small = 'Small'
}

/**
 * Enumeration for specifying sorting orders in the ListView. Available options are as follows None, Ascending, and Descending.
 *
 */
export enum SortOrder {
    /**
     * No specific sorting order is applied to the ListView items. The items are displayed in their original order.
     */
    None = 'None',
    /**
     * Ascending order sorting is applied to the ListView items.
     */
    Ascending = 'Ascending',
    /**
     * Descending order sorting is applied to the ListView items.
     */
    Descending = 'Descending'
}


/**
 * Defines layout orientation for components. Each orientation specifies the directional arrangement for layout and component behavior.
 */
export enum Orientation {
    /**
     * Arranges elements horizontally from left to right.
     */
    Horizontal = 'Horizontal',
    /**
     * Arranges elements vertically from top to bottom.
     */
    Vertical = 'Vertical'
}

/**
 * Defines severity levels for components. Each severity level conveys appropriate importance and urgency to users.
 */
export enum Severity {
    /**
     * Indicates an information that is a critical issue requiring immediate user attention.
     */
    Error = 'Error',
    /**
     * Indicates an information that is general or non-urgent in nature.
     */
    Info = 'Info',
    /**
     * Indicates an information that reflects a neutral state with no specific urgency.
     */
    Normal = 'Normal',
    /**
     * Indicates an information that confirms a successful operation.
     */
    Success = 'Success',
    /**
     * Indicates an information that highlights a potential issue or caution.
     */
    Warning = 'Warning'
}

/**
 * Specifies the available directions for resize handles when a component is resizable.
 * Each value represents a different edge or corner of the component that can be dragged to resize it.
 */
export type ResizeDirections = 'South' | 'North' | 'East' | 'West' | 'NorthEast' | 'NorthWest' | 'SouthEast' | 'SouthWest' | 'All';

/**
 * Specifies the horizontal alignment options for component positioning.
 */
export type HorizontalAlignment = 'Left' | 'Center' | 'Right';

/**
 * Specifies the vertical alignment options for component positioning.
 */
export type VerticalAlignment = 'Top' | 'Center' | 'Bottom';

/**
 * Defines the label position of the component.
 * ```props
 * After :- When the label is positioned After, it appears to the right of the component.
 * Before :- When the label is positioned Before, it appears to the left of the component.
 * ```
 */
export type LabelPlacement = 'After' | 'Before' | 'Bottom';

/**
 * Specifies the behavior modes for a floating or persistent label in a form field.
 *
 * - `'Never'`: The label never floats; it remains in its original place regardless of input focus or content.
 * - `'Always'`: The label is always displayed in a floating position, even when the input is empty or unfocused.
 * - `'Auto'`: The label floats above the input only when the field is focused or contains a value, and returns to its default position otherwise.
 *
 */
export type LabelMode= 'Never' | 'Always' | 'Auto';
