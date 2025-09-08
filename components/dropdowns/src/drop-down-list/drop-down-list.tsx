import { useState, useEffect, useRef, forwardRef, useMemo, useCallback, useImperativeHandle, JSX } from 'react';
import * as React from 'react';
import { createPortal } from 'react-dom';
import { Popup, CollisionType, IPopup, Spinner, SpinnerType } from '@syncfusion/react-popups';
import { CLASS_NAMES, LabelMode, InputBase, renderClearButton, renderFloatLabelElement,
    validationProps } from '@syncfusion/react-inputs';
import { DataManager, Query } from '@syncfusion/react-data';
import { Browser, EmitType, formatUnit, getUniqueID, getValue, IL10n, isNullOrUndefined, L10n, preRender, useProviderContext } from '@syncfusion/react-base';
import { ChevronDownFillIcon } from '@syncfusion/react-icons';
import { DropDownBase, IDropDownBase, SelectEventArgs, PopupEventArgs,
    FieldSettingsModel, FilterType, FilteringEventArgs} from '../common/drop-down-base';
import { SortOrder } from '@syncfusion/react-lists';
export { LabelMode };

export interface ChangeEventArgs{
    value: number | string | boolean | object | null;
    previousItemData: FieldSettingsModel | string | number | boolean | { [key: string]: unknown } | null;
    event: React.MouseEvent<Element> | React.KeyboardEvent<Element>;
}

export interface DropDownListProps extends validationProps {
    /**
     * Specifies whether to show a clear button in the DropDownList component. When enabled, a clear icon appears when a value is selected, allowing users to clear the selection.
     *
     * @default false
     */
    clearButton?: boolean | React.ReactNode;

    /**
     * Defines the width of the dropdown popup list. The width can be specified in pixels or percentage.
     *
     * @default '100%'
     */
    popupWidth?: string;

    /**
     * Defines the height of the dropdown popup list. The height can be specified in pixels or as 'auto' to adjust based on content.
     *
     * @default 'auto'
     */
    popupHeight?: string;

    /**
     * Sets the placeholder text that appears in the DropDownList when no item is selected.
     *
     * @default -
     */
    placeholder?: string;

    /**
     * Specifies the query to retrieve data from the data source. This is useful when working with DataManager for complex data operations.
     *
     * @default null
     */
    query?: Query;

    /**
     * Specifies the value to be selected in the DropDownList component. This can be a primitive value or an object based on the configured data binding.
     *
     * @default null
     */
    value?: number | string | boolean | object | null;

    /**
     * Provides the data source for populating the dropdown items. Accepts various data formats including array of objects, primitive arrays, or DataManager.
     *
     * @default []
     */
    dataSource?: { [key: string]: object }[] | DataManager | string[] | number[] | boolean[];

    /**
     * Configures the mapping fields for text and value properties in the data source objects. Helps in binding complex data structures to the dropdown.
     *
     * @default { text: 'text', value: 'value' }
     */
    fields?: FieldSettingsModel;

    /**
     * Sets the z-index value for the dropdown popup, controlling its stacking order relative to other elements on the page.
     *
     * @default 1000
     */
    zIndex?: number;

    /**
     * Enables binding of complex objects as values instead of primitive values. When enabled, the entire object can be accessed in events.
     *
     * @default false
     */
    allowObjectBinding?: boolean;

    /**
     * Specifies whether the dropdown popup is open or closed.
     *
     * @default false
     */
    open?: boolean;

    /**
     * Sets the default value of the DropDownList. Similar to the native select HTML element.
     *
     * @default null
     */
    defaultValue?: number | string | boolean | object | null;

    /**
     * Determines whether disabled items in the DropDownList should be skipped during keyboard navigation. When set to true,
     * keyboard navigation will bypass disabled items, moving to the next enabled item in the list.
     *
     * @default true
     */
    skipDisabledItems?: boolean;

    /**
     * Specifies the behavior of the floating label associated with the DropDownList input. Determines when and how the label appears.
     *
     * @default 'Never'
     */
    labelMode?: LabelMode;

    /**
     * Specifies whether the DropDownList should ignore case while filtering or selecting items.
     *
     * @default true
     */
    ignoreCase?: boolean;

    /**
     * Specifies whether to ignore diacritics while filtering or selecting items.
     *
     * @default false
     */
    ignoreAccent?: boolean;

    /**
     * Specifies whether filtering should be allowed in the DropDownList.
     *
     * @default false
     */
    filterable?: boolean;

    /**
     * Specifies the type of filtering to be applied.
     *
     * @default 'StartsWith'
     */
    filterType?: FilterType;

    /**
     * Specifies the placeholder text to be shown in the filter bar of the DropDownList.
     *
     * @default null
     */
    filterPlaceholder?: string;

    /**
     * Specifies the sort order for the DropDownList items.
     *
     * @default 'None'
     */
    sortOrder?: SortOrder;

    /**
     * Specifies whether the component is in loading state.
     * When true, a spinner icon replaces the default caret icon.
     *
     * @default false
     */
    loading?: boolean;

    /**
     * Provides a custom template for rendering each item in the dropdown list, allowing for customized appearance of list items.
     *
     * @default null
     */
    itemTemplate?: Function | React.ReactNode;

    /**
     * Provides a custom template for rendering the header section of the dropdown popup, enabling additional content above the item list.
     *
     * @default null
     */
    headerTemplate?: Function | React.ReactNode;

    /**
     * Provides a custom template for rendering the footer section of the dropdown popup, enabling additional content below the item list.
     *
     * @default null
     */
    footerTemplate?: Function | React.ReactNode;

    /**
     * Provides a custom template for rendering group header sections when items are categorized into groups in the dropdown list.
     *
     * @default null
     */
    groupTemplate?: Function | React.ReactNode;

    /**
     * Provides a custom template for rendering the selected value in the input element, allowing for customized appearance of the selection.
     *
     * @default null
     */
    valueTemplate?: Function | React.ReactNode;

    /**
     * Provides a custom template for the message displayed when no items match the search criteria or when the data source is empty.
     *
     * @default 'No Records Found'
     */
    noRecordsTemplate?: Function | React.ReactNode;

    /**
     * Triggers when an item in the dropdown list is selected, providing details about the selected item.
     *
     * @event select
     */
    onSelect?: EmitType<SelectEventArgs>;

    /**
     * Triggers when the selected value of the DropDownList changes, providing details about the new and previous values.
     *
     * @event change
     */
    onChange?: EmitType<ChangeEventArgs>;

    /**
     * Triggers when the dropdown popup opens, allowing for custom actions to be performed at that moment.
     *
     * @event open
     */
    onOpen?: EmitType<PopupEventArgs>;

    /**
     * Triggers when the dropdown popup closes, allowing for custom actions to be performed at that moment.
     *
     * @event close
     */
    onClose?: EmitType<PopupEventArgs>;

    /**
     * Triggers when data fetching fails
     */
    actionFailure?: EmitType<object>;

    /**
     * Triggers on typing a character in the filter bar when the filtering is enabled.
     */
    onFilterChange?: EmitType<FilteringEventArgs>;

    /**
     * Triggers after data is fetched successfully from the remote server.
     */
    actionComplete?: EmitType<object>;
}

export interface IDropDownList extends DropDownListProps {
    /**
     * Gets all list items from the dropdown list.
     *
     * @returns Array of HTMLLIElement
     * @private
     */
    getItems(): HTMLLIElement[];

    /**
     * Specifies the DOM element of the component.
     *
     * @private
     */
    element?: HTMLElement | null;

    /**
     * To filter the data from given data source by using query
     */
    filter(dataSource: { [key: string]: Object }[] | DataManager | string[] | number[] | boolean[],
        query?: Query, fields?: FieldSettingsModel): void;
}

type IDropDownListProps = DropDownListProps & Omit<React.InputHTMLAttributes<HTMLDivElement>, keyof DropDownListProps>;

export const DropDownList: React.ForwardRefExoticComponent<IDropDownListProps & React.RefAttributes<IDropDownList>> =
  forwardRef<IDropDownList, IDropDownListProps>((props: IDropDownListProps, ref: React.Ref<IDropDownList>) => {
      const {
          dataSource = [],
          query,
          fields = { text: 'text', value: 'value', groupBy: 'groupBy', disabled: 'disabled' },
          value = null,
          placeholder = '',
          id =  getUniqueID('dropdownlist'),
          zIndex = 1000,
          disabled = false,
          readOnly = false,
          popupWidth = '100%',
          popupHeight = '300px',
          allowObjectBinding = false,
          labelMode = 'Never',
          open,
          skipDisabledItems = true,
          defaultValue = null,
          ignoreCase = true,
          ignoreAccent = false,
          filterable = false,
          filterType = 'StartsWith',
          filterPlaceholder = '',
          sortOrder = SortOrder.None,
          loading = false,
          itemTemplate,
          headerTemplate,
          footerTemplate,
          groupTemplate,
          valueTemplate,
          noRecordsTemplate,
          clearButton = false,
          valid,
          validationMessage = '',
          validityStyles = true,
          required,
          className,
          onSelect,
          onChange,
          onOpen,
          onClose,
          actionFailure,
          onFilterChange,
          actionComplete,
          ...otherProps
      } = props;

      const [isPopupOpen, setIsPopupOpen] = useState(false);
      const [dropdownValue, setDropdownValue] = useState<number | string | boolean | object | null>(value ?? defaultValue ?? null);
      const [textValue, setTextValue] = useState<string | null>('');
      const [isSpanFocused, setIsSpanFocused] = useState(false);
      const [, setSelectedLI] = useState<HTMLElement | null>(null);
      const [, setPreviousValue] = useState<number | string | boolean | object | null>(value);
      const [itemData, setItemData] = useState<FieldSettingsModel | string | number | boolean | { [key: string]: unknown } | null>(null);
      const [previousItemData, setPreviousItemData] = useState<FieldSettingsModel | string | number | boolean |
      { [key: string]: unknown } | null>(null);
      const [activeIndex, setActiveIndex] = useState<number | null>(null);
      const [changeEvent, setChangeEvent] = useState<React.MouseEvent<Element> | React.KeyboardEvent<Element> | null>(null);
      const [isSelected] = useState(false);
      const [isTyped, setIsTyped] = useState<boolean>(false);
      const [ariaExpanded, setAriaExpanded] = useState(false);
      const [isFullPagePopup, setIsFullPagePopup] = useState(false);
      const [isInputValid, setIsInputValid] = useState((valid !== undefined) ? valid : (required) ? dropdownValue != null : true);
      const isOpenControlled: boolean = open !== undefined;
      const [isLoading, setIsLoading] = useState(loading);
      const [isDataLoading, setIsDataLoading] = useState(false);
      const [shouldShowPopup, setShouldShowPopup] = useState(false);
      const [listKey, setListKey] = useState(0);

      const spanElementRef: React.RefObject<HTMLSpanElement | null> = useRef<HTMLSpanElement>(null);
      const inputElementRef: React.RefObject<HTMLInputElement | null> = useRef<HTMLInputElement>(null);
      const popupRef: React.RefObject<IPopup | null> = useRef<IPopup>(null);
      const dropdownbaseRef: React.RefObject<IDropDownBase | null> = useRef<IDropDownBase>(null);
      const spinnerTargetRef: React.RefObject<HTMLSpanElement | null> = useRef<HTMLSpanElement>(null);
      const { dir, locale } = useProviderContext();
      const spinnerId: string = `${id.replace(/[,]/g, '_')}_spinner`;

      useEffect(() => {
          const isPrimitive: (val: string | number | boolean | object | null) => boolean =
          (val: string | number | boolean | object | null) => {
              return typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean';
          };
          const setFallback: (val: string | number | boolean | object | null) => void =
          (val: string | number | boolean | object | null) => {
              setTextValue(isPrimitive(val) ? String(val) : '');
              return;
          };
          const handleArrayDataSource: (
              source: Array<string | number | boolean | { [key: string]: object }>,
              val: string | number | boolean | object | null
          ) => boolean = (source: Array<string | number | boolean | { [key: string]: object }>,
                          val: string | number | boolean | object | null) => {
              const isPrimitiveArray: boolean = source.length > 0 && isPrimitive(source[0]);
              const idx: number = source.findIndex((item: string | number | boolean | { [key: string]: object }) =>
                  isPrimitiveArray
                      ? String(item) === String(val)
                      : fields.value && String(getValue(fields.value as string, item)) === String(val)
              );
              if (idx !== -1) {
                  const item: string | number | boolean | { [key: string]: object } = source[idx as number];
                  const text: string = isPrimitiveArray
                      ? String(item)
                      : fields.text
                          ? getValue(fields.text as string, item) as string
                          : String(val);
                  setTextValue(text);
                  setActiveIndex(idx);
                  return true;
              }
              return false;
          };

          if (!isNullOrUndefined(value)) {
              setDropdownValue(value);
              if (dataSource && Array.isArray(dataSource)) {
                  if (!handleArrayDataSource(dataSource, value)) {
                      setFallback(value);
                  }
              } else if (dataSource instanceof DataManager) {
                  setFallback(value);
              }
          } else if (defaultValue && dataSource) {
              if (Array.isArray(dataSource)) {
                  if (!handleArrayDataSource(dataSource, defaultValue)) {
                      setFallback(defaultValue);
                  }
              } else if (dataSource instanceof DataManager) {
                  setFallback(defaultValue);
              }
              setDropdownValue(defaultValue);
          }
      }, [value, defaultValue, dataSource, fields]);

      useEffect(() => {
          if (isPopupOpen && filterable && dropdownbaseRef.current) {
              requestAnimationFrame(() => {
                  setIsSpanFocused(false);
              });
          }
      }, [isPopupOpen, filterable]);

      useEffect(() => {
          setIsLoading(loading);
      }, [loading]);

      useEffect(() => {
          if (isOpenControlled && open !== isPopupOpen) {
              setIsPopupOpen(open as boolean);
              if (open && onOpen) {
                  onOpen();
              } else if (!open && onClose) {
                  onClose();
              }
          }
      }, [open, isOpenControlled, isPopupOpen, onOpen, onClose]);

      useEffect(() => {
          if (changeEvent && itemData) {
              onChangeEvent(changeEvent);
              setChangeEvent(null);
          }
      }, [itemData, changeEvent]);

      useEffect(() => {
          const isValid: boolean = valid !== undefined ? valid : (required ? dropdownValue != null : true);
          setIsInputValid(isValid);
          const message: string = isValid ? '' : validationMessage || '';
          inputElementRef.current?.setCustomValidity(message);

      }, [valid, validationMessage, required, dropdownValue]);

      const publicAPI: Partial<IDropDownList> = useMemo(() => ({
          dataSource,
          query,
          fields,
          value,
          placeholder,
          id,
          zIndex,
          popupWidth,
          popupHeight,
          allowObjectBinding,
          itemTemplate,
          headerTemplate,
          valueTemplate,
          groupTemplate,
          noRecordsTemplate,
          footerTemplate,
          labelMode,
          open,
          skipDisabledItems,
          ignoreCase,
          ignoreAccent,
          filterable,
          filterType,
          filterPlaceholder,
          sortOrder,
          clearButton,
          loading,
          onChange,
          onOpen,
          onClose,
          onSelect,
          onFilterChange,
          actionComplete
      }), [dataSource, fields, value, placeholder, id, zIndex, popupWidth, popupHeight, allowObjectBinding, onChange,
          onOpen, onClose, onSelect, onFilterChange, actionComplete]);

      const filter: (
          dataSource: { [key: string]: Object }[] | DataManager | string[] | number[] | boolean[],
          query?: Query,
          fields?: FieldSettingsModel
      ) => void = useCallback((
          dataSource: { [key: string]: Object }[] | DataManager | string[] | number[] | boolean[],
          query?: Query,
          fields?: FieldSettingsModel
      ) => {
          if (dropdownbaseRef.current) {
              dropdownbaseRef.current.filter(dataSource, query, fields || props.fields);
          }
      }, [props.fields]);

      useImperativeHandle(ref, () => ({
          ...publicAPI as IDropDownList,
          element: inputElementRef.current,
          filter
      }), [publicAPI]);

      const showPopup: () => void = useCallback(() => {
          if (!isOpenControlled) {
              setIsPopupOpen(true);
              setAriaExpanded(true);
              spanElementRef.current?.focus();
          }
          if (onOpen) {
              const eventArgs: PopupEventArgs = {
                  popup: popupRef.current as IPopup,
                  animation: undefined,
                  event: undefined
              };
              onOpen(eventArgs);
          }
      }, [onOpen, dropdownValue]);

      const hidePopup: () => void = useCallback(() => {
          if (!isOpenControlled) {
              setIsPopupOpen(false);
              setAriaExpanded(false);
              setIsTyped(false);
          }
          if (onClose && popupRef.current) {
              const eventArgs: PopupEventArgs = {
                  popup: popupRef.current as IPopup,
                  animation: undefined,
                  event: undefined
              };
              onClose(eventArgs);
          }
          if (Browser.isDevice) {
              setIsFullPagePopup(false);
          }

      }, [isPopupOpen, open, onClose]);

      const handleDocumentClick: (e: MouseEvent) => void = (e: MouseEvent) => {
          const target: Node = e.target as Node;
          const isOutsideInput: boolean | null = spanElementRef.current && !spanElementRef.current.contains(target);
          const isOutsidePopup: boolean | null | undefined = popupRef.current?.element && !popupRef.current.element.contains(target);
          if (isPopupOpen && isOutsideInput && isOutsidePopup) {
              hidePopup();
              setIsSpanFocused(false);
          }
          if (isOutsideInput &&
                    !(target instanceof Element && target.classList.contains('sf-list-item')) &&
                    !(target instanceof Element && target.classList.contains('e-input-group-icon'))) {
              setIsSpanFocused(false);
          }
      };

      useEffect(() => {
          if (isPopupOpen) {
              document.addEventListener('mousedown', handleDocumentClick);
          }
          return () => {
              document.removeEventListener('mousedown', handleDocumentClick);
          };
      }, [isPopupOpen, open, hidePopup]);

      useEffect(() => {
          preRender('dropdownlist');
      }, []);

      useEffect(() => {
          const handleScroll: (e: Event) => void = (e: Event) => {
              const isOutsidePopup: boolean | null | undefined = popupRef.current?.element &&
              !popupRef.current.element.contains(e.target as Node);
              if (isPopupOpen && isOutsidePopup) {
                  hidePopup();
                  setIsSpanFocused(false);
              }
          };
          if (isPopupOpen) {
              document.addEventListener('scroll', handleScroll, true);
          }
          return () => {
              document.removeEventListener('scroll', handleScroll, true);
          };
      }, [isPopupOpen, hidePopup]);


      const handleInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void =
      useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
          setTextValue(event.target.value);
      }, []);

      const handleFocus: () => void =
      useCallback(() => {
          setIsSpanFocused(true);
          if (isPopupOpen && dropdownbaseRef.current) {
              const listItems: HTMLLIElement[] = dropdownbaseRef.current.getListItems();
              if (listItems.length > 0 && activeIndex === null) {
                  setActiveIndex(0);
              }
          }

      }, [isPopupOpen, activeIndex]);

      const handleClear: () => void = useCallback(() => {
          setTextValue('');
          setDropdownValue(null);
          setActiveIndex(null);
          setSelectedLI(null);
          setListKey((prev: number) => prev + 1);
      }, []);

      const selectEventCallback: (
          li: Element,
          e: React.MouseEvent<Element> | React.KeyboardEvent<Element> | null,
          selectedData?: string | number | boolean | { [key: string]: object },
          value?: string | number | boolean | null
      ) => void = useCallback((
          li: Element,
          e: React.MouseEvent<Element> | React.KeyboardEvent<Element> | null,
          selectedData?: string | number | boolean | { [key: string]: object },
          value?: string | number | boolean | null
      ) => {
          setPreviousItemData(itemData || null);
          setPreviousValue(itemData);
          setSelectedLI(li as HTMLLIElement);
          setTextValue((value as string | number | boolean).toString());
          setChangeEvent(e as React.MouseEvent<Element> | React.KeyboardEvent<Element>);
          if (typeof selectedData === 'string' || typeof selectedData === 'number' || typeof selectedData === 'boolean') {
              setItemData(selectedData);
              setDropdownValue(selectedData);
          } else {
              setItemData(selectedData as { [key: string]: object; });
          }
          if (dropdownbaseRef.current != null && value) {
              setActiveIndex(dropdownbaseRef.current.getIndexByValue(value));
          }
      }, [itemData]);


      const getFormattedValue: (value: string) => string | number | boolean | [] = useCallback((value: string) => {
          return dropdownbaseRef?.current?.getFormattedValue(value) as string;
      }, []);

      const updateSelectedItem: (li: Element, e: React.MouseEvent<Element> | React.KeyboardEvent<Element> | null) => void =
      useCallback((li: Element, e: React.MouseEvent<Element> | React.KeyboardEvent<Element> | null) => {
          li.setAttribute('aria-selected', 'true');
          const value: string | number | boolean | [] | null = getFormattedValue(li.getAttribute('data-value') as string);
          const formattedValue: string | number | boolean | null = value as string | number | boolean;
          const selectedData: string | number | boolean | {[key: string]: object; } | undefined =
            dropdownbaseRef.current?.getDataByValue(formattedValue);
          if (value) {
              setActiveIndex(dropdownbaseRef.current?.getIndexByValue(value as string | number | boolean) as number);
          }

          const dataType: string | undefined = Array.isArray(dataSource) && dataSource.length > 0 ?
              typeof dataSource[0] : undefined;

          let itemDataToPass: string | number | boolean | {[key: string]: object} | undefined | null;
          if (dataType === 'string' || dataType === 'number' || dataType === 'boolean') {
              itemDataToPass = formattedValue;
          } else {
              itemDataToPass = selectedData;
          }
          if (e && itemDataToPass && onSelect) {
              const eventArgs: SelectEventArgs = {
                  e: e as React.MouseEvent<Element> | React.KeyboardEvent<Element> | React.TouchEvent<Element>,
                  item: li as HTMLLIElement,
                  itemData: selectedData as FieldSettingsModel
              };
              onSelect(eventArgs);
          }
          selectEventCallback(li, e, selectedData, value as string | number | boolean | null);
          setSelectedLI(li as HTMLLIElement);
      }, [getFormattedValue, onSelect, selectEventCallback, dataSource]);


      const setSelection: (li: Element | null, e: React.MouseEvent<Element> | React.KeyboardEvent<Element> | null) => void =
      useCallback((li: Element | null, e: React.MouseEvent<Element> | React.KeyboardEvent<Element> | null) => {
          const value: string | null = li?.getAttribute('data-value') as string;
          if (value) {
              setTextValue(value);
              setDropdownValue(getFormattedValue(value));
              updateSelectedItem(li as Element, e);
          }
      }, [getFormattedValue, updateSelectedItem, setTextValue, setDropdownValue]);

      const onItemClick: (e: React.MouseEvent<HTMLLIElement>) => void = useCallback((e: React.MouseEvent<HTMLLIElement>) => {
          const target: Element = e.target as Element;
          const li: HTMLLIElement | null = target.closest('li');
          if (li) {
              const dataValue: string | null = li.getAttribute('data-value');
              if (dataValue) {
                  const isPrimitiveArray: boolean = Array.isArray(dataSource) && dataSource.length > 0 &&
                (typeof dataSource[0] === 'string' || typeof dataSource[0] === 'number' || typeof dataSource[0] === 'boolean');
                  setTextValue(dataValue);
                  if (isPrimitiveArray) {
                      setDropdownValue(dataValue);
                      updateSelectedItem(li as HTMLElement, e);
                  } else {
                      setDropdownValue(getFormattedValue(dataValue));
                      updateSelectedItem(li as HTMLElement, e);
                  }
              }
              hidePopup();
          }
      }, [hidePopup, setSelection, getFormattedValue, updateSelectedItem]);

      const getItemData: () => { [key: string]: string } = () => {
          const dataItem: { [key: string]: string } = {};
          if (!isNullOrUndefined(itemData)) {
              const fieldData: string | boolean | object = allowObjectBinding ?
                  getValue(fields.value as string, itemData) :
                  getValue(fields?.value as string, itemData);
              dataItem.value = fieldData as string;
              dataItem.text = getValue(fields?.text || fields?.value || '', itemData) as string;
          }
          return dataItem;
      };

      const onChangeEvent: (e?: React.MouseEvent<Element> | React.KeyboardEvent<Element>) => void =
useCallback((e?: React.MouseEvent<Element> | React.KeyboardEvent<Element>) => {
    if (typeof itemData === 'string' || typeof itemData === 'number' || typeof itemData === 'boolean') {
        setTextValue(itemData.toString());
        setDropdownValue(itemData);
        if (onChange) {
            const eventArgs: ChangeEventArgs = {
                event: e as React.MouseEvent<Element> | React.KeyboardEvent<Element>,
                previousItemData: previousItemData,
                value: itemData
            };
            onChange(eventArgs);
        }
        setIsInputValid(true);
        return;
    }
    const dataItem: { [key: string]: string } = getItemData();
    const newValue: string | number | boolean | null = dataItem.value;
    const displayText: string = dataItem.text !== undefined ?
        dataItem.text.toString() :
        (dataItem.value !== undefined ? dataItem.value.toString() : '');
    setTextValue(displayText);
    setDropdownValue(newValue);
    if (onChange) {
        const eventArgs: ChangeEventArgs = {
            event: e as React.MouseEvent<Element> | React.KeyboardEvent<Element>,
            previousItemData: previousItemData,
            value: newValue
        };
        onChange(eventArgs);
    }
    setIsInputValid(true);
}, [getItemData, onChange, previousItemData, itemData]);

      const isItemDisabled: (li: HTMLLIElement) => boolean = useCallback((li: HTMLLIElement) => {
          return li.getAttribute('aria-disabled') === 'true' ||
                    li.className.indexOf('e-disabled') !== -1 ||
                    li.className.indexOf('sf-disabled') !== -1;
      }, []);

      const findNextEnabledItem: (items: HTMLLIElement[], startIndex: number, direction: number) => number =
      useCallback((items: HTMLLIElement[], startIndex: number, direction: number) => {
          if (!skipDisabledItems) {
              return Math.max(0, Math.min(items.length - 1, startIndex + direction));
          }
          let index: number = startIndex;
          const maxIterations: number = items.length;
          for (let i: number = 0; i < maxIterations; i++) {
              index += direction;
              if (index < 0 || index >= items.length) {
                  break;
              }
              if (!isItemDisabled(items[index as number])) {
                  return index;
              }
          }
          return startIndex;
      }, [skipDisabledItems, isItemDisabled]);

      const findFirstEnabledItem: (items: HTMLLIElement[]) => number = useCallback((items: HTMLLIElement[]) => {
          if (!skipDisabledItems) {
              return 0;
          }
          for (let i: number = 0; i < items.length; i++) {
              if (!isItemDisabled(items[i as number])) {
                  return i;
              }
          }
          return 0;
      }, [skipDisabledItems, isItemDisabled]);

      const findLastEnabledItem: (items: HTMLLIElement[]) => number = useCallback((items: HTMLLIElement[]) => {
          if (!skipDisabledItems) {
              return items.length - 1;
          }
          for (let i: number = items.length - 1; i >= 0; i--) {
              if (!isItemDisabled(items[i as number])) {
                  return i;
              }
          }
          return items.length - 1;
      }, [skipDisabledItems, isItemDisabled]);

      const findNearestEnabledItem: (items: HTMLLIElement[], targetIndex: number) => number =
    useCallback((items: HTMLLIElement[], targetIndex: number) => {
        if (!skipDisabledItems) {
            return targetIndex;
        }
        if (!isItemDisabled(items[targetIndex as number])) {
            return targetIndex;
        }
        let forwardIndex: number = targetIndex;
        let backwardIndex: number = targetIndex;
        while (forwardIndex < items.length - 1 || backwardIndex > 0) {
            if (forwardIndex < items.length - 1) {
                forwardIndex++;
                if (!isItemDisabled(items[forwardIndex as number])) {
                    return forwardIndex;
                }
            }
            if (backwardIndex > 0) {
                backwardIndex--;
                if (!isItemDisabled(items[backwardIndex as number])) {
                    return backwardIndex;
                }
            }
        }
        return targetIndex;
    }, [skipDisabledItems, isItemDisabled]);

      const keyActionHandler: (e: React.KeyboardEvent<HTMLElement>) => void = useCallback((e: React.KeyboardEvent<HTMLElement>) => {
          if (disabled || readOnly) { return; }
          if (e.altKey) {
              if (e.key === 'ArrowDown') {
                  showPopup();
                  e.preventDefault();
                  return;
              }
              if (e.key === 'ArrowUp') {
                  hidePopup();
                  e.preventDefault();
                  return;
              }
          }
          if (e.key === 'Tab' || e.key === 'Escape') {
              hidePopup();
              if (e.key === 'Tab') {
                  setIsSpanFocused(false);
                  setTimeout(() => {
                      if (inputElementRef.current) {
                          inputElementRef.current.blur();
                      }
                  }, 0);
                  return;
              }
              e.preventDefault();
              e.stopPropagation();
              return;
          }
          const isNavigation: boolean = ['ArrowDown', 'ArrowUp', 'PageUp', 'PageDown', 'Home', 'End'].includes(e.key);
          setIsTyped((isNavigation || e.key === 'Escape') ? false : isTyped);
          if (e.key === 'Enter') {
              if (!isPopupOpen) {
                  showPopup();
                  setIsSpanFocused(true);
                  e.preventDefault();
                  return;
              } else if (isPopupOpen && activeIndex !== null && activeIndex >= 0) {
                  const listItems: HTMLLIElement[] | undefined = dropdownbaseRef.current?.getListItems();
                  if (listItems && listItems[activeIndex as number]) {
                      setSelection(listItems[activeIndex as number], e);
                      hidePopup();
                  }
                  e.preventDefault();
                  return;
              }
          }
          if (!isPopupOpen || !dropdownbaseRef.current) {
              return;
          }
          const listItems: HTMLLIElement[] | undefined = dropdownbaseRef.current?.getListItems();
          if (!listItems || listItems.length === 0) { return; }
          e.preventDefault();
          switch (e.key) {
          case 'ArrowDown':
          case 'ArrowUp': {
              const direction: number = e.key === 'ArrowDown' ? 1 : -1;
              const currentIndex: number = activeIndex !== null ? activeIndex : -1;
              if (listItems.length === 1 && e.key === 'ArrowDown') {
                  const targetItem: HTMLLIElement = listItems[0];
                  if (!isItemDisabled(targetItem)) {
                      setActiveIndex(0);
                      setSelection(targetItem, e);
                      targetItem.scrollIntoView({ behavior: 'auto', block: 'nearest' });
                  }
                  break;
              }
              const newIndex: number = findNextEnabledItem(listItems, currentIndex, direction);
              if (
                  newIndex !== currentIndex &&
                newIndex >= 0 &&
                newIndex < listItems.length
              ) {
                  const targetItem: HTMLLIElement = listItems[newIndex as number];
                  if (!skipDisabledItems || !isItemDisabled(targetItem)) {
                      setActiveIndex(newIndex);
                      setSelection(targetItem, e);
                      targetItem.scrollIntoView({ behavior: 'auto', block: 'nearest' });
                  }
              }
              break;
          }
          case 'PageUp':
          case 'PageDown': {
              const currentIndex: number = activeIndex !== null ? activeIndex : (e.key === 'PageDown' ? 0 : listItems.length - 1);
              const pageSize: number = 10;
              const direction: number = e.key === 'PageUp' ? -1 : 1;
              const rawIndex: number = Math.max(0, Math.min(
                  listItems.length - 1,
                  currentIndex + (direction * pageSize)
              ));
              const newIndex: number = findNearestEnabledItem(listItems, rawIndex);
              if (newIndex !== currentIndex && newIndex >= 0 && newIndex < listItems.length) {
                  const targetItem: HTMLLIElement = listItems[newIndex as number];
                  if (!skipDisabledItems || !isItemDisabled(targetItem)) {
                      setActiveIndex(newIndex);
                      setSelection(targetItem, e);
                      targetItem.scrollIntoView({ behavior: 'auto', block: 'nearest' });
                  }
              }
              break;
          }
          case 'Home': {
              const newIndex: number = findFirstEnabledItem(listItems);
              if (newIndex !== activeIndex && newIndex >= 0 && newIndex < listItems.length) {
                  const firstItem: HTMLLIElement = listItems[newIndex as number];
                  if (!skipDisabledItems || !isItemDisabled(firstItem)) {
                      setActiveIndex(newIndex);
                      setSelection(firstItem, e);
                      firstItem.scrollIntoView({ behavior: 'auto', block: 'nearest' });
                  }
              }
              break;
          }
          case 'End': {
              const newIndex: number = findLastEnabledItem(listItems);
              if (newIndex !== activeIndex && newIndex >= 0 && newIndex < listItems.length) {
                  const lastItem: HTMLLIElement = listItems[newIndex as number];
                  if (!skipDisabledItems || !isItemDisabled(lastItem)) {
                      setActiveIndex(newIndex);
                      setSelection(lastItem, e);
                      lastItem.scrollIntoView({ behavior: 'auto', block: 'nearest' });
                  }
              }
              break;
          }
          }
      }, [
          isPopupOpen,
          disabled,
          readOnly,
          hidePopup,
          showPopup,
          activeIndex,
          setSelection,
          setIsTyped,
          skipDisabledItems,
          isItemDisabled,
          findNextEnabledItem,
          findFirstEnabledItem,
          findLastEnabledItem,
          findNearestEnabledItem
      ]);

      const dropDownClick: (e: React.MouseEvent<HTMLSpanElement>) => void = useCallback((e: React.MouseEvent<HTMLSpanElement>) => {
          if (e.button === 2 || disabled) {return; }
          if (e.target instanceof Element && e.target.parentElement?.classList.contains('sf-clear-icon')) {
              return;
          }
          setIsSpanFocused(!isPopupOpen);
          if (isLoading && !isDataLoading) {
              setIsLoading(false);
          }
          if (!readOnly) {
              if (isPopupOpen) {
                  hidePopup();
              } else {
                  if (dataSource instanceof DataManager) {
                      setIsLoading(true);
                      setIsDataLoading(true);
                      setShouldShowPopup(true);
                  }
                  showPopup();
                  spanElementRef.current?.focus();
              }
          }
      }, [isPopupOpen, open, disabled, readOnly, hidePopup, showPopup, isLoading, isDataLoading, dataSource]);

      const focusOutAction: (e?: React.MouseEvent<Element> | React.KeyboardEvent<Element> | React.FocusEvent<Element>) => void =
      useCallback((e?: React.MouseEvent<Element> | React.KeyboardEvent<Element> | React.FocusEvent<Element>) => {
          setIsSpanFocused(false);
          if (isSelected) {
              onChangeEvent(e as React.MouseEvent<Element> | React.KeyboardEvent<Element>);
          }
      }, [isSelected, onChangeEvent]);

      const onBlurHandler: (e: React.FocusEvent<HTMLElement>) => void = useCallback((e: React.FocusEvent<HTMLElement>) => {
          if (disabled) {return; }
          const target: HTMLElement = e.relatedTarget as HTMLElement;
          if (!inputElementRef.current?.contains(target)) {
              focusOutAction(e);
          }
      }, [disabled, focusOutAction]);

      const setPopupWidth: () => string = useCallback(() => {
          let width: string = formatUnit(popupWidth);
          if (width.indexOf('%') > -1) {
              const spanWidth: number = spanElementRef.current ?
                  spanElementRef.current.offsetWidth * parseFloat(width) / 100 : 0;
              width = spanWidth.toString() + 'px';
          }
          return width;
      }, [popupWidth]);

      const setPopupHeight: () => string = useCallback(() => {
          let height: string = formatUnit(popupHeight);
          if (height.indexOf('%') > -1) {
              const inputHeight: number = inputElementRef.current ?
                  inputElementRef.current.offsetHeight * parseFloat(height) / 100 : 0;
              height = inputHeight.toString() + 'px';
          }
          return height;
      }, [popupHeight]);

      const renderValueTemplate: () => JSX.Element | null = useCallback(() => {
          if (!valueTemplate || !dropdownValue) {
              return null;
          }
          let selectedItem: string | number | boolean | {[key: string]: object; } | null | undefined;
          if (Array.isArray(dataSource)) {
              if (typeof dataSource[0] === 'string' || typeof dataSource[0] === 'number' || typeof dataSource[0] === 'boolean') {
                  selectedItem = dataSource.find((item: string | number | boolean | {[key: string]: object}) => item === dropdownValue);
              } else {
                  selectedItem = dataSource.find((item: FieldSettingsModel | string | number | boolean | { [key: string]: unknown }) => {
                      const fieldValue: string | number | boolean | FieldSettingsModel = fields.value ? getValue(fields.value, item) : item;
                      return allowObjectBinding
                          ? fieldValue === dropdownValue
                          : fieldValue === dropdownValue || fieldValue.toString() === dropdownValue.toString();
                  });
              }
          }
          if (!selectedItem) {
              return null;
          }
          return typeof valueTemplate === 'function'
              ? valueTemplate(selectedItem, 'dropdownlist')
              : valueTemplate;

      }, [valueTemplate, dropdownValue, dataSource, fields.value, allowObjectBinding]);

      const setPlaceholder: string = useMemo(() => {
          const l10n: IL10n = L10n('dropdownlist', { placeholder: placeholder }, locale);
          l10n.setLocale(locale);
          return l10n.getConstant('placeholder');
      }, [locale, placeholder]);

      const handleDataLoaded: () => void = useCallback(() => {
          setIsDataLoading(false);
          setIsLoading(false);
          if (shouldShowPopup) {
              showPopup();
              setShouldShowPopup(false);
          }
          if (dropdownbaseRef.current && dropdownValue !== null) {
              const valueData: string | number | boolean | {[key: string]: object} | undefined =
              dropdownbaseRef.current.getDataByValue(dropdownValue as string | number | boolean);
              if (valueData) {
                  let displayText: string | number | boolean;
                  if (typeof valueData === 'object' && fields.text) {
                      displayText = getValue(fields.text, valueData) as string;
                  } else if (typeof valueData === 'string' || typeof valueData === 'number' || typeof valueData === 'boolean') {
                      displayText = valueData.toString();
                  } else {
                      displayText = dropdownbaseRef.current.getTextByValue(dropdownValue as string | number | boolean);
                  }
                  setTextValue(displayText);
              }
          }
      }, [dropdownValue, fields, showPopup, shouldShowPopup]);

      const containerClassNames: string = useMemo(() => {
          return [
              'sf-input-group sf-medium',
              'sf-control-wrapper',
              'sf-ddl',
              dir === 'rtl' ? 'sf-rtl' : '',
              readOnly ? 'sf-readonly' : '',
              disabled ? 'sf-disabled' : '',
              labelMode !== 'Never' ? CLASS_NAMES.FLOATINPUT : '',
              isSpanFocused ? 'sf-input-focus' : '',
              (!isInputValid && validityStyles) ? 'sf-error' : '',
              className
          ].filter(Boolean).join(' ');
      }, [readOnly, disabled, dir, isSpanFocused, isInputValid, validityStyles, className]);

      const popupClassNames: string = useMemo(() => {
          return [
              isFullPagePopup ? 'sf-popup-full-page' : 'sf-ddl sf-popup',
              className
          ].filter(Boolean).join(' ');
      }, [isFullPagePopup, className]);

      const popupContent: JSX.Element = useMemo(() => (
          <DropDownBase
              key={listKey}
              ref={dropdownbaseRef}
              dataSource={dataSource}
              fields={fields}
              query={query}
              ignoreAccent={ignoreAccent}
              ignoreCase={ignoreCase}
              isDropdownFiltering={filterable}
              filterPlaceholder={filterPlaceholder}
              filterType={filterType}
              sortOrder={sortOrder}
              onItemClick={onItemClick}
              itemTemplate={itemTemplate}
              headerTemplate={headerTemplate}
              footerTemplate={footerTemplate}
              groupTemplate={groupTemplate}
              popupHeight={setPopupHeight()}
              noRecordsTemplate={isDataLoading ? null : noRecordsTemplate}
              value={dropdownValue}
              keyActionHandler={keyActionHandler}
              actionFailure={actionFailure}
              onFilterChange={onFilterChange}
              onDataLoaded={handleDataLoaded}
              actionComplete={actionComplete}
          />
      ), [
          dataSource,
          fields,
          query,
          filterable,
          filterType,
          ignoreAccent,
          ignoreCase,
          value,
          sortOrder,
          itemTemplate,
          headerTemplate,
          footerTemplate,
          groupTemplate,
          noRecordsTemplate,
          dropdownValue,
          filterPlaceholder,
          filterType,
          onItemClick,
          keyActionHandler,
          setPopupHeight
      ]);

      return (
          <>
              <span
                  ref={spanElementRef}
                  className={containerClassNames}
                  aria-label="dropdownlist"
                  aria-labelledby={id + '_hidden'}
                  aria-describedby={id}
                  aria-disabled={disabled}
                  aria-expanded={isPopupOpen}
                  tabIndex={-1}
                  onMouseDown={dropDownClick}
                  onKeyDown={keyActionHandler}
                  {...otherProps}
              >
                  {valueTemplate && renderValueTemplate() ? (
                      <span className="sf-input-value">
                          {renderValueTemplate()}
                      </span>
                  ) : null}

                  <InputBase
                      id={id}
                      ref={inputElementRef}
                      className={`${dir === 'rtl' ? 'sf-rtl' : ''} ${isInputValid ? 'sf-valid-input' : ''} sf-control sf-dropdownlist`}
                      value={textValue || ''}
                      role="combobox"
                      type="text"
                      aria-expanded={ariaExpanded}
                      aria-label={props['aria-label'] ? props['aria-label'] : 'dropdownlist'}
                      aria-disabled={disabled}
                      aria-readonly={readOnly}
                      readOnly={true}
                      placeholder={setPlaceholder}
                      floatLabelType={labelMode}
                      onChange={handleInputChange}
                      onKeyDown={keyActionHandler}
                      onFocus={handleFocus}
                      onBlur={onBlurHandler}
                      style={valueTemplate && renderValueTemplate() ? { display: 'none' } : undefined}
                      required={required}
                      tabIndex={disabled ? -1 : 0}
                  />

                  {labelMode !== 'Never' && renderFloatLabelElement(
                      labelMode,
                      isSpanFocused,
                      textValue || '',
                      placeholder,
                      id
                  )}

                  {clearButton && textValue && (isSpanFocused || isPopupOpen) && renderClearButton(textValue ?? '', handleClear)}

                  <span
                      ref={spinnerTargetRef}
                      id={spinnerId}
                      className={`sf-input-group-icon sf-ddl-icon ${!isLoading ? 'sf-icon-container' : ''} 
                                ${!isLoading && isPopupOpen ? 'sf-icon-rotate' : 'sf-icon-normal'}`}
                  >
                      {!isLoading && <ChevronDownFillIcon width={16} height={16} />}
                  </span>

                  {isLoading && (
                      <Spinner
                          type={SpinnerType.Material3}
                          width={16}
                          visible={true}
                          target={`#${spinnerId}`}
                      />
                  )}
              </span>

              {isPopupOpen && createPortal(
                  <Popup
                      ref={popupRef}
                      className={popupClassNames}
                      id={`${id}_popup`}
                      relateTo={spanElementRef.current as HTMLElement}
                      width={setPopupWidth()}
                      height="auto"
                      position={{ X: 'left', Y: 'bottom' }}
                      aria-label={`${id}_popup`}
                      zIndex={zIndex}
                      collision={dir === 'rtl'
                          ? { X: CollisionType.Fit, Y: CollisionType.Flip }
                          : { X: CollisionType.Flip, Y: CollisionType.Flip }}
                      open={isPopupOpen }
                  >
                      {popupContent}
                  </Popup>,
                  document.body
              )}
          </>
      );
  });

export default React.memo(DropDownList);
