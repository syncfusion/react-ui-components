/**
 * An enum type that denotes the position of checkbox in the ListView. Available options are as follows Left and Right;
 */
export enum CheckBoxPosition {
    /**
     * The checkbox is positioned on the left side of the ListView item.
     */
    Left = 'Left',
    /**
     * The checkbox is positioned on the right side of the ListView item.
     */
    Right = 'Right'
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
 * An interface representing a data source object that maps string keys to various data types.
 * The value associated with each key can be an object, string, number, or boolean.
 */
export interface DataSource {
    [key: string]: object | string | number | boolean;
}

/**
 * Interface representing field mappings in ListView items.
 */
export interface FieldsMapping {
    /**
     * The `id` field is used to map the unique identifier from the data source. This field is used to uniquely identify each ListView item.
     */
    id?: string;
    /**
     * The `text` field is used to map the text value from the data source for each list item.
     */
    text?: string;
    /**
     * The `value` field is used to map the unique value from the data source for each list item.
     */
    value?: string;
    /**
     * The `selected` field is used to select or unselect the list item.
     */
    selected?: string;
    /**
     * The `checked` field is used to check or uncheck the list item.
     */
    checked?: string;
    /**
     * The `visible` field is used to  hide or show the list item.
     */
    visible?: string;
    /**
     * The `url` field is used to map the URL value from the data source for each list item.
     * We can navigate to the URL by clicking on the list item.
     */
    url?: string;
    /**
     * The `disabled` field is used to enable or disable the list item.
     */
    disabled?: string;
    /**
     * The `groupBy` field is used to map the list items to the corresponding group based on group value in data source.
     */
    groupBy?: string;
    /**
     * The `icon` field is used to map the icon class value from the data source for each list item.
     *  We can add a specific image to the icons using `icon` field.
     */
    icon?: string;
    /**
     * The `child` field is used to map the list items to their corresponding parent items and facilitates nested navigation functionality.
     */
    child?: string;
    /**
     * The `tooltip` field is used to display the content about the target element when hovering on list item.
     */
    tooltip?: string;
    /**
     * The `hasChildren` field is used to check whether the list items have child items or not.
     */
    hasChildren?: string;
    /**
     * The `htmlAttributes` field allows additional attributes such as id, class, etc., and
     *  accepts n number of attributes in a key-value pair format.
     */
    htmlAttributes?: string;
    /**
     * The `imageUrl` field is used to map the image URL value from the data source for each list item.
     */
    imageUrl?: string;
    /**
     * The `sortBy` field used to enable the sorting of list items to be ascending or descending order.
     */
    sortBy?: string
}

/**
 * Interface that holds settings for virtualization in the ListView component.
 * Virtualization helps improve performance by only rendering items that are currently visible on the screen.
 */
export interface VirtualizationProps {
    /**
     * Specifies the height of each list item in pixels. This is necessary to calculate the scrolling height and manage the visible window.
     *
     * @default 40
     */
    itemSize?: number;

    /**
     * The total count of items in the data source. This is used to calculate the total scrollable content size.
     *
     * @default 15
     */
    itemsCount?: number;

    /**
     * The number of items to pre-render beyond the visible area. This helps prevent flickering by loading additional items in advance.
     *
     * @default 5
     */
    overscanCount?: number;
}
