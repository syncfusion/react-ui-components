import { useEffect, useMemo } from 'react';
import { ColumnProps } from '../types/column.interfaces';
import { FormulaModuleResult, FormulaProjection, FormulaSettings, FormulaValue, FormulaErrorCode, FormulaCellIdentity, FormulaModuleType,
    ParsedFormulaReference, FormulaToken as PublicFormulaToken, FormulaReferenceHighlight, FormulaDefinition, CustomFormulaFunction } from '../types/formula.interfaces';
import { GridRef, IGridBase } from '../types/grid.interfaces';
import { GroupedData } from '../types/grouping.interfaces';
import { ServiceLocator, UseDataResult } from '../types/interfaces';
import { VirtualSettings } from '../types/virtualization.interface';
import { RefObject, Dispatch, SetStateAction } from 'react';
import { getWithoutSpecialColumns } from '../utils/utils';

interface FormulaToken {
    type: 'number' | 'string' | 'identifier' | 'operator' | 'comparison' | 'leftParen' | 'rightParen' | 'comma' | 'colon';
    value: string;
}

interface FormulaArgument {
    value: FormulaValue;
    rangeValues?: FormulaValue[];
}

interface FormulaContext<T> {
    rowKey: string | number;
    currentRowIndex: number;
    columns: ColumnProps<T>[];
    rows: T[];
    rowKeys: Map<number, string | number>;
    resolveRowIndex: (rowReference: FormulaValue) => number;
    evaluateCell: (rowIndex: number, field: string) => FormulaValue;
    getRangeValues: (startReference: string, endReference: string) => FormulaValue[];
    customFunctions: Record<string, CustomFormulaFunction>;
    // evaluateCell: (rowIndex: number, field: string, stack: Set<string>) => FormulaValue;
}

const INVALID_REFERENCE: FormulaErrorCode = '#INVALID_REFERENCE';
const CIRCULAR_REFERENCE: FormulaErrorCode = '#CIRCREF!';
const PARSE_ERROR: FormulaErrorCode = '#PARSE!';
const NAME_ERROR: FormulaErrorCode = '#NAME?';

const builtInFunctions: Set<string> = new Set([
    'SUM', 'AVERAGE', 'COUNT', 'MIN', 'MAX', 'IF', 'ABS', 'ROUND', 'PRODUCT', 'CONCAT', 'CONCATENATE',
    'COUNTA', 'COUNTBLANK', 'COUNTIF', 'MEDIAN', 'SUMIF', 'RAN', 'RAND', 'RANDOM', 'TODAY', 'NOW', 'MOD', 'POWER', 'SQRT'
]);

const isFormulaError: (value: FormulaValue) => value is FormulaErrorCode = (value: FormulaValue): value is FormulaErrorCode =>
    value === INVALID_REFERENCE || value === CIRCULAR_REFERENCE || value === PARSE_ERROR || value === NAME_ERROR;

const toNumber: (value: FormulaValue) => number = (value: FormulaValue): number => {
    if (isFormulaError(value)) {
        throw new Error(value);
    }
    if (typeof value === 'number') {
        return value;
    }
    if (typeof value === 'boolean') {
        return value ? 1 : 0;
    }
    if (value === null || value === undefined || value === '') {
        return 0;
    }
    if (typeof value === 'string') {
        const parsedValue: number = Number(value);
        if (!Number.isNaN(parsedValue)) {
            return parsedValue;
        }
    }
    throw new Error(PARSE_ERROR);
};

const columnIndexToLetter: (columnIndex: number) => string = (columnIndex: number): string => {
    if (columnIndex < 0) {
        return '';
    }
    let currentIndex: number = columnIndex + 1;
    let letters: string = '';
    while (currentIndex > 0) {
        currentIndex -= 1;
        letters = String.fromCharCode(65 + (currentIndex % 26)) + letters;
        currentIndex = Math.floor(currentIndex / 26);
    }
    return letters;
};

const letterToColumnIndex: (letters: string) => number = (letters: string): number => {
    let index: number = 0;
    for (const letter of letters.toUpperCase()) {
        index = index * 26 + letter.charCodeAt(0) - 64;
    }
    return index - 1;
};

const tokenize: (formula: string) => FormulaToken[] = (formula: string): FormulaToken[] => {
    const tokens: FormulaToken[] = [];
    let position: number = formula.startsWith('=') ? 1 : 0;
    while (position < formula.length) {
        const character: string = formula[position as number];
        if (/\s/.test(character)) {
            position += 1;
        } else if (/\d|\./.test(character)) {
            const start: number = position;
            position += 1;
            while (position < formula.length && /[\d.]/.test(formula[position as number])) {
                position += 1;
            }
            tokens.push({ type: 'number', value: formula.slice(start, position) });
        } else if (character === '"') {
            const start: number = position + 1;
            position += 1;
            while (position < formula.length && formula[position as number] !== '"') {
                position += 1;
            }
            if (position >= formula.length) {
                throw new Error(PARSE_ERROR);
            }
            tokens.push({ type: 'string', value: formula.slice(start, position) });
            position += 1;
        } else if (/[A-Za-z_$]/.test(character)) {
            const start: number = position;
            position += 1;
            while (position < formula.length && /[A-Za-z\d_$]/.test(formula[position as number])) {
                position += 1;
            }
            tokens.push({ type: 'identifier', value: formula.slice(start, position) });
        } else if ('+-*/'.includes(character)) {
            tokens.push({ type: 'operator', value: character });
            position += 1;
        } else if ('<>=!'.includes(character)) {
            const comparison: string = formula.slice(position, position + 2);
            if (comparison === '<=' || comparison === '>=' || comparison === '<>') {
                tokens.push({ type: 'comparison', value: comparison });
                position += 2;
            } else if (character === '<' || character === '>' || character === '=') {
                tokens.push({ type: 'comparison', value: character });
                position += 1;
            } else {
                throw new Error(PARSE_ERROR);
            }
        } else if (character === '(') {
            tokens.push({ type: 'leftParen', value: character });
            position += 1;
        } else if (character === ')') {
            tokens.push({ type: 'rightParen', value: character });
            position += 1;
        } else if (character === ',') {
            tokens.push({ type: 'comma', value: character });
            position += 1;
        } else if (character === ':') {
            tokens.push({ type: 'colon', value: character });
            position += 1;
        } else {
            throw new Error(PARSE_ERROR);
        }
    }
    return tokens;
};

class FormulaParser<T> {
    private readonly tokens: FormulaToken[];
    private position: number = 0;
    private readonly context: FormulaContext<T>;
    private readonly references: string[];

    public constructor(formula: string, context: FormulaContext<T>, references: string[]) {
        this.tokens = tokenize(formula);
        this.context = context;
        this.references = references;
    }

    public parse(): FormulaValue {
        const value: FormulaValue = this.parseComparison();
        if (this.position !== this.tokens.length) {
            throw new Error(PARSE_ERROR);
        }
        return value;
    }

    private parseComparison(): FormulaValue {
        const leftValue: FormulaValue = this.parseAdditive();
        if (this.peek()?.type !== 'comparison') {
            return leftValue;
        }
        const operator: string = this.consume().value;
        const rightValue: FormulaValue = this.parseAdditive();
        if (isFormulaError(leftValue)) {
            throw new Error(leftValue);
        }
        if (isFormulaError(rightValue)) {
            throw new Error(rightValue);
        }
        if (operator === '=') {
            return leftValue === rightValue;
        }
        if (operator === '<>') {
            return leftValue !== rightValue;
        }
        const leftNumber: number = toNumber(leftValue);
        const rightNumber: number = toNumber(rightValue);
        if (operator === '<') { return leftNumber < rightNumber; }
        if (operator === '<=') { return leftNumber <= rightNumber; }
        if (operator === '>') { return leftNumber > rightNumber; }
        return leftNumber >= rightNumber;
    }

    private parseAdditive(): FormulaValue {
        let value: FormulaValue = this.parseMultiplicative();
        while (this.matchOperator('+', '-')) {
            const operator: string = this.previous().value;
            const rightValue: FormulaValue = this.parseMultiplicative();
            value = operator === '+' ? toNumber(value) + toNumber(rightValue) : toNumber(value) - toNumber(rightValue);
        }
        return value;
    }

    private parseMultiplicative(): FormulaValue {
        let value: FormulaValue = this.parseUnary();
        while (this.matchOperator('*', '/')) {
            const operator: string = this.previous().value;
            const rightValue: FormulaValue = this.parseUnary();
            if (operator === '/' && toNumber(rightValue) === 0) {
                throw new Error(PARSE_ERROR);
            }
            value = operator === '*' ? toNumber(value) * toNumber(rightValue) : toNumber(value) / toNumber(rightValue);
        }
        return value;
    }

    private parseUnary(): FormulaValue {
        if (this.matchOperator('+', '-')) {
            const operator: string = this.previous().value;
            const value: FormulaValue = this.parseUnary();
            return operator === '-' ? -toNumber(value) : toNumber(value);
        }
        return this.parsePrimary();
    }

    private parsePrimary(): FormulaValue {
        const token: FormulaToken | undefined = this.peek();
        if (!token) {
            throw new Error(PARSE_ERROR);
        }
        if (token.type === 'number') {
            this.position += 1;
            const value: number = Number(token.value);
            if (Number.isNaN(value)) {
                throw new Error(PARSE_ERROR);
            }
            return value;
        }
        if (token.type === 'string') {
            this.position += 1;
            return token.value;
        }
        if (token.type === 'leftParen') {
            this.position += 1;
            const value: FormulaValue = this.parseComparison();
            if (!this.matchType('rightParen')) {
                throw new Error(PARSE_ERROR);
            }
            return value;
        }
        if (token.type === 'identifier') {
            this.position += 1;
            if (this.matchType('leftParen')) {
                return this.parseFunction(token.value);
            }
            return this.parseReference(token.value);
        }
        throw new Error(PARSE_ERROR);
    }

    private parseFunction(name: string): FormulaValue {
        const normalizedName: string = name.toUpperCase();
        if (normalizedName === 'REF') {
            const columnName: FormulaValue = this.parseFunctionArgument();
            if (!this.matchType('comma')) {
                throw new Error(PARSE_ERROR);
            }
            const rowNumber: FormulaValue = this.parseFunctionArgument();
            if (!this.matchType('rightParen') || typeof columnName !== 'string') {
                throw new Error(PARSE_ERROR);
            }
            return this.resolveReference(rowNumber, columnName);
        }
        if (normalizedName === 'COLUMN' || normalizedName === 'ROW') {
            const argument: FormulaValue = this.parseFunctionArgument();
            if (!this.matchType('rightParen')) {
                throw new Error(PARSE_ERROR);
            }
            return argument;
        }
        if (builtInFunctions.has(normalizedName)) {
            return this.evaluateBuiltInFunction(normalizedName, this.parseValueArguments());
        }
        const customFunction: CustomFormulaFunction | undefined = this.context.customFunctions[normalizedName as string];
        if (!customFunction) {
            throw new Error(NAME_ERROR);
        }
        return customFunction({ values: this.flattenArguments(this.parseValueArguments()) });
    }

    private evaluateBuiltInFunction(name: string, argumentsList: FormulaArgument[]): FormulaValue {
        const values: FormulaValue[] = this.flattenArguments(argumentsList);
        const requireCount: (minimum: number, maximum?: number) => void =
            (minimum: number, maximum: number = Number.POSITIVE_INFINITY): void => {
                if (argumentsList.length < minimum || argumentsList.length > maximum) {
                    throw new Error(PARSE_ERROR);
                }
            };
        const requireNumeric: () => number[] = (): number[] => values.map((value: FormulaValue) => toNumber(value));
        if (name === 'SUM') {
            return requireNumeric().reduce<number>((total: number, value: number) => total + value, 0);
        }
        const errorValue: FormulaValue | undefined = values.find((value: FormulaValue) => isFormulaError(value));
        if (errorValue) {
            throw new Error(errorValue);
        }
        if (name === 'CONCAT' || name === 'CONCATENATE') {
            requireCount(1);
            return values.map((value: FormulaValue) => String(value)).join('');
        }
        if (name === 'COUNT') {
            requireCount(1);
            return values.filter((value: FormulaValue) => typeof value === 'number' && Number.isFinite(value)).length;
        }
        if (name === 'COUNTA') {
            requireCount(1);
            return values.filter((value: FormulaValue) => value !== '' && value !== null && value !== undefined).length;
        }
        if (name === 'COUNTBLANK') {
            requireCount(1);
            return values.filter((value: FormulaValue) => value === '' || value === null || value === undefined).length;
        }
        if (name === 'IF') {
            requireCount(2, 3);
            const condition: FormulaValue = argumentsList[0].value;
            const isTrue: boolean = typeof condition === 'boolean' ? condition : toNumber(condition) !== 0;
            return (isTrue ? argumentsList[1] : argumentsList[2])?.value ?? false;
        }
        if (name === 'ABS') {
            requireCount(1, 1);
            return Math.abs(toNumber(values[0]));
        }
        if (name === 'ROUND') {
            requireCount(1, 2);
            const precision: number = argumentsList.length === 2 ? toNumber(argumentsList[1].value) : 0;
            const factor: number = Math.pow(10, precision);
            return Math.round(toNumber(argumentsList[0].value) * factor) / factor;
        }
        if (name === 'PRODUCT') {
            requireCount(1);
            return requireNumeric().reduce<number>((total: number, value: number) => total * value, 1);
        }
        if (name === 'MEDIAN') {
            requireCount(1);
            const sortedValues: number[] = requireNumeric().sort((left: number, right: number) => left - right);
            const middle: number = Math.floor(sortedValues.length / 2);
            return sortedValues.length % 2 === 0 ? (sortedValues[middle - 1] + sortedValues[middle as number]) / 2 :
                sortedValues[middle as number];
        }
        if (name === 'COUNTIF' || name === 'SUMIF') {
            requireCount(2, 3);
            const criteriaRange: FormulaValue[] = argumentsList[0].rangeValues ?? [];
            if (!argumentsList[0].rangeValues) {
                throw new Error(PARSE_ERROR);
            }
            const matchingIndexes: number[] = criteriaRange.map((value: FormulaValue, index: number) =>
                this.matchesCriteria(value, argumentsList[1].value) ? index : -1).filter((index: number) => index >= 0);
            if (name === 'COUNTIF') {
                return matchingIndexes.length;
            }
            const sumRange: FormulaValue[] = argumentsList[2]?.rangeValues ?? criteriaRange;
            if (sumRange.length !== criteriaRange.length) {
                throw new Error(INVALID_REFERENCE);
            }
            return matchingIndexes.reduce<number>((total: number, index: number) => total + toNumber(sumRange[index as number]), 0);
        }
        if (name === 'RAND' || name === 'RANDOM' || name === 'RAN') {
            requireCount(0, 0);
            return Math.random();
        }
        if (name === 'TODAY' || name === 'NOW') {
            requireCount(0, 0);
            return new Date();
        }
        if (name === 'MOD') {
            requireCount(2, 2);
            return toNumber(values[0]) % toNumber(values[1]);
        }
        if (name === 'POWER') {
            requireCount(2, 2);
            return Math.pow(toNumber(values[0]), toNumber(values[1]));
        }
        if (name === 'SQRT') {
            requireCount(1, 1);
            return Math.sqrt(toNumber(values[0]));
        }
        const numericValues: number[] = requireNumeric();
        if (name === 'AVERAGE') {
            requireCount(1);
            return numericValues.reduce<number>((total: number, value: number) => total + value, 0) / numericValues.length;
        }
        if (name === 'MIN') {
            requireCount(1);
            return Math.min(...numericValues);
        }
        requireCount(1);
        return Math.max(...numericValues);
    }

    private parseValueArguments(): FormulaArgument[] {
        const values: FormulaArgument[] = [];
        if (this.matchType('rightParen')) {
            return values;
        }
        do {
            const rangeArgument: FormulaArgument | undefined = this.parseRangeArgument();
            if (rangeArgument) {
                values.push(rangeArgument);
            } else {
                values.push({ value: this.parseFunctionArgument() });
            }
        } while (this.matchType('comma'));
        if (!this.matchType('rightParen')) {
            throw new Error(PARSE_ERROR);
        }
        return values;
    }

    private parseRangeArgument(): FormulaArgument | undefined {
        if (this.peek()?.type !== 'identifier' || this.peek(1)?.type !== 'colon' || this.peek(2)?.type !== 'identifier') {
            return undefined;
        }
        const startReference: string = this.consume().value;
        this.consume();
        const endReference: string = this.consume().value;
        const rangeValues: FormulaValue[] = this.context.getRangeValues(startReference, endReference);
        if (rangeValues.some((value: FormulaValue) => isFormulaError(value))) {
            const errorValue: FormulaValue | undefined = rangeValues.find((value: FormulaValue) => isFormulaError(value));
            throw new Error(errorValue ?? INVALID_REFERENCE);
        }
        return { value: rangeValues[0], rangeValues };
    }

    private flattenArguments(argumentsList: FormulaArgument[]): FormulaValue[] {
        return argumentsList.reduce<FormulaValue[]>((values: FormulaValue[], argument: FormulaArgument) =>
            values.concat(argument.rangeValues ?? [argument.value]), []);
    }

    private matchesCriteria(value: FormulaValue, criteria: FormulaValue): boolean {
        if (isFormulaError(value) || isFormulaError(criteria)) {
            throw new Error(PARSE_ERROR);
        }
        const criteriaText: string = String(criteria);
        const match: RegExpMatchArray | null = criteriaText.match(/^(<=|>=|<>|=|<|>)(.*)$/);
        if (!match) {
            return String(value) === criteriaText;
        }
        const leftNumber: number = Number(value);
        const rightNumber: number = Number(match[2]);
        if (Number.isNaN(leftNumber) || Number.isNaN(rightNumber)) {
            return match[1] === '=' ? String(value) === match[2] : match[1] === '<>' && String(value) !== match[2];
        }
        if (match[1] === '=') { return leftNumber === rightNumber; }
        if (match[1] === '<>') { return leftNumber !== rightNumber; }
        if (match[1] === '<') { return leftNumber < rightNumber; }
        if (match[1] === '<=') { return leftNumber <= rightNumber; }
        if (match[1] === '>') { return leftNumber > rightNumber; }
        return leftNumber >= rightNumber;
    }

    private parseFunctionArgument(): FormulaValue {
        return this.parseComparison();
    }

    private parseReference(reference: string): FormulaValue {
        const match: RegExpMatchArray | null = reference.toUpperCase().match(/^\$?([A-Z]+)\$?(\d+)$/);
        if (!match) {
            throw new Error(PARSE_ERROR);
        }
        const columnIndex: number = letterToColumnIndex(match[1]);
        return this.resolveReference(Number(match[2]), columnIndex);
    }

    private resolveReference(rowReference: FormulaValue, fieldOrColumn: string | number): FormulaValue {
        const rowIndex: number = this.context.resolveRowIndex(rowReference);
        const field: string | undefined = typeof fieldOrColumn === 'number'
            ? this.context.columns[fieldOrColumn as number]?.field
            : fieldOrColumn;
        if (!field || rowIndex < 0 || rowIndex >= this.context.rows.length) {
            throw new Error(INVALID_REFERENCE);
        }
        const column: ColumnProps<T> | undefined = this.context.columns.find((item: ColumnProps<T>) => item.field === field);
        if (!column || !column.allowFormula && typeof this.context.rows[rowIndex as number]?.[field as keyof T] === 'string' &&
            String(this.context.rows[rowIndex as number]?.[field as keyof T]).startsWith('=')) {
            throw new Error(INVALID_REFERENCE);
        }
        // const rowKey: string | number = this.context.rowKeys.get(rowIndex) ?? rowIndex;
        const reference: string = `${columnIndexToLetter(this.context.columns.indexOf(column))}${rowIndex + 1}`;
        if (!this.references.includes(reference)) {
            this.references.push(reference);
        }
        return this.context.evaluateCell(rowIndex, field);
        // return this.context.evaluateCell(rowIndex, field, new Set<string>([`${rowKey}:${field}`]));
    }

    private matchOperator(...operators: string[]): boolean {
        return this.peek()?.type === 'operator' && operators.includes(this.peek()?.value) ? (this.position += 1, true) : false;
    }

    private matchType(type: FormulaToken['type']): boolean {
        return this.peek()?.type === type ? (this.position += 1, true) : false;
    }

    private previous(): FormulaToken {
        return this.tokens[this.position - 1];
    }

    private peek(offset: number = 0): FormulaToken | undefined {
        return this.tokens[this.position + offset];
    }

    private consume(): FormulaToken {
        const token: FormulaToken | undefined = this.peek();
        if (!token) {
            throw new Error(PARSE_ERROR);
        }
        this.position += 1;
        return token;
    }
}

class FormulaController<T> implements FormulaModuleResult<T> {
    private readonly originalColumns: ColumnProps<T>[];
    private readonly columns: ColumnProps<T>[];
    private readonly referenceColumns: ColumnProps<T>[];
    private readonly rows: T[];
    private readonly formulaSettings: FormulaSettings;
    private readonly projections: Map<string, FormulaProjection> = new Map<string, FormulaProjection>();
    private readonly evaluating: Set<string> = new Set<string>();
    private readonly evaluationStack: Set<string> = new Set<string>();
    private readonly rowKeys: Map<number, string | number> = new Map<number, string | number>();
    private readonly rowIndexesByKey: Map<string, number> = new Map<string, number>();
    private readonly visibleRowKeys: Array<string | number> = [];
    private readonly visibleRowIndexesByKey: Map<string, number> = new Map<string, number>();
    private readonly primaryKeyField: string | undefined;
    private readonly customFunctions: Map<string, CustomFormulaFunction> = new Map<string, CustomFormulaFunction>();

    public constructor(columns: ColumnProps<T>[], currentViewData: (GroupedData<T> | T)[], formulaSettings: FormulaSettings,
                       _gridProps: Partial<IGridBase<T>>, dataSource?: unknown) {
        this.originalColumns = columns;
        this.referenceColumns = columns.filter((column: ColumnProps<T>) => !!column.field && getWithoutSpecialColumns([column]).length);
        this.columns = this.referenceColumns.filter((column: ColumnProps<T>) => column.visible !== false);
        this.primaryKeyField = columns.find((column: ColumnProps<T>) => column.isPrimaryKey)?.field;
        const sourceRows: T[] = this.getSourceRows(currentViewData, dataSource ?? _gridProps.dataSource);
        this.rows = sourceRows.filter((row: T): row is T => !(row as GroupedData<T>).flattedKey);
        this.formulaSettings = formulaSettings;
        Object.entries(formulaSettings.customFunctions ?? {}).forEach(([name, handler]: [string, CustomFormulaFunction]) => {
            this.customFunctions.set(name.toUpperCase(), handler);
        });
        this.rows.forEach((row: T, rowIndex: number) => {
            const rowKey: unknown = this.primaryKeyField ? row[this.primaryKeyField as keyof T] : undefined;
            if (typeof rowKey === 'string' || typeof rowKey === 'number') {
                this.rowKeys.set(rowIndex, rowKey);
                this.rowIndexesByKey.set(String(rowKey), rowIndex);
            }
        });
        currentViewData.forEach((row: GroupedData<T> | T) => {
            if ((row as GroupedData<T>).flattedKey || !this.primaryKeyField) {
                return;
            }
            const rowKey: unknown = (row as T)[this.primaryKeyField as keyof T];
            if (typeof rowKey === 'string' || typeof rowKey === 'number') {
                this.visibleRowIndexesByKey.set(String(rowKey), this.visibleRowKeys.length);
                this.visibleRowKeys.push(rowKey);
            }
        });
        this.recalculate('initial');
    }

    public getProjection(rowKey: string | number, field: string): FormulaProjection | undefined {
        return this.projections.get(this.getCacheKey(rowKey, field)) ??
            Array.from(this.projections.values()).find((projection: FormulaProjection) =>
                String(projection.identity.rowKey) === String(rowKey) && projection.identity.field === field);
    }

    public getRawFormula(rowKey: string | number, field: string): string | undefined {
        return this.getProjection(rowKey, field)?.formula;
    }

    public recalculate(_reason: string): void {
        this.projections.clear();
        if (!this.formulaSettings.enabled || !this.primaryKeyField) {
            return;
        }
        this.rows.forEach((row: T, rowIndex: number) => {
            this.columns.filter((column: ColumnProps<T>) => column.allowFormula && column.field).forEach((column: ColumnProps<T>) => {
                const rawValue: unknown = row[column.field as keyof T];
                if (typeof rawValue === 'string' && rawValue.trim().startsWith('=')) {
                    this.evaluateFormula(rowIndex, column.field as string, rawValue);
                }
            });
        });
    }

    public setFormula(rowKey: string | number, field: string, formula: string): void {
        const rowIndex: number = this.findRowIndex(rowKey);
        const row: T | undefined = this.rows[rowIndex as number];
        if (row && field) {
            const mutableRow: Record<string, unknown> = row as unknown as Record<string, unknown>;
            mutableRow[field as string] = formula;
            this.recalculate('edit');
        }
    }

    public clearFormula(rowKey: string | number, field: string): void {
        this.projections.delete(this.getCacheKey(rowKey, field));
    }

    public getDisplayReference(column: ColumnProps<T>, rowIndex: number): string {
        const columnIndex: number = this.referenceColumns.findIndex((item: ColumnProps<T>) => item.field === column.field);
        return `${columnIndexToLetter(columnIndex)}${rowIndex + 1}`;
    }

    public getRowIndex(rowReference: string | number): number | undefined {
        return this.rowIndexesByKey.has(String(rowReference)) ? this.visibleRowIndexesByKey.get(String(rowReference)) : undefined;
    }

    public toDisplayFormula(formula: string, _rowIndex: number): string {
        const displayFormula: string = formula.replace(/REF\(COLUMN\(["']([^"']+)["']\),ROW\((\d+)\)\)/gi,
                                                       (_match: string, field: string, referenceRow: string): string => {
                                                           const column: ColumnProps<T> | undefined = this.referenceColumns.find(
                                                               (item: ColumnProps<T>) => item.field === field
                                                           );
                                                           return column
                                                               ? `${columnIndexToLetter(this.referenceColumns.indexOf(column))}${referenceRow}`
                                                               : _match;
                                                       });
        return displayFormula.replace(/(\$?)([A-Z]+)(\$?)(\d+)/gi,
                                      (
                                          match: string,
                                          columnAbsolute: string,
                                          letters: string,
                                          rowAbsolute: string,
                                          row: string
                                      ): string => {
                                          const visibleRowIndex: number | undefined = this.getRowIndex(Number(row));
                                          return visibleRowIndex === undefined
                                              ? match
                                              : `${columnAbsolute}${letters}${rowAbsolute}${visibleRowIndex + 1}`;
                                      });
    }

    public toInternalFormula(formula: string, _rowIndex: number): string {
        // eslint-disable-next-line security/detect-unsafe-regex
        return formula.replace(/\$?([A-Z]+)\$?(\d+)(\s*:\s*\$?[A-Z]+\$?\d+)?/gi,
                               (match: string, letters: string, row: string, rangeEnd: string | undefined): string => {
                                   if (rangeEnd) {
                                       return match;
                                   }
                                   const column: ColumnProps<T> | undefined = this.referenceColumns[letterToColumnIndex(letters)];
                                   return column?.field ? `REF(COLUMN("${column.field}"),ROW(${row}))` : match;
                               });
    }

    public parseReference(reference: string): ParsedFormulaReference {
        const match: RegExpMatchArray | null = reference.trim().toUpperCase().match(/^(\$?)([A-Z]+)(\$?)(\d+)$/);
        if (!match || Number(match[4]) < 1) {
            throw new Error(INVALID_REFERENCE);
        }
        return {
            col: letterToColumnIndex(match[2]),
            row: Number(match[4]) - 1,
            isAbsolute: { col: match[1] === '$', row: match[3] === '$' }
        };
    }

    public getActualColIndex(colIndex: number): number {
        const column: ColumnProps<T> = this.referenceColumns[colIndex as number];
        return this.originalColumns.findIndex((col: ColumnProps<T>) => col.uid === column.uid);
    }

    public convertIndexToReference(columnIndex: number, rowIndex: number): string {
        if (columnIndex < 0 || rowIndex < 0) {
            throw new Error(INVALID_REFERENCE);
        }
        return `${columnIndexToLetter(columnIndex)}${rowIndex + 1}`;
    }

    public adjustReferences(formula: string, rowOffset: number, columnOffset: number): string {
        return formula.replace(/(\$?)([A-Z]+)(\$?)(\d+)/gi,
                               (match: string, columnAbsolute: string, letters: string, rowAbsolute: string, row: string): string => {
                                   const parsed: ParsedFormulaReference = this.parseReference(`${columnAbsolute}${letters}${rowAbsolute}${row}`);
                                   const nextColumn: number = parsed.isAbsolute.col ? parsed.col : parsed.col + columnOffset;
                                   const nextRow: number = parsed.isAbsolute.row ? parsed.row : parsed.row + rowOffset;
                                   if (nextColumn < 0 || nextRow < 0) {
                                       return match;
                                   }
                                   return `${parsed.isAbsolute.col ? '$' : ''}${columnIndexToLetter(nextColumn)}${parsed.isAbsolute.row ? '$' : ''}${nextRow + 1}`;
                               });
    }

    public tokenizeFormula(formula: string): PublicFormulaToken[] {
        return tokenize(formula).map((token: FormulaToken, position: number): PublicFormulaToken => ({
            type: token.type === 'leftParen' || token.type === 'rightParen' || token.type === 'comma' || token.type === 'colon' ? 'delimiter' :
                token.type === 'identifier' ? (/^\$?[A-Z]+\$?\d+$/i.test(token.value) ? 'reference' : 'function') : token.type,
            value: token.type === 'number' ? Number(token.value) : token.value,
            position
        }));
    }

    public extractReferences(formula: string): FormulaReferenceHighlight[] {
        const highlights: FormulaReferenceHighlight[] = [];
        // Formula references are intentionally restricted to spreadsheet cell syntax.
        // eslint-disable-next-line security/detect-unsafe-regex
        const referencePattern: RegExp = /\$?[A-Z]+\$?\d+(?::\$?[A-Z]+\$?\d+)?/gi;
        let match: RegExpExecArray | null = referencePattern.exec(formula);
        const colors: Map<string, number> = new Map<string, number>();
        while (match) {
            const reference: string = match[0].toUpperCase();
            if (!colors.has(reference)) {
                colors.set(reference, colors.size % 7 + 1);
            }
            highlights.push({ reference: match[0], start: match.index, end: match.index + match[0].length,
                colorIndex: colors.get(reference) as number });
            match = referencePattern.exec(formula);
        }
        return highlights;
    }

    public insertReference(formula: string, reference: string, caretPosition: number): { formula: string; caretPosition: number } {
        const safeCaret: number = Math.max(0, Math.min(caretPosition, formula.length));
        const referencePattern: RegExp = /\$?[A-Z]+\$?\d+/gi;
        let tokenMatch: RegExpExecArray | null = referencePattern.exec(formula);
        while (tokenMatch) {
            const tokenStart: number = tokenMatch.index;
            const tokenEnd: number = tokenStart + tokenMatch[0].length;
            if (safeCaret >= tokenStart && safeCaret <= tokenEnd) {
                return {
                    formula: formula.slice(0, tokenStart) + reference + formula.slice(tokenEnd),
                    caretPosition: tokenStart + reference.length
                };
            }
            tokenMatch = referencePattern.exec(formula);
        }
        const before: string = formula.slice(0, safeCaret);
        return { formula: before + reference + formula.slice(safeCaret), caretPosition: safeCaret + reference.length };
    }

    public getFormulas(): FormulaDefinition[] {
        return Array.from(this.projections.values()).map((projection: FormulaProjection): FormulaDefinition => ({
            identity: projection.identity,
            formula: projection.formula,
            value: projection.value
        }));
    }

    public hasFormula(rowKey: string | number, field: string): boolean {
        return this.projections.has(this.getCacheKey(rowKey, field));
    }

    public addFormula(name: string, handler: CustomFormulaFunction): void {
        this.customFunctions.set(name.toUpperCase(), handler);
    }

    public removeFormula(name: string): void {
        this.customFunctions.delete(name.toUpperCase());
    }

    public getModuleName(): string {
        return 'formula';
    }

    public registerCustomFunction(name: string, handler: CustomFormulaFunction): void {
        this.customFunctions.set(name.toUpperCase(), handler);
    }

    public getCustomFunction(name: string): CustomFormulaFunction | undefined {
        return this.customFunctions.get(name.toUpperCase());
    }

    public isCustomFunction(name: string): boolean {
        return this.customFunctions.has(name.toUpperCase());
    }

    public destroy(): void {
        this.projections.clear();
        this.evaluating.clear();
        this.customFunctions.clear();
    }

    public addEventListener(): void {
        // React owns listener registration for FormulaEditor; retained for API parity.
    }

    public removeEventListener(): void {
        // React owns listener cleanup for FormulaEditor; retained for API parity.
    }

    public setCellFormula(rowKey: string | number, field: string, formula: string | undefined): void {
        if (formula === undefined || formula.trim() === '') {
            this.clearFormula(rowKey, field);
            return;
        }
        this.setFormula(rowKey, field, formula);
    }

    public getCellFormula(rowKey: string | number, field: string): string | undefined {
        return this.getRawFormula(rowKey, field);
    }

    public getFormulaValue(rowKey: string | number, field: string): FormulaValue | undefined {
        return this.getProjection(rowKey, field)?.value;
    }

    public getCellValue(reference: string): FormulaValue | undefined {
        const parsed: ParsedFormulaReference = this.parseReference(reference);
        const column: ColumnProps<T> | undefined = this.columns[parsed.col];
        const rowIndex: number = this.resolveRowIndex(parsed.row + 1);
        const rowKey: string | number | undefined = this.rowKeys.get(rowIndex);
        if (!column || rowKey === undefined) {
            return undefined;
        }
        const formulaValue: FormulaValue | undefined = this.getFormulaValue(rowKey, column.field as string);
        return formulaValue ?? this.rows[rowIndex as number]?.[column.field as keyof T] as FormulaValue;
    }

    public getRangeValues(startReference: string, endReference: string): FormulaValue[] {
        const start: ParsedFormulaReference = this.parseReference(startReference);
        const end: ParsedFormulaReference = this.parseReference(endReference);
        const values: FormulaValue[] = [];
        for (let rowIndex: number = Math.min(start.row, end.row); rowIndex <= Math.max(start.row, end.row); rowIndex++) {
            for (let columnIndex: number = Math.min(start.col, end.col); columnIndex <= Math.max(start.col, end.col); columnIndex++) {
                values.push(this.getCellValue(this.convertIndexToReference(columnIndex, rowIndex)) ?? INVALID_REFERENCE);
            }
        }
        return values;
    }

    private evaluateFormula(rowIndex: number, field: string, formula: string): FormulaProjection {
        const rowKey: string | number | undefined = this.rowKeys.get(rowIndex);
        const identity: FormulaCellIdentity = { rowKey: rowKey ?? rowIndex, field };
        const cacheKey: string = this.getCacheKey(identity.rowKey, field);
        const dependencyKey: string = `${String(identity.rowKey)}:${field}`;
        const references: string[] = [];
        let value: FormulaValue;
        if (this.evaluationStack.has(dependencyKey)) {
            const circularProjection: FormulaProjection = { identity, formula, value: CIRCULAR_REFERENCE, references };
            this.projections.set(cacheKey, circularProjection);
            return circularProjection;
        }
        if (this.evaluating.has(cacheKey)) {
            const circularProjection: FormulaProjection = { identity, formula, value: CIRCULAR_REFERENCE, references };
            this.projections.set(cacheKey, circularProjection);
            return circularProjection;
        }
        this.evaluating.add(cacheKey);
        this.evaluationStack.add(dependencyKey);
        try {
            const context: FormulaContext<T> = {
                rowKey: identity.rowKey,
                currentRowIndex: rowIndex,
                columns: this.columns,
                rows: this.rows,
                rowKeys: this.rowKeys,
                resolveRowIndex: (rowReference: FormulaValue): number => this.resolveRowIndex(rowReference),
                evaluateCell: (targetRowIndex: number, targetField: string): FormulaValue => {
                    const targetValue: unknown = this.rows[targetRowIndex as number]?.[targetField as keyof T];
                    if (typeof targetValue === 'string' && targetValue.trim().startsWith('=')) {
                        return this.evaluateFormula(targetRowIndex, targetField, targetValue).value;
                    }
                    return targetValue as FormulaValue;
                },
                getRangeValues: (startReference: string, endReference: string): FormulaValue[] =>
                    this.getRangeValues(startReference, endReference),
                customFunctions: Object.fromEntries(this.customFunctions.entries())
            };
            value = new FormulaParser(formula, context, references).parse();
        } catch (error) {
            const errorCode: string = error instanceof Error ? error.message : String(error);
            value = errorCode === INVALID_REFERENCE || errorCode === CIRCULAR_REFERENCE || errorCode === NAME_ERROR
                ? errorCode
                : PARSE_ERROR;
        } finally {
            this.evaluating.delete(cacheKey);
            this.evaluationStack.delete(dependencyKey);
        }
        const projection: FormulaProjection = { identity, formula, value, references };
        this.projections.set(cacheKey, projection);
        return projection;
    }

    private findRowIndex(rowKey: string | number): number {
        return this.rowIndexesByKey.get(String(rowKey)) ?? -1;
    }

    private resolveRowIndex(rowReference: FormulaValue): number {
        const keyedRowIndex: number | undefined = (typeof rowReference === 'string' || typeof rowReference === 'number')
            ? this.rowIndexesByKey.get(String(rowReference)) : undefined;
        if (keyedRowIndex !== undefined) {
            return keyedRowIndex;
        }
        if (typeof rowReference === 'number' && Number.isInteger(rowReference) && rowReference > 0) {
            return rowReference - 1;
        }
        throw new Error(INVALID_REFERENCE);
    }

    private getSourceRows(currentViewData: (GroupedData<T> | T)[], dataSource: unknown): T[] {
        const rows: T[] = currentViewData.filter((row: GroupedData<T> | T): row is T => !(row as GroupedData<T>).flattedKey);
        const sourceRows: unknown = dataSource && typeof dataSource === 'object' && 'dataSource' in dataSource
            ? (dataSource as { dataSource?: { json?: unknown[] } }).dataSource?.json
            : undefined;
        if (!Array.isArray(sourceRows)) {
            return rows;
        }
        const existingKeys: Set<unknown> = new Set(rows.map((row: T) => this.primaryKeyField ? row[this.primaryKeyField as keyof T] : row));
        return rows.concat(sourceRows.filter((row: unknown): row is T => !existingKeys.has(this.primaryKeyField ?
            (row as T)[this.primaryKeyField as keyof T] : row)));
    }

    private getCacheKey(rowKey: string | number, field: string): string {
        return `${String(rowKey)}:${field}`;
    }
}

/**
 * Creates the injectable FormulaModule used by the Grid.
 *
 * @template T Grid data type.
 * @param {RefObject<GridRef<T>>} _gridRef - Grid reference provider.
 * @param {ServiceLocator} _serviceLocator - Grid service locator.
 * @param {ColumnProps<T>[]} columns - Formula column definitions.
 * @param {(GroupedData<T> | T)[]} currentViewData - Current grid data.
 * @param {UseDataResult<T>} _dataOperations - Grid data operations.
 * @param {FormulaSettings} formulaSettings - Formula processing settings.
 * @param {Dispatch<SetStateAction<Object>>} _setGridAction - Grid action dispatcher.
 * @param {VirtualSettings} _virtualSettings - Virtualization settings.
 * @param {Partial<IGridBase<T>>} gridProps - Grid properties.
 * @returns {FormulaModuleResult<T>} Formula module controller.
 */
export const FormulaModule: FormulaModuleType = <T>(
    _gridRef: RefObject<GridRef<T>>,
    _serviceLocator: ServiceLocator,
    columns: ColumnProps<T>[],
    currentViewData: (GroupedData<T> | T)[],
    _dataOperations: UseDataResult<T>,
    formulaSettings: FormulaSettings,
    _setGridAction: Dispatch<SetStateAction<Object>>,
    _virtualSettings: VirtualSettings,
    gridProps: Partial<IGridBase<T>>
): FormulaModuleResult<T> => {
    const controller: FormulaController<T> = useMemo(
        () => new FormulaController(columns, currentViewData, formulaSettings, gridProps, _dataOperations.dataManager),
        [columns, currentViewData, formulaSettings, gridProps, _dataOperations.dataManager]
    );
    useEffect(() => {
        controller.recalculate('data-change');
    }, [controller, currentViewData, columns, formulaSettings, gridProps.editSettings]);
    return controller;
};
