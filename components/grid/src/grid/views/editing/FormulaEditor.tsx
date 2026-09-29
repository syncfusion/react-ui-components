import * as React from 'react';
import { useEffect, useRef } from 'react';
import { FormulaReferenceHighlight, FormulaModuleResult, ParsedFormulaReference } from '../../types/formula.interfaces';
import { ColumnProps } from '../../types/column.interfaces';
import { useGridComputedProvider, useGridMutableProvider } from '../../contexts/GridProviders';

interface FormulaEditorProps {
    value: string;
    columns: ColumnProps[];
    formulaModule: FormulaModuleResult;
    rowIndex: number;
    onChange: (value: string) => void;
    onBlur: (value: string) => void;
}

interface FormulaSelection {
    start: number;
    end: number;
}

/**
 * Formula-aware contenteditable editor with token coloring and cell-reference insertion.
 *
 * @param {FormulaEditorProps} props - Formula editor properties.
 * @returns {React.ReactElement} Formula editor contenteditable element.
 */
export const FormulaEditor: React.FC<FormulaEditorProps> = (props: FormulaEditorProps): React.ReactElement => {
    const { value, columns, formulaModule, rowIndex, onChange, onBlur }: FormulaEditorProps = props;
    const editorRef: React.MutableRefObject<HTMLSpanElement | null> = useRef<HTMLSpanElement>(null);
    const caretRef: React.MutableRefObject<number> = useRef<number>(value.length);
    const selectionRef: React.MutableRefObject<FormulaSelection> = useRef<FormulaSelection>({ start: value.length, end: value.length });
    const hasRenderedRef: React.MutableRefObject<boolean> = useRef<boolean>(false);
    const hasUserSelectionRef: React.MutableRefObject<boolean> = useRef<boolean>(false);
    const { element } = useGridComputedProvider();
    const { currentViewData } = useGridMutableProvider();
    const toDisplayFormula: (formula: string) => string = (formula: string): string => formulaModule.toDisplayFormula(formula, rowIndex);
    const toInternalFormula: (formula: string) => string = (formula: string): string => formulaModule.toInternalFormula(formula, rowIndex);

    const setSelection: (start: number, end?: number) => void = (start: number, end: number = start): void => {
        const editor: HTMLSpanElement | null = editorRef.current;
        if (!editor) {
            return;
        }
        const selection: Selection | null = window.getSelection();
        const range: Range = document.createRange();
        const walker: NodeIterator = document.createNodeIterator(editor, NodeFilter.SHOW_TEXT);
        let node: Node | null = walker.nextNode();
        let currentOffset: number = 0;
        let startNode: Node | null = null;
        let endNode: Node | null = null;
        let startOffset: number = 0;
        let endOffset: number = 0;
        while (node) {
            const nodeLength: number = node.textContent?.length;
            if (!startNode && start <= currentOffset + nodeLength) {
                startNode = node;
                startOffset = Math.max(0, start - currentOffset);
            }
            if (!endNode && end <= currentOffset + nodeLength) {
                endNode = node;
                endOffset = Math.max(0, end - currentOffset);
                break;
            }
            currentOffset += nodeLength;
            node = walker.nextNode();
        }
        if (!startNode || !endNode) {
            range.selectNodeContents(editor);
            range.collapse(false);
        } else {
            range.setStart(startNode, startOffset);
            range.setEnd(endNode, endOffset);
        }
        selection?.removeAllRanges();
        selection?.addRange(range);
    };

    const getSelection: () => FormulaSelection = (): FormulaSelection => {
        const selection: Selection | null = window.getSelection();
        if (!selection || selection.rangeCount === 0 || !editorRef.current?.contains(selection.anchorNode)) {
            return selectionRef.current;
        }
        const getOffset: (node: Node, offset: number) => number = (node: Node, offset: number): number => {
            const range: Range = document.createRange();
            range.selectNodeContents(editorRef.current as HTMLSpanElement);
            range.setEnd(node, offset);
            return range.toString().length;
        };
        const nextSelection: FormulaSelection = {
            start: getOffset(selection.anchorNode as Node, selection.anchorOffset),
            end: getOffset(selection.focusNode as Node, selection.focusOffset)
        };
        hasUserSelectionRef.current = true;
        selectionRef.current = nextSelection;
        caretRef.current = nextSelection.end;
        return nextSelection;
    };

    const getCaret: () => number = (): number => getSelection().end;

    const renderFormula: (formula: string, selection?: FormulaSelection) => void = (
        formula: string,
        selection?: FormulaSelection
    ): void => {
        const editor: HTMLSpanElement | null = editorRef.current;
        if (!editor) {
            return;
        }
        const highlights: FormulaReferenceHighlight[] = formulaModule.extractReferences(formula);
        editor.replaceChildren();
        let lastIndex: number = 0;
        highlights.forEach((highlight: FormulaReferenceHighlight) => {
            if (highlight.start > lastIndex) {
                editor.appendChild(document.createTextNode(formula.slice(lastIndex, highlight.start)));
            }
            const token: HTMLSpanElement = document.createElement('span');
            token.className = `sf-formula-token sf-formula-token-${highlight.colorIndex}`;
            token.dataset.reference = highlight.reference;
            token.textContent = highlight.reference;
            editor.appendChild(token);
            lastIndex = highlight.end;
        });
        if (lastIndex < formula.length) {
            editor.appendChild(document.createTextNode(formula.slice(lastIndex)));
        }
        if (selection) {
            selectionRef.current = selection;
            caretRef.current = selection.end;
            setSelection(selection.start, selection.end);
        }
    };

    const clearReferencedCellHighlights: () => void = (): void => {
        const gridElement: HTMLElement | null = element ?? null;
        gridElement?.querySelectorAll('[class*="sf-formula-reference-"]').forEach((cell: Element) => {
            cell.className = cell.className.replace(/\s*sf-formula-reference-\d+/g, '');
        });
    };

    const updateReferencedCellHighlights: (formula: string) => void = (formula: string): void => {
        const gridElement: HTMLElement | null = element ?? null;
        if (!gridElement) {
            return;
        }
        formulaModule.extractReferences(formula).forEach((highlight: FormulaReferenceHighlight) => {
            const endpoints: string[] = highlight.reference.split(':');
            try {
                const start: ParsedFormulaReference = formulaModule.parseReference(endpoints[0]);
                const end: ParsedFormulaReference = formulaModule.parseReference(endpoints[1] ?? endpoints[0]);
                start.col = formulaModule.getActualColIndex(start.col);
                end.col = formulaModule.getActualColIndex(end.col);
                for (let rowIndex: number = Math.min(start.row, end.row); rowIndex <= Math.max(start.row, end.row);
                    rowIndex += 1) {
                    for (let columnIndex: number = Math.min(start.col, end.col); columnIndex <= Math.max(start.col, end.col);
                        columnIndex += 1) {
                        const row: Element = gridElement.querySelector(`.sf-grid-content-row[aria-rowindex="${rowIndex + 1}"]`);
                        const cell: HTMLTableCellElement = row?.querySelector(`td[aria-colindex="${columnIndex + 1}"]`);
                        if (cell) {
                            cell.classList.add(`sf-formula-reference-${highlight.colorIndex}`);
                        }
                    }
                }
            } catch (_error) {
                return;
            }
        });
    };

    useEffect(() => {
        const displayFormula: string = toDisplayFormula(value);
        if (editorRef.current?.textContent !== displayFormula) {
            const selection: FormulaSelection = hasRenderedRef.current && hasUserSelectionRef.current ? selectionRef.current :
                { start: displayFormula.length, end: displayFormula.length };
            renderFormula(displayFormula, selection);
        }
        hasRenderedRef.current = true;
        updateReferencedCellHighlights(displayFormula);
        return () => {
            clearReferencedCellHighlights();
            editorRef.current?.replaceChildren();
        };
    }, [value, element, formulaModule, rowIndex]);

    useEffect(() => {
        const gridElement: HTMLElement | null = element ?? null;
        if (!gridElement) {
            return undefined;
        }
        const onGridMouseDown: (event: MouseEvent) => void = (event: MouseEvent): void => {
            const target: HTMLElement | null = (event.target as HTMLElement).closest('td[aria-colindex]');
            if (!target || !editorRef.current) {
                return;
            }
            const colIndex: number = Number(target.getAttribute('aria-colindex')) - 1;
            const clickedRowIndex: number = Number(target.parentElement?.getAttribute('aria-rowindex')) - 1;
            const column: ColumnProps | undefined = columns[colIndex as number];
            if (!column || clickedRowIndex < 0 || clickedRowIndex >= currentViewData.length) {
                return;
            }
            event.preventDefault();
            const reference: string = formulaModule.getDisplayReference(column, clickedRowIndex);
            const inserted: { formula: string; caretPosition: number } = formulaModule.insertReference(editorRef.current.textContent,
                                                                                                       reference, getCaret());
            onChange(toInternalFormula(inserted.formula));
            const nextSelection: FormulaSelection = { start: inserted.caretPosition, end: inserted.caretPosition };
            renderFormula(inserted.formula, nextSelection);
            updateReferencedCellHighlights(inserted.formula);
        };
        gridElement.addEventListener('mousedown', onGridMouseDown);
        return () => gridElement.removeEventListener('mousedown', onGridMouseDown);
    }, [element, columns, currentViewData, formulaModule, onChange]);

    return (
        <span
            ref={editorRef}
            contentEditable
            role="textbox"
            aria-label="Formula editor"
            data-testid="formula-editor"
            className="sf-formula-editor sf-input"
            onInput={(event: React.FormEvent<HTMLSpanElement>) => {
                const formula: string = event.currentTarget.textContent;
                const selection: FormulaSelection = getSelection();
                onChange(toInternalFormula(formula));
                renderFormula(formula, selection);
                updateReferencedCellHighlights(formula);
            }}
            onBlur={(event: React.FocusEvent<HTMLSpanElement>) => {
                clearReferencedCellHighlights();
                onBlur(toInternalFormula(event.currentTarget.textContent));
            }}
            onKeyDown={(event: React.KeyboardEvent<HTMLSpanElement>) => {
                if (event.key === 'Delete') {
                    event.stopPropagation();
                }
            }}
            onClick={() => getSelection()}
            suppressContentEditableWarning
        />
    );
};
