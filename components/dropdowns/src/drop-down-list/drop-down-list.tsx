import { useState, useEffect, useRef, forwardRef, useMemo, useCallback, useImperativeHandle, JSX, useId } from 'react';
import * as React from 'react';
import { createPortal } from 'react-dom';
import { Popup, IPopup, Spinner } from '@syncfusion/react-popups';
import { usePopupManagement } from './hooks/usePopupManagement';
import { CLASS_NAMES, LabelMode, InputBase, renderClearButton, renderFloatLabelElement } from '@syncfusion/react-inputs';
import { DataManager, Query } from '@syncfusion/react-data';
import { AnimationOptions, getValue, IL10n, isNullOrUndefined, L10n, preRender, Size, useProviderContext, Variant } from '@syncfusion/react-base';
import { ChevronDownFillIcon } from '@syncfusion/react-icons';
import { DropDownBase } from '../common/drop-down-base';
import ValueTemplate from './value-template';
import { IDropDownBase } from '../common/types';
import { DataLoadEvent, DropDownListProps, FieldSettingsModel, PopupSettings, CollisionType, SortOrder } from './types';
import { useKeyboardNavigation, ListItemData } from './hooks/useKeyboardNavigation';
import { useDropDownListState } from './hooks/useDropDownListState';
import { useSelection } from './hooks/useSelection';
import { useValueSync } from './hooks/useValueSync';
import { processDataResult, useValidation } from './hooks/useDropDownList';

export { AnimationOptions, LabelMode, Variant, Size };

type IDropDownListProps = DropDownListProps & Omit<React.InputHTMLAttributes<HTMLDivElement>, keyof DropDownListProps>;

/**
 * Specifies the methods and extended properties for DropdownList component.
 */
export interface IDropDownList extends DropDownListProps {

    /**
     * Specifies the DOM element of the component.
     *
     * @private
     */
    element?: HTMLElement | null;

    /**
     * To filter the data from given data source by using query.
     *
     * @private
     * @param {object[] | DataManager | string[] | number[] | boolean[]} dataSource - Specifies the data source value to filter.
     * @param {Query} query - Specifies the query to filter the data from the dataSource.
     * @param {FieldSettingsModel} fields - Specifies the fields value to filter the data from the dataSource.
     *
     * @returns {void}
     *
     */
    filter(
        dataSource: object[] | DataManager | string[] | number[] | boolean[],
        query?: Query,
        fields?: FieldSettingsModel
    ): void;
}

/**
 * DropDownList lets users choose a single option from a list. It works with local or remote data sources, supports custom item, group, header, footer, and value templates,
 * offers built-in filtering with debounce and case/accent handling, enables grouping and sorting, and keyboard navigation.
 *
 * ```typescript
 * import { DropDownList } from "@syncfusion/react-dropdowns";
 *
 * export default function App() {
 *   const data = [
 *     { text: "Apple", value: "apple" },
 *     { text: "Banana", value: "banana" },
 *     { text: "Cherry", value: "cherry" }
 *   ];
 *
 *   return (
 *     <DropDownList
 *       id="fruits"
 *       dataSource={data}
 *       fields={{ text: "text", value: "value" }}
 *       placeholder="Select a fruit" />
 *   );
 * }
 * ```
 */
export const DropDownList: React.ForwardRefExoticComponent<IDropDownListProps & React.RefAttributes<IDropDownList>> =
  forwardRef<IDropDownList, IDropDownListProps>((props: IDropDownListProps, ref: React.Ref<IDropDownList>) => {
      const {
          dataSource: dataSourceProp,
          query,
          fields: fieldsProp,
          value = null,
          placeholder = '',
          id =  `dropdownlist_${useId()}`,
          disabled = false,
          readOnly = false,
          popupSettings = {},
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
          debounceDelay = 0,
          sortOrder = SortOrder.None,
          loading = false,
          size = Size.Medium,
          variant = Variant.Standard,
          inputProps = {},
          itemTemplate,
          headerTemplate,
          footerTemplate,
          groupTemplate,
          valueTemplate,
          noRecordsTemplate,
          clearButton = false,
          dropdownIcon,
          valid,
          validationMessage = '',
          validityStyles = true,
          required,
          className,
          onSelect,
          onChange,
          onOpen,
          onClose,
          onError,
          onFilter,
          onDataRequest,
          onDataLoad,
          onErrorTemplate,
          ...otherProps
      } = props;

      const defaultIcon: JSX.Element = useMemo(() => <ChevronDownFillIcon/>, []);

      const resolvedDataSource: { [key: string]: unknown; }[] | DataManager | string[] | number[] | boolean[] = (dataSourceProp
        !== undefined ? dataSourceProp : []) as { [key: string]: unknown; }[] | DataManager | string[] | number[] | boolean[];

      const resolvedFields: FieldSettingsModel = useMemo(() => {
          return fieldsProp ?? { text: 'text', value: 'value', groupBy: 'groupBy', disabled: 'disabled' };
      }, [fieldsProp?.text, fieldsProp?.value, fieldsProp?.groupBy, fieldsProp?.disabled, fieldsProp?.htmlAttributes]);

      const restInputProps: Omit<React.InputHTMLAttributes<HTMLInputElement>, 'className' | 'id' | 'readOnly' | 'required' | 'value' | 'defaultValue'> = React.useMemo(() => {
          const rest: React.InputHTMLAttributes<HTMLInputElement> =
          { ...(inputProps || {}) } as React.InputHTMLAttributes<HTMLInputElement>;
          delete rest.className;
          delete rest.id;
          delete rest.readOnly;
          delete rest.required;
          delete rest.value;
          delete rest.defaultValue;
          return rest as typeof inputProps;
      }, [inputProps]);

      const isOpenControlled: boolean = open !== undefined;
      const [listKey, setListKey] = useState(0);
      const [isValueTemplateVisible, setIsValueTemplateVisible] = useState(false);
      const [isValueControlledAuto, setIsValueControlledAuto] = useState<boolean>(false);
      const [isPopupOpened, setIsPopupOpened] = useState(false);
      const [isDataLoaded, setIsDataLoaded] = useState<boolean>(false);
      const [isRemoteDataLoading, setIsRemoteDataLoading] = useState<boolean>(false);

      const spanElementRef: React.RefObject<HTMLSpanElement | null> = useRef<HTMLSpanElement>(null);
      const inputElementRef: React.RefObject<HTMLInputElement | null> = useRef<HTMLInputElement>(null);
      const popupRef: React.RefObject<IPopup | null> = useRef<IPopup>(null);
      const dropdownbaseRef: React.RefObject<IDropDownBase | null> = useRef<IDropDownBase>(null);
      const spinnerTargetRef: React.RefObject<HTMLSpanElement | null> = useRef<HTMLSpanElement>(null);
      const initialValueRef: React.RefObject<string | number | boolean | object | null> = React.useRef(value);
      const remoteCacheRef: React.RefObject<(string | number | boolean | {[key: string]: unknown; })[] | null> =
      React.useRef<Array<{ [key: string]: unknown } | string | number | boolean> | null>(null);
      const initialDataSourceRef: React.RefObject<string | null> = React.useRef<string | null>(null);
      const initialFieldsRef: React.RefObject<string | null> = React.useRef<string | null>(null);
      const isFetchedRef: React.RefObject<boolean> = useRef<boolean>(false);

      const [ddlState, ddlActions] = useDropDownListState({ defaultValue });
      const { isPopupOpen, ariaExpanded, dropdownValue, textValue, isSpanFocused, isLoading, activeIndex, itemData } = ddlState;
      const { setIsPopupOpen, setAriaExpanded, setDropdownValue, setTextValue, setIsSpanFocused, setIsLoading, setActiveIndex,
          setItemData, setPreviousItemData, setChangeEvent } = ddlActions;

      const baseDropDownClick: (e?: Event | React.MouseEvent<Element, MouseEvent> | React.KeyboardEvent<Element> |
      undefined) => void = (e?: React.MouseEvent | React.KeyboardEvent | Event) => {
          setIsSpanFocused(!isPopupOpen);
          if (isLoading && !isRemoteData && !loading) {
              setIsLoading(false);
          }
          if (!readOnly) {
              if (isPopupOpen) {
                  hidePopup(e as React.MouseEvent<HTMLElement, MouseEvent>);
              } else {
                  showPopup(e as React.MouseEvent<HTMLElement, MouseEvent>);
                  spanElementRef.current?.focus();
              }
          }
      };

      const isRemoteData: boolean = useMemo(() => resolvedDataSource instanceof DataManager, [resolvedDataSource]);
      const { dir, locale } = useProviderContext();
      const spinnerId: string = `${id.replace(/[,]/g, '_')}_spinner`;
      const { isInputValid } = useValidation({ dropdownValue, inputElementRef, required, valid, validationMessage });
      const listId: string = React.useMemo(() => `${id}_listbox`, [id]);
      const getOptionId: (index: number) => string = React.useCallback((index: number) => `${id}_option_${index}`, [id]);
      const comboboxA11yProps: { role: string; 'aria-controls': string; 'aria-activedescendant': string | undefined; 'aria-expanded': boolean; 'aria-autocomplete': 'list'; } = React.useMemo(() => ({
          role: 'combobox',
          'aria-controls': listId,
          'aria-activedescendant': activeIndex != null ? getOptionId(activeIndex) : undefined,
          'aria-expanded': ariaExpanded,
          'aria-autocomplete': 'list' as const
      }), [listId, activeIndex, getOptionId, ariaExpanded]);

      const combinedPopupSettings: PopupSettings = useMemo(() => {
          return {...{zIndex: 1000, position: { X: 'left', Y: 'bottom'}, collision: dir === 'rtl' ?
              { X: CollisionType.Fit, Y: CollisionType.Flip } : { X: CollisionType.Flip, Y: CollisionType.Flip },
          autoReposition: true, width: '100%', height: '300px'  }, ...popupSettings};
      }, [popupSettings, dir]);

      const { showPopup, hidePopup, setPopupWidth, setPopupHeight, popupClassNames } = usePopupManagement({
          isOpenControlled,
          isPopupOpen,
          open,
          setIsPopupOpen,
          setAriaExpanded,
          setIsSpanFocused,
          spanElementRef: spanElementRef as React.RefObject<HTMLSpanElement>,
          inputElementRef: inputElementRef as React.RefObject<HTMLInputElement>,
          popupRef: popupRef as React.RefObject<IPopup>,
          onOpen: onOpen,
          onClose: onClose,
          popupWidth: combinedPopupSettings.width as string ,
          popupHeight: combinedPopupSettings.height as string,
          className
      });

      const listData: ListItemData[] = useMemo(() => {
          const source: DataManager | (string | number | boolean | {[key: string]: unknown; })[] =
          remoteCacheRef.current ? remoteCacheRef.current : resolvedDataSource;
          if (!Array.isArray(source) || (source as unknown[]).length === 0) {
              return [];
          }
          const normalized: (string | number | boolean | { [key: string]: Object })[] = (source)
              .filter((v: string | number | boolean | {[key: string]: unknown; }) => v != null && (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean' || typeof v === 'object')) as (string | number | boolean | { [key: string]: Object })[];
          if (normalized.length === 0) { return []; }
          const processed: (string | number | boolean | {[key: string]: Object; })[] = processDataResult(
              normalized as Array<{ [key: string]: Object } | string | number | boolean>,
              resolvedFields,
              sortOrder,
              (query ?? new Query())
          ) as (string | number | boolean | { [key: string]: Object })[];
          return processed.map((item: string | number | boolean | {[key: string]: Object; }) => {
              const isDisabled: string | boolean | undefined =
                  resolvedFields.disabled && typeof item === 'object' && getValue(resolvedFields.disabled, item) === true;
              const isHeader: boolean = typeof item === 'object' && !!getValue('isHeader', item);
              return { item: item as unknown as (string | number | { [key: string]: unknown }),
                  isDisabled: Boolean(isDisabled), isHeader } as ListItemData;
          });
      }, [remoteCacheRef.current, resolvedDataSource, resolvedFields, sortOrder, query, isDataLoaded]);

      const startRemoteRequest: () => void = useCallback(() => {
          setIsLoading(true);
          setIsRemoteDataLoading(true);
      }, [setIsLoading]);

      const endRemoteRequest: () => void = useCallback(() => {
          setIsLoading(false);
          setIsRemoteDataLoading(false);
      }, [setIsLoading]);

      const handleDataLoaded: () => void = useCallback(() => {
          endRemoteRequest();
          isFetchedRef.current = true;
          if (dropdownbaseRef.current && dropdownValue !== null && dropdownValue !== undefined) {
              const valueData: string | number | boolean | { [key: string]: object; } | undefined =
              dropdownbaseRef.current.getDataByValue(dropdownValue as string | number | boolean);
              if (valueData !== undefined) {
                  const textField: string | undefined = resolvedFields?.text;
                  const displayText: string = typeof valueData === 'object' && textField ? String(getValue(textField, valueData)) :
                      typeof valueData === 'string' || typeof valueData === 'number' || typeof valueData === 'boolean' ? String(valueData) :
                          dropdownbaseRef.current.getTextByValue( dropdownValue as string | number | boolean );
                  setTextValue(displayText);
              }
          }
      }, [endRemoteRequest, dropdownbaseRef, dropdownValue, resolvedFields?.text, setTextValue]);

      const prefetchData: () => Promise<(string | number | { [key: string]: unknown; })[] | null> = React.useCallback(async () => {
          const data: DataManager | string[] | number[] | boolean[] | unknown[] | null =
          isRemoteData ? await prefetchIfNeeded() : resolvedDataSource;
          if (Array.isArray(data)) {
              const normalized: (string | number | { [key: string]: unknown;  })[] = (data as object[]).filter(
                  (v: object) => v != null && (typeof v === 'string' || typeof v === 'number' || typeof v === 'object')) as Array<{ [key: string]: unknown } | string | number>;
              remoteCacheRef.current = normalized;
              setIsDataLoaded(true);
              return normalized;
          }
          return null;
      }, [isRemoteDataLoading, isFetchedRef, handleDataLoaded, baseDropDownClick, endRemoteRequest]);

      useValueSync({
          value,
          defaultValue,
          dataSource: resolvedDataSource,
          dataSourceListItems: listData,
          fields: resolvedFields,
          isValueControlled: isValueControlledAuto,
          allowObjectBinding,
          filterable,
          dropdownbaseRef,
          setDropdownValue: (v: number | string | boolean | object | null) => setDropdownValue(v),
          setTextValue: (v: string) => setTextValue(v),
          setActiveIndex: (v: number | null) => setActiveIndex(v),
          setItemData,
          prefetchData
      });

      useEffect(() => {
          const isControlled: boolean = open !== undefined;
          if (!isControlled) { return; }
          if (open !== isPopupOpen) {
              setIsPopupOpen(Boolean(open));
          }
      }, [open, isPopupOpen, setIsPopupOpen]);

      const handleOnError: (err: Error) => void = React.useCallback((err: Error) => {
          endRemoteRequest();
          setIsLoading(false);
          setIsDataLoaded(true);
          onError?.(err);
      }, [isRemoteDataLoading, isFetchedRef, endRemoteRequest, onError]);

      const { keyActionHandler } = useKeyboardNavigation({
          disabled,
          readOnly,
          isPopupOpen,
          skipDisabledItems,
          activeIndex,
          onChange,
          setActiveIndex,
          dataSource: resolvedDataSource,
          dataSourceListItems: listData,
          fields: resolvedFields,
          dropdownbaseRef,
          setTextValue: (v: string) => setTextValue(v),
          setSelection: (li: Element, e: React.MouseEvent<Element, MouseEvent> | React.KeyboardEvent<Element>) => setSelection(li, e),
          showPopup,
          hidePopup,
          setIsSpanFocused,
          baseDropDownClick,
          setDropdownValue: (v: string | number | boolean | object | null) => setDropdownValue(v),
          prefetchData,
          currentItemData: itemData,
          setItemData
      });

      const getItemData: (itemData: FieldSettingsModel | string | number | boolean |
      { [key: string]: unknown } | null, fields: FieldSettingsModel) => { [key: string]: string } =
      (itemData: FieldSettingsModel | string | number | boolean |
      { [key: string]: unknown } | null, fields: FieldSettingsModel) => {
          const dataItem: { [key: string]: string } = {};
          if (!isNullOrUndefined(itemData)) {
              const fieldData: string | boolean | object = getValue(fields?.value as string, itemData);
              dataItem.value = fieldData as string;
              dataItem.text = getValue(fields?.text || fields?.value || '', itemData) as string;
          }
          return dataItem;
      };

      const selectEventCallback: ( li: Element, e: React.MouseEvent<Element> | React.KeyboardEvent<Element> | null,
          selectedData?: string | number | boolean | { [key: string]: object }, value?: string | number | boolean | null )
      => void = useCallback(( li: Element, e: React.MouseEvent<Element> | React.KeyboardEvent<Element> | null, selectedData?: string |
      number | boolean | { [key: string]: object }, value?: string | number | boolean | null) => {
          setPreviousItemData(itemData || null);
          setChangeEvent(e as React.MouseEvent<Element> | React.KeyboardEvent<Element>);

          let nextValue: string | number | boolean | null | undefined | Element = value ?? li;
          if (typeof selectedData === 'string' || typeof selectedData === 'number' || typeof selectedData === 'boolean') {
              setItemData(selectedData);
              setDropdownValue(selectedData);
              nextValue = selectedData;
          } else {
              setItemData(selectedData as { [key: string]: object; });
              if (value !== null && value !== undefined) {
                  setDropdownValue(value as string | number | boolean);
                  nextValue = value;
              } else if (selectedData) {
                  const extracted: {
                      [key: string]: string;
                  } = getItemData(selectedData, resolvedFields);
                  setDropdownValue(extracted.value);
                  nextValue = extracted.value !== null ? extracted.value : null;
              }
          }

          if (dropdownbaseRef.current != null && nextValue !== null && nextValue !== undefined) {
              setActiveIndex(dropdownbaseRef.current.getIndexByValue(nextValue as string | number | boolean));
          }

          if (onChange && nextValue !== undefined) {
              onChange({
                  event: e as React.KeyboardEvent<Element> | React.MouseEvent<Element, MouseEvent>,
                  previousItemData: itemData,
                  value: nextValue,
                  itemData: selectedData ? selectedData : null
              });
          }
      }, [itemData, onChange, resolvedFields]);

      const { setSelection, onItemClick } = useSelection({
          dropdownbaseRef,
          onSelect,
          getFormattedValue: dropdownbaseRef?.current?.getFormattedValue,
          setActiveIndex,
          selectEventCallback,
          setTextValue: (v: string) => setTextValue(v),
          setDropdownValue: (v: React.SetStateAction<string | number | boolean | object | null>) => setDropdownValue(v),
          hidePopup
      });

      useEffect(() => {
          if (value !== undefined && value !== initialValueRef.current && !allowObjectBinding) {
              setIsValueControlledAuto(true);
          }
      }, [value]);

      useEffect(() => {
          if (isPopupOpen && filterable && dropdownbaseRef.current) {
              requestAnimationFrame(() => {
                  setIsSpanFocused(false);
              });
          }
      }, [isPopupOpen, filterable]);

      useEffect(() => {
          setIsLoading(loading);
      }, [loading, setIsLoading]);

      useEffect(() => {
          if (!isOpenControlled) { return; }
          if (open) {
              setIsSpanFocused(true);
              setAriaExpanded(true);
              showPopup();
          } else {
              hidePopup();
              setAriaExpanded(false);
              setIsSpanFocused(false);
          }
      }, [open, isOpenControlled, showPopup, hidePopup, setAriaExpanded, setIsSpanFocused]);

      useEffect(() => {
          preRender('dropdownlist');
      }, []);

      useEffect(() => {
          if (itemData !== null && isPopupOpened) {
              const listItems: HTMLLIElement[] | undefined = dropdownbaseRef?.current?.getListItems();
              const currValue: string | number | boolean | null = typeof itemData === 'object' && itemData !== null
                  ? (getValue(resolvedFields?.value ?? 'value', itemData) as string | number | boolean | null) : (itemData as string | number | boolean | null);
              const activeItem: HTMLElement | undefined = listItems?.find((item: HTMLElement) => item.getAttribute('data-value') === String(currValue));
              if (activeItem && activeItem.classList.contains('sf-active')) {
                  setSelection(activeItem, null);
              }
          }
          setIsPopupOpened(false);
      }, [itemData, isPopupOpened]);

      useEffect(() => {
          if (initialDataSourceRef.current === null) {
              initialDataSourceRef.current = JSON.stringify(props.dataSource) ?? null;
          }
          if (initialFieldsRef.current === null) {
              initialFieldsRef.current = JSON.stringify(props.fields) ?? null;
          }
      }, []);

      useEffect(() => {
          if (JSON.stringify(props.dataSource) !== initialDataSourceRef.current ||
          JSON.stringify(props.fields) !== initialFieldsRef.current ) {
              initialDataSourceRef.current = JSON.stringify(props.dataSource) ?? null;
              initialFieldsRef.current = JSON.stringify(props.fields) ?? null;
              remoteCacheRef.current = null;
              if (isFetchedRef?.current) {
                  setIsDataLoaded(false);
                  isFetchedRef.current = false;
                  prefetchData();
              }
              setIsLoading(false);
              setListKey((value: number) => value + 1);
          }
      }, [props.dataSource, props.fields]);

      useEffect(() => {
          if (!isRemoteData) {
              setIsRemoteDataLoading(false);
          }
      }, [isRemoteData]);

      useEffect(() => {
          if (isRemoteData && isPopupOpen && !isFetchedRef.current) {
              startRemoteRequest();
          }
      }, [isRemoteData, isPopupOpen, startRemoteRequest]);

      const propLoadingActive: boolean = useMemo(() => Boolean(loading) && !isPopupOpen, [loading, isPopupOpen]);
      const uiLoading: boolean = useMemo(() => (
          isRemoteData ? (propLoadingActive || (isRemoteDataLoading && !isDataLoaded)) : (propLoadingActive || isLoading)
      ), [isRemoteData, propLoadingActive, isRemoteDataLoading, isLoading, isDataLoaded]);

      const setPlaceholder: string = useMemo(() => {
          const l10n: IL10n = L10n('dropdownList', { placeholder: placeholder }, locale);
          l10n.setLocale(locale);
          const localized: string = l10n.getConstant('placeholder') as string;
          return localized || (placeholder || '');
      }, [locale, placeholder]);

      const handleOnDataLoad: (e: { data: DataManager | Array<{[key: string]: unknown; }> | string[] | number[] | boolean[]; }) => void =
      (e: { data: DataManager | Array<{[key: string]: unknown; }> | string[] | number[] | boolean[]; }): void => {
          if (Array.isArray(e.data)) {
              const normalized: (string | number | { [key: string]: unknown; })[] = (e.data as object[]).filter(
                  (v: object) => v != null && (typeof v === 'string' || typeof v === 'number' || typeof v === 'object')) as Array<{ [key: string]: unknown } | string | number>;
              remoteCacheRef.current = normalized;
          } else {
              remoteCacheRef.current = null;
          }
          onDataLoad?.(e as DataLoadEvent);
          setIsDataLoaded(true);
      };

      const publicAPI: Partial<IDropDownList> = useMemo(() => ({
          dataSource: resolvedDataSource,
          query,
          fields: resolvedFields,
          value,
          placeholder,
          id,
          popupSettings,
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
          dropdownIcon,
          loading,
          size,
          variant
      }), [resolvedDataSource, resolvedFields, value, placeholder, id, popupSettings, allowObjectBinding]);

      const containerClassNames: string = useMemo(() => {
          return [
              'sf-input-group sf-control',
              'sf-ddl',
              uiLoading ? 'sf-loading' : '',
              dir === 'rtl' ? 'sf-rtl' : '',
              readOnly ? 'sf-readonly' : '',
              disabled ? 'sf-disabled' : '',
              labelMode !== 'Never' ? CLASS_NAMES.FLOATINPUT : '',
              isSpanFocused ? 'sf-input-focus' : '',
              (!isInputValid && validityStyles) ? 'sf-error' : '',
              size === Size.Small ? 'sf-small' : size === Size.Large ? 'sf-large' : 'sf-medium',
              variant && variant.toLowerCase() !== 'standard'  ? variant.toLowerCase() === 'outlined' ? 'sf-outline' : `sf-${variant.toLowerCase()}` : '',
              className
          ].filter(Boolean).join(' ');
      }, [uiLoading, readOnly, disabled, dir, isSpanFocused, isInputValid, validityStyles, size, variant, className]);

      const showValueTemplate: boolean = useMemo(() =>
          Boolean(valueTemplate && isValueTemplateVisible), [valueTemplate, isValueTemplateVisible]);

      const popupContent: JSX.Element = useMemo(() => (
          <DropDownBase
              key={listKey}
              ref={dropdownbaseRef}
              dataSource={resolvedDataSource}
              itemData={itemData as { [key: string]: unknown; } | string | number | boolean }
              fields={resolvedFields}
              query={query}
              ignoreAccent={ignoreAccent}
              ignoreCase={ignoreCase}
              isDropdownFiltering={filterable}
              filterPlaceholder={filterPlaceholder}
              filterType={filterType}
              size={size}
              sortOrder={sortOrder}
              allowObjectBinding={allowObjectBinding}
              onItemClick={onItemClick}
              itemTemplate={itemTemplate}
              headerTemplate={headerTemplate}
              footerTemplate={footerTemplate}
              groupTemplate={groupTemplate}
              noRecordsTemplate={isRemoteDataLoading ? null : noRecordsTemplate}
              value={dropdownValue}
              keyActionHandler={keyActionHandler}
              onError={handleOnError}
              onErrorTemplate={onErrorTemplate}
              onFilter={onFilter}
              onRemoteDataLoaded={handleDataLoaded}
              onDataRequest={onDataRequest}
              onDataLoad={handleOnDataLoad}
              listId={listId}
              getOptionId={getOptionId}
              activeIndex={activeIndex}
              id={id}
              debounceDelay={debounceDelay}
              endRemoteRequest={endRemoteRequest}
              remoteCacheRef={remoteCacheRef}
          />
      ), [listKey, dropdownbaseRef, resolvedDataSource, resolvedFields, query, ignoreAccent, ignoreCase, filterable, filterPlaceholder,
          filterType, size, sortOrder, onItemClick, itemTemplate, headerTemplate, footerTemplate, groupTemplate, isRemoteDataLoading,
          noRecordsTemplate, dropdownValue, keyActionHandler, onError, onErrorTemplate, onFilter, handleDataLoaded, onDataRequest,
          onDataLoad, listId, id, getOptionId, activeIndex, debounceDelay, endRemoteRequest, remoteCacheRef, handleOnDataLoad ]);

      useImperativeHandle(ref, () => ({
          ...publicAPI as IDropDownList,
          element: inputElementRef.current,
          filter
      }), [publicAPI]);

      const filter: (dataSource: { [key: string]: Object }[] | DataManager | string[] | number[] | boolean[], query?:
      Query, fields?: FieldSettingsModel) => void = useCallback((dataSource: { [key: string]: Object }[] | DataManager | string[] |
      number[] | boolean[], query?: Query, fields?: FieldSettingsModel) => {
          if (dropdownbaseRef.current) {
              dropdownbaseRef.current.filter(dataSource, query, fields || props.fields);
          }
      }, [props.fields]);

      const onPopupOpen: () => void = useCallback(() => {
          setIsPopupOpened(true);
      }, []);

      const handleInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void =
      useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
          setTextValue(event.target.value);
      }, [setTextValue]);

      const handleFocus: () => void = useCallback(() => {
          setIsSpanFocused(true);
          const length: number | undefined = inputElementRef.current?.value.length;
          if (length) {
              inputElementRef.current?.setSelectionRange(length, length);
          }
      }, [isPopupOpen, activeIndex, setIsSpanFocused, dropdownbaseRef, setActiveIndex]);

      const handleClear: (e: React.MouseEvent) => void = useCallback((e: React.MouseEvent) => {
          e.preventDefault();
          e.stopPropagation();
          setTextValue('');
          setDropdownValue(null);
          setActiveIndex(null);
          setItemData(null);
          setChangeEvent(null);
          setListKey((prev: number) => prev + 1);
          if (onChange) {
              onChange({ event: e, previousItemData: itemData, value: null, itemData: null });
          }
      }, [onChange, itemData, setTextValue, setDropdownValue, setActiveIndex, setItemData, setChangeEvent]);

      const focusOutAction: (e?: React.MouseEvent<Element> | React.KeyboardEvent<Element> | React.FocusEvent<Element>) => void =
      useCallback(() => {
          setIsSpanFocused(false);
      }, [setIsSpanFocused]);

      const onBlurHandler: (e: React.FocusEvent<HTMLElement>) => void = useCallback((e: React.FocusEvent<HTMLElement>) => {
          if (disabled) {return; }
          const target: (EventTarget & Element) | null = e.relatedTarget;
          if (!inputElementRef.current?.contains(target)) {
              focusOutAction(e);
          }
      }, [disabled, focusOutAction]);

      const renderValueTemplate: () => JSX.Element | null = useCallback(() => {
          return (
              <ValueTemplate
                  valueTemplate={valueTemplate}
                  dropdownValue={dropdownValue}
                  dataSource={Array.isArray(resolvedDataSource) ? resolvedDataSource : []}
                  fields={resolvedFields}
                  allowObjectBinding={allowObjectBinding}
                  onRenderedChange={setIsValueTemplateVisible}
              />
          );
      }, [valueTemplate, dropdownValue, resolvedDataSource, resolvedFields, allowObjectBinding]);

      const dropDownClick: (e: React.MouseEvent<HTMLSpanElement>) => void = useCallback((e: React.MouseEvent<HTMLSpanElement>) => {
          if (e.button === 2 || disabled) { return; }
          const el: Element | null = e.target instanceof Element ? e.target : null;
          if (el && el.parentElement && el.parentElement.matches('.sf-clear-icon')) { return; }
          baseDropDownClick(e);
          if (isRemoteData && isPopupOpen) {
              endRemoteRequest();
          }
      }, [endRemoteRequest, disabled, isPopupOpen, isRemoteData, baseDropDownClick]);

      const prefetchIfNeeded: () => Promise<object[] | null> = useCallback(async (): Promise<object[] | null> => {
          if (!isRemoteData || isFetchedRef.current) {
              return null;
          }
          const dm: DataManager = resolvedDataSource as DataManager;
          try {
              startRemoteRequest();
              onDataRequest?.({ data: dm, query: query ?? new Query() });
              const res: unknown = await dm.executeQuery(query ?? new Query());
              const arr: { [key: string]: unknown; }[] =
              (Array.isArray((res as {result: unknown})?.result) ? (res as {result: unknown}).result : []) as { [key: string]: unknown; }[];
              isFetchedRef.current = true;
              onDataLoad?.({ data: arr });
              endRemoteRequest();
              return arr as { [key: string]: unknown; }[];
          } catch (err: unknown) {
              endRemoteRequest();
              onError?.(err as Error);
              return null;
          }
      }, [isRemoteData, resolvedDataSource, query, startRemoteRequest, endRemoteRequest, onDataRequest, onDataLoad, onError]);

      return (
          <>
              <span
                  ref={spanElementRef}
                  className={containerClassNames}
                  tabIndex={-1}
                  onMouseDown={dropDownClick}
                  onKeyDown={keyActionHandler}
                  {...otherProps}
              >
                  {valueTemplate && (
                      <span className={`sf-input-value ${showValueTemplate ? 'sf-content' : 'sf-display-none'}`}>
                          {renderValueTemplate()}
                      </span>
                  )}

                  <InputBase
                      id={id}
                      ref={inputElementRef}
                      className={`${dir === 'rtl' ? 'sf-rtl' : ''} ${isInputValid ? 'sf-valid-input' : ''} sf-dropdown-list ${showValueTemplate ? 'sf-input-value-template' : ''}`}
                      type="text"
                      value={textValue || ''}
                      aria-haspopup="listbox"
                      aria-label="dropdownlist"
                      aria-disabled={disabled}
                      aria-readonly={readOnly}
                      placeholder={setPlaceholder}
                      floatLabelType={labelMode}
                      onChange={handleInputChange}
                      onFocus={handleFocus}
                      onBlur={onBlurHandler}
                      {...comboboxA11yProps}
                      {...restInputProps}
                      readOnly={true}
                      required={required}
                  />

                  {labelMode !== 'Never' && renderFloatLabelElement( labelMode, isSpanFocused, textValue || '', placeholder, id )}

                  {clearButton && renderClearButton((textValue && (isSpanFocused || isPopupOpen)) ? textValue : '', handleClear)}

                  {!uiLoading && (<span
                      ref={spinnerTargetRef}
                      id={spinnerId}
                      aria-hidden='true'
                      className={`sf-input-icon sf-ddl-icon
                          ${!uiLoading ? 'sf-icon-container' : ''} 
                          ${!uiLoading && isPopupOpen ? 'sf-icon-rotate' : 'sf-icon-normal'} 
                          ${size === Size.Small ? 'sf-small' : size === Size.Large ? 'sf-large' : 'sf-medium'}`}
                  >
                      {dropdownIcon ?? defaultIcon}
                  </span>)}
                  {uiLoading && (
                      <Spinner
                          size={ size === Size.Small ? '16px' : '20px'}
                          visible={true}
                      />
                  )}
              </span>

              {isPopupOpen && typeof document !== 'undefined' && createPortal(
                  <Popup
                      ref={popupRef}
                      className={popupClassNames}
                      id={`${id}_popup`}
                      relateTo={spanElementRef.current as HTMLElement}
                      width={setPopupWidth()}
                      height="auto"
                      position={combinedPopupSettings.position}
                      zIndex={combinedPopupSettings.zIndex}
                      collision={combinedPopupSettings.collision}
                      open={isPopupOpen }
                      onOpen={onPopupOpen}
                      autoReposition={combinedPopupSettings.autoReposition}
                      animation={{ show: { name: 'FadeIn', duration: 100 }, hide: { name: 'FadeOut', duration: 100 } }}
                      offsetX={combinedPopupSettings.offsetX}
                      offsetY={combinedPopupSettings.offsetY}
                      style={{ maxHeight: setPopupHeight() }}
                  >
                      {popupContent}
                  </Popup>,
                  document.body
              )}
          </>
      );
  });

export default React.memo(DropDownList);
