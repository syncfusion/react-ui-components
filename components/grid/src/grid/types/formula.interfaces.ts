import { Dispatch, RefObject, SetStateAction } from 'react';
import { ColumnProps } from './column.interfaces';
import { GridRef, IGridBase } from './grid.interfaces';
import { ServiceLocator, UseDataResult, ValueType } from './interfaces';
import { GroupedData } from './grouping.interfaces';
import { VirtualSettings } from './virtualization.interface';

/**
 * Configures formula processing for formula-enabled columns.
 */
export interface FormulaSettings {
    /**
     * Enables formula parsing, evaluation, and recalculation.
     *
     * @default false
     */
    enabled?: boolean;

    /**
     * Registers formula functions by name.
     */
    customFunctions?: Record<string, CustomFormulaFunction>;
}

/** Arguments supplied to a registered custom formula function. */
export interface CustomFormulaArgs {
    values: FormulaValue[];
}

/** Callback contract for a registered custom formula function. */
export type CustomFormulaFunction = (params: CustomFormulaArgs) => FormulaValue;

/**
 * Stable error values produced by formula evaluation.
 */
export type FormulaErrorCode = '#INVALID_REFERENCE' | '#CIRCREF!' | '#PARSE!' | '#NAME?';

/**
 * Values exposed by formula projections.
 */
export type FormulaValue = ValueType | FormulaErrorCode;

/** Parsed spreadsheet reference coordinates. */
export interface ParsedFormulaReference {
    col: number;
    row: number;
    isAbsolute: { col: boolean; row: boolean };
}

/** Token emitted by the formula lexer. */
export interface FormulaToken {
    type: 'operator' | 'delimiter' | 'number' | 'string' | 'reference' | 'function' | 'equals' | 'comparison';
    value: string | number;
    position: number;
}

/** Formula token position and deterministic highlight identity. */
export interface FormulaReferenceHighlight {
    reference: string;
    start: number;
    end: number;
    colorIndex: number;
}

/** Formula inventory entry. */
export interface FormulaDefinition {
    identity: FormulaCellIdentity;
    formula: string;
    value?: FormulaValue;
}

/**
 * Identifies a formula cell without relying on a rendered row index.
 */
export interface FormulaCellIdentity {
    rowKey: string | number;
    field: string;
}

/**
 * Stores a calculated formula projection and its authored expression.
 */
export interface FormulaProjection {
    identity: FormulaCellIdentity;
    formula: string;
    value: FormulaValue;
    references: string[];
}

/**
 * Provides formula state and lifecycle operations to Grid rendering and editing.
 */
export interface FormulaModuleResult<T = unknown> {
    getProjection: (rowKey: string | number, field: string) => FormulaProjection | undefined;
    getRawFormula: (rowKey: string | number, field: string) => string | undefined;
    recalculate: (reason: string) => void;
    setFormula: (rowKey: string | number, field: string, formula: string) => void;
    clearFormula: (rowKey: string | number, field: string) => void;
    getDisplayReference: (column: ColumnProps<T>, rowIndex: number) => string;
    getRowIndex: (rowReference: string | number) => number | undefined;
    toDisplayFormula: (formula: string, rowIndex: number) => string;
    toInternalFormula: (formula: string, rowIndex: number) => string;
    parseReference: (reference: string) => ParsedFormulaReference;
    convertIndexToReference: (columnIndex: number, rowIndex: number) => string;
    adjustReferences: (formula: string, rowOffset: number, columnOffset: number) => string;
    tokenizeFormula: (formula: string) => FormulaToken[];
    extractReferences: (formula: string) => FormulaReferenceHighlight[];
    insertReference: (formula: string, reference: string, caretPosition: number) => { formula: string; caretPosition: number };
    getFormulas: () => FormulaDefinition[];
    hasFormula: (rowKey: string | number, field: string) => boolean;
    addFormula: (name: string, handler: CustomFormulaFunction) => void;
    removeFormula: (name: string) => void;
    getModuleName: () => string;
    registerCustomFunction: (name: string, handler: CustomFormulaFunction) => void;
    getCustomFunction: (name: string) => CustomFormulaFunction | undefined;
    isCustomFunction: (name: string) => boolean;
    destroy: () => void;
    addEventListener: () => void;
    removeEventListener: () => void;
    setCellFormula: (rowKey: string | number, field: string, formula: string | undefined) => void;
    getCellFormula: (rowKey: string | number, field: string) => string | undefined;
    getFormulaValue: (rowKey: string | number, field: string) => FormulaValue | undefined;
    getCellValue: (reference: string) => FormulaValue | undefined;
    getRangeValues: (startReference: string, endReference: string) => FormulaValue[];
    getActualColIndex: (colIndex: number) => number;
}

/**
 * Injectable FormulaModule factory contract.
 */
export type FormulaModuleType<T = unknown> = (
    gridRef: RefObject<GridRef<T>>,
    serviceLocator: ServiceLocator,
    columns: ColumnProps<T>[],
    currentViewData: (GroupedData<T> | T)[],
    dataOperations: UseDataResult<T>,
    formulaSettings: FormulaSettings,
    setGridAction: Dispatch<SetStateAction<Object>>,
    virtualSettings: VirtualSettings,
    gridProps: Partial<IGridBase<T>>
) => FormulaModuleResult<T>;
