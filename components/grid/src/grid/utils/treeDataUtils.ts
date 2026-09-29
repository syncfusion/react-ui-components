/**
 * TreeGrid Data Normalization Utilities.
 * Implements two-mode data transformation: nested children and self-referential parent IDs.
 * Both modes produce identical flat array output with tree metadata.
 */

import { isNullOrUndefined } from '@syncfusion/react-base';
import { TreeGridRow } from '../types/treeData.interfaces';

/**
 * Normalized row with tree metadata.
 * @private
 */
export interface NormalizedTreeRow extends TreeGridRow {
    /** Depth level (0 = root). */
    treeLevel: number;
    /** Unique tree node identifier (e.g., '0', '0_0', '0_0_1'). */
    treeKey: string;
    /** Parent node's treeKey (null for root nodes). */
    treeParentKey: string | null;
    /** True if node has children. */
    isTreeParent: boolean;
    /** Initially true; managed by expansion state. */
    isTreeExpanded: boolean;
    /** Sequential position in flattened output array. */
    index: number;
    /** Original data preserved. */
    [key: string]: unknown;
}

/**
 * Mode 1: Normalize nested children array data.
 *
 * Recursively traverses a hierarchical data structure where children are nested
 * within parent objects via a specified field name. Produces flat array with
 * tree metadata (treeLevel, treeKey, treeParentKey, isTreeParent, index).
 *
 * @template T - Data row type.
 * @param {T[]} data - Root-level array of data rows (may contain children).
 * @param {TreeGridRow[]} parentTreeData - Parent rows for the current tree.
 * @param {TreeGridRow[]} flatTreeData - Flattened output rows for the current tree.
 * @param {Object.<string, TreeGridRow>} treeKeyCollection - Collection to store tree keys for quick lookup.
 * @param {string} childrenField - Field name containing children array.
 * @param {string | null} [parentKey] - Optional parent treeKey for recursion.
 * @param {number} [level=0] - Optional depth level for recursion.
 * @returns {NormalizedTreeRow[]} Flat array with normalized tree metadata.
 */
export function normalizeChildrenFieldData<T extends Record<string, unknown> = Record<string, unknown>>(
    data: T[],
    parentTreeData: TreeGridRow[],
    flatTreeData: TreeGridRow[],
    treeKeyCollection: { [key: string]: TreeGridRow },
    childrenField: string,
    parentKey?: string | null,
    level: number = 0
): NormalizedTreeRow[] {
    const result: NormalizedTreeRow[] = [];
    let outputIndex: number = 0;

    data.forEach((item: T, childIndex: number) => {
        const treeKey: string = parentKey !== undefined && parentKey !== null
            ? `${parentKey}_${childIndex}`
            : `${childIndex}`;

        const itemRecord: Record<string, unknown> = item as Record<string, unknown>;
        // eslint-disable-next-line security/detect-object-injection
        const children: T[] | undefined = itemRecord[childrenField] as T[] | undefined;
        const hasChildren: boolean = Array.isArray(children) && children.length > 0;

        const normalizedRow: NormalizedTreeRow = {
            ...item,
            treeLevel: level,
            treeKey,
            treeParentKey: parentKey !== undefined ? parentKey : null,
            isTreeParent: hasChildren,
            isTreeExpanded: true,
            index: outputIndex++
        };

        result.push(normalizedRow);
        flatTreeData.push(normalizedRow);
        treeKeyCollection[`${treeKey}`] = normalizedRow;

        if (isNullOrUndefined(normalizedRow.treeParentKey)) {
            parentTreeData.push(normalizedRow);
        }

        let childResults: NormalizedTreeRow[] = [];
        if (hasChildren) {
            childResults = normalizeChildrenFieldData(
                children,
                parentTreeData,
                flatTreeData,
                treeKeyCollection,
                childrenField,
                treeKey,
                level + 1
            );

            childResults.forEach((childRow: NormalizedTreeRow) => {
                childRow.index = outputIndex++;
            });
        }

        normalizedRow.childRecords = childResults;
    });

    return result;
}

/**
 * Mode 2: Normalize self-referential (parent ID) data.
 *
 * Builds a hierarchical structure from flat data using parent ID references.
 * First identifies root nodes (where parentId is null or undefined), then
 * recursively maps children. Produces flat array with identical metadata shape
 * to Mode 1 (treeLevel, treeKey, treeParentKey, isTreeParent, index).
 *
 * @template T - Data row type.
 * @param {T[]} data - Flat array of all data rows (with parent ID references).
 * @param {string} parentIdField - Field name containing parent ID reference.
 * @param {string} idField - Field name for unique ID.
 * @param {TreeGridRow[]} [parentTreeData] - Optional parent rows.
 * @param {TreeGridRow[]} [flatTreeData] - Optional flattened output rows.
 * @param {TreeGridRow[]} [treeKeyCollection] - Optional collection to store tree keys.
 * @returns {NormalizedTreeRow[]} Flat array with normalized tree metadata.
 */
export function normalizeParentIdData<T extends Record<string, unknown> = Record<string, unknown>>(
    data: T[],
    parentIdField: string,
    idField: string,
    parentTreeData?: TreeGridRow[],
    flatTreeData?: TreeGridRow[],
    treeKeyCollection?: { [key: string]: TreeGridRow }
): NormalizedTreeRow[] {

    const childrenMap: Map<string | number | null | undefined, T[]> = new Map<string | number | null | undefined, T[]>();

    data.forEach((item: T) => {
        const itemRecord: Record<string, unknown> = item as Record<string, unknown>;
        // eslint-disable-next-line security/detect-object-injection
        const parentId: unknown = itemRecord[parentIdField];
        const actualParentId: string | number | unknown = parentId === null || parentId === undefined ? '__root__' : parentId;
        const parentChildren: T[] | undefined = childrenMap.get(actualParentId as string | number);

        if (parentChildren) {
            parentChildren.push(item);
            return;
        }

        childrenMap.set(actualParentId as string | number, [item]);
    });

    const rootNodes: T[] = childrenMap.get('__root__') || [];

    const result: NormalizedTreeRow[] = [];
    let outputIndex: number = 0;

    const processNode: (
        node: T,
        treeKey: string,
        treeLevel: number,
        parentKey: string | null
    ) => NormalizedTreeRow[] | void = (
        node: T,
        treeKey: string,
        treeLevel: number,
        parentKey: string | null
    ): NormalizedTreeRow[] | void => {
        const nodeRecord: Record<string, unknown> = node as Record<string, unknown>;
        // eslint-disable-next-line security/detect-object-injection
        const nodeId: string | number | undefined = nodeRecord[idField] as string | number | undefined;
        const childrenOfNode: T[] = childrenMap.get(nodeId) || [];
        const hasChildren: boolean = childrenOfNode.length > 0;
        const localResult: NormalizedTreeRow[] = [];

        const normalizedRow: NormalizedTreeRow = {
            ...node,
            treeLevel,
            treeKey,
            treeParentKey: parentKey,
            isTreeParent: hasChildren,
            isTreeExpanded: true,
            index: outputIndex++,
            children: childrenOfNode
        };

        localResult.push(normalizedRow);
        flatTreeData.push(normalizedRow);
        treeKeyCollection[`${treeKey}`] = normalizedRow;

        if (parentTreeData && isNullOrUndefined(normalizedRow.treeParentKey)) {
            parentTreeData.push(normalizedRow);
        }

        const childRecord: NormalizedTreeRow[] = [];
        childrenOfNode.forEach((child: T, childIndex: number) => {
            const childTreeKey: string = `${treeKey}_${childIndex}`;
            const childData: NormalizedTreeRow[] = processNode(child, childTreeKey, treeLevel + 1, treeKey) as NormalizedTreeRow[];
            childRecord.push(...childData);
        });
        normalizedRow.childRecords = childRecord;
        return localResult;
    };

    rootNodes.forEach((rootNode: T, rootIndex: number) => {
        const rootTreeKey: string = `${rootIndex}`;
        processNode(rootNode, rootTreeKey, 0, null);
    });

    return result;
}

/**
 * Flatten tree by expansion state.
 *
 * Filters the normalized tree data based on expansion state, removing children
 * of collapsed parent nodes. Returns the final render-ready flat array.
 *
 * @template T - Normalized row type.
 * @param {T[]} normalizedData - Flat array of normalized rows.
 * @param {Set<string>} expandedKeys - Set of treeKeys currently expanded.
 * @returns {T[]} Render-ready flat array with only visible rows.
 */
export function flattenForRender<T extends NormalizedTreeRow = NormalizedTreeRow>(
    normalizedData: T[],
    expandedKeys: Set<string>
): T[] {
    if (!normalizedData || normalizedData.length === 0) {
        return [];
    }

    const result: T[] = [];

    normalizedData.forEach((row: T) => {
        if (row.treeLevel === 0) {
            result.push(row);
            return;
        }

        if (row.treeParentKey && expandedKeys.has(row.treeParentKey)) {
            result.push(row);
        }
    });

    return result;
}

/**
 * Validate tree data settings for mutual exclusivity.
 *
 * Ensures that only one tree data mode is active at a time.
 * Throws error if both nested and parent-ID modes are configured.
 *
 * @param {string} [childrenField] - Optional children field (Mode 1).
 * @param {string} [idMapping] - Optional ID field (Mode 2).
 * @param {string} [parentIdField] - Optional parent ID field (Mode 2).
 * @returns {void}
 * @throws {Error} If modes are mixed or incomplete.
 */
export function validateTreeDataModes(
    childrenField?: string,
    idMapping?: string,
    parentIdField?: string
): void {
    const hasMode1: boolean = !!childrenField;
    const hasMode2Part1: boolean = !!idMapping;
    const hasMode2Part2: boolean = !!parentIdField;

    if (hasMode1 && (hasMode2Part1 || hasMode2Part2)) {
        throw new Error(
            'Cannot mix tree data modes. Use either treeDataChildrenField (nested) OR treeDataIdMapping + treeDataParentIdField (parent ID), not both.'
        );
    }

    if ((hasMode2Part1 && !hasMode2Part2) || (!hasMode2Part1 && hasMode2Part2)) {
        throw new Error(
            'Mode 2 (parent ID) requires both treeDataIdMapping and treeDataParentIdField to be set.'
        );
    }
}

/**
 * Get all tree keys from normalized data.
 *
 * Extracts all unique treeKey values from a normalized data array.
 * Useful for initializing expansion state to all nodes expanded.
 *
 * @template T - Normalized row type.
 * @param {T[]} normalizedData - Flat array of normalized rows.
 * @returns {Set<string>} Set containing all treeKey values.
 */
export function getAllTreeKeys<T extends NormalizedTreeRow = NormalizedTreeRow>(
    normalizedData: T[]
): Set<string> {
    const keys: Set<string> = new Set<string>();

    normalizedData.forEach((row: T) => {
        keys.add(row.treeKey);
    });

    return keys;
}
