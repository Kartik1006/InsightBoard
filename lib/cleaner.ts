// ============================================================
// Data Cleaner — auto-clean pipeline + user-triggered actions
// ============================================================

import { DataSet, ColumnMeta, CleaningAction, CleaningResult } from './types';
import { mean as meanFn, median as medianFn, mode as modeFn, generateId } from './utils';

// ── Available Cleaning Actions ───────────────────────────────

export const CLEANING_ACTIONS: CleaningAction[] = [
    {
        id: 'remove_duplicates',
        label: 'Remove Duplicates',
        description: 'Remove rows that are exact duplicates',
        icon: 'CopyMinus',
        category: 'remove',
        isDestructive: true,
    },
    {
        id: 'drop_empty_rows',
        label: 'Drop Empty Rows',
        description: 'Remove rows where all values are empty',
        icon: 'Trash2',
        category: 'remove',
        isDestructive: true,
    },
    {
        id: 'fill_numeric_mean',
        label: 'Fill Numbers (Mean)',
        description: 'Replace missing numeric values with column mean',
        icon: 'Calculator',
        category: 'fill',
        isDestructive: false,
    },
    {
        id: 'fill_numeric_median',
        label: 'Fill Numbers (Median)',
        description: 'Replace missing numeric values with column median',
        icon: 'BarChart3',
        category: 'fill',
        isDestructive: false,
    },
    {
        id: 'fill_numeric_zero',
        label: 'Fill Numbers (Zero)',
        description: 'Replace missing numeric values with 0',
        icon: 'Hash',
        category: 'fill',
        isDestructive: false,
    },
    {
        id: 'fill_text_unknown',
        label: 'Fill Text ("Unknown")',
        description: 'Replace missing text values with "Unknown"',
        icon: 'Type',
        category: 'fill',
        isDestructive: false,
    },
    {
        id: 'fill_text_mode',
        label: 'Fill Text (Most Common)',
        description: 'Replace missing text values with the most common value',
        icon: 'TrendingUp',
        category: 'fill',
        isDestructive: false,
    },
    {
        id: 'drop_sparse_columns',
        label: 'Drop Sparse Columns',
        description: 'Remove columns with more than 50% missing data',
        icon: 'Columns',
        category: 'remove',
        isDestructive: true,
    },
    {
        id: 'trim_whitespace',
        label: 'Trim Whitespace',
        description: 'Remove leading/trailing whitespace from text values',
        icon: 'Scissors',
        category: 'transform',
        isDestructive: false,
    },
    {
        id: 'standardize_dates',
        label: 'Standardize Dates',
        description: 'Convert all date columns to ISO format (YYYY-MM-DD)',
        icon: 'Calendar',
        category: 'format',
        isDestructive: false,
    },
];

// ── Auto-Clean Pipeline (runs on upload) ─────────────────────

export function autoClean(dataset: DataSet): CleaningResult {
    let rows = [...dataset.rows];
    let totalAffected = 0;

    // 1. Trim whitespace
    rows = rows.map((row) => {
        const cleaned: Record<string, unknown> = {};
        for (const [key, val] of Object.entries(row)) {
            cleaned[key] = typeof val === 'string' ? val.trim() : val;
        }
        return cleaned;
    });

    // 2. Drop fully empty rows
    const beforeCount = rows.length;
    rows = rows.filter((row) => {
        return Object.values(row).some(
            (v) => v !== null && v !== undefined && v !== ''
        );
    });
    totalAffected += beforeCount - rows.length;

    // Rebuild column stats
    const columns = rebuildColumnStats(dataset.columns, rows);

    return {
        dataset: {
            ...dataset,
            rows,
            columns,
            rowCount: rows.length,
        },
        actionApplied: 'Auto-clean (trim whitespace, drop empty rows)',
        rowsAffected: totalAffected,
        columnsAffected: 0,
    };
}

// ── User-Triggered Actions ───────────────────────────────────

export function applyCleaningAction(
    dataset: DataSet,
    actionId: string
): CleaningResult {
    switch (actionId) {
        case 'remove_duplicates':
            return removeDuplicates(dataset);
        case 'drop_empty_rows':
            return dropEmptyRows(dataset);
        case 'fill_numeric_mean':
            return fillNumeric(dataset, 'mean');
        case 'fill_numeric_median':
            return fillNumeric(dataset, 'median');
        case 'fill_numeric_zero':
            return fillNumeric(dataset, 'zero');
        case 'fill_text_unknown':
            return fillText(dataset, 'unknown');
        case 'fill_text_mode':
            return fillText(dataset, 'mode');
        case 'drop_sparse_columns':
            return dropSparseColumns(dataset);
        case 'trim_whitespace':
            return trimWhitespace(dataset);
        case 'standardize_dates':
            return standardizeDates(dataset);
        default:
            return { dataset, actionApplied: 'Unknown action', rowsAffected: 0, columnsAffected: 0 };
    }
}

// ── Individual Actions ───────────────────────────────────────

function removeDuplicates(dataset: DataSet): CleaningResult {
    const seen = new Set<string>();
    const unique: Record<string, unknown>[] = [];
    for (const row of dataset.rows) {
        const key = JSON.stringify(row);
        if (!seen.has(key)) {
            seen.add(key);
            unique.push(row);
        }
    }
    const removed = dataset.rows.length - unique.length;
    const columns = rebuildColumnStats(dataset.columns, unique);
    return {
        dataset: { ...dataset, rows: unique, columns, rowCount: unique.length },
        actionApplied: 'Remove Duplicates',
        rowsAffected: removed,
        columnsAffected: 0,
    };
}

function dropEmptyRows(dataset: DataSet): CleaningResult {
    const before = dataset.rows.length;
    const rows = dataset.rows.filter((row) =>
        Object.values(row).some((v) => v !== null && v !== undefined && v !== '')
    );
    const columns = rebuildColumnStats(dataset.columns, rows);
    return {
        dataset: { ...dataset, rows, columns, rowCount: rows.length },
        actionApplied: 'Drop Empty Rows',
        rowsAffected: before - rows.length,
        columnsAffected: 0,
    };
}

function fillNumeric(
    dataset: DataSet,
    strategy: 'mean' | 'median' | 'zero'
): CleaningResult {
    const numCols = dataset.columns.filter((c) => c.type === 'number');
    let affected = 0;

    const rows = dataset.rows.map((row) => {
        const newRow = { ...row };
        for (const col of numCols) {
            if (newRow[col.name] === null || newRow[col.name] === undefined) {
                affected++;
                if (strategy === 'zero') {
                    newRow[col.name] = 0;
                } else if (strategy === 'mean') {
                    newRow[col.name] = col.mean ?? 0;
                } else {
                    newRow[col.name] = col.median ?? 0;
                }
            }
        }
        return newRow;
    });

    const columns = rebuildColumnStats(dataset.columns, rows);
    return {
        dataset: { ...dataset, rows, columns },
        actionApplied: `Fill Numeric (${strategy})`,
        rowsAffected: affected,
        columnsAffected: numCols.length,
    };
}

function fillText(
    dataset: DataSet,
    strategy: 'unknown' | 'mode'
): CleaningResult {
    const textCols = dataset.columns.filter((c) => c.type === 'string');
    let affected = 0;

    // Pre-compute modes
    const modes: Record<string, string> = {};
    if (strategy === 'mode') {
        for (const col of textCols) {
            const vals = dataset.rows
                .map((r) => r[col.name])
                .filter((v) => v !== null && v !== undefined && v !== '') as string[];
            modes[col.name] = (modeFn(vals) as string) || 'Unknown';
        }
    }

    const rows = dataset.rows.map((row) => {
        const newRow = { ...row };
        for (const col of textCols) {
            if (
                newRow[col.name] === null ||
                newRow[col.name] === undefined ||
                newRow[col.name] === ''
            ) {
                affected++;
                newRow[col.name] = strategy === 'mode' ? modes[col.name] : 'Unknown';
            }
        }
        return newRow;
    });

    const columns = rebuildColumnStats(dataset.columns, rows);
    return {
        dataset: { ...dataset, rows, columns },
        actionApplied: `Fill Text (${strategy})`,
        rowsAffected: affected,
        columnsAffected: textCols.length,
    };
}

function dropSparseColumns(dataset: DataSet): CleaningResult {
    const threshold = 0.5;
    const keepCols = dataset.columns.filter(
        (col) => col.nullCount / col.totalCount < threshold
    );
    const keepNames = new Set(keepCols.map((c) => c.name));
    const droppedCount = dataset.columns.length - keepCols.length;

    const rows = dataset.rows.map((row) => {
        const newRow: Record<string, unknown> = {};
        for (const key of Object.keys(row)) {
            if (keepNames.has(key)) newRow[key] = row[key];
        }
        return newRow;
    });

    return {
        dataset: {
            ...dataset,
            rows,
            columns: keepCols,
            columnCount: keepCols.length,
        },
        actionApplied: 'Drop Sparse Columns (>50% missing)',
        rowsAffected: 0,
        columnsAffected: droppedCount,
    };
}

function trimWhitespace(dataset: DataSet): CleaningResult {
    let affected = 0;
    const rows = dataset.rows.map((row) => {
        const newRow: Record<string, unknown> = {};
        for (const [key, val] of Object.entries(row)) {
            if (typeof val === 'string' && val !== val.trim()) {
                affected++;
                newRow[key] = val.trim();
            } else {
                newRow[key] = val;
            }
        }
        return newRow;
    });

    const columns = rebuildColumnStats(dataset.columns, rows);
    return {
        dataset: { ...dataset, rows, columns },
        actionApplied: 'Trim Whitespace',
        rowsAffected: affected,
        columnsAffected: 0,
    };
}

function standardizeDates(dataset: DataSet): CleaningResult {
    const dateCols = dataset.columns.filter((c) => c.type === 'date');
    let affected = 0;

    const rows = dataset.rows.map((row) => {
        const newRow = { ...row };
        for (const col of dateCols) {
            const val = newRow[col.name];
            if (val && typeof val === 'string') {
                const d = new Date(val);
                if (!isNaN(d.getTime())) {
                    const iso = d.toISOString().split('T')[0];
                    if (iso !== val) affected++;
                    newRow[col.name] = iso;
                }
            }
        }
        return newRow;
    });

    const columns = rebuildColumnStats(dataset.columns, rows);
    return {
        dataset: { ...dataset, rows, columns },
        actionApplied: 'Standardize Dates',
        rowsAffected: affected,
        columnsAffected: dateCols.length,
    };
}

// ── Helpers ──────────────────────────────────────────────────

function rebuildColumnStats(
    existingCols: ColumnMeta[],
    rows: Record<string, unknown>[]
): ColumnMeta[] {
    return existingCols.map((col) => {
        const values = rows.map((r) => r[col.name]);
        const nonNull = values.filter((v) => v !== null && v !== undefined && v !== '');
        const uniqueValues = new Set(nonNull.map(String));

        const updated: ColumnMeta = {
            ...col,
            nullCount: values.length - nonNull.length,
            totalCount: values.length,
            uniqueCount: uniqueValues.size,
            sampleValues: nonNull.slice(0, 5) as (string | number | boolean | null)[],
        };

        if (col.type === 'number') {
            const nums = nonNull
                .map((v) => Number(v))
                .filter((n) => !isNaN(n));
            if (nums.length > 0) {
                updated.min = Math.min(...nums);
                updated.max = Math.max(...nums);
                updated.mean = meanFn(nums);
                updated.median = medianFn(nums);
            }
        }

        return updated;
    });
}
